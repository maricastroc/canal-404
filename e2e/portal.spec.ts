import { expect, test } from "./fixtures";

const SECTIONS = [
  { link: "Jogos", heading: "Catálogo de jogos", path: "/games" },
  { link: "Recordes", heading: "Fliperama de recordes", path: "/records" },
  { link: "Personagens", heading: "Personagens do canal", path: "/characters" },
  { link: "Extras", heading: "Extras", path: "/extras" },
  { link: "Sobre", heading: "Sobre o canal", path: "/about" },
];

test("opens the broadcast room and every section from the top navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Abrir a caixa de pizza" })).toBeVisible();
  await page.goto("/games");
  const nav = page.getByRole("navigation", { name: "Principal" });
  for (const section of SECTIONS) {
    await nav.getByRole("link", { name: section.link, exact: true }).click();
    await expect(page).toHaveURL(section.path);
    await expect(page.getByRole("heading", { level: 1, name: section.heading })).toBeVisible();
  }
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
