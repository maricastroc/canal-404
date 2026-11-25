import * as Phaser from "phaser";
import { H, W } from "../config";
import { LIP, WALL_EXT } from "../layout";
import type { ArenaDef, PropDef, React } from "../arenas";
import { arenaBoxes, NavGrid, solidBoxes, type Box } from "../nav";
import type { PajamaSfx } from "../sounds";
import type { Fonts } from "../../kit/ui";
import { Ambient } from "./ambient";

const RES = 1.25;
const BULB_COLORS = [0xffd36b, 0xff8fc4, 0x8ff0d8, 0x9fd4ff, 0xffb36b];
const SHADE_DEPTH = 26;

type Footprint = [cx: number, cy: number, w: number, h: number];

const SHADOWS: Record<string, Footprint> = {
  "bed-pink": [170, 376, 372, 70],
  "bed-blue": [170, 376, 372, 70],
  nightstand: [75, 152, 156, 32],
  "toy-chest": [115, 174, 236, 42],
  beanbag: [106, 152, 214, 42],
  blocks: [56, 104, 116, 26],
  teddy: [55, 113, 104, 24],
  boombox: [80, 101, 160, 26],
  ball: [36, 68, 62, 18],
  books: [54, 70, 104, 20],
  sofa: [240, 254, 496, 64],
  mattresses: [260, 124, 540, 36],
  armchair: [114, 216, 236, 46],
  tv: [150, 320, 300, 44],
  "coffee-table": [165, 160, 318, 44],
  "floor-lamp": [70, 335, 104, 22],
  "plant-big": [85, 239, 112, 24],
  bookshelf: [140, 347, 286, 40],
  tent: [230, 306, 470, 56],
  tree: [238, 557, 170, 36],
  screen: [140, 352, 170, 28],
  grill: [80, 185, 140, 26],
  cooler: [80, 121, 166, 28],
  stump: [65, 91, 128, 26],
  gnome: [45, 127, 84, 20],
  lantern: [40, 105, 66, 16],
};

const WALL_SHADE_DEPTH = 5.5;

const BACKDROPS: Record<string, { at: Footprint; alpha: number; on?: string }> = {
  "bed-pink": { at: [170, 70, 380, 150], alpha: 0.3 },
  "bed-blue": { at: [170, 70, 380, 150], alpha: 0.3 },
  sofa: { at: [240, 10, 540, 120], alpha: 0.42, on: "mattresses" },
  mattresses: { at: [260, 58, 590, 170], alpha: 0.32 },
  tv: { at: [150, 96, 340, 230], alpha: 0.3 },
  bookshelf: { at: [140, 120, 320, 290], alpha: 0.3 },
};

const CROWNS: Record<string, { trunk: string; crown: string; pivot: [number, number] }> = {
  tree: { trunk: "tree-trunk", crown: "tree-crown", pivot: [241, 330] },
};

type Theme = { wall: [number, number, number]; floor: [number, number, number]; side: number; base: number; dots: number };
const THEMES: Record<ArenaDef["theme"], Theme> = {
  bedroom: { wall: [0x5b3f9c, 0x4a3286, 0x6e52b4], floor: [0xb8774a, 0x9a5f38, 0xcf9262], side: 0x3b2870, base: 0x7c4527, dots: 0xffe39a },
  living: { wall: [0xc8704a, 0xa85a3c, 0xdc8a5c], floor: [0x8c5a3c, 0x734630, 0xa66c48], side: 0x8a4a34, base: 0x55301e, dots: 0xffd18a },
  yard: { wall: [0x1c2a52, 0x16213f, 0x24346a], floor: [0x3f6a3a, 0x335a30, 0x4f7d44], side: 0x16213f, base: 0x2b3d26, dots: 0xffffff },
};

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function drawGrass(g: Phaser.GameObjects.Graphics, t: Theme) {
  const w = 384;
  const h = 192;
  const rnd = seeded(12);
  g.fillStyle(t.floor[0], 1);
  g.fillRect(0, 0, w, h);
  const wrap = (x: number, y: number, rx: number, ry: number, draw: (x: number, y: number) => void) => {
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) if (x + ox + rx > 0 && x + ox - rx < w && y + oy + ry > 0 && y + oy - ry < h) draw(x + ox, y + oy);
  };
  for (let i = 0; i < 16; i += 1) {
    const x = rnd() * w;
    const y = rnd() * h;
    const rx = 22 + rnd() * 40;
    const ry = 7 + rnd() * 10;
    g.fillStyle(rnd() < 0.5 ? t.floor[2] : t.floor[1], 0.22 + rnd() * 0.12);
    wrap(x, y, rx, ry, (px, py) => g.fillEllipse(px, py, rx * 2, ry * 2));
  }
  for (let i = 0; i < 38; i += 1) {
    const light = i % 3 === 0;
    g.fillStyle(light ? t.floor[2] : t.floor[1], light ? 0.55 : 0.6);
    g.fillRect(Math.floor(rnd() * (w - 3)), Math.floor(rnd() * (h - 10)), 3, 6 + Math.floor(rnd() * 4));
  }
  for (let i = 0; i < 16; i += 1) {
    const x = 6 + rnd() * (w - 12);
    const y = 14 + rnd() * (h - 16);
    const light = i % 4 === 0;
    g.lineStyle(2.4, light ? 0x6b9c58 : 0x2a4828, light ? 0.4 : 0.5);
    g.lineBetween(x, y, x - 5, y - 8);
    g.lineBetween(x + 1, y, x + 1, y - 11);
    g.lineBetween(x + 2, y, x + 7, y - 7);
  }
}

