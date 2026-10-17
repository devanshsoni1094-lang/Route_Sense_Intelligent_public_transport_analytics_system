import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "RETIRED",
    message: "Live vehicle GPS position tracking has been removed in compliance with data privacy & public transit ticketing policies. Route planning, scheduled public transit corridors, and ticket verification remain active.",
    active_corridors_count: 5,
    timestamp: new Date().toISOString()
  });
}
