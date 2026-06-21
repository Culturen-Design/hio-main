import { z } from "zod";

/**
 * Validated environment. Importing this module fails fast (at build/boot) if a
 * required var is missing or malformed — a key part of "guardrails over hope".
 * Add new vars here so every environment is checked the same way.
 *
 * Studio needs the public Supabase pair plus (M4.8) the optional list of hosts that
 * serve the app itself — any other incoming host is a client custom domain.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Comma-separated hosts that serve the Studio APP (dashboard/builder). Any host
  // NOT in this list (and not localhost / *.netlify.app) is treated as a client's
  // custom domain and renders that client's published public site. Optional —
  // localhost + Netlify subdomains work out of the box (see lib/hosts.ts).
  NEXT_PUBLIC_STUDIO_APP_HOSTS: z.string().optional().default(""),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STUDIO_APP_HOSTS: process.env.NEXT_PUBLIC_STUDIO_APP_HOSTS,
});

/** The configured Studio app hosts, comma-split + trimmed (empty list if unset). */
export const STUDIO_APP_HOSTS = publicEnv.NEXT_PUBLIC_STUDIO_APP_HOSTS.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
