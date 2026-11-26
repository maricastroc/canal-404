import * as Phaser from "phaser";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { H, HEARTS, W } from "../config";
import { FULL_FRAME, type Frame } from "../layout";
import { INK, INK_HEX, cartoonText, darkPanel, fitText, paper, type Fonts } from "../../kit/ui";
import { COPY, type RecessCopy } from "../copy";

export type TouchState = { left: boolean; right: boolean; jump: boolean; attack: boolean };
type PadAction = keyof TouchState;
export type ProgressMark = { at: number; rung: boolean };
type Pad = { action: PadAction; bg: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; hit: Phaser.GameObjects.Arc; r: number; color: number; x: number; y: number; base: number };

const BAR_W = 520;
const TRACK = { w: 440, h: 52, x0: -186, len: 344, y: 26, bar: 12 };
const CARD_H = 156;
const D = 3;
const ROW = { h: 40, card: 166, count: 76, gap: 7, margin: 8, top: 7, track: 64, trackMax: 340, heart: 16, heartGap: 1.2, score: 17 };
const MON_HEAD = { x: 137 / 260, y: 64 / 256, h: 124 };
const HERO_HEAD = { x: 136, y: 12, w: 112, h: 112 };

type Compact = {
  root: Phaser.GameObjects.Container;
  card: Phaser.GameObjects.Graphics;
  hearts: Phaser.GameObjects.Image[];
  score: Phaser.GameObjects.Text;
  countBg: Phaser.GameObjects.Graphics;
  countIcon: Phaser.GameObjects.Image;
  count: Phaser.GameObjects.Text;
  trackBg: Phaser.GameObjects.Graphics;
  track: Phaser.GameObjects.Graphics;
  bells: Phaser.GameObjects.Image[];
  you: Phaser.GameObjects.Image;
  flag: Phaser.GameObjects.Image;
  bossLabel: Phaser.GameObjects.Text;
  bossBar: Phaser.GameObjects.Graphics;
  trackX: number;
  trackW: number;
  countX: number;
  bounds: Phaser.Geom.Rectangle;
};

function plate(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number) {
  const r = h * 0.3;
  g.fillStyle(INK_HEX, 1);
  g.fillRoundedRect(x + 2.4 * D, y + 3 * D, w, h, r);
  g.fillStyle(fill, fill === 0x2b2150 ? 0.96 : 1);
  g.fillRoundedRect(x, y, w, h, r);
  g.lineStyle(2.2 * D, INK_HEX, 1);
  g.strokeRoundedRect(x, y, w, h, r);
}

export class RecessHud {
  uiScale = 1;
  readonly touch: TouchState = { left: false, right: false, jump: false, attack: false };
  private card: Phaser.GameObjects.Container;
  private cardBounds = new Phaser.Geom.Rectangle(20, 10, 380, CARD_H);
  private hearts: Phaser.GameObjects.Image[] = [];
  private scoreText: Phaser.GameObjects.Text;
  private monitorText: Phaser.GameObjects.Text;
  private monitorLabel: Phaser.GameObjects.Text;
  private monitorsDone = false;
  private progress: Phaser.GameObjects.Container;
  private progressBar: Phaser.GameObjects.Graphics;
  private progressBells: Phaser.GameObjects.Image[] = [];
  private progressYou: Phaser.GameObjects.Image;
  private progressBounds = new Phaser.Geom.Rectangle(W / 2 - TRACK.w / 2, 10, TRACK.w, TRACK.h + 20);
  private bossBounds = new Phaser.Geom.Rectangle(W / 2 - 320, 10, 640, 100);
  private bossBox: Phaser.GameObjects.Container;
  private bossBar: Phaser.GameObjects.Graphics;
  private banner: Phaser.GameObjects.Text;
  private sub: Phaser.GameObjects.Text;
  private pads: Pad[] = [];
  private pointers = new Map<number, PadAction>();
  private touchOn = false;
  private jumpPulse?: Phaser.Tweens.Tween;
  private copy: RecessCopy["hud"];
  private frame: Frame = FULL_FRAME;
  private compact: Compact;
  private progressK = 0;
  private progressMarks: ProgressMark[] = [];
  private bossHp: [number, number] = [1, 1];
  private bossOn = false;
  private topOn = true;

