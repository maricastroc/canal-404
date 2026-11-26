import * as Phaser from "phaser";
import type { RaceCopy } from "../copy";
import type { Course, FeiraSet } from "../sim/course";
import { AWNING } from "../sim/feira";
import { heightAt, type Obstacle } from "../sim/track";
import { INK } from "./cart";
import type { Extra } from "./cast";
import { drawFrontWall, facadeRow, PAD, placed, poleLine, SAMPLE_RES, type SampleSpots } from "./sample";
import { BACK_LANE, LANE_OFFSETS, STREET, type Builder } from "./terrain";

const NAMES = [
  "banca-frutas",
  "banca-verduras",
  "banca-pastel",
  "banca-flores",
  "caixote",
  "caixote-laranja",
  "melancia",
  "laranja",
  "melancia-capacete",
  "carrinho-feira",
  "carrinho-tombado",
  "dona-cidinha-idle",
  "dona-cidinha-cheer",
  "pombo-a",
  "pombo-b",
  "pombo-voa-a",
  "pombo-voa-b",
  "caixotes-tombados",
  "banco-praca",
  "chafariz",
  "poste-praca",
];

export const FEIRA_FILES: [string, string][] = NAMES.map((n) => [`f-${n}`, n]);

export const CIDINHA: Extra = { id: "cidinha", kind: "full", idle: "f-dona-cidinha-idle", cheer: "f-dona-cidinha-cheer", height: (176 * 270) / 232 };

const STALL_SCALE = 0.84;
const STALLS = ["banca-frutas", "banca-verduras", "banca-pastel", "banca-flores"] as const;
const CLOTH: [number, number][] = [
  [0xffc83d, 0xfffaf0],
  [0x63d6c1, 0xfffaf0],
  [0xef4f43, 0xfffaf0],
  [0xf06ba8, 0xfffaf0],
  [0x5cb9f0, 0xfffaf0],
];

function v(x: number, y: number) {
  return new Phaser.Math.Vector2(x, y);
}

export function feiraSet(course: Course) {
  return course.set?.kind === "feira" ? course.set : null;
}

export function awningGaps(set: FeiraSet) {
  const gaps: [number, number][] = [];
  for (let i = 0; i + 1 < set.awnings.length; i += 1) gaps.push([set.awnings[i] + AWNING.length, set.awnings[i + 1]]);
  return gaps;
}

export function dressFeira(b: Builder, course: Course, copy: RaceCopy): SampleSpots {
  const set = course.set as FeiraSet;
  const road = course.surfaces[0];
  const blocked: [number, number][] = [
    [course.start - 700, course.start + 900],
    [set.stairs.x0 - 200, set.stairs.x1 + 500],
    [set.plaza.x0 + 300, set.plaza.x1],
    ...set.fruit.map((f): [number, number] => [f.crate - 220, f.crate + 260]),
  ];
  for (const x0 of set.awnings) blocked.push([x0 - 40, x0 + AWNING.length + 40]);
  const gaps = awningGaps(set);
  facadeRow(b, road.x0 + 600, set.stairs.x0 - 200, blocked.filter(([a]) => a < set.market.x0 || a > set.market.x1).concat([[set.market.x0 - 100, set.market.x1 + 300]]));
  facadeRow(b, set.market.x0 - 100, set.market.x1 + 300, [[set.crateRamp.x0 - 300, set.crateRamp.x1 + 100]]);
  poleLine(b, road.x0 + 1500, set.market.x0 - 200);
  poleLine(b, set.market.x1 + 400, set.stairs.x0 - 300);
  for (const tx of [course.start + 3000, course.start + 7800, set.market.x1 + 1400, set.stairs.x0 - 1500]) if (!blocked.some(([a, c]) => tx + 140 > a && tx - 140 < c)) placed(b, "s-ipe", tx, 0.72, -7.4, "center", 6);
  placed(b, "s-orelhao", course.start + 5200, 0.72, -7.3, "center", 6);
  placed(b, "s-lixeira", set.market.x1 + 900, 0.72, -7.2, "center", 6);
  for (const f of set.fruit) placed(b, "f-caixotes-tombados", f.crate, 0.62, -7, "center", 4);
  drawFrontWall(b, road.x0, road.x1);
  bunting(b, set.market.x0 + 600, set.market.x1 - 300);
  gate(b, set.market.x0 + 260, copy.feira.fair, 0x2fa996);
  closingTime(b, course, copy);
  stairsWall(b, course, set.stairs.x0 - 200, set.stairs.x1 + 600);
  plaza(b, course, set.plaza, copy);
  for (const [a, c] of gaps) b.taken.push([a + 40, c - 40]);
  return {
    neighbors: [
      { who: "zeze", x: gaps[3][0] + 160 },
      { who: "tonho", x: gaps[5][0] + 360 },
      { who: "juninho", x: set.market.x1 + 2200 },
    ],
    kite: null,
  };
}

