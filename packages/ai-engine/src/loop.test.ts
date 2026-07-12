import { selfServeSchema } from "@hio/content-model";
import { describe, expect, it } from "vitest";
import {
  type ConversationMessage,
  MAX_TOOL_ITERATIONS,
  type ModelResponse,
  type SectionRecord,
  type SectionStore,
  runToolLoop,
  trimHistoryForModel,
} from "./index";

const HERO_ID = "11111111-1111-1111-1111-111111111111";

const baseSections = (): SectionRecord[] => [
  {
    id: HERO_ID,
    type: "hero",
    content: { headline: "Old headline" },
  },
];

/** A model that plays back scripted responses, recording what it was sent. */
function scriptedModel(script: ModelResponse[]) {
  const calls: ConversationMessage[][] = [];
  let i = 0;
  return {
    calls,
    callModel: async (messages: ConversationMessage[]) => {
      calls.push(messages.map((m) => ({ ...m })));
      const response = script[Math.min(i, script.length - 1)];
      if (!response) throw new Error("scripted model called with an empty script");
      i++;
      return response;
    },
  };
}

function memoryStore(sections: SectionRecord[]): SectionStore {
  return {
    async updateContent(sectionId, content) {
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return false;
      section.content = content;
      return true;
    },
    async insertSection(type, content) {
      sections.push({ id: crypto.randomUUID(), type, content });
      return true;
    },
    async deleteSection(sectionId) {
      const index = sections.findIndex((s) => s.id === sectionId);
      if (index === -1) return false;
      sections.splice(index, 1);
      return true;
    },
  };
}

const updateHero = (id: string, headline: string) => ({
  type: "tool_use" as const,
  id,
  name: "update_module_content",
  input: { section_id: HERO_ID, updates: { headline } },
});

