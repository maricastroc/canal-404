import * as Phaser from "phaser";
import { FLOOR_Y, H, TILE, TOP } from "../config";
import type { LevelDef } from "../levels";
import { INK_HEX } from "../../kit/ui";
import { BARS_ART, BENCH_ART, yardSector, type YardSector } from "./yardArt";

type Perch = { x0: number; x1: number; y: number; top: Phaser.GameObjects.Image; poles: Phaser.GameObjects.Image; at: number };

export type World = {
  width: number;
  solids: Phaser.GameObjects.Zone[];
  oneWays: Phaser.GameObjects.Zone[];
  slips: [number, number][];
  groundAt: (x: number) => boolean;
  props: Partial<Record<"boxes" | "bin" | "cabinet", Phaser.GameObjects.Image[]>>;
  flex: (x: number, feet: number, power: number) => boolean;
};

export const cx = (col: number) => col * TILE;
export const cy = (row: number) => TOP + row * TILE;

function drawGround(scene: Phaser.Scene, level: LevelDef, width: number) {
  const pit = scene.add.graphics().setDepth(4.9);
  pit.fillStyle(0x140f26, 1);
  pit.fillRect(0, FLOOR_Y, width, H - FLOOR_Y + 400);
  pit.fillStyle(0x2b2150, 1);
  for (let x = 0; x < width; x += 140) pit.fillRect(x, FLOOR_Y + 40, 70, 8);
  const g = scene.add.graphics().setDepth(5.2);
  g.lineStyle(6, INK_HEX, 1);
  for (const [a, b] of level.ground) {
    const x0 = cx(a);
    const x1 = cx(b + 1);
    g.lineBetween(x0, FLOOR_Y, x1, FLOOR_Y);
    if (a > 0) g.lineBetween(x0, FLOOR_Y, x0, H);
    if (b + 1 < level.length) g.lineBetween(x1, FLOOR_Y, x1, H);
  }
}

const BIN_ART = { top: 7.5, bottom: 112.5, height: 116, width: 100 };


function contact(scene: Phaser.Scene, x: number, w: number) {
  scene.add.image(x, FLOOR_Y + 4, "blob").setDepth(5.1).setDisplaySize(w, 22).setAlpha(0.45);
}

function wallShadow(scene: Phaser.Scene, x: number, y: number, w: number) {
  const g = scene.add.graphics().setDepth(3.9);
  g.fillStyle(INK_HEX, 0.05);
  g.fillRoundedRect(x - 2, y, w + 4, 30, 15);
  g.fillStyle(INK_HEX, 0.08);
  g.fillRoundedRect(x + 12, y, w - 24, 16, 8);
}

function drawBalcony(scene: Phaser.Scene, x: number, y: number, w: number) {
  wallShadow(scene, x, y + 30, w);
  const rail = scene.add.graphics().setDepth(3.95);
  rail.lineStyle(9, INK_HEX, 1);
  for (let bx = x + 14; bx <= x + w - 14; bx += 28) rail.lineBetween(bx, y - 58, bx, y);
  rail.lineStyle(4, 0xb06c3f, 1);
  for (let bx = x + 14; bx <= x + w - 14; bx += 28) rail.lineBetween(bx, y - 56, bx, y - 2);
  rail.fillStyle(INK_HEX, 1);
  rail.fillRoundedRect(x - 2, y - 70, w + 4, 18, 7);
  rail.fillStyle(0x9c5832, 1);
  rail.fillRoundedRect(x + 2, y - 67, w - 4, 12, 5);
  rail.fillStyle(0xffffff, 0.25);
  rail.fillRect(x + 8, y - 65, w - 16, 3);
  const g = scene.add.graphics().setDepth(4);
  for (const bx of [x + 18, x + w - 18]) {
    const d = bx < x + w / 2 ? 1 : -1;
    g.fillStyle(INK_HEX, 1);
    g.fillTriangle(bx - d * 4, y + 24, bx + d * 34, y + 24, bx - d * 4, y + 66);
    g.fillStyle(0x7d4526, 1);
    g.fillTriangle(bx + d * 1, y + 28, bx + d * 22, y + 28, bx + d * 1, y + 52);
  }
  g.fillStyle(INK_HEX, 1);
  g.fillRoundedRect(x - 6, y - 5, w + 12, 34, 8);
  g.fillStyle(0x55301e, 1);
  g.fillRoundedRect(x - 2, y - 1, w + 4, 26, 6);
  g.fillStyle(0x9c5832, 1);
  g.fillRoundedRect(x - 2, y - 1, w + 4, 9, { tl: 6, tr: 6, bl: 0, br: 0 });
  g.fillStyle(0xffc83d, 1);
  g.fillRect(x + 4, y + 15, w - 8, 4);
  g.fillStyle(0xffffff, 0.3);
  g.fillRect(x + 8, y + 1, w - 16, 3);
}

