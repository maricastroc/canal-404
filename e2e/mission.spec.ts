import type { Page } from "@playwright/test";
import { Client } from "pg";
import { missionDay } from "../src/lib/missions/calendar";
import { missionByKey } from "../src/lib/missions/catalog";
import { accessibilityViolations, expect, simTime, stage, test } from "./fixtures";

const LAB_TITLE = "Laboratório de Péssimas Ideias";

const PROGRESS = {
  version: 1,
  visitorNumber: 84404,
  visits: 2,
  firstVisitAt: 1,
  lastVisitAt: 1,
  settings: { sfx: false, music: false, track: "theme" },
  secrets: {},
  achievements: { "first-visit": 1 },
  games: {},
  counters: {},
};

function nickname() {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  return `Missao ${Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * letters.length)]).join("")}`;
}

async function boardOnline(page: Page) {
  const response = await page.request.get("/api/status");
  return ((await response.json()) as { status: string }).status === "online";
}

async function scheduleToday(key: string) {
  const def = missionByKey(key)!;
  const day = missionDay(new Date());
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const variant = JSON.stringify({ title: def.title, objective: def.objective, goal: def.goal, ranked: def.ranked });
    await client.query(
      `INSERT INTO daily_challenges (id, key, game, level, seed, variant, rules_version) VALUES ($1, $2, $3, $4, 1, $5::jsonb, $6)
       ON CONFLICT (id) DO UPDATE SET key = EXCLUDED.key, game = EXCLUDED.game, level = EXCLUDED.level, variant = EXCLUDED.variant, rules_version = EXCLUDED.rules_version`,
      [day, key, def.game, def.level ?? "-", variant, def.version],
    );
  } finally {
    await client.end();
  }
  return { day, def };
}

async function placeRamp(page: Page, moves: string[]) {
  await stage(page).focus();
  await page.keyboard.press("1");
  await expect(page.getByTestId("game-announcer")).toContainText("Rampa na mão");
  for (const key of moves) await page.keyboard.press(key);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  const result = page.getByRole("dialog", { name: /^Vitória/ });
  await expect(result).toBeVisible({ timeout: simTime(30_000) });
  return result;
}

const SLOW_RAMP = ["Shift+ArrowLeft", "Shift+ArrowUp", "Shift+ArrowUp", "Shift+ArrowUp"];
const QUICK_RAMP = ["ArrowRight", "ArrowRight", "ArrowUp", "ArrowUp"];

