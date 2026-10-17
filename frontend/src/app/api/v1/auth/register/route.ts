import { NextRequest, NextResponse } from "next/server";
import { UsersDatabase } from "@/lib/db/usersDb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, password } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "INVALID_NAME", message: "Please enter your full name (minimum 2 characters)." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "INVALID_EMAIL", message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "INVALID_PASSWORD", message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const { user, token } = await UsersDatabase.createUserWithPassword({
      name,
      email,
      password
    });

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
      message: "Account created successfully",
      user: safeUser,
      token
    });

    response.cookies.set("routesense_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/"
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: "REGISTRATION_FAILED", message: error?.message || "Failed to create account." },
      { status: 400 }
    );
  }
}
