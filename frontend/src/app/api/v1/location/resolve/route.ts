import { NextRequest, NextResponse } from "next/server";
import { resolveLocation } from "@/lib/locationProvider";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("place_id") || searchParams.get("q") || "";

  if (!placeId) {
    return NextResponse.json({ error: "Missing place_id or q parameter" }, { status: 400 });
  }

  const resolved = await resolveLocation(placeId);

  return NextResponse.json({
    status: "OK",
    location: resolved
  });
}
