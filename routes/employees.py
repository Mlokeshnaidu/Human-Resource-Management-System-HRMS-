import os
import shutil
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from models import User, Employee, Document, LeaveBalance
from core.security import get_current_user, require_roles, hash_password, get_client_ip
from core.config import UPLOAD_DIR
from services import log_audit, send_notification_email

router = APIRouter(prefix="/api/employees", tags=["Employees"])

class EmployeeCreate(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    department: str
    designation: str
    joiningDate: str
    password: Optional[str] = "Welcome@123"
    role: Optional[str] = "EMPLOYEE"
    baseSalary: Optional[float] = 50000.0
    hra: Optional[float] = 15000.0
    allowances: Optional[float] = 5000.0
    pfDeduction: Optional[float] = 3600.0
    taxDeduction: Optional[float] = 2500.0
    bankName: Optional[str] = None
    accountNumber: Optional[str] = None
    ifscCode: Optional[str] = None
    emergencyContact: Optional[str] = None
    address: Optional[str] = None

class EmployeeUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    baseSalary: Optional[float] = None
    hra: Optional[float] = None
    allowances: Optional[float] = None
    pfDeduction: Optional[float] = None
    taxDeduction: Optional[float] = None
    bankName: Optional[str] = None
    accountNumber: Optional[str] = None
    ifscCode: Optional[str] = None
    emergencyContact: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None

def serialize_employee(emp: Employee):
    return {
        "id": emp.id,
        "employeeCode": emp.employeeCode,
        "userId": emp.userId,
        "firstName": emp.firstName,
        "lastName": emp.lastName,
        "phone": emp.phone,
        "department": emp.department,
        "designation": emp.designation,
        "joiningDate": emp.joiningDate.isoformat() if emp.joiningDate else None,
        "status": emp.status,
        "baseSalary": emp.baseSalary,
        "hra": emp.hra,
        "allowances": emp.allowances,
        "pfDeduction": emp.pfDeduction,
        "taxDeduction": emp.taxDeduction,
        "bankName": emp.bankName,
        "accountNumber": emp.accountNumber,
        "ifscCode": emp.ifscCode,
        "emergencyContact": emp.emergencyContact,
        "address": emp.address,
        "createdAt": emp.createdAt.isoformat() if emp.createdAt else None,
        "updatedAt": emp.updatedAt.isoformat() if emp.updatedAt else None,
        "user": {
            "id": emp.user.id,
            "email": emp.user.email,
            "role": emp.user.role,
            "isActive": emp.user.isActive
        } if emp.user else None,
        "documents": [
            {
                "id": doc.id,
                "documentType": doc.documentType,
                "fileName": doc.fileName,
                "originalName": doc.originalName,
                "fileSize": doc.fileSize,
                "mimeType": doc.mimeType,
                "uploadedAt": doc.uploadedAt.isoformat()
            } for doc in emp.documents
        ] if hasattr(emp, 'documents') and emp.documents else [],
        "leaveBalances": [
            {
                "id": lb.id,
                "year": lb.year,
                "leaveType": lb.leaveType,
                "totalDays": lb.totalDays,
                "usedDays": lb.usedDays,
                "remainingDays": lb.remainingDays
            } for lb in emp.leave_balances
        ] if hasattr(emp, 'leave_balances') and emp.leave_balances else []
    }

@router.get("")
def get_all_employees(
    department: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    query = db.query(Employee)

    if department and department != "ALL":
        query = query.filter(Employee.department == department)

    if status_filter and status_filter != "ALL":
        query = query.filter(Employee.status == status_filter)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Employee.firstName.ilike(s)) |
            (Employee.lastName.ilike(s)) |
            (Employee.employeeCode.ilike(s)) |
            (Employee.department.ilike(s)) |
            (Employee.designation.ilike(s))
        )

    employees = query.order_by(Employee.createdAt.desc()).all()
    return {
        "success": True,
        "count": len(employees),
        "data": [serialize_employee(emp) for emp in employees]
    }

