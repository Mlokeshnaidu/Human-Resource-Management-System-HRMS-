import calendar
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from models import (
    User,
    Employee,
    Payroll,
    Attendance,
    LeaveRequest,
    EmployeeSalaryStructure,
    SalaryRevision,
)
from core.security import get_current_user, require_roles, get_client_ip
from services import log_audit, send_notification_email, generate_salary_slip_pdf
from services.holiday_service import get_month_workday_summary
from services.notification_service import create_user_notification

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])

class PayrollGenerateRequest(BaseModel):
    month: Optional[int] = None
    year: Optional[int] = None
    employeeId: Optional[str] = None

class PayrollAdjustRequest(BaseModel):
    bonus: Optional[float] = 0.0
    variablePay: Optional[float] = 0.0
    otherDeductions: Optional[float] = 0.0
    remarks: Optional[str] = None

class SalaryStructureUpdateRequest(BaseModel):
    baseSalary: float
    hra: float
    conveyanceAllowance: Optional[float] = 2000.0
    medicalAllowance: Optional[float] = 1500.0
    specialAllowance: Optional[float] = 3500.0
    pfDeduction: Optional[float] = 3600.0
    taxDeduction: Optional[float] = 2500.0
    professionalTax: Optional[float] = 200.0
    overtimeHourlyRate: Optional[float] = 250.0
    effectiveDate: Optional[str] = None

class SalaryRevisionRequest(BaseModel):
    employeeId: str
    newBase: float
    newHra: float
    newConveyance: Optional[float] = 2000.0
    newMedical: Optional[float] = 1500.0
    newSpecial: Optional[float] = 3500.0
    newPf: Optional[float] = 3600.0
    newTax: Optional[float] = 2500.0
    newOvertimeRate: Optional[float] = 250.0
    effectiveDate: str  # YYYY-MM-DD
    reason: str        # e.g. "Annual Appraisal 2026", "Promotion", "Market Adjustment"
    notes: Optional[str] = None

def get_or_create_salary_structure(db: Session, emp: Employee) -> EmployeeSalaryStructure:
    struct = db.query(EmployeeSalaryStructure).filter(
        EmployeeSalaryStructure.employeeId == emp.id
    ).first()
    if not struct:
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        struct = EmployeeSalaryStructure(
            employeeId=emp.id,
            baseSalary=emp.baseSalary or 50000.0,
            hra=emp.hra or 15000.0,
            conveyanceAllowance=2000.0,
            medicalAllowance=1500.0,
            specialAllowance=max(0.0, (emp.allowances or 5000.0) - 3500.0),
            pfDeduction=emp.pfDeduction or 3600.0,
            taxDeduction=emp.taxDeduction or 2500.0,
            professionalTax=200.0,
            overtimeHourlyRate=round((emp.baseSalary or 50000.0) / 200.0, 2),
            effectiveDate=today_str,
            isActive=True
        )
        db.add(struct)
        db.commit()
        db.refresh(struct)
    return struct

