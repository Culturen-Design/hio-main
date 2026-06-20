import { z } from "zod";

/**
 * Validated environment. Importing this module fails fast (at build/boot) if a
 * required var is missing or malformed — a key part of "guardrails over hope".
 * Add new vars here so every environment is checked the same way.
 *
 * Studio needs only the public Supabase pair for now (team auth + dashboard).
 * Public-site URL / service-role wiring arrive with later M4 steps.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
