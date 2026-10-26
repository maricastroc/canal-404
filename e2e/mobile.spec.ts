import type { Page } from "@playwright/test";
import { expect, openGame, stage, test } from "./fixtures";

async function scrollsSideways(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

test("navigates with the menu drawer", async ({ page }) => {
  await page.goto("/games");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu do canal" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: /Personagens/ }).click();
  await expect(page).toHaveURL("/characters");
  await expect(menu).toBeHidden();
});

for (const path of ["/", "/games", "/characters", "/extras", "/about", "/games/food-fight"]) {
  test(`fits the phone screen on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await scrollsSideways(page)).toBe(false);
  });
}

test("plays a game on a phone", async ({ page }) => {
  const intro = await openGame(page, "food-fight", "Guerra de Lanche");
  const box = await intro.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  await intro.getByRole("button", { name: "Jogar", exact: true }).tap();
  await expect(intro).toBeHidden();
  await expect(stage(page).locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Pausar" }).tap();
  await expect(page.getByRole("dialog", { name: "Jogo pausado" })).toBeVisible();
});
