import type { Page } from "@playwright/test";
import { PART_ORDER, type PartType } from "../src/games/bad-ideas-lab/config";
import { LEVELS } from "../src/games/bad-ideas-lab/levels";
import { poseText } from "../src/games/bad-ideas-lab/narration";
import { hear, key, listen, ready, said } from "./announcer";
import { expect, openGame, simTime, stage, test } from "./fixtures";

const LAB = { slug: "bad-ideas-lab", title: "Laboratório de Péssimas Ideias" };

async function startLevel(page: Page, n: number) {
  const intro = await openGame(page, LAB.slug, LAB.title);
  await listen(page);
  await hear(page, () => intro.getByRole("button", { name: `Jogar fase ${n}` }).click(), new RegExp(`^Fase ${n} de 6`), simTime(15_000));
  await stage(page).focus();
}

async function winTutorial(page: Page) {
  await key(page, "1", /Aperte Enter para colocar/);
  await key(page, "Enter", /Rampa no lugar certo/);
  await key(page, "Space", /Máquina ligada/);
  const result = page.getByRole("dialog", { name: /^Vitória/ });
  await expect(result).toBeVisible({ timeout: simTime(30_000) });
  return result;
}

type Rel = { side: "direita" | "esquerda" | null; h: number; v: number; under: boolean };

function parseShelfRelation(text: string): Rel | null {
  const beside = /(logo|(\d+) passos?) à (direita|esquerda) da ponta da prateleira de cima, (na mesma altura|(\d+) passos? (acima|abaixo))/i.exec(text);
  if (beside) {
    const v = beside[4] === "na mesma altura" ? 0 : Number(beside[5]) * (beside[6] === "abaixo" ? 1 : -1);
    return { side: beside[3] as Rel["side"], h: /logo/i.test(beside[1]) ? 0 : Number(beside[2]), v, under: false };
  }
  if (/(abaixo|acima) da prateleira de cima|encostando na prateleira de cima/i.test(text)) return { side: null, h: 0, v: 0, under: true };
  return null;
}

test("level 2 can be explored and solved from the announcements alone", async ({ page }) => {
  test.setTimeout(240_000);
  await startLevel(page, 1);
  const won = await winTutorial(page);
  await hear(page, () => won.getByRole("button", { name: /Próxima fase/ }).click(), /^Fase 2 de 6: Bom dia, Pixel/, simTime(15_000));
  await expect(stage(page)).toBeFocused();

  const description = await key(page, "d", /^Fase 2 de 6/);
  expect(description).toContain("A prateleira de cima fica");
  expect(description).toMatch(/A ponta de baixo fica dentro da área de montagem/);
  expect(description).toContain("O sino é o objetivo");

  const dry = await hear(page, () => page.keyboard.press("Space"), /Tentativa 1\./, simTime(30_000));
  expect(dry).toMatch(/tocou na prateleira de cima/);
  expect(dry).toMatch(/O mais perto que chegou do sino foi \d+ passos/);
  await ready(page);

  let held = await key(page, "1", /^Rampa na mão/);
  for (let i = 0; i < 7 && !held.includes("descendo para a direita, 15 graus"); i += 1) held = await key(page, "r", /^Girou/);

  let browsed = "";
  for (let i = 0; i < 8 && !/A prateleira de cima fica/.test(browsed); i += 1) browsed = await key(page, "o", /de \d+\./);
  expect(browsed).toMatch(/Sua peça fica/);

  let below = 1;
  let last = browsed;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    for (let i = 0; i < 60; i += 1) {
      const rel = parseShelfRelation(last);
      expect(rel, last).not.toBeNull();
      const r = rel!;
      let press: string | null = null;
      if (r.under) press = "ArrowRight";
      else if (r.side === "esquerda") press = "ArrowRight";
      else if (r.h > 0) press = "ArrowLeft";
      else if (r.v < below) press = "ArrowDown";
      else if (r.v > below) press = "ArrowUp";
      if (!press) break;
      last = await key(page, press, /prateleira de cima/);
    }
    const placed = await key(page, "Enter", /colocada|Não dá para colocar/);
    if (placed.startsWith("Não dá")) {
      below += 1;
      last = await key(page, "ArrowDown", /prateleira de cima/);
      continue;
    }
    const outcome = await hear(page, () => page.keyboard.press("Space"), /^(Não deu|Funcionou)/, simTime(30_000));
    if (outcome.startsWith("Funcionou")) {
      expect(outcome).toMatch(/tocou .*na rampa/);
      await expect(page.getByRole("dialog", { name: /^Vitória/ })).toBeVisible({ timeout: simTime(15_000) });
      await test.info().attach("anúncios", { body: (await said(page)).join("\n"), contentType: "text/plain" });
      return;
    }
    expect(outcome).toMatch(/Tentativa \d+\./);
    await ready(page);
    below += 1;
    last = await key(page, "s", /prateleira de cima|Peça 1/);
    last = await key(page, "i", /^Rampa montada/);
  }
  throw new Error(`level 2 not solved. Heard:\n${(await said(page)).join("\n")}`);
});

