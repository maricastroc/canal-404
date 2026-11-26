import * as Phaser from "phaser";
import { H, PARTS, W, type PartType } from "../config";
import type { LabCopy, LevelText } from "../copy";
import type { Vec } from "../geometry";
import type { Frame, FrameKind } from "../layout";
import { actOf, type LevelDef } from "../levels";
import { INK, INK_HEX, cartoonText, centerGlyphs, darkPanel, fitText, paper, type Fonts } from "../../kit/ui";
import { addIcon, setIcon, type IconName } from "../icons";
import type { Mood } from "./lina";

export type HudHandlers = {
  onSlotDown: (type: PartType, pointer: Phaser.Input.Pointer) => void;
  onRun: () => void;
  onClear: () => void;
  onHint: () => void;
  onRotate: () => void;
  onRotateBack: () => void;
  onRemove: () => void;
  onUndo: () => void;
  onOverview: () => void;
  onRecenter: () => void;
};

export type HudSetup = {
  scene: Phaser.Scene;
  fonts: Fonts;
  level: LevelDef;
  text: LevelText;
  copy: LabCopy;
  index: number;
  total: number;
  slotTypes: PartType[];
  reduced: boolean;
  handlers: HudHandlers;
  mount?: (obj: Phaser.GameObjects.GameObject) => void;
};

export type { Mood };

export type ViewState = { away: boolean; overview: boolean };

export type ToolbarAnchor = { x: number; top: number; bottom: number };

export type StarReveal = (index: number, lit: boolean, x: number, y: number) => void;

export interface LabHudView {
  readonly kind: FrameKind;
  readonly uiScale: number;
  readonly textScale: number;
  layout(frame: Frame, displayScale: number): void;
  setEnabled(on: boolean): void;
  setCounts(remaining: Partial<Record<PartType, number>>): void;
  setUsed(used: number, par: number): void;
  setUndo(available: boolean): void;
  highlightSlot(type: PartType | null): void;
  nudgeTray(): void;
  pulseRun(on: boolean): void;
  pulseHint(on: boolean): void;
  slotCenter(type: PartType): Vec;
  showToolbar(anchor: ToolbarAnchor, touch: boolean): void;
  hideToolbar(): void;
  isOverTray(part: Vec, pointer: Vec): boolean;
  setBoxHover(on: boolean): void;
  covers(x: number, y: number): boolean;
  showTag(text: string, x: number, y: number): void;
  hideTag(): void;
  hideGoal(): void;
  say(text: string, ms: number, focus: Vec | null): boolean;
  hideSay(): void;
  mood(kind: Mood): void;
  setView(view: ViewState): void;
  setRunning(on: boolean): void;
  setDone(): void;
  flash(text: string, color: string, hold?: number): void;
  celebrate(stars: number, onStar: StarReveal): void;
  destroy(): void;
}

type Slot = {
  type: PartType;
  root: Phaser.GameObjects.Container;
  count: Phaser.GameObjects.Text;
  badge: Phaser.GameObjects.Graphics;
  ring: Phaser.GameObjects.Graphics;
};

type Button = {
  root: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  icon: Phaser.GameObjects.Image;
  hit: Phaser.GameObjects.Rectangle;
  w: number;
  h: number;
};

const SLOT_W = 168;
const SLOT_H = 92;
const TRAY_PAD = 16;
const GAP = 12;
const TRAY_BOTTOM = 12;
const CARD_TOP = 22;
const CARD_H = 134;
const LEVEL_CARD_W = 560;
const PARTS_CARD_W = 330;
const CLEARANCE = 10;
const MIN_FIT = 0.85;
const TOOL_H = 66;
const RUN_GAP = 30;
const BTN = { hint: 124, clear: 150, run: 228 };
export const WIN_STAR = 76;
export const WIN_STAR_POP = 122;

export function drawButtonBg(g: Phaser.GameObjects.Graphics, w: number, h: number, fill: number) {
  g.clear();
  g.fillStyle(INK_HEX, 1);
  g.fillRoundedRect(-w / 2 + 4, -h / 2 + 5, w, h, 16);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.lineStyle(4, INK_HEX, 1);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
}

export { centerGlyphs };

