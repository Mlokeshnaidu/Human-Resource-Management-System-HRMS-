import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Payroll(Base):
    __tablename__ = "payrolls"
    __table_args__ = (UniqueConstraint("employeeId", "month", "year", name="uq_payroll_emp_mo_yr"),)

    id = Column(String(36), primary_key=True, default=gen_uuid)
    employeeId = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    month = Column(Integer, nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    totalWorkingDays = Column(Integer, default=30, nullable=False)
    presentDays = Column(Float, default=30.0, nullable=False)
    paidLeaveDays = Column(Float, default=0.0, nullable=False)
    lopDays = Column(Float, default=0.0, nullable=False)
    baseSalary = Column(Float, nullable=False)
    hra = Column(Float, nullable=False)
    allowances = Column(Float, nullable=False)
    bonus = Column(Float, default=0.0, nullable=False)
    grossSalary = Column(Float, nullable=False)
    pf = Column(Float, nullable=False)
    tax = Column(Float, nullable=False)
    lopDeduction = Column(Float, default=0.0, nullable=False)
    otherDeductions = Column(Float, default=0.0, nullable=False)
    totalDeductions = Column(Float, nullable=False)
    netSalary = Column(Float, nullable=False)
    status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, PROCESSED, PAID
    isLocked = Column(Boolean, default=False, nullable=False)
    lockedAt = Column(DateTime, nullable=True)
    paymentDate = Column(DateTime, nullable=True)
    paymentMethod = Column(String(100), default="BANK_TRANSFER", nullable=True)
    transactionReference = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="payrolls")
