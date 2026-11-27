import * as Phaser from "phaser";
import { CREAM_HEX, INK_HEX } from "../../kit/ui";
import { pressed } from "../../kit/press";
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
const CUE = { x: 54, y: -164, w: 60, h: 40, gap: 10, tap: 14 };

export class LinaView {
  readonly img: Phaser.GameObjects.Image;
  private readonly pupils: Phaser.GameObjects.Graphics;
  private readonly cue: Phaser.GameObjects.Container;
  private cueOn = false;
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
    this.cue = this.drawCue(x + CUE.x, y + CUE.y);
  }

  onTap(fn: () => void) {
    const up = (p: Phaser.Input.Pointer) => {
      if (p.getDistance() < CUE.tap) pressed(fn);
    };
    const over = (on: boolean) => this.cue.setScale(on && this.cueOn ? 1.1 : 1);
    this.img.setInteractive({ useHandCursor: true });
    for (const target of [this.img, this.cue]) {
      target.on("pointerup", up);
      target.on("pointerover", () => over(true));
      target.on("pointerout", () => over(false));
    }
  }

  setCue(on: boolean) {
    if (on === this.cueOn) return;
    this.cueOn = on;
    const c = this.cue;
    this.scene.tweens.killTweensOf(c);
    if (!on) {
      c.setVisible(false);
      return;
    }
    c.setVisible(true).setScale(1).setAlpha(this.reduced ? 1 : 0);
    if (!this.reduced) this.scene.tweens.add({ targets: c, alpha: 1, duration: 220 });
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

  private drawCue(x: number, y: number) {
    const { w, h, gap } = CUE;
    const left = gap;
    const top = -h - gap;
    const g = this.scene.add.graphics();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(left + 3, top + 4, w, h, 14);
    g.fillStyle(CREAM_HEX, 1);
    g.fillRoundedRect(left, top, w, h, 14);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeRoundedRect(left, top, w, h, 14);
    g.fillStyle(CREAM_HEX, 1);
    g.fillTriangle(left + 4, top + h - 3, left + 20, top + h - 3, 0, 0);
    g.lineBetween(left + 4, top + h, 0, 0);
    g.lineBetween(left + 20, top + h, 0, 0);
    g.fillStyle(INK_HEX, 1);
    for (let i = -1; i <= 1; i += 1) g.fillCircle(left + w / 2 + i * 14, top + h / 2, 4.5);
    const hit = new Phaser.Geom.Rectangle(0, top, left + w, h + gap);
    return this.scene.add
      .container(x, y, [g])
      .setDepth(14.2)
      .setVisible(false)
      .setInteractive({ hitArea: hit, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  }

  private show(kind: Mood) {
    this.current = kind;
    this.img.setTexture(kind === "watch" ? "lina-watch-eyes" : LINA_TEXTURES[kind]);
    this.onMood(kind);
    this.update();
  }
}
