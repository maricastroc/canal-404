import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 4404}`;
const OUT = new URL("../public/og/", import.meta.url);
const SIZE = { width: 1200, height: 630 };
const SLUGS = ["dead-end-street", "bad-ideas-lab", "food-fight", "operation-recess", "pajama-war", "off-air-vacation"];

const returningVisitor = {
  version: 1,
  visitorNumber: 84404,
  visits: 5,
  firstVisitAt: 0,
  lastVisitAt: 0,
  settings: { sfx: false, music: false, track: "theme" },
  secrets: {},
  achievements: { "first-visit": 1 },
  games: {},
  counters: {},
};

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: process.env.CI ? undefined : "chrome" });
const ROOM_SCALE = 0.625;

async function open(scale) {
  const context = await browser.newContext({
    viewport: { width: Math.round(SIZE.width / scale), height: Math.round(SIZE.height / scale) },
    deviceScaleFactor: scale,
    reducedMotion: "reduce",
  });
  await context.addInitScript((progress) => {
    localStorage.setItem("canal404:progress:v1", JSON.stringify(progress));
    sessionStorage.setItem("canal404:session", "1");
  }, returningVisitor);
  return context.newPage();
}

async function shoot(path, name, ready, scale = 1) {
  const page = await open(scale);
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.evaluate(() => document.fonts.ready);
  await ready(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: new URL(`${name}.png`, OUT).pathname, scale: "device" });
  await page.context().close();
  console.log(`og/${name}.png`);
}

await shoot(
  "/",
  "canal-404",
  async (page) => {
    await page.getByRole("button", { name: "Abrir a caixa de pizza" }).waitFor();
    await page.getByText("Ei! Você voltou!").first().waitFor();
    await page.waitForTimeout(2500);
  },
  ROOM_SCALE,
);
for (const slug of SLUGS) await shoot(`/og-card/${slug}`, slug, (page) => page.locator("[data-og-card]").waitFor());

await browser.close();
