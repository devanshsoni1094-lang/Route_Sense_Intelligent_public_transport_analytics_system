from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.analytics_service import get_all_routes_performance
from app.schemas.dto import RoutePerformanceDTO

router = APIRouter(prefix="/routes", tags=["Route Performance Analytics"])

@router.get("/performance", response_model=List[RoutePerformanceDTO])
def get_routes_performance(db: Session = Depends(get_db)):
    """Returns detailed route-level OTP, delays, and headway metrics."""
    return get_all_routes_performance(db)
