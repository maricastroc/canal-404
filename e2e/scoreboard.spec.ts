import type { Page } from "@playwright/test";
import { accessibilityViolations, expect, openGame, simTime, stage, test } from "./fixtures";

const LAB = { slug: "bad-ideas-lab", title: "Laboratório de Péssimas Ideias" };

const UNLOCKED = {
  version: 1,
  visitorNumber: 84404,
  visits: 2,
  firstVisitAt: 1,
  lastVisitAt: 1,
  settings: { sfx: false, music: false, track: "theme" },
  secrets: {},
  achievements: { "first-visit": 1 },
  games: { "bad-ideas-lab": { highScore: 1450, bestStars: 3, plays: 1, wins: 1, lastScore: 1450, levels: { test: { stars: 3, score: 1450 } } } },
  counters: {},
};

function nickname() {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  return `Robo ${Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * letters.length)]).join("")}`;
}

async function boardOnline(page: Page) {
  const response = await page.request.get("/api/status");
  return ((await response.json()) as { status: string }).status === "online";
}

async function seed(page: Page) {
  await page.addInitScript((progress) => {
    if (!localStorage.getItem("canal404:progress:v1")) localStorage.setItem("canal404:progress:v1", JSON.stringify(progress));
    sessionStorage.setItem("canal404:session", "1");
  }, UNLOCKED);
}

async function placePixelRamp(page: Page) {
  await stage(page).focus();
  await page.keyboard.press("1");
  await expect(page.getByTestId("game-announcer")).toContainText("Rampa na mão");
  await page.keyboard.press("Shift+ArrowLeft");
  for (let i = 0; i < 3; i += 1) await page.keyboard.press("Shift+ArrowUp");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  const result = page.getByRole("dialog", { name: /^Vitória/ });
  await expect(result).toBeVisible({ timeout: simTime(30_000) });
  return result;
}

async function solvePixel(page: Page) {
  const intro = await openGame(page, LAB.slug, LAB.title);
  await intro.getByRole("button", { name: "Jogar fase 2" }).click();
  await expect(intro).toBeHidden();
  return placePixelRamp(page);
}

async function playPractice(page: Page) {
  const intro = await openGame(page, LAB.slug, LAB.title);
  await intro.getByRole("button", { name: "Jogar fase 1" }).click();
  await stage(page).focus();
  await page.keyboard.press("1");
  await expect(page.getByTestId("game-announcer")).toContainText("Aperte Enter para colocar");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  const result = page.getByRole("dialog", { name: /^Vitória/ });
  await expect(result).toBeVisible({ timeout: simTime(30_000) });
  return result;
}

test.describe("scoreboard with the backend", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!(await boardOnline(page)) && !process.env.E2E_REQUIRE_DB, "the board needs DATABASE_URL and COMPETITION_SECRET");
  });

  test("joins after a win, registers a verified-shape result and remembers the best", async ({ page }) => {
    await seed(page);
    const result = await solvePixel(page);
    const board = result.getByRole("region", { name: "Placar da fase" });
    await expect(board).toContainText("Quer ver seu nome no placar?");
    await board.getByLabel("Seu apelido").fill(nickname());
    const submitted = page.waitForResponse((r) => r.url().endsWith("/api/runs") && r.request().method() === "POST" && r.status() === 201);
    await board.getByRole("button", { name: "Entrar no placar" }).click();
    expect((await (await submitted).json()).run).toMatchObject({ verification: "replayed", eligible: true });
    await expect(board.getByRole("status")).toContainText(/Você entrou no placar|Novo recorde pessoal!|Recorde do canal!|Placar inaugurado/, { timeout: simTime(15_000) });
    await expect(board.getByRole("status")).toContainText(/1 peça · \d+,\d{2} s\. ((Agora v|V)ocê está em \d+º de \d+|Você passou na frente de todo mundo: 1º de \d+|Por enquanto, o placar desta fase é só seu)\./);
    await expect(board.getByRole("link", { name: "Ver o fliperama de recordes" })).toHaveAttribute("href", "/records?game=bad-ideas-lab&level=pixel");

    expect(await accessibilityViolations(page, '[aria-label="Placar da fase"]')).toEqual([]);

    await result.getByRole("button", { name: "Refazer fase" }).click();
    await expect(result).toBeHidden();
    const again = await placePixelRamp(page);
    await expect(again.getByRole("region", { name: "Placar da fase" }).getByRole("status")).toContainText(/Seu melhor continua 1 peça · \d+,\d{2} s/, {
      timeout: simTime(15_000),
    });

    await page.goto("/extras#membership");
    const card = page.getByTestId("player-card");
    await expect(card).toContainText("Sócio do fliperama");
    await card.getByRole("button", { name: "Sair do placar" }).click();
    await card.getByRole("button", { name: "Sim, apagar" }).click();
    await expect(card).toContainText("Sem carteirinha");
  });

  test("keeps practice levels off the board", async ({ page }) => {
    const result = await playPractice(page);
    const board = result.getByRole("region", { name: "Placar da fase" });
    await expect(board).toContainText("Quer ver seu nome no placar?");
    await board.getByLabel("Seu apelido").fill(nickname());
    await board.getByRole("button", { name: "Entrar no placar" }).click();
    await expect(board.getByRole("status")).toHaveText("Fase de treino não entra no placar.", { timeout: simTime(15_000) });
    const leave = await page.request.delete("/api/players/me");
    expect(leave.ok()).toBe(true);
  });
});

test.describe("scoreboard without the backend", () => {
  test("keeps the game playable when the board is down", async ({ page, problems }) => {
    problems.allow(/\/api\//);
    problems.allow(/status of 503/);
    await page.route("**/api/**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "unavailable", message: "fora" } }) }));
    const result = await playPractice(page);
    await expect(result.getByRole("img", { name: "3 de 3 estrelas" })).toBeVisible();
    const board = result.getByRole("region", { name: "Placar da fase" });
    await expect(board.getByRole("status")).toContainText("ficou só no seu progresso");
    await expect(board).toContainText("Sem sinal");
    await result.getByRole("button", { name: "Escolher fase" }).click();
    await expect(page.getByRole("dialog", { name: `${LAB.title}: tela de apresentação` }).getByRole("button", { name: "Jogar fase 2" })).toBeVisible();
  });

  test("hides the board line while the board has not premiered", async ({ page }) => {
    await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "unconfigured" }) }));
    const result = await playPractice(page);
    await expect(result.getByRole("img", { name: "3 de 3 estrelas" })).toBeVisible();
    await expect(result.getByRole("region", { name: "Placar da fase" })).toHaveCount(0);
  });

  test("shows the membership card as coming soon and passes an accessibility check", async ({ page }) => {
    await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "unconfigured" }) }));
    await page.goto("/extras");
    const card = page.getByTestId("player-card");
    await expect(card).toContainText("Em breve");
    expect(await accessibilityViolations(page, '[data-testid="player-card"]')).toEqual([]);
  });

  test("explains the board is off the air when the status check fails", async ({ page, problems }) => {
    problems.allow(/\/api\//);
    problems.allow(/ERR_CONNECTION_REFUSED/);
    await page.route("**/api/**", (route) => route.abort("connectionrefused"));
    await page.goto("/extras");
    await expect(page.getByTestId("player-card")).toContainText("Sem sinal");
  });
});
