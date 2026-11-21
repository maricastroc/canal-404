import type * as Phaser from "phaser";
import type { Fonts } from "@/games/kit/ui";
import type { NightCopy } from "../copy";
import type { Action } from "../sim/types";
import { wobble, type Layout } from "./layout";

const INK = 0x1d1830;
const PENCIL = "#2f2944";
const PENCIL_SOFT = "#776f93";
const COLORS = { info: "#2f2944", good: "#23794b", warn: "#a85d08", bad: "#c4352c" } as const;
const LINE0 = 136;
const STEP = 38;

export type NoteKind = keyof typeof COLORS;

export type ButtonId = "wait" | "undo" | "restart" | "hint" | "next" | "again" | "undoCaught";

export type LegendItem = "creak" | "marks" | "clock" | "light" | "next" | "dog" | "goal";

type Col = { x: number; w: number };

type Spots = {
  title: { x: number; y: number };
  mission: { x: number; y: number };
  tabs: Col & { y: number };
  heading: Col & { line: number };
  goal: Col & { line: number };
  stats: Col & { line: number };
  notes: Col & { line: number; last: number };
  plan: Col & { line: number; rows: number };
  legend: Col & { line: number; cols: number };
  buttons: Col & { y: number; h: number };
  lastLine: number;
  divider: number | null;
};

function spotsFor(layout: Layout): Spots {
  const { w, h } = layout.notebook;
  if (layout.orientation === "landscape") {
    const col = { x: 74, w: w - 100 };
    return {
      title: { x: 74, y: 22 },
      mission: { x: 76, y: 84 },
      tabs: { ...col, y: 140 },
      heading: { ...col, line: 3 },
      goal: { ...col, line: 4 },
      stats: { ...col, line: 7 },
      notes: { ...col, line: 9, last: 14 },
      plan: { ...col, line: 15, rows: 2 },
      legend: { ...col, line: 18, cols: 2 },
      buttons: { x: 22, w: w - 44, y: h - 94, h: 74 },
      lastLine: 21,
      divider: null,
    };
  }
  const left = { x: 74, w: 440 };
  const right = { x: 556, w: w - 586 };
  return {
    title: { x: 74, y: 22 },
    mission: { x: 76, y: 84 },
    tabs: { ...right, y: 28 },
    heading: { ...left, line: 1 },
    goal: { ...left, line: 2 },
    stats: { ...left, line: 5 },
    notes: { ...left, line: 7, last: 15 },
    plan: { ...right, line: 1, rows: 3 },
    legend: { ...right, line: 6, cols: 1 },
    buttons: { x: 30, w: w - 60, y: h - 100, h: 80 },
    lastLine: 16,
    divider: 534,
  };
}

const lineY = (k: number) => LINE0 + STEP * k;

function star(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, filled: boolean) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push({ x: x + Math.cos(a) * rr + (wobble(i + x) - 0.5) * 2, y: y + Math.sin(a) * rr + (wobble(i * 3 + y) - 0.5) * 2 });
  }
  if (filled) {
    g.fillStyle(0xffc83d, 1);
    g.fillPoints(pts, true);
  }
  g.lineStyle(3, INK, filled ? 1 : 0.45);
  g.strokePoints(pts, true);
}

function wobblyLine(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, color: number, width: number, seed: number) {
  g.lineStyle(width, color, 1);
  g.beginPath();
  g.moveTo(x0, y0);
  const steps = Math.max(4, Math.round((x1 - x0) / 24));
  for (let i = 1; i <= steps; i += 1) g.lineTo(x0 + ((x1 - x0) * i) / steps, y0 + (wobble(seed + i) - 0.5) * 5);
  g.strokePath();
}

const ARROWS = ["↑", "→", "↓", "←"];

type Run = { action: Action; count: number };

function runsOf(actions: readonly Action[]): Run[] {
  const runs: Run[] = [];
  for (const a of actions) {
    const last = runs[runs.length - 1];
    if (last && last.action === a) last.count += 1;
    else runs.push({ action: a, count: 1 });
  }
  return runs;
}

