import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";

type Problems = { list: string[]; allow: (pattern: RegExp) => void };

const SLOW = Number(process.env.E2E_SLOW ?? (process.env.CI ? 3 : 1));

export function simTime(ms: number) {
  return ms * SLOW;
}

const IGNORED = [/Download the React DevTools/, /\[HMR\]/, /\[Fast Refresh\]/, /favicon\.ico/];

export const test = base.extend<{ problems: Problems }>({
  problems: [
    async ({ page }, use) => {
      const allowed = [...IGNORED];
      const problems: Problems = { list: [], allow: (pattern) => allowed.push(pattern) };
      const add = (text: string) => problems.list.push(text);
      page.on("pageerror", (error) => add(`page error: ${error.message}`));
      page.on("console", (message) => {
        if (message.type() === "error") add(`console error: ${message.text()}`);
      });
      page.on("response", (response) => {
        if (response.status() >= 400) add(`http ${response.status()}: ${response.url()}`);
      });
      page.on("requestfailed", (request) => {
        const reason = request.failure()?.errorText ?? "";
        if (!/ERR_ABORTED/.test(reason)) add(`request failed: ${request.url()} ${reason}`);
      });
      await use(problems);
      expect(problems.list.filter((text) => !allowed.some((re) => re.test(text))), "the page should load without errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function openGame(page: Page, slug: string, title: string) {
  await page.goto(`/play/${slug}`);
  const intro = page.getByRole("dialog", { name: `${title}: tela de apresentação` });
  await expect(intro).toBeVisible({ timeout: simTime(45_000) });
  return intro;
}

export function stage(page: Page) {
  return page.getByRole("application");
}

export async function settle(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => {
      if (animation.playState !== "running" || animation.effect?.getComputedTiming().iterations === Infinity) return true;
      const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
      return target instanceof Element && target.closest("[data-testid=tv-screen] > [aria-hidden]") !== null;
    }),
  );
}

export async function accessibilityViolations(page: Page, selector: string) {
  await settle(page);
  const result = await new AxeBuilder({ page }).include(selector).analyze();
  return result.violations;
}
