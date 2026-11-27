import type * as Phaser from "phaser";
import { glyphOffset, type Fonts } from "@/games/kit/ui";
import { pressed } from "@/games/kit/press";
import type { LegendKey, NightCopy } from "../copy";
import { partStars } from "../sim/score";
import type { Action } from "../sim/types";
import { ARROW_ICONS, iconKey, STAR_ORIGIN_Y, STAR_SPAN, type NightIcon } from "./icons";
import { wobble, type Layout } from "./layout";

const INK = 0x1d1830;
const PENCIL = "#2f2944";
export const PENCIL_SOFT = "#665e83";
export const MARKER = 0xffe07a;
export const COLORS = { info: "#2f2944", good: "#23794b", warn: "#a85d08", bad: "#c4352c" } as const;
const LINE0 = 136;
const STEP = 38;
const TALLY_USED = 0x7d74a0;
const TALLY_OVER = 0xe0893a;
const BUTTON_ICONS: Partial<Record<ButtonId, NightIcon>> = { wait: "wait", undo: "undo", restart: "restart", hint: "hint", undoCaught: "undo" };
const BUTTON_FILLS: Partial<Record<ButtonId, number>> = { undoCaught: 0xffe39a, undo: 0xf9e0b0, hint: 0xe4dbff };

export type NoteKind = keyof typeof COLORS;

export type ButtonId = "wait" | "undo" | "restart" | "hint" | "undoCaught";

export type LegendItem = LegendKey;

export type PageKind = "rules" | "moves";

export type NotebookMode = "play" | "caught" | "won";

export interface NotebookView {
  setLevel(index: number, total: number, title: string, goal: string, par: number, progress: number[], legend: LegendItem[], acts?: number[], actLabel?: string): void;
  setStats(turns: number, hints: number): void;
  intro(lines: string[]): void;
  note(text: string, kind?: NoteKind): void;
  showing(text: string): boolean;
  clearNotes(): void;
  setPlan(actions: readonly Action[]): void;
  strikeLast(done: () => void): void;
  showCaught(reason: string, sub?: string): void;
  clearCaught(): void;
  showWin(turns: number, par: number, stars: number, isLast: boolean, line: string): void;
  clearWin(): void;
  getMode(): NotebookMode;
  togglePage(kind: PageKind): void;
  closePage(): void;
  pageOpen(): boolean;
  nudgeUndo(): void;
  setDirs(open: readonly boolean[]): void;
}

type Col = { x: number; w: number };
type Area = { x: number; y: number; w: number; h: number };

type Spots = {
  title: { x: number; y: number };
  mission: { x: number; y: number };
  tabs: Col & { y: number };
  act: Col & { line: number };
  heading: Col & { line: number };
  goal: Col & { line: number };
  stats: Col & { line: number };
  card: Area;
  links: Col & { y: number; h: number };
  win: Col & { line: number };
  page: Area;
  buttons: Col & { y: number; h: number };
  lastLine: number;
};

const lineY = (k: number) => LINE0 + STEP * k;

function spotsFor(layout: Layout): Spots {
  const { w, h } = layout.notebook;
  const buttons = { x: 72, w: w - 98, y: h - 168, h: 146 };
  const col = { x: 74, w: w - 100 };
  const linksH = 44;
  return {
    title: { x: 74, y: 28 },
    mission: { x: 76, y: 80 },
    tabs: { x: 72, w: w - 98, y: lineY(1) },
    act: { ...col, line: 3 },
    heading: { ...col, line: 4 },
    goal: { ...col, line: 5 },
    stats: { ...col, line: 8 },
    card: { x: 64, y: lineY(10) + 26, w: w - 90, h: lineY(14) - lineY(10) - 10 },
    links: { ...col, y: buttons.y - linksH - 26, h: linksH },
    win: { ...col, line: 11 },
    page: { x: 16, y: 118, w: w - 32, h: buttons.y - 132 },
    buttons,
    lastLine: 21,
  };
}

export function starIcon(scene: Phaser.Scene, x: number, y: number, r: number, filled: boolean) {
  return scene.add
    .image(x, y, iconKey(filled ? "star" : "starEmpty"))
    .setOrigin(0.5, STAR_ORIGIN_Y)
    .setDisplaySize(r * STAR_SPAN, r * STAR_SPAN)
    .setAlpha(filled ? 1 : 0.45);
}

export function wobblyLine(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, color: number, width: number, seed: number) {
  g.lineStyle(width, color, 1);
  g.beginPath();
  g.moveTo(x0, y0);
  const steps = Math.max(4, Math.round((x1 - x0) / 24));
  for (let i = 1; i <= steps; i += 1) g.lineTo(x0 + ((x1 - x0) * i) / steps, y0 + (wobble(seed + i) - 0.5) * 5);
  g.strokePath();
}

export type Run = { action: Action; count: number };

export function runsOf(actions: readonly Action[]): Run[] {
  const runs: Run[] = [];
  for (const a of actions) {
    const last = runs[runs.length - 1];
    if (last && last.action === a) last.count += 1;
    else runs.push({ action: a, count: 1 });
  }
  return runs;
}

