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

const PLATFORM_ART = { shelf: 0xb06c3f, bench: 0xb06c3f, bars: 0xef4f43, desk: 0xb06c3f };

function drawPlatform(scene: Phaser.Scene, pl: LevelDef["platforms"][number]) {
  const x = cx(pl.col);
  const y = cy(pl.row);
  const w = pl.w * TILE;
  if (pl.art === "bench" && pl.w === 3) {
    scene.add.image(x + w / 2, y - 6, "bench").setOrigin(0.5, 0).setDepth(4).setDisplaySize(w, 100 * (w / 250));
    return;
  }
  if (pl.art === "desk") {
    scene.add.image(x + w / 2, y - 8, "desk").setOrigin(0.5, 0).setDepth(4).setDisplaySize(w + 10, 130 * ((w + 10) / 250));
    return;
  }
  const g = scene.add.graphics().setDepth(4);
  const color = PLATFORM_ART[pl.art];
  if (pl.art === "bars") {
    g.lineStyle(10, INK_HEX, 1);
    g.lineBetween(x + 16, y + 10, x + 16, FLOOR_Y);
    g.lineBetween(x + w - 16, y + 10, x + w - 16, FLOOR_Y);
    g.lineStyle(5, 0xffc83d, 1);
    g.lineBetween(x + 16, y + 10, x + 16, FLOOR_Y);
    g.lineBetween(x + w - 16, y + 10, x + w - 16, FLOOR_Y);
  } else {
    g.fillStyle(INK_HEX, 1);
    g.fillTriangle(x + 14, y + 22, x + 34, y + 22, x + 14, y + 50);
    g.fillTriangle(x + w - 14, y + 22, x + w - 34, y + 22, x + w - 14, y + 50);
  }
  g.fillStyle(INK_HEX, 1);
  g.fillRoundedRect(x - 4, y - 4, w + 8, 30, 8);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x, y, w, 22, 6);
  g.fillStyle(0xffffff, 0.25);
  g.fillRect(x + 6, y + 4, w - 12, 5);
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
    } else {
      scene.add.image(x + w / 2, y + h, bl.art).setOrigin(0.5, 1).setDepth(6).setDisplaySize(w + (bl.art === "bin" ? 14 : 10), (bl.art === "bin" ? 116 : 160) * ((w + 10) / (bl.art === "bin" ? 100 : 170)));
    }
  }

  const oneWays: Phaser.GameObjects.Zone[] = [];
  for (const pl of level.platforms) {
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
