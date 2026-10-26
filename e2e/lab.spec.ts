import { expect, openGame, stage, test } from "./fixtures";

const LAB = { slug: "bad-ideas-lab", title: "Laboratório de Péssimas Ideias" };

test("wins the first Laboratório level with the keyboard only", async ({ page }) => {
  const intro = await openGame(page, LAB.slug, LAB.title);
  const levels = intro.getByRole("list").getByRole("button");
  await expect(levels.nth(0)).toBeEnabled();
  await expect(levels.nth(1)).toBeDisabled();

  await intro.getByRole("button", { name: "Jogar fase 1" }).click();
  await expect(intro).toBeHidden();
  const game = stage(page);
  await game.focus();
  const live = page.locator("p[aria-live=polite][aria-atomic=true]");

  await page.keyboard.press("1");
  await expect(live).toContainText("Aperte Enter para colocar");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");

  const result = page.getByRole("dialog", { name: /^Vitória/ });
  await expect(result).toBeVisible({ timeout: 30_000 });
  await expect(result.getByRole("img", { name: "3 de 3 estrelas" })).toBeVisible();

  await result.getByRole("button", { name: "Escolher fase" }).click();
  const again = page.getByRole("dialog", { name: `${LAB.title}: tela de apresentação` });
  await expect(again.getByRole("list").getByRole("button").nth(1)).toBeEnabled();
  await expect(again.getByRole("button", { name: "Jogar fase 2" })).toBeVisible();

  await page.reload();
  const reloaded = await openGame(page, LAB.slug, LAB.title);
  await expect(reloaded.getByRole("button", { name: "Jogar fase 2" })).toBeVisible();
});

test("gives a hint and pauses from the keyboard", async ({ page }) => {
  const intro = await openGame(page, LAB.slug, LAB.title);
  await intro.getByRole("button", { name: "Jogar fase 1" }).click();
  await stage(page).focus();
  const live = page.locator("p[aria-live=polite][aria-atomic=true]");
  await page.keyboard.press("h");
  await expect(live).toContainText("Dica da Lina: Arraste a rampa até a marca tracejada.");
  await page.keyboard.press("Escape");
  const paused = page.getByRole("dialog", { name: "Jogo pausado" });
  await expect(paused).toBeVisible();
  await paused.getByRole("button", { name: /Continuar/ }).click();
  await expect(paused).toBeHidden();
});
