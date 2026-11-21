import { PLAYABLE } from "../src/games/registry";
import { expect, openGame, stage, test } from "./fixtures";

const START = /^(Jogar( fase 1| arena 1| pista 1| parte 1)?|Começar aventura)$/;

test.describe.configure({ mode: "parallel" });

for (const game of PLAYABLE) {
  test(`${game.title} opens from its page, starts, pauses and resumes`, async ({ page }) => {
    await page.goto(`/games/${game.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("link", { name: /Jogar/ }).first().click();
    await expect(page).toHaveURL(`/play/${game.slug}`);

    const intro = await openGame(page, game.slug, game.title);
    await intro.getByRole("button", { name: START }).click();
    await expect(intro).toBeHidden();
    const canvas = stage(page).locator("canvas");
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(300);
    expect(box?.height).toBeGreaterThan(150);

    await page.getByRole("button", { name: "Pausar" }).click();
    const paused = page.getByRole("dialog", { name: "Jogo pausado" });
    await expect(paused).toBeVisible();
    await paused.getByRole("button", { name: /Continuar/ }).click();
    await expect(paused).toBeHidden();
    await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
  });
}
