import * as Phaser from "phaser";
import { getAudio } from "@/lib/audio/engine";
import type { SoundRecipe } from "@/lib/audio/types";
import type { Locale } from "@/i18n/locales";
import { RACE_COPY, type RaceCopy } from "../copy";
import type { CameraTuning, InputState } from "../input";
import type { TrackRecord } from "../save";
import { DEFAULT_PARAMS, cloneParams, type Params } from "../sim/params";
import { placeOf, RACE_SLOTS, slotDef } from "../sim/score";
import { FRAME_AIR, FRAME_CRASH, FRAME_CROUCH, FRAME_PADDLE, InputRecorder, simulateLog, timeAtX, type RunFrames } from "../sim/replay";
import { RaceWorld, type WorldEvent } from "../sim/race";
import { CART_RULES, type CartId } from "../sim/carts";
import { decodeTape, encodeTape, type RivalDef, type RivalSlot } from "../sim/tapes";
import { DownhillSim, DT, IDLE, STEP_HZ, type SimEvent, type SimStats } from "../sim/sim";
import type { Course, CourseId } from "../sim/course";
import { buildCourse } from "../sim/courses";
import { covers, heightAt } from "../sim/track";
import { boing, DOWNHILL_SFX, PADDLE, rollGrain, windGrain } from "../sounds";
import { CartView, INK } from "./cart";
import { WorldFx } from "./fx";
import { formatNumber } from "@/i18n/format";
import { H, Hud, W, formatSeconds, type EdgeTag, type HudButton, type Marker, type StandingRow, type TouchButton } from "./hud";
import { Ambient } from "./ambient";
import { ANTENA_FILES } from "./antena";
import { FEIRA_FILES } from "./feira";
import { dressGaps } from "./props";
import { SAMPLE_RES } from "./sample";
import { LANE_OFFSETS, LANES, buildTerrain, zonesOf, type Chunk, type LipView, type ObstacleView } from "./terrain";

export type Ghost = { frames: RunFrames; time: number };

export type RaceForm = { best: number; last: number; runs: number; ghost: Ghost | null };

export type RaceFinish = {
  course: CourseId;
  cart: CartId;
  time: number;
  place: number;
  standings: { who: CartId; time: number; you: boolean }[];
  stats: SimStats;
  tape: string;
  picks: number[];
  previous: TrackRecord | null;
};

export type SceneBridge = {
  locale: Locale;
  fonts: { display: string; body: string };
  reducedMotion: boolean;
  params: Params;
  camera: CameraTuning;
  input: InputState;
  course: CourseId;
  cart: CartId;
  ghost: boolean;
  rivalDefs: readonly RivalDef[];
  form: RaceForm;
  records: { load: (course: CourseId) => TrackRecord | null; save: (course: CourseId, record: TrackRecord) => void };
  onBeat: (course: CourseId, rival: CartId) => void;
  onShow: (points: number) => void;
  onFinish: (finish: RaceFinish) => void;
};

export const COURSE_FILES: Record<CourseId, [string, string][]> = {
  arlindo: [],
  feira: FEIRA_FILES.map(([key, file]): [string, string] => [key, `feira/${file}`]),
  antena: [...FEIRA_FILES.map(([key, file]): [string, string] => [key, `feira/${file}`]), ...ANTENA_FILES.map(([key, file]): [string, string] => [key, `antena/${file}`])],
};

type Slot = RivalSlot;

type Rival = { id: CartId; slot: Slot; laneIndex: number; def: RivalDef; fita: number; name: string; frames: RunFrames; view: CartView; label: Phaser.GameObjects.Text; color: number; letter: string; alpha: number; ahead: boolean; pending: number; flash: number; prev: { x: number; y: number; angle: number }; crashStart: number; lane: number };


const RIVAL_COLORS: Record<CartId, number> = { deco: 0xffc83d, lina: 0xf27aa8, bruno: 0x56c7a0, mila: 0xa98bef };
const SLOTS: readonly Slot[] = ["lina", "bruno", "mila"];
const SLOT_DEPTHS: Record<Slot, number> = { lina: 6, bruno: 5, mila: 4.15 };
const PLAYER_COLOR = 0xff7a1a;
const TIER_LIMITS = [800, 1400, 2000];
const TRAIL = 30;
const ZOOM_MIN_GROUND = 0.92;
const ZOOM_MIN_RIVAL = 1;
const ZOOM_MIN_AIR = 0.55;
const FIRST_RACE: Record<CourseId, Record<Slot, number>> = { arlindo: { lina: 41, bruno: 48, mila: 44.5 }, feira: { lina: 43.5, bruno: 51, mila: 47 }, antena: { lina: 47.5, bruno: 55, mila: 51 } };
const PACE: Record<Slot, number> = { lina: -1.2, bruno: 0.8, mila: -0.3 };

function tierOf(speed: number) {
  let t = 0;
  for (const limit of TIER_LIMITS) if (speed >= limit) t += 1;
  return t;
}

