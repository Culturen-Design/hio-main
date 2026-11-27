#!/usr/bin/env node
// PostToolUse(Edit|Write): keep every edit formatted + type-clean automatically.
// Formats the touched file with Biome, then runs a project typecheck. On failure
// it exits 2 so the error text is fed back to Claude to self-correct.
// Only acts on JS/TS source files; skips everything else fast.

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { allow, readPayload, toolFilePath } from "./_util.mjs";

const payload = await readPayload();
const p = toolFilePath(payload);

if (!p || !/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(p)) allow();
if (/\/node_modules\//.test(p)) allow();

function run(cmd) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf8" });
}

// Monorepo-aware: walk up from the edited file to the nearest tsconfig.json so we
// typecheck the right workspace (root has only tsconfig.base.json).
function nearestTsconfigDir(file) {
  let dir = dirname(file);
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "tsconfig.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

let errors = "";

// 1. Format + autofix the single touched file (fast, safe).
try {
  run(`npx biome check --write "${p}"`);
} catch (e) {
  errors += `Biome could not fully fix "${p}":\n${e.stdout || e.message}\n`;
}

// 2. Typecheck the workspace that owns the file (skip if no tsconfig found).
const tsDir = nearestTsconfigDir(p);
if (tsDir) {
  try {
    run(`npx tsc --noEmit -p "${tsDir}"`);
  } catch (e) {
    errors += `Type errors after editing "${p}":\n${e.stdout || e.message}\n`;
  }
}

if (errors) {
  process.stderr.write(`🔧 Fix these before continuing:\n${errors}`);
  process.exit(2);
}

allow();
