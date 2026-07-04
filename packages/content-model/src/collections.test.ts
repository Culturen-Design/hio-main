import { describe, expect, it } from "vitest";
import { appendCollectionItem, removeCollectionItem, updateCollectionItem } from "./collections";

type Item = { id: string; name: string; note?: string };
const items: Item[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
];

describe("appendCollectionItem", () => {
  it("appends with a generated id", () => {
    const next = appendCollectionItem(items, { name: "Gamma" }, () => "gen-id");
    expect(next).toEqual([...items, { id: "gen-id", name: "Gamma" }]);
  });

  it("appends to an empty array", () => {
    expect(appendCollectionItem<Item>([], { name: "Solo" }, () => "x")).toEqual([
      { id: "x", name: "Solo" },
    ]);
  });

  it("does not mutate the input array", () => {
    const copy = [...items];
    appendCollectionItem(items, { name: "Gamma" }, () => "x");
    expect(items).toEqual(copy);
  });

  it("defaults to crypto.randomUUID when no genId is given", () => {
    const next = appendCollectionItem(items, { name: "Gamma" });
    expect(next.at(-1)?.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("updateCollectionItem", () => {
  it("patches the matching item by id (partial merge)", () => {
    const res = updateCollectionItem(items, "b", { note: "updated" });
    expect(res).toEqual({ ok: true, items: [items[0], { ...items[1], note: "updated" }] });
  });

  it("returns ok:false for an unknown id", () => {
    expect(updateCollectionItem(items, "zzz", { name: "X" })).toEqual({
      ok: false,
      error: "Item not found.",
    });
  });

  it("returns ok:false for an empty array", () => {
    expect(updateCollectionItem<Item>([], "a", { name: "X" })).toEqual({
      ok: false,
      error: "Item not found.",
    });
  });

  it("does not mutate the input array", () => {
    const copy = [...items];
    updateCollectionItem(items, "b", { note: "updated" });
    expect(items).toEqual(copy);
  });
});

describe("removeCollectionItem", () => {
  const alpha: Item = { id: "a", name: "Alpha" };
  const beta: Item = { id: "b", name: "Beta" };

  it("removes the matching item by id", () => {
    expect(removeCollectionItem(items, "a")).toEqual({ ok: true, items: [beta] });
  });

  it("returns ok:false for an unknown id (length unchanged)", () => {
    expect(removeCollectionItem(items, "zzz")).toEqual({ ok: false, error: "Item not found." });
  });

  it("returns ok:false for an empty array", () => {
    expect(removeCollectionItem<Item>([], "a")).toEqual({ ok: false, error: "Item not found." });
  });

  it("removing the last item yields an empty array", () => {
    expect(removeCollectionItem([alpha], "a")).toEqual({ ok: true, items: [] });
  });
});
