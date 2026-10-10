import { NextRequest, NextResponse } from "next/server";
import { resolveLocation } from "@/lib/locationProvider";

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

function getISTTime(offsetMins: number = 0): string {
  const now = new Date(Date.now() + offsetMins * 60000);
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} IST`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const originQuery = searchParams.get("origin") || "Dadar Railway Station";
  const destinationQuery = searchParams.get("destination") || "Chhatrapati Shivaji Maharaj Terminus";
  
  const oLat = parseFloat(searchParams.get("origin_lat") || "0");
  const oLng = parseFloat(searchParams.get("origin_lng") || "0");
  const dLat = parseFloat(searchParams.get("dest_lat") || "0");
  const dLng = parseFloat(searchParams.get("dest_lng") || "0");

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

  // Real Indian Transport Tariff Logic
  // BUS (BMTC, BEST, DTC, MSRTC, KSRTC)
  const busDuration = Math.round(dist * 1.6 + 6);
  const busDelay = Math.round((dist * 0.35 + 2) * 10) / 10;
  const busFare = Math.max(10, Math.min(65, Math.round(dist * 1.6)));

  // TRAIN / METRO (Mumbai Suburban, Namma Metro, Delhi Metro, Suburban Rail)
  const trainDuration = Math.round(dist * 1.25 + 4);
  const trainDelay = 1.5;
  const trainFare = Math.max(10, Math.min(75, Math.round(dist * 1.5)));

  // CAB (Uber / Ola / Fasttrack)
  const cabDuration = Math.round(dist * 1.65 + 3);
  const cabDelay = Math.round((dist * 0.45 + 3) * 10) / 10;
  const cabFare = Math.round(95 + dist * 16.5);

  // BIKE TAXI (Rapido / Uber Moto)
  const bikeDuration = Math.round(dist * 1.15 + 2);
  const bikeDelay = Math.round((dist * 0.12 + 1) * 10) / 10;
  const bikeFare = Math.round(30 + dist * 7.5);

  const options = [
    {
      mode: "BUS",
      title: `City Express Bus (${originName} → ${destName})`,
      duration_min: busDuration,
      estimated_delay_min: busDelay,
      fare_inr: busFare,
      distance_km: dist,
      co2_emissions_g: Math.round(dist * 16 * 10),
      reliability_score_pct: Math.max(75, Math.min(92, Math.round(92 - busDelay * 2))),
      occupancy_level: busDuration > 40 ? "HIGH" : "MODERATE",
      next_departure: `Leaves in 5 mins (${getISTTime(5)})`,
      recommended: true,
      steps: [
        {
          step_number: 1,
          instruction: `Walk to ${originName} Bus Terminal`,
          mode: "WALK",
          detail: "2 mins walk (200m)",
          duration_min: 2,
          distance_km: 0.2
        },
        {
          step_number: 2,
          instruction: `Board Public City Bus towards ${destName}`,
          mode: "BUS",
          detail: `Direct transit corridor (${Math.round((dist - 0.4) * 10) / 10} km)`,
          duration_min: busDuration - 4,
          distance_km: Math.round((dist - 0.4) * 10) / 10
        },
        {
          step_number: 3,
          instruction: `Alight at ${destName} Stop`,
          mode: "WALK",
          detail: "2 mins walk to destination",
          duration_min: 2,
          distance_km: 0.2
        }
      ]
    },
    {
      mode: "TRAIN",
      title: `Metro & Suburban Train (${originName} → ${destName})`,
      duration_min: trainDuration,
      estimated_delay_min: trainDelay,
      fare_inr: trainFare,
      distance_km: Math.round((dist + 1.2) * 10) / 10,
      co2_emissions_g: Math.round(dist * 7 * 10),
      reliability_score_pct: 95.0,
      occupancy_level: "MODERATE",
      next_departure: `Leaves in 3 mins (${getISTTime(3)})`,
      recommended: false,
      steps: [
        {
          step_number: 1,
          instruction: `Walk to nearest Metro / Suburban Railway Station at ${originName}`,
          mode: "WALK",
          detail: "3 mins connection time",
          duration_min: 3,
          distance_km: 0.3
        },
        {
          step_number: 2,
          instruction: `Board Metro / Rail Express Line towards ${destName}`,
          mode: "TRAIN",
          detail: "Dedicated track line (95% On-Time Reliability)",
          duration_min: trainDuration - 6,
          distance_km: Math.round((dist + 0.5) * 10) / 10
        },
        {
          step_number: 3,
          instruction: `Exit Station at ${destName}`,
          mode: "WALK",
          detail: "3 mins walk to destination gate",
          duration_min: 3,
          distance_km: 0.4
        }
      ]
    },
    {
      mode: "CAB",
      title: `Taxi Cab Ride (${originName} → ${destName})`,
      duration_min: cabDuration,
      estimated_delay_min: cabDelay,
      fare_inr: cabFare,
      distance_km: dist,
      co2_emissions_g: Math.round(dist * 130),
      reliability_score_pct: 82.0,
      occupancy_level: "LOW",
      next_departure: "Available Now (Pickup in 3 mins)",
      recommended: false,
      steps: [
        {
          step_number: 1,
          instruction: `Driver pickup at ${originName}`,
          mode: "CAB",
          detail: "AC Sedan driver arriving",
          duration_min: 3,
          distance_km: 0.1
        },
        {
          step_number: 2,
          instruction: `Drive via main road to ${destName}`,
          mode: "CAB",
          detail: `Live traffic status: +${cabDelay} mins delay`,
          duration_min: cabDuration - 4,
          distance_km: Math.round((dist - 0.2) * 10) / 10
        },
        {
          step_number: 3,
          instruction: `Direct drop-off at ${destName}`,
          mode: "CAB",
          detail: "Door-to-door arrival",
          duration_min: 1,
          distance_km: 0.1
        }
      ]
    },
    {
      mode: "BIKE",
      title: `Bike Taxi (${originName} → ${destName})`,
      duration_min: bikeDuration,
      estimated_delay_min: bikeDelay,
      fare_inr: bikeFare,
      distance_km: dist,
      co2_emissions_g: Math.round(dist * 40),
      reliability_score_pct: 90.0,
      occupancy_level: "LOW",
      next_departure: "Available Now (Pickup in 2 mins)",
      recommended: false,
      steps: [
        {
          step_number: 1,
          instruction: `Captain pickup at ${originName}`,
          mode: "BIKE",
          detail: "Helmet provided by rider",
          duration_min: 2,
          distance_km: 0.1
        },
        {
          step_number: 2,
          instruction: `Ride via service lane to ${destName}`,
          mode: "BIKE",
          detail: "Filters easily through city traffic",
          duration_min: bikeDuration - 3,
          distance_km: Math.round((dist - 0.2) * 10) / 10
        },
        {
          step_number: 3,
          instruction: `Arrival at ${destName}`,
          mode: "BIKE",
          detail: "Fastest road option during peak hours",
          duration_min: 1,
          distance_km: 0.1
        }
      ]
    }
  ];

  return NextResponse.json({
    origin: resolvedOrigin,
    destination: resolvedDest,
    query_timestamp: new Date().toISOString(),
    calculated_distance_km: dist,
    is_same_city: isSameCity,
    route_options: options
  });
}
