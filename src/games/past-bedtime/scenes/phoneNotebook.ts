import * as Phaser from "phaser";
import type { Fonts } from "@/games/kit/ui";
import type { NightCopy } from "../copy";
import { partStars } from "../sim/score";
import type { Action, Dir } from "../sim/types";
import { iconKey, PAD_ICONS, STAR_ORIGIN_Y, STAR_SPAN, type NightIcon } from "./icons";
import { wobble, type Hud, type Layout, type Rect } from "./layout";
import { COLORS, legendIcon, moveIcon, PENCIL_SOFT, runsOf, starIcon, wobblyLine, type ButtonId, type LegendItem, type NoteKind, type NotebookMode, type NotebookView, type PageKind } from "./notebook";

const INK = 0x1d1830;
const PENCIL = "#2f2944";
const PAPER = 0xfbf5e6;
const SHEET = 0xfffdf4;
const NOTE = 0xfff1b8;
const NOTE_FOLD = 0xe9d98c;
const RULE = 0x9cc7ea;
const MARGIN = 0xef8a8a;
const DECK = 0x17112c;
const DECK_EDGE = 0x2e2552;
const PAD = 0xfbf5e6;
const SUN = 0xffe39a;
const DEPTH = { paper: 80, page: 90 };
const DIRS: Dir[] = [0, 1, 2, 3];
export const NIGHT_UI_RESET = "night-reset";

export type PhoneHandlers = {
  button: (id: ButtonId) => void;
  move: (dir: Dir) => void;
  preview: (dir: Dir | null) => void;
};

type ActionId = "wait" | "undo" | "hint" | "rules" | "moves";

type Button = {
  id: ActionId;
  root: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  w: number;
  h: number;
  fill: number;
  dim: boolean;
  down: number | null;
  iconY: number;
  labelY: number;
  x: number;
};

type Page = {
  kind: PageKind;
  root: Phaser.GameObjects.Container;
  content: Phaser.GameObjects.Container;
  mask: Phaser.GameObjects.Graphics;
  view: Rect;
  height: number;
  drag: { id: number; y0: number; c0: number; last: number; t: number } | null;
  velocity: number;
};

export class PhoneNotebook implements NotebookView {
  private u: number;
  private hud: Hud;
  private band: boolean;
  private compact: boolean;
  private texts!: { act: Phaser.GameObjects.Text; heading: Phaser.GameObjects.Text; moves: Phaser.GameObjects.Text; par: Phaser.GameObjects.Text };
  private stripInk!: Phaser.GameObjects.Graphics;
  private headerStars: Phaser.GameObjects.Image[] = [];
  private card!: Phaser.GameObjects.Container;
  private cardBg!: Phaser.GameObjects.Graphics;
  private cardText!: Phaser.GameObjects.Text;
  private cardSub!: Phaser.GameObjects.Text;
  private cardBox!: { w: number; h: number };
  private cardFill = NOTE;
  private stamp: Phaser.GameObjects.Container | null = null;
  private winInk: Phaser.GameObjects.GameObject[] = [];
  private padG!: Phaser.GameObjects.Graphics;
  private padArrows: Phaser.GameObjects.Image[] = [];
  private padBox!: { cx: number; cy: number; size: number };
  private padOwner: number | null = null;
  private padDir: Dir | null = null;
  private open: boolean[] = [true, true, true, true];
  private buttons = new Map<ActionId, Button>();
  private undoPulse?: Phaser.Tweens.Tween;
  private page: Page | null = null;
  private tip: { text: string; kind: NoteKind } | null = null;
  private rules: string[] = [];
  private legend: LegendItem[] = [];
  private planActions: Action[] = [];
  private hints = 0;
  private turns = 0;
  private par = 0;
  private title = "";
  private actLabel = "";
  private goal = "";
  private mode: NotebookMode = "play";
  private writeTimer?: Phaser.Time.TimerEvent;
  private offs: (() => void)[] = [];

  constructor(
    private scene: Phaser.Scene,
    private layout: Layout,
    private fonts: Fonts,
    private copy: NightCopy,
    private handlers: PhoneHandlers,
  ) {
    this.u = layout.unit;
    this.hud = layout.hud!;
    this.band = layout.kind === "band";
    this.compact = this.hud.compact;
    this.buildBackdrop();
    this.buildStrip();
    this.buildCard();
    this.buildPad();
    this.buildActions();
    this.listen();
  }

  private get round() {
    return this.fonts.round ?? this.fonts.body;
  }

  private px(css: number) {
    return css * this.u;
  }

  private keep<T extends Phaser.GameObjects.GameObject & { setDepth: (value: number) => unknown }>(obj: T) {
    obj.setDepth(DEPTH.paper);
    return obj;
  }

  private text(x: number, y: number, value: string, css: number, color: string, family: "round" | "display" = "round", weight = "600") {
    return this.scene.add.text(x, y, value, {
      fontFamily: family === "display" ? this.fonts.display : this.round,
      fontStyle: family === "round" ? weight : "normal",
      fontSize: `${Math.round(this.px(css))}px`,
      color,
      padding: { x: 2, y: Math.round(this.px(1.5)) },
    });
  }

  private listen() {
    const input = this.scene.input;
    const move = (p: Phaser.Input.Pointer) => this.onMove(p);
    const up = (p: Phaser.Input.Pointer) => this.onUp(p, true);
    const outside = (p: Phaser.Input.Pointer) => this.onUp(p, false);
    const tick = (_t: number, dt: number) => this.scrollTick(dt);
    input.on("pointermove", move);
    input.on("pointerup", up);
    input.on("pointerupoutside", outside);
    const loose = () => this.letGo();
    this.scene.events.on("update", tick);
    this.scene.events.on(Phaser.Scenes.Events.RESUME, loose);
    this.scene.events.on(Phaser.Scenes.Events.PAUSE, loose);
    this.offs.push(
      () => input.off("pointermove", move),
      () => input.off("pointerup", up),
      () => input.off("pointerupoutside", outside),
      () => this.scene.events.off("update", tick),
      () => this.scene.events.off(Phaser.Scenes.Events.RESUME, loose),
      () => this.scene.events.off(Phaser.Scenes.Events.PAUSE, loose),
    );
    this.scene.events.once(NIGHT_UI_RESET, () => {
      this.offs.forEach((off) => off());
      this.page?.mask.destroy();
      this.page = null;
    });
  }