function drawLegendIcon(g: Phaser.GameObjects.Graphics, item: LegendItem, x: number, y: number) {
  g.lineStyle(2.5, INK, 1);
  switch (item) {
    case "creak":
      g.fillStyle(0xe9c993, 1);
      g.fillRect(x - 15, y - 5, 30, 12);
      g.strokeRect(x - 15, y - 5, 30, 12);
      g.lineStyle(2.5, 0x7a62c4, 1);
      g.lineBetween(x - 11, y - 9, x - 7, y - 14);
      g.lineBetween(x - 7, y - 14, x - 3, y - 9);
      g.lineBetween(x + 3, y - 9, x + 7, y - 14);
      g.lineBetween(x + 7, y - 14, x + 11, y - 9);
      break;
    case "clock":
      g.fillStyle(0xb06c3f, 1);
      g.fillRect(x - 11, y - 7, 22, 20);
      g.strokeRect(x - 11, y - 7, 22, 20);
      g.fillTriangle(x - 15, y - 7, x + 15, y - 7, x, y - 17);
      g.strokeTriangle(x - 15, y - 7, x + 15, y - 7, x, y - 17);
      break;
    case "marks":
      g.fillStyle(0x9df0dc, 1);
      g.fillCircle(x - 8, y, 10);
      g.strokeCircle(x - 8, y, 10);
      g.fillStyle(0xff6b5a, 1);
      g.fillCircle(x + 9, y, 10);
      g.strokeCircle(x + 9, y, 10);
      g.fillStyle(INK, 1);
      g.fillRoundedRect(x + 7.5, y - 6, 3, 8, 1);
      g.fillCircle(x + 9, y + 5, 1.8);
      g.fillCircle(x - 10, y + 3, 2.6);
      g.fillRect(x - 8, y - 6, 1.8, 9);
      break;
    case "light":
      g.fillStyle(0xffd66b, 0.95);
      g.fillRect(x - 14, y - 13, 28, 26);
      g.lineStyle(5, INK, 0.5);
      g.strokeRect(x - 14, y - 13, 28, 26);
      g.lineStyle(3, 0xffb43d, 1);
      g.strokeRect(x - 14, y - 13, 28, 26);
      break;
    case "next":
    case "nextAny":
      g.fillStyle(0xffe39a, 0.5);
      g.fillRect(x - 14, y - 13, 28, 26);
      g.lineStyle(2.5, 0xd99a1e, 1);
      for (let k = -1; k <= 1; k += 1) g.lineBetween(x - 14 + Math.max(0, k * 10), y + 13 - Math.max(0, -k * 10), x + 14 + Math.min(0, k * 10), y - 13 - Math.min(0, -k * 10));
      for (const [ax, ay, bx, by] of [[-14, -13, 14, -13], [14, -13, 14, 13], [14, 13, -14, 13], [-14, 13, -14, -13]]) {
        g.lineBetween(x + ax, y + ay, x + ax + (bx - ax) * 0.35, y + ay + (by - ay) * 0.35);
        g.lineBetween(x + ax + (bx - ax) * 0.65, y + ay + (by - ay) * 0.65, x + bx, y + by);
      }
      break;
    case "nose":
      g.fillStyle(0xffb36b, 0.95);
      g.fillRect(x - 14, y - 13, 28, 26);
      g.lineStyle(5, INK, 0.5);
      g.strokeRect(x - 14, y - 13, 28, 26);
      g.lineStyle(3, 0xe0782c, 1);
      g.strokeRect(x - 14, y - 13, 28, 26);
      break;
    case "dog":
      g.fillStyle(0xd89a4e, 1);
      g.fillCircle(x, y + 4, 8);
      g.strokeCircle(x, y + 4, 8);
      for (let k = -1; k <= 1; k += 1) {
        g.fillCircle(x + k * 8, y - 8 - (k === 0 ? 3 : 0), 4);
        g.strokeCircle(x + k * 8, y - 8 - (k === 0 ? 3 : 0), 4);
      }
      break;
    case "hide":
      g.fillStyle(0xd9838f, 1);
      g.fillRect(x - 13, y - 13, 26, 26);
      g.lineStyle(2.5, INK, 1);
      g.strokeRect(x - 13, y - 13, 26, 26);
      g.lineBetween(x - 4, y - 13, x - 4, y + 13);
      g.lineBetween(x + 5, y - 13, x + 5, y + 13);
      break;
    case "cat":
      g.fillStyle(0x2a2342, 1);
      g.fillCircle(x, y + 2, 10);
      g.fillTriangle(x - 10, y - 2, x - 3, y - 8, x - 9, y - 14);
      g.fillTriangle(x + 10, y - 2, x + 3, y - 8, x + 9, y - 14);
      g.fillStyle(0xc8f07a, 1);
      g.fillCircle(x - 4, y, 2.5);
      g.fillCircle(x + 4, y, 2.5);
      break;
    case "route":
      for (const [dx, dy] of [[-9, 6], [-1, -2], [7, -10]]) {
        g.fillStyle(0xff8fc8, 1);
        g.fillEllipse(x + dx, y + dy, 10, 7);
        g.lineStyle(1.5, INK, 1);
        g.strokeEllipse(x + dx, y + dy, 10, 7);
      }
      break;
    case "toss":
      g.fillStyle(0xd9ccff, 1);
      g.fillRoundedRect(x - 15, y - 12, 30, 24, 8);
      g.strokeRoundedRect(x - 15, y - 12, 30, 24, 8);
      break;
    case "near":
    case "nearSeat":
    case "nearDog":
    case "nearBoth":
      break;
    case "goal":
      g.lineStyle(3, 0x2fa996, 1);
      g.strokeRect(x - 14, y - 13, 28, 26);
      break;
  }
}

const LEGEND_ICONS: Partial<Record<LegendItem, { icon: NightIcon; size: number; x: number; y: number }>> = {
  light: { icon: "watched", size: 15, x: -4, y: -4 },
  nose: { icon: "paw", size: 17, x: 0, y: 0 },
  toss: { icon: "toss", size: 17, x: 0, y: 0 },
  near: { icon: "near", size: 31, x: 0, y: 0 },
  nearSeat: { icon: "near", size: 31, x: 0, y: 0 },
  nearDog: { icon: "near", size: 31, x: 0, y: 0 },
  nearBoth: { icon: "near", size: 31, x: 0, y: 0 },
};

