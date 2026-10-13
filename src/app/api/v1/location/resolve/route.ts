import { NextRequest, NextResponse } from "next/server";
import { resolveLocation } from "@/lib/locationProvider";
import { LocationResolveQuerySchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("place_id") || undefined;
  const query = searchParams.get("q") || undefined;

  const parsed = LocationResolveQuerySchema.safeParse({ place_id: placeId, q: query });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Missing place_id or q parameter" },
      { status: 400 }
    );
  }

  const lookupKey = parsed.data.place_id || parsed.data.q || "";
  const resolved = await resolveLocation(lookupKey);

  return NextResponse.json({
    status: "OK",
    location: resolved
  });
}
