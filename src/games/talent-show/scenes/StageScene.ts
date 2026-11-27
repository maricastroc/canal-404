import * as Phaser from "phaser";
import { ArrowRight, Check, Ear, Heart, Music2, Play, Pointer, ThumbsDown, ThumbsUp, Volume2, X, type IconNode } from "lucide";
import type { Locale } from "@/i18n/locales";
import { loadIcons } from "@/games/kit/icons";
import { reportFailedLoads } from "@/games/kit/load";
import { cartoonText } from "@/games/kit/ui";
import { formatNumber } from "@/i18n/format";
import { getAudio } from "@/lib/audio/engine";
import { AudibleClock, SongPlayer, onBeat, onBeatSound, pitched, toneFreq } from "../audio/player";
import type { Stage } from "../audio/voices";
import { TALENT_COPY, type CrowdLine, type TalentCopy } from "../copy";
import { judge, runScore, STARS, type JudgeEvent, type Mark, type TapLog, type Verdict } from "../sim/judge";
import { barAt, beatMsAt, type BandMember, type ChartNote, type CompiledSong, type Signal, type SongId } from "../song/notation";
import { compiledSong, roundOf, SONG_ORDER } from "../song/songs";
import { ART_FILES } from "./artManifest";
import { DEMO_OF, ShowCard, type CardButtonId, type CardContent } from "./card";
import { AMP, FIGURE, FEET, HOST_BOX } from "./figure";
import { Crowd, type CrowdMode, type Fan } from "./crowd";
import { Jury } from "./jury";
import { StageLights, type LightMode } from "./lights";
import { C, IconPool, MEMBER_COLOR, RING_GAP, TALLY_GAP, drawBeatLine, drawCall, drawNote, drawPop, drawRegion, drawRingBase, drawRingFront, drawSparks, drawTail, drawTally, drawTrack, ghostAlpha, ribbon, shade, type PopStrength, type Spark, type TallyState } from "./lane";
import { layoutFor, toWorld, type Layout, type Shape, type Spot } from "./layout";

const NOTE_GLYPH: IconNode = Music2.map(([tag, attrs]): IconNode[number] => [tag, tag === "circle" ? { ...attrs, fill: "#1d1830" } : attrs]);

export type RunReport = { song: SongId; verdict: Verdict; log: TapLog };

export type TalentBridge = {
  locale: Locale;
  fonts: { display: string; body: string };
  shape: Shape;
  touch: boolean;
  inlineScore: boolean;
  reducedMotion: boolean;
  tutorial: { seen: () => boolean; done: () => void };
  onLoad: (value: number) => void;
  onError: (error: unknown) => void;
  onReady: () => void;
  onRun: (report: RunReport) => void;
  onPauseRequest: () => void;
  onScore: (score: number) => void;
  onSkip: () => void;
};

type Mode = "idle" | "intro" | "tutorial" | "countin" | "playing" | "paused" | "resuming" | "cut" | "results";
type HostMood = "neutral" | "happy" | "excited" | "surprised" | "sad" | "static" | "wave";
type Pose = "ready" | "hit";
type KidFace = "normal" | "happy" | "wow";
type Kid = Exclude<BandMember, "404">;

const BAND: Kid[] = ["deco", "lina", "bruno", "mila"];
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
const POP_MS = 260;
const PRESS_MS = 110;
const MISS_QUIET_MS = 220;
const RECHECK_MS = 300;
const READOUT_MS = 560;
const READOUT_FADE_MS = 140;
const APPLAUSE_MS = 150;
const PLATE_GAP_MS = 450;
const FINALE_TALK_MS = 3600;
const SKIP_AFTER_MS = 700;

