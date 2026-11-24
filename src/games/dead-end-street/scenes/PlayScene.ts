import * as Phaser from "phaser";
import type { GameHostContext, GameResult, LevelRecord } from "@/games/types";
import type { Matter } from "@/lib/physics/matter";
import {
  ANCHOR,
  ANGLE_MAX,
  ANGLE_MIN,
  ARLINDO_WINDOW,
  BAND_BACK,
  BAND_FRONT,
  GRAVITY_PER_STEP,
  GROUND_Y,
  H,
  MAX_PULL,
  MAX_SPEED,
  MIN_POWER,
  MIN_SPEED,
  PROJECTILE_ORDER,
  SCORE,
  STEP_MS,
  W,
  WAGON,
  type ProjectileDef,
  type ProjectileId,
} from "../config";
import { COPY, type StreetCopy } from "../copy";
import { FULL_FRAME, type Frame, type FrameKind } from "../layout";
import { PHASES, type Material, type PhaseDef, type PieceDef, type Point } from "../phases";
import { ANGLE_STEPS, POWER_STEPS, StreetSim, type GadgetEvent, type SimImpact, type SimTarget, type StreetTally } from "../sim";
import { GAME_SFX, type GameSfx } from "../sounds";
import { eachKeyOnce } from "../../kit/keys";
import { StreetCamera, type CameraMode, type Pose, type Vec } from "./camera";
import { DockHud, type CoachStep } from "./dock";
import { currentFrame, watchFrame } from "./frame";
import { Fx } from "./fx";
import { GadgetView } from "./gadgets";
import { Arlindo, birdFlyOut, Cat, popLid } from "./neighborhood";
import { Bubble, Hud, targetArrow, type StreetHud } from "./ui";
import { decorate, drawStatics, plankTexture } from "./yard";

type SoundMaterial = Material | "soft" | "water" | "squeaky" | "rubber";

const SHADOW = { x: 5, y: 6, alpha: 0.26 };
const KNOCKED_TINT = 0xd4cddc;
const SOAKED_TINT = 0xa9dcf7;
const ANCHORS: Record<string, Point> = { parasol: { x: 145, y: 111 }, "sun-gnome": { x: 50, y: 74 } };
const TOUCH = { pull: 150, slop: 7, tapMs: 260, doubleTapMs: 340, doubleTapDist: 34 };
const CHASE = { flight: 200, aim: 340, action: 300, settle: 560, dwell: 900, zoom: 800, stick: 0.72 };
const LAUNCHER: Vec = { x: 120, y: 640 };
const SLING = { x: 215, y: 800, span: 430, size: 96 };
const HIGH_CLOUDS: [string, number, number][] = [
  ["cloud-b", 380, -230],
  ["cloud-a", 1350, -470],
  ["cloud-a", 640, -820],
  ["cloud-b", 1620, -1120],
  ["cloud-a", 260, -1400],
];

type KeptAims = { phase: number; shots: { angle: number; power: number }[] };

function stepFrom(value: number, steps: number) {
  return steps > 0 ? Math.floor(value + 1e-6) + steps : Math.ceil(value - 1e-6) + steps;
}

type Gesture =
  | { kind: "aim"; id: number; start: Vec; base: Vec; at: number; moved: boolean; saved: { angle: number; power: number } }
  | { kind: "pan"; id: number; start: Vec; last: Vec; at: number; moved: boolean }
  | { kind: "look"; mid: Vec; dist: number; zoom: number; anchor: Vec };

type CoachFlags = Record<CoachStep, boolean>;

const SFX_BY_MATERIAL: Record<SoundMaterial, GameSfx> = {
  ceramic: "ceramic",
  wood: "wood",
  metal: "metal",
  rubber: "rubber",
  plastic: "wood",
  cloth: "soft",
  concrete: "thud",
  glass: "ceramic",
  soft: "thud",
  water: "splash",
  squeaky: "squeak",
};

