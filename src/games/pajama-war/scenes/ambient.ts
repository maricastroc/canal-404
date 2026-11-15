import * as Phaser from "phaser";
import { cartoonText, INK_HEX, type Fonts } from "../../kit/ui";
import type { Prop, Room } from "./room";

type Sway = { prop: Prop; amp: number; period: number; phase: number; quietSince: number; kind: "angle" | "breath" };
type Fly = { img: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; heading: number; turn: number; speed: number; blink: number; phase: number };
type Note = { img: Phaser.GameObjects.Image; born: number; x: number; drift: number };

const TV = { x0: 238, y0: 299, x1: 396, y1: 411 };
const BARS = [0xfbf5e6, 0xffc83d, 0x63d6c1, 0x8fd16a, 0xf06ba8, 0xef4f43, 0x5cb9f0];
const SHOW_MS = 6200;
const STATIC_MS = 260;

export function makeAmbientTextures(scene: Phaser.Scene) {
  const tex = scene.textures;
  const gfx = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
    if (tex.exists(key)) return;
    const g = scene.make.graphics({}, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  gfx("note", 30, 40, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillEllipse(10, 31, 18, 13);
    g.fillRect(15, 4, 5, 28);
    g.fillTriangle(15, 4, 28, 10, 15, 16);
    g.fillStyle(0xffc83d, 1);
    g.fillEllipse(10, 31, 11, 7);
  });
  gfx("rocket", 64, 34, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillTriangle(6, 2, 24, 17, 6, 32);
    g.fillEllipse(32, 17, 50, 26);
    g.fillTriangle(48, 6, 64, 17, 48, 28);
    g.fillStyle(0xef4f43, 1);
    g.fillTriangle(9, 7, 22, 17, 9, 27);
    g.fillStyle(0xfbf5e6, 1);
    g.fillEllipse(32, 17, 42, 18);
    g.fillTriangle(48, 10, 59, 17, 48, 24);
    g.fillStyle(0x5cb9f0, 1);
    g.fillCircle(38, 17, 5);
  });
}

class TvShow {
  private g: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private small: Phaser.GameObjects.Text;
  private rocket: Phaser.GameObjects.Image;
  private drops: Phaser.GameObjects.Image[] = [];
  private staticUntil = 0;
  private stars: [number, number][] = [];
  private show = 0;
  private shownAt = 0;

  constructor(
    scene: Phaser.Scene,
    private fonts: Fonts,
    depth: number,
    private reduced: boolean,
  ) {
    this.g = scene.add.graphics().setDepth(depth);
    this.label = cartoonText(scene, (TV.x0 + TV.x1) / 2, (TV.y0 + TV.y1) / 2, "404", { size: 38, color: "#ffc83d", font: fonts.display, stroke: 0.22 }).setOrigin(0.5).setDepth(depth + 0.01);
    this.small = cartoonText(scene, (TV.x0 + TV.x1) / 2, TV.y0 + 18, "", { size: 15, color: "#fbf5e6", font: fonts.display, stroke: 0.25, shadow: false }).setOrigin(0.5).setDepth(depth + 0.01);
    this.rocket = scene.add.image(TV.x0, (TV.y0 + TV.y1) / 2, "rocket").setScale(0.62).setDepth(depth + 0.01).setVisible(false);
    for (let i = 0; i < 3; i += 1) this.drops.push(scene.add.image(TV.x0, TV.y0, "pillow").setScale(0.2).setDepth(depth + 0.01).setVisible(false));
    for (let i = 0; i < 14; i += 1) this.stars.push([TV.x0 + 8 + ((i * 53) % (TV.x1 - TV.x0 - 16)), TV.y0 + 8 + ((i * 37) % (TV.y1 - TV.y0 - 16))]);
  }

  glitch(t: number) {
    this.staticUntil = t + 420;
  }

