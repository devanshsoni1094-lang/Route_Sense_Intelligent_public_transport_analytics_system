/**
 * Route Sense — Google Maps Platform Service
 * 
 * Supports:
 * 1. Places API (New & Classic): Autocomplete, Place Details, Place Search
 * 2. Geocoding API: Address geocoding and reverse geocoding
 * 3. Routes API (New & Classic Directions): Driving (traffic-aware) & Public Transit routing
 * 4. Transit Fare extraction (API-returned transit fares)
 * 5. Polyline decoding for spatial corridor display
 */

import { ResolvedLocation, PlaceCategory, RouteStep, MultiModalOption } from "@/types";

export function getGoogleMapsApiKey(): string {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ""
  );
}

// In-memory cache for Place Details to reduce duplicate API queries
const placeDetailsCache = new Map<string, { lat: number; lng: number; address: string; timestamp: number }>();

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
function mapGoogleTypesToCategory(types: string[]): PlaceCategory {
  if (!types || types.length === 0) return "address";
  const t = types.map((s) => s.toLowerCase());

  if (t.includes("train_station") || t.includes("transit_station")) {
    return "railway_station";
  }
  if (t.includes("subway_station") || t.includes("light_rail_station")) {
    return "metro_station";
  }
  if (t.includes("bus_station")) {
    return "bus_terminal";
  }
  if (t.includes("airport")) {
    return "airport";
  }
  if (t.includes("tourist_attraction") || t.includes("point_of_interest") || t.includes("landmark")) {
    return "landmark";
  }
  if (t.includes("locality") || t.includes("sublocality") || t.includes("administrative_area_level_2")) {
    return "locality";
  }
  return "address";
}

/**
 * 1. Google Places Autocomplete (Calls New Places API, with fallback to Classic)
 */
export async function googlePlacesAutocomplete(query: string): Promise<ResolvedLocation[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || !query || query.trim().length < 2) return [];

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
        languageCode: "en"
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        return data.suggestions
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
      }
    }
  } catch (err) {
    console.warn("Places API (New) autocomplete request failed, trying Classic Places API", err);
  }

  // Attempt 2: Places API (Classic) - GET https://maps.googleapis.com/maps/api/place/autocomplete/json
  try {
    const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&components=country:in&language=en&key=${apiKey}`;

    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && Array.isArray(data.predictions)) {
        return data.predictions.map((pred: any) => {
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
      }
    }
  } catch (err) {
    console.warn("Classic Places API request failed", err);
  }

  return [];
}

/**
 * 2. Resolve Place Details / Geocoding (Fetches real Lat/Lng and address context)
 */
export async function googleResolvePlaceDetails(
  placeId: string,
  displayNameHint?: string
): Promise<{ lat: number; lng: number; formattedAddress: string; city: string; state: string } | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || !placeId) return null;

  // Check cache
  const cached = placeDetailsCache.get(placeId);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return {
      lat: cached.lat,
      lng: cached.lng,
      formattedAddress: cached.address,
      city: "",
      state: ""
    };
  }

  // Attempt 1: Places API (New) Details
  try {
    const cleanId = placeId.startsWith("places/") ? placeId : `places/${placeId}`;
    const endpoint = `https://places.googleapis.com/v1/${cleanId}?fields=id,displayName,formattedAddress,location,addressComponents&key=${apiKey}`;

    const res = await fetch(endpoint, {
      headers: { "Accept-Language": "en-IN" }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.location?.latitude && data.location?.longitude) {
        const lat = data.location.latitude;
        const lng = data.location.longitude;
        const addr = data.formattedAddress || displayNameHint || "India";

        placeDetailsCache.set(placeId, { lat, lng, address: addr, timestamp: Date.now() });
        return { lat, lng, formattedAddress: addr, city: "", state: "" };
      }
    }
  } catch (err) {
    console.warn("Places API (New) details failed, trying Classic Details", err);
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

        placeDetailsCache.set(placeId, { lat, lng, address: addr, timestamp: Date.now() });
        return { lat, lng, formattedAddress: addr, city: "", state: "" };
      }
    }
  } catch (err) {
    console.warn("Classic Place Details failed, trying Geocoding API", err);
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

        placeDetailsCache.set(placeId, { lat, lng, address: addr, timestamp: Date.now() });
        return { lat, lng, formattedAddress: addr, city: "", state: "" };
      }
    }
  } catch (err) {
    console.warn("Geocoding by place_id failed", err);
  }

  return null;
}

