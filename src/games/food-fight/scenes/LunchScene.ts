import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import {
  AMMO_MAX,
  AMMO_SPOTS,
  DECO,
  FOODS,
  INVULNERABLE_MS,
  LIVES,
  LUNCH_LADY_TIMES,
  MILA,
  OUR_TABLE,
  PHASES,
  RELOAD_MS,
  ROUND_MS,
  SCORE,
  SLOTS,
  THROW_GAP_MS,
  W,
  WALL_SPLAT,
  type Phase,
  type RivalKind,
} from "../config";
import { LUNCH_SFX, type LunchSfx } from "../sounds";
import { Bubble, cartoonText } from "../../kit/ui";
import { LunchLady, Rival } from "./actors";
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
};

type Target = { kind: "rival"; rival: Rival } | { kind: "lunchLady" } | { kind: "point"; x: number; y: number };

const HIT_WORDS = ["PLOFT!", "SPLAT!", "NA CARA!", "BLEC!"];
const PHEW_LINES = ["Ufa!", "Passou raspando!", "Essa foi perto!"];
const OUCH_LINES = ["Eca!", "Melecou!", "Que nojo!"];
const CHEER_LINES = ["Boa!", "Na mosca!", "Isso!"];

function bezier(a: Pt, c: Pt, b: Pt, k: number): Pt {
  const u = 1 - k;
  return { x: u * u * a.x + 2 * u * k * c.x + k * k * b.x, y: u * u * a.y + 2 * u * k * c.y + k * k * b.y };
}

export class LunchScene extends Phaser.Scene {
  private ctx!: GameHostContext;
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
  private nextSpawnAt = 0;
  private projectiles: Projectile[] = [];
  private decals: Phaser.GameObjects.Image[] = [];
  private deco!: Phaser.GameObjects.Image;
  private mila!: Phaser.GameObjects.Image;
  private poseUntil = 0;
  private milaUntil = 0;
  private overlay!: Phaser.GameObjects.Image;
  private bubble!: Bubble;
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
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.highScore = (this.registry.get("highScore") as number | undefined) ?? this.ctx.highScore;
    const reduced = this.ctx.reducedMotion;
    const fonts = this.ctx.fonts;

    this.add.image(0, 0, "cafeteria-bg").setOrigin(0).setDepth(0);
    this.add.image(1490, 196, "clock").setScale(0.72).setDepth(1);
    this.clockHands = this.add.graphics().setDepth(1.1);
    this.bell = this.add.image(1690, 150, "bell").setOrigin(0.5, 0.1).setScale(0.72).setDepth(1);

    this.lunchLady = new LunchLady(this, reduced);

    const backMask = this.make.graphics({}, false).fillRect(0, 0, W, 702).createGeometryMask();
    const frontMask = this.make.graphics({}, false).fillRect(0, 0, W, 944).createGeometryMask();
    for (const slot of SLOTS) {
      const back = slot.row === "back";
      this.add
        .image(slot.x, slot.tableY, "rival-table")
        .setOrigin(0.5, 0)
        .setScale(back ? 0.7 : 0.95)
        .setDepth(back ? 4 : 7);
      this.rivals.push(new Rival(this, slot, back ? backMask : frontMask, fonts, reduced));
    }

    const ourMask = this.make.graphics({}, false).fillRect(0, 0, W, 940).createGeometryMask();
    this.deco = this.add.image(DECO.x, DECO.standY, "deco-idle").setOrigin(0.5, 1).setDepth(9).setMask(ourMask);
    this.mila = this.add.image(MILA.x, MILA.y, "mila-peek").setOrigin(0.5, 1).setDepth(10).setMask(ourMask);
    this.add.image(OUR_TABLE.x, OUR_TABLE.y, "our-table").setOrigin(0.5, 0).setDepth(11);
    for (const spot of AMMO_SPOTS) {
      this.ammoImgs.push(this.add.image(spot.x, spot.y, "sandwich").setOrigin(0.5, 1).setScale(0.62).setDepth(12).setVisible(false));
    }
    for (let i = 0; i < AMMO_MAX; i += 1) this.ammo.push(this.randomFood());
    this.refreshAmmo(false);

    this.overlay = this.add.image(380, 560, "splat-screen").setDepth(25).setScale(1.7).setVisible(false);
    this.bubble = new Bubble(this, fonts, "right", 32, 16);

