import type { Page } from "@playwright/test";
import { accessibilityViolations, expect, test } from "./fixtures";

const TAPES = [
  { button: /^Colocar a fita Desenhos 03/, label: "Desenhos 03", channel: "Fita: Desenhos 03" },
  { button: /^Colocar a fita Rua S\/ Saída/, label: "Rua S/ Saída", channel: "Fita: comercial da Rua Sem Saída" },
  { button: /^Colocar a fita Férias 2004/, label: "Férias 2004", channel: "Fita: Férias 2004" },
  { button: /^Colocar a fita Karaokê/, label: "Karaokê", channel: "Fita: Karaokê do 404" },
  { button: /^Colocar a fita de etiqueta rasgada/, label: "Não assista", channel: "Fita misteriosa no videocassete" },
];

const knob = (page: Page) => page.getByRole("button", { name: /^Mudar de canal/ });
const shelf = (page: Page) => page.getByRole("button", { name: "Estante de fitas VHS: escolher uma fita" });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Estante de fitas" });
const zoom = (page: Page) => page.getByRole("dialog", { name: "TV de perto" });
const roomScreen = (page: Page) => page.locator(".room-scene [data-testid=tv-screen]");

async function channelNumber(page: Page) {
  const label = (await knob(page).getAttribute("aria-label")) ?? "";
  return /Canal atual: (\w+)/.exec(label)![1];
}

async function insert(page: Page, tape: (typeof TAPES)[number]) {
  await shelf(page).press("Enter");
  await expect(dialog(page)).toBeVisible();
  await dialog(page).getByRole("button", { name: tape.button }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(knob(page)).toHaveAccessibleName(new RegExp(`Canal atual: AV, ${tape.channel}`));
}

test("plays each of the five tapes and keeps the shelf, the VCR and the TV in sync", async ({ page }) => {
  await page.goto("/");
  for (const tape of TAPES) {
    await insert(page, tape);
    await expect(page.getByRole("button", { name: `Videocassete: ejetar a fita ${tape.label}` })).toBeVisible();
    await shelf(page).press("Enter");
    await expect(dialog(page)).toContainText(`No vídeo: ${tape.label}`);
    await expect(dialog(page).getByRole("button", { name: /^Colocar a fita/ })).toHaveCount(4);
    await expect(dialog(page).getByRole("button", { name: tape.button })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
  }
});

test("swaps tapes directly and ejects back to the channel that was on", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^A seguir:/ })).toBeVisible();
  const before = await channelNumber(page);
  await shelf(page).press("Enter");
  expect(await accessibilityViolations(page, '[role="dialog"]')).toEqual([]);
  await dialog(page).getByRole("button", { name: TAPES[3].button }).click();
  await expect(knob(page)).toHaveAccessibleName(/Fita: Karaokê do 404/);
  await expect(shelf(page)).toBeFocused();
  await expect(page.getByRole("button", { name: /^A seguir:/ })).toHaveCount(0);

  await insert(page, TAPES[1]);
  await expect(page.getByRole("link", { name: /^Jogar agora.*Rua Sem Saída$/ })).toHaveAttribute("href", "/play/dead-end-street");
  await shelf(page).press("Enter");
  await expect(dialog(page).getByRole("button", { name: TAPES[3].button })).toBeVisible();
  await dialog(page).getByRole("button", { name: "Ejetar Rua S/ Saída" }).click();
  await expect(knob(page)).toHaveAccessibleName(new RegExp(`Canal atual: ${before},`));
  await expect(page.getByRole("button", { name: "Videocassete vazio: abrir a estante de fitas" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^A seguir:/ })).toBeVisible();
});

