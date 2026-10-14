from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from models import User
from core.security import get_current_user, require_roles, hash_password, verify_password

router = APIRouter(prefix="/api/users", tags=["Users"])

class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str

@router.get("")
def list_users(
    role: Optional[str] = None,
    current_user: User = Depends(require_roles("ADMIN", "HR")),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.upper())
    users = query.all()
    return {
        "success": True,
        "count": len(users),
        "data": [
            {
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "isActive": u.isActive,
                "createdAt": u.createdAt.isoformat() if u.createdAt else None,
                "employeeName": f"{u.employee.firstName} {u.employee.lastName}" if u.employee else None,
                "employeeCode": u.employee.employeeCode if u.employee else None
            }
            for u in users
        ]
    }

@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
            "isActive": current_user.isActive,
            "employee": {
                "id": current_user.employee.id,
                "employeeCode": current_user.employee.employeeCode,
                "firstName": current_user.employee.firstName,
                "lastName": current_user.employee.lastName,
                "department": current_user.employee.department,
                "designation": current_user.employee.designation,
                "phone": current_user.employee.phone
            } if current_user.employee else None
        }
    }

@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.currentPassword, current_user.password):
        raise HTTPException(status_code=400, detail="Current password does not match")
    
    if len(req.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        
    current_user.password = hash_password(req.newPassword)
    db.commit()
    return {"success": True, "message": "Password updated successfully"}
