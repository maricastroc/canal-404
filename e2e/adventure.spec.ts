import { expect, openGame, test } from "./fixtures";

const GAME = { slug: "off-air-vacation", title: "Férias Fora do Ar", key: "canal404:off-air-vacation:v1" };

test("saves the adventure and offers to continue it after a reload", async ({ page }) => {
  const intro = await openGame(page, GAME.slug, GAME.title);
  await expect(intro.getByRole("button", { name: /Continuar aventura/ })).toHaveCount(0);
  await intro.getByRole("button", { name: /Começar aventura/ }).click();
  await expect(intro).toBeHidden();

  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), GAME.key), { timeout: 30_000 }).not.toBeNull();

  await page.reload();
  const again = await openGame(page, GAME.slug, GAME.title);
  await expect(again.getByText("Sua aventura está salva. Continue de onde parou.")).toBeVisible();
  await again.getByRole("button", { name: /Continuar aventura/ }).click();
  await expect(again).toBeHidden();
});

test("starts over only after confirming", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((key) => window.localStorage.setItem(key, JSON.stringify({ v: 1, area: "beach", items: ["remote"], flags: { tiltWon: true } })), GAME.key);
  const intro = await openGame(page, GAME.slug, GAME.title);
  await intro.getByRole("button", { name: /Nova aventura/ }).click();
  const confirm = intro.getByRole("alertdialog", { name: "Começar uma nova aventura" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: /Sim, nova aventura/ }).click();
  await expect(intro).toBeHidden();
  await expect
    .poll(() => page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "{}").area ?? null, GAME.key), { timeout: 30_000 })
    .not.toBe("beach");
});
