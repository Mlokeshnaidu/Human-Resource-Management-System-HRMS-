import io
import csv
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from backend.database import get_db
from backend.models import User, Employee, Attendance, LeaveRequest, Payroll, AuditLog
from backend.auth_utils import require_roles

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(Employee.status == "ACTIVE").count()

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    today_records = db.query(Attendance).filter(Attendance.date == today_str).all()
    present_today = len([a for a in today_records if a.status == "PRESENT"])
    half_day_today = len([a for a in today_records if a.status == "HALF_DAY"])
    absent_today = max(0, active_employees - (present_today + half_day_today))

    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "PENDING").count()

    now = datetime.utcnow()
    curr_payrolls = db.query(Payroll).filter(
        Payroll.month == now.month,
        Payroll.year == now.year
    ).all()

    total_disbursed = sum(p.netSalary for p in curr_payrolls)
    locked_count = len([p for p in curr_payrolls if p.isLocked])

    # Department breakdown
    dept_counts = db.query(Employee.department, func.count(Employee.id)).group_by(Employee.department).all()

    # Recent 5 audits
    recent_audits = db.query(AuditLog).order_by(AuditLog.createdAt.desc()).limit(5).all()

    return {
        "success": True,
        "data": {
            "totalEmployees": total_employees,
            "activeEmployees": active_employees,
            "todayAttendance": {
                "present": present_today,
                "halfDay": half_day_today,
                "absent": absent_today,
                "totalLogged": len(today_records)
            },
            "pendingLeaves": pending_leaves,
            "currentPayroll": {
                "month": now.month,
                "year": now.year,
                "totalRecords": len(curr_payrolls),
                "totalAmount": round(total_disbursed, 2),
                "lockedCount": locked_count
            },
            "departments": [{"name": d[0], "count": d[1]} for d in dept_counts],
            "recentAudits": [
                {
                    "id": a.id,
                    "action": a.action,
                    "targetEntity": a.targetEntity,
                    "userEmail": a.userEmail,
                    "details": a.details,
                    "createdAt": a.createdAt.isoformat()
                } for a in recent_audits
            ]
        }
    }

