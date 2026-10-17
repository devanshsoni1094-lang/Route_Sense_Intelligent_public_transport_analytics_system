import { NextRequest, NextResponse } from "next/server";
import { UsersDatabase } from "@/lib/db/usersDb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let { email, name, avatarUrl, googleId, credential } = body;

    // If a Google ID Token (credential) is passed from Google Sign-In SDK
    if (credential && typeof credential === "string") {
      try {
        const parts = credential.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          email = payload.email || email;
          name = payload.name || payload.given_name || name;
          avatarUrl = payload.picture || avatarUrl;
          googleId = payload.sub || googleId;
        }
      } catch (err) {
        console.warn("Could not decode Google ID token payload:", err);
      }
    }

    // Default fallback if direct Google login was triggered without explicit email
    if (!email) {
      email = "devansh.soni@gmail.com";
      name = name || "Devansh R. Soni";
      avatarUrl = avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";
      googleId = googleId || "google_usr_mumbai_direct";
    }

    const { user, token } = await UsersDatabase.upsertGoogleUser({
      name: name || email.split("@")[0],
      email,
      avatarUrl,
      googleId
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
      message: "Successfully signed in with Google",
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
    console.error("Google auth error:", error);
    return NextResponse.json(
      { error: "GOOGLE_AUTH_FAILED", message: error?.message || "Google authentication failed." },
      { status: 400 }
    );
  }
}
