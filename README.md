# Intelligent Public Transport Analytics Platform (IPTAP)

**Product Tagline:** *From Transport Data to Intelligent Decisions.*

IPTAP is an operational decision-support platform designed for public transport authorities, municipal transport departments, and bus operators in India (pilot implemented for **Bengaluru Metropolitan Transport Corporation - BMTC**).

---

## 🚀 Key Features & Application Modules

1. **Executive Intelligence Dashboard**: Real data-derived KPIs (On-Time Performance, Trip Completion Rate, Mean Delay, Passenger Boardings, Fleet Utilization, Active Disruptions, Forecasted Demand) with evidence-backed operational insights.
2. **Live Operations Command Centre**: Near-real-time vehicle locations on interactive Leaflet maps with status filters (ON_TIME, DELAYED, STALE) and schedule-vs-actual telemetry table.
3. **Route Performance Analytics**: Detailed corridor OTP, mean/median delay percentiles (p90), headway regularity index, and weekday vs weekend travel variation.
4. **Passenger Demand Analytics**: Hourly passenger boarding patterns, peak morning/evening demand windows, and stop-level ridership distribution.
5. **Predictions & ML Forecasting (MLOps)**: Real Scikit-Learn models (`RandomForestRegressor` and `Ridge`) for 24-hour passenger demand and delay forecasting with quantitative accuracy metrics (MAE, RMSE, WAPE).
6. **Service Reliability & Anomaly Detection**: Automated detection of missing feeds, service gaps, delay spikes, travel time anomalies, and interactive status workflow (NEW → ACKNOWLEDGED → ASSIGNED → RESOLVED).
7. **Route & Service Optimization Recommendations**: Evidence-backed operational improvement cards with human-in-the-loop review workflow (APPROVE / REJECT).
8. **Interactive Geographic Intelligence (GIS)**: Spatial layers, GeoJSON route geometries, stop markers, and corridor heatmaps.
9. **Data Ingestion & Data Quality Centre**: Transactional GTFS Schedule ZIP parser, CSV passenger boardings upload & preview tool, and ingestion job error logs.
10. **Reports & Exports**: Downloadable CSV data tables and professionally formatted PDF operational reports (using ReportLab).
11. **User, Role & Administration Management**: JWT authentication, Role-Based Access Control (Administrator, Operations Manager, Analyst, Executive Viewer), system audit logs, and demo dataset re-seeding.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (TypeScript), Tailwind CSS, Lucide Icons, Recharts, Leaflet / React-Leaflet maps.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Scikit-Learn, Pandas, NumPy, ReportLab.
- **Database**: PostgreSQL with PostGIS extension (with SQLite fallback for local development).
- **Deployment**: Docker, Docker Compose.

---

## 🏃 Quick Start (Local Development)

### 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m pytest tests
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000`. OpenAPI documentation available at `http://localhost:8000/docs`.

### 2. Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```
Frontend dashboard will be running at `http://localhost:3000`.

### 3. Docker Compose (Single-Command Launch)

```bash
docker-compose up --build
```

---

## 📄 Handover Documentation

Full technical documentation is located in the `docs/` folder:
- [PROJECT_SCOPE.md](docs/PROJECT_SCOPE.md)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [DATA_DICTIONARY.md](docs/DATA_DICTIONARY.md)
- [METRICS_AND_METHODOLOGY.md](docs/METRICS_AND_METHODOLOGY.md)
- [DATA_INTEGRATION.md](docs/DATA_INTEGRATION.md)
- [ML_METHODOLOGY.md](docs/ML_METHODOLOGY.md)
- [SECURITY_AND_PRIVACY.md](docs/SECURITY_AND_PRIVACY.md)
- [DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md)
- [TEST_REPORT.md](docs/TEST_REPORT.md)
- [ACCEPTANCE_CHECKLIST.md](docs/ACCEPTANCE_CHECKLIST.md)
