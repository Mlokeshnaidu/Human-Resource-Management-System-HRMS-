import calendar
from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from models import User, Employee, Attendance, Holiday, LeaveRequest
from core.security import get_current_user, require_roles, get_client_ip
from services import log_audit
from services.shift_service import (
    get_effective_shift_for_employee,
    evaluate_checkin_timing,
    evaluate_checkout_timing,
)
from services.holiday_service import (
    get_month_workday_summary,
    get_holidays_for_month,
)
from services.notification_service import create_user_notification

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

def get_today_str() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")

class AttendanceOverride(BaseModel):
    employeeId: str
    date: str
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None
    workingHours: Optional[float] = None
    status: str
    shiftId: Optional[str] = None
    isLate: Optional[bool] = None
    lateMinutes: Optional[int] = None
    isEarlyExit: Optional[bool] = None
    earlyExitMinutes: Optional[int] = None
    overtimeHours: Optional[float] = None
    overrideReason: Optional[str] = "Administrative correction"
    notes: Optional[str] = None

def serialize_attendance(att: Attendance):
    return {
        "id": att.id,
        "employeeId": att.employeeId,
        "date": att.date,
        "checkIn": att.checkIn.isoformat() if att.checkIn else None,
        "checkOut": att.checkOut.isoformat() if att.checkOut else None,
        "workingHours": att.workingHours,
        "status": att.status,
        "shiftId": att.shiftId,
        "shift": {
            "id": att.shift.id,
            "name": att.shift.name,
            "code": att.shift.code,
            "startTime": att.shift.startTime,
            "endTime": att.shift.endTime,
        } if getattr(att, "shift", None) else None,
        "isLate": getattr(att, "isLate", False),
        "lateMinutes": getattr(att, "lateMinutes", 0),
        "isEarlyExit": getattr(att, "isEarlyExit", False),
        "earlyExitMinutes": getattr(att, "earlyExitMinutes", 0),
        "overtimeHours": getattr(att, "overtimeHours", 0.0),
        "isOverride": att.isOverride,
        "overrideReason": att.overrideReason,
        "overriddenBy": att.overriddenBy,
        "notes": att.notes,
        "createdAt": att.createdAt.isoformat() if att.createdAt else None,
        "employee": {
            "id": att.employee.id,
            "employeeCode": att.employee.employeeCode,
            "firstName": att.employee.firstName,
            "lastName": att.employee.lastName,
            "department": att.employee.department,
            "designation": att.employee.designation
        } if getattr(att, "employee", None) else None
    }

@router.post("/check-in")
def check_in(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="No employee profile associated with this account")

    emp = current_user.employee
    today = get_today_str()

    existing = db.query(Attendance).filter(
        Attendance.employeeId == emp.id,
        Attendance.date == today
    ).first()

    if existing and existing.checkIn:
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate check-in prevented. You already checked in today at {existing.checkIn.strftime('%H:%M:%S')}"
        )

    now = datetime.utcnow()
    shift = get_effective_shift_for_employee(db, emp, today)
    is_late, late_mins = evaluate_checkin_timing(shift, now)

    if existing:
        existing.checkIn = now
        existing.status = "PRESENT"
        existing.shiftId = shift.id
        existing.isLate = is_late
        existing.lateMinutes = late_mins
        att = existing
    else:
        att = Attendance(
            employeeId=emp.id,
            date=today,
            checkIn=now,
            status="PRESENT",
            shiftId=shift.id,
            isLate=is_late,
            lateMinutes=late_mins
        )
        db.add(att)

    db.commit()
    db.refresh(att)

    # In-app alert if late
    if is_late and late_mins > 0:
        create_user_notification(
            db=db,
            user_id=current_user.id,
            title="Attendance Alert: Late Check-In",
            message=f"You clocked in at {now.strftime('%H:%M')}, which is {late_mins} minutes past your {shift.name} start time ({shift.startTime}).",
            type="ATTENDANCE"
        )

    return {
        "success": True,
        "message": f"Check-in recorded successfully for {shift.name}! {'(Late by ' + str(late_mins) + ' mins)' if is_late else '(On time)'}",
        "data": serialize_attendance(att)
    }

