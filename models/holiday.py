import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, UniqueConstraint
from core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Holiday(Base):
    __tablename__ = "holidays"
    __table_args__ = (UniqueConstraint("date", "name", name="uq_holiday_date_name"),)

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(150), nullable=False)
    date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    endDate = Column(String(20), nullable=True)            # YYYY-MM-DD
    type = Column(String(50), default="COMPANY", nullable=False)  # COMPANY, REGIONAL, OPTIONAL
    region = Column(String(100), default="ALL", nullable=False)   # ALL, South, North, HQ, etc.
    description = Column(Text, nullable=True)
    year = Column(Integer, nullable=False, index=True)
    isOptional = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
