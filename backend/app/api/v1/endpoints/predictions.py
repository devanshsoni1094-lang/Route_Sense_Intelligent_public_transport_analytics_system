from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.services.ml_service import (
    get_forecast_evaluations, 
    generate_24h_demand_forecast,
    train_passenger_demand_model,
    train_delay_prediction_model
)
from app.schemas.dto import ForecastMetricsDTO, PredictionPointDTO

router = APIRouter(prefix="/predictions", tags=["Predictions & ML Forecasting"])

@router.get("/evaluations", response_model=List[ForecastMetricsDTO])
def get_evaluations(db: Session = Depends(get_db)):
    """Returns ML model accuracy metrics (MAE, RMSE, WAPE)."""
    return get_forecast_evaluations(db)

@router.get("/forecasts", response_model=List[PredictionPointDTO])
def get_forecasts(route_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Generates 24-hour future passenger demand predictions with confidence bounds."""
    return generate_24h_demand_forecast(db, route_id=route_id)

@router.post("/train")
def train_models(db: Session = Depends(get_db)):
    """Triggers ML model training pipeline."""
    res_demand = train_passenger_demand_model(db)
    res_delay = train_delay_prediction_model(db)
    return {"status": "SUCCESS", "demand_model": res_demand, "delay_model": res_delay}
