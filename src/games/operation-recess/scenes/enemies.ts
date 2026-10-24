import * as Phaser from "phaser";
import type { EnemyKind } from "../levels";
import type { RecessSfx } from "../sounds";

export type HeroView = { x: number; feet: number; top: number; grounded: boolean };

export type StageApi = {
  scene: Phaser.Scene;
  reduced: boolean;
  sfx: (name: RecessSfx, volume?: number) => void;
  warn: (x: number, y: number, ms: number) => void;
  word: (text: string, x: number, y: number, color: string, size?: number) => void;
  burst: (x: number, y: number, count: number, tex?: string) => void;
  dust: (x: number, y: number, dir: number) => void;
  spawnWave: (x: number, y: number, dir: number, big: boolean) => void;
  groundAt: (x: number) => boolean;
  quake: (power: number) => void;
};

export type HitResult = "hit" | "block" | "kill" | "dodge" | null;

const MON_SCALE = 0.9;

export abstract class Enemy {
  readonly rect: Phaser.GameObjects.Rectangle;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
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
  private flashing = false;

  constructor(
    protected api: StageApi,
    readonly kind: EnemyKind,
    x: number,
    feet: number,
    public hp: number,
  ) {
    const scene = api.scene;
    this.spawnX = x;
    this.rect = scene.add.rectangle(x, feet - 95, 70, 190, 0xffffff, 0);
    scene.physics.add.existing(this.rect);
    this.body = this.rect.body as Phaser.Physics.Arcade.Body;
    this.body.setMaxVelocity(700, 1500);
    this.sprite = scene.add.image(x, feet, `mon-${kind}-walk-a`).setOrigin(0.5, 1).setScale(MON_SCALE).setDepth(15);
    this.shadow = scene.add.image(x, feet + 2, "blob").setDepth(14).setDisplaySize(150, 30);
  }

  protected telegraph(ms: number) {
    this.telegraphUntil = this.t + ms;
  }

  taunt() {
    if (this.dead) return;
    const scene = this.api.scene;
    this.tex(this.kind === "whistle" ? "blow" : this.kind === "shield" ? "block" : "windup");
    this.api.word("HAHA!", this.x, this.body.top - 60, "#fbf5e6", 40);
    this.api.sfx("whistle", 0.6);
    if (!this.api.reduced) scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 40, duration: 160, yoyo: true, repeat: 2, ease: "Quad.easeOut" });
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

  bounds() {
    const b = this.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  protected tex(name: string) {
    this.pose = name;
    this.applyTex();
  }

  private applyTex() {
    const key = `mon-${this.kind}-${this.pose}${this.mirrored && this.facing < 0 ? "-l" : ""}`;
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key);
  }

  protected faceHero(h: HeroView) {
    this.facing = h.x >= this.x ? 1 : -1;
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
    const dir = Math.sign(this.x - fromX) || 1;
    if (this.hp <= 0) {
      this.die(dir);
      return "kill";
    }
    this.hurtUntil = t + 380;
    this.state = "recover";
    this.until = t + 520;
    this.telegraphUntil = 0;
    this.body.setVelocity(dir * 380, -320);
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
      this.sprite.setAngle(dir * 16);
      this.api.scene.tweens.add({ targets: this.sprite, angle: 0, duration: 420, ease: "Back.easeOut" });
    }
    this.onHurt(dir, t);
    return "hit";
  }

  protected onBlock(t: number) {
    this.until = Math.max(this.until, t);
  }

  private die(dir: number) {
    this.dead = true;
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

  destroy() {
    this.rect.destroy();
    this.sprite.destroy();
    this.shadow.destroy();
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
    this.think(t, dt, hero);
  }

  protected abstract think(t: number, dt: number, hero: HeroView): void;

  attackBox(): Phaser.Geom.Rectangle | null {
    return null;
  }

  sync() {
    if (this.dead) return;
    const b = this.body;
    this.sprite.setPosition(b.center.x, b.bottom + 2);
    const air = this.grounded ? 0 : Math.min(1, Math.abs(b.velocity.y) / 900);
    this.shadow.setPosition(b.center.x, b.bottom + 3).setAlpha(1 - air * 0.6);
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
  }
}

