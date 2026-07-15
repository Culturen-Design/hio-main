export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Marks a failed assistant turn — rendered destructive-tinted with a retry chip. */
  error?: boolean;
  /** Pre-edit snapshot id for a turn that changed the page — enables the Undo chip. */
  undoVersionId?: string;
};

/** Hard cap on persisted messages — old turns fall off the front. */
export const CHAT_HISTORY_CAP = 50;

export function capMessages<T>(messages: readonly T[], cap = CHAT_HISTORY_CAP): T[] {
  return messages.length <= cap ? [...messages] : messages.slice(messages.length - cap);
}

/**
 * Parses a persisted history string back into messages, validating each entry —
 * sessionStorage contents survive app deploys, so a shape change (or garbage)
 * must degrade to an empty history, never a crash.
 */
export function parseChatHistory(raw: string | null): ChatMessage[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const valid = parsed.filter(
    (m): m is ChatMessage =>
      typeof m === "object" &&
      m !== null &&
      typeof (m as ChatMessage).id === "string" &&
      ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
      typeof (m as ChatMessage).text === "string" &&
      ((m as ChatMessage).undoVersionId === undefined ||
        typeof (m as ChatMessage).undoVersionId === "string"),
  );
  return capMessages(valid);
}

export function serializeChatHistory(messages: readonly ChatMessage[]): string {
  return JSON.stringify(capMessages(messages));
}

/** sessionStorage read, safe to call from a lazy useState initializer during SSR. */
export function loadChatHistory(storageKey: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    return parseChatHistory(window.sessionStorage.getItem(storageKey));
  } catch {
    return [];
  }
}

export function saveChatHistory(storageKey: string, messages: readonly ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey, serializeChatHistory(messages));
  } catch {
    // Quota/full or storage disabled — chat still works, it just won't survive a reload.
  }
}
