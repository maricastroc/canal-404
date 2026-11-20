import * as Phaser from "phaser";
import type { Locale } from "@/i18n/locales";
import { formatNumber, ordinal } from "@/i18n/format";
import type { RaceCopy } from "../copy";
import { INK } from "./cart";
import { star } from "./fx";

export const W = 1920;
export const H = 1080;
const SPX = 1774;
const BAR_X = 690;
const BAR_W = 540;

export type TouchButton = "left" | "right" | "crouch" | "jump" | "restart" | "pause";

export type HudButton = TouchButton | "again";

type Circle = { id: TouchButton; x: number; y: number; r: number; label: string; icon?: "ccw" | "cw" };

type Callout = { key: string; text: Phaser.GameObjects.Text; sub: Phaser.GameObjects.Text | null; life: number; max: number; priority: number; fade: number; rise: number };

const HEADLINE_Y = 296;
const LEAVE = 0.08;

export type Marker = { x: number; color: number; letter: string; you?: boolean; ghost?: boolean };

export type StandingRow = { name: string; color: number; you: boolean; gap: string; flash: number; who: string };

export type EdgeTag = { side: "left" | "right"; y: number; color: number; text: string };

export type Standing = { name: string; time: number; you: boolean; who: string };

export type ResultsData = {
  time: number;
  best: number;
  newBest: boolean;
  standings: Standing[];
  place: number;
  perfect: number;
  ok: number;
  crashes: number;
  hits: number;
  shortcut: boolean;
  topSpeed: number;
  air: number;
  secret: boolean | null;
  secretKind: "gnome" | "pigeons";
  firstRace: boolean;
  starsBefore: number;
  calm: boolean;
  touch: boolean;
  keyboard: boolean;
};

const PLACE_TONES = [
  { medal: "dd-medal-1", fill: 0xffc83d, deep: "#c98a12", band: 0xffe39a },
  { medal: "dd-medal-2", fill: 0x9aa6b8, deep: "#5d6884", band: 0xdfe5ef },
  { medal: "dd-medal-3", fill: 0xff8a3d, deep: "#c4561b", band: 0xffd7b8 },
];

type AgainButton = { g: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Container; x: number; y: number; w: number; h: number; hover: boolean; down: boolean; focus: boolean; keycap: boolean };

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

export class Hud {
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
  private readonly speedText: Phaser.GameObjects.Text;
  private readonly unitText: Phaser.GameObjects.Text;
  private readonly tierText: Phaser.GameObjects.Text;
  private readonly deltaText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly hintBg: Phaser.GameObjects.Graphics;
  private readonly countText: Phaser.GameObjects.Text;
  private readonly pauseGroup: Phaser.GameObjects.Container;
  private readonly touchG: Phaser.GameObjects.Graphics;
  private readonly touchLabels: Phaser.GameObjects.Text[] = [];
  private results: Phaser.GameObjects.Container | null = null;
  private lineup: Phaser.GameObjects.Container | null = null;
  private lineupAlpha = 0;
  private resultButtons: { id: HudButton; x: number; y: number; w: number; h: number }[] = [];
  private again: AgainButton | null = null;
  private calm = false;
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
    for (let i = 0; i < 3; i += 1) {
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
    for (let i = 0; i < 2; i += 1) {
      const t = this.add(scene.add.text(0, 0, "", display(19, "#1d1830")));
      t.setOrigin(0.5, 0.5).setVisible(false);
      this.edgeTexts.push(t);
    }
    this.speedText = this.add(scene.add.text(SPX, 78, "0", display(48)));
    this.speedText.setOrigin(0.5, 0.5);
    this.unitText = this.add(scene.add.text(SPX, 112, copy.kmh, body(17, "#cfc8e8")));
    this.unitText.setOrigin(0.5, 0.5);
    this.tierText = this.add(scene.add.text(SPX, 146, copy.tiers[0].toUpperCase(), display(20, "#ffcf3f")));
    this.tierText.setOrigin(0.5, 0.5);
    this.deltaText = this.add(scene.add.text(SPX, 198, "", { fontFamily: fonts.display, fontSize: "32px", color: "#7fe0c4", stroke: "#1d1830", strokeThickness: 8 }));
    this.deltaText.setOrigin(0.5, 0.5).setAlpha(0);
    this.hintBg = this.add(scene.add.graphics());
    this.hintText = this.add(scene.add.text(W / 2, 1030, "", body(23, "#1d1830")));
    this.hintText.setOrigin(0.5, 0.5);
    this.tipText = this.add(scene.add.text(W / 2, 1030, "", body(23, "#1d1830")));
    this.tipText.setOrigin(0.5, 0.5).setAlpha(0);
    this.countText = this.add(scene.add.text(W / 2, 420, "", { fontFamily: fonts.display, fontSize: "170px", color: "#ffcf3f", stroke: "#1d1830", strokeThickness: 20 }));
    this.countText.setOrigin(0.5);
    this.touchG = this.add(scene.add.graphics());
    const pg = scene.add.graphics();
    pg.fillStyle(INK, 0.55);
    pg.fillRect(0, 0, W, H);
    const pt = scene.add.text(W / 2, H / 2 - 30, copy.paused, { fontFamily: fonts.display, fontSize: "110px", color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 16 }).setOrigin(0.5);
    const ph = scene.add.text(W / 2, H / 2 + 70, copy.pausedHint, body(32)).setOrigin(0.5);
    this.pauseGroup = this.add(scene.add.container(0, 0, [pg, pt, ph]));
    this.pauseGroup.setVisible(false);
  }