type Pop = { born: number; x: number; color: number; tint: number; strength: PopStrength };
type Chip = { text: string; color: number; heard: boolean };
type KidView = { root: Phaser.GameObjects.Container; body: Phaser.GameObjects.Image; head: Phaser.GameObjects.Image; pose: Pose; poseUntil: number; face: KidFace; flash: KidFace; faceUntil: number; base: KidFace; spot: Spot };
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
  private tutorialSeen = false;
  private presses: { down: number; up: number | null }[] = [];
  private active = new Map<string, { down: number; up: number | null }>();
  private verdict: Verdict | null = null;
  private marked = new Map<string, number>();
  private markedUntil = -Infinity;
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
  private hostLead = false;
  private hostMood: HostMood = "wave";
  private hostOverride: HostMood | null = null;
  private hostUntil = 0;
  private crowd!: Crowd;
  private jury!: Jury;
  private stageLights!: StageLights;
  private ampCone!: Phaser.GameObjects.Image;
  private ampScale = 1;
  private missRun = 0;
  private lastNoteEnd = 0;
  private applauded = false;
  private lastFrame = 0;
  private bubble!: Phaser.GameObjects.Container;
  private bubbleBg!: Phaser.GameObjects.Graphics;
  private bubbleText!: Phaser.GameObjects.Text;
  private bubbleUntil = 0;
  private kids = new Map<Kid, KidView>();
  private titleText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private scoreShown = -1;
  private hint!: Phaser.GameObjects.Container;
  private countText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private nameTag!: Phaser.GameObjects.Container;
  private nameTagBg!: Phaser.GameObjects.Graphics;
  private nameTagText!: Phaser.GameObjects.Text;
  private streak!: Phaser.GameObjects.Container;
  private streakBg!: Phaser.GameObjects.Graphics;
  private streakText!: Phaser.GameObjects.Text;
  private streakShown = 0;
  private labels: Phaser.GameObjects.Text[] = [];
  private readout!: Phaser.GameObjects.Container;
  private chipBg!: Phaser.GameObjects.Graphics;
  private chipText!: Phaser.GameObjects.Text;
  private wordText!: Phaser.GameObjects.Text;
  private readoutBorn = -Infinity;
  private readoutUntil = -Infinity;
  private readoutFit = 1;
  private keepReadout = false;
  private pops: Pop[] = [];
  private popIcons!: IconPool;
  private pressAt = -Infinity;
  private actionAt = -Infinity;
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
      { key: "icon-thumbs-up", icon: ThumbsUp, size: 116, color: "#1d1830", fill: "#ffc83d", strokeWidth: 1.8 },
      { key: "icon-thumbs-down", icon: ThumbsDown, size: 116, color: "#1d1830", fill: "#ef4f43", strokeWidth: 1.8 },
      { key: "icon-note", icon: NOTE_GLYPH, size: 96, color: "#1d1830", strokeWidth: 2.6 },
      { key: "icon-miss", icon: X, size: 128, color: "#ef4f43", strokeWidth: 2.4 },
      { key: "icon-check", icon: Check, size: 96, color: "#1d1830", strokeWidth: 3.4 },
      { key: "icon-ear", icon: Ear, size: 96, color: "#b9a6ef", strokeWidth: 2.6 },
      { key: "icon-ear-ink", icon: Ear, size: 96, color: "#1d1830", strokeWidth: 6 },
    ]);
    reportFailedLoads(this, bridge.onError);
  }

  create() {
    this.bridge = this.registry.get("bridge") as TalentBridge;
    this.copy = TALENT_COPY[this.bridge.locale];
    const shape = this.bridge.shape;
    this.L = layoutFor(shape.kind, shape.W, shape.H);
    this.laneY = this.L.lane.track.y + this.L.lane.track.h / 2;
    this.tutorialSeen = this.bridge.tutorial.seen();
    this.makeStaticTexture();
    this.makeNoteTexture();
    this.buildBackdrop();
    this.jury = new Jury(this, this.L, this.copy.jury, this.copy.host.shh, { name: (size) => this.font("body", size, "#1d1830"), grade: this.font("display", 62, "#1d1830"), shh: this.outlined("display", this.L.text.bubble, "#ef4f43") }, this.bridge.reducedMotion);
    this.buildHost();
    this.buildBand();
    this.crowd = new Crowd(this, this.L, this.bridge.reducedMotion);
    this.buildTalk();
    this.buildLane();
    this.buildHud();
    const kind = this.L.kind;
    this.card = new ShowCard(
      this,
      this.copy,
      this.bridge.fonts,
      this.L.card,
      { title: this.L.text.cardTitle, body: this.L.text.cardBody, small: this.L.text.cardSmall, tag: this.L.text.demoTag },
      kind === "phone" ? "phone" : kind === "portrait" ? "stacked" : "row",
      this.bridge.reducedMotion,
    );
    this.setSong("theme");
    this.setMode("idle");
    this.events.once(Phaser.Scenes.Events.CREATE, () => this.bridge.onReady());
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
    const art = L.art;
    const back = this.add.graphics().setDepth(0);
    if (L.kind === "phone" || L.kind === "wide") back.fillStyle(C.plum950, 1).fillRect(0, L.stage.front, L.W, L.H - L.stage.front);
    if (art.sides > 0) {
      const wood = 0xb06c3f;
      back.fillStyle(wood, 1).fillRect(0, L.stage.top, art.sides + 4, L.stage.front - L.stage.top).fillRect(L.W - art.sides - 4, L.stage.top, art.sides + 4, L.stage.front - L.stage.top);
      back.fillStyle(0x55301e, 1).fillRect(0, L.stage.front - 18 * art.k, L.W, 18 * art.k);
      back.lineStyle(5, C.ink, 1).lineBetween(0, L.stage.top, L.W, L.stage.top).lineBetween(0, L.stage.front, L.W, L.stage.front);
    }
    this.add.image(art.x, art.y, art.key).setOrigin(0, 0).setScale(art.k).setDepth(0);
    if (art.sides > 0) {
      const h = L.stage.top + 6;
      const w = art.sides + 24 * art.k;
      this.add.image(0, 0, "curtain-side").setOrigin(0, 0).setDisplaySize(w, h).setDepth(0.5);
      this.add.image(L.W, 0, "curtain-side").setOrigin(1, 0).setFlipX(true).setDisplaySize(w, h).setDepth(0.5);
    }
    if (art.valance) this.add.image(0, 0, "valance-wide").setOrigin(0, 0).setDepth(0.6);
    this.spotG = this.add.graphics().setDepth(1);
    const p = L.performer;
    for (const s of L.spots) {
      this.spotG.fillStyle(C.sunPale, 0.11).fillTriangle(s.x - 14, s.y, s.x + 14, s.y, p.x + p.podium, p.y);
      this.spotG.fillTriangle(s.x - 14, s.y, p.x - p.podium, p.y, p.x + p.podium, p.y);
    }
    this.spotG.fillStyle(C.sunPale, 0.26).fillEllipse(p.x, p.y, p.podium * 2 - 10, p.podium * 0.3);
    this.stageLights = new StageLights(this, L, this.bridge.reducedMotion, this.spotG);
    const amp = L.amp;
    this.add.image(amp.x, amp.y, "stage-amp").setOrigin(0.5, 1).setScale(amp.scale / 2).setDepth(3.5);
    this.ampScale = amp.scale / 2;
    this.ampCone = this.add
      .image(amp.x + (AMP.cone.x - AMP.w / 2) * amp.scale, amp.y - (AMP.h - AMP.cone.y) * amp.scale, "amp-cone")
      .setScale(this.ampScale)
      .setDepth(3.51);
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

    this.scoreText = cartoonText(this, L.score.x, L.score.y, "", { size: L.score.size, color: "#ffc83d", font: this.bridge.fonts.display, stroke: 0.2, shadow: false })
      .setOrigin(1, 0.5)
      .setDepth(20)
      .setVisible(this.bridge.inlineScore);
    this.setScore(0);

    const lane = this.L.lane;
    const countAt = this.at(lane.hitX + lane.pxPerBeat * 1.7, this.laneY);
    this.countText = cartoonText(this, countAt.x, countAt.y, "", { size: 170, color: "#ffc83d", font: this.bridge.fonts.display, stroke: 0.1 }).setOrigin(0.5).setDepth(14).setVisible(false);

    this.hint = this.add.container(0, 0).setDepth(16).setVisible(false);
    if (L.hint && this.bridge.touch) {
      const size = L.text.label;
      const text = cartoonText(this, 0, 0, this.copy.tapAnywhereShort.toUpperCase(), { size, color: "#1d1830", font: this.bridge.fonts.display, stroke: 0, shadow: false }).setOrigin(0, 0.5);
      const icon = this.add.image(0, 0, "icon-pointer").setOrigin(0.5);
      icon.setScale((size * 1.5) / icon.height);
      const w = icon.displayWidth + 12 + text.width + 44;
      const h = size * 1.8;
      const g = this.add.graphics();
      g.fillStyle(C.ink, 1).fillRoundedRect(-w / 2 + 4, -h / 2 + 5, w, h, h / 2);
      g.fillStyle(C.sun, 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      g.lineStyle(4, C.ink, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      icon.setPosition(-w / 2 + 22 + icon.displayWidth / 2, 0);
      text.setPosition(icon.x + icon.displayWidth / 2 + 12, 0);
      this.hint.add([g, icon, text]).setPosition(L.hint.x, L.hint.y);
    }
  }

  private count(n: number | null) {
    if (!this.L.lane.vertical) return;
    if (n === null) {
      if (this.countText.visible) this.countText.setVisible(false);
      return;
    }
    if (this.countText.visible && this.countText.text === String(n)) return;
    this.countText.setText(String(n)).setVisible(true).setAlpha(1);
    this.tweens.killTweensOf(this.countText);
    this.countText.setScale(1);
    if (!this.bridge.reducedMotion) this.tweens.add({ targets: this.countText, scale: { from: 1.35, to: 1 }, alpha: { from: 1, to: 0.55 }, duration: 420, ease: "Cubic.easeOut" });
  }

  private setScore(score: number) {
    if (score === this.scoreShown) return;
    this.scoreShown = score;
    this.scoreText.setText(this.copy.points(formatNumber(score, this.bridge.locale)));
    this.bridge.onScore(score);
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
    const phone = this.L.kind === "phone";
    const above = phone && this.hostLead;
    const [a, b, tip] = above ? [w / 2 - 14, w / 2 + 14, w / 2] : [16, 40, 4];
    this.bubbleBg.fillStyle(C.cream, 1).fillTriangle(a, h / 2 - 6, b, h / 2 - 6, tip, h / 2 + 22);
    this.bubbleBg.lineStyle(5, C.ink, 1).lineBetween(a, h / 2 - 2, tip, h / 2 + 22).lineBetween(tip, h / 2 + 22, b, h / 2 - 2);
    const spot = phone ? this.hostSpot : { x: this.host.x, y: this.host.y, scale: this.host.scale * 2 };
    if (above) {
      const top = spot.y - (HOST_BOX.feet - HOST_BOX.y) * spot.scale;
      const x = Math.max(16, Math.min(this.L.W - w - 16, spot.x - w / 2));
      this.bubble.setPosition(x, top - 28 - h / 2).setVisible(true);
    } else {
      const x = Math.min(this.L.W - w - 16, spot.x + (phone ? 95 : 60) * spot.scale);
      this.bubble.setPosition(x, spot.y - (phone ? 230 : 300) * spot.scale).setVisible(true);
    }
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
    BAND.forEach((id) => {
      const view = this.kids.get(id);
      if (!view) return;
      const lead = id === featured;
      view.spot = lead ? performer : this.backlineSpot(id, featured);
      view.root.setDepth(lead ? 8 : 4);
      view.body.setTint(lead ? 0xffffff : 0xd9d2ee);
      view.head.setTint(lead ? 0xffffff : 0xd9d2ee);
      move(view.root, view.spot, view.spot.scale);
    });
    const hostLead = featured === "404";
    this.hostLead = hostLead;
    this.hostSpot = hostLead ? { x: performer.x, y: performer.y, scale: L.performer.scale * 1.18 } : { ...L.host };
    this.host.setDepth(hostLead ? 8 : 7);
    move(this.host, this.hostSpot, this.hostSpot.scale / 2);
    const source = this.compiled.song.segments[this.segment].source ?? this.songId;
    this.setNameTag(this.copy.songs[source].who);
  }

  private backlineSpot(id: Kid, featured: BandMember): Spot {
    const B = this.L.backline;
    const half = B.xs.length / 2;
    const index = BAND.indexOf(id);
    let slot = index;
    if (B.packed) {
      const left = index < half;
      const side = BAND.filter((other) => other !== featured && (BAND.indexOf(other) < half) === left);
      const j = side.indexOf(id);
      slot = left ? half - side.length + j : half + j;
    }
    return { x: B.xs[slot], y: B.y, scale: B.scale };
  }

  private buildTalk() {
    this.talkBg = this.add.graphics();
    this.talkText = this.add.text(0, 0, "", { ...this.font("body", this.L.text.label, "#1d1830"), align: "center" }).setOrigin(0.5);
    this.talk = this.add.container(0, 0, [this.talkBg, this.talkText]).setDepth(9.8).setVisible(false);
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

  private crowdSay(now: number, said?: CrowdLine) {
    const W = this.L.W;
    const sided = this.L.talk.lanes !== null;
    const head = (f: Fan) => f.y - f.img.displayHeight * 0.66;
    const top = this.L.talk.top + (sided ? this.L.text.label * 4 : 0);
    const fans = this.crowd.fans.filter((f) => f.img.visible && f !== this.talkFan && (sided || (f.img.x > W * 0.12 && f.img.x < W * 0.88)) && head(f) > top && head(f) < this.L.talk.bottom);
    if (fans.length === 0) {
      this.talkNext = now + 2000;
      return;
    }
    const fan = fans[Math.floor(Math.random() * fans.length)];
    const line = said ?? this.crowdLine();
    this.talkRecent = [line.text, ...this.talkRecent].slice(0, 5);
    this.talkFan = fan;
    this.drawTalk(fan, line);
    this.talkUntil = now + TALK_MS;
    this.talkNext = this.talkUntil + 3000 + Math.random() * 4000;
  }

  private drawTalk(fan: Fan, line: CrowdLine) {
    const L = this.L;
    const size = L.text.label;
    const lanes = L.talk.lanes;
    const toRight = fan.img.x < L.W / 2;
    const minX = lanes && !toRight ? lanes[1] : 16;
    const maxX = lanes && toRight ? lanes[0] : L.W - 16;
    this.talkText.setWordWrapWidth(lanes ? maxX - minX - 40 : null).setText(line.text);
    const w = this.talkText.width + 40;
    const h = Math.max(size * 1.8, this.talkText.height + size * 0.6);
    const headX = fan.img.x;
    const headY = fan.y - fan.img.displayHeight * 0.66;
    const headR = fan.img.displayWidth * 0.26;
    const above = lanes !== null;
    const y = above ? Math.max(L.talk.top + h / 2, headY - headR - 28 - h / 2) : Math.max(L.talk.top + h / 2, Math.min(L.H - 8 - h / 2, headY - h * 0.35));
    const x = Math.max(minX, Math.min(maxX - w, above ? headX - w / 2 : toRight ? headX + headR + 24 : headX - headR - 24 - w));
    const tx = headX + (above ? 0 : toRight ? headR * 0.4 : -headR * 0.4) - x;
    const ty = above ? headY - headR * 0.8 - y : headY - y;
    const bx = Math.max(28, Math.min(w - 28, tx));
    const side = toRight ? 0 : w;
    const from = above ? { x: bx, y: h / 2 } : { x: side, y: 0 };
    const tip = { x: from.x + (tx - from.x) * 0.55, y: from.y + (ty - from.y) * 0.55 };
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
        const cx = from.x + (tx - from.x) * k;
        const cy = from.y + (ty - from.y) * k;
        g.fillStyle(C.cream, 1).fillCircle(cx, cy, dot);
        g.lineStyle(3, C.ink, 1).strokeCircle(cx, cy, dot);
      }
    } else {
      const [a, b] = above
        ? [
            { x: bx - 12, y: h / 2 },
            { x: bx + 12, y: h / 2 },
          ]
        : [
            { x: side, y: -h * 0.16 },
            { x: side, y: h * 0.24 },
          ];
      const inward = above ? { x: 0, y: -4 } : { x: toRight ? 4 : -4, y: 0 };
      g.fillStyle(C.cream, 1).fillTriangle(a.x + inward.x, a.y + inward.y, b.x + inward.x, b.y + inward.y, tip.x, tip.y);
      g.lineStyle(4, C.ink, 1).lineBetween(a.x, a.y, tip.x, tip.y).lineBetween(tip.x, tip.y, b.x, b.y);
    }
    this.talkText.setPosition(w / 2, 0);
    this.talk.setPosition(x, y).setAlpha(1).setVisible(true);
    this.tweens.killTweensOf(this.talk);
    this.talk.setScale(1);
    if (!this.bridge.reducedMotion) this.tweens.add({ targets: this.talk, scale: { from: 0.6, to: 1 }, duration: 180, ease: "Back.easeOut" });
  }

  private updateTalk(now: number) {
    const ended = this.mode === "results";
    if (this.mode !== "playing" && !ended) {
      if (this.talk.visible) this.talk.setVisible(false);
      return;
    }
    if (this.talk.visible) {
      const left = this.talkUntil - now;
      if (left <= 0 || !this.talkFan?.img.visible) this.talk.setVisible(false);
      else this.talk.setAlpha(Math.min(1, left / 250));
      return;
    }
    if (!ended && now >= this.talkNext) this.crowdSay(now);
  }

  private framed<T extends Phaser.GameObjects.Components.Transform>(item: T) {
    const f = this.L.lane.frame;
    item.setPosition(f.x, f.y).setRotation(f.rotation);
    return item;
  }

  private at(x: number, y: number) {
    return toWorld(this.L.lane.frame, x, y);
  }

  private icons(depth: number) {
    return new IconPool(() => this.add.image(0, 0, "icon-note").setDepth(depth), (x, y) => this.at(x, y));
  }

  private placeLabel(text: Phaser.GameObjects.Text, x: number, y: number) {
    const p = this.at(x, y);
    text.setPosition(p.x, p.y).setRotation(this.L.lane.frame.rotation).setVisible(true);
  }

  private buildLane() {
    const { housing: H, track } = this.L.lane;
    const r = this.L.lane.r;
    const g = this.framed(this.add.graphics().setDepth(10));
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
    this.ringBaseG = this.framed(this.add.graphics().setDepth(10.5));
    this.notesG = this.framed(this.add.graphics().setDepth(11));
    this.noteIcons = this.icons(11.2);
    this.missIcons = new IconPool(() => this.add.image(0, 0, "icon-miss").setDepth(11.2), (x, y) => this.at(x, y));
    this.lostMask = this.framed(this.make.graphics({ x: 0, y: 0 }, false));
    this.weakMask = this.framed(this.make.graphics({ x: 0, y: 0 }, false));
    const tile = () => {
      const t = this.add.tileSprite(0, 0, track.w, track.h, "talent-static").setOrigin(0, 0).setTileScale(5).setDepth(11.5);
      const p = this.at(track.x, track.y);
      return t.setPosition(p.x, p.y).setRotation(this.L.lane.frame.rotation);
    };
    this.lostTile = tile();
    this.weakTile = tile();
    this.lostTile.setMask(this.lostMask.createGeometryMask());
    this.weakTile.setMask(this.weakMask.createGeometryMask());
    this.ghostG = this.framed(this.add.graphics().setDepth(11.6));
    this.ghostIcons = this.icons(11.7);
    this.ringFrontG = this.framed(this.add.graphics().setDepth(12));
    this.popIcons = this.icons(12.05);
    const ear = this.at(this.L.lane.hitX, this.laneY);
    this.ear = this.add.container(ear.x, ear.y, [this.add.image(0, 0, "icon-ear-ink"), this.add.image(0, 0, "icon-ear")]).setDepth(12.1).setVisible(false);
    for (let i = 0; i < 8; i += 1) this.labels.push(cartoonText(this, 0, 0, "", { size: this.L.text.label, color: "#f7ecd4", font: this.bridge.fonts.display, stroke: 0.22, shadow: false }).setDepth(13).setVisible(false));
    this.buildReadout();
  }

  private buildReadout() {
    const L = this.L;
    this.chipBg = this.add.graphics();
    this.chipText = cartoonText(this, 0, 0, "", { size: Math.round(L.text.mark * 0.8), color: "#1d1830", font: this.bridge.fonts.display, stroke: 0, shadow: false }).setOrigin(0, 0.5);
    this.wordText = cartoonText(this, 0, 0, "", { size: L.text.mark, color: "#ffc83d", font: this.bridge.fonts.display, stroke: 0.2 }).setOrigin(0, 0.5);
    this.readout = this.add.container(L.readout.x, L.readout.y, [this.chipBg, this.chipText, this.wordText]).setDepth(14).setVisible(false);
  }

  private showReadout(chip: Chip | null, word: string | null, color = "#ffc83d") {
    const R = this.L.readout;
    const size = Math.round(this.L.text.mark * 0.8);
    const chipH = Math.round(size * 1.4);
    const gap = 8;
    let chipW = 0;
    this.chipBg.clear();
    this.chipText.setVisible(chip !== null);
    this.wordText.setVisible(word !== null);
    if (chip) {
      this.chipText.setText(chip.text.toUpperCase()).setColor(chip.heard ? "#b9a6ef" : "#1d1830");
      chipW = Math.round(this.chipText.width + size * 1.1);
    }
    if (word !== null) this.wordText.setText(word).setColor(color);
    const wordW = word !== null ? this.wordText.width : 0;
    const wordH = word !== null ? this.wordText.height * 0.78 : 0;
    let chipY = 0;
    let wordY = 0;
    if (chip && word !== null) {
      const total = chipH + gap + wordH;
      chipY = -total / 2 + chipH / 2;
      wordY = total / 2 - wordH / 2;
    }
    if (chip) {
      const g = this.chipBg;
      const top = chipY - chipH / 2;
      g.fillStyle(C.ink, 1).fillRoundedRect(4, top + 5, chipW, chipH, chipH / 2);
      g.fillStyle(chip.heard ? C.plum950 : chip.color, 1).fillRoundedRect(0, top, chipW, chipH, chipH / 2);
      g.lineStyle(4, chip.heard ? chip.color : C.ink, 1).strokeRoundedRect(0, top, chipW, chipH, chipH / 2);
      this.chipText.setPosition(size * 0.55, chipY + 1);
    }
    this.wordText.setPosition(0, wordY);
    const width = Math.max(chipW, wordW);
    this.readoutFit = Math.min(1, R.max / Math.max(1, width));
    this.readoutBorn = performance.now();
    this.readoutUntil = this.readoutBorn + READOUT_MS;
    this.readout.setVisible(true).setAlpha(1).setScale(this.readoutFit);
  }

  private updateReadout(now: number) {
    if (!this.readout.visible) return;
    if (this.keepReadout) this.readoutUntil = Math.max(this.readoutUntil, now + READOUT_FADE_MS + 40);
    const left = this.readoutUntil - now;
    if (left <= 0 || OFFSTAGE.includes(this.mode)) {
      this.readout.setVisible(false);
      return;
    }
    const punch = this.bridge.reducedMotion ? 0 : 0.18 * Math.max(0, 1 - (now - this.readoutBorn) / 120);
    this.readout.setScale(this.readoutFit * (1 + punch)).setAlpha(Math.min(1, left / READOUT_FADE_MS));
  }

  private chipOf(note: ChartNote): Chip {
    const segment = this.compiled.song.segments[this.compiled.segmentOfBar[note.bar]];
    const tone = this.compiled.tones[note.step];
    const text = pitched(segment.tap) ? this.copy.pitches[(tone ?? 72) % 12] : this.copy.drums[segment.tap];
    return { text, color: MEMBER_COLOR[segment.featured], heard: note.kind === "call" };
  }

  private setSong(id: SongId) {
    this.songId = id;
    this.compiled = compiledSong(id);
    this.lastNoteEnd = this.compiled.notes.reduce((end, n) => Math.max(end, n.end), 0);
    const text = this.copy.songs[id];
    this.titleText.setText(text.title);
    this.subtitleText.setText(`${this.copy.rounds[roundOf(id)]} · ${text.idea}`);
    this.stageLights.setRound(roundOf(id));
    this.crowd.setRound(roundOf(id));
    this.verdict = null;
    this.setScore(0);
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
    return {
      kicker: copy.kicker(copy.rounds[roundOf(this.songId)], SONG_ORDER.indexOf(this.songId) + 1, SONG_ORDER.length),
      title: song.title,
      lead: song.who,
      face: SONG_FACE[this.songId],
      demo: DEMO_OF[this.songId],
      how: song.how,
      primary: { label: copy.begin, icon: "icon-play" },
      footer: this.bridge.touch ? copy.soundNote : `${copy.soundNote}\n${copy.keysHint}`,
    };
  }

  private tutorialContent(): CardContent {
    const copy = this.copy;
    return {
      kicker: copy.tutorialKicker,
      title: copy.tutorialTitle,
      lead: this.L.lane.vertical ? copy.tutorialLeadDown : copy.tutorialLead,
      face: null,
      demo: "learn",
      how: copy.tapAnywhere(this.bridge.touch),
      primary: { label: copy.tutorialGo, icon: "icon-play" },
      footer: copy.soundNote,
    };
  }

  private setMode(mode: Mode) {
    this.mode = mode;
    this.count(null);
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
    if (this.mode === "paused" || this.mode === "resuming") {
      this.releaseAtPause(id);
      return;
    }
    if (this.mode === "results" || this.mode === "cut") {
      this.skip();
      return;
    }
    if (!this.carded()) return;
    const pressed = this.pressedButton;
    this.pressedButton = null;
    this.card.press(null);
    if (pressed) {
      if (this.buttonAt(pageX, pageY) === pressed) this.advance(true);
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
    if (!pauseKey && (this.mode === "results" || this.mode === "cut")) {
      this.skip();
      return;
    }
    if (!this.carded()) return;
    if (pauseKey) this.bridge.onPauseRequest();
    else this.advance(false);
  }

  private skip() {
    if (performance.now() - this.modeSince > SKIP_AFTER_MS) this.bridge.onSkip();
  }

  keyUp(code: string, timeStamp: number) {
    if (this.mode === "playing" || this.mode === "countin") this.registerUp(timeStamp, `k${code}`);
    else if (this.mode === "paused" || this.mode === "resuming") this.releaseAtPause(`k${code}`);
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
    this.player = new SongPlayer(stage, this.compiled);
    this.t0 = this.player.start(0);
    this.clock?.sample();
    this.presses = [];
    this.active.clear();
    this.verdict = null;
    this.marked.clear();
    this.markedUntil = -Infinity;
    this.platesShown.clear();
    this.displayCrowd = 70;
    this.lastSignal = "clear";
    this.pops = [];
    this.sparks = [];
    this.pressAt = -Infinity;
    this.actionAt = -Infinity;
    this.readout.setVisible(false);
    this.crowd.reset();
    this.missRun = 0;
    this.applauded = false;
    this.missAt.clear();
    this.streakShown = 0;
    this.setScore(0);
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
    this.jury.reset();
    this.stageLights.clear();
    this.stageLights.cue("chase", -4, 4);
    this.stageLights.cue("pulse", -0.25, 2.5);
    this.setKidFaces("normal");
    this.hostOverride = null;
    this.setMode("countin");
  }

  private pauseSong() {
    if (!this.player) return;
    const songMs = Math.max(0, Math.round(this.songNow()));
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
    const claimed = this.claimed(raw);
    const segment = this.segmentOf(claimed ? claimed.bar : this.barOf(raw));
    const near = claimed ?? this.nearestNote(raw);
    const freq = toneFreq(near ? this.compiled.tones[near.step] : null);
    const covered = claimed !== null && onBeat(this.compiled, claimed) && this.player.hitOnBeat(claimed);
    if (!covered) this.player.press(segment.tap, freq);
    this.pressAt = performance.now();
    this.kidHit(segment.featured);
  }

  private barOf(ms: number) {
    return Math.max(0, Math.min(this.compiled.bars - 1, barAt(this.compiled, ms)));
  }

  private segmentOf(bar: number) {
    return this.compiled.song.segments[this.compiled.segmentOfBar[bar]];
  }

  private claimed(raw: number) {
    const events = judge(this.compiled, this.judgeInput(), raw).events;
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const e = events[i];
      if (e.at === raw && e.error !== null && e.note !== null) return this.compiled.notes[e.note];
    }
    return null;
  }

  private registerUp(timeStamp: number, id: string) {
    const press = this.active.get(id);
    if (!press) return;
    this.active.delete(id);
    press.up = Math.max(press.down, Math.round(this.songNow(timeStamp)));
    if (this.active.size === 0) this.player?.lift();
  }

  private releaseAtPause(id: string) {
    const press = this.active.get(id);
    if (!press) return;
    this.active.delete(id);
    press.up = Math.max(press.down, this.resumeAt);
  }

  private judgeInput() {
    return { taps: this.presses.map((p) => p.down), ups: this.presses.map((p) => p.up), offset: 0, assist: false };
  }

  private finish() {
    const input = this.judgeInput();
    const verdict = judge(this.compiled, input);
    const log: TapLog = { kind: "talent-taps", version: 2, song: this.songId, offset: 0, assist: false, taps: input.taps, ups: input.ups };
    this.bridge.onRun({ song: this.songId, verdict, log });
    return verdict;
  }

  private endSong() {
    const verdict = this.finish();
    this.player?.stop(0.4);
    this.setMode("results");
    this.setKidFaces(verdict.stars >= 2 ? "happy" : verdict.stars === 0 ? "wow" : "normal");
    const base = Math.round((10 * Math.max(0, verdict.points)) / Math.max(1, verdict.maxPoints));
    const gap = this.bridge.reducedMotion ? 0 : PLATE_GAP_MS;
    const grades = this.jury.plates(base, 4000, gap);
    this.player?.plates(grades, gap / 1000);
    this.applaud(verdict.stars);
    if (this.songId === "medley" && verdict.stars > 0) {
      this.say(this.copy.host.champions, FINALE_TALK_MS);
      this.crowdSay(performance.now(), this.copy.encore);
      this.talkUntil = performance.now() + FINALE_TALK_MS;
    }
    const beat = this.beatPos(this.lastSongMs);
    if (verdict.stars >= 2) this.stageLights.cue("chase", beat, 8, verdict.stars >= 3 ? 4 : 2);
    if (verdict.stars >= 1) this.stageLights.cue("pulse", beat, 3);
  }

  private cut() {
    this.finish();
    this.player?.stop(0.25);
    this.player?.sting(CUT_STING, 0.16);
    this.setMode("cut");
    this.setKidFaces("wow");
    this.jury.cut();
    this.stageLights.clear();
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
        this.count(null);
        this.say(this.copy.host.go, 900);
      } else if (count >= 0 && count < 4) {
        this.count(count + 1);
        if (this.bubbleText.text !== String(count + 1)) this.say(String(count + 1), 700);
      }
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
    this.liveDot.setAlpha(this.bridge.reducedMotion || Math.floor(now / 600) % 2 === 0 ? 1 : 0.25);
    const live = this.mode === "playing" || this.mode === "countin" || this.mode === "resuming";
    const signal = live && shown >= 0 ? (this.compiled.signal[barAt(this.compiled, shown)] ?? "clear") : "clear";
    this.updateShow(shown, now, moving, signal === "lost");
    this.updateHint(shown);
    this.updateHost(now, signal, pulse * 10);
  }

  private crowdMood(live: boolean) {
    if (!live) return 0;
    const level = Math.max(0, Math.min(100, this.displayCrowd)) / 100;
    return Math.max(0, Math.min(1, (level - 0.3) / 0.6)) * 0.7 + Math.min(0.3, (this.verdict?.streak ?? 0) / 50);
  }

  private updateShow(shown: number, now: number, moving: boolean, lost: boolean) {
    const dt = Math.min(100, Math.max(0, now - this.lastFrame));
    this.lastFrame = now;
    const ended = this.mode === "results";
    const beat = ended ? this.beatPos(this.lastSongMs) + (now - this.modeSince) / beatMsAt(this.compiled, this.compiled.endMs - 1) : this.beatPos(shown);
    const onAir = moving || this.mode === "paused" || this.mode === "resuming";
    const mood = ended ? Math.max(0.5, this.crowdMood(true)) : this.crowdMood(onAir);
    const stars = this.verdict?.stars ?? 0;
    const lightMode: LightMode = this.mode === "cut" ? "cut" : ended ? (stars >= 2 ? "finale" : "rest") : onAir ? "live" : "rest";
    const crowdMode: CrowdMode = this.mode === "cut" ? "cut" : ended ? "finale" : onAir ? "live" : "rest";
    const level = this.mode === "cut" ? 0 : Math.max(0, Math.min(100, this.displayCrowd)) / 100;
    this.stageLights.update({ dt, beat, moving: moving || (ended && stars >= 2), mode: lightMode, mood, lost, featured: this.featured() });
    this.crowd.update(now, beat, crowdMode, level, mood);
    this.jury.update(now, beat, moving, mood, this.verdict?.streak ?? 0);
    const phase = ((beat % 1) + 1) % 1;
    const kick = moving && !this.bridge.reducedMotion ? Math.max(0, 1 - phase * 4) : 0;
    this.ampCone.setScale(this.ampScale * (1 + (roundOf(this.songId) === "final" ? 0.1 : 0.07) * kick));
  }

  private updateHint(shown: number) {
    if (this.hint.length === 0) return;
    const first = this.compiled.notes[0]?.at ?? 0;
    const on = (this.mode === "countin" || this.mode === "playing" || this.mode === "resuming") && shown < first - 150 && (this.verdict?.events.length ?? 0) === 0;
    if (on !== this.hint.visible) this.hint.setVisible(on);
    if (on) this.hint.setAlpha(this.bridge.reducedMotion ? 1 : 0.75 + 0.25 * Math.abs(Math.sin(performance.now() / 260)));
  }

  private updateSong(songMs: number, shown: number) {
    const copy = this.copy;
    if (this.mode === "countin") {
      const beat = beatMsAt(this.compiled, 0);
      const count = Math.floor((songMs + beat * 4) / beat);
      if (songMs >= 0) {
        this.mode = "playing";
        this.count(null);
        this.say(copy.host.go, 1200);
      } else if (count >= 0 && count < 4) {
        this.count(count + 1);
        if (this.bubbleText.text !== String(count + 1)) this.say(String(count + 1), 700);
      }
    }
    const verdict = judge(this.compiled, this.judgeInput(), shown);
    this.verdict = verdict;
    this.setScore(runScore(verdict));
    this.markNew(verdict);
    verdict.sections.forEach((s, i) => {
      if (!s.closed || this.platesShown.has(i) || s.max === 0 || this.compiled.sections[i].endMs >= this.compiled.endMs) return;
      this.platesShown.add(i);
      const base = Math.round((10 * Math.max(0, s.points)) / s.max);
      this.jury.plates(base, 1800);
      this.crowd.section(base, beatMsAt(this.compiled, shown));
      const beat = this.beatPos(shown);
      if (base >= 6) this.stageLights.cue("chase", beat, 4);
      this.stageLights.cue("pulse", beat, 2);
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
    else if (shown >= this.lastNoteEnd + APPLAUSE_MS) this.applaud(this.starsOf(verdict.precision));
  }

  private starsOf(precision: number) {
    return precision < STARS.one ? 0 : 1 + (precision >= STARS.two ? 1 : 0) + (precision >= STARS.three ? 1 : 0);
  }

  private applaud(stars: number) {
    if (this.applauded) return;
    this.applauded = true;
    this.player?.cheer(stars);
    this.crowd.finale(stars);
  }

  private markNew(verdict: Verdict) {
    const events = verdict.events;
    let i = events.length;
    while (i > 0 && events[i - 1].at >= this.markedUntil - RECHECK_MS) i -= 1;
    for (; i < events.length; i += 1) {
      const e = events[i];
      const key = `${e.mark}:${e.note}:${e.at}`;
      if (this.marked.has(key)) continue;
      this.marked.set(key, e.at);
      this.markedUntil = Math.max(this.markedUntil, e.at);
      this.onMark(e, verdict.streak);
    }
    if (this.marked.size > 48) for (const [key, at] of this.marked) if (at < this.markedUntil - RECHECK_MS * 2) this.marked.delete(key);
  }

  private updateTurns(shown: number) {
    const calls = this.compiled.calls;
    while (this.callSeen < calls.length && calls[this.callSeen].at <= shown) {
      if (shown - calls[this.callSeen].at < 200) {
        this.flash = { born: performance.now(), color: C.plum300 };
        this.showReadout(this.chipOf(calls[this.callSeen]), null);
        this.floatNote();
      }
      this.callSeen += 1;
    }
    const spans = this.listenSpans;
    while (this.listenSeen < spans.length && shown >= spans[this.listenSeen].to) {
      const span = spans[this.listenSeen];
      if (span.echo && shown - span.to < 400) this.showReadout(null, this.copy.yourTurnCue);
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

  private onMark(event: JudgeEvent, streak: number) {
    const { mark, at } = event;
    const now = performance.now();
    const note = event.note === null ? null : this.compiled.notes[event.note];
    const strength: PopStrength | null = mark === "perfect" || mark === "good" || mark === "near" || mark === "held" ? mark : null;
    const hit = strength !== null && strength !== "held";
    const quiet = mark === "miss" && now - this.actionAt < MISS_QUIET_MS;
    if (mark !== "miss") this.actionAt = now;
    if (!quiet) {
      this.showReadout(note && strength ? this.chipOf(note) : null, this.copy.marks[mark], MARK_COLOR[mark]);
      this.flash = { born: now, color: MARK_TINT[mark] };
    }
    if (mark === "miss" && note) this.missAt.set(note.index, now);
    const offBeat = mark === "miss" ? note !== null && onBeat(this.compiled, note) : mark === "noise" && onBeatSound(this.segmentOf(this.barOf(at)).tap);
    if (offBeat) this.player?.missOnBeat();
    if (note && strength) {
      const lane = this.L.lane;
      const x = hit ? lane.hitX + (this.beatPos(note.at) - this.beatPos(at)) * lane.pxPerBeat : lane.hitX;
      const color = MEMBER_COLOR[this.compiled.song.segments[this.compiled.segmentOfBar[note.bar]].featured];
      this.pops.push({ born: now, x, color, tint: MARK_TINT[mark], strength });
      if (mark === "perfect" || mark === "held") this.sparks.push({ born: now, color: MARK_TINT[mark], seed: (now % 1000) / 160, x });
      if (mark !== "near") this.floatNote();
    }
    if (mark === "noise") {
      this.shakeUntil = now + 240;
      this.jury.noise();
      this.crowd.noise();
    } else if (mark === "miss" || mark === "dropped") {
      this.missRun += 1;
      this.jury.miss(this.missRun);
      this.crowd.miss(this.missRun);
      this.kidFlash(this.featured(), "wow", 600);
      this.hostFlash("surprised", 600);
    } else if (strength) {
      this.missRun = 0;
      this.jury.hit(mark, streak);
      this.crowd.hit(mark, streak, beatMsAt(this.compiled, at));
      if ((mark === "held" || (streak > 0 && streak % 8 === 0)) && streak >= 16) this.hostFlash("excited", 700);
      if (hit && streak > 0 && streak % 20 === 0) this.stageLights.cue("chase", this.beatPos(at), 4);
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
    this.updateReadout(now);
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
          text.setColor(call ? "#b9a6ef" : "#ffc83d").setOrigin(0, 0.5);
          this.placeLabel(text, tx, tallyY);
          items.forEach((item, i) => {
            const x = tx + text.width + 8 + TALLY_GAP / 2 + i * TALLY_GAP;
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
    label = this.drawStatic(xOfBeat, beatNow, left, right, label);
    const verdict = this.verdict;
    const edgeFade = (x: number) => Math.max(0, Math.min(1, (right - x) / (r * 1.6)));
    for (const call of compiled.calls) {
      const x = xOf(call.at);
      if (x < left - r || x > right + r) continue;
      const alpha = x < hitX ? Math.max(0, 1 - (hitX - x) / 160) : edgeFade(x);
      drawCall(g, x, laneY, r, alpha);
    }
    let holding = false;
    let progress = 0;
    let near = 0;
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
      const signalAlpha = (ghost ? ghostAlpha(signal, note.index, now, this.bridge.reducedMotion, (x - hitX) / LN.pxPerBeat) : 1) * edgeFade(x);
      const color = MEMBER_COLOR[compiled.song.segments[compiled.segmentOfBar[note.bar]].featured];
      const fade = (px: number) => Math.max(0, 1 - Math.max(0, hitX - px) / 200);
      const missed = this.missAt.get(note.index);
      const fall = missed !== undefined ? (now - missed) / MISS_FALL_MS : null;
      if (grade === null && note.kind !== "echo" && signal !== "lost") near = Math.max(near, 1 - Math.abs(x - hitX) / (LN.pxPerBeat * 0.5));
      if (note.kind === "echo") {
        if (grade === null) continue;
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
          progress = Math.max(progress, (shown - note.at) / (note.end - note.at));
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
    const press = Math.max(0, 1 - (now - this.pressAt) / PRESS_MS);
    const ring = { pulse, flash: flashK, flashColor: this.flash.color, shake, holding, listen, press, near, progress };
    this.keepReadout = holding;
    const earAt = this.at(hitX + shake, laneY);
    this.ear
      .setVisible(listen)
      .setPosition(earAt.x, earAt.y)
      .setScale((r * (1.2 + 0.2 * flashK)) / 96);
    const moving = this.mode === "playing" || this.mode === "countin" || this.mode === "resuming";
    this.chase.forEach((b, i) => {
      const on = moving && !this.bridge.reducedMotion ? (Math.floor(i / 2) + beatIndex) % 4 === 0 : Math.floor(i / 2) % 4 === 0;
      if (on) base.fillStyle(C.sunPale, 1).fillCircle(b.x, b.y, 5.5);
    });
    drawRingBase(base, hitX, laneY, r, ring);
    drawRingFront(front, hitX, laneY, r, ring);
    this.popIcons.begin();
    this.pops = this.pops.filter((p) => now - p.born < POP_MS);
    for (const p of this.pops) drawPop(front, this.popIcons, p.x, laneY, r, p.color, p.tint, p.strength, (now - p.born) / POP_MS, this.bridge.reducedMotion);
    this.popIcons.end();
    this.sparks = this.sparks.filter((s) => now - s.born < SPARK_MS);
    drawSparks(front, hitX, laneY, r, this.sparks, now, SPARK_MS);
  }

  private drawMissed(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, fall: number | null, fade: number) {
    if (fall === null) {
      if (fade > 0) g.fillStyle(C.gray, 0.8 * fade).fillCircle(x, y, r * 0.8);
      return;
    }
    if (fall >= 1) return;
    const d = shade(g, 0, this.bridge.reducedMotion ? 0 : fall * fall * 120);
    const alpha = 1 - fall;
    g.fillStyle(C.gray, alpha).fillCircle(x + d.x, y + d.y, r * 0.85);
    g.lineStyle(4, C.ink, alpha).strokeCircle(x + d.x, y + d.y, r * 0.85);
    this.missIcons.place(x + d.x, y + d.y, r * 1.6, alpha);
  }

  private drawStatic(xOfBeat: (beat: number) => number, now: number, left: number, right: number, labelStart: number) {
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
            this.placeLabel(text, (x0 + x1) / 2, S.y + (this.laneY - half - S.y) / 2);
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
    this.lostTile.setVisible(anyLost).setAlpha(1);
    this.weakTile.setVisible(anyWeak).setAlpha(0.6);
    return label;
  }
}
