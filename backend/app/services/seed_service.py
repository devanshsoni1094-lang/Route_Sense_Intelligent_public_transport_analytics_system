"""
SEED SERVICE (IPTAP DEMO DATA PIPELINE)
Generates realistic, reproducible synthetic transport data for Indian cities (Bengaluru BMTC pilot example).
Enforces exact alignment between DB records, charts, maps, and analytics.
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import numpy as np
from app.models.domain import (
    Agency, User, Route, Stop, Trip, StopTime, Vehicle, 
    VehiclePosition, PassengerCount, ServiceAlert, AnomalyAlert, 
    Recommendation, ForecastModel, ImportJob, AuditLog
)
from app.core.security import hash_password

def seed_demo_data(db: Session):
    """Populates the database with initial demo data if empty."""
    # Check if already seeded
    if db.query(Agency).first():
        return {"status": "ALREADY_SEEDED", "message": "Database already contains operational records."}

    # Set seed for reproducibility
    random.seed(42)
    np.random.seed(42)

    # 1. Agency
    agency = Agency(
        id="BMTC_BLR",
        name="Bengaluru Metropolitan Transport Corporation (BMTC)",
        city="Bengaluru",
        country="India",
        timezone="Asia/Kolkata",
        currency="₹"
    )
    db.add(agency)
    db.commit()

    # 2. Users (Admin, Manager, Analyst, Viewer)
    users = [
        User(username="admin", email="admin@bmtc.gov.in", hashed_password=hash_password("admin123"), full_name="Director of Transport Operations", role="Administrator", agency_id="BMTC_BLR"),
        User(username="manager", email="ops@bmtc.gov.in", hashed_password=hash_password("manager123"), full_name="Central Depot Manager", role="Transport Operations Manager", agency_id="BMTC_BLR"),
        User(username="analyst", email="analyst@bmtc.gov.in", hashed_password=hash_password("analyst123"), full_name="Senior Mobility Analyst", role="Analyst", agency_id="BMTC_BLR"),
        User(username="viewer", email="executive@karnataka.gov.in", hashed_password=hash_password("viewer123"), full_name="Urban Mobility Commissioner", role="Executive Viewer", agency_id="BMTC_BLR"),
    ]
    db.add_all(users)
    db.commit()

    # 3. Routes (Real Bengaluru Transport Corridors)
    routes = [
        Route(
            id="R-500A",
            agency_id="BMTC_BLR",
            route_short_name="500-A",
            route_long_name="Central Silk Board to Hebbal (Outer Ring Road Express)",
            origin="Central Silk Board",
            destination="Hebbal Bus Station",
            distance_km=28.5,
            scheduled_headway_min=10.0,
            geometry_json=[
                [12.9172, 77.6228], [12.9255, 77.6385], [12.9366, 77.6954], 
                [12.9784, 77.6948], [13.0035, 77.6622], [13.0358, 77.5970]
            ]
        ),
        Route(
            id="R-335E",
            agency_id="BMTC_BLR",
            route_short_name="335-E",
            route_long_name="KBS Kempegowda Bus Station to ITPL Whitefield",
            origin="Kempegowda Bus Station (Majestic)",
            destination="ITPL Whitefield",
            distance_km=24.2,
            scheduled_headway_min=12.0,
            geometry_json=[
                [12.9778, 77.5713], [12.9716, 77.5946], [12.9592, 77.6481], 
                [12.9565, 77.7126], [12.9866, 77.7381]
            ]
        ),
        Route(
            id="R-201",
            agency_id="BMTC_BLR",
            route_short_name="201",
            route_long_name="Majestic to Banashankari TTMC",
            origin="Kempegowda Bus Station",
            destination="Banashankari TTMC",
            distance_km=14.0,
            scheduled_headway_min=15.0,
            geometry_json=[
                [12.9778, 77.5713], [12.9601, 77.5745], [12.9382, 77.5801], [12.9252, 77.5735]
            ]
        ),
        Route(
            id="R-401K",
            agency_id="BMTC_BLR",
            route_short_name="401-K",
            route_long_name="Kengeri Satellite Town to Yelahanka NES",
            origin="Kengeri TTMC",
            destination="Yelahanka NES",
            distance_km=32.0,
            scheduled_headway_min=20.0,
            geometry_json=[
                [12.9103, 77.4851], [12.9654, 77.5342], [13.0210, 77.5510], [13.0991, 77.5945]
            ]
        ),
        Route(
            id="R-V500D",
            agency_id="BMTC_BLR",
            route_short_name="V-500D",
            route_long_name="Vayu Vajra AC: Electronic City to KIAS Airport",
            origin="Electronic City Wipro Gate",
            destination="Kempegowda International Airport",
            distance_km=54.0,
            scheduled_headway_min=30.0,
            geometry_json=[
                [12.8452, 77.6602], [12.9172, 77.6228], [13.0358, 77.5970], [13.1986, 77.7066]
            ]
        )
    ]
    db.add_all(routes)
    db.commit()

    # 4. Stops
    stops_data = [
        ("STP-101", "Central Silk Board TTMC", 12.9172, 77.6228),
        ("STP-102", "HSR Layout 5th Main", 12.9255, 77.6385),
        ("STP-103", "Bellandur EcoSpace", 12.9366, 77.6954),
        ("STP-104", "Marathahalli Bridge", 12.9565, 77.7011),
        ("STP-105", "KR Puram Railway Station", 12.9972, 77.6772),
        ("STP-106", "Hebbal Junction", 13.0358, 77.5970),
        ("STP-201", "Kempegowda Bus Station (Majestic)", 12.9778, 77.5713),
        ("STP-202", "MG Road Metro Station", 12.9756, 77.6066),
        ("STP-203", "Indiranagar 100ft Road", 12.9602, 77.6381),
        ("STP-204", "Kundalahalli Gate", 12.9664, 77.7145),
        ("STP-205", "ITPL Main Gate", 12.9866, 77.7381),
        ("STP-301", "Banashankari TTMC", 12.9252, 77.5735),
        ("STP-401", "Kengeri Satellite Town", 12.9103, 77.4851),
        ("STP-501", "KIAS Airport Terminal 1", 13.1986, 77.7066),
    ]
    stops = [Stop(id=sid, stop_name=sname, latitude=lat, longitude=lon) for sid, sname, lat, lon in stops_data]
    db.add_all(stops)
    db.commit()

    # 5. Trips & StopTimes
    trips = []
    stop_times = []
    
    for r in routes:
        for hour in range(6, 22):  # 6 AM to 10 PM
            trip_id = f"TRIP-{r.id}-{hour:02d}00"
            trip = Trip(
                id=trip_id,
                route_id=r.id,
                service_id="WEEKDAY",
                trip_headsign=f"To {r.destination}",
                direction_id=0
            )
            trips.append(trip)
            
            # Stop times (4 stops per trip)
            r_stops = [s for s in stops if s.id.startswith(f"STP-{r.id.split('-')[1][0]}")]
            if not r_stops:
                r_stops = stops[:4]
            
            for seq, stp in enumerate(r_stops, start=1):
                arr_time = f"{hour:02d}:{(seq*15)%60:02d}:00"
                dep_time = f"{hour:02d}:{(seq*15+2)%60:02d}:00"
                
                # Synthetic delays (R-500A has higher congestion delay around Bellandur/Marathahalli)
                base_delay = random.uniform(2.0, 12.0) if r.id in ["R-500A", "R-335E"] else random.uniform(-1.0, 4.0)
                
                st = StopTime(
                    trip_id=trip_id,
                    stop_id=stp.id,
                    stop_sequence=seq,
                    arrival_time=arr_time,
                    departure_time=dep_time,
                    actual_arrival=datetime.utcnow() - timedelta(hours=22-hour, minutes=int(base_delay)),
                    delay_minutes=round(base_delay, 2)
                )
                stop_times.append(st)

    db.add_all(trips)
    db.add_all(stop_times)
    db.commit()

    # 6. Vehicles & Telemetry
    vehicles = []
    positions = []
    now = datetime.utcnow()

    for i in range(1, 36):
        v_id = f"KA-01-F-{1000+i}"
        r_assigned = routes[i % len(routes)]
        veh = Vehicle(
            id=v_id,
            vehicle_number=v_id,
            agency_id="BMTC_BLR",
            capacity=65 if "V500" not in r_assigned.id else 50,
            vehicle_type="Vajra Volvo AC" if "V500" in r_assigned.id else "Non-AC BS-VI",
            status="IN_SERVICE"
        )
        vehicles.append(veh)

        # Generate telemetry points along route geometry
        geo = r_assigned.geometry_json or [[12.9716, 77.5946]]
        coord_idx = i % len(geo)
        base_lat, base_lon = geo[coord_idx]
        
        pos = VehiclePosition(
            vehicle_id=v_id,
            route_id=r_assigned.id,
            trip_id=f"TRIP-{r_assigned.id}-0800",
            latitude=base_lat + random.uniform(-0.005, 0.005),
            longitude=base_lon + random.uniform(-0.005, 0.005),
            speed_kmh=round(random.uniform(15.0, 42.0), 1),
            heading_deg=float(random.randint(0, 360)),
            delay_minutes=round(random.uniform(0.5, 14.5), 1),
            timestamp=now - timedelta(seconds=random.randint(10, 180)),
            is_simulated=True
        )
        positions.append(pos)

    db.add_all(vehicles)
    db.add_all(positions)
    db.commit()

    # 7. Passenger Counts
    counts = []
    for r in routes:
        for hour in range(6, 22):
            # Peak hours: 8-10 AM and 5-7 PM
            if hour in [8, 9, 17, 18, 19]:
                b_count = random.randint(45, 85)
            else:
                b_count = random.randint(15, 38)
            
            p_cnt = PassengerCount(
                route_id=r.id,
                stop_id="STP-101",
                trip_id=f"TRIP-{r.id}-{hour:02d}00",
                boarding_count=b_count,
                alighting_count=random.randint(5, 25),
                occupancy_rate=round(b_count / 65.0, 2),
                timestamp=now - timedelta(hours=22-hour),
                is_inferred=False
            )
            counts.append(p_cnt)

    db.add_all(counts)
    db.commit()

    # 8. Anomaly Alerts
    anomalies = [
        AnomalyAlert(
            id="ALT-2026-001",
            severity="CRITICAL",
            alert_type="DELAY_SPIKE",
            route_id="R-500A",
            stop_id="STP-103",
            vehicle_id="KA-01-F-1002",
            observed_value="18.5 min delay",
            threshold_value="5.0 min tolerance",
            evidence_json={"delay_spike_min": 18.5, "congestion_corridor": "Bellandur EcoSpace Flyover"},
            suggested_action="Deploy 2 standby feeder buses from Central Depot 25.",
            status="NEW",
            timestamp=now - timedelta(minutes=15)
        ),
        AnomalyAlert(
            id="ALT-2026-002",
            severity="HIGH",
            alert_type="UNEXPECTED_GAP",
            route_id="R-335E",
            stop_id="STP-204",
            observed_value="28 min headway gap",
            threshold_value="12 min scheduled headway",
            evidence_json={"missing_trips": 1, "location": "Kundalahalli Gate"},
            suggested_action="Adjust departure frequency at KBS Terminal.",
            status="ACKNOWLEDGED",
            assigned_to="manager",
            timestamp=now - timedelta(minutes=45)
        ),
        AnomalyAlert(
            id="ALT-2026-003",
            severity="MEDIUM",
            alert_type="STALE_FEED",
            route_id="R-201",
            vehicle_id="KA-01-F-1014",
            observed_value="940 sec since ping",
            threshold_value="300 sec stale limit",
            evidence_json={"last_ping": "15 mins ago"},
            suggested_action="Check vehicle GPS unit power connection.",
            status="RESOLVED",
            assigned_to="analyst",
            timestamp=now - timedelta(hours=3)
        )
    ]
    db.add_all(anomalies)
    db.commit()

    # 9. Recommendations
    recommendations = [
        Recommendation(
            id="REC-2026-001",
            route_id="R-500A",
            problem_title="Severe Peak Hour Congestion Bottleneck at Bellandur-Marathahalli",
            proposed_action="Increase peak frequency from 10-min to 6-min headway between 08:00-10:30 and short-turn 4 buses at Marathahalli Bridge.",
            supporting_metrics_json={
                "mean_delay_min": 14.2,
                "otp_pct": 58.4,
                "peak_occupancy_rate": 1.15,
                "observations_count": 420
            },
            expected_benefit="Reduces passenger wait time by 32% and improves Corridor OTP from 58.4% to 81.0%.",
            estimated_effort="MEDIUM",
            confidence_level="HIGH",
            status="PENDING_REVIEW"
        ),
        Recommendation(
            id="REC-2026-002",
            route_id="R-335E",
            problem_title="Off-Peak Excess Layover & Vehicle Idling at ITPL Terminal",
            proposed_action="Reallocate 3 idle vehicles during 12:00-15:00 to feeder Route 201 to cover metro connection demand.",
            supporting_metrics_json={
                "layover_time_min": 38.0,
                "target_layover_min": 15.0,
                "utilization_pct": 52.0
            },
            expected_benefit="Increases fleet utilization efficiency by 18% with zero extra fuel burn.",
            estimated_effort="LOW",
            confidence_level="HIGH",
            status="APPROVED",
            reviewed_by="admin"
        )
    ]
    db.add_all(recommendations)
    db.commit()

    # 10. Forecast Models Metadata
    models = [
        ForecastModel(
            model_id="ML-DEMAND-RF-v1",
            target_metric="DEMAND",
            version="v1.2.0",
            algorithm_name="RandomForestRegressor (n_estimators=100, max_depth=12)",
            mae=3.42,
            rmse=4.85,
            wape=6.82,
            last_trained_date=now - timedelta(days=1),
            train_sample_count=12500,
            feature_names_json=["hour_of_day", "day_of_week", "is_weekend", "lag_1h_demand", "route_encoded"]
        ),
        ForecastModel(
            model_id="ML-DELAY-RIDGE-v1",
            target_metric="DELAY",
            version="v1.0.1",
            algorithm_name="RidgeRegression (alpha=1.0)",
            mae=1.85,
            rmse=2.64,
            wape=11.40,
            last_trained_date=now - timedelta(days=2),
            train_sample_count=18200,
            feature_names_json=["hour_of_day", "route_distance_km", "scheduled_headway", "previous_stop_delay"]
        )
    ]
    db.add_all(models)
    db.commit()

    # 11. Initial Import Job record
    import_job = ImportJob(
        id="IMP-SEED-2026",
        source_name="BMTC Official GTFS Schedule Archive & Synthetic Telemetry Seed",
        source_type="GTFS_SCHEDULE",
        records_processed=2450,
        records_accepted=2450,
        records_rejected=0,
        validation_errors_json=[],
        status="COMPLETED"
    )
    db.add(import_job)
    db.commit()

    return {"status": "SUCCESS", "message": "IPTAP Demo dataset successfully seeded for BMTC Bengaluru Pilot."}
