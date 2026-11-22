import * as Phaser from "phaser";
import type { Locale } from "@/i18n/locales";
import { getAudio } from "@/lib/audio/engine";
import { AudibleClock, SongPlayer, callFreq, keysFreq } from "../audio/player";
import { click, type Stage } from "../audio/voices";
import { TALENT_COPY, type JuryId, type TalentCopy } from "../copy";
import { judge, MAX_OFFSET, replay, type Mark, type TapLog, type Verdict } from "../sim/judge";
import { barAt, beatMsAt, type BandMember, type CompiledSong, type Signal, type SongId } from "../song/notation";
import { compiledSong, roundOf } from "../song/songs";
import { ART_FILES } from "./artManifest";
import { FIGURE, FEET, JURY_ART } from "./figure";
import { layoutFor, type Layout, type Orientation } from "./layout";

export type RunReport = { song: SongId; verdict: Verdict; replayed: Verdict | null; matches: boolean; log: TapLog };

export type TalentBridge = {
  locale: Locale;
  fonts: { display: string; body: string };
  orientation: Orientation;
  touch: boolean;
  reducedMotion: boolean;
  assist: { get: () => boolean; set: (on: boolean) => void };
  calibration: { load: () => number | null; save: (ms: number) => void };
  onLoad: (value: number) => void;
  onReady: () => void;
  onRun: (report: RunReport) => void;
  onPauseRequest: () => void;
};

type ButtonId = "assist" | "calibrate";
type PanelButton = { id: ButtonId; box: Phaser.Geom.Rectangle; root: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text };

type Mode = "idle" | "intro" | "calibrating" | "countin" | "playing" | "paused" | "resuming" | "cut" | "results";
type Mood = "neutral" | "happy" | "angry" | "shock";
type HostMood = "neutral" | "happy" | "excited" | "surprised" | "sad" | "static" | "wave";
type Pose = "ready" | "hit";
type KidFace = "normal" | "happy" | "wow";

const C = {
  ink: 0x1d1830,
  cream: 0xf7ecd4,
  cream2: 0xecd9b2,
  plum950: 0x140f26,
  plum900: 0x1f1839,
  plum800: 0x2b2150,
  plum700: 0x3f3170,
  plum500: 0x7b62c4,
  plum300: 0xb9a6ef,
  sun: 0xffc83d,
  sunPale: 0xffe39a,
  tangerine: 0xff8a3d,
  tomato: 0xef4f43,
  bubblegum: 0xf06ba8,
  mint: 0x63d6c1,
  sky: 0x5cb9f0,
  gray: 0x6d6585,
};

const BAND: BandMember[] = ["deco", "lina", "bruno", "mila"];
const JURY: JuryId[] = ["inspector", "arlindo", "lunch"];
const JURY_BIAS: Record<JuryId, number> = { inspector: -1, arlindo: 0, lunch: 1 };
const MEMBER_COLOR: Record<BandMember, number> = { deco: C.tangerine, lina: C.bubblegum, bruno: C.mint, mila: C.plum300, "404": C.sun };
const MARK_COLOR: Record<Mark, string> = { perfect: "#ffc83d", good: "#63d6c1", near: "#f7ecd4", miss: "#ef4f43", held: "#ffc83d", dropped: "#ef4f43", noise: "#ef4f43" };
const MARK_TINT: Record<Mark, number> = { perfect: C.sun, good: C.mint, near: C.cream, miss: C.tomato, held: C.sun, dropped: C.tomato, noise: C.tomato };
const CUT_STING = [69, 72, 76, 74, 72, 69];
const CALIBRATION_BEAT = 0.6;
const CALIBRATION_COUNT = 4;
const CALIBRATION_TAPS = 8;

type Popup = { text: Phaser.GameObjects.Text; born: number };
type Burst = { born: number; color: number };
type JuryView = { img: Phaser.GameObjects.Image; plate: Phaser.GameObjects.Container; plateText: Phaser.GameObjects.Text; heart: Phaser.GameObjects.Graphics; mood: Mood; moodUntil: number; heartUntil: number };
type KidView = { root: Phaser.GameObjects.Container; body: Phaser.GameObjects.Image; head: Phaser.GameObjects.Image; pose: Pose; poseUntil: number; face: KidFace; flash: KidFace; faceUntil: number; base: KidFace };
type Fan = { img: Phaser.GameObjects.Image; variant: number; leave: number; phase: number; y: number };

export class StageScene extends Phaser.Scene {
  private bridge!: TalentBridge;
  private copy!: TalentCopy;
  private L!: Layout;
  private songId: SongId = "theme";
  private compiled!: CompiledSong;
  private mode: Mode = "idle";
  private modeSince = 0;
  private stage: Stage | null = null;
  private clock: AudibleClock | null = null;
  private player: SongPlayer | null = null;
  private t0 = 0;
  private offset = 0;
  private assist = false;
  private hasCalibration = false;
  private presses: { down: number; up: number | null }[] = [];
  private active = new Map<string, { down: number; up: number | null }>();
  private verdict: Verdict | null = null;
  private seen = 0;
  private platesShown = new Set<number>();
  private displayCrowd = 70;
  private lastSignal: Signal = "clear";
  private segment = 0;
  private lastSongMs = 0;
  private resumeAt = 0;
  private calibClicks: number[] = [];
  private calibErrors: (number | null)[] = [];
  private calibEnd = 0;
  private notice = "";

  private stripG!: Phaser.GameObjects.Graphics;
  private hitG!: Phaser.GameObjects.Graphics;
  private meterG!: Phaser.GameObjects.Graphics;
  private spotG!: Phaser.GameObjects.Graphics;
  private lostTile!: Phaser.GameObjects.TileSprite;
  private weakTile!: Phaser.GameObjects.TileSprite;
  private lostMask!: Phaser.GameObjects.Graphics;
  private weakMask!: Phaser.GameObjects.Graphics;
  private host!: Phaser.GameObjects.Image;
  private hostMood: HostMood = "wave";
  private hostOverride: HostMood | null = null;
  private hostUntil = 0;
  private fans: Fan[] = [];
  private bubble!: Phaser.GameObjects.Container;
  private bubbleBg!: Phaser.GameObjects.Graphics;
  private bubbleText!: Phaser.GameObjects.Text;
  private bubbleUntil = 0;
  private shh!: Phaser.GameObjects.Text;
  private shhUntil = 0;
  private kids = new Map<BandMember, KidView>();
  private jury = new Map<JuryId, JuryView>();
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private labels: Phaser.GameObjects.Text[] = [];
  private popups: Popup[] = [];
  private bursts: Burst[] = [];
  private panel!: Phaser.GameObjects.Container;
  private panelTitle!: Phaser.GameObjects.Text;
  private panelBody!: Phaser.GameObjects.Text;
  private panelHint!: Phaser.GameObjects.Text;
  private panelArt!: Phaser.GameObjects.Graphics;
  private buttons: PanelButton[] = [];
  private pressedButton: ButtonId | null = null;

  constructor() {
    super("stage");
  }