  constructor(
    private scene: Phaser.Scene,
    fonts: Fonts,
    title: string,
    index: number,
    total: number,
    private reduced: boolean,
    private locale: Locale,
    private onPress: (action: PadAction) => void,
    bells: number,
  ) {
    this.copy = COPY[locale].hud;
    const g = scene.add.graphics();
    paper(g, 0, 0, 380, CARD_H, 20);
    const items: Phaser.GameObjects.GameObject[] = [g];
    for (let i = 0; i < HEARTS; i += 1) {
      const img = scene.add.image(36 + i * 46, 38, "icon-heart-on");
      this.hearts.push(img);
      items.push(img);
    }
    this.scoreText = cartoonText(scene, 364, 38, "0", { size: 32, color: "#ffc83d", font: fonts.display, stroke: 0.2 }).setOrigin(1, 0.5);
    items.push(this.scoreText);
    const rule = scene.add.graphics();
    rule.lineStyle(3, INK_HEX, 0.15);
    rule.lineBetween(18, 68, 362, 68);
    rule.lineBetween(18, 116, 362, 116);
    const head = scene.add.image(36, 92, "mon-common-face-watch").setOrigin(MON_HEAD.x, MON_HEAD.y).setScale(36 / MON_HEAD.h);
    const label = cartoonText(scene, 62, 92, this.copy.monitors, { size: 20, color: "#7b62c4", font: fonts.display, stroke: 0, shadow: false }).setOrigin(0, 0.5);
    this.monitorLabel = label;
    this.monitorText = cartoonText(scene, 364, 92, "0/0", { size: 26, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(1, 0.5);
    const stage = cartoonText(scene, 18, 136, `${this.copy.level(index + 1, total)} · ${title.toUpperCase()}`, { size: 18, color: "#7b62c4", font: fonts.display, stroke: 0, shadow: false }).setOrigin(0, 0.5);
    fitText(stage, 344, 18, 12);
    items.push(rule, head, label, this.monitorText, stage);
    this.card = scene.add.container(20, 10, items).setDepth(60).setScrollFactor(0, 0, true);

    const pg = scene.add.graphics();
    darkPanel(pg, -TRACK.w / 2, 0, TRACK.w, TRACK.h);
    this.progressBar = scene.add.graphics();
    const flag = scene.add.image(TRACK.x0 + TRACK.len + 26, TRACK.y, "icon-flag").setScale(0.78);
    this.progressYou = this.heroHead();
    this.progressBells = this.bellIcons(bells);
    this.progress = scene.add.container(W / 2, 12, [pg, this.progressBar, flag, ...this.progressBells, this.progressYou]).setDepth(60).setScrollFactor(0, 0, true);

    const bg = scene.add.graphics();
    darkPanel(bg, -320, 0, 640, 96);
    const bossName = cartoonText(scene, 0, 12, this.copy.boss, { size: 26, color: "#f06ba8", font: fonts.display, stroke: 0.18 }).setOrigin(0.5, 0);
    this.bossBar = scene.add.graphics();
    this.bossBox = scene.add.container(W / 2, 12, [bg, bossName, this.bossBar]).setDepth(60).setScrollFactor(0, 0, true).setVisible(false);

    this.banner = cartoonText(scene, W / 2, 360, "", { size: 92, color: "#ffc83d", font: fonts.display, stroke: 0.2, align: "center" })
      .setOrigin(0.5)
      .setDepth(70)
      .setScrollFactor(0)
      .setVisible(false);
    this.sub = cartoonText(scene, W / 2, 450, "", { size: 38, color: "#fbf5e6", font: fonts.display, stroke: 0.2, align: "center" })
      .setOrigin(0.5)
      .setDepth(70)
      .setScrollFactor(0)
      .setVisible(false);

    this.compact = this.makeCompact(fonts, bells);

    this.makePad("left", "icon-left", 80, 0xfbf5e6);
    this.makePad("right", "icon-right", 80, 0xfbf5e6);
    this.makePad("jump", "icon-jump", 84, 0xffc83d);
    this.makePad("attack", "icon-attack", 96, 0xf06ba8);
    scene.input.on("pointerup", (p: Phaser.Input.Pointer) => this.release(p));
    scene.input.on("pointerupoutside", (p: Phaser.Input.Pointer) => this.release(p));
    this.showTouch(false);
  }

  private heroHead() {
    const img = this.scene.add.image(0, 0, "hero-idle").setOrigin(0, 0).setCrop(HERO_HEAD.x, HERO_HEAD.y, HERO_HEAD.w, HERO_HEAD.h);
    img.setData("size", 0);
    return img;
  }

  private placeHead(img: Phaser.GameObjects.Image, x: number, y: number, size: number) {
    const k = size / HERO_HEAD.h;
    img.setScale(k).setPosition(x - (HERO_HEAD.x + HERO_HEAD.w / 2) * k, y - (HERO_HEAD.y + HERO_HEAD.h / 2) * k);
  }

  private bellIcons(n: number) {
    return Array.from({ length: n }, () => this.scene.add.image(0, 0, "icon-bell-off"));
  }

  private makeCompact(fonts: Fonts, bellCount: number): Compact {
    const scene = this.scene;
    const card = scene.add.graphics();
    const hearts: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < HEARTS; i += 1) hearts.push(scene.add.image(0, 0, "hud-heart-on"));
    const score = cartoonText(scene, 0, 0, "0", { size: ROW.score * D, color: "#ffc83d", font: fonts.display, stroke: 0.2 }).setOrigin(1, 0.5);
    const countBg = scene.add.graphics();
    const countIcon = scene.add.image(0, 0, "mon-common-face-watch").setOrigin(MON_HEAD.x, MON_HEAD.y);
    const count = cartoonText(scene, 0, 0, "0/0", { size: 16 * D, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5, 0.5);
    const trackBg = scene.add.graphics();
    const track = scene.add.graphics();
    const flag = scene.add.image(0, 0, "icon-flag");
    const you = this.heroHead();
    const bells = this.bellIcons(bellCount);
    const bossLabel = cartoonText(scene, 0, 0, this.copy.boss, { size: 11 * D, color: "#f06ba8", font: fonts.display, stroke: 0.18 }).setOrigin(0.5, 0.5).setVisible(false);
    const bossBar = scene.add.graphics().setVisible(false);
    const root = scene.add.container(0, 0, [card, ...hearts, score, countBg, countIcon, count, trackBg, track, flag, ...bells, you, bossLabel, bossBar]).setDepth(60).setScrollFactor(0, 0, true).setVisible(false);
    return { root, card, hearts, score, countBg, countIcon, count, trackBg, track, bells, you, flag, bossLabel, bossBar, trackX: 0, trackW: 0, countX: 0, bounds: new Phaser.Geom.Rectangle() };
  }

  private layoutCompact(f: Frame) {
    const c = this.compact;
    const u = f.unit;
    const room = (f.width - f.safe.left - f.safe.right) / u - ROW.margin * 2;
    const k = Phaser.Math.Clamp(room / 374, 0.84, f.kind === "band" ? 1.05 : 1.25);
    const avail = room / k;
    const h = ROW.h * D;
    const cardW = ROW.card * D;
    const countW = ROW.count * D;
    const gap = ROW.gap * D;
    const trackW = Math.max(ROW.track * D, Math.min(ROW.trackMax * D, avail * D - cardW - countW - gap * 2));
    c.countX = avail * D - countW;
    c.trackX = cardW + (c.countX - cardW - trackW) / 2;
    c.trackW = trackW;
    const scale = (u / D) * k;
    const x0 = f.safe.left + ROW.margin * u;
    const y0 = f.safe.top + ROW.top * u;
    c.root.setScale(scale).setPosition(x0, y0).setVisible(true);
    c.bounds.setTo(x0, y0, avail * u * k, h * scale + 8 * u);

    c.card.clear();
    plate(c.card, 0, 0, cardW, h, 0xfbf5e6);
    const hs = (ROW.heart * D) / 64;
    c.hearts.forEach((img, i) => img.setPosition(10 * D + ROW.heart * D * 0.5 + i * (ROW.heart + ROW.heartGap) * D, h / 2).setScale(hs).setData("base", hs));
    c.score.setPosition(cardW - 8 * D, h / 2);
    this.fitScore();

    c.countBg.clear();
    plate(c.countBg, c.countX, 0, countW, h, 0xfbf5e6);
    c.countIcon.setPosition(c.countX + 17 * D, h / 2 + 1 * D).setScale((24 * D) / MON_HEAD.h);
    c.count.setPosition(c.countX + countW / 2 + 12 * D, h / 2);
    fitText(c.count, countW - 38 * D, 16 * D, 8 * D);

    c.trackBg.clear();
    plate(c.trackBg, c.trackX, 0, trackW, h, 0x2b2150);
    c.flag.setPosition(c.trackX + trackW - 17 * D, h / 2).setScale((17 * D) / 40);
    c.bossLabel.setPosition(c.trackX + trackW / 2, 12 * D);
    fitText(c.bossLabel, trackW - 16 * D, 11 * D, 7 * D);
    this.drawTrack();
    this.drawCompactBoss();
    this.applyTopVisibility();
  }

  private fitScore() {
    const room = (ROW.card - 10 - HEARTS * (ROW.heart + ROW.heartGap) - 12) * D;
    fitText(this.compact.score, room, ROW.score * D, 10 * D);
  }

  private drawTrack() {
    const c = this.compact;
    const g = c.track;
    g.clear();
    if (this.frame.kind === "full") return;
    const h = ROW.h * D;
    const x0 = c.trackX + 13 * D;
    const w = Math.max(10 * D, c.trackW - 13 * D - 32 * D);
    const y = h / 2;
    const k = Phaser.Math.Clamp(this.progressK, 0, 1);
    g.fillStyle(0x140f26, 1);
    g.fillRoundedRect(x0, y - 4 * D, w, 8 * D, 4 * D);
    g.fillStyle(0x63d6c1, 1);
    g.fillRoundedRect(x0, y - 4 * D, Math.max(8 * D, w * k), 8 * D, 4 * D);
    c.bells.forEach((img, i) => {
      const m = this.progressMarks[i];
      img.setVisible(Boolean(m) && c.track.visible);
      if (!m) return;
      const key = m.rung ? "icon-bell-on" : "icon-bell-off";
      if (img.texture.key !== key) img.setTexture(key);
      img.setPosition(x0 + w * m.at, y).setScale((13 * D) / 40);
    });
    g.fillStyle(0x5cb9f0, 1);
    g.fillCircle(x0 + w * k, y, 9 * D);
    g.lineStyle(2 * D, INK_HEX, 1);
    g.strokeCircle(x0 + w * k, y, 9 * D);
    this.placeHead(c.you, x0 + w * k, y - 1 * D, 17 * D);
    c.you.setVisible(c.track.visible);
  }

  private drawCompactBoss() {
    const c = this.compact;
    const g = c.bossBar;
    g.clear();
    if (this.frame.kind === "full") return;
    const w = c.trackW - 22 * D;
    const x0 = c.trackX + 11 * D;
    const y = 22 * D;
    const [hp, max] = this.bossHp;
    const k = Phaser.Math.Clamp(hp / max, 0, 1);
    g.fillStyle(0x140f26, 1);
    g.fillRoundedRect(x0, y, w, 10 * D, 5 * D);
    if (k > 0) {
      g.fillStyle(k > 0.5 ? 0xf06ba8 : 0xef4f43, 1);
      g.fillRoundedRect(x0, y, Math.max(10 * D, w * k), 10 * D, 5 * D);
    }
    g.lineStyle(1.4 * D, 0x0d0a18, 1);
    g.strokeRoundedRect(x0, y, w, 10 * D, 5 * D);
  }

  private applyTopVisibility() {
    const compact = this.frame.kind !== "full";
    const c = this.compact;
    c.track.setVisible(compact && this.topOn && !this.bossOn);
    c.flag.setVisible(compact && this.topOn && !this.bossOn);
    c.you.setVisible(c.track.visible);
    for (const b of c.bells) b.setVisible(c.track.visible);
    c.trackBg.setVisible(compact && (this.topOn || this.bossOn));
    c.bossLabel.setVisible(compact && this.bossOn);
    c.bossBar.setVisible(compact && this.bossOn);
  }

  private makePad(action: PadAction, icon: string, r: number, color: number) {
    const bg = this.scene.add.graphics().setDepth(62).setScrollFactor(0);
    const img = this.scene.add.image(0, 0, icon).setDepth(63).setScrollFactor(0);
    const hit = this.scene.add.circle(0, 0, r + 18, 0xffffff, 0).setDepth(64).setScrollFactor(0).setInteractive({ useHandCursor: true });
    const pad: Pad = { action, bg, icon: img, hit, r, color, x: 0, y: 0, base: 1 };
    hit.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.pointers.set(p.id, action);
      this.touch[action] = true;
      this.drawPad(pad, true);
      this.onPress(action);
    });
    this.pads.push(pad);
  }

