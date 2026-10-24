import * as Phaser from "phaser";
import { H, PARTS, W, type PartType } from "../config";
import type { LevelDef } from "../levels";
import { INK, INK_HEX, cartoonText, darkPanel, fitText, paper, type Fonts } from "../../kit/ui";
import { addIcon, setIcon, type IconName } from "../icons";

type Handlers = {
  onSlotDown: (type: PartType, pointer: Phaser.Input.Pointer) => void;
  onRun: () => void;
  onClear: () => void;
  onHint: () => void;
  onRotate: () => void;
  onRemove: () => void;
};

type Slot = {
  type: PartType;
  root: Phaser.GameObjects.Container;
  count: Phaser.GameObjects.Text;
  badge: Phaser.GameObjects.Graphics;
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

function drawButtonBg(g: Phaser.GameObjects.Graphics, w: number, h: number, fill: number) {
  g.clear();
  g.fillStyle(INK_HEX, 1);
  g.fillRoundedRect(-w / 2 + 4, -h / 2 + 5, w, h, 16);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.lineStyle(4, INK_HEX, 1);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
}

function centerGlyphs(text: Phaser.GameObjects.Text) {
  if (!text.text) return text.setY(0);
  const { ascent, descent } = text.getTextMetrics();
  text.style.syncFont(text.canvas, text.context);
  const m = text.context.measureText(text.text);
  return text.setY((m.actualBoundingBoxAscent - m.actualBoundingBoxDescent - ascent + descent) / 2);
}

export class LabHud {
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
  private banner: Phaser.GameObjects.Text;
  private tag: Phaser.GameObjects.Text;
  private hintPulse?: Phaser.Tweens.Tween;
  private runPulse?: Phaser.Tweens.Tween;
  private runArrow: Phaser.GameObjects.Container;
  private runPulseOn = false;
  private enabled = true;
  private running = false;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    level: LevelDef,
    index: number,
    total: number,
    slotTypes: PartType[],
    private reduced: boolean,
    private handlers: Handlers,
  ) {
    const lg = scene.add.graphics();
    const cardW = 560;
    const cardH = 134;
    paper(lg, 0, 0, cardW, cardH, 22);
    const kicker = cartoonText(scene, 22, 12, `FASE ${index + 1} DE ${total}`, { size: 24, color: "#7b62c4", font: fonts.display, stroke: 0, shadow: false });
    const title = cartoonText(scene, 20, 40, level.title.toUpperCase(), { size: 42, color: INK, font: fonts.display, stroke: 0, shadow: false });
    title.setShadow(3, 3, "#dcc394", 0, false, true);
    fitText(title, cardW - 40, 42, 26);
    const goal = scene.add.text(22, 90, level.goalText, { fontFamily: fonts.hand, fontSize: "27px", color: "#3a3157", padding: { x: 2, y: 2 } });
    fitText(goal, cardW - 40, 27, 18);
    this.levelCard = scene.add.container(24, 22, [lg, kicker, title, goal]).setDepth(20);

    const pg = scene.add.graphics();
    const pw = 330;
    darkPanel(pg, -pw, 0, pw, cardH);
    const plabel = cartoonText(scene, -pw + 20, 12, "PEÇAS", { size: 24, color: "#9df0dc", font: fonts.display, shadow: false, stroke: 0.16 });
    this.usedText = cartoonText(scene, -pw + 20, 86, "0", { size: 64, color: "#ffc83d", font: fonts.display }).setOrigin(0, 0.5);
    this.parText = scene.add.text(-pw + 128, 104, "", { fontFamily: fonts.hand, fontSize: "22px", color: "#f7ecd4", padding: { x: 2, y: 2 } }).setOrigin(0, 0.5);
    const children: Phaser.GameObjects.GameObject[] = [pg, plabel, this.usedText, this.parText];
    for (let i = 0; i < 3; i += 1) {
      const s = scene.add.image(-pw + 150 + i * 52, 56, "star").setScale(1.25);
      this.stars.push(s);
      children.push(s);
    }
    this.partsCard = scene.add.container(W - 24, 22, children).setDepth(20);

    const buttonsW = 128 + 160 + 210 + GAP * 2;
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
    this.hintBtn = this.makeButton("DICA", 128, SLOT_H - 8, 0xb9a6ef, x + 64, cy, ["hint"], () => this.handlers.onHint());
    x += 128 + GAP;
    this.clearBtn = this.makeButton("LIMPAR", 160, SLOT_H - 8, 0xfbf5e6, x + 80, cy, ["trash"], () => this.handlers.onClear());
    x += 160 + GAP;
    this.runBtn = this.makeButton("LIGAR", 210, SLOT_H, 0x93cf4c, x + 105, cy, ["play"], () => this.handlers.onRun());
    trayChildren.push(this.hintBtn.root, this.clearBtn.root, this.runBtn.root);
    this.tray = scene.add.container(W / 2, H - TRAY_BOTTOM, trayChildren).setDepth(20);

    const rotate = this.makeButton("", 72, 72, 0xffc83d, -44, 0, ["rotate"], () => this.handlers.onRotate());
    const remove = this.makeButton("", 72, 72, 0xef4f43, 44, 0, ["remove", "remove-inner"], () => this.handlers.onRemove());
    this.toolbar = scene.add.container(0, 0, [rotate.root, remove.root]).setDepth(24).setVisible(false);

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
    const g = scene.add.graphics();
    g.fillStyle(0xfffaf0, 1);
    g.fillRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, 16);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, 16);
    const icon = scene.add.image(0, -12, def.tex);
    icon.setScale(Math.min(100 / icon.width, 46 / icon.height));
    if (type === "fan") icon.setX(-6);
    const name = cartoonText(scene, 0, 30, def.name.toUpperCase(), { size: 22, color: INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const keyChip = scene.add.graphics();
    keyChip.fillStyle(0x2b2150, 1);
    keyChip.fillRoundedRect(-SLOT_W / 2 + 8, -SLOT_H / 2 + 8, 26, 26, 7);
    const keyText = cartoonText(scene, -SLOT_W / 2 + 21, -SLOT_H / 2 + 21, String(key), { size: 18, color: "#fbf5e6", font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const badge = scene.add.graphics();
    const count = cartoonText(scene, SLOT_W / 2 - 20, -SLOT_H / 2 + 20, "", { size: 22, color: INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const hit = scene.add.rectangle(0, 0, SLOT_W, SLOT_H, 0xffffff, 0).setInteractive({ useHandCursor: true });
    const root = scene.add.container(x, y, [g, icon, name, keyChip, keyText, badge, count, hit]);
    hit.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled || this.running) return;
      this.handlers.onSlotDown(type, pointer);
    });
    hit.on("pointerover", () => this.enabled && !this.running && !this.reduced && root.setScale(1.04));
    hit.on("pointerout", () => root.setScale(1));
    return { type, root, count, badge };
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
  ): Button {
    const scene = this.scene;
    const bg = scene.add.graphics();
    drawButtonBg(bg, w, h, fill);
    const ix = label ? -w / 2 + 28 : 0;
    const images = icons.map((name) => addIcon(scene, ix, 0, name));
    const text = cartoonText(scene, label ? -w / 2 + 50 : 0, 0, label, { size: label.length > 5 ? 26 : 32, color: INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(label ? 0 : 0.5, 0.5);
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

  layout(displayScale: number) {
    this.uiScale = Phaser.Math.Clamp(displayScale * 0.55, 1, 1.75);
    const s = this.uiScale;
    this.levelCard.setScale(Math.min(s, 1.3));
    this.partsCard.setScale(Math.min(s, 1.3));
    const ts = Math.min(Math.min(s, 1.4), (W - 24) / this.trayW);
    this.tray.setScale(ts);
    this.toolbar.setScale(Math.min(s, 1.5));
    if (this.runPulseOn) this.pulseRun(true);
  }

  trayTop() {
    return H - TRAY_BOTTOM - (SLOT_H + TRAY_PAD * 2) * this.tray.scaleY;
  }

  isOverTray(x: number, y: number) {
    const half = (this.trayW / 2) * this.tray.scaleX;
    return y >= this.trayTop() - 10 && x >= W / 2 - half - 10 && x <= W / 2 + half + 10;
  }

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

  setUsed(used: number, par: number) {
    this.usedText.setText(String(used));
    const projected = used <= par ? 3 : used === par + 1 ? 2 : 1;
    this.stars.forEach((s, i) => {
      const lit = i < projected;
      s.setAlpha(lit ? 1 : 0.28);
      if (lit) s.clearTint();
      else s.setTint(0x6d6390);
    });
    this.parText.setText(par === 1 ? "3 estrelas: 1 peça" : `3 estrelas: até ${par} peças`);
  }

  setRunning(on: boolean) {
    this.running = on;
    this.runBtn.label.setText(on ? "DESLIGAR" : "LIGAR");
    this.runBtn.label.setFontSize(on ? 26 : 32);
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

  showToolbar(x: number, y: number) {
    const s = this.toolbar.scaleX;
    const cx = Phaser.Math.Clamp(x, 100 * s, W - 100 * s);
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

  hideAll() {
    this.tray.setVisible(false);
    this.hideToolbar();
    this.hideTag();
  }
}