function closingTime(b: Builder, course: Course, copy: RaceCopy) {
  const set = course.set as FeiraSet;
  const fruit = set.fruit[1];
  const start = course.sections.find((s) => s.key === "descent2")?.x ?? fruit.x0 - 900;
  gate(b, start + 260, copy.feira.sale, 0xef4f43);
  bunting(b, start + 700, fruit.x1);
  STALLS.forEach((key, i) => {
    if (i === 2) return;
    const x = fruit.x0 + 520 + i * 1050;
    const { w } = placed(b, `f-${key}`, x, STALL_SCALE * 0.92, -12.2);
    b.taken.push([x - 20, x + w + 20]);
  });
}

function bunting(b: Builder, from: number, to: number) {
  const colors = [0xef4f43, 0xffc83d, 0x63d6c1, 0xf06ba8, 0x5cb9f0, 0x93cf4c];
  for (let x = from; x < to; x += 900) {
    const x1 = x + 900;
    const y0 = b.backY(x) - 330;
    const y1 = b.backY(x1) - 330;
    const g = b.add(b.chunkFor(x + 450), b.scene.add.graphics());
    g.setDepth(-11);
    const curve = new Phaser.Curves.QuadraticBezier(v(x, y0), v(x + 450, (y0 + y1) / 2 + 70), v(x1, y1));
    g.lineStyle(3, INK, 0.8);
    curve.draw(g, 24);
    for (let k = 1; k < 14; k += 1) {
      const p = curve.getPoint(k / 14);
      g.fillStyle(INK, 1);
      g.fillTriangle(p.x - 17, p.y - 2, p.x + 17, p.y - 2, p.x, p.y + 34);
      g.fillStyle(colors[(k + Math.floor(x / 900)) % colors.length], 1);
      g.fillTriangle(p.x - 12, p.y + 1, p.x + 12, p.y + 1, p.x, p.y + 27);
    }
  }
}

function gate(b: Builder, x: number, text: string, color: number) {
  const c = b.chunkFor(x);
  const y = b.backY(x);
  const label = b.add(c, b.scene.add.text(x, y - 330, text, { fontFamily: b.fonts.display, fontSize: "40px", color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 9 }));
  label.setOrigin(0.5).setDepth(-10.9);
  const w = label.width + 70;
  const g = b.add(c, b.scene.add.graphics());
  g.setDepth(-11);
  g.fillStyle(INK, 1);
  g.fillRect(x - w / 2 + 10, y - 330, 14, 334);
  g.fillRect(x + w / 2 - 24, y - 330, 14, 334);
  g.fillRoundedRect(x - w / 2 - 6, y - 368, w + 12, 76, 14);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x - w / 2, y - 362, w, 64, 10);
  b.taken.push([x - w / 2 - 20, x + w / 2 + 20]);
}

