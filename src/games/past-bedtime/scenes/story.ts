import * as Phaser from "phaser";
import type { Fonts } from "@/games/kit/ui";
import { BrunoView } from "./actors";
import { iconKey } from "./icons";
import type { Layout } from "./layout";

const INK = 0x1d1830;
const CREAM = 0xfbf5e6;
const SKY = 0x5cb9f0;

export class StoryBox {
  private root: Phaser.GameObjects.Container;
  private panel: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private more: Phaser.GameObjects.Image;
  private nameTag: Phaser.GameObjects.Container;
  private portrait: Phaser.GameObjects.Container;
  private maskShape: Phaser.GameObjects.Graphics;
  private bruno: BrunoView;
  private full = "";
  private shown = 0;
  private timer?: Phaser.Time.TimerEvent;
  private k: number;
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
    const k = layout.ui;
    this.k = k;
    const size = layout.kind === "full" ? Math.round(Math.min(36, Math.max(26, layout.tile * 0.3))) : Math.round(15.5 * layout.unit);
    this.panel = scene.add.graphics();
    this.text = scene.add.text(0, 0, "", { fontFamily: round, fontSize: `${size}px`, fontStyle: "600", color: "#1d1830", lineSpacing: 10 * k, padding: { x: 2, y: 4 } });
    this.more = scene.add.image(0, 0, iconKey("more")).setDisplaySize(32 * k, 32 * k);
    const tagText = scene.add.text(20 * k, -3 * k, name.toUpperCase(), { fontFamily: fonts.display, fontSize: `${Math.round(26 * k)}px`, color: "#1d1830", padding: { x: 4, y: 4 } }).setOrigin(0, 0.5);
    const tagW = tagText.width + 40 * k;
    const tagBg = scene.add.graphics();
    tagBg.fillStyle(INK, 1);
    tagBg.fillRoundedRect(4 * k, -22 * k, tagW, 44 * k, 12 * k);
    tagBg.fillStyle(SKY, 1);
    tagBg.fillRoundedRect(0, -26 * k, tagW, 44 * k, 12 * k);
    tagBg.lineStyle(4 * k, INK, 1);
    tagBg.strokeRoundedRect(0, -26 * k, tagW, 44 * k, 12 * k);
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
    const k = this.k;
    const b = this.layout.kind === "full" ? this.layout.frame : this.layout.map;
    const phone = this.layout.kind !== "full";
    const w = Math.min(b.w - 48 * k, 880 * k);
    const portraitR = phone ? Math.min(60 * k, w * 0.12) : 60 * k;
    const pk = portraitR / 60;
    const left = portraitR * 2 + 56 * k;
    const right = phone ? 44 * k : 70 * k;
    this.text.setWordWrapWidth(w - left - right).setText(line);
    const h = Math.max(portraitR * 2 + 44 * k, this.text.height + 80 * k);
    const xs = [b.x + (b.w - w) / 2, b.x + 24 * k, b.x + b.w - w - 24 * k];
    const ys = [b.y + b.h - h - 22 * k, b.y + 30 * k];
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
    g.fillRoundedRect(x + 8 * k, y + 10 * k, w, h, 28 * k);
    g.fillStyle(CREAM, 1);
    g.fillRoundedRect(x, y, w, h, 28 * k);
    g.lineStyle(6 * k, INK, 1);
    g.strokeRoundedRect(x, y, w, h, 28 * k);
    const lines = Math.max(1, this.text.getWrappedText().length);
    const m = this.text.style.getTextMetrics();
    const lineH = m.fontSize + 10 * k;
    const top = y + Math.round((h - (lines * lineH - 10 * k)) / 2) - 4 * k;
    g.fillStyle(0xe2cc9f, 0.75);
    for (let i = 0; i < lines; i += 1) g.fillRect(x + left - 6 * k, Math.round(top + 4 * k + m.ascent + i * lineH + 6 * k), w - left - (right - 20 * k), 3 * k);
    const cx = x + 30 * k + portraitR;
    const cy = y + h / 2;
    g.fillStyle(INK, 1);
    g.fillCircle(cx + 6 * k, cy + 8 * k, portraitR + 4 * k);
    g.fillStyle(SKY, 1);
    g.fillCircle(cx, cy, portraitR);
    this.maskShape.clear();
    this.maskShape.fillStyle(0xffffff, 1);
    this.maskShape.fillCircle(cx, cy, portraitR - 3 * k);
    if (this.art) this.bruno.container.setPosition(cx, cy + 128 * pk).setScale(1.25 * pk);
    else this.bruno.container.setPosition(cx, cy + 34 * pk).setScale(1.55 * pk);
    const ring = this.scene.add.graphics();
    ring.lineStyle(6 * k, INK, 1);
    ring.strokeCircle(cx, cy, portraitR);
    this.root.addAt(ring, 2);
    this.nameTag.setPosition(x + left - 10 * k, y - 2 * k);
    this.text.setPosition(x + left, top).setText("");
    this.more.setPosition(x + w - (right - 30 * k), y + h - 34 * k).setVisible(false);
    this.scene.tweens.killTweensOf(this.more);
    this.scene.tweens.add({ targets: this.more, y: y + h - 28 * k, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.full = line;
    this.shown = 0;
    this.open = true;
    this.root.setVisible(true).setAlpha(0).setY(24 * k);
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
    this.scene.tweens.add({ targets: this.root, alpha: 0, y: 16 * this.k, duration: 160, onComplete: () => this.root.setVisible(false) });
  }
}
