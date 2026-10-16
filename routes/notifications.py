from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from models import User, Notification, NotificationPreference
from core.security import get_current_user, require_roles, get_client_ip
from services import log_audit
from services.notification_service import (
    get_or_create_user_preferences,
    broadcast_announcement,
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class PreferencesUpdateRequest(BaseModel):
    emailEnabled: Optional[bool] = None
    leaveAlerts: Optional[bool] = None
    payrollAlerts: Optional[bool] = None
    attendanceAlerts: Optional[bool] = None
    announcements: Optional[bool] = None

class BroadcastRequest(BaseModel):
    title: str
    message: str
    targetDepartment: Optional[str] = "ALL"  # ALL, Engineering, HR, Finance, etc.
    targetRole: Optional[str] = "ALL"        # ALL, EMPLOYEE, HR
    actionUrl: Optional[str] = None

def serialize_notification(n: Notification):
    return {
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "isRead": n.isRead,
        "isBroadcast": getattr(n, "isBroadcast", False),
        "targetDepartment": getattr(n, "targetDepartment", "ALL"),
        "targetRole": getattr(n, "targetRole", "ALL"),
        "actionUrl": getattr(n, "actionUrl", None),
        "createdAt": n.createdAt.isoformat() if n.createdAt else None
    }

@router.get("")
@router.get("/my")
def get_user_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Notification).filter(Notification.userId == current_user.id)
    if unread_only:
        q = q.filter(Notification.isRead == False)

    notifs = q.order_by(Notification.createdAt.desc()).limit(30).all()
    unread_count = db.query(Notification).filter(
        Notification.userId == current_user.id,
        Notification.isRead == False
    ).count()

    return {
        "success": True,
        "unreadCount": unread_count,
        "data": [serialize_notification(n) for n in notifs]
    }

@router.patch("/{id}/read")
def mark_notification_read(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(
        Notification.id == id,
        Notification.userId == current_user.id
    ).first()

    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")

    n.isRead = True
    db.commit()

    return {"success": True, "message": "Notification marked as read"}

@router.patch("/read-all")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.userId == current_user.id,
        Notification.isRead == False
    ).update({"isRead": True})
    db.commit()

    return {"success": True, "message": "All notifications marked as read"}

@router.delete("/{id}")
def delete_notification(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(
        Notification.id == id,
        Notification.userId == current_user.id
    ).first()

    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(n)
    db.commit()

    return {"success": True, "message": "Notification deleted"}

@router.get("/preferences")
def get_notification_preferences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = get_or_create_user_preferences(db, current_user.id)
    return {
        "success": True,
        "data": {
            "emailEnabled": pref.emailEnabled,
            "leaveAlerts": pref.leaveAlerts,
            "payrollAlerts": pref.payrollAlerts,
            "attendanceAlerts": pref.attendanceAlerts,
            "announcements": pref.announcements,
            "updatedAt": pref.updatedAt.isoformat() if pref.updatedAt else None
        }
    }

@router.put("/preferences")
def update_notification_preferences(
    payload: PreferencesUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = get_or_create_user_preferences(db, current_user.id)

    if payload.emailEnabled is not None:
        pref.emailEnabled = payload.emailEnabled
    if payload.leaveAlerts is not None:
        pref.leaveAlerts = payload.leaveAlerts
    if payload.payrollAlerts is not None:
        pref.payrollAlerts = payload.payrollAlerts
    if payload.attendanceAlerts is not None:
        pref.attendanceAlerts = payload.attendanceAlerts
    if payload.announcements is not None:
        pref.announcements = payload.announcements

    db.commit()
    db.refresh(pref)

    return {
        "success": True,
        "message": "Notification preferences updated successfully",
        "data": {
            "emailEnabled": pref.emailEnabled,
            "leaveAlerts": pref.leaveAlerts,
            "payrollAlerts": pref.payrollAlerts,
            "attendanceAlerts": pref.attendanceAlerts,
            "announcements": pref.announcements
        }
    }

@router.post("/broadcast")
def send_broadcast_notification(
    payload: BroadcastRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    recipients_count = broadcast_announcement(
        db=db,
        sender=current_user,
        title=payload.title,
        message=payload.message,
        target_department=payload.targetDepartment or "ALL",
        target_role=payload.targetRole or "ALL",
        action_url=payload.actionUrl
    )

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="BROADCAST_ANNOUNCEMENT_SENT",
        target_entity="Notification",
        details=f"Broadcast '{payload.title}' sent to Department: {payload.targetDepartment}, Role: {payload.targetRole} ({recipients_count} recipients)",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Broadcast delivered to {recipients_count} staff member(s)",
        "recipientsCount": recipients_count
    }
