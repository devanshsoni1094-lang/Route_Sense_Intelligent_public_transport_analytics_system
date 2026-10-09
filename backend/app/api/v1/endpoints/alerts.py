from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.services.anomaly_service import get_anomaly_alerts, update_anomaly_status
from app.schemas.dto import AnomalyAlertDTO, UpdateAlertStatusRequest

router = APIRouter(prefix="/alerts", tags=["Service Reliability & Anomaly Alerts"])

@router.get("/anomalies", response_model=List[AnomalyAlertDTO])
def get_alerts(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Fetches service reliability anomaly alerts with optional status filtering."""
    alerts = get_anomaly_alerts(db, status=status)
    return [
        {
            "id": a.id,
            "severity": a.severity,
            "alert_type": a.alert_type,
            "route_id": a.route_id,
            "observed_value": a.observed_value,
            "threshold_value": a.threshold_value,
            "evidence": a.evidence_json,
            "suggested_action": a.suggested_action,
            "status": a.status,
            "assigned_to": a.assigned_to,
            "timestamp": a.timestamp
        }
        for a in alerts
    ]

@router.put("/anomalies/{alert_id}/status")
def update_alert(alert_id: str, payload: UpdateAlertStatusRequest, db: Session = Depends(get_db)):
    """Updates alert lifecycle state (ACKNOWLEDGED, ASSIGNED, RESOLVED)."""
    try:
        updated = update_anomaly_status(db, alert_id, payload.status, assigned_to=payload.assigned_to)
        return {"status": "SUCCESS", "alert_id": updated.id, "new_status": updated.status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
