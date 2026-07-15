-- ── AI editing sessions (Phase 1 of the AI-first builder backend) ─────────────
-- Server-owned conversation state for the ai-command edge function. The client
-- sends only a session id; the function loads/appends the authoritative
-- transcript here. Sessions are BOUNDED (one per builder visit, resumable) —
-- the page state itself remains the model's primary context; these rows add
-- intent continuity, auditability of every AI action, and per-tenant metering.

-- One AI-editing conversation. `last_active_at` drives resumption + pruning.
CREATE TABLE IF NOT EXISTS ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_sessions_site_idx ON ai_sessions(site_id, last_active_at DESC);

ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

-- Members may read their tenant's sessions (audit/analytics surfaces later).
-- No INSERT/UPDATE/DELETE policies: rows are written ONLY by the ai-command
-- edge function (service role, membership-gated by hand) — direct client
-- writes are denied, so a client can never forge transcript state.
CREATE POLICY "ai_sessions_select_member" ON ai_sessions FOR SELECT
  USING (is_tenant_member(tenant_id));

-- The API-shaped transcript. `content` holds the Anthropic content blocks of
-- one turn (text / tool_use / tool_result), so a resumed session replays
-- EXACTLY what the model previously saw and did — and doubles as the audit
-- trail of every tool the AI executed. tenant_id is denormalized (matching
-- site_versions) so RLS checks need no join.
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_messages_session_idx ON ai_messages(session_id, created_at);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_messages_select_member" ON ai_messages FOR SELECT
  USING (is_tenant_member(tenant_id));
