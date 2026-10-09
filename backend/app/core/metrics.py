"""
CENTRAL METRIC DEFINITION LAYER (IPTAP)

Enforces non-negotiable metric correctness according to Section 7 of Master Build Prompt.
All formulas, units, filters, and mathematical safeguards are centralized here.
"""

from typing import List, Dict, Any, Optional
import numpy as np

def calculate_trip_completion_rate(completed_trips: int, scheduled_trips: int) -> Dict[str, Any]:
    """
    Formula: (Completed Trips / Eligible Scheduled Trips) * 100
    Unit: Percentage (%)
    """
    if scheduled_trips <= 0:
        return {
            "value": 0.0,
            "completed": completed_trips,
            "scheduled": scheduled_trips,
            "unit": "%",
            "status": "NO_SCHEDULED_TRIPS"
        }
    rate = round((completed_trips / scheduled_trips) * 100.0, 2)
    return {
        "value": min(rate, 100.0),
        "completed": completed_trips,
        "scheduled": scheduled_trips,
        "unit": "%",
        "status": "VALID"
    }

def calculate_on_time_performance(
    delays_minutes: List[float], 
    early_tolerance: float = 1.0, 
    late_tolerance: float = 5.0
) -> Dict[str, Any]:
    """
    Formula: (Observed Events within [-early_tolerance, +late_tolerance] / Total Observed Events) * 100
    Unit: Percentage (%)
    """
    if not delays_minutes:
        return {
            "value": 0.0,
            "on_time_count": 0,
            "total_observed": 0,
            "unit": "%",
            "status": "NO_OBSERVATIONS"
        }
    
    total = len(delays_minutes)
    on_time_count = sum(1 for d in delays_minutes if -early_tolerance <= d <= late_tolerance)
    otp = round((on_time_count / total) * 100.0, 2)
    
    return {
        "value": otp,
        "on_time_count": on_time_count,
        "total_observed": total,
        "unit": "%",
        "status": "VALID"
    }

def calculate_delay_statistics(delays_minutes: List[float]) -> Dict[str, Any]:
    """
    Computes mean, median, 90th percentile, and standard deviation of delays in minutes.
    Unit: Minutes
    """
    if not delays_minutes:
        return {
            "mean": 0.0,
            "median": 0.0,
            "p90": 0.0,
            "std_dev": 0.0,
            "min": 0.0,
            "max": 0.0,
            "total_count": 0,
            "unit": "min"
        }
    
    arr = np.array(delays_minutes)
    return {
        "mean": round(float(np.mean(arr)), 2),
        "median": round(float(np.median(arr)), 2),
        "p90": round(float(np.percentile(arr, 90)), 2),
        "std_dev": round(float(np.std(arr)), 2),
        "min": round(float(np.min(arr)), 2),
        "max": round(float(np.max(arr)), 2),
        "total_count": len(delays_minutes),
        "unit": "min"
    }

def calculate_headway_regularity(headways_minutes: List[float], scheduled_headway_min: float) -> Dict[str, Any]:
    """
    Calculates Headway Deviation Index (HDI) and Headway Regularity Score (0-100%).
    Formula: 100 * (1 - (StdDev(Headways) / Mean(Headways)))
    """
    if not headways_minutes or len(headways_minutes) < 2 or scheduled_headway_min <= 0:
        return {
            "regularity_score": 100.0,
            "mean_headway": scheduled_headway_min,
            "headway_dev_min": 0.0,
            "unit": "%"
        }
    
    arr = np.array(headways_minutes)
    mean_h = float(np.mean(arr))
    std_h = float(np.std(arr))
    
    # Coefficient of Variation (CV)
    cv = std_h / mean_h if mean_h > 0 else 0.0
    regularity = max(0.0, round((1.0 - cv) * 100.0, 2))
    
    return {
        "regularity_score": regularity,
        "mean_headway": round(mean_h, 2),
        "headway_dev_min": round(std_h, 2),
        "scheduled_headway": scheduled_headway_min,
        "unit": "%"
    }

def calculate_vehicle_utilization(active_vehicles: int, total_fleet: int) -> Dict[str, Any]:
    """
    Formula: (Active Deployed Vehicles / Total Operational Fleet Size) * 100
    Unit: Percentage (%)
    """
    if total_fleet <= 0:
        return {"value": 0.0, "active": active_vehicles, "fleet": total_fleet, "unit": "%"}
    
    utilization = round((active_vehicles / total_fleet) * 100.0, 2)
    return {
        "value": min(utilization, 100.0),
        "active": active_vehicles,
        "fleet": total_fleet,
        "unit": "%"
    }