  private release(p: Phaser.Input.Pointer) {
    const action = this.pointers.get(p.id);
    if (!action) return;
    this.pointers.delete(p.id);
    this.touch[action] = [...this.pointers.values()].includes(action);
    for (const pad of this.pads) this.drawPad(pad, this.touch[pad.action]);
  }

  private drawPad(pad: Pad, down: boolean) {
    const g = pad.bg;
    const s = pad.base;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(pad.x + 5 * s, pad.y + 7 * s, pad.r * s);
    g.fillStyle(pad.color, 1);
    g.fillCircle(pad.x, pad.y + (down ? 5 * s : 0), pad.r * s);
    g.lineStyle(6 * s, INK_HEX, 1);
    g.strokeCircle(pad.x, pad.y + (down ? 5 * s : 0), pad.r * s);
    pad.icon.setPosition(pad.x, pad.y + (down ? 5 * s : 0)).setScale(s);
    pad.hit.setPosition(pad.x, pad.y).setScale(s);
  }

  showTouch(on: boolean) {
    this.touchOn = on;
    for (const pad of this.pads) {
      pad.bg.setVisible(on);
      pad.icon.setVisible(on);
      pad.hit.setVisible(on);
      if (on) pad.hit.setInteractive();
      else pad.hit.disableInteractive();
    }
  }

