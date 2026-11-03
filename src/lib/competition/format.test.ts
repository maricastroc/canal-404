import { describe, expect, it } from "vitest";
import { formatBest, formatDuration, ordinal } from "./format";

describe("competition formatting", () => {
  it("formats durations for short and long runs", () => {
    expect(formatDuration(9_400)).toBe("9s");
    expect(formatDuration(65_000)).toBe("1min 05s");
    expect(formatDuration(3_725_000)).toBe("1h 02min");
  });

  it("describes the best result with each game's own metrics", () => {
    expect(formatBest("bad-ideas-lab", [1, 312])).toBe("1 peça · 312 passos");
    expect(formatBest("dead-end-street", [2150, 4])).toBe("2.150 pts · 4 lançamentos");
    expect(formatBest("operation-recess", [0, 83_000, 2900])).toBe("0 batidas · 1min 23s");
    expect(formatBest("pajama-war", [9, 51_000, 12])).toBe("9 de energia · 51s");
  });

  it("writes Brazilian ordinals", () => {
    expect(ordinal(3)).toBe("3º");
    expect(ordinal(1204)).toBe("1.204º");
  });
});