  update(t: number) {
    const g = this.g;
    g.clear();
    const w = TV.x1 - TV.x0;
    const h = TV.y1 - TV.y0;
    if (this.reduced) {
      this.ident(t, true);
      return;
    }
    if (t - this.shownAt >= SHOW_MS) {
      this.show = (this.show + 1) % 3;
      this.shownAt = t;
      this.staticUntil = Math.max(this.staticUntil, t + STATIC_MS);
    }
    if (t < this.staticUntil) {
      this.hideAll();
      g.fillStyle(0x2b2150, 1);
      g.fillRoundedRect(TV.x0, TV.y0, w, h, 12);
      const seed = Math.floor(t / 45);
      for (let i = 0; i < 70; i += 1) {
        const r = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
        const k = r - Math.floor(r);
        const r2 = Math.sin((i + 3) * 93.989 + seed * 17.13) * 24634.6345;
        const k2 = r2 - Math.floor(r2);
        g.fillStyle(k > 0.5 ? 0xfbf5e6 : 0x9df0dc, 0.5 + k2 * 0.4);
        g.fillRect(TV.x0 + 6 + k * (w - 18), TV.y0 + 6 + k2 * (h - 14), 9, 3);
      }
      return;
    }
    if (this.show === 0) this.ident(t, false);
    else if (this.show === 1) this.cartoon(t);
    else this.weather(t);
  }

  private hideAll() {
    this.label.setVisible(false);
    this.small.setVisible(false);
    this.rocket.setVisible(false);
    for (const d of this.drops) d.setVisible(false);
  }

  private ident(t: number, still: boolean) {
    const g = this.g;
    const w = TV.x1 - TV.x0;
    const h = TV.y1 - TV.y0;
    this.hideAll();
    const bw = w / BARS.length;
    BARS.forEach((c, i) => {
      g.fillStyle(c, 1);
      g.fillRect(TV.x0 + i * bw, TV.y0, bw + 1, h * 0.72);
    });
    g.fillStyle(0x2b2150, 1);
    g.fillRect(TV.x0, TV.y0 + h * 0.72, w, h * 0.28);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(TV.x0 + w / 2 - 46, TV.y0 + h * 0.36 - 22, 92, 44, 10);
    this.label.setVisible(true).setText("404").setFontSize(34).setPosition(TV.x0 + w / 2, TV.y0 + h * 0.36).setScale(still ? 1 : 1 + Math.max(0, Math.sin(t / 260)) * 0.08);
    this.small.setVisible(true).setText("NO AR").setPosition(TV.x0 + w / 2, TV.y0 + h * 0.86);
  }

  private cartoon(t: number) {
    const g = this.g;
    const w = TV.x1 - TV.x0;
    const h = TV.y1 - TV.y0;
    this.hideAll();
    g.fillStyle(0x1d2a5a, 1);
    g.fillRect(TV.x0, TV.y0, w, h);
    for (const [x, y] of this.stars) {
      g.fillStyle(0xfbf5e6, 0.5 + 0.5 * Math.abs(Math.sin(t / 300 + x)));
      g.fillCircle(x, y, 1.6);
    }
    g.fillStyle(0xfff2b0, 1);
    g.fillCircle(TV.x1 - 30, TV.y0 + 26, 14);
    g.fillStyle(0x1d2a5a, 1);
    g.fillCircle(TV.x1 - 24, TV.y0 + 22, 12);
    const k = ((t - this.shownAt) % SHOW_MS) / SHOW_MS;
    const x = TV.x0 + 20 + k * (w - 40);
    const y = TV.y0 + h * 0.6 + Math.sin(k * Math.PI * 4) * 12;
    this.rocket.setVisible(true).setPosition(x, y).setAngle(Math.cos(k * Math.PI * 4) * -14).setAlpha(Math.min(1, k * 8, (1 - k) * 8));
    g.fillStyle(0xffc83d, 0.9);
    g.fillTriangle(x - 20, y - 5, x - 20, y + 5, x - 28 - Math.abs(Math.sin(t / 50)) * 8, y);
    g.fillStyle(0x2b2150, 1);
    g.fillRect(TV.x0, TV.y1 - 18, w, 18);
    this.small.setVisible(true).setText("FOGUETE 404").setPosition(TV.x0 + w / 2, TV.y1 - 9);
  }

