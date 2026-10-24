import * as Phaser from "phaser";
import {
  ACCEL,
  AIR_ACCEL,
  ATTACK,
  BODY_H,
  BODY_W,
  BUFFER_MS,
  COYOTE_MS,
  DECEL,
  FALL_MULT,
  GRAVITY,
  HERO_SCALE,
  JUMP_CUT,
  JUMP_V,
  MAX_FALL,
  RUN,
  SLIP_ACCEL,
  STUN_MS,
} from "../config";

export type HeroInput = { left: boolean; right: boolean; jumpHeld: boolean };
type Pose = "idle" | "run-a" | "run-b" | "jump" | "fall" | "attack-a" | "attack-b" | "hurt" | "cheer";

export type HeroFx = {
  sfx: (name: "jump" | "land" | "swing" | "step", volume?: number) => void;
  dust: (x: number, y: number, dir: number) => void;
};

export class Hero {
  readonly rect: Phaser.GameObjects.Rectangle;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly sprite: Phaser.GameObjects.Image;
  private slash: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private groundY: number;
  facing = 1;
  attackId = 0;
  private attackAt = -9999;
  private jumpAt = -9999;
  private lastGround = -9999;
  private jumping = false;
  private wasGround = true;
  private airSince = 0;
  private stunUntil = 0;
  private pose: Pose = "idle";
  private runClock = 0;
  private locked: Pose | null = null;
  private reduced: boolean;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    feet: number,
    private fx: HeroFx,
  ) {
    this.reduced = (scene.registry.get("ctx") as { reducedMotion: boolean }).reducedMotion;
    this.rect = scene.add.rectangle(x, feet - BODY_H / 2, BODY_W, BODY_H, 0xffffff, 0);
    scene.physics.add.existing(this.rect);
    this.body = this.rect.body as Phaser.Physics.Arcade.Body;
    this.body.setMaxVelocity(RUN + 400, MAX_FALL);
    this.body.setCollideWorldBounds(true);
    this.sprite = scene.add.image(x, feet, "hero-idle").setOrigin(0.5, 1).setScale(HERO_SCALE).setDepth(20);
    this.slash = scene.add.image(x, feet, "slash").setDepth(21).setVisible(false).setScale(0.95);
    this.shadow = scene.add.image(x, feet + 2, "blob").setDepth(14).setDisplaySize(110, 26);
    this.groundY = feet;
  }

  dizzy() {
    this.locked = "hurt";
    this.setPose("hurt");
    if (this.reduced) return;
    this.scene.tweens.add({ targets: this.sprite, angle: { from: -12, to: 12 }, duration: 160, yoyo: true, repeat: 5, onComplete: () => this.sprite.setAngle(0) });
  }

  get grounded() {
    return this.body.blocked.down || this.body.touching.down;
  }

  get x() {
    return this.body.center.x;
  }

  get feet() {
    return this.body.bottom;
  }

  get stunned() {
    return this.time < this.stunUntil;
  }

  private time = 0;

  requestJump(t: number) {
    this.jumpAt = t;
  }

  requestAttack(t: number) {
    if (t - this.attackAt < ATTACK.cooldown || t < this.stunUntil) return false;
    this.attackAt = t;
    this.attackId += 1;
    this.fx.sfx("swing", 0.8);
    if (this.grounded && Math.abs(this.body.velocity.x) < RUN * 0.9) this.body.setVelocityX(this.body.velocity.x + this.facing * ATTACK.lunge);
    return true;
  }

  attacking(t: number) {
    return t - this.attackAt < ATTACK.cooldown - 40;
  }

  attackBox(t: number) {
    const since = t - this.attackAt;
    if (since < ATTACK.windup || since > ATTACK.windup + ATTACK.active) return null;
    const b = this.body;
    const x0 = this.facing > 0 ? b.center.x : b.center.x - ATTACK.reach;
    return new Phaser.Geom.Rectangle(x0, b.top - 30, ATTACK.reach, b.height + 10);
  }

  knock(fromX: number, t: number, kx: number, ky: number) {
    const dir = Math.sign(this.x - fromX) || -this.facing;
    this.body.setVelocity(dir * kx, -ky);
    this.stunUntil = t + STUN_MS;
    this.jumping = false;
    this.setPose("hurt");
  }

  bounce(v: number) {
    this.body.setVelocityY(-v);
    this.jumping = false;
  }

  cheer() {
    this.locked = "cheer";
    this.setPose("cheer");
  }

  update(t: number, dt: number, input: HeroInput, slippery: boolean, carry: number) {
    this.time = t;
    const b = this.body;
    const ground = this.grounded;
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (t >= this.stunUntil) {
      const vx = b.velocity.x;
      const target = dir * RUN * (this.attacking(t) && ground ? 0.55 : 1);
      let accel = !ground ? AIR_ACCEL : slippery ? SLIP_ACCEL : dir === 0 || Math.sign(target) !== Math.sign(vx) ? DECEL : ACCEL;
      if (slippery && ground) accel = SLIP_ACCEL;
      const step = accel * dt;
      b.setVelocityX(vx + Phaser.Math.Clamp(target - vx, -step, step));
      if (dir && !this.attacking(t)) this.facing = dir;
    }
    if (carry) this.rect.x += carry * dt;

    if (ground) {
      if (!this.wasGround && t - this.airSince > 120) {
        this.fx.sfx("land", 0.5);
        this.fx.dust(this.x, this.feet, 0);
        if (!this.reduced) {
          this.sprite.setScale(HERO_SCALE * 1.1, HERO_SCALE * 0.88);
          this.scene.tweens.add({ targets: this.sprite, scaleX: HERO_SCALE, scaleY: HERO_SCALE, duration: 160, ease: "Back.easeOut" });
        }
      }
      this.lastGround = t;
      this.jumping = false;
    } else if (this.wasGround) {
      this.airSince = t;
    }
    this.wasGround = ground;

    if (t - this.jumpAt < BUFFER_MS && t - this.lastGround < COYOTE_MS && t >= this.stunUntil) {
      this.jumpAt = -9999;
      this.lastGround = -9999;
      this.jumping = true;
      b.setVelocityY(-JUMP_V);
      this.airSince = t;
      this.wasGround = false;
      this.fx.sfx("jump", 0.6);
      this.fx.dust(this.x, this.feet, 0);
      if (!this.reduced) {
        this.sprite.setScale(HERO_SCALE * 0.88, HERO_SCALE * 1.12);
        this.scene.tweens.add({ targets: this.sprite, scaleX: HERO_SCALE, scaleY: HERO_SCALE, duration: 200, ease: "Back.easeOut" });
      }
    }
    if (this.jumping && b.velocity.y < 0 && !input.jumpHeld) {
      b.setVelocityY(b.velocity.y * JUMP_CUT);
      this.jumping = false;
    }
    b.setGravityY(b.velocity.y > 0 ? GRAVITY * (FALL_MULT - 1) : 0);

    this.animate(t, dt, ground);
  }

  private setPose(p: Pose) {
    if (this.pose === p) return;
    this.pose = p;
    this.sprite.setTexture(`hero-${p}`);
  }

  private animate(t: number, dt: number, ground: boolean) {
    if (this.locked) return;
    const since = t - this.attackAt;
    if (t < this.stunUntil) this.setPose("hurt");
    else if (since < ATTACK.windup) this.setPose("attack-a");
    else if (since < ATTACK.windup + ATTACK.active + 70) this.setPose("attack-b");
    else if (!ground) this.setPose(this.body.velocity.y < 0 ? "jump" : "fall");
    else if (Math.abs(this.body.velocity.x) > 50) {
      this.runClock += dt * Math.abs(this.body.velocity.x);
      const frame = Math.floor(this.runClock / 70) % 2 === 0 ? "run-a" : "run-b";
      if (frame !== this.pose && (this.pose === "run-a" || this.pose === "run-b")) this.fx.sfx("step", 0.35);
      this.setPose(frame);
    } else this.setPose("idle");
    const active = since >= ATTACK.windup && since < ATTACK.windup + ATTACK.active + 40;
    this.slash.setVisible(active);
    if (active) {
      const k = (since - ATTACK.windup) / (ATTACK.active + 40);
      this.slash.setFlipX(this.facing < 0).setAlpha(1 - k * 0.6);
    }
  }

  sync(t: number, invulnUntil: number) {
    const b = this.body;
    this.sprite.setPosition(b.center.x, b.bottom + 2).setFlipX(this.facing < 0);
    this.slash.setPosition(b.center.x + this.facing * 96, b.center.y - 20);
    if (t < invulnUntil && !this.locked) this.sprite.setAlpha(Math.floor(t / 70) % 2 ? 0.35 : 1);
    else this.sprite.setAlpha(1);
    if (this.grounded) this.groundY = b.bottom;
    const lift = Phaser.Math.Clamp((this.groundY - b.bottom) / 320, 0, 1);
    this.shadow.setPosition(b.center.x, this.groundY + 3).setDisplaySize(110 * (1 - lift * 0.5), 26 * (1 - lift * 0.4)).setAlpha(1 - lift * 0.6);
    this.shadow.setVisible(b.bottom < this.groundY + 40);
  }
}