export class DeskHud implements LabHudView {
  readonly kind = "full";
  uiScale = 1;
  private levelCard: Phaser.GameObjects.Container;
  private partsCard: Phaser.GameObjects.Container;
  private usedText: Phaser.GameObjects.Text;
  private parText: Phaser.GameObjects.Text;
  private stars: Phaser.GameObjects.Image[] = [];
  private tray: Phaser.GameObjects.Container;
  private trayW: number;
  private slots: Slot[] = [];
  private runBtn: Button;
  private clearBtn: Button;
  private hintBtn: Button;
  private toolbar: Phaser.GameObjects.Container;
  private toolRotate: Button;
  private toolBack: Button;
  private toolRemove: Button;
  private toolTouch = false;
  private celebration: Phaser.GameObjects.GameObject[] = [];
  private banner: Phaser.GameObjects.Text;
  private tag: Phaser.GameObjects.Text;
  private hintPulse?: Phaser.Tweens.Tween;
  private runPulse?: Phaser.Tweens.Tween;
  private runArrow: Phaser.GameObjects.Container;
  private runPulseOn = false;
  private build: LevelDef["build"];
  private enabled = true;
  private running = false;

  private scene: Phaser.Scene;
  private fonts: Fonts;
  private copy: LabCopy;
  private reduced: boolean;
  private handlers: HudHandlers;

