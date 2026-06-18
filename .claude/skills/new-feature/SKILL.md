---
name: new-feature
description: Scaffold a new feature the team's way — App Router route, server/client split, Zod-validated input, colocated Vitest test. Use whenever adding a new page, route, or user-facing capability to this Next.js + Supabase app.
---

# new-feature

Add a feature consistently. Follow these steps; do not invent new structure.

## Conventions
- Routes live in `src/app/<segment>/page.tsx` (Server Components by default).
- Mark a component `"use client"` ONLY when it needs state/effects/browser APIs.
- Shared logic in `src/lib/`; reusable UI in `src/components/`.
- Data access uses the existing Supabase helpers — never re-create them:
  - server: `import { createClient } from "@/lib/supabase/server"`
  - browser: `import { createClient } from "@/lib/supabase/client"`
- Validate ALL external input (form data, params, request bodies) with Zod.
- Server secrets stay server-side; never import `serverEnv()` into a client component.

## Steps
1. Confirm the feature scope and whether it needs a DB change. If it does, run the
   **db-migration** skill first and finish the schema before wiring UI.
2. Create the route/component files under `src/app/` following the conventions above.
3. Put shared types/helpers in `src/lib/`. Reuse existing utilities before writing new ones.
4. Write at least one colocated test (`*.test.ts[x]`) covering the core logic/validation.
5. Run `npm run check` (lint + typecheck + test). Fix everything it reports.
6. Hand off to the **review-pr** skill before opening a PR.

## Definition of done
- `npm run check` is green.
- New input is Zod-validated; no secret crosses to the client.
- A test exists and passes. Files match the structure above.
