import * as Phaser from "phaser";
import { FAN_HALF, FAN_REACH, PARTS, partAngle, partFacing, type PartType } from "../config";
import { partPoly } from "../geometry";
import { INK_HEX } from "../../kit/ui";

export type PartLook = "idle" | "selected" | "valid" | "invalid";

const LOOK_COLOR: Record<Exclude<PartLook, "idle">, number> = {
  selected: 0xffc83d,
  valid: 0x63d6c1,
  invalid: 0xef4f43,
};

const HIT_MIN = 64;

export class PartView {
  readonly container: Phaser.GameObjects.Container;
  readonly hit: Phaser.GameObjects.Rectangle;
  private img: Phaser.GameObjects.Image;
  private blade?: Phaser.GameObjects.Image;
  private chevrons?: Phaser.GameObjects.Graphics;
  private overlay: Phaser.GameObjects.Graphics;
  private outline: Phaser.GameObjects.Graphics;
  private look: PartLook = "idle";
  private running = false;
  private phase = 0;
  private bladeTween?: Phaser.Tweens.Tween;
  x = 0;
  y = 0;
  rot = 0;

  constructor(
    private scene: Phaser.Scene,
    readonly type: PartType,
    private reduced: boolean,
  ) {
    const def = PARTS[type];
    this.img = scene.add.image(0, 0, def.tex);
    const children: Phaser.GameObjects.GameObject[] = [this.img];
    if (type === "fan") {
      this.blade = scene.add.image(26, -14, "fan-blade");
      children.push(this.blade);
    }
    if (type === "belt") {
      this.chevrons = scene.add.graphics();
      children.push(this.chevrons);
    }
    this.hit = scene.add.rectangle(0, 0, Math.max(def.w, HIT_MIN), Math.max(def.h + 30, HIT_MIN), 0xffffff, 0);
    children.push(this.hit);
    this.container = scene.add.container(0, 0, children).setDepth(9);
    this.overlay = scene.add.graphics().setDepth(8);
    this.outline = scene.add.graphics().setDepth(10);
    this.hit.setInteractive({ useHandCursor: true });
    this.drawChevrons();
  }

  get def() {
    return PARTS[this.type];
  }

  get facing() {
    return partFacing(this.type, this.rot);
  }

  get angle() {
    return partAngle(this.type, this.rot);
  }

  setPose(x: number, y: number, rot: number) {
    this.x = x;
    this.y = y;
    this.rot = rot;
    this.container.setPosition(x, y).setAngle(this.angle);
    const f = this.facing;
    if (this.type === "fan") {
      this.img.setFlipX(f < 0);
      this.blade?.setX(26 * f);
    }
    this.drawChevrons();
    this.drawOverlay();
    this.drawOutline();
  }

  setLook(look: PartLook) {
    this.look = look;
    this.container.setAlpha(look === "valid" || look === "invalid" ? 0.92 : 1);
    this.drawOutline();
  }

  setDepthLift(lifted: boolean) {
    this.container.setDepth(lifted ? 22 : 9);
    this.outline.setDepth(lifted ? 23 : 10);
    this.overlay.setDepth(lifted ? 21 : 8);
  }

  setRunning(on: boolean) {
    this.running = on;
    this.bladeTween?.stop();
    this.bladeTween = undefined;
    this.blade?.setScale(1);
    if (this.blade && !this.reduced) {
      this.bladeTween = this.scene.tweens.add({
        targets: this.blade,
        scaleY: { from: 1, to: -1 },
        duration: on ? 70 : 900,
        yoyo: true,
        repeat: -1,
      });
    }
    this.drawOverlay();
  }

  squash() {
    if (this.reduced) return;
    this.scene.tweens.killTweensOf(this.img);
    this.img.setScale(1.1, 0.55).setY(10);
    this.scene.tweens.add({ targets: this.img, scaleX: 1, scaleY: 1, y: 0, duration: 380, ease: "Elastic.easeOut" });
  }

  shake() {
    if (this.reduced) return;
    this.scene.tweens.killTweensOf(this.container);
    this.container.setX(this.x);
    this.scene.tweens.add({ targets: this.container, x: this.x + 5, duration: 45, yoyo: true, repeat: 3, onComplete: () => this.container.setX(this.x) });
  }

