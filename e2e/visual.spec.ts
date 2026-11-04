import { missionByKey } from "../src/lib/missions/catalog";
import { expect, test } from "./fixtures";

const NOW = new Date("2026-11-04T15:00:00-03:00");

const visitor = {
  version: 1,
  visitorNumber: 84404,
  visits: 4,
  firstVisitAt: NOW.getTime() - 86_400_000,
  lastVisitAt: NOW.getTime() - 3_600_000,
  settings: { sfx: false, music: false, track: "theme" },
  secrets: { pizza: 1 },
  achievements: { "first-visit": 1 },
  games: { "dead-end-street": { highScore: 1850, bestStars: 2, plays: 3, wins: 1, lastScore: 1850 } },
  counters: {},
};

const PAGES = [
  { path: "/", name: "room" },
  { path: "/games", name: "catalog" },
  { path: "/games/food-fight", name: "game-page" },
  { path: "/mission", name: "mission" },
  { path: "/records?game=bad-ideas-lab&level=pixel", name: "records" },
  { path: "/characters", name: "characters" },
  { path: "/extras", name: "extras" },
  { path: "/about", name: "about" },
];

const MEMBER = { id: "00000000-0000-4000-8000-000000000404", nickname: "Pato Veloz", tag: "0404", createdAt: "2026-10-23T15:00:00.000Z" };

const CHAMPIONS = ["Lina Turbo", "Zé Engenhoca", "Mila Chiclete", "Capitão Pudim", "Robô do Bairro", "Gato Pixel"];

function missionView(day: string, key: string) {
  const def = missionByKey(key)!;
  return { day, key, version: def.version, game: def.game, level: def.level, title: def.title, objective: def.objective, goal: def.goal, ranked: def.ranked, endsAt: "2026-11-05T03:00:00.000Z", closesAt: "2026-11-05T04:00:00.000Z" };
}

const MISSION = {
  now: NOW.toISOString(),
  completions: 23,
  leader: { nickname: "Lina Turbo", tag: "4270", metrics: [5, 181], you: false },
  mission: missionView("2026-11-04", "lab-finale-every-part"),
  you: { state: "started", attempts: 2, startedAt: "2026-11-04T17:40:00.000Z", completedAt: null, best: null, progress: { days: 6, streak: 2, bestStreak: 4, lastDay: "2026-11-03" } },
};

const HISTORY = {
  entries: [
    { mission: missionView("2026-11-03", "food-streak-eight"), you: { state: "completed", attempts: 3, startedAt: "2026-11-03T20:00:00.000Z", completedAt: "2026-11-03T20:12:00.000Z", best: { score: 9120, metrics: [9120, 1, 11], position: 4, total: 31, achievedAt: "2026-11-03T20:12:00.000Z" } } },
    { mission: missionView("2026-11-02", "lab-pixel-two-ramps"), you: { state: "completed", attempts: 1, startedAt: "2026-11-02T19:00:00.000Z", completedAt: "2026-11-02T19:03:00.000Z", best: { score: 1000, metrics: [2, 237], position: 1, total: 18, achievedAt: "2026-11-02T19:03:00.000Z" } } },
    { mission: missionView("2026-10-30", "food-spotless"), you: { state: "started", attempts: 4, startedAt: "2026-10-30T21:00:00.000Z", completedAt: null, best: null } },
  ],
  next: null,
};

function board(url: URL) {
  const game = url.searchParams.get("game");
  const lab = game === "bad-ideas-lab";
  const entries = CHAMPIONS.map((nickname, i) => ({
    position: i + 1,
    nickname,
    tag: String(4270 + i * 13),
    you: false,
    verified: lab,
    score: 1150,
    stars: 3,
    metrics: lab ? [1, 248 + i * 3] : [2400 - i * 120, 4 + (i % 3), 6 + i],
    achievedAt: "2026-11-03T12:00:00.000Z",
  }));
  const best = { score: 1150, stars: 3, metrics: lab ? [1, 266] : [1200, 6, 3], achievedAt: "2026-11-03T12:00:00.000Z" };
  return { board: { id: `${game}/all/v1`, game, level: null, explain: "", metrics: [] }, entries, total: 14, you: { nickname: MEMBER.nickname, tag: MEMBER.tag, standing: { position: 9, total: 14, verified: lab, best } } };
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/status", (route) => route.fulfill({ json: { status: "online" } }));
  await page.route("**/api/players/me", (route) => route.fulfill({ json: { player: MEMBER } }));
  await page.route("**/api/leaderboards?*", (route) => route.fulfill({ json: board(new URL(route.request().url())) }));
  await page.route("**/api/missions/today", (route) => route.fulfill({ json: MISSION }));
  await page.route("**/api/missions/history?*", (route) => route.fulfill({ json: HISTORY }));
  await page.clock.setFixedTime(NOW);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((progress) => {
    let seed = 404;
    Math.random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    localStorage.setItem("canal404:progress:v1", JSON.stringify(progress));
    sessionStorage.setItem("canal404:session", "1");
  }, visitor);
});

for (const { path, name } of PAGES) {
  test(`${name} looks as approved`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: name !== "room", animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.01 });
  });
}

test("off-air page looks as approved", async ({ page, problems }) => {
  problems.allow(/404/);
  await page.goto("/canal-perdido", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("off-air.png", { animations: "disabled", maxDiffPixelRatio: 0.01 });
});
