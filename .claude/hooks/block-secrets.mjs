#!/usr/bin/env node
// PreToolUse(Read|Edit|Write|Bash): block any access to env/secret files and
// any shell command that would print or commit secrets. Defense in depth on top
// of the settings.json deny-list (which the user could loosen).

import { allow, block, readPayload, toolFilePath } from "./_util.mjs";

const payload = await readPayload();
const tool = payload.tool_name ?? "";

// Match .env, .env.local, .env.production, path/to/.env.* — but allow .env.example
const ENV_FILE = /(^|\/)\.env(\.|$)/;
const isExample = (p) => p.endsWith(".env.example");

if (tool === "Read" || tool === "Edit" || tool === "Write") {
  const p = toolFilePath(payload);
  if (p && ENV_FILE.test(p) && !isExample(p)) {
    block(
      `Access to secret/env file "${p}" is blocked. Use .env.example for documentation; real secrets live in Netlify/GitHub Actions, never in context.`,
    );
  }
}

if (tool === "Bash") {
  const cmd = String(payload.tool_input?.command ?? "");
  // Reading/echoing env files
  if (
    /\b(cat|type|less|more|head|tail|bat|Get-Content|gc)\b[^\n]*\.env(\.|\b)/i.test(cmd) &&
    !/\.env\.example/.test(cmd)
  ) {
    block("This command would read a secret env file. Blocked.");
  }
  // Dumping the whole environment
  if (/\b(printenv|env)\b\s*$/i.test(cmd.trim()) || /\bGet-ChildItem\s+Env:/i.test(cmd)) {
    block("Dumping the full environment is blocked (may leak secrets).");
  }
  // Staging/committing an env file
  if (/\bgit\s+add\b[^\n]*\.env(\.|\b)/.test(cmd) && !/\.env\.example/.test(cmd)) {
    block("Refusing to git-add a secret env file.");
  }
}

allow();
