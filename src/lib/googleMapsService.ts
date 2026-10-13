/**
 * Route Sense — Google Maps Platform Service
 * 
 * Supports:
 * 1. Places API (New & Classic): Autocomplete, Place Details, Geocoding
 * 2. Routes API (New & Classic Directions): DRIVE mode (traffic-aware) & TRANSIT mode (public transit)
 * 3. Transit Fare Extraction (API-returned transit fares)
 * 4. Polyline decoding for spatial corridor display
 * 5. Secure credential management and sanitized diagnostics
 */

import { ResolvedLocation, PlaceCategory } from "@/types";

/**
 * Retrieves the server-side API key.
 * Strictly server-side: uses GOOGLE_MAPS_SERVER_API_KEY (preferred) or GOOGLE_MAPS_API_KEY (fallback).
 * Never uses NEXT_PUBLIC_ variables on server to prevent cross-contamination.
 */
export function getGoogleMapsServerKey(): string {
  const key =
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";
  return key.trim();
}

/**
 * Backward compatibility alias
 */
export function getGoogleMapsApiKey(): string {
  return getGoogleMapsServerKey();
}

/**
 * Checks if a Google Maps Server API key is configured
 */
export function isGoogleMapsConfigured(): boolean {
  return Boolean(getGoogleMapsServerKey());
}

/**
 * Sanitizes log messages to ensure API keys are never leaked to logs or error messages.
 */
