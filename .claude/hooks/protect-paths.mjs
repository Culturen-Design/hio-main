#!/usr/bin/env node
// PreToolUse(Edit|Write): protect immutable + infrastructure paths.
//  - Applied migrations are immutable: block edits to EXISTING files in
//    supabase/migrations/ (creating a NEW migration file is allowed).
//  - Infra files (netlify.toml, .github/workflows/*, .claude/settings.json,
//    .mcp.json) require explicit human intent: set CLAUDE_ALLOW_INFRA=1 to edit.

import { existsSync } from "node:fs";
import { allow, block, readPayload, toolFilePath } from "./_util.mjs";

const payload = await readPayload();
const p = toolFilePath(payload);
if (!p) allow();

// 1. Immutable migrations — only block edits to files that already exist.
//    (Paths may be absolute or project-relative, so don't require a leading slash.)
if (/(^|\/)supabase\/migrations\/.+\.sql$/.test(p) && existsSync(p)) {
  block(
    `"${p}" is an applied migration and is immutable. Create a NEW migration with \`supabase migration new\` instead of editing this one.`,
  );
}

// 2. Infrastructure files — gated behind an explicit env flag.
const INFRA = [
  /(^|\/)netlify\.toml$/,
  /(^|\/)\.github\/workflows\//,
  /(^|\/)\.claude\/settings\.json$/,
  /(^|\/)\.mcp\.json$/,
];
if (INFRA.some((re) => re.test(p)) && process.env.CLAUDE_ALLOW_INFRA !== "1") {
  block(
    `"${p}" is infrastructure config. Editing it changes deploy/CI/permission behavior. If this is intended, re-run with CLAUDE_ALLOW_INFRA=1 and have a human review the diff.`,
  );
}

allow();
