import * as Phaser from "phaser";
import { INK_HEX } from "../../kit/ui";
import type { Vec } from "../geometry";

export type Mood = "idle" | "yay" | "oops" | "watch" | "flinch" | "cover" | "close" | "wow";

export const LINA_TEXTURES: Record<Mood, string> = {
  idle: "lina",
  yay: "lina-yay",
  oops: "lina-oops",
  watch: "lina-watch",
  flinch: "lina-flinch",
  cover: "lina-cover",
  close: "lina-close",
  wow: "lina-wow",
};

const SIZE = { w: 150, h: 220 };
const EYES = [
  { x: 58, y: 66 },
  { x: 86, y: 66 },
];
const LOOK = { reach: 3.4, ease: 0.22 };

export class LinaView {
  readonly img: Phaser.GameObjects.Image;
  private readonly pupils: Phaser.GameObjects.Graphics;
  private current: Mood = "idle";
  private base: Mood = "idle";
  private timer?: Phaser.Time.TimerEvent;
  private target: Vec | null = null;
  private look = { x: 0, y: 0 };

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly reduced: boolean,
    private readonly onMood: (kind: Mood) => void,
  ) {
    this.img = scene.add.image(x, y, "lina").setOrigin(0.5, 1).setDepth(14);
    this.pupils = scene.add.graphics().setDepth(14.1).setVisible(false);
    if (!reduced) scene.tweens.add({ targets: this.img, scaleY: 0.97, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  get x() {
    return this.img.x;
  }

  get y() {
    return this.img.y;
  }

  get mood() {
    return this.current;
  }

  setBase(kind: Mood) {
    this.base = kind;
    if (!this.timer) this.show(kind);
  }

  set(kind: Mood, ms = 0) {
    this.timer?.remove();
    this.timer = undefined;
    this.show(kind);
    if (ms)
      this.timer = this.scene.time.delayedCall(ms, () => {
        this.timer = undefined;
        this.show(this.base);
      });
  }

  lookAt(p: Vec | null) {
    this.target = p;
  }

  hop(times = 3) {
    if (this.reduced) return;
    const y = this.img.y;
    this.scene.tweens.add({ targets: this.img, y: y - 36, duration: 180, yoyo: true, repeat: times, ease: "Quad.easeOut", onComplete: () => this.img.setY(y) });
  }

  flinch() {
    this.set("flinch", 420);
    if (this.reduced) return;
    this.scene.tweens.add({ targets: this.img, scaleX: 1.06, duration: 70, yoyo: true, ease: "Quad.easeOut", onComplete: () => this.img.setScale(1, this.img.scaleY) });
  }

  update() {
    const watching = this.current === "watch";
    this.pupils.setVisible(watching);
    if (!watching) return;
    const img = this.img;
    const sy = img.scaleY;
    const left = img.x - (SIZE.w / 2) * img.scaleX;
    const top = img.y - SIZE.h * sy;
    let dx = 0;
    let dy = 0;
    if (this.target && !this.reduced) {
      const ex = left + ((EYES[0].x + EYES[1].x) / 2) * img.scaleX;
      const ey = top + EYES[0].y * sy;
      const vx = this.target.x - ex;
      const vy = this.target.y - ey;
      const len = Math.hypot(vx, vy) || 1;
      dx = (vx / len) * LOOK.reach;
      dy = (vy / len) * LOOK.reach;
    }
    this.look.x += (dx - this.look.x) * LOOK.ease;
    this.look.y += (dy - this.look.y) * LOOK.ease;
    const g = this.pupils;
    g.clear();
    for (const eye of EYES) {
      const px = left + eye.x * img.scaleX + this.look.x;
      const py = top + eye.y * sy + this.look.y;
      g.fillStyle(INK_HEX, 1);
      g.fillCircle(px, py, 4.4);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(px + 1.4, py - 1.5, 1.5);
    }
  }

  private show(kind: Mood) {
    this.current = kind;
    this.img.setTexture(kind === "watch" ? "lina-watch-eyes" : LINA_TEXTURES[kind]);
    this.onMood(kind);
    this.update();
  }
}