export class Notebook {
  readonly container: Phaser.GameObjects.Container;
  private spots: Spots;
  private paper: Phaser.GameObjects.Graphics;
  private ink: Phaser.GameObjects.Graphics;
  private overlay: Phaser.GameObjects.Graphics;
  private texts: Record<string, Phaser.GameObjects.Text> = {};
  private notes: { text: string; kind: NoteKind }[] = [];
  private noteTexts: Phaser.GameObjects.Text[] = [];
  private planCells: Phaser.GameObjects.Container[] = [];
  private planActions: Action[] = [];
  private tabs: Phaser.GameObjects.Container[] = [];
  private buttons: Phaser.GameObjects.Container[] = [];
  private legendObjects: Phaser.GameObjects.GameObject[] = [];
  private stampObjects: Phaser.GameObjects.GameObject[] = [];
  private writeTimer?: Phaser.Time.TimerEvent;
  private mode: "play" | "caught" | "won" = "play";

  constructor(
    private scene: Phaser.Scene,
    private layout: Layout,
    private fonts: Fonts,
    private copy: NightCopy,
    private onButton: (id: ButtonId) => void,
    private onTab: (index: number) => void,
  ) {
    this.spots = spotsFor(layout);
    const { x, y } = layout.notebook;
    this.paper = scene.add.graphics();
    this.ink = scene.add.graphics();
    this.overlay = scene.add.graphics();
    this.container = scene.add.container(x, y, [this.paper, this.ink]).setDepth(80);
    this.drawPaper();
    const sp = this.spots;
    this.texts.title = this.raw(sp.title.x, sp.title.y, copy.notebookTitle, 50, PENCIL);
    this.texts.mission = this.raw(sp.mission.x, sp.mission.y, copy.mission, 25, PENCIL_SOFT);
    this.texts.heading = this.onLine(sp.heading.x, sp.heading.line, "", 42, PENCIL);
    this.texts.goal = this.onLine(sp.goal.x, sp.goal.line, "", 29, PENCIL, sp.goal.w);
    this.texts.moves = this.onLine(sp.stats.x, sp.stats.line, "", 38, PENCIL);
    this.texts.par = this.onLine(sp.stats.x + sp.stats.w, sp.stats.line, "", 29, PENCIL_SOFT).setOrigin(1, 0);
    this.texts.starsAt = this.onLine(sp.stats.x + 124, sp.stats.line + 1, "", 23, PENCIL_SOFT);
    this.texts.planLabel = this.onLine(sp.plan.x, sp.plan.line, copy.plan, 24, PENCIL_SOFT);
    this.texts.hints = this.onLine(sp.plan.x + sp.plan.w, sp.plan.line, "", 22, PENCIL_SOFT).setOrigin(1, 0);
    this.container.add(this.overlay);
  }

  private raw(x: number, y: number, value: string, size: number, color: string, wrap?: number) {
    const t = this.scene.add.text(x, y, value, {
      fontFamily: this.fonts.hand,
      fontSize: `${size}px`,
      color,
      padding: { x: 2, y: 3 },
      wordWrap: wrap ? { width: wrap } : undefined,
    });
    this.container.add(t);
    return t;
  }

  private onLine(x: number, line: number, value: string, size: number, color: string, wrap?: number) {
    const t = this.raw(x, 0, value || "Ág", size, color, wrap);
    const metrics = t.style.getTextMetrics();
    const single = metrics.ascent + metrics.descent;
    t.setLineSpacing(STEP - single);
    t.setY(lineY(line) - 3 - metrics.ascent + Math.round(size * 0.1));
    if (!value) t.setText("");
    return t;
  }

