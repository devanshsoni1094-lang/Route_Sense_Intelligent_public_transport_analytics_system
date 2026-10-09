# DATA INTEGRATION SPECIFICATIONS

**Platform:** Intelligent Public Transport Analytics Platform (IPTAP)

---

## 1. GTFS Schedule Archive Ingestion

IPTAP supports the official GTFS Schedule ZIP specification (https://gtfs.org/documentation/overview/).

### Required Archive Files:
1. `agency.txt`
2. `routes.txt`
3. `stops.txt`
4. `trips.txt`
5. `stop_times.txt`

### Validation Rules:
- WGS84 coordinate boundaries: Latitude $[-90.0, +90.0]$, Longitude $[-180.0, +180.0]$.
- Broken foreign key verification between `stop_times.txt` $\to$ `trips.txt` $\to$ `routes.txt`.
- Transactional rollback on fatal schema errors.

---

## 2. CSV Passenger Boarding Uploads

### Supported Columns:
- `route_id` (string)
- `stop_id` (string)
- `boarding_count` (integer)
- `alighting_count` (integer)
- `timestamp` (datetime ISO string)
