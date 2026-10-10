# Route Sense — Intelligent Public Transport Analytics & Journey Intelligence Platform

**Product Tagline:** *Find the best way to get there across India.*

Route Sense is an India-wide intelligent journey planning, real-time fare intelligence, and travel comparison platform. It enables commuters and travelers to search between any starting point and destination in India, comparing real-world travel options across public transit (Local Trains, Metro, City Buses, Express Rail) and road transport (Cabs, Auto-rickshaws, Bike Taxis, Personal Vehicles).

---

## 🚀 Key Platform Features

1. **Ultra-Simple Commuter Interface**:
   - 2-input search form (Source & Destination) with location swapping.
   - Fast, keyboard-navigable autocomplete with category icons (Stations, Localities, Airports, Landmarks).
   - Instant search execution using current IST time.

2. **Multi-Modal Transport Comparison**:
   - **Suburban & Local Trains**: Mumbai Suburban, Chennai Suburban, Kolkata Suburban tariffs.
   - **Intercity Express Rail**: IRCTC class-based fare formulas (2S, SL, 3A, 2A, 1A) with minimum fares, Tatkal, Superfast, and GST surcharges.
   - **Metro Transit Systems**: DMRC (Delhi), Namma Metro (Bengaluru), Mumbai Metro, Hyderabad, Chennai, and Pune Metro fare structures.
   - **Bus Transit**: State Transport Corporations (MSRTC, KSRTC, TSRTC, UPSRTC), City Buses (BMTC, BEST, DTC), and AC Volvo/Sleeper intercity options.
   - **Ride-Hailing & Aggregators**: Rapido Bike, Ola Auto, Uber Go, Sedan, and SUV trip benchmarks with surge factors.
   - **Personal Vehicles**: Distance, vehicle efficiency (km/l), and live fuel pricing (₹/l) running cost models.

3. **Data Freshness & Transparency**:
   - Clear classification tags for pricing sources:
     - `LIVE_PROVIDER_QUOTE`
     - `OFFICIAL_TARIFF`
     - `API_TRANSIT_FARE`
     - `ESTIMATED_OPERATING_COST`
     - `ESTIMATED_FARE`
   - Real-time timestamp tracking and data freshness badges (`LIVE`, `VERIFIED_TARIFF`, `STALE`).

4. **Interactive Journey Details**:
   - Step-by-step leg breakdown with walking duration, waiting time, and in-vehicle time.
   - Complete route geometry visualization powered by Leaflet maps.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router, TypeScript), Tailwind CSS, Lucide React, Leaflet & React-Leaflet.
- **Backend API**: Python 3.13, FastAPI, SQLAlchemy 2.0, Scikit-Learn, Pandas, Pytest.
- **Geospatial & Autocomplete**: Google Places API (India-bound) with robust fallback database covering all 28 States & 8 UTs.
- **Deployment Target**: Vercel production deployment compatible with serverless Edge/Node runtimes.

---

## 🏃 Quick Start (Local Development)

### 1. Frontend Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production build check
cmd /c npm run build
```

Frontend application will run at `http://localhost:3000`.

### 2. Backend API Development & Testing

```bash
# Activate virtual environment
cd backend
python -m venv venv
venv\Scripts\activate

# Install dependencies and run tests
pip install -r requirements.txt
cmd /c pytest
```

---

## 📄 Complete Handover Documentation

System architecture and operational guides are documented in the `docs/` folder:

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Platform Architecture & Component Overview
- [LOCATION_SEARCH.md](docs/LOCATION_SEARCH.md) — Geospatial Location Search & Autocomplete
- [ROUTING_METHODOLOGY.md](docs/ROUTING_METHODOLOGY.md) — Multi-Modal Journey Routing & Step Resolution
- [FARE_DATA_DICTIONARY.md](docs/FARE_DATA_DICTIONARY.md) — Standard Data Dictionary & Schemas
- [FARE_REFERENCE_BENCHMARKS.md](docs/FARE_REFERENCE_BENCHMARKS.md) — Railway, Bus, Cab & Auto Benchmark Figures
- [PRICING_METHODOLOGY.md](docs/PRICING_METHODOLOGY.md) — Tarif Calculations & Surge Rules
- [PROVIDER_INTEGRATIONS.md](docs/PROVIDER_INTEGRATIONS.md) — Data Provider Adapters & API Specifications
- [DATA_FRESHNESS.md](docs/DATA_FRESHNESS.md) — Cache Expiry, Telemetry & Data Freshness Classification
- [SECURITY.md](docs/SECURITY.md) — Security Controls, Secrets & Privacy Measures
- [ENVIRONMENT_CONFIGURATION.md](docs/ENVIRONMENT_CONFIGURATION.md) — Environment Variables & API Keys Guide
- [TEST_REPORT.md](docs/TEST_REPORT.md) — Frontend Build & Backend Test Execution Summary
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel Deployment Guide & Production Checklist