  private linesOf(t: Phaser.GameObjects.Text) {
    return Math.max(1, t.getWrappedText().length);
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
    if (sp.divider !== null) g.lineBetween(sp.divider, 120, sp.divider, lineY(sp.lastLine) + 10);
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

  setLevel(index: number, total: number, title: string, goal: string, par: number, progress: number[], legend: LegendItem[]) {
    this.texts.heading.setText(`${index + 1}. ${title}`);
    this.texts.goal.setText(goal);
    this.texts.starsAt.setText(this.copy.starsAt(par));
    this.texts.par.setText(`${this.copy.par}: ${par}`);
    this.drawInk(par);
    this.buildTabs(index, total, progress);
    this.buildLegend(legend);
    this.notes = [];
    this.renderNotes();
    this.setPlan([]);
    this.clearStamp();
    this.mode = "play";
    this.buildButtons(["wait", "undo", "restart", "hint"]);
  }

  private drawInk(par: number) {
    const g = this.ink;
    const sp = this.spots;
    g.clear();
    wobblyLine(g, sp.heading.x, lineY(sp.heading.line) + 4, sp.heading.x + Math.min(sp.heading.w, this.texts.heading.width + 16), 0xef4f43, 3.5, par * 7);
    for (let i = 0; i < 3; i += 1) star(g, sp.stats.x + 18 + i * 36, lineY(sp.stats.line + 1) - 14, 14, false);
  }

  setStats(turns: number, hints: number) {
    this.texts.moves.setText(`${this.copy.moves}: ${turns}`);
    this.texts.hints.setText(hints > 0 ? this.copy.hintsUsed(hints) : "");
  }

  private buildTabs(active: number, total: number, progress: number[]) {
    for (const t of this.tabs) t.destroy();
    this.tabs = [];
    const sp = this.spots.tabs;
    const colors = [0xffe39a, 0xf9b6d4, 0xa9dcf7, 0xc8f0b4];
    const tw = Math.min(150, sp.w / total);
    const th = 52;
    for (let i = 0; i < total; i += 1) {
      const g = this.scene.add.graphics();
      const on = i === active;
      const bw = tw - 10;
      g.fillStyle(INK, 1);
      g.fillRoundedRect(3, 4, bw, th, 8);
      g.fillStyle(colors[i % colors.length], 1);
      g.fillRoundedRect(0, 0, bw, th, 8);
      g.lineStyle(on ? 4.5 : 2.5, INK, 1);
      g.strokeRoundedRect(0, 0, bw, th, 8);
      const gap = Math.min(22, (bw - 46) / 3);
      for (let k = 0; k < 3; k += 1) star(g, 40 + gap * 0.5 + k * gap, th / 2, Math.min(9, gap * 0.45), k < (progress[i] ?? 0));
      const label = this.scene.add.text(10, th / 2, String(i + 1), { fontFamily: this.fonts.hand, fontSize: "34px", color: PENCIL, padding: { x: 2, y: 2 } }).setOrigin(0, 0.5);
      const c = this.scene.add.container(sp.x + i * tw, sp.y + (on ? -4 : 1), [g, label]).setAngle(on ? -2 : (wobble(i) - 0.5) * 3);
      this.makeClickable(c, bw, th, () => this.onTab(i));
      this.container.add(c);
      this.tabs.push(c);
    }
  }

  private makeClickable(c: Phaser.GameObjects.Container, w: number, h: number, fn: () => void) {
    const zone = this.scene.add.zone(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.scene.tweens.add({ targets: c, scale: 0.94, duration: 70, yoyo: true });
      fn();
    });
    c.add(zone);
  }

  private buildLegend(items: LegendItem[]) {
    for (const o of this.legendObjects) o.destroy();
    this.legendObjects = [];
    const sp = this.spots.legend;
    this.legendObjects.push(this.onLine(sp.x, sp.line, this.copy.legendTitle, 24, PENCIL_SOFT));
    const colW = sp.w / sp.cols;
    items.forEach((item, i) => {
      const col = i % sp.cols;
      const row = Math.floor(i / sp.cols);
      const ix = sp.x + col * colW;
      const line = sp.line + 1 + row;
      const g = this.scene.add.graphics();
      this.drawLegendIcon(g, item, ix + 15, lineY(line) - 13);
      this.container.add(g);
      const t = this.onLine(ix + 38, line, this.copy.legend[item], 22, PENCIL);
      if (t.width > colW - 40) t.setFontSize(Math.max(18, Math.floor((22 * (colW - 40)) / t.width)));
      this.legendObjects.push(g, t);
    });
  }

