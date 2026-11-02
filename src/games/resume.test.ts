import { describe, expect, it } from "vitest";
import { SAVE_KEY } from "./off-air-vacation/config";
import { freshState } from "./off-air-vacation/save";
import { canResume } from "./resume";

describe("canResume", () => {
  it("offers to continue a Férias adventure only when the save can be loaded", () => {
    expect(canResume("off-air-vacation", SAVE_KEY)).toBe(false);
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 99, area: "beach" }));
    expect(canResume("off-air-vacation", SAVE_KEY)).toBe(false);
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(freshState()));
    expect(canResume("off-air-vacation", SAVE_KEY)).toBe(true);
  });

  it("falls back to the presence of the key for other games", () => {
    expect(canResume("other", "canal404:other:v1")).toBe(false);
    window.localStorage.setItem("canal404:other:v1", "{}");
    expect(canResume("other", "canal404:other:v1")).toBe(true);
  });
});
