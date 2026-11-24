import { beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "canal404:progress:v1";

type Store = typeof import("./store");

async function loadStore(saved?: unknown): Promise<Store> {
  vi.resetModules();
  if (saved !== undefined) window.localStorage.setItem(KEY, typeof saved === "string" ? saved : JSON.stringify(saved));
  return import("./store");
}

function stored() {
  return JSON.parse(window.localStorage.getItem(KEY) ?? "null");
}

describe("progress store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  describe("loading", () => {
    it("starts from the default state when nothing is saved", async () => {
      const store = await loadStore();
      expect(store.getSnapshot()).toEqual(store.DEFAULT_STATE);
    });

    it("merges a saved state over the defaults", async () => {
      const store = await loadStore({ version: 1, visits: 4, settings: { music: true }, secrets: { cat: 10 } });
      const state = store.getSnapshot();
      expect(state.visits).toBe(4);
      expect(state.settings).toEqual({ sfx: true, music: true, track: "theme" });
      expect(state.secrets).toEqual({ cat: 10 });
      expect(state.games).toEqual({});
    });

    it("ignores a save from another version", async () => {
      const store = await loadStore({ version: 2, visits: 9 });
      expect(store.getSnapshot()).toEqual(store.DEFAULT_STATE);
    });

    it("ignores a corrupted save", async () => {
      const store = await loadStore("{not json");
      expect(store.getSnapshot()).toEqual(store.DEFAULT_STATE);
    });

    it("backs up a corrupted save before it gets overwritten", async () => {
      const store = await loadStore("{not json");
      store.registerVisit();
      const backups = Object.keys(window.localStorage).filter((k) => k.startsWith(`${KEY}:backup:unreadable:`));
      expect(backups).toHaveLength(1);
      expect(window.localStorage.getItem(backups[0])).toBe("{not json");
      expect(stored().visits).toBe(1);
    });

    it("backs up a save from another version before it gets overwritten", async () => {
      const raw = JSON.stringify({ version: 2, visits: 9 });
      const store = await loadStore(raw);
      store.registerVisit();
      const backups = Object.keys(window.localStorage).filter((k) => k.startsWith(`${KEY}:backup:v2:`));
      expect(backups.map((k) => window.localStorage.getItem(k))).toEqual([raw]);
    });

    it("cleans up a damaged save without losing the valid parts", async () => {
      const store = await loadStore({
        version: 1,
        visits: "três",
        settings: { sfx: "sim", music: true },
        secrets: { cat: 5, ghost: 7, pizza: "ontem" },
        achievements: { "radio-on": 3, "no-such-thing": 1 },
        games: { "food-fight": { highScore: 900, plays: "x", levels: { a: { stars: 2 } } }, broken: 4 },
        counters: { tv: 2, bad: null },
      });
      const state = store.getSnapshot();
      expect(state.visits).toBe(0);
      expect(state.settings).toEqual({ sfx: true, music: true, track: "theme" });
      expect(state.secrets).toEqual({ cat: 5 });
      expect(state.achievements).toEqual({ "radio-on": 3 });
      expect(state.games).toEqual({ "food-fight": { highScore: 900, bestStars: 0, plays: 0, wins: 0, lastScore: 0, levels: { a: { stars: 2, score: 0 } } } });
      expect(state.counters).toEqual({ tv: 2 });
    });

    it("reloads and notifies when another tab changes the save", async () => {
      const store = await loadStore();
      const listener = vi.fn();
      store.subscribe(listener);
      window.localStorage.setItem(KEY, JSON.stringify({ version: 1, visits: 7 }));
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
      expect(listener).toHaveBeenCalledTimes(1);
      expect(store.getSnapshot().visits).toBe(7);
    });

    it("keeps what another tab saved when this tab changes the save", async () => {
      const store = await loadStore({ version: 1, visits: 3 });
      store.getSnapshot();
      window.localStorage.setItem(KEY, JSON.stringify({ version: 1, visits: 3, games: { "bad-ideas-lab": { highScore: 1450, bestStars: 3, plays: 1, wins: 1, lastScore: 1450, levels: { test: { stars: 3, score: 1450 } } } } }));
      store.recordGameStart("food-fight");
      expect(stored().games).toMatchObject({ "bad-ideas-lab": { levels: { test: { stars: 3 } } }, "food-fight": { plays: 1 } });
    });

    it("does not bring back a save that was cleared while the tab was open", async () => {
      const store = await loadStore({ version: 1, visits: 3, games: { "pajama-war": { highScore: 900, bestStars: 2, plays: 4, wins: 2, lastScore: 900 } } });
      store.getSnapshot();
      window.localStorage.clear();
      store.recordGameStart("food-fight");
      expect(Object.keys(stored().games)).toEqual(["food-fight"]);
    });
  });

  describe("game results", () => {
    it("keeps the best score and reports a new record", async () => {
      const store = await loadStore();
      expect(store.recordGameResult("food-fight", { score: 500, stars: 2, won: true }).isRecord).toBe(true);
      const second = store.recordGameResult("food-fight", { score: 300, stars: 3, won: true });
      expect(second.isRecord).toBe(false);
      expect(second.previousBest).toBe(500);
      expect(second.record).toMatchObject({ highScore: 500, bestStars: 3, wins: 2, lastScore: 300 });
    });
  });

  describe("level results", () => {
    it("keeps the best stars and score of each level and sums the totals", async () => {
      const store = await loadStore();
      store.recordLevelResult("bad-ideas-lab", "test", { score: 300, stars: 3, won: true });
      store.recordLevelResult("bad-ideas-lab", "pixel", { score: 200, stars: 1, won: true });
      const { record, isRecord } = store.recordLevelResult("bad-ideas-lab", "pixel", { score: 150, stars: 2, won: true });
      expect(isRecord).toBe(true);
      expect(record.levels).toEqual({ test: { stars: 3, score: 300 }, pixel: { stars: 2, score: 200 } });
      expect(record).toMatchObject({ highScore: 500, bestStars: 5, wins: 3, lastScore: 150 });
    });
  });

  describe("reset", () => {
    it("also erases game saves and backups but keeps other sites' data", async () => {
      const store = await loadStore({ version: 1, visits: 2 });
      window.localStorage.setItem("canal404:off-air-vacation:v1", "{}");
      window.localStorage.setItem("canal404:pajama-war:v1", "{}");
      window.localStorage.setItem(`${KEY}:backup:v1:1`, "{}");
      window.localStorage.setItem("canal404:sync:v1", JSON.stringify({ version: 1, player: "p" }));
      window.localStorage.setItem("outro-site", "fica");
      store.resetProgress();
      expect(Object.keys(window.localStorage).sort()).toEqual([KEY, "canal404:sync:v1", "outro-site"]);
    });

    it("erases games, secrets and counters but keeps the visitor, settings and first visit", async () => {
      const store = await loadStore({
        version: 1,
        visitorNumber: 84333,
        visits: 5,
        firstVisitAt: 10,
        lastVisitAt: 20,
        settings: { sfx: false, music: true, track: "lab" },
        secrets: { cat: 1 },
        achievements: { "first-visit": 1, "radio-on": 2 },
        games: { "food-fight": { highScore: 10, bestStars: 1, plays: 1, wins: 1, lastScore: 10 } },
        counters: { tv: 3 },
      });
      store.resetProgress();
      expect(store.getSnapshot()).toEqual({
        ...store.DEFAULT_STATE,
        visitorNumber: 84333,
        visits: 5,
        firstVisitAt: 10,
        lastVisitAt: 20,
        settings: { sfx: false, music: true, track: "lab" },
        achievements: { "first-visit": 1 },
      });
    });
  });

  describe("copy on the board", () => {
    const VACATION = "canal404:off-air-vacation:v1";
    const PAJAMA = "canal404:pajama-war:v1";
    const DERBY = "canal404:downhill-derby:v1";

    it("leaves the device's own keys and the backups out of the copy", async () => {
      const ls = window.localStorage;
      ls.setItem(KEY, JSON.stringify({ version: 1, visits: 2 }));
      ls.setItem(VACATION, JSON.stringify({ v: 1, area: "lobby" }));
      ls.setItem("canal404:outbox:v1", JSON.stringify({ version: 1, items: [] }));
      ls.setItem("canal404:talent-show:calibration:v1", "42");
      ls.setItem("canal404:sync:v1", JSON.stringify({ version: 1, player: "p" }));
      ls.setItem(`${KEY}:backup:v0:1`, "{}");
      ls.setItem("outro-site", "x");
      const { takeSnapshot } = await import("./snapshot");
      expect(Object.keys(takeSnapshot(ls).keys)).toEqual([VACATION, KEY].sort());
    });

    it("backs up the saves a restored copy replaces and keeps the device's own keys", async () => {
      const ls = window.localStorage;
      const mine = JSON.stringify({ version: 1, visits: 7, games: { "food-fight": { highScore: 90, bestStars: 1, plays: 1, wins: 1, lastScore: 90 } } });
      const pajama = JSON.stringify({ version: 1, matches: 4 });
      const outbox = JSON.stringify({ version: 1, items: [] });
      ls.setItem(KEY, mine);
      ls.setItem(PAJAMA, pajama);
      ls.setItem("canal404:outbox:v1", outbox);
      const theirs = JSON.stringify({ version: 1, visits: 30, secrets: { cat: 5 } });
      const derby = JSON.stringify({ version: 1, cart: "deco", ghost: false, unlocked: [], tracks: {} });
      const { applySnapshot } = await import("./snapshot");
      applySnapshot({ version: 1, keys: { [KEY]: theirs, [DERBY]: derby } }, ls);
      expect(ls.getItem(KEY)).toBe(theirs);
      expect(ls.getItem(DERBY)).toBe(derby);
      expect(ls.getItem(PAJAMA)).toBeNull();
      expect(ls.getItem("canal404:outbox:v1")).toBe(outbox);
      const backup = (key: string) => Object.keys(ls).filter((k) => k.startsWith(`${key}:backup:restore:`)).map((k) => ls.getItem(k));
      expect(backup(KEY)).toEqual([mine]);
      expect(backup(PAJAMA)).toEqual([pajama]);
      const store = await loadStore();
      expect(store.getSnapshot()).toMatchObject({ visits: 30, secrets: { cat: 5 }, games: {} });
    });

    it("leaves every save as it was when there is no room to back them up", async () => {
      const ls = window.localStorage;
      const mine = JSON.stringify({ version: 1, visits: 7 });
      const vacation = JSON.stringify({ v: 1, area: "beach" });
      ls.setItem(KEY, mine);
      ls.setItem(VACATION, vacation);
      const setItem = Storage.prototype.setItem;
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
        if (key.includes(":backup:")) throw new DOMException("full", "QuotaExceededError");
        setItem.call(this, key, value);
      });
      const { applySnapshot } = await import("./snapshot");
      expect(() => applySnapshot({ version: 1, keys: { [KEY]: JSON.stringify({ version: 1, visits: 30 }) } }, ls)).toThrow();
      expect(ls.getItem(KEY)).toBe(mine);
      expect(ls.getItem(VACATION)).toBe(vacation);
    });

    it("treats a browser with only tips and settings as empty", async () => {
      const { hasProgress } = await import("./snapshot");
      const flags = { "canal404:food-fight:v1": JSON.stringify({ v: 1, tutorialDone: true }), "canal404:talent-show:assist:v1": "0", [KEY]: JSON.stringify({ version: 1, visits: 2, achievements: { "first-visit": 1 } }) };
      expect(hasProgress({ version: 1, keys: flags })).toBe(false);
      expect(hasProgress({ version: 1, keys: { ...flags, [VACATION]: JSON.stringify({ v: 1, area: "beach" }) } })).toBe(true);
    });

    it("migrates an older save that arrives in a copy", async () => {
      const ls = window.localStorage;
      const old = JSON.stringify({ wins: { lia: 2 }, matches: 3, bestTime: 41 });
      const { applySnapshot } = await import("./snapshot");
      applySnapshot({ version: 1, keys: { [PAJAMA]: old } }, ls);
      const { loadStats } = await import("@/games/pajama-war/storage");
      expect(loadStats()).toMatchObject({ wins: { lia: 2, nico: 0, bia: 0 }, matches: 3, bestTime: 41 });
      expect(JSON.parse(ls.getItem(PAJAMA)!)).toMatchObject({ version: 1, matches: 3 });
      expect(Object.keys(ls).some((k) => k.startsWith(`${PAJAMA}:backup:v0:`))).toBe(true);
    });
  });
});
