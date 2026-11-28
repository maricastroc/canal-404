import * as Phaser from "phaser";
import type { RecessCopy } from "../copy";
import type { EnemyKind, EnemyStyle } from "../levels";
import type { RecessSfx } from "../sounds";
import type { RoomEvent } from "./scenery";

export type HeroView = { x: number; feet: number; top: number; grounded: boolean; vx: number };
export type Expression = "watch" | "spot" | "lost";
type Anchor = () => { x: number; y: number } | null;

export type StageApi = {
  scene: Phaser.Scene;
  reduced: boolean;
  words: RecessCopy["words"];
  barks: RecessCopy["barks"];
  sfx: (name: RecessSfx, volume?: number) => void;
  warn: (x: number, y: number, ms: number) => Phaser.GameObjects.Text;
  word: (text: string, x: number, y: number, color: string, size?: number) => void;
  burst: (x: number, y: number, count: number, tex?: string) => void;
  dust: (x: number, y: number, dir: number) => void;
  spawnWave: (x: number, y: number, dir: number, big: boolean) => void;
  groundAt: (x: number) => boolean;
  quake: (power: number) => void;
  room: (event: RoomEvent, dir?: number) => void;
  busy: (self: Enemy) => boolean;
  clang: (x: number, y: number) => void;
  surface: (x: number, y: number) => number | null;
  impact: (x: number, power: number) => void;
  say: (text: string, anchor: Anchor) => boolean;
  orderClear: (self: Enemy) => boolean;
  ordered: (self: Enemy) => void;
  summon: (x: number, style: EnemyStyle) => void;
};

export type HitResult = "hit" | "block" | "kill" | "dodge" | null;

const MON_SCALE = 0.9;
const OVERHEAD = { x: 120, y: 160 };
const TURN_SLACK = 24;
const FACE_POSES = new Set(["walk-a", "walk-b", "point", "cross"]);
const HEAD_TOP: Record<string, number> = { common: 3, guard: 14, runner: 3 };
const STYLE_ART: Record<EnemyStyle, string> = { patrol: "common", mixed: "common", guard: "guard", rush: "runner" };
const SAY_EVERY = 3200;
const CALM = new Set(["patrol", "wait", "watch", "lost", "home"]);
const LOST_MS = 900;
const CONTACT = { half: 24, top: 50 };
const DAZE = { ms: 950, again: 2400 };
const DASH = { min: 280, max: 560, aim: 420, speed: 760, ms: 620, recover: 760, again: 2600 };
const GUARD_BACK_MS = 3200;
const GUARD_OPEN = new Set(["windup", "attack", "recover", "back", "dazed", "patrol", "lost", "home"]);
const COUNTER_MS = 260;
const COMMON_TOUCHY = new Set(["alert", "chase", "windup", "attack", "aim", "dash"]);
const SHIELD_TOUCHY = new Set(["guard", "windup", "bash", "rush"]);
let slot = 0;
const turns = new WeakMap<readonly string[], number>();

function pick(pool: readonly string[]) {
  const turn = (turns.get(pool) ?? 0) + 1;
  turns.set(pool, turn);
  return pool[turn % pool.length];
}

export abstract class Enemy {
  readonly rect: Phaser.GameObjects.Rectangle;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private face: Phaser.GameObjects.Image | null = null;
  protected mood: Expression | null = null;
  private flashFace: Expression | null = null;
  private flashUntil = 0;
  private saidAt = -1e9;
  facing = -1;
  dead = false;
  protected state = "idle";
  protected until = 0;
  protected hurtUntil = 0;
  protected lastHit = -1;
  protected walkClock = 0;
  protected spawnX: number;
  protected t = 0;
  protected mirrored = false;
  private pose = "walk-a";
  protected telegraphUntil = 0;
  protected knockback = { x: 380, y: 320 };
  lift = 0;
  protected alarm: Phaser.GameObjects.Text | null = null;
  private flashing = false;
  private stompReady = 0;
  summoned = false;

  constructor(
    protected api: StageApi,
    readonly kind: EnemyKind,
    x: number,
    feet: number,
    public hp: number,
    protected art: string = kind,
  ) {
    const scene = api.scene;
    this.spawnX = x;
    this.rect = scene.add.rectangle(x, feet - 95, 70, 190, 0xffffff, 0);
    scene.physics.add.existing(this.rect);
    this.body = this.rect.body as Phaser.Physics.Arcade.Body;
    this.body.setMaxVelocity(700, 1500);
    const depth = 15 + (slot++ % 400) * 0.002;
    this.sprite = scene.add.image(x, feet, `mon-${art}-walk-a`).setOrigin(0.5, 1).setScale(MON_SCALE).setDepth(depth);
    this.shadow = scene.add.image(x, feet + 2, "blob").setDepth(14).setDisplaySize(150, 30);
    this.face = scene.add.image(x, feet, kind === "shield" ? "mon-shield-face-watch-a" : `mon-${art}-face-watch`).setOrigin(0.5, 1).setScale(MON_SCALE).setDepth(depth + 0.001).setVisible(false);
  }

  protected express(face: Expression, ms: number) {
    this.flashFace = face;
    this.flashUntil = this.t + ms;
  }

  protected bark(pool: readonly string[], force = false) {
    if (!force && this.t - this.saidAt < SAY_EVERY) return;
    if (this.api.say(pick(pool), () => (this.dead ? null : { x: this.x, y: this.headTop + 12 }))) this.saidAt = this.t;
  }

  private engagedBefore = false;
  private engagedAt = -1e9;
  private startledAt = -1e9;

  startle(fromX: number) {
    if (this.dead || !CALM.has(this.state) || this.t - this.startledAt < 2500) return false;
    this.startledAt = this.t;
    if (this.state !== "patrol") this.facing = fromX >= this.x ? 1 : -1;
    this.express("spot", 700);
    this.hop(20);
    this.bark(this.api.barks.fallen, true);
    return true;
  }