export function legendIcon(scene: Phaser.Scene, item: LegendItem) {
  const g = scene.add.graphics();
  drawLegendIcon(g, item, 0, 0);
  const parts: Phaser.GameObjects.GameObject[] = [g];
  const extra = LEGEND_ICONS[item];
  if (extra) parts.push(scene.add.image(extra.x, extra.y, iconKey(extra.icon)).setDisplaySize(extra.size, extra.size));
  return scene.add.container(0, 0, parts);
}

export function moveIcon(action: Action): NightIcon {
  return action === "wait" ? "wait" : ARROW_ICONS[action];
}

export class Notebook implements NotebookView {
  readonly container: Phaser.GameObjects.Container;
  private spots: Spots;
  private paper: Phaser.GameObjects.Graphics;
  private ink: Phaser.GameObjects.Graphics;
  private tally: Phaser.GameObjects.Graphics;
  private stars: Phaser.GameObjects.Image[];
  private texts: Record<string, Phaser.GameObjects.Text> = {};
  private card: Phaser.GameObjects.Container;
  private cardText: Phaser.GameObjects.Text;
  private cardSub: Phaser.GameObjects.Text;
  private tip: { text: string; kind: NoteKind } | null = null;
  private rules: string[] = [];
  private legend: LegendItem[] = [];
  private planActions: Action[] = [];
  private hints = 0;
  private turns = 0;
  private par = 0;
  private tabs: Phaser.GameObjects.Container[] = [];
  private buttons: Phaser.GameObjects.Container[] = [];
  private links: Phaser.GameObjects.Container[] = [];
  private stampObjects: Phaser.GameObjects.GameObject[] = [];
  private page: Phaser.GameObjects.Container | null = null;
  private pageKind: PageKind | null = null;
  private writeTimer?: Phaser.Time.TimerEvent;
  private mode: NotebookMode = "play";

  constructor(
    private scene: Phaser.Scene,
    private layout: Layout,
    private fonts: Fonts,
    private copy: NightCopy,
    private onButton: (id: ButtonId) => void,
  ) {
    this.spots = spotsFor(layout);
    const { x, y } = layout.notebook;
    this.paper = scene.add.graphics();
    this.ink = scene.add.graphics();
    this.tally = scene.add.graphics();
    this.container = scene.add.container(x, y, [this.paper, this.ink, this.tally]).setDepth(80);
    this.drawPaper();
    const sp = this.spots;
    this.texts.title = this.raw(sp.title.x, sp.title.y, copy.notebookTitle, 29, PENCIL, undefined, "display");
    this.texts.mission = this.raw(sp.mission.x, sp.mission.y, copy.mission, 22, PENCIL_SOFT);
    const missionRoom = layout.notebook.w - sp.mission.x - 24;
    if (this.texts.mission.width > missionRoom) this.texts.mission.setFontSize(Math.floor((parseFloat(String(this.texts.mission.style.fontSize)) * missionRoom) / this.texts.mission.width));
    this.texts.act = this.onLine(sp.act.x, sp.act.line, "", 25, PENCIL_SOFT, undefined, "round", "600", -6);
    this.texts.heading = this.onLine(sp.heading.x, sp.heading.line, "", 48, PENCIL, undefined, "round", "700");
    this.texts.goal = this.onLine(sp.goal.x, sp.goal.line, "", 31, PENCIL, sp.goal.w);
    this.texts.moves = this.onLine(sp.stats.x, sp.stats.line, "", 40, PENCIL, undefined, "round", "700");
    this.texts.par = this.onLine(sp.stats.x + sp.stats.w, sp.stats.line, "", 30, PENCIL_SOFT).setOrigin(1, 0);
    this.texts.over = this.onLine(sp.stats.x, sp.stats.line + 1, "", 24, COLORS.warn, undefined, "round", "700");
    this.texts.starsAt = this.onLine(sp.stats.x, sp.stats.line + 2, "", 22, PENCIL_SOFT);
    this.stars = [0, 1, 2].map((i) => starIcon(scene, sp.stats.x + sp.stats.w - 86 + i * 34, lineY(sp.stats.line + 1) - 17, 13, false));
    this.container.add(this.stars);
    const c = sp.card;
    const cardBg = scene.add.graphics();
    cardBg.fillStyle(INK, 0.85);
    cardBg.fillRoundedRect(5, 7, c.w, c.h, 6);
    cardBg.fillStyle(0xfff1b8, 1);
    cardBg.fillRoundedRect(0, 0, c.w, c.h, 6);
    cardBg.lineStyle(3, INK, 1);
    cardBg.strokeRoundedRect(0, 0, c.w, c.h, 6);
    cardBg.fillStyle(0xe9d98c, 1);
    cardBg.fillTriangle(c.w - 34, c.h, c.w, c.h - 34, c.w, c.h);
    cardBg.lineStyle(2, INK, 0.7);
    cardBg.lineBetween(c.w - 34, c.h, c.w, c.h - 34);
    cardBg.fillStyle(0xffffff, 0.55);
    cardBg.fillRect(c.w / 2 - 44, -10, 88, 22);
    this.cardText = scene.add.text(22, 26, "", { fontFamily: this.round, fontStyle: "600", fontSize: "27px", color: PENCIL, padding: { x: 2, y: 3 }, wordWrap: { width: c.w - 44 }, lineSpacing: 2 });
    this.cardSub = scene.add.text(22, 0, "", { fontFamily: this.round, fontStyle: "600", fontSize: "21px", color: PENCIL_SOFT, padding: { x: 2, y: 3 }, wordWrap: { width: c.w - 44 } });
    this.card = scene.add.container(c.x, c.y, [cardBg, this.cardText, this.cardSub]).setAngle(-1.2);
    this.container.add(this.card);
  }

