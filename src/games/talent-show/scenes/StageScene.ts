import * as Phaser from "phaser";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { getAudio } from "@/lib/audio/engine";
import { AudibleClock, SongPlayer, callFreq, keysFreq } from "../audio/player";
import { click, type Stage } from "../audio/voices";
import { TALENT_COPY, type JuryId, type TalentCopy } from "../copy";
import { judge, MAX_OFFSET, replay, type Mark, type TapLog, type Verdict } from "../sim/judge";
import { barAt, beatMsAt, type BandMember, type CompiledSong, type Signal, type SongId } from "../song/notation";
import { compiledSong, roundOf, SONG_ORDER } from "../song/songs";
import { layoutFor, type Layout, type Orientation } from "./layout";

export type RunReport = { song: SongId; verdict: Verdict; replayed: Verdict | null; matches: boolean; log: TapLog };

export type TalentBridge = {
  locale: Locale;
  fonts: { display: string; body: string };
  orientation: Orientation;
  touch: boolean;
  reducedMotion: boolean;
  song: SongId;
  assist: () => boolean;
  calibration: { load: () => number | null; save: (ms: number) => void };
  onSong: (id: SongId) => void;
  onRun: (report: RunReport) => void;
  onCalibration: (ms: number) => void;
};

type Mode = "intro" | "calibrating" | "calibrated" | "countin" | "playing" | "paused" | "resuming" | "cut" | "results";
type Mood = "neutral" | "happy" | "angry";

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
const JURY_COLOR: Record<JuryId, number> = { inspector: 0x8fa9c4, arlindo: 0xd7a77a, lunch: 0xf3a5c8 };
const MARK_COLOR: Record<Mark, string> = { perfect: "#ffc83d", good: "#63d6c1", near: "#f7ecd4", miss: "#ef4f43", held: "#ffc83d", dropped: "#ef4f43", noise: "#ef4f43" };
const MARK_TINT: Record<Mark, number> = { perfect: C.sun, good: C.mint, near: C.cream, miss: C.tomato, held: C.sun, dropped: C.tomato, noise: C.tomato };
const CUT_STING = [69, 72, 76, 74, 72, 69];
const CALIBRATION_BEAT = 0.6;
const CALIBRATION_COUNT = 4;
const CALIBRATION_TAPS = 8;

type Popup = { text: Phaser.GameObjects.Text; born: number };
type Burst = { born: number; color: number };
type JuryView = { head: Phaser.GameObjects.Graphics; plate: Phaser.GameObjects.Container; plateText: Phaser.GameObjects.Text; mood: Mood; moodUntil: number };

export class StageScene extends Phaser.Scene {
  private bridge!: TalentBridge;
  private copy!: TalentCopy;
  private L!: Layout;
  private songId: SongId = "theme";
  private compiled!: CompiledSong;
  private mode: Mode = "intro";
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
  private hostScreenTile!: Phaser.GameObjects.TileSprite;
  private hostEyes!: Phaser.GameObjects.Graphics;
  private bubble!: Phaser.GameObjects.Container;
  private bubbleBg!: Phaser.GameObjects.Graphics;
  private bubbleText!: Phaser.GameObjects.Text;
  private bubbleUntil = 0;
  private shh!: Phaser.GameObjects.Text;
  private shhUntil = 0;
  private kids = new Map<BandMember, Phaser.GameObjects.Container>();
  private kidBump = new Map<BandMember, number>();
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

