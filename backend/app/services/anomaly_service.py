from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.models.domain import AnomalyAlert, AuditLog

def get_anomaly_alerts(db: Session, status: str = None) -> List[AnomalyAlert]:
    """Fetches anomaly alerts with optional status filtering."""
    query = db.query(AnomalyAlert)
    if status:
        query = query.filter(AnomalyAlert.status == status)
    return query.order_by(AnomalyAlert.timestamp.desc()).all()

def update_anomaly_status(
    db: Session, 
    alert_id: str, 
    new_status: str, 
    assigned_to: str = None, 
    username: str = "system"
) -> AnomalyAlert:
    """
    Updates the lifecycle status of an anomaly alert and records an audit log.
    Allowed statuses: NEW, ACKNOWLEDGED, ASSIGNED, RESOLVED.
    """
    alert = db.query(AnomalyAlert).filter(AnomalyAlert.id == alert_id).first()
    if not alert:
        raise ValueError(f"Alert with ID {alert_id} not found.")

    old_status = alert.status
    alert.status = new_status
    if assigned_to:
        alert.assigned_to = assigned_to

    # Record Audit Trail
    audit = AuditLog(
        username=username,
        action="UPDATE_ALERT_STATUS",
        resource_type="AnomalyAlert",
        resource_id=alert_id,
        details_json={
            "old_status": old_status,
            "new_status": new_status,
            "assigned_to": assigned_to
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return alert
