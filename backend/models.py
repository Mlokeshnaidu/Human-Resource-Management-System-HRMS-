import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="EMPLOYEE", nullable=False)  # ADMIN, HR, EMPLOYEE
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    employeeCode = Column(String(50), unique=True, index=True, nullable=False)
    userId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    firstName = Column(String(100), nullable=False)
    lastName = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    department = Column(String(100), nullable=False, index=True)
    designation = Column(String(100), nullable=False)
    joiningDate = Column(DateTime, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE
    baseSalary = Column(Float, default=50000.0, nullable=False)
    hra = Column(Float, default=15000.0, nullable=False)
    allowances = Column(Float, default=5000.0, nullable=False)
    pfDeduction = Column(Float, default=3600.0, nullable=False)
    taxDeduction = Column(Float, default=2500.0, nullable=False)
    bankName = Column(String(100), nullable=True)
    accountNumber = Column(String(100), nullable=True)
    ifscCode = Column(String(50), nullable=True)
    emergencyContact = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="employee")
    documents = relationship("Document", back_populates="employee", cascade="all, delete-orphan")
    attendance = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leave_balances = relationship("LeaveBalance", back_populates="employee", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")
    payrolls = relationship("Payroll", back_populates="employee", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    employeeId = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    documentType = Column(String(100), nullable=False)
    fileName = Column(String(255), nullable=False)
    originalName = Column(String(255), nullable=False)
    filePath = Column(String(500), nullable=False)
    fileSize = Column(Integer, nullable=False)
    mimeType = Column(String(100), nullable=False)
    uploadedAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="documents")


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


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    userId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)  # ONBOARDING, LEAVE, PAYROLL, SYSTEM
    isRead = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")


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
