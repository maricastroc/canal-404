import { describe, expect, it } from "vitest";
import { SAVE_KEY } from "./config";
import { clearState, endingUnreported, freshState, loadState, saveState } from "./save";

const backups = () => Object.keys(window.localStorage).filter((k) => k.startsWith(`${SAVE_KEY}:backup:`));

describe("Férias Fora do Ar save", () => {
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

  it("remembers an ending whose result was never sent", () => {
    saveState({ ...freshState(), ending: "off", flags: { ended: true, resultPending: true } });
    const pending = loadState()!;
    expect(pending.ending).toBe("off");
    expect(endingUnreported(pending, 2150)).toBe(true);
    saveState({ ...pending, flags: { ended: true, resultPending: false } });
    expect(endingUnreported(loadState()!, 0)).toBe(false);
    expect(endingUnreported(freshState(), 0)).toBe(false);
  });

  it("sends the ending of an older save only if the portal never recorded one", () => {
    const older = { ...freshState(), flags: { ended: true } };
    expect(endingUnreported(older, 0)).toBe(true);
    expect(endingUnreported(older, 2150)).toBe(false);
  });

  it("clears the save for a new adventure", () => {
    saveState(freshState());
    clearState();
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
  });
});
