import * as Phaser from "phaser";
import { FLOOR_Y, H, TILE, W } from "../config";
import type { LevelDef } from "../levels";
import { INK_HEX } from "../../kit/ui";

export type ReactKind = "locker" | "bin" | "swing" | "plant" | "metal";
type Reactive = { img: Phaser.GameObjects.Image; kind: ReactKind; lastHit: number };
type Pile = { x: number; y: number; at: number };

const D = { far: 0.1, mid: 0.4, wall: 0.6, back: 0.8, floor: 0.9, front: 52 };

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
    g.fillRect(150, 0, 20, 140);
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

export class Scenery {
  private reactive: Reactive[] = [];
  private piles: Pile[] = [];
  private quakeTargets: Phaser.GameObjects.Image[] = [];
  private paperFrom: { x: number; y: number } | null = null;
  private nextAmbient = 2500;
  readonly spotlight: Phaser.GameObjects.Image | null = null;

  constructor(
    private scene: Phaser.Scene,
    private level: LevelDef,
    private width: number,
    private reduced: boolean,
  ) {
    makeLightTextures(scene);
    makeWallTextures(scene);
    if (level.theme === "corridor") this.corridor();
    else if (level.theme === "yard") this.yard();
    else {
      this.office();
      if (level.boss) this.spotlight = this.arena(level.boss.arena * TILE);
    }
  }

  private img(key: string, x: number, y: number, depth: number, origin: [number, number] = [0.5, 1]) {
    return this.scene.add.image(x, y, key).setOrigin(origin[0], origin[1]).setDepth(depth);
  }

  private grounded(img: Phaser.GameObjects.Image, widthK = 1) {
    this.scene.add.image(img.x + (0.5 - img.originX) * img.displayWidth, FLOOR_Y + 3, "blob").setDepth(img.depth - 0.01).setDisplaySize(img.displayWidth * widthK, 28).setAlpha(0.8);
    return img;
  }

  private react(img: Phaser.GameObjects.Image, kind: ReactKind) {
    this.reactive.push({ img, kind, lastHit: -1 });
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

  private corridor() {
    const s = this.scene;
    s.add.tileSprite(0, 0, this.width, FLOOR_Y, "wall-corridor").setOrigin(0, 0).setDepth(0);
    s.add.image(0, 140, "shade-top").setOrigin(0, 0).setDisplaySize(this.width, 260).setDepth(0.35).setAlpha(0.45);
    this.floor("floor-corridor");
    for (const x of [880, 2230, 3420, 4380]) {
      const g = s.add.graphics().setDepth(0.3);
      g.fillStyle(0xe8d8b0, 1);
      g.fillRect(x, 140, 76, FLOOR_Y - 140);
      g.fillStyle(0xd8c59a, 1);
      g.fillRect(x + 56, 140, 20, FLOOR_Y - 140);
      g.lineStyle(5, INK_HEX, 1);
      g.strokeRect(x, 140, 76, FLOOR_Y - 140);
    }
    for (let x = 300; x < this.width; x += 620) {
      this.img("ceiling-lamp", x, 130, D.wall + 0.1, [0.5, 0]);
      this.cone(x, 186, 0.28, 1.1).setTint(0xfff1b8);
    }
    const plan: [string, number][] = [
      ["door-class-a", 240],
      ["lockers-a", 560],
      ["poster-norun", 560],
      ["window", 1000],
      ["lockers-b", 1450],
      ["lockers-d", 1735],
      ["poster-virtue", 1590],
      ["door-class-b", 2060],
      ["honor", 2420],
      ["fountain", 2780],
      ["banner", 3060],
      ["lockers-c", 3250],
      ["poster-obey", 3500],
      ["window", 3720],
      ["mop", 3960],
      ["board", 4250],
      ["door-class-c", 4560],
      ["lockers-a", 4980],
      ["poster-laugh", 4880],
      ["trophies", 5330],
    ];
    for (const [kind, x] of plan) this.corridorModule(kind, x);
    for (const [x, y] of [
      [380, 420],
      [1900, 330],
      [3460, 380],
      [4700, 320],
    ])
      this.img("crack", x, y, D.wall, [0.5, 0.5]).setAlpha(0.8);
    for (const x of [1180, 2900, 4100]) this.img("vent", x, 260, D.wall, [0.5, 0.5]);
    for (const x of [760, 2060, 3530, 5080]) this.img("clock", x, 290, D.wall, [0.5, 0.5]).setScale(0.9);
    this.img("pennants", 5330, 300, D.wall, [0.5, 0]);
    for (const x of [1250, 2980, 4440]) this.pile(x);
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
      this.img("plant", x + 90, 548, D.back + 0.01).setScale(0.6);
      this.shaft(x - 150, 340, 0.26);
      return;
    }
    if (kind === "board") {
      this.react(this.img("board", x, 470, D.back, [0.5, 0.5]), "swing");
      this.grounded(this.img("bench-hall", x, FLOOR_Y, D.back));
      this.react(this.img("poster-recess", x + 230, 460, D.back, [0.5, 0.5]).setScale(0.85), "swing");
      return;
    }
    if (kind === "fountain") {
      this.grounded(this.img("fountain", x, FLOOR_Y, D.back));
      this.grounded(this.react(this.img("bin", x + 120, FLOOR_Y, D.back), "bin"));
      this.img("extinguisher", x - 120, 760, D.back, [0.5, 0.5]);
      return;
    }
    if (kind === "banner") {
      this.react(this.img("banner-silence", x, 290, D.back + 0.02, [0.5, 0]), "swing");
      return;
    }
    if (kind === "mop") {
      this.grounded(this.img("mop-cart", x, FLOOR_Y, D.back));
      return;
    }
    if (kind === "trophies") {
      this.grounded(this.react(this.img("trophy-case", x, FLOOR_Y, D.back), "metal"));
      this.img("portrait", x + 210, 430, D.back, [0.5, 0.5]).setScale(0.85);
      this.grounded(this.react(this.img("plant", x - 170, FLOOR_Y, D.back), "plant"));
    }
  }

