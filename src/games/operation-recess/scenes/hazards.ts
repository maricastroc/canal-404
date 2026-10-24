import * as Phaser from "phaser";
import { FLOOR_Y, TILE } from "../config";
import type { LevelDef } from "../levels";
import type { StageApi } from "./enemies";
import { cx, cy } from "./world";

export class Ball {
  readonly img: Phaser.GameObjects.Image;
  alive = true;
  private age = 0;
  private vx = -400;
  private kicked = false;
  private vy = 0;

  constructor(
    private api: StageApi,
    x: number,
  ) {
    this.img = api.scene.add.image(x, FLOOR_Y - 140, "ball").setDepth(17);
    this.vy = -500;
  }

  update(dt: number) {
    this.age += dt;
    this.vy += 2600 * dt;
    this.img.y += this.vy * dt;
    this.img.x += this.vx * dt;
    if (this.img.y > FLOOR_Y - 36 && this.vy > 0 && !this.kicked) {
      this.img.y = FLOOR_Y - 36;
      this.vy = -620;
      this.api.sfx("boing", 0.35);
    }
    this.img.angle += (this.vx / 36) * dt * 57;
    if (this.age > 6 || this.img.y > 1300) this.kill();
  }

  kick(dir: number) {
    this.kicked = true;
    this.vx = dir * 900;
    this.vy = -900;
    this.api.sfx("boing", 0.8);
  }

  get harmful() {
    return this.alive && !this.kicked;
  }

  box() {
    return new Phaser.Geom.Rectangle(this.img.x - 28, this.img.y - 28, 56, 56);
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    this.img.destroy();
  }
}

export class BallSpawner {
  private lt = 0;
  private nextAt: number;
  private x: number;
  awake = false;

  constructor(
    private api: StageApi,
    private def: NonNullable<LevelDef["balls"]>[number],
    private spawn: (b: Ball) => void,
  ) {
    this.x = cx(def.col) + TILE;
    this.nextAt = def.offset;
  }

  update(dt: number, heroX: number) {
    if (!this.awake) {
      if (heroX > this.x - this.def.wake && heroX < this.x) this.awake = true;
      return;
    }
    if (heroX > this.x + 200) return;
    this.lt += dt * 1000;
    if (this.lt >= this.nextAt) {
      this.nextAt += this.def.every;
      this.api.warn(this.x, FLOOR_Y - 260, 480);
      this.api.sfx("alert", 0.6);
      this.api.scene.time.delayedCall(480, () => this.spawn(new Ball(this.api, this.x - 30)));
    }
  }
}

export class Cart {
  readonly img: Phaser.Physics.Arcade.Image;
  private lt = 0;
  private minX: number;
  private maxX: number;
  private dir = 1;
  private holdUntil = 800;

  constructor(
    scene: Phaser.Scene,
    private def: NonNullable<LevelDef["carts"]>[number],
  ) {
    const w = 3 * TILE;
    this.minX = cx(def.from) + w / 2;
    this.maxX = cx(def.to) + w / 2;
    this.img = scene.physics.add.image(this.minX, FLOOR_Y + 30, "cart").setDepth(7).setDisplaySize(w, 110);
    const body = this.img.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(this.img.width - 20, 40).setOffset(10, 8);
    this.img.setY(FLOOR_Y - 8 + 55);
  }

  update(dt: number) {
    this.lt += dt * 1000;
    const body = this.img.body as Phaser.Physics.Arcade.Body;
    if (this.lt < this.holdUntil) {
      body.setVelocityX(0);
      return;
    }
    if ((this.dir > 0 && this.img.x >= this.maxX) || (this.dir < 0 && this.img.x <= this.minX)) {
      this.dir = -this.dir;
      this.holdUntil = this.lt + 800;
      body.setVelocityX(0);
      return;
    }
    body.setVelocityX(this.dir * this.def.speed);
  }
}

export class Item {
  readonly img: Phaser.GameObjects.Image;
  taken = false;
  private baseY: number;

  constructor(
    scene: Phaser.Scene,
    readonly kind: "snack" | "sticker",
    col: number,
    row: number,
    private reduced: boolean,
  ) {
    this.baseY = cy(row) + TILE / 2;
    this.img = scene.add.image(cx(col) + TILE / 2, this.baseY, kind).setDepth(12);
  }

  update(t: number) {
    if (this.taken || this.reduced) return;
    this.img.y = this.baseY + Math.sin(t / 260 + this.img.x) * 8;
    if (this.kind === "sticker") this.img.angle = Math.sin(t / 400 + this.img.x) * 12;
  }

  near(x: number, top: number, bottom: number) {
    return !this.taken && Math.abs(x - this.img.x) < 60 && this.img.y > top - 30 && this.img.y < bottom + 20;
  }

  take(scene: Phaser.Scene) {
    this.taken = true;
    scene.tweens.add({ targets: this.img, y: this.img.y - 60, scale: 1.5, alpha: 0, duration: 280, onComplete: () => this.img.destroy() });
  }
}

export class Bell {
  readonly img: Phaser.GameObjects.Image;
  reached = false;
  readonly x: number;

  constructor(scene: Phaser.Scene, col: number) {
    this.x = cx(col) + TILE / 2;
    this.img = scene.add.image(this.x, FLOOR_Y, "bell").setOrigin(0.5, 1).setDepth(9);
  }

  ring(scene: Phaser.Scene, reduced: boolean) {
    this.reached = true;
    this.img.setTexture("bell-on");
    if (!reduced) scene.tweens.add({ targets: this.img, angle: { from: -8, to: 8 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => this.img.setAngle(0) });
  }
}
