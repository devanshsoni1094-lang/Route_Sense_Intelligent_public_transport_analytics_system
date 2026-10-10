import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      id: "REC-2026-001",
      route_id: "R-500A",
      problem_title: "Severe Peak Hour Congestion Bottleneck at Bellandur-Marathahalli",
      proposed_action: "Increase peak frequency from 10-min to 6-min headway between 08:00-10:30 AM and short-turn 4 buses at Marathahalli Bridge.",
      supporting_metrics: { mean_delay_min: 14.2, otp_pct: 58.4, peak_occupancy_rate: 1.15, observations_count: 420 },
      expected_benefit: "Reduces passenger wait time by 32% and improves Corridor OTP from 58.4% to 81.0%.",
      estimated_effort: "MEDIUM",
      confidence_level: "HIGH",
      status: "PENDING_REVIEW"
    },
    {
      id: "REC-2026-002",
      route_id: "R-335E",
      problem_title: "Off-Peak Excess Layover & Vehicle Idling at ITPL Terminal",
      proposed_action: "Reallocate 3 idle vehicles during 12:00-15:00 to feeder Route 201 to cover metro connection demand.",
      supporting_metrics: { layover_time_min: 38.0, target_layover_min: 15.0, utilization_pct: 52.0 },
      expected_benefit: "Increases fleet utilization efficiency by 18% with zero extra fuel burn.",
      estimated_effort: "LOW",
      confidence_level: "HIGH",
      status: "APPROVED",
      reviewed_by: "admin"
    }
  ]);
}
