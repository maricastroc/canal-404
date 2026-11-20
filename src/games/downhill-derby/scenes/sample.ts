import * as Phaser from "phaser";
import { INK } from "./cart";
import type { ArlindoSet, Course } from "../sim/course";
import type { Extra } from "./cast";
import { STREET, STREET_SPOTS, type Builder, type Zone } from "./terrain";

export const SAMPLE_RES = 1.5;
export const PAD = 8;
const SIDE = PAD + 36;

const FACADES = ["facade-sobrado-rosa", "facade-sobrado-agua", "facade-terrea-amarelo", "facade-terrea-lilas", "facade-mercadinho-pessego", "facade-puxadinho-ceu"];
const PROPS = ["muro-rosa", "muro-agua", "poste", "ipe", "orelhao", "lixeira", "pipa", "facade-arlindo", "bg-morro", "bg-telhados", "caminhao", "caminhao-luz", "lixeirao", "garagem", "cerca", "caixas", "lata"];
const PEOPLE = ["vizinha-zeze", "vizinho-tonho", "vizinho-juninho"].flatMap((p) => [`${p}-idle`, `${p}-cheer`]);

export const SAMPLE_FILES: [string, string][] = [...FACADES, ...PROPS, ...PEOPLE].map((n) => [`s-${n}`, n]);

const FIGURE = { zeze: 180, tonho: 190, juninho: 160 };

export const NEIGHBORS: Record<"zeze" | "tonho" | "juninho", Extra> = {
  zeze: { id: "zeze", kind: "full", idle: "s-vizinha-zeze-idle", cheer: "s-vizinha-zeze-cheer", height: (FIGURE.zeze * 280) / 249 },
  tonho: { id: "tonho", kind: "full", idle: "s-vizinho-tonho-idle", cheer: "s-vizinho-tonho-cheer", height: (FIGURE.tonho * 316) / 224 },
  juninho: { id: "juninho", kind: "full", idle: "s-vizinho-juninho-idle", cheer: "s-vizinho-juninho-cheer", height: (FIGURE.juninho * 246) / 183 },
};

export type SampleSpots = { neighbors: { who: keyof typeof NEIGHBORS; x: number }[]; kite: { x: number; y: number; handX: number; handY: number } | null };

const FACADE_SCALE = 0.72;
const SEQUENCE = ["facade-sobrado-rosa", "muro-rosa", "facade-terrea-amarelo", "facade-mercadinho-pessego", "facade-puxadinho-ceu", "muro-agua", "facade-sobrado-agua", "facade-terrea-lilas"];

export function placed(b: Builder, key: string, x: number, scale: number, depth: number, anchor: "left" | "center" = "left", sink = 4) {
  const src = b.scene.textures.get(key).getSourceImage();
  const sw = src.width || 100;
  const sh = src.height || 100;
  const k = scale / SAMPLE_RES;
  const w = (sw - SIDE * 2 * SAMPLE_RES) * k;
  const x0 = anchor === "left" ? x : x - w / 2;
  const y = b.floorY(x0, x0 + w) + sink;
  const img = b.add(b.chunkFor(x0 + w / 2), b.scene.add.image(x0, y, key));
  img.setOrigin((SIDE * SAMPLE_RES) / sw, 1 - (PAD * SAMPLE_RES) / sh).setScale(k).setDepth(depth);
  return { img, w, y };
}

export function facadeRow(b: Builder, x0: number, x1: number, blocked: [number, number][]) {
  let x = x0;
  let i = 0;
  let seed = 977;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  while (x < x1) {
    const key = `s-${SEQUENCE[i % SEQUENCE.length]}`;
    const src = b.scene.textures.get(key).getSourceImage();
    const w = ((src.width || 300) / SAMPLE_RES - SIDE * 2) * FACADE_SCALE;
    const hit = blocked.find(([a, c]) => x + w + 30 > a && x - 30 < c);
    if (hit) {
      x = Math.max(x + 40, hit[1] + 40);
      continue;
    }
    placed(b, key, x, FACADE_SCALE, -20);
    b.taken.push([x - 10, x + w + 10]);
    x += w + 26 + Math.floor(rnd() * 70);
    i += 1;
  }
}

export function poleLine(b: Builder, x0: number, x1: number) {
  const poles: { x: number; top: number }[] = [];
  for (let px = x0; px < x1; px += 1250) {
    const { y } = placed(b, "s-poste", px, 0.62, -7.8, "center", 6);
    poles.push({ x: px + 3, top: y - (640 - 46) * 0.62 });
  }
  for (let k = 0; k + 1 < poles.length; k += 1) {
    const p0 = poles[k];
    const p1 = poles[k + 1];
    const g = b.add(b.chunkFor((p0.x + p1.x) / 2), b.scene.add.graphics());
    g.setDepth(-7.9);
    const wires: [number, number, number][] = [
      [-37, -37, 34],
      [-14, -14, 40],
      [14, 14, 40],
      [37, 37, 34],
      [-30, 30, 60],
    ];
    wires.forEach(([o0, o1, sag], idx) => {
      const y0 = p0.top + (idx === 4 ? 90 : 0);
      const y1 = p1.top + (idx === 4 ? 90 : 0);
      const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(p0.x + o0 * 0.62, y0), new Phaser.Math.Vector2((p0.x + p1.x) / 2, (y0 + y1) / 2 + sag * 2), new Phaser.Math.Vector2(p1.x + o1 * 0.62, y1));
      g.lineStyle(idx === 4 ? 4 : 3, INK, idx === 4 ? 0.85 : 0.7);
      curve.draw(g, 24);
    });
  }
}

