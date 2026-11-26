import * as Phaser from "phaser";
import { FLOOR_Y, H, TILE, W } from "../config";
import type { LevelDef, Theme } from "../levels";
import { INK_HEX, type Fonts } from "../../kit/ui";
import { cx } from "./world";
import { makeYardTextures, YARD_SECTORS, yardSector, type YardSector } from "./yardArt";

export type ReactKind = "locker" | "bin" | "swing" | "plant" | "metal";
export type RoomEvent = "intro" | "stomp" | "crash" | "slam" | "whistle" | "hit" | "angry" | "defeat";
type ArenaRefs = {
  banner: Phaser.GameObjects.Image;
  board: Phaser.GameObjects.Image;
  shelf: Phaser.GameObjects.Image;
  frames: Phaser.GameObjects.Image[];
  curtains: [Phaser.GameObjects.Image, Phaser.GameObjects.Image];
  desk: Phaser.GameObjects.Image;
  left: number;
};
type Reactive = { img: Phaser.GameObjects.Image; kind: ReactKind; lastHit: number; lastShake: number };
type Layer = { obj: Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Transform; y: number };
type Pile = { x: number; y: number; at: number; img: Phaser.GameObjects.Image };
export type SceneryHero = { x: number; top: number; feet: number; vx: number; grounded: boolean };

const D = { far: 0.1, mid: 0.4, wall: 0.6, back: 0.8, floor: 0.9, front: 52 };
const REST_SCROLL_Y = (H - H / 1.22) / 2;
const YARD_FLOOR: Record<YardSector, string> = { court: "floor-court", canteen: "floor-canteen", commons: "floor-yard", garden: "floor-garden" };
const HALF_VIEW = W / 2;
const at = (worldX: number, f: number) => HALF_VIEW + f * (worldX - HALF_VIEW);
const MARGIN = 1400;
const RECEDE = 0xcfc8e2;
const HALL = { pillar: 760, bay: 1180, pillarW: 76, joist: 295, lamp: 465 };
const CEILING = {
  corridor: { base: 0x3f3170, beam: 0x2b2150, step: HALL.joist, beamX: (HALL.pillar % HALL.joist) - 10, beamW: 20 },
  library: { base: 0x24423a, beam: 0x172b26, step: 300, beamX: 140, beamW: 22 },
  office: { base: 0x3a2014, beam: 0x2b170e, step: 240, beamX: 110, beamW: 20 },
};

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  const c = tex?.getContext();
  if (!tex || !c) return;
  draw(c);
  tex.refresh();
}

function gfxTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function makeLightTextures(scene: Phaser.Scene) {
  canvasTexture(scene, "light-cone", 400, 700, (c) => {
    const grad = c.createLinearGradient(0, 0, 0, 700);
    grad.addColorStop(0, "rgba(255,246,200,0.75)");
    grad.addColorStop(1, "rgba(255,246,200,0)");
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(140, 0);
    c.lineTo(260, 0);
    c.lineTo(400, 700);
    c.lineTo(0, 700);
    c.closePath();
    c.fill();
  });
  canvasTexture(scene, "light-shaft", 420, 760, (c) => {
    const grad = c.createLinearGradient(0, 0, 0, 760);
    grad.addColorStop(0, "rgba(255,250,220,0.6)");
    grad.addColorStop(1, "rgba(255,250,220,0)");
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(220, 0);
    c.lineTo(420, 760);
    c.lineTo(200, 760);
    c.closePath();
    c.fill();
  });
  canvasTexture(scene, "spot", 256, 256, (c) => {
    const grad = c.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,236,170,0.7)");
    grad.addColorStop(1, "rgba(255,236,170,0)");
    c.fillStyle = grad;
    c.fillRect(0, 0, 256, 256);
  });
  canvasTexture(scene, "blob", 128, 40, (c) => {
    const grad = c.createRadialGradient(64, 20, 4, 64, 20, 64);
    grad.addColorStop(0, "rgba(20,15,38,0.55)");
    grad.addColorStop(1, "rgba(20,15,38,0)");
    c.fillStyle = grad;
    c.save();
    c.scale(1, 40 / 128);
    c.fillRect(0, 0, 128, 128);
    c.restore();
  });
  canvasTexture(scene, "vignette", 480, 270, (c) => {
    const grad = c.createRadialGradient(240, 135, 70, 240, 135, 290);
    grad.addColorStop(0, "rgba(20,15,38,0)");
    grad.addColorStop(1, "rgba(20,15,38,1)");
    c.fillStyle = grad;
    c.fillRect(0, 0, 480, 270);
  });
  canvasTexture(scene, "shade-top", 8, 300, (c) => {
    const grad = c.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, "rgba(20,15,38,0.6)");
    grad.addColorStop(1, "rgba(20,15,38,0)");
    c.fillStyle = grad;
    c.fillRect(0, 0, 8, 300);
  });
  canvasTexture(scene, "sky", 8, 1000, (c) => {
    const grad = c.createLinearGradient(0, 0, 0, 1000);
    grad.addColorStop(0, "#5fb6ec");
    grad.addColorStop(0.65, "#bfe6fb");
    grad.addColorStop(1, "#e6f6ff");
    c.fillStyle = grad;
    c.fillRect(0, 0, 8, 1000);
  });
  gfxTexture(scene, "leaf", 26, 16, (g) => {
    g.fillStyle(0x4c9a43, 1);
    g.fillEllipse(13, 8, 24, 12);
    g.lineStyle(2, INK_HEX, 1);
    g.strokeEllipse(13, 8, 24, 12);
  });
}