  private weather(t: number) {
    const g = this.g;
    const w = TV.x1 - TV.x0;
    this.hideAll();
    g.fillStyle(0x5cb9f0, 1);
    g.fillRect(TV.x0, TV.y0, w, TV.y1 - TV.y0);
    g.fillStyle(0xfbf5e6, 1);
    const cx = TV.x0 + 44;
    const cy = TV.y0 + 52;
    g.fillCircle(cx, cy, 16);
    g.fillCircle(cx + 18, cy - 6, 20);
    g.fillCircle(cx + 38, cy, 15);
    g.fillRect(cx - 4, cy, 46, 14);
    g.lineStyle(3, INK_HEX, 1);
    g.strokeCircle(cx + 18, cy - 6, 20);
    this.drops.forEach((d, i) => {
      const k = ((t / 1100 + i / 3) % 1 + 1) % 1;
      d.setVisible(true).setPosition(cx - 4 + i * 22, cy + 18 + k * 36).setAngle(Math.sin(t / 200 + i) * 30).setAlpha(Math.min(1, (1 - k) * 4));
    });
    this.small.setVisible(true).setText("PREVISÃO").setPosition(TV.x0 + w * 0.72, TV.y0 + 30);
    g.fillStyle(0x2b2150, 1);
    g.fillRect(TV.x0, TV.y1 - 26, w, 26);
    g.fillStyle(0xffc83d, 1);
    g.fillRect(TV.x0, TV.y1 - 26, 8, 26);
  }
}

export class Ambient {
  private sways: Sway[] = [];
  private flies: Fly[] = [];
  private notes: Note[] = [];
  private fan: { g: Phaser.GameObjects.Graphics; x: number; y: number; angle: number; speed: number } | null = null;
  private clock: { g: Phaser.GameObjects.Graphics; x: number; y: number; ringAt: number; ringUntil: number } | null = null;
  private tv: TvShow | null = null;
  private noteAt = 4000;
  private boombox: Prop | null = null;
  private time = 0;
  private blade = [0, 1, 2, 3].map(() => [0, 1, 2, 3].map(() => new Phaser.Math.Vector2()));
  private bladeShadow = [0, 1, 2, 3].map(() => new Phaser.Math.Vector2());