const BASE_ART: Record<YardSector | "plain", { body: number; lip: number; line: number; band?: number; bricks?: boolean; flowers?: boolean }> = {
  plain: { body: 0xcfc6b0, lip: 0xe6dfcc, line: 0xa99f86 },
  court: { body: 0xcfc6b0, lip: 0xe6dfcc, line: 0xa99f86, band: 0x3fa9a0 },
  canteen: { body: 0xcfc6b0, lip: 0xe6dfcc, line: 0xa99f86 },
  commons: { body: 0xcfc6b0, lip: 0xe6dfcc, line: 0xa99f86 },
  garden: { body: 0xb8573f, lip: 0xe6dfcc, line: 0xd9a07c, bricks: true, flowers: true },
};

function benchBase(scene: Phaser.Scene, x: number, top: number, w: number, look: keyof typeof BASE_ART = "plain") {
  const h = Math.round(FLOOR_Y - top + 4);
  const art = BASE_ART[look];
  const key = `bench-base-${look}-${w}-${h}`;
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({}, false);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(0, 0, w, h, { tl: 6, tr: 6, bl: 0, br: 0 });
    g.fillStyle(art.body, 1);
    g.fillRoundedRect(4, 4, w - 8, h - 4, { tl: 4, tr: 4, bl: 0, br: 0 });
    g.fillStyle(art.lip, 1);
    g.fillRect(4, 4, w - 8, 10);
    g.fillStyle(art.line, 1);
    g.fillRect(4, 14, w - 8, 4);
    if (art.bricks) {
      for (let y = 22, row = 0; y < h - 4; y += 16, row += 1) {
        g.fillRect(4, y + 12, w - 8, 3);
        for (let bx = row % 2 ? 22 : 44; bx < w - 8; bx += 44) g.fillRect(bx, y, 3, 12);
      }
    } else {
      g.lineStyle(3, art.line, 1);
      for (const fx of [0.33, 0.67]) g.lineBetween(Math.round(w * fx), 22, Math.round(w * fx), h - 4);
      g.fillStyle(art.line, 0.5);
      for (const [px, py] of [[0.12, 0.55], [0.5, 0.7], [0.82, 0.45]]) g.fillCircle(w * px, 18 + (h - 22) * py, 3);
    }
    if (art.band) {
      g.fillStyle(art.band, 1);
      g.fillRect(4, h - 18, w - 8, 10);
      g.fillStyle(0xfbf5e6, 1);
      for (let bx = 18; bx < w - 18; bx += 46) g.fillRect(bx, h - 18, 12, 10);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }
  scene.add.image(x, top - 2, key).setOrigin(0, 0).setDepth(3.98);
  if (!art.flowers) return;
  const tufts: [number, number][] = [[-6, 0xf06ba8], [w + 6, 0xffc83d]];
  for (const [dx, color] of tufts) flowerTuft(scene, x + dx, FLOOR_Y, color);
}

function flowerTuft(scene: Phaser.Scene, x: number, y: number, color: number) {
  const key = `flower-tuft-${color.toString(16)}`;
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({}, false);
    g.fillStyle(INK_HEX, 1);
    g.fillEllipse(36, 50, 74, 34);
    g.fillStyle(0x4c9a43, 1);
    g.fillEllipse(36, 50, 66, 26);
    for (const [fx, fy] of [[18, 38], [36, 30], [54, 40]]) {
      g.fillStyle(INK_HEX, 1);
      g.fillCircle(fx, fy, 10);
      g.fillStyle(color, 1);
      g.fillCircle(fx, fy, 7);
      g.fillStyle(0xfbf5e6, 1);
      g.fillCircle(fx, fy, 2.5);
    }
    g.generateTexture(key, 72, 66);
    g.destroy();
  }
  scene.add.image(x, y + 4, key).setOrigin(0.5, 1).setDepth(3.99);
}

