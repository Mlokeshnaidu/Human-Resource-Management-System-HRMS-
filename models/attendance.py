import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("employeeId", "date", name="uq_attendance_emp_date"),)

    id = Column(String(36), primary_key=True, default=gen_uuid)
    employeeId = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    checkIn = Column(DateTime, nullable=True)
    checkOut = Column(DateTime, nullable=True)
    workingHours = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="PRESENT", nullable=False)  # PRESENT, HALF_DAY, ABSENT, ON_LEAVE
    isOverride = Column(Boolean, default=False, nullable=False)
    overrideReason = Column(Text, nullable=True)
    overriddenBy = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="attendance")
