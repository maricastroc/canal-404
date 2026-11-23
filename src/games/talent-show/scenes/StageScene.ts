import * as Phaser from "phaser";
import { ArrowRight, Check, Ear, Heart, Music2, Play, Pointer, Volume2, X, type IconNode } from "lucide";
import type { Locale } from "@/i18n/locales";
import { loadIcons } from "@/games/kit/icons";
import { cartoonText } from "@/games/kit/ui";
import { getAudio } from "@/lib/audio/engine";
import { AudibleClock, SongPlayer, toneFreq } from "../audio/player";
import type { Stage } from "../audio/voices";
import { TALENT_COPY, type CrowdLine, type JuryId, type TalentCopy } from "../copy";
import { judge, replay, type Mark, type TapLog, type Verdict } from "../sim/judge";
import { barAt, beatMsAt, type BandMember, type ChartNote, type CompiledSong, type Signal, type SongId } from "../song/notation";
import { compiledSong, roundOf, SONG_ORDER } from "../song/songs";
import { ART_FILES } from "./artManifest";
import { DEMO_OF, ShowCard, type CardButtonId, type CardContent } from "./card";
import { FIGURE, FEET, HOST_BOX, JURY_ART, type PaddleHold } from "./figure";
import { C, IconPool, MEMBER_COLOR, RING_GAP, TALLY_GAP, drawBeatLine, drawBurst, drawCall, drawEcho, drawNote, drawRegion, drawRingBase, drawRingFront, drawSparks, drawTail, drawTally, drawTrack, ghostAlpha, ribbon, type Spark, type TallyState } from "./lane";
import { DESK_LIP, layoutFor, type Layout, type Orientation, type Spot } from "./layout";

const NOTE_GLYPH: IconNode = Music2.map(([tag, attrs]): IconNode[number] => [tag, tag === "circle" ? { ...attrs, fill: "#1d1830" } : attrs]);

export type RunReport = { song: SongId; verdict: Verdict; replayed: Verdict | null; matches: boolean; log: TapLog };

export type TalentBridge = {
  locale: Locale;
  fonts: { display: string; body: string };
  orientation: Orientation;
  touch: boolean;
  reducedMotion: boolean;
  assist: { get: () => boolean; set: (on: boolean) => void };
  tutorial: { seen: () => boolean; done: () => void };
  onLoad: (value: number) => void;
  onReady: () => void;
  onRun: (report: RunReport) => void;
  onPauseRequest: () => void;
};

type Mode = "idle" | "intro" | "tutorial" | "countin" | "playing" | "paused" | "resuming" | "cut" | "results";
type Mood = "neutral" | "happy" | "angry" | "shock";
type HostMood = "neutral" | "happy" | "excited" | "surprised" | "sad" | "static" | "wave";
type Pose = "ready" | "hit";
type KidFace = "normal" | "happy" | "wow";
type Kid = Exclude<BandMember, "404">;

const BAND: Kid[] = ["deco", "lina", "bruno", "mila"];
const JURY: JuryId[] = ["inspector", "arlindo", "lunch"];
const JURY_BIAS: Record<JuryId, number> = { inspector: -1, arlindo: 0, lunch: 1 };
const MARK_COLOR: Record<Mark, string> = { perfect: "#ffc83d", good: "#63d6c1", near: "#f7ecd4", miss: "#ef4f43", held: "#ffc83d", dropped: "#ef4f43", noise: "#ef4f43" };
const MARK_TINT: Record<Mark, number> = { perfect: C.sun, good: C.mint, near: C.cream, miss: C.tomato, held: C.sun, dropped: C.tomato, noise: C.tomato };
const SONG_FACE: Record<SongId, string | null> = { theme: "head-deco-happy", signoff: "head-lina-happy", recess: "head-mila-happy", street: "head-bruno-happy", static: "host-happy", medley: null };
const CUT_STING = [69, 72, 76, 74, 72, 69];
const CARD_MODES: Mode[] = ["intro", "tutorial"];
const OFFSTAGE: Mode[] = ["idle", "intro", "tutorial"];
const MISS_FALL_MS = 480;
const SPARK_MS = 380;
const TALK_MS = 2600;
const LISTEN_TAIL_MS = 150;

type Popup = { text: Phaser.GameObjects.Text; born: number };
type Burst = { born: number; color: number };
type JuryView = { img: Phaser.GameObjects.Image; plate: Phaser.GameObjects.Container; plateText: Phaser.GameObjects.Text; arm: Phaser.GameObjects.Graphics; heart: Phaser.GameObjects.Image; mood: Mood; moodUntil: number; heartUntil: number };
type KidView = { root: Phaser.GameObjects.Container; body: Phaser.GameObjects.Image; head: Phaser.GameObjects.Image; pose: Pose; poseUntil: number; face: KidFace; flash: KidFace; faceUntil: number; base: KidFace; spot: Spot };
type Fan = { img: Phaser.GameObjects.Image; variant: number; leave: number; phase: number; y: number };
type Floater = { img: Phaser.GameObjects.Image; born: number; x: number; y: number; drift: number };
type ListenSpan = { from: number; to: number; echo: boolean };

function byBar(notes: ChartNote[]) {
  const map = new Map<number, ChartNote[]>();
  for (const n of notes) map.set(n.bar, [...(map.get(n.bar) ?? []), n]);
  return map;
}

export class StageScene extends Phaser.Scene {
  private bridge!: TalentBridge;
  private copy!: TalentCopy;
  private L!: Layout;
  private laneY = 0;
  private songId: SongId = "theme";
  private compiled!: CompiledSong;
  private mode: Mode = "idle";
  private modeSince = 0;
  private stage: Stage | null = null;
  private clock: AudibleClock | null = null;
  private player: SongPlayer | null = null;
  private t0 = 0;
  private assist = false;
  private tutorialSeen = false;
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

  private notesG!: Phaser.GameObjects.Graphics;
  private noteIcons!: IconPool;
  private missIcons!: IconPool;
  private ghostG!: Phaser.GameObjects.Graphics;
  private ghostIcons!: IconPool;
  private ringBaseG!: Phaser.GameObjects.Graphics;
  private ringFrontG!: Phaser.GameObjects.Graphics;
  private meterG!: Phaser.GameObjects.Graphics;
  private progressG!: Phaser.GameObjects.Graphics;
  private spotG!: Phaser.GameObjects.Graphics;
  private liveDot!: Phaser.GameObjects.Graphics;
  private lostTile!: Phaser.GameObjects.TileSprite;
  private weakTile!: Phaser.GameObjects.TileSprite;
  private lostMask!: Phaser.GameObjects.Graphics;
  private weakMask!: Phaser.GameObjects.Graphics;
  private host!: Phaser.GameObjects.Image;
  private hostSpot!: Spot;
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
  private kids = new Map<Kid, KidView>();
  private jury = new Map<JuryId, JuryView>();
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private nameTag!: Phaser.GameObjects.Container;
  private nameTagBg!: Phaser.GameObjects.Graphics;
  private nameTagText!: Phaser.GameObjects.Text;
  private streak!: Phaser.GameObjects.Container;
  private streakBg!: Phaser.GameObjects.Graphics;
  private streakText!: Phaser.GameObjects.Text;
  private streakShown = 0;
  private labels: Phaser.GameObjects.Text[] = [];
  private popups: Popup[] = [];
  private bursts: Burst[] = [];
  private sparks: Spark[] = [];
  private flash = { born: -Infinity, color: C.sun };
  private shakeUntil = 0;
  private missAt = new Map<number, number>();
  private chase: { x: number; y: number }[] = [];
  private floaters: Floater[] = [];
  private card!: ShowCard;
  private pressedButton: CardButtonId | null = null;
  private callsByBar = new Map<number, ChartNote[]>();
  private echoesByBar = new Map<number, ChartNote[]>();
  private listenSpans: ListenSpan[] = [];
  private listenSeen = 0;
  private callSeen = 0;
  private coached = false;
  private ear!: Phaser.GameObjects.Container;
  private talk!: Phaser.GameObjects.Container;
  private talkBg!: Phaser.GameObjects.Graphics;
  private talkText!: Phaser.GameObjects.Text;
  private talkFan: Fan | null = null;
  private talkUntil = 0;
  private talkNext = 0;
  private talkRecent: string[] = [];
  private talkStreak = 0;
  private talkCold = false;