export class CommonMonitor extends Enemy {
  private dodgeReady = 3000;

  constructor(api: StageApi, x: number, feet: number) {
    super(api, "common", x, feet, 2);
    this.state = "patrol";
  }

  hitBy(attackId: number, fromX: number, t: number): HitResult {
    const front = (fromX - this.x) * this.facing > 0;
    const landing = this.api.groundAt(this.x - this.facing * 190) && this.api.groundAt(this.x - this.facing * 90);
    if (!this.dead && attackId !== this.lastHit && this.state === "chase" && front && landing && t > this.dodgeReady && Math.random() < 0.3) {
      this.lastHit = attackId;
      this.dodgeReady = t + 4500;
      this.state = "dodge";
      this.until = t + 420;
      this.body.setVelocity(-this.facing * 440, -360);
      this.api.word("OPA!", this.x, this.body.top - 50, "#fbf5e6", 36);
      this.api.sfx("jump", 0.5);
      return "dodge";
    }
    return super.hitBy(attackId, fromX, t);
  }

  protected think(t: number, dt: number, h: HeroView) {
    const dx = h.x - this.x;
    const near = Math.abs(dx) < 640 && Math.abs(h.feet - this.feet) < 280;
    switch (this.state) {
      case "patrol":
        if (near) {
          this.state = "chase";
          this.api.sfx("shout", 0.5);
          return;
        }
        if (Math.abs(this.x - this.spawnX) > 150) this.facing = this.x > this.spawnX ? -1 : 1;
        if (!this.walk(80, dt)) this.facing = -this.facing;
        return;
      case "chase":
        this.faceHero(h);
        if (Math.abs(dx) < 150 && Math.abs(h.feet - this.feet) < 160) {
          this.state = "windup";
          this.until = t + 460;
          this.body.setVelocityX(0);
          this.tex("windup");
          this.telegraph(460);
          this.api.sfx("shout", 0.7);
          this.api.warn(this.x, this.body.top - 70, 460);
          return;
        }
        if (!near) {
          this.state = "patrol";
          return;
        }
        this.walk(155, dt);
        return;
      case "windup":
        this.body.setVelocityX(0);
        if (t >= this.until) {
          this.state = "attack";
          this.until = t + 240;
          this.tex("attack");
          this.api.sfx("lunge", 0.7);
          this.body.setVelocityX(this.facing * 330);
        }
        return;
      case "attack":
        if (!this.api.groundAt(this.x + this.facing * 50)) this.body.setVelocityX(0);
        if (t >= this.until) {
          this.state = "recover";
          this.until = t + 620;
          this.body.setVelocityX(0);
          this.tex("walk-a");
        }
        return;
      case "recover":
        this.body.setVelocityX(0);
        if (t >= this.until) this.state = "chase";
        return;
      case "dodge":
        this.tex("walk-a");
        if (t >= this.until && this.grounded) {
          this.body.setVelocityX(0);
          this.state = "chase";
        }
        return;
    }
  }

  attackBox() {
    if (this.dead || this.state !== "attack") return null;
    const b = this.body;
    const x0 = this.facing > 0 ? b.center.x : b.center.x - 130;
    return new Phaser.Geom.Rectangle(x0, b.top + 10, 130, b.height - 40);
  }
}

export class WhistleMonitor extends Enemy {
  private nextShot = 0;
  private hopReady = 0;

  constructor(api: StageApi, x: number, feet: number) {
    super(api, "whistle", x, feet, 2);
    this.state = "watch";
    this.nextShot = 900;
  }

  protected onHurt(dir: number, t: number) {
    this.api.sfx("whistle", 0.35);
    this.api.word("FIU!", this.x, this.body.top - 40, "#9df0dc", 34);
    this.state = "flee";
    this.until = t + 700;
    this.facing = dir;
  }

