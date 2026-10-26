import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import { AREA_TITLES, FOOT, H, HINT_R, INTERACT_R, SCORE, W, type AreaId, type Dir } from "../config";
import { ALL_POSTERS, freshState, saveState, type FolkKey, type Item, type State } from "../save";
import { RESORT_SFX, type ResortSfx } from "../sounds";
import { FOUND_TEXT, ITEM_INFO, POSTER_INFO, POSTER_SCRIPT, SCRIPTS, SPEAKERS, hasMain, mainObjective, score, type Director, type Mood, type Speaker } from "../story";
import { ArcadeGame } from "../ui/arcade";
import { DialogBox } from "../ui/dialog";
import { ResortHud } from "../ui/hud";
import { Journal, pinUi, type Tab } from "../ui/journal";
import { cartoonText } from "../../kit/ui";
import { AREAS, POOL, type Builder, type PropOpts, type Show, type SpotDef } from "./areas";
import { Npc, type NpcOpts } from "./npc";
import { findPath } from "./path";
import { Player } from "./player";
import { makeTextures } from "./textures";

type Mode = "attract" | "play" | "party";
type Data = { mode?: Mode; area?: AreaId; spawn?: string; intro?: boolean };
type Rect = { x: number; y: number; w: number; h: number; show?: Show };
type Circle = { x: number; y: number; r: number; show?: Show };
type Exit = Rect & { to: AreaId; spawn: string };
type PropRec = { img: Phaser.GameObjects.Image; opts: PropOpts; key: string };
type Kick = { img: Phaser.GameObjects.Image; vx: number; vy: number };