  private get round() {
    return this.fonts.round ?? this.fonts.body;
  }

  private raw(x: number, y: number, value: string, size: number, color: string, wrap?: number, family: "round" | "display" = "round", weight = "600") {
    const t = this.scene.add.text(x, y, value, {
      fontFamily: family === "display" ? this.fonts.display : this.round,
      fontStyle: family === "round" ? weight : "normal",
      fontSize: `${family === "round" ? Math.round(size * 0.88) : size}px`,
      color,
      padding: { x: 2, y: 3 },
      wordWrap: wrap ? { width: wrap } : undefined,
    });
    this.container.add(t);
    return t;
  }

  private onLine(x: number, line: number, value: string, size: number, color: string, wrap?: number, family: "round" | "display" = "round", weight = "600", lift = 0) {
    const t = this.raw(x, 0, value || "Ág", size, color, wrap, family, weight);
    t.setData("line", line);
    this.seat(t, Math.round(size * 0.1) + lift);
    if (!value) t.setText("");
    return t;
  }

  private seat(t: Phaser.GameObjects.Text, drop = Math.round(parseFloat(String(t.style.fontSize)) * 0.114)) {
    const keep = t.text;
    if (!keep) t.setText("Ág");
    const metrics = t.style.getTextMetrics();
    t.setLineSpacing(STEP - (metrics.ascent + metrics.descent));
    t.setY(lineY(t.getData("line") as number) - 3 - metrics.ascent + drop);
    if (!keep) t.setText("");
  }

  private fitWidth(t: Phaser.GameObjects.Text, maxW: number, minPx: number) {
    let px = parseFloat(String(t.style.fontSize));
    while (t.width > maxW && px > minPx) {
      px -= 1;
      t.setFontSize(px);
    }
    this.seat(t);
  }

  private lineWidth(t: Phaser.GameObjects.Text, line: string) {
    const probe = this.scene.add.text(0, 0, line, t.style.toJSON() as Phaser.Types.GameObjects.Text.TextStyle).setWordWrapWidth(0);
    const w = probe.width;
    probe.destroy();
    return w;
  }

  private drawPaper() {
    const g = this.paper;
    const { w, h } = this.layout.notebook;
    const sp = this.spots;
    g.clear();
    g.fillStyle(INK, 0.9);
    g.fillRoundedRect(6, 8, w, h, 18);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(0, 0, w, h, 18);
    g.lineStyle(4, INK, 1);
    g.strokeRoundedRect(0, 0, w, h, 18);
    g.lineStyle(2, 0x9cc7ea, 0.75);
    for (let k = 0; k <= sp.lastLine; k += 1) g.lineBetween(14, lineY(k), w - 14, lineY(k));
    g.lineStyle(2.5, 0xef8a8a, 0.9);
    g.lineBetween(58, 12, 58, h - 12);
    for (let i = 0; i < Math.floor((w - 20) / 56); i += 1) {
      const rx = 36 + i * 56;
      g.fillStyle(0x2b2150, 1);
      g.fillCircle(rx, 12, 8);
      g.lineStyle(4, 0x9aa6b8, 1);
      g.beginPath();
      g.arc(rx, 2, 13, Math.PI * 0.15, Math.PI * 0.85, true);
      g.strokePath();
    }
    const dx = w - 92;
    const dy = 44;
    g.lineStyle(2.5, 0x8a83a3, 0.8);
    g.strokeRoundedRect(dx, dy, 56, 42, 8);
    g.strokeCircle(dx + 42, dy + 21, 5);
    g.lineBetween(dx + 18, dy - 12, dx + 26, dy);
    g.lineBetween(dx + 40, dy - 12, dx + 32, dy);
    g.lineBetween(dx + 8, dy + 13, dx + 28, dy + 29);
    g.lineBetween(dx + 28, dy + 13, dx + 8, dy + 29);
  }

  setLevel(index: number, total: number, title: string, goal: string, par: number, progress: number[], legend: LegendItem[], acts: number[] = [], actLabel = "") {
    const sp = this.spots;
    this.texts.heading.setText(`${index + 1}. ${title}`).setFontSize(Math.round(48 * 0.88));
    this.fitWidth(this.texts.heading, sp.heading.w, 30);
    this.texts.act.setText(actLabel);
    this.texts.goal.setText(goal);
    this.par = par;
    this.turns = 0;
    this.hints = 0;
    this.texts.starsAt.setText(this.copy.starsAt(par));
    this.texts.par.setText(`${this.copy.par}: ${par}`);
    this.legend = legend;
    this.drawInk(par);
    this.drawTally();
    this.buildTabs(index, total, progress, acts);
    this.closePage();
    this.clearStamp();
    this.mode = "play";
    this.tip = null;
    this.planActions = [];
    this.renderCard(false);
    this.buildLinks();
    this.buildButtons(["wait", "undo", "restart", "hint"]);
  }

  private drawInk(par: number) {
    const g = this.ink;
    const sp = this.spots;
    g.clear();
    const goal = this.texts.goal;
    goal.getWrappedText().forEach((line, i) => {
      const w = this.lineWidth(goal, line.trimEnd());
      if (w <= 4) return;
      const base = lineY(sp.goal.line + i);
      const tilt = (wobble(par * 3 + i) - 0.5) * 3;
      g.fillStyle(MARKER, 0.62);
      g.fillPoints(
        [
          { x: goal.x - 4, y: base - 24 + tilt },
          { x: goal.x + w + 8, y: base - 26 - tilt },
          { x: goal.x + w + 6, y: base - 3 - tilt },
          { x: goal.x - 2, y: base - 1 + tilt },
        ],
        true,
      );
    });
    wobblyLine(g, sp.heading.x, lineY(sp.heading.line) + 5, sp.heading.x + Math.min(sp.heading.w, this.texts.heading.width + 16), 0xef4f43, 4, par * 7);
  }

