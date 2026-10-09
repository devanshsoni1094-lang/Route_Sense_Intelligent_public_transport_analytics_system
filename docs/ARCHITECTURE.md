# SYSTEM ARCHITECTURE DOCUMENTATION

**Platform:** Intelligent Public Transport Analytics Platform (IPTAP)

---

## 1. Architectural Style: Modular Monolith

IPTAP is designed as a modular monolith to maintain low operational overhead while ensuring clear separation of concerns across data ingestion, analytics computation, ML forecasting, security, and UI rendering.

```
+-----------------------------------------------------------------------------------+
|                                IPTAP FRONTEND                                     |
|  Next.js 14 App Router | Tailwind CSS | Recharts | Leaflet Maps | Client REST API  |
+-----------------------------------------+-----------------------------------------+
                                          | JSON REST API (JWT Authenticated)
+-----------------------------------------v-----------------------------------------+
|                                IPTAP BACKEND                                      |
|  FastAPI Engine | Pydantic Schemas | SQLAlchemy ORM | Analytics & Scikit-Learn    |
|  Central Metric Engine | GTFS Ingestion | Anomaly Detection | ML Forecasting      |
+-----------------------------------------+-----------------------------------------+
                                          | SQL Queries / Spatial Extensions
+-----------------------------------------v-----------------------------------------+
|                              PERSISTENCE & STORAGE                                |
|  PostgreSQL / PostGIS (or SQLite/SpatiaLite fallback) | File Storage for Uploads   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Layer Responsibilities

- **`backend/app/core/metrics.py`**: Central metric definition layer enforcing single source of truth for On-Time Performance (OTP), Trip Completion Rate, Mean/Median Delay, Headway Regularity, and Fleet Utilization.
- **`backend/app/services/gtfs_service.py`**: Transactional GTFS archive zip parser and validator.
- **`backend/app/services/ml_service.py`**: Scikit-Learn machine learning forecasting pipeline (`RandomForestRegressor` for demand, `Ridge` for delay prediction).
- **`backend/app/services/anomaly_service.py`**: Anomaly detection and service reliability manager with alert lifecycle state transitions.
- **`backend/app/services/recommendation_service.py`**: Human-in-the-loop decision-support recommendation engine.
- **`backend/app/services/report_service.py`**: Downloadable CSV tables and ReportLab PDF document generator.
