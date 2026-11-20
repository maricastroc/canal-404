import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import type { Locale } from "@/i18n/locales";
import { getGameRecord } from "@/lib/progress/store";
import { ARENAS } from "../arenas";
import { BODY, ESCALATE, H, HP, KID_INFO, KIDS, PILLOW, SCORE, W, type KidId } from "../config";
import { COPY, resultCopy, winShout, type PajamaCopy } from "../copy";
import { matchScore } from "../score";
import { HEAD_MIN, LIP, WALL_EXT, type Frame } from "../layout";
import { firstTallHit, FLOOR_Y, pointOnTrace, resolveBody, separateBodies, traceShot, type Point } from "../nav";
import { PAJAMA_SFX, type PajamaSfx } from "../sounds";
import { SPECIAL, SpecialSpawner } from "../special";
import { loadStats, markHint, saveStats } from "../storage";
import { cartoonText } from "../../kit/ui";
import { Brain, type BrainView } from "./brain";
import { Fighter } from "./fighter";
import { currentFrame, watchFrame } from "./frame";
import { PajamaHud, type Offscreen } from "./hud";
import { Pillow } from "./pillows";
import { Room } from "./room";
import { SpecialDrop } from "./special-drop";

type Mode = "attract" | "intro" | "play" | "over";
type Aim = { angle: number; target: Fighter | null; x: number; y: number; free: boolean };

const TOUCH_UI = typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches);
const SKIP_AFTER = 450;

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const HIDE_MS = 8000;
const STEP_MAX_MS = 50;
const FRAME_MAX_MS = 200;

