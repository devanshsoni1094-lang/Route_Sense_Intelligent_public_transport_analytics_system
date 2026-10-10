import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    operating_mode: "DEMO DATA",
    agency_name: "Bengaluru Metropolitan Transport Corporation (BMTC)",
    scheduled_trips: 120,
    completed_trips: 115,
    completion_rate_pct: 95.8,
    on_time_performance_pct: 78.4,
    mean_delay_min: 4.2,
    passenger_boardings: 24850,
    fleet_utilization_pct: 91.4,
    active_disruptions_count: 2,
    data_freshness_seconds: 45,
    forecasted_demand_next_24h: 26800,
    insights: [
      {
        id: "INS-001",
        title: "Severe Delay Hotspot at Bellandur EcoSpace Flyover",
        description: "Observed severe delay spike averaging +14.2 min on Route 500-A between 08:30 and 10:15 AM.",
        route_id: "R-500A",
        stop_name: "Bellandur EcoSpace",
        time_window: "08:30 - 10:15 IST",
        suspected_cause: "Corridor traffic bottleneck merging Outer Ring Road express lanes into flyover construction zone.",
        supporting_records_count: 420,
        evidence_summary: "420 vehicle telemetry observations recorded speeds < 12 km/h over 3.2 km stretch."
      },
      {
        id: "INS-002",
        title: "Unscheduled Headway Gap on Majestic to ITPL Line",
        description: "Headway deviation reached 28 minutes at Kundalahalli Gate (scheduled 12 mins).",
        route_id: "R-335E",
        stop_name: "Kundalahalli Gate",
        time_window: "17:45 - 18:30 IST",
        suspected_cause: "Bunching of two preceding buses due to signal delays near HAL Airport Road.",
        supporting_records_count: 85,
        evidence_summary: "Two buses arrived within 90 seconds of each other after a 28-minute gap."
      }
    ],
    top_performing_routes: [
      { route_id: "R-V500D", route_short_name: "V-500D", route_long_name: "Vayu Vajra AC Airport Express", otp_pct: 94.2, mean_delay_min: 1.8, status_label: "NORMAL" },
      { route_id: "R-201", route_short_name: "201", route_long_name: "Majestic to Banashankari TTMC", otp_pct: 88.5, mean_delay_min: 2.4, status_label: "NORMAL" }
    ],
    underperforming_routes: [
      { route_id: "R-500A", route_short_name: "500-A", route_long_name: "Silk Board to Hebbal ORR", otp_pct: 58.4, mean_delay_min: 14.2, status_label: "UNDERPERFORMING" },
      { route_id: "R-335E", route_short_name: "335-E", route_long_name: "KBS to ITPL Whitefield", otp_pct: 64.1, mean_delay_min: 9.8, status_label: "UNDERPERFORMING" }
    ]
  });
}