  constructor() {
    super("stage");
  }

  preload() {
    const bridge = this.registry.get("bridge") as TalentBridge;
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => bridge.onLoad(value));
    for (const [name, [, , w, h, res]] of Object.entries(ART_FILES)) {
      if (!this.textures.exists(name)) this.load.svg(name, `/assets/talent-show/${name}.svg`, { width: Math.round(w * res), height: Math.round(h * res) });
    }
    loadIcons(this, [
      { key: "icon-pointer", icon: Pointer, size: 96, color: "#1d1830", fill: "#f7ecd4", strokeWidth: 2 },
      { key: "icon-play", icon: Play, size: 64, color: "#1d1830", fill: "#1d1830", strokeWidth: 2.4 },
      { key: "icon-next", icon: ArrowRight, size: 64, color: "#1d1830", strokeWidth: 3.2 },
      { key: "icon-sound", icon: Volume2, size: 40, color: "#7b62c4", strokeWidth: 2.6 },
      { key: "icon-heart", icon: Heart, size: 116, color: "#1d1830", fill: "#f06ba8", strokeWidth: 1.8 },
      { key: "icon-note", icon: NOTE_GLYPH, size: 96, color: "#1d1830", strokeWidth: 2.6 },
      { key: "icon-miss", icon: X, size: 128, color: "#ef4f43", strokeWidth: 2.4 },
      { key: "icon-check", icon: Check, size: 96, color: "#1d1830", strokeWidth: 3.4 },
      { key: "icon-ear", icon: Ear, size: 96, color: "#b9a6ef", strokeWidth: 2.6 },
      { key: "icon-ear-ink", icon: Ear, size: 96, color: "#1d1830", strokeWidth: 6 },
    ]);
  }

  create() {
    this.bridge = this.registry.get("bridge") as TalentBridge;
    this.copy = TALENT_COPY[this.bridge.locale];
    this.L = layoutFor(this.bridge.orientation);
    this.laneY = this.L.lane.track.y + this.L.lane.track.h / 2;
    this.tutorialSeen = this.bridge.tutorial.seen();
    this.makeStaticTexture();
    this.makeNoteTexture();
    this.buildBackdrop();
    this.buildJury();
    this.buildHost();
    this.buildBand();
    this.buildCrowd();
    this.buildTalk();
    this.buildLane();
    this.buildHud();
    const portrait = this.bridge.orientation === "portrait";
    this.card = new ShowCard(
      this,
      this.copy,
      this.bridge.fonts,
      this.L.card,
      { title: this.L.text.cardTitle, body: this.L.text.cardBody, small: this.L.text.cardSmall },
      portrait,
      this.bridge.reducedMotion,
    );
    this.setSong("theme");
    this.setMode("idle");
    this.bridge.onReady();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.player?.dispose());
  }

  private font(kind: "display" | "body", size: number, color = "#f7ecd4"): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: this.bridge.fonts[kind], fontSize: `${size}px`, color, fontStyle: kind === "body" ? "700" : undefined };
  }

  private outlined(kind: "display" | "body", size: number, color = "#f7ecd4", thickness = 8): Phaser.Types.GameObjects.Text.TextStyle {
    return { ...this.font(kind, size, color), stroke: "#1d1830", strokeThickness: thickness };
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

  private makeNoteTexture() {
    if (this.textures.exists("note-glyph")) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const glyph = (grow: number, color: number) => {
      g.fillStyle(color, 1);
      g.fillEllipse(20, 50, 28 + grow * 2, 20 + grow * 2);
      g.fillRect(29 - grow, 8 - grow, 8 + grow * 2, 44 + grow);
      g.fillTriangle(33 - grow, 8 - grow, 54 + grow, 24, 33 - grow, 32 + grow);
    };
    glyph(5, C.ink);
    glyph(0, 0xffffff);
    g.generateTexture("note-glyph", 64, 68);
    g.destroy();
  }

  private buildBackdrop() {
    const L = this.L;
    this.add.image(0, 0, `studio-${this.bridge.orientation}`).setOrigin(0, 0).setDepth(0);
    this.spotG = this.add.graphics().setDepth(1);
    const p = L.performer;
    for (const s of L.spots) {
      this.spotG.fillStyle(C.sunPale, 0.11).fillTriangle(s.x - 14, s.y, s.x + 14, s.y, p.x + p.podium, p.y);
      this.spotG.fillTriangle(s.x - 14, s.y, p.x - p.podium, p.y, p.x + p.podium, p.y);
    }
    this.spotG.fillStyle(C.sunPale, 0.26).fillEllipse(p.x, p.y, p.podium * 2 - 10, p.podium * 0.3);
  }

  private buildHud() {
    const L = this.L;
    this.titleText = this.add.text(L.title.x, L.title.y, "", this.outlined("display", L.title.size)).setOrigin(0, 0.5).setDepth(20);
    this.subtitleText = this.add.text(L.title.x, L.title.y + L.title.size * 0.92, "", this.outlined("body", L.text.label + 2, "#b9a6ef", 6)).setOrigin(0, 0.5).setDepth(20);
    const live = cartoonText(this, 0, 0, this.copy.live, { size: L.live.size, color: "#f7ecd4", font: this.bridge.fonts.display, stroke: 0.2, shadow: false }).setOrigin(1, 0.5);
    const w = live.width + 58;
    const h = L.live.size * 1.55;
    const pill = this.add.graphics();
    pill.fillStyle(C.ink, 1).fillRoundedRect(-w + 4, -h / 2 + 5, w, h, h / 2);
    pill.fillStyle(C.tomato, 1).fillRoundedRect(-w, -h / 2, w, h, h / 2);
    pill.lineStyle(4, C.ink, 1).strokeRoundedRect(-w, -h / 2, w, h, h / 2);
    live.setPosition(-14, 0);
    this.liveDot = this.add.graphics();
    this.liveDot.fillStyle(C.cream, 1).fillCircle(-w + 24, 0, 9);
    this.liveDot.lineStyle(3, C.ink, 1).strokeCircle(-w + 24, 0, 9);
    this.add.container(L.live.x, L.live.y, [pill, this.liveDot, live]).setDepth(20);

    const m = L.meter;
    const label = cartoonText(this, 0, 0, this.copy.crowd.toUpperCase(), { size: L.text.label, color: "#f7ecd4", font: this.bridge.fonts.display, stroke: 0.22, shadow: false }).setOrigin(0, 0.5);
    const mg = this.add.graphics();
    mg.fillStyle(C.ink, 1).fillRoundedRect(4, 5, m.w, m.h, m.h / 2);
    mg.fillStyle(C.plum800, 1).fillRoundedRect(0, 0, m.w, m.h, m.h / 2);
    mg.lineStyle(4, C.ink, 1).strokeRoundedRect(0, 0, m.w, m.h, m.h / 2);
    label.setPosition(18, m.h / 2);
    this.meterG = this.add.graphics();
    this.add.container(m.x, m.y, [mg, label, this.meterG]).setDepth(15);
    this.meterG.setData("from", label.width + 32);

    this.progressG = this.add.graphics().setDepth(15);

    this.nameTagBg = this.add.graphics();
    this.nameTagText = cartoonText(this, 0, 0, "", { size: L.text.tag, color: "#1d1830", font: this.bridge.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    this.nameTag = this.add.container(L.performer.x, L.nameTag.y, [this.nameTagBg, this.nameTagText]).setDepth(15);

    this.streakBg = this.add.graphics();
    this.streakText = cartoonText(this, 0, 0, "", { size: L.text.label + 2, color: "#1d1830", font: this.bridge.fonts.display, stroke: 0, shadow: false }).setOrigin(0, 0.5);
    this.streak = this.add.container(L.streak.x, L.streak.y, [this.streakBg, this.streakText]).setDepth(15).setVisible(false);
  }

  private setNameTag(text: string) {
    this.nameTagText.setText(text.toUpperCase());
    const w = this.nameTagText.width + 48;
    const h = this.L.text.tag * 1.6;
    const g = this.nameTagBg;
    g.clear();
    g.fillStyle(C.ink, 1).fillRoundedRect(-w / 2 + 4, -h / 2 + 5, w, h, 14);
    g.fillStyle(C.sun, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.lineStyle(4, C.ink, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.fillStyle(C.ink, 1).fillTriangle(-10, -h / 2 + 1, 10, -h / 2 + 1, 0, -h / 2 - 12);
  }

  private buildHost() {
    const { x, y, scale } = this.L.host;
    this.hostSpot = { x, y, scale };
    this.host = this.add.image(x, y, "host-wave").setOrigin((100 - HOST_BOX.x) / HOST_BOX.w, (HOST_BOX.feet - HOST_BOX.y) / HOST_BOX.h).setScale(scale / 2).setDepth(7);
    this.bubbleBg = this.add.graphics();
    this.bubbleText = this.add.text(0, 0, "", this.font("display", this.L.text.bubble, "#1d1830")).setOrigin(0, 0.5);
    this.bubble = this.add.container(0, 0, [this.bubbleBg, this.bubbleText]).setDepth(16).setVisible(false);
  }

  private say(text: string, ms = 1400) {
    this.bubbleText.setText(text).setPosition(22, 0);
    const w = this.bubbleText.width + 44;
    const h = this.L.text.bubble * 1.7;
    this.bubbleBg.clear();
    this.bubbleBg.fillStyle(C.ink, 1).fillRoundedRect(4, -h / 2 + 5, w, h, h / 2);
    this.bubbleBg.fillStyle(C.cream, 1).fillRoundedRect(0, -h / 2, w, h, h / 2);
    this.bubbleBg.lineStyle(5, C.ink, 1).strokeRoundedRect(0, -h / 2, w, h, h / 2);
    this.bubbleBg.fillStyle(C.cream, 1).fillTriangle(16, h / 2 - 6, 40, h / 2 - 6, 4, h / 2 + 22);
    this.bubbleBg.lineStyle(5, C.ink, 1).lineBetween(16, h / 2 - 2, 4, h / 2 + 22).lineBetween(4, h / 2 + 22, 40, h / 2 - 2);
    const s = this.host.scale * 2;
    const x = Math.min(this.L.W - w - 16, this.host.x + 60 * s);
    this.bubble.setPosition(x, this.host.y - 300 * s).setVisible(true);
    this.bubbleUntil = performance.now() + ms;
  }

  private hostFlash(mood: HostMood, ms: number) {
    this.hostOverride = mood;
    this.hostUntil = performance.now() + ms;
  }

  private updateHost(now: number, signal: Signal, bob: number) {
    const live = this.mode === "playing" || this.mode === "countin" || this.mode === "resuming";
    let mood: HostMood;
    if (live && signal === "lost") mood = "static";
    else if (this.hostOverride && now < this.hostUntil) mood = this.hostOverride;
    else if (OFFSTAGE.includes(this.mode)) mood = "wave";
    else if (this.mode === "countin" || this.mode === "resuming") mood = "excited";
    else if (this.mode === "cut") mood = "sad";
    else if (this.mode === "results") mood = (this.verdict?.stars ?? 0) >= 2 ? "happy" : (this.verdict?.stars ?? 0) === 1 ? "neutral" : "sad";
    else mood = this.featured() === "404" ? "happy" : "neutral";
    if (mood !== this.hostMood) {
      this.hostMood = mood;
      this.host.setTexture(`host-${mood}`);
    }
    if (!this.tweens.isTweening(this.host)) this.host.y = this.hostSpot.y - (this.featured() === "404" ? bob : 0);
  }

  private juryTexture(id: JuryId, mood: Mood) {
    if (id === "inspector") return mood === "angry" ? "jury-inspector-angry" : mood === "shock" ? "jury-inspector-shock" : "jury-inspector-neutral";
    return mood === "angry" || mood === "shock" ? `jury-${id}-angry` : `jury-${id}-neutral`;
  }

  private buildJury() {
    const J = this.L.jury;
    const plateY = J.deskTop - DESK_LIP + 97;
    this.add.image(J.x0, J.deskTop - DESK_LIP, `jury-desk-${this.bridge.orientation}`).setOrigin(0, 0).setScale(0.5).setDepth(6);
    JURY.forEach((id, i) => {
      const art = JURY_ART[id];
      const img = this.add.image(0, 0, this.juryTexture(id, "neutral")).setOrigin(art.originX, art.crop / art.h).setScale(art.scale / 2);
      img.setCrop(0, 0, art.w * 2, art.crop * 2);
      const local = (x: number, y: number) => ({ x: (x - art.originX * art.w) * art.scale, y: (y - art.crop) * art.scale });
      const fist = local(art.hold.fist[0], art.hold.fist[1]);
      const side = fist.x < 0 ? -1 : 1;
      const plateImg = this.add.image(0, 0, "plate").setOrigin(0.5, 1).setScale(0.4);
      const plateText = this.add.text(0, -116 * 0.8, "", this.font("display", 62, "#1d1830")).setOrigin(0.5);
      const plate = this.add.container(fist.x, fist.y + 8, [plateImg, plateText]).setVisible(false);
      const arm = this.add.graphics().setVisible(false);
      this.drawHold(arm, art.hold, local, art.scale);
      const heart = this.add.image(fist.x + side * 62, fist.y - 150, "icon-heart").setDisplaySize(58, 58).setVisible(false);
      this.add.container(J.xs[i], J.deskTop + 16, art.hold.front ? [img, plate, arm, heart] : [plate, img, arm, heart]).setScale(J.scale).setDepth(5);
      const name = this.add.text(J.xs[i], plateY, this.copy.jury[id], this.font("body", this.L.text.label, "#1d1830")).setOrigin(0.5).setDepth(6.5);
      if (name.width > 146) name.setScale(146 / name.width);
      this.jury.set(id, { img, plate, plateText, arm, heart, mood: "neutral", moodUntil: 0, heartUntil: 0 });
    });
    const inspector = JURY_ART.inspector;
    this.shh = this.add
      .text(J.xs[0] - 50 * J.scale, J.deskTop + 16 - inspector.crop * inspector.scale * J.scale + 10, this.copy.host.shh, this.outlined("display", this.L.text.bubble, "#ef4f43"))
      .setOrigin(1, 0.5)
      .setDepth(16)
      .setVisible(false);
  }

  private drawHold(g: Phaser.GameObjects.Graphics, hold: PaddleHold, local: (x: number, y: number) => { x: number; y: number }, scale: number) {
    const ink = 4 * scale;
    const curves = hold.arm.map((s) => {
      const [a, b, c] = [s.from, s.via, s.to].map(([x, y]) => local(x, y));
      return { points: new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(a.x, a.y), new Phaser.Math.Vector2(b.x, b.y), new Phaser.Math.Vector2(c.x, c.y)).getPoints(18), color: s.color, width: s.width * scale };
    });
    const stroke = (points: Phaser.Math.Vector2[], color: number, width: number) => {
      g.lineStyle(width, color, 1).strokePoints(points, false, false);
      g.fillStyle(color, 1).fillCircle(points[0].x, points[0].y, width / 2).fillCircle(points[points.length - 1].x, points[points.length - 1].y, width / 2);
    };
    for (const c of curves) stroke(c.points, C.ink, c.width + ink * 2);
    for (const c of curves) stroke(c.points, c.color, c.width);
    if (hold.skin === null) return;
    const f = local(hold.fist[0], hold.fist[1]);
    const w = 26 * scale;
    const h = 30 * scale;
    g.fillStyle(hold.skin, 1).fillRoundedRect(f.x - w / 2, f.y - h / 2, w, h, 9 * scale);
    g.lineStyle(ink, C.ink, 1).strokeRoundedRect(f.x - w / 2, f.y - h / 2, w, h, 9 * scale);
    g.lineStyle(2.5 * scale, C.ink, 1).lineBetween(f.x - w * 0.32, f.y - h * 0.08, f.x + w * 0.32, f.y - h * 0.08).lineBetween(f.x - w * 0.32, f.y + h * 0.18, f.x + w * 0.32, f.y + h * 0.18);
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
    BAND.forEach((id) => {
      const body = this.add.image(0, 0, `body-${id}-ready`).setOrigin((100 - FIGURE.x) / FIGURE.w, FEET / FIGURE.h).setScale(0.5);
      const head = this.add.image(0, -FEET, `head-${id}-normal`).setOrigin(0.5, 0).setScale(0.5);
      const root = this.add.container(0, 0, [body, head]).setDepth(4);
      this.kids.set(id, { root, body, head, pose: "ready", poseUntil: 0, face: "normal", flash: "wow", faceUntil: 0, base: "normal", spot: { x: 0, y: 0, scale: 1 } });
    });
    for (let i = 0; i < 6; i += 1) this.floaters.push({ img: this.add.image(0, 0, "note-glyph").setDepth(9).setVisible(false), born: -Infinity, x: 0, y: 0, drift: 0 });
  }

  private placeBand(animate: boolean) {
    const featured = this.featured();
    const L = this.L;
    const performer: Spot = { x: L.performer.x, y: L.performer.y, scale: L.performer.scale };
    const move = (target: Phaser.GameObjects.Container | Phaser.GameObjects.Image, spot: Spot, scale: number) => {
      this.tweens.killTweensOf(target);
      if (!animate || this.bridge.reducedMotion) {
        target.setPosition(spot.x, spot.y).setScale(scale);
        return;
      }
      this.tweens.add({ targets: target, x: spot.x, y: spot.y, scale, duration: 420, ease: "Sine.easeInOut" });
    };
    BAND.forEach((id, i) => {
      const view = this.kids.get(id);
      if (!view) return;
      const lead = id === featured;
      view.spot = lead ? performer : { x: L.backline.xs[i], y: L.backline.y, scale: L.backline.scale };
      view.root.setDepth(lead ? 8 : 4);
      view.body.setTint(lead ? 0xffffff : 0xd9d2ee);
      view.head.setTint(lead ? 0xffffff : 0xd9d2ee);
      move(view.root, view.spot, view.spot.scale);
    });
    const hostLead = featured === "404";
    this.hostSpot = hostLead ? { x: performer.x, y: performer.y, scale: L.performer.scale * 1.18 } : { ...L.host };
    this.host.setDepth(hostLead ? 8 : 7);
    move(this.host, this.hostSpot, this.hostSpot.scale / 2);
    const source = this.compiled.song.segments[this.segment].source ?? this.songId;
    this.setNameTag(this.copy.songs[source].who);
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

  private buildTalk() {
    this.talkBg = this.add.graphics();
    this.talkText = this.add.text(0, 0, "", this.font("body", this.L.text.label, "#1d1830")).setOrigin(0.5);
    this.talk = this.add.container(0, 0, [this.talkBg, this.talkText]).setDepth(9.5).setVisible(false);
  }

  private crowdLine(): CrowdLine {
    const lines = this.copy.crowdLines;
    const crowd = this.verdict?.crowd ?? 70;
    const streak = this.verdict?.streak ?? 0;
    const source = this.compiled.song.segments[this.segment].source ?? this.songId;
    const mood = crowd < 40 ? lines.cold : streak >= 10 ? lines.hot : null;
    const pool = mood && Math.random() < 0.5 ? mood : Math.random() < 0.5 ? lines.songs[source] : lines.any;
    const fresh = pool.filter((line) => !this.talkRecent.includes(line.text));
    const choices = fresh.length > 0 ? fresh : pool;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  private crowdSay(now: number) {
    const W = this.L.W;
    const fans = this.fans.filter((f) => f.img.visible && f !== this.talkFan && f.img.x > W * 0.12 && f.img.x < W * 0.88);
    if (fans.length === 0) {
      this.talkNext = now + 2000;
      return;
    }
    const fan = fans[Math.floor(Math.random() * fans.length)];
    const line = this.crowdLine();
    this.talkRecent = [line.text, ...this.talkRecent].slice(0, 5);
    this.talkFan = fan;
    this.drawTalk(fan, line);
    this.talkUntil = now + TALK_MS;
    this.talkNext = this.talkUntil + 3000 + Math.random() * 4000;
  }

  private drawTalk(fan: Fan, line: CrowdLine) {
    const L = this.L;
    const size = L.text.label;
    this.talkText.setText(line.text);
    const w = this.talkText.width + 40;
    const h = size * 1.8;
    const headX = fan.img.x;
    const headY = fan.y - fan.img.displayHeight * 0.66;
    const headR = fan.img.displayWidth * 0.26;
    const toRight = headX < L.W / 2;
    const top = L.lane.housing.y + L.lane.housing.h + 10;
    const y = Math.max(top + h / 2, Math.min(L.H - h / 2 - 8, headY - h * 0.35));
    const x = Math.max(16, Math.min(L.W - 16 - w, toRight ? headX + headR + 24 : headX - headR - 24 - w));
    const side = toRight ? 0 : w;
    const tx = headX + (toRight ? headR * 0.4 : -headR * 0.4) - x;
    const ty = headY - y;
    const radius = line.think ? h / 2 : 16;
    const g = this.talkBg;
    g.clear();
    g.fillStyle(C.ink, 1).fillRoundedRect(4, -h / 2 + 5, w, h, radius);
    g.fillStyle(C.cream, 1).fillRoundedRect(0, -h / 2, w, h, radius);
    g.lineStyle(4, C.ink, 1).strokeRoundedRect(0, -h / 2, w, h, radius);
    if (line.think) {
      for (const [k, dot] of [
        [0.34, 8],
        [0.68, 5],
      ] as const) {
        const cx = side + (tx - side) * k;
        const cy = ty * k;
        g.fillStyle(C.cream, 1).fillCircle(cx, cy, dot);
        g.lineStyle(3, C.ink, 1).strokeCircle(cx, cy, dot);
      }
    } else {
      const inward = toRight ? 4 : -4;
      g.fillStyle(C.cream, 1).fillTriangle(side + inward, -h * 0.16, side + inward, h * 0.24, tx * 0.55 + side * 0.45, ty * 0.55);
      g.lineStyle(4, C.ink, 1).lineBetween(side, -h * 0.16, tx * 0.55 + side * 0.45, ty * 0.55).lineBetween(tx * 0.55 + side * 0.45, ty * 0.55, side, h * 0.24);
    }
    this.talkText.setPosition(w / 2, 0);
    this.talk.setPosition(x, y).setAlpha(1).setVisible(true);
    this.tweens.killTweensOf(this.talk);
    this.talk.setScale(1);
    if (!this.bridge.reducedMotion) this.tweens.add({ targets: this.talk, scale: { from: 0.6, to: 1 }, duration: 180, ease: "Back.easeOut" });
  }

  private updateTalk(now: number) {
    if (this.mode !== "playing") {
      if (this.talk.visible) this.talk.setVisible(false);
      return;
    }
    if (this.talk.visible) {
      const left = this.talkUntil - now;
      if (left <= 0 || !this.talkFan?.img.visible) this.talk.setVisible(false);
      else this.talk.setAlpha(Math.min(1, left / 250));
      return;
    }
    if (now >= this.talkNext) this.crowdSay(now);
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

  private buildLane() {
    const { housing: H, track } = this.L.lane;
    const r = this.L.lane.r;
    const g = this.add.graphics().setDepth(10);
    g.fillStyle(C.ink, 0.6).fillRoundedRect(H.x + 8, H.y + 12, H.w, H.h, 34);
    g.fillStyle(C.plum700, 1).fillRoundedRect(H.x, H.y, H.w, H.h, 34);
    g.lineStyle(6, C.ink, 1).strokeRoundedRect(H.x, H.y, H.w, H.h, 34);
    g.lineStyle(3, C.plum500, 1).strokeRoundedRect(H.x + 7, H.y + 7, H.w - 14, H.h - 14, 28);
    drawTrack(g, track, this.laneY, r);
    g.lineStyle(5, C.ink, 1).strokeRoundedRect(track.x, track.y, track.w, track.h, Math.min(26, track.h / 4));
    for (let x = H.x + 40; x < H.x + H.w - 30; x += 46) {
      this.chase.push({ x, y: H.y + 9 }, { x, y: H.y + H.h - 9 });
    }
    for (const b of this.chase) g.fillStyle(C.plum600, 1).fillCircle(b.x, b.y, 4.5);
    this.ringBaseG = this.add.graphics().setDepth(10.5);
    this.notesG = this.add.graphics().setDepth(11);
    this.noteIcons = new IconPool(() => this.add.image(0, 0, "icon-note").setDepth(11.2));
    this.missIcons = new IconPool(() => this.add.image(0, 0, "icon-miss").setDepth(11.2));
    this.lostMask = this.make.graphics({ x: 0, y: 0 }, false);
    this.weakMask = this.make.graphics({ x: 0, y: 0 }, false);
    this.lostTile = this.add.tileSprite(track.x, track.y, track.w, track.h, "talent-static").setOrigin(0, 0).setTileScale(5).setDepth(11.5);
    this.weakTile = this.add.tileSprite(track.x, track.y, track.w, track.h, "talent-static").setOrigin(0, 0).setTileScale(5).setDepth(11.5);
    this.lostTile.setMask(this.lostMask.createGeometryMask());
    this.weakTile.setMask(this.weakMask.createGeometryMask());
    this.ghostG = this.add.graphics().setDepth(11.6);
    this.ghostIcons = new IconPool(() => this.add.image(0, 0, "icon-note").setDepth(11.7));
    this.ringFrontG = this.add.graphics().setDepth(12);
    this.ear = this.add.container(this.L.lane.hitX, this.laneY, [this.add.image(0, 0, "icon-ear-ink"), this.add.image(0, 0, "icon-ear")]).setDepth(12.1).setVisible(false);
    for (let i = 0; i < 8; i += 1) this.labels.push(cartoonText(this, 0, 0, "", { size: this.L.text.label, color: "#f7ecd4", font: this.bridge.fonts.display, stroke: 0.22, shadow: false }).setDepth(13).setVisible(false));
    for (let i = 0; i < 6; i += 1) {
      const text = cartoonText(this, this.L.lane.popupX, H.y - 40, "", { size: this.L.text.mark, color: "#ffc83d", font: this.bridge.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(14).setVisible(false);
      this.popups.push({ text, born: -Infinity });
    }
  }

  private setSong(id: SongId) {
    this.songId = id;
    this.compiled = compiledSong(id);
    const text = this.copy.songs[id];
    this.titleText.setText(text.title);
    this.subtitleText.setText(`${this.copy.rounds[roundOf(id)]} · ${text.idea}`);
    this.verdict = null;
    this.displayCrowd = 70;
    this.lastSignal = "clear";
    this.segment = 0;
    this.lastSongMs = -this.compiled.barStart[1];
    this.missAt.clear();
    this.streak.setVisible(false);
    this.streakShown = 0;
    this.buildTurns();
    this.placeBand(false);
  }

  private buildTurns() {
    const c = this.compiled;
    this.callsByBar = byBar(c.calls);
    this.echoesByBar = byBar(c.notes.filter((n) => n.kind === "echo"));
    this.listenSpans = [];
    for (let bar = 0; bar < c.bars; bar += 1) {
      if (!this.callsByBar.has(bar) || this.callsByBar.has(bar - 1)) continue;
      let last = bar;
      while (this.callsByBar.has(last + 1)) last += 1;
      const calls = this.callsByBar.get(last) ?? [];
      const start = c.barStart[bar];
      const before = c.notes.filter((n) => n.at < start).at(-1);
      const from = Math.min(start, Math.max(start - beatMsAt(c, start) / 2, before ? before.end + LISTEN_TAIL_MS : -Infinity));
      this.listenSpans.push({ from, to: (calls.at(-1)?.at ?? start) + LISTEN_TAIL_MS, echo: this.echoesByBar.has(last + 1) });
    }
  }

  private listening(shown: number) {
    return this.listenSpans.some((span) => shown >= span.from && shown < span.to);
  }

  private tallyOf(note: ChartNote): TallyState {
    const grade = this.verdict?.grades[note.index] ?? null;
    return grade === null ? "waiting" : grade === "miss" ? "miss" : "done";
  }

  private featured(): BandMember {
    return this.compiled.song.segments[this.segment].featured;
  }

  private introContent(): CardContent {
    const copy = this.copy;
    const song = copy.songs[this.songId];
    const assistOn = this.bridge.assist.get();
    return {
      kicker: copy.kicker(copy.rounds[roundOf(this.songId)], SONG_ORDER.indexOf(this.songId) + 1, SONG_ORDER.length),
      title: song.title,
      lead: song.who,
      face: SONG_FACE[this.songId],
      demo: DEMO_OF[this.songId],
      how: song.how,
      note: assistOn ? copy.assistOn : "",
      primary: { label: copy.begin, icon: "icon-play" },
      secondary: [{ id: "assist", label: copy.assistButton(assistOn), on: assistOn }],
      footer: this.bridge.touch ? copy.soundNote : `${copy.soundNote}\n${copy.keysHint}`,
    };
  }

  private tutorialContent(): CardContent {
    const copy = this.copy;
    return {
      kicker: copy.tutorialKicker,
      title: copy.tutorialTitle,
      lead: copy.tutorialLead,
      face: null,
      demo: "learn",
      how: copy.tapAnywhere(this.bridge.touch),
      note: "",
      primary: { label: copy.tutorialGo, icon: "icon-play" },
      secondary: [],
      footer: copy.soundNote,
    };
  }

  private setMode(mode: Mode) {
    this.mode = mode;
    this.modeSince = performance.now();
    this.pressedButton = null;
    if (mode === "intro") {
      this.setKidFaces("normal");
      this.card.show(this.introContent());
    } else if (mode === "tutorial") {
      this.setKidFaces("normal");
      this.card.show(this.tutorialContent());
    } else {
      this.card.hide();
    }
  }

  private carded() {
    return CARD_MODES.includes(this.mode);
  }

  private buttonAt(pageX: number, pageY: number): CardButtonId | null {
    if (!this.carded() || !this.card.visible) return null;
    return this.card.buttonAt(this.scale.transformX(pageX), this.scale.transformY(pageY));
  }

  private pressButton(id: CardButtonId) {
    if (id === "assist") {
      this.bridge.assist.set(!this.bridge.assist.get());
      this.setMode("intro");
    } else this.advance(true);
  }

  private busy() {
    return this.mode === "playing" || this.mode === "countin" || this.mode === "resuming";
  }

  press(timeStamp: number, id: string, pageX = -1, pageY = -1) {
    if (this.mode === "playing" || this.mode === "countin") this.registerDown(timeStamp, id);
    else if (this.carded()) {
      this.pressedButton = this.buttonAt(pageX, pageY);
      this.card.press(this.pressedButton);
    }
  }

  release(timeStamp: number, id: string, pageX = -1, pageY = -1) {
    if (this.mode === "playing" || this.mode === "countin") {
      this.registerUp(timeStamp, id);
      return;
    }
    if (!this.carded()) return;
    const pressed = this.pressedButton;
    this.pressedButton = null;
    this.card.press(null);
    if (pressed) {
      if (this.buttonAt(pageX, pageY) === pressed) this.pressButton(pressed);
      return;
    }
    this.advance(false);
  }

  key(code: string, timeStamp: number) {
    const pauseKey = code === "Escape" || code === "KeyP";
    if (this.busy()) {
      if (pauseKey) this.bridge.onPauseRequest();
      else if (this.mode !== "resuming") this.press(timeStamp, `k${code}`);
      return;
    }
    if (!this.carded()) return;
    if (pauseKey) this.bridge.onPauseRequest();
    else if (this.mode === "intro" && code === "KeyA") this.pressButton("assist");
    else this.advance(false);
  }

  keyUp(code: string, timeStamp: number) {
    if (this.mode === "playing" || this.mode === "countin") this.registerUp(timeStamp, `k${code}`);
  }

  prepare(id: SongId) {
    this.stopPlayer();
    this.ensureStage();
    this.setSong(id);
    this.modeSince = 0;
    this.setMode(this.tutorialSeen ? "intro" : "tutorial");
    this.modeSince = performance.now() - 450;
  }

  restartSong() {
    this.stopPlayer();
    if (this.tutorialSeen) this.startSong();
    else this.setMode("tutorial");
  }

  pause() {
    if (this.busy()) this.pauseSong();
  }

  resume() {
    if (this.mode === "paused") this.resumeSong();
  }

  quit() {
    this.stopPlayer();
    this.setMode("idle");
  }

  live() {
    return this.busy() || this.mode === "paused";
  }

  private advance(fromButton: boolean) {
    if (!fromButton && performance.now() - this.modeSince < 600) return;
    if (this.mode === "tutorial") {
      this.tutorialSeen = true;
      this.bridge.tutorial.done();
      this.startSong();
    } else if (this.mode === "intro") this.startSong();
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

  private startSong() {
    this.card.hide();
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
    this.sparks = [];
    this.missAt.clear();
    this.streakShown = 0;
    this.listenSeen = 0;
    this.callSeen = 0;
    this.coached = false;
    this.talkFan = null;
    this.talkRecent = [];
    this.talkStreak = 0;
    this.talkCold = false;
    this.talkNext = performance.now() + 6000 + Math.random() * 2000;
    if (this.segment !== 0) {
      this.segment = 0;
      this.placeBand(true);
    }
    this.jury.forEach((view, id) => {
      view.plate.setVisible(false);
      view.arm.setVisible(false);
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

  private nearestNote(at: number) {
    let best = this.compiled.notes[0];
    for (const n of this.compiled.notes) if (Math.abs(n.at - at) < Math.abs(best.at - at)) best = n;
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
    const segment = this.compiled.song.segments[this.compiled.segmentOfBar[Math.max(0, Math.min(this.compiled.bars - 1, barAt(this.compiled, raw)))]];
    const near = this.nearestNote(raw);
    const freq = toneFreq(near ? this.compiled.tones[near.step] : null);
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
    return { taps: this.presses.map((p) => p.down), ups: this.presses.map((p) => p.up), offset: 0, assist: this.assist };
  }

  private finish() {
    const input = this.judgeInput();
    const verdict = judge(this.compiled, input);
    const log: TapLog = { kind: "talent-taps", version: 2, song: this.songId, offset: 0, assist: this.assist, taps: input.taps, ups: input.ups };
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
    view.plate.setVisible(true).setScale(1);
    view.arm.setVisible(true);
    view.plate.setData("until", performance.now() + ms);
    this.juryMood(id, grade >= 8 ? "happy" : grade <= 4 ? "angry" : "neutral", ms);
    if (!this.bridge.reducedMotion) this.tweens.add({ targets: view.plate, scale: { from: 0.7, to: 1 }, duration: 260, ease: "Back.easeOut" });
  }

  update() {
    const now = performance.now();
    this.clock?.sample();
    this.updateTransient(now);
    this.card.update(now);
    this.updateTalk(now);
    let shown: number;
    if (this.mode === "countin" || this.mode === "playing") {
      const songMs = this.songNow(now);
      this.lastSongMs = songMs;
      shown = songMs;
      this.updateSong(songMs, shown);
    } else if (this.mode === "resuming") {
      const songMs = this.songNow(now);
      shown = this.resumeAt;
      const beat = beatMsAt(this.compiled, this.resumeAt);
      const count = Math.floor((songMs - (this.resumeAt - beat * 4)) / beat);
      if (songMs >= this.resumeAt) {
        this.mode = "playing";
        this.say(this.copy.host.go, 900);
      } else if (count >= 0 && count < 4 && this.bubbleText.text !== String(count + 1)) this.say(String(count + 1), 700);
    } else {
      shown = this.lastSongMs;
    }
    const moving = this.mode === "playing" || this.mode === "countin";
    const phase = ((this.beatPos(shown) % 1) + 1) % 1;
    const pulse = moving && !this.bridge.reducedMotion ? Math.max(0, 1 - phase * 4) : 0;
    this.drawLane(shown, now, pulse);
    this.drawMeter();
    this.drawProgress(shown);
    this.animateBand(shown, now, pulse);
    this.spotG.setAlpha(0.8 + 0.2 * pulse);
    this.liveDot.setAlpha(this.bridge.reducedMotion || Math.floor(now / 600) % 2 === 0 ? 1 : 0.25);
    const live = this.mode === "playing" || this.mode === "countin" || this.mode === "resuming";
    this.updateHost(now, live && shown >= 0 ? this.compiled.signal[barAt(this.compiled, shown)] ?? "clear" : "clear", pulse * 10);
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
    for (let i = this.seen; i < verdict.events.length; i += 1) this.onMark(verdict.events[i].mark, verdict.streak, verdict.events[i].note);
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
        this.placeBand(true);
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
    this.updateTurns(shown);
    this.updateTalkMood(verdict.streak, verdict.crowd);
    this.setStreak(verdict.streak);
    if (verdict.cutAt !== null) this.cut();
    else if (shown >= this.compiled.endMs) this.endSong();
  }

  private updateTurns(shown: number) {
    const calls = this.compiled.calls;
    while (this.callSeen < calls.length && calls[this.callSeen].at <= shown) {
      if (shown - calls[this.callSeen].at < 200) {
        this.flash = { born: performance.now(), color: C.plum300 };
        this.floatNote();
      }
      this.callSeen += 1;
    }
    const spans = this.listenSpans;
    while (this.listenSeen < spans.length && shown >= spans[this.listenSeen].to) {
      const span = spans[this.listenSeen];
      if (span.echo && shown - span.to < 400) this.popup(this.copy.yourTurnCue, "#ffc83d");
      this.listenSeen += 1;
    }
    const first = spans[0];
    if (!this.coached && first && shown >= first.from && shown < first.to) {
      this.coached = true;
      this.say(this.copy.host.listen, 1600);
    }
  }

  private updateTalkMood(streak: number, crowd: number) {
    const now = performance.now();
    const cold = crowd < 40;
    const milestone = streak >= 10 && streak % 10 === 0 && streak !== this.talkStreak;
    if (milestone) this.talkStreak = streak;
    if (!this.talk.visible && ((cold && !this.talkCold) || milestone)) this.talkNext = Math.min(this.talkNext, now + 250);
    this.talkCold = cold;
  }

  private popup(text: string, color: string) {
    const popup = this.popups.reduce((a, b) => (a.born < b.born ? a : b));
    for (const p of this.popups) p.text.setVisible(false);
    popup.born = performance.now();
    popup.text.setText(text).setColor(color).setVisible(true).setAlpha(1).setScale(this.bridge.reducedMotion ? 1 : 1.3);
  }

  private setStreak(n: number) {
    if (n < 5) {
      this.streak.setVisible(false);
      this.streakShown = n;
      return;
    }
    if (n === this.streakShown) return;
    this.streakShown = n;
    this.streakText.setText(this.copy.streak(n).toUpperCase()).setPosition(20, 0);
    const w = this.streakText.width + 40;
    const h = this.L.text.label * 1.7;
    const g = this.streakBg;
    g.clear();
    g.fillStyle(C.ink, 1).fillRoundedRect(4, -h / 2 + 5, w, h, h / 2);
    g.fillStyle(C.sun, 1).fillRoundedRect(0, -h / 2, w, h, h / 2);
    g.lineStyle(4, C.ink, 1).strokeRoundedRect(0, -h / 2, w, h, h / 2);
    this.streak.setVisible(true);
    if (!this.bridge.reducedMotion && n % 10 === 0) this.tweens.add({ targets: this.streak, scale: { from: 1.25, to: 1 }, duration: 260, ease: "Back.easeOut" });
  }

  private onMark(mark: Mark, streak: number, note: number | null) {
    const now = performance.now();
    this.popup(this.copy.marks[mark], MARK_COLOR[mark]);
    if (mark === "miss" || mark === "dropped" || mark === "noise") {
      this.flash = { born: now, color: C.tomato };
      if (mark === "miss" && note !== null) this.missAt.set(note, now);
    } else {
      this.bursts.push({ born: now, color: MARK_TINT[mark] });
      this.flash = { born: now, color: MARK_TINT[mark] };
      if (mark !== "near") {
        this.sparks.push({ born: now, color: MARK_TINT[mark], seed: (now % 1000) / 160 });
        this.floatNote();
      }
    }
    if (mark === "noise") {
      this.shakeUntil = now + 240;
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

  private floatNote() {
    if (this.bridge.reducedMotion) return;
    const featured = this.featured();
    const spot = featured === "404" ? this.hostSpot : this.kids.get(featured)?.spot;
    if (!spot) return;
    const floater = this.floaters.reduce((a, b) => (a.born < b.born ? a : b));
    const side = Math.random() < 0.5 ? -1 : 1;
    floater.born = performance.now();
    floater.x = spot.x + side * (60 + Math.random() * 50) * spot.scale;
    floater.y = spot.y - FEET * spot.scale * 0.55;
    floater.drift = side * (20 + Math.random() * 30);
    floater.img.setTint(MEMBER_COLOR[featured]).setVisible(true);
  }

  private updateTransient(now: number) {
    if (this.bubble.visible && now > this.bubbleUntil) this.bubble.setVisible(false);
    if (this.shh.visible && now > this.shhUntil) this.shh.setVisible(false);
    this.jury.forEach((view, id) => {
      if (view.mood !== "neutral" && now > view.moodUntil) this.juryMood(id, "neutral", 0);
      if (view.heart.visible && now > view.heartUntil) view.heart.setVisible(false);
      const until = view.plate.getData("until") as number | undefined;
      if (view.plate.visible && until !== undefined && now > until) {
        view.plate.setVisible(false);
        view.arm.setVisible(false);
      }
    });
    const rise = this.bridge.reducedMotion ? 0 : 44;
    const baseY = this.L.lane.housing.y - 46;
    for (const p of this.popups) {
      if (!p.text.visible) continue;
      const age = (now - p.born) / 620;
      if (age >= 1) p.text.setVisible(false);
      else {
        p.text.setY(baseY - age * rise).setAlpha(1 - age * age);
        if (!this.bridge.reducedMotion) p.text.setScale(1 + 0.3 * Math.max(0, 1 - age * 6));
      }
    }
    for (const f of this.floaters) {
      if (!f.img.visible) continue;
      const k = (now - f.born) / 900;
      if (k >= 1) {
        f.img.setVisible(false);
        continue;
      }
      f.img.setPosition(f.x + Math.sin(k * Math.PI * 2) * 10 + f.drift * k, f.y - k * 110).setAlpha(1 - k * k).setScale(0.75 + 0.25 * Math.min(1, k * 5));
    }
  }

  private drawMeter() {
    const target = this.verdict?.crowd ?? 70;
    this.displayCrowd += (target - this.displayCrowd) * 0.15;
    const m = this.L.meter;
    const g = this.meterG;
    const from = (g.getData("from") as number) ?? 120;
    const x = from;
    const w = m.w - from - 10;
    const y = 8;
    const h = m.h - 16;
    g.clear();
    g.fillStyle(C.plum950, 1).fillRoundedRect(x, y, w, h, h / 2);
    const level = Math.max(0, Math.min(100, this.displayCrowd)) / 100;
    const color = level < 0.3 ? C.tomato : level < 0.6 ? C.sun : C.mint;
    if (level > 0.02) g.fillStyle(color, 1).fillRoundedRect(x + 3, y + 3, Math.max(h - 6, (w - 6) * level), h - 6, (h - 6) / 2);
    g.lineStyle(3, C.ink, 1).strokeRoundedRect(x, y, w, h, h / 2);
  }

  private drawProgress(shown: number) {
    const P = this.L.progress;
    const g = this.progressG;
    g.clear();
    if (OFFSTAGE.includes(this.mode)) return;
    const end = this.compiled.endMs;
    const k = Math.max(0, Math.min(1, shown / end));
    g.fillStyle(C.plum950, 1).fillRoundedRect(P.x, P.y - P.h / 2, P.w, P.h, P.h / 2);
    if (k > 0) g.fillStyle(C.sun, 1).fillRoundedRect(P.x, P.y - P.h / 2, Math.max(P.h, P.w * k), P.h, P.h / 2);
    for (const s of this.compiled.sections) {
      const x = P.x + (P.w * s.endMs) / end;
      g.fillStyle(C.cream, 1).fillCircle(x, P.y, P.h * 0.75);
      g.lineStyle(3, C.ink, 1).strokeCircle(x, P.y, P.h * 0.75);
    }
    g.lineStyle(3, C.ink, 1).strokeRoundedRect(P.x, P.y - P.h / 2, P.w, P.h, P.h / 2);
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

  private animateBand(shown: number, now: number, pulse: number) {
    const featured = this.featured();
    const moving = this.mode === "playing" || this.mode === "countin";
    const bob = pulse * 8;
    const streak = this.verdict?.streak ?? 0;
    const holding = moving && this.active.size > 0;
    this.kids.forEach((view, id) => {
      const lead = id === featured || (featured === "404" && id === "deco");
      const performer = id === featured;
      view.head.y = -FEET + bob * (lead ? 1 : 0.6);
      if (!this.tweens.isTweening(view.root)) view.root.y = view.spot.y - (performer ? bob * 0.6 : 0);
      const pose: Pose = now < view.poseUntil || (lead && holding) ? "hit" : "ready";
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

  private drawLane(shown: number, now: number, pulse: number) {
    const LN = this.L.lane;
    const S = LN.track;
    const hitX = LN.hitX;
    const laneY = this.laneY;
    const r = LN.r;
    const g = this.notesG;
    const compiled = this.compiled;
    const beatNow = this.beatPos(shown);
    const xOfBeat = (beat: number) => hitX + (beat - beatNow) * LN.pxPerBeat;
    const xOf = (ms: number) => xOfBeat(this.beatPos(ms));
    const left = S.x + 10;
    const right = S.x + S.w - 10;
    const assist = OFFSTAGE.includes(this.mode) ? this.bridge.assist.get() : this.assist;
    g.clear();
    this.ghostG.clear();
    this.noteIcons.begin();
    this.missIcons.begin();
    this.ghostIcons.begin();
    const firstBar = Math.max(0, Math.floor((beatNow - (hitX - left) / LN.pxPerBeat) / 4));
    const lastBar = Math.min(compiled.bars - 1, Math.floor((beatNow + (right - hitX) / LN.pxPerBeat) / 4));
    let label = 0;
    const tallyY = S.y + (laneY - ribbon(r) - S.y) / 2;
    const ringClear = hitX + r + RING_GAP + 40;
    for (let bar = firstBar; bar <= lastBar; bar += 1) {
      const x0 = Math.max(left, xOfBeat(bar * 4));
      const x1 = Math.min(right, xOfBeat(bar * 4 + 4));
      if (x1 <= x0) continue;
      const calls = this.callsByBar.get(bar);
      const items = calls ?? this.echoesByBar.get(bar);
      if (items) {
        const call = calls !== undefined;
        const start = xOfBeat(bar * 4);
        drawRegion(g, x0, x1, laneY, r, call ? C.plum600 : C.sun, call ? 0.75 : 0.3, call ? null : start);
        const text = this.labels[label];
        const tallyW = items.length * TALLY_GAP + 8;
        if (text) text.setText(call ? this.copy.milaTurn : this.copy.yourTurn);
        const floor = x0 < ringClear ? ringClear : x0 + 12;
        const tx = text ? Math.min(x1 - text.width - tallyW - 10, Math.max(floor, start + 12)) : 0;
        if (text && tx >= floor - 1) {
          label += 1;
          text.setColor(call ? "#b9a6ef" : "#ffc83d").setOrigin(0, 0.5).setPosition(tx, tallyY).setVisible(true);
          items.forEach((item, i) => {
            const x = text.x + text.width + 8 + TALLY_GAP / 2 + i * TALLY_GAP;
            if (x > left + 10 && x < x1 - 10) drawTally(g, x, tallyY, call ? "call" : "echo", call ? (item.at <= shown ? "done" : "waiting") : this.tallyOf(item));
          });
        }
      }
      for (let beat = 0; beat < 4; beat += 1) {
        const x = xOfBeat(bar * 4 + beat);
        if (x < left + 8 || x > right - 8) continue;
        drawBeatLine(g, x, laneY, r, beat === 0);
      }
    }
    label = this.drawStatic(xOfBeat, beatNow, left, right, label, assist);
    const verdict = this.verdict;
    const edgeFade = (x: number) => Math.max(0, Math.min(1, (right - x) / (r * 1.6)));
    for (const call of compiled.calls) {
      const x = xOf(call.at);
      if (x < left - r || x > right + r) continue;
      const alpha = x < hitX ? Math.max(0, 1 - (hitX - x) / 160) : edgeFade(x);
      drawCall(g, x, laneY, r, alpha);
    }
    let holding = false;
    for (const note of compiled.notes) {
      const x = xOf(note.at);
      const xEnd = note.kind === "hold" ? xOf(note.end) : x;
      if (xEnd < left - r * 2 || x > right + r) continue;
      const grade = verdict?.grades[note.index] ?? null;
      const tail = verdict?.tails[note.index] ?? null;
      const signal = compiled.signal[note.bar];
      const ghost = signal !== "clear";
      const layer = ghost ? this.ghostG : g;
      const icons = ghost ? this.ghostIcons : this.noteIcons;
      const signalAlpha = (ghost ? ghostAlpha(signal, assist, note.index, now, this.bridge.reducedMotion) : 1) * edgeFade(x);
      const color = MEMBER_COLOR[compiled.song.segments[compiled.segmentOfBar[note.bar]].featured];
      const fade = (px: number) => Math.max(0, 1 - Math.max(0, hitX - px) / 200);
      const missed = this.missAt.get(note.index);
      const fall = missed !== undefined ? (now - missed) / MISS_FALL_MS : null;
      if (note.kind === "echo") {
        if (grade === null) {
          if (assist) drawEcho(g, x, laneY, r, 0.6 * edgeFade(x));
          continue;
        }
        if (grade === "miss") this.drawMissed(g, x, laneY, r, fall, fade(x));
        continue;
      }
      if (note.kind === "hold") {
        const held = grade !== null && grade !== "miss" && tail === null;
        if (grade === null) {
          drawTail(layer, x, xEnd, laneY, r, color, 0.6 * signalAlpha, left, right);
          drawNote(layer, icons, x, laneY, r, color, signalAlpha, false);
        } else if (grade === "miss") {
          drawTail(g, x, xEnd, laneY, r, C.gray, 0.55 * fade(xEnd), left, right);
          this.drawMissed(g, x, laneY, r, fall, fade(x));
        } else if (held) {
          holding = true;
          if (xEnd > hitX) drawTail(g, hitX, xEnd, laneY, r, color, 0.95, left, right);
          drawNote(g, this.noteIcons, hitX, laneY, r, color, 1, false);
        } else if (tail === "dropped") {
          const release = verdict?.releases[note.index];
          const from = release !== null && release !== undefined ? xOf(release) : x;
          drawTail(g, from, xEnd, laneY, r, C.gray, 0.6 * fade(xEnd), left, right);
        }
        continue;
      }
      if (grade === "miss") {
        this.drawMissed(g, x, laneY, r, fall, fade(x));
        continue;
      }
      if (grade !== null) continue;
      drawNote(layer, icons, x, laneY, r, color, signalAlpha);
    }
    this.noteIcons.end();
    this.missIcons.end();
    this.ghostIcons.end();
    for (let i = label; i < this.labels.length; i += 1) this.labels[i].setVisible(false);
    const base = this.ringBaseG;
    const front = this.ringFrontG;
    base.clear();
    front.clear();
    const flashK = Math.max(0, 1 - (now - this.flash.born) / 260);
    const shakeK = Math.max(0, (this.shakeUntil - now) / 240);
    const shake = this.bridge.reducedMotion ? 0 : Math.sin(now * 0.09) * 8 * shakeK;
    const beatIndex = Math.floor(beatNow);
    const listen = this.listening(shown);
    const ring = { pulse, flash: flashK, flashColor: this.flash.color, lit: this.bridge.reducedMotion ? 0 : -beatIndex, shake, holding, listen };
    this.ear
      .setVisible(listen)
      .setPosition(hitX + shake, laneY)
      .setScale((r * (1.2 + 0.2 * flashK)) / 96);
    const moving = this.mode === "playing" || this.mode === "countin" || this.mode === "resuming";
    this.chase.forEach((b, i) => {
      const on = moving && !this.bridge.reducedMotion ? (Math.floor(i / 2) + beatIndex) % 4 === 0 : Math.floor(i / 2) % 4 === 0;
      if (on) base.fillStyle(C.sunPale, 1).fillCircle(b.x, b.y, 5.5);
    });
    drawRingBase(base, hitX, laneY, r, ring);
    drawRingFront(front, hitX, laneY, r, ring);
    this.bursts = this.bursts.filter((b) => now - b.born < 280);
    for (const b of this.bursts) drawBurst(front, hitX + shake, laneY, r, b.color, (now - b.born) / 280);
    this.sparks = this.sparks.filter((s) => now - s.born < SPARK_MS);
    drawSparks(front, hitX, laneY, r, this.sparks, now, SPARK_MS);
  }

  private drawMissed(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, fall: number | null, fade: number) {
    if (fall === null) {
      if (fade > 0) g.fillStyle(C.gray, 0.8 * fade).fillCircle(x, y, r * 0.8);
      return;
    }
    if (fall >= 1) return;
    const dy = this.bridge.reducedMotion ? 0 : fall * fall * 120;
    const alpha = 1 - fall;
    g.fillStyle(C.gray, alpha).fillCircle(x, y + dy, r * 0.85);
    g.lineStyle(4, C.ink, alpha).strokeCircle(x, y + dy, r * 0.85);
    this.missIcons.place(x, y + dy, r * 1.6, alpha);
  }

  private drawStatic(xOfBeat: (beat: number) => number, now: number, left: number, right: number, labelStart: number, assist: boolean) {
    const S = this.L.lane.track;
    const half = ribbon(this.L.lane.r) - 3;
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
          (kind === "lost" ? this.lostMask : this.weakMask).fillStyle(0xffffff, 1).fillRect(x0, this.laneY - half, x1 - x0, half * 2);
          if (kind === "lost") anyLost = true;
          else anyWeak = true;
          const text = this.labels[label];
          if (text && x1 - x0 > 140) {
            label += 1;
            text.setText(kind === "lost" ? this.copy.noSignal : this.copy.weakSignal).setColor("#f7ecd4").setOrigin(0.5, 0.5);
            text.setPosition((x0 + x1) / 2, S.y + (this.laneY - half - S.y) / 2).setVisible(true);
          }
        }
      }
      bar = end + 1;
    }
    const drift = this.bridge.reducedMotion ? 0 : performance.now() * 0.004;
    for (const tile of [this.lostTile, this.weakTile]) {
      tile.tilePositionX = (now * this.L.lane.pxPerBeat) / 5;
      tile.tilePositionY = drift;
    }
    this.lostTile.setVisible(anyLost).setAlpha(assist ? 0.5 : 1);
    this.weakTile.setVisible(anyWeak).setAlpha(assist ? 0.3 : 0.6);
    return label;
  }
}
