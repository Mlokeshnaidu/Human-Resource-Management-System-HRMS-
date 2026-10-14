import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from datetime import datetime, timedelta
from backend.database import engine, SessionLocal, Base
from backend.models import (
    User, Employee, Attendance, LeaveBalance, LeaveRequest, Payroll, AuditLog, Notification, EmailLog
)
from backend.auth_utils import hash_password
from backend.services.pdf_service import generate_salary_slip_pdf

def seed_database():
    print("==============================================================")
    print(" SEEDING MYSQL (hrms_db) WITH HRMS ENTERPRISE RECORDS")
    print("==============================================================")

    # 1. Create tables
    Base.metadata.create_all(bind=engine)
    print("[OK] Created/verified MySQL tables")

    db = SessionLocal()
    try:
        # Clean existing data
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
            phone="+1 555-0100",
            department="Executive Management",
            designation="Chief Technology Officer / Administrator",
            joiningDate=datetime(2023, 1, 15),
            status="ACTIVE",
            baseSalary=150000.0,
            hra=45000.0,
            allowances=15000.0,
            pfDeduction=10800.0,
            taxDeduction=12500.0,
            bankName="Silicon Valley Bank",
            accountNumber="987654321011",
            ifscCode="SVBK0001928",
            emergencyContact="+1 555-0999",
            address="450 University Ave, Palo Alto, CA"
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
            phone="+1 555-0101",
            department="Human Resources",
            designation="Senior HR Operations Lead",
            joiningDate=datetime(2023, 4, 1),
            status="ACTIVE",
            baseSalary=85000.0,
            hra=25500.0,
            allowances=8000.0,
            pfDeduction=6120.0,
            taxDeduction=5500.0,
            bankName="HDFC Bank",
            accountNumber="112233445566",
            ifscCode="HDFC0004921",
            emergencyContact="+1 555-0111",
            address="120 Market St, San Francisco, CA"
        )
        db.add(hr_emp)

        # 3. Staff Employees
        staff_data = [
            {
                "email": "employee@hrms.com",
                "password": emp_pwd,
                "role": "EMPLOYEE",
                "code": "HRMS-1002",
                "first": "Kiran",
                "last": "V",
                "phone": "+91 98765-43210",
                "dept": "Engineering",
                "desig": "Lead Software Engineer",
                "joining": datetime(2023, 8, 10),
                "base": 95000.0,
                "hra": 28500.0,
                "allow": 9500.0,
                "pf": 6840.0,
                "tax": 7200.0,
                "bank": "State Bank of India",
                "acc": "445566778899",
                "ifsc": "SBIN0001002"
            },
            {
                "email": "naveen.g@hrms.com",
                "password": welcome_pwd,
                "role": "EMPLOYEE",
                "code": "HRMS-1003",
                "first": "Naveen",
                "last": "G",
                "phone": "+91 98765-43211",
                "dept": "Engineering",
                "desig": "Senior Frontend Architect",
                "joining": datetime(2023, 11, 1),
                "base": 90000.0,
                "hra": 27000.0,
                "allow": 8000.0,
                "pf": 6480.0,
                "tax": 6800.0,
                "bank": "HDFC Bank",
                "acc": "556677889900",
                "ifsc": "HDFC0001003"
            },
            {
                "email": "ramya.p@hrms.com",
                "password": welcome_pwd,
                "role": "EMPLOYEE",
                "code": "HRMS-1004",
                "first": "Ramya",
                "last": "P",
                "phone": "+91 98765-43212",
                "dept": "Product & Design",
                "desig": "Staff Product Designer",
                "joining": datetime(2024, 1, 10),
                "base": 78000.0,
                "hra": 23400.0,
                "allow": 7000.0,
                "pf": 5616.0,
                "tax": 5200.0,
                "bank": "ICICI Bank",
                "acc": "667788990011",
                "ifsc": "ICIC0001004"
            },
            {
                "email": "guna.sekhar@hrms.com",
                "password": welcome_pwd,
                "role": "EMPLOYEE",
                "code": "HRMS-1005",
                "first": "Guna Sekhar",
                "last": "V",
                "phone": "+91 98765-43213",
                "dept": "Finance & Accounting",
                "desig": "Senior Financial Analyst",
                "joining": datetime(2024, 3, 15),
                "base": 72000.0,
                "hra": 21600.0,
                "allow": 6000.0,
                "pf": 5184.0,
                "tax": 4800.0,
                "bank": "Axis Bank",
                "acc": "778899001122",
                "ifsc": "UTIB0001005"
            },
            {
                "email": "keerthi.m@hrms.com",
                "password": welcome_pwd,
                "role": "EMPLOYEE",
                "code": "HRMS-1006",
                "first": "Keerthi",
                "last": "M",
                "phone": "+91 98765-43214",
                "dept": "Sales & Marketing",
                "desig": "Growth Marketing Lead",
                "joining": datetime(2024, 7, 1),
                "base": 68000.0,
                "hra": 20400.0,
                "allow": 5500.0,
                "pf": 4896.0,
                "tax": 4400.0,
                "bank": "Kotak Mahindra Bank",
                "acc": "889900112233",
                "ifsc": "KKBK0001006"
            },
            {
                "email": "eeswar.m@hrms.com",
                "password": welcome_pwd,
                "role": "EMPLOYEE",
                "code": "HRMS-1007",
                "first": "Eeswar",
                "last": "M",
                "phone": "+91 98765-43215",
                "dept": "Engineering",
                "desig": "DevOps & Cloud Engineer",
                "joining": datetime(2024, 8, 15),
                "base": 70000.0,
                "hra": 21000.0,
                "allow": 6000.0,
                "pf": 5040.0,
                "tax": 4500.0,
                "bank": "State Bank of India",
                "acc": "990011223344",
                "ifsc": "SBIN0001007"
            }
        ]

        all_employees = [admin_emp, hr_emp]
        for item in staff_data:
            u = User(
                email=item["email"],
                password=item["password"],
                role=item["role"],
                isActive=True
            )
            db.add(u)
            db.flush()

            e = Employee(
                employeeCode=item["code"],
                userId=u.id,
                firstName=item["first"],
                lastName=item["last"],
                phone=item["phone"],
                department=item["dept"],
                designation=item["desig"],
                joiningDate=item["joining"],
                status="ACTIVE",
                baseSalary=item["base"],
                hra=item["hra"],
                allowances=item["allow"],
                pfDeduction=item["pf"],
                taxDeduction=item["tax"],
                bankName=item["bank"],
                accountNumber=item["acc"],
                ifscCode=item["ifsc"]
            )
            db.add(e)
            all_employees.append(e)

        db.flush()
        print(f"[OK] Seeded {len(all_employees)} staff accounts (Admin, HR, 5 Employees)")

        # 4. Leave Balances
        curr_year = 2026
        for emp in all_employees:
            db.add_all([
                LeaveBalance(employeeId=emp.id, year=curr_year, leaveType="CL", totalDays=12.0, usedDays=2.0, remainingDays=10.0),
                LeaveBalance(employeeId=emp.id, year=curr_year, leaveType="SL", totalDays=10.0, usedDays=1.0, remainingDays=9.0),
                LeaveBalance(employeeId=emp.id, year=curr_year, leaveType="PL", totalDays=15.0, usedDays=3.0, remainingDays=12.0),
            ])
        print("[OK] Initialized annual leave balances")

        # 5. Attendance records
        today = datetime.utcnow()
        for i in range(1, 11):
            day_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            for emp in all_employees:
                db.add(Attendance(
                    employeeId=emp.id,
                    date=day_str,
                    checkIn=datetime.strptime(f"{day_str} 09:00:00", "%Y-%m-%d %H:%M:%S"),
                    checkOut=datetime.strptime(f"{day_str} 18:00:00", "%Y-%m-%d %H:%M:%S"),
                    workingHours=9.0,
                    status="PRESENT"
                ))
        print("[OK] Seeded historical attendance logs")

        # 6. Sample Leave Requests
        sample_emp = all_employees[2]  # David Miller
        db.add(LeaveRequest(
            employeeId=sample_emp.id,
            leaveType="CL",
            startDate="2026-09-15",
            endDate="2026-09-16",
            totalDays=2.0,
            reason="Family medical consultation",
            status="APPROVED",
            reviewedBy="hr@hrms.com",
            reviewedAt=datetime(2026, 9, 14, 10, 30)
        ))
        db.add(LeaveRequest(
            employeeId=sample_emp.id,
            leaveType="SL",
            startDate="2026-10-20",
            endDate="2026-10-21",
            totalDays=2.0,
            reason="Dental appointment & recovery",
            status="PENDING"
        ))

        # 7. Sample Payrolls (September 2026 finalized & October 2026 active)
        sample_payroll = None
        for emp in all_employees:
            gross = emp.baseSalary + emp.hra + emp.allowances
            tot_ded = emp.pfDeduction + emp.taxDeduction
            net = gross - tot_ded

            p_sep = Payroll(
                employeeId=emp.id,
                month=9,
                year=2026,
                totalWorkingDays=30,
                presentDays=28.0,
                paidLeaveDays=2.0,
                lopDays=0.0,
                baseSalary=emp.baseSalary,
                hra=emp.hra,
                allowances=emp.allowances,
                bonus=2000.0,
                grossSalary=gross + 2000.0,
                pf=emp.pfDeduction,
                tax=emp.taxDeduction,
                lopDeduction=0.0,
                otherDeductions=0.0,
                totalDeductions=tot_ded,
                netSalary=net + 2000.0,
                status="PAID",
                isLocked=True,
                lockedAt=datetime(2026, 10, 1, 9, 0),
                paymentDate=datetime(2026, 10, 1, 14, 30),
                paymentMethod="NEFT / DIRECT_BANK_TRANSFER",
                transactionReference=f"SIM-NEFT-{emp.employeeCode.split('-')[1]}9281"
            )
            db.add(p_sep)
            if not sample_payroll:
                sample_payroll = p_sep

            p_oct = Payroll(
                employeeId=emp.id,
                month=10,
                year=2026,
                totalWorkingDays=31,
                presentDays=31.0,
                paidLeaveDays=0.0,
                lopDays=0.0,
                baseSalary=emp.baseSalary,
                hra=emp.hra,
                allowances=emp.allowances,
                bonus=0.0,
                grossSalary=gross,
                pf=emp.pfDeduction,
                tax=emp.taxDeduction,
                lopDeduction=0.0,
                otherDeductions=0.0,
                totalDeductions=tot_ded,
                netSalary=net,
                status="PROCESSED",
                isLocked=False
            )
            db.add(p_oct)

        # 8. Seed Audit Logs
        db.add(AuditLog(
            userEmail="admin@hrms.com",
            userRole="ADMIN",
            action="SYSTEM_INITIALIZED",
            targetEntity="System",
            details="MySQL database initialized and seeded with enterprise dataset",
            ipAddress="127.0.0.1"
        ))

        # 9. Seed Email Logs
        db.add(EmailLog(
            to="employee@hrms.com",
            subject="Welcome to HRMS Portal, Kiran V!",
            template="ONBOARDING",
            payload='{"employeeCode": "HRMS-1002"}',
            status="SENT"
        ))

        db.commit()
        print("[OK] Seeded payroll, leave, audit, and email logs")

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
