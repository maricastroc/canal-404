import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import type { Matter } from "@/lib/physics/matter";
import {
  AMMO,
  ANCHOR,
  ANGLE_MAX,
  ANGLE_MIN,
  BAND_BACK,
  BAND_FRONT,
  GRAVITY_PER_STEP,
  GROUND_Y,
  MAX_PULL,
  MAX_SPEED,
  MIN_POWER,
  MIN_SPEED,
  SCORE,
  STEP_MS,
  TARGETS,
  W,
  WAGON,
  WAVES,
  type ProjectileDef,
} from "../config";
import { COPY, type StreetCopy } from "../copy";
import { ANGLE_STEPS, POWER_STEPS, StreetSim, type SimImpact, type SimTargetState, type StreetTally } from "../sim";
import { GAME_SFX, type GameSfx } from "../sounds";
import { Fx } from "./fx";
import { Arlindo, birdFlyOut, Cat, popLid } from "./neighborhood";
import { Bubble, Hud } from "./ui";

type Material = "ceramic" | "wood" | "metal" | "rubber" | "plastic" | "soft" | "water" | "squeaky";

const SHADOW = { x: 5, y: 6, alpha: 0.26 };
const KNOCKED_TINT = 0xd4cddc;

export class PlayScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private copy!: StreetCopy;
  private sim!: StreetSim;
  private aiming = false;
  private acc = 0;
  private sprites = new Map<number, Phaser.GameObjects.Image>();
  private shadows = new Map<number, Phaser.GameObjects.Image>();
  private materials = new Map<number, Material>();
  private knocked = new Set<number>();
  private popped = new Set<number>();
  private readyImage: Phaser.GameObjects.Image | null = null;
  private readyPop = { value: 1 };
  private flyStart = 0;
  private highScore = 0;
  private aimAngle = 35;
  private aimPower = 0.5;
  private savedAim = { angle: 35, power: 0.5 };
  private dragStart: Phaser.Math.Vector2 | null = null;
  private bandBack!: Phaser.GameObjects.Graphics;
  private bandFront!: Phaser.GameObjects.Graphics;
  private aimGfx!: Phaser.GameObjects.Graphics;
  private deco!: Phaser.GameObjects.Image;
  private lina!: Phaser.GameObjects.Image;
  private hud!: Hud;
  private fx!: Fx;
  private arlindo!: Arlindo;
  private cat!: Cat;
  private decoBubble!: Bubble;
  private linaBubble!: Bubble;
  private lastSound = new Map<string, number>();
  private lastHit = { at: -1000, x: 0, y: 0 };
  private freezeUntil = 0;
  private charged = false;
  private keys!: Record<"left" | "right" | "up" | "down" | "a" | "d" | "w" | "s", Phaser.Input.Keyboard.Key>;
  private holdSince = 0;
  private aimAnnounce?: Phaser.Time.TimerEvent;
  private bandSnap = 0;
  private playMs = 0;

  constructor() {
    super("play");
  }

  init() {
    this.aiming = false;
    this.acc = 0;
    this.sprites = new Map();
    this.shadows = new Map();
    this.materials = new Map();
    this.knocked = new Set();
    this.popped = new Set();
    this.readyImage = null;
    this.readyPop = { value: 1 };
    this.aimAngle = 35;
    this.aimPower = 0.5;
    this.dragStart = null;
    this.lastSound = new Map();
    this.lastHit = { at: -1000, x: 0, y: 0 };
    this.freezeUntil = 0;
    this.charged = false;
    this.bandSnap = 0;
    this.playMs = 0;
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.copy = COPY[this.ctx.locale];
    this.highScore = (this.registry.get("highScore") as number | undefined) ?? this.ctx.highScore;
    const reduced = this.ctx.reducedMotion;

    this.buildBackground();
    this.fx = new Fx(this, this.ctx.fonts, reduced);
    this.sim = new StreetSim({
      load: (def, shot) => this.onLoad(def, shot),
      impact: (imp) => this.onImpact(imp),
      hit: (t, shotHits, combo) => this.onHit(t, shotHits, combo),
      mess: (points, x, y) => this.onMess(points, x, y),
      score: (score) => this.onScore(score),
      burst: (x, y, balloon) => this.onBurst(x, y, balloon),
      waveCleared: (wave, last) => this.onWaveCleared(wave, last),
      interlude: (wave, spent) => this.onInterlude(wave, spent),
      spawn: (t) => this.spawnTarget(t, true),
      shotEnd: (shot) => this.onShotEnd(shot.hits, shot.mess, shot.nearest),
      outOfAmmo: () => this.hud.setAim(null, null),
      finish: (tally) => this.finish(tally),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.sim.destroy());
    this.buildLevel();
    this.buildLauncher();
    this.arlindo = new Arlindo(this, this.ctx.fonts, reduced);
    this.cat = new Cat(this, this.ctx.fonts, this.fx, reduced, () => this.sfx("hiss", 0.9), this.copy.words.hiss);
    this.decoBubble = new Bubble(this, this.ctx.fonts, "left", 36, 16);
    this.linaBubble = new Bubble(this, this.ctx.fonts, "left", 36, 16);
    this.hud = new Hud(this, this.ctx.fonts, TARGETS, reduced, this.ctx.locale);
    this.hud.setRecord(this.highScore);
    this.sim.targets.forEach((t) => (t.def.wave > 1 ? this.hud.lockTarget(t.index) : this.hud.revealTarget(t.index)));
    this.setupInput();

    this.applyScale();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyScale, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.applyScale, this));

    this.syncSprites();
    this.drawBands();
    this.drawAim();

    if (!this.registry.get("readySent")) {
      this.registry.set("readySent", true);
      this.ctx.onReady();
    }

    if (this.registry.get("autostart")) {
      this.registry.set("autostart", false);
      this.begin();
    }
  }

  private applyScale() {
    this.hud.layout(this.scale.displayScale.x);
    const s = this.hud.uiScale;
    this.fx.scale = s;
    this.arlindo.setScale(s);
    this.decoBubble.setBaseScale(Math.min(s, 1.5));
    this.linaBubble.setBaseScale(Math.min(s, 1.5));
  }

  begin() {
    if (this.sim.phase !== "attract") return;
    this.hud.setRound(0);
    const first = this.copy.waves[WAVES[0].id];
    this.hud.showBanner(this.copy.roundOf(1, WAVES.length), first.title, first.subtitle, 2400);
    this.ctx.onEvent({
      type: "announce",
      message: this.copy.announce.start(WAVES.length, first.subtitle),
    });
    this.sim.start();
    this.sim.targets.filter((t) => t.def.wave === 1).forEach((t, i) => this.time.delayedCall(500 + i * 220, () => this.cueTarget(t)));
  }

  setHighScore(value: number) {
    this.highScore = value;
    this.hud?.setRecord(value);
  }

  private sfx(name: GameSfx, volume = 1, throttleMs = 0) {
    if (throttleMs) {
      const last = this.lastSound.get(name) ?? -1000;
      if (this.time.now - last < throttleMs) return;
      this.lastSound.set(name, this.time.now);
    }
    this.ctx.audio.play(GAME_SFX[name], { volume: Phaser.Math.Clamp(volume, 0.05, 1.2) });
  }

  private buildBackground() {
    this.add.image(0, 0, "sky").setOrigin(0).setDepth(0);
    const clouds: [string, number, number, number][] = [
      ["cloud-a", 260, 150, 70],
      ["cloud-b", 900, 90, 90],
      ["cloud-a", 1400, 230, 110],
    ];
    for (const [key, x, y, duration] of clouds) {
      const cloud = this.add.image(x, y, key).setDepth(1);
      if (!this.ctx.reducedMotion) {
        this.tweens.add({
          targets: cloud,
          x: { from: x, to: x + W + 300 },
          duration: duration * 1000,
          repeat: -1,
          onRepeat: () => {
            cloud.x = -300;
          },
        });
      }
    }
    this.add.image(0, 0, "houses").setOrigin(0).setDepth(2);
    this.add.image(0, 0, "yard").setOrigin(0).setDepth(3);
  }

  private addSprite(body: Matter.Body, tex: string, material: Material, depth = 5) {
    const sprite = this.add.image(body.position.x, body.position.y, tex).setRotation(body.angle).setDepth(depth);
    this.sprites.set(body.id, sprite);
    this.materials.set(body.id, material);
    return sprite;
  }

  private buildLevel() {
    for (const p of this.sim.props) this.addSprite(p.body, p.def.tex, p.def.material);
    for (const t of this.sim.targets) if (t.body) this.spawnTarget(t, false);
  }

  private spawnTarget(t: SimTargetState, animate: boolean) {
    const body = t.body!;
    const sprite = this.addSprite(body, t.def.tex, t.def.material);
    this.shadows.set(body.id, this.add.image(sprite.x + SHADOW.x, sprite.y + SHADOW.y, t.def.tex).setTintFill(0x1d1830).setAlpha(SHADOW.alpha).setDepth(4.9));
    if (animate) {
      sprite.setAlpha(0);
      this.tweens.add({ targets: sprite, alpha: 1, duration: 220 });
      this.fx.burst(this.fx.puff, 6, t.def.x, t.def.y);
      this.fx.burst(this.fx.sparks, 5, t.def.x, t.def.y - 20);
      this.sfx("spawn", 0.9);
      this.hud.revealTarget(t.index);
      this.time.delayedCall(260, () => this.cueTarget(t));
    }
  }

  private cueTarget(t: SimTargetState) {
    if (!t.body || t.hit || this.sim.finishing) return;
    const x = t.def.x;
    const y = t.def.y - t.def.h / 2 - 46;
    const g = this.add.graphics().setDepth(13);
    g.fillStyle(0x1d1830, 1);
    g.fillTriangle(-17, -12, 21, -12, 2, 15);
    g.fillStyle(0xffc83d, 1);
    g.fillTriangle(-19, -16, 19, -16, 0, 11);
    g.lineStyle(4, 0x1d1830, 1);
    g.strokeTriangle(-19, -16, 19, -16, 0, 11);
    g.setPosition(x, y).setScale(Math.min(this.hud.uiScale, 1.3) * 1.35);
    const fade = () => this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(1300, fade);
      return;
    }
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 140 });
    this.tweens.add({ targets: g, y: y - 12, duration: 300, yoyo: true, repeat: 1, ease: "Sine.easeInOut", onComplete: fade });
  }

  private syncSprites() {
    for (const body of this.sim.engine.world.bodies) {
      const sprite = this.sprites.get(body.id);
      if (!sprite) continue;
      sprite.setPosition(body.position.x, body.position.y).setRotation(body.angle);
      const shadow = this.shadows.get(body.id);
      if (shadow) shadow.setPosition(sprite.x + SHADOW.x, sprite.y + SHADOW.y).setRotation(sprite.rotation).setAlpha(sprite.alpha * SHADOW.alpha);
    }
  }

  private flyToHud(t: SimTargetState, x: number, y: number) {
    if (this.ctx.reducedMotion) {
      this.hud.checkTarget(t.index);
      return;
    }
    const to = this.hud.iconPoint(t.index);
    const token = this.add.image(x, y, "star").setDepth(21).setScale(1.6);
    this.tweens.add({ targets: token, angle: 220, duration: 560, delay: 140 });
    this.tweens.add({
      targets: token,
      x: to.x,
      y: to.y,
      scale: 0.9,
      duration: 560,
      delay: 140,
      ease: "Cubic.easeIn",
      onComplete: () => {
        token.destroy();
        this.hud.checkTarget(t.index);
      },
    });
  }

  private buildLauncher() {
    this.deco = this.add.image(78, GROUND_Y + 6, "deco").setOrigin(0.5, 1).setDepth(5);
    this.lina = this.add.image(478, GROUND_Y + 6, "lina").setOrigin(0.5, 1).setDepth(5);
    this.add.image(WAGON.x, WAGON.y, "wagon").setOrigin(0).setDepth(6);
    this.bandBack = this.add.graphics().setDepth(7);
    this.bandFront = this.add.graphics().setDepth(9);
    this.add.image(WAGON.x, WAGON.y, "fork-front").setOrigin(0).setDepth(10);
    this.aimGfx = this.add.graphics().setDepth(11);
    if (!this.ctx.reducedMotion) {
      this.tweens.add({ targets: this.lina, scaleY: 1.03, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.tweens.add({ targets: this.deco, angle: 2, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  private hop(sprite: Phaser.GameObjects.Image, height = 26, times = 0) {
    this.tweens.add({ targets: sprite, y: GROUND_Y + 6 - height, duration: 150, yoyo: true, repeat: times, ease: "Quad.easeOut" });
  }

  private decoSay(text: string, duration = 1300) {
    this.linaBubble.hide();
    this.decoBubble.say(text, 70, 610, duration);
  }

  private linaSay(text: string, duration = 1100) {
    this.decoBubble.hide();
    this.linaBubble.say(text, 470, 650, duration);
  }

  private get aimable() {
    return this.sim.phase === "ready" && !this.aiming;
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
    }) as typeof this.keys;
    kb.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE]);
    kb.on("keydown", (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "escape" || key === "p") {
        this.ctx.onEvent({ type: "pause-request" });
        return;
      }
      if (!this.aimable) return;
      if (key === " " || key === "enter") {
        event.preventDefault();
        this.tryFire();
        return;
      }
      const map: Record<string, [number, number]> = {
        arrowleft: [1.5, 0],
        a: [1.5, 0],
        arrowright: [-1.5, 0],
        d: [-1.5, 0],
        arrowup: [0, 0.025],
        w: [0, 0.025],
        arrowdown: [0, -0.025],
        s: [0, -0.025],
      };
      const step = map[key];
      if (step && !event.repeat) {
        this.holdSince = this.time.now;
        this.adjustAim(step[0], step[1]);
      }
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.aimable) return;
      this.savedAim = { angle: this.aimAngle, power: this.aimPower };
      this.dragStart = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
      this.aiming = true;
      this.aimPower = 0;
      this.charged = false;
      this.sfx("stretch", 0.6);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.aiming || !this.dragStart) return;
      this.setAimFromPull(pointer.worldX - this.dragStart.x, pointer.worldY - this.dragStart.y);
    });
    const release = () => {
      if (!this.aiming) return;
      this.aiming = false;
      this.dragStart = null;
      if (this.aimPower >= MIN_POWER) {
        this.tryFire();
      } else {
        this.aimAngle = this.savedAim.angle;
        this.aimPower = this.savedAim.power;
      }
    };
    this.input.on("pointerup", release);
    this.input.on("pointerupoutside", release);
  }

  private checkCharge() {
    if (this.aimPower >= 0.98 && !this.charged) {
      this.charged = true;
      this.sfx("charge", 0.8);
    } else if (this.aimPower < 0.9) {
      this.charged = false;
    }
  }

  private adjustAim(dAngle: number, dPower: number) {
    this.aimAngle = Phaser.Math.Clamp(this.aimAngle + dAngle, ANGLE_MIN, ANGLE_MAX);
    this.aimPower = Phaser.Math.Clamp(this.aimPower + dPower, MIN_POWER, 1);
    this.checkCharge();
    this.scheduleAimAnnounce();
  }

  private scheduleAimAnnounce() {
    this.aimAnnounce?.remove();
    this.aimAnnounce = this.time.delayedCall(700, () => {
      this.ctx.onEvent({
        type: "announce",
        message: this.copy.announce.aim(Math.round(this.aimAngle), Math.round(this.aimPower * 100)),
      });
    });
  }

  private setAimFromPull(dx: number, dy: number) {
    const len = Math.min(Math.hypot(dx, dy), MAX_PULL);
    if (len < 6) {
      this.aimPower = 0;
      return;
    }
    let angle = Phaser.Math.RadToDeg(Math.atan2(dy, -dx));
    if (angle > 135) angle = ANGLE_MAX;
    else if (angle < -135) angle = ANGLE_MIN;
    this.aimAngle = Phaser.Math.Clamp(angle, ANGLE_MIN, ANGLE_MAX);
    const before = this.aimPower;
    this.aimPower = len / MAX_PULL;
    if (Math.floor(before * 6) !== Math.floor(this.aimPower * 6)) this.sfx("stretch", 0.25 + this.aimPower * 0.4, 60);
    this.checkCharge();
  }

  private pulledPosition() {
    const rad = Phaser.Math.DegToRad(this.aimAngle);
    const pull = this.aimPower * MAX_PULL;
    return { x: ANCHOR.x - Math.cos(rad) * pull, y: ANCHOR.y + Math.sin(rad) * pull };
  }

  private launchVelocity() {
    const rad = Phaser.Math.DegToRad(this.aimAngle);
    const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * this.aimPower;
    return { x: Math.cos(rad) * speed, y: -Math.sin(rad) * speed };
  }

  private flashBody(body: Matter.Body) {
    const sprite = this.sprites.get(body.id);
    if (!sprite || !sprite.active) return;
    sprite.setTintFill(0xffffff);
    this.time.delayedCall(70, () => {
      if (!sprite.active) return;
      if (this.knocked.has(body.id)) sprite.setTint(KNOCKED_TINT);
      else sprite.clearTint();
    });
  }

  private onImpact(imp: SimImpact) {
    const { a, b, rel, x, y } = imp;
    const recentHit = this.time.now - this.lastHit.at < 160;
    const fast = a.isStatic ? b : b.isStatic ? a : a.speed > b.speed ? a : b;
    const material = this.materials.get(fast.id) ?? "soft";
    const volume = Phaser.Math.Clamp(rel / 14, 0.15, 1);
    this.cat.notifyImpact(x, y, rel);
    for (const prop of this.sim.props) {
      const cb = prop.body;
      if (this.popped.has(cb.id) || prop.def.tex !== "trash-can") continue;
      const direct = (a.id === cb.id || b.id === cb.id) && rel > 3.5;
      const topX = cb.position.x + Math.sin(cb.angle) * 54;
      const topY = cb.position.y - Math.cos(cb.angle) * 54;
      const jolt = rel > 5 && Phaser.Math.Distance.Between(x, y, topX, topY) < 95;
      const sprite = this.sprites.get(cb.id);
      if ((direct || jolt) && sprite) {
        this.popped.add(cb.id);
        popLid(this, sprite, { x: cb.position.x, y: cb.position.y, angle: cb.angle }, this.fx, this.ctx.reducedMotion, this.copy.words.clang);
        this.sfx("clang", 1);
        if (!this.arlindo.busy) this.arlindo.shout(this.copy.arlindo.trashCan, 1300);
      }
    }
    if (material === "squeaky") {
      this.sfx("squeak", volume, 120);
    } else if (material !== "water") {
      const map: Record<string, GameSfx> = { ceramic: "ceramic", wood: "wood", metal: "metal", rubber: "rubber", plastic: "wood", soft: "thud" };
      this.sfx(map[material] ?? "thud", volume, 70);
    }
    const flyingDef = this.sim.flyingDef;
    if (imp.flying && flyingDef) {
      const id = flyingDef.id;
      const nearHit = recentHit && Phaser.Math.Distance.Between(x, y, this.lastHit.x, this.lastHit.y) < 180;
      const other = imp.other;
      if (other && !other.isStatic && rel > 7) this.flashBody(other);
      if (imp.firstOfShot && rel > 5) {
        if (id === "shoe") {
          this.fx.burst(this.fx.puff, 5, x, y);
          this.fx.burst(this.fx.stink, 5, x, y - 20);
          this.sfx("stinky", 0.8);
        } else if (id === "tire") {
          this.fx.burst(this.fx.puff, 8, x, y);
          this.sfx("bonk", volume + 0.2);
          if (!this.ctx.reducedMotion) this.cameras.main.shake(170, 0.005);
        } else if (id === "duck") {
          this.fx.burst(this.fx.sparks, 7, x, y);
        }
        if (id !== "balloon" && !nearHit) this.fx.word(Phaser.Utils.Array.GetRandom(this.copy.impactWords[id]), x, y - 80, "#ffc83d", 74);
        if (rel > 9) this.fx.ring(x, y, 0xfffaf0, 80);
      } else if (!imp.firstOfShot) {
        if (id === "tire" && rel > 5) {
          this.sfx("boing", 0.7, 260);
          this.fx.burst(this.fx.puff, 3, x, y);
        }
        if (id === "duck" && rel > 3) {
          this.fx.burst(this.fx.sparks, 3, x, y);
          if (rel > 7 && !nearHit) this.fx.word(this.copy.words.quack, x, y - 60, "#ffc83d", 54);
        }
      }
      if (rel > 13 && id !== "tire" && !this.ctx.reducedMotion) this.cameras.main.shake(130, 0.0035);
    } else if (rel > 8) {
      this.fx.burst(this.fx.puff, 3, x, y);
    }
  }

  private onScore(score: number) {
    this.hud.setScore(score, true);
    this.ctx.onEvent({ type: "score", score });
  }

  private freeze(ms: number) {
    this.freezeUntil = Math.max(this.freezeUntil, this.time.now + ms);
  }

  private onLoad(def: ProjectileDef, shot: number) {
    this.charged = this.aimPower >= 0.98;
    this.linaBubble.hide();
    const pos = this.pulledPosition();
    this.readyImage = this.add.image(pos.x, pos.y, def.tex).setDepth(8);
    this.readyPop.value = 0.2;
    this.tweens.add({ targets: this.readyPop, value: 1, duration: 300, ease: "Back.easeOut" });
    this.hud.showTag(def.id, AMMO.slice(shot), this.sim.launches.length === 0 ? this.copy.firstHint : undefined);
    this.sfx("load", 0.8);
    const text = this.copy.projectiles[def.id];
    this.ctx.onEvent({ type: "announce", message: this.copy.announce.next(text.name, text.tip) });
  }

  private tryFire() {
    if (!this.sim.canLaunch || !this.readyImage || this.aimPower < MIN_POWER) return;
    const def = this.sim.current!;
    const angle = Phaser.Math.Clamp(Math.round(this.aimAngle * 100), ANGLE_STEPS.min, ANGLE_STEPS.max);
    const power = Phaser.Math.Clamp(Math.round(this.aimPower * 1000), POWER_STEPS.min, POWER_STEPS.max);
    const body = this.sim.launch(angle, power);
    if (!body) return;
    this.aimAngle = angle / 100;
    this.aimPower = power / 1000;
    this.readyImage.destroy();
    this.readyImage = null;
    const sprite = this.addSprite(body, def.tex, def.material, 8);
    this.flyStart = this.time.now;
    this.bandSnap = this.time.now;
    const launches = this.sim.launches.length;
    this.fx.startTrail(def.id, sprite);
    this.fx.burst(this.fx.puff, 3, (BAND_BACK.x + BAND_FRONT.x) / 2, ANCHOR.y);
    this.sfx("launch", 0.6 + this.aimPower * 0.5);
    this.sfx("twang", 0.8);
    if (this.sim.wave === 0 && launches === 1) this.hud.hideBanner();
    this.decoBubble.hide();
    this.aimGfx.clear();
    this.hop(this.deco, 32);
    this.ctx.onEvent({ type: "launch" });
    if (launches === 1) this.ctx.onEvent({ type: "achievement", id: "first-launch" });
  }

  private onBurst(x: number, y: number, balloon: Matter.Body) {
    this.fx.stopTrail();
    this.sprites.get(balloon.id)?.destroy();
    this.sprites.delete(balloon.id);
    this.fx.burst(this.fx.drops, 30, x, y);
    this.fx.ring(x, y, 0x5cb9f0, 170);
    this.time.delayedCall(70, () => this.fx.ring(x, y, 0xa9dcf7, 110));
    this.cat.notifyImpact(x, y, 10);
    this.sfx("splash", 1);
    this.fx.word(this.copy.words.splash, x, y - 80, "#5cb9f0", 84, true);
    this.freeze(60);
    if (!this.ctx.reducedMotion) this.cameras.main.shake(170, 0.004);
  }

  private onShotEnd(hits: number, mess: number, nearest: number) {
    this.fx.stopTrail();
    if (hits > 0 || this.sim.finishing) return;
    if (nearest < 120) {
      this.decoSay(this.copy.nearMiss);
      this.sfx("nearMiss", 0.9);
    } else if (mess > 0) {
      this.decoSay(this.copy.messOnly);
      this.sfx("miss", 0.5);
    } else {
      this.decoSay(Phaser.Utils.Array.GetRandom(this.copy.missLines));
      this.sfx("miss", 0.8);
      if (!this.ctx.reducedMotion) {
        this.tweens.add({ targets: this.deco, angle: -8, scaleY: 0.94, duration: 160, yoyo: true, hold: 260, ease: "Sine.easeOut" });
      }
    }
  }

  private onHit(t: SimTargetState, shotHits: number, combo: boolean) {
    const body = t.body!;
    const sprite = this.sprites.get(body.id);
    const { x, y } = body.position;
    this.lastHit = { at: this.time.now, x, y };
    const gold = t.def.id === "golden-gnome";
    this.fx.popup(`+${t.def.points}`, x, y - 80, gold ? "#ffe39a" : "#ffc83d", gold ? 70 : 60, gold ? this.copy.words.gold : undefined);
    this.fx.burst(this.fx.stars, gold ? 16 : 10, x, y);
    this.fx.ring(x, y, gold ? 0xffc83d : 0xfffaf0, 100);
    this.flashBody(body);
    if (t.def.id === "flamingo") this.fx.burst(this.fx.feathers, 12, x, y);
    if (t.def.material === "wood") this.fx.burst(this.fx.splinters, 8, x, y);
    if (t.def.material === "ceramic") this.fx.burst(this.fx.sparks, 6, x, y);
    if (t.def.id === "mailbox") {
      this.fx.burst(this.fx.letters, 9, x, y - 10);
      this.sfx("rustle", 0.9);
    }
    if (t.def.id === "birdhouse") {
      sprite?.setTexture("birdhouse-empty");
      this.shadows.get(body.id)?.setTexture("birdhouse-empty");
      birdFlyOut(this, x + 4, y + 2, this.fx, this.ctx.reducedMotion, this.copy.words.tweet);
      this.sfx("tweet", 1);
    }
    this.sfx("target", 1);
    this.freeze(shotHits === 1 ? 50 : 30);
    this.arlindo.shout(this.copy.targets[t.def.id].shout);
    this.flyToHud(t, x, y);
    this.knocked.add(body.id);
    this.time.delayedCall(650, () => sprite?.active && sprite.setTint(KNOCKED_TINT));
    this.hop(this.lina, 24);
    let message = this.copy.announce.knocked(this.copy.targets[t.def.id].name, Boolean(t.def.fem), t.def.points);
    if (combo) {
      this.fx.word(this.copy.words.combo(shotHits), W / 2, 340, "#f06ba8", 96, true);
      this.fx.flash(0.3);
      this.freeze(90);
      this.sfx("combo", 1);
      this.decoSay(this.copy.comboShout, 1100);
      this.hop(this.deco, 36, 1);
      this.hop(this.lina, 36, 1);
      this.ctx.onEvent({ type: "achievement", id: "domino-effect" });
      message += this.copy.announce.combo(shotHits, SCORE.comboBonus);
    } else if (shotHits === 1) {
      this.linaSay(Phaser.Utils.Array.GetRandom(this.copy.hitLines));
    }
    this.ctx.onEvent({ type: "announce", message });
  }

  private onMess(points: number, x: number, y: number) {
    this.fx.popup(`+${points}`, x, y - 70, "#fbf5e6", 40, this.copy.words.mess);
    this.sfx("mess", 0.6, 80);
  }

  private onWaveCleared(wave: number, last: boolean) {
    this.time.delayedCall(380, () => this.fx.popup(`+${SCORE.waveBonus}`, W / 2, 470, "#9df0dc", 54, this.copy.words.roundClear));
    this.sfx("waveClear", 0.9);
    if (!last) this.ctx.onEvent({ type: "announce", message: this.copy.announce.roundClear(wave + 1, SCORE.waveBonus) });
  }

  private onInterlude(w: number, spent: Matter.Body[]) {
    if (this.aiming) {
      this.aiming = false;
      this.dragStart = null;
      this.aimAngle = this.savedAim.angle;
      this.aimPower = this.savedAim.power;
    }
    const def = this.copy.waves[WAVES[w].id];
    this.hud.setRound(w);
    this.hud.showBanner(this.copy.roundOf(w + 1, WAVES.length), def.title, def.subtitle, 1500);
    if (def.arlindo) this.time.delayedCall(250, () => this.arlindo.shout(def.arlindo!, 1500));
    this.cat.comeBack();
    for (const body of spent) {
      const sprite = this.sprites.get(body.id);
      this.sprites.delete(body.id);
      if (!sprite?.active) continue;
      this.fx.burst(this.fx.puff, 6, sprite.x, sprite.y);
      this.tweens.add({ targets: sprite, alpha: 0, scale: 0.6, duration: this.ctx.reducedMotion ? 80 : 260, onComplete: () => sprite.destroy() });
    }
    this.ctx.onEvent({ type: "announce", message: this.copy.announce.round(w + 1, WAVES.length, def.title, def.subtitle) });
  }

  private finish(tally: StreetTally) {
    const { won, score, stars, ammoBonus } = tally;
    this.fx.stopTrail();
    if (this.readyImage) {
      this.tweens.add({ targets: this.readyPop, value: 0, duration: 200 });
    }
    this.aimGfx.clear();
    this.hud.hideTag();
    this.hud.hideBanner();
    this.decoBubble.hide();
    this.linaBubble.hide();
    const achievements: string[] = [];
    if (won) achievements.push("street-win");
    if (stars === 3) achievements.push("three-stars");
    if (score >= SCORE.record) achievements.push("high-scorer");
    if (won) {
      this.sfx("victory", 1);
      this.fx.burst(this.fx.stars, 40, W / 2, 200);
      this.fx.flash(0.25);
      if (!this.ctx.reducedMotion) {
        this.hop(this.deco, 34, 3);
        this.hop(this.lina, 34, 3);
      }
      this.arlindo.shout(this.copy.arlindo.win, 2200);
    } else {
      this.sfx("defeat", 1);
      this.arlindo.shout(this.copy.arlindo.lose, 2000);
      this.tweens.add({ targets: [this.deco, this.lina], scaleY: 0.92, angle: -4, duration: 400, ease: "Sine.easeOut" });
    }
    const nextStar = stars === 1 ? SCORE.twoStars : stars === 2 ? SCORE.threeStars : 0;
    const text = this.copy.summary;
    const summary = [
      text.launches(tally.shots, AMMO.length),
      text.targets(tally.stats.targets, TARGETS.length),
      text.mess(tally.stats.mess, this.sim.props.length),
      nextStar ? text.nextStar(nextStar - score) : "",
    ]
      .filter(Boolean)
      .join(" ");
    const result: GameResult = {
      won,
      score,
      stars,
      breakdown: [
        { label: this.copy.breakdown.targets, value: tally.targetScore },
        { label: this.copy.breakdown.waves, value: tally.waveScore },
        { label: this.copy.breakdown.mess, value: tally.messScore },
        { label: this.copy.breakdown.combos, value: tally.comboScore },
        { label: this.copy.breakdown.ammo, value: ammoBonus },
      ].filter((row, i) => i === 0 || row.value !== 0),
      stats: { ...tally.stats, timeMs: Math.round(this.playMs) },
      replay: { kind: "street-launches", version: 1, launches: this.sim.launches.map((l) => ({ ...l })) },
      achievements,
      summary,
    };
    this.time.delayedCall(won ? 900 : 300, () => this.ctx.onEvent({ type: "finished", result }));
  }

  private drawBands() {
    const back = this.bandBack;
    const front = this.bandFront;
    back.clear();
    front.clear();
    let target = { x: ANCHOR.x, y: ANCHOR.y + 4 };
    const phase = this.sim.phase;
    const holding = this.readyImage && (phase === "ready" || phase === "interlude");
    if (holding && this.readyImage) {
      target = { x: this.readyImage.x, y: this.readyImage.y };
    } else if (this.time.now - this.bandSnap < 260) {
      const t = (this.time.now - this.bandSnap) / 260;
      const wob = Math.sin(t * Math.PI * 4) * (1 - t) * 26;
      target = { x: ANCHOR.x + wob, y: ANCHOR.y + 4 };
    }
    const stretch = Phaser.Math.Distance.Between(target.x, target.y, ANCHOR.x, ANCHOR.y);
    const thick = Phaser.Math.Clamp(14 - stretch / 22, 7, 14);
    const tension = holding ? this.aimPower : 0;
    const hot = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xef4f43),
      Phaser.Display.Color.ValueToColor(0xffc83d),
      100,
      Math.round(Math.max(0, tension - 0.5) * 200),
    );
    const frontColor = Phaser.Display.Color.GetColor(hot.r, hot.g, hot.b);
    back.lineStyle(thick + 6, 0x1d1830);
    back.lineBetween(BAND_BACK.x, BAND_BACK.y, target.x, target.y);
    back.lineStyle(thick, 0xc4352c);
    back.lineBetween(BAND_BACK.x, BAND_BACK.y, target.x, target.y);
    front.lineStyle(thick + 6, 0x1d1830);
    front.lineBetween(BAND_FRONT.x, BAND_FRONT.y, target.x, target.y);
    front.lineStyle(thick, frontColor);
    front.lineBetween(BAND_FRONT.x, BAND_FRONT.y, target.x, target.y);
    if (holding) {
      front.fillStyle(0x1d1830);
      front.fillRoundedRect(target.x - 18, target.y - 6, 22, 30, 6);
      front.fillStyle(0x7c4527);
      front.fillRoundedRect(target.x - 15, target.y - 3, 16, 24, 5);
    }
  }

  private drawSpeedLines(g: Phaser.GameObjects.Graphics) {
    const b = this.sim.flying;
    if (!b || this.sim.phase !== "flying") return;
    const age = this.time.now - this.flyStart;
    if (age > 340 || this.ctx.reducedMotion) return;
    const len = Math.hypot(b.velocity.x, b.velocity.y);
    if (len < 1) return;
    const nx = b.velocity.x / len;
    const ny = b.velocity.y / len;
    const fade = 1 - age / 340;
    g.lineStyle(6, 0x1d1830, fade);
    for (const off of [-22, 0, 22]) {
      const px = b.position.x - nx * 52 - ny * off;
      const py = b.position.y - ny * 52 + nx * off;
      const l = off === 0 ? 70 : 44;
      g.lineBetween(px, py, px - nx * l, py - ny * l);
    }
  }

  private drawAim() {
    const g = this.aimGfx;
    g.clear();
    const phase = this.sim.phase;
    const showing = (phase === "ready" || phase === "interlude") && this.readyImage;
    if (!showing || !this.readyImage) {
      this.drawSpeedLines(g);
      if (phase !== "attract") this.hud.setAim(null, null);
      return;
    }
    const pos = this.pulledPosition();
    const p = this.aimPower;
    const pop = this.readyPop.value;
    this.readyImage.setPosition(pos.x, pos.y);
    this.readyImage.setAngle(-this.aimAngle);
    this.readyImage.setScale((1 + p * 0.22) * pop, (1 - p * 0.14) * pop);
    this.hud.setAim(this.aimAngle, p);
    if (p < MIN_POWER || phase === "interlude") return;
    const vel = this.launchVelocity();
    const air = 1 - (this.sim.current?.frictionAir ?? 0.004);
    let x = pos.x;
    let y = pos.y;
    let vx = vel.x;
    let vy = vel.y;
    const steps = 58;
    for (let i = 1; i <= steps; i += 1) {
      vx *= air;
      vy = vy * air + GRAVITY_PER_STEP;
      x += vx;
      y += vy;
      if (y > GROUND_Y || x > W) break;
      if (i % 3 === 0) {
        const k = i / steps;
        const r = 9 - k * 4;
        g.fillStyle(0x1d1830, 0.9 - k * 0.5);
        g.fillCircle(x, y, r + 3);
        g.fillStyle(this.charged ? 0xffc83d : 0xff8a3d, 1 - k * 0.55);
        g.fillCircle(x, y, r);
      }
    }
  }

  update(_time: number, delta: number) {
    const phase = this.sim.phase;
    if (phase !== "attract" && phase !== "over") {
      this.playMs += delta;
      this.handleHeldKeys();
    }
    if (phase !== "attract") {
      if (this.time.now < this.freezeUntil) {
        this.acc = 0;
      } else {
        this.acc += Math.min(delta, 100);
        let steps = 0;
        while (this.acc >= STEP_MS && steps < 6) {
          this.acc -= STEP_MS;
          steps += 1;
          if (!this.sim.step()) {
            this.acc = 0;
            break;
          }
        }
        if (steps === 6) this.acc = 0;
      }
    }
    this.syncSprites();
    if (this.sim.phase === "flying" && this.sim.flying) this.cat.notifyFlyby(this.sim.flying.position.x, this.sim.flying.position.y);
    this.drawBands();
    this.drawAim();
  }

  private handleHeldKeys() {
    if (!this.aimable) return;
    if (this.time.now - this.holdSince < 230) return;
    const k = this.keys;
    const rate = this.game.loop.delta / 1000;
    let dAngle = 0;
    let dPower = 0;
    if (k.left.isDown || k.a.isDown) dAngle += 40 * rate;
    if (k.right.isDown || k.d.isDown) dAngle -= 40 * rate;
    if (k.up.isDown || k.w.isDown) dPower += 0.5 * rate;
    if (k.down.isDown || k.s.isDown) dPower -= 0.5 * rate;
    if (dAngle || dPower) this.adjustAim(dAngle, dPower);
  }
}
