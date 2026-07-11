import { describe, expect, it } from "vitest";
import {
  CHAT_HISTORY_CAP,
  capMessages,
  parseChatHistory,
  serializeChatHistory,
} from "./chatHistory";

const msg = (i: number, role: "user" | "assistant" = "user") => ({
  id: String(i),
  role,
  text: `message ${i}`,
});

describe("capMessages", () => {
  it("keeps a short history intact", () => {
    const messages = [msg(1), msg(2)];
    expect(capMessages(messages)).toEqual(messages);
  });

  it("drops the OLDEST messages past the cap", () => {
    const messages = Array.from({ length: CHAT_HISTORY_CAP + 10 }, (_, i) => msg(i));
    const capped = capMessages(messages);
    expect(capped).toHaveLength(CHAT_HISTORY_CAP);
    expect(capped[0]).toEqual(msg(10));
    expect(capped.at(-1)).toEqual(msg(CHAT_HISTORY_CAP + 9));
  });
});

describe("serialize/parse round trip", () => {
  it("round-trips messages including the error flag", () => {
    const messages = [msg(1), { id: "2", role: "assistant" as const, text: "nope", error: true }];
    expect(parseChatHistory(serializeChatHistory(messages))).toEqual(messages);
  });

  it("caps on serialize so storage never grows unbounded", () => {
    const messages = Array.from({ length: 80 }, (_, i) => msg(i));
    expect(parseChatHistory(serializeChatHistory(messages))).toHaveLength(CHAT_HISTORY_CAP);
  });
});

describe("parseChatHistory hardening", () => {
  it("returns [] for null, garbage, and non-array JSON", () => {
    expect(parseChatHistory(null)).toEqual([]);
    expect(parseChatHistory("not json{")).toEqual([]);
    expect(parseChatHistory('{"a":1}')).toEqual([]);
  });

  it("drops entries with a wrong shape but keeps valid ones", () => {
    const raw = JSON.stringify([
      msg(1),
      { id: 2, role: "user", text: "numeric id" },
      { id: "3", role: "robot", text: "bad role" },
      { id: "4", role: "assistant" },
      msg(5, "assistant"),
      null,
    ]);
    expect(parseChatHistory(raw)).toEqual([msg(1), msg(5, "assistant")]);
  });
});
