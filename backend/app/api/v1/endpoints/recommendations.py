from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.services.recommendation_service import get_operational_recommendations, review_recommendation
from app.schemas.dto import RecommendationDTO, ReviewRecommendationRequest

router = APIRouter(prefix="/recommendations", tags=["Route Optimization Recommendations"])

@router.get("", response_model=List[RecommendationDTO])
def get_recommendations(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Returns evidence-backed operational optimization recommendations."""
    recs = get_operational_recommendations(db, status=status)
    return [
        {
            "id": r.id,
            "route_id": r.route_id,
            "problem_title": r.problem_title,
            "proposed_action": r.proposed_action,
            "supporting_metrics": r.supporting_metrics_json,
            "expected_benefit": r.expected_benefit,
            "estimated_effort": r.estimated_effort,
            "confidence_level": r.confidence_level,
            "status": r.status,
            "reviewed_by": r.reviewed_by
        }
        for r in recs
    ]

@router.post("/{rec_id}/review")
def review(rec_id: str, payload: ReviewRecommendationRequest, db: Session = Depends(get_db)):
    """Human-in-the-loop workflow: Approve or Reject operational recommendation."""
    try:
        updated = review_recommendation(db, rec_id, payload.action, payload.reviewed_by)
        return {"status": "SUCCESS", "id": updated.id, "new_status": updated.status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