test("zooms into a tape without restarting it and gives focus back", async ({ page }) => {
  await page.goto("/");
  await insert(page, TAPES[3]);
  const since = await roomScreen(page).getAttribute("data-since");
  await page.waitForTimeout(1200);
  const zoomButton = page.getByRole("button", { name: "Ver a TV de perto" });
  await zoomButton.click();
  await expect(zoom(page)).toBeVisible();
  await expect(zoom(page).getByRole("button", { name: "Voltar pra sala" })).toBeFocused();
  const big = zoom(page).getByTestId("tv-screen");
  await expect(big).toHaveAttribute("data-since", since!);
  await expect(big).toHaveAttribute("data-channel", "tape-karaoke");
  const box = (await big.boundingBox())!;
  expect(box.width).toBeGreaterThan(400);
  expect(await accessibilityViolations(page, '[role="dialog"]')).toEqual([]);

  await page.keyboard.press("Tab");
  await expect(zoom(page).getByRole("button", { name: "Voltar pra sala" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(zoom(page)).toBeHidden();
  await expect(zoomButton).toBeFocused();
  await expect(roomScreen(page)).toHaveAttribute("data-since", since!);
  await expect(knob(page)).toHaveAccessibleName(/Fita: Karaokê do 404/);
});

test("zooms into a regular channel and keeps its play link", async ({ page }) => {
  await page.goto("/");
  const play = page.getByRole("link", { name: /^Jogar agora.*, jogo da semana$/ });
  const href = await play.getAttribute("href");
  await page.getByRole("button", { name: "Ver a TV de perto" }).click();
  await expect(zoom(page).getByRole("link", { name: /^Jogar agora.*, jogo da semana$/ })).toHaveAttribute("href", href!);
  await zoom(page).getByRole("button", { name: "Voltar pra sala" }).click();
  await expect(zoom(page)).toBeHidden();
  await expect(knob(page)).toHaveAccessibleName(/^Mudar de canal\. Canal atual: \d+/);
});

test("the torn tape unlocks its secret once, ejects itself and works again", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Videocassete vazio: abrir a estante de fitas" }).press("Enter");
  await dialog(page).getByRole("button", { name: TAPES[4].button }).click();
  await expect(knob(page)).toHaveAccessibleName(/Fita misteriosa no videocassete/);
  await expect(page.getByText("Fita Misteriosa", { exact: true })).toBeVisible();
  await expect(knob(page)).not.toHaveAccessibleName(/Canal atual: AV/, { timeout: 25_000 });
  await expect(page.getByRole("button", { name: "Videocassete vazio: abrir a estante de fitas" })).toBeVisible();

  await insert(page, TAPES[4]);
  await page.goto("/extras");
  const secrets = page.getByRole("progressbar", { name: "Segredos encontrados" });
  await expect(secrets).toHaveAttribute("aria-valuenow", "1");
  await page.reload();
  await expect(secrets).toHaveAttribute("aria-valuenow", "1");
});

test("closes the shelf with Escape and gives focus back", async ({ page }) => {
  await page.goto("/");
  await shelf(page).press("Enter");
  await expect(dialog(page).getByRole("button", { name: TAPES[0].button })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog(page).getByRole("button", { name: TAPES[1].button })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(shelf(page)).toBeFocused();
  await expect(knob(page)).not.toHaveAccessibleName(/Canal atual: AV/);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("puts tapes in without flying them and opens the zoom right away", async ({ page }) => {
    await page.goto("/");
    await shelf(page).press("Enter");
    await dialog(page).getByRole("button", { name: TAPES[2].button }).click();
    await expect(knob(page)).toHaveAccessibleName(/Fita: Férias 2004/);
    await expect(page.getByTestId("tape-flight")).toHaveCount(0);
    await page.getByRole("button", { name: "Ver a TV de perto" }).click();
    await expect(zoom(page).getByTestId("tv-screen")).toHaveAttribute("data-channel", "tape-resort");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Videocassete: ejetar a fita Férias 2004" }).press("Enter");
    await expect(page.getByTestId("tape-flight")).toHaveCount(0);
    await expect(knob(page)).not.toHaveAccessibleName(/Canal atual: AV/);
  });
});
