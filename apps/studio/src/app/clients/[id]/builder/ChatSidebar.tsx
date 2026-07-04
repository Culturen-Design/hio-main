"use client";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@hio/ui";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

const newId = () => crypto.randomUUID();

type CommandResponse = { ok: boolean; message: string; tool?: string };

const panel =
  "fixed top-0 right-0 bottom-0 z-50 flex w-[340px] flex-col border-[#e5e7eb] border-l bg-background shadow-[-8px_0_24px_rgba(0,0,0,0.04)]";

const bubble = (role: ChatMessage["role"]) =>
  cn(
    "max-w-[85%] whitespace-pre-wrap rounded-xl px-[0.7rem] py-2 text-sm leading-[1.4]",
    role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted",
  );

/**
 * Floating AI editor for the per-client builder. Sends the prompt + the client's
 * tenant/site ids to the shared `ai-command` edge function — which resolves this
 * client's per-client provider and membership-gates the edit — then refreshes the
 * server components when an edit lands so the canvas updates. Same engine as
 * Self-Serve; the function picks the provider by request shape.
 */
export function ChatSidebar({ tenantId, siteId }: { tenantId: string; siteId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Tell me what to change — e.g. “make the headline say Welcome to Acme”.",
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
        body: { prompt, tenant_id: tenantId, site_id: siteId },
      });

      let reply: string;
      let applied = false;
      if (error) {
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
        className="fixed right-5 bottom-5 z-50 cursor-pointer rounded-full border-none bg-primary px-4 py-[0.6rem] text-primary-foreground text-sm shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
      >
        ✨ Edit with AI
      </button>
    );
  }

  return (
    <aside className={panel} aria-label="AI editor">
      <header className="flex items-center justify-between border-[#eee] border-b px-4 py-3">
        <strong className="text-sm">✨ Edit with AI</strong>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close AI editor"
          className="cursor-pointer border-none bg-transparent text-lg"
        >
          ×
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={bubble(m.role)}>
            {m.text}
          </div>
        ))}
        {pending && <div className={bubble("assistant")}>…</div>}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 border-[#eee] border-t px-3 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a change…"
          disabled={pending}
          className="flex-1 rounded-lg border border-border px-[0.7rem] py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className={cn(
            "cursor-pointer rounded-lg border-none px-3.5 py-2 text-primary-foreground text-sm",
            pending || !input.trim() ? "bg-muted-foreground" : "cursor-pointer bg-primary",
          )}
        >
          Send
        </button>
      </form>
    </aside>
  );
}
