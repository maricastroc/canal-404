import { expect, openGame, simTime, stage, test } from "./fixtures";

const TITLE = "Guerra do Pijama";

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 600 },
  { width: 844, height: 390 },
  { width: 390, height: 844 },
];

for (const viewport of VIEWPORTS) {
  test(`keeps the intro inside a ${viewport.width}x${viewport.height} screen with the instructions open`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const intro = await openGame(page, "pajama-war", TITLE);
    const play = intro.getByRole("button", { name: /^Jogar arena 1$/ });
    const fits = async () => {
      await expect(intro.getByRole("heading", { level: 1 })).toBeInViewport();
      await expect(play).toBeInViewport({ ratio: 1 });
      const overflow = await page.evaluate(() => document.scrollingElement!.scrollHeight - window.innerHeight);
      expect(overflow).toBeLessThanOrEqual(0);
    };
    await fits();
    await expect(intro.getByRole("heading", { name: "Escolha a arena" })).toBeVisible();
    await intro.getByRole("button", { name: "Como jogar" }).click();
    await expect(intro.getByRole("heading", { name: "Escolha a arena" })).toBeHidden();
    await expect(intro.locator("#how-to-play-panel")).toBeVisible();
    await fits();
    await intro.getByRole("button", { name: "Ver arenas" }).click();
    await expect(intro.getByRole("heading", { name: "Escolha a arena" })).toBeVisible();
    await fits();
  });
}

test("picks a kid with the keyboard, starts the fight and pauses it", async ({ page }) => {
  const intro = await openGame(page, "pajama-war", TITLE);
  await intro.getByRole("button", { name: /^Jogar arena 1$/ }).click();
  await expect(intro).toBeHidden();
  const announcer = page.getByTestId("game-announcer");
  await expect(announcer).toContainText("Escolha seu personagem", { timeout: simTime(15_000) });
  await stage(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect(announcer).toHaveText(/Nico, o atirador\.\s*$/);
  for (const key of ["ArrowLeft", "ArrowRight", "ArrowRight", "Enter"]) await page.keyboard.press(key);
  await expect(announcer).toContainText("Você é a Bia", { timeout: simTime(15_000) });
  await page.keyboard.press("Escape");
  const paused = page.getByRole("dialog", { name: "Jogo pausado" });
  await expect(paused).toBeVisible();
  await paused.getByRole("button", { name: /Continuar/ }).click();
  await expect(paused).toBeHidden();
});
