# Pricing Methodology & Calculation Engine — Route Sense

## 1. Overview
Route Sense operates an independent, mode-specific transport pricing engine designed specifically for India. A single generic ₹/km formula is strictly avoided. Instead, each transport mode utilizes its authorized tariff schedule, official telescopic slab, or calibrated operational equation.

---

## 2. Seven Strict Price Classifications

Every displayed price across Route Sense is strictly classified under one of seven distinct pricing categories:

| Price Type Tag | Definition | Usage Context |
|---|---|---|
| `LIVE_PROVIDER_QUOTE` | Real-time quote returned by an authorized API provider | Upfront ride-hailing quotes where supported |
| `OFFICIAL_TARIFF` | Verified regulated tariff published by a government transport undertaking | Suburban Railway, Metro Corporations (DMRC, Mumbai Metro), Municipal Auto meters |
| `API_TRANSIT_FARE` | Public transit ticket fare returned directly by Google Routes API | Google Routes `travelAdvisory.transitFare` |
| `ESTIMATED_FARE` | Mode-specific benchmark estimate derived from documented operational slabs | Intercity private buses, bike taxis |
| `ESTIMATED_OPERATING_COST` | Direct consumable expenditure calculated from real road distance and efficiency | Personal petrol/diesel car and motorcycle running costs |
| `HISTORICAL_REFERENCE` | Documented reference benchmark provided for verification | Indian Railways telescopic intercity passenger fares (2S, SL, 3A, 2A, 1A) |
| `PRICE_UNAVAILABLE` | Explicit state indicating that the transport route is valid but ticket pricing is unknown | Transit legs where provider returns zero fare |

---

## 3. Mode-Specific Tariff Adapters

### 3.1 Suburban Railway Adapter (Mumbai, Chennai, Kolkata Suburban)
Regulated stage tariff:
- $d \le 10\text{ km}$: ₹5
- $10 < d \le 20\text{ km}$: ₹10
- $20 < d \le 45\text{ km}$: ₹15
- $45 < d \le 80\text{ km}$: ₹20
- $d > 80\text{ km}$: ₹25
- AC Suburban: 3× to 5× First Class base rate (₹35 minimum).

### 3.2 Metro Rail Adapter (DMRC, Mumbai Metro, Namma Metro, Hyderabad, Chennai)
Distance slab matrix:
- $0 - 2\text{ km}$: ₹10
- $2 - 5\text{ km}$: ₹20
- $5 - 12\text{ km}$: ₹30
- $12 - 21\text{ km}$: ₹40
- $21 - 32\text{ km}$: ₹50
- $> 32\text{ km}$: ₹60 (Max standard token tariff)

### 3.3 Intercity Express Railway Adapter (Indian Railways / IRCTC)
Telescopic distance slabs evaluated across all 5 standard passenger classes:
- **Second Sitting (2S)**: Minimum ₹10, Base rate ₹0.35/km, Reservation fee ₹15, Superfast surcharge ₹15 (for $d > 100\text{ km}$).
- **Sleeper Class (SL)**: Minimum ₹35, Base rate ₹0.60/km, Reservation fee ₹20, Superfast surcharge ₹20.
- **AC 3-Tier (3A)**: Minimum ₹105, Base rate ₹1.40/km, Reservation fee ₹40, Superfast surcharge ₹45, GST 5%.
- **AC 2-Tier (2A)**: Minimum ₹180, Base rate ₹1.90/km, Reservation fee ₹50, Superfast surcharge ₹45, GST 5%.
- **First AC (1A)**: Minimum ₹360, Base rate ₹3.25/km, Reservation fee ₹60, Superfast surcharge ₹75, GST 5%.

### 3.4 City & Intercity Bus Adapters
- **Ordinary / Non-AC City Bus**: Base ₹5 (first 5 km), ₹1.05/km thereafter.
- **Express / AC City Bus**: Base ₹10, ₹1.55/km thereafter.
- **Intercity State RTC**: ₹1.55/km (Express), ₹2.25/km (AC Seater).
- **Volvo Multi-Axle / AC Sleeper**: ₹3.10/km.

### 3.5 Ride-Hailing Cabs (Mini, Sedan, SUV)
$$\text{Fare}_{\text{cab}} = \left( \text{BaseFare} + d \cdot \text{PerKmRate} + t_{\text{mins}} \cdot \text{PerMinRate} \right) \cdot \text{SurgeMultiplier} + \text{Tolls}$$
- **Hatchback / Mini**: Base ₹50 + ₹14.50/km + ₹1.50/min.
- **Sedan**: Base ₹75 + ₹17.50/km + ₹2.00/min.
- **SUV**: Base ₹110 + ₹22.00/km + ₹2.50/min.
- **Peak Surge**: $1.25\times$ applied during Indian commute windows (08:00–10:30 & 17:30–20:30).

### 3.6 Auto-Rickshaw Adapter
- **Regulated Municipal Meter**: Base ₹23 for first 1.5 km; ₹15.33/km thereafter.
- **Night Surcharge**: $+25\%$ applied between 23:00 and 05:00 IST.

### 3.7 Bike Taxi Adapter (Rapido / Uber Moto)
- Upfront distance tariff: Base ₹25 + ₹8.50/km.

### 3.8 Personal Vehicle Operating Cost
$$\text{Fuel Cost} = \frac{\text{Route Distance (km)}}{\text{Vehicle Efficiency (km/L)}} \times \text{Fuel Price (₹/L)}$$
- Reference Petrol Price: ₹104.21/L (Current Indian metropolitan benchmark).
- Average Car Mileage: 15.0 km/L | Motorcycle: 45.0 km/L.
- NHAI Expressway Toll Estimation: ₹85 applied per 40 km on corridors $> 35\text{ km}$.
