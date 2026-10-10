# Fare Reference Benchmarks — Route Sense

## Overview

Route Sense maintains versioned reference benchmarks for initial fare calculations across Indian transportation modes. These benchmarks reflect official tariff matrices and empirical market observations across major Indian metropolitan hubs.

---

## 1. Indian Railways (Base Fare Rates)

| Class | Candidate Minimum Fare | Base Rate per KM | Verification Status | Source Reference |
|---|---|---|---|---|
| **Second Sitting (2S)** | ₹10 | ₹0.30 – ₹0.40 | Verified Tariff | Indian Railways Passenger Fare Table |
| **Sleeper (SL)** | ₹35 | ₹0.60 | Verified Tariff | Indian Railways Passenger Fare Table |
| **AC 3-Tier (3A)** | ₹105 | ₹1.30 – ₹1.50 | Verified Tariff | Indian Railways Passenger Fare Table |
| **AC 2-Tier (2A)** | ₹180 | ₹1.80 – ₹2.00 | Verified Tariff | Indian Railways Passenger Fare Table |
| **First AC (1A)** | ₹360 | ₹3.00 – ₹3.50 | Verified Tariff | Indian Railways Passenger Fare Table |

### Surcharges & Special Rules
- **Superfast Surcharge**: ₹15 (2S), ₹30 (SL), ₹45 (3A/2A/1A).
- **GST on AC Classes**: 5% applied to net base fare.
- **Tatkal Surcharges**: 10% for 2S, 30% of base fare for SL, 3A, 2A, 1A (subject to min/max caps).

---

## 2. Ride-Hailing & Aggregator Benchmarks (10 KM Metropolitan Example)

| Mode / Product | Base Fare (₹) | Distance Rate (₹/km) | Typical 10 KM Fare (₹) | Pricing Methodology |
|---|---|---|---|---|
| **Bike Taxi (Rapido/Uber Moto)** | ₹20 – ₹25 | ₹5 – ₹8 | ₹47 – ₹75 | Base + Distance + Time |
| **Auto-Rickshaw (Metered/App)** | ₹25 – ₹30 | ₹10 – ₹15 | ₹97 – ₹128 | Regulated Meter / Upfront App |
| **Cab Hatchback (Uber Go / Ola Mini)** | ₹40 – ₹60 | ₹15 – ₹20 | ₹158 – ₹192 | Upfront Dynamic Quote |
| **Cab Sedan (Uber Premier / Ola Sedan)**| ₹60 – ₹80 | ₹24 – ₹28 | ₹268 – ₹270 | Upfront Dynamic Quote |
| **Cab SUV (UberXL / Ola SUV)** | ₹80 – ₹100 | ₹30 – ₹35 | ₹314 – ₹347 | Upfront Dynamic Quote |

---

## 3. Bus Fare Benchmarks

| Service Category | Rate per KM (₹) | Minimum Fare (₹) | Example Operators |
|---|---|---|---|
| **City Bus (Ordinary / Non-AC)** | ₹0.90 – ₹1.20 | ₹5 | BMTC, BEST, DTC, MTC |
| **City Bus (AC Express / Vayu Vajra)** | ₹1.80 – ₹2.50 | ₹10 – ₹20 | BMTC Volvo, BEST AC, DTC AC |
| **State Express / Semi-Deluxe** | ₹1.30 – ₹1.80 | ₹20 | MSRTC Express, KSRTC Express |
| **Intercity AC Volvo / Sleeper** | ₹2.50 – ₹3.50+ | ₹150 | KSRTC Airavat, MSRTC Shivneri, Private |

---

## 4. Personal Vehicle Fuel Operating Cost

$$\text{Fuel Cost} = \left( \frac{\text{Distance (km)}}{\text{Vehicle Efficiency (km/l)}} \right) \times \text{Fuel Price (₹/l)} + \text{Tolls}$$

- **Petrol Reference Price**: ₹104.21 / litre (Mumbai/Bengaluru average benchmark).
- **Diesel Reference Price**: ₹92.15 / litre.
- **Car Fuel Efficiency Benchmark**: $15.0\text{ km/l}$.
- **Motorcycle Efficiency Benchmark**: $45.0\text{ km/l}$.
