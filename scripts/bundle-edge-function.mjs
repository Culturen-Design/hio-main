#!/usr/bin/env node
// Vendors the @hio/* workspace packages into the ai-command edge function so the
// committed function is SELF-CONTAINED — exactly what gets deployed.
//
// Why: the Supabase MCP `deploy_edge_function` uploads a flat file set and cannot
// reach `../../../packages`. Rather than keep two divergent deploy shapes (a repo
// import map vs a hand-inlined MCP bundle — the M2.6 follow-up), the engine source
// is vendored into `vendor/` by this script and the function's `deno.json` imports
// `@hio/*` from there. Result: one artifact, deployed identically via MCP or CLI.
//
// Source of truth stays the packages. These vendored files are GENERATED; CI
// re-runs this script and fails on any diff (see .github/workflows/ci.yml).
//
// Run: npm run bundle:ai-command

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fnDir = join(root, "supabase", "functions", "ai-command");
const vendorDir = join(fnDir, "vendor");

// Each @hio/* package → its vendored filename. Imports inside the vendored code
// (bare specifiers like `@hio/content-model`, `zod`) resolve via the function's
// deno.json import map, so no source rewriting is needed.
const PACKAGES = [
  {
    name: "@hio/content-model",
    src: "packages/content-model/src/index.ts",
    out: "content-model.ts",
  },
  // Sibling module of content-model's index (re-exported from it). Vendored as
  // its own file; the extension-rewrite below points the relative import at it.
  {
    name: "@hio/content-model (collections)",
    src: "packages/content-model/src/collections.ts",
    out: "collections.ts",
  },
  { name: "@hio/ai-engine", src: "packages/ai-engine/src/index.ts", out: "ai-engine.ts" },
];

const banner = (pkg, srcRel) =>
  [
    "// ─────────────────────────────────────────────────────────────────────────",
    `// GENERATED — DO NOT EDIT. Vendored from ${srcRel} (${pkg}).`,
    "// Edit the source package, then run `npm run bundle:ai-command`.",
    "// CI fails if this file drifts from the package (.github/workflows/ci.yml).",
    "// ─────────────────────────────────────────────────────────────────────────",
    "",
    "",
  ].join("\n");

mkdirSync(vendorDir, { recursive: true });

for (const { name, src, out } of PACKAGES) {
  const source = readFileSync(join(root, src), "utf8");
  // Normalize to LF so the output is identical across platforms (CI runs on Linux),
  // and give extensionless RELATIVE imports the .ts extension Deno requires
  // (TS's bundler resolution omits it; e.g. index.ts's `from "./collections"`).
  const body = source
    .replace(/\r\n/g, "\n")
    .replace(/(from\s+")(\.\.?\/[^"]+?)(?<!\.ts)(")/g, "$1$2.ts$3");
  writeFileSync(join(vendorDir, out), banner(name, src) + body);
  console.log(`vendored ${name} → supabase/functions/ai-command/vendor/${out}`);
}

console.log("✅ ai-command bundle is in sync with the packages.");
