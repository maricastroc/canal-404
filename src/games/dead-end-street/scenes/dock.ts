import * as Phaser from "phaser";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { PROJECTILE_ORDER, PROJECTILES, type ProjectileId } from "../config";
import { COPY, type StreetCopy } from "../copy";
import { FULL_FRAME, type Frame } from "../layout";
import type { PhaseDef } from "../phases";
import { CREAM_HEX, INK, INK_HEX, cartoonText, glyphOffset, type Fonts } from "../../kit/ui";
import type { StreetHud } from "./ui";

export type Speaker = "deco" | "lina" | "arlindo";

export type CoachStep = "ammo" | "aim" | "fire" | "follow";

export type ViewMode = "auto" | "free" | "overview" | "inspect";

export type FireState = "ready" | "wait" | "off";

export type PinKind = "star" | "gadget" | "shot" | "sling";

type Vec = { x: number; y: number };

export type DockHandlers = {
  onPick: (id: ProjectileId) => void;
  onStep: (kind: "angle" | "power", dir: 1 | -1) => void;
  onFire: () => void;
  onView: () => void;
};

export type DockSetup = {
  scene: Phaser.Scene;
  fonts: Fonts;
  phase: PhaseDef;
  index: number;
  total: number;
  reduced: boolean;
  locale: Locale;
  handlers: DockHandlers;
  mount: (obj: Phaser.GameObjects.GameObject) => void;
};

type Slot = { id: ProjectileId; root: Phaser.GameObjects.Container; disc: Phaser.GameObjects.Graphics; count: Phaser.GameObjects.Text; size: number; baseY: number };

type Cell = { x: number; y: number; img: Phaser.GameObjects.Image; check: Phaser.GameObjects.Image; drop: Phaser.GameObjects.Image | null; base: number; bg: Phaser.GameObjects.Graphics; size: number };

type Stepper = { root: Phaser.GameObjects.Container; value: Phaser.GameObjects.Text; buttons: Phaser.GameObjects.Container[] };

type Card = { root: Phaser.GameObjects.Container; timer?: Phaser.Time.TimerEvent; h: number; w: number; x: number };

type Pin = { root: Phaser.GameObjects.Container; arrow: Phaser.GameObjects.Graphics; until: number };

const PANEL = 0x2b2150;
const YELLOW = 0xffc83d;
const ORANGE = 0xff8a3d;
const MINT = 0x63d6c1;
const SLOT = 0xecd9b2;
const MUTED = 0x8a80a8;
const WELL = 0x1f1740;
const DEPTH = { panel: 40, ui: 41, pin: 43, card: 44, token: 45, coach: 46, banner: 47 };
const FACE: Record<Speaker, { crop: [number, number, number]; fill: number; name: string }> = {
  deco: { crop: [20, 2, 100], fill: 0xffb27a, name: "#c4352c" },
  lina: { crop: [20, 4, 100], fill: 0x9df0dc, name: "#2f8f7e" },
  arlindo: { crop: [25, 8, 100], fill: 0xf4c7c0, name: "#c4352c" },
};

function raised(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, fill: number, k: number, alpha = 1) {
  g.fillStyle(INK_HEX, alpha);
  g.fillRoundedRect(x + 2 * k, y + 3 * k, w, h, r);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, w, h, r);
  g.lineStyle(2.5 * k, INK_HEX, alpha);
  g.strokeRoundedRect(x, y, w, h, r);
}

function fitLine(text: Phaser.GameObjects.Text, full: string, max: number, size: number, min: number) {
  text.setText(full).setFontSize(size);
  let px = size;
  while (text.width > max && px > min) {
    px -= Math.max(0.5, size / 30);
    text.setFontSize(px);
  }
  if (text.width <= max) return;
  let n = full.length;
  while (n > 1 && text.width > max) {
    n -= 1;
    text.setText(`${full.slice(0, n).trimEnd()}…`);
  }
}

export class DockHud implements StreetHud {
  readonly kind = "tall";
  uiScale = 1;
  swapHint = "";
  private scene: Phaser.Scene;
  private fonts: Fonts;
  private copy: StreetCopy;
  private frame: Frame = FULL_FRAME;
  private k = 1;
  private objs: Phaser.GameObjects.GameObject[] = [];
  private slots: Slot[] = [];
  private cells: Cell[] = [];
  private parStars: Phaser.GameObjects.Image[] = [];
  private scoreText: Phaser.GameObjects.Text | null = null;
  private bestText: Phaser.GameObjects.Text | null = null;
  private shotsText: Phaser.GameObjects.Text | null = null;
  private progressText: Phaser.GameObjects.Text | null = null;
  private scoreMax = 100;
  private infoName: Phaser.GameObjects.Text | null = null;
  private infoTip: Phaser.GameObjects.Text | null = null;
  private steppers: Stepper[] = [];
  private fireBtn: Phaser.GameObjects.Container | null = null;
  private fireBg: Phaser.GameObjects.Graphics | null = null;
  private fireRect = { x: 0, y: 0, w: 0, h: 0 };
  private viewBtn: Phaser.GameObjects.Container | null = null;
  private viewIcon: Phaser.GameObjects.Image | null = null;
  private viewLabel: Phaser.GameObjects.Text | null = null;
  private viewBg: Phaser.GameObjects.Graphics | null = null;
  private slotsRect = { x: 0, y: 0, w: 0, h: 0 };
  private viewRect = { x: 0, y: 0, w: 0, h: 0 };
  private stepsRect = { x: 0, y: 0, w: 0, h: 0 };
  private banner: Phaser.GameObjects.Container | null = null;
  private bannerTimer?: Phaser.Time.TimerEvent;
  private goalCard: Phaser.GameObjects.Container | null = null;
  private goalTimer?: Phaser.Time.TimerEvent;
  private cards: { left: Card | null; right: Card | null } = { left: null, right: null };
  private coachObjs: Phaser.GameObjects.GameObject[] = [];
  private coachTweens: Phaser.Tweens.Tween[] = [];
  private coachTimer?: Phaser.Time.TimerEvent;
  private coachStep: CoachStep | null = null;
  private pins = new Map<string, Pin>();
  private navPill: Phaser.GameObjects.Text | null = null;
  private navigating = false;
  private trayParts: Phaser.GameObjects.GameObject[] = [];
  private navText: string | null = null;
  private marks: Phaser.GameObjects.Graphics | null = null;
  private inset: { x: number; y: number; w: number; h: number } | null = null;
  private insetRing: Phaser.GameObjects.Graphics | null = null;
  private holdTimer?: Phaser.Time.TimerEvent;
  private holdStart = 0;
  private state = {
    score: 0,
    best: 0,
    launches: 0,
    checked: new Set<number>(),
    current: null as ProjectileId | null,
    stock: {} as Record<ProjectileId, number>,
    angle: null as number | null,
    power: null as number | null,
    fire: "off" as FireState,
    view: "auto" as ViewMode,
  };