export function makeTextures(scene: Phaser.Scene) {
  const tex = scene.textures;
  const radial = (key: string, w: number, h: number, stops: [number, string][]) => {
    if (tex.exists(key)) return;
    const c = tex.createCanvas(key, w, h)!;
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    for (const [o, col] of stops) g.addColorStop(o, col);
    ctx.save();
    ctx.translate(0, 0);
    ctx.scale(1, h / w);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
    ctx.restore();
    c.refresh();
  };
  radial("blob", 128, 128, [
    [0, "rgba(29,24,48,0.75)"],
    [0.6, "rgba(29,24,48,0.45)"],
    [1, "rgba(29,24,48,0)"],
  ]);
  radial("glow", 256, 256, [
    [0, "rgba(255,255,255,1)"],
    [0.35, "rgba(255,255,255,0.45)"],
    [1, "rgba(255,255,255,0)"],
  ]);
  radial("shade", 128, 128, [
    [0, "rgba(29,24,48,0.82)"],
    [0.45, "rgba(29,24,48,0.7)"],
    [0.75, "rgba(29,24,48,0.34)"],
    [1, "rgba(29,24,48,0)"],
  ]);
  if (!tex.exists("yard-patches")) {
    const c = tex.createCanvas("yard-patches", 480, 250)!;
    const ctx = c.getContext();
    const rnd = seeded(404);
    const blot = (x: number, y: number, r: number, rgb: string, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rgb},${a})`);
      g.addColorStop(0.6, `rgba(${rgb},${a * 0.5})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.42);
      ctx.translate(-x, -y);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
    };
    for (let i = 0; i < 34; i += 1) {
      const light = rnd() < 0.42;
      blot(rnd() * 480, 8 + rnd() * 236, 26 + rnd() * 64, light ? "132,182,104" : "16,34,22", light ? 0.13 + rnd() * 0.06 : 0.17 + rnd() * 0.08);
    }
    blot(345, 4, 170, "176,204,150", 0.12);
    const edge = ctx.createLinearGradient(0, 0, 0, 40);
    edge.addColorStop(0, "rgba(16,30,24,0.32)");
    edge.addColorStop(1, "rgba(16,30,24,0)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, 480, 40);
    c.refresh();
  }
  if (!tex.exists("vignette")) {
    const c = tex.createCanvas("vignette", 480, 270)!;
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(240, 135, 70, 240, 135, 290);
    g.addColorStop(0, "rgba(20,15,38,0)");
    g.addColorStop(1, "rgba(20,15,38,0.85)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 480, 270);
    c.refresh();
  }
  const gfx = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
    if (tex.exists(key)) return;
    const g = scene.make.graphics({}, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  gfx("dust", 64, 48, (g) => {
    g.fillStyle(0xfbf5e6, 0.9);
    g.fillCircle(20, 28, 16);
    g.fillCircle(38, 22, 18);
    g.fillCircle(48, 32, 12);
  });
  gfx("dot", 16, 16, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
  });
  gfx("bulb", 30, 36, (g) => {
    g.fillStyle(0x1d1830, 1);
    g.fillRoundedRect(10, 0, 10, 10, 2);
    g.fillCircle(15, 21, 13);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(15, 21, 10);
  });
  gfx("confetti", 18, 10, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 18, 10);
  });
  gfx("spring", 44, 62, (g) => {
    const loops = [44, 34, 24, 14];
    for (const y of loops) {
      g.lineStyle(10, 0x1d1830, 1);
      g.strokeEllipse(22, y, 30, 11);
    }
    for (const y of loops) {
      g.lineStyle(5, 0xffc83d, 1);
      g.strokeEllipse(22, y, 30, 11);
    }
    g.fillStyle(0x1d1830, 1);
    g.fillRoundedRect(5, 50, 34, 10, 4);
    g.fillStyle(0xfbf5e6, 1);
    g.fillEllipse(22, 7, 26, 10);
    g.lineStyle(3, 0x1d1830, 1);
    g.strokeEllipse(22, 7, 26, 10);
  });
  gfx("ring", 160, 60, (g) => {
    g.lineStyle(10, 0x1d1830, 0.85);
    g.strokeEllipse(80, 30, 148, 48);
    g.lineStyle(5, 0xffc83d, 1);
    g.strokeEllipse(80, 30, 148, 48);
  });
  gfx("drop", 16, 22, (g) => {
    g.fillStyle(0x1d1830, 1);
    g.fillCircle(8, 14, 7);
    g.fillTriangle(1.5, 12, 14.5, 12, 8, 0);
    g.fillStyle(0x9fd4ff, 1);
    g.fillCircle(8, 14, 4.6);
    g.fillTriangle(4, 12.5, 12, 12.5, 8, 3.5);
  });
  for (const [name, t] of Object.entries(THEMES)) {
    gfx(`wall-${name}`, 160, 160, (g) => {
      g.fillStyle(t.wall[0], 1);
      g.fillRect(0, 0, 160, 160);
      g.fillStyle(t.wall[2], 0.35);
      g.fillRect(0, 0, 80, 160);
      g.fillStyle(t.dots, name === "yard" ? 0.9 : 0.35);
      if (name === "yard") {
        g.fillCircle(30, 40, 2);
        g.fillCircle(118, 22, 1.6);
        g.fillCircle(92, 110, 2.2);
        g.fillCircle(20, 132, 1.4);
      } else {
        g.fillCircle(40, 40, 5);
        g.fillCircle(120, 120, 5);
        g.fillStyle(t.dots, 0.22);
        g.fillCircle(120, 40, 3);
        g.fillCircle(40, 120, 3);
      }
    });
    if (name === "yard") {
      gfx("floor-yard", 384, 192, (g) => drawGrass(g, t));
      continue;
    }
    gfx(`floor-${name}`, 320, 96, (g) => {
      g.fillStyle(t.floor[0], 1);
      g.fillRect(0, 0, 320, 96);
      g.fillStyle(t.floor[2], 0.35);
      g.fillRect(0, 0, 320, 6);
      g.fillRect(0, 48, 320, 6);
      g.lineStyle(3, t.floor[1], 1);
      g.lineBetween(0, 47, 320, 47);
      g.lineBetween(0, 95, 320, 95);
      g.lineBetween(110, 0, 110, 47);
      g.lineBetween(270, 0, 270, 47);
      g.lineBetween(40, 48, 40, 95);
      g.lineBetween(200, 48, 200, 95);
      g.fillStyle(t.floor[1], 0.6);
      g.fillCircle(60, 24, 2);
      g.fillCircle(150, 70, 2);
    });
  }
}

