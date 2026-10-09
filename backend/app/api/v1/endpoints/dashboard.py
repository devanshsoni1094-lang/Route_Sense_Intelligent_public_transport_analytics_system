from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analytics_service import get_executive_dashboard_kpis
from app.schemas.dto import ExecutiveKpiResponse

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])

@router.get("/kpis", response_model=ExecutiveKpiResponse)
def get_kpis(db: Session = Depends(get_db)):
    """Returns Executive Intelligence Dashboard KPIs and operational insights."""
    return get_executive_dashboard_kpis(db)
