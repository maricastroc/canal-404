import * as Phaser from "phaser";
import { PARTS, type PartType } from "../config";
import type { LabCopy } from "../copy";
import type { Vec } from "../geometry";
import { FULL_FRAME, type Frame, type FrameKind } from "../layout";
import { CREAM_HEX, INK, INK_HEX, cartoonText, type Fonts } from "../../kit/ui";
import { addIcon, setIcon, type IconName } from "../icons";
import { centerGlyphs, type HudHandlers, type HudSetup, type LabHudView, type Mood, type StarReveal, type ToolbarAnchor, type ViewState } from "./hud";

export const PANEL_FILL = 0x2b2150;
const BOX_FILL = 0x63d6c1;
const RUN_FILL = 0x93cf4c;
const STOP_FILL = 0xef4f43;
export const DEPTH = { panel: 19.6, rail: 20, box: 20.5, coach: 22.5, goal: 23, toolbar: 24, tag: 25, banner: 26 };
export const TOOL = { size: 48, gap: 10, lift: 12 };

type Fixed = Phaser.GameObjects.GameObject & { setScrollFactor: (x: number, y?: number) => unknown };

export type RailButton = {
  root: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text | null;
  hit: Phaser.GameObjects.Rectangle;
  fill: number;
  iconCss: number;
  labelCss: number;
  row: boolean;
  w: number;
  h: number;
};

export type RailSlot = {
  type: PartType;
  root: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Image;
  name: Phaser.GameObjects.Text;
  badge: Phaser.GameObjects.Graphics;
  count: Phaser.GameObjects.Text;
  ring: Phaser.GameObjects.Graphics;
  hit: Phaser.GameObjects.Rectangle;
  n: number;
  w: number;
  h: number;
};

export function drawPill(g: Phaser.GameObjects.Graphics, w: number, h: number, fill: number, k: number, radius = 10) {
  g.clear();
  g.fillStyle(INK_HEX, 1);
  g.fillRoundedRect(-w / 2 + 2 * k, -h / 2 + 3 * k, w, h, radius * k);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, radius * k);
  g.lineStyle(2.5 * k, INK_HEX, 1);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius * k);
}

export abstract class TouchHud implements LabHudView {
  abstract readonly kind: FrameKind;
  uiScale = 1;
  protected k = 1;
  protected frame: Frame = FULL_FRAME;
  protected scene: Phaser.Scene;
  protected fonts: Fonts;
  protected copy: LabCopy;
  protected reduced: boolean;
  protected handlers: HudHandlers;
  private mountFn?: (obj: Phaser.GameObjects.GameObject) => void;
  protected objects: Phaser.GameObjects.GameObject[] = [];
  protected chip: RailButton;
  protected slots: RailSlot[] = [];
  protected box: Phaser.GameObjects.Container;
  protected boxBg: Phaser.GameObjects.Graphics;
  protected boxLabel: Phaser.GameObjects.Text;
  protected stars: Phaser.GameObjects.Image[] = [];
  protected usedText: Phaser.GameObjects.Text;
  protected hintBtn: RailButton;
  protected undoBtn: RailButton;
  protected clearBtn: RailButton;
  protected runBtn: RailButton;
  protected toolbar: Phaser.GameObjects.Container;
  protected tools: RailButton[];
  protected tag: Phaser.GameObjects.Text;
  protected banner: Phaser.GameObjects.Text;
  protected goal: Phaser.GameObjects.Container;
  private goalBg: Phaser.GameObjects.Graphics;
  private goalKicker: Phaser.GameObjects.Text;
  private goalTitle: Phaser.GameObjects.Text;
  private goalText: Phaser.GameObjects.Text;
  private goalPar: Phaser.GameObjects.Text;
  private goalHit: Phaser.GameObjects.Rectangle;
  private goalTimer?: Phaser.Time.TimerEvent;
  protected runArrow: Phaser.GameObjects.Image;
  private hintPulse?: Phaser.Tweens.Tween;
  private runPulse?: Phaser.Tweens.Tween;
  private runPulseOn = false;
  protected runRow = false;
  protected enabled = true;
  protected running = false;
  protected undoOn = false;
  private statsY = 0;

