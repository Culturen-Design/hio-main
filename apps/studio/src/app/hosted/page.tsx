import { normalizeHost } from "@/lib/hosts";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PublicSiteView, fetchPublicSiteByDomain } from "../sites/shared";

/**
 * Custom-domain render route (M4.8). Reached only via the middleware rewrite for a
 * request whose Host is a client's mapped custom domain — it reads that Host and
 * renders the matching published public site. Visiting it on an app host yields a
 * 404 (no domain maps to localhost / the Netlify subdomain), which is fine.
 *
 * NOTE: must NOT be an underscore-prefixed folder — Next.js treats `_name` as a
 * private folder and excludes it from routing, so the middleware rewrite would 404.
 */
async function siteForCurrentHost() {
  const host = normalizeHost((await headers()).get("host"));
  if (!host) return null;
  return fetchPublicSiteByDomain(host);
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await siteForCurrentHost();
  if (!site) return { title: "Not found" };
  return { title: site.title ?? site.tenant_name };
}

export default async function HostedSitePage() {
  const site = await siteForCurrentHost();
  if (!site) notFound();

  return <PublicSiteView site={site} />;
}
