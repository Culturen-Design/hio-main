"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

const newId = () => crypto.randomUUID();

type CommandResponse = { ok: boolean; message: string; tool?: string };

const panel: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  width: 340,
  background: "white",
  borderLeft: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  boxShadow: "-8px 0 24px rgba(0,0,0,0.04)",
  zIndex: 50,
};

const bubble = (role: ChatMessage["role"]): React.CSSProperties => ({
  alignSelf: role === "user" ? "flex-end" : "flex-start",
  maxWidth: "85%",
  padding: "0.5rem 0.7rem",
  borderRadius: 12,
  fontSize: 14,
  lineHeight: 1.4,
  background: role === "user" ? "#111827" : "#f3f4f6",
  color: role === "user" ? "white" : "#111827",
  whiteSpace: "pre-wrap",
});

/**
 * Floating AI editor for the builder. Sends the prompt + page id to the
 * `ai-command` edge function (which is schema-driven by @hio/ai-engine) and
 * refreshes the server components when an edit lands so the canvas updates.
 */
export function ChatSidebar({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Tell me what to change — e.g. “make the headline say Welcome” or “add a link to my shop”.",
    },
  ]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || pending) return;

    setInput("");
    setMessages((m) => [...m, { id: newId(), role: "user", text: prompt }]);
    setPending(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<CommandResponse>("ai-command", {
        body: { prompt, page_id: pageId },
      });

      let reply: string;
      let applied = false;
      if (error) {
        // Non-2xx (e.g. 503 when ANTHROPIC_API_KEY isn't set) — only FunctionsHttpError
        // carries the Response in `context`; surface the body message when present.
        const res = (error as { context?: Response }).context;
        const body = res ? ((await res.json().catch(() => null)) as CommandResponse | null) : null;
        reply = body?.message ?? "AI chat is unavailable right now.";
      } else {
        reply = data?.message ?? "Done.";
        applied = Boolean(data?.ok && data?.tool);
      }

      setMessages((m) => [...m, { id: newId(), role: "assistant", text: reply }]);
      if (applied) router.refresh();
    } catch {
      setMessages((m) => [
        ...m,
        { id: newId(), role: "assistant", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 50,
          padding: "0.6rem 1rem",
          borderRadius: 999,
          border: "none",
          background: "#111827",
          color: "white",
          fontSize: 14,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        ✨ Edit with AI
      </button>
    );
  }

  return (
    <aside style={panel} aria-label="AI editor">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid #eee",
        }}
      >
        <strong style={{ fontSize: 14 }}>✨ Edit with AI</strong>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close AI editor"
          style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18 }}
        >
          ×
        </button>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {messages.map((m) => (
          <div key={m.id} style={bubble(m.role)}>
            {m.text}
          </div>
        ))}
        {pending && <div style={bubble("assistant")}>…</div>}
      </div>

      <form
        onSubmit={onSubmit}
        style={{ display: "flex", gap: "0.5rem", padding: "0.75rem", borderTop: "1px solid #eee" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a change…"
          disabled={pending}
          style={{
            flex: 1,
            padding: "0.5rem 0.7rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: 8,
            border: "none",
            background: pending || !input.trim() ? "#9ca3af" : "#111827",
            color: "white",
            fontSize: 14,
            cursor: pending ? "default" : "pointer",
          }}
        >
          Send
        </button>
      </form>
    </aside>
  );
}