def serialize_payroll(p: Payroll):
    return {
        "id": p.id,
        "employeeId": p.employeeId,
        "month": p.month,
        "year": p.year,
        "totalWorkingDays": p.totalWorkingDays,
        "standardWorkingDays": getattr(p, "standardWorkingDays", 22),
        "weekendDaysCount": getattr(p, "weekendDaysCount", 8),
        "holidaysCount": getattr(p, "holidaysCount", 0),
        "presentDays": p.presentDays,
        "paidLeaveDays": p.paidLeaveDays,
        "lopDays": p.lopDays,
        "baseSalary": p.baseSalary,
        "hra": p.hra,
        "conveyanceAllowance": getattr(p, "conveyanceAllowance", 0.0),
        "medicalAllowance": getattr(p, "medicalAllowance", 0.0),
        "specialAllowance": getattr(p, "specialAllowance", 0.0),
        "allowances": p.allowances,
        "overtimeHours": getattr(p, "overtimeHours", 0.0),
        "overtimePay": getattr(p, "overtimePay", 0.0),
        "bonus": p.bonus,
        "variablePay": getattr(p, "variablePay", 0.0),
        "grossSalary": p.grossSalary,
        "pf": p.pf,
        "tax": p.tax,
        "lopDeduction": p.lopDeduction,
        "otherDeductions": p.otherDeductions,
        "totalDeductions": p.totalDeductions,
        "netSalary": p.netSalary,
        "status": p.status,
        "isLocked": p.isLocked,
        "lockedAt": p.lockedAt.isoformat() if p.lockedAt else None,
        "paymentDate": p.paymentDate.isoformat() if p.paymentDate else None,
        "paymentMethod": p.paymentMethod,
        "transactionReference": p.transactionReference,
        "remarks": p.remarks,
        "createdAt": p.createdAt.isoformat() if p.createdAt else None,
        "employee": {
            "id": p.employee.id,
            "employeeCode": p.employee.employeeCode,
            "firstName": p.employee.firstName,
            "lastName": p.employee.lastName,
            "department": p.employee.department,
            "designation": p.employee.designation,
            "accountNumber": p.employee.accountNumber,
            "bankName": p.employee.bankName,
            "ifscCode": p.employee.ifscCode,
            "user": {
                "email": p.employee.user.email
            } if hasattr(p.employee, 'user') and p.employee.user else None
        } if hasattr(p, 'employee') and p.employee else None
    }