@router.post("/check-out")
def check_out(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="No employee profile associated with this account")

    emp = current_user.employee
    today = get_today_str()

    att = db.query(Attendance).filter(
        Attendance.employeeId == emp.id,
        Attendance.date == today
    ).first()

    if not att or not att.checkIn:
        raise HTTPException(status_code=400, detail="You have not checked in today yet. Please check in first.")

    now = datetime.utcnow()
    shift = att.shift or get_effective_shift_for_employee(db, emp, today)

    is_early, early_mins, working_hours, overtime_hours = evaluate_checkout_timing(shift, att.checkIn, now)

    att.checkOut = now
    att.workingHours = working_hours
    att.isEarlyExit = is_early
    att.earlyExitMinutes = early_mins
    att.overtimeHours = overtime_hours
    att.status = "PRESENT" if working_hours >= shift.halfDayHours else "HALF_DAY"
    att.updatedAt = now

    db.commit()
    db.refresh(att)

    # In-app alert if overtime or early exit
    if overtime_hours > 0:
        create_user_notification(
            db=db,
            user_id=current_user.id,
            title="Overtime Logged",
            message=f"You logged {overtime_hours} overtime hours today on {shift.name}. Great job!",
            type="ATTENDANCE"
        )
    elif is_early and early_mins > 0:
        create_user_notification(
            db=db,
            user_id=current_user.id,
            title="Early Exit Logged",
            message=f"You clocked out at {now.strftime('%H:%M')}, {early_mins} minutes before your scheduled shift end ({shift.endTime}).",
            type="ATTENDANCE"
        )

    return {
        "success": True,
        "message": f"Check-out recorded. Working hours: {att.workingHours}h ({att.status}){', Overtime: ' + str(overtime_hours) + 'h' if overtime_hours > 0 else ''}",
        "data": serialize_attendance(att)
    }

@router.get("/today")
def get_today_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.employee:
        return {"success": True, "data": None}

    today = get_today_str()
    att = db.query(Attendance).filter(
        Attendance.employeeId == current_user.employee.id,
        Attendance.date == today
    ).first()

    shift = get_effective_shift_for_employee(db, current_user.employee, today)

    return {
        "success": True,
        "data": serialize_attendance(att) if att else None,
        "assignedShift": {
            "id": shift.id,
            "name": shift.name,
            "code": shift.code,
            "startTime": shift.startTime,
            "endTime": shift.endTime,
            "gracePeriodMinutes": shift.gracePeriodMinutes,
            "fullDayHours": shift.fullDayHours
        }
    }

@router.get("/my")
def get_my_attendance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.employee:
        return {"success": True, "data": []}

    records = db.query(Attendance).filter(
        Attendance.employeeId == current_user.employee.id
    ).order_by(Attendance.date.desc()).all()

    return {
        "success": True,
        "count": len(records),
        "data": [serialize_attendance(r) for r in records]
    }

