import * as Phaser from "phaser";
import type { Locale } from "@/i18n/locales";
import { formatNumber, ordinal } from "@/i18n/format";
import type { RaceCopy } from "../copy";
import type { Frame } from "../layout";
import { INK } from "./cart";
import type { PhoneDeck } from "./deck";
import { formatTime, type HudButton, type HudData, type LineupEntry, type Pin, type RaceHud, type ShoutOptions, type ShowMeter, type StandingRow } from "./hud";
import { keyArrows } from "../../kit/keyArrows";

type Callout = { key: string; text: Phaser.GameObjects.Text; sub: Phaser.GameObjects.Text | null; life: number; max: number; priority: number; fade: number; rise: number };

type PinView = { g: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; y: number; alpha: number };

type Badge = { letter: Phaser.GameObjects.Text; gap: Phaser.GameObjects.Text };

const F = 64;
const ROW = { top: 8, h: 42, gap: 6, sub: 21, margin: 8, place: 84, time: 100 };
const DOCK = { margin: 8, pad: 8, text: 13.5, gap: 8 };
const LEAVE = 0.08;
const HINT_STEP = 3.6;
const SPLIT_MIN = 7;
const TAG_LIFE = 0.85;
const CREAM = 0xfbf5e6;
const PLUM = 0x2b2150;
const PIN_COLORS: Record<Pin["kind"], number> = { jump: 0xffc83d, duck: 0x63d6c1, ramp: 0x93cf4c };
const PIN_ICONS: Record<Pin["kind"], string> = { jump: "dd-ico-jump", duck: "dd-ico-crouch", ramp: "dd-ico-ramp" };
const ON_CREAM: Record<string, string> = { "#7fe0c4": "#1d7a58", "#ff9a72": "#c2452d", "#ffcf3f": "#9a6a06", "#fbf5e6": "#3d3554" };
const QUIET_TAGS = new Set(["lip", "near"]);