/**
 * 3. Geocode query string (city, area, address or station name) via Geocoding API
 */
export async function googleGeocodeQuery(
  query: string
): Promise<{ lat: number; lng: number; formattedAddress: string; placeId: string } | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || !query) return null;

  try {
    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query
    )}&components=country:in&key=${apiKey}`;

    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const first = data.results[0];
        return {
          lat: first.geometry.location.lat,
          lng: first.geometry.location.lng,
          formattedAddress: first.formatted_address,
          placeId: first.place_id
        };
      }
    }
  } catch (err) {
    console.warn("Google Geocoding failed", err);
  }

  return null;
}

export interface GoogleRouteResult {
  distanceKm: number;
  durationMinutes: number;
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
 * 4. Google Routes API (New) for Road Travel (DRIVE mode with real-time traffic)
 */
export async function googleComputeRoadRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<GoogleRouteResult | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  // Attempt 1: Routes API (New) - POST https://routes.googleapis.com/directions/v2:computeRoutes
  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.travelAdvisory,routes.polyline.encodedPolyline"
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
        const polyline = route.polyline?.encodedPolyline || "";

        return {
          distanceKm: Math.round((distMeters / 1000) * 10) / 10,
          durationMinutes: Math.max(1, Math.round(durSeconds / 60)),
          polyline,
          decodedCoordinates: decodePolyline(polyline),
          trafficStatus: "Live Google Traffic Aware",
          source: "Google Routes API (New)"
        };
      }
    }
  } catch (err) {
    console.warn("Routes API (New) DRIVE request failed, falling back to Directions API", err);
  }

  // Attempt 2: Classic Directions API
  try {
    const endpoint = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&departure_time=now&traffic_model=best_guess&region=in&key=${apiKey}`;

    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && Array.isArray(data.routes) && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs?.[0];
        const distKm = (leg?.distance?.value || 0) / 1000;
        const durMins = (leg?.duration_in_traffic?.value || leg?.duration?.value || 0) / 60;
        const polyline = route.overview_polyline?.points || "";

        return {
          distanceKm: Math.round(distKm * 10) / 10,
          durationMinutes: Math.max(1, Math.round(durMins)),
          polyline,
          decodedCoordinates: decodePolyline(polyline),
          trafficStatus: leg?.duration_in_traffic ? "Live Google Traffic" : "Standard Driving Speed",
          source: "Google Directions API"
        };
      }
    }
  } catch (err) {
    console.warn("Classic Directions API DRIVE request failed", err);
  }

  return null;
}

/**
 * 5. Google Public Transit Routes (Routes API / Directions API with Transit Mode & Fares)
 */
export async function googleComputeTransitRoutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<GoogleTransitRouteOption[]> {
  const apiKey = getGoogleMapsApiKey();
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
          "routes.duration,routes.distanceMeters,routes.legs,routes.travelAdvisory.transitFare,routes.polyline.encodedPolyline"
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
              const stepDurMins = Math.max(1, Math.round((parseInt((step.duration || "0s").replace("s", ""), 10) || 0) / 60));

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
                  instruction: "Walk to connecting point",
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
  } catch (err) {
    console.warn("Routes API (New) TRANSIT failed, trying Classic Directions API", err);
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
  } catch (err) {
    console.warn("Classic Directions API TRANSIT request failed", err);
  }

  return results;
}