@router.post("/generate")
def generate_payroll(
    payload: PayrollGenerateRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    target_month = payload.month or now.month
    target_year = payload.year or now.year

    # 1. Holiday & Calendar details for the target month
    workday_info = get_month_workday_summary(db, target_year, target_month)
    days_in_month = workday_info["totalDays"]
    weekend_days = workday_info["weekendDays"]
    holidays_count = workday_info["holidayDays"]
    standard_working_days = workday_info["standardWorkingDays"] or 22

    emp_query = db.query(Employee).filter(Employee.status == "ACTIVE")
    if payload.employeeId:
        emp_query = emp_query.filter(Employee.id == payload.employeeId)

    employees = emp_query.all()
    if not employees:
        raise HTTPException(status_code=404, detail="No active employees found to process")

    processed = 0
    date_prefix = f"{target_year}-{str(target_month).zfill(2)}"

    for emp in employees:
        existing = db.query(Payroll).filter(
            Payroll.employeeId == emp.id,
            Payroll.month == target_month,
            Payroll.year == target_year
        ).first()

        if existing and existing.isLocked:
            continue

        # Salary structure
        structure = get_or_create_salary_structure(db, emp)

        # 2. Attendance & Overtime records
        atts = db.query(Attendance).filter(
            Attendance.employeeId == emp.id,
            Attendance.date.startswith(date_prefix)
        ).all()

        present_count = len([a for a in atts if a.status == "PRESENT"])
        half_day_count = len([a for a in atts if a.status == "HALF_DAY"])
        effective_present = float(present_count + half_day_count * 0.5)
        total_overtime_hours = round(sum(getattr(a, "overtimeHours", 0.0) for a in atts), 2)

        # 3. Approved leaves
        approved_leaves = db.query(LeaveRequest).filter(
            LeaveRequest.employeeId == emp.id,
            LeaveRequest.status == "APPROVED",
            LeaveRequest.startDate.startswith(date_prefix)
        ).all()

        lop_leave_days = sum(l.totalDays for l in approved_leaves if l.isLossOfPay or l.leaveType == "LOP")
        paid_leaves = sum(l.totalDays for l in approved_leaves if not l.isLossOfPay and l.leaveType != "LOP")

        # Dynamic LOP: unapproved absent working days
        accounted = effective_present + paid_leaves + lop_leave_days
        unaccounted = max(0.0, float(standard_working_days) - accounted)
        total_lop = lop_leave_days + (unaccounted if atts else 0.0)

        # 4. Salary components
        base_salary = structure.baseSalary or emp.baseSalary
        hra = structure.hra or emp.hra
        conveyance = structure.conveyanceAllowance or 2000.0
        medical = structure.medicalAllowance or 1500.0
        special = structure.specialAllowance or 3500.0
        total_allowances = round(hra + conveyance + medical + special, 2)

        # Overtime Pay = Overtime Hours * Overtime Hourly Rate
        ot_rate = structure.overtimeHourlyRate or (base_salary / 200.0)
        overtime_pay = round(total_overtime_hours * ot_rate, 2)

        bonus = existing.bonus if existing else 0.0
        variable_pay = existing.variablePay if existing else 0.0

        gross_salary = round(base_salary + total_allowances + overtime_pay + bonus + variable_pay, 2)

        # LOP Deduction based on standard working days (excluding weekends & holidays)
        per_day = base_salary / float(standard_working_days if standard_working_days > 0 else 22)
        lop_deduction = round(per_day * total_lop, 2)

        pf = structure.pfDeduction or emp.pfDeduction
        tax = structure.taxDeduction or emp.taxDeduction
        other_deductions = (existing.otherDeductions if existing else 0.0) + (structure.professionalTax or 200.0)
        total_deductions = round(pf + tax + lop_deduction + other_deductions, 2)
        net_salary = round(max(0.0, gross_salary - total_deductions), 2)

        if existing:
            existing.totalWorkingDays = days_in_month
            existing.standardWorkingDays = standard_working_days
            existing.weekendDaysCount = weekend_days
            existing.holidaysCount = holidays_count
            existing.presentDays = effective_present
            existing.paidLeaveDays = paid_leaves
            existing.lopDays = total_lop
            existing.baseSalary = base_salary
            existing.hra = hra
            existing.conveyanceAllowance = conveyance
            existing.medicalAllowance = medical
            existing.specialAllowance = special
            existing.allowances = total_allowances
            existing.overtimeHours = total_overtime_hours
            existing.overtimePay = overtime_pay
            existing.bonus = bonus
            existing.variablePay = variable_pay
            existing.grossSalary = gross_salary
            existing.pf = pf
            existing.tax = tax
            existing.lopDeduction = lop_deduction
            existing.otherDeductions = other_deductions
            existing.totalDeductions = total_deductions
            existing.netSalary = net_salary
            existing.status = "PROCESSED"
            existing.updatedAt = datetime.utcnow()
        else:
            p = Payroll(
                employeeId=emp.id,
                month=target_month,
                year=target_year,
                totalWorkingDays=days_in_month,
                standardWorkingDays=standard_working_days,
                weekendDaysCount=weekend_days,
                holidaysCount=holidays_count,
                presentDays=effective_present,
                paidLeaveDays=paid_leaves,
                lopDays=total_lop,
                baseSalary=base_salary,
                hra=hra,
                conveyanceAllowance=conveyance,
                medicalAllowance=medical,
                specialAllowance=special,
                allowances=total_allowances,
                overtimeHours=total_overtime_hours,
                overtimePay=overtime_pay,
                bonus=bonus,
                variablePay=variable_pay,
                grossSalary=gross_salary,
                pf=pf,
                tax=tax,
                lopDeduction=lop_deduction,
                otherDeductions=other_deductions,
                totalDeductions=total_deductions,
                netSalary=net_salary,
                status="PROCESSED"
            )
            db.add(p)

        # Notify employee
        if emp.userId:
            create_user_notification(
                db=db,
                user_id=emp.userId,
                title="Payroll Processed",
                message=f"Your salary statement for {target_month}/{target_year} has been processed. Net: Rs. {net_salary}.",
                type="PAYROLL"
            )

        processed += 1

    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="PAYROLL_GENERATED",
        target_entity="Payroll",
        details=f"Generated advanced payroll for {processed} staff members ({target_month}/{target_year})",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Payroll cycle {target_month}/{target_year} processed for {processed} staff members",
        "processedCount": processed
    }