export function sanitizeLogMessage(message: string): string {
  if (!message) return "";
  const key = getGoogleMapsServerKey();
  let clean = message;
  if (key && key.length > 5) {
    clean = clean.split(key).join("[REDACTED_API_KEY]");
  }
  return clean
    .replace(/key=[^&\s"']+/gi, "key=[REDACTED]")
    .replace(/X-Goog-Api-Key:\s*[^,\s]+/gi, "X-Goog-Api-Key: [REDACTED]");
}

// In-memory cache for Place Details to reduce duplicate API queries
const placeDetailsCache = new Map<
  string,
  { lat: number; lng: number; address: string; city: string; state: string; timestamp: number }
>();

/**
 * Decode Google encoded polyline string to [lat, lng] array
 */
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded) return [];
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Categorize Google place types into PlaceCategory
 */
export function mapGoogleTypesToCategory(types: string[]): PlaceCategory {
  if (!types || types.length === 0) return "address";
  const t = types.map((s) => s.toLowerCase());

  if (t.some((x) => x.includes("subway") || x.includes("metro") || x.includes("light_rail"))) {
    return "metro_station";
  }
  if (t.some((x) => x.includes("bus_station") || x.includes("bus_stop"))) {
    return "bus_terminal";
  }
  if (t.some((x) => x.includes("railway") || x.includes("train_station"))) {
    return "railway_station";
  }
  if (t.some((x) => x.includes("airport") || x.includes("aerodrome"))) {
    return "airport";
  }
  if (t.some((x) => x === "transit_station")) {
    return "railway_station";
  }
  if (
    t.some(
      (x) =>
        x.includes("tourist_attraction") ||
        x.includes("point_of_interest") ||
        x.includes("landmark") ||
        x.includes("monument") ||
        x.includes("stadium") ||
        x.includes("hospital") ||
        x.includes("university") ||
        x.includes("school") ||
        x.includes("shopping_mall")
    )
  ) {
    return "landmark";
  }
  if (
    t.some(
      (x) =>
        x.includes("locality") ||
        x.includes("sublocality") ||
        x.includes("neighborhood") ||
        x.includes("administrative_area") ||
        x.includes("city")
    )
  ) {
    return "locality";
  }
  return "address";
}

export interface GoogleApiStatusInfo {
  isConfigured: boolean;
  status: "OK" | "KEY_MISSING" | "API_NOT_ENABLED" | "BILLING_REQUIRED" | "REQUEST_DENIED" | "ERROR";
  message: string;
}

/**
 * Classifies an HTTP error response from Google Maps APIs
 */
function classifyGoogleError(status: number, errorData: any): GoogleApiStatusInfo {
  const errMsg = errorData?.error?.message || errorData?.error_message || "";
  const errStatus = errorData?.error?.status || errorData?.status || "";
  const combined = `${errStatus} ${errMsg}`.toUpperCase();

  if (status === 400 && (combined.includes("API_KEY_INVALID") || combined.includes("KEY_INVALID"))) {
    return {
      isConfigured: true,
      status: "REQUEST_DENIED",
      message: "Google Maps API key is invalid or unrecognized."
    };
  }

  if (combined.includes("PERMISSION_DENIED") || combined.includes("REQUEST_DENIED")) {
    return {
      isConfigured: true,
      status: "REQUEST_DENIED",
      message: "Google Maps API request was denied. Check API key restrictions."
    };
  }

  if (combined.includes("API HAS NOT BEEN USED") || combined.includes("ACCESS_NOT_CONFIGURED")) {
    return {
      isConfigured: true,
      status: "API_NOT_ENABLED",
      message: "The requested Google Maps API is not enabled in your Google Cloud Console."
    };
  }

  if (combined.includes("BILLING") || combined.includes("BILLING_NOT_ENABLED")) {
    return {
      isConfigured: true,
      status: "BILLING_REQUIRED",
      message: "Google Maps billing is not active for this project in Google Cloud Console."
    };
  }

  return {
    isConfigured: true,
    status: "ERROR",
    message: sanitizeLogMessage(errMsg || `Google Maps API returned HTTP ${status}`)
  };
}

/**
 * 1. Google Places Autocomplete (Calls Places API (New) with fallback to Classic)
 */
export async function googlePlacesAutocomplete(query: string): Promise<{
  results: ResolvedLocation[];
  statusInfo?: GoogleApiStatusInfo;
}> {
  const apiKey = getGoogleMapsServerKey();
  if (!apiKey) {
    return {
      results: [],
      statusInfo: {
        isConfigured: false,
        status: "KEY_MISSING",
        message: "GOOGLE_MAPS_SERVER_API_KEY is not configured in .env.local"
      }
    };
  }

  if (!query || query.trim().length < 2) {
    return { results: [] };
  }

  // Attempt 1: Places API (New) - POST https://places.googleapis.com/v1/places:autocomplete
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "Accept-Language": "en-IN"
      },
      body: JSON.stringify({
        input: query.trim(),
        includedRegionCodes: ["in"],
        languageCode: "en",
        locationBias: {
          circle: {
            center: { latitude: 19.0760, longitude: 72.8777 },
            radius: 45000.0
          }
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        const parsed = data.suggestions
          .filter((s: any) => s.placePrediction)
          .map((s: any) => {
            const pred = s.placePrediction;
            const mainText = pred.structuredFormat?.mainText?.text || pred.text?.text || query;
            const secondaryText = pred.structuredFormat?.secondaryText?.text || "India";
            const fullAddress = pred.text?.text || `${mainText}, ${secondaryText}`;
            const placeId = pred.placeId || pred.place?.replace("places/", "") || `goog-${Date.now()}`;
            const category = mapGoogleTypesToCategory(pred.types || []);

            return {
              provider: "google" as const,
              providerPlaceId: placeId,
              displayName: mainText,
              formattedAddress: fullAddress,
              locality: mainText,
              city: secondaryText.split(",")[0]?.trim() || "India",
              state: secondaryText.split(",")[1]?.trim() || "India",
              countryCode: "IN" as const,
              latitude: 0, // Resolved on selection via place details
              longitude: 0,
              placeTypes: [category],
              dataSource: "Google Places API (New)",
              retrievedAt: new Date().toISOString(),
              secondaryAddress: secondaryText
            };
          });

        return {
          results: parsed,
          statusInfo: { isConfigured: true, status: "OK", message: "Places API (New) active" }
        };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      const errStatus = classifyGoogleError(res.status, errData);
      console.warn(sanitizeLogMessage(`Places API (New) error: ${errStatus.message}`));
    }
  } catch (err: any) {
    console.warn(sanitizeLogMessage(`Places API (New) request failed: ${err?.message || err}`));
  }

  // Attempt 2: Places API (Classic) - GET https://maps.googleapis.com/maps/api/place/autocomplete/json
  try {
    const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&components=country:in&location=19.0760,72.8777&radius=45000&language=en&key=${apiKey}`;

    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && Array.isArray(data.predictions)) {
        const parsed = data.predictions.map((pred: any) => {
          const mainText = pred.structured_formatting?.main_text || pred.description.split(",")[0];
          const secondaryText = pred.structured_formatting?.secondary_text || "India";
          const category = mapGoogleTypesToCategory(pred.types || []);

          return {
            provider: "google" as const,
            providerPlaceId: pred.place_id,
            displayName: mainText,
            formattedAddress: pred.description,
            locality: mainText,
            city: secondaryText.split(",")[0]?.trim() || "India",
            state: secondaryText.split(",")[1]?.trim() || "India",
            countryCode: "IN" as const,
            latitude: 0,
            longitude: 0,
            placeTypes: [category],
            dataSource: "Google Places API (Classic)",
            retrievedAt: new Date().toISOString(),
            secondaryAddress: secondaryText
          };
        });

        return {
          results: parsed,
          statusInfo: { isConfigured: true, status: "OK", message: "Google Places API (Classic) active" }
        };
      }
    }
  } catch (err: any) {
    console.warn(sanitizeLogMessage(`Classic Places API request failed: ${err?.message || err}`));
  }

  return { results: [] };
}

/**
 * 2. Resolve Place Details (Fetches canonical Lat/Lng and address context)
 */
export async function googleResolvePlaceDetails(
  placeId: string,
  displayNameHint?: string
): Promise<{ lat: number; lng: number; formattedAddress: string; city: string; state: string } | null> {
  const apiKey = getGoogleMapsServerKey();
  if (!apiKey || !placeId) return null;

  // Check cache
  const cached = placeDetailsCache.get(placeId);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return {
      lat: cached.lat,
      lng: cached.lng,
      formattedAddress: cached.address,
      city: cached.city,
      state: cached.state
    };
  }

  // Attempt 1: Places API (New) Place Details with header fieldmask
  try {
    const cleanId = placeId.startsWith("places/") ? placeId : `places/${placeId}`;
    const endpoint = `https://places.googleapis.com/v1/${cleanId}`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location,addressComponents",
        "Accept-Language": "en-IN"
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.location?.latitude && data.location?.longitude) {
        const lat = data.location.latitude;
        const lng = data.location.longitude;
        const addr = data.formattedAddress || displayNameHint || "India";

        let city = "India";
        let state = "India";

        if (Array.isArray(data.addressComponents)) {
          for (const comp of data.addressComponents) {
            const types = comp.types || [];
            if (types.includes("locality") || types.includes("administrative_area_level_2")) {
              city = comp.longText || city;
            }
            if (types.includes("administrative_area_level_1")) {
              state = comp.longText || state;
            }
          }
        }

        placeDetailsCache.set(placeId, { lat, lng, address: addr, city, state, timestamp: Date.now() });
        return { lat, lng, formattedAddress: addr, city, state };
      }
    }
  } catch (err: any) {
    console.warn(sanitizeLogMessage(`Places API (New) details failed: ${err?.message || err}`));
  }

  // Attempt 2: Classic Place Details API
  try {
    const endpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=geometry,formatted_address,name,address_components&key=${apiKey}`;

    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && data.result?.geometry?.location) {
        const lat = data.result.geometry.location.lat;
        const lng = data.result.geometry.location.lng;
        const addr = data.result.formatted_address || displayNameHint || "India";

        let city = "India";
        let state = "India";

        if (Array.isArray(data.result.address_components)) {
          for (const comp of data.result.address_components) {
            const types = comp.types || [];
            if (types.includes("locality") || types.includes("administrative_area_level_2")) {
              city = comp.long_name || city;
            }
            if (types.includes("administrative_area_level_1")) {
              state = comp.long_name || state;
            }
          }
        }

        placeDetailsCache.set(placeId, { lat, lng, address: addr, city, state, timestamp: Date.now() });
        return { lat, lng, formattedAddress: addr, city, state };
      }
    }
  } catch (err: any) {
    console.warn(sanitizeLogMessage(`Classic Place Details failed: ${err?.message || err}`));
  }

  // Attempt 3: Geocoding API by place_id
  try {
    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(
      placeId
    )}&key=${apiKey}`;

    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const first = data.results[0];
        const lat = first.geometry.location.lat;
        const lng = first.geometry.location.lng;
        const addr = first.formatted_address || displayNameHint || "India";

        placeDetailsCache.set(placeId, { lat, lng, address: addr, city: "India", state: "India", timestamp: Date.now() });
        return { lat, lng, formattedAddress: addr, city: "India", state: "India" };
      }
    }
  } catch (err: any) {
    console.warn(sanitizeLogMessage(`Geocoding by place_id failed: ${err?.message || err}`));
  }

  return null;
}

