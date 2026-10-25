import * as Phaser from "phaser";
import { ACCEL, HIT, HP, KID_INFO, KID_SCALE, PILLOW, PILLOW_ANCHORS, SPRITE_ORIGIN_Y, STATS, type Dir, type KidId, type KidStats, type Pose } from "../config";
import type { PajamaSfx } from "../sounds";
import { KID_RES } from "./BootScene";

export type FighterFx = {
  sfx: (name: PajamaSfx, volume?: number) => void;
  dust: (x: number, y: number, dir: number) => void;
  release: (f: Fighter, angle: number) => void;
  regen: (f: Fighter) => void;
};

const BASE = KID_SCALE / KID_RES;
const HELD = 0.62;

export class Fighter {
  readonly sprite: Phaser.GameObjects.Image;
  readonly held: Phaser.GameObjects.Image;
  readonly shadow: Phaser.GameObjects.Image;
  readonly ring: Phaser.GameObjects.Graphics;
  readonly stats: KidStats;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  facing = 1;
  hp = HP;
  alive = true;
  hits = 0;
  throws = 0;
  kos = 0;
  hurtBy: Fighter | null = null;
  lastHurtAt = -99999;
  stunUntil = 0;
  invulnUntil = 0;
  readyAt = 0;
  regenScale = 1;
  koAt = 0;
  private windupUntil = 0;
  private aim = 0;
  private throwPoseUntil = 0;
  private regenAt = 0;
  private pose: Pose = "idle-f";
  dir: Dir = "f";
  private throwDir: Dir = "s";
  private runClock = 0;
  private lift = 0;
  private wasReady = true;
  private locked: Pose | null = null;
  private squash = 1;
  private lean = 0;
  private prevVx = 0;
  private windupMs: number = PILLOW.windup;

  constructor(
    private scene: Phaser.Scene,
    readonly kid: KidId,
    readonly isPlayer: boolean,
    x: number,
    y: number,
    private fx: FighterFx,
    private reduced: boolean,
  ) {
    this.stats = STATS[kid];
    this.x = x;
    this.y = y;
    this.shadow = scene.add.image(x, y, "blob").setDisplaySize(112, 32).setAlpha(0.7).setDepth(30);
    this.ring = scene.add.graphics().setDepth(31);
    this.drawRing();
    this.sprite = scene.add.image(x, y, `kid-${kid}-idle-f`).setOrigin(0.5, SPRITE_ORIGIN_Y).setScale(BASE);
    this.held = scene.add.image(x, y, "pillow").setScale(HELD / 1.25).setTint(KID_INFO[kid].tint);
  }

  private drawRing() {
    const g = this.ring;
    g.clear();
    const color = this.isPlayer ? 0xffc83d : KID_INFO[this.kid].color;
    g.lineStyle(this.isPlayer ? 7 : 6, 0x1d1830, this.isPlayer ? 0.9 : 0.7);
    g.strokeEllipse(0, 0, this.isPlayer ? 112 : 100, this.isPlayer ? 40 : 34);
    g.lineStyle(this.isPlayer ? 4 : 3, color, 1);
    g.strokeEllipse(0, 0, this.isPlayer ? 112 : 100, this.isPlayer ? 40 : 34);
  }

  get windingUp() {
    return this.windupUntil > 0;
  }

  get speed() {
    return this.stats.speed;
  }

  canThrow(t: number) {
    return this.alive && t >= this.readyAt && !this.windupUntil && t >= this.stunUntil;
  }

  requestThrow(t: number, angle: number, windup: number = PILLOW.windup) {
    if (!this.canThrow(t)) return false;
    this.windupMs = windup;
    this.windupUntil = t + windup;
    this.aim = angle;
    const cx = Math.cos(angle);
    const sy = Math.sin(angle);
    if (Math.abs(cx) >= Math.abs(sy) * 0.85) this.throwDir = "s";
    else this.throwDir = sy > 0 ? "f" : "k";
    if (Math.abs(cx) > 0.15) this.facing = cx > 0 ? 1 : -1;
    this.setPose(`windup-${this.throwDir}`);
    if (!this.reduced) this.scene.tweens.add({ targets: this.held, scale: { from: (HELD / 1.25) * 1.18, to: HELD / 1.25 }, duration: windup, ease: "Quad.easeOut" });
    return true;
  }

