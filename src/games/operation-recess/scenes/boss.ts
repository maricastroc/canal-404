import * as Phaser from "phaser";
import { FLOOR_Y } from "../config";
import type { HeroView, HitResult, StageApi } from "./enemies";

type BossState = "wait" | "intro" | "guard" | "puff" | "blow" | "tired" | "stomp" | "charge" | "dizzy" | "raise" | "slam" | "stuck" | "beaten";
type Move = "wave" | "charge" | "slam";

const SCALE = 0.82;
const WHISTLE = { x: 52, y: 225 };
const INTRO = { stomp: 420, inhale: 460, blast: 820, guard: 380, shortStomp: 260, shortBlast: 520, shortGuard: 250 };

export class Inspector {
  readonly rect: Phaser.GameObjects.Rectangle;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly sprite: Phaser.GameObjects.Image;
  readonly maxHp = 12;
  hp = 12;
  facing = -1;
  state: BossState = "wait";
  private until = 0;
  private lastHit = -1;
  private moves: Move[] = [];
  private lastMove: Move | null = null;
  private shock: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private secondWaveAt = 0;
  private t = 0;
  private introStep = 0;
  private introShort = false;
  private recoil = 0;
  private wasAngry = false;

  constructor(
    private api: StageApi,
    x: number,
    private left: number,
    private right: number,
  ) {
    const scene = api.scene;
    this.rect = scene.add.rectangle(x, FLOOR_Y - 160, 170, 320, 0xffffff, 0);
    scene.physics.add.existing(this.rect);
    this.body = this.rect.body as Phaser.Physics.Arcade.Body;
    this.body.setMaxVelocity(1000, 1500);
    this.sprite = scene.add.image(x, FLOOR_Y, "boss-idle").setOrigin(0.5, 1).setScale(SCALE).setDepth(16);
    this.shock = scene.add.image(x, FLOOR_Y, "shock").setOrigin(0.5, 1).setDepth(17).setVisible(false);
    this.shadow = scene.add.image(x, FLOOR_Y + 3, "blob").setDepth(14).setDisplaySize(260, 40);
  }

  taunt() {
    if (this.state === "beaten") return;
    this.state = "wait";
    this.body.setVelocityX(0);
    this.sprite.setAngle(0);
    this.tex("blow");
    this.api.sfx("bigWhistle", 0.9);
    this.api.word(this.api.words.bossWhistle, this.x, this.body.top - 50, "#fbf5e6", 48);
  }

  get x() {
    return this.body.center.x;
  }

  get angry() {
    return this.hp <= this.maxHp / 2;
  }

  get fighting() {
    return this.state !== "wait" && this.state !== "intro" && this.state !== "beaten";
  }

  get vulnerable() {
    return this.state === "tired" || this.state === "dizzy" || this.state === "stuck";
  }

