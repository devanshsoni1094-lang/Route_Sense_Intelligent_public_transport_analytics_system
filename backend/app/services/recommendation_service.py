from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.domain import Recommendation, AuditLog

def get_operational_recommendations(db: Session, status: str = None) -> List[Recommendation]:
    """Fetches evidence-backed recommendations."""
    query = db.query(Recommendation)
    if status:
        query = query.filter(Recommendation.status == status)
    return query.order_by(Recommendation.timestamp.desc()).all()

def review_recommendation(
    db: Session, 
    recommendation_id: str, 
    action: str, 
    reviewed_by: str
) -> Recommendation:
    """
    Human-in-the-loop review workflow for operational recommendations.
    Actions: APPROVE, REJECT
    """
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise ValueError(f"Recommendation with ID {recommendation_id} not found.")

    rec.status = "APPROVED" if action.upper() == "APPROVE" else "REJECTED"
    rec.reviewed_by = reviewed_by

    audit = AuditLog(
        username=reviewed_by,
        action=f"REVIEW_RECOMMENDATION_{action.upper()}",
        resource_type="Recommendation",
        resource_id=recommendation_id,
        details_json={
            "final_status": rec.status,
            "reviewed_by": reviewed_by
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(rec)
    return rec
