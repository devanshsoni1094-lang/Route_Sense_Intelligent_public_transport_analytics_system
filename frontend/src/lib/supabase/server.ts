import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseServerClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes("your-project-id")) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Verify a user session token using Supabase Auth or service client
 */
export async function verifySupabaseToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { valid: false, error: "SUPABASE_NOT_CONFIGURED" };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { valid: false, error: error?.message || "INVALID_TOKEN" };
    }
    return {
      valid: true,
      userId: user.id,
      email: user.email
    };
  } catch (err: any) {
    return { valid: false, error: err?.message || "VERIFICATION_FAILED" };
  }
}
