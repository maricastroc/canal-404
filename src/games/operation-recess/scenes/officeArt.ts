import * as Phaser from "phaser";
import { FLOOR_Y, TILE } from "../config";
import type { LevelDef } from "../levels";

type Edge = { x: number; side: 1 | -1; flap: Phaser.GameObjects.Image; at: number };
type Watcher = { img: Phaser.GameObjects.Image; pupils: Phaser.GameObjects.Arc[]; eyes: [number, number][]; look: { x: number; y: number } };
type Clock = { box: Phaser.GameObjects.Container; hour: Phaser.GameObjects.Image; minute: Phaser.GameObjects.Image; second: Phaser.GameObjects.Image; rings: Phaser.GameObjects.Image[]; minutes: number; running: boolean; tickAt: number };
export type OfficeHero = { x: number; top: number; feet: number };

const INK = "#1d1830";
const EDGE = { w: 120, h: 320, e: 44, f: 10 };
const FLAP = { w: 60, h: 124, ox: 6, oy: 4 };
const VOID_TOP = "#2a1730";
const VOID_LOW = "#140f26";
const PUPILS: Record<string, { eyes: [number, number][]; r: number }> = {
  "principal-a": { eyes: [[77, 108], [103, 108]], r: 3.5 },
  "principal-b": { eyes: [[77, 108], [103, 108]], r: 3.5 },
  "principal-c": { eyes: [[76, 107], [104, 107]], r: 3 },
};
const LOOK = { x: 4.2, y: 2, reach: 520, rate: 6, range: 1500 };
const CLOCK = { hour: 10, from: 3, recess: 15 };

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  const c = tex?.getContext();
  if (!tex || !c) return;
  c.lineJoin = "round";
  c.lineCap = "round";
  draw(c);
  tex.refresh();
}

function poly(c: CanvasRenderingContext2D, pts: number[][]) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) c.lineTo(x, y);
  c.closePath();
}

function voidFill(c: CanvasRenderingContext2D, top: number, bottom: number) {
  const g = c.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, VOID_TOP);
  g.addColorStop(1, VOID_LOW);
  return g;
}

