from sqlalchemy.orm import Session
from backend.models import AuditLog

def log_audit(
    db: Session,
    action: str,
    target_entity: str,
    target_id: str = None,
    details: str = None,
    user_id: str = None,
    user_email: str = None,
    user_role: str = None,
    ip_address: str = None
):
    try:
        audit = AuditLog(
            userId=user_id,
            userEmail=user_email,
            userRole=user_role,
            action=action,
            targetEntity=target_entity,
            targetId=target_id,
            details=details,
            ipAddress=ip_address
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print(f"[Audit Log Error]: {e}")
        db.rollback()
