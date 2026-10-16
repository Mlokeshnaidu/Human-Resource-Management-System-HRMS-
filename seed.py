import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure project root is on Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from core.database import engine, SessionLocal, Base
from models import (
    User,
    Employee,
    Attendance,
    LeaveBalance,
    LeaveRequest,
    Payroll,
    AuditLog,
    Notification,
    EmailLog,
    Holiday,
    Shift,
    EmployeeShift,
    DepartmentShift,
    EmployeeSalaryStructure,
    SalaryRevision,
    NotificationPreference,
)
from core.security import hash_password
from services.holiday_service import DEFAULT_HOLIDAYS_2026
from services.shift_service import DEFAULT_SHIFTS

def seed_database():
    print("==============================================================")
    print(" SEEDING MYSQL (hrms_db) WITH PHASE 1 & 2 HRMS ENTERPRISE RECORDS")
    print("==============================================================")

    # 1. Create tables
    Base.metadata.create_all(bind=engine)
    print("[OK] Created/verified MySQL tables")

    db = SessionLocal()
    try:
        # Clean existing data in reverse foreign key order
        db.query(SalaryRevision).delete()
        db.query(EmployeeSalaryStructure).delete()
        db.query(DepartmentShift).delete()
        db.query(EmployeeShift).delete()
        db.query(Shift).delete()
        db.query(Holiday).delete()
        db.query(NotificationPreference).delete()
        db.query(EmailLog).delete()
        db.query(AuditLog).delete()
        db.query(Notification).delete()
        db.query(Attendance).delete()
        db.query(LeaveRequest).delete()
        db.query(LeaveBalance).delete()
        db.query(Payroll).delete()
        db.query(Employee).delete()
        db.query(User).delete()
        db.commit()
        print("[OK] Cleared prior records")

        admin_pwd = hash_password("Admin@123")
        hr_pwd = hash_password("Hr@123")
        emp_pwd = hash_password("Employee@123")
        welcome_pwd = hash_password("Welcome@123")

        # 1. Admin
        admin_user = User(
            email="admin@hrms.com",
            password=admin_pwd,
            role="ADMIN",
            isActive=True
        )
        db.add(admin_user)
        db.flush()

        admin_emp = Employee(
            employeeCode="HRMS-1000",
            userId=admin_user.id,
            firstName="Mandala",
            lastName="Lokesh",
            phone="+91 98765-43200",
            department="Executive Management",
            designation="Chief Technology Officer / Administrator",
            joiningDate=datetime(2023, 1, 15),
            status="ACTIVE",
            baseSalary=150000.0,
            hra=45000.0,
            allowances=15000.0,
            pfDeduction=10800.0,
            taxDeduction=12500.0,
            bankName="HDFC Bank",
            accountNumber="987654321011",
            ifscCode="HDFC0001928",
            emergencyContact="+91 98765-43299",
            address="Mindspace Cybercity, HITEC City, Hyderabad, Telangana 500081"
        )
        db.add(admin_emp)

        # 2. HR
        hr_user = User(
            email="hr@hrms.com",
            password=hr_pwd,
            role="HR",
            isActive=True
        )
        db.add(hr_user)
        db.flush()

        hr_emp = Employee(
            employeeCode="HRMS-1001",
            userId=hr_user.id,
            firstName="Giri",
            lastName="Prasad",
            phone="+91 98765-43201",
            department="Human Resources",
            designation="Lead Human Resources Business Partner",
            joiningDate=datetime(2023, 6, 1),
            status="ACTIVE",
            baseSalary=75000.0,
            hra=22500.0,
            allowances=8000.0,
            pfDeduction=5400.0,
            taxDeduction=4500.0,
            bankName="State Bank of India",
            accountNumber="987654321012",
            ifscCode="SBIN0001002",
            emergencyContact="+91 98765-43298",
            address="Koramangala 4th Block, Bengaluru, Karnataka 560034"
        )
        db.add(hr_emp)

        # 3. Staff Employees
        staff_data = [
            {
                "email": "employee@hrms.com", "pwd": emp_pwd, "code": "HRMS-1002",
                "first": "Kiran", "last": "V", "phone": "+91 98765-43202",
                "dept": "Engineering", "desig": "Lead Software Engineer",
                "join": datetime(2024, 2, 1), "base": 85000.0, "hra": 25500.0, "allow": 10000.0,
                "pf": 6120.0, "tax": 5500.0, "bank": "ICICI Bank", "acc": "987654321013",
                "ifsc": "ICIC0000002", "addr": "Whitefield, Bengaluru, Karnataka 560066"
            },
            {
                "email": "naveen.g@hrms.com", "pwd": welcome_pwd, "code": "HRMS-1003",
                "first": "Naveen", "last": "G", "phone": "+91 98765-43203",
                "dept": "Engineering", "desig": "Senior Frontend Architect",
                "join": datetime(2024, 3, 15), "base": 80000.0, "hra": 24000.0, "allow": 9000.0,
                "pf": 5760.0, "tax": 5000.0, "bank": "HDFC Bank", "acc": "987654321014",
                "ifsc": "HDFC0001928", "addr": "Indiranagar, Bengaluru, Karnataka 560038"
            },
            {
                "email": "ramya.p@hrms.com", "pwd": welcome_pwd, "code": "HRMS-1004",
                "first": "Ramya", "last": "P", "phone": "+91 98765-43204",
                "dept": "Product & Design", "desig": "Staff Product Designer",
                "join": datetime(2024, 4, 1), "base": 72000.0, "hra": 21600.0, "allow": 7500.0,
                "pf": 5184.0, "tax": 4200.0, "bank": "Axis Bank", "acc": "987654321015",
                "ifsc": "UTIB0000001", "addr": "Jayanagar, Bengaluru, Karnataka 560011"
            },
            {
                "email": "guna.sekhar@hrms.com", "pwd": welcome_pwd, "code": "HRMS-1005",
                "first": "Guna Sekhar", "last": "V", "phone": "+91 98765-43205",
                "dept": "Finance", "desig": "Senior Financial Analyst",
                "join": datetime(2024, 5, 10), "base": 68000.0, "hra": 20400.0, "allow": 7000.0,
                "pf": 4896.0, "tax": 3800.0, "bank": "Kotak Mahindra Bank", "acc": "987654321016",
                "ifsc": "KKBK0000001", "addr": "Gachibowli, Hyderabad, Telangana 500032"
            },
            {
                "email": "keerthi.m@hrms.com", "pwd": welcome_pwd, "code": "HRMS-1006",
                "first": "Keerthi", "last": "M", "phone": "+91 98765-43206",
                "dept": "Marketing", "desig": "Growth Marketing Lead",
                "join": datetime(2024, 6, 1), "base": 65000.0, "hra": 19500.0, "allow": 6500.0,
                "pf": 4680.0, "tax": 3500.0, "bank": "State Bank of India", "acc": "987654321017",
                "ifsc": "SBIN0001002", "addr": "Banjara Hills, Hyderabad, Telangana 500034"
            },
            {
                "email": "eeswar.m@hrms.com", "pwd": welcome_pwd, "code": "HRMS-1007",
                "first": "Eeswar", "last": "M", "phone": "+91 98765-43207",
                "dept": "DevOps", "desig": "DevOps & Cloud Engineer",
                "join": datetime(2024, 7, 15), "base": 78000.0, "hra": 23400.0, "allow": 8500.0,
                "pf": 5616.0, "tax": 4800.0, "bank": "ICICI Bank", "acc": "987654321018",
                "ifsc": "ICIC0000002", "addr": "Madhapur, Hyderabad, Telangana 500081"
            }
        ]

        all_employees = [admin_emp, hr_emp]
        all_users = [admin_user, hr_user]

        for s in staff_data:
            u = User(
                email=s["email"],
                password=s["pwd"],
                role="EMPLOYEE",
                isActive=True
            )
            db.add(u)
            db.flush()
            all_users.append(u)

            e = Employee(
                employeeCode=s["code"],
                userId=u.id,
                firstName=s["first"],
                lastName=s["last"],
                phone=s["phone"],
                department=s["dept"],
                designation=s["desig"],
                joiningDate=s["join"],
                status="ACTIVE",
                baseSalary=s["base"],
                hra=s["hra"],
                allowances=s["allow"],
                pfDeduction=s["pf"],
                taxDeduction=s["tax"],
                bankName=s["bank"],
                accountNumber=s["acc"],
                ifscCode=s["ifsc"],
                emergencyContact="+91 98765-43200",
                address=s["addr"]
            )
            db.add(e)
            all_employees.append(e)

        db.flush()
        print(f"[OK] Seeded {len(all_users)} user accounts and employee profiles")

        # 4. Seed Notification Preferences for all users
        for u in all_users:
            pref = NotificationPreference(
                userId=u.id,
                emailEnabled=True,
                leaveAlerts=True,
                payrollAlerts=True,
                attendanceAlerts=True,
                announcements=True
            )
            db.add(pref)
        print(f"[OK] Seeded notification preferences for {len(all_users)} users")

        # 5. Seed Holidays for 2026
        for h in DEFAULT_HOLIDAYS_2026:
            hol = Holiday(
                name=h["name"],
                date=h["date"],
                endDate=h["date"],
                type=h["type"],
                region=h["region"],
                description=h["description"],
                year=2026,
                isOptional=h["isOptional"]
            )
            db.add(hol)
        db.flush()
        print(f"[OK] Seeded {len(DEFAULT_HOLIDAYS_2026)} corporate and regional holidays for 2026")

        # 6. Seed Shifts
        shift_map = {}
        for s in DEFAULT_SHIFTS:
            sh = Shift(**s)
            db.add(sh)
            db.flush()
            shift_map[sh.code] = sh
        print(f"[OK] Seeded {len(shift_map)} work shifts (GEN, MORN, NIGHT, FLEX, REMOTE)")

        # 7. Seed Department Shift Assignments
        dept_shift_rules = [
            ("Engineering", "FLEX"),
            ("DevOps", "NIGHT"),
            ("Human Resources", "GEN"),
            ("Finance", "GEN"),
            ("Product & Design", "GEN"),
            ("Marketing", "GEN"),
            ("Executive Management", "GEN"),
        ]
        for dept, code in dept_shift_rules:
            if code in shift_map:
                ds = DepartmentShift(
                    department=dept,
                    shiftId=shift_map[code].id,
                    assignedBy="admin@hrms.com"
                )
                db.add(ds)
        print("[OK] Seeded department shift schedules")

        # 8. Seed Employee Shift Assignments & Salary Structures
        for emp in all_employees:
            # Shift assignment
            assigned_code = "FLEX" if emp.department == "Engineering" else ("NIGHT" if emp.department == "DevOps" else "GEN")
            sh = shift_map.get(assigned_code, shift_map["GEN"])
            emp_shift = EmployeeShift(
                employeeId=emp.id,
                shiftId=sh.id,
                startDate="2026-01-01",
                assignedBy="hr@hrms.com",
                notes=f"Default schedule for {emp.designation}",
                isActive=True
            )
            db.add(emp_shift)

            # Detailed Salary Structure
            conv = 2000.0
            med = 1500.0
            spec = max(1000.0, emp.allowances - conv - med)
            struct = EmployeeSalaryStructure(
                employeeId=emp.id,
                baseSalary=emp.baseSalary,
                hra=emp.hra,
                conveyanceAllowance=conv,
                medicalAllowance=med,
                specialAllowance=spec,
                pfDeduction=emp.pfDeduction,
                taxDeduction=emp.taxDeduction,
                professionalTax=200.0,
                overtimeHourlyRate=round(emp.baseSalary / 200.0, 2),
                effectiveDate="2026-01-01",
                isActive=True
            )
            db.add(struct)

            # Leave Balances
            for lt, days in [("CL", 12.0), ("SL", 10.0), ("PL", 15.0)]:
                lb = LeaveBalance(
                    employeeId=emp.id,
                    year=2026,
                    leaveType=lt,
                    totalDays=days,
                    usedDays=1.0 if lt == "CL" else 0.0,
                    remainingDays=days - (1.0 if lt == "CL" else 0.0)
                )
                db.add(lb)

        db.flush()
        print("[OK] Seeded employee shifts, salary structures, and leave quotas")

        # 9. Seed Salary Revisions for select employees
        kiran_emp = next((e for e in all_employees if e.employeeCode == "HRMS-1002"), None)
        if kiran_emp:
            rev_kiran = SalaryRevision(
                employeeId=kiran_emp.id,
                previousGross=110000.0,
                newGross=120500.0,
                incrementPercentage=9.55,
                previousBase=78000.0,
                newBase=85000.0,
                effectiveDate="2026-04-01",
                reason="Annual Performance Appraisal & Technical Leadership Promotion",
                revisedBy="admin@hrms.com",
                notes="Consistently exceeded sprint delivery targets and led architecture revamp."
            )
            db.add(rev_kiran)

        naveen_emp = next((e for e in all_employees if e.employeeCode == "HRMS-1003"), None)
        if naveen_emp:
            rev_nav = SalaryRevision(
                employeeId=naveen_emp.id,
                previousGross=102000.0,
                newGross=113000.0,
                incrementPercentage=10.78,
                previousBase=72000.0,
                newBase=80000.0,
                effectiveDate="2026-05-01",
                reason="Promotion to Senior Frontend Architect",
                revisedBy="admin@hrms.com",
                notes="Delivered comprehensive UI performance optimizations and design system."
            )
            db.add(rev_nav)
        print("[OK] Seeded historical compensation revision records")

        # 10. Seed Attendance Records with Shift Timings, Overtime, and Late logs
        now = datetime.utcnow()
        for emp in all_employees:
            assigned_code = "FLEX" if emp.department == "Engineering" else ("NIGHT" if emp.department == "DevOps" else "GEN")
            sh = shift_map.get(assigned_code, shift_map["GEN"])

            # 7 historical days
            for d in range(1, 8):
                day_str = f"2026-10-0{d}"
                # Oct 3 & 4 are Saturday & Sunday
                if d in (3, 4):
                    continue

                is_late = (d == 5 and emp.employeeCode == "HRMS-1002")  # किरण is late on Oct 5 for testing
                late_mins = 25 if is_late else 0
                cin = datetime(2026, 10, d, 9, 25 if is_late else 0)
                cout = datetime(2026, 10, d, 18, 30 if d == 2 else 0)
                work_hrs = 9.0 if d == 2 else 8.0
                ot_hrs = 1.0 if d == 2 else 0.0

                att = Attendance(
                    employeeId=emp.id,
                    date=day_str,
                    checkIn=cin,
                    checkOut=cout,
                    workingHours=work_hrs,
                    status="PRESENT",
                    shiftId=sh.id,
                    isLate=is_late,
                    lateMinutes=late_mins,
                    isEarlyExit=False,
                    earlyExitMinutes=0,
                    overtimeHours=ot_hrs
                )
                db.add(att)

        print("[OK] Seeded shift-integrated attendance records with late and overtime metrics")

        # 11. Seed Leave Requests
        for emp in all_employees[2:]:
            lr = LeaveRequest(
                employeeId=emp.id,
                leaveType="CL",
                startDate="2026-10-12",
                endDate="2026-10-12",
                totalDays=1.0,
                reason="Personal family commitment",
                status="APPROVED",
                reviewedBy="hr@hrms.com",
                reviewedAt=datetime(2026, 10, 10, 11, 0),
                isLossOfPay=False
            )
            db.add(lr)

        # 12. Seed Payroll Records (September Paid & October Processed)
        for emp in all_employees:
            conv = 2000.0
            med = 1500.0
            spec = max(1000.0, emp.allowances - conv - med)
            tot_allow = conv + med + spec + emp.hra
            gross = emp.baseSalary + tot_allow
            tot_ded = emp.pfDeduction + emp.taxDeduction + 200.0  # + Prof Tax
            net = gross - tot_ded

            # Sept 2026 (Paid)
            p_sep = Payroll(
                employeeId=emp.id,
                month=9,
                year=2026,
                totalWorkingDays=30,
                standardWorkingDays=21,
                weekendDaysCount=8,
                holidaysCount=1,
                presentDays=28.0,
                paidLeaveDays=2.0,
                lopDays=0.0,
                baseSalary=emp.baseSalary,
                hra=emp.hra,
                conveyanceAllowance=conv,
                medicalAllowance=med,
                specialAllowance=spec,
                allowances=tot_allow,
                overtimeHours=4.0,
                overtimePay=round(4.0 * (emp.baseSalary / 200.0), 2),
                bonus=2000.0,
                variablePay=1500.0,
                grossSalary=gross + 3500.0 + round(4.0 * (emp.baseSalary / 200.0), 2),
                pf=emp.pfDeduction,
                tax=emp.taxDeduction,
                lopDeduction=0.0,
                otherDeductions=200.0,
                totalDeductions=tot_ded,
                netSalary=gross + 3500.0 + round(4.0 * (emp.baseSalary / 200.0), 2) - tot_ded,
                status="PAID",
                isLocked=True,
                lockedAt=datetime(2026, 10, 1, 9, 0),
                paymentDate=datetime(2026, 10, 1, 14, 30),
                paymentMethod="NEFT / DIRECT_BANK_TRANSFER",
                transactionReference=f"SIM-NEFT-{emp.employeeCode.split('-')[1]}9281"
            )
            db.add(p_sep)

            # Oct 2026 (Processed)
            p_oct = Payroll(
                employeeId=emp.id,
                month=10,
                year=2026,
                totalWorkingDays=31,
                standardWorkingDays=21,
                weekendDaysCount=8,
                holidaysCount=2,  # Gandhi Jayanti + Dussehra
                presentDays=30.0,
                paidLeaveDays=1.0,
                lopDays=0.0,
                baseSalary=emp.baseSalary,
                hra=emp.hra,
                conveyanceAllowance=conv,
                medicalAllowance=med,
                specialAllowance=spec,
                allowances=tot_allow,
                overtimeHours=2.0,
                overtimePay=round(2.0 * (emp.baseSalary / 200.0), 2),
                bonus=0.0,
                variablePay=0.0,
                grossSalary=gross + round(2.0 * (emp.baseSalary / 200.0), 2),
                pf=emp.pfDeduction,
                tax=emp.taxDeduction,
                lopDeduction=0.0,
                otherDeductions=200.0,
                totalDeductions=tot_ded,
                netSalary=gross + round(2.0 * (emp.baseSalary / 200.0), 2) - tot_ded,
                status="PROCESSED",
                isLocked=False
            )
            db.add(p_oct)

        # 13. Seed In-App Notifications & Broadcasts
        for u in all_users:
            # Leave update
            db.add(Notification(
                userId=u.id,
                title="Leave Application Approved",
                message="Your recent casual leave request has been reviewed and approved by HR.",
                type="LEAVE",
                isRead=False,
                createdAt=datetime.utcnow() - timedelta(hours=3)
            ))
            # Payroll processed
            db.add(Notification(
                userId=u.id,
                title="Monthly Payroll Processed",
                message="Your salary slip for September 2026 is generated and available for download.",
                type="PAYROLL",
                isRead=False,
                createdAt=datetime.utcnow() - timedelta(hours=12)
            ))
            # Broadcast announcement
            db.add(Notification(
                userId=u.id,
                title="Company Announcement: Diwali Holiday & Town Hall",
                message="Annual Town Hall meeting will be held on Oct 28 followed by Diwali festive schedule.",
                type="ANNOUNCEMENT",
                isRead=False,
                isBroadcast=True,
                targetDepartment="ALL",
                targetRole="ALL",
                createdAt=datetime.utcnow() - timedelta(days=1)
            ))

        # 14. Seed Audit Logs
        db.add(AuditLog(
            userEmail="admin@hrms.com",
            userRole="ADMIN",
            action="SYSTEM_INITIALIZED",
            targetEntity="System",
            details="MySQL database initialized and seeded with Phase 1 & 2 enterprise modules (Holidays, Notifications, Shifts, Advanced Compensation)",
            ipAddress="127.0.0.1"
        ))

        # 15. Seed Email Logs
        db.add(EmailLog(
            to="employee@hrms.com",
            subject="Welcome to HRMS Portal, Kiran V!",
            template="ONBOARDING",
            payload='{"employeeCode": "HRMS-1002"}',
            status="SENT"
        ))

        db.commit()
        print("[OK] Seeded payroll, leave, audit, email, and in-app notifications")

        print("==============================================================")
        print(" DATABASE SEEDING COMPLETED SUCCESSFULLY IN MYSQL (hrms_db)")
        print("==============================================================")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
