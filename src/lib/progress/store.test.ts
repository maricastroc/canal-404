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

    it("serves the default state on the server", async () => {
      const store = await loadStore({ version: 1, visits: 4 });
      expect(store.getServerSnapshot()).toBe(store.DEFAULT_STATE);
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

    it("ignores storage events for other keys", async () => {
      const store = await loadStore();
      const listener = vi.fn();
      store.subscribe(listener);
      window.dispatchEvent(new StorageEvent("storage", { key: "other" }));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("visits", () => {
    it("counts the first visit, picks a visitor number and unlocks the first achievement", async () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const store = await loadStore();
      const state = store.registerVisit();
      expect(state.visits).toBe(1);
      expect(state.visitorNumber).toBe(84201 + 190);
      expect(state.firstVisitAt).not.toBeNull();
      expect(state.achievements["first-visit"]).toBeTypeOf("number");
      const { achievementById } = await import("./definitions");
      expect(store.getToasts()).toEqual([expect.objectContaining({ kind: "achievement", title: achievementById("first-visit")?.title })]);
      expect(stored().visits).toBe(1);
    });

    it("counts only one visit per browser session", async () => {
      const store = await loadStore();
      store.registerVisit();
      store.registerVisit();
      expect(store.getSnapshot().visits).toBe(1);
    });

    it("keeps the visitor number and first visit on later sessions", async () => {
      const store = await loadStore({ version: 1, visits: 3, visitorNumber: 84300, firstVisitAt: 123, achievements: { "first-visit": 1 } });
      const state = store.registerVisit();
      expect(state.visits).toBe(4);
      expect(state.visitorNumber).toBe(84300);
      expect(state.firstVisitAt).toBe(123);
      expect(store.getToasts()).toEqual([]);
    });
  });

  describe("secrets and achievements", () => {
    it("unlocks an achievement only once", async () => {
      const store = await loadStore();
      expect(store.unlockAchievement("radio-on")).toBe(true);
      expect(store.unlockAchievement("radio-on")).toBe(false);
      expect(store.getToasts()).toHaveLength(1);
    });

    it("unlocks a secret only once and shows a toast", async () => {
      const store = await loadStore();
      expect(store.unlockSecret("cat")).toBe(true);
      expect(store.unlockSecret("cat")).toBe(false);
      const { secretById } = await import("./definitions");
      expect(store.getToasts()).toEqual([expect.objectContaining({ kind: "secret", title: secretById("cat")?.title })]);
    });

    it("gives the explorer achievement on the third secret", async () => {
      const store = await loadStore();
      store.unlockSecret("cat");
      store.unlockSecret("pizza");
      expect(store.getSnapshot().achievements.explorer).toBeUndefined();
      store.unlockSecret("plane");
      expect(store.getSnapshot().achievements.explorer).toBeTypeOf("number");
      expect(store.getSnapshot().achievements["secret-hunter"]).toBeUndefined();
    });

    it("gives the secret hunter achievement when every secret is found", async () => {
      const store = await loadStore();
      const { SECRET_IDS } = await import("./definitions");
      SECRET_IDS.forEach((id) => store.unlockSecret(id));
      expect(Object.keys(store.getSnapshot().secrets)).toHaveLength(store.TOTAL_SECRETS);
      expect(store.getSnapshot().achievements["secret-hunter"]).toBeTypeOf("number");
    });

    it("notifies subscribers and stops after unsubscribing", async () => {
      const store = await loadStore();
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      store.unlockAchievement("radio-on");
      expect(listener).toHaveBeenCalled();
      listener.mockClear();
      unsubscribe();
      store.unlockAchievement("channel-surfer");
      expect(listener).not.toHaveBeenCalled();
    });

    it("dismisses toasts by id", async () => {
      const store = await loadStore();
      store.pushToast({ kind: "info", title: "A", description: "" });
      store.pushToast({ kind: "info", title: "B", description: "" });
      const [first, second] = store.getToasts();
      store.dismissToast(first.id);
      expect(store.getToasts()).toEqual([second]);
    });
  });

  describe("game results", () => {
    it("counts plays", async () => {
      const store = await loadStore();
      store.recordGameStart("food-fight");
      store.recordGameStart("food-fight");
      expect(store.getGameRecord("food-fight").plays).toBe(2);
    });

    it("keeps the best score and reports a new record", async () => {
      const store = await loadStore();
      expect(store.recordGameResult("food-fight", { score: 500, stars: 2, won: true }).isRecord).toBe(true);
      const second = store.recordGameResult("food-fight", { score: 300, stars: 3, won: true });
      expect(second.isRecord).toBe(false);
      expect(second.previousBest).toBe(500);
      expect(second.record).toMatchObject({ highScore: 500, bestStars: 3, wins: 2, lastScore: 300 });
    });

    it("does not give stars for a lost match", async () => {
      const store = await loadStore();
      const { record } = store.recordGameResult("dead-end-street", { score: 900, stars: 3, won: false });
      expect(record).toMatchObject({ highScore: 900, bestStars: 0, wins: 0 });
    });

    it("never reports a zero score as a record", async () => {
      const store = await loadStore();
      expect(store.recordGameResult("pajama-war", { score: 0, stars: 0, won: false }).isRecord).toBe(false);
    });

    it("returns an empty record for a game never played", async () => {
      const store = await loadStore();
      expect(store.getGameRecord("bad-ideas-lab")).toEqual({ highScore: 0, bestStars: 0, plays: 0, wins: 0, lastScore: 0 });
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

    it("does not save a lost level", async () => {
      const store = await loadStore();
      const { record, isRecord } = store.recordLevelResult("bad-ideas-lab", "test", { score: 0, stars: 0, won: false });
      expect(isRecord).toBe(false);
      expect(record.levels).toEqual({});
      expect(record.wins).toBe(0);
    });

    it("does not report a record when the level was not improved", async () => {
      const store = await loadStore();
      store.recordLevelResult("pajama-war", "bedroom", { score: 900, stars: 3, won: true });
      expect(store.recordLevelResult("pajama-war", "bedroom", { score: 800, stars: 2, won: true }).isRecord).toBe(false);
    });
  });

  describe("counters and settings", () => {
    it("bumps and sets counters", async () => {
      const store = await loadStore();
      expect(store.bumpCounter("tv")).toBe(1);
      expect(store.bumpCounter("tv", 3)).toBe(4);
      store.setCounter("tv", 0);
      expect(store.getSnapshot().counters.tv).toBe(0);
    });

    it("saves settings", async () => {
      const store = await loadStore();
      store.setSetting("music", true);
      store.setSetting("track", "lab");
      expect(stored().settings).toEqual({ sfx: true, music: true, track: "lab" });
    });
  });

  describe("reset", () => {
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
});