  constructor({ scene, fonts, level, text, copy, index, total, slotTypes, reduced, handlers }: HudSetup) {
    this.scene = scene;
    this.fonts = fonts;
    this.copy = copy;
    this.reduced = reduced;
    this.handlers = handlers;
    this.build = level.build;
    const lg = scene.add.graphics();
    const cardW = LEVEL_CARD_W;
    const cardH = CARD_H;
    paper(lg, 0, 0, cardW, cardH, 22);
    const kicker = cartoonText(scene, 22, 12, copy.hud.level(index + 1, total, actOf(index)), { size: 24, color: "#7b62c4", font: fonts.display, stroke: 0, shadow: false });
    const title = cartoonText(scene, 20, 40, text.title.toUpperCase(), { size: 42, color: INK, font: fonts.display, stroke: 0, shadow: false });
    title.setShadow(3, 3, "#dcc394", 0, false, true);
    fitText(title, cardW - 40, 42, 26);
    const goal = scene.add.text(22, 90, text.goal, { fontFamily: fonts.hand, fontSize: "27px", color: "#3a3157", padding: { x: 2, y: 2 } });
    fitText(goal, cardW - 40, 27, 18);
    this.levelCard = scene.add.container(24, CARD_TOP, [lg, kicker, title, goal]).setDepth(20);

    const pg = scene.add.graphics();
    const pw = PARTS_CARD_W;
    darkPanel(pg, -pw, 0, pw, cardH);
    const plabel = cartoonText(scene, -pw + 20, 12, copy.hud.parts, { size: 24, color: "#9df0dc", font: fonts.display, shadow: false, stroke: 0.16 });
    this.usedText = cartoonText(scene, -pw + 20, 86, "0", { size: 64, color: "#ffc83d", font: fonts.display }).setOrigin(0, 0.5);
    this.parText = scene.add.text(-pw + 128, 104, "", { fontFamily: fonts.hand, fontSize: "22px", color: "#f7ecd4", padding: { x: 2, y: 2 } }).setOrigin(0, 0.5);
    const children: Phaser.GameObjects.GameObject[] = [pg, plabel, this.usedText, this.parText];
    for (let i = 0; i < 3; i += 1) {
      const s = addIcon(scene, -pw + 150 + i * 52, 56, "star", 45);
      this.stars.push(s);
      children.push(s);
    }
    this.partsCard = scene.add.container(W - 24, CARD_TOP, children).setDepth(20);

    const buttonsW = BTN.hint + BTN.clear + BTN.run + GAP + RUN_GAP;
    this.trayW = TRAY_PAD * 2 + slotTypes.length * SLOT_W + (slotTypes.length - 1) * GAP + 28 + buttonsW;
    const tg = scene.add.graphics();
    paper(tg, -this.trayW / 2, -SLOT_H - TRAY_PAD * 2, this.trayW, SLOT_H + TRAY_PAD * 2, 24);
    const trayChildren: Phaser.GameObjects.GameObject[] = [tg];
    let x = -this.trayW / 2 + TRAY_PAD;
    const cy = -SLOT_H / 2 - TRAY_PAD;
    slotTypes.forEach((type, i) => {
      const slot = this.makeSlot(type, i + 1, x + SLOT_W / 2, cy);
      this.slots.push(slot);
      trayChildren.push(slot.root);
      x += SLOT_W + GAP;
    });
    x += 28 - GAP;
    tg.lineStyle(3, INK_HEX, 0.2);
    tg.lineBetween(x - 14, cy - SLOT_H / 2 + 6, x - 14, cy + SLOT_H / 2 - 6);
    this.hintBtn = this.makeButton(copy.hud.hint, BTN.hint, TOOL_H, 0xb9a6ef, x + BTN.hint / 2, cy, ["hint"], () => this.handlers.onHint(), 24);
    x += BTN.hint + GAP;
    this.clearBtn = this.makeButton(copy.hud.clear, BTN.clear, TOOL_H, 0xfbf5e6, x + BTN.clear / 2, cy, ["trash"], () => this.handlers.onClear(), 24);
    x += BTN.clear + RUN_GAP;
    tg.lineBetween(x - RUN_GAP / 2, cy - SLOT_H / 2 + 6, x - RUN_GAP / 2, cy + SLOT_H / 2 - 6);
    this.runBtn = this.makeButton(copy.hud.run, BTN.run, SLOT_H, 0x93cf4c, x + BTN.run / 2, cy, ["play"], () => this.handlers.onRun(), 36);
    trayChildren.push(this.hintBtn.root, this.clearBtn.root, this.runBtn.root);
    this.tray = scene.add.container(W / 2, H - TRAY_BOTTOM, trayChildren).setDepth(20);

    this.toolBack = this.makeButton("", 72, 72, 0xffc83d, -88, 0, ["rotate-back"], () => this.handlers.onRotateBack());
    this.toolRotate = this.makeButton("", 72, 72, 0xffc83d, -44, 0, ["rotate"], () => this.handlers.onRotate());
    this.toolRemove = this.makeButton("", 72, 72, 0xef4f43, 44, 0, ["remove", "remove-inner"], () => this.handlers.onRemove());
    this.toolBack.root.setVisible(false);
    this.toolbar = scene.add.container(0, 0, [this.toolBack.root, this.toolRotate.root, this.toolRemove.root]).setDepth(24).setVisible(false);

    this.banner = cartoonText(scene, W / 2, 330, "", { size: 110, color: "#ffc83d", font: fonts.display, stroke: 0.2 })
      .setOrigin(0.5)
      .setDepth(26)
      .setVisible(false);
    this.runArrow = scene.add.container(0, 0, [addIcon(scene, 0, 0, "arrow-down")]).setDepth(25).setVisible(false);
    this.tag = scene.add
      .text(0, 0, "", {
        fontFamily: fonts.display,
        fontSize: "24px",
        color: "#fbf5e6",
        backgroundColor: "#c4352c",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5, 1)
      .setDepth(25)
      .setVisible(false);
  }

  private makeSlot(type: PartType, key: number, x: number, y: number): Slot {
    const scene = this.scene;
    const def = PARTS[type];
    const label = this.copy.parts[type].noun.word.toUpperCase();
    const g = scene.add.graphics();
    g.fillStyle(0xfffaf0, 1);
    g.fillRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, 16);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, 16);
    const icon = scene.add.image(0, -12, def.tex);
    icon.setScale(Math.min(100 / icon.width, 46 / icon.height));
    if (type === "fan") icon.setX(-6);
    const name = cartoonText(scene, 0, 30, label, { size: 22, color: INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const keyChip = scene.add.graphics();
    keyChip.fillStyle(0x2b2150, 1);
    keyChip.fillRoundedRect(-SLOT_W / 2 + 8, -SLOT_H / 2 + 8, 26, 26, 7);
    const keyText = cartoonText(scene, -SLOT_W / 2 + 21, -SLOT_H / 2 + 21, String(key), { size: 18, color: "#fbf5e6", font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const badge = scene.add.graphics();
    const count = cartoonText(scene, SLOT_W / 2 - 20, -SLOT_H / 2 + 20, "", { size: 22, color: INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const ring = scene.add.graphics().setVisible(false);
    ring.lineStyle(11, INK_HEX, 1);
    ring.strokeRoundedRect(-SLOT_W / 2 - 8, -SLOT_H / 2 - 8, SLOT_W + 16, SLOT_H + 16, 22);
    ring.lineStyle(6, 0xffc83d, 1);
    ring.strokeRoundedRect(-SLOT_W / 2 - 8, -SLOT_H / 2 - 8, SLOT_W + 16, SLOT_H + 16, 22);
    const hit = scene.add.rectangle(0, 0, SLOT_W, SLOT_H, 0xffffff, 0).setInteractive({ useHandCursor: true });
    const root = scene.add.container(x, y, [ring, g, icon, name, keyChip, keyText, badge, count, hit]);
    hit.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled || this.running) return;
      this.handlers.onSlotDown(type, pointer);
    });
    hit.on("pointerover", () => this.enabled && !this.running && !this.reduced && root.setScale(1.04));
    hit.on("pointerout", () => root.setScale(1));
    return { type, root, count, badge, ring };
  }

  private makeButton(
    label: string,
    w: number,
    h: number,
    fill: number,
    x: number,
    y: number,
    icons: [IconName, ...IconName[]],
    onClick: () => void,
    size = 32,
  ): Button {
    const scene = this.scene;
    const bg = scene.add.graphics();
    drawButtonBg(bg, w, h, fill);
    const ix = label ? -w / 2 + 28 : 0;
    const images = icons.map((name) => addIcon(scene, ix, 0, name));
    const text = cartoonText(scene, label ? -w / 2 + 50 : 0, 0, label, { size, color: INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(label ? 0 : 0.5, 0.5);
    centerGlyphs(text);
    const hit = scene.add.rectangle(0, 0, w, h, 0xffffff, 0).setInteractive({ useHandCursor: true });
    const root = scene.add.container(x, y, [bg, ...images, text, hit]);
    const btn: Button = { root, bg, label: text, icon: images[0], hit, w, h };
    hit.on("pointerdown", () => {
      if (!this.enabled) return;
      root.setScale(0.94);
      onClick();
    });
    hit.on("pointerup", () => root.setScale(1));
    hit.on("pointerout", () => root.setScale(1));
    return btn;
  }

  get textScale() {
    return Math.min(this.uiScale, 1.5);
  }

  layout(_frame: Frame, displayScale: number) {
    this.uiScale = Phaser.Math.Clamp(displayScale * 0.55, 1, 1.75);
    const s = this.uiScale;
    const b = this.build;
    const cardFit = (left: number, width: number, scale: number) => {
      const right = left + width * scale;
      if (b.x > right || b.x + b.w < left) return scale;
      return Math.max(MIN_FIT, Math.min(scale, (b.y - CARD_TOP - 2) / CARD_H));
    };
    const cs = Math.min(s, 1.3);
    this.levelCard.setScale(cardFit(24, LEVEL_CARD_W, cs));
    this.partsCard.setScale(cardFit(W - 24 - PARTS_CARD_W * cs, PARTS_CARD_W, cs));
    let ts = Math.min(Math.min(s, 1.4), (W - 24) / this.trayW);
    const half = (this.trayW / 2) * ts;
    if (b.x < W / 2 + half && b.x + b.w > W / 2 - half) {
      const room = (H - TRAY_BOTTOM - (b.y + b.h) - CLEARANCE) / (SLOT_H + TRAY_PAD * 2);
      ts = Math.max(MIN_FIT, Math.min(ts, room));
    }
    this.tray.setScale(ts);
    this.toolbar.setScale(Math.min(s, 1.5));
    if (this.runPulseOn) this.pulseRun(true);
  }

  trayTop() {
    return H - TRAY_BOTTOM - (SLOT_H + TRAY_PAD * 2) * this.tray.scaleY;
  }

  isOverTray(part: Vec) {
    const half = (this.trayW / 2) * this.tray.scaleX;
    return part.y >= this.trayTop() - 10 && part.x >= W / 2 - half - 10 && part.x <= W / 2 + half + 10;
  }

  setBoxHover() {}

  covers() {
    return false;
  }

  setUndo() {}

  hideGoal() {}

  say() {
    return false;
  }

  hideSay() {}

  mood() {}

  setView() {}

  setCounts(remaining: Partial<Record<PartType, number>>) {
    for (const slot of this.slots) {
      const n = remaining[slot.type] ?? 0;
      slot.count.setText(`×${n}`);
      const g = slot.badge;
      g.clear();
      g.fillStyle(n > 0 ? 0xffc83d : 0xd9d2c3, 1);
      g.lineStyle(3, INK_HEX, 1);
      g.fillRoundedRect(36, -40, 46, 30, 10);
      g.strokeRoundedRect(36, -40, 46, 30, 10);
      slot.count.setPosition(59, -25);
      slot.root.setAlpha(n > 0 ? 1 : 0.45);
    }
  }

  highlightSlot(type: PartType | null) {
    for (const slot of this.slots) {
      const on = slot.type === type;
      this.scene.tweens.killTweensOf(slot.ring);
      slot.ring.setVisible(on).setAlpha(1);
      if (on && !this.reduced) this.scene.tweens.add({ targets: slot.ring, alpha: 0.35, duration: 260, yoyo: true, repeat: 2, delay: 450, ease: "Sine.easeInOut" });
    }
  }

  setUsed(used: number, par: number) {
    this.usedText.setText(String(used));
    const projected = used <= par ? 3 : used === par + 1 ? 2 : 1;
    this.stars.forEach((s, i) => {
      const lit = i < projected;
      s.setAlpha(lit ? 1 : 0.28);
      if (lit) s.clearTint();
      else s.setTint(0x6d6390);
    });
    this.parText.setText(this.copy.hud.par(par));
  }

  setRunning(on: boolean) {
    this.running = on;
    this.runBtn.label.setText(on ? this.copy.hud.stop : this.copy.hud.run);
    this.runBtn.label.setFontSize(on ? 30 : 36);
    centerGlyphs(this.runBtn.label);
    drawButtonBg(this.runBtn.bg, this.runBtn.w, this.runBtn.h, on ? 0xef4f43 : 0x93cf4c);
    setIcon(this.runBtn.icon, on ? "stop" : "play");
    if (on) for (const slot of this.slots) slot.root.setAlpha(0.45);
    this.clearBtn.root.setAlpha(on ? 0.45 : 1);
    this.hintBtn.root.setAlpha(on ? 0.45 : 1);
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  setDone() {
    this.setRunning(false);
    this.enabled = false;
    this.pulseRun(false);
    this.pulseHint(false);
    this.hideToolbar();
    this.hideTag();
    this.scene.tweens.add({ targets: this.tray, alpha: 0.5, duration: 250 });
  }

  pulseHint(on: boolean) {
    this.hintPulse?.stop();
    this.hintPulse = undefined;
    this.hintBtn.root.setScale(1);
    if (on && !this.reduced) {
      this.hintPulse = this.scene.tweens.add({ targets: this.hintBtn.root, scale: 1.08, duration: 520, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  pulseRun(on: boolean) {
    this.runPulseOn = on;
    this.runPulse?.stop();
    this.runPulse = undefined;
    this.runBtn.root.setScale(1);
    this.scene.tweens.killTweensOf(this.runArrow);
    this.runArrow.setVisible(false);
    if (!on) return;
    const pos = this.runCenter();
    const s = this.tray.scaleX;
    this.runArrow.setPosition(pos.x, pos.y - 88 * s).setScale(s).setVisible(true);
    if (this.reduced) return;
    this.runPulse = this.scene.tweens.add({ targets: this.runBtn.root, scale: 1.07, duration: 480, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.scene.tweens.add({ targets: this.runArrow, y: pos.y - 108 * s, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
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

  slotCenter(type: PartType) {
    const slot = this.slots.find((s) => s.type === type);
    if (!slot) return { x: W / 2, y: H - 60 };
    const m = slot.root.getWorldTransformMatrix();
    return { x: m.tx, y: m.ty };
  }

  runCenter() {
    const m = this.runBtn.root.getWorldTransformMatrix();
    return { x: m.tx, y: m.ty };
  }

  showToolbar(anchor: ToolbarAnchor, touch: boolean) {
    if (touch !== this.toolTouch) {
      this.toolTouch = touch;
      this.toolBack.root.setVisible(touch);
      this.toolRotate.root.setX(touch ? 0 : -44);
      this.toolRemove.root.setX(touch ? 88 : 44);
    }
    const s = this.toolbar.scaleX;
    const above = anchor.top - 62 * s;
    const x = anchor.x;
    const y = above > 190 ? above : anchor.bottom + 62 * s;
    const reach = touch ? 136 : 100;
    const cx = Phaser.Math.Clamp(x, reach * s, W - reach * s);
    const cy = Phaser.Math.Clamp(y, 60 * s + 150, this.trayTop() - 50 * s);
    this.toolbar.setPosition(cx, cy).setVisible(true);
  }

  hideToolbar() {
    this.toolbar.setVisible(false);
  }

  showTag(text: string, x: number, y: number) {
    this.tag.setText(text).setPosition(Phaser.Math.Clamp(x, 160, W - 160), Math.max(y, 190)).setVisible(true);
  }

  hideTag() {
    this.tag.setVisible(false);
  }

  flash(text: string, color: string, hold = 900) {
    const b = this.banner;
    this.scene.tweens.killTweensOf(b);
    b.setText(text).setColor(color).setVisible(true).setAlpha(1);
    b.setScale(this.reduced ? Math.min(this.uiScale, 1.2) : 0.3);
    if (!this.reduced) this.scene.tweens.add({ targets: b, scale: Math.min(this.uiScale, 1.2), duration: 260, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: b, alpha: 0, delay: hold, duration: 260, onComplete: () => b.setVisible(false) });
  }

  celebrate(stars: number, onStar: StarReveal) {
    const scene = this.scene;
    const s = Math.min(this.uiScale, 1.2);
    const title = cartoonText(scene, W / 2, 196, this.copy.hud.worked, { size: 96, color: "#93cf4c", font: this.fonts.display, stroke: 0.2 })
      .setOrigin(0.5)
      .setDepth(26);
    const plateW = 318;
    const plateH = 100;
    const plate = scene.add.graphics();
    plate.fillStyle(INK_HEX, 1);
    plate.fillRoundedRect(-plateW / 2 + 6, -plateH / 2 + 7, plateW, plateH, 26);
    plate.fillStyle(0x2b2150, 1);
    plate.fillRoundedRect(-plateW / 2, -plateH / 2, plateW, plateH, 26);
    plate.lineStyle(5, INK_HEX, 1);
    plate.strokeRoundedRect(-plateW / 2, -plateH / 2, plateW, plateH, 26);
    const icons = [0, 1, 2].map((i) => addIcon(scene, (i - 1) * 96, 0, "star", WIN_STAR).setTint(0x5a4d8a).setAlpha(0.55));
    const group = scene.add.container(W / 2, 196 + 122 * s, [plate, ...icons]).setDepth(26).setScale(s);
    this.celebration = [title, group];
    const reveal = (i: number) => {
      const icon = icons[i];
      const lit = i < stars;
      const m = icon.getWorldTransformMatrix();
      onStar(i, lit, m.tx, m.ty);
      if (!lit) return;
      icon.clearTint().setAlpha(1);
      if (this.reduced) return;
      icon.setDisplaySize(WIN_STAR_POP, WIN_STAR_POP).setAngle(-30);
      scene.tweens.add({ targets: icon, displayWidth: WIN_STAR, displayHeight: WIN_STAR, angle: 0, duration: 260, ease: "Back.easeOut" });
    };
    scene.tweens.add({ targets: [title, group], alpha: 0, delay: 1750, duration: 240 });
    if (this.reduced) {
      title.setScale(s);
      [0, 1, 2].forEach(reveal);
      return;
    }
    title.setScale(0.25 * s).setAngle(-10);
    scene.tweens.add({ targets: title, scale: s, angle: -2, duration: 300, ease: "Back.easeOut" });
    group.setAlpha(0).setScale(0.6 * s);
    scene.tweens.add({ targets: group, alpha: 1, scale: s, duration: 220, delay: 280, ease: "Back.easeOut" });
    [0, 1, 2].forEach((i) => scene.time.delayedCall(460 + i * 190, () => reveal(i)));
  }

  destroy() {
    this.hintPulse?.stop();
    this.runPulse?.stop();
    for (const obj of [this.levelCard, this.partsCard, this.tray, this.toolbar, this.banner, this.runArrow, this.tag, ...this.celebration]) {
      this.scene.tweens.killTweensOf(obj);
      obj.destroy();
    }
  }
}