export function makeOfficeTextures(scene: Phaser.Scene) {
  canvas(scene, "pit-depth", 8, 220, (c) => {
    c.fillStyle = voidFill(c, 0, 220);
    c.fillRect(0, 0, 8, 220);
    const shade = c.createLinearGradient(0, 0, 0, 40);
    shade.addColorStop(0, "rgba(10,6,20,0.55)");
    shade.addColorStop(1, "rgba(10,6,20,0)");
    c.fillStyle = shade;
    c.fillRect(0, 0, 8, 40);
  });
  canvas(scene, "pit-edge", EDGE.w, EDGE.h, (c) => {
    const { e: E, f: F } = EDGE;
    const jag = [
      [E, F + 14],
      [E - 5, F + 19],
      [E - 2, F + 24],
      [E - 8, F + 31],
      [E - 4, F + 39],
      [E - 11, F + 47],
      [E - 7, F + 55],
      [E - 13, F + 63],
      [E - 10, F + 71],
      [E - 17, F + 81],
      [E - 13, F + 93],
      [E - 20, F + 105],
      [E - 16, F + 119],
      [E - 22, F + 135],
      [E - 18, F + 152],
      [E - 24, F + 170],
      [E - 19, F + 192],
      [E - 25, F + 214],
      [E - 20, F + 240],
      [E - 26, F + 268],
      [E - 22, EDGE.h],
    ];
    c.fillStyle = voidFill(c, F, EDGE.h);
    poly(c, [...jag, [E + 2, EDGE.h], [E + 2, F + 14]]);
    c.fill();
    c.strokeStyle = "#d99558";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(jag[0][0] - 3, jag[0][1]);
    for (const [x, y] of jag.slice(1)) c.lineTo(x - 3, y);
    c.stroke();
    for (const [x, y] of jag) {
      if (y < F + 30 || y > F + 66) continue;
      c.strokeStyle = INK;
      c.lineWidth = 4.5;
      c.beginPath();
      c.moveTo(x - 1, y);
      c.lineTo(x + 7, y + 6);
      c.stroke();
      c.strokeStyle = "#c4352c";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x - 1, y);
      c.lineTo(x + 7, y + 6);
      c.stroke();
    }
    c.strokeStyle = INK;
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(E, F - 2);
    c.lineTo(E, F + 14);
    for (const [x, y] of jag) c.lineTo(x, y);
    c.stroke();
    const board = (x: number, y: number, angle: number, len: number, thick: number) => {
      const shape = [[0, -thick / 2], [len - 6, -thick / 2], [len + 2, -thick / 4], [len - 4, 0], [len + 5, thick / 4], [len - 6, thick / 2], [0, thick / 2]];
      c.save();
      c.translate(x, y);
      c.rotate(angle);
      c.fillStyle = "#7c4527";
      poly(c, shape);
      c.fill();
      c.fillStyle = "#9c5832";
      c.fillRect(0, -thick / 2, len - 8, 4);
      c.fillStyle = "#d99558";
      poly(c, [[len - 6, -thick / 2], [len + 2, -thick / 4], [len - 4, 0], [len - 8, 0]]);
      c.fill();
      c.strokeStyle = INK;
      c.lineWidth = 3.5;
      poly(c, shape);
      c.stroke();
      c.fillStyle = INK;
      c.beginPath();
      c.arc(len * 0.62, 0, 2.2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };
    board(E - 10, F + 92, 0.78, 54, 12);
    board(E - 6, F + 7, 1.02, 70, 13);
    c.fillStyle = "#55301e";
    poly(c, [[E - 7, F + 14], [E, F + 9], [E, F + 14]]);
    c.fill();
  });
  canvas(scene, "pit-flap", FLAP.w, FLAP.h, (c) => {
    const shape = [
      [4, 4],
      [20, 4],
      [38, 26],
      [48, 60],
      [45, 92],
      [40, 112],
      [33, 104],
      [27, 117],
      [21, 106],
      [14, 115],
      [9, 96],
      [5, 54],
    ];
    c.fillStyle = "#c4352c";
    poly(c, shape);
    c.fill();
    c.fillStyle = "#8f2424";
    poly(c, [[4, 4], [12, 6], [16, 50], [16, 108], [14, 115], [9, 96], [5, 54]]);
    c.fill();
    c.strokeStyle = "#ffc83d";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(18, 6);
    c.quadraticCurveTo(40, 34, 40, 96);
    c.stroke();
    c.strokeStyle = "#e86a5c";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(24, 30);
    c.quadraticCurveTo(32, 56, 31, 84);
    c.stroke();
    c.strokeStyle = INK;
    c.lineWidth = 4;
    poly(c, shape);
    c.stroke();
    c.lineWidth = 2;
    for (const [x, y] of [[40, 112], [27, 117], [14, 115]]) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - 1, y + 5);
      c.stroke();
    }
  });
  canvas(scene, "pit-chip", 18, 12, (c) => {
    c.fillStyle = "#7c4527";
    poly(c, [[2, 6], [8, 2], [16, 4], [12, 10], [4, 10]]);
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.stroke();
  });
  canvas(scene, "clock-hour", 24, 80, (c) => {
    c.fillStyle = INK;
    poly(c, [[12, 2], [20, 22], [16, 68], [8, 68], [4, 22]]);
    c.fill();
  });
  canvas(scene, "clock-minute", 20, 112, (c) => {
    c.fillStyle = INK;
    poly(c, [[10, 2], [16, 18], [13, 100], [7, 100], [4, 18]]);
    c.fill();
    c.fillStyle = "#ef4f43";
    poly(c, [[10, 6], [13, 16], [7, 16]]);
    c.fill();
  });
  canvas(scene, "clock-second", 10, 120, (c) => {
    c.strokeStyle = "#ef4f43";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(5, 4);
    c.lineTo(5, 112);
    c.stroke();
    c.fillStyle = "#ef4f43";
    c.beginPath();
    c.arc(5, 92, 4, 0, Math.PI * 2);
    c.fill();
  });
  canvas(scene, "clock-ring", 70, 90, (c) => {
    c.strokeStyle = INK;
    c.lineWidth = 9;
    for (const [x0, y0, x1, y1] of [[14, 14, 40, 28], [10, 46, 44, 46], [14, 78, 40, 64]]) {
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();
    }
    c.strokeStyle = "#ffc83d";
    c.lineWidth = 4;
    for (const [x0, y0, x1, y1] of [[14, 14, 40, 28], [10, 46, 44, 46], [14, 78, 40, 64]]) {
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();
    }
  });
  canvas(scene, "shock-ring", 200, 200, (c) => {
    c.strokeStyle = INK;
    c.lineWidth = 14;
    c.beginPath();
    c.arc(100, 100, 86, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = "#fffaf0";
    c.lineWidth = 7;
    c.beginPath();
    c.arc(100, 100, 86, 0, Math.PI * 2);
    c.stroke();
  });
}

export class OfficeSet {
  private edges: Edge[] = [];
  private watchers: Watcher[] = [];
  private clockSet: Clock | null = null;
  private nextChip = 3000;
  private lastT = 0;

