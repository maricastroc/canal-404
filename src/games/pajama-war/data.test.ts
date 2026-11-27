import { describe, expect, it } from "vitest";
import { loadStats, saveStats } from "./storage";

const KEY = "canal404:pajama-war:v1";

describe("Guerra do Pijama stats", () => {
  it("save and load wins per kid and arena challenges", () => {
    const stats = { wins: { lia: 2, nico: 0, bia: 1 }, matches: 5, bestTime: 61000, lastKid: "bia" as const, hints: ["ricochet" as const], feats: { living: ["bank" as const] }, wonWith: { bedroom: ["lia" as const, "bia" as const] } };
    saveStats(stats);
    expect(loadStats()).toEqual(stats);
  });

  it("drop challenges that do not belong to their arena", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, feats: { bedroom: ["dodges", "bank", "nope"], living: "bank", moon: ["streak"] }, wonWith: { attic: ["nico", "zed", "nico"], yard: [] } }));
    const stats = loadStats();
    expect(stats.feats).toEqual({ bedroom: ["dodges"] });
    expect(stats.wonWith).toEqual({ attic: ["nico"] });
  });

  it("fill missing fields from older saves", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ wins: { nico: 3 } }));
    expect(loadStats()).toEqual({ wins: { lia: 0, nico: 3, bia: 0 }, matches: 0, bestTime: 0, lastKid: null, hints: [], feats: {}, wonWith: {} });
  });

  it("upgrade a save written before versions existed", () => {
    const old = JSON.stringify({ wins: { lia: 4 }, matches: 6, lastKid: "lia" });
    window.localStorage.setItem(KEY, old);
    expect(loadStats()).toEqual({ wins: { lia: 4, nico: 0, bia: 0 }, matches: 6, bestTime: 0, lastKid: "lia", hints: [], feats: {}, wonWith: {} });
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toMatchObject({ version: 1, matches: 6 });
    const backups = Object.keys(window.localStorage).filter((k) => k.startsWith(`${KEY}:backup:v0:`));
    expect(backups.map((k) => window.localStorage.getItem(k))).toEqual([old]);
  });

  it("recover from a corrupted save", () => {
    window.localStorage.setItem(KEY, "oops");
    expect(loadStats().matches).toBe(0);
  });

  it("never share the empty record between loads", () => {
    loadStats().wins.lia = 9;
    expect(loadStats().wins.lia).toBe(0);
  });

  it("never share challenge lists between loads", () => {
    saveStats({ ...loadStats(), feats: { yard: ["grabs"] } });
    loadStats().feats.yard!.push("giantKo");
    expect(loadStats().feats.yard).toEqual(["grabs"]);
  });
});
