import type { ZodError } from "zod";

type Verb = "add" | "save" | "delete" | "move" | "resize";

const VERB_TEXT: Record<Verb, string> = {
  add: "add that section",
  save: "save your changes",
  delete: "delete that section",
  move: "move that section",
  resize: "change that section's width",
};

/**
 * Turns a raw database/RLS error into a sentence a non-technical user can act
 * on. The raw text is logged on the server for debugging and never shown:
 * it can contain table names, policy names and SQL.
 */
export function friendlyError(verb: Verb, error: { message?: string; code?: string }): string {
  console.error(`[builder] ${verb} failed`, error);
  // 42501 = insufficient_privilege: an RLS policy said no (tier gate, locked account).
  if (error.code === "42501") {
    return `You can't ${VERB_TEXT[verb]} on your current plan or account status.`;
  }
  return `Couldn't ${VERB_TEXT[verb]}. Please try again in a moment.`;
}

/** Field-level message for content that fails the module's schema. */
export function invalidContentMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Some fields aren't valid yet. Please check them and try again.";
  const field = issue.path
    .filter((p) => typeof p === "string")
    .map((p) => String(p).replace(/_/g, " "))
    .pop();
  return field
    ? `Please check “${field}”: ${issue.message.toLowerCase()}.`
    : `Please check your changes: ${issue.message.toLowerCase()}.`;
}