function makeWallTextures(scene: Phaser.Scene) {
  gfxTexture(scene, "wall-corridor", 320, 1000, (g) => {
    g.fillStyle(0xf3e6c4, 1);
    g.fillRect(0, 0, 320, 1000);
    g.fillStyle(0xeadbb4, 1);
    g.fillRect(0, 150, 10, 520);
    g.fillRect(160, 150, 10, 520);
    g.fillStyle(0x3f3170, 1);
    g.fillRect(0, 0, 320, 140);
    g.fillStyle(0x2b2150, 1);
    g.fillRect(0, 132, 320, 14);
    g.fillStyle(0x63d6c1, 1);
    g.fillRect(0, 690, 320, 300);
    g.lineStyle(4, 0x2fa996, 1);
    g.strokeRect(16, 712, 128, 250);
    g.strokeRect(176, 712, 128, 250);
    g.fillStyle(0x2fa996, 1);
    g.fillRect(0, 678, 320, 16);
    g.fillStyle(0x2b2150, 1);
    g.fillRect(0, 984, 320, 16);
  });
  gfxTexture(scene, "wall-office", 240, 1000, (g) => {
    g.fillStyle(0x7a2338, 1);
    g.fillRect(0, 0, 240, 1000);
    g.fillStyle(0x8f2d44, 1);
    for (let y = 150; y < 640; y += 60) {
      for (let x = (y / 60) % 2 ? 0 : 60; x < 240; x += 120) {
        g.fillTriangle(x + 60, y, x + 90, y + 30, x + 60, y + 60);
        g.fillTriangle(x + 60, y, x + 30, y + 30, x + 60, y + 60);
      }
    }
    g.fillStyle(0xffc83d, 0.35);
    for (let y = 180; y < 640; y += 60) for (let x = 0; x < 240; x += 60) g.fillCircle(x + 30, y, 3);
    g.fillStyle(0x3a2014, 1);
    g.fillRect(0, 0, 240, 130);
    g.fillStyle(0xffc83d, 1);
    g.fillRect(0, 126, 240, 10);
    g.fillRect(0, 624, 240, 12);
    g.fillStyle(0x55301e, 1);
    g.fillRect(0, 636, 240, 350);
    g.lineStyle(5, 0x3a2014, 1);
    g.strokeRect(14, 662, 92, 300);
    g.strokeRect(134, 662, 92, 300);
    g.lineStyle(3, 0x7c4527, 1);
    g.strokeRect(24, 672, 72, 280);
    g.strokeRect(144, 672, 72, 280);
    g.fillStyle(0x2b170e, 1);
    g.fillRect(0, 984, 240, 16);
  });
  gfxTexture(scene, "wall-library", 320, 1000, (g) => {
    g.fillStyle(0x2f6b55, 1);
    g.fillRect(0, 0, 320, 1000);
    g.fillStyle(0x2a6150, 1);
    for (let x = 20; x < 320; x += 40) g.fillRect(x, 140, 14, 500);
    g.fillStyle(0xffc83d, 0.18);
    for (let y = 190; y < 620; y += 80) for (let x = 0; x < 320; x += 80) g.fillCircle(x + ((y / 80) % 2 ? 40 : 0) + 7, y, 4);
    g.fillStyle(0x24423a, 1);
    g.fillRect(0, 0, 320, 130);
    g.fillStyle(0x55301e, 1);
    g.fillRect(0, 126, 320, 16);
    g.fillStyle(0xb06c3f, 1);
    g.fillRect(0, 128, 320, 5);
    g.fillStyle(0x55301e, 1);
    g.fillRect(0, 624, 320, 18);
    g.fillStyle(0xb06c3f, 1);
    g.fillRect(0, 626, 320, 6);
    g.fillStyle(0x6b3a22, 1);
    g.fillRect(0, 642, 320, 342);
    g.lineStyle(5, 0x4a2816, 1);
    g.strokeRect(16, 666, 128, 296);
    g.strokeRect(176, 666, 128, 296);
    g.lineStyle(3, 0x8a4f2e, 1);
    g.strokeRect(26, 676, 108, 276);
    g.strokeRect(186, 676, 108, 276);
    g.fillStyle(0x2b170e, 1);
    g.fillRect(0, 984, 320, 16);
  });
  gfxTexture(scene, "floor-library", 160, 120, (g) => {
    g.fillStyle(0x34478f, 1);
    g.fillRect(0, 0, 160, 120);
    g.fillStyle(0x3e54a3, 1);
    for (let y = 34; y < 120; y += 40) for (let x = 0; x < 160; x += 80) {
      const ox = x + ((y - 34) / 40) % 2 * 40 + 20;
      g.fillTriangle(ox, y - 14, ox + 14, y, ox, y + 14);
      g.fillTriangle(ox, y - 14, ox - 14, y, ox, y + 14);
    }
    g.fillStyle(0xffc83d, 0.5);
    for (let y = 34; y < 120; y += 40) for (let x = 0; x < 160; x += 80) g.fillCircle(x + ((y - 34) / 40) % 2 * 40 + 20, y, 3);
    g.fillStyle(0x55301e, 1);
    g.fillRect(0, 0, 160, 14);
    g.fillStyle(0xb06c3f, 1);
    g.fillRect(0, 2, 160, 4);
    g.fillStyle(0x7b62c4, 1);
    g.fillRect(0, 14, 160, 5);
  });
  gfxTexture(scene, "floor-corridor", 160, 120, (g) => {
    g.fillStyle(0xe6dcc4, 1);
    g.fillRect(0, 0, 160, 120);
    g.fillStyle(0xcfc3a6, 1);
    g.fillRect(0, 14, 80, 40);
    g.fillRect(80, 54, 80, 40);
    g.fillRect(0, 94, 80, 26);
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(10, 20, 30, 4);
    g.fillRect(96, 60, 22, 4);
    g.fillStyle(0x7b62c4, 1);
    g.fillRect(0, 0, 160, 14);
  });
  gfxTexture(scene, "floor-yard", 200, 120, (g) => {
    g.fillStyle(0xd9cdb0, 1);
    g.fillRect(0, 0, 200, 120);
    g.lineStyle(3, 0xbfb08e, 1);
    g.lineBetween(0, 60, 200, 60);
    g.lineBetween(100, 14, 100, 60);
    g.lineBetween(40, 60, 40, 120);
    g.lineBetween(160, 60, 160, 120);
    g.fillStyle(0x93cf4c, 1);
    g.fillRect(0, 0, 200, 14);
    g.fillStyle(0x5e9e34, 1);
    for (let x = 4; x < 200; x += 16) g.fillTriangle(x, 14, x + 6, 14, x + 3, 4);
  });
  gfxTexture(scene, "floor-office", 160, 120, (g) => {
    g.fillStyle(0x7c4527, 1);
    g.fillRect(0, 0, 160, 120);
    g.lineStyle(3, 0x55301e, 1);
    for (let x = 0; x < 160; x += 40) g.lineBetween(x, 14, x, 120);
    for (let y = 40; y < 120; y += 40) for (let x = 0; x < 160; x += 80) g.lineBetween(x + (y % 80 ? 40 : 0), y, x + (y % 80 ? 80 : 40), y);
    g.fillStyle(0xc4352c, 1);
    g.fillRect(0, 22, 160, 46);
    g.fillStyle(0xffc83d, 1);
    g.fillRect(0, 22, 160, 5);
    g.fillRect(0, 63, 160, 5);
    g.fillStyle(0x55301e, 1);
    g.fillRect(0, 0, 160, 14);
  });
}

function makeDrawingTextures(scene: Phaser.Scene) {
  const paper = (g: Phaser.GameObjects.Graphics, w: number, h: number, tint: number) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRect(2, 6, w - 4, h - 8);
    g.fillStyle(tint, 1);
    g.fillRect(5, 9, w - 10, h - 14);
    g.fillStyle(0xe8d3a8, 0.92);
    g.fillPoints([new Phaser.Math.Vector2(4, 2), new Phaser.Math.Vector2(26, 6), new Phaser.Math.Vector2(23, 16), new Phaser.Math.Vector2(1, 12)], true);
    g.fillPoints([new Phaser.Math.Vector2(w - 26, 6), new Phaser.Math.Vector2(w - 4, 2), new Phaser.Math.Vector2(w - 1, 12), new Phaser.Math.Vector2(w - 23, 16)], true);
  };
  gfxTexture(scene, "drawing-0", 100, 84, (g) => {
    paper(g, 100, 84, 0xfffaf0);
    g.fillStyle(0xffc83d, 1);
    g.fillCircle(24, 30, 9);
    g.lineStyle(3, 0xffc83d, 1);
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      g.lineBetween(24 + Math.cos(a) * 12, 30 + Math.sin(a) * 12, 24 + Math.cos(a) * 17, 30 + Math.sin(a) * 17);
    }
    g.fillStyle(0xef4f43, 1);
    g.fillRect(48, 44, 30, 24);
    g.fillStyle(0x5cb9f0, 1);
    g.fillTriangle(44, 46, 82, 46, 63, 28);
    g.fillStyle(0xffc83d, 1);
    g.fillRect(58, 54, 9, 14);
    g.lineStyle(4, 0x4c9a43, 1);
    g.lineBetween(9, 70, 91, 70);
  });
  gfxTexture(scene, "drawing-1", 104, 80, (g) => {
    paper(g, 104, 80, 0xfdf0c2);
    g.lineStyle(4, 0x4c9a43, 1);
    g.lineBetween(9, 66, 95, 66);
    g.lineStyle(3, INK_HEX, 1);
    for (const [hx, arm] of [
      [30, -1],
      [74, 1],
    ]) {
      g.strokeCircle(hx, 30, 7);
      g.lineBetween(hx, 37, hx, 52);
      g.lineBetween(hx, 52, hx - 7, 64);
      g.lineBetween(hx, 52, hx + 7, 64);
      g.lineBetween(hx, 42, hx + arm * 12, 34);
      g.lineBetween(hx, 42, hx - arm * 10, 48);
    }
    g.fillStyle(0xef4f43, 1);
    g.fillCircle(52, 24, 7);
    g.lineStyle(2, INK_HEX, 1);
    g.strokeCircle(52, 24, 7);
  });
  gfxTexture(scene, "drawing-2", 92, 84, (g) => {
    paper(g, 92, 84, 0xe8f6ff);
    const colors = [0xef4f43, 0xffc83d, 0x63d6c1, 0x5cb9f0];
    colors.forEach((c, i) => {
      g.lineStyle(5, c, 1);
      g.beginPath();
      g.arc(46, 70, 34 - i * 6, Math.PI, 0, false);
      g.strokePath();
    });
    g.fillStyle(0xf06ba8, 1);
    for (let i = 0; i < 5; i += 1) g.fillCircle(22 + Math.cos((i / 5) * Math.PI * 2) * 6, 62 + Math.sin((i / 5) * Math.PI * 2) * 6, 4);
    g.fillStyle(0xffc83d, 1);
    g.fillCircle(22, 62, 3);
  });
}

export class Scenery {
  private reactive: Reactive[] = [];
  private piles: Pile[] = [];
  private quakeTargets: Phaser.GameObjects.Image[] = [];
  private refs: ArenaRefs | null = null;
  private hitCount = 0;
  private paperFrom: { x: number; y: number } | null = null;
  private nextAmbient = 2500;
  private layers: Layer[] = [];
  private sky: Phaser.GameObjects.Image | null = null;
  private ceiling: Phaser.GameObjects.GameObject[] = [];
  private compact = false;
  readonly spotlight: Phaser.GameObjects.Image | null = null;