  private buildBackdrop() {
    const s = this.scene;
    const h = this.hud;
    const g = this.keep(s.add.graphics());
    const deckRects = this.band ? h.rails : [h.deck];
    for (const r of deckRects) {
      g.fillStyle(DECK, 1);
      g.fillRect(r.x, r.y, r.w, r.h);
      const stars = Math.max(16, Math.round((r.w * r.h) / (4600 * this.u * this.u)));
      for (let i = 0; i < stars; i += 1) {
        g.fillStyle(0xd9ccff, 0.08 + wobble(i * 7 + r.x) * 0.12);
        g.fillCircle(r.x + wobble(i * 3 + r.y) * r.w, r.y + wobble(i * 11 + r.x) * r.h, this.px(0.8 + wobble(i) * 1.1));
      }
    }
    if (this.band) {
      const [left, right] = h.rails;
      g.fillStyle(INK, 1);
      g.fillRect(left.x + left.w - this.px(3), 0, this.px(3), left.h);
      g.fillRect(right.x, 0, this.px(3), right.h);
      g.fillStyle(DECK_EDGE, 1);
      g.fillRect(left.x + left.w - this.px(5), 0, this.px(2), left.h);
      g.fillRect(right.x + this.px(3), 0, this.px(2), right.h);
      this.drawPaper(g, h.strip, true);
      return;
    }
    g.fillStyle(INK, 1);
    g.fillRect(0, h.deck.y, h.deck.w, this.px(3));
    g.fillStyle(DECK_EDGE, 1);
    g.fillRect(0, h.deck.y + this.px(3), h.deck.w, this.px(2));
    const p = h.paper;
    g.fillStyle(0x05030f, 0.55);
    g.fillRect(p.x, p.y + p.h, p.w, this.px(6));
    this.drawPaper(g, p, false);
    g.fillStyle(INK, 1);
    g.fillRect(p.x, p.y + p.h - this.px(2.5), p.w, this.px(2.5));
  }

  private drawPaper(g: Phaser.GameObjects.Graphics, r: Rect, card: boolean) {
    const radius = card ? this.px(10) : 0;
    if (card) {
      g.fillStyle(INK, 0.9);
      g.fillRoundedRect(r.x + this.px(3), r.y + this.px(4), r.w, r.h, radius);
    }
    g.fillStyle(PAPER, 1);
    if (card) g.fillRoundedRect(r.x, r.y, r.w, r.h, radius);
    else g.fillRect(r.x, r.y, r.w, r.h);
    const top = r.y + this.px(card ? 20 : 24);
    g.lineStyle(this.px(1.1), RULE, 0.7);
    for (let y = top; y < r.y + r.h - this.px(4); y += this.px(19)) g.lineBetween(r.x + this.px(card ? 6 : 0), y, r.x + r.w - this.px(card ? 6 : 0), y);
    const marginX = card ? r.x + this.px(14) : this.hud.strip.x;
    g.lineStyle(this.px(1.3), MARGIN, 0.9);
    g.lineBetween(marginX, r.y + this.px(card ? 10 : 6), marginX, r.y + r.h - this.px(card ? 8 : 4));
    if (card) {
      g.lineStyle(this.px(2.5), INK, 1);
      g.strokeRoundedRect(r.x, r.y, r.w, r.h, radius);
    }
    const step = this.px(26);
    const count = Math.floor((r.w - this.px(16)) / step);
    const x0 = r.x + (r.w - (count - 1) * step) / 2;
    for (let i = 0; i < count; i += 1) {
      const rx = x0 + i * step;
      const ry = r.y + this.px(card ? 2 : 5);
      g.fillStyle(0x2b2150, 1);
      g.fillCircle(rx, ry + this.px(2), this.px(3.4));
      g.lineStyle(this.px(1.8), 0x9aa6b8, 1);
      g.beginPath();
      g.arc(rx, ry - this.px(2), this.px(5.6), Math.PI * 0.15, Math.PI * 0.85, true);
      g.strokePath();
    }
  }