    this.hud = new LunchHud(this, fonts, reduced);
    this.hud.setRecord(this.highScore);
    this.hud.setLives(this.lives);
    this.hud.setScore(0);
    this.hud.setTimer(ROUND_MS, ROUND_MS, false);

    this.setupInput();
    this.applyScale();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyScale, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.applyScale, this));
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.duckPointer = null;
    });

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
    if (this.registry.get("tutorialDone")) this.countdown();
    else this.startTutorial();
  }

  setHighScore(value: number) {
    this.highScore = value;
    this.hud?.setRecord(value);
  }

  private applyScale() {
    this.hud.layout(this.scale.displayScale.x);
    this.bubble.setBaseScale(Math.min(this.hud.uiScale, 1.5));
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

  private milaSay(text: string, ms = 1600, face: "peek" | "shout" | "cheer" = "shout") {
    this.mila.setTexture(`mila-${face}`);
    this.milaUntil = this.t + ms;
    this.bubble.say(text, MILA.x + 10, (this.ducking ? MILA.y - 70 : MILA.y - 236) - 4, ms);
  }

  private word(text: string, x: number, y: number, color: string, size = 50) {
    const t = cartoonText(this, x, y, text, { size, color, font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(15);
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

  private refreshAmmo(popLast = true) {
    this.ammoImgs.forEach((img, i) => {
      const food = this.ammo[i];
      if (!food) {
        img.setVisible(false);
        return;
      }
      const wasHidden = !img.visible;
      img.setTexture(food).setVisible(true);
      const base = food === "sandwich" || food === "banana" ? 0.62 : 0.78;
      img.setScale(base);
      if (popLast && wasHidden && i === this.ammo.length - 1 && !this.ctx.reducedMotion) {
        img.setScale(0.1);
        this.tweens.add({ targets: img, scale: base, duration: 180, ease: "Back.easeOut" });
      }
    });
  }

  private setPose(pose: Pose, ms = 0) {
    this.deco.setTexture(`deco-${pose}`);
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
    kb.on("keydown", (event: KeyboardEvent) => {
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
    });
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
    r.rise("cap", this.t, 0, { hold: true });
    r.taunt("Ha!");
    this.time.delayedCall(320, () => {
      if (this.tutorial === "throw") this.hud.showPointer(r.face().x, r.face().y);
    });
    this.milaSay("Toque no garoto para jogar um lanche!", 5000, "shout");
    this.announce("Treino. Um garoto apareceu na mesa 2. Toque nele, ou aperte espaço, para jogar um lanche.");
  }

  private tutorialDuck() {
    this.tutorial = "duck";
    const r = this.rivals[2];
    this.tutorialRival = r;
    r.rise("cap", this.t, 400);
    this.announce("Agora ele vai jogar um pudim. Segure a seta para baixo, ou o botão ABAIXAR, até o pudim passar.");
  }

  private endTutorial() {
    if (!this.tutorial) return;
    this.tutorial = null;
    this.tutorialRival = null;
    this.registry.set("tutorialDone", true);
    this.hud.pulseDuck(false);
    this.hud.hidePointer();
    for (const r of this.rivals) if (r.visible && r.state !== "lowering") r.lower(() => (r.readyAt = this.t + 400));
    this.time.delayedCall(700, () => this.countdown());
  }

  private countdown() {
    this.mode = "tutorial";
    this.hud.setTimer(ROUND_MS, ROUND_MS, false);
    this.hud.flash("PREPARE-SE!", "#ffc83d", 700, "Defenda a mesa até o sinal tocar");
    this.sfx("beep", 0.8);
    this.announce("Prepare-se! Defenda a mesa até o sinal tocar.");
    this.time.delayedCall(1300, () => {
      this.hud.flash("VAI!", "#93cf4c", 500);
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

  private spawn() {
    const phase = this.phaseAt(this.roundT);
    const active = this.rivals.filter((r) => r.visible).length;
    if (active >= phase.maxActive || this.t < this.nextSpawnAt) return;
    const free = this.rivals.filter((r) => r.state === "hidden" && this.t >= r.readyAt);
    if (!free.length) return;
    const r = Phaser.Utils.Array.GetRandom(free) as Rival;
    const roll = Math.random();
    const kind: RivalKind = roll < phase.big ? "big" : roll < phase.big + phase.speedy ? "speedy" : "cap";
    const feint = this.roundT > 8000 && Math.random() < 0.15;
    r.rise(kind, this.t, Phaser.Math.Between(260, 600), { feint });
    if (Math.random() < 0.3) r.taunt(Phaser.Utils.Array.GetRandom(r.def.taunts) as string);
    this.nextSpawnAt = this.t + Phaser.Math.Between(phase.gap[0], phase.gap[1]);
  }

  private updateRivals() {
    const phase = this.phaseAt(this.roundT);
    for (const r of this.rivals) {
      r.syncAttachments(this.t);
      if (this.mode !== "playing" && this.mode !== "tutorial") continue;
      if (r.state === "up" && !r.hold && this.t >= r.until) {
        if (r.feint) {
          r.taunt("Hehe!");
          r.lower(() => (r.readyAt = this.t + Phaser.Math.Between(300, 900)));
        } else {
          const tut = this.tutorial === "duck" && r === this.tutorialRival;
          r.startWindup(this.t, tut ? 2200 : phase.windup * r.def.windup);
          this.sfx("windup", 0.7);
          if (tut) {
            this.milaSay("Lá vem pudim! Segure ABAIXAR!", 3200, "shout");
            this.hud.pulseDuck(true);
          } else {
            this.announce(`Pudim vindo da mesa ${r.slot.key}!`, "windup", 900);
          }
        }
      } else if (r.state === "windup" && this.t >= r.until) {
        this.throwPudding(r);
      } else if ((r.state === "after" || r.state === "stunned") && this.t >= r.until) {
        r.lower(() => (r.readyAt = this.t + Phaser.Math.Between(400, 1200)));
      }
    }
  }

  private launch(img: Phaser.GameObjects.Image, from: Pt, to: Pt, dur: number, lift: number, scaleTo: number, onArrive: () => void) {
    const ctrl = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - lift };
    this.projectiles.push({
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
    });
  }

  private updateProjectiles() {
    const list = this.projectiles;
    this.projectiles = [];
    for (const p of list) {
      const k = Phaser.Math.Clamp((this.t - p.t0) / p.dur, 0, 1);
      const pos = bezier(p.from, p.ctrl, p.to, k);
      p.img.setPosition(pos.x, pos.y).setAngle(p.spin * k).setScale(p.scaleFrom + (p.scaleTo - p.scaleFrom) * k);
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
    const img = this.add.image(from.x, from.y, "pudding").setDepth(13).setScale(r.scale * (big ? 1.25 : 0.95));
    this.incoming += 1;
    this.sfx("incoming", 0.7);
    this.launch(img, from, { x: DECO.face.x, y: DECO.face.y }, dur, 260, big ? 1.7 : 1.3, () => this.puddingArrives(img, big, tut));
  }

  private puddingArrives(img: Phaser.GameObjects.Image, big: boolean, tut: boolean) {
    this.incoming = Math.max(0, this.incoming - 1);
    if (this.mode === "ending" || this.mode === "over") {
      this.tweens.add({ targets: img, alpha: 0, duration: 200, onComplete: () => img.destroy() });
      return;
    }
    const safe = this.ducking || this.t < this.invulnerableUntil;
    if (!safe) {
      img.destroy();
      this.takeHit(big, tut);
      if (tut) this.time.delayedCall(1300, () => this.endTutorial());
      return;
    }
    if (this.ducking) {
      this.sfx("phew", 0.8);
      this.word("UFA!", DECO.x + 20, 690, "#9df0dc", 46);
      if (tut) {
        this.milaSay("Isso! Agora é pra valer!", 1800, "cheer");
        this.time.delayedCall(900, () => this.endTutorial());
      } else if (Math.random() < 0.3) {
        this.milaSay(Phaser.Utils.Array.GetRandom(PHEW_LINES) as string, 1100, "peek");
      }
    }
    const to = { x: WALL_SPLAT.x + Phaser.Math.Between(-60, 60), y: WALL_SPLAT.y + Phaser.Math.Between(-80, 40) };
    this.launch(img, { x: img.x, y: img.y }, to, 220, 20, img.scaleX * 0.9, () => {
      img.destroy();
      this.decal("splat-pudding", to.x, to.y, 1.5, 0.75);
      this.sfx("splat", 0.45);
    });
  }

  private decal(tex: string, x: number, y: number, depth: number, scale: number) {
    const d = this.add.image(x, y, tex).setDepth(depth).setScale(scale * 0.4).setAngle(Phaser.Math.Between(-30, 30));
    if (this.ctx.reducedMotion) d.setScale(scale);
    else this.tweens.add({ targets: d, scale, duration: 120, ease: "Back.easeOut" });
    this.decals.push(d);
    if (this.decals.length > 14) {
      const old = this.decals.shift();
      if (old) this.tweens.add({ targets: old, alpha: 0, duration: 300, onComplete: () => old.destroy() });
    }
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
    this.tweens.add({ targets: o, alpha: 0, delay: this.ctx.reducedMotion ? 250 : 650, duration: this.ctx.reducedMotion ? 350 : 800, onComplete: () => o.setVisible(false) });
    if (!this.ctx.reducedMotion) this.cameras.main.shake(140, 0.006);
    if (tut) {
      this.milaSay("Eca! Da próxima vez, segure ABAIXAR.", 2400, "shout");
      this.announce("Levou pudim! No treino não conta. Da próxima vez, segure a seta para baixo.");
      return;
    }
    this.lives -= 1;
    this.hitsTaken += 1;
    this.hud.setLives(this.lives);
    this.milaSay(Phaser.Utils.Array.GetRandom(OUCH_LINES) as string, 1100, "shout");
    if (this.lives <= 0) {
      this.lose();
      return;
    }
    this.announce(`Levou pudim! ${this.lives === 1 ? "Resta 1 guardanapo." : `Restam ${this.lives} guardanapos.`}`);
  }

  private throwAuto() {
    let best: Rival | null = null;
    let score = 0;
    for (const r of this.rivals) {
      if (!r.targetable) continue;
      const u = r.urgency(this.t);
      if (u > score) {
        score = u;
        best = r;
      }
    }
    if (!best) {
      this.announce("Ninguém de pé agora.", "nobody", 1500);
      return;
    }
    this.tryThrow({ kind: "rival", rival: best });
  }

  private throwAtSlot(key: number) {
    const r = this.rivals.find((x) => x.slot.key === key);
    if (!r) return;
    if (r.targetable) this.tryThrow({ kind: "rival", rival: r });
    else this.tryThrow({ kind: "point", x: r.slot.x, y: r.slot.tableY - 40 * r.slot.scale });
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
        this.milaSay("Solte ABAIXAR para jogar!", 1400, "shout");
      }
      return;
    }
    if (this.t < this.throwReadyAt) return;
    const food = this.ammo.pop();
    if (!food) {
      this.sfx("empty", 0.8);
      if (this.t - (this.lastSaid.get("empty") ?? -9999) > 2200) {
        this.lastSaid.set("empty", this.t);
        this.milaSay("Acabou o lanche! Abaixe para pegar mais.", 1800, "shout");
        this.announce("Acabou o lanche! Abaixe para pegar mais.");
        this.hud.pulseDuck(true);
        this.time.delayedCall(1600, () => this.tutorial !== "duck" && this.hud.pulseDuck(false));
      }
      return;
    }
    this.refreshAmmo(false);
    this.throwReadyAt = this.t + THROW_GAP_MS;
    this.setPose("throw", 220);
    this.sfx("throw", 0.8);
    const from = { x: DECO.hand.x, y: DECO.hand.y };
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
    const dist = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
    const img = this.add.image(from.x, from.y, food).setDepth(13).setScale(0.9);
    this.launch(img, from, to, 240 + dist * 0.2, 90 + dist * 0.08, scaleTo, () => this.foodArrives(img, target, to));
  }

  private foodArrives(img: Phaser.GameObjects.Image, target: Target, to: Pt) {
    img.destroy();
    if (this.mode === "ending" || this.mode === "over") return;
    if (target.kind === "rival" && target.rival.targetable) {
      this.rivalHit(target.rival);
      return;
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
          this.rivalHit(r);
          return;
        }
      }
    }
    this.miss(to);
  }

  private miss(at: Pt) {
    this.streak = 0;
    this.hud.setStreak(0);
    this.sfx("splat", 0.5);
    let depth = 1.5;
    let scale = 0.7;
    for (const slot of SLOTS) {
      const back = slot.row === "back";
      const halfW = back ? 133 : 180;
      const bottom = slot.tableY + (back ? 112 : 150);
      if (Math.abs(at.x - slot.x) < halfW && at.y > slot.tableY - 20 && at.y < bottom) {
        depth = back ? 4.2 : 7.2;
        scale = back ? 0.5 : 0.65;
      }
    }
    this.decal("splat-food", at.x, at.y, depth, scale);
  }

  private rivalHit(r: Rival) {
    const f = r.face();
    const res = r.hit(this.t);
    if (res === "hurt") {
      this.sfx("bonk", 0.9);
      this.hitScore += 50;
      this.word("AI!", f.x, f.y - 90, "#fbf5e6", 44);
      this.popScore("+50", f.x, f.y - 30);
      this.updateScore();
      return;
    }
    this.sfx("hit", 0.9);
    this.hits += 1;
    this.streak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const combo = this.streak >= 2 ? SCORE.comboStep * (this.streak - 1) : 0;
    this.hitScore += r.def.points;
    this.comboScore += combo;
    this.updateScore();
    this.word(Phaser.Utils.Array.GetRandom(HIT_WORDS) as string, f.x, f.y - 100, "#ffc83d", r.slot.row === "back" ? 40 : 50);
    this.popScore(`+${r.def.points + combo}`, f.x, f.y - 40);
    this.burst(f.x, f.y, 6, "spark");
    this.hud.setStreak(this.streak);
    if (this.streak > 0 && this.streak % 5 === 0) {
      this.sfx("combo", 0.9);
      this.milaSay(Phaser.Utils.Array.GetRandom(CHEER_LINES) as string, 1000, "cheer");
    }
    this.announce("Acertou!", "hit", 1200);
    if (this.tutorial === "throw" && r === this.tutorialRival) {
      this.hud.hidePointer();
      this.milaSay("Boa! Agora cuidado...", 1400, "cheer");
      this.time.delayedCall(1100, () => this.tutorialDuck());
    } else if (this.tutorial === "duck" && r === this.tutorialRival) {
      this.hud.pulseDuck(false);
      this.milaSay("Boa! Acertar antes dele jogar também vale.", 2200, "cheer");
      this.announce("Boa! Acertar antes dele jogar também vale.");
      this.time.delayedCall(1500, () => this.endTutorial());
    }
  }

  private popScore(text: string, x: number, y: number) {
    const t = cartoonText(this, x, y, text, { size: 34, color: "#9df0dc", font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 800, ease: "Quad.easeOut", onComplete: () => t.destroy() });
  }

  private updateScore() {
    const score = Math.max(0, this.hitScore + this.comboScore - this.lunchLadyPenalty);
    this.hud.setScore(score, true);
    this.ctx.onEvent({ type: "score", score });
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
    this.word("EI!", c.x, c.y - 140, "#ef4f43", 56);
    this.popScore(`-${SCORE.lunchLadyPenalty}`, c.x, c.y - 70);
    this.milaSay("Opa... a tia não!", 1500, "shout");
    this.announce(`Você acertou a tia da cantina! Menos ${SCORE.lunchLadyPenalty} pontos.`);
  }

  private updateDuck(dt: number) {
    const canAct = this.mode === "playing" || this.mode === "tutorial";
    const want = canAct && (this.keys.down.isDown || this.keys.s.isDown || this.keys.shift.isDown || this.duckPointer !== null);
    if (want !== this.ducking) {
      this.ducking = want;
      this.tweens.killTweensOf([this.deco, this.mila]);
      const ms = this.ctx.reducedMotion ? 60 : 110;
      this.tweens.add({ targets: this.deco, y: DECO.standY + (want ? DECO.duckDrop : 0), duration: ms, ease: "Quad.easeOut" });
      this.tweens.add({ targets: this.mila, y: MILA.y + (want ? MILA.duckDrop : 0), duration: ms + 30, ease: "Quad.easeOut" });
      if (want) {
        this.sfx("duck", 0.6);
        this.bubble.hide();
        if (this.poseUntil && this.deco.texture.key === "deco-throw") this.setPose("idle");
      }
    }
    if (this.ducking) {
      this.reloadAcc += dt;
      while (this.reloadAcc >= RELOAD_MS) {
        this.reloadAcc -= RELOAD_MS;
        if (this.ammo.length < AMMO_MAX) {
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
    const cx = 1490;
    const cy = 196;
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
    this.word("TRIIIM!", 1690, 270, "#ffc83d", 56);
    this.hud.flash("SINAL!", "#ffc83d", 1500, "A mesa resistiu!");
    this.burst(DECO.x, 520, 14);
    this.announce("Triiim! O sinal tocou. A mesa resistiu!");
    this.time.delayedCall(1900, () => this.finish(true));
  }

  private lose() {
    this.mode = "ending";
    this.finishRound();
    this.setPose("splat");
    this.mila.setTexture("mila-shout");
    this.sfx("lose", 1);
    this.hud.flash("MELECADO!", "#ef4f43", 1500, "Acabaram os guardanapos");
    let i = 0;
    for (const r of this.rivals) {
      if (r.state === "hidden") {
        const rr = r;
        this.time.delayedCall(150 + i * 120, () => {
          rr.rise("cap", this.t, 0, { hold: true });
          rr.taunt("HAHA!");
        });
        i += 1;
      }
    }
    this.announce("Acabaram os guardanapos. Você ficou melecado!");
    this.time.delayedCall(2000, () => this.finish(false));
  }

  private finishRound() {
    this.hud.hideControls();
    this.hud.setStreak(0);
    this.bubble.hide();
    this.ducking = false;
    this.duckPointer = null;
    this.tweens.killTweensOf([this.deco, this.mila]);
    this.deco.setY(DECO.standY);
    this.mila.setY(MILA.y);
    for (const p of this.projectiles) this.tweens.add({ targets: p.img, alpha: 0, duration: 200, onComplete: () => p.img.destroy() });
    this.projectiles = [];
    this.incoming = 0;
    for (const r of this.rivals) if (r.visible && r.state !== "lowering") r.lower(() => undefined);
  }

  private finish(won: boolean) {
    this.mode = "over";
    const lifeBonus = won ? this.lives * SCORE.lifeBonus : 0;
    const clean = won && this.hitsTaken === 0 ? SCORE.cleanBonus : 0;
    const breakdown = [
      { label: `Acertos (${this.hits})`, value: this.hitScore },
      { label: "Sequências", value: this.comboScore },
    ];
    if (won) breakdown.push({ label: "Guardanapos sobrando", value: lifeBonus });
    if (clean) breakdown.push({ label: "Roupa limpinha", value: clean });
    if (this.lunchLadyPenalty) breakdown.push({ label: "Bronca da tia", value: -this.lunchLadyPenalty });
    const score = Math.max(0, breakdown.reduce((a, b) => a + b.value, 0));
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
      breakdown,
      achievements,
      copy: won
        ? { title: "Sinal!", text: "A mesa resistiu até o fim do recreio." }
        : { title: "Melecado!", text: "Acabaram os guardanapos. Fica pra próxima!" },
      summary: `${this.hits} ${this.hits === 1 ? "acerto" : "acertos"}. Melhor sequência: ${this.bestStreak}.`,
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
    if (this.poseUntil && this.t >= this.poseUntil && this.mode !== "ending") {
      this.poseUntil = 0;
      this.deco.setTexture("deco-idle");
    }
    if (this.milaUntil && this.t >= this.milaUntil && this.mode !== "ending") {
      this.milaUntil = 0;
      this.mila.setTexture("mila-peek");
    }
    this.updateClock();
    if (this.mode !== "playing") return;
    const left = ROUND_MS - this.roundT;
    this.hud.setTimer(left, ROUND_MS, false);
    this.spawn();
    if (this.lunchLadyIndex < LUNCH_LADY_TIMES.length && this.roundT >= LUNCH_LADY_TIMES[this.lunchLadyIndex]) {
      this.lunchLadyIndex += 1;
      this.lunchLady.start();
      this.milaSay("Cuidado! Não acerte a tia!", 1800, "shout");
      this.announce("A tia da cantina está passando. Não acerte ela!");
    }
    const sec = Math.ceil(left / 1000);
    if (left <= 10000 && !this.warnedLast) {
      this.warnedLast = true;
      this.hud.flash("ÚLTIMOS 10 SEGUNDOS!", "#ef4f43", 900);
      this.announce("Faltam 10 segundos!");
    }
    if (left <= 10000 && sec !== this.lastSecond) {
      this.lastSecond = sec;
      this.sfx("tick", 0.7);
    }
    if (left <= 0) this.win();
  }
}
