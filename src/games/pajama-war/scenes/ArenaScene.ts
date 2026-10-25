import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import { ARENAS } from "../arenas";
import { BODY, ESCALATE, FOOT, H, HP, KID_INFO, KIDS, PILLOW, SCORE, W, type KidId } from "../config";
import { PAJAMA_SFX, type PajamaSfx } from "../sounds";
import { loadStats, saveStats } from "../storage";
import { cartoonText } from "../../kit/ui";
import { Brain, type BrainView } from "./brain";
import { Fighter } from "./fighter";
import { PajamaHud } from "./hud";
import { Pillow } from "./pillows";
import { Room } from "./room";

type Mode = "attract" | "intro" | "play" | "over";
type Aim = { angle: number; target: Fighter | null; x: number; y: number; free: boolean };

const TOUCH_UI = typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches);
const HIT_WORDS = ["POF!", "PAF!", "FLOF!", "TUF!"];

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export class ArenaScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private levelIndex = 0;
  private mode: Mode = "attract";
  private t = 0;
  private matchTime = 0;
  private fighters: Fighter[] = [];
  private player: Fighter | null = null;
  private brains = new Map<Fighter, Brain>();
  private targets = new Map<Fighter, Fighter | null>();
  private pillows: Pillow[] = [];
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
  }

  get attract() {
    return this.mode === "attract";
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    const reduced = this.ctx.reducedMotion;
    this.levelIndex = Phaser.Math.Clamp((this.registry.get("level") as number | undefined) ?? 0, 0, ARENAS.length - 1);
    const arena = ARENAS[this.levelIndex];
    this.aiWindup = Math.round(130 + (1 - arena.ai) * 240);
    this.aiSpeed = 0.86 + arena.ai * 0.1;
    this.aiGap = Math.round(760 - arena.ai * 400);
    this.uiCam = this.cameras.add(0, 0, W, H).setName("ui");
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.route, this);
    this.cameras.main.setBackgroundColor("#1d1830");
    this.room = new Room(this, arena, reduced);

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
        this.brains.set(f, new Brain(f, this.attract ? 0.08 : arena.ai));
      }
      this.fighters.push(f);
    });
    this.guide = this.add.graphics().setDepth(1200);

    this.buildingHud = true;
    this.add.image(0, 0, "vignette").setOrigin(0, 0).setDisplaySize(W, H).setAlpha(arena.theme === "yard" ? 0.7 : 0.55).setDepth(1900);
    this.hurtFlash = this.add.image(0, 0, "vignette").setOrigin(0, 0).setDisplaySize(W, H).setTint(0xef4f43).setAlpha(0).setDepth(1901);
    if (!this.attract) {
      this.hud = new PajamaHud(this, this.ctx.fonts, arena.title, order.map((kid, i) => ({ kid, isPlayer: i === 0 })), reduced);
      this.hud.enableTouch(TOUCH_UI);
    }
    this.buildingHud = false;

    this.setupInput();
    for (const f of this.fighters) f.sync(0);
    this.hud?.layout(this.scale.displaySize.width);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
      this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.route, this);
      this.uiCam = null;
    });

    if (!this.registry.get("readySent")) {
      this.registry.set("readySent", true);
      this.ctx.onReady();
    }
    if (!this.attract) this.countdown();
  }

  private onResize() {
    this.hud?.layout(this.scale.displaySize.width);
  }

  private frameCamera(dt: number) {
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
    hud.flash("PRONTOS?", "#fbf5e6", 700, "Último de pé vence!");
    this.sfx("beep", 0.8);
    this.ctx.onEvent({ type: "announce", message: `${arena.title}. Você é ${p.kid === "nico" ? "o" : "a"} ${KID_INFO[p.kid].name}. Acerte os outros dois. Último de pé vence!` });
    this.time.delayedCall(950, () => {
      if (this.mode !== "intro") return;
      this.mode = "play";
      hud.flash("JÁ!", "#ffc83d", 520);
      this.sfx("go", 0.9);
      this.showYou();
    });
  }

  private showYou() {
    const p = this.player;
    if (!p) return;
    const label = cartoonText(this, 0, 0, "VOCÊ", { size: 30, color: "#1d1830", font: this.ctx.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
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
    kb.on("keydown", (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "escape" || key === "p") this.ctx.onEvent({ type: "pause-request" });
      if (key === " " && this.time.now - this.mouseAt > 1500) this.aimMode = "assist";
      if (key === " " && !event.repeat) this.throwQueued = this.time.now;
    });
    if (this.attract) return;
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
    this.pillows.push(new Pillow(this, f, ox, oy, angle, this.ctx.reducedMotion, f.isPlayer ? 1 : this.aiSpeed));
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
    const b = ARENAS[this.levelIndex].bounds;
    f.x = Phaser.Math.Clamp(f.x, b.x0, b.x1);
    f.y = Phaser.Math.Clamp(f.y, b.y0, b.y1);
    for (const blk of this.room.blocks) {
      const x0 = blk.x0 - FOOT.rx;
      const x1 = blk.x1 + FOOT.rx;
      const y0 = blk.y0 - FOOT.ry;
      const y1 = blk.y1 + FOOT.ry;
      if (f.x <= x0 || f.x >= x1 || f.y <= y0 || f.y >= y1) continue;
      const pen = [f.x - x0, x1 - f.x, f.y - y0, y1 - f.y];
      const m = Math.min(...pen);
      if (m === pen[0]) {
        f.x = x0;
        f.vx = Math.min(0, f.vx);
      } else if (m === pen[1]) {
        f.x = x1;
        f.vx = Math.max(0, f.vx);
      } else if (m === pen[2]) {
        f.y = y0;
        f.vy = Math.min(0, f.vy);
      } else {
        f.y = y1;
        f.vy = Math.max(0, f.vy);
      }
    }
  }

  private separate() {
    const alive = this.fighters.filter((f) => f.alive);
    for (let i = 0; i < alive.length; i += 1) {
      for (let j = i + 1; j < alive.length; j += 1) {
        const a = alive[i];
        const c = alive[j];
        const dx = (c.x - a.x) / (FOOT.rx * 2);
        const dy = (c.y - a.y) / (FOOT.ry * 2);
        const d = Math.hypot(dx, dy);
        if (d >= 1 || d === 0) continue;
        const push = (1 - d) * 0.5;
        a.x -= (dx / d) * push * FOOT.rx * 2;
        a.y -= (dy / d) * push * FOOT.ry * 2;
        c.x += (dx / d) * push * FOOT.rx * 2;
        c.y += (dy / d) * push * FOOT.ry * 2;
      }
    }
  }

  update(time: number, delta: number) {
    if (time < this.freezeUntil) return;
    const dt = Math.min(delta, 50) / 1000;
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
      const view: BrainView = { fighters: this.fighters, pillows: this.pillows, room: this.room, heat, warm, playerSafeUntil: this.playerSafeUntil, targets: this.targets };
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
            const queued = this.time.now - this.throwQueued < 180 || this.time.now - (touch?.tapAt ?? -99999) < 180;
            const wants = k.space.isDown || this.mouseDown || Boolean(touch?.throwing) || queued;
            if (wants && f.canThrow(t)) {
              f.requestThrow(t, this.aimAngle(f));
              this.throwQueued = -99999;
              if (touch) touch.tapAt = -99999;
            }
          }
        } else if (this.mode !== "over") {
          const brain = this.brains.get(f)!;
          const out = brain.think(t, dt, view);
          mx = out.mx;
          my = out.my;
          if (out.angle !== null && f.requestThrow(t, out.angle, this.attract ? undefined : this.aiWindup) && out.target && out.target === this.player) {
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
    }
    if (this.mode === "play" || this.mode === "intro") this.frameCamera(dt);
    for (const f of this.fighters) f.sync(t);
    this.room.update(t, dt, this.fighters.filter((f) => f.alive), (n, v) => this.sfx(n, v, 120));
    this.drawGuide(t);
    if (this.youTag && this.player) this.youTag.setPosition(this.player.x, this.player.top - 46);
    if (this.alerts.length) {
      for (const a of this.alerts) {
        if (t >= a.until || !a.f.alive || this.mode === "over") a.img.destroy();
        else a.img.setPosition(a.f.x, a.f.top - 40);
      }
      this.alerts = this.alerts.filter((a) => a.img.active);
    }
    if (this.player && this.hud) this.hud.avoid(this.player.x, this.player.y - 100);
  }

  private flightZ(d: number) {
    const p = d / PILLOW.range;
    const drop = p > 0.72 ? ((p - 0.72) / 0.28) ** 2 : 0;
    return Math.max(0, PILLOW.lift + Math.sin(Math.min(1, p) * Math.PI) * 22 - drop * PILLOW.lift);
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
    const cx = Math.cos(aim.angle);
    const cy = Math.sin(aim.angle) * 0.86;
    const ox = p.x + cx * 34;
    const oy = p.y + 6;
    const len = Math.hypot(cx, cy);
    const reach = Math.min(PILLOW.range * 0.98, Math.max(140, Math.hypot(aim.x - ox, aim.y - oy) / 1));
    const dots = ready ? Math.min(7, Math.floor((reach - 110) / 62) + 1) : Math.min(3, Math.floor((reach - 110) / 62) + 1);
    for (let i = 0; i < dots; i += 1) {
      const d = 110 + i * 62;
      const gx = ox + (cx / len) * d * len;
      const gy = oy + (cy / len) * d * len;
      const z = this.flightZ(d * len);
      const fade = 1 - i / (dots + 2);
      const r = ready ? 7.5 - i * 0.35 : 5.5 - i * 0.3;
      g.fillStyle(0x1d1830, (ready ? 0.75 : 0.3) * fade);
      g.fillCircle(gx + 2, gy - z + 3, r + 1.5);
      g.fillStyle(ready ? 0xffc83d : 0xfbf5e6, (ready ? 1 : 0.45) * fade);
      g.fillCircle(gx, gy - z, r);
    }
    {
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
      g.fillStyle(ready ? 0xffc83d : 0xfbf5e6, ready ? 1 : 0.7);
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

  private updatePillows(t: number, dt: number) {
    const arena = ARENAS[this.levelIndex];
    for (const p of this.pillows) {
      if (!p.alive || !p.flying) continue;
      p.update(dt);
      if (!p.flying) {
        this.feathers(p.x, p.y - 10, 3, 40);
        this.sfx("plop", 0.35, 90);
        this.room.impact(p.x, p.y, 0.4, (n, v) => this.sfx(n, v, 120));
        this.missed(p);
        continue;
      }
      let hit = false;
      for (const f of this.fighters) {
        if (!f.alive || f === p.owner || p.z < 8) continue;
        const dx = (p.x - f.x) / BODY.rx;
        const dy = (p.y - f.y) / BODY.ry;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) {
          const relevant = f.isPlayer || p.owner.isPlayer;
          const nx = (p.x - f.x) / (BODY.rx * 1.5);
          const ny = (p.y - f.y) / (BODY.ry * 2.8);
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
        if (f.hurt(t, p.x, p.y, p.vx, p.vy, p.owner)) {
          this.onHit(p, f);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      const blk = this.room.tallAt(p.x, p.y);
      if (blk && p.z < 175) {
        this.feathers(p.x, p.y - p.z, 6, 60);
        this.sfx("thud", 0.6, 60);
        blk.prop?.poke(0.9, Math.sign(p.vx) || 1, (n, v) => this.sfx(n, v, 120));
        this.room.impact(p.x, p.y, 0.7, (n, v) => this.sfx(n, v, 120));
        p.stop(p.x, p.y, p.z);
        this.missed(p);
        continue;
      }
      if (p.y < arena.bounds.y0 - 70) {
        this.feathers(p.x, p.y - p.z, 5, 50);
        this.sfx("thud", 0.45, 60);
        this.room.impact(p.x, p.y, 0.8, (n, v) => this.sfx(n, v, 120));
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

  private missed(p: Pillow) {
    if (p.hitSomeone || this.mode !== "play") return;
    const now = this.time.now;
    const pl = this.player;
    if (p.nearPlayer && pl && pl.alive && now - this.lastUfa > 1400) {
      this.lastUfa = now;
      this.word("UFA!", pl.x + 40, pl.top - 30, "#9df0dc", 34);
    } else if (p.nearFoe && p.nearFoe.alive && now - this.lastQuase > 1200) {
      this.lastQuase = now;
      this.word("QUASE!", p.nearFoe.x, p.nearFoe.top - 30, "#fbf5e6", 32);
    }
  }

  private telegraph(f: Fighter, t: number) {
    const img = cartoonText(this, f.x, f.top - 40, "!", { size: 58, color: "#ff8a3d", font: this.ctx.fonts.display, stroke: 0.24 }).setOrigin(0.5).setDepth(1455);
    if (!this.ctx.reducedMotion) {
      img.setScale(0.3);
      this.tweens.add({ targets: img, scale: 1, duration: 120, ease: "Back.easeOut" });
    }
    this.alerts.push({ f, img, until: t + this.aiWindup + 60 });
  }

  private onHit(p: Pillow, f: Fighter) {
    const owner = p.owner;
    owner.hits += 1;
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
    this.word(Phaser.Utils.Array.GetRandom(HIT_WORDS) as string, f.x + Phaser.Math.Between(-20, 20), f.top - 20, "#ffc83d", f.alive ? 46 : 56);
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
    if (this.attract) {
      if (f.hp < 4) f.hp = HP;
      return;
    }
    this.hud?.setHp(f.kid, f.hp, "hit");
    if (!f.alive) this.onKo(f, owner);
  }

  private onKo(f: Fighter, by: Fighter) {
    by.kos += 1;
    this.sfx("ko", 1);
    this.word("NOCAUTE!", f.x, f.top - 70, "#ef4f43", 60);
    this.time.delayedCall(650, () => {
      this.feathers(f.x, f.y - 40, 12, 120);
      this.orbitStars(f);
    });
    const name = KID_INFO[f.kid].name;
    this.ctx.onEvent({ type: "announce", message: f.isPlayer ? "Você foi nocauteado!" : `${name} está fora!` });
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
      this.hud?.flash("ESQUENTOU!", "#ff8a3d", 1500, "A energia volta mais devagar.");
      this.sfx("alarm", 0.8);
      this.ctx.onEvent({ type: "announce", message: "A guerra esquentou! A energia volta mais devagar." });
    } else if (this.heatStage === 1 && this.matchTime >= ESCALATE.final) {
      this.heatStage = 2;
      for (const f of this.fighters) f.regenScale = 0;
      this.hud?.flash("SEM DESCANSO!", "#ef4f43", 1600, "Ninguém recupera mais energia.");
      this.sfx("alarm", 1);
      this.ctx.onEvent({ type: "announce", message: "Sem descanso! Ninguém recupera mais energia." });
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
    }
    const placement = won ? 1 : others.length === 1 ? 2 : 3;
    const winner = won ? p : others.length === 1 ? others[0] : null;
    this.time.delayedCall(won ? 300 : 900, () => {
      if (winner) {
        winner.cheer();
        hud.setCheer(winner.kid);
        if (!reduced) {
          this.cameras.main.pan(Phaser.Math.Clamp(winner.x, W / 2 - 300, W / 2 + 300), Phaser.Math.Clamp(winner.y - 150, H / 2 - 160, H / 2 + 160), 900, "Sine.easeInOut");
          this.cameras.main.zoomTo(1.18, 900, "Sine.easeInOut");
          this.confetti(winner.x, winner.y - 260);
        }
      }
      if (won) {
        hud.flash("VOCÊ VENCEU!", "#ffc83d", 1900, "Último de pé!", true);
        this.sfx("win", 1);
        this.time.delayedCall(350, () => this.sfx("cheer", 0.9));
      } else if (winner) {
        hud.flash(`${KID_INFO[winner.kid].name.toUpperCase()} VENCEU!`, "#fbf5e6", 1900, "Mais uma partida?", true);
        this.sfx("lose", 1);
      } else {
        hud.flash("NOCAUTE!", "#ef4f43", 1900, "Você saiu da guerra.");
        this.sfx("lose", 1);
      }
    });
    hud.hideTop();

    const hits = p.hits;
    const kos = p.kos;
    const rows: { label: string; value: number }[] = [
      { label: `Acertos (${hits})`, value: hits * SCORE.hit },
      { label: `Nocautes (${kos})`, value: kos * SCORE.ko },
    ];
    if (won) {
      rows.push({ label: "Último de pé", value: SCORE.win });
      rows.push({ label: `Energia que sobrou (${p.hp})`, value: p.hp * SCORE.hp });
    } else if (placement === 2) rows.push({ label: "2º lugar", value: SCORE.second });
    const score = rows.reduce((a, r) => a + r.value, 0);
    const stars = won ? (p.hp >= 7 ? 3 : p.hp >= 4 ? 2 : 1) : 0;
    const stats = loadStats();
    stats.matches += 1;
    stats.lastKid = p.kid;
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
    const winnerName = winner ? KID_INFO[winner.kid].name : "";
    const result: GameResult = {
      won,
      score,
      stars,
      breakdown: rows.filter((r, i) => i === 0 || r.value !== 0),
      achievements,
      level: { index: this.levelIndex, id: arena.id, title: arena.title, total: ARENAS.length },
      copy: won
        ? { title: "Você ganhou!", text: "Último de pé! Mais uma partida?" }
        : placement === 2
          ? { title: "Quase!", text: `${winnerName} ficou de pé no final. Mais uma partida?` }
          : { title: "Fora da guerra!", text: "Você foi o primeiro a cair. Mais uma partida?" },
      summary: `Tempo ${fmt(this.matchTime)} · Travesseiros ${p.throws} · Acertos ${hits}`,
      alt: "Trocar personagem",
      featured: p.kid,
    };
    this.ctx.onEvent({ type: "score", score });
    this.time.delayedCall(won ? 2600 : 2400, () => this.ctx.onEvent({ type: "finished", result }));
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
