import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get("origin") || "Central Silk Board TTMC";
  const destination = searchParams.get("destination") || "Hebbal Bus Station";

  const options = [
    {
      mode: "BUS",
      title: "BMTC Bus Express Line (Route 500-A)",
      duration_min: 48,
      estimated_delay_min: 14.2,
      fare_inr: 35,
      distance_km: 28.5,
      co2_emissions_g: 450,
      reliability_score_pct: 78.4,
      occupancy_level: "HIGH",
      next_departure: "In 6 mins (08:35 IST)",
      recommended: true,
      steps: [
        { step_number: 1, instruction: "Walk to Central Silk Board TTMC Bus Platform 3", mode: "WALK", detail: "200m • 3 mins", duration_min: 3, distance_km: 0.2 },
        { step_number: 2, instruction: "Board BMTC Bus 500-A (Outer Ring Road Express)", mode: "BUS", detail: "Passes through HSR Layout, Bellandur, Marathahalli, KR Puram", duration_min: 42, distance_km: 27.8 },
        { step_number: 3, instruction: "Alight at Hebbal Bus Stop & Walk to Destination", mode: "WALK", detail: "500m • 3 mins", duration_min: 3, distance_km: 0.5 }
      ]
    },
    {
      mode: "TRAIN",
      title: "Namma Metro Line + Suburban Railway Shuttle",
      duration_min: 42,
      estimated_delay_min: 2.0,
      fare_inr: 45,
      distance_km: 31.0,
      co2_emissions_g: 220,
      reliability_score_pct: 94.5,
      occupancy_level: "MODERATE",
      next_departure: "In 4 mins (08:33 IST)",
      recommended: false,
      steps: [
        { step_number: 1, instruction: "Board Namma Metro Yellow Line at Silk Board Station", mode: "TRAIN", detail: "Towards RV Road Interchange Station", duration_min: 12, distance_km: 8.5 },
        { step_number: 2, instruction: "Switch to Green Line Metro towards Nagasandra", mode: "TRAIN", detail: "Get off at Majestic Interchange Station", duration_min: 16, distance_km: 11.2 },
        { step_number: 3, instruction: "Take Suburban Train Shuttle to Hebbal Railway Station", mode: "TRAIN", detail: "Direct Rail Corridor", duration_min: 14, distance_km: 11.3 }
      ]
    },
    {
      mode: "CAB",
      title: "City Taxi / Cab Ride (Uber / Ola / Rapido)",
      duration_min: 52,
      estimated_delay_min: 18.0,
      fare_inr: 480,
      distance_km: 29.2,
      co2_emissions_g: 3800,
      reliability_score_pct: 82.0,
      occupancy_level: "LOW",
      next_departure: "Available Now (Pickup in 3 mins)",
      recommended: false,
      steps: [
        { step_number: 1, instruction: "Pickup at Silk Board Junction", mode: "CAB", detail: "Driver arriving in AC Sedan", duration_min: 3, distance_km: 0.1 },
        { step_number: 2, instruction: "Drive via Outer Ring Road & Bellandur EcoSpace Flyover", mode: "CAB", detail: "High peak hour traffic delay near Marathahalli", duration_min: 46, distance_km: 28.6 },
        { step_number: 3, instruction: "Drop-off at Hebbal Junction Destination", mode: "CAB", detail: "Direct door-to-door arrival", duration_min: 3, distance_km: 0.5 }
      ]
    },
    {
      mode: "BIKE",
      title: "Two-Wheeler / Bike Taxi (Rapido Bike / Personal Bike)",
      duration_min: 36,
      estimated_delay_min: 5.0,
      fare_inr: 160,
      distance_km: 28.0,
      co2_emissions_g: 1100,
      reliability_score_pct: 88.0,
      occupancy_level: "LOW",
      next_departure: "Available Now (Pickup in 2 mins)",
      recommended: false,
      steps: [
        { step_number: 1, instruction: "Rider pickup at Silk Board Flyover Ramp", mode: "BIKE", detail: "Helmet provided by captain", duration_min: 2, distance_km: 0.1 },
        { step_number: 2, instruction: "Navigate service lane traffic along Outer Ring Road", mode: "BIKE", detail: "Easily filters through Bellandur traffic congestion", duration_min: 32, distance_km: 27.4 },
        { step_number: 3, instruction: "Arrival at Hebbal Destination Gate", mode: "BIKE", detail: "Fastest road option during peak hours", duration_min: 2, distance_km: 0.5 }
      ]
    }
  ];

  return NextResponse.json({
    origin,
    destination,
    query_timestamp: new Date().toISOString(),
    route_options: options
  });
}