function drawBars(scene: Phaser.Scene, x: number, y: number, w: number, look: (typeof BARS_ART)[YardSector]): Perch {
  const poleTop = y + 10;
  const poleH = Math.round(FLOOR_Y - poleTop);
  const pk = `bars-poles-${w}-${poleH}-${look.pole.toString(16)}`;
  if (!scene.textures.exists(pk)) {
    const g = scene.make.graphics({}, false);
    for (const px of [16, w - 16]) {
      g.fillStyle(INK_HEX, 1);
      g.fillRect(px - 5, 0, 10, poleH);
      g.fillRoundedRect(px - 15, poleH - 8, 30, 12, 4);
      g.fillStyle(look.pole, 1);
      g.fillRect(px - 2.5, 0, 5, poleH - 4);
      g.fillStyle(0x9aa6b8, 1);
      g.fillRoundedRect(px - 11, poleH - 5, 22, 6, 2);
    }
    g.generateTexture(pk, w, poleH + 4);
    g.destroy();
  }
  const tk = `bars-top-${w}-${look.top.toString(16)}`;
  if (!scene.textures.exists(tk)) {
    const g = scene.make.graphics({}, false);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(0, 0, w + 8, 30, 8);
    g.fillStyle(look.top, 1);
    g.fillRoundedRect(4, 4, w, 22, 6);
    g.fillStyle(look.shine, 1);
    g.fillRect(10, 8, w - 12, 5);
    g.fillStyle(INK_HEX, 0.25);
    g.fillRect(8, 20, w - 8, 4);
    g.generateTexture(tk, w + 8, 30);
    g.destroy();
  }
  scene.add.image(x + w / 2, FLOOR_Y + 6, "blob").setDepth(5.1).setDisplaySize(w * 0.9, 18).setAlpha(0.22);
  contact(scene, x + 16, 54);
  contact(scene, x + w - 16, 54);
  const poles = scene.add.image(x, poleTop, pk).setOrigin(0, 0).setDepth(4);
  const top = scene.add.image(x - 4, y - 4, tk).setOrigin(0, 0).setDepth(4.01);
  return { x0: x, x1: x + w, y, top, poles, at: -1e9 };
}

function drawShelf(scene: Phaser.Scene, x: number, y: number, w: number) {
  wallShadow(scene, x, y + 22, w);
  const key = `shelf-${w}`;
  const pad = 20;
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({}, false);
    const v = (px: number, py: number) => new Phaser.Math.Vector2(px + pad, py + 6);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(pad + 12, 24, w - 24, 13, 4);
    g.fillStyle(0x7d4526, 1);
    g.fillRoundedRect(pad + 15, 26, w - 30, 8, 3);
    for (const bx of [32, w - 32]) {
      g.fillStyle(INK_HEX, 1);
      g.fillPoints([v(bx - 17, 16), v(bx + 17, 16), v(bx + 9, 70), v(bx - 9, 70)], true);
      g.fillStyle(0x9c5832, 1);
      g.fillPoints([v(bx - 13, 20), v(bx + 13, 20), v(bx + 6, 65), v(bx - 6, 65)], true);
      g.fillStyle(0x7d4526, 1);
      g.fillPoints([v(bx + 2, 20), v(bx + 13, 20), v(bx + 6, 65), v(bx + 2, 65)], true);
      g.fillStyle(0xfbf5e6, 0.85);
      g.fillCircle(pad + bx - 4, 56, 2.5);
    }
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(pad - 4, 1, w + 8, 32, 8);
    g.fillStyle(0x9c5832, 1);
    g.fillRoundedRect(pad, 5, w, 24, 6);
    g.fillStyle(0xd99558, 1);
    g.fillRoundedRect(pad, 5, w, 10, { tl: 6, tr: 6, bl: 0, br: 0 });
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(pad + 8, 7, w - 16, 3);
    g.lineStyle(2, INK_HEX, 0.35);
    g.lineBetween(pad + 4, 15, pad + w - 4, 15);
    g.generateTexture(key, w + pad * 2, 80);
    g.destroy();
  }
  scene.add.image(x - pad, y - 6, key).setOrigin(0, 0).setDepth(4);
}

