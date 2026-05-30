import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Server-only admin client using the service-role key. Bypasses RLS — only
// use it after explicitly verifying the user from their session.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