  protected think(t: number, dt: number, h: HeroView) {
    const dx = h.x - this.x;
    const dist = Math.abs(dx);
    const engaged = dist < 860 && Math.abs(h.feet - this.feet) < 140;
    switch (this.state) {
      case "watch": {
        if (!engaged) {
          this.body.setVelocityX(0);
          this.tex("walk-a");
          return;
        }
        if (this.nextShot === 900) this.nextShot = t + 700;
        this.faceHero(h);
        if (dist < 210 && t > this.hopReady && this.grounded && this.api.groundAt(this.x - this.facing * 190) && this.api.groundAt(this.x - this.facing * 90)) {
          this.hopReady = t + 2600;
          this.body.setVelocity(-this.facing * 420, -420);
          this.api.word("EI!", this.x, this.body.top - 50, "#fbf5e6", 34);
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
          this.api.warn(this.x, this.body.top - 70, 650);
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
          this.api.spawnWave(this.x + this.facing * 90, this.feet - 82, this.facing, false);
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

export class ShieldMonitor extends Enemy {
  private turnAt = 0;
  private blocksAt: number[] = [];

  constructor(api: StageApi, x: number, feet: number) {
    super(api, "shield", x, feet, 3);
    this.mirrored = true;
    this.state = "advance";
  }

  protected blocks(fromX: number) {
    if (this.state === "open" || this.state === "recover") return false;
    const fromFront = (fromX - this.x) * this.facing > 0;
    return fromFront;
  }

  protected onBlock(t: number) {
    this.api.sfx("block", 0.9);
    this.api.burst(this.x + this.facing * 70, this.body.top + 30, 4, "spark");
    this.api.word("TÓIM!", this.x + this.facing * 60, this.body.top - 30, "#fbf5e6", 38);
    this.blocksAt = this.blocksAt.filter((b) => t - b < 2000);
    this.blocksAt.push(t);
    if (this.blocksAt.length >= 2 && (this.state === "advance" || this.state === "guard")) {
      this.blocksAt = [];
      this.state = "windup";
      this.until = t + 300;
      this.body.setVelocityX(0);
      this.tex("block");
      this.telegraph(300);
      this.api.warn(this.x, this.body.top - 70, 300);
      return;
    }
    if (this.state === "advance") {
      this.tex("block");
      this.until = t + 220;
      this.state = "guard";
    }
  }

  protected onHurt(dir: number, t: number) {
    const fromBehind = dir === this.facing;
    if (!fromBehind) return;
    this.api.word("HÃ?!", this.x, this.body.top - 50, "#fbf5e6", 36);
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
    const behind = (h.x - this.x) * this.facing < 0;
    switch (this.state) {
      case "advance":
      case "guard": {
        if (this.state === "guard") {
          this.body.setVelocityX(0);
          if (t < this.until) return;
          this.state = "advance";
        }
        if (!near) {
          this.body.setVelocityX(0);
          this.tex("walk-a");
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
        if (Math.abs(dx) < 175 && Math.abs(h.feet - this.feet) < 160) {
          this.state = "windup";
          this.until = t + 520;
          this.body.setVelocityX(0);
          this.tex("block");
          this.telegraph(520);
          this.api.sfx("shout", 0.7);
          this.api.warn(this.x, this.body.top - 70, 520);
          return;
        }
        this.walk(100, dt);
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
        if (t >= this.until) this.state = "open";
        this.until = Math.max(this.until, t + 300);
        return;
    }
  }

  attackBox() {
    if (this.dead || this.state !== "bash") return null;
    const b = this.body;
    const x0 = this.facing > 0 ? b.center.x : b.center.x - 150;
    return new Phaser.Geom.Rectangle(x0, b.top + 10, 150, b.height - 30);
  }
}

export class Wave {
  readonly img: Phaser.GameObjects.Image;
  alive = true;
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

  update(dt: number) {
    this.age += dt;
    this.img.x += this.dir * (this.big ? 560 : 470) * dt;
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

export function makeEnemy(api: StageApi, kind: EnemyKind, x: number, feet: number): Enemy {
  if (kind === "whistle") return new WhistleMonitor(api, x, feet);
  if (kind === "shield") return new ShieldMonitor(api, x, feet);
  return new CommonMonitor(api, x, feet);
}
