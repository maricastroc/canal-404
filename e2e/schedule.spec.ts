import { expect, test } from "./fixtures";

const knob = (page: import("@playwright/test").Page) => page.getByRole("button", { name: /^Mudar de canal/ });

test("the TV tunes to the next suggested program and still hides the lost channel", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /^Jogar agora.*, jogo da semana$/ })).toBeVisible();
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

test("the catalog marks new, rerun and weekly programs", async ({ page }) => {
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
  await expect(page.getByText("Jogo da semana", { exact: true })).toHaveCount(1);
});