test.describe("daily mission with the backend", () => {
  test.beforeEach(async ({ page }) => {
    const online = await boardOnline(page);
    test.skip((!online || !process.env.DATABASE_URL) && !process.env.E2E_REQUIRE_DB, "the mission needs the board and DATABASE_URL");
    await page.addInitScript((progress) => {
      if (!localStorage.getItem("canal404:progress:v1")) localStorage.setItem("canal404:progress:v1", JSON.stringify(progress));
      sessionStorage.setItem("canal404:session", "1");
    }, PROGRESS);
  });

  test("goes from the mission page to the right level, misses, retries and completes it", async ({ page }) => {
    const { day, def } = await scheduleToday("lab-pixel-fast");
    await page.goto("/mission");
    const cartridge = page.getByTestId("mission-cartridge");
    await expect(cartridge.getByRole("heading", { name: def.title })).toBeVisible();
    await expect(cartridge).toContainText("Fase 2: Bom dia, Pixel");
    await expect(cartridge).toContainText("Não iniciada");
    expect(await accessibilityViolations(page, "main")).toEqual([]);

    await cartridge.getByRole("link", { name: "Jogar missão" }).click();
    await expect(page).toHaveURL(`/play/bad-ideas-lab?mission=${day}`);
    const intro = page.getByRole("dialog", { name: `${LAB_TITLE}: tela de apresentação` });
    await expect(intro).toBeVisible({ timeout: simTime(45_000) });
    await expect(intro.getByRole("region", { name: def.title })).toContainText(def.objective);
    const ticket = page.waitForResponse((r) => r.url().endsWith("/api/runs/tickets") && r.request().method() === "POST");
    await intro.getByRole("button", { name: "Começar missão" }).click();
    await expect(intro).toBeHidden();
    expect(await (await ticket).json()).toMatchObject({ mission: day });

    const missed = await placeRamp(page, SLOW_RAMP);
    const missionLine = missed.getByRole("region", { name: "Missão 404 do dia" });
    await expect(missionLine).toContainText("Falta seu apelido");
    const board = missed.getByRole("region", { name: "Placar do canal" });
    await board.getByLabel("Seu apelido").fill(nickname());
    await board.getByRole("button", { name: "Entrar no placar" }).click();
    await expect(missionLine.getByRole("status")).toContainText("Quase!", { timeout: simTime(15_000) });
    await expect(missionLine.getByRole("status")).toContainText("A bolinha levou 4,27 s.");

    await missed.getByRole("button", { name: "Tentar a missão de novo" }).click();
    await expect(missed).toBeHidden();
    const done = await placeRamp(page, QUICK_RAMP);
    const doneLine = done.getByRole("region", { name: "Missão 404 do dia" });
    await expect(doneLine.getByRole("status")).toContainText("Missão cumprida!", { timeout: simTime(15_000) });
    await expect(doneLine.getByRole("status")).toContainText(/1 peça · 4,08 s, \d+º de \d+ no placar do dia\./);
    await expect(doneLine.getByRole("list", { name: "Novas conquistas" })).toContainText("Primeira Transmissão");
    expect(await accessibilityViolations(page, '[aria-label="Missão 404 do dia"]')).toEqual([]);

    await doneLine.getByRole("link", { name: "Ver a Missão 404" }).click();
    await expect(page).toHaveURL("/mission");
    const after = page.getByTestId("mission-cartridge");
    await expect(after).toContainText("Concluída");
    await expect(after.getByRole("link", { name: "Jogar de novo" })).toBeVisible();
    const report = page.getByRole("region", { name: "Seu boletim" });
    await expect(report).toContainText(/Missão cumprida às \d{2}:\d{2}, em 2 tentativas\./);
    await expect(report).toContainText(/1 peça · 4,08 s · \d+º de \d+/);
    await expect(report).toContainText("Selos da missão · 1 de 5");
    await expect(report.getByRole("list", { name: "Seus últimos 14 dias de missão" }).getByRole("listitem")).toHaveCount(14);
    const dayBoard = page.getByRole("region", { name: "Placar do dia" });
    await expect(dayBoard.getByRole("row", { name: /Você/ })).toContainText("4,08 s");
    expect(await accessibilityViolations(page, "main")).toEqual([]);

    await page.goto("/extras#achievements");
    const seals = page.getByTestId("mission-achievements");
    await expect(seals).toContainText("1/5");
    await expect(seals.getByRole("listitem").filter({ hasText: "Primeira Transmissão" })).toContainText(/Em \d{2}\/\d{2}\/\d{4}/);

    const leave = await page.request.delete("/api/players/me");
    expect(leave.ok()).toBe(true);
  });

  test("tells the player when a mission link is from another day", async ({ page }) => {
    await scheduleToday("lab-pixel-fast");
    await page.goto("/play/bad-ideas-lab?mission=2020-01-01");
    const intro = page.getByRole("dialog", { name: `${LAB_TITLE}: tela de apresentação` });
    await expect(intro).toBeVisible({ timeout: simTime(45_000) });
    await expect(intro.getByRole("status")).toContainText("Essa missão já saiu do ar.");
    await expect(intro.getByRole("button", { name: "Começar missão" })).toHaveCount(0);
    await expect(intro.getByRole("button", { name: /^Jogar fase/ })).toBeVisible();
  });

  test("can drop the mission and play the game normally", async ({ page }) => {
    const { day } = await scheduleToday("lab-pixel-fast");
    await page.goto(`/play/bad-ideas-lab?mission=${day}`);
    const intro = page.getByRole("dialog", { name: `${LAB_TITLE}: tela de apresentação` });
    await expect(intro.getByRole("button", { name: "Começar missão" })).toBeVisible({ timeout: simTime(45_000) });
    await intro.getByRole("button", { name: "Jogar sem missão" }).click();
    await expect(page).toHaveURL("/play/bad-ideas-lab");
    await expect(intro.getByRole("button", { name: /^Jogar fase/ })).toBeVisible();
  });
  test("announces the mission in the room and tunes the TV to it from the NO AR sign", async ({ page }) => {
    const { day, def } = await scheduleToday("lab-pixel-fast");
    await page.goto("/");
    const sign = page.getByRole("button", { name: `Placa NO AR: ver a Missão 404 de hoje na TV, ${def.title}` });
    await expect(sign).toBeVisible({ timeout: simTime(20_000) });
    await sign.click();
    await expect(page.getByTestId("tv-screen").first()).toHaveAttribute("data-channel", "mission");
    await expect(page.getByRole("button", { name: /^Mudar de canal/ })).toHaveAccessibleName("Mudar de canal. Canal atual: 09, Missão 404 do Dia");
    const play = page.getByRole("link", { name: /^Jogar missão/ });
    await expect(play).toHaveAttribute("href", `/play/bad-ideas-lab?mission=${day}`);
    expect(await accessibilityViolations(page, '[data-testid="tv-screen"]')).toEqual([]);
    await play.click();
    await expect(page).toHaveURL(`/play/bad-ideas-lab?mission=${day}`);
    await expect(page.getByRole("dialog", { name: `${LAB_TITLE}: tela de apresentação` }).getByRole("button", { name: "Começar missão" })).toBeVisible({ timeout: simTime(45_000) });
  });
});

