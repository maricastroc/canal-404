import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const knob = (page: Page) => page.getByRole("button", { name: /^Mudar de canal/ });

const json = (body: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

async function withoutBoard(page: Page) {
  await page.route("**/api/status", (route) => route.fulfill(json({ status: "unconfigured" })));
}

async function withMission(page: Page, state: "new" | "completed") {
  await page.route("**/api/status", (route) => route.fulfill(json({ status: "online" })));
  await page.route("**/api/players/me", (route) => route.fulfill(json({ player: null })));
  await page.route("**/api/missions/today", (route) =>
    route.fulfill(
      json({
        now: new Date().toISOString(),
        completions: 0,
        leader: null,
        you: state === "completed" ? { state, attempts: 1, startedAt: null, completedAt: new Date().toISOString(), best: null, progress: { days: 1, streak: 1, bestStreak: 1, lastDay: null }, achievements: [], championDays: 0, recent: [] } : null,
        mission: { day: "2026-11-04", key: "food-spotless", version: 1, game: "food-fight", level: null, title: "Sem uma mancha", objective: "Chegue ao sinal sem levar nenhum pudim.", goal: [], ranked: true, endsAt: new Date(Date.now() + 3_600_000).toISOString(), closesAt: new Date(Date.now() + 7_200_000).toISOString() },
      }),
    ),
  );
}

test("the TV opens on today's mission", async ({ page }) => {
  await withMission(page, "new");
  await page.goto("/");
  await expect(knob(page)).toHaveAccessibleName("Mudar de canal. Canal atual: 09, Missão 404 do Dia");
  await expect(page.getByRole("link", { name: /^Jogar missão/ })).toHaveAttribute("href", "/play/food-fight?mission=2026-11-04");
  await expect(page.getByRole("button", { name: /^A seguir:/ })).not.toHaveAccessibleName(/Guerra de Lanche/);
});

test("the TV opens on a new program once today's mission is done", async ({ page }) => {
  await withMission(page, "completed");
  await page.goto("/");
  await expect(page.getByRole("link", { name: /^Jogar agora ?: Rua Sem Saída, inédito$/ })).toBeVisible();
});

test("the TV tunes to the next suggested program and still hides the lost channel", async ({ page }) => {
  await withoutBoard(page);
  await page.goto("/");
  await expect(page.getByRole("link", { name: /^Jogar agora ?: Rua Sem Saída, inédito$/ })).toBeVisible();
  const next = page.getByRole("button", { name: /^A seguir:/ });
  await expect(next).toBeVisible();
  const label = (await next.getAttribute("aria-label"))!;
  const number = /canal (\d+)/.exec(label)![1];
  await next.click();
  await expect(knob(page)).toHaveAccessibleName(new RegExp(`Canal atual: ${number}`));

  for (let i = 0; i < 9; i += 1) {
    await knob(page).click();
    await page.waitForTimeout(120);
  }
  await expect(knob(page)).toHaveAccessibleName(/Transmissão perdida/);
  await expect(page.getByText("Canal Perdido")).toBeVisible();
});

test("the catalog marks new and rerun programs", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "canal404:progress:v1",
      JSON.stringify({ version: 1, visits: 2, games: { "food-fight": { highScore: 10, bestStars: 1, plays: 1, wins: 0, lastScore: 10 } } }),
    );
  });
  await page.goto("/games");
  const lunch = page.getByRole("link", { name: /Guerra de Lanche/ });
  await expect(lunch).toContainText("Reprise");
  await expect(page.getByRole("link", { name: /Operação: Recreio/ })).toContainText("Inédito");
  await expect(page.getByText("Jogo da semana")).toHaveCount(0);
});
