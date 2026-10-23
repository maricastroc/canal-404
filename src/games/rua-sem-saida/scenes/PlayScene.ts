import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import {
  AMMO,
  ANCHOR,
  ANGLE_MAX,
  ANGLE_MIN,
  BAND_BACK,
  BAND_FRONT,
  GRAVITY_PER_STEP,
  GRAVITY_Y,
  GROUND_Y,
  H,
  MAX_PULL,
  MAX_SPEED,
  MIN_POWER,
  MIN_SPEED,
  PROJECTILES,
  PROPS,
  SCORE,
  STATICS,
  STEP_MS,
  TARGETS,
  W,
  WAGON,
  WAVES,
  type BodyDef,
  type ProjectileDef,
  type ProjectileId,
  type TargetDef,
} from "../config";
import { GAME_SFX, type GameSfx } from "../sounds";
import { Fx } from "./fx";
import { Arlindo, birdFlyOut, Cat, popLid } from "./neighborhood";
import { Bubble, Hud } from "./ui";

type Phase = "attract" | "ready" | "aiming" | "flying" | "settling" | "interlude" | "over";

type Pose = { x: number; y: number; angle: number };

type TargetState = {
  def: TargetDef;
  index: number;
  obj: Phaser.Physics.Matter.Image | null;
  rest: Pose | null;
  hit: boolean;
  active: boolean;
  armedAt: number;
};

type PropState = { def: BodyDef; obj: Phaser.Physics.Matter.Image; rest: Pose; messy: boolean; popped: boolean };

type Material = "ceramic" | "wood" | "metal" | "rubber" | "plastic" | "soft" | "water" | "squeaky" | "static";

type Impact = {
  a: MatterJS.BodyType;
  b: MatterJS.BodyType;
  rel: number;
  x: number;
  y: number;
  flying: boolean;
  other: MatterJS.BodyType | null;
};

const HIT_LINES = ["NA MOSCA!", "ISSO!", "BOA!", "EM CHEIO!"];
const MISS_LINES = ["ERREI!", "FOI O VENTO!", "OPS!", "MIRA TORTA!"];
const IMPACT_WORDS: Record<ProjectileId, string[]> = {
  tenis: ["PLOFT!", "TUM!", "PAF!"],
  balao: ["SPLASH!"],
  pneu: ["BONK!", "TÓIM!", "CRASH!"],
  pato: ["QUÉ!", "QUÉÉ!"],
};

