-- 011_custom_domains.sql
-- M4.8 — Custom domains.
--
-- Maps an incoming custom host (e.g. acme.com) to a tenant's published public site.
-- The public render already works by slug (get_public_site, migration 009 → the
-- /sites/[slug] route). M4.8 adds one hop in front: host → tenant → its published
-- site, then reuses that same render.
--
-- Decisions (ratified 2026-06-21, see docs/ROADMAP.md M4.8 + deviation log):
--   * Mapping lives in a single `tenants.custom_domain` column (one domain per
--     tenant) — the lightest option, matching TENANCY.md's singular "map a domain"
--     and the named-bundle altitude chosen in M4.2. A separate `domains` table for
--     multi-alias / verification workflows stays a FUTURE additive option.
--   * Resolution is Next.js middleware (host-rewrite) + this anon RPC — all logic in
--     Next + Postgres, no edge function. Real DNS/cert provisioning is a Netlify
--     dashboard step (add the domain as an alias on the Studio site).

-- One custom domain per tenant. Nullable (most tenants have none). UNIQUE so a host
-- resolves to exactly one tenant. The CHECK mirrors a normalized lowercase hostname
-- (labels + a TLD); the app normalizes (trim + lowercase) before writing.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE
    CHECK (
      custom_domain IS NULL
      OR custom_domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$'
    );

COMMENT ON COLUMN public.tenants.custom_domain IS
  'Optional custom host (lowercase, no scheme/port) mapped to this tenant''s published public site. Resolved by get_public_site_by_domain.';

-- Public resolver: a sibling of get_public_site (009) keyed on the custom domain
-- instead of the site slug. Returns ONLY a PUBLISHED site's public fields, so anon
-- may execute it — the member-only tenants row (plan/schema_variant/kind) is never
-- exposed. Unknown/unmapped/unpublished hosts return NULL (→ 404).
CREATE OR REPLACE FUNCTION public.get_public_site_by_domain(p_host text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'site_slug',   s.slug,
    'title',       s.title,
    'tenant_name', t.name,
    'theme',       t.theme,
    'sections',    COALESCE(
      (SELECT jsonb_agg(
                jsonb_build_object(
                  'id',            se.id,
                  'type',          se.type,
                  'content',       se.content,
                  'style_variant', se.style_variant,
                  'width',         se.width
                )
                ORDER BY se."order")
       FROM public.sections se
       WHERE se.site_id = s.id),
      '[]'::jsonb)
  )
  FROM public.tenants t
  JOIN public.sites s ON s.tenant_id = t.id
  WHERE t.custom_domain = lower(p_host)
    AND s.is_published = true
  LIMIT 1;
$$;

-- Public endpoint: anonymous visitors render published sites via their custom domain.
-- (Supabase default-grants EXECUTE to anon + authenticated on new public functions;
-- this GRANT is explicit + intentional — the function only returns published-site
-- public fields, like get_public_site.)
GRANT EXECUTE ON FUNCTION public.get_public_site_by_domain(text) TO anon, authenticated;
