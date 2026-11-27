import { describe, expect, it } from "vitest";
import { loadSave, writeSave } from "./save";

const KEY = "canal404:food-fight:v1";

describe("Guerra de Lanche save", () => {
  it("save and load the tutorial flags and the challenges", () => {
    writeSave({ tutorialDone: true, catchLessons: 2, feats: ["spotless"], returned: ["cap", "big"] });
    expect(loadSave()).toEqual({ tutorialDone: true, catchDone: false, catchLessons: 2, feats: ["spotless"], returned: ["cap", "big"] });
  });

  it("keep the flags of a save written before the challenges", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ v: 1, tutorialDone: true, catchDone: true, catchLessons: 1 }));
    expect(loadSave()).toEqual({ tutorialDone: true, catchDone: true, catchLessons: 1, feats: [], returned: [] });
    writeSave({ feats: ["brawl"] });
    expect(loadSave()).toMatchObject({ tutorialDone: true, catchDone: true, feats: ["brawl"] });
  });

  it("drop challenges and kids the game does not know", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ v: 1, feats: ["cook", "spotless", "nope", "spotless"], returned: ["speedy", "teacher"], catchLessons: "3" }));
    expect(loadSave()).toMatchObject({ feats: ["spotless"], returned: ["speedy"], catchLessons: 0 });
  });

  it("back up a save from a newer version before replacing it", () => {
    const newer = JSON.stringify({ v: 2, tutorialDone: true, feats: ["spotless"] });
    window.localStorage.setItem(KEY, newer);
    expect(loadSave().feats).toEqual([]);
    expect(window.localStorage.getItem(KEY)).toBe(newer);
    const backups = Object.keys(window.localStorage).filter((k) => k.startsWith(`${KEY}:backup:v2:`));
    expect(backups.map((k) => window.localStorage.getItem(k))).toEqual([newer]);
  });
});