export type Block = Box & { prop: Prop | null };

export class Prop {
  readonly img: Phaser.GameObjects.Image;
  readonly crown: Phaser.GameObjects.Image | null = null;
  readonly shadow: Phaser.GameObjects.Image | null = null;
  readonly base: { x: number; y: number; angle: number; sx: number; sy: number };
  readonly springs: Phaser.GameObjects.Image[] = [];
  vx = 0;
  vy = 0;
  busy = false;
  idleAt = 0;
  private tipped = false;
  private shadowAt = { dx: 0, dy: 0 };

  constructor(
    private scene: Phaser.Scene,
    readonly def: PropDef,
    private reduced: boolean,
    shade = 0.5,
  ) {
    const s = (def.scale ?? 1) / RES;
    const origin = def.origin ?? (def.react === "swing" ? [0.5, 0] : [0.5, 1]);
    const split = CROWNS[def.key];
    this.img = scene.add.image(def.x, def.y, split?.trunk ?? def.key).setOrigin(origin[0], origin[1]).setScale(s).setFlipX(Boolean(def.flip)).setAngle(def.angle ?? 0);
    if (def.depth !== undefined) this.img.setDepth(def.depth);
    else if (def.layer === "wall") this.img.setDepth(5);
    else if (def.layer === "floor") this.img.setDepth(20 + def.y / 1000);
    else this.img.setDepth(def.y);
    this.base = { x: def.x, y: def.y, angle: def.angle ?? 0, sx: s, sy: s };
    const k = def.scale ?? 1;
    const artW = this.img.width / RES;
    const artH = this.img.height / RES;
    const at = (ax: number, ay: number) => this.artPoint(ax, ay);
    const foot = SHADOWS[def.key];
    if (foot && def.layer !== "wall") {
      const [cx, cy, w, h] = foot;
      const p = at(cx, cy);
      this.shadowAt = { dx: p.x - def.x, dy: p.y - def.y };
      this.shadow = scene.add
        .image(p.x, p.y, "shade")
        .setDisplaySize(w * k, h * k)
        .setAlpha(shade)
        .setDepth(def.layer === "floor" ? this.img.depth - 0.0005 : SHADE_DEPTH);
    }
    if (split) {
      const [px, py] = split.pivot;
      const p = at(px, py);
      this.crown = scene.add
        .image(p.x, p.y, split.crown)
        .setOrigin(def.flip ? 1 - px / artW : px / artW, py / artH)
        .setScale(s)
        .setFlipX(Boolean(def.flip))
        .setDepth(this.img.depth + 0.01);
    }
    for (const [dx, dy, angle] of def.spring ?? []) {
      this.springs.push(scene.add.image(def.x + dx, def.y + dy, "spring").setOrigin(0.5, 0.92).setScale(0.82).setAngle(angle).setDepth(this.img.depth + 0.4));
    }
  }

  artPoint(ax: number, ay: number) {
    const d = this.def;
    const k = d.scale ?? 1;
    const ox = this.img.originX * (this.img.width / RES);
    const oy = this.img.originY * (this.img.height / RES);
    return { x: d.x + (ax - ox) * k * (d.flip ? -1 : 1), y: d.y + (ay - oy) * k };
  }

  backdrop(depth: number) {
    const back = BACKDROPS[this.def.key];
    if (!back) return;
    const [cx, cy, w, h] = back.at;
    const k = this.def.scale ?? 1;
    const p = this.artPoint(cx, cy);
    this.scene.add.image(p.x, p.y, "shade").setDisplaySize(w * k, h * k).setAlpha(back.alpha).setDepth(depth);
  }

  get sway() {
    return this.crown ?? this.img;
  }

  get swayBase() {
    return this.crown ? 0 : this.base.angle;
  }

  follow() {
    this.shadow?.setPosition(this.img.x + this.shadowAt.dx, this.img.y + this.shadowAt.dy);
  }

