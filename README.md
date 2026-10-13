# Route Sense — Spatial Mobility Intelligence Platform for India

**Product Tagline:** *Find the best way to get there.*  
**Market:** India | **Currency:** Indian Rupees (₹) | **Default Timezone:** Asia/Kolkata (`en-IN`)  
**Primary Location & Routing Provider:** Google Maps Platform (Places API New, Routes API)  
**Deployment Target:** Vercel  
**GitHub Repository:** [Route_Sense_Intelligent_public_transport_analytics_system](https://github.com/devanshsoni1094-lang/Route_Sense_Intelligent_public_transport_analytics_system)

---

## 🌟 The Spatial UI Experience

Route Sense has been completely rebuilt as a modern **spatial mobility command surface** for everyday journeys across India:

- **Immersive Map Canvas**: Full-viewport spatial map with dark slate Carto Dark Matter tiles, glowing vector polyline corridors, and animated beacon markers for Origin and Destination.
- **Floating Translucent Surfaces**: High-depth translucent command panels (`backdrop-blur-2xl bg-slate-950/90`) that provide instant access without obscuring geographic orientation.
- **Strict Two-Input Search**: Keeps the homepage user interface radically simple — `Source` and `Destination`, with a subtle one-click swap control.
- **Zero Hallucination Guarantee**: Every fare is strictly classified (`LIVE_PROVIDER_QUOTE`, `OFFICIAL_TARIFF`, `API_TRANSIT_FARE`, `ESTIMATED_OPERATING_COST`, `ESTIMATED_FARE`, `HISTORICAL_REFERENCE`, or `PRICE_UNAVAILABLE`). No fake fares or simulated real-time positions are ever presented.
- **Interactive Itinerary & Leg Highlighting**: Selecting any step in the step-by-step corridor breakdown highlights that specific transit segment on the map canvas.

---

## 🚆 Multi-Modal Transport Comparison

Route Sense evaluates real road and transit corridors across 8 transport modes:

1. **Suburban & Local Trains**: Mumbai, Chennai, and Kolkata suburban railway distance tariff bands (₹5, ₹10, ₹15, ₹20, ₹25) and AC EMU tariffs.
2. **Intercity Express Rail**: IRCTC telescopic distance slabs across all 5 classes:
   - Second Sitting (2S)
   - Sleeper Class (SL)
   - AC 3-Tier (3A)
   - AC 2-Tier (2A)
   - First AC (1A)  
   *(Includes reservation charges, superfast surcharges, and 5% AC GST)*.
3. **Metro Rapid Transit**: Stage and distance slab matrices for DMRC (Delhi), Mumbai Metro, Namma Metro (Bengaluru), Chennai, Hyderabad, and Pune Metros.
4. **City & Intercity Buses**: Ordinary non-AC city buses, express semi-deluxe, and AC sleeper/Volvo multi-axle services (BEST, BMTC, DTC, MSRTC, KSRTC).
5. **Ride-Hailing Cabs**: Hatchback/Mini (Uber Go, Ola Mini), Sedan (Uber Premier, Ola Prime), and SUV (UberXL, Ola SUV) with peak commute surge detection.
6. **Auto-Rickshaws**: Regulated municipal meter tariff (Base ₹23 + ₹15.33/km) with 25% night surcharge detection.
7. **Bike Taxis**: Rapido / Uber Moto upfront distance tariffs (Base ₹25 + ₹8.50/km).
8. **Personal Vehicles**: Direct consumable operating cost based on real Google Routes road distance, vehicle fuel efficiency (km/L), and current fuel prices (₹104.21/L petrol reference), plus NHAI highway toll estimates.

---

## 🛠️ Technology Architecture

- **Framework**: Next.js 14 App Router
- **Language**: TypeScript (Strict type checking)
- **Validation**: Zod runtime validation for all API inputs and responses
- **Design & Icons**: Tailwind CSS, Lucide React
- **Geospatial & Mapping**: Leaflet, Carto Dark Matter, Google Routes API 5-decimal lossy polyline decoding
- **Testing**: Vitest 4.1.11 (41 automated unit & integration tests)
- **Deployment**: Vercel Serverless Architecture

---

## 🏃 Local Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and configure your Google Maps API credentials:
```bash
cp .env.example .env.local
```

In `.env.local`:
```env
GOOGLE_MAPS_SERVER_API_KEY=your_google_maps_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=your_google_maps_api_key_here
TIMEZONE=Asia/Kolkata
NEXT_PUBLIC_DEFAULT_COUNTRY=IN
```

### 3. Run Automated Tests
```bash
npm test
```
*Executes all 41 unit and integration tests across schemas, pricing adapters, Google Maps services, and location providers.*

### 4. Run Production Build
```bash
npm run build
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view Route Sense.

---

## 📚 Complete Technical Documentation

Full engineering and operational specifications are available in the [`docs/`](docs/) directory:

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — System Architecture, Flow Diagrams & Component Hierarchy
- [SPATIAL_UI_DESIGN.md](docs/SPATIAL_UI_DESIGN.md) — Spatial UI Design System, Tokens, Palette & Layouts
- [GOOGLE_MAPS_INTEGRATION.md](docs/GOOGLE_MAPS_INTEGRATION.md) — Places API (New), Routes API & Security Measures
- [LOCATION_SEARCH.md](docs/LOCATION_SEARCH.md) — Indian Places Autocomplete & Resolution Pipeline
- [ROUTING_METHODOLOGY.md](docs/ROUTING_METHODOLOGY.md) — Route Distances, Circuity Factors & Leg Processing
- [PRICING_METHODOLOGY.md](docs/PRICING_METHODOLOGY.md) — Calculation Equations, Fare Adapters & 7-Tier Price Classification
- [FARE_REFERENCE_BENCHMARKS.md](docs/FARE_REFERENCE_BENCHMARKS.md) — Indian Railways, Bus, Cab & Auto Reference Data
- [DATA_FRESHNESS.md](docs/DATA_FRESHNESS.md) — Freshness Statuses (`LIVE`, `VERIFIED_TARIFF`, `STALE`), TTL & Policies
- [PROVIDER_INTEGRATIONS.md](docs/PROVIDER_INTEGRATIONS.md) — External Provider Integrations, Coverage & Fallbacks
- [SECURITY.md](docs/SECURITY.md) — Secret Protection, Header Isolation, Redaction & Privacy
- [ENVIRONMENT_CONFIGURATION.md](docs/ENVIRONMENT_CONFIGURATION.md) — Environment Variable Specifications
- [TEST_REPORT.md](docs/TEST_REPORT.md) — Automated Test Results & Production Build Output
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel Production Deployment Runbook & GCP Prerequisites