test("refused, repeated, cancelled and returned actions are always announced", async ({ page }) => {
  await startLevel(page, 1);
  await key(page, "l", /Ainda não teve nenhuma tentativa/);
  await key(page, "1", /Aperte Enter para colocar/);
  let moved = "";
  for (let i = 0; i < 12 && !moved.includes("Não cabe"); i += 1) moved = await key(page, "ArrowUp", /^Para cima/);
  expect(moved).toMatch(/Não cabe: passa da borda de cima da área de montagem/);

  const first = await key(page, "Enter", /^Não dá para colocar aqui/);
  await page.waitForTimeout(600);
  const second = await key(page, "Enter", /^Não dá para colocar aqui/);
  expect(second).toBe(first);
  expect(first).toContain("A rampa continua na mão");

  await page.waitForTimeout(600);
  const refused = await key(page, "Space", /A máquina não ligou/);
  expect(refused).toContain("passa da borda de cima");
  await page.waitForTimeout(600);
  await key(page, "i", /^Rampa na mão.*Não cabe/);
  expect((await said(page)).some((t) => t.includes("Tentativa"))).toBe(false);

  await key(page, "c", /^Cancelado\. A rampa voltou para a caixa\./);
  await page.waitForTimeout(600);
  await key(page, "c", /^Nada para cancelar\./);
  await key(page, "1", /Aperte Enter para colocar/);
  await key(page, "Enter", /Rampa no lugar certo/);
  await key(page, "ArrowRight", /^Movendo a rampa\. Direita\./);
  await key(page, "c", /^Cancelado\. A rampa voltou para onde estava/);
  await page.waitForTimeout(600);
  await key(page, "x", /^A rampa voltou para a caixa\. Na caixa: 1 rampa\./);
  await page.waitForTimeout(600);
  await key(page, "x", /^Nenhuma peça na mão nem escolhida/);
});

test("queries describe the scene without moving anything", async ({ page }) => {
  await startLevel(page, 1);
  const intro = (await said(page)).find((t) => t.startsWith("Fase 1 de 6"))!;
  expect(intro).toContain("Cenário, a partir do cano");
  expect(intro).toContain("D descreve a fase");
  const first = await key(page, "o", /^1 de \d+\. O cano fica/);
  const total = Number(/^1 de (\d+)/.exec(first)![1]);
  await page.waitForTimeout(500);
  await key(page, "Shift+O", new RegExp(`^${total} de ${total}\\. A área de montagem`));
  await page.waitForTimeout(500);
  await key(page, "i", /^Nenhuma peça na mão/);
  await page.waitForTimeout(500);
  await key(page, "d", /^Fase 1 de 6: Primeiro teste\./);
});

