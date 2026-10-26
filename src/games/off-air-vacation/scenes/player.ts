import * as Phaser from "phaser";
import { ACCEL, CHAR_RES, DECO_SCALE, SPEED, SPRITE_FOOT, type Dir } from "../config";

const BASE = DECO_SCALE / CHAR_RES;

function slide(blocked: (x: number, y: number) => boolean, x: number, y: number, alongX: boolean, step: number) {
  for (let k = 3; k <= 21; k += 3) {
    for (const sign of [-1, 1]) {
      const o = sign * k;
      const free = alongX ? !blocked(x + o, y) : !blocked(x, y + o);
      if (free) return Math.sign(o) * Math.min(step, k);
    }
  }
  return 0;
}
const STEPS = ["walk-a", "walk-b", "walk-c", "walk-d"] as const;

export class Player {
  readonly sprite: Phaser.GameObjects.Image;
  readonly shadow: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  dir: Dir = "f";
  facing = 1;
  private clock = 0;
  private actUntil = 0;
  private lean = 0;
  private pose = "idle-f";
  private cheering = false;
  private sitting = false;
  onStep: ((n: number) => void) | null = null;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    private reduced: boolean,
  ) {
    this.x = x;
    this.y = y;
    this.shadow = scene.add.image(x, y, "blob").setDisplaySize(110, 30).setAlpha(0.5);
    this.sprite = scene.add.image(x, y, "deco-idle-f").setOrigin(0.5, SPRITE_FOOT).setScale(BASE);
  }

  get top() {
    return this.y - 220 * DECO_SCALE;
  }

  face(dx: number, dy: number) {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax > ay) {
      this.dir = "s";
      this.facing = dx >= 0 ? 1 : -1;
    } else this.dir = dy > 0 ? "f" : "k";
    if (ax > 8 && this.dir !== "s") this.facing = dx >= 0 ? 1 : -1;
  }

  act(time: number) {
    this.actUntil = time + 420;
  }

  cheer(on: boolean) {
    this.cheering = on;
  }

  sit(on: boolean) {
    this.sitting = on;
  }

  stop() {
    this.vx = 0;
    this.vy = 0;
  }

  update(time: number, dt: number, mx: number, my: number, blocked: (x: number, y: number) => boolean) {
    const len = Math.hypot(mx, my);
    const tx = len > 0.05 ? (mx / Math.max(1, len)) * SPEED : 0;
    const ty = len > 0.05 ? (my / Math.max(1, len)) * SPEED * 0.92 : 0;
    const step = ACCEL * dt;
    this.vx += Phaser.Math.Clamp(tx - this.vx, -step, step);
    this.vy += Phaser.Math.Clamp(ty - this.vy, -step, step);
    const nx = this.x + this.vx * dt;
    if (!blocked(nx, this.y)) this.x = nx;
    else {
      const dy = Math.abs(ty) < Math.abs(tx) * 0.5 ? slide(blocked, nx, this.y, false, SPEED * 0.7 * dt) : 0;
      if (dy && !blocked(this.x, this.y + dy)) this.y += dy;
      this.vx = 0;
    }
    const ny = this.y + this.vy * dt;
    if (!blocked(this.x, ny)) this.y = ny;
    else {
      const dx = Math.abs(tx) < Math.abs(ty) * 0.5 ? slide(blocked, this.x, ny, true, SPEED * 0.7 * dt) : 0;
      if (dx && !blocked(this.x + dx, this.y)) this.x += dx;
      this.vy = 0;
    }
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 40) {
      const ax = Math.abs(this.vx);
      const ay = Math.abs(this.vy);
      if (this.dir === "s") {
        if (ay > ax * 1.4) this.dir = this.vy > 0 ? "f" : "k";
      } else if (ax > ay * 1.4) this.dir = "s";
      else this.dir = this.vy > 0 ? "f" : "k";
      if (ax > 30) this.facing = this.vx > 0 ? 1 : -1;
    }
    let pose = `idle-${this.dir}`;
    if (this.cheering) pose = "cheer";
    else if (this.sitting) pose = "sit";
    else if (time < this.actUntil) pose = `act-${this.dir}`;
    else if (speed > 40) {
      const before = Math.floor(this.clock / 46);
      this.clock += speed * dt;
      const now = Math.floor(this.clock / 46);
      pose = `${STEPS[now % 4]}-${this.dir}`;
      if (now !== before && now % 2 === 0) this.onStep?.(now);
    }
    if (pose !== this.pose) {
      this.pose = pose;
      this.sprite.setTexture(`deco-${pose}`);
    }
    const target = this.dir === "s" && speed > 40 ? this.facing * 4 : 0;
    this.lean += (target - this.lean) * Math.min(1, dt * 10);
    this.sync(time);
  }

  sync(time: number) {
    const idle = this.pose.startsWith("idle");
    const breathe = idle && !this.reduced ? 1 + Math.sin(time / 300) * 0.015 : 1;
    const hop = this.pose.startsWith("walk") && !this.reduced ? Math.abs(Math.sin((this.clock / 92) * Math.PI)) * 3 : 0;
    const jump = this.cheering && !this.reduced ? Math.abs(Math.sin(time / 180)) * 26 : 0;
    this.sprite
      .setPosition(this.x, this.y - hop - jump)
      .setScale(BASE, BASE * breathe)
      .setFlipX(this.facing < 0 && this.dir === "s")
      .setAngle(this.reduced ? 0 : this.lean)
      .setDepth(this.y);
    this.shadow.setPosition(this.x, this.y + 2).setDepth(this.y - 1).setScale((110 / 128) * (1 - jump / 120), (30 / 128) * (1 - jump / 120));
  }

  get moving() {
    return Math.hypot(this.vx, this.vy) > 40;
  }
}
