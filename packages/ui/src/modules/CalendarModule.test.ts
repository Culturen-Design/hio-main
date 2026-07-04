import { describe, expect, it } from "vitest";
import { splitDate } from "./CalendarModule";

describe("splitDate", () => {
  it("splits a valid ISO date into day + uppercased month abbreviation", () => {
    const { day, month } = splitDate("2026-01-05");
    expect(day).toBe("5");
    expect(month).toBe("JAN");
  });

  it("pads nothing — day is a plain numeral, not zero-padded", () => {
    expect(splitDate("2026-12-01").day).toBe("1");
  });

  it("falls back to the raw string with an empty month for an invalid date", () => {
    expect(splitDate("not-a-date")).toEqual({ day: "not-a-date", month: "" });
  });
});
