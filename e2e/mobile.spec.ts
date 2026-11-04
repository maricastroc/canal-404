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

for (const path of ["/", "/games", "/mission", "/records", "/characters", "/extras", "/about", "/games/food-fight"]) {
  test(`fits the phone screen on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await scrollsSideways(page)).toBe(false);
  });
}

test("picks a tape and watches it up close on a phone", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Estante de fitas VHS: escolher uma fita" }).press("Enter");
  const shelf = page.getByRole("dialog", { name: "Estante de fitas" });
  const viewport = page.viewportSize()!;
  const shelfBox = (await shelf.boundingBox())!;
  expect(shelfBox.x).toBeGreaterThanOrEqual(0);
  expect(shelfBox.x + shelfBox.width).toBeLessThanOrEqual(viewport.width + 1);
  await shelf.getByRole("button", { name: /^Colocar a fita Desenhos 03/ }).tap();
  await expect(page.getByRole("button", { name: /^Mudar de canal/ })).toHaveAccessibleName(/Fita: Desenhos 03/);
  await page.getByRole("button", { name: "Ver a TV de perto" }).tap();
  const screen = page.getByRole("dialog", { name: "TV de perto" }).getByTestId("tv-screen");
  await expect(screen).toHaveAttribute("data-channel", "tape-cartoon");
  await page.waitForTimeout(600);
  const box = (await screen.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.width).toBeGreaterThan(viewport.width * 0.8);
  expect(await scrollsSideways(page)).toBe(false);
  await page.getByRole("button", { name: "Voltar pra sala" }).tap();
  await expect(page.getByRole("dialog", { name: "TV de perto" })).toBeHidden();
});

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