  constructor(
    private scene: Phaser.Scene,
    level: LevelDef,
    private reduced: boolean,
  ) {
    makeOfficeTextures(scene);
    this.pits(level);
  }

  private pits(level: LevelDef) {
    const ground = [...level.ground].sort((a, b) => a[0] - b[0]);
    for (let i = 0; i + 1 < ground.length; i += 1) {
      const x0 = (ground[i][1] + 1) * TILE;
      const x1 = ground[i + 1][0] * TILE;
      if (x1 <= x0) continue;
      this.scene.add.image(x0, FLOOR_Y, "pit-depth").setOrigin(0, 0).setDisplaySize(x1 - x0, 220).setDepth(4.95);
      this.edge(x0, 1);
      this.edge(x1, -1);
    }
  }

  private edge(x: number, side: 1 | -1) {
    const img = this.scene.add.image(x, FLOOR_Y - EDGE.f, "pit-edge").setOrigin(EDGE.e / EDGE.w, 0).setDepth(5.15);
    if (side < 0) img.setFlipX(true).setOrigin(1 - EDGE.e / EDGE.w, 0);
    const flap = this.scene.add.image(x + side * 2, FLOOR_Y + 22, "pit-flap").setOrigin(FLAP.ox / FLAP.w, FLAP.oy / FLAP.h).setDepth(5.14).setFlipX(side < 0);
    if (side < 0) flap.setOrigin(1 - FLAP.ox / FLAP.w, FLAP.oy / FLAP.h);
    this.edges.push({ x, side, flap, at: -1e9 });
  }

  watch(img: Phaser.GameObjects.Image, key: string) {
    const art = PUPILS[key];
    if (!art) return;
    const k = img.scaleX;
    const pupils = art.eyes.map(() => this.scene.add.circle(img.x, img.y, art.r * k, 0x1d1830).setDepth(img.depth + 0.001));
    this.watchers.push({ img, pupils, eyes: art.eyes, look: { x: 0, y: 0 } });
    this.placeEyes(this.watchers[this.watchers.length - 1]);
  }

