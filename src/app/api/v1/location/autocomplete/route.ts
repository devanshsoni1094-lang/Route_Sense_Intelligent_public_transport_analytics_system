import { NextRequest, NextResponse } from "next/server";
import { searchIndianLocations } from "@/lib/locationProvider";
import { LocationAutocompleteQuerySchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "";

  const parsed = LocationAutocompleteQuerySchema.safeParse({ q });
  if (!parsed.success) {
    return NextResponse.json({
      query: q,
      count: 0,
      results: [],
      provider: "indian_transit_db",
      validation_error: parsed.error.issues[0]?.message
    });
  }

  const { results, provider, statusInfo } = await searchIndianLocations(parsed.data.q);

  return NextResponse.json({
    query: parsed.data.q,
    count: results.length,
    results,
    provider,
    statusInfo
  });
}