  private drawLegendIcon(g: Phaser.GameObjects.Graphics, item: LegendItem, x: number, y: number) {
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
        g.fillRoundedRect(x - 15, y - 12, 14, 24, 4);
        g.strokeRoundedRect(x - 15, y - 12, 14, 24, 4);
        g.fillStyle(0xff9d8a, 1);
        g.fillRoundedRect(x + 1, y - 12, 14, 24, 4);
        g.strokeRoundedRect(x + 1, y - 12, 14, 24, 4);
        break;
      case "light":
        g.fillStyle(0xffd66b, 0.95);
        g.fillRoundedRect(x - 14, y - 13, 28, 26, 5);
        g.lineStyle(3, 0xffb43d, 1);
        g.strokeRoundedRect(x - 14, y - 13, 28, 26, 5);
        g.fillStyle(0xfffbe8, 1);
        g.fillEllipse(x - 4, y - 4, 12, 7);
        g.fillStyle(INK, 1);
        g.fillCircle(x - 4, y - 4, 2);
        break;
      case "next":
        g.lineStyle(2, 0x3b3550, 1);
        for (let k = -2; k <= 2; k += 1) g.lineBetween(x - 14 + Math.max(0, k * 7), y + 13 - Math.max(0, -k * 7), x + 14 + Math.min(0, k * 7), y - 13 - Math.min(0, -k * 7));
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
      case "goal":
        g.lineStyle(3, 0x2fa996, 1);
        g.strokeRect(x - 14, y - 13, 28, 26);
        break;
    }
  }

  note(text: string, kind: NoteKind = "info") {
    if (this.notes[0]?.text === text) return;
    this.notes = this.notes.filter((n) => n.text !== text);
    this.notes.unshift({ text, kind });
    this.notes = this.notes.slice(0, 5);
    this.renderNotes(true);
  }

  intro(lines: string[]) {
    this.notes = lines.map((text) => ({ text, kind: "info" as NoteKind }));
    this.renderNotes(false, true);
    this.noteTexts.forEach((t, i) => {
      const visible = t.visible;
      t.setAlpha(0);
      if (visible) this.scene.tweens.add({ targets: t, alpha: 1, delay: i * 900, duration: 400 });
    });
  }

  clearNotes() {
    this.notes = [];
    this.renderNotes();
  }

  private renderNotes(animateFirst = false, even = false) {
    for (const t of this.noteTexts) t.destroy();
    this.noteTexts = [];
    this.writeTimer?.remove();
    const sp = this.spots.notes;
    let line = sp.line;
    this.notes.forEach((n, i) => {
      const size = even ? 26 : i === 0 ? 28 : 25;
      const t = this.onLine(sp.x, line, `– ${n.text}`, size, COLORS[n.kind], sp.w);
      t.setAlpha(even || i === 0 ? 1 : Math.max(0.45, 0.85 - i * 0.12));
      this.noteTexts.push(t);
      const used = this.linesOf(t);
      if (line + used - 1 > sp.last) t.setVisible(false);
      line += used;
      if (i === 0 && animateFirst) {
        const full = t.text;
        let shown = 2;
        t.setText(full.slice(0, shown));
        this.writeTimer = this.scene.time.addEvent({
          delay: 16,
          repeat: full.length,
          callback: () => {
            shown += 2;
            if (t.active) t.setText(full.slice(0, shown));
          },
        });
      }
    });
  }

  setPlan(actions: readonly Action[]) {
    this.planActions = [...actions];
    for (const c of this.planCells) c.destroy();
    this.planCells = [];
    const sp = this.spots.plan;
    const runs = runsOf(actions);
    const cells = runs.map((r) => {
      const arrow = this.raw(0, 0, r.action === "wait" ? "·" : ARROWS[r.action], 34, PENCIL);
      const parts: Phaser.GameObjects.GameObject[] = [arrow];
      let width = Math.max(24, arrow.width);
      if (r.count > 1) {
        const count = this.raw(arrow.width - 2, 14, String(r.count), 21, "#a85d08");
        parts.push(count);
        width = arrow.width + count.width - 2;
      }
      const c = this.scene.add.container(0, 0, parts);
      this.container.add(c);
      return { c, width: width + 10, arrow };
    });
    const rows: (typeof cells)[] = [[]];
    let used = 0;
    for (const cell of cells) {
      if (used + cell.width > sp.w && rows[rows.length - 1].length) {
        rows.push([]);
        used = 0;
      }
      rows[rows.length - 1].push(cell);
      used += cell.width;
    }
    const keep = rows.slice(-sp.rows);
    const dropped = rows.length > sp.rows;
    for (const row of rows.slice(0, rows.length - keep.length)) for (const cell of row) cell.c.destroy();
    keep.forEach((row, r) => {
      let x = sp.x + (dropped && r === 0 ? 26 : 0);
      const baseLine = sp.line + 1 + r;
      for (const cell of row) {
        const m = cell.arrow.style.getTextMetrics();
        cell.c.setPosition(x, lineY(baseLine) - 3 - m.ascent + 4).setAngle((wobble(x + r * 11) - 0.5) * 6);
        x += cell.width;
        this.planCells.push(cell.c);
      }
    });
    if (dropped) {
      const dots = this.onLine(sp.x, sp.line + 1, "…", 30, PENCIL_SOFT);
      this.planCells.unshift(this.scene.add.container(0, 0, [dots]));
      this.container.add(this.planCells[0]);
    }
  }

  strikeLast(done: () => void) {
    const last = this.planCells[this.planCells.length - 1];
    if (!last || this.planActions.length === 0) {
      done();
      return;
    }
    const g = this.scene.add.graphics();
    g.lineStyle(4, 0xc4352c, 1);
    g.lineBetween(last.x - 4, last.y + 34, last.x + 32, last.y + 10);
    g.lineBetween(last.x - 2, last.y + 12, last.x + 30, last.y + 36);
    this.container.add(g);
    g.setAlpha(0);
    this.scene.tweens.add({ targets: g, alpha: 1, duration: 90, hold: 90, yoyo: true, onComplete: () => g.destroy() });
    this.scene.time.delayedCall(150, done);
  }

  private clearStamp() {
    for (const o of this.stampObjects) o.destroy();
    this.stampObjects = [];
    this.overlay.clear();
    for (const t of this.noteTexts) t.setAlpha(1);
  }

  showCaught(reason: string) {
    this.clearStamp();
    this.mode = "caught";
    const sp = this.spots.notes;
    this.notes = [
      { text: reason, kind: "bad" },
      { text: this.copy.notes.undoTip, kind: "info" },
    ];
    this.renderNotes();
    const cy = lineY(sp.line + 3) + 6;
    const stamp = this.scene.add
      .text(0, 0, this.copy.notes.failed, { fontFamily: this.fonts.display, fontSize: "50px", color: "#c4352c", padding: { x: 10, y: 6 } })
      .setOrigin(0.5);
    const frame = this.scene.add.graphics();
    frame.lineStyle(5, 0xc4352c, 1);
    frame.strokeRoundedRect(-stamp.width / 2 - 6, -stamp.height / 2, stamp.width + 12, stamp.height, 10);
    const c = this.scene.add.container(sp.x + sp.w / 2, cy, [frame, stamp]).setAngle(-8).setAlpha(0).setScale(1.8);
    this.container.add(c);
    this.stampObjects.push(c);
    this.scene.tweens.add({ targets: c, alpha: 0.92, scale: 1, duration: 220, ease: "Back.easeOut" });
    this.buildButtons(["undoCaught", "restart"]);
  }

  clearCaught() {
    if (this.mode !== "caught") return;
    this.mode = "play";
    this.clearStamp();
    this.notes = [];
    this.renderNotes();
    this.buildButtons(["wait", "undo", "restart", "hint"]);
  }

  showWin(turns: number, par: number, stars: number, isLast: boolean, line: string) {
    this.clearStamp();
    this.mode = "won";
    const sp = this.spots.notes;
    for (const t of this.noteTexts) t.setVisible(false);
    this.setPlanVisible(false);
    const title = this.onLine(sp.x, sp.line, this.copy.wonTitle, 46, "#23794b");
    const g = this.scene.add.graphics();
    this.container.add(g);
    const starY = lineY(sp.line + 2) - 20;
    for (let i = 0; i < 3; i += 1) {
      const filled = i < stars;
      this.scene.time.delayedCall(200 + i * 240, () => {
        if (!g.active) return;
        star(g, sp.x + 34 + i * 72, starY, 28, filled);
      });
    }
    const moves = this.onLine(sp.x, sp.line + 3, this.copy.wonMoves(turns, par), 30, PENCIL);
    const extra = turns - par;
    const verdict = this.onLine(sp.x, sp.line + 4, extra <= 0 ? this.copy.wonPerfect : this.copy.wonClose(extra), 27, PENCIL_SOFT, sp.w);
    const quote = this.onLine(sp.x, sp.line + 4 + this.linesOf(verdict), `“${line}”`, 30, PENCIL, sp.w);
    this.stampObjects.push(title, g, moves, verdict, quote);
    if (isLast) this.stampObjects.push(this.onLine(sp.x, sp.line + 5 + this.linesOf(verdict), this.copy.lastLevel, 25, PENCIL_SOFT, sp.w));
    this.buildButtons(isLast ? ["again"] : ["next", "again"]);
  }

  clearWin() {
    if (this.mode !== "won") return;
    this.mode = "play";
    this.clearStamp();
    for (const t of this.noteTexts) t.setVisible(true);
    this.setPlanVisible(true);
    this.buildButtons(["wait", "undo", "restart", "hint"]);
  }

  private setPlanVisible(on: boolean) {
    this.texts.planLabel.setVisible(on);
    this.texts.hints.setVisible(on);
    for (const c of this.planCells) c.setVisible(on);
  }

  getMode() {
    return this.mode;
  }

  private buildButtons(ids: ButtonId[]) {
    for (const b of this.buttons) b.destroy();
    this.buttons = [];
    const sp = this.spots.buttons;
    const gap = 6;
    const bw = (sp.w - gap * (ids.length - 1)) / ids.length;
    const labels: Record<ButtonId, string> = {
      wait: this.copy.buttons.wait,
      undo: this.copy.buttons.undo,
      restart: this.copy.buttons.restart,
      hint: this.copy.buttons.hint,
      next: this.copy.buttons.next,
      again: this.copy.buttons.again,
      undoCaught: this.copy.buttons.undoCaught,
    };
    const fills: Partial<Record<ButtonId, number>> = { undoCaught: 0xffe39a, next: 0x9df0dc, undo: 0xf9e0b0 };
    const base = ids.length >= 4 ? 28 : 33;
    let size = base;
    for (const id of ids) {
      const probe = this.scene.add.text(0, 0, labels[id], { fontFamily: this.fonts.hand, fontSize: `${base}px`, padding: { x: 2, y: 2 } });
      if (!labels[id].includes(" ") && probe.width > bw - 6) size = Math.min(size, Math.max(25, Math.floor((base * (bw - 6)) / probe.width)));
      probe.destroy();
    }
    ids.forEach((id, i) => {
      const g = this.scene.add.graphics();
      g.fillStyle(INK, 1);
      g.fillRoundedRect(3, 5, bw, sp.h, 14);
      g.fillStyle(fills[id] ?? 0xffffff, 1);
      g.fillRoundedRect(0, 0, bw, sp.h, 14);
      g.lineStyle(3.5, INK, 1);
      g.strokeRoundedRect(0, 0, bw, sp.h, 14);
      const t = this.scene.add
        .text(bw / 2, sp.h / 2, labels[id], { fontFamily: this.fonts.hand, fontSize: `${size}px`, color: PENCIL, align: "center", padding: { x: 2, y: 2 }, wordWrap: { width: bw - 6 } })
        .setOrigin(0.5);
      const c = this.scene.add.container(sp.x + i * (bw + gap), sp.y, [g, t]).setAngle((wobble(i * 9 + ids.length) - 0.5) * 2.4);
      this.makeClickable(c, bw, sp.h, () => this.onButton(id));
      this.container.add(c);
      this.buttons.push(c);
    });
  }
}
