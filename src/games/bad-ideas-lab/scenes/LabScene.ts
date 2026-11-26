import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import {
  BALL_R,
  FLOOR_Y,
  GRID,
  H,
  PARTS,
  PART_ORDER,
  STEP_MS,
  W,
  partAngle,
  type PartType,
} from "../config";
import { attemptBonus, LAB_SCORE, labScore, LEVELS, starsFor, type LevelDef, type Rect } from "../levels";
import { blockPoly, goalLayout, NEAR_MISS, partPoly, polyBox, placementConflict, sceneBlocks, sensorGap, sensorPoly, type Conflict, type PlacedPart, type Poly, type Vec } from "../geometry";
import { FULL_FRAME, type Frame, type FrameKind } from "../layout";
import { COPY, levelText, type LabCopy, type LevelText } from "../copy";
import { Narrator, partLandmark, pathRelation, sceneOrder, type Direction, type Landmark, type Noun, type RunOutcome, type SceneInfo } from "../narration";
import { addIcon } from "../icons";
import { LabSim, type SimTarget } from "../sim";
import { LAB_SFX, type LabSfx } from "../sounds";
import { Bubble, cartoonText } from "../../kit/ui";
import { eachKeyOnce } from "../../kit/keys";
import { LabCamera, type Pose } from "./camera";
import { DockHud } from "./dockHud";
import { currentFrame, watchFrame } from "./frame";
import { DeskHud, type HudHandlers, type LabHudView } from "./hud";
import { LinaView, type Mood } from "./lina";
import { PartView } from "./parts";
import { RailHud } from "./railHud";
import { MOUSE, TOUCH, distanceToPoly, halfHeight } from "./touch";
import { RoomView } from "./room";
import { buildGoal, drawBlock, drawBuildArea, drawPipe, goalZone, type GoalView } from "./world";

type Mode = "attract" | "build" | "running" | "done";

type Part = { id: number; view: PartView };

type Carry = {
  part: Part;
  isNew: boolean;
  origin: { x: number; y: number; rot: number } | null;
  via: "pointer" | "keyboard";
  offsetX: number;
  offsetY: number;
  liftY: number;
  fromTray: boolean;
  moved: boolean;
  startX: number;
  startY: number;
  pointerId: number;
  touch: boolean;
  at: { x: number; y: number; wx: number; wy: number };
  trail: { t: number; wx: number; wy: number; x: number; y: number }[];
  before: PlacedPart[];
};

type Press = { part: Part; x: number; y: number; offsetX: number; offsetY: number; pointerId: number; touch: boolean };

type Issue = Conflict["issue"] | null;

type Finger = { id: number; x: number; y: number };

type Gesture = {
  fingers: Finger[];
  moved: boolean;
  start: Vec;
  last: { x: number; y: number; t: number };
  vx: number;
  vy: number;
  pinch: { d0: number; z0: number; anchor: Vec } | null;
};

type RunTrack = { touches: string[]; launches: string[]; winds: string[] };

const CONFETTI = [0xffc83d, 0xf06ba8, 0x63d6c1, 0x7b62c4, 0xff8a3d, 0x8fd4f7];
const RESET_MS = 900;
const UNDO_LIMIT = 40;
const RUNS_KEY = "labRuns";
const TRAMPOLINE = 4;
const OFF_TOP = -30;

function wrapLines(text: string, max = 30) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

function overlap(a: Rect, b: Rect) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function pipeZone(level: LevelDef): Rect {
  const left = level.pipe.flip ? level.pipe.x - 10 : level.pipe.x - 186;
  return { x: left, y: level.pipe.y - 400, w: 196, h: 450 };
}

function snap(v: number) {
  return Math.round(v / GRID) * GRID;
}