  private drawTally() {
    const g = this.tally;
    const sp = this.spots.stats;
    g.clear();
    const n = Math.max(1, this.par);
    const over = Math.max(0, this.turns - this.par);
    const starsLeft = sp.x + sp.w - 104;
    const room = starsLeft - sp.x - (over > 0 ? 56 : 10);
    const pitch = Math.min(26, room / n);
    const bw = Math.max(4, pitch - Math.min(5, pitch * 0.3));
    const bh = 20;
    const cy = lineY(sp.line + 1) - 17;
    for (let i = 0; i < n; i += 1) {
      const x = sp.x + 2 + i * pitch;
      const used = i < this.turns;
      const y = cy - bh / 2 + (wobble(i * 7 + n) - 0.5) * 2;
      g.fillStyle(used ? (over > 0 ? TALLY_OVER : TALLY_USED) : 0xffffff, used ? 0.95 : 0.75);
      g.fillRoundedRect(x, y, bw, bh, 3);
      g.lineStyle(2, INK, used ? 0.85 : 0.35);
      g.strokeRoundedRect(x, y, bw, bh, 3);
    }
    this.texts.over.setText(over > 0 ? `+${over}` : "").setX(sp.x + 2 + n * pitch + 4);
    const avail = partStars(this.par, this.turns, this.hints);
    this.stars.forEach((star, i) => {
      const on = i < avail;
      star.setTexture(iconKey(on ? "star" : "starEmpty")).setAlpha(on ? 1 : 0.4);
    });
    if (this.hints > 0) {
      const s = this.stars[2];
      g.lineStyle(3, 0xc4352c, 0.85);
      g.lineBetween(s.x - 15, s.y + 11, s.x + 15, s.y - 13);
    }
  }

  setStats(turns: number, hints: number) {
    this.texts.moves.setText(`${this.copy.moves}: ${turns}`);
    this.hints = hints;
    this.turns = turns;
    this.texts.starsAt.setText(hints > 0 ? this.copy.starsCapped : this.copy.starsAt(this.par));
    this.drawTally();
    if (this.pageKind === "moves") this.openPage("moves");
    this.buildLinks();
  }

  private buildLinks() {
    for (const l of this.links) l.destroy();
    this.links = [];
    if (this.mode === "won" || this.pageKind) return;
    const sp = this.spots.links;
    const items: { kind: PageKind; label: string; fill: number }[] = [
      { kind: "rules", label: this.copy.pages.rules, fill: 0xdff5d2 },
      { kind: "moves", label: `${this.copy.pages.moves} · ${this.planActions.length}`, fill: 0xfbe1ec },
    ];
    const gap = 12;
    const h = sp.h;
    const labels = items.map((it) => this.scene.add.text(0, 0, it.label, { fontFamily: this.round, fontStyle: "700", fontSize: "21px", color: PENCIL, padding: { x: 2, y: 2 } }).setOrigin(0.5));
    const natural = labels.map((t) => t.width + 24);
    const total = natural.reduce((a, b) => a + b, 0);
    const room = sp.w - gap;
    const widths = total > room ? natural.map((n) => Math.max(room * 0.38, (room * n) / total)) : natural.map(() => room / 2);
    const fit = Math.min(1, ...labels.map((t, i) => (widths[i] - 24) / t.width));
    let left = sp.x;
    items.forEach((it, i) => {
      const w = widths[i];
      const g = this.scene.add.graphics();
      g.fillStyle(INK, 0.8);
      g.fillRoundedRect(2, 3, w, h, 10);
      g.fillStyle(it.fill, 1);
      g.fillRoundedRect(0, 0, w, h, 10);
      g.lineStyle(2, INK, 0.9);
      g.strokeRoundedRect(0, 0, w, h, 10);
      const t = labels[i].setPosition(w / 2, h / 2);
      if (fit < 1) t.setFontSize(Math.floor(21 * fit));
      const c = this.scene.add.container(left, sp.y, [g, t]).setAngle((wobble(i * 5 + 2) - 0.5) * 2);
      left += w + gap;
      this.makeClickable(c, w, h, () => this.openPage(it.kind));
      this.container.add(c);
      this.links.push(c);
    });
  }

  togglePage(kind: PageKind) {
    if (this.pageKind === kind) this.closePage();
    else this.openPage(kind);
  }

  closePage() {
    this.page?.destroy();
    this.page = null;
    const was = this.pageKind;
    this.pageKind = null;
    if (was) this.buildLinks();
  }

