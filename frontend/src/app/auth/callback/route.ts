import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const next = request.nextUrl.searchParams.get("next") || "/";

    if (code) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        await supabase.auth.exchangeCodeForSession(code).catch((err) => {
          console.error("Supabase code exchange error:", err);
        });
      }
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = next.startsWith("/") ? next : "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Auth callback error:", err);
    const fallbackUrl = request.nextUrl.clone();
    fallbackUrl.pathname = "/login";
    fallbackUrl.search = "";
    return NextResponse.redirect(fallbackUrl);
  }
}