  constructor(
    private scene: Phaser.Scene,
    private level: LevelDef,
    private width: number,
    private reduced: boolean,
    private fonts: Fonts,
  ) {
    makeLightTextures(scene);
    makeWallTextures(scene);
    if (level.theme === "corridor") this.corridor();
    else if (level.theme === "yard") this.yard();
    else if (level.theme === "library") this.library();
    else {
      this.office();
      if (level.boss) this.spotlight = this.arena(level.boss.arena * TILE);
    }
  }

  private layer<T extends Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Transform>(obj: T) {
    this.layers.push({ obj, y: obj.y });
    return obj;
  }

  fit(compact: boolean) {
    if (compact === this.compact) return;
    this.compact = compact;
    for (const { obj, y } of this.layers) {
      obj.setY(compact ? y + REST_SCROLL_Y : y);
      obj.setScrollFactor(obj.scrollFactorX, compact ? 1 : 0);
    }
    if (compact && !this.ceiling.length) this.ceiling = [...this.drawMargins(), ...(this.level.theme === "yard" ? [] : this.drawCeiling(this.level.theme)), ...(this.level.theme === "corridor" ? this.drawColumns() : [])];
    for (const o of this.ceiling) (o as Phaser.GameObjects.Image).setVisible(compact);
    if (!compact) this.sky?.setOrigin(0, 0).setPosition(0, 0).setDisplaySize(W * 1.4, H * 1.4);
  }

  frameSky(cam: Phaser.Cameras.Scene2D.Camera) {
    if (!this.compact || !this.sky) return;
    this.sky.setOrigin(0.5).setPosition(cam.width / 2, cam.height / 2).setDisplaySize((cam.width / cam.zoom) * 1.04, (cam.height / cam.zoom) * 1.04);
  }

  private drawMargins() {
    const theme = this.level.theme;
    const out: Phaser.GameObjects.TileSprite[] = [];
    for (const x0 of [-MARGIN, this.width]) {
      if (theme !== "yard") out.push(this.scene.add.tileSprite(x0, 0, MARGIN, FLOOR_Y, `wall-${theme}`).setOrigin(0, 0).setDepth(0).setTilePosition(x0, 0));
      const floor = theme === "yard" ? YARD_FLOOR[yardSector(x0 + MARGIN / 2)] : `floor-${theme}`;
      out.push(this.scene.add.tileSprite(x0, FLOOR_Y, MARGIN, H - FLOOR_Y + 200, floor).setOrigin(0, 0).setDepth(5).setTilePosition(x0, 0));
    }
    return out;
  }

  private drawCeiling(theme: Exclude<Theme, "yard">) {
    const c = CEILING[theme];
    const key = `ceiling-${theme}`;
    gfxTexture(this.scene, key, c.step, 200, (g) => {
      g.fillStyle(c.base, 1);
      g.fillRect(0, 0, c.step, 200);
      g.fillStyle(c.beam, 1);
      g.fillRect(c.beamX, 0, c.beamW, 200);
    });
    const depth = 1200;
    const x0 = -MARGIN;
    const span = this.width + MARGIN * 2;
    const t = this.scene.add.tileSprite(x0, -depth, span, depth, key).setOrigin(0, 0).setDepth(0).setTilePosition(x0, 0);
    const g = this.scene.add.graphics().setDepth(0.01);
    g.fillStyle(c.beam, 1);
    g.fillRect(x0, -14, span, 14);
    g.fillStyle(INK_HEX, 0.35);
    g.fillRect(x0, -3, span, 3);
    const shade = this.scene.add.image(x0, -14, "shade-top").setOrigin(0, 1).setFlipY(true).setDisplaySize(span, 520).setDepth(0.02).setAlpha(0.9);
    return [t, g, shade];
  }

  private drawColumns() {
    return this.pillars().map((x) => this.scene.add.rectangle(x, 0, HALL.pillarW + 8, 1200, CEILING.corridor.beam).setOrigin(0.5, 1).setDepth(0.015));
  }

  private img(key: string, x: number, y: number, depth: number, origin: [number, number] = [0.5, 1]) {
    return this.scene.add.image(x, y, key).setOrigin(origin[0], origin[1]).setDepth(depth);
  }

  private grounded(img: Phaser.GameObjects.Image, widthK = 1) {
    this.scene.add.image(img.x + (0.5 - img.originX) * img.displayWidth, FLOOR_Y + 3, "blob").setDepth(img.depth - 0.01).setDisplaySize(img.displayWidth * widthK, 28).setAlpha(0.8);
    return img;
  }

  private react(img: Phaser.GameObjects.Image, kind: ReactKind) {
    this.reactive.push({ img, kind, lastHit: -1, lastShake: -1e9 });
    return img;
  }

  private cone(x: number, y: number, alpha = 0.22, scale = 1) {
    return this.scene.add.image(x, y, "light-cone").setOrigin(0.5, 0).setDepth(D.wall + 0.05).setAlpha(alpha).setScale(scale);
  }

  private shaft(x: number, y: number, alpha = 0.2) {
    return this.scene.add.image(x, y, "light-shaft").setOrigin(0, 0).setDepth(D.floor + 0.05).setAlpha(alpha);
  }

  private floor(key: string) {
    for (const [a, b] of this.level.ground) {
      const x0 = a * TILE;
      const x1 = (b + 1) * TILE;
      this.scene.add.tileSprite(x0, FLOOR_Y, x1 - x0, H - FLOOR_Y + 200, key).setOrigin(0, 0).setDepth(5);
    }
  }

  private pillars() {
    const out: number[] = [];
    for (let x = HALL.pillar; x < this.width - 200; x += HALL.bay) out.push(x);
    return out;
  }

  private corridor() {
    const s = this.scene;
    s.add.tileSprite(0, 0, this.width, FLOOR_Y, "wall-corridor").setOrigin(0, 0).setDepth(0);
    gfxTexture(s, "hall-joist", HALL.joist, 140, (g) => {
      g.fillStyle(0x2b2150, 1);
      g.fillRect((HALL.pillar % HALL.joist) - 10, 0, 20, 140);
    });
    s.add.tileSprite(0, 0, this.width, 140, "hall-joist").setOrigin(0, 0).setDepth(0.02);
    s.add.image(0, 140, "shade-top").setOrigin(0, 0).setDisplaySize(this.width, 260).setDepth(0.35).setAlpha(0.45);
    this.floor("floor-corridor");
    for (const x of this.pillars()) this.pillar(x);
    for (let x = HALL.lamp; x < this.width - 100; x += HALL.bay / 2) {
      this.img("ceiling-lamp", x, 130, D.wall + 0.1, [0.5, 0]);
      this.cone(x, 186, 0.28, 1.1).setTint(0xfff1b8);
    }
    makeDrawingTextures(s);
    const plan: [string, number][] = [
      ["door-class-a", 220],
      ["lockers-a", 530],
      ["poster-norun", 530],
      ["window", 1000],
      ["lockers-b", 1450],
      ["lockers-d", 1760],
      ["poster-virtue", 1760],
      ["door-class-b", 2090],
      ["poster-obey", 2090],
      ["plant", 2250],
      ["honor", 2420],
      ["banner", 2800],
      ["fountain", 2930],
      ["window", 3400],
      ["board", 3800],
      ["inspector", 4120],
      ["mop", 4170],
      ["door-class-c", 4540],
      ["poster-laugh", 4540],
      ["drawings", 4830],
      ["lockers-c", 5040],
      ["trophies", 5300],
      ["daylight", 5640],
    ];
    for (const [kind, x] of plan) if (x < this.width) this.corridorModule(kind, x);
    for (const [x, y] of [
      [380, 420],
      [1560, 300],
      [3620, 610],
      [5110, 620],
    ])
      this.img("crack", x, y, D.wall, [0.5, 0.5]).setAlpha(0.8);
    for (const x of [1350, 3710, 4890]) this.img("vent", x, 260, D.wall, [0.5, 0.5]);
    const pillars = this.pillars();
    for (const i of [0, 2, 4]) if (pillars[i]) this.img("clock", pillars[i], 300, D.wall + 0.02, [0.5, 0.5]).setScale(0.68);
    if (pillars[2]) this.img("extinguisher", pillars[2], 760, D.wall + 0.02, [0.5, 0.5]).setScale(0.9);
    for (const x of [1250, 2980, 3690]) this.pile(x);
  }

