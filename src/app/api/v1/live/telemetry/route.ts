import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date().toISOString();
  return NextResponse.json([
    { vehicle_id: "KA-01-F-1001", vehicle_number: "KA-01-F-1001", route_id: "R-500A", route_name: "500-A", latitude: 12.9172, longitude: 77.6228, speed_kmh: 28.5, heading_deg: 45, delay_minutes: 14.2, status: "DELAYED", last_updated: now, is_simulated: true },
    { vehicle_id: "KA-01-F-1002", vehicle_number: "KA-01-F-1002", route_id: "R-335E", route_name: "335-E", latitude: 12.9778, longitude: 77.5713, speed_kmh: 34.0, heading_deg: 90, delay_minutes: 1.5, status: "ON_TIME", last_updated: now, is_simulated: true },
    { vehicle_id: "KA-01-F-1003", vehicle_number: "KA-01-F-1003", route_id: "R-201", route_name: "201", latitude: 12.9252, longitude: 77.5735, speed_kmh: 0.0, heading_deg: 0, delay_minutes: 0.5, status: "ON_TIME", last_updated: now, is_simulated: true },
    { vehicle_id: "KA-01-F-1004", vehicle_number: "KA-01-F-1004", route_id: "R-V500D", route_name: "V-500D", latitude: 13.0358, longitude: 77.5970, speed_kmh: 48.0, heading_deg: 180, delay_minutes: 2.1, status: "ON_TIME", last_updated: now, is_simulated: true },
  ]);
}
