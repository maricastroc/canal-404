import * as Phaser from "phaser";
import type { Locale } from "@/i18n/locales";
import { formatNumber, ordinal } from "@/i18n/format";
import type { RaceCopy } from "../copy";
import { H, W } from "../layout";
import { INK } from "./cart";
import { keyArrows } from "../../kit/keyArrows";

export { H, W };
const SPX = 1774;
const BAR_X = 690;
const BAR_W = 540;

export type TouchButton = "left" | "right" | "crouch" | "jump";

export type HudButton = TouchButton;

type Circle = { id: TouchButton; x: number; y: number; r: number; label: string; icon?: "ccw" | "cw" };

type Callout = { key: string; text: Phaser.GameObjects.Text; sub: Phaser.GameObjects.Text | null; life: number; max: number; priority: number; fade: number; rise: number };

const HEADLINE_Y = 296;
const ROWS = 4;
const PANEL_H = 226;
const LEAVE = 0.08;
const TREND_ICON = 44;
const EDGE_ICON = 34;

export type Marker = { x: number; color: number; letter: string; you?: boolean; ghost?: boolean };

export type StandingRow = { name: string; color: number; you: boolean; gap: string; flash: number; who: string };

export type EdgeTag = { side: "left" | "right"; y: number; color: number; text: string };

export type ShowMeter = { total: number; seq: number; mult: number; timer: number; active: boolean };

export type Pin = { y: number; kind: "jump" | "duck" | "ramp"; near: number };

export type HudData = { time: number; rows: StandingRow[]; speed: number; tier: number; trend: number; markers: Marker[]; edges: EdgeTag[]; finishX: number; startX: number; reduced: boolean; showHint: boolean; anchor: { x: number; y: number }; pins?: Pin[]; started?: boolean };

export type ShoutOptions = { priority: number; color: string; size?: number; sub?: string; life?: number };

export type LineupEntry = { who: string; name: string; cart: string; color: number };

export interface RaceHud {
  setTouch(touch: boolean): void;
  resetHint(): void;
  setPressed(pressed: Set<TouchButton>): void;
  hitTest(x: number, y: number): HudButton | null;
  flashSpeed(delta: number): void;
  update(dt: number, data: HudData): void;
  showMeter(dt: number, m: ShowMeter): void;
  split(name: string, value: string, color: string): void;
  showTrickText(text: string, color?: string): void;
  showBank(points: number, label: string): void;
  showDrop(text: string): void;
  shout(key: string, text: string, opts: ShoutOptions): void;
  tag(key: string, text: string, color: string): void;
  tip(text: string, life?: number): void;
  countdown(text: string | null): void;
  showLineup(entries: LineupEntry[]): void;
  fadeLineup(dt: number): void;
  clearPopups(): void;
  destroy(): void;
}

const SHOW_X = 1468;
const SHOW_Y = 16;
const SHOW_W = 320;
const SHOW_H = 58;

