from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from models import User, Employee, LeaveBalance, LeaveRequest
from core.security import get_current_user, require_roles, get_client_ip
from services import log_audit, send_notification_email

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])

class LeaveApplyRequest(BaseModel):
    leaveType: str
    startDate: str
    endDate: str
    reason: str

class LeaveReviewRequest(BaseModel):
    status: str  # APPROVED, REJECTED
    rejectionReason: Optional[str] = None

def calculate_days(start_str: str, end_str: str) -> float:
    try:
        s = datetime.fromisoformat(start_str)
        e = datetime.fromisoformat(end_str)
        diff = (e - s).days + 1
        return float(max(1, diff))
    except Exception:
        return 1.0

def serialize_leave(leave: LeaveRequest):
    return {
        "id": leave.id,
        "employeeId": leave.employeeId,
        "leaveType": leave.leaveType,
        "startDate": leave.startDate,
        "endDate": leave.endDate,
        "totalDays": leave.totalDays,
        "reason": leave.reason,
        "status": leave.status,
        "reviewedBy": leave.reviewedBy,
        "reviewedAt": leave.reviewedAt.isoformat() if leave.reviewedAt else None,
        "rejectionReason": leave.rejectionReason,
        "isLossOfPay": leave.isLossOfPay,
        "createdAt": leave.createdAt.isoformat() if leave.createdAt else None,
        "employee": {
            "id": leave.employee.id,
            "employeeCode": leave.employee.employeeCode,
            "firstName": leave.employee.firstName,
            "lastName": leave.employee.lastName,
            "department": leave.employee.department,
            "designation": leave.employee.designation
        } if hasattr(leave, 'employee') and leave.employee else None
    }

@router.get("/balances")
def get_leave_balances(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.employee:
        return {"success": True, "data": []}

    curr_year = datetime.utcnow().year
    balances = db.query(LeaveBalance).filter(
        LeaveBalance.employeeId == current_user.employee.id,
        LeaveBalance.year == curr_year
    ).all()

    return {
        "success": True,
        "year": curr_year,
        "data": [
            {
                "id": b.id,
                "year": b.year,
                "leaveType": b.leaveType,
                "totalDays": b.totalDays,
                "usedDays": b.usedDays,
                "remainingDays": b.remainingDays
            } for b in balances
        ]
    }

@router.post("/apply", status_code=201)
def apply_leave(
    payload: LeaveApplyRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="No associated employee profile")

    emp = current_user.employee
    total_days = calculate_days(payload.startDate, payload.endDate)
    curr_year = datetime.fromisoformat(payload.startDate).year
    is_lop = (payload.leaveType == "LOP")

    # If paid leave, check remaining quota
    if not is_lop:
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employeeId == emp.id,
            LeaveBalance.year == curr_year,
            LeaveBalance.leaveType == payload.leaveType
        ).first()

        remaining = balance.remainingDays if balance else 0.0
        if not balance or remaining < total_days:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient {payload.leaveType} balance. Remaining: {int(remaining)} days, Requested: {int(total_days)} days. Consider applying as Loss of Pay (LOP)."
            )

    leave_req = LeaveRequest(
        employeeId=emp.id,
        leaveType=payload.leaveType,
        startDate=payload.startDate,
        endDate=payload.endDate,
        totalDays=total_days,
        reason=payload.reason,
        status="PENDING",
        isLossOfPay=is_lop
    )
    db.add(leave_req)
    db.commit()
    db.refresh(leave_req)

    # Email notification to HR
    send_notification_email(
        db=db,
        to="hr-admin@techflow.io",
        email_type="LEAVE_APPLIED",
        data={
            "name": f"{emp.firstName} {emp.lastName}",
            "employeeCode": emp.employeeCode,
            "leaveType": payload.leaveType,
            "startDate": payload.startDate,
            "endDate": payload.endDate,
            "totalDays": total_days,
            "reason": payload.reason
        }
    )

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="LEAVE_APPLIED",
        target_entity="LeaveRequest",
        target_id=leave_req.id,
        details=f"{emp.employeeCode} applied for {total_days}d of {payload.leaveType} ({payload.startDate} to {payload.endDate})",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": "Leave application submitted successfully",
        "data": serialize_leave(leave_req)
    }

@router.get("/my")
def get_my_leaves(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.employee:
        return {"success": True, "data": []}

    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.employeeId == current_user.employee.id
    ).order_by(LeaveRequest.createdAt.desc()).all()

    return {
        "success": True,
        "count": len(leaves),
        "data": [serialize_leave(l) for l in leaves]
    }

@router.get("")
def get_all_leaves(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    query = db.query(LeaveRequest)
    if status_filter and status_filter != "ALL":
        query = query.filter(LeaveRequest.status == status_filter)

    leaves = query.order_by(LeaveRequest.createdAt.desc()).all()
    return {
        "success": True,
        "count": len(leaves),
        "data": [serialize_leave(l) for l in leaves]
    }

@router.patch("/{id}/review")
def review_leave(
    id: str,
    payload: LeaveReviewRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if leave.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Leave request is already {leave.status.lower()}")

    if payload.status == "APPROVED" and not leave.isLossOfPay:
        curr_year = datetime.fromisoformat(leave.startDate).year
        bal = db.query(LeaveBalance).filter(
            LeaveBalance.employeeId == leave.employeeId,
            LeaveBalance.year == curr_year,
            LeaveBalance.leaveType == leave.leaveType
        ).first()

        if bal:
            bal.usedDays += leave.totalDays
            bal.remainingDays = max(0.0, bal.totalDays - bal.usedDays)
            bal.updatedAt = datetime.utcnow()

    leave.status = payload.status
    leave.reviewedBy = current_user.email
    leave.reviewedAt = datetime.utcnow()
    leave.rejectionReason = payload.rejectionReason if payload.status == "REJECTED" else None
    leave.updatedAt = datetime.utcnow()

    db.commit()
    db.refresh(leave)

    if leave.employee and leave.employee.user:
        send_notification_email(
            db=db,
            to=leave.employee.user.email,
            email_type="LEAVE_STATUS_UPDATE",
            user_id=leave.employee.user.id,
            data={
                "name": f"{leave.employee.firstName} {leave.employee.lastName}",
                "status": payload.status,
                "leaveType": leave.leaveType,
                "startDate": leave.startDate,
                "endDate": leave.endDate,
                "totalDays": leave.totalDays,
                "rejectionReason": payload.rejectionReason
            }
        )

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action=f"LEAVE_{payload.status}",
        target_entity="LeaveRequest",
        target_id=leave.id,
        details=f"{payload.status} leave for employee {leave.employeeId} ({leave.totalDays}d of {leave.leaveType})",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Leave request {payload.status.lower()} successfully",
        "data": serialize_leave(leave)
    }
