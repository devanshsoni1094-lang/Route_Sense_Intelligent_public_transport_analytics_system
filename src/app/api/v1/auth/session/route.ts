import { NextRequest, NextResponse } from "next/server";
import { UsersDatabase } from "@/lib/db/usersDb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get("routesense_session")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const verified = UsersDatabase.verifySessionToken(token);
    if (!verified.valid || !verified.payload) {
      return NextResponse.json({ authenticated: false, user: null, reason: verified.reason });
    }

    const user = await UsersDatabase.findByEmail(verified.payload.email);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      role: user.role
    };

    return NextResponse.json({
      authenticated: true,
      user: safeUser
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, user: null, error: error?.message });
  }
}