function wrap(a: number) {
  let d = a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function lerpAngle(a: number, b: number, t: number) {
  return a + wrap(b - a) * t;
}

function damp(rate: number, dt: number) {
  return 1 - Math.exp(-rate * dt);
}

export class RaceScene extends Phaser.Scene {
  private bridge!: SceneBridge;
  private copy!: RaceCopy;
  private track!: Course;
  private sim!: DownhillSim;
  private recorder = new InputRecorder();
  private liveFrames: { x: number[]; y: number[]; angle: number[]; speed: number[]; flags: number[] } = { x: [], y: [], angle: [], speed: [], flags: [] };
  private worldLayer!: Phaser.GameObjects.Layer;
  private hudLayer!: Phaser.GameObjects.Layer;
  private fgLayer!: Phaser.GameObjects.Layer;
  private bgLayer!: Phaser.GameObjects.Layer;
  private worldCam!: Phaser.Cameras.Scene2D.Camera;
  private parallax: { sprite: Phaser.GameObjects.TileSprite; factor: number; y: number; drift: number; fade: number }[] = [];
  private sampleFadeX = -Infinity;
  private landmarks: { img: Phaser.GameObjects.Image; base: number; factor: number; y: number; drift: number; light?: Phaser.GameObjects.Graphics }[] = [];
  private sun!: Phaser.GameObjects.Graphics;
  private fg: { sprite: Phaser.GameObjects.TileSprite; factor: number }[] = [];
  private chunks: Chunk[] = [];
  private visibleChunks = "";
  private obstacles: ObstacleView[] = [];
  private lipViews: LipView[] = [];
  private cart!: CartView;
  private player: CartId = "deco";
  private gridSpan = { min: 0, max: 0 };
  private jumpLineTip = false;
  private ghostView!: CartView;
  private rivals: Rival[] = [];
  private fx!: WorldFx;
  private hud!: Hud;
  private overlay!: Phaser.GameObjects.Graphics;
  private trailG!: Phaser.GameObjects.Graphics;
  private trail: { x: number; y: number; a: number }[] = [];
  private phase: "countdown" | "race" | "done" = "countdown";
  private countdownT = 0;
  private countdownShown = -1;
  private goT = 0;
  private finishT = -1;
  private finished: RaceFinish | null = null;
  private shownShow = 0;
  private acc = 0;
  private prev = { x: 0, y: 0, angle: 0 };
  private dist = 0;
  private elapsed = 0;
  private raceTime = 0;
  private cam = { x: 0, y: 0, zoom: 1, shake: 0, dip: 0, dipVel: 0 };
  private trend = 0;
  private lastSpeed = 0;
  private lastTier = 0;
  private rollT = 0;
  private windT = 0;
  private paddleT = 0;
  private spinT = 0;
  private charged = false;
  private touchActive = false;
  private pointerButtons = new Map<number, HudButton>();
  private pressed = new Set<TouchButton>();
  private jumpedThisRun = false;
  private spunThisFlight = false;
  private alignLessons = 0;
  private spinKey!: Phaser.GameObjects.Text;
  private ghostLabel!: Phaser.GameObjects.Text;
  private flightTip = false;
  private chargedFor = 0;
  private hitTips = 0;
  private record: TrackRecord | null = null;
  private sectionMarks: number[] = [];
  private nextSection = 0;
  private takeoffSpeed = 0;
  private playerFlash = 0;
  private predictedAir = 0;
  private rivalCache = new Map<string, RunFrames>();
  private camSpeed = 0;
  private world!: RaceWorld;
  private ambient!: Ambient;
  private kickViews = new Map<number, Phaser.GameObjects.Container>();
  private rollCycle = new Map<ObstacleView, number>();
  private helmetOn = false;
  private surfaceTips = new Set<string>();
  private awningTips = 0;
  private dustyOn = false;

  constructor() {
    super("race");
  }

  preload() {
    const bridge = this.registry.get("bridge") as SceneBridge;
    for (const [key, file] of COURSE_FILES[bridge.course]) this.load.svg(key, `/assets/downhill-derby/${file}.svg`, { scale: SAMPLE_RES });
  }

  create() {
    this.bridge = this.registry.get("bridge") as SceneBridge;
    this.copy = RACE_COPY[this.bridge.locale];
    this.track = buildCourse(this.bridge.course);
    this.bgLayer = this.add.layer();
    this.worldLayer = this.add.layer();
    this.fgLayer = this.add.layer();
    this.hudLayer = this.add.layer();
    const bgCam = this.cameras.main;
    bgCam.setBackgroundColor("#8fd4f7");
    this.worldCam = this.cameras.add(0, 0, W, H);
    const uiCam = this.cameras.add(0, 0, W, H);
    bgCam.ignore([this.worldLayer, this.fgLayer, this.hudLayer]);
    this.worldCam.ignore([this.bgLayer, this.fgLayer, this.hudLayer]);
    uiCam.ignore([this.bgLayer, this.worldLayer]);
    this.buildBackground();
    this.buildForeground();
    const terrain = buildTerrain(this, this.worldLayer, this.track, this.copy, this.bridge.fonts, true);
    this.chunks = terrain.chunks;
    this.obstacles = terrain.obstacles;
    const rolling = new Set<Phaser.GameObjects.GameObject>(this.obstacles.filter((o) => o.obstacle.roll).map((o) => o.view));
    for (const c of this.chunks) c.objects = c.objects.filter((obj) => !rolling.has(obj));
    this.lipViews = terrain.lips;
    this.ambient = new Ambient(terrain.builder, this.worldLayer, this.track, terrain.zones, this.copy);
    this.ambient.waiting(dressGaps(terrain.builder, terrain.zones, this.track));
    this.trailG = this.add.graphics();
    this.trailG.setDepth(8.5);
    this.worldLayer.add(this.trailG);
    this.player = this.bridge.cart;
    this.gridSpan = { min: this.track.start, max: this.track.start };
    SLOTS.forEach((slot, i) => {
      const def = slotDef(this.bridge.rivalDefs, slot, this.player);
      if (!def || def.fitas.length === 0) return;
      const id = def.id;
      const frames = this.framesFor(def, 0);
      const view = new CartView(this, this.worldLayer, id, { alpha: 1 });
      view.setDepth(SLOT_DEPTHS[slot]);
      const name = this.copy.rivalNames[id];
      const label = this.add.text(0, 0, name.toUpperCase(), { fontFamily: this.bridge.fonts.display, fontSize: "30px", color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 8 });
      label.setOrigin(0.5, 1).setDepth(8);
      this.worldLayer.add(label);
      view.label = label;
      this.gridSpan.min = Math.min(this.gridSpan.min, def.start);
      this.gridSpan.max = Math.max(this.gridSpan.max, def.start);
      this.rivals.push({ id, slot, laneIndex: i + 1, def, fita: 0, name, frames, view, label, color: RIVAL_COLORS[id], letter: name.charAt(0).toUpperCase(), alpha: 1, ahead: false, pending: 0, flash: 0, prev: { x: 0, y: 0, angle: 0 }, crashStart: -1, lane: LANES[slot] });
    });
    this.ghostView = new CartView(this, this.worldLayer, this.player, { ghost: true, alpha: 0.28 });
    this.ghostView.setDepth(3.6);
    this.ghostView.setVisible(false);
    this.ghostLabel = this.add.text(0, 0, this.copy.ghost.toUpperCase(), { fontFamily: this.bridge.fonts.display, fontSize: "24px", color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 6 });
    this.ghostLabel.setOrigin(0.5, 1).setDepth(8).setAlpha(0.75).setVisible(false);
    this.worldLayer.add(this.ghostLabel);
    this.cart = new CartView(this, this.worldLayer, this.player);
    this.cart.setDepth(10);
    this.overlay = this.add.graphics();
    this.overlay.setDepth(9);
    this.worldLayer.add(this.overlay);
    this.spinKey = this.add.text(0, 0, "", { fontFamily: this.bridge.fonts.display, fontSize: "40px", color: "#1d1830", backgroundColor: "#fbf5e6", padding: { x: 12, y: 2 } });
    this.spinKey.setOrigin(0.5).setDepth(9.1).setVisible(false);
    this.worldLayer.add(this.spinKey);
    this.fx = new WorldFx(this, this.worldLayer);
    this.hud = new Hud(this, this.hudLayer, this.copy, this.bridge.locale, this.bridge.fonts);
    this.touchActive = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches === true;
    this.hud.setTouch(this.touchActive);
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.pointerDown(p));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.pointerUp(p));
    this.input.on("pointerupoutside", (p: Phaser.Input.Pointer) => this.pointerUp(p));
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.input.removeAllListeners());
    this.restartRace();
  }

  private framesFor(def: RivalDef, index: number) {
    const key = `${def.id}:${def.slot ?? ""}:${index}`;
    let frames = this.rivalCache.get(key);
    if (!frames) {
      frames = simulateLog(this.track, cloneParams(DEFAULT_PARAMS), decodeTape(def.fitas[index].tape), STEP_HZ * 2, STEP_HZ * 240, def.start, def.id);
      this.rivalCache.set(key, frames);
    }
    return frames;
  }

  private pickRivals() {
    const form = this.bridge.form;
    const pace = form.runs > 0 ? (form.best + form.last) / 2 : null;
    for (const r of this.rivals) {
      const target = pace === null ? FIRST_RACE[this.track.id][r.slot] : pace + PACE[r.slot];
      let index = 0;
      let gap = Infinity;
      r.def.fitas.forEach((f, i) => {
        const d = Math.abs(f.time - target);
        if (d < gap) {
          gap = d;
          index = i;
        }
      });
      if (index !== r.fita) {
        r.fita = index;
        r.frames = this.framesFor(r.def, index);
      }
    }
  }

  private texture(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
    const g = this.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private buildBackground() {
    this.texture("dd-clouds", 1400, 260, (g) => {
      g.fillStyle(0xffffff, 0.9);
      for (const [x, y, s] of [
        [120, 120, 1],
        [620, 70, 0.8],
        [1060, 150, 1.2],
      ]) {
        g.fillCircle(x, y, 46 * s);
        g.fillCircle(x + 55 * s, y - 18 * s, 56 * s);
        g.fillCircle(x + 120 * s, y, 44 * s);
        g.fillRoundedRect(x - 30 * s, y, 180 * s, 40 * s, 20 * s);
      }
    });
    this.texture("dd-far", 1024, 420, (g) => {
      g.fillStyle(0xb5e2c6, 1);
      g.beginPath();
      g.moveTo(0, 420);
      for (let x = 0; x <= 1024; x += 16) g.lineTo(x, 170 + Math.sin((x / 1024) * Math.PI * 4) * 46 + Math.sin((x / 1024) * Math.PI * 2) * 30);
      g.lineTo(1024, 420);
      g.closePath();
      g.fillPath();
      g.fillStyle(0x92cfae, 1);
      g.fillRect(700, 60, 14, 140);
      g.fillRect(780, 60, 14, 140);
      g.fillRoundedRect(680, 20, 134, 66, 18);
      g.fillRect(744, -40, 8, 70);
    });
    this.texture("dd-mid", 1062, 360, (g) => {
      const tones = [0xcdbff0, 0xbcaee6, 0xd8cdf4];
      for (let i = 0; i < 9; i += 1) {
        const x = i * 118;
        const h = 120 + ((i * 53) % 90);
        g.fillStyle(tones[i % 3], 1);
        g.fillRect(x, 360 - h, 104, h);
        g.fillTriangle(x - 10, 360 - h, x + 114, 360 - h, x + 52, 360 - h - 56);
        g.fillStyle(0xeee8fb, 1);
        g.fillRect(x + 20, 360 - h + 30, 24, 24);
        g.fillRect(x + 60, 360 - h + 30, 24, 24);
      }
    });
    this.texture("dd-near", 1600, 300, (g) => {
      const tones = [0xa594d8, 0x9583cc, 0xb2a3e0];
      for (let i = 0; i < 8; i += 1) {
        const x = i * 200 + (i % 2) * 30;
        const h = 150 + ((i * 71) % 110);
        g.fillStyle(tones[i % 3], 1);
        g.fillRect(x, 300 - h, 150, h);
        g.fillTriangle(x - 14, 300 - h, x + 164, 300 - h, x + 75, 300 - h - 70);
        g.fillStyle(0xd9d0f5, 1);
        g.fillRect(x + 26, 300 - h + 40, 34, 34);
        g.fillRect(x + 90, 300 - h + 40, 34, 34);
      }
      g.fillStyle(0x7d6bb8, 1);
      for (let x = 0; x < 1600; x += 400) g.fillCircle(x + 330, 210, 70);
    });
    const dusk = this.track.id === "antena";
    if (dusk) {
      const sky = this.add.graphics();
      const top = Phaser.Display.Color.ValueToColor(0x8f7ad8);
      const bottom = Phaser.Display.Color.ValueToColor(0xffb48a);
      for (let k = 0; k < 16; k += 1) {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, 15, k);
        sky.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
        sky.fillRect(0, (k * H) / 16, W, H / 16 + 2);
      }
      this.bgLayer.add(sky);
    }
    const sun = this.add.graphics();
    sun.fillStyle(dusk ? 0xff9a5c : 0xfff1a8, 1);
    if (dusk) {
      sun.fillStyle(0xffd2a0, 0.45);
      sun.fillCircle(1380, 560, 170);
      sun.fillStyle(0xff8a52, 1);
      sun.fillCircle(1380, 560, 116);
    } else if (this.track.id === "feira") sun.fillCircle(1120, 120, 96);
    else sun.fillCircle(1500, 230, 90);
    this.bgLayer.add(sun);
    this.sun = sun;
    const sample = true;
    this.sampleFadeX = Infinity;
    const layers: [string, number, number, number, number, number][] = [
      ["dd-clouds", 0.015, 40, 260, 0.15, 0],
      ["dd-far", 0.05, 250, 420, 0.4, sample ? -1 : 0],
      ["s-bg-morro", 0.06, 200, 420, 0.42, 1],
      ["dd-mid", 0.14, 330, 380, 0.6, sample ? -1 : 0],
      ["s-bg-telhados", 0.22, 400, 360, 0.7, 1],
      ["dd-near", 0.32, 420, 300, 0.8, sample ? -1 : 0],
    ];
    for (const [key, factor, y, h, drift, fade] of layers) {
      if (fade === 1 && !sample) continue;
      const sprite = this.add.tileSprite(0, y, W, h, key).setOrigin(0, 0);
      if (key.startsWith("s-")) sprite.setTileScale(1 / SAMPLE_RES);
      if (dusk) sprite.setTint(key === "dd-clouds" ? 0xffc6c0 : 0xffc9a8);
      this.bgLayer.add(sprite);
      this.parallax.push({ sprite, factor, y, drift, fade });
      if (key === "dd-mid") this.buildLandmarks();
    }
  }

  private buildLandmarks() {
    const wall = 0xa898dc;
    const dark = 0x8f7fc8;
    const glow = 0xeee8fb;
    this.texture("dd-lm-church", 300, 470, (g) => {
      g.fillStyle(wall, 1);
      g.fillRect(20, 250, 260, 220);
      g.fillTriangle(0, 252, 300, 252, 150, 170);
      g.fillRect(105, 70, 90, 190);
      g.fillTriangle(95, 72, 205, 72, 150, 0);
      g.fillStyle(dark, 1);
      g.fillRect(146, 6, 8, 40);
      g.fillRect(134, 18, 32, 8);
      g.fillStyle(glow, 1);
      g.fillCircle(150, 120, 22);
      g.fillStyle(dark, 1);
      g.fillRect(148, 104, 4, 18);
      g.fillRect(150, 118, 12, 4);
      g.fillStyle(glow, 1);
      g.fillRoundedRect(128, 390, 44, 80, { tl: 22, tr: 22, bl: 0, br: 0 });
      for (const x of [56, 214]) g.fillRoundedRect(x, 300, 30, 54, { tl: 15, tr: 15, bl: 0, br: 0 });
    });
    this.texture("dd-lm-crane", 520, 470, (g) => {
      g.fillStyle(dark, 1);
      g.fillRect(150, 70, 34, 400);
      g.fillRect(0, 60, 520, 22);
      g.fillRect(150, 30, 34, 40);
      g.fillRect(40, 82, 70, 46);
      g.lineStyle(4, dark, 1);
      for (let y = 90; y < 470; y += 40) {
        g.beginPath();
        g.moveTo(150, y);
        g.lineTo(184, y + 40);
        g.strokePath();
      }
      g.beginPath();
      g.moveTo(167, 30);
      g.lineTo(470, 64);
      g.strokePath();
      g.beginPath();
      g.moveTo(420, 82);
      g.lineTo(420, 250);
      g.strokePath();
      g.fillRect(396, 250, 48, 30);
    });
    this.texture("dd-lm-tower", 260, 560, (g) => {
      g.fillStyle(dark, 1);
      g.fillTriangle(30, 560, 230, 560, 130, 60);
      g.fillStyle(0xb9acec, 1);
      g.fillTriangle(70, 540, 190, 540, 130, 160);
      g.lineStyle(5, dark, 1);
      for (let y = 200; y < 540; y += 60) {
        const half = ((y - 60) / 500) * 100;
        g.beginPath();
        g.moveTo(130 - half, y);
        g.lineTo(130 + half * 0.7, y + 60);
        g.strokePath();
      }
      g.fillStyle(dark, 1);
      g.fillRect(126, 0, 8, 70);
      g.fillRoundedRect(70, 250, 120, 60, 14);
      g.fillStyle(glow, 1);
      g.fillRoundedRect(78, 258, 104, 44, 10);
      g.fillStyle(dark, 1);
      for (const [dx, w] of [[92, 14], [114, 30], [150, 14]]) g.fillRect(dx, 266, w, 28);
    });
    const zones = zonesOf(this.track);
    const at = (key: string) => {
      const z = zones.find((q) => q.key === key);
      return z ? (z.x0 + z.x1) / 2 : null;
    };
    const factor = 0.14;
    const items: [string, number, number][] =
      this.track.set?.kind === "antena"
        ? [
            ["dd-lm-crane", this.track.set.works.x0 + 2500, 0.9],
            ["dd-lm-church", this.track.set.plaza.x0 + 600, 1.05],
          ]
        : this.track.set?.kind === "feira"
        ? [
            ["dd-lm-tower", this.track.start + 14000, 1.05],
            ["dd-lm-church", this.track.set.plaza.x0 + 600, 1.05],
          ]
        : this.track.id === "arlindo"
        ? [
            ["dd-lm-church", this.track.start + 9000, 0.95],
            ["dd-lm-tower", this.track.finish - 4000, 1.05],
          ]
        : [
            ["dd-lm-church", (at("street") ?? 0) + 1500, 0.95],
            ["dd-lm-crane", at("works") ?? 0, 1],
            ["dd-lm-tower", (at("final") ?? 0) + 2000, 1.05],
          ];
    for (const [key, x, scale] of items) {
      const img = this.add.image(0, 0, key).setOrigin(0.5, 1).setScale(scale);
      this.bgLayer.add(img);
      const entry: (typeof this.landmarks)[number] = { img, base: W / 2 + x * factor, factor, y: 640, drift: 0.6 };
      if (key === "dd-lm-tower") {
        const light = this.add.graphics();
        light.fillStyle(0xef4f43, 1);
        light.fillCircle(0, 0, 12);
        this.bgLayer.add(light);
        entry.light = light;
      }
      this.landmarks.push(entry);
    }
  }

  private buildForeground() {
    this.texture("dd-fg-grass", 1400, 110, (g) => {
      g.fillStyle(0x3f8f4a, 1);
      g.fillRect(0, 70, 1400, 40);
      for (let x = 0; x < 1400; x += 34) {
        const h = 26 + ((x * 7) % 30);
        g.fillTriangle(x, 72, x + 22, 72, x + 10, 72 - h);
      }
      g.fillStyle(0x2f6f3a, 1);
      for (let x = 60; x < 1400; x += 460) {
        g.fillCircle(x, 70, 52);
        g.fillCircle(x + 54, 78, 40);
        g.fillCircle(x - 46, 82, 36);
      }
    });
    this.texture("dd-fg-posts", 1900, 300, (g) => {
      g.fillStyle(INK, 1);
      for (const x of [300, 1300]) {
        g.fillRoundedRect(x, 0, 30, 300, 8);
        g.fillCircle(x + 15, 6, 22);
      }
    });
    const posts = this.add.tileSprite(0, H - 300, W, 300, "dd-fg-posts").setOrigin(0, 0).setAlpha(0.3);
    const grass = this.add.tileSprite(0, H - 96, W, 110, "dd-fg-grass").setOrigin(0, 0);
    this.fgLayer.add([posts, grass]);
    if (this.track.id === "antena") {
      grass.setTint(0xffd6b0);
      this.fgLayer.add(this.add.rectangle(0, 0, W, H, 0xff7a3d, 0.08).setOrigin(0, 0));
    }
    this.fg.push({ sprite: posts, factor: 1.9 }, { sprite: grass, factor: 1.45 });
  }

  restartRace() {
    this.pickRivals();
    this.world = new RaceWorld(this.track, this.bridge.params, this.rivals.map((r) => r.frames), "off", this.player);
    this.sim = this.world.player;
    for (const v of this.kickViews.values()) v.destroy();
    this.kickViews.clear();
    for (const r of this.rivals) {
      r.prev = { x: r.frames.x[0], y: r.frames.y[0], angle: r.frames.angle[0] };
      r.crashStart = -1;
      r.view.setHold(null);
    }
    this.cart.setHold(null);
    this.cart.setPose(0);
    this.cart.setHelmet(false);
    this.cart.setDusty(false);
    this.helmetOn = false;
    this.dustyOn = false;
    this.surfaceTips.clear();
    this.rollCycle.clear();
    this.ambient.reset();
    const lineup = [{ who: this.player as string, name: this.copy.youAre(this.copy.rivalNames[this.player]), cart: this.copy.carts[this.player], color: PLAYER_COLOR }];
    for (const r of this.rivals) lineup.push({ who: r.id, name: this.copy.rivalNames[r.id], cart: this.copy.carts[r.id], color: r.color });
    this.hud.showLineup(lineup);
    this.recorder = new InputRecorder();
    this.record = this.bridge.records.load(this.track.id);
    this.sectionMarks = [];
    this.nextSection = 0;
    while (this.nextSection < this.track.sections.length && this.track.sections[this.nextSection].x <= this.track.start) {
      this.sectionMarks.push(0);
      this.nextSection += 1;
    }
    this.liveFrames = { x: [], y: [], angle: [], speed: [], flags: [] };
    this.pushLiveFrame();
    this.prev = { x: this.sim.x, y: this.sim.y, angle: this.sim.angle };
    this.phase = "countdown";
    this.countdownT = 1.25;
    this.countdownShown = -1;
    this.goT = 0;
    this.finishT = -1;
    this.finished = null;
    this.shownShow = 0;
    this.bridge.onShow(0);
    this.acc = 0;
    this.dist = 0;
    this.raceTime = 0;
    this.trend = 0;
    this.lastSpeed = 0;
    this.lastTier = 0;
    this.jumpedThisRun = false;
    this.spunThisFlight = false;
    this.hitTips = 0;
    this.charged = false;
    this.trail = [];
    for (const r of this.rivals) {
      r.ahead = false;
      r.pending = 0;
      r.flash = 0;
    }
    this.input.setDefaultCursor("default");
    this.hud.clearPopups();
    this.hud.countdown(null);
    this.hud.resetHint();
    this.fx.clear();
    this.bridge.input.discardEdges();
    for (const o of this.obstacles) {
      o.hit = false;
      o.view.setPosition(o.obstacle.x, heightAt(this.track.surfaces[o.obstacle.surface], o.obstacle.x) + LANE_OFFSETS[o.lane]);
      o.view.setRotation(0);
      o.view.setAlpha(1);
      o.view.setScale(o.lane > 0 ? 0.96 : 1);
      o.view.setVisible(true);
    }
    this.snapCamera();
  }

  matches(course: CourseId, cart: CartId) {
    return this.track?.id === course && this.player === cart;
  }

  releaseInput() {
    this.bridge.input.releaseAll();
    this.pressed.clear();
    this.pointerButtons.clear();
    this.hud.setPressed(this.pressed);
  }

  private pointerDown(p: Phaser.Input.Pointer) {
    if (p.wasTouch && !this.touchActive) {
      this.touchActive = true;
      this.hud.setTouch(true);
    }
    const id = this.hud.hitTest(p.x, p.y);
    if (!id) return;
    this.pressButton(id, true, p.id);
  }

  private pointerUp(p: Phaser.Input.Pointer) {
    const id = this.pointerButtons.get(p.id);
    if (!id) return;
    this.pointerButtons.delete(p.id);
    this.pressButton(id, false, p.id);
  }

  private pressButton(id: HudButton, on: boolean, pointer: number) {
    const input = this.bridge.input;
    if (on) this.pointerButtons.set(pointer, id);
    if (on) this.pressed.add(id);
    else this.pressed.delete(id);
    this.hud.setPressed(this.pressed);
    if (id === "left") input.setLeft(on, "touch");
    else if (id === "right") input.setRight(on, "touch");
    else if (id === "jump") input.setSpace(on, "touch");
    else if (id === "crouch") input.setDown(on, "touch");
  }


  private snapCamera() {
    this.camSpeed = 0;
    this.cam.zoom = Math.min(this.bridge.camera.zoomSlow, W / (this.gridSpan.max - this.gridSpan.min + 680));
    this.cam.x = (this.gridSpan.max + 260 + this.gridSpan.min - 220) / 2;
    this.cam.y = this.sim.y - (this.bridge.camera.roadLine - 0.5) * (H / this.cam.zoom) - 30;
    this.cam.dip = 0;
    this.cam.dipVel = 0;
    this.applyCamera();
  }

  private pushLiveFrame() {
    const s = this.sim;
    this.liveFrames.x.push(s.x);
    this.liveFrames.y.push(s.y);
    this.liveFrames.angle.push(s.angle);
    this.liveFrames.speed.push(s.speed);
    this.liveFrames.flags.push((s.mode === "air" ? FRAME_AIR : 0) | (s.mode === "crash" || s.tumbling ? FRAME_CRASH : 0) | (s.crouch ? FRAME_CROUCH : 0) | (s.paddling ? FRAME_PADDLE : 0));
  }

  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs, 100) / 1000;
    this.elapsed += dt;
    if (this.phase === "countdown") this.tickCountdown(dt);
    else {
      this.raceTime += dt;
      this.acc += dt;
      let n = 0;
      while (this.acc >= DT && n < 14) {
        this.stepOnce();
        this.acc -= DT;
        n += 1;
      }
      if (n === 14) this.acc = 0;
    }
    if (this.phase === "race") this.hud.fadeLineup(dt);
    if (this.goT > 0) {
      this.goT -= dt;
      if (this.goT <= 0) this.hud.countdown(null);
    }
    if (this.finishT > 0) {
      this.finishT -= dt;
      if (this.finishT <= 0 && this.finished) this.bridge.onFinish(this.finished);
    }
    this.renderFrame(dt, this.phase === "countdown" ? 1 : this.acc / DT);
  }

  private tickCountdown(dt: number) {
    this.countdownT -= dt;
    this.bridge.input.discardEdges();
    const n = Math.ceil(this.countdownT / 0.4);
    if (n !== this.countdownShown && n > 0 && n <= 3) {
      this.countdownShown = n;
      this.ambient.setLights(4 - n);
      this.hud.countdown(String(n));
      this.sfx(DOWNHILL_SFX.beep);
    }
    if (this.countdownT <= 0) {
      this.phase = "race";
      this.hud.countdown(this.copy.go);
      this.ambient.setLights(4);
      this.cart.react("go");
      for (const r of this.rivals) r.view.react("go");
      this.goT = 0.5;
      this.sfx(DOWNHILL_SFX.go);
      this.acc = 0;
    }
  }

  private stepOnce() {
    const sim = this.sim;
    const input = sim.finished ? IDLE : this.bridge.input.sample();
    if (!sim.finished) this.recorder.record(sim.step + 1, input);
    if (input.jump && sim.mode !== "crash") this.jumpedThisRun = true;
    if (input.spin !== 0 && sim.mode === "air") this.spunThisFlight = true;
    this.prev.x = sim.x;
    this.prev.y = sim.y;
    this.prev.angle = sim.angle;
    sim.params = this.bridge.params;
    const wasFinished = sim.finished;
    const speedBefore = sim.speed;
    this.world.rivals.forEach((t, i) => {
      const r = this.rivals[i];
      r.prev.x = this.world.sample(t, "x");
      r.prev.y = this.world.sample(t, "y");
      r.prev.angle = this.world.sample(t, "angle");
    });
    this.world.step(input);
    this.checkSections();
    if (!wasFinished) this.pushLiveFrame();
    this.dist += sim.speed * DT;
    for (const e of sim.drain()) this.handleEvent(e, speedBefore);
    for (const e of this.world.drain()) this.handleWorld(e);
    if (sim.stats.show !== this.shownShow) {
      this.shownShow = sim.stats.show;
      this.bridge.onShow(this.shownShow);
    }
  }

  private rivalAt(index: number) {
    return this.rivals[index - 1];
  }

  private handleWorld(e: WorldEvent) {
    const s = this.sim;
    if (e.type === "rival") {
      const r = this.rivalAt(e.racer);
      const ev = e.event;
      if (ev.type === "land" && ev.quality !== "touch") r.view.react(ev.quality === "perfect" ? "perfect" : "ok");
      if (ev.type === "land" && ev.quality !== "touch") r.view.land(Math.min(1, ev.air / 1.2 + 0.2));
      if (ev.type === "takeoff") r.view.takeoff(ev.popped ? 0.8 : 0.2);
      if (ev.type === "manhole" && r.id === "mila") {
        const rx = this.world.sample(this.world.rivals[e.racer - 1], "x");
        if (Math.abs(rx - s.x) < 1800) this.ambient.bubble(this.copy.mila, rx, heightAt(this.track.surfaces[0], rx) + r.lane - 300, 30);
      }
      if (ev.type === "hit" && ev.penalized) {
        r.view.react("hit");
        const o = this.obstacles.find((q) => q.index === ev.index && q.lane === r.laneIndex);
        if (o && !o.hit) {
          o.hit = true;
          o.vx = Math.max(400, this.world.sample(this.world.rivals[e.racer - 1], "speed") * 0.7);
          o.vy = -520;
          o.spin = ev.kind === "crate" ? 5 : 11;
        }
      }
      return;
    }
    if (e.type === "dusted") {
      const victimX = e.victim === 0 ? s.x : this.world.sample(this.world.rivals[e.victim - 1], "x");
      const victimY = e.victim === 0 ? s.y : this.world.sample(this.world.rivals[e.victim - 1], "y") + this.rivalAt(e.victim).lane;
      this.fx.impact(victimX + 40, victimY - 60, 0.9, 0xc9a77c);
      if (e.victim === 0) {
        this.cart.react("dusted");
        this.hud.tag("dusted", this.copy.dusted, "#ffb08a");
        this.hud.flashSpeed(-s.speed * 0.07);
      } else {
        this.rivalAt(e.victim).view.react("dusted");
        this.hud.tag("dusted", this.copy.dustedRival[this.rivalAt(e.victim).id], "#7fe0c4");
      }
      this.sfx(DOWNHILL_SFX.crate, 0.5);
      return;
    }
    if (e.type === "kick") {
      const k = this.world.kicked.find((q) => q.id === e.id);
      const lane = e.owner === 0 ? 0 : this.rivalAt(e.owner).laneIndex;
      const o = k ? this.obstacles.find((q) => q.lane === lane && Math.abs(q.obstacle.x - k.x) < 60) : undefined;
      if (k) {
        const view = this.add.container(k.x, k.y);
        const g = this.add.graphics();
        g.fillStyle(INK, 1);
        if (k.kind === "cone") {
          g.fillTriangle(-26, 2, 26, 2, 0, -52);
          g.fillStyle(0xff7a1a, 1);
          g.fillTriangle(-20, -2, 20, -2, 0, -44);
        } else {
          g.fillRect(-52, -100, 104, 102);
          g.fillStyle(0xc98b4a, 1);
          g.fillRect(-46, -94, 92, 90);
        }
        view.add(g);
        view.setDepth(7);
        this.worldLayer.add(view);
        this.kickViews.set(k.id, view);
      }
      if (o && !o.hit) {
        o.hit = true;
        o.view.setVisible(false);
      }
      if (e.owner === 0) this.hud.tag("kick", this.copy.kicked, "#7fe0c4");
      return;
    }
    if (e.type === "kickHit" || e.type === "kickGone") {
      const view = this.kickViews.get(e.id);
      if (view) {
        this.fx.debris(view.x, view.y, 300, [0xc98b4a, 0xff7a1a, 0x7c4527]);
        view.destroy();
        this.kickViews.delete(e.id);
      }
      if (e.type === "kickHit") {
        if (e.victim === 0) {
          this.cart.react("hit");
          this.hud.tag("kick", this.copy.kickedYou, "#ffb08a");
          this.hud.flashSpeed(-s.speed * this.bridge.params.hitLoss);
        } else {
          this.rivalAt(e.victim).view.react("hit");
          this.hud.tag("kick", this.copy.kickedRival[this.rivalAt(e.victim).id], "#7fe0c4");
        }
        this.sfx(DOWNHILL_SFX.crate);
      }
    }
  }

  private shout(key: string, text: string, opts: { priority: number; color: string; size?: number; sub?: string; life?: number }) {
    if (opts.priority < 4 && this.sim.x > this.track.finish - 1900) this.hud.tag(key, text, opts.color);
    else this.hud.shout(key, text, opts);
  }

  private alignTip() {
    this.hud.tip(this.touchActive ? this.copy.tips.alignTouch : this.copy.tips.align);
  }

  private toScreen(x: number, y: number) {
    return { x: (x - this.cam.x) * this.cam.zoom + W / 2, y: (y - this.cam.y - this.cam.dip) * this.cam.zoom + H / 2 };
  }

  private sfx(recipe: SoundRecipe, volume = 1, pitch = 1) {
    getAudio().play(recipe, { volume, pitch });
  }

  private handleEvent(e: SimEvent, speedBefore: number) {
    const c = this.copy;
    const s = this.sim;
    switch (e.type) {
      case "takeoff":
        this.takeoffSpeed = speedBefore;
        this.spunThisFlight = false;
        this.flightTip = false;
        this.cart.takeoff(e.popped ? 0.6 + e.power * 0.6 : 0.2);
        if (e.popped) {
          this.sfx(DOWNHILL_SFX.pop, 0.7 + e.power * 0.6, 0.9 + e.power * 0.25);
          this.fx.impact(s.x, s.y, 0.25 + e.power * 0.3);
        }
        if (e.popped && e.lip) {
          this.sfx(DOWNHILL_SFX.lip);
          this.hud.tag("lip", c.lip, "#7fe0c4");
        }
        break;
      case "pop":
        this.cart.takeoff(0.6 + e.power * 0.6);
        this.sfx(DOWNHILL_SFX.pop, 0.7 + e.power * 0.6, 0.9 + e.power * 0.25);
        if (e.lip) {
          this.sfx(DOWNHILL_SFX.lip);
          this.hud.tag("lip", c.lip, "#7fe0c4");
        }
        break;
      case "land": {
        const strength = Math.min(1, e.air / 1.2 + 0.2);
        if (e.quality === "touch") {
          if (e.rise < 12) break;
          this.cart.land(0.25);
          this.fx.dust(s.x, s.y, s.speed, 0xe9dcc0, 3);
          this.sfx(DOWNHILL_SFX.touch, 0.6);
          break;
        }
        this.cam.dipVel += 160 * strength;
        const delta = e.after - this.takeoffSpeed;
        if (e.quality === "perfect") {
          this.cart.land(strength);
          this.cart.react("perfect");
          this.fx.impact(s.x, s.y, strength * 0.7);
          this.sfx(DOWNHILL_SFX.landPerfect, 0.8 + strength * 0.4);
          this.fx.sparkle(s.x, s.y);
          if (e.flips > 0) this.shout("land", c.flip(e.flips), { priority: 3, color: "#f27aa8", size: 64, sub: c.perfect });
          else this.shout("land", c.perfect, { priority: 2, color: "#ffcf3f", size: 56 });
          if (this.spunThisFlight) this.alignLessons += 1;
        } else {
          this.cart.rough(strength);
          this.cart.react("ok");
          this.fx.impact(s.x, s.y, strength + 0.3, 0xc9a77c);
          this.sfx(DOWNHILL_SFX.landOk, 0.9 + strength * 0.4);
          this.hud.tag("ok", e.delta > this.bridge.params.okTol * 0.8 ? c.nearMiss : c.ok, "#ffb08a");
          if (e.flips > 0) this.hud.tag("flip", c.flip(e.flips), "#f27aa8");
          if (this.alignLessons < 3) this.alignTip();
        }
        if (e.quality === "ok" || delta > 0) this.hud.flashSpeed(delta);
        this.ambient.cheer(s.x, e.quality === "perfect" ? 1 + e.flips : 0.4);
        break;
      }
      case "crash":
        this.sfx(DOWNHILL_SFX.crash);
        this.fx.debris(s.x, s.y, s.speed, [0xd9954f, 0xe8433a, 0x2c2640]);
        this.fx.impact(s.x, s.y, 1, 0xc9a77c);
        this.shout("crash", c.crash, { priority: 4, color: "#ff7a4a", size: 66, sub: c.crashReason[e.reason], life: 1.7 });
        if (e.reason === "barrier") this.hud.tip(c.tips.barrier);
        else if (e.reason === "loop") this.hud.tip(this.touchActive ? c.tips.loopTouch : c.tips.loop);
        else this.alignTip();
        this.hud.flashSpeed(Math.min(-1, s.crashFrom * this.bridge.params.crashKeep - speedBefore));
        if (!this.bridge.reducedMotion) this.cam.shake = 0.22;
        break;
      case "recover":
        this.sfx(DOWNHILL_SFX.recover);
        this.cart.react("recover");
        this.fx.impact(s.x, s.y, 0.4);
        break;
      case "puddle":
        if (e.on) {
          this.fx.impact(s.x, s.y, 0.7, 0x8fd4f7);
          this.sfx(DOWNHILL_SFX.splat, 0.6);
          if (e.boost) this.hud.tag("puddle", c.puddle.boost, "#7fe0c4");
          else this.hud.tag("puddle", c.puddle.slow, "#ffb08a");
        }
        break;
      case "hit": {
        const o = this.obstacles.find((q) => q.index === e.index && q.lane === 0);
        if (o && !o.hit && o.obstacle.kind !== "pothole") {
          o.hit = true;
          o.vx = Math.max(400, s.speed * 0.7);
          o.vy = o.obstacle.kind === "line" ? 0 : -520;
          o.spin = o.obstacle.kind === "crate" ? 5 : 11;
        }
        const kind = e.kind;
        this.sfx(kind === "cone" ? DOWNHILL_SFX.cone : kind === "line" || kind === "hose" ? DOWNHILL_SFX.line : DOWNHILL_SFX.crate);
        if (kind === "hose") this.fx.impact(s.x, s.y - 40, 0.8, 0x8fd4f7);
        if (e.penalized) this.cart.react("hit");
        const heavy = kind === "barrier" || kind === "truck" || kind === "fence";
        if (e.bounced) {
          this.hud.tag("hit", c.potholeBounce, "#7fe0c4");
          this.hud.flashSpeed(-speedBefore * e.loss);
        } else if (e.penalized && !heavy) {
          const text = { cone: c.hitCone, line: c.hitLine, crate: c.hitCrate, pothole: c.hitPothole, bin: c.hitBin, gnome: c.hitGnome, hose: c.hitHose, melon: c.hitMelon, orange: c.hitOrange, stand: c.hitStand, bag: c.hitBag }[kind as "cone"] ?? c.hitCrate;
          this.hud.tag("hit", text, "#ff9f80");
          if (kind === "line") this.hud.tip(c.tips.duck);
          else if (this.hitTips < 2) {
            this.hitTips += 1;
            this.hud.tip(c.tips.hit);
          }
          this.hud.flashSpeed(-speedBefore * e.loss);
          this.cart.rough(0.3);
          if (kind === "bag" && !this.dustyOn) {
            this.dustyOn = true;
            this.cart.setDusty(true);
            this.fx.impact(s.x, s.y - 120, 1, 0xe9e4da);
            this.hud.tag("dusty", c.dusty, "#ffb08a");
          }
          if ((kind === "melon" || kind === "stand") && !this.helmetOn) {
            this.helmetOn = true;
            this.cart.setHelmet(true);
            this.sfx(DOWNHILL_SFX.splat);
            this.hud.tag("helmet", c.helmet, "#7fe0c4");
          }
        }
        break;
      }
      case "bounce":
        if (e.rhythm) {
          this.sfx(boing(e.combo));
          this.cart.land(0.55);
          this.fx.impact(s.x, s.y, 0.3, 0xfff1a8);
          if (e.combo >= 2) this.shout("bounce", c.bounce(e.combo), { priority: 2, color: "#7fe0c4", size: 48 + Math.min(e.combo, 8) * 3 });
          else this.hud.tag("bounce", c.bounce(1), "#7fe0c4");
          this.ambient.cheer(s.x, 0.2 + Math.min(e.combo, 8) * 0.1);
        } else {
          this.sfx(DOWNHILL_SFX.bounce);
          this.cart.land(0.35);
          this.hud.tag("bounce", e.delta > this.bridge.params.okTol ? c.bounceFlop : c.bounceMiss, "#ffb08a");
          if (this.awningTips < 2) {
            this.awningTips += 1;
            this.hud.tip(this.touchActive ? c.tips.awningsTouch : c.tips.awnings);
          }
        }
        break;
      case "loop":
        if (e.done) {
          this.shout("loop", c.loopDone, { priority: 3, color: "#7fe0c4", size: 64 });
          this.sfx(DOWNHILL_SFX.shortcut);
          this.hud.flashSpeed(160);
          this.ambient.cheer(s.x, 1.2);
        } else this.sfx(DOWNHILL_SFX.spin, 1, 0.8);
        break;
      case "manhole":
        this.sfx(DOWNHILL_SFX.splat);
        this.hud.tag("manhole", c.manhole, "#7fe0c4");
        break;
      case "jet":
        this.ambient.jetBurst();
        this.sfx(DOWNHILL_SFX.lip);
        this.sfx(DOWNHILL_SFX.flutter);
        this.fx.impact(s.x, s.y, 1, 0x8fd4f7);
        this.shout("jet", c.jet, { priority: 3, color: "#8fd4f7", size: 62 });
        break;
      case "flock":
        this.ambient.flock(e.clean);
        this.sfx(DOWNHILL_SFX.flutter);
        if (e.clean) {
          this.shout("flock", c.flock.clean, { priority: 3, color: "#7fe0c4", size: 54 });
          this.sfx(DOWNHILL_SFX.shortcut);
          this.hud.flashSpeed(120);
        } else this.hud.tag("flock", c.flock.scared, "#ffb08a");
        break;
      case "surface":
        if (e.cobbles) {
          const stairs = this.track.cobbles.some((q) => q.stairs && s.x >= q.x0 - 40 && s.x <= q.x1);
          const key = stairs ? "stairs" : "cobbles";
          if (!this.surfaceTips.has(key)) {
            this.surfaceTips.add(key);
            this.hud.tip(stairs ? c.stairs : c.cobbles, 2.4);
          }
        }
        break;
      case "secret": {
        const gold = this.obstacles.find((q) => q.obstacle.kind === "gold");
        if (gold) {
          gold.hit = true;
          gold.view.setVisible(false);
        }
        this.sfx(DOWNHILL_SFX.shortcut);
        this.fx.sparkle(s.x, s.y);
        this.fx.confetti(s.x, s.y - 200, 30);
        this.shout("secret", c.secret, { priority: 4, color: "#ffcf3f", size: 64 });
        break;
      }
      case "shortcut":
        this.sfx(DOWNHILL_SFX.shortcut);
        this.shout("shortcut", c.shortcut, { priority: 3, color: "#7fe0c4", size: 60 });
        break;
      case "trick": {
        const flips = e.points === 300 ? 1 : e.points === 800 ? 2 : 3 + Math.round((e.points - 1500) / 800);
        const label = e.kind === "flip" ? c.flip(flips) : e.kind === "pose" ? c.show.poses[2] : c.show.tricks[e.kind];
        if (e.kind !== "rail" || e.points > 0) this.hud.showTrickText(`${e.kind === "pose" ? c.show.label : label} +${formatNumber(e.points, this.bridge.locale)}${e.mult > 1 ? `  ×${e.mult}` : ""}`, e.mult >= 4 ? "#ffcf3f" : "#fbf5e6");
        if (e.kind === "nearMiss") this.hud.tag("near", c.show.tricks.nearMiss, "#7fe0c4");
        break;
      }
      case "bank":
        this.hud.showBank(e.points, c.show.bank(String(e.mult)));
        if (e.mult >= 3) this.sfx(DOWNHILL_SFX.shortcut, 0.6);
        break;
      case "drop":
        this.hud.showDrop(c.show.drop);
        break;
      case "pose":
        if (e.level > 0) {
          this.hud.tag("pose", c.show.poses[e.level - 1], e.level >= 3 ? "#ffcf3f" : "#7fe0c4");
          if (e.level >= 2) this.sfx(DOWNHILL_SFX.tier, 0.5 + e.level * 0.15);
        }
        this.cart.setPose(e.level);
        break;
      case "wheelie":
        break;
      case "finish":
        this.finishRace();
        break;
    }
  }

  private checkSections() {
    const sim = this.sim;
    const secs = this.track.sections;
    while (this.nextSection < secs.length && sim.x >= secs[this.nextSection].x && !sim.finished) {
      const bx = secs[this.nextSection].x;
      const u = sim.x > this.prev.x ? Math.max(0, Math.min(1, (bx - this.prev.x) / (sim.x - this.prev.x))) : 1;
      this.sectionMarks.push((sim.step - 1 + u) * DT);
      this.nextSection += 1;
      this.announceSplit(this.nextSection - 2);
    }
  }

  private announceSplit(index: number) {
    if (index < 0 || index >= this.sectionMarks.length - 1) return;
    const dur = this.sectionMarks[index + 1] - this.sectionMarks[index];
    const key = this.track.sections[index].key;
    if (key === "start") return;
    const name = this.copy.sections[this.track.id][key] ?? key;
    const best = this.record?.splits[index];
    const locale = this.bridge.locale;
    if (best === undefined || !Number.isFinite(best)) {
      this.hud.split(name, `${formatSeconds(dur, locale)} s`, "#fbf5e6");
      return;
    }
    const d = dur - best;
    const text = `${d < 0 ? "−" : "+"}${formatSeconds(Math.abs(d), locale)} s`;
    this.hud.split(name, text, d < 0 ? "#7fe0c4" : d > 0.05 ? "#ff9a72" : "#ffcf3f");
  }

  private sectionDurations() {
    return this.track.sections.map((_, i) => this.sectionMarks[i + 1] - this.sectionMarks[i]);
  }

  private rivalTime(r: Rival) {
    return r.def.fitas[r.fita].time;
  }

  private standings() {
    const list: { who: CartId; time: number; you: boolean }[] = [{ who: this.player, time: this.sim.finishTime, you: true }, ...this.rivals.map((r) => ({ who: r.id, time: this.rivalTime(r), you: false }))];
    list.sort((a, b) => a.time - b.time);
    return list;
  }

  private finishRace() {
    this.phase = "done";
    while (this.sectionMarks.length < this.track.sections.length) this.sectionMarks.push(this.sim.finishTime);
    this.sectionMarks.push(this.sim.finishTime);
    this.announceSplit(this.track.sections.length - 1);
    this.ambient.finishLine();
    this.sfx(DOWNHILL_SFX.finish);
    const form = this.bridge.form;
    const time = this.sim.finishTime;
    form.runs += 1;
    form.last = time;
    if (time < form.best) {
      form.best = time;
      const f = this.liveFrames;
      const n = f.x.length;
      form.ghost = {
        time,
        frames: { x: Float32Array.from(f.x), y: Float32Array.from(f.y), angle: Float32Array.from(f.angle), speed: Float32Array.from(f.speed), flags: Uint8Array.from(f.flags), length: n, finishTime: time, finishStep: this.sim.step, stats: { ...this.sim.stats }, marks: [] },
      };
    }
    const place = placeOf(time, this.rivals.map((r) => this.rivalTime(r)));
    const list = this.standings();
    this.cart.react(place === 1 ? "win" : "lose");
    if (place === 1) this.fx.confetti(this.sim.x, this.sim.y - 300, 60);
    list.forEach((entry, i) => {
      if (entry.you) return;
      const r = this.rivals.find((q) => q.id === entry.who);
      r?.view.react(i === 0 ? "win" : "lose");
      if (r && i > place - 1) this.bridge.onBeat(this.track.id, r.id);
    });
    const st = this.sim.stats;
    const splits = this.sectionDurations();
    const stored = this.bridge.records.load(this.track.id);
    const better = !stored || time < stored.time;
    this.bridge.records.save(this.track.id, { time: better ? time : stored.time, show: Math.max(st.show, stored?.show ?? 0), splits: better ? splits : stored.splits });
    this.finished = {
      course: this.track.id,
      cart: this.player,
      time,
      place,
      standings: list,
      stats: { ...st },
      tape: encodeTape(this.recorder.log),
      picks: RACE_SLOTS.map((slot) => this.rivals.find((r) => r.slot === slot)?.fita ?? -1),
      previous: stored,
    };
    this.finishT = 1.1;
  }

  private frameAt(frames: RunFrames, step: number, alpha: number) {
    const i = Math.min(step, frames.length - 1);
    const j = Math.max(0, Math.min(step - 1, frames.length - 1));
    const t = step >= frames.length ? 1 : alpha;
    return {
      x: frames.x[j] + (frames.x[i] - frames.x[j]) * t,
      y: frames.y[j] + (frames.y[i] - frames.y[j]) * t,
      angle: lerpAngle(frames.angle[j], frames.angle[i], t),
      speed: frames.speed[i],
      flags: frames.flags[i],
    };
  }

  private renderFrame(dt: number, alpha: number) {
    const sim = this.sim;
    const a = this.phase === "countdown" ? 1 : alpha;
    const x = this.prev.x + (sim.x - this.prev.x) * a;
    const y = this.prev.y + (sim.y - this.prev.y) * a;
    const angle = lerpAngle(this.prev.angle, sim.angle, a);
    const crash = sim.mode === "crash" ? 1 - sim.crashLeft / sim.crashTotal : sim.tumbling ? 0.35 : 0;
    const speed = this.phase === "countdown" ? 0 : sim.speed;
    if (dt > 0) {
      const accel = (speed - this.lastSpeed) / dt;
      this.trend += (accel / 1500 - this.trend) * damp(5, dt);
      this.lastSpeed = speed;
    }
    const land = sim.mode === "air" && !sim.tumbling ? sim.predictLanding() : null;
    this.predictedAir = land ? sim.airSteps * DT + land.steps * DT : 0;
    const jitter = sim.onCobbles && sim.mode === "ground" && !this.bridge.reducedMotion ? Math.sin(this.elapsed * 90) * (sim.crouch ? 1.2 : 3.5) * Math.min(1, speed / 800) : 0;
    if (sim.mode === "ground" && sim.crouch && sim.chargeRatio >= 1 && !this.charged && this.phase === "race") {
      this.charged = true;
      this.sfx(DOWNHILL_SFX.charged);
    }
    if (!sim.crouch || sim.mode !== "ground") this.charged = false;
    this.cart.update(
      {
        x,
        y: y + jitter,
        angle,
        speed,
        crouch: sim.crouch && sim.mode !== "crash",
        charge: sim.chargeRatio,
        air: sim.mode === "air",
        spin: sim.spin,
        accel: this.trend,
        bigAir: this.predictedAir > 0.9,
        brace: !!land && land.steps < 16,
        paddling: sim.paddling,
        distance: this.dist,
        crash,
        time: this.elapsed,
        countdown: this.phase === "countdown",
        pitch: sim.mode === "ground" ? sim.wheelie : 0,
      },
      dt,
    );
    const step = this.phase === "countdown" ? 0 : sim.step;
    const showRivals = true;
    const labels: { r: Rival; x: number; y: number }[] = [];
    this.world.rivals.forEach((t, i) => {
      const r = this.rivals[i];
      r.view.setVisible(showRivals);
      if (!showRivals) return;
      const cx = this.world.sample(t, "x");
      const cy = this.world.sample(t, "y");
      const fx = r.prev.x + (cx - r.prev.x) * a;
      const fy = r.prev.y + (cy - r.prev.y) * a;
      const fa = lerpAngle(r.prev.angle, this.world.sample(t, "angle"), a);
      const flags = this.world.flags(t);
      const crashing = (flags & FRAME_CRASH) !== 0;
      if (crashing && r.crashStart < 0) {
        r.crashStart = t.head;
        r.view.react("crash");
      }
      if (!crashing && r.crashStart >= 0) {
        r.crashStart = -1;
        r.view.react("recover");
      }
      const crashU = crashing ? Math.min(0.99, Math.max(0.01, (t.head - r.crashStart) / (DEFAULT_PARAMS.crashTime * CART_RULES[r.id].crashTime * STEP_HZ))) : 0;
      const near = Math.abs(fx - x) < 1500;
      r.alpha += ((near ? 1 : 0.55) - r.alpha) * damp(4, dt);
      r.view.setAlpha(r.alpha);
      r.view.update(
        { x: fx, y: fy + r.lane, angle: fa, speed: this.world.sample(t, "speed"), crouch: (flags & FRAME_CROUCH) !== 0, charge: 0, air: (flags & FRAME_AIR) !== 0, spin: 0, accel: 0, bigAir: false, brace: false, paddling: (flags & FRAME_PADDLE) !== 0, distance: fx, crash: crashU, time: this.elapsed, countdown: this.phase === "countdown" },
        dt,
      );
      if (near) labels.push({ r, x: fx, y: fy + r.lane - 205 });
      else r.label.setAlpha(0);
    });
    labels.sort((p, q) => p.x - q.x);
    for (let i = 0; i < labels.length; i += 1) {
      const l = labels[i];
      let ly = l.y;
      for (let j = 0; j < i; j += 1) {
        const o = labels[j];
        if (Math.abs(o.x - l.x) < 190 && Math.abs(o.y - ly) < 46) ly = o.y - 48;
        labels[j] = o;
      }
      l.y = ly;
      l.r.label.setPosition(l.x, ly);
      l.r.label.setAlpha(this.phase === "countdown" ? 0 : Math.abs(l.x - x) > 120 ? 1 : 0.85);
    }
    const ghost = this.bridge.form.ghost;
    const showGhost = !!ghost && this.bridge.ghost;
    this.ghostView.setVisible(showGhost);
    this.ghostLabel.setVisible(showGhost && this.phase === "race");
    if (ghost && showGhost) {
      const f = this.frameAt(ghost.frames, step, a);
      this.ghostLabel.setPosition(f.x, f.y - 210);
      this.ghostView.update({ x: f.x, y: f.y, angle: f.angle, speed: f.speed, crouch: (f.flags & FRAME_CROUCH) !== 0, charge: 0, air: (f.flags & FRAME_AIR) !== 0, spin: 0, accel: 0, bigAir: false, brace: false, paddling: false, distance: f.x, crash: f.flags & FRAME_CRASH ? 0.5 : 0, time: this.elapsed }, dt);
    }
    if (dt > 0 && sim.mode === "ground" && this.track.surfaces[sim.surface]?.kind === "rail" && speed > 200) for (let i = 0; i < 3; i += 1) this.fx.sparks(x - 30 + i * 30, y, speed);
    this.updateRolling(a);
    if (dt > 0 && sim.mode !== "air" && speed > 200 && this.phase !== "countdown") {
      const rate = (speed / 700) * (this.bridge.reducedMotion ? 0.4 : 1) * (sim.onCobbles ? 1.6 : 1);
      const count = Math.floor(rate * dt * 30 + Math.random());
      for (let i = 0; i < count; i += 1) {
        const back = Math.random() < 0.5 ? 50 : -50;
        this.fx.dust(x - Math.cos(angle) * back, y - Math.sin(angle) * back, speed, sim.onCobbles ? 0xc9c3dc : 0xe9dcc0, 1);
      }
    }
    for (const o of this.obstacles) {
      if (!o.hit || dt === 0) continue;
      if (o.obstacle.kind === "line") {
        o.view.setScale(1, 1 + Math.sin(this.elapsed * 30) * 0.06);
        continue;
      }
      o.vy += 2200 * dt;
      o.view.x += o.vx * dt;
      o.view.y += o.vy * dt;
      o.view.rotation += o.spin * dt;
      o.view.alpha = Math.max(0, o.view.alpha - dt * 0.6);
    }
    this.fx.update(dt);
    this.ambient.step = this.sim.step;
    this.ambient.lead = this.phase !== "countdown" ? Math.max(...this.world.rivals.map((t) => this.world.sample(t, "x"))) : -Infinity;
    this.ambient.racers = [x, ...this.world.rivals.map((t) => this.world.sample(t, "x"))];
    this.ambient.update(dt, this.elapsed, x, speed, this.cam.x, W / (2 * this.cam.zoom));
    this.drawTrail(dt, x, y, angle, speed);
    this.drawLips(x, speed);
    this.drawOverlay(x, y, land);
    if (sim.mode === "crash" && dt > 0 && crash > 0.55 && Math.random() < dt * 6) this.fx.stars(x + 20, y - 150);
    this.updateCamera(dt, x, y, land);
    this.updateHud(dt, x, y);
    this.updateSound(dt);
  }

  private updateRolling(alpha: number) {
    const road = this.track.surfaces[0];
    const fs = this.phase === "countdown" ? 0 : this.sim.step - 1 + alpha;
    const halfW = W / (2 * this.cam.zoom) + 400;
    for (const o of this.obstacles) {
      const roll = o.obstacle.roll;
      if (!roll) continue;
      const cycle = Math.floor((Math.floor(fs) + roll.phase) / roll.period);
      if (this.rollCycle.get(o) !== cycle) {
        this.rollCycle.set(o, cycle);
        o.hit = false;
        o.view.setAlpha(1).setRotation(0);
      }
      if (o.hit) continue;
      const u = ((((fs + roll.phase) % roll.period) + roll.period) % roll.period) / roll.period;
      const x = o.obstacle.x + roll.length * u;
      o.view.setPosition(x, heightAt(road, x) + LANE_OFFSETS[o.lane]);
      o.view.setVisible(Math.abs(x - this.cam.x) < halfW);
      o.view.setAlpha(Math.max(0, Math.min(1, u * 14, (1 - u) * 14)));
      const child = o.view.list[0] as Phaser.GameObjects.Image | undefined;
      child?.setRotation((roll.length * u) / (o.obstacle.kind === "melon" ? 31 : 17));
    }
  }

  private drawTrail(dt: number, x: number, y: number, angle: number, speed: number) {
    const g = this.trailG;
    g.clear();
    if (dt > 0 && this.phase === "race") {
      this.trail.push({ x: x - Math.cos(angle) * 70 + Math.sin(angle) * 30, y: y - Math.sin(angle) * 70 - Math.cos(angle) * 30, a: Math.min(1, Math.max(0, (speed - 900) / 900)) });
      if (this.trail.length > TRAIL) this.trail.shift();
    }
    if (this.trail.length < 2 || this.bridge.reducedMotion) return;
    for (let i = 1; i < this.trail.length; i += 1) {
      const p = this.trail[i - 1];
      const q = this.trail[i];
      const k = i / this.trail.length;
      const alpha = k * k * 0.5 * q.a;
      if (alpha < 0.02) continue;
      g.lineStyle(4 + k * 10, 0xffffff, alpha);
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(q.x, q.y);
      g.strokePath();
      g.lineStyle(2 + k * 4, 0xffffff, alpha * 0.8);
      g.beginPath();
      g.moveTo(p.x, p.y - 46);
      g.lineTo(q.x, q.y - 46);
      g.strokePath();
    }
  }

  private drawLips(x: number, speed: number) {
    const sim = this.sim;
    for (const lip of this.lipViews) {
      const d = lip.x - x;
      let alpha = 0;
      if (this.phase === "race" && sim.mode === "ground" && lip.surface === sim.surface && d > -20 && d < Math.max(400, speed * 1.0)) {
        const inside = d <= 80 + speed * 0.02;
        alpha = inside ? 0.95 : 0.35 + 0.25 * Math.sin(this.elapsed * 14);
      }
      lip.glow.setAlpha(alpha);
    }
  }

  private drawOverlay(x: number, y: number, land: ReturnType<DownhillSim["predictLanding"]>) {
    const g = this.overlay;
    g.clear();
    this.spinKey.setVisible(false);
    const sim = this.sim;
    const p = this.bridge.params;
    if (sim.mode === "ground" && sim.crouch && sim.chargeRatio >= 1) this.chargedFor += this.game.loop.delta / 1000;
    else this.chargedFor = 0;
    if (sim.mode === "ground" && sim.crouch && !sim.finished && this.phase === "race" && this.chargedFor < 0.6) {
      const r = sim.chargeRatio;
      const cx = x - 10;
      const cy = y - 215;
      g.fillStyle(INK, 0.55);
      g.fillCircle(cx, cy, 30);
      g.lineStyle(9, 0x3a3358, 1);
      g.strokeCircle(cx, cy, 22);
      g.lineStyle(9, r >= 1 ? 0xff7a1a : 0xffcf3f, 1);
      g.beginPath();
      g.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, r), false);
      g.strokePath();
      if (r >= 1) {
        g.fillStyle(0xff7a1a, 0.9);
        g.fillTriangle(cx - 9, cy + 6, cx + 9, cy + 6, cx, cy - 10);
      }
    }
    if (sim.rules.jumpLine && sim.mode === "ground" && sim.crouch && !sim.finished && this.phase === "race") {
      if (!this.jumpLineTip) {
        this.jumpLineTip = true;
        this.hud.tip(this.touchActive ? this.copy.tips.jumpLineTouch : this.copy.tips.jumpLine, 3.4);
      }
      const path: number[] = [];
      const hit = sim.predictPop(300, path, 6);
      const n = path.length / 2;
      for (let i = 0; i < n; i += 1) {
        const k = i / Math.max(1, n - 1);
        g.fillStyle(INK, 0.35 + k * 0.3);
        g.fillCircle(path[i * 2], path[i * 2 + 1] - 30, 10);
        g.fillStyle(sim.chargeRatio >= 1 ? 0xffcf3f : 0xfffaf0, 0.55 + k * 0.4);
        g.fillCircle(path[i * 2], path[i * 2 + 1] - 30, 6.5);
      }
      if (hit) {
        g.lineStyle(6, INK, 0.7);
        g.strokeCircle(hit.x, hit.y - 6, 16);
        g.lineStyle(4, 0xfffaf0, 0.95);
        g.strokeCircle(hit.x, hit.y - 6, 16);
      }
    }
    if (this.track.surfaces[sim.surface]?.kind === "sewer" && y > heightAt(this.track.surfaces[0], x) + 60) {
      const ca = Math.cos(sim.angle);
      const sa = Math.sin(sim.angle);
      const hx = x + ca * 70 - sa * -40;
      const hy = y + sa * 70 + ca * -40;
      g.fillStyle(0xfff1a8, 0.22);
      g.fillTriangle(hx, hy, hx + ca * 520 - sa * 120, hy + sa * 520 + ca * 120, hx + ca * 520 + sa * 120, hy + sa * 520 - ca * 120);
      g.fillStyle(0xfff1a8, 0.9);
      g.fillCircle(hx, hy, 9);
    }
    const awning = !!land && this.track.surfaces[land.surface].kind === "awning";
    if (land && awning && this.phase === "race") {
      const ready = land.steps <= 14;
      const r = 24 + Math.min(1, land.steps / 45) * 80;
      g.lineStyle(10, INK, 0.45);
      g.strokeCircle(land.x, land.y - 8, r);
      g.lineStyle(6, ready ? 0x7fe0c4 : 0xfffaf0, 0.95);
      g.strokeCircle(land.x, land.y - 8, r);
      g.fillStyle(ready ? 0x7fe0c4 : 0xfffaf0, 0.95);
      g.fillCircle(land.x, land.y - 8, 9);
    }
    if (!land || this.predictedAir < 0.6) return;
    if (awning && Math.abs(wrap(sim.angle - land.slope)) * (180 / Math.PI) <= p.perfectTol) return;
    if (!this.flightTip && this.alignLessons < 3) {
      this.flightTip = true;
      this.alignTip();
    }
    const diff = wrap(sim.angle - land.slope);
    const deg = Math.abs(diff) * (180 / Math.PI);
    const quality = deg <= p.perfectTol ? 0 : deg <= p.okTol ? 1 : 2;
    const color = [0x7fe0c4, 0xffcf3f, 0xff5a4a][quality];
    const lx = land.x;
    const ly = land.y;
    const path: number[] = [];
    sim.predictLanding(land.steps, path, 7);
    for (let i = 0; i + 1 < path.length; i += 2) {
      const k = i / path.length;
      g.fillStyle(0xffffff, 0.18 + k * 0.35);
      g.fillCircle(path[i], path[i + 1] - 30, 5);
    }
    const perfect = (p.perfectTol * Math.PI) / 180;
    const ok = (p.okTol * Math.PI) / 180;
    const R = 150;
    const fan = (from: number, to: number, fill: number, alpha: number) => {
      g.fillStyle(fill, alpha);
      g.beginPath();
      g.moveTo(lx, ly);
      g.arc(lx, ly, R, from, to, false);
      g.closePath();
      g.fillPath();
    };
    fan(land.slope - ok, land.slope + ok, 0xffcf3f, 0.24);
    fan(land.slope - perfect, land.slope + perfect, 0x7fe0c4, 0.5);
    const tc = Math.cos(land.slope);
    const ts = Math.sin(land.slope);
    g.lineStyle(5, 0xffffff, 0.85);
    g.beginPath();
    g.moveTo(lx - tc * 90, ly - ts * 90);
    g.lineTo(lx + tc * R, ly + ts * R);
    g.strokePath();
    const ca = Math.cos(sim.angle);
    const sa = Math.sin(sim.angle);
    const at = (u: number, v: number) => ({ x: lx + u * ca - v * sa, y: ly + u * sa + v * ca });
    const outline = [at(-80, -24), at(80, -24), at(80, -74), at(-80, -74)];
    g.fillStyle(color, 0.22);
    g.fillPoints(outline.map((q) => new Phaser.Math.Vector2(q.x, q.y)), true);
    g.lineStyle(5, color, 0.95);
    g.beginPath();
    g.moveTo(outline[0].x, outline[0].y);
    for (let i = 1; i < 4; i += 1) g.lineTo(outline[i].x, outline[i].y);
    g.closePath();
    g.strokePath();
    const w1 = at(-50, -12);
    const w2 = at(50, -12);
    g.strokeCircle(w1.x, w1.y, 12);
    g.strokeCircle(w2.x, w2.y, 12);
    g.lineStyle(4, color, 0.95);
    g.beginPath();
    g.moveTo(lx, ly);
    g.lineTo(lx + ca * R, ly + sa * R);
    g.strokePath();
    g.fillStyle(INK, 1);
    g.fillCircle(lx, ly, 10);
    g.fillStyle(color, 1);
    g.fillCircle(lx, ly, 6);
    const guideA = land.slope;
    const gc = Math.cos(guideA);
    const gs = Math.sin(guideA);
    g.lineStyle(4, color, 0.7);
    for (let u = -120; u < 120; u += 30) {
      g.beginPath();
      g.moveTo(x + gc * u - gs * -6, y + gs * u + gc * -6);
      g.lineTo(x + gc * (u + 16) - gs * -6, y + gs * (u + 16) + gc * -6);
      g.strokePath();
    }
    if (quality !== 0) {
      const dir = diff > 0 ? -1 : 1;
      const cx = x;
      const cy = y - 70;
      const rr = 135;
      const base = sim.angle - Math.PI / 2;
      const a0 = base - dir * 0.5;
      const a1 = base + dir * 0.55;
      g.lineStyle(9, INK, 0.7);
      g.beginPath();
      g.arc(cx, cy, rr, a0, a1, dir < 0);
      g.strokePath();
      g.lineStyle(6, color, 1);
      g.beginPath();
      g.arc(cx, cy, rr, a0, a1, dir < 0);
      g.strokePath();
      const ex = cx + Math.cos(a1) * rr;
      const ey = cy + Math.sin(a1) * rr;
      const tx = -Math.sin(a1) * dir;
      const ty = Math.cos(a1) * dir;
      g.fillStyle(color, 1);
      g.fillTriangle(ex + tx * 26, ey + ty * 26, ex - ty * 15, ey + tx * 15, ex + ty * 15, ey - tx * 15);
      if (this.alignLessons < 3 && !this.touchActive) {
        const key = dir < 0 ? "←" : "→";
        const z = this.cam.zoom;
        const sx = (ex + tx * 70 / z - this.cam.x) * z + W / 2;
        const sy = (ey + ty * 70 / z - this.cam.y - this.cam.dip) * z + H / 2;
        const kx = Math.max(440, Math.min(W - 300, sx));
        const ky = Math.max(130, Math.min(H - 140, sy));
        this.spinKey.setText(key).setVisible(true).setScale(1 / z);
        this.spinKey.setPosition(this.cam.x + (kx - W / 2) / z, this.cam.y + this.cam.dip + (ky - H / 2) / z);
      }
    }
  }

  private groundBelow(x: number) {
    const upper = this.track.surfaces[this.sim.surface];
    if (this.sim.surface !== 0 && upper && covers(upper, x)) return heightAt(upper, x);
    return heightAt(this.track.surfaces[0], Math.min(x, this.track.surfaces[0].x1));
  }

  private nextInterest(x: number, reach: number) {
    let best = Infinity;
    for (const lip of this.track.lips) if (lip.surface === this.sim.surface && lip.x > x + 80 && lip.x < x + reach && lip.x < best) best = lip.x;
    for (const o of this.track.obstacles) if (o.x > x + 80 && o.x < x + reach && o.x < best) best = o.x;
    return Number.isFinite(best) ? best : null;
  }

  private updateCamera(dt: number, x: number, y: number, land: ReturnType<DownhillSim["predictLanding"]>) {
    const sim = this.sim;
    const tune = this.bridge.camera;
    const air = sim.mode === "air";
    if (dt > 0) this.camSpeed += (sim.speed - this.camSpeed) * damp(air ? 0.6 : 1.4, dt);
    const forward = Math.max(0, air ? sim.vx : sim.v * Math.cos(sim.angle));
    const k = Math.max(0, Math.min(1, (this.camSpeed - 600) / 1600));
    let zoom = tune.zoomSlow + (tune.zoomFast - tune.zoomSlow) * k * k * (3 - 2 * k);
    const lead = Math.min(forward * tune.lead, (0.5 - 0.24) * (W / zoom));
    let fx = x + lead;
    const interest = this.phase === "race" ? this.nextInterest(x, Math.max(700, forward * 1.15)) : null;
    if (interest !== null) zoom = Math.min(zoom, Math.max(ZOOM_MIN_GROUND, W / (2 * (interest - fx + 280))));
    if (this.phase === "race") {
      for (const t of this.world.rivals) {
        const d = this.world.sample(t, "x") - x;
        if (d < -760 || d > 900) continue;
        const need = d < 0 ? W / (2 * (fx - (x + d) + 260)) : W / (2 * (x + d - fx + 340));
        zoom = Math.min(zoom, Math.max(ZOOM_MIN_RIVAL, need));
      }
    }
    const view = H / zoom;
    const roadLine = Math.min(0.74, Math.max(tune.roadLine, (0.9 * H - 190 * zoom) / H));
    let fy = y - (roadLine - 0.5) * view;
    const aheadY = this.groundBelow(x + lead + (W / (2 * zoom)) * 0.6);
    const lowest = fy + 0.42 * view;
    if (aheadY + 30 > lowest) fy += aheadY + 30 - lowest;
    const behindY = this.groundBelow(fx - W / (2 * zoom));
    const highest = fy - 0.06 * view;
    if (behindY < highest) {
      const slack = Math.max(0, fy + 0.42 * view - (aheadY + 30));
      const cartRoom = Math.max(0, fy - (y - 0.28 * view));
      fy -= Math.min(highest - behindY, slack, cartRoom);
    }
    const awningLand = !!land && this.track.surfaces[land.surface].kind === "awning";
    if (awningLand && land) {
      const view2 = H / zoom;
      fy = land.y + 60 - (roadLine - 0.5) * view2;
    } else if (land && this.predictedAir > 0.55) {
      const g = this.bridge.params.gravity;
      const apex = sim.vy < 0 ? y - (sim.vy * sim.vy) / (2 * g) : y;
      const minX = Math.min(x, land.x) - 220;
      const maxX = Math.max(x, land.x) + 300;
      const top = Math.min(apex, y) - 220;
      const bottom = Math.max(land.y, y) + 110 + 120 / Math.max(this.cam.zoom, ZOOM_MIN_AIR);
      const fit = Math.min(W / (maxX - minX), H / (bottom - top));
      zoom = Math.max(ZOOM_MIN_AIR, Math.min(zoom, fit));
      fx = Math.max(fx, (minX + maxX) / 2);
      fy = (top + bottom) / 2;
    }
    if (this.phase === "countdown") {
      const g = this.gridSpan;
      const span = Math.max(g.max + 260, x + 300) - Math.min(g.min - 220, x - 300);
      zoom = Math.min(tune.zoomSlow, W / (span + 200));
      fx = (Math.max(g.max + 260, x + 300) + Math.min(g.min - 220, x - 300)) / 2;
      fy = y - (tune.roadLine - 0.5) * (H / zoom) - 30;
    }
    const bigAir = air && this.predictedAir > 0.9;
    if (dt > 0) {
      this.cam.x += (fx - this.cam.x) * damp(6, dt);
      this.cam.y += (fy - this.cam.y) * damp(bigAir ? 3.4 : air ? 2.6 : 3.4, dt);
      this.cam.zoom += (zoom - this.cam.zoom) * damp(zoom < this.cam.zoom ? (bigAir ? 3.2 : 1.9) : 0.9, dt);
      this.cam.shake = Math.max(0, this.cam.shake - dt);
      this.cam.dipVel += (-this.cam.dip * 120 - this.cam.dipVel * 13) * dt;
      this.cam.dip += this.cam.dipVel * dt;
    }
    const z = this.cam.zoom;
    const halfW = W / (2 * z);
    const halfH = H / (2 * z);
    const head = air ? 215 + 90 / z : 200 + 150 / z;
    const foot = 120 / z;
    if (y - head < this.cam.y - halfH) this.cam.y = y - head + halfH;
    if (y + foot > this.cam.y + halfH) this.cam.y = y + foot - halfH;
    const minX = this.cam.x - halfW + ((air ? 0.26 : 0.12) * W) / z;
    const maxX = this.cam.x - halfW + (0.64 * W) / z;
    if (x < minX) this.cam.x += x - minX;
    if (x > maxX) this.cam.x += x - maxX;
    this.applyCamera();
  }

  private applyCamera() {
    const shake = this.cam.shake > 0 && !this.bridge.reducedMotion ? this.cam.shake * 26 : 0;
    const sx = shake ? (Math.random() - 0.5) * shake : 0;
    const sy = shake ? (Math.random() - 0.5) * shake : 0;
    const z = this.cam.zoom;
    this.worldCam.setZoom(z);
    this.worldCam.centerOn(this.cam.x + sx, this.cam.y + this.cam.dip + sy);
    const roadScreen = (this.groundBelow(this.cam.x) - (this.cam.y + this.cam.dip)) * z + H / 2;
    const delta = Math.max(-500, Math.min(1400, roadScreen - this.bridge.camera.roadLine * H));
    const f = Math.max(0, Math.min(1, (this.sampleFadeX + 300 - this.cam.x) / 1800));
    for (const l of this.parallax) {
      l.sprite.tilePositionX = (this.cam.x * l.factor) / (l.fade === 1 ? 1 / SAMPLE_RES : 1);
      l.sprite.y = l.y + delta * l.drift;
      if (l.fade !== 0) l.sprite.setAlpha(l.fade === 1 ? f : 1 - f);
    }
    for (const l of this.landmarks) {
      const x = l.base - this.cam.x * l.factor;
      const on = x > -400 && x < W + 400;
      l.img.setVisible(on);
      l.img.setPosition(x, l.y + delta * l.drift);
      if (l.light) {
        l.light.setVisible(on && Math.floor(this.time.now / 600) % 2 === 0);
        l.light.setPosition(x, l.img.y - l.img.displayHeight + 4);
      }
    }
    this.sun.y = delta * 0.1;
    for (const f of this.fg) f.sprite.tilePositionX = this.cam.x * z * f.factor;
    const halfW = W / (2 * z) + 400;
    const i0 = Math.floor((this.cam.x - halfW) / 1800);
    const i1 = Math.floor((this.cam.x + halfW) / 1800);
    const key = `${i0}:${i1}`;
    if (key !== this.visibleChunks) {
      this.visibleChunks = key;
      for (const c of this.chunks) {
        const on = c.x1 >= this.cam.x - halfW && c.x0 <= this.cam.x + halfW;
        for (const o of c.objects) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(on);
      }
    }
  }

  private gapFor(index: number, x: number, time: number) {
    const t = this.world.rivals[index];
    const rt = timeAtX(t.frames, x);
    return Number.isFinite(rt) ? rt + t.delay - time : Infinity;
  }

  private updateHud(dt: number, x: number, y: number) {
    const sim = this.sim;
    const above = this.toScreen(x + 30, y - 300);
    const anchor = above.y >= 410 ? above : this.toScreen(x - 120, y + 170);
    const speed = this.phase === "countdown" ? 0 : sim.speed;
    const tier = tierOf(speed);
    if (tier > this.lastTier && tier >= 2 && this.phase === "race") this.sfx(DOWNHILL_SFX.tier, 0.5 + tier * 0.2);
    this.lastTier = tier;
    const time = sim.finished ? sim.finishTime : this.phase === "countdown" ? 0 : sim.step * DT;
    const step = this.phase === "countdown" ? 0 : sim.step;
    const markers: Marker[] = [];
    const edges: EdgeTag[] = [];
    const entries: { name: string; color: number; you: boolean; x: number; gap: number; finish: number; flash: number; who: string }[] = [];
    this.playerFlash = Math.max(0, this.playerFlash - dt * 1.5);
    entries.push({ name: this.copy.you, color: PLAYER_COLOR, you: true, x, gap: 0, finish: sim.finished ? sim.finishTime : Infinity, flash: this.playerFlash, who: this.player });
    {
      for (let ri = 0; ri < this.rivals.length; ri += 1) {
        const r = this.rivals[ri];
        const t = this.world.rivals[ri];
        const rx = this.world.sample(t, "x");
        const ry = this.world.sample(t, "y");
        markers.push({ x: rx, color: r.color, letter: r.letter });
        const gap = this.phase === "countdown" ? 0 : this.gapFor(ri, x, time);
        r.flash = Math.max(0, r.flash - dt * 1.5);
        const rivalFinish = t.finished ? t.finishTime : t.frames.finishTime + t.delay;
        entries.push({ name: r.name, color: r.color, you: false, x: rx, gap, finish: t.finished || sim.finished ? rivalFinish : Infinity, flash: r.flash, who: r.id });
        if (this.phase === "race" && !sim.finished) {
          const ahead = rx > x;
          if (this.raceTime < 1.2) r.ahead = ahead;
          else if (ahead !== r.ahead) {
            r.pending += dt;
            if (r.pending > 0.3) {
              r.ahead = ahead;
              r.pending = 0;
              r.flash = 1;
              this.playerFlash = 1;
              if (ahead) {
                this.shout(`pass-${r.id}`, this.copy.passedBy[r.id], { priority: 3, color: "#ffb08a", size: 50 });
                this.sfx(DOWNHILL_SFX.passDown);
                this.cart.react("passedBy");
                r.view.react("passed");
              } else {
                this.shout(`pass-${r.id}`, this.copy.passed[r.id], { priority: 3, color: "#7fe0c4", size: 54 });
                this.sfx(DOWNHILL_SFX.passUp);
                this.cart.react("passed");
                r.view.react("passedBy");
              }
            }
          } else r.pending = 0;
          const sp = this.toScreen(rx, ry - 120);
          if ((sp.x > W - 30 || sp.x < 30) && Number.isFinite(gap)) {
            const secs = formatSeconds(Math.abs(gap), this.bridge.locale);
            const side = sp.x > W - 30 ? "right" : "left";
            let ty = Math.max(330, Math.min(860, sp.y));
            if (side === "left" && ty > anchor.y - 40) ty = Math.max(250, anchor.y - 40);
            for (const other of edges) if (other.side === side && Math.abs(other.y - ty) < 64) ty = other.y + (ty >= other.y ? 64 : -64);
            edges.push({ side, y: ty, color: r.color, text: `${r.name.toUpperCase()} ${secs} s` });
          }
        }
      }
    }
    const ghost = this.bridge.form.ghost;
    if (ghost && this.bridge.ghost) markers.push({ x: ghost.frames.x[Math.min(step, ghost.frames.length - 1)], color: 0xffffff, letter: "", ghost: true });
    markers.push({ x, color: PLAYER_COLOR, letter: "", you: true });
    entries.sort((p, q) => (Number.isFinite(p.finish) || Number.isFinite(q.finish) ? p.finish - q.finish : q.x - p.x));
    const rows: StandingRow[] = entries.map((e) => {
      let gap = "";
      if (e.you) gap = "";
      else if (this.phase !== "countdown" && Number.isFinite(e.gap)) gap = `${e.gap < 0 ? "−" : "+"}${formatSeconds(Math.abs(e.gap), this.bridge.locale)} s`;
      return { name: e.name, color: e.color, you: e.you, gap, flash: e.flash, who: e.who };
    });
    const showHint = this.phase !== "done" && time < (this.bridge.form.runs < 2 ? 14 : 6) && !(this.jumpedThisRun && time > 5);
    this.hud.update(dt, { time, rows, speed, tier, trend: this.trend, markers, edges, finishX: this.track.finish, startX: this.track.start, reduced: this.bridge.reducedMotion, showHint, anchor });
    const sh = sim.show;
    this.hud.showMeter(dt, { total: sh.total, seq: sh.seq + (sim.posing ? sim.posePending : 0), mult: sh.mult, timer: sh.timer / 300, active: sh.tricks > 0 || sim.posing });
  }

  private updateSound(dt: number) {
    if (dt === 0 || this.phase === "countdown") return;
    const sim = this.sim;
    const speed = sim.speed;
    if (sim.mode !== "air" && speed > 40) {
      this.rollT -= dt;
      if (this.rollT <= 0) {
        this.rollT = 0.06;
        getAudio().play(rollGrain(speed, sim.onCobbles, sim.crouch));
      }
    }
    if (speed > 900) {
      this.windT -= dt;
      if (this.windT <= 0) {
        this.windT = 0.13;
        getAudio().play(windGrain(speed));
      }
    }
    if (sim.mode === "air" && Math.abs(sim.spin) > 3) {
      this.spinT -= dt;
      if (this.spinT <= 0) {
        this.spinT = 0.2;
        this.sfx(DOWNHILL_SFX.spin, 0.8, 0.9 + Math.abs(sim.spin) * 0.03);
      }
    } else this.spinT = 0;
    if (sim.paddling) {
      this.paddleT -= dt;
      if (this.paddleT <= 0) {
        this.paddleT = 0.3;
        this.sfx(PADDLE);
      }
    }
  }
}
