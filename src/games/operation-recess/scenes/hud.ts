import * as Phaser from "phaser";
import { H, HEARTS, W } from "../config";
import { INK, INK_HEX, cartoonText, darkPanel, fitText, paper, type Fonts } from "../../kit/ui";

export type TouchState = { left: boolean; right: boolean; jump: boolean; attack: boolean };
type PadAction = keyof TouchState;
type Pad = { action: PadAction; bg: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; hit: Phaser.GameObjects.Arc; r: number; color: number; x: number; y: number; base: number };

const BAR_W = 520;

export class RecessHud {
  uiScale = 1;
  readonly touch: TouchState = { left: false, right: false, jump: false, attack: false };
  private card: Phaser.GameObjects.Container;
  private cardBounds = new Phaser.Geom.Rectangle(20, 10, 380, 124);
  private hearts: Phaser.GameObjects.Image[] = [];
  private scoreText: Phaser.GameObjects.Text;
  private progress: Phaser.GameObjects.Container;
  private progressBar: Phaser.GameObjects.Graphics;
  private progressBounds = new Phaser.Geom.Rectangle(W / 2 - 300, 10, 600, 90);
  private bossBox: Phaser.GameObjects.Container;
  private bossBar: Phaser.GameObjects.Graphics;
  private banner: Phaser.GameObjects.Text;
  private sub: Phaser.GameObjects.Text;
  private pads: Pad[] = [];
  private pointers = new Map<number, PadAction>();
  private touchOn = false;
  private jumpPulse?: Phaser.Tweens.Tween;

  constructor(
    private scene: Phaser.Scene,
    fonts: Fonts,
    title: string,
    index: number,
    total: number,
    private reduced: boolean,
    private onPress: (action: PadAction) => void,
  ) {
    const g = scene.add.graphics();
    paper(g, 0, 0, 380, 124, 20);
    const kicker = cartoonText(scene, 18, 10, `FASE ${index + 1} DE ${total}`, { size: 20, color: "#7b62c4", font: fonts.display, stroke: 0, shadow: false });
    const name = cartoonText(scene, 16, 32, title.toUpperCase(), { size: 28, color: INK, font: fonts.display, stroke: 0, shadow: false });
    fitText(name, 350, 28, 18);
    const items: Phaser.GameObjects.GameObject[] = [g, kicker, name];
    for (let i = 0; i < HEARTS; i += 1) {
      const img = scene.add.image(36 + i * 46, 92, "icon-heart-on");
      this.hearts.push(img);
      items.push(img);
    }
    this.scoreText = cartoonText(scene, 364, 92, "0", { size: 30, color: "#ffc83d", font: fonts.display, stroke: 0.2 }).setOrigin(1, 0.5);
    items.push(this.scoreText);
    this.card = scene.add.container(20, 10, items).setDepth(60).setScrollFactor(0, 0, true);

    const pg = scene.add.graphics();
    darkPanel(pg, -300, 0, 600, 70);
    this.progressBar = scene.add.graphics();
    const flag = scene.add.image(262, 35, "icon-flag");
    this.progress = scene.add.container(W / 2, 12, [pg, this.progressBar, flag]).setDepth(60).setScrollFactor(0, 0, true);

    const bg = scene.add.graphics();
    darkPanel(bg, -320, 0, 640, 96);
    const bossName = cartoonText(scene, 0, 12, "INSPETOR DO SILÊNCIO", { size: 26, color: "#f06ba8", font: fonts.display, stroke: 0.18 }).setOrigin(0.5, 0);
    this.bossBar = scene.add.graphics();
    this.bossBox = scene.add.container(W / 2, 12, [bg, bossName, this.bossBar]).setDepth(60).setScrollFactor(0, 0, true).setVisible(false);

    this.banner = cartoonText(scene, W / 2, 360, "", { size: 92, color: "#ffc83d", font: fonts.display, stroke: 0.2, align: "center" })
      .setOrigin(0.5)
      .setDepth(70)
      .setScrollFactor(0)
      .setVisible(false);
    this.sub = cartoonText(scene, W / 2, 450, "", { size: 38, color: "#fbf5e6", font: fonts.display, stroke: 0.2, align: "center" })
      .setOrigin(0.5)
      .setDepth(70)
      .setScrollFactor(0)
      .setVisible(false);

    this.makePad("left", "icon-left", 80, 0xfbf5e6);
    this.makePad("right", "icon-right", 80, 0xfbf5e6);
    this.makePad("jump", "icon-jump", 84, 0xffc83d);
    this.makePad("attack", "icon-attack", 96, 0xf06ba8);
    scene.input.on("pointerup", (p: Phaser.Input.Pointer) => this.release(p));
    scene.input.on("pointerupoutside", (p: Phaser.Input.Pointer) => this.release(p));
    this.showTouch(false);
  }