  protected track(t: number, engaged: boolean, h: HeroView, pool: readonly string[]) {
    if (engaged && !this.engagedBefore) {
      if (t - this.engagedAt > 2500) {
        this.express("spot", 520);
        this.hop(14);
        this.bark(pool);
      }
      this.engagedAt = t;
      this.mood = null;
    } else if (!engaged && this.engagedBefore) {
      this.mood = "watch";
      if (h.feet < this.feet - 140 && Math.abs(h.x - this.x) < 860) {
        this.express("lost", 900);
        this.bark(this.api.barks.lost);
      }
    }
    this.engagedBefore = engaged;
  }

  protected hop(px: number) {
    if (this.api.reduced) return;
    this.api.scene.tweens.add({ targets: this, lift: px, duration: 110, yoyo: true, ease: "Quad.easeOut" });
  }

  protected telegraph(ms: number) {
    this.telegraphUntil = this.t + ms;
  }

  taunt() {
    if (this.dead) return;
    const scene = this.api.scene;
    this.tex(this.kind === "whistle" ? "blow" : this.kind === "shield" ? "block" : "windup");
    this.bark(this.api.barks.caught, true);
    this.api.sfx("whistle", 0.6);
    if (!this.api.reduced) scene.tweens.add({ targets: this, lift: 40, duration: 160, yoyo: true, repeat: 2, ease: "Quad.easeOut" });
  }

  protected onHurt(dir: number, t: number) {
    void dir;
    void t;
  }

  get x() {
    return this.body.center.x;
  }

  get feet() {
    return this.body.bottom;
  }

  get grounded() {
    return this.body.blocked.down || this.body.touching.down;
  }

  get headTop() {
    return this.body.bottom + 2 - this.lift - (this.sprite.height - (HEAD_TOP[this.art] ?? 4)) * MON_SCALE;
  }

  bounds() {
    const b = this.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  protected tex(name: string) {
    this.pose = name;
    this.applyTex();
  }

  private applyTex() {
    const key = `mon-${this.art}-${this.pose}${this.mirrored && this.facing < 0 ? "-l" : ""}`;
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key);
  }

  protected faceHero(h: HeroView, slack = 0) {
    const dx = h.x - this.x;
    if (Math.abs(dx) > slack) this.facing = dx >= 0 ? 1 : -1;
  }

  protected overhead(h: HeroView) {
    return Math.abs(h.x - this.x) < OVERHEAD.x && this.feet - h.feet >= OVERHEAD.y;
  }

  protected hold() {
    this.body.setVelocityX(0);
    this.tex("walk-a");
  }

  protected walk(speed: number, dt: number) {
    const ahead = this.x + this.facing * 50;
    if (!this.api.groundAt(ahead) || (this.facing > 0 ? this.body.blocked.right : this.body.blocked.left)) {
      this.body.setVelocityX(0);
      return false;
    }
    this.body.setVelocityX(this.facing * speed);
    this.walkClock += dt * speed;
    this.tex(Math.floor(this.walkClock / 60) % 2 === 0 ? "walk-a" : "walk-b");
    return true;
  }

  protected backstep(speed: number, dt: number) {
    const behind = this.x - this.facing * 60;
    if (!this.api.groundAt(behind) || (this.facing > 0 ? this.body.blocked.left : this.body.blocked.right)) {
      this.body.setVelocityX(0);
      this.tex("walk-a");
      return false;
    }
    this.body.setVelocityX(-this.facing * speed);
    this.walkClock += dt * speed;
    this.tex(Math.floor(this.walkClock / 70) % 2 === 0 ? "walk-a" : "walk-b");
    return true;
  }

  protected blocks(fromX: number) {
    return Number.isNaN(fromX);
  }

  hitBy(attackId: number, fromX: number, t: number): HitResult {
    if (this.dead || attackId === this.lastHit) return null;
    this.lastHit = attackId;
    if (this.blocks(fromX)) {
      this.onBlock(t);
      return "block";
    }
    this.hp -= 1;
    this.alarm?.destroy();
    this.alarm = null;
    const dir = Math.sign(this.x - fromX) || 1;
    if (this.hp <= 0) {
      this.die(dir);
      return "kill";
    }
    this.hurtUntil = t + 380;
    this.state = "recover";
    this.until = t + 520;
    this.telegraphUntil = 0;
    this.body.setVelocity(dir * this.knockback.x, -this.knockback.y);
    this.tex("hurt");
    this.flashing = true;
    this.sprite.setTintFill(0xffffff);
    this.api.scene.time.delayedCall(70, () => {
      this.flashing = false;
      if (this.sprite.active) this.sprite.clearTint();
    });
    this.api.dust(this.x, this.feet, -dir);
    if (!this.api.reduced) {
      this.api.scene.tweens.killTweensOf(this.sprite);
      this.sprite.setAngle(dir * 16).setScale(MON_SCALE * 1.1, MON_SCALE * 0.9);
      this.api.scene.tweens.add({ targets: this.sprite, angle: 0, duration: 420, ease: "Back.easeOut" });
      this.api.scene.tweens.add({ targets: this.sprite, scaleX: MON_SCALE, scaleY: MON_SCALE, duration: 220, ease: "Back.easeOut" });
    }
    this.onHurt(dir, t);
    return "hit";
  }

  protected onBlock(t: number) {
    this.until = Math.max(this.until, t);
  }

