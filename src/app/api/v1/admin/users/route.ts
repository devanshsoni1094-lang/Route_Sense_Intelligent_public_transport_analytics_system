import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    { id: 1, username: "admin", full_name: "Director of Transport Operations", email: "admin@bmtc.gov.in", role: "Administrator", agency_id: "BMTC_BLR", is_active: true },
    { id: 2, username: "manager", full_name: "Central Depot Manager", email: "ops@bmtc.gov.in", role: "Transport Operations Manager", agency_id: "BMTC_BLR", is_active: true },
    { id: 3, username: "analyst", full_name: "Senior Mobility Analyst", email: "analyst@bmtc.gov.in", role: "Analyst", agency_id: "BMTC_BLR", is_active: true },
    { id: 4, username: "viewer", full_name: "Urban Mobility Commissioner", email: "executive@karnataka.gov.in", role: "Executive Viewer", agency_id: "BMTC_BLR", is_active: true }
  ]);
}
