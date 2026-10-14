import calendar
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from models import User, Employee, Payroll, Attendance, LeaveRequest
from core.security import get_current_user, require_roles, get_client_ip
from services import log_audit, send_notification_email, generate_salary_slip_pdf

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])

class PayrollGenerateRequest(BaseModel):
    month: Optional[int] = None
    year: Optional[int] = None
    employeeId: Optional[str] = None

class PayrollAdjustRequest(BaseModel):
    bonus: Optional[float] = 0.0
    otherDeductions: Optional[float] = 0.0
    remarks: Optional[str] = None

def serialize_payroll(p: Payroll):
    return {
        "id": p.id,
        "employeeId": p.employeeId,
        "month": p.month,
        "year": p.year,
        "totalWorkingDays": p.totalWorkingDays,
        "presentDays": p.presentDays,
        "paidLeaveDays": p.paidLeaveDays,
        "lopDays": p.lopDays,
        "baseSalary": p.baseSalary,
        "hra": p.hra,
        "allowances": p.allowances,
        "bonus": p.bonus,
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
        } if hasattr(p.employee, 'employee') or (hasattr(p, 'employee') and p.employee) else None
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
    days_in_month = calendar.monthrange(target_year, target_month)[1]

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

        # 1. Attendance records
        atts = db.query(Attendance).filter(
            Attendance.employeeId == emp.id,
            Attendance.date.startswith(date_prefix)
        ).all()

        present_count = len([a for a in atts if a.status == "PRESENT"])
        half_day_count = len([a for a in atts if a.status == "HALF_DAY"])
        effective_present = float(present_count + half_day_count * 0.5)

        # 2. Approved leaves
        approved_leaves = db.query(LeaveRequest).filter(
            LeaveRequest.employeeId == emp.id,
            LeaveRequest.status == "APPROVED",
            LeaveRequest.startDate.startswith(date_prefix)
        ).all()

        lop_days = sum(l.totalDays for l in approved_leaves if l.isLossOfPay or l.leaveType == "LOP")
        paid_leaves = sum(l.totalDays for l in approved_leaves if not l.isLossOfPay and l.leaveType != "LOP")

        accounted = effective_present + paid_leaves + lop_days
        unaccounted = max(0.0, float(days_in_month) - accounted)
        total_lop = lop_days + (unaccounted if atts else 0.0)

        # 3. Calculation formula
        base_salary = emp.baseSalary
        hra = emp.hra
        allowances = emp.allowances
        bonus = existing.bonus if existing else 0.0
        gross_salary = base_salary + hra + allowances + bonus

        per_day = base_salary / float(days_in_month)
        lop_deduction = round(per_day * total_lop, 2)
        pf = emp.pfDeduction
        tax = emp.taxDeduction
        other_deductions = existing.otherDeductions if existing else 0.0
        total_deductions = round(pf + tax + lop_deduction + other_deductions, 2)
        net_salary = round(max(0.0, gross_salary - total_deductions), 2)

        if existing:
            existing.totalWorkingDays = days_in_month
            existing.presentDays = effective_present
            existing.paidLeaveDays = paid_leaves
            existing.lopDays = total_lop
            existing.baseSalary = base_salary
            existing.hra = hra
            existing.allowances = allowances
            existing.bonus = bonus
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
                presentDays=effective_present,
                paidLeaveDays=paid_leaves,
                lopDays=total_lop,
                baseSalary=base_salary,
                hra=hra,
                allowances=allowances,
                bonus=bonus,
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

        processed += 1

    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="PAYROLL_GENERATED",
        target_entity="Payroll",
        details=f"Generated payroll cycle {target_month}/{target_year} for {processed} staff members",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Payroll generated for {processed} employees ({target_month}/{target_year})",
        "processedCount": processed
    }