  private die(dir: number) {
    this.dead = true;
    this.face?.setVisible(false);
    this.api.impact(this.x, 0.55);
    this.api.scene.tweens.add({ targets: this.shadow, alpha: 0, duration: 300 });
    this.tex("hurt");
    this.body.enable = false;
    this.sprite.setTintFill(0xffffff);
    const scene = this.api.scene;
    scene.time.delayedCall(70, () => this.sprite.active && this.sprite.clearTint());
    if (this.api.reduced) {
      scene.tweens.add({ targets: this.sprite, alpha: 0, duration: 400, onComplete: () => this.destroy() });
      return;
    }
    scene.tweens.add({ targets: this.sprite, x: this.sprite.x + dir * 260, duration: 700, ease: "Quad.easeOut" });
    scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 220, duration: 300, ease: "Quad.easeOut", yoyo: true });
    scene.tweens.add({ targets: this.sprite, angle: dir * 380, alpha: 0, delay: 150, duration: 550, onComplete: () => this.destroy() });
  }

  crush(dir: number) {
    if (this.dead) return false;
    this.dead = true;
    this.alarm?.destroy();
    this.alarm = null;
    this.face?.setVisible(false);
    this.body.enable = false;
    this.tex("hurt");
    const scene = this.api.scene;
    scene.tweens.killTweensOf(this.sprite);
    scene.tweens.add({ targets: this.shadow, alpha: 0, duration: 500 });
    if (this.api.reduced) {
      scene.tweens.add({ targets: this.sprite, alpha: 0, delay: 300, duration: 400, onComplete: () => this.destroy() });
      return true;
    }
    this.sprite.setAngle(dir * 10);
    scene.tweens.add({ targets: this.sprite, scaleX: MON_SCALE * 1.18, scaleY: MON_SCALE * 0.5, duration: 160, ease: "Quad.easeOut" });
    scene.tweens.add({ targets: this.sprite, alpha: 0, delay: 700, duration: 380, onComplete: () => this.destroy() });
    return true;
  }

  destroy() {
    this.rect.destroy();
    this.sprite.destroy();
    this.shadow.destroy();
    this.face?.destroy();
  }

  leave() {
    if (this.dead) return;
    this.dead = true;
    this.face?.setVisible(false);
    this.body.enable = false;
    this.api.scene.tweens.add({ targets: [this.sprite, this.shadow], alpha: 0, duration: this.api.reduced ? 150 : 400, onComplete: () => this.destroy() });
  }

  update(t: number, dt: number, hero: HeroView) {
    this.t = t;
    if (this.dead) return;
    if (this.body.top > 1300) {
      this.dead = true;
      this.destroy();
      return;
    }
    if (t < this.hurtUntil) {
      this.tex("hurt");
      if (this.grounded) this.body.setVelocityX(this.body.velocity.x * 0.85);
      return;
    }
    if (this.state === "dazed") {
      if (this.grounded) this.body.setVelocityX(0);
      this.tex("hurt");
      if (t >= this.until) {
        this.sprite.setAngle(0);
        this.state = this.wakeState();
      }
      return;
    }
    this.think(t, dt, hero);
  }

  protected wakeState() {
    return "chase";
  }

  get dazed() {
    return this.state === "dazed";
  }

  canStomp(t: number) {
    return !this.dead && t >= this.stompReady && t >= this.hurtUntil && this.state !== "dazed";
  }

  stomp(t: number) {
    this.state = "dazed";
    this.until = t + DAZE.ms;
    this.stompReady = t + DAZE.again;
    this.alarm?.destroy();
    this.alarm = null;
    this.telegraphUntil = 0;
    this.body.setVelocityX(0);
    this.tex("hurt");
    this.express("lost", DAZE.ms);
    this.api.burst(this.x, this.headTop + 20, 5, "spark");
    if (this.api.reduced) return;
    const scene = this.api.scene;
    scene.tweens.killTweensOf(this.sprite);
    this.sprite.setScale(MON_SCALE * 1.12, MON_SCALE * 0.82).setAngle(0);
    scene.tweens.add({ targets: this.sprite, scaleX: MON_SCALE, scaleY: MON_SCALE, duration: 260, ease: "Back.easeOut" });
    scene.tweens.add({ targets: this.sprite, angle: { from: -7, to: 7 }, duration: 160, yoyo: true, repeat: 2, onComplete: () => this.sprite.active && this.sprite.setAngle(0) });
  }

  protected abstract think(t: number, dt: number, hero: HeroView): void;

  attackBox(): Phaser.Geom.Rectangle | null {
    return null;
  }

  protected touchy() {
    return false;
  }

  contactBox(): Phaser.Geom.Rectangle | null {
    if (this.dead || this.t < this.hurtUntil || !this.touchy()) return null;
    const b = this.body;
    return new Phaser.Geom.Rectangle(b.center.x - CONTACT.half, b.top + CONTACT.top, CONTACT.half * 2, b.height - CONTACT.top - 10);
  }

  gloat() {
    if (this.dead) return;
    this.express("spot", 700);
    this.hop(16);
    this.bark(this.api.barks.caught, true);
  }

  sync() {
    if (this.dead) return;
    const b = this.body;
    this.sprite.setPosition(b.center.x, b.bottom + 2 - this.lift);
    const floor = this.grounded ? b.bottom : this.api.surface(b.center.x, b.bottom - 6);
    if (floor === null) this.shadow.setVisible(false);
    else {
      const k = Phaser.Math.Clamp((floor - b.bottom + this.lift) / 320, 0, 1);
      this.shadow.setVisible(true).setPosition(b.center.x, floor + 3).setDisplaySize(150 * (1 - k * 0.5), 30 * (1 - k * 0.4)).setAlpha(1 - k * 0.6);
    }
    if (!this.flashing) {
      if (this.t < this.telegraphUntil) {
        if (Math.floor(this.t / 90) % 2 === 0) this.sprite.setTint(0xff9b8a);
        else this.sprite.clearTint();
        if (!this.api.reduced) this.sprite.setAngle(-this.facing * 5);
      } else if (this.sprite.isTinted) {
        this.sprite.clearTint();
        this.sprite.setAngle(0);
      }
    }
    if (this.mirrored) {
      this.applyTex();
      this.sprite.setFlipX(false);
    } else this.sprite.setFlipX(this.facing < 0);
    this.syncFace();
  }

  private syncFace() {
    const f = this.face;
    if (!f) return;
    const face = this.t < this.flashUntil ? this.flashFace : this.mood;
    const show = !this.dead && face !== null && FACE_POSES.has(this.pose);
    f.setVisible(show);
    if (!show) return;
    const s = this.sprite;
    const key = this.kind === "shield" ? `mon-shield-face-${face}-${this.pose === "walk-b" ? "b" : "a"}${this.facing < 0 ? "-l" : ""}` : `mon-${this.art}-face-${face}`;
    if (f.texture.key !== key) f.setTexture(key);
    f.setPosition(s.x, s.y).setScale(s.scaleX, s.scaleY).setAngle(s.angle).setFlipX(s.flipX).setAlpha(s.alpha);
    if (s.isTinted) f.setTint(s.tintTopLeft);
    else f.clearTint();
  }
}