  constructor() {
    super("stage");
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
    this.buildStrip();
    this.buildPanel();
    this.setSong(this.bridge.song, false);
    this.setMode("intro");
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

  private buildBackdrop() {
    const { W, H } = this.L;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(C.plum900, 1).fillRect(0, 0, W, H);
    const stripeW = 80;
    for (let x = 0; x < W; x += stripeW * 2) g.fillStyle(C.plum800, 1).fillRect(x, 0, stripeW, this.L.strip.y - 40);
    const floorY = this.L.band.y - 20;
    g.fillStyle(C.plum700, 1).fillRect(0, floorY, W, this.L.strip.y - floorY - 20);
    g.lineStyle(6, C.ink, 1).lineBetween(0, floorY, W, floorY);
    this.spotG = this.add.graphics().setDepth(1);
    this.titleText = this.add.text(this.L.title.x, this.L.title.y, "", this.font("display", this.L.title.size)).setOrigin(0, 0.5).setDepth(20);
    this.subtitleText = this.add.text(this.L.title.x, this.L.title.y + this.L.title.size * 0.95, "", this.font("body", this.L.text.label + 4, "#b9a6ef")).setOrigin(0, 0.5).setDepth(20);
    this.add.text(this.L.live.x, this.L.live.y, `● ${this.copy.live}`, this.font("display", this.L.live.size, "#ef4f43")).setOrigin(1, 0.5).setDepth(20);
    const m = this.L.meter;
    this.add.text(m.x - 16, m.y + m.h / 2, this.copy.crowd, this.font("display", this.L.text.label + 4)).setOrigin(1, 0.5).setDepth(20);
    this.meterG = this.add.graphics().setDepth(20);
    this.hintText = this.add.text(this.L.hint.x, this.L.hint.y, "", this.font("body", this.L.hint.size, "#b9a6ef")).setOrigin(0.5).setDepth(20);
  }

  private buildHost() {
    const { x, y, scale } = this.L.host;
    const body = this.add.graphics();
    body.lineStyle(6, C.ink, 1);
    body.lineBetween(-30, -80, -70, -140).lineBetween(30, -80, 70, -140);
    body.fillStyle(C.ink, 1).fillCircle(-70, -140, 8).fillCircle(70, -140, 8);
    body.fillStyle(C.ink, 1).fillRect(-70, 70, 16, 50).fillRect(54, 70, 16, 50);
    body.fillStyle(C.sun, 1).fillRoundedRect(-110, -85, 220, 165, 26);
    body.lineStyle(6, C.ink, 1).strokeRoundedRect(-110, -85, 220, 165, 26);
    body.fillStyle(C.plum950, 1).fillRoundedRect(-85, -62, 170, 118, 16);
    this.hostScreenTile = this.add.tileSprite(-85, -62, 170, 118, "talent-static").setOrigin(0, 0).setTileScale(4).setVisible(false);
    this.hostEyes = this.add.graphics();
    this.hostEyes.fillStyle(C.cream, 1).fillCircle(-32, -8, 22).fillCircle(32, -8, 22);
    this.hostEyes.fillStyle(C.ink, 1).fillCircle(-28, -4, 10).fillCircle(36, -4, 10);
    this.hostEyes.lineStyle(5, C.cream, 1).beginPath().arc(0, 22, 20, 0.2, Math.PI - 0.2).strokePath();
    this.add.container(x, y, [body, this.hostScreenTile, this.hostEyes]).setScale(scale).setDepth(5);
    this.bubbleBg = this.add.graphics();
    this.bubbleText = this.add.text(0, 0, "", this.font("display", this.L.text.bubble, "#1d1830")).setOrigin(0, 0.5);
    this.bubble = this.add.container(x + 100 * scale, y - 140 * scale, [this.bubbleBg, this.bubbleText]).setDepth(15).setVisible(false);
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

  private buildJury() {
    const { xs, y, scale } = this.L.jury;
    JURY.forEach((id, i) => {
      const desk = this.add.graphics();
      desk.fillStyle(C.cream2, 1).fillRoundedRect(-100, 20, 200, 74, 12);
      desk.lineStyle(5, C.ink, 1).strokeRoundedRect(-100, 20, 200, 74, 12);
      const name = this.add.text(0, 57, this.copy.jury[id], this.font("body", this.L.text.label, "#1d1830")).setOrigin(0.5);
      const head = this.add.graphics();
      const plateBg = this.add.graphics();
      plateBg.lineStyle(6, C.ink, 1).lineBetween(0, 0, 0, 30);
      plateBg.fillStyle(C.cream, 1).fillRoundedRect(-58, -86, 116, 92, 12);
      plateBg.lineStyle(5, C.ink, 1).strokeRoundedRect(-58, -86, 116, 92, 12);
      const plateText = this.add.text(0, -40, "", this.font("display", 64, "#1d1830")).setOrigin(0.5);
      const plate = this.add.container(0, -110, [plateBg, plateText]).setVisible(false);
      this.add.container(xs[i], y, [head, desk, name, plate]).setScale(scale).setDepth(6);
      this.jury.set(id, { head, plate, plateText, mood: "neutral", moodUntil: 0 });
      this.drawJuryHead(id, "neutral");
    });
    this.shh = this.add.text(this.L.jury.xs[0] + 70, this.L.jury.y - 120, this.copy.host.shh, this.font("display", this.L.text.bubble, "#ef4f43")).setOrigin(0, 0.5).setDepth(16).setVisible(false);
  }

  private drawJuryHead(id: JuryId, mood: Mood) {
    const view = this.jury.get(id);
    if (!view) return;
    view.mood = mood;
    const g = view.head;
    g.clear();
    g.fillStyle(JURY_COLOR[id], 1).fillCircle(0, -36, 50);
    g.lineStyle(5, C.ink, 1).strokeCircle(0, -36, 50);
    if (id === "inspector") g.fillStyle(C.ink, 1).fillRect(-46, -84, 92, 18);
    if (id === "arlindo") g.fillStyle(C.cream, 1).fillEllipse(0, -6, 60, 18);
    if (id === "lunch") g.fillStyle(C.cream, 1).fillEllipse(0, -84, 96, 26);
    g.fillStyle(C.ink, 1).fillCircle(-18, -42, 6).fillCircle(18, -42, 6);
    g.lineStyle(5, C.ink, 1);
    if (mood === "angry") {
      g.lineBetween(-30, -62, -8, -54).lineBetween(30, -62, 8, -54);
      g.lineBetween(-14, -16, 14, -16);
    } else if (mood === "happy") {
      g.beginPath().arc(0, -26, 18, 0.2, Math.PI - 0.2).strokePath();
    } else {
      g.lineBetween(-10, -18, 10, -18);
    }
  }

  private juryMood(id: JuryId, mood: Mood, ms = 900) {
    const view = this.jury.get(id);
    if (!view) return;
    view.moodUntil = performance.now() + ms;
    if (view.mood !== mood) this.drawJuryHead(id, mood);
  }

  private buildBand() {
    const { xs, y, scale } = this.L.band;
    BAND.forEach((id, i) => {
      const g = this.add.graphics();
      const color = MEMBER_COLOR[id];
      g.fillStyle(C.ink, 0.25).fillEllipse(0, 4, 150, 26);
      g.fillStyle(color, 1).fillRoundedRect(-55, -150, 110, 150, 34);
      g.lineStyle(6, C.ink, 1).strokeRoundedRect(-55, -150, 110, 150, 34);
      g.fillStyle(color, 1).fillCircle(0, -205, 58);
      g.lineStyle(6, C.ink, 1).strokeCircle(0, -205, 58);
      g.fillStyle(C.ink, 1).fillCircle(-20, -212, 7).fillCircle(20, -212, 7);
      g.lineStyle(5, C.ink, 1).beginPath().arc(0, -196, 16, 0.3, Math.PI - 0.3).strokePath();
      if (id === "deco") {
        g.fillStyle(0x9aa3b5, 1).fillRect(-46, -60, 92, 60);
        g.lineStyle(5, C.ink, 1).strokeRect(-46, -60, 92, 60);
      } else if (id === "lina") {
        g.fillStyle(C.cream, 1).fillRect(-70, -92, 140, 34);
        g.lineStyle(5, C.ink, 1).strokeRect(-70, -92, 140, 34);
        for (let k = -50; k <= 50; k += 20) g.lineBetween(k, -92, k, -70);
      } else if (id === "bruno") {
        g.fillStyle(C.tomato, 1).fillRoundedRect(36, -120, 34, 56, 8);
        g.lineStyle(5, C.ink, 1).strokeRoundedRect(36, -120, 34, 56, 8);
      } else {
        g.fillStyle(0x3b3b4a, 1).fillRoundedRect(-46, -104, 92, 54, 8);
        g.fillStyle(C.cream, 1).fillCircle(-20, -77, 12).fillCircle(20, -77, 12);
        g.lineStyle(5, C.ink, 1).strokeRoundedRect(-46, -104, 92, 54, 8);
      }
      const name = this.add.text(0, 34, this.copy.band[id], this.font("display", this.L.text.label + 2)).setOrigin(0.5);
      this.kids.set(id, this.add.container(xs[i], y, [g, name]).setScale(scale).setDepth(7));
    });
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

  private setSong(id: SongId, announce = true) {
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
    if (announce) this.bridge.onSong(id);
  }

  private featured(): BandMember {
    return this.compiled.song.segments[this.segment].featured;
  }

  private drawSpotlight() {
    const featured = this.featured();
    this.spotG.clear();
    const target = featured === "404" ? { x: this.L.host.x, y: this.L.host.y + 120 } : { x: this.L.band.xs[BAND.indexOf(featured)], y: this.L.band.y };
    this.spotG.fillStyle(C.sun, 0.14).fillTriangle(target.x - 40, 0, target.x + 40, 0, target.x + 170, target.y + 10);
    this.spotG.fillTriangle(target.x - 40, 0, target.x - 170, target.y + 10, target.x + 170, target.y + 10);
    this.spotG.fillStyle(C.sun, 0.2).fillEllipse(target.x, target.y + 6, 340, 50);
  }

  private setMode(mode: Mode) {
    this.mode = mode;
    this.modeSince = performance.now();
    const copy = this.copy;
    const song = copy.songs[this.songId];
    const start = this.bridge.touch ? copy.startTouch : copy.startKeys;
    const idle = mode === "intro" || mode === "calibrated" || mode === "cut" || mode === "results";
    this.hintText.setText(!this.bridge.touch && idle ? copy.keysHint : "");
    if (mode === "intro") {
      const lines = [song.how];
      if (!this.hasCalibration) lines.push("", copy.firstCalibration);
      if (this.notice) lines.unshift(this.notice, "");
      if (this.bridge.assist()) lines.push("", copy.assistOn);
      lines.push("", copy.soundNote);
      this.showPanel(`${song.idea}: ${song.title}`, lines.join("\n"), this.hasCalibration ? start : copy.calibContinue);
      this.notice = "";
    } else if (mode === "calibrating") {
      this.showPanel(copy.calibTitle, `${copy.calibHow}\n\n${copy.calibListen}`, "");
    } else if (mode === "paused") {
      this.showPanel(copy.pausedTitle, copy.pausedText, this.bridge.touch ? copy.pausedHintTouch : copy.pausedHintKeys);
    } else if (mode === "countin" || mode === "playing" || mode === "resuming") {
      this.panel.setVisible(false);
    }
  }

  private busy() {
    return this.mode === "playing" || this.mode === "countin" || this.mode === "resuming";
  }

  press(timeStamp: number, id: string) {
    if (this.mode === "playing" || this.mode === "countin") this.registerDown(timeStamp, id);
    else if (this.mode === "calibrating") this.calibrationTap(timeStamp);
  }

  release(timeStamp: number, id: string) {
    if (this.mode === "playing" || this.mode === "countin") this.registerUp(timeStamp, id);
    else if (this.mode === "paused") this.resume();
    else if (!this.busy()) this.advance();
  }

  key(code: string, timeStamp: number) {
    if (this.mode === "paused") {
      if (code === "Escape") this.quit();
      else this.resume();
      return;
    }
    if (this.busy()) {
      if (code === "Escape" || code === "KeyP") this.pause();
      else if (this.mode !== "resuming") this.press(timeStamp, `k${code}`);
      return;
    }
    if (this.mode === "calibrating") {
      if (code === "Escape") this.setMode("intro");
      else this.press(timeStamp, `k${code}`);
      return;
    }
    if (code === "BracketLeft" || code === "BracketRight" || code === "Enter" || code === "NumpadEnter") {
      const i = SONG_ORDER.indexOf(this.songId);
      const step = code === "BracketLeft" ? SONG_ORDER.length - 1 : 1;
      this.selectSong(SONG_ORDER[(i + step) % SONG_ORDER.length]);
      return;
    }
    if (code === "KeyC") {
      this.startCalibration();
      return;
    }
    if (code !== "Escape") this.advance();
  }

  keyUp(code: string, timeStamp: number) {
    if (this.mode === "playing" || this.mode === "countin") this.registerUp(timeStamp, `k${code}`);
  }

  selectSong(id: SongId) {
    this.stopPlayer();
    this.setSong(id);
    this.setMode("intro");
  }

  calibrate() {
    this.stopPlayer();
    this.startCalibration();
  }

  hidden() {
    if (this.mode === "playing" || this.mode === "countin" || this.mode === "resuming") this.pause();
    else if (this.mode === "calibrating") this.setMode("intro");
  }

  quit() {
    this.stopPlayer();
    this.notice = this.copy.stopped;
    this.setMode("intro");
  }

  private advance() {
    if (performance.now() - this.modeSince < 600) return;
    if (this.mode === "intro") {
      if (this.hasCalibration) this.startSong();
      else this.startCalibration();
    } else if (this.mode === "calibrated" || this.mode === "results" || this.mode === "cut") {
      this.startSong();
    }
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
      this.hasCalibration = false;
      this.setMode("intro");
      this.showPanel(this.copy.calibTitle, this.copy.calibFail, this.copy.calibRetry);
      return;
    }
    const middle = errors.length / 2;
    const median = errors.length % 2 ? errors[Math.floor(middle)] : (errors[middle - 1] + errors[middle]) / 2;
    this.offset = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, Math.round(median)));
    this.hasCalibration = true;
    this.bridge.calibration.save(this.offset);
    this.bridge.onCalibration(this.offset);
    this.setMode("calibrated");
    this.showPanel(this.copy.calibTitle, this.copy.calibResult(this.offset), this.bridge.touch ? this.copy.startTouch : this.copy.startKeys);
  }

