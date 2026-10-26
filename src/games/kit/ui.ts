import * as Phaser from "phaser";

const SCREEN_W = 1920;

export const INK = "#1d1830";
export const INK_HEX = 0x1d1830;
export const CREAM_HEX = 0xfbf5e6;

export type Fonts = { display: string; body: string; hand: string; round?: string };

type TextOpts = {
  size: number;
  color: string;
  font: string;
  stroke?: number;
  shadow?: boolean;
  align?: "left" | "center" | "right";
  wrap?: number;
};

export function cartoonText(scene: Phaser.Scene, x: number, y: number, text: string, opts: TextOpts) {
  const stroke = opts.stroke ?? 0.2;
  const t = scene.add.text(x, y, text, {
    fontFamily: opts.font,
    fontSize: `${opts.size}px`,
    color: opts.color,
    stroke: INK,
    strokeThickness: stroke > 0 ? Math.max(3, Math.round(opts.size * stroke)) : 0,
    align: opts.align ?? "left",
    padding: { x: Math.ceil(opts.size * 0.12), y: Math.ceil(opts.size * 0.12) },
    wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
  });
  if (opts.shadow !== false) {
    t.setShadow(Math.max(2, Math.round(opts.size * 0.06)), Math.max(2, Math.round(opts.size * 0.08)), INK, 0, true, true);
  }
  return t;
}

export function fitText(text: Phaser.GameObjects.Text, maxWidth: number, baseSize: number, minSize: number) {
  let size = baseSize;
  text.setFontSize(size);
  while (text.width > maxWidth && size > minSize) {
    size -= 2;
    text.setFontSize(size);
  }
}

export function paper(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, fill = CREAM_HEX, shadow = 7) {
  g.fillStyle(INK_HEX, 1);
  g.fillRoundedRect(x + shadow * 0.85, y + shadow, w, h, r);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x, y, w, h, r);
  g.lineStyle(5, INK_HEX, 1);
  g.strokeRoundedRect(x, y, w, h, r);
}

export function darkPanel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
  g.fillStyle(INK_HEX, 1);
  g.fillRoundedRect(x + 6, y + 7, w, h, 22);
  g.fillStyle(0x2b2150, 0.94);
  g.fillRoundedRect(x, y, w, h, 22);
  g.lineStyle(5, INK_HEX, 1);
  g.strokeRoundedRect(x, y, w, h, 22);
}

export class Bubble {
  readonly container: Phaser.GameObjects.Container;
  private gfx: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private hideTimer?: Phaser.Time.TimerEvent;
  private baseScale = 1;

  constructor(
    private scene: Phaser.Scene,
    fonts: Fonts,
    private tail: "left" | "right",
    size = 34,
    depth = 16,
  ) {
    this.gfx = scene.add.graphics();
    this.text = scene.add
      .text(0, 0, "", {
        fontFamily: fonts.display,
        fontSize: `${size}px`,
        color: INK,
        align: "center",
        padding: { x: 4, y: 4 },
        lineSpacing: -4,
      })
      .setOrigin(0.5);
    this.container = scene.add.container(0, 0, [this.gfx, this.text]).setDepth(depth).setVisible(false);
  }

  setBaseScale(scale: number) {
    this.baseScale = scale;
    if (this.container.visible) this.container.setScale(scale);
  }

  say(text: string, x: number, y: number, duration = 1400) {
    this.text.setText(text);
    const w = this.text.width + 40;
    const h = this.text.height + 20;
    const left = this.tail === "left" ? -34 : -(w - 34);
    const top = -h - 24;
    const g = this.gfx;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(left + 5, top + 6, w, h, 18);
    g.fillStyle(CREAM_HEX, 1);
    g.fillRoundedRect(left, top, w, h, 18);
    g.lineStyle(5, INK_HEX, 1);
    g.strokeRoundedRect(left, top, w, h, 18);
    g.fillStyle(CREAM_HEX, 1);
    g.fillTriangle(-14, -27, 14, -27, 0, 0);
    g.lineBetween(-14, -24, 0, 0);
    g.lineBetween(14, -24, 0, 0);
    this.text.setPosition(left + w / 2, top + h / 2);
    const s = this.baseScale;
    const cx = Phaser.Math.Clamp(x, 12 - left * s, SCREEN_W - 12 - (left + w) * s);
    const cy = Math.max(y, 12 - top * s);
    this.container.setPosition(cx, cy);
    this.container.setVisible(true).setAlpha(1).setScale(s * 0.4);
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({ targets: this.container, scale: s, duration: 200, ease: "Back.easeOut" });
    this.hideTimer?.remove();
    this.hideTimer = this.scene.time.delayedCall(duration, () => this.hide());
  }

  hide() {
    this.hideTimer?.remove();
    if (!this.container.visible) return;
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scale: this.baseScale * 0.85,
      duration: 140,
      onComplete: () => this.container.setVisible(false),
    });
  }
}