type CommonTune = { sight: number; speed: number; windup: number; lunge: number; recover: number; dodge: number };

const REAIM = 260;

const COMMON: Record<EnemyStyle, CommonTune> = {
  patrol: { sight: 640, speed: 155, windup: 460, lunge: 330, recover: 620, dodge: 0.3 },
  rush: { sight: 600, speed: 250, windup: 400, lunge: 400, recover: 860, dodge: 0 },
  guard: { sight: 340, speed: 125, windup: 520, lunge: 300, recover: 700, dodge: 0 },
  mixed: { sight: 640, speed: 155, windup: 460, lunge: 330, recover: 620, dodge: 0.3 },
};

export class CommonMonitor extends Enemy {
  private dodgeReady = 3000;
  private tune: CommonTune;
  private dustAt = 0;
  private called = false;
  private turnedAt = -1e9;
  private pointUntil = 0;
  private spottedAt = -1e9;
  private lostFacing = 1;
  private lostNext: "home" | "patrol" = "patrol";
  private dashReady = 0;
  private guardUp: boolean;
  private guardBackAt = 0;
  private countering = false;

  constructor(
    api: StageApi,
    x: number,
    feet: number,
    readonly style: EnemyStyle = "patrol",
  ) {
    super(api, "common", x, feet, 2, STYLE_ART[style]);
    this.tune = COMMON[style];
    this.guardUp = style === "guard";
    this.state = style === "guard" ? "wait" : "patrol";
    this.mood = "watch";
  }

  private notice(t: number, hop: boolean) {
    if (t - this.spottedAt > 2500) {
      this.express("spot", 520);
      if (hop) this.hop(16);
      this.bark(this.style === "rush" ? this.api.barks.rush : this.api.barks.spot);
    }
    this.spottedAt = t;
    this.mood = null;
  }

  private lose(t: number, h: HeroView) {
    const away = Math.abs(h.feet - this.feet) < 280;
    this.state = "lost";
    this.lostNext = this.style === "guard" ? "home" : "patrol";
    this.lostFacing = this.facing;
    this.until = t + LOST_MS;
    this.mood = away ? null : "lost";
    this.body.setVelocityX(0);
    this.tex("walk-a");
    this.bark(away ? this.api.barks.away : this.api.barks.lost);
  }

  hitBy(attackId: number, fromX: number, t: number): HitResult {
    const front = (fromX - this.x) * this.facing > 0;
    const landing = this.api.groundAt(this.x - this.facing * 190) && this.api.groundAt(this.x - this.facing * 90);
    if (!this.dead && attackId !== this.lastHit && this.state === "chase" && front && landing && t > this.dodgeReady && Math.random() < this.tune.dodge) {
      this.lastHit = attackId;
      this.dodgeReady = t + 4500;
      this.state = "dodge";
      this.until = t + 420;
      this.body.setVelocity(-this.facing * 440, -360);
      this.api.word(this.api.words.dodge, this.x, this.body.top - 50, "#fbf5e6", 36);
      this.api.sfx("jump", 0.5);
      return "dodge";
    }
    return super.hitBy(attackId, fromX, t);
  }

  protected blocks(fromX: number) {
    const front = (fromX - this.x) * this.facing > 0;
    if (this.countering && this.state === "windup") return front;
    if (!this.guardUp || GUARD_OPEN.has(this.state)) return false;
    return front;
  }

  protected onBlock(t: number) {
    this.api.sfx("block", 0.9);
    this.api.clang(this.x + this.facing * 50, this.body.top + 80);
    this.api.word(this.api.words.block, this.x + this.facing * 60, this.body.top - 30, "#cfe4ff", 38);
    if (this.countering && this.state === "windup") return;
    this.countering = true;
    this.guardUp = false;
    this.guardBackAt = t + GUARD_BACK_MS;
    this.express("spot", 500);
    this.startWindup(t, COUNTER_MS);
  }

  protected onHurt(dir: number, t: number) {
    this.facing = -dir;
    if (this.style === "rush") {
      this.until = t + 420;
      return;
    }
    this.state = "back";
    this.until = t + 820;
  }

  private startWindup(t: number, ms = this.tune.windup) {
    this.state = "windup";
    this.until = t + ms;
    this.body.setVelocityX(0);
    this.tex("windup");
    this.telegraph(ms);
    this.api.sfx("shout", 0.7);
    this.alarm?.destroy();
    this.alarm = this.api.warn(this.x, this.headTop - 30, ms);
  }

  private startAim(t: number) {
    this.state = "aim";
    this.until = t + DASH.aim;
    this.body.setVelocityX(0);
    this.tex("point");
    this.telegraph(DASH.aim);
    this.api.sfx("shout", 0.8);
    this.alarm = this.api.warn(this.x, this.headTop - 30, DASH.aim);
    this.api.dust(this.x - this.facing * 30, this.feet, -this.facing);
  }

  private endDash(t: number) {
    this.state = "recover";
    this.until = t + DASH.recover;
    this.dashReady = t + DASH.again;
    this.body.setVelocityX(0);
    this.tex("walk-a");
  }

