from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from models import User, Employee, Shift, EmployeeShift, DepartmentShift, Attendance
from core.security import get_current_user, require_roles, get_client_ip
from services import log_audit
from services.shift_service import (
    seed_default_shifts,
    get_effective_shift_for_employee,
)

router = APIRouter(prefix="/api/shifts", tags=["Shifts & Scheduling"])

class ShiftCreateRequest(BaseModel):
    name: str
    code: str
    startTime: str  # "09:00"
    endTime: str    # "18:00"
    gracePeriodMinutes: Optional[int] = 15
    earlyExitThresholdMinutes: Optional[int] = 15
    fullDayHours: Optional[float] = 8.0
    halfDayHours: Optional[float] = 4.0
    description: Optional[str] = None
    isDefault: Optional[bool] = False

class ShiftUpdateRequest(BaseModel):
    name: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    gracePeriodMinutes: Optional[int] = None
    earlyExitThresholdMinutes: Optional[int] = None
    fullDayHours: Optional[float] = None
    halfDayHours: Optional[float] = None
    description: Optional[str] = None
    isDefault: Optional[bool] = None
    isActive: Optional[bool] = None

class EmployeeShiftAssignRequest(BaseModel):
    employeeId: str
    shiftId: str
    startDate: str  # YYYY-MM-DD
    endDate: Optional[str] = None
    notes: Optional[str] = None

class DepartmentShiftAssignRequest(BaseModel):
    department: str
    shiftId: str

class ShiftAttendanceOverrideRequest(BaseModel):
    attendanceId: str
    shiftId: Optional[str] = None
    isLate: Optional[bool] = None
    lateMinutes: Optional[int] = None
    isEarlyExit: Optional[bool] = None
    earlyExitMinutes: Optional[int] = None
    overtimeHours: Optional[float] = None
    overrideReason: str

def serialize_shift(s: Shift, staff_count: int = 0):
    return {
        "id": s.id,
        "name": s.name,
        "code": s.code,
        "startTime": s.startTime,
        "endTime": s.endTime,
        "gracePeriodMinutes": s.gracePeriodMinutes,
        "earlyExitThresholdMinutes": s.earlyExitThresholdMinutes,
        "fullDayHours": s.fullDayHours,
        "halfDayHours": s.halfDayHours,
        "description": s.description,
        "isDefault": s.isDefault,
        "isActive": s.isActive,
        "staffCount": staff_count,
        "createdAt": s.createdAt.isoformat() if s.createdAt else None,
        "updatedAt": s.updatedAt.isoformat() if s.updatedAt else None,
    }

@router.get("")
def list_shifts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seed_default_shifts(db)
    shifts = db.query(Shift).all()

    # Pre-count assignments
    res = []
    for s in shifts:
        direct_count = db.query(EmployeeShift).filter(
            EmployeeShift.shiftId == s.id,
            EmployeeShift.isActive == True
        ).count()
        res.append(serialize_shift(s, direct_count))

    dept_assignments = db.query(DepartmentShift).all()
    dept_map = [
        {
            "id": d.id,
            "department": d.department,
            "shiftId": d.shiftId,
            "shiftName": d.shift.name if d.shift else "Unknown",
            "updatedAt": d.updatedAt.isoformat() if d.updatedAt else None
        } for d in dept_assignments
    ]

    return {
        "success": True,
        "data": res,
        "departmentAssignments": dept_map
    }

