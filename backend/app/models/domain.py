from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Agency(Base):
    __tablename__ = "agencies"

    id = Column(String(50), primary_key=True)  # e.g. "BMTC_BLR"
    name = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False, default="Bengaluru")
    country = Column(String(50), default="India")
    timezone = Column(String(50), default="Asia/Kolkata")
    currency = Column(String(10), default="₹")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="agency")
    routes = relationship("Route", back_populates="agency")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(String(50), nullable=False, default="Executive Viewer")  # Administrator, Transport Operations Manager, Analyst, Executive Viewer
    agency_id = Column(String(50), ForeignKey("agencies.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    agency = relationship("Agency", back_populates="users")


class Route(Base):
    __tablename__ = "routes"

    id = Column(String(50), primary_key=True)  # e.g. "ROUTE_500A"
    agency_id = Column(String(50), ForeignKey("agencies.id"), nullable=False)
    route_short_name = Column(String(50), nullable=False)
    route_long_name = Column(String(255), nullable=False)
    route_type = Column(Integer, default=3)  # 3 = Bus in GTFS
    origin = Column(String(100))
    destination = Column(String(100))
    distance_km = Column(Float, default=15.0)
    scheduled_headway_min = Column(Float, default=15.0)
    geometry_json = Column(JSON, nullable=True)  # GeoJSON path coordinates

    agency = relationship("Agency", back_populates="routes")
    trips = relationship("Trip", back_populates="route")


class Stop(Base):
    __tablename__ = "stops"

    id = Column(String(50), primary_key=True)  # e.g. "STOP_101"
    stop_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_type = Column(Integer, default=0)
    parent_station = Column(String(50), nullable=True)


class Trip(Base):
    __tablename__ = "trips"

    id = Column(String(100), primary_key=True)  # e.g. "TRIP_500A_0800"
    route_id = Column(String(50), ForeignKey("routes.id"), nullable=False)
    service_id = Column(String(50), default="WEEKDAY")
    trip_headsign = Column(String(200))
    direction_id = Column(Integer, default=0)

    route = relationship("Route", back_populates="trips")
    stop_times = relationship("StopTime", back_populates="trip")


class StopTime(Base):
    __tablename__ = "stop_times"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trip_id = Column(String(100), ForeignKey("trips.id"), nullable=False)
    stop_id = Column(String(50), ForeignKey("stops.id"), nullable=False)
    stop_sequence = Column(Integer, nullable=False)
    arrival_time = Column(String(10), nullable=False)  # HH:MM:SS
    departure_time = Column(String(10), nullable=False)  # HH:MM:SS
    
    # Recorded actual timing (if available)
    actual_arrival = Column(DateTime, nullable=True)
    actual_departure = Column(DateTime, nullable=True)
    delay_minutes = Column(Float, nullable=True)

    trip = relationship("Trip", back_populates="stop_times")
    stop = relationship("Stop")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(50), primary_key=True)  # e.g. "KA-01-F-1234"
    vehicle_number = Column(String(50), nullable=False)
    agency_id = Column(String(50), default="BMTC_BLR")
    capacity = Column(Integer, default=60)
    vehicle_type = Column(String(50), default="Non-AC Standard Bus")
    status = Column(String(50), default="IN_SERVICE")  # IN_SERVICE, MAINTENANCE, IDLE


class VehiclePosition(Base):
    __tablename__ = "vehicle_positions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(String(50), ForeignKey("vehicles.id"), nullable=False)
    route_id = Column(String(50), ForeignKey("routes.id"), nullable=True)
    trip_id = Column(String(100), ForeignKey("trips.id"), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    heading_deg = Column(Float, default=0.0)
    delay_minutes = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    is_simulated = Column(Boolean, default=True)


class PassengerCount(Base):
    __tablename__ = "passenger_counts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    route_id = Column(String(50), ForeignKey("routes.id"), nullable=False)
    stop_id = Column(String(50), ForeignKey("stops.id"), nullable=True)
    trip_id = Column(String(100), ForeignKey("trips.id"), nullable=True)
    boarding_count = Column(Integer, nullable=False)
    alighting_count = Column(Integer, default=0)
    occupancy_rate = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    is_inferred = Column(Boolean, default=False)


class ServiceAlert(Base):
    __tablename__ = "service_alerts"

    id = Column(String(50), primary_key=True)
    severity = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    route_id = Column(String(50), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, RESOLVED


class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"

    id = Column(String(50), primary_key=True)  # e.g. "ALT-2026-001"
    severity = Column(String(20), default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    alert_type = Column(String(100), nullable=False)  # STALE_FEED, UNEXPECTED_GAP, DELAY_SPIKE, TRAVEL_TIME_ANOMALY
    route_id = Column(String(50), nullable=True)
    stop_id = Column(String(50), nullable=True)
    vehicle_id = Column(String(50), nullable=True)
    observed_value = Column(String(100), nullable=False)
    threshold_value = Column(String(100), nullable=False)
    evidence_json = Column(JSON, nullable=False)
    suggested_action = Column(Text, nullable=False)
    status = Column(String(30), default="NEW")  # NEW, ACKNOWLEDGED, ASSIGNED, RESOLVED
    assigned_to = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(50), primary_key=True)  # e.g. "REC-500A-01"
    route_id = Column(String(50), nullable=False)
    problem_title = Column(String(255), nullable=False)
    proposed_action = Column(Text, nullable=False)
    supporting_metrics_json = Column(JSON, nullable=False)
    expected_benefit = Column(String(255), nullable=False)
    estimated_effort = Column(String(50), default="MEDIUM")  # LOW, MEDIUM, HIGH
    confidence_level = Column(String(20), default="HIGH")  # HIGH, MEDIUM, LOW
    status = Column(String(30), default="PENDING_REVIEW")  # PENDING_REVIEW, APPROVED, REJECTED
    reviewed_by = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class ForecastModel(Base):
    __tablename__ = "forecast_models"

    model_id = Column(String(100), primary_key=True)
    target_metric = Column(String(50), nullable=False)  # DEMAND, DELAY
    version = Column(String(20), nullable=False, default="v1.0.0")
    algorithm_name = Column(String(100), nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    wape = Column(Float, nullable=False)
    last_trained_date = Column(DateTime, default=datetime.utcnow)
    train_sample_count = Column(Integer, nullable=False)
    feature_names_json = Column(JSON, nullable=False)


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(String(50), primary_key=True)
    source_name = Column(String(100), nullable=False)
    source_type = Column(String(30), nullable=False)  # GTFS_SCHEDULE, GTFS_REALTIME, CSV, REST_API
    records_processed = Column(Integer, default=0)
    records_accepted = Column(Integer, default=0)
    records_rejected = Column(Integer, default=0)
    validation_errors_json = Column(JSON, default=list)
    status = Column(String(30), default="COMPLETED")  # IN_PROGRESS, COMPLETED, FAILED
    timestamp = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