test.describe("daily mission without the backend", () => {
  test("keeps the NO AR sign as decoration when the board has not premiered", async ({ page }) => {
    await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "unconfigured" }) }));
    await page.goto("/");
    await expect(page.getByRole("button", { name: /^Mudar de canal/ })).toBeVisible();
    await page.waitForTimeout(1000);
    await expect(page.getByRole("button", { name: /^Placa NO AR/ })).toHaveCount(0);
  });

  test("announces that the mission is coming when the board has not premiered", async ({ page }) => {
    await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "unconfigured" }) }));
    await page.goto("/mission");
    await expect(page.getByText("A missão estreia em breve")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver o catálogo" })).toBeVisible();
    expect(await accessibilityViolations(page, "main")).toEqual([]);
  });

  test("shows no signal and recovers when the mission cannot be reached", async ({ page, problems }) => {
    problems.allow(/\/api\/missions\/(today|board)/);
    problems.allow(/status of 503/);
    await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "online" }) }));
    await page.route("**/api/players/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ player: null }) }));
    await page.route("**/api/missions/board?*", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "unavailable", message: "fora" } }) }));
    await page.route("**/api/missions/today", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "unavailable", message: "fora" } }) }),
    );
    await page.goto("/mission");
    await expect(page.getByText("Sem sinal da missão")).toBeVisible();
    await page.unroute("**/api/missions/today");
    await page.route("**/api/missions/today", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          now: new Date().toISOString(),
          completions: 0,
          leader: null,
          you: null,
          mission: { day: "2026-11-04", key: "food-spotless", version: 1, game: "food-fight", level: null, title: "Sem uma mancha", objective: "Chegue ao sinal sem levar nenhum pudim.", goal: [], ranked: true, endsAt: new Date(Date.now() + 3_600_000).toISOString(), closesAt: new Date(Date.now() + 7_200_000).toISOString() },
        }),
      }),
    );
    await page.getByRole("button", { name: "Tentar de novo" }).click();
    const cartridge = page.getByTestId("mission-cartridge");
    await expect(cartridge.getByRole("heading", { name: "Sem uma mancha" })).toBeVisible();
    await expect(cartridge.getByRole("link", { name: "Jogar missão" })).toHaveAttribute("href", "/play/food-fight?mission=2026-11-04");
    await expect(page.getByRole("region", { name: "Seu boletim" })).toContainText("escolha um apelido");
  });
});