describe("runToolLoop", () => {
  it("text-only response ends the loop with no edits", async () => {
    const sections = baseSections();
    const model = scriptedModel([
      { content: [{ type: "text", text: "Which section did you mean?" }] },
    ]);
    const result = await runToolLoop({
      provider: selfServeSchema,
      callModel: model.callModel,
      prompt: "change it",
      loadSections: async () => sections,
      store: memoryStore(sections),
    });
    expect(result.reply).toBe("Which section did you mean?");
    expect(result.applied).toBe(false);
    expect(result.edits).toEqual([]);
    expect(result.iterations).toBe(1);
    // transcript = the prompt + the assistant reply
    expect(result.transcript).toHaveLength(2);
  });

  it("executes a tool, feeds the result back, and returns the closing summary", async () => {
    const sections = baseSections();
    const model = scriptedModel([
      { content: [updateHero("tu_1", "New headline")] },
      { content: [{ type: "text", text: "Updated your hero headline." }] },
    ]);
    const result = await runToolLoop({
      provider: selfServeSchema,
      callModel: model.callModel,
      prompt: "make the headline say New headline",
      loadSections: async () => sections,
      store: memoryStore(sections),
    });

    expect(result.applied).toBe(true);
    expect(result.edits).toEqual([
      { tool: "update_module_content", sectionId: HERO_ID, undoVersionId: null },
    ]);
    expect(result.reply).toBe("Updated your hero headline.");
    expect(sections[0]?.content).toMatchObject({ headline: "New headline" });

    // Second model call must include the assistant tool_use and our tool_result.
    const secondCall = model.calls[1];
    const last = secondCall?.at(-1);
    expect(last?.role).toBe("user");
    expect(Array.isArray(last?.content) && last.content[0]).toMatchObject({
      type: "tool_result",
      tool_use_id: "tu_1",
    });
  });

  it("completes multi-step requests across iterations", async () => {
    const sections = baseSections();
    const model = scriptedModel([
      { content: [updateHero("tu_1", "Step one")] },
      { content: [updateHero("tu_2", "Step two")] },
      { content: [{ type: "text", text: "Both done." }] },
    ]);
    const result = await runToolLoop({
      provider: selfServeSchema,
      callModel: model.callModel,
      prompt: "do two things",
      loadSections: async () => sections,
      store: memoryStore(sections),
    });
    expect(result.edits).toHaveLength(2);
    expect(result.iterations).toBe(3);
    expect(sections[0]?.content).toMatchObject({ headline: "Step two" });
  });

  it("reports a failed tool as an error result the model can react to", async () => {
    const sections = baseSections();
    const model = scriptedModel([
      {
        content: [
          {
            type: "tool_use",
            id: "tu_bad",
            name: "update_module_content",
            input: { section_id: "missing", updates: { headline: "x" } },
          },
        ],
      },
      { content: [{ type: "text", text: "That section doesn't exist." }] },
    ]);
    const result = await runToolLoop({
      provider: selfServeSchema,
      callModel: model.callModel,
      prompt: "edit something missing",
      loadSections: async () => sections,
      store: memoryStore(sections),
    });
    expect(result.applied).toBe(false);
    const toolResultMsg = result.transcript.find(
      (m) => m.role === "user" && Array.isArray(m.content),
    );
    expect(Array.isArray(toolResultMsg?.content) && toolResultMsg.content[0]).toMatchObject({
      is_error: true,
    });
  });

  it("stops at the iteration cap even if the model keeps calling tools", async () => {
    const sections = baseSections();
    const model = scriptedModel([{ content: [updateHero("tu_n", "Again")] }]);
    const result = await runToolLoop({
      provider: selfServeSchema,
      callModel: model.callModel,
      prompt: "loop forever",
      loadSections: async () => sections,
      store: memoryStore(sections),
    });
    expect(result.iterations).toBe(MAX_TOOL_ITERATIONS);
    expect(result.applied).toBe(true);
    expect(result.reply).toBe("Done — applied your changes.");
  });

  it("attaches the beforeEdit hook's snapshot id to each applied edit", async () => {
    const sections = baseSections();
    const model = scriptedModel([
      { content: [updateHero("tu_1", "Snap")] },
      { content: [{ type: "text", text: "Done." }] },
    ]);
    const result = await runToolLoop({
      provider: selfServeSchema,
      callModel: model.callModel,
      prompt: "edit with snapshot",
      loadSections: async () => sections,
      store: memoryStore(sections),
      beforeEdit: async () => "version-123",
    });
    expect(result.edits[0]).toMatchObject({ undoVersionId: "version-123" });
  });
});

describe("trimHistoryForModel", () => {
  const user = (text: string): ConversationMessage => ({ role: "user", content: text });
  const assistant = (text: string): ConversationMessage => ({
    role: "assistant",
    content: [{ type: "text", text }],
  });
  const toolResults = (): ConversationMessage => ({
    role: "user",
    content: [{ type: "tool_result", tool_use_id: "tu_1", content: "ok" }],
  });

  it("keeps a short transcript intact", () => {
    const history = [user("a"), assistant("b")];
    expect(trimHistoryForModel(history)).toEqual(history);
  });

  it("caps to the most recent messages", () => {
    const history: ConversationMessage[] = [];
    for (let i = 0; i < 30; i++) {
      history.push(user(`prompt ${i}`), assistant(`reply ${i}`));
    }
    const trimmed = trimHistoryForModel(history, 10);
    expect(trimmed.length).toBeLessThanOrEqual(10);
    expect(trimmed[0]).toEqual(user("prompt 25"));
  });

  it("never opens the window on an assistant or tool_result message", () => {
    const history = [assistant("orphan"), toolResults(), user("real prompt"), assistant("reply")];
    expect(trimHistoryForModel(history)[0]).toEqual(user("real prompt"));
  });

  it("returns [] when no valid opening prompt remains", () => {
    expect(trimHistoryForModel([assistant("only")])).toEqual([]);
  });
});