/**
 * 3. Geocode query string via Geocoding API
 */
export async function googleGeocodeQuery(
  query: string
): Promise<{ lat: number; lng: number; formattedAddress: string; placeId: string; city: string; state: string } | null> {
  const apiKey = getGoogleMapsServerKey();
  if (!apiKey || !query) return null;

  try {
    const mumbaiAddress =
      query.toLowerCase().includes("mumbai") ||
      query.toLowerCase().includes("thane") ||
      query.toLowerCase().includes("navi mumbai")
        ? query
        : `${query}, Mumbai`;
    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      mumbaiAddress
    )}&components=country:in&bounds=18.88,72.75|19.38,73.20&key=${apiKey}`;

    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const first = data.results[0];
        let city = "India";
        let state = "India";

        if (Array.isArray(first.address_components)) {
          for (const comp of first.address_components) {
            const types = comp.types || [];
            if (types.includes("locality") || types.includes("administrative_area_level_2")) {
              city = comp.long_name || city;
            }
            if (types.includes("administrative_area_level_1")) {
              state = comp.long_name || state;
            }
          }
        }

        return {
          lat: first.geometry.location.lat,
          lng: first.geometry.location.lng,
          formattedAddress: first.formatted_address,
          placeId: first.place_id,
          city,
          state
        };
      }
    }
  } catch (err: any) {
    console.warn(sanitizeLogMessage(`Google Geocoding failed: ${err?.message || err}`));
  }

  return null;
}

export interface GoogleRouteResult {
  distanceKm: number;
  durationMinutes: number;
  staticDurationMinutes?: number;
  isTrafficAware: boolean;
  delayMinutes: number;
  polyline: string;
  decodedCoordinates: [number, number][];
  trafficStatus: string;
  source: string;
}

export interface GoogleTransitLegStep {
  instruction: string;
  mode: string;
  detail: string;
  durationMin: number;
  distanceKm: number;
  agency?: string;
  lineName?: string;
  vehicleType?: string;
  departureStop?: string;
  arrivalStop?: string;
  stopCount?: number;
}

export interface GoogleTransitRouteOption {
  journeyId: string;
  title: string;
  mode: "TRAIN" | "METRO" | "BUS";
  operator: string;
  durationMinutes: number;
  distanceKm: number;
  steps: GoogleTransitLegStep[];
  fareInr?: number;
  fareCurrency?: string;
  departureTime?: string;
  arrivalTime?: string;
  polyline: string;
  decodedCoordinates: [number, number][];
}

/**
 * 4. Google Routes API (New) for Road Travel (DRIVE mode with live traffic)
 */
export async function googleComputeRoadRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<GoogleRouteResult | null> {
  const apiKey = getGoogleMapsServerKey();
  if (!apiKey) return null;

  // Attempt 1: Routes API (New) - POST https://routes.googleapis.com/directions/v2:computeRoutes
  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.staticDuration,routes.travelAdvisory,routes.polyline.encodedPolyline"
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: false,
        languageCode: "en-IN",
        units: "METRIC"
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.routes) && data.routes.length > 0) {
        const route = data.routes[0];
        const distMeters = route.distanceMeters || 0;
        const durSeconds = parseInt((route.duration || "0s").replace("s", ""), 10) || 0;
        const staticDurSeconds = route.staticDuration
          ? parseInt(route.staticDuration.replace("s", ""), 10)
          : durSeconds;
        const polyline = route.polyline?.encodedPolyline || "";

        const durationMinutes = Math.max(1, Math.round(durSeconds / 60));
        const staticDurationMinutes = Math.max(1, Math.round(staticDurSeconds / 60));
        const delayMinutes = Math.max(0, durationMinutes - staticDurationMinutes);
        const isTrafficAware = Boolean(route.staticDuration && delayMinutes > 0);

        const trafficStatus = isTrafficAware
          ? `Live Google Traffic: +${delayMinutes} min congestion delay`
          : "Normal Traffic Flow";

        return {
          distanceKm: Math.round((distMeters / 1000) * 10) / 10,
          durationMinutes,
          staticDurationMinutes,
          isTrafficAware,
          delayMinutes,
          polyline,
          decodedCoordinates: decodePolyline(polyline),
          trafficStatus,
          source: "Google Routes API (New)"
        };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      const classified = classifyGoogleError(res.status, errData);
      console.warn(sanitizeLogMessage(`Routes API (New) DRIVE error: ${classified.message}`));
    }
  } catch (err: any) {
    console.warn(sanitizeLogMessage(`Routes API (New) DRIVE failed: ${err?.message || err}`));
  }

  // Attempt 2: Classic Directions API with departure_time=now for live traffic
  try {
    const endpoint = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&departure_time=now&traffic_model=best_guess&region=in&key=${apiKey}`;

    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && Array.isArray(data.routes) && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs?.[0];
        const distKm = (leg?.distance?.value || 0) / 1000;
        const normalDurMins = Math.max(1, Math.round((leg?.duration?.value || 0) / 60));
        const trafficDurMins = leg?.duration_in_traffic
          ? Math.max(1, Math.round(leg.duration_in_traffic.value / 60))
          : normalDurMins;

        const isTrafficAware = Boolean(leg?.duration_in_traffic);
        const delayMinutes = Math.max(0, trafficDurMins - normalDurMins);
        const trafficStatus = isTrafficAware && delayMinutes > 0
          ? `Live Google Traffic: +${delayMinutes} min delay`
          : "Standard Driving Conditions";

        const polyline = route.overview_polyline?.points || "";

        return {
          distanceKm: Math.round(distKm * 10) / 10,
          durationMinutes: trafficDurMins,
          staticDurationMinutes: normalDurMins,
          isTrafficAware,
          delayMinutes,
          polyline,
          decodedCoordinates: decodePolyline(polyline),
          trafficStatus,
          source: "Google Directions API"
        };
      }
    }
  } catch (err: any) {
    console.warn(sanitizeLogMessage(`Classic Directions API DRIVE request failed: ${err?.message || err}`));
  }

  return null;
}