  private pile(x: number) {
    this.img("paper-pile", x, FLOOR_Y + 6, D.floor + 0.2);
    this.piles.push({ x, y: FLOOR_Y - 10, at: -9999 });
  }

  private yard() {
    const s = this.scene;
    s.add.image(0, 0, "sky").setOrigin(0, 0).setDisplaySize(W * 1.4, H * 1.4).setScrollFactor(0).setDepth(0);
    s.add.circle(1500, 210, 74, 0xffe39a).setStrokeStyle(6, INK_HEX).setScrollFactor(0.04, 0).setDepth(D.far);
    for (let i = 0; i < 6; i += 1) this.img("cloud", 200 + i * 520, 170 + (i % 3) * 70, D.far, [0.5, 0.5]).setScrollFactor(0.1, 0).setScale(0.8 + (i % 2) * 0.3);
    for (let i = 0; i < 3; i += 1) this.img("trees-far", i * 1600, 840, D.far + 0.05, [0, 1]).setScrollFactor(0.2, 0).setScale(1.3);
    const buildings: [string, number, number][] = [
      ["building", 360, 0.85],
      ["building-b", 1500, 0.9],
      ["building", 2700, 0.8],
      ["building-b", 3600, 0.85],
    ];
    for (const [key, x, sc] of buildings) this.img(key, x, 860, D.mid, [0.5, 1]).setScrollFactor(0.4, 0).setScale(sc);
    const near: [string, number, number][] = [
      ["building-b", 700, 1.2],
      ["building", 2100, 1.25],
      ["building-b", 3300, 1.2],
    ];
    for (const [key, x, sc] of near) this.img(key, x, 850, D.mid + 0.02, [0.5, 1]).setScrollFactor(0.5, 0).setScale(sc);
    for (const [a, b] of [
      [300, 1900],
      [2500, 4400],
    ]) {
      s.add.tileSprite(a, 620, b - a, 220, "fence-tile").setOrigin(0, 0).setScrollFactor(0.65, 0).setDepth(D.mid + 0.1);
      const g = s.add.graphics().setScrollFactor(0.65, 0).setDepth(D.mid + 0.05);
      g.fillStyle(0xc9a06a, 1);
      g.fillRect(a, 836, b - a, 30);
    }
    for (const x of [620, 1500, 2900, 3900]) this.img("hoop", x, 860, D.mid + 0.12).setScrollFactor(0.65, 0).setScale(0.8);
    this.img("banner-protest", 1100, 610, D.mid + 0.14, [0.5, 0]).setScrollFactor(0.65, 0).setScale(0.8);
    this.img("banner-protest", 3400, 610, D.mid + 0.14, [0.5, 0]).setScrollFactor(0.65, 0).setScale(0.8);
    this.floor("floor-yard");
    for (const x of [260, 2560, 4380, 5980]) this.img("tree-big", x, FLOOR_Y + 8, D.back);
    this.img("stairs-bg", 1260, FLOOR_Y, D.back - 0.05);
    this.img("kiosk", 3060, FLOOR_Y, D.back);
    for (const x of [520, 3380, 5640]) this.img("picnic-table", x, FLOOR_Y, D.floor);
    const posts = [1060, 1900, 3600, 4300, 5180, 6040];
    for (const x of posts) this.img("lamp-post", x, FLOOR_Y, D.back + 0.02).setScale(0.9);
    for (let i = 0; i < posts.length - 1; i += 1) if (posts[i + 1] - posts[i] < 1000) this.bunting(posts[i], posts[i + 1], 600);
    for (const x of [2340, 4100, 6200]) this.react(this.img("protest-sign", x, FLOOR_Y + 4, D.floor), "swing");
    this.img("backpack", 940, FLOOR_Y + 4, D.floor + 0.1).setScale(0.8);
    this.img("jump-rope", 1520, FLOOR_Y + 6, D.floor + 0.1);
    this.img("backpack", 4660, FLOOR_Y + 4, D.floor + 0.1).setScale(0.7).setFlipX(true);
    const chalk = s.add.graphics().setDepth(5.1);
    chalk.lineStyle(4, 0xffffff, 0.75);
    for (let i = 0; i < 5; i += 1) chalk.strokeRect(4180 + i * 64, FLOOR_Y + 30, 60, 40);
    chalk.lineStyle(4, 0xf06ba8, 0.75);
    chalk.strokeCircle(4560, FLOOR_Y + 50, 22);
    for (let x = 120; x < this.width; x += 640) {
      this.img("grass-tuft", x + (x % 3) * 40, H + 10, D.front).setScrollFactor(1.15, 1).setScale(1.2);
    }
  }