export function stairsWall(b: Builder, course: Course, x0: number, x1: number) {
  const road = course.surfaces[0];
  const g = b.add(b.chunkFor((x0 + x1) / 2), b.scene.add.graphics());
  g.setDepth(-8);
  const top = (x: number) => heightAt(road, x) - STREET - 24;
  const pts: Phaser.Math.Vector2[] = [];
  for (let x = x0; x <= x1; x += 90) pts.push(v(x, top(x) - 120));
  const base: Phaser.Math.Vector2[] = [];
  for (let x = x1; x >= x0; x -= 90) base.push(v(x, top(x) + 8));
  g.fillStyle(INK, 1);
  g.fillPoints([...pts.map((p) => v(p.x, p.y - 6)), ...base], true);
  g.fillStyle(0xe7d5b8, 1);
  g.fillPoints([...pts, ...base], true);
  g.lineStyle(3, 0xc9ad7a, 1);
  for (let row = 1; row < 4; row += 1) {
    g.beginPath();
    pts.forEach((p, k) => (k === 0 ? g.moveTo(p.x, p.y + row * 32) : g.lineTo(p.x, p.y + row * 32)));
    g.strokePath();
  }
  g.fillStyle(0xd4bf98, 1);
  g.fillPoints([...pts.map((p) => v(p.x, p.y - 4)), ...pts.slice().reverse().map((p) => v(p.x, p.y + 12))], true);
  g.lineStyle(5, INK, 1);
  g.strokePoints(pts.map((p) => v(p.x, p.y - 4)), false);
  for (let x = x0 + 120; x < x1 - 60; x += 260) {
    const y = top(x) - 124;
    g.fillStyle(INK, 1);
    g.fillRoundedRect(x - 34, y - 6, 68, 34, 6);
    g.fillStyle(0xff8a3d, 1);
    g.fillRoundedRect(x - 29, y - 1, 58, 24, 4);
    for (let k = 0; k < 4; k += 1) {
      g.fillStyle(INK, 1);
      g.fillCircle(x - 21 + k * 14, y - 12 - (k % 2) * 8, 13);
      g.fillStyle(k % 2 ? 0x4c9a43 : 0x2f6e35, 1);
      g.fillCircle(x - 21 + k * 14, y - 12 - (k % 2) * 8, 9);
    }
    g.fillStyle(INK, 1);
    g.fillCircle(x - 6, y - 26, 7);
    g.fillStyle([0xf06ba8, 0xffc83d, 0xef4f43][Math.floor(x / 260) % 3], 1);
    g.fillCircle(x - 6, y - 26, 4);
  }
  b.taken.push([x0, x1]);
}

