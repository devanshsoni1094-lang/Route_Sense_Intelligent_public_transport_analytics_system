# Google Maps Platform Integration — Route Sense

## 1. Overview
Route Sense utilizes the Google Maps Platform as its primary location intelligence and routing ecosystem for India. All external API requests are performed strictly server-side via Next.js Route Handlers to ensure credentials never leak into client-side JavaScript bundles.

---

## 2. Integrated Google APIs

### 2.1 Google Places API (New)
- **Endpoint**: `POST https://places.googleapis.com/v1/places:autocomplete`
- **Field Masks**: `suggestions.placePrediction.placeId`, `suggestions.placePrediction.text`, `suggestions.placePrediction.structuredFormat`, `suggestions.placePrediction.types`
- **Region Restriction**: `includedRegionCodes: ["in"]`
- **Purpose**: Provides real-time Indian address, locality, railway station, metro station, bus terminus, and landmark suggestions.
- **Session Tokens**: Supported to group autocomplete queries with subsequent place resolution.

### 2.2 Google Place Details (New)
- **Endpoint**: `GET https://places.googleapis.com/v1/places/{placeId}`
- **Field Masks**: `id,displayName,formattedAddress,location,addressComponents`
- **Purpose**: Resolves canonical WGS84 geographic coordinates (`latitude`, `longitude`) and administrative hierarchy (City, District, State).
- **Caching**: 60-minute in-memory LRU cache to prevent duplicate billable queries for popular hubs.

### 2.3 Google Routes API (New Directions)
- **Endpoint**: `POST https://routes.googleapis.com/directions/v2:computeRoutes`
- **Field Masks**:
  - `routes.duration,routes.staticDuration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.travelAdvisory.transitFare`
- **Modes Supported**:
  1. `DRIVE`: Includes `routingPreference: "TRAFFIC_AWARE"` to capture live Indian traffic delays and congested commute durations.
  2. `TRANSIT`: Retrieves real public transit legs, vehicle types, transit agencies, and stop sequences.
- **Geometry Processing**: Polyline strings decoded using the official 5-decimal lossy compression algorithm into precise `[lat, lng]` coordinate corridors.

---

## 3. Transit Fare Handling (Section 6.5 Compliance)
- Google Routes returns transit fare data only when an authorized agency tariff is available for every leg of the trip.
- When Google returns an official fare, it is classified as `API_TRANSIT_FARE`.
- When Google transit routing is successful but fare is omitted by the transit authority, Route Sense cross-references verified official stage tariffs (e.g. DMRC / Mumbai Suburban distance slabs) and explicitly marks the price as `OFFICIAL_TARIFF` or `PRICE_UNAVAILABLE`.
- **Zero Hallucination Rule**: Under no circumstances does Route Sense manufacture fake train schedules or simulate moving vehicles.

---

## 4. Credential Security & Header Restrictions
- **Server Secret**: Configured strictly in `GOOGLE_MAPS_SERVER_API_KEY`.
- **Sanitization**: All log output is passed through `sanitizeLogMessage()` which strips API key tokens and redaction strings before standard output.
- **Header Authentication**: Requests use `X-Goog-Api-Key` headers instead of query parameters where possible to prevent query string leakage in access logs.