export class PlayScene extends Phaser.Scene {
  phaseIndex = 0;
  private phaseDef!: PhaseDef;
  private records: LevelRecord[] = [];
  private ctx!: GameHostContext;
  private copy!: StreetCopy;
  private sim!: StreetSim;
  private aiming = false;
  private acc = 0;
  private sprites = new Map<number, Phaser.GameObjects.Image>();
  private shadows = new Map<number, Phaser.GameObjects.Image>();
  private materials = new Map<number, SoundMaterial>();
  private knocked = new Set<number>();
  private popped = new Set<number>();
  private readyImage: Phaser.GameObjects.Image | null = null;
  private readyPop = { value: 1 };
  private flyStart = 0;
  private aimAngle = 35;
  private aimPower = 0.5;
  private savedAim = { angle: 35, power: 0.5 };
  private dragStart: Phaser.Math.Vector2 | null = null;
  private bandBack!: Phaser.GameObjects.Graphics;
  private bandFront!: Phaser.GameObjects.Graphics;
  private aimGfx!: Phaser.GameObjects.Graphics;
  private deco!: Phaser.GameObjects.Image;
  private lina!: Phaser.GameObjects.Image;
  private hud!: StreetHud;
  private dock: DockHud | null = null;
  private frame: Frame = FULL_FRAME;
  private uiCam: Phaser.Cameras.Scene2D.Camera | null = null;
  private slingCam: Phaser.Cameras.Scene2D.Camera | null = null;
  private slingMask: Phaser.GameObjects.Graphics | null = null;
  private slingRect = { x: 0, y: 0, w: 0, h: 0 };
  private camera!: StreetCamera;
  private touches = new Map<number, Vec>();
  private gesture: Gesture | null = null;
  private lastTap = { at: -1000, x: 0, y: 0 };
  private aimEnd: Vec = { x: ANCHOR.x, y: ANCHOR.y };
  private aimPath: number[] = [];
  private aimTouched = false;
  private intro = false;
  private introTimer?: Phaser.Time.TimerEvent;
  private spots: { x: number; y: number; at: number }[] = [];
  private aimTarget = -1;
  private lastAction = -1000;
  private fx!: Fx;
  private gadgets!: GadgetView;
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
  private heldAim = { angle: 0, power: 0 };
  private aimAnnounce?: Phaser.Time.TimerEvent;
  private bandSnap = 0;
  private playMs = 0;
  private doorLine = 0;

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
    this.doorLine = 0;
    this.dock = null;
    this.frame = FULL_FRAME;
    this.uiCam = null;
    this.slingCam = null;
    this.slingMask = null;
    this.touches = new Map();
    this.gesture = null;
    this.lastTap = { at: -1000, x: 0, y: 0 };
    this.aimEnd = { x: ANCHOR.x, y: ANCHOR.y };
    this.aimTouched = false;
    this.intro = false;
    this.spots = [];
    this.aimTarget = -1;
    this.lastAction = -1000;
    this.phaseIndex = Phaser.Math.Clamp((this.registry.get("phase") as number | undefined) ?? 0, 0, PHASES.length - 1);
    this.phaseDef = PHASES[this.phaseIndex];
    this.records = ((this.registry.get("records") as LevelRecord[] | undefined) ?? []).map((r) => ({ ...r }));
  }

  get isAttract() {
    return this.sim?.phase === "attract";
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.copy = COPY[this.ctx.locale];
    const reduced = this.ctx.reducedMotion;
    this.camera = new StreetCamera(this.cameras.main, reduced);
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.routeObject, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.routeObject, this));
    this.frame = currentFrame(this);
    this.setupCameras(this.frame);

    this.buildBackground();
    decorate(this, this.phaseIndex, this.copy, this.ctx.fonts);
    drawStatics(this, this.phaseDef);
    this.fx = new Fx(this, this.ctx.fonts, reduced);
    this.sim = new StreetSim(this.phaseDef, {
      load: (def) => this.onLoad(def),
      select: (def) => this.onSelect(def),
      impact: (imp) => this.onImpact(imp),
      hit: (t, shotHits, combo) => this.onHit(t, shotHits, combo),
      mess: (points, x, y) => this.onMess(points, x, y),
      score: (score) => this.onScore(score),
      burst: (x, y, balloon) => this.onBurst(x, y, balloon),
      gadget: (event) => this.onGadget(event),
      shotEnd: (shot) => this.onShotEnd(shot.hits, shot.mess, shot.nearest),
      vanish: (body) => this.onVanish(body),
      outOfAmmo: () => this.hud.setAim(null, null),
      finish: (tally) => this.finish(tally),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.sim.destroy());
    this.buildLevel();
    this.camera.setBounds(this.levelBounds());
    this.gadgets = new GadgetView(this, this.sim, this.fx, reduced);
    this.buildLauncher();
    this.arlindo = new Arlindo(this, this.ctx.fonts, reduced, this.phaseDef.act === 1 ? "calm" : this.phaseDef.act === 2 ? "angry" : "furious", this.fx);
    this.cat = new Cat(this, this.ctx.fonts, this.fx, reduced, () => this.sfx("hiss", 0.9), this.copy.words.hiss);
    this.decoBubble = new Bubble(this, this.ctx.fonts, "left", 36, 16);
    this.linaBubble = new Bubble(this, this.ctx.fonts, "left", 36, 16);
    this.hud = this.makeHud(this.frame.kind);
    this.hud.setBest(this.records[this.phaseIndex]?.score ?? 0);
    this.hud.setLaunches(0);
    this.setupInput();

    watchFrame(this, (frame) => this.applyFrame(frame));

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

  private get tall() {
    return this.frame.kind === "tall";
  }

  private makeHud(kind: FrameKind): StreetHud {
    if (kind === "tall") {
      const dock = new DockHud({
        scene: this,
        fonts: this.ctx.fonts,
        phase: this.phaseDef,
        index: this.phaseIndex,
        total: PHASES.length,
        reduced: this.ctx.reducedMotion,
        locale: this.ctx.locale,
        handlers: {
          onPick: (id) => this.pick(id),
          onStep: (kind, dir) => this.stepAim(kind, dir),
          onFire: () => this.tryFire(),
          onView: () => this.toggleView(),
        },
        mount: (obj) => {
          if (this.uiCam) obj.cameraFilter = this.cameras.main.id | (this.slingCam?.id ?? 0);
        },
      });
      this.dock = dock;
      return dock;
    }
    this.dock = null;
    const touch = Boolean(this.sys.game.device.input.touch);
    return new Hud(this, this.ctx.fonts, this.phaseDef, this.phaseIndex, PHASES.length, this.ctx.reducedMotion, this.ctx.locale, touch, (id) => this.pick(id));
  }

  private routeObject(obj: Phaser.GameObjects.GameObject) {
    this.uiCam?.ignore(obj);
  }

  private setupCameras(frame: Frame) {
    const main = this.cameras.main;
    if (frame.kind === "tall") {
      if (!this.uiCam) {
        this.slingCam = this.cameras.add(0, 0, 10, 10).setName("sling").setVisible(false).setBackgroundColor("#a9e0fa");
        this.uiCam = this.cameras.add(0, 0, frame.width, frame.height).setName("ui");
        for (const obj of this.children.list) this.uiCam.ignore(obj);
      }
      this.uiCam.setSize(frame.width, frame.height);
      this.placeSling(frame);
      main.setBackgroundColor("#7ccaf3");
      return;
    }
    main.setBackgroundColor("rgba(0,0,0,0)");
    if (!this.uiCam) return;
    this.cameras.remove(this.uiCam);
    this.uiCam = null;
    if (this.slingCam) this.cameras.remove(this.slingCam);
    this.slingCam = null;
    const clear = (list: Phaser.GameObjects.GameObject[]) => {
      for (const obj of list) {
        obj.cameraFilter = 0;
        if (obj instanceof Phaser.GameObjects.Container) clear(obj.list);
      }
    };
    clear(this.children.list);
  }

  private placeSling(frame: Frame) {
    const cam = this.slingCam;
    if (!cam) return;
    const k = frame.unit;
    const st = frame.stage;
    const d = Math.min(SLING.size, (st.w / k) * 0.26) * k;
    const x = st.x + 8 * k + frame.safe.left;
    const y = st.y + 8 * k;
    cam.setViewport(x, y, d, d);
    cam.setZoom(d / SLING.span);
    cam.centerOn(SLING.x, SLING.y);
    if (!this.slingMask) this.slingMask = this.make.graphics({}, false);
    const g = this.slingMask;
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(x + d / 2, y + d / 2, d / 2);
    cam.setMask(g.createGeometryMask(), true);
    this.slingRect = { x, y, w: d, h: d };
  }

  private applyFrame(frame: Frame) {
    const rebuilt = this.hud.kind !== frame.kind;
    if (rebuilt) {
      this.hud.destroy();
      this.decoBubble.hide();
      this.linaBubble.hide();
      this.endGesture();
    }
    this.frame = frame;
    this.setupCameras(frame);
    this.camera.apply(frame, !rebuilt && this.sim.phase !== "attract");
    if (rebuilt) this.hud = this.makeHud(frame.kind);
    this.hud.layout(frame, this.scale.displayScale.x);
    if (rebuilt) this.syncHud();
    this.scaleUi();
    if (this.tall && (this.sim.phase === "attract" || this.intro)) this.camera.set(this.camera.overviewPose());
    this.dock?.setView(this.camera.mode);
    if (this.tall && rebuilt && !this.intro) this.nextCoach();
  }

  private syncHud() {
    const hud = this.hud;
    hud.setBest(this.records[this.phaseIndex]?.score ?? 0);
    hud.setLaunches(this.sim.launches.length);
    hud.setScore(this.sim.score, false);
    for (const t of this.sim.targets) if (t.hit) hud.checkTarget(t.index);
    if (this.sim.current && this.readyImage) hud.setAmmo(this.sim.current.id, this.sim.stock);
    else hud.setAmmo(null, this.sim.stock);
  }

  private scaleUi() {
    if (this.tall) {
      this.fx.scale = 1;
      this.arlindo.setScale(1);
      this.arlindo.voice = (text, duration, face) => this.dock?.say("arlindo", text, duration, face);
      return;
    }
    this.arlindo.voice = null;
    const s = this.hud.uiScale;
    this.fx.scale = s;
    this.arlindo.setScale(s);
    this.decoBubble.setBaseScale(Math.min(s, 1.5));
    this.linaBubble.setBaseScale(Math.min(s, 1.5));
  }

  setRecords(records: LevelRecord[]) {
    this.records = records.map((r) => ({ ...r }));
    this.hud?.setBest(this.records[this.phaseIndex]?.score ?? 0);
  }

  begin() {
    if (this.sim.phase !== "attract") return;
    const text = this.copy.phases[this.phaseDef.id];
    const kicker = `${this.copy.phaseOf(this.phaseIndex + 1, PHASES.length)} · ${this.copy.hud.act(this.phaseDef.act)}`;
    const tall = this.tall;
    this.hud.showBanner(kicker, text.title, text.goal, tall ? 2300 : 2600);
    const start = tall ? this.copy.touch.start : this.copy.announce.start;
    this.ctx.onEvent({ type: "announce", message: start(this.phaseIndex + 1, PHASES.length, text.title, text.goal) });
    if (tall) {
      this.intro = true;
      this.camera.mode = "auto";
      this.camera.set(this.camera.overviewPose());
      this.dock?.setView("auto");
      this.introTimer = this.time.delayedCall(2300, () => this.endIntro(true));
    }
    this.time.delayedCall(700, () => this.arlindo.shout(text.arlindo, 1900));
    this.sim.start();
    this.sim.targets.forEach((t, i) => this.time.delayedCall(500 + i * 220, () => this.cueTarget(t)));
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
    const back = this.add.graphics().setDepth(-1);
    back.fillGradientStyle(0x5fb3ec, 0x5fb3ec, 0x7ccaf3, 0x7ccaf3, 1);
    back.fillRect(-W, -2200, W * 3, 2200);
    back.fillStyle(0xd8a066, 1);
    back.fillRect(-W, H, W * 3, 1400);
    for (const [key, x, y] of HIGH_CLOUDS) this.add.image(x, y, key).setDepth(1);
    this.add.image(0, 0, "houses").setOrigin(0).setDepth(2);
    this.add.image(0, 0, "yard").setOrigin(0).setDepth(3);
  }

  private textureFor(def: PieceDef) {
    if (this.textures.exists(def.tex)) return def.tex;
    const w = def.shape.type === "box" ? def.shape.w : 40;
    const h = def.shape.type === "box" ? def.shape.h : 40;
    return plankTexture(this, `${def.tex}-${w}x${h}`, w, h, def.tex === "door" ? "door" : "plank");
  }

  private addSprite(body: Matter.Body, tex: string, material: SoundMaterial, offset: Point = { x: 0, y: 0 }, depth = 5) {
    const sprite = this.add.image(body.position.x, body.position.y, tex).setRotation(body.angle).setDepth(depth);
    const anchor = ANCHORS[tex];
    if (anchor || offset.x || offset.y) {
      const ax = anchor?.x ?? sprite.width / 2;
      const ay = anchor?.y ?? sprite.height / 2;
      sprite.setOrigin((ax + offset.x) / sprite.width, (ay + offset.y) / sprite.height);
    }
    this.sprites.set(body.id, sprite);
    this.materials.set(body.id, material);
    return sprite;
  }

  private buildLevel() {
    for (const p of this.sim.pieces) this.addSprite(p.body, this.textureFor(p.def), p.def.material, p.offset, p.def.fixed ? 4.8 : 5);
    for (const t of this.sim.targets) {
      const sprite = this.addSprite(t.body, this.textureFor(t.def), t.def.material, t.offset);
      this.shadows.set(t.body.id, this.add.image(sprite.x + SHADOW.x, sprite.y + SHADOW.y, sprite.texture.key).setOrigin(sprite.originX, sprite.originY).setTintFill(0x1d1830).setAlpha(SHADOW.alpha).setDepth(4.9));
    }
  }

  private cueTarget(t: SimTarget) {
    if (t.hit || this.sim.finishing) return;
    const sprite = this.sprites.get(t.body.id);
    const x = t.body.position.x;
    const y = t.body.position.y - (sprite ? sprite.displayHeight * sprite.originY : 50) - 40;
    const g = targetArrow(this, 48, t.def.kind === "soak").setDepth(13);
    const scale = this.tall ? Math.max(1.35, 24 / (38 * this.camera.cssPerWorld())) : Math.min(this.hud.uiScale, 1.3) * 1.35;
    const tip = y + 11 * scale;
    g.setPosition(x, tip).setScale(scale);
    const fade = () => this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(1300, fade);
      return;
    }
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 140 });
    this.tweens.add({ targets: g, y: tip - 12, duration: 300, yoyo: true, repeat: 1, ease: "Sine.easeInOut", onComplete: fade });
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

  private flyToHud(t: SimTarget, x: number, y: number) {
    if (this.dock) {
      this.dock.flyStar(t.index, this.camera.toScreen(x, y));
      return;
    }
    if (this.ctx.reducedMotion) {
      this.hud.checkTarget(t.index);
      return;
    }
    const to = this.hud.iconPoint(t.index);
    const token = this.add.image(x, y, "icon-star").setDepth(21).setDisplaySize(58, 58);
    this.tweens.add({ targets: token, angle: 220, duration: 560, delay: 140 });
    this.tweens.add({
      targets: token,
      x: to.x,
      y: to.y,
      displayWidth: 32,
      displayHeight: 32,
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
    if (this.dock) {
      this.dock.say("deco", text, duration);
      return;
    }
    this.linaBubble.hide();
    this.decoBubble.say(text, 70, 610, duration);
  }

  private linaSay(text: string, duration = 1100) {
    if (this.dock) {
      this.dock.say("lina", text, duration);
      return;
    }
    this.decoBubble.hide();
    this.linaBubble.say(text, 470, 650, duration);
  }

  private get aimable() {
    return this.sim.phase === "ready" && !this.aiming;
  }

  private availableKinds() {
    return PROJECTILE_ORDER.filter((id) => (this.phaseDef.ammo[id] ?? 0) > 0);
  }

  private pick(id: ProjectileId) {
    if (this.aiming || this.sim.stock[id] <= 0) return;
    this.sim.select(id);
    if (this.tall && this.coachDone("ammo")) this.nextCoach();
  }

  private cycleAmmo() {
    const kinds = this.availableKinds().filter((id) => this.sim.stock[id] > 0);
    if (kinds.length < 2 || !this.sim.current) return;
    const i = kinds.indexOf(this.sim.current.id);
    this.pick(kinds[(i + 1) % kinds.length]);
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
    kb.on("keydown", eachKeyOnce((event) => {
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
      const slot = ["1", "2", "3", "4"].indexOf(key);
      if (slot >= 0) {
        const id = this.availableKinds()[slot];
        if (id) this.pick(id);
        return;
      }
      if (key === "q" || key === "tab") {
        event.preventDefault();
        this.cycleAmmo();
        return;
      }
      const map: Record<string, [number, number]> = {
        arrowleft: [1, 0],
        a: [1, 0],
        arrowright: [-1, 0],
        d: [-1, 0],
        arrowup: [0, 1],
        w: [0, 1],
        arrowdown: [0, -1],
        s: [0, -1],
      };
      const step = map[key];
      if (step && !event.repeat) {
        const size = event.shiftKey ? 5 : 1;
        this.holdSince = this.time.now;
        this.heldAim = { angle: 0, power: 0 };
        this.nudgeAim(step[0] * size, step[1] * size);
      }
    }));

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.tall) {
        this.touchDown(pointer, over);
        return;
      }
      if (!this.aimable || over.length) return;
      this.savedAim = { angle: this.aimAngle, power: this.aimPower };
      this.dragStart = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
      this.aiming = true;
      this.aimPower = 0;
      this.charged = false;
      this.sfx("stretch", 0.6);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.tall) {
        this.touchMove(pointer);
        return;
      }
      if (!this.aiming || !this.dragStart) return;
      this.setAimFromPull(pointer.worldX - this.dragStart.x, pointer.worldY - this.dragStart.y);
    });
    const release = (pointer: Phaser.Input.Pointer) => {
      if (this.tall) {
        this.touchUp(pointer);
        return;
      }
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
    const settle = () => {
      this.endGesture();
      this.dock?.stopHold();
    };
    this.events.on(Phaser.Scenes.Events.PAUSE, settle);
    this.events.on(Phaser.Scenes.Events.RESUME, settle);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.PAUSE, settle);
      this.events.off(Phaser.Scenes.Events.RESUME, settle);
    });
  }

  private touchDown(pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) {
    if (over.length || this.sim.phase === "attract" || !this.camera.inStage(pointer.x, pointer.y)) return;
    const at = { x: pointer.x, y: pointer.y };
    this.touches.set(pointer.id, at);
    this.skipIntro();
    if (this.touches.size >= 2) {
      this.startLook();
      return;
    }
    if (this.gesture) return;
    if (this.sim.phase === "ready" && this.readyImage && !this.sim.finishing && !this.camera.navigating) {
      const rad = Phaser.Math.DegToRad(this.aimAngle);
      const len = this.aimPower * MAX_PULL;
      this.gesture = { kind: "aim", id: pointer.id, start: at, base: { x: -Math.cos(rad) * len, y: Math.sin(rad) * len }, at: this.time.now, moved: false, saved: { angle: this.aimAngle, power: this.aimPower } };
      return;
    }
    this.gesture = { kind: "pan", id: pointer.id, start: at, last: at, at: this.time.now, moved: false };
  }

  private startLook() {
    const [a, b] = [...this.touches.values()];
    const g = this.gesture;
    if (g?.kind === "aim" && g.moved) {
      this.aimAngle = g.saved.angle;
      this.aimPower = g.saved.power;
    }
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    this.gesture = { kind: "look", mid, dist: Math.max(1, Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y)), zoom: this.camera.pose.zoom, anchor: this.camera.toWorld(mid.x, mid.y) };
    this.camera.stop();
    this.setCameraMode("free");
  }

  private touchMove(pointer: Phaser.Input.Pointer) {
    if (!this.touches.has(pointer.id)) return;
    const at = { x: pointer.x, y: pointer.y };
    this.touches.set(pointer.id, at);
    const g = this.gesture;
    if (!g) return;
    if (g.kind === "look") {
      if (this.touches.size < 2) return;
      const [a, b] = [...this.touches.values()];
      const dist = Math.max(1, Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y));
      this.camera.zoomAt((g.zoom * dist) / g.dist, (a.x + b.x) / 2, (a.y + b.y) / 2, g.anchor);
      return;
    }
    if (pointer.id !== g.id) return;
    if (!g.moved && Math.hypot(at.x - g.start.x, at.y - g.start.y) < TOUCH.slop * this.frame.unit) return;
    if (g.kind === "pan") {
      if (this.camera.mode === "overview") {
        g.moved = true;
        return;
      }
      if (!g.moved) {
        g.moved = true;
        this.camera.stop();
        if (this.camera.mode === "auto") this.setCameraMode("free");
      }
      this.camera.panBy(at.x - g.last.x, at.y - g.last.y);
      g.last = at;
      return;
    }
    if (!g.moved) {
      g.moved = true;
      this.sfx("stretch", 0.6);
      if (this.dock?.coaching === "ammo") this.coachDone("ammo");
    }
    this.dragAim(g, at);
  }

  private dragAim(g: Extract<Gesture, { kind: "aim" }>, at: Vec) {
    if (this.sim.phase !== "ready" || !this.readyImage) return;
    const gain = MAX_PULL / (TOUCH.pull * this.frame.unit);
    const px = g.base.x + (at.x - g.start.x) * gain;
    const py = g.base.y + (at.y - g.start.y) * gain;
    let angle = Phaser.Math.RadToDeg(Math.atan2(py, -px));
    if (angle > 135) angle = ANGLE_MAX;
    else if (angle < -135) angle = ANGLE_MIN;
    angle = Phaser.Math.Clamp(angle, ANGLE_MIN, ANGLE_MAX);
    const len = Phaser.Math.Clamp(Math.hypot(px, py), MIN_POWER * MAX_PULL, MAX_PULL);
    const rad = Phaser.Math.DegToRad(angle);
    const fit = { x: -Math.cos(rad) * len, y: Math.sin(rad) * len };
    if (Math.hypot(fit.x - px, fit.y - py) > 0.5) {
      g.base = fit;
      g.start = at;
    }
    const before = this.aimPower;
    this.aimAngle = Math.round(angle);
    this.aimPower = Phaser.Math.Clamp(Math.round((len / MAX_PULL) * 100) / 100, MIN_POWER, 1);
    if (Math.floor(before * 6) !== Math.floor(this.aimPower * 6)) this.sfx("stretch", 0.25 + this.aimPower * 0.4, 60);
    this.aimTouched = true;
    this.checkCharge();
    this.scheduleAimAnnounce();
  }

  private touchUp(pointer: Phaser.Input.Pointer) {
    if (!this.touches.delete(pointer.id)) return;
    const g = this.gesture;
    if (!g) return;
    if (g.kind === "look") {
      if (this.touches.size === 0) this.gesture = null;
      return;
    }
    if (pointer.id !== g.id) return;
    this.gesture = null;
    if (g.kind === "aim" && g.moved) {
      this.coachDone("aim");
      this.nextCoach();
      return;
    }
    if (!g.moved && this.time.now - g.at < TOUCH.tapMs) this.tapped(pointer);
  }

  private tapped(p: Vec) {
    const now = this.time.now;
    if (this.camera.mode === "overview" || this.camera.mode === "inspect") {
      const near = Phaser.Math.Distance.Between(p.x, p.y, this.lastTap.x, this.lastTap.y) < TOUCH.doubleTapDist * this.frame.unit;
      if (this.camera.mode === "inspect" && now - this.lastTap.at < TOUCH.doubleTapMs && near) {
        this.lastTap.at = -1000;
        this.toggleView();
        return;
      }
      this.lastTap = { at: now, x: p.x, y: p.y };
      if (this.camera.mode === "overview") this.inspect(this.camera.toWorld(p.x, p.y));
      return;
    }
    const near = Phaser.Math.Distance.Between(p.x, p.y, this.lastTap.x, this.lastTap.y) < TOUCH.doubleTapDist * this.frame.unit;
    if (now - this.lastTap.at < TOUCH.doubleTapMs && near) {
      this.lastTap.at = -1000;
      this.toggleView();
      return;
    }
    this.lastTap = { at: now, x: p.x, y: p.y };
  }

  private endGesture() {
    this.touches.clear();
    this.gesture = null;
  }

  private stepAim(kind: "angle" | "power", dir: 1 | -1) {
    if (this.sim.phase !== "ready" || !this.readyImage || this.aiming) return;
    if (kind === "angle") this.aimAngle = Phaser.Math.Clamp(stepFrom(this.aimAngle, dir), ANGLE_MIN, ANGLE_MAX);
    else this.aimPower = Phaser.Math.Clamp(stepFrom(this.aimPower * 100, dir) / 100, MIN_POWER, 1);
    this.aimTouched = true;
    this.sfx("stretch", 0.3, 50);
    this.checkCharge();
    this.scheduleAimAnnounce();
    if (this.coachDone("aim")) this.nextCoach();
  }

  private setCameraMode(mode: CameraMode) {
    this.camera.mode = mode;
    this.dock?.setView(mode);
    this.dock?.setNavHint(mode === "overview" ? this.copy.touch.nav.overview : mode === "inspect" ? this.copy.touch.nav.inspect : null);
    this.dock?.setNavigating(this.camera.navigating);
    if (mode !== "overview") this.dock?.setMarks([]);
  }

  private inspect(at: Vec) {
    this.setCameraMode("inspect");
    this.camera.animateTo(this.camera.inspectPose(at), 480);
  }

  private levelBounds() {
    let minX = 0;
    let maxX = 560;
    const add = (x: number, half: number) => {
      minX = Math.min(minX, x - half);
      maxX = Math.max(maxX, x + half);
    };
    for (const p of [...this.sim.pieces, ...this.sim.targets]) {
      const b = p.body.bounds;
      add((b.min.x + b.max.x) / 2, (b.max.x - b.min.x) / 2);
    }
    for (const st of this.phaseDef.statics) add(st.x, st.w / 2);
    for (const g of this.phaseDef.gadgets) {
      if (g.type === "rope") add(g.anchor.x, 20);
      if (g.type === "faucet") add(g.nozzle.x, 30);
    }
    if (this.phaseDef.targets.some((t) => t.name === "birdhouse")) add(1818, 60);
    const left = Math.max(0, minX - 60);
    const right = Math.min(W, maxX + 80);
    return { x: left, y: 0, w: right - left, h: H };
  }

  private toggleView() {
    if (!this.tall) return;
    if (this.intro) {
      this.skipIntro();
      return;
    }
    const cam = this.camera;
    if (cam.mode === "auto") {
      this.setCameraMode("overview");
      cam.animateTo(cam.overviewPose(), 520);
      return;
    }
    this.setCameraMode("auto");
    cam.animateTo(this.autoChase().pose, 520);
  }

  private endIntro(beat = false) {
    if (!this.intro) return;
    this.introTimer?.remove();
    this.introTimer = undefined;
    if (beat && !this.ctx.reducedMotion) {
      this.camera.animateTo(this.camera.home(), 850, () => {
        this.hop(this.deco, 26);
        this.hop(this.lina, 22);
        this.introTimer = this.time.delayedCall(700, () => this.endIntro());
      });
      return;
    }
    this.intro = false;
    this.setCameraMode("auto");
    this.camera.animateTo(this.aimFrame(), 900, () => this.nextCoach());
  }

  private skipIntro() {
    if (!this.intro) return;
    this.hud.hideBanner();
    this.endIntro();
  }

  private get coachFlags(): CoachFlags {
    let flags = this.registry.get("coach") as CoachFlags | undefined;
    if (!flags) {
      flags = { ammo: false, aim: false, fire: false, follow: false };
      this.registry.set("coach", flags);
    }
    return flags;
  }

  private coachDone(step: CoachStep) {
    const flags = this.coachFlags;
    if (flags[step]) return false;
    flags[step] = true;
    return true;
  }

  private nextCoach() {
    const dock = this.dock;
    if (!dock) return;
    if (this.intro || this.sim.phase !== "ready" || !this.readyImage || this.sim.finishing) {
      if (dock.coaching && dock.coaching !== "follow") dock.coach(null);
      return;
    }
    const flags = this.coachFlags;
    let step: CoachStep | null = null;
    if (this.availableKinds().length > 1 && !flags.ammo) step = "ammo";
    else if (!flags.aim) step = "aim";
    else if (!flags.fire && this.aimTouched) step = "fire";
    if (step === dock.coaching || (step === null && dock.coaching === "follow")) return;
    dock.coach(step);
  }

  private spot(x: number, y: number) {
    this.spots.push({ x, y, at: this.time.now });
  }

  private viewPoint(fx: number, fy: number): Vec {
    const v = this.camera.visible();
    return { x: v.x + v.w * fx, y: v.y + v.h * fy };
  }

  private pinIfHidden(key: string, x: number, y: number, kind: "star" | "gadget") {
    if (!this.dock || this.camera.inView(x, y, 30)) return;
    this.dock.pin(key, this.camera.toScreen(x, y), kind);
  }

  private actionFocus(now: number): Vec | null {
    this.spots = this.spots.filter((s) => now - s.at < 1000);
    let sx = 0;
    let sy = 0;
    let sw = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    const add = (x: number, y: number, w: number) => {
      sx += x * w;
      sy += y * w;
      sw += w;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    };
    for (const body of this.sim.engine.world.bodies) {
      if (body.isStatic || body.speed < 1.4) continue;
      add(body.position.x, body.position.y, Math.min(body.speed, 12));
    }
    for (const s of this.spots) add(s.x, s.y, 10);
    if (sw === 0) return null;
    const latest = this.spots[this.spots.length - 1];
    if (latest && maxX - minX > this.camera.visible().w * 0.9) return { x: latest.x, y: latest.y };
    return { x: sx / sw, y: sy / sw };
  }

  private aimFrame(): Pose {
    const path = this.aimPath;
    const end = { x: this.aimEnd.x, y: this.aimEnd.y };
    let apex: Vec = end;
    for (let i = 1; i < path.length; i += 2) if (path[i] < apex.y) apex = { x: path[i - 1], y: path[i] };
    const closest = (t: SimTarget) => {
      let d = Infinity;
      let at: Vec = end;
      const tx = t.body.position.x;
      const ty = t.body.position.y;
      for (let i = 0; i < path.length; i += 2) {
        const dd = (path[i] - tx) ** 2 + (path[i + 1] - ty) ** 2;
        if (dd < d) {
          d = dd;
          at = { x: path[i], y: path[i + 1] };
        }
      }
      return { d, at };
    };
    let pick: SimTarget | null = null;
    let pickD = Infinity;
    for (const t of this.sim.targets) {
      if (t.hit) continue;
      const { d } = closest(t);
      if (d < pickD) {
        pickD = d;
        pick = t;
      }
    }
    const held = this.sim.targets[this.aimTarget];
    if (held && !held.hit && pick && pick !== held && pickD > closest(held).d * CHASE.stick) pick = held;
    this.aimTarget = pick ? pick.index : -1;
    if (!pick) return this.camera.frameAim([end, LAUNCHER, apex]);
    const near = closest(pick).at;
    const target = { x: pick.body.position.x, y: pick.body.position.y - 50 };
    return this.camera.frameAim([near, target, LAUNCHER, apex]);
  }

  private activeBox(): Vec[] {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    for (const body of this.sim.engine.world.bodies) {
      if (body.isStatic || body.speed < 1.4) continue;
      minX = Math.min(minX, body.position.x);
      maxX = Math.max(maxX, body.position.x);
      minY = Math.min(minY, body.position.y);
    }
    if (minX === Infinity) return [];
    return [
      { x: minX, y: minY - 40 },
      { x: maxX, y: minY - 40 },
    ];
  }

  private autoChase(): { pose: Pose; ms: number; zoomMs: number } {
    const cam = this.camera;
    const sim = this.sim;
    const now = this.time.now;
    const flying = sim.phase === "flying" ? sim.flying : null;
    if (flying) {
      this.lastAction = now;
      return { pose: cam.frameFlight(flying.position, flying.velocity), ms: CHASE.flight, zoomMs: CHASE.zoom };
    }
    const ready = sim.phase === "ready" && this.readyImage !== null;
    if (ready && this.aimTouched) return { pose: this.aimFrame(), ms: CHASE.aim, zoomMs: CHASE.zoom };
    const focus = this.actionFocus(now);
    if (focus) {
      this.lastAction = now;
      return { pose: cam.frameAction([focus, ...this.activeBox()]), ms: CHASE.action, zoomMs: CHASE.zoom };
    }
    if (ready && now - this.lastAction > CHASE.dwell) return { pose: this.aimFrame(), ms: CHASE.settle, zoomMs: CHASE.zoom };
    return { pose: cam.pose, ms: CHASE.settle, zoomMs: CHASE.zoom };
  }

  private updateTall(delta: number) {
    const cam = this.camera;
    if (!cam.update(delta) && !this.intro && cam.mode === "auto" && this.gesture?.kind !== "look") {
      const { pose, ms, zoomMs } = this.autoChase();
      cam.chase(pose, delta, ms, zoomMs);
    }
    const dock = this.dock;
    if (!dock) return;
    const b = this.sim.phase === "flying" ? this.sim.flying : null;
    if (b && !cam.inView(b.position.x, b.position.y, 10)) dock.pin("shot", cam.toScreen(b.position.x, b.position.y), "shot", this.sim.flyingDef?.tex, true);
    else dock.unpin("shot");
    const sling = this.sim.phase === "ready" && this.readyImage !== null && cam.mode === "auto" && !this.intro && !cam.inView(ANCHOR.x - 70, ANCHOR.y, 0);
    this.slingCam?.setVisible(sling);
    dock.setInset(sling ? this.slingRect : null);
    if (cam.navigating) {
      const at = cam.toScreen(ANCHOR.x, ANCHOR.y - 70);
      dock.pin("sling-nav", at, "sling", this.sim.current?.tex, true, cam.inView(ANCHOR.x, ANCHOR.y - 70, 10));
    } else {
      dock.unpin("sling-nav");
    }
    if (cam.mode === "overview") {
      const marks: Vec[] = [];
      for (const t of this.sim.targets) if (!t.hit) marks.push(cam.toScreen(t.body.position.x, t.body.position.y - (this.sprites.get(t.body.id)?.displayHeight ?? 80) / 2));
      dock.setMarks(marks);
    }
    dock.update(this.time.now);
    const ready = this.sim.canLaunch && this.readyImage !== null && this.aimPower >= MIN_POWER && !this.intro && !cam.navigating;
    dock.setFire(ready ? "ready" : this.sim.phase === "over" ? "off" : "wait");
  }

  private checkCharge() {
    if (this.aimPower >= 0.98 && !this.charged) {
      this.charged = true;
      this.sfx("charge", 0.8);
    } else if (this.aimPower < 0.9) {
      this.charged = false;
    }
  }

  private nudgeAim(angleSteps: number, powerSteps: number) {
    if (angleSteps) this.aimAngle = Phaser.Math.Clamp(stepFrom(this.aimAngle, angleSteps), ANGLE_MIN, ANGLE_MAX);
    if (powerSteps) this.aimPower = Phaser.Math.Clamp(stepFrom(this.aimPower * 100, powerSteps) / 100, MIN_POWER, 1);
    this.aimTouched = true;
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
    this.aimAngle = Phaser.Math.Clamp(Math.round(angle), ANGLE_MIN, ANGLE_MAX);
    const before = this.aimPower;
    this.aimPower = Math.round((len / MAX_PULL) * 100) / 100;
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
    for (const piece of this.sim.pieces) {
      const cb = piece.body;
      if (this.popped.has(cb.id) || piece.def.tex !== "trash-can") continue;
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
    if (material === "squeaky") this.sfx("squeak", volume, 120);
    else if (material !== "water") this.sfx(SFX_BY_MATERIAL[material] ?? "thud", volume, 70);
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
          this.shake(170, 0.005);
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
      if (rel > 13 && id !== "tire") this.shake(130, 0.0035);
    } else if (rel > 8) {
      this.fx.burst(this.fx.puff, 3, x, y);
    }
  }

  private shake(ms: number, amount: number) {
    if (this.ctx.reducedMotion) return;
    this.cameras.main.shake(ms, this.tall ? amount * 0.4 : amount);
  }

  private onScore(score: number) {
    this.hud.setScore(score, true);
    this.ctx.onEvent({ type: "score", score });
  }

  private freeze(ms: number) {
    this.freezeUntil = Math.max(this.freezeUntil, this.time.now + ms);
  }

  private showAmmo(def: ProjectileDef, hint?: string) {
    this.hud.setAmmo(def.id, this.sim.stock, hint);
    const text = this.copy.projectiles[def.id];
    this.ctx.onEvent({ type: "announce", message: this.copy.announce.ammo(text.name, text.tip, this.sim.stock[def.id]) });
  }

  private onLoad(def: ProjectileDef) {
    const kept = this.keptAims().shots[this.sim.launches.length];
    if (kept) {
      this.aimAngle = kept.angle;
      this.aimPower = kept.power;
    }
    this.charged = this.aimPower >= 0.98;
    this.linaBubble.hide();
    const pos = this.pulledPosition();
    this.readyImage = this.add.image(pos.x, pos.y, def.tex).setDepth(8);
    this.readyPop.value = 0.2;
    this.tweens.add({ targets: this.readyPop, value: 1, duration: 300, ease: "Back.easeOut" });
    const first = this.sim.launches.length === 0;
    const kinds = this.availableKinds().length;
    this.showAmmo(def, first ? (kinds > 1 ? this.hud.swapHint : this.copy.firstHint) : undefined);
    this.hud.popTag();
    this.sfx("load", 0.8);
    this.aimTouched = false;
    this.nextCoach();
  }

  private keptAims(): KeptAims {
    const kept = this.registry.get("kept-aims") as KeptAims | undefined;
    return kept?.phase === this.phaseIndex ? kept : { phase: this.phaseIndex, shots: [] };
  }

  private keepAim(shot: number) {
    const kept = this.keptAims();
    kept.shots[shot] = { angle: this.aimAngle, power: this.aimPower };
    this.registry.set("kept-aims", kept);
  }

  private onSelect(def: ProjectileDef) {
    if (this.readyImage) {
      this.readyImage.setTexture(def.tex);
      this.readyPop.value = 0.4;
      this.tweens.add({ targets: this.readyPop, value: 1, duration: 260, ease: "Back.easeOut" });
    }
    this.showAmmo(def);
    this.sfx("load", 0.6);
  }

  private tryFire() {
    if (!this.sim.canLaunch || !this.readyImage || this.aimPower < MIN_POWER) return;
    if (this.tall && (this.intro || this.camera.navigating)) return;
    const def = this.sim.current!;
    const angle = Phaser.Math.Clamp(Math.round(this.aimAngle * 100), ANGLE_STEPS.min, ANGLE_STEPS.max);
    const power = Phaser.Math.Clamp(Math.round(this.aimPower * 1000), POWER_STEPS.min, POWER_STEPS.max);
    const body = this.sim.launch(angle, power, def.id);
    if (!body) return;
    this.aimAngle = angle / 100;
    this.aimPower = power / 1000;
    this.keepAim(this.sim.launches.length - 1);
    this.readyImage.destroy();
    this.readyImage = null;
    const sprite = this.addSprite(body, def.tex, def.material, { x: 0, y: 0 }, 8);
    this.flyStart = this.time.now;
    this.bandSnap = this.time.now;
    const launches = this.sim.launches.length;
    this.hud.setLaunches(launches);
    this.hud.setAmmo(def.id, this.sim.stock);
    this.fx.startTrail(def.id, sprite);
    this.fx.burst(this.fx.puff, 3, (BAND_BACK.x + BAND_FRONT.x) / 2, ANCHOR.y);
    this.sfx("launch", 0.6 + this.aimPower * 0.5);
    this.sfx("twang", 0.8);
    if (launches === 1) this.hud.hideBanner();
    this.decoBubble.hide();
    this.aimGfx.clear();
    this.hop(this.deco, 32);
    if (this.dock) {
      this.endGesture();
      if (this.camera.mode === "free") this.setCameraMode("auto");
      this.coachDone("ammo");
      this.coachDone("aim");
      this.coachDone("fire");
      if (this.coachDone("follow")) this.dock.coach("follow");
      else if (this.dock.coaching !== "follow") this.dock.coach(null);
    }
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
    this.spot(x, y);
    this.sfx("splash", 1);
    this.fx.word(this.copy.words.splash, x, y - 80, "#5cb9f0", 84, true);
    this.freeze(60);
    this.shake(170, 0.004);
  }

  private onVanish(body: Matter.Body) {
    const sprite = this.sprites.get(body.id);
    this.sprites.delete(body.id);
    if (!sprite?.active) return;
    this.fx.burst(this.fx.puff, 5, sprite.x, sprite.y);
    this.tweens.add({ targets: sprite, alpha: 0, scale: 0.5, duration: this.ctx.reducedMotion ? 80 : 240, onComplete: () => sprite.destroy() });
  }

  private onGadget(event: GadgetEvent) {
    const words = this.copy.words;
    const arl = this.copy.arlindo;
    const popup = () => this.time.delayedCall(240, () => this.fx.popup(`+${SCORE.gadgetBonus}`, event.x, event.y - 120, "#9df0dc", 44, words.gadget));
    this.spot(event.x, event.y);
    this.pinIfHidden(`gadget-${event.type}`, event.x, event.y, "gadget");
    switch (event.type) {
      case "rope-cut":
        this.gadgets.snapRope(event.rope);
        this.fx.word(words.ropeCut, event.x, event.y - 70, "#ffc83d", 70, true);
        this.fx.burst(this.fx.splinters, 6, event.x, event.y);
        this.sfx("twang", 1);
        popup();
        if (!this.arlindo.busy) this.arlindo.shout(arl.ropeCut, 1300);
        break;
      case "bucket-spill":
        this.fx.burst(this.fx.drops, 34, event.x, event.y);
        this.fx.ring(event.x, event.y, 0x5cb9f0, 150);
        this.fx.word(words.bucket, event.x, event.y - 90, "#5cb9f0", 74, true);
        this.sfx("splash", 1);
        popup();
        if (!this.arlindo.busy) this.arlindo.shout(arl.bucket, 1300);
        break;
      case "faucet-on":
        this.fx.word(words.faucet, event.x, event.y - 80, "#5cb9f0", 66, true);
        this.fx.burst(this.fx.sparks, 6, event.x, event.y);
        this.sfx("splash", 0.7);
        this.sfx("rustle", 0.6);
        popup();
        if (!this.arlindo.busy) this.arlindo.shout(arl.faucet, 1400);
        break;
      case "blower-off":
        this.fx.word(words.blowerOff, event.x, event.y - 90, "#ff8a3d", 66, true);
        this.fx.burst(this.fx.sparks, 10, event.x, event.y);
        this.fx.burst(this.fx.puff, 6, event.x, event.y);
        this.sfx("metal", 1);
        popup();
        if (!this.arlindo.busy) this.arlindo.shout(arl.blowerOff, 1400);
        break;
      case "turnstile-turn":
        this.sfx("wood", 0.8);
        this.time.delayedCall(250, () => this.fx.word(words.door, event.x, event.y - 120, "#f7ecd4", 50, true));
        this.arlindo.press();
        if (!this.arlindo.busy && !this.sim.finishing) {
          this.arlindo.shout(arl.door[this.doorLine % arl.door.length], 900);
          this.doorLine += 1;
        }
        this.ctx.onEvent({ type: "announce", message: this.copy.announce.door, transient: true });
        return;
    }
    const what = this.copy.gadgetNames[event.type];
    this.ctx.onEvent({ type: "announce", message: this.copy.announce.gadget(what, SCORE.gadgetBonus) });
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

  private onHit(t: SimTarget, shotHits: number, combo: boolean) {
    const body = t.body;
    const sprite = this.sprites.get(body.id);
    const { x, y } = body.position;
    const chain = this.sim.phase !== "flying";
    this.lastHit = { at: this.time.now, x, y };
    this.spot(x, y);
    this.pinIfHidden(`hit-${t.index}`, x, y, "star");
    const gold = t.def.name === "golden-gnome";
    const giant = t.def.name === "giant-gnome";
    this.fx.popup(`+${t.def.points}`, x, y - 80, gold || giant ? "#ffe39a" : "#ffc83d", gold || giant ? 70 : 60, gold ? this.copy.words.gold : undefined);
    this.fx.burst(this.fx.stars, gold || giant ? 18 : 10, x, y);
    this.fx.ring(x, y, gold ? 0xffc83d : 0xfffaf0, giant ? 180 : 100);
    if (t.def.kind === "soak") {
      this.fx.burst(this.fx.drops, 18, x, y - 20);
      this.fx.word(this.copy.words.soaked, x, y - 120, "#5cb9f0", 56, true);
      sprite?.setTint(SOAKED_TINT);
      if (sprite && !this.ctx.reducedMotion) this.tweens.add({ targets: sprite, x: sprite.x + 4, duration: 50, yoyo: true, repeat: 7 });
      this.sfx("splash", 0.6);
    } else {
      this.flashBody(body);
    }
    if (t.def.name === "flamingo") this.fx.burst(this.fx.feathers, 12, x, y);
    if (t.def.material === "wood") this.fx.burst(this.fx.splinters, 8, x, y);
    if (t.def.material === "ceramic" && t.def.kind === "knock") this.fx.burst(this.fx.sparks, 6, x, y);
    if (t.def.name === "mailbox") {
      this.fx.burst(this.fx.letters, 9, x, y - 10);
      this.sfx("rustle", 0.9);
    }
    if (t.def.name === "birdhouse") {
      sprite?.setTexture("birdhouse-empty");
      this.shadows.get(body.id)?.setTexture("birdhouse-empty");
      birdFlyOut(this, x + 4, y + 2, this.fx, this.ctx.reducedMotion, this.copy.words.tweet);
      this.sfx("tweet", 1);
    }
    if (giant) {
      this.fx.word(this.copy.words.timber, x, y - 200, "#ef4f43", 96, true);
      this.fx.flash(0.35);
      this.freeze(120);
      this.shake(420, 0.008);
    }
    this.sfx("target", 1);
    this.freeze(shotHits === 1 ? 50 : 30);
    this.arlindo.shout(this.copy.targets[t.def.name].shout);
    this.flyToHud(t, x, y);
    if (t.def.kind === "knock") {
      this.knocked.add(body.id);
      this.time.delayedCall(650, () => sprite?.active && sprite.setTint(KNOCKED_TINT));
    }
    this.hop(this.lina, 24);
    const name = this.copy.targets[t.def.name].name;
    let message = t.def.kind === "soak" ? this.copy.announce.soaked(name, t.def.points) : this.copy.announce.knocked(name, t.def.points);
    if (combo) {
      const at = this.tall ? this.viewPoint(0.5, 0.3) : { x: W / 2, y: 340 };
      this.fx.word(this.copy.words.combo(shotHits), at.x, at.y, "#f06ba8", 96, true);
      this.fx.flash(0.3);
      this.freeze(90);
      this.sfx("combo", 1);
      this.decoSay(this.copy.comboShout, 1100);
      this.hop(this.deco, 36, 1);
      this.hop(this.lina, 36, 1);
      this.ctx.onEvent({ type: "achievement", id: "domino-effect" });
      message += this.copy.announce.combo(shotHits, SCORE.comboBonus);
    } else if (chain) {
      this.linaSay(this.copy.chainShout);
    } else if (shotHits === 1) {
      this.linaSay(Phaser.Utils.Array.GetRandom(this.copy.hitLines));
    }
    this.ctx.onEvent({ type: "announce", message });
  }

  private onMess(points: number, x: number, y: number) {
    this.fx.popup(`+${points}`, x, y - 70, "#fbf5e6", 40, this.copy.words.mess);
    this.sfx("mess", 0.6, 80);
  }

  private campaignStars(stars: number) {
    return PHASES.reduce((sum, _, i) => sum + Math.max(this.records[i]?.stars ?? 0, i === this.phaseIndex ? stars : 0), 0);
  }

  private finish(tally: StreetTally) {
    const { won, score, stars } = tally;
    const finale = won && this.phaseIndex === PHASES.length - 1;
    this.fx.stopTrail();
    if (this.readyImage) this.tweens.add({ targets: this.readyPop, value: 0, duration: 200 });
    this.aimGfx.clear();
    this.hud.hideTag();
    this.hud.hideBanner();
    this.decoBubble.hide();
    this.linaBubble.hide();
    this.dock?.coach(null);
    if (this.tall) this.endGesture();
    if (this.tall && finale) {
      this.setCameraMode("free");
      this.camera.animateTo({ x: ARLINDO_WINDOW.x + ARLINDO_WINDOW.w / 2, y: this.camera.restY(), zoom: this.camera.playZoom }, 800);
    }
    const top = this.tall ? this.viewPoint(0.5, 0.2) : { x: W / 2, y: 200 };
    const totalStars = this.campaignStars(stars);
    const achievements: string[] = [];
    if (won && stars === 3) achievements.push("three-stars");
    if (finale) achievements.push("street-win");
    if (totalStars === PHASES.length * 3) achievements.push("high-scorer");
    const phaseText = this.copy.phases[this.phaseDef.id];
    if (won) {
      this.sfx("victory", 1);
      this.fx.burst(this.fx.stars, 40, top.x, top.y);
      this.fx.flash(0.25);
      if (!this.ctx.reducedMotion) {
        this.hop(this.deco, 34, finale ? 6 : 3);
        this.hop(this.lina, 34, finale ? 6 : 3);
      }
      if (finale) {
        this.sfx("splash", 1);
        this.arlindo.surrender(this.copy.arlindo.finale);
        this.time.delayedCall(900, () => {
          const at = this.tall ? this.viewPoint(0.5, 0.25) : { x: W / 2, y: 260 };
          this.fx.burst(this.fx.stars, 50, at.x, at.y);
        });
      } else {
        this.arlindo.shout(this.copy.arlindo.win[this.phaseIndex] ?? this.copy.arlindo.win[0], 2000);
      }
    } else {
      this.sfx("defeat", 1);
      this.arlindo.shout(this.copy.arlindo.lose, 2000);
      this.tweens.add({ targets: [this.deco, this.lina], scaleY: 0.92, angle: -4, duration: 400, ease: "Sine.easeOut" });
    }
    const previous = this.records[this.phaseIndex] ?? { stars: 0, score: 0 };
    if (won) this.records[this.phaseIndex] = { stars: Math.max(previous.stars, stars), score: Math.max(previous.score, score) };
    this.registry.set("records", this.records.map((r) => ({ ...r })));
    const text = this.copy.summary;
    const summary = [text.launches(tally.stats.launches), text.targets(tally.stats.targets, this.phaseDef.targets.length), text.campaign(totalStars, PHASES.length * 3)].join(" ");
    const par = this.phaseDef.par;
    const result: GameResult = {
      won,
      score,
      stars,
      level: { index: this.phaseIndex, id: this.phaseDef.id, title: phaseText.title, total: PHASES.length },
      copy: finale
        ? { title: this.copy.result.finaleTitle, text: this.copy.result.finaleText }
        : won
          ? { title: this.copy.result.winTitle, text: this.copy.result.winText(phaseText.title) }
          : { title: this.copy.result.loseTitle, text: this.copy.result.loseText },
      breakdown: [
        { label: this.copy.breakdown.targets, value: tally.targetScore },
        { label: this.copy.breakdown.mess, value: tally.messScore },
        { label: this.copy.breakdown.combos, value: tally.comboScore },
        { label: this.copy.breakdown.gadgets, value: tally.gadgetScore },
        { label: this.copy.breakdown.clear, value: tally.clearBonus },
        { label: this.copy.breakdown.ammo, value: tally.ammoBonus },
      ].filter((row, i) => i === 0 || row.value !== 0),
      stats: { ...tally.stats, timeMs: Math.round(this.playMs) },
      replay: { kind: "street-launches", version: 2, launches: this.sim.launches.map((l) => ({ ...l })) },
      achievements,
      summary,
      ...(won && stars < 3 ? { starHint: stars === 1 ? this.copy.starHintTwo(par[0], par[1]) : this.copy.starHint(par[0]) } : {}),
    };
    this.time.delayedCall(finale ? 3600 : won ? 1100 : 400, () => this.ctx.onEvent({ type: "finished", result }));
  }

  private drawBands() {
    const back = this.bandBack;
    const front = this.bandFront;
    back.clear();
    front.clear();
    let target = { x: ANCHOR.x, y: ANCHOR.y + 4 };
    const phase = this.sim.phase;
    const holding = this.readyImage && phase === "ready";
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
    const showing = phase === "ready" && this.readyImage;
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
    if (p < MIN_POWER) return;
    const vel = this.launchVelocity();
    const air = 1 - (this.sim.current?.frictionAir ?? 0.004);
    const grow = this.tall ? 1.7 : 1;
    const every = this.tall ? 2 : 3;
    const path = this.aimPath;
    path.length = 0;
    let x = pos.x;
    let y = pos.y;
    let vx = vel.x;
    let vy = vel.y;
    let endX = x;
    let endY = y;
    const steps = 58;
    for (let i = 1; i <= steps; i += 1) {
      vx *= air;
      vy = vy * air + GRAVITY_PER_STEP;
      x += vx;
      y += vy;
      if (y > GROUND_Y || x > W) break;
      endX = x;
      endY = y;
      path.push(x, y);
      if (i % every === 0) {
        const k = i / steps;
        const r = (9 - k * 4) * grow;
        g.fillStyle(0x1d1830, 0.9 - k * 0.5);
        g.fillCircle(x, y, r + 3);
        if (grow > 1) {
          g.fillStyle(0xfffaf0, 1 - k * 0.4);
          g.fillCircle(x, y, r + 0.5);
        }
        g.fillStyle(this.charged ? 0xffc83d : 0xff8a3d, 1 - k * 0.55);
        g.fillCircle(x, y, grow > 1 ? r - 3 : r);
      }
    }
    this.aimEnd.x = endX;
    this.aimEnd.y = endY;
  }

  update(time: number, delta: number) {
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
    this.gadgets.update(time, delta);
    if (this.sim.phase === "flying" && this.sim.flying) this.cat.notifyFlyby(this.sim.flying.position.x, this.sim.flying.position.y);
    this.drawBands();
    this.drawAim();
    if (this.tall) this.updateTall(delta);
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
    if (k.up.isDown || k.w.isDown) dPower += 50 * rate;
    if (k.down.isDown || k.s.isDown) dPower -= 50 * rate;
    if (!dAngle && !dPower) {
      this.heldAim = { angle: 0, power: 0 };
      return;
    }
    const held = this.heldAim;
    held.angle += dAngle;
    held.power += dPower;
    const angleSteps = Math.trunc(held.angle);
    const powerSteps = Math.trunc(held.power);
    held.angle -= angleSteps;
    held.power -= powerSteps;
    if (angleSteps || powerSteps) this.nudgeAim(angleSteps, powerSteps);
  }
}
