import * as Phaser from "phaser";
import { KID_INFO, PILLOW } from "../config";
import type { Fighter } from "./fighter";

const SIZE = 0.7 / 1.25;
const MUTED = 0xb8aec8;

export class Pillow {
  readonly img: Phaser.GameObjects.Image;
  readonly shadow: Phaser.GameObjects.Image;
  private halo: Phaser.GameObjects.Image;
  private ghosts: Phaser.GameObjects.Image[] = [];
  private trail: { x: number; y: number; a: number }[] = [];
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  alive = true;
  flying = true;
  dist = 0;
  nearPlayer = false;
  nearFoe: Fighter | null = null;
  hitSomeone = false;
  private spin: number;

  constructor(
    private scene: Phaser.Scene,
    readonly owner: Fighter,
    x: number,
    y: number,
    angle: number,
    private reduced: boolean,
    speedMul = 1,
  ) {
    this.x = x;
    this.y = y;
    this.z = PILLOW.lift;
    this.vx = Math.cos(angle) * PILLOW.speed * speedMul;
    this.vy = Math.sin(angle) * PILLOW.speed * speedMul * 0.86;
    this.spin = (Math.cos(angle) >= 0 ? 1 : -1) * (reduced ? 0 : 720);
    this.shadow = scene.add.image(x, y, "blob").setDisplaySize(74, 22).setAlpha(0.55).setDepth(30);
    const color = KID_INFO[owner.kid].color;
    this.halo = scene.add.image(x, y - this.z, "pillow").setScale(SIZE * 1.24).setTintFill(color).setAlpha(0.95).setDepth(y + 2.9);
    if (!reduced) {
      for (const a of [0.34, 0.2, 0.1]) this.ghosts.push(scene.add.image(x, y - this.z, "pillow").setScale(SIZE * 0.92).setTint(KID_INFO[owner.kid].tint).setAlpha(a).setDepth(y + 2.8));
    }
    this.img = scene.add.image(x, y - this.z, "pillow").setScale(SIZE).setTint(KID_INFO[owner.kid].tint).setDepth(y + 3);
  }

  get progress() {
    return this.dist / PILLOW.range;
  }

  update(dt: number) {
    if (!this.flying) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.dist += Math.hypot(this.vx, this.vy) * dt;
    const p = this.progress;
    const drop = p > 0.72 ? ((p - 0.72) / 0.28) ** 2 : 0;
    this.z = Math.max(0, PILLOW.lift + Math.sin(Math.min(1, p) * Math.PI) * 22 - drop * PILLOW.lift);
    this.img.setPosition(this.x, this.y - this.z).setDepth(this.y + 3);
    this.img.angle += this.spin * dt;
    this.halo.setPosition(this.x, this.y - this.z).setAngle(this.img.angle).setDepth(this.y + 2.9);
    if (this.ghosts.length) {
      this.trail.unshift({ x: this.img.x, y: this.img.y, a: this.img.angle });
      if (this.trail.length > 10) this.trail.pop();
      this.ghosts.forEach((gh, i) => {
        const tr = this.trail[Math.min(this.trail.length - 1, (i + 1) * 3)];
        gh.setPosition(tr.x, tr.y).setAngle(tr.a).setDepth(this.y + 2.8);
      });
    }
    const k = 1 - Math.min(1, this.z / 200) * 0.4;
    this.shadow.setPosition(this.x, this.y + 2).setDisplaySize(70 * k, 20 * k);
    if (p >= 1 || this.z <= 0) this.land();
  }

  land() {
    if (!this.flying) return;
    this.flying = false;
    this.vx = 0;
    this.vy = 0;
    this.z = 0;
    this.img.setPosition(this.x, this.y - 10).setDepth(40 + this.y / 100).setTint(MUTED).setAlpha(0.85);
    this.shadow.setVisible(false);
    this.clearTrail();
    if (this.reduced) {
      this.img.setAngle(0).setScale(0.55 / 1.25, 0.4 / 1.25);
    } else {
      this.scene.tweens.add({ targets: this.img, angle: Phaser.Math.Between(-24, 24), scaleY: 0.4 / 1.25, scaleX: 0.58 / 1.25, y: this.y - 8, duration: 160, ease: "Quad.easeOut" });
    }
    this.scene.tweens.add({ targets: this.img, alpha: 0, delay: 700, duration: 400, onComplete: () => this.kill() });
  }

  private clearTrail() {
    this.halo.setVisible(false);
    for (const gh of this.ghosts) gh.destroy();
    this.ghosts = [];
  }

  stop(x: number, y: number, z: number, squish = false) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.flying = false;
    this.shadow.setVisible(false);
    this.clearTrail();
    if (this.reduced) {
      this.kill();
      return;
    }
    if (squish) {
      const a = Math.atan2(this.vy, this.vx) * (180 / Math.PI);
      this.img.setAngle(a + 90).setScale(SIZE * 1.45, SIZE * 0.5);
      this.scene.tweens.add({ targets: this.img, scaleX: SIZE * 0.9, scaleY: SIZE * 1.1, duration: 90, delay: 50, ease: "Back.easeOut" });
      this.scene.tweens.add({ targets: this.img, x: x - this.vx * 0.08, y: y - 40, angle: this.img.angle + 160, duration: 240, delay: 120, ease: "Quad.easeOut" });
      this.img.setTint(MUTED);
      this.scene.tweens.add({ targets: this.img, alpha: 0, delay: 380, duration: 260, onComplete: () => this.kill() });
      this.vx = 0;
      this.vy = 0;
      return;
    }
    this.scene.tweens.add({
      targets: this.img,
      x: x - this.vx * 0.06,
      y: y - 6,
      angle: this.img.angle + 120,
      scaleY: SIZE * 0.55,
      duration: 260,
      ease: "Quad.easeIn",
    });
    this.img.setTint(MUTED);
    this.scene.tweens.add({ targets: this.img, alpha: 0, delay: 700, duration: 400, onComplete: () => this.kill() });
    this.vx = 0;
    this.vy = 0;
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    this.flying = false;
    this.img.destroy();
    this.shadow.destroy();
    this.halo.destroy();
    for (const gh of this.ghosts) gh.destroy();
    this.ghosts = [];
  }
}
