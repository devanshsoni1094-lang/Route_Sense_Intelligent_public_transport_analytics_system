from app.core.metrics import (
    calculate_trip_completion_rate,
    calculate_on_time_performance,
    calculate_delay_statistics,
    calculate_headway_regularity,
    calculate_vehicle_utilization
)

def test_trip_completion_rate():
    res = calculate_trip_completion_rate(95, 100)
    assert res["value"] == 95.0
    assert res["status"] == "VALID"

    res_zero = calculate_trip_completion_rate(0, 0)
    assert res_zero["value"] == 0.0
    assert res_zero["status"] == "NO_SCHEDULED_TRIPS"

def test_on_time_performance():
    delays = [-0.5, 0.0, 2.1, 4.5, 6.2, 12.0]  # 4 on-time (-1 to +5) out of 6
    res = calculate_on_time_performance(delays, early_tolerance=1.0, late_tolerance=5.0)
    assert res["on_time_count"] == 4
    assert res["value"] == round((4/6)*100, 2)

def test_delay_statistics():
    delays = [2.0, 4.0, 6.0, 8.0, 10.0]
    stats = calculate_delay_statistics(delays)
    assert stats["mean"] == 6.0
    assert stats["median"] == 6.0
    assert stats["min"] == 2.0
    assert stats["max"] == 10.0

def test_headway_regularity():
    headways = [10.0, 10.0, 10.0, 10.0]
    res = calculate_headway_regularity(headways, 10.0)
    assert res["regularity_score"] == 100.0

def test_vehicle_utilization():
    res = calculate_vehicle_utilization(30, 40)
    assert res["value"] == 75.0
