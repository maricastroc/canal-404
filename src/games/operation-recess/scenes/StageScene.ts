import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import { ARENA_GROW, ARENA_ZOOM, EXTRAS_CAP, FLOOR_Y, H, HEARTS, HIT_STOP_MS, INVULN_MS, JUMP_V, KID_SCALE, KNOCK_X, KNOCK_Y, SCORE, TILE, W, ZOOM } from "../config";
import { COPY, levelCopy, type LevelCopy, type RecessCopy } from "../copy";
import { FULL_FRAME, type Frame } from "../layout";
import { LEVELS, type LevelDef } from "../levels";
import { recessStarHint, recessStars } from "../score";
import { RECESS_SFX, type RecessSfx } from "../sounds";
import { INK_HEX, cartoonText } from "../../kit/ui";
import { Inspector } from "./boss";
import { FrameCamera, type Focus, type High } from "./camera";
import { TouchDeck } from "./deck";
import { makeEnemy, ShieldMonitor, Wave, WhistleMonitor, type Enemy, type HeroView, type StageApi } from "./enemies";
import { Ball, BallSpawner, Bell, Cart, Item } from "./hazards";
import { currentFrame, watchFrame } from "./frame";
import { Locker, makeGadgetTextures, Pad, Rope, Searchlight, Watcher, WobblyShelf, type HeroState } from "./gadgets";
import { RecessHud } from "./hud";
import { EdgeMarkers, type Mark } from "./markers";
import { Hero } from "./player";
import { Scenery } from "./scenery";
import { buildWorld, cx, cy, type World } from "./world";

type Mode = "attract" | "play" | "ko" | "won";
type Lesson = "walk" | "jump" | "attack" | "locker" | "watcher" | "rope" | "pad" | "light" | "shield" | "wobbly" | "high";
type Anchor = () => { x: number; y: number } | null;
type Chip = { box: Phaser.GameObjects.Container; half: number; lift: number; dx: number; leaving: boolean; anchor?: Anchor; tip?: Phaser.GameObjects.Graphics; at?: { x: number; y: number } };
type Hint = { lesson: Lesson; anchor: Anchor; past: number };
type Checkpoint = { level: number; col: number; score: number; kills: number; killScore: number; stickers: number; extras: number; hits: number };
type Warning = { text: Phaser.GameObjects.Text; x: number; y: number };

const TOUCH_UI = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
const STEP_MAX_MS = 50;
const FRAME_MAX_MS = 200;
const FIGHT_RANGE = 480;
const learned = new Set<Lesson>();