  private add<T extends Phaser.GameObjects.GameObject>(obj: T) {
    this.layer.add(obj);
    return obj;
  }

  private drawPanels() {
    const g = this.panel;
    g.clear();
    g.fillStyle(INK, 0.9);
    g.fillRoundedRect(20, 16, 376, 196, 18);
    g.lineStyle(4, 0xfbf5e6, 0.2);
    g.strokeRoundedRect(20, 16, 376, 196, 18);
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
    this.buttons = [];
    if (!this.touchOn) {
      this.touchG.clear();
      return;
    }
    this.buttons.push({ id: "left", x: 150, y: 920, r: 96, label: "", icon: "ccw" });
    this.buttons.push({ id: "right", x: 380, y: 920, r: 96, label: "", icon: "cw" });
    this.buttons.push({ id: "crouch", x: 1500, y: 940, r: 104, label: this.copy.touch.crouch });
    this.buttons.push({ id: "jump", x: 1770, y: 800, r: 112, label: this.copy.touch.jump });
    this.buttons.push({ id: "restart", x: 1660, y: 290, r: 44, label: "R" });
    this.buttons.push({ id: "pause", x: 1850, y: 290, r: 44, label: "II" });
    for (const b of this.buttons) {
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
    if (this.results) {
      for (const b of this.resultButtons) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id;
    }
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
      if (b.icon) {
        const cw = b.icon === "cw";
        const r = b.r * 0.46;
        const start = cw ? -2.6 : -0.54;
        const end = cw ? 0.5 : 2.64;
        g.lineStyle(10, 0xfbf5e6, 0.9);
        g.beginPath();
        g.arc(b.x, b.y, r, start, end, !cw);
        g.strokePath();
        const ex = b.x + Math.cos(end) * r;
        const ey = b.y + Math.sin(end) * r;
        const tx = cw ? -Math.sin(end) : Math.sin(end);
        const ty = cw ? Math.cos(end) : -Math.cos(end);
        g.fillStyle(0xfbf5e6, 0.9);
        g.fillTriangle(ex + tx * 22, ey + ty * 22, ex - ty * 16, ey + tx * 16, ex + ty * 16, ey - tx * 16);
      }
    }
  }

