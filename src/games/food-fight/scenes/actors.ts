import * as Phaser from "phaser";
import { RIVALS, type RivalDef, type RivalKind, type SlotDef } from "../config";
import { cartoonText, type Fonts } from "../../kit/ui";

export type RivalState = "hidden" | "rising" | "up" | "windup" | "after" | "stunned" | "lowering";

const SPRITE_H = 250;
const TRAY_UP_Y = -86;
const TRAY_DOWN_Y = 60;

export type HitOutcome = { result: "hurt" | "down"; interrupted: boolean };

export class Rival {
  readonly container: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Image;
  private splat: Phaser.GameObjects.Image;
  private tray: Phaser.GameObjects.Image;
  private headSplat: Phaser.GameObjects.Image;
  private pudding: Phaser.GameObjects.Image;
  private puddingFalling = false;
  private splatTimer?: Phaser.Time.TimerEvent;
  private poseTimer?: Phaser.Time.TimerEvent;
  private fidget?: Phaser.Tweens.Tween;
  private alert: Phaser.GameObjects.Text;
  private dizzy: Phaser.GameObjects.Text;
  state: RivalState = "hidden";
  def: RivalDef = RIVALS.cap;
  hp = 1;
  until = 0;
  readyAt = 0;
  windupStart = 0;
  windupMs = 0;
  feint = false;
  hold = false;
  big = false;
  trayKid = false;
  shielded = false;
  brawl = false;

  constructor(
    private scene: Phaser.Scene,
    readonly slot: SlotDef,
    mask: Phaser.Display.Masks.GeometryMask,
    private fonts: Fonts,
    private reduced: boolean,
  ) {
    const depth = slot.row === "back" ? 3 : 6;
    this.body = scene.add.image(0, 0, "rival-cap-up").setOrigin(0.5, 1);
    this.splat = scene.add.image(0, -150, "splat-food").setScale(0.9).setVisible(false);
    this.tray = scene.add.image(0, TRAY_UP_Y, "tray").setAngle(-5).setVisible(false);
    this.headSplat = scene.add.image(0, -204, "splat-pudding").setScale(0.62).setVisible(false);
    this.container = scene.add
      .container(slot.x, this.hiddenY, [this.body, this.splat, this.headSplat, this.tray])
      .setDepth(depth)
      .setScale(slot.scale)
      .setVisible(false);
    this.container.setMask(mask);
    this.pudding = scene.add.image(0, 0, "pudding").setDepth(depth + 0.5).setVisible(false);
    this.alert = cartoonText(scene, 0, 0, "!", { size: 64, color: "#ffc83d", font: fonts.display, stroke: 0.22 })
      .setOrigin(0.5)
      .setDepth(16)
      .setVisible(false);
    this.dizzy = cartoonText(scene, 0, 0, "★ ★", { size: 30, color: "#ffc83d", font: fonts.display, stroke: 0.18, shadow: false })
      .setOrigin(0.5)
      .setDepth(15)
      .setVisible(false);
  }

  get scale() {
    return this.slot.scale * this.def.size;
  }

  get hiddenY() {
    return this.slot.upY + SPRITE_H * this.slot.scale * this.def.size + 10;
  }

  get visible() {
    return this.state !== "hidden";
  }

  get targetable() {
    return this.state === "rising" || this.state === "up" || this.state === "windup" || this.state === "after";
  }

  urgency(now: number) {
    if (this.shielded) return 0.5;
    if (this.state === "windup") return 3 + 1 / Math.max(1, this.windupStart + this.windupMs - now);
    if (this.state === "up" || this.state === "rising") return 2;
    if (this.state === "after") return 1;
    return 0;
  }

  face() {
    const s = this.scale;
    return { x: this.slot.x, y: this.container.y - 140 * s };
  }

  top() {
    return this.container.y - 228 * this.scale;
  }