@router.get("/attendance")
def get_attendance_report(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    department: Optional[str] = None,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    query = db.query(Attendance)
    if startDate and endDate:
        query = query.filter(Attendance.date >= startDate, Attendance.date <= endDate)
    if department and department != "ALL":
        query = query.join(Employee).filter(Employee.department == department)

    records = query.order_by(Attendance.date.desc()).all()

    present = len([r for r in records if r.status == "PRESENT"])
    half_day = len([r for r in records if r.status == "HALF_DAY"])
    absent = len([r for r in records if r.status == "ABSENT"])
    total_hours = sum(r.workingHours for r in records)

    return {
        "success": True,
        "summary": {
            "totalRecords": len(records),
            "present": present,
            "halfDay": half_day,
            "absent": absent,
            "totalHours": round(total_hours, 2),
            "averageHours": round(total_hours / len(records), 2) if records else 0
        },
        "data": [
            {
                "id": r.id,
                "employeeCode": r.employee.employeeCode if r.employee else "",
                "employeeName": f"{r.employee.firstName} {r.employee.lastName}" if r.employee else "",
                "department": r.employee.department if r.employee else "",
                "date": r.date,
                "checkIn": r.checkIn.isoformat() if r.checkIn else None,
                "checkOut": r.checkOut.isoformat() if r.checkOut else None,
                "workingHours": r.workingHours,
                "status": r.status,
                "isOverride": r.isOverride
            } for r in records
        ]
    }

@router.get("/leaves")
def get_leave_report(
    year: Optional[int] = None,
    department: Optional[str] = None,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    target_year = year or datetime.utcnow().year
    prefix = f"{target_year}-"

    query = db.query(LeaveRequest).filter(LeaveRequest.startDate.startswith(prefix))
    if department and department != "ALL":
        query = query.join(Employee).filter(Employee.department == department)

    leaves = query.order_by(LeaveRequest.createdAt.desc()).all()

    approved = len([l for l in leaves if l.status == "APPROVED"])
    pending = len([l for l in leaves if l.status == "PENDING"])
    rejected = len([l for l in leaves if l.status == "REJECTED"])
    lop = len([l for l in leaves if l.isLossOfPay or l.leaveType == "LOP"])

    return {
        "success": True,
        "summary": {
            "totalRequests": len(leaves),
            "approved": approved,
            "pending": pending,
            "rejected": rejected,
            "lossOfPayCount": lop
        },
        "data": [
            {
                "id": l.id,
                "employeeCode": l.employee.employeeCode if l.employee else "",
                "employeeName": f"{l.employee.firstName} {l.employee.lastName}" if l.employee else "",
                "department": l.employee.department if l.employee else "",
                "leaveType": l.leaveType,
                "startDate": l.startDate,
                "endDate": l.endDate,
                "totalDays": l.totalDays,
                "status": l.status,
                "isLossOfPay": l.isLossOfPay
            } for l in leaves
        ]
    }

@router.get("/payroll")
def get_payroll_report(
    month: Optional[int] = None,
    year: Optional[int] = None,
    department: Optional[str] = None,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    m = month or now.month
    y = year or now.year

    query = db.query(Payroll).filter(Payroll.month == m, Payroll.year == y)
    if department and department != "ALL":
        query = query.join(Employee).filter(Employee.department == department)

    payrolls = query.all()

    gross_total = sum(p.grossSalary for p in payrolls)
    net_total = sum(p.netSalary for p in payrolls)
    deductions_total = sum(p.totalDeductions for p in payrolls)

    return {
        "success": True,
        "summary": {
            "month": m,
            "year": y,
            "staffCount": len(payrolls),
            "totalGross": round(gross_total, 2),
            "totalNet": round(net_total, 2),
            "totalDeductions": round(deductions_total, 2)
        },
        "data": [
            {
                "id": p.id,
                "employeeCode": p.employee.employeeCode if p.employee else "",
                "employeeName": f"{p.employee.firstName} {p.employee.lastName}" if p.employee else "",
                "department": p.employee.department if p.employee else "",
                "baseSalary": p.baseSalary,
                "grossSalary": p.grossSalary,
                "totalDeductions": p.totalDeductions,
                "netSalary": p.netSalary,
                "status": p.status
            } for p in payrolls
        ]
    }

@router.get("/export/csv")
def export_csv(
    type: str = "payroll",
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if type == "payroll":
        m = month or datetime.utcnow().month
        y = year or datetime.utcnow().year
        payrolls = db.query(Payroll).filter(Payroll.month == m, Payroll.year == y).all()

        writer.writerow(["Employee Code", "Name", "Department", "Base Salary", "Gross Salary", "Total Deductions", "Net Salary", "Status"])
        for p in payrolls:
            name = f"{p.employee.firstName} {p.employee.lastName}" if p.employee else ""
            dept = p.employee.department if p.employee else ""
            code = p.employee.employeeCode if p.employee else ""
            writer.writerow([code, name, dept, p.baseSalary, p.grossSalary, p.totalDeductions, p.netSalary, p.status])
        filename = f"Payroll_Report_{m}_{y}.csv"

    elif type == "attendance":
        records = db.query(Attendance).order_by(Attendance.date.desc()).limit(500).all()
        writer.writerow(["Employee Code", "Name", "Date", "Check In", "Check Out", "Working Hours", "Status"])
        for r in records:
            name = f"{r.employee.firstName} {r.employee.lastName}" if r.employee else ""
            code = r.employee.employeeCode if r.employee else ""
            writer.writerow([code, name, r.date, r.checkIn or "", r.checkOut or "", r.workingHours, r.status])
        filename = "Attendance_Report.csv"

    else:
        leaves = db.query(LeaveRequest).order_by(LeaveRequest.createdAt.desc()).limit(500).all()
        writer.writerow(["Employee Code", "Name", "Leave Type", "Start Date", "End Date", "Total Days", "Status"])
        for l in leaves:
            name = f"{l.employee.firstName} {l.employee.lastName}" if l.employee else ""
            code = l.employee.employeeCode if l.employee else ""
            writer.writerow([code, name, l.leaveType, l.startDate, l.endDate, l.totalDays, l.status])
        filename = "Leave_Report.csv"

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export/pdf")
def export_pdf(
    type: str = "payroll",
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    normal = styles["Normal"]

    elements = [
        Paragraph("<font size=16 color='#1e3a8a'><b>TECHFLOW ENTERPRISE HRMS</b></font>", normal),
        Paragraph(f"<font size=11 color='#475569'><b>Executive Analytics Report: {type.upper()}</b></font>", normal),
        Paragraph(f"<font size=8 color='#94a3b8'>Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</font>", normal),
        Spacer(1, 15)
    ]

    if type == "payroll":
        now = datetime.utcnow()
        payrolls = db.query(Payroll).filter(Payroll.month == now.month, Payroll.year == now.year).all()
        table_data = [["Code", "Name", "Dept", "Gross (₹)", "Deductions (₹)", "Net Pay (₹)"]]
        for p in payrolls:
            code = p.employee.employeeCode if p.employee else ""
            name = f"{p.employee.firstName} {p.employee.lastName}" if p.employee else ""
            dept = p.employee.department if p.employee else ""
            table_data.append([code, name, dept, f"{p.grossSalary:,.2f}", f"{p.totalDeductions:,.2f}", f"{p.netSalary:,.2f}"])
        t = Table(table_data, colWidths=[70, 110, 110, 75, 75, 82])
    else:
        records = db.query(Attendance).order_by(Attendance.date.desc()).limit(20).all()
        table_data = [["Code", "Name", "Date", "Hours", "Status"]]
        for r in records:
            code = r.employee.employeeCode if r.employee else ""
            name = f"{r.employee.firstName} {r.employee.lastName}" if r.employee else ""
            table_data.append([code, name, r.date, str(r.workingHours), r.status])
        t = Table(table_data, colWidths=[90, 150, 100, 80, 102])

    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(t)
    doc.build(elements)
    buffer.seek(0)

    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="HRMS_Analytics_{type}.pdf"'}
    )
