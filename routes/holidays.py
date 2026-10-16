from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from models import User, Holiday
from core.security import get_current_user, require_roles, get_client_ip
from services import log_audit
from services.holiday_service import (
    get_month_workday_summary,
    seed_default_holidays,
    get_holidays_for_month,
)

router = APIRouter(prefix="/api/holidays", tags=["Holidays & Calendar"])

class HolidayCreateRequest(BaseModel):
    name: str
    date: str  # YYYY-MM-DD
    endDate: Optional[str] = None
    type: Optional[str] = "COMPANY"  # COMPANY, REGIONAL, OPTIONAL
    region: Optional[str] = "ALL"
    description: Optional[str] = None
    isOptional: Optional[bool] = False

class HolidayUpdateRequest(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    endDate: Optional[str] = None
    type: Optional[str] = None
    region: Optional[str] = None
    description: Optional[str] = None
    isOptional: Optional[bool] = None

def serialize_holiday(h: Holiday):
    return {
        "id": h.id,
        "name": h.name,
        "date": h.date,
        "endDate": h.endDate or h.date,
        "type": h.type,
        "region": h.region,
        "description": h.description,
        "year": h.year,
        "isOptional": h.isOptional,
        "createdAt": h.createdAt.isoformat() if h.createdAt else None,
        "updatedAt": h.updatedAt.isoformat() if h.updatedAt else None,
    }

@router.get("")
def list_holidays(
    year: Optional[int] = None,
    month: Optional[int] = None,
    type: Optional[str] = None,
    region: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_year = year or datetime.utcnow().year
    # Ensure default holidays are present
    seed_default_holidays(db, target_year)

    q = db.query(Holiday).filter(Holiday.year == target_year)

    if month:
        prefix = f"{target_year}-{str(month).zfill(2)}"
        q = q.filter(Holiday.date.startswith(prefix))

    if type and type != "ALL":
        q = q.filter(Holiday.type == type)

    if region and region != "ALL":
        q = q.filter((Holiday.region == "ALL") | (Holiday.region == region))

    holidays = q.order_by(Holiday.date.asc()).all()

    return {
        "success": True,
        "count": len(holidays),
        "year": target_year,
        "data": [serialize_holiday(h) for h in holidays]
    }

@router.get("/upcoming")
def get_upcoming_holidays(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    seed_default_holidays(db, datetime.utcnow().year)

    holidays = db.query(Holiday).filter(
        Holiday.date >= today_str
    ).order_by(Holiday.date.asc()).limit(limit).all()

    return {
        "success": True,
        "count": len(holidays),
        "data": [serialize_holiday(h) for h in holidays]
    }

@router.get("/calendar-summary")
def get_calendar_summary(
    year: Optional[int] = None,
    month: Optional[int] = None,
    region: Optional[str] = "ALL",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    target_year = year or now.year
    target_month = month or now.month
    seed_default_holidays(db, target_year)

    summary = get_month_workday_summary(db, target_year, target_month, region or "ALL")
    return {
        "success": True,
        "data": summary
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_holiday(
    payload: HolidayCreateRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    try:
        dt = datetime.strptime(payload.date, "%Y-%m-%d")
        year = dt.year
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD")

    existing = db.query(Holiday).filter(
        Holiday.date == payload.date,
        Holiday.name == payload.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Holiday already exists on this date with the same name")

    holiday = Holiday(
        name=payload.name,
        date=payload.date,
        endDate=payload.endDate or payload.date,
        type=payload.type or "COMPANY",
        region=payload.region or "ALL",
        description=payload.description,
        year=year,
        isOptional=bool(payload.isOptional),
    )
    db.add(holiday)
    db.commit()
    db.refresh(holiday)

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="HOLIDAY_CREATED",
        target_entity="Holiday",
        target_id=holiday.id,
        details=f"Created holiday '{holiday.name}' on {holiday.date} ({holiday.type})",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Holiday '{holiday.name}' created successfully",
        "data": serialize_holiday(holiday)
    }

@router.put("/{id}")
def update_holiday(
    id: str,
    payload: HolidayUpdateRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    holiday = db.query(Holiday).filter(Holiday.id == id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    if payload.name is not None:
        holiday.name = payload.name
    if payload.date is not None:
        holiday.date = payload.date
        try:
            holiday.year = datetime.strptime(payload.date, "%Y-%m-%d").year
        except ValueError:
            pass
    if payload.endDate is not None:
        holiday.endDate = payload.endDate
    if payload.type is not None:
        holiday.type = payload.type
    if payload.region is not None:
        holiday.region = payload.region
    if payload.description is not None:
        holiday.description = payload.description
    if payload.isOptional is not None:
        holiday.isOptional = payload.isOptional

    holiday.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(holiday)

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="HOLIDAY_UPDATED",
        target_entity="Holiday",
        target_id=holiday.id,
        details=f"Updated holiday '{holiday.name}' on {holiday.date}",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": "Holiday updated successfully",
        "data": serialize_holiday(holiday)
    }

@router.delete("/{id}")
def delete_holiday(
    id: str,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    holiday = db.query(Holiday).filter(Holiday.id == id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    h_name = holiday.name
    h_date = holiday.date

    db.delete(holiday)
    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="HOLIDAY_DELETED",
        target_entity="Holiday",
        target_id=id,
        details=f"Deleted holiday '{h_name}' ({h_date})",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Holiday '{h_name}' deleted successfully"
    }
