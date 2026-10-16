from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from models.user import User, Employee
from models.audit import Notification, NotificationPreference

def get_or_create_user_preferences(db: Session, user_id: str) -> NotificationPreference:
    pref = db.query(NotificationPreference).filter(NotificationPreference.userId == user_id).first()
    if not pref:
        pref = NotificationPreference(
            userId=user_id,
            emailEnabled=True,
            leaveAlerts=True,
            payrollAlerts=True,
            attendanceAlerts=True,
            announcements=True,
            updatedAt=datetime.utcnow()
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref

def is_notification_type_enabled(pref: NotificationPreference, notif_type: str) -> bool:
    t = notif_type.upper()
    if "LEAVE" in t:
        return pref.leaveAlerts
    elif "PAYROLL" in t:
        return pref.payrollAlerts
    elif "ATTENDANCE" in t or "SHIFT" in t:
        return pref.attendanceAlerts
    elif "ANNOUNCEMENT" in t or "BROADCAST" in t or "ADMIN" in t:
        return pref.announcements
    return True

def create_user_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    type: str = "SYSTEM",
    action_url: Optional[str] = None,
    is_broadcast: bool = False
) -> Optional[Notification]:
    """
    Creates notification if permitted by user's preference settings.
    """
    try:
        pref = get_or_create_user_preferences(db, user_id)
        if not is_notification_type_enabled(pref, type):
            print(f"[Notification Suppressed] User {user_id} disabled notifications for {type}")
            return None

        notif = Notification(
            userId=user_id,
            title=title,
            message=message,
            type=type,
            isRead=False,
            isBroadcast=is_broadcast,
            actionUrl=action_url,
            createdAt=datetime.utcnow()
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
    except Exception as e:
        print(f"[Notification Error]: {e}")
        db.rollback()
        return None

def broadcast_announcement(
    db: Session,
    sender: User,
    title: str,
    message: str,
    target_department: str = "ALL",
    target_role: str = "ALL",
    action_url: Optional[str] = None
) -> int:
    """
    Broadcasts message to targeted users (matching department and/or role).
    """
    query = db.query(User).filter(User.isActive == True)
    
    if target_role and target_role != "ALL":
        query = query.filter(User.role == target_role)

    users = query.all()
    count = 0

    for u in users:
        # Check department filtering
        if target_department and target_department != "ALL":
            if not u.employee or u.employee.department != target_department:
                continue

        pref = get_or_create_user_preferences(db, u.id)
        if not pref.announcements:
            continue

        notif = Notification(
            userId=u.id,
            title=title,
            message=message,
            type="ANNOUNCEMENT",
            isRead=False,
            targetRole=target_role,
            targetDepartment=target_department,
            isBroadcast=True,
            actionUrl=action_url,
            createdAt=datetime.utcnow()
        )
        db.add(notif)
        count += 1

    db.commit()
    return count
