import * as Phaser from "phaser";
import { INK_HEX, type Fonts } from "../../kit/ui";
import type { ResortSfx } from "../sounds";
import { pinUi } from "./journal";

const FIELD = { x: 560, y: 250, w: 800, h: 520 };
const GOAL = 10;

type Drop = { img: Phaser.GameObjects.Image; good: boolean; vy: number; spin: number };

export class ArcadeGame {
  readonly root: Phaser.GameObjects.Container;
  private catcher: Phaser.GameObjects.Image;
  private scoreText: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private drops: Drop[] = [];
  private score = 0;
  private spawnAt = 0;
  private t = 0;
  private running = false;
  private done: (() => void) | null = null;
  private targetX: number | null = null;
  private flash: Phaser.GameObjects.Rectangle;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    private reduced: boolean,
    private sfx: (n: ResortSfx, v?: number) => void,
  ) {
    const dim = scene.add.rectangle(0, 0, 1920, 1080, 0x140f26, 0.7).setOrigin(0, 0);
    const g = scene.add.graphics();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(FIELD.x - 70 + 10, FIELD.y - 140 + 12, FIELD.w + 140, FIELD.h + 230, 40);
    g.fillStyle(0x5a3fb8, 1);
    g.fillRoundedRect(FIELD.x - 70, FIELD.y - 140, FIELD.w + 140, FIELD.h + 230, 40);
    g.lineStyle(7, INK_HEX, 1);
    g.strokeRoundedRect(FIELD.x - 70, FIELD.y - 140, FIELD.w + 140, FIELD.h + 230, 40);
    g.fillStyle(0xf06ba8, 1);
    g.fillRoundedRect(FIELD.x - 40, FIELD.y - 118, FIELD.w + 80, 86, 18);
    g.lineStyle(5, INK_HEX, 1);
    g.strokeRoundedRect(FIELD.x - 40, FIELD.y - 118, FIELD.w + 80, 86, 18);
    g.fillStyle(0x0d2a2a, 1);
    g.fillRoundedRect(FIELD.x - 14, FIELD.y - 14, FIELD.w + 28, FIELD.h + 28, 24);
    g.fillStyle(0x123a3a, 1);
    g.fillRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
    g.lineStyle(6, INK_HEX, 1);
    g.strokeRoundedRect(FIELD.x - 14, FIELD.y - 14, FIELD.w + 28, FIELD.h + 28, 24);
    const title = scene.add.text(960, FIELD.y - 76, "TILT  —  FASE 404", { fontFamily: fonts.display, fontSize: "46px", color: "#1d1830" }).setOrigin(0.5);
    this.scoreText = scene.add.text(FIELD.x + 20, FIELD.y + 16, "", { fontFamily: "Courier New, monospace", fontSize: "34px", fontStyle: "bold", color: "#7dffb2" });
    this.hint = scene.add.text(960, FIELD.y + FIELD.h + 52, "", { fontFamily: fonts.display, fontSize: "30px", color: "#fbf5e6" }).setOrigin(0.5);
    this.catcher = scene.add.image(960, FIELD.y + FIELD.h - 46, "arc-catcher");
    const scan = scene.add.tileSprite(FIELD.x, FIELD.y, FIELD.w, FIELD.h, "scanlines").setOrigin(0, 0).setAlpha(0.25);
    this.flash = scene.add.rectangle(FIELD.x, FIELD.y, FIELD.w, FIELD.h, 0xffffff, 0).setOrigin(0, 0);
    this.root = scene.add.container(0, 0, [dim, g, title, this.scoreText, this.hint, this.catcher, scan, this.flash]).setDepth(9400).setVisible(false);
    pinUi(this.root);
  }

  play(touch: boolean): Promise<void> {
    this.score = 0;
    this.t = 0;
    this.spawnAt = 700;
    this.running = true;
    this.targetX = null;
    for (const d of this.drops) d.img.destroy();
    this.drops = [];
    this.catcher.setX(960);
    this.hint.setText(touch ? "Arraste o dedo para mover" : "← → ou A D para mover");
    this.paintScore();
    this.root.setVisible(true);
    return new Promise((resolve) => {
      this.done = resolve;
    });
  }

  get active() {
    return this.running || this.root.visible;
  }

  pointer(px: number, down: boolean) {
    if (!this.running) return;
    if (down) this.targetX = Phaser.Math.Clamp(px, FIELD.x + 60, FIELD.x + FIELD.w - 60);
  }

  release() {
    this.targetX = null;
  }

  private paintScore() {
    const bars = "▮".repeat(this.score) + "▯".repeat(GOAL - this.score);
    this.scoreText.setText(`SINAL ${bars}`);
  }

  update(dt: number, mx: number) {
    if (!this.running) return;
    this.t += dt * 1000;
    if (this.targetX !== null) this.catcher.x += (this.targetX - this.catcher.x) * Math.min(1, dt * 14);
    else this.catcher.x += mx * 820 * dt;
    this.catcher.x = Phaser.Math.Clamp(this.catcher.x, FIELD.x + 60, FIELD.x + FIELD.w - 60);
    if (this.t >= this.spawnAt) {
      const good = Math.random() < 0.62;
      const x = Phaser.Math.Between(FIELD.x + 50, FIELD.x + FIELD.w - 50);
      const img = this.scene.add.image(x, FIELD.y - 30, good ? "arc-signal" : "arc-static").setScrollFactor(0);
      this.root.addAt(img, this.root.list.length - 2);
      this.drops.push({ img, good, vy: 300 + Math.min(220, this.t / 60) + Math.random() * 80, spin: good ? 0 : (Math.random() - 0.5) * 3 });
      this.spawnAt = this.t + Math.max(380, 640 - this.t / 60);
    }
    const cy = this.catcher.y;
    for (const d of this.drops) {
      d.img.y += d.vy * dt;
      d.img.rotation += d.spin * dt;
      if (!d.img.active) continue;
      if (Math.abs(d.img.y - (cy - 20)) < 44 && Math.abs(d.img.x - this.catcher.x) < 76) {
        if (d.good) {
          this.score += 1;
          this.sfx("catch", 0.8);
          if (!this.reduced) this.scene.tweens.add({ targets: this.catcher, scaleY: { from: 0.8, to: 1 }, duration: 150 });
        } else {
          this.score = Math.max(0, this.score - 1);
          this.sfx("hurt", 0.7);
          this.flash.setFillStyle(0xffffff, 0.5);
          this.scene.tweens.add({ targets: this.flash, fillAlpha: 0, duration: 260 });
        }
        this.paintScore();
        d.img.destroy();
      } else if (d.img.y > FIELD.y + FIELD.h + 20) d.img.destroy();
    }
    this.drops = this.drops.filter((d) => d.img.active);
    if (this.score >= GOAL) {
      this.running = false;
      this.sfx("win", 1);
      this.hint.setText("FASE COMPLETA!");
      for (const d of this.drops) d.img.destroy();
      this.drops = [];
      this.scene.time.delayedCall(900, () => {
        this.root.setVisible(false);
        const r = this.done;
        this.done = null;
        r?.();
      });
    }
  }
}
