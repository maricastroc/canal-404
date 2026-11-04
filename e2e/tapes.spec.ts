import type { Page } from "@playwright/test";
import { accessibilityViolations, expect, test } from "./fixtures";

const knob = (page: Page) => page.getByRole("button", { name: /^Mudar de canal/ });
const shelf = (page: Page) => page.getByRole("button", { name: "Estante de fitas VHS: escolher uma fita" });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Estante de fitas" });

test("plays a tape from the shelf, swaps it and ejects it from the VCR", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^A seguir:/ })).toBeVisible();
  await shelf(page).press("Enter");
  await expect(dialog(page)).toBeVisible();
  expect(await accessibilityViolations(page, '[role="dialog"]')).toEqual([]);

  await dialog(page).getByRole("button", { name: /^Colocar a fita Karaokê/ }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(shelf(page)).toBeFocused();
  await expect(knob(page)).toHaveAccessibleName(/Canal atual: AV, Fita: Karaokê do 404/);
  await expect(page.getByRole("button", { name: /^A seguir:/ })).toHaveCount(0);

  await shelf(page).press("Enter");
  await expect(dialog(page)).toContainText("Tocando agora: Karaokê");
  await expect(dialog(page).getByRole("button", { name: /^Colocar a fita/ })).toHaveCount(4);
  await dialog(page).getByRole("button", { name: /^Colocar a fita Rua S\/ Saída/ }).click();
  await expect(knob(page)).toHaveAccessibleName(/Fita: comercial da Rua Sem Saída/);
  await expect(page.getByRole("link", { name: /^Jogar agora.*Rua Sem Saída$/ })).toHaveAttribute("href", "/play/dead-end-street");

  await page.getByRole("button", { name: "Videocassete: ejetar a fita Rua S/ Saída" }).press("Enter");
  await expect(knob(page)).not.toHaveAccessibleName(/Canal atual: AV/);
  await expect(page.getByRole("button", { name: /^A seguir:/ })).toBeVisible();
});

test("the torn tape still unlocks the mysterious tape secret", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Videocassete vazio: abrir a estante de fitas" }).press("Enter");
  await dialog(page).getByRole("button", { name: "Colocar a fita de etiqueta rasgada: Não assis…" }).click();
  await expect(knob(page)).toHaveAccessibleName(/Fita misteriosa no videocassete/);
  await expect(page.getByText("Fita Misteriosa", { exact: true })).toBeVisible();
});

test("closes the shelf with Escape and gives focus back", async ({ page }) => {
  await page.goto("/");
  await shelf(page).press("Enter");
  await expect(dialog(page).getByRole("button", { name: /^Colocar a fita Desenhos 03/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(shelf(page)).toBeFocused();
  await expect(knob(page)).not.toHaveAccessibleName(/Canal atual: AV/);
});
