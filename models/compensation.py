import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class EmployeeSalaryStructure(Base):
    __tablename__ = "employee_salary_structures"
    __table_args__ = (UniqueConstraint("employeeId", name="uq_emp_salary_structure"),)

    id = Column(String(36), primary_key=True, default=gen_uuid)
    employeeId = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    baseSalary = Column(Float, default=50000.0, nullable=False)
    hra = Column(Float, default=15000.0, nullable=False)
    conveyanceAllowance = Column(Float, default=2000.0, nullable=False)
    medicalAllowance = Column(Float, default=1500.0, nullable=False)
    specialAllowance = Column(Float, default=3500.0, nullable=False)
    pfDeduction = Column(Float, default=3600.0, nullable=False)
    taxDeduction = Column(Float, default=2500.0, nullable=False)
    professionalTax = Column(Float, default=200.0, nullable=False)
    overtimeHourlyRate = Column(Float, default=250.0, nullable=False)
    effectiveDate = Column(String(20), nullable=False)  # YYYY-MM-DD
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="salary_structure")


class SalaryRevision(Base):
    __tablename__ = "salary_revisions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    employeeId = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    previousGross = Column(Float, nullable=False)
    newGross = Column(Float, nullable=False)
    incrementPercentage = Column(Float, nullable=False)
    previousBase = Column(Float, nullable=False)
    newBase = Column(Float, nullable=False)
    effectiveDate = Column(String(20), nullable=False)  # YYYY-MM-DD
    reason = Column(String(255), nullable=False)        # Annual Appraisal, Promotion, Market Correction
    revisedBy = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="salary_revisions")
