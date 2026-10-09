from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, dashboard, routes, live, demand, 
    predictions, alerts, recommendations, gis, 
    ingestion, reports, admin
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(routes.router)
api_router.include_router(live.router)
api_router.include_router(demand.router)
api_router.include_router(predictions.router)
api_router.include_router(alerts.router)
api_router.include_router(recommendations.router)
api_router.include_router(gis.router)
api_router.include_router(ingestion.router)
api_router.include_router(reports.router)
api_router.include_router(admin.router)