@router.get("/my")
def get_my_payroll(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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

@router.get("")
def get_all_payrolls(
    month: Optional[int] = None,
    year: Optional[int] = None,
    department: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    query = db.query(Payroll)

    if month and month != "ALL":
        query = query.filter(Payroll.month == int(month))
    if year and year != "ALL":
        query = query.filter(Payroll.year == int(year))
    if status_filter and status_filter != "ALL":
        query = query.filter(Payroll.status == status_filter)
    if department and department != "ALL":
        query = query.join(Employee).filter(Employee.department == department)

    payrolls = query.order_by(Payroll.year.desc(), Payroll.month.desc()).all()
    return {
        "success": True,
        "count": len(payrolls),
        "data": [serialize_payroll(p) for p in payrolls]
    }

@router.get("/{id}")
def get_payroll_by_id(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Payroll).filter(Payroll.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    if current_user.role == "EMPLOYEE" and current_user.employee and current_user.employee.id != p.employeeId:
        raise HTTPException(status_code=403, detail="Unauthorized")

    return {
        "success": True,
        "data": serialize_payroll(p)
    }

@router.post("/{id}/adjust")
def adjust_payroll(
    id: str,
    payload: PayrollAdjustRequest,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    p = db.query(Payroll).filter(Payroll.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    if p.isLocked:
        raise HTTPException(status_code=400, detail="Cannot modify locked payroll record")

    p.bonus = float(payload.bonus or 0.0)
    p.otherDeductions = float(payload.otherDeductions or 0.0)
    p.grossSalary = round(p.baseSalary + p.hra + p.allowances + p.bonus, 2)
    p.totalDeductions = round(p.pf + p.tax + p.lopDeduction + p.otherDeductions, 2)
    p.netSalary = round(max(0.0, p.grossSalary - p.totalDeductions), 2)
    if payload.remarks:
        p.remarks = payload.remarks
    p.updatedAt = datetime.utcnow()

    db.commit()
    db.refresh(p)

    return {
        "success": True,
        "message": "Manual adjustment saved",
        "data": serialize_payroll(p)
    }

@router.post("/{id}/lock")
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
    p.updatedAt = datetime.utcnow()
    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="PAYROLL_LOCKED",
        target_entity="Payroll",
        target_id=id,
        details=f"Locked payroll {id} for employee {p.employeeId}",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": "Payroll locked successfully. No further modifications allowed.",
        "data": serialize_payroll(p)
    }

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

    txn_ref = f"SIM-NEFT-{int(datetime.utcnow().timestamp())}"[-12:]
    p.status = "PAID"
    p.paymentDate = datetime.utcnow()
    p.paymentMethod = "NEFT / DIRECT_BANK_TRANSFER"
    p.transactionReference = txn_ref
    p.isLocked = True
    if not p.lockedAt:
        p.lockedAt = datetime.utcnow()
    p.updatedAt = datetime.utcnow()

    db.commit()
    db.refresh(p)

    # Email notification to employee
    if p.employee and p.employee.user:
        send_notification_email(
            db=db,
            to=p.employee.user.email,
            email_type="PAYROLL_PROCESSED",
            user_id=p.employee.user.id,
            data={
                "name": f"{p.employee.firstName} {p.employee.lastName}",
                "monthYear": f"{calendar.month_name[p.month]} {p.year}",
                "grossSalary": p.grossSalary,
                "totalDeductions": p.totalDeductions,
                "netSalary": p.netSalary,
                "txnRef": txn_ref
            }
        )

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="PAYROLL_DISBURSED",
        target_entity="Payroll",
        target_id=id,
        details=f"Disbursed Rs. {p.netSalary} to employee {p.employee.employeeCode}. Ref: {txn_ref}",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Salary disbursement simulated successfully! Ref: {txn_ref}",
        "data": serialize_payroll(p)
    }

@router.get("/{id}/payslip")
def download_payslip(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Payroll).filter(Payroll.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    if current_user.role == "EMPLOYEE" and current_user.employee and current_user.employee.id != p.employeeId:
        raise HTTPException(status_code=403, detail="Unauthorized")

    pdf_bytes = generate_salary_slip_pdf(p, p.employee, p.employee.user if p.employee else None)

    filename = f"SalarySlip_{p.employee.employeeCode}_{p.month}_{p.year}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
