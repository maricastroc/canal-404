import * as Phaser from "phaser";
import { getAudio } from "@/lib/audio/engine";
import type { SoundRecipe } from "@/lib/audio/types";
import { glyphOffset, type Fonts } from "@/games/kit/ui";
import { reportFailedLoads } from "@/games/kit/load";
import type { Locale } from "@/i18n/locales";
import { NIGHT_COPY, type NightCopy, type Sleeper } from "../copy";
import { isCreaky, isHiding, isWall, noiseDistances, pathTo } from "../sim/grid";
import { ACTS, LEVELS } from "../sim/levels";
import { encodeMoves } from "../sim/judge";
import { partStars } from "../sim/score";
import { agentPos, canMove, createSim, isCuckooTurn, isPeeking, nextTo, step, STIR_WAKE, turnsToCuckoo, turnsToKnock, turnsToToss, watchedTiles, type Sim } from "../sim/sim";
import { solve } from "../sim/solver";
import { DX, DY, type Action, type Dir, type SimEvent, type State } from "../sim/types";
import { NIGHT_SFX } from "../sounds";
import { BrunoView, CatView, ClockView, DadView, DogView, GrandmaView, StatusIcon, type BrunoMood } from "./actors";
import { decorFor, drawFloorDecor, drawTopDecor, drawWallDecor, type Decor } from "./decor";
import { decorArtName, hasArt, loadArt, placeArt, propArtName, wallArtTheme, type ArtMode } from "./art";
import { NightLighting, type DynamicLight } from "./lighting";
import { floatZ, noiseRing, pop, popIcon, say, sightLine, soundLine, squiggle, type BubbleTone, type Box, type Speaker } from "./fx";
import { drawExit } from "./exit";
import { StoryBox } from "./story";
import { drawCreakMarks, drawCreaks, drawFloor, drawHides, drawProps, drawWalls, faceMap, hideStyleFor, NIGHT, themeFor, type HideStyle, type Theme } from "./house";
import { ARROW_ICONS, iconKey, loadNightIcons } from "./icons";
import { computeLayout, tileCenter, wobble, type Frame, type Layout } from "./layout";
import { Notebook, type ButtonId, type LegendItem, type NoteKind, type NotebookView } from "./notebook";
import type { NightUiScene } from "./NightUi";
import { PhoneNotebook } from "./phoneNotebook";

export type WinReport = { level: string; index: number; turns: number; par: number; stars: number; hints: number; moves: string; wakes: number; creaks: number; covered: number };

export type Carry = { actions: readonly Action[]; hints: number };

export type NightBridge = {
  locale: Locale;
  fonts: Fonts;
  reducedMotion: boolean;
  frame: Frame;
  touch: boolean;
  art: ArtMode;
  level: number;
  carry: Carry | null;
  stars: () => Record<string, number>;
  onLoad: (value: number) => void;
  onError: (error: unknown) => void;
  onReady: () => void;
  onLevel: (index: number) => void;
  onWin: (report: WinReport) => void;
};

export type Command = "up" | "right" | "down" | "left" | "wait" | "undo" | "restart" | "hint" | "next" | "rules" | "view";

export type CommandSource = "key" | "touch";

type AgentView = ({ kind: "dad"; view: DadView } | { kind: "grandma"; view: GrandmaView } | { kind: "dog"; view: DogView } | { kind: "cat"; view: CatView }) & { status: StatusIcon; lift?: number };

type Note = { text: string; kind: NoteKind; fleeting?: boolean };

type Danger = Note & { lapse: string };

type Ahead = { result: NonNullable<ReturnType<typeof step>>; striped: Set<number> };

const CHAR_SCALE = 1.14;

const MOVE_MS = 190;
const TOUCH_QUEUE = 3;
const ROUTE_PREVIEW = 4;
const SPEAKER_COLORS = { bruno: 0x5cb9f0, dad: 0x9db7ff, grandma: 0xff9ccf, dog: 0xffc89a, cat: 0xd9ccff } as const;
const DIRS: Record<"up" | "right" | "down" | "left", Dir> = { up: 0, right: 1, down: 2, left: 3 };

export class NightScene extends Phaser.Scene {
  private bridge!: NightBridge;
  private copy!: NightCopy;
  private layout!: Layout;
  private sim!: Sim;
  private levelIndex = 0;
  private history: State[] = [];
  private actions: Action[] = [];
  private state!: State;
  private hints = 0;
  private busy = false;
  private queued: Command[] = [];
  private turnTimer?: Phaser.Time.TimerEvent;
  private bruno!: BrunoView;
  private agents: AgentView[] = [];
  private clock: ClockView | null = null;
  private notebook!: NotebookView;
  private lightGfx!: Phaser.GameObjects.Graphics;
  private forecast!: Phaser.GameObjects.Graphics;
  private routeMarks!: Phaser.GameObjects.Graphics;
  private watchSpots: { x: number; y: number }[] = [];
  private hover!: Phaser.GameObjects.Graphics;
  private hintLayer!: Phaser.GameObjects.Graphics;
  private hintMarks!: Phaser.GameObjects.Container;
  private litEyes: Phaser.GameObjects.Image[] = [];
  private badges: Phaser.GameObjects.GameObject[] = [];
  private lightsOn!: Phaser.GameObjects.Rectangle;
  private lighting!: NightLighting;
  private ambient?: Phaser.Time.TimerEvent;
  private lineIndex = 0;
  private lastBubble = 0;
  private lastInput = 0;
  private pointerStart: { x: number; y: number } | null = null;
  private wasBreathing = false;
  private ahead: Ahead | null = null;
  private pinned: Danger | null = null;
  private fleeting: string | null = null;
  private stripesTold = false;
  private flinch = false;
  private floorKind: Theme["floor"] = "wood";
  private hideKind: HideStyle = "curtain";
  private foot = 0;
  private useArt = false;
  private artHides = false;
  private story: StoryBox | null = null;
  private bubbles: Phaser.GameObjects.Container[] = [];
  private ui!: NightUiScene;
  private overviewOn = false;
  private following = false;
  private viewChip: { box: Box; label: Phaser.GameObjects.Text; icon: Phaser.GameObjects.Image; size: number; bg: Phaser.GameObjects.Graphics } | null = null;
  private chipRight = false;
  private indicators: { target: () => { x: number; y: number }; root: Phaser.GameObjects.Container; arrow: Phaser.GameObjects.Graphics }[] = [];

  constructor() {
    super({ key: "night", active: true });
  }

