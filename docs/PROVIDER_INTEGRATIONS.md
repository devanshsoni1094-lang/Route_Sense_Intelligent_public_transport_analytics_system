# ROUTE SENSE — PROVIDER INTEGRATIONS & ADAPTER SPECIFICATION

## Active & Configured Providers

| Provider / Agency | Coverage | Integration Type | Status | Fallback Strategy |
|---|---|---|---|---|
| **Google Places Autocomplete API** | All 28 States & 8 UTs | API (`GOOGLE_MAPS_API_KEY`) | Active / Live | Indian Transit DB (`indianTransitDb.ts`) |
| **Google Directions Transit API** | Major Indian Metro Cities | API (`GOOGLE_MAPS_API_KEY`) | Active / Live | Haversine + Transit Tariff Slabs |
| **Indian Railways Suburban Division** | Mumbai, Chennai, Kolkata | Official Tariff Matrix | Active | Tariff Slab Calculation |
| **State Metro Corporations (DMRC/BMTC/MMRDA)** | Delhi, Mumbai, Blr, Hyd, Pune | Fare Matrix | Active | Distance Zone Slabs |
| **Municipal Auto Rickshaw Union (RTO)** | Mumbai, Delhi, Bengaluru, Pune | Meter Tariff Rules | Active | Regulated Base + Per-KM Rate |
| **Rapido / Uber Moto** | Tier-1 & Tier-2 Indian Cities | Distance Rate Model | Active | Base ₹25 + ₹8.5/km |
| **NHAI Toll & Fuel Calculator** | Interstate & Expressway Corridors | Operating Cost Engine | Active | Dynamic Fuel & Toll Model |

## Environment Variables Required
```env
GOOGLE_MAPS_API_KEY="AIzaSy..."
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."
```
If environment keys are absent, zero-config fallbacks execute cleanly without throwing errors or breaking UI state.