  private buildStrip() {
    const st = this.hud.strip;
    const x0 = st.x + this.px(this.band ? 20 : 10);
    const act = this.keep(this.text(x0, st.y, "", this.compact ? 10.5 : 11.5, PENCIL_SOFT));
    const heading = this.keep(this.text(x0, st.y, "", this.band ? 16 : this.compact ? 17 : 18.5, PENCIL));
    const moves = this.keep(this.text(0, st.y, "", this.band ? 15 : this.compact ? 15 : 16.5, PENCIL, "round", "700"));
    const par = this.keep(this.text(0, st.y, "", this.compact ? 11.5 : 12.5, PENCIL_SOFT));
    this.texts = { act, heading, moves, par };
    this.headerStars = [0, 1, 2].map(() => this.keep(this.scene.add.image(0, 0, iconKey("starEmpty")).setOrigin(0.5, STAR_ORIGIN_Y)));
    this.stripInk = this.keep(this.scene.add.graphics());
    const hit = this.keep(this.scene.add.zone(0, 0, 10, 10).setOrigin(0).setInteractive({ useHandCursor: true }));
    hit.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.togglePage("moves");
    });
    hit.setData("stats", true);
    this.texts.moves.setData("hit", hit);
  }

  private layoutStrip() {
    const st = this.hud.strip;
    const t = this.texts;
    const g = this.stripInk;
    g.clear();
    const right = st.x + st.w - this.px(this.band ? 10 : 2);
    const starR = this.px(this.compact ? 5.2 : 5.8);
    const starsW = starR * 2 * 3 + this.px(4);
    if (this.band) {
      const x0 = st.x + this.px(20);
      const w = st.w - this.px(30);
      t.act.setText(this.actLabel).setPosition(x0, st.y + this.px(14));
      this.shrink(t.act, w, 11.5, 9.5, 1);
      t.heading.setText(this.title).setWordWrapWidth(w).setPosition(x0, t.act.y + t.act.height - this.px(1));
      this.shrink(t.heading, w, 16, 13, 2);
      const lineY = t.heading.y + t.heading.height - this.px(3);
      wobblyLine(g, x0, lineY, x0 + Math.min(w, this.lastLineWidth(t.heading) + this.px(6)), 0xef4f43, this.px(1.6), this.par * 7);
      t.moves.setOrigin(0, 0).setPosition(x0, lineY + this.px(6));
      t.par.setOrigin(0, 0).setPosition(x0, t.moves.y + t.moves.height - this.px(1));
      this.drawStars(g, x0 + t.par.width + this.px(6) + starR, t.par.y + t.par.height / 2, starR);
      this.sizeStatsHit(x0 - this.px(4), t.moves.y - this.px(2), w, t.par.y + t.par.height - t.moves.y + this.px(4));
      return;
    }
    t.moves.setOrigin(1, 0).setPosition(right, st.y + this.px(this.compact ? 1 : 2));
    t.par.setOrigin(1, 0).setPosition(right - starsW, t.moves.y + t.moves.height - this.px(2));
    this.drawStars(g, right - starsW + this.px(4) + starR, t.par.y + t.par.height / 2, starR);
    const statsW = Math.max(t.moves.width, t.par.width + starsW);
    const x0 = st.x + this.px(10);
    const maxW = right - statsW - this.px(14) - x0;
    t.act.setText(this.actLabel).setPosition(x0, st.y - this.px(1));
    this.shrink(t.act, right - x0 - Math.max(t.moves.width, t.par.width + starsW) - this.px(12), this.compact ? 10.5 : 11.5, 9.5, 1);
    t.heading.setText(this.title).setWordWrapWidth(0).setPosition(x0, t.act.y + t.act.height - this.px(this.compact ? 3 : 2));
    this.shrink(t.heading, maxW, this.compact ? 17 : 18.5, 13, 1);
    const lineY = t.heading.y + t.heading.height - this.px(3);
    wobblyLine(g, x0, lineY, x0 + Math.min(maxW, t.heading.width + this.px(6)), 0xef4f43, this.px(1.6), this.par * 7);
    this.sizeStatsHit(right - statsW - this.px(6), st.y - this.px(2), statsW + this.px(8), t.par.y + t.par.height - st.y + this.px(4));
  }

  private sizeStatsHit(x: number, y: number, w: number, h: number) {
    const hit = this.texts.moves.getData("hit") as Phaser.GameObjects.Zone;
    hit.setPosition(x, y).setSize(w, h);
    hit.input?.hitArea.setTo(0, 0, w, h);
  }

  private lastLineWidth(t: Phaser.GameObjects.Text) {
    const lines = t.getWrappedText();
    const probe = this.scene.add.text(0, 0, lines[lines.length - 1] ?? "", t.style.toJSON() as Phaser.Types.GameObjects.Text.TextStyle);
    const w = probe.width;
    probe.destroy();
    return w;
  }

  private shrink(t: Phaser.GameObjects.Text, maxW: number, css: number, minCss: number, lines: number) {
    const full = t.text;
    for (let size = css; size >= minCss; size -= 0.5) {
      t.setFontSize(Math.round(this.px(size)));
      if (lines > 1 ? t.getWrappedText().length <= lines && t.width <= maxW + 2 : t.width <= maxW) return;
    }
    if (lines > 1) return;
    let cut = full;
    while (cut.length > 3 && t.width > maxW) {
      cut = cut.slice(0, -1);
      t.setText(`${cut.trimEnd()}…`);
    }
  }

  private drawStars(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number) {
    const capped = this.hints > 0;
    const avail = partStars(this.par, this.turns, this.hints);
    for (let i = 0; i < 3; i += 1) {
      const cx = x + i * r * 2;
      this.headerStars[i]
        .setTexture(iconKey(i < avail ? "star" : "starEmpty"))
        .setPosition(cx, y)
        .setDisplaySize(r * STAR_SPAN, r * STAR_SPAN)
        .setAlpha(i < avail ? 1 : capped && i === 2 ? 0.2 : 0.4);
      if (capped && i === 2) {
        g.lineStyle(this.px(1.4), 0xc4352c, 0.8);
        g.lineBetween(cx - r, y + r * 0.8, cx + r, y - r * 0.8);
      }
    }
  }

  private buildCard() {
    const n = this.hud.note;
    const w = n.w;
    const h = n.h;
    this.cardBox = { w, h };
    this.cardBg = this.scene.add.graphics();
    const pad = this.px(12);
    this.cardText = this.text(pad - w / 2, 0, "", 14.5, PENCIL).setWordWrapWidth(w - pad * 2).setLineSpacing(-this.px(1));
    this.cardSub = this.text(pad - w / 2, 0, "", 12.5, PENCIL_SOFT).setWordWrapWidth(w - pad * 2);
    this.card = this.keep(this.scene.add.container(n.x + w / 2, n.y + h / 2, [this.cardBg, this.cardText, this.cardSub]).setAngle(this.band ? -1.2 : -0.7));
    this.paintCard(NOTE);
  }

  private fitCard(h: number) {
    if (this.band || Math.abs(h - this.cardBox.h) < 0.5) return;
    this.cardBox.h = h;
    this.card.y = this.hud.note.y + h / 2;
    this.paintCard(this.cardFill);
  }

  private paintCard(fill: number) {
    this.cardFill = fill;
    const { w, h } = this.cardBox;
    const g = this.cardBg;
    const r = this.px(5);
    const fold = this.px(this.band ? 16 : 14);
    g.clear();
    g.fillStyle(INK, 0.85);
    g.fillRoundedRect(-w / 2 + this.px(3), -h / 2 + this.px(4), w, h, r);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.lineStyle(this.px(2), INK, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    g.fillStyle(NOTE_FOLD, 1);
    g.fillTriangle(w / 2 - fold, h / 2, w / 2, h / 2 - fold, w / 2, h / 2);
    g.lineStyle(this.px(1.2), INK, 0.7);
    g.lineBetween(w / 2 - fold, h / 2, w / 2, h / 2 - fold);
    g.fillStyle(0xffffff, 0.55);
    g.fillRect(-this.px(26), -h / 2 - this.px(6), this.px(52), this.px(12));
  }

  private renderCard(animate: boolean, sub = "") {
    this.writeTimer?.remove();
    const tip = this.tip;
    const { w, h } = this.cardBox;
    const pad = this.px(12);
    const stampW = this.stamp ? (this.stamp.getData("w") as number) + this.px(8) : 0;
    const wrap = w - pad * 2 - stampW;
    const full = tip ? tip.text : "";
    this.cardText.setColor(tip ? COLORS[tip.kind] : PENCIL).setWordWrapWidth(wrap).setText(full);
    this.cardSub.setWordWrapWidth(wrap).setText(sub);
    const padY = this.px(this.compact ? 5 : 6);
    const room = this.band ? h - this.px(14) : this.hud.note.h - padY * 2;
    for (let size = this.band ? 14 : 14.5; size >= 11.5; size -= 0.5) {
      this.cardText.setFontSize(Math.round(this.px(size)));
      this.cardSub.setFontSize(Math.round(this.px(Math.max(11, size - 2))));
      if (this.cardText.height + (sub ? this.cardSub.height : 0) <= room) break;
    }
    const total = this.cardText.height + (sub ? this.cardSub.height : 0);
    if (!this.band) this.fitCard(Math.min(this.hud.note.h, Math.max(total, this.px(22)) + padY * 2));
    const top = this.band ? -this.cardBox.h / 2 + this.px(10) : -total / 2;
    this.cardText.setPosition(-w / 2 + pad, top);
    this.cardSub.setPosition(-w / 2 + pad, top + this.cardText.height);
    if (!animate || !tip) return;
    let shown = 1;
    this.cardText.setText(full.slice(0, shown));
    this.writeTimer = this.scene.time.addEvent({
      delay: 16,
      repeat: full.length,
      callback: () => {
        shown += 2;
        if (this.cardText.active) this.cardText.setText(full.slice(0, shown));
      },
    });
  }

  private buildPad() {
    const r = this.hud.pad;
    this.padBox = { cx: r.x + r.w / 2, cy: r.y + r.h / 2, size: r.w };
    this.padG = this.keep(this.scene.add.graphics());
    this.padArrows = PAD_ICONS.map((icon) => this.keep(this.scene.add.image(0, 0, iconKey(icon))));
    const margin = this.px(12);
    const zone = this.keep(this.scene.add.zone(r.x - margin, r.y - margin, r.w + margin * 2, r.h + margin * 2).setOrigin(0).setInteractive());
    zone.on("pointerdown", (p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      if (this.padOwner !== null) return;
      if (this.page) {
        this.closePage();
        return;
      }
      const dir = this.dirAt(p.x, p.y);
      if (dir === null) return;
      this.padOwner = p.id;
      this.setPadDir(dir);
    });
    this.drawPad();
  }

  private dirAt(x: number, y: number): Dir | null {
    const { cx, cy, size } = this.padBox;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < size * 0.13 || dist > size * 0.5 + this.px(26)) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
  }

  private setPadDir(dir: Dir | null) {
    if (dir === this.padDir) return;
    this.padDir = dir;
    this.drawPad();
    this.handlers.preview(dir);
  }

  private drawPad() {
    const g = this.padG;
    const { cx, cy, size } = this.padBox;
    const a = size / 3;
    const half = size / 2;
    const r = this.px(9);
    const line = this.px(2.6);
    const live = this.mode === "play";
    g.clear();
    const bars = (dx: number, dy: number, grow: number, color: number, alpha: number) => {
      g.fillStyle(color, alpha);
      g.fillRoundedRect(cx - half - grow + dx, cy - a / 2 - grow + dy, size + grow * 2, a + grow * 2, r + grow);
      g.fillRoundedRect(cx - a / 2 - grow + dx, cy - half - grow + dy, a + grow * 2, size + grow * 2, r + grow);
    };
    bars(this.px(2.5), this.px(4), line, INK, 0.7);
    bars(0, 0, line, INK, 1);
    bars(0, 0, 0, PAD, 1);
    g.fillStyle(0xffffff, 0.75);
    g.fillRoundedRect(cx - half + this.px(8), cy - a / 2 + this.px(5), a * 0.6, this.px(3), this.px(1.5));
    g.fillRoundedRect(cx - a / 2 + this.px(5), cy - half + this.px(8), this.px(3), a * 0.5, this.px(1.5));
    for (const d of DIRS) {
      const dx = d === 1 ? 1 : d === 3 ? -1 : 0;
      const dy = d === 2 ? 1 : d === 0 ? -1 : 0;
      const ax = cx + dx * a;
      const ay = cy + dy * a;
      const pressed = this.padDir === d;
      if (pressed) {
        g.fillStyle(SUN, 1);
        const inset = this.px(3);
        if (dx !== 0) g.fillRoundedRect(dx > 0 ? cx + a / 2 : cx - half + inset, cy - a / 2 + inset, a - inset, a - inset * 2, { tl: dx > 0 ? 0 : r, bl: dx > 0 ? 0 : r, tr: dx > 0 ? r : 0, br: dx > 0 ? r : 0 });
        else g.fillRoundedRect(cx - a / 2 + inset, dy > 0 ? cy + a / 2 : cy - half + inset, a - inset * 2, a - inset, { tl: dy > 0 ? 0 : r, tr: dy > 0 ? 0 : r, bl: dy > 0 ? r : 0, br: dy > 0 ? r : 0 });
      }
      const span = a * 0.8 * (pressed ? 1.12 : 1);
      this.padArrows[d]
        .setPosition(ax, ay)
        .setDisplaySize(span, span)
        .setAlpha(live && this.open[d] ? 1 : 0.3);
    }
    const dimple = a * 0.17;
    g.fillStyle(0xeee4ca, 1);
    g.fillCircle(cx, cy, dimple);
    g.lineStyle(this.px(1.2), INK, 0.14);
    g.beginPath();
    g.arc(cx, cy, dimple, Math.PI * 1.1, Math.PI * 1.9);
    g.strokePath();
  }

  private letGo() {
    if (this.padOwner !== null) {
      this.padOwner = null;
      this.setPadDir(null);
    }
    for (const b of this.buttons.values()) if (b.down !== null) this.release(b);
    if (this.page) this.page.drag = null;
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (this.padOwner === p.id) {
      this.setPadDir(this.dirAt(p.x, p.y));
      return;
    }
    for (const b of this.buttons.values()) {
      if (b.down !== p.id) continue;
      if (!this.inside(b, p.x, p.y, this.px(14))) this.release(b);
    }
    const page = this.page;
    if (page?.drag && page.drag.id === p.id) {
      const now = this.scene.time.now;
      const y = page.drag.c0 + (p.y - page.drag.y0);
      const dt = Math.max(1, now - page.drag.t);
      page.velocity = ((y - page.content.y) / dt) * 16;
      page.drag.t = now;
      this.scrollTo(y);
    }
  }

  private onUp(p: Phaser.Input.Pointer, onCanvas: boolean) {
    if (this.padOwner === p.id) {
      const dir = onCanvas ? this.dirAt(p.x, p.y) : null;
      this.padOwner = null;
      this.setPadDir(null);
      if (dir !== null) this.handlers.move(dir);
      return;
    }
    for (const b of this.buttons.values()) {
      if (b.down !== p.id) continue;
      const hit = onCanvas && this.inside(b, p.x, p.y, this.px(14));
      this.release(b);
      if (hit) this.fire(b.id);
    }
    if (this.page?.drag && this.page.drag.id === p.id) this.page.drag = null;
  }

  private inside(b: Button, x: number, y: number, pad: number) {
    const m = b.root.getWorldTransformMatrix();
    return x >= m.tx - pad && x <= m.tx + b.w + pad && y >= m.ty - pad && y <= m.ty + b.h + pad;
  }

  private fire(id: ActionId) {
    if (id === "rules" || id === "moves") {
      this.togglePage(id);
      return;
    }
    if (this.page) this.closePage();
    this.handlers.button(id);
  }

  private buildActions() {
    const r = this.hud.actions;
    const gap = this.px(this.band ? 7 : 6);
    const smallH = this.px(this.band || this.compact ? 40 : 42);
    const bigH = (r.h - smallH - gap * 2) / 2;
    this.makeButton("wait", r.x, r.y, r.w, bigH, 0xffffff, "wait", this.copy.buttons.wait, false);
    this.makeButton("undo", r.x, r.y + bigH + gap, r.w, bigH, 0xf9e0b0, "undo", this.copy.buttons.undo, false);
    const sw = (r.w - gap * 2) / 3;
    const sy = r.y + r.h - smallH;
    this.makeButton("hint", r.x, sy, sw, smallH, 0xe4dbff, "hint", this.copy.buttons.hint, true);
    this.makeButton("rules", r.x + sw + gap, sy, sw, smallH, 0xdff5d2, "rules", this.copy.touch.rules, true);
    this.makeButton("moves", r.x + (sw + gap) * 2, sy, sw, smallH, 0xfbe1ec, "moves", this.copy.touch.plan, true);
  }

  private makeButton(id: ActionId, x: number, y: number, w: number, h: number, fill: number, icon: NightIcon, label: string, small: boolean) {
    const bg = this.scene.add.graphics();
    const iconCss = small ? 19 : Math.min(24, (h / this.u) * 0.5);
    const img = this.scene.add.image(0, 0, iconKey(icon)).setDisplaySize(this.px(iconCss), this.px(iconCss));
    const t = this.text(0, 0, label, small ? 11.5 : this.band ? 15 : 16.5, PENCIL, "round", "700").setOrigin(0.5);
    if (small) {
      const maxW = w - this.px(12);
      img.setVisible(false);
      for (let size = 13.5; size > 9; size -= 0.5) {
        t.setFontSize(Math.round(this.px(size)));
        if (t.width <= maxW) break;
      }
      t.setPosition(w / 2, h / 2 + this.px(0.5));
    } else {
      const gap = this.px(8);
      const maxW = w - img.displayWidth - gap - this.px(20);
      for (let size = this.band ? 15 : 16.5; t.width > maxW && size > 11; size -= 0.5) t.setFontSize(Math.round(this.px(size)));
      const total = img.displayWidth + gap + t.width;
      img.setPosition((w - total) / 2 + img.displayWidth / 2, h / 2);
      t.setPosition(img.x + img.displayWidth / 2 + gap + t.width / 2, h / 2 + this.px(0.5));
    }
    const root = this.keep(this.scene.add.container(x, y, [bg, img, t]).setAngle((wobble(x * 0.01 + y * 0.003) - 0.5) * 1.6));
    const zone = this.scene.add.zone(0, 0, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    root.add(zone);
    const button: Button = { id, root, bg, icon: img, label: t, w, h, fill, dim: false, down: null, iconY: img.y, labelY: t.y, x };
    zone.on("pointerdown", (p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      if (button.down !== null) return;
      button.down = p.id;
      this.paintButton(button);
    });
    this.buttons.set(id, button);
    this.paintButton(button);
    return button;
  }

  private release(b: Button) {
    b.down = null;
    this.paintButton(b);
  }

  private paintButton(b: Button) {
    const g = b.bg;
    const r = this.px(10);
    const pressed = b.down !== null;
    const sx = pressed ? 0 : this.px(2.5);
    const sy = pressed ? this.px(1) : this.px(4);
    const lift = pressed ? this.px(2.5) : 0;
    g.clear();
    g.fillStyle(INK, 1);
    g.fillRoundedRect(sx, sy, b.w, b.h, r);
    g.fillStyle(pressed ? Phaser.Display.Color.IntegerToColor(b.fill).darken(8).color : b.fill, 1);
    g.fillRoundedRect(0, lift, b.w, b.h, r);
    g.lineStyle(this.px(2.5), INK, 1);
    g.strokeRoundedRect(0, lift, b.w, b.h, r);
    g.lineStyle(this.px(2), 0xffffff, 0.7);
    g.lineBetween(this.px(10), lift + this.px(5), Math.min(b.w * 0.4, this.px(44)), lift + this.px(5));
    b.icon.y = b.iconY + lift;
    b.label.y = b.labelY + lift;
    const alpha = b.dim ? 0.45 : 1;
    b.icon.setAlpha(alpha);
    b.label.setAlpha(alpha);
  }

  private setButton(id: ActionId, opts: { fill?: number; dim?: boolean; label?: string }) {
    const b = this.buttons.get(id);
    if (!b) return;
    if (opts.fill !== undefined) b.fill = opts.fill;
    if (opts.dim !== undefined) b.dim = opts.dim;
    if (opts.label !== undefined) b.label.setText(opts.label);
    this.paintButton(b);
  }

  private setUndoAlarm(on: boolean) {
    const b = this.buttons.get("undo");
    if (!b) return;
    this.undoPulse?.remove();
    this.undoPulse = undefined;
    b.root.setScale(1);
    this.setButton("undo", { fill: on ? SUN : 0xf9e0b0 });
    if (on) this.undoPulse = this.scene.tweens.add({ targets: b.icon, angle: { from: -12, to: 12 }, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    else b.icon.setAngle(0);
  }

  setDirs(open: readonly boolean[]) {
    this.open = [...open];
    this.drawPad();
  }

  setLevel(index: number, _total: number, title: string, goal: string, par: number, _progress: number[], legend: LegendItem[], _acts?: number[], actLabel = "") {
    this.title = `${index + 1}. ${title}`;
    this.goal = goal;
    this.par = par;
    this.turns = 0;
    this.hints = 0;
    this.legend = legend;
    this.actLabel = actLabel;
    this.texts.moves.setText(`${this.copy.moves}: 0`);
    this.texts.par.setText(`${this.copy.par}: ${par}`);
    this.closePage();
    this.clearStamp();
    this.mode = "play";
    this.tip = null;
    this.planActions = [];
    this.layoutStrip();
    this.renderCard(false);
    this.restoreDeck();
  }

  setStats(turns: number, hints: number) {
    this.hints = hints;
    this.turns = turns;
    this.texts.moves.setText(`${this.copy.moves}: ${turns}`);
    this.layoutStrip();
    if (this.page?.kind === "moves") this.openPage("moves");
  }

  intro(lines: string[]) {
    this.rules = lines;
    this.tip = lines.length ? { text: lines[lines.length - 1], kind: "info" } : null;
    this.renderCard(true);
  }

  note(text: string, kind: NoteKind = "info") {
    if (this.mode !== "play") return;
    if (this.tip?.text === text) return;
    this.tip = { text, kind };
    this.renderCard(true);
  }

  showing(text: string) {
    return this.mode === "play" && this.tip?.text === text;
  }

  clearNotes() {
    this.tip = null;
    this.renderCard(false);
  }

  setPlan(actions: readonly Action[]) {
    this.planActions = [...actions];
    if (this.page?.kind === "moves") this.openPage("moves");
  }

  strikeLast(done: () => void) {
    if (this.planActions.length === 0) {
      done();
      return;
    }
    this.scene.tweens.add({ targets: this.texts.moves, angle: { from: -5, to: 5 }, duration: 60, yoyo: true, repeat: 1, onComplete: () => this.texts.moves.setAngle(0) });
    this.scene.time.delayedCall(120, done);
  }

  private clearStamp() {
    this.stamp?.destroy();
    this.stamp = null;
    for (const o of this.winInk) o.destroy();
    this.winInk = [];
    this.cardText.setVisible(true);
    this.cardSub.setVisible(true);
    this.paintCard(NOTE);
  }

  showCaught(reason: string) {
    this.clearStamp();
    this.closePage();
    this.mode = "caught";
    this.tip = { text: reason, kind: "bad" };
    const { w, h } = this.cardBox;
    const label = this.text(0, 0, this.copy.notes.failed, this.band ? 13 : 14, "#c4352c", "display").setOrigin(0.5);
    const sw = label.width + this.px(12);
    const sh = label.height + this.px(2);
    const frame = this.scene.add.graphics();
    frame.fillStyle(INK, 0.5);
    frame.fillRoundedRect(-sw / 2 + this.px(2), -sh / 2 + this.px(3), sw, sh, this.px(6));
    frame.fillStyle(0xffe4dc, 1);
    frame.fillRoundedRect(-sw / 2, -sh / 2, sw, sh, this.px(6));
    frame.lineStyle(this.px(2.4), 0xc4352c, 1);
    frame.strokeRoundedRect(-sw / 2, -sh / 2, sw, sh, this.px(6));
    frame.lineStyle(this.px(1.2), 0xc4352c, 0.6);
    frame.strokeRoundedRect(-sw / 2 + this.px(3), -sh / 2 + this.px(3), sw - this.px(6), sh - this.px(6), this.px(4));
    const pos = this.band ? { x: 0, y: h / 2 - sh / 2 - this.px(10) } : { x: w / 2 - sw / 2 - this.px(10), y: 0 };
    this.stamp = this.scene.add.container(pos.x, pos.y, [frame, label]).setAngle(-6).setAlpha(0).setScale(1.7);
    this.stamp.setData("w", this.band ? 0 : sw);
    this.card.add(this.stamp);
    this.scene.tweens.add({ targets: this.stamp, alpha: 1, scale: 1, duration: 220, ease: "Back.easeOut" });
    this.renderCard(false, this.copy.notes.undoTip);
    this.setUndoAlarm(true);
    this.setButton("wait", { dim: true });
    this.drawPad();
  }

  clearCaught() {
    if (this.mode !== "caught") return;
    this.mode = "play";
    this.clearStamp();
    this.tip = null;
    this.renderCard(false);
    this.restoreDeck();
  }

  showWin(turns: number, par: number, stars: number) {
    this.clearStamp();
    this.closePage();
    this.mode = "won";
    this.tip = null;
    this.renderCard(false);
    this.cardText.setVisible(false);
    this.cardSub.setVisible(false);
    this.fitCard(this.hud.note.h);
    this.paintCard(0xd8f5c9);
    const { w, h } = this.cardBox;
    const title = this.text(0, 0, this.copy.wonTitle, this.band ? 17 : 19, "#23794b", "display").setOrigin(this.band ? 0.5 : 0, 0.5);
    const moves = this.text(0, 0, this.copy.wonMoves(turns, par), this.band ? 13.5 : 14.5, PENCIL).setOrigin(this.band ? 0.5 : 0, 0.5);
    const r = this.px(this.band ? 11 : 12);
    if (this.band) {
      title.setPosition(0, -h / 2 + this.px(22));
      moves.setPosition(0, title.y + this.px(52));
    } else {
      title.setPosition(-w / 2 + this.px(12), -h * 0.2);
      moves.setPosition(-w / 2 + this.px(12), h * 0.27);
    }
    const sx = this.band ? -r * 2.4 : w / 2 - this.px(18) - r * 5;
    const sy = this.band ? title.y + this.px(26) : 0;
    const earned = [0, 1, 2].map((i) => starIcon(this.scene, sx + i * r * 2.4, sy, r, i < stars).setVisible(false));
    this.card.add([...earned, title, moves]);
    this.winInk.push(...earned, title, moves);
    earned.forEach((img, i) => {
      this.scene.time.delayedCall(200 + i * 240, () => {
        if (img.active) img.setVisible(true);
      });
    });
    this.setButton("wait", { dim: true });
    this.setButton("undo", { dim: true });
    this.drawPad();
  }

  clearWin() {
    if (this.mode !== "won") return;
    this.mode = "play";
    this.clearStamp();
    this.renderCard(false);
    this.restoreDeck();
  }

  private restoreDeck() {
    this.setUndoAlarm(false);
    this.setButton("wait", { dim: false });
    this.setButton("undo", { dim: false });
    this.drawPad();
  }

  getMode() {
    return this.mode;
  }

  pageOpen() {
    return this.page !== null;
  }

  nudgeUndo() {
    const b = this.buttons.get("undo");
    if (!b) return;
    this.scene.tweens.killTweensOf(b.root);
    b.root.setX(b.x);
    this.scene.tweens.add({ targets: b.root, x: b.x + this.px(4), duration: 50, yoyo: true, repeat: 3, onComplete: () => b.root.setX(b.x) });
  }

  togglePage(kind: PageKind) {
    if (this.page?.kind === kind) this.closePage();
    else this.openPage(kind);
  }

  closePage() {
    if (!this.page) return;
    this.page.mask.destroy();
    this.page.root.destroy();
    this.page = null;
  }

  private openPage(kind: PageKind) {
    const keepScroll = this.page?.kind === kind ? this.page.content.y : null;
    this.closePage();
    const s = this.scene;
    const a = this.layout.map;
    const g = s.add.graphics();
    g.fillStyle(INK, 0.85);
    g.fillRoundedRect(a.x + this.px(3), a.y + this.px(5), a.w, a.h, this.px(12));
    g.fillStyle(SHEET, 1);
    g.fillRoundedRect(a.x, a.y, a.w, a.h, this.px(12));
    g.lineStyle(this.px(1.1), RULE, 0.55);
    for (let ly = a.y + this.px(52); ly < a.y + a.h - this.px(6); ly += this.px(19)) g.lineBetween(a.x + this.px(6), ly, a.x + a.w - this.px(6), ly);
    g.lineStyle(this.px(1.3), MARGIN, 0.8);
    g.lineBetween(a.x + this.px(26), a.y + this.px(4), a.x + this.px(26), a.y + a.h - this.px(4));
    g.lineStyle(this.px(2.5), INK, 1);
    g.strokeRoundedRect(a.x, a.y, a.w, a.h, this.px(12));
    const blocker = s.add.zone(a.x, a.y, a.w, a.h).setOrigin(0).setInteractive();
    const title = this.text(a.x + this.px(34), a.y + this.px(14), kind === "rules" ? this.copy.pages.rules : this.copy.pages.movesTitle, 17, PENCIL, "display");
    const closeLabel = this.text(0, 0, this.copy.pages.back, 14, PENCIL, "round", "700").setOrigin(0, 0.5);
    const closeIcon = s.add.image(0, 0, iconKey("close")).setDisplaySize(this.px(16), this.px(16));
    const cw = closeLabel.width + this.px(16) + this.px(26);
    const ch = this.px(36);
    const closeBg = s.add.graphics();
    closeBg.fillStyle(INK, 1);
    closeBg.fillRoundedRect(this.px(2), this.px(3), cw, ch, this.px(9));
    closeBg.fillStyle(0xffffff, 1);
    closeBg.fillRoundedRect(0, 0, cw, ch, this.px(9));
    closeBg.lineStyle(this.px(2), INK, 1);
    closeBg.strokeRoundedRect(0, 0, cw, ch, this.px(9));
    closeIcon.setPosition(this.px(16), ch / 2);
    closeLabel.setPosition(this.px(28), ch / 2);
    const close = s.add.container(a.x + a.w - cw - this.px(10), a.y + this.px(9), [closeBg, closeIcon, closeLabel]);
    const closeHit = s.add.zone(0, 0, cw, ch).setOrigin(0).setInteractive({ useHandCursor: true });
    close.add(closeHit);
    closeHit.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.closePage();
    });
    if (title.x + title.width > close.x - this.px(8)) this.shrink(title, close.x - this.px(8) - title.x, 17, 12, 1);
    const view: Rect = { x: a.x, y: a.y + this.px(54), w: a.w, h: a.h - this.px(60) };
    const content = s.add.container(0, view.y);
    const height = kind === "rules" ? this.fillRules(content, a) : this.fillMoves(content, a);
    const mask = s.make.graphics({}, false);
    mask.fillStyle(0xffffff, 1);
    mask.fillRect(view.x, view.y, view.w, view.h);
    content.setMask(mask.createGeometryMask());
    const fade = s.add.graphics();
    if (height > view.h) {
      fade.fillStyle(INK, 0.35);
      fade.fillRoundedRect(a.x + a.w - this.px(7), view.y + this.px(4), this.px(3), view.h - this.px(8), this.px(1.5));
    }
    const root = s.add.container(0, 0, [blocker, g, title, content, fade, close]).setDepth(DEPTH.page);
    const page: Page = { kind, root, content, mask, view, height, drag: null, velocity: 0 };
    blocker.on("pointerdown", (p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      page.velocity = 0;
      page.drag = { id: p.id, y0: p.y, c0: content.y, last: p.y, t: s.time.now };
    });
    blocker.on("wheel", (_p: Phaser.Input.Pointer, _dx: number, dy: number) => {
      page.velocity = 0;
      this.scrollTo(content.y - dy * 0.8);
    });
    this.page = page;
    if (keepScroll !== null) this.scrollTo(keepScroll);
  }

  private scrollTo(y: number) {
    const page = this.page;
    if (!page) return;
    const min = Math.min(page.view.y, page.view.y + page.view.h - page.height - this.px(12));
    page.content.y = Math.max(min, Math.min(page.view.y, y));
  }

  private scrollTick(dt: number) {
    const page = this.page;
    if (!page || page.drag || Math.abs(page.velocity) < 0.2) return;
    this.scrollTo(page.content.y + page.velocity * (dt / 16));
    page.velocity *= Math.pow(0.92, dt / 16);
  }

  private fillRules(content: Phaser.GameObjects.Container, a: Rect) {
    const x = a.x + this.px(34);
    const w = a.w - this.px(48);
    let y = this.px(2);
    const add = (t: Phaser.GameObjects.Text, after: number) => {
      t.setPosition(t.x, y);
      content.add(t);
      y += t.height + this.px(after);
      return t;
    };
    add(this.text(x, 0, this.title, 16, PENCIL).setWordWrapWidth(w), 0);
    add(this.text(x, 0, `${this.copy.touch.goal}: ${this.goal}`, 14.5, PENCIL).setWordWrapWidth(w), 4);
    const r = this.px(6);
    for (let i = 0; i < 3; i += 1) content.add(starIcon(this.scene, x + r + i * r * 2.3, y + this.px(11), r, false));
    const starsText = this.text(x + r * 7.4, 0, this.hints > 0 ? this.copy.starsCapped : this.copy.starsAt(this.par), 13, PENCIL_SOFT).setWordWrapWidth(w - r * 7.4);
    add(starsText, 14);
    add(this.text(x, 0, this.copy.pages.rulesTitle, 14, PENCIL_SOFT, "display"), 6);
    for (const line of this.rules) add(this.text(x, 0, `– ${line}`, 14.5, PENCIL).setWordWrapWidth(w).setLineSpacing(this.px(2)), 8);
    y += this.px(8);
    add(this.text(x, 0, this.copy.legendTitle, 14, PENCIL_SOFT, "display"), 8);
    const k = this.px(0.72);
    for (const item of this.legend) {
      const ig = legendIcon(this.scene, item).setScale(k);
      const t = this.text(x + this.px(34), 0, this.copy.legend[item], 14, PENCIL).setWordWrapWidth(w - this.px(34));
      t.setY(y);
      ig.setPosition(x + this.px(12), y + Math.max(this.px(11), t.height / 2));
      content.add([ig, t]);
      y += Math.max(t.height, this.px(26)) + this.px(8);
    }
    return y;
  }

  private fillMoves(content: Phaser.GameObjects.Container, a: Rect) {
    const left = a.x + this.px(34);
    const right = a.x + a.w - this.px(14);
    let x = left;
    let y = this.px(2);
    const runs = runsOf(this.planActions);
    if (!runs.length) {
      content.add(this.text(left, y, this.copy.pages.empty, 15, PENCIL_SOFT));
      return y + this.px(30);
    }
    for (const r of runs) {
      const size = this.px(r.action === "wait" ? 19 : 22);
      const arrow = this.scene.add.image(this.px(11), this.px(17), iconKey(moveIcon(r.action))).setDisplaySize(size, size);
      const cell: Phaser.GameObjects.GameObject[] = [arrow];
      let w = this.px(22);
      if (r.count > 1) {
        const n = this.text(w - this.px(0.5), this.px(12), String(r.count), 13.5, "#a85d08", "round", "700");
        cell.push(n);
        w += n.width - this.px(1);
      }
      if (x + w > right) {
        x = left;
        y += this.px(36);
      }
      content.add(this.scene.add.container(x, y, cell));
      x += w + this.px(9);
    }
    y += this.px(44);
    if (this.hints > 0) {
      content.add(this.text(left, y, this.copy.hintsUsed(this.hints), 14, PENCIL_SOFT));
      y += this.px(26);
    }
    return y;
  }
}

