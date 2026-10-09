from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.domain import User, AuditLog
from app.services.seed_service import seed_demo_data

router = APIRouter(prefix="/admin", tags=["User & Administration Management"])

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    """Returns list of registered platform users and assigned roles."""
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "agency_id": u.agency_id,
            "is_active": u.is_active
        }
        for u in users
    ]

@router.post("/seed")
def trigger_seed(db: Session = Depends(get_db)):
    """Seeds or resets the demo environment dataset."""
    return seed_demo_data(db)

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    """Returns administrative audit history trail."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "username": l.username,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details_json,
            "timestamp": l.timestamp
        }
        for l in logs
    ]