  private pillar(x: number) {
    const w = HALL.pillarW;
    const pad = 9;
    const shadow = 40;
    gfxTexture(this.scene, "hall-pillar", w + pad * 2 + shadow, FLOOR_Y, (g) => {
      const l = pad;
      g.fillStyle(0x2b2150, 1);
      g.fillRect(l - 4, 0, w + 8, 140);
      g.fillStyle(INK_HEX, 0.09);
      g.fillRect(l + w, 152, 26, FLOOR_Y - 152 - 16);
      g.fillStyle(INK_HEX, 0.06);
      g.fillRect(l + w + 26, 152, 14, FLOOR_Y - 152 - 16);
      g.fillStyle(0xe8d8b0, 1);
      g.fillRect(l, 140, w, FLOOR_Y - 140);
      g.fillStyle(0xd8c59a, 1);
      g.fillRect(l + w - 20, 140, 20, FLOOR_Y - 140);
      g.fillStyle(0xfff6dc, 0.7);
      g.fillRect(l + 6, 150, 6, FLOOR_Y - 190);
      g.lineStyle(5, INK_HEX, 1);
      g.strokeRect(l, 140, w, FLOOR_Y - 140);
      g.fillStyle(INK_HEX, 1);
      g.fillRoundedRect(l - 9, 126, w + 18, 26, 5);
      g.fillStyle(0xf3e6c4, 1);
      g.fillRoundedRect(l - 5, 130, w + 10, 18, 3);
      g.fillStyle(0xd8c59a, 1);
      g.fillRect(l - 5, 142, w + 10, 6);
      g.fillStyle(INK_HEX, 1);
      g.fillRoundedRect(l - 9, FLOOR_Y - 38, w + 18, 40, { tl: 5, tr: 5, bl: 0, br: 0 });
      g.fillStyle(0x3f3170, 1);
      g.fillRect(l - 5, FLOOR_Y - 34, w + 10, 34);
      g.fillStyle(0x5a46a0, 1);
      g.fillRect(l - 5, FLOOR_Y - 34, w + 10, 7);
    });
    this.img("hall-pillar", x - w / 2 - pad, 0, 0.3, [0, 0]);
  }

  private corridorModule(kind: string, x: number) {
    if (kind.startsWith("lockers")) {
      this.grounded(this.react(this.img(kind, x, FLOOR_Y, D.back), "locker"));
      return;
    }
    if (kind.startsWith("door-class")) {
      this.grounded(this.img(kind, x, FLOOR_Y, D.back), 0.9);
      return;
    }
    if (kind === "poster-recess") {
      this.react(this.img(kind, x, 480, D.back, [0.5, 0.5]).setScale(0.85), "swing");
      return;
    }
    if (kind.startsWith("poster")) {
      this.react(this.img(kind, x, 450, D.back, [0.5, 0.5]).setScale(0.9), "swing");
      return;
    }
    if (kind === "honor") {
      this.react(this.img("honor-roll", x, 470, D.back, [0.5, 0.5]), "swing");
      return;
    }
    if (kind === "window") {
      this.img("window-yard", x, 440, D.back, [0.5, 0.5]);
      this.react(this.img("plant", x + 90, 548, D.back + 0.01).setScale(0.6), "plant");
      this.shaft(x - 150, 340, 0.26);
      return;
    }
    if (kind === "plant") {
      this.grounded(this.react(this.img("plant", x, FLOOR_Y, D.back + 0.01).setScale(0.85), "plant"), 0.7);
      return;
    }
    if (kind === "board") {
      this.react(this.img("board", x, 440, D.back, [0.5, 0.5]), "swing");
      return;
    }
    if (kind === "inspector") {
      this.react(this.img("portrait", x, 305, D.back, [0.5, 0.5]).setScale(0.8), "swing");
      return;
    }
    if (kind === "fountain") {
      this.grounded(this.img("fountain", x, FLOOR_Y, D.back));
      this.grounded(this.react(this.img("bin", x + 100, FLOOR_Y, D.back).setScale(0.8), "bin"));
      return;
    }
    if (kind === "banner") {
      this.react(this.img("banner-silence", x, 290, D.back + 0.02, [0.5, 0]).setScale(0.85), "swing");
      return;
    }
    if (kind === "mop") {
      this.grounded(this.img("mop-cart", x, FLOOR_Y, D.back));
      return;
    }
    if (kind === "drawings") {
      const pins: [number, number, number][] = [
        [-110, 470, -5],
        [0, 452, 3],
        [110, 474, -2],
      ];
      pins.forEach(([dx, y, angle], i) => this.react(this.img(`drawing-${i}`, x + dx, y, D.back, [0.5, 0.1]).setAngle(angle), "swing"));
      return;
    }
    if (kind === "trophies") {
      this.grounded(this.react(this.img("trophy-case", x, FLOOR_Y, D.back), "metal"));
      this.img("pennants", x - 40, 300, D.wall, [0.5, 0]).setScale(0.8);
      this.corridorModule("poster-recess", x);
      return;
    }
    if (kind === "daylight") {
      this.scene.add.image(x, FLOOR_Y + 26, "spot").setDepth(5.3).setDisplaySize(560, 90).setAlpha(0.5).setTint(0xfff1b8);
      this.scene.add.image(x, FLOOR_Y - 150, "spot").setDepth(D.wall).setDisplaySize(420, 360).setAlpha(0.28);
    }
  }

  private pile(x: number, key = "paper-pile") {
    const img = this.img(key, x, FLOOR_Y + 6, D.floor + 0.2);
    this.piles.push({ x, y: FLOOR_Y - 10, at: -9999, img });
  }

  private yard() {
    const s = this.scene;
    makeYardTextures(s);
    this.sky = s.add.image(0, 0, "sky").setOrigin(0, 0).setDisplaySize(W * 1.4, H * 1.4).setScrollFactor(0).setDepth(0);
    this.layer(s.add.circle(1500, 210, 74, 0xffe39a).setStrokeStyle(6, INK_HEX).setScrollFactor(0.04, 0).setDepth(D.far));
    for (let i = 0; i < 6; i += 1) this.layer(this.img("cloud", 200 + i * 520, 170 + (i % 3) * 70, D.far, [0.5, 0.5]).setScrollFactor(0.1, 0).setScale(0.8 + (i % 2) * 0.3));
    for (let i = 0; i < 3; i += 1) this.layer(this.img("trees-far", i * 1600, 840, D.far + 0.05, [0, 1]).setScrollFactor(0.2, 0).setScale(1.3));
    this.layer(this.img("yard-hall", at(3120, 0.38), 862, D.mid, [0.5, 1]).setScrollFactor(0.38, 0).setScale(0.95));
    this.plaque(at(3120, 0.38) - 10, 620, "REFEITÓRIO", { size: 26, fill: 0xffc83d, color: "#1d1830", depth: D.mid + 0.001, scroll: 0.38 });
    this.layer(this.img("yard-annex", at(5800, 0.38), 862, D.mid, [0.5, 1]).setScrollFactor(0.38, 0).setScale(0.92));
    this.layer(this.img("yard-haze", -W, 280, D.mid + 0.01, [0, 0]).setScrollFactor(0, 0).setDisplaySize(W * 4, 600));
    this.layer(this.img("building-b", at(1270, 0.5), 852, D.mid + 0.02, [0.5, 1]).setScrollFactor(0.5, 0).setScale(1.15));
    this.scoreboard(at(1270, 0.5) + 250, 364, 0.6, 432);
    this.layer(this.img("building", at(4450, 0.5), 852, D.mid + 0.02, [0.5, 1]).setScrollFactor(0.5, 0).setScale(1.2));
    this.backdrop();
    this.yardFloor();
    if (this.level.exit) this.facade(cx(this.level.exit.col) + TILE / 2);
    this.court();
    this.canteen();
    this.commons();
    this.garden();
    const tufts: [number, number, boolean][] = [[180, 1.2, false], [1260, 1.05, true], [4120, 1.2, false], [4760, 1, true], [5560, 1.25, false], [6040, 1.1, true], [6560, 1.2, false], [7060, 1, true]];
    for (const [x, k, flip] of tufts) this.img("grass-tuft", x, H + 10, D.front).setScrollFactor(1.15, 1).setScale(k).setFlipX(flip);
  }