  pulseJump(on: boolean) {
    this.jumpPulse?.stop();
    this.jumpPulse = undefined;
    const pad = this.pads.find((p) => p.action === "jump");
    if (!pad || !this.touchOn) return;
    pad.icon.setScale(pad.base);
    if (on && !this.reduced) this.jumpPulse = this.scene.tweens.add({ targets: pad.icon, scale: pad.base * 1.25, duration: 360, yoyo: true, repeat: -1 });
  }

  layout(frame: Frame, displayScale: number) {
    this.frame = frame;
    const compact = frame.kind !== "full";
    this.card.setVisible(!compact);
    this.progress.setVisible(!compact && this.topOn && !this.bossOn);
    this.bossBox.setVisible(!compact && this.bossOn);
    this.compact.root.setVisible(compact);
    if (compact) {
      this.uiScale = 1;
      this.layoutCompact(frame);
      if (this.touchOn) this.showTouch(false);
    } else this.layoutFull(displayScale);
    if (this.banner.visible) this.banner.setScale(this.placeBanner());
  }

  get compactMode() {
    return this.frame.kind !== "full";
  }

  private placeBanner() {
    const f = this.frame;
    if (f.kind === "full") {
      const s = Math.min(this.uiScale, 1.2);
      this.banner.setPosition(W / 2, 360);
      this.sub.setScale(s).setPosition(W / 2, 360 + 92 * s);
      return s;
    }
    const u = f.unit;
    const room = f.width - f.safe.left - f.safe.right - 36 * u;
    const big = Math.min((f.kind === "tall" ? 38 : 34) * u / 92, room / Math.max(1, this.banner.width));
    const small = Math.min(15 * u / 38, room / Math.max(1, this.sub.width));
    const top = this.compact.bounds.bottom;
    const bottom = f.height - f.deck;
    const cy = top + (bottom - top) * (f.kind === "tall" ? 0.3 : 0.36);
    this.banner.setPosition(f.width / 2, cy);
    this.sub.setScale(small).setPosition(f.width / 2, cy + 40 * u);
    return big;
  }

