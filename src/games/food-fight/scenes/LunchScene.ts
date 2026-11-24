import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import {
  AMMO_MAX,
  COUNTDOWN_MS,
  AMMO_SPOTS,
  DECO,
  EVENTS,
  FOODS,
  FOOD_EFFECTS,
  H,
  INVULNERABLE_MS,
  LIVES,
  COOK,
  LUNCH_LADY,
  MILA,
  OUR_TABLE,
  PHASES,
  RELOAD_MS,
  ROUND_MS,
  RIVAL_KINDS,
  RIVAL_LOOKS,
  SCORE,
  SLOTS,
  THROW_GAP_MS,
  W,
  type Phase,
  type RivalKind,
} from "../config";
import { COPY, type FoodFightCopy } from "../copy";
import { LANDSCAPE_FRAME, SCENERY, frameFor, frameX, landscapeX, walkScale, type Frame } from "../layout";
import { LUNCH_SFX, type LunchSfx } from "../sounds";
import { Bubble, cartoonText } from "../../kit/ui";
import { eachKeyOnce } from "../../kit/keys";
import { Cook, LunchLady, Rival } from "./actors";
import { LunchHud } from "./hud";

type Mode = "attract" | "tutorial" | "playing" | "ending" | "over";
type Food = (typeof FOODS)[number];
type Pt = { x: number; y: number };
type Pose = "idle" | "throw" | "splat" | "cheer";

type Projectile = {
  img: Phaser.GameObjects.Image;
  t0: number;
  dur: number;
  from: Pt;
  ctrl: Pt;
  to: Pt;
  spin: number;
  scaleFrom: number;
  scaleTo: number;
  onArrive: () => void;
  ring?: Phaser.GameObjects.Image;
};

type Target = { kind: "rival"; rival: Rival } | { kind: "lunchLady" } | { kind: "point"; x: number; y: number };

type Peel = { img: Phaser.GameObjects.Image; dx: number; landed: boolean; armed: boolean };

function bezier(a: Pt, c: Pt, b: Pt, k: number): Pt {
  const u = 1 - k;
  return { x: u * u * a.x + 2 * u * k * c.x + k * k * b.x, y: u * u * a.y + 2 * u * k * c.y + k * k * b.y };
}

const SAVE_KEY = "canal404:food-fight:v1";
const SIDE_BUBBLE = { x: MILA.x + 112, y: MILA.y - 150 };

function tutorialSeen() {
  try {
    return JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? "{}").tutorialDone === true;
  } catch {
    return false;
  }
}

function rememberTutorial() {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, tutorialDone: true }));
  } catch {
    return;
  }
}

