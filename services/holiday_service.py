import calendar
from datetime import datetime, date
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from models.holiday import Holiday

DEFAULT_HOLIDAYS_2026 = [
    # Company-wide National / Standard Holidays
    {"name": "New Year's Day", "date": "2026-01-01", "type": "COMPANY", "region": "ALL", "description": "Global New Year Celebration", "isOptional": False},
    {"name": "Republic Day", "date": "2026-01-26", "type": "COMPANY", "region": "ALL", "description": "Honoring the Constitution of India", "isOptional": False},
    {"name": "Maha Shivaratri", "date": "2026-02-17", "type": "OPTIONAL", "region": "ALL", "description": "Hindu festival celebrating Lord Shiva", "isOptional": True},
    {"name": "Holi Festival", "date": "2026-03-04", "type": "COMPANY", "region": "ALL", "description": "Festival of Colors and Spring", "isOptional": False},
    {"name": "Eid al-Fitr", "date": "2026-03-21", "type": "COMPANY", "region": "ALL", "description": "Islamic festive culmination of Ramadan", "isOptional": False},
    {"name": "Good Friday", "date": "2026-04-03", "type": "COMPANY", "region": "ALL", "description": "Christian solemn commemoration", "isOptional": False},
    {"name": "Ugadi / Gudi Padwa", "date": "2026-04-09", "type": "REGIONAL", "region": "South", "description": "New Year festival in Southern/Western States", "isOptional": False},
    {"name": "May Day / Labor Day", "date": "2026-05-01", "type": "COMPANY", "region": "ALL", "description": "International Workers' Day", "isOptional": False},
    {"name": "Bakrid / Eid al-Adha", "date": "2026-05-27", "type": "COMPANY", "region": "ALL", "description": "Feast of the Sacrifice", "isOptional": False},
    {"name": "Independence Day", "date": "2026-08-15", "type": "COMPANY", "region": "ALL", "description": "National Independence Day", "isOptional": False},
    {"name": "Raksha Bandhan", "date": "2026-08-28", "type": "OPTIONAL", "region": "ALL", "description": "Festival honoring sibling bonds", "isOptional": True},
    {"name": "Ganesh Chaturthi", "date": "2026-09-14", "type": "REGIONAL", "region": "West", "description": "Vinayaka Chavithi celebration", "isOptional": False},
    {"name": "Gandhi Jayanti", "date": "2026-10-02", "type": "COMPANY", "region": "ALL", "description": "Mahatma Gandhi's Birthday commemoration", "isOptional": False},
    {"name": "Dussehra / Vijayadashami", "date": "2026-10-20", "type": "COMPANY", "region": "ALL", "description": "Triumph of good over evil", "isOptional": False},
    {"name": "Karnataka Rajyotsava", "date": "2026-11-01", "type": "REGIONAL", "region": "South", "description": "Karnataka State Foundation Day", "isOptional": False},
    {"name": "Diwali / Deepavali", "date": "2026-11-08", "type": "COMPANY", "region": "ALL", "description": "Festival of Lights", "isOptional": False},
    {"name": "Guru Nanak Jayanti", "date": "2026-11-24", "type": "OPTIONAL", "region": "North", "description": "Gurpurab commemoration", "isOptional": True},
    {"name": "Christmas Day", "date": "2026-12-25", "type": "COMPANY", "region": "ALL", "description": "Christmas Celebration", "isOptional": False},
]

def seed_default_holidays(db: Session, year: int = 2026):
    count = db.query(Holiday).filter(Holiday.year == year).count()
    if count == 0:
        for item in DEFAULT_HOLIDAYS_2026:
            h = Holiday(
                name=item["name"],
                date=item["date"],
                endDate=item["date"],
                type=item["type"],
                region=item["region"],
                description=item["description"],
                year=year,
                isOptional=item["isOptional"],
            )
            db.add(h)
        db.commit()
        print(f"[Holiday Service] Seeded {len(DEFAULT_HOLIDAYS_2026)} default holidays for {year}.")

def get_holidays_for_month(db: Session, year: int, month: int, region: Optional[str] = None) -> List[Holiday]:
    prefix = f"{year}-{str(month).zfill(2)}"
    q = db.query(Holiday).filter(Holiday.date.startswith(prefix))
    if region and region != "ALL":
        q = q.filter((Holiday.region == "ALL") | (Holiday.region == region))
    return q.order_by(Holiday.date.asc()).all()

def get_month_workday_summary(db: Session, year: int, month: int, region: str = "ALL") -> Dict:
    """
    Computes total days, weekends, holidays on weekdays, and standard working days.
    Guarantees holidays falling on weekends aren't double deducted!
    """
    days_in_month = calendar.monthrange(year, month)[1]
    holidays = get_holidays_for_month(db, year, month, region)

    # Map dates to holidays (non-optional are company/mandatory)
    holiday_map = {h.date: h for h in holidays if not h.isOptional}
    all_holiday_map = {h.date: h for h in holidays}

    weekend_count = 0
    holiday_weekday_count = 0
    calendar_days = []

    for d in range(1, days_in_month + 1):
        dt = date(year, month, d)
        date_str = dt.strftime("%Y-%m-%d")
        weekday = dt.weekday()  # Monday is 0, Sunday is 6
        is_weekend = weekday in (5, 6)

        if is_weekend:
            weekend_count += 1
        elif date_str in holiday_map:
            holiday_weekday_count += 1

        cal_item = {
            "date": date_str,
            "day": d,
            "dayOfWeek": dt.strftime("%a"),
            "isWeekend": is_weekend,
            "isHoliday": date_str in all_holiday_map,
            "holiday": {
                "id": all_holiday_map[date_str].id,
                "name": all_holiday_map[date_str].name,
                "type": all_holiday_map[date_str].type,
                "region": all_holiday_map[date_str].region,
                "isOptional": all_holiday_map[date_str].isOptional,
                "description": all_holiday_map[date_str].description
            } if date_str in all_holiday_map else None
        }
        calendar_days.append(cal_item)

    standard_working_days = max(0, days_in_month - weekend_count - holiday_weekday_count)

    return {
        "year": year,
        "month": month,
        "totalDays": days_in_month,
        "weekendDays": weekend_count,
        "holidayDays": holiday_weekday_count,
        "totalHolidaysCount": len(holidays),
        "standardWorkingDays": standard_working_days,
        "holidays": [
            {
                "id": h.id,
                "name": h.name,
                "date": h.date,
                "type": h.type,
                "region": h.region,
                "description": h.description,
                "isOptional": h.isOptional
            } for h in holidays
        ],
        "calendarDays": calendar_days
    }