  private layoutFull(displayScale: number) {
    this.uiScale = Phaser.Math.Clamp(displayScale * 0.55, 1, 1.75);
    const s = this.uiScale;
    const cs = Math.min(s, 1.3);
    this.card.setScale(cs);
    this.cardBounds.setTo(20, 10, 380 * cs, CARD_H * cs);
    this.progress.setScale(Math.min(s, 1.2));
    this.bossBox.setScale(Math.min(s, 1.2));
    this.progressBounds.setTo(W / 2 - (TRACK.w / 2 + 20) * Math.min(s, 1.2), 10, (TRACK.w + 40) * Math.min(s, 1.2), (TRACK.h + 30) * Math.min(s, 1.2));
    this.bossBounds.setTo(W / 2 - 320 * Math.min(s, 1.2), 10, 640 * Math.min(s, 1.2), 100 * Math.min(s, 1.2));
    this.banner.setScale(Math.min(s, 1.2));
    this.sub.setScale(Math.min(s, 1.2)).setY(360 + 92 * Math.min(s, 1.2));
    const ps = Math.min(s, 1.35);
    const place: Record<PadAction, [number, number]> = {
      left: [40 + 95 * ps, H - 40 - 95 * ps],
      right: [40 + 285 * ps, H - 40 - 95 * ps],
      attack: [W - 40 - 110 * ps, H - 40 - 110 * ps],
      jump: [W - 40 - 330 * ps, H - 40 - 90 * ps],
    };
    for (const pad of this.pads) {
      pad.base = ps;
      [pad.x, pad.y] = place[pad.action];
      this.drawPad(pad, this.touch[pad.action]);
    }
  }

