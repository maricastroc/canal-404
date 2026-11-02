import type { Page } from "@playwright/test";
import { expect, openGame, simTime, stage, test } from "./fixtures";

type Sent = [string, Record<string, unknown>];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __sent: Sent[]; umami: { track: (n: string, d: Record<string, unknown>) => void } };
    w.__sent = [];
    w.umami = { track: (name, data) => w.__sent.push([name, data]) };
  });
});

const sent = (page: Page) => page.evaluate(() => (window as unknown as { __sent: Sent[] }).__sent);

test("reports a started match that the player leaves", async ({ page }) => {
  const intro = await openGame(page, "food-fight", "Guerra de Lanche");
  await intro.getByRole("button", { name: "Jogar", exact: true }).click();
  await expect(intro).toBeHidden();
  await expect.poll(async () => (await sent(page)).map(([name]) => name)).toContain("game_start");
  await page.getByRole("button", { name: "Pausar" }).click();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide")));
  const events = await sent(page);
  expect(events.find(([n]) => n === "game_start")?.[1]).toMatchObject({ game: "food-fight", level: "-", attempt: 1 });
  expect(events.find(([n]) => n === "game_abandon")?.[1]).toMatchObject({ game: "food-fight", paused: true });
});

test("reports a finished level with its result and attempt", async ({ page }) => {
  const intro = await openGame(page, "bad-ideas-lab", "Laboratório de Péssimas Ideias");
  await intro.getByRole("button", { name: "Jogar fase 1" }).click();
  await stage(page).focus();
  await page.keyboard.press("1");
  await expect(page.getByTestId("game-announcer")).toContainText("Aperte Enter para colocar");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog", { name: /^Vitória/ })).toBeVisible({ timeout: simTime(30_000) });
  const finish = (await sent(page)).find(([n]) => n === "game_finish")?.[1];
  expect(finish).toMatchObject({ game: "bad-ideas-lab", level: "test", attempt: 1, won: true, stars: 3 });
  expect(finish?.seconds).toEqual(expect.any(Number));
  expect((await sent(page)).some(([n]) => n === "game_abandon")).toBe(false);
});