  boing(sfx: (n: PajamaSfx, v?: number) => void, power = 1) {
    sfx("spring", 0.55);
    if (this.reduced) return;
    for (const sp of this.springs) {
      this.scene.tweens.killTweensOf(sp);
      sp.setScale(0.82, 0.82 * 0.45);
      this.scene.tweens.add({ targets: sp, scaleY: 0.82, duration: 620, ease: "Elastic.easeOut", easeParams: [1.4, 0.3] });
    }
    if (this.busy) return;
    this.busy = true;
    this.scene.tweens.add({
      targets: this.img,
      scaleY: { from: this.base.sy * (1 - 0.1 * power), to: this.base.sy },
      scaleX: { from: this.base.sx * (1 + 0.05 * power), to: this.base.sx },
      duration: 560,
      ease: "Elastic.easeOut",
      easeParams: [1.2, 0.35],
      onComplete: () => (this.busy = false),
    });
  }

  springHop(delay: number) {
    if (this.reduced) return;
    for (const sp of this.springs) {
      this.scene.tweens.add({ targets: sp, scaleY: { from: 0.82 * 0.4, to: 0.82 }, delay, duration: 700, ease: "Elastic.easeOut", easeParams: [1.5, 0.3] });
    }
  }

  get react(): React | undefined {
    return this.def.react;
  }

  poke(power: number, dir: number, sfx: (n: PajamaSfx, v?: number) => void) {
    const kind = this.def.react;
    if (!kind) return;
    const scene = this.scene;
    const p = Phaser.Math.Clamp(power, 0.2, 1.4);
    if (kind === "roll") {
      this.vx += dir * 520 * p;
      this.vy += Phaser.Math.FloatBetween(-140, 140) * p;
      sfx("boing", 0.4);
      return;
    }
    if (this.busy) return;
    if (this.reduced) {
      if (kind !== "flap") sfx("wobble", 0.3);
      return;
    }
    this.busy = true;
    const done = () => (this.busy = false);
    if (kind === "rustle") {
      sfx("rustle", 0.3);
      const base = this.swayBase;
      scene.tweens.add({ targets: this.sway, angle: { from: base + dir * (this.crown ? 2.4 : 3.5) * p, to: base }, duration: 900, ease: "Elastic.easeOut", easeParams: [1.1, 0.3], onComplete: done });
    } else if (kind === "wobble" || kind === "swing") {
      sfx("wobble", 0.35);
      scene.tweens.add({ targets: this.img, angle: { from: this.base.angle + dir * 14 * p, to: this.base.angle }, duration: 900, ease: "Elastic.easeOut", easeParams: [1.2, 0.3], onComplete: done });
    } else if (kind === "bounce") {
      sfx("boing", 0.35);
      scene.tweens.add({
        targets: this.img,
        scaleY: { from: this.base.sy * (1 - 0.18 * p), to: this.base.sy },
        scaleX: { from: this.base.sx * (1 + 0.1 * p), to: this.base.sx },
        duration: 520,
        ease: "Elastic.easeOut",
        easeParams: [1.1, 0.35],
        onComplete: done,
      });
    } else if (kind === "billow") {
      sfx("wobble", 0.3);
      scene.tweens.add({
        targets: this.img,
        scaleX: { from: this.base.sx * (1 + 0.06 * p), to: this.base.sx },
        scaleY: { from: this.base.sy * (1 - 0.05 * p), to: this.base.sy },
        duration: 900,
        ease: "Elastic.easeOut",
        easeParams: [1, 0.25],
        onComplete: done,
      });
    } else if (kind === "flap") {
      scene.tweens.add({ targets: this.img, angle: { from: this.base.angle + dir * 7 * p, to: this.base.angle }, duration: 700, ease: "Elastic.easeOut", easeParams: [1, 0.3], onComplete: done });
    } else if (kind === "tip") {
      if (this.tipped) {
        this.busy = false;
        return;
      }
      this.tipped = true;
      sfx("plop", 0.5);
      scene.tweens.add({ targets: this.img, angle: dir * 82, duration: 260, ease: "Bounce.easeOut" });
      scene.time.delayedCall(2600, () => {
        scene.tweens.add({
          targets: this.img,
          angle: this.base.angle,
          duration: 420,
          ease: "Back.easeOut",
          onComplete: () => {
            this.tipped = false;
            done();
          },
        });
      });
      return;
    } else {
      done();
    }
  }
}

export class Room {
  readonly blocks: Block[] = [];
  readonly boxes: Box[];
  readonly solid: Box[];
  readonly nav: NavGrid;
  readonly props: Prop[] = [];
  readonly glows = new Map<Prop, Phaser.GameObjects.Image>();
  readonly ambient: Ambient;
  private lights: { bulbs: Phaser.GameObjects.Image[]; halos: Phaser.GameObjects.Image[]; cores: Phaser.GameObjects.Image[]; pts: { x: number; y: number }[]; cur: { x: number; y: number }[]; wire: Phaser.GameObjects.Graphics; kick: number; def: ArenaDef["lights"][number] }[] = [];
  private floorPillows: { img: Phaser.GameObjects.Image; x: number; y: number }[] = [];
  private theme: Theme;
  private cat: Cat | null = null;
  private cushions: Phaser.GameObjects.Image[] = [];
  private ceiling: Phaser.GameObjects.Graphics | null = null;
  private skyGlow: Phaser.GameObjects.Image | null = null;

