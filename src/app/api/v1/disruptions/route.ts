import { NextRequest, NextResponse } from "next/server";
import { DisruptionService } from "@/lib/disruptions/disruptionService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode") || undefined;
    const origin = searchParams.get("origin") || undefined;
    const destination = searchParams.get("destination") || undefined;

    let disruptions;
    if (origin && destination) {
      disruptions = DisruptionService.checkRouteDisruptions(origin, destination, mode);
    } else if (mode) {
      disruptions = DisruptionService.getDisruptionsByMode(mode);
    } else {
      disruptions = DisruptionService.getAllDisruptions();
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      region: "Mumbai Metropolitan Region (MMR)",
      total: disruptions.length,
      disruptions
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "DISRUPTIONS_ERROR", message: error?.message || "Failed to fetch disruption data." },
      { status: 500 }
    );
  }
}