  private placeEyes(w: Watcher) {
    const { img } = w;
    const k = img.scaleX;
    const rad = Phaser.Math.DegToRad(img.angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    w.eyes.forEach(([ex, ey], i) => {
      const lx = (ex - img.width * img.originX + w.look.x) * k;
      const ly = (ey - img.height * img.originY + w.look.y) * k;
      w.pupils[i].setPosition(img.x + lx * cos - ly * sin, img.y + lx * sin + ly * cos);
    });
  }

  clock(x: number, y: number, size: number) {
    const s = this.scene;
    const face = s.add.image(0, 0, "recess-clock");
    const k = size / face.width;
    face.setScale(k);
    const hour = s.add.image(0, 0, "clock-hour").setOrigin(0.5, 62 / 80).setScale(k * 1.15);
    const minute = s.add.image(0, 0, "clock-minute").setOrigin(0.5, 92 / 112).setScale(k * 1.15);
    const second = s.add.image(0, 0, "clock-second").setOrigin(0.5, 92 / 120).setScale(k * 1.1);
    const cap = s.add.circle(0, 0, 9 * k, 0xef4f43).setStrokeStyle(4 * k, 0x1d1830);
    const box = s.add.container(x, y, [face, hour, minute, second, cap]).setDepth(0.81);
    const rings = [-1, 1].map((d) => s.add.image(x + d * size * 0.62, y - size * 0.18, "clock-ring").setFlipX(d < 0).setDepth(0.82).setScale(k * 1.6).setVisible(false));
    this.clockSet = { box, hour, minute, second, rings, minutes: CLOCK.from, running: true, tickAt: 0 };
    this.setHands(false);
  }

  private setHands(animate: boolean) {
    const c = this.clockSet;
    if (!c) return;
    const minute = c.minutes * 6;
    const hour = (CLOCK.hour + c.minutes / 60) * 30;
    if (!animate || this.reduced) {
      c.minute.setAngle(minute);
      c.hour.setAngle(hour);
      return;
    }
    this.scene.tweens.add({ targets: c.minute, angle: minute, duration: 320, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: c.hour, angle: hour, duration: 320, ease: "Back.easeOut" });
  }

  private tick(t: number) {
    const c = this.clockSet;
    if (!c || !c.running || t < c.tickAt) return;
    c.tickAt = t + 1000;
    const to = c.second.angle + 6;
    if (this.reduced) c.second.setAngle(to);
    else this.scene.tweens.add({ targets: c.second, angle: to, duration: 120, ease: "Back.easeOut" });
  }

  silence() {
    const c = this.clockSet;
    if (!c) return;
    c.running = false;
    if (this.reduced) return;
    this.scene.tweens.killTweensOf(c.second);
    this.scene.tweens.add({ targets: c.second, angle: c.second.angle - 4, duration: 90, yoyo: true });
    this.scene.tweens.add({ targets: c.box, angle: { from: -5, to: 0 }, duration: 600, ease: "Elastic.easeOut" });
  }

  advance() {
    const c = this.clockSet;
    if (!c || c.minutes >= CLOCK.recess) return;
    c.minutes += 1;
    this.setHands(true);
    if (!this.reduced) this.scene.tweens.add({ targets: c.box, scale: { from: 1.05, to: 1 }, duration: 260, ease: "Back.easeOut" });
  }

  ring() {
    const c = this.clockSet;
    if (!c) return;
    c.minutes = CLOCK.recess;
    this.setHands(true);
    c.running = true;
    for (const r of c.rings) r.setVisible(true).setAlpha(1);
    if (this.reduced) {
      this.scene.time.delayedCall(1200, () => c.rings.forEach((r) => r.setVisible(false)));
      return;
    }
    this.scene.tweens.add({ targets: c.box, angle: { from: -4, to: 4 }, duration: 60, yoyo: true, repeat: 14, onComplete: () => c.box.setAngle(0) });
    this.scene.tweens.add({ targets: c.rings, alpha: 0.2, duration: 120, yoyo: true, repeat: 6, onComplete: () => c.rings.forEach((r) => r.setVisible(false)) });
  }

  crumble(x: number, power: number) {
    const e = this.edges.find((q) => (x - q.x) * q.side < 0 && Math.abs(x - q.x) < 110);
    if (!e) return false;
    const now = this.scene.time.now;
    if (now - e.at < 700) return false;
    e.at = now;
    this.chips(e, 2 + Math.round(power * 3));
    this.sway(e, 0.6 + power);
    return true;
  }

  private chips(e: Edge, n: number) {
    const count = this.reduced ? Math.min(1, n) : n;
    for (let i = 0; i < count; i += 1) {
      const chip = this.scene.add.image(e.x + e.side * Phaser.Math.Between(-6, 10), FLOOR_Y + Phaser.Math.Between(4, 30), "pit-chip").setDepth(5.13).setAngle(Phaser.Math.Between(0, 360));
      if (this.reduced) {
        this.scene.tweens.add({ targets: chip, alpha: 0, delay: 200, duration: 300, onComplete: () => chip.destroy() });
        continue;
      }
      this.scene.tweens.add({ targets: chip, x: chip.x + e.side * Phaser.Math.Between(6, 40), duration: 700, ease: "Sine.easeOut" });
      this.scene.tweens.add({ targets: chip, y: FLOOR_Y + 220, angle: chip.angle + Phaser.Math.Between(-300, 300), duration: Phaser.Math.Between(560, 820), delay: i * 60, ease: "Quad.easeIn", onComplete: () => chip.destroy() });
    }
  }

  private sway(e: Edge, power: number) {
    if (this.reduced) return;
    this.scene.tweens.killTweensOf(e.flap);
    this.scene.tweens.add({ targets: e.flap, angle: { from: -e.side * 9 * power, to: 0 }, duration: 1100, ease: "Elastic.easeOut", easeParams: [1.1, 0.4] });
  }

  update(t: number, hero: OfficeHero, view: Phaser.Geom.Rectangle) {
    const dt = Math.min(0.1, Math.max(0, (t - this.lastT) / 1000));
    this.lastT = t;
    this.tick(t);
    const k = 1 - Math.exp(-dt * LOOK.rate);
    for (const w of this.watchers) {
      if (Math.abs(w.img.x - hero.x) > LOOK.range) continue;
      const tx = Phaser.Math.Clamp((hero.x - w.img.x) / LOOK.reach, -1, 1) * LOOK.x;
      const ty = Phaser.Math.Clamp((hero.top + 40 - w.img.y) / LOOK.reach, -1, 1) * LOOK.y;
      w.look.x += (tx - w.look.x) * k;
      w.look.y += (ty - w.look.y) * k;
      this.placeEyes(w);
    }
    if (this.reduced || t < this.nextChip) return;
    this.nextChip = t + Phaser.Math.Between(2600, 5200);
    const seen = this.edges.filter((e) => e.x > view.x && e.x < view.right);
    if (seen.length) this.chips(Phaser.Utils.Array.GetRandom(seen) as Edge, 1);
  }
}
