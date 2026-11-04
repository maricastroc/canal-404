import { expect, test } from "./fixtures";

const KB = 1024;
const PAGE_BUDGET = 1300 * KB;
const CHUNK_BUDGET = 400 * KB;
const PAGES = ["/", "/games", "/games/food-fight", "/records", "/characters", "/extras"];

test.skip(!process.env.CI && !process.env.E2E_PROD, "budgets are measured against a production build");

for (const path of PAGES) {
  test(`keeps ${path} within the JavaScript budget`, async ({ page }) => {
    const scripts = new Map<string, number>();
    page.on("response", async (response) => {
      if (response.request().resourceType() !== "script") return;
      const body = await response.body().catch(() => null);
      if (body) scripts.set(response.url(), body.length);
    });
    await page.goto(path, { waitUntil: "networkidle" });
    const total = [...scripts.values()].reduce((a, b) => a + b, 0);
    const biggest = Math.max(...scripts.values());
    test.info().annotations.push({ type: "javascript", description: `${Math.round(total / KB)} KB in ${scripts.size} files, largest ${Math.round(biggest / KB)} KB` });
    expect(total, "total JavaScript for the page").toBeLessThan(PAGE_BUDGET);
    expect(biggest, "no portal page should download the game engine").toBeLessThan(CHUNK_BUDGET);
  });
}

test("loads the game engine only on the play page", async ({ page }) => {
  let engine = 0;
  page.on("response", async (response) => {
    if (response.request().resourceType() !== "script") return;
    const body = await response.body().catch(() => null);
    if (body && body.length > CHUNK_BUDGET) engine += 1;
  });
  await page.goto("/play/food-fight", { waitUntil: "networkidle" });
  await expect(page.getByRole("dialog", { name: /tela de apresentação/ })).toBeVisible();
  expect(engine).toBe(1);
});
