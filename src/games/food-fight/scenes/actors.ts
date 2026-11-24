import * as Phaser from "phaser";
import { COOK, LUNCH_LADY, RIVALS, type RivalDef, type RivalKind, type SlotDef } from "../config";
import { cartoonText, type Fonts } from "../../kit/ui";

export type RivalState = "hidden" | "rising" | "up" | "windup" | "after" | "dazed" | "stunned" | "lowering";
export type DazeKind = "slip" | "splash";

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
  private dizzy: Phaser.GameObjects.Container;
  state: RivalState = "hidden";
  def: RivalDef = RIVALS.cap;
  look = 1;
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
  x: number;

  constructor(
    private scene: Phaser.Scene,
    readonly slot: SlotDef,
    mask: Phaser.Display.Masks.GeometryMask,
    private fonts: Fonts,
    private reduced: boolean,
  ) {
    const depth = slot.row === "back" ? 3 : 6;
    this.x = slot.x;
    this.body = scene.add.image(0, 0, "rival-cap-1-up").setOrigin(0.5, 1);
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
    this.dizzy = scene.add
      .container(0, 0, [scene.add.image(-18, 3, "icon-dizzy-star"), scene.add.image(18, 3, "icon-dizzy-star")])
      .setDepth(15)
      .setVisible(false);
  }

  get scale() {
    return this.slot.scale * this.def.size;
  }

  placeAt(x: number, now: number) {
    this.x = x;
    this.container.setX(x);
    this.syncAttachments(now);
  }

  get hiddenY() {
    return this.slot.upY + SPRITE_H * this.slot.scale * this.def.size + 10;
  }

  get visible() {
    return this.state !== "hidden";
  }

  get targetable() {
    return this.state === "rising" || this.state === "up" || this.state === "windup" || this.state === "after" || this.state === "dazed";
  }

  urgency(now: number) {
    if (this.shielded) return 0.5;
    if (this.state === "windup") return 3 + 1 / Math.max(1, this.windupStart + this.windupMs - now);
    if (this.state === "up" || this.state === "rising") return 2;
    if (this.state === "dazed") return 1.5;
    if (this.state === "after") return 1;
    return 0;
  }

  face() {
    const s = this.scale;
    return { x: this.x, y: this.container.y - 140 * s };
  }

  top() {
    return this.container.y - 228 * this.scale;
  }

  private texture(pose: "up" | "windup") {
    return `rival-${this.def.kind}-${this.look}-${pose}`;
  }

  rise(kind: RivalKind, look: number, now: number, idle: number, opts: { feint?: boolean; hold?: boolean; tray?: boolean; brawl?: boolean } = {}) {
    this.def = RIVALS[kind];
    this.look = look;
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
    this.body.setTexture(this.texture("up")).clearTint().setFlipX(false);
    this.splat.setVisible(false);
    this.headSplat.setVisible(false);
    this.scene.tweens.killTweensOf(this.tray);
    this.tray.setVisible(this.trayKid).setPosition(0, TRAY_UP_Y).setAngle(-5).setAlpha(1);
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
        this.startFidget();
      },
    });
  }

  startWindup(now: number, ms: number) {
    this.state = "windup";
    this.windupStart = now;
    this.windupMs = ms;
    this.until = now + ms;
    this.body.setTexture(this.texture("windup"));
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

  private startFidget() {
    if (!this.brawl || this.reduced) return;
    this.fidget = this.scene.tweens.add({ targets: this.body, angle: { from: -5, to: 5 }, duration: 170, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private stopFidget() {
    this.fidget?.stop();
    this.fidget = undefined;
    this.body.setAngle(0);
  }

  hit(now: number, heavy = false): HitOutcome {
    const wasWindup = this.state === "windup";
    this.stopFidget();
    this.hp = heavy ? 0 : this.hp - 1;
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
    this.body.setTexture(this.texture("up")).setFlipX(false);
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
    this.dropPudding();
    return { result: "down", interrupted: true };
  }

  private dropPudding() {
    const landed = () => {
      this.puddingFalling = false;
      this.pudding.setVisible(false).setAngle(0);
      if (this.state === "stunned" || this.state === "dazed") this.headSplat.setVisible(true);
    };
    if (this.reduced) landed();
    else {
      this.puddingFalling = true;
      this.scene.tweens.add({ targets: this.pudding, x: this.x, y: this.top() + 12 * this.scale, angle: 180, duration: 260, ease: "Quad.easeIn", onComplete: landed });
    }
  }

  daze(now: number, ms: number, kind: DazeKind) {
    const wasWindup = this.state === "windup";
    this.stopFidget();
    this.poseTimer?.remove();
    this.state = "dazed";
    this.until = now + ms;
    this.alert.setVisible(false);
    this.body.setTexture(this.texture("up")).setFlipX(false);
    this.dizzy.setVisible(true);
    if (this.shielded) this.loseTray();
    if (wasWindup && this.pudding.visible) this.dropPudding();
    else this.pudding.setVisible(false);
    if (kind === "splash") {
      this.splatTimer?.remove();
      this.splat.setVisible(true).setAngle(Phaser.Math.Between(-20, 20));
    }
    if (this.reduced) return;
    this.scene.tweens.killTweensOf(this.container);
    this.container.setY(this.slot.upY);
    if (kind === "slip") {
      this.scene.tweens.add({ targets: this.container, angle: { from: 0, to: -22 }, y: this.slot.upY + 34 * this.scale, duration: 150, yoyo: true, ease: "Quad.easeOut" });
    } else {
      this.scene.tweens.add({ targets: this.container, angle: { from: 9, to: 0 }, duration: 300, ease: "Back.easeOut" });
    }
  }

  recover(now: number, idle: number) {
    this.state = "up";
    this.until = now + idle;
    this.dizzy.setVisible(false);
    this.splat.setVisible(false);
    this.container.setAngle(0);
    this.startFidget();
  }

  loseTray() {
    this.shielded = false;
    this.scene.tweens.killTweensOf(this.tray);
    if (this.reduced) {
      this.tray.setVisible(false);
      return;
    }
    this.scene.tweens.add({
      targets: this.tray,
      x: Phaser.Math.Between(0, 1) ? 150 : -150,
      y: TRAY_UP_Y - 120,
      angle: 260,
      alpha: 0,
      duration: 420,
      ease: "Quad.easeOut",
      onComplete: () => this.tray.setVisible(false),
    });
  }

  hand(dir = 1) {
    const s = this.scale;
    return { x: this.x + 80 * s * dir, y: this.container.y - 176 * s };
  }

  throwPose(dir: number) {
    if (this.state !== "up") return;
    this.poseTimer?.remove();
    this.body.setTexture(this.texture("windup")).setFlipX(dir < 0);
    this.poseTimer = this.scene.time.delayedCall(300, () => {
      if (this.state === "up") this.body.setTexture(this.texture("up")).setFlipX(false);
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
    if (this.state === "hidden" || this.state === "lowering" || this.state === "stunned" || this.state === "dazed") return false;
    if (!this.reduced) this.scene.tweens.add({ targets: this.container, y: this.container.y - 26 * this.scale, duration: 140, yoyo: true, repeat: 1, ease: "Quad.easeOut" });
    return true;
  }

  sulk() {
    if (this.state === "hidden" || this.state === "lowering" || this.state === "stunned" || this.state === "dazed") return false;
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
    const t = cartoonText(this.scene, this.x, this.top() - 30, text, {
      size: this.slot.row === "back" ? 30 : 36,
      color: "#fbf5e6",
      font: this.fonts.display,
      stroke: 0.2,
    })
      .setOrigin(0.5)
      .setDepth(15);
    const view = this.scene.cameras.main.worldView;
    if (view.width > t.width) t.setX(Phaser.Math.Clamp(t.x, view.x + t.width / 2 + 8, view.right - t.width / 2 - 8));
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
      this.alert.setPosition(this.x - 50 * this.scale, this.top() - 26).setScale((this.slot.row === "back" ? 0.85 : 1) * pulse);
      this.alert.setColor(k > 0.66 ? "#ef4f43" : "#ffc83d");
    }
    if (this.dizzy.visible) {
      this.dizzy.setPosition(this.x + (this.reduced ? 0 : Math.sin(now / 90) * 14), this.top() - 8);
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
  private shadow: Phaser.GameObjects.Ellipse;
  active = false;
  angry = false;
  private speed = LUNCH_LADY.speed;
  private walked = 0;
  private stopX: number | null = null;
  private pausedFor = 0;
  private exitX = LUNCH_LADY.exitX;
  private stretch = 1;

  constructor(
    private scene: Phaser.Scene,
    private reduced: boolean,
  ) {
    this.shadow = scene.add.ellipse(-300, LUNCH_LADY.y + 4, 120, 20, 0x1d1830, 0.22).setDepth(4.9).setVisible(false);
    this.img = scene.add.image(-300, LUNCH_LADY.y, "lady-walk-0").setOrigin(0.5, 1).setScale(LUNCH_LADY.scale).setDepth(5).setVisible(false);
    this.marker = scene.add.image(-300, 420, "icon-ban").setDepth(15).setAlpha(0.92).setVisible(false);
  }

  start(enterX: number, exitX: number, stretch: number, stopX: number | null = null) {
    this.active = true;
    this.angry = false;
    this.walked = 0;
    this.stopX = stopX;
    this.pausedFor = 0;
    this.exitX = exitX;
    this.stretch = stretch;
    this.img.setTexture("lady-walk-0").setPosition(enterX, LUNCH_LADY.y).setAngle(0).setVisible(true);
    this.shadow.setVisible(true);
    this.marker.setVisible(true);
    this.place();
  }

  center() {
    return { x: this.img.x, y: this.img.y - this.img.displayHeight * 0.56 };
  }

  covers(at: { x: number; y: number }, margin = 0) {
    if (!this.active) return false;
    const halfW = this.img.displayWidth * 0.4 + margin;
    const top = this.img.y - this.img.displayHeight;
    return Math.abs(at.x - this.img.x) < halfW && at.y > top - margin && at.y < this.img.y + 40;
  }

  private place() {
    const frame = Math.floor(this.walked / LUNCH_LADY.stride) % 4;
    this.img.setTexture(`${this.angry ? "lady-angry" : "lady-walk"}-${frame}`);
    const lift = frame % 2 === 1 ? 7 : 0;
    this.img.setY(LUNCH_LADY.y - (this.reduced ? 0 : lift));
    if (!this.reduced) this.img.setAngle(frame === 1 ? -1.5 : frame === 3 ? 1.5 : 0);
    this.shadow.setPosition(this.img.x + 4, LUNCH_LADY.y + 4).setScale(lift ? 0.88 : 1, 1);
    this.marker.setPosition(this.img.x, LUNCH_LADY.y - this.img.displayHeight - 34 - lift);
  }

  retarget(x: number, exitX: number, stretch: number, stopX: number | null = null) {
    this.exitX = exitX;
    this.stretch = stretch;
    if (this.stopX !== null) this.stopX = stopX;
    if (!this.active) return;
    this.img.setX(x);
    this.place();
  }

  get paused() {
    return this.pausedFor > 0;
  }

  update(delta: number) {
    if (!this.active) return;
    if (this.pausedFor > 0 && !this.angry) {
      this.pausedFor -= delta;
      return;
    }
    if (this.stopX !== null && this.img.x <= this.stopX && !this.angry) {
      this.stopX = null;
      this.pausedFor = LUNCH_LADY.stopMs;
      this.walked = 0;
      this.place();
      return;
    }
    const step = this.speed * delta * (this.angry ? 1.6 : 1);
    this.img.x -= step * this.stretch;
    this.walked += step;
    this.place();
    if (this.img.x < this.exitX) this.hide();
  }

  scold() {
    this.angry = true;
    this.pausedFor = 0;
    this.place();
    if (!this.reduced) {
      const s = LUNCH_LADY.scale;
      this.scene.tweens.add({ targets: this.img, scaleX: s * 1.08, scaleY: s * 0.92, duration: 90, yoyo: true });
    }
  }

  hide() {
    this.active = false;
    this.img.setVisible(false);
    this.shadow.setVisible(false);
    this.marker.setVisible(false);
  }
}

export type CookPhase = "away" | "warning" | "entering" | "grabbing" | "leaving";

export class Cook {
  readonly img: Phaser.GameObjects.Image;
  phase: CookPhase = "away";
  private baseY: number = COOK.y;
  private clock = 0;
  private carrying = false;
  private found = false;

  constructor(
    private scene: Phaser.Scene,
    private reduced: boolean,
  ) {
    this.img = scene.add.image(COOK.enterX, COOK.y, "cook-walk-0").setOrigin(0.5, 1).setScale(COOK.scale).setDepth(8.5).setVisible(false);
  }

  get busy() {
    return this.phase !== "away";
  }

  setBaseY(y: number) {
    this.baseY = y;
    this.scene.tweens.killTweensOf(this.img);
    this.img.setY(y);
  }

  get grabbing() {
    return this.phase === "grabbing";
  }

  warn() {
    this.phase = "warning";
    this.clock = 0;
  }

  basket() {
    const s = COOK.scale;
    return { x: this.img.x + (60 - 140) * s, y: this.img.y - (500 - 312) * s };
  }

  private walkFrame(prefix: string) {
    const frame = Math.floor(this.clock / 150) % 2;
    this.img.setTexture(`${prefix}-${frame}`);
    this.img.setY(this.baseY - (this.reduced || frame === 0 ? 0 : 6));
    if (!this.reduced) this.img.setAngle(frame ? -1.5 : 1.5);
  }

  update(delta: number, onArrive: () => void, onDone: () => void) {
    if (this.phase === "away") return;
    this.clock += delta;
    if (this.phase === "warning") {
      if (this.clock >= COOK.warnMs) {
        this.phase = "entering";
        this.clock = 0;
        this.img.setPosition(COOK.enterX, this.baseY).setVisible(true);
      }
      return;
    }
    if (this.phase === "entering") {
      this.img.x = Math.min(COOK.standX, this.img.x + COOK.enterSpeed * delta);
      this.walkFrame("cook-walk");
      if (this.img.x >= COOK.standX) {
        this.phase = "grabbing";
        this.clock = 0;
        this.img.setTexture("cook-reach").setAngle(0).setY(this.baseY);
        if (!this.reduced) this.scene.tweens.add({ targets: this.img, y: this.baseY + 10, duration: 160, yoyo: true, repeat: 1, ease: "Sine.easeInOut" });
        onArrive();
      }
      return;
    }
    if (this.phase === "grabbing") {
      if (this.clock >= COOK.grabMs) {
        this.phase = "leaving";
        this.clock = 0;
        onDone();
      }
      return;
    }
    this.img.x -= COOK.exitSpeed * delta;
    this.walkFrame(this.carrying ? "cook-carry" : this.found ? "cook-walk" : "cook-huff");
    if (this.img.x < COOK.exitX) this.hide();
  }

  leave(carrying: boolean) {
    this.carrying = carrying;
    this.found = carrying;
  }

  hide() {
    this.phase = "away";
    this.carrying = false;
    this.img.setVisible(false).setAngle(0);
  }
}