  private openPage(kind: PageKind) {
    this.page?.destroy();
    this.pageKind = kind;
    const a = this.spots.page;
    const g = this.scene.add.graphics();
    g.fillStyle(INK, 0.85);
    g.fillRoundedRect(6, 8, a.w, a.h, 12);
    g.fillStyle(0xfffdf4, 1);
    g.fillRoundedRect(0, 0, a.w, a.h, 12);
    g.lineStyle(3, INK, 1);
    g.strokeRoundedRect(0, 0, a.w, a.h, 12);
    g.lineStyle(2, 0x9cc7ea, 0.6);
    for (let ly = 70; ly < a.h - 10; ly += STEP) g.lineBetween(10, ly, a.w - 10, ly);
    g.lineStyle(2.5, 0xef8a8a, 0.8);
    g.lineBetween(44, 6, 44, a.h - 6);
    const parts: Phaser.GameObjects.GameObject[] = [g];
    const title = this.scene.add.text(58, 14, kind === "rules" ? this.copy.pages.rulesTitle : this.copy.pages.movesTitle, { fontFamily: this.fonts.display, fontSize: "30px", color: PENCIL, padding: { x: 2, y: 3 } });
    parts.push(title);
    const closeW = 120;
    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(INK, 1);
    closeBg.fillRoundedRect(3, 4, closeW, 46, 10);
    closeBg.fillStyle(0xffffff, 1);
    closeBg.fillRoundedRect(0, 0, closeW, 46, 10);
    closeBg.lineStyle(2.5, INK, 1);
    closeBg.strokeRoundedRect(0, 0, closeW, 46, 10);
    const closeT = this.scene.add.text(0, 23, this.copy.pages.back, { fontFamily: this.round, fontStyle: "600", fontSize: "20px", color: PENCIL, padding: { x: 2, y: 2 } }).setOrigin(0, 0.5);
    const closeIcon = this.scene.add.image(0, 23 - glyphOffset(closeT), iconKey("close")).setDisplaySize(17, 17);
    const closeLeft = (closeW - (closeIcon.displayWidth + 6 + closeT.width)) / 2;
    closeIcon.setX(closeLeft + closeIcon.displayWidth / 2);
    closeT.setX(closeLeft + closeIcon.displayWidth + 6);
    const close = this.scene.add.container(a.w - closeW - 14, 14, [closeBg, closeIcon, closeT]);
    this.makeClickable(close, closeW, 46, () => this.closePage());
    parts.push(close);
    let y = 80;
    const textW = a.w - 80;
    if (kind === "rules") {
      const body: Phaser.GameObjects.GameObject[] = [];
      for (const line of this.rules) {
        const t = this.scene.add.text(58, y, `– ${line}`, { fontFamily: this.round, fontStyle: "600", fontSize: "21px", color: PENCIL, padding: { x: 2, y: 3 }, wordWrap: { width: textW }, lineSpacing: 6 });
        body.push(t);
        y += t.height + 10;
      }
      y += 12;
      const sub = this.scene.add.text(58, y, this.copy.legendTitle, { fontFamily: this.fonts.display, fontSize: "22px", color: PENCIL_SOFT, padding: { x: 2, y: 3 } });
      body.push(sub);
      y += 46;
      for (const item of this.legend) {
        const ig = legendIcon(this.scene, item).setPosition(76, y + 16);
        const t = this.scene.add.text(104, y, this.copy.legend[item], { fontFamily: this.round, fontStyle: "600", fontSize: "20px", color: PENCIL, padding: { x: 2, y: 3 }, wordWrap: { width: a.w - 124 } });
        body.push(ig, t);
        y += Math.max(40, t.height + 12);
      }
      const fit = Math.min(1, (a.h - 92) / (y - 80));
      parts.push(this.scene.add.container(58 * (1 - fit), 80 * (1 - fit), body).setScale(fit));
    } else {
      const runs = runsOf(this.planActions);
      if (!runs.length) parts.push(this.scene.add.text(58, y, this.copy.pages.empty, { fontFamily: this.round, fontStyle: "600", fontSize: "21px", color: PENCIL_SOFT, padding: { x: 2, y: 3 } }));
      let x = 58;
      for (const r of runs) {
        const size = r.action === "wait" ? 26 : 30;
        const arrow = this.scene.add.image(15, 24, iconKey(moveIcon(r.action))).setDisplaySize(size, size);
        const cell: Phaser.GameObjects.GameObject[] = [arrow];
        let w = 30;
        if (r.count > 1) {
          const n = this.scene.add.text(w - 1, 18, String(r.count), { fontFamily: this.round, fontStyle: "700", fontSize: "20px", color: "#a85d08", padding: { x: 2, y: 3 } });
          cell.push(n);
          w += n.width - 3;
        }
        if (x + w > a.w - 20) {
          x = 58;
          y += 46;
        }
        parts.push(this.scene.add.container(x, y, cell));
        x += w + 12;
      }
      if (this.hints > 0) parts.push(this.scene.add.text(58, y + 60, this.copy.hintsUsed(this.hints), { fontFamily: this.round, fontStyle: "600", fontSize: "20px", color: PENCIL_SOFT, padding: { x: 2, y: 3 } }));
    }
    this.page = this.scene.add.container(a.x, a.y, parts);
    this.container.add(this.page);
    this.buildLinks();
  }