@router.get("")
def get_all_attendance(
    date: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    department: Optional[str] = None,
    employeeId: Optional[str] = None,
    shiftId: Optional[str] = None,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    query = db.query(Attendance)

    if date:
        query = query.filter(Attendance.date == date)
    elif month and year:
        prefix = f"{year}-{str(month).zfill(2)}"
        query = query.filter(Attendance.date.startswith(prefix))

    if employeeId:
        query = query.filter(Attendance.employeeId == employeeId)

    if shiftId:
        query = query.filter(Attendance.shiftId == shiftId)

    if department and department != "ALL":
        query = query.join(Employee).filter(Employee.department == department)

    records = query.order_by(Attendance.date.desc()).all()

    return {
        "success": True,
        "count": len(records),
        "data": [serialize_attendance(r) for r in records]
    }

@router.get("/monthly-summary")
def get_monthly_attendance_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    employeeId: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    target_month = month or now.month
    target_year = year or now.year

    target_emp_id = employeeId
    if not target_emp_id and current_user.employee:
        target_emp_id = current_user.employee.id

    if not target_emp_id:
        raise HTTPException(status_code=400, detail="Employee ID required")

    emp = db.query(Employee).filter(Employee.id == target_emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    date_prefix = f"{target_year}-{str(target_month).zfill(2)}"
    workday_info = get_month_workday_summary(db, target_year, target_month)

    atts = db.query(Attendance).filter(
        Attendance.employeeId == target_emp_id,
        Attendance.date.startswith(date_prefix)
    ).all()

    present_count = len([a for a in atts if a.status == "PRESENT"])
    half_day_count = len([a for a in atts if a.status == "HALF_DAY"])
    late_count = len([a for a in atts if a.isLate])
    early_exit_count = len([a for a in atts if a.isEarlyExit])
    total_ot_hours = round(sum(a.overtimeHours for a in atts), 2)
    total_work_hours = round(sum(a.workingHours for a in atts), 2)

    approved_leaves = db.query(LeaveRequest).filter(
        LeaveRequest.employeeId == target_emp_id,
        LeaveRequest.status == "APPROVED",
        LeaveRequest.startDate.startswith(date_prefix)
    ).all()

    paid_leaves = sum(l.totalDays for l in approved_leaves if not l.isLossOfPay and l.leaveType != "LOP")
    lop_days = sum(l.totalDays for l in approved_leaves if l.isLossOfPay or l.leaveType == "LOP")

    return {
        "success": True,
        "employee": {
            "id": emp.id,
            "name": f"{emp.firstName} {emp.lastName}",
            "code": emp.employeeCode,
            "department": emp.department
        },
        "period": {"month": target_month, "year": target_year},
        "calendar": {
            "totalDays": workday_info["totalDays"],
            "weekendDays": workday_info["weekendDays"],
            "holidays": workday_info["holidayDays"],
            "standardWorkingDays": workday_info["standardWorkingDays"]
        },
        "metrics": {
            "presentDays": present_count,
            "halfDays": half_day_count,
            "effectivePresent": float(present_count + half_day_count * 0.5),
            "paidLeaves": paid_leaves,
            "lopDays": lop_days,
            "lateCheckins": late_count,
            "earlyCheckouts": early_exit_count,
            "overtimeHours": total_ot_hours,
            "totalWorkingHours": total_work_hours
        }
    }

@router.post("/override")
def override_attendance(
    payload: AttendanceOverride,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    att = db.query(Attendance).filter(
        Attendance.employeeId == payload.employeeId,
        Attendance.date == payload.date
    ).first()

    cin = datetime.fromisoformat(payload.checkIn) if payload.checkIn else None
    cout = datetime.fromisoformat(payload.checkOut) if payload.checkOut else None

    hours = payload.workingHours
    if hours is None and cin and cout:
        hours = round((cout - cin).total_seconds() / 3600.0, 2)
    elif hours is None:
        hours = 8.0 if payload.status == "PRESENT" else 0.0

    if att:
        att.checkIn = cin or att.checkIn
        att.checkOut = cout or att.checkOut
        att.workingHours = hours
        att.status = payload.status
        if payload.shiftId:
            att.shiftId = payload.shiftId
        if payload.isLate is not None:
            att.isLate = payload.isLate
        if payload.lateMinutes is not None:
            att.lateMinutes = payload.lateMinutes
        if payload.isEarlyExit is not None:
            att.isEarlyExit = payload.isEarlyExit
        if payload.earlyExitMinutes is not None:
            att.earlyExitMinutes = payload.earlyExitMinutes
        if payload.overtimeHours is not None:
            att.overtimeHours = payload.overtimeHours
        att.isOverride = True
        att.overrideReason = payload.overrideReason or "Administrative correction"
        att.overriddenBy = current_user.email
        att.notes = payload.notes
        att.updatedAt = datetime.utcnow()
    else:
        att = Attendance(
            employeeId=payload.employeeId,
            date=payload.date,
            checkIn=cin,
            checkOut=cout,
            workingHours=hours,
            status=payload.status,
            shiftId=payload.shiftId,
            isLate=payload.isLate or False,
            lateMinutes=payload.lateMinutes or 0,
            isEarlyExit=payload.isEarlyExit or False,
            earlyExitMinutes=payload.earlyExitMinutes or 0,
            overtimeHours=payload.overtimeHours or 0.0,
            isOverride=True,
            overrideReason=payload.overrideReason or "Administrative correction",
            overriddenBy=current_user.email,
            notes=payload.notes
        )
        db.add(att)

    db.commit()
    db.refresh(att)

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="ATTENDANCE_OVERRIDE",
        target_entity="Attendance",
        target_id=att.id,
        details=f"Overrode attendance for employee {payload.employeeId} on {payload.date} -> {payload.status} ({hours} hrs). Reason: {payload.overrideReason}",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": "Attendance record successfully overridden",
        "data": serialize_attendance(att)
    }
