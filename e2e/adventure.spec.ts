import { expect, openGame, simTime, test } from "./fixtures";

const GAME = { slug: "off-air-vacation", title: "Férias Fora do Ar", key: "canal404:off-air-vacation:v1" };

test("saves the adventure and offers to continue it after a reload", async ({ page }) => {
  const intro = await openGame(page, GAME.slug, GAME.title);
  await expect(intro.getByRole("button", { name: /Continuar aventura/ })).toHaveCount(0);
  await intro.getByRole("button", { name: /Começar aventura/ }).click();
  await expect(intro).toBeHidden();

  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), GAME.key), { timeout: simTime(30_000) }).not.toBeNull();

  await page.reload();
  const again = await openGame(page, GAME.slug, GAME.title);
  await expect(again.getByText("Sua aventura está salva. Continue de onde parou.")).toBeVisible();
  await again.getByRole("button", { name: /Continuar aventura/ }).click();
  await expect(again).toBeHidden();
});
