# ROUTE SENSE — INDIA MOBILITY PRICING ARCHITECTURE

## Overview
Route Sense provides a normalized, multi-modal journey fare and routing comparison engine tailored for India's public and private transport ecosystem.

## Pricing Classification Model
Every journey option emitted by the engine carries an explicit `price_type`:

1. **`LIVE_PROVIDER_QUOTE`**: Direct quote returned by an authorized API (e.g. Google Places/Directions Transit API, Uber/Ola API).
2. **`OFFICIAL_TARIFF`**: Calculated from published Indian regulatory fare structures (e.g. Indian Railways Suburban tariff slabs, DMRC/Mumbai Metro fare charts, RTO auto-rickshaw meter rates).
3. **`API_TRANSIT_FARE`**: Transit route fare retrieved via public routing provider API.
4. **`ESTIMATED_OPERATING_COST`**: Fuel/energy operating cost for personal vehicle (Car/Motorcycle) calculated as:
   $$\text{Fuel Cost} = \frac{\text{Distance (km)}}{\text{Vehicle Efficiency (km/L)}} \times \text{Fuel Price (₹/L)} + \text{Tolls}$$
5. **`ESTIMATED_FARE`**: Documented fare derived from standard rate models when live API is unconfigured.
6. **`HISTORICAL_REFERENCE`**: Stale or reference pricing clearly tagged with provenance.
7. **`PRICE_UNAVAILABLE`**: Applied when no defensible fare can be determined.

## Supported Modes & Operators
- **Suburban Rail**: Central Railway, Western Railway, Southern Railway suburban fare bands.
- **Metro Rail**: DMRC Delhi, Mumbai Metro One/Line 2A/7, Namma Metro Bengaluru, Hyderabad Metro, Pune Metro, Chennai Metro.
- **City Bus**: BEST Mumbai, BMTC Bengaluru, DTC Delhi, MSRTC Maharashtra, KSRTC Karnataka, TSRTC Telangana.
- **Cab / Taxi**: Uber / Ola Hatchback, Sedan, SUV with peak-hour surge detection.
- **Auto-Rickshaw**: Regulated municipal meter tariff (Base ₹23 + ₹15.33/km + night surcharge) vs App Auto.
- **Bike Taxi**: Rapido / Uber Moto upfront distance pricing.
- **Personal Vehicle**: Car and Motorcycle fuel & NHAI toll cost calculator with customizable fuel price and efficiency.

## Timezone & Data Freshness
- Default Timezone: `Asia/Kolkata` (IST)
- Internal ISO Timestamps: UTC (`observed_at`, `retrieved_at`, `effective_from`)
- Data Currency: INR (₹)