export class LabScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private copy!: LabCopy;
  private narrator!: Narrator;
  private level!: LevelDef;
  private text!: LevelText;
  private levelIndex = 0;
  private mode: Mode = "attract";
  private parts: Part[] = [];
  private nextId = 1;
  private carry: Carry | null = null;
  private press: Press | null = null;
  private selected: Part | null = null;
  private hud!: LabHudView;
  private frame: Frame = FULL_FRAME;
  private history: PlacedPart[][] = [];
  private hintPulsing = false;
  private runPulsing = false;
  private touchUi = false;
  private camera!: LabCamera;
  private uiCam: Phaser.Cameras.Scene2D.Camera | null = null;
  private gesture: Gesture | null = null;
  private lastTap = { t: -1e9, x: 0, y: 0 };
  private preRun: Pose | null = null;
  private introCam?: Phaser.Time.TimerEvent;
  private goal!: GoalView;
  private buildArea!: Phaser.GameObjects.Container;
  private pipe!: Phaser.GameObjects.Image;
  private ballImg!: Phaser.GameObjects.Image;
  private sim: LabSim | null = null;
  private simParts: Part[] = [];
  private blockSounds: LabSfx[] = [];
  private acc = 0;
  private inWind = false;
  private trail: [number, number][] = [];
  private trailGfx!: Phaser.GameObjects.Graphics;
  private fails = 0;
  private runs = 0;
  private resetTimer: Phaser.Time.TimerEvent | null = null;
  private lina!: LinaView;
  private room!: RoomView;
  private zone!: Rect;
  private goalPoly: Poly = [];
  private closest: { gap: number; x: number; y: number } | null = null;
  private launches: { part: number; x: number }[] = [];
  private bounced = false;
  private hidden = false;
  private skipEnding: (() => void) | null = null;
  private bubble!: Bubble;
  private slotTypes: PartType[] = [];
  private lastSound = new Map<string, number>();
  private lastIssue: Issue | "tray" | undefined = undefined;
  private finishing = false;
  private launchAt = 0;
  private pickedOnce = false;
  private ranOnce = false;
  private guideGfx: Phaser.GameObjects.Graphics | null = null;
  private guideArrow: Phaser.GameObjects.Image | null = null;
  private guideRest = 0;
  private demo: Phaser.GameObjects.Image | null = null;
  private demoTween: Phaser.Tweens.TweenChain | null = null;
  private demoTimer?: Phaser.Time.TimerEvent;
  private idleTimer?: Phaser.Time.TimerEvent;
  private runNudgeTimer?: Phaser.Time.TimerEvent;
  private bulb!: Phaser.GameObjects.Image;
  private landmarks: Landmark[] = [];
  private ball!: Noun;
  private referenceId: string | null = null;
  private browseIndex = -1;
  private track: RunTrack = { touches: [], launches: [], winds: [] };
  private lastReport = "";
  private lastPath: Vec[] = [];
  private lastStop: Vec | null = null;
  private announcedValid = true;
  private announcedPath: string | null = null;
  private moveTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("lab");
  }

  init() {
    this.mode = "attract";
    this.parts = [];
    this.nextId = 1;
    this.carry = null;
    this.press = null;
    this.selected = null;
    this.sim = null;
    this.simParts = [];
    this.blockSounds = [];
    this.acc = 0;
    this.inWind = false;
    this.trail = [];
    this.fails = 0;
    this.runs = 0;
    this.lastSound = new Map();
    this.lastIssue = undefined;
    this.finishing = false;
    this.launchAt = 0;
    this.pickedOnce = false;
    this.ranOnce = false;
    this.guideGfx = null;
    this.guideArrow = null;
    this.demo = null;
    this.demoTween = null;
    this.referenceId = null;
    this.browseIndex = -1;
    this.track = { touches: [], launches: [], winds: [] };
    this.lastReport = "";
    this.lastPath = [];
    this.lastStop = null;
    this.announcedValid = true;
    this.announcedPath = null;
    this.frame = FULL_FRAME;
    this.history = [];
    this.hintPulsing = false;
    this.runPulsing = false;
    this.touchUi = false;
    this.uiCam = null;
    this.gesture = null;
    this.lastTap = { t: -1e9, x: 0, y: 0 };
    this.preRun = null;
    this.closest = null;
    this.launches = [];
    this.bounced = false;
    this.hidden = false;
    this.skipEnding = null;
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.copy = COPY[this.ctx.locale];
    this.narrator = new Narrator(this.ctx.locale);
    this.levelIndex = Phaser.Math.Clamp((this.registry.get("level") as number | undefined) ?? 0, 0, LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    const carried = this.registry.get(RUNS_KEY) as { level: string; runs: number } | undefined;
    this.runs = carried?.level === this.level.id ? carried.runs : 0;
    this.text = levelText(this.copy, this.level.id);
    const level = this.level;
    this.landmarks = this.narrator.levelLandmarks(level);
    this.ball = this.narrator.ballNoun(level);
    const reduced = this.ctx.reducedMotion;
    const fonts = this.ctx.fonts;

    this.add.image(0, 0, "lab-bg").setOrigin(0).setDepth(0);
    this.room = new RoomView(this, this.levelIndex, fonts, reduced, this.copy.world);
    this.zone = goalZone(level);
    for (const b of level.blocks) drawBlock(this, b);
    const layout = goalLayout(level.goal);
    this.goalPoly = sensorPoly(layout.sensor);
    if (level.goal.type === "bell" || level.goal.type === "target") for (const b of layout.blocks) drawBlock(this, b);
    this.pipe = drawPipe(this, level);
    this.goal = buildGoal(this, level, fonts, {
      word: (text, x, y, color, size) => this.word(text, x, y, color, size),
      burst: (x, y, count, tex) => this.burst(x, y, count, tex),
      sfx: (name, volume) => this.sfx(name, volume),
      notes: (x, y, count) => this.notes(x, y, count),
      chain: () =>
        this.room.chain({
          sfx: (name, volume) => this.sfx(name, volume),
          word: (text, x, y, color, size) => this.word(text, x, y, color, size),
          burst: (x, y, count, tex) => this.burst(x, y, count, tex),
          notes: (x, y, count) => this.notes(x, y, count),
          confetti: (count) => this.confetti(count),
          lina: (kind) => this.lina.set(kind),
          bubble: (b) => {
            const f = this.frame;
            b.setBaseScale(this.hud.textScale);
            b.setBounds(f.stage.x + f.scrollX, f.stage.x + f.stage.w + f.scrollX, f.stage.y + f.scrollY);
          },
        }),
      reduced,
      text: this.copy.world,
    });
    this.buildArea = drawBuildArea(this, level.build, fonts, this.copy.world.buildHere);
    this.trailGfx = this.add.graphics().setDepth(6);
    this.drawGuide();

    const dir = level.pipe.flip ? -1 : 1;
    this.ballImg = this.add.image(level.pipe.x - 8 * dir, level.pipe.y, level.ball).setDepth(11);
    if (level.ball === "orange") this.ballImg.setOrigin(0.5, 31 / 56);

    this.lina = new LinaView(this, 96, FLOOR_Y + 4, reduced, (kind) => this.hud.mood(kind));
    this.bubble = new Bubble(this, fonts, "left", 32, 16);
    this.bulb = this.add.image(this.lina.x - 56, this.lina.y - 226, "bulb").setDepth(15).setVisible(false);

    this.slotTypes = PART_ORDER.filter((t) => (level.inventory[t] ?? 0) > 0);
    this.camera = new LabCamera(this.cameras.main, reduced);
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.routeObject, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.routeObject, this));
    this.frame = currentFrame(this);
    this.setupCameras(this.frame);
    this.hud = this.makeHud(this.frame.kind);
    this.hud.setEnabled(false);
    this.refreshHud();

    this.setupInput();

    watchFrame(this, level, (frame) => this.applyFrame(frame));

    if (!this.registry.get("readySent")) {
      this.registry.set("readySent", true);
      this.ctx.onReady();
    }
    if (this.registry.get("autostart")) {
      this.registry.set("autostart", false);
      this.begin();
    }
  }

  get currentLevel() {
    return this.levelIndex;
  }

  get isAttract() {
    return this.mode === "attract";
  }

  begin() {
    if (this.mode !== "attract") return;
    this.mode = "build";
    this.hud.setEnabled(true);
    const level = this.level;
    const intro = this.narrator.describeLevel(this.sceneInfo(), this.levelIndex, LEVELS.length, this.inventoryText());
    const how = level.guide ? this.copy.scene.howGuided : this.copy.scene.howFree(this.keyRange());
    this.announce(this.copy.scene.intro(intro, how));
    const tall = this.hud.kind === "tall";
    const establish = tall && !this.ctx.reducedMotion;
    if (establish) {
      this.camera.set(this.camera.overviewPose());
      this.introCam = this.time.delayedCall(900, () => this.camera.animateTo(this.camera.base, 750));
    }
    const story = tall && level.guide ? this.copy.scene.coach.dragRamp : this.text.story;
    this.time.delayedCall(establish ? 1500 : 350, () => this.say(story, 4600, level.guide ? 20 : 24));
    if (tall && !level.guide && !this.registry.get("cameraTip")) {
      this.time.delayedCall(6400, () => {
        if (this.mode !== "build" || this.registry.get("cameraTip") || this.carry) return;
        this.registry.set("cameraTip", true);
        this.say(this.copy.scene.coach.camera, 4600);
      });
    }
    if (level.guide) {
      this.hud.highlightSlot(level.guide.type);
      this.time.delayedCall(establish ? 1700 : 450, () => this.pulseGuide());
      this.demoTimer = this.time.delayedCall(establish ? 1900 : 700, () => this.startDemo());
    } else {
      this.idleTimer = this.time.addEvent({
        delay: 7000,
        loop: true,
        callback: () => {
          if (this.mode === "build" && !this.pickedOnce && !this.carry) this.hud.nudgeTray();
        },
      });
    }
  }

  private mood(kind: Mood, ms = 0) {
    this.lina.set(kind, ms);
  }

  private showBulb() {
    const b = this.bulb;
    this.tweens.killTweensOf(b);
    b.setVisible(true).setAlpha(1).setAngle(0);
    this.sfx("aha", 0.8);
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(2600, () => b.setVisible(false));
      return;
    }
    b.setScale(0.2);
    this.tweens.add({ targets: b, scale: 1.15, duration: 260, ease: "Back.easeOut" });
    this.tweens.add({ targets: b, angle: { from: -8, to: 8 }, duration: 260, yoyo: true, repeat: 4, delay: 260 });
    this.tweens.add({ targets: b, alpha: 0, delay: 2600, duration: 300, onComplete: () => b.setVisible(false) });
  }

  private drawGuide() {
    const guide = this.level.guide;
    if (!guide) return;
    const g = this.add.graphics().setDepth(8);
    const poly = partPoly(guide.type, guide.x, guide.y, guide.rot).map((p) => new Phaser.Math.Vector2(p.x, p.y));
    g.fillStyle(0xffc83d, 0.3);
    g.fillPoints(poly, true);
    g.lineStyle(13, 0x1d1830, 0.85);
    g.strokePoints(poly, true, true);
    g.lineStyle(8, 0xfbf5e6, 1);
    g.strokePoints(poly, true, true);
    g.lineStyle(8, 0xffc83d, 1);
    for (let i = 0; i < poly.length; i += 1) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const len = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      for (let d = 0; d < len; d += 22) {
        const e = Math.min(len, d + 12);
        g.lineBetween(a.x + ((b.x - a.x) * d) / len, a.y + ((b.y - a.y) * d) / len, a.x + ((b.x - a.x) * e) / len, a.y + ((b.y - a.y) * e) / len);
      }
    }
    this.guideGfx = g;
    const top = Math.min(...poly.map((p) => p.y));
    const arrow = addIcon(this, guide.x, top - 50, "arrow-down", 78).setDepth(8);
    this.guideArrow = arrow;
    this.guideRest = arrow.y;
  }

  private pulseGuide() {
    const g = this.guideGfx;
    const arrow = this.guideArrow;
    if (!g || !arrow || this.ctx.reducedMotion) return;
    this.tweens.killTweensOf([g, arrow]);
    g.setAlpha(1);
    arrow.setY(this.guideRest);
    this.tweens.add({ targets: g, alpha: 0.45, duration: 260, yoyo: true, repeat: 2, ease: "Sine.easeInOut", onComplete: () => g.setAlpha(1) });
    this.tweens.add({ targets: arrow, y: this.guideRest - 18, duration: 260, yoyo: true, repeat: 2, ease: "Sine.easeInOut", onComplete: () => arrow.setY(this.guideRest) });
  }

  private atGuide(part: Part) {
    const g = this.level.guide;
    const v = part.view;
    return Boolean(g && v.type === g.type && v.x === g.x && v.y === g.y && v.rot === g.rot);
  }

  private refreshGuide() {
    if (!this.guideGfx) return;
    const done = this.parts.some((p) => this.atGuide(p) && this.carry?.part !== p);
    this.guideGfx.setVisible(!done && this.mode === "build");
    this.guideArrow?.setVisible(!done && this.mode === "build");
  }

  private snapToGuide(part: Part) {
    const g = this.level.guide;
    const v = part.view;
    if (!g || v.type !== g.type) return;
    if (Phaser.Math.Distance.Between(v.x, v.y, g.x, g.y) > 90) return;
    if (this.issueFor(part, g.x, g.y, g.rot)) return;
    v.setPose(g.x, g.y, g.rot);
  }

  private startDemo() {
    this.stopDemo();
    const g = this.level.guide;
    if (!g || this.ctx.reducedMotion || this.mode !== "build" || this.carry || this.parts.length) return;
    const slot = this.hud.slotCenter(g.type);
    const from = this.toWorld(slot.x, slot.y);
    const img = this.add.image(from.x, from.y, PARTS[g.type].tex).setDepth(21).setAlpha(0).setAngle(partAngle(g.type, g.rot));
    this.demo = img;
    this.demoTween = this.tweens.chain({
      targets: img,
      loop: 1,
      tweens: [
        { alpha: 0.85, scale: { from: 0.6, to: 1 }, duration: 260 },
        { x: g.x, y: g.y, duration: 1100, ease: "Sine.easeInOut" },
        { scale: 1.12, duration: 140, yoyo: true },
        { alpha: 0, duration: 380, delay: 450 },
        { x: from.x, y: from.y, duration: 1, delay: 700 },
      ],
    });
  }

  private stopDemo() {
    this.demoTimer?.remove();
    this.demoTween?.stop();
    this.demoTween = null;
    this.demo?.destroy();
    this.demo = null;
  }

  private scheduleRunNudge() {
    this.runNudgeTimer?.remove();
    const guided = Boolean(this.level.guide);
    if ((this.ranOnce && !guided) || this.mode !== "build") return;
    this.runNudgeTimer = this.time.delayedCall(guided ? 250 : 5000, () => {
      if (this.mode === "build" && this.parts.length && !this.carry && (guided || !this.ranOnce)) this.setRunPulse(true);
    });
  }

  private makeHud(kind: FrameKind): LabHudView {
    const handlers: HudHandlers = {
      onSlotDown: (type, pointer) => this.onSlotDown(type, pointer),
      onRun: () => !this.dragging() && this.toggleRun(),
      onClear: () => !this.dragging() && this.clearAll(),
      onHint: () => !this.dragging() && this.showHint(),
      onRotate: () => this.rotateActive(1),
      onRotateBack: () => this.rotateActive(-1),
      onRemove: () => this.removeActive(),
      onUndo: () => !this.dragging() && this.undo(),
      onOverview: () => this.toggleOverview(),
      onRecenter: () => this.recenter(),
    };
    const setup = {
      scene: this,
      fonts: this.ctx.fonts,
      level: this.level,
      text: this.text,
      copy: this.copy,
      index: this.levelIndex,
      total: LEVELS.length,
      slotTypes: this.slotTypes,
      reduced: this.ctx.reducedMotion,
      handlers,
      mount: (obj: Phaser.GameObjects.GameObject) => {
        if (this.uiCam) obj.cameraFilter = this.cameras.main.id;
      },
    };
    if (kind === "tall") return new DockHud(setup);
    return kind === "band" ? new RailHud(setup) : new DeskHud(setup);
  }

  private routeObject(obj: Phaser.GameObjects.GameObject) {
    this.uiCam?.ignore(obj);
  }

  private setupCameras(frame: Frame) {
    const main = this.cameras.main;
    if (frame.kind === "tall") {
      if (!this.uiCam) {
        this.uiCam = this.cameras.add(0, 0, frame.width, frame.height).setName("ui");
        for (const obj of this.children.list) this.uiCam.ignore(obj);
      }
      this.uiCam.setSize(frame.width, frame.height);
      main.setBackgroundColor("#241a45");
      return;
    }
    main.setBackgroundColor("rgba(0,0,0,0)");
    if (!this.uiCam) return;
    this.cameras.remove(this.uiCam);
    this.uiCam = null;
    const clear = (list: Phaser.GameObjects.GameObject[]) => {
      for (const obj of list) {
        obj.cameraFilter = 0;
        if (obj instanceof Phaser.GameObjects.Container) clear(obj.list);
      }
    };
    clear(this.children.list);
  }

  private toggleOverview() {
    this.introCam?.remove();
    this.camera.touched(this.time.now);
    this.camera.animateTo(this.camera.isOverview() ? this.camera.base : this.camera.overviewPose());
  }

  private recenter() {
    this.introCam?.remove();
    this.camera.touched(this.time.now);
    this.camera.animateTo(this.camera.base);
  }

  private applyFrame(frame: Frame) {
    const rebuilt = this.hud.kind !== frame.kind;
    if (rebuilt) this.hud.destroy();
    this.frame = frame;
    this.setupCameras(frame);
    this.camera.apply(frame, this.mode !== "attract" && !rebuilt);
    if (rebuilt) this.hud = this.makeHud(frame.kind);
    this.hud.layout(frame, this.scale.displayScale.x);
    if (rebuilt) this.syncHud();
    this.bubble.setBaseScale(this.hud.textScale);
    this.bubble.setBounds(frame.stage.x + frame.scrollX, frame.stage.x + frame.stage.w + frame.scrollX, frame.stage.y + frame.scrollY);
    if (this.selected) this.placeToolbar(this.selected);
  }

  private syncHud() {
    const hud = this.hud;
    hud.setEnabled(this.mode !== "attract" && !this.finishing);
    this.refreshHud();
    if (this.mode === "running") hud.setRunning(true);
    if (this.finishing) hud.setDone();
    if (this.mode === "build" && this.level.guide && !this.pickedOnce) hud.highlightSlot(this.level.guide.type);
    hud.pulseHint(this.hintPulsing);
    hud.pulseRun(this.runPulsing);
  }

  private setHintPulse(on: boolean) {
    this.hintPulsing = on;
    this.hud.pulseHint(on);
  }

  private setRunPulse(on: boolean) {
    this.runPulsing = on;
    this.hud.pulseRun(on);
  }

  private toScreen(x: number, y: number): Vec {
    return this.camera.toScreen(x, y);
  }

  private toWorld(x: number, y: number): Vec {
    return this.camera.toWorld(x, y);
  }

  private worldOf(pointer: Phaser.Input.Pointer): Vec {
    return this.camera.toWorld(pointer.x, pointer.y);
  }

  private px(css: number) {
    return (css * this.scale.displayScale.x) / this.camera.zoom;
  }

  private screenPx(css: number) {
    return css * this.scale.displayScale.x;
  }

  private tagAt(text: string, x: number, y: number) {
    const p = this.toScreen(x, y);
    this.hud.showTag(text, p.x, p.y);
  }

  private dragging() {
    return this.carry?.via === "pointer";
  }

  private busyFor(pointer: Phaser.Input.Pointer) {
    if (this.carry?.via === "pointer" && this.carry.pointerId !== pointer.id) return true;
    if (this.gesture && !this.gesture.fingers.some((f) => f.id === pointer.id)) return true;
    return Boolean(this.press && this.press.pointerId !== pointer.id);
  }

  private hideSay() {
    this.bubble.hide();
    this.hud.hideSay();
  }

  private focusPoint(): Vec | null {
    const part = this.carry?.part ?? this.selected;
    const g = this.level.guide;
    const at = part ? { x: part.view.x, y: part.view.y } : g && this.mode === "build" && !this.parts.some((p) => this.atGuide(p)) ? { x: g.x, y: g.y } : null;
    return at ? this.toScreen(at.x, at.y) : null;
  }

  private buildCenter(): Vec {
    const b = this.level.build;
    if (!this.camera.free) return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    const v = this.camera.visible();
    const left = Math.max(b.x, v.x);
    const right = Math.min(b.x + b.w, v.x + v.w);
    const top = Math.max(b.y, v.y);
    const bottom = Math.min(b.y + b.h, v.y + v.h);
    if (right - left > 120 && bottom - top > 80) return { x: (left + right) / 2, y: (top + bottom) / 2 };
    this.camera.animateTo(this.camera.base);
    return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  }

  private sfx(name: LabSfx, volume = 1, throttleMs = 0) {
    if (throttleMs) {
      const last = this.lastSound.get(name) ?? -10000;
      if (this.time.now - last < throttleMs) return;
      this.lastSound.set(name, this.time.now);
    }
    this.ctx.audio.play(LAB_SFX[name], { volume: Phaser.Math.Clamp(volume, 0.05, 1.2) });
  }

  private announce(message: string, transient = false) {
    this.moveTimer?.remove();
    this.moveTimer = undefined;
    this.ctx.onEvent({ type: "announce", message, transient, fresh: !transient });
  }

  private nounOf(part: Part): Noun {
    const same = this.parts.filter((p) => p.view.type === part.view.type);
    return this.narrator.partNoun(part.view.type, same.indexOf(part) + 1, same.length);
  }

  private landmarkOf(part: Part) {
    const v = part.view;
    return partLandmark(part.id, v.type, v.x, v.y, v.rot, this.nounOf(part));
  }

  private sceneInfo(withStop = true): SceneInfo {
    const landmarks = [...this.landmarks, ...this.parts.map((p) => this.landmarkOf(p))];
    if (withStop && this.lastStop) landmarks.push(this.narrator.stopLandmark(this.lastStop, this.ball));
    return { level: this.level, landmarks, ball: this.ball };
  }

  private activePart() {
    return this.carry?.part ?? this.selected;
  }

  private reference(part: Part | null) {
    if (!this.referenceId || (part && this.referenceId === `part-${part.id}`)) return null;
    return this.sceneInfo().landmarks.find((l) => l.id === this.referenceId) ?? null;
  }

  private conflictFor(part: Part, x = part.view.x, y = part.view.y, rot = part.view.rot): Conflict | null {
    const others = this.parts.filter((p) => p !== part).map((p) => this.placedOf(p));
    return placementConflict(this.level, others, { type: part.view.type, x, y, rot });
  }

  private conflictWords(part: Part) {
    const c = this.conflictFor(part);
    if (!c) return null;
    const others = this.parts.filter((p) => p !== part).map((p) => this.nounOf(p));
    return this.narrator.conflictText(c, this.sceneInfo().landmarks, others);
  }

  private placeWords(part: Part) {
    const v = part.view;
    const poly = partPoly(v.type, v.x, v.y, v.rot);
    return this.narrator.referenceRelation(poly, { x: v.x, y: v.y }, this.sceneInfo(), this.reference(part), `part-${part.id}`);
  }

  private pathWords(part: Part) {
    const v = part.view;
    return this.narrator.pathText(pathRelation(partPoly(v.type, v.x, v.y, v.rot), this.lastPath), this.ball);
  }

  private partState(part: Part) {
    return this.narrator.fitState(this.conflictWords(part));
  }

  private heldDetail(part: Part) {
    const v = part.view;
    const held = this.carry?.part === part;
    return this.narrator.describeHeld({
      name: this.nounOf(part),
      type: v.type,
      rot: v.rot,
      center: { x: v.x, y: v.y },
      held,
      conflict: held ? this.conflictWords(part) : null,
      info: this.sceneInfo(),
      reference: this.reference(part),
      skipId: `part-${part.id}`,
      path: this.lastPath,
    });
  }

  private say(text: string, duration = 2400, wrap = 30) {
    if (this.hud.say(text, duration, this.focusPoint())) return;
    const spot = this.bubbleSpot(text, wrap);
    this.bubble.say(spot.text, spot.x, spot.y, duration, spot.side);
  }

  private bubbleSpot(text: string, wrap: number) {
    const head = { x: this.lina.x + 34, y: this.lina.y - 214 };
    const beside = { x: this.lina.x + 66, y: this.lina.y - 150 };
    const above = [wrap, 24, 19, 15].filter((w, i, all) => w <= wrap && all.indexOf(w) === i);
    const options = [
      ...above.map((w) => ({ text: wrapLines(text, w), ...head, side: "above" as const })),
      ...[Math.min(wrap, 26), 20].map((w) => ({ text: wrapLines(text, w), ...beside, side: "right" as const })),
    ];
    const blocks = sceneBlocks(this.level).map((b) => {
      const box = polyBox(blockPoly(b));
      return { x: box.left, y: box.top, w: box.right - box.left, h: box.bottom - box.top };
    });
    const cost = (r: Rect) =>
      overlap(r, this.zone) * 6 + overlap(r, this.level.build) * 2 + blocks.reduce((a, b) => a + overlap(r, b), 0) + overlap(r, pipeZone(this.level));
    let best = options[0];
    let bestCost = Infinity;
    options.forEach((o, i) => {
      const c = cost(this.bubble.box(o.text, o.x, o.y, o.side)) + i;
      if (c < bestCost) {
        best = o;
        bestCost = c;
      }
    });
    return best;
  }

  private word(text: string, x: number, y: number, color: string, size = 52) {
    const t = cartoonText(this, x, y, text, { size, color, font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(15);
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(900, () => t.destroy());
      return;
    }
    t.setScale(0.3).setAngle(Phaser.Math.Between(-8, 8));
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: "Back.easeOut" });
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, delay: 650, duration: 420, onComplete: () => t.destroy() });
  }

  private burst(x: number, y: number, count: number, tex = "star") {
    const n = this.ctx.reducedMotion ? Math.min(4, count) : count;
    for (let i = 0; i < n; i += 1) {
      const img = this.add.image(x, y, tex).setDepth(15).setScale(Phaser.Math.FloatBetween(0.6, 1.1));
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const d = Phaser.Math.Between(60, 170);
      this.tweens.add({
        targets: img,
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d - 30,
        angle: this.ctx.reducedMotion ? 0 : Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: this.ctx.reducedMotion ? 500 : Phaser.Math.Between(600, 950),
        ease: "Quad.easeOut",
        onComplete: () => img.destroy(),
      });
    }
  }

  private notes(x: number, y: number, count: number) {
    const glyphs = ["♪", "♫"];
    const colors = ["#f06ba8", "#ffc83d", "#63d6c1", "#9df0dc"];
    for (let i = 0; i < count; i += 1) {
      const t = cartoonText(this, x + Phaser.Math.Between(-30, 30), y, glyphs[i % 2], { size: 40, color: colors[i % colors.length], font: this.ctx.fonts.display, stroke: 0.2 })
        .setOrigin(0.5)
        .setDepth(15)
        .setAlpha(0);
      if (this.ctx.reducedMotion) {
        t.setAlpha(1).setY(y - 40 - i * 24);
        this.time.delayedCall(1200, () => t.destroy());
        continue;
      }
      this.tweens.add({
        targets: t,
        delay: i * 220,
        alpha: { from: 1, to: 0 },
        y: y - Phaser.Math.Between(120, 190),
        x: t.x + Phaser.Math.Between(-60, 60),
        angle: Phaser.Math.Between(-20, 20),
        duration: 1300,
        ease: "Sine.easeOut",
        onComplete: () => t.destroy(),
      });
    }
  }

  private inventoryText() {
    return this.narrator.list(this.slotTypes.map((t) => this.narrator.count(t, this.level.inventory[t] ?? 0)));
  }

  private keyRange() {
    return this.copy.scene.keyRange(this.slotTypes.length);
  }

  private remaining(type: PartType) {
    return (this.level.inventory[type] ?? 0) - this.parts.filter((p) => p.view.type === type).length;
  }

  private refreshHud() {
    const counts: Partial<Record<PartType, number>> = {};
    for (const t of this.slotTypes) counts[t] = this.remaining(t);
    this.hud.setCounts(counts);
    this.hud.setUsed(this.parts.length, this.level.par);
    this.hud.setUndo(this.history.length > 0);
  }

  private describe(part: Part) {
    return this.narrator.partSummary(this.nounOf(part), part.view.type, part.view.rot);
  }

  private placedOf(part: Part): PlacedPart {
    return { type: part.view.type, x: part.view.x, y: part.view.y, rot: part.view.rot };
  }

  private issueFor(part: Part, x = part.view.x, y = part.view.y, rot = part.view.rot): Issue {
    return this.conflictFor(part, x, y, rot)?.issue ?? null;
  }

  private findSpot(part: Part, cx: number, cy: number, reach = 40) {
    const sx = snap(cx);
    const sy = snap(cy);
    for (let r = 0; r <= reach; r += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        for (let dy = -r; dy <= r; dy += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = sx + dx * GRID;
          const y = sy + dy * GRID;
          if (!this.issueFor(part, x, y)) return { x, y };
        }
      }
    }
    return null;
  }

  private createPart(type: PartType, x: number, y: number): Part {
    const view = new PartView(this, type, this.ctx.reducedMotion);
    const part: Part = { id: this.nextId, view };
    this.nextId += 1;
    view.setPose(snap(x), snap(y), PARTS[type].initial);
    view.hit.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.onPartDown(part, pointer));
    this.parts.push(part);
    this.refreshHud();
    return part;
  }

  private destroyPart(part: Part) {
    this.parts = this.parts.filter((p) => p !== part);
    if (this.selected === part) this.deselect();
    part.view.destroy();
    this.refreshHud();
    this.refreshGuide();
    if (!this.parts.length) {
      this.setRunPulse(false);
      if (this.level.guide) this.demoTimer = this.time.delayedCall(1200, () => this.startDemo());
    }
  }

  private select(part: Part, announce = true, prefix = "") {
    if (this.selected && this.selected !== part) this.selected.view.setLook("idle");
    this.selected = part;
    part.view.setLook("selected");
    this.placeToolbar(part);
    if (announce) {
      const index = this.parts.indexOf(part) + 1;
      this.announce(this.copy.scene.selected(prefix, index, this.parts.length, this.describe(part), this.placeWords(part)));
    }
  }

  private deselect() {
    if (this.selected) this.selected.view.setLook("idle");
    this.selected = null;
    this.hud.hideToolbar();
  }

  private placeToolbar(part: Part) {
    const poly = partPoly(part.view.type, part.view.x, part.view.y, part.view.rot);
    const top = this.toScreen(part.view.x, Math.min(...poly.map((p) => p.y)));
    const bottom = this.toScreen(part.view.x, Math.max(...poly.map((p) => p.y)));
    this.hud.showToolbar({ x: top.x, top: top.y, bottom: bottom.y }, this.touchUi);
  }

  private committed(): PlacedPart[] {
    const c = this.carry;
    const out: PlacedPart[] = [];
    for (const p of this.parts) {
      const v = p.view;
      if (c?.part === p) {
        if (c.isNew || !c.origin) continue;
        out.push({ type: v.type, x: c.origin.x, y: c.origin.y, rot: c.origin.rot });
      } else {
        out.push({ type: v.type, x: v.x, y: v.y, rot: v.rot });
      }
    }
    return out;
  }

  private remember(layout: PlacedPart[] = this.committed()) {
    this.history.push(layout);
    if (this.history.length > UNDO_LIMIT) this.history.shift();
    this.hud.setUndo(true);
  }

  private undo() {
    if (this.mode !== "build") return;
    this.cancelCarry(true);
    this.press = null;
    const layout = this.history.pop();
    if (!layout) {
      this.sfx("invalid", 0.7);
      this.announce(this.copy.scene.nothingToUndo);
      this.hud.setUndo(false);
      return;
    }
    this.deselect();
    this.hud.hideTag();
    this.hud.hideGoal();
    this.hideSay();
    this.stopDemo();
    for (const p of this.parts) p.view.destroy();
    this.parts = [];
    for (const placed of layout) {
      const part = this.createPart(placed.type, placed.x, placed.y);
      part.view.setPose(placed.x, placed.y, placed.rot);
    }
    this.refreshHud();
    this.refreshGuide();
    if (!this.parts.length) this.setRunPulse(false);
    this.sfx("rotate", 0.8);
    const placed = this.parts.length ? this.copy.scene.placedParts(this.parts.map((p) => this.describe(p))) : this.copy.scene.noPartsYet;
    this.announce(this.copy.scene.undone(placed));
  }

  private steadyRelease(c: Carry) {
    const trail = c.trail;
    const last = trail[trail.length - 1];
    if (!last) return;
    let i = trail.length - 1;
    while (i > 0 && this.time.now - trail[i].t < TOUCH.steadyMs) i -= 1;
    const anchor = trail[i];
    if (anchor === last) return;
    if (Phaser.Math.Distance.Between(anchor.wx, anchor.wy, last.wx, last.wy) > this.px(TOUCH.jitter)) return;
    const v = c.part.view;
    if (v.x === anchor.x && v.y === anchor.y) return;
    v.setPose(anchor.x, anchor.y, v.rot);
    this.updateCarryLook();
  }

  private touchLift(part: Part) {
    const v = part.view;
    return -(halfHeight(partPoly(v.type, v.x, v.y, v.rot)) + this.px(TOUCH.lift));
  }

  private pickPart(x: number, y: number) {
    let best: Part | null = null;
    let bestD = this.px(TOUCH.slop);
    for (let i = this.parts.length - 1; i >= 0; i -= 1) {
      const p = this.parts[i];
      const v = p.view;
      const d = distanceToPoly({ x, y }, partPoly(v.type, v.x, v.y, v.rot));
      if (d < bestD || (d === 0 && bestD > 0)) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }

  private beginCarry(part: Part, via: Carry["via"], opts: Partial<Carry> = {}) {
    this.deselect();
    const v = part.view;
    this.carry = {
      part,
      isNew: false,
      origin: { x: v.x, y: v.y, rot: v.rot },
      via,
      offsetX: 0,
      offsetY: 0,
      fromTray: false,
      moved: false,
      startX: v.x,
      startY: v.y,
      pointerId: -1,
      touch: false,
      liftY: opts.offsetY ?? 0,
      at: { x: 0, y: 0, wx: v.x, wy: v.y },
      trail: [],
      before: this.committed(),
      ...opts,
    };
    v.setDepthLift(true);
    this.lastIssue = undefined;
    this.setRunPulse(false);
    this.updateCarryLook();
    this.refreshGuide();
    this.announcedValid = !this.conflictFor(part);
    this.announcedPath = this.pathWords(part);
  }

  private updateCarryLook() {
    const c = this.carry;
    if (!c) return;
    const v = c.part.view;
    const overBox = c.via === "pointer" && c.moved && this.hud.isOverTray(this.toScreen(v.x, v.y), c.at);
    this.hud.setBoxHover(overBox);
    if (overBox) {
      v.setLook("invalid");
      this.tagAt(this.copy.scene.dropTag, v.x, v.y - 60);
      this.lastIssue = "tray";
      return;
    }
    const issue = this.issueFor(c.part);
    v.setLook(issue ? "invalid" : "valid");
    if (issue) {
      const poly = partPoly(v.type, v.x, v.y, v.rot);
      const top = Math.min(...poly.map((p) => p.y));
      this.tagAt(this.copy.scene.issue[issue], v.x, top - 16);
    } else {
      this.hud.hideTag();
    }
    this.lastIssue = issue;
  }

  private moveCarry(x: number, y: number) {
    const c = this.carry;
    if (!c) return;
    const v = c.part.view;
    const nx = snap(Phaser.Math.Clamp(x, 0, W));
    const ny = snap(Phaser.Math.Clamp(y, 60, H));
    if (nx === v.x && ny === v.y) return;
    v.setPose(nx, ny, v.rot);
    this.updateCarryLook();
  }

  private dropCarry(quiet = false): string | null {
    const c = this.carry;
    if (!c) return null;
    const v = c.part.view;
    this.snapToGuide(c.part);
    const conflict = this.conflictWords(c.part);
    if (conflict) {
      this.sfx("invalid", 0.8);
      if (!quiet) this.announce(this.copy.scene.cantPlace(this.nounOf(c.part), conflict));
      return null;
    }
    const o = c.origin;
    if (c.isNew || !o || o.x !== v.x || o.y !== v.y || o.rot !== v.rot) this.remember(c.before);
    this.carry = null;
    this.hud.setBoxHover(false);
    v.setDepthLift(false);
    v.setLook("idle");
    v.pulse();
    this.hud.hideTag();
    this.sfx("place", 0.9);
    this.refreshHud();
    this.select(c.part, false);
    this.refreshGuide();
    const guided = this.level.guide && this.atGuide(c.part);
    let message: string;
    if (guided) {
      this.say(this.copy.scene.guidedSay, 3200);
      message = this.copy.scene.guidedPlaced;
    } else if (this.level.guide && this.hud.kind === "tall" && c.part.view.type === this.level.guide.type) {
      this.say(this.copy.scene.coach.offGuide, 3200);
      message = this.copy.scene.placed(this.nounOf(c.part), this.narrator.poseText(v.type, v.rot), this.placeWords(c.part), this.parts.length);
    } else {
      message = this.copy.scene.placed(this.nounOf(c.part), this.narrator.poseText(v.type, v.rot), this.placeWords(c.part), this.parts.length);
    }
    if (!quiet) this.announce(message);
    this.scheduleRunNudge();
    return message;
  }

  private cancelCarry(silent = false) {
    const c = this.carry;
    if (!c) return;
    const name = this.nounOf(c.part);
    this.carry = null;
    this.hud.hideTag();
    this.hud.setBoxHover(false);
    if (c.isNew || !c.origin) {
      this.destroyPart(c.part);
      if (!silent) {
        this.sfx("remove", 0.7);
        this.announce(this.copy.scene.cancelledToBox(name));
      }
      return;
    }
    const v = c.part.view;
    v.setPose(c.origin.x, c.origin.y, c.origin.rot);
    v.setDepthLift(false);
    v.setLook("idle");
    this.refreshGuide();
    if (!silent) {
      this.select(c.part, false);
      this.sfx("invalid", 0.7);
      this.announce(this.copy.scene.cancelledBack(name, this.placeWords(c.part)));
    }
  }

  private settleCarry(): string | null {
    const c = this.carry;
    if (!c) return null;
    const conflict = this.conflictWords(c.part);
    if (!conflict) return this.dropCarry(true);
    const name = this.nounOf(c.part);
    const toBox = c.isNew || !c.origin;
    this.cancelCarry(true);
    return this.copy.scene.settled(name, conflict, toBox);
  }

  private onSlotDown(type: PartType, pointer: Phaser.Input.Pointer) {
    if (this.mode !== "build" || this.busyFor(pointer)) return;
    this.touchUi = pointer.wasTouch;
    this.introCam?.remove();
    this.camera.stop();
    this.hideSay();
    this.hud.hideGoal();
    this.stopDemo();
    this.firstPick(type);
    const settled = this.settleCarry();
    if (settled) this.announce(settled);
    if (this.remaining(type) <= 0) {
      this.sfx("invalid", 0.7);
      this.say(this.copy.scene.outOfSay(this.copy.parts[type].plural), 1600);
      this.announce(this.copy.scene.outOf(this.copy.parts[type].plural));
      return;
    }
    const touch = pointer.wasTouch || this.hud.kind !== "full";
    const w = this.worldOf(pointer);
    const part = this.createPart(type, w.x, w.y);
    const lift = touch ? this.touchLift(part) : -MOUSE.trayLift * this.hud.uiScale;
    part.view.setPose(snap(w.x), snap(w.y + lift), part.view.rot);
    this.sfx("pick", 0.8);
    this.beginCarry(part, "pointer", {
      isNew: true,
      origin: null,
      offsetY: lift,
      liftY: lift,
      fromTray: true,
      moved: false,
      startX: pointer.x,
      startY: pointer.y,
      pointerId: pointer.id,
      touch,
      at: { x: pointer.x, y: pointer.y, wx: w.x, wy: w.y },
    });
    if (this.hud.kind === "tall" && this.level.guide?.type === type && !this.parts.some((p) => p !== part && this.atGuide(p))) this.say(this.copy.scene.coach.dropOnGuide, 3200);
  }

  private firstPick(type: PartType) {
    this.pickedOnce = true;
    this.hud.highlightSlot(null);
    if (this.level.guide?.type === type) this.pulseGuide();
  }

  private pickWithKeyboard(slot: number) {
    const type = this.slotTypes[slot];
    if (!type) return;
    this.hideSay();
    this.stopDemo();
    this.firstPick(type);
    const settled = this.settleCarry();
    const before = settled ? `${settled} ` : "";
    if (this.remaining(type) <= 0) {
      this.sfx("invalid", 0.7);
      this.announce(`${before}${this.copy.scene.outOf(this.copy.parts[type].plural)}`);
      return;
    }
    const b = this.level.build;
    const guide = this.level.guide;
    const part = this.createPart(type, b.x + b.w / 2, b.y + b.h / 2);
    if (guide && guide.type === type && !this.issueFor(part, guide.x, guide.y, guide.rot)) {
      part.view.setPose(guide.x, guide.y, guide.rot);
    } else {
      const spot = this.findSpot(part, b.x + b.w / 2, b.y + b.h / 2);
      if (spot) part.view.setPose(spot.x, spot.y, part.view.rot);
    }
    this.sfx("pick", 0.8);
    this.beginCarry(part, "keyboard", { isNew: true, origin: null });
    const onGuide = guide && this.atGuide(part);
    const name = this.nounOf(part);
    this.announce(
      before +
        (onGuide ? this.copy.scene.guidedInHand : this.copy.scene.inHand(name, this.narrator.poseText(type, part.view.rot), this.partState(part), this.placeWords(part))),
    );
  }

  private onPartDown(part: Part, pointer: Phaser.Input.Pointer) {
    if (pointer.wasTouch) return;
    this.onPartPress(part, pointer);
  }

  private onPartPress(part: Part, pointer: Phaser.Input.Pointer) {
    if (this.mode !== "build" || this.busyFor(pointer)) return;
    if (this.carry && this.carry.part !== part) {
      const settled = this.settleCarry();
      if (settled) this.announce(settled);
    }
    if (this.carry) return;
    this.introCam?.remove();
    this.camera.stop();
    this.hideSay();
    this.hud.hideGoal();
    const w = this.worldOf(pointer);
    this.press = {
      part,
      x: pointer.x,
      y: pointer.y,
      offsetX: part.view.x - w.x,
      offsetY: part.view.y - w.y,
      pointerId: pointer.id,
      touch: pointer.wasTouch,
    };
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.moveGesture(pointer)) return;
    if (this.mode !== "build") return;
    const c = this.carry;
    const w = this.worldOf(pointer);
    const at = { x: pointer.x, y: pointer.y, wx: w.x, wy: w.y };
    if (c && c.via === "pointer") {
      if (pointer.id !== c.pointerId) return;
      c.at = at;
      const limit = c.touch ? this.screenPx(TOUCH.drag) : MOUSE.trayDrag * this.camera.zoom;
      if (!c.moved && Phaser.Math.Distance.Between(c.startX, c.startY, pointer.x, pointer.y) > limit) c.moved = true;
      this.moveCarry(w.x + c.offsetX, w.y + c.offsetY);
      if (c.touch) {
        c.trail.push({ t: this.time.now, wx: w.x, wy: w.y, x: c.part.view.x, y: c.part.view.y });
        if (c.trail.length > TOUCH.trail) c.trail.shift();
      }
      return;
    }
    const p = this.press;
    if (!p || pointer.id !== p.pointerId) return;
    const limit = p.touch ? this.screenPx(TOUCH.drag) : MOUSE.drag * this.camera.zoom;
    if (Phaser.Math.Distance.Between(p.x, p.y, pointer.x, pointer.y) > limit) {
      this.press = null;
      this.sfx("pick", 0.6);
      const lift = p.touch ? this.touchLift(p.part) : p.offsetY;
      const offsetY = p.touch && !this.ctx.reducedMotion ? p.offsetY : lift;
      this.beginCarry(p.part, "pointer", { offsetX: p.offsetX, offsetY, liftY: lift, moved: true, pointerId: p.pointerId, touch: p.touch, at });
      this.moveCarry(w.x + p.offsetX, w.y + offsetY);
    }
  }

  private startGesture(pointer: Phaser.Input.Pointer) {
    this.introCam?.remove();
    this.camera.touched(this.time.now);
    const g = this.gesture;
    if (g) {
      if (g.fingers.length >= 2 || g.fingers.some((f) => f.id === pointer.id)) return;
      g.fingers.push({ id: pointer.id, x: pointer.x, y: pointer.y });
      this.beginPinch(g);
      return;
    }
    this.gesture = { fingers: [{ id: pointer.id, x: pointer.x, y: pointer.y }], moved: false, start: { x: pointer.x, y: pointer.y }, last: { x: pointer.x, y: pointer.y, t: this.time.now }, vx: 0, vy: 0, pinch: null };
  }

  private beginPinch(g: Gesture) {
    const [a, b] = g.fingers;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    g.moved = true;
    g.pinch = { d0: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), z0: this.camera.zoom, anchor: this.toWorld(mid.x, mid.y) };
  }

  private moveGesture(pointer: Phaser.Input.Pointer) {
    const g = this.gesture;
    const finger = g?.fingers.find((f) => f.id === pointer.id);
    if (!g || !finger) return false;
    finger.x = pointer.x;
    finger.y = pointer.y;
    this.camera.touched(this.time.now);
    if (g.pinch && g.fingers.length === 2) {
      const [a, b] = g.fingers;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      this.camera.zoomAt((g.pinch.z0 * d) / g.pinch.d0, (a.x + b.x) / 2, (a.y + b.y) / 2, g.pinch.anchor);
      return true;
    }
    if (!g.moved && Phaser.Math.Distance.Between(g.start.x, g.start.y, pointer.x, pointer.y) > this.screenPx(TOUCH.drag)) {
      g.moved = true;
      g.last = { x: pointer.x, y: pointer.y, t: this.time.now };
      return true;
    }
    if (!g.moved) return true;
    const dt = Math.max(1, this.time.now - g.last.t);
    const dx = pointer.x - g.last.x;
    const dy = pointer.y - g.last.y;
    this.camera.panBy(dx, dy);
    g.vx = g.vx * 0.4 + (dx / dt) * 0.6;
    g.vy = g.vy * 0.4 + (dy / dt) * 0.6;
    g.last = { x: pointer.x, y: pointer.y, t: this.time.now };
    if (!this.registry.get("cameraTip")) this.registry.set("cameraTip", true);
    return true;
  }

  private endGesture(pointer: Phaser.Input.Pointer) {
    const g = this.gesture;
    if (!g || !g.fingers.some((f) => f.id === pointer.id)) return false;
    g.fingers = g.fingers.filter((f) => f.id !== pointer.id);
    if (g.fingers.length) {
      const f = g.fingers[0];
      g.pinch = null;
      g.last = { x: f.x, y: f.y, t: this.time.now };
      g.vx = 0;
      g.vy = 0;
      return true;
    }
    this.gesture = null;
    if (g.moved) {
      if (!g.pinch && this.time.now - g.last.t < 80) this.camera.flingWith(g.vx, g.vy);
      return true;
    }
    this.tapEmpty(pointer);
    return true;
  }

  private tapEmpty(pointer: Phaser.Input.Pointer) {
    const now = this.time.now;
    const double = now - this.lastTap.t < 320 && Phaser.Math.Distance.Between(this.lastTap.x, this.lastTap.y, pointer.x, pointer.y) < this.screenPx(32);
    this.lastTap = double ? { t: -1e9, x: 0, y: 0 } : { t: now, x: pointer.x, y: pointer.y };
    if (this.mode === "build") {
      const settled = this.settleCarry();
      if (settled) this.announce(settled);
      this.deselect();
      this.hud.hideGoal();
    }
    if (!double) return;
    const at = this.worldOf(pointer);
    this.camera.animateTo(this.camera.isOverview() ? { x: at.x, y: at.y, zoom: this.camera.base.zoom } : this.camera.overviewPose());
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (this.endGesture(pointer)) return;
    const c = this.carry;
    const pressed = this.press;
    if ((c?.via === "pointer" && c.pointerId !== pointer.id) || (pressed && pressed.pointerId !== pointer.id)) return;
    if (this.mode !== "build") {
      this.press = null;
      return;
    }
    if (c && c.via === "pointer") {
      const w = this.worldOf(pointer);
      c.at = { x: pointer.x, y: pointer.y, wx: w.x, wy: w.y };
      this.hud.setBoxHover(false);
      if (c.touch && c.moved) this.steadyRelease(c);
      const v = c.part.view;
      if (c.fromTray && !c.moved) {
        const b = this.buildCenter();
        const spot = this.findSpot(c.part, b.x, b.y);
        if (spot) {
          v.setPose(spot.x, spot.y, v.rot);
          this.dropCarry();
        } else {
          this.cancelCarry();
          this.say(this.copy.scene.noRoom, 1600);
        }
        return;
      }
      if (this.hud.isOverTray(this.toScreen(v.x, v.y), c.at)) {
        const name = this.nounOf(c.part);
        if (!c.isNew && c.origin) this.remember(c.before);
        this.carry = null;
        this.hud.hideTag();
        this.destroyPart(c.part);
        this.sfx("remove", 0.8);
        this.announce(this.copy.scene.backToBox(name));
        return;
      }
      this.snapToGuide(c.part);
      let issue = this.issueFor(c.part);
      if (issue && c.touch) {
        const spot = this.findSpot(c.part, v.x, v.y, TOUCH.settle);
        if (spot) {
          v.setPose(spot.x, spot.y, v.rot);
          issue = null;
        }
      }
      if (!issue) this.dropCarry();
      else {
        const conflict = this.conflictWords(c.part);
        const name = this.nounOf(c.part);
        this.cancelCarry(true);
        this.sfx("invalid", 0.8);
        this.say(this.copy.scene.issue[issue] + "!", 1500);
        this.announce(this.copy.scene.doesntFit(name, conflict ?? "", c.isNew));
      }
      return;
    }
    const p = this.press;
    this.press = null;
    if (p) {
      if (this.selected === p.part) this.deselect();
      else {
        this.sfx("nudge", 0.8);
        this.select(p.part);
      }
    }
  }

  private rotateActive(dir: 1 | -1) {
    if (this.mode !== "build") return;
    const part = this.carry?.part ?? this.selected;
    if (!part) return;
    const v = part.view;
    const n = PARTS[v.type].rotations.length;
    const next = (v.rot + dir + n) % n;
    if (this.carry) {
      v.setPose(v.x, v.y, next);
      this.updateCarryLook();
    } else {
      const issue = this.issueFor(part, v.x, v.y, next);
      if (issue) {
        const was = v.rot;
        v.setPose(v.x, v.y, next);
        const conflict = this.conflictWords(part);
        v.setPose(v.x, v.y, was);
        this.sfx("invalid", 0.7);
        this.tagAt(this.copy.scene.issue[issue], v.x, v.y - 70);
        this.time.delayedCall(1100, () => !this.carry && this.hud.hideTag());
        this.announce(this.copy.scene.cantRotate(this.nounOf(part), conflict ?? ""));
        return;
      }
      this.remember();
      v.setPose(v.x, v.y, next);
      this.placeToolbar(part);
    }
    v.pulse();
    this.sfx("rotate", 0.8);
    const state = this.carry ? this.partState(part) : null;
    if (this.carry) this.announcedValid = !this.conflictFor(part);
    this.announce(this.copy.scene.rotated(this.narrator.poseText(v.type, v.rot), state, this.placeWords(part)));
  }

  private removeActive() {
    if (this.mode !== "build") return;
    const part = this.activePart();
    if (!part) {
      this.announce(this.copy.scene.nothingToPutAway);
      return;
    }
    const name = this.nounOf(part);
    const type = part.view.type;
    if (!this.carry || (!this.carry.isNew && this.carry.origin)) this.remember();
    if (this.carry) {
      this.carry = null;
      this.hud.hideTag();
      this.hud.setBoxHover(false);
    }
    this.destroyPart(part);
    this.sfx("remove", 0.8);
    const left = this.remaining(type);
    this.announce(this.copy.scene.putAway(name, this.narrator.count(type, left)));
  }

  private cancelActive() {
    if (this.mode !== "build") return;
    if (this.carry) {
      this.cancelCarry();
      return;
    }
    this.announce(this.selected ? this.copy.scene.nothingToCancelPlaced : this.copy.scene.nothingToCancel);
  }

  private selectNext() {
    if (this.mode !== "build") return;
    const settled = this.settleCarry();
    const before = settled ? `${settled} ` : "";
    if (!this.parts.length) {
      this.announce(`${before}${this.copy.scene.noPartsYet}`);
      return;
    }
    const i = this.selected ? this.parts.indexOf(this.selected) : -1;
    const next = this.parts[(i + 1) % this.parts.length];
    this.sfx("nudge", 0.8);
    this.select(next, true, before);
  }

  private remainingText() {
    const items = this.slotTypes
      .map((t) => ({ t, n: this.remaining(t) }))
      .filter(({ n }) => n > 0)
      .map(({ t, n }) => this.narrator.count(t, n));
    return items.length ? this.narrator.list(items) : this.copy.scene.nothing;
  }

  private describeLevelNow() {
    const placed = this.parts.length ? ` ${this.copy.scene.placedParts(this.parts.map((p) => this.describe(p)))}` : "";
    this.announce(`${this.narrator.describeLevel(this.sceneInfo(), this.levelIndex, LEVELS.length, this.remainingText())}${placed}`);
  }

  private browse(dir: 1 | -1) {
    const info = this.sceneInfo();
    const items = [...sceneOrder(this.level, info.landmarks), ...info.landmarks.filter((l) => l.role === "part" || l.role === "stop")];
    const current = this.referenceId ? items.findIndex((l) => l.id === this.referenceId) : -1;
    const from = current >= 0 ? current : Math.min(this.browseIndex, items.length - 1);
    const i = from < 0 ? (dir > 0 ? 0 : items.length - 1) : (from + dir + items.length) % items.length;
    const lm = items[i];
    this.referenceId = lm.id;
    this.browseIndex = i;
    const active = this.activePart();
    let extra = "";
    if (active && lm.id !== `part-${active.id}`) {
      const v = active.view;
      const where = lm.role === "area" ? this.narrator.areaCoordinates({ x: v.x, y: v.y }, this.level.build) : this.narrator.relation(partPoly(v.type, v.x, v.y, v.rot), lm).text;
      extra = ` ${this.copy.scene.yourPart(where)}`;
    }
    this.announce(this.copy.scene.browse(i + 1, items.length, `${this.narrator.describeLandmark(lm, info)}${extra}`));
  }

  private describeActive() {
    const part = this.activePart();
    if (!part) {
      this.announce(this.copy.scene.noneInHand(this.keyRange(), this.parts.length > 0));
      return;
    }
    this.announce(this.heldDetail(part));
  }

  private query(key: string, shift: boolean) {
    switch (key) {
      case "d":
        this.describeLevelNow();
        return true;
      case "o":
        this.browse(shift ? -1 : 1);
        return true;
      case "i":
        this.describeActive();
        return true;
      case "l":
        this.announce(this.lastReport || this.copy.scene.noAttempts);
        return true;
      default:
        return false;
    }
  }

  private clearAll() {
    if (this.mode !== "build") return;
    this.cancelCarry(true);
    if (!this.parts.length) return;
    this.remember();
    for (const p of [...this.parts]) this.destroyPart(p);
    this.sfx("clear", 0.9);
    this.announce(this.copy.scene.cleared);
  }

  private showHint() {
    if (this.mode !== "build") return;
    this.setHintPulse(false);
    this.showBulb();
    this.say(this.text.hint, 5200);
    this.announce(this.copy.scene.hint(this.text.hint));
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    kb.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ]);
    kb.on("keydown", eachKeyOnce((event) => this.onKey(event)));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    this.input.on("pointerupoutside", (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.skipEnding) {
        this.skipEnding();
        return;
      }
      if (this.mode === "done" && this.resetTimer && !this.finishing) {
        this.resetAfterFail();
        return;
      }
      if (this.mode === "attract") return;
      if (this.camera.free && this.gesture) {
        this.startGesture(pointer);
        return;
      }
      if (this.busyFor(pointer)) return;
      this.touchUi = pointer.wasTouch;
      const onParts = over.every((o) => this.parts.some((p) => p.view.hit === o));
      const inStage = this.camera.inStage(pointer.x, pointer.y) && !this.hud.covers(pointer.x, pointer.y);
      if (this.mode === "build" && pointer.wasTouch && onParts && inStage) {
        const w = this.worldOf(pointer);
        const part = this.pickPart(w.x, w.y);
        if (part) {
          this.onPartPress(part, pointer);
          return;
        }
      }
      if (this.camera.free && over.length === 0 && inStage && !this.dragging()) {
        this.startGesture(pointer);
        return;
      }
      if (this.mode === "build" && over.length === 0) {
        const settled = this.settleCarry();
        if (settled) this.announce(settled);
        this.deselect();
        this.hud.hideGoal();
      }
    });
  }

  private onKey(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (key === "escape" || key === "p") {
      this.ctx.onEvent({ type: "pause-request" });
      return;
    }
    if (this.mode === "attract") return;
    if (!event.repeat && this.query(key, event.shiftKey)) return;
    if (this.mode === "done") {
      if (this.skipEnding && (key === " " || key === "enter")) {
        event.preventDefault();
        this.skipEnding();
      } else if (this.resetTimer && !this.finishing) this.resetAfterFail();
      return;
    }
    if (key === " " || key === "spacebar") {
      event.preventDefault();
      if (!event.repeat) this.toggleRun();
      return;
    }
    if (this.mode !== "build") return;
    if (/^[1-9]$/.test(key)) {
      if (!event.repeat) this.pickWithKeyboard(Number(key) - 1);
      return;
    }
    const arrows: Record<string, [number, number, Direction]> = {
      arrowleft: [-1, 0, "left"],
      arrowright: [1, 0, "right"],
      arrowup: [0, -1, "up"],
      arrowdown: [0, 1, "down"],
    };
    const move = arrows[key];
    if (move) {
      event.preventDefault();
      const started = !this.carry && Boolean(this.selected);
      if (started && this.selected) this.beginCarry(this.selected, "keyboard");
      const c = this.carry;
      if (!c) {
        this.announce(this.copy.scene.pickFirst(this.slotTypes.length));
        return;
      }
      c.via = "keyboard";
      const amount = event.shiftKey ? 3 : 1;
      const step = GRID * amount;
      const b = this.level.build;
      const v = c.part.view;
      const tx = v.x + move[0] * step;
      const ty = v.y + move[1] * step;
      const nx = Phaser.Math.Clamp(tx, b.x, b.x + b.w);
      const ny = Phaser.Math.Clamp(ty, b.y, b.y + b.h);
      this.sfx("nudge", 0.5, 45);
      this.moveCarry(nx, ny);
      const part = c.part;
      const hitEdge = nx !== tx || ny !== ty;
      const report = () => {
        if (this.carry?.part !== part) return;
        const conflict = this.conflictWords(part);
        const path = this.pathWords(part);
        const message = this.narrator.moveMessage({
          dir: move[2],
          amount,
          hitEdge,
          conflict,
          becameValid: !conflict && !this.announcedValid,
          place: this.placeWords(part),
          path: path !== this.announcedPath ? (path ?? this.narrator.offPath(this.ball)) : null,
        });
        this.announcedValid = !conflict;
        this.announcedPath = path;
        this.announce(started ? this.copy.scene.moving(this.nounOf(part), message) : message, true);
      };
      if (event.repeat) {
        this.moveTimer?.remove();
        this.moveTimer = this.time.delayedCall(220, report);
      } else {
        report();
      }
      return;
    }
    switch (key) {
      case "r":
      case "e":
        this.rotateActive(1);
        break;
      case "q":
        this.rotateActive(-1);
        break;
      case "enter": {
        event.preventDefault();
        if (event.repeat) break;
        const picked = this.selected;
        if (this.carry) this.dropCarry();
        else if (picked) {
          this.beginCarry(picked, "keyboard");
          this.announce(this.copy.scene.pickedUp(this.nounOf(picked)));
        } else this.announce(this.copy.scene.noneInHandShort(this.keyRange()));
        break;
      }
      case "c":
        this.cancelActive();
        break;
      case "delete":
      case "backspace":
      case "x":
        event.preventDefault();
        this.removeActive();
        break;
      case "s":
        this.selectNext();
        break;
      case "h":
        this.showHint();
        break;
      case "z":
        if (!event.repeat) this.undo();
        break;
      default:
        break;
    }
  }

  private simRef(target: SimTarget) {
    if (target.kind === "floor" || target.kind === "edge") return target.kind;
    if (target.kind === "block") return `block-${target.index}`;
    return `part-${this.simParts[target.index].id}`;
  }

  private simSound(target: SimTarget): LabSfx {
    if (target.kind === "block") return this.blockSounds[target.index] ?? "tap";
    if (target.kind !== "part") return "tap";
    const type = this.simParts[target.index].view.type;
    return type === "belt" ? "clack" : type === "fan" ? "clink" : "tap";
  }

  private onTouch(target: SimTarget, speed: number, launched: boolean) {
    this.track.touches.push(this.simRef(target));
    if (launched || speed < 2.2) return;
    this.sfx(this.simSound(target), Phaser.Math.Clamp(speed / 12, 0.2, 1), 90);
  }

  private onLaunch(index: number, nx: number, ny: number) {
    const part = this.simParts[index];
    const v = part.view;
    this.track.launches.push(`part-${part.id}`);
    this.lina.flinch();
    const x = this.sim?.x ?? v.x;
    this.launches.push({ part: index, x });
    const last = this.launches.slice(-TRAMPOLINE);
    if (last.length === TRAMPOLINE && last.every((l) => l.part === index && Math.abs(l.x - last[0].x) <= 4)) this.bounced = true;
    v.squash();
    this.sfx("boing", 1, 120);
    this.word(this.copy.scene.boing, v.x + nx * 60, v.y + ny * 60 - 30, "#f06ba8", 46);
  }

  private onWind(indices: number[]) {
    for (const index of indices) {
      const ref = `part-${this.simParts[index].id}`;
      if (!this.track.winds.includes(ref)) this.track.winds.push(ref);
    }
    const inside = indices.length > 0;
    if (inside && !this.inWind) this.sfx("whoosh", 0.9, 400);
    this.inWind = inside;
  }

  toggleRun() {
    if (this.mode === "build") this.startRun();
    else if (this.mode === "running") this.stopRun();
  }

  private startRun() {
    let placed = "";
    if (this.carry) {
      const part = this.carry.part;
      const conflict = this.conflictWords(part);
      if (conflict) {
        this.sfx("invalid", 0.8);
        this.announce(this.copy.scene.cantStart(this.nounOf(part), conflict));
        return;
      }
      placed = `${this.dropCarry(true) ?? ""} `;
    }
    this.press = null;
    this.deselect();
    this.hud.hideTag();
    this.hud.hideGoal();
    this.setHintPulse(false);
    this.setRunPulse(false);
    this.runNudgeTimer?.remove();
    this.stopDemo();
    this.hideSay();
    this.ranOnce = true;
    this.preRun = this.camera.pose;
    this.introCam?.remove();
    this.mode = "running";
    this.closest = null;
    this.launches = [];
    this.bounced = false;
    this.hidden = false;
    this.lina.setBase("watch");
    this.lina.set("watch");
    this.runs += 1;
    this.registry.set(RUNS_KEY, { level: this.level.id, runs: this.runs });
    this.guideGfx?.setVisible(false);
    this.guideArrow?.setVisible(false);
    this.hud.setRunning(true);
    this.tweens.add({ targets: this.buildArea, alpha: 0, duration: 200 });
    this.trail = [];
    this.trailGfx.clear();

    const level = this.level;
    this.track = { touches: [], launches: [], winds: [] };
    this.blockSounds = sceneBlocks(level).map((b) => (b.kind === "metal" || b.kind === "pole" ? "clink" : "tap"));
    this.simParts = [...this.parts];
    for (const part of this.parts) part.view.setRunning(true);
    this.sim?.destroy();
    const sim = new LabSim(
      level,
      this.parts.map(({ view: v }) => ({ type: v.type, x: v.x, y: v.y, rot: v.rot })),
      {
        touch: (target, speed, launched) => this.onTouch(target, speed, launched),
        launch: (index, nx, ny) => this.onLaunch(index, nx, ny),
        belt: () => this.sfx("clack", 0.5, 240),
        wind: (indices) => this.onWind(indices),
      },
    );
    this.sim = sim;
    this.ballImg.setPosition(sim.x, sim.y).setAngle(0).setScale(1).setAlpha(1).setVisible(true);
    this.acc = 0;
    this.inWind = false;
    const dir = level.pipe.flip ? -1 : 1;
    this.ballImg.setPosition(level.pipe.x - 8 * dir, level.pipe.y);

    this.sfx("run", 0.9);
    const reduced = this.ctx.reducedMotion;
    this.launchAt = this.time.now + (reduced ? 0 : 360);
    if (!reduced) {
      const px = this.pipe.x;
      this.sfx("rattle", 0.9);
      this.tweens.add({ targets: this.pipe, x: px + 4, duration: 45, yoyo: true, repeat: 3, onComplete: () => this.pipe.setX(px) });
    }
    this.time.delayedCall(reduced ? 0 : 340, () => {
      if (this.mode !== "running") return;
      this.sfx("plop", 0.8);
      this.puff(level.pipe.x + 6 * dir, level.pipe.y - 10, 2, 0.6);
      if (!reduced) {
        this.pipe.setScale(1.05, 0.95);
        this.tweens.add({ targets: this.pipe, scaleX: 1, scaleY: 1, duration: 260, ease: "Back.easeOut" });
      }
    });
    this.say(this.copy.scene.go, 1100);
    this.announce(this.copy.scene.started(placed, !this.parts.length));
  }

  private runReport(outcome: RunOutcome) {
    const sim = this.sim;
    const end = sim ? { x: sim.x, y: sim.y } : { x: this.ballImg.x, y: this.ballImg.y };
    const path = this.trail.map(([x, y]) => ({ x, y }));
    const report = this.narrator.describeRun({ attempt: this.runs, ...this.track, path, end, outcome }, this.sceneInfo(false));
    this.lastPath = [...path, end];
    this.lastStop = outcome === "stopped" || outcome === "timeout" || outcome === "cancelled" ? end : null;
    this.lastReport = report;
    return report;
  }

  private stopRun() {
    this.sfx("stop", 0.8);
    this.announce(this.copy.scene.stopped(this.runReport("cancelled")));
    this.endRun();
  }

  private endRun() {
    this.sim?.destroy();
    this.sim = null;
    this.simParts = [];
    for (const p of this.parts) p.view.setRunning(false);
    const level = this.level;
    const dir = level.pipe.flip ? -1 : 1;
    this.ballImg.setPosition(level.pipe.x - 8 * dir, level.pipe.y).setAngle(0).setAlpha(1).setVisible(true);
    if (!this.ctx.reducedMotion) {
      this.ballImg.setScale(0.2);
      this.tweens.add({ targets: this.ballImg, scale: 1, duration: 260, ease: "Back.easeOut" });
    } else {
      this.ballImg.setScale(1);
    }
    this.mode = "build";
    this.lina.lookAt(null);
    this.lina.setBase("idle");
    this.hud.setRunning(false);
    this.refreshHud();
    this.refreshGuide();
    this.tweens.add({ targets: this.buildArea, alpha: 1, duration: 200 });
    this.drawTrail();
    if (this.camera.free && this.preRun) this.camera.animateTo(this.preRun, 450);
    this.preRun = null;
  }

  private puff(x: number, y: number, count: number, scale = 1, tex = "smoke") {
    const reduced = this.ctx.reducedMotion;
    for (let i = 0; i < count; i += 1) {
      const img = this.add
        .image(x + Phaser.Math.Between(-24, 24), y + Phaser.Math.Between(-14, 14), tex)
        .setDepth(13)
        .setScale(scale * Phaser.Math.FloatBetween(0.5, 0.8));
      this.tweens.add({
        targets: img,
        scale: img.scale * (reduced ? 1 : 1.7),
        y: img.y - (reduced ? 0 : Phaser.Math.Between(20, 50)),
        alpha: 0,
        duration: Phaser.Math.Between(500, 800),
        ease: "Quad.easeOut",
        onComplete: () => img.destroy(),
      });
    }
  }

  private confetti(count = 30) {
    if (this.ctx.reducedMotion) return;
    for (let i = 0; i < count; i += 1) {
      const x = Phaser.Math.Between(40, W - 40);
      const piece = this.add
        .rectangle(x, Phaser.Math.Between(-160, -20), Phaser.Math.Between(10, 18), Phaser.Math.Between(16, 26), CONFETTI[i % CONFETTI.length])
        .setStrokeStyle(2, 0x1d1830)
        .setDepth(19)
        .setAngle(Phaser.Math.Between(0, 180));
      this.tweens.add({
        targets: piece,
        y: H + 60,
        x: x + Phaser.Math.Between(-140, 140),
        angle: piece.angle + Phaser.Math.Between(-540, 540),
        duration: Phaser.Math.Between(1500, 2600),
        delay: Phaser.Math.Between(0, 400),
        ease: "Sine.easeIn",
        onComplete: () => piece.destroy(),
      });
    }
  }

  private drawTrail() {
    const g = this.trailGfx;
    g.clear();
    this.trail.forEach(([x, y], i) => {
      if (i % 2) return;
      g.fillStyle(0x1d1830, 0.35);
      g.fillCircle(x + 1.5, y + 2, 6);
      g.fillStyle(0xfbf5e6, 0.8);
      g.fillCircle(x, y, 5);
    });
    const c = this.closest;
    if (!c || c.gap <= 0) return;
    const r = BALL_R + 10;
    g.lineStyle(8, 0x1d1830, 0.45);
    g.strokeCircle(c.x + 2, c.y + 3, r);
    g.lineStyle(5, c.gap <= NEAR_MISS ? 0xffc83d : 0xfbf5e6, 0.95);
    g.strokeCircle(c.x, c.y, r);
  }

  private spotlight(ms: number) {
    if (this.frame.kind === "tall") return;
    const z = this.zone;
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    const r = Math.max(170, Math.hypot(z.w, z.h) / 2 + 50);
    const shade = this.add.rectangle(-200, -200, W + 400, H + 400, 0x1d1830, 0.34).setOrigin(0).setDepth(10.5).setAlpha(0);
    const hole = this.make.graphics({}, false);
    hole.fillStyle(0xffffff, 1);
    hole.fillCircle(cx, cy, r);
    const mask = hole.createGeometryMask();
    mask.setInvertAlpha(true);
    shade.setMask(mask);
    const ring = this.add.circle(cx, cy, r).setStrokeStyle(6, 0xfbf5e6, 0.5).setDepth(10.6).setAlpha(0);
    const done = () => {
      shade.destroy();
      ring.destroy();
      hole.destroy();
    };
    if (this.ctx.reducedMotion) {
      shade.setAlpha(1);
      ring.setAlpha(1);
      this.time.delayedCall(Math.min(ms, 1400), done);
      return;
    }
    this.tweens.add({ targets: [shade, ring], alpha: 1, duration: 220, delay: 80 });
    this.tweens.add({ targets: [shade, ring], alpha: 0, delay: Math.min(ms, 1600), duration: 320, onComplete: done });
  }

  private pulseClosest() {
    const c = this.closest;
    if (!c || this.ctx.reducedMotion) return;
    const ring = this.add.circle(c.x, c.y, BALL_R + 10).setStrokeStyle(6, 0xffc83d, 1).setDepth(6.5);
    this.tweens.add({ targets: ring, scale: { from: 2.2, to: 1 }, alpha: { from: 0, to: 1 }, duration: 380, ease: "Quad.easeOut", onComplete: () => this.tweens.add({ targets: ring, alpha: 0, delay: 500, duration: 300, onComplete: () => ring.destroy() }) });
  }

  private stepRun() {
    const sim = this.sim;
    if (!sim) return;
    const outcome = sim.step();
    if (this.mode !== "running" || this.sim !== sim) return;
    if (sim.steps % 3 === 0) this.trail.push([sim.x, sim.y]);
    const gap = sensorGap({ x: sim.x, y: sim.y }, this.goalPoly);
    if (!this.closest || gap < this.closest.gap) this.closest = { gap, x: sim.x, y: sim.y };
    if (outcome === "success") this.success();
    else if (outcome) this.fail(outcome);
    else if (this.bounced) this.fail("timeout", true);
  }

  private fail(outcome: "out" | "stopped" | "timeout", bounced = false) {
    if (this.mode !== "running") return;
    const s = this.copy.scene;
    const out = outcome === "out";
    const near = !bounced && this.closest !== null && this.closest.gap <= NEAR_MISS;
    const reason = s.failReason(this.ball, outcome);
    const report = bounced ? `${this.runReport("cancelled")} ${s.bounceReport(this.ball)}` : this.runReport(outcome);
    this.mode = "done";
    this.fails += 1;
    this.sfx("slide", 0.9);
    this.mood(out ? "cover" : near ? "close" : "oops", 2200);
    if (near) this.time.delayedCall(200, () => this.pulseClosest());
    this.hud.flash(s.nope, "#ef4f43", 650);
    for (const p of this.parts) p.view.shake();
    const level = this.level;
    const offGuide = level.guide && !this.parts.some((p) => this.atGuide(p));
    const lines = near ? s.nearLines : s.missLines;
    const line = bounced ? s.bounceSay : lines[(this.fails - 1) % lines.length];
    const showHint = !offGuide && this.fails === 2;
    const lineText = offGuide ? s.offGuideSay : showHint ? s.psst(this.text.hint) : bounced ? line : `${line} ${reason}`;
    this.say(lineText, showHint || offGuide ? 5200 : 2400);
    if (showHint) this.showBulb();
    const advice = offGuide ? s.offGuideAdvice : showHint ? s.hint(this.text.hint) : s.tryAgain;
    this.announce(s.failed(report, advice, this.fails === 1));
    if (this.fails >= 2) this.setHintPulse(!showHint);
    const bx = Phaser.Math.Clamp(this.ballImg.x, 80, W - 80);
    const by = Phaser.Math.Clamp(this.ballImg.y, 120, FLOOR_Y);
    this.time.delayedCall(520, () => {
      if (this.mode !== "done") return;
      this.sfx("poof", 0.9);
      this.word(out ? s.bye : s.poof, bx, by - 70, "#fbf5e6", 50);
      if (!out) {
        const boom = this.add.image(bx, by, "boom").setDepth(12).setScale(0.3);
        this.tweens.add({ targets: boom, scale: 0.85, alpha: 0, duration: this.ctx.reducedMotion ? 200 : 380, ease: "Quad.easeOut", onComplete: () => boom.destroy() });
        this.puff(bx, by, this.ctx.reducedMotion ? 1 : 4, 1.1);
        this.ballImg.setVisible(false);
      }
    });
    this.resetTimer = this.time.delayedCall(RESET_MS, () => this.resetAfterFail());
  }

  private resetAfterFail() {
    this.resetTimer?.remove();
    this.resetTimer = null;
    if (this.mode !== "done" || this.finishing) return;
    this.mode = "running";
    this.endRun();
  }

  private success() {
    if (this.mode !== "running") return;
    const steps = this.sim?.steps ?? 0;
    this.registry.remove(RUNS_KEY);
    const replay = this.parts.map((p) => ({ type: p.view.type, x: p.view.x, y: p.view.y, rot: p.view.rot }));
    this.announce(this.copy.scene.worked(this.runReport("success")));
    this.mode = "done";
    this.finishing = true;
    this.hud.setDone();
    const level = this.level;
    if (this.sim) this.ballImg.setPosition(this.sim.x, this.sim.y);
    for (const p of this.parts) p.view.setRunning(false);
    this.guideGfx?.setVisible(false);
    this.guideArrow?.setVisible(false);
    const used = this.parts.length;
    const hold = this.goal.celebrate(this.ballImg);
    this.time.delayedCall(260, () => this.sfx("success", 1));
    this.time.delayedCall(620, () => this.sfx("party", 0.8));
    this.lina.lookAt(null);
    this.lina.setBase("yay");
    if (used < level.par) {
      this.lina.set("wow", 700);
    } else {
      this.lina.set("yay");
    }
    if (this.frame.kind === "tall") {
      const z = this.zone;
      this.camera.animateTo(level.goal.type === "button" ? this.camera.overviewPose() : { x: z.x + z.w / 2, y: z.y + z.h / 2, zoom: this.camera.base.zoom }, 450);
    } else {
      this.say(this.text.cheer ?? this.text.win, 2600, 26);
    }
    if (level.goal.type !== "button") this.spotlight(Math.max(hold, 1500));
    this.time.delayedCall(this.ctx.reducedMotion ? 0 : 300, () => this.confetti());
    if (!this.ctx.reducedMotion) {
      this.lina.hop();
      this.cameras.main.shake(120, 0.003);
    }

    const total = Object.values(level.inventory).reduce((a, b) => a + (b ?? 0), 0);
    const saved = total - used;
    const stars = starsFor(used, level.par);
    const r = this.copy.result;
    const breakdown = [
      { label: r.worked, value: LAB_SCORE.worked },
      { label: r.saved(saved), value: saved * LAB_SCORE.savedPart },
      { label: r.tries(this.runs), value: attemptBonus(this.runs) },
    ].filter((row, i) => i === 0 || row.value > 0);
    this.time.delayedCall(this.ctx.reducedMotion ? 0 : 320, () =>
      this.hud.celebrate(stars, (i, lit, x, y) => {
        if (!lit) return;
        this.ctx.audio.play(LAB_SFX.starPop, { volume: 0.9, pitch: 1 + i * 0.12 });
        const at = this.toWorld(x, y);
        if (!this.ctx.reducedMotion) this.burst(at.x, at.y, 5, "spark");
      }),
    );
    const score = labScore(total, used, this.runs);
    const achievements = ["lab-first"];
    if (used < level.par) achievements.push("lab-minimalist");
    if (this.levelIndex === LEVELS.length - 1) achievements.push("lab-complete");
    this.ctx.onEvent({ type: "score", score });
    const result: GameResult = {
      won: true,
      score,
      stars,
      breakdown,
      stats: { parts: used, inventory: total, par: level.par, runs: this.runs, steps },
      replay: { kind: "lab-placements", version: 1, parts: replay },
      achievements,
      level: { index: this.levelIndex, id: level.id, title: this.text.title, total: LEVELS.length },
      copy: { title: this.text.result ?? r.title, text: this.text.win },
      summary: r.summary(used),
      ...(stars < 3 ? { starHint: r.starHint(level.par) } : {}),
    };
    let sent = false;
    const finish = () => {
      if (sent) return;
      sent = true;
      this.skipEnding = null;
      this.ctx.onEvent({ type: "finished", result });
    };
    const timer = this.time.delayedCall(Math.max(hold, 1500) + 600, finish);
    if (hold > 2600)
      this.time.delayedCall(900, () => {
        if (!sent)
          this.skipEnding = () => {
            timer.remove();
            finish();
          };
      });
  }

  private liftCarry(delta: number) {
    const c = this.carry;
    if (!c || c.via !== "pointer" || this.mode !== "build") return;
    const scrolled = this.camera.edgeScroll(c.at.x, delta);
    if (c.offsetY === c.liftY && !scrolled) return;
    const gap = c.liftY - c.offsetY;
    c.offsetY = Math.abs(gap) < 2 ? c.liftY : c.offsetY + gap * Math.min(1, delta / TOUCH.liftMs);
    const w = this.toWorld(c.at.x, c.at.y);
    this.moveCarry(w.x + c.offsetX, w.y + c.offsetY);
  }

  update(_time: number, delta: number) {
    for (const p of this.parts) p.view.update(delta);
    this.lina.update();
    this.liftCarry(delta);
    const ball = (this.mode === "running" || this.mode === "done") && this.ballImg.visible ? { x: this.ballImg.x, y: this.ballImg.y } : null;
    if (this.camera.update(delta, this.time.now, ball, this.finishing) && this.selected) this.placeToolbar(this.selected);
    this.hud.setView({ away: this.camera.isAway(), overview: this.camera.isOverview() });
    if (this.mode !== "running") return;
    if (this.time.now < this.launchAt) {
      this.acc = 0;
      return;
    }
    this.acc += Math.min(delta, 100);
    let steps = 0;
    while (this.acc >= STEP_MS && steps < 6 && this.mode === "running") {
      this.stepRun();
      this.acc -= STEP_MS;
      steps += 1;
    }
    if (steps === 6) this.acc = 0;
    const sim = this.sim;
    if (sim && this.mode === "running") {
      this.ballImg.setPosition(sim.x, sim.y).setRotation(sim.angle);
      this.lina.lookAt({ x: sim.x, y: sim.y });
      if (!this.hidden && sim.y < OFF_TOP) {
        this.hidden = true;
        this.lina.set("cover");
      } else if (this.hidden && sim.y > -OFF_TOP) {
        this.hidden = false;
        this.lina.set("watch");
      }
    }
  }
}
