# Architecture & System Design — Route Sense

## 1. Executive Summary
Route Sense is a spatial public transport journey planning and mobility intelligence platform built specifically for the Indian market. The architecture is engineered around a cohesive, Vercel-compatible Next.js App Router foundation, strict TypeScript type checking, Zod request/response validation, and secure server-side Google Maps Platform integrations.

```mermaid
flowchart TD
    User["Commuter / User"] -->|Spatial UI| NextJS["Next.js App Router (Frontend)"]
    NextJS -->|Zod Validated API| ApiRoutes["Server Route Handlers (/api/v1)"]
    ApiRoutes -->|Places API New| GPlaces["Google Places Autocomplete & Details"]
    ApiRoutes -->|Routes API (Drive & Transit)| GRoutes["Google Routes API"]
    ApiRoutes -->|Fallback Transit Hubs| TransitDB["Verified Indian Transit DB"]
    ApiRoutes -->|Multimodal Tariffs| PricingEngine["Pricing Intelligence Engine"]
    PricingEngine -->|Telescopic Slabs| RailAdapter["Indian Railways (Suburban & 2S/SL/3A/2A/1A)"]
    PricingEngine -->|Distance Slabs| MetroAdapter["Metro Rail (DMRC/Mumbai/Namma)"]
    PricingEngine -->|Stage Slabs| BusAdapter["City & State RTC Buses"]
    PricingEngine -->|Base + Km + Peak| CabAdapter["Ride-Hailing Cabs (Mini/Sedan/SUV)"]
    PricingEngine -->|Meter + Night| AutoAdapter["Auto-Rickshaw (Regulated Meter)"]
    PricingEngine -->|Upfront Distance| BikeAdapter["Bike Taxi (Rapido/Uber Moto)"]
    PricingEngine -->|Fuel & Efficiency| PersonalAdapter["Personal Vehicle Running Cost"]
    ApiRoutes -->|Normalized Journey Payload| NextJS
```

---

## 2. Core Architectural Principles

1. **Spatial UI as Primary Surface**: The map canvas and floating command panels form a unified mobility command surface. Visual depth, backdrop blur, and geographic orientation guide user actions.
2. **Strict Two-Field Search**: The primary user journey requires only `Source` and `Destination`. Time defaults to the current moment in Asia/Kolkata (`en-IN`).
3. **Provider Decoupling**: Location lookup, route computation, and pricing engines operate as independent modular adapters.
4. **Data Integrity & Zero Hallucination**: Every displayed price, distance, and duration is explicitly classified as live provider quote, official tariff, API transit fare, estimated running cost, or historical benchmark. When fares are unavailable, they are transparently marked as unavailable.
5. **Security by Isolation**: Google Maps Platform server secrets (`GOOGLE_MAPS_SERVER_API_KEY`) remain strictly server-side and are never exposed in browser bundles or client requests.

---

## 3. Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict type checking)
- **Validation**: Zod (Runtime validation for query parameters and responses)
- **Styling**: Tailwind CSS & Lucide React
- **Spatial Mapping**: Leaflet with Carto Dark Matter tiles & Google Routes API polyline vector integration
- **Testing**: Vitest for unit & integration testing
- **Deployment**: Vercel Serverless Architecture

---

## 4. Normalized Data Model Flow

1. User enters Source and Destination queries in `LocationAutocomplete`.
2. Autocomplete queries `/api/v1/location/autocomplete`, validated via `LocationAutocompleteQuerySchema`.
3. Selecting a prediction resolves coordinates through `/api/v1/location/resolve`.
4. Route search is submitted to `/api/v1/planner/route`, validated via `RoutePlannerQuerySchema`.
5. Google Routes API computes traffic-aware road distance/duration and public transit legs.
6. The Multi-Modal Pricing Engine calculates mode-specific tariffs across 8 transport categories.
7. Payloads are returned as `NormalizedJourneyOption` objects and rendered on the Spatial UI comparison panel.
