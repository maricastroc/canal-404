import type * as Phaser from "phaser";
import type { Fonts } from "@/games/kit/ui";
import type { NightCopy } from "../copy";
import type { Action } from "../sim/types";
import { wobble, type Layout } from "./layout";

const INK = 0x1d1830;
const PENCIL = "#3b3550";
const PENCIL_SOFT = "#8a83a3";
const COLORS = { info: "#3b3550", good: "#2c8a57", warn: "#b8690c", bad: "#c4352c" } as const;

export type NoteKind = keyof typeof COLORS;

export type ButtonId = "wait" | "undo" | "restart" | "hint" | "next" | "again" | "undoCaught";

export type LegendItem = "creak" | "clock" | "light" | "next" | "dog" | "goal";

type Slot = { x: number; y: number; w: number };

type Spots = {
  title: Slot;
  mission: Slot;
  tabs: Slot;
  heading: Slot;
  goal: Slot;
  stats: Slot;
  notes: Slot & { h: number };
  plan: Slot & { rows: number };
  legend: Slot & { cols: number };
  buttons: Slot & { h: number };
};

function spotsFor(layout: Layout): Spots {
  const { w, h } = layout.notebook;
  if (layout.orientation === "landscape") {
    return {
      title: { x: 76, y: 44, w: w - 110 },
      mission: { x: 76, y: 104, w: w - 110 },
      tabs: { x: 76, y: 150, w: w - 110 },
      heading: { x: 76, y: 226, w: w - 110 },
      goal: { x: 76, y: 282, w: w - 110 },
      stats: { x: 76, y: 352, w: w - 110 },
      notes: { x: 76, y: 440, w: w - 110, h: 200 },
      plan: { x: 76, y: 652, w: w - 110, rows: 2 },
      legend: { x: 76, y: 768, w: w - 110, cols: 2 },
      buttons: { x: 40, y: h - 110, w: w - 80, h: 84 },
    };
  }
  const col = (w - 120) / 2;
  return {
    title: { x: 76, y: 40, w: col },
    mission: { x: 76, y: 96, w: col },
    tabs: { x: 96 + col, y: 44, w: col },
    heading: { x: 76, y: 150, w: col },
    goal: { x: 76, y: 204, w: col },
    stats: { x: 76, y: 290, w: col },
    notes: { x: 76, y: 380, w: col, h: 330 },
    plan: { x: 96 + col, y: 150, w: col, rows: 4 },
    legend: { x: 96 + col, y: 400, w: col, cols: 1 },
    buttons: { x: 36, y: h - 150, w: w - 72, h: 116 },
  };
}

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

