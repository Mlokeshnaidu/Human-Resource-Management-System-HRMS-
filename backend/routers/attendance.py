from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Employee, Attendance
from backend.auth_utils import get_current_user, require_roles, get_client_ip
from backend.services.audit_service import log_audit

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
        } if hasattr(att, 'employee') and att.employee else None
    }

@router.post("/check-in")
def check_in(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="No employee profile associated with this account")

    emp_id = current_user.employee.id
    today = get_today_str()

    existing = db.query(Attendance).filter(
        Attendance.employeeId == emp_id,
        Attendance.date == today
    ).first()

    if existing and existing.checkIn:
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate check-in prevented. You already checked in today at {existing.checkIn.strftime('%H:%M:%S')}"
        )

    now = datetime.utcnow()
    if existing:
        existing.checkIn = now
        existing.status = "PRESENT"
        att = existing
    else:
        att = Attendance(
            employeeId=emp_id,
            date=today,
            checkIn=now,
            status="PRESENT"
        )
        db.add(att)

    db.commit()
    db.refresh(att)

    return {
        "success": True,
        "message": "Check-in successful! Have a productive day.",
        "data": serialize_attendance(att)
    }

@router.post("/check-out")
def check_out(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="No employee profile associated with this account")

    emp_id = current_user.employee.id
    today = get_today_str()

    att = db.query(Attendance).filter(
        Attendance.employeeId == emp_id,
        Attendance.date == today
    ).first()

    if not att or not att.checkIn:
        raise HTTPException(status_code=400, detail="You have not checked in today yet. Please check in first.")

    now = datetime.utcnow()
    att.checkOut = now

    # Calculate hours
    diff_hours = (now - att.checkIn).total_seconds() / 3600.0
    att.workingHours = round(max(0.0, diff_hours), 2)

    # Classify shift: HALF_DAY if < 4 hours, else PRESENT
    att.status = "HALF_DAY" if att.workingHours < 4.0 else "PRESENT"
    att.updatedAt = now

    db.commit()
    db.refresh(att)

    return {
        "success": True,
        "message": f"Check-out recorded. Total working hours: {att.workingHours} hrs ({att.status})",
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

    return {
        "success": True,
        "data": serialize_attendance(att) if att else None
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

    if department and department != "ALL":
        query = query.join(Employee).filter(Employee.department == department)

    records = query.order_by(Attendance.date.desc()).all()

    return {
        "success": True,
        "count": len(records),
        "data": [serialize_attendance(r) for r in records]
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