  pulse() {
    if (this.reduced) return;
    this.scene.tweens.killTweensOf(this.container);
    this.container.setScale(1.12);
    this.scene.tweens.add({ targets: this.container, scale: 1, duration: 220, ease: "Back.easeOut" });
  }

  update(delta: number) {
    if (!this.running || this.reduced) return;
    this.phase += delta;
    this.drawChevrons();
    if (this.type === "fan") this.drawOverlay();
  }

  setVisible(v: boolean) {
    this.container.setVisible(v);
    this.overlay.setVisible(v);
    this.outline.setVisible(v);
  }

  destroy() {
    this.bladeTween?.stop();
    this.container.destroy();
    this.overlay.destroy();
    this.outline.destroy();
  }

  private drawChevrons() {
    const g = this.chevrons;
    if (!g) return;
    g.clear();
    const f = this.facing;
    const spacing = 44;
    const offset = this.running && !this.reduced ? ((this.phase * 0.12) % spacing) * f : 0;
    for (let i = -3; i <= 3; i += 1) {
      const cx = i * spacing + offset;
      if (Math.abs(cx) > 86) continue;
      const alpha = 1 - Math.max(0, Math.abs(cx) - 60) / 26;
      g.lineStyle(5, 0xffc83d, alpha);
      g.beginPath();
      g.moveTo(cx - 6 * f, -6);
      g.lineTo(cx + 4 * f, 0);
      g.lineTo(cx - 6 * f, 6);
      g.strokePath();
    }
  }

  private drawOverlay() {
    const g = this.overlay;
    g.clear();
    if (this.type === "fan") {
      const f = this.facing;
      const x0 = this.x + f * 40;
      const x1 = this.x + f * (48 + FAN_REACH);
      const left = Math.min(x0, x1);
      const top = this.y - FAN_HALF;
      g.fillStyle(0xffffff, this.running ? 0.16 : 0.12);
      g.fillRoundedRect(left, top, Math.abs(x1 - x0), FAN_HALF * 2, 18);
      g.lineStyle(3, 0xffffff, this.running ? 0.5 : 0.4);
      const rows = [-38, -12, 14, 40];
      rows.forEach((dy, r) => {
        const len = Math.abs(x1 - x0);
        const step = 90;
        const shift = this.running && !this.reduced ? (this.phase * 0.5 + r * 37) % step : r * 22;
        for (let d = shift; d < len - 30; d += step) {
          const fade = 1 - d / len;
          g.lineStyle(3, 0xffffff, (this.running ? 0.75 : 0.45) * fade);
          const sx = x0 + f * d;
          g.lineBetween(sx, this.y + dy, sx + f * 34, this.y + dy);
        }
      });
    } else if (this.type === "spring") {
      const a = Phaser.Math.DegToRad(this.angle);
      const nx = Math.sin(a);
      const ny = -Math.cos(a);
      const sx = this.x + nx * 30;
      const sy = this.y + ny * 30;
      g.lineStyle(4, 0xffffff, 0.6);
      for (let d = 0; d < 80; d += 20) {
        g.lineBetween(sx + nx * d, sy + ny * d, sx + nx * (d + 10), sy + ny * (d + 10));
      }
      const tx = sx + nx * 96;
      const ty = sy + ny * 96;
      const px = -ny;
      const py = nx;
      g.fillStyle(0xffffff, 0.7);
      g.fillTriangle(tx, ty, tx - nx * 16 + px * 10, ty - ny * 16 + py * 10, tx - nx * 16 - px * 10, ty - ny * 16 - py * 10);
    }
  }

  private drawOutline() {
    const g = this.outline;
    g.clear();
    if (this.look === "idle") return;
    const poly = partPoly(this.type, this.x, this.y, this.rot);
    const pad = 8;
    const cx = this.x;
    const cy = this.y;
    const grown = poly.map((p) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const len = Math.hypot(dx, dy) || 1;
      return new Phaser.Math.Vector2(p.x + (dx / len) * pad, p.y + (dy / len) * pad);
    });
    g.lineStyle(9, INK_HEX, 0.55);
    g.strokePoints(grown, true, true);
    g.lineStyle(5, LOOK_COLOR[this.look], 1);
    g.strokePoints(grown, true, true);
  }
}
