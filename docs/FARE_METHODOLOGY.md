# ROUTE SENSE — FARE CALCULATION METHODOLOGY

## 1. Suburban Railway Fares
- **Base Tariff**: Indian Railways Suburban Fare Slabs (II-Class Ordinary)
- **Distance Slabs**:
  - 1–10 km: ₹5
  - 11–20 km: ₹10
  - 21–45 km: ₹15
  - 46–80 km: ₹20
  - > 80 km: ₹25
- **Multi-Passenger**: Total Fare = Base Fare × Passenger Count

## 2. Metro Rail Fares
- **Distance Slabs**:
  - 0–2 km: ₹10
  - 2–5 km: ₹20
  - 5–12 km: ₹30
  - 12–21 km: ₹40
  - 21–32 km: ₹50
  - > 32 km: ₹60

## 3. Cab & Ride-Hailing Fares
- **Formula**:
  $$\text{Cab Fare} = (\text{Base Fare} + \text{Distance} \times \text{Per-KM Rate} + \text{Duration} \times \text{Per-Minute Rate}) \times \text{Surge Multiplier}$$
- **Surge Periods**: 08:00–10:30 IST & 17:30–20:30 IST (1.25x surge multiplier applied)
- **Vehicle Scaling**: Cab fare is fixed per vehicle (up to 4 passengers) and does not scale linearly with passenger count.

## 4. Auto-Rickshaw Meter Fares
- **Day Tariff**: Minimum ₹23 for first 1.5 km, ₹15.33/km thereafter.
- **Night Surcharge**: 25% surcharge added between 23:00 and 05:00 IST.

## 5. Personal Vehicle Operating Cost
- **Formula**:
  $$\text{Fuel Cost} = \frac{\text{Distance (km)}}{\text{Vehicle Mileage (km/L)}} \times \text{Fuel Price (₹/L)} + \text{NHAI Tolls}$$
- Default Fuel Price: ₹104.21/L
- Default Car Efficiency: 15.0 km/L | Motorcycle Efficiency: 45.0 km/L
