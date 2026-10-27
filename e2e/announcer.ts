import { expect, type Page } from "@playwright/test";
import { simTime } from "./fixtures";

type Spoken = { __said: string[] };

export async function listen(page: Page) {
  await page.evaluate(() => {
    const root = document.querySelector('[data-testid="game-announcer"]');
    if (!root) throw new Error("announcer not found");
    const w = window as unknown as Spoken;
    w.__said = [];
    const previous = new Map<Element, string>();
    root.querySelectorAll("p").forEach((p) => previous.set(p, p.textContent ?? ""));
    new MutationObserver(() => {
      root.querySelectorAll("p").forEach((p) => {
        const text = p.textContent ?? "";
        if (text && text !== previous.get(p)) w.__said.push(text);
        previous.set(p, text);
      });
    }).observe(root, { subtree: true, childList: true, characterData: true });
  });
}

export async function said(page: Page) {
  return page.evaluate(() => (window as unknown as Spoken).__said);
}

export async function hear(page: Page, action: () => Promise<unknown>, match: RegExp = /./, timeout = simTime(5_000)) {
  const before = (await said(page)).length;
  await action();
  let heard = "";
  await expect
    .poll(
      async () => {
        const fresh = (await said(page)).slice(before).filter((t) => match.test(t));
        heard = fresh[fresh.length - 1] ?? "";
        return heard !== "";
      },
      { timeout, message: `expected an announcement matching ${match}` },
    )
    .toBe(true);
  return heard;
}

export async function key(page: Page, name: string, match: RegExp = /./) {
  return hear(page, () => page.keyboard.press(name), match);
}

export async function ready(page: Page, timeout = simTime(20_000)) {
  const end = Date.now() + timeout;
  for (;;) {
    try {
      return await hear(page, () => page.keyboard.press("c"), /Nada para cancelar/, 1_000);
    } catch (error) {
      if (Date.now() > end) throw error;
    }
  }
}
