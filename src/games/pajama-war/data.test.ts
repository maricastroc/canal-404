import { describe, expect, it } from "vitest";
import { ARENAS } from "./arenas";
import { KIDS, STATS } from "./config";
import { loadStats, saveStats } from "./storage";

const KEY = "canal404:pajama-war:v1";

describe("Guerra do Pijama kids", () => {
  it("make Lia the fastest, Nico the quickest thrower and Bia the quickest to recover", () => {
    const by = (pick: (id: (typeof KIDS)[number]) => number) => [...KIDS].sort((a, b) => pick(a) - pick(b));
    expect(by((k) => -STATS[k].speed)[0]).toBe("lia");
    expect(by((k) => STATS[k].cooldown)[0]).toBe("nico");
    expect(by((k) => STATS[k].regenDelay)[0]).toBe("bia");
  });
});

describe("Guerra do Pijama arenas", () => {
  it("unlock from the bedroom to the backyard", () => {
    expect(ARENAS.map((a) => a.id)).toEqual(["bedroom", "living", "yard"]);
  });

  it("get harder in each arena", () => {
    ARENAS.slice(1).forEach((a, i) => expect(a.ai, a.id).toBeGreaterThan(ARENAS[i].ai));
  });

  it("spawn the three kids inside the playable area", () => {
    for (const a of ARENAS) {
      expect(a.spawns, a.id).toHaveLength(3);
      for (const [x, y] of a.spawns) {
        expect(x, a.id).toBeGreaterThan(a.bounds.x0);
        expect(x, a.id).toBeLessThan(a.bounds.x1);
        expect(y, a.id).toBeGreaterThan(a.bounds.y0);
        expect(y, a.id).toBeLessThan(a.bounds.y1);
      }
    }
  });

  it("do not spawn kids inside furniture", () => {
    for (const a of ARENAS) {
      for (const p of a.props.filter((x) => x.block)) {
        const b = p.block!;
        const cy = p.y + (b.dy ?? 0);
        for (const [x, y] of a.spawns) {
          const inside = Math.abs(x - p.x) < b.w / 2 && Math.abs(y - cy) < b.h / 2;
          expect(inside, `${a.id}: spawn ${x},${y} inside ${p.key}`).toBe(false);
        }
      }
    }
  });
});

describe("Guerra do Pijama stats", () => {
  it("start empty", () => {
    expect(loadStats()).toEqual({ wins: { lia: 0, nico: 0, bia: 0 }, matches: 0, bestTime: 0, lastKid: null });
  });

  it("save and load wins per kid", () => {
    saveStats({ wins: { lia: 2, nico: 0, bia: 1 }, matches: 5, bestTime: 61000, lastKid: "bia" });
    expect(loadStats()).toEqual({ wins: { lia: 2, nico: 0, bia: 1 }, matches: 5, bestTime: 61000, lastKid: "bia" });
  });

  it("fill missing fields from older saves", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ wins: { nico: 3 } }));
    expect(loadStats()).toEqual({ wins: { lia: 0, nico: 3, bia: 0 }, matches: 0, bestTime: 0, lastKid: null });
  });

  it("recover from a corrupted save", () => {
    window.localStorage.setItem(KEY, "oops");
    expect(loadStats().matches).toBe(0);
  });

  it("never share the empty record between loads", () => {
    loadStats().wins.lia = 9;
    expect(loadStats().wins.lia).toBe(0);
  });
});
