import * as Phaser from "phaser";
import { getAudio } from "@/lib/audio/engine";
import type { SoundRecipe } from "@/lib/audio/types";
import type { Fonts } from "@/games/kit/ui";
import type { Locale } from "@/i18n/locales";
import { NIGHT_COPY, type NightCopy } from "../copy";
import { isCreaky, noiseDistances, pathTo } from "../sim/grid";
import { LEVELS } from "../sim/levels";
import { agentPos, canMove, createSim, isCuckooTurn, replay, stars, stateKey, step, turnsToCuckoo, watchedTiles, type Sim } from "../sim/sim";
import { solve } from "../sim/solver";
import { DX, DY, type Action, type Dir, type SimEvent, type State } from "../sim/types";
import { NIGHT_SFX } from "../sounds";
import { BrunoView, ClockView, DadView, DogView, GrandmaView, StatusIcon, type BrunoMood } from "./actors";
import { decorFor, drawFloorDecor, drawTopDecor, drawWallDecor } from "./decor";
import { NightLighting, type DynamicLight } from "./lighting";
import { floatZ, noiseRing, pop, say, sightLine, soundLine, squiggle, type BubbleTone } from "./fx";
import { drawCreakMarks, drawCreaks, drawFloor, drawGoal, drawProps, drawWalls, NIGHT, themeFor } from "./house";
import { computeLayout, tileCenter, type Layout, type Orientation } from "./layout";
import { Notebook, type ButtonId, type LegendItem } from "./notebook";

export type WinReport = { level: string; turns: number; par: number; stars: number; hints: number; replayOk: boolean };

export type NightBridge = {
  locale: Locale;
  fonts: Fonts;
  reducedMotion: boolean;
  orientation: Orientation;
  touch: boolean;
  level: number;
  progress: { load: () => Record<string, number>; save: (id: string, turns: number, stars: number) => void };
  onLevel: (index: number) => void;
  onWin: (report: WinReport) => void;
};

export type Command = "up" | "right" | "down" | "left" | "wait" | "undo" | "restart" | "hint" | "next" | "again" | `level:${number}`;

type AgentView = ({ kind: "dad"; view: DadView } | { kind: "grandma"; view: GrandmaView } | { kind: "dog"; view: DogView }) & { status: StatusIcon };

const CHAR_SCALE = 1.14;

