#!/usr/bin/env node
// PreToolUse(mcp__supabase__*): never let the AI mutate production.
// Two guards:
//   1. If any input value equals SUPABASE_PROD_REF → block (wrong project).
//   2. If the tool is a known WRITE op → block unless it targets the dev ref
//      explicitly. (The MCP server is also launched --read-only as a first line.)

import { allow, block, readPayload } from "./_util.mjs";

const payload = await readPayload();
const tool = payload.tool_name ?? "";
const input = payload.tool_input ?? {};

const PROD = process.env.SUPABASE_PROD_REF?.trim();
const DEV = process.env.SUPABASE_DEV_REF?.trim();

// Known mutating Supabase MCP operations.
const WRITE_OPS = [
  "apply_migration",
  "execute_sql",
  "create_branch",
  "delete_branch",
  "merge_branch",
  "reset_branch",
  "rebase_branch",
  "deploy_edge_function",
  "create_project",
  "pause_project",
  "restore_project",
  "delete_project",
];
const isWrite = WRITE_OPS.some((op) => tool.endsWith(op));

const values = JSON.stringify(input);

// 1. Any reference to the prod project ref is forbidden.
if (PROD && values.includes(PROD)) {
  block(
    `This Supabase MCP call references the PRODUCTION project (${PROD}). Production changes happen only via CI on merge to main. Blocked.`,
  );
}

// 2. Writes must explicitly target the dev project; otherwise block.
if (isWrite) {
  const targetsDev = DEV && values.includes(DEV);
  if (!targetsDev) {
    block(
      `"${tool}" is a write operation. Run schema changes through the db-migration skill (CLI + supabase/migrations), not direct MCP writes. If you truly need a dev write, pass project_ref=${DEV ?? "<dev-ref>"} explicitly.`,
    );
  }
}

allow();
