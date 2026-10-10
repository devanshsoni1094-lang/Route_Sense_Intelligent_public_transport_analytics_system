import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date().toISOString();
  return NextResponse.json([
    {
      id: "IMP-SEED-2026",
      source_name: "BMTC Official GTFS Schedule Archive & Synthetic Telemetry Seed",
      source_type: "GTFS_SCHEDULE",
      records_processed: 2450,
      records_accepted: 2450,
      records_rejected: 0,
      validation_errors: [],
      status: "COMPLETED",
      timestamp: now
    }
  ]);
}