@router.get("/{id}")
def get_employee_by_id(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    if current_user.role == "EMPLOYEE" and current_user.employee and current_user.employee.id != id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this profile")

    return {
        "success": True,
        "data": serialize_employee(emp)
    }

@router.post("")
def create_employee(
    payload: EmployeeCreate,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    email = payload.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User account with this email already exists")

    count = db.query(Employee).count()
    emp_code = f"HRMS-{1000 + count + 1}"

    try:
        join_dt = datetime.fromisoformat(payload.joiningDate)
    except Exception:
        join_dt = datetime.utcnow()

    # 1. Create User
    new_user = User(
        email=email,
        password=hash_password(payload.password or "Welcome@123"),
        role=payload.role or "EMPLOYEE",
        isActive=True
    )
    db.add(new_user)
    db.flush()

    # 2. Create Employee
    new_emp = Employee(
        employeeCode=emp_code,
        userId=new_user.id,
        firstName=payload.firstName,
        lastName=payload.lastName,
        phone=payload.phone,
        department=payload.department,
        designation=payload.designation,
        joiningDate=join_dt,
        status="ACTIVE",
        baseSalary=payload.baseSalary or 50000.0,
        hra=payload.hra or 15000.0,
        allowances=payload.allowances or 5000.0,
        pfDeduction=payload.pfDeduction or 3600.0,
        taxDeduction=payload.taxDeduction or 2500.0,
        bankName=payload.bankName,
        accountNumber=payload.accountNumber,
        ifscCode=payload.ifscCode,
        emergencyContact=payload.emergencyContact,
        address=payload.address
    )
    db.add(new_emp)
    db.flush()

    # 3. Initialize Leave Balances
    curr_year = datetime.utcnow().year
    leave_types = [
        ("CL", 12.0),
        ("SL", 10.0),
        ("PL", 15.0)
    ]
    for l_type, days in leave_types:
        lb = LeaveBalance(
            employeeId=new_emp.id,
            year=curr_year,
            leaveType=l_type,
            totalDays=days,
            usedDays=0.0,
            remainingDays=days
        )
        db.add(lb)

    db.commit()
    db.refresh(new_emp)

    # 4. Send Onboarding email
    send_notification_email(
        db=db,
        to=email,
        email_type="ONBOARDING",
        data={
            "name": f"{payload.firstName} {payload.lastName}",
            "employeeCode": emp_code,
            "email": email,
            "department": payload.department,
            "designation": payload.designation,
            "joiningDate": join_dt.strftime("%Y-%m-%d"),
            "temporaryPassword": payload.password or "Welcome@123"
        },
        user_id=new_user.id
    )

    # 5. Audit log
    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="EMPLOYEE_CREATED",
        target_entity="Employee",
        target_id=new_emp.id,
        details=f"Onboarded employee {emp_code} ({payload.firstName} {payload.lastName})",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": "Employee onboarded successfully with credentials and leave balance",
        "data": serialize_employee(new_emp)
    }

@router.put("/{id}")
def update_employee(
    id: str,
    payload: EmployeeUpdate,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_dict = payload.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            setattr(emp, field, val)

    emp.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(emp)

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="EMPLOYEE_UPDATED",
        target_entity="Employee",
        target_id=emp.id,
        details=f"Updated profile for {emp.employeeCode}",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": "Employee updated successfully",
        "data": serialize_employee(emp)
    }

@router.patch("/{id}/status")
def toggle_employee_status(
    id: str,
    request: Request,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_status = "INACTIVE" if emp.status == "ACTIVE" else "ACTIVE"
    emp.status = new_status
    emp.updatedAt = datetime.utcnow()

    if emp.user:
        emp.user.isActive = (new_status == "ACTIVE")
        emp.user.updatedAt = datetime.utcnow()

    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="EMPLOYEE_STATUS_TOGGLED",
        target_entity="Employee",
        target_id=emp.id,
        details=f"Changed status of {emp.employeeCode} to {new_status}",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": f"Employee marked as {new_status}",
        "status": new_status
    }

@router.post("/{id}/documents")
def upload_document(
    id: str,
    file: UploadFile = File(...),
    documentType: str = Form("Identification / Contract"),
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    allowed_exts = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Invalid file type {ext}. Allowed: PDF, Word, JPG, PNG")

    unique_name = f"doc-{int(datetime.utcnow().timestamp())}-{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(dest_path)

    doc = Document(
        employeeId=emp.id,
        documentType=documentType,
        fileName=unique_name,
        originalName=file.filename,
        filePath=dest_path,
        fileSize=file_size,
        mimeType=file.content_type or "application/octet-stream"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "success": True,
        "message": "Document uploaded successfully",
        "data": {
            "id": doc.id,
            "documentType": doc.documentType,
            "fileName": doc.fileName,
            "originalName": doc.originalName,
            "fileSize": doc.fileSize,
            "mimeType": doc.mimeType,
            "uploadedAt": doc.uploadedAt.isoformat()
        }
    }

@router.get("/documents/{doc_id}/download")
def download_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not os.path.exists(doc.filePath):
        raise HTTPException(status_code=404, detail="Document file not found on server")

    return FileResponse(
        path=doc.filePath,
        filename=doc.originalName,
        media_type=doc.mimeType
    )

@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: str,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document record not found")

    if os.path.exists(doc.filePath):
        try:
            os.remove(doc.filePath)
        except Exception:
            pass

    db.delete(doc)
    db.commit()

    return {
        "success": True,
        "message": "Document deleted successfully"
    }