function kiteSpots(b: Builder, kid: number) {
  const k = FIGURE.juninho / 185;
  const hand = b.backY(kid) + 8 - 135 * k;
  return { x: kid + 330, y: hand - 230, handX: kid + 47 * k, handY: hand };
}

export function sampleStreet(b: Builder, zone: Zone, startX: number): SampleSpots {
  const resident = zone.x0 + STREET_SPOTS.resident;
  facadeRow(b, Math.max(zone.x0 + 700, startX + 1000), zone.x1 - 450, [[resident - 270, resident + 270]]);
  poleLine(b, zone.x0 + 1500, zone.x1 - 300);
  for (const tx of [zone.x0 + 3500, zone.x0 + 8300, zone.x0 + 12100]) if (Math.abs(tx - resident) > 410) placed(b, "s-ipe", tx, 0.72, -7.4, "center", 6);
  placed(b, "s-orelhao", zone.x0 + 10450, 0.72, -7.3, "center", 6);
  for (const lx of [zone.x0 + 2250, zone.x0 + 9050]) placed(b, "s-lixeira", lx, 0.72, -7.2, "center", 6);
  drawFrontWall(b, zone.x0, zone.x1 + 120);
  const kiteKid = startX + 8300;
  return {
    neighbors: [
      { who: "zeze", x: startX + 1900 },
      { who: "tonho", x: startX + 6000 },
      { who: "juninho", x: kiteKid },
    ],
    kite: kiteSpots(b, kiteKid),
  };
}

export function dressNeighborhood(b: Builder, course: Course): SampleSpots {
  const set = course.set as ArlindoSet;
  const road = course.surfaces[0];
  const blocked: [number, number][] = [
    [course.start - 700, course.start + 900],
    [set.house - 300, set.fence + 260],
    [set.cat - 190, set.cat + 190],
    [course.finish - 760, course.finish + 520],
    [set.boxes - 320, set.boxes + 320],
  ];
  facadeRow(b, road.x0 + 600, road.x1 - 400, blocked);
  poleLine(b, road.x0 + 1500, road.x1 - 300);
  const trees = [course.start + 3300, course.start + 11800, set.fence + 1500, course.finish - 2600];
  for (const tx of trees) if (!blocked.some(([a, c]) => tx + 140 > a && tx - 140 < c)) placed(b, "s-ipe", tx, 0.72, -7.4, "center", 6);
  placed(b, "s-orelhao", course.start + 9400, 0.72, -7.3, "center", 6);
  for (const lx of [course.start + 2400, set.truck - 700, course.finish - 1500]) placed(b, "s-lixeira", lx, 0.72, -7.2, "center", 6);
  drawFrontWall(b, road.x0, road.x1);
  const kiteKid = course.start + 6900;
  return {
    neighbors: [
      { who: "zeze", x: course.start + 2000 },
      { who: "juninho", x: kiteKid },
      { who: "tonho", x: set.cat + 900 },
    ],
    kite: kiteSpots(b, kiteKid),
  };
}

