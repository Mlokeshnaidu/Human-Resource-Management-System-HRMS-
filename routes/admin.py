from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from core.database import get_db
from models import User, Employee, Attendance, LeaveRequest, Payroll, AuditLog
from core.security import require_roles

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

@router.get("/dashboard-stats")
def get_admin_dashboard_stats(
    current_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(Employee.status == "ACTIVE").count()
    
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    today_attendance = db.query(Attendance).filter(Attendance.date == today_str).all()
    present_count = len([a for a in today_attendance if a.status == "PRESENT"])
    
    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "PENDING").count()
    
    recent_audits = db.query(AuditLog).order_by(AuditLog.createdAt.desc()).limit(10).all()

    return {
        "success": True,
        "metrics": {
            "totalUsers": total_users,
            "totalEmployees": total_employees,
            "activeEmployees": active_employees,
            "presentToday": present_count,
            "pendingLeaveRequests": pending_leaves
        },
        "recentAudits": [
            {
                "id": a.id,
                "userEmail": a.userEmail,
                "action": a.action,
                "targetEntity": a.targetEntity,
                "details": a.details,
                "createdAt": a.createdAt.isoformat()
            }
            for a in recent_audits
        ]
    }

@router.patch("/users/{user_id}/status")
def toggle_user_status(
    user_id: str,
    active: bool,
    current_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own admin account")
        
    user.isActive = active
    db.commit()
    return {"success": True, "message": f"User account {'activated' if active else 'deactivated'} successfully"}
