from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.domain import Route, Stop, VehiclePosition

router = APIRouter(prefix="/gis", tags=["Geographic Intelligence"])

@router.get("/layers")
def get_gis_layers(db: Session = Depends(get_db)):
    """Returns spatial layers (routes GeoJSON, stops markers, delay heatmaps) for Leaflet interactive map."""
    routes = db.query(Route).all()
    stops = db.query(Stop).all()
    positions = db.query(VehiclePosition).all()

    route_features = []
    for r in routes:
        route_features.append({
            "type": "Feature",
            "properties": {
                "id": r.id,
                "name": r.route_short_name,
                "description": r.route_long_name,
                "distance_km": r.distance_km
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [[lon, lat] for lat, lon in (r.geometry_json or [])]
            }
        })

    stop_features = []
    for s in stops:
        stop_features.append({
            "type": "Feature",
            "properties": {
                "id": s.id,
                "name": s.stop_name
            },
            "geometry": {
                "type": "Point",
                "coordinates": [s.longitude, s.latitude]
            }
        })

    return {
        "type": "FeatureCollection",
        "routes": route_features,
        "stops": stop_features,
        "vehicle_count": len(positions)
    }