  protected think(t: number, dt: number, h: HeroView) {
    const dx = h.x - this.x;
    const level = Math.abs(h.feet - this.feet) < 280;
    const near = Math.abs(dx) < this.tune.sight && level;
    if (!this.guardUp && this.style === "guard" && t >= this.guardBackAt) this.guardUp = true;
    switch (this.state) {
      case "patrol":
        this.mood = "watch";
        if (near) {
          if (this.style === "rush") {
            this.state = "alert";
            this.until = t + 300;
            this.faceHero(h);
            this.body.setVelocity(0, this.grounded ? -260 : this.body.velocity.y);
            this.tex("point");
          } else this.state = "chase";
          this.notice(t, this.style !== "rush");
          this.api.sfx("shout", 0.5);
          return;
        }
        if (t < this.turnedAt + 400) {
          this.hold();
          return;
        }
        if (Math.abs(this.x - this.spawnX) > 150 && t > this.turnedAt + 1200) this.facing = this.x > this.spawnX ? -1 : 1;
        if (!this.walk(80, dt)) {
          this.facing = -this.facing;
          this.turnedAt = t;
          this.hold();
        }
        return;
      case "wait": {
        this.body.setVelocityX(0);
        this.tex(t < this.pointUntil ? "point" : this.art === "guard" ? "cross" : "walk-a");
        if (Math.abs(dx) < 760 && level) {
          this.faceHero(h, TURN_SLACK);
          if (!this.called) {
            this.called = true;
            this.mood = null;
            this.pointUntil = t + 700;
            this.spottedAt = t;
            this.bark(this.api.barks.guard);
            if (!this.api.reduced) this.api.scene.tweens.add({ targets: this, lift: 18, duration: 140, yoyo: true, repeat: 1, ease: "Quad.easeOut" });
          }
        } else if (!this.called) this.mood = "watch";
        if (near) {
          this.state = "chase";
          this.mood = null;
          this.api.sfx("shout", 0.5);
        }
        return;
      }
      case "alert":
        this.body.setVelocityX(0);
        if (t >= this.until && this.grounded) this.state = "chase";
        return;
      case "chase": {
        this.faceHero(h, TURN_SLACK);
        if (Math.abs(dx) < 150 && Math.abs(h.feet - this.feet) < OVERHEAD.y) {
          this.startWindup(t);
          return;
        }
        if (this.style === "rush" && t >= this.dashReady && this.grounded && Math.abs(h.feet - this.feet) < 120 && Math.abs(dx) > DASH.min && Math.abs(dx) < DASH.max && this.api.groundAt(this.x + this.facing * DASH.min)) {
          this.startAim(t);
          return;
        }
        if (!near) {
          this.lose(t, h);
          return;
        }
        if (this.overhead(h)) {
          this.hold();
          return;
        }
        if (this.api.busy(this) && Math.abs(dx) < 380) {
          this.body.setVelocityX(0);
          this.tex("walk-a");
          return;
        }
        this.walk(this.tune.speed, dt);
        if (this.style === "rush" && t > this.dustAt && this.grounded) {
          this.dustAt = t + 190;
          this.api.dust(this.x - this.facing * 30, this.feet, this.facing);
        }
        return;
      }
      case "lost": {
        this.body.setVelocityX(0);
        this.tex("walk-a");
        if (near) {
          this.state = "chase";
          this.notice(t, true);
          return;
        }
        if (this.mood === "lost") this.facing = Math.floor((t - this.until + LOST_MS) / 300) === 1 ? -this.lostFacing : this.lostFacing;
        if (t >= this.until) {
          this.state = this.lostNext;
          this.mood = "watch";
        }
        return;
      }
      case "home": {
        this.mood = "watch";
        if (near) {
          this.state = "chase";
          this.notice(t, true);
          return;
        }
        if (Math.abs(this.x - this.spawnX) < 30) {
          this.state = "wait";
          this.called = false;
          return;
        }
        this.facing = this.x > this.spawnX ? -1 : 1;
        if (!this.walk(90, dt)) this.state = "wait";
        return;
      }
      case "windup":
        this.body.setVelocityX(0);
        if (t >= this.until) {
          this.countering = false;
          this.state = "attack";
          this.until = t + 240;
          if (Math.abs(dx) < REAIM && level) this.faceHero(h);
          this.tex("attack");
          this.api.sfx("lunge", 0.7);
          this.body.setVelocityX(this.facing * this.tune.lunge);
        }
        return;
      case "attack":
        if (!this.api.groundAt(this.x + this.facing * 50)) this.body.setVelocityX(0);
        if (t >= this.until) {
          this.state = "recover";
          this.until = t + this.tune.recover;
          this.body.setVelocityX(0);
          this.tex("walk-a");
        }
        return;
      case "recover":
        this.body.setVelocityX(0);
        if (t >= this.until) this.state = "chase";
        return;
      case "back":
        this.faceHero(h, TURN_SLACK);
        if (t >= this.until || Math.abs(dx) > 420 || !this.backstep(170, dt)) {
          this.body.setVelocityX(0);
          this.state = "chase";
        }
        return;
      case "dodge":
        this.tex("walk-a");
        if (t >= this.until && this.grounded) {
          this.body.setVelocityX(0);
          this.state = "chase";
        }
        return;
      case "aim":
        this.body.setVelocityX(0);
        if (t >= this.until) {
          this.state = "dash";
          this.until = t + DASH.ms;
          this.tex("attack");
          this.api.sfx("lunge", 0.9);
        }
        return;
      case "dash": {
        const wall = this.facing > 0 ? this.body.blocked.right : this.body.blocked.left;
        if (t >= this.until || wall || !this.api.groundAt(this.x + this.facing * 60)) {
          this.endDash(t);
          return;
        }
        this.body.setVelocityX(this.facing * DASH.speed);
        if (t > this.dustAt) {
          this.dustAt = t + 90;
          this.api.dust(this.x - this.facing * 30, this.feet, this.facing);
        }
        return;
      }
    }
  }

  protected touchy() {
    return COMMON_TOUCHY.has(this.state);
  }

  attackBox() {
    if (this.dead) return null;
    const b = this.body;
    if (this.state === "dash") return new Phaser.Geom.Rectangle(b.center.x - 60, b.top + 10, 120, b.height - 40);
    if (this.state !== "attack") return null;
    const x0 = this.facing > 0 ? b.center.x : b.center.x - 130;
    return new Phaser.Geom.Rectangle(x0, b.top + 10, 130, b.height - 40);
  }
}

export class WhistleMonitor extends Enemy {
  private nextShot = 0;
  private hopReady = 0;
  private shots = 0;
  private glanceAt = 1800 + Math.random() * 1600;

  constructor(
    api: StageApi,
    x: number,
    feet: number,
    readonly mixed = false,
  ) {
    super(api, "whistle", x, feet, 2);
    this.knockback = { x: 440, y: 360 };
    this.state = "watch";
    this.nextShot = 900;
    this.mood = "watch";
  }

  protected wakeState() {
    return "watch";
  }



  protected onHurt(dir: number, t: number) {
    this.api.sfx("whistle", 0.35);
    this.api.word(this.api.words.whistleHurt, this.x, this.body.top - 40, "#9df0dc", 34);
    this.state = "flee";
    this.until = t + 700;
    this.facing = dir;
  }

