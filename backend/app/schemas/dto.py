from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    agency_id: Optional[str]
    is_active: bool

# --- Executive Dashboard Schemas ---
class OperationalInsightDTO(BaseModel):
    id: str
    title: str
    description: str
    route_id: Optional[str]
    stop_name: Optional[str]
    time_window: str
    suspected_cause: str
    supporting_records_count: int
    evidence_summary: str

class ExecutiveKpiResponse(BaseModel):
    operating_mode: str = Field("DEMO DATA", description="Operating status indicator")
    agency_name: str
    scheduled_trips: int
    completed_trips: int
    completion_rate_pct: float
    on_time_performance_pct: float
    mean_delay_min: float
    passenger_boardings: int
    fleet_utilization_pct: float
    active_disruptions_count: int
    data_freshness_seconds: int
    forecasted_demand_next_24h: int
    insights: List[OperationalInsightDTO]
    top_performing_routes: List[Dict[str, Any]]
    underperforming_routes: List[Dict[str, Any]]

# --- Route Analytics Schemas ---
class RoutePerformanceDTO(BaseModel):
    route_id: str
    route_short_name: str
    route_long_name: str
    origin: str
    destination: str
    distance_km: float
    scheduled_trips: int
    completed_trips: int
    otp_pct: float
    mean_delay_min: float
    median_delay_min: float
    p90_delay_min: float
    headway_regularity_pct: float
    passenger_boardings: int
    status_label: str  # NORMAL, UNDERPERFORMING, SEVERE_DELAY

# --- Live Telemetry Schemas ---
class VehicleTelemetryDTO(BaseModel):
    vehicle_id: str
    vehicle_number: str
    route_id: Optional[str]
    route_name: Optional[str]
    trip_id: Optional[str]
    latitude: float
    longitude: float
    speed_kmh: float
    heading_deg: float
    delay_minutes: float
    status: str  # ON_TIME, DELAYED, STALE
    last_updated: datetime
    is_simulated: bool

# --- Demand Analytics Schemas ---
class DemandPatternDTO(BaseModel):
    hour: int
    weekday_demand: int
    weekend_demand: int
    predicted_demand: int

class StopDemandDTO(BaseModel):
    stop_id: str
    stop_name: str
    latitude: float
    longitude: float
    boardings_count: int

# --- Predictions Schemas ---
class ForecastMetricsDTO(BaseModel):
    model_id: str
    target: str
    version: str
    algorithm: str
    mae: float
    rmse: float
    wape: float
    sample_count: int
    last_trained: datetime

class PredictionPointDTO(BaseModel):
    timestamp: str
    observed_value: Optional[float]
    predicted_value: float
    lower_bound: float
    upper_bound: float

# --- Anomaly Alert Schemas ---
class AnomalyAlertDTO(BaseModel):
    id: str
    severity: str
    alert_type: str
    route_id: Optional[str]
    observed_value: str
    threshold_value: str
    evidence: Dict[str, Any]
    suggested_action: str
    status: str
    assigned_to: Optional[str]
    timestamp: datetime

class UpdateAlertStatusRequest(BaseModel):
    status: str  # ACKNOWLEDGED, ASSIGNED, RESOLVED
    assigned_to: Optional[str] = None

# --- Recommendation Schemas ---
class RecommendationDTO(BaseModel):
    id: str
    route_id: str
    problem_title: str
    proposed_action: str
    supporting_metrics: Dict[str, Any]
    expected_benefit: str
    estimated_effort: str
    confidence_level: str
    status: str
    reviewed_by: Optional[str]

class ReviewRecommendationRequest(BaseModel):
    action: str  # APPROVE, REJECT
    reviewed_by: str

# --- Report & Ingestion Schemas ---
class CSVImportRequest(BaseModel):
    source_name: str
    table_target: str  # routes, stops, passenger_counts

class ReportRequest(BaseModel):
    report_type: str  # ROUTE_PERFORMANCE, RELIABILITY, DEMAND, EXECUTIVE_SUMMARY
    format: str = "pdf"  # pdf or csv
    route_id: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