export class PlayScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private phase: Phase = "attract";
  private acc = 0;
  private targets: TargetState[] = [];
  private props: PropState[] = [];
  private ammo: ProjectileId[] = [];
  private shot = 0;
  private wave = 0;
  private pendingWave: number | null = null;
  private current: ProjectileDef | null = null;
  private readyImage: Phaser.GameObjects.Image | null = null;
  private readyPop = { value: 1 };
  private flying: Phaser.Physics.Matter.Image | null = null;
  private flyingDef: ProjectileDef | null = null;
  private spent: Phaser.Physics.Matter.Image[] = [];
  private flyStart = 0;
  private slowSteps = 0;
  private pendingBurst = false;
  private shotHits = 0;
  private shotMess = 0;
  private shotNearest = Infinity;
  private shotImpacts = 0;
  private firstImpactAt = 0;
  private score = 0;
  private targetScore = 0;
  private messScore = 0;
  private comboScore = 0;
  private waveScore = 0;
  private highScore = 0;
  private aimAngle = 35;
  private aimPower = 0.5;
  private savedAim = { angle: 35, power: 0.5 };
  private dragStart: Phaser.Math.Vector2 | null = null;
  private materials = new Map<number, Material>();
  private targetByBody = new Map<number, TargetState>();
  private propByBody = new Map<number, PropState>();
  private pendingHits = new Set<TargetState>();
  private impacts: Impact[] = [];
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
  private finishing = false;
  private launches = 0;
  private charged = false;
  private keys!: Record<"left" | "right" | "up" | "down" | "a" | "d" | "w" | "s", Phaser.Input.Keyboard.Key>;
  private holdSince = 0;
  private aimAnnounce?: Phaser.Time.TimerEvent;
  private bandSnap = 0;

  constructor() {
    super("play");
  }

  init() {
    this.phase = "attract";
    this.acc = 0;
    this.targets = [];
    this.props = [];
    this.ammo = [...AMMO];
    this.shot = 0;
    this.wave = 0;
    this.pendingWave = null;
    this.current = null;
    this.readyImage = null;
    this.readyPop = { value: 1 };
    this.flying = null;
    this.flyingDef = null;
    this.spent = [];
    this.pendingBurst = false;
    this.shotHits = 0;
    this.shotMess = 0;
    this.shotNearest = Infinity;
    this.shotImpacts = 0;
    this.score = 0;
    this.targetScore = 0;
    this.messScore = 0;
    this.comboScore = 0;
    this.waveScore = 0;
    this.aimAngle = 35;
    this.aimPower = 0.5;
    this.dragStart = null;
    this.materials = new Map();
    this.targetByBody = new Map();
    this.propByBody = new Map();
    this.pendingHits = new Set();
    this.impacts = [];
    this.lastSound = new Map();
    this.lastHit = { at: -1000, x: 0, y: 0 };
    this.freezeUntil = 0;
    this.finishing = false;
    this.launches = 0;
    this.charged = false;
    this.bandSnap = 0;
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.highScore = (this.registry.get("highScore") as number | undefined) ?? this.ctx.highScore;
    const engine = this.matter.world.engine;
    engine.positionIterations = 10;
    engine.velocityIterations = 8;
    this.matter.world.autoUpdate = false;
    this.matter.world.setGravity(0, GRAVITY_Y);
    const reduced = this.ctx.reducedMotion;

    this.buildBackground();
    this.buildStatics();
    this.fx = new Fx(this, this.ctx.fonts, reduced);
    this.buildLevel();
    this.buildLauncher();
    this.arlindo = new Arlindo(this, this.ctx.fonts, reduced);
    this.cat = new Cat(this, this.ctx.fonts, this.fx, reduced, () => this.sfx("hiss", 0.9));
    this.decoBubble = new Bubble(this, this.ctx.fonts, "left", 36, 16);
    this.linaBubble = new Bubble(this, this.ctx.fonts, "left", 36, 16);
    this.hud = new Hud(this, this.ctx.fonts, TARGETS, reduced);
    this.hud.setRecord(this.highScore);
    this.targets.forEach((t) => (t.def.wave > 1 ? this.hud.lockTarget(t.index) : this.hud.revealTarget(t.index)));
    this.setupInput();
    this.setupCollisions();

    for (let i = 0; i < 90; i += 1) this.matter.world.step(STEP_MS);
    for (const t of this.targets) if (t.obj) t.rest = this.poseOf(t.obj);
    for (const p of this.props) p.rest = this.poseOf(p.obj);

    this.applyScale();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyScale, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.applyScale, this));

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
    if (this.phase !== "attract") return;
    this.hud.setRound(0);
    this.hud.showBanner(`RODADA 1 DE ${WAVES.length}`, WAVES[0].title, WAVES[0].subtitle, 2400);
    this.ctx.onEvent({
      type: "announce",
      message: `Partida iniciada. Rodada 1 de ${WAVES.length}: ${WAVES[0].subtitle}. Arraste para trás e solte, ou use as setas para mirar e espaço para lançar.`,
    });
    this.loadNext();
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

  private poseOf(obj: Phaser.Physics.Matter.Image): Pose {
    const body = obj.body as MatterJS.BodyType;
    return { x: body.position.x, y: body.position.y, angle: body.angle };
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

  private buildStatics() {
    for (const s of STATICS) {
      const body = this.matter.add.rectangle(s.x, s.y, s.w, s.h, {
        isStatic: true,
        label: s.label,
        friction: 0.9,
        restitution: 0.1,
      });
      this.materials.set(body.id, "static");
    }
  }

  private addBody(def: BodyDef, label: string, yOffset = 0) {
    const obj = this.matter.add.image(def.x, def.y + yOffset, def.tex, undefined, {
      shape: { type: "rectangle", width: def.w, height: def.h },
      chamfer: def.chamfer ? { radius: def.chamfer } : undefined,
      density: def.density,
      friction: def.friction ?? 0.7,
      frictionStatic: 1,
      restitution: def.restitution ?? 0.08,
      frictionAir: 0.008,
      label,
    });
    obj.setDepth(5);
    this.materials.set((obj.body as MatterJS.BodyType).id, def.material);
    return obj;
  }

  private buildLevel() {
    for (const def of PROPS) {
      const obj = this.addBody(def, `prop:${def.id}`);
      const state: PropState = { def, obj, rest: this.poseOf(obj), messy: false, popped: false };
      this.props.push(state);
      this.propByBody.set((obj.body as MatterJS.BodyType).id, state);
    }
    TARGETS.forEach((def, index) => {
      const state: TargetState = { def, index, obj: null, rest: null, hit: false, active: false, armedAt: 0 };
      this.targets.push(state);
      if (def.wave === 1) this.spawnTarget(state, false);
    });
  }

  private spawnTarget(t: TargetState, animate: boolean) {
    const obj = this.addBody(t.def, `target:${t.def.id}`, animate ? -36 : 0);
    t.obj = obj;
    t.active = true;
    t.rest = null;
    t.armedAt = animate ? this.time.now + 900 : 0;
    this.targetByBody.set((obj.body as MatterJS.BodyType).id, t);
    if (animate) {
      obj.setAlpha(0);
      this.tweens.add({ targets: obj, alpha: 1, duration: 220 });
      this.fx.burst(this.fx.puff, 6, t.def.x, t.def.y);
      this.fx.burst(this.fx.sparks, 5, t.def.x, t.def.y - 20);
      this.sfx("spawn", 0.9);
      this.hud.revealTarget(t.index);
    }
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
      if (this.phase !== "ready") return;
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
      if (this.phase !== "ready") return;
      this.savedAim = { angle: this.aimAngle, power: this.aimPower };
      this.dragStart = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
      this.phase = "aiming";
      this.aimPower = 0;
      this.charged = false;
      this.sfx("stretch", 0.6);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== "aiming" || !this.dragStart) return;
      this.setAimFromPull(pointer.worldX - this.dragStart.x, pointer.worldY - this.dragStart.y);
    });
    const release = () => {
      if (this.phase !== "aiming") return;
      this.dragStart = null;
      if (this.aimPower >= MIN_POWER) {
        this.phase = "ready";
        this.tryFire();
      } else {
        this.phase = "ready";
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
        message: `Ângulo ${Math.round(this.aimAngle)} graus, força ${Math.round(this.aimPower * 100)} por cento.`,
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

  private setupCollisions() {
    this.matter.world.on("collisionstart", (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        const a = pair.bodyA.parent ?? pair.bodyA;
        const b = pair.bodyB.parent ?? pair.bodyB;
        const rel = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
        const flyingBody = this.flying?.body as MatterJS.BodyType | undefined;
        const involvesFlying = Boolean(flyingBody && (a.id === flyingBody.id || b.id === flyingBody.id));
        if (involvesFlying && this.flyingDef?.id === "balao" && this.time.now - this.flyStart > 60) {
          this.pendingBurst = true;
        }
        if (involvesFlying && rel > 8 && this.phase === "flying") {
          const other = a.id === flyingBody!.id ? b : a;
          const target = this.targetByBody.get(other.id);
          if (target && !target.hit && target.rest) this.pendingHits.add(target);
        }
        if (rel < 2.2) continue;
        const support = pair.collision.supports?.[0];
        this.impacts.push({
          a,
          b,
          rel,
          x: support?.x ?? (a.position.x + b.position.x) / 2,
          y: support?.y ?? (a.position.y + b.position.y) / 2,
          flying: involvesFlying,
          other: involvesFlying ? (a.id === flyingBody!.id ? b : a) : null,
        });
      }
    });
  }

  private flashBody(body: MatterJS.BodyType) {
    const go = (body as MatterJS.BodyType & { gameObject?: Phaser.Physics.Matter.Image }).gameObject;
    if (!go || !go.active) return;
    go.setTintFill(0xffffff);
    this.time.delayedCall(70, () => go.active && go.clearTint());
  }

  private processImpacts() {
    if (!this.impacts.length) return;
    const list = this.impacts;
    this.impacts = [];
    const recentHit = this.time.now - this.lastHit.at < 160;
    for (const imp of list) {
      const { a, b, rel, x, y } = imp;
      const fast = a.isStatic ? b : b.isStatic ? a : a.speed > b.speed ? a : b;
      const material = this.materials.get(fast.id) ?? "soft";
      const volume = Phaser.Math.Clamp(rel / 14, 0.15, 1);
      this.cat.notifyImpact(x, y, rel);
      for (const prop of this.props) {
        if (prop.popped || prop.def.tex !== "trash-can") continue;
        const cb = prop.obj.body as MatterJS.BodyType;
        const direct = (a.id === cb.id || b.id === cb.id) && rel > 3.5;
        const topX = cb.position.x + Math.sin(cb.angle) * 54;
        const topY = cb.position.y - Math.cos(cb.angle) * 54;
        const jolt = rel > 5 && Phaser.Math.Distance.Between(x, y, topX, topY) < 95;
        if (direct || jolt) {
          prop.popped = true;
          popLid(this, prop.obj, this.fx, this.ctx.reducedMotion);
          this.sfx("clang", 1);
          if (!this.arlindo.busy) this.arlindo.shout("MINHA LATA!", 1300);
        }
      }
      if (material === "squeaky") {
        this.sfx("squeak", volume, 120);
      } else if (material !== "static" && material !== "water") {
        const map: Record<string, GameSfx> = { ceramic: "ceramic", wood: "wood", metal: "metal", rubber: "rubber", plastic: "wood", soft: "thud" };
        this.sfx(map[material] ?? "thud", volume, 70);
      }
      if (imp.flying && this.flyingDef) {
        this.shotImpacts += 1;
        if (!this.firstImpactAt) this.firstImpactAt = this.time.now;
        const id = this.flyingDef.id;
        const nearHit = recentHit && Phaser.Math.Distance.Between(x, y, this.lastHit.x, this.lastHit.y) < 180;
        const other = imp.other;
        if (other && !other.isStatic && rel > 7) this.flashBody(other);
        if (this.shotImpacts === 1 && rel > 5) {
          if (id === "tenis") {
            this.fx.burst(this.fx.puff, 5, x, y);
            this.fx.burst(this.fx.stink, 5, x, y - 20);
            this.sfx("stinky", 0.8);
          } else if (id === "pneu") {
            this.fx.burst(this.fx.puff, 8, x, y);
            this.sfx("bonk", volume + 0.2);
            if (!this.ctx.reducedMotion) this.cameras.main.shake(170, 0.005);
          } else if (id === "pato") {
            this.fx.burst(this.fx.sparks, 7, x, y);
          }
          if (id !== "balao" && !nearHit) this.fx.word(Phaser.Utils.Array.GetRandom(IMPACT_WORDS[id]), x, y - 80, "#ffc83d", 74);
          if (rel > 9) this.fx.ring(x, y, 0xfffaf0, 80);
        } else {
          if (id === "pneu" && rel > 5) {
            this.sfx("boing", 0.7, 260);
            this.fx.burst(this.fx.puff, 3, x, y);
          }
          if (id === "pato" && rel > 3) {
            this.fx.burst(this.fx.sparks, 3, x, y);
            if (rel > 7 && !nearHit) this.fx.word("QUÉ!", x, y - 60, "#ffc83d", 54);
          }
        }
        if (rel > 13 && id !== "pneu" && !this.ctx.reducedMotion) this.cameras.main.shake(130, 0.0035);
      } else if (rel > 8) {
        this.fx.burst(this.fx.puff, 3, x, y);
      }
    }
  }

  private addScore(points: number) {
    this.score += points;
    this.hud.setScore(this.score, true);
    this.ctx.onEvent({ type: "score", score: this.score });
  }

  private freeze(ms: number) {
    this.freezeUntil = Math.max(this.freezeUntil, this.time.now + ms);
  }

  private loadNext() {
    if (this.shot >= this.ammo.length) return;
    const def = PROJECTILES[this.ammo[this.shot]];
    this.shot += 1;
    this.current = def;
    this.charged = this.aimPower >= 0.98;
    this.linaBubble.hide();
    const pos = this.pulledPosition();
    this.readyImage = this.add.image(pos.x, pos.y, def.tex).setDepth(8);
    this.readyPop.value = 0.2;
    this.tweens.add({ targets: this.readyPop, value: 1, duration: 300, ease: "Back.easeOut" });
    this.phase = "ready";
    this.hud.showTag(def.id, this.ammo.slice(this.shot), this.launches === 0 ? "Puxe e solte! (ou setas + espaço)" : undefined);
    this.sfx("load", 0.8);
    this.ctx.onEvent({ type: "announce", message: `Próximo objeto: ${def.name}. ${def.tip}` });
  }

  private tryFire() {
    if (this.phase !== "ready" || !this.current || !this.readyImage) return;
    if (this.aimPower < MIN_POWER) return;
    const def = this.current;
    const pos = this.pulledPosition();
    const vel = this.launchVelocity();
    this.readyImage.destroy();
    this.readyImage = null;
    const obj = this.matter.add.image(pos.x, pos.y, def.tex, undefined, {
      shape: def.shape,
      chamfer: def.shape.type === "rectangle" ? { radius: 12 } : undefined,
      density: def.density,
      restitution: def.restitution,
      friction: def.friction,
      frictionAir: def.frictionAir,
      label: `projectile:${def.id}`,
    });
    obj.setDepth(8);
    obj.setVelocity(vel.x, vel.y);
    obj.setAngularVelocity(def.id === "tenis" ? 0.12 : def.id === "pato" ? -0.06 : 0.03);
    this.materials.set((obj.body as MatterJS.BodyType).id, def.material);
    this.flying = obj;
    this.flyingDef = def;
    this.flyStart = this.time.now;
    this.slowSteps = 0;
    this.shotHits = 0;
    this.shotMess = 0;
    this.shotNearest = Infinity;
    this.shotImpacts = 0;
    this.firstImpactAt = 0;
    this.pendingBurst = false;
    this.phase = "flying";
    this.bandSnap = this.time.now;
    this.launches += 1;
    this.fx.startTrail(def.id, obj);
    this.fx.burst(this.fx.puff, 3, (BAND_BACK.x + BAND_FRONT.x) / 2, ANCHOR.y);
    this.sfx("launch", 0.6 + this.aimPower * 0.5);
    this.sfx("twang", 0.8);
    if (this.wave === 0 && this.launches === 1) this.hud.hideBanner();
    this.decoBubble.hide();
    this.aimGfx.clear();
    this.hop(this.deco, 32);
    this.ctx.onEvent({ type: "launch" });
    if (this.launches === 1) this.ctx.onEvent({ type: "achievement", id: "primeiro-lancamento" });
  }

  private burstBalloon() {
    this.pendingBurst = false;
    const balloon = this.flying;
    if (!balloon) return;
    const body = balloon.body as MatterJS.BodyType;
    const { x, y } = body.position;
    const radius = 250;
    const all = [
      ...this.targets.filter((t) => t.obj).map((t) => t.obj as Phaser.Physics.Matter.Image),
      ...this.props.map((p) => p.obj),
      ...this.spent,
    ];
    for (const obj of all) {
      const b = obj.body as MatterJS.BodyType | null;
      if (!b) continue;
      const dx = b.position.x - x;
      const dy = b.position.y - y;
      const d = Math.hypot(dx, dy);
      if (d > radius || d < 1) continue;
      const strength = 0.032 * (1 - d / radius) * b.mass;
      const nx = dx / d;
      const ny = dy / d - 0.45;
      this.matter.body.applyForce(b, b.position, { x: nx * strength, y: ny * strength });
    }
    this.fx.stopTrail();
    balloon.destroy();
    this.flying = null;
    this.fx.burst(this.fx.drops, 30, x, y);
    this.fx.ring(x, y, 0x5cb9f0, 170);
    this.time.delayedCall(70, () => this.fx.ring(x, y, 0xa9dcf7, 110));
    this.cat.notifyImpact(x, y, 10);
    this.sfx("splash", 1);
    this.fx.word("SPLASH!", x, y - 80, "#5cb9f0", 84, true);
    this.freeze(60);
    if (!this.ctx.reducedMotion) this.cameras.main.shake(170, 0.004);
    this.time.delayedCall(450, () => this.endShot());
  }

  private shotReaction() {
    if (this.shotHits > 0 || this.finishing) return;
    if (this.shotNearest < 120) {
      this.decoSay("QUASE!!");
      this.sfx("nearMiss", 0.9);
    } else if (this.shotMess > 0) {
      this.decoSay("PELO MENOS\nFEZ BAGUNÇA!");
      this.sfx("miss", 0.5);
    } else {
      this.decoSay(Phaser.Utils.Array.GetRandom(MISS_LINES));
      this.sfx("miss", 0.8);
      if (!this.ctx.reducedMotion) {
        this.tweens.add({ targets: this.deco, angle: -8, scaleY: 0.94, duration: 160, yoyo: true, hold: 260, ease: "Sine.easeOut" });
      }
    }
  }

  private endShot() {
    if (this.phase !== "flying") return;
    this.fx.stopTrail();
    if (this.flying) {
      this.spent.push(this.flying);
      this.flying = null;
    }
    this.flyingDef = null;
    this.phase = "settling";
    this.shotReaction();
    if (this.finishing) return;
    if (this.pendingWave !== null) {
      this.time.delayedCall(450, () => this.startInterlude());
      return;
    }
    this.queueNextOrEnd(this.shotHits === 0 ? 650 : 380);
  }

  private queueNextOrEnd(delay = 380) {
    if (this.shot < this.ammo.length) {
      this.time.delayedCall(delay, () => {
        if (this.phase === "settling" && !this.finishing) this.loadNext();
      });
    } else {
      this.hud.setAim(null, null);
      this.time.delayedCall(2400, () => {
        if (!this.finishing) this.finish(false);
      });
    }
  }

  private hitTarget(t: TargetState) {
    if (!t.obj) return;
    t.hit = true;
    this.shotHits += 1;
    this.targetScore += t.def.points;
    this.addScore(t.def.points);
    const { x, y } = (t.obj.body as MatterJS.BodyType).position;
    this.lastHit = { at: this.time.now, x, y };
    const gold = t.def.id === "dourado";
    this.fx.popup(`+${t.def.points}`, x, y - 80, gold ? "#ffe39a" : "#ffc83d", gold ? 70 : 60, gold ? "OURO!" : undefined);
    this.fx.burst(this.fx.stars, gold ? 16 : 10, x, y);
    this.fx.ring(x, y, gold ? 0xffc83d : 0xfffaf0, 100);
    this.flashBody(t.obj.body as MatterJS.BodyType);
    if (t.def.id === "flamingo") this.fx.burst(this.fx.feathers, 12, x, y);
    if (t.def.material === "wood") this.fx.burst(this.fx.splinters, 8, x, y);
    if (t.def.material === "ceramic") this.fx.burst(this.fx.sparks, 6, x, y);
    if (t.def.id === "correio") {
      this.fx.burst(this.fx.letters, 9, x, y - 10);
      this.sfx("rustle", 0.9);
    }
    if (t.def.id === "passarinho") {
      t.obj.setTexture("birdhouse-empty");
      birdFlyOut(this, x + 4, y + 2, this.fx, this.ctx.reducedMotion);
      this.sfx("tweet", 1);
    }
    this.sfx("target", 1);
    this.freeze(this.shotHits === 1 ? 50 : 30);
    this.arlindo.shout(t.def.shout);
    this.hud.checkTarget(t.index);
    this.hop(this.lina, 24);
    let message = `${t.def.name} ${t.def.fem ? "derrubada" : "derrubado"}! Mais ${t.def.points} pontos.`;
    if (this.shotHits >= 2 && this.phase === "flying") {
      this.comboScore += SCORE.comboBonus;
      this.addScore(SCORE.comboBonus);
      this.fx.word(`COMBO x${this.shotHits}!`, W / 2, 340, "#f06ba8", 96, true);
      this.fx.flash(0.3);
      this.freeze(90);
      this.sfx("combo", 1);
      this.decoSay("COMBOOO!", 1100);
      this.hop(this.deco, 36, 1);
      this.hop(this.lina, 36, 1);
      this.ctx.onEvent({ type: "achievement", id: "efeito-domino" });
      message += ` Combo de ${this.shotHits}! Mais ${SCORE.comboBonus}.`;
    } else if (this.shotHits === 1) {
      this.linaSay(Phaser.Utils.Array.GetRandom(HIT_LINES));
    }
    this.ctx.onEvent({ type: "announce", message });
    const waveTargets = this.targets.filter((tt) => tt.def.wave === this.wave + 1);
    if (waveTargets.every((tt) => tt.hit)) this.onWaveCleared();
  }

  private onWaveCleared() {
    const next = this.wave + 1;
    this.waveScore += SCORE.waveBonus;
    this.addScore(SCORE.waveBonus);
    this.time.delayedCall(380, () => this.fx.popup(`+${SCORE.waveBonus}`, W / 2, 470, "#9df0dc", 54, "RODADA COMPLETA!"));
    this.sfx("waveClear", 0.9);
    if (next >= WAVES.length) {
      if (!this.finishing) {
        this.finishing = true;
        this.time.delayedCall(1300, () => this.finish(true));
      }
      return;
    }
    this.pendingWave = next;
    this.ctx.onEvent({ type: "announce", message: `Rodada ${this.wave + 1} completa! Mais ${SCORE.waveBonus} pontos.` });
    if (this.phase !== "flying") this.time.delayedCall(700, () => this.startInterlude());
  }

  private startInterlude() {
    if (this.pendingWave === null || this.finishing || this.phase === "over") return;
    const w = this.pendingWave;
    this.pendingWave = null;
    this.wave = w;
    if (this.phase === "aiming") {
      this.dragStart = null;
      this.aimAngle = this.savedAim.angle;
      this.aimPower = this.savedAim.power;
    }
    this.phase = "interlude";
    const def = WAVES[w];
    this.hud.setRound(w);
    this.hud.showBanner(`RODADA ${w + 1} DE ${WAVES.length}`, def.title, def.subtitle, 1500);
    if (def.arlindo) this.time.delayedCall(250, () => this.arlindo.shout(def.arlindo!, 1500));
    this.cat.comeBack();
    this.ctx.onEvent({ type: "announce", message: `Rodada ${w + 1} de ${WAVES.length}: ${def.title}. ${def.subtitle}.` });
    this.targets
      .filter((t) => t.def.wave === w + 1)
      .forEach((t, i) => this.time.delayedCall(420 + i * 260, () => this.spawnTarget(t, true)));
    this.time.delayedCall(1450, () => {
      if (this.phase !== "interlude") return;
      if (this.readyImage) {
        this.phase = "ready";
      } else {
        this.phase = "settling";
        this.queueNextOrEnd(0);
      }
    });
  }

  private checkWorld() {
    if (this.pendingHits.size) {
      for (const t of this.pendingHits) if (!t.hit) this.hitTarget(t);
      this.pendingHits.clear();
    }
    for (const t of this.targets) {
      if (!t.active || t.hit || !t.obj) continue;
      const b = t.obj.body as MatterJS.BodyType;
      if (!t.rest) {
        if (this.time.now >= t.armedAt) t.rest = this.poseOf(t.obj);
        continue;
      }
      const dist = Math.hypot(b.position.x - t.rest.x, b.position.y - t.rest.y);
      const turn = Math.abs(Phaser.Math.Angle.Wrap(b.angle - t.rest.angle));
      if (turn > 0.7 || dist > 44 || b.position.y > H + 80) this.hitTarget(t);
    }
    let messPoints = 0;
    let mx = 0;
    let my = 0;
    for (const p of this.props) {
      if (p.messy) continue;
      const b = p.obj.body as MatterJS.BodyType;
      const dist = Math.hypot(b.position.x - p.rest.x, b.position.y - p.rest.y);
      const turn = Math.abs(Phaser.Math.Angle.Wrap(b.angle - p.rest.angle));
      if (turn > 0.35 || dist > 26) {
        p.messy = true;
        messPoints += SCORE.messBonus;
        mx += b.position.x;
        my += b.position.y;
      }
    }
    if (messPoints > 0) {
      const n = messPoints / SCORE.messBonus;
      this.messScore += messPoints;
      this.shotMess += messPoints;
      this.addScore(messPoints);
      this.fx.popup(`+${messPoints}`, mx / n, my / n - 70, "#fbf5e6", 40, "BAGUNÇA");
      this.sfx("mess", 0.6, 80);
    }
    if (this.phase === "flying" && this.flying) {
      const b = this.flying.body as MatterJS.BodyType;
      this.cat.notifyFlyby(b.position.x, b.position.y);
      for (const t of this.targets) {
        if (!t.active || t.hit || !t.obj) continue;
        const tb = t.obj.body as MatterJS.BodyType;
        const d = Math.hypot(tb.position.x - b.position.x, tb.position.y - b.position.y);
        if (d < this.shotNearest) this.shotNearest = d;
      }
      const out = b.position.x < -160 || b.position.x > W + 160 || b.position.y > H + 160;
      this.slowSteps = b.speed < 0.6 ? this.slowSteps + 1 : 0;
      const settledAfterImpact = this.firstImpactAt > 0 && this.time.now - this.firstImpactAt > 2600;
      if (out || this.slowSteps > 26 || settledAfterImpact || this.time.now - this.flyStart > 7000) this.endShot();
    }
  }

  private finish(won: boolean) {
    if (this.phase === "over") return;
    this.finishing = true;
    this.phase = "over";
    this.fx.stopTrail();
    const unused = won ? this.ammo.length - this.shot + (this.readyImage ? 1 : 0) : 0;
    const ammoBonus = unused * SCORE.ammoBonus;
    if (ammoBonus > 0) this.addScore(ammoBonus);
    if (this.readyImage) {
      this.tweens.add({ targets: this.readyPop, value: 0, duration: 200 });
    }
    this.aimGfx.clear();
    this.hud.hideTag();
    this.hud.hideBanner();
    this.decoBubble.hide();
    this.linaBubble.hide();
    const stars = won ? (this.score >= SCORE.threeStars ? 3 : this.score >= SCORE.twoStars ? 2 : 1) : 0;
    const achievements: string[] = [];
    if (won) achievements.push("vitoria-rua");
    if (stars === 3) achievements.push("tres-estrelas");
    if (this.score >= SCORE.record) achievements.push("recordista");
    if (won) {
      this.sfx("victory", 1);
      this.fx.burst(this.fx.stars, 40, W / 2, 200);
      this.fx.flash(0.25);
      if (!this.ctx.reducedMotion) {
        this.hop(this.deco, 34, 3);
        this.hop(this.lina, 34, 3);
      }
      this.arlindo.shout("MEU JARDIM!!!", 2200);
    } else {
      this.sfx("defeat", 1);
      this.arlindo.shout("E NÃO VOLTEM!", 2000);
      this.tweens.add({ targets: [this.deco, this.lina], scaleY: 0.92, angle: -4, duration: 400, ease: "Sine.easeOut" });
    }
    const result: GameResult = {
      won,
      score: this.score,
      stars,
      breakdown: [
        { label: "Alvos derrubados", value: this.targetScore },
        { label: "Rodadas completas", value: this.waveScore },
        { label: "Bagunça no quintal", value: this.messScore },
        { label: "Combos", value: this.comboScore },
        { label: "Munição de sobra", value: ammoBonus },
      ],
      achievements,
    };
    this.time.delayedCall(won ? 900 : 300, () => this.ctx.onEvent({ type: "finished", result }));
  }

  private drawBands() {
    const back = this.bandBack;
    const front = this.bandFront;
    back.clear();
    front.clear();
    let target = { x: ANCHOR.x, y: ANCHOR.y + 4 };
    const holding = this.readyImage && (this.phase === "ready" || this.phase === "aiming" || this.phase === "interlude");
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
    if (!this.flying || this.phase !== "flying") return;
    const age = this.time.now - this.flyStart;
    if (age > 340 || this.ctx.reducedMotion) return;
    const b = this.flying.body as MatterJS.BodyType;
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
    const aiming = (this.phase === "ready" || this.phase === "aiming" || this.phase === "interlude") && this.readyImage;
    if (!aiming || !this.readyImage) {
      this.drawSpeedLines(g);
      if (this.phase !== "attract") this.hud.setAim(null, null);
      return;
    }
    const pos = this.pulledPosition();
    const p = this.aimPower;
    const pop = this.readyPop.value;
    this.readyImage.setPosition(pos.x, pos.y);
    this.readyImage.setAngle(-this.aimAngle);
    this.readyImage.setScale((1 + p * 0.22) * pop, (1 - p * 0.14) * pop);
    this.hud.setAim(this.aimAngle, p);
    if (p < MIN_POWER || this.phase === "interlude") return;
    const vel = this.launchVelocity();
    const air = 1 - (this.current?.frictionAir ?? 0.004);
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
    if (this.phase !== "attract" && this.phase !== "over") {
      this.handleHeldKeys();
    }
    if (this.phase !== "attract") {
      if (this.time.now < this.freezeUntil) {
        this.acc = 0;
      } else {
        this.acc += Math.min(delta, 100);
        let steps = 0;
        while (this.acc >= STEP_MS && steps < 6) {
          this.matter.world.step(STEP_MS);
          this.acc -= STEP_MS;
          steps += 1;
          if (this.pendingBurst) this.burstBalloon();
          if (this.phase !== "over") this.checkWorld();
          this.processImpacts();
        }
        if (steps === 6) this.acc = 0;
      }
    }
    this.drawBands();
    this.drawAim();
  }

  private handleHeldKeys() {
    if (this.phase !== "ready") return;
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