export class Notebook {
  readonly container: Phaser.GameObjects.Container;
  private spots: Spots;
  private paper: Phaser.GameObjects.Graphics;
  private ink: Phaser.GameObjects.Graphics;
  private overlay: Phaser.GameObjects.Graphics;
  private texts: Record<string, Phaser.GameObjects.Text> = {};
  private notes: { text: string; kind: NoteKind }[] = [];
  private noteTexts: Phaser.GameObjects.Text[] = [];
  private planCells: Phaser.GameObjects.Text[] = [];
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
    this.texts.title = this.text(sp.title.x, sp.title.y, copy.notebookTitle, 52, PENCIL).setFontStyle("bold");
    this.texts.mission = this.text(sp.mission.x, sp.mission.y, copy.mission, 27, PENCIL_SOFT);
    this.texts.heading = this.text(sp.heading.x, sp.heading.y, "", 44, PENCIL);
    this.texts.goal = this.text(sp.goal.x, sp.goal.y, "", 28, PENCIL, sp.goal.w);
    this.texts.moves = this.text(sp.stats.x, sp.stats.y, "", 40, PENCIL);
    this.texts.par = this.text(sp.stats.x + sp.stats.w, sp.stats.y + 6, "", 30, PENCIL_SOFT).setOrigin(1, 0);
    this.texts.starsAt = this.text(sp.stats.x + 132, sp.stats.y + 58, "", 23, PENCIL_SOFT);
    this.texts.planLabel = this.text(sp.plan.x, sp.plan.y, copy.plan, 25, PENCIL_SOFT);
    this.texts.hints = this.text(sp.plan.x + sp.plan.w, sp.plan.y, "", 22, PENCIL_SOFT).setOrigin(1, 0);
    this.container.add(this.overlay);
  }

  private text(x: number, y: number, value: string, size: number, color: string, wrap?: number) {
    const t = this.scene.add.text(x, y, value, {
      fontFamily: this.fonts.hand,
      fontSize: `${size}px`,
      color,
      padding: { x: 2, y: 3 },
      wordWrap: wrap ? { width: wrap } : undefined,
      lineSpacing: -2,
    });
    this.container.add(t);
    return t;
  }

  private drawPaper() {
    const g = this.paper;
    const { w, h } = this.layout.notebook;
    g.clear();
    g.fillStyle(INK, 1);
    g.fillRoundedRect(8, 10, w, h, 18);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(0, 0, w, h, 18);
    g.lineStyle(5, INK, 1);
    g.strokeRoundedRect(0, 0, w, h, 18);
    g.lineStyle(2, 0x9cc7ea, 0.7);
    for (let ly = 140; ly < h - 24; ly += 38) g.lineBetween(14, ly, w - 14, ly);
    g.lineStyle(2.5, 0xef8a8a, 0.9);
    g.lineBetween(58, 12, 58, h - 12);
    if (this.layout.orientation === "portrait") g.lineBetween(w / 2 + 14, 130, w / 2 + 14, h - 170);
    for (let i = 0; i < Math.floor(w / 62); i += 1) {
      const rx = 40 + i * 62;
      g.fillStyle(0x2b2150, 1);
      g.fillCircle(rx, 12, 9);
      g.lineStyle(4, 0x9aa6b8, 1);
      g.beginPath();
      g.arc(rx, 2, 14, Math.PI * 0.15, Math.PI * 0.85, true);
      g.strokePath();
    }
    const dx = w - 96;
    const dy = this.layout.orientation === "landscape" ? 52 : h - 250;
    g.lineStyle(2.5, 0x8a83a3, 0.8);
    g.strokeRoundedRect(dx, dy, 58, 44, 8);
    g.strokeCircle(dx + 44, dy + 22, 5);
    g.lineBetween(dx + 18, dy - 12, dx + 26, dy);
    g.lineBetween(dx + 40, dy - 12, dx + 32, dy);
    g.lineBetween(dx + 8, dy + 14, dx + 28, dy + 30);
    g.lineBetween(dx + 28, dy + 14, dx + 8, dy + 30);
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
    wobblyLine(g, sp.heading.x, sp.heading.y + 56, sp.heading.x + Math.min(sp.heading.w, this.texts.heading.width + 20), 0xef4f43, 3.5, par * 7);
    for (let i = 0; i < 3; i += 1) star(g, sp.stats.x + 18 + i * 38, sp.stats.y + 72, 15, false);
  }

  setStats(turns: number, hints: number) {
    this.texts.moves.setText(`${this.copy.moves}: ${turns}`);
    this.texts.hints.setText(hints > 0 ? this.copy.hintsUsed(hints) : "");
  }

  private buildTabs(active: number, total: number, progress: number[]) {
    for (const t of this.tabs) t.destroy();
    this.tabs = [];
    const sp = this.spots.tabs;
    const colors = [0xffe39a, 0xf9b6d4, 0xa9dcf7];
    const tw = Math.min(150, (sp.w - 20) / total);
    for (let i = 0; i < total; i += 1) {
      const g = this.scene.add.graphics();
      const on = i === active;
      g.fillStyle(INK, 1);
      g.fillRoundedRect(4, 5, tw - 12, 58, 8);
      g.fillStyle(colors[i % colors.length], 1);
      g.fillRoundedRect(0, 0, tw - 12, 58, 8);
      g.lineStyle(on ? 4.5 : 2.5, INK, 1);
      g.strokeRoundedRect(0, 0, tw - 12, 58, 8);
      for (let k = 0; k < 3; k += 1) star(g, 52 + k * 26, 30, 10, k < (progress[i] ?? 0));
      const label = this.scene.add.text(12, 6, String(i + 1), { fontFamily: this.fonts.hand, fontSize: "38px", color: PENCIL, padding: { x: 2, y: 2 } });
      const c = this.scene.add.container(sp.x + i * tw, sp.y + (on ? -4 : 2), [g, label]).setAngle(on ? -2 : (wobble(i) - 0.5) * 3);
      this.makeClickable(c, tw - 12, 58, () => this.onTab(i));
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
    const title = this.text(sp.x, sp.y, this.copy.legendTitle, 25, PENCIL_SOFT);
    this.legendObjects.push(title);
    const colW = sp.w / sp.cols;
    items.forEach((item, i) => {
      const col = i % sp.cols;
      const row = Math.floor(i / sp.cols);
      const ix = sp.x + col * colW;
      const iy = sp.y + 38 + row * 38;
      const g = this.scene.add.graphics();
      this.drawLegendIcon(g, item, ix + 16, iy + 16);
      this.container.add(g);
      const t = this.text(ix + 40, iy - 2, this.copy.legend[item], 21, PENCIL, colW - 44);
      this.legendObjects.push(g, t);
    });
  }

  private drawLegendIcon(g: Phaser.GameObjects.Graphics, item: LegendItem, x: number, y: number) {
    g.lineStyle(2.5, INK, 1);
    switch (item) {
      case "creak":
        g.fillStyle(0x7a6cb4, 1);
        g.fillRect(x - 15, y - 6, 30, 12);
        g.strokeRect(x - 15, y - 6, 30, 12);
        g.lineBetween(x - 10, y - 12, x - 6, y - 16);
        g.lineBetween(x + 6, y - 16, x + 10, y - 12);
        break;
      case "clock":
        g.fillStyle(0xb06c3f, 1);
        g.fillRect(x - 11, y - 8, 22, 22);
        g.strokeRect(x - 11, y - 8, 22, 22);
        g.fillTriangle(x - 15, y - 8, x + 15, y - 8, x, y - 18);
        g.strokeTriangle(x - 15, y - 8, x + 15, y - 8, x, y - 18);
        break;
      case "light":
        g.fillStyle(0xffd66b, 0.9);
        g.fillRect(x - 14, y - 14, 28, 28);
        g.strokeRect(x - 14, y - 14, 28, 28);
        break;
      case "next":
        g.lineStyle(2, 0x3b3550, 1);
        for (let k = -2; k <= 2; k += 1) g.lineBetween(x - 14 + Math.max(0, k * 7), y + 14 - Math.max(0, -k * 7), x + 14 + Math.min(0, k * 7), y - 14 - Math.min(0, -k * 7));
        g.strokeRect(x - 14, y - 14, 28, 28);
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
        g.strokeRect(x - 14, y - 14, 28, 28);
        break;
    }
  }

  note(text: string, kind: NoteKind = "info") {
    if (this.notes[0]?.text === text) return;
    this.notes = this.notes.filter((n) => n.text !== text);
    this.notes.unshift({ text, kind });
    this.notes = this.notes.slice(0, this.layout.orientation === "landscape" ? 4 : 5);
    this.renderNotes(true);
  }

  clearNotes() {
    this.notes = [];
    this.renderNotes();
  }

  private renderNotes(animateFirst = false) {
    for (const t of this.noteTexts) t.destroy();
    this.noteTexts = [];
    this.writeTimer?.remove();
    const sp = this.spots.notes;
    let y = sp.y;
    this.notes.forEach((n, i) => {
      const t = this.text(sp.x, y, `– ${n.text}`, i === 0 ? 29 : 25, COLORS[n.kind], sp.w);
      t.setAlpha(i === 0 ? 1 : Math.max(0.35, 0.8 - i * 0.15));
      this.noteTexts.push(t);
      y += t.height + 6;
      if (y > sp.y + sp.h) t.setVisible(false);
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
    const cell = 30;
    const cols = Math.floor(sp.w / cell);
    const max = cols * sp.rows;
    const start = Math.max(0, actions.length - max + (actions.length > max ? 1 : 0));
    let k = 0;
    if (start > 0) {
      this.planCells.push(this.text(sp.x, sp.y + 34, "…", 32, PENCIL_SOFT));
      k = 1;
    }
    for (let i = start; i < actions.length; i += 1, k += 1) {
      const a = actions[i];
      const col = k % cols;
      const row = Math.floor(k / cols);
      const t = this.text(sp.x + col * cell, sp.y + 34 + row * 42, a === "wait" ? "·" : ARROWS[a], 34, PENCIL).setAngle((wobble(i * 5) - 0.5) * 10);
      this.planCells.push(t);
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
    g.lineBetween(last.x - 4, last.y + 30, last.x + 30, last.y + 10);
    g.lineBetween(last.x - 2, last.y + 12, last.x + 28, last.y + 32);
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
      { text: this.copy.notes.undoTip, kind: "info" },
      { text: reason, kind: "bad" },
    ];
    this.renderNotes();
    const stamp = this.scene.add
      .text(sp.x + sp.w / 2, sp.y + sp.h * 0.62, this.copy.notes.failed, { fontFamily: this.fonts.display, fontSize: "54px", color: "#c4352c", padding: { x: 10, y: 6 } })
      .setOrigin(0.5)
      .setAngle(-9)
      .setAlpha(0)
      .setScale(1.8);
    const box = this.scene.add.graphics();
    box.lineStyle(5, 0xc4352c, 1);
    box.strokeRoundedRect(-stamp.width / 2 - 6, -stamp.height / 2, stamp.width + 12, stamp.height, 10);
    const c = this.scene.add.container(stamp.x, stamp.y, [box]).setAngle(-9).setAlpha(0).setScale(1.8);
    stamp.setPosition(0, 0).setAngle(0);
    c.add(stamp);
    stamp.setAlpha(1).setScale(1);
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
    const title = this.text(sp.x, sp.y - 6, this.copy.wonTitle, 50, "#2c8a57");
    const g = this.scene.add.graphics();
    this.container.add(g);
    const starY = sp.y + 96;
    for (let i = 0; i < 3; i += 1) {
      const filled = i < stars;
      this.scene.time.delayedCall(200 + i * 240, () => {
        if (!g.active) return;
        star(g, sp.x + 40 + i * 76, starY, 30, filled);
      });
    }
    const moves = this.text(sp.x, sp.y + 140, this.copy.wonMoves(turns, par), 30, PENCIL);
    const extra = turns - par;
    const verdict = this.text(sp.x, sp.y + 182, extra <= 0 ? this.copy.wonPerfect : this.copy.wonClose(extra), 26, PENCIL_SOFT, sp.w);
    const quote = this.text(sp.x, sp.y + 222, `“${line}”`, 30, PENCIL, sp.w);
    this.stampObjects.push(title, g, moves, verdict, quote);
    if (isLast) this.stampObjects.push(this.text(sp.x, sp.y + 266, this.copy.lastLevel, 23, PENCIL_SOFT, sp.w));
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
    const gap = 14;
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
    ids.forEach((id, i) => {
      const g = this.scene.add.graphics();
      g.fillStyle(INK, 1);
      g.fillRoundedRect(4, 6, bw, sp.h, 14);
      g.fillStyle(fills[id] ?? 0xffffff, 1);
      g.fillRoundedRect(0, 0, bw, sp.h, 14);
      g.lineStyle(4, INK, 1);
      g.strokeRoundedRect(0, 0, bw, sp.h, 14);
      const size = ids.length >= 4 ? (this.layout.orientation === "landscape" ? 27 : 36) : 34;
      const t = this.scene.add
        .text(bw / 2, sp.h / 2, labels[id], { fontFamily: this.fonts.hand, fontSize: `${size}px`, color: PENCIL, align: "center", padding: { x: 2, y: 2 }, wordWrap: { width: bw - 16 } })
        .setOrigin(0.5);
      const c = this.scene.add.container(sp.x + i * (bw + gap), sp.y, [g, t]).setAngle((wobble(i * 9 + ids.length) - 0.5) * 2.4);
      this.makeClickable(c, bw, sp.h, () => this.onButton(id));
      this.container.add(c);
      this.buttons.push(c);
    });
  }
}