const MOVE_MS = 190;
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
  private queued: Command | null = null;
  private bruno!: BrunoView;
  private agents: AgentView[] = [];
  private clock: ClockView | null = null;
  private notebook!: Notebook;
  private lightGfx!: Phaser.GameObjects.Graphics;
  private forecast!: Phaser.GameObjects.Graphics;
  private hover!: Phaser.GameObjects.Graphics;
  private hintLayer!: Phaser.GameObjects.Graphics;
  private badges: Phaser.GameObjects.Text[] = [];
  private lightsOn!: Phaser.GameObjects.Rectangle;
  private lighting!: NightLighting;
  private ambient?: Phaser.Time.TimerEvent;
  private lineIndex = 0;
  private lastBubble = 0;
  private lastInput = 0;
  private pointerStart: { x: number; y: number } | null = null;
  private wasBreathing = false;
  private flinch = false;
  private bubbles: Phaser.GameObjects.Container[] = [];

  constructor() {
    super("night");
  }

  create() {
    this.bridge = this.registry.get("bridge") as NightBridge;
    this.copy = NIGHT_COPY[this.bridge.locale];
    this.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, this.bridge.level));
    this.cameras.main.setBackgroundColor("#0d0a1c");
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.pointerStart = { x: p.x, y: p.y };
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.loadLevel(this.levelIndex);
  }

  private sfx(recipe: SoundRecipe, volume = 1) {
    getAudio().play(recipe, { volume });
  }

  private loadLevel(index: number) {
    this.levelIndex = index;
    this.bridge.onLevel(index);
    const level = LEVELS[index];
    this.sim = createSim(level);
    this.layout = computeLayout(this.bridge.orientation, this.sim.grid);
    this.ambient?.remove();
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.children.removeAll(true);
    this.agents = [];
    this.clock = null;
    this.badges = [];
    this.history = [];
    this.actions = [];
    this.hints = 0;
    this.busy = false;
    this.queued = null;
    this.state = this.sim.initial;
    const grid = this.sim.grid;
    const L = this.layout;
    const s = L.tile;
    const theme = themeFor(level.id);
    const decor = decorFor(level.id);
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
    this.lighting = new NightLighting(this, L, decor.lights, decor.darkness, decor.lamps);
    const marks = this.add.graphics().setDepth(7);
    drawCreakMarks(marks, grid, L);
    const goal = this.add.graphics().setDepth(8);
    drawGoal(goal, grid, L);
    this.tweens.add({ targets: goal, alpha: { from: 1, to: 0.55 }, duration: 900, yoyo: true, repeat: -1 });
    const target = this.copy.levels[level.id]?.target ?? "";
    const goalC = tileCenter(L, grid.goal.x, grid.goal.y);
    this.add
      .text(goalC.x, goalC.y + s * 0.18, target, { fontFamily: this.bridge.fonts.hand, fontSize: `${Math.round(Math.max(26, s * 0.26))}px`, color: "#9df0dc", stroke: "#1d1830", strokeThickness: 6, padding: { x: 2, y: 2 } })
      .setOrigin(0.5, 0)
      .setDepth(21);
    if (level.id === "living") this.vcrClock(L);
    this.lightGfx = this.add.graphics().setDepth(10);
    this.forecast = this.add.graphics().setDepth(12);
    this.hover = this.add.graphics().setDepth(13);
    this.hintLayer = this.add.graphics().setDepth(14);
    this.drawFrame();
    this.lightsOn = this.add.rectangle(L.board.x, L.board.y, L.board.w, L.board.h, 0xffe8a0, 0).setOrigin(0).setDepth(45);
    const iconSize = Math.max(30, s * 0.34);
    level.agents.forEach((def, i) => {
      const c = tileCenter(L, ...this.xy(agentPos(grid, i, this.state.agents[i])));
      if (def.kind === "sleeper") {
        const onBed = level.props.some((p) => p.kind === "bed" && p.x === def.x && def.y >= p.y && def.y < p.y + (p.h ?? 1));
        const view = new DadView(this, s, onBed ? "bed" : "armchair");
        view.container.setPosition(c.x, c.y).setScale(CHAR_SCALE * 0.94);
        this.agents.push({ kind: "dad", view, status: new StatusIcon(this, view.container, this.bridge.fonts.display, iconSize, onBed ? -s * 1.1 : -s * 0.62) });
      } else if (def.kind === "patrol") {
        const view = new GrandmaView(this, s, def.range * s);
        view.container.setPosition(c.x, c.y).setScale(CHAR_SCALE);
        this.agents.push({ kind: "grandma", view, status: new StatusIcon(this, view.container, this.bridge.fonts.display, iconSize, -s * 0.66) });
      } else {
        const view = new DogView(this, s);
        view.container.setPosition(c.x, c.y).setScale(CHAR_SCALE);
        this.agents.push({ kind: "dog", view, status: new StatusIcon(this, view.container, this.bridge.fonts.display, iconSize, -s * 0.5) });
      }
    });
    if (level.clock) {
      this.clock = new ClockView(this, s, this.bridge.fonts.display, this.copy.lines.now);
      const c = tileCenter(L, level.clock.x, level.clock.y);
      this.clock.container.setPosition(c.x, c.y - s * 0.02);
    }
    this.bruno = new BrunoView(this, s);
    this.bruno.container.setScale(CHAR_SCALE);
    const b = tileCenter(L, this.state.x, this.state.y);
    this.bruno.place(b.x, b.y);
    this.notebook = new Notebook(
      this,
      L,
      this.bridge.fonts,
      this.copy,
      (id) => this.onButton(id),
      (i) => this.command(`level:${i}`),
    );
    const progress = this.bridge.progress.load();
    const text = this.copy.levels[level.id];
    this.notebook.setLevel(index, LEVELS.length, text.title, text.goal, level.par, LEVELS.map((l) => progress[l.id] ?? 0), this.legendFor());
    this.notebook.setStats(0, 0);
    this.time.delayedCall(250, () => this.notebook.getMode() === "play" && this.history.length === 0 && this.notebook.intro(text.intro));
    this.syncViews(false);
    this.refreshOverlays();
    this.ambient = this.time.addEvent({ delay: 1400, loop: true, callback: () => this.ambientTick() });
    if (this.lighting.hasFlicker() && !this.bridge.reducedMotion) this.time.addEvent({ delay: 140, loop: true, callback: () => this.lighting.flicker() });
    this.lastInput = this.time.now;
  }

  private drawFrame() {
    const L = this.layout;
    const b = L.board;
    const g = this.add.graphics().setDepth(22);
    g.fillStyle(NIGHT.void, 1);
    g.fillRect(0, 0, L.W, b.y);
    g.fillRect(0, b.y + b.h, L.W, L.H - b.y - b.h);
    g.fillRect(0, b.y, b.x, b.h);
    g.fillRect(b.x + b.w, b.y, L.W - b.x - b.w, b.h);
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(b.x + 7, b.y + b.h - 4, b.w, 12, 6);
    g.lineStyle(7, NIGHT.ink, 1);
    g.strokeRoundedRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6, 14);
    g.lineStyle(2, 0x5a4a8a, 0.9);
    g.strokeRoundedRect(b.x - 9, b.y - 9, b.w + 18, b.h + 18, 18);
    const v = this.add.graphics().setDepth(21.5);
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
    if (level.agents.some((a) => a.kind === "dog")) items.push("dog");
    return items;
  }

  command(cmd: Command) {
    this.lastInput = this.time.now;
    if (cmd.startsWith("level:")) {
      const i = Number(cmd.slice(6));
      if (Number.isInteger(i) && i >= 0 && i < LEVELS.length) this.loadLevel(i);
      return;
    }
    if (this.busy) {
      if (cmd === "undo" || cmd === "restart") {
        this.busy = false;
      } else {
        this.queued = cmd;
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
        if (this.state.status === "won" && this.levelIndex < LEVELS.length - 1) this.loadLevel(this.levelIndex + 1);
        return;
      case "again":
        if (this.state.status === "won") this.restart();
        return;
      case "wait":
        this.act("wait");
        return;
      default:
        this.act(DIRS[cmd as keyof typeof DIRS]);
    }
  }

  private onButton(id: ButtonId) {
    if (id === "undoCaught") this.command("undo");
    else this.command(id);
  }

  private act(action: Action) {
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
    this.hintLayer.clear();
    this.hover.clear();
    this.history.push(this.state);
    this.actions.push(action);
    const prev = this.state;
    this.state = result.state;
    this.busy = true;
    this.playEvents(prev, result.events);
    this.notebook.setPlan(this.actions);
    this.notebook.setStats(this.state.turn, this.hints);
    this.time.delayedCall(MOVE_MS + 30, () => this.afterTurn(prev, result.events));
  }

  private flashUndo() {
    this.tweens.add({ targets: this.notebook.container, x: this.notebook.container.x + 6, duration: 50, yoyo: true, repeat: 3 });
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
          this.sfx(NIGHT_SFX.step, 0.6);
          break;
        }
        case "wait":
          this.sfx(NIGHT_SFX.tick, 0.8);
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
          if (before.kind === "sleeper" && before.awake === 0) {
            this.talk(p.x, p.y - s * 0.35, this.pick(this.copy.lines.dadWake), "normal", 1300);
          }
          this.sfx(NIGHT_SFX.wake);
          break;
        }
        case "alert": {
          const a = this.agents[e.agent];
          if (a.kind !== "grandma") break;
          const p = a.view.headPoint();
          pop(this, fonts, p.x, p.y - s * 0.1, "?", Math.round(s * 0.6));
          this.talk(p.x, p.y - s * 0.35, this.copy.lines.grandmaAlert, "normal", 1300);
          this.sfx(NIGHT_SFX.alert);
          break;
        }
        case "sleep": {
          const a = this.agents[e.agent];
          if (a.kind !== "dad") break;
          const p = a.view.headPoint();
          this.time.delayedCall(MOVE_MS, () => this.talk(p.x, p.y - s * 0.3, this.pick(this.copy.lines.dadSleepAgain), "whisper", 1400));
          this.sfx(NIGHT_SFX.sleep, 0.7);
          break;
        }
        case "resume": {
          const a = this.agents[e.agent];
          if (a.kind !== "grandma") break;
          const p = a.view.headPoint();
          this.talk(p.x, p.y - s * 0.35, this.pick(this.copy.lines.grandmaResume), "thought", 1300);
          break;
        }
        case "agentMove": {
          const a = this.agents[e.agent];
          const c = tileCenter(L, e.to.x, e.to.y);
          if (a.kind === "grandma") {
            a.view.walkTo(c.x, c.y, MOVE_MS + 40);
            if (this.time.now - this.lastBubble > 5000 && Math.random() < 0.18) {
              this.lastBubble = this.time.now;
              this.time.delayedCall(MOVE_MS, () => this.talk(c.x, c.y - s * 0.75, this.pick(this.copy.lines.grandmaWalk), "whisper", 1500));
            }
          } else if (a.kind === "dog") a.view.trotTo(c.x, c.y, MOVE_MS);
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
        case "dogHome":
          break;
        case "caught":
        case "won":
        case "turnAround":
          break;
      }
    }
    if (masked) this.time.delayedCall(80, () => this.clock && pop(this, fonts, this.clock.container.x + s * 0.5, this.clock.container.y - s * 0.4, "♪", Math.round(s * 0.4), "#ffe39a"));
  }

  private talk(x: number, y: number, text: string, tone: BubbleTone, duration: number) {
    this.bubbles = this.bubbles.filter((b) => b.active);
    const bubble = say(this, this.layout, this.bridge.fonts, x, y, text, tone, duration);
    this.bubbles.push(bubble);
    return bubble;
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
    this.busy = false;
    this.syncViews(true);
    this.refreshOverlays();
    if (this.state.status === "caught") {
      this.playCaught(events);
      return;
    }
    if (this.state.status === "won") {
      this.playWin();
      return;
    }
    this.turnNote(prev, events);
    if (this.flinch) {
      this.flinch = false;
      this.bruno.setMood("scared");
      this.time.delayedCall(650, () => this.state.status === "playing" && this.bruno.setMood(this.moodFor(this.state)));
    }
    const next = this.queued;
    this.queued = null;
    if (next) this.command(next);
  }

  private turnNote(prev: State, events: SimEvent[]) {
    const n = this.copy.notes;
    const nb = this.notebook;
    const creak = events.find((e) => e.type === "creak");
    const heard = events.filter((e) => e.type === "heard");
    const level = this.sim.grid.level;
    if (creak && creak.type === "creak") {
      if (creak.masked) nb.note(n.masked, "good");
      else if (heard.length === 0) nb.note(n.unheard, "info");
    }
    for (const e of heard) {
      if (e.type !== "heard") continue;
      const kind = level.agents[e.agent].kind;
      if (kind === "dog") nb.note(n.wokeDog, "warn");
      else if (kind === "sleeper") nb.note(n.woke, "warn");
      else nb.note(n.grandmaStopped, "warn");
    }
    if (events.some((e) => e.type === "sleep")) nb.note(n.backToSleep, "good");
    if (events.some((e) => e.type === "resume")) nb.note(n.grandmaBack, "info");
    if (events.some((e) => e.type === "dogArrive")) nb.note(n.dogSniff, "good");
    if (events.some((e) => e.type === "dogHome")) nb.note(n.dogHome, "info");
    this.state.agents.forEach((a, i) => {
      const before = prev.agents[i];
      if (a.kind === "dog" && before.kind === "dog") {
        if (a.mode === "go" && before.mode === "go" && !heard.length) nb.note(n.dogGoing, "good");
        if (a.mode === "back" && before.mode === "sniff") nb.note(n.dogBack, "warn");
      }
      if (a.kind === "sleeper" && a.awake > 0 && !heard.some((h) => h.type === "heard" && h.agent === i)) nb.note(n.stillAwake(a.awake), "warn");
    });
    if (level.clock && turnsToCuckoo(this.sim.grid, this.state.turn) === 1) {
      const board = ([0, 1, 2, 3] as Dir[]).some((d) => canMove(this.sim, this.state, d) && isCreaky(this.sim.grid, this.state.x + DX[d], this.state.y + DY[d]));
      nb.note(board ? n.stepNow : n.cuckooSoon, board ? "good" : "warn");
    }
    const breathing = this.bruno.getMood() === "breath";
    if (breathing && !this.wasBreathing) {
      nb.note(n.holdBreath, "info");
      this.mumbleNearby();
    }
    this.wasBreathing = breathing;
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
        view.view.shake();
        this.talk(h.x, h.y - s * 0.3, this.pick(this.copy.lines.dadSleep), "whisper", 1600);
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
        view.view.set(a.awake > 0 ? "awake" : "sleep", a.facing);
        view.status.show(a.awake > 0 ? "!" : null, "#ff9d8a");
      } else if (a.kind === "patrol" && view.kind === "grandma") {
        view.view.set(a.alert > 0 ? "alert" : "walk", a.facing);
        view.status.show(a.alert > 0 ? "?" : null, "#ffe39a");
        if (!animate) {
          this.tweens.killTweensOf(view.view.container);
          view.view.container.setPosition(c.x, c.y);
        }
      } else if (a.kind === "dog" && view.kind === "dog") {
        view.view.set(a.mode === "sleep" ? "sleep" : a.mode === "sniff" ? "sniff" : "walk", a.facing);
        view.status.show(a.mode === "sleep" ? null : a.mode === "sniff" ? "?" : "!", "#ffc89a");
        if (!animate) view.view.place(c.x, c.y);
      }
    });
    if (this.clock) {
      this.clock.setCountdown(turnsToCuckoo(grid, st.turn));
      if (st.status !== "playing") this.clock.quiet();
    }
    if (st.status === "playing") this.bruno.setMood(this.moodFor(st));
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
      } else if (a.alert > 0 || Math.abs(p.x - st.x) + Math.abs(p.y - st.y) <= 3) watched = true;
    });
    if (near) return "breath";
    if (watched) return "tense";
    return "sneak";
  }

  private refreshOverlays() {
    this.drawLights();
    this.drawForecast();
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
        const ex = r.x + r.s * 0.2;
        const ey = r.y + r.s * 0.2;
        const ew = r.s * 0.13;
        g.fillStyle(0xfffbe8, 0.95);
        g.fillEllipse(ex, ey, ew * 2, ew * 1.15);
        g.lineStyle(2.5, 0xb8690c, 1);
        g.strokeEllipse(ex, ey, ew * 2, ew * 1.15);
        g.fillStyle(0x1d1830, 1);
        g.fillCircle(ex, ey, ew * 0.38);
      }
    });
    this.lighting.render(dynamic, lit);
  }

  private drawForecast() {
    const g = this.forecast;
    g.clear();
    for (const b of this.badges) b.destroy();
    this.badges = [];
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
      const nextAgents = predicted.state.agents;
      const next = new Set<number>();
      nextAgents.forEach((_a, i) => watchedTiles(grid, nextAgents, i).forEach((t) => next.add(t)));
      for (const idx of next) {
        if (now.has(idx)) continue;
        const r = this.tileRect(g, idx, 6);
        g.lineStyle(2.5, 0xe9e2ff, 0.55);
        for (let k = -3; k <= 3; k += 1) {
          const off = (k * r.s) / 4;
          const x0 = Math.max(r.x, r.x + off);
          const y0 = Math.min(r.y + r.s, r.y + r.s + off);
          const x1 = Math.min(r.x + r.s, r.x + r.s + off);
          const y1 = Math.max(r.y, r.y + off);
          if (x1 > x0) g.lineBetween(x0, y0, x1, y1);
        }
        g.lineStyle(2.5, 0xe9e2ff, 0.7);
        g.strokeRoundedRect(r.x, r.y, r.s, r.s, 8);
      }
      st.agents.forEach((a, i) => {
        const b = nextAgents[i];
        if (a.kind === "patrol" && b.kind === "patrol" && (a.x !== b.x || a.y !== b.y)) this.pencilArrow(g, a.x, a.y, b.x, b.y);
      });
    }
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
      if (a.kind === "dog" && a.mode === "sniff") this.badge(agentPos(grid, i, a), String(a.timer));
      if (a.kind === "sleeper" && a.awake > 0) this.badge(agentPos(grid, i, a), String(a.awake));
      if (a.kind === "patrol" && a.alert > 0) this.badge({ x: a.x, y: a.y }, String(a.alert));
    });
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
      const label = masked ? "♪" : heard ? "!" : "~";
      const bg = masked ? "#9df0dc" : heard ? "#ff9d8a" : "#d7cdfa";
      const t = this.add
        .text(c.x, c.y, label, { fontFamily: this.bridge.fonts.display, fontSize: `${Math.round(L.tile * 0.28)}px`, color: "#1d1830", backgroundColor: bg, padding: { x: 8, y: 2 } })
        .setOrigin(0.5)
        .setDepth(39)
        .setAlpha(0.95);
      this.badges.push(t);
    }
  }

  private badge(p: { x: number; y: number }, text: string) {
    const L = this.layout;
    const c = tileCenter(L, p.x, p.y);
    const t = this.add
      .text(c.x + L.tile * 0.42, c.y - L.tile * 0.46, text, { fontFamily: this.bridge.fonts.hand, fontSize: `${Math.round(L.tile * 0.3)}px`, color: "#1d1830", backgroundColor: "#ffe39a", padding: { x: 7, y: 1 } })
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
    if (catcher && st.reason !== "dog") {
      const h = catcher.view.headPoint();
      sightLine(this, h.x, h.y, this.bruno.container.x, this.bruno.container.y - s * 0.2, s);
    }
    this.sfx(NIGHT_SFX.caught);
    this.tweens.add({ targets: this.lightsOn, fillAlpha: { from: 0, to: 0.32 }, duration: 160, ease: "Quad.easeOut" });
    if (catcher?.kind === "dad") {
      const a = st.agents[st.caughtBy];
      catcher.view.set("angry", a.kind === "sleeper" ? a.facing : 2);
      catcher.view.shake();
      const p = catcher.view.headPoint();
      this.talk(p.x, p.y - s * 0.3, this.copy.lines.dadCatch, "shout", 2600);
    } else if (catcher?.kind === "grandma") {
      const a = st.agents[st.caughtBy];
      catcher.view.set("shock", a.kind === "patrol" ? a.facing : 2);
      const p = catcher.view.headPoint();
      this.talk(p.x, p.y - s * 0.3, this.copy.lines.grandmaCatch, "shout", 2600);
    } else if (catcher?.kind === "dog") {
      const a = st.agents[st.caughtBy];
      if (a.kind === "dog") catcher.view.set("happy", this.dirTowards(a.x, a.y, st.x, st.y));
      catcher.view.jump();
      const p = catcher.view.headPoint();
      this.talk(p.x, p.y - s * 0.2, this.copy.lines.dogCatch, "shout", 2400);
      this.sfx(NIGHT_SFX.bark);
    }
    this.time.delayedCall(700, () => {
      if (this.state.status !== "caught") return;
      this.bruno.setMood("caught");
      const b = this.bruno.container;
      this.talk(b.x, b.y - s * 0.5, this.copy.lines.brunoExcuse[id] ?? "…", "normal", 2400);
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
    const got = stars(level.par, turns);
    const L = this.layout;
    const s = L.tile;
    this.bruno.setMood("happy");
    this.bruno.cheer();
    this.sfx(NIGHT_SFX.win);
    for (let i = 0; i < got; i += 1) this.time.delayedCall(260 + i * 240, () => this.sfx(NIGHT_SFX.star, 0.8));
    const line = this.copy.lines.brunoWin[level.id] ?? this.copy.notes.won;
    const b = this.bruno.container;
    this.talk(b.x, b.y - s * 0.5, line, "normal", 2600);
    this.notebook.showWin(turns, level.par, got, this.levelIndex === LEVELS.length - 1, line);
    this.bridge.progress.save(level.id, turns, got);
    const replayed = replay(level, this.actions);
    const replayOk = !!replayed && replayed.status === "won" && replayed.turn === turns && stateKey(this.sim, replayed) === stateKey(this.sim, this.state);
    this.bridge.onWin({ level: level.id, turns, par: level.par, stars: got, hints: this.hints, replayOk });
  }

  private undo() {
    if (this.history.length === 0) return;
    this.hintLayer.clear();
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
      this.notebook.note(this.copy.notes.undone, "info");
    });
  }

  private restart() {
    if (this.history.length === 0 && this.state.status === "playing") return;
    this.sfx(NIGHT_SFX.erase);
    this.hush();
    this.state = this.sim.initial;
    this.history = [];
    this.actions = [];
    this.hints = 0;
    this.busy = false;
    this.queued = null;
    this.hintLayer.clear();
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
    this.notebook.note(this.copy.notes.restarted, "info");
  }

  private hint() {
    if (this.state.status !== "playing") return;
    const solution = solve(this.sim, this.state);
    this.hintLayer.clear();
    if (!solution || solution.actions.length === 0) {
      this.notebook.note(this.copy.notes.noHint, "bad");
      return;
    }
    this.hints += 1;
    this.notebook.setStats(this.state.turn, this.hints);
    this.notebook.note(this.copy.notes.hint, "info");
    this.sfx(NIGHT_SFX.pencil);
    const a = solution.actions[0];
    const st = this.state;
    if (a === "wait") {
      const c = tileCenter(this.layout, st.x, st.y);
      this.hintLayer.lineStyle(4, 0xffe39a, 1);
      this.hintLayer.strokeCircle(c.x, c.y, this.layout.tile * 0.46);
      pop(this, this.bridge.fonts, c.x, c.y - this.layout.tile * 0.7, this.copy.buttons.wait, Math.round(this.layout.tile * 0.3), "#ffe39a");
    } else {
      this.pencilArrow(this.hintLayer, st.x, st.y, st.x + DX[a], st.y + DY[a], 0xffe39a);
    }
  }

  private tileAtPointer(p: Phaser.Input.Pointer) {
    const L = this.layout;
    const x = Math.floor((p.x - L.ox) / L.tile);
    const y = Math.floor((p.y - L.oy) / L.tile);
    if (x < 0 || y < 0 || x >= this.sim.grid.w || y >= this.sim.grid.h) return null;
    return { x, y };
  }

  private onPointerUp(p: Phaser.Input.Pointer) {
    const start = this.pointerStart;
    this.pointerStart = null;
    if (!start) return;
    const L = this.layout;
    if (start.x < L.map.x || start.x > L.map.x + L.map.w || start.y < L.map.y || start.y > L.map.y + L.map.h) return;
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
    const t = this.tileAtPointer(p);
    if (!t) return;
    const dx = t.x - st.x;
    const dy = t.y - st.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    const dir: Dir = dx === 1 ? 1 : dx === -1 ? 3 : dy === 1 ? 2 : 0;
    if (!canMove(this.sim, st, dir)) return;
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
          this.talk(p.x, p.y - s * 0.3, this.pick(this.copy.lines.dadSleep), "whisper", 1800);
        }
      }
      if (a.kind === "dog" && a.mode === "sleep" && view.kind === "dog" && Math.random() < 0.6) {
        const p = view.view.headPoint();
        floatZ(this, fonts, p.x + s * 0.1, p.y + s * 0.1, Math.round(s * 0.2));
      }
    });
    if (st.status === "playing" && Math.random() < 0.45) this.bruno.blink();
    if (st.status === "playing" && this.time.now - this.lastInput > 3000 && Math.random() < 0.3) this.bruno.glance(Math.random() < 0.5 ? -1 : 1);
    st.agents.forEach((a, i) => {
      const view = this.agents[i];
      const p = agentPos(this.sim.grid, i, a);
      if (a.kind === "dog" && a.mode === "sleep" && view.kind === "dog" && Math.abs(p.x - st.x) + Math.abs(p.y - st.y) <= 3 && Math.random() < 0.4) view.view.twitch();
    });
    if (st.status === "playing" && this.time.now - this.lastInput > 7000 && Math.random() < 0.3) {
      const b = this.bruno.container;
      this.talk(b.x, b.y - s * 0.5, this.copy.lines.brunoThink, "thought", 1400);
      this.lastInput = this.time.now;
    }
  }
}
