import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    type: "FeatureCollection",
    routes: [
      {
        type: "Feature",
        properties: { id: "R-500A", name: "500-A", description: "Silk Board to Hebbal ORR Express", distance_km: 28.5 },
        geometry: { type: "LineString", coordinates: [[77.6228, 12.9172], [77.6385, 12.9255], [77.6954, 12.9366], [77.5970, 13.0358]] }
      }
    ],
    stops: [
      { type: "Feature", properties: { id: "STP-101", name: "Central Silk Board TTMC" }, geometry: { type: "Point", coordinates: [77.6228, 12.9172] } }
    ],
    vehicle_count: 4
  });
}
