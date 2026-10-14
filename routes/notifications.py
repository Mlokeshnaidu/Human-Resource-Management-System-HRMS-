from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models import User, Notification
from core.security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("")
@router.get("/my")
def get_user_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(
        Notification.userId == current_user.id
    ).order_by(Notification.createdAt.desc()).limit(20).all()

    unread = len([n for n in notifs if not n.isRead])

    return {
        "success": True,
        "unreadCount": unread,
        "data": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "isRead": n.isRead,
                "createdAt": n.createdAt.isoformat()
            } for n in notifs
        ]
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
