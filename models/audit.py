import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    userId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)  # ONBOARDING, LEAVE, PAYROLL, ATTENDANCE, SHIFT, ANNOUNCEMENT, SYSTEM
    isRead = Column(Boolean, default=False, nullable=False)
    targetRole = Column(String(50), default="ALL", nullable=True)
    targetDepartment = Column(String(100), default="ALL", nullable=True)
    isBroadcast = Column(Boolean, default=False, nullable=False)
    actionUrl = Column(String(255), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    userId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    emailEnabled = Column(Boolean, default=True, nullable=False)
    leaveAlerts = Column(Boolean, default=True, nullable=False)
    payrollAlerts = Column(Boolean, default=True, nullable=False)
    attendanceAlerts = Column(Boolean, default=True, nullable=False)
    announcements = Column(Boolean, default=True, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notification_preference")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    userId = Column(String(36), nullable=True)
    userEmail = Column(String(255), nullable=True)
    userRole = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    targetEntity = Column(String(100), nullable=False, index=True)
    targetId = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ipAddress = Column(String(50), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    to = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    template = Column(String(100), nullable=False)
    payload = Column(Text, nullable=True)
    status = Column(String(50), default="SENT", nullable=False)
    sentAt = Column(DateTime, default=datetime.utcnow, nullable=False)