  private backdrop() {
    const s = this.scene;
    const f = 0.65;
    const cut = YARD_SECTORS.slice(1).map((sec) => at(sec.from, f));
    const strips: [string, number, number, number][] = [
      ["fence-tile", -400, cut[0], 620],
      ["yard-mural", cut[0], cut[1], 680],
      ["yard-hedge", cut[1], cut[2], 712],
      ["yard-railing", cut[2], at(this.width + MARGIN, f), 660],
    ];
    this.layer(s.add.rectangle(-400, 836, at(this.width + MARGIN, f) + 400, 30, 0xc9a06a).setOrigin(0, 0).setScrollFactor(f, 0).setDepth(D.mid + 0.05));
    for (const [key, a, b, y] of strips) this.layer(s.add.tileSprite(a, y, b - a, s.textures.get(key).getSourceImage().height, key).setOrigin(0, 0).setScrollFactor(f, 0).setDepth(D.mid + 0.1));
    for (const x of cut) this.layer(this.img("yard-pillar", x, 866, D.mid + 0.11, [0.5, 1]).setScrollFactor(f, 0));
    for (const x of [at(700, f), at(2200, f)]) this.layer(this.img("hoop", x, 860, D.mid + 0.12).setScrollFactor(f, 0).setScale(0.8));
  }

  private scoreboard(x: number, y: number, k: number, roof: number) {
    const depth = D.mid + 0.019;
    const f = 0.5;
    for (const dx of [-90, 90]) this.layer(this.img("yard-post", x + dx * k, roof, depth - 0.0005, [0.5, 1]).setScrollFactor(f, 0).setDisplaySize(14, roof - y));
    this.layer(this.img("yard-scoreboard", x, y, depth, [0.5, 0.5]).setScrollFactor(f, 0).setScale(k));
    const label = { fill: 0x2b2150, color: "#fbf5e6", depth: depth + 0.001, scroll: f, plain: true };
    this.plaque(x - 83 * k, y - 52 * k, "RECREIO", { ...label, size: Math.round(21 * k) });
    this.plaque(x + 83 * k, y - 52 * k, "REGRAS", { ...label, size: Math.round(21 * k) });
    this.plaque(x - 83 * k, y + 13 * k, "0", { ...label, size: Math.round(64 * k), color: "#ffc83d" });
    this.plaque(x + 83 * k, y + 13 * k, "10", { ...label, size: Math.round(64 * k), color: "#ff8a5c" });
  }

  private yardFloor() {
    for (const [a, b] of this.level.ground) {
      const x0 = a * TILE;
      const x1 = (b + 1) * TILE;
      for (const sec of YARD_SECTORS) {
        const l = Math.max(x0, sec.from);
        const r = Math.min(x1, sec.to);
        if (r <= l) continue;
        this.scene.add.tileSprite(l, FLOOR_Y, r - l, H - FLOOR_Y + 200, YARD_FLOOR[sec.id]).setOrigin(0, 0).setDepth(5).setTilePosition(l, 0);
        if (sec.from > x0 && sec.from < x1) this.img("floor-seam", sec.from, FLOOR_Y - 2, 5.05, [0.5, 0]);
      }
    }
  }

  private court() {
    this.react(this.img("protest-sign", 120, FLOOR_Y + 4, D.floor), "swing");
    this.img("tree-big", 260, FLOOR_Y + 8, D.back);
    for (const x of [1090, 1560]) this.img("lamp-post", x, FLOOR_Y, D.back + 0.02).setScale(0.9);
    this.strung(1090, 1560, 600);
    this.react(this.img("backpack", 940, FLOOR_Y + 4, D.floor + 0.1).setScale(0.8), "plant");
    this.img("jump-rope", 1520, FLOOR_Y + 6, D.floor + 0.1);
  }

  private canteen() {
    this.img("tree-big", 2560, FLOOR_Y + 8, D.back).setFlipX(true).setScale(0.9);
    this.img("kiosk", 3060, FLOOR_Y, D.back);
    this.img("picnic-table", 2770, FLOOR_Y, D.floor).setScale(0.85);
    this.grounded(this.img("yard-chalkboard", 2610, FLOOR_Y, D.floor + 0.02), 0.6);
    this.plaque(2610, 878, "HOJE:\nSOPA DE\nSILÊNCIO", { size: 22, fill: 0x2f5d4a, color: "#f4f1e6", depth: D.floor + 0.03, plain: true, font: "hand" });
    this.grounded(this.react(this.img("bin", 3322, FLOOR_Y, D.back + 0.01).setScale(0.7), "bin"), 0.7);
    const tape = this.img("yard-tape", 3440, 872, 6.05, [0.5, 0.5]).setAngle(-7).setScale(0.82);
    this.plaque(tape.x, tape.y, "CONFISCADAS", { size: 19, fill: 0xef4f43, color: "#fbf5e6", depth: 6.06, plain: true, angle: -7 });
    for (const x of [3540, 4300]) this.img("lamp-post", x, FLOOR_Y, D.back + 0.02).setScale(0.9);
    this.bunting(3540, 4300, 560, 30);
  }

  private commons() {
    this.img("tree-ipe-yellow", 4380, FLOOR_Y + 8, D.back).setScale(0.88);
    this.react(this.img("backpack", 4660, FLOOR_Y + 4, D.floor + 0.1).setScale(0.7).setFlipX(true), "plant");
    this.img("yard-chalk", 4176, FLOOR_Y + 24, 5.1, [0, 0]);
    this.scene.add.text(4930, FLOOR_Y + 46, "VOLTA, RECREIO!", { fontFamily: this.fonts.hand, fontSize: "30px", color: "#ffffff" }).setOrigin(0.5).setAlpha(0.72).setAngle(-3).setDepth(5.1);
  }

  private garden() {
    this.img("tree-ipe-pink", 5860, FLOOR_Y + 8, D.back);
    this.grounded(this.react(this.img("yard-bookdrop", 5700, FLOOR_Y, D.back + 0.01), "metal"), 0.7);
    this.plaque(5700, 846, "DEVOLUÇÃO", { size: 15, fill: 0x3f6fb5, color: "#fbf5e6", depth: D.back + 0.02, plain: true });
    const note = this.react(this.img("yard-note", 5708, 930, D.back + 0.03, [0.5, 0.5]).setAngle(5).setScale(0.62), "swing");
    this.plaque(note.x, note.y, "E O RECREIO?", { size: 17, fill: 0xfdf0c2, color: "#c4352c", depth: D.back + 0.04, plain: true, font: "hand", angle: 5 });
    this.grounded(this.img("yard-post", 5990, FLOOR_Y, D.back, [0.5, 1]).setDisplaySize(20, 330), 0.25);
    const plate = this.react(this.img("yard-plate", 5990, 694, D.back + 0.01, [0.5, 0.5]), "swing");
    this.plaque(plate.x, plate.y, "SILÊNCIO", { size: 32, fill: 0xfbf5e6, color: "#c4352c", depth: D.back + 0.02, plain: true });
    const kid = this.img("yard-note", 6000, 760, D.back + 0.03, [0.5, 0.5]).setAngle(-4).setScale(0.78);
    this.plaque(kid.x, kid.y, "SÓ LÁ DENTRO!", { size: 19, fill: 0xfdf0c2, color: "#2b2150", depth: D.back + 0.04, plain: true, font: "hand", angle: -4 });
  }

  private plaque(x: number, y: number, text: string, o: { size: number; fill: number; color: string; depth: number; scroll?: number; plain?: boolean; font?: "display" | "hand"; angle?: number }) {
    const s = this.scene;
    const t = s.add.text(x, y, text, { fontFamily: o.font === "hand" ? this.fonts.hand : this.fonts.display, fontSize: `${o.size}px`, color: o.color, align: "center", lineSpacing: -4, padding: { x: 2, y: 2 } }).setOrigin(0.5).setDepth(o.depth + 0.0005).setAngle(o.angle ?? 0);
    if (o.scroll !== undefined) this.layer(t.setScrollFactor(o.scroll, 0));
    if (o.plain) return t;
    const w = Math.ceil(t.width + o.size * 0.9);
    const h = Math.ceil(t.height + o.size * 0.3);
    const key = `plaque-${w}-${h}-${o.fill.toString(16)}`;
    gfxTexture(s, key, w + 8, h + 8, (g) => {
      g.fillStyle(INK_HEX, 1);
      g.fillRoundedRect(4, 6, w, h, 10);
      g.fillRoundedRect(0, 0, w, h, 10);
      g.fillStyle(o.fill, 1);
      g.fillRoundedRect(4, 4, w - 8, h - 8, 7);
    });
    const plate = this.img(key, x + 4, y + 4, o.depth, [0.5, 0.5]).setAngle(o.angle ?? 0);
    if (o.scroll !== undefined) this.layer(plate.setScrollFactor(o.scroll, 0));
    return t;
  }

  private strung(x0: number, x1: number, y: number) {
    const mid = (x0 + x1) / 2;
    const banner = this.img("banner-protest", mid, y, D.back + 0.03, [0.5, 0]).setScale(0.86);
    const half = banner.displayWidth / 2;
    const g = this.scene.add.graphics().setDepth(D.back + 0.025);
    g.lineStyle(4, INK_HEX, 1);
    g.lineBetween(x0 + 10, y - 10, mid - half + 14, y + 12);
    g.lineBetween(x1 - 10, y - 10, mid + half - 14, y + 12);
    this.react(banner, "swing");
  }

