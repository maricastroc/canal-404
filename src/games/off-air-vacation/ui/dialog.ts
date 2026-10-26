import * as Phaser from "phaser";
import type { Fonts } from "../../kit/ui";
import { INK_HEX } from "../../kit/ui";

export type DialogLine = { name: string; face: string | null; text: string; color: number; blip: () => void; label?: string };

const BOTTOM = 1044;
const MAX_W = 1400;
const MIN_W = { face: 760, plain: 620 };
const TEXT = { size: 41, line: 10 };
const PAD = { top: 40, bottom: 46, right: 96, plain: 60, face: 234 };
const PORTRAIT_R = 92;
const DEPTH = 9000;
const CREAM = 0xfbf5e6;
const NIGHT = 0x2b2150;

type Box = { x: number; y: number; w: number; h: number };

export class DialogBox {
  readonly root: Phaser.GameObjects.Container;
  private panel: Phaser.GameObjects.Graphics;
  private portraitBg: Phaser.GameObjects.Graphics;
  private portrait: Phaser.GameObjects.Image;
  private maskShape: Phaser.GameObjects.Graphics;
  private nameTag: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private nameBg: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private measure: Phaser.GameObjects.Text;
  private more: Phaser.GameObjects.Text;
  private choices: { root: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; w: number; raw: string }[] = [];
  private full = "";
  private shown = 0;
  private typing = false;
  private acc = 0;
  private resolveLine: (() => void) | null = null;
  private resolveChoice: ((i: number) => void) | null = null;
  private selected = 0;
  private blip: (() => void) | null = null;
  private narrator = false;
  private box: Box = { x: 260, y: 860, w: 1400, h: 184 };
  open = false;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    private reduced: boolean,
    private onSelectSound: () => void,
  ) {
    const round = fonts.round ?? fonts.body;
    this.panel = scene.add.graphics();
    this.portraitBg = scene.add.graphics();
    this.portrait = scene.add.image(0, 0, "face-deco-normal");
    this.maskShape = scene.make.graphics({}, false);
    this.maskShape.setScrollFactor(0);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.maskShape.destroy());
    this.portrait.setMask(this.maskShape.createGeometryMask());
    this.nameBg = scene.add.graphics();
    this.nameText = scene.add.text(0, 0, "", { fontFamily: fonts.display, fontSize: "30px", color: "#1d1830", padding: { x: 4, y: 4 } }).setOrigin(0, 0.5);
    this.nameTag = scene.add.container(0, 0, [this.nameBg, this.nameText]);
    const style = { fontFamily: round, fontSize: `${TEXT.size}px`, fontStyle: "600", color: "#1d1830", lineSpacing: TEXT.line, padding: { x: 2, y: 4 } };
    this.text = scene.add.text(0, 0, "", style);
    this.measure = scene.add.text(0, 0, "", { ...style, wordWrap: { width: 1000 } }).setVisible(false);
    this.more = scene.add.text(0, 0, "▼", { fontFamily: round, fontSize: "30px", fontStyle: "700", color: "#c94785" }).setOrigin(0.5);
    this.root = scene.add
      .container(0, 0, [this.panel, this.portraitBg, this.portrait, this.nameTag, this.text, this.more])
      .setDepth(DEPTH)
      .setScrollFactor(0, 0, true)
      .setVisible(false);
  }

  private wrap(text: string, width: number) {
    this.measure.setWordWrapWidth(width);
    const lines = this.measure.getWrappedText(text).map((l) => l.trimEnd());
    let widest = 0;
    for (const l of lines) {
      this.measure.setText(l);
      widest = Math.max(widest, this.measure.width);
    }
    return { lines, widest };
  }

  private layout(line: DialogLine) {
    const narrator = !line.face;
    this.narrator = narrator;
    const tag = narrator ? line.label ?? "" : line.name;
    const left = narrator ? PAD.plain : PAD.face;
    const maxText = MAX_W - left - PAD.right;
    const { lines, widest } = this.wrap(line.text, maxText);
    this.nameText.setText(tag.toUpperCase());
    const tagW = tag ? this.nameText.width + 40 : 0;
    const lineH = TEXT.size * 1.24 + TEXT.line;
    const textH = lines.length * lineH - TEXT.line;
    const w = Phaser.Math.Clamp(Math.max(left + widest + PAD.right, left + tagW + 40), narrator ? MIN_W.plain : MIN_W.face, MAX_W);
    const h = Math.max(narrator ? 150 : 176, PAD.top + textH + PAD.bottom);
    const box = { x: Math.round(960 - w / 2), y: BOTTOM - h, w, h };
    this.box = box;

    const g = this.panel;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(box.x + 8, box.y + 10, w, h, 30);
    g.fillStyle(narrator ? NIGHT : CREAM, 1);
    g.fillRoundedRect(box.x, box.y, w, h, 30);
    g.lineStyle(6, INK_HEX, 1);
    g.strokeRoundedRect(box.x, box.y, w, h, 30);
    if (narrator) {
      g.lineStyle(3, 0x5a4790, 1);
      g.strokeRoundedRect(box.x + 12, box.y + 12, w - 24, h - 24, 22);
    } else {
      g.fillStyle(0xecd9b2, 0.55);
      for (let i = 1; i < lines.length + 1; i += 1) g.fillRect(box.x + left - 6, box.y + PAD.top + i * lineH - TEXT.line / 2 + 2, w - left - 50, 3);
    }

    this.portraitBg.clear();
    this.portrait.setVisible(!narrator);
    if (!narrator) {
      const cx = box.x + 116;
      const cy = box.y + Math.min(h / 2, 92);
      const p = this.portraitBg;
      p.fillStyle(INK_HEX, 1);
      p.fillCircle(cx + 6, cy + 8, PORTRAIT_R + 4);
      p.fillStyle(line.color, 1);
      p.fillCircle(cx, cy, PORTRAIT_R);
      p.lineStyle(7, INK_HEX, 1);
      p.strokeCircle(cx, cy, PORTRAIT_R);
      this.maskShape.clear();
      this.maskShape.fillStyle(0xffffff, 1);
      this.maskShape.fillCircle(cx, cy, PORTRAIT_R - 3);
      this.portrait.setTexture(line.face!);
      const tex = this.scene.textures.get(line.face!).getSourceImage() as HTMLImageElement;
      this.portrait.setScale((PORTRAIT_R * 2 - 6) / Math.max(tex.width, 1)).setPosition(cx, cy + (tex.height > tex.width ? 14 : 0));
    }

    this.nameTag.setVisible(Boolean(tag));
    if (tag) {
      const nb = this.nameBg;
      const fill = narrator ? 0xffc83d : line.color;
      nb.clear();
      nb.fillStyle(INK_HEX, 1);
      nb.fillRoundedRect(4, -24, tagW, 50, 14);
      nb.fillStyle(fill, 1);
      nb.fillRoundedRect(0, -28, tagW, 50, 14);
      nb.lineStyle(5, INK_HEX, 1);
      nb.strokeRoundedRect(0, -28, tagW, 50, 14);
      this.nameText.setPosition(20, -3);
      this.nameTag.setPosition(box.x + left - 10, box.y - 2);
    }

    this.text
      .setPosition(box.x + left, box.y + PAD.top - 4)
      .setColor(narrator ? "#fbf5e6" : "#1d1830");
    this.more.setColor(narrator ? "#ffc83d" : "#c94785").setPosition(box.x + w - 46, box.y + h - 38);
    return lines.join("\n");
  }

  show(line: DialogLine): Promise<void> {
    this.open = true;
    this.clearChoices();
    const wrapped = this.layout(line);
    this.full = wrapped;
    this.shown = 0;
    this.acc = 0;
    this.typing = !this.reduced;
    this.blip = line.blip;
    this.text.setText(this.reduced ? wrapped : "");
    if (this.reduced) this.shown = wrapped.length;
    this.more.setVisible(!this.typing);
    if (!this.root.visible) {
      this.root.setVisible(true).setAlpha(0);
      if (this.reduced) this.root.setAlpha(1);
      else {
        this.root.y = 30;
        this.scene.tweens.add({ targets: this.root, alpha: 1, y: 0, duration: 160, ease: "Quad.easeOut" });
      }
    }
    return new Promise((resolve) => {
      this.resolveLine = resolve;
    });
  }

  choose(options: string[]): Promise<number> {
    this.clearChoices();
    this.more.setVisible(false);
    this.selected = 0;
    const round = this.fonts.round ?? this.fonts.body;
    const right = this.box.x + this.box.w;
    const baseY = this.box.y - 56;
    options.forEach((opt, i) => {
      const label = this.scene.add.text(0, 0, opt, { fontFamily: round, fontSize: "34px", fontStyle: "600", color: "#fbf5e6", padding: { x: 2, y: 4 } }).setOrigin(0, 0.5);
      const w = Math.max(400, label.width + 100);
      const bg = this.scene.add.graphics();
      const y = baseY - (options.length - 1 - i) * 82;
      const root = this.scene.add.container(Math.min(right, 1880) - w, y, [bg, label]);
      label.setPosition(52, -2);
      root.setScrollFactor(0, 0, true);
      this.root.add(root);
      this.choices.push({ root, bg, label, w, raw: opt });
    });
    this.paintChoices();
    return new Promise((resolve) => {
      this.resolveChoice = resolve;
    });
  }

  pointer(px: number, py: number, down: boolean) {
    if (!this.resolveChoice) {
      if (down && this.open && py > this.box.y - 40) this.advance();
      return down && this.open;
    }
    const hit = this.choices.findIndex((c) => px >= c.root.x && px <= c.root.x + c.w && py >= c.root.y - 38 && py <= c.root.y + 32);
    if (hit >= 0 && hit !== this.selected) {
      this.selected = hit;
      this.paintChoices();
    }
    if (down && hit >= 0) this.confirmChoice();
    return true;
  }

  private paintChoices() {
    this.choices.forEach((c, i) => {
      const on = i === this.selected;
      c.bg.clear();
      c.bg.fillStyle(INK_HEX, 1);
      c.bg.fillRoundedRect(6, -30, c.w, 66, 18);
      c.bg.fillStyle(on ? 0xffc83d : NIGHT, 1);
      c.bg.fillRoundedRect(0, -36, c.w, 66, 18);
      c.bg.lineStyle(5, on ? INK_HEX : 0x7b62c4, 1);
      c.bg.strokeRoundedRect(0, -36, c.w, 66, 18);
      c.label.setColor(on ? "#1d1830" : "#fbf5e6");
      c.label.setText((on ? "▸ " : "") + c.raw);
    });
  }

  private clearChoices() {
    for (const c of this.choices) c.root.destroy();
    this.choices = [];
    this.resolveChoice = null;
  }

  private confirmChoice() {
    const r = this.resolveChoice;
    if (!r) return;
    this.onSelectSound();
    const i = this.selected;
    this.clearChoices();
    r(i);
  }

  key(key: string) {
    if (this.resolveChoice) {
      if (key === "up" || key === "left") {
        this.selected = (this.selected + this.choices.length - 1) % this.choices.length;
        this.paintChoices();
        this.onSelectSound();
      } else if (key === "down" || key === "right") {
        this.selected = (this.selected + 1) % this.choices.length;
        this.paintChoices();
        this.onSelectSound();
      } else if (key === "ok") this.confirmChoice();
      return;
    }
    if (key === "ok") this.advance();
  }

  advance() {
    if (this.resolveChoice) return;
    if (this.typing) {
      this.typing = false;
      this.shown = this.full.length;
      this.text.setText(this.full);
      this.more.setVisible(true);
      return;
    }
    const r = this.resolveLine;
    this.resolveLine = null;
    r?.();
  }

  close() {
    this.open = false;
    this.clearChoices();
    this.resolveLine = null;
    if (this.reduced) {
      this.root.setVisible(false);
      return;
    }
    this.scene.tweens.add({ targets: this.root, alpha: 0, duration: 140, onComplete: () => this.root.setVisible(false) });
  }

  update(time: number, dt: number) {
    if (this.more.visible && !this.reduced) this.more.setY(this.box.y + this.box.h - 38 + Math.sin(time / 180) * 5);
    if (!this.typing) return;
    this.acc += dt * 48;
    const next = Math.min(this.full.length, Math.floor(this.acc));
    if (next > this.shown) {
      const before = this.shown;
      this.shown = next;
      this.text.setText(this.full.slice(0, this.shown));
      if (Math.floor(before / 3) !== Math.floor(this.shown / 3) && !this.narrator) this.blip?.();
    }
    if (this.shown >= this.full.length) {
      this.typing = false;
      this.more.setVisible(true);
    }
  }

  get waitingChoice() {
    return Boolean(this.resolveChoice);
  }

  get top() {
    return this.open ? this.box.y : 1080;
  }
}