  avoid(sx: number, sy: number, others: [number, number][] = [], top = sy) {
    if (this.frame.kind !== "full") {
      const b = this.compact.bounds;
      this.compact.root.setAlpha(top < b.bottom + 10 * this.frame.unit && sx > b.x - 40 && sx < b.right + 40 ? 0.35 : 1);
      return;
    }
    const near = (r: Phaser.Geom.Rectangle) => sx > r.x - 60 && sx < r.right + 60 && sy > r.y - 60 && sy < r.bottom + 160;
    this.card.setAlpha(near(this.cardBounds) ? 0.35 : 1);
    this.progress.setAlpha(near(this.progressBounds) ? 0.35 : 1);
    this.bossBox.setAlpha(near(this.bossBounds) ? 0.35 : 1);
    if (!this.touchOn) return;
    for (const pad of this.pads) {
      const reach = pad.r * pad.base + 120;
      const close = Phaser.Math.Distance.Between(sx, sy, pad.x, pad.y) < reach || others.some(([ox, oy]) => Phaser.Math.Distance.Between(ox, oy, pad.x, pad.y) < reach);
      const a = close ? 0.35 : 0.85;
      pad.bg.setAlpha(a);
      pad.icon.setAlpha(a);
    }
  }

  setHearts(n: number, changed: "lost" | "gained" | null = null) {
    this.hearts.forEach((img, i) => {
      img.setTexture(i < n ? "icon-heart-on" : "icon-heart-off");
      const target = changed === "lost" ? i === n : changed === "gained" ? i === n - 1 : false;
      if (target && !this.reduced) {
        img.setScale(1.6);
        this.scene.tweens.add({ targets: img, scale: 1, duration: 360, ease: "Back.easeOut" });
      }
    });
    this.compact.hearts.forEach((img, i) => {
      img.setTexture(i < n ? "hud-heart-on" : "hud-heart-off");
      const target = changed === "lost" ? i === n : changed === "gained" ? i === n - 1 : false;
      const base = (img.getData("base") as number | undefined) ?? 1;
      if (target && !this.reduced) {
        img.setScale(base * 1.6);
        this.scene.tweens.add({ targets: img, scale: base, duration: 360, ease: "Back.easeOut" });
      }
    });
  }

  setMonitors(kills: number, total: number, changed = false) {
    const done = total > 0 && kills >= total;
    const label = `${kills}/${total}`;
    this.monitorText.setText(label).setColor(done ? "#2fa996" : INK);
    this.monitorLabel.setText(done ? this.copy.allMonitors : this.copy.monitors).setColor(done ? "#2fa996" : "#7b62c4");
    fitText(this.monitorLabel, this.monitorText.x - this.monitorText.width - 14 - this.monitorLabel.x, 20, 12);
    const c = this.compact;
    c.count.setText(label).setColor(done ? "#2fa996" : INK);
    fitText(c.count, ROW.count * D - 38 * D, 16 * D, 8 * D);
    const first = done && !this.monitorsDone;
    this.monitorsDone = done;
    if (!changed || this.reduced) return;
    this.scene.tweens.killTweensOf([this.monitorText, c.count]);
    this.monitorText.setScale(first ? 1.5 : 1.25);
    c.count.setScale(first ? 1.5 : 1.25);
    this.scene.tweens.add({ targets: [this.monitorText, c.count], scale: 1, duration: first ? 420 : 220, ease: "Back.easeOut" });
  }

