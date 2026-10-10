import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date().toISOString();
  return NextResponse.json([
    {
      id: "ALT-2026-001",
      severity: "CRITICAL",
      alert_type: "DELAY_SPIKE",
      route_id: "R-500A",
      observed_value: "18.5 min delay",
      threshold_value: "5.0 min tolerance",
      evidence: { delay_spike_min: 18.5, congestion_corridor: "Bellandur EcoSpace Flyover" },
      suggested_action: "Deploy 2 standby feeder buses from Central Depot 25.",
      status: "NEW",
      timestamp: now
    },
    {
      id: "ALT-2026-002",
      severity: "HIGH",
      alert_type: "UNEXPECTED_GAP",
      route_id: "R-335E",
      observed_value: "28 min headway gap",
      threshold_value: "12 min scheduled headway",
      evidence: { missing_trips: 1, location: "Kundalahalli Gate" },
      suggested_action: "Adjust departure frequency at KBS Terminal.",
      status: "ACKNOWLEDGED",
      assigned_to: "manager",
      timestamp: now
    },
    {
      id: "ALT-2026-003",
      severity: "MEDIUM",
      alert_type: "STALE_FEED",
      route_id: "R-201",
      observed_value: "940 sec since ping",
      threshold_value: "300 sec stale limit",
      evidence: { last_ping: "15 mins ago" },
      suggested_action: "Check vehicle GPS unit power connection.",
      status: "RESOLVED",
      assigned_to: "analyst",
      timestamp: now
    }
  ]);
}