  preload() {
    const bridge = this.registry.get("bridge") as NightBridge;
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => bridge.onLoad(value));
    if (bridge.art === "final") loadArt(this);
    loadNightIcons(this);
    reportFailedLoads(this, bridge.onError);
  }

  create() {
    this.bridge = this.registry.get("bridge") as NightBridge;
    this.copy = NIGHT_COPY[this.bridge.locale];
    this.ui = this.scene.get("night-ui") as NightUiScene;
    this.scene.bringToTop("night-ui");
    this.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, this.bridge.level));
    this.cameras.main.setBackgroundColor("#0d0a1c");
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.pointerStart = { x: p.x, y: p.y };
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.loadLevel(this.levelIndex);
    const carry = this.bridge.carry;
    this.bridge.carry = null;
    if (carry) this.restore(carry);
    this.bridge.onReady();
  }

  loadPart(index: number) {
    this.loadLevel(Math.max(0, Math.min(LEVELS.length - 1, index)));
  }

  carry(): Carry {
    return { actions: [...this.actions], hints: this.hints };
  }

  relayout(frame: Frame) {
    const carry = this.carry();
    const overview = this.overviewOn;
    this.bridge.frame = frame;
    this.loadLevel(this.levelIndex, false);
    this.restore(carry);
    if (!overview && this.layout.scroll) this.focusBruno();
  }

  private restore(carry: Carry) {
    this.story?.close();
    this.hints = carry.hints;
    for (const action of carry.actions) {
      if (this.state.status !== "playing") break;
      const next = step(this.sim, this.state, action);
      if (!next) break;
      if (next.state.status === "caught") break;
      this.history.push(this.state);
      this.actions.push(action);
      this.state = next.state;
    }
    const b = tileCenter(this.layout, this.state.x, this.state.y);
    this.bruno.place(b.x, b.y);
    this.syncViews(false);
    this.refreshOverlays();
    this.notebook.setPlan(this.actions);
    this.notebook.setStats(this.state.turn, this.hints);
    if (this.state.status === "playing") this.settleNotes();
    if (this.state.status === "won") this.notebook.showWin(this.state.turn, this.sim.grid.level.par, partStars(this.sim.grid.level.par, this.state.turn, this.hints), this.levelIndex === LEVELS.length - 1, this.copy.lines.brunoWin[this.sim.grid.level.id] ?? this.copy.notes.won);
  }

  private sfx(recipe: SoundRecipe, volume = 1, pitch = 1) {
    getAudio().play(recipe, { volume, pitch });
  }

  private footstep(x: number, y: number) {
    const grid = this.sim.grid;
    this.foot = 1 - this.foot;
    const pitch = (this.foot ? 1 : 0.9) * (0.96 + Math.random() * 0.08);
    if (isHiding(grid, x, y)) {
      this.sfx(this.hideKind === "plant" ? NIGHT_SFX.rustlePlant : NIGHT_SFX.rustleCurtain, 1, 0.95 + Math.random() * 0.1);
      return;
    }
    const recipe = this.floorKind === "checker" ? NIGHT_SFX.stepTile : this.floorKind === "parquet" ? NIGHT_SFX.stepParquet : NIGHT_SFX.stepWood;
    this.sfx(recipe, 1, pitch);
  }

  private earVolume(x: number, y: number) {
    const d = Math.abs(x - this.state.x) + Math.abs(y - this.state.y);
    return Math.max(0.3, Math.min(1, 1.15 - d * 0.1));
  }

  private loadLevel(index: number, story = true) {
    this.levelIndex = index;
    this.bridge.onLevel(index);
    const level = LEVELS[index];
    this.sim = createSim(level);
    this.layout = computeLayout(this.bridge.frame, this.sim.grid);
    this.ambient?.remove();
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.children.removeAll(true);
    this.ui.reset();
    this.bubbles = [];
    this.indicators = [];
    this.viewChip = null;
    this.chipRight = false;
    this.agents = [];
    this.clock = null;
    this.badges = [];
    this.litEyes = [];
    this.history = [];
    this.actions = [];
    this.hints = 0;
    this.busy = false;
    this.queued = [];
    this.turnTimer = undefined;
    this.state = this.sim.initial;
    this.wasBreathing = false;
    this.pinned = null;
    this.fleeting = null;
    this.stripesTold = false;
    const grid = this.sim.grid;
    const L = this.layout;
    const s = L.tile;
    const theme = themeFor(level.id);
    this.floorKind = theme.floor;
    this.hideKind = hideStyleFor(level.id);
    const decor = decorFor(level.id);
    this.useArt = this.bridge.art === "final" && hasArt(`floor-${level.id}`);
    this.artHides = false;
    const charArt = this.bridge.art === "final";
    const props = this.useArt ? this.buildArtHouse(decor, theme) : this.buildDraftHouse(decor, theme);
    if (!this.artHides) {
      const rows = new Set<number>();
      for (let i = 0; i < grid.tiles.length; i += 1) if (grid.tiles[i] === "h") rows.add(Math.floor(i / grid.w));
      for (const row of rows) drawHides(props, this.add.graphics().setDepth(this.hideDepth(row)), grid, L, hideStyleFor(level.id), row);
    }
    this.lighting = new NightLighting(this, L, decor.lights, decor.darkness, decor.lamps);
    const marks = this.add.graphics().setDepth(7);
    drawCreakMarks(marks, grid, L);
    const target = this.copy.levels[level.id]?.target ?? "";
    const atGoal = level.props.find((p) => p.x === grid.goal.x && p.y === grid.goal.y);
    drawExit(this, grid, L, this.bridge.fonts, target, atGoal?.kind === "stairs" ? "stairs" : atGoal?.kind === "vcr" ? "device" : "passage");
    if (level.id === "living") this.vcrClock(L);
    this.lightGfx = this.add.graphics().setDepth(10);
    this.forecast = this.add.graphics().setDepth(12);
    this.routeMarks = this.add.graphics().setDepth(36);
    this.hover = this.add.graphics().setDepth(13);
    this.hintLayer = this.add.graphics().setDepth(39.5);
    this.hintMarks = this.add.container(0, 0).setDepth(39.5);
    this.tweens.add({ targets: [this.hintLayer, this.hintMarks], y: -s * 0.06, duration: 620, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.drawFrame();
    this.lightsOn = this.add.rectangle(L.board.x, L.board.y, L.board.w, L.board.h, 0xffe8a0, 0).setOrigin(0).setDepth(45);
    const iconSize = Math.max(30, s * 0.34, L.small * 1.65);
    level.agents.forEach((def, i) => {
      const c = tileCenter(L, ...this.xy(agentPos(grid, i, this.state.agents[i])));
      if (def.kind === "sleeper") {
        const onBed = level.props.some((p) => p.kind === "bed" && p.x === def.x && def.y >= p.y && def.y < p.y + (p.h ?? 1));
        const view = new DadView(this, s, onBed ? "bed" : "armchair", charArt);
        view.container.setPosition(c.x, c.y).setScale(CHAR_SCALE * 0.94);
        this.agents.push({ kind: "dad", view, status: new StatusIcon(this, view.container, this.bridge.fonts.round ?? this.bridge.fonts.body, iconSize, onBed ? (charArt ? -s * 1.05 : -s * 1.1) : charArt ? -s * 0.42 : -s * 0.62, charArt ? (def.x - L.view.x0 < 1.6 ? s : -s) * 1.0 : 0) });
      } else if (def.kind === "patrol") {
        const view = new GrandmaView(this, s, def.range * s, charArt);
        view.container.setPosition(c.x, c.y).setScale(CHAR_SCALE);
        this.agents.push({ kind: "grandma", view, status: new StatusIcon(this, view.container, this.bridge.fonts.round ?? this.bridge.fonts.body, iconSize, charArt ? -s * 1.0 : -s * 0.66) });
      } else if (def.kind === "cat") {
        const view = new CatView(this, s, charArt);
        const perch = level.props.find((p) => p.x <= def.x && def.x < p.x + (p.w ?? 1) && p.y <= def.y && def.y < p.y + (p.h ?? 1));
        const lift = s * (perch?.kind === "cabinet" ? 0.98 : perch?.kind === "aquarium" ? 0.7 : 0.32);
        view.container.setPosition(c.x, c.y - lift).setScale(CHAR_SCALE);
        this.agents.push({ kind: "cat", view, lift, status: new StatusIcon(this, view.container, this.bridge.fonts.round ?? this.bridge.fonts.body, iconSize * 0.9, -s * 0.62) });
      } else {
        const view = new DogView(this, s, charArt);
        view.container.setPosition(c.x, c.y).setScale(CHAR_SCALE);
        this.agents.push({ kind: "dog", view, status: new StatusIcon(this, view.container, this.bridge.fonts.round ?? this.bridge.fonts.body, iconSize, -s * 0.5) });
      }
    });
    if (level.clock) {
      this.clock = new ClockView(this, s, this.bridge.fonts.display, this.copy.lines.now, charArt);
      const c = tileCenter(L, level.clock.x, level.clock.y);
      this.clock.container.setPosition(c.x, c.y - s * 0.02);
    }
    this.bruno = new BrunoView(this, s, charArt);
    this.bruno.container.setScale(CHAR_SCALE);
    const b = tileCenter(L, this.state.x, this.state.y);
    this.bruno.place(b.x, b.y);
    this.notebook =
      L.kind === "full"
        ? new Notebook(this.ui, L, this.bridge.fonts, this.copy, (id) => this.onButton(id))
        : new PhoneNotebook(this.ui, L, this.bridge.fonts, this.copy, {
            button: (id) => this.onButton(id, "touch"),
            move: (dir) => this.command((["up", "right", "down", "left"] as const)[dir], "touch"),
            preview: (dir) => this.previewMove(dir),
          });
    const progress = this.bridge.stars();
    const text = this.copy.levels[level.id];
    const actOf = LEVELS.map((_l, i) => Math.max(0, ACTS.findIndex((a) => i >= a.first && i <= a.last)));
    const act = ACTS[actOf[index]];
    this.notebook.setLevel(index, LEVELS.length, text.title, text.goal, level.par, LEVELS.map((l) => progress[l.id] ?? 0), this.legendFor(), actOf, this.copy.actLabel(actOf[index] + 1, this.copy.acts[act.id] ?? ""));
    this.notebook.setStats(0, 0);
    this.notebook.intro(text.intro);
    this.story = new StoryBox(this.ui, L, this.bridge.fonts, charArt, this.copy.speaker, () => this.focusBruno());
    this.setupCamera();
    if (story) this.time.delayedCall(350, () => this.history.length === 0 && this.state.status === "playing" && this.story?.show(text.story, [...this.avoidBoxes().map((b) => this.toScreen(b)), ...(this.viewChip ? [this.viewChip.box] : [])]));
    this.syncViews(false);
    this.refreshOverlays();
    this.ambient = this.time.addEvent({ delay: 1400, loop: true, callback: () => this.ambientTick() });
    if (this.lighting.hasFlicker() && !this.bridge.reducedMotion) this.time.addEvent({ delay: 140, loop: true, callback: () => this.lighting.flicker() });
    this.lastInput = this.time.now;
  }

  private buildDraftHouse(decor: Decor, theme: ReturnType<typeof themeFor>) {
    const grid = this.sim.grid;
    const L = this.layout;
    const floor = this.add.graphics().setDepth(0);
    drawFloor(floor, grid, L, theme);
    drawFloorDecor(floor, decor, L);
    drawCreaks(floor, grid, L);
    const walls = this.add.graphics().setDepth(1);
    drawWalls(walls, grid, L, theme);
    drawWallDecor(walls, decor, L);
    const props = this.add.graphics().setDepth(3);
    drawProps(props, grid, L);
    drawTopDecor(props, decor, L);
    return props;
  }

  private buildArtHouse(decor: Decor, theme: ReturnType<typeof themeFor>) {
    const grid = this.sim.grid;
    const L = this.layout;
    const level = grid.level;
    const split = <T extends { kind: string; w?: number; h?: number; v?: string | number }>(items: T[]) => {
      const art: { item: T; name: string }[] = [];
      const rest: T[] = [];
      for (const item of items) {
        const name = decorArtName(item.kind, item.w, item.h, item.v);
        if (name && hasArt(name)) art.push({ item, name });
        else rest.push(item);
      }
      return { art, rest };
    };
    if (!placeArt(this, `floor-${level.id}`, L, 0, 0, 0)) {
      for (let y = 0; y < grid.h; y += 1) {
        for (let x = 0; x < grid.w; x += 1) {
          if (isWall(grid, x, y)) continue;
          placeArt(this, `floor-wood-${Math.floor(((x * 7 + y * 13) % 9) / 3)}`, L, x, y, 0);
        }
      }
    }
    const floorItems = split(decor.floor);
    for (const { item, name } of floorItems.art) placeArt(this, name, L, item.x, item.y, 0.5);
    const floorRest = this.add.graphics().setDepth(0.6);
    drawFloorDecor(floorRest, { ...decor, floor: floorItems.rest }, L);
    for (let y = 0; y < grid.h; y += 1) {
      for (let x = 0; x < grid.w; x += 1) {
        if (!isCreaky(grid, x, y)) continue;
        const row = Math.floor(wobble(x * 5 + y * 11) * 2);
        const look = Math.floor(wobble(x * 3 + y * 7) * 2);
        placeArt(this, `creak-${row + look * 2}`, L, x, y, 0.8);
      }
    }
    const walls = this.add.graphics().setDepth(1);
    drawWalls(walls, grid, L, theme);
    const faces = faceMap(grid);
    for (let y = 0; y < grid.h; y += 1) {
      for (let x = 0; x < grid.w; x += 1) {
        const kind = faces[y * grid.w + x];
        if (kind !== "face" && kind !== "tall") continue;
        const top = y === 0 || faces[(y - 1) * grid.w + x] === "cap";
        const variant = kind === "face" ? (top ? "single" : "bottom") : top ? "top" : "mid";
        placeArt(this, `wall-${wallArtTheme(theme.pattern)}-${variant}`, L, x, y, 1.1);
      }
    }
    const wallItems = split(decor.wall);
    for (const { item, name } of wallItems.art) placeArt(this, name, L, item.x, item.y, 1.2);
    const wallRest = this.add.graphics().setDepth(1.3);
    drawWallDecor(wallRest, { ...decor, wall: wallItems.rest }, L);
    const artProps = level.props.filter((p) => p.kind !== "door" && hasArt(propArtName(p)));
    for (const p of [...artProps].sort((a, b) => a.y - b.y)) placeArt(this, propArtName(p), L, p.x, p.y, 3);
    const props = this.add.graphics().setDepth(3.1);
    drawProps(props, grid, L, (p) => artProps.includes(p));
    const topItems = split(decor.top);
    for (const { item, name } of topItems.art) placeArt(this, name, L, item.x, item.y, 3.2);
    drawTopDecor(props, { ...decor, top: topItems.rest }, L);
    const hide = hideStyleFor(level.id);
    if (hasArt(`hide-${hide}-front`)) {
      for (let y = 0; y < grid.h; y += 1) {
        for (let x = 0; x < grid.w; x += 1) {
          if (grid.tiles[y * grid.w + x] !== "h") continue;
          placeArt(this, `hide-${hide}-back`, L, x, y, 3);
          placeArt(this, `hide-${hide}-front`, L, x, y, this.hideDepth(y));
        }
      }
      this.artHides = true;
    }
    return props;
  }

  private drawFrame() {
    const L = this.layout;
    const b = L.frame;
    const k = L.ui;
    const g = this.ui.add.graphics().setDepth(22);
    g.fillStyle(NIGHT.void, 1);
    g.fillRect(0, 0, L.W, b.y);
    g.fillRect(0, b.y + b.h, L.W, L.H - b.y - b.h);
    g.fillRect(0, b.y, b.x, b.h);
    g.fillRect(b.x + b.w, b.y, L.W - b.x - b.w, b.h);
    if (L.kind !== "full") {
      const m = L.map;
      const step = 18 * L.unit;
      g.fillStyle(0x8f7fd0, 0.09);
      for (let y = m.y + step / 2; y < m.y + m.h; y += step) {
        for (let x = m.x + step / 2; x < m.x + m.w; x += step) {
          if (x > b.x - step && x < b.x + b.w + step && y > b.y - step && y < b.y + b.h + step) continue;
          g.fillCircle(x, y, 1.3 * L.unit);
        }
      }
    }
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(b.x + 7 * k, b.y + b.h - 4 * k, b.w, 12 * k, 6 * k);
    g.lineStyle(7 * k, NIGHT.ink, 1);
    g.strokeRoundedRect(b.x - 3 * k, b.y - 3 * k, b.w + 6 * k, b.h + 6 * k, 14 * k);
    g.lineStyle(2 * k, 0x5a4a8a, 0.9);
    g.strokeRoundedRect(b.x - 9 * k, b.y - 9 * k, b.w + 18 * k, b.h + 18 * k, 18 * k);
    const v = this.ui.add.graphics().setDepth(21.5);
    const edge = L.tile * 0.5;
    for (let i = 0; i < 6; i += 1) {
      v.lineStyle(edge / 6, 0x05030f, 0.18 - i * 0.025);
      v.strokeRect(b.x + (i * edge) / 6 + edge / 12, b.y + (i * edge) / 6 + edge / 12, b.w - (i * edge) / 3 - edge / 6, b.h - (i * edge) / 3 - edge / 6);
    }
  }

  private vcrClock(L: Layout) {
    const grid = this.sim.grid;
    const c = tileCenter(L, grid.goal.x, grid.goal.y);
    const s = L.tile;
    const t = this.add
      .text(c.x - s * 0.18, c.y - s * 0.18, "12:00", { fontFamily: this.bridge.fonts.display, fontSize: `${Math.round(s * 0.14)}px`, color: "#ff6b6b", padding: { x: 2, y: 1 } })
      .setOrigin(0.5)
      .setDepth(9);
    this.tweens.add({ targets: t, alpha: { from: 1, to: 0.1 }, duration: 500, yoyo: true, repeat: -1, hold: 300 });
  }

  private xy(p: { x: number; y: number }): [number, number] {
    return [p.x, p.y];
  }

  private legendFor(): LegendItem[] {
    const level = this.sim.grid.level;
    const items: LegendItem[] = [];
    if (level.map.some((r) => r.includes("~"))) items.push("creak", "marks");
    if (level.clock) items.push("clock");
    items.push("light", "next");
    if (level.map.some((r) => r.includes("h"))) items.push("hide");
    if (level.agents.some((a) => a.kind === "patrol")) items.push("route");
    if (level.agents.some((a) => a.kind === "sleeper" && a.toss)) items.push("toss");
    if (level.agents.some((a) => a.kind === "sleeper" || a.kind === "dog")) items.push("near");
    if (level.agents.some((a) => a.kind === "dog")) items.push("dog");
    if (level.agents.some((a) => a.kind === "cat")) items.push("cat");
    return items;
  }

  command(cmd: Command, from: CommandSource = "key") {
    this.lastInput = this.time.now;
    if (cmd === "rules") {
      this.notebook.togglePage("rules");
      return;
    }
    if (cmd === "view") {
      if (this.overviewOn) this.focusBruno();
      else this.showOverview();
      return;
    }
    if (this.story?.open) {
      if (cmd === "next" || cmd === "wait") {
        this.story.advance();
        return;
      }
      this.story.close();
    }
    if (this.busy) {
      if (cmd === "undo" || cmd === "restart") {
        this.busy = false;
      } else {
        if (from === "key") this.queued = [cmd];
        else if (this.queued.length < TOUCH_QUEUE) this.queued.push(cmd);
        return;
      }
    }
    switch (cmd) {
      case "undo":
        this.undo();
        return;
      case "restart":
        this.restart();
        return;
      case "hint":
        this.hint();
        return;
      case "next":
        return;
      case "wait":
        this.act("wait");
        return;
      default:
        this.act(DIRS[cmd as keyof typeof DIRS]);
    }
  }

  private onButton(id: ButtonId, from: CommandSource = "key") {
    if (id === "undoCaught") this.command("undo", from);
    else this.command(id, from);
  }

  private act(action: Action) {
    if (this.overviewOn || (this.layout.scroll && !this.following)) this.focusBruno();
    if (this.state.status !== "playing") {
      if (this.state.status === "caught") this.flashUndo();
      return;
    }
    const result = step(this.sim, this.state, action);
    if (!result) {
      if (action !== "wait") {
        this.bruno.setFacing(action);
        this.bruno.bump(action);
        this.sfx(NIGHT_SFX.bump, 0.7);
      }
      return;
    }
    this.clearHint();
    this.hover.clear();
    this.history.push(this.state);
    this.actions.push(action);
    const prev = this.state;
    this.state = result.state;
    this.busy = true;
    this.playEvents(prev, result.events);
    this.notebook.setPlan(this.actions);
    this.notebook.setStats(this.state.turn, this.hints);
    this.turnTimer = this.time.delayedCall(MOVE_MS + 30, () => this.afterTurn(prev, result.events));
  }

  private flashUndo() {
    this.notebook.nudgeUndo();
  }

  private dropPending() {
    this.turnTimer?.remove();
    this.turnTimer = undefined;
    this.queued = [];
  }

  private playEvents(prev: State, events: SimEvent[]) {
    const L = this.layout;
    const s = L.tile;
    const fonts = this.bridge.fonts;
    const masked = events.some((e) => e.type === "creak" && e.masked);
    for (const e of events) {
      switch (e.type) {
        case "move": {
          const c = tileCenter(L, e.to.x, e.to.y);
          this.bruno.setFacing(e.dir);
          this.bruno.hop(c.x, c.y, MOVE_MS);
          this.time.delayedCall(MOVE_MS * 0.72, () => this.footstep(e.to.x, e.to.y));
          break;
        }
        case "wait":
          this.sfx(NIGHT_SFX.wait);
          break;
        case "cuckoo":
          this.clock?.sing();
          this.sfx(NIGHT_SFX.cuckoo);
          if (this.clock) this.talk(this.clock.container.x, this.clock.container.y - s * 0.5, this.copy.lines.cuckoo, "shout", 900);
          break;
        case "creak": {
          const c = tileCenter(L, e.x, e.y);
          if (e.masked) {
            this.sfx(NIGHT_SFX.creakSoft, 0.6);
            for (const a of this.agents) if (a.kind === "dad") a.view.stir();
            squiggle(this, fonts, c.x, c.y - s * 0.4, this.copy.lines.creak.toLowerCase(), Math.round(s * 0.2), "#8a83a3");
          } else {
            this.sfx(NIGHT_SFX.creak);
            squiggle(this, fonts, c.x, c.y - s * 0.55, this.copy.lines.creak, Math.round(s * 0.34));
            noiseRing(this, c.x, c.y, s * this.sim.grid.level.loud, 0xd7cdfa);
            this.bruno.wince();
            this.flinch = true;
            this.cameras.main.shake(120, 0.002);
          }
          break;
        }
        case "heard": {
          const a = this.agents[e.agent];
          const from = tileCenter(L, e.x, e.y);
          soundLine(this, from.x, from.y, a.view.headPoint().x, a.view.headPoint().y, s);
          if (a.kind === "dog") {
            const p = a.view.headPoint();
            pop(this, fonts, p.x, p.y - s * 0.2, this.copy.lines.dogWake, Math.round(s * 0.42));
          }
          break;
        }
        case "wake": {
          const a = this.agents[e.agent];
          if (a.kind !== "dad") break;
          const p = a.view.headPoint();
          pop(this, fonts, p.x, p.y - s * 0.1, "!", Math.round(s * 0.6));
          const before = prev.agents[e.agent];
          if (before.kind === "sleeper" && before.awake === 0 && this.state.status !== "caught") {
            this.talk(p.x, p.y - s * 0.35, this.pick(this.copy.lines.dadWake), "scare", 1300, "dad");
          }
          this.sfx(NIGHT_SFX.wake);
          break;
        }
        case "alert": {
          const a = this.agents[e.agent];
          if (a.kind !== "grandma") break;
          const p = a.view.headPoint();
          pop(this, fonts, p.x, p.y - s * 0.1, "?", Math.round(s * 0.6));
          this.talk(p.x, p.y - s * 0.35, this.pick(this.copy.lines.grandmaAlert), "scare", 1300, "grandma");
          this.sfx(NIGHT_SFX.alert);
          break;
        }
        case "stir": {
          const a = this.agents[e.agent];
          const p = a.view.headPoint();
          if (a.kind === "dad") {
            a.view.stir();
            this.time.delayedCall(MOVE_MS, () => this.state.status === "playing" && this.talk(p.x, p.y - s * 0.3, this.pick(this.copy.lines.dadStir), "whisper", 1500, "dad"));
            this.sfx(NIGHT_SFX.stir);
          } else if (a.kind === "dog") {
            a.view.twitch();
            this.time.delayedCall(MOVE_MS, () => this.state.status === "playing" && squiggle(this, fonts, p.x, p.y - s * 0.25, this.copy.lines.dogStir, Math.round(s * 0.24), "#f6d7a7"));
          }
          break;
        }
        case "toss": {
          const a = this.agents[e.agent];
          if (a.kind !== "dad") break;
          const p = a.view.headPoint();
          if (this.state.status !== "caught") this.time.delayedCall(MOVE_MS, () => this.talk(p.x, p.y - s * 0.3, this.pick(this.copy.lines.dadToss), "whisper", 1400, "dad"));
          this.sfx(NIGHT_SFX.toss);
          break;
        }
        case "sleep": {
          const a = this.agents[e.agent];
          if (a.kind !== "dad") break;
          const p = a.view.headPoint();
          this.time.delayedCall(MOVE_MS, () => this.talk(p.x, p.y - s * 0.3, this.pick(this.copy.lines.dadSleepAgain), "whisper", 1400, "dad"));
          this.sfx(NIGHT_SFX.sleep, 0.7);
          break;
        }
        case "resume": {
          const a = this.agents[e.agent];
          if (a.kind !== "grandma") break;
          const p = a.view.headPoint();
          this.talk(p.x, p.y - s * 0.35, this.pick(this.copy.lines.grandmaResume), "thought", 1300, "grandma");
          break;
        }
        case "agentMove": {
          const a = this.agents[e.agent];
          const c = tileCenter(L, e.to.x, e.to.y);
          if (a.kind === "grandma") {
            a.view.walkTo(c.x, c.y, MOVE_MS + 40);
            this.sfx(NIGHT_SFX.slipper, this.earVolume(e.to.x, e.to.y), 0.94 + Math.random() * 0.12);
            if (this.time.now - this.lastBubble > 5000 && Math.random() < 0.18) {
              this.lastBubble = this.time.now;
              this.time.delayedCall(MOVE_MS, () => this.talk(c.x, c.y - s * 0.75, this.pick(this.copy.lines.grandmaWalk), "whisper", 1500, "grandma"));
            }
          } else if (a.kind === "dog") {
            a.view.trotTo(c.x, c.y, MOVE_MS);
            this.sfx(NIGHT_SFX.paws, this.earVolume(e.to.x, e.to.y) * (this.floorKind === "checker" ? 1.2 : 0.85), 0.95 + Math.random() * 0.1);
          }
          break;
        }
        case "dogArrive": {
          const a = this.agents[e.agent];
          if (a.kind !== "dog") break;
          this.time.delayedCall(MOVE_MS, () => {
            const p = a.view.headPoint();
            squiggle(this, fonts, p.x, p.y - s * 0.2, this.copy.lines.dogSniff, Math.round(s * 0.24), "#f6d7a7");
            this.sfx(NIGHT_SFX.sniff);
          });
          break;
        }
        case "knock": {
          const a = this.agents[e.agent];
          if (a.kind !== "cat") break;
          const c = tileCenter(L, e.x, e.y);
          a.view.swipe(() => {
            this.sfx(NIGHT_SFX.knock);
            this.time.delayedCall(520, () => this.sfx(NIGHT_SFX.meow, 0.8));
            squiggle(this, fonts, c.x + s * 0.3, c.y - s * 0.7, this.pick(this.copy.lines.knock), Math.round(s * 0.3), "#ffe39a");
            noiseRing(this, c.x, c.y, s * 2, 0xffe39a);
            const cup = this.add.graphics().setDepth(36);
            cup.fillStyle(0xf6f1e4, 1);
            cup.lineStyle(2.5, NIGHT.ink, 1);
            cup.fillRoundedRect(-s * 0.08, -s * 0.08, s * 0.16, s * 0.16, 4);
            cup.strokeRoundedRect(-s * 0.08, -s * 0.08, s * 0.16, s * 0.16, 4);
            cup.setPosition(c.x + s * 0.2, c.y - s * 0.4);
            this.tweens.add({ targets: cup, x: c.x + s * 0.5, y: c.y + s * 0.55, angle: 280, duration: 320, ease: "Quad.easeIn", onComplete: () => this.tweens.add({ targets: cup, alpha: 0, delay: 500, duration: 300, onComplete: () => cup.destroy() }) });
          });
          break;
        }
        case "dogHome":
          break;
        case "caught":
        case "won":
        case "turnAround":
          break;
      }
    }
    if (masked) this.time.delayedCall(80, () => this.clock && popIcon(this, this.clock.container.x + s * 0.5, this.clock.container.y - s * 0.4, [iconKey("noteEdge"), iconKey("note")], Math.round(s * 0.42)));
  }

  private talk(x: number, y: number, text: string, tone: BubbleTone, duration: number, who?: keyof typeof SPEAKER_COLORS) {
    this.bubbles = this.bubbles.filter((b) => b.active);
    const v = this.cameras.main.worldView;
    const bounds = { x: v.x + 8, y: v.y + 8, w: v.width - 16, h: v.height - 16 };
    const speaker: Speaker | undefined = who ? { name: this.copy.names[who], color: SPEAKER_COLORS[who] } : undefined;
    const view = this.cameras.main.worldView;
    if ((tone === "whisper" || tone === "thought") && !view.contains(x, y + this.layout.tile * 0.3)) return null;
    if (who) {
      for (const b of this.bubbles) if (b.active && b.getData("who") === who) b.destroy();
      this.bubbles = this.bubbles.filter((b) => b.active);
    }
    const bubble = say(this, this.layout, this.bridge.fonts, x, y, text, { tone, duration, avoid: this.avoidBoxes(), area: bounds, speaker });
    bubble.setData("who", who ?? null);
    this.bubbles.push(bubble);
    return bubble;
  }

  private avoidBoxes(): Box[] {
    const s = this.layout.tile;
    const out: Box[] = [];
    const b = this.bruno.container;
    out.push({ x: b.x - s * 0.5, y: b.y - s * 1.15, w: s, h: s * 1.5 });
    const grid = this.sim.grid;
    const g = tileCenter(this.layout, grid.goal.x, grid.goal.y);
    out.push({ x: g.x - s * 0.5, y: g.y - s * 0.5, w: s, h: s });
    for (const a of this.agents) {
      const c = a.view.container;
      const tall = a.kind === "dad" ? s * 1.6 : s * 1.1;
      const wide = a.kind === "dad" ? s * 0.6 : 0;
      out.push({ x: c.x - s * 0.5 - wide, y: c.y - tall, w: s + wide, h: tall + s * 0.4 });
      const k = c.scaleX;
      const sx = c.x + a.status.offsetX * k;
      const sy = c.y + a.status.offsetY * k;
      out.push({ x: sx - s * 0.85, y: sy - s * 0.26, w: s * 1.7, h: s * 0.52 });
    }
    for (const bubble of this.bubbles) if (bubble.active) out.push(bubble.getData("box") as Box);
    const st = this.state;
    for (const d of [0, 1, 2, 3] as Dir[]) {
      if (!canMove(this.sim, st, d)) continue;
      const c = tileCenter(this.layout, st.x + DX[d], st.y + DY[d]);
      out.push({ x: c.x - s * 0.45, y: c.y - s * 0.45, w: s * 0.9, h: s * 0.9 });
    }
    for (const p of this.watchSpots) {
      const c = tileCenter(this.layout, p.x, p.y);
      out.push({ x: c.x - s * 0.5, y: c.y - s * 0.7, w: s, h: s * 1.2 });
    }
    return out;
  }

  private hush() {
    for (const b of this.bubbles) if (b.active) b.destroy();
    this.bubbles = [];
  }

  private pick(list: string[]) {
    this.lineIndex += 1;
    return list[this.lineIndex % list.length];
  }

  private afterTurn(prev: State, events: SimEvent[]) {
    this.turnTimer = undefined;
    this.busy = false;
    this.syncViews(true);
    this.refreshOverlays();
    if (this.state.status === "caught") {
      this.queued = [];
      this.playCaught(events);
      return;
    }
    if (this.state.status === "won") {
      this.queued = [];
      this.playWin();
      return;
    }
    this.turnNote(prev, events);
    if (this.moodFor(this.state) === "tense") this.sfx(NIGHT_SFX.heartbeat);
    if (this.flinch) {
      this.flinch = false;
      this.bruno.setMood("scared");
      this.time.delayedCall(650, () => this.state.status === "playing" && this.bruno.setMood(this.moodFor(this.state)));
    } else if (events.some((e) => (e.type === "creak" && e.masked) || e.type === "sleep" || e.type === "dogHome")) {
      this.bruno.setMood("relief");
      this.time.delayedCall(800, () => this.state.status === "playing" && this.bruno.setMood(this.moodFor(this.state)));
    }
    const next = this.queued.shift();
    if (next) this.command(next, "touch");
  }

  private turnNote(prev: State, events: SimEvent[]) {
    const n = this.copy.notes;
    const picks: Note[] = [];
    const note = (text: string, kind: NoteKind, fleeting = false) => picks.push({ text, kind, fleeting });
    const creak = events.find((e) => e.type === "creak");
    const heard = events.filter((e) => e.type === "heard");
    const level = this.sim.grid.level;
    const grid = this.sim.grid;
    if (events.some((e) => e.type === "knock")) note(n.knocked, "info");
    if (creak && creak.type === "creak") {
      if (creak.masked) note(n.masked, "good");
      else if (heard.length === 0) note(n.unheard, "info");
    }
    if (events.some((e) => e.type === "sleep")) note(n.backToSleep, "good");
    if (events.some((e) => e.type === "resume")) note(n.grandmaBack, "info");
    if (events.some((e) => e.type === "dogHome")) note(n.dogHome, "info");
    this.state.agents.forEach((a, i) => {
      const before = prev.agents[i];
      if (a.kind === "sleeper" && a.awake > 0 && !heard.some((h) => h.type === "heard" && h.agent === i) && !events.some((e) => e.type === "toss")) note(n.stillAwake(a.awake), "warn");
      if (a.kind === "dog" && before.kind === "dog" && a.mode === "go" && before.mode === "go" && !heard.length) note(n.dogGoing, "good");
    });
    if (events.some((e) => e.type === "dogArrive")) note(n.dogSniff, "good");
    if (level.clock && turnsToCuckoo(grid, this.state.turn) === 1) {
      const board = ([0, 1, 2, 3] as Dir[]).some((d) => canMove(this.sim, this.state, d) && isCreaky(grid, this.state.x + DX[d], this.state.y + DY[d]));
      note(board ? n.stepNow : n.cuckooSoon, board ? "good" : "warn", true);
    }
    level.agents.forEach((def) => {
      if (def.kind === "cat" && turnsToKnock(def, this.state.turn) === 1) note(n.knockSoon, "warn", true);
    });
    this.state.agents.forEach((a, i) => {
      const def = level.agents[i];
      if (a.kind === "sleeper" && def.kind === "sleeper" && a.awake === 0 && turnsToToss(def, this.state.turn) === 1) note(n.tossSoon, "warn", true);
    });
    this.state.agents.forEach((a, i) => {
      const before = prev.agents[i];
      if (a.kind === "dog" && before.kind === "dog" && a.mode === "back" && before.mode === "sniff") note(n.dogBack, "warn");
    });
    const listeners = new Set(heard.flatMap((e) => (e.type === "heard" && !events.some((a) => a.type === "dogArrive" && a.agent === e.agent) ? [level.agents[e.agent].kind] : [])));
    if (listeners.has("patrol")) note(n.grandmaStopped, "warn");
    if (listeners.has("sleeper")) note(n.woke, "warn");
    if (listeners.has("dog")) note(n.wokeDog, "warn");
    const hiddenNow = isHiding(grid, this.state.x, this.state.y);
    if (hiddenNow) {
      note(n.hidden, "good", true);
      const idx = this.state.y * grid.w + this.state.x;
      if (this.state.agents.some((_a, i) => watchedTiles(grid, this.state.agents, i).includes(idx))) note(n.hiddenSafe, "good", true);
    }
    this.state.agents.forEach((a, i) => {
      const def = level.agents[i];
      if (a.kind === "patrol" && def.kind === "patrol" && a.alert === 0 && def.path[(a.idx + 1) % def.path.length].peek) note(n.peekSoon, "warn", true);
    });
    this.state.agents.forEach((_a, i) => {
      if (!isPeeking(grid, this.state.agents, i)) return;
      const view = this.agents[i];
      if (view.kind !== "grandma") return;
      const p = view.view.headPoint();
      this.talk(p.x, p.y - this.layout.tile * 0.35, this.pick(this.copy.lines.grandmaPeek), "normal", 1500, "grandma");
    });
    const breathing = this.bruno.getMood() === "breath";
    if (breathing && !this.wasBreathing) {
      note(n.holdBreath(this.who(this.sleeperNear(this.state, 0))), "info");
      this.mumbleNearby();
    }
    this.wasBreathing = breathing;
    if (events.some((e) => e.type === "toss")) note(n.tossed, "warn");
    const danger = this.danger();
    const firstStripes = !this.stripesTold && !!this.ahead?.striped.size;
    const pin = this.pinned;
    const lapse: Note | null = pin && this.notebook.showing(pin.text) && this.ahead?.result.state.status !== "caught" ? { text: pin.lapse, kind: "good", fleeting: true } : null;
    const expired = this.fleeting && this.notebook.showing(this.fleeting) ? this.introNote() : null;
    const shown = danger ?? (firstStripes ? { text: n.stripes, kind: "info" } : null) ?? picks[picks.length - 1] ?? lapse ?? expired;
    if (!danger && firstStripes) this.stripesTold = true;
    this.pinned = danger;
    this.fleeting = shown?.fleeting ? shown.text : null;
    if (shown) this.notebook.note(shown.text, shown.kind);
  }

  private introNote(): Note | null {
    const intro = this.copy.levels[this.sim.grid.level.id]?.intro ?? [];
    return intro.length ? { text: intro[intro.length - 1], kind: "info" } : null;
  }

  private who(index: number): Sleeper {
    return this.sim.grid.level.agents[index]?.kind === "dog" ? "dog" : "dad";
  }

  private sleeperNear(st: State, minStir: number) {
    const grid = this.sim.grid;
    return st.agents.findIndex((a, i) => {
      if (a.kind !== "sleeper" && a.kind !== "dog") return false;
      const asleep = a.kind === "sleeper" ? a.awake === 0 : a.mode === "sleep";
      const p = agentPos(grid, i, a);
      return asleep && a.stir >= minStir && nextTo(p.x, p.y, st.x, st.y);
    });
  }

  private danger(): Danger | null {
    const st = this.state;
    const n = this.copy.notes;
    const end = this.ahead?.result;
    if (end && end.state.status === "caught") {
      if (!this.canEscape(st)) return { text: n.trapped, kind: "bad", lapse: n.clear };
      const woken = end.events.some((e) => e.type === "heard" && e.agent === end.state.caughtBy && e.source === -2);
      if (!woken && end.state.reason === "light") return { text: n.seen, kind: "bad", lapse: n.clear };
    }
    const stirred = this.sleeperNear(st, STIR_WAKE - 1);
    return stirred >= 0 ? { text: n.stirred(this.who(stirred)), kind: "bad", lapse: n.calm } : null;
  }

  private canEscape(st: State) {
    return ([0, 1, 2, 3] as Dir[]).some((d) => {
      const next = step(this.sim, st, d);
      return !!next && next.state.status !== "caught";
    });
  }

  private settleNotes(fallback?: string) {
    const danger = this.danger();
    this.pinned = danger;
    this.fleeting = null;
    this.wasBreathing = this.moodFor(this.state) === "breath";
    if (danger) this.notebook.note(danger.text, danger.kind);
    else if (fallback) this.notebook.note(fallback, "info");
  }

  private mumbleNearby() {
    const grid = this.sim.grid;
    const st = this.state;
    const s = this.layout.tile;
    st.agents.forEach((a, i) => {
      const view = this.agents[i];
      if (a.kind !== "sleeper" || a.awake > 0 || view.kind !== "dad") return;
      const p = agentPos(grid, i, a);
      if (Math.abs(p.x - st.x) > 1 || Math.abs(p.y - st.y) > 1) return;
      this.lastBubble = this.time.now;
      const h = view.view.headPoint();
      this.time.delayedCall(260, () => {
        if (this.state.status !== "playing") return;
        view.view.stir();
        this.talk(h.x, h.y - s * 0.3, this.pick(this.copy.lines.dadSleep), "whisper", 1600, "dad");
        this.sfx(NIGHT_SFX.snore, 0.8);
      });
    });
  }

  private syncViews(animate: boolean) {
    const L = this.layout;
    const st = this.state;
    const grid = this.sim.grid;
    if (!animate) {
      const b = tileCenter(L, st.x, st.y);
      this.bruno.place(b.x, b.y);
    }
    this.bruno.setFacing(st.facing);
    st.agents.forEach((a, i) => {
      const view = this.agents[i];
      const c = tileCenter(L, ...this.xy(agentPos(grid, i, a)));
      if (a.kind === "sleeper" && view.kind === "dad") {
        const def = grid.level.agents[i];
        const full = def.kind === "sleeper" ? def.wake : 3;
        const mood = a.awake === 0 ? "sleep" : a.awake >= full ? "startled" : a.awake === 1 ? "sleepy" : "suspicious";
        view.view.set(mood, a.facing);
        const toss = def.kind === "sleeper" && def.toss && a.awake === 0 ? turnsToToss(def, st.turn) : -1;
        if (toss > 0) view.status.show(this.copy.status.toss(toss), toss === 1 ? "#ff9d8a" : "#d9ccff");
        else if (a.awake > 0) view.status.show(this.copy.status.sleepsIn(a.awake), mood === "startled" ? "#ff9d8a" : mood === "suspicious" ? "#ffe39a" : "#d9ccff");
        else view.status.show(null);
      } else if (a.kind === "patrol" && view.kind === "grandma") {
        view.view.set(a.alert > 0 ? "alert" : "walk", a.facing);
        view.status.show(a.alert > 0 ? this.copy.status.looking(a.alert) : null, "#ffe39a");
        if (!animate) {
          this.tweens.killTweensOf(view.view.container);
          view.view.container.setPosition(c.x, c.y);
        }
      } else if (a.kind === "dog" && view.kind === "dog") {
        view.view.set(a.mode === "sleep" ? "sleep" : a.mode === "sniff" ? "sniff" : "walk", a.facing);
        view.status.show(a.mode === "sleep" ? null : a.mode === "sniff" ? this.copy.status.sniffing(a.timer) : a.mode === "go" ? this.copy.status.going : this.copy.status.returning, a.mode === "back" ? "#ff9d8a" : "#ffc89a");
        if (!animate) view.view.place(c.x, c.y);
      } else if (a.kind === "cat" && view.kind === "cat") {
        const def = grid.level.agents[i];
        if (def.kind === "cat") {
          const left = turnsToKnock(def, st.turn);
          view.view.set(left === 1 ? "ready" : "idle");
          view.status.show(this.copy.status.knock(left), left === 1 ? "#ff9d8a" : "#e9e2ff");
        }
      }
    });
    if (this.clock) {
      this.clock.setCountdown(turnsToCuckoo(grid, st.turn));
      if (st.status !== "playing") this.clock.quiet();
    }
    if (st.status === "playing") this.bruno.setMood(this.moodFor(st));
    this.bruno.setHidden(st.status === "playing" && isHiding(grid, st.x, st.y));
  }

  private moodFor(st: State): BrunoMood {
    const grid = this.sim.grid;
    let near = false;
    let watched = false;
    st.agents.forEach((a, i) => {
      const p = agentPos(grid, i, a);
      const close = Math.abs(p.x - st.x) <= 1 && Math.abs(p.y - st.y) <= 1;
      if (a.kind === "sleeper") {
        if (a.awake > 0) watched = true;
        else if (close) near = true;
      } else if (a.kind === "dog") {
        if (a.mode !== "sleep") watched = true;
        else if (close) near = true;
      } else if (a.kind === "patrol" && (a.alert > 0 || Math.abs(p.x - st.x) + Math.abs(p.y - st.y) <= 3)) watched = true;
    });
    if (near) return "breath";
    if (watched) return "tense";
    return "sneak";
  }

  private refreshOverlays() {
    this.drawLights();
    this.drawForecast();
    const st = this.state;
    this.notebook.setDirs(([0, 1, 2, 3] as Dir[]).map((d) => st.status === "playing" && canMove(this.sim, st, d)));
  }

  private tileRect(g: Phaser.GameObjects.Graphics, idx: number, inset = 0) {
    const L = this.layout;
    const w = this.sim.grid.w;
    const x = idx % w;
    const y = Math.floor(idx / w);
    return { x: L.ox + x * L.tile + inset, y: L.oy + y * L.tile + inset, s: L.tile - inset * 2, g };
  }

  private drawLights() {
    const g = this.lightGfx;
    g.clear();
    for (const eye of this.litEyes) eye.destroy();
    this.litEyes = [];
    const st = this.state;
    const grid = this.sim.grid;
    const L = this.layout;
    const s = L.tile;
    const lit: { x: number; y: number }[] = [];
    const dynamic: DynamicLight[] = [];
    st.agents.forEach((a, i) => {
      const def = grid.level.agents[i];
      if (a.kind === "sleeper") this.lighting.setLamp(def.id, a.awake > 0);
      if (a.kind === "sleeper" && a.awake > 0) {
        const lamp = this.lighting.lampPosition(def.id);
        if (lamp) dynamic.push({ x: lamp.x, y: lamp.y, r: s * 2.2, strength: 0.8 });
      }
      if (a.kind === "patrol") {
        const c = tileCenter(L, a.x, a.y);
        dynamic.push({ x: c.x + DX[a.facing] * s * 1.2, y: c.y + DY[a.facing] * s * 1.2, r: s * 1.7, strength: 0.55 });
      }
      const tiles = watchedTiles(grid, st.agents, i);
      for (const idx of tiles) {
        lit.push({ x: idx % grid.w, y: Math.floor(idx / grid.w) });
        const r = this.tileRect(g, idx, 3);
        g.fillStyle(NIGHT.light, 0.34);
        g.fillRoundedRect(r.x, r.y, r.s, r.s, 10);
        g.lineStyle(4, NIGHT.lightEdge, 0.95);
        g.strokeRoundedRect(r.x, r.y, r.s, r.s, 10);
        if (isHiding(grid, idx % grid.w, Math.floor(idx / grid.w))) continue;
        const span = r.s * 0.31;
        this.litEyes.push(this.add.image(r.x + r.s * 0.2, r.y + r.s * 0.2, iconKey("watched")).setDisplaySize(span, span).setDepth(10));
      }
    });
    const soft: { x: number; y: number }[] = [];
    for (let y = 0; y < grid.h; y += 1) for (let x = 0; x < grid.w; x += 1) if (isCreaky(grid, x, y)) soft.push({ x, y });
    soft.push(grid.goal);
    this.lighting.render(dynamic, lit, soft);
  }

  private drawForecast() {
    const g = this.forecast;
    g.clear();
    this.routeMarks.clear();
    this.watchSpots = [];
    for (const b of this.badges) b.destroy();
    this.badges = [];
    this.ahead = null;
    const st = this.state;
    if (st.status !== "playing") return;
    const grid = this.sim.grid;
    const L = this.layout;
    const s = L.tile;
    const now = new Set<number>();
    st.agents.forEach((_a, i) => watchedTiles(grid, st.agents, i).forEach((t) => now.add(t)));
    this.boardMarks(st);
    const predicted = step(this.sim, st, "wait");
    if (predicted) {
      const calm = step(this.sim, { ...st, agents: st.agents.map((a) => (a.kind === "sleeper" || a.kind === "dog" ? { ...a, stir: 0 } : a)) }, "wait") ?? predicted;
      const nextAgents = calm.state.agents;
      const striped = new Set<number>();
      nextAgents.forEach((_a, i) => watchedTiles(grid, nextAgents, i).forEach((t) => !now.has(t) && striped.add(t)));
      this.ahead = { result: predicted, striped };
      for (const idx of striped) {
        const r = this.tileRect(g, idx, 6);
        g.fillStyle(0xffe39a, 0.07);
        g.fillRoundedRect(r.x, r.y, r.s, r.s, 8);
        g.lineStyle(2.5, 0xffe39a, 0.42);
        for (let k = -3; k <= 3; k += 1) {
          const off = (k * r.s) / 4;
          const x0 = Math.max(r.x, r.x + off);
          const y0 = Math.min(r.y + r.s, r.y + r.s + off);
          const x1 = Math.min(r.x + r.s, r.x + r.s + off);
          const y1 = Math.max(r.y, r.y + off);
          if (x1 > x0) g.lineBetween(x0, y0, x1, y1);
        }
        g.lineStyle(3, 0xffd66b, 0.62);
        g.strokeRoundedRect(r.x, r.y, r.s, r.s, 8);
      }
      st.agents.forEach((a, i) => {
        const b = nextAgents[i];
        if (a.kind === "patrol" && b.kind === "patrol" && (a.x !== b.x || a.y !== b.y)) this.pencilArrow(g, a.x, a.y, b.x, b.y);
      });
    }
    st.agents.forEach((a, i) => {
      const def = grid.level.agents[i];
      if (a.kind === "patrol" && def.kind === "patrol") this.drawRoute(g, this.routeMarks, a, def);
    });
    st.agents.forEach((a, i) => {
      if (a.kind === "dog" && (a.mode === "go" || a.mode === "back")) {
        const def = grid.level.agents[i];
        const target = a.mode === "go" ? { x: a.tx, y: a.ty } : def.kind === "dog" ? { x: def.x, y: def.y } : { x: a.x, y: a.y };
        const path = pathTo(grid, { x: a.x, y: a.y }, target, () => false);
        if (path) {
          let px = a.x;
          let py = a.y;
          for (const p of path) {
            const c0 = tileCenter(L, px, py);
            const c1 = tileCenter(L, p.x, p.y);
            for (let t = 0.15; t < 1; t += 0.28) {
              g.fillStyle(0xf6d7a7, 0.85);
              g.fillCircle(c0.x + (c1.x - c0.x) * t, c0.y + (c1.y - c0.y) * t, s * 0.04);
            }
            px = p.x;
            py = p.y;
          }
          const end = tileCenter(L, target.x, target.y);
          g.lineStyle(3, 0xf6d7a7, 0.9);
          g.strokeCircle(end.x, end.y, s * 0.18);
        }
      }
      const cdef = grid.level.agents[i];
      if (a.kind === "cat" && cdef.kind === "cat" && turnsToKnock(cdef, st.turn) === 1) {
        let maxHear = 0;
        for (const d of grid.level.agents) maxHear = Math.max(maxHear, d.hear);
        const reach = noiseDistances(grid, cdef.x, cdef.y, cdef.loud + maxHear);
        st.agents.forEach((other, j) => {
          if (other.kind === "cat") return;
          const p = agentPos(grid, j, other);
          const dd = reach.get(p.y * grid.w + p.x);
          if (dd === undefined || dd > cdef.loud + grid.level.agents[j].hear) return;
          const c = tileCenter(L, p.x, p.y);
          g.lineStyle(4, 0xffc83d, 0.9);
          g.strokeCircle(c.x, c.y - L.tile * 0.1, L.tile * 0.5);
        });
      }
    });
  }

  private drawRoute(g: Phaser.GameObjects.Graphics, marks: Phaser.GameObjects.Graphics, a: Extract<State["agents"][number], { kind: "patrol" }>, def: Extract<Sim["grid"]["level"]["agents"][number], { kind: "patrol" }>) {
    const L = this.layout;
    const s = L.tile;
    const grid = this.sim.grid;
    let idx = a.idx;
    let alert = a.alert;
    let px = a.x;
    let py = a.y;
    for (let k = 1; k <= ROUTE_PREVIEW; k += 1) {
      let step: { x: number; y: number; f?: Dir; peek?: boolean };
      if (alert > 0) {
        alert -= 1;
        step = { x: px, y: py };
      } else {
        idx = (idx + 1) % def.path.length;
        step = def.path[idx];
      }
      const fade = 1 - (k - 1) * 0.18;
      const c0 = tileCenter(L, px, py);
      const c1 = tileCenter(L, step.x, step.y);
      if (k > 1 && (step.x !== px || step.y !== py)) {
        const ang = Math.atan2(c1.y - c0.y, c1.x - c0.x);
        const nx = -Math.sin(ang);
        const ny = Math.cos(ang);
        [0.36, 0.7].forEach((t, j) => {
          const side = j === 0 ? 1 : -1;
          const fx = c0.x + (c1.x - c0.x) * t + nx * side * s * 0.1;
          const fy = c0.y + (c1.y - c0.y) * t + ny * side * s * 0.1;
          g.fillStyle(0x1d1830, 0.9 * fade);
          g.fillEllipse(fx + 2, fy + 3, s * 0.17, s * 0.12);
          g.fillStyle(0xff8fc8, fade);
          g.fillEllipse(fx, fy, s * 0.15, s * 0.1);
          g.lineStyle(2.5, 0x1d1830, fade);
          g.strokeEllipse(fx, fy, s * 0.15, s * 0.1);
        });
      }
      if (step.f !== undefined) {
        const tx = step.x + DX[step.f];
        const ty = step.y + DY[step.f];
        const t = tileCenter(L, tx, ty);
        const peeking = !!step.peek && isHiding(grid, tx, ty);
        marks.lineStyle(5, 0x1d1830, fade);
        marks.strokeCircle(t.x, t.y, s * 0.36);
        marks.lineStyle(4, peeking ? 0xff6b5a : 0xffe39a, fade);
        marks.strokeCircle(t.x, t.y, s * 0.34);
        this.badges.push(this.add.image(t.x, t.y, iconKey("watched")).setDisplaySize(s * 0.36, s * 0.36).setDepth(36).setAlpha(fade));
        this.watchSpots.push({ x: tx, y: ty });
        const onBruno = tx === this.state.x && ty === this.state.y;
        this.badges.push(this.lookTag(t.x, t.y - s * (onBruno ? 1.02 : 0.46), peeking ? this.copy.status.peek(k) : this.copy.status.look(k), peeking ? 0xff9d8a : 0xffe39a, Math.max(fade, 0.9)));
      }
      px = step.x;
      py = step.y;
    }
  }

  private boardMarks(st: State) {
    const grid = this.sim.grid;
    const L = this.layout;
    const masked = isCuckooTurn(grid, st.turn + 1);
    let maxHear = 0;
    for (const def of grid.level.agents) maxHear = Math.max(maxHear, def.hear);
    for (const d of [0, 1, 2, 3] as Dir[]) {
      if (!canMove(this.sim, st, d)) continue;
      const x = st.x + DX[d];
      const y = st.y + DY[d];
      if (!isCreaky(grid, x, y)) continue;
      let heard = false;
      if (!masked) {
        const reach = noiseDistances(grid, x, y, grid.level.loud + maxHear);
        st.agents.forEach((a, i) => {
          const p = agentPos(grid, i, a);
          const dist = reach.get(p.y * grid.w + p.x);
          if (dist !== undefined && dist <= grid.level.loud + grid.level.agents[i].hear) heard = true;
        });
      }
      const c = tileCenter(L, x, y);
      this.badges.push(this.markBadge(c.x, c.y - L.tile * 0.04, masked ? "safe" : heard ? "wake" : "creak"));
    }
  }

  private lookTag(x: number, y: number, text: string, fill: number, alpha: number) {
    const s = this.layout.tile;
    const label = this.add.text(0, 0, text, { fontFamily: this.bridge.fonts.round ?? this.bridge.fonts.body, fontStyle: "700", fontSize: `${Math.round(Math.max(16, s * 0.15, this.layout.small))}px`, color: "#1d1830", padding: { x: 2, y: 2 } }).setOrigin(0.5);
    const w = label.width + s * 0.16;
    const h = label.height + 2;
    const g = this.add.graphics();
    g.fillStyle(NIGHT.ink, 0.55);
    g.fillRoundedRect(-w / 2 + 3, -h / 2 + 4, w, h, h / 2);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.lineStyle(3, NIGHT.ink, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    return this.add.container(x, y, [g, label]).setDepth(39).setAlpha(alpha);
  }

  private markBadge(x: number, y: number, kind: "safe" | "wake" | "creak") {
    const s = this.layout.tile;
    const r = s * 0.17;
    const ink = NIGHT.ink;
    const fill = kind === "wake" ? 0xff6b5a : kind === "safe" ? 0x9df0dc : 0xd7cdfa;
    const g = this.add.graphics();
    if (kind === "wake") {
      g.lineStyle(Math.max(3, s * 0.025), ink, 1);
      for (const deg of [-165, -135, -45, -15]) {
        const ang = (deg * Math.PI) / 180;
        g.lineBetween(Math.cos(ang) * r * 1.45, Math.sin(ang) * r * 1.45, Math.cos(ang) * r * 1.9, Math.sin(ang) * r * 1.9);
      }
    }
    g.fillStyle(ink, 0.6);
    g.fillCircle(3, 5, r + 3);
    g.fillStyle(ink, 1);
    g.fillCircle(0, 0, r + 3);
    g.fillStyle(fill, 1);
    g.fillCircle(0, 0, r);
    g.fillStyle(0xffffff, 0.55);
    g.fillEllipse(-r * 0.32, -r * 0.5, r * 0.75, r * 0.32);
    g.fillStyle(ink, 1);
    if (kind === "wake") {
      g.fillRoundedRect(-r * 0.17, -r * 0.66, r * 0.34, r * 0.86, r * 0.14);
      g.fillCircle(0, r * 0.5, r * 0.19);
    } else if (kind === "safe") {
      g.fillEllipse(-r * 0.2, r * 0.42, r * 0.56, r * 0.4);
      g.fillRect(r * 0.03, -r * 0.62, r * 0.14, r * 1.04);
      g.fillTriangle(r * 0.17, -r * 0.62, r * 0.6, -r * 0.3, r * 0.17, -r * 0.18);
    } else {
      g.lineStyle(Math.max(3, r * 0.2), ink, 1);
      g.beginPath();
      g.moveTo(-r * 0.62, r * 0.12);
      g.lineTo(-r * 0.32, -r * 0.3);
      g.lineTo(0, r * 0.12);
      g.lineTo(r * 0.32, -r * 0.3);
      g.lineTo(r * 0.62, r * 0.12);
      g.strokePath();
    }
    const c = this.add.container(x, y, [g]).setDepth(39);
    if (!this.bridge.reducedMotion) {
      if (kind === "wake") this.tweens.add({ targets: c, scale: { from: 1, to: 1.12 }, duration: 380, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      else this.tweens.add({ targets: c, y: y - s * 0.04, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    return c;
  }

  private badge(p: { x: number; y: number }, text: string) {
    const L = this.layout;
    const c = tileCenter(L, p.x, p.y);
    const t = this.add
      .text(c.x + L.tile * 0.42, c.y - L.tile * 0.46, text, { fontFamily: this.bridge.fonts.round ?? this.bridge.fonts.body, fontStyle: "700", fontSize: `${Math.round(L.tile * 0.26)}px`, color: "#1d1830", backgroundColor: "#ffe39a", padding: { x: 7, y: 2 } })
      .setOrigin(0.5)
      .setDepth(40);
    this.badges.push(t);
  }

  private pencilArrow(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, y1: number, color = 0xe9e2ff) {
    const L = this.layout;
    const a = tileCenter(L, x0, y0);
    const b = tileCenter(L, x1, y1);
    const s = L.tile;
    const mx = a.x + (b.x - a.x) * 0.25;
    const my = a.y + (b.y - a.y) * 0.25;
    const ex = a.x + (b.x - a.x) * 0.85;
    const ey = a.y + (b.y - a.y) * 0.85;
    g.lineStyle(4, color, 0.9);
    g.lineBetween(mx, my, ex, ey);
    const ang = Math.atan2(ey - my, ex - mx);
    g.lineBetween(ex, ey, ex - Math.cos(ang - 0.5) * s * 0.16, ey - Math.sin(ang - 0.5) * s * 0.16);
    g.lineBetween(ex, ey, ex - Math.cos(ang + 0.5) * s * 0.16, ey - Math.sin(ang + 0.5) * s * 0.16);
  }

  private playCaught(events: SimEvent[]) {
    const st = this.state;
    const L = this.layout;
    const s = L.tile;
    const level = this.sim.grid.level;
    const catcher = this.agents[st.caughtBy];
    const id = level.agents[st.caughtBy]?.id ?? "dad";
    this.flinch = false;
    this.bruno.freeze();
    this.bruno.setMood("scared");
    catcher?.status.show(null);
    if (catcher && st.reason !== "dog") {
      const h = catcher.view.headPoint();
      const bx = this.bruno.container.x;
      const by = this.bruno.container.y - s * 0.2;
      const t = Math.min(0.45, (s * 0.75) / Math.max(1, Math.hypot(bx - h.x, by - h.y)));
      sightLine(this, h.x + (bx - h.x) * t + s * 0.08, h.y + s * 0.35 + (by - h.y - s * 0.35) * t, bx, by, s);
    }
    this.sfx(NIGHT_SFX.caught);
    this.tweens.add({ targets: this.lightsOn, fillAlpha: { from: 0, to: 0.32 }, duration: 160, ease: "Quad.easeOut" });
    if (catcher?.kind === "dad") {
      const a = st.agents[st.caughtBy];
      catcher.view.set("angry", a.kind === "sleeper" ? a.facing : 2);
      catcher.view.shake();
      const p = catcher.view.headPoint();
      this.talk(p.x, p.y - s * 0.3, this.pick(this.copy.lines.dadCatch), "shout", 2600, "dad");
    } else if (catcher?.kind === "grandma") {
      const a = st.agents[st.caughtBy];
      catcher.view.set("shock", a.kind === "patrol" ? a.facing : 2);
      const p = catcher.view.headPoint();
      this.talk(p.x, p.y - s * 0.3, this.pick(this.copy.lines.grandmaCatch), "shout", 2600, "grandma");
    } else if (catcher?.kind === "dog") {
      const a = st.agents[st.caughtBy];
      if (a.kind === "dog") catcher.view.set("happy", this.dirTowards(a.x, a.y, st.x, st.y));
      catcher.view.jump();
      const p = catcher.view.headPoint();
      this.talk(p.x, p.y - s * 0.2, this.pick(this.copy.lines.dogCatch), "shout", 2400, "dog");
      this.sfx(NIGHT_SFX.bark);
    }
    this.time.delayedCall(700, () => {
      if (this.state.status !== "caught") return;
      this.bruno.setMood("caught");
      this.hush();
      const b = this.bruno.container;
      this.talk(b.x, b.y - s * 0.5, this.pick(this.copy.lines.brunoExcuse[id] ?? ["…"]), "normal", 2400, "bruno");
    });
    const byCreak = level.agents[st.caughtBy]?.kind === "sleeper" && events.some((e) => e.type === "creak" && !e.masked);
    this.notebook.showCaught(byCreak ? this.copy.notes.creakCaught : (this.copy.notes.caught[id] ?? ""));
  }

  private dirTowards(x0: number, y0: number, x1: number, y1: number): Dir {
    const dx = x1 - x0;
    const dy = y1 - y0;
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 1 : 3;
    return dy >= 0 ? 2 : 0;
  }

  private playWin() {
    const level = this.sim.grid.level;
    const turns = this.state.turn;
    const got = partStars(level.par, turns, this.hints);
    const L = this.layout;
    const s = L.tile;
    this.bruno.setMood("happy");
    this.bruno.cheer();
    this.sfx(NIGHT_SFX.win);
    for (let i = 0; i < got; i += 1) this.time.delayedCall(260 + i * 240, () => this.sfx(NIGHT_SFX.star, 0.8));
    const line = this.copy.lines.brunoWin[level.id] ?? this.copy.notes.won;
    const b = this.bruno.container;
    this.talk(b.x, b.y - s * 0.5, line, "cheer", 2600, "bruno");
    this.notebook.showWin(turns, level.par, got, this.levelIndex === LEVELS.length - 1, line);
    const st = this.state;
    this.bridge.onWin({ level: level.id, index: this.levelIndex, turns, par: level.par, stars: got, hints: this.hints, moves: encodeMoves(this.actions), wakes: st.wakes, creaks: st.creaks - st.masked, covered: st.masked });
  }

  private clearHint() {
    this.hintLayer.clear();
    this.hintMarks.removeAll(true);
  }

  private undo() {
    if (this.history.length === 0) return;
    this.dropPending();
    this.clearHint();
    this.sfx(NIGHT_SFX.erase);
    const wasCaught = this.state.status === "caught";
    const wasWon = this.state.status === "won";
    this.busy = true;
    this.hush();
    this.notebook.strikeLast(() => {
      this.state = this.history.pop()!;
      this.actions.pop();
      this.busy = false;
      this.tweens.killTweensOf(this.lightsOn);
      this.lightsOn.setFillStyle(0xffe8a0, 0);
      if (wasCaught) this.notebook.clearCaught();
      if (wasWon) this.notebook.clearWin();
      this.bruno.resume();
      const b = tileCenter(this.layout, this.state.x, this.state.y);
      this.bruno.rewind(b.x, b.y, 160);
      this.syncViews(false);
      this.refreshOverlays();
      this.notebook.setPlan(this.actions);
      this.notebook.setStats(this.state.turn, this.hints);
      this.settleNotes(this.copy.notes.undone);
    });
  }

  private restart() {
    if (this.history.length === 0 && this.state.status === "playing") return;
    this.sfx(NIGHT_SFX.erase);
    this.hush();
    this.dropPending();
    this.state = this.sim.initial;
    this.history = [];
    this.actions = [];
    this.busy = false;
    this.clearHint();
    this.tweens.killTweensOf(this.lightsOn);
    this.lightsOn.setFillStyle(0xffe8a0, 0);
    this.notebook.clearCaught();
    this.notebook.clearWin();
    this.bruno.resume();
    this.syncViews(false);
    this.refreshOverlays();
    this.notebook.setPlan([]);
    this.notebook.setStats(0, this.hints);
    this.notebook.clearNotes();
    this.settleNotes(this.copy.notes.restarted);
  }

  private hint() {
    if (this.state.status !== "playing") return;
    const solution = solve(this.sim, this.state);
    this.clearHint();
    if (!solution || solution.actions.length === 0) {
      this.notebook.note(this.copy.notes.noHint, "bad");
      return;
    }
    this.hints += 1;
    this.notebook.setStats(this.state.turn, this.hints);
    this.sfx(NIGHT_SFX.pencil);
    const st = this.state;
    const a = this.calmestStep(st, solution.turns) ?? solution.actions[0];
    const g = this.hintLayer;
    const s = this.layout.tile;
    const c = tileCenter(this.layout, st.x, st.y);
    const r = s * 0.24;
    const badge = (cx: number, cy: number) => {
      g.fillStyle(NIGHT.ink, 0.6);
      g.fillCircle(cx + 3, cy + 4, r);
      g.fillStyle(0xffe39a, 1);
      g.fillCircle(cx, cy, r);
      g.lineStyle(3, NIGHT.ink, 1);
      g.strokeCircle(cx, cy, r);
      g.lineStyle(2.5, 0xffffff, 0.7);
      g.beginPath();
      g.arc(cx, cy, r * 0.72, Math.PI * 1.08, Math.PI * 1.42);
      g.strokePath();
    };
    if (a === "wait") {
      const text = this.copy.notes.hintWait(this.waitsAhead(st, solution.turns));
      this.notebook.note(text, "info");
      this.fleeting = text;
      const cx = c.x + s * 0.46;
      const cy = c.y - s * 0.62;
      badge(cx, cy);
      this.hintMarks.add(this.add.image(cx, cy, iconKey("wait")).setDisplaySize(r * 1.3, r * 1.3));
      return;
    }
    this.notebook.note(this.copy.notes.hint, "info");
    this.fleeting = this.copy.notes.hint;
    const t = tileCenter(this.layout, st.x + DX[a], st.y + DY[a]);
    const cx = t.x;
    const marked = isCreaky(this.sim.grid, st.x + DX[a], st.y + DY[a]);
    const cy = t.y - (marked ? s * 0.42 : a === 0 ? s * 0.16 : s * 0.04);
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(t.x, t.y + s * 0.3, r * 1.6, r * 0.5);
    badge(cx, cy);
    this.hintMarks.add(this.add.image(cx, cy, iconKey(ARROW_ICONS[a])).setDisplaySize(r * 2.1, r * 2.1));
  }

  private waitsAhead(st: State, best: number) {
    let waits = 0;
    let cur = st;
    for (let left = best; left > 1; left -= 1) {
      const next = step(this.sim, cur, "wait");
      if (!next || next.state.status !== "playing" || (solve(this.sim, next.state)?.turns ?? Infinity) + 1 !== left) break;
      waits += 1;
      cur = next.state;
    }
    return Math.max(waits, 1);
  }

  private calmestStep(st: State, best: number): Action | null {
    const last = this.actions[this.actions.length - 1];
    const back = last === undefined || last === "wait" ? null : (((last + 2) % 4) as Dir);
    const order: Action[] = ["wait", ...([0, 1, 2, 3] as Dir[]).filter((d) => d !== back), ...(back === null ? [] : [back])];
    for (const action of order) {
      const next = step(this.sim, st, action);
      if (!next || next.state.status === "caught") continue;
      if (next.state.status === "won" ? best === 1 : (solve(this.sim, next.state)?.turns ?? Infinity) + 1 === best) return action;
    }
    return null;
  }

  private tileAtPointer(p: Phaser.Input.Pointer) {
    const L = this.layout;
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    const x = Math.floor((w.x - L.ox) / L.tile);
    const y = Math.floor((w.y - L.oy) / L.tile);
    if (x < 0 || y < 0 || x >= this.sim.grid.w || y >= this.sim.grid.h) return null;
    return { x, y };
  }

  private onPointerUp(p: Phaser.Input.Pointer) {
    const start = this.pointerStart;
    this.pointerStart = null;
    if (!start) return;
    const chip = this.viewChip?.box;
    if (chip && start.x >= chip.x && start.x <= chip.x + chip.w && start.y >= chip.y && start.y <= chip.y + chip.h) return;
    const L = this.layout;
    const f = L.frame;
    const inFrame = start.x >= f.x && start.x <= f.x + f.w && start.y >= f.y && start.y <= f.y + f.h;
    if (this.story?.open && inFrame) {
      this.story.advance();
      return;
    }
    if (!inFrame) return;
    if (this.overviewOn) {
      this.focusBruno();
      return;
    }
    const dx = p.x - start.x;
    const dy = p.y - start.y;
    if (Math.hypot(dx, dy) > L.tile * 0.4) {
      const cmd = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
      this.command(cmd);
      return;
    }
    const t = this.tileAtPointer(p);
    if (!t) return;
    const st = this.state;
    if (t.x === st.x && t.y === st.y) {
      this.command("wait");
      return;
    }
    const ddx = t.x - st.x;
    const ddy = t.y - st.y;
    if (Math.abs(ddx) + Math.abs(ddy) !== 1) return;
    this.command(ddx === 1 ? "right" : ddx === -1 ? "left" : ddy === 1 ? "down" : "up");
  }

  private onPointerMove(p: Phaser.Input.Pointer) {
    if (this.bridge.touch || p.wasTouch) return;
    this.hover.clear();
    const st = this.state;
    if (!this.sim || st.status !== "playing" || this.busy) return;
    const f = this.layout.frame;
    if (p.x < f.x || p.x > f.x + f.w || p.y < f.y || p.y > f.y + f.h || this.overviewOn) return;
    const t = this.tileAtPointer(p);
    if (!t) return;
    const dx = t.x - st.x;
    const dy = t.y - st.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    this.previewMove(dx === 1 ? 1 : dx === -1 ? 3 : dy === 1 ? 2 : 0);
  }

  private previewMove(dir: Dir | null) {
    this.hover.clear();
    const st = this.state;
    if (dir === null || !this.sim || st.status !== "playing" || !canMove(this.sim, st, dir)) return;
    const t = { x: st.x + DX[dir], y: st.y + DY[dir] };
    const L = this.layout;
    const g = this.hover;
    g.lineStyle(4, 0xe9e2ff, 0.9);
    g.strokeRoundedRect(L.ox + t.x * L.tile + 5, L.oy + t.y * L.tile + 5, L.tile - 10, L.tile - 10, 10);
    const grid = this.sim.grid;
    if (!isCreaky(grid, t.x, t.y) || isCuckooTurn(grid, st.turn + 1)) return;
    let maxHear = 0;
    for (const def of grid.level.agents) maxHear = Math.max(maxHear, def.hear);
    const dist = noiseDistances(grid, t.x, t.y, grid.level.loud);
    g.lineStyle(2, 0xd7cdfa, 0.45);
    for (const [idx] of dist) {
      const r = this.tileRect(g, idx, L.tile * 0.36);
      g.strokeCircle(r.x + r.s / 2, r.y + r.s / 2, r.s / 2);
    }
    const reach = noiseDistances(grid, t.x, t.y, grid.level.loud + maxHear);
    st.agents.forEach((a, i) => {
      const pos = agentPos(grid, i, a);
      const d = reach.get(pos.y * grid.w + pos.x);
      if (d === undefined || d > grid.level.loud + grid.level.agents[i].hear) return;
      const c = tileCenter(L, pos.x, pos.y);
      g.lineStyle(4, 0xffc83d, 0.9);
      g.strokeCircle(c.x, c.y - L.tile * 0.1, L.tile * 0.5);
    });
  }

  private setupCamera() {
    const L = this.layout;
    const cam = this.cameras.main;
    cam.stopFollow();
    this.tweens.killTweensOf(cam);
    cam.setViewport(L.frame.x, L.frame.y, L.frame.w, L.frame.h);
    cam.setBounds(L.board.x, L.board.y, L.board.w, L.board.h);
    cam.setDeadzone(L.frame.w * 0.26, L.frame.h * 0.24);
    cam.setFollowOffset(0, 0);
    cam.setZoom(1);
    this.following = false;
    this.overviewOn = false;
    if (!L.scroll) {
      cam.setScroll(L.frame.x, L.frame.y);
      return;
    }
    this.buildViewChip();
    this.buildIndicators();
    cam.useBounds = false;
    cam.setZoom(L.overview);
    const o = this.overviewCenter();
    cam.centerOn(o.x, o.y);
    this.overviewOn = true;
    this.refreshViewChip();
  }

  private overviewCenter() {
    const L = this.layout;
    const x = L.board.x + L.board.w / 2;
    if (L.kind !== "tall") return { x, y: L.board.y + L.board.h / 2 };
    return { x, y: L.board.y + Math.max(L.board.h, L.frame.h / L.overview) / 2 };
  }

  private followTarget() {
    const L = this.layout;
    const s = L.tile;
    const b = this.bruno.container;
    const f = this.state.facing;
    const half = { w: L.frame.w / 2, h: L.frame.h / 2 };
    const clamp = (v: number, lo: number, hi: number) => (hi < lo ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));
    return {
      x: clamp(b.x + DX[f] * s * 1.1, L.board.x + half.w, L.board.x + L.board.w - half.w),
      y: clamp(b.y - s * 0.3 + DY[f] * s * 0.8, L.board.y + half.h, L.board.y + L.board.h - half.h),
    };
  }

  private focusBruno() {
    const L = this.layout;
    if (!L.scroll || (this.following && !this.overviewOn)) return;
    const cam = this.cameras.main;
    const t = this.followTarget();
    const ms = this.bridge.reducedMotion ? 0 : 650;
    this.overviewOn = false;
    this.refreshViewChip();
    cam.stopFollow();
    cam.useBounds = false;
    const done = () => {
      cam.useBounds = true;
      const f = this.state.facing;
      cam.setFollowOffset(-DX[f] * L.tile * 1.1, L.tile * 0.3 - DY[f] * L.tile * 0.8);
      cam.startFollow(this.bruno.container, false, 0.12, 0.12);
      this.following = true;
    };
    this.following = true;
    if (ms === 0) {
      cam.setZoom(1);
      cam.centerOn(t.x, t.y);
      done();
      return;
    }
    cam.pan(t.x, t.y, ms, "Sine.easeInOut", true);
    cam.zoomTo(1, ms, "Sine.easeInOut", true, (_c: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress >= 1) done();
    });
  }

  private showOverview() {
    const L = this.layout;
    if (!L.scroll) return;
    const cam = this.cameras.main;
    const ms = this.bridge.reducedMotion ? 0 : 550;
    cam.stopFollow();
    cam.useBounds = false;
    this.following = false;
    this.overviewOn = true;
    this.refreshViewChip();
    const { x: cx, y: cy } = this.overviewCenter();
    if (ms === 0) {
      cam.setZoom(L.overview);
      cam.centerOn(cx, cy);
      return;
    }
    cam.pan(cx, cy, ms, "Sine.easeInOut", true);
    cam.zoomTo(L.overview, ms, "Sine.easeInOut", true);
  }

  private buildViewChip() {
    const L = this.layout;
    const size = L.kind === "full" ? 22 : Math.round(13 * L.unit);
    const label = this.ui.add.text(0, 0, "", { fontFamily: this.bridge.fonts.round ?? this.bridge.fonts.body, fontStyle: "700", fontSize: `${size}px`, color: "#1d1830", padding: { x: 2, y: 3 } }).setOrigin(0, 0.5).setDepth(26);
    const icon = this.ui.add.image(0, 0, iconKey("view")).setDisplaySize(size, size).setDepth(26);
    const bg = this.ui.add.graphics().setDepth(25);
    this.viewChip = { box: { x: 0, y: 0, w: 0, h: 0 }, label, icon, size, bg };
    const hit = this.ui.add.zone(0, 0, 10, 10).setOrigin(0).setDepth(27).setInteractive({ useHandCursor: true });
    hit.on("pointerup", () => this.command("view"));
    hit.setData("chip", true);
    this.viewChip.label.setData("hit", hit);
  }

  private refreshViewChip() {
    const chip = this.viewChip;
    if (!chip) return;
    const L = this.layout;
    const view = this.bridge.touch ? this.copy.touch : this.copy.view;
    const text = this.overviewOn ? view.back : view.house;
    chip.label.setText(text);
    chip.icon.setTexture(iconKey(this.overviewOn ? "undo" : "view")).setDisplaySize(chip.size, chip.size);
    const full = L.kind === "full";
    const k = full ? 1 : L.unit;
    const h = full ? 52 : 38 * k;
    const gap = chip.size * 0.3;
    const w = chip.size + gap + chip.label.width + (full ? 40 : 24 * k);
    const x = full ? L.frame.x + 18 : this.chipRight ? L.frame.x + L.frame.w - w - 8 * k : L.frame.x + 8 * k;
    const y = full ? L.frame.y + L.frame.h - h - 18 : L.frame.y + 8 * k;
    const r = full ? 14 : 10 * k;
    chip.box = { x, y, w, h };
    chip.bg.clear();
    chip.bg.fillStyle(0x05030f, 0.55);
    chip.bg.fillRoundedRect(x + (full ? 4 : 2.5 * k), y + (full ? 5 : 3.5 * k), w, h, r);
    chip.bg.fillStyle(this.overviewOn ? 0xffe39a : 0xfbf5e6, 0.96);
    chip.bg.fillRoundedRect(x, y, w, h, r);
    chip.bg.lineStyle(full ? 3 : 2 * k, NIGHT.ink, 1);
    chip.bg.strokeRoundedRect(x, y, w, h, r);
    const left = x + (full ? 20 : 12 * k);
    chip.icon.setPosition(left + chip.size / 2, y + h / 2 - glyphOffset(chip.label));
    chip.label.setPosition(left + chip.size + gap, y + h / 2);
    const hit = chip.label.getData("hit") as Phaser.GameObjects.Zone;
    hit.setPosition(x, y).setSize(w, h);
    hit.input?.hitArea.setTo(0, 0, w, h);
  }

  private buildIndicators() {
    const L = this.layout;
    const grid = this.sim.grid;
    const k = L.ui;
    const size = L.kind === "full" ? 24 : Math.round(12.5 * L.unit);
    const make = (name: string, color: number, target: () => { x: number; y: number }) => {
      const arrow = this.ui.add.graphics();
      const text = this.ui.add.text(0, 0, name, { fontFamily: this.bridge.fonts.display, fontSize: `${size}px`, color: "#1d1830", padding: { x: 3, y: 3 } }).setOrigin(0.5);
      const w = text.width + 26 * k;
      const h = text.height + 8 * k;
      const bg = this.ui.add.graphics();
      bg.fillStyle(0x05030f, 0.5);
      bg.fillRoundedRect(-w / 2 + 3 * k, -h / 2 + 4 * k, w, h, h / 2);
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      bg.lineStyle(3 * k, NIGHT.ink, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      arrow.setData("color", color);
      const root = this.ui.add.container(0, 0, [arrow, bg, text]).setDepth(24).setVisible(false);
      root.setData("w", w).setData("h", h);
      this.indicators.push({ target, root, arrow });
    };
    grid.level.agents.forEach((def, i) => {
      const view = this.agents[i];
      if (!view) return;
      const name = this.copy.names[def.kind === "sleeper" ? "dad" : def.kind === "patrol" ? "grandma" : def.kind === "dog" ? "dog" : "cat"];
      const color = def.kind === "patrol" ? 0xffe39a : def.kind === "dog" ? 0xffc89a : def.kind === "cat" ? 0xd9ccff : 0xb9e3ff;
      make(name, color, () => ({ x: view.view.container.x, y: view.view.container.y - L.tile * 0.3 }));
    });
    const g = tileCenter(L, grid.goal.x, grid.goal.y);
    make(this.copy.levels[grid.level.id]?.target ?? "", 0x9df0dc, () => g);
  }

  private toScreen(b: Box): Box {
    const cam = this.cameras.main;
    const v = cam.worldView;
    return { x: cam.x + (b.x - v.x) * cam.zoom, y: cam.y + (b.y - v.y) * cam.zoom, w: b.w * cam.zoom, h: b.h * cam.zoom };
  }

  private depthAt(y: number) {
    const b = this.layout.board;
    return 31 + 2.9 * Phaser.Math.Clamp((y - b.y) / b.h, 0, 1);
  }

  private hideDepth(row: number) {
    return this.depthAt(tileCenter(this.layout, 0, row).y + this.layout.tile * 0.5) - 0.005;
  }

  private sortActors() {
    for (const a of this.agents) a.view.container.setDepth(this.depthAt(a.view.container.y + (a.lift ?? 0)));
    this.bruno.container.setDepth(this.depthAt(this.bruno.container.y) + 0.01);
  }

  private dodgeChip() {
    const chip = this.viewChip;
    if (!chip || this.layout.kind === "full") return;
    const s = this.layout.tile;
    const b = this.bruno.container;
    const bruno = this.toScreen({ x: b.x - s * 0.5, y: b.y - s * 1.15, w: s, h: s * 1.5 });
    const covers = (c: Box) => c.x < bruno.x + bruno.w && c.x + c.w > bruno.x && c.y < bruno.y + bruno.h && c.y + c.h > bruno.y;
    if (!covers(chip.box)) return;
    const f = this.layout.frame;
    const other = { ...chip.box, x: this.chipRight ? f.x + 8 * this.layout.unit : f.x + f.w - chip.box.w - 8 * this.layout.unit };
    if (covers(other)) return;
    this.chipRight = !this.chipRight;
    this.refreshViewChip();
  }

  update() {
    if (this.layout && this.bruno) this.sortActors();
    if (!this.layout?.scroll || !this.bruno) return;
    this.dodgeChip();
    const cam = this.cameras.main;
    const L = this.layout;
    if (this.following && !this.overviewOn) {
      const f = this.state.facing;
      const tx = -DX[f] * L.tile * 1.1;
      const ty = L.tile * 0.3 - DY[f] * L.tile * 0.8;
      cam.followOffset.x += (tx - cam.followOffset.x) * 0.06;
      cam.followOffset.y += (ty - cam.followOffset.y) * 0.06;
    }
    const v = cam.worldView;
    const f = L.frame;
    const ui = L.ui;
    const inset = 30 * ui;
    const cx = f.x + f.w / 2;
    const cy = f.y + f.h / 2;
    for (const ind of this.indicators) {
      const p = ind.target();
      const margin = -L.tile * 0.45;
      const visible = this.overviewOn || (p.x > v.x + margin && p.x < v.x + v.width - margin && p.y > v.y + margin && p.y < v.y + v.height - margin);
      ind.root.setVisible(!visible);
      if (visible) continue;
      const sx = cam.x + (p.x - v.x) * cam.zoom;
      const sy = cam.y + (p.y - v.y) * cam.zoom;
      const dx = sx - cx;
      const dy = sy - cy;
      const iw = (ind.root.getData("w") as number) / 2 + inset + 16 * ui;
      const ih = (ind.root.getData("h") as number) / 2 + inset + 16 * ui;
      const kx = dx === 0 ? Infinity : (f.w / 2 - iw) / Math.abs(dx);
      const ky = dy === 0 ? Infinity : (f.h / 2 - ih) / Math.abs(dy);
      const k = Math.min(kx, ky, 1);
      ind.root.setPosition(cx + dx * k, cy + dy * k);
      const ang = Math.atan2(dy, dx);
      const w = ind.root.getData("w") as number;
      const h = ind.root.getData("h") as number;
      const r = Math.min(w, h * 2.2) / 2 + 6 * ui;
      const a = ind.arrow;
      a.clear();
      a.fillStyle(NIGHT.ink, 0.6);
      const tip = { x: Math.cos(ang) * (r + 30 * ui), y: Math.sin(ang) * (h / 2 + 30 * ui) };
      const side = 0.42;
      const base = (sign: number, grow: number) => ({ x: Math.cos(ang + sign * side) * (r - 4 * ui), y: Math.sin(ang + sign * side) * (h / 2 + grow) });
      const b1 = base(-1, 6 * ui);
      const b2 = base(1, 6 * ui);
      a.fillTriangle(tip.x + 2 * ui, tip.y + 3 * ui, b1.x + 2 * ui, b1.y + 3 * ui, b2.x + 2 * ui, b2.y + 3 * ui);
      a.fillStyle(ind.arrow.getData("color") as number, 1);
      a.fillTriangle(tip.x, tip.y, b1.x, b1.y, b2.x, b2.y);
      a.lineStyle(3 * ui, NIGHT.ink, 1);
      a.strokeTriangle(tip.x, tip.y, b1.x, b1.y, b2.x, b2.y);
    }
  }

  private ambientTick() {
    const L = this.layout;
    const s = L.tile;
    const fonts = this.bridge.fonts;
    const st = this.state;
    st.agents.forEach((a, i) => {
      const view = this.agents[i];
      if (a.kind === "sleeper" && a.awake === 0 && view.kind === "dad" && st.status !== "caught") {
        const p = view.view.headPoint();
        floatZ(this, fonts, p.x + s * 0.2, p.y, Math.round(s * 0.26));
        if (Math.random() < 0.35) this.sfx(NIGHT_SFX.snore, 0.5);
        if (this.time.now - this.lastBubble > 9000 && Math.random() < 0.12) {
          this.lastBubble = this.time.now;
          this.talk(p.x, p.y - s * 0.3, this.pick(this.copy.lines.dadSleep), "whisper", 1800, "dad");
        }
      }
      if (a.kind === "dog" && a.mode === "sleep" && view.kind === "dog" && Math.random() < 0.6) {
        const p = view.view.headPoint();
        floatZ(this, fonts, p.x + s * 0.1, p.y + s * 0.1, Math.round(s * 0.2));
      }
    });
    if (st.status === "playing" && Math.random() < 0.3) this.sfx(NIGHT_SFX.cricket, 0.7 + Math.random() * 0.5, 0.94 + Math.random() * 0.12);
    if (st.status === "playing" && Math.random() < 0.025) this.sfx(NIGHT_SFX.carPass);
    if (st.status === "playing" && Math.random() < 0.45) this.bruno.blink();
    if (st.status === "playing" && this.time.now - this.lastInput > 3000 && Math.random() < 0.3) this.bruno.glance(Math.random() < 0.5 ? -1 : 1);
    st.agents.forEach((a, i) => {
      const view = this.agents[i];
      const p = agentPos(this.sim.grid, i, a);
      if (a.kind === "dog" && a.mode === "sleep" && view.kind === "dog" && Math.abs(p.x - st.x) + Math.abs(p.y - st.y) <= 3 && Math.random() < 0.4) view.view.twitch();
    });
    if (st.status === "playing" && this.time.now - this.lastInput > 7000 && Math.random() < 0.3) {
      const b = this.bruno.container;
      this.talk(b.x, b.y - s * 0.5, this.pick(this.copy.lines.brunoThink), "thought", 1600, "bruno");
      this.lastInput = this.time.now;
    }
  }
}
