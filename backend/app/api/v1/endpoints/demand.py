from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.services.analytics_service import get_passenger_demand_patterns

router = APIRouter(prefix="/demand", tags=["Passenger Demand Analytics"])

@router.get("/patterns")
def get_demand_patterns(route_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Returns hourly passenger boardings and stop-level demand distribution."""
    return get_passenger_demand_patterns(db, route_id=route_id)
