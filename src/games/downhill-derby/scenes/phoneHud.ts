import * as Phaser from "phaser";
import type { Locale } from "@/i18n/locales";
import { formatNumber, ordinal } from "@/i18n/format";
import type { RaceCopy } from "../copy";
import type { Frame } from "../layout";
import { INK } from "./cart";
import type { PhoneDeck } from "./deck";
import { formatTime, type HudButton, type HudData, type LineupEntry, type Pin, type RaceHud, type ShoutOptions, type ShowMeter } from "./hud";

type Callout = { key: string; text: Phaser.GameObjects.Text; sub: Phaser.GameObjects.Text | null; life: number; max: number; priority: number; fade: number; rise: number };

type PinView = { g: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; y: number; alpha: number };

const F = 64;
const ROW = { top: 8, h: 42, gap: 6, chip: 24, margin: 8, place: 84, time: 100 };
const LEAVE = 0.08;
const CREAM = 0xfbf5e6;
const PLUM = 0x2b2150;
const PIN_COLORS: Record<Pin["kind"], number> = { jump: 0xffc83d, duck: 0x63d6c1, ramp: 0x93cf4c };
const PIN_ICONS: Record<Pin["kind"], string> = { jump: "dd-ico-jump", duck: "dd-ico-crouch", ramp: "dd-ico-ramp" };

function plate(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, u: number, alpha = 1) {
  const r = Math.min(h / 2, 12 * u);
  g.fillStyle(INK, alpha);
  g.fillRoundedRect(x + 2.4 * u, y + 3 * u, w, h, r);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, w, h, r);
  g.lineStyle(Math.max(3, 1.8 * u), INK, alpha);
  g.strokeRoundedRect(x, y, w, h, r);
}

