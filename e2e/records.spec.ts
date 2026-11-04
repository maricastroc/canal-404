import AxeBuilder from "@axe-core/playwright";
import type { Page, Route } from "@playwright/test";
import { expect, test } from "./fixtures";

const MEMBER = { id: "00000000-0000-4000-8000-000000000404", nickname: "Pato Veloz", tag: "0404", createdAt: "2026-10-23T15:00:00.000Z" };

const NAMES = ["Lina Turbo", "Zé Engenhoca", "Mila Chiclete", "Capitão Pudim", "Robô do Bairro", "Gato Pixel", "Tia do Lanche", "Bruno Bola", "Déco Raio", "Dona Cocada"];

function entry(i: number, metrics: number[]) {
  return { position: i + 1, nickname: NAMES[i], tag: String(4270 + i).padStart(4, "0"), you: false, verified: true, score: 1150, stars: 3, metrics, achievedAt: "2026-11-03T12:00:00.000Z" };
}

function boardFor(url: URL) {
  const game = url.searchParams.get("game")!;
  const level = url.searchParams.get("level");
  const lab = game === "bad-ideas-lab";
  const entries = NAMES.map((_, i) => entry(i, lab ? [1, 98 + i * 7] : [2400 - i * 90, 4 + (i % 3), 6]));
  return {
    board: { id: `${game}/${level ?? "all"}/v1`, game, level, explain: "", metrics: [] },
    entries,
    total: 23,
    you: { nickname: MEMBER.nickname, tag: MEMBER.tag, standing: { position: 14, total: 23, verified: lab, best: { score: 1150, stars: 3, metrics: lab ? [1, 190] : [1200, 6, 3], achievedAt: "2026-11-03T12:00:00.000Z" } } },
  };
}

async function online(page: Page, leaderboards: (route: Route, url: URL) => Promise<void> = (route, url) => route.fulfill({ json: boardFor(url) })) {
  await page.route("**/api/status", (route) => route.fulfill({ json: { status: "online" } }));
  await page.route("**/api/players/me", (route) => route.fulfill({ json: { player: MEMBER } }));
  await page.route("**/api/leaderboards?*", (route) => leaderboards(route, new URL(route.request().url())));
}

