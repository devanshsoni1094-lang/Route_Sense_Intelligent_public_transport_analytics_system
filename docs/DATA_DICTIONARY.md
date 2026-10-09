# DATA DICTIONARY

**Platform:** Intelligent Public Transport Analytics Platform (IPTAP)

---

## 1. Core Database Entities & Schemas

### `agencies`
- `id` (PK, VARCHAR(50)): Primary identifier (e.g. `BMTC_BLR`).
- `name` (VARCHAR(200)): Agency name (e.g. `Bengaluru Metropolitan Transport Corporation`).
- `city` (VARCHAR(100)): City name (`Bengaluru`).
- `timezone` (VARCHAR(50)): `Asia/Kolkata`.

### `routes`
- `id` (PK, VARCHAR(50)): Route ID (e.g. `R-500A`).
- `route_short_name` (VARCHAR(50)): Short code (e.g. `500-A`).
- `route_long_name` (VARCHAR(255)): Full description.
- `distance_km` (FLOAT): Total route distance in kilometres.
- `scheduled_headway_min` (FLOAT): Scheduled headway in minutes.

### `stops`
- `id` (PK, VARCHAR(50)): Stop ID (e.g. `STP-101`).
- `stop_name` (VARCHAR(255)): Stop name.
- `latitude` (FLOAT): WGS84 latitude coordinate.
- `longitude` (FLOAT): WGS84 longitude coordinate.

### `vehicle_positions`
- `id` (PK, INTEGER): Telemetry ping ID.
- `vehicle_id` (FK, VARCHAR(50)): Associated vehicle ID.
- `latitude` (FLOAT): Current latitude.
- `longitude` (FLOAT): Current longitude.
- `speed_kmh` (FLOAT): Speed in km/h.
- `delay_minutes` (FLOAT): Schedule deviation in minutes.
- `timestamp` (DATETIME): Observation timestamp in IST.

### `anomaly_alerts`
- `id` (PK, VARCHAR(50)): Unique alert ID (`ALT-2026-001`).
- `severity` (VARCHAR(20)): `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
- `status` (VARCHAR(30)): `NEW`, `ACKNOWLEDGED`, `ASSIGNED`, `RESOLVED`.
- `observed_value` (VARCHAR(100)): Recorded metric value.
- `threshold_value` (VARCHAR(100)): Configured threshold.
- `suggested_action` (TEXT): Recommended operational response.
