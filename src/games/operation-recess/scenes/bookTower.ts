import * as Phaser from "phaser";
import { FLOOR_Y, TILE } from "../config";
import { INK_HEX } from "../../kit/ui";
import type { StageApi } from "./enemies";
import type { HeroState } from "./gadgets";
import { cx } from "./world";

const BOOKS: { w: number; th: number; color: number }[] = [
  { w: 96, th: 24, color: 0x3a4f9f },
  { w: 84, th: 20, color: 0xef4f43 },
  { w: 102, th: 26, color: 0x3e8f6a },
  { w: 78, th: 19, color: 0xffc83d },
  { w: 90, th: 22, color: 0x7b62c4 },
  { w: 74, th: 18, color: 0xf06ba8 },
  { w: 94, th: 23, color: 0x63d6c1 },
  { w: 86, th: 21, color: 0xa33a3a },
  { w: 80, th: 20, color: 0x5cb9f0 },
  { w: 98, th: 25, color: 0x93cf4c },
];
const ORDERS = [
  [2, 0, 6, 4, 9, 1, 7, 3, 8, 5, 4, 1, 3],
  [9, 6, 0, 7, 2, 4, 8, 1, 5, 3, 6, 0, 5],
];
const FALL_MS = 460;
const REACH_PAD = 70;

type Book = { img: Phaser.GameObjects.Image; spec: (typeof BOOKS)[number]; lift: number };

