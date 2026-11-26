import * as Phaser from "phaser";
import { FLOOR_Y, H, TILE, TOP } from "../config";
import type { LevelDef } from "../levels";
import { INK_HEX } from "../../kit/ui";

export type World = {
  width: number;
  solids: Phaser.GameObjects.Zone[];
  oneWays: Phaser.GameObjects.Zone[];
  slips: [number, number][];
  groundAt: (x: number) => boolean;
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

const PLATFORM_ART = { shelf: 0xb06c3f, bench: 0xb06c3f, bars: 0xef4f43, desk: 0xb06c3f, books: 0x55301e };
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

function drawPlatform(scene: Phaser.Scene, pl: LevelDef["platforms"][number]) {
  const x = cx(pl.col);
  const y = cy(pl.row);
  const w = pl.w * TILE;
  if (pl.art === "shelf") {
    drawShelf(scene, x, y, w);
    return;
  }
  if (pl.art === "bench" && pl.w === 3) {
    contact(scene, x + w / 2, w * 0.95);
    scene.add.image(x + w / 2, y - 6, "bench").setOrigin(0.5, 0).setDepth(4).setDisplaySize(w, 100 * (w / 250));
    return;
  }
  if (pl.art === "desk" && FLOOR_Y - y < 220) {
    contact(scene, x + w / 2, w);
    scene.add.image(x + w / 2, y - 8, "desk").setOrigin(0.5, 0).setDepth(4).setDisplaySize(w + 10, FLOOR_Y - y + 10);
    return;
  }
  if (pl.art === "books" && FLOOR_Y - y < 220) {
    contact(scene, x + w / 2, w);
    scene.add.image(x + w / 2, y - 8, "bookcase-low").setOrigin(0.5, 0).setDepth(4).setDisplaySize(w + 10, FLOOR_Y - y + 10);
    return;
  }
  if (pl.art === "books") {
    drawBalcony(scene, x, y, w);
    return;
  }
  const dark = pl.art === "desk";
  const g = scene.add.graphics().setDepth(4);
  const color = PLATFORM_ART[pl.art];
  if (pl.art === "bars") {
    contact(scene, x + 16, 54);
    contact(scene, x + w - 16, 54);
    g.lineStyle(10, INK_HEX, 1);
    g.lineBetween(x + 16, y + 10, x + 16, FLOOR_Y);
    g.lineBetween(x + w - 16, y + 10, x + w - 16, FLOOR_Y);
    g.lineStyle(5, 0xffc83d, 1);
    g.lineBetween(x + 16, y + 10, x + 16, FLOOR_Y);
    g.lineBetween(x + w - 16, y + 10, x + w - 16, FLOOR_Y);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(x - 4, y - 4, w + 8, 30, 8);
    g.fillStyle(color, 1);
    g.fillRoundedRect(x, y, w, 22, 6);
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(x + 6, y + 4, w - 12, 5);
    return;
  }
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
      scene.add.image(x + w / 2, y + h + (BIN_ART.height - BIN_ART.bottom) * k, "bin").setOrigin(0.5, 1).setDepth(6).setDisplaySize(BIN_ART.width * k, BIN_ART.height * k);
    } else {
      scene.add.image(x + w / 2, y + h, bl.art).setOrigin(0.5, 1).setDepth(6).setDisplaySize(w + 10, 160 * ((w + 10) / 170));
    }
  }

  const oneWays: Phaser.GameObjects.Zone[] = [];
  for (const pl of level.platforms) {
    if (pl.wobbly) continue;
    drawPlatform(scene, pl);
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
  return { width, solids, oneWays, slips, groundAt };
}