export class LunchScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private copy!: FoodFightCopy;
  private mode: Mode = "attract";
  private t = 0;
  private roundStart = 0;
  private roundT = 0;
  private lives = LIVES;
  private ammo: Food[] = [];
  private ammoImgs: Phaser.GameObjects.Image[] = [];
  private reloadAcc = 0;
  private ducking = false;
  private duckPointer: number | null = null;
  private keys!: Record<"down" | "s" | "shift", Phaser.Input.Keyboard.Key>;
  private invulnerableUntil = 0;
  private throwReadyAt = 0;
  private hitScore = 0;
  private comboScore = 0;
  private lunchLadyPenalty = 0;
  private hits = 0;
  private streak = 0;
  private bestStreak = 0;
  private hitsTaken = 0;
  private incoming = 0;
  private rivals: Rival[] = [];
  private lunchLady!: LunchLady;
  private lunchLadyIndex = 0;
  private ladyWasActive = false;
  private cook!: Cook;
  private cookIndex = 0;
  private cookTook = 0;
  private confiscated = 0;
  private ladyGoneAt = -Infinity;
  private nextSpawnAt = 0;
  private projectiles: Projectile[] = [];
  private decals: Phaser.GameObjects.Image[] = [];
  private deco!: Phaser.GameObjects.Image;
  private mila!: Phaser.GameObjects.Image;
  private poseUntil = 0;
  private milaUntil = 0;
  private overlay!: Phaser.GameObjects.Image;
  private bubble!: Bubble;
  private sideBubble!: Bubble;
  private hud!: LunchHud;
  private clockHands!: Phaser.GameObjects.Graphics;
  private bell!: Phaser.GameObjects.Image;
  private tutorial: "throw" | "duck" | null = null;
  private tutorialRival: Rival | null = null;
  private lastSaid = new Map<string, number>();
  private lastSecond = -1;
  private warnedLast = false;
  private keyboardUsed = false;
  private highScore = 0;
  private trayIntroduced = false;
  private trayHinted = false;
  private interrupts = 0;
  private interruptScore = 0;
  private throws = 0;
  private brawlDone = false;
  private brawlUntil = 0;
  private brawlNext = 0;
  private brawlFillAt = 0;
  private milaPriorityUntil = 0;
  private frame: Frame = LANDSCAPE_FRAME;
  private tables: Phaser.GameObjects.Image[] = [];
  private peels = new Map<number, Peel>();
  private taught = new Set<string>();
  private topStrip!: Phaser.GameObjects.Image;
  private extension!: Phaser.GameObjects.Graphics;
  private clock!: Phaser.GameObjects.Image;
  private ourTable!: Phaser.GameObjects.Image;
  private ourMaskShape!: Phaser.GameObjects.Graphics;

  constructor() {
    super("lunch");
  }

  init() {
    this.mode = "attract";
    this.t = 0;
    this.roundStart = 0;
    this.roundT = 0;
    this.lives = LIVES;
    this.ammo = [];
    this.ammoImgs = [];
    this.reloadAcc = 0;
    this.ducking = false;
    this.duckPointer = null;
    this.invulnerableUntil = 0;
    this.throwReadyAt = 0;
    this.hitScore = 0;
    this.comboScore = 0;
    this.lunchLadyPenalty = 0;
    this.hits = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.hitsTaken = 0;
    this.incoming = 0;
    this.rivals = [];
    this.lunchLadyIndex = 0;
    this.ladyWasActive = false;
    this.ladyGoneAt = -Infinity;
    this.cookIndex = 0;
    this.cookTook = 0;
    this.confiscated = 0;
    this.nextSpawnAt = 0;
    this.projectiles = [];
    this.decals = [];
    this.poseUntil = 0;
    this.milaUntil = 0;
    this.tutorial = null;
    this.tutorialRival = null;
    this.lastSaid = new Map();
    this.lastSecond = -1;
    this.warnedLast = false;
    this.keyboardUsed = false;
    this.trayIntroduced = false;
    this.trayHinted = false;
    this.interrupts = 0;
    this.interruptScore = 0;
    this.throws = 0;
    this.brawlDone = false;
    this.brawlUntil = 0;
    this.brawlNext = 0;
    this.brawlFillAt = 0;
    this.milaPriorityUntil = 0;
    this.tables = [];
    this.peels = new Map();
    this.taught = new Set();
    this.frame = LANDSCAPE_FRAME;
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.copy = COPY[this.ctx.locale];
    this.highScore = (this.registry.get("highScore") as number | undefined) ?? this.ctx.highScore;
    const reduced = this.ctx.reducedMotion;
    const fonts = this.ctx.fonts;

    this.extension = this.add.graphics().setDepth(-1);
    this.add.image(0, 0, "cafeteria-bg").setOrigin(0).setDepth(0);
    this.topStrip = this.add.image(0, 0, "cafeteria-top").setOrigin(0).setDepth(0.1);
    if (!this.textures.exists("threat-ring")) {
      const g = this.make.graphics({}, false);
      g.lineStyle(10, 0xef4f43, 1);
      g.strokeCircle(64, 64, 54);
      g.lineStyle(4, 0xfbf5e6, 0.95);
      g.strokeCircle(64, 64, 45);
      g.generateTexture("threat-ring", 128, 128);
      g.destroy();
    }
    const scenery = SCENERY.landscape;
    this.clock = this.add.image(scenery.clock.x, scenery.clock.y, "clock").setScale(0.72).setDepth(1);
    this.clockHands = this.add.graphics().setDepth(1.1);
    this.bell = this.add.image(scenery.bell.x, scenery.bell.y, "bell").setOrigin(0.5, 0.1).setScale(0.72).setDepth(1);

    this.lunchLady = new LunchLady(this, reduced);
    this.cook = new Cook(this, reduced);

    const backMask = this.make.graphics({}, false).fillRect(-W, -H, W * 3, H + 702).createGeometryMask();
    const frontMask = this.make.graphics({}, false).fillRect(-W, -H, W * 3, H + 944).createGeometryMask();
    for (const slot of SLOTS) {
      const back = slot.row === "back";
      this.tables.push(
        this.add
          .image(slot.x, slot.tableY, "rival-table")
          .setOrigin(0.5, 0)
          .setScale(back ? 0.7 : 0.95)
          .setDepth(back ? 4 : 7),
      );
      this.rivals.push(new Rival(this, slot, back ? backMask : frontMask, fonts, reduced));
    }

    this.ourMaskShape = this.make.graphics({}, false).fillRect(-W, -H, W * 3, H + 940);
    const ourMask = this.ourMaskShape.createGeometryMask();
    this.deco = this.add.image(DECO.x, DECO.standY, "deco-idle").setOrigin(0.5, 1).setDepth(9).setMask(ourMask);
    this.mila = this.add.image(MILA.x, MILA.y, "mila-peek").setOrigin(0.5, 1).setDepth(10).setMask(ourMask);
    this.ourTable = this.add.image(OUR_TABLE.x, OUR_TABLE.y, "our-table").setOrigin(0.5, 0).setDepth(11);
    for (const spot of AMMO_SPOTS) {
      this.ammoImgs.push(this.add.image(spot.x, spot.y, "sandwich").setOrigin(0.5, 1).setScale(0.62).setDepth(12).setVisible(false));
    }
    for (let i = 0; i < AMMO_MAX; i += 1) this.ammo.push(this.randomFood());
    this.refreshAmmo(false);

    this.overlay = this.add.image(380, 560, "splat-screen").setDepth(25).setScale(1.7).setVisible(false);
    this.bubble = new Bubble(this, fonts, "right", 32, 16);
    this.sideBubble = new Bubble(this, fonts, "left", 32, 16);

    this.hud = new LunchHud(this, fonts, reduced, this.ctx.locale);
    this.hud.setRecord(this.highScore);
    this.hud.setLives(this.lives);
    this.hud.setScore(0);
    this.hud.setTimer(ROUND_MS, ROUND_MS, false);

    this.setupInput();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this));
    this.onResize();
    const releaseDuck = () => {
      this.duckPointer = null;
    };
    this.events.on(Phaser.Scenes.Events.RESUME, releaseDuck);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, releaseDuck));

    if (!this.registry.get("readySent")) {
      this.registry.set("readySent", true);
      this.ctx.onReady();
    }
    if (this.registry.get("autostart")) {
      this.registry.set("autostart", false);
      this.begin();
    }
  }

  begin() {
    if (this.mode !== "attract") return;
    if (this.registry.get("tutorialDone") || tutorialSeen()) this.countdown();
    else this.startTutorial();
  }

  setHighScore(value: number) {
    this.highScore = value;
    this.hud?.setRecord(value);
  }

  private onResize() {
    const parent = this.scale.parentSize;
    const game = this.scale.gameSize;
    const frame = parent.width > 0 && parent.height > 0 ? frameFor(parent.width, parent.height) : frameFor(game.width, game.height);
    const center = frame.kind === "portrait" ? Phaser.Scale.CENTER_HORIZONTALLY : Phaser.Scale.CENTER_BOTH;
    if (this.scale.autoCenter !== center) {
      this.scale.autoCenter = center;
      this.scale.updateCenter();
    }
    if (frame.width !== game.width || frame.height !== game.height) {
      this.scale.setGameSize(frame.width, frame.height);
      return;
    }
    this.applyLayout(frame);
  }

  private applyLayout(frame: Frame) {
    const previous = this.frame;
    if (previous.kind !== frame.kind) this.hideBubbles();
    this.frame = frame;
    const portrait = frame.kind === "portrait";
    const dy = frame.drop;
    this.cameras.main.setScroll(0, frame.top);
    this.ourMaskShape.setY(dy);
    this.ourTable.setY(OUR_TABLE.y + dy);
    this.ammoImgs.forEach((img, i) => img.setY(this.ammoY(i)));
    this.overlay.setY(560 + dy);
    this.cook.setBaseY(COOK.y + dy);
    if (this.mode !== "ending" && this.mode !== "over") {
      this.tweens.killTweensOf([this.deco, this.mila]);
      this.deco.setY(DECO.standY + dy + (this.ducking ? DECO.duckDrop : 0));
      this.mila.setY(MILA.y + dy + (this.ducking ? MILA.duckDrop : 0));
    } else {
      this.deco.setY(this.deco.y + dy - previous.drop);
      this.mila.setY(this.mila.y + dy - previous.drop);
    }
    this.lunchLady.retarget(frameX(frame, landscapeX(previous, this.lunchLady.img.x)), frameX(frame, LUNCH_LADY.exitX), walkScale(frame));
    this.topStrip.setY(frame.top > 0 ? frame.top - 40 : frame.top);
    this.drawExtension(frame);
    const scenery = SCENERY[frame.kind];
    this.clock.setPosition(scenery.clock.x, scenery.clock.y);
    this.bell.setPosition(scenery.bell.x, scenery.bell.y);
    this.updateClock();
    this.rivals.forEach((r, i) => {
      const x = portrait ? r.slot.portraitX : r.slot.x;
      this.tables[i].setX(x);
      r.placeAt(x, this.t);
    });
    this.peels.forEach((peel, i) => peel.landed && peel.img.setX(this.rivals[i].x + peel.dx));
    if (this.tutorialRival) {
      const face = this.tutorialRival.face();
      this.hud.movePointer(face.x, face.y);
    }
    this.hud.layout({ frame, perCss: this.scale.displayScale.x, slotX: this.rivals.map((r) => r.x) });
    const bubbleScale = Math.min(this.hud.uiScale, 1.5);
    this.bubble.setBaseScale(bubbleScale);
    this.sideBubble.setBaseScale(bubbleScale);
    this.sideBubble.setWrap((frame.width - 12 - SIDE_BUBBLE.x) / bubbleScale - 24);
  }

  private drawExtension(frame: Frame) {
    const g = this.extension;
    g.clear();
    if (frame.kind !== "portrait") return;
    const bottom = frame.top + frame.height;
    if (frame.top < 0) {
      g.fillStyle(0xc8eadf, 1).fillRect(0, frame.top, frame.width, -frame.top);
      g.fillStyle(0xb9e0d3, 1);
      for (let x = 60; x < frame.width; x += 180) g.fillRect(x, frame.top, 70, -frame.top);
    }
    if (bottom > H) {
      g.fillStyle(0xe8d3a3, 1).fillRect(0, H, frame.width, bottom - H);
      g.fillStyle(0xd6bb88, 1);
      for (let row = 0; H + row * 45 < bottom; row += 1) {
        for (let x = row % 2 ? 60 : 0; x < frame.width; x += 120) g.fillRect(x, H + row * 45, 60, 45);
      }
    }
  }

  private sfx(name: LunchSfx, volume = 1, pitch = 1) {
    this.ctx.audio.play(LUNCH_SFX[name], { volume: Phaser.Math.Clamp(volume, 0.05, 1.2), pitch });
  }

  private announce(message: string, key = "", gap = 0) {
    if (key) {
      const last = this.lastSaid.get(key) ?? -100000;
      if (this.t - last < gap) return;
      this.lastSaid.set(key, this.t);
    }
    this.ctx.onEvent({ type: "announce", message });
  }

  private milaSay(text: string, ms = 1600, face: "peek" | "shout" | "cheer" = "shout", important = false) {
    if (!important && this.t < this.milaPriorityUntil) return;
    if (important) this.milaPriorityUntil = this.t + ms;
    this.mila.setTexture(`mila-${face}`);
    this.milaUntil = this.t + ms;
    if (this.frame.kind === "portrait") {
      this.sideBubble.say(text, SIDE_BUBBLE.x, SIDE_BUBBLE.y + this.frame.drop, ms);
    } else {
      this.bubble.say(text, MILA.x + 10, (this.ducking ? MILA.y - 70 : MILA.y - 236) - 4, ms);
    }
  }

  private hideBubbles() {
    this.bubble.hide();
    this.sideBubble.hide();
  }

  private word(text: string, x: number, y: number, color: string, size = 50) {
    const t = cartoonText(this, x, y, text, { size, color, font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(15);
    const view = this.cameras.main.worldView;
    if (view.width > t.width) t.setX(Phaser.Math.Clamp(x, view.x + t.width / 2 + 8, view.right - t.width / 2 - 8));
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(800, () => t.destroy());
      return;
    }
    t.setScale(0.3).setAngle(Phaser.Math.Between(-10, 10));
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: "Back.easeOut" });
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, delay: 520, duration: 380, onComplete: () => t.destroy() });
  }

  private burst(x: number, y: number, count: number, tex = "star") {
    const n = this.ctx.reducedMotion ? Math.min(3, count) : count;
    for (let i = 0; i < n; i += 1) {
      const img = this.add.image(x, y, tex).setDepth(15).setScale(Phaser.Math.FloatBetween(0.5, 0.9));
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const d = Phaser.Math.Between(50, 130);
      this.tweens.add({
        targets: img,
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d,
        alpha: 0,
        angle: Phaser.Math.Between(-160, 160),
        duration: Phaser.Math.Between(450, 750),
        onComplete: () => img.destroy(),
      });
    }
  }

  private randomFood(): Food {
    return FOODS[Phaser.Math.Between(0, FOODS.length - 1)];
  }

  private ammoY(i: number) {
    return AMMO_SPOTS[i].y + this.frame.drop - (i === this.ammo.length - 1 ? 12 : 0);
  }

  private refreshAmmo(popLast = true) {
    this.ammoImgs.forEach((img, i) => {
      const food = this.ammo[i];
      if (!food) {
        img.setVisible(false);
        return;
      }
      const wasHidden = !img.visible;
      img.setTexture(food).setVisible(true);
      const next = i === this.ammo.length - 1;
      const base = (food === "sandwich" || food === "banana" ? 0.62 : 0.78) * (next ? 1.25 : 1);
      this.tweens.killTweensOf(img);
      img.setScale(base).setY(this.ammoY(i));
      if (popLast && wasHidden && i === this.ammo.length - 1 && !this.ctx.reducedMotion) {
        img.setScale(0.1);
        this.tweens.add({ targets: img, scale: base, duration: 180, ease: "Back.easeOut" });
      }
    });
  }

  private setPose(pose: Pose, ms = 0) {
    this.deco.setTexture(`deco-${pose}`).setFlipX(false);
    this.poseUntil = ms ? this.t + ms : 0;
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    }) as typeof this.keys;
    kb.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE, Phaser.Input.Keyboard.KeyCodes.DOWN, Phaser.Input.Keyboard.KeyCodes.UP]);
    kb.on("keydown", eachKeyOnce((event) => {
      const key = event.key.toLowerCase();
      if (key === "escape" || key === "p") {
        this.ctx.onEvent({ type: "pause-request" });
        return;
      }
      if (this.mode !== "playing" && this.mode !== "tutorial") return;
      if (key === "arrowdown" || key === "s" || key === "shift") this.markKeyboard();
      if (key === " " || key === "enter") {
        event.preventDefault();
        this.markKeyboard();
        if (!event.repeat) this.throwAuto();
        return;
      }
      if (/^[1-5]$/.test(key)) {
        this.markKeyboard();
        if (!event.repeat) this.throwAtSlot(Number(key));
      }
    }));
    this.input.on("pointerdown", (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.includes(this.hud.duckHit)) {
        this.duckPointer = p.id;
        return;
      }
      if (this.mode !== "playing" && this.mode !== "tutorial") return;
      this.throwAtPoint(p.worldX, p.worldY);
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (p.id === this.duckPointer) this.duckPointer = null;
    };
    this.input.on("pointerup", release);
    this.input.on("pointerupoutside", release);
  }

  private markKeyboard() {
    if (this.keyboardUsed) return;
    this.keyboardUsed = true;
    this.hud.showTags(true);
  }

  private startTutorial() {
    this.mode = "tutorial";
    this.tutorial = "throw";
    this.hud.setTimer(0, ROUND_MS, true);
    const r = this.rivals[1];
    this.tutorialRival = r;
    r.rise("cap", 1, this.t, 0, { hold: true });
    r.taunt(this.copy.tutorial.taunt);
    this.time.delayedCall(320, () => {
      if (this.tutorial === "throw") this.hud.showPointer(r.face().x, r.face().y);
    });
    this.milaSay(this.copy.tutorial.tapSay, 5000, "shout", true);
    this.announce(this.copy.tutorial.tapAnnounce);
  }

  private tutorialDuck() {
    this.tutorial = "duck";
    const r = this.rivals[2];
    this.tutorialRival = r;
    r.rise("cap", 3, this.t, 400);
    this.announce(this.copy.tutorial.duckAnnounce);
  }

  private endTutorial() {
    if (!this.tutorial) return;
    this.tutorial = null;
    this.tutorialRival = null;
    this.registry.set("tutorialDone", true);
    rememberTutorial();
    this.hud.pulseDuck(false);
    this.hud.hidePointer();
    for (const r of this.rivals) if (r.visible && r.state !== "lowering") r.lower(() => (r.readyAt = this.t + 400));
    this.time.delayedCall(700, () => this.countdown());
  }

  private countdown() {
    this.mode = "tutorial";
    this.hitScore = 0;
    this.comboScore = 0;
    this.interruptScore = 0;
    this.lunchLadyPenalty = 0;
    this.hits = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.interrupts = 0;
    this.throws = 0;
    this.hud.setStreak(0);
    this.updateScore();
    this.hud.setTimer(ROUND_MS, ROUND_MS, false);
    this.hud.flash(this.copy.countdown.title, "#ffc83d", 700, this.copy.countdown.sub);
    this.sfx("beep", 0.8);
    this.announce(this.copy.countdown.announce);
    this.time.delayedCall(COUNTDOWN_MS, () => {
      this.hud.flash(this.copy.countdown.go, "#93cf4c", 500);
      this.sfx("go", 0.9);
      this.mode = "playing";
      this.roundStart = this.t;
      this.nextSpawnAt = this.t + 500;
    });
  }

  private phaseAt(rt: number): Phase {
    let phase = PHASES[0];
    for (const p of PHASES) if (rt >= p.from) phase = p;
    return phase;
  }

  private pickLook(kind: RivalKind) {
    const taken = new Set(this.rivals.filter((r) => r.visible && r.def.kind === kind).map((r) => r.look));
    const free = RIVAL_LOOKS.filter((look) => !taken.has(look));
    return Phaser.Utils.Array.GetRandom(free.length ? free : RIVAL_LOOKS) as number;
  }

  private pickKind() {
    const open = RIVAL_KINDS.filter((kind) => this.rivals.filter((r) => r.visible && r.def.kind === kind).length < RIVAL_LOOKS.length);
    return Phaser.Utils.Array.GetRandom(open.length ? open : RIVAL_KINDS) as RivalKind;
  }

  private spawn() {
    if (this.brawlUntil) return;
    const phase = this.phaseAt(this.roundT);
    const active = this.rivals.filter((r) => r.visible).length;
    if (active >= phase.maxActive || this.t < this.nextSpawnAt) return;
    const free = this.rivals.filter((r) => r.state === "hidden" && this.t >= r.readyAt);
    if (!free.length) return;
    const r = Phaser.Utils.Array.GetRandom(free) as Rival;
    const roll = Math.random();
    let kind: RivalKind = roll < phase.big ? "big" : roll < phase.big + phase.speedy ? "speedy" : "cap";
    const trayTime = this.roundT >= EVENTS.trayFrom;
    const firstTray = trayTime && !this.trayIntroduced;
    if (firstTray) kind = "cap";
    const tray = kind === "cap" && trayTime && (firstTray || Math.random() < EVENTS.trayChance);
    const feint = !tray && this.roundT > 8000 && Math.random() < 0.15;
    r.rise(kind, this.pickLook(kind), this.t, Phaser.Math.Between(tray ? 520 : 260, tray ? 900 : 600), { feint, tray });
    if (firstTray) {
      this.trayIntroduced = true;
      this.milaSay(this.copy.tray.say, 2600, "shout", true);
      this.announce(this.copy.tray.announce(r.slot.key));
    } else if (tray && Math.random() < 0.4) {
      r.taunt(this.copy.tray.taunt);
    } else if (Math.random() < 0.3) {
      r.taunt(Phaser.Utils.Array.GetRandom(this.copy.taunts[r.def.kind]) as string);
    }
    this.nextSpawnAt = this.t + Phaser.Math.Between(phase.gap[0], phase.gap[1]);
  }

  private startBrawl() {
    this.brawlDone = true;
    this.brawlUntil = this.t + EVENTS.brawlMs;
    this.brawlNext = this.t + 900;
    this.brawlFillAt = this.t + 380;
    for (const r of this.rivals) {
      if (r.visible && r.state !== "lowering") r.lower(() => (r.readyAt = this.t + 150));
    }
    this.hud.flash(this.copy.brawl.title, "#ffc83d", 1300, this.copy.brawl.sub);
    this.sfx("crowd", 1);
    this.milaSay(this.copy.brawl.say, 2000, "cheer", true);
    this.announce(this.copy.brawl.announce);
  }

  private fillBrawl() {
    const busy = this.rivals.filter((r) => r.visible).length;
    const free = Phaser.Utils.Array.Shuffle(this.rivals.filter((r) => r.state === "hidden" && this.t >= r.readyAt));
    for (const r of free.slice(0, Math.max(0, EVENTS.brawlers - busy))) {
      const roll = Math.random();
      const kind: RivalKind = roll < 0.2 ? "big" : roll < 0.5 ? "speedy" : "cap";
      r.rise(kind, this.pickLook(kind), this.t, 0, { hold: true, brawl: true });
    }
  }

  private updateBrawl() {
    if (!this.brawlUntil) {
      if (!this.brawlDone && this.roundT >= EVENTS.brawlAt) this.startBrawl();
      return;
    }
    if (this.t >= this.brawlUntil) {
      this.endBrawl();
      return;
    }
    if (this.t >= this.brawlFillAt) {
      this.fillBrawl();
      this.brawlFillAt = this.t + 420;
    }
    if (this.t < this.brawlNext) return;
    this.brawlNext = this.t + Phaser.Math.Between(300, 520);
    const ready = this.rivals.filter((r) => r.brawl && r.state === "up");
    if (ready.length < 2) return;
    const a = Phaser.Utils.Array.GetRandom(ready) as Rival;
    const b = Phaser.Utils.Array.GetRandom(ready.filter((x) => x !== a)) as Rival;
    const dir = b.x < a.x ? -1 : 1;
    a.throwPose(dir);
    const from = a.hand(dir);
    const to = b.face();
    const img = this.add.image(from.x, from.y, this.randomFood()).setDepth(12.5).setScale(0.9 * a.scale);
    this.sfx("throw", 0.35, 1.2);
    this.launch(img, from, to, 460, 150, 0.8 * b.scale, () => {
      img.destroy();
      if (!b.brawl || b.state !== "up") return;
      b.getSplatted();
      this.sfx("splat", 0.3, 1.25);
      if (Math.random() < 0.35) a.taunt(this.copy.brawl.gloat);
    });
  }

  private endBrawl() {
    this.brawlUntil = 0;
    this.sfx("whistle", 1);
    this.word(this.copy.brawl.whistle, this.frame.width - 160, 470, "#fbf5e6", 56);
    for (const r of this.rivals) {
      if (r.visible && r.state !== "lowering") r.lower(() => (r.readyAt = this.t + 900));
    }
    this.nextSpawnAt = this.t + 1700;
    this.startLunchLady();
    this.milaSay(this.copy.brawl.endSay, 2000, "shout", true);
    this.announce(this.copy.brawl.endAnnounce);
  }

  private updateRivals() {
    const phase = this.phaseAt(this.roundT);
    for (const r of this.rivals) {
      r.syncAttachments(this.t);
      if (this.mode !== "playing" && this.mode !== "tutorial") continue;
      if (this.peels.size) this.checkPeel(r);
      if (r.state === "dazed") {
        if (this.t >= r.until) r.recover(this.t, Phaser.Math.Between(...FOOD_EFFECTS.recoverMs));
        continue;
      }
      if (r.state === "up" && !r.hold && this.t >= r.until) {
        if (r.feint) {
          r.taunt(this.copy.feint);
          r.lower(() => (r.readyAt = this.t + Phaser.Math.Between(300, 900)));
        } else {
          const tut = this.tutorial === "duck" && r === this.tutorialRival;
          r.startWindup(this.t, tut ? 2200 : phase.windup * r.def.windup);
          this.sfx("windup", 0.7);
          if (tut) {
            this.milaSay(this.copy.tutorial.duckSay, 3200, "shout", true);
            this.hud.pulseDuck(true);
          } else {
            this.announce(this.copy.pudding.incoming(r.slot.key), "windup", 900);
          }
        }
      } else if (r.state === "windup" && this.t >= r.until) {
        this.throwPudding(r);
      } else if ((r.state === "after" || r.state === "stunned") && this.t >= r.until) {
        r.lower(() => (r.readyAt = this.t + Phaser.Math.Between(400, 1200)));
      }
    }
  }

  private startLunchLady() {
    const f = this.frame;
    this.lunchLady.start(frameX(f, LUNCH_LADY.enterX), frameX(f, LUNCH_LADY.exitX), walkScale(f));
  }

  private launch(img: Phaser.GameObjects.Image, from: Pt, to: Pt, dur: number, lift: number, scaleTo: number, onArrive: () => void) {
    const ctrl = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - lift };
    const p: Projectile = {
      img,
      t0: this.t,
      dur,
      from,
      ctrl,
      to,
      spin: this.ctx.reducedMotion ? 0 : Phaser.Math.Between(-420, 420),
      scaleFrom: img.scaleX,
      scaleTo,
      onArrive,
    };
    this.projectiles.push(p);
    return p;
  }

  private updateProjectiles() {
    const list = this.projectiles;
    this.projectiles = [];
    for (const p of list) {
      const k = Phaser.Math.Clamp((this.t - p.t0) / p.dur, 0, 1);
      const pos = bezier(p.from, p.ctrl, p.to, k);
      p.img.setPosition(pos.x, pos.y).setAngle(p.spin * k).setScale(p.scaleFrom + (p.scaleTo - p.scaleFrom) * k);
      if (p.ring) {
        const pulse = this.ctx.reducedMotion ? 1 : 1 + Math.sin(this.t / 70) * 0.08;
        p.ring.setPosition(pos.x, pos.y).setScale(p.img.scaleX * 0.95 * pulse);
      }
      if (k >= 1) p.onArrive();
      else this.projectiles.push(p);
    }
  }

  private throwPudding(r: Rival) {
    const from = r.release(this.t);
    const tut = this.tutorial === "duck" && r === this.tutorialRival;
    const phase = this.phaseAt(this.roundT);
    const dur = (tut ? 1.5 : phase.flight) * (r.slot.row === "back" ? 1050 : 900);
    const big = r.big;
    const img = this.add.image(from.x, from.y, "pudding").setDepth(14).setScale(r.scale * (big ? 1.25 : 0.95));
    const ring = this.add.image(from.x, from.y, "threat-ring").setDepth(13.9).setAlpha(0.9);
    r.until = this.t + dur + 350;
    this.incoming += 1;
    this.sfx("incoming", 0.7);
    const shot = this.launch(img, from, { x: DECO.face.x, y: DECO.face.y + this.frame.drop }, dur, 260, big ? 1.7 : 1.3, () => {
      ring.destroy();
      this.puddingArrives(img, big, tut, r);
    });
    shot.ring = ring;
  }

  private puddingArrives(img: Phaser.GameObjects.Image, big: boolean, tut: boolean, thrower: Rival) {
    this.incoming = Math.max(0, this.incoming - 1);
    if (this.mode === "ending" || this.mode === "over") {
      this.tweens.add({ targets: img, alpha: 0, duration: 200, onComplete: () => img.destroy() });
      return;
    }
    const safe = this.ducking || this.t < this.invulnerableUntil;
    if (!safe) {
      img.destroy();
      if (thrower.celebrate()) {
        thrower.taunt(Phaser.Utils.Array.GetRandom(this.copy.gloat) as string);
        this.sfx("laugh", 0.7);
      }
      this.takeHit(big, tut);
      if (tut) this.time.delayedCall(1300, () => this.endTutorial());
      return;
    }
    if (this.ducking) {
      this.sfx("phew", 0.8);
      this.word(this.copy.pudding.phew, DECO.x + 20, 690 + this.frame.drop, "#9df0dc", 46);
      if (Math.random() < 0.5 && thrower.sulk()) thrower.taunt(Phaser.Utils.Array.GetRandom(this.copy.sulk) as string);
      if (tut) {
        this.milaSay(this.copy.tutorial.dodged, 1800, "cheer", true);
        this.time.delayedCall(900, () => this.endTutorial());
      } else if (Math.random() < 0.3) {
        this.milaSay(Phaser.Utils.Array.GetRandom(this.copy.phew) as string, 1100, "peek");
      }
    }
    const splat = SCENERY[this.frame.kind].splat;
    const spread = this.frame.kind === "portrait" ? 0.4 : 1;
    const to = { x: splat.x + Phaser.Math.Between(-60, 60) * spread, y: splat.y + Phaser.Math.Between(-80, 40) * spread };
    this.launch(img, { x: img.x, y: img.y }, to, 220, 20, img.scaleX * 0.9, () => {
      img.destroy();
      this.decal("splat-pudding", to.x, to.y, 1.5, 0.75, 0.8);
      this.sfx("splat", 0.45);
    });
  }

  private decal(tex: string, x: number, y: number, depth: number, scale: number, alpha = 0.5) {
    const d = this.add.image(x, y, tex).setDepth(depth).setScale(scale * 0.4).setAlpha(alpha).setAngle(Phaser.Math.Between(-30, 30));
    if (this.ctx.reducedMotion) d.setScale(scale);
    else this.tweens.add({ targets: d, scale, duration: 120, ease: "Back.easeOut" });
    this.decals.push(d);
    const drop = (old: Phaser.GameObjects.Image) => {
      this.decals = this.decals.filter((x) => x !== old);
      this.tweens.add({ targets: old, alpha: 0, duration: 400, onComplete: () => old.destroy() });
    };
    this.time.delayedCall(4500, () => d.active && this.decals.includes(d) && drop(d));
    if (this.decals.length > 9) drop(this.decals[0]);
  }

  private takeHit(big: boolean, tut: boolean) {
    this.invulnerableUntil = this.t + INVULNERABLE_MS;
    this.streak = 0;
    this.hud.setStreak(0);
    this.setPose("splat", 900);
    this.sfx("ouch", 0.9);
    this.sfx("splat", 1);
    const o = this.overlay;
    this.tweens.killTweensOf(o);
    o.setVisible(true).setAlpha(1).setScale(big ? 2.1 : 1.7).setAngle(Phaser.Math.Between(-12, 12));
    this.tweens.add({ targets: o, alpha: 0, delay: this.ctx.reducedMotion ? 250 : 420, duration: this.ctx.reducedMotion ? 350 : 550, onComplete: () => o.setVisible(false) });
    if (!this.ctx.reducedMotion) this.cameras.main.shake(140, 0.006);
    if (tut) {
      this.milaSay(this.copy.tutorial.hitSay, 2400, "shout", true);
      this.announce(this.copy.tutorial.hitAnnounce);
      return;
    }
    this.lives -= 1;
    this.hitsTaken += 1;
    this.hud.setLives(this.lives);
    this.milaSay(Phaser.Utils.Array.GetRandom(this.copy.ouch) as string, 1100, "shout");
    if (this.lives <= 0) {
      this.lose();
      return;
    }
    this.announce(this.copy.pudding.hit(this.lives));
  }

  private throwAuto() {
    let best: Rival | null = null;
    let score = 0;
    for (const r of this.rivals) {
      if (!r.targetable) continue;
      const shield = this.lunchLady.covers(r.face(), 30) && r.state !== "windup";
      const u = r.urgency(this.t) * (shield ? 0.4 : 1);
      if (u > score) {
        score = u;
        best = r;
      }
    }
    if (!best) {
      this.announce(this.copy.throwing.nobody, "nobody", 1500);
      return;
    }
    this.tryThrow({ kind: "rival", rival: best });
  }

  private throwAtSlot(key: number) {
    const r = this.rivals.find((x) => x.slot.key === key);
    if (!r) return;
    if (r.targetable) this.tryThrow({ kind: "rival", rival: r });
    else this.tryThrow({ kind: "point", x: r.x, y: r.slot.tableY - 40 * r.slot.scale });
  }

  private throwAtPoint(x: number, y: number) {
    let best: Rival | null = null;
    let bestD = Infinity;
    for (const r of this.rivals) {
      if (!r.targetable) continue;
      const f = r.face();
      const d = Phaser.Math.Distance.Between(x, y, f.x, f.y);
      const reach = r.slot.row === "back" ? 125 : 160;
      if (d < reach && d < bestD) {
        best = r;
        bestD = d;
      }
    }
    if (this.lunchLady.active) {
      const c = this.lunchLady.center();
      const d = Phaser.Math.Distance.Between(x, y, c.x, c.y);
      if (d < 120 && d < bestD) {
        this.tryThrow({ kind: "lunchLady" });
        return;
      }
    }
    if (best) this.tryThrow({ kind: "rival", rival: best });
    else this.tryThrow({ kind: "point", x, y });
  }

  private tryThrow(target: Target) {
    if (this.mode !== "playing" && this.mode !== "tutorial") return;
    if (this.ducking) {
      if (this.t - (this.lastSaid.get("duckhint") ?? -9999) > 2500) {
        this.lastSaid.set("duckhint", this.t);
        this.milaSay(this.copy.throwing.releaseDuck, 1400, "shout");
      }
      return;
    }
    if (this.t < this.throwReadyAt) return;
    const food = this.ammo.pop();
    if (!food) {
      this.sfx("empty", 0.8);
      if (this.t - (this.lastSaid.get("empty") ?? -9999) > 2200) {
        this.lastSaid.set("empty", this.t);
        this.milaSay(this.copy.throwing.empty, 1800, "shout");
        this.announce(this.copy.throwing.empty);
        this.hud.pulseDuck(true);
        this.time.delayedCall(1600, () => this.tutorial !== "duck" && this.hud.pulseDuck(false));
      }
      return;
    }
    this.refreshAmmo(false);
    this.throws += 1;
    this.throwReadyAt = this.t + THROW_GAP_MS;
    this.setPose("throw", 220);
    this.sfx("throw", 0.8);
    let to: Pt;
    let scaleTo = 0.8;
    if (target.kind === "rival") {
      to = target.rival.face();
      scaleTo = target.rival.slot.row === "back" ? 0.55 : 0.75;
    } else if (target.kind === "lunchLady") {
      to = this.lunchLady.center();
      scaleTo = 0.55;
    } else {
      to = { x: target.x, y: target.y };
      scaleTo = target.y < 700 ? 0.55 : 0.75;
    }
    const flip = this.frame.kind === "portrait" && to.x < DECO.x;
    this.deco.setFlipX(flip);
    const from = { x: flip ? 2 * DECO.x - DECO.hand.x : DECO.hand.x, y: DECO.hand.y + this.frame.drop };
    const dist = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
    const fairX = target.kind === "rival" ? target.rival.slot.x : landscapeX(this.frame, to.x);
    const fair = Phaser.Math.Distance.Between(DECO.hand.x, DECO.hand.y, fairX, to.y);
    const img = this.add.image(from.x, from.y, food).setDepth(13).setScale(0.9);
    this.launch(img, from, to, 240 + fair * 0.2, 90 + dist * 0.08, scaleTo, () => this.foodArrives(img, target, to, food));
  }

  private foodArrives(img: Phaser.GameObjects.Image, target: Target, to: Pt, food: Food) {
    img.destroy();
    if (this.mode === "ending" || this.mode === "over") return;
    if (target.kind === "rival" && target.rival.targetable) {
      this.contact(target.rival, food, to);
      return;
    }
    const escaped = target.kind === "rival" && (target.rival.state === "lowering" || target.rival.state === "hidden");
    if (target.kind !== "lunchLady" && this.lunchLady.covers(to)) {
      this.lunchLadyHit();
      if (escaped) this.announce(this.copy.throwing.overLady);
      return;
    }
    if (escaped && target.kind === "rival") {
      this.word(this.copy.throwing.escaped, to.x, to.y - 40, "#fbf5e6", target.rival.slot.row === "back" ? 28 : 34);
    }
    if (target.kind === "lunchLady" && this.lunchLady.active) {
      const c = this.lunchLady.center();
      if (Phaser.Math.Distance.Between(c.x, c.y, to.x, to.y) < 140) {
        this.lunchLadyHit();
        return;
      }
    }
    if (target.kind === "point") {
      for (const r of this.rivals) {
        if (!r.targetable) continue;
        const f = r.face();
        if (Phaser.Math.Distance.Between(f.x, f.y, to.x, to.y) < 80) {
          this.contact(r, food, to);
          return;
        }
      }
    }
    this.miss(to, food, target.kind === "rival" ? target.rival : undefined);
  }

  private contact(r: Rival, food: Food, at: Pt) {
    if (!r.shielded) {
      this.rivalHit(r, food);
      return;
    }
    if (food !== "apple") {
      this.blocked(r, food, at);
      return;
    }
    r.loseTray();
    this.sfx("clang", 0.8, 0.8);
    this.word(this.copy.food.trayWord, r.x + 90 * r.scale, r.top() - 6, "#fbf5e6", r.slot.row === "back" ? 30 : 36);
    this.foodNews("tray", this.copy.food.traySay, this.copy.food.trayAnnounce);
    this.rivalHit(r, food);
  }

  private foodNews(key: string, say: string, message: string) {
    if (this.mode !== "playing") return;
    if (!this.taught.has(key)) {
      this.taught.add(key);
      this.milaSay(say, 2400, "cheer", true);
      this.announce(message);
      return;
    }
    this.announce(message, `food-${key}`, 2500);
  }

  private peelSlot(at: Pt, near?: Rival) {
    if (near) return this.rivals.indexOf(near);
    let best = -1;
    let bestD = Infinity;
    this.rivals.forEach((r, i) => {
      const back = r.slot.row === "back";
      const halfW = back ? 133 : 180;
      if (Math.abs(at.x - r.x) >= halfW || at.y < r.slot.upY - 240 * r.slot.scale || at.y > r.slot.tableY + (back ? 112 : 150)) return;
      const d = Phaser.Math.Distance.Between(at.x, at.y, r.x, r.slot.tableY);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  private dropPeel(at: Pt, near?: Rival) {
    const i = this.peelSlot(at, near);
    if (i < 0 || this.peels.has(i)) return false;
    const r = this.rivals[i];
    const back = r.slot.row === "back";
    const tableScale = back ? 0.7 : 0.95;
    const dx = Phaser.Math.Clamp(at.x - r.x, -90, 90) * tableScale;
    const scale = back ? 0.8 : 1.02;
    const to = { x: r.x + dx, y: r.slot.tableY + 22 * tableScale };
    const img = this.add.image(at.x, at.y, "banana").setDepth(13).setScale(back ? 0.5 : 0.65);
    const peel: Peel = { img, dx, landed: false, armed: false };
    this.peels.set(i, peel);
    this.launch(img, at, to, 300, 70, scale, () => {
      if (this.peels.get(i) !== peel) return;
      img.setTexture("banana-peel").setOrigin(0.5, 1).setPosition(this.rivals[i].x + dx, to.y).setAngle(0).setScale(scale).setDepth(back ? 4.3 : 7.3);
      peel.landed = true;
      peel.armed = r.state === "hidden" || r.state === "lowering";
      this.sfx("splat", 0.3, 1.4);
      this.foodNews("peel", this.copy.food.peelSay, this.copy.food.peelAnnounce(r.slot.key));
    });
    return true;
  }

  private checkPeel(r: Rival) {
    const i = this.rivals.indexOf(r);
    const peel = this.peels.get(i);
    if (!peel?.landed) return;
    if (!peel.armed) {
      if (r.state === "hidden") peel.armed = true;
      return;
    }
    if (r.state !== "up" || this.mode !== "playing") return;
    this.peels.delete(i);
    r.daze(this.t, FOOD_EFFECTS.slipMs, "slip");
    this.sfx("slip", 0.9);
    const back = r.slot.row === "back";
    this.word(this.copy.food.slipWord, r.x, r.top() - 40, "#ffc83d", back ? 34 : 42);
    const img = peel.img;
    if (this.ctx.reducedMotion) img.destroy();
    else this.tweens.add({ targets: img, x: img.x + Phaser.Math.Between(-90, 90), y: img.y - 110, angle: 320, alpha: 0, duration: 420, ease: "Quad.easeOut", onComplete: () => img.destroy() });
    this.foodNews("slip", this.copy.food.slipSay, this.copy.food.slipAnnounce(r.slot.key));
  }

  private splash(source: Rival) {
    const from = source.face();
    for (const r of this.rivals) {
      if (r === source || Math.abs(r.slot.key - source.slot.key) !== 1 || !r.targetable || r.shielded) continue;
      const to = r.face();
      const img = this.add.image(from.x, from.y, "grapes").setDepth(13).setScale(0.4 * source.scale);
      this.launch(img, from, to, 230, 70, 0.32 * r.scale, () => {
        img.destroy();
        if (this.mode === "ending" || this.mode === "over" || !r.targetable || r.shielded) return;
        r.daze(this.t, FOOD_EFFECTS.splashMs, "splash");
        this.sfx("splat", 0.35, 1.3);
        this.word(this.copy.food.splashWord, r.x, r.top() - 40, "#b9a6ef", r.slot.row === "back" ? 30 : 36);
        this.foodNews("splash", this.copy.food.splashSay, this.copy.food.splashAnnounce);
      });
    }
  }

  private miss(at: Pt, food: Food, near?: Rival) {
    this.streak = 0;
    this.hud.setStreak(0);
    this.sfx("splat", 0.5);
    if (food === "banana" && this.mode === "playing" && this.dropPeel(at, near)) return;
    let depth = 1.5;
    let scale = 0.7;
    for (const { slot, x } of this.rivals) {
      const back = slot.row === "back";
      const halfW = back ? 133 : 180;
      const bottom = slot.tableY + (back ? 112 : 150);
      if (Math.abs(at.x - x) < halfW && at.y > slot.tableY - 20 && at.y < bottom) {
        depth = back ? 4.2 : 7.2;
        scale = back ? 0.5 : 0.65;
      }
    }
    this.decal("splat-food", at.x, at.y, depth, scale);
  }

  private blocked(r: Rival, food: Food, at: Pt) {
    r.block();
    this.streak = 0;
    this.hud.setStreak(0);
    this.sfx("clang", 0.9);
    const back = r.slot.row === "back";
    this.word(this.copy.tray.word, r.x, r.top() - 40, "#fbf5e6", back ? 34 : 42);
    const img = this.add.image(at.x, at.y, food).setDepth(13).setScale(back ? 0.5 : 0.65);
    const to = { x: at.x + Phaser.Math.Between(-110, 110), y: r.slot.tableY + 6 };
    this.launch(img, at, to, 420, 70, back ? 0.45 : 0.6, () => {
      img.destroy();
      this.decal("splat-food", to.x, to.y, back ? 4.2 : 7.2, back ? 0.45 : 0.6);
    });
    if (!this.trayHinted) {
      this.trayHinted = true;
      this.milaSay(this.copy.tray.hitSay, 2200, "shout", true);
      this.announce(this.copy.tray.hitAnnounce);
    } else if (Math.random() < 0.5) {
      r.taunt(this.copy.feint);
    }
  }

  private rivalHit(r: Rival, food: Food) {
    const f = r.face();
    const top = r.top();
    const back = r.slot.row === "back";
    const heavy = food === "apple" && r.hp > 1;
    const out = r.hit(this.t, food === "apple");
    if (food === "grapes") this.splash(r);
    if (heavy) this.foodNews("big", this.copy.food.bigSay, this.copy.food.bigAnnounce);
    if (out.result === "hurt") {
      this.sfx("bonk", 0.9);
      this.hitScore += SCORE.bigHurt;
      this.word(this.copy.throwing.ouch, f.x, top - 40, "#fbf5e6", back ? 36 : 44);
      this.popScore(`+${SCORE.bigHurt}`, f.x, top + 4);
      this.updateScore();
      return;
    }
    this.sfx("hit", 0.9);
    if (food === "apple") this.sfx("bonk", 0.5, 1.3);
    this.hits += 1;
    this.streak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const combo = this.streak >= 2 ? SCORE.comboStep * (this.streak - 1) : 0;
    const points = r.def.points * (r.brawl ? SCORE.brawlMultiplier : 1);
    const bonus = out.interrupted ? SCORE.interruptBonus : 0;
    this.hitScore += points;
    this.comboScore += combo;
    if (bonus) {
      this.interrupts += 1;
      this.interruptScore += bonus;
      this.time.delayedCall(this.ctx.reducedMotion ? 0 : 240, () => this.sfx("plop", 0.9));
      if (this.interrupts === 1 || Math.random() < 0.25) this.milaSay(this.copy.throwing.interruptSay, 1100, "cheer");
      this.announce(this.copy.throwing.interruptAnnounce, "interrupt", 2500);
    }
    this.updateScore();
    const word = bonus ? this.copy.throwing.interruptWord : (Phaser.Utils.Array.GetRandom(this.copy.hitWords[food]) as string);
    this.word(word, f.x, top - 44, bonus ? "#63d6c1" : "#ffc83d", back ? 38 : 48);
    this.popScore(`+${points + combo + bonus}`, f.x, top + 4, r.brawl ? "#ffc83d" : "#9df0dc");
    this.burst(f.x, f.y, 4, "spark");
    this.hud.setStreak(this.streak);
    if (this.streak > 0 && this.streak % 5 === 0) {
      this.sfx("combo", 0.9);
      this.milaSay(Phaser.Utils.Array.GetRandom(this.copy.cheer) as string, 1000, "cheer");
    }
    this.announce(this.copy.throwing.hit, "hit", 1200);
    if (this.tutorial === "throw" && r === this.tutorialRival) {
      this.hud.hidePointer();
      this.milaSay(this.copy.tutorial.thrown, 1400, "cheer", true);
      this.time.delayedCall(1100, () => this.tutorialDuck());
    } else if (this.tutorial === "duck" && r === this.tutorialRival) {
      this.hud.pulseDuck(false);
      this.milaSay(this.copy.tutorial.early, 2200, "cheer", true);
      this.announce(this.copy.tutorial.early);
      this.time.delayedCall(1500, () => this.endTutorial());
    }
  }

  private popScore(text: string, x: number, y: number, color = "#9df0dc") {
    const t = cartoonText(this, x, y, text, { size: 32, color, font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 800, ease: "Quad.easeOut", onComplete: () => t.destroy() });
  }

  private updateScore() {
    const score = Math.max(0, this.hitScore + this.comboScore + this.interruptScore - this.lunchLadyPenalty);
    this.hud.setScore(score, true);
    this.ctx.onEvent({ type: "score", score });
  }

  private cookWarn() {
    this.cook.warn();
    this.cookTook = 0;
    this.sfx("clang", 0.45);
    this.word(this.copy.cook.word, 150, 500 + this.frame.drop, "#fbf5e6", 40);
    this.milaSay(this.copy.cookLines[(this.cookIndex - 1) % this.copy.cookLines.length], 2200, "shout", true);
    this.announce(this.copy.cook.announce);
  }

  private confiscate(food: Food, from: { x: number; y: number }) {
    this.cookTook += 1;
    this.confiscated += 1;
    const to = this.cook.basket();
    const img = this.add.image(from.x, from.y - 20, food).setDepth(12.5).setScale(0.7);
    if (this.ctx.reducedMotion) {
      img.destroy();
      return;
    }
    this.tweens.add({ targets: img, x: to.x, y: to.y, scale: 0.45, angle: Phaser.Math.Between(-90, 90), duration: 380, ease: "Quad.easeIn", onComplete: () => img.destroy() });
  }

  private cookArrive() {
    const take = Math.min(COOK.take, this.ammo.length);
    for (let i = 0; i < take; i += 1) {
      const food = this.ammo.pop();
      const spot = { x: AMMO_SPOTS[this.ammo.length].x, y: AMMO_SPOTS[this.ammo.length].y + this.frame.drop };
      if (food) this.time.delayedCall(i * 140, () => this.confiscate(food, spot));
    }
    this.refreshAmmo(false);
    const at = { x: this.cook.img.x + 70, y: this.cook.img.y - this.cook.img.displayHeight - 10 };
    if (take > 0) {
      this.sfx("plop", 0.8);
      this.word(this.copy.cook.took, at.x, at.y, "#ef4f43", 44);
      this.milaSay(this.copy.cook.tookSay(take), 1800, "shout", true);
      this.announce(this.copy.cook.tookAnnounce(take));
    } else {
      this.sfx("laugh", 0.6);
      this.word(this.copy.cook.nothing, at.x, at.y, "#fbf5e6", 44);
      this.milaSay(this.copy.cook.nothingSay, 1800, "cheer", true);
      this.announce(this.copy.cook.nothingAnnounce);
    }
  }

  private lunchLadyHit() {
    this.lunchLady.scold();
    this.lunchLadyPenalty += SCORE.lunchLadyPenalty;
    this.streak = 0;
    this.hud.setStreak(0);
    this.updateScore();
    const c = this.lunchLady.center();
    this.sfx("splat", 0.7);
    this.sfx("honk", 0.9);
    this.word(this.copy.lady.hey, c.x, c.y - 140, "#ef4f43", 56);
    this.popScore(`-${SCORE.lunchLadyPenalty}`, c.x, c.y - 70);
    this.milaSay(this.copy.lady.hitSay, 1500, "shout", true);
    this.announce(this.copy.lady.hitAnnounce(SCORE.lunchLadyPenalty));
  }

  private updateDuck(dt: number) {
    const canAct = this.mode === "playing" || this.mode === "tutorial";
    const want = canAct && (this.keys.down.isDown || this.keys.s.isDown || this.keys.shift.isDown || this.duckPointer !== null);
    if (want !== this.ducking) {
      this.ducking = want;
      this.tweens.killTweensOf([this.deco, this.mila]);
      const ms = this.ctx.reducedMotion ? 60 : 110;
      const dy = this.frame.drop;
      this.tweens.add({ targets: this.deco, y: DECO.standY + dy + (want ? DECO.duckDrop : 0), duration: ms, ease: "Quad.easeOut" });
      this.tweens.add({ targets: this.mila, y: MILA.y + dy + (want ? MILA.duckDrop : 0), duration: ms + 30, ease: "Quad.easeOut" });
      if (want) {
        this.sfx("duck", 0.6);
        this.hideBubbles();
        if (this.poseUntil && this.deco.texture.key === "deco-throw") this.setPose("idle");
      }
    }
    if (this.ducking) {
      this.reloadAcc += dt;
      while (this.reloadAcc >= RELOAD_MS) {
        this.reloadAcc -= RELOAD_MS;
        if (this.cook.grabbing && this.ammo.length < AMMO_MAX) {
          this.confiscate(this.randomFood(), { x: AMMO_SPOTS[this.ammo.length].x, y: AMMO_SPOTS[this.ammo.length].y + this.frame.drop });
        } else if (this.ammo.length < AMMO_MAX) {
          this.ammo.push(this.randomFood());
          this.refreshAmmo(true);
          this.sfx("reload", 0.5, 1 + this.ammo.length * 0.05);
        }
      }
    } else {
      this.reloadAcc = Math.min(this.reloadAcc, RELOAD_MS * 0.5);
    }
    const danger = this.incoming > 0 && this.t >= this.invulnerableUntil;
    this.hud.setDuck(this.ducking ? "down" : danger && canAct ? "danger" : "idle");
  }

  private updateClock() {
    const g = this.clockHands;
    g.clear();
    const cx = this.clock.x;
    const cy = this.clock.y;
    const k = this.mode === "playing" || this.mode === "ending" ? Phaser.Math.Clamp(this.roundT / ROUND_MS, 0, 1) : 0;
    const a = -Math.PI / 2 + k * Math.PI * 2;
    g.lineStyle(8, 0x1d1830, 1);
    g.lineBetween(cx, cy, cx + Math.cos(a) * 32, cy + Math.sin(a) * 32);
    const s = -Math.PI / 2 + ((this.roundT % 6000) / 6000) * Math.PI * 2;
    g.lineStyle(3, 0xef4f43, 1);
    g.lineBetween(cx, cy, cx + Math.cos(s) * 38, cy + Math.sin(s) * 38);
  }

  private win() {
    if (this.mode !== "playing") return;
    this.mode = "ending";
    this.finishRound();
    this.setPose("cheer");
    this.mila.setTexture("mila-cheer");
    this.milaUntil = 0;
    this.sfx("bell", 1);
    this.time.delayedCall(800, () => this.sfx("win", 1));
    if (!this.ctx.reducedMotion) {
      this.tweens.add({ targets: this.bell, angle: { from: -12, to: 12 }, duration: 60, yoyo: true, repeat: 9, onComplete: () => this.bell.setAngle(0) });
      this.tweens.add({ targets: [this.deco, this.mila], y: "-=30", duration: 180, yoyo: true, repeat: 2, ease: "Quad.easeOut" });
    }
    this.word(this.copy.win.ring, this.bell.x, this.bell.y + 120, "#ffc83d", 56);
    this.hud.flash(this.copy.win.title, "#ffc83d", 1500, this.copy.win.sub);
    this.burst(DECO.x, 520 + this.frame.drop, 14);
    this.announce(this.copy.win.announce);
    this.time.delayedCall(1900, () => this.finish(true));
  }

  private lose() {
    this.mode = "ending";
    this.finishRound();
    this.setPose("splat");
    this.mila.setTexture("mila-shout");
    this.sfx("lose", 1);
    this.hud.flash(this.copy.lose.title, "#ef4f43", 1500, this.copy.lose.sub);
    let i = 0;
    for (const r of this.rivals) {
      if (r.state === "hidden") {
        const rr = r;
        this.time.delayedCall(150 + i * 120, () => {
          const kind = this.pickKind();
          rr.rise(kind, this.pickLook(kind), this.t, 0, { hold: true });
          rr.taunt(this.copy.brawl.gloat);
        });
        i += 1;
      }
    }
    this.announce(this.copy.lose.announce);
    this.time.delayedCall(2000, () => this.finish(false));
  }

  private finishRound() {
    this.brawlUntil = 0;
    this.cook.hide();
    this.hud.hideControls();
    this.hud.setStreak(0);
    this.hideBubbles();
    this.ducking = false;
    this.duckPointer = null;
    this.tweens.killTweensOf([this.deco, this.mila]);
    this.deco.setY(DECO.standY + this.frame.drop);
    this.mila.setY(MILA.y + this.frame.drop);
    for (const p of this.projectiles) {
      p.ring?.destroy();
      this.tweens.add({ targets: p.img, alpha: 0, duration: 200, onComplete: () => p.img.destroy() });
    }
    this.projectiles = [];
    this.incoming = 0;
    for (const r of this.rivals) if (r.visible && r.state !== "lowering") r.lower(() => undefined);
  }

  private finish(won: boolean) {
    this.mode = "over";
    const lifeBonus = won ? this.lives * SCORE.lifeBonus : 0;
    const clean = won && this.hitsTaken === 0 ? SCORE.cleanBonus : 0;
    const text = this.copy.result;
    const breakdown = [
      { label: text.hits(this.hits), value: this.hitScore },
      { label: text.interrupts(this.interrupts), value: this.interruptScore },
      { label: text.streaks, value: this.comboScore },
    ];
    if (won) breakdown.push({ label: text.napkinsLeft, value: lifeBonus });
    if (clean) breakdown.push({ label: text.spotless, value: clean });
    if (this.lunchLadyPenalty) breakdown.push({ label: text.scolding, value: -this.lunchLadyPenalty });
    const score = Math.max(0, breakdown.reduce((a, b) => a + b.value, 0));
    const rows = breakdown.filter((row, i) => i === 0 || row.value !== 0);
    const stars = won ? (score >= SCORE.threeStars ? 3 : score >= SCORE.twoStars ? 2 : 1) : 0;
    const achievements: string[] = [];
    if (won) achievements.push("fight-win");
    if (won && this.hitsTaken === 0) achievements.push("fight-clean");
    if (this.bestStreak >= 10) achievements.push("fight-sharpshooter");
    this.ctx.onEvent({ type: "score", score });
    const result: GameResult = {
      won,
      score,
      stars,
      breakdown: rows,
      stats: {
        hits: this.hits,
        hitPoints: this.hitScore,
        interrupts: this.interrupts,
        interruptPoints: this.interruptScore,
        comboPoints: this.comboScore,
        lives: this.lives,
        hitsTaken: this.hitsTaken,
        lunchLadyHits: Math.round(this.lunchLadyPenalty / SCORE.lunchLadyPenalty),
        bestStreak: this.bestStreak,
        throws: this.throws,
        timeMs: Math.round(this.roundT),
      },
      achievements,
      copy: won ? text.won : text.lost,
      summary: text.summary(this.hits, this.bestStreak, this.confiscated),
      ...(won && stars < 3 ? { starHint: text.starHint((stars === 1 ? SCORE.twoStars : SCORE.threeStars) - score, stars + 1) } : {}),
    };
    this.ctx.onEvent({ type: "finished", result });
  }

  update(_time: number, delta: number) {
    if (this.mode === "attract" || this.mode === "over") return;
    const dt = Math.min(delta, 100);
    this.t += dt;
    if (this.mode === "playing") this.roundT = this.t - this.roundStart;
    this.updateDuck(dt);
    this.updateProjectiles();
    this.updateRivals();
    this.lunchLady.update(dt);
    this.cook.update(dt, () => this.cookArrive(), () => this.cook.leave(this.cookTook > 0));
    if (this.ladyWasActive && !this.lunchLady.active) this.ladyGoneAt = this.t;
    this.ladyWasActive = this.lunchLady.active;
    if (this.poseUntil && this.t >= this.poseUntil && this.mode !== "ending") {
      this.poseUntil = 0;
      this.deco.setTexture("deco-idle").setFlipX(false);
    }
    if (this.milaUntil && this.t >= this.milaUntil && this.mode !== "ending") {
      this.milaUntil = 0;
      this.mila.setTexture("mila-peek");
    }
    this.updateClock();
    if (this.mode !== "playing") return;
    const left = ROUND_MS - this.roundT;
    this.hud.setTimer(left, ROUND_MS, false);
    this.updateBrawl();
    this.spawn();
    const ladyDue = this.lunchLadyIndex < LUNCH_LADY.times.length && this.roundT >= LUNCH_LADY.times[this.lunchLadyIndex];
    if (ladyDue && !this.lunchLady.active && !this.brawlUntil && this.t >= this.ladyGoneAt + LUNCH_LADY.minGap) {
      const line = this.copy.ladyLines[this.lunchLadyIndex % this.copy.ladyLines.length];
      this.lunchLadyIndex += 1;
      this.startLunchLady();
      this.sfx("whistle", 0.45);
      this.word(this.copy.lady.whistle, this.frame.width - 120, 400, "#fbf5e6", 40);
      this.milaSay(line, 2000, "shout", true);
      this.announce(this.copy.lady.announce);
    }
    const cookDue = this.cookIndex < COOK.times.length && this.roundT >= COOK.times[this.cookIndex];
    if (cookDue && !this.cook.busy && !this.brawlUntil) {
      this.cookIndex += 1;
      this.cookWarn();
    }
    const sec = Math.ceil(left / 1000);
    if (left <= 10000 && !this.warnedLast) {
      this.warnedLast = true;
      this.hud.flash(this.copy.lastSeconds.title, "#ef4f43", 900);
      this.announce(this.copy.lastSeconds.announce);
    }
    if (left <= 10000 && sec !== this.lastSecond) {
      this.lastSecond = sec;
      this.sfx("tick", 0.7);
    }
    if (left <= 0) this.win();
  }
}
