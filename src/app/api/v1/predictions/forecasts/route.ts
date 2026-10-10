import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    { timestamp: "08:00 IST", observed_value: 680, predicted_value: 670, lower_bound: 610, upper_bound: 730 },
    { timestamp: "09:00 IST", observed_value: 720, predicted_value: 710, lower_bound: 650, upper_bound: 770 },
    { timestamp: "10:00 IST", observed_value: 540, predicted_value: 535, lower_bound: 480, upper_bound: 590 },
    { timestamp: "11:00 IST", observed_value: undefined, predicted_value: 410, lower_bound: 360, upper_bound: 460 },
    { timestamp: "12:00 IST", observed_value: undefined, predicted_value: 390, lower_bound: 340, upper_bound: 440 },
    { timestamp: "13:00 IST", observed_value: undefined, predicted_value: 405, lower_bound: 355, upper_bound: 455 },
    { timestamp: "14:00 IST", observed_value: undefined, predicted_value: 420, lower_bound: 370, upper_bound: 470 },
    { timestamp: "15:00 IST", observed_value: undefined, predicted_value: 490, lower_bound: 430, upper_bound: 550 },
  ]);
}