@router.get("/my")
def get_my_shift(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User has no associated employee profile")

    shift = get_effective_shift_for_employee(db, current_user.employee)
    return {
        "success": True,
        "data": serialize_shift(shift)
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_shift(
    payload: ShiftCreateRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    existing = db.query(Shift).filter(Shift.code == payload.code.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Shift code '{payload.code}' already exists")

    if payload.isDefault:
        # Clear default flag on existing
        db.query(Shift).update({"isDefault": False})

    shift = Shift(
        name=payload.name,
        code=payload.code.upper().strip(),
        startTime=payload.startTime,
        endTime=payload.endTime,
        gracePeriodMinutes=payload.gracePeriodMinutes or 15,
        earlyExitThresholdMinutes=payload.earlyExitThresholdMinutes or 15,
        fullDayHours=payload.fullDayHours or 8.0,
        halfDayHours=payload.halfDayHours or 4.0,
        description=payload.description,
        isDefault=bool(payload.isDefault),
        isActive=True
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="SHIFT_CREATED",
        target_entity="Shift",
        target_id=shift.id,
        details=f"Created shift '{shift.name}' ({shift.startTime} - {shift.endTime})",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Shift '{shift.name}' created successfully",
        "data": serialize_shift(shift)
    }

@router.put("/{id}")
def update_shift(
    id: str,
    payload: ShiftUpdateRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    shift = db.query(Shift).filter(Shift.id == id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    if payload.isDefault:
        db.query(Shift).filter(Shift.id != id).update({"isDefault": False})
        shift.isDefault = True

    if payload.name is not None:
        shift.name = payload.name
    if payload.startTime is not None:
        shift.startTime = payload.startTime
    if payload.endTime is not None:
        shift.endTime = payload.endTime
    if payload.gracePeriodMinutes is not None:
        shift.gracePeriodMinutes = payload.gracePeriodMinutes
    if payload.earlyExitThresholdMinutes is not None:
        shift.earlyExitThresholdMinutes = payload.earlyExitThresholdMinutes
    if payload.fullDayHours is not None:
        shift.fullDayHours = payload.fullDayHours
    if payload.halfDayHours is not None:
        shift.halfDayHours = payload.halfDayHours
    if payload.description is not None:
        shift.description = payload.description
    if payload.isActive is not None:
        shift.isActive = payload.isActive

    shift.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(shift)

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="SHIFT_UPDATED",
        target_entity="Shift",
        target_id=shift.id,
        details=f"Updated shift '{shift.name}'",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": "Shift updated successfully",
        "data": serialize_shift(shift)
    }

@router.delete("/{id}")
def delete_shift(
    id: str,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db)
):
    shift = db.query(Shift).filter(Shift.id == id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    if shift.isDefault:
        raise HTTPException(status_code=400, detail="Cannot delete default shift. Reassign default first.")

    s_name = shift.name
    shift.isActive = False
    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="SHIFT_DEACTIVATED",
        target_entity="Shift",
        target_id=id,
        details=f"Deactivated shift '{s_name}'",
        ip_address=get_client_ip(request)
    )

    return {"success": True, "message": f"Shift '{s_name}' deactivated successfully"}

@router.post("/assign-employee")
def assign_employee_shift(
    payload: EmployeeShiftAssignRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == payload.employeeId).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    shift = db.query(Shift).filter(Shift.id == payload.shiftId, Shift.isActive == True).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found or inactive")

    # Deactivate current active shift
    db.query(EmployeeShift).filter(
        EmployeeShift.employeeId == payload.employeeId,
        EmployeeShift.isActive == True
    ).update({"isActive": False, "endDate": payload.startDate})

    assignment = EmployeeShift(
        employeeId=payload.employeeId,
        shiftId=payload.shiftId,
        startDate=payload.startDate,
        endDate=payload.endDate,
        assignedBy=current_user.email,
        notes=payload.notes,
        isActive=True
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # In-app notification to employee
    if employee.userId:
        from services.notification_service import create_user_notification
        create_user_notification(
            db=db,
            user_id=employee.userId,
            title="Work Shift Assigned",
            message=f"You have been assigned to '{shift.name}' ({shift.startTime} - {shift.endTime}) effective {payload.startDate}.",
            type="SHIFT"
        )

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="SHIFT_ASSIGNED_EMPLOYEE",
        target_entity="EmployeeShift",
        target_id=assignment.id,
        details=f"Assigned shift '{shift.name}' to {employee.firstName} {employee.lastName} ({employee.employeeCode})",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Assigned '{shift.name}' to {employee.firstName} {employee.lastName}",
        "data": {
            "id": assignment.id,
            "employeeId": employee.id,
            "employeeName": f"{employee.firstName} {employee.lastName}",
            "shiftId": shift.id,
            "shiftName": shift.name,
            "startDate": assignment.startDate,
            "endDate": assignment.endDate
        }
    }

@router.post("/assign-department")
def assign_department_shift(
    payload: DepartmentShiftAssignRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    shift = db.query(Shift).filter(Shift.id == payload.shiftId, Shift.isActive == True).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found or inactive")

    dept_shift = db.query(DepartmentShift).filter(DepartmentShift.department == payload.department).first()
    if dept_shift:
        dept_shift.shiftId = payload.shiftId
        dept_shift.assignedBy = current_user.email
        dept_shift.updatedAt = datetime.utcnow()
    else:
        dept_shift = DepartmentShift(
            department=payload.department,
            shiftId=payload.shiftId,
            assignedBy=current_user.email
        )
        db.add(dept_shift)

    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="SHIFT_ASSIGNED_DEPARTMENT",
        target_entity="DepartmentShift",
        details=f"Assigned default shift '{shift.name}' to department '{payload.department}'",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Department '{payload.department}' default shift set to '{shift.name}'",
        "data": {
            "department": payload.department,
            "shiftId": shift.id,
            "shiftName": shift.name
        }
    }

@router.get("/employee/{employeeId}/history")
def get_employee_shift_history(
    employeeId: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(EmployeeShift).filter(
        EmployeeShift.employeeId == employeeId
    ).order_by(EmployeeShift.createdAt.desc()).all()

    return {
        "success": True,
        "count": len(history),
        "data": [
            {
                "id": h.id,
                "shiftId": h.shiftId,
                "shiftName": h.shift.name if h.shift else "Unknown",
                "shiftCode": h.shift.code if h.shift else "N/A",
                "timings": f"{h.shift.startTime} - {h.shift.endTime}" if h.shift else "N/A",
                "startDate": h.startDate,
                "endDate": h.endDate or "Ongoing",
                "assignedBy": h.assignedBy,
                "notes": h.notes,
                "isActive": h.isActive,
                "createdAt": h.createdAt.isoformat() if h.createdAt else None
            } for h in history
        ]
    }

@router.get("/attendance-report")
def get_shift_attendance_report(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    shiftId: Optional[str] = None,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    seed_default_shifts(db)
    now = datetime.utcnow()
    start = startDate or f"{now.year}-{str(now.month).zfill(2)}-01"
    end = endDate or now.strftime("%Y-%m-%d")

    shifts = db.query(Shift).filter(Shift.isActive == True).all()
    if shiftId:
        shifts = [s for s in shifts if s.id == shiftId]

    report = []
    for s in shifts:
        # Get attendance rows associated with this shift (either directly or via employee's assigned shift)
        atts = db.query(Attendance).filter(
            Attendance.shiftId == s.id,
            Attendance.date >= start,
            Attendance.date <= end
        ).all()

        total_punches = len(atts)
        present = len([a for a in atts if a.status == "PRESENT"])
        late = len([a for a in atts if a.isLate])
        early = len([a for a in atts if a.isEarlyExit])
        overtime_hours = round(sum(a.overtimeHours for a in atts), 2)
        total_hours = round(sum(a.workingHours for a in atts), 2)

        staff_assigned = db.query(EmployeeShift).filter(
            EmployeeShift.shiftId == s.id,
            EmployeeShift.isActive == True
        ).count()

        report.append({
            "shiftId": s.id,
            "shiftName": s.name,
            "shiftCode": s.code,
            "timings": f"{s.startTime} - {s.endTime}",
            "staffAssigned": staff_assigned,
            "totalPunches": total_punches,
            "presentCount": present,
            "lateCheckins": late,
            "earlyCheckouts": early,
            "totalOvertimeHours": overtime_hours,
            "totalWorkingHours": total_hours,
            "onTimeRate": round((((present - late) / present) * 100) if present > 0 else 100.0, 1)
        })

    return {
        "success": True,
        "dateRange": {"startDate": start, "endDate": end},
        "data": report
    }

@router.post("/override-attendance")
def override_shift_attendance(
    payload: ShiftAttendanceOverrideRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    att = db.query(Attendance).filter(Attendance.id == payload.attendanceId).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found")

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
    att.overrideReason = payload.overrideReason
    att.overriddenBy = current_user.email
    att.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(att)

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="SHIFT_ATTENDANCE_OVERRIDE",
        target_entity="Attendance",
        target_id=att.id,
        details=f"Overrode shift metrics for attendance on {att.date}: {payload.overrideReason}",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": "Shift attendance metrics updated with administrative override",
        "data": {
            "id": att.id,
            "date": att.date,
            "isLate": att.isLate,
            "lateMinutes": att.lateMinutes,
            "isEarlyExit": att.isEarlyExit,
            "earlyExitMinutes": att.earlyExitMinutes,
            "overtimeHours": att.overtimeHours,
            "isOverride": att.isOverride
        }
    }
