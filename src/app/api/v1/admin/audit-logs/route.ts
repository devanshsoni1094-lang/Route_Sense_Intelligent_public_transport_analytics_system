import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date().toISOString();
  return NextResponse.json([
    { id: 101, username: "admin", action: "REVIEW_RECOMMENDATION_APPROVE", resource_type: "Recommendation", resource_id: "REC-2026-002", details: { final_status: "APPROVED" }, timestamp: now },
    { id: 102, username: "manager", action: "UPDATE_ALERT_STATUS", resource_type: "AnomalyAlert", resource_id: "ALT-2026-002", details: { new_status: "ACKNOWLEDGED" }, timestamp: now }
  ]);
}