export function formatTime(seconds: number, locale: Locale) {
  if (!Number.isFinite(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  const sec = formatNumber(s, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2, minimumIntegerDigits: 2 });
  return `${m}:${sec}`;
}

export function formatSeconds(seconds: number, locale: Locale, digits = 1) {
  return formatNumber(seconds, locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export class Hud implements RaceHud {
  private readonly scene: Phaser.Scene;
  private readonly layer: Phaser.GameObjects.Layer;
  private readonly copy: RaceCopy;
  private readonly locale: Locale;
  private readonly fonts: { display: string; body: string };
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly dynamic: Phaser.GameObjects.Graphics;
  private readonly streaks: Phaser.GameObjects.Graphics;
  private readonly timeText: Phaser.GameObjects.Text;
  private readonly rowNames: Phaser.GameObjects.Text[] = [];
  private readonly rowGaps: Phaser.GameObjects.Text[] = [];
  private readonly rowHeads: Phaser.GameObjects.Image[] = [];
  private readonly markerTexts: Phaser.GameObjects.Text[] = [];
  private readonly edgeTexts: Phaser.GameObjects.Text[] = [];
  private readonly edgeIcons: Phaser.GameObjects.Image[] = [];
  private readonly trendIcons: [Phaser.GameObjects.Image, Phaser.GameObjects.Image];
  private readonly speedText: Phaser.GameObjects.Text;
  private readonly unitText: Phaser.GameObjects.Text;
  private readonly tierText: Phaser.GameObjects.Text;
  private readonly deltaText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly hintBg: Phaser.GameObjects.Graphics;
  private readonly countText: Phaser.GameObjects.Text;
  private readonly touchG: Phaser.GameObjects.Graphics;
  private readonly touchLabels: Phaser.GameObjects.Text[] = [];
  private readonly touchIcons: Phaser.GameObjects.Image[] = [];
  private lineup: Phaser.GameObjects.Container | null = null;
  private lineupAlpha = 0;
  private headline: Callout | null = null;
  private leaving: Callout[] = [];
  private tags: Callout[] = [];
  private anchor = { x: W / 2, y: 520 };
  private readonly tipText: Phaser.GameObjects.Text;
  private tipLife = 0;
  private buttons: Circle[] = [];
  private pressed = new Set<TouchButton>();
  private touchOn = false;
  private hintAlpha = 1;
  private streakSeed = 1;
  private streakList: { x: number; y: number; len: number; speed: number }[] = [];
  private shownTier = 0;
  private tierFlash = 0;
  private speedFlash = 0;
  private speedFlashColor = 0x7fe0c4;
  private deltaLife = 0;
  private readonly showG: Phaser.GameObjects.Graphics;
  private readonly showTotal: Phaser.GameObjects.Text;
  private readonly showSeq: Phaser.GameObjects.Text;
  private readonly showTrick: Phaser.GameObjects.Text;
  private readonly splitName: Phaser.GameObjects.Text;
  private readonly splitDelta: Phaser.GameObjects.Text;
  private splitLife = 0;
  private shownTotal = -1;
  private shownSeq = "";
  private seqAlpha = 0;
  private trickLife = 0;
  private totalPop = 0;
  private seqDrop = 0;
  private owned: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer, copy: RaceCopy, locale: Locale, fonts: { display: string; body: string }) {
    this.scene = scene;
    this.layer = layer;
    this.copy = copy;
    this.locale = locale;
    this.fonts = fonts;
    this.streaks = this.add(scene.add.graphics());
    this.panel = this.add(scene.add.graphics());
    this.dynamic = this.add(scene.add.graphics());
    this.drawPanels();
    const display = (size: number, color = "#fbf5e6") => ({ fontFamily: fonts.display, fontSize: `${size}px`, color });
    const body = (size: number, color = "#fbf5e6") => ({ fontFamily: fonts.body, fontSize: `${size}px`, color, fontStyle: "700" });
    this.add(scene.add.text(40, 26, copy.time.toUpperCase(), display(19, "#ffcf3f")));
    this.timeText = this.add(scene.add.text(40, 46, "0:00,00", display(46)));
    this.splitName = this.add(scene.add.text(382, 30, "", body(17, "#cfc8e8")));
    this.splitName.setOrigin(1, 0).setAlpha(0);
    this.splitDelta = this.add(scene.add.text(382, 50, "", display(30)));
    this.splitDelta.setOrigin(1, 0).setAlpha(0);
    for (let i = 0; i < ROWS; i += 1) {
      const head = this.add(scene.add.image(56, 126 + i * 30, "deco-head-normal"));
      head.setScale(0.19).setOrigin(0.5, 0.62);
      this.rowHeads.push(head);
      this.rowNames.push(this.add(scene.add.text(80, 110 + i * 30, "", display(22))));
      const gap = this.add(scene.add.text(380, 112 + i * 30, "", body(19, "#cfc8e8")));
      gap.setOrigin(1, 0);
      this.rowGaps.push(gap);
    }
    for (let i = 0; i < 4; i += 1) {
      const t = this.add(scene.add.text(0, 0, "", display(15, "#1d1830")));
      t.setOrigin(0.5, 0.5);
      this.markerTexts.push(t);
    }
    for (let i = 0; i < 3; i += 1) {
      const t = this.add(scene.add.text(0, 0, "", display(19, "#1d1830")));
      t.setOrigin(0.5, 0.5).setVisible(false);
      this.edgeTexts.push(t);
      this.edgeIcons.push(this.add(scene.add.image(0, 0, "dd-ico-edge-right").setDisplaySize(EDGE_ICON, EDGE_ICON).setVisible(false)));
    }
    this.trendIcons = [this.add(scene.add.image(SPX + 92, 78, "dd-ico-trend-up")), this.add(scene.add.image(SPX + 92, 82, "dd-ico-trend-down"))];
    for (const icon of this.trendIcons) icon.setDisplaySize(TREND_ICON, TREND_ICON).setVisible(false);
    this.speedText = this.add(scene.add.text(SPX, 78, "0", display(48)));
    this.speedText.setOrigin(0.5, 0.5);
    this.unitText = this.add(scene.add.text(SPX, 112, copy.kmh, body(17, "#cfc8e8")));
    this.unitText.setOrigin(0.5, 0.5);
    this.tierText = this.add(scene.add.text(SPX, 146, copy.tiers[0].toUpperCase(), display(20, "#ffcf3f")));
    this.tierText.setOrigin(0.5, 0.5);
    this.deltaText = this.add(scene.add.text(SPX, 198, "", { fontFamily: fonts.display, fontSize: "32px", color: "#7fe0c4", stroke: "#1d1830", strokeThickness: 8 }));
    this.deltaText.setOrigin(0.5, 0.5).setAlpha(0);
    this.hintBg = this.add(scene.add.graphics());
    this.hintText = keyArrows(this.add(scene.add.text(W / 2, 1030, "", body(23, "#1d1830"))));
    this.hintText.setOrigin(0.5, 0.5);
    this.tipText = keyArrows(this.add(scene.add.text(W / 2, 1030, "", body(23, "#1d1830"))));
    this.tipText.setOrigin(0.5, 0.5).setAlpha(0);
    this.countText = this.add(scene.add.text(W / 2, 420, "", { fontFamily: fonts.display, fontSize: "170px", color: "#ffcf3f", stroke: "#1d1830", strokeThickness: 20 }));
    this.countText.setOrigin(0.5);
    this.showG = this.add(scene.add.graphics());
    this.add(scene.add.text(SHOW_X - SHOW_W / 2 + 22, SHOW_Y + 8, copy.show.label.toUpperCase(), display(17, "#ffcf3f")));
    this.showTotal = this.add(scene.add.text(SHOW_X - SHOW_W / 2 + 22, SHOW_Y + 24, "0", display(30)));
    this.showSeq = this.add(scene.add.text(SHOW_X + SHOW_W / 2 - 20, SHOW_Y + 25, "", display(28, "#7fe0c4")));
    this.showSeq.setOrigin(1, 0.5).setAlpha(0);
    this.showTrick = this.add(scene.add.text(SHOW_X, SHOW_Y + SHOW_H + 24, "", { fontFamily: fonts.display, fontSize: "26px", color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 7 }));
    this.showTrick.setOrigin(0.5, 0.5).setAlpha(0);
    this.touchG = this.add(scene.add.graphics());
  }

  private add<T extends Phaser.GameObjects.GameObject>(obj: T) {
    this.layer.add(obj);
    this.owned.push(obj);
    if (this.owned.length > 240) this.owned = this.owned.filter((o) => o.scene);
    return obj;
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.countText);
    for (const obj of this.owned) obj.destroy();
    this.owned.length = 0;
    this.lineup = null;
    this.headline = null;
    this.leaving = [];
    this.tags = [];
  }

  private drawPanels() {
    const g = this.panel;
    g.clear();
    g.fillStyle(INK, 0.9);
    g.fillRoundedRect(20, 16, 376, PANEL_H, 18);
    g.lineStyle(4, 0xfbf5e6, 0.2);
    g.strokeRoundedRect(20, 16, 376, PANEL_H, 18);
    g.lineStyle(3, 0xfbf5e6, 0.16);
    g.beginPath();
    g.moveTo(38, 102);
    g.lineTo(380, 102);
    g.strokePath();
    g.fillStyle(INK, 0.9);
    g.fillRoundedRect(SPX - 120, 16, 240, 150, 18);
    g.lineStyle(4, 0xfbf5e6, 0.2);
    g.strokeRoundedRect(SPX - 120, 16, 240, 150, 18);
    g.fillStyle(INK, 0.62);
    g.fillRoundedRect(BAR_X - 30, 22, BAR_W + 80, 48, 24);
  }

  setTouch(touch: boolean) {
    this.touchOn = touch;
    this.hintText.setText(touch ? this.copy.hintTouch : this.copy.hint);
    this.hintAlpha = 1;
    this.buildTouch();
  }

  resetHint() {
    this.hintAlpha = 1;
  }

  private buildTouch() {
    for (const t of this.touchLabels) t.destroy();
    this.touchLabels.length = 0;
    for (const icon of this.touchIcons) icon.destroy();
    this.touchIcons.length = 0;
    this.buttons = [];
    if (!this.touchOn) {
      this.touchG.clear();
      return;
    }
    this.buttons.push({ id: "left", x: 150, y: 920, r: 96, label: "", icon: "ccw" });
    this.buttons.push({ id: "right", x: 380, y: 920, r: 96, label: "", icon: "cw" });
    this.buttons.push({ id: "crouch", x: 1500, y: 940, r: 104, label: this.copy.touch.crouch });
    this.buttons.push({ id: "jump", x: 1770, y: 800, r: 112, label: this.copy.touch.jump });
    for (const b of this.buttons) {
      if (b.icon) {
        const size = (b.r * 0.46 * 24) / 9;
        this.touchIcons.push(this.add(this.scene.add.image(b.x, b.y, b.icon === "cw" ? "dd-ico-cw-light" : "dd-ico-ccw-light").setDisplaySize(size, size).setAlpha(0.9)));
      }
      if (!b.label) continue;
      const t = this.add(this.scene.add.text(b.x, b.y, b.label, { fontFamily: this.fonts.display, fontSize: `${b.r > 80 ? 32 : 30}px`, color: "#fbf5e6" }));
      t.setOrigin(0.5);
      this.touchLabels.push(t);
    }
  }

  setPressed(pressed: Set<TouchButton>) {
    this.pressed = pressed;
  }

  hitTest(x: number, y: number): HudButton | null {
    for (const b of this.buttons) {
      const dx = x - b.x;
      const dy = y - b.y;
      const reach = b.r * 1.25;
      if (dx * dx + dy * dy <= reach * reach) return b.id;
    }
    return null;
  }

  flashSpeed(delta: number) {
    const kmh = Math.round(delta * 0.036);
    if (kmh === 0) return;
    this.speedFlash = 1;
    this.speedFlashColor = kmh > 0 ? 0x7fe0c4 : 0xff7a4a;
    this.deltaText.setText(`${kmh > 0 ? "+" : "−"}${formatNumber(Math.abs(kmh), this.locale)} ${this.copy.kmh}`);
    this.deltaText.setColor(kmh > 0 ? "#7fe0c4" : "#ff9a72");
    this.deltaLife = 1.3;
  }

  private drawTouch() {
    const g = this.touchG;
    g.clear();
    for (const b of this.buttons) {
      const on = this.pressed.has(b.id);
      g.fillStyle(INK, on ? 0.75 : 0.42);
      g.fillCircle(b.x, b.y, b.r);
      g.lineStyle(6, on ? 0xffcf3f : 0xfbf5e6, on ? 0.95 : 0.55);
      g.strokeCircle(b.x, b.y, b.r);
    }
  }

  update(dt: number, data: HudData) {
    this.timeText.setText(formatTime(data.time, this.locale));
    this.splitLife = Math.max(0, this.splitLife - dt);
    const sa = Math.min(1, this.splitLife * 2.5);
    this.splitName.setAlpha(sa);
    this.splitDelta.setAlpha(sa).setScale(this.splitLife > 2.85 ? 1.15 : 1);
    const g = this.dynamic;
    g.clear();
    for (let i = 0; i < ROWS; i += 1) {
      const row = data.rows[i];
      const name = this.rowNames[i];
      const gap = this.rowGaps[i];
      name.setVisible(!!row);
      gap.setVisible(!!row);
      this.rowHeads[i].setVisible(!!row);
      if (!row) continue;
      const y = 124 + i * 30;
      if (row.flash > 0) {
        g.fillStyle(row.you ? 0xffcf3f : row.color, 0.35 * row.flash);
        g.fillRoundedRect(32, y - 15, 356, 30, 10);
      }
      g.fillStyle(row.color, 1);
      g.fillCircle(56, y, 14);
      const mood = row.flash > 0 ? (row.you ? "smug" : "wow") : i === 0 ? "happy" : "normal";
      this.rowHeads[i].setTexture(`${row.who}-head-${mood}`);
      name.setText(`${ordinal(i + 1, this.locale)} ${row.name}`);
      name.setColor(row.you ? "#ffcf3f" : "#fbf5e6");
      gap.setText(row.gap);
    }
    const kmh = Math.round(data.speed * 0.036);
    this.speedText.setText(formatNumber(kmh, this.locale));
    if (data.tier !== this.shownTier) {
      this.tierFlash = data.tier > this.shownTier ? 1 : 0;
      this.shownTier = data.tier;
      this.tierText.setText(this.copy.tiers[data.tier].toUpperCase());
    }
    this.tierFlash = Math.max(0, this.tierFlash - dt * 2.5);
    this.tierText.setScale(1 + this.tierFlash * 0.35);
    const tierColors = ["#cfc8e8", "#7fe0c4", "#ffcf3f", "#ff7a4a"];
    this.tierText.setColor(tierColors[data.tier]);
    this.speedFlash = Math.max(0, this.speedFlash - dt * 2.2);
    this.deltaLife = Math.max(0, this.deltaLife - dt);
    this.deltaText.setAlpha(Math.min(1, this.deltaLife * 2));
    this.deltaText.y = 198 - (1.3 - this.deltaLife) * 12;
    this.speedText.setScale(1 + this.speedFlash * 0.18);
    const cx = SPX;
    const cy = 84;
    const frac = Math.min(1, data.speed / 2600);
    if (this.speedFlash > 0) {
      g.fillStyle(this.speedFlashColor, 0.35 * this.speedFlash);
      g.fillRoundedRect(SPX - 120, 16, 240, 150, 18);
    }
    g.lineStyle(11, 0x3a3358, 1);
    g.beginPath();
    g.arc(cx, cy, 56, Math.PI * 0.8, Math.PI * 2.2, false);
    g.strokePath();
    const colors = [0x7fe0c4, 0x7fe0c4, 0xffcf3f, 0xff7a4a];
    g.lineStyle(11, colors[data.tier], 1);
    g.beginPath();
    g.arc(cx, cy, 56, Math.PI * 0.8, Math.PI * 0.8 + Math.PI * 1.4 * frac, false);
    g.strokePath();
    const trending = Math.abs(data.trend) > 0.04;
    this.trendIcons[0].setVisible(trending && data.trend > 0);
    this.trendIcons[1].setVisible(trending && data.trend < 0);
    for (const icon of this.trendIcons) icon.setAlpha(Math.min(1, Math.abs(data.trend) * 2));
    const bx = BAR_X;
    const bw = BAR_W;
    const by = 46;
    g.lineStyle(6, 0xfbf5e6, 0.35);
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(bx + bw, by);
    g.strokePath();
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        g.fillStyle((i + j) % 2 === 0 ? 0xffffff : INK, 1);
        g.fillRect(bx + bw + 8 + i * 9, by - 13 + j * 9, 9, 9);
      }
    }
    const span = data.finishX - data.startX;
    const order = data.markers.map((m, i) => ({ m, i })).sort((a, b) => (a.m.ghost ? 0 : a.m.you ? 2 : 1) - (b.m.ghost ? 0 : b.m.you ? 2 : 1));
    for (const t of this.markerTexts) t.setVisible(false);
    let ti = 0;
    for (const { m } of order) {
      const u = Math.max(0, Math.min(1, (m.x - data.startX) / span));
      const mx = bx + bw * u;
      const r = m.ghost ? 8 : m.you ? 15 : 13;
      g.fillStyle(INK, m.ghost ? 0.4 : 1);
      g.fillCircle(mx, by, r + 4);
      g.fillStyle(m.color, m.ghost ? 0.55 : 1);
      g.fillCircle(mx, by, r);
      if (m.you) {
        g.fillStyle(m.color, 1);
        g.fillTriangle(mx - 7, by + 18, mx + 7, by + 18, mx, by + 27);
      }
      if (!m.ghost && m.letter && ti < this.markerTexts.length) {
        const t = this.markerTexts[ti];
        ti += 1;
        t.setVisible(true).setText(m.letter).setPosition(mx, by + 1);
      }
    }
    for (let i = 0; i < this.edgeTexts.length; i += 1) {
      const e = data.edges[i];
      const t = this.edgeTexts[i];
      const icon = this.edgeIcons[i];
      t.setVisible(!!e);
      icon.setVisible(!!e);
      if (!e) continue;
      t.setText(e.text);
      const w = t.width + 52;
      const x = e.side === "right" ? W - 40 - w / 2 : 40 + w / 2;
      t.setPosition(x + (e.side === "right" ? -8 : 8), e.y);
      g.fillStyle(INK, 0.85);
      g.fillRoundedRect(x - w / 2 - 3, e.y - 22, w + 6, 44, 20);
      g.fillStyle(e.color, 1);
      g.fillRoundedRect(x - w / 2, e.y - 19, w, 38, 17);
      icon.setTexture(e.side === "right" ? "dd-ico-edge-right" : "dd-ico-edge-left").setPosition(e.side === "right" ? x + w / 2 - 17 : x - w / 2 + 17, e.y);
    }
    const target = data.showHint ? 1 : 0;
    if (target === 0 && this.hintAlpha > 0) this.hintAlpha = Math.max(0, this.hintAlpha - dt * 0.8);
    this.tipLife = Math.max(0, this.tipLife - dt);
    const tipAlpha = Math.min(1, this.tipLife * 2.5);
    const hintAlpha = tipAlpha > 0 ? 0 : this.hintAlpha;
    this.hintText.setAlpha(hintAlpha);
    this.tipText.setAlpha(tipAlpha);
    this.hintBg.clear();
    const box = tipAlpha > 0 ? this.tipText : this.hintText;
    const boxAlpha = Math.max(tipAlpha, hintAlpha);
    if (boxAlpha > 0.01) {
      const w = box.width + 50;
      this.hintBg.fillStyle(0xfbf5e6, 0.86 * boxAlpha);
      this.hintBg.fillRoundedRect(W / 2 - w / 2, 1004, w, 54, 27);
      this.hintBg.lineStyle(4, INK, boxAlpha);
      this.hintBg.strokeRoundedRect(W / 2 - w / 2, 1004, w, 54, 27);
    }
    this.anchor = { x: Math.max(180, Math.min(W - 180, data.anchor.x)), y: Math.max(410, Math.min(H - 150, data.anchor.y)) };
    this.drawStreaks(dt, data.speed, data.reduced);
    this.drawTouch();
    this.updateCallouts(dt);
  }

  showMeter(dt: number, m: ShowMeter) {
    const total = Math.round(m.total);
    if (total !== this.shownTotal) {
      if (this.shownTotal >= 0 && total > this.shownTotal) this.totalPop = 1;
      this.shownTotal = total;
      this.showTotal.setText(formatNumber(total, this.locale));
    }
    this.totalPop = Math.max(0, this.totalPop - dt * 2.4);
    this.showTotal.setScale(1 + this.totalPop * 0.3).setColor(this.totalPop > 0.05 ? "#ffcf3f" : "#fbf5e6");
    const seqText = m.active ? `${formatNumber(Math.round(m.seq), this.locale)} ×${m.mult}` : this.shownSeq;
    if (m.active && seqText !== this.shownSeq) {
      this.shownSeq = seqText;
      this.showSeq.setText(seqText).setColor("#7fe0c4");
      this.seqDrop = 0;
    }
    const target = m.active ? 1 : 0;
    this.seqAlpha += (target - this.seqAlpha) * Math.min(1, dt * (m.active ? 14 : 4));
    this.seqDrop = Math.max(0, this.seqDrop - dt);
    this.showSeq.setAlpha(this.seqAlpha);
    this.showSeq.x = SHOW_X + SHOW_W / 2 - 20 + (this.seqDrop > 0 ? Math.sin(this.seqDrop * 60) * 6 : 0);
    const g = this.showG;
    g.clear();
    g.fillStyle(INK, 0.86);
    g.fillRoundedRect(SHOW_X - SHOW_W / 2, SHOW_Y, SHOW_W, SHOW_H, 18);
    g.lineStyle(3, 0xfbf5e6, 0.18);
    g.strokeRoundedRect(SHOW_X - SHOW_W / 2, SHOW_Y, SHOW_W, SHOW_H, 18);
    if (this.seqAlpha > 0.02 && m.active) {
      const w = 150;
      const x0 = SHOW_X + SHOW_W / 2 - 20 - w;
      g.fillStyle(0x3a3358, this.seqAlpha);
      g.fillRoundedRect(x0, SHOW_Y + SHOW_H - 12, w, 6, 3);
      g.fillStyle(m.timer > 0.3 ? 0x7fe0c4 : 0xffcf3f, this.seqAlpha);
      g.fillRoundedRect(x0, SHOW_Y + SHOW_H - 12, Math.max(6, w * Math.min(1, m.timer)), 6, 3);
    }
    this.trickLife = Math.max(0, this.trickLife - dt);
    this.showTrick.setAlpha(Math.min(1, this.trickLife * 3));
  }

  split(name: string, value: string, color: string) {
    this.splitName.setText(name);
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

  private updateCallouts(dt: number) {
    const h = this.headline;
    if (h) {
      h.life -= dt;
      const u = 1 - h.life / h.max;
      const pop = u < 0.08 ? 0.55 + (u / 0.08) * 0.62 : u < 0.16 ? 1.17 - ((u - 0.08) / 0.08) * 0.17 : 1;
      const alpha = Math.min(1, h.life / 0.22);
      h.text.setScale(pop).setAlpha(alpha);
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
      l.text.setAlpha(k * k).setScale(0.6 + 0.4 * k);
      l.text.y -= 160 * dt;
      if (l.sub) {
        l.sub.setAlpha(k);
        l.sub.y -= 160 * dt;
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
      t.rise += dt * 40;
      const u = 1 - t.life / t.max;
      t.text.setScale(u < 0.1 ? 0.6 + u * 4 : 1).setAlpha(Math.min(1, t.life / 0.25));
      t.text.setPosition(this.anchor.x, this.anchor.y - i * 42 - t.rise);
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
    const text0 = this.add(this.scene.add.text(W / 2, HEADLINE_Y, text, { fontFamily: this.fonts.display, fontSize: `${size}px`, color: opts.color, stroke: "#1d1830", strokeThickness: Math.round(size / 5), align: "center" }));
    text0.setOrigin(0.5, 0.5);
    let sub: Phaser.GameObjects.Text | null = null;
    if (opts.sub) {
      sub = this.add(this.scene.add.text(W / 2, HEADLINE_Y + size * 0.55 + 18, opts.sub, { fontFamily: this.fonts.body, fontSize: "28px", color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 7, fontStyle: "700", align: "center" }));
      sub.setOrigin(0.5, 0.5);
    }
    const life = opts.life ?? 1.15;
    this.headline = { key, text: text0, sub, life, max: life, priority: opts.priority, fade: 0, rise: 0 };
  }

  tag(key: string, text: string, color: string) {
    const same = this.tags.find((q) => q.key === key);
    if (same) {
      same.text.setText(text);
      same.life = same.max;
      same.rise = 0;
      return;
    }
    const t = this.add(this.scene.add.text(this.anchor.x, this.anchor.y, text, { fontFamily: this.fonts.display, fontSize: "32px", color, stroke: "#1d1830", strokeThickness: 7 }));
    t.setOrigin(0.5, 1);
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
    g.clear();
    const amount = speed < 1100 ? 0 : Math.min(1, (speed - 1100) / 1300);
    const want = reduced ? Math.round(amount * 4) : Math.round(amount * 14);
    while (this.streakList.length < want) {
      this.streakSeed = (this.streakSeed * 1664525 + 1013904223) >>> 0;
      const r1 = this.streakSeed / 4294967296;
      this.streakSeed = (this.streakSeed * 1664525 + 1013904223) >>> 0;
      const r2 = this.streakSeed / 4294967296;
      this.streakList.push({ x: W + r1 * 400, y: 300 + r2 * 560, len: 120 + r1 * 260, speed: 2400 + r2 * 1800 });
    }
    if (this.streakList.length > want) this.streakList.length = want;
    for (const s of this.streakList) {
      s.x -= s.speed * dt * (0.6 + amount);
      if (s.x + s.len < 0) {
        s.x = W + Math.random() * 300;
        s.y = 300 + Math.random() * 560;
      }
      g.lineStyle(3, 0xffffff, 0.1 + amount * 0.18);
      g.beginPath();
      g.moveTo(s.x, s.y);
      g.lineTo(s.x + s.len, s.y);
      g.strokePath();
    }
  }

  countdown(text: string | null) {
    this.countText.setVisible(text !== null);
    if (text) {
      this.countText.setText(text);
      this.countText.setScale(1.25);
      this.scene.tweens.add({ targets: this.countText, scale: 1, duration: 220, ease: "Back.out" });
    }
  }

  showLineup(entries: LineupEntry[]) {
    this.lineup?.destroy();
    const s = this.scene;
    const c = s.add.container(0, 0);
    const cw = 330;
    const gap = 26;
    const total = entries.length * cw + (entries.length - 1) * gap;
    entries.forEach((e, i) => {
      const x = W / 2 - total / 2 + i * (cw + gap);
      const y = this.touchOn ? 290 : 836;
      const g = s.add.graphics();
      g.fillStyle(INK, 0.92);
      g.fillRoundedRect(x, y, cw, 112, 20);
      g.fillStyle(e.color, 1);
      g.fillRoundedRect(x + 8, y + 8, 96, 96, 16);
      c.add(g);
      c.add(s.add.image(x + 56, y + 64, `${e.who}-head-${i === 0 ? "strain" : e.who === "lina" ? "smug" : "normal"}`).setScale(0.4).setOrigin(0.5, 0.62));
      c.add(s.add.text(x + 118, y + 22, e.name.toUpperCase(), { fontFamily: this.fonts.display, fontSize: "28px", color: "#fbf5e6" }));
      c.add(s.add.text(x + 118, y + 62, e.cart, { fontFamily: this.fonts.body, fontSize: "22px", color: "#cfc8e8", fontStyle: "700", wordWrap: { width: cw - 128 } }));
    });
    this.add(c);
    this.lineup = c;
    this.lineupAlpha = 1;
    c.setAlpha(1);
  }

  fadeLineup(dt: number) {
    if (!this.lineup) return;
    this.lineupAlpha = Math.max(0, this.lineupAlpha - dt * 2);
    this.lineup.setAlpha(this.lineupAlpha);
    if (this.lineupAlpha <= 0) {
      this.lineup.destroy();
      this.lineup = null;
    }
  }

  clearPopups() {
    if (this.headline) this.drop(this.headline);
    this.headline = null;
    for (const c of [...this.leaving, ...this.tags]) this.drop(c);
    this.leaving = [];
    this.tags = [];
    this.tipLife = 0;
    this.deltaLife = 0;
    this.deltaText.setAlpha(0);
    this.splitLife = 0;
    this.splitName.setAlpha(0);
    this.splitDelta.setAlpha(0);
    this.trickLife = 0;
    this.showTrick.setAlpha(0);
    this.shownSeq = "";
    this.seqAlpha = 0;
    this.showSeq.setAlpha(0);
  }
}