  protected think(t: number, dt: number, h: HeroView) {
    const dx = h.x - this.x;
    const dist = Math.abs(dx);
    const engaged = dist < 860 && Math.abs(h.feet - this.feet) < 140;
    if (this.state === "watch") this.track(t, engaged, h, this.api.barks.whistle);
    switch (this.state) {
      case "watch": {
        if (!engaged) {
          this.body.setVelocityX(0);
          this.tex("walk-a");
          if (t >= this.glanceAt) {
            const back = this.facing !== (dx >= 0 ? 1 : -1);
            this.facing = -this.facing;
            this.glanceAt = t + (back ? 2400 + Math.random() * 1800 : 900);
          }
          return;
        }
        if (this.nextShot === 900) this.nextShot = t + 700;
        this.faceHero(h, TURN_SLACK);
        if (dist < 210 && t > this.hopReady && this.grounded && this.api.groundAt(this.x - this.facing * 190) && this.api.groundAt(this.x - this.facing * 90)) {
          this.hopReady = t + 2600;
          this.body.setVelocity(-this.facing * 420, -420);
          this.api.word(this.api.words.hey, this.x, this.body.top - 50, "#fbf5e6", 34);
          this.api.sfx("jump", 0.5);
          this.nextShot = Math.min(this.nextShot, t + 500);
          return;
        }
        if (t >= this.nextShot && dist < 820) {
          this.state = "puff";
          this.until = t + 650;
          this.body.setVelocityX(0);
          this.tex("puff");
          this.telegraph(650);
          this.api.sfx("puff", 0.8);
          this.alarm = this.api.warn(this.x, this.body.top - 70, 650);
          return;
        }
        if (dist < 360 && this.grounded) {
          this.facing = -this.facing;
          const moved = this.walk(130, dt);
          this.facing = -this.facing;
          if (!moved) {
            this.body.setVelocityX(0);
            this.tex("walk-a");
          }
          return;
        }
        if (dist > 760) {
          this.walk(120, dt);
          return;
        }
        this.body.setVelocityX(0);
        this.tex("walk-a");
        return;
      }
      case "puff":
        this.body.setVelocityX(0);
        if (t >= this.until) {
          this.state = "blow";
          this.until = t + 420;
          this.tex("blow");
          this.api.sfx("whistle", 0.8);
          const high = this.mixed && this.shots % 2 === 1;
          this.shots += 1;
          this.api.spawnWave(this.x + this.facing * 90, this.feet - (high ? 252 : 82), this.facing, false);
        }
        return;
      case "blow":
        if (t >= this.until) {
          this.state = "watch";
          this.nextShot = t + 1900;
          this.tex("walk-a");
        }
        return;
      case "recover":
        this.body.setVelocityX(0);
        if (t >= this.until) {
          this.state = "watch";
          this.nextShot = Math.max(this.nextShot, t + 900);
        }
        return;
      case "flee": {
        if (t < this.hurtUntil + 1) return;
        const moved = this.walk(230, dt);
        if (!moved || t >= this.until) {
          this.state = "watch";
          this.nextShot = Math.max(this.nextShot, t + 700);
          this.faceHero(h);
        }
        return;
      }
    }
  }
}

const ORDER = { min: 250, max: 620, reach: 780, level: 220, raise: 620, hold: 1100, go: 1250, fine: 420, rush: 1000, speed: 560, still: 45, slack: 130, rest: 4600, notice: 450 };
const PLATE = { x: 82, y: 286, scale: 0.86 };

export class ShieldMonitor extends Enemy {
  private turnAt = 0;
  private blocksAt: number[] = [];
  private plate: Phaser.GameObjects.Image | null = null;
  private orderReady = 0;
  private seenAt = -1;
  private moved = 0;
  private wasGrounded = true;
  private rushTo = 0;
  private plateOut = true;
  private dustAt = 0;

  constructor(
    api: StageApi,
    x: number,
    feet: number,
    readonly orders = false,
  ) {
    super(api, "shield", x, feet, 3);
    this.knockback = { x: 240, y: 200 };
    this.mirrored = true;
    this.state = "advance";
    this.mood = "watch";
    if (orders) this.plate = api.scene.add.image(x, feet, "order-pare").setScale(PLATE.scale).setVisible(false);
  }

  private canOrder(t: number, h: HeroView, dx: number) {
    if (!this.orders || t < this.orderReady || !this.grounded) return false;
    if (this.seenAt < 0 || t - this.seenAt < ORDER.notice) return false;
    const gap = dx * this.facing;
    if (gap < ORDER.min || gap > ORDER.max || Math.abs(h.feet - this.feet) > ORDER.level) return false;
    if (h.vx * this.facing > -ORDER.still) return false;
    return this.api.orderClear(this);
  }

  private startOrder(t: number, h: HeroView) {
    this.state = "order-up";
    this.until = t + ORDER.raise;
    this.moved = 0;
    this.wasGrounded = h.grounded;
    this.body.setVelocityX(0);
    this.tex("order");
    this.api.sfx("whistle", 0.75);
    this.api.word(this.api.words.stop, this.x + this.facing * 190, this.feet - 250, "#ef4f43", 52);
    this.api.ordered(this);
    const plate = this.plate!;
    this.plateOut = false;
    plate.setTexture("order-pare").setVisible(true).setAlpha(1).setAngle(0);
    if (this.api.reduced) {
      plate.setScale(PLATE.scale);
      return;
    }
    this.api.scene.tweens.killTweensOf(plate);
    plate.setScale(PLATE.scale * 0.4);
    this.api.scene.tweens.add({ targets: plate, scale: PLATE.scale, duration: 220, ease: "Back.easeOut" });
    this.api.scene.tweens.add({ targets: plate, angle: { from: -10, to: 0 }, duration: 420, ease: "Elastic.easeOut" });
  }

  private holdOrder(t: number) {
    this.state = "order";
    this.until = t + ORDER.hold;
    if (this.api.reduced || !this.plate) return;
    this.api.scene.tweens.add({ targets: this.plate, scale: PLATE.scale * 1.08, duration: 180, yoyo: true, repeat: Math.floor(ORDER.hold / 360) - 1, ease: "Sine.easeInOut" });
  }

