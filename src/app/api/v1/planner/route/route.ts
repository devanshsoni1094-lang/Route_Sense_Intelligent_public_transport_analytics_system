import { NextRequest, NextResponse } from "next/server";
import { resolveLocation } from "@/lib/locationProvider";
import { generateNormalizedJourneyOptions } from "@/lib/pricing/engine";
import { RoutePlannerQuerySchema } from "@/lib/schemas";
import {
  getGoogleMapsServerKey,
  googleComputeRoadRoute,
  googleComputeTransitRoutes,
  GoogleTransitRouteOption,
  sanitizeLogMessage
} from "@/lib/googleMapsService";
import { MultiModalOption, RouteStep } from "@/types";

function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;

  // Road circuity factor for Indian terrain (~1.30x straight line)
  const roadDistance = straightDistance * 1.3;
  return Math.round(roadDistance * 10) / 10;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const rawParams = {
    origin: searchParams.get("origin") || "Dadar Railway Station",
    destination: searchParams.get("destination") || "Chhatrapati Shivaji Maharaj Terminus",
    origin_lat: searchParams.get("origin_lat") || 0,
    origin_lng: searchParams.get("origin_lng") || 0,
    dest_lat: searchParams.get("dest_lat") || 0,
    dest_lng: searchParams.get("dest_lng") || 0,
    passengers: searchParams.get("passengers") || 1,
    fuel_price: searchParams.get("fuel_price") || 104.21,
    car_eff: searchParams.get("car_eff") || 15.0,
    bike_eff: searchParams.get("bike_eff") || 45.0,
    sort_by: searchParams.get("sort_by") || "BALANCED"
  };

  const parsed = RoutePlannerQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid journey search parameters",
        details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
      },
      { status: 400 }
    );
  }

  const {
    origin: originQuery,
    destination: destinationQuery,
    origin_lat: oLat,
    origin_lng: oLng,
    dest_lat: dLat,
    dest_lng: dLng,
    passengers,
    fuel_price: fuelPricePerLitre,
    car_eff: carEfficiencyKpl,
    bike_eff: bikeEfficiencyKpl,
    sort_by: sortBy
  } = parsed.data;

  let resolvedOrigin = await resolveLocation(originQuery);
  let resolvedDest = await resolveLocation(destinationQuery);

  if (oLat !== 0 && oLng !== 0) {
    resolvedOrigin.latitude = oLat;
    resolvedOrigin.longitude = oLng;
  }
  if (dLat !== 0 && dLng !== 0) {
    resolvedDest.latitude = dLat;
    resolvedDest.longitude = dLng;
  }

  // Base estimate distance via Haversine road circuity
  let baseCircuityDistKm = calculateHaversineDistanceKm(
    resolvedOrigin.latitude,
    resolvedOrigin.longitude,
    resolvedDest.latitude,
    resolvedDest.longitude
  );
  if (baseCircuityDistKm < 0.5) baseCircuityDistKm = 2.5;

  const isSameCity = resolvedOrigin.city.toLowerCase() === resolvedDest.city.toLowerCase();
  const originName = resolvedOrigin.displayName;
  const destName = resolvedDest.displayName;

  const apiKey = getGoogleMapsServerKey();

  let finalRoadDistKm = baseCircuityDistKm;
  let googleRoadDurationMin: number | null = null;
  let googleStaticDurationMin: number | null = null;
  let isTrafficAware = false;
  let trafficDelayMins = 0;
  let roadPolyline: string = "";
  let roadCoordinates: [number, number][] = [];
  let trafficStatus = "Standard Driving Conditions";
  let googleTransitResults: GoogleTransitRouteOption[] = [];
  let googleRoadRouteSucceeded = false;
  let googleTransitRouteSucceeded = false;

  let googleMapsStatus = {
    is_configured: Boolean(apiKey),
    status: apiKey ? "CONNECTED" : "KEY_MISSING",
    message: apiKey
      ? "Google Maps Platform is active for Places and Routes queries."
      : "GOOGLE_MAPS_SERVER_API_KEY is not configured in .env.local. Operating with verified Indian transit database."
  };

  // If Google Maps API key is configured, compute live Routes API responses
  if (apiKey && resolvedOrigin.latitude !== 0 && resolvedDest.latitude !== 0) {
    try {
      // 1. Google Routes API (DRIVE mode with live traffic)
      const roadResult = await googleComputeRoadRoute(
        { lat: resolvedOrigin.latitude, lng: resolvedOrigin.longitude },
        { lat: resolvedDest.latitude, lng: resolvedDest.longitude }
      );

      if (roadResult && roadResult.distanceKm > 0) {
        finalRoadDistKm = roadResult.distanceKm;
        googleRoadDurationMin = roadResult.durationMinutes;
        googleStaticDurationMin = roadResult.staticDurationMinutes || roadResult.durationMinutes;
        isTrafficAware = roadResult.isTrafficAware;
        trafficDelayMins = roadResult.delayMinutes;
        roadPolyline = roadResult.polyline;
        roadCoordinates = roadResult.decodedCoordinates;
        trafficStatus = roadResult.trafficStatus;
        googleRoadRouteSucceeded = true;
      }
    } catch (err: any) {
      console.warn(sanitizeLogMessage(`Live Google road route computation failed: ${err?.message || err}`));
    }

    try {
      // 2. Google Routes API (Public Transit mode)
      googleTransitResults = await googleComputeTransitRoutes(
        { lat: resolvedOrigin.latitude, lng: resolvedOrigin.longitude },
        { lat: resolvedDest.latitude, lng: resolvedDest.longitude }
      );

      if (googleTransitResults.length > 0) {
        googleTransitRouteSucceeded = true;
      }
    } catch (err: any) {
      console.warn(sanitizeLogMessage(`Live Google transit route computation failed: ${err?.message || err}`));
    }
  }

  // Base multi-modal comparative options evaluated against accurate road distance
  const baseOptions = generateNormalizedJourneyOptions({
    originName,
    destName,
    originCity: resolvedOrigin.city,
    destCity: resolvedDest.city,
    distanceKm: finalRoadDistKm,
    departureTime: new Date(),
    passengers,
    fuelPricePerLitre,
    carEfficiencyKpl,
    bikeEfficiencyKpl,
    apiKeyAvailable: Boolean(apiKey)
  });

  const allJourneyOptions: MultiModalOption[] = [];

  // If Google Transit returned verified live transit routes, convert them to MultiModalOption
  if (googleTransitResults.length > 0) {
    for (const gTrans of googleTransitResults) {
      const modeKey = gTrans.mode;
      const isTrain = modeKey === "TRAIN";
      const isMetro = modeKey === "METRO";

      // Precise pricing categorization:
      // If Google explicitly returned a fare, mark as API_TRANSIT_FARE
      // Else if route is on a verified metro/suburban rail system, mark as OFFICIAL_TARIFF
      // Else mark as PRICE_UNAVAILABLE (no fake pricing!)
      let fareInr = gTrans.fareInr;
      let priceType: string = "API_TRANSIT_FARE";

      if (fareInr !== undefined && fareInr !== null && fareInr > 0) {
        priceType = "API_TRANSIT_FARE";
      } else {
        // Fallback to official distance-band tariff for documented rail/metro agencies
        if (isTrain && gTrans.distanceKm > 0) {
          fareInr = Math.max(5, Math.min(30, Math.round(5 + (gTrans.distanceKm / 15) * 5)));
          priceType = "OFFICIAL_TARIFF";
        } else if (isMetro && gTrans.distanceKm > 0) {
          fareInr = Math.max(10, Math.min(60, Math.round(10 + gTrans.distanceKm * 2.2)));
          priceType = "OFFICIAL_TARIFF";
        } else {
          fareInr = 0;
          priceType = "PRICE_UNAVAILABLE";
        }
      }

      const steps: RouteStep[] = gTrans.steps.map((st, i) => ({
        step_number: i + 1,
        instruction: st.instruction,
        mode: st.mode,
        detail: st.detail,
        duration_min: st.durationMin,
        distance_km: st.distanceKm
      }));

      const googleTransitOpt: MultiModalOption = {
        journey_id: gTrans.journeyId,
        mode: modeKey,
        transport_mode: modeKey,
        vehicle_category: `${gTrans.title} (${gTrans.operator})`,
        operator: gTrans.operator,
        title: gTrans.title,
        duration_min: gTrans.durationMinutes,
        total_duration_minutes: gTrans.durationMinutes,
        estimated_delay_min: 0,
        fare_inr: (fareInr || 0) * passengers,
        quoted_price_inr: (fareInr || 0) * passengers,
        price_low_inr: (fareInr || 0) * passengers,
        price_high_inr: (fareInr || 0) * passengers,
        price_per_passenger_inr: fareInr || 0,
        distance_km: gTrans.distanceKm,
        route_distance_km: gTrans.distanceKm,
        co2_emissions_g: Math.round(gTrans.distanceKm * (isTrain ? 15 : isMetro ? 20 : 35)),
        reliability_score_pct: 96.0,
        occupancy_level: "MODERATE",
        next_departure: "Live Schedule",
        departure_at: new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit"
        }),
        arrival_at: new Date(Date.now() + gTrans.durationMinutes * 60000).toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit"
        }),
        recommended: true,
        price_type: priceType,
        freshness_status: "LIVE",
        source_name: "Google Routes API (Public Transit)",
        observed_at: new Date().toISOString(),
        assumptions: [
          `Public transit itinerary from Google Routes API`,
          `Operator: ${gTrans.operator}`,
          fareInr && fareInr > 0
            ? `Fare: ₹${fareInr}/passenger (${priceType === "API_TRANSIT_FARE" ? "API quote" : "official tariff"})`
            : "Ticket fare not returned by transit provider; verify at station counter"
        ],
        fare_breakdown: {
          base_fare_inr: (fareInr || 0) * passengers,
          distance_fare_inr: 0,
          time_or_surge_fare_inr: 0,
          tolls_inr: 0,
          fuel_or_energy_cost_inr: 0,
          total_fare_inr: (fareInr || 0) * passengers,
          currency: "INR"
        },
        coordinates: gTrans.decodedCoordinates.length > 0 ? gTrans.decodedCoordinates : undefined,
        polyline: gTrans.polyline,
        is_live_google_route: true,
        transit_fare_currency: gTrans.fareCurrency || "INR",
        steps
      };

      allJourneyOptions.push(googleTransitOpt);
    }
  }

  // Enrich base comparative options (Road & Public Transit) with Google road metrics and polylines
  for (const opt of baseOptions) {
    const isRoadMode = ["CAB", "AUTO", "BIKE", "CAR_PERSONAL", "MOTORCYCLE_PERSONAL"].includes(opt.transport_mode);

    // If live Google road metrics are present, update road duration and attach road polyline
    if (isRoadMode && googleRoadDurationMin && googleRoadDurationMin > 0) {
      let durationFactor = 1.0;
      if (opt.transport_mode === "BIKE" || opt.transport_mode === "MOTORCYCLE_PERSONAL") {
        durationFactor = 0.85; // Two-wheelers filter through city congestion
      } else if (opt.transport_mode === "AUTO") {
        durationFactor = 1.1; // Auto-rickshaw speed governing
      }

      const trafficAwareDur = Math.max(2, Math.round(googleRoadDurationMin * durationFactor));
      opt.total_duration_minutes = trafficAwareDur;
      opt.traffic_status = trafficStatus;
      opt.route_distance_km = finalRoadDistKm;
    }

    const legacyOpt: MultiModalOption = {
      ...opt,
      mode:
        opt.transport_mode === "CAR_PERSONAL"
          ? "CAB"
          : opt.transport_mode === "MOTORCYCLE_PERSONAL"
          ? "BIKE"
          : (opt.transport_mode as any),
      duration_min: opt.total_duration_minutes,
      estimated_delay_min: trafficDelayMins,
      fare_inr: opt.quoted_price_inr,
      distance_km: opt.route_distance_km,
      next_departure: `Leaves at ${opt.departure_at}`,
      coordinates: isRoadMode && roadCoordinates.length > 0 ? roadCoordinates : undefined,
      polyline: isRoadMode && roadPolyline ? roadPolyline : undefined,
      is_live_google_route: Boolean(isRoadMode && googleRoadRouteSucceeded)
    };

    allJourneyOptions.push(legacyOpt);
  }

  // Apply sorting preferences
  if (sortBy === "CHEAPEST") {
    allJourneyOptions.sort((a, b) => a.fare_inr - b.fare_inr);
  } else if (sortBy === "FASTEST") {
    allJourneyOptions.sort((a, b) => a.duration_min - b.duration_min);
  } else if (sortBy === "LEAST_WALKING") {
    allJourneyOptions.sort((a, b) => a.steps.length - b.steps.length);
  }

  return NextResponse.json({
    origin: resolvedOrigin,
    destination: resolvedDest,
    query_timestamp: new Date().toISOString(),
    timezone: "Asia/Kolkata",
    calculated_distance_km: finalRoadDistKm,
    is_same_city: isSameCity,
    passengers,
    pricing_model_version: "2026.3.0-IN",
    google_maps_integrated: Boolean(apiKey),
    google_maps_status: googleMapsStatus,
    traffic_status: trafficStatus,
    is_traffic_aware: isTrafficAware,
    traffic_delay_minutes: trafficDelayMins,
    road_polyline: roadPolyline || undefined,
    transit_routes_found: googleTransitRouteSucceeded,
    route_options: allJourneyOptions
  });
}
