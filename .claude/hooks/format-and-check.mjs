#!/usr/bin/env node
// PostToolUse(Edit|Write): keep every edit formatted + type-clean automatically.
// Formats the touched file with Biome, then runs a project typecheck. On failure
// it exits 2 so the error text is fed back to Claude to self-correct.
// Only acts on JS/TS source files; skips everything else fast.

import { execSync } from "node:child_process";
import { allow, readPayload, toolFilePath } from "./_util.mjs";

const payload = await readPayload();
const p = toolFilePath(payload);

if (!p || !/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(p)) allow();
if (/\/node_modules\//.test(p)) allow();

function run(cmd) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf8" });
}

let errors = "";

// 1. Format + autofix the single touched file (fast, safe).
try {
  run(`npx biome check --write "${p}"`);
} catch (e) {
  errors += `Biome could not fully fix "${p}":\n${e.stdout || e.message}\n`;
}

// 2. Typecheck the project (incremental; tsc has no single-file mode).
try {
  run("npx tsc --noEmit");
} catch (e) {
  errors += `Type errors after editing "${p}":\n${e.stdout || e.message}\n`;
}

if (errors) {
  process.stderr.write(`🔧 Fix these before continuing:\n${errors}`);
  process.exit(2);
}

allow();
