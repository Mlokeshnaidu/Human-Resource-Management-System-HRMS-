# Techflow Enterprise HRMS (Human Resource Management System)

A secure, scalable, full-stack Human Resource Management System (HRMS) built to manage employees, biometric-grade attendance, leaves, automated payroll with Loss of Pay (LOP) calculations, PDF salary slips, audit compliance, and analytics dashboards through role-based access control (Admin, HR, Employee).

---

## 🌟 Executive Summary & Deliverables

| Deliverable | Location in Repository | Description |
| :--- | :--- | :--- |
| **Backend Source Code** | [`backend/`](file:///c:/Users/manda/OneDrive/Desktop/ai%20saas%20backend%20training/Human%20Resource%20Management%20System%20%28HRMS/backend) | Python, FastAPI, SQLAlchemy ORM, MySQL (`hrms_db`), ReportLab, PyJWT, bcrypt |
| **Frontend Source Code** | [`frontend/`](file:///c:/Users/manda/OneDrive/Desktop/ai%20saas%20backend%20training/Human%20Resource%20Management%20System%20%28HRMS/frontend) | React 19, Vite, bespoke Vanilla CSS Design System, Lucide icons |
| **Database Schema (DDL)** | [`database/schema.sql`](file:///c:/Users/manda/OneDrive/Desktop/ai%20saas%20backend%20training/Human%20Resource%20Management%20System%20%28HRMS/database/schema.sql) | Clean MySQL InnoDB DDL statements with foreign keys & indexes |
| **Database Dump (Data + DDL)** | [`database/hrms_dump.sql`](file:///c:/Users/manda/OneDrive/Desktop/ai%20saas%20backend%20training/Human%20Resource%20Management%20System%20%28HRMS/database/hrms_dump.sql) | Full MySQL SQL dump with tables, relations, and pre-seeded sample data |
| **Postman API Collection** | [`postman/HRMS_API_Collection.postman_collection.json`](file:///c:/Users/manda/OneDrive/Desktop/ai%20saas%20backend%20training/Human%20Resource%20Management%20System%20%28HRMS/postman/HRMS_API_Collection.postman_collection.json) | 26 API requests across 7 modules with automated token handling |

---

## 🔑 Sample Test Credentials

All accounts come pre-configured with active profiles and historical logs:

| Role | Email Address | Password | Name & Department | Permissions & Scope |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@hrms.com` | `Admin@123` | **Mandala Lokesh** (Executive) | Full system governance, audit logs, payroll locking, staff overrides |
| **HR** | `hr@hrms.com` | `Hr@123` | **Giri Prasad** (HR) | Employee onboarding, leave approvals, attendance tracking, monthly payroll review |
| **EMPLOYEE** | `employee@hrms.com` | `Employee@123` | **Kiran V** (Engineering) | Lead Software Engineer - Attendance punch, leaves, payslip downloads |
| **EMPLOYEE** | `naveen.g@hrms.com` | `Welcome@123` | **Naveen G** (Engineering) | Senior Frontend Architect |
| **EMPLOYEE** | `ramya.p@hrms.com` | `Welcome@123` | **Ramya P** (Product & Design) | Staff Product Designer |
| **EMPLOYEE** | `guna.sekhar@hrms.com` | `Welcome@123` | **Guna Sekhar V** (Finance) | Senior Financial Analyst |
| **EMPLOYEE** | `keerthi.m@hrms.com` | `Welcome@123` | **Keerthi M** (Marketing) | Growth Marketing Lead |
| **EMPLOYEE** | `eeswar.m@hrms.com` | `Welcome@123` | **Eeswar M** (DevOps) | DevOps & Cloud Engineer |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.14)
- **MySQL Server**: Running on port 3306 (database: `hrms_db`)
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+ (tested on npm v11)

### 1. Backend Setup (FastAPI + MySQL)
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Seed MySQL database
python backend/seed.py

# 3. Start FastAPI server with Uvicorn
python -m uvicorn main:app --reload --port 5000
# Or simply: python main.py
```
*Backend server runs on `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`, Swagger Docs: `http://localhost:5000/docs`)*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend application launches on `http://localhost:5173` (or `http://localhost:5174`)*

### 3. Run Automated E2E Test Suite
The repository includes an automated end-to-end integration test runner in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File .\verify_all_features.ps1
```
Expected output:
```
=============================================================
  RUNNING FULL HRMS END-TO-END VERIFICATION SUITE
=============================================================
[PASS] API Health Check is UP (MySQL Connected)
[PASS] Admin, HR, and Employee Authentication & JWT Token Issuance
[PASS] Employee Directory & Profile Management
[PASS] Attendance Biometric Check-In & Check-Out
[PASS] Leave Quota Management (CL, SL, PL) & Approval Flow
[PASS] Payroll Processing with Loss of Pay (LOP)
[PASS] High-Res Salary Slip PDF Generation & Streaming
[PASS] Reports & Analytics (CSV & PDF Exports)
[PASS] Audit Trail Logging & System Activity Verification
=============================================================
  SUMMARY: 9/9 MODULES VERIFIED (100% OPERATIONAL)
=============================================================
```

---

## 🏛️ System Architecture & Core Modules

### 1. User Authentication & Role-Based Access Control (RBAC)
- **JWT Authentication**: JSON Web Tokens with 7-day expiration and Bearer token validation via `PyJWT`.
- **Password Security**: Passwords hashed using `bcrypt` and `passlib` with cryptographic salt (no plain-text storage).
- **Role Guards**: FastAPI dependency injection restricts access by role (`ADMIN`, `HR`, `EMPLOYEE`).
- **Deactivation Handling**: Suspended accounts are immediately denied login.

### 2. Employee Onboarding & Management
- **Full CRUD Support**: Add, update, view, and toggle activation status.
- **Comprehensive Profiles**: Department, designation, date of joining, contact, base salary, HRA, allowances, PF, tax, and bank details.
- **Document Repository**: Secure file upload via FastAPI `UploadFile` for employee ID proofs, resumes, offer letters, and certificates with download access.
- **Automated Balances**: Creating an employee automatically initializes annual leave quotas (CL: 12, SL: 10, PL: 15).
- **Welcome Notifications**: Automatic welcome email template generated and logged on onboarding.

### 3. Attendance Management
- **Punch Clock**: Real-time Check-In and Check-Out functionality.
- **Duplicate Prevention**: Hard constraint preventing multiple check-ins on the same calendar day.
- **Shift Calculation**: Automatically computes total working hours with distinction between `PRESENT` (>= 4 hrs) and `HALF_DAY` (< 4 hrs).
- **Monthly Register**: Comprehensive monthly log per employee and organizational summary.
- **Administrative Override**: Admin/HR can adjust punches, working hours, and status with mandatory reason tracking.

### 4. Leave Management & Loss of Pay (LOP)
- **Leave Types**: Casual Leave (CL), Sick Leave (SL), Paid Leave (PL), and Loss of Pay (LOP).
- **Quota Validation**: Prevents overdrawing paid leaves; automatically suggests LOP if balance is exhausted.
- **Approval Workflow**: HR/Admin review queue with 1-click Approval (auto-deducts balance) or Rejection (with mandatory comment).
- **Attendance Integration**: Approved leaves automatically reflect as `ON_LEAVE` in attendance tracking.

### 5. Payroll & Salary Processing
- **Automated Calculation Formula**:
  - `Daily Rate = Base Salary / Total Days in Month`
  - `LOP Deduction = Daily Rate * Total LOP Days`
  - `Gross Salary = Base Salary + HRA + Allowances + Bonus`
  - `Total Deductions = PF + Tax (TDS) + LOP Deduction + Other Deductions`
  - `Net Salary = Gross Salary - Total Deductions`
- **Cycle Locking**: Freezing a payroll cycle locks attendance and dispatches email notifications.
- **Banking Simulation**: Simulates bank NEFT transfer with realistic transaction reference generation (e.g. `SIM-NEFT-84920194`).
- **Manual Adjustments**: Admin can add performance bonuses or specific adjustments before locking.

### 6. Salary Slip Generation (PDF)
- Generated using `ReportLab` on the backend with corporate executive layout.
- Features: Techflow branding, employee details, attendance summary, earnings/deductions table, net payable salary, and authorized signatory stamp.
- Direct download endpoint: `GET /api/payroll/:id/payslip`.

### 7. Notification System
- **Template-Based Email Engine**: HTML email templates for Onboarding, Leave Applications, Leave Status Updates, and Payroll Disbursed.
- **Delivery Logging**: Every dispatched email is logged to the `email_logs` table for auditability.
- **In-App Notification Center**: Real-time bell badge with unread counters and 1-click "Mark as Read".

### 8. Reports & Analytics
- Multi-dimensional analytics for Attendance, Leaves, and Payroll.
- Date range and departmental filtering.
- One-click export to **CSV** and **PDF** formats.

### 9. Audit Logs
- Read-only immutable ledger capturing actor email, user role, action, target entity, timestamp, IP address, and JSON details.
- Captures system actions like `USER_LOGIN`, `EMPLOYEE_CREATED`, `ATTENDANCE_OVERRIDE`, `LEAVE_APPROVED`, `PAYROLL_LOCKED`, and `PAYROLL_DISBURSED`.

---

## 📁 Repository Structure

```
Human Resource Management System (HRMS)/
├── backend/
│   ├── routers/                       # Auth, Employee, Attendance, Leave, Payroll, Report, Audit, Notifications, Health
│   ├── services/                      # ReportLab PDF generator, template emails, audit logging
│   ├── auth_utils.py                  # JWT validation & bcrypt password hashing
│   ├── config.py                      # Database & JWT configurations
│   ├── database.py                    # SQLAlchemy sessionmaker & engine
│   ├── models.py                      # 10 Declarative SQLAlchemy models (InnoDB relations & cascades)
│   ├── seed.py                        # MySQL database seeder with sample data
│   ├── generate_mysql_dump.py         # MySQL DDL & Dump exporter
│   ├── main.py                        # FastAPI application instance & router mount
│   └── uploads/                       # Document storage directory
├── frontend/
│   ├── src/
│   │   ├── api/client.js              # Universal fetch client with JWT handling
│   │   ├── context/AuthContext.jsx    # Authentication & role state
│   │   ├── components/                # Sidebar, Topbar, Notification bell
│   │   ├── pages/                     # Login, Dashboard, Employees, Attendance, Leaves, Payroll, Reports, Audit, Profile
│   │   ├── index.css                  # Enterprise Vanilla CSS Design System
│   │   ├── App.jsx                    # Root app layout
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── schema.sql                     # ANSI MySQL InnoDB table definitions
│   └── hrms_dump.sql                  # Full data and DDL SQL dump
├── postman/
│   └── HRMS_API_Collection.postman_collection.json # 26 Postman API requests
├── sample_salary_slip.pdf             # Generated corporate salary slip PDF (ReportLab)
├── verify_all_features.ps1            # Automated end-to-end integration test runner
├── requirements.txt                   # Python dependencies
├── main.py                            # ASGI root entrypoint for Uvicorn
└── README.md                          # Project documentation
```

---

## 🔒 Security Best Practices Implemented
1. **Password Encryption**: All passwords hashed using `bcrypt` via `passlib` with cryptographic salt factor.
2. **JWT Token Signing**: Signed with server-side secret key and expiry; validated per request via FastAPI dependencies.
3. **Role Enforcement**: Protected routes check user claims before handler execution (`ADMIN`, `HR`, `EMPLOYEE`).
4. **Input Validation**: Sanitized inputs and numeric boundary checks via Pydantic schemas.
5. **Secure Uploads**: File-type whitelisting (`.pdf`, `.doc`, `.docx`, `.jpg`, `.png`), size cap (10MB), and sanitized filenames.
6. **SQL Injection Immunity**: SQLAlchemy 2.0 ORM uses parameterized queries for all MySQL database interactions.