@router.get("")
def list_payrolls(
    month: Optional[int] = None,
    year: Optional[int] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    m = month or now.month
    y = year or now.year

    query = db.query(Payroll).filter(Payroll.month == m, Payroll.year == y)

    if status and status != "ALL":
        query = query.filter(Payroll.status == status)

    if department and department != "ALL":
        query = query.join(Employee).filter(Employee.department == department)

    payrolls = query.all()

    total_gross = sum(p.grossSalary for p in payrolls)
    total_net = sum(p.netSalary for p in payrolls)
    total_lop = sum(p.lopDeduction for p in payrolls)
    total_ot_pay = sum(getattr(p, "overtimePay", 0.0) for p in payrolls)

    return {
        "success": True,
        "count": len(payrolls),
        "summary": {
            "totalGross": round(total_gross, 2),
            "totalNet": round(total_net, 2),
            "totalLopDeductions": round(total_lop, 2),
            "totalOvertimePay": round(total_ot_pay, 2)
        },
        "data": [serialize_payroll(p) for p in payrolls]
    }

@router.get("/my")
def get_my_payroll_slips(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.employee:
        return {"success": True, "data": []}

    payrolls = db.query(Payroll).filter(
        Payroll.employeeId == current_user.employee.id
    ).order_by(Payroll.year.desc(), Payroll.month.desc()).all()

    return {
        "success": True,
        "count": len(payrolls),
        "data": [serialize_payroll(p) for p in payrolls]
    }

@router.get("/salary-structure/{employeeId}")
def get_employee_salary_structure(
    employeeId: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employeeId).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    struct = get_or_create_salary_structure(db, emp)

    gross = round(
        struct.baseSalary + struct.hra + struct.conveyanceAllowance +
        struct.medicalAllowance + struct.specialAllowance, 2
    )

    return {
        "success": True,
        "employee": {
            "id": emp.id,
            "name": f"{emp.firstName} {emp.lastName}",
            "code": emp.employeeCode,
            "designation": emp.designation,
            "department": emp.department
        },
        "structure": {
            "id": struct.id,
            "baseSalary": struct.baseSalary,
            "hra": struct.hra,
            "conveyanceAllowance": struct.conveyanceAllowance,
            "medicalAllowance": struct.medicalAllowance,
            "specialAllowance": struct.specialAllowance,
            "totalGross": gross,
            "pfDeduction": struct.pfDeduction,
            "taxDeduction": struct.taxDeduction,
            "professionalTax": struct.professionalTax,
            "overtimeHourlyRate": struct.overtimeHourlyRate,
            "effectiveDate": struct.effectiveDate,
            "isActive": struct.isActive,
            "updatedAt": struct.updatedAt.isoformat() if struct.updatedAt else None
        }
    }

@router.put("/salary-structure/{employeeId}")
def update_salary_structure(
    employeeId: str,
    payload: SalaryStructureUpdateRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employeeId).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    struct = get_or_create_salary_structure(db, emp)

    struct.baseSalary = payload.baseSalary
    struct.hra = payload.hra
    struct.conveyanceAllowance = payload.conveyanceAllowance or 2000.0
    struct.medicalAllowance = payload.medicalAllowance or 1500.0
    struct.specialAllowance = payload.specialAllowance or 3500.0
    struct.pfDeduction = payload.pfDeduction or 3600.0
    struct.taxDeduction = payload.taxDeduction or 2500.0
    struct.professionalTax = payload.professionalTax or 200.0
    struct.overtimeHourlyRate = payload.overtimeHourlyRate or round(payload.baseSalary / 200.0, 2)
    if payload.effectiveDate:
        struct.effectiveDate = payload.effectiveDate
    struct.updatedAt = datetime.utcnow()

    # Also update Employee profile fields for consistency
    emp.baseSalary = payload.baseSalary
    emp.hra = payload.hra
    emp.allowances = struct.conveyanceAllowance + struct.medicalAllowance + struct.specialAllowance
    emp.pfDeduction = struct.pfDeduction
    emp.taxDeduction = struct.taxDeduction

    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="SALARY_STRUCTURE_UPDATED",
        target_entity="EmployeeSalaryStructure",
        target_id=struct.id,
        details=f"Updated salary structure for {emp.firstName} {emp.lastName}. New Base: {struct.baseSalary}",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": "Salary structure updated successfully",
        "data": {
            "employeeId": emp.id,
            "baseSalary": struct.baseSalary,
            "hra": struct.hra,
            "allowances": emp.allowances,
            "overtimeHourlyRate": struct.overtimeHourlyRate
        }
    }

@router.post("/salary-revision")
def create_salary_revision(
    payload: SalaryRevisionRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == payload.employeeId).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    struct = get_or_create_salary_structure(db, emp)

    old_base = struct.baseSalary
    old_gross = round(struct.baseSalary + struct.hra + struct.conveyanceAllowance + struct.medicalAllowance + struct.specialAllowance, 2)

    new_conveyance = payload.newConveyance or 2000.0
    new_medical = payload.newMedical or 1500.0
    new_special = payload.newSpecial or 3500.0
    new_gross = round(payload.newBase + payload.newHra + new_conveyance + new_medical + new_special, 2)

    increment_pct = round(((new_gross - old_gross) / old_gross) * 100, 2) if old_gross > 0 else 0.0

    # 1. Record revision history
    rev = SalaryRevision(
        employeeId=emp.id,
        previousGross=old_gross,
        newGross=new_gross,
        incrementPercentage=increment_pct,
        previousBase=old_base,
        newBase=payload.newBase,
        effectiveDate=payload.effectiveDate,
        reason=payload.reason,
        revisedBy=current_user.email,
        notes=payload.notes
    )
    db.add(rev)

    # 2. Update current active salary structure
    struct.baseSalary = payload.newBase
    struct.hra = payload.newHra
    struct.conveyanceAllowance = new_conveyance
    struct.medicalAllowance = new_medical
    struct.specialAllowance = new_special
    struct.pfDeduction = payload.newPf or struct.pfDeduction
    struct.taxDeduction = payload.newTax or struct.taxDeduction
    struct.overtimeHourlyRate = payload.newOvertimeRate or round(payload.newBase / 200.0, 2)
    struct.effectiveDate = payload.effectiveDate
    struct.updatedAt = datetime.utcnow()

    # 3. Update employee master record
    emp.baseSalary = payload.newBase
    emp.hra = payload.newHra
    emp.allowances = new_conveyance + new_medical + new_special
    emp.pfDeduction = struct.pfDeduction
    emp.taxDeduction = struct.taxDeduction

    db.commit()

    # 4. Notify employee
    if emp.userId:
        create_user_notification(
            db=db,
            user_id=emp.userId,
            title="Compensation Revision Notice",
            message=f"Your compensation has been revised effective {payload.effectiveDate} ({payload.reason}). New Gross: Rs. {new_gross} (+{increment_pct}%).",
            type="PAYROLL"
        )

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="SALARY_REVISION_CREATED",
        target_entity="SalaryRevision",
        target_id=rev.id,
        details=f"Revised compensation for {emp.firstName} {emp.lastName}: Gross {old_gross} -> {new_gross} (+{increment_pct}%). Reason: {payload.reason}",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Salary revision applied successfully (+{increment_pct}%)",
        "data": {
            "revisionId": rev.id,
            "employeeId": emp.id,
            "previousGross": old_gross,
            "newGross": new_gross,
            "incrementPercentage": increment_pct,
            "effectiveDate": payload.effectiveDate,
            "reason": payload.reason
        }
    }