  constructor(private setup: DockSetup) {
    this.scene = setup.scene;
    this.fonts = setup.fonts;
    this.copy = COPY[setup.locale];
    this.swapHint = this.copy.hud.swapTouch;
    this.scene.input.on("pointerup", this.stopHold, this);
    this.scene.input.on("gameout", this.stopHold, this);
  }

  private add<T extends Phaser.GameObjects.GameObject>(obj: T, keep = true): T {
    const mount = (o: Phaser.GameObjects.GameObject) => {
      this.setup.mount(o);
      if (o instanceof Phaser.GameObjects.Container) o.list.forEach(mount);
    };
    mount(obj);
    if (keep) this.objs.push(obj);
    return obj;
  }

  private label(x: number, y: number, value: string, css: number, color: string, opts: { hand?: boolean; stroke?: number; wrap?: number; align?: "left" | "center" | "right" } = {}) {
    const k = this.k;
    if (opts.stroke) return cartoonText(this.scene, x, y, value, { size: css * k, color, font: this.fonts.display, stroke: opts.stroke, shadow: false, wrap: opts.wrap, align: opts.align });
    return this.scene.add.text(x, y, value, {
      fontFamily: opts.hand ? this.fonts.hand : this.fonts.display,
      fontSize: `${css * k}px`,
      color,
      align: opts.align ?? "left",
      padding: { x: 2 * k, y: 2 * k },
      wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
      lineSpacing: -2 * k,
    });
  }

  private press(root: Phaser.GameObjects.Container, hit: Phaser.GameObjects.Rectangle, onDown: () => void) {
    hit.on("pointerdown", () => {
      root.setScale(0.94);
      onDown();
    });
    const up = () => root.setScale(1);
    hit.on("pointerup", up);
    hit.on("pointerout", up);
  }

  private hitRect(w: number, h: number, x = -w / 2, y = -h / 2) {
    return this.scene.add.rectangle(x, y, w, h, 0xffffff, 0).setOrigin(0).setInteractive();
  }

  get topHeight() {
    return this.frame.top.h;
  }

  layout(frame: Frame) {
    if (frame.kind !== "tall") return;
    this.frame = frame;
    this.k = frame.unit;
    this.clearBuilt();
    this.buildTop();
    this.buildDock();
    this.buildView();
    this.refreshAll();
    const nav = this.navText;
    this.navText = null;
    this.setNavHint(nav);
  }

  private clearBuilt() {
    this.stopHold();
    for (const obj of this.objs) obj.destroy();
    this.objs = [];
    this.slots = [];
    this.trayParts = [];
    this.cells = [];
    this.parStars = [];
    this.steppers = [];
    this.hideBanner(true);
    this.hideGoal();
    this.clearCards();
    this.coach(null);
    for (const pin of this.pins.values()) pin.root.destroy();
    this.pins.clear();
    this.navPill?.destroy();
    this.navPill = null;
    this.marks?.destroy();
    this.marks = null;
    this.insetRing?.destroy();
    this.insetRing = null;
    this.inset = null;
  }

  destroy() {
    this.scene.input.off("pointerup", this.stopHold, this);
    this.scene.input.off("gameout", this.stopHold, this);
    this.clearBuilt();
  }

  private buildTop() {
    const { k, frame, scene } = this;
    const { phase, index, total } = this.setup;
    const w = frame.width;
    const left = 10 * k + frame.safe.left;
    const right = w - 10 * k - frame.safe.right;
    const t = frame.safe.top;
    const bg = this.add(scene.add.graphics().setDepth(DEPTH.panel));
    bg.fillStyle(PANEL, 1);
    bg.fillRect(0, 0, w, frame.top.h);
    bg.fillStyle(INK_HEX, 1);
    bg.fillRect(0, frame.top.h - 3 * k, w, 3 * k);
    const barH = frame.top.h - t;
    const rowA = t + barH * 0.22;
    const rowB = t + barH * 0.54;
    const rowC = t + barH * 0.83;

    const boxW = Phaser.Math.Clamp((w / k) * 0.28, 98, 124) * k;
    const boxX = right - boxW;
    const boxTop = t + 7 * k;
    const boxH = frame.top.h - t - 16 * k;
    const well = this.add(scene.add.graphics().setDepth(DEPTH.panel));
    well.fillStyle(WELL, 1);
    well.fillRoundedRect(boxX, boxTop, boxW, boxH, 12 * k);
    well.lineStyle(2.5 * k, INK_HEX, 1);
    well.strokeRoundedRect(boxX, boxTop, boxW, boxH, 12 * k);
    const cx = boxX + boxW / 2;
    this.scoreMax = boxW - 12 * k;
    this.add(this.label(cx, boxTop + 14 * k, this.copy.touch.score, 12.5, "#b9a6ef").setOrigin(0.5).setDepth(DEPTH.ui));
    this.scoreText = this.add(this.label(cx, boxTop + 41 * k, "0", 28, "#ffc83d", { stroke: 0.16 }).setOrigin(0.5).setDepth(DEPTH.ui));
    this.bestText = this.add(this.label(cx, boxTop + boxH - 14 * k, "", 12, "#f7ecd4").setOrigin(0.5).setDepth(DEPTH.ui));

    const areaR = boxX - 10 * k;
    const chipText = this.label(0, 0, this.copy.hud.phase(index + 1, total), 13, INK).setOrigin(0.5);
    const chipW = chipText.width + 14 * k;
    const chipH = 25 * k;
    const chipBg = scene.add.graphics();
    raised(chipBg, -chipW / 2, -chipH / 2, chipW, chipH, 8 * k, MINT, k);
    chipText.y = glyphOffset(chipText);
    this.add(scene.add.container(left + chipW / 2, rowA, [chipBg, chipText]).setDepth(DEPTH.ui));
    const titleX = left + chipW + 9 * k;
    const title = this.add(this.label(titleX, rowA, "", 21, "#ffc83d", { stroke: 0.15 }).setOrigin(0, 0.5).setDepth(DEPTH.ui));
    fitLine(title, this.copy.phases[phase.id].title.toUpperCase(), areaR - titleX, 21 * k, 13 * k);
    const hit = this.add(this.hitRect(Math.max(title.x + title.width, titleX) - left, 38 * k, left, rowA - 19 * k).setDepth(DEPTH.ui));
    hit.on("pointerdown", () => this.toggleGoal());

    const size = Math.min(31 * k, barH * 0.3);
    const step = size + 6 * k;
    phase.targets.forEach((target, i) => {
      const x = left + size / 2 + i * step;
      const cellBg = scene.add.graphics();
      const img = scene.add.image(x, rowB, target.tex);
      const base = Math.min((size - 7 * k) / img.width, (size - 5 * k) / img.height);
      img.setScale(base);
      const drop = target.kind === "soak" ? scene.add.image(x + size / 2 - 3 * k, rowB + size / 2 - 3 * k, "icon-drop").setDisplaySize(16 * k, 16 * k) : null;
      const check = scene.add.image(x + size / 2 - 3 * k, rowB - size / 2 + 3 * k, "icon-check").setDisplaySize(20 * k, 20 * k).setVisible(false);
      this.add(cellBg.setDepth(DEPTH.ui));
      this.add(img.setDepth(DEPTH.ui));
      if (drop) this.add(drop.setDepth(DEPTH.ui + 0.1));
      this.add(check.setDepth(DEPTH.ui + 0.2));
      const cell: Cell = { x, y: rowB, img, check, drop, base, bg: cellBg, size };
      this.cells.push(cell);
      this.drawCell(cell, false);
    });
    const afterCells = left + phase.targets.length * step + 4 * k;
    this.progressText = this.add(this.label(afterCells, rowB, "", 18, "#f7ecd4", { stroke: 0.14 }).setOrigin(0, 0.5).setDepth(DEPTH.ui));

    let x = left;
    for (let i = 0; i < 3; i += 1) {
      this.parStars.push(this.add(scene.add.image(x + 8.5 * k, rowC, "icon-star").setDisplaySize(17 * k, 17 * k).setDepth(DEPTH.ui)));
      x += 18.5 * k;
    }
    this.shotsText = this.add(this.label(x + 6 * k, rowC, "", 13.5, "#f7ecd4").setOrigin(0, 0.5).setDepth(DEPTH.ui));
  }

