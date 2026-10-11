import { NextRequest, NextResponse } from "next/server";
import { resolveLocation } from "@/lib/locationProvider";
import { generateNormalizedJourneyOptions, NormalizedJourneyOption } from "@/lib/pricing/engine";
import {
  getGoogleMapsApiKey,
  googleComputeRoadRoute,
  googleComputeTransitRoutes,
  GoogleTransitRouteOption
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
  
  // Road circuity factor for Indian city grids (~1.3x straight line)
  const roadDistance = straightDistance * 1.3;
  return Math.round(roadDistance * 10) / 10;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const originQuery = searchParams.get("origin") || "Dadar Railway Station";
  const destinationQuery = searchParams.get("destination") || "Chhatrapati Shivaji Maharaj Terminus";
  
  const oLat = parseFloat(searchParams.get("origin_lat") || "0");
  const oLng = parseFloat(searchParams.get("origin_lng") || "0");
  const dLat = parseFloat(searchParams.get("dest_lat") || "0");
  const dLng = parseFloat(searchParams.get("dest_lng") || "0");

  const passengers = Math.max(1, parseInt(searchParams.get("passengers") || "1", 10));
  const fuelPricePerLitre = parseFloat(searchParams.get("fuel_price") || "104.21");
  const carEfficiencyKpl = parseFloat(searchParams.get("car_eff") || "15.0");
  const bikeEfficiencyKpl = parseFloat(searchParams.get("bike_eff") || "45.0");
  const sortBy = searchParams.get("sort_by") || "BALANCED"; // CHEAPEST, FASTEST, BALANCED, LEAST_WALKING

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

  // Calculate base distance
  let dist = calculateHaversineDistanceKm(
    resolvedOrigin.latitude,
    resolvedOrigin.longitude,
    resolvedDest.latitude,
    resolvedDest.longitude
  );
  if (dist < 0.5) dist = 2.5;

  const isSameCity = resolvedOrigin.city.toLowerCase() === resolvedDest.city.toLowerCase();
  const originName = resolvedOrigin.displayName;
  const destName = resolvedDest.displayName;

  const apiKey = getGoogleMapsApiKey();

  let googleRoadDistKm = dist;
  let googleRoadDurationMin: number | null = null;
  let roadPolyline: string = "";
  let roadCoordinates: [number, number][] = [];
  let trafficStatus = "Standard Travel Speed";
  let googleTransitResults: GoogleTransitRouteOption[] = [];

  // If Google Maps API key is configured, compute live Routes API responses
  if (apiKey && resolvedOrigin.latitude !== 0 && resolvedDest.latitude !== 0) {
    try {
      // 1. Google Routes API (DRIVE mode with live traffic)
      const roadResult = await googleComputeRoadRoute(
        { lat: resolvedOrigin.latitude, lng: resolvedOrigin.longitude },
        { lat: resolvedDest.latitude, lng: resolvedDest.longitude }
      );

      if (roadResult && roadResult.distanceKm > 0) {
        googleRoadDistKm = roadResult.distanceKm;
        googleRoadDurationMin = roadResult.durationMinutes;
        roadPolyline = roadResult.polyline;
        roadCoordinates = roadResult.decodedCoordinates;
        trafficStatus = roadResult.trafficStatus;
      }
    } catch (err) {
      console.warn("Live Google road route computation failed", err);
    }

    try {
      // 2. Google Routes API (Public Transit mode)
      googleTransitResults = await googleComputeTransitRoutes(
        { lat: resolvedOrigin.latitude, lng: resolvedOrigin.longitude },
        { lat: resolvedDest.latitude, lng: resolvedDest.longitude }
      );
    } catch (err) {
      console.warn("Live Google transit route computation failed", err);
    }
  }

  // Base options from pricing engine using calibrated road distance & duration
  const baseOptions = generateNormalizedJourneyOptions({
    originName,
    destName,
    originCity: resolvedOrigin.city,
    destCity: resolvedDest.city,
    distanceKm: googleRoadDistKm,
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

      // If Google returned fare, use it with API_TRANSIT_FARE badge
      // Otherwise evaluate official tariff for that mode and distance slab
      let fareInr = gTrans.fareInr;
      let priceType = "API_TRANSIT_FARE";

      if (fareInr === undefined || fareInr === null || fareInr <= 0) {
        if (isTrain) {
          fareInr = Math.max(5, Math.min(25, Math.round(5 + (gTrans.distanceKm / 10) * 3)));
          priceType = "OFFICIAL_TARIFF";
        } else if (isMetro) {
          fareInr = Math.max(10, Math.min(60, Math.round(10 + gTrans.distanceKm * 2.2)));
          priceType = "OFFICIAL_TARIFF";
        } else {
          fareInr = Math.max(5, Math.min(45, Math.round(5 + gTrans.distanceKm * 1.5)));
          priceType = "OFFICIAL_TARIFF";
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
        fare_inr: fareInr * passengers,
        quoted_price_inr: fareInr * passengers,
        price_low_inr: fareInr * passengers,
        price_high_inr: fareInr * passengers,
        price_per_passenger_inr: fareInr,
        distance_km: gTrans.distanceKm,
        route_distance_km: gTrans.distanceKm,
        co2_emissions_g: Math.round(gTrans.distanceKm * (isTrain ? 15 : isMetro ? 20 : 35)),
        reliability_score_pct: 95.0,
        occupancy_level: "MODERATE",
        next_departure: "Live Schedule",
        departure_at: new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }),
        arrival_at: new Date(Date.now() + gTrans.durationMinutes * 60000).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }),
        recommended: true,
        price_type: priceType,
        freshness_status: "LIVE",
        source_name: "Google Routes API (Public Transit)",
        observed_at: new Date().toISOString(),
        assumptions: [
          `Live public transit route from Google Routes API`,
          `Operator: ${gTrans.operator}`,
          fareInr ? `Fare: ₹${fareInr}/passenger` : "Tariff based on published distance slabs"
        ],
        fare_breakdown: {
          base_fare_inr: fareInr * passengers,
          distance_fare_inr: 0,
          time_or_surge_fare_inr: 0,
          tolls_inr: 0,
          fuel_or_energy_cost_inr: 0,
          total_fare_inr: fareInr * passengers,
          currency: "INR"
        },
        coordinates: gTrans.decodedCoordinates.length > 0 ? gTrans.decodedCoordinates : undefined,
        polyline: gTrans.polyline,
        is_live_google_route: true,
        transit_fare_currency: gTrans.fareCurrency,
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
        durationFactor = 0.85; // Two-wheelers navigate urban traffic faster
      } else if (opt.transport_mode === "AUTO") {
        durationFactor = 1.1; // Auto-rickshaws have speed governors (40 km/h)
      }

      const trafficAwareDur = Math.max(2, Math.round(googleRoadDurationMin * durationFactor));
      opt.total_duration_minutes = trafficAwareDur;
      opt.traffic_status = trafficStatus;
    }

    // Map to MultiModalOption legacy format
    const legacyOpt: MultiModalOption = {
      ...opt,
      mode:
        opt.transport_mode === "CAR_PERSONAL"
          ? "CAB"
          : opt.transport_mode === "MOTORCYCLE_PERSONAL"
          ? "BIKE"
          : (opt.transport_mode as any),
      duration_min: opt.total_duration_minutes,
      estimated_delay_min: 1.5,
      fare_inr: opt.quoted_price_inr,
      distance_km: opt.route_distance_km,
      next_departure: `Leaves at ${opt.departure_at}`,
      coordinates: isRoadMode && roadCoordinates.length > 0 ? roadCoordinates : undefined,
      polyline: isRoadMode && roadPolyline ? roadPolyline : undefined,
      is_live_google_route: Boolean(isRoadMode && roadCoordinates.length > 0)
    };

    allJourneyOptions.push(legacyOpt);
  }

  // Apply sorting preferences
  if (sortBy === "CHEAPEST") {
    allJourneyOptions.sort((a, b) => a.fare_inr - b.fare_inr);
  } else if (sortBy === "FASTEST") {
    allJourneyOptions.sort((a, b) => a.duration_min - b.duration_min);
  } else if (sortBy === "LEAST_WALKING") {
    allJourneyOptions.sort((a, b) => (a.steps.length) - (b.steps.length));
  }

  return NextResponse.json({
    origin: resolvedOrigin,
    destination: resolvedDest,
    query_timestamp: new Date().toISOString(),
    timezone: "Asia/Kolkata",
    calculated_distance_km: googleRoadDistKm,
    is_same_city: isSameCity,
    passengers: passengers,
    pricing_model_version: "2026.2.0-IN",
    google_maps_integrated: Boolean(apiKey),
    traffic_status: trafficStatus,
    road_polyline: roadPolyline || undefined,
    route_options: allJourneyOptions
  });
}
