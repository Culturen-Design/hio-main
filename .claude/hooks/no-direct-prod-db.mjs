#!/usr/bin/env node
// PreToolUse(mcp__.*): never let the AI touch the production Supabase project.
//
// Runs on every MCP call because the Supabase server can appear under different
// names: `mcp__supabase__*` from .mcp.json, or `mcp__<connector-uuid>__*` when it
// is a hosted claude.ai connector. So Supabase calls are recognised by what they
// contain, not by the server name.
//
// Guards:
//   1. Any MCP call whose input mentions SUPABASE_PROD_REF is blocked.
//   2. A Supabase WRITE op is blocked unless it explicitly targets SUPABASE_DEV_REF.
//   3. Fail closed: if either ref is unset, Supabase writes are blocked.
// The refs are public identifiers, set in .claude/settings.json "env".

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

const values = JSON.stringify(input);
const op = tool.split("__").pop() ?? "";
const server = tool.split("__")[1] ?? "";

// A Supabase call: the local server by name, or any call carrying a Supabase
// project ref (20 lowercase letters) in project_id / project_ref.
const REF = /^[a-z]{20}$/;
const isSupabase =
  server === "supabase" ||
  REF.test(String(input.project_id ?? "")) ||
  REF.test(String(input.project_ref ?? ""));
const isWrite = isSupabase && WRITE_OPS.includes(op);

// 1. Any reference to the prod project ref is forbidden, on any server.
if (PROD && values.includes(PROD)) {
  block(
    `This MCP call references the PRODUCTION Supabase project (${PROD}). Production changes happen only via CI on merge to main. Blocked.`,
  );
}

if (isWrite) {
  // 3. Fail closed when the guard can't tell dev from prod.
  if (!PROD || !DEV) {
    block(
      `"${tool}" is a Supabase write, but SUPABASE_DEV_REF / SUPABASE_PROD_REF are not set, so this guard can't verify the target. Set both in .claude/settings.json "env".`,
    );
  }
  // 2. Writes must explicitly target the dev project.
  if (!values.includes(DEV)) {
    block(
      `"${tool}" is a Supabase write that doesn't target the dev project (${DEV}). Run schema changes through the db-migration skill and pass project_id=${DEV} explicitly.`,
    );
  }
}

allow();