  private facade(door: number) {
    const s = this.scene;
    const x0 = door - 176;
    const top = 430;
    gfxTexture(s, "yard-facade", 640, FLOOR_Y - top, (g) => {
      const h = FLOOR_Y - top;
      g.fillStyle(0xf3e6c4, 1);
      g.fillRect(0, 0, 640, h);
      g.fillStyle(0xeadbb4, 1);
      for (let y = 70; y < h - 120; y += 44) g.fillRect(0, y, 640, 4);
      g.fillStyle(0xc4352c, 1);
      g.fillRect(0, 0, 640, 44);
      g.fillStyle(0x9c2a23, 1);
      g.fillRect(0, 36, 640, 8);
      g.fillStyle(INK_HEX, 1);
      g.fillRect(0, 44, 640, 5);
      g.fillStyle(0x8a5a2c, 1);
      g.fillRect(0, h - 90, 640, 90);
      g.fillStyle(0x6e4522, 1);
      for (let y = h - 80; y < h; y += 22) for (let x = (y / 22) % 2 ? 0 : 20; x < 640; x += 40) g.fillRect(x, y, 34, 16);
      g.fillStyle(INK_HEX, 1);
      g.fillRect(0, h - 94, 640, 5);
      g.fillStyle(0x5cb9f0, 1);
      g.fillRect(460, 120, 84, 110);
      g.fillStyle(0xbfe6fb, 1);
      g.fillRect(466, 126, 34, 46);
      g.fillRect(506, 126, 32, 46);
      g.fillRect(466, 178, 34, 46);
      g.fillRect(506, 178, 32, 46);
      g.lineStyle(5, INK_HEX, 1);
      g.strokeRect(460, 120, 84, 110);
      g.fillStyle(0xd8c59a, 1);
      g.fillRect(452, 228, 100, 10);
      g.lineStyle(3, INK_HEX, 1);
      g.strokeRect(452, 228, 100, 10);
    });
    const wall = s.add.tileSprite(x0, top, this.width + MARGIN - x0, FLOOR_Y - top, "yard-facade").setOrigin(0, 0).setDepth(D.back - 0.05);
    const edge = s.add.graphics().setDepth(D.back - 0.04);
    edge.fillStyle(INK_HEX, 0.12);
    edge.fillRect(x0 - 18, top + 50, 18, FLOOR_Y - top - 50);
    edge.lineStyle(6, INK_HEX, 1);
    edge.lineBetween(x0, top, x0, FLOOR_Y);
    edge.lineBetween(x0, top, wall.x + wall.width, top);
    this.img("poster-read", door, 560, D.back - 0.03, [0.5, 0.5]).setScale(0.62);
    this.scene.add.image(door, FLOOR_Y + 18, "spot").setDepth(5.3).setDisplaySize(300, 50).setAlpha(0.25).setTint(0x2b2150);
  }

