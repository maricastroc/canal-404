import * as Phaser from "phaser";
import { H, W } from "../config";
import { INK_HEX, cartoonText, type Fonts } from "../../kit/ui";

const DEPTH = 8000;

type Button = { root: Phaser.GameObjects.Container; x: number; y: number; r: number; action: string };

export class ResortHud {
  readonly touch = { x: 0, y: 0, active: false, action: false };
  private buttons: Button[] = [];
  private banner: Phaser.GameObjects.Container;
  private bannerText: Phaser.GameObjects.Text;
  private bannerBg: Phaser.GameObjects.Graphics;
  private toasts: Phaser.GameObjects.Container[] = [];
  private prompt: Phaser.GameObjects.Container;
  private promptBg: Phaser.GameObjects.Graphics;
  private promptKey: Phaser.GameObjects.Text;
  private promptText: Phaser.GameObjects.Text;
  private stickBase: Phaser.GameObjects.Arc;
  private stickKnob: Phaser.GameObjects.Arc;
  private action: Phaser.GameObjects.Container;
  private actionLabel: Phaser.GameObjects.Text;
  private stickId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private actionId: number | null = null;
  private touchUi = false;
  private vhs: Phaser.GameObjects.Container;
  private vhsText: Phaser.GameObjects.Text;
  readonly top: Phaser.GameObjects.Container;
  hidden = false;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    private reduced: boolean,
  ) {
    const mk = (x: number, y: number, icon: string, key: string, action: string) => {
      const g = scene.add.graphics();
      g.fillStyle(INK_HEX, 1);
      g.fillRoundedRect(-44 + 5, -44 + 6, 88, 88, 22);
      g.fillStyle(0xfbf5e6, 1);
      g.fillRoundedRect(-44, -44, 88, 88, 22);
      g.lineStyle(5, INK_HEX, 1);
      g.strokeRoundedRect(-44, -44, 88, 88, 22);
      const img = scene.add.image(0, -2, icon).setScale(0.9);
      const kg = scene.add.graphics();
      kg.fillStyle(0xffc83d, 1);
      kg.fillRoundedRect(20, 18, 34, 32, 8);
      kg.lineStyle(3.5, INK_HEX, 1);
      kg.strokeRoundedRect(20, 18, 34, 32, 8);
      const kt = scene.add.text(37, 34, key, { fontFamily: fonts.display, fontSize: "20px", color: "#1d1830" }).setOrigin(0.5);
      const root = scene.add.container(x, y, [g, img, kg, kt]);
      this.buttons.push({ root, x, y, r: 50, action });
      return root;
    };
    const journal = mk(W - 176, 74, "ui-journal", "J", "journal");
    const map = mk(W - 66, 74, "ui-map", "M", "map");
    this.top = scene.add.container(0, 0, [journal, map]).setDepth(DEPTH).setScrollFactor(0, 0, true);

    this.bannerBg = scene.add.graphics();
    this.bannerText = cartoonText(scene, 0, 0, "", { size: 52, color: "#1d1830", font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    this.banner = scene.add.container(W / 2, 96, [this.bannerBg, this.bannerText]).setDepth(DEPTH).setScrollFactor(0, 0, true).setVisible(false);

    this.promptBg = scene.add.graphics();
    this.promptKey = scene.add.text(0, 0, "E", { fontFamily: fonts.display, fontSize: "28px", color: "#1d1830" }).setOrigin(0.5);
    this.promptText = scene.add.text(0, 0, "", { fontFamily: fonts.display, fontSize: "28px", color: "#fbf5e6", padding: { x: 2, y: 4 } }).setOrigin(0, 0.5);
    this.prompt = scene.add.container(0, 0, [this.promptBg, this.promptKey, this.promptText]).setDepth(5950).setVisible(false);

    this.stickBase = scene.add.circle(0, 0, 110, 0xfbf5e6, 0.16).setStrokeStyle(6, INK_HEX, 0.5).setDepth(DEPTH).setScrollFactor(0).setVisible(false);
    this.stickKnob = scene.add.circle(0, 0, 56, 0xfbf5e6, 0.85).setStrokeStyle(6, INK_HEX, 1).setDepth(DEPTH + 1).setScrollFactor(0).setVisible(false);
    const ag = scene.add.graphics();
    ag.fillStyle(INK_HEX, 1);
    ag.fillCircle(6, 8, 104);
    ag.fillStyle(0xffc83d, 1);
    ag.fillCircle(0, 0, 104);
    ag.lineStyle(7, INK_HEX, 1);
    ag.strokeCircle(0, 0, 104);
    const hand = scene.add.image(0, -18, "ui-hand").setScale(1.1);
    this.actionLabel = scene.add.text(0, 48, "", { fontFamily: fonts.display, fontSize: "26px", color: "#1d1830" }).setOrigin(0.5);
    this.action = scene.add.container(W - 190, H - 190, [ag, hand, this.actionLabel]).setDepth(DEPTH).setScrollFactor(0, 0, true).setVisible(false);

    const scan = scene.add.tileSprite(0, 0, W, H, "scanlines").setOrigin(0, 0).setAlpha(0.35);
    const tint = scene.add.rectangle(0, 0, W, H, 0x5cb9f0, 0.08).setOrigin(0, 0);
    this.vhsText = scene.add.text(W - 70, 150, "▌▌ PAUSA", { fontFamily: "Courier New, monospace", fontSize: "64px", fontStyle: "bold", color: "#ffffff" }).setOrigin(1, 0);
    this.vhsText.setShadow(4, 4, "#1d1830", 0, true, true);
    this.vhs = scene.add.container(0, 0, [tint, scan, this.vhsText]).setDepth(DEPTH - 10).setScrollFactor(0, 0, true).setVisible(false);
  }

  enableTouch(on: boolean) {
    this.touchUi = on;
  }

  get isTouch() {
    return this.touchUi;
  }

  hide(on: boolean) {
    this.hidden = on;
    this.top.setVisible(!on);
    if (on) {
      this.prompt.setVisible(false);
      this.action.setVisible(false);
      this.releaseStick();
    }
  }

  buttonAt(px: number, py: number) {
    if (this.hidden) return null;
    for (const b of this.buttons) if (Math.hypot(px - b.x, py - b.y) < b.r + 8) return b.action;
    return null;
  }

  pressButton(action: string) {
    const b = this.buttons.find((x) => x.action === action);
    if (!b || this.reduced) return;
    this.scene.tweens.add({ targets: b.root, scale: { from: 0.86, to: 1 }, duration: 180, ease: "Back.easeOut" });
  }

  flashArea(title: string) {
    this.bannerText.setText(title.toUpperCase());
    const w = this.bannerText.width + 80;
    const g = this.bannerBg;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(-w / 2 + 6, -42 + 8, w, 84, 14);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(-w / 2, -42, w, 84, 14);
    g.lineStyle(6, INK_HEX, 1);
    g.strokeRoundedRect(-w / 2, -42, w, 84, 14);
    g.fillStyle(0xffc83d, 1);
    g.fillCircle(-w / 2 + 26, 0, 9);
    g.fillCircle(w / 2 - 26, 0, 9);
    this.scene.tweens.killTweensOf(this.banner);
    this.banner.setVisible(true).setAlpha(1).setAngle(-2);
    if (!this.reduced) {
      this.banner.setScale(0.6);
      this.scene.tweens.add({ targets: this.banner, scale: 1, duration: 260, ease: "Back.easeOut" });
    }
    this.scene.tweens.add({ targets: this.banner, alpha: 0, delay: 1900, duration: 400, onComplete: () => this.banner.setVisible(false) });
  }

  toast(title: string, text: string, icon: string, color = 0xffc83d) {
    const g = this.scene.add.graphics();
    const t1 = this.scene.add.text(110, 24, title.toUpperCase(), { fontFamily: this.fonts.display, fontSize: "24px", color: "#7b62c4" });
    const t2 = this.scene.add.text(110, 54, text, { fontFamily: this.fonts.body, fontSize: "30px", fontStyle: "bold", color: "#1d1830", wordWrap: { width: 520 }, padding: { x: 2, y: 2 } });
    const h = Math.max(110, t2.height + 76);
    const w = Math.max(t1.width, Math.min(520, t2.width)) + 150;
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(6, 7, w, h, 18);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(0, 0, w, h, 18);
    g.lineStyle(5, INK_HEX, 1);
    g.strokeRoundedRect(0, 0, w, h, 18);
    g.fillStyle(color, 1);
    g.fillCircle(56, h / 2, 38);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeCircle(56, h / 2, 38);
    const img = this.scene.add.image(56, h / 2, icon).setDisplaySize(56, 56);
    const y0 = 40 + this.toasts.reduce((a, t) => a + (t.getData("h") as number) + 14, 0);
    const root = this.scene.add.container(36, y0, [g, img, t1, t2]).setDepth(DEPTH + 5).setScrollFactor(0, 0, true);
    root.setData("h", h);
    this.toasts.push(root);
    if (!this.reduced) {
      root.x = -w;
      this.scene.tweens.add({ targets: root, x: 36, duration: 300, ease: "Back.easeOut" });
    }
    this.scene.time.delayedCall(3600, () => {
      this.scene.tweens.add({
        targets: root,
        alpha: 0,
        x: this.reduced ? 36 : -w,
        duration: 280,
        onComplete: () => {
          root.destroy();
          this.toasts = this.toasts.filter((t) => t !== root);
          let y = 40;
          for (const t of this.toasts) {
            this.scene.tweens.add({ targets: t, y, duration: 200 });
            y += (t.getData("h") as number) + 14;
          }
        },
      });
    });
  }

  showPrompt(x: number, y: number, verb: string | null) {
    if (!verb || this.hidden) {
      this.prompt.setVisible(false);
      if (this.touchUi) this.actionLabel.setText("");
      return;
    }
    if (this.promptText.text !== verb) {
      this.promptText.setText(verb);
      const w = this.promptText.width + (this.touchUi ? 34 : 84);
      const g = this.promptBg;
      g.clear();
      g.fillStyle(INK_HEX, 0.92);
      g.fillRoundedRect(-w / 2, -30, w, 60, 30);
      g.lineStyle(4, 0xfbf5e6, 0.9);
      g.strokeRoundedRect(-w / 2, -30, w, 60, 30);
      if (!this.touchUi) {
        g.fillStyle(0xffc83d, 1);
        g.fillRoundedRect(-w / 2 + 10, -22, 44, 44, 10);
        g.lineStyle(3, INK_HEX, 1);
        g.strokeRoundedRect(-w / 2 + 10, -22, 44, 44, 10);
      }
      this.promptKey.setPosition(-w / 2 + 32, 0).setVisible(!this.touchUi);
      this.promptText.setPosition(-w / 2 + (this.touchUi ? 17 : 66), 0);
    }
    this.prompt.setVisible(true).setPosition(x, y);
    if (this.touchUi) this.actionLabel.setText(verb.toUpperCase());
  }

  setTouchVisible(on: boolean) {
    this.action.setVisible(on && this.touchUi && !this.hidden);
  }

  vhsOn(on: boolean, label = "▌▌ PAUSA") {
    this.vhsText.setText(label);
    this.vhs.setVisible(on);
  }

  vhsFlash(label: string, ms: number) {
    this.vhsOn(true, label);
    this.scene.time.delayedCall(ms, () => this.vhsOn(false));
  }

  pointerDown(p: Phaser.Input.Pointer) {
    if (!this.touchUi || this.hidden) return false;
    if (Math.hypot(p.x - this.action.x, p.y - this.action.y) < 120 && this.action.visible) {
      this.actionId = p.id;
      this.touch.action = true;
      if (!this.reduced) this.scene.tweens.add({ targets: this.action, scale: { from: 0.9, to: 1 }, duration: 160 });
      return true;
    }
    if (p.x < W * 0.5 && this.stickId === null) {
      this.stickId = p.id;
      this.stickOrigin = { x: Phaser.Math.Clamp(p.x, 150, W * 0.5 - 150), y: Phaser.Math.Clamp(p.y, 300, H - 140) };
      this.stickBase.setPosition(this.stickOrigin.x, this.stickOrigin.y).setVisible(true);
      this.stickKnob.setPosition(this.stickOrigin.x, this.stickOrigin.y).setVisible(true);
      this.touch.active = true;
      this.pointerMove(p);
      return true;
    }
    return false;
  }

  pointerMove(p: Phaser.Input.Pointer) {
    if (p.id !== this.stickId) return;
    let dx = p.x - this.stickOrigin.x;
    let dy = p.y - this.stickOrigin.y;
    const d = Math.hypot(dx, dy);
    if (d > 100) {
      dx = (dx / d) * 100;
      dy = (dy / d) * 100;
    }
    this.stickKnob.setPosition(this.stickOrigin.x + dx, this.stickOrigin.y + dy);
    const m = Math.hypot(dx, dy);
    this.touch.x = m < 14 ? 0 : dx / 100;
    this.touch.y = m < 14 ? 0 : dy / 100;
  }

  pointerUp(p: Phaser.Input.Pointer) {
    if (p.id === this.actionId) {
      this.actionId = null;
      this.touch.action = false;
    }
    if (p.id === this.stickId) this.releaseStick();
  }

  releaseStick() {
    this.stickId = null;
    this.touch.x = 0;
    this.touch.y = 0;
    this.touch.active = false;
    this.stickBase.setVisible(false);
    this.stickKnob.setVisible(false);
  }
}