function drawPlatform(scene: Phaser.Scene, pl: LevelDef["platforms"][number], yard: boolean): Perch | null {
  const x = cx(pl.col);
  const y = cy(pl.row);
  const w = pl.w * TILE;
  const sector = yard ? yardSector(x + w / 2) : null;
  if (pl.art === "shelf") {
    drawShelf(scene, x, y, w);
    return null;
  }
  if (pl.art === "bench" && pl.w === 3) {
    const k = w / 250;
    const legs = y - 6 + 96 * k;
    benchBase(scene, x - 12, legs, w + 24, sector ?? "plain");
    contact(scene, x + w / 2, w + 40);
    scene.add.image(x + w / 2, y - 6, sector ? BENCH_ART[sector] : "bench").setOrigin(0.5, 0).setDepth(4).setDisplaySize(w, 100 * k);
    return null;
  }
  if (pl.art === "bars") return drawBars(scene, x, y, w, BARS_ART[sector ?? "court"]);
  if (pl.art === "desk" && FLOOR_Y - y < 220) {
    contact(scene, x + w / 2, w);
    scene.add.image(x + w / 2, y - 8, "desk").setOrigin(0.5, 0).setDepth(4).setDisplaySize(w + 10, FLOOR_Y - y + 10);
    return null;
  }
  if (pl.art === "books" && FLOOR_Y - y < 220) {
    contact(scene, x + w / 2, w);
    scene.add.image(x + w / 2, y - 8, "bookcase-low").setOrigin(0.5, 0).setDepth(4).setDisplaySize(w + 10, FLOOR_Y - y + 10);
    return null;
  }
  if (pl.art === "books") {
    drawBalcony(scene, x, y, w);
    return null;
  }
  const dark = pl.art === "desk";
  const g = scene.add.graphics().setDepth(4);
  wallShadow(scene, x, y + 22, w);
  for (const bx of [x + 14, x + w - 14]) {
    const d = bx < x + w / 2 ? 1 : -1;
    g.fillStyle(INK_HEX, 1);
    g.fillTriangle(bx - d * 3, y + 18, bx + d * 30, y + 18, bx - d * 3, y + 56);
    g.fillStyle(0x7d4526, 1);
    g.fillTriangle(bx + d * 2, y + 22, bx + d * 20, y + 22, bx + d * 2, y + 44);
  }
  g.fillStyle(INK_HEX, 1);
  g.fillRoundedRect(x - 4, y - 5, w + 8, 32, 8);
  g.fillStyle(dark ? 0x55301e : 0x9c5832, 1);
  g.fillRoundedRect(x, y - 1, w, 24, 6);
  g.fillStyle(dark ? 0x9c5832 : 0xd99558, 1);
  g.fillRoundedRect(x, y - 1, w, 10, { tl: 6, tr: 6, bl: 0, br: 0 });
  g.fillStyle(0xffffff, 0.3);
  g.fillRect(x + 8, y + 1, w - 16, 3);
  g.lineStyle(2, INK_HEX, 0.35);
  g.lineBetween(x + 4, y + 9, x + w - 4, y + 9);
  return null;
}

function flexPerch(scene: Phaser.Scene, p: Perch, power: number) {
  const now = scene.time.now;
  if (now - p.at < 160) return;
  p.at = now;
  const dip = 2 + 3 * power;
  const baseY = p.y - 4;
  scene.tweens.killTweensOf([p.top, p.poles]);
  p.top.setY(baseY + dip);
  scene.tweens.add({ targets: p.top, y: baseY, duration: 320 + 200 * power, ease: "Elastic.easeOut", easeParams: [1.2, 0.35] });
  const px = p.x0;
  p.poles.setX(px + dip * 0.5);
  scene.tweens.add({ targets: p.poles, x: px, duration: 60, yoyo: true, repeat: 2, onComplete: () => p.poles.setX(px) });
}