  rise(kind: RivalKind, now: number, idle: number, opts: { feint?: boolean; hold?: boolean; tray?: boolean; brawl?: boolean } = {}) {
    this.def = RIVALS[kind];
    this.hp = this.def.hp;
    this.feint = Boolean(opts.feint);
    this.hold = Boolean(opts.hold);
    this.big = kind === "big";
    this.trayKid = Boolean(opts.tray);
    this.shielded = this.trayKid;
    this.brawl = Boolean(opts.brawl);
    this.splatTimer?.remove();
    this.poseTimer?.remove();
    this.stopFidget();
    this.body.setTexture(`rival-${kind}-up`).clearTint().setFlipX(false);
    this.splat.setVisible(false);
    this.headSplat.setVisible(false);
    this.scene.tweens.killTweensOf(this.tray);
    this.tray.setVisible(this.trayKid).setPosition(0, TRAY_UP_Y).setAngle(-5);
    this.container.setScale(this.scale).setY(this.hiddenY).setVisible(true).setAngle(0);
    this.state = "rising";
    this.scene.tweens.killTweensOf(this.container);
    const duration = kind === "speedy" ? 150 : 230;
    this.scene.tweens.add({
      targets: this.container,
      y: this.slot.upY,
      duration,
      ease: "Back.easeOut",
      onComplete: () => {
        if (this.state !== "rising") return;
        this.state = "up";
        this.until = now + duration + idle;
        if (this.brawl && !this.reduced) {
          this.fidget = this.scene.tweens.add({ targets: this.body, angle: { from: -5, to: 5 }, duration: 170, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        }
      },
    });
  }

  startWindup(now: number, ms: number) {
    this.state = "windup";
    this.windupStart = now;
    this.windupMs = ms;
    this.until = now + ms;
    this.body.setTexture(`rival-${this.def.kind}-windup`);
    if (this.shielded) {
      this.shielded = false;
      if (this.reduced) this.tray.setY(TRAY_DOWN_Y);
      else this.scene.tweens.add({ targets: this.tray, y: TRAY_DOWN_Y, angle: 4, duration: 170, ease: "Quad.easeIn" });
    }
    this.puddingFalling = false;
    this.pudding.setTexture("pudding").setScale(this.scale * (this.big ? 1.25 : 0.95)).setAngle(0).setVisible(true);
    this.alert.setVisible(true).setScale(this.slot.row === "back" ? 0.85 : 1);
    this.syncAttachments(now);
  }

  release(now: number) {
    const from = { x: this.pudding.x, y: this.pudding.y };
    this.pudding.setVisible(false);
    this.alert.setVisible(false);
    this.state = "after";
    this.until = now + 420;
    return from;
  }

  block() {
    if (this.reduced) return;
    this.scene.tweens.killTweensOf(this.tray);
    this.tray.setY(TRAY_UP_Y).setAngle(-5);
    this.scene.tweens.add({ targets: this.tray, angle: { from: -16, to: -5 }, y: { from: TRAY_UP_Y + 10, to: TRAY_UP_Y }, duration: 240, ease: "Back.easeOut" });
  }

  private stopFidget() {
    this.fidget?.stop();
    this.fidget = undefined;
    this.body.setAngle(0);
  }

  hit(now: number): HitOutcome {
    const wasWindup = this.state === "windup";
    this.stopFidget();
    this.hp -= 1;
    if (this.hp > 0) {
      this.body.setTintFill(0xffffff);
      this.scene.time.delayedCall(90, () => this.body.clearTint());
      if (!this.reduced) {
        this.scene.tweens.add({ targets: this.container, angle: { from: -8, to: 0 }, duration: 260, ease: "Back.easeOut" });
      }
      if (this.state === "windup") this.until = Math.max(this.until, now + 500);
      return { result: "hurt", interrupted: false };
    }
    this.state = "stunned";
    this.until = now + (wasWindup ? 950 : 650);
    this.alert.setVisible(false);
    this.splatTimer?.remove();
    this.poseTimer?.remove();
    this.body.setTexture(`rival-${this.def.kind}-up`).setFlipX(false);
    this.splat.setVisible(true).setAngle(Phaser.Math.Between(-20, 20));
    this.dizzy.setVisible(true);
    if (!this.reduced) {
      this.scene.tweens.add({ targets: this.container, angle: { from: 10, to: -6 }, duration: 160, yoyo: true, repeat: 1 });
    }
    const interrupted = wasWindup && this.pudding.visible;
    if (!interrupted) {
      this.pudding.setVisible(false);
      return { result: "down", interrupted: false };
    }
    const landed = () => {
      this.puddingFalling = false;
      this.pudding.setVisible(false).setAngle(0);
      if (this.state === "stunned") this.headSplat.setVisible(true);
    };
    if (this.reduced) landed();
    else {
      this.puddingFalling = true;
      this.scene.tweens.add({ targets: this.pudding, x: this.slot.x, y: this.top() + 12 * this.scale, angle: 180, duration: 260, ease: "Quad.easeIn", onComplete: landed });
    }
    return { result: "down", interrupted: true };
  }

  hand(dir = 1) {
    const s = this.scale;
    return { x: this.slot.x + 80 * s * dir, y: this.container.y - 176 * s };
  }

  throwPose(dir: number) {
    if (this.state !== "up") return;
    this.poseTimer?.remove();
    this.body.setTexture(`rival-${this.def.kind}-windup`).setFlipX(dir < 0);
    this.poseTimer = this.scene.time.delayedCall(300, () => {
      if (this.state === "up") this.body.setTexture(`rival-${this.def.kind}-up`).setFlipX(false);
    });
  }

  getSplatted() {
    if (this.state !== "up") return;
    this.splat.setVisible(true).setAngle(Phaser.Math.Between(-20, 20));
    this.splatTimer?.remove();
    this.splatTimer = this.scene.time.delayedCall(700, () => {
      if (this.state === "up") this.splat.setVisible(false);
    });
    if (!this.reduced) this.scene.tweens.add({ targets: this.container, angle: { from: -9, to: 0 }, duration: 260, ease: "Back.easeOut" });
  }

  celebrate() {
    if (this.state === "hidden" || this.state === "lowering" || this.state === "stunned") return false;
    if (!this.reduced) this.scene.tweens.add({ targets: this.container, y: this.container.y - 26 * this.scale, duration: 140, yoyo: true, repeat: 1, ease: "Quad.easeOut" });
    return true;
  }

  sulk() {
    if (this.state === "hidden" || this.state === "lowering" || this.state === "stunned") return false;
    if (!this.reduced) this.scene.tweens.add({ targets: this.container, angle: { from: -6, to: 6 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => this.container.setAngle(0) });
    return true;
  }

  lower(onHidden: () => void) {
    this.state = "lowering";
    this.stopFidget();
    this.alert.setVisible(false);
    this.pudding.setVisible(false);
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      y: this.hiddenY,
      angle: 0,
      duration: 200,
      ease: "Quad.easeIn",
      onComplete: () => {
        this.state = "hidden";
        this.container.setVisible(false);
        this.dizzy.setVisible(false);
        this.splat.setVisible(false);
        this.headSplat.setVisible(false);
        this.tray.setVisible(false);
        this.shielded = false;
        this.brawl = false;
        onHidden();
      },
    });
  }

  taunt(text: string) {
    const t = cartoonText(this.scene, this.slot.x, this.top() - 30, text, {
      size: this.slot.row === "back" ? 30 : 36,
      color: "#fbf5e6",
      font: this.fonts.display,
      stroke: 0.2,
    })
      .setOrigin(0.5)
      .setDepth(15);
    this.scene.tweens.add({ targets: t, y: t.y - 30, alpha: 0, delay: 500, duration: 400, onComplete: () => t.destroy() });
  }

  syncAttachments(now: number) {
    if (this.pudding.visible && !this.puddingFalling) {
      const h = this.hand();
      const wobble = this.reduced ? 0 : Math.sin(now / 60) * 4;
      this.pudding.setPosition(h.x, h.y - 18 * this.scale).setAngle(wobble);
    }
    if (this.alert.visible) {
      const k = this.windupMs ? Phaser.Math.Clamp((now - this.windupStart) / this.windupMs, 0, 1) : 0;
      const pulse = this.reduced ? 1 : 1 + Math.sin(now / (110 - k * 60)) * 0.12;
      this.alert.setPosition(this.slot.x - 50 * this.scale, this.top() - 26).setScale((this.slot.row === "back" ? 0.85 : 1) * pulse);
      this.alert.setColor(k > 0.66 ? "#ef4f43" : "#ffc83d");
    }
    if (this.dizzy.visible) {
      this.dizzy.setPosition(this.slot.x + (this.reduced ? 0 : Math.sin(now / 90) * 14), this.top() - 8);
    }
  }

  forceHide() {
    this.stopFidget();
    this.scene.tweens.killTweensOf(this.container);
    this.state = "hidden";
    this.container.setVisible(false).setY(this.hiddenY);
    this.pudding.setVisible(false);
    this.alert.setVisible(false);
    this.dizzy.setVisible(false);
    this.splat.setVisible(false);
    this.headSplat.setVisible(false);
    this.tray.setVisible(false);
    this.shielded = false;
    this.brawl = false;
    this.puddingFalling = false;
  }
}

export class LunchLady {
  readonly img: Phaser.GameObjects.Image;
  private marker: Phaser.GameObjects.Image;
  active = false;
  angry = false;
  private speed = 0.24;
  private bob = 0;