  hurt(t: number, fromX: number, fromY: number, dirX: number, dirY: number, by: Fighter | null) {
    if (!this.alive || t < this.invulnUntil) return false;
    this.hp -= 1;
    this.lastHurtAt = t;
    this.regenAt = t + this.stats.regenDelay * this.regenScale;
    this.hurtBy = by;
    this.windupUntil = 0;
    this.stunUntil = t + HIT.stun;
    this.invulnUntil = t + (this.isPlayer ? HIT.invulnPlayer : HIT.invuln);
    const len = Math.hypot(dirX, dirY) || 1;
    this.vx = (dirX / len) * HIT.knock;
    this.vy = (dirY / len) * HIT.knock * 0.7;
    if (Math.abs(dirX) > 0.2) this.facing = dirX > 0 ? -1 : 1;
    this.setPose("hurt");
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.sprite.active && this.sprite.clearTint());
    if (!this.reduced) {
      this.scene.tweens.killTweensOf(this.sprite);
      this.scene.tweens.killTweensOf(this);
      this.sprite.setAngle(-this.facing * 14);
      this.scene.tweens.add({ targets: this.sprite, angle: 0, duration: 380, ease: "Back.easeOut" });
      this.squash = 1.2;
      this.scene.tweens.add({ targets: this, squash: 1, duration: 300, ease: "Elastic.easeOut", easeParams: [1.1, 0.4] });
      if (this.hp > 0) this.scene.tweens.add({ targets: this, lift: 16, duration: 110, yoyo: true, ease: "Quad.easeOut" });
    }
    void fromX;
    void fromY;
    if (this.hp <= 0) this.knockOut(t, dirX);
    return true;
  }

  private knockOut(t: number, dirX: number) {
    this.alive = false;
    this.koAt = t;
    this.windupUntil = 0;
    this.locked = "hurt";
    this.held.setVisible(false);
    this.ring.setVisible(false);
    const dir = Math.sign(dirX) || -this.facing;
    this.vx = 0;
    this.vy = 0;
    const scene = this.scene;
    const land = () => {
      this.locked = "ko";
      this.setPose("ko", true);
      this.sprite.setAngle(0);
      this.fx.dust(this.x, this.y, 0);
      this.fx.sfx("plop", 0.8);
      if (!this.reduced) {
        this.sprite.setScale(BASE * 1.18, BASE * 0.82);
        scene.tweens.add({ targets: this.sprite, scaleX: BASE, scaleY: BASE, duration: 260, ease: "Back.easeOut" });
      }
    };
    if (this.reduced) {
      land();
      return;
    }
    const dx = Phaser.Math.Clamp(this.x + dir * 140, 160, 1760) - this.x;
    scene.tweens.add({ targets: this, x: this.x + dx, duration: 620, ease: "Quad.easeOut" });
    scene.tweens.add({ targets: this, lift: 150, duration: 300, ease: "Quad.easeOut", yoyo: true, onComplete: land });
    scene.tweens.add({ targets: this.sprite, angle: dir * 360, duration: 600, ease: "Quad.easeOut" });
  }

  cheer() {
    this.locked = "cheer";
    this.windupUntil = 0;
    this.setPose("cheer", true);
    if (this.reduced) return;
    this.scene.tweens.add({ targets: this, lift: 46, duration: 230, yoyo: true, repeat: -1, ease: "Quad.easeOut" });
  }

  stopCheer() {
    this.scene.tweens.killTweensOf(this);
    this.lift = 0;
  }

  update(t: number, dt: number, mx: number, my: number) {
    if (!this.alive) {
      this.held.setVisible(false);
      return;
    }
    if (this.locked) {
      this.vx = 0;
      this.vy = 0;
      return;
    }
    if (this.windupUntil && t >= this.windupUntil) {
      this.windupUntil = 0;
      this.readyAt = t + this.stats.cooldown;
      this.throwPoseUntil = t + 170;
      this.throws += 1;
      this.wasReady = false;
      this.fx.release(this, this.aim);
      this.fx.sfx("throw", this.isPlayer ? 0.9 : 0.55);
      if (!this.reduced) {
        this.scene.tweens.killTweensOf(this);
        this.squash = 0.88;
        this.scene.tweens.add({ targets: this, squash: 1, duration: 220, ease: "Back.easeOut" });
      }
    }
    if (t >= this.stunUntil) {
      const len = Math.hypot(mx, my);
      const k = this.windupUntil ? 0.4 : t < this.throwPoseUntil ? 0.7 : 1;
      const tx = len > 0.01 ? (mx / Math.max(1, len)) * this.speed * k : 0;
      const ty = len > 0.01 ? (my / Math.max(1, len)) * this.speed * k * 0.86 : 0;
      const step = ACCEL * dt;
      this.vx += Phaser.Math.Clamp(tx - this.vx, -step, step);
      this.vy += Phaser.Math.Clamp(ty - this.vy, -step, step);
      if (!this.windupUntil && t >= this.throwPoseUntil && Math.abs(this.vx) > 60) this.facing = this.vx > 0 ? 1 : -1;
      if (Math.hypot(this.vx, this.vy) > 50) {
        const ax = Math.abs(this.vx);
        const ay = Math.abs(this.vy) / 0.86;
        if (this.dir === "s") {
          if (ay > ax * 1.35) this.dir = this.vy > 0 ? "f" : "k";
        } else if (ax > ay * 1.35) this.dir = "s";
        else this.dir = this.vy > 0 ? "f" : "k";
      }
    } else {
      const f = Math.exp(-dt * 7);
      this.vx *= f;
      this.vy *= f;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.hp < HP && this.regenScale > 0 && t - this.lastHurtAt > this.stats.regenDelay * this.regenScale && t >= this.regenAt) {
      this.hp += 1;
      this.regenAt = t + this.stats.regenEvery * this.regenScale;
      this.fx.regen(this);
    }

    const ready = t >= this.readyAt;
    if (ready && !this.wasReady) {
      this.wasReady = true;
      if (!this.reduced) {
        this.held.setScale(0);
        this.scene.tweens.add({ targets: this.held, scale: HELD / 1.25, duration: 170, ease: "Back.easeOut" });
      }
      if (this.isPlayer) this.fx.sfx("ready", 0.6);
    }

    if (this.windupUntil && !this.reduced) this.squash += (1.07 - this.squash) * Math.min(1, dt * 30);
    const speed = Math.hypot(this.vx, this.vy);
    let pose: Pose = `idle-${this.dir}`;
    if (t < this.stunUntil) pose = "hurt";
    else if (this.windupUntil) pose = `windup-${this.throwDir}`;
    else if (t < this.throwPoseUntil) pose = `throw-${this.throwDir}`;
    else if (speed > 50) {
      this.runClock += speed * dt;
      const step = (["run-a", "run-b", "run-c", "run-d"] as const)[Math.floor(this.runClock / 34) % 4];
      pose = `${step}-${this.dir}`;
      if (pose !== this.pose && this.pose.startsWith("run") && (step === "run-a" || step === "run-c")) {
        if (this.isPlayer) this.fx.sfx("step", 0.5);
        if (this.isPlayer || Math.random() < 0.5) this.fx.dust(this.x - this.facing * 18, this.y, this.dir === "s" ? this.facing : 0);
      }
    }
    const ax = (this.vx - this.prevVx) / Math.max(dt, 0.001);
    this.prevVx = this.vx;
    const target = pose.startsWith("run") || pose.startsWith("idle") ? Phaser.Math.Clamp(ax / 9000, -1, 1) * 9 + (pose.startsWith("run") && this.dir === "s" ? this.facing * 5 : 0) : 0;
    this.lean += (target - this.lean) * Math.min(1, dt * 10);
    this.setPose(pose);
  }

  private setPose(p: Pose, force = false) {
    if (this.locked && !force && p !== this.locked) return;
    if (this.pose === p) return;
    this.pose = p;
    this.sprite.setTexture(`kid-${this.kid}-${p}`);
  }

  sync(t: number) {
    const idle = this.pose.startsWith("idle");
    const running = this.pose.startsWith("run");
    const bob = idle && this.alive && !this.reduced ? 1 + Math.sin(t / 240 + this.x) * 0.018 : 1;
    const sx = this.squash;
    const sy = (2 - sx) * bob;
    if (this.alive && !this.locked) this.sprite.setScale(BASE * sx, BASE * sy);
    this.sprite.setFlipX(this.facing < 0);
    const hop = running && !this.reduced ? Math.abs(Math.sin((this.runClock / 68) * Math.PI)) * 3 : 0;
    if (this.alive && !this.locked && !this.scene.tweens.isTweening(this.sprite)) this.sprite.setAngle(this.reduced ? 0 : this.lean);
    this.sprite.setPosition(this.x, this.y - this.lift - hop).setDepth(this.y);
    this.sprite.setAlpha(this.alive && t < this.invulnUntil && t > this.stunUntil ? (Math.floor(t / 70) % 2 ? 0.55 : 1) : 1);
    const lift = Phaser.Math.Clamp(this.lift / 160, 0, 1);
    this.shadow.setPosition(this.x, this.y + 2).setDisplaySize(112 * (1 - lift * 0.45), 32 * (1 - lift * 0.3)).setAlpha(0.66 - lift * 0.3);
    this.ring.setPosition(this.x, this.y + 2);
    const anchor = PILLOW_ANCHORS[this.pose];
    const show = this.alive && !!anchor && (t >= this.readyAt || this.pose.startsWith("windup")) && this.pose !== "hurt";
    this.held.setVisible(show);
    if (show && anchor) {
      const k = BASE * KID_RES;
      this.held
        .setPosition(this.x + anchor.x * k * this.facing, this.y - this.lift - hop + anchor.y * k)
        .setAngle(anchor.angle * this.facing)
        .setFlipX(this.facing < 0)
        .setDepth(this.y + (anchor.layer === "front" ? 0.5 : -0.5));
    }
  }

  hand() {
    const k = BASE * KID_RES;
    return { x: this.x + this.facing * 40 * k, y: this.y - 120 * k };
  }

  get top() {
    return this.y - 200 * KID_SCALE;
  }

  destroy() {
    this.sprite.destroy();
    this.held.destroy();
    this.shadow.destroy();
    this.ring.destroy();
  }
}
