import { createClient } from "@supabase/supabase-js";

/** Cliente de servidor con la sesión del usuario. Respeta RLS. */
export function serverClient(accessToken?: string) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}
