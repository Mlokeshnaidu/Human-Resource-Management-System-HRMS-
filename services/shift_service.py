from datetime import datetime, time, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from models.shift import Shift, EmployeeShift, DepartmentShift
from models.user import Employee

DEFAULT_SHIFTS = [
    {
        "name": "General Day Shift",
        "code": "GEN",
        "startTime": "09:00",
        "endTime": "18:00",
        "gracePeriodMinutes": 15,
        "earlyExitThresholdMinutes": 15,
        "fullDayHours": 8.0,
        "halfDayHours": 4.0,
        "description": "Standard corporate office shift (09:00 AM - 06:00 PM)",
        "isDefault": True,
    },
    {
        "name": "Morning Shift",
        "code": "MORN",
        "startTime": "06:00",
        "endTime": "15:00",
        "gracePeriodMinutes": 15,
        "earlyExitThresholdMinutes": 15,
        "fullDayHours": 8.0,
        "halfDayHours": 4.0,
        "description": "Early morning operations and support shift (06:00 AM - 03:00 PM)",
        "isDefault": False,
    },
    {
        "name": "Night Shift",
        "code": "NIGHT",
        "startTime": "21:00",
        "endTime": "06:00",
        "gracePeriodMinutes": 15,
        "earlyExitThresholdMinutes": 15,
        "fullDayHours": 8.0,
        "halfDayHours": 4.0,
        "description": "Night operations and DevOps shift (09:00 PM - 06:00 AM)",
        "isDefault": False,
    },
    {
        "name": "Flexible Shift",
        "code": "FLEX",
        "startTime": "10:00",
        "endTime": "19:00",
        "gracePeriodMinutes": 30,
        "earlyExitThresholdMinutes": 30,
        "fullDayHours": 8.0,
        "halfDayHours": 4.0,
        "description": "Flexible engineering & product schedule with 30m grace",
        "isDefault": False,
    },
    {
        "name": "Remote US Shift",
        "code": "REMOTE",
        "startTime": "18:00",
        "endTime": "03:00",
        "gracePeriodMinutes": 15,
        "earlyExitThresholdMinutes": 15,
        "fullDayHours": 8.0,
        "halfDayHours": 4.0,
        "description": "Global client-aligned shift (06:00 PM - 03:00 AM)",
        "isDefault": False,
    },
]

def seed_default_shifts(db: Session):
    count = db.query(Shift).count()
    if count == 0:
        for item in DEFAULT_SHIFTS:
            s = Shift(**item)
            db.add(s)
        db.commit()
        print(f"[Shift Service] Seeded {len(DEFAULT_SHIFTS)} standard corporate shifts.")

def get_effective_shift_for_employee(db: Session, employee: Employee, date_str: Optional[str] = None) -> Shift:
    if not date_str:
        date_str = datetime.utcnow().strftime("%Y-%m-%d")

    # 1. Check direct active EmployeeShift
    emp_shift = db.query(EmployeeShift).filter(
        EmployeeShift.employeeId == employee.id,
        EmployeeShift.isActive == True,
        EmployeeShift.startDate <= date_str
    ).filter(
        (EmployeeShift.endDate == None) | (EmployeeShift.endDate >= date_str)
    ).order_by(EmployeeShift.createdAt.desc()).first()

    if emp_shift and emp_shift.shift and emp_shift.shift.isActive:
        return emp_shift.shift

    # 2. Check DepartmentShift
    if employee.department:
        dept_shift = db.query(DepartmentShift).filter(
            DepartmentShift.department == employee.department
        ).first()
        if dept_shift and dept_shift.shift and dept_shift.shift.isActive:
            return dept_shift.shift

    # 3. Fallback to default shift
    def_shift = db.query(Shift).filter(Shift.isDefault == True, Shift.isActive == True).first()
    if def_shift:
        return def_shift

    # 4. Fallback to any active shift
    any_shift = db.query(Shift).filter(Shift.isActive == True).first()
    if any_shift:
        return any_shift

    # 5. Last resort fallback
    return Shift(
        name="General Day Shift",
        code="GEN",
        startTime="09:00",
        endTime="18:00",
        gracePeriodMinutes=15,
        earlyExitThresholdMinutes=15,
        fullDayHours=8.0,
        halfDayHours=4.0
    )

def parse_time_str(time_str: str) -> time:
    parts = time_str.split(":")
    return time(int(parts[0]), int(parts[1]))

def evaluate_checkin_timing(shift: Shift, checkin_dt: datetime) -> Tuple[bool, int]:
    """
    Returns (isLate: bool, lateMinutes: int)
    """
    shift_start = parse_time_str(shift.startTime)
    # Check-in time of day in local / UTC converted time
    punch_time = checkin_dt.time()
    
    # Scheduled threshold
    scheduled_start_mins = shift_start.hour * 60 + shift_start.minute
    grace_threshold_mins = scheduled_start_mins + shift.gracePeriodMinutes
    punch_mins = punch_time.hour * 60 + punch_time.minute

    if punch_mins > grace_threshold_mins:
        late_mins = punch_mins - scheduled_start_mins
        return True, late_mins
    return False, 0

def evaluate_checkout_timing(shift: Shift, checkin_dt: Optional[datetime], checkout_dt: datetime) -> Tuple[bool, int, float, float]:
    """
    Returns (isEarlyExit: bool, earlyExitMinutes: int, workingHours: float, overtimeHours: float)
    """
    shift_end = parse_time_str(shift.endTime)
    punch_time = checkout_dt.time()

    scheduled_end_mins = shift_end.hour * 60 + shift_end.minute
    early_threshold_mins = scheduled_end_mins - shift.earlyExitThresholdMinutes
    punch_mins = punch_time.hour * 60 + punch_time.minute

    # Overnight shift handling (e.g. 21:00 to 06:00)
    is_overnight = parse_time_str(shift.endTime) < parse_time_str(shift.startTime)

    is_early = False
    early_mins = 0

    if not is_overnight:
        if punch_mins < early_threshold_mins:
            is_early = True
            early_mins = max(0, scheduled_end_mins - punch_mins)
    else:
        # For overnight shift, checkout is early if it's before scheduled_end_mins in the morning
        if punch_mins < early_threshold_mins and punch_time.hour < 12:
            is_early = True
            early_mins = max(0, scheduled_end_mins - punch_mins)

    # Calculate working hours
    if checkin_dt:
        diff_seconds = (checkout_dt - checkin_dt).total_seconds()
        working_hours = round(max(0.0, diff_seconds / 3600.0), 2)
    else:
        working_hours = 0.0

    # Overtime calculation
    overtime_hours = round(max(0.0, working_hours - shift.fullDayHours), 2)

    return is_early, early_mins, working_hours, overtime_hours