  setScore(n: number) {
    const text = formatNumber(n, this.locale);
    this.scoreText.setText(text);
    this.compact.score.setText(text);
    this.fitScore();
    if (!this.reduced) {
      const targets = [this.scoreText, this.compact.score];
      this.scene.tweens.killTweensOf(targets);
      for (const t of targets) t.setScale(1.25);
      this.scene.tweens.add({ targets, scale: 1, duration: 220, ease: "Back.easeOut" });
    }
  }

  setProgress(k: number, marks: ProgressMark[]) {
    this.progressK = k;
    this.progressMarks = marks;
    this.drawTrack();
    const g = this.progressBar;
    g.clear();
    const { x0, len, y, bar } = TRACK;
    const kk = Phaser.Math.Clamp(k, 0, 1);
    const at = x0 + len * kk;
    g.fillStyle(0x140f26, 1);
    g.fillRoundedRect(x0, y - bar / 2, len, bar, bar / 2);
    g.fillStyle(0x63d6c1, 1);
    g.fillRoundedRect(x0, y - bar / 2, Math.max(bar, len * kk), bar, bar / 2);
    this.progressBells.forEach((img, i) => {
      const m = marks[i];
      img.setVisible(Boolean(m));
      if (!m) return;
      const key = m.rung ? "icon-bell-on" : "icon-bell-off";
      if (img.texture.key !== key) img.setTexture(key);
      img.setPosition(x0 + len * m.at, y).setScale(0.58);
    });
    g.fillStyle(0x5cb9f0, 1);
    g.fillCircle(at, y, 16);
    g.lineStyle(3.5, INK_HEX, 1);
    g.strokeCircle(at, y, 16);
    this.placeHead(this.progressYou, at, y - 2, 30);
  }

  showBoss(on: boolean) {
    this.bossOn = on;
    const full = this.frame.kind === "full";
    this.bossBox.setVisible(on && full);
    this.progress.setVisible(!on && full);
    this.applyTopVisibility();
  }

  hideTop() {
    this.topOn = false;
    this.bossOn = false;
    this.bossBox.setVisible(false);
    this.progress.setVisible(false);
    this.applyTopVisibility();
  }

  setBoss(hp: number, max: number) {
    this.bossHp = [hp, max];
    this.drawCompactBoss();
    const g = this.bossBar;
    g.clear();
    g.fillStyle(0x140f26, 1);
    g.fillRoundedRect(-BAR_W / 2, 56, BAR_W, 22, 11);
    const k = Phaser.Math.Clamp(hp / max, 0, 1);
    if (k > 0) {
      g.fillStyle(k > 0.5 ? 0xf06ba8 : 0xef4f43, 1);
      g.fillRoundedRect(-BAR_W / 2, 56, Math.max(22, BAR_W * k), 22, 11);
    }
    g.lineStyle(3, 0x0d0a18, 1);
    g.strokeRoundedRect(-BAR_W / 2, 56, BAR_W, 22, 11);
  }

  flash(text: string, color = "#ffc83d", hold = 1000, sub = "") {
    const b = this.banner;
    this.scene.tweens.killTweensOf([b, this.sub]);
    b.setText(text).setColor(color).setVisible(true).setAlpha(1);
    this.sub.setText(sub).setVisible(Boolean(sub)).setAlpha(1);
    const s = this.placeBanner();
    if (this.reduced) b.setScale(s);
    else {
      b.setScale(s * 0.3);
      this.scene.tweens.add({ targets: b, scale: s, duration: 240, ease: "Back.easeOut" });
    }
    if (hold > 0) this.scene.tweens.add({ targets: [b, this.sub], alpha: 0, delay: hold, duration: 260, onComplete: () => [b, this.sub].forEach((o) => o.setVisible(false)) });
  }

  hideControls() {
    this.showTouch(false);
    this.pulseJump(false);
    for (const k of Object.keys(this.touch) as PadAction[]) this.touch[k] = false;
    this.pointers.clear();
  }
}
