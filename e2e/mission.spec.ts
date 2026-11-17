import type { Page } from "@playwright/test";
import { Client } from "pg";
import { missionDay } from "../src/lib/missions/calendar";
import { missionByKey } from "../src/lib/missions/catalog";
import { expect, simTime, stage, test } from "./fixtures";

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
    const variant = JSON.stringify({ title: def.title, objective: def.objective, goal: def.goal, ranked: def.ranked, ...(def.setup ? { setup: def.setup } : {}) });
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
  test.describe.configure({ mode: "serial" });

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
    await expect(cartridge).toContainText("Ainda não jogou");

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
    const board = missed.getByRole("region", { name: "Placar da fase" });
    await board.getByLabel("Seu apelido").fill(nickname());
    await board.getByRole("button", { name: "Entrar no placar" }).click();
    await expect(missionLine.getByRole("status")).toContainText("Missão não cumprida", { timeout: simTime(15_000) });
    await expect(missionLine.getByRole("status")).toContainText("A bolinha levou 4,27 s, e a missão pede até 4,20 s.");

    await missed.getByRole("button", { name: "Tentar a missão de novo" }).click();
    await expect(missed).toBeHidden();
    const done = await placeRamp(page, QUICK_RAMP);
    const doneLine = done.getByRole("region", { name: "Missão 404 do dia" });
    await expect(doneLine.getByRole("status")).toContainText("Missão cumprida!", { timeout: simTime(15_000) });
    await expect(doneLine.getByRole("status")).toContainText(/1 peça · 4,08 s, \d+º de \d+ no placar do dia\./);
    await expect(doneLine.getByRole("list", { name: "Novas conquistas" })).toContainText("Primeira Transmissão");

    await doneLine.getByRole("link", { name: "Ver a Missão 404" }).click();
    await expect(page).toHaveURL("/mission");
    const after = page.getByTestId("mission-cartridge");
    await expect(after).toContainText("Concluída");
    await expect(after.getByRole("link", { name: "Jogar de novo" })).toBeVisible();
    const report = page.getByRole("region", { name: "Seu boletim" });
    await expect(report).toContainText(/Missão cumprida às \d{2}:\d{2}, em 2 tentativas\./);
    await expect(report).toContainText(/1 peça · 4,08 s · \d+º de \d+/);
    await expect(report).toContainText("Selos da missão · 1 de 6");
    await expect(report.getByRole("list", { name: "Seus últimos 14 dias de missão" }).getByRole("listitem")).toHaveCount(14);
    const dayBoard = page.getByRole("region", { name: "Placar do dia" });
    await expect(dayBoard.getByRole("row", { name: /Você/ })).toContainText("4,08 s");

    await page.goto("/extras#achievements");
    const seals = page.getByTestId("mission-achievements");
    await expect(seals).toContainText("1/6");
    await expect(seals.getByRole("listitem").filter({ hasText: "Primeira Transmissão" })).toContainText(/Em \d{2}\/\d{2}\/\d{4}/);

    const leave = await page.request.delete("/api/players/me");
    expect(leave.ok()).toBe(true);
  });
});
