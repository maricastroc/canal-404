import { expect, test } from "./fixtures";

const SECTIONS = [
  { link: "Jogos", heading: "Catálogo de jogos", path: "/games" },
  { link: "Personagens", heading: "Personagens do canal", path: "/characters" },
  { link: "Extras", heading: "Extras", path: "/extras" },
  { link: "Sobre", heading: "Sobre o canal", path: "/about" },
];

test("opens the broadcast room and welcomes a first-time visitor", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Abrir a caixa de pizza" })).toBeVisible();
  await expect(page.getByRole("status").or(page.locator("[aria-live=polite]")).getByText("Sintonizou!")).toBeVisible();
});

for (const section of SECTIONS) {
  test(`reaches ${section.path} from the top navigation`, async ({ page }) => {
    await page.goto("/games");
    const nav = page.getByRole("navigation", { name: "Principal" });
    await nav.getByRole("link", { name: section.link, exact: true }).click();
    await expect(page).toHaveURL(section.path);
    await expect(page.getByRole("heading", { level: 1, name: section.heading })).toBeVisible();
    await expect(nav.getByRole("link", { name: section.link, exact: true })).toHaveAttribute("aria-current", "page");
  });
}

test("filters the catalog by category", async ({ page }) => {
  await page.goto("/games");
  const filters = page.getByRole("group", { name: "Filtrar jogos por categoria" });
  const cards = page.locator("main ul > li");
  await expect(cards).toHaveCount(6);
  await filters.getByRole("button", { name: /^Puzzle/ }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Laboratório de Péssimas Ideias");
  await filters.getByRole("button", { name: /^Todos/ }).click();
  await expect(cards).toHaveCount(6);
});

test("keeps secrets and achievements after a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir a caixa de pizza" }).press("Enter");
  await expect(page.getByText("Pizza Arqueológica")).toBeVisible();
  await page.goto("/extras");
  await expect(page.getByRole("progressbar", { name: "Segredos encontrados" })).toHaveAttribute("aria-valuenow", "1");
  await page.reload();
  await expect(page.getByRole("progressbar", { name: "Segredos encontrados" })).toHaveAttribute("aria-valuenow", "1");
  await expect(page.getByRole("progressbar", { name: "Conquistas" })).toHaveAttribute("aria-valuenow", "1");
});

test("erases progress only after confirming", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir a caixa de pizza" }).press("Enter");
  await page.goto("/extras");
  const secrets = page.getByRole("progressbar", { name: "Segredos encontrados" });
  await expect(secrets).toHaveAttribute("aria-valuenow", "1");
  await page.getByRole("button", { name: "Apagar meu progresso" }).click();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(secrets).toHaveAttribute("aria-valuenow", "1");
  await page.getByRole("button", { name: "Apagar meu progresso" }).click();
  await page.getByRole("button", { name: "Sim, apagar tudo" }).click();
  await expect(secrets).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByRole("progressbar", { name: "Conquistas" })).toHaveAttribute("aria-valuenow", "1");
});

test("shows the off-air page for an unknown address", async ({ page, problems }) => {
  problems.allow(/404.*canal-perdido|canal-perdido.*404|status of 404/);
  const response = await page.goto("/canal-perdido");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Esse canal está fora do ar" })).toBeVisible();
  await page.getByRole("link", { name: "Ver os jogos" }).click();
  await expect(page).toHaveURL("/games");
});