  private makePad(action: PadAction, icon: string, r: number, color: number) {
    const bg = this.scene.add.graphics().setDepth(62).setScrollFactor(0);
    const img = this.scene.add.image(0, 0, icon).setDepth(63).setScrollFactor(0);
    const hit = this.scene.add.circle(0, 0, r + 18, 0xffffff, 0).setDepth(64).setScrollFactor(0).setInteractive();
    const pad: Pad = { action, bg, icon: img, hit, r, color, x: 0, y: 0, base: 1 };
    hit.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.pointers.set(p.id, action);
      this.touch[action] = true;
      this.drawPad(pad, true);
      this.onPress(action);
    });
    this.pads.push(pad);
  }

  private release(p: Phaser.Input.Pointer) {
    const action = this.pointers.get(p.id);
    if (!action) return;
    this.pointers.delete(p.id);
    this.touch[action] = [...this.pointers.values()].includes(action);
    for (const pad of this.pads) this.drawPad(pad, this.touch[pad.action]);
  }

  private drawPad(pad: Pad, down: boolean) {
    const g = pad.bg;
    const s = pad.base;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(pad.x + 5 * s, pad.y + 7 * s, pad.r * s);
    g.fillStyle(pad.color, 1);
    g.fillCircle(pad.x, pad.y + (down ? 5 * s : 0), pad.r * s);
    g.lineStyle(6 * s, INK_HEX, 1);
    g.strokeCircle(pad.x, pad.y + (down ? 5 * s : 0), pad.r * s);
    pad.icon.setPosition(pad.x, pad.y + (down ? 5 * s : 0)).setScale(s);
    pad.hit.setPosition(pad.x, pad.y).setScale(s);
  }

  showTouch(on: boolean) {
    this.touchOn = on;
    for (const pad of this.pads) {
      pad.bg.setVisible(on);
      pad.icon.setVisible(on);
      pad.hit.setVisible(on);
      if (on) pad.hit.setInteractive();
      else pad.hit.disableInteractive();
    }
  }

  pulseJump(on: boolean) {
    this.jumpPulse?.stop();
    this.jumpPulse = undefined;
    const pad = this.pads.find((p) => p.action === "jump");
    if (!pad || !this.touchOn) return;
    pad.icon.setScale(pad.base);
    if (on && !this.reduced) this.jumpPulse = this.scene.tweens.add({ targets: pad.icon, scale: pad.base * 1.25, duration: 360, yoyo: true, repeat: -1 });
  }

  layout(displayScale: number) {
    this.uiScale = Phaser.Math.Clamp(displayScale * 0.55, 1, 1.75);
    const s = this.uiScale;
    const cs = Math.min(s, 1.3);
    this.card.setScale(cs);
    this.cardBounds.setTo(20, 10, 380 * cs, 124 * cs);
    this.progress.setScale(Math.min(s, 1.2));
    this.bossBox.setScale(Math.min(s, 1.2));
    this.progressBounds.setTo(W / 2 - 320 * Math.min(s, 1.2), 10, 640 * Math.min(s, 1.2), 100 * Math.min(s, 1.2));
    this.banner.setScale(Math.min(s, 1.2));
    this.sub.setScale(Math.min(s, 1.2)).setY(360 + 92 * Math.min(s, 1.2));
    const ps = Math.min(s, 1.35);
    const place: Record<PadAction, [number, number]> = {
      left: [40 + 95 * ps, H - 40 - 95 * ps],
      right: [40 + 285 * ps, H - 40 - 95 * ps],
      attack: [W - 40 - 110 * ps, H - 40 - 110 * ps],
      jump: [W - 40 - 330 * ps, H - 40 - 90 * ps],
    };
    for (const pad of this.pads) {
      pad.base = ps;
      [pad.x, pad.y] = place[pad.action];
      this.drawPad(pad, this.touch[pad.action]);
    }
  }

  avoid(sx: number, sy: number, others: [number, number][] = []) {
    const near = (r: Phaser.Geom.Rectangle) => sx > r.x - 60 && sx < r.right + 60 && sy > r.y - 60 && sy < r.bottom + 160;
    this.card.setAlpha(near(this.cardBounds) ? 0.35 : 1);
    const pa = near(this.progressBounds) ? 0.35 : 1;
    this.progress.setAlpha(pa);
    this.bossBox.setAlpha(pa);
    if (!this.touchOn) return;
    for (const pad of this.pads) {
      const reach = pad.r * pad.base + 120;
      const close = Phaser.Math.Distance.Between(sx, sy, pad.x, pad.y) < reach || others.some(([ox, oy]) => Phaser.Math.Distance.Between(ox, oy, pad.x, pad.y) < reach);
      const a = close ? 0.35 : 0.85;
      pad.bg.setAlpha(a);
      pad.icon.setAlpha(a);
    }
  }

  setHearts(n: number, changed: "lost" | "gained" | null = null) {
    this.hearts.forEach((img, i) => {
      img.setTexture(i < n ? "icon-heart-on" : "icon-heart-off");
      const target = changed === "lost" ? i === n : changed === "gained" ? i === n - 1 : false;
      if (target && !this.reduced) {
        img.setScale(1.6);
        this.scene.tweens.add({ targets: img, scale: 1, duration: 360, ease: "Back.easeOut" });
      }
    });
  }

  setScore(n: number) {
    this.scoreText.setText(n.toLocaleString("pt-BR"));
    if (!this.reduced) {
      this.scene.tweens.killTweensOf(this.scoreText);
      this.scoreText.setScale(1.25);
      this.scene.tweens.add({ targets: this.scoreText, scale: 1, duration: 220, ease: "Back.easeOut" });
    }
  }

  setProgress(k: number, checkpoints: number[]) {
    const g = this.progressBar;
    g.clear();
    const x0 = -250;
    g.fillStyle(0x140f26, 1);
    g.fillRoundedRect(x0, 27, 480, 16, 8);
    g.fillStyle(0x63d6c1, 1);
    g.fillRoundedRect(x0, 27, Math.max(16, 480 * Phaser.Math.Clamp(k, 0, 1)), 16, 8);
    for (const c of checkpoints) {
      g.fillStyle(0xffc83d, 1);
      g.fillCircle(x0 + 480 * c, 35, 7);
      g.lineStyle(3, INK_HEX, 1);
      g.strokeCircle(x0 + 480 * c, 35, 7);
    }
    g.fillStyle(0x5cb9f0, 1);
    g.fillCircle(x0 + 480 * Phaser.Math.Clamp(k, 0, 1), 35, 13);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeCircle(x0 + 480 * Phaser.Math.Clamp(k, 0, 1), 35, 13);
  }

  showBoss(on: boolean) {
    this.bossBox.setVisible(on);
    this.progress.setVisible(!on);
  }

  hideTop() {
    this.bossBox.setVisible(false);
    this.progress.setVisible(false);
  }

  setBoss(hp: number, max: number) {
    const g = this.bossBar;
    g.clear();
    g.fillStyle(0x140f26, 1);
    g.fillRoundedRect(-BAR_W / 2, 56, BAR_W, 22, 11);
    const k = Phaser.Math.Clamp(hp / max, 0, 1);
    if (k > 0) {
      g.fillStyle(k > 0.5 ? 0xf06ba8 : 0xef4f43, 1);
      g.fillRoundedRect(-BAR_W / 2, 56, Math.max(22, BAR_W * k), 22, 11);
    }
    g.lineStyle(3, 0x0d0a18, 1);
    g.strokeRoundedRect(-BAR_W / 2, 56, BAR_W, 22, 11);
  }

  flash(text: string, color = "#ffc83d", hold = 1000, sub = "") {
    const b = this.banner;
    this.scene.tweens.killTweensOf([b, this.sub]);
    const s = Math.min(this.uiScale, 1.2);
    b.setText(text).setColor(color).setVisible(true).setAlpha(1);
    this.sub.setText(sub).setVisible(Boolean(sub)).setAlpha(1).setScale(s);
    if (this.reduced) b.setScale(s);
    else {
      b.setScale(s * 0.3);
      this.scene.tweens.add({ targets: b, scale: s, duration: 240, ease: "Back.easeOut" });
    }
    if (hold > 0) this.scene.tweens.add({ targets: [b, this.sub], alpha: 0, delay: hold, duration: 260, onComplete: () => [b, this.sub].forEach((o) => o.setVisible(false)) });
  }

  hideControls() {
    this.showTouch(false);
    this.pulseJump(false);
    for (const k of Object.keys(this.touch) as PadAction[]) this.touch[k] = false;
    this.pointers.clear();
  }
}
