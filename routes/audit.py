from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from models import User, AuditLog, EmailLog
from core.security import require_roles

router = APIRouter(prefix="/api/audit", tags=["Audit & Logs"])

@router.get("")
def get_audit_logs(
    action: Optional[str] = None,
    entity: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    page: int = 1,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if action and action != "ALL":
        query = query.filter(AuditLog.action == action)
    if entity and entity != "ALL":
        query = query.filter(AuditLog.targetEntity == entity)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (AuditLog.userEmail.ilike(s)) |
            (AuditLog.details.ilike(s)) |
            (AuditLog.action.ilike(s))
        )

    total_count = query.count()
    offset = (page - 1) * limit
    logs = query.order_by(AuditLog.createdAt.desc()).offset(offset).limit(limit).all()

    return {
        "success": True,
        "totalCount": total_count,
        "page": page,
        "totalPages": max(1, (total_count + limit - 1) // limit),
        "data": [
            {
                "id": a.id,
                "userId": a.userId,
                "userEmail": a.userEmail,
                "userRole": a.userRole,
                "action": a.action,
                "targetEntity": a.targetEntity,
                "targetId": a.targetId,
                "details": a.details,
                "ipAddress": a.ipAddress,
                "createdAt": a.createdAt.isoformat()
            } for a in logs
        ]
    }

@router.get("/emails")
def get_email_logs(
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    logs = db.query(EmailLog).order_by(EmailLog.sentAt.desc()).limit(50).all()
    return {
        "success": True,
        "count": len(logs),
        "data": [
            {
                "id": e.id,
                "to": e.to,
                "subject": e.subject,
                "template": e.template,
                "payload": e.payload,
                "status": e.status,
                "sentAt": e.sentAt.isoformat()
            } for e in logs
        ]
    }
