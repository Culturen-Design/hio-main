#!/usr/bin/env node
// Builds the distributable Claude Code plugin from the project's .claude/ config,
// so the SAME guardrails/skills/agents/commands can be shared across every team
// project via `/plugin install` instead of copy-pasting .claude/ each time.
//
// Source of truth: .claude/{commands,agents,skills,hooks}
// Output:          plugin/ai-dev-workflow/{commands,agents,skills,hooks}
//
// Run: npm run plugin:build  →  then commit + publish the plugin/ folder.

import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, ".claude");
const out = join(root, "plugin", "ai-dev-workflow");

for (const dir of ["commands", "agents", "skills", "hooks"]) {
  const from = join(src, dir);
  const to = join(out, dir);
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

// Plugin hooks use ${CLAUDE_PLUGIN_ROOT} so paths resolve wherever it's installed.
const P = "${CLAUDE_PLUGIN_ROOT}";
const hooks = {
  PreToolUse: [
    { matcher: "Read|Edit|Write|Bash", hooks: [{ type: "command", command: `node ${P}/hooks/block-secrets.mjs` }] },
    { matcher: "Edit|Write", hooks: [{ type: "command", command: `node ${P}/hooks/protect-paths.mjs` }] },
    { matcher: "mcp__supabase__.*", hooks: [{ type: "command", command: `node ${P}/hooks/no-direct-prod-db.mjs` }] },
  ],
  PostToolUse: [
    { matcher: "Edit|Write", hooks: [{ type: "command", command: `node ${P}/hooks/format-and-check.mjs` }] },
  ],
};
writeFileSync(join(out, "hooks", "hooks.json"), `${JSON.stringify(hooks, null, 2)}\n`);

console.log("✅ Built plugin at plugin/ai-dev-workflow");
console.log("   Next: commit it, then in another project run:");
console.log("   /plugin marketplace add <this-repo>  &&  /plugin install ai-dev-workflow");