  private bunting(x0: number, x1: number, y: number) {
    const colors = [0xef4f43, 0xffc83d, 0x63d6c1, 0x5cb9f0, 0xf06ba8, 0x93cf4c];
    const g = this.scene.add.graphics().setDepth(D.back + 0.03);
    g.lineStyle(3, INK_HEX, 1);
    const sag = 60;
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

  private office() {
    const s = this.scene;
    const arenaX = this.level.boss ? this.level.boss.arena * TILE : this.width;
    s.add.tileSprite(0, 0, this.width, FLOOR_Y, "wall-office").setOrigin(0, 0).setDepth(0);
    s.add.image(0, 130, "shade-top").setOrigin(0, 0).setDisplaySize(this.width, 300).setDepth(0.35).setAlpha(0.6);
    this.floor("floor-office");
    for (let x = 350; x < arenaX - 200; x += 700) this.img("column", x, FLOOR_Y, D.wall + 0.1);
    for (let x = 700; x < arenaX - 200; x += 700) {
      this.img("lamp-warm", x, 120, D.wall + 0.12, [0.5, 0]).setScale(0.8);
      this.cone(x, 210, 0.24, 1.2);
    }
    const plan: [string, number][] = [
      ["window", 700],
      ["gallery", 1400],
      ["banner-order", 1860],
      ["door-admin-a", 2100],
      ["bust", 2460],
      ["window", 2800],
      ["banner-obey", 3150],
      ["stairs", 3450],
      ["gallery", 4200],
      ["door-admin-b", 4560],
      ["signpost", 4850],
    ];
    for (const [kind, x] of plan) this.officeModule(kind, x);
    for (const x of [1050, 2630, 3800]) this.grounded(this.react(this.img("plant-big", x, FLOOR_Y, D.back), "plant"));
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
        const p = this.react(this.img(k, x + dx, 420, D.back, [0.5, 0.5]).setScale(0.9), "swing");
        this.img("hall-light", x + dx, 300, D.back + 0.01, [0.5, 0.5]).setScale(0.6);
        this.scene.add.image(x + dx, 430, "spot").setDepth(D.back - 0.01).setScale(1.3).setAlpha(0.7);
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
    if (kind === "signpost") this.react(this.img("signpost", x, FLOOR_Y, D.back), "swing");
  }

  private arena(left: number) {
    const s = this.scene;
    const cx = left + W / 2;
    this.img("curtain", left, FLOOR_Y, D.back + 0.05, [0, 1]).setScale(0.9);
    this.img("curtain", left + W, FLOOR_Y, D.back + 0.05, [0, 1]).setScale(0.9).setFlipX(true).setOrigin(1, 1);
    const banner = this.img("banner-discipline", cx, 170, D.back, [0.5, 0]).setScale(0.95);
    const board = this.img("rules-board", left + 470, 520, D.back, [0.5, 0.5]).setScale(0.9);
    const shelf = this.img("trophy-shelf", left + W - 470, 520, D.back, [0.5, 0.5]).setScale(0.9);
    const p1 = this.img("portrait", cx - 300, 520, D.back, [0.5, 0.5]);
    const p2 = this.img("principal-c", cx + 300, 520, D.back, [0.5, 0.5]);
    this.img("big-desk", cx, FLOOR_Y, D.floor);
    this.img("file-cabinet", left + W - 300, FLOOR_Y, D.floor).setScale(0.9);
    this.img("plant-big", left + 300, FLOOR_Y, D.floor).setScale(0.9);
    this.img("lamp-warm", cx, 90, D.back + 0.1, [0.5, 0]);
    this.cone(cx, 190, 0.25, 1.8);
    this.quakeTargets.push(banner, board, shelf, p1, p2);
    this.paperFrom = { x: cx, y: FLOOR_Y - 230 };
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
    this.scene.tweens.killTweensOf(img);
    const base = img.angle;
    if (kind === "swing") {
      this.scene.tweens.add({ targets: img, angle: { from: base - 10, to: base }, duration: 700, ease: "Elastic.easeOut" });
      return;
    }
    if (kind === "plant") {
      this.scene.tweens.add({ targets: img, angle: { from: base - 6, to: base }, duration: 500, ease: "Elastic.easeOut" });
      return;
    }
    const x = img.x;
    this.scene.tweens.add({ targets: img, x: x + 5, duration: 40, yoyo: true, repeat: 3, onComplete: () => img.setX(x) });
  }

  papers(x: number, y: number, n: number) {
    if (this.reduced) n = Math.min(n, 1);
    for (let i = 0; i < n; i += 1) {
      const p = this.scene.add.image(x + Phaser.Math.Between(-30, 30), y, "paper").setDepth(D.front - 2).setScale(0.8).setAngle(Phaser.Math.Between(-40, 40));
      const dx = Phaser.Math.Between(-220, 220);
      this.scene.tweens.add({ targets: p, x: p.x + dx, duration: 1400, ease: "Sine.easeOut" });
      this.scene.tweens.add({ targets: p, y: y - Phaser.Math.Between(80, 180), duration: 500, ease: "Quad.easeOut", yoyo: true, hold: 120 });
      this.scene.tweens.add({ targets: p, angle: p.angle + Phaser.Math.Between(-260, 260), alpha: 0, delay: 600, duration: 900, onComplete: () => p.destroy() });
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

  update(t: number, heroX: number, heroVx: number, grounded: boolean, view: Phaser.Geom.Rectangle) {
    if (grounded && Math.abs(heroVx) > 320) {
      for (const p of this.piles) {
        if (Math.abs(p.x - heroX) < 70 && t - p.at > 2500) {
          p.at = t;
          this.papers(p.x, p.y, 4);
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
    } else if (this.level.theme === "corridor") {
      const p = this.scene.add.image(view.right + 40, view.y + view.height * 0.45, "paper").setDepth(D.back + 0.5).setScale(0.6).setAlpha(0.9);
      this.scene.tweens.add({ targets: p, x: view.x - 60, y: p.y + 140, angle: 540, duration: 4200, ease: "Sine.easeInOut", onComplete: () => p.destroy() });
    }
    return false;
  }
}