  private watchOrder(t: number, dt: number, h: HeroView) {
    const dx = h.x - this.x;
    const inside = dx * this.facing > 0 && Math.abs(dx) < ORDER.reach && Math.abs(h.feet - this.feet) < ORDER.level;
    const leapt = this.wasGrounded && !h.grounded;
    this.wasGrounded = h.grounded;
    if (!inside) return false;
    if (leapt) return true;
    if (h.grounded && Math.abs(h.vx) > ORDER.still) this.moved += dt * 1000;
    return this.moved > ORDER.slack;
  }

  private release(t: number) {
    this.state = "go";
    this.until = t + ORDER.go;
    this.mood = null;
    this.api.sfx("go", 0.8);
    this.api.word(this.api.words.go, this.x + this.facing * 190, this.feet - 250, "#63d6a0", 52);
    const plate = this.plate;
    if (!plate) return;
    const scene = this.api.scene;
    scene.tweens.killTweensOf(plate);
    plate.setScale(PLATE.scale);
    if (this.api.reduced) {
      plate.setTexture("order-siga");
      return;
    }
    scene.tweens.add({
      targets: plate,
      scaleX: 0,
      duration: 90,
      ease: "Quad.easeIn",
      onComplete: () => {
        plate.setTexture("order-siga");
        scene.tweens.add({ targets: plate, scaleX: PLATE.scale, duration: 140, ease: "Back.easeOut" });
      },
    });
  }

  private bust(t: number, h: HeroView) {
    this.state = "fine";
    this.until = t + ORDER.fine;
    this.rushTo = h.x + this.facing * 70;
    this.hidePlate();
    this.tex("block");
    this.telegraph(ORDER.fine);
    this.api.sfx("bigWhistle", 0.65);
    this.api.word(this.api.words.busted, this.x + this.facing * 170, this.feet - 290, "#ef4f43", 50);
    this.alarm = this.api.warn(this.x, this.body.top - 70, ORDER.fine);
    this.api.dust(this.x - this.facing * 40, this.feet, -this.facing);
  }

  private hidePlate() {
    const plate = this.plate;
    if (!plate || this.plateOut) return;
    this.plateOut = true;
    this.api.scene.tweens.killTweensOf(plate);
    if (this.api.reduced) {
      plate.setVisible(false);
      return;
    }
    this.api.scene.tweens.add({ targets: plate, alpha: 0, y: plate.y + 30, duration: 160, onComplete: () => plate.setVisible(false).setAlpha(1) });
  }

  private endOrder(t: number) {
    this.orderReady = t + ORDER.rest;
    this.hidePlate();
  }

  destroy() {
    super.destroy();
    if (!this.plate) return;
    this.api.scene.tweens.killTweensOf(this.plate);
    this.plate.destroy();
  }

  leave() {
    this.hidePlate();
    super.leave();
  }

  sync() {
    super.sync();
    const plate = this.plate;
    if (!plate || this.plateOut) return;
    if (this.dead) {
      this.hidePlate();
      return;
    }
    const k = this.sprite.scaleY;
    plate.setPosition(this.sprite.x + this.facing * PLATE.x * k, this.sprite.y - PLATE.y * k).setDepth(this.sprite.depth + 0.002);
  }

  protected backstep(speed: number, dt: number) {
    const behind = this.x - this.facing * 60;
    if (!this.api.groundAt(behind) || (this.facing > 0 ? this.body.blocked.left : this.body.blocked.right)) {
      this.body.setVelocityX(0);
      this.tex("walk-a");
      return false;
    }
    this.body.setVelocityX(-this.facing * speed);
    this.walkClock += dt * speed;
    this.tex(Math.floor(this.walkClock / 70) % 2 === 0 ? "walk-a" : "walk-b");
    return true;
  }

  protected wakeState() {
    return "advance";
  }

  protected blocks(fromX: number) {
    if (this.state === "open" || this.state === "recover" || this.state === "go" || this.state === "dazed") return false;
    const fromFront = (fromX - this.x) * this.facing > 0;
    return fromFront;
  }

  protected onBlock(t: number) {
    this.api.sfx("block", 0.9);
    this.api.clang(this.x + this.facing * 62, this.body.top + 70);
    this.api.word(this.api.words.block, this.x + this.facing * 60, this.body.top - 30, "#cfe4ff", 38);
    if (!this.api.reduced) {
      this.lift = 0;
      this.api.scene.tweens.add({ targets: this.sprite, angle: -this.facing * 5, duration: 70, yoyo: true });
    }
    this.blocksAt = this.blocksAt.filter((b) => t - b < 2000);
    this.blocksAt.push(t);
    if (this.blocksAt.length >= 2 && (this.state === "advance" || this.state === "guard")) {
      this.blocksAt = [];
      this.state = "windup";
      this.until = t + 300;
      this.body.setVelocityX(0);
      this.tex("block");
      this.telegraph(300);
      this.alarm = this.api.warn(this.x, this.body.top - 70, 300);
      return;
    }
    if (this.state === "advance") {
      this.tex("block");
      this.until = t + 220;
      this.state = "guard";
    }
  }

  protected onHurt(dir: number, t: number) {
    if (this.plate && !this.plateOut) this.endOrder(t);
    const fromBehind = dir === this.facing;
    if (!fromBehind) return;
    this.api.word(this.api.words.huh, this.x, this.body.top - 50, "#fbf5e6", 36);
    if (this.api.reduced) {
      this.facing = -dir;
      return;
    }
    const scene = this.api.scene;
    scene.time.delayedCall(120, () => (this.facing = -this.facing));
    scene.time.delayedCall(240, () => (this.facing = -this.facing));
    scene.time.delayedCall(360, () => {
      this.facing = -dir;
      this.until = Math.max(this.until, t + 500);
    });
  }