export function makeTowerTextures(scene: Phaser.Scene) {
  BOOKS.forEach((b, i) => {
    const key = `tower-book-${i}`;
    if (scene.textures.exists(key)) return;
    const w = b.w + 6;
    const h = b.th + 6;
    const g = scene.make.graphics({}, false);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(0, 0, w, h, 5);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRect(w - 16, 4, 11, h - 8);
    g.fillStyle(0xd8cdb4, 1);
    for (let y = 7; y < h - 5; y += 4) g.fillRect(w - 15, y, 9, 1.5);
    g.fillStyle(b.color, 1);
    g.fillRoundedRect(3, 3, w - 18, h - 6, 3);
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(6, 5, w - 26, 3);
    g.fillStyle(INK_HEX, 0.5);
    g.fillRect(12, 3, 3, h - 6);
    g.fillRect(19, 3, 3, h - 6);
    if (i % 3 !== 1) {
      g.fillStyle(0xfbf5e6, 1);
      g.fillRoundedRect(Math.round(w * 0.42), Math.round(h / 2 - 4), 18, 8, 2);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  });
  if (!scene.textures.exists("tower-note")) {
    const g = scene.make.graphics({}, false);
    g.fillStyle(INK_HEX, 1);
    g.fillRect(0, 0, 34, 34);
    g.fillStyle(0xffe066, 1);
    g.fillRect(3, 3, 28, 28);
    g.fillStyle(0xef4f43, 1);
    g.fillRoundedRect(14, 7, 6, 13, 2);
    g.fillCircle(17, 25, 3.2);
    g.generateTexture("tower-note", 34, 34);
    g.destroy();
  }
}

export class BookTower {
  readonly x: number;
  readonly height: number;
  readonly half = 54;
  private stack: Phaser.GameObjects.Container;
  private books: Book[] = [];
  private shadow: Phaser.GameObjects.Image;
  private sway: Phaser.Tweens.Tween | null = null;
  private state: "stand" | "fall" | "down" = "stand";

  constructor(
    private api: StageApi,
    col: number,
    index: number,
    private onLand: (x0: number, x1: number, dir: number) => void,
  ) {
    const scene = api.scene;
    makeTowerTextures(scene);
    this.x = cx(col) + TILE / 2;
    this.shadow = scene.add.image(this.x, FLOOR_Y + 3, "blob").setDepth(5.3).setDisplaySize(150, 26).setAlpha(0.75);
    this.stack = scene.add.container(this.x, FLOOR_Y + 2).setDepth(9);
    const order = ORDERS[index % ORDERS.length];
    const lean = index % 2 ? -1.1 : 1.1;
    let y = 0;
    order.forEach((b, i) => {
      const spec = BOOKS[b];
      const dx = Math.round(Math.sin(i * 1.9 + index) * 6 + lean * i);
      const img = scene.add.image(dx, -y, `tower-book-${b}`).setOrigin(0.5, 1).setAngle(Math.sin(i * 2.7 + index * 3) * 2.4).setFlipX((i + index) % 3 === 0);
      this.stack.add(img);
      this.books.push({ img, spec, lift: y });
      y += spec.th + 1;
    });
    this.height = y;
    const top = this.books[this.books.length - 1].img;
    const note = scene.add.image(top.x + lean * 14, -y + 8, "tower-note").setOrigin(0.5, 1).setAngle(lean * 9);
    this.stack.add(note);
    if (!api.reduced) this.sway = scene.tweens.add({ targets: this.stack, angle: { from: -lean * 0.6, to: lean * 1.4 }, duration: 1500, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: index * 400 });
  }

  get standing() {
    return this.state === "stand";
  }

  get top() {
    return FLOOR_Y - this.height;
  }

  bounds() {
    return new Phaser.Geom.Rectangle(this.x - this.half - 6, this.top - 10, this.half * 2 + 12, this.height + 10);
  }

  reach(dir: number): [number, number] {
    const a = this.x - dir * 20;
    const b = this.x + dir * (this.height + REACH_PAD);
    return dir > 0 ? [a, b] : [b, a];
  }

  update(h: HeroState) {
    if (this.state !== "stand") return;
    const over = Math.abs(h.x - this.x) < this.half + 16 && h.vy > 150 && h.feet > this.top - 10 && h.feet < this.top + 70;
    if (over) this.topple(Math.sign(h.vx) || 1);
  }

  topple(dir: number) {
    if (this.state !== "stand") return false;
    this.state = "fall";
    this.sway?.stop();
    this.sway = null;
    const scene = this.api.scene;
    this.api.sfx("hit", 0.5);
    this.stack.setAngle(0).setX(this.x + dir * this.half);
    for (const o of this.stack.list as Phaser.GameObjects.Image[]) o.x -= dir * this.half;
    scene.tweens.add({ targets: this.shadow, alpha: 0, duration: 300 });
    if (this.api.reduced) {
      scene.time.delayedCall(160, () => this.land(dir));
      return true;
    }
    scene.tweens.add({
      targets: this.stack,
      angle: -dir * 4,
      duration: 90,
      ease: "Quad.easeOut",
      onComplete: () => {
        scene.tweens.add({ targets: this.stack, angle: dir * 86, duration: FALL_MS, ease: "Quad.easeIn", onComplete: () => this.land(dir) });
        this.books.forEach((b, i) => scene.tweens.add({ targets: b.img, y: b.img.y - i * 2.4, duration: FALL_MS, ease: "Quad.easeIn" }));
      },
    });
    return true;
  }

  private land(dir: number) {
    this.state = "down";
    const scene = this.api.scene;
    const px = this.stack.x;
    const py = this.stack.y;
    const rad = Phaser.Math.DegToRad(this.stack.angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const [x0, x1] = this.reach(dir);
    this.books.forEach((b, i) => {
      const lx = b.img.x;
      const ly = b.img.y - (b.spec.th + 6) / 2;
      const wx = px + lx * cos - ly * sin;
      const wy = py + lx * sin + ly * cos;
      const img = scene.add.image(wx, wy, b.img.texture.key).setDepth(16 + i * 0.001).setAngle(this.stack.angle + b.img.angle).setFlipX(b.img.flipX);
      const k = i / Math.max(1, this.books.length - 1);
      const tx = wx + dir * (14 + 46 * k + ((i * 37) % 23));
      const rest = FLOOR_Y + 2 - (b.spec.th + 6) / 2 - ((i * 13) % 3) * 9 - (i % 4 === 1 ? 12 : 0);
      const flat = (i % 3 === 0 ? 180 : 0) + (((i * 29) % 25) - 12);
      if (this.api.reduced) {
        img.setPosition(tx, rest).setAngle(flat);
        return;
      }
      scene.tweens.add({ targets: img, x: tx, angle: flat + dir * (i % 2 ? 360 : 0), duration: 380 + (i % 4) * 60, ease: "Quad.easeOut" });
      scene.tweens.add({ targets: img, y: rest, duration: 420 + (i % 4) * 60, ease: "Bounce.easeOut" });
    });
    this.stack.destroy();
    const mid = (x0 + x1) / 2;
    this.api.sfx("crash", 0.9);
    this.api.impact(mid, 0.8);
    this.api.word(this.api.words.topple, mid, FLOOR_Y - 280, "#ffc83d", 50);
    if (!this.api.reduced) {
      scene.cameras.main.shake(150, 0.006);
      for (let i = 0; i < 4; i += 1) this.api.dust(x0 + ((x1 - x0) * (i + 0.5)) / 4, FLOOR_Y, i % 2 ? 1 : -1);
    }
    this.onLand(x0, x1, dir);
  }
}
