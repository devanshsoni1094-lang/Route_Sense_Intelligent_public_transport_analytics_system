import { NextRequest, NextResponse } from "next/server";
import { resolveLocation } from "@/lib/locationProvider";
import { generateNormalizedJourneyOptions, NormalizedJourneyOption } from "@/lib/pricing/engine";

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
  
  // Road circuity factor for Indian city grids (typically ~1.25x - 1.35x straight line)
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

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  let options: NormalizedJourneyOption[] = generateNormalizedJourneyOptions({
    originName,
    destName,
    originCity: resolvedOrigin.city,
    destCity: resolvedDest.city,
    distanceKm: dist,
    departureTime: new Date(),
    passengers,
    fuelPricePerLitre,
    carEfficiencyKpl,
    bikeEfficiencyKpl,
    apiKeyAvailable: Boolean(apiKey)
  });

  // Apply sorting preferences if requested
  if (sortBy === "CHEAPEST") {
    options.sort((a, b) => a.quoted_price_inr - b.quoted_price_inr);
  } else if (sortBy === "FASTEST") {
    options.sort((a, b) => a.total_duration_minutes - b.total_duration_minutes);
  } else if (sortBy === "LEAST_WALKING") {
    options.sort((a, b) => a.walking_duration_minutes - b.walking_duration_minutes);
  }

  // Backwards compatibility mapping for legacy fields: mode, title, duration_min, fare_inr, distance_km
  const legacyOptions = options.map((opt) => ({
    ...opt,
    mode: opt.transport_mode === "CAR_PERSONAL" ? "CAB" : opt.transport_mode === "MOTORCYCLE_PERSONAL" ? "BIKE" : opt.transport_mode,
    duration_min: opt.total_duration_minutes,
    estimated_delay_min: 1.5,
    fare_inr: opt.quoted_price_inr,
    distance_km: opt.route_distance_km,
    next_departure: `Leaves at ${opt.departure_at}`
  }));

  return NextResponse.json({
    origin: resolvedOrigin,
    destination: resolvedDest,
    query_timestamp: new Date().toISOString(),
    timezone: "Asia/Kolkata",
    calculated_distance_km: dist,
    is_same_city: isSameCity,
    passengers: passengers,
    pricing_model_version: "2026.1.0-IN",
    google_maps_integrated: Boolean(apiKey),
    route_options: legacyOptions
  });
}
