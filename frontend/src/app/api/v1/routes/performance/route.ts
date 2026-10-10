import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    { route_id: "R-500A", route_short_name: "500-A", route_long_name: "Silk Board to Hebbal ORR Express", origin: "Central Silk Board", destination: "Hebbal", distance_km: 28.5, scheduled_trips: 32, completed_trips: 30, otp_pct: 58.4, mean_delay_min: 14.2, median_delay_min: 11.5, p90_delay_min: 22.0, headway_regularity_pct: 68.2, passenger_boardings: 12400, status_label: "UNDERPERFORMING" },
    { route_id: "R-335E", route_short_name: "335-E", route_long_name: "KBS Majestic to ITPL Whitefield", origin: "Majestic", destination: "ITPL", distance_km: 24.2, scheduled_trips: 24, completed_trips: 23, otp_pct: 64.1, mean_delay_min: 9.8, median_delay_min: 7.2, p90_delay_min: 15.4, headway_regularity_pct: 74.0, passenger_boardings: 8900, status_label: "UNDERPERFORMING" },
    { route_id: "R-201", route_short_name: "201", route_long_name: "Majestic to Banashankari TTMC", origin: "Majestic", destination: "Banashankari", distance_km: 14.0, scheduled_trips: 20, completed_trips: 20, otp_pct: 88.5, mean_delay_min: 2.4, median_delay_min: 1.8, p90_delay_min: 4.8, headway_regularity_pct: 91.5, passenger_boardings: 6200, status_label: "NORMAL" },
    { route_id: "R-V500D", route_short_name: "V-500D", route_long_name: "Vayu Vajra AC Airport Express", origin: "Electronic City", destination: "KIAS Airport", distance_km: 54.0, scheduled_trips: 16, completed_trips: 16, otp_pct: 94.2, mean_delay_min: 1.8, median_delay_min: 1.2, p90_delay_min: 3.5, headway_regularity_pct: 96.0, passenger_boardings: 3100, status_label: "NORMAL" }
  ]);
}
