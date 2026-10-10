# Standard Data Dictionary & Schemas — Route Sense

## Overview

This document defines the core data schemas and field definitions used across the Route Sense frontend, API route handlers, and backend services.

---

## 1. ResolvedLocation Schema

| Field Name | Type | Description | Example |
|---|---|---|---|
| `provider` | `string` | Data provider name (`google`, `indian_transit_db`) | `"google"` |
| `providerPlaceId` | `string` | Canonical place identifier | `"ChIJW-T2gD35wjsR..."` |
| `displayName` | `string` | Main name of the location | `"Dadar Railway Station"` |
| `formattedAddress` | `string` | Full address context | `"Dadar East, Mumbai, Maharashtra 400014"` |
| `locality` | `string` | Sub-area / Locality | `"Dadar East"` |
| `city` | `string` | City name | `"Mumbai"` |
| `state` | `string` | State name | `"Maharashtra"` |
| `countryCode` | `string` | ISO 2-letter country code | `"IN"` |
| `latitude` | `number` | WGS84 Latitude coordinate | `19.0178` |
| `longitude` | `number` | WGS84 Longitude coordinate | `72.8478` |
| `placeTypes` | `array` | Recognized place categories | `["railway_station"]` |
| `dataSource` | `string` | Source authority | `"Indian Railways"` |
| `retrievedAt` | `string` | ISO 8601 Retrieval timestamp | `"2026-10-10T17:30:00Z"` |

---

## 2. NormalizedJourneyOption Schema

| Field Name | Type | Description | Example |
|---|---|---|---|
| `journey_id` | `string` | Unique journey result ID | `"JNY-CAB-1728581"` |
| `transport_mode` | `enum` | `TRAIN`, `METRO`, `BUS`, `CAB`, `AUTO`, `BIKE`, `CAR_PERSONAL`, `MOTORCYCLE_PERSONAL` | `"CAB"` |
| `vehicle_category` | `string` | Specific vehicle / service category | `"Uber Go / Hatchback"` |
| `operator` | `string` | Operator or service brand | `"Uber / Ola"` |
| `title` | `string` | Descriptive title | `"Hatchback Cab (Uber Go / Ola Mini)"` |
| `route_distance_km` | `number` | Total distance in kilometres | `11.8` |
| `total_duration_minutes`| `number` | Total duration in minutes | `28` |
| `quoted_price_inr` | `number` | Calculated fare in Indian Rupees | `218` |
| `price_type` | `enum` | `LIVE_PROVIDER_QUOTE`, `OFFICIAL_TARIFF`, `API_TRANSIT_FARE`, `ESTIMATED_OPERATING_COST`, `ESTIMATED_FARE` | `"ESTIMATED_FARE"` |
| `freshness_status` | `enum` | `LIVE`, `VERIFIED_TARIFF`, `STALE`, `UNAVAILABLE` | `"LIVE"` |
| `assumptions` | `array` | List of transparent fare assumptions | `["Base fare: ₹50", "Rate: ₹17.5/km"]` |
