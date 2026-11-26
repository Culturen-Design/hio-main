"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { cn } from "../../cn";
import { Button } from "../Button";
import { type ChatMessage, capMessages, loadChatHistory, saveChatHistory } from "./chatHistory";

const newId = () => crypto.randomUUID();

/** What an app's `send` adapter reports back after calling the ai-command function. */
export type SendOutcome = {
  reply: string;
  /** True when the engine actually executed a tool — the canvas should refresh. */
  applied: boolean;
  /** True when the call failed (non-2xx / unavailable) — renders as an error bubble. */
  failed?: boolean;
  /** Pre-edit snapshot id from the server (one per applied request) — enables Undo. */
  undoVersionId?: string | null;
};

const bubbleClasses = (message: Pick<ChatMessage, "role" | "error">) =>
  cn(
    "max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-normal",
    message.role === "user"
      ? "self-end bg-primary text-primary-foreground"
      : message.error
        ? "self-start border border-destructive/30 bg-destructive/10 text-destructive"
        : "self-start bg-muted text-foreground",
  );

/**
 * The builder's PRIMARY editing path: a persistent chat pane (no floating
 * pill, no overlay). Transport comes in via the `send` prop so this package
 * stays Next-free — each app's BuilderClient owns the supabase call. History
 * lives in sessionStorage under `storageKey` (capped, survives reloads within
 * the tab); the intro line is rendered statically and never persisted.
 */
export function ChatPanel({
  send,
  onApplied,
  onUndo,
  intro,
  storageKey,
  suggestions = [],
}: {
  send: (prompt: string) => Promise<SendOutcome>;
  onApplied: () => void;
  /** Restores the pre-edit snapshot a turn carries. Return the bubble to show. */
  onUndo?: (versionId: string) => Promise<{ ok: boolean; message: string }>;
  intro: string;
  storageKey: string;
  suggestions?: string[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory(storageKey));
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [retryPrompt, setRetryPrompt] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveChatHistory(storageKey, messages);
  }, [storageKey, messages]);

  // Keep the newest turn in view (also on reload with restored history).
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages/pending are the scroll triggers, not inputs.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  async function submit(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || pending) return;

    setInput("");
    setRetryPrompt(null);
    setMessages((m) => capMessages([...m, { id: newId(), role: "user", text: trimmed }]));
    setPending(true);

    try {
      const outcome = await send(trimmed);
      setMessages((m) =>
        capMessages([
          ...m,
          {
            id: newId(),
            role: "assistant",
            text: outcome.reply,
            ...(outcome.failed ? { error: true } : {}),
            ...(outcome.undoVersionId ? { undoVersionId: outcome.undoVersionId } : {}),
          },
        ]),
      );
      if (outcome.failed) setRetryPrompt(trimmed);
      if (outcome.applied) onApplied();
    } catch {
      setMessages((m) =>
        capMessages([
          ...m,
          {
            id: newId(),
            role: "assistant",
            text: "Something went wrong. Please try again.",
            error: true,
          },
        ]),
      );
      setRetryPrompt(trimmed);
    } finally {
      setPending(false);
    }
  }

  async function undo(versionId: string) {
    if (!onUndo || pending) return;
    setPending(true);
    try {
      const result = await onUndo(versionId);
      setMessages((m) =>
        capMessages([
          // A restore invalidates every earlier snapshot chip, not just this one.
          ...(result.ok ? m.map(({ undoVersionId: _drop, ...rest }) => rest) : m),
          {
            id: newId(),
            role: "assistant",
            text: result.message,
            ...(result.ok ? {} : { error: true }),
          },
        ]),
      );
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit(input);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="AI editor">
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4"
      >
        <div className={bubbleClasses({ role: "assistant" })}>{intro}</div>
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}
          >
            <div className={bubbleClasses(m)}>{m.text}</div>
            {m.undoVersionId && onUndo && (
              <button
                type="button"
                disabled={pending}
                onClick={() => void undo(m.undoVersionId as string)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground disabled:opacity-50"
              >
                ↩ Undo this change
              </button>
            )}
          </div>
        ))}
        {pending && (
          <div className={cn(bubbleClasses({ role: "assistant" }), "flex items-center gap-2")}>
            <span aria-hidden="true" className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-muted-foreground motion-safe:animate-bounce" />
              <span className="size-1.5 rounded-full bg-muted-foreground motion-safe:animate-bounce motion-safe:[animation-delay:120ms]" />
              <span className="size-1.5 rounded-full bg-muted-foreground motion-safe:animate-bounce motion-safe:[animation-delay:240ms]" />
            </span>
            <span className="text-muted-foreground text-xs">Working on your page…</span>
          </div>
        )}
        {retryPrompt && !pending && (
          <button
            type="button"
            onClick={() => void submit(retryPrompt)}
            className="self-start rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
          >
            ↻ Try again
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-3 pt-2.5 pb-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => void submit(s)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className={cn("flex gap-2 px-3 py-3", suggestions.length === 0 && "border-t border-border")}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Message the AI editor"
          placeholder="Ask for a change…"
          disabled={pending}
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-primary"
        />
        <Button type="submit" disabled={pending || !input.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
}