/**
 * 5. Google Public Transit Routes (Routes API (New) / Directions API with Transit Mode & Fares)
 */
export async function googleComputeTransitRoutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<GoogleTransitRouteOption[]> {
  const apiKey = getGoogleMapsServerKey();
  if (!apiKey) return [];

  const results: GoogleTransitRouteOption[] = [];

  // Attempt 1: Routes API (New) for TRANSIT
  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.legs.steps,routes.travelAdvisory.transitFare,routes.polyline.encodedPolyline"
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: "TRANSIT",
        computeAlternativeRoutes: true,
        languageCode: "en-IN",
        units: "METRIC"
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.routes) && data.routes.length > 0) {
        for (let idx = 0; idx < data.routes.length; idx++) {
          const route = data.routes[idx];
          const distKm = Math.round(((route.distanceMeters || 0) / 1000) * 10) / 10;
          const durSeconds = parseInt((route.duration || "0s").replace("s", ""), 10) || 0;
          const durMinutes = Math.max(1, Math.round(durSeconds / 60));
          const polyline = route.polyline?.encodedPolyline || "";

          let dominantMode: "TRAIN" | "METRO" | "BUS" = "BUS";
          let agencyName = "City Transit";
          let title = "Public Transit Corridor";
          const steps: GoogleTransitLegStep[] = [];

          let fareInr: number | undefined;
          if (route.travelAdvisory?.transitFare?.units) {
            fareInr = parseInt(route.travelAdvisory.transitFare.units, 10);
          }

          if (route.legs && route.legs[0]?.steps) {
            for (const step of route.legs[0].steps) {
              const stepDistKm = Math.round(((step.distanceMeters || 0) / 1000) * 10) / 10;
              const stepDurMins = Math.max(
                1,
                Math.round((parseInt((step.staticDuration || step.duration || "0s").replace("s", ""), 10) || 0) / 60)
              );

              if (step.transitDetails) {
                const td = step.transitDetails;
                const vType = (td.transitLine?.vehicle?.type || "").toUpperCase();
                agencyName = td.transitLine?.agencies?.[0]?.name || agencyName;
                const lineName = td.transitLine?.name || td.transitLine?.nameShort || "Transit Line";

                if (vType.includes("SUBWAY") || vType.includes("METRO")) {
                  dominantMode = "METRO";
                } else if (vType.includes("RAIL") || vType.includes("TRAIN")) {
                  dominantMode = "TRAIN";
                } else {
                  dominantMode = "BUS";
                }

                title = `${dominantMode === "METRO" ? "Metro Rail" : dominantMode === "TRAIN" ? "Suburban / Local Train" : "Public Bus"} (${lineName})`;

                steps.push({
                  instruction: `Board ${lineName} at ${td.stopDetails?.departureStop?.name || "Station"}`,
                  mode: dominantMode,
                  detail: `${td.stopCount || 1} stops to ${td.stopDetails?.arrivalStop?.name || "Destination"} • ${agencyName}`,
                  durationMin: stepDurMins,
                  distanceKm: stepDistKm,
                  agency: agencyName,
                  lineName,
                  departureStop: td.stopDetails?.departureStop?.name,
                  arrivalStop: td.stopDetails?.arrivalStop?.name,
                  stopCount: td.stopCount
                });
              } else {
                steps.push({
                  instruction: step.navigationInstruction?.instructions || "Walk to connecting point",
                  mode: "WALK",
                  detail: `Pedestrian connection • ${stepDistKm} km`,
                  durationMin: stepDurMins,
                  distanceKm: stepDistKm
                });
              }
            }
          }

          results.push({
            journeyId: `GTRANSIT-${idx + 1}-${Date.now()}`,
            title,
            mode: dominantMode,
            operator: agencyName,
            durationMinutes: durMinutes,
            distanceKm: distKm,
            steps,
            fareInr,
            fareCurrency: route.travelAdvisory?.transitFare?.currencyCode || "INR",
            polyline,
            decodedCoordinates: decodePolyline(polyline)
          });
        }

        if (results.length > 0) return results;
      }
    }
  } catch (err: any) {
    console.warn(sanitizeLogMessage(`Routes API (New) TRANSIT failed: ${err?.message || err}`));
  }

  // Attempt 2: Classic Directions API with mode=transit
  try {
    const endpoint = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=transit&region=in&key=${apiKey}`;

    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && Array.isArray(data.routes)) {
        for (let idx = 0; idx < data.routes.length; idx++) {
          const route = data.routes[idx];
          const leg = route.legs?.[0];
          const distKm = Math.round(((leg?.distance?.value || 0) / 1000) * 10) / 10;
          const durMins = Math.max(1, Math.round((leg?.duration?.value || 0) / 60));
          const polyline = route.overview_polyline?.points || "";

          let dominantMode: "TRAIN" | "METRO" | "BUS" = "BUS";
          let agencyName = "City Transit Authority";
          let title = "Public Transit Corridor";
          const steps: GoogleTransitLegStep[] = [];

          let fareInr: number | undefined;
          if (route.fare?.value) {
            fareInr = Math.round(route.fare.value);
          }

          if (leg?.steps) {
            for (const step of leg.steps) {
              const stepDistKm = Math.round(((step.distance?.value || 0) / 1000) * 10) / 10;
              const stepDurMins = Math.max(1, Math.round((step.duration?.value || 0) / 60));

              if (step.transit_details) {
                const td = step.transit_details;
                const vType = (td.line?.vehicle?.type || "").toUpperCase();
                agencyName = td.line?.agencies?.[0]?.name || agencyName;
                const lineName = td.line?.name || td.line?.short_name || "Transit Line";

                if (vType.includes("SUBWAY") || vType.includes("METRO")) {
                  dominantMode = "METRO";
                } else if (vType.includes("RAIL") || vType.includes("TRAIN") || vType.includes("HEAVY_RAIL")) {
                  dominantMode = "TRAIN";
                } else {
                  dominantMode = "BUS";
                }

                title = `${dominantMode === "METRO" ? "Metro Rail" : dominantMode === "TRAIN" ? "Local Train" : "City Bus"} (${lineName})`;

                steps.push({
                  instruction: `Board ${lineName} at ${td.departure_stop?.name || "Station"}`,
                  mode: dominantMode,
                  detail: `${td.num_stops || 1} stops to ${td.arrival_stop?.name || "Destination"} • ${agencyName}`,
                  durationMin: stepDurMins,
                  distanceKm: stepDistKm,
                  agency: agencyName,
                  lineName,
                  departureStop: td.departure_stop?.name,
                  arrivalStop: td.arrival_stop?.name,
                  stopCount: td.num_stops
                });
              } else {
                steps.push({
                  instruction: step.html_instructions?.replace(/<[^>]*>/g, "") || "Walk to connection",
                  mode: "WALK",
                  detail: `Walking connection • ${stepDistKm} km`,
                  durationMin: stepDurMins,
                  distanceKm: stepDistKm
                });
              }
            }
          }

          results.push({
            journeyId: `GTRANSIT-CLASSIC-${idx + 1}-${Date.now()}`,
            title,
            mode: dominantMode,
            operator: agencyName,
            durationMinutes: durMins,
            distanceKm: distKm,
            steps,
            fareInr,
            fareCurrency: route.fare?.currency || "INR",
            polyline,
            decodedCoordinates: decodePolyline(polyline)
          });
        }
      }
    }
  } catch (err: any) {
    console.warn(sanitizeLogMessage(`Classic Directions API TRANSIT request failed: ${err?.message || err}`));
  }

  return results;
}

/**
 * Performs a health verification of Google Maps Platform connectivity.
 */
export async function verifyGoogleMapsHealth(): Promise<GoogleApiStatusInfo> {
  const apiKey = getGoogleMapsServerKey();
  if (!apiKey) {
    return {
      isConfigured: false,
      status: "KEY_MISSING",
      message: "GOOGLE_MAPS_SERVER_API_KEY is not configured in environment variables or .env.local"
    };
  }

  const { statusInfo } = await googlePlacesAutocomplete("Delhi");
  if (statusInfo) {
    return statusInfo;
  }

  return {
    isConfigured: true,
    status: "OK",
    message: "Google Maps Platform is connected and operating normally."
  };
}