export function plaza(b: Builder, course: Course, area: { x0: number; x1: number }, copy: RaceCopy) {
  const road = course.surfaces[0];
  const x0 = area.x0;
  const x1 = area.x1;
  for (let c0 = x0; c0 < x1; c0 += 1800) {
    const c1 = Math.min(x1, c0 + 1800);
    const g = b.add(b.chunkFor(c0 + 10), b.scene.add.graphics());
    g.setDepth(0.4);
    g.lineStyle(5, INK, 0.22);
    for (let row = 0; row < 3; row += 1) {
      g.beginPath();
      for (let x = c0; x <= c1; x += 55) {
        const y = heightAt(road, x) - 22 - row * 40 + Math.sin(x / 70 + row) * 9;
        if (x === c0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    }
  }
  const fountain = x0 + 1900;
  placed(b, "f-chafariz", fountain, 0.9, -9, "center", 6);
  b.taken.push([fountain - 190, fountain + 190]);
  for (const bx of [x0 + 1200, fountain + 600, course.finish + 900]) {
    placed(b, "f-banco-praca", bx, 0.8, -7.6, "center", 6);
    b.taken.push([bx - 130, bx + 130]);
  }
  for (const lx of [x0 + 820, fountain - 420, fountain + 1150, course.finish + 1500]) {
    placed(b, "f-poste-praca", lx, 0.9, -7.8, "center", 6);
    b.taken.push([lx - 50, lx + 50]);
  }
  for (const tx of [x0 + 2700, course.finish + 2200]) placed(b, "s-ipe", tx, 0.72, -9.5, "center", 6);
  const signX = x0 + 450;
  const c = b.chunkFor(signX);
  const y = b.backY(signX);
  const label = b.add(c, b.scene.add.text(signX, y - 220, copy.feira.plaza, { fontFamily: b.fonts.display, fontSize: "26px", color: "#fbf5e6" }));
  label.setOrigin(0.5).setDepth(-6.9);
  const pg = b.add(c, b.scene.add.graphics());
  pg.setDepth(-7);
  const w = label.width + 32;
  pg.fillStyle(INK, 1);
  pg.fillRect(signX - 7, y - 200, 14, 204);
  pg.fillRoundedRect(signX - w / 2 - 5, y - 247, w + 10, 54, 8);
  pg.fillStyle(0x2f86c9, 1);
  pg.fillRoundedRect(signX - w / 2, y - 242, w, 44, 6);
  b.taken.push([signX - w / 2 - 20, signX + w / 2 + 20]);
}

export function drawFeira(b: Builder, course: Course, copy: RaceCopy) {
  const set = course.set as FeiraSet;
  const road = course.surfaces[0];
  set.awnings.forEach((x0, i) => {
    const surface = course.surfaces[1 + i];
    const stallKey = `f-${STALLS[i % STALLS.length]}`;
    const tex = b.scene.textures.get(stallKey).getSourceImage();
    const stallW = ((tex.width || 600) / SAMPLE_RES - (PAD + 36) * 2) * STALL_SCALE;
    const sx = x0 + (AWNING.length - stallW) / 2;
    placed(b, stallKey, sx, STALL_SCALE, -12.2);
    awning(b, surface, CLOTH[i % CLOTH.length]);
    const text = [copy.feira.fruit, copy.feira.greens, copy.feira.pastel, copy.feira.flowers][i % 4];
    const cx = x0 + AWNING.length / 2;
    const top = heightAt(surface, cx) + BACK_LANE;
    const c = b.chunkFor(cx);
    const label = b.add(c, b.scene.add.text(cx, top - 38, text, { fontFamily: b.fonts.display, fontSize: "26px", color: "#ef4f43" }));
    label.setOrigin(0.5).setDepth(2.52);
    const g = b.add(c, b.scene.add.graphics());
    g.setDepth(2.51);
    const w = label.width + 30;
    g.fillStyle(INK, 1);
    g.fillRoundedRect(cx - w / 2 - 5, top - 64, w + 10, 52, 8);
    g.fillStyle(0xfffaf0, 1);
    g.fillRoundedRect(cx - w / 2, top - 59, w, 42, 6);
    g.fillRect(cx - w / 2 + 16, top - 18, 8, 16);
    g.fillRect(cx + w / 2 - 24, top - 18, 8, 16);
  });
  stairs(b, course);
  rails(b, course, set);
  const crateRamp = set.crateRamp;
  for (const [dx, dy, s] of [[-170, 0, 0.9], [-90, 0, 0.9], [-130, -72, 0.9]] as const) {
    const cx = crateRamp.x0 + dx;
    const img = b.add(b.chunkFor(cx), b.scene.add.image(cx, heightAt(road, cx) + BACK_LANE - 10 + dy, "f-caixote"));
    const src = img.texture.getSourceImage();
    img.setOrigin(0.5, 1 - (PAD * SAMPLE_RES) / (src.height || 100)).setScale(s / SAMPLE_RES).setDepth(2.4);
  }
}

function awning(b: Builder, s: Course["surfaces"][number], cloth: [number, number]) {
  const c = b.chunkFor((s.x0 + s.x1) / 2);
  const g = b.add(c, b.scene.add.graphics());
  g.setDepth(2.5);
  const xs: number[] = [];
  for (let x = s.x0; x <= s.x1 + 0.5; x += 30) xs.push(Math.min(x, s.x1));
  const front = xs.map((x) => v(x, heightAt(s, x)));
  const back = xs.map((x) => v(x, heightAt(s, x) + BACK_LANE));
  g.fillStyle(INK, 1);
  g.fillPoints([...back.map((p) => v(p.x - 6, p.y - 6)), ...front.slice().reverse().map((p) => v(p.x + 6, p.y + 6))], true);
  const stripe = 45;
  for (let x = s.x0, k = 0; x < s.x1; x += stripe, k += 1) {
    const xa = x;
    const xb = Math.min(s.x1, x + stripe);
    g.fillStyle(cloth[k % 2], 1);
    g.fillPoints([v(xa, heightAt(s, xa) + BACK_LANE), v(xb, heightAt(s, xb) + BACK_LANE), v(xb, heightAt(s, xb)), v(xa, heightAt(s, xa))], true);
  }
  g.fillStyle(INK, 0.12);
  g.fillPoints([...back, ...back.slice().reverse().map((p) => v(p.x, p.y + 22))], true);
  for (let x = s.x0, k = 0; x < s.x1 - 1; x += stripe, k += 1) {
    const xm = Math.min(s.x1, x + stripe / 2);
    const y = heightAt(s, xm);
    g.fillStyle(INK, 1);
    g.fillEllipse(xm, y + 4, stripe + 8, 34);
    g.fillStyle(cloth[k % 2], 1);
    g.fillEllipse(xm, y + 2, stripe - 2, 26);
  }
  g.lineStyle(6, INK, 1);
  g.strokePoints(front, false);
  g.lineStyle(5, INK, 1);
  g.strokePoints(back, false);
  g.lineStyle(4, 0xffffff, 0.45);
  g.strokePoints(front.map((p) => v(p.x, p.y - 6)), false);
}

export function stairs(b: Builder, course: Course) {
  for (const zone of course.cobbles) if (zone.stairs) stairRun(b, course, zone);
}

function stairRun(b: Builder, course: Course, zone: { x0: number; x1: number }) {
  const road = course.surfaces[0];
  const tread = 46;
  for (let c0 = zone.x0; c0 < zone.x1; c0 += 1800) {
    const c1 = Math.min(zone.x1, c0 + 1800);
    const g = b.add(b.chunkFor(c0 + 10), b.scene.add.graphics());
    g.setDepth(0.5);
    const xs: number[] = [];
    for (let x = c0; x < c1; x += 90) xs.push(x);
    xs.push(c1);
    g.fillStyle(0xe7dccb, 1);
    g.fillPoints([...xs.map((x) => v(x, heightAt(road, x) - STREET)), ...xs.slice().reverse().map((x) => v(x, heightAt(road, x) + 6))], true);
    g.lineStyle(4, INK, 0.85);
    g.beginPath();
    for (let x = c0; x < c1; x += tread) {
      const xb = Math.min(c1, x + tread);
      const ya = heightAt(road, x);
      g.moveTo(x, ya);
      g.lineTo(xb, ya);
      g.lineTo(xb, heightAt(road, xb));
    }
    g.strokePath();
    g.lineStyle(3, INK, 0.3);
    g.beginPath();
    for (let x = c0 + tread; x < c1; x += tread) {
      const ya = heightAt(road, x - tread);
      g.moveTo(x, ya - STREET);
      g.lineTo(x, ya);
    }
    g.strokePath();
    g.lineStyle(5, INK, 1);
    g.strokePoints(xs.map((x) => v(x, heightAt(road, x) - STREET)), false);
  }
}

function rails(b: Builder, course: Course, set: FeiraSet) {
  const rail = course.surfaces[set.rail];
  const road = course.surfaces[0];
  const depths = [7.45, 5.9, 4.9, 4.0];
  LANE_OFFSETS.forEach((lane, i) => {
    const c = b.chunkFor((rail.x0 + rail.x1) / 2);
    const g = b.add(c, b.scene.add.graphics());
    g.setDepth(depths[i]);
    const pts: Phaser.Math.Vector2[] = [];
    for (let x = rail.x0; x < rail.x1 - 200; x += 90) pts.push(v(x, heightAt(rail, x) + lane));
    for (let x = rail.x1 - 200; x <= rail.x1 + 0.5; x += 25) pts.push(v(Math.min(x, rail.x1), heightAt(rail, Math.min(x, rail.x1)) + lane));
    for (let x = rail.x0 + 30; x < rail.x1 - 40; x += 300) {
      const top = heightAt(rail, x) + lane;
      const foot = heightAt(road, x) + lane;
      g.fillStyle(INK, 1);
      g.fillRect(x - 7, top, 14, foot - top);
      g.fillStyle(0x9aa6b8, 1);
      g.fillRect(x - 3, top + 4, 6, foot - top - 6);
    }
    g.lineStyle(16, INK, 1);
    g.strokePoints(pts, false);
    g.lineStyle(8, i === 0 ? 0xffc83d : 0xe8b52e, 1);
    g.strokePoints(pts, false);
    g.lineStyle(3, 0xffffff, 0.6);
    g.strokePoints(pts.map((p) => v(p.x, p.y - 2)), false);
  });
}

export function feiraObstacle(scene: Phaser.Scene, o: Obstacle): Phaser.GameObjects.GameObject | null {
  const key = o.kind === "crate" ? "f-caixote" : o.kind === "stand" ? "f-caixote-laranja" : o.kind === "melon" ? "f-melancia" : o.kind === "orange" ? "f-laranja" : null;
  if (!key || !scene.textures.exists(key)) return null;
  const img = scene.add.image(0, 0, key);
  const src = img.texture.getSourceImage();
  const pad = o.kind === "melon" || o.kind === "orange" ? 6 : PAD;
  const inner = (src.height || 100) - pad * 2 * SAMPLE_RES;
  const h = o.kind === "crate" ? 86 : o.kind === "stand" ? 104 : o.kind === "melon" ? 62 : 34;
  const k = h / inner;
  img.setScale(k);
  if (o.kind === "melon" || o.kind === "orange") img.setOrigin(0.5, 0.5).setY(-h / 2 + 2);
  else img.setOrigin(0.5, 1 - (pad * SAMPLE_RES) / (src.height || 100)).setY(4);
  return img;
}

export function trolleyRamp(scene: Phaser.Scene, course: Course) {
  const set = course.set as FeiraSet;
  const road = course.surfaces[0];
  const rp = set.trolley;
  const g = scene.add.graphics();
  const top = (lane: number) => {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < road.xs.length && road.xs[i] <= rp.x1 + 0.5; i += 1) if (road.xs[i] >= rp.x0) pts.push(v(road.xs[i], road.ys[i] + lane));
    return pts;
  };
  const back = top(BACK_LANE);
  const front = top(0);
  g.fillStyle(INK, 1);
  g.fillPoints([...back.map((p) => v(p.x, p.y - 5)), v(rp.x1 + 5, rp.lipY + BACK_LANE - 5), v(rp.x1 + 5, rp.lipY), ...front.slice().reverse()], true);
  g.fillStyle(0xc9d1dc, 1);
  g.fillPoints([...back, ...front.slice().reverse()], true);
  g.lineStyle(3, 0x64708a, 0.9);
  for (let k = 1; k < 7; k += 1) g.strokePoints(top((BACK_LANE * k) / 7), false);
  for (let x = rp.x0 + 22; x < rp.x1; x += 22) {
    g.beginPath();
    g.moveTo(x, heightAt(road, x) + BACK_LANE);
    g.lineTo(x, heightAt(road, x));
    g.strokePath();
  }
  const bag = front.map((p) => v(p.x, p.y + 1));
  g.fillStyle(INK, 1);
  g.fillPoints([...bag.map((p) => v(p.x, p.y - 4)), ...bag.slice().reverse().map((p) => v(p.x, p.y - 34))], true);
  g.fillStyle(0xef4f43, 1);
  g.fillPoints([...bag, ...bag.slice().reverse().map((p) => v(p.x, p.y - 30))], true);
  g.lineStyle(5, 0xc4352c, 1);
  for (let x = rp.x0 + 14; x < rp.x1 - 6; x += 26) {
    g.beginPath();
    g.moveTo(x, heightAt(road, x) - 2);
    g.lineTo(x, heightAt(road, x) - 28);
    g.strokePath();
  }
  g.lineStyle(4, 0xffe39a, 0.7);
  g.strokePoints(bag.map((p) => v(p.x, p.y - 15)), false);
  g.lineStyle(6, INK, 1);
  g.strokePoints(back, false);
  g.strokePoints(front, false);
  g.strokePoints(bag.map((p) => v(p.x, p.y - 32)), false);
  g.beginPath();
  g.moveTo(rp.x1, rp.lipY + BACK_LANE);
  g.lineTo(rp.x1, rp.lipY);
  g.strokePath();
  for (const lane of [0, BACK_LANE]) {
    g.fillStyle(INK, 1);
    g.fillCircle(rp.x1 - 8, rp.lipY + lane - 16, 18);
    g.fillStyle(0x9aa6b8, 1);
    g.fillCircle(rp.x1 - 8, rp.lipY + lane - 16, 9);
  }
  return g;
}