  constructor(
    private scene: Phaser.Scene,
    private room: Room,
    private reduced: boolean,
    fonts: Fonts,
  ) {
    makeAmbientTextures(scene);
    const theme = room.def.theme;
    for (const p of room.props) {
      const key = p.def.key;
      if (key === "tree") this.sways.push({ prop: p, amp: 0.7, period: 1700, phase: 0.4, quietSince: 0, kind: "angle" });
      if (key === "bush") this.sways.push({ prop: p, amp: 1.3, period: 1300, phase: p.def.x / 300, quietSince: 0, kind: "angle" });
      if (key === "tire-swing") this.sways.push({ prop: p, amp: 4.5, period: 520, phase: 0, quietSince: 0, kind: "angle" });
      if (key === "plant-big") this.sways.push({ prop: p, amp: 1.1, period: 1500, phase: p.def.x / 500, quietSince: 0, kind: "angle" });
      if (key === "tent") this.sways.push({ prop: p, amp: 0.018, period: 900, phase: 0, quietSince: 0, kind: "breath" });
      if (key === "boombox") this.boombox = p;
    }
    if (theme === "bedroom") {
      this.fan = { g: scene.add.graphics().setDepth(6.5), x: 470, y: 0, angle: 0.3, speed: 0 };
      this.clock = { g: scene.add.graphics().setDepth(452.6), x: 1377, y: 336, ringAt: 9000, ringUntil: 0 };
      const pool = scene.add.image(1360, 470, "glow").setDisplaySize(340, 96).setTint(0xffc46b).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD).setDepth(24);
      if (!reduced) scene.tweens.add({ targets: pool, alpha: 0.14, duration: 2200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    if (theme === "living") {
      const tv = room.props.find((p) => p.def.key === "tv");
      this.tv = new TvShow(scene, fonts, (tv?.img.depth ?? 525) + 0.3, reduced);
    }
    const b = room.def.bounds;
    const n = room.def.fireflies ?? 0;
    for (let i = 0; i < n; i += 1) {
      const x = b.x0 + ((i * 397) % (b.x1 - b.x0));
      const y = 240 + ((i * 211) % (b.y1 - 280));
      const img = scene.add.image(x, y, "glow").setDisplaySize(24, 24).setTint(0xd8ff7a).setBlendMode(Phaser.BlendModes.ADD).setDepth(1300).setAlpha(0.6);
      this.flies.push({ img, x, y, vx: 0, vy: 0, heading: (i * 2.39) % (Math.PI * 2), turn: 0, speed: 16 + (i % 5) * 4, blink: 2400 + (i % 7) * 260, phase: i * 977 });
    }
  }

  update(t: number, dt: number) {
    this.time = t;
    this.swayProps(t);
    this.updateFlies(t, dt);
    this.updateFan(dt);
    this.updateClock(t);
    this.tv?.update(t);
    this.updateNotes(t);
  }

  private swayProps(t: number) {
    if (this.reduced) return;
    for (const s of this.sways) {
      const p = s.prop;
      if (p.busy || this.scene.tweens.isTweening(p.img)) {
        s.quietSince = t;
        continue;
      }
      const ramp = Math.min(1, (t - s.quietSince) / 800);
      if (s.kind === "angle") {
        const wave = Math.sin(t / s.period + s.phase) + Math.sin(t / (s.period * 2.3) + s.phase * 1.7) * 0.4;
        p.img.setAngle(p.base.angle + wave * s.amp * ramp);
      } else {
        const gust = Math.max(0, Math.sin(t / 2100 + s.phase)) * (0.6 + 0.4 * Math.sin(t / s.period));
        p.img.setScale(p.base.sx * (1 + gust * s.amp * ramp), p.base.sy * (1 - gust * s.amp * 0.5 * ramp));
      }
    }
  }

  private updateFlies(t: number, dt: number) {
    if (!this.flies.length) return;
    const b = this.room.def.bounds;
    for (const f of this.flies) {
      f.vx *= Math.exp(-dt * 1.4);
      f.vy *= Math.exp(-dt * 1.4);
      if (!this.reduced) {
        f.turn += (Math.sin(t / 900 + f.phase) * 1.4 - f.turn) * Math.min(1, dt * 2);
        f.heading += f.turn * dt;
        const bob = Math.sin(t / 380 + f.phase) * 10;
        f.x += (Math.cos(f.heading) * f.speed + f.vx) * dt;
        f.y += (Math.sin(f.heading) * f.speed * 0.6 + f.vy + bob * 0.3) * dt;
        if (f.x < b.x0 - 40 || f.x > b.x1 + 40) f.heading = Math.PI - f.heading;
        if (f.y < 210 || f.y > b.y1 - 10) f.heading = -f.heading;
        f.x = Phaser.Math.Clamp(f.x, b.x0 - 40, b.x1 + 40);
        f.y = Phaser.Math.Clamp(f.y, 210, b.y1 - 10);
      }
      const k = (((t + f.phase) % f.blink) + f.blink) % f.blink / f.blink;
      const glow = this.reduced ? 0.55 : k < 0.42 ? Math.sin((k / 0.42) * Math.PI) : 0;
      f.img.setPosition(f.x, f.y).setAlpha(0.12 + glow * 0.8).setDisplaySize(18 + glow * 10, 18 + glow * 10);
    }
  }

  private updateFan(dt: number) {
    const fan = this.fan;
    if (!fan) return;
    const g = fan.g;
    g.clear();
    if (!this.reduced) {
      fan.speed = Math.max(0, fan.speed - dt * 1.2);
      fan.angle += (0.9 + fan.speed) * dt;
    }
    const hubY = fan.y + 88;
    g.lineStyle(8, INK_HEX, 1);
    g.lineBetween(fan.x, fan.y, fan.x, hubY - 20);
    const drawBlade = (i: number, front: boolean) => {
      const a = fan.angle + (i * Math.PI) / 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      if (s >= 0 !== front) return;
      const len = 150;
      const tipX = fan.x + c * len;
      const tipY = hubY + s * len * 0.16;
      const px = -s * 0.88;
      const py = c * 0.16;
      const pts = this.blade[i];
      pts[0].set(fan.x + px * 10, hubY + py * 10 - 3);
      pts[1].set(tipX + px * 26, tipY + py * 26 - 6);
      pts[2].set(tipX - px * 26, tipY - py * 26 + 6);
      pts[3].set(fan.x - px * 10, hubY - py * 10 + 3);
      for (let k = 0; k < 4; k += 1) this.bladeShadow[k].set(pts[k].x, pts[k].y + 4);
      g.fillStyle(INK_HEX, 1);
      g.fillPoints(this.bladeShadow, true);
      g.fillStyle(front ? 0xc98552 : 0xa9683f, 1);
      g.fillPoints(pts, true);
      g.lineStyle(4, INK_HEX, 1);
      g.strokePoints(pts, true);
    };
    for (let i = 0; i < 4; i += 1) drawBlade(i, false);
    g.fillStyle(INK_HEX, 1);
    g.fillEllipse(fan.x + 2, hubY + 2, 66, 32);
    g.fillStyle(0x6e52b4, 1);
    g.fillEllipse(fan.x, hubY, 62, 28);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeEllipse(fan.x, hubY, 62, 28);
    g.fillStyle(0xfff3b0, 1);
    g.fillEllipse(fan.x, hubY + 14, 26, 14);
    g.lineStyle(3, INK_HEX, 1);
    g.strokeEllipse(fan.x, hubY + 14, 26, 14);
    for (let i = 0; i < 4; i += 1) drawBlade(i, true);
  }

  private updateClock(t: number) {
    const c = this.clock;
    if (!c) return;
    const g = c.g;
    g.clear();
    if (!this.reduced && t >= c.ringAt) {
      c.ringUntil = t + 900;
      c.ringAt = t + 15000 + ((t * 7) % 6000);
    }
    const ringing = !this.reduced && t < c.ringUntil;
    const jig = ringing ? Math.sin(t / 22) * 3 : 0;
    const x = c.x + jig;
    const y = c.y;
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(x - 13, y - 17, 7);
    g.fillCircle(x + 13, y - 17, 7);
    g.fillStyle(0xffc83d, 1);
    g.fillCircle(x - 13, y - 17, 4.5);
    g.fillCircle(x + 13, y - 17, 4.5);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(x - 20, y - 15, 40, 33, 9);
    g.fillStyle(0xf06ba8, 1);
    g.fillRoundedRect(x - 17, y - 12, 34, 27, 7);
    g.fillStyle(0xfffaf0, 1);
    g.fillCircle(x, y + 1, 10);
    g.lineStyle(2.5, INK_HEX, 1);
    g.strokeCircle(x, y + 1, 10);
    const sec = this.reduced ? 0 : Math.floor(t / 1000);
    const sa = -Math.PI / 2 + (sec % 60) * (Math.PI / 30);
    const ma = -Math.PI / 2 + (t / 60000) * Math.PI * 2;
    g.lineStyle(2.5, INK_HEX, 1);
    g.lineBetween(x, y + 1, x + Math.cos(ma) * 6, y + 1 + Math.sin(ma) * 6);
    g.lineStyle(1.6, 0xef4f43, 1);
    g.lineBetween(x, y + 1, x + Math.cos(sa) * 8, y + 1 + Math.sin(sa) * 8);
    if (ringing) {
      g.lineStyle(3, INK_HEX, 1);
      for (const side of [-1, 1]) {
        g.lineBetween(x + side * 24, y - 22, x + side * 32, y - 30);
        g.lineBetween(x + side * 26, y - 12, x + side * 35, y - 14);
      }
    }
  }

  private updateNotes(t: number) {
    if (this.boombox && !this.reduced && t >= this.noteAt) {
      this.noteAt = t + 5200 + ((t * 13) % 3400);
      for (let i = 0; i < 2; i += 1) {
        const img = this.scene.add.image(this.boombox.def.x - 20 + i * 34, this.boombox.def.y - 70, "note").setDepth(this.boombox.img.depth + 1).setScale(0.7).setAlpha(0);
        this.notes.push({ img, born: t + i * 420, x: img.x, drift: i ? 1 : -1 });
      }
    }
    for (const n of this.notes) {
      const age = (t - n.born) / 1600;
      if (age < 0) continue;
      if (age >= 1) {
        n.img.destroy();
        continue;
      }
      n.img.setPosition(n.x + Math.sin(age * Math.PI * 2) * 10 * n.drift, this.boombox!.def.y - 70 - age * 70).setAlpha(Math.min(1, age * 5, (1 - age) * 3)).setAngle(Math.sin(age * 9) * 12);
    }
    this.notes = this.notes.filter((n) => n.img.active);
  }

  impact(x: number, y: number, power: number) {
    for (const f of this.flies) {
      const dx = f.x - x;
      const dy = f.y - (y - 80);
      const d = Math.hypot(dx, dy);
      if (d < 260 && d > 0) {
        f.vx += (dx / d) * 260 * power;
        f.vy += (dy / d) * 200 * power;
      }
    }
    if (this.fan && y < 640) this.fan.speed = Math.min(5, this.fan.speed + power * 2.4);
    if (this.clock && Math.hypot(x - this.clock.x, y - 452) < 230 && this.time >= this.clock.ringUntil && !this.reduced) this.clock.ringUntil = this.time + 600;
    if (this.tv && Math.hypot(x - 330, y - 500) < 240) this.tv.glitch(this.time);
  }
}