export class PhoneHud implements RaceHud {
  private readonly owned: Phaser.GameObjects.GameObject[] = [];
  private readonly streaks: Phaser.GameObjects.Graphics;
  private readonly plates: Phaser.GameObjects.Graphics;
  private readonly dynamic: Phaser.GameObjects.Graphics;
  private readonly chips: Phaser.GameObjects.Graphics;
  private readonly head: Phaser.GameObjects.Image;
  private readonly placeText: Phaser.GameObjects.Text;
  private readonly ofText: Phaser.GameObjects.Text;
  private readonly timeLabel: Phaser.GameObjects.Text;
  private readonly timeText: Phaser.GameObjects.Text;
  private readonly markerTexts: Phaser.GameObjects.Text[] = [];
  private readonly gapText: Phaser.GameObjects.Text;
  private readonly gapLetter: Phaser.GameObjects.Text;
  private readonly showLabel: Phaser.GameObjects.Text;
  private readonly showTotal: Phaser.GameObjects.Text;
  private readonly showSeq: Phaser.GameObjects.Text;
  private readonly showTrick: Phaser.GameObjects.Text;
  private readonly splitName: Phaser.GameObjects.Text;
  private readonly splitDelta: Phaser.GameObjects.Text;
  private readonly edgeTexts: Phaser.GameObjects.Text[] = [];
  private readonly boxBg: Phaser.GameObjects.Graphics;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly tipText: Phaser.GameObjects.Text;
  private readonly countText: Phaser.GameObjects.Text;
  private readonly pins: PinView[] = [];
  private frame!: Frame;
  private u = 1;
  private placeBox = new Phaser.Geom.Rectangle();
  private timeBox = new Phaser.Geom.Rectangle();
  private trackBox = new Phaser.Geom.Rectangle();
  private chipY = 0;
  private bottom = 0;
  private lineup: Phaser.GameObjects.Container | null = null;
  private lineupEntries: LineupEntry[] | null = null;
  private lineupAlpha = 0;
  private headline: Callout | null = null;
  private leaving: Callout[] = [];
  private tags: Callout[] = [];
  private anchor = { x: 0, y: 0 };
  private tipLife = 0;
  private hintAlpha = 1;
  private touchOn = false;
  private streakSeed = 7;
  private streakList: { x: number; y: number; len: number; speed: number }[] = [];
  private shownPlace = 0;
  private placeFlash = 0;
  private placeGain = true;
  private shownWho = "";
  private shownMood = "";
  private splitLife = 0;
  private shownTotal = -1;
  private shownSeq = "";
  private seqAlpha = 0;
  private seqDrop = 0;
  private trickLife = 0;
  private totalPop = 0;
  private showOn = 0;
  private meterActive = false;
  private meterTimer = 0;
  private started = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly layer: Phaser.GameObjects.Layer,
    private readonly copy: RaceCopy,
    private readonly locale: Locale,
    private readonly fonts: { display: string; body: string },
    frame: Frame,
    private readonly deck: PhoneDeck,
  ) {
    const display = (size: number, color = "#fbf5e6", stroke = 0) => ({ fontFamily: fonts.display, fontSize: `${size}px`, color, ...(stroke ? { stroke: "#1d1830", strokeThickness: stroke } : {}) });
    const body = (size: number, color = "#1d1830") => ({ fontFamily: fonts.body, fontSize: `${size}px`, color, fontStyle: "700" });
    this.streaks = this.add(scene.add.graphics());
    this.plates = this.add(scene.add.graphics());
    this.dynamic = this.add(scene.add.graphics());
    this.chips = this.add(scene.add.graphics());
    this.head = this.add(scene.add.image(0, 0, "deco-head-normal").setOrigin(0.5, 0.62));
    this.placeText = this.add(scene.add.text(0, 0, "", display(F, "#1d1830")).setOrigin(0, 0.5));
    this.ofText = this.add(scene.add.text(0, 0, "", body(F, "#6a6385")).setOrigin(0, 0.5));
    this.timeLabel = this.add(scene.add.text(0, 0, copy.time.toUpperCase(), display(F, "#e8742a")).setOrigin(0.5, 0));
    this.timeText = this.add(scene.add.text(0, 0, "0:00,00", display(F, "#1d1830")).setOrigin(0.5, 0.5));
    for (let i = 0; i < 4; i += 1) this.markerTexts.push(this.add(scene.add.text(0, 0, "", display(F, "#1d1830")).setOrigin(0.5, 0.5)));
    this.gapLetter = this.add(scene.add.text(0, 0, "", display(F, "#1d1830")).setOrigin(0.5, 0.5));
    this.gapText = this.add(scene.add.text(0, 0, "", display(F, "#1d1830")).setOrigin(0, 0.5));
    this.showLabel = this.add(scene.add.text(0, 0, copy.show.label.toUpperCase(), display(F, "#ffcf3f")).setOrigin(0, 0.5));
    this.showTotal = this.add(scene.add.text(0, 0, "0", display(F)).setOrigin(1, 0.5));
    this.showSeq = this.add(scene.add.text(0, 0, "", display(F, "#7fe0c4", 16)).setOrigin(1, 0).setAlpha(0));
    this.showTrick = this.add(scene.add.text(0, 0, "", display(F, "#fbf5e6", 16)).setOrigin(1, 0).setAlpha(0));
    this.splitName = this.add(scene.add.text(0, 0, "", body(F, "#cfc8e8")).setOrigin(1, 0.5).setAlpha(0));
    this.splitDelta = this.add(scene.add.text(0, 0, "", display(F)).setOrigin(0, 0.5).setAlpha(0));
    for (let i = 0; i < 3; i += 1) this.edgeTexts.push(this.add(scene.add.text(0, 0, "", display(F, "#1d1830")).setOrigin(0.5, 0.5).setVisible(false)));
    for (let i = 0; i < 2; i += 1) this.pins.push({ g: this.add(scene.add.graphics()), icon: this.add(scene.add.image(0, 0, "dd-ico-jump").setVisible(false)), y: 0, alpha: 0 });
    this.boxBg = this.add(scene.add.graphics());
    this.hintText = this.add(scene.add.text(0, 0, "", { ...body(F), align: "center" }).setOrigin(0.5, 0.5));
    this.tipText = this.add(scene.add.text(0, 0, "", { ...body(F), align: "center" }).setOrigin(0.5, 0.5).setAlpha(0));
    this.countText = this.add(scene.add.text(0, 0, "", display(170, "#ffcf3f", 20)).setOrigin(0.5));
    this.countText.setVisible(false);
    this.layout(frame);
  }

  private add<T extends Phaser.GameObjects.GameObject>(obj: T) {
    this.layer.add(obj);
    this.owned.push(obj);
    return obj;
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.countText);
    this.lineup?.destroy();
    this.lineup = null;
    for (const c of [this.headline, ...this.leaving, ...this.tags]) if (c) this.drop(c);
    this.headline = null;
    this.leaving = [];
    this.tags = [];
    for (const obj of this.owned) obj.destroy();
    this.owned.length = 0;
  }

  get hudBottom() {
    return this.bottom;
  }

  layout(frame: Frame) {
    this.frame = frame;
    const u = frame.unit;
    this.u = u;
    const left = frame.safe.left + ROW.margin * u;
    const right = frame.width - frame.safe.right - ROW.margin * u;
    const room = (right - left) / u;
    const k = Phaser.Math.Clamp(room / 374, 0.86, 1.12);
    const top = frame.safe.top + ROW.top * u;
    const h = ROW.h * u * k;
    const placeW = ROW.place * u * k;
    const timeW = ROW.time * u * k;
    const gap = ROW.gap * u;
    this.placeBox.setTo(left, top, placeW, h);
    this.timeBox.setTo(right - timeW, top, timeW, h);
    this.trackBox.setTo(left + placeW + gap, top, right - timeW - gap - (left + placeW + gap), h);
    this.chipY = top + h + gap;
    this.bottom = this.chipY + ROW.chip * u * k + gap;
    const s = (size: number) => (size * u * k) / F;
    this.head.setScale((34 * u * k) / 190).setPosition(left + 21 * u * k, top + h / 2 + 3 * u * k);
    this.placeText.setScale(s(25)).setData("base", s(25)).setPosition(left + 40 * u * k, top + h / 2 + 2 * u * k);
    this.ofText.setScale(s(11));
    this.timeLabel.setScale(s(9.5)).setPosition(this.timeBox.centerX, top + 4 * u * k);
    this.timeText.setScale(s(19)).setPosition(this.timeBox.centerX, top + h * 0.62);
    for (const t of this.markerTexts) t.setScale(s(9));
    this.gapLetter.setScale(s(10));
    this.gapText.setScale(s(12.5));
    this.showLabel.setScale(s(10));
    this.showTotal.setScale(s(13.5));
    this.showSeq.setScale(s(13));
    this.showTrick.setScale(s(13.5));
    this.splitName.setScale(s(11));
    this.splitDelta.setScale(s(14));
    for (const t of this.edgeTexts) t.setScale(s(11));
    const wrap = (frame.view.w - 52 * u) / s(13);
    this.hintText.setScale(s(13)).setWordWrapWidth(wrap);
    this.tipText.setScale(s(13)).setWordWrapWidth(wrap);
    this.countText.setScale(s(84) / (170 / F)).setData("base", s(84) / (170 / F));
    this.drawPlates();
    if (this.lineupEntries) this.showLineup(this.lineupEntries, this.lineupAlpha);
  }

  private drawPlates() {
    const g = this.plates;
    const u = this.u;
    g.clear();
    plate(g, this.placeBox.x, this.placeBox.y, this.placeBox.width, this.placeBox.height, CREAM, u);
    plate(g, this.timeBox.x, this.timeBox.y, this.timeBox.width, this.timeBox.height, CREAM, u);
    plate(g, this.trackBox.x, this.trackBox.y, this.trackBox.width, this.trackBox.height, PLUM, u);
  }

  setTouch(touch: boolean) {
    this.touchOn = touch;
    this.hintText.setText(touch ? this.copy.hintTouch : this.copy.hint);
    this.hintAlpha = 1;
  }

  resetHint() {
    this.hintAlpha = 1;
  }

  setPressed() {}

  hitTest(): HudButton | null {
    return null;
  }

  flashSpeed(delta: number) {
    const kmh = Math.round(delta * 0.036);
    if (kmh === 0) return;
    this.deck.flash(`${kmh > 0 ? "+" : "−"}${formatNumber(Math.abs(kmh), this.locale)} ${this.copy.kmh}`, kmh > 0);
  }

  update(dt: number, data: HudData) {
    const u = this.u;
    const f = this.frame;
    this.started = data.started ?? true;
    this.timeText.setText(formatTime(data.time, this.locale));
    this.deck.setSpeed(dt, data.speed, data.tier, data.trend);
    const g = this.dynamic;
    g.clear();
    const mine = data.rows.findIndex((r) => r.you);
    const place = mine + 1;
    const you = data.rows[mine];
    if (place !== this.shownPlace) {
      if (this.shownPlace > 0 && this.started) {
        this.placeFlash = 1;
        this.placeGain = place < this.shownPlace;
      }
      this.shownPlace = place;
      this.placeText.setText(ordinal(place, this.locale));
      this.ofText.setText(`/${data.rows.length}`);
    }
    this.placeFlash = Math.max(0, this.placeFlash - dt * 1.6);
    const pop = this.placeFlash > 0.75 ? 1 + (this.placeFlash - 0.75) * 1.2 : 1;
    const base = this.placeText.getData("base") as number | undefined;
    const ps = base ?? this.placeText.scaleX;
    if (base === undefined) this.placeText.setData("base", ps);
    this.placeText.setScale(ps * pop);
    this.ofText.setPosition(this.placeText.x + this.placeText.width * ps + 3 * u, this.placeBox.centerY + 4 * u).setVisible(this.placeText.x + this.placeText.width * ps + this.ofText.width * this.ofText.scaleX + 6 * u < this.placeBox.right);
    if (this.placeFlash > 0) {
      g.fillStyle(this.placeGain ? 0x7fe0c4 : 0xff9a72, 0.55 * this.placeFlash);
      g.fillRoundedRect(this.placeBox.x, this.placeBox.y, this.placeBox.width, this.placeBox.height, Math.min(this.placeBox.height / 2, 12 * u));
    }
    if (you) {
      const mood = this.placeFlash > 0 ? (this.placeGain ? "smug" : "wow") : place === 1 ? "happy" : "normal";
      if (you.who !== this.shownWho || mood !== this.shownMood) {
        this.shownWho = you.who;
        this.shownMood = mood;
        this.head.setTexture(`${you.who}-head-${mood}`);
      }
    }
    this.drawTrack(data);
    this.drawGapChip(data, mine);
    this.drawEdges(data);
    this.drawPins(dt, data.pins ?? []);
    this.updateBox(dt, data.showHint);
    this.anchor = { x: Phaser.Math.Clamp(data.anchor.x, 70 * u, f.view.w - 70 * u), y: Phaser.Math.Clamp(data.anchor.y, this.bottom + 40 * u, f.view.h - 40 * u) };
    this.splitLife = Math.max(0, this.splitLife - dt);
    this.drawStreaks(dt, data.speed, data.reduced);
    this.updateCallouts(dt);
  }

  private drawTrack(data: HudData) {
    const g = this.dynamic;
    const u = this.u;
    const box = this.trackBox;
    const pad = 14 * u;
    const flagW = 14 * u;
    const x0 = box.x + pad;
    const x1 = box.right - pad - flagW - 4 * u;
    const y = box.centerY;
    g.fillStyle(0x140f26, 1);
    g.fillRoundedRect(x0 - 4 * u, y - 3.5 * u, x1 - x0 + 8 * u, 7 * u, 3.5 * u);
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        g.fillStyle((i + j) % 2 === 0 ? 0xffffff : INK, 1);
        g.fillRect(box.right - pad - flagW + i * (flagW / 3), y - flagW / 3 + j * (flagW / 3), flagW / 3, flagW / 3);
      }
    }
    const span = data.finishX - data.startX;
    const order = [...data.markers].sort((a, b) => (a.ghost ? 0 : a.you ? 2 : 1) - (b.ghost ? 0 : b.you ? 2 : 1));
    for (const t of this.markerTexts) t.setVisible(false);
    let ti = 0;
    const youMarker = data.markers.find((m) => m.you);
    if (youMarker) {
      const k = Phaser.Math.Clamp((youMarker.x - data.startX) / span, 0, 1);
      g.fillStyle(0xff7a1a, 0.55);
      g.fillRoundedRect(x0 - 4 * u, y - 3.5 * u, Math.max(7 * u, (x1 - x0) * k + 4 * u), 7 * u, 3.5 * u);
    }
    for (const m of order) {
      const k = Phaser.Math.Clamp((m.x - data.startX) / span, 0, 1);
      const mx = x0 + (x1 - x0) * k;
      const r = (m.ghost ? 4.5 : m.you ? 9 : 7.5) * u;
      g.fillStyle(INK, m.ghost ? 0.5 : 1);
      g.fillCircle(mx, y, r + 2 * u);
      g.fillStyle(m.color, m.ghost ? 0.6 : 1);
      g.fillCircle(mx, y, r);
      if (m.you) {
        g.lineStyle(2 * u, CREAM, 1);
        g.strokeCircle(mx, y, r);
      }
      if (!m.ghost && m.letter && ti < this.markerTexts.length) {
        const t = this.markerTexts[ti];
        ti += 1;
        t.setVisible(true).setText(m.letter).setPosition(mx, y + 0.5 * u);
      }
    }
  }

  private drawGapChip(data: HudData, mine: number) {
    const g = this.chips;
    const u = this.u;
    g.clear();
    const show = this.started && mine >= 0 && data.rows.length > 1;
    const other = !show ? null : mine > 0 ? data.rows[mine - 1] : data.rows[1];
    this.gapText.setVisible(!!other && !!other.gap);
    this.gapLetter.setVisible(!!other && !!other.gap);
    if (other && other.gap) {
      const ahead = mine > 0;
      this.gapText.setText(`${other.name.toUpperCase()} ${other.gap}`).setColor(ahead ? "#1d1830" : "#1d6b4f");
      const h = ROW.chip * u * (this.placeBox.height / (ROW.h * u));
      const x = this.placeBox.x;
      const y = this.chipY;
      const dot = h * 0.38;
      const w = Math.min(this.trackBox.right - x, dot * 2 + 12 * u + this.gapText.width * this.gapText.scaleX + 10 * u);
      plate(g, x, y, w, h, ahead ? 0xffe1cc : 0xd5f5ea, u);
      g.fillStyle(INK, 1);
      g.fillCircle(x + 6 * u + dot, y + h / 2, dot + 1.5 * u);
      g.fillStyle(other.color, 1);
      g.fillCircle(x + 6 * u + dot, y + h / 2, dot);
      this.gapLetter.setText(other.name.charAt(0).toUpperCase()).setPosition(x + 6 * u + dot, y + h / 2 + 0.5 * u);
      this.gapText.setPosition(x + 6 * u + dot * 2 + 6 * u, y + h / 2 + 1 * u);
    }
    if (this.splitLife > 0) {
      const a = Math.min(1, this.splitLife * 2.5);
      const h = ROW.chip * u * 0.9;
      const w = this.splitName.width * this.splitName.scaleX + this.splitDelta.width * this.splitDelta.scaleX + 26 * u;
      const cx = this.trackBox.centerX + (show ? 18 * u : 0);
      const x = Phaser.Math.Clamp(cx - w / 2, this.trackBox.x, this.timeBox.right - w);
      const y = this.chipY + 1 * u;
      g.fillStyle(INK, 0.88 * a);
      g.fillRoundedRect(x, y, w, h, h / 2);
      this.splitName.setPosition(x + 10 * u + this.splitName.width * this.splitName.scaleX, y + h / 2).setAlpha(a);
      this.splitDelta.setPosition(x + 16 * u + this.splitName.width * this.splitName.scaleX, y + h / 2 + 1 * u).setAlpha(a);
    } else {
      this.splitName.setAlpha(0);
      this.splitDelta.setAlpha(0);
    }
    this.drawShow(g);
  }

  private drawShow(g: Phaser.GameObjects.Graphics) {
    const u = this.u;
    const on = this.shownTotal > 0 || this.meterActive;
    this.showOn += ((on ? 1 : 0) - this.showOn) * 0.2;
    const a = this.showOn;
    this.showLabel.setAlpha(a);
    this.showTotal.setAlpha(a);
    if (a < 0.02) return;
    const h = ROW.chip * u * (this.placeBox.height / (ROW.h * u));
    const w = Math.max(this.timeBox.width, this.showLabel.width * this.showLabel.scaleX + this.showTotal.width * this.showTotal.scaleX + 22 * u);
    const x = this.timeBox.right - w;
    const y = this.chipY;
    plate(g, x, y, w, h, PLUM, u, a);
    this.showLabel.setPosition(x + 8 * u, y + h / 2 + 1 * u);
    this.showTotal.setPosition(x + w - 8 * u, y + h / 2 + 1 * u);
    if (this.seqAlpha > 0.02 && this.meterActive) {
      const bw = w - 16 * u;
      g.fillStyle(0x3a3358, this.seqAlpha);
      g.fillRoundedRect(x + 8 * u, y + h - 6 * u, bw, 3 * u, 1.5 * u);
      g.fillStyle(this.meterTimer > 0.3 ? 0x7fe0c4 : 0xffcf3f, this.seqAlpha);
      g.fillRoundedRect(x + 8 * u, y + h - 6 * u, Math.max(3 * u, bw * Math.min(1, this.meterTimer)), 3 * u, 1.5 * u);
    }
    this.showSeq.setPosition(this.timeBox.right - 2 * u + (this.seqDrop > 0 ? Math.sin(this.seqDrop * 60) * 3 * u : 0), y + h + 3 * u);
    this.showTrick.setPosition(this.timeBox.right - 2 * u, y + h + 3 * u);
  }

  private drawEdges(data: HudData) {
    const g = this.chips;
    const u = this.u;
    const f = this.frame;
    for (let i = 0; i < this.edgeTexts.length; i += 1) {
      const e = data.edges[i];
      const t = this.edgeTexts[i];
      t.setVisible(!!e);
      if (!e) continue;
      t.setText(e.text);
      const w = t.width * t.scaleX + 26 * u;
      const h = 22 * u;
      const x = e.side === "right" ? f.view.w - 6 * u - w / 2 : 6 * u + w / 2;
      t.setPosition(x + (e.side === "right" ? -4 * u : 4 * u), e.y + 0.5 * u);
      g.fillStyle(INK, 0.9);
      g.fillRoundedRect(x - w / 2 - 2 * u, e.y - h / 2 - 2 * u, w + 4 * u, h + 4 * u, h / 2 + 2 * u);
      g.fillStyle(e.color, 1);
      g.fillRoundedRect(x - w / 2, e.y - h / 2, w, h, h / 2);
      g.fillStyle(INK, 1);
      const s = 5 * u;
      if (e.side === "right") g.fillTriangle(x + w / 2 - 12 * u, e.y - s, x + w / 2 - 12 * u, e.y + s, x + w / 2 - 5 * u, e.y);
      else g.fillTriangle(x - w / 2 + 12 * u, e.y - s, x - w / 2 + 12 * u, e.y + s, x - w / 2 + 5 * u, e.y);
    }
  }

  private drawPins(dt: number, pins: Pin[]) {
    const u = this.u;
    const f = this.frame;
    this.pins.forEach((view, i) => {
      const pin = pins[i];
      view.alpha += ((pin ? 1 : 0) - view.alpha) * Math.min(1, dt * 10);
      const g = view.g;
      g.clear();
      if (!pin && view.alpha < 0.02) {
        view.icon.setVisible(false);
        return;
      }
      if (pin) view.y = view.alpha < 0.05 ? pin.y : view.y + (pin.y - view.y) * Math.min(1, dt * 14);
      const r = 15 * u;
      const slide = (1 - Math.min(1, view.alpha * 1.4)) * 30 * u;
      const x = f.view.w - 8 * u - r + slide;
      const y = Phaser.Math.Clamp(view.y, this.bottom + r + 4 * u, f.view.h - r - 8 * u);
      const kind = pin?.kind ?? "jump";
      const color = PIN_COLORS[kind];
      const near = pin?.near ?? 1;
      const a = view.alpha;
      g.fillStyle(INK, 0.9 * a);
      g.fillTriangle(x + r + 7 * u, y, x + r * 0.35, y - r * 0.82, x + r * 0.35, y + r * 0.82);
      g.fillCircle(x, y, r + 3 * u);
      g.fillStyle(color, a);
      g.fillCircle(x, y, r);
      g.lineStyle(3 * u, CREAM, a);
      g.beginPath();
      g.arc(x, y, r + 6.5 * u, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, near), false);
      g.strokePath();
      view.icon.setVisible(true).setTexture(PIN_ICONS[kind]).setAlpha(a).setScale((r * 1.15) / 128).setPosition(x, y);
    });
  }

  private updateBox(dt: number, showHint: boolean) {
    const u = this.u;
    const f = this.frame;
    if (!showHint && this.hintAlpha > 0) this.hintAlpha = Math.max(0, this.hintAlpha - dt * 0.8);
    this.tipLife = Math.max(0, this.tipLife - dt);
    const tipAlpha = Math.min(1, this.tipLife * 2.5);
    const hintAlpha = tipAlpha > 0 || this.lineup ? 0 : this.hintAlpha;
    this.hintText.setAlpha(hintAlpha);
    this.tipText.setAlpha(tipAlpha);
    const box = tipAlpha > 0 ? this.tipText : this.hintText;
    const alpha = Math.max(tipAlpha, hintAlpha);
    const bg = this.boxBg;
    bg.clear();
    if (alpha <= 0.01) return;
    const w = Math.min(f.view.w - 20 * u, box.width * box.scaleX + 28 * u);
    const h = box.height * box.scaleY + 14 * u;
    const y = f.view.h - 10 * u - h;
    box.setPosition(f.view.w / 2, y + h / 2);
    bg.fillStyle(CREAM, 0.94 * alpha);
    bg.fillRoundedRect(f.view.w / 2 - w / 2, y, w, h, Math.min(h / 2, 14 * u));
    bg.lineStyle(Math.max(2, 1.6 * u), INK, alpha);
    bg.strokeRoundedRect(f.view.w / 2 - w / 2, y, w, h, Math.min(h / 2, 14 * u));
  }

  showMeter(dt: number, m: ShowMeter) {
    const total = Math.round(m.total);
    if (total !== this.shownTotal) {
      if (this.shownTotal >= 0 && total > this.shownTotal) this.totalPop = 1;
      this.shownTotal = total;
      this.showTotal.setText(formatNumber(total, this.locale));
    }
    this.meterActive = m.active;
    this.meterTimer = m.timer;
    this.totalPop = Math.max(0, this.totalPop - dt * 2.4);
    const base = (13.5 * this.u * (this.placeBox.height / (ROW.h * this.u))) / F;
    this.showTotal.setScale(base * (1 + this.totalPop * 0.3)).setColor(this.totalPop > 0.05 ? "#ffcf3f" : "#fbf5e6");
    const seqText = m.active ? `+${formatNumber(Math.round(m.seq), this.locale)} ×${m.mult}` : this.shownSeq;
    if (m.active && seqText !== this.shownSeq) {
      this.shownSeq = seqText;
      this.showSeq.setText(seqText).setColor("#7fe0c4");
      this.seqDrop = 0;
    }
    this.seqAlpha += ((m.active ? 1 : 0) - this.seqAlpha) * Math.min(1, dt * (m.active ? 14 : 4));
    this.seqDrop = Math.max(0, this.seqDrop - dt);
    this.trickLife = Math.max(0, this.trickLife - dt);
    const trick = Math.min(1, this.trickLife * 3);
    this.showTrick.setAlpha(trick);
    this.showSeq.setAlpha(this.seqAlpha * (1 - trick));
  }

  split(name: string, value: string, color: string) {
    this.splitName.setText(name.toUpperCase());
    this.splitDelta.setText(value).setColor(color);
    this.splitLife = 3;
  }

  showTrickText(text: string, color = "#fbf5e6") {
    this.showTrick.setText(text).setColor(color);
    this.trickLife = 1.1;
  }

  showBank(points: number, label: string) {
    this.showTrickText(`${label} +${formatNumber(points, this.locale)}`, "#ffcf3f");
  }

  showDrop(text: string) {
    this.showSeq.setColor("#ff7a4a");
    this.seqDrop = 0.5;
    this.showTrickText(text, "#ff9a72");
  }

  private headlineY() {
    return this.bottom + (this.frame.view.h - this.bottom) * 0.2;
  }

  private updateCallouts(dt: number) {
    const u = this.u;
    const h = this.headline;
    if (h) {
      h.life -= dt;
      const k = 1 - h.life / h.max;
      const pop = k < 0.08 ? 0.55 + (k / 0.08) * 0.62 : k < 0.16 ? 1.17 - ((k - 0.08) / 0.08) * 0.17 : 1;
      const alpha = Math.min(1, h.life / 0.22);
      const base = h.text.getData("base") as number;
      h.text.setScale(base * pop).setAlpha(alpha);
      h.sub?.setAlpha(alpha);
      if (h.life <= 0) {
        this.drop(h);
        this.headline = null;
      }
    }
    for (let i = this.leaving.length - 1; i >= 0; i -= 1) {
      const l = this.leaving[i];
      l.fade -= dt;
      const k = Math.max(0, l.fade / LEAVE);
      const base = l.text.getData("base") as number;
      l.text.setAlpha(k * k).setScale(base * (0.6 + 0.4 * k));
      l.text.y -= 80 * u * dt;
      if (l.sub) {
        l.sub.setAlpha(k);
        l.sub.y -= 80 * u * dt;
      }
      if (l.fade <= 0) {
        this.drop(l);
        this.leaving.splice(i, 1);
      }
    }
    for (let i = this.tags.length - 1; i >= 0; i -= 1) {
      const t = this.tags[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.drop(t);
        this.tags.splice(i, 1);
        continue;
      }
      t.rise += dt * 20 * u;
      const k = 1 - t.life / t.max;
      const base = t.text.getData("base") as number;
      t.text.setScale(base * (k < 0.1 ? 0.6 + k * 4 : 1)).setAlpha(Math.min(1, t.life / 0.25));
      t.text.setPosition(this.anchor.x, this.anchor.y - i * 20 * u - t.rise);
    }
  }

  private drop(c: Callout) {
    c.text.destroy();
    c.sub?.destroy();
  }

  shout(key: string, text: string, opts: ShoutOptions) {
    const cur = this.headline;
    if (cur && cur.key === key) {
      cur.text.setText(text);
      cur.sub?.setText(opts.sub ?? "");
      cur.life = cur.max;
      cur.priority = Math.max(cur.priority, opts.priority);
      this.fitHeadline(cur.text, opts.size ?? 60);
      return;
    }
    if (cur && opts.priority < cur.priority && cur.life > cur.max * 0.3) {
      this.tag(key, text, opts.color);
      return;
    }
    if (cur) {
      cur.fade = LEAVE;
      this.leaving.push(cur);
    }
    const size = opts.size ?? 60;
    const u = this.u;
    const f = this.frame;
    const y = this.headlineY();
    const text0 = this.scene.add.text(f.view.w / 2, y, text, { fontFamily: this.fonts.display, fontSize: "60px", color: opts.color, stroke: "#1d1830", strokeThickness: 12, align: "center" }).setOrigin(0.5, 0.5);
    this.layer.add(text0);
    this.fitHeadline(text0, size);
    let sub: Phaser.GameObjects.Text | null = null;
    if (opts.sub) {
      sub = this.scene.add.text(f.view.w / 2, y + (size * 0.5 * u) * 0.55 + 12 * u, opts.sub, { fontFamily: this.fonts.body, fontSize: `${F}px`, color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 16, fontStyle: "700", align: "center", wordWrap: { width: (f.view.w - 40 * u) / ((14 * u) / F) } }).setOrigin(0.5, 0);
      sub.setScale((14 * u) / F);
      this.layer.add(sub);
    }
    const life = opts.life ?? 1.15;
    this.headline = { key, text: text0, sub, life, max: life, priority: opts.priority, fade: 0, rise: 0 };
  }

  private fitHeadline(text: Phaser.GameObjects.Text, size: number) {
    const u = this.u;
    const want = (size * 0.5 * u) / 60;
    const room = this.frame.view.w - 28 * u;
    const base = Math.min(want, room / Math.max(1, text.width));
    text.setData("base", base).setScale(base);
  }

  tag(key: string, text: string, color: string) {
    const same = this.tags.find((q) => q.key === key);
    if (same) {
      same.text.setText(text);
      same.life = same.max;
      same.rise = 0;
      return;
    }
    const u = this.u;
    const t = this.scene.add.text(this.anchor.x, this.anchor.y, text, { fontFamily: this.fonts.display, fontSize: `${F}px`, color, stroke: "#1d1830", strokeThickness: 15 }).setOrigin(0.5, 1);
    const base = Math.min((16 * u) / F, (this.frame.view.w - 24 * u) / Math.max(1, t.width));
    t.setData("base", base).setScale(base);
    this.layer.add(t);
    this.tags.unshift({ key, text: t, sub: null, life: 0.95, max: 0.95, priority: 0, fade: 0, rise: 0 });
    while (this.tags.length > 2) {
      const last = this.tags.pop();
      if (last) this.drop(last);
    }
  }

  tip(text: string, life = 2.8) {
    this.tipText.setText(text);
    this.tipLife = life;
  }

  private drawStreaks(dt: number, speed: number, reduced: boolean) {
    const g = this.streaks;
    const u = this.u;
    const f = this.frame;
    g.clear();
    const amount = speed < 1100 ? 0 : Math.min(1, (speed - 1100) / 1300);
    const want = reduced ? Math.round(amount * 3) : Math.round(amount * 9);
    const top = this.bottom + 10 * u;
    const band = Math.max(40 * u, f.view.h * 0.72 - top);
    const rnd = () => {
      this.streakSeed = (this.streakSeed * 1664525 + 1013904223) >>> 0;
      return this.streakSeed / 4294967296;
    };
    while (this.streakList.length < want) {
      const r1 = rnd();
      const r2 = rnd();
      this.streakList.push({ x: f.view.w + r1 * 200 * u, y: top + r2 * band, len: (50 + r1 * 110) * u, speed: (1000 + r2 * 800) * u });
    }
    if (this.streakList.length > want) this.streakList.length = want;
    for (const s of this.streakList) {
      s.x -= s.speed * dt * (0.6 + amount);
      if (s.x + s.len < 0) {
        s.x = f.view.w + rnd() * 120 * u;
        s.y = top + rnd() * band;
      }
      g.lineStyle(1.4 * u, 0xffffff, 0.1 + amount * 0.18);
      g.beginPath();
      g.moveTo(s.x, s.y);
      g.lineTo(s.x + s.len, s.y);
      g.strokePath();
    }
  }

  countdown(text: string | null) {
    this.countText.setVisible(text !== null);
    if (!text) return;
    const base = this.countText.getData("base") as number;
    this.countText.setText(text).setPosition(this.frame.view.w / 2, this.bottom + (this.frame.view.h - this.bottom) * 0.26);
    const fit = Math.min(base, (this.frame.view.w - 30 * this.u) / Math.max(1, this.countText.width));
    this.countText.setScale(fit * 1.25);
    this.scene.tweens.killTweensOf(this.countText);
    this.scene.tweens.add({ targets: this.countText, scale: fit, duration: 220, ease: "Back.out" });
  }

  showLineup(entries: LineupEntry[], alpha = 1) {
    this.lineup?.destroy();
    this.lineupEntries = entries;
    const s = this.scene;
    const u = this.u;
    const f = this.frame;
    const c = s.add.container(0, 0);
    const gap = 6 * u;
    const cols = 2;
    const cw = (f.view.w - 16 * u - gap) / cols;
    const ch = 46 * u;
    const y0 = f.view.h - 10 * u - ch * 2 - gap;
    entries.forEach((e, i) => {
      const x = 8 * u + (i % cols) * (cw + gap);
      const y = y0 + Math.floor(i / cols) * (ch + gap);
      const g = s.add.graphics();
      g.fillStyle(INK, 0.92);
      g.fillRoundedRect(x, y, cw, ch, 12 * u);
      g.fillStyle(e.color, 1);
      g.fillRoundedRect(x + 5 * u, y + 5 * u, ch - 10 * u, ch - 10 * u, 9 * u);
      c.add(g);
      c.add(s.add.image(x + ch / 2, y + ch / 2 + 6 * u, `${e.who}-head-${i === 0 ? "strain" : e.who === "lina" ? "smug" : "normal"}`).setScale((34 * u) / 190).setOrigin(0.5, 0.62));
      const name = s.add.text(x + ch + 2 * u, y + 7 * u, e.name.toUpperCase(), { fontFamily: this.fonts.display, fontSize: `${F}px`, color: "#fbf5e6" });
      name.setScale(Math.min((13 * u) / F, (cw - ch - 8 * u) / Math.max(1, name.width)));
      const cart = s.add.text(x + ch + 2 * u, y + 25 * u, e.cart, { fontFamily: this.fonts.body, fontSize: `${F}px`, color: "#cfc8e8", fontStyle: "700" });
      cart.setScale(Math.min((11 * u) / F, (cw - ch - 8 * u) / Math.max(1, cart.width)));
      c.add([name, cart]);
    });
    this.layer.add(c);
    this.lineup = c;
    this.lineupAlpha = alpha;
    c.setAlpha(alpha);
  }

  fadeLineup(dt: number) {
    if (!this.lineup) return;
    this.lineupAlpha = Math.max(0, this.lineupAlpha - dt * 2);
    this.lineup.setAlpha(this.lineupAlpha);
    if (this.lineupAlpha <= 0) {
      this.lineup.destroy();
      this.lineup = null;
      this.lineupEntries = null;
    }
  }

  clearPopups() {
    if (this.headline) this.drop(this.headline);
    this.headline = null;
    for (const c of [...this.leaving, ...this.tags]) this.drop(c);
    this.leaving = [];
    this.tags = [];
    this.tipLife = 0;
    this.splitLife = 0;
    this.splitName.setAlpha(0);
    this.splitDelta.setAlpha(0);
    this.trickLife = 0;
    this.showTrick.setAlpha(0);
    this.shownSeq = "";
    this.seqAlpha = 0;
    this.showSeq.setAlpha(0);
    this.shownPlace = 0;
    this.placeFlash = 0;
  }
}