export function drawFrontWall(b: Builder, from: number, end: number) {
  const top = (x: number) => b.backY(x) + STREET + 24;
  for (let c0 = from; c0 < end; c0 += 1800) {
    const c1 = Math.min(end, c0 + 1800);
    const g = b.add(b.chunkFor(c0 + 10), b.scene.add.graphics());
    g.setDepth(0.02);
    const xs: number[] = [];
    for (let x = c0; x <= c1; x += 90) xs.push(x);
    if (xs[xs.length - 1] !== c1) xs.push(c1);
    const band = (a: number, z: number) => [...xs.map((x) => new Phaser.Math.Vector2(x, top(x) + a)), ...xs.slice().reverse().map((x) => new Phaser.Math.Vector2(x, top(x) + z))];
    g.fillStyle(0xecd9b2, 1);
    g.fillPoints(band(54, 92), true);
    g.fillStyle(0xdcc394, 1);
    g.fillPoints(band(92, 760), true);
    g.fillStyle(0xc9ad7a, 1);
    g.fillPoints(band(92, 104), true);
    const quad = (xa: number, xb: number, off: number) => [new Phaser.Math.Vector2(xa, top(xa) + off), new Phaser.Math.Vector2(xb, top(xb) + off), new Phaser.Math.Vector2(xb, top(xb) + off + 36), new Phaser.Math.Vector2(xa, top(xa) + off + 36)];
    for (let row = 0; row < 18; row += 1) {
      const off = 104 + row * 36;
      const shift = row % 2 === 0 ? 0 : 40;
      for (let x = Math.floor((c0 - shift) / 80) * 80 + shift; x < c1; x += 80) {
        const h = ((Math.floor(x / 80) * 73856093) ^ (row * 19349663)) >>> 0;
        const pick = h % 7;
        if (pick > 2) continue;
        g.fillStyle([0xe6d2a9, 0xd1b784, 0xe0c99a][pick], 1);
        g.fillPoints(quad(Math.max(c0, x), Math.min(c1, x + 80), off), true);
      }
    }
    g.fillStyle(INK, 0.13);
    g.fillPoints(band(104, 132), true);
    g.lineStyle(3, 0xb89d6c, 1);
    for (let row = 1; row < 19; row += 1) {
      const off = 104 + row * 36;
      g.beginPath();
      xs.forEach((x, k) => (k === 0 ? g.moveTo(x, top(x) + off) : g.lineTo(x, top(x) + off)));
      g.strokePath();
    }
    g.beginPath();
    for (let row = 0; row < 18; row += 1) {
      const off = 104 + row * 36;
      const shift = row % 2 === 0 ? 0 : 40;
      for (let x = Math.ceil((c0 - shift) / 80) * 80 + shift; x < c1; x += 80) {
        g.moveTo(x, top(x) + off + 2);
        g.lineTo(x, top(x) + off + 34);
      }
    }
    g.strokePath();
    g.lineStyle(3, INK, 0.35);
    g.beginPath();
    for (let x = Math.ceil(c0 / 60) * 60; x < c1; x += 60) {
      g.moveTo(x, top(x) + 58);
      g.lineTo(x - 4, top(x) + 88);
    }
    g.strokePath();
    g.lineStyle(5, INK, 1);
    g.beginPath();
    xs.forEach((x, k) => (k === 0 ? g.moveTo(x, top(x) + 92) : g.lineTo(x, top(x) + 92)));
    g.strokePath();
    for (let x = Math.ceil(c0 / 520) * 520 + 260; x < c1 - 40; x += 520) {
      const y = top(x);
      g.fillStyle(INK, 1);
      g.fillCircle(x, y + 220, 13);
      g.fillStyle(0x3a3157, 1);
      g.fillCircle(x, y + 220, 9);
      g.fillStyle(0x7f9a6a, 0.35);
      g.fillRect(x - 6, y + 230, 12, 70);
    }
    for (let x = Math.ceil(c0 / 900) * 900 + 450; x < c1 - 80; x += 900) {
      const y = top(x) + 92;
      g.fillStyle(INK, 1);
      g.fillRoundedRect(x - 46, y - 2, 92, 24, 6);
      g.fillStyle(0x4c9a43, 1);
      for (let k = 0; k < 7; k += 1) {
        const lx = x - 40 + k * 13;
        const ll = 30 + ((k * 37) % 44);
        g.fillStyle(INK, 1);
        g.fillEllipse(lx, y + ll / 2, 14, ll + 6);
        g.fillStyle(k % 2 ? 0x4c9a43 : 0x2f6e35, 1);
        g.fillEllipse(lx, y + ll / 2, 9, ll);
      }
    }
    for (let x = Math.ceil(c0 / 640) * 640 + 180; x < c1 - 60; x += 640) {
      const y = top(x) + 100;
      const len = 120 + ((x * 7) % 110);
      g.lineStyle(5, 0x2f6e35, 1);
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 1; k <= 8; k += 1) g.lineTo(x + Math.sin(k * 1.3) * 12, y + (len * k) / 8);
      g.strokePath();
      for (let k = 1; k <= 8; k += 1) {
        const lx = x + Math.sin(k * 1.3) * 12 + (k % 2 ? 10 : -10);
        const ly = y + (len * k) / 8 - 6;
        g.fillStyle(INK, 1);
        g.fillEllipse(lx, ly, 20, 14);
        g.fillStyle(k % 3 === 0 ? 0x93cf4c : 0x4c9a43, 1);
        g.fillEllipse(lx, ly, 15, 9);
      }
    }
    for (let x = Math.ceil(c0 / 1100) * 1100 + 700; x < c1 - 60; x += 1100) {
      const y = top(x) + 56;
      g.fillStyle(INK, 1);
      g.fillRoundedRect(x - 30, y - 2, 60, 18, 4);
      g.fillStyle(0x64708a, 1);
      g.fillRoundedRect(x - 26, y + 1, 52, 12, 3);
      g.lineStyle(3, INK, 0.8);
      g.beginPath();
      for (let k = -18; k <= 18; k += 9) {
        g.moveTo(x + k, y + 1);
        g.lineTo(x + k, y + 13);
      }
      g.strokePath();
    }
    if (c1 === end) {
      const y = top(end);
      g.fillStyle(INK, 1);
      g.fillRect(end - 8, y + 84, 40, 680);
      g.fillStyle(0xc9ad7a, 1);
      g.fillRect(end - 2, y + 90, 28, 670);
    }
  }
}