  update(
    dt: number,
    data: { time: number; rows: StandingRow[]; speed: number; tier: number; trend: number; markers: Marker[]; edges: EdgeTag[]; finishX: number; startX: number; reduced: boolean; showHint: boolean; anchor: { x: number; y: number } },
  ) {
    this.timeText.setText(formatTime(data.time, this.locale));
    const g = this.dynamic;
    g.clear();
    for (let i = 0; i < 3; i += 1) {
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
    if (Math.abs(data.trend) > 0.04) {
      const up = data.trend > 0;
      g.fillStyle(up ? 0x7fe0c4 : 0xff7a4a, Math.min(1, Math.abs(data.trend) * 2));
      const tx = SPX + 92;
      const ty = 80;
      if (up) g.fillTriangle(tx - 14, ty + 10, tx + 14, ty + 10, tx, ty - 14);
      else g.fillTriangle(tx - 14, ty - 10, tx + 14, ty - 10, tx, ty + 14);
    }
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
      t.setVisible(!!e);
      if (!e) continue;
      t.setText(e.text);
      const w = t.width + 52;
      const x = e.side === "right" ? W - 40 - w / 2 : 40 + w / 2;
      t.setPosition(x + (e.side === "right" ? -8 : 8), e.y);
      g.fillStyle(INK, 0.85);
      g.fillRoundedRect(x - w / 2 - 3, e.y - 22, w + 6, 44, 20);
      g.fillStyle(e.color, 1);
      g.fillRoundedRect(x - w / 2, e.y - 19, w, 38, 17);
      g.fillStyle(INK, 1);
      if (e.side === "right") g.fillTriangle(x + w / 2 - 24, e.y - 10, x + w / 2 - 24, e.y + 10, x + w / 2 - 10, e.y);
      else g.fillTriangle(x - w / 2 + 24, e.y - 10, x - w / 2 + 24, e.y + 10, x - w / 2 + 10, e.y);
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

  shout(key: string, text: string, opts: { priority: number; color: string; size?: number; sub?: string; life?: number }) {
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

  showLineup(entries: { who: string; name: string; cart: string; color: number }[]) {
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

  showPause(on: boolean) {
    this.pauseGroup.setVisible(on);
  }

  showResults(r: ResultsData) {
    this.hideResults();
    this.calm = r.calm;
    const s = this.scene;
    const res = this.copy.results;
    const c = s.add.container(0, 0);
    const pw = 1080;
    const ph = 800;
    const px = W / 2 - pw / 2;
    const py = H / 2 - ph / 2 + 10;
    const L = (x: number, y: number) => [x - pw / 2, y - ph / 2] as const;
    const display = (size: number, color = "#1d1830") => ({ fontFamily: this.fonts.display, fontSize: `${size}px`, color });
    const body = (size: number, color = "#1d1830") => ({ fontFamily: this.fonts.body, fontSize: `${size}px`, color, fontStyle: "700" });
    const raced = r.standings.length > 1;
    const tone = PLACE_TONES[Math.min(2, r.place - 1)];
    const dim = s.add.graphics();
    dim.fillStyle(INK, 0.5);
    dim.fillRect(0, 0, W, H);
    dim.setAlpha(0);
    c.add(dim);
    const panel = s.add.container(px + pw / 2, py + ph / 2);
    c.add(panel);
    const g = s.add.graphics();
    g.fillStyle(INK, 1);
    g.fillRoundedRect(-pw / 2 - 8, -ph / 2 - 8, pw + 16, ph + 16, 38);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 30);
    if (raced) {
      g.fillStyle(tone.band, 0.75);
      g.fillRoundedRect(-pw / 2, -ph / 2, pw, 318, { tl: 30, tr: 30, bl: 0, br: 0 });
    }
    g.lineStyle(4, INK, 0.18);
    const dash = (x0: number, y0: number, x1: number, y1: number) => {
      const len = Math.hypot(x1 - x0, y1 - y0);
      for (let d = 0; d < len; d += 22) {
        const a = d / len;
        const b = Math.min(1, (d + 11) / len);
        g.beginPath();
        g.moveTo(...L(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a));
        g.lineTo(...L(x0 + (x1 - x0) * b, y0 + (y1 - y0) * b));
        g.strokePath();
      }
    };
    dash(40, 318, pw - 40, 318);
    dash(532, 350, 532, 670);
    panel.add(g);
    const add = <T extends Phaser.GameObjects.GameObject>(o: T) => {
      panel.add(o);
      return o;
    };
    const text = (x: number, y: number, str: string, style: Phaser.Types.GameObjects.Text.TextStyle, ox = 0, oy = 0.5) => add(s.add.text(...L(x, y), str, style).setOrigin(ox, oy));
    const me = r.standings[r.place - 1];
    const tx = raced ? 340 : 60;
    const hy = raced ? 0 : -24;
    const placeLabel = raced ? text(tx, 64, res.place(ordinal(r.place, this.locale)).toUpperCase(), display(34, tone.deep)) : null;
    const ahead = r.place > 1 ? r.standings[r.place - 2] : null;
    const next = r.place === 1 ? r.standings[1] : null;
    const gapTo = ahead ?? next;
    const gap = gapTo && me ? Math.abs(me.time - gapTo.time) : Infinity;
    const headlineText = !raced ? this.copy.finishTitle : r.place === 1 ? res.headline.win : r.place === 2 ? (gap < 1 ? res.headline.close : res.headline.second) : res.headline.third;
    const headline = text(tx, 128 + hy, headlineText.toUpperCase(), display(r.place === 1 ? 70 : 60, r.place === 1 ? "#e8433a" : "#1d1830"));
    const time = text(tx, 212 + hy, formatTime(r.time, this.locale), display(84));
    let sticker: Phaser.GameObjects.Container | null = null;
    if (r.newBest) {
      const label = s.add.text(0, 0, this.copy.newBest.toUpperCase(), display(28)).setOrigin(0.5);
      const w = label.width + 36;
      const sg = s.add.graphics();
      sg.fillStyle(INK, 1);
      sg.fillRoundedRect(-w / 2 - 4, -26, w + 8, 52, 14);
      sg.fillStyle(0x63d6c1, 1);
      sg.fillRoundedRect(-w / 2, -22, w, 44, 11);
      sticker = add(s.add.container(...L(tx + time.width + 40 + w / 2, 208 + hy), [sg, label]));
      sticker.setAngle(-6);
    } else if (!r.firstRace) {
      text(tx + time.width + 32, 214, res.record(formatTime(r.best, this.locale)), body(26, "#6a6385"));
    }
    let verdict = "";
    if (ahead && me && (ahead.who === "lina" || ahead.who === "bruno")) verdict = res.behind[ahead.who](formatSeconds(gap, this.locale, gap < 1 ? 2 : 1));
    else if (next && me && (next.who === "lina" || next.who === "bruno")) verdict = res.wonBy[next.who](formatSeconds(gap, this.locale, gap < 1 ? 2 : 1));
    const verdictText = verdict ? text(tx, 280, verdict, body(28, r.place === 1 ? "#2f9e6e" : "#c4352c")) : null;

    let medal: Phaser.GameObjects.Container | null = null;
    const stars: Phaser.GameObjects.Image[] = [];
    let rays: Phaser.GameObjects.Graphics | null = null;
    if (raced) {
      const [mx, my] = L(178, 138);
      if (r.place === 1) {
        rays = add(s.add.graphics());
        rays.setPosition(mx, my);
        rays.fillStyle(0xfff1a8, 0.85);
        for (let k = 0; k < 14; k += 1) {
          const a = (k / 14) * Math.PI * 2;
          rays.fillTriangle(0, 0, Math.cos(a - 0.11) * 170, Math.sin(a - 0.11) * 170, Math.cos(a + 0.11) * 170, Math.sin(a + 0.11) * 170);
        }
        rays.setAlpha(0);
      }
      const badge = s.add.image(0, 0, tone.medal).setDisplaySize(226, 226);
      const num = s.add.text(0, 2, ordinal(r.place, this.locale), display(r.place === 1 ? 66 : 60)).setOrigin(0.5);
      if (num.width > 96) num.setScale(96 / num.width);
      medal = add(s.add.container(mx, my, [badge, num]));
      medal.setAngle(-6);
      for (let k = 0; k < 3; k += 1) {
        const earned = k < 4 - r.place;
        const [sx, sy] = L(178 + (k - 1) * 60, 282);
        stars.push(add(s.add.image(sx, sy, earned ? "dd-star-on" : "dd-star-off").setDisplaySize(54, 54)));
      }
    }

    text(50, 362, res.standings.toUpperCase(), display(26, "#7b62c4"));
    const rowY = (i: number) => 418 + i * 64;
    const leader = r.standings[0];
    const rows: Phaser.GameObjects.GameObject[][] = [];
    r.standings.forEach((st, i) => {
      const y = rowY(i);
      const parts: Phaser.GameObjects.GameObject[] = [];
      if (st.you) {
        const hl = add(s.add.graphics());
        hl.fillStyle(0xffc83d, 0.3);
        hl.fillRoundedRect(...L(36, y - 28), 474, 56, 18);
        parts.push(hl);
      }
      const t = PLACE_TONES[Math.min(2, i)];
      const disc = add(s.add.graphics());
      const [dx, dy] = L(76, y);
      disc.fillStyle(INK, 1);
      disc.fillCircle(dx, dy, 21);
      disc.fillStyle(t.fill, 1);
      disc.fillCircle(dx, dy, 17);
      parts.push(disc, text(76, y + 1, String(i + 1), display(22), 0.5, 0.5));
      parts.push(add(s.add.image(...L(126, y + 6), `${st.who}-head-${i === 0 ? "happy" : i === r.standings.length - 1 ? "sad" : "normal"}`).setScale(0.24).setOrigin(0.5, 0.62)));
      parts.push(text(160, y, st.name, body(30, st.you ? "#c4352c" : "#1d1830")));
      parts.push(text(490, i === 0 ? y : y - 9, formatTime(st.time, this.locale), body(30), 1, 0.5));
      if (i > 0 && leader) parts.push(text(490, y + 19, `+${formatSeconds(st.time - leader.time, this.locale, st.time - leader.time < 1 ? 2 : 1)} s`, body(19, "#6a6385"), 1, 0.5));
      rows.push(parts);
    });

    text(566, 362, res.yourRace.toUpperCase(), display(26, "#7b62c4"));
    const kmh = Math.round(r.topSpeed * 0.036);
    const highlights: [string, string, string | null][] = [
      [formatNumber(r.perfect, this.locale), res.perfect, null],
      [formatNumber(r.hits, this.locale), res.hits, null],
      [formatNumber(r.crashes, this.locale), res.crashes, null],
      [formatNumber(kmh, this.locale), res.top, this.copy.kmh],
    ];
    const statParts: Phaser.GameObjects.GameObject[] = [];
    highlights.forEach(([value, label, unit], k) => {
      const x = 566 + (k % 2) * 238;
      const y = 418 + Math.floor(k / 2) * 86;
      const v = text(x, y, value, display(48));
      statParts.push(v);
      if (unit) statParts.push(text(x + v.width + 8, y + 8, unit, body(20, "#6a6385")));
      statParts.push(text(x, y + 38, label, body(21, "#6a6385")));
    });
    let secretChip: Phaser.GameObjects.Container | null = null;
    const minor: [string, string][] = [
      [res.ok, formatNumber(r.ok, this.locale)],
      [res.air, `${formatSeconds(r.air, this.locale)} s`],
      [res.shortcut, r.shortcut ? res.yes : res.no],
    ];
    if (r.secret === false) minor.push([r.secretKind === "pigeons" ? res.pigeons : res.secret, res.no]);
    const mg = add(s.add.graphics());
    mg.lineStyle(3, INK, 0.12);
    mg.lineBetween(...L(566, 580), ...L(1036, 580));
    statParts.push(mg);
    minor.forEach(([label, value], k) => {
      const x = 566 + (k % 2) * 238;
      const y = 604 + Math.floor(k / 2) * 30;
      const l = text(x, y, `${label}:`, body(19, "#8a83a3"));
      statParts.push(l, text(x + l.width + 6, y, value, body(19, "#1d1830")));
    });
    if (r.secret === true) {
      const gnome = s.add.image(0, 0, r.secretKind === "pigeons" ? "f-pombo-a" : "p-gnome-gold").setOrigin(0.5, 0.5);
      gnome.setScale(44 / (gnome.height || 44));
      const label = s.add.text(28, 0, (r.secretKind === "pigeons" ? res.pigeonsFound : res.secretFound).toUpperCase(), display(22, "#c98a12")).setOrigin(0, 0.5);
      const w = label.width + 60;
      const cg = s.add.graphics();
      cg.fillStyle(INK, 1);
      cg.fillRoundedRect(-34, -30, w + 16, 60, 18);
      cg.fillStyle(0xfff1a8, 1);
      cg.fillRoundedRect(-30, -26, w + 8, 52, 15);
      secretChip = add(s.add.container(...L(pw - 48 - (w + 8) + 30, 62), [cg, gnome, label]));
      secretChip.setAngle(2);
    }

    this.resultButtons = [];
    const bw = 480;
    const bh = 86;
    const bx = pw / 2 - bw / 2;
    const by = ph - 104;
    const keycap = !r.touch;
    const ag = add(s.add.graphics());
    const word = s.add.text(keycap ? -30 : 0, 0, (r.touch ? res.againTouch : res.again).toUpperCase(), display(38)).setOrigin(0.5);
    const labelParts: Phaser.GameObjects.GameObject[] = [word];
    if (keycap) {
      const kg = s.add.graphics();
      const kx = word.width / 2 - 30 + 34;
      kg.fillStyle(INK, 1);
      kg.fillRoundedRect(kx - 4, -26, 52, 52, 12);
      kg.fillStyle(0xfbf5e6, 1);
      kg.fillRoundedRect(kx, -22, 44, 40, 9);
      kg.fillStyle(0xdcc394, 1);
      kg.fillRoundedRect(kx, 12, 44, 6, 3);
      labelParts.push(kg, s.add.text(kx + 22, -3, "R", display(24)).setOrigin(0.5));
    }
    const label = add(s.add.container(...L(pw / 2, by + bh / 2), labelParts));
    this.again = { g: ag, label, x: bx, y: by, w: bw, h: bh, hover: false, down: false, focus: r.keyboard, keycap };
    this.drawAgain(pw, ph);
    this.resultButtons.push({ id: "again", x: px + bx, y: py + by, w: bw, h: bh });

    this.add(c);
    this.results = c;
    const tw = (targets: unknown, props: Record<string, unknown>) => s.tweens.add({ ...props, targets } as Phaser.Types.Tweens.TweenBuilderConfig);
    tw(dim, { alpha: 1, duration: 200 });
    panel.setScale(0.86).setAlpha(0);
    tw(panel, { scale: 1, alpha: 1, duration: 260, ease: "Back.Out" });
    if (placeLabel) {
      placeLabel.setAlpha(0);
      tw(placeLabel, { alpha: 1, delay: 180, duration: 160 });
    }
    headline.setScale(1.35).setAlpha(0);
    tw(headline, { scale: 1, alpha: 1, delay: 230, duration: 280, ease: "Back.Out" });
    time.setAlpha(0);
    tw(time, { alpha: 1, delay: 320, duration: 200 });
    if (verdictText) {
      verdictText.setAlpha(0);
      tw(verdictText, { alpha: 1, delay: 420, duration: 200 });
    }
    if (medal) {
      const m = medal;
      m.setScale(2.3).setAlpha(0).setAngle(-34);
      tw(m, {
        scale: 1,
        alpha: 1,
        angle: -6,
        delay: 160,
        duration: 380,
        ease: "Back.Out",
        onComplete: () => this.burst(panel, m.x, m.y, r.place === 1 ? 12 : 7, r.place === 1 ? 0xffcf3f : r.place === 2 ? 0xdfe5ef : 0xff9a5c, r.place === 3),
      });
    }
    if (rays) {
      const ry = rays;
      tw(ry, { alpha: 1, delay: 380, duration: 300 });
      if (!r.calm) tw(ry, { angle: 360, duration: 9000, repeat: -1 });
    }
    stars.forEach((st, k) => {
      const earned = k < 4 - r.place;
      st.setScale(0).setAlpha(0);
      const sx = 54 / (st.width || 54);
      tw(st, {
        scale: sx,
        alpha: 1,
        delay: 560 + k * 140,
        duration: 260,
        ease: "Back.Out",
        onComplete: () => {
          if (earned && k >= r.starsBefore) this.burst(panel, st.x, st.y, 5, 0xffcf3f, false, 0.6);
        },
      });
    });
    if (sticker) {
      const st = sticker;
      st.setScale(0);
      tw(st, { scale: 1, delay: 660, duration: 320, ease: "Back.Out" });
      tw(st, { angle: 4, delay: 980, duration: 140, yoyo: true, repeat: 1 });
    }
    rows.forEach((parts, i) => {
      for (const o of parts) {
        const go = o as unknown as Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.Components.Transform;
        const x0 = go.x;
        go.setAlpha(0);
        go.x = x0 - 30;
        tw(go, { alpha: 1, x: x0, delay: 420 + i * 90, duration: 240, ease: "Cubic.Out" });
      }
    });
    for (const o of statParts) {
      const go = o as unknown as Phaser.GameObjects.Components.Alpha;
      go.setAlpha(0);
      tw(o, { alpha: 1, delay: 620, duration: 260 });
    }
    if (secretChip) {
      const sc = secretChip;
      sc.setScale(0);
      tw(sc, { scale: 1, delay: 860, duration: 300, ease: "Back.Out", onComplete: () => this.burst(panel, sc.x + 10, sc.y, 6, 0xffcf3f, false, 0.7) });
    }
    label.setAlpha(0);
    ag.setAlpha(0);
    tw([label, ag], { alpha: 1, delay: 300, duration: 200 });
  }

  private burst(parent: Phaser.GameObjects.Container, x: number, y: number, count: number, color: number, dust: boolean, size = 1) {
    if (this.calm) return;
    const s = this.scene;
    for (let k = 0; k < count; k += 1) {
      const g = s.add.graphics();
      const a = (k / count) * Math.PI * 2 + 0.3;
      if (dust) {
        g.fillStyle(0xe9dcc0, 0.95);
        g.fillCircle(0, 0, 16 * size);
      } else star(g, 0, 0, 13 * size, a, color, 1);
      g.setPosition(x, y);
      parent.add(g);
      const dist = (dust ? 110 : 150) * size;
      s.tweens.add({ targets: g, x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist * (dust ? 0.4 : 1), alpha: 0, scale: dust ? 1.8 : 0.4, duration: dust ? 520 : 460, ease: "Cubic.Out", onComplete: () => g.destroy() });
    }
  }

  private drawAgain(pw = 1080, ph = 760) {
    const a = this.again;
    if (!a) return;
    const g = a.g;
    const x = a.x - pw / 2;
    const y = a.y - ph / 2 + (a.down ? 3 : a.hover ? -3 : 0);
    g.clear();
    if (a.focus) {
      g.lineStyle(5, 0x2f86c9, 1);
      g.strokeRoundedRect(x - 14, y - 14, a.w + 28, a.h + 28, 30);
    }
    g.fillStyle(INK, 1);
    g.fillRoundedRect(x - 5, y - 5 + (a.down ? 0 : 6), a.w + 10, a.h + 10, 24);
    g.fillRoundedRect(x - 5, y - 5, a.w + 10, a.h + 10, 24);
    g.fillStyle(a.down ? 0xf2b92f : a.hover ? 0xffdc66 : 0xffcf3f, 1);
    g.fillRoundedRect(x, y, a.w, a.h, 19);
    g.fillStyle(0xffffff, a.hover ? 0.35 : 0.25);
    g.fillRoundedRect(x + 12, y + 8, a.w - 24, 14, 7);
    a.label.y = y + a.h / 2;
  }

  pointerAt(x: number, y: number, down = false) {
    const id = this.hitTest(x, y);
    const a = this.again;
    if (a) {
      const over = id === "again";
      if (over !== a.hover || (over && down) !== a.down || (over && a.focus)) {
        a.hover = over;
        a.down = over && down;
        a.focus = false;
        this.drawAgain();
      }
    }
    return id !== null;
  }

  keyboardFocus() {
    const a = this.again;
    if (!a || a.focus) return;
    a.focus = true;
    a.hover = false;
    this.drawAgain();
  }

  hideResults() {
    this.results?.destroy();
    this.results = null;
    this.again = null;
    this.resultButtons = [];
  }

  get resultsShown() {
    return this.results !== null;
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
  }
}
