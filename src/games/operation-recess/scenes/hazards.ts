import * as Phaser from "phaser";
import type { StickerId } from "../album";
import { FLOOR_Y, TILE } from "../config";
import type { LevelDef } from "../levels";
import { INK_HEX } from "../../kit/ui";
import type { StageApi } from "./enemies";
import { cx, cy } from "./world";

const STICKER_SIZE = 74;

function makeOwnedBadge(scene: Phaser.Scene) {
  if (scene.textures.exists("sticker-owned")) return;
  const g = scene.make.graphics({}, false);
  g.fillStyle(INK_HEX, 1);
  g.fillCircle(17, 17, 17);
  g.fillStyle(0x93cf4c, 1);
  g.fillCircle(17, 17, 13);
  g.lineStyle(5, INK_HEX, 1);
  g.beginPath();
  g.moveTo(10, 17);
  g.lineTo(15, 23);
  g.lineTo(25, 11);
  g.strokePath();
  g.generateTexture("sticker-owned", 34, 34);
  g.destroy();
}

const BALL_R = 38;

export class Ball {
  readonly img: Phaser.GameObjects.Container;
  alive = true;
  private spin: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private age = 0;
  private vx = -400;
  private kicked = false;
  private vy = 0;
  private squash = 0;

  constructor(
    private api: StageApi,
    x: number,
  ) {
    const scene = api.scene;
    this.spin = scene.add.image(0, 0, "ball");
    this.img = scene.add.container(x, FLOOR_Y - 140, [this.spin]).setDepth(17);
    this.shadow = scene.add.image(x, FLOOR_Y + 3, "blob").setDepth(5.4).setAlpha(0);
    this.vy = -500;
  }

  update(dt: number) {
    this.age += dt;
    this.vy += 2600 * dt;
    this.img.y += this.vy * dt;
    this.img.x += this.vx * dt;
    if (this.img.y > FLOOR_Y - 36 && this.vy > 0 && !this.kicked) {
      const hard = Math.min(1, this.vy / 900);
      this.img.y = FLOOR_Y - 36;
      this.vy = -620;
      this.squash = 0.6 + 0.4 * hard;
      this.api.sfx("boing", 0.35);
      if (!this.api.reduced) for (const d of [-1, 1]) this.api.dust(this.img.x + d * 22, FLOOR_Y, -d);
    }
    this.spin.angle += (this.vx / 36) * dt * 57;
    this.shape(dt);
    if (this.age > 6 || this.img.y > 1300) this.kill();
  }

  private shape(dt: number) {
    const height = Phaser.Math.Clamp((FLOOR_Y - 36 - this.img.y) / 300, 0, 1);
    this.shadow.setPosition(this.img.x, FLOOR_Y + 3).setDisplaySize(84 * (1 - height * 0.45), 18 * (1 - height * 0.3)).setAlpha(this.kicked ? Math.max(0, 0.7 - this.age) : 0.75 - height * 0.45);
    if (this.api.reduced) return;
    this.squash = Math.max(0, this.squash - dt / 0.16);
    const s = this.squash;
    const stretch = Math.min(0.14, Math.abs(this.vy) / 6500) * (1 - s);
    const sy = 1 - 0.32 * s + stretch;
    const sx = 1 + 0.26 * s - stretch * 0.6;
    this.img.setScale(sx, sy);
    this.spin.setY((BALL_R * (1 - sy)) / sy);
  }

  kick(dir: number) {
    this.kicked = true;
    this.vx = dir * 900;
    this.vy = -900;
    this.squash = 0;
    this.img.setScale(1);
    this.spin.setY(0);
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
    this.shadow.destroy();
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
    private box: Phaser.GameObjects.Image | null = null,
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
      this.rattle();
      this.api.scene.time.delayedCall(480, () => {
        this.pop();
        this.spawn(new Ball(this.api, this.x - 30));
      });
    }
  }

  private rattle() {
    const box = this.box;
    if (!box || this.api.reduced) return;
    const base = (box.getData("baseX") as number | undefined) ?? box.x;
    box.setData("baseX", base);
    this.api.scene.tweens.killTweensOf(box);
    this.api.scene.tweens.add({ targets: box, x: { from: base + 3, to: base - 3 }, duration: 50, yoyo: true, repeat: 4, onComplete: () => box.setX(base) });
  }

  private pop() {
    const box = this.box;
    if (!box) return;
    this.api.burst(this.x - 30, box.y - box.displayHeight + 6, 3, "dust");
    if (this.api.reduced) return;
    const sy = (box.getData("baseSy") as number | undefined) ?? box.scaleY;
    box.setData("baseSy", sy);
    box.setScale(box.scaleX, sy * 0.92);
    this.api.scene.tweens.add({ targets: box, scaleY: sy, duration: 260, ease: "Back.easeOut" });
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
  private badge: Phaser.GameObjects.Image | null = null;

  constructor(
    scene: Phaser.Scene,
    readonly kind: "snack" | "sticker",
    col: number,
    row: number,
    private reduced: boolean,
    readonly sticker?: StickerId,
    readonly owned = false,
  ) {
    this.baseY = cy(row) + TILE / 2;
    this.img = scene.add.image(cx(col) + TILE / 2, this.baseY, sticker ? `sticker-${sticker}` : kind).setDepth(12);
    if (!sticker) return;
    this.img.setDisplaySize(STICKER_SIZE, STICKER_SIZE);
    if (!owned) return;
    this.img.setAlpha(0.5);
    makeOwnedBadge(scene);
    this.badge = scene.add.image(this.img.x + 24, this.img.y - 24, "sticker-owned").setDepth(12.1);
  }

  update(t: number) {
    if (this.taken || this.reduced) return;
    this.img.y = this.baseY + Math.sin(t / 260 + this.img.x) * 8;
    if (this.kind === "sticker") this.img.angle = Math.sin(t / 400 + this.img.x) * 12;
    this.badge?.setPosition(this.img.x + 24, this.img.y - 24);
  }

  near(x: number, top: number, bottom: number) {
    return !this.taken && Math.abs(x - this.img.x) < 60 && this.img.y > top - 30 && this.img.y < bottom + 20;
  }

  take(scene: Phaser.Scene) {
    this.taken = true;
    this.badge?.destroy();
    scene.tweens.add({ targets: this.img, y: this.img.y - 60, scaleX: this.img.scaleX * 1.5, scaleY: this.img.scaleY * 1.5, alpha: 0, duration: 280, onComplete: () => this.img.destroy() });
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