  private bunting(x0: number, x1: number, y: number, sag = 60) {
    const colors = [0xef4f43, 0xffc83d, 0x63d6c1, 0x5cb9f0, 0xf06ba8, 0x93cf4c];
    const g = this.scene.add.graphics().setDepth(D.back + 0.03);
    g.lineStyle(3, INK_HEX, 1);
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= 20; i += 1) {
      const k = i / 20;
      pts.push(new Phaser.Math.Vector2(x0 + (x1 - x0) * k, y + Math.sin(k * Math.PI) * sag));
    }
    g.strokePoints(pts);
    for (let i = 1; i < 20; i += 1) {
      const p = pts[i];
      const f = this.scene.add.image(p.x, p.y, "flag").setOrigin(0.5, 0).setDepth(D.back + 0.04).setTint(colors[i % colors.length]).setScale(0.7);
      if (!this.reduced) this.scene.tweens.add({ targets: f, angle: { from: -8, to: 8 }, duration: 700 + (i % 4) * 120, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  private library() {
    const s = this.scene;
    s.add.tileSprite(0, 0, this.width, FLOOR_Y, "wall-library").setOrigin(0, 0).setDepth(0);
    s.add.image(0, 130, "shade-top").setOrigin(0, 0).setDisplaySize(this.width, 300).setDepth(0.35).setAlpha(0.55);
    this.floor("floor-library");
    for (let x = 350; x < this.width - 100; x += 700) {
      this.img("lamp-warm", x, 120, D.wall + 0.12, [0.5, 0]).setScale(0.75);
      this.cone(x, 200, 0.22, 1.15).setTint(0xfff1b8);
    }
    const shelves: [string, number][] = [
      ["bookcase-tall-a", 1180],
      ["bookcase-tall-e", 1500],
      ["bookcase-tall-c", 2930],
      ["bookcase-tall-d", 4520],
      ["bookcase-mid", 4840],
      ["bookcase-tall-f", 6330],
    ];
    for (const [key, x] of shelves) this.grounded(this.react(this.img(key, x, FLOOR_Y, D.wall + 0.1), "metal"), 0.95);
    const plan: [string, number][] = [
      ["desk", 250],
      ["reader", 250],
      ["window", 2000],
      ["poster-quiet", 2680],
      ["clock", 2960],
      ["table", 3480],
      ["globe", 3700],
      ["notices", 3800],
      ["window", 4080],
      ["ladder", 4690],
      ["catalog", 5080],
      ["poster-read", 5760],
      ["table", 5800],
      ["hours", 6040],
      ["globe", 6540],
    ];
    for (const [kind, x] of plan) this.libraryModule(kind, x);
    this.react(this.img("banner-silence", 1450, 150, D.back + 0.02, [0.5, 0]).setScale(0.8), "swing");
    for (const x of [1180, 4840]) this.img("clock", x, 300, D.wall + 0.15, [0.5, 0.5]).setScale(0.8);
    this.pile(1320, "book-pile");
    this.pile(4620, "book-pile");
    this.pile(6120, "book-pile");
  }

  private libraryModule(kind: string, x: number) {
    if (kind === "desk") {
      this.grounded(this.img("librarian-desk", x, FLOOR_Y, D.back).setScale(0.9).setTint(RECEDE));
      this.react(this.img("sign-library", x + 320, 290, D.back + 0.02, [0.5, 0]).setScale(0.85), "swing");
      return;
    }
    if (kind === "window") {
      this.img("window-tall", x, 640, D.back, [0.5, 1]).setScale(0.82);
      this.shaft(x - 120, 260, 0.22);
      return;
    }
    if (kind.startsWith("poster")) {
      this.react(this.img(kind, x, 470, D.back, [0.5, 0.5]).setScale(0.9), "swing");
      return;
    }
    if (kind === "clock") {
      this.img("clock", x, 300, D.back, [0.5, 0.5]).setScale(0.9);
      return;
    }
    if (kind === "table") {
      this.grounded(this.img("reading-table", x, FLOOR_Y, D.back).setScale(0.85).setTint(RECEDE), 0.9);
      return;
    }
    if (kind === "globe") {
      this.grounded(this.react(this.img("globe", x, FLOOR_Y, D.back + 0.01).setScale(0.9).setTint(RECEDE), "plant"), 0.6);
      return;
    }
    if (kind === "reader") {
      this.react(this.img("frame-reader", x, 400, D.back, [0.5, 0]).setScale(0.8), "swing");
      return;
    }
    if (kind === "notices") {
      this.react(this.img("board-notices", x, 330, D.back, [0.5, 0]).setScale(0.8), "swing");
      return;
    }
    if (kind === "hours") {
      this.react(this.img("board-hours", x, 290, D.back, [0.5, 0]).setScale(0.8), "swing");
      return;
    }
    if (kind === "ladder") {
      this.img("ladder", x, FLOOR_Y + 4, D.wall + 0.15).setScale(0.95);
      return;
    }
    if (kind === "catalog") this.grounded(this.react(this.img("card-catalog", x, FLOOR_Y, D.back).setTint(RECEDE), "metal"));
  }

  private office() {
    const s = this.scene;
    const arenaX = this.level.boss ? this.level.boss.arena * TILE : this.width;
    s.add.tileSprite(0, 0, this.width, FLOOR_Y, "wall-office").setOrigin(0, 0).setDepth(0);
    s.add.image(0, 130, "shade-top").setOrigin(0, 0).setDisplaySize(this.width, 300).setDepth(0.35).setAlpha(0.6);
    this.floor("floor-office");
    for (const x of [300, 880, 2290, 3760]) this.img("column", x, FLOOR_Y, D.wall + 0.1);
    for (let x = 350; x < arenaX - 200; x += 700) {
      this.img("lamp-warm", x, 120, D.wall + 0.12, [0.5, 0]).setScale(0.8);
      this.cone(x, 210, 0.24, 1.2);
    }
    const plan: [string, number][] = [
      ["door-admin-b", 100],
      ["window", 670],
      ["gallery", 1400],
      ["banner-order", 1900],
      ["door-admin-a", 2520],
      ["window", 2800],
      ["bust", 3310],
      ["banner-obey", 3350],
      ["stairs", 3450],
      ["gallery", 4200],
      ["signpost", 4810],
    ];
    for (const [kind, x] of plan) this.officeModule(kind, x);
    for (const x of [1180, 3900]) this.grounded(this.react(this.img("plant-big", x, FLOOR_Y, D.back).setScale(0.85), "plant"));
    this.img("office-door", arenaX - 120, FLOOR_Y, D.back);
  }

  private officeModule(kind: string, x: number) {
    if (kind === "window") {
      this.img("window-tall", x, 640, D.back, [0.5, 1]).setScale(0.82);
      this.shaft(x - 120, 260, 0.2);
      return;
    }
    if (kind === "gallery") {
      for (const [k, dx] of [
        ["principal-a", -200],
        ["principal-b", 0],
        ["principal-c", 200],
      ] as const) {
        const p = this.react(this.img(k, x + dx, 360, D.back, [0.5, 0.5]).setScale(0.9), "swing");
        this.img("hall-light", x + dx, 240, D.back + 0.01, [0.5, 0.5]).setScale(0.6);
        this.scene.add.image(x + dx, 370, "spot").setDepth(D.back - 0.01).setScale(1.3).setAlpha(0.7);
        p.setData("frame", true);
      }
      return;
    }
    if (kind.startsWith("banner-")) {
      this.react(this.img(kind, x, 150, D.back, [0.5, 0]).setScale(0.9), "swing");
      return;
    }
    if (kind.startsWith("door-admin")) {
      this.img(kind, x, FLOOR_Y, D.back);
      return;
    }
    if (kind === "bust") {
      this.react(this.img("bust", x, FLOOR_Y, D.back), "metal");
      this.scene.add.image(x, 820, "spot").setDepth(D.back - 0.01).setScale(1.6).setAlpha(0.55);
      return;
    }
    if (kind === "stairs") {
      this.img("stairs-office", x, FLOOR_Y, D.back - 0.05).setScale(0.9);
      return;
    }
    if (kind === "signpost") this.react(this.img("signpost", x, FLOOR_Y, D.back).setScale(0.5), "swing");
  }

  private arena(left: number) {
    const s = this.scene;
    const cx = left + W / 2;
    const curtainTop = FLOOR_Y - 680 * 0.9;
    const cl = this.img("curtain", left, curtainTop, D.back + 0.05, [0, 0]).setScale(0.9);
    const cr = this.img("curtain", left + W, curtainTop, D.back + 0.05, [1, 0]).setScale(0.9).setFlipX(true);
    const banner = this.img("banner-discipline", cx, 170, D.back, [0.5, 0]).setScale(0.95);
    const board = this.img("rules-board", left + 470, 520, D.back, [0.5, 0.5]).setScale(0.9);
    const shelf = this.img("trophy-shelf", left + W - 470, 520, D.back, [0.5, 0.5]).setScale(0.9);
    const p1 = this.img("portrait", left + 720, 520, D.back, [0.5, 0.5]);
    const p2 = this.img("principal-c", left + W - 720, 520, D.back, [0.5, 0.5]);
    const desk = this.grounded(this.img("big-desk", cx, FLOOR_Y - 4, D.wall + 0.15).setScale(0.86).setTint(0xd6cbe0), 0.95);
    this.img("file-cabinet", left + W - 300, FLOOR_Y, D.floor).setScale(0.9);
    this.img("plant-big", left + 300, FLOOR_Y, D.floor).setScale(0.9);
    this.img("lamp-warm", cx, 90, D.back + 0.1, [0.5, 0]);
    this.cone(cx, 190, 0.25, 1.8);
    this.quakeTargets.push(banner, board, shelf, p1, p2);
    this.refs = { banner, board, shelf, frames: [p1, p2], curtains: [cl, cr], desk, left };
    this.paperFrom = { x: cx, y: FLOOR_Y - 200 };
    const spot = s.add.image(cx, 120, "light-cone").setOrigin(0.5, 0).setDepth(D.floor + 0.1).setAlpha(0.18).setScale(1, 1.25);
    return spot;
  }

  hitReactive(box: Phaser.Geom.Rectangle, attackId: number) {
    let hit: ReactKind | null = null;
    for (const r of this.reactive) {
      if (r.lastHit === attackId) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(box, r.img.getBounds())) continue;
      r.lastHit = attackId;
      hit = r.kind;
      this.wobble(r.img, r.kind);
      if (r.kind === "bin" || r.kind === "locker") this.papers(r.img.x, r.img.y - r.img.displayHeight * 0.5, 3);
    }
    return hit;
  }

  private wobble(img: Phaser.GameObjects.Image, kind: ReactKind) {
    if (this.reduced) return;
    if (kind === "swing") {
      this.tilt(img, -10, 700);
      return;
    }
    if (kind === "plant") {
      this.tilt(img, -6, 500);
      return;
    }
    this.jiggle(img, 5);
  }

  private tilt(img: Phaser.GameObjects.Image, by: number, ms: number) {
    const base = (img.getData("baseAngle") as number | undefined) ?? img.angle;
    img.setData("baseAngle", base);
    this.scene.tweens.killTweensOf(img);
    img.setX((img.getData("baseX") as number | undefined) ?? img.x);
    this.scene.tweens.add({ targets: img, angle: { from: base + by, to: base }, duration: ms, ease: "Elastic.easeOut" });
  }

  private jiggle(img: Phaser.GameObjects.Image, px: number) {
    const base = (img.getData("baseX") as number | undefined) ?? img.x;
    img.setData("baseX", base);
    this.scene.tweens.killTweensOf(img);
    img.setAngle((img.getData("baseAngle") as number | undefined) ?? img.angle);
    this.scene.tweens.add({ targets: img, x: { from: base + px, to: base }, duration: 45, yoyo: true, repeat: 3, onComplete: () => img.setX(base) });
  }

  impact(x: number, power: number) {
    if (this.reduced) return;
    const now = this.scene.time.now;
    const reach = 140 + 340 * power;
    for (const r of this.reactive) {
      const d = Math.abs(r.img.x - x);
      if (d > reach || now - r.lastShake < 450) continue;
      r.lastShake = now;
      const k = power * (1 - (d / reach) * 0.6);
      if (r.kind === "swing") this.tilt(r.img, (r.img.x < x ? -1 : 1) * 5 * k, 900);
      else if (r.kind === "plant") this.tilt(r.img, (r.img.x < x ? -1 : 1) * 7 * k, 800);
      else this.jiggle(r.img, 2 + 3 * k);
    }
    for (const p of this.piles) if (Math.abs(p.x - x) < 120 + 140 * power) this.skim(p, 0, 2);
  }

  private skim(p: Pile, dir: number, n: number) {
    if (!this.reduced) this.scene.tweens.add({ targets: p.img, scaleY: { from: 0.75, to: 1 }, duration: 260, ease: "Back.easeOut" });
    const count = this.reduced ? 1 : n;
    for (let i = 0; i < count; i += 1) {
      const side = dir || (i % 2 ? 1 : -1);
      const sheet = this.scene.add.image(p.x + Phaser.Math.Between(-18, 18), FLOOR_Y - 6, "paper").setDepth(13).setScale(0.6).setAngle(Phaser.Math.Between(-30, 30));
      if (this.reduced) {
        this.scene.tweens.add({ targets: sheet, alpha: 0, delay: 300, duration: 300, onComplete: () => sheet.destroy() });
        continue;
      }
      this.scene.tweens.add({ targets: sheet, x: sheet.x + side * Phaser.Math.Between(70, 150), angle: sheet.angle + side * Phaser.Math.Between(90, 220), duration: 760, ease: "Quad.easeOut" });
      this.scene.tweens.add({ targets: sheet, y: FLOOR_Y - Phaser.Math.Between(26, 48), duration: 210, yoyo: true, ease: "Quad.easeOut" });
      this.scene.tweens.add({ targets: sheet, alpha: 0, delay: 520, duration: 300, onComplete: () => sheet.destroy() });
    }
  }

  papers(x: number, y: number, n: number) {
    if (this.reduced) n = Math.min(n, 1);
    for (let i = 0; i < n; i += 1) {
      const p = this.scene.add.image(x + Phaser.Math.Between(-30, 30), y, "paper").setDepth(13).setScale(0.8).setAngle(Phaser.Math.Between(-40, 40));
      const dx = Phaser.Math.Between(-220, 220);
      this.scene.tweens.add({ targets: p, x: p.x + dx, duration: 1400, ease: "Sine.easeOut" });
      this.scene.tweens.add({ targets: p, y: y - Phaser.Math.Between(80, 180), duration: 500, ease: "Quad.easeOut", yoyo: true, hold: 120 });
      this.scene.tweens.add({ targets: p, angle: p.angle + Phaser.Math.Between(-260, 260), alpha: 0, delay: 600, duration: 900, onComplete: () => p.destroy() });
    }
  }

  private shake(img: Phaser.GameObjects.Image, power: number) {
    const base = (img.getData("baseX") as number | undefined) ?? img.x;
    img.setData("baseX", base);
    this.scene.tweens.add({ targets: img, x: { from: base + 4 * power, to: base }, duration: 55, repeat: 3, yoyo: true, onComplete: () => img.setX(base) });
  }

  private swing(img: Phaser.GameObjects.Image, power: number) {
    const base = (img.getData("baseAngle") as number | undefined) ?? img.angle;
    img.setData("baseAngle", base);
    this.scene.tweens.killTweensOf(img);
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.scene.tweens.add({ targets: img, angle: { from: base + dir * 5 * power, to: base }, duration: 900, ease: "Elastic.easeOut" });
  }

  private billow(img: Phaser.GameObjects.Image, dir: number) {
    const sx = (img.getData("baseScale") as number | undefined) ?? img.scaleX;
    img.setData("baseScale", sx);
    this.scene.tweens.killTweensOf(img);
    this.scene.tweens.add({ targets: img, scaleX: sx * 1.06, angle: dir * 2.5, duration: 240, yoyo: true, ease: "Sine.easeInOut", onComplete: () => img.setAngle(0).setScale(sx, img.scaleY) });
  }

  private deskPapers(n: number, drift = 0) {
    if (!this.paperFrom) return;
    for (let i = 0; i < n; i += 1) {
      const x = this.paperFrom.x + Phaser.Math.Between(-180, 180);
      const p = this.scene.add.image(x, this.paperFrom.y, "paper").setDepth(D.wall + 0.2).setScale(0.75).setAngle(Phaser.Math.Between(-30, 30));
      const dx = drift ? drift * Phaser.Math.Between(160, 320) : Phaser.Math.Between(-200, 200);
      this.scene.tweens.add({ targets: p, x: x + dx, duration: 1300, ease: "Sine.easeOut" });
      this.scene.tweens.add({ targets: p, y: p.y - Phaser.Math.Between(90, 170), duration: 420, ease: "Quad.easeOut", yoyo: true, hold: 100 });
      this.scene.tweens.add({ targets: p, angle: p.angle + Phaser.Math.Between(-240, 240), alpha: 0, delay: 650, duration: 700, onComplete: () => p.destroy() });
    }
  }

  room(event: RoomEvent, dir = 0) {
    const r = this.refs;
    if (!r || this.reduced) return;
    const nearSide = dir < 0 ? 0 : 1;
    switch (event) {
      case "intro":
        this.shake(r.desk, 0.7);
        this.shake(r.shelf, 0.6);
        this.deskPapers(2);
        return;
      case "stomp":
        this.shake(r.shelf, 0.5);
        return;
      case "crash":
        this.shake(r.shelf, 1.3);
        for (const f of r.frames) this.swing(f, 1);
        this.swing(r.banner, 0.6);
        this.billow(r.curtains[nearSide], dir || 1);
        this.deskPapers(3);
        return;
      case "slam":
        this.shake(r.shelf, 1);
        this.shake(r.desk, 0.6);
        this.swing(r.board, 0.8);
        this.deskPapers(3);
        return;
      case "whistle":
        this.billow(r.curtains[0], dir || 1);
        this.billow(r.curtains[1], dir || 1);
        this.swing(r.banner, 0.35);
        this.deskPapers(2, dir);
        return;
      case "hit":
        this.hitCount += 1;
        if (this.hitCount % 3 === 0) this.swing(r.frames[this.hitCount % 2], 0.4);
        return;
      case "angry":
        for (const f of r.frames) this.swing(f, 0.8);
        this.shake(r.shelf, 0.9);
        this.swing(r.banner, 0.5);
        return;
      case "defeat":
        for (const f of r.frames) this.swing(f, 1.4);
        this.swing(r.board, 1);
        this.swing(r.banner, 1);
        this.shake(r.shelf, 1.6);
        this.shake(r.desk, 1);
        this.billow(r.curtains[0], -1);
        this.billow(r.curtains[1], 1);
        this.deskPapers(5);
    }
  }

  quake(power: number) {
    if (this.reduced) return;
    for (const img of this.quakeTargets) {
      const base = img.getData("baseAngle") ?? img.angle;
      img.setData("baseAngle", base);
      this.scene.tweens.killTweensOf(img);
      this.scene.tweens.add({ targets: img, angle: { from: base + Phaser.Math.Between(-6, 6) * power, to: base }, duration: 900, ease: "Elastic.easeOut" });
    }
    if (this.paperFrom && this.level.boss) this.papers(this.paperFrom.x + Phaser.Math.Between(-200, 200), this.paperFrom.y, Math.round(2 + power * 2));
  }

  update(t: number, hero: SceneryHero, view: Phaser.Geom.Rectangle) {
    if (!this.reduced && Math.abs(hero.vx) > 120) {
      const now = this.scene.time.now;
      for (const r of this.reactive) {
        if (r.kind !== "plant" || now - r.lastShake < 900) continue;
        const b = r.img.getBounds();
        if (hero.x + 34 < b.x || hero.x - 34 > b.right || hero.feet < b.y + 10 || hero.top > b.bottom) continue;
        r.lastShake = now;
        this.tilt(r.img, Math.sign(hero.vx) * 8, 800);
      }
    }
    if (hero.grounded && Math.abs(hero.vx) > 320) {
      for (const p of this.piles) {
        if (Math.abs(p.x - hero.x) < 70 && Math.abs(hero.feet - FLOOR_Y) < 8 && t - p.at > 2500) {
          p.at = t;
          this.skim(p, Math.sign(hero.vx), 3);
          return true;
        }
      }
    }
    if (this.reduced || t < this.nextAmbient) return false;
    this.nextAmbient = t + Phaser.Math.Between(3500, 6500);
    if (this.level.theme === "yard") {
      for (let i = 0; i < 3; i += 1) {
        const leaf = this.scene.add.image(view.x + Phaser.Math.Between(100, view.width - 100), view.y - 20, "leaf").setDepth(D.front - 1);
        this.scene.tweens.add({ targets: leaf, y: FLOOR_Y - 10, x: leaf.x - Phaser.Math.Between(80, 260), angle: Phaser.Math.Between(-360, 360), duration: Phaser.Math.Between(3200, 4600), ease: "Sine.easeIn", delay: i * 300, onComplete: () => this.scene.tweens.add({ targets: leaf, alpha: 0, duration: 600, onComplete: () => leaf.destroy() }) });
      }
    } else if (this.level.theme === "library") {
      for (let i = 0; i < 5; i += 1) {
        const mote = this.scene.add.circle(view.x + Phaser.Math.Between(80, view.width - 80), view.y + view.height * Phaser.Math.FloatBetween(0.3, 0.8), Phaser.Math.Between(2, 4), 0xfff1c8, 0).setDepth(D.back + 0.5);
        this.scene.tweens.add({ targets: mote, alpha: { from: 0, to: 0.7 }, duration: 900, yoyo: true, hold: 1800, delay: i * 260, onComplete: () => mote.destroy() });
        this.scene.tweens.add({ targets: mote, x: mote.x + Phaser.Math.Between(-60, 60), y: mote.y - Phaser.Math.Between(40, 110), duration: 3600, delay: i * 260, ease: "Sine.easeInOut" });
      }
    } else if (this.level.theme === "corridor") {
      const p = this.scene.add.image(view.right + 40, view.y + view.height * 0.45, "paper").setDepth(D.back + 0.5).setScale(0.6).setAlpha(0.9);
      this.scene.tweens.add({ targets: p, x: view.x - 60, y: p.y + 140, angle: 540, duration: 4200, ease: "Sine.easeInOut", onComplete: () => p.destroy() });
    }
    return false;
  }
}
