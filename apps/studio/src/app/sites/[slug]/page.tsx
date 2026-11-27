import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicSiteView, fetchPublicSiteBySlug } from "../shared";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await fetchPublicSiteBySlug(slug);
  if (!site) return { title: "Not found" };
  return { title: site.title ?? site.tenant_name };
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await fetchPublicSiteBySlug(slug);
  if (!site) notFound();

  return <PublicSiteView site={site} />;
}