  private renderCard(animate: boolean, sub = "") {
    this.writeTimer?.remove();
    const tip = this.tip;
    this.card.setVisible(this.mode !== "won");
    this.cardText.setText(tip ? tip.text : "").setColor(tip ? COLORS[tip.kind] : PENCIL);
    this.cardSub.setText(sub);
    const room = this.spots.card.h - this.cardText.y - 10;
    for (let size = 27; size >= 21; size -= 1) {
      this.cardText.setFontSize(size);
      this.cardSub.setFontSize(size - 6);
      if (this.cardText.height + (sub ? this.cardSub.height + 8 : 0) <= room) break;
    }
    this.cardSub.setY(this.cardText.y + this.cardText.height + 8);
    if (!animate || !tip) return;
    const full = tip.text;
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

  note(text: string, kind: NoteKind = "info") {
    if (this.mode !== "play") return;
    if (this.tip?.text === text) return;
    this.tip = { text, kind };
    this.renderCard(true);
  }

  showing(text: string) {
    return this.mode === "play" && this.tip?.text === text;
  }

  intro(lines: string[]) {
    this.rules = lines;
    this.tip = lines.length ? { text: lines[0], kind: "info" } : null;
    this.renderCard(true);
  }

  clearNotes() {
    this.tip = null;
    this.renderCard(false);
  }

  setPlan(actions: readonly Action[]) {
    this.planActions = [...actions];
    if (this.pageKind === "moves") this.openPage("moves");
    else this.buildLinks();
  }

  strikeLast(done: () => void) {
    if (this.planActions.length === 0) {
      done();
      return;
    }
    const target = this.links[1];
    if (target) this.scene.tweens.add({ targets: target, angle: { from: -6, to: 6 }, duration: 60, yoyo: true, repeat: 1 });
    this.scene.time.delayedCall(120, done);
  }

  private clearStamp() {
    for (const o of this.stampObjects) o.destroy();
    this.stampObjects = [];
  }

  showCaught(reason: string, sub = this.copy.notes.undoTip) {
    this.clearStamp();
    this.closePage();
    this.mode = "caught";
    this.tip = { text: reason, kind: "bad" };
    this.renderCard(false, sub);
    const c = this.spots.card;
    const stamp = this.scene.add.text(0, 0, this.copy.notes.failed, { fontFamily: this.fonts.display, fontSize: "34px", color: "#c4352c", padding: { x: 10, y: 6 } }).setOrigin(0.5);
    stamp.setFontSize(30);
    const sw = stamp.width + 16;
    const sh = stamp.height + 2;
    const frame = this.scene.add.graphics();
    frame.fillStyle(INK, 0.55);
    frame.fillRoundedRect(-sw / 2 + 3, -sh / 2 + 4, sw, sh, 10);
    frame.fillStyle(0xffe4dc, 1);
    frame.fillRoundedRect(-sw / 2, -sh / 2, sw, sh, 10);
    frame.lineStyle(4, 0xc4352c, 1);
    frame.strokeRoundedRect(-sw / 2, -sh / 2, sw, sh, 10);
    frame.lineStyle(2, 0xc4352c, 0.6);
    frame.strokeRoundedRect(-sw / 2 + 5, -sh / 2 + 5, sw - 10, sh - 10, 7);
    const box = this.scene.add.container(c.x + c.w - sw / 2 - 6, c.y + c.h + sh / 2 - 10, [frame, stamp]).setAngle(-5).setAlpha(0).setScale(1.8);
    this.container.add(box);
    this.stampObjects.push(box);
    this.scene.tweens.add({ targets: box, alpha: 1, scale: 1, duration: 220, ease: "Back.easeOut" });
    this.buildButtons(["undoCaught", "restart"]);
  }

  clearCaught() {
    if (this.mode !== "caught") return;
    this.mode = "play";
    this.clearStamp();
    this.tip = null;
    this.renderCard(false);
    this.buildButtons(["wait", "undo", "restart", "hint"]);
  }

  showWin(turns: number, par: number, stars: number, isLast: boolean, line: string) {
    this.clearStamp();
    this.closePage();
    this.mode = "won";
    this.renderCard(false);
    this.buildLinks();
    const sp = this.spots.win;
    const title = this.onLine(sp.x, sp.line, this.copy.wonTitle, 36, "#23794b", undefined, "display");
    const starY = lineY(sp.line + 2) - 20;
    const earned = [0, 1, 2].map((i) => starIcon(this.scene, sp.x + 34 + i * 72, starY, 28, i < stars).setVisible(false));
    this.container.add(earned);
    earned.forEach((img, i) => {
      this.scene.time.delayedCall(200 + i * 240, () => {
        if (img.active) img.setVisible(true);
      });
    });
    const moves = this.onLine(sp.x, sp.line + 3, this.copy.wonMoves(turns, par), 30, PENCIL);
    const extra = turns - par;
    const verdict = this.onLine(sp.x, sp.line + 4, extra <= 0 ? (stars < 3 ? this.copy.wonWithHint : this.copy.wonPerfect) : this.copy.wonClose(extra), 27, PENCIL_SOFT, sp.w);
    const verdictLines = Math.max(1, verdict.getWrappedText().length);
    const quote = this.onLine(sp.x, sp.line + 4 + verdictLines, `“${line}”`, 30, PENCIL, sp.w);
    const quoteLines = Math.max(1, quote.getWrappedText().length);
    this.stampObjects.push(title, ...earned, moves, verdict, quote);
    if (isLast) this.stampObjects.push(this.onLine(sp.x, sp.line + 4 + verdictLines + quoteLines, this.copy.lastLevel, 25, PENCIL_SOFT, sp.w));
    this.buildButtons([]);
  }

  clearWin() {
    if (this.mode !== "won") return;
    this.mode = "play";
    this.clearStamp();
    this.renderCard(false);
    this.buildLinks();
    this.buildButtons(["wait", "undo", "restart", "hint"]);
  }

  getMode() {
    return this.mode;
  }

  pageOpen() {
    return this.pageKind !== null;
  }

  nudgeUndo() {
    this.scene.tweens.add({ targets: this.container, x: this.container.x + 6, duration: 50, yoyo: true, repeat: 3 });
  }

  setDirs() {}

  private buildTabs(active: number, total: number, progress: number[], acts: number[]) {
    for (const t of this.tabs) t.destroy();
    this.tabs = [];
    const sp = this.spots.tabs;
    const actColors = [0xffe39a, 0xf9b6d4, 0xa9dcf7, 0xc8f0b4];
    const groups = new Set(acts.slice(0, total)).size;
    const gap = 12;
    const cell = Math.min(46, (sp.w - gap * Math.max(0, groups - 1)) / total);
    const r = Math.min(19, cell * 0.44);
    let x = sp.x + cell / 2;
    for (let i = 0; i < total; i += 1) {
      if (i > 0 && acts[i] !== acts[i - 1]) x += gap;
      const on = i === active;
      const got = progress[i] ?? 0;
      const g = this.scene.add.graphics();
      const rr = on ? r * 1.22 : r;
      g.fillStyle(INK, on ? 1 : 0.5);
      g.fillCircle(on ? 2 : 1.5, on ? 3 : 2, rr);
      g.fillStyle(got >= 3 ? 0xffc83d : got > 0 ? 0xffe9b0 : actColors[(acts[i] ?? 0) % actColors.length], 1);
      g.fillCircle(0, 0, rr);
      g.lineStyle(on ? 4 : 2, INK, on ? 1 : 0.55);
      g.strokeCircle(0, 0, rr);
      for (let k = 0; k < got; k += 1) {
        g.fillStyle(0xc4352c, 1);
        g.fillCircle((k - (got - 1) / 2) * rr * 0.42, rr * 0.82, Math.max(1.8, rr * 0.13));
      }
      const label = this.scene.add.text(0, -1, String(i + 1), { fontFamily: this.round, fontStyle: "700", fontSize: `${Math.round(rr * 1.05)}px`, color: on ? PENCIL : PENCIL_SOFT, padding: { x: 2, y: 2 } }).setOrigin(0.5);
      const c = this.scene.add.container(x, sp.y + (on ? -2 : 0), [g, label]).setAngle((wobble(i * 3) - 0.5) * 6);
      this.container.add(c);
      this.tabs.push(c);
      x += cell;
    }
  }

  private makeClickable(c: Phaser.GameObjects.Container, w: number, h: number, fn: () => void) {
    const zone = this.scene.add.zone(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.scene.tweens.add({ targets: c, scale: 0.94, duration: 70, yoyo: true });
      pressed(fn);
    });
    c.add(zone);
  }

