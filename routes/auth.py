from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from models import User, Employee
from core.security import verify_password, create_access_token, get_current_user, get_client_ip
from services import log_audit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

def format_user_payload(user: User):
    emp_data = None
    if user.employee:
        emp = user.employee
        emp_data = {
            "id": emp.id,
            "employeeCode": emp.employeeCode,
            "firstName": emp.firstName,
            "lastName": emp.lastName,
            "department": emp.department,
            "designation": emp.designation,
            "status": emp.status,
            "baseSalary": emp.baseSalary,
            "hra": emp.hra,
            "allowances": emp.allowances,
            "joiningDate": emp.joiningDate.isoformat() if emp.joiningDate else None,
            "phone": emp.phone,
            "bankName": emp.bankName,
            "accountNumber": emp.accountNumber,
            "ifscCode": emp.ifscCode,
            "emergencyContact": emp.emergencyContact,
            "address": emp.address
        }
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "isActive": user.isActive,
        "createdAt": user.createdAt.isoformat() if user.createdAt else None,
        "employee": emp_data
    }

@router.post("/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials"
        )

    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated. Please contact Administration."
        )

    if not verify_password(req.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials"
        )

    token = create_access_token({"userId": user.id, "email": user.email, "role": user.role})

    # Log audit
    log_audit(
        db=db,
        user_id=user.id,
        user_email=user.email,
        user_role=user.role,
        action="USER_LOGIN",
        target_entity="User",
        target_id=user.id,
        details=f"User {user.email} logged in successfully",
        ip_address=get_client_ip(request)
    )

    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": format_user_payload(user)
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "user": format_user_payload(current_user)
    }
