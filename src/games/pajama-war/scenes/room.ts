import * as Phaser from "phaser";
import { H, W } from "../config";
import type { ArenaDef, PropDef, React } from "../arenas";
import type { PajamaSfx } from "../sounds";

export type Block = { x0: number; y0: number; x1: number; y1: number; tall: boolean; prop: Prop | null };

const RES = 1.25;
const BULB_COLORS = [0xffd36b, 0xff8fc4, 0x8ff0d8, 0x9fd4ff, 0xffb36b];

type Theme = { wall: [number, number, number]; floor: [number, number, number]; side: number; base: number; dots: number };
const THEMES: Record<ArenaDef["theme"], Theme> = {
  bedroom: { wall: [0x5b3f9c, 0x4a3286, 0x6e52b4], floor: [0xb8774a, 0x9a5f38, 0xcf9262], side: 0x3b2870, base: 0x7c4527, dots: 0xffe39a },
  living: { wall: [0xc8704a, 0xa85a3c, 0xdc8a5c], floor: [0x8c5a3c, 0x734630, 0xa66c48], side: 0x8a4a34, base: 0x55301e, dots: 0xffd18a },
  yard: { wall: [0x1c2a52, 0x16213f, 0x24346a], floor: [0x3f6a3a, 0x335a30, 0x4f7d44], side: 0x16213f, base: 0x2b3d26, dots: 0xffffff },
};

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
  gfx("star", 40, 40, (g) => {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 8 : 18;
      pts.push(new Phaser.Math.Vector2(20 + Math.cos(a) * r, 20 + Math.sin(a) * r));
    }
    g.fillStyle(0x1d1830, 1);
    g.fillPoints(pts.map((p) => new Phaser.Math.Vector2(p.x + 1.5, p.y + 2)), true);
    g.fillStyle(0xffc83d, 1);
    g.fillPoints(pts, true);
  });
  gfx("confetti", 18, 10, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 18, 10);
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
    gfx(`floor-${name}`, 320, 96, (g) => {
      g.fillStyle(t.floor[0], 1);
      g.fillRect(0, 0, 320, 96);
      if (name === "yard") {
        g.fillStyle(t.floor[2], 0.5);
        for (let i = 0; i < 26; i += 1) g.fillRect((i * 53) % 320, (i * 37) % 96, 3, 9);
        g.fillStyle(t.floor[1], 0.5);
        for (let i = 0; i < 20; i += 1) g.fillRect((i * 71 + 20) % 320, (i * 29 + 40) % 96, 3, 7);
        return;
      }
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

export class Prop {
  readonly img: Phaser.GameObjects.Image;
  readonly base: { x: number; y: number; angle: number; sx: number; sy: number };
  vx = 0;
  vy = 0;
  busy = false;
  private tipped = false;

  constructor(
    private scene: Phaser.Scene,
    readonly def: PropDef,
    private reduced: boolean,
  ) {
    const s = (def.scale ?? 1) / RES;
    const origin = def.origin ?? (def.react === "swing" ? [0.5, 0] : [0.5, 1]);
    this.img = scene.add.image(def.x, def.y, def.key).setOrigin(origin[0], origin[1]).setScale(s).setFlipX(Boolean(def.flip)).setAngle(def.angle ?? 0);
    if (def.depth !== undefined) this.img.setDepth(def.depth);
    else if (def.layer === "wall") this.img.setDepth(5);
    else if (def.layer === "floor") this.img.setDepth(20 + def.y / 1000);
    else this.img.setDepth(def.y);
    this.base = { x: def.x, y: def.y, angle: def.angle ?? 0, sx: s, sy: s };
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
    if (kind === "wobble" || kind === "swing") {
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
  readonly props: Prop[] = [];
  private lights: { bulbs: Phaser.GameObjects.Image[]; halos: Phaser.GameObjects.Image[]; pts: { x: number; y: number }[]; wire: Phaser.GameObjects.Graphics; kick: number; def: ArenaDef["lights"][number] }[] = [];
  private floorPillows: { img: Phaser.GameObjects.Image; x: number; y: number }[] = [];
  private theme: Theme;
  private cat: Cat | null = null;
  private cushions: Phaser.GameObjects.Image[] = [];
  private flies: { img: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; phase: number }[] = [];

  constructor(
    private scene: Phaser.Scene,
    readonly def: ArenaDef,
    private reduced: boolean,
  ) {
    makeTextures(scene);
    this.theme = THEMES[def.theme];
    this.drawShell();
    for (const p of def.props) {
      const prop = new Prop(scene, p, reduced);
      this.props.push(prop);
      if (p.block) {
        const dy = p.block.dy ?? 0;
        this.blocks.push({ x0: p.x - p.block.w / 2, x1: p.x + p.block.w / 2, y0: p.y + dy - p.block.h, y1: p.y + dy, tall: Boolean(p.block.tall), prop });
      }
      if (p.glow) {
        const g = scene.add
          .image(p.x + p.glow.dx, p.y + p.glow.dy, "glow")
          .setDisplaySize(p.glow.r * 2, p.glow.r * 1.3)
          .setTint(p.glow.color)
          .setAlpha(p.glow.alpha ?? 0.3)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(p.layer === "wall" ? 6 : 25);
        if (!reduced && p.react === "wobble") scene.tweens.add({ targets: g, alpha: (p.glow.alpha ?? 0.3) * 0.82, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
    }
    for (const [x, y, tint, angle] of def.floorPillows) {
      const muted = (((tint >> 16) & 255) * 0.74) << 16 | (((tint >> 8) & 255) * 0.72) << 8 | ((tint & 255) * 0.78);
      const img = scene.add.image(x, y, "pillow").setScale(0.6 / RES, 0.42 / RES).setTint(muted).setAlpha(0.92).setAngle(angle).setDepth(24 + y / 1000);
      this.floorPillows.push({ img, x, y });
    }
    for (const l of def.lights) this.makeLights(l);
    if (def.cat) this.cat = new Cat(scene, def.cat, reduced);
    const sofa = def.props.find((p) => p.key === "sofa");
    for (const c of def.cushions ?? []) {
      this.cushions.push(scene.add.image(c.x, c.y, c.key).setOrigin(0.5, 1).setScale(0.82 / RES).setAngle(c.angle).setDepth((sofa?.y ?? c.y) + 0.5));
    }
    for (let i = 0; i < (def.fireflies ?? 0); i += 1) {
      const x = Phaser.Math.Between(def.bounds.x0, def.bounds.x1);
      const y = Phaser.Math.Between(240, def.bounds.y1 - 40);
      const img = scene.add.image(x, y, "glow").setDisplaySize(26, 26).setTint(0xd8ff7a).setBlendMode(Phaser.BlendModes.ADD).setDepth(1300).setAlpha(0.8);
      this.flies.push({ img, x, y, vx: 0, vy: 0, phase: Math.random() * 10 });
    }
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

  private drawShell() {
    const s = this.scene;
    const d = this.def;
    const t = this.theme;
    const wb = d.wallBottom;
    s.add.tileSprite(0, 0, W, wb, `wall-${d.theme}`).setOrigin(0, 0).setDepth(0);
    s.add.tileSprite(0, wb, W, H - wb, `floor-${d.theme}`).setOrigin(0, 0).setDepth(0.5);
    const g = s.add.graphics().setDepth(1);
    g.fillStyle(0x140f26, 0.35);
    g.fillRect(0, 0, W, 40);
    g.fillStyle(0x140f26, 0.18);
    g.fillRect(0, 40, W, 40);
    if (d.theme === "yard") {
      s.add.tileSprite(0, wb - 136, W, 138, "fence").setOrigin(0, 0).setTileScale(0.8 / RES, 0.8 / RES).setDepth(3);
      const glow = s.add.image(W / 2, 0, "glow").setDisplaySize(W * 1.4, 520).setTint(0x3a4a8a).setAlpha(0.35).setDepth(0.6);
      void glow;
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
    side.fillPoints([new Phaser.Math.Vector2(0, 0), new Phaser.Math.Vector2(inset, 0), new Phaser.Math.Vector2(inset, wb), new Phaser.Math.Vector2(0, wb + 150)], true);
    side.fillPoints([new Phaser.Math.Vector2(W, 0), new Phaser.Math.Vector2(W - inset, 0), new Phaser.Math.Vector2(W - inset, wb), new Phaser.Math.Vector2(W, wb + 150)], true);
    side.fillStyle(0x140f26, 0.35);
    side.fillPoints([new Phaser.Math.Vector2(0, wb + 150), new Phaser.Math.Vector2(inset, wb), new Phaser.Math.Vector2(inset - 30, H), new Phaser.Math.Vector2(0, H)], true);
    side.fillPoints([new Phaser.Math.Vector2(W, wb + 150), new Phaser.Math.Vector2(W - inset, wb), new Phaser.Math.Vector2(W - inset + 30, H), new Phaser.Math.Vector2(W, H)], true);
    side.lineStyle(5, 0x1d1830, 0.9);
    side.lineBetween(inset, 0, inset, wb);
    side.lineBetween(W - inset, 0, W - inset, wb);
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
    pts.forEach((p, i) => {
      if (i % 6 === 0) return;
      const color = BULB_COLORS[i % BULB_COLORS.length];
      halos.push(s.add.image(p.x, p.y + 20, "glow").setDisplaySize(90, 90).setTint(color).setAlpha(0.42).setBlendMode(Phaser.BlendModes.ADD).setDepth(7.5));
      bulbs.push(s.add.image(p.x, p.y, "bulb").setOrigin(0.5, 0).setTint(color).setDepth(8));
    });
    this.lights.push({ bulbs, halos, pts, wire, kick: 0, def: l });
  }

  blockAt(x: number, y: number, pad = 0) {
    for (const b of this.blocks) if (x > b.x0 - pad && x < b.x1 + pad && y > b.y0 - pad && y < b.y1 + pad) return b;
    return null;
  }

  tallAt(x: number, y: number) {
    for (const b of this.blocks) if (b.tall && x > b.x0 - 8 && x < b.x1 + 8 && y > b.y0 - 8 && y < b.y1 + 8) return b;
    return null;
  }

  lineBlocked(x0: number, y0: number, x1: number, y1: number) {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 40);
    for (let i = 1; i < steps; i += 1) {
      const k = i / steps;
      if (this.tallAt(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k)) return true;
    }
    return false;
  }

  impact(x: number, y: number, power: number, sfx: (n: PajamaSfx, v?: number) => void) {
    this.cat?.scare(x, y, sfx);
    for (const f of this.flies) {
      const dx = f.x - x;
      const dy = f.y - (y - 80);
      const d = Math.hypot(dx, dy);
      if (d < 260 && d > 0) {
        f.vx += (dx / d) * 260;
        f.vy += (dy / d) * 200;
      }
    }
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
    }
    this.cat?.update(t, dt, feet, sfx);
    for (const f of this.flies) {
      f.vx *= Math.exp(-dt * 1.4);
      f.vy *= Math.exp(-dt * 1.4);
      const wx = this.reduced ? 0 : Math.sin(t / 1300 + f.phase) * 26;
      const wy = this.reduced ? 0 : Math.cos(t / 1700 + f.phase * 1.3) * 18;
      f.x = Phaser.Math.Clamp(f.x + (f.vx + wx) * dt, b.x0 - 60, b.x1 + 60);
      f.y = Phaser.Math.Clamp(f.y + (f.vy + wy) * dt, 200, b.y1);
      f.img.setPosition(f.x, f.y).setAlpha(this.reduced ? 0.7 : 0.45 + 0.4 * Math.max(0, Math.sin(t / 420 + f.phase * 3)));
    }
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
      const pts = l.pts.map((p, i) => {
        const sway = this.reduced ? 0 : Math.sin(t / 900 + i * 0.5) * 2 + Math.sin(t / 120 + i) * 9 * l.kick;
        return { x: p.x + sway * 0.4, y: p.y + (i % 6 === 0 ? 0 : sway * 0.3) };
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
        const flick = this.reduced ? 0.42 : 0.36 + Math.sin(t / 300 + i * 1.7) * 0.06;
        l.halos[j].setPosition(p.x, p.y + 20).setAlpha(flick);
        j += 1;
      });
    }
  }
}

class Cat {
  private img: Phaser.GameObjects.Image;
  private spot = 0;
  private state: "sleep" | "alert" | "run" = "sleep";
  private until = 0;
  private calmAt = 0;
  private to = { x: 0, y: 0, depth: 0 };
  private time = 0;

  constructor(
    private scene: Phaser.Scene,
    private spots: [number, number, number][],
    private reduced: boolean,
  ) {
    const [x, y, depth] = spots[0];
    this.img = scene.add.image(x, y, "cat-sleep").setOrigin(0.5, 1).setScale(0.72 / RES).setDepth(depth || y);
    if (!reduced) scene.tweens.add({ targets: this.img, scaleY: (0.72 / RES) * 1.04, duration: 1300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  scare(x: number, y: number, sfx: (n: PajamaSfx, v?: number) => void) {
    if (this.state !== "sleep" || this.time < this.calmAt) return;
    if (Math.hypot(x - this.img.x, (y - this.img.y) * 1.3) > 300) return;
    this.state = "alert";
    this.until = this.time + 520;
    this.img.setTexture("cat-alert");
    sfx("meow", 0.8);
    if (!this.reduced) {
      this.scene.tweens.killTweensOf(this.img);
      this.img.setScale(0.72 / RES);
      this.scene.tweens.add({ targets: this.img, y: this.img.y - 44, duration: 200, yoyo: true, ease: "Quad.easeOut" });
    }
    let best = this.spot;
    let far = -1;
    this.spots.forEach(([sx, sy], i) => {
      if (i === this.spot) return;
      const d = Math.hypot(sx - x, sy - y);
      if (d > far) {
        far = d;
        best = i;
      }
    });
    this.spot = best;
    const [tx, ty, td] = this.spots[best];
    this.to = { x: tx, y: ty, depth: td };
  }

  update(t: number, dt: number, feet: { x: number; y: number; vx: number; vy: number }[], sfx: (n: PajamaSfx, v?: number) => void) {
    this.time = t;
    if (this.state === "sleep") {
      for (const f of feet) if (Math.hypot(f.x - this.img.x, (f.y - this.img.y) * 1.4) < 120 && Math.hypot(f.vx, f.vy) > 120) this.scare(f.x, f.y, sfx);
      return;
    }
    if (this.state === "alert") {
      if (t < this.until) return;
      this.state = "run";
      this.img.setTexture("cat-run").setFlipX(this.to.x < this.img.x);
      if (this.reduced) {
        this.img.setPosition(this.to.x, this.to.y);
      }
    }
    const dx = this.to.x - this.img.x;
    const dy = this.to.y - this.img.y;
    const d = Math.hypot(dx, dy);
    const step = 620 * dt;
    if (d <= step || this.reduced) {
      this.img.setPosition(this.to.x, this.to.y).setDepth(this.to.depth || this.to.y).setTexture("cat-sleep").setFlipX(this.to.x > 960);
      this.state = "sleep";
      this.calmAt = t + 3500;
      if (!this.reduced) this.scene.tweens.add({ targets: this.img, scaleY: (0.72 / RES) * 1.04, duration: 1300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      return;
    }
    this.img.x += (dx / d) * step;
    this.img.y += (dy / d) * step;
    this.img.setDepth(this.img.y + 1);
  }
}