  constructor(
    private scene: Phaser.Scene,
    private reduced: boolean,
  ) {
    this.img = scene.add.image(-300, 706, "lunch-lady").setOrigin(0.5, 1).setScale(0.64).setDepth(2).setVisible(false);
    this.marker = scene.add.image(-300, 420, "icon-ban").setDepth(15).setAlpha(0.92).setVisible(false);
  }

  start() {
    this.active = true;
    this.angry = false;
    this.img.setTexture("lunch-lady").setPosition(2060, 706).setVisible(true).setFlipX(false);
    this.marker.setVisible(true);
  }

  center() {
    return { x: this.img.x, y: this.img.y - 150 };
  }

  update(delta: number) {
    if (!this.active) return;
    this.img.x -= this.speed * delta * (this.angry ? 1.6 : 1);
    this.bob += delta;
    if (!this.reduced) this.img.setAngle(Math.sin(this.bob / 140) * 2.5).setY(706 - Math.abs(Math.sin(this.bob / 140)) * 6);
    this.marker.setPosition(this.img.x, this.img.y - 278);
    if (this.img.x < -160) {
      this.active = false;
      this.img.setVisible(false);
      this.marker.setVisible(false);
    }
  }

  scold() {
    this.angry = true;
    this.img.setTexture("lunch-lady-angry");
    if (!this.reduced) {
      this.scene.tweens.add({ targets: this.img, scaleX: 0.7, scaleY: 0.58, duration: 90, yoyo: true });
    }
  }

  hide() {
    this.active = false;
    this.img.setVisible(false);
    this.marker.setVisible(false);
  }
}
