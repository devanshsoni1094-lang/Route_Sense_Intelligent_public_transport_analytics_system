import { NextResponse } from "next/server";

export async function GET() {
  const hourly_patterns = [
    { hour: 6, weekday_demand: 180, weekend_demand: 90, predicted_demand: 185 },
    { hour: 8, weekday_demand: 680, weekend_demand: 310, predicted_demand: 670 },
    { hour: 10, weekday_demand: 520, weekend_demand: 340, predicted_demand: 515 },
    { hour: 12, weekday_demand: 390, weekend_demand: 280, predicted_demand: 400 },
    { hour: 14, weekday_demand: 410, weekend_demand: 290, predicted_demand: 410 },
    { hour: 16, weekday_demand: 580, weekend_demand: 320, predicted_demand: 590 },
    { hour: 18, weekday_demand: 740, weekend_demand: 360, predicted_demand: 730 },
    { hour: 20, weekday_demand: 340, weekend_demand: 210, predicted_demand: 350 },
  ];

  return NextResponse.json({
    hourly_patterns,
    peak_morning_hour: "08:00 - 09:00 IST",
    peak_evening_hour: "18:00 - 19:00 IST",
    highest_demand_route: "Route 500-A Outer Ring Road Express"
  });
}
