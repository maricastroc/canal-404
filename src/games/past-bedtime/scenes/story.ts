import * as Phaser from "phaser";
import type { Fonts } from "@/games/kit/ui";
import { BrunoView } from "./actors";
import type { Layout } from "./layout";

const INK = 0x1d1830;
const CREAM = 0xfbf5e6;
const SKY = 0x5cb9f0;

export class StoryBox {
  private root: Phaser.GameObjects.Container;
  private panel: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private more: Phaser.GameObjects.Text;
  private nameTag: Phaser.GameObjects.Container;
  private portrait: Phaser.GameObjects.Container;
  private maskShape: Phaser.GameObjects.Graphics;
  private bruno: BrunoView;
  private full = "";
  private shown = 0;
  private timer?: Phaser.Time.TimerEvent;
  open = false;

  constructor(
    private scene: Phaser.Scene,
    private layout: Layout,
    private fonts: Fonts,
    private art: boolean,
    name: string,
    private onClose: () => void = () => undefined,
  ) {
    const round = fonts.round ?? fonts.body;
    const size = Math.round(Math.min(36, Math.max(26, layout.tile * 0.3)));
    this.panel = scene.add.graphics();
    this.text = scene.add.text(0, 0, "", { fontFamily: round, fontSize: `${size}px`, fontStyle: "600", color: "#1d1830", lineSpacing: 10, padding: { x: 2, y: 4 } });
    this.more = scene.add.text(0, 0, "▼", { fontFamily: round, fontSize: "28px", fontStyle: "700", color: "#c94785" }).setOrigin(0.5);
    const tagText = scene.add.text(20, -3, name.toUpperCase(), { fontFamily: fonts.display, fontSize: "26px", color: "#1d1830", padding: { x: 4, y: 4 } }).setOrigin(0, 0.5);
    const tagW = tagText.width + 40;
    const tagBg = scene.add.graphics();
    tagBg.fillStyle(INK, 1);
    tagBg.fillRoundedRect(4, -22, tagW, 44, 12);
    tagBg.fillStyle(SKY, 1);
    tagBg.fillRoundedRect(0, -26, tagW, 44, 12);
    tagBg.lineStyle(4, INK, 1);
    tagBg.strokeRoundedRect(0, -26, tagW, 44, 12);
    this.nameTag = scene.add.container(0, 0, [tagBg, tagText]);
    this.bruno = new BrunoView(scene, 150, art);
    this.bruno.setFacing(2);
    this.bruno.setMood("sneak");
    this.portrait = scene.add.container(0, 0, [this.bruno.container]);
    this.maskShape = scene.make.graphics({}, false);
    this.portrait.setMask(this.maskShape.createGeometryMask());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.maskShape.destroy());
    this.root = scene.add.container(0, 0, [this.panel, this.portrait, this.nameTag, this.text, this.more]).setDepth(70).setVisible(false);
  }

  show(line: string, avoid: { x: number; y: number; w: number; h: number }[] = []) {
    const b = this.layout.frame;
    const portraitR = 60;
    const left = portraitR * 2 + 56;
    const w = Math.min(b.w - 48, 880);
    this.text.setWordWrapWidth(w - left - 70).setText(line);
    const h = Math.max(portraitR * 2 + 44, this.text.height + 80);
    const xs = [b.x + (b.w - w) / 2, b.x + 24, b.x + b.w - w - 24];
    const ys = [b.y + b.h - h - 22, b.y + 30];
    let best = { x: xs[0], y: ys[0] };
    let bestScore = Infinity;
    ys.forEach((cy, j) => {
      xs.forEach((cx, i) => {
        let score = (i + j * 2) * 10;
        for (const a of avoid) {
          const ow = Math.min(cx + w, a.x + a.w) - Math.max(cx, a.x);
          const oh = Math.min(cy + h, a.y + a.h) - Math.max(cy, a.y);
          if (ow > 0 && oh > 0) score += ow * oh;
        }
        if (score < bestScore) {
          bestScore = score;
          best = { x: cx, y: cy };
        }
      });
    });
    const x = Math.round(best.x);
    const y = Math.round(best.y);
    const g = this.panel;
    g.clear();
    g.fillStyle(INK, 0.9);
    g.fillRoundedRect(x + 8, y + 10, w, h, 28);
    g.fillStyle(CREAM, 1);
    g.fillRoundedRect(x, y, w, h, 28);
    g.lineStyle(6, INK, 1);
    g.strokeRoundedRect(x, y, w, h, 28);
    const lines = Math.max(1, this.text.getWrappedText().length);
    const m = this.text.style.getTextMetrics();
    const lineH = m.fontSize + 10;
    const top = y + Math.round((h - (lines * lineH - 10)) / 2) - 4;
    g.fillStyle(0xe2cc9f, 0.75);
    for (let i = 0; i < lines; i += 1) g.fillRect(x + left - 6, Math.round(top + 4 + m.ascent + i * lineH + 6), w - left - 50, 3);
    const cx = x + 30 + portraitR;
    const cy = y + h / 2;
    g.fillStyle(INK, 1);
    g.fillCircle(cx + 6, cy + 8, portraitR + 4);
    g.fillStyle(SKY, 1);
    g.fillCircle(cx, cy, portraitR);
    this.maskShape.clear();
    this.maskShape.fillStyle(0xffffff, 1);
    this.maskShape.fillCircle(cx, cy, portraitR - 3);
    if (this.art) this.bruno.container.setPosition(cx, cy + 128).setScale(1.25);
    else this.bruno.container.setPosition(cx, cy + 34).setScale(1.55);
    const ring = this.scene.add.graphics();
    ring.lineStyle(6, INK, 1);
    ring.strokeCircle(cx, cy, portraitR);
    this.root.addAt(ring, 2);
    this.nameTag.setPosition(x + left - 10, y - 2);
    this.text.setPosition(x + left, top).setText("");
    this.more.setPosition(x + w - 40, y + h - 34).setVisible(false);
    this.scene.tweens.killTweensOf(this.more);
    this.scene.tweens.add({ targets: this.more, y: y + h - 28, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.full = line;
    this.shown = 0;
    this.open = true;
    this.root.setVisible(true).setAlpha(0).setY(24);
    this.scene.tweens.add({ targets: this.root, alpha: 1, y: 0, duration: 180, ease: "Quad.easeOut" });
    this.timer?.remove();
    this.timer = this.scene.time.addEvent({
      delay: 22,
      loop: true,
      callback: () => {
        this.shown += 1;
        this.text.setText(this.full.slice(0, this.shown));
        if (this.shown >= this.full.length) this.finishTyping();
      },
    });
  }

  private finishTyping() {
    this.timer?.remove();
    this.timer = undefined;
    this.text.setText(this.full);
    this.more.setVisible(true);
  }

  advance() {
    if (!this.open) return false;
    if (this.timer) {
      this.finishTyping();
      return true;
    }
    this.close();
    return true;
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.onClose();
    this.timer?.remove();
    this.timer = undefined;
    this.scene.tweens.add({ targets: this.root, alpha: 0, y: 16, duration: 160, onComplete: () => this.root.setVisible(false) });
  }
}
