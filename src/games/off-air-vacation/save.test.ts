import { describe, expect, it } from "vitest";
import { SAVE_KEY } from "./config";
import { ALL_FOLKS, ALL_ITEMS, clearState, freshState, loadState, saveState } from "./save";
import { ITEM_INFO, SPEAKERS } from "./story";

const backups = () => Object.keys(window.localStorage).filter((k) => k.startsWith(`${SAVE_KEY}:backup:`));

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

  it("keeps a copy of a save it cannot read", () => {
    const future = JSON.stringify({ v: 2, area: "beach" });
    window.localStorage.setItem(SAVE_KEY, future);
    expect(loadState()).toBeNull();
    expect(backups().map((k) => window.localStorage.getItem(k))).toEqual([future]);
    expect(window.localStorage.getItem(SAVE_KEY)).toBe(future);
  });

  it("drops unknown values instead of trusting them", () => {
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ v: 1, area: "moon", x: 50, items: ["remote", "laser", "remote"], posters: ["surf", 3], flags: { tiltWon: true, bad: "yes" }, ending: "maybe", facing: -1 }),
    );
    expect(loadState()).toEqual({ ...freshState(), items: ["remote"], posters: ["surf"], flags: { tiltWon: true }, facing: -1 });
  });

  it("knows every item and resident the story can hand out", () => {
    expect([...ALL_ITEMS].sort()).toEqual(Object.keys(ITEM_INFO).sort());
    const folks = Object.keys(SPEAKERS).filter((k) => k !== "deco" && k !== "narrator");
    expect([...ALL_FOLKS].sort()).toEqual(folks.sort());
  });

  it("clears the save for a new adventure", () => {
    saveState(freshState());
    clearState();
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
  });
});