  preload() {
    const bridge = this.registry.get("bridge") as TalentBridge;
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => bridge.onLoad(value));
    for (const [name, [, , w, h, res]] of Object.entries(ART_FILES)) {
      if (!this.textures.exists(name)) this.load.svg(name, `/assets/talent-show/${name}.svg`, { width: Math.round(w * res), height: Math.round(h * res) });
    }
  }

  create() {
    this.bridge = this.registry.get("bridge") as TalentBridge;
    this.copy = TALENT_COPY[this.bridge.locale];
    this.L = layoutFor(this.bridge.orientation);
    const saved = this.bridge.calibration.load();
    this.hasCalibration = saved !== null;
    this.offset = saved ?? 0;
    this.makeStaticTexture();
    this.buildBackdrop();
    this.buildHost();
    this.buildJury();
    this.buildBand();
    this.buildCrowd();
    this.buildStrip();
    this.buildPanel();
    this.buildButtons();
    this.setSong("theme");
    this.setMode("idle");
    this.bridge.onReady();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.player?.dispose());
  }

  private font(kind: "display" | "body", size: number, color = "#f7ecd4"): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: this.bridge.fonts[kind], fontSize: `${size}px`, color, fontStyle: kind === "body" ? "700" : undefined };
  }

  private makeStaticTexture() {
    if (this.textures.exists("talent-static")) return;
    const tex = this.textures.createCanvas("talent-static", 96, 48);
    if (!tex) return;
    const ctx = tex.getContext();
    const img = ctx.createImageData(96, 48);
    let seed = 404;
    for (let i = 0; i < 96 * 48; i += 1) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const v = 70 + (seed % 100);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v + 12;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  private outlined(kind: "display" | "body", size: number, color = "#f7ecd4", thickness = 8): Phaser.Types.GameObjects.Text.TextStyle {
    return { ...this.font(kind, size, color), stroke: "#1d1830", strokeThickness: thickness };
  }

  private buildBackdrop() {
    this.add.image(0, 0, `studio-${this.bridge.orientation}`).setOrigin(0, 0).setDepth(0);
    this.spotG = this.add.graphics().setDepth(1);
    this.titleText = this.add.text(this.L.title.x, this.L.title.y, "", this.outlined("display", this.L.title.size)).setOrigin(0, 0.5).setDepth(20);
    this.subtitleText = this.add.text(this.L.title.x, this.L.title.y + this.L.title.size * 0.95, "", this.outlined("body", this.L.text.label + 4, "#b9a6ef", 6)).setOrigin(0, 0.5).setDepth(20);
    this.add.text(this.L.live.x, this.L.live.y, `● ${this.copy.live}`, this.outlined("display", this.L.live.size, "#ef4f43")).setOrigin(1, 0.5).setDepth(20);
    const m = this.L.meter;
    this.add.text(m.x - 16, m.y + m.h / 2, this.copy.crowd, this.outlined("display", this.L.text.label + 4)).setOrigin(1, 0.5).setDepth(20);
    this.meterG = this.add.graphics().setDepth(20);
    this.hintText = this.add.text(this.L.hint.x, this.L.hint.y, "", this.font("body", this.L.hint.size, "#b9a6ef")).setOrigin(0.5).setDepth(20);
  }

  private buildHost() {
    const { x, y, scale } = this.L.host;
    this.host = this.add.image(x, y, "host-wave").setOrigin(0.5, 298 / 304).setScale(scale / 2).setDepth(5);
    this.bubbleBg = this.add.graphics();
    this.bubbleText = this.add.text(0, 0, "", this.font("display", this.L.text.bubble, "#1d1830")).setOrigin(0, 0.5);
    this.bubble = this.add.container(x + 70 * scale, y - 300 * scale, [this.bubbleBg, this.bubbleText]).setDepth(15).setVisible(false);
  }

  private say(text: string, ms = 1400) {
    this.bubbleText.setText(text).setPosition(22, 0);
    const w = this.bubbleText.width + 44;
    const h = this.L.text.bubble * 1.7;
    this.bubbleBg.clear();
    this.bubbleBg.fillStyle(C.cream, 1).fillRoundedRect(0, -h / 2, w, h, h / 2);
    this.bubbleBg.lineStyle(5, C.ink, 1).strokeRoundedRect(0, -h / 2, w, h, h / 2);
    this.bubbleBg.fillStyle(C.cream, 1).fillTriangle(16, h / 2 - 6, 40, h / 2 - 6, 4, h / 2 + 22);
    this.bubbleBg.lineStyle(5, C.ink, 1).lineBetween(16, h / 2 - 2, 4, h / 2 + 22).lineBetween(4, h / 2 + 22, 40, h / 2 - 2);
    this.bubble.setVisible(true);
    this.bubbleUntil = performance.now() + ms;
  }

  private hostFlash(mood: HostMood, ms: number) {
    this.hostOverride = mood;
    this.hostUntil = performance.now() + ms;
  }

  private updateHost(now: number, signal: Signal) {
    const live = this.mode === "playing" || this.mode === "countin" || this.mode === "resuming";
    let mood: HostMood;
    if (live && signal === "lost") mood = "static";
    else if (this.hostOverride && now < this.hostUntil) mood = this.hostOverride;
    else if (this.mode === "idle" || this.mode === "intro" || this.mode === "calibrating") mood = "wave";
    else if (this.mode === "countin" || this.mode === "resuming") mood = "excited";
    else if (this.mode === "cut") mood = "sad";
    else if (this.mode === "results") mood = (this.verdict?.stars ?? 0) >= 2 ? "happy" : (this.verdict?.stars ?? 0) === 1 ? "neutral" : "sad";
    else mood = "neutral";
    if (mood !== this.hostMood) {
      this.hostMood = mood;
      this.host.setTexture(`host-${mood}`);
    }
  }

  private juryTexture(id: JuryId, mood: Mood) {
    if (id === "inspector") return mood === "angry" ? "jury-inspector-angry" : mood === "shock" ? "jury-inspector-shock" : "jury-inspector-neutral";
    return mood === "angry" || mood === "shock" ? `jury-${id}-angry` : `jury-${id}-neutral`;
  }

  private buildJury() {
    const { xs, y, scale } = this.L.jury;
    JURY.forEach((id, i) => {
      const art = JURY_ART[id];
      const img = this.add.image(0, 0, this.juryTexture(id, "neutral")).setOrigin(art.originX, art.crop / art.h).setScale(art.scale / 2);
      img.setCrop(0, 0, art.w * 2, art.crop * 2);
      const desk = this.add.image(0, -14, "desk").setOrigin(0.5, 0).setScale(0.5);
      const name = this.add.text(0, -14 + 77, this.copy.jury[id], this.font("body", this.L.text.label, "#1d1830")).setOrigin(0.5);
      if (name.width > 140) name.setScale(140 / name.width);
      const top = -art.crop * art.scale;
      const plateImg = this.add.image(0, 0, "plate").setOrigin(0.5, 1).setScale(0.4);
      const plateText = this.add.text(0, -116 * 0.8, "", this.font("display", 62, "#1d1830")).setOrigin(0.5);
      const plate = this.add.container(art.plateX, top + 18, [plateImg, plateText]).setVisible(false);
      const heart = this.add.graphics();
      heart.fillStyle(C.bubblegum, 1).fillCircle(-11, 0, 13).fillCircle(11, 0, 13).fillTriangle(-23, 5, 23, 5, 0, 32);
      heart.lineStyle(4, C.ink, 1).strokeCircle(-11, 0, 13).strokeCircle(11, 0, 13);
      heart.setPosition(art.plateX * 0.6, top - 10).setVisible(false);
      this.add.container(xs[i], y, [img, desk, name, plate, heart]).setScale(scale).setDepth(6);
      this.jury.set(id, { img, plate, plateText, heart, mood: "neutral", moodUntil: 0, heartUntil: 0 });
    });
    const inspector = JURY_ART.inspector;
    this.shh = this.add.text(this.L.jury.xs[0] - 40 * scale, y - inspector.crop * inspector.scale * scale - 10, this.copy.host.shh, this.outlined("display", this.L.text.bubble, "#ef4f43"))
      .setOrigin(1, 0.5)
      .setDepth(16)
      .setVisible(false);
  }

  private juryMood(id: JuryId, mood: Mood, ms = 900) {
    const view = this.jury.get(id);
    if (!view) return;
    const now = performance.now();
    view.moodUntil = now + ms;
    if (mood === "happy") {
      view.heart.setVisible(true);
      view.heartUntil = now + ms;
    }
    const texture = this.juryTexture(id, mood);
    if (view.img.texture.key !== texture) {
      const art = JURY_ART[id];
      view.img.setTexture(texture).setCrop(0, 0, art.w * 2, art.crop * 2);
    }
    view.mood = mood;
  }

  private buildBand() {
    const { xs, y, scale } = this.L.band;
    BAND.forEach((id, i) => {
      const body = this.add.image(0, 0, `body-${id}-ready`).setOrigin((100 - FIGURE.x) / FIGURE.w, FEET / FIGURE.h).setScale(0.5);
      const head = this.add.image(0, -FEET, `head-${id}-normal`).setOrigin(0.5, 0).setScale(0.5);
      const root = this.add.container(xs[i], y, [body, head]).setScale(scale).setDepth(7);
      this.add.text(xs[i], y + 22, this.copy.band[id], this.outlined("display", this.L.text.label + 2, "#f7ecd4", 7)).setOrigin(0.5, 0).setDepth(9.5);
      this.kids.set(id, { root, body, head, pose: "ready", poseUntil: 0, face: "normal", flash: "wow", faceUntil: 0, base: "normal" });
    });
  }

  private buildCrowd() {
    let index = 0;
    this.L.crowd.forEach((row, r) => {
      for (let i = 0; i < row.count; i += 1) {
        const x = this.L.W / 2 + (i - (row.count - 1) / 2) * row.gap;
        const variant = (i * 7 + r * 5) % 3;
        const img = this.add.image(x, row.y, `crowd-${variant}`).setOrigin(0.5, 1).setScale(row.scale / 2).setDepth(9 + r * 0.1);
        this.fans.push({ img, variant, leave: (index * 7919) % 97, phase: (index * 0.37) % 1, y: row.y });
        index += 1;
      }
    });
    const order = [...this.fans].sort((a, b) => a.leave - b.leave);
    order.forEach((fan, rank) => (fan.leave = rank));
  }

  private animateCrowd(shown: number) {
    const total = this.fans.length;
    const level = this.mode === "cut" ? 0 : Math.max(0, Math.min(100, this.displayCrowd)) / 100;
    const present = Math.round(total * Math.min(1, level * 1.25));
    const live = this.mode === "playing" || this.mode === "countin";
    const beat = this.beatPos(shown);
    for (const fan of this.fans) {
      fan.img.setVisible(fan.leave < present);
      const cheer = live && level > 0.85 && fan.leave % 3 === 0;
      const key = `crowd-${cheer ? 3 : fan.variant}`;
      if (fan.img.texture.key !== key) fan.img.setTexture(key);
      const bounce = live && !this.bridge.reducedMotion ? Math.max(0, Math.sin((beat + fan.phase) * Math.PI)) * 8 * level : 0;
      fan.img.y = fan.y - bounce;
    }
  }

  private buildStrip() {
    const S = this.L.strip;
    this.stripG = this.add.graphics().setDepth(10);
    this.lostMask = this.make.graphics({ x: 0, y: 0 }, false);
    this.weakMask = this.make.graphics({ x: 0, y: 0 }, false);
    this.lostTile = this.add.tileSprite(S.x, S.y, S.w, S.h, "talent-static").setOrigin(0, 0).setTileScale(5).setDepth(11);
    this.weakTile = this.add.tileSprite(S.x, S.y, S.w, S.h, "talent-static").setOrigin(0, 0).setTileScale(5).setDepth(11);
    this.lostTile.setMask(this.lostMask.createGeometryMask());
    this.weakTile.setMask(this.weakMask.createGeometryMask());
    this.hitG = this.add.graphics().setDepth(12);
    for (let i = 0; i < 8; i += 1) this.labels.push(this.add.text(0, 0, "", this.font("display", this.L.text.label)).setStroke("#1d1830", 8).setDepth(13).setVisible(false));
    for (let i = 0; i < 6; i += 1) {
      const text = this.add.text(S.hitX, S.y - 40, "", this.font("display", this.L.text.mark)).setOrigin(0.5).setDepth(14).setVisible(false);
      text.setStroke("#1d1830", 10);
      this.popups.push({ text, born: -Infinity });
    }
    this.streakText = this.add.text(S.hitX, S.y + S.h + 6, "", this.font("display", this.L.text.label + 2, "#ffc83d")).setOrigin(0.5, 0).setDepth(14);
  }

  private buildPanel() {
    const P = this.L.panel;
    const bg = this.add.graphics();
    bg.fillStyle(C.ink, 0.35).fillRoundedRect(10, 14, P.w, P.h, 36);
    bg.fillStyle(C.cream, 1).fillRoundedRect(0, 0, P.w, P.h, 36);
    bg.lineStyle(7, C.ink, 1).strokeRoundedRect(0, 0, P.w, P.h, 36);
    this.panelTitle = this.add.text(P.w / 2, 70, "", this.font("display", this.L.text.panelTitle, "#1d1830")).setOrigin(0.5);
    this.panelBody = this.add
      .text(P.w / 2, 140, "", { ...this.font("body", this.L.text.panelBody, "#1d1830"), align: "center", wordWrap: { width: P.w - 110 }, lineSpacing: 6 })
      .setOrigin(0.5, 0);
    this.panelArt = this.add.graphics();
    this.panelHint = this.add
      .text(P.w / 2, P.h - 62, "", { ...this.font("display", this.L.text.panelBody + 4, "#3f3170"), align: "center", wordWrap: { width: P.w - 80 } })
      .setOrigin(0.5);
    this.panel = this.add.container(P.x, P.y, [bg, this.panelTitle, this.panelBody, this.panelArt, this.panelHint]).setDepth(30);
  }

  private showPanel(title: string, body: string, hint: string, stars: number | null = null) {
    this.panelTitle.setText(title);
    this.panelBody.setText(body);
    this.panelHint.setText(hint);
    this.panelArt.clear();
    if (stars !== null) this.drawStars(stars);
    this.panel.setVisible(true);
  }

  private drawStars(count: number) {
    const P = this.L.panel;
    const y = this.panelBody.y + this.panelBody.height + 60;
    const r = this.bridge.orientation === "portrait" ? 46 : 40;
    for (let i = 0; i < 3; i += 1) {
      const cx = P.w / 2 + (i - 1) * r * 2.6;
      const points: Phaser.Math.Vector2[] = [];
      for (let k = 0; k < 10; k += 1) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const rr = k % 2 === 0 ? r : r * 0.45;
        points.push(new Phaser.Math.Vector2(cx + Math.cos(a) * rr, y + Math.sin(a) * rr));
      }
      this.panelArt.fillStyle(i < count ? C.sun : C.cream2, 1).fillPoints(points, true);
      this.panelArt.lineStyle(5, C.ink, 1).strokePoints(points, true);
    }
  }

  private drawCalibrationDots(now: number) {
    const P = this.L.panel;
    this.panelArt.clear();
    const y = this.panelBody.y + this.panelBody.height + 70;
    const gap = Math.min(100, (P.w - 120) / CALIBRATION_TAPS);
    this.calibClicks.forEach((t, i) => {
      const cx = P.w / 2 + (i - (CALIBRATION_TAPS - 1) / 2) * gap;
      const color = this.calibErrors[i] !== null ? C.mint : now >= t - 0.02 ? C.plum300 : C.cream2;
      this.panelArt.fillStyle(color, 1).fillCircle(cx, y, gap * 0.3);
      this.panelArt.lineStyle(5, C.ink, 1).strokeCircle(cx, y, gap * 0.3);
    });
  }

  private setSong(id: SongId) {
    this.songId = id;
    this.compiled = compiledSong(id);
    const text = this.copy.songs[id];
    this.titleText.setText(text.title);
    this.subtitleText.setText(`${this.copy.rounds[roundOf(id)]} · ${text.idea} · ${text.who}`);
    this.verdict = null;
    this.displayCrowd = 70;
    this.lastSignal = "clear";
    this.segment = 0;
    this.lastSongMs = -this.compiled.barStart[1];
    this.drawSpotlight();
  }

  private featured(): BandMember {
    return this.compiled.song.segments[this.segment].featured;
  }

  private drawSpotlight() {
    const featured = this.featured();
    this.spotG.clear();
    const target = featured === "404" ? { x: this.L.host.x, y: this.L.host.y } : { x: this.L.band.xs[BAND.indexOf(featured)], y: this.L.band.y };
    const top = this.L.lamps.y + 62;
    const lamp = this.L.lamps.xs.reduce((a, b) => (Math.abs(b - target.x) < Math.abs(a - target.x) ? b : a), this.L.lamps.xs[0]);
    this.spotG.fillStyle(C.sunPale, 0.13).fillTriangle(lamp - 16, top, lamp + 16, top, target.x + 150, target.y + 8);
    this.spotG.fillTriangle(lamp - 16, top, target.x - 150, target.y + 8, target.x + 150, target.y + 8);
    this.spotG.fillStyle(C.sunPale, 0.22).fillEllipse(target.x, target.y + 4, 300, 44);
  }

  private setMode(mode: Mode) {
    this.mode = mode;
    this.modeSince = performance.now();
    const copy = this.copy;
    const song = copy.songs[this.songId];
    this.hintText.setText("");
    this.showButtons(false);
    if (mode === "intro") {
      this.setKidFaces("normal");
      const lines = [song.how];
      if (this.notice) lines.unshift(this.notice, "");
      if (!this.hasCalibration) lines.push("", copy.firstCalibration);
      else if (this.bridge.assist.get()) lines.push("", copy.assistOn);
      lines.push("", copy.soundNote);
      const start = !this.hasCalibration ? copy.calibContinue : this.bridge.touch ? copy.startTouch : copy.startKeys;
      this.showPanel(`${song.idea}: ${song.title}`, lines.join("\n"), start);
      this.showButtons(this.hasCalibration);
      if (!this.bridge.touch && this.hasCalibration) this.hintText.setText(copy.keysHint);
      this.notice = "";
    } else if (mode === "calibrating") {
      this.showPanel(copy.calibTitle, `${copy.calibHow}\n\n${copy.calibListen}`, "");
    } else {
      this.panel.setVisible(false);
    }
  }

  private buildButtons() {
    const P = this.L.panel;
    const gap = 30;
    const w = (P.w - 100 - gap) / 2;
    const h = this.bridge.orientation === "portrait" ? 78 : 66;
    const y = P.h - 132 - h;
    (["assist", "calibrate"] as ButtonId[]).forEach((id, i) => {
      const x = 50 + i * (w + gap);
      const bg = this.add.graphics();
      const text = this.add
        .text(w / 2, h / 2, "", { ...this.font("body", this.L.text.panelBody - 6, "#1d1830"), align: "center", wordWrap: { width: w - 24 } })
        .setOrigin(0.5);
      const root = this.add.container(x, y, [bg, text]);
      this.panel.add(root);
      this.buttons.push({ id, box: new Phaser.Geom.Rectangle(P.x + x, P.y + y, w, h), root, bg, text });
    });
    this.refreshButtons();
  }

  private refreshButtons() {
    const on = this.bridge.assist.get();
    for (const b of this.buttons) {
      const active = b.id === "assist" && on;
      b.bg.clear();
      b.bg.fillStyle(C.ink, 0.3).fillRoundedRect(4, 6, b.box.width, b.box.height, 16);
      b.bg.fillStyle(active ? C.sun : C.cream2, 1).fillRoundedRect(0, 0, b.box.width, b.box.height, 16);
      b.bg.lineStyle(5, C.ink, 1).strokeRoundedRect(0, 0, b.box.width, b.box.height, 16);
      b.text.setText(b.id === "assist" ? this.copy.assistButton(on) : this.copy.calibrateButton);
    }
  }

  private showButtons(visible: boolean) {
    for (const b of this.buttons) b.root.setVisible(visible);
    if (!visible) this.pressedButton = null;
  }

  private buttonAt(pageX: number, pageY: number): ButtonId | null {
    if (this.mode !== "intro" || !this.panel.visible) return null;
    const x = this.scale.transformX(pageX);
    const y = this.scale.transformY(pageY);
    return this.buttons.find((b) => b.root.visible && b.box.contains(x, y))?.id ?? null;
  }

  private pressButton(id: ButtonId) {
    if (id === "assist") {
      this.bridge.assist.set(!this.bridge.assist.get());
      this.refreshButtons();
      this.setMode("intro");
    } else {
      this.startCalibration();
    }
  }

  private busy() {
    return this.mode === "playing" || this.mode === "countin" || this.mode === "resuming";
  }

  press(timeStamp: number, id: string, pageX = -1, pageY = -1) {
    if (this.mode === "playing" || this.mode === "countin") this.registerDown(timeStamp, id);
    else if (this.mode === "calibrating") this.calibrationTap(timeStamp);
    else if (this.mode === "intro") this.pressedButton = this.buttonAt(pageX, pageY);
  }

  release(timeStamp: number, id: string, pageX = -1, pageY = -1) {
    if (this.mode === "playing" || this.mode === "countin") {
      this.registerUp(timeStamp, id);
      return;
    }
    if (this.mode !== "intro") return;
    const pressed = this.pressedButton;
    this.pressedButton = null;
    if (pressed) {
      if (this.buttonAt(pageX, pageY) === pressed) this.pressButton(pressed);
      return;
    }
    this.advance();
  }

  key(code: string, timeStamp: number) {
    const pauseKey = code === "Escape" || code === "KeyP";
    if (this.busy()) {
      if (pauseKey) this.bridge.onPauseRequest();
      else if (this.mode !== "resuming") this.press(timeStamp, `k${code}`);
      return;
    }
    if (this.mode === "calibrating") {
      if (pauseKey) this.bridge.onPauseRequest();
      else this.press(timeStamp, `k${code}`);
      return;
    }
    if (this.mode !== "intro") return;
    if (pauseKey) this.bridge.onPauseRequest();
    else if (code === "KeyA" && this.hasCalibration) this.pressButton("assist");
    else if (code === "KeyC") this.pressButton("calibrate");
    else this.advance();
  }

  keyUp(code: string, timeStamp: number) {
    if (this.mode === "playing" || this.mode === "countin") this.registerUp(timeStamp, `k${code}`);
  }

  prepare(id: SongId) {
    this.stopPlayer();
    this.ensureStage();
    this.setSong(id);
    this.modeSince = 0;
    this.setMode("intro");
    this.modeSince = performance.now() - 450;
  }

  restartSong() {
    this.stopPlayer();
    if (this.hasCalibration) this.startSong();
    else this.setMode("intro");
  }

  pause() {
    if (this.busy()) this.pauseSong();
    else if (this.mode === "calibrating") this.setMode("intro");
  }

  resume() {
    if (this.mode === "paused") this.resumeSong();
  }

  quit() {
    this.stopPlayer();
    this.setMode("idle");
  }

  live() {
    return this.busy() || this.mode === "paused" || this.mode === "calibrating";
  }

  private advance() {
    if (performance.now() - this.modeSince < 600) return;
    if (this.mode !== "intro") return;
    if (this.hasCalibration) this.startSong();
    else this.startCalibration();
  }

  private ensureStage() {
    if (!this.stage) {
      const stage = getAudio().stage();
      if (!stage) return null;
      this.stage = stage;
      this.clock = new AudibleClock(stage.ctx);
    }
    if (this.stage.ctx.state !== "running") this.stage.ctx.resume().catch(() => {});
    return this.stage;
  }

  private startCalibration() {
    const stage = this.ensureStage();
    if (!stage) return;
    getAudio().stopMusic();
    const base = stage.ctx.currentTime + 0.5;
    const total = CALIBRATION_COUNT + CALIBRATION_TAPS;
    for (let i = 0; i < total; i += 1) click(stage, stage.out, base + i * CALIBRATION_BEAT, i % 4 === 0);
    this.calibClicks = Array.from({ length: CALIBRATION_TAPS }, (_, i) => base + (CALIBRATION_COUNT + i) * CALIBRATION_BEAT);
    this.calibErrors = this.calibClicks.map(() => null);
    this.calibEnd = base + total * CALIBRATION_BEAT + 0.2;
    this.setMode("calibrating");
  }

  private calibrationTap(timeStamp: number) {
    if (!this.clock) return;
    const heard = this.clock.at(timeStamp);
    let best = -1;
    let size = Infinity;
    this.calibClicks.forEach((t, i) => {
      const d = Math.abs(heard - t);
      if (d < size && this.calibErrors[i] === null) {
        best = i;
        size = d;
      }
    });
    if (best >= 0 && size <= 0.3) this.calibErrors[best] = (heard - this.calibClicks[best]) * 1000;
  }

  private finishCalibration() {
    const errors = this.calibErrors.filter((e): e is number => e !== null).sort((a, b) => a - b);
    if (errors.length < 5) {
      this.notice = this.copy.calibFail;
      this.setMode("intro");
      return;
    }
    const middle = errors.length / 2;
    const median = errors.length % 2 ? errors[Math.floor(middle)] : (errors[middle - 1] + errors[middle]) / 2;
    this.offset = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, Math.round(median)));
    this.hasCalibration = true;
    this.bridge.calibration.save(this.offset);
    this.notice = this.copy.calibResult(this.offset);
    this.setMode("intro");
  }

  private startSong() {
    this.panel.setVisible(false);
    const stage = this.ensureStage();
    if (!stage) return;
    getAudio().stopMusic();
    this.stopPlayer();
    this.assist = this.bridge.assist.get();
    this.player = new SongPlayer(stage, this.compiled);
    this.t0 = this.player.start(0);
    this.clock?.sample();
    this.presses = [];
    this.active.clear();
    this.verdict = null;
    this.seen = 0;
    this.platesShown.clear();
    this.displayCrowd = 70;
    this.lastSignal = "clear";
    this.bursts = [];
    if (this.segment !== 0) {
      this.segment = 0;
      this.drawSpotlight();
    }
    this.jury.forEach((view, id) => {
      view.plate.setVisible(false);
      this.juryMood(id, "neutral", 0);
    });
    this.setKidFaces("normal");
    this.hostOverride = null;
    this.setMode("countin");
  }

  private pauseSong() {
    if (!this.player) return;
    const songMs = Math.max(0, Math.round(this.songNow()));
    const now = performance.now();
    for (const id of [...this.active.keys()]) this.registerUp(now, id);
    this.stopPlayer();
    this.lastSongMs = this.mode === "resuming" ? this.resumeAt : songMs;
    this.resumeAt = this.lastSongMs;
    this.setMode("paused");
  }

  private resumeSong() {
    const stage = this.ensureStage();
    if (!stage) return;
    this.player = new SongPlayer(stage, this.compiled);
    this.t0 = this.player.start(this.resumeAt);
    this.clock?.sample();
    this.setMode("resuming");
  }

  private stopPlayer() {
    this.player?.dispose();
    this.player = null;
  }

  private songNow(perf = performance.now()) {
    if (!this.clock) return -Infinity;
    return (this.clock.at(perf) - this.t0) * 1000;
  }

  private nearestNote(corrected: number) {
    let best = this.compiled.notes[0];
    for (const n of this.compiled.notes) if (Math.abs(n.at - corrected) < Math.abs(best.at - corrected)) best = n;
    return best;
  }

  private registerDown(timeStamp: number, id: string) {
    if (!this.player) return;
    const raw = Math.round(this.songNow(timeStamp));
    const press = { down: raw, up: null };
    let i = this.presses.length;
    while (i > 0 && this.presses[i - 1].down > raw) i -= 1;
    this.presses.splice(i, 0, press);
    const previous = this.active.get(id);
    if (previous && previous.up === null) previous.up = Math.max(previous.down, raw);
    this.active.set(id, press);
    const corrected = raw - this.offset;
    const segment = this.compiled.song.segments[this.compiled.segmentOfBar[Math.max(0, Math.min(this.compiled.bars - 1, barAt(this.compiled, corrected)))]];
    const near = this.nearestNote(corrected);
    const freq = segment.tap === "keys" ? keysFreq(near ? this.compiled.tones[near.step] : null) : near ? callFreq(near.step) : 440;
    this.player.press(segment.tap, freq);
    this.bursts.push({ born: performance.now(), color: C.cream });
    this.kidHit(segment.featured);
  }

  private registerUp(timeStamp: number, id: string) {
    const press = this.active.get(id);
    if (!press) return;
    this.active.delete(id);
    press.up = Math.max(press.down, Math.round(this.songNow(timeStamp)));
    if (this.active.size === 0) this.player?.lift();
  }

  private judgeInput() {
    return { taps: this.presses.map((p) => p.down), ups: this.presses.map((p) => p.up), offset: this.offset, assist: this.assist };
  }

  private finish() {
    const input = this.judgeInput();
    const verdict = judge(this.compiled, input);
    const log: TapLog = { kind: "talent-taps", version: 2, song: this.songId, offset: this.offset, assist: this.assist, taps: input.taps, ups: input.ups };
    const replayed = replay(this.compiled, JSON.parse(JSON.stringify(log)));
    const matches =
      replayed !== null &&
      replayed.precision === verdict.precision &&
      replayed.stars === verdict.stars &&
      replayed.cutAt === verdict.cutAt &&
      (Object.keys(verdict.counts) as Mark[]).every((k) => replayed.counts[k] === verdict.counts[k]);
    this.bridge.onRun({ song: this.songId, verdict, replayed, matches, log });
    return verdict;
  }

  private endSong() {
    const verdict = this.finish();
    this.player?.stop(0.4);
    this.setMode("results");
    this.setKidFaces(verdict.stars >= 2 ? "happy" : verdict.stars === 0 ? "wow" : "normal");
    const base = Math.round((10 * Math.max(0, verdict.points)) / Math.max(1, verdict.maxPoints));
    JURY.forEach((id) => this.raisePlate(id, base, 4000));
  }

  private cut() {
    this.finish();
    this.player?.stop(0.25);
    this.player?.sting(CUT_STING, 0.16);
    this.setMode("cut");
    this.setKidFaces("wow");
  }

  private raisePlate(id: JuryId, base: number, ms: number) {
    const view = this.jury.get(id);
    if (!view) return;
    const grade = Math.max(0, Math.min(10, base + JURY_BIAS[id]));
    view.plateText.setText(String(grade));
    view.plate.setVisible(true);
    view.plate.setData("until", performance.now() + ms);
    this.juryMood(id, grade >= 8 ? "happy" : grade <= 4 ? "angry" : "neutral", ms);
  }

  update() {
    const now = performance.now();
    this.clock?.sample();
    this.updateTransient(now);
    if (this.mode === "calibrating") {
      const heard = this.clock ? this.clock.at(now) : 0;
      if (heard >= this.calibClicks[0] - 0.05 && this.panelBody.text.endsWith(this.copy.calibListen)) this.panelBody.setText(`${this.copy.calibHow}\n\n${this.copy.calibGo}`);
      this.drawCalibrationDots(heard);
      if (heard > this.calibEnd) this.finishCalibration();
    }
    let shown: number;
    if (this.mode === "countin" || this.mode === "playing") {
      const songMs = this.songNow(now);
      this.lastSongMs = songMs;
      shown = songMs - this.offset;
      this.updateSong(songMs, shown);
    } else if (this.mode === "resuming") {
      const songMs = this.songNow(now);
      shown = this.resumeAt - this.offset;
      const beat = beatMsAt(this.compiled, this.resumeAt);
      const count = Math.floor((songMs - (this.resumeAt - beat * 4)) / beat);
      if (songMs >= this.resumeAt) {
        this.mode = "playing";
        this.say(this.copy.host.go, 900);
      } else if (count >= 0 && count < 4 && this.bubbleText.text !== String(count + 1)) this.say(String(count + 1), 700);
    } else {
      shown = this.lastSongMs - this.offset;
    }
    this.drawStrip(shown);
    this.drawMeter();
    this.animateBand(shown, now);
    const live = this.mode === "playing" || this.mode === "countin" || this.mode === "resuming";
    this.updateHost(now, live && shown >= 0 ? this.compiled.signal[barAt(this.compiled, shown)] ?? "clear" : "clear");
  }

  private updateSong(songMs: number, shown: number) {
    const copy = this.copy;
    if (this.mode === "countin") {
      const beat = beatMsAt(this.compiled, 0);
      const count = Math.floor((songMs + beat * 4) / beat);
      if (songMs >= 0) {
        this.mode = "playing";
        this.say(copy.host.go, 1200);
      } else if (count >= 0 && count < 4 && this.bubbleText.text !== String(count + 1)) this.say(String(count + 1), 700);
    }
    const verdict = judge(this.compiled, this.judgeInput(), shown);
    this.verdict = verdict;
    for (let i = this.seen; i < verdict.events.length; i += 1) this.onMark(verdict.events[i].mark, verdict.streak);
    this.seen = verdict.events.length;
    verdict.sections.forEach((s, i) => {
      if (!s.closed || this.platesShown.has(i) || s.max === 0) return;
      this.platesShown.add(i);
      const base = Math.round((10 * Math.max(0, s.points)) / s.max);
      JURY.forEach((id) => this.raisePlate(id, base, 1800));
    });
    const bar = barAt(this.compiled, shown);
    if (shown >= 0 && bar < this.compiled.bars) {
      const segment = this.compiled.segmentOfBar[bar];
      if (segment !== this.segment) {
        this.segment = segment;
        this.drawSpotlight();
        const source = this.compiled.song.segments[segment].source;
        if (source) this.say(copy.host.now(copy.songs[source].title), 1800);
      }
    }
    const signal = shown >= 0 ? this.compiled.signal[bar] ?? "clear" : "clear";
    if (signal !== this.lastSignal) {
      if (signal === "lost") this.say(copy.host.lost, 1800);
      else if (signal === "weak") this.say(copy.host.weak, 1400);
      else if (this.lastSignal === "lost") this.say(copy.host.back, 1200);
      this.lastSignal = signal;
    }
    this.streakText.setText(verdict.streak >= 5 ? copy.streak(verdict.streak) : "");
    if (verdict.cutAt !== null) this.cut();
    else if (shown >= this.compiled.endMs) this.endSong();
  }

  private onMark(mark: Mark, streak: number) {
    const now = performance.now();
    const popup = this.popups.reduce((a, b) => (a.born < b.born ? a : b));
    for (const p of this.popups) p.text.setVisible(false);
    popup.born = now;
    popup.text.setText(this.copy.marks[mark]).setColor(MARK_COLOR[mark]).setVisible(true).setAlpha(1);
    if (mark !== "miss" && mark !== "dropped") this.bursts.push({ born: now, color: MARK_TINT[mark] });
    if (mark === "noise") {
      this.juryMood("inspector", "angry", 1100);
      if (now > this.shhUntil) {
        this.shh.setVisible(true);
        this.shhUntil = now + 900;
      }
    } else if (mark === "miss" || mark === "dropped") {
      this.juryMood("arlindo", "angry", 900);
      this.kidFlash(this.featured(), "wow", 600);
      this.hostFlash("surprised", 600);
    } else if (mark === "held" || (streak > 0 && streak % 8 === 0)) {
      this.juryMood("lunch", "happy", 1000);
      if (streak >= 16) this.hostFlash("excited", 700);
    }
  }

  private updateTransient(now: number) {
    if (this.bubble.visible && now > this.bubbleUntil) this.bubble.setVisible(false);
    if (this.shh.visible && now > this.shhUntil) this.shh.setVisible(false);
    this.jury.forEach((view, id) => {
      if (view.mood !== "neutral" && now > view.moodUntil) this.juryMood(id, "neutral", 0);
      if (view.heart.visible && now > view.heartUntil) view.heart.setVisible(false);
      const until = view.plate.getData("until") as number | undefined;
      if (view.plate.visible && until !== undefined && now > until) view.plate.setVisible(false);
    });
    const rise = this.bridge.reducedMotion ? 0 : 40;
    for (const p of this.popups) {
      if (!p.text.visible) continue;
      const age = (now - p.born) / 520;
      if (age >= 1) p.text.setVisible(false);
      else p.text.setY(this.L.strip.y - 36 - age * rise).setAlpha(1 - age * age);
    }
  }

  private drawMeter() {
    const target = this.verdict?.crowd ?? 70;
    this.displayCrowd += (target - this.displayCrowd) * 0.15;
    const m = this.L.meter;
    const g = this.meterG;
    g.clear();
    g.fillStyle(C.plum950, 1).fillRoundedRect(m.x, m.y, m.w, m.h, m.h / 2);
    const level = Math.max(0, Math.min(100, this.displayCrowd)) / 100;
    const color = level < 0.3 ? C.tomato : level < 0.6 ? C.sun : C.mint;
    if (level > 0.02) g.fillStyle(color, 1).fillRoundedRect(m.x + 4, m.y + 4, Math.max(m.h - 8, (m.w - 8) * level), m.h - 8, (m.h - 8) / 2);
    g.lineStyle(5, C.ink, 1).strokeRoundedRect(m.x, m.y, m.w, m.h, m.h / 2);
  }

  private kidFlash(id: BandMember, face: KidFace, ms: number) {
    const view = this.kids.get(id === "404" ? "deco" : id);
    if (!view) return;
    view.flash = face;
    view.faceUntil = performance.now() + ms;
  }

  private kidHit(id: BandMember, ms = 120) {
    const view = this.kids.get(id === "404" ? "deco" : id);
    if (view) view.poseUntil = performance.now() + ms;
  }

  private setKidFaces(face: KidFace) {
    this.kids.forEach((view) => {
      view.base = face;
      view.faceUntil = 0;
    });
  }

  private animateBand(shown: number, now: number) {
    const featured = this.featured();
    const moving = this.mode === "playing" || this.mode === "countin";
    const phase = ((this.beatPos(shown) % 1) + 1) % 1;
    const bob = moving && !this.bridge.reducedMotion ? Math.max(0, 1 - phase * 4) * 8 : 0;
    const streak = this.verdict?.streak ?? 0;
    this.kids.forEach((view, id) => {
      const lead = id === featured || (featured === "404" && id === "deco");
      view.root.setScale(this.L.band.scale * (lead ? 1.12 : 0.94));
      view.head.y = -FEET + bob * (lead ? 1 : 0.6);
      const pose: Pose = now < view.poseUntil ? "hit" : "ready";
      if (pose !== view.pose) {
        view.pose = pose;
        view.body.setTexture(`body-${id}-${pose}`);
      }
      const base: KidFace = moving && lead && streak >= 10 ? "happy" : view.base;
      const face = now < view.faceUntil ? view.flash : base;
      if (face !== view.face) {
        view.face = face;
        view.head.setTexture(`head-${id}-${face}`);
      }
    });
    if (this.mode === "playing" && this.compiled.calls.some((c) => Math.abs(c.at - shown) < 30)) this.kidHit("mila", 140);
    this.animateCrowd(shown);
  }

  private beatPos(ms: number) {
    const c = this.compiled;
    if (ms < 0) return ms / beatMsAt(c, 0);
    if (ms >= c.endMs) return c.bars * 4 + (ms - c.endMs) / beatMsAt(c, c.endMs - 1);
    const bar = barAt(c, ms);
    return (bar + (ms - c.barStart[bar]) / (c.barStart[bar + 1] - c.barStart[bar])) * 4;
  }

  private drawStrip(shown: number) {
    const S = this.L.strip;
    const g = this.stripG;
    const compiled = this.compiled;
    const now = this.beatPos(shown);
    const xOfBeat = (beat: number) => S.hitX + (beat - now) * S.pxPerBeat;
    const xOf = (ms: number) => xOfBeat(this.beatPos(ms));
    const left = S.x + 6;
    const right = S.x + S.w - 6;
    const top = S.y;
    const laneY = S.y + S.h * 0.6;
    const assist = this.mode === "intro" || this.mode === "calibrating" || this.mode === "idle" ? this.bridge.assist.get() : this.assist;
    g.clear();
    g.fillStyle(C.plum950, 1).fillRoundedRect(S.x, S.y, S.w, S.h, 28);
    const firstBar = Math.max(0, Math.floor((now - (S.hitX - left) / S.pxPerBeat) / 4));
    const lastBar = Math.min(compiled.bars - 1, Math.floor((now + (right - S.hitX) / S.pxPerBeat) / 4));
    let label = 0;
    const callBars = new Set(compiled.calls.map((c) => c.bar));
    const echoBars = new Set(compiled.notes.filter((n) => n.kind === "echo").map((n) => n.bar));
    for (let bar = firstBar; bar <= lastBar; bar += 1) {
      const x0 = Math.max(left, xOfBeat(bar * 4));
      const x1 = Math.min(right, xOfBeat(bar * 4 + 4));
      if (x1 <= x0) continue;
      const tag = callBars.has(bar) ? "call" : echoBars.has(bar) ? "echo" : null;
      if (tag) {
        g.fillStyle(tag === "call" ? C.plum700 : C.sun, tag === "call" ? 0.6 : 0.13).fillRect(x0, top + 8, x1 - x0, S.h - 16);
        const text = this.labels[label];
        if (text && x1 - x0 > 60) {
          label += 1;
          text.setText(tag === "call" ? this.copy.milaTurn : this.copy.yourTurn).setColor(tag === "call" ? "#b9a6ef" : "#ffc83d").setOrigin(0, 0);
          text.setPosition(Math.max(x0 + 14, Math.min(x1 - text.width - 10, xOfBeat(bar * 4) + 14)), top + 14).setVisible(true);
        }
      }
      for (let beat = 0; beat < 4; beat += 1) {
        const x = xOfBeat(bar * 4 + beat);
        if (x < left || x > right) continue;
        g.fillStyle(C.plum500, beat === 0 ? 0.9 : 0.35).fillRect(x - (beat === 0 ? 2 : 1), top + (beat === 0 ? 10 : S.h * 0.35), beat === 0 ? 4 : 2, beat === 0 ? S.h - 20 : S.h * 0.5);
      }
    }
    label = this.drawStatic(xOfBeat, now, left, right, label, assist);
    const r = this.bridge.orientation === "portrait" ? 36 : 38;
    const verdict = this.verdict;
    for (const call of compiled.calls) {
      const x = xOf(call.at);
      if (x < left - r || x > right + r) continue;
      const alpha = x < S.hitX ? Math.max(0, 1 - (S.hitX - x) / 160) : 1;
      if (alpha <= 0) continue;
      const pts = [new Phaser.Math.Vector2(x, laneY - r * 0.9), new Phaser.Math.Vector2(x + r * 0.75, laneY), new Phaser.Math.Vector2(x, laneY + r * 0.9), new Phaser.Math.Vector2(x - r * 0.75, laneY)];
      g.fillStyle(C.plum300, alpha).fillPoints(pts, true);
      g.lineStyle(5, C.ink, alpha).strokePoints(pts, true);
    }
    for (const note of compiled.notes) {
      const x = xOf(note.at);
      const xEnd = note.kind === "hold" ? xOf(note.end) : x;
      if (xEnd < left - r || x > right + r) continue;
      const grade = verdict?.grades[note.index] ?? null;
      const tail = verdict?.tails[note.index] ?? null;
      const signal = compiled.signal[note.bar];
      if (signal === "lost" && grade === null && !assist) continue;
      const signalAlpha = signal === "weak" ? (assist ? 0.6 : 0.3) : signal === "lost" ? 0.5 : 1;
      const color = MEMBER_COLOR[compiled.song.segments[compiled.segmentOfBar[note.bar]].featured];
      const fade = (px: number) => Math.max(0, 1 - Math.max(0, S.hitX - px) / 200);
      if (note.kind === "echo") {
        if (grade === null) {
          if (assist) g.lineStyle(5, C.sun, 0.55).strokeCircle(x, laneY, r * 0.7);
          continue;
        }
        const c = grade === "miss" ? C.gray : MARK_TINT[grade];
        if (fade(x) > 0) g.lineStyle(6, c, fade(x)).strokeCircle(x, laneY, r * 0.55);
        continue;
      }
      if (note.kind === "hold") {
        const holding = grade !== null && grade !== "miss" && tail === null;
        if (grade === null) {
          this.drawTail(g, x, xEnd, laneY, r, color, 0.55 * signalAlpha, left, right);
        } else if (grade === "miss") {
          this.drawTail(g, x, xEnd, laneY, r, C.gray, 0.6 * fade(xEnd), left, right);
          if (fade(x) > 0) g.fillStyle(C.gray, 0.8 * fade(x)).fillCircle(x, laneY, r * 0.8);
          continue;
        } else if (holding) {
          if (xEnd > S.hitX) this.drawTail(g, S.hitX, xEnd, laneY, r, color, 0.85, left, right);
          g.fillStyle(color, 1).fillCircle(S.hitX, laneY, r);
          g.lineStyle(5, C.ink, 1).strokeCircle(S.hitX, laneY, r);
          g.lineStyle(6, C.sun, 0.8).strokeCircle(S.hitX, laneY, r + 4);
          continue;
        } else {
          if (tail === "dropped") {
            const release = verdict?.releases[note.index];
            const from = release !== null && release !== undefined ? xOf(release) : x;
            this.drawTail(g, from, xEnd, laneY, r, C.gray, 0.6 * fade(xEnd), left, right);
          }
          continue;
        }
      } else if (grade === "miss") {
        if (fade(x) > 0) g.fillStyle(C.gray, 0.8 * fade(x)).fillCircle(x, laneY, r * 0.8);
        continue;
      } else if (grade !== null) {
        continue;
      }
      if (x < left - r || x > right + r) continue;
      g.fillStyle(C.ink, signalAlpha).fillCircle(x, laneY + 5, r);
      g.fillStyle(color, signalAlpha).fillCircle(x, laneY, r);
      g.lineStyle(5, C.ink, signalAlpha).strokeCircle(x, laneY, r);
      g.fillStyle(C.cream, 0.55 * signalAlpha).fillCircle(x - r * 0.3, laneY - r * 0.3, r * 0.25);
    }
    g.lineStyle(7, C.ink, 1).strokeRoundedRect(S.x, S.y, S.w, S.h, 28);
    const hg = this.hitG;
    hg.clear();
    const t = performance.now();
    hg.lineStyle(8, C.cream, 0.9).strokeCircle(S.hitX, laneY, r + 10);
    hg.lineStyle(3, C.ink, 1).strokeCircle(S.hitX, laneY, r + 16);
    this.bursts = this.bursts.filter((b) => t - b.born < 260);
    for (const b of this.bursts) {
      const k = (t - b.born) / 260;
      hg.lineStyle(10 * (1 - k), b.color, 1 - k).strokeCircle(S.hitX, laneY, r + 10 + k * 40);
    }
    for (let i = label; i < this.labels.length; i += 1) this.labels[i].setVisible(false);
  }

  private drawTail(g: Phaser.GameObjects.Graphics, x0: number, x1: number, y: number, r: number, color: number, alpha: number, left: number, right: number) {
    const a = Math.max(left, x0);
    const b = Math.min(right, x1);
    if (b <= a || alpha <= 0) return;
    const h = r * 0.9;
    g.fillStyle(color, alpha).fillRoundedRect(a, y - h / 2, b - a, h, h / 2);
    g.lineStyle(4, C.ink, alpha).strokeRoundedRect(a, y - h / 2, b - a, h, h / 2);
  }

  private drawStatic(xOfBeat: (beat: number) => number, now: number, left: number, right: number, labelStart: number, assist: boolean) {
    const S = this.L.strip;
    this.lostMask.clear();
    this.weakMask.clear();
    let anyLost = false;
    let anyWeak = false;
    let label = labelStart;
    const compiled = this.compiled;
    let bar = 0;
    while (bar < compiled.bars) {
      const kind = compiled.signal[bar];
      let end = bar;
      while (end + 1 < compiled.bars && compiled.signal[end + 1] === kind) end += 1;
      if (kind !== "clear") {
        const x0 = Math.max(left, xOfBeat(bar * 4));
        const x1 = Math.min(right, xOfBeat((end + 1) * 4));
        if (x1 > x0) {
          (kind === "lost" ? this.lostMask : this.weakMask).fillStyle(0xffffff, 1).fillRect(x0, S.y + 8, x1 - x0, S.h - 16);
          if (kind === "lost") anyLost = true;
          else anyWeak = true;
          const text = this.labels[label];
          if (text && x1 - x0 > 120) {
            label += 1;
            text.setText(kind === "lost" ? this.copy.noSignal : this.copy.weakSignal).setColor("#f7ecd4").setOrigin(0.5, 0.5);
            text.setPosition((x0 + x1) / 2, S.y + 30).setVisible(true);
          }
        }
      }
      bar = end + 1;
    }
    const drift = this.bridge.reducedMotion ? 0 : performance.now() * 0.004;
    for (const tile of [this.lostTile, this.weakTile]) {
      tile.tilePositionX = (now * S.pxPerBeat) / 5;
      tile.tilePositionY = drift;
    }
    this.lostTile.setVisible(anyLost).setAlpha(assist ? 0.5 : 1);
    this.weakTile.setVisible(anyWeak).setAlpha(assist ? 0.3 : 0.6);
    return label;
  }
}
