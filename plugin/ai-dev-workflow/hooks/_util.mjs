// Shared helpers for hook scripts. Hooks receive a JSON payload on stdin and
// signal "block" by exiting with code 2 (stderr is shown to Claude so it can
// adjust). Exit 0 = allow. We default to ALLOW on parse errors so a malformed
// payload never bricks the agent — the settings.json deny-list is the backstop.

export async function readPayload() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    return {};
  }
}

export function block(message) {
  process.stderr.write(`⛔ ${message}\n`);
  process.exit(2);
}

export function allow() {
  process.exit(0);
}

// Normalize a possibly-relative path from tool input to forward slashes.
export function toolFilePath(payload) {
  const i = payload.tool_input ?? {};
  const p = i.file_path ?? i.path ?? i.notebook_path ?? "";
  return String(p).replace(/\\/g, "/");
}