  private startSong() {
    const stage = this.ensureStage();
    if (!stage) return;
    getAudio().stopMusic();
    this.stopPlayer();
    this.assist = this.bridge.assist();
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
      this.drawJuryHead(id, "neutral");
    });
    this.setMode("countin");
  }

  private pause() {
    if (!this.player) return;
    const songMs = Math.max(0, Math.round(this.songNow()));
    const now = performance.now();
    for (const id of [...this.active.keys()]) this.registerUp(now, id);
    this.stopPlayer();
    this.lastSongMs = this.mode === "resuming" ? this.resumeAt : songMs;
    this.resumeAt = this.lastSongMs;
    this.setMode("paused");
  }

  private resume() {
    if (performance.now() - this.modeSince < 400) return;
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
    const featured = segment.featured;
    this.kidBump.set(featured === "404" ? "deco" : featured, performance.now());
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
    const copy = this.copy;
    const pct = formatNumber(verdict.precision / 10000, this.bridge.locale, { style: "percent", maximumFractionDigits: 1 });
    const marks: Mark[] = this.compiled.notes.some((n) => n.kind === "hold") ? ["perfect", "good", "near", "miss", "held", "dropped", "noise"] : ["perfect", "good", "near", "miss", "noise"];
    const counts = marks.map((m) => `${copy.markNames[m]} ${verdict.counts[m]}`).join(" · ");
    const lines = [`${copy.precision}: ${pct}`, counts, `${copy.bestStreak}: ${verdict.bestStreak}`, copy.timing(verdict.timing.mean)];
    if (verdict.stars === 0) lines.push(copy.noStar);
    if (this.assist) lines.push(copy.assistOn);
    this.showPanel(copy.resultsTitle, lines.join("\n"), copy.again, verdict.stars);
    const base = Math.round((10 * Math.max(0, verdict.points)) / Math.max(1, verdict.maxPoints));
    JURY.forEach((id) => this.raisePlate(id, base, 4000));
  }

  private cut() {
    this.finish();
    this.player?.stop(0.25);
    this.player?.sting(CUT_STING, 0.16);
    this.setMode("cut");
    this.showPanel(this.copy.cutTitle, this.copy.cutText, this.copy.retry, 0);
    this.say(this.copy.cutTitle, 2500);
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
    this.hostScreenTile.setVisible(signal === "lost");
    this.hostEyes.setVisible(signal !== "lost");
    if (signal === "lost" && !this.bridge.reducedMotion) this.hostScreenTile.tilePositionY += 0.6;
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
    } else if (mark === "held" || (streak > 0 && streak % 8 === 0)) {
      this.juryMood("lunch", "happy", 1000);
    }
    const featured = this.featured();
    if (mark === "perfect" || mark === "good" || mark === "held") this.kidBump.set(featured === "404" ? "deco" : featured, now);
  }

  private updateTransient(now: number) {
    if (this.bubble.visible && now > this.bubbleUntil) this.bubble.setVisible(false);
    if (this.shh.visible && now > this.shhUntil) this.shh.setVisible(false);
    this.jury.forEach((view, id) => {
      if (view.mood !== "neutral" && now > view.moodUntil) this.drawJuryHead(id, "neutral");
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

  private animateBand(shown: number, now: number) {
    const featured = this.featured();
    const moving = this.mode === "playing" || this.mode === "countin";
    this.kids.forEach((kid, id) => {
      const base = this.L.band.scale * (id === featured ? 1.15 : 0.92);
      let sx = base;
      let sy = base;
      if (!this.bridge.reducedMotion) {
        if (moving) {
          const phase = ((this.beatPos(shown) % 1) + 1) % 1;
          const squish = Math.max(0, 1 - phase * 5) * 0.05;
          sy = base * (1 - squish);
          sx = base * (1 + squish * 0.6);
        }
        const bump = this.kidBump.get(id);
        if (bump !== undefined && now - bump < 140) {
          const k = 1 - (now - bump) / 140;
          sy *= 1 + 0.08 * k;
          sx *= 1 - 0.03 * k;
        }
      }
      kid.setScale(sx, sy);
    });
    if (this.mode === "playing" && this.compiled.calls.some((c) => Math.abs(c.at - shown) < 30)) this.kidBump.set("mila", now);
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
    const assist = this.mode === "intro" || this.mode === "calibrating" || this.mode === "calibrated" ? this.bridge.assist() : this.assist;
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
