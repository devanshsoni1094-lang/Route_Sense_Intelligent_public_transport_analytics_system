from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.analytics_service import get_live_vehicle_telemetry
from app.schemas.dto import VehicleTelemetryDTO

router = APIRouter(prefix="/live", tags=["Live Operations"])

@router.get("/telemetry", response_model=List[VehicleTelemetryDTO])
def get_live_telemetry(db: Session = Depends(get_db)):
    """Returns near-real-time vehicle GPS positions and schedule delay status."""
    return get_live_vehicle_telemetry(db)
