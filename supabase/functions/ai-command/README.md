# `ai-command` edge function

The AI page editor. A thin Deno function that owns only the **security-critical
wiring** — CORS, JWT verify, page-ownership check, service-role isolation, and the
Anthropic call. All product logic (which tools exist, how each mutation is validated
and applied) comes from the shared `@hio/ai-engine`, driven by a `SchemaProvider`
from `@hio/content-model`. Self-Serve passes its built-in schema; Studio (M4) passes
a per-client schema.

## Layout

```
ai-command/
├─ index.ts            # the function (hand-written; the security wiring)
├─ deno.json           # import map: npm: deps + @hio/* → ./vendor/*
├─ vendor/             # GENERATED — vendored @hio/* packages (do not edit)
│  ├─ content-model.ts
│  └─ ai-engine.ts
└─ README.md
```

## Why `vendor/` exists (the deploy story)

We deploy through the **Supabase MCP** `deploy_edge_function`, which uploads a flat
file set and **cannot** reach `../../../packages`. To avoid two divergent deploy
shapes (a repo import map vs a hand-inlined MCP bundle — the M2.6 follow-up), the
engine source is **vendored** into `vendor/` and `deno.json` imports `@hio/*` from
there. The committed function is therefore **self-contained and identical to what is
deployed**, whether via the MCP or the Supabase CLI.

- **Source of truth:** the `@hio/content-model` and `@hio/ai-engine` packages.
- **`vendor/` is generated**, never hand-edited. CI re-runs the bundler and fails on
  any diff (`edge-bundle` job in `.github/workflows/ci.yml`).

## Regenerate the bundle

After changing either package, run from the repo root:

```bash
npm run bundle:ai-command
```

Commit the updated `vendor/` files alongside the package change.

## Deploy (dev)

Deploys go through the Supabase MCP (no local Supabase CLI in this repo). Upload all
of `index.ts`, `deno.json`, and `vendor/*.ts` as the `files`, with
`entrypoint_path: index.ts`, `import_map_path: deno.json`, and `verify_jwt: true`.

Required function secrets on the project: `ANTHROPIC_API_KEY` (and optionally
`ANTHROPIC_MODEL`; defaults to `claude-haiku-4-5-20251001`). `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided by the platform.
