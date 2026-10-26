import { describe, expect, it } from "vitest";
import { SAVE_KEY } from "./config";
import { clearState, freshState, loadState, saveState } from "./save";

describe("Férias Fora do Ar save", () => {
  it("starts in the lobby with nothing collected", () => {
    expect(freshState()).toMatchObject({ v: 1, area: "lobby", items: [], posters: [], tokens: [], secrets: [], ending: null });
  });

  it("returns a new object every time", () => {
    const a = freshState();
    a.items.push("net");
    expect(freshState().items).toEqual([]);
  });

  it("has no save before the first game", () => {
    expect(loadState()).toBeNull();
  });

  it("saves and loads the adventure", () => {
    const s = { ...freshState(), area: "beach" as const, items: ["remote" as const], flags: { tiltWon: true } };
    saveState(s);
    expect(loadState()).toEqual(s);
  });

  it("fills fields added after the save was made", () => {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, area: "pool", items: ["net"] }));
    expect(loadState()).toEqual({ ...freshState(), area: "pool", items: ["net"] });
  });

  it("ignores saves from another version or corrupted saves", () => {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, area: "pool" }));
    expect(loadState()).toBeNull();
    window.localStorage.setItem(SAVE_KEY, "{");
    expect(loadState()).toBeNull();
  });

  it("clears the save for a new adventure", () => {
    saveState(freshState());
    clearState();
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
  });
});
