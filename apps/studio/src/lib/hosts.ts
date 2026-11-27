/**
 * Host classification for custom-domain routing (M4.8).
 *
 * The Studio app is served on its own host(s) — the Netlify subdomain, deploy
 * previews, localhost, plus any configured agency host. EVERY other incoming host
 * is treated as a client's custom domain: middleware rewrites it to the public-site
 * render route so a client's domain only ever shows that client's published site,
 * never the agency dashboard.
 *
 * Pure functions, no env/Next imports — the middleware passes in the configured
 * allowlist so this stays unit-testable.
 */

/** Hosts that always serve the Studio app itself, regardless of configuration. */
const BUILTIN_APP_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Lowercase a Host header and strip the port (and trailing dot, if any). */
export function normalizeHost(host: string | null | undefined): string {
  if (!host) return "";
  // IPv6 hosts arrive bracketed ("[::1]:3000"); split on the LAST colon only if it
  // looks like a port suffix on a bracketed/plain host.
  const noPort = host.startsWith("[") ? host.replace(/\]:\d+$/, "]") : host.replace(/:\d+$/, "");
  return noPort.trim().toLowerCase().replace(/\.$/, "");
}

/**
 * True if `host` serves the Studio app (dashboard/builder/etc.), false if it's a
 * client's custom domain that should render the published public site.
 *
 * `configured` = the NEXT_PUBLIC_STUDIO_APP_HOSTS allowlist (already comma-split).
 * Empty/unknown host → treated as an app host (don't hijack ambiguous requests).
 */
export function isAppHost(host: string | null | undefined, configured: string[] = []): boolean {
  const h = normalizeHost(host);
  if (!h) return true;
  if (BUILTIN_APP_HOSTS.has(h)) return true;
  if (h.endsWith(".netlify.app")) return true;
  return configured.some((c) => normalizeHost(c) === h);
}