  protected think(t: number, dt: number, h: HeroView) {
    const dx = h.x - this.x;
    const near = Math.abs(dx) < 700 && Math.abs(h.feet - this.feet) < 300;
    const behind = (h.x - this.x) * this.facing < -TURN_SLACK;
    switch (this.state) {
      case "advance":
      case "guard": {
        this.track(t, near && !this.overhead(h), h, this.api.barks.shield);
        if (this.state === "guard") {
          this.body.setVelocityX(0);
          if (t < this.until) return;
          this.state = "advance";
        }
        if (!near || this.overhead(h)) {
          this.turnAt = 0;
          this.seenAt = -1;
          this.hold();
          return;
        }
        if (behind) {
          if (!this.turnAt) this.turnAt = t + 420;
          if (t < this.turnAt) {
            this.body.setVelocityX(0);
            this.tex("walk-a");
            return;
          }
          this.turnAt = 0;
          this.faceHero(h);
        }
        if (this.seenAt < 0) this.seenAt = t;
        if (this.canOrder(t, h, dx)) {
          this.startOrder(t, h);
          return;
        }
        if (Math.abs(dx) < 175 && Math.abs(h.feet - this.feet) < OVERHEAD.y) {
          this.state = "windup";
          this.until = t + 520;
          this.body.setVelocityX(0);
          this.tex("block");
          this.telegraph(520);
          this.api.sfx("shout", 0.7);
          this.alarm = this.api.warn(this.x, this.body.top - 70, 520);
          this.api.dust(this.x - this.facing * 40, this.feet, -this.facing);
          this.api.scene.time.delayedCall(220, () => !this.dead && this.api.dust(this.x - this.facing * 40, this.feet, -this.facing));
          return;
        }
        this.walk(100, dt);
        return;
      }
      case "order-up":
        this.body.setVelocityX(0);
        this.wasGrounded = h.grounded;
        if (t >= this.until) this.holdOrder(t);
        return;
      case "order":
        this.body.setVelocityX(0);
        if (this.watchOrder(t, dt, h)) {
          this.bust(t, h);
          return;
        }
        if (t >= this.until) this.release(t);
        return;
      case "go":
        this.body.setVelocityX(0);
        if (t >= this.until) {
          this.endOrder(t);
          this.state = "advance";
          this.mood = "watch";
          this.tex("walk-a");
        }
        return;
      case "fine":
        this.body.setVelocityX(0);
        if (t >= this.until) {
          this.state = "rush";
          this.until = t + ORDER.rush;
          this.tex("bash");
          this.api.sfx("charge", 0.7);
          this.endOrder(t);
        }
        return;
      case "rush": {
        const ahead = this.api.groundAt(this.x + this.facing * 60);
        const blocked = this.facing > 0 ? this.body.blocked.right : this.body.blocked.left;
        const past = (this.x - this.rushTo) * this.facing >= 0;
        if (!ahead || blocked || past || t >= this.until) {
          this.state = "open";
          this.until = t + 1000;
          this.body.setVelocityX(0);
          this.tex("open");
          this.api.dust(this.x + this.facing * 70, this.feet, -this.facing);
          this.api.sfx("land", 0.7);
          return;
        }
        this.body.setVelocityX(this.facing * ORDER.speed);
        if (t > this.dustAt) {
          this.dustAt = t + 130;
          this.api.dust(this.x - this.facing * 40, this.feet, this.facing);
        }
        return;
      }
      case "windup":
        this.body.setVelocityX(0);
        if (t >= this.until) {
          this.state = "bash";
          this.until = t + 260;
          this.tex("bash");
          this.api.sfx("lunge", 0.8);
          this.body.setVelocityX(this.facing * 360);
        }
        return;
      case "bash":
        if (!this.api.groundAt(this.x + this.facing * 50)) this.body.setVelocityX(0);
        if (t >= this.until) {
          this.state = "open";
          this.until = t + 1000;
          this.body.setVelocityX(0);
          this.tex("open");
          this.api.dust(this.x + this.facing * 70, this.feet, -this.facing);
          this.api.sfx("land", 0.7);
        }
        return;
      case "open":
        this.body.setVelocityX(0);
        this.tex("open");
        if (t >= this.until) {
          this.state = "advance";
          this.faceHero(h);
        }
        return;
      case "recover":
        this.body.setVelocityX(0);
        if (t >= this.until) {
          this.state = "open";
          this.until = t + 300;
        }
        return;
    }
  }

  protected touchy() {
    return SHIELD_TOUCHY.has(this.state) || (this.state === "advance" && this.seenAt >= 0);
  }

  attackBox() {
    if (this.dead || (this.state !== "bash" && this.state !== "rush")) return null;
    const b = this.body;
    const x0 = this.facing > 0 ? b.center.x : b.center.x - 150;
    return new Phaser.Geom.Rectangle(x0, b.top + 10, 150, b.height - 30);
  }
}

let waveIds = 0;

export class Wave {
  readonly img: Phaser.GameObjects.Image;
  alive = true;
  friendly = false;
  readonly hitId = -1 - waveIds++;
  private age = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private dir: number,
    readonly big: boolean,
  ) {
    this.img = scene.add.image(x, y, big ? "big-wave" : "wave").setDepth(18).setFlipX(dir < 0);
    if (big) this.img.setOrigin(0.5, 1);
  }

  get heading() {
    return this.dir;
  }

  reflect() {
    this.dir = -this.dir;
    this.friendly = true;
    this.age = 0;
    this.img.setFlipX(this.dir < 0).setTint(0x9df0dc);
  }

  update(dt: number) {
    this.age += dt;
    this.img.x += this.dir * (this.big ? 560 : 470) * (this.friendly ? 1.25 : 1) * dt;
    if (!this.big) this.img.setScale(1 + Math.sin(this.age * 18) * 0.06);
    if (this.age > 3.2) this.kill();
  }

  box() {
    const w = this.big ? 80 : 56;
    const h = this.big ? 150 : 86;
    const y = this.big ? this.img.y - h : this.img.y - h / 2;
    return new Phaser.Geom.Rectangle(this.img.x - w / 2, y, w, h);
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    this.img.destroy();
  }
}

export function makeEnemy(api: StageApi, kind: EnemyKind, x: number, feet: number, style?: EnemyStyle, orders = false): Enemy {
  if (kind === "whistle") return new WhistleMonitor(api, x, feet, style === "mixed");
  if (kind === "shield") return new ShieldMonitor(api, x, feet, orders);
  return new CommonMonitor(api, x, feet, style);
}
