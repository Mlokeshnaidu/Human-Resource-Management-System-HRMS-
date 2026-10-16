import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from core.database import Base

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
    notification_preference = relationship("NotificationPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")


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
    salary_structure = relationship("EmployeeSalaryStructure", uselist=False, cascade="all, delete-orphan")
    salary_revisions = relationship("SalaryRevision", cascade="all, delete-orphan")
    shifts = relationship("EmployeeShift", cascade="all, delete-orphan")


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
