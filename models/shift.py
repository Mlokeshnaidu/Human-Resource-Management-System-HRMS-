import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)  # GEN, MORN, NIGHT, FLEX, REMOTE
    startTime = Column(String(10), nullable=False)  # "09:00"
    endTime = Column(String(10), nullable=False)    # "18:00"
    gracePeriodMinutes = Column(Integer, default=15, nullable=False)
    earlyExitThresholdMinutes = Column(Integer, default=15, nullable=False)
    fullDayHours = Column(Float, default=8.0, nullable=False)
    halfDayHours = Column(Float, default=4.0, nullable=False)
    description = Column(Text, nullable=True)
    isDefault = Column(Boolean, default=False, nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee_shifts = relationship("EmployeeShift", back_populates="shift", cascade="all, delete-orphan")
    department_shifts = relationship("DepartmentShift", back_populates="shift", cascade="all, delete-orphan")


class EmployeeShift(Base):
    __tablename__ = "employee_shifts"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    employeeId = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    shiftId = Column(String(36), ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False, index=True)
    startDate = Column(String(20), nullable=False)  # YYYY-MM-DD
    endDate = Column(String(20), nullable=True)     # YYYY-MM-DD
    assignedBy = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="shifts")
    shift = relationship("Shift", back_populates="employee_shifts")


class DepartmentShift(Base):
    __tablename__ = "department_shifts"
    __table_args__ = (UniqueConstraint("department", name="uq_dept_shift"),)

    id = Column(String(36), primary_key=True, default=gen_uuid)
    department = Column(String(100), nullable=False, unique=True, index=True)
    shiftId = Column(String(36), ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False)
    assignedBy = Column(String(255), nullable=True)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    shift = relationship("Shift", back_populates="department_shifts")
