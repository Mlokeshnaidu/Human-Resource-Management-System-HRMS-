import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure the project root directory is on the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from core.config import CORS_ORIGINS, UPLOAD_DIR
from core.database import engine, Base
from routes import all_routers

# Initialize FastAPI App
app = FastAPI(
    title="Enterprise HRMS Backend API",
    description="Full-stack Human Resource Management System backend built with FastAPI, SQLAlchemy, Alembic, and MySQL.",
    version="2.0.0"
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount document uploads directory
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include all modular routers
for router in all_routers:
    app.include_router(router)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    print("====================================================")
    print("  Enterprise HRMS FastAPI Backend running with MySQL!")
    print("  Port: 5000 | Health: http://localhost:5000/api/health")
    print("  API Docs: http://localhost:5000/docs")
    print("====================================================")

@app.get("/")
def root():
    return {
        "message": "Welcome to Enterprise HRMS FastAPI API",
        "health": "/api/health",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