export class ArenaScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private locale!: Locale;
  private text!: PajamaCopy["arena"];
  private levelIndex = 0;
  private mode: Mode = "attract";
  private t = 0;
  private matchTime = 0;
  private fighters: Fighter[] = [];
  private player: Fighter | null = null;
  private brains = new Map<Fighter, Brain>();
  private targets = new Map<Fighter, Fighter | null>();
  private pillows: Pillow[] = [];
  private engagedAt = 0;
  private truce = false;
  private room!: Room;
  private hud: PajamaHud | null = null;
  private uiCam: Phaser.Cameras.Scene2D.Camera | null = null;
  private buildingHud = false;
  private keys!: Record<"up" | "down" | "left" | "right" | "w" | "a" | "s" | "d" | "space", Phaser.Input.Keyboard.Key>;
  private aim = { x: W / 2, y: H / 2 };
  private mouseAt = -99999;
  private mouseDown = false;
  private throwQueued = -99999;
  private aimMode: "mouse" | "assist" = "assist";
  private lock: Fighter | null = null;
  private aimNow: Aim | null = null;
  private hurtFlash: Phaser.GameObjects.Image | null = null;
  private playerSafeUntil = 0;
  private aiWindup = 250;
  private aiSpeed = 0.9;
  private aiGap = 560;
  private alerts: { f: Fighter; img: Phaser.GameObjects.Text; until: number }[] = [];
  private lastUfa = -9999;
  private lastQuase = -9999;
  private freezeUntil = 0;
  private heatStage = 0;
  private damageTaken = 0;
  private guide!: Phaser.GameObjects.Graphics;
  private youTag: Phaser.GameObjects.Container | null = null;
  private lastSound = new Map<string, number>();
  private lastOuch = 0;
  private spawner: SpecialSpawner | null = null;
  private drop: SpecialDrop | null = null;
  private sweatAt = new Map<Fighter, number>();
  private trail: Point = { x: 0, y: 0 };
  private endAt = 0;
  private pending: GameResult | null = null;
  private resultTimer: Phaser.Time.TimerEvent | null = null;
  private lastTaunt = -9999;
  private frame!: Frame;
  private vignette: Phaser.GameObjects.Image | null = null;
  private camAt = { x: 0, y: 0 };
  private focus: Fighter | null = null;
  private focusUntil = 0;
  private mechanicDelay = 700;
  private offscreen: Offscreen[] = [];
  private ceilingY = 0;
  private tutorial: { moved: boolean; threw: boolean } | null = null;

  constructor() {
    super("arena");
  }

  init(data: { mode?: Mode }) {
    this.mode = data?.mode === "attract" ? "attract" : "intro";
    this.t = 0;
    this.matchTime = 0;
    this.fighters = [];
    this.player = null;
    this.brains = new Map();
    this.targets = new Map();
    this.pillows = [];
    this.engagedAt = 0;
    this.truce = false;
    this.hud = null;
    this.freezeUntil = 0;
    this.heatStage = 0;
    this.damageTaken = 0;
    this.mouseAt = -99999;
    this.mouseDown = false;
    this.throwQueued = -99999;
    this.aimMode = "assist";
    this.lock = null;
    this.aimNow = null;
    this.hurtFlash = null;
    this.playerSafeUntil = 0;
    this.alerts = [];
    this.lastUfa = -9999;
    this.lastQuase = -9999;
    this.youTag = null;
    this.lastSound = new Map();
    this.spawner = null;
    this.drop = null;
    this.sweatAt = new Map();
    this.endAt = 0;
    this.pending = null;
    this.resultTimer = null;
    this.lastTaunt = -9999;
    this.focus = null;
    this.focusUntil = 0;
    this.mechanicDelay = 700;
    this.vignette = null;
    this.tutorial = null;
  }

  get attract() {
    return this.mode === "attract";
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.locale = this.ctx.locale;
    this.text = COPY[this.locale].arena;
    const reduced = this.ctx.reducedMotion;
    this.levelIndex = Phaser.Math.Clamp((this.registry.get("level") as number | undefined) ?? 0, 0, ARENAS.length - 1);
    const arena = ARENAS[this.levelIndex];
    this.aiWindup = Math.round(130 + (1 - arena.ai) * 240);
    this.aiSpeed = 0.86 + arena.ai * 0.1;
    this.aiGap = Math.round(760 - arena.ai * 400);
    this.frame = currentFrame(this);
    this.uiCam = this.cameras.add(0, 0, this.frame.width, this.frame.height).setName("ui");
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.route, this);
    this.cameras.main.setBackgroundColor("#1d1830");
    this.room = new Room(this, arena, reduced, this.ctx.fonts);
    if (!this.attract && arena.specialSpots) this.spawner = new SpecialSpawner(arena.specialSpots);

    const chosen = (this.registry.get("kid") as KidId | null) ?? "lia";
    const order: KidId[] = this.attract ? [...KIDS] : [chosen, ...KIDS.filter((k) => k !== chosen)];
    order.forEach((kid, i) => {
      const [x, y] = arena.spawns[i];
      const isPlayer = !this.attract && i === 0;
      const f = new Fighter(this, kid, isPlayer, x, y, {
        sfx: (name, volume) => this.sfx(name, volume),
        dust: (dx, dy, dir) => this.dust(dx, dy, dir),
        release: (who, angle) => this.release(who, angle),
        regen: (who) => this.onRegen(who),
      }, reduced);
      f.facing = x < W / 2 ? 1 : -1;
      if (isPlayer) {
        f.facing = 1;
        this.player = f;
      } else {
        this.brains.set(f, new Brain(f, this.attract ? 0.08 : arena.ai, this.room));
      }
      this.fighters.push(f);
    });
    this.guide = this.add.graphics().setDepth(1200);

    this.buildingHud = true;
    this.vignette = this.add.image(0, 0, "vignette").setOrigin(0, 0).setDisplaySize(W, H).setAlpha(arena.theme === "yard" ? 0.7 : 0.55).setDepth(1900);
    this.hurtFlash = this.add.image(0, 0, "vignette").setOrigin(0, 0).setDisplaySize(W, H).setTint(0xef4f43).setAlpha(0).setDepth(1901);
    if (!this.attract) {
      this.hud = new PajamaHud(this, this.ctx.fonts, arena.title[this.locale], order.map((kid, i) => ({ kid, isPlayer: i === 0 })), reduced, COPY[this.locale].hud);
      this.hud.enableTouch(TOUCH_UI);
      this.hud.setDeckColor(this.room.deckColor);
    }
    this.buildingHud = false;

    this.setupInput();
    for (const f of this.fighters) f.sync(0);
    watchFrame(this, (frame) => this.applyFrame(frame));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.route, this);
      this.uiCam = null;
    });

    if (!this.registry.get("readySent")) {
      this.registry.set("readySent", true);
      this.ctx.onReady();
    }
    if (!this.attract) this.countdown();
  }

  private applyFrame(frame: Frame) {
    this.frame = frame;
    const main = this.cameras.main;
    main.setSize(frame.width, frame.height);
    this.uiCam?.setSize(frame.width, frame.height);
    this.vignette?.setDisplaySize(frame.width, frame.height);
    this.hurtFlash?.setDisplaySize(frame.width, frame.height);
    this.ceilingY = frame.kind === "tall" ? (this.fixedHeight(frame) ? frame.top : Math.min(frame.top, HEAD_MIN - frame.hud / frame.zoom)) : 0;
    this.room.setCeiling(this.ceilingY);
    this.hud?.layout(frame, this.scale.displaySize.width);
    if (this.mode === "over") return;
    if (frame.kind === "full") {
      if (this.mode === "attract") {
        main.setZoom(1);
        main.centerOn(W / 2, H / 2);
      }
      return;
    }
    main.setZoom(frame.zoom);
    this.followCamera(0, true);
  }

  private fixedHeight(f: Frame) {
    return f.kind === "tall" && (f.height - f.deck - f.hud) / f.zoom >= LIP - HEAD_MIN - 0.5;
  }

  private get compact() {
    return this.frame.kind !== "full";
  }

  private worldField() {
    const f = this.frame;
    const z = f.zoom;
    const field = this.hud?.playfield ?? { left: f.safe.left, top: f.hud, right: f.width - f.safe.right, bottom: f.height - f.deck };
    return { left: field.left / z, top: field.top / z, right: field.right / z, bottom: field.bottom / z, vw: f.width / z, vh: f.height / z };
  }

  private pickFocus(p: Fighter, t: number) {
    const alert = this.alerts.find((a) => a.f.alive && t < a.until);
    if (alert) {
      this.focus = alert.f;
      this.focusUntil = t + 900;
      return alert.f;
    }
    if (this.focus && this.focus.alive && t < this.focusUntil) return this.focus;
    let best: Fighter | null = this.lock && this.lock.alive ? this.lock : null;
    if (!best) {
      let bestD = Infinity;
      for (const o of this.fighters) {
        if (o === p || !o.alive) continue;
        const d = Math.hypot(o.x - p.x, (o.y - p.y) * 1.4);
        if (d < bestD) {
          bestD = d;
          best = o;
        }
      }
    }
    if (best && Math.hypot(best.x - p.x, best.y - p.y) > PILLOW.range * 1.35) best = null;
    if (best !== this.focus) {
      this.focus = best;
      this.focusUntil = t + 700;
    }
    return best;
  }

  private followCamera(dt: number, snap = false) {
    const f = this.frame;
    const cam = this.cameras.main;
    const z = f.zoom;
    const fd = this.worldField();
    const alive = this.fighters.filter((o) => o.alive);
    const p = this.player && this.player.alive ? this.player : null;
    const anchor = p ?? (alive.length ? { x: alive.reduce((a, o) => a + o.x, 0) / alive.length, y: alive.reduce((a, o) => a + o.y, 0) / alive.length, vx: 0, top: 0 } : { x: W / 2, y: 760, vx: 0, top: 0 });
    const anchorTop = p ? p.top : anchor.y - 216;
    const focus = p && this.mode === "play" ? this.pickFocus(p, this.t) : null;
    const fw = fd.right - fd.left;
    const margin = Math.min(fw * 0.2, 240);
    const lead = Phaser.Math.Clamp(anchor.vx * 0.22, -fw * 0.1, fw * 0.1);
    const wantX = focus ? (anchor.x + focus.x) / 2 : anchor.x + lead;
    let sx = wantX - (fd.left + fw / 2);
    sx = Phaser.Math.Clamp(sx, anchor.x - (fd.right - margin), anchor.x - (fd.left + margin));
    sx = fd.vw >= W ? (W - fd.vw) / 2 : Phaser.Math.Clamp(sx, 0, W - fd.vw);
    const minTop = f.kind === "tall" ? Math.max(-WALL_EXT, this.ceilingY) : 0;
    const maxBottom = f.kind === "tall" ? LIP + f.deck / z : H;
    const fh = fd.bottom - fd.top;
    const fixed = this.fixedHeight(f);
    let sy: number;
    if (fixed) sy = f.top;
    else {
      const head = anchorTop - 50;
      const feet = anchor.y + 36;
      const wantY = focus ? (head + feet) / 2 + ((focus.y - anchor.y) * 0.5) : (head + feet) / 2;
      sy = wantY - (fd.top + fh / 2);
      sy = Phaser.Math.Clamp(sy, feet - fd.bottom, Math.max(feet - fd.bottom, head - fd.top));
      sy = Phaser.Math.Clamp(sy, minTop, Math.max(minTop, maxBottom - fd.vh));
    }
    const k = snap || this.ctx.reducedMotion ? 1 : 1 - Math.exp(-dt * 4.5);
    this.camAt.x += (sx - this.camAt.x) * k;
    this.camAt.y += (sy - this.camAt.y) * k;
    if (p) {
      const hard = Math.min(fw * 0.08, 90);
      this.camAt.x = Phaser.Math.Clamp(this.camAt.x, anchor.x - (fd.right - hard), anchor.x - (fd.left + hard));
      if (!fixed) this.camAt.y = Phaser.Math.Clamp(this.camAt.y, anchor.y + 30 - fd.bottom, Math.max(anchor.y + 30 - fd.bottom, anchorTop - 30 - fd.top));
    }
    this.camAt.x = fd.vw >= W ? (W - fd.vw) / 2 : Phaser.Math.Clamp(this.camAt.x, 0, W - fd.vw);
    this.camAt.y = Phaser.Math.Clamp(this.camAt.y, minTop, Math.max(minTop, maxBottom - fd.vh));
    if (cam.zoom !== z) cam.setZoom(z);
    cam.centerOn(this.camAt.x + fd.vw / 2, this.camAt.y + fd.vh / 2);
  }

  private learn(moved: boolean, threw: boolean) {
    const tut = this.tutorial;
    if (!tut) return;
    tut.moved ||= moved;
    tut.threw ||= threw;
    if (!tut.moved || !tut.threw) return;
    this.tutorial = null;
    this.time.delayedCall(1200, () => this.hud?.setTutorial(false));
  }

  private toScreen(x: number, y: number) {
    const cam = this.cameras.main;
    const view = cam.worldView;
    return { x: cam.x + (x - view.x) * cam.zoom, y: cam.y + (y - view.y) * cam.zoom };
  }

  private trackOffscreen(t: number) {
    const hud = this.hud;
    if (!hud) return;
    if (!this.compact || this.mode !== "play") {
      hud.offscreen([], t);
      return;
    }
    const field = hud.playfield;
    const list = this.offscreen;
    list.length = 0;
    const tol = 18 * this.frame.unit;
    for (const f of this.fighters) {
      if (f.isPlayer || !f.alive) continue;
      const head = this.toScreen(f.x, f.top + 40);
      const feet = this.toScreen(f.x, f.y);
      const out = feet.x < field.left - tol || feet.x > field.right + tol || feet.y < field.top + tol || head.y > field.bottom - tol;
      if (!out) continue;
      list.push({ kid: f.kid, x: feet.x, y: (head.y + feet.y) / 2, alert: this.alerts.some((a) => a.f === f && t < a.until) });
    }
    hud.offscreen(list, t);
  }

  private frameCamera(dt: number) {
    if (this.compact) {
      this.followCamera(dt);
      return;
    }
    const cam = this.cameras.main;
    const small = this.scale.displaySize.width < 1100;
    const k = 1 - Math.exp(-dt * 3);
    let z = 1;
    let cx = W / 2;
    let cy = H / 2;
    if (small) {
      const alive = this.fighters.filter((f) => f.alive);
      const x0 = Math.min(...alive.map((f) => f.x));
      const x1 = Math.max(...alive.map((f) => f.x));
      const y0 = Math.min(...alive.map((f) => f.top));
      const y1 = Math.max(...alive.map((f) => f.y));
      z = Phaser.Math.Clamp(Math.min(W / (x1 - x0 + 560), H / (y1 - y0 + 420)), 1, 1.45);
      cx = (x0 + x1) / 2;
      cy = (y0 + y1) / 2;
    }
    const zoom = this.ctx.reducedMotion ? z : cam.zoom + (z - cam.zoom) * k;
    cam.setZoom(zoom);
    const vw = W / zoom;
    const vh = H / zoom;
    const tx = Phaser.Math.Clamp(cx, vw / 2, W - vw / 2);
    const ty = Phaser.Math.Clamp(cy, vh / 2, H - vh / 2);
    const mx = cam.scrollX + W / 2;
    const my = cam.scrollY + H / 2;
    cam.centerOn(this.ctx.reducedMotion ? tx : mx + (tx - mx) * k, this.ctx.reducedMotion ? ty : my + (ty - my) * k);
  }

  private route(obj: Phaser.GameObjects.GameObject) {
    if (this.buildingHud) this.cameras.main.ignore(obj);
    else this.uiCam?.ignore(obj);
  }

  private countdown() {
    const hud = this.hud!;
    const p = this.player!;
    const arena = ARENAS[this.levelIndex];
    hud.flash(this.text.ready, "#fbf5e6", 700, this.text.readySub);
    if (loadStats().matches < 2) {
      if (hud.hasTouch && this.compact) {
        hud.setTutorial(true);
        this.tutorial = { moved: false, threw: false };
      } else {
        hud.hint(hud.hasTouch ? this.text.controlsTouch : this.text.controlsKeys, 4200);
        this.mechanicDelay = 3400;
      }
    }
    this.sfx("beep", 0.8);
    this.ctx.onEvent({ type: "announce", message: this.text.intro(arena.title[this.locale], p.kid) });
    this.time.delayedCall(950, () => {
      if (this.mode !== "intro") return;
      this.mode = "play";
      this.engagedAt = this.t;
      hud.flash(this.text.go, "#ffc83d", 520);
      this.sfx("go", 0.9);
      this.showYou();
      this.introduceMechanic();
    });
  }

  private introduceMechanic() {
    const arena = ARENAS[this.levelIndex];
    if (!arena.mechanic) return;
    if (arena.mechanic === "ricochet") {
      this.room.springProps().forEach((p, i) => {
        p.springHop(i * 90);
        if (!this.ctx.reducedMotion) this.time.delayedCall(i * 90, () => this.word("BOING!", p.springs[0].x, p.springs[0].y - 60, "#ffc83d", 30));
      });
      if (!this.ctx.reducedMotion) this.time.delayedCall(60, () => this.sfx("spring", 0.6));
    }
    if (!markHint(arena.mechanic)) return;
    const text = this.text.hints[arena.mechanic];
    this.time.delayedCall(this.mechanicDelay, () => {
      if (this.mode !== "play") return;
      this.hud?.hint(text);
      this.ctx.onEvent({ type: "announce", message: text });
    });
  }

  private showYou() {
    const p = this.player;
    if (!p) return;
    const label = cartoonText(this, 0, 0, this.text.you, { size: 30, color: "#1d1830", font: this.ctx.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const g = this.add.graphics();
    const w = label.width + 26;
    g.fillStyle(0x1d1830, 1);
    g.fillRoundedRect(-w / 2 + 3, -22 + 4, w, 42, 10);
    g.fillStyle(0xffc83d, 1);
    g.fillRoundedRect(-w / 2, -22, w, 42, 10);
    g.lineStyle(4, 0x1d1830, 1);
    g.strokeRoundedRect(-w / 2, -22, w, 42, 10);
    g.fillStyle(0xffc83d, 1);
    g.fillTriangle(-12, 19, 12, 19, 0, 34);
    g.lineStyle(4, 0x1d1830, 1);
    g.lineBetween(-12, 21, 0, 34);
    g.lineBetween(12, 21, 0, 34);
    this.youTag = this.add.container(p.x, p.top - 40, [g, label]).setDepth(1500);
    this.time.delayedCall(2600, () => {
      const tag = this.youTag;
      if (!tag) return;
      this.tweens.add({ targets: tag, alpha: 0, duration: 300, onComplete: () => tag.destroy() });
      this.youTag = null;
    });
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({ up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT, w: K.W, a: K.A, s: K.S, d: K.D, space: K.SPACE }) as typeof this.keys;
    kb.addCapture([K.SPACE, K.UP, K.DOWN, K.LEFT, K.RIGHT]);
    const handled = new WeakSet<KeyboardEvent>();
    kb.on("keydown", (event: KeyboardEvent) => {
      if (handled.has(event)) return;
      handled.add(event);
      const key = event.key.toLowerCase();
      if (this.mode === "over") {
        if (!event.repeat && (key === " " || key === "enter")) this.skipCelebration();
        return;
      }
      if (key === "escape" || key === "p") this.ctx.onEvent({ type: "pause-request" });
      if (key === " " && this.time.now - this.mouseAt > 1500) this.aimMode = "assist";
      if (key === " " && !event.repeat) this.throwQueued = this.time.now;
    });
    if (this.attract) return;
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.mode === "over") this.skipCelebration();
    });
    this.input.setDefaultCursor("crosshair");
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      if (p.wasTouch || (p.event as PointerEvent | undefined)?.pointerType === "touch") return;
      const wp = p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.aim = { x: wp.x, y: wp.y };
      this.mouseAt = this.time.now;
      this.aimMode = "mouse";
    });
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      if (p.wasTouch || (p.event as PointerEvent | undefined)?.pointerType === "touch" || !p.leftButtonDown()) return;
      const wp = p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.aim = { x: wp.x, y: wp.y };
      this.mouseAt = this.time.now;
      this.aimMode = "mouse";
      this.mouseDown = true;
      this.throwQueued = this.time.now;
    });
    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
      if (p.wasTouch || (p.event as PointerEvent | undefined)?.pointerType === "touch") return;
      this.mouseDown = false;
    });
  }

  private sfx(name: PajamaSfx, volume = 1, throttle = 0) {
    if (this.attract) return;
    if (throttle) {
      const last = this.lastSound.get(name) ?? -9999;
      if (this.time.now - last < throttle) return;
      this.lastSound.set(name, this.time.now);
    }
    this.ctx.audio.play(PAJAMA_SFX[name], { volume: Phaser.Math.Clamp(volume, 0.05, 1.2) });
  }

  private dust(x: number, y: number, dir: number) {
    if (this.ctx.reducedMotion) return;
    const img = this.add.image(x - dir * 16, y - 10, "dust").setDepth(y - 1).setScale(0.45).setAlpha(0.8);
    this.tweens.add({ targets: img, x: img.x - dir * 40, y: img.y - 16, scale: 0.8, alpha: 0, duration: 360, onComplete: () => img.destroy() });
  }

  feathers(x: number, y: number, count: number, spread = 90) {
    const n = this.ctx.reducedMotion ? Math.min(3, count) : count;
    for (let i = 0; i < n; i += 1) {
      const img = this.add.image(x, y, "feather").setDepth(1400).setScale(Phaser.Math.FloatBetween(0.55, 0.9)).setAngle(Phaser.Math.Between(0, 360));
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const d = Phaser.Math.FloatBetween(spread * 0.4, spread);
      const tx = x + Math.cos(a) * d;
      const ty = y + Math.sin(a) * d * 0.6;
      if (this.ctx.reducedMotion) {
        img.setPosition(tx, ty);
        this.tweens.add({ targets: img, alpha: 0, duration: 500, onComplete: () => img.destroy() });
        continue;
      }
      this.tweens.add({ targets: img, x: tx, y: ty - 30, duration: 260, ease: "Quad.easeOut" });
      this.tweens.add({
        targets: img,
        y: ty + Phaser.Math.Between(40, 110),
        x: tx + Phaser.Math.Between(-40, 40),
        angle: img.angle + Phaser.Math.Between(-200, 200),
        alpha: 0,
        delay: 200,
        duration: Phaser.Math.Between(420, 720),
        ease: "Sine.easeInOut",
        onComplete: () => img.destroy(),
      });
    }
  }

  private word(text: string, x: number, y: number, color: string, size = 46) {
    const t = cartoonText(this, x, y, text, { size, color, font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(1450);
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(650, () => t.destroy());
      return;
    }
    t.setScale(0.3).setAngle(Phaser.Math.Between(-10, 10));
    this.tweens.add({ targets: t, scale: 1, duration: 150, ease: "Back.easeOut" });
    this.tweens.add({ targets: t, y: y - 46, alpha: 0, delay: 380, duration: 320, onComplete: () => t.destroy() });
  }

  private release(f: Fighter, angle: number) {
    const ox = f.x + Math.cos(angle) * 34;
    const oy = f.y + 6;
    const special = f.special;
    this.pillows.push(new Pillow(this, f, ox, oy, angle, this.ctx.reducedMotion, f.isPlayer ? 1 : this.aiSpeed, special));
    if (special) {
      f.special = false;
      this.spawner?.used(this.matchTime);
      this.hud?.setSpecial(f.kid, false);
      this.sfx("whoosh", f.isPlayer ? 0.9 : 0.6);
    }
    if (this.attract) return;
    const g = this.add.graphics().setDepth(oy + 4);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle) * 0.86;
    const hx = ox + dx * 40;
    const hy = oy - PILLOW.lift + dy * 40;
    const px = -dy;
    const py = dx;
    g.lineStyle(5, 0xfbf5e6, 0.9);
    for (const off of [-22, 0, 22]) {
      const sx = hx + px * off;
      const sy = hy + py * off;
      g.lineBetween(sx - dx * (off === 0 ? 56 : 36), sy - dy * (off === 0 ? 56 : 36), sx - dx * 8, sy - dy * 8);
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
  }

  private impact(x: number, y: number, depth: number, strong: boolean) {
    const g = this.add.graphics().setDepth(depth).setPosition(x, y);
    const r = strong ? 46 : 34;
    g.lineStyle(9, 0x1d1830, 0.85);
    g.strokeCircle(0, 0, r);
    g.lineStyle(5, 0xffffff, 1);
    g.strokeCircle(0, 0, r);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      g.lineStyle(5, i % 2 ? 0xffc83d : 0xffffff, 1);
      g.lineBetween(Math.cos(a) * (r + 8), Math.sin(a) * (r + 8), Math.cos(a) * (r + 26), Math.sin(a) * (r + 26));
    }
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(140, () => g.destroy());
      return;
    }
    g.setScale(0.4);
    this.tweens.add({ targets: g, scale: 1.15, alpha: 0, duration: 260, ease: "Quad.easeOut", onComplete: () => g.destroy() });
  }

  private heartPop(f: Fighter) {
    const x = f.x + Phaser.Math.Between(-10, 10);
    const y = f.top - 70;
    const off = this.add.image(x, y, "icon-heart-off").setDepth(1460).setScale(1.1);
    const on = this.add.image(x, y, "icon-heart-on").setDepth(1461).setScale(1.1);
    on.setCrop(0, 0, on.width / 2, on.height);
    const parts = [off, on];
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(600, () => parts.forEach((p) => p.destroy()));
      return;
    }
    this.tweens.add({ targets: parts, y: y - 46, duration: 650, ease: "Quad.easeOut" });
    this.tweens.add({ targets: parts, alpha: 0, delay: 380, duration: 270, onComplete: () => parts.forEach((p) => p.destroy()) });
  }

  private onRegen(f: Fighter) {
    if (this.attract) return;
    this.hud?.setHp(f.kid, f.hp, "regen");
    if (this.ctx.reducedMotion) return;
    const img = this.add.image(f.x + 30, f.top + 10, "icon-heart-on").setDepth(1400).setScale(0.6).setAlpha(0.9);
    this.tweens.add({ targets: img, y: img.y - 50, alpha: 0, duration: 700, ease: "Quad.easeOut", onComplete: () => img.destroy() });
  }

  private angleTo(p: Fighter, x: number, y: number) {
    return Math.atan2((y - p.y) / 0.86, x - p.x);
  }

  private led(p: Fighter, o: Fighter) {
    const k = (Math.hypot(o.x - p.x, o.y - p.y) / PILLOW.speed) * 0.55;
    return { x: o.x + o.vx * k, y: o.y + o.vy * k };
  }

  private computeAim(p: Fighter): Aim {
    if (this.aimMode === "mouse") {
      const gx = this.aim.x;
      const gy = this.aim.y + PILLOW.lift;
      const raw = this.angleTo(p, gx, gy);
      let best: Fighter | null = null;
      let bestScore = Infinity;
      for (const o of this.fighters) {
        if (o === p || !o.alive || Math.hypot(o.x - p.x, o.y - p.y) > PILLOW.range * 1.02) continue;
        const cursor = Math.hypot(this.aim.x - o.x, this.aim.y - (o.y - 100));
        const diff = Math.abs(Phaser.Math.Angle.Wrap(this.angleTo(p, o.x, o.y) - raw));
        if (cursor > 130 && diff > 0.2) continue;
        const score = cursor + diff * 400;
        if (score < bestScore) {
          bestScore = score;
          best = o;
        }
      }
      if (best) {
        const q = this.led(p, best);
        return { angle: this.angleTo(p, q.x, q.y), target: best, x: best.x, y: best.y, free: false };
      }
      return { angle: raw, target: null, x: gx, y: gy, free: true };
    }
    const found = this.assistTarget(p);
    let target = found.best;
    const keep = this.lock && this.lock.alive && Math.hypot(this.lock.x - p.x, this.lock.y - p.y) < PILLOW.range * 1.05 ? this.lock : null;
    if (keep && target && keep !== target && (found.scores.get(keep) ?? Infinity) < found.score * 1.3) target = keep;
    if (target) {
      const q = this.led(p, target);
      return { angle: this.angleTo(p, q.x, q.y), target, x: target.x, y: target.y, free: false };
    }
    const k = this.keys;
    const tx = this.hud?.touch;
    const mx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0) + (tx?.x ?? 0);
    const my = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0) + (tx?.y ?? 0);
    const angle = mx || my ? Math.atan2(my, mx) : p.facing > 0 ? 0 : Math.PI;
    return { angle, target: null, x: p.x + Math.cos(angle) * 400, y: p.y + Math.sin(angle) * 400 * 0.86, free: true };
  }

  private aimAngle(p: Fighter) {
    return this.computeAim(p).angle;
  }

  private assistTarget(p: Fighter) {
    let best: Fighter | null = null;
    let bestScore = Infinity;
    const scores = new Map<Fighter, number>();
    const k = this.keys;
    const tx = this.hud?.touch;
    let fx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0) + (tx?.x ?? 0);
    let fy = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0) + (tx?.y ?? 0);
    if (!fx && !fy) {
      fx = p.facing;
      fy = 0;
    }
    const fa = Math.atan2(fy, fx);
    for (const o of this.fighters) {
      if (o === p || !o.alive) continue;
      const d = Math.hypot(o.x - p.x, o.y - p.y);
      if (d > PILLOW.range * 1.05) continue;
      const diff = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(o.y - p.y, o.x - p.x) - fa));
      const score = d * (1 + diff * 0.55) * (d > PILLOW.range * 0.85 ? 1.6 : 1);
      scores.set(o, score);
      if (score < bestScore) {
        bestScore = score;
        best = o;
      }
    }
    return { best, score: bestScore, scores };
  }

  private resolve(f: Fighter) {
    resolveBody(f, ARENAS[this.levelIndex].bounds, this.room.solid);
  }

  private separate() {
    separateBodies(this.fighters.filter((f) => f.alive));
  }

  update(time: number, delta: number) {
    if (time < this.freezeUntil) return;
    let left = Math.min(delta, FRAME_MAX_MS);
    while (left > 0 && this.time.now >= this.freezeUntil) {
      const ms = Math.min(left, STEP_MAX_MS);
      left -= ms;
      this.step(ms / 1000);
    }
    const t = this.t;
    for (const f of this.fighters) f.sync(t);
    this.drawGuide(t);
    if (this.youTag && this.player) this.youTag.setPosition(this.player.x, this.player.top - 46);
    if (this.alerts.length) {
      for (const a of this.alerts) {
        if (t >= a.until || !a.f.alive || this.mode === "over") a.img.destroy();
        else a.img.setPosition(a.f.x, a.f.top - 40);
      }
      this.alerts = this.alerts.filter((a) => a.img.active);
    }
    if (this.player && this.hud) {
      const at = this.toScreen(this.player.x, this.player.y - 100);
      this.hud.avoid(at.x, at.y);
      const p = this.player;
      this.hud.setCooldown(p.canThrow(t) ? 1 : Phaser.Math.Clamp(1 - (p.readyAt - t) / p.stats.cooldown, 0, 0.99), p.special);
    }
    this.trackOffscreen(t);
    if (this.drop && this.spawner?.spot) this.drop.update(t, this.matchTime - this.spawner.spawnedAt);
    this.sweat(t);
  }

  private sweat(t: number) {
    if (this.ctx.reducedMotion || this.mode !== "play") return;
    for (const f of this.fighters) {
      if (!f.alive || f.hp > 2) continue;
      const next = this.sweatAt.get(f) ?? 0;
      if (t < next) continue;
      this.sweatAt.set(f, t + 850);
      const side = Math.random() < 0.5 ? -1 : 1;
      const img = this.add.image(f.x + side * 34, f.top + 40, "drop").setDepth(f.y + 1).setAngle(side * 20).setScale(1.1);
      this.tweens.add({ targets: img, x: img.x + side * 26, y: img.y + 34, alpha: 0, duration: 520, ease: "Quad.easeIn", onComplete: () => img.destroy() });
    }
  }

  private step(dt: number) {
    const active = this.mode === "play" || this.mode === "attract" || this.mode === "over";
    if (active) this.t += dt * 1000;
    const t = this.t;
    if (this.mode === "play") {
      this.matchTime += dt * 1000;
      this.hud?.setTime(this.matchTime);
      this.escalate();
    }
    const heat = this.mode === "play" ? Phaser.Math.Clamp((this.matchTime - ESCALATE.heat) / (ESCALATE.final - ESCALATE.heat), 0, 1) : 0;

    if (active) {
      const warm = this.mode === "play" ? Phaser.Math.Clamp(this.matchTime / 15000, 0, 1) : 1;
      const view: BrainView = { fighters: this.fighters, pillows: this.pillows, room: this.room, heat, warm, playerSafeUntil: this.playerSafeUntil, targets: this.targets, hider: this.watchHiding(t), special: this.spawner?.spot ?? null };
      for (const f of this.fighters) {
        if (!f.alive) {
          f.update(t, dt, 0, 0);
          continue;
        }
        let mx = 0;
        let my = 0;
        if (f === this.player) {
          if (this.mode === "play") {
            const k = this.keys;
            mx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
            my = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
            const touch = this.hud?.touch;
            if (touch && touch.active) {
              mx = touch.x;
              my = touch.y;
            }
            if (this.tutorial && touch) this.learn(touch.active && Math.hypot(touch.x, touch.y) > 0.3, false);
            const queued = this.time.now - this.throwQueued < 180 || this.time.now - (touch?.tapAt ?? -99999) < 180;
            const wants = k.space.isDown || this.mouseDown || Boolean(touch?.throwing) || queued;
            if (wants && f.canThrow(t)) {
              f.requestThrow(t, this.aimAngle(f), PILLOW.windup + (f.special ? SPECIAL.windup : 0));
              if (this.tutorial) this.learn(false, true);
              this.throwQueued = -99999;
              if (touch) touch.tapAt = -99999;
            }
          }
        } else if (this.mode !== "over") {
          const brain = this.brains.get(f)!;
          const out = brain.think(t, view);
          mx = out.mx;
          my = out.my;
          const windup = (this.attract ? PILLOW.windup : this.aiWindup) + (f.special ? SPECIAL.windup : 0);
          if (out.angle !== null && f.requestThrow(t, out.angle, windup) && out.target && out.target === this.player) {
            this.playerSafeUntil = t + this.aiWindup + this.aiGap;
            this.telegraph(f, t);
          }
        }
        f.update(t, dt, mx, my);
        this.resolve(f);
      }
      this.separate();
      for (const f of this.fighters) if (f.alive) this.resolve(f);
      this.updatePillows(t, dt);
      if (this.mode === "play") this.updateSpecial();
    }
    if (this.mode === "play" || this.mode === "intro" || (this.mode === "attract" && this.compact)) this.frameCamera(dt);
    this.room.update(t, dt, this.fighters.filter((f) => f.alive), (n, v) => this.sfx(n, v, 120));
  }

  private flightZ(d: number, range: number, special: boolean) {
    const p = d / range;
    const drop = p > 0.72 ? ((p - 0.72) / 0.28) ** 2 : 0;
    const lift = PILLOW.lift * (special ? SPECIAL.lift : 1);
    return Math.max(0, lift + Math.sin(Math.min(1, p) * Math.PI) * (special ? 70 : 22) - drop * lift);
  }

  private drawGuide(t: number) {
    const g = this.guide;
    g.clear();
    const p = this.player;
    if (!p || !p.alive || this.mode !== "play") {
      this.aimNow = null;
      return;
    }
    const aim = this.computeAim(p);
    this.aimNow = aim;
    this.lock = aim.target;
    const ready = p.canThrow(t);
    const special = p.special;
    const ox = p.x + Math.cos(aim.angle) * 34;
    const oy = p.y + 6;
    const trace = traceShot(ox, oy, aim.angle, this.room.boxes, ARENAS[this.levelIndex].bounds, { range: PILLOW.range, special });
    const want = Math.min(PILLOW.range * 0.98, Math.max(140, Math.hypot(aim.x - ox, aim.y - oy)));
    const bounceAt = trace.bounce && trace.bounce.at < want + 60 ? trace.bounce.at : -1;
    const reach = Math.min(trace.length, bounceAt >= 0 ? Math.max(want, bounceAt + 300) : want);
    const step = 58;
    const max = bounceAt >= 0 ? 12 : 7;
    const dots = Math.max(1, Math.min(ready ? max : 3, Math.floor((reach - 100) / step) + 1));
    const gold = ready || special;
    const at = this.trail;
    for (let i = 0; i < dots; i += 1) {
      const d = 100 + i * step;
      if (d > trace.length) break;
      pointOnTrace(trace, d, at);
      const range = bounceAt >= 0 && d > bounceAt ? PILLOW.range + 260 : PILLOW.range;
      const z = this.flightZ(d, range, special);
      const after = bounceAt >= 0 && d > bounceAt;
      const fade = after ? 1 - (d - bounceAt) / (reach - bounceAt + step * 3) : 1 - i / (dots + 2);
      const big = special ? 1.35 : 1;
      const r = (ready ? 7.5 - Math.min(i, 7) * 0.35 : 5.5 - i * 0.3) * big;
      g.fillStyle(0x1d1830, (ready ? 0.75 : 0.3) * fade);
      g.fillCircle(at.x + 2, at.y - z + 3, r + (after ? 2.5 : 1.5));
      g.fillStyle(after ? 0x9df0dc : gold ? 0xffc83d : 0xfbf5e6, (ready ? 1 : 0.45) * fade);
      g.fillCircle(at.x, at.y - z, after ? Math.max(r, 6) : r);
    }
    if (trace.bounce && bounceAt >= 0 && ready) {
      const bx = trace.bounce.x;
      const by = trace.bounce.y - this.flightZ(bounceAt, PILLOW.range, false);
      const pulse = this.ctx.reducedMotion ? 1 : 1 + Math.sin(t / 90) * 0.12;
      for (let i = 0; i < 4; i += 1) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        g.lineStyle(6, 0x1d1830, 0.85);
        g.lineBetween(bx + Math.cos(a) * 10, by + Math.sin(a) * 10, bx + Math.cos(a) * 22 * pulse, by + Math.sin(a) * 22 * pulse);
        g.lineStyle(3, 0x9df0dc, 1);
        g.lineBetween(bx + Math.cos(a) * 10, by + Math.sin(a) * 10, bx + Math.cos(a) * 22 * pulse, by + Math.sin(a) * 22 * pulse);
      }
    } else if (trace.end === "block" && trace.length < want && ready) {
      const end = trace.pts[trace.pts.length - 1];
      const ez = this.flightZ(trace.length, PILLOW.range, false);
      g.lineStyle(6, 0x1d1830, 0.8);
      g.lineBetween(end.x - 9, end.y - ez - 9, end.x + 9, end.y - ez + 9);
      g.lineBetween(end.x + 9, end.y - ez - 9, end.x - 9, end.y - ez + 9);
      g.lineStyle(3, 0xfbf5e6, 1);
      g.lineBetween(end.x - 9, end.y - ez - 9, end.x + 9, end.y - ez + 9);
      g.lineBetween(end.x + 9, end.y - ez - 9, end.x - 9, end.y - ez + 9);
    }
    {
      const cx = Math.cos(aim.angle);
      const cy = Math.sin(aim.angle) * FLOOR_Y;
      const len = Math.hypot(cx, cy);
      const ux = cx / len;
      const uy = cy / len;
      const ax = p.x + ux * 74;
      const ay = p.y + 2 + uy * 30;
      const nx = -uy;
      const ny = ux;
      const tip = { x: ax + ux * 26, y: ay + uy * 14 };
      const l = { x: ax + nx * 15, y: ay + ny * 9 };
      const r = { x: ax - nx * 15, y: ay - ny * 9 };
      g.fillStyle(0x1d1830, 0.85);
      g.fillTriangle(tip.x + 2, tip.y + 3, l.x + 2, l.y + 3, r.x + 2, r.y + 3);
      g.fillStyle(gold ? 0xffc83d : 0xfbf5e6, ready ? 1 : 0.7);
      g.fillTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
      g.lineStyle(3, 0x1d1830, 1);
      g.strokeTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
    }
    if (aim.target) {
      const o = aim.target;
      const pulse = this.ctx.reducedMotion ? 1 : 1 + Math.sin(t / 110) * 0.06;
      const a = ready ? 1 : 0.5;
      g.lineStyle(9, 0x1d1830, 0.8 * a);
      g.strokeEllipse(o.x, o.y + 2, 136 * pulse, 46 * pulse);
      g.lineStyle(5, 0xffc83d, a);
      g.strokeEllipse(o.x, o.y + 2, 136 * pulse, 46 * pulse);
      const hy = o.top - 34;
      g.fillStyle(0x1d1830, a);
      g.fillTriangle(o.x - 17, hy - 3, o.x + 17, hy - 3, o.x, hy + 19);
      g.fillStyle(0xffc83d, a);
      g.fillTriangle(o.x - 11, hy, o.x + 11, hy, o.x, hy + 13);
    } else if (this.aimMode === "mouse") {
      const end = Math.min(1, (PILLOW.range * 0.98) / Math.max(1, Math.hypot(aim.x - ox, aim.y - oy)));
      const rx = ox + (aim.x - ox) * end;
      const ry = oy + (aim.y - oy) * end - PILLOW.lift;
      g.lineStyle(7, 0x1d1830, 0.7);
      g.strokeCircle(rx, ry, 18);
      g.lineStyle(3.5, ready ? 0xffc83d : 0xfbf5e6, ready ? 1 : 0.6);
      g.strokeCircle(rx, ry, 18);
      g.lineBetween(rx - 26, ry, rx - 12, ry);
      g.lineBetween(rx + 12, ry, rx + 26, ry);
      g.lineBetween(rx, ry - 26, rx, ry - 12);
      g.lineBetween(rx, ry + 12, rx, ry + 26);
    }
    if (!ready) {
      const k = Phaser.Math.Clamp(1 - (p.readyAt - t) / p.stats.cooldown, 0, 1);
      const steps = Math.max(2, Math.floor(40 * k));
      g.lineStyle(6, 0xffc83d, 0.9);
      g.beginPath();
      for (let i = 0; i <= steps; i += 1) {
        const a = -Math.PI / 2 + (i / 40) * Math.PI * 2;
        const x = p.x + Math.cos(a) * 58;
        const y = p.y + 2 + Math.sin(a) * 21;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    }
  }

  private updateSpecial() {
    const spawner = this.spawner;
    if (!spawner) return;
    const ev = spawner.update(this.matchTime, this.fighters);
    if (!ev) return;
    const reduced = this.ctx.reducedMotion;
    if (ev.kind === "spawn") {
      const { x, y } = ev.at;
      this.drop?.vanish();
      this.sfx("whoosh", 0.7);
      this.drop = new SpecialDrop(this, x, y, reduced, () => {
        this.sfx("thud", 0.7);
        this.feathers(x, y - 40, 8, 90);
        this.dust(x - 30, y, -1);
        this.dust(x + 30, y, 1);
        this.word(this.text.giant, x, y - 150, "#ffc83d", 40);
      });
      this.ctx.onEvent({ type: "announce", message: this.text.giantDropped, transient: true });
      return;
    }
    if (ev.kind === "expire") {
      this.drop?.vanish();
      this.drop = null;
      this.sfx("plop", 0.5);
      return;
    }
    const f = ev.by as Fighter;
    this.drop?.grab(f.x, f.top + 40);
    this.drop = null;
    this.sfx("powerup", f.isPlayer ? 0.9 : 0.55);
    this.hud?.setSpecial(f.kid, true);
    this.word(f.isPlayer ? this.text.yours : this.text.grabbed, f.x, f.top - 30, f.isPlayer ? "#ffc83d" : KID_INFO[f.kid].css, 36);
    this.ctx.onEvent({ type: "announce", message: f.isPlayer ? this.text.youGrabbed : this.text.kidGrabbed(KID_INFO[f.kid].name), transient: !f.isPlayer });
  }

  private wave(x: number, y: number, owner: Fighter, victim: Fighter | null) {
    const t = this.t;
    const { rx, ry } = SPECIAL.wave;
    let touchedPlayer = owner.isPlayer;
    for (const f of this.fighters) {
      if (!f.alive || f === owner || f === victim) continue;
      const dx = (f.x - x) / rx;
      const dy = (f.y - y) / ry;
      if (dx * dx + dy * dy > 1) continue;
      f.shove(t, f.x - x || 1, f.y - y);
      if (f.isPlayer) touchedPlayer = true;
      this.word(this.text.shoved, f.x, f.top - 20, "#fbf5e6", 30);
    }
    this.sfx("wave", touchedPlayer || victim?.isPlayer ? 1 : 0.6);
    this.room.impact(x, y, 1.3, (n, v) => this.sfx(n, v, 120));
    this.feathers(x, y - 30, this.ctx.reducedMotion ? 3 : 14, 170);
    const g = this.add.graphics().setDepth(y + 2).setPosition(x, y);
    g.lineStyle(10, 0x1d1830, 0.8);
    g.strokeEllipse(0, 0, rx * 2, ry * 2);
    g.lineStyle(6, 0xffc83d, 1);
    g.strokeEllipse(0, 0, rx * 2, ry * 2);
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(220, () => g.destroy());
      return;
    }
    g.setScale(0.2);
    this.tweens.add({ targets: g, scale: 1, alpha: 0, duration: 420, ease: "Quad.easeOut", onComplete: () => g.destroy() });
    if (touchedPlayer) this.cameras.main.shake(140, 0.004);
  }

  private onBounce(p: Pillow, blockIndex: number, x: number, y: number) {
    const blk = this.room.blockOf(blockIndex);
    const prop = blk?.prop ?? null;
    prop?.boing((n, v) => this.sfx(n, v, 90), 1);
    if (prop?.def.key === "sofa") this.room.hopCushions();
    this.feathers(x, y - p.z, 3, 40);
    const last = this.lastSound.get("boing-word") ?? -9999;
    if ((p.owner.isPlayer || this.time.now - last > 900) && !this.attract) {
      this.lastSound.set("boing-word", this.time.now);
      this.word("BOING!", x, y - p.z - 30, "#ffc83d", p.owner.isPlayer ? 34 : 28);
    }
    const g = this.add.graphics().setDepth(y + 4).setPosition(x, y - p.z);
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      g.lineStyle(5, 0x1d1830, 0.9);
      g.lineBetween(Math.cos(a) * 18, Math.sin(a) * 18, Math.cos(a) * 34, Math.sin(a) * 34);
      g.lineStyle(3, 0xffc83d, 1);
      g.lineBetween(Math.cos(a) * 18, Math.sin(a) * 18, Math.cos(a) * 34, Math.sin(a) * 34);
    }
    this.tweens.add({ targets: g, alpha: 0, scale: 1.3, duration: 240, onComplete: () => g.destroy() });
  }

  private updatePillows(t: number, dt: number) {
    const arena = ARENAS[this.levelIndex];
    for (const p of this.pillows) {
      if (!p.alive || !p.flying) continue;
      const px = p.x;
      const py = p.y;
      p.update(dt);
      if (!p.flying) {
        this.feathers(p.x, p.y - 10, 3, 40);
        this.sfx("plop", 0.35, 90);
        this.room.impact(p.x, p.y, 0.4, (n, v) => this.sfx(n, v, 120));
        if (p.special && !this.attract) this.wave(p.x, p.y, p.owner, null);
        this.missed(p);
        continue;
      }
      let hit = false;
      const hx = BODY.rx * (p.special ? SPECIAL.hit : 1);
      const hy = BODY.ry * (p.special ? SPECIAL.hit : 1);
      for (const f of this.mode === "over" ? [] : this.fighters) {
        if (!f.alive || f === p.owner || p.z < 8) continue;
        const dx = (p.x - f.x) / hx;
        const dy = (p.y - f.y) / hy;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) {
          const relevant = f.isPlayer || p.owner.isPlayer;
          const nx = (p.x - f.x) / (hx * 1.5);
          const ny = (p.y - f.y) / (hy * 2.8);
          if (relevant && nx * nx + ny * ny < 1) {
            if (f.isPlayer) p.nearPlayer = true;
            else p.nearFoe = f;
          } else if (relevant && (f.isPlayer ? p.nearPlayer : p.nearFoe === f)) {
            this.missed(p);
            p.nearPlayer = false;
            p.nearFoe = null;
          }
          continue;
        }
        if (t < f.invulnUntil) continue;
        const held = f.special;
        if (f.hurt(t, p.vx, p.vy, p.owner, p.special ? SPECIAL.knock : 1)) {
          if (held && !f.alive) {
            this.spawner?.lost(this.matchTime);
            this.hud?.setSpecial(f.kid, false);
          }
          this.onHit(p, f);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      if (!p.special) {
        const blk = firstTallHit(this.room.boxes, px, py, p.x, p.y);
        if (blk) {
          const bx = px + (p.x - px) * blk.t;
          const by = py + (p.y - py) * blk.t;
          if (blk.box.bouncy && p.bounces < 1) {
            p.bounce(blk.side, bx, by);
            this.onBounce(p, blk.box.index, bx, by);
            continue;
          }
          this.feathers(bx, by - p.z, 6, 60);
          this.sfx("thud", 0.6, 60);
          this.room.blockOf(blk.box.index)?.prop?.poke(0.9, Math.sign(p.vx) || 1, (n, v) => this.sfx(n, v, 120));
          this.room.impact(bx, by, 0.7, (n, v) => this.sfx(n, v, 120));
          p.stop(bx, by, p.z);
          this.missed(p);
          continue;
        }
      }
      if (p.y < arena.bounds.y0 - 70) {
        this.feathers(p.x, p.y - p.z, 5, 50);
        this.sfx("thud", 0.45, 60);
        this.room.impact(p.x, p.y, 0.8, (n, v) => this.sfx(n, v, 120));
        if (p.special && !this.attract) this.wave(p.x, arena.bounds.y0, p.owner, null);
        p.stop(p.x, p.y, p.z);
        this.missed(p);
        continue;
      }
      if (p.x < 20 || p.x > W - 20 || p.y > H + 30) {
        this.missed(p);
        p.kill();
      }
    }
    this.pillows = this.pillows.filter((p) => p.alive);
  }

  private watchHiding(t: number) {
    const p = this.player;
    const foes = this.fighters.filter((f) => f.alive && !f.isPlayer);
    const hiding = this.mode === "play" && Boolean(p?.alive) && foes.length === 2 && t - this.engagedAt > HIDE_MS;
    if (hiding && !this.truce) {
      const lines = this.text.hiding;
      foes.forEach((f, i) => this.word(lines[i % lines.length], f.x, f.top - 40, "#ff8a3d", 34));
      this.sfx("warn", 0.8);
      this.ctx.onEvent({ type: "announce", message: this.text.truce });
    }
    this.truce = hiding;
    return hiding ? p : null;
  }

  private missed(p: Pillow) {
    if (p.owner.isPlayer && p.nearFoe) this.engagedAt = this.t;
    if (p.hitSomeone || this.mode !== "play") return;
    const now = this.time.now;
    const pl = this.player;
    if (p.nearPlayer && pl && pl.alive && now - this.lastUfa > 1400) {
      this.lastUfa = now;
      this.word(this.text.phew, pl.x + 40, pl.top - 30, "#9df0dc", 34);
    } else if (p.nearFoe && p.nearFoe.alive && now - this.lastQuase > 1200) {
      this.lastQuase = now;
      const foe = p.nearFoe;
      if (now - this.lastTaunt > 5000 && Math.random() < 0.4) {
        this.lastTaunt = now;
        this.word(Phaser.Utils.Array.GetRandom(this.text.taunts) as string, foe.x, foe.top - 30, foe.isPlayer ? "#fbf5e6" : KID_INFO[foe.kid].css, 32);
      } else this.word(this.text.close, foe.x, foe.top - 30, "#fbf5e6", 32);
    }
  }

  private telegraph(f: Fighter, t: number) {
    const img = cartoonText(this, f.x, f.top - 40, "!", { size: 58, color: "#ff8a3d", font: this.ctx.fonts.display, stroke: 0.24 }).setOrigin(0.5).setDepth(1455);
    if (!this.ctx.reducedMotion) {
      img.setScale(0.3);
      this.tweens.add({ targets: img, scale: 1, duration: 120, ease: "Back.easeOut" });
    }
    this.alerts.push({ f, img, until: t + this.aiWindup + 60 });
    this.sfx("warn", 0.7);
    this.ctx.onEvent({ type: "announce", message: this.text.incoming(KID_INFO[f.kid].name), transient: true });
  }

  private onHit(p: Pillow, f: Fighter) {
    const owner = p.owner;
    owner.hits += 1;
    if (owner.isPlayer) this.engagedAt = this.t;
    p.hitSomeone = true;
    if (f.isPlayer) this.playerSafeUntil = Math.max(this.playerSafeUntil, this.t + 1000);
    const playerInvolved = f.isPlayer || owner.isPlayer;
    if (f.isPlayer) this.damageTaken += 1;
    const y = f.y - 120;
    this.impact(p.img.x, p.img.y, f.y + 4, !f.alive);
    this.heartPop(f);
    if (f.isPlayer && this.hurtFlash) {
      this.tweens.killTweensOf(this.hurtFlash);
      this.hurtFlash.setAlpha(0.45);
      this.tweens.add({ targets: this.hurtFlash, alpha: 0, duration: 420, ease: "Quad.easeOut" });
    }
    this.feathers(f.x, y, f.alive ? 7 : 16, f.alive ? 80 : 140);
    this.word(Phaser.Utils.Array.GetRandom(this.text.hitWords) as string, f.x + Phaser.Math.Between(-20, 20), f.top - 20, "#ffc83d", f.alive ? 46 : 56);
    this.sfx("hit", playerInvolved ? 0.95 : 0.55);
    if (f.isPlayer && this.time.now - this.lastOuch > 300) {
      this.lastOuch = this.time.now;
      this.sfx("ouch", 0.8);
    }
    if (playerInvolved && !this.ctx.reducedMotion) {
      this.freezeUntil = this.time.now + (f.alive ? 45 : 90);
      if (f.isPlayer || !f.alive) this.cameras.main.shake(f.alive ? 90 : 120, f.alive ? 0.0035 : 0.004);
    }
    this.room.impact(f.x, f.y, 0.7, (n, v) => this.sfx(n, v, 120));
    p.stop(p.x, p.y, p.z, true);
    if (p.special) {
      this.word(this.text.thump, f.x, f.top - 80, "#ffc83d", 64);
      this.wave(f.x, f.y, owner, f);
    }
    if (!this.attract && owner.alive) this.hud?.cheerFace(owner.kid);
    if (this.attract) {
      if (f.hp < 4) f.hp = HP;
      return;
    }
    this.hud?.setHp(f.kid, f.hp, "hit");
    if (f.isPlayer && f.alive) this.ctx.onEvent({ type: "announce", message: this.text.hit(this.text.hearts(f.hp)) });
    if (owner.isPlayer) this.ctx.onEvent({ type: "score", score: owner.hits * SCORE.hit + owner.kos * SCORE.ko });
    if (!f.alive) this.onKo(f, owner);
  }

  private onKo(f: Fighter, by: Fighter) {
    by.kos += 1;
    this.sfx("ko", 1);
    this.word(this.text.knockout, f.x, f.top - 70, "#ef4f43", 60);
    this.time.delayedCall(650, () => {
      this.feathers(f.x, f.y - 40, 12, 120);
      this.orbitStars(f);
    });
    const name = KID_INFO[f.kid].name;
    this.ctx.onEvent({ type: "announce", message: f.isPlayer ? this.text.youOut : this.text.kidOut(name) });
    this.checkEnd();
  }

  private orbitStars(f: Fighter) {
    if (this.ctx.reducedMotion) return;
    const stars = [0, 1, 2].map(() => this.add.image(f.x, f.y - 150, "star").setScale(0.55).setDepth(f.y + 1));
    const state = { a: 0 };
    this.tweens.add({
      targets: state,
      a: Math.PI * 2,
      duration: 1400,
      repeat: -1,
      onUpdate: () => stars.forEach((s, i) => s.setPosition(f.x - 6 + Math.cos(state.a + (i * Math.PI * 2) / 3) * 50, f.y - 160 + Math.sin(state.a + (i * Math.PI * 2) / 3) * 14)),
    });
  }

  private escalate() {
    if (this.heatStage === 0 && this.matchTime >= ESCALATE.heat) {
      this.heatStage = 1;
      for (const f of this.fighters) f.regenScale = 1.7;
      this.hud?.flash(this.text.heat, "#ff8a3d", 1500, this.text.heatSub);
      this.sfx("alarm", 0.8);
      this.ctx.onEvent({ type: "announce", message: this.text.heatSay });
    } else if (this.heatStage === 1 && this.matchTime >= ESCALATE.final) {
      this.heatStage = 2;
      for (const f of this.fighters) f.regenScale = 0;
      this.hud?.flash(this.text.final, "#ef4f43", 1600, this.text.finalSub);
      this.sfx("alarm", 1);
      this.ctx.onEvent({ type: "announce", message: this.text.finalSay });
    }
  }

  private checkEnd() {
    if (this.mode !== "play") return;
    const p = this.player!;
    const others = this.fighters.filter((f) => f !== p && f.alive);
    if (!p.alive) this.finish(false, others);
    else if (others.length === 0) this.finish(true, []);
  }

  private finish(won: boolean, others: Fighter[]) {
    this.mode = "over";
    this.mouseDown = false;
    const hud = this.hud!;
    const p = this.player!;
    hud.hideControls();
    this.input.setDefaultCursor("default");
    const reduced = this.ctx.reducedMotion;
    for (const f of this.fighters) {
      f.vx = 0;
      f.vy = 0;
      f.cancelThrow();
    }
    const placement = won ? 1 : others.length === 1 ? 2 : 3;
    const winner = won ? p : others.length === 1 ? others[0] : null;
    this.endAt = this.time.now;
    this.hud?.hideHint();
    this.drop?.vanish();
    this.drop = null;
    for (const f of this.fighters) if (f.special) this.hud?.setSpecial(f.kid, false);
    this.fighters.filter((f) => !f.alive).forEach((f, i) => this.time.delayedCall(won ? 650 + i * 260 : 1250 + i * 260, () => this.plopOn(f)));
    this.time.delayedCall(won ? 300 : 900, () => {
      if (winner) {
        winner.cheer();
        hud.setCheer(winner.kid);
        if (!reduced) {
          this.celebrateCamera(winner);
          this.confetti(winner.x, winner.y - 260);
        }
      }
      if (won) {
        hud.flash(this.text.youWin, "#ffc83d", 1900, winShout(this.levelIndex, this.locale), true);
        this.starBurst();
        this.sfx("win", 1);
        this.time.delayedCall(350, () => this.sfx("cheer", 0.9));
      } else if (winner) {
        hud.flash(this.text.kidWins(KID_INFO[winner.kid].name), "#fbf5e6", 1900, this.text.again, true);
        this.sfx("lose", 1);
      } else {
        hud.flash(this.text.knockout, "#ef4f43", 1900, this.text.lost);
        this.sfx("lose", 1);
      }
    });
    hud.hideTop();

    const hits = p.hits;
    const kos = p.kos;
    const { rows, score, stars } = matchScore({ won, place: placement, hits, kos, hp: p.alive ? p.hp : 0 }, this.locale);
    const stats = loadStats();
    stats.matches += 1;
    if (!this.registry.get("forcedKid")) stats.lastKid = p.kid;
    if (won) {
      stats.wins[p.kid] += 1;
      if (!stats.bestTime || this.matchTime < stats.bestTime) stats.bestTime = Math.round(this.matchTime);
    }
    saveStats(stats);
    const achievements: string[] = [];
    if (won) achievements.push("pajama-first");
    if (won && this.damageTaken === 0) achievements.push("pajama-flawless");
    if (won && KIDS.every((k) => stats.wins[k] > 0)) achievements.push("pajama-trio");
    const arena = ARENAS[this.levelIndex];
    const record = getGameRecord("pajama-war");
    const copy = resultCopy({
      arena: this.levelIndex,
      total: ARENAS.length,
      won,
      place: placement,
      kid: p.kid,
      winner: winner ? winner.kid : null,
      beatenBefore: ARENAS.map((a) => (record.levels?.[a.id]?.stars ?? 0) > 0),
    }, this.locale);
    const result: GameResult = {
      won,
      score,
      stars,
      breakdown: rows.filter((r, i) => i === 0 || r.value !== 0),
      stats: {
        hits,
        kos,
        throws: p.throws,
        hp: p.alive ? p.hp : 0,
        damageTaken: this.damageTaken,
        place: placement,
        timeMs: Math.round(this.matchTime),
        kid: KIDS.indexOf(p.kid),
      },
      achievements,
      level: { index: this.levelIndex, id: arena.id, title: arena.title[this.locale], total: ARENAS.length },
      copy,
      summary: this.text.summary(fmt(this.matchTime), p.throws, hits),
      ...(won && stars < 3 ? { starHint: this.text.starHint(stars) } : {}),
      alt: this.text.alt,
      featured: p.kid,
    };
    this.ctx.onEvent({ type: "score", score });
    this.pending = result;
    this.resultTimer = this.time.delayedCall(won ? 2600 : 2400, () => this.sendResult());
  }

  private celebrateCamera(winner: Fighter) {
    const cam = this.cameras.main;
    const f = this.frame;
    if (f.kind === "full") {
      cam.pan(Phaser.Math.Clamp(winner.x, W / 2 - 300, W / 2 + 300), Phaser.Math.Clamp(winner.y - 150, H / 2 - 160, H / 2 + 160), 900, "Sine.easeInOut");
      cam.zoomTo(1.18, 900, "Sine.easeInOut");
      return;
    }
    const z = f.zoom * 1.12;
    const vw = f.width / z;
    const vh = f.height / z;
    const shift = (f.height / 2 - (f.hud + f.height - f.deck) / 2) / z;
    const minTop = f.kind === "tall" ? Math.max(-WALL_EXT, this.ceilingY) : 0;
    const maxBottom = f.kind === "tall" ? LIP + f.deck / z : H;
    const cx = vw >= W ? W / 2 : Phaser.Math.Clamp(winner.x, vw / 2, W - vw / 2);
    const cy = Phaser.Math.Clamp(winner.y - 130 + shift, minTop + vh / 2, Math.max(minTop + vh / 2, maxBottom - vh / 2));
    cam.pan(cx, cy, 900, "Sine.easeInOut");
    cam.zoomTo(z, 900, "Sine.easeInOut");
  }

  private sendResult() {
    const result = this.pending;
    if (!result) return;
    this.pending = null;
    this.resultTimer?.remove();
    this.resultTimer = null;
    this.ctx.onEvent({ type: "finished", result });
  }

  private skipCelebration() {
    if (!this.pending || this.time.now - this.endAt < SKIP_AFTER) return;
    this.sendResult();
  }

  private plopOn(f: Fighter) {
    const reduced = this.ctx.reducedMotion;
    const x = f.x + 6;
    const y = f.y - 46;
    const img = this.add.image(x, reduced ? y : y - 420, "pillow").setScale(0.56).setTint(0xb8aec8).setDepth(f.y + 2).setAngle(-20);
    const land = () => {
      this.sfx("plop", 0.7);
      this.feathers(x, y, 5, 50);
      if (reduced) return;
      img.setScale(0.7, 0.42);
      this.tweens.add({ targets: img, scaleX: 0.58, scaleY: 0.5, duration: 260, ease: "Back.easeOut" });
      this.tweens.add({ targets: f.sprite, angle: { from: -7, to: 7 }, duration: 110, yoyo: true, repeat: 3, onComplete: () => f.sprite.setAngle(0) });
    };
    if (reduced) {
      land();
      return;
    }
    this.tweens.add({ targets: img, y, angle: 12, duration: 340, ease: "Quad.easeIn", onComplete: land });
  }

  private starBurst() {
    if (this.ctx.reducedMotion || !this.uiCam) return;
    this.buildingHud = true;
    const f = this.frame;
    const u = f.kind === "full" ? 1 : f.unit / 2.4;
    const cx = f.width / 2;
    const cy = f.kind === "full" ? 175 : f.hud + 70 * f.unit;
    for (let i = 0; i < 7; i += 1) {
      const a = -Math.PI + (i / 6) * Math.PI;
      const star = this.add.image(cx, cy, "star").setDepth(2009).setScale(0.4 * u);
      this.tweens.add({
        targets: star,
        x: cx + Math.cos(a) * Phaser.Math.Between(330, 470) * Math.min(u, (f.width * 0.42) / 470),
        y: cy + (Math.sin(a) * Phaser.Math.Between(110, 170) + 30) * u,
        scale: Phaser.Math.FloatBetween(1, 1.5) * u,
        angle: Phaser.Math.Between(-180, 180),
        duration: 520,
        ease: "Back.easeOut",
      });
      this.tweens.add({ targets: star, alpha: 0, delay: 1300, duration: 400, onComplete: () => star.destroy() });
    }
    this.buildingHud = false;
  }

  private confetti(x: number, y: number) {
    const colors = [0xef4f43, 0xffc83d, 0x63d6c1, 0x5cb9f0, 0xf06ba8, 0x8a6fd6];
    for (let i = 0; i < 40; i += 1) {
      const c = this.add.image(x + Phaser.Math.Between(-60, 60), y, "confetti").setTint(colors[i % colors.length]).setDepth(1460).setAngle(Phaser.Math.Between(0, 180));
      this.tweens.add({
        targets: c,
        x: c.x + Phaser.Math.Between(-420, 420),
        y: y + Phaser.Math.Between(120, 420),
        angle: c.angle + Phaser.Math.Between(180, 720),
        alpha: { from: 1, to: 0 },
        duration: Phaser.Math.Between(1200, 2000),
        ease: "Quad.easeOut",
      });
    }
    this.feathers(x, y + 120, 16, 220);
  }
}
