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

export type LegendItem = "creak" | "marks" | "clock" | "light" | "next" | "dog" | "goal" | "hide" | "cat" | "route" | "toss" | "near";

type PageKind = "rules" | "moves";

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
  links: Col & { y: number };
  win: Col & { line: number };
  page: Area;
  buttons: Col & { y: number; h: number };
  lastLine: number;
  divider: number | null;
};

const lineY = (k: number) => LINE0 + STEP * k;

function spotsFor(layout: Layout): Spots {
  const { w, h } = layout.notebook;
  const buttons = layout.orientation === "landscape" ? { x: 22, w: w - 44, y: h - 94, h: 74 } : { x: 30, w: w - 60, y: h - 100, h: 80 };
  if (layout.orientation === "landscape") {
    const col = { x: 74, w: w - 100 };
    return {
      title: { x: 74, y: 22 },
      mission: { x: 76, y: 84 },
      tabs: { ...col, y: 140 },
      act: { ...col, line: 2 },
      heading: { ...col, line: 3 },
      goal: { ...col, line: 4 },
      stats: { ...col, line: 7 },
      card: { x: 64, y: lineY(8) + 26, w: w - 90, h: lineY(12) - lineY(8) - 14 },
      links: { ...col, y: lineY(14) + 6 },
      win: { ...col, line: 9 },
      page: { x: 16, y: 118, w: w - 32, h: buttons.y - 132 },
      buttons,
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
    act: { ...left, line: 1 },
    heading: { ...left, line: 2 },
    goal: { ...left, line: 3 },
    stats: { ...left, line: 6 },
    card: { x: right.x - 6, y: lineY(1) - 20, w: right.w + 6, h: lineY(7) - lineY(1) },
    links: { ...right, y: lineY(8) + 8 },
    win: { ...right, line: 2 },
    page: { x: 16, y: 118, w: w - 32, h: buttons.y - 132 },
    buttons,
    lastLine: 16,
    divider: 534,
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
  private texts: Record<string, Phaser.GameObjects.Text> = {};
  private card: Phaser.GameObjects.Container;
  private cardText: Phaser.GameObjects.Text;
  private cardSub: Phaser.GameObjects.Text;
  private tip: { text: string; kind: NoteKind } | null = null;
  private rules: string[] = [];
  private legend: LegendItem[] = [];
  private planActions: Action[] = [];
  private hints = 0;
  private tabs: Phaser.GameObjects.Container[] = [];
  private buttons: Phaser.GameObjects.Container[] = [];
  private links: Phaser.GameObjects.Container[] = [];
  private stampObjects: Phaser.GameObjects.GameObject[] = [];
  private page: Phaser.GameObjects.Container | null = null;
  private pageKind: PageKind | null = null;
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
    this.container = scene.add.container(x, y, [this.paper, this.ink]).setDepth(80);
    this.drawPaper();
    const sp = this.spots;
    this.texts.title = this.raw(sp.title.x, sp.title.y, copy.notebookTitle, 50, PENCIL);
    this.texts.mission = this.raw(sp.mission.x, sp.mission.y, copy.mission, 24, PENCIL_SOFT);
    this.texts.act = this.onLine(sp.act.x, sp.act.line, "", 23, PENCIL_SOFT);
    this.texts.heading = this.onLine(sp.heading.x, sp.heading.line, "", 42, PENCIL);
    this.texts.goal = this.onLine(sp.goal.x, sp.goal.line, "", 30, PENCIL, sp.goal.w);
    this.texts.moves = this.onLine(sp.stats.x, sp.stats.line, "", 40, PENCIL);
    this.texts.par = this.onLine(sp.stats.x + sp.stats.w, sp.stats.line, "", 30, PENCIL_SOFT).setOrigin(1, 0);
    this.texts.starsAt = this.onLine(sp.stats.x + 124, sp.stats.line + 1, "", 23, PENCIL_SOFT);
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
    this.cardText = scene.add.text(22, 26, "", { fontFamily: fonts.hand, fontSize: "31px", color: PENCIL, padding: { x: 2, y: 3 }, wordWrap: { width: c.w - 44 }, lineSpacing: 2 });
    this.cardSub = scene.add.text(22, 0, "", { fontFamily: fonts.hand, fontSize: "24px", color: PENCIL_SOFT, padding: { x: 2, y: 3 }, wordWrap: { width: c.w - 44 } });
    this.card = scene.add.container(c.x, c.y, [cardBg, this.cardText, this.cardSub]).setAngle(-1.2);
    this.container.add(this.card);
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
    t.setLineSpacing(STEP - (metrics.ascent + metrics.descent));
    t.setY(lineY(line) - 3 - metrics.ascent + Math.round(size * 0.1));
    if (!value) t.setText("");
    return t;
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

  setLevel(index: number, total: number, title: string, goal: string, par: number, progress: number[], legend: LegendItem[], acts: number[] = [], actLabel = "") {
    this.texts.heading.setText(`${index + 1}. ${title}`);
    this.texts.act.setText(actLabel);
    this.texts.goal.setText(goal);
    this.texts.starsAt.setText(this.copy.starsAt(par));
    this.texts.par.setText(`${this.copy.par}: ${par}`);
    this.legend = legend;
    this.drawInk(par);
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
    wobblyLine(g, sp.heading.x, lineY(sp.heading.line) + 4, sp.heading.x + Math.min(sp.heading.w, this.texts.heading.width + 16), 0xef4f43, 3.5, par * 7);
    for (let i = 0; i < 3; i += 1) star(g, sp.stats.x + 18 + i * 36, lineY(sp.stats.line + 1) - 14, 14, false);
  }

  setStats(turns: number, hints: number) {
    this.texts.moves.setText(`${this.copy.moves}: ${turns}`);
    this.hints = hints;
    if (this.pageKind === "moves") this.openPage("moves");
    this.buildLinks();
  }

  private buildLinks() {
    for (const l of this.links) l.destroy();
    this.links = [];
    if (this.mode === "won") return;
    const sp = this.spots.links;
    const items: { kind: PageKind; label: string; fill: number }[] = [
      { kind: "rules", label: this.copy.pages.rules, fill: 0xc8f0b4 },
      { kind: "moves", label: `${this.copy.pages.moves} · ${this.planActions.length}`, fill: 0xf9d3e4 },
    ];
    const gap = 12;
    const w = (sp.w - gap) / 2;
    items.forEach((it, i) => {
      const g = this.scene.add.graphics();
      g.fillStyle(INK, 1);
      g.fillRoundedRect(3, 4, w, 50, 10);
      g.fillStyle(it.fill, 1);
      g.fillRoundedRect(0, 0, w, 50, 10);
      g.lineStyle(this.pageKind === it.kind ? 4 : 2.5, INK, 1);
      g.strokeRoundedRect(0, 0, w, 50, 10);
      const t = this.scene.add.text(w / 2, 25, it.label, { fontFamily: this.fonts.hand, fontSize: "25px", color: PENCIL, padding: { x: 2, y: 2 } }).setOrigin(0.5);
      if (t.width > w - 14) t.setFontSize(Math.floor((25 * (w - 14)) / t.width));
      const c = this.scene.add.container(sp.x + i * (w + gap), sp.y, [g, t]).setAngle((wobble(i * 5 + 2) - 0.5) * 2);
      this.makeClickable(c, w, 50, () => (this.pageKind === it.kind ? this.closePage() : this.openPage(it.kind)));
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
    const title = this.scene.add.text(58, 14, kind === "rules" ? this.copy.pages.rulesTitle : this.copy.pages.movesTitle, { fontFamily: this.fonts.hand, fontSize: "38px", color: PENCIL, padding: { x: 2, y: 3 } });
    parts.push(title);
    const closeW = 120;
    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(INK, 1);
    closeBg.fillRoundedRect(3, 4, closeW, 46, 10);
    closeBg.fillStyle(0xffffff, 1);
    closeBg.fillRoundedRect(0, 0, closeW, 46, 10);
    closeBg.lineStyle(2.5, INK, 1);
    closeBg.strokeRoundedRect(0, 0, closeW, 46, 10);
    const closeT = this.scene.add.text(closeW / 2, 23, `✕ ${this.copy.pages.back}`, { fontFamily: this.fonts.hand, fontSize: "24px", color: PENCIL, padding: { x: 2, y: 2 } }).setOrigin(0.5);
    const close = this.scene.add.container(a.w - closeW - 14, 14, [closeBg, closeT]);
    this.makeClickable(close, closeW, 46, () => this.closePage());
    parts.push(close);
    let y = 80;
    const textW = a.w - 80;
    if (kind === "rules") {
      for (const line of this.rules) {
        const t = this.scene.add.text(58, y, `– ${line}`, { fontFamily: this.fonts.hand, fontSize: "26px", color: PENCIL, padding: { x: 2, y: 3 }, wordWrap: { width: textW }, lineSpacing: 4 });
        parts.push(t);
        y += t.height + 10;
      }
      y += 12;
      const sub = this.scene.add.text(58, y, this.copy.legendTitle, { fontFamily: this.fonts.hand, fontSize: "28px", color: PENCIL_SOFT, padding: { x: 2, y: 3 } });
      parts.push(sub);
      y += 46;
      for (const item of this.legend) {
        const ig = this.scene.add.graphics();
        this.drawLegendIcon(ig, item, 76, y + 16);
        const t = this.scene.add.text(104, y, this.copy.legend[item], { fontFamily: this.fonts.hand, fontSize: "25px", color: PENCIL, padding: { x: 2, y: 3 } });
        parts.push(ig, t);
        y += 40;
      }
    } else {
      const runs = runsOf(this.planActions);
      if (!runs.length) parts.push(this.scene.add.text(58, y, this.copy.pages.empty, { fontFamily: this.fonts.hand, fontSize: "26px", color: PENCIL_SOFT, padding: { x: 2, y: 3 } }));
      let x = 58;
      for (const r of runs) {
        const arrow = this.scene.add.text(0, 0, r.action === "wait" ? "·" : ARROWS[r.action], { fontFamily: this.fonts.hand, fontSize: "36px", color: PENCIL, padding: { x: 2, y: 3 } });
        const cell: Phaser.GameObjects.GameObject[] = [arrow];
        let w = Math.max(26, arrow.width);
        if (r.count > 1) {
          const n = this.scene.add.text(arrow.width - 2, 16, String(r.count), { fontFamily: this.fonts.hand, fontSize: "22px", color: "#a85d08", padding: { x: 2, y: 3 } });
          cell.push(n);
          w += n.width - 2;
        }
        if (x + w > a.w - 20) {
          x = 58;
          y += 46;
        }
        parts.push(this.scene.add.container(x, y, cell));
        x += w + 12;
      }
      if (this.hints > 0) parts.push(this.scene.add.text(58, y + 60, this.copy.hintsUsed(this.hints), { fontFamily: this.fonts.hand, fontSize: "24px", color: PENCIL_SOFT, padding: { x: 2, y: 3 } }));
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
    this.cardSub.setText(sub).setY(this.cardText.y + this.cardText.height + 8);
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

  intro(lines: string[]) {
    this.rules = lines;
    this.tip = lines.length ? { text: lines[lines.length - 1], kind: "info" } : null;
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

  showCaught(reason: string) {
    this.clearStamp();
    this.closePage();
    this.mode = "caught";
    this.tip = { text: reason, kind: "bad" };
    this.renderCard(false, this.copy.notes.undoTip);
    const c = this.spots.card;
    const stamp = this.scene.add.text(0, 0, this.copy.notes.failed, { fontFamily: this.fonts.display, fontSize: "34px", color: "#c4352c", padding: { x: 10, y: 6 } }).setOrigin(0.5);
    const frame = this.scene.add.graphics();
    frame.lineStyle(5, 0xc4352c, 1);
    frame.strokeRoundedRect(-stamp.width / 2 - 6, -stamp.height / 2, stamp.width + 12, stamp.height, 10);
    const box = this.scene.add.container(c.x + c.w * 0.6, c.y + c.h + 4, [frame, stamp]).setAngle(-7).setAlpha(0).setScale(1.8);
    this.container.add(box);
    this.stampObjects.push(box);
    this.scene.tweens.add({ targets: box, alpha: 0.92, scale: 1, duration: 220, ease: "Back.easeOut" });
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
    const verdictLines = Math.max(1, verdict.getWrappedText().length);
    const quote = this.onLine(sp.x, sp.line + 4 + verdictLines, `“${line}”`, 30, PENCIL, sp.w);
    this.stampObjects.push(title, g, moves, verdict, quote);
    if (isLast) this.stampObjects.push(this.onLine(sp.x, sp.line + 5 + verdictLines, this.copy.lastLevel, 25, PENCIL_SOFT, sp.w));
    this.buildButtons(isLast ? ["again"] : ["next", "again"]);
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

  private buildTabs(active: number, total: number, progress: number[], acts: number[]) {
    for (const t of this.tabs) t.destroy();
    this.tabs = [];
    const sp = this.spots.tabs;
    const actColors = [0xffe39a, 0xf9b6d4, 0xa9dcf7, 0xc8f0b4];
    const groups = new Set(acts).size;
    const gap = 10;
    const cell = Math.min(56, (sp.w - gap * Math.max(0, groups - 1)) / total);
    const r = Math.min(20, cell * 0.42);
    let x = sp.x + cell / 2;
    for (let i = 0; i < total; i += 1) {
      if (i > 0 && acts[i] !== acts[i - 1]) x += gap;
      const on = i === active;
      const got = progress[i] ?? 0;
      const g = this.scene.add.graphics();
      const rr = on ? r * 1.18 : r;
      g.fillStyle(INK, 1);
      g.fillCircle(2, 3, rr);
      g.fillStyle(got >= 3 ? 0xffc83d : got > 0 ? 0xffe9b0 : actColors[(acts[i] ?? 0) % actColors.length], 1);
      g.fillCircle(0, 0, rr);
      g.lineStyle(on ? 4 : 2.5, INK, 1);
      g.strokeCircle(0, 0, rr);
      for (let k = 0; k < got; k += 1) {
        g.fillStyle(0xc4352c, 1);
        g.fillCircle((k - (got - 1) / 2) * rr * 0.42, rr * 0.82, rr * 0.13);
      }
      const label = this.scene.add.text(0, -1, String(i + 1), { fontFamily: this.fonts.hand, fontSize: `${Math.round(rr * 1.25)}px`, color: PENCIL, padding: { x: 2, y: 2 } }).setOrigin(0.5);
      const c = this.scene.add.container(x, sp.y + 28 + (on ? -2 : 0), [g, label]).setAngle((wobble(i * 3) - 0.5) * 6);
      const zone = this.scene.add.zone(0, 0, cell, cell).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        this.onTab(i);
      });
      c.add(zone);
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
      fn();
    });
    c.add(zone);
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
        g.lineStyle(2.5, INK, 1);
        g.beginPath();
        g.arc(x, y, 6, -2.4, 1.6);
        g.strokePath();
        g.fillStyle(INK, 1);
        g.fillTriangle(x + 7, y + 3, x + 1, y + 7, x + 4, y + 1);
        break;
      case "near":
        g.fillStyle(0xff9d8a, 1);
        g.fillCircle(x, y, 13);
        g.strokeCircle(x, y, 13);
        g.lineStyle(3, INK, 1);
        g.lineBetween(x - 6, y - 6, x + 6, y + 6);
        g.lineBetween(x + 6, y - 6, x - 6, y + 6);
        break;
      case "goal":
        g.lineStyle(3, 0x2fa996, 1);
        g.strokeRect(x - 14, y - 13, 28, 26);
        break;
    }
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
