import * as Phaser from "phaser";
import { H, HP, KID_INFO, W, type KidId } from "../config";
import { INK, INK_HEX, cartoonText, type Fonts } from "../../kit/ui";

type Portrait = { kid: KidId; root: Phaser.GameObjects.Container; face: Phaser.GameObjects.Image; hearts: { off: Phaser.GameObjects.Image; on: Phaser.GameObjects.Image }[]; out: Phaser.GameObjects.Container; hp: number };

export type Touch = { x: number; y: number; throwing: boolean; active: boolean; tapAt: number };

export class PajamaHud {
  readonly touch: Touch = { x: 0, y: 0, throwing: false, active: false, tapAt: -99999 };
  private timer: Phaser.GameObjects.Text;
  private portraits = new Map<KidId, Portrait>();
  private banner: Phaser.GameObjects.Text;
  private sub: Phaser.GameObjects.Text;
  private stickBase: Phaser.GameObjects.Arc;
  private stickKnob: Phaser.GameObjects.Arc;
  private throwBtn: Phaser.GameObjects.Container;
  private stickId: number | null = null;
  private throwIds = new Set<number>();
  private stickOrigin = { x: 0, y: 0 };
  private touchUi = false;
  private bannerTimer?: Phaser.Time.TimerEvent;
  private tag: Phaser.GameObjects.Container;
  private timerBox: Phaser.GameObjects.Container;
  private order: Portrait[] = [];
  private k = 1;
  readonly top: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    arenaTitle: string,
    kids: { kid: KidId; isPlayer: boolean }[],
    private reduced: boolean,
  ) {
    const tag = scene.add.container(150, 58).setAngle(-3);
    const tg = scene.add.graphics();
    const label = cartoonText(scene, 0, 0, arenaTitle.toUpperCase(), { size: 34, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const tw = label.width + 44;
    tg.fillStyle(INK_HEX, 1);
    tg.fillRoundedRect(-tw / 2 + 5, -30, tw, 62, 8);
    tg.fillStyle(0xfbf5e6, 1);
    tg.fillRoundedRect(-tw / 2, -34, tw, 62, 8);
    tg.lineStyle(5, INK_HEX, 1);
    tg.strokeRoundedRect(-tw / 2, -34, tw, 62, 8);
    label.setY(-3);
    tag.add([tg, label]);
    tag.setX(28 + tw / 2);

    const tb = scene.add.graphics();
    tb.fillStyle(INK_HEX, 1);
    tb.fillRoundedRect(-118 + 5, 8, 236, 76, 18);
    tb.fillStyle(0x2b2150, 0.96);
    tb.fillRoundedRect(-118, 4, 236, 76, 18);
    tb.lineStyle(5, INK_HEX, 1);
    tb.strokeRoundedRect(-118, 4, 236, 76, 18);
    const icon = scene.add.image(-74, 42, "icon-timer");
    this.timer = cartoonText(scene, 18, 42, "00:00", { size: 48, color: "#fbf5e6", font: fonts.display, stroke: 0.14 }).setOrigin(0.5);
    const timerBox = scene.add.container(W / 2, 10, [tb, icon, this.timer]);
    this.tag = tag;
    this.timerBox = timerBox;

    const items: Phaser.GameObjects.GameObject[] = [tag, timerBox];
    let x = W - 30 - 208;
    for (const { kid, isPlayer } of [...kids].reverse()) {
      const p = this.makePortrait(kid, isPlayer);
      p.root.setPosition(x, 58);
      x -= 262;
      items.push(p.root);
      this.portraits.set(kid, p);
      this.order.push(p);
    }
    this.top = scene.add.container(0, 0, items).setDepth(2000);

    this.banner = cartoonText(scene, W / 2, H / 2 - 70, "", { size: 120, color: "#ffc83d", font: fonts.display, stroke: 0.2, align: "center" }).setOrigin(0.5).setDepth(2010).setVisible(false);
    this.sub = cartoonText(scene, W / 2, H / 2 + 40, "", { size: 44, color: "#fbf5e6", font: fonts.display, stroke: 0.2, align: "center" }).setOrigin(0.5).setDepth(2010).setVisible(false);

    this.stickBase = scene.add.circle(0, 0, 104, 0xfbf5e6, 0.18).setStrokeStyle(6, INK_HEX, 0.6).setDepth(2005).setVisible(false);
    this.stickKnob = scene.add.circle(0, 0, 54, 0xfbf5e6, 0.85).setStrokeStyle(6, INK_HEX, 1).setDepth(2006).setVisible(false);
    const bg = scene.add.graphics();
    bg.fillStyle(INK_HEX, 1);
    bg.fillCircle(6, 8, 112);
    bg.fillStyle(0xf06ba8, 1);
    bg.fillCircle(0, 0, 112);
    bg.lineStyle(7, INK_HEX, 1);
    bg.strokeCircle(0, 0, 112);
    const pil = scene.add.image(0, -6, "pillow").setScale(1.05 / 1.25).setAngle(-12);
    const lbl = cartoonText(scene, 0, 64, "JOGAR", { size: 30, color: "#fbf5e6", font: fonts.display, stroke: 0.2 }).setOrigin(0.5);
    this.throwBtn = scene.add.container(W - 210, H - 200, [bg, pil, lbl]).setDepth(2005).setVisible(false);
  }

  private makePortrait(kid: KidId, isPlayer: boolean): Portrait {
    const s = this.scene;
    const info = KID_INFO[kid];
    const g = s.add.graphics();
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(4, 6, 46);
    g.fillStyle(info.pale, 1);
    g.fillCircle(0, 0, 46);
    const face = s.add.image(0, 6, `face-${kid}-normal`).setScale(0.44);
    const ring = s.add.graphics();
    ring.lineStyle(isPlayer ? 9 : 6, isPlayer ? 0xffc83d : info.color, 1);
    ring.strokeCircle(0, 0, 46);
    ring.lineStyle(4, INK_HEX, 1);
    ring.strokeCircle(0, 0, isPlayer ? 51 : 49);
    const plate = s.add.graphics();
    plate.fillStyle(INK_HEX, 0.88);
    plate.fillRoundedRect(36, -22, 172, 46, 14);
    const hearts: Portrait["hearts"] = [];
    for (let i = 0; i < HP / 2; i += 1) {
      const hx = 66 + i * 32;
      const off = s.add.image(hx, 1, "icon-heart-off").setScale(0.78);
      const on = s.add.image(hx, 1, "icon-heart-on").setScale(0.78);
      hearts.push({ off, on });
    }
    const parts: Phaser.GameObjects.GameObject[] = [plate, ...hearts.flatMap((h) => [h.off, h.on]), g, face, ring];
    if (isPlayer) {
      const tg = s.add.graphics();
      tg.fillStyle(INK_HEX, 1);
      tg.fillRoundedRect(-44 + 3, 38 + 4, 88, 32, 9);
      tg.fillStyle(0xffc83d, 1);
      tg.fillRoundedRect(-44, 38, 88, 32, 9);
      tg.lineStyle(4, INK_HEX, 1);
      tg.strokeRoundedRect(-44, 38, 88, 32, 9);
      const you = cartoonText(s, 0, 54, "VOCÊ", { size: 24, color: INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
      parts.push(tg, you);
    }
    const outBg = s.add.graphics();
    outBg.fillStyle(0x140f26, 0.55);
    outBg.fillCircle(0, 0, 47);
    const outTxt = cartoonText(s, 0, 0, "FORA", { size: 30, color: "#ef4f43", font: this.fonts.display, stroke: 0.2 }).setOrigin(0.5).setAngle(-14);
    const out = s.add.container(0, 0, [outBg, outTxt]).setVisible(false);
    parts.push(out);
    const root = s.add.container(0, 0, parts);
    return { kid, root, face, hearts, out, hp: HP };
  }

  setHp(kid: KidId, hp: number, change: "hit" | "regen" | null = null) {
    const p = this.portraits.get(kid);
    if (!p) return;
    p.hp = hp;
    p.hearts.forEach((h, i) => {
      const full = hp >= (i + 1) * 2;
      const half = hp === i * 2 + 1;
      h.on.setVisible(full || half);
      if (half) h.on.setCrop(0, 0, h.on.width / 2, h.on.height);
      else h.on.setCrop();
    });
    if (change === "hit") {
      p.face.setTexture(`face-${kid}-ouch`);
      this.scene.time.delayedCall(420, () => p.face.active && p.hp > 0 && p.face.setTexture(`face-${kid}-normal`));
      if (!this.reduced) this.scene.tweens.add({ targets: p.root, x: p.root.x + 8, duration: 50, yoyo: true, repeat: 2 });
    }
    if (change === "regen" && !this.reduced) {
      const h = p.hearts[Math.floor((hp - 1) / 2)];
      if (h) this.scene.tweens.add({ targets: h.on, scale: { from: 1.15, to: 0.78 }, duration: 260, ease: "Back.easeOut" });
    }
    if (hp <= 0) {
      p.face.setTexture(`face-${kid}-dizzy`);
      p.out.setVisible(true);
      p.root.setAlpha(0.85);
      if (!this.reduced) {
        p.out.setScale(1.6);
        this.scene.tweens.add({ targets: p.out, scale: 1, duration: 260, ease: "Back.easeOut" });
      }
    }
  }

  setCheer(kid: KidId) {
    this.portraits.get(kid)?.face.setTexture(`face-${kid}-happy`);
  }

  setTime(ms: number) {
    const s = Math.floor(ms / 1000);
    this.timer.setText(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
  }

  flash(text: string, color: string, ms: number, sub = "", top = false) {
    this.bannerTimer?.remove();
    this.scene.tweens.killTweensOf([this.banner, this.sub]);
    this.banner.setText(text).setColor(color).setVisible(true).setAlpha(1).setScale(1).setY(top ? 175 : H / 2 - 70);
    this.sub.setText(sub).setVisible(Boolean(sub)).setAlpha(1).setY(top ? 275 : H / 2 + 40);
    if (!this.reduced) {
      this.banner.setScale(0.4);
      this.scene.tweens.add({ targets: this.banner, scale: 1, duration: 260, ease: "Back.easeOut" });
    }
    this.bannerTimer = this.scene.time.delayedCall(ms, () => {
      this.scene.tweens.add({ targets: [this.banner, this.sub], alpha: 0, duration: 220, onComplete: () => this.banner.setVisible(false) });
    });
  }

  layout(displayWidth: number) {
    const k = displayWidth < 1100 ? Phaser.Math.Clamp(1100 / displayWidth, 1, 1.45) : 1;
    if (k === this.k) return;
    this.k = k;
    this.tag.setVisible(k === 1);
    this.timerBox.setScale(k).setPosition(k === 1 ? W / 2 : 30 + 118 * k, 10);
    this.order.forEach((p, i) => p.root.setScale(k).setPosition(W - 30 - 208 * k - i * 262 * k, 58 * k));
    this.throwBtn.setScale(k).setPosition(W - 210 * k, H - 200 * k);
    this.stickBase.setScale(k);
    this.stickKnob.setScale(k);
  }

  hideTop() {
    this.scene.tweens.add({ targets: this.top, alpha: 0, duration: 300 });
  }

  enableTouch(on: boolean) {
    this.touchUi = on;
    this.throwBtn.setVisible(on);
    if (!on) return;
    const input = this.scene.input;
    input.on(Phaser.Input.Events.POINTER_DOWN, this.down, this);
    input.on(Phaser.Input.Events.POINTER_MOVE, this.move, this);
    input.on(Phaser.Input.Events.POINTER_UP, this.up, this);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.up, this);
  }

  get hasTouch() {
    return this.touchUi;
  }

  private down(p: Phaser.Input.Pointer) {
    if (!p.wasTouch && (p.event as PointerEvent | undefined)?.pointerType !== "touch") return;
    if (p.x > W * 0.5) {
      this.throwIds.add(p.id);
      this.touch.throwing = true;
      this.touch.tapAt = this.scene.time.now;
      if (!this.reduced) {
        this.scene.tweens.killTweensOf(this.throwBtn);
        this.throwBtn.setScale(0.9 * this.k);
        this.scene.tweens.add({ targets: this.throwBtn, scale: this.k, duration: 160, ease: "Back.easeOut" });
      }
      return;
    }
    if (this.stickId !== null) return;
    this.stickId = p.id;
    this.stickOrigin = { x: Phaser.Math.Clamp(p.x, 140, W * 0.5 - 140), y: Phaser.Math.Clamp(p.y, 260, H - 130) };
    this.stickBase.setPosition(this.stickOrigin.x, this.stickOrigin.y).setVisible(true);
    this.stickKnob.setPosition(this.stickOrigin.x, this.stickOrigin.y).setVisible(true);
    this.touch.active = true;
    this.move(p);
  }

  private move(p: Phaser.Input.Pointer) {
    if (p.id !== this.stickId) return;
    let dx = p.x - this.stickOrigin.x;
    let dy = p.y - this.stickOrigin.y;
    const d = Math.hypot(dx, dy);
    const max = 100 * this.k;
    if (d > max) {
      dx = (dx / d) * max;
      dy = (dy / d) * max;
    }
    this.stickKnob.setPosition(this.stickOrigin.x + dx, this.stickOrigin.y + dy);
    const dead = 14;
    const m = Math.hypot(dx, dy);
    this.touch.x = m < dead ? 0 : dx / max;
    this.touch.y = m < dead ? 0 : dy / max;
  }

  private up(p: Phaser.Input.Pointer) {
    if (this.throwIds.delete(p.id)) this.touch.throwing = this.throwIds.size > 0;
    if (p.id !== this.stickId) return;
    this.stickId = null;
    this.touch.x = 0;
    this.touch.y = 0;
    this.touch.active = false;
    this.stickBase.setVisible(false);
    this.stickKnob.setVisible(false);
  }

  hideControls() {
    this.throwBtn.setVisible(false);
    this.stickBase.setVisible(false);
    this.stickKnob.setVisible(false);
    this.touch.x = 0;
    this.touch.y = 0;
    this.touch.throwing = false;
  }

  avoid(sx: number, sy: number) {
    if (!this.touchUi) return;
    const near = Math.hypot(sx - this.throwBtn.x, sy - this.throwBtn.y) < 200 * this.k;
    this.throwBtn.setAlpha(Phaser.Math.Linear(this.throwBtn.alpha, near ? 0.45 : 1, 0.15));
  }
}
