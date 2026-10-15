import { NextResponse } from "next/server";
import { verifyGoogleMapsHealth, isGoogleMapsConfigured } from "@/lib/googleMapsService";

export async function GET() {
  const configured = isGoogleMapsConfigured();
  if (!configured) {
    return NextResponse.json({
      configured: false,
      status: "KEY_MISSING",
      message: "GOOGLE_MAPS_SERVER_API_KEY is not configured in .env.local",
      supported_apis: ["Places API (New)", "Routes API", "Geocoding API", "Directions API"]
    });
  }

  const health = await verifyGoogleMapsHealth();

  return NextResponse.json({
    configured: true,
    is_configured: true,
    status: health.status,
    message: health.message,
    supported_apis: ["Places API (New)", "Routes API", "Geocoding API", "Directions API"]
  });
}
