# Pricing Methodology & Calculation Engine — Route Sense

## Overview

Route Sense enforces strict transport pricing equations tailored to each specific travel mode across India. The system eliminates single generic per-kilometre formulas and hardcoded prices.

---

## 1. Mode-Specific Calculation Equations

### 1.1 Suburban Railway Tariff Formula
$$\text{Fare}_{\text{suburban}} = \begin{cases}
₹5 & d \le 10\text{ km} \\
₹10 & 10 < d \le 20\text{ km} \\
₹15 & 20 < d \le 35\text{ km} \\
₹20 & 35 < d \le 50\text{ km} \\
₹20 + \lfloor (d - 50)/15 \rfloor \times 5 & d > 50\text{ km}
\end{cases}$$

### 1.2 Metro Rail Tariff Formula
$$\text{Fare}_{\text{metro}} = \min\left(60, \max\left(10, \text{round}\left(10 + d \times 2.2\right)\right)\right)$$

### 1.3 Ride-Hailing Cab Formula (with Surge)
$$\text{Fare}_{\text{cab}} = \left[ \text{BaseFare} + (d \times \text{PerKmRate}) + (t_{\text{mins}} \times \text{PerMinRate}) \right] \times \text{SurgeMultiplier} + \text{Tolls}$$

Where peak hour surge multiplier $\text{SurgeMultiplier} \in [1.0, 1.8]$.

---

## 2. Price Classification Tagging

Every option returned by the engine carries an explicit price type tag:
- `LIVE_PROVIDER_QUOTE`: Real-time quote fetched via direct API integration.
- `OFFICIAL_TARIFF`: Computed from verified government/operator fare tables (e.g. Indian Railways, DMRC).
- `API_TRANSIT_FARE`: Fare returned directly by GTFS or routing transit endpoints.
- `ESTIMATED_OPERATING_COST`: Calculated running cost for personal vehicles based on fuel price and efficiency.
- `ESTIMATED_FARE`: Benchmark-derived estimate with disclosed formula assumptions.

---

## 3. Transparency & Disclaimers

All estimates are accompanied by explicit assumption notes (e.g. `Base fare: ₹50`, `Fuel price: ₹104.21/L`, `GST included: 5%`).