  private drawCell(cell: Cell, done: boolean) {
    const k = this.k;
    const g = cell.bg;
    const s = cell.size;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(cell.x - s / 2 + 2 * k, cell.y - s / 2 + 2.5 * k, s, s, 8 * k);
    g.fillStyle(done ? 0x4f8a3a : CREAM_HEX, 1);
    g.fillRoundedRect(cell.x - s / 2, cell.y - s / 2, s, s, 8 * k);
    g.lineStyle(2.5 * k, INK_HEX, 1);
    g.strokeRoundedRect(cell.x - s / 2, cell.y - s / 2, s, s, 8 * k);
    cell.img.setAlpha(done ? 0.55 : 1);
    cell.drop?.setVisible(!done);
    cell.check.setVisible(done);
  }

  private drawProgress() {
    const text = this.progressText;
    if (!text) return;
    const n = this.state.checked.size;
    const total = this.setup.phase.targets.length;
    text.setText(`${n}/${total}`).setColor(n >= total ? "#93cf4c" : "#f7ecd4");
  }

  private buildDock() {
    const { k, frame, scene } = this;
    const d = frame.dock;
    const w = frame.width;
    const bg = this.add(scene.add.graphics().setDepth(DEPTH.panel));
    bg.fillStyle(PANEL, 1);
    bg.fillRect(0, d.y, w, frame.height - d.y);
    bg.fillStyle(INK_HEX, 1);
    bg.fillRect(0, d.y, w, 3 * k);
    const padL = 8 * k + frame.safe.left;
    const padR = 8 * k + frame.safe.right;
    const cssW = w / k;
    const fireW = Phaser.Math.Clamp(cssW * 0.29, 100, 140) * k;
    const fireX = w - padR - fireW;
    const leftW = fireX - 8 * k - padL;

    this.infoName = this.add(this.label(padL + 2 * k, d.y + 17 * k, "", 13, "#ffc83d").setOrigin(0, 0.5).setDepth(DEPTH.ui));
    this.infoTip = this.add(this.label(padL, d.y + 17.5 * k, "", 13.5, "#f7ecd4", { hand: true }).setOrigin(0, 0.5).setDepth(DEPTH.ui));

    const kinds = PROJECTILE_ORDER.filter((id) => (this.setup.phase.ammo[id] ?? 0) > 0);
    const many = kinds.length > 1;
    const gap = 6 * k;
    const pad = 4 * k;
    const swapW = many ? 22 * k : 0;
    const size = Math.min(54 * k, (leftW - 2 * pad - swapW - 3 * gap) / 4);
    const slotTop = d.y + 31 * k;
    const trayW = 2 * pad + kinds.length * size + (kinds.length - 1) * gap + swapW;
    this.slotsRect = { x: padL, y: slotTop - pad, w: trayW, h: size + 2 * pad };
    if (many) {
      const tray = this.add(scene.add.graphics().setDepth(DEPTH.ui - 0.5));
      this.trayParts.push(tray);
      tray.fillStyle(WELL, 1);
      tray.fillRoundedRect(padL, slotTop - pad, trayW, size + 2 * pad, (size + 2 * pad) / 2);
      tray.lineStyle(2.5 * k, INK_HEX, 1);
      tray.strokeRoundedRect(padL, slotTop - pad, trayW, size + 2 * pad, (size + 2 * pad) / 2);
      this.trayParts.push(this.add(scene.add.image(padL + trayW - pad - swapW / 2 - 1 * k, slotTop + size / 2, "icon-swap").setDisplaySize(17 * k, 17 * k).setDepth(DEPTH.ui).setAlpha(0.85)));
    }
    kinds.forEach((id, i) => {
      const cx = padL + pad + size / 2 + i * (size + gap);
      const cy = slotTop + size / 2;
      const disc = scene.add.graphics();
      const icon = scene.add.image(0, -1 * k, PROJECTILES[id].tex);
      icon.setScale(Math.min((size * 0.6) / icon.width, (size * 0.6) / icon.height));
      const count = this.label(size / 2 - 8 * k, -size / 2 + 8 * k, "", 12, INK).setOrigin(0.5);
      const hit = this.hitRect(size + 6 * k, size + 8 * k);
      const root = this.add(scene.add.container(cx, cy, [disc, icon, count, hit]).setDepth(DEPTH.ui));
      this.press(root, hit, () => this.setup.handlers.onPick(id));
      this.slots.push({ id, root, disc, count, size, baseY: cy });
    });

    const groupW = (leftW - 8 * k) / 2;
    const groupY = d.y + 100 * k;
    const groupH = 40 * k;
    this.stepsRect = { x: padL, y: groupY, w: leftW, h: groupH };
    const defs: { kind: "angle" | "power"; title: string; down: string; up: string; fill: number }[] = [
      { kind: "angle", title: this.copy.hud.angle, down: "icon-down", up: "icon-up", fill: YELLOW },
      { kind: "power", title: this.copy.hud.power, down: "icon-minus", up: "icon-plus", fill: ORANGE },
    ];
    defs.forEach((def, i) => {
      const gx = padL + i * (groupW + 8 * k);
      const caption = this.label(gx + groupW / 2, d.y + 93 * k, def.title, 9.5, "#b9a6ef").setOrigin(0.5);
      this.add(caption.setDepth(DEPTH.ui));
      const g = scene.add.graphics();
      raised(g, 0, 0, groupW, groupH, 11 * k, CREAM_HEX, k);
      const value = this.label(groupW / 2, groupH / 2, "", 17, INK).setOrigin(0.5);
      const btnSize = 34 * k;
      const buttons = [-1, 1].map((dir) => {
        const bx = dir < 0 ? 3 * k + btnSize / 2 : groupW - 3 * k - btnSize / 2;
        const bg2 = scene.add.graphics();
        bg2.fillStyle(def.fill, 1);
        bg2.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 9 * k);
        bg2.lineStyle(2.5 * k, INK_HEX, 1);
        bg2.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 9 * k);
        const icon = scene.add.image(0, 0, dir < 0 ? def.down : def.up).setDisplaySize(20 * k, 20 * k);
        const hit = this.hitRect(btnSize + 10 * k, groupH + 10 * k);
        const root = scene.add.container(bx, groupH / 2, [bg2, icon, hit]);
        this.press(root, hit, () => this.startHold(() => this.setup.handlers.onStep(def.kind, dir as 1 | -1)));
        return root;
      });
      const root = this.add(scene.add.container(gx, groupY, [g, value, ...buttons]).setDepth(DEPTH.ui));
      this.steppers.push({ root, value, buttons });
    });

    const fireY = slotTop;
    const fireH = groupY + groupH - fireY;
    this.fireRect = { x: fireX, y: fireY, w: fireW, h: fireH };
    this.fireBg = scene.add.graphics();
    const icon = scene.add.image(0, -14 * k, "icon-launch").setDisplaySize(28 * k, 28 * k);
    const text = this.label(0, 20 * k, this.copy.touch.launch, 19, INK).setOrigin(0.5);
    fitLine(text, this.copy.touch.launch, fireW - 14 * k, 19 * k, 13 * k);
    const hit = this.hitRect(fireW + 8 * k, fireH + 8 * k);
    this.fireBtn = this.add(scene.add.container(fireX + fireW / 2, fireY + fireH / 2, [this.fireBg, icon, text, hit]).setDepth(DEPTH.ui));
    this.press(this.fireBtn, hit, () => this.setup.handlers.onFire());
  }

  private buildView() {
    const { k, frame, scene } = this;
    const st = frame.stage;
    this.viewBg = scene.add.graphics();
    this.viewIcon = scene.add.image(0, 0, "icon-see-all").setDisplaySize(15 * k, 15 * k);
    this.viewLabel = this.label(0, 0, "", 11.5, INK).setOrigin(0, 0.5);
    const hit = this.hitRect(10, 10);
    this.viewBtn = this.add(scene.add.container(frame.width - 8 * k - frame.safe.right, st.y + st.h - 8 * k, [this.viewBg, this.viewIcon, this.viewLabel, hit]).setDepth(DEPTH.ui));
    this.press(this.viewBtn, hit, () => this.setup.handlers.onView());
  }

  private drawView() {
    const btn = this.viewBtn;
    const label = this.viewLabel;
    const icon = this.viewIcon;
    const g = this.viewBg;
    if (!btn || !label || !icon || !g) return;
    const k = this.k;
    const auto = this.state.view === "auto";
    label.setText(auto ? this.copy.touch.seeAll : this.copy.touch.back);
    icon.setTexture(auto ? "icon-see-all" : "icon-see-back").setDisplaySize(15 * k, 15 * k);
    const h = 32 * k;
    const w = 10 * k + 15 * k + 6 * k + label.width + 10 * k;
    g.clear();
    raised(g, -w, -h, w, h, h / 2, auto ? CREAM_HEX : YELLOW, k, 0.96);
    icon.setPosition(-w + 10 * k + 7.5 * k, -h / 2);
    label.setPosition(-w + 10 * k + 15 * k + 6 * k, -h / 2 + glyphOffset(label));
    this.viewRect = { x: btn.x - w, y: btn.y - h, w, h };
    const hit = btn.list[3] as Phaser.GameObjects.Rectangle;
    hit.setPosition(-w - 6 * k, -h - 8 * k).setSize(w + 12 * k, h + 14 * k);
    hit.input?.hitArea.setTo(0, 0, w + 12 * k, h + 14 * k);
  }

  private refreshAll() {
    this.setScore(this.state.score, false);
    this.setBest(this.state.best);
    this.setLaunches(this.state.launches);
    for (const i of this.state.checked) this.markCell(i, false);
    this.drawProgress();
    this.drawAmmo();
    this.drawAim();
    this.drawFire();
    this.drawView();
  }

  setScore(score: number, pulse: boolean) {
    this.state.score = score;
    const text = this.scoreText;
    if (!text) return;
    fitLine(text, formatNumber(score, this.setup.locale), this.scoreMax, 28 * this.k, 18 * this.k);
    if (pulse && !this.setup.reduced) this.scene.tweens.add({ targets: text, scale: { from: 1.22, to: 1 }, duration: 240, ease: "Back.easeOut" });
  }

  setBest(value: number) {
    this.state.best = value;
    this.bestText?.setText(value > 0 ? this.copy.hud.best(formatNumber(value, this.setup.locale)) : this.copy.hud.noBest);
  }

  setLaunches(n: number) {
    this.state.launches = n;
    const par = this.setup.phase.par;
    const stars = n <= par[0] ? 3 : n <= par[1] ? 2 : 1;
    this.parStars.forEach((star, i) => star.setAlpha(i < stars ? 1 : 0.25));
    const text = this.shotsText;
    if (!text) return;
    text.setText(this.copy.touch.shots(n, par[0]));
    if (n > 0 && !this.setup.reduced) this.scene.tweens.add({ targets: text, scale: { from: 1.2, to: 1 }, duration: 220, ease: "Back.easeOut" });
  }

  iconPoint(index: number): Vec {
    const cell = this.cells[index];
    return cell ? { x: cell.x, y: cell.y } : { x: this.frame.width / 2, y: this.frame.top.h / 2 };
  }

  private markCell(index: number, animate: boolean) {
    const cell = this.cells[index];
    if (!cell) return;
    this.drawCell(cell, true);
    this.drawProgress();
    if (!animate || this.setup.reduced) return;
    const size = 20 * this.k;
    cell.check.setDisplaySize(size * 0.2, size * 0.2);
    this.scene.tweens.add({ targets: cell.check, displayWidth: size, displayHeight: size, duration: 280, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: cell.img, scale: { from: cell.base * 1.4, to: cell.base }, duration: 260, ease: "Back.easeOut" });
  }

  checkTarget(index: number) {
    if (this.state.checked.has(index)) return;
    this.state.checked.add(index);
    this.markCell(index, true);
  }

  flyStar(index: number, from: Vec) {
    if (this.setup.reduced) {
      this.checkTarget(index);
      return;
    }
    const to = this.iconPoint(index);
    const k = this.k;
    const token = this.add(this.scene.add.image(from.x, from.y, "star").setDepth(DEPTH.token), false);
    token.setDisplaySize(34 * k, 34 * k);
    const end = 18 * k;
    this.scene.tweens.add({ targets: token, angle: 220, duration: 600, delay: 120 });
    this.scene.tweens.add({
      targets: token,
      x: to.x,
      y: to.y,
      displayWidth: end,
      displayHeight: end,
      duration: 600,
      delay: 120,
      ease: "Cubic.easeIn",
      onComplete: () => {
        token.destroy();
        this.checkTarget(index);
      },
    });
  }

  private drawAmmo() {
    const k = this.k;
    const { current, stock } = this.state;
    for (const slot of this.slots) {
      const on = slot.id === current;
      const left = stock[slot.id] ?? 0;
      const r = slot.size / 2 - 2 * k;
      const g = slot.disc;
      g.clear();
      g.fillStyle(INK_HEX, 1);
      g.fillCircle(2 * k, 3 * k, r);
      g.fillStyle(on ? YELLOW : SLOT, 1);
      g.fillCircle(0, 0, r);
      g.lineStyle((on ? 3.5 : 2.5) * k, INK_HEX, on ? 1 : 0.6);
      g.strokeCircle(0, 0, r);
      const br = 10 * k;
      const bx = slot.size / 2 - 8 * k;
      const by = -slot.size / 2 + 8 * k;
      g.fillStyle(on ? INK_HEX : CREAM_HEX, 1);
      g.fillCircle(bx, by, br);
      g.lineStyle(2.5 * k, INK_HEX, 1);
      g.strokeCircle(bx, by, br);
      slot.count.setText(String(left)).setColor(on ? "#ffc83d" : INK);
      slot.count.setPosition(bx, by + glyphOffset(slot.count));
      if (on) {
        g.lineStyle(3 * k, 0xfffaf0, 0.95);
        g.strokeCircle(0, 0, r + 3.5 * k);
      }
      slot.root.setAlpha(this.navigating ? 0.4 : left > 0 ? 1 : 0.35);
      const slotHit = slot.root.list[3] as Phaser.GameObjects.Rectangle;
      if (slotHit.input) slotHit.input.enabled = !this.navigating;
      slot.root.setScale(1);
      slot.root.y = slot.baseY - (on ? 2 * k : 0);
    }
    const name = this.infoName;
    const tip = this.infoTip;
    if (!name || !tip) return;
    if (!current) {
      name.setText("");
      tip.setText("");
      return;
    }
    const text = this.copy.projectiles[current];
    const max = this.frame.width - 16 * k - this.frame.safe.left - this.frame.safe.right;
    fitLine(name, text.name.toUpperCase(), max * 0.55, 13 * k, 10 * k);
    tip.x = name.x + name.width + 6 * k;
    fitLine(tip, text.tip, Math.max(10, max - (tip.x - name.x)), 13.5 * k, 11 * k);
  }

  setAmmo(current: ProjectileId | null, stock: Record<ProjectileId, number>) {
    this.state.current = current;
    this.state.stock = { ...stock };
    this.drawAmmo();
  }

  popTag() {
    if (this.setup.reduced) return;
    const slot = this.slots.find((s) => s.id === this.state.current);
    if (slot) this.scene.tweens.add({ targets: slot.root, scale: { from: 1.18, to: 1 }, duration: 300, ease: "Back.easeOut" });
  }

  hideTag() {
    this.state.current = null;
    this.drawAmmo();
  }

  private drawAim() {
    const { angle, power } = this.state;
    const shown = angle !== null && power !== null;
    const active = shown && !this.navigating;
    this.steppers.forEach((s, i) => {
      s.root.setAlpha(active ? 1 : 0.42);
      for (const b of s.buttons) (b.list[2] as Phaser.GameObjects.Rectangle).input!.enabled = active;
      if (!shown) return;
      s.value.setText(i === 0 ? `${Math.round(angle)}°` : `${Math.round(power * 100)}%`);
      s.value.y = 20 * this.k + glyphOffset(s.value);
    });
    if (!active) this.stopHold();
  }

  setAim(angle: number | null, power: number | null) {
    const same = angle === this.state.angle && power === this.state.power;
    this.state.angle = angle;
    this.state.power = power;
    if (!same) this.drawAim();
  }

  private drawFire() {
    const g = this.fireBg;
    const btn = this.fireBtn;
    if (!g || !btn) return;
    const { w, h } = this.fireRect;
    const k = this.k;
    const ready = this.state.fire === "ready";
    g.clear();
    raised(g, -w / 2, -h / 2, w, h, 14 * k, ready ? ORANGE : MUTED, k);
    if (ready) {
      g.fillStyle(0xffffff, 0.25);
      g.fillRoundedRect(-w / 2 + 6 * k, -h / 2 + 5 * k, w - 12 * k, 10 * k, 5 * k);
    }
    btn.setAlpha(this.state.fire === "off" || this.navigating ? 0.45 : ready ? 1 : 0.8);
    const hit = btn.list[3] as Phaser.GameObjects.Rectangle;
    if (hit.input) hit.input.enabled = ready;
  }

  setFire(state: FireState) {
    if (state === this.state.fire) return;
    this.state.fire = state;
    this.drawFire();
  }

  setView(mode: ViewMode) {
    if (mode === this.state.view) return;
    this.state.view = mode;
    this.drawView();
  }

  showBanner(kicker: string, title: string, sub: string, hold = 1500) {
    this.hideBanner(true);
    const { k, frame, scene } = this;
    const st = frame.stage;
    const w = Math.min(st.w - 28 * k, 360 * k);
    const titleText = this.label(0, 0, title.toUpperCase(), 25, "#ffc83d", { stroke: 0.2, align: "center" }).setOrigin(0.5, 0);
    fitLine(titleText, title.toUpperCase(), w - 28 * k, 25 * k, 16 * k);
    const subText = this.label(0, 0, sub, 15, INK, { wrap: w - 32 * k, align: "center" }).setOrigin(0.5, 0);
    const kick = this.label(0, 0, kicker, 11, INK).setOrigin(0.5);
    const h = 22 * k + titleText.height + 4 * k + subText.height + 16 * k;
    const g = scene.add.graphics();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(-w / 2 + 4 * k, 5 * k, w, h, 16 * k);
    g.fillStyle(CREAM_HEX, 1);
    g.fillRoundedRect(-w / 2, 0, w, h, 16 * k);
    g.lineStyle(3 * k, INK_HEX, 1);
    g.strokeRoundedRect(-w / 2, 0, w, h, 16 * k);
    const kw = kick.width + 18 * k;
    raised(g, -kw / 2, -12 * k, kw, 24 * k, 8 * k, MINT, k);
    kick.setPosition(0, glyphOffset(kick));
    titleText.setPosition(0, 18 * k);
    subText.setPosition(0, titleText.y + titleText.height + 2 * k);
    const y = st.y + Math.max(24 * k, st.h * 0.14);
    const root = this.add(scene.add.container(st.x + st.w / 2, y, [g, kick, titleText, subText]).setDepth(DEPTH.banner).setAngle(-1.5), false);
    this.banner = root;
    if (!this.setup.reduced) this.scene.tweens.add({ targets: root, y: { from: y - 40 * k, to: y }, alpha: { from: 0, to: 1 }, duration: 320, ease: "Back.easeOut" });
    if (hold > 0) this.bannerTimer = this.scene.time.delayedCall(hold, () => this.hideBanner());
  }

  hideBanner(now = false) {
    this.bannerTimer?.remove();
    const banner = this.banner;
    if (!banner) return;
    this.banner = null;
    if (now || this.setup.reduced) {
      banner.destroy();
      return;
    }
    this.scene.tweens.add({ targets: banner, alpha: 0, y: banner.y - 30 * this.k, duration: 240, ease: "Quad.easeIn", onComplete: () => banner.destroy() });
  }

  private toggleGoal() {
    if (this.goalCard) {
      this.hideGoal();
      return;
    }
    const { k, frame, scene } = this;
    const text = this.copy.phases[this.setup.phase.id];
    const maxW = Math.min(frame.width - 20 * k, 320 * k);
    const body = this.label(12 * k, 9 * k, text.goal, 15, INK, { wrap: maxW - 24 * k });
    const w = Math.min(maxW, body.width + 24 * k);
    const h = body.height + 18 * k;
    const g = scene.add.graphics();
    raised(g, 0, 0, w, h, 12 * k, YELLOW, k);
    this.goalCard = this.add(scene.add.container(10 * k + frame.safe.left, frame.top.h + 6 * k, [g, body]).setDepth(DEPTH.banner), false);
    this.goalTimer = this.scene.time.delayedCall(3600, () => this.hideGoal());
  }

  private hideGoal() {
    this.goalTimer?.remove();
    this.goalCard?.destroy();
    this.goalCard = null;
  }

  say(who: Speaker, text: string, duration: number, faceTex?: string) {
    const side = who === "arlindo" ? "right" : "left";
    this.dropCard(side);
    const { k, frame, scene } = this;
    const st = frame.stage;
    const face = FACE[who];
    const tex = faceTex ?? who;
    const pad = 7 * k;
    const fs = 38 * k;
    const maxW = Math.min(st.w * 0.66, 300 * k);
    const name = this.label(0, 0, this.copy.touch.names[who], 9, face.name);
    const body = this.label(0, 0, text, 14, INK, { wrap: maxW - fs - pad * 3 });
    const textW = Math.max(name.width, body.width);
    const w = pad * 3 + fs + textW;
    const h = Math.max(fs, name.height + body.height - 4 * k) + pad * 2;
    const g = scene.add.graphics();
    raised(g, 0, 0, w, h, 12 * k, CREAM_HEX, k);
    const fx = side === "left" ? pad : w - pad - fs;
    const tx = side === "left" ? pad * 2 + fs : pad;
    g.fillStyle(face.fill, 1);
    g.fillRoundedRect(fx, pad + (h - pad * 2 - fs) / 2, fs, fs, 9 * k);
    const img = scene.add.image(0, 0, tex).setOrigin(0, 0);
    const [cx, cy, cs] = face.crop;
    img.setCrop(cx, cy, cs, cs);
    const scale = fs / cs;
    img.setScale(scale);
    const fy = pad + (h - pad * 2 - fs) / 2;
    img.setPosition(fx - cx * scale, fy - cy * scale);
    const frameG = scene.add.graphics();
    frameG.lineStyle(2.5 * k, INK_HEX, 1);
    frameG.strokeRoundedRect(fx, fy, fs, fs, 9 * k);
    name.setPosition(tx, pad - 2 * k);
    body.setPosition(tx, pad + name.height - 5 * k);
    const x = side === "left" ? (this.inset ? this.inset.x + this.inset.w + 10 * k : 8 * k + frame.safe.left) : frame.width - 8 * k - frame.safe.right - w;
    let y = st.y + 8 * k;
    const other = side === "left" ? this.cards.right : this.cards.left;
    if (other && (side === "left" ? x + w + 6 * k > other.x : other.x + other.w + 6 * k > x)) {
      if (side === "right") y += other.h + 6 * k;
      else other.root.y = st.y + 8 * k + h + 6 * k;
    }
    const root = this.add(scene.add.container(x, y, [g, img, frameG, name, body]).setDepth(DEPTH.card), false);
    const card: Card = { root, h, w, x };
    this.cards[side] = card;
    if (!this.setup.reduced) {
      root.setScale(0.7).setAlpha(0);
      scene.tweens.add({ targets: root, scale: 1, alpha: 1, duration: 200, ease: "Back.easeOut" });
      if (who === "arlindo") scene.tweens.add({ targets: img, angle: { from: -4, to: 4 }, duration: 90, yoyo: true, repeat: 3 });
    }
    card.timer = scene.time.delayedCall(Math.max(900, duration), () => this.dropCard(side, true));
  }

  hideSay(who: Speaker) {
    this.dropCard(who === "arlindo" ? "right" : "left", true);
  }

  private dropCard(side: "left" | "right", fade = false) {
    const card = this.cards[side];
    if (!card) return;
    this.cards[side] = null;
    card.timer?.remove();
    if (!fade || this.setup.reduced) {
      card.root.destroy();
      return;
    }
    this.scene.tweens.add({ targets: card.root, alpha: 0, duration: 160, onComplete: () => card.root.destroy() });
  }

  private clearCards() {
    this.dropCard("left");
    this.dropCard("right");
  }

  get coaching() {
    return this.coachStep;
  }

  coach(step: CoachStep | null) {
    this.coachTimer?.remove();
    for (const tween of this.coachTweens) tween.remove();
    for (const obj of this.coachObjs) obj.destroy();
    this.coachTweens = [];
    this.coachObjs = [];
    this.coachStep = step;
    this.syncInfo();
    if (!step || this.frame.kind !== "tall") return;
    const k = this.k;
    const copy = this.copy.touch.coach;
    this.coachObjs.push(this.pill(copy[step], YELLOW, DEPTH.coach));
    if (step === "ammo") {
      const r = this.slotsRect;
      this.ring(r.x - 5 * k, r.y - 5 * k, r.w + 10 * k, r.h + 10 * k, r.h / 2 + 5 * k);
      return;
    }
    if (step === "aim") {
      this.finger();
      return;
    }
    if (step === "fire") {
      const f = this.fireRect;
      this.ring(f.x - 6 * k, f.y - 6 * k, f.w + 12 * k, f.h + 12 * k, 18 * k);
      const st = this.stepsRect;
      this.ring(st.x - 4 * k, st.y - 4 * k, st.w + 8 * k, st.h + 8 * k, 14 * k, 0.5);
      return;
    }
    const v = this.viewRect;
    this.ring(v.x - 5 * k, v.y - 5 * k, v.w + 10 * k, v.h + 10 * k, v.h / 2 + 5 * k);
    this.coachTimer = this.scene.time.delayedCall(3600, () => this.coach(null));
  }

  private syncInfo() {
    const show = !this.coachStep && !this.navText;
    this.infoName?.setVisible(show);
    this.infoTip?.setVisible(show);
  }

  setNavHint(text: string | null) {
    if (text === this.navText) return;
    this.navText = text;
    this.navPill?.destroy();
    this.navPill = null;
    if (text && this.frame.kind === "tall") {
      const k = this.k;
      const label = this.label(this.frame.width / 2, this.frame.dock.y + 17 * k, text, 13, "#9df0dc").setOrigin(0.5);
      label.y += glyphOffset(label) * 0.5;
      this.navPill = this.add(label.setDepth(DEPTH.coach + 0.5), false);
    }
    this.syncInfo();
    for (const o of this.coachObjs) (o as Phaser.GameObjects.Graphics).setVisible(!text);
  }

  setNavigating(on: boolean) {
    if (on === this.navigating) return;
    this.navigating = on;
    for (const part of this.trayParts) (part as Phaser.GameObjects.Graphics).setAlpha(on ? 0.4 : 1);
    this.drawAmmo();
    this.drawAim();
    this.drawFire();
  }

  setInset(rect: { x: number; y: number; w: number; h: number } | null) {
    const same = rect && this.inset && rect.x === this.inset.x && rect.y === this.inset.y && rect.w === this.inset.w;
    if (same || (!rect && !this.inset)) return;
    this.inset = rect;
    this.insetRing?.destroy();
    this.insetRing = null;
    if (!rect) return;
    const k = this.k;
    const g = this.add(this.scene.add.graphics().setDepth(DEPTH.card - 0.5), false);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const r = rect.w / 2;
    g.lineStyle(7 * k, INK_HEX, 1);
    g.strokeCircle(cx + 1.5 * k, cy + 2.5 * k, r + 1.5 * k);
    g.lineStyle(4 * k, CREAM_HEX, 1);
    g.strokeCircle(cx, cy, r + 1 * k);
    g.lineStyle(2 * k, INK_HEX, 1);
    g.strokeCircle(cx, cy, r + 3.5 * k);
    this.insetRing = g;
    const card = this.cards.left;
    if (card && card.root.x < rect.x + rect.w) card.root.x = rect.x + rect.w + 10 * this.k;
  }

  setMarks(points: Vec[]) {
    if (!points.length) {
      this.marks?.clear();
      return;
    }
    if (!this.marks) this.marks = this.add(this.scene.add.graphics().setDepth(DEPTH.pin), false);
    const g = this.marks;
    const k = this.k;
    const st = this.frame.stage;
    const bob = this.setup.reduced ? 0 : Math.sin(this.scene.time.now / 170) * 3 * k;
    g.clear();
    for (const p of points) {
      if (p.x < st.x || p.x > st.x + st.w || p.y < st.y + 20 * k || p.y > st.y + st.h) continue;
      const y = p.y - 6 * k + bob;
      g.fillStyle(INK_HEX, 1);
      g.fillTriangle(p.x - 12 * k + 2 * k, y - 18 * k + 2.5 * k, p.x + 12 * k + 2 * k, y - 18 * k + 2.5 * k, p.x + 2 * k, y + 2.5 * k);
      g.fillStyle(YELLOW, 1);
      g.fillTriangle(p.x - 12 * k, y - 18 * k, p.x + 12 * k, y - 18 * k, p.x, y);
      g.lineStyle(2.5 * k, INK_HEX, 1);
      g.strokeTriangle(p.x - 12 * k, y - 18 * k, p.x + 12 * k, y - 18 * k, p.x, y);
    }
  }

  private pill(text: string, fill: number, depth: number) {
    const { k, frame, scene } = this;
    const d = frame.dock;
    const x0 = 6 * k + frame.safe.left;
    const w = frame.width - x0 - 6 * k - frame.safe.right;
    const h = 24 * k;
    const g = scene.add.graphics();
    raised(g, 0, 0, w, h, h / 2, fill, k);
    const label = this.label(w / 2, h / 2, "", 12.5, INK).setOrigin(0.5);
    fitLine(label, text, w - 20 * k, 12.5 * k, 9.5 * k);
    label.y = h / 2 + glyphOffset(label);
    const root = this.add(scene.add.container(x0, d.y + 5 * k, [g, label]).setDepth(depth), false);
    if (!this.setup.reduced) {
      root.setAlpha(0);
      scene.tweens.add({ targets: root, alpha: 1, duration: 200 });
    }
    return root;
  }

  private ring(x: number, y: number, w: number, h: number, r: number, strength = 1) {
    const g = this.add(this.scene.add.graphics().setDepth(DEPTH.coach), false);
    const k = this.k;
    g.lineStyle(4 * k, YELLOW, strength);
    g.strokeRoundedRect(x, y, w, h, r);
    g.lineStyle(1.5 * k, INK_HEX, strength * 0.8);
    g.strokeRoundedRect(x - 2.5 * k, y - 2.5 * k, w + 5 * k, h + 5 * k, r + 2.5 * k);
    this.coachObjs.push(g);
    if (!this.setup.reduced) this.coachTweens.push(this.scene.tweens.add({ targets: g, alpha: { from: 1, to: 0.25 }, duration: 620, yoyo: true, repeat: -1, ease: "Sine.easeInOut" }));
  }

  private finger() {
    const { k, frame, scene } = this;
    const st = frame.stage;
    const from = { x: st.x + st.w * 0.64, y: st.y + st.h * 0.4 };
    const to = { x: st.x + st.w * 0.38, y: st.y + st.h * 0.58 };
    const trail = this.add(scene.add.graphics().setDepth(DEPTH.coach), false);
    const dot = scene.add.graphics();
    dot.fillStyle(0xffffff, 0.85);
    dot.fillCircle(0, 0, 17 * k);
    dot.lineStyle(3 * k, INK_HEX, 1);
    dot.strokeCircle(0, 0, 17 * k);
    dot.lineStyle(2 * k, INK_HEX, 0.5);
    dot.strokeCircle(0, 0, 26 * k);
    const finger = this.add(scene.add.container(from.x, from.y, [dot]).setDepth(DEPTH.coach), false);
    this.coachObjs.push(trail, finger);
    const state = { t: 0 };
    const draw = () => {
      const x = from.x + (to.x - from.x) * state.t;
      const y = from.y + (to.y - from.y) * state.t;
      finger.setPosition(x, y);
      trail.clear();
      trail.lineStyle(3 * k, INK_HEX, 0.55);
      const n = Math.floor(state.t * 9);
      for (let i = 0; i < n; i += 1) {
        const a = i / 9;
        const b = a + 0.6 / 9;
        trail.lineBetween(from.x + (to.x - from.x) * a, from.y + (to.y - from.y) * a, from.x + (to.x - from.x) * b, from.y + (to.y - from.y) * b);
      }
    };
    draw();
    if (this.setup.reduced) {
      state.t = 1;
      draw();
      return;
    }
    this.coachTweens.push(
      scene.tweens.add({
        targets: state,
        t: { from: 0, to: 1 },
        duration: 1100,
        hold: 500,
        repeatDelay: 250,
        repeat: -1,
        ease: "Sine.easeInOut",
        onUpdate: draw,
        onRepeat: () => finger.setAlpha(1),
      }),
    );
  }

  pin(key: string, screen: Vec, kind: PinKind, tex?: string, persistent = false, above = false) {
    const { k, frame, scene } = this;
    const st = frame.stage;
    const m = 24 * k;
    const top = st.y + m;
    const x = Phaser.Math.Clamp(screen.x, st.x + m, st.x + st.w - m);
    const y = above ? Phaser.Math.Clamp(screen.y - 30 * k, top, st.y + st.h - m) : Phaser.Math.Clamp(screen.y, top, st.y + st.h - m - 30 * k);
    const angle = above ? Math.PI / 2 : Math.atan2(screen.y - y, screen.x - x);
    let pin = this.pins.get(key);
    if (!pin) {
      const r = 15 * k;
      const bg = scene.add.graphics();
      bg.fillStyle(INK_HEX, 1);
      bg.fillCircle(1.5 * k, 2.5 * k, r);
      bg.fillStyle(kind === "star" ? YELLOW : kind === "gadget" || kind === "sling" ? MINT : CREAM_HEX, 1);
      bg.fillCircle(0, 0, r);
      bg.lineStyle(2.5 * k, INK_HEX, 1);
      bg.strokeCircle(0, 0, r);
      const arrow = scene.add.graphics();
      arrow.fillStyle(INK_HEX, 1);
      arrow.fillTriangle(r + 9 * k, 0, r - 1 * k, -7 * k, r - 1 * k, 7 * k);
      const parts: Phaser.GameObjects.GameObject[] = [arrow, bg];
      if (kind === "gadget") {
        parts.push(this.label(0, 0, "!", 16, INK).setOrigin(0.5));
      } else {
        const icon = scene.add.image(0, 0, kind === "star" ? "icon-star" : (tex ?? "shoe"));
        icon.setScale(Math.min((20 * k) / icon.width, (20 * k) / icon.height));
        parts.push(icon);
      }
      const root = this.add(scene.add.container(x, y, parts).setDepth(DEPTH.pin), false);
      pin = { root, arrow, until: 0 };
      this.pins.set(key, pin);
      if (!this.setup.reduced) scene.tweens.add({ targets: root, scale: { from: 0.4, to: 1 }, duration: 200, ease: "Back.easeOut" });
    }
    pin.root.setPosition(x, y).setAlpha(1);
    pin.arrow.setRotation(angle);
    pin.until = persistent ? Infinity : scene.time.now + 1400;
  }

  unpin(key: string) {
    const pin = this.pins.get(key);
    if (!pin) return;
    this.pins.delete(key);
    pin.root.destroy();
  }

  update(now: number) {
    for (const [key, pin] of this.pins) {
      if (pin.until === Infinity) continue;
      const left = pin.until - now;
      if (left <= 0) {
        this.unpin(key);
        continue;
      }
      if (left < 300) pin.root.setAlpha(left / 300);
    }
  }

  private startHold(fn: () => void) {
    this.stopHold();
    fn();
    this.holdStart = this.scene.time.now;
    this.holdTimer = this.scene.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        if (this.scene.time.now - this.holdStart >= 380) fn();
      },
    });
  }

  private stopHold() {
    this.holdTimer?.remove();
    this.holdTimer = undefined;
  }
}