@router.get("/salary-revision/{employeeId}")
def get_salary_revision_history(
    employeeId: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    revisions = db.query(SalaryRevision).filter(
        SalaryRevision.employeeId == employeeId
    ).order_by(SalaryRevision.createdAt.desc()).all()

    return {
        "success": True,
        "count": len(revisions),
        "data": [
            {
                "id": r.id,
                "previousGross": r.previousGross,
                "newGross": r.newGross,
                "incrementPercentage": r.incrementPercentage,
                "previousBase": r.previousBase,
                "newBase": r.newBase,
                "effectiveDate": r.effectiveDate,
                "reason": r.reason,
                "revisedBy": r.revisedBy,
                "notes": r.notes,
                "createdAt": r.createdAt.isoformat() if r.createdAt else None
            } for r in revisions
        ]
    }

@router.patch("/{id}/adjust")
def adjust_payroll(
    id: str,
    payload: PayrollAdjustRequest,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    p = db.query(Payroll).filter(Payroll.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    if p.isLocked:
        raise HTTPException(status_code=400, detail="Cannot adjust locked payroll cycle")

    p.bonus = payload.bonus or 0.0
    p.variablePay = payload.variablePay or 0.0
    p.otherDeductions = payload.otherDeductions or 0.0
    p.remarks = payload.remarks

    # Recompute
    ot_pay = getattr(p, "overtimePay", 0.0) or 0.0
    p.grossSalary = round(p.baseSalary + p.allowances + ot_pay + p.bonus + p.variablePay, 2)
    p.totalDeductions = round(p.pf + p.tax + p.lopDeduction + p.otherDeductions, 2)
    p.netSalary = round(max(0.0, p.grossSalary - p.totalDeductions), 2)
    p.updatedAt = datetime.utcnow()

    db.commit()
    db.refresh(p)

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="PAYROLL_ADJUSTED",
        target_entity="Payroll",
        target_id=p.id,
        details=f"Adjusted payroll for employee {p.employeeId}: Bonus {p.bonus}, Var {p.variablePay}, Ded {p.otherDeductions}",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": "Payroll adjustment applied successfully",
        "data": serialize_payroll(p)
    }

@router.patch("/{id}/lock")
def lock_payroll(
    id: str,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db)
):
    p = db.query(Payroll).filter(Payroll.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    p.isLocked = True
    p.lockedAt = datetime.utcnow()
    p.status = "PROCESSED"
    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="PAYROLL_LOCKED",
        target_entity="Payroll",
        target_id=p.id,
        details=f"Locked payroll cycle {p.month}/{p.year} for employee {p.employeeId}",
        ip_address=get_client_ip(request)
    )

    return {"success": True, "message": "Payroll cycle locked successfully", "data": serialize_payroll(p)}

@router.post("/{id}/disburse")
def disburse_payroll(
    id: str,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db)
):
    p = db.query(Payroll).filter(Payroll.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    import random
    ref = f"SIM-NEFT-{random.randint(10000000, 99999999)}"

    p.status = "PAID"
    p.paymentDate = datetime.utcnow()
    p.transactionReference = ref
    p.isLocked = True
    db.commit()

    # Send Notification Email
    emp = p.employee
    if emp and emp.user:
        send_notification_email(
            db=db,
            to=emp.user.email,
            email_type="PAYROLL_PROCESSED",
            data={
                "name": f"{emp.firstName} {emp.lastName}",
                "monthYear": f"{calendar.month_name[p.month]} {p.year}",
                "grossSalary": f"{p.grossSalary:,.2f}",
                "totalDeductions": f"{p.totalDeductions:,.2f}",
                "netSalary": f"{p.netSalary:,.2f}"
            },
            user_id=emp.userId
        )

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="PAYROLL_DISBURSED",
        target_entity="Payroll",
        target_id=p.id,
        details=f"Disbursed salary Rs. {p.netSalary} (Ref: {ref}) to employee {p.employeeId}",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Salary disbursed successfully! Ref: {ref}",
        "transactionReference": ref,
        "data": serialize_payroll(p)
    }

@router.get("/{id}/payslip")
def download_payslip_pdf(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = db.query(Payroll).filter(Payroll.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    # Access control: Employee can only download their own payslip
    if current_user.role == "EMPLOYEE" and current_user.employee:
        if p.employeeId != current_user.employee.id:
            raise HTTPException(status_code=403, detail="You do not have permission to access this salary slip")

    emp = p.employee
    user = emp.user if emp else None

    pdf_bytes = generate_salary_slip_pdf(payroll=p, employee=emp, user=user)

    filename = f"SalarySlip_{emp.employeeCode}_{p.month}_{p.year}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