const TOUCH_UI = typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches);
const SPEAKER_COLOR: Record<Speaker, number> = {
  deco: 0xffc83d,
  bigodes: 0xef4f43,
  marola: 0x5cb9f0,
  tilt: 0xb9a6ef,
  marisa: 0xffe39a,
  psiu: 0x63d6c1,
  lento: 0x93cf4c,
  mascot: 0x9df0dc,
  capi: 0x63d6c1,
  clique: 0xff8a3d,
  cavuca: 0xffc83d,
  chiado: 0x5cb9f0,
  placar: 0xef4f43,
  narrator: 0x2b2150,
};
const FACE_MOOD: Record<Mood, string> = { normal: "normal", talk: "talk", look: "normal", happy: "happy", sad: "sad", surprised: "surprised" };

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export class WorldScene extends Phaser.Scene implements Builder {
  s!: State;
  reduced = false;
  vars: Record<string, unknown> = {};
  private ctx!: GameHostContext;
  private mode: Mode = "attract";
  private area: AreaId = "pool";
  private spawnName = "attract";
  private intro = false;
  private w = W;
  private h = H;
  private minY = 0;
  private maxY = H;
  private rects: Rect[] = [];
  private circles: Circle[] = [];
  private blockers: ((x: number, y: number) => boolean)[] = [];
  private exits: Exit[] = [];
  private spawns: Record<string, [number, number, Dir, number]> = {};
  private props: PropRec[] = [];
  private spots: SpotDef[] = [];
  private npcs = new Map<FolkKey, Npc>();
  private updaters: ((t: number, dt: number) => void)[] = [];
  private kicks: Kick[] = [];
  private hintMarks = new Map<string, Phaser.GameObjects.Image>();
  private player: Player | null = null;
  private hud!: ResortHud;
  private dialog!: DialogBox;
  private journal!: Journal;
  private arcade!: ArcadeGame;
  private keys!: Record<"up" | "down" | "left" | "right" | "w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;
  private busy = false;
  private leaving = false;
  private nearest: SpotDef | null = null;
  private target: { x: number; y: number; spot: SpotDef | null; since: number; lastD: number; path: [number, number][] } | null = null;
  private pendingGoto: [AreaId, string] | null = null;
  private saveAt = 0;
  private lastObjective = "";
  private ambientAt = 0;
  private ambientSet: { sounds: [ResortSfx, number][]; min: number; max: number } | null = null;
  private cam = { x: 0, y: 0 };
  private auto: { x: number; y: number; done: () => void } | null = null;
  private arrows: { img: Phaser.GameObjects.Image; x: number; y: number; angle: number }[] = [];
  private frames: { rect: [number, number, number, number]; zone: [number, number, number, number] }[] = [];
  private areaActions = new Map<string, () => Promise<void> | void>();
  private greets: { who: FolkKey; lines: string[]; r: number; inside: boolean; next: number; i: number }[] = [];
  fx = {
    vhs: (label: string, ms: number) => {
      this.hud.vhsOn(true, label);
      return this.wait(ms).then(() => this.hud.vhsOn(false));
    },
    flash: (alpha = 0.6) => {
      if (this.reduced) return;
      this.cameras.main.flash(180, 255, 255, 255, false);
      void alpha;
    },
    shake: (ms = 200, i = 0.004) => {
      if (!this.reduced) this.cameras.main.shake(ms, i);
    },
    sfx: (name: ResortSfx, v = 1, pitch = 1) => this.sfx(name, v, pitch),
    wait: (ms: number) => this.wait(ms),
    gull: (x: number, y: number, i: number) => this.flyGull(x, y, i),
    word: (text: string, x: number, y: number, color = "#fbf5e6") => this.word(text, x, y, color),
  };
  private tall: { img: Phaser.GameObjects.Image; x0: number; x1: number; y0: number; y1: number; alpha: number }[] = [];

  constructor() {
    super("world");
  }

  get world() {
    return this;
  }

  init(data: Data) {
    this.mode = data?.mode ?? "attract";
    this.area = data?.area ?? "pool";
    this.spawnName = data?.spawn ?? (this.mode === "attract" ? "attract" : "");
    this.intro = Boolean(data?.intro);
    this.vars = {};
    this.rects = [];
    this.circles = [];
    this.blockers = [];
    this.exits = [];
    this.spawns = {};
    this.props = [];
    this.spots = [];
    this.npcs = new Map();
    this.updaters = [];
    this.kicks = [];
    this.hintMarks = new Map();
    this.player = null;
    this.busy = false;
    this.leaving = false;
    this.nearest = null;
    this.target = null;
    this.pendingGoto = null;
    this.ambientSet = null;
    this.auto = null;
    this.tall = [];
    this.arrows = [];
    this.frames = [];
    this.areaActions = new Map();
    this.greets = [];
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.reduced = this.ctx.reducedMotion;
    makeTextures(this);
    this.s = (this.registry.get("state") as State | null) ?? freshState();
    this.registry.set("state", this.s);
    this.cameras.main.setBackgroundColor("#1d1830");
    AREAS[this.area](this);
    this.collectTall();
    this.cameras.main.setBounds(0, 0, this.w, this.h);

    this.hud = new ResortHud(this, this.ctx.fonts, this.reduced);
    this.hud.enableTouch(TOUCH_UI);
    this.dialog = new DialogBox(this, this.ctx.fonts, this.reduced, () => this.sfx("select", 0.6));
    this.journal = new Journal(this, this.ctx.fonts, this.reduced);
    this.arcade = new ArcadeGame(this, this.ctx.fonts, this.reduced, (n, v) => this.sfx(n, v));

    if (this.mode === "attract") {
      this.hud.hide(true);
      const [sx, sy] = this.spawns.attract ?? [this.w / 2, this.h / 2];
      this.cameras.main.centerOn(sx, sy - 200);
    } else {
      if (!this.s.visited.includes(this.area)) this.s.visited.push(this.area);
      this.s.area = this.area;
      const sp = this.spawns[this.spawnName];
      const x = sp ? sp[0] : this.s.x;
      const y = sp ? sp[1] : this.s.y;
      this.player = new Player(this, x, y, this.reduced);
      this.player.dir = sp ? sp[2] : this.s.dir;
      this.player.facing = sp ? sp[3] : this.s.facing;
      this.player.onStep = () => this.sfx(this.area === "beach" ? "stepSand" : this.area === "forest" ? "step" : this.area === "station" || this.area === "lobby" || this.area === "room404" ? "stepWood" : "step", 0.5);
      this.player.sync(0);
      this.unstick();
      const [cx0, cy0] = this.cameraTarget(this.player);
      this.cam = { x: cx0, y: cy0 };
      this.cameras.main.setScroll(this.cam.x, this.cam.y);
      this.save();
      if (this.mode === "play") this.hud.flashArea(AREA_TITLES[this.area]);
      this.lastObjective = mainObjective(this.s).text;
      this.emitScore();
      if (this.area === "beach" && this.s.flags.seaPaused && !this.s.flags.gotOrder) this.hud.vhsOn(true, "▌▌ PAUSA");
    }
    this.refresh();
    this.setupInput();
    this.cameras.main.fadeIn(this.reduced ? 0 : 320, 20, 15, 38);
    if (!this.registry.get("readySent")) {
      this.registry.set("readySent", true);
      this.ctx.onReady();
    }
    if (this.mode === "play") {
      this.ctx.onEvent({ type: "announce", message: `${AREA_TITLES[this.area]}.` });
      if (this.intro) this.time.delayedCall(500, () => void this.runScript("intro"));
      if (this.area === "station" && !this.s.flags.stationIntro) {
        this.s.flags.stationIntro = true;
        this.time.delayedCall(450, () => void this.say("narrator", "Uma sala escondida, cheia de telas. Todas ligadas.").then(() => this.dialog.close()));
      }
      if (this.area === "room404" && !this.s.secrets.includes("room404") && !this.s.flags.roomIntro) {
        this.s.flags.roomIntro = true;
        this.time.delayedCall(450, () => void this.say("narrator", "Um quarto aconchegante. Alguém está dormindo... e roncando em chiado.").then(() => this.dialog.close()));
      }
    }
    if (this.mode === "party") this.time.delayedCall(400, () => void this.party());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.save());
  }

  size(w: number, h: number, minY: number, maxY: number) {
    this.w = w;
    this.h = h;
    this.minY = minY;
    this.maxY = maxY;
  }

  tiles(key: string, x: number, y: number, w: number, h: number, depth = 0) {
    return this.add.tileSprite(x, y, w, h, key).setOrigin(0, 0).setDepth(depth);
  }

  g(depth: number) {
    return this.add.graphics().setDepth(depth);
  }

  private depthOf(opts: PropOpts, y: number) {
    if (typeof opts.depth === "number") return opts.depth;
    if (opts.depth === "floor") return 1 + y / 10000;
    if (opts.depth === "wall") return 2 + y / 10000;
    if (opts.depth === "over") return 5000;
    return y;
  }

  prop(key: string, x: number, y: number, opts: PropOpts = {}) {
    const img = this.add.image(x, y, opts.key2 ? opts.key2(this.s) : key);
    const [ox, oy] = opts.origin ?? [0.5, 1];
    img.setOrigin(ox, oy).setScale(opts.scale ?? 1).setFlipX(Boolean(opts.flip)).setAngle(opts.angle ?? 0).setDepth(this.depthOf(opts, y));
    if (opts.shadow) {
      this.add
        .image(x, y + 2, "blob")
        .setDisplaySize(opts.shadow, Math.max(22, opts.shadow * 0.26))
        .setAlpha(0.38)
        .setDepth(1.05 + y / 10000);
    }
    if (opts.tint !== undefined) img.setTint(opts.tint);
    if (opts.alpha !== undefined) img.setAlpha(opts.alpha);
    if (opts.rect) {
      const [dx, dy, w, h] = opts.rect;
      this.rects.push({ x: x + dx, y: y + dy, w, h, show: opts.show });
    }
    if (opts.circle) this.circles.push({ x, y: y - 6, r: opts.circle, show: opts.show });
    if (opts.anim && !this.reduced) {
      const amp = opts.amp ?? 2;
      if (opts.anim === "sway" || opts.anim === "swing") {
        img.setAngle((opts.angle ?? 0) - amp);
        this.tweens.add({ targets: img, angle: (opts.angle ?? 0) + amp, duration: 1600 + Math.random() * 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: Math.random() * 800 });
      } else if (opts.anim === "bob") {
        this.tweens.add({ targets: img, y: y - amp * 4, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      } else if (opts.anim === "pulse") {
        this.tweens.add({ targets: img, scale: (opts.scale ?? 1) * (1 + amp / 50), duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
    }
    this.props.push({ img, opts, key });
    return img;
  }

  npc(id: FolkKey, x: number, y: number, opts: NpcOpts & { show?: Show; mood?: Mood; noShadow?: boolean } = {}) {
    if (opts.show && !opts.show(this.s)) return null;
    const n = new Npc(this, id, x, y, opts, this.reduced, !opts.noShadow);
    this.npcs.set(id, n);
    return n;
  }

  spot(def: SpotDef) {
    this.spots.push(def);
  }

  exit(x: number, y: number, w: number, h: number, to: AreaId, spawn: string, show?: Show) {
    this.exits.push({ x, y, w, h, to, spawn, show });
  }

  spawn(name: string, x: number, y: number, dir: Dir, facing = 1) {
    this.spawns[name] = [x, y, dir, facing];
  }

  block(x: number, y: number, w: number, h: number, show?: Show) {
    this.rects.push({ x, y, w, h, show });
  }

  circleBlock(x: number, y: number, r: number, show?: Show) {
    this.circles.push({ x, y, r, show });
  }

  blocker(fn: (x: number, y: number) => boolean) {
    this.blockers.push(fn);
  }

  glow(x: number, y: number, w: number, h: number, color: number, alpha: number, depth = 0.5) {
    return this.add.image(x, y, "glow").setDisplaySize(w, h).setTint(color).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth);
  }

  onUpdate(fn: (t: number, dt: number) => void) {
    this.updaters.push(fn);
  }

  ambient(sounds: [ResortSfx, number][], min: number, max: number) {
    this.ambientSet = { sounds, min, max };
    this.ambientAt = 800 + Math.random() * min;
  }

  kickable(key: string, x: number, y: number) {
    const img = this.add.image(x, y, key).setOrigin(0.5, 0.85).setDepth(y);
    this.kicks.push({ img, vx: 0, vy: 0 });
  }

  arrow(x: number, y: number, angle: number) {
    const img = this.add.image(x, y, "arrow").setAngle(angle).setDepth(1.9).setScale(0.75).setAlpha(0);
    this.arrows.push({ img, x, y, angle });
  }

  frame(rect: [number, number, number, number], zone: [number, number, number, number]) {
    this.frames.push({ rect, zone });
  }

  act(name: string, fn: () => Promise<void> | void) {
    this.areaActions.set(name, fn);
  }

  bark(who: FolkKey, text: string, sound: ResortSfx | null = "blipSoft") {
    const n = this.npcs.get(who);
    if (!n || this.mode !== "play") return;
    n.bark(text, this.ctx.fonts.display, this.time.now);
    if (sound) this.sfx(sound, 0.5, SPEAKERS[who].pitch);
    this.ctx.onEvent({ type: "announce", message: `${SPEAKERS[who].name}: ${text}` });
  }

  greet(who: FolkKey, lines: string[], r = 300) {
    this.greets.push({ who, lines, r, inside: false, next: 0, i: Math.floor(Math.random() * lines.length) });
  }

  hero() {
    const p = this.player;
    if (!p || this.mode !== "play") return null;
    return { x: p.x, y: p.y, speed: Math.hypot(p.vx, p.vy), busy: this.busy || this.dialog.open || this.journal.open };
  }

  npcOf(who: FolkKey) {
    return this.npcs.get(who) ?? null;
  }

  private sfx(name: ResortSfx, volume = 1, pitch = 1) {
    if (this.mode === "attract") return;
    this.ctx.audio.play(RESORT_SFX[name], { volume: Phaser.Math.Clamp(volume, 0.05, 1.2), pitch });
  }

  private save() {
    if (this.mode === "attract") return;
    if (this.player) {
      this.s.x = Math.round(this.player.x);
      this.s.y = Math.round(this.player.y);
      this.s.dir = this.player.dir;
      this.s.facing = this.player.facing;
    }
    this.s.area = this.area;
    saveState(this.s);
  }

  private refresh() {
    for (const p of this.props) {
      if (p.opts.show) p.img.setVisible(p.opts.show(this.s));
      if (p.opts.key2) {
        const k = p.opts.key2(this.s);
        if (p.img.texture.key !== k) p.img.setTexture(k);
      }
    }
    for (const [id, n] of this.npcs) n.setBubble(this.mode === "play" ? hasMain(this.s, id) : null);
  }

  private visible(r: { show?: Show }) {
    return !r.show || r.show(this.s);
  }

  private blocked = (x: number, y: number) => {
    if (x < 40 || x > this.w - 40 || y < this.minY || y > this.maxY) {
      const inExit = this.exits.some((e) => this.visible(e) && x > e.x - 10 && x < e.x + e.w + 10 && y > e.y - 30 && y < e.y + e.h + 30);
      if (!inExit) return true;
      if (x < 0 || x > this.w || y > this.h) return true;
    }
    const x0 = x - FOOT.hw;
    const x1 = x + FOOT.hw;
    const y0 = y - FOOT.up;
    const y1 = y + FOOT.down;
    for (const r of this.rects) {
      if (!this.visible(r)) continue;
      if (x1 > r.x && x0 < r.x + r.w && y1 > r.y && y0 < r.y + r.h) return true;
    }
    for (const c of this.circles) {
      if (!this.visible(c)) continue;
      if (Math.hypot(x - c.x, (y - c.y) * 1.4) < c.r + FOOT.hw * 0.7) return true;
    }
    for (const b of this.blockers) if (b(x, y)) return true;
    return false;
  };

  private setupInput() {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({ up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT, w: K.W, a: K.A, s: K.S, d: K.D }) as typeof this.keys;
    kb.addCapture([K.SPACE, K.UP, K.DOWN, K.LEFT, K.RIGHT]);
    kb.on("keydown", (event: KeyboardEvent) => this.onKey(event));
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      if (this.mode === "attract") return;
      this.hud.pointerMove(p);
      if (this.arcade.active && p.isDown) this.arcade.pointer(p.x, true);
      if (this.dialog.waitingChoice) this.dialog.pointer(p.x, p.y, false);
    });
    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
      this.hud.pointerUp(p);
      this.arcade.release();
    });
  }

  private onKey(event: KeyboardEvent) {
    if (this.mode === "attract") {
      if (event.key === "Escape" || event.key.toLowerCase() === "p") this.ctx.onEvent({ type: "pause-request" });
      return;
    }
    const key = event.key.toLowerCase();
    if (this.journal.open) {
      if (key === "escape" || (key === "j" && this.journal.tab !== "map") || (key === "m" && this.journal.tab === "map")) {
        event.preventDefault();
        this.closeJournal();
      } else if (key === "j" || key === "m") {
        this.sfx("select", 0.6);
        this.journal.switchTo(key === "m" ? "map" : "missions", this.s, this.area, ...this.mapRel());
      } else if (key === "arrowleft" || key === "a" || key === "q") this.journal.step(-1, this.s, this.area, ...this.mapRel());
      else if (key === "arrowright" || key === "d" || key === "e") this.journal.step(1, this.s, this.area, ...this.mapRel());
      else if (/^[1-5]$/.test(key)) this.journal.switchTo((["missions", "found", "collection", "people", "map"] as Tab[])[Number(key) - 1], this.s, this.area, ...this.mapRel());
      return;
    }
    if (key === "escape" || key === "p") {
      this.ctx.onEvent({ type: "pause-request" });
      return;
    }
    if (event.repeat) return;
    if (this.dialog.open) {
      if (key === "arrowup" || key === "w") this.dialog.key("up");
      else if (key === "arrowdown" || key === "s") this.dialog.key("down");
      else if (key === "e" || key === " " || key === "enter") {
        event.preventDefault();
        this.dialog.key("ok");
      }
      return;
    }
    if (this.busy || this.arcade.active || this.mode !== "play") return;
    if (key === "j") this.openJournal("missions"); else if (key === "m") this.openJournal("map");
    else if (key === "e" || key === " " || key === "enter") {
      event.preventDefault();
      this.interact();
    }
  }

  private onPointerDown(p: Phaser.Input.Pointer) {
    if (this.mode === "attract") return;
    if (this.journal.open) {
      const hit = this.journal.hit(p.x, p.y);
      if (hit === "close") this.closeJournal();
      else if (hit) {
        this.sfx("select", 0.6);
        this.journal.switchTo(hit, this.s, this.area, ...this.mapRel());
      }
      return;
    }
    if (this.arcade.active) {
      this.arcade.pointer(p.x, true);
      return;
    }
    if (this.dialog.open) {
      this.dialog.pointer(p.x, p.y, true);
      return;
    }
    if (this.mode !== "play" || this.busy) return;
    const btn = this.hud.buttonAt(p.x, p.y);
    if (btn) {
      this.hud.pressButton(btn);
      this.openJournal(btn === "map" ? "map" : "missions");
      return;
    }
    if (this.hud.pointerDown(p)) {
      if (this.hud.touch.action) this.interact();
      return;
    }
    const wp = p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    let best: SpotDef | null = null;
    let bestD = Infinity;
    for (const sp of this.spots) {
      if (!this.visible(sp)) continue;
      const [sx, sy] = sp.at ? sp.at() : [sp.x, sp.y];
      const d = Math.hypot(wp.x - sx, (wp.y - (sy - 110)) * 0.8);
      if (d < 150 && d < bestD) {
        bestD = d;
        best = sp;
      }
    }
    if (best) {
      const [sx, sy] = best.at ? best.at() : [best.x, best.y];
      this.walkTo(sx, sy, best);
    } else if (!TOUCH_UI) this.walkTo(wp.x, wp.y, null);
  }

  walkTo(x: number, y: number, spot: SpotDef | null) {
    if (!this.player) return;
    const path = findPath(this.blocked, this.w, this.h, this.player.x, this.player.y, x, y);
    this.target = { x, y, spot, since: this.time.now, lastD: Infinity, path };
  }

  private spotDistance(sp: SpotDef, px: number, py: number) {
    const [sx, sy] = sp.at ? sp.at() : [sp.x, sp.y];
    return Math.hypot(sx - px, (sy - py) * 1.25);
  }

  private mapRel(): [number, number] {
    if (!this.player) return [0, 0];
    return [(this.player.x / this.w - 0.5) * 1.2, (this.player.y / this.h - 0.5) * 1.2];
  }

  private openJournal(tab: Tab) {
    if (!this.player || this.busy) return;
    this.player.stop();
    this.target = null;
    this.hud.releaseStick();
    this.sfx("open", 0.6);
    this.journal.show(tab, this.s, this.area, ...this.mapRel());
  }

  private closeJournal() {
    this.sfx("close", 0.5);
    this.journal.hide();
  }

  private interact() {
    if (!this.nearest || this.busy || !this.player) return;
    const sp = this.nearest;
    const [sx, sy] = sp.at ? sp.at() : [sp.x, sp.y];
    this.player.face(sx - this.player.x, sy - 60 - this.player.y);
    void this.runScript(sp.script);
  }

  private director(): Director {
    const has = (i: Item) => this.s.items.includes(i);
    return {
      s: this.s,
      say: (who, text, mood) => this.say(who, text, mood),
      ask: async (who, text, options, mood) => {
        await this.say(who, text, mood, true);
        const i = await this.dialog.choose(options);
        return i;
      },
      has,
      give: async (i) => {
        if (!has(i)) this.s.items.push(i);
        this.sfx("pick", 0.9);
        this.popIcon(ITEM_INFO[i].icon);
        this.hud.toast("Na mochila", ITEM_INFO[i].name, ITEM_INFO[i].icon);
        this.ctx.onEvent({ type: "announce", message: `Você pegou: ${ITEM_INFO[i].name}.` });
        this.refresh();
        this.save();
        await this.wait(450);
      },
      take: (i) => {
        this.s.items = this.s.items.filter((x) => x !== i);
        this.refresh();
        this.save();
      },
      flag: (n) => Boolean(this.s.flags[n]),
      set: (n) => {
        this.s.flags[n] = true;
        this.refresh();
        this.save();
      },
      poster: async (id) => {
        if (!this.s.posters.includes(id)) this.s.posters.push(id);
        this.emitScore();
        this.sfx("poster", 0.9);
        this.popIcon("item-poster");
        this.hud.toast("Pôster guardado no diário", `${POSTER_INFO[id].title} (${this.s.posters.length}/${ALL_POSTERS.length})`, "item-poster", 0xff8a3d);
        if (this.s.posters.length === ALL_POSTERS.length) this.ctx.onEvent({ type: "achievement", id: "offair-posters" });
        this.save();
        await this.wait(300);
      },
      token: async (id) => {
        if (!this.s.tokens.includes(id)) this.s.tokens.push(id);
        this.emitScore();
        this.sfx("pick", 0.9);
        this.popIcon("item-token");
        this.hud.toast("Ficha dourada", `${this.s.tokens.length} de 3`, "item-token", 0xffe39a);
        this.s.flags.tokensHint = true;
        this.save();
        await this.wait(300);
      },
      secret: async (id) => {
        if (this.s.secrets.includes(id)) return;
        this.s.secrets.push(id);
        this.emitScore();
        this.sfx("win", 0.8);
        const names: Record<string, string> = { room404: "O hóspede do quarto 404", machine: "A máquina escondida", lento: "Seu Lento chegou" };
        this.hud.toast("Segredo encontrado!", names[id], "ui-star", 0xf06ba8);
        if (id === "room404") this.ctx.onEvent({ type: "achievement", id: "offair-room" });
        this.save();
        await this.wait(300);
      },
      meet: (id) => {
        if (!this.s.met.includes(id)) this.s.met.push(id);
      },
      discover: (id) => {
        if (this.s.found.includes(id)) return;
        this.s.found.push(id);
        this.hud.toast("Descoberta", FOUND_TEXT[id] ?? id, "ui-bulb", 0x9df0dc);
        this.save();
      },
      objective: () => this.announceObjective(),
      sfx: (n, v) => this.sfx(n, v),
      wait: (ms) => this.wait(ms),
      act: () => this.player?.act(this.time.now),
      mood: (who, mood) => this.npcs.get(who)?.setMood(mood, 1800, this.time.now),
      action: (name) => this.action(name),
      goto: (area, spawn) => {
        this.pendingGoto = [area, spawn];
      },
    };
  }

  private emitScore() {
    const sc = score(this.s);
    const total = (this.s.flags.ended ? SCORE.mystery : 0) + sc.posters * SCORE.poster + sc.tokens * SCORE.token + sc.secrets * SCORE.secret;
    this.ctx.onEvent({ type: "score", score: total });
  }

  private wait(ms: number) {
    return new Promise<void>((r) => this.time.delayedCall(this.reduced ? Math.min(ms, 300) : ms, () => r()));
  }

  private announceObjective() {
    const m = mainObjective(this.s);
    if (m.text === this.lastObjective) return;
    this.lastObjective = m.text;
    this.sfx("quest", 0.8);
    this.hud.toast(m.done ? "Missão cumprida" : "Missão", m.text, "ui-target", 0xffc83d);
    this.ctx.onEvent({ type: "announce", message: `Missão: ${m.text}` });
  }

  private popIcon(key: string) {
    if (!this.player) return;
    const img = this.add.image(this.player.x, this.player.top - 20, key).setDepth(5900).setDisplaySize(90, 90);
    if (this.reduced) {
      this.time.delayedCall(700, () => img.destroy());
      return;
    }
    this.tweens.add({ targets: img, y: img.y - 70, duration: 600, ease: "Back.easeOut" });
    this.tweens.add({ targets: img, alpha: 0, delay: 650, duration: 300, onComplete: () => img.destroy() });
  }

  private async say(who: Speaker, text: string, mood: Mood = "normal", keepOpen = false) {
    void keepOpen;
    const info = SPEAKERS[who];
    const npc = who !== "deco" && who !== "narrator" ? this.npcs.get(who as FolkKey) : undefined;
    if (npc) {
      npc.setMood(mood, 0, 0);
      npc.talk(true);
      if (this.player) this.player.face(npc.x - this.player.x, npc.y - this.player.y);
    }
    let face: string | null = null;
    if (who === "deco") face = `face-deco-${mood === "happy" ? "happy" : mood === "surprised" ? "wow" : "normal"}`;
    else if (who === "mascot") face = `face-mascot-${mood === "surprised" ? "surprised" : "normal"}`;
    else if (who !== "narrator") face = `face-${who}-${FACE_MOOD[mood]}`;
    this.ctx.onEvent({ type: "announce", message: info.name ? `${info.name}: ${text}` : text });
    await this.dialog.show({
      name: info.name,
      face,
      text,
      color: SPEAKER_COLOR[who],
      blip: () => {
        if (info.voice) this.sfx(info.voice, 0.6, info.pitch * (0.95 + Math.random() * 0.1));
        npc?.blip();
      },
    });
    npc?.talk(false);
  }

  private async runScript(id: string) {
    if (this.busy) return;
    const script = id.startsWith("poster:") ? POSTER_SCRIPT(id.slice(7) as Parameters<typeof POSTER_SCRIPT>[0]) : SCRIPTS[id];
    if (!script) return;
    this.busy = true;
    this.target = null;
    this.player?.stop();
    this.hud.showPrompt(0, 0, null);
    this.hud.releaseStick();
    this.vars.lentoTalking = id === "lento";
    this.vars.talking = id;
    try {
      await script(this.director());
    } finally {
      this.vars.lentoTalking = false;
      this.vars.talking = null;
      if (this.dialog.open) this.dialog.close();
      this.busy = false;
      this.refresh();
      this.save();
      const go = this.pendingGoto;
      this.pendingGoto = null;
      if (go) this.transition(go[0], go[1]);
    }
  }

  private transition(to: AreaId, spawn: string) {
    if (this.leaving) return;
    this.leaving = true;
    this.busy = true;
    this.player?.stop();
    this.sfx("door", 0.5);
    this.s.area = to;
    this.save();
    const go = () => this.scene.restart({ mode: "play", area: to, spawn });
    if (this.reduced) {
      go();
      return;
    }
    this.cameras.main.fadeOut(240, 20, 15, 38);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, go);
  }

  private async action(name: string) {
    const custom = this.areaActions.get(name);
    if (custom) {
      await custom();
      return;
    }
    const flamingo = this.vars.flamingo as Phaser.GameObjects.Image | undefined;
    switch (name) {
      case "fishFlamingo": {
        if (!flamingo || !this.player) return;
        this.vars.flamingoBusy = true;
        this.sfx("splash", 0.7);
        const reachX = Phaser.Math.Clamp(this.player.x, 960, 1520);
        await new Promise<void>((r) => this.tweens.add({ targets: flamingo, x: reachX, y: POOL.fishY, angle: 12, duration: this.reduced ? 10 : 900, ease: "Sine.easeInOut", onComplete: () => r() }));
        this.sfx("splash", 0.5);
        flamingo.setTexture("flamingo-empty");
        await this.wait(250);
        await new Promise<void>((r) => this.tweens.add({ targets: flamingo, x: POOL.flamingoHome[0], y: POOL.flamingoHome[1], angle: -8, duration: this.reduced ? 10 : 1200, ease: "Sine.easeInOut", onComplete: () => r() }));
        this.vars.flamingoBusy = false;
        return;
      }
      case "marolaBlow": {
        const m = this.npcs.get("marola");
        m?.setFrames({ normal: "normal", talk: "talk-w", look: "look-w", happy: "happy", sad: "normal", surprised: "talk-w" });
        m?.setMood("happy", 1600, this.time.now);
        this.sfx("whistle", 1);
        if (m) this.word("PRIIIII!", m.x + 90, m.topY - 40, "#fbf5e6");
        if (!this.reduced) this.cameras.main.shake(260, 0.004);
        for (let i = 0; i < 3; i += 1) this.flyGull((m?.x ?? 800) - 300 + i * 220, (m?.topY ?? 1100) - 40 - i * 80, i);
        if (flamingo && !this.reduced) {
          this.vars.flamingoBusy = true;
          this.tweens.add({ targets: flamingo, angle: 360, duration: 900, onComplete: () => (this.vars.flamingoBusy = false) });
        }
        await this.wait(1300);
        m?.setMood("normal", 0, 0);
        return;
      }
      case "arcade": {
        this.dialog.close();
        this.hud.hide(true);
        await this.arcade.play(TOUCH_UI);
        this.hud.hide(false);
        return;
      }
      case "rewind": {
        this.sfx("pause", 0.8, 0.7);
        this.hud.vhsOn(true, "◀◀ REBOBINANDO");
        if (!this.reduced) this.cameras.main.shake(700, 0.002);
        await this.wait(1000);
        this.hud.vhsOn(false);
        this.sfx("play", 0.6);
        return;
      }
      case "openCurtain":
        this.s.flags.curtainOpen = true;
        this.refresh();
        return;
      case "goldMachine": {
        const g = this.vars.goldGlow as Phaser.GameObjects.Image | undefined;
        g?.setVisible(true);
        this.sfx("win", 0.9);
        if (g && !this.reduced) this.tweens.add({ targets: g, alpha: { from: 0.8, to: 0.35 }, duration: 600, yoyo: true, repeat: 2 });
        await this.wait(900);
        return;
      }
      case "pauseSea": {
        this.sfx("pause", 1);
        this.vars.seaPaused = true;
        this.hud.vhsOn(true, "▌▌ PAUSA");
        (this.vars.paintNotch as (on: boolean) => void)?.(true);
        if (!this.reduced) this.cameras.main.shake(200, 0.003);
        this.s.flags.seaPaused = true;
        this.refresh();
        if (this.npcs.get("clique") && !this.s.flags.photoDone) this.time.delayedCall(700, () => this.bark("clique", "O mar parou?! Cadê minha câmera?!"));
        await this.wait(900);
        return;
      }
      case "playSea": {
        const p = this.player;
        if (p && p.y < 700 && p.x > 1040 && p.x < 1460) await this.autoWalk(p.x, 740);
        this.sfx("play", 1);
        this.hud.vhsOn(true, "▶ PLAY");
        await this.wait(800);
        this.hud.vhsOn(false);
        this.vars.seaPaused = false;
        this.s.flags.seaPaused = false;
        (this.vars.paintNotch as (on: boolean) => void)?.(false);
        this.unstick();
        this.refresh();
        return;
      }
      case "pauseFall": {
        this.sfx("pause", 1);
        this.hud.vhsOn(true, "▌▌ PAUSA");
        const fall = this.vars.fall as Phaser.GameObjects.TileSprite;
        const scan = this.vars.fallScan as Phaser.GameObjects.TileSprite;
        this.s.flags.fallPaused = true;
        if (this.reduced) {
          fall.setAlpha(0.3);
          scan.setAlpha(0.6);
        } else {
          this.tweens.add({ targets: fall, alpha: 0.3, duration: 700 });
          this.tweens.add({ targets: scan, alpha: 0.6, duration: 700 });
        }
        await this.wait(1100);
        this.hud.vhsOn(false);
        this.refresh();
        return;
      }
      case "monitorsOn": {
        this.sfx("bars", 0.7);
        this.buildFeeds();
        const msg = cartoonText(this, 1000, 160, "ORDEM RECEBIDA. ENCERRAR?", { size: 44, color: "#ffc83d", font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(3);
        this.vars.orderMsg = msg;
        if (!this.reduced) this.tweens.add({ targets: msg, alpha: 0.3, duration: 300, yoyo: true, repeat: 3 });
        await this.wait(1400);
        msg.destroy();
        return;
      }
      case "psiuIn": {
        const n = new Npc(this, "psiu", 700, 960, { scale: 0.8 }, this.reduced, true);
        this.npcs.set("psiu", n);
        n.sprite.setAlpha(0);
        this.tweens.add({ targets: n.sprite, alpha: 1, duration: this.reduced ? 10 : 600 });
        this.sfx("blipSoft", 0.6);
        await this.wait(700);
        return;
      }
      case "endOff": {
        this.sfx("bars", 1);
        const bars = this.add.graphics().setDepth(9600).setScrollFactor(0);
        const colors = [0xfbf5e6, 0xffc83d, 0x63d6c1, 0x93cf4c, 0xf06ba8, 0xef4f43, 0x5cb9f0];
        colors.forEach((c, i) => {
          bars.fillStyle(c, 1);
          bars.fillRect((i * W) / 7, 0, W / 7 + 1, H * 0.72);
        });
        bars.fillStyle(0x1d1830, 1);
        bars.fillRect(0, H * 0.72, W, H * 0.28);
        const t = cartoonText(this, W / 2, H * 0.86, "FIM DA TRANSMISSÃO", { size: 72, color: "#fbf5e6", font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(9601).setScrollFactor(0);
        await this.wait(2000);
        bars.clear();
        bars.fillStyle(0x000000, 1);
        bars.fillRect(0, 0, W, H);
        t.destroy();
        this.vars.blackout = bars;
        await this.wait(1100);
        return;
      }
      case "lightsBack": {
        const b = this.vars.blackout as Phaser.GameObjects.Graphics | undefined;
        this.sfx("open", 0.8);
        if (b) {
          if (this.reduced) b.destroy();
          else this.tweens.add({ targets: b, alpha: 0, duration: 700, onComplete: () => b.destroy() });
        }
        await this.wait(800);
        return;
      }
      case "endOn": {
        this.sfx("win", 1);
        const feeds = this.vars.feeds as Phaser.GameObjects.Container[] | undefined;
        feeds?.forEach((f) => (f.getData("live") as Phaser.GameObjects.Text | undefined)?.setText("● AO VIVO"));
        const msg = cartoonText(this, 1000, 160, "AO VIVO: FÉRIAS FORA DO AR", { size: 44, color: "#ef4f43", font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(3);
        if (!this.reduced) this.tweens.add({ targets: msg, scale: { from: 0.6, to: 1 }, duration: 300, ease: "Back.easeOut" });
        await this.wait(1200);
        return;
      }
      case "party": {
        this.s.ending = this.s.ending ?? "on";
        this.s.flags.ended = true;
        this.save();
        this.pendingGoto = null;
        this.leaving = true;
        const go = () => this.scene.restart({ mode: "party", area: "pool", spawn: "party" });
        if (this.reduced) go();
        else {
          this.cameras.main.fadeOut(700, 20, 15, 38);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, go);
        }
        await this.wait(100000);
        return;
      }
      case "mascotWake": {
        const sleeper = this.vars.sleeper as Npc | undefined;
        sleeper?.sprite.setVisible(false);
        this.sfx("open", 0.8);
        const m = new Npc(this, "mascot", 1150, 930, { scale: 0.62, frames: { normal: "happy", talk: "happy", look: "happy", happy: "excited", surprised: "surprised" } }, this.reduced, true);
        this.npcs.set("mascot", m);
        m.setMood("surprised", 0, 0);
        if (!this.reduced) this.tweens.add({ targets: m.sprite, y: { from: 860, to: 930 }, duration: 380, ease: "Bounce.easeOut" });
        await this.wait(400);
        return;
      }
      case "mascotSleep": {
        const m = this.npcs.get("mascot");
        if (m && (this.vars.sleeper as Npc | undefined) !== m) {
          if (this.reduced) m.destroy();
          else this.tweens.add({ targets: m.sprite, alpha: 0, duration: 300, onComplete: () => m.destroy() });
        }
        const sleeper = this.vars.sleeper as Npc | undefined;
        sleeper?.sprite.setVisible(true);
        if (sleeper) this.npcs.set("mascot", sleeper);
        this.refresh();
        return;
      }
      default:
        if (name.startsWith("feed:")) {
          const id = name.slice(5);
          const feeds = (this.vars.feeds as Phaser.GameObjects.Container[] | undefined) ?? [];
          const f = feeds.find((x) => x.getData("id") === id);
          if (f) {
            this.sfx("blip", 0.6);
            if (!this.reduced) this.tweens.add({ targets: f, scale: { from: 1.12, to: 1 }, duration: 260, ease: "Back.easeOut" });
          }
          await this.wait(150);
        }
    }
  }

  private collectTall() {
    for (const pr of this.props) {
      const d = pr.opts.depth;
      if (d === "floor" || d === "wall" || typeof d === "number") continue;
      const img = pr.img;
      if (img.displayHeight < 260) continue;
      const b = img.getBounds();
      this.tall.push({ img, x0: b.x + 40, x1: b.right - 40, y0: b.y, y1: b.bottom - 40, alpha: img.alpha });
    }
  }

  private fadeTall(dt: number) {
    const p = this.player;
    if (!p) return;
    const top = p.top;
    for (const t of this.tall) {
      if (!t.img.visible) continue;
      const behind = p.x > t.x0 && p.x < t.x1 && top < t.y1 && p.y > t.y0 + 140 && p.y < t.img.y - 24;
      const goal = behind ? t.alpha * 0.5 : t.alpha;
      const a = t.img.alpha + (goal - t.img.alpha) * Math.min(1, dt * 10);
      if (Math.abs(a - t.img.alpha) > 0.002) t.img.setAlpha(a);
    }
  }

  private autoWalk(x: number, y: number) {
    return new Promise<void>((resolve) => {
      this.auto = { x, y, done: resolve };
      this.time.delayedCall(4000, () => {
        if (this.auto?.done !== resolve) return;
        this.auto = null;
        resolve();
      });
    });
  }

  private unstick() {
    const p = this.player;
    if (!p || !this.blocked(p.x, p.y)) return;
    for (let r = 20; r < 600; r += 20) {
      for (let a = 0; a < 16; a += 1) {
        const x = p.x + Math.cos((a / 16) * Math.PI * 2) * r;
        const y = p.y + Math.sin((a / 16) * Math.PI * 2) * r;
        if (!this.blocked(x, y)) {
          p.x = x;
          p.y = y;
          p.sync(this.time.now);
          return;
        }
      }
    }
  }

  private buildFeeds() {
    if (this.vars.feeds) return;
    const ids: [string, string, number][] = [
      ["bigodes", "RECEPÇÃO", 0xef4f43],
      ["marola", "PISCINA", 0x5cb9f0],
      ["tilt", "FLIPERAMA", 0xb9a6ef],
      ["marisa", "PRAIA", 0xffe39a],
      ["psiu", "FLORESTA", 0x63d6c1],
      ["deco", "AQUI", 0xffc83d],
    ];
    const feeds = ids.map(([id, label, color], i) => {
      const c = i % 3;
      const r = Math.floor(i / 3);
      const x = 450 + 54 + c * 350 + 146;
      const y = 45 + 54 + r * 220 + 84;
      const bg = this.add.rectangle(0, 0, 292, 168, color, 0.9);
      const face = this.add.image(0, 8, id === "deco" ? "face-deco-normal" : `face-${id}-normal`).setDisplaySize(130, id === "deco" ? 144 : 130);
      const tag = this.add.text(-136, -78, label, { fontFamily: this.ctx.fonts.display, fontSize: "20px", color: "#1d1830" });
      const live = this.add.text(136, -78, "● AO VIVO", { fontFamily: this.ctx.fonts.display, fontSize: "18px", color: "#ef4f43" }).setOrigin(1, 0);
      const scan = this.add.tileSprite(0, 0, 292, 168, "scanlines").setAlpha(0.35);
      const cont = this.add.container(x, y, [bg, face, tag, live, scan]).setDepth(2.5);
      cont.setData("id", id);
      cont.setData("live", live);
      if (!this.reduced) cont.setAlpha(0);
      this.tweens.add({ targets: cont, alpha: 1, duration: 200, delay: i * 120 });
      return cont;
    });
    this.vars.feeds = feeds;
  }

  private word(text: string, x: number, y: number, color: string) {
    const t = cartoonText(this, x, y, text, { size: 44, color, font: this.ctx.fonts.display, stroke: 0.22 }).setOrigin(0.5).setDepth(5900);
    if (this.reduced) {
      this.time.delayedCall(800, () => t.destroy());
      return;
    }
    t.setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: "Back.easeOut" });
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, delay: 700, duration: 400, onComplete: () => t.destroy() });
  }

  private flyGull(x: number, y: number, i: number) {
    if (this.reduced) return;
    const g = this.add.image(x, y, "gull-a").setDepth(5100);
    const dir = i % 2 ? -1 : 1;
    this.tweens.add({ targets: g, x: x + dir * 900, y: y - 500, duration: 2600, ease: "Quad.easeIn", onComplete: () => g.destroy() });
    let k = 0;
    const flap = this.time.addEvent({ delay: 140, repeat: 20, callback: () => g.active && g.setTexture(k++ % 2 ? "gull-a" : "gull-b") });
    void flap;
  }

  private async party() {
    this.hud.hide(true);
    const night = this.add.rectangle(0, 0, this.w, this.h, 0x1a1450, 0.45).setOrigin(0, 0).setDepth(4400);
    void night;
    const P = POOL.party;
    this.glow(P.glow[0], P.glow[1], 900, 520, 0x5cd0f5, 0.35, 4401);
    for (const [from, to, sag] of P.garlands) garland(this, from, to, sag);
    const people: [FolkKey, number, number, NpcOpts][] = [
      ["tilt", P.tilt[0], P.tilt[1], { scale: 0.8 }],
      ["marisa", P.marisa[0], P.marisa[1], { scale: 0.85 }],
      ["psiu", P.psiu[0], P.psiu[1], { scale: 0.8 }],
    ];
    const bigodes = this.npc("bigodes", P.bigodes[0], P.bigodes[1], { scale: 0.9, depth: P.bigodes[1] });
    bigodes?.setMood("happy", 999999, 0);
    for (const [id, x, y, o] of people) {
      const n = this.npc(id, x, y, o);
      n?.setMood("happy", 999999, 0);
      if (n && !this.reduced) this.tweens.add({ targets: n.sprite, y: y - 18, duration: 260 + Math.random() * 80, yoyo: true, repeat: -1, ease: "Quad.easeOut" });
    }
    const marola = this.npcs.get("marola");
    marola?.setFrames({ normal: "happy", talk: "talk-w", look: "happy", happy: "happy", sad: "happy" });
    const mascot = this.add.image(P.mascot[0], P.mascot[1], "mascot-happy").setOrigin(0.5, 1 - 10 / 324).setScale(0.6).setDepth(P.mascot[1]);
    if (!this.reduced) this.tweens.add({ targets: mascot, angle: { from: -6, to: 6 }, duration: 420, yoyo: true, repeat: -1 });
    if (this.player) {
      this.player.x = P.player[0];
      this.player.y = P.player[1];
      this.player.cheer(true);
    }
    this.vars.panLock = true;
    this.cameras.main.pan(P.pan[0], P.pan[1], this.reduced ? 0 : 900, "Sine.easeInOut");
    this.vars.fireworks = this.time.addEvent({ delay: 900, loop: true, callback: () => this.firework() });
    this.sfx("win", 1);
    await this.wait(900);
    const off = this.s.ending === "off";
    await this.say("narrator", off ? "O Canal 404 saiu do ar de vez. O resort, não." : "O resort continua no ar. Agora, com um espectador.");
    await this.say("bigodes", off ? "Festa de despedida que não se despede. Muito normal." : "Bem-vindo, de novo. Check-out: nunca.", "happy");
    await this.say("deco", "Melhores férias fora do ar da minha vida!", "happy");
    this.dialog.close();
    await this.wait(400);
    this.endCard(off);
    this.ctx.onEvent({ type: "achievement", id: "offair-mystery" });
    await this.wait(this.reduced ? 1600 : 2800);
    this.finish();
  }

  private firework() {
    if (this.reduced) return;
    const x = 700 + Math.random() * 1400;
    const y = 120 + Math.random() * 260;
    const colors = [0xffd36b, 0xff8fc4, 0x8ff0d8, 0x9fd4ff, 0xffffff];
    const c = colors[Math.floor(Math.random() * colors.length)];
    this.sfx("firework", 0.3);
    for (let i = 0; i < 14; i += 1) {
      const a = (i / 14) * Math.PI * 2;
      const sp = this.add.image(x, y, "spark").setTint(c).setDepth(4500).setScale(0.8);
      this.tweens.add({ targets: sp, x: x + Math.cos(a) * 140, y: y + Math.sin(a) * 140 + 40, alpha: 0, duration: 1100, ease: "Quad.easeOut", onComplete: () => sp.destroy() });
    }
    const gl = this.glow(x, y, 300, 300, c, 0.5, 4499);
    this.tweens.add({ targets: gl, alpha: 0, duration: 800, onComplete: () => gl.destroy() });
    for (let i = 0; i < 6; i += 1) {
      const cf = this.add.image(this.cameras.main.scrollX + Math.random() * W, this.cameras.main.scrollY - 20, "confetti").setTint(colors[i % 5]).setDepth(4600).setAngle(Math.random() * 180);
      this.tweens.add({ targets: cf, y: cf.y + H + 40, angle: cf.angle + 400, x: cf.x + (Math.random() - 0.5) * 200, duration: 2600 + Math.random() * 1200, onComplete: () => cf.destroy() });
    }
  }

  private endCard(off: boolean) {
    const g = this.add.graphics();
    g.fillStyle(0x1d1830, 1);
    g.fillRoundedRect(-480 + 10, -150 + 12, 960, 300, 36);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(-480, -150, 960, 300, 36);
    g.lineStyle(8, 0x1d1830, 1);
    g.strokeRoundedRect(-480, -150, 960, 300, 36);
    const t1 = cartoonText(this, 0, -40, "FÉRIAS FORA DO AR", { size: 72, color: "#f06ba8", font: this.ctx.fonts.display, stroke: 0.18 }).setOrigin(0.5);
    const t2 = cartoonText(this, 0, 60, off ? "Fim da transmissão" : "Ainda no ar", { size: 46, color: "#1d1830", font: this.ctx.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const card = this.add.container(W / 2, H / 2 - 80, [g, t1, t2]).setDepth(9700);
    pinUi(card);
    if (!this.reduced) {
      card.setScale(0.4).setAlpha(0);
      this.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 420, ease: "Back.easeOut" });
    }
  }

  private finish() {
    const sc = score(this.s);
    const rows = [
      { label: "Mistério resolvido", value: SCORE.mystery },
      { label: `Pôsteres (${sc.posters}/5)`, value: sc.posters * SCORE.poster },
      { label: `Fichas douradas (${sc.tokens}/3)`, value: sc.tokens * SCORE.token },
      { label: `Segredos (${sc.secrets}/3)`, value: sc.secrets * SCORE.secret },
    ];
    const total = rows.reduce((a, r) => a + r.value, 0);
    const stars = 1 + (sc.posters >= 3 ? 1 : 0) + (sc.secrets >= 2 ? 1 : 0);
    const off = this.s.ending === "off";
    const achievements = ["offair-mystery"];
    if (sc.posters === 5) achievements.push("offair-posters");
    if (this.s.secrets.includes("room404")) achievements.push("offair-room");
    const result: GameResult = {
      won: true,
      score: total,
      stars,
      breakdown: rows.filter((r, i) => i === 0 || r.value > 0),
      achievements,
      copy: off ? { title: "Fim da transmissão!", text: "O canal saiu do ar. As férias, não." } : { title: "Ainda no ar!", text: "O resort continua no ar. Agora com um espectador." },
      summary: `Tempo ${fmt(this.s.time)} · Pôsteres ${sc.posters}/5 · Segredos ${sc.secrets}/3`,
      alt: "Nova aventura",
      restartLabel: "Voltar ao resort",
      featured: this.s.ending ?? "on",
    };
    this.s.x = POOL.party.player[0];
    this.s.y = POOL.party.player[1];
    this.s.area = "pool";
    saveState(this.s);
    this.ctx.onEvent({ type: "score", score: total });
    this.ctx.onEvent({ type: "finished", result });
  }

  update(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    for (const u of this.updaters) u(time, dt);
    for (const [, n] of this.npcs) n.update(time, this.player?.x ?? 0);
    this.dialog.update(time, dt);
    this.journal.update(time);
    if (this.ambientSet && this.mode !== "attract" && time > this.ambientAt) {
      const [snd, vol] = this.ambientSet.sounds[Math.floor(Math.random() * this.ambientSet.sounds.length)];
      this.sfx(snd, vol, 0.9 + Math.random() * 0.2);
      this.ambientAt = time + this.ambientSet.min + Math.random() * (this.ambientSet.max - this.ambientSet.min);
    }
    if (this.mode === "attract") {
      const cam = this.cameras.main;
      const k = time / 9000;
      cam.centerOn(POOL.center[0] + Math.sin(k) * 640, POOL.center[1] - 120 + Math.cos(k * 0.7) * 220);
      return;
    }
    const p = this.player;
    if (!p) return;
    if (this.mode === "play") this.s.time += delta;
    let mx = 0;
    let my = 0;
    const free = this.mode === "play" && !this.busy && !this.journal.open && !this.arcade.active && !this.leaving;
    if (this.arcade.active) {
      const k = this.keys;
      const ax = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0) + this.hud.touch.x;
      this.arcade.update(dt, Phaser.Math.Clamp(ax, -1, 1));
    }
    if (free) {
      const k = this.keys;
      mx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
      my = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
      if (this.hud.touch.active) {
        mx = this.hud.touch.x;
        my = this.hud.touch.y;
      }
      if (mx || my) this.target = null;
      if (this.target) {
        const tg = this.target;
        const sp = tg.spot;
        const reach = sp ? (sp.r ?? INTERACT_R) : 0;
        const arrive = () => {
          this.target = null;
          if (sp) {
            const [sx, sy] = sp.at ? sp.at() : [sp.x, sp.y];
            p.face(sx - p.x, sy - 60 - p.y);
            void this.runScript(sp.script);
          }
        };
        if (sp && this.spotDistance(sp, p.x, p.y) < reach * 0.7) arrive();
        else {
          while (tg.path.length > 1 && Math.hypot(tg.path[0][0] - p.x, tg.path[0][1] - p.y) < 22) {
            tg.path.shift();
            tg.lastD = Infinity;
            tg.since = time;
          }
          const [wx, wy] = tg.path[0] ?? [tg.x, tg.y];
          const dx = wx - p.x;
          const dy = wy - p.y;
          const d = Math.hypot(dx, dy);
          if (tg.path.length <= 1 && d < 16) {
            if (sp && this.spotDistance(sp, p.x, p.y) < reach * 1.2) arrive();
            else this.target = null;
          } else {
            mx = dx / d;
            my = dy / d;
            if (d < tg.lastD - 2) {
              tg.lastD = d;
              tg.since = time;
            } else if (time - tg.since > 700) {
              if (sp && this.spotDistance(sp, p.x, p.y) < reach * 1.2) arrive();
              else this.target = null;
            }
          }
        }
      }
    }
    if (this.auto) {
      const dx = this.auto.x - p.x;
      const dy = this.auto.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 12) {
        const done = this.auto.done;
        this.auto = null;
        p.stop();
        done();
      } else {
        mx = dx / d;
        my = dy / d;
      }
      p.update(time, dt, mx, my, () => false);
    } else p.update(time, dt, mx, my, this.blocked);
    for (const kb of this.kicks) {
      const dx = kb.img.x - p.x;
      const dy = (kb.img.y - p.y) * 1.6;
      const d = Math.hypot(dx, dy);
      if (d < 60 && p.moving) {
        kb.vx += (dx / (d || 1)) * 380 + p.vx * 0.6;
        kb.vy += (dy / (d || 1)) * 200 + p.vy * 0.5;
        this.sfx("kick", 0.5);
      }
      if (Math.abs(kb.vx) + Math.abs(kb.vy) > 4) {
        const nx = kb.img.x + kb.vx * dt;
        const ny = kb.img.y + kb.vy * dt;
        if (this.blocked(nx, ny)) {
          kb.vx *= -0.6;
          kb.vy *= -0.6;
        } else kb.img.setPosition(nx, ny);
        const f = Math.exp(-dt * 1.5);
        kb.vx *= f;
        kb.vy *= f;
        kb.img.angle += kb.vx * dt * 1.2;
        kb.img.setDepth(kb.img.y);
      }
    }
    this.updateCamera(dt);
    this.fadeTall(dt);
    this.updateArrows(dt);
    this.updateGreets(time);
    let best: SpotDef | null = null;
    let bestD = Infinity;
    for (const sp of this.spots) {
      if (!this.visible(sp)) {
        this.hintMarks.get(sp.id)?.setVisible(false);
        continue;
      }
      const [sx, sy] = sp.at ? sp.at() : [sp.x, sp.y];
      const d = Math.hypot(sx - p.x, (sy - p.y) * 1.25);
      if (d < (sp.r ?? INTERACT_R) && d < bestD) {
        bestD = d;
        best = sp;
      }
      if (sp.hint) this.updateHint(sp, sx, sy, d, time);
    }
    this.nearest = free ? best : null;
    if (this.nearest) {
      const sp = this.nearest;
      const verb = typeof sp.verb === "function" ? sp.verb(this.s) : sp.verb;
      const [sx, sy] = sp.at ? sp.at() : [sp.x, sp.y];
      const npc = this.npcs.get(sp.id as FolkKey);
      const y = npc ? npc.topY - 90 - npc.barkHeight : Math.min(sy - 170, p.top - 30);
      this.hud.showPrompt(sx, y, verb);
    } else this.hud.showPrompt(0, 0, null);
    this.hud.setTouchVisible(free);
    if (free && !this.leaving) {
      for (const e of this.exits) {
        if (!this.visible(e)) continue;
        if (p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h) {
          this.transition(e.to, e.spawn);
          break;
        }
      }
    }
    if (time > this.saveAt) {
      this.saveAt = time + 8000;
      this.save();
    }
  }

  private updateHint(sp: SpotDef, sx: number, sy: number, d: number, time: number) {
    const range = sp.hint === "secret" ? 240 : HINT_R;
    let mark = this.hintMarks.get(sp.id);
    if (!mark) {
      mark = this.add.image(sx, sy - 140, "spark").setDepth(5700).setTint(sp.hint === "secret" ? 0xffe39a : 0xffffff).setScale(0.9);
      this.hintMarks.set(sp.id, mark);
    }
    const show = d < range && this.nearest !== sp;
    mark.setVisible(show);
    if (show) {
      const k = 1 - d / range;
      mark.setPosition(sx, sy - 150 + (this.reduced ? 0 : Math.sin(time / 300) * 8)).setAlpha(0.35 + k * 0.55).setAngle(this.reduced ? 0 : time / 12);
    }
  }

  private cameraTarget(p: Player) {
    let tx = Phaser.Math.Clamp(p.x + p.vx * 0.25 - W / 2, 0, Math.max(0, this.w - W));
    let ty = Phaser.Math.Clamp(p.y - 130 + p.vy * 0.15 - H / 2, 0, Math.max(0, this.h - H));
    for (const f of this.frames) {
      const [zx, zy, zw, zh] = f.zone;
      if (p.x < zx || p.x > zx + zw || p.y < zy || p.y > zy + zh) continue;
      const [rx, ry, rw, rh] = f.rect;
      const fit = (v: number, lo: number, hi: number, plo: number, phi: number) => {
        const a = Math.max(lo, plo);
        const b = Math.min(hi, phi);
        return a <= b ? Phaser.Math.Clamp(v, a, b) : v;
      };
      if (rw <= W) tx = fit(tx, rx + rw - W, rx, p.x - W + 300, p.x - 300);
      if (rh <= H) ty = fit(ty, ry + rh - H, ry, p.y - H + 190, p.y - 300);
      tx = Phaser.Math.Clamp(tx, 0, Math.max(0, this.w - W));
      ty = Phaser.Math.Clamp(ty, 0, Math.max(0, this.h - H));
      break;
    }
    return [tx, ty];
  }

  private updateGreets(time: number) {
    const p = this.player;
    if (!p || this.mode !== "play") return;
    const quiet = this.busy || this.dialog.open || this.journal.open || this.arcade.active;
    for (const g of this.greets) {
      const n = this.npcs.get(g.who);
      if (!n || !n.sprite.visible) continue;
      const d = Math.hypot(n.x - p.x, (n.y - p.y) * 1.2);
      const inside = d < g.r;
      if (inside && !g.inside && !quiet && time > g.next) {
        g.next = time + 22000;
        g.i = (g.i + 1) % g.lines.length;
        n.setMood("look", 1200, time);
        this.bark(g.who, g.lines[g.i]);
      }
      g.inside = inside;
    }
  }

  private updateArrows(dt: number) {
    const p = this.player;
    if (!p) return;
    for (const a of this.arrows) {
      const d = Math.hypot(a.x - p.x, a.y - p.y);
      const goal = this.busy ? 0 : Phaser.Math.Clamp(1 - (d - 160) / 420, 0, 0.85);
      a.img.setAlpha(a.img.alpha + (goal - a.img.alpha) * Math.min(1, dt * 6));
      if (!this.reduced) {
        const k = Math.sin(this.time.now / 260) * 8;
        const r = Phaser.Math.DegToRad(a.angle);
        a.img.setPosition(a.x + Math.cos(r) * k, a.y + Math.sin(r) * k);
      }
    }
  }

  private updateCamera(dt: number) {
    const p = this.player!;
    const cam = this.cameras.main;
    const [tx, ty] = this.cameraTarget(p);
    const k = this.reduced ? 1 : 1 - Math.exp(-dt * 5);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    if (!this.vars.panLock) cam.setScroll(Math.round(this.cam.x), Math.round(this.cam.y));
  }
}

function garland(scene: WorldScene, from: [number, number], to: [number, number], sag: number) {
  const g = scene.add.graphics().setDepth(4450);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24;
    pts.push({ x: from[0] + (to[0] - from[0]) * t, y: from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * sag });
  }
  g.lineStyle(4, 0x1d1830, 1);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (const p of pts) g.lineTo(p.x, p.y);
  g.strokePath();
  const colors = [0xffd36b, 0xff8fc4, 0x8ff0d8, 0x9fd4ff];
  pts.forEach((p, i) => {
    if (i % 2 || i === 0 || i === 24) return;
    const c = colors[(i / 2) % 4];
    scene.glow(p.x, p.y + 12, 80, 80, c, 0.5, 4449);
    g.fillStyle(0x1d1830, 1);
    g.fillCircle(p.x, p.y + 12, 11);
    g.fillStyle(c, 1);
    g.fillCircle(p.x, p.y + 12, 8);
  });
}
