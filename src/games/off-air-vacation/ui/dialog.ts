import * as Phaser from "phaser";
import type { Fonts } from "../../kit/ui";
import { INK_HEX } from "../../kit/ui";

export type DialogLine = { name: string; face: string | null; text: string; color: number; blip: () => void };

const PANEL = { x: 230, y: 792, w: 1460, h: 250 };
const DEPTH = 9000;

export class DialogBox {
  readonly root: Phaser.GameObjects.Container;
  private panel: Phaser.GameObjects.Graphics;
  private portraitBg: Phaser.GameObjects.Graphics;
  private portrait: Phaser.GameObjects.Image;
  private nameTag: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private nameBg: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private more: Phaser.GameObjects.Text;
  private choices: { root: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; w: number }[] = [];
  private full = "";
  private shown = 0;
  private typing = false;
  private acc = 0;
  private resolveLine: (() => void) | null = null;
  private resolveChoice: ((i: number) => void) | null = null;
  private selected = 0;
  private blip: (() => void) | null = null;
  private narrator = false;
  open = false;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    private reduced: boolean,
    private onSelectSound: () => void,
  ) {
    this.panel = scene.add.graphics();
    this.portraitBg = scene.add.graphics();
    this.portrait = scene.add.image(340, 870, "face-deco-normal").setScale(0.92);
    const mask = scene.make.graphics({}, false);
    mask.fillStyle(0xffffff, 1);
    mask.fillCircle(340, 862, 92);
    mask.setScrollFactor(0);
    this.portrait.setMask(mask.createGeometryMask());
    this.nameBg = scene.add.graphics();
    this.nameText = scene.add.text(0, 0, "", { fontFamily: fonts.display, fontSize: "34px", color: "#1d1830", padding: { x: 4, y: 4 } }).setOrigin(0, 0.5);
    this.nameTag = scene.add.container(0, 0, [this.nameBg, this.nameText]);
    this.text = scene.add.text(0, 0, "", {
      fontFamily: fonts.body,
      fontSize: "40px",
      fontStyle: "bold",
      color: "#1d1830",
      lineSpacing: 6,
      wordWrap: { width: 1160 },
      padding: { x: 2, y: 6 },
    });
    this.more = scene.add.text(PANEL.x + PANEL.w - 54, PANEL.y + PANEL.h - 50, "▼", { fontFamily: "Arial", fontSize: "32px", color: "#c94785" }).setOrigin(0.5);
    this.root = scene.add.container(0, 0, [this.panel, this.portraitBg, this.portrait, this.nameTag, this.text, this.more]).setDepth(DEPTH).setScrollFactor(0, 0, true).setVisible(false);
  }

  private layout(narrator: boolean, color: number) {
    this.narrator = narrator;
    const g = this.panel;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(PANEL.x + 8, PANEL.y + 10, PANEL.w, PANEL.h, 30);
    g.fillStyle(narrator ? 0x2b2150 : 0xfbf5e6, 1);
    g.fillRoundedRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 30);
    g.lineStyle(6, INK_HEX, 1);
    g.strokeRoundedRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 30);
    if (!narrator) {
      g.fillStyle(0xecd9b2, 0.6);
      for (let i = 0; i < 4; i += 1) g.fillRect(PANEL.x + 230, PANEL.y + 82 + i * 50, PANEL.w - 280, 3);
    }
    this.portraitBg.clear();
    this.portrait.setVisible(!narrator);
    this.nameTag.setVisible(!narrator);
    if (!narrator) {
      const p = this.portraitBg;
      p.fillStyle(INK_HEX, 1);
      p.fillCircle(346, 870, 104);
      p.fillStyle(color, 1);
      p.fillCircle(340, 862, 100);
      p.lineStyle(7, INK_HEX, 1);
      p.strokeCircle(340, 862, 100);
    }
    this.text
      .setPosition(narrator ? PANEL.x + 64 : PANEL.x + 230, PANEL.y + 34)
      .setColor(narrator ? "#fbf5e6" : "#1d1830")
      .setFontFamily(narrator ? this.fonts.hand : this.fonts.body)
      .setFontSize(narrator ? 44 : 40)
      .setWordWrapWidth(narrator ? PANEL.w - 140 : PANEL.w - 300);
    this.more.setColor(narrator ? "#ffc83d" : "#c94785");
  }

  show(line: DialogLine): Promise<void> {
    this.open = true;
    this.clearChoices();
    const narrator = !line.face;
    this.layout(narrator, line.color);
    if (!narrator) {
      this.portrait.setTexture(line.face!);
      const tex = this.scene.textures.get(line.face!).getSourceImage() as HTMLImageElement;
      this.portrait.setScale(190 / Math.max(tex.width, 1)).setPosition(340, 862 + (tex.height > tex.width ? 14 : 0));
      this.nameText.setText(line.name.toUpperCase());
      const w = this.nameText.width + 44;
      this.nameBg.clear();
      this.nameBg.fillStyle(INK_HEX, 1);
      this.nameBg.fillRoundedRect(4, -26, w, 56, 16);
      this.nameBg.fillStyle(line.color, 1);
      this.nameBg.fillRoundedRect(0, -30, w, 56, 16);
      this.nameBg.lineStyle(5, INK_HEX, 1);
      this.nameBg.strokeRoundedRect(0, -30, w, 56, 16);
      this.nameText.setPosition(22, -2);
      this.nameTag.setPosition(PANEL.x + 220, PANEL.y - 4);
    }
    this.full = line.text;
    this.shown = 0;
    this.acc = 0;
    this.typing = !this.reduced;
    this.blip = line.blip;
    this.text.setText(this.reduced ? line.text : "");
    if (this.reduced) this.shown = line.text.length;
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
    const baseY = PANEL.y - 54;
    options.forEach((opt, i) => {
      const label = this.scene.add.text(0, 0, opt, { fontFamily: this.fonts.body, fontSize: "36px", fontStyle: "bold", color: "#fbf5e6", padding: { x: 2, y: 4 } }).setOrigin(0, 0.5);
      const w = Math.max(420, label.width + 90);
      const bg = this.scene.add.graphics();
      const y = baseY - (options.length - 1 - i) * 86;
      const root = this.scene.add.container(PANEL.x + PANEL.w - w, y, [bg, label]);
      label.setPosition(48, 0);
      root.setScrollFactor(0, 0, true);
      this.root.add(root);
      this.choices.push({ root, bg, label, w });
    });
    this.paintChoices();
    return new Promise((resolve) => {
      this.resolveChoice = resolve;
    });
  }

  pointer(px: number, py: number, down: boolean) {
    if (!this.resolveChoice) {
      if (down && this.open && py > PANEL.y - 20) this.advance();
      return down && this.open;
    }
    const hit = this.choices.findIndex((c) => px >= c.root.x && px <= c.root.x + c.w && py >= c.root.y - 40 && py <= c.root.y + 34);
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
      c.bg.fillRoundedRect(6, -32, c.w, 70, 18);
      c.bg.fillStyle(on ? 0xffc83d : 0x2b2150, 1);
      c.bg.fillRoundedRect(0, -38, c.w, 70, 18);
      c.bg.lineStyle(5, on ? INK_HEX : 0x7b62c4, 1);
      c.bg.strokeRoundedRect(0, -38, c.w, 70, 18);
      c.label.setColor(on ? "#1d1830" : "#fbf5e6");
      c.label.setText((on ? "▸ " : "") + c.label.text.replace(/^▸ /, ""));
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
    if (this.more.visible && !this.reduced) this.more.setY(PANEL.y + PANEL.h - 50 + Math.sin(time / 180) * 5);
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
}