export class StageScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private copy!: RecessCopy;
  private text!: LevelCopy;
  private levelIndex = 0;
  private level!: LevelDef;
  private world!: World;
  private hero!: Hero;
  private hud!: RecessHud;
  private enemies: Enemy[] = [];
  private waves: Wave[] = [];
  private balls: Ball[] = [];
  private spawners: BallSpawner[] = [];
  private carts: Cart[] = [];
  private items: Item[] = [];
  private bells: Bell[] = [];
  private lockers: Locker[] = [];
  private watchers: Watcher[] = [];
  private ropes: Rope[] = [];
  private pads: Pad[] = [];
  private spotlights: Searchlight[] = [];
  private shelves: WobblyShelf[] = [];
  private boss: Inspector | null = null;
  private arena = { left: 0, right: 0, entered: false };
  private gate: Phaser.GameObjects.Zone | null = null;
  private keys!: Record<"left" | "right" | "a" | "d" | "space" | "up" | "w", Phaser.Input.Keyboard.Key>;
  private mode: Mode = "attract";
  private t = 0;
  private hitStopUntil = 0;
  private hearts = HEARTS;
  private score = 0;
  private kills = 0;
  private killScore = 0;
  private stickers = 0;
  private extras = 0;
  private resumed = false;
  private hits = 0;
  private invulnUntil = 0;
  private safe = { x: 0, y: 0 };
  private lookAhead = 0;
  private camTop = 0;
  private tutorialOn = false;
  private tutorialFrom = 0;
  private lesson: Lesson | null = null;
  private lessonUntil = 0;
  private lessonPast = Infinity;
  private hintsAt = 0;
  private shown = new Set<Lesson>();
  private chips: Chip[] = [];
  private exitZone: Phaser.Geom.Rectangle | null = null;
  private lastSound = new Map<string, number>();
  private api!: StageApi;
  private uiCam: Phaser.Cameras.Scene2D.Camera | null = null;
  private buildingHud = false;
  private scenery!: Scenery;
  private frame: Frame = FULL_FRAME;
  private frameCam!: FrameCamera;
  private deck!: TouchDeck;
  private markers!: EdgeMarkers;
  private vignette!: Phaser.GameObjects.Image;
  private warnings: Warning[] = [];
  private controlsOn = false;
  private lastDt = 0;

  constructor() {
    super("stage");
  }

  init() {
    this.enemies = [];
    this.waves = [];
    this.balls = [];
    this.spawners = [];
    this.carts = [];
    this.items = [];
    this.bells = [];
    this.lockers = [];
    this.watchers = [];
    this.ropes = [];
    this.pads = [];
    this.spotlights = [];
    this.shelves = [];
    this.boss = null;
    this.arena = { left: 0, right: 0, entered: false };
    this.gate = null;
    this.mode = "attract";
    this.t = 0;
    this.hitStopUntil = 0;
    this.hearts = HEARTS;
    this.score = 0;
    this.kills = 0;
    this.killScore = 0;
    this.stickers = 0;
    this.extras = 0;
    this.resumed = false;
    this.hits = 0;
    this.invulnUntil = 0;
    this.lookAhead = 0;
    this.camTop = 0;
    this.tutorialOn = false;
    this.lesson = null;
    this.lessonUntil = 0;
    this.lessonPast = Infinity;
    this.hintsAt = 0;
    this.shown = new Set();
    this.chips = [];
    this.exitZone = null;
    this.lastSound = new Map();
    this.warnings = [];
    this.controlsOn = false;
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.levelIndex = Phaser.Math.Clamp((this.registry.get("level") as number | undefined) ?? 0, 0, LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    this.copy = COPY[this.ctx.locale];
    this.text = levelCopy(this.copy, this.level.id);
    const reduced = this.ctx.reducedMotion;
    const cp = this.registry.get("checkpoint") as Checkpoint | null;
    const resume = Boolean(this.registry.get("resume")) && cp?.level === this.levelIndex ? cp : null;
    if (!resume) this.registry.set("checkpoint", null);

    this.frame = currentFrame(this);
    this.frameCam = new FrameCamera(this.cameras.main);
    this.cameras.main.setZoom(ZOOM);
    this.uiCam = this.cameras.add(0, 0, this.frame.width, this.frame.height).setName("ui");
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.route, this);
    this.scenery = new Scenery(this, this.level, this.level.length * TILE, reduced);
    this.world = buildWorld(this, this.level);
    const width = this.world.width;
    this.physics.world.setBounds(0, -400, width, H + 800);
    this.cameras.main.setBounds(0, 0, width, H);
    this.cameras.main.setBackgroundColor("#1d1830");

    this.api = {
      scene: this,
      reduced,
      words: this.copy.words,
      sfx: (name, volume) => this.sfx(name, volume),
      warn: (x, y, ms) => this.warn(x, y, ms),
      word: (text, x, y, color, size) => this.word(text, x, y, color, size),
      burst: (x, y, n, tex) => this.burst(x, y, n, tex),
      dust: (x, y, dir) => this.dust(x, y, dir),
      spawnWave: (x, y, dir, big) => this.waves.push(new Wave(this, x, y, dir, big)),
      groundAt: (x) => this.world.groundAt(x) || this.carts.some((c) => Math.abs(c.img.x - x) < 120),
      quake: (power) => this.scenery.quake(power),
      room: (event, dir) => this.scenery.room(event, dir),
      busy: (self) => this.crowded(self),
      clang: (x, y) => this.clang(x, y),
    };

    if (this.level.exit) {
      const ex = cx(this.level.exit.col) + TILE / 2;
      this.add.image(ex, FLOOR_Y, "door-plain").setOrigin(0.5, 1).setDepth(3);
      const plaque = cartoonText(this, ex, FLOOR_Y - 290, this.level.exit.label, { size: 34, color: "#1d1830", font: this.ctx.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5).setDepth(3.2);
      const pg = this.add.graphics().setDepth(3.1);
      pg.fillStyle(INK_HEX, 1);
      pg.fillRoundedRect(ex - plaque.width / 2 - 18, FLOOR_Y - 318, plaque.width + 36, 56, 10);
      pg.fillStyle(0xffc83d, 1);
      pg.fillRoundedRect(ex - plaque.width / 2 - 14, FLOOR_Y - 314, plaque.width + 28, 48, 8);
      this.exitZone = new Phaser.Geom.Rectangle(ex - 50, FLOOR_Y - 250, 100, 250);
    }
    for (const c of this.level.carts ?? []) this.carts.push(new Cart(this, c));
    for (const it of this.level.items) this.items.push(new Item(this, it.kind, it.col, it.row, reduced));
    for (const col of this.level.checkpoints) this.bells.push(new Bell(this, col));
    for (const b of this.level.balls ?? []) this.spawners.push(new BallSpawner(this.api, b, (ball) => this.balls.push(ball)));
    makeGadgetTextures(this);
    (this.level.lockers ?? []).forEach((col, i) => this.lockers.push(new Locker(this.api, col, i, i === 0 && !resume)));
    for (const w of this.level.watchers ?? []) this.watchers.push(new Watcher(this.api, w.col, w.look, this.ctx.fonts.display, (x, dir) => this.mode === "play" && this.waves.push(new Wave(this, x, FLOOR_Y, dir, true))));
    for (const r of this.level.ropes ?? []) this.ropes.push(new Rope(this.api, r));
    for (const col of this.level.pads ?? []) this.pads.push(new Pad(this.api, col));
    for (const l of this.level.lights ?? []) this.spotlights.push(new Searchlight(this.api, l));
    for (const pl of this.level.platforms) if (pl.wobbly) this.shelves.push(new WobblyShelf(this.api, pl));

    const startCol = resume ? resume.col : this.level.start;
    if (resume) {
      this.score = resume.score;
      this.kills = resume.kills;
      this.killScore = resume.killScore;
      this.stickers = resume.stickers;
      this.extras = resume.extras;
      this.hits = resume.hits;
      this.resumed = true;
      for (const b of this.bells) if (b.x <= cx(resume.col) + TILE) b.ring(this, true);
      this.ctx.onEvent({ type: "score", score: this.score });
    }
    for (const e of this.level.enemies) {
      if (resume && e.col < startCol + 4) continue;
      const feet = cy((e.row ?? 11) + 1);
      this.enemies.push(makeEnemy(this.api, e.kind, cx(e.col) + TILE / 2, feet, e.style));
    }
    if (resume) for (const it of this.items) if (it.img.x < cx(startCol)) it.take(this);

    if (this.level.boss) {
      this.arena.left = cx(this.level.boss.arena);
      this.arena.right = this.arena.left + W;
      this.boss = new Inspector(this.api, this.arena.right - 360, this.arena.left, this.arena.right);
    }

    this.hero = new Hero(this, cx(startCol) + TILE / 2 + (resume ? 60 : 0), FLOOR_Y, {
      sfx: (name, volume) => this.sfx(name, volume, name === "step" ? 120 : 0),
      dust: (x, y, dir) => this.dust(x, y, dir),
    });
    this.safe = { x: this.hero.rect.x, y: this.hero.rect.y };
    this.hero.body.moves = false;

    const solids = this.world.solids;
    const oneWays = this.world.oneWays;
    const carts = this.carts.map((c) => c.img);
    this.physics.add.collider(this.hero.rect, solids);
    this.physics.add.collider(this.hero.rect, oneWays);
    for (const z of [...this.pads.map((p) => p.zone), ...this.shelves.map((s) => s.zone)]) this.physics.add.collider(this.hero.rect, z);
    if (carts.length) this.physics.add.collider(this.hero.rect, carts);
    for (const e of this.enemies) {
      this.physics.add.collider(e.rect, solids);
      this.physics.add.collider(e.rect, oneWays);
      if (carts.length) this.physics.add.collider(e.rect, carts);
    }
    if (this.boss) this.physics.add.collider(this.boss.rect, solids);

    this.camTop = H - H / ZOOM;
    this.cameras.main.startFollow(this.hero.rect, true, 0.14, 0, 0, 0);
    this.cameras.main.centerOn(this.hero.rect.x + 400, H - H / ZOOM / 2);

    this.buildingHud = true;
    const vignette = { corridor: 0.32, yard: 0.18, office: 0.5 }[this.level.theme];
    this.vignette = this.add.image(0, 0, "vignette").setOrigin(0, 0).setDisplaySize(W, H).setScrollFactor(0).setDepth(50).setAlpha(vignette);
    this.hud = new RecessHud(this, this.ctx.fonts, this.text.title, this.levelIndex, LEVELS.length, reduced, this.ctx.locale, (a) => this.onPad(a));
    this.deck = new TouchDeck(this, this.ctx.fonts, this.copy.deck, this.level.theme, this.hud.touch, (a) => this.onPad(a), reduced);
    this.markers = new EdgeMarkers(this, this.ctx.fonts, reduced);
    this.buildingHud = false;
    this.hud.setHearts(this.hearts);
    this.hud.setScore(this.score);
    this.hud.setMonitors(this.kills, this.level.enemies.length);
    this.updateProgress();
    this.setupInput();

    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncVisual, this);
    this.events.on(Phaser.Scenes.Events.RESUME, this.onResume, this);
    watchFrame(this, (frame) => this.applyFrame(frame));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RESUME, this.onResume, this);
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncVisual, this);
      this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.route, this);
      this.uiCam = null;
    });

    if (!this.registry.get("readySent")) {
      this.registry.set("readySent", true);
      this.ctx.onReady();
    }
    if (this.registry.get("autostart")) {
      this.registry.set("autostart", false);
      this.begin(Boolean(resume));
    }
  }

  private crowded(self: Enemy) {
    if (!this.hero) return false;
    const hx = this.hero.x;
    const side = Math.sign(self.x - hx);
    const gap = Math.abs(self.x - hx);
    return this.enemies.some((o) => o !== self && !o.dead && o.kind !== "whistle" && Math.sign(o.x - hx) === side && Math.abs(o.x - hx) < gap && Math.abs(o.x - hx) < 340 && Math.abs(o.feet - self.feet) < 60);
  }

  private route(obj: Phaser.GameObjects.GameObject) {
    if (this.buildingHud) this.cameras.main.ignore(obj);
    else this.uiCam?.ignore(obj);
  }

  get currentLevel() {
    return this.levelIndex;
  }

  get isAttract() {
    return this.mode === "attract";
  }

  begin(resumed = false) {
    if (this.mode !== "attract") return;
    this.mode = "play";
    this.hero.body.moves = true;
    this.setControls(true);
    if (resumed) {
      this.hud.flash(this.copy.banner.backAtBell, "#63d6c1", 900);
      this.announce(this.copy.say.resumed);
      return;
    }
    this.hud.flash(this.text.title.toUpperCase(), "#ffc83d", 1300, this.text.intro);
    this.hintsAt = this.t + 900;
    this.announce(this.copy.say.levelStart(this.levelIndex + 1, LEVELS.length, this.text.title, this.text.intro));
    if (this.levelIndex === 0 && !(["walk", "jump", "attack"] as Lesson[]).every((l) => learned.has(l))) {
      this.tutorialOn = true;
      this.tutorialFrom = this.hero.x;
      if (!learned.has("walk")) this.teach("walk");
    }
  }

  private get compact() {
    return this.frame.kind !== "full";
  }

  private applyFrame(frame: Frame) {
    const prev = this.frame;
    this.frame = frame;
    const main = this.cameras.main;
    const viewH = frame.height - frame.deck;
    main.setViewport(0, 0, frame.width, viewH);
    this.uiCam?.setSize(frame.width, frame.height);
    this.vignette.setDisplaySize(frame.width, viewH);
    this.scenery.fit(this.compact);
    this.hud.layout(frame, this.scale.displayScale.x);
    this.deck.layout(frame, this.compact);
    this.setControls(this.controlsOn);
    if (this.compact) {
      main.stopFollow();
      main.removeBounds();
      if (prev.kind === "full" || prev !== frame) this.frameCam.reset();
      this.updateCamera(0);
      return;
    }
    this.markers.hide();
    if (prev.kind !== "full") this.desktopCamera();
  }

  private desktopCamera() {
    const cam = this.cameras.main;
    if (this.arena.entered) {
      cam.stopFollow();
      cam.setBounds(this.arena.left, 0, W, H);
      cam.setZoom(ARENA_ZOOM);
      cam.centerOn(this.arena.left + W / 2, H / 2);
      return;
    }
    cam.setZoom(ZOOM);
    cam.setBounds(0, 0, this.world.width, H);
    this.camTop = H - H / ZOOM;
    cam.startFollow(this.hero.rect, true, 0.14, 0, 0, 0);
    cam.centerOn(this.hero.x, H - H / ZOOM / 2);
  }

  private setControls(on: boolean) {
    this.controlsOn = on;
    if (this.compact) {
      this.hud.showTouch(false);
      this.deck.enable(on);
    } else {
      this.deck.enable(false);
      this.hud.showTouch(on && Boolean(TOUCH_UI));
    }
  }

  private onResume() {
    this.deck.release();
  }

  private sfx(name: RecessSfx, volume = 1, throttleMs = 0) {
    if (throttleMs) {
      const last = this.lastSound.get(name) ?? -10000;
      if (this.time.now - last < throttleMs) return;
      this.lastSound.set(name, this.time.now);
    }
    this.ctx.audio.play(RECESS_SFX[name], { volume: Phaser.Math.Clamp(volume, 0.05, 1.2) });
  }

  private announce(message: string) {
    this.ctx.onEvent({ type: "announce", message });
  }

  private word(text: string, x: number, y: number, color: string, size = 48) {
    const t = cartoonText(this, x, y, text, { size, color, font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(40);
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(700, () => t.destroy());
      return;
    }
    t.setScale(0.3).setAngle(Phaser.Math.Between(-8, 8));
    this.tweens.add({ targets: t, scale: 1, duration: 160, ease: "Back.easeOut" });
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, delay: 420, duration: 340, onComplete: () => t.destroy() });
  }

  private burst(x: number, y: number, count: number, tex = "pow") {
    const n = this.ctx.reducedMotion ? Math.min(2, count) : count;
    for (let i = 0; i < n; i += 1) {
      const img = this.add.image(x, y, tex === "pow" ? "spark" : tex).setDepth(39).setScale(Phaser.Math.FloatBetween(0.5, 0.9));
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const d = Phaser.Math.Between(40, 110);
      this.tweens.add({ targets: img, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, angle: Phaser.Math.Between(-120, 120), duration: Phaser.Math.Between(300, 520), onComplete: () => img.destroy() });
    }
  }

  private pow(x: number, y: number, scale = 0.8) {
    const img = this.add.image(x, y, "pow").setDepth(38).setScale(scale * 0.4).setAngle(Phaser.Math.Between(0, 40));
    this.tweens.add({ targets: img, scale, duration: 90, ease: "Back.easeOut" });
    this.tweens.add({ targets: img, alpha: 0, delay: 120, duration: 160, onComplete: () => img.destroy() });
  }

  private dust(x: number, y: number, dir: number) {
    if (this.ctx.reducedMotion) return;
    const img = this.add.image(x - dir * 20, y - 14, "dust").setDepth(19).setScale(0.5).setAlpha(0.9);
    this.tweens.add({ targets: img, x: img.x - dir * 50, y: img.y - 20, scale: 0.9, alpha: 0, duration: 380, onComplete: () => img.destroy() });
  }

  private warn(x: number, y: number, ms: number) {
    const t = cartoonText(this, x, y, "!", { size: 70, color: "#ef4f43", font: this.ctx.fonts.display, stroke: 0.22 }).setOrigin(0.5).setDepth(41);
    this.warnings.push({ text: t, x, y });
    if (!this.ctx.reducedMotion) {
      t.setScale(0.4);
      this.tweens.add({ targets: t, scale: 1.15, duration: 130, ease: "Back.easeOut" });
      this.tweens.add({ targets: t, scale: 0.92, delay: 150, duration: 110, yoyo: true, repeat: Math.max(0, Math.ceil((ms - 150) / 220)) });
    }
    this.time.delayedCall(Math.max(260, ms), () => t.destroy());
    return t;
  }

  private teach(lesson: Lesson) {
    if (this.lesson || this.shown.has(lesson)) return;
    this.shown.add(lesson);
    this.lesson = lesson;
    this.lessonUntil = this.t + 9000;
    this.lessonPast = Infinity;
    const tut = this.copy.tutorial;
    if (this.compact && TOUCH_UI) {
      const role = lesson === "walk" ? "move" : lesson === "jump" ? "jump" : "attack";
      this.deck.coach(role, tut.coach[role]);
      if (lesson === "attack") this.announce(tut.attackTouchSay);
      return;
    }
    if (lesson === "walk") this.showChip(tut.walk, TOUCH_UI ? ["chip-pad-left", "chip-pad-right"] : ["chip-left", "chip-right"]);
    if (lesson === "jump") {
      this.showChip(TOUCH_UI ? tut.jumpTouch : tut.jumpKeys, TOUCH_UI ? ["chip-jump"] : []);
      this.hud.pulseJump(true);
      this.deck.pulseJump(true);
    }
    if (lesson === "attack") {
      this.showChip(TOUCH_UI ? tut.attackTouch : tut.attackKeys, TOUCH_UI ? ["chip-attack"] : []);
      this.announce(TOUCH_UI ? tut.attackTouchSay : tut.attackKeysSay);
    }
  }

  private learn(lesson: Lesson) {
    learned.add(lesson);
    if (this.lesson !== lesson) return;
    this.endLesson();
  }

  private endLesson() {
    if (this.lesson === "jump") {
      this.hud.pulseJump(false);
      this.deck.pulseJump(false);
    }
    this.deck.coach(null);
    this.lesson = null;
    this.hideChip();
  }

  private chipScale() {
    if (!this.compact) return 1;
    const css = this.cameras.main.zoom / this.frame.unit;
    return Math.max(1, 15 / (24 * css));
  }

  private showChip(text: string, icons: string[] = [], anchor?: Anchor) {
    this.hideChip();
    const k = this.chipScale();
    const iconW = 30;
    const iconsW = icons.length ? icons.length * iconW + 4 : 0;
    const wrap = this.compact ? Math.max(200, (this.frameCam.width || this.cameras.main.worldView.width) / k - 70 - iconsW) : 0;
    const label = this.add.text(0, 0, text, { fontFamily: this.ctx.fonts.display, fontSize: "24px", color: "#1d1830", padding: { x: 2, y: 3 }, align: "center", ...(wrap ? { wordWrap: { width: wrap } } : {}) }).setOrigin(0, 0.5);
    const w = iconsW + label.width + 28;
    const h = Math.max(46, label.height + 14);
    const bg = this.add.graphics();
    bg.fillStyle(INK_HEX, 0.9);
    bg.fillRoundedRect(-w / 2 + 3, -h / 2 + 4, w, h, 12);
    bg.fillStyle(0xffc83d, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(3, INK_HEX, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    const parts: Phaser.GameObjects.GameObject[] = [bg];
    let x = -w / 2 + 14;
    for (const key of icons) {
      parts.push(this.add.image(x + iconW / 2, 0, key).setScale(0.8));
      x += iconW;
    }
    if (icons.length) x += 4;
    label.setX(x);
    parts.push(label);
    let tip: Phaser.GameObjects.Graphics | undefined;
    if (anchor) {
      tip = this.add.graphics();
      tip.fillStyle(INK_HEX, 1);
      tip.fillTriangle(-14, h / 2 - 2, 14, h / 2 - 2, 0, h / 2 + 18);
      tip.fillStyle(0xffc83d, 1);
      tip.fillTriangle(-9, h / 2 - 3, 9, h / 2 - 3, 0, h / 2 + 11);
      parts.splice(1, 0, tip);
    }
    const start = anchor?.() ?? { x: this.hero.x, y: this.hero.top - 34 };
    const chip: Chip = { box: this.add.container(start.x, start.y, parts).setDepth(45).setAlpha(0).setScale(k), half: (w / 2) * k, lift: 0, dx: 0, leaving: false, anchor, tip, at: start };
    chip.box.setData("k", k).setData("h", h * k);
    this.chips.push(chip);
    if (this.ctx.reducedMotion) {
      this.tweens.add({ targets: chip.box, alpha: 1, duration: 160 });
      return;
    }
    chip.lift = -10;
    chip.box.setScale(0.9 * k);
    this.tweens.add({ targets: chip.box, alpha: 1, scale: k, duration: 200, ease: "Back.easeOut" });
    this.tweens.add({ targets: chip, lift: 0, duration: 200, ease: "Quad.easeOut" });
  }

  private hideChip() {
    for (const chip of this.chips) {
      if (chip.leaving) continue;
      chip.leaving = true;
      const done = () => {
        chip.box.destroy();
        this.chips = this.chips.filter((c) => c !== chip);
      };
      if (this.ctx.reducedMotion) this.tweens.add({ targets: chip.box, alpha: 0, duration: 160, onComplete: done });
      else {
        this.tweens.add({ targets: chip.box, alpha: 0, scale: 0.92 * ((chip.box.getData("k") as number | undefined) ?? 1), duration: 260, ease: "Quad.easeIn", onComplete: done });
        this.tweens.add({ targets: chip, lift: 18, duration: 260, ease: "Quad.easeOut" });
      }
    }
  }

  private placeChips() {
    if (!this.chips.length) return;
    const foe = this.enemies.filter((e) => !e.dead && Math.abs(e.x - this.hero.x) < 420).sort((a, b) => Math.abs(a.x - this.hero.x) - Math.abs(b.x - this.hero.x))[0];
    const want = foe ? -Math.sign(foe.x - this.hero.x) * 70 : 0;
    const view = this.cameras.main.worldView;
    const field = this.compact ? this.frameCam.playTop(this.frame) : view.y;
    for (const chip of this.chips) {
      if (chip.anchor) {
        const at = chip.anchor() ?? chip.at!;
        chip.at = at;
        const x = Phaser.Math.Clamp(at.x, view.x + chip.half + 16, view.right - chip.half - 16);
        const half = ((chip.box.getData("h") as number | undefined) ?? 46) / 2;
        const y = this.compact ? Phaser.Math.Clamp(at.y, field + half + 24, view.bottom - half - 40) : Phaser.Math.Clamp(at.y, view.y + 150, view.bottom - 160);
        chip.box.setPosition(x, y - chip.lift);
        chip.tip?.setX(Phaser.Math.Clamp(at.x - x, -chip.half + 22, chip.half - 22));
        continue;
      }
      chip.dx = Phaser.Math.Linear(chip.dx, want, 0.12);
      const x = Phaser.Math.Clamp(this.hero.x + chip.dx, view.x + chip.half + 16, view.right - chip.half - 16);
      const half = ((chip.box.getData("h") as number | undefined) ?? 46) / 2;
      const y = this.compact ? Math.max(this.hero.top - 12 - half, field + half + 16) : this.hero.top - 34;
      chip.box.setPosition(x, y - chip.lift);
    }
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      w: Phaser.Input.Keyboard.KeyCodes.W,
    }) as typeof this.keys;
    kb.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ]);
    kb.on("keydown", (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "escape" || key === "p") {
        this.ctx.onEvent({ type: "pause-request" });
        return;
      }
      if (this.mode !== "play" || event.repeat) return;
      if ([" ", "arrowup", "w", "spacebar"].includes(key)) {
        event.preventDefault();
        this.jump();
      } else if (key === "j" || key === "k" || key === "x") {
        this.attack();
      }
    });
  }

  private onPad(action: "left" | "right" | "jump" | "attack") {
    if (this.mode !== "play") return;
    if (action === "jump") this.jump();
    if (action === "attack") this.attack();
  }

  jump() {
    if (this.mode !== "play") return;
    this.hero.requestJump(this.t);
    this.learn("jump");
  }

  attack() {
    if (this.mode !== "play") return;
    if (this.hero.requestAttack(this.t)) this.learn("attack");
  }

  private heroView(): HeroView {
    const b = this.hero.body;
    return { x: b.center.x, feet: b.bottom, top: b.top, grounded: this.hero.grounded };
  }

  private heroRect() {
    const b = this.hero.body;
    return new Phaser.Geom.Rectangle(b.x + 6, b.y + 10, b.width - 12, b.height - 14);
  }

  private addExtra() {
    if (this.extras >= EXTRAS_CAP) return;
    this.extras += 1;
    this.addScore(SCORE.wave);
  }

  private addScore(n: number) {
    this.score += n;
    this.hud.setScore(this.score);
    this.ctx.onEvent({ type: "score", score: this.score });
  }

  private hurt(fromX: number) {
    if (this.t < this.invulnUntil || this.mode !== "play") return;
    this.hearts -= 1;
    this.hits += 1;
    this.invulnUntil = this.t + INVULN_MS;
    this.hero.knock(fromX, this.t, KNOCK_X, KNOCK_Y);
    this.sfx("hurt", 0.9);
    this.hud.setHearts(this.hearts, "lost");
    this.hero.sprite.setTintFill(0xffffff);
    this.time.delayedCall(80, () => this.hero.sprite.clearTint());
    if (!this.ctx.reducedMotion) this.cameras.main.shake(140, 0.006);
    this.word(this.copy.words.ouch[this.hits % this.copy.words.ouch.length], this.hero.x, this.hero.body.top - 40, "#ef4f43", 50);
    if (this.hearts <= 0) {
      this.knockOut();
      return;
    }
    this.announce(this.copy.say.heartsLeft(this.hearts));
  }

  private fell() {
    this.hearts -= 1;
    this.hits += 1;
    this.hud.setHearts(this.hearts, "lost");
    this.sfx("hurt", 0.8);
    if (this.hearts <= 0) {
      this.knockOut();
      return;
    }
    this.hero.body.reset(this.safe.x, this.safe.y);
    this.invulnUntil = this.t + INVULN_MS;
    this.word(this.copy.words.oops, this.safe.x, FLOOR_Y - 240, "#fbf5e6", 54);
    this.announce(this.copy.say.fell);
  }

  private clearShots() {
    for (const e of this.enemies) if (!e.dead) e.body.setVelocityX(0);
    this.boss?.body.setVelocityX(0);
    for (const w of this.waves) {
      if (!w.alive) continue;
      this.tweens.add({ targets: w.img, alpha: 0, duration: 200, onComplete: () => w.kill() });
    }
    for (const b of this.balls) b.kill();
    this.balls = [];
  }

  private knockOut() {
    this.mode = "ko";
    this.clearShots();
    this.hero.dizzy();
    this.burst(this.hero.x, this.hero.body.top - 20, 6, "star");
    if (this.boss && this.arena.entered) this.time.delayedCall(350, () => this.boss?.taunt());
    else {
      const foe = this.enemies.filter((e) => !e.dead && Math.abs(e.x - this.hero.x) < 1100).sort((a, b) => Math.abs(a.x - this.hero.x) - Math.abs(b.x - this.hero.x))[0];
      if (foe) this.time.delayedCall(300, () => foe.taunt());
    }
    this.endLesson();
    this.hud.hideControls();
    this.setControls(false);
    this.hero.body.setVelocityX(0);
    this.sfx("lose", 1);
    const cp = this.registry.get("checkpoint") as Checkpoint | null;
    if (cp) cp.hits = this.hits;
    const lose = this.copy.result;
    this.hud.flash(this.copy.banner.caught, "#ef4f43", 1200, cp ? this.copy.banner.caughtFromBell : this.copy.banner.caughtAgain);
    this.announce(this.copy.say.caught);
    const result: GameResult = {
      won: false,
      score: this.score,
      stars: 0,
      breakdown: this.breakdown(false),
      stats: this.resultStats(false),
      level: { index: this.levelIndex, id: this.level.id, title: this.text.title, total: LEVELS.length },
      copy: { title: lose.loseTitle, text: cp ? lose.loseFromBell : lose.loseText },
      ...(cp ? { restartLabel: lose.restartFromBell } : {}),
      summary: lose.loseSummary(this.kills, this.stickers),
    };
    this.time.delayedCall(1500, () => this.ctx.onEvent({ type: "finished", result }));
  }

  private breakdown(won: boolean) {
    const labels = this.copy.result;
    const rows = [
      { label: labels.monitors(this.kills), value: this.killScore },
      { label: labels.stickers(this.stickers), value: this.stickers * SCORE.sticker },
      { label: labels.extras(this.extras), value: this.extras * SCORE.wave },
    ];
    if (won) {
      rows.push({ label: labels.cleared, value: SCORE.phase });
      if (!this.resumed) rows.push({ label: labels.hearts(this.hearts), value: this.hearts * SCORE.heart });
      if (this.boss) rows.push({ label: labels.boss, value: SCORE.boss });
    }
    return rows.filter((r, i) => i === 0 || r.value !== 0);
  }

  private resultStats(won: boolean) {
    return {
      kills: this.kills,
      killPoints: this.killScore,
      stickers: this.stickers,
      extras: this.extras,
      hits: this.hits,
      hearts: this.hearts,
      resumed: this.resumed ? 1 : 0,
      boss: won && this.boss ? 1 : 0,
      timeMs: Math.round(this.t),
    };
  }

  private win() {
    if (this.mode !== "play") return;
    this.mode = "won";
    this.clearShots();
    this.endLesson();
    this.hud.hideControls();
    this.setControls(false);
    this.hero.body.setVelocity(0, this.hero.body.velocity.y);
    this.hero.cheer();
    this.registry.set("checkpoint", null);
    const bonus = SCORE.phase + (this.resumed ? 0 : this.hearts * SCORE.heart) + (this.boss ? SCORE.boss : 0);
    this.score += bonus;
    this.hud.setScore(this.score);
    this.ctx.onEvent({ type: "score", score: this.score });
    const last = this.levelIndex === LEVELS.length - 1;
    const run = { won: true, hits: this.hits, kills: this.kills, monitors: this.level.enemies.length };
    const stars = recessStars(run);
    const starHint = recessStarHint(run, this.ctx.locale);
    const achievements: string[] = [];
    if (this.levelIndex === 0) achievements.push("recess-first");
    if (this.hits === 0) achievements.push("recess-flawless");
    if (last) achievements.push("recess-boss");
    const result: GameResult = {
      won: true,
      score: this.score,
      stars,
      breakdown: this.breakdown(true),
      stats: this.resultStats(true),
      achievements,
      level: { index: this.levelIndex, id: this.level.id, title: this.text.title, total: LEVELS.length },
      copy: last ? { title: this.copy.result.finalTitle, text: this.copy.result.finalText } : { title: this.copy.result.passedTitle, text: this.copy.result.passedText(this.text.win) },
      summary: this.copy.result.winSummary(this.kills, this.hits),
      ...(starHint ? { starHint } : {}),
    };
    if (last) {
      this.celebrate();
      this.time.delayedCall(3600, () => this.ctx.onEvent({ type: "finished", result }));
      return;
    }
    this.sfx("door", 1);
    this.time.delayedCall(420, () => this.sfx("win", 1));
    this.hud.flash(this.copy.banner.passed, "#93cf4c", 1100, this.copy.banner.next);
    this.kidAtDoor();
    this.announce(this.copy.say.passed(this.text.title));
    this.time.delayedCall(1600, () => this.ctx.onEvent({ type: "finished", result }));
  }

  private kidAtDoor() {
    if (!this.level.exit) return;
    const ex = cx(this.level.exit.col) + TILE / 2;
    const name = this.levelIndex === 0 ? "deco" : "lina";
    const kid = this.add.image(ex, FLOOR_Y, `kid-${name}-a`).setOrigin(0.5, 1).setDepth(3.5).setScale(KID_SCALE);
    this.word(this.copy.words.letsGo, ex + 60, FLOOR_Y - 270, "#ffc83d", 40);
    this.time.addEvent({ delay: 200, repeat: 6, callback: () => kid.setTexture(kid.texture.key.endsWith("-a") ? `kid-${name}-b` : `kid-${name}-a`) });
    if (this.ctx.reducedMotion) return;
    kid.setAlpha(0).setY(FLOOR_Y + 30);
    this.tweens.add({ targets: kid, alpha: 1, y: FLOOR_Y, x: ex + 70, duration: 260, ease: "Back.easeOut" });
    this.tweens.add({ targets: kid, y: FLOOR_Y - 34, duration: 180, delay: 300, yoyo: true, repeat: 2 });
    const colors = [0xef4f43, 0xffc83d, 0x63d6c1, 0x5cb9f0, 0xf06ba8];
    for (let i = 0; i < 16; i += 1) {
      const c = this.add.image(ex, FLOOR_Y - 200, "confetti").setTint(colors[i % colors.length]).setDepth(36);
      this.tweens.add({ targets: c, x: ex + Phaser.Math.Between(-260, 260), y: FLOOR_Y - Phaser.Math.Between(0, 60), angle: Phaser.Math.Between(-400, 400), duration: Phaser.Math.Between(900, 1400), ease: "Quad.easeOut" });
    }
  }

  private celebrate() {
    const reduced = this.ctx.reducedMotion;
    this.sfx("bell", 1);
    this.time.delayedCall(300, () => this.sfx("cheer", 1));
    this.hud.flash(this.copy.banner.recess, "#93cf4c", 2800, this.copy.banner.recessSub);
    this.announce(this.copy.say.recess);
    const left = this.arena.left;
    const view = this.cameras.main.worldView;
    const spread = this.compact ? this.cheerSpots(view) : null;
    const kids: [string, number][] = [
      ["deco", spread?.[0] ?? left + 360],
      ["mila", spread?.[1] ?? left + 1560],
      ["lina", spread?.[2] ?? left + 1760],
    ];
    kids.forEach(([name, x], i) => {
      const fromX = spread ? (x < view.centerX ? view.x - 140 : view.right + 140) : x < left + W / 2 ? left - 120 : left + W + 120;
      const img = this.add.image(fromX, FLOOR_Y, `kid-${name}-a`).setOrigin(0.5, 1).setDepth(14).setScale(KID_SCALE * ARENA_GROW);
      if (reduced) img.setX(x);
      else this.tweens.add({ targets: img, x, duration: 900, delay: i * 180, ease: "Quad.easeOut" });
      this.time.addEvent({ delay: 220, repeat: 14, callback: () => img.setTexture(img.texture.key.endsWith("-a") ? `kid-${name}-b` : `kid-${name}-a`) });
      if (!reduced) this.tweens.add({ targets: img, y: FLOOR_Y - 30, duration: 220, delay: 900 + i * 120, yoyo: true, repeat: 5 });
    });
    if (reduced) return;
    const colors = [0xef4f43, 0xffc83d, 0x63d6c1, 0x5cb9f0, 0xf06ba8, 0x93cf4c];
    const span = spread ? { x: view.x, w: view.width, y: this.frameCam.playTop(this.frame) - 20 } : { x: left, w: W, y: -20 };
    for (let i = 0; i < 46; i += 1) {
      const c = this.add.image(span.x + Phaser.Math.Between(80, Math.max(81, span.w - 80)), span.y, "confetti").setTint(colors[i % colors.length]).setDepth(36).setAngle(Phaser.Math.Between(0, 180));
      this.tweens.add({ targets: c, y: FLOOR_Y - Phaser.Math.Between(0, 40), angle: c.angle + Phaser.Math.Between(180, 540), x: c.x + Phaser.Math.Between(-80, 80), duration: Phaser.Math.Between(1600, 2600), delay: Phaser.Math.Between(0, 900), ease: "Sine.easeIn" });
    }
  }

  private cheerSpots(view: Phaser.Geom.Rectangle) {
    const left = Math.max(view.x, this.arena.left) + 90;
    const right = Math.min(view.right, this.arena.right) - 90;
    const busy = [{ x: this.hero.x, r: 0 }, ...(this.boss ? [{ x: this.boss.sprite.x, r: 90 }] : [])];
    const spots: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      let best = left;
      let bestGap = -Infinity;
      for (let x = left; x <= right; x += 30) {
        const gap = Math.min(...busy.map((b) => Math.abs(x - b.x) - b.r), ...spots.map((sx) => Math.abs(x - sx)));
        if (gap > bestGap) {
          best = x;
          bestGap = gap;
        }
      }
      spots.push(best);
    }
    return spots.sort((a, b) => a - b);
  }

  private enterArena() {
    this.arena.entered = true;
    if (!this.compact) {
      const cam = this.cameras.main;
      cam.stopFollow();
      cam.setBounds(this.arena.left, 0, W, H);
      cam.zoomTo(ARENA_ZOOM, 700, "Sine.easeInOut");
      cam.pan(this.arena.left + W / 2, H / 2, 700, "Sine.easeInOut");
    }
    this.gate = this.add.zone(this.arena.left - 20, FLOOR_Y - 400, 40, 800);
    this.physics.add.existing(this.gate, true);
    this.physics.add.collider(this.hero.rect, this.gate);
    for (const e of this.enemies) if (!e.dead && e.x < this.arena.left) e.leave();
    const g = this.add.graphics().setDepth(8);
    g.fillStyle(0x55301e, 1);
    g.fillRect(this.arena.left - 40, 60, 40, FLOOR_Y - 60);
    g.lineStyle(6, INK_HEX, 1);
    g.strokeRect(this.arena.left - 40, 60, 40, FLOOR_Y - 60);
    this.hud.showBoss(true);
    this.hud.setBoss(this.boss!.hp, this.boss!.maxHp);
    const seen = Boolean(this.registry.get("bossSeen"));
    this.registry.set("bossSeen", true);
    this.boss!.intro(this.t, seen);
    this.hero.grow(ARENA_GROW, 700);
    if (seen) this.hud.flash(this.copy.hud.boss, "#f06ba8", 700);
    else this.hud.flash(this.copy.hud.boss, "#f06ba8", 1300, this.copy.banner.bossSub);
    this.announce(this.copy.say.boss);
  }

  private updateProgress() {
    const end = this.level.exit ? cx(this.level.exit.col) : this.level.boss ? cx(this.level.boss.arena) : this.world.width;
    const k = (this.hero?.x ?? 0) / end;
    this.hud.setProgress(k, this.level.checkpoints.map((c) => cx(c) / end));
  }

  private attackLessonReach() {
    if (!this.compact) return 640;
    return Math.min(640, this.cameras.main.worldView.right - 90 - this.hero.x);
  }

  private updateTutorial() {
    if (!this.tutorialOn) return;
    const h = this.hero;
    if (Math.abs(h.x - this.tutorialFrom) > 140) this.learn("walk");
    if (this.lesson) return;
    if (!learned.has("walk")) return;
    if (!learned.has("jump") && h.x > cx(4)) this.teach("jump");
    else if (!learned.has("attack") && h.grounded && this.enemies.some((e) => !e.dead && e.x > h.x && e.x - h.x < this.attackLessonReach() && Math.abs(e.feet - h.feet) < 200)) this.teach("attack");
    if ((["walk", "jump", "attack"] as Lesson[]).every((l) => learned.has(l) || this.shown.has(l))) this.tutorialOn = false;
  }

  private focusPoints(): Focus[] {
    const h = this.hero;
    const focus: Focus[] = [];
    for (const e of this.enemies) {
      if (e.dead || Math.abs(e.feet - h.feet) > 520) continue;
      const fight = Math.abs(e.x - h.x) < FIGHT_RANGE && Math.abs(e.feet - h.feet) < 200;
      focus.push({ x: e.x, pad: fight ? 130 : 150, fight });
    }
    for (const w of this.waves) if (w.alive) focus.push({ x: w.img.x, pad: 90 });
    for (const b of this.balls) if (b.harmful) focus.push({ x: b.img.x, pad: 70 });
    for (const w of this.watchers) if (w.awake) focus.push({ x: w.x, pad: 170 });
    for (const l of this.lockers) if (l.shaking) focus.push({ x: l.x, pad: 130 });
    for (const l of this.spotlights) focus.push({ x: l.spotX, pad: 160 });
    for (const r of this.ropes) focus.push({ x: r.mid, pad: (r.x1 - r.x0) / 2 + 40 });
    if (this.exitZone) focus.push({ x: this.exitZone.centerX, pad: 140 });
    if (this.boss && this.arena.entered && this.boss.state !== "beaten") focus.push({ x: this.boss.x, pad: 240, always: true });
    return focus;
  }

  private highPoints(): High[] {
    const highs: High[] = [];
    for (const pl of this.level.platforms) highs.push({ x0: cx(pl.col), x1: cx(pl.col + pl.w), y: cy(pl.row) });
    for (const e of this.enemies) if (!e.dead && e.feet < FLOOR_Y - 40) highs.push({ x0: e.x - 90, x1: e.x + 90, y: e.body.top - 20 });
    for (const it of this.items) if (!it.taken && it.img.y < FLOOR_Y - 120) highs.push({ x0: it.img.x - 40, x1: it.img.x + 40, y: it.img.y - 40 });
    return highs;
  }

  private updateFrameCamera(dt: number) {
    const h = this.hero;
    const margin = this.deck.sideRoom() / this.cameras.main.zoom;
    const bounds = this.arena.entered ? { left: this.arena.left - margin, right: this.arena.right + margin } : { left: -margin, right: this.world.width + margin };
    const under = this.enemies.filter((e) => !e.dead && Math.abs(e.x - h.x) < 700 && e.feet > h.feet + 120).map((e) => e.feet);
    const below = under.length ? Math.max(...under) : null;
    const scale = this.arena.entered ? ARENA_GROW : 1;
    const b = h.body;
    this.frameCam.update(dt, this.frame, { x: h.x, top: h.top, feet: h.feet, facing: h.facing, vy: b.velocity.y, grounded: h.grounded, scale }, this.focusPoints(), this.highPoints(), bounds, this.arena.entered, below);
    this.scenery.frameSky(this.cameras.main);
  }

  private updateCamera(dt: number) {
    if (this.compact) {
      this.updateFrameCamera(dt);
      return;
    }
    if (this.arena.entered) return;
    const cam = this.cameras.main;
    const h = this.hero;
    const viewW = W / cam.zoom;
    const viewH = H / cam.zoom;
    const maxTop = H - viewH;
    const near = this.enemies.filter((e) => !e.dead && Math.abs(e.x - h.x) < viewW * 0.6);
    const behind = near.some((e) => (e.x - h.x) * h.facing < 0 && Math.abs(e.x - h.x) < 520 && Math.abs(e.feet - h.feet) < 200);
    this.lookAhead += ((behind ? 0 : -h.facing * 170) - this.lookAhead) * (1 - Math.exp(-dt * 2.4));
    cam.setFollowOffset(this.lookAhead, 0);
    const below = near.some((e) => e.feet > h.feet + 120);
    const want = Phaser.Math.Clamp(Math.min(maxTop, h.top - (below ? 60 : 130)), 0, maxTop);
    const rate = want < this.camTop ? (h.top - this.camTop < 50 ? 14 : 6) : h.body.velocity.y > 0 ? 4.5 : 3;
    this.camTop += (want - this.camTop) * (1 - Math.exp(-dt * rate));
    cam.scrollY = this.camTop - (H - viewH) / 2;
  }

  private syncVisual() {
    if (!this.hero) return;
    this.hero.sync(this.t, this.invulnUntil);
    for (const e of this.enemies) e.sync();
    this.boss?.sync();
    this.placeChips();
    const cam = this.cameras.main;
    const v = cam.worldView;
    const z = cam.zoom;
    const sp = (x: number, y: number): [number, number] => [(x - v.x) * z, (y - v.y) * z];
    const others: [number, number][] = this.enemies.filter((e) => !e.dead).map((e) => sp(e.x, e.body.center.y));
    if (this.boss) others.push(sp(this.boss.x, this.boss.body.center.y));
    for (const w of this.waves) others.push(sp(w.img.x, w.img.y - 60));
    for (const b of this.balls) others.push(sp(b.img.x, b.img.y));
    const [hx, hy] = sp(this.hero.x, this.hero.body.center.y);
    this.hud.avoid(hx, hy, others, sp(this.hero.x, this.hero.top)[1]);
    if (this.compact) this.syncCompact(v, sp, hx, hy, others);
    if (this.scenery.spotlight && this.boss) this.scenery.spotlight.x = Phaser.Math.Linear(this.scenery.spotlight.x, this.boss.x, 0.08);
  }

  private syncCompact(v: Phaser.Geom.Rectangle, sp: (x: number, y: number) => [number, number], hx: number, hy: number, others: [number, number][]) {
    this.warnings = this.warnings.filter((w) => w.text.active);
    const marks: Mark[] = [];
    const out = (x: number): -1 | 1 | 0 => (x < v.x + 24 ? -1 : x > v.right - 24 ? 1 : 0);
    if (this.mode === "play") {
      const boss = this.boss && this.arena.entered && this.boss.state !== "beaten" ? this.boss : null;
      let bossWarn = false;
      for (const w of this.warnings) {
        const side = out(w.x);
        if (side === 0) continue;
        if (boss && Math.abs(w.x - boss.x) < 220) bossWarn = true;
        else marks.push({ side, y: sp(w.x, w.y)[1], tone: "warn" });
      }
      for (const w of this.waves) {
        if (!w.alive) continue;
        const side = out(w.img.x);
        const dist = side < 0 ? v.x - w.img.x : w.img.x - v.right;
        if (side !== 0 && dist < 900 && (w.img.flipX ? -1 : 1) === -side) marks.push({ side, y: sp(w.img.x, w.img.y - 50)[1], tone: "shot" });
      }
      for (const b of this.balls) {
        const side = out(b.img.x);
        if (b.harmful && side === 1 && b.img.x - v.right < 900) marks.push({ side, y: sp(b.img.x, b.img.y)[1], tone: "shot" });
      }
      for (const w of this.watchers) {
        const side = out(w.x);
        const dist = side < 0 ? v.x - w.x : w.x - v.right;
        if (side !== 0 && w.alert && dist < 700) marks.push({ side, y: sp(w.x, FLOOR_Y - 330)[1], tone: "warn" });
      }
      if (boss) {
        const side = out(boss.x);
        if (side !== 0) marks.push({ side, y: sp(boss.x, boss.body.center.y)[1], tone: bossWarn ? "warn" : "boss" });
      }
    }
    const f = this.frame;
    this.markers.update(marks, f, f.hud, f.height - f.deck, this.lastDt);
    const zones = f.kind === "band" ? this.deck.zones() : null;
    if (zones) {
      const near = (z: Phaser.Geom.Rectangle) => (x: number, y: number) => x > z.x - 90 && x < z.right + 90 && y > z.y - 160 && y < z.bottom + 60;
      const [l, r] = zones.map(near);
      this.deck.fade(l(hx, hy) || others.some(([x, y]) => l(x, y)) ? 0.4 : 1, r(hx, hy) || others.some(([x, y]) => r(x, y)) ? 0.4 : 1);
    }
  }

  update(time: number, delta: number) {
    if (this.mode === "attract") return;
    if (time < this.hitStopUntil) {
      if (!this.physics.world.isPaused) this.physics.world.pause();
      return;
    }
    if (this.physics.world.isPaused) this.physics.world.resume();
    let left = Math.min(delta, FRAME_MAX_MS);
    while (left > 0 && this.time.now >= this.hitStopUntil) {
      const ms = Math.min(left, STEP_MAX_MS);
      left -= ms;
      this.step(ms / 1000);
    }
  }

  private step(dt: number) {
    this.lastDt = dt;
    this.t += dt * 1000;
    const t = this.t;

    const playing = this.mode === "play";
    const input = playing
      ? {
          left: this.keys.left.isDown || this.keys.a.isDown || this.hud.touch.left,
          right: this.keys.right.isDown || this.keys.d.isDown || this.hud.touch.right,
          jumpHeld: this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown || this.hud.touch.jump,
        }
      : { left: false, right: false, jumpHeld: false };
    const hx = this.hero.x;
    const slippery = this.hero.grounded && this.world.slips.some(([a, b]) => hx > a && hx < b);
    this.hero.update(t, dt, input, slippery, 0);
    for (const c of this.carts) c.update(dt);

    if (this.mode === "won" || this.mode === "ko") return;

    const view = this.heroView();
    for (const e of this.enemies) e.update(t, dt, view);
    this.boss?.update(t, dt, view);
    for (const s of this.spawners) s.update(dt, view.x);
    for (const w of this.waves) w.update(dt);
    for (const b of this.balls) b.update(dt);
    for (const it of this.items) it.update(t);
    this.updateGadgets(t, dt);
    if (this.scenery.update(t, this.hero.x, this.hero.body.velocity.x, this.hero.grounded, this.cameras.main.worldView)) this.sfx("swing", 0.3);

    this.updateCamera(dt);

    const atk = this.hero.attackBox(t);
    if (atk) this.resolveAttack(atk, t);
    const hr = this.heroRect();
    for (const e of this.enemies) {
      const box = e.attackBox();
      if (box && Phaser.Geom.Intersects.RectangleToRectangle(hr, box)) this.hurt(e.x);
    }
    if (this.boss) {
      const box = this.boss.attackBox();
      if (box && Phaser.Geom.Intersects.RectangleToRectangle(hr, box)) this.hurt(this.boss.x);
    }
    for (const w of this.waves) {
      if (w.alive && Phaser.Geom.Intersects.RectangleToRectangle(hr, w.box())) {
        this.hurt(w.img.x);
        if (!w.big) w.kill();
      }
    }
    for (const b of this.balls) if (b.harmful && Phaser.Geom.Intersects.RectangleToRectangle(hr, b.box())) {
      this.hurt(b.img.x);
      b.kill();
    }
    this.waves = this.waves.filter((w) => w.alive);
    this.balls = this.balls.filter((b) => b.alive);
    this.enemies = this.enemies.filter((e) => !(e.dead && !e.sprite.active));
    if (this.mode !== "play") return;

    for (const it of this.items) {
      if (!it.near(view.x, view.top, view.feet)) continue;
      it.take(this);
      if (it.kind === "snack") {
        this.hearts = Math.min(HEARTS, this.hearts + 1);
        this.hud.setHearts(this.hearts, "gained");
        this.sfx("heal", 0.9);
        this.word(this.copy.words.snack, it.img.x, it.img.y - 50, "#93cf4c", 40);
        this.announce(this.copy.say.snack);
      } else {
        this.stickers += 1;
        this.addScore(SCORE.sticker);
        this.sfx("coin", 0.8);
        this.word(`+${SCORE.sticker}`, it.img.x, it.img.y - 40, "#ffc83d", 36);
      }
    }
    for (const bell of this.bells) {
      if (bell.reached || view.x < bell.x - 30) continue;
      bell.ring(this, this.ctx.reducedMotion);
      this.sfx("bell", 0.9);
      if (this.registry.get("checkpoints") === false) {
        this.word("DING!", bell.x, FLOOR_Y - 260, "#63d6c1", 44);
        this.announce(this.copy.say.bellMission);
        continue;
      }
      this.word(this.copy.words.saved, bell.x, FLOOR_Y - 260, "#63d6c1", 44);
      const col = Math.round((bell.x - TILE / 2) / TILE);
      this.registry.set("checkpoint", { level: this.levelIndex, col, score: this.score, kills: this.kills, killScore: this.killScore, stickers: this.stickers, extras: this.extras, hits: this.hits } satisfies Checkpoint);
      this.announce(this.copy.say.bellSaved);
    }

    if (this.hero.feet > H + 120) {
      this.fell();
      return;
    }
    if (this.hero.body.blocked.down && this.world.groundAt(view.x - 70) && this.world.groundAt(view.x + 70) && t > this.invulnUntil) {
      this.safe = { x: this.hero.rect.x, y: this.hero.rect.y };
    }
    if (this.lesson && (this.t > this.lessonUntil || this.hero.x > this.lessonPast)) this.endLesson();
    this.updateTutorial();
    this.updateHints(this.hero.x);
    this.updateProgress();
    if (this.exitZone && Phaser.Geom.Intersects.RectangleToRectangle(hr, this.exitZone)) this.win();
    if (this.boss && !this.arena.entered && view.x > this.arena.left + 260) this.enterArena();
  }

  private heroState(): HeroState {
    const b = this.hero.body;
    return { x: b.center.x, feet: b.bottom, top: b.top, vx: b.velocity.x, vy: b.velocity.y, grounded: this.hero.grounded };
  }

  private updateGadgets(t: number, dt: number) {
    if (!this.lockers.length && !this.watchers.length && !this.ropes.length && !this.pads.length && !this.spotlights.length && !this.shelves.length) return;
    const h = this.heroState();
    const hr = this.heroRect();
    for (const l of this.lockers) {
      l.update(t, h);
      const box = l.hitBox(t);
      if (box && Phaser.Geom.Intersects.RectangleToRectangle(hr, box)) this.hurt(l.hinge);
    }
    for (const w of this.watchers) w.update(t, h);
    for (const r of this.ropes) if (r.update(t, h)) this.trip();
    for (const p of this.pads) {
      if (!p.landed(h)) continue;
      this.hero.bounce(JUMP_V * 1.45);
      p.boing();
      this.word("BOING!", p.x, p.top - 60, "#5cb9f0", 40);
    }
    for (const l of this.spotlights) if (l.update(t, dt, h, t < this.invulnUntil)) this.hurt(l.spotX);
    for (const s of this.shelves) s.update(t, h);
  }

  private trip() {
    if (this.t < this.invulnUntil) return;
    this.invulnUntil = this.t + 700;
    this.hero.knock(this.hero.x + this.hero.facing * 10, this.t, 300, 320);
    this.word(this.copy.words.tripped, this.hero.x, this.hero.body.top - 40, "#f06ba8", 40);
    this.sfx("land", 0.9);
    this.announce(this.copy.say.tripped);
  }

  private nextHint(x: number): Hint | null {
    const view = this.cameras.main.worldView;
    const edge = this.compact ? 60 : 140;
    const seen = (at: number) => at > view.x + edge && at < view.right - edge;
    const fixed = (ax: number, ay: number) => () => ({ x: ax, y: ay });
    const follow = (e: Enemy) => () => (e.dead ? null : { x: e.x, y: e.body.top - 150 });
    const fresh = (lesson: Lesson) => !learned.has(lesson) && !this.shown.has(lesson);
    const locker = this.lockers.find((l) => l.shaking && seen(l.x) && x < l.x);
    if (locker && fresh("locker")) return { lesson: "locker", anchor: fixed(locker.x, FLOOR_Y - 330), past: locker.x + 60 };
    const watcher = this.watchers.find((w) => x > w.x - 900 && x < w.x - (this.compact ? 240 : 400) && seen(w.x));
    if (watcher && fresh("watcher")) return { lesson: "watcher", anchor: fixed(watcher.x, FLOOR_Y - 500), past: watcher.x };
    const rope = this.ropes.find((r) => seen(r.mid) && x < r.x0);
    if (rope && fresh("rope")) return { lesson: "rope", anchor: fixed(rope.mid, FLOOR_Y - 300), past: rope.x1 };
    const pad = this.pads.find((p) => seen(p.x) && x < p.x - 120);
    if (pad && fresh("pad")) return { lesson: "pad", anchor: fixed(pad.x, FLOOR_Y - 220), past: pad.x };
    const light = this.spotlights.find((l) => seen(l.mid) && x < l.mid + l.reach);
    if (light && fresh("light")) return { lesson: "light", anchor: fixed(light.mid, FLOOR_Y - 330), past: light.mid + light.reach };
    const shield = this.enemies.find((e) => !e.dead && e instanceof ShieldMonitor && seen(e.x) && x < e.x);
    if (shield && fresh("shield")) return { lesson: "shield", anchor: follow(shield), past: Infinity };
    const shelf = this.shelves.find((s) => s.near(x) && seen(s.x0 + s.w / 2));
    if (shelf && fresh("wobbly")) return { lesson: "wobbly", anchor: fixed(shelf.x0 + shelf.w / 2, shelf.y - 150), past: shelf.x0 + shelf.w };
    const high = this.enemies.find((e) => !e.dead && e instanceof WhistleMonitor && e.mixed && seen(e.x) && Math.abs(e.x - x) < 900);
    if (high && fresh("high")) return { lesson: "high", anchor: follow(high), past: Infinity };
    return null;
  }

  private updateHints(x: number) {
    if (this.lesson || this.mode !== "play" || this.t < this.hintsAt) return;
    const hint = this.nextHint(x);
    if (!hint) return;
    this.shown.add(hint.lesson);
    learned.add(hint.lesson);
    this.lesson = hint.lesson;
    this.lessonUntil = this.t + 5000;
    this.lessonPast = hint.past;
    const hints: Partial<Record<Lesson, string>> = this.copy.hints;
    const speech: Partial<Record<Lesson, string>> = this.copy.hintSpeech;
    this.showChip(hints[hint.lesson]!, [], hint.anchor);
    this.announce(speech[hint.lesson]!);
  }

  private resolveAttack(atk: Phaser.Geom.Rectangle, t: number) {
    const id = this.hero.attackId;
    const fromX = this.hero.x;
    for (const l of this.lockers) if (Phaser.Geom.Intersects.RectangleToRectangle(atk, l.bounds()) && l.slam()) this.hitStopUntil = this.time.now + HIT_STOP_MS;
    for (const e of this.enemies) {
      if (e.dead || !Phaser.Geom.Intersects.RectangleToRectangle(atk, e.bounds())) continue;
      const res = e.hitBy(id, fromX, t);
      if (!res || res === "dodge") continue;
      if (res === "block") {
        this.hero.recoil(e.x, t, 260, 120);
        continue;
      }
      const top = e.body.top;
      this.onEnemyHit(e.x, top, e.body.bottom, res === "kill");
      if (res === "kill") {
        this.kills += 1;
        this.hud.setMonitors(this.kills, this.level.enemies.length, true);
        const pts = e.kind === "shield" ? SCORE.shield : e.kind === "whistle" ? SCORE.whistle : SCORE.common;
        this.killScore += pts;
        this.addScore(pts);
        const x = e.x;
        this.time.delayedCall(150, () => this.word(`+${pts}`, x, top - 110, "#9df0dc", 34));
      }
    }
    if (this.boss) {
      const b = this.boss.body;
      const r = new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
      if (Phaser.Geom.Intersects.RectangleToRectangle(atk, r)) {
        const res = this.boss.hitBy(id, fromX, t);
        if (res === "block") this.hero.recoil(this.boss.x, t, 300, 160);
        else if (res) {
          this.onEnemyHit(this.boss.x, b.top, b.bottom, res === "kill", true);
          this.hud.setBoss(this.boss.hp, this.boss.maxHp);
          if (res === "kill") this.bossDown();
        }
      }
    }
    const prop = this.scenery.hitReactive(atk, id);
    if (prop) this.sfx(prop === "locker" || prop === "metal" ? "block" : prop === "bin" ? "boing" : "swing", 0.35);
    for (const w of this.waves) {
      if (w.alive && !w.big && Phaser.Geom.Intersects.RectangleToRectangle(atk, w.box())) {
        w.kill();
        this.sfx("pop", 0.8);
        this.addExtra();
        this.word(this.copy.words.wavePop, w.img.x, w.img.y - 40, "#9df0dc", 32);
      }
    }
    for (const b of this.balls) {
      if (b.harmful && Phaser.Geom.Intersects.RectangleToRectangle(atk, b.box())) {
        b.kick(this.hero.facing);
        this.addExtra();
        this.word(this.copy.words.kick, b.img.x, b.img.y - 50, "#fbf5e6", 34);
      }
    }
  }

  private onEnemyHit(x: number, top: number, bottom: number, kill: boolean, boss = false) {
    const side = Math.sign(x - this.hero.x) || this.hero.facing;
    const px = x - side * (boss ? 70 : 34);
    const py = Phaser.Math.Clamp(this.hero.body.center.y - 24, top + 40, bottom - 50);
    this.hitStopUntil = this.time.now + (kill ? HIT_STOP_MS * 1.6 : HIT_STOP_MS);
    this.sfx(boss ? "bossHit" : "hit", 0.9);
    if (kill && !boss) this.time.delayedCall(60, () => this.sfx("ko", 0.8));
    this.pow(px, py, kill ? 0.9 : 0.68);
    this.burst(px, py, kill ? 6 : 3);
    this.word(Phaser.Utils.Array.GetRandom(this.copy.words.hits) as string, x + side * 24, top - 34, "#ffc83d", kill ? 54 : 44);
    if (!this.ctx.reducedMotion) this.cameras.main.shake(kill ? 110 : 70, kill ? 0.006 : 0.003);
  }

  private clang(x: number, y: number) {
    const ring = this.add.graphics().setDepth(39).setPosition(x, y);
    ring.lineStyle(9, INK_HEX, 0.85);
    ring.strokeCircle(0, 0, 32);
    ring.lineStyle(5, 0xdcecff, 1);
    ring.strokeCircle(0, 0, 32);
    if (this.ctx.reducedMotion) {
      this.tweens.add({ targets: ring, alpha: 0, duration: 220, onComplete: () => ring.destroy() });
      return;
    }
    ring.setScale(0.45);
    this.tweens.add({ targets: ring, scale: 1.25, alpha: 0, duration: 240, ease: "Quad.easeOut", onComplete: () => ring.destroy() });
    for (let i = 0; i < 4; i += 1) {
      const img = this.add.image(x, y, "spark").setDepth(39).setScale(0.55).setTint(0xcfe4ff);
      const a = -Math.PI / 2 + (i - 1.5) * 0.7;
      this.tweens.add({ targets: img, x: x + Math.cos(a) * 70, y: y + Math.sin(a) * 60, alpha: 0, duration: 260, onComplete: () => img.destroy() });
    }
  }

  private bossDown() {
    this.sfx("crash", 1);
    if (!this.ctx.reducedMotion) {
      this.cameras.main.shake(400, 0.012);
      this.tweens.add({ targets: this.boss!.sprite, angle: -14, y: this.boss!.sprite.y + 10, duration: 500, ease: "Bounce.easeOut" });
    }
    this.hud.hideTop();
    this.clearShots();
    this.word(this.copy.words.silenceBroken, this.boss!.x, FLOOR_Y - 380, "#fbf5e6", 44);
    this.time.delayedCall(600, () => this.win());
  }
}
