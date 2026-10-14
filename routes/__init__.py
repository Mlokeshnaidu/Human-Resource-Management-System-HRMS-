from .auth import router as auth_router
from .users import router as users_router
from .admin import router as admin_router
from .employees import router as employees_router
from .attendance import router as attendance_router
from .leaves import router as leaves_router
from .payroll import router as payroll_router
from .reports import router as reports_router
from .audit import router as audit_router
from .notifications import router as notifications_router
from .health import router as health_router

all_routers = [
    auth_router,
    users_router,
    admin_router,
    employees_router,
    attendance_router,
    leaves_router,
    payroll_router,
    reports_router,
    audit_router,
    notifications_router,
    health_router,
]

__all__ = [
    "auth_router",
    "users_router",
    "admin_router",
    "employees_router",
    "attendance_router",
    "leaves_router",
    "payroll_router",
    "reports_router",
    "audit_router",
    "notifications_router",
    "health_router",
    "all_routers",
]