test("focus stays on the game after a failed try and moves through the result dialog", async ({ page }) => {
  await startLevel(page, 1);
  const report = await hear(page, () => page.keyboard.press("Space"), /^Não deu\. Tentativa 1\./, simTime(30_000));
  expect(report).toMatch(/Parou|Saiu da garagem/);
  await expect(stage(page)).toBeFocused();
  await ready(page);
  await key(page, "l", /^Tentativa 1\./);
  const result = await winTutorial(page);
  await expect(result.locator(":focus")).toHaveCount(1);
  await result.getByRole("button", { name: /Próxima fase/ }).click();
  await expect(stage(page)).toBeFocused();
});

const SOLUTIONS: Record<string, { type: PartType; x: number; y: number; rot: number }[]> = {
  test: [{ type: "ramp", x: 680, y: 560, rot: 4 }],
  pixel: [{ type: "ramp", x: 620, y: 420, rot: 4 }],
  toast: [{ type: "spring", x: 640, y: 640, rot: 3 }],
  juice: [{ type: "fan", x: 160, y: 580, rot: 0 }],
  remote: [
    { type: "belt", x: 1140, y: 600, rot: 1 },
    { type: "belt", x: 820, y: 640, rot: 1 },
  ],
  finale: [
    { type: "spring", x: 580, y: 400, rot: 3 },
    { type: "belt", x: 1380, y: 540, rot: 0 },
  ],
};

function areaPosition(text: string) {
  const m = /(na borda esquerda|(\d+) passos? da borda esquerda) da área de montagem e (no alto dela|(\d+) passos? abaixo do alto dela)/.exec(text);
  if (!m) return null;
  return { x: m[2] ? Number(m[2]) : 0, y: m[4] ? Number(m[4]) : 0 };
}

test("every level can be finished with the keyboard by following the spoken coordinates", async ({ page }) => {
  test.setTimeout(420_000);
  await startLevel(page, 1);
  for (const [index, level] of LEVELS.entries()) {
    const slots = PART_ORDER.filter((t) => (level.inventory[t] ?? 0) > 0);
    for (const part of SOLUTIONS[level.id]) {
      let heard = await key(page, String(slots.indexOf(part.type) + 1), /na mão/);
      const pose = poseText(part.type, part.rot);
      for (let i = 0; i < 8 && !heard.includes(`${pose}.`); i += 1) heard = await key(page, "r", /^Girou/);
      expect(heard).toContain(pose);
      for (let i = 0; i < 12 && !/A área de montagem/.test(heard); i += 1) heard = await key(page, "o", /de \d+\./);
      const target = { x: (part.x - level.build.x) / 20, y: (part.y - level.build.y) / 20 };
      for (let i = 0; i < 80; i += 1) {
        const at = areaPosition(heard);
        expect(at, heard).not.toBeNull();
        const dx = target.x - at!.x;
        const dy = target.y - at!.y;
        if (dx === 0 && dy === 0) break;
        const horizontal = dx !== 0;
        const d = horizontal ? dx : dy;
        const arrow = horizontal ? (d > 0 ? "ArrowRight" : "ArrowLeft") : d > 0 ? "ArrowDown" : "ArrowUp";
        heard = await key(page, Math.abs(d) >= 3 ? `Shift+${arrow}` : arrow, /área de montagem/);
      }
      await key(page, "Enter", /colocad|lugar certo/);
    }
    const outcome = await hear(page, () => page.keyboard.press("Space"), /^(Não deu|Funcionou)/, simTime(40_000));
    expect(outcome, `${level.id}: ${outcome}`).toMatch(/^Funcionou/);
    const result = page.getByRole("dialog", { name: /^Vitória/ });
    await expect(result).toBeVisible({ timeout: simTime(15_000) });
    if (index === LEVELS.length - 1) break;
    await hear(page, () => result.getByRole("button", { name: /Próxima fase/ }).click(), new RegExp(`^Fase ${index + 2} de 6`), simTime(15_000));
    await expect(stage(page)).toBeFocused();
  }
});