export function buildWorld(scene: Phaser.Scene, level: LevelDef): World {
  const width = level.length * TILE;
  drawGround(scene, level, width);

  const solids: Phaser.GameObjects.Zone[] = [];
  const addSolid = (x: number, y: number, w: number, h: number) => {
    const z = scene.add.zone(x + w / 2, y + h / 2, w, h);
    scene.physics.add.existing(z, true);
    solids.push(z);
  };
  for (const [a, b] of level.ground) addSolid(cx(a), FLOOR_Y, cx(b + 1) - cx(a), 400);
  const props: World["props"] = {};
  for (const bl of level.blocks) {
    const x = cx(bl.col);
    const y = cy(bl.row);
    const w = bl.w * TILE;
    const h = bl.h * TILE;
    addSolid(x + 6, y + 8, w - 12, h - 8);
    contact(scene, x + w / 2, w * 0.95);
    if (bl.art === "cabinet") {
      const g = scene.add.graphics().setDepth(6);
      g.fillStyle(INK_HEX, 1);
      g.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 6);
      g.fillStyle(0x9aa6b8, 1);
      g.fillRoundedRect(x + 3, y + 3, w - 6, h - 6, 4);
      g.lineStyle(4, INK_HEX, 1);
      g.strokeRect(x + 12, y + 18, w - 24, h / 2 - 26);
      g.strokeRect(x + 12, y + h / 2 + 8, w - 24, h / 2 - 26);
      g.fillStyle(0xffc83d, 1);
      g.fillRect(x + w / 2 - 12, y + 36, 24, 6);
      g.fillRect(x + w / 2 - 12, y + h / 2 + 26, 24, 6);
    } else if (bl.art === "bin") {
      const k = (h - 8) / (BIN_ART.bottom - BIN_ART.top);
      (props.bin ??= []).push(scene.add.image(x + w / 2, y + h + (BIN_ART.height - BIN_ART.bottom) * k, "bin").setOrigin(0.5, 1).setDepth(6).setDisplaySize(BIN_ART.width * k, BIN_ART.height * k));
    } else {
      (props.boxes ??= []).push(scene.add.image(x + w / 2, y + h, bl.art).setOrigin(0.5, 1).setDepth(6).setDisplaySize(w + 10, 160 * ((w + 10) / 170)));
    }
  }

  const oneWays: Phaser.GameObjects.Zone[] = [];
  const perches: Perch[] = [];
  for (const pl of level.platforms) {
    if (pl.wobbly) continue;
    const perch = drawPlatform(scene, pl, level.theme === "yard");
    if (perch) perches.push(perch);
    const z = scene.add.zone(cx(pl.col) + (pl.w * TILE) / 2, cy(pl.row) + 10, pl.w * TILE, 20);
    scene.physics.add.existing(z, true);
    const body = z.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    oneWays.push(z);
  }

  const slips: [number, number][] = [];
  for (const pu of level.puddles) {
    const x0 = cx(pu.col);
    const w = pu.w * TILE;
    scene.add.image(x0 + w / 2, FLOOR_Y + 4, "puddle").setDepth(5.5).setDisplaySize(w, 40);
    scene.add.image(x0 - 30, FLOOR_Y, "cone").setOrigin(0.5, 1).setDepth(5.6).setScale(0.8);
    slips.push([x0, x0 + w]);
  }

  for (const [a, b] of level.ground) {
    if (a > 0) scene.add.image(cx(a) + 4, FLOOR_Y + 2, "tape").setOrigin(0, 1).setDepth(5.2).setScale(0.5);
    if (b + 1 < level.length) scene.add.image(cx(b + 1) - 4, FLOOR_Y + 2, "tape").setOrigin(1, 1).setDepth(5.2).setScale(0.5);
  }

  const groundAt = (x: number) => level.ground.some(([a, b]) => x >= cx(a) && x < cx(b + 1));
  const flex = (x: number, feet: number, power: number) => {
    const p = perches.find((q) => x > q.x0 - 10 && x < q.x1 + 10 && Math.abs(feet - q.y) < 14);
    if (!p) return false;
    flexPerch(scene, p, Phaser.Math.Clamp(power, 0, 1));
    return true;
  };
  return { width, solids, oneWays, slips, groundAt, props, flex };
}