  private tex(name: string) {
    const key = `boss-${name}`;
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key);
  }

  private tele(ms: number) {
    return this.angry ? ms * 0.78 : ms;
  }

  intro(t: number, short = false) {
    this.state = "intro";
    this.introStep = 0;
    this.introShort = short;
    this.until = t + (short ? INTRO.shortStomp : INTRO.stomp);
    this.facing = -1;
    this.tex("stomp");
    this.api.sfx("stomp", 1);
    this.api.dust(this.x, FLOOR_Y, 0);
    this.api.room("intro");
    if (!this.api.reduced) this.api.scene.cameras.main.shake(160, 0.006);
  }

  private inhale() {
    this.tex("puff");
    this.api.sfx("puff", 0.9);
    if (this.api.reduced) return;
    this.api.scene.tweens.add({ targets: this.sprite, scaleX: SCALE * 1.1, scaleY: SCALE * 1.05, duration: INTRO.inhale - 60, ease: "Quad.easeIn" });
  }

  private blast() {
    const scene = this.api.scene;
    this.tex("blow");
    this.api.sfx("bigWhistle", 1);
    this.api.word(this.api.words.silence, this.x - 40, this.body.top - 70, "#f06ba8", this.introShort ? 52 : 72);
    this.api.room("silence", -1);
    if (this.api.reduced) {
      this.sprite.setScale(SCALE);
      return;
    }
    scene.tweens.killTweensOf(this.sprite);
    this.sprite.setScale(SCALE * 0.94, SCALE * 1.04);
    scene.tweens.add({ targets: this.sprite, scaleX: SCALE, scaleY: SCALE, duration: 260, ease: "Back.easeOut" });
    scene.cameras.main.shake(this.introShort ? 160 : 260, this.introShort ? 0.005 : 0.009);
    const x = this.x + this.facing * WHISTLE.x;
    const y = FLOOR_Y - WHISTLE.y;
    for (let i = 0; i < (this.introShort ? 1 : 2); i += 1) {
      const ring = scene.add.image(x, y, "shock-ring").setDepth(17.5).setScale(0.15).setAlpha(0.95);
      scene.tweens.add({ targets: ring, scale: 3.4, alpha: 0, delay: i * 140, duration: 560, ease: "Quad.easeOut", onComplete: () => ring.destroy() });
    }
  }

  private stateTex() {
    if (this.state === "dizzy") return "dizzy";
    if (this.state === "stuck" || this.state === "slam") return "slam";
    if (this.state === "tired") return "hurt";
    return "idle";
  }

  private nextMove(): Move {
    if (!this.moves.length) {
      this.moves = Phaser.Utils.Array.Shuffle(["wave", "charge", "slam"] as Move[]);
      if (this.moves[0] === this.lastMove) this.moves.push(this.moves.shift() as Move);
    }
    const m = this.moves.shift() as Move;
    this.lastMove = m;
    return m;
  }

  private guard(t: number, ms: number) {
    this.state = "guard";
    this.until = t + ms;
    this.tex("idle");
    this.sprite.setAngle(0);
  }

  update(t: number, dt: number, h: HeroView) {
    this.t = t;
    const b = this.body;
    if (this.state === "wait" || this.state === "beaten") {
      b.setVelocityX(0);
      return;
    }
    switch (this.state) {
      case "intro":
        b.setVelocityX(0);
        if (t < this.until) return;
        if (this.introStep === 0 && !this.introShort) {
          this.introStep = 1;
          this.until = t + INTRO.inhale;
          this.inhale();
          return;
        }
        if (this.introStep < 2) {
          this.introStep = 2;
          this.until = t + (this.introShort ? INTRO.shortBlast : INTRO.blast);
          this.blast();
          return;
        }
        this.guard(t, this.introShort ? INTRO.shortGuard : INTRO.guard);
        return;
      case "guard": {
        b.setVelocityX(0);
        this.facing = h.x >= this.x ? 1 : -1;
        if (t < this.until) return;
        const m = this.nextMove();
        if (m === "wave") {
          this.state = "puff";
          this.until = t + this.tele(820);
          this.tex("puff");
          this.api.sfx("puff", 0.9);
          this.api.warn(this.x, b.top - 60, this.tele(820));
        } else if (m === "charge") {
          this.state = "stomp";
          this.until = t + this.tele(780);
          this.tex("stomp");
          this.api.sfx("stomp", 0.9);
          this.api.dust(this.x, FLOOR_Y, 0);
          this.api.warn(this.x, b.top - 60, this.tele(780));
          this.api.room("stomp");
          if (!this.api.reduced) this.api.scene.cameras.main.shake(180, 0.006);
        } else {
          this.state = "raise";
          this.until = t + this.tele(820);
          this.tex("raise");
          this.api.sfx("shout", 0.9);
          this.api.warn(this.x, b.top - 90, this.tele(820));
        }
        return;
      }
      case "puff":
        if (t < this.until) return;
        this.state = "blow";
        this.until = t + 700;
        this.tex("blow");
        this.api.sfx("bigWhistle", 1);
        this.api.spawnWave(this.x + this.facing * 120, FLOOR_Y, this.facing, true);
        this.api.room("whistle", this.facing);
        this.secondWaveAt = this.angry ? t + 1000 : 0;
        return;
      case "blow":
        if (this.secondWaveAt && t >= this.secondWaveAt) {
          this.secondWaveAt = 0;
          this.api.sfx("whistle", 0.9);
          this.api.spawnWave(this.x + this.facing * 120, FLOOR_Y, this.facing, true);
          this.until = t + 500;
        }
        if (t < this.until) return;
        this.state = "tired";
        this.until = t + 1500;
        this.tex("hurt");
        this.api.word(this.api.words.phew, this.x, b.top - 40, "#fbf5e6", 40);
        return;
      case "stomp":
        if (t < this.until) return;
        this.state = "charge";
        this.tex("charge");
        this.sprite.setAngle(this.facing * 8);
        this.api.sfx("charge", 0.9);
        return;
      case "charge": {
        b.setVelocityX(this.facing * (this.angry ? 900 : 780));
        if (Math.random() < 0.3) this.api.dust(this.x - this.facing * 60, FLOOR_Y, -this.facing);
        const hitWall = (this.facing < 0 && this.x <= this.left + 180) || (this.facing > 0 && this.x >= this.right - 180);
        if (hitWall) {
          b.setVelocityX(0);
          this.sprite.setAngle(0);
          this.state = "dizzy";
          this.until = t + 1900;
          this.tex("dizzy");
          this.api.sfx("crash", 1);
          this.api.burst(this.x + this.facing * 80, b.top + 60, 8, "spark");
          this.api.word(this.api.words.bonk, this.x + this.facing * 60, b.top - 20, "#ffc83d", 56);
          this.api.room("crash", this.facing);
          if (!this.api.reduced) this.api.scene.cameras.main.shake(260, 0.012);
        }
        return;
      }
      case "raise":
        if (t < this.until) {
          this.facing = h.x >= this.x ? 1 : -1;
          const gap = Math.abs(h.x - this.x);
          b.setVelocityX(gap > 260 ? this.facing * 160 : 0);
          return;
        }
        b.setVelocityX(0);
        this.state = "slam";
        this.until = t + 260;
        this.tex("slam");
        this.api.sfx("slam", 1);
        this.api.sfx("stomp", 0.7);
        this.shock.setPosition(this.x + this.facing * 200, FLOOR_Y + 6).setFlipX(this.facing < 0).setVisible(true).setScale(0.4, 0.4);
        this.api.scene.tweens.add({ targets: this.shock, scaleX: 1.1, scaleY: 1, duration: 120, ease: "Back.easeOut" });
        this.api.room("slam");
        if (!this.api.reduced) this.api.scene.cameras.main.shake(200, 0.01);
        return;
      case "slam":
        if (t < this.until) return;
        this.shock.setVisible(false);
        this.state = "stuck";
        this.until = t + 1500;
        this.api.word(this.api.words.stuck, this.x + this.facing * 200, FLOOR_Y - 160, "#fbf5e6", 38);
        return;
      case "tired":
      case "dizzy":
      case "stuck":
        b.setVelocityX(0);
        if (t >= this.until) this.guard(t, this.angry ? 450 : 750);
        return;
    }
  }

  hitBy(attackId: number, fromX: number, t: number): HitResult {
    if (this.state === "beaten" || this.state === "wait" || this.state === "intro" || attackId === this.lastHit) return null;
    this.lastHit = attackId;
    if (!this.vulnerable) {
      this.api.sfx("block", 0.9);
      this.api.clang(this.x + Math.sign(fromX - this.x) * 70, this.body.top + 120);
      this.api.word(this.api.words.block, this.x + Math.sign(fromX - this.x) * 80, this.body.top + 40, "#cfe4ff", 40);
      return "block";
    }
    this.hp -= 1;
    const dir = Math.sign(this.x - fromX) || 1;
    this.sprite.setTintFill(0xffffff);
    this.api.scene.time.delayedCall(70, () => this.sprite.clearTint());
    this.tex("hurt");
    this.api.scene.time.delayedCall(170, () => {
      if (this.state !== "beaten") this.tex(this.stateTex());
    });
    if (!this.api.reduced) {
      const scene = this.api.scene;
      scene.tweens.killTweensOf(this);
      this.recoil = dir * 34;
      scene.tweens.add({ targets: this, recoil: 0, duration: 260, ease: "Back.easeOut" });
      if (this.state !== "charge") {
        this.sprite.setAngle(dir * 6);
        scene.tweens.add({ targets: this.sprite, angle: 0, duration: 320, ease: "Back.easeOut" });
      }
    }
    this.api.room("hit");
    if (this.angry && !this.wasAngry) {
      this.wasAngry = true;
      this.api.room("angry");
      this.api.word("GRRR!", this.x, this.body.top - 40, "#ef4f43", 46);
    }
    if (this.hp <= 0) {
      this.state = "beaten";
      this.tex("beaten");
      this.api.room("defeat");
      this.body.setVelocityX(0);
      this.shock.setVisible(false);
      return "kill";
    }
    if (this.state === "stuck" || this.state === "tired") this.until = Math.min(this.until, t + 900);
    return "hit";
  }

  attackBox(): Phaser.Geom.Rectangle | null {
    const b = this.body;
    if (this.state === "charge") return new Phaser.Geom.Rectangle(b.x + 10, FLOOR_Y - 175, b.width - 20, 175);
    if (this.state === "slam") {
      const x0 = this.facing > 0 ? this.x + 40 : this.x - 320;
      return new Phaser.Geom.Rectangle(x0, FLOOR_Y - 120, 280, 120);
    }
    return null;
  }

  sync() {
    const b = this.body;
    this.sprite.setPosition(b.center.x + this.recoil, b.bottom + 2).setFlipX(this.facing < 0);
    this.shadow.setPosition(b.center.x, FLOOR_Y + 3);
  }
}
