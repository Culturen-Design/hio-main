import { publicEnv } from "@/lib/env";
import type { Database } from "@hio/db";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Only ever uses public env vars (URL + anon key).
 * The block-secrets hook + RLS ensure no privileged key reaches the client.
 */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