  private buildButtons(ids: ButtonId[]) {
    for (const b of this.buttons) b.destroy();
    this.buttons = [];
    if (ids.length === 0) return;
    const sp = this.spots.buttons;
    const gap = 12;
    const grid = sp.h > 120 && ids.length >= 4;
    const cols = grid ? 2 : ids.length;
    const rows = grid ? Math.ceil(ids.length / 2) : 1;
    const bw = (sp.w - gap * (cols - 1)) / cols;
    const bh = grid ? (sp.h - gap * (rows - 1)) / rows : Math.min(sp.h, 76);
    const top = sp.y + sp.h - (bh * rows + gap * (rows - 1));
    const labels: Record<ButtonId, string> = {
      wait: this.copy.buttons.wait,
      undo: this.copy.buttons.undo,
      restart: this.copy.buttons.restart,
      hint: this.copy.buttons.hint,
      undoCaught: this.copy.buttons.undoCaught,
    };
    const padX = 22;
    const avail = bw - padX * 2;
    const iconSize = 26;
    const iconGap = 10;
    const fit = (label: string) => {
      const probe = this.scene.add.text(0, 0, "", { fontFamily: this.round, fontStyle: "700", fontSize: "26px", padding: { x: 2, y: 2 }, align: "center" });
      let chosen = 19;
      for (let size = 26; size > 19; size -= 1) {
        probe.setFontSize(size).setWordWrapWidth(0).setText("");
        const wordsFit = label.split(" ").every((word) => probe.setText(word).width <= avail + 4);
        probe.setWordWrapWidth(avail).setText(label);
        if (wordsFit && probe.height <= bh - 14) {
          chosen = size;
          break;
        }
      }
      probe.destroy();
      return chosen;
    };
    const withIcon = (label: string) => {
      const probe = this.scene.add.text(0, 0, label, { fontFamily: this.round, fontStyle: "700", fontSize: "26px", padding: { x: 2, y: 2 } });
      let size = 26;
      while (size > 21 && probe.width + iconSize + iconGap > bw - 28) probe.setFontSize((size -= 1));
      const fits = probe.width + iconSize + iconGap <= bw - 28;
      probe.destroy();
      return fits ? size : 0;
    };
    const shared = grid ? Math.min(...ids.map((id) => withIcon(labels[id]) || fit(labels[id]))) : 0;
    ids.forEach((id, i) => {
      const g = this.scene.add.graphics();
      g.fillStyle(INK, 1);
      g.fillRoundedRect(3, 5, bw, bh, 16);
      g.fillStyle(BUTTON_FILLS[id] ?? 0xffffff, 1);
      g.fillRoundedRect(0, 0, bw, bh, 16);
      g.lineStyle(3.5, INK, 1);
      g.strokeRoundedRect(0, 0, bw, bh, 16);
      g.lineStyle(3, 0xffffff, 0.7);
      g.lineBetween(14, 8, Math.min(bw * 0.4, 70), 8);
      const t = this.scene.add
        .text(bw / 2, bh / 2 + 1, labels[id], { fontFamily: this.round, fontStyle: "700", fontSize: `${shared || fit(labels[id])}px`, color: PENCIL, align: "center", padding: { x: 2, y: 2 }, wordWrap: { width: avail }, lineSpacing: -2 })
        .setOrigin(0.5);
      const parts: Phaser.GameObjects.GameObject[] = [g, t];
      const icon = BUTTON_ICONS[id];
      if (icon && t.getWrappedText().length === 1 && t.width + iconSize + iconGap <= bw - 28) {
        const left = (bw - (iconSize + iconGap + t.width)) / 2;
        t.setOrigin(0, 0.5).setX(left + iconSize + iconGap);
        parts.push(this.scene.add.image(left + iconSize / 2, bh / 2 + 1 - glyphOffset(t), iconKey(icon)).setDisplaySize(iconSize, iconSize));
      }
      const col = i % cols;
      const row = Math.floor(i / cols);
      const c = this.scene.add.container(sp.x + col * (bw + gap), top + row * (bh + gap), parts).setAngle((wobble(i * 9 + ids.length) - 0.5) * 1.6);
      this.makeClickable(c, bw, bh, () => this.onButton(id));
      this.container.add(c);
      this.buttons.push(c);
    });
  }
}