function plate(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, u: number, alpha = 1, shadow = 1) {
  const r = Math.min(h / 2, 12 * u);
  g.fillStyle(INK, alpha);
  g.fillRoundedRect(x + 2.4 * u * shadow, y + 3 * u * shadow, w, h, r);
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
  private readonly badges: Badge[] = [];
  private readonly showLabel: Phaser.GameObjects.Text;
  private readonly showTotal: Phaser.GameObjects.Text;
  private readonly showSeq: Phaser.GameObjects.Text;
  private readonly showTrick: Phaser.GameObjects.Text;
  private readonly splitName: Phaser.GameObjects.Text;
  private readonly splitDelta: Phaser.GameObjects.Text;
  private readonly dockBg: Phaser.GameObjects.Graphics;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly tipText: Phaser.GameObjects.Text;
  private readonly measure: Phaser.GameObjects.Text;
  private readonly countText: Phaser.GameObjects.Text;
  private readonly pins: PinView[] = [];
  private frame!: Frame;
  private u = 1;
  private k = 1;
  private placeBox = new Phaser.Geom.Rectangle();
  private timeBox = new Phaser.Geom.Rectangle();
  private trackBox = new Phaser.Geom.Rectangle();
  private headRect = new Phaser.Geom.Rectangle();
  private boxes: Phaser.Geom.Rectangle[] = [];
  private subY = 0;
  private bottom = 0;
  private lineup: Phaser.GameObjects.Container | null = null;
  private lineupEntries: LineupEntry[] | null = null;
  private lineupAlpha = 0;
  private lineupH = 0;
  private headline: Callout | null = null;
  private leaving: Callout[] = [];
  private tags: Callout[] = [];
  private anchor = { x: 0, y: 0 };
  private tipLife = 0;
  private hintAlpha = 1;
  private hintSteps: readonly string[] = [];
  private hintStep = 0;
  private hintClock = 0;
  private hintFade = 1;
  private dockMin = 0;
  private rivalRight = 0;
  private dockH = 0;
  private inset = 0;
  private streakSeed = 7;
  private streakList: { x: number; y: number; len: number; speed: number }[] = [];
  private shownPlace = 0;
  private placeFlash = 0;
  private placeGain = true;
  private shownWho = "";
  private shownMood = "";
  private splitLife = 0;
  private splitColor = "#3d3554";
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
  private rivalFlash = new Map<string, number>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly layer: Phaser.GameObjects.Layer,
    private readonly copy: RaceCopy,
    private readonly locale: Locale,
    private readonly fonts: { display: string; body: string },
    frame: Frame,
    private readonly deck: PhoneDeck,
  ) {
    const display = (color = "#fbf5e6", stroke = 0) => ({ fontFamily: fonts.display, fontSize: `${F}px`, color, ...(stroke ? { stroke: "#1d1830", strokeThickness: stroke } : {}) });
    const body = (color = "#1d1830") => ({ fontFamily: fonts.body, fontSize: `${F}px`, color, fontStyle: "700" });
    this.streaks = this.add(scene.add.graphics());
    this.plates = this.add(scene.add.graphics());
    this.dynamic = this.add(scene.add.graphics());
    this.chips = this.add(scene.add.graphics());
    this.head = this.add(scene.add.image(0, 0, "deco-head-normal").setOrigin(0.5, 0.62));
    this.placeText = this.add(scene.add.text(0, 0, "", display("#1d1830")).setOrigin(0, 0.5));
    this.ofText = this.add(scene.add.text(0, 0, "", body("#6a6385")).setOrigin(0, 0.5));
    this.timeLabel = this.add(scene.add.text(0, 0, copy.time.toUpperCase(), display("#e8742a")).setOrigin(0.5, 0));
    this.timeText = this.add(scene.add.text(0, 0, "0:00,00", display("#1d1830")).setOrigin(0.5, 0.5));
    this.splitName = this.add(scene.add.text(0, 0, "", body("#6a6385")).setOrigin(0, 0).setVisible(false));
    this.splitDelta = this.add(scene.add.text(0, 0, "", display("#1d1830")).setOrigin(0, 0).setVisible(false));
    for (let i = 0; i < 3; i += 1) this.badges.push({ letter: this.add(scene.add.text(0, 0, "", display("#1d1830")).setOrigin(0.5, 0.5)), gap: this.add(scene.add.text(0, 0, "", display()).setOrigin(0, 0.5)) });
    this.showLabel = this.add(scene.add.text(0, 0, copy.show.label.toUpperCase(), display("#ffcf3f")).setOrigin(0, 0.5));
    this.showTotal = this.add(scene.add.text(0, 0, "0", display()).setOrigin(1, 0.5));
    this.showSeq = this.add(scene.add.text(0, 0, "", display("#7fe0c4")).setOrigin(0.5, 0.5).setAlpha(0));
    this.showTrick = this.add(scene.add.text(0, 0, "", display("#fbf5e6")).setOrigin(0.5, 0.5).setAlpha(0));
    for (let i = 0; i < 2; i += 1) this.pins.push({ g: this.add(scene.add.graphics()), icon: this.add(scene.add.image(0, 0, "dd-ico-jump").setVisible(false)), y: 0, alpha: 0 });
    this.dockBg = this.add(scene.add.graphics());
    this.hintText = keyArrows(this.add(scene.add.text(0, 0, "", { ...body(), align: "center", lineSpacing: 6 }).setOrigin(0.5, 0.5)));
    this.tipText = keyArrows(this.add(scene.add.text(0, 0, "", { ...body(), align: "center", lineSpacing: 6 }).setOrigin(0.5, 0.5).setAlpha(0)));
    this.measure = this.add(scene.add.text(0, 0, "Ág\nÁg", { ...body(), align: "center", lineSpacing: 6 }).setVisible(false));
    this.countText = this.add(scene.add.text(0, 0, "", { fontFamily: fonts.display, fontSize: "170px", color: "#ffcf3f", stroke: "#1d1830", strokeThickness: 20 }).setOrigin(0.5));
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

  get bottomInset() {
    return this.inset;
  }

  get calloutBoxes() {
    return this.boxes;
  }

  private s(size: number) {
    return (size * this.u * this.k) / F;
  }

  layout(frame: Frame) {
    this.frame = frame;
    const u = frame.unit;
    this.u = u;
    const left = frame.safe.left + ROW.margin * u;
    const right = frame.width - frame.safe.right - ROW.margin * u;
    const room = (right - left) / u;
    const k = Phaser.Math.Clamp(room / 374, 0.86, 1.12);
    this.k = k;
    const top = frame.safe.top + ROW.top * u;
    const h = ROW.h * u * k;
    const placeW = ROW.place * u * k;
    const timeW = ROW.time * u * k;
    const gap = ROW.gap * u;
    this.placeBox.setTo(left, top, placeW, h);
    this.timeBox.setTo(right - timeW, top, timeW, h);
    this.trackBox.setTo(left + placeW + gap, top, right - timeW - gap - (left + placeW + gap), h);
    this.subY = top + h + gap;
    this.bottom = this.subY + ROW.sub * u * k + gap;
    const s = (size: number) => this.s(size);
    this.head.setScale((34 * u * k) / 190).setPosition(left + 21 * u * k, top + h / 2 + 3 * u * k);
    this.placeText.setScale(s(25)).setData("base", s(25)).setPosition(left + 40 * u * k, top + h / 2 + 2 * u * k);
    this.ofText.setScale(s(11));
    this.timeLabel.setScale(s(9.5)).setPosition(this.timeBox.centerX, top + 4 * u * k);
    this.timeText.setScale(s(19)).setPosition(this.timeBox.centerX, top + h * 0.62);
    this.splitDelta.setScale(s(10.5));
    for (const b of this.badges) {
      b.letter.setScale(s(8.5));
      b.gap.setScale(s(10.5));
    }
    this.showLabel.setScale(s(9));
    this.showTotal.setScale(s(11.5)).setData("base", s(11.5));
    this.showSeq.setScale(s(10.5));
    this.showTrick.setScale(s(10.5));
    this.dockMin = this.measure.height * s(DOCK.text) + DOCK.pad * 2 * u;
    this.fitDockText(this.hintText, this.hintText.text);
    this.fitDockText(this.tipText, this.tipText.text);
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
    this.hintSteps = touch ? this.copy.hintSteps : [this.copy.hint];
    this.resetHint();
  }

  resetHint() {
    this.hintAlpha = 1;
    this.hintStep = 0;
    this.hintClock = 0;
    this.hintFade = 1;
    this.fitDockText(this.hintText, this.hintSteps[0] ?? "");
  }

  private fitDockText(text: Phaser.GameObjects.Text, content: string) {
    const inner = this.frame.view.w - (DOCK.margin * 2 + DOCK.pad * 2 + 8) * this.u;
    text.setText(content);
    for (const f of [1, 0.93, 0.86]) {
      const scale = this.s(DOCK.text) * f;
      text.setScale(scale).setWordWrapWidth(inner / scale);
      if (text.getWrappedText(content).length <= 2) break;
    }
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
    const ps = this.placeText.getData("base") as number;
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
    this.splitLife = Math.max(0, this.splitLife - dt);
    this.drawTrack(data);
    this.drawTimeLabel();
    this.chips.clear();
    this.drawRivals(dt, data.rows);
    this.drawShow();
    this.updateDock(dt, data.showHint);
    this.drawPins(dt, data.pins ?? []);
    this.anchor = { x: data.anchor.x, y: data.anchor.y };
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
    const youMarker = data.markers.find((m) => m.you);
    if (youMarker) {
      const k = Phaser.Math.Clamp((youMarker.x - data.startX) / span, 0, 1);
      g.fillStyle(0xff7a1a, 0.55);
      g.fillRoundedRect(x0 - 4 * u, y - 3.5 * u, Math.max(7 * u, (x1 - x0) * k + 4 * u), 7 * u, 3.5 * u);
    }
    for (const m of order) {
      const k = Phaser.Math.Clamp((m.x - data.startX) / span, 0, 1);
      const mx = x0 + (x1 - x0) * k;
      const r = (m.ghost ? 4 : m.you ? 9 : 5.5) * u;
      g.fillStyle(INK, m.ghost ? 0.5 : 1);
      g.fillCircle(mx, y, r + (m.you ? 2 : 1.6) * u);
      g.fillStyle(m.color, m.ghost ? 0.6 : 1);
      g.fillCircle(mx, y, r);
      if (m.you) {
        g.lineStyle(2 * u, CREAM, 1);
        g.strokeCircle(mx, y, r);
      }
    }
  }

  private drawTimeLabel() {
    const u = this.u;
    const box = this.timeBox;
    const on = this.splitLife > 0;
    this.timeLabel.setVisible(!on);
    this.splitName.setVisible(on);
    this.splitDelta.setVisible(on);
    if (!on) return;
    const room = box.width - 12 * u;
    const name = this.splitName;
    const delta = this.splitDelta;
    const dw = delta.width * delta.scaleX;
    name.setScale(this.s(8.5));
    const nameRoom = room - dw - 4 * u;
    if (name.width * name.scaleX > nameRoom) name.setScale(Math.max(0, nameRoom) / Math.max(1, name.width));
    const fits = name.scaleX >= this.s(SPLIT_MIN);
    name.setVisible(fits);
    const nw = fits ? name.width * name.scaleX : 0;
    const total = nw + (nw > 0 ? 4 * u : 0) + dw;
    const x = box.centerX - total / 2;
    const top = box.y + 3.5 * u * this.k;
    const pop = this.splitLife > 2.75 ? 1.12 : 1;
    delta.setPosition(x + nw + (nw > 0 ? 4 * u : 0), top).setScale(this.s(10.5) * pop).setColor(this.splitColor);
    name.setPosition(x, top + (delta.height * this.s(10.5) - name.height * name.scaleY) / 2);
    const a = Math.min(1, this.splitLife * 2.5);
    name.setAlpha(a);
    delta.setAlpha(a);
  }

  private drawRivals(dt: number, rows: StandingRow[]) {
    const g = this.chips;
    const u = this.u;
    const k = this.k;
    const list = rows.filter((r) => !r.you);
    const show = this.started && list.length > 0;
    const h = ROW.sub * u * k;
    const y = this.subY;
    const pad = 4 * u * k;
    const dot = 7.5 * u * k;
    let x = this.placeBox.x + pad;
    const items: { row: StandingRow; x: number; w: number }[] = [];
    this.badges.forEach((b, i) => {
      const row = list[i];
      const on = show && !!row;
      b.letter.setVisible(on);
      b.gap.setVisible(on);
      if (!on || !row) return;
      const gap = row.gap.replace(/\s*s$/, "");
      b.gap.setText(gap || "·").setColor(gap.startsWith("−") ? "#ffc29a" : "#8ff0d2");
      const w = dot * 2 + 3 * u * k + b.gap.width * b.gap.scaleX + 6 * u * k;
      items.push({ row, x, w });
      x += w + 2 * u * k;
    });
    this.rivalRight = this.placeBox.x;
    if (!items.length) return;
    const last = items[items.length - 1];
    const plateW = last.x + last.w + pad - this.placeBox.x;
    this.rivalRight = this.placeBox.x + plateW;
    plate(g, this.placeBox.x, y, plateW, h, PLUM, u, 0.92, 0.6);
    items.forEach((it, i) => {
      const b = this.badges[i];
      const cy = y + h / 2;
      const prev = this.rivalFlash.get(it.row.who) ?? 0;
      const flash = Math.max(prev - dt * 1.5, it.row.flash);
      this.rivalFlash.set(it.row.who, flash);
      if (flash > 0) {
        g.fillStyle(it.row.color, 0.45 * flash);
        g.fillRoundedRect(it.x - 1 * u, y + 2 * u, it.w + 2 * u, h - 4 * u, (h - 4 * u) / 2);
      }
      const dx = it.x + 2 * u * k + dot;
      g.fillStyle(INK, 1);
      g.fillCircle(dx, cy, dot + 1.4 * u);
      g.fillStyle(it.row.color, 1);
      g.fillCircle(dx, cy, dot);
      b.letter.setText(it.row.name.charAt(0).toUpperCase()).setPosition(dx, cy + 0.5 * u);
      b.gap.setPosition(dx + dot + 3 * u * k, cy + 1 * u);
    });
  }

  private drawShow() {
    const g = this.chips;
    const u = this.u;
    const k = this.k;
    const chip = this.shownTotal > 0;
    this.showOn += ((chip ? 1 : 0) - this.showOn) * 0.2;
    const a = this.showOn;
    this.showLabel.setAlpha(a);
    this.showTotal.setAlpha(a);
    const h = ROW.sub * u * k;
    const y = this.subY;
    let right = this.timeBox.right;
    if (a > 0.02) {
      const w = Math.max(this.timeBox.width * 0.82, this.showLabel.width * this.showLabel.scaleX + this.showTotal.width * this.showTotal.scaleX + 18 * u);
      const x = right - w;
      plate(g, x, y, w, h, PLUM, u, 0.92 * a, 0.6);
      this.showLabel.setPosition(x + 7 * u, y + h / 2 + 1 * u);
      this.showTotal.setPosition(x + w - 7 * u, y + h / 2 + 1 * u);
      right = x - ROW.gap * u;
    }
    const trick = Math.min(1, this.trickLife * 3);
    const seq = this.seqAlpha * (1 - trick);
    const vis = Math.max(trick, seq);
    if (vis <= 0.02) return;
    const left = this.rivalRight + ROW.gap * u;
    const pad = 7 * u * k;
    const room = Math.max(0, right - left - pad * 2);
    for (const t of [this.showSeq, this.showTrick]) t.setScale(Math.min(this.s(10.5), room / Math.max(1, t.width)));
    const tw = trick > 0.02 ? this.showTrick.width * this.showTrick.scaleX : 0;
    const sw = seq > 0.02 ? this.showSeq.width * this.showSeq.scaleX : 0;
    const w = Math.max(tw, sw) + pad * 2;
    const x = right - w;
    plate(g, x, y, w, h, PLUM, u, 0.92 * vis, 0.6);
    const shake = this.seqDrop > 0 ? Math.sin(this.seqDrop * 60) * 3 * u : 0;
    this.showSeq.setPosition(x + w / 2 + shake, y + h / 2 + 1 * u);
    this.showTrick.setPosition(x + w / 2, y + h / 2 + 1 * u);
    if (seq > 0.02 && this.meterActive) {
      const bw = w - pad * 2;
      const by = y + h - 4.5 * u;
      g.fillStyle(0x140f26, 0.8 * seq);
      g.fillRoundedRect(x + pad, by, bw, 2.5 * u, 1.25 * u);
      g.fillStyle(this.meterTimer > 0.3 ? 0x7fe0c4 : 0xffcf3f, seq);
      g.fillRoundedRect(x + pad, by, Math.max(2.5 * u, bw * Math.min(1, this.meterTimer)), 2.5 * u, 1.25 * u);
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
      const y = Phaser.Math.Clamp(view.y, this.bottom + r + 4 * u, f.view.h - this.inset - r - 8 * u);
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

  private updateDock(dt: number, showHint: boolean) {
    const u = this.u;
    const f = this.frame;
    if (!showHint && this.hintAlpha > 0) this.hintAlpha = Math.max(0, this.hintAlpha - dt * 0.8);
    this.tipLife = Math.max(0, this.tipLife - dt);
    const tipAlpha = Math.min(1, this.tipLife * 2.5);
    const hintAlpha = tipAlpha > 0 || this.lineup ? 0 : this.hintAlpha;
    if (hintAlpha > 0.01) this.hintClock += dt;
    if (this.hintClock > HINT_STEP && this.hintStep < this.hintSteps.length - 1) {
      this.hintFade = Math.max(0, this.hintFade - dt * 6);
      if (this.hintFade === 0) {
        this.hintStep += 1;
        this.hintClock = 0;
        this.fitDockText(this.hintText, this.hintSteps[this.hintStep]);
      }
    } else this.hintFade = Math.min(1, this.hintFade + dt * 6);
    this.hintText.setAlpha(hintAlpha * this.hintFade);
    this.tipText.setAlpha(tipAlpha);
    const box = tipAlpha > 0 ? this.tipText : this.hintText;
    const alpha = Math.max(tipAlpha, hintAlpha);
    const bg = this.dockBg;
    bg.clear();
    const textH = box.height * box.scaleY;
    const target = alpha > 0.01 ? Math.max(this.dockMin, textH + DOCK.pad * 2 * u) : 0;
    this.dockH += (target - this.dockH) * Math.min(1, dt * 12);
    const lineupInset = this.lineup ? (this.lineupH + 10 * u) * this.lineupAlpha : 0;
    const dockInset = alpha > 0.01 ? (target + DOCK.gap * u) * alpha : 0;
    this.inset = Math.max(lineupInset, dockInset);
    if (alpha <= 0.01) return;
    const h = target;
    const w = f.view.w - DOCK.margin * 2 * u;
    const x = DOCK.margin * u;
    const y = f.view.h - DOCK.margin * u - h;
    box.setPosition(f.view.w / 2, y + h / 2 + 1 * u);
    const r = Math.min(h / 2, 14 * u);
    bg.fillStyle(INK, 0.9 * alpha);
    bg.fillRoundedRect(x + 2 * u, y + 2.5 * u, w, h, r);
    bg.fillStyle(CREAM, 0.97 * alpha);
    bg.fillRoundedRect(x, y, w, h, r);
    bg.lineStyle(Math.max(2, 1.6 * u), INK, alpha);
    bg.strokeRoundedRect(x, y, w, h, r);
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
    const base = this.showTotal.getData("base") as number;
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
    this.splitDelta.setText(value);
    this.splitColor = ON_CREAM[color] ?? "#3d3554";
    this.splitLife = 3;
  }

  showTrickText(text: string, color = "#fbf5e6") {
    this.showTrick.setText(text.replace(/\s+×\d+$/, "")).setColor(color);
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

  private usableBottom() {
    return this.frame.view.h - this.inset;
  }

  private headlineY() {
    return this.bottom + (this.usableBottom() - this.bottom) * 0.2;
  }

  private updateCallouts(dt: number) {
    const u = this.u;
    const f = this.frame;
    const h = this.headline;
    this.headRect.setEmpty();
    if (h) {
      h.life -= dt;
      const k = 1 - h.life / h.max;
      const pop = k < 0.08 ? 0.55 + (k / 0.08) * 0.62 : k < 0.16 ? 1.17 - ((k - 0.08) / 0.08) * 0.17 : 1;
      const alpha = Math.min(1, h.life / 0.22);
      const base = h.text.getData("base") as number;
      h.text.setScale(Math.min(base * pop, (f.view.w - 12 * u) / Math.max(1, h.text.width))).setAlpha(alpha);
      h.sub?.setAlpha(alpha);
      const hw = (h.text.width * base) / 2;
      const top = h.text.y - (h.text.height * base) / 2;
      const bottom = h.sub ? h.sub.y + h.sub.height * h.sub.scaleY : h.text.y + (h.text.height * base) / 2;
      this.headRect.setTo(f.view.w / 2 - hw, top, hw * 2, bottom - top);
      if (h.life <= 0) {
        this.drop(h);
        this.headline = null;
        this.headRect.setEmpty();
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
      t.rise += dt * 18 * u;
      const k = 1 - t.life / t.max;
      const base = t.text.getData("base") as number;
      const scale = base * (k < 0.1 ? 0.6 + k * 4 : 1);
      t.text.setScale(scale).setAlpha(Math.min(1, t.life / 0.22));
      const half = (t.text.width * base) / 2 + 6 * u;
      const th = t.text.height * base;
      const x = Phaser.Math.Clamp(this.anchor.x, half, f.view.w - half);
      let y = Phaser.Math.Clamp(this.anchor.y - t.rise, this.bottom + th + 4 * u, this.usableBottom() - 6 * u);
      if (!this.headRect.isEmpty() && x + half > this.headRect.x && x - half < this.headRect.right && y > this.headRect.y - 4 * u && y - th < this.headRect.bottom + 4 * u) {
        const below = this.headRect.bottom + th + 6 * u;
        y = below <= this.usableBottom() - 6 * u ? below : this.headRect.y - 6 * u;
      }
      t.text.setPosition(x, y);
    }
    this.boxes = this.headRect.isEmpty() ? [] : [this.headRect];
    for (const t of this.tags) {
      const w = t.text.width * t.text.scaleX;
      const h = t.text.height * t.text.scaleY;
      this.boxes.push(new Phaser.Geom.Rectangle(t.text.x - w / 2, t.text.y - h, w, h));
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
    for (const t of this.tags) t.life = Math.min(t.life, 0.2);
    const size = opts.size ?? 60;
    const u = this.u;
    const f = this.frame;
    const y = this.headlineY();
    const text0 = this.scene.add.text(f.view.w / 2, y, text, { fontFamily: this.fonts.display, fontSize: "60px", color: opts.color, stroke: "#1d1830", strokeThickness: 12, align: "center" }).setOrigin(0.5, 0.5);
    this.layer.add(text0);
    this.fitHeadline(text0, size);
    let sub: Phaser.GameObjects.Text | null = null;
    if (opts.sub) {
      const subScale = this.s(14);
      sub = this.scene.add.text(f.view.w / 2, y + (size * 0.5 * u) * 0.55 + 10 * u, opts.sub, { fontFamily: this.fonts.body, fontSize: `${F}px`, color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 16, fontStyle: "700", align: "center", wordWrap: { width: (f.view.w - 40 * u) / subScale } }).setOrigin(0.5, 0);
      sub.setScale(subScale);
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
    if (QUIET_TAGS.has(key)) return;
    const same = this.tags.find((q) => q.key === key);
    if (same) {
      same.text.setText(text);
      same.life = same.max;
      same.rise = 0;
      return;
    }
    for (const old of this.tags) this.drop(old);
    this.tags = [];
    const u = this.u;
    const t = this.scene.add.text(this.anchor.x, this.anchor.y, text, { fontFamily: this.fonts.display, fontSize: `${F}px`, color, stroke: "#1d1830", strokeThickness: 15 }).setOrigin(0.5, 1);
    const base = Math.min(this.s(16), (this.frame.view.w - 24 * u) / Math.max(1, t.width));
    t.setData("base", base).setScale(base);
    this.layer.add(t);
    this.tags.push({ key, text: t, sub: null, life: TAG_LIFE, max: TAG_LIFE, priority: 0, fade: 0, rise: 0 });
  }

  hasTag(key: string) {
    return this.tags.some((q) => q.key === key);
  }

  untag(key: string) {
    const i = this.tags.findIndex((q) => q.key === key);
    if (i < 0) return;
    this.drop(this.tags[i]);
    this.tags.splice(i, 1);
  }

  unshout(key: string) {
    const cur = this.headline;
    if (!cur || cur.key !== key) return;
    cur.fade = LEAVE;
    this.leaving.push(cur);
    this.headline = null;
  }

  tip(text: string, life = 2.8) {
    this.fitDockText(this.tipText, text);
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
    this.countText.setText(text).setPosition(this.frame.view.w / 2, this.bottom + (this.usableBottom() - this.bottom) * 0.3);
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
    const rows = Math.ceil(entries.length / cols);
    this.lineupH = rows * ch + (rows - 1) * gap;
    const y0 = f.view.h - 10 * u - this.lineupH;
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
    this.trickLife = 0;
    this.showTrick.setAlpha(0);
    this.shownSeq = "";
    this.seqAlpha = 0;
    this.showSeq.setAlpha(0);
    this.shownPlace = 0;
    this.placeFlash = 0;
    this.rivalFlash.clear();
  }
}
