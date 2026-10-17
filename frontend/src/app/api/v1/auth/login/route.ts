import { NextRequest, NextResponse } from "next/server";
import { UsersDatabase } from "@/lib/db/usersDb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "Email and password are required." },
        { status: 400 }
      );
    }

    const { user, token } = await UsersDatabase.validatePassword(email, password);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      role: user.role
    };

    const response = NextResponse.json({
      success: true,
      message: "Successfully signed in",
      user: safeUser,
      token
    });

    // Set secure session cookie
    response.cookies.set("routesense_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/"
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: "AUTH_FAILED", message: error?.message || "Invalid credentials." },
      { status: 401 }
    );
  }
}
