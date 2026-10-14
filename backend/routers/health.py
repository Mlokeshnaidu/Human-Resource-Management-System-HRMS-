from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("")
def health_check():
    return {
        "status": "UP",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "MySQL (hrms_db)",
        "framework": "FastAPI + SQLAlchemy",
        "service": "HRMS Enterprise Backend"
    }