  constructor({ scene, fonts, level, text, copy, index, total, slotTypes, reduced, handlers, mount }: HudSetup) {
    this.scene = scene;
    this.fonts = fonts;
    this.copy = copy;
    this.reduced = reduced;
    this.handlers = handlers;
    this.mountFn = mount;

    this.chip = this.makeButton(copy.hud.levelShort(index + 1, total), 0x3a2d6b, "info", () => this.toggleGoal(), { labelColor: "#9df0dc", row: true });
    this.chip.root.setDepth(DEPTH.rail);

    slotTypes.forEach((type) => this.slots.push(this.makeSlot(type)));

    this.boxBg = this.fix(scene.add.graphics());
    this.boxLabel = this.fix(cartoonText(scene, 0, 0, copy.hud.putAway, { size: 14, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5));
    this.box = this.fix(scene.add.container(0, 0, [this.boxBg, this.boxLabel]).setDepth(DEPTH.box).setVisible(false));

    for (let i = 0; i < 3; i += 1) this.stars.push(this.fix(scene.add.image(0, 0, "star").setDepth(DEPTH.rail)));
    this.usedText = this.fix(cartoonText(scene, 0, 0, "", { size: 12, color: "#f7ecd4", font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5).setDepth(DEPTH.rail));

    this.hintBtn = this.makeButton(copy.hud.hint, 0xb9a6ef, "hint", () => this.handlers.onHint());
    this.undoBtn = this.makeButton(copy.hud.undo, CREAM_HEX, "undo", () => this.handlers.onUndo());
    this.clearBtn = this.makeButton(copy.hud.clear, CREAM_HEX, "trash", () => this.handlers.onClear());
    this.runBtn = this.makeButton(copy.hud.run, RUN_FILL, "play", () => this.handlers.onRun(), { always: true });
    for (const b of [this.hintBtn, this.undoBtn, this.clearBtn, this.runBtn]) b.root.setDepth(DEPTH.rail);

    this.tools = [
      this.makeButton("", 0xffc83d, "rotate-back", () => this.handlers.onRotateBack(), { tool: true }),
      this.makeButton("", 0xffc83d, "rotate", () => this.handlers.onRotate(), { tool: true }),
      this.makeButton("", 0xef4f43, "remove", () => this.handlers.onRemove(), { tool: true, inner: "remove-inner" }),
    ];
    this.toolbar = this.fix(scene.add.container(0, 0, this.tools.map((t) => t.root)).setDepth(DEPTH.toolbar).setVisible(false));

    this.tag = this.fix(
      scene.add
        .text(0, 0, "", { fontFamily: fonts.display, fontSize: "12px", color: "#fbf5e6", backgroundColor: "#c4352c", padding: { x: 8, y: 4 } })
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.tag)
        .setVisible(false),
    );
    this.banner = this.fix(cartoonText(scene, 0, 0, "", { size: 44, color: "#ffc83d", font: fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(DEPTH.banner).setVisible(false));

    this.goalBg = this.fix(scene.add.graphics());
    this.goalKicker = this.fix(cartoonText(scene, 0, 0, copy.hud.level(index + 1, total), { size: 11, color: "#7b62c4", font: fonts.display, stroke: 0, shadow: false }));
    this.goalTitle = this.fix(cartoonText(scene, 0, 0, text.title.toUpperCase(), { size: 18, color: INK, font: fonts.display, stroke: 0, shadow: false }));
    this.goalText = this.fix(scene.add.text(0, 0, text.goal, { fontFamily: fonts.hand, fontSize: "14px", color: "#3a3157", padding: { x: 1, y: 1 } }));
    this.goalPar = this.fix(scene.add.text(0, 0, copy.hud.par(level.par), { fontFamily: fonts.hand, fontSize: "12px", color: "#7b62c4", padding: { x: 1, y: 1 } }));
    this.goalHit = this.fix(scene.add.rectangle(0, 0, 10, 10, 0xffffff, 0).setOrigin(0).setInteractive());
    this.goalHit.on("pointerdown", () => this.hideGoal());
    this.goal = this.fix(scene.add.container(0, 0, [this.goalBg, this.goalKicker, this.goalTitle, this.goalText, this.goalPar, this.goalHit]).setDepth(DEPTH.goal).setVisible(false));

    this.runArrow = this.fix(addIcon(scene, 0, 0, "arrow-down").setDepth(DEPTH.toolbar).setVisible(false));
  }

  abstract layout(frame: Frame, displayScale: number): void;

  abstract isOverTray(part: Vec, pointer: Vec): boolean;

  abstract covers(x: number, y: number): boolean;

  protected abstract runArrowPose(): { x: number; y: number; angle: number; dx: number; dy: number };

  protected fix<T extends Fixed>(obj: T): T {
    obj.setScrollFactor(0, 0);
    this.mountFn?.(obj);
    this.objects.push(obj);
    return obj;
  }

  protected makeButton(
    label: string,
    fill: number,
    icon: IconName | null,
    onDown: () => void,
    opts: { always?: boolean; tool?: boolean; free?: boolean; inner?: IconName; labelColor?: string; row?: boolean } = {},
  ): RailButton {
    const scene = this.scene;
    const bg = this.fix(scene.add.graphics());
    const image = this.fix(addIcon(scene, 0, 0, icon ?? "hint").setVisible(Boolean(icon)));
    const extra = opts.inner ? [this.fix(addIcon(scene, 0, 0, opts.inner))] : [];
    const text = label ? this.fix(cartoonText(scene, 0, 0, label, { size: 11, color: opts.labelColor ?? INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5)) : null;
    const hit = this.fix(scene.add.rectangle(0, 0, 10, 10, 0xffffff, 0).setOrigin(0).setInteractive({ useHandCursor: true }));
    const root = this.fix(scene.add.container(0, 0, [bg, image, ...extra, ...(text ? [text] : []), hit]));
    const btn: RailButton = { root, bg, icon: image, label: text, hit, fill, iconCss: opts.tool ? 26 : opts.row ? 14 : 20, labelCss: 11, row: Boolean(opts.row), w: 0, h: 0 };
    root.setData("button", true);
    hit.on("pointerdown", () => {
      if (!opts.tool && !opts.free && !opts.always && (!this.enabled || this.running)) return;
      if (opts.always && !this.enabled) return;
      root.setScale(0.94);
      onDown();
    });
    hit.on("pointerup", () => root.setScale(1));
    hit.on("pointerout", () => root.setScale(1));
    extra.forEach((img) => img.setData("inner", true));
    return btn;
  }

  protected sizeButton(btn: RailButton, w: number, h: number) {
    const k = this.k;
    btn.w = w;
    btn.h = h;
    drawPill(btn.bg, w, h, btn.fill, k);
    btn.hit.setSize(w, h).setPosition(-w / 2, -h / 2);
    btn.hit.input?.hitArea.setTo(0, 0, w, h);
    const iconSize = btn.iconCss * k;
    const hasIcon = btn.icon.visible;
    const children = btn.root.list as Phaser.GameObjects.GameObject[];
    if (!btn.label) {
      for (const c of children) if (c instanceof Phaser.GameObjects.Image) c.setPosition(0, 0).setDisplaySize(iconSize, iconSize);
      return;
    }
    const labelPx = Math.max(9, Math.min(btn.labelCss, h / k > 46 ? 12 : 11)) * k;
    btn.label.setFontSize(labelPx);
    btn.label.setScale(1);
    const room = w - (btn.row ? iconSize + 14 * k : 8 * k);
    if (btn.label.width > room) btn.label.setScale(room / btn.label.width);
    if (!hasIcon) {
      btn.label.setPosition(0, 0);
      centerGlyphs(btn.label);
      return;
    }
    if (btn.row) {
      const lw = btn.label.width * btn.label.scaleX;
      const span = iconSize + 4 * k + lw;
      btn.icon.setDisplaySize(iconSize, iconSize).setPosition(-span / 2 + iconSize / 2, 0);
      btn.label.setPosition(-span / 2 + iconSize + 4 * k + lw / 2, 0);
      centerGlyphs(btn.label);
      return;
    }
    const stack = iconSize + 2 * k + btn.label.height * btn.label.scaleY;
    const top = -stack / 2;
    btn.icon.setDisplaySize(iconSize, iconSize).setPosition(0, top + iconSize / 2);
    btn.label.setPosition(0, top + iconSize + 2 * k + (btn.label.height * btn.label.scaleY) / 2);
  }

  protected makeSlot(type: PartType): RailSlot {
    const scene = this.scene;
    const ring = this.fix(scene.add.graphics().setVisible(false));
    const bg = this.fix(scene.add.graphics());
    const icon = this.fix(scene.add.image(0, 0, PARTS[type].tex));
    const name = this.fix(cartoonText(scene, 0, 0, this.copy.parts[type].noun.word.toUpperCase(), { size: 10, color: INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5));
    const badge = this.fix(scene.add.graphics());
    const count = this.fix(cartoonText(scene, 0, 0, "", { size: 11, color: INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5));
    const hit = this.fix(scene.add.rectangle(0, 0, 10, 10, 0xffffff, 0).setOrigin(0).setInteractive({ useHandCursor: true }));
    const root = this.fix(scene.add.container(0, 0, [ring, bg, icon, name, badge, count, hit]).setDepth(DEPTH.rail));
    const slot: RailSlot = { type, root, bg, icon, name, badge, count, ring, hit, n: 0, w: 0, h: 0 };
    hit.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled || this.running) return;
      this.handlers.onSlotDown(type, pointer);
    });
    return slot;
  }

  protected sizeSlot(slot: RailSlot, w: number, h: number) {
    const k = this.k;
    slot.w = w;
    slot.h = h;
    const g = slot.bg;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(-w / 2 + 2 * k, -h / 2 + 3 * k, w, h, 10 * k);
    g.fillStyle(0xfffaf0, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 10 * k);
    g.lineStyle(2.5 * k, INK_HEX, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10 * k);
    const r = slot.ring;
    r.clear();
    r.lineStyle(7 * k, INK_HEX, 1);
    r.strokeRoundedRect(-w / 2 - 5 * k, -h / 2 - 5 * k, w + 10 * k, h + 10 * k, 13 * k);
    r.lineStyle(4 * k, 0xffc83d, 1);
    r.strokeRoundedRect(-w / 2 - 5 * k, -h / 2 - 5 * k, w + 10 * k, h + 10 * k, 13 * k);
    const labelPx = 10 * k;
    slot.name.setFontSize(labelPx).setScale(1);
    if (slot.name.width > w - 8 * k) slot.name.setScale((w - 8 * k) / slot.name.width);
    const nameH = slot.name.height * slot.name.scaleY;
    slot.name.setPosition(0, h / 2 - nameH / 2 - 3 * k);
    const iconArea = { w: w - 16 * k, h: h - nameH - 12 * k };
    const tex = slot.icon;
    tex.setScale(Math.min(iconArea.w / tex.width, iconArea.h / tex.height, 1.1));
    tex.setPosition(slot.type === "fan" ? -4 * k : 0, -h / 2 + 5 * k + iconArea.h / 2);
    slot.hit.setPosition(-w / 2, -h / 2);
    slot.hit.setSize(w, h);
    slot.hit.input?.hitArea.setTo(0, 0, w, h);
    this.drawBadge(slot);
  }

  protected drawBadge(slot: RailSlot) {
    const k = this.k;
    const g = slot.badge;
    const bw = 26 * k;
    const bh = 18 * k;
    const x = slot.w / 2 - bw + 4 * k;
    const y = -slot.h / 2 - 6 * k;
    g.clear();
    g.fillStyle(slot.n > 0 ? 0xffc83d : 0xd9d2c3, 1);
    g.lineStyle(2 * k, INK_HEX, 1);
    g.fillRoundedRect(x, y, bw, bh, 7 * k);
    g.strokeRoundedRect(x, y, bw, bh, 7 * k);
    slot.count.setText(`×${slot.n}`).setFontSize(11 * k);
    slot.count.setPosition(x + bw / 2, y + bh / 2);
    centerGlyphs(slot.count);
    slot.count.y += y + bh / 2;
  }

  get textScale() {
    return Math.max(1, (14 * this.k) / 32);
  }

  protected useFrame(frame: Frame) {
    this.frame = frame;
    this.k = frame.unit;
    this.uiScale = frame.unit;
  }

  protected finishLayout() {
    const k = this.k;
    const st = this.frame.stage;
    for (const t of this.tools) this.sizeButton(t, TOOL.size * k, TOOL.size * k);
    const step = (TOOL.size + TOOL.gap) * k;
    this.tools.forEach((t, i) => t.root.setPosition((i - 1) * step, 0));
    this.tag.setFontSize(12 * k).setPadding(8 * k, 4 * k, 8 * k, 4 * k);
    const banner = Math.min(44 * k, st.w / 7);
    this.banner.setFontSize(banner).setStroke(INK, Math.round(banner * 0.2));
    this.layoutGoal();
    this.runArrow.setDisplaySize(30 * k, 30 * k);
    if (this.runPulseOn) this.pulseRun(true);
  }

  protected layoutBox(x: number, y: number, w: number, h: number) {
    const k = this.k;
    this.boxBg.clear();
    this.boxBg.fillStyle(BOX_FILL, 0.96);
    this.boxBg.fillRoundedRect(-w / 2, -h / 2, w, h, 12 * k);
    this.boxBg.lineStyle(3 * k, INK_HEX, 1);
    this.boxBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12 * k);
    this.boxLabel.setFontSize(14 * k).setScale(1);
    if (this.boxLabel.width > w - 12 * k) this.boxLabel.setScale((w - 12 * k) / this.boxLabel.width);
    this.box.setPosition(x, y);
  }

  protected placeStats(cx: number, cy: number, w: number) {
    const k = this.k;
    const starSize = Math.min(15 * k, (w - 8 * k) / 3.4);
    this.stars.forEach((s, i) => s.setDisplaySize(starSize, starSize).setPosition(cx + (i - 1) * starSize * 1.15, cy - 8 * k));
    this.statsY = cy + 10 * k;
    this.usedText.setFontSize(12 * k).setScale(1).setPosition(cx, this.statsY);
    if (this.usedText.width > w - 6 * k) this.usedText.setScale((w - 6 * k) / this.usedText.width);
    centerGlyphs(this.usedText);
    this.usedText.y += this.statsY;
  }

  protected sizeRunLabel() {
    const btn = this.runBtn;
    if (!btn.label) return;
    const k = this.k;
    btn.label.setFontSize((this.runRow ? 20 : 14) * k).setScale(1);
    btn.iconCss = this.runRow ? 26 : 22;
    const iconSize = btn.iconCss * k;
    const room = btn.w - (this.runRow ? iconSize + 24 * k : 8 * k);
    if (btn.label.width > room) btn.label.setScale(room / btn.label.width);
    if (this.runRow) {
      const lw = btn.label.width * btn.label.scaleX;
      const span = iconSize + 8 * k + lw;
      btn.icon.setDisplaySize(iconSize, iconSize).setPosition(-span / 2 + iconSize / 2, 0);
      btn.label.setPosition(-span / 2 + iconSize + 8 * k + lw / 2, 0);
      centerGlyphs(btn.label);
      return;
    }
    const lh = btn.label.height * btn.label.scaleY;
    const stack = iconSize + 2 * k + lh;
    btn.icon.setDisplaySize(iconSize, iconSize).setPosition(0, -stack / 2 + iconSize / 2);
    btn.label.setPosition(0, -stack / 2 + iconSize + 2 * k + lh / 2);
  }

  private layoutGoal() {
    const k = this.k;
    const st = this.frame.stage;
    const small = st.h / k < 300;
    const w = Math.min(st.w * 0.62, (small ? 300 : 340) * k);
    const pad = (small ? 10 : 12) * k;
    this.goalKicker.setFontSize((small ? 10 : 11) * k).setPosition(pad, pad - 2 * k);
    this.goalTitle.setFontSize((small ? 15 : 18) * k).setPosition(pad - 1 * k, pad + (small ? 11 : 13) * k).setScale(1);
    if (this.goalTitle.width > w - pad * 2) this.goalTitle.setScale((w - pad * 2) / this.goalTitle.width);
    const titleBottom = this.goalTitle.y + this.goalTitle.height * this.goalTitle.scaleY;
    this.goalText.setFontSize((small ? 12.5 : 14) * k).setWordWrapWidth(w - pad * 2).setPosition(pad, titleBottom + 1 * k);
    this.goalPar.setFontSize((small ? 11 : 12) * k).setPosition(pad, this.goalText.y + this.goalText.height + 2 * k);
    const h = this.goalPar.y + this.goalPar.height + pad - 2 * k;
    const g = this.goalBg;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(3 * k, 4 * k, w, h, 14 * k);
    g.fillStyle(CREAM_HEX, 1);
    g.fillRoundedRect(0, 0, w, h, 14 * k);
    g.lineStyle(3 * k, INK_HEX, 1);
    g.strokeRoundedRect(0, 0, w, h, 14 * k);
    this.goalHit.setSize(w, h);
    this.goalHit.input?.hitArea.setTo(0, 0, w, h);
    this.goal.setPosition(st.x + 8 * k, st.y + 8 * k);
  }

  protected toggleGoal() {
    if (this.goal.visible) this.hideGoal();
    else this.showGoal();
  }

  protected showGoal() {
    this.goalTimer?.remove();
    const g = this.goal;
    this.scene.tweens.killTweensOf(g);
    g.setVisible(true).setAlpha(1);
    if (!this.reduced) {
      g.setAlpha(0);
      this.scene.tweens.add({ targets: g, alpha: 1, duration: 160 });
    }
    this.goalTimer = this.scene.time.delayedCall(9000, () => this.hideGoal());
  }

  hideGoal() {
    this.goalTimer?.remove();
    const g = this.goal;
    if (!g.visible) return;
    this.scene.tweens.killTweensOf(g);
    if (this.reduced) {
      g.setVisible(false);
      return;
    }
    this.scene.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.setVisible(false) });
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  setCounts(remaining: Partial<Record<PartType, number>>) {
    for (const slot of this.slots) {
      slot.n = remaining[slot.type] ?? 0;
      this.drawBadge(slot);
      slot.root.setAlpha(this.running ? 0.45 : slot.n > 0 ? 1 : 0.45);
    }
  }

  setUsed(used: number, par: number) {
    this.usedText.setText(this.copy.hud.used(used));
    centerGlyphs(this.usedText);
    this.usedText.y += this.statsY;
    const projected = used <= par ? 3 : used === par + 1 ? 2 : 1;
    this.stars.forEach((s, i) => {
      const lit = i < projected;
      s.setAlpha(lit ? 1 : 0.3);
      if (lit) s.clearTint();
      else s.setTint(0x6d6390);
    });
  }

  setUndo(available: boolean) {
    this.undoOn = available;
    this.refreshButtons();
  }

  private refreshButtons() {
    const dim = this.running ? 0.45 : 1;
    this.hintBtn.root.setAlpha(dim);
    this.clearBtn.root.setAlpha(dim);
    this.undoBtn.root.setAlpha(this.running || !this.undoOn ? 0.45 : 1);
  }

  highlightSlot(type: PartType | null) {
    for (const slot of this.slots) {
      const on = slot.type === type;
      this.scene.tweens.killTweensOf(slot.ring);
      slot.ring.setVisible(on).setAlpha(1);
      if (on && !this.reduced) this.scene.tweens.add({ targets: slot.ring, alpha: 0.35, duration: 260, yoyo: true, repeat: 2, delay: 450, ease: "Sine.easeInOut" });
    }
  }

  nudgeTray() {
    if (this.reduced || this.running) return;
    this.slots.forEach((slot, i) => {
      if (slot.root.alpha < 1) return;
      this.scene.tweens.killTweensOf(slot.root);
      slot.root.setAngle(0);
      this.scene.tweens.add({ targets: slot.root, angle: { from: -6, to: 6 }, duration: 90, yoyo: true, repeat: 3, delay: i * 90, onComplete: () => slot.root.setAngle(0) });
    });
  }

  pulseRun(on: boolean) {
    this.runPulseOn = on;
    this.runPulse?.stop();
    this.runPulse = undefined;
    this.runBtn.root.setScale(1);
    this.scene.tweens.killTweensOf(this.runArrow);
    this.runArrow.setVisible(false);
    if (!on) return;
    const r = this.runBtn.root;
    const pose = this.runArrowPose();
    this.runArrow.setPosition(pose.x, pose.y).setAngle(pose.angle).setVisible(true);
    if (this.reduced) return;
    this.runPulse = this.scene.tweens.add({ targets: r, scale: 1.06, duration: 480, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.scene.tweens.add({ targets: this.runArrow, x: pose.x + pose.dx, y: pose.y + pose.dy, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  pulseHint(on: boolean) {
    this.hintPulse?.stop();
    this.hintPulse = undefined;
    this.hintBtn.root.setScale(1);
    if (on && !this.reduced) {
      this.hintPulse = this.scene.tweens.add({ targets: this.hintBtn.root, scale: 1.08, duration: 520, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  slotCenter(type: PartType): Vec {
    const slot = this.slots.find((s) => s.type === type) ?? this.slots[0];
    return { x: slot.root.x, y: slot.root.y };
  }

  showToolbar(anchor: ToolbarAnchor) {
    const k = this.k;
    const st = this.frame.stage;
    const half = (TOOL.size / 2) * k;
    const reach = (TOOL.size * 1.5 + TOOL.gap) * k;
    const above = anchor.top - half - TOOL.lift * k;
    const below = anchor.bottom + half + TOOL.lift * k;
    const y = above - half > st.y + 4 * k ? above : below;
    const x = Phaser.Math.Clamp(anchor.x, st.x + reach + 4 * k, st.x + st.w - reach - 4 * k);
    this.toolbar.setPosition(x, Phaser.Math.Clamp(y, st.y + half + 4 * k, st.y + st.h - half - 4 * k)).setVisible(true);
  }

  hideToolbar() {
    this.toolbar.setVisible(false);
  }

  setBoxHover(on: boolean) {
    this.box.setVisible(on);
  }

  say(text: string, ms: number, focus: Vec | null): boolean;
  say() {
    return false;
  }

  hideSay() {}

  mood(kind: Mood): void;
  mood() {}

  setView(view: ViewState): void;
  setView() {}

  showTag(text: string, x: number, y: number) {
    const k = this.k;
    const st = this.frame.stage;
    this.tag.setText(text);
    const half = this.tag.width / 2;
    this.tag.setPosition(Phaser.Math.Clamp(x, st.x + half + 4 * k, st.x + st.w - half - 4 * k), Math.max(y, st.y + this.tag.height + 4 * k)).setVisible(true);
  }

  hideTag() {
    this.tag.setVisible(false);
  }

  setRunning(on: boolean) {
    this.running = on;
    const btn = this.runBtn;
    btn.label?.setText(on ? this.copy.hud.stop : this.copy.hud.run);
    btn.fill = on ? STOP_FILL : RUN_FILL;
    drawPill(btn.bg, btn.w, btn.h, btn.fill, this.k);
    setIcon(btn.icon, on ? "stop" : "play");
    this.sizeRunLabel();
    for (const slot of this.slots) slot.root.setAlpha(on ? 0.45 : slot.n > 0 ? 1 : 0.45);
    this.refreshButtons();
    if (on) this.hideGoal();
  }

  setDone() {
    this.setRunning(false);
    this.enabled = false;
    this.pulseRun(false);
    this.pulseHint(false);
    this.hideToolbar();
    this.hideTag();
    this.hideGoal();
    this.scene.tweens.add({ targets: [...this.slots.map((s) => s.root), this.hintBtn.root, this.undoBtn.root, this.clearBtn.root, this.runBtn.root], alpha: 0.5, duration: 250 });
  }

  flash(text: string, color: string, hold = 900) {
    const b = this.banner;
    const st = this.frame.stage;
    this.scene.tweens.killTweensOf(b);
    b.setText(text).setColor(color).setPosition(st.x + st.w / 2, st.y + st.h * 0.3).setVisible(true).setAlpha(1);
    b.setScale(this.reduced ? 1 : 0.3);
    if (!this.reduced) this.scene.tweens.add({ targets: b, scale: 1, duration: 260, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: b, alpha: 0, delay: hold, duration: 260, onComplete: () => b.setVisible(false) });
  }

  celebrate(stars: number, onStar: StarReveal) {
    const scene = this.scene;
    const k = this.k;
    const st = this.frame.stage;
    const cx = st.x + st.w / 2;
    const ty = st.y + st.h * 0.2;
    const title = this.fix(cartoonText(scene, cx, ty, this.copy.hud.worked, { size: Math.round(40 * k), color: "#93cf4c", font: this.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(DEPTH.banner));
    const plateW = 318;
    const plateH = 100;
    const plate = this.fix(scene.add.graphics());
    plate.fillStyle(INK_HEX, 1);
    plate.fillRoundedRect(-plateW / 2 + 6, -plateH / 2 + 7, plateW, plateH, 26);
    plate.fillStyle(0x2b2150, 1);
    plate.fillRoundedRect(-plateW / 2, -plateH / 2, plateW, plateH, 26);
    plate.lineStyle(5, INK_HEX, 1);
    plate.strokeRoundedRect(-plateW / 2, -plateH / 2, plateW, plateH, 26);
    const icons = [0, 1, 2].map((i) => this.fix(scene.add.image((i - 1) * 96, 0, "star").setScale(2.1).setTint(0x5a4d8a).setAlpha(0.55)));
    const s = 0.42 * k;
    const group = this.fix(scene.add.container(cx, ty + 58 * k, [plate, ...icons]).setDepth(DEPTH.banner).setScale(s));
    const reveal = (i: number) => {
      const icon = icons[i];
      const lit = i < stars;
      const m = icon.getWorldTransformMatrix();
      onStar(i, lit, m.tx, m.ty);
      if (!lit) return;
      icon.clearTint().setAlpha(1);
      if (this.reduced) return;
      icon.setScale(3.4).setAngle(-30);
      scene.tweens.add({ targets: icon, scale: 2.1, angle: 0, duration: 260, ease: "Back.easeOut" });
    };
    scene.tweens.add({ targets: [title, group], alpha: 0, delay: 1750, duration: 240 });
    if (this.reduced) {
      [0, 1, 2].forEach(reveal);
      return;
    }
    title.setScale(0.25).setAngle(-10);
    scene.tweens.add({ targets: title, scale: 1, angle: -2, duration: 300, ease: "Back.easeOut" });
    group.setAlpha(0).setScale(0.6 * s);
    scene.tweens.add({ targets: group, alpha: 1, scale: s, duration: 220, delay: 280, ease: "Back.easeOut" });
    [0, 1, 2].forEach((i) => scene.time.delayedCall(460 + i * 190, () => reveal(i)));
  }

  destroy() {
    this.goalTimer?.remove();
    this.hintPulse?.stop();
    this.runPulse?.stop();
    for (const obj of this.objects) {
      this.scene.tweens.killTweensOf(obj);
      obj.destroy();
    }
    this.objects = [];
  }
}