test.describe("record arcade", () => {
  test("shows the champions of a level, the house rules and the player's place", async ({ page }) => {
    await online(page);
    await page.goto("/records?game=bad-ideas-lab&level=juice");
    await expect(page.getByRole("heading", { level: 1, name: "Fliperama de recordes" })).toBeVisible();
    const board = page.getByRole("region", { name: "Laboratório de Péssimas Ideias" });
    await expect(board).toContainText("Fase 4: Suco de laranja");
    const table = board.getByRole("table", { name: /Melhores do canal em Laboratório de Péssimas Ideias, Fase 4/ });
    const rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Lina Turbo");
    await expect(rows.nth(1)).toContainText("#4270");
    await expect(rows.nth(1)).toContainText("1 peça");
    await expect(rows.nth(1)).toContainText("98 passos");
    await expect(rows.nth(1)).toContainText("máquina testada pelo canal");
    await expect(rows.last()).toContainText("14º");
    await expect(rows.last()).toContainText("Você");
    await expect(page.getByRole("region", { name: "Seu lugar" })).toContainText("14º de 23: 1 peça · 190 passos");
    const rules = page.getByRole("region", { name: "Regras da casa" });
    await expect(rules).toContainText("Menos peças vence.");
    await expect(rules).toContainText("monta sua máquina de novo");
    const axe = await new AxeBuilder({ page }).include("main").analyze();
    expect(axe.violations).toEqual([]);
  });

  test("switches games and levels from the cartridges", async ({ page }) => {
    await online(page);
    await page.goto("/records");
    const games = page.getByRole("navigation", { name: "Jogos do fliperama" });
    await expect(games.getByRole("link", { name: /Rua Sem Saída/ })).toHaveAttribute("aria-current", "true");
    await expect(page.getByRole("region", { name: "Rua Sem Saída" }).getByRole("table")).toContainText("2.400 pts");
    await expect(page.getByRole("navigation", { name: "Fases" })).toHaveCount(0);
    await games.getByRole("link", { name: /Laboratório de Péssimas Ideias/ }).click();
    await expect(page).toHaveURL(/game=bad-ideas-lab/);
    const levels = page.getByRole("navigation", { name: "Fases" });
    await expect(levels.getByRole("link", { name: /Bom dia, Pixel/ })).toHaveAttribute("aria-current", "true");
    await expect(levels.getByRole("link", { name: /Primeiro teste/ })).toHaveCount(0);
    await levels.getByRole("link", { name: /Café da manhã/ }).click();
    await expect(page).toHaveURL(/game=bad-ideas-lab&level=toast/);
    await expect(page.getByRole("region", { name: "Laboratório de Péssimas Ideias" })).toContainText("Fase 3: Café da manhã");
    await games.getByRole("link", { name: /Guerra do Pijama/ }).click();
    await expect(page.getByRole("navigation", { name: "Arenas" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Regras da casa" })).toContainText("não prova que a partida foi jogada sem trapaça");
  });

  test("says when a board is empty, out of signal or not open yet", async ({ page, problems }) => {
    problems.allow(/503/);
    let down = true;
    await online(page, async (route, url) => {
      if (url.searchParams.get("game") === "food-fight") return route.fulfill({ json: { ...boardFor(url), entries: [], total: 0, you: null } });
      if (down) return route.fulfill({ status: 503, json: { error: { code: "unavailable", message: "Placar fora do ar." } } });
      return route.fulfill({ json: boardFor(url) });
    });
    await page.goto("/records?game=food-fight");
    const empty = page.getByRole("region", { name: "Guerra de Lanche" });
    await expect(empty).toContainText("Ninguém marcou ponto aqui");
    await expect(empty.getByRole("link", { name: /Jogar Guerra de Lanche/ })).toHaveAttribute("href", "/play/food-fight");

    await page.goto("/records?game=dead-end-street");
    const board = page.getByRole("region", { name: "Rua Sem Saída" });
    await expect(board).toContainText("Sem sinal no fliperama");
    down = false;
    await board.getByRole("button", { name: "Tentar de novo" }).click();
    await expect(board.getByRole("table")).toContainText("Lina Turbo");
  });

  test("tells the visitor the arcade has not opened while the board is not configured", async ({ page }) => {
    await page.route("**/api/status", (route) => route.fulfill({ json: { status: "unconfigured" } }));
    await page.goto("/records?game=pajama-war");
    await expect(page.getByRole("region", { name: "Guerra do Pijama" })).toContainText("O fliperama ainda não abriu");
    await expect(page.getByRole("region", { name: "Seu lugar" })).toContainText("Quando o placar estrear");
    const axe = await new AxeBuilder({ page }).include("main").analyze();
    expect(axe.violations).toEqual([]);
  });

  test("opens from the trophy in the broadcast room", async ({ page }) => {
    await page.route("**/api/status", (route) => route.fulfill({ json: { status: "unconfigured" } }));
    await page.addInitScript(() => sessionStorage.setItem("canal404:session", "1"));
    await page.goto("/");
    await page.getByRole("link", { name: /Troféu de 2004/ }).click();
    await expect(page).toHaveURL(/\/records$/);
    await expect(page.getByRole("heading", { level: 1, name: "Fliperama de recordes" })).toBeVisible();
  });
});

test.describe("record arcade with the backend", () => {
  test.beforeEach(async ({ page }) => {
    const status = (await (await page.request.get("/api/status")).json()) as { status: string };
    test.skip(status.status !== "online" && !process.env.E2E_REQUIRE_DB, "the board needs DATABASE_URL and COMPETITION_SECRET");
  });

  test("lists a Laboratório record the server replayed", async ({ page }) => {
    const nickname = `Robo ${Array.from({ length: 6 }, () => "abcdefghjkmnpqrstuvwxyz"[Math.floor(Math.random() * 23)]).join("")}`;
    expect((await page.request.post("/api/players", { data: { nickname } })).ok()).toBe(true);
    const ticket = (await (await page.request.post("/api/runs/tickets", { data: { game: "bad-ideas-lab", level: "juice" } })).json()) as { ticket: string };
    const claim = {
      won: true,
      score: 1150,
      stars: 3,
      stats: { parts: 1, inventory: 2, par: 1, runs: 2, steps: 98 },
      replay: { kind: "lab-placements", version: 1, parts: [{ type: "fan", x: 220, y: 580, rot: 0 }] },
    };
    const submitted = await page.request.post("/api/runs", { data: { ticket: ticket.ticket, result: claim } });
    expect(submitted.status()).toBe(201);
    expect(((await submitted.json()) as { run: { verification: string } }).run.verification).toBe("replayed");

    await page.goto("/records?game=bad-ideas-lab&level=juice");
    const mine = page.getByRole("region", { name: "Laboratório de Péssimas Ideias" }).getByRole("row").filter({ hasText: nickname }).first();
    await expect(mine).toContainText("Você");
    await expect(mine).toContainText("98 passos");
    await expect(mine).toContainText("máquina testada pelo canal");
    expect((await page.request.delete("/api/players/me")).ok()).toBe(true);
  });
});
