import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    __table_args__ = (UniqueConstraint("employeeId", "year", "leaveType", name="uq_leave_balance_emp_yr_type"),)

    id = Column(String(36), primary_key=True, default=gen_uuid)
    employeeId = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    leaveType = Column(String(50), nullable=False)  # CL, SL, PL, LOP
    totalDays = Column(Float, nullable=False)
    usedDays = Column(Float, default=0.0, nullable=False)
    remainingDays = Column(Float, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="leave_balances")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    employeeId = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leaveType = Column(String(50), nullable=False)  # CL, SL, PL, LOP
    startDate = Column(String(20), nullable=False)  # YYYY-MM-DD
    endDate = Column(String(20), nullable=False)    # YYYY-MM-DD
    totalDays = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED
    reviewedBy = Column(String(255), nullable=True)
    reviewedAt = Column(DateTime, nullable=True)
    rejectionReason = Column(Text, nullable=True)
    isLossOfPay = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="leave_requests")