  constructor(
    private scene: Phaser.Scene,
    readonly def: ArenaDef,
    private reduced: boolean,
    fonts: Fonts,
  ) {
    makeTextures(scene);
    this.theme = THEMES[def.theme];
    this.drawShell();
    for (const p of def.props) {
      const prop = new Prop(scene, p, reduced, def.theme === "yard" ? 0.78 : 0.66);
      this.props.push(prop);
      if (p.glow) {
        const g = scene.add
          .image(p.x + p.glow.dx, p.y + p.glow.dy, "glow")
          .setDisplaySize(p.glow.r * 2, p.glow.r * 1.3)
          .setTint(p.glow.color)
          .setAlpha(p.glow.alpha ?? 0.3)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(p.layer === "wall" ? 6 : 25);
        this.glows.set(prop, g);
        if (!reduced && p.react === "wobble") scene.tweens.add({ targets: g, alpha: (p.glow.alpha ?? 0.3) * (p.key === "lantern" ? 0.7 : 0.82), duration: p.key === "lantern" ? 900 + ((p.x * 7) % 900) : 1400, delay: (p.x * 3) % 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
    }
    for (const prop of this.props) {
      const on = BACKDROPS[prop.def.key]?.on;
      const surface = on ? this.props.find((p) => p.def.key === on) : null;
      prop.backdrop(surface ? surface.img.depth + 0.05 : WALL_SHADE_DEPTH);
    }
    for (const [x, y, tint, angle] of def.floorPillows) {
      const muted = (((tint >> 16) & 255) * 0.74) << 16 | (((tint >> 8) & 255) * 0.72) << 8 | ((tint & 255) * 0.78);
      const img = scene.add.image(x, y, "pillow").setScale(0.6 / RES, 0.42 / RES).setTint(muted).setAlpha(0.92).setAngle(angle).setDepth(24 + y / 1000);
      this.floorPillows.push({ img, x, y });
    }
    this.boxes = arenaBoxes(def);
    this.solid = solidBoxes(this.boxes);
    for (const b of this.boxes) this.blocks.push({ ...b, prop: this.props[b.index] ?? null });
    this.nav = new NavGrid(def.bounds, this.solid);
    for (const l of def.lights) this.makeLights(l);
    if (def.cat) this.cat = new Cat(scene, def.cat, reduced);
    const sofa = def.props.find((p) => p.key === "sofa");
    for (const c of def.cushions ?? []) {
      this.cushions.push(scene.add.image(c.x, c.y, c.key).setOrigin(0.5, 1).setScale(0.82 / RES).setAngle(c.angle).setDepth((sofa?.y ?? c.y) + 0.5));
    }
    this.ambient = new Ambient(scene, this, reduced, fonts);
  }

  blockOf(index: number) {
    return this.blocks.find((b) => b.index === index) ?? null;
  }

  springProps() {
    return this.props.filter((p) => p.springs.length > 0);
  }

  hopCushions() {
    if (this.reduced) return;
    this.cushions.forEach((c, i) => {
      if (this.scene.tweens.isTweening(c)) return;
      const y = c.y;
      const angle = c.angle;
      this.scene.tweens.add({ targets: c, y: y - 22 - i * 6, angle: angle + (i % 2 ? 9 : -9), duration: 150, delay: i * 40, yoyo: true, ease: "Quad.easeOut", onComplete: () => c.setPosition(c.x, y).setAngle(angle) });
    });
  }

  private dropCushion(sfx: (n: PajamaSfx, v?: number) => void) {
    const c = this.cushions.pop();
    if (!c) return;
    const sofa = this.def.props.find((p) => p.key === "sofa");
    const tx = c.x + Phaser.Math.Between(-70, 70);
    const ty = (sofa?.y ?? c.y) + Phaser.Math.Between(60, 120);
    sfx("plop", 0.5);
    const land = () => {
      c.setDepth(24 + ty / 1000).setOrigin(0.5, 0.5).setScale(0.74 / RES, 0.56 / RES);
      c.setPosition(tx, ty - 10);
      this.floorPillows.push({ img: c, x: tx, y: ty });
    };
    if (this.reduced) {
      land();
      return;
    }
    c.setDepth(ty);
    this.scene.tweens.add({ targets: c, x: tx, duration: 420, ease: "Quad.easeOut" });
    this.scene.tweens.add({ targets: c, y: c.y - 60, duration: 180, ease: "Quad.easeOut", yoyo: false, onComplete: () => this.scene.tweens.add({ targets: c, y: ty, duration: 240, ease: "Bounce.easeOut", onComplete: land }) });
    this.scene.tweens.add({ targets: c, angle: c.angle + Phaser.Math.Between(140, 260) * (Math.random() < 0.5 ? -1 : 1), duration: 420 });
  }

  get deckColor() {
    return this.theme.base;
  }

  setCeiling(y: number) {
    this.ceiling?.setY(y);
    this.skyGlow?.setY(y);
    this.ambient.setCeiling(y);
  }

  private drawShell() {
    const s = this.scene;
    const d = this.def;
    const t = this.theme;
    const wb = d.wallBottom;
    const sky = -WALL_EXT - 60;
    const floorEnd = LIP + 240;
    s.add.tileSprite(0, sky, W, wb - sky, `wall-${d.theme}`).setOrigin(0, 0).setDepth(0).setTilePosition(0, sky);
    s.add.tileSprite(0, wb, W, floorEnd - wb, `floor-${d.theme}`).setOrigin(0, 0).setDepth(0.5);
    const g = s.add.graphics().setDepth(1);
    const ceiling = s.add.graphics().setDepth(1);
    ceiling.fillStyle(0x140f26, 0.35);
    ceiling.fillRect(0, 0, W, 40);
    ceiling.fillStyle(0x140f26, 0.18);
    ceiling.fillRect(0, 40, W, 40);
    this.ceiling = ceiling;
    if (d.theme === "yard") {
      s.add.image(0, wb, "yard-patches").setOrigin(0, 0).setDisplaySize(W, floorEnd - wb).setDepth(0.55);
      s.add.tileSprite(0, wb - 136, W, 138, "fence").setOrigin(0, 0).setTileScale(0.8 / RES, 0.8 / RES).setDepth(3);
      this.skyGlow = s.add.image(W / 2, 0, "glow").setDisplaySize(W * 1.4, 520).setTint(0x3a4a8a).setAlpha(0.35).setDepth(0.6);
      g.fillStyle(0x140f26, 0.3);
      g.fillRect(0, wb, W, 18);
      return;
    }
    {
      g.fillStyle(t.base, 1);
      g.fillRect(0, wb - 22, W, 22);
      g.lineStyle(5, 0x1d1830, 1);
      g.lineBetween(0, wb - 22, W, wb - 22);
      g.lineBetween(0, wb, W, wb);
    }
    const side = s.add.graphics().setDepth(2);
    const inset = 120;
    side.fillStyle(t.side, 1);
    side.fillPoints([new Phaser.Math.Vector2(0, sky), new Phaser.Math.Vector2(inset, sky), new Phaser.Math.Vector2(inset, wb), new Phaser.Math.Vector2(0, wb + 150)], true);
    side.fillPoints([new Phaser.Math.Vector2(W, sky), new Phaser.Math.Vector2(W - inset, sky), new Phaser.Math.Vector2(W - inset, wb), new Phaser.Math.Vector2(W, wb + 150)], true);
    side.fillStyle(0x140f26, 0.35);
    side.fillPoints([new Phaser.Math.Vector2(0, wb + 150), new Phaser.Math.Vector2(inset, wb), new Phaser.Math.Vector2(inset - 30, H), new Phaser.Math.Vector2(inset - 30, floorEnd), new Phaser.Math.Vector2(0, floorEnd)], true);
    side.fillPoints([new Phaser.Math.Vector2(W, wb + 150), new Phaser.Math.Vector2(W - inset, wb), new Phaser.Math.Vector2(W - inset + 30, H), new Phaser.Math.Vector2(W - inset + 30, floorEnd), new Phaser.Math.Vector2(W, floorEnd)], true);
    side.lineStyle(5, 0x1d1830, 0.9);
    side.lineBetween(inset, sky, inset, wb);
    side.lineBetween(W - inset, sky, W - inset, wb);
    side.lineBetween(inset, wb, 0, wb + 150);
    side.lineBetween(W - inset, wb, W, wb + 150);
    const shade = s.add.image(W / 2, wb + 10, "glow").setDisplaySize(W * 1.6, 120).setTint(0x140f26).setAlpha(0.35).setDepth(1.5);
    void shade;
  }

  private makeLights(l: ArenaDef["lights"][number]) {
    const s = this.scene;
    const wire = s.add.graphics().setDepth(7);
    const pts: { x: number; y: number }[] = [];
    const span = (l.to - l.from) / l.segments;
    for (let i = 0; i <= l.segments * 6; i += 1) {
      const u = i / 6;
      const seg = Math.floor(u);
      const f = u - seg;
      pts.push({ x: l.from + u * span, y: l.y + Math.sin(f * Math.PI) * l.sag * (seg < l.segments ? 1 : 0) });
    }
    const bulbs: Phaser.GameObjects.Image[] = [];
    const halos: Phaser.GameObjects.Image[] = [];
    const cores: Phaser.GameObjects.Image[] = [];
    pts.forEach((p, i) => {
      if (i % 6 === 0) return;
      const color = BULB_COLORS[i % BULB_COLORS.length];
      halos.push(s.add.image(p.x, p.y + 20, "glow").setDisplaySize(90, 90).setTint(color).setAlpha(0.42).setBlendMode(Phaser.BlendModes.ADD).setDepth(7.5));
      bulbs.push(s.add.image(p.x, p.y, "bulb").setOrigin(0.5, 0).setTint(color).setDepth(8));
      cores.push(s.add.image(p.x, p.y + 21, "glow").setDisplaySize(26, 26).setTint(color).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(8.1));
    });
    this.lights.push({ bulbs, halos, cores, pts, cur: pts.map((p) => ({ ...p })), wire, kick: 0, def: l });
  }

  blockAt(x: number, y: number, pad = 0) {
    for (const b of this.solid) if (x > b.x0 - pad && x < b.x1 + pad && y > b.y0 - pad && y < b.y1 + pad) return b;
    return null;
  }

  impact(x: number, y: number, power: number, sfx: (n: PajamaSfx, v?: number) => void) {
    this.cat?.scare(x, y, sfx);
    this.ambient.impact(x, y, power);
    const sofa = this.def.props.find((p) => p.key === "sofa");
    if (sofa && power >= 0.6 && Math.abs(x - sofa.x) < 260 && Math.abs(y - sofa.y) < 150 && Math.random() < 0.6) this.dropCushion(sfx);
    for (const p of this.props) {
      if (!p.react) continue;
      const dx = p.def.x - x;
      const near = p.def.layer === "wall" ? Math.abs(dx) < 220 && y < this.def.wallBottom + 170 : Math.hypot(dx, (p.def.y - y) * 1.4) < 210;
      if (!near) continue;
      p.poke(power * (1 - Math.min(1, Math.abs(dx) / 260) * 0.5), Math.sign(dx) || 1, sfx);
    }
    if (y < this.def.wallBottom + 260) for (const l of this.lights) l.kick = Math.min(1.6, l.kick + power * 0.8);
  }

  update(t: number, dt: number, feet: { x: number; y: number; vx: number; vy: number }[], sfx: (n: PajamaSfx, v?: number) => void) {
    const b = this.def.bounds;
    for (const p of this.props) {
      if (p.react !== "roll") continue;
      for (const f of feet) {
        const dx = p.img.x - f.x;
        const dy = (p.img.y - f.y) * 1.6;
        if (Math.hypot(dx, dy) < 60 && Math.hypot(f.vx, f.vy) > 80) {
          p.vx += Math.sign(dx || 1) * 260 + f.vx * 0.5;
          p.vy += f.vy * 0.4;
        }
      }
      if (Math.abs(p.vx) + Math.abs(p.vy) < 2) continue;
      const fr = Math.exp(-dt * 1.6);
      p.vx *= fr;
      p.vy *= fr;
      let nx = p.img.x + p.vx * dt;
      let ny = p.img.y + p.vy * dt;
      if (nx < b.x0 || nx > b.x1) {
        p.vx = -p.vx * 0.7;
        nx = Phaser.Math.Clamp(nx, b.x0, b.x1);
        sfx("plop", 0.3);
      }
      if (ny < b.y0 || ny > b.y1) {
        p.vy = -p.vy * 0.7;
        ny = Phaser.Math.Clamp(ny, b.y0, b.y1);
      }
      if (this.blockAt(nx, ny, 10)) {
        p.vx = -p.vx * 0.6;
        p.vy = -p.vy * 0.6;
        nx = p.img.x;
        ny = p.img.y;
      }
      p.img.setPosition(nx, ny).setDepth(ny);
      p.img.angle += (p.vx / 30) * dt * 57;
      p.follow();
    }
    this.cat?.update(t, dt, feet, sfx);
    this.ambient.update(t, dt);
    for (const fp of this.floorPillows) {
      for (const f of feet) {
        const dx = fp.img.x - f.x;
        const dy = (fp.img.y - f.y) * 1.8;
        const d = Math.hypot(dx, dy);
        if (d < 56 && Math.hypot(f.vx, f.vy) > 60) {
          const k = (56 - d) / 56;
          fp.img.x = Phaser.Math.Clamp(fp.img.x + (dx / (d || 1)) * 90 * k * dt * 10, b.x0, b.x1);
          fp.img.y = Phaser.Math.Clamp(fp.img.y + (dy / (d || 1)) * 50 * k * dt * 10, b.y0, b.y1);
          fp.img.angle += (f.vx > 0 ? 1 : -1) * 120 * dt;
          fp.img.setDepth(24 + fp.img.y / 1000);
        }
      }
    }
    for (const l of this.lights) {
      l.kick = Math.max(0, l.kick - dt * 0.9);
      const wire = l.wire;
      wire.clear();
      const pts = l.cur;
      l.pts.forEach((p, i) => {
        const sway = this.reduced ? 0 : Math.sin(t / 900 + i * 0.5) * 2 + Math.sin(t / 120 + i) * 9 * l.kick;
        pts[i].x = p.x + sway * 0.4;
        pts[i].y = p.y + (i % 6 === 0 ? 0 : sway * 0.3);
      });
      wire.lineStyle(4, 0x1d1830, 1);
      wire.beginPath();
      wire.moveTo(pts[0].x, pts[0].y);
      for (const p of pts) wire.lineTo(p.x, p.y);
      wire.strokePath();
      let j = 0;
      pts.forEach((p, i) => {
        if (i % 6 === 0) {
          wire.fillStyle(0x1d1830, 1);
          wire.fillCircle(p.x, p.y, 6);
          return;
        }
        const angle = this.reduced ? 0 : Math.sin(t / 700 + i) * 6 + Math.sin(t / 110 + i) * 24 * l.kick;
        l.bulbs[j].setPosition(p.x, p.y).setAngle(angle);
        const glow = this.reduced ? 0.5 : 0.5 + 0.38 * Math.sin(t / (820 + ((i * 263) % 1500)) + i * 2.3) + 0.12 * Math.sin(t / 2900 + i * 0.7) + Math.min(0.3, l.kick * 0.25);
        const rad = Phaser.Math.DegToRad(angle);
        l.halos[j].setPosition(p.x, p.y + 20).setAlpha(0.3 + glow * 0.16);
        l.cores[j].setPosition(p.x - Math.sin(rad) * 21, p.y + Math.cos(rad) * 21).setAlpha(0.28 + glow * 0.42);
        j += 1;
      });
    }
  }
}

class Cat {
  private img: Phaser.GameObjects.Image;
  private spot = 0;
  private state: "sleep" | "peek" | "alert" | "run" | "walk" = "sleep";
  private until = 0;
  private calmAt = 0;
  private to = { x: 0, y: 0, depth: 0 };
  private time = 0;
  private idleAt = 7000;
  private idleStep = 0;
  private breath: Phaser.Tweens.Tween | null = null;
  private readonly scale = 0.72 / RES;
  private shadow: Phaser.GameObjects.Image;
  private ground: number;

  constructor(
    private scene: Phaser.Scene,
    private spots: [number, number, number][],
    private reduced: boolean,
  ) {
    const [x, y, depth] = spots[0];
    this.img = scene.add.image(x, y, "cat-sleep").setOrigin(0.5, 1).setScale(this.scale).setDepth(depth || y);
    this.ground = y;
    this.shadow = scene.add.image(x, y - 3, "shade").setAlpha(0.42);
    this.placeShadow();
    this.breathe();
  }

  private placeShadow() {
    const k = Math.min(1, Math.max(0, this.ground - this.img.y) / 60);
    this.shadow
      .setPosition(this.img.x, this.ground - 3)
      .setDisplaySize(118 * (1 - k * 0.35), 20 * (1 - k * 0.3))
      .setAlpha(0.42 * (1 - k * 0.5))
      .setDepth(this.img.depth - 0.02);
  }

  private breathe() {
    this.breath?.stop();
    this.breath = null;
    this.img.setScale(this.scale);
    if (this.reduced) return;
    this.breath = this.scene.tweens.add({ targets: this.img, scaleY: this.scale * 1.04, duration: 1300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private peek(ms: number) {
    this.state = "peek";
    this.until = this.time + ms;
    this.breath?.stop();
    this.img.setTexture("cat-alert").setScale(this.scale);
    if (!this.reduced) this.scene.tweens.add({ targets: this.img, scaleY: { from: this.scale * 0.9, to: this.scale }, duration: 220, ease: "Back.easeOut" });
  }

  private goTo(index: number, state: "run" | "walk") {
    this.spot = index;
    const [tx, ty, td] = this.spots[index];
    this.to = { x: tx, y: ty, depth: td };
    this.state = state;
    this.breath?.stop();
    this.img.setTexture("cat-run").setScale(this.scale).setFlipX(this.to.x < this.img.x);
    if (this.reduced) {
      this.img.setPosition(this.to.x, this.to.y);
      this.ground = this.to.y;
    }
  }

  scare(x: number, y: number, sfx: (n: PajamaSfx, v?: number) => void) {
    if ((this.state !== "sleep" && this.state !== "peek") || this.time < this.calmAt) return;
    const d = Math.hypot(x - this.img.x, (y - this.img.y) * 1.3);
    if (d > 520) return;
    if (d > 300) {
      if (this.state === "sleep") this.peek(900);
      return;
    }
    this.state = "alert";
    this.until = this.time + 520;
    this.breath?.stop();
    this.img.setTexture("cat-alert").setScale(this.scale);
    sfx("meow", 0.8);
    if (!this.reduced) this.scene.tweens.add({ targets: this.img, y: this.img.y - 44, duration: 200, yoyo: true, ease: "Quad.easeOut" });
    let best = this.spot;
    let far = -1;
    this.spots.forEach(([sx, sy], i) => {
      if (i === this.spot) return;
      const dd = Math.hypot(sx - x, sy - y);
      if (dd > far) {
        far = dd;
        best = i;
      }
    });
    this.spot = best;
    const [tx, ty, td] = this.spots[best];
    this.to = { x: tx, y: ty, depth: td };
  }

  private settle(t: number) {
    this.img.setPosition(this.to.x, this.to.y).setDepth(this.to.depth || this.to.y).setTexture("cat-sleep").setFlipX(this.to.x > 960);
    this.ground = this.to.y;
    this.placeShadow();
    this.state = "sleep";
    this.calmAt = t + 3500;
    this.idleAt = t + 8000;
    this.breathe();
  }

  private idle(t: number, feet: { x: number; y: number }[]) {
    this.idleStep += 1;
    this.idleAt = t + 8500 + (this.idleStep % 3) * 2600;
    const kind = this.idleStep % 3;
    if (kind === 1) {
      this.peek(1300);
      return;
    }
    if (kind === 2) {
      const next = (this.spot + 1) % this.spots.length;
      const [nx, ny] = this.spots[next];
      if (feet.every((f) => Math.hypot(f.x - nx, f.y - ny) > 300 && Math.hypot(f.x - this.img.x, f.y - this.img.y) > 220)) {
        this.goTo(next, "walk");
        return;
      }
    }
    this.breath?.stop();
    this.img.setScale(this.scale);
    this.scene.tweens.add({ targets: this.img, scaleX: this.scale * 1.14, scaleY: this.scale * 0.9, duration: 520, yoyo: true, hold: 260, ease: "Sine.easeInOut", onComplete: () => this.state === "sleep" && this.breathe() });
  }

  update(t: number, dt: number, feet: { x: number; y: number; vx: number; vy: number }[], sfx: (n: PajamaSfx, v?: number) => void) {
    this.time = t;
    this.placeShadow();
    if (this.state === "peek") {
      if (t >= this.until) {
        this.state = "sleep";
        this.img.setTexture("cat-sleep");
        this.breathe();
      }
      return;
    }
    if (this.state === "sleep") {
      for (const f of feet) if (Math.hypot(f.x - this.img.x, (f.y - this.img.y) * 1.4) < 120 && Math.hypot(f.vx, f.vy) > 120) this.scare(f.x, f.y, sfx);
      if (this.state === "sleep" && !this.reduced && t >= this.idleAt) this.idle(t, feet);
      return;
    }
    if (this.state === "alert") {
      if (t < this.until) return;
      this.goTo(this.spot, "run");
    }
    const dx = this.to.x - this.img.x;
    const dy = this.to.y - this.img.y;
    const d = Math.hypot(dx, dy);
    const step = (this.state === "walk" ? 230 : 620) * dt;
    if (d <= step || this.reduced) {
      this.settle(t);
      return;
    }
    this.img.x += (dx / d) * step;
    this.img.y += (dy / d) * step;
    this.ground = this.img.y;
    this.img.setDepth(this.img.y + 1);
    if (this.state === "walk" && !this.reduced) this.img.setScale(this.scale, this.scale * (1 + Math.abs(Math.sin(t / 90)) * 0.05));
  }
}
