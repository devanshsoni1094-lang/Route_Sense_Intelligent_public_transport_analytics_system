import { NextRequest, NextResponse } from "next/server";
import { searchIndianLocations } from "@/lib/locationProvider";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  if (!query || query.trim().length < 2) {
    return NextResponse.json({
      query,
      count: 0,
      results: [],
      provider: "indian_transit_db"
    });
  }

  const results = await searchIndianLocations(query);

  return NextResponse.json({
    query,
    count: results.length,
    results,
    provider: results.length > 0 ? results[0].provider : "indian_transit_db"
  });
}
