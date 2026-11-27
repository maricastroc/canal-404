import * as Phaser from "phaser";
import { COOK, LUNCH_LADY, RIVALS, WINDUP_RED, type RivalDef, type RivalKind, type RivalPose, type SlotDef } from "../config";
import { cartoonText, type Fonts } from "../../kit/ui";

export type RivalState = "hidden" | "rising" | "up" | "windup" | "after" | "dazed" | "stunned" | "lowering";
export type DazeKind = "slip" | "splash";
export type Reaction = "taunt" | "cheer" | "laugh" | "surprise" | "huff";

type Squash = [scaleX: number, scaleY: number, ms: number, ease?: string];

const SPRITE_H = 250;
const TRAY_UP_Y = -86;
const TRAY_DOWN_Y = 60;

export type HitOutcome = { result: "hurt" | "down"; interrupted: boolean; early: boolean };

export class Rival {
  readonly container: Phaser.GameObjects.Container;
  private rig: Phaser.GameObjects.Container;
  private rigMotion?: Phaser.Tweens.Tween | Phaser.Tweens.TweenChain;
  private tableScale: number;
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
  private dy = 0;

  constructor(
    private scene: Phaser.Scene,
    readonly slot: SlotDef,
    private table: Phaser.GameObjects.Image,
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
    this.tableScale = table.scaleY;
    this.rig = scene.add.container(0, 0, [this.body, this.splat, this.headSplat, this.tray]);
    this.container = scene.add
      .container(slot.x, this.hiddenY, [this.rig])
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

  placeAt(x: number, dy: number, now: number) {
    const shift = dy - this.dy;
    this.x = x;
    this.dy = dy;
    this.container.setX(x);
    if (shift) this.shiftY(shift);
    this.syncAttachments(now);
  }

  private shiftY(shift: number) {
    for (const target of [this.container, this.pudding]) {
      target.y += shift;
      for (const tween of this.scene.tweens.getTweensOf(target)) {
        const parts = tween instanceof Phaser.Tweens.TweenChain ? (tween.data as Phaser.Tweens.Tween[]) : [tween];
        for (const part of parts) {
          for (const data of part.data) {
            if (!(data instanceof Phaser.Tweens.TweenData) || data.key !== "y") continue;
            data.start += shift;
            data.end += shift;
            data.current += shift;
            data.previous += shift;
          }
        }
      }
    }
  }

  get upY() {
    return this.slot.upY + this.dy;
  }

  get tableY() {
    return this.slot.tableY + this.dy;
  }

  get hiddenY() {
    return this.upY + SPRITE_H * this.slot.scale * this.def.size + 10;
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

  private texture(pose: RivalPose) {
    return `rival-${this.def.kind}-${this.look}-${pose}`;
  }

  private showFace(face: "laugh" | "oops", ms: number) {
    this.poseTimer?.remove();
    this.body.setTexture(this.texture(face)).setFlipX(false);
    this.poseTimer = this.scene.time.delayedCall(ms, () => {
      if (this.state === "up" || this.state === "after") this.body.setTexture(this.texture("up")).setFlipX(false);
    });
  }

  private shape(steps: Squash[], from?: [number, number], onDone?: () => void) {
    this.rigMotion?.stop();
    this.rigMotion = undefined;
    if (this.reduced) {
      this.rig.setScale(1);
      return;
    }
    if (from) this.rig.setScale(from[0], from[1]);
    this.rigMotion = this.scene.tweens.chain({
      targets: this.rig,
      tweens: steps.map(([scaleX, scaleY, duration, ease]) => ({ scaleX, scaleY, duration, ease: ease ?? "Sine.easeOut" })),
      onComplete: () => {
        this.rigMotion = undefined;
        onDone?.();
      },
    });
  }

  private settleRig() {
    this.rigMotion?.stop();
    this.rigMotion = undefined;
    this.rig.setScale(1);
  }

  private breathe() {
    if (this.reduced || this.brawl || this.state !== "up") return;
    this.rigMotion?.stop();
    this.rigMotion = this.scene.tweens.add({ targets: this.rig, scaleX: 0.99, scaleY: 1.022, duration: 440, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private rustle(strength: number) {
    if (this.reduced) return;
    const base = this.tableScale;
    this.scene.tweens.killTweensOf(this.table);
    this.table.setScale(base);
    this.scene.tweens.add({ targets: this.table, scaleY: base * (1 + 0.035 * strength), scaleX: base * (1 - 0.006 * strength), duration: 80, yoyo: true, ease: "Sine.easeOut" });
  }

  rise(kind: RivalKind, look: number, now: number, idle: number, opts: { feint?: boolean; hold?: boolean; tray?: boolean; brawl?: boolean; fromY?: number } = {}) {
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
    this.container.setScale(this.scale).setY(opts.fromY ?? this.hiddenY).setVisible(true).setAngle(0);
    this.state = "rising";
    this.scene.tweens.killTweensOf(this.container);
    const duration = kind === "speedy" ? 150 : 230;
    this.scene.tweens.add({
      targets: this.container,
      y: this.upY,
      duration,
      ease: "Cubic.easeOut",
      onComplete: () => {
        if (this.state !== "rising") return;
        this.state = "up";
        this.until = now + duration + idle;
        this.startFidget();
      },
    });
    if (opts.fromY === undefined) this.rustle(kind === "big" ? 1.3 : 1);
    const pop = kind === "speedy" ? 0.06 : kind === "big" ? 0.1 : 0.08;
    this.shape(
      [
        [0.96, 1.05, duration * 0.7, "Quad.easeOut"],
        [1 + pop, 1 - pop, duration * 0.3 + 40, "Quad.easeOut"],
        [1, 1, 170, "Back.easeOut"],
      ],
      [0.88, 1.12],
      () => this.breathe(),
    );
  }

  startWindup(now: number, ms: number) {
    this.poseTimer?.remove();
    this.state = "windup";
    this.windupStart = now;
    this.windupMs = ms;
    this.until = now + ms;
    this.body.setTexture(this.texture("windup"));
    this.shape([
      [1.06, 0.94, 90, "Quad.easeOut"],
      [0.97, 1.04, 170, "Sine.easeInOut"],
    ]);
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
    this.shape([
      [1.07, 0.94, 70, "Quad.easeOut"],
      [1, 1, 180, "Back.easeOut"],
    ]);
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
      this.shape([
        [1.08, 0.92, 60, "Quad.easeOut"],
        [1, 1, 200, "Back.easeOut"],
      ]);
      if (this.state === "windup") this.until = Math.max(this.until, now + 500);
      return { result: "hurt", interrupted: false, early: false };
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
    this.shape([
      [1.16, 0.84, 70, "Quad.easeOut"],
      [0.95, 1.05, 130, "Sine.easeOut"],
      [1.02, 0.97, 200, "Sine.easeInOut"],
    ]);
    if (!wasWindup || !this.pudding.visible) {
      this.pudding.setVisible(false);
      return { result: "down", interrupted: false, early: false };
    }
    this.dropPudding();
    const red = this.windupProgress(now) >= WINDUP_RED;
    return { result: "down", interrupted: red, early: !red };
  }

  private windupProgress(now: number) {
    return this.windupMs ? Phaser.Math.Clamp((now - this.windupStart) / this.windupMs, 0, 1) : 0;
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
    this.shape(kind === "slip" ? [[0.92, 1.1, 90, "Quad.easeOut"], [1.1, 0.9, 150, "Quad.easeIn"], [1, 1, 220, "Back.easeOut"]] : [[1.1, 0.9, 80, "Quad.easeOut"], [1, 1, 240, "Back.easeOut"]]);
    this.scene.tweens.killTweensOf(this.container);
    if (this.reduced) {
      this.container.setY(this.upY);
      return;
    }
    const settle = Math.abs(this.container.y - this.upY) > 1 ? [{ y: this.upY, duration: 80, ease: "Quad.easeOut" }] : [];
    const wobble =
      kind === "slip"
        ? { angle: { from: 0, to: -22 }, y: this.upY + 34 * this.scale, duration: 150, yoyo: true, ease: "Quad.easeOut" }
        : { angle: { from: 9, to: 0 }, duration: 300, ease: "Back.easeOut" };
    this.scene.tweens.chain({ targets: this.container, tweens: [...settle, wobble] });
  }

  recover(now: number, idle: number) {
    this.state = "up";
    this.until = now + idle;
    this.dizzy.setVisible(false);
    this.splat.setVisible(false);
    this.container.setAngle(0);
    this.startFidget();
    this.shape([[1, 1, 160, "Sine.easeOut"]], undefined, () => this.breathe());
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
    return { x: this.x + 80 * s * dir * this.rig.scaleX, y: this.container.y - 176 * s * this.rig.scaleY };
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
    this.shape([
      [1.1, 0.9, 60, "Quad.easeOut"],
      [1, 1, 200, "Back.easeOut"],
    ]);
  }

  private get onStage() {
    return this.state !== "hidden" && this.state !== "lowering" && this.state !== "stunned" && this.state !== "dazed";
  }

  celebrate() {
    if (!this.onStage) return false;
    this.showFace("laugh", 750);
    this.shape([
      [0.9, 1.13, 120, "Quad.easeOut"],
      [1.06, 0.94, 100, "Quad.easeIn"],
      [0.93, 1.09, 110, "Quad.easeOut"],
      [1, 1, 180, "Back.easeOut"],
    ]);
    return true;
  }

  sulk() {
    if (!this.onStage) return false;
    this.showFace("oops", 650);
    if (!this.reduced) this.scene.tweens.add({ targets: this.container, angle: { from: -6, to: 6 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => this.container.setAngle(0) });
    this.shape([
      [1.06, 0.92, 140, "Quad.easeOut"],
      [1, 1, 300, "Sine.easeInOut"],
    ]);
    return true;
  }

  laughAt() {
    if (this.state !== "up" || this.brawl) return false;
    this.showFace("laugh", 800);
    if (!this.reduced) {
      this.scene.tweens.add({ targets: this.container, angle: { from: 3, to: -3 }, duration: 70, yoyo: true, repeat: 3, onComplete: () => this.container.setAngle(0) });
    }
    this.shape(
      [
        [1.06, 0.92, 110, "Quad.easeOut"],
        [0.98, 1.04, 70],
        [1.03, 0.97, 70],
        [0.99, 1.02, 70],
        [1, 1, 160, "Back.easeOut"],
      ],
      undefined,
      () => this.breathe(),
    );
    return true;
  }

  stay(now: number) {
    if (this.state === "lowering") {
      this.rise(this.def.kind, this.look, now, 0, { hold: true, fromY: this.container.y });
      return;
    }
    this.hold = true;
    this.alert.setVisible(false);
    if (!this.puddingFalling) this.pudding.setVisible(false);
    if (this.state === "windup" || this.state === "after") {
      this.state = "up";
      this.body.setTexture(this.texture("up")).setFlipX(false);
      this.shape([[1, 1, 160, "Sine.easeOut"]]);
    }
  }

  react(kind: Reaction, line?: string) {
    if (!this.onStage) return false;
    this.stopFidget();
    this.poseTimer?.remove();
    this.alert.setVisible(false);
    if (!this.puddingFalling) this.pudding.setVisible(false);
    if (line) this.taunt(line);
    const arm = kind === "taunt" || kind === "cheer";
    this.body.setTexture(this.texture(arm ? "windup" : kind === "laugh" ? "laugh" : "oops")).setFlipX(kind === "taunt");
    if (this.reduced) return true;
    const tweens = this.scene.tweens;
    if (this.state !== "rising") {
      tweens.killTweensOf(this.container);
      this.container.setAngle(0);
    }
    if (kind === "taunt") {
      tweens.add({ targets: this.container, angle: -7, duration: 150, ease: "Back.easeOut" });
      this.shape([
        [0.94, 1.08, 140, "Quad.easeOut"],
        [1.03, 0.97, 130, "Sine.easeInOut"],
        [0.97, 1.04, 130, "Sine.easeInOut"],
        [1.03, 0.97, 130, "Sine.easeInOut"],
        [0.98, 1.03, 160, "Sine.easeInOut"],
      ]);
    } else if (kind === "cheer") {
      tweens.add({ targets: this.container, angle: { from: -5, to: 5 }, duration: 190, yoyo: true, repeat: 1, ease: "Sine.easeInOut", onComplete: () => this.container.setAngle(0) });
      this.shape([
        [0.9, 1.14, 110, "Quad.easeOut"],
        [1.07, 0.93, 90, "Quad.easeIn"],
        [0.9, 1.14, 110, "Quad.easeOut"],
        [1.07, 0.93, 90, "Quad.easeIn"],
        [0.94, 1.08, 110, "Quad.easeOut"],
        [1, 1, 180, "Back.easeOut"],
      ]);
    } else if (kind === "laugh") {
      tweens.add({ targets: this.container, angle: { from: 3, to: -3 }, duration: 70, yoyo: true, repeat: 5, onComplete: () => this.container.setAngle(0) });
      const shake: Squash[] = [];
      for (let i = 0; i < 8; i += 1) shake.push(i % 2 ? [1.03, 0.96, 60, "Sine.easeInOut"] : [0.98, 1.04, 60, "Sine.easeInOut"]);
      this.shape([[1.08, 0.9, 130, "Quad.easeOut"], ...shake, [1, 1, 220, "Back.easeOut"]]);
    } else if (kind === "surprise") {
      this.shape([
        [0.86, 1.16, 80, "Quad.easeOut"],
        [1.02, 0.98, 160, "Back.easeOut"],
      ]);
    } else {
      tweens.add({ targets: this.container, angle: { from: -4, to: 4 }, duration: 170, yoyo: true, repeat: 1, ease: "Sine.easeInOut", onComplete: () => this.container.setAngle(0) });
      this.shape([
        [1.07, 0.91, 240, "Sine.easeOut"],
        [1.04, 0.94, 300, "Sine.easeInOut"],
      ]);
    }
    return true;
  }

  lower(onHidden: () => void) {
    this.state = "lowering";
    this.stopFidget();
    this.alert.setVisible(false);
    this.pudding.setVisible(false);
    this.scene.tweens.killTweensOf(this.container);
    this.shape([
      [0.95, 1.06, 50, "Quad.easeOut"],
      [1.1, 0.88, 150, "Quad.easeIn"],
    ]);
    this.scene.tweens.add({
      targets: this.container,
      y: this.hiddenY,
      angle: 0,
      duration: 200,
      ease: "Quad.easeIn",
      onComplete: () => {
        this.state = "hidden";
        this.settleRig();
        this.rustle(0.7);
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
    const top = this.state === "rising" ? this.upY - 228 * this.scale : this.top();
    const t = cartoonText(this.scene, this.x, top - 30, text, {
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
      const k = this.windupProgress(now);
      const pulse = this.reduced ? 1 : 1 + Math.sin(now / (110 - k * 60)) * 0.12;
      this.alert.setPosition(this.x - 50 * this.scale, this.top() - 26).setScale((this.slot.row === "back" ? 0.85 : 1) * pulse);
      this.alert.setColor(k >= WINDUP_RED ? "#ef4f43" : "#ffc83d");
    }
    if (this.dizzy.visible) {
      this.dizzy.setPosition(this.x + (this.reduced ? 0 : Math.sin(now / 90) * 14), this.top() - 8);
    }
  }

  forceHide() {
    this.stopFidget();
    this.settleRig();
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
  private ranting = false;
  private baseY: number = LUNCH_LADY.y;

  constructor(
    private scene: Phaser.Scene,
    private reduced: boolean,
  ) {
    this.shadow = scene.add.ellipse(-300, this.baseY + 4, 120, 20, 0x1d1830, 0.22).setDepth(4.9).setVisible(false);
    this.img = scene.add.image(-300, this.baseY, "lady-walk-0").setOrigin(0.5, 1).setScale(LUNCH_LADY.scale).setDepth(5).setVisible(false);
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
    this.ranting = false;
    this.img.setTexture("lady-walk-0").setPosition(enterX, this.baseY).setAngle(0).setScale(LUNCH_LADY.scale).setVisible(true);
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

  private place(stride = LUNCH_LADY.stride) {
    const frame = Math.floor(this.walked / stride) % 4;
    this.img.setTexture(`${this.angry ? "lady-angry" : "lady-walk"}-${frame}`);
    const lift = frame % 2 === 1 ? 7 : 0;
    this.img.setY(this.baseY - (this.reduced ? 0 : lift));
    if (!this.reduced) this.img.setAngle(frame === 1 ? -1.5 : frame === 3 ? 1.5 : 0);
    this.shadow.setPosition(this.img.x + 4, this.baseY + 4).setScale(lift ? 0.88 : 1, 1);
    this.marker.setPosition(this.img.x, this.baseY - this.img.displayHeight - 34 - lift);
  }

  setBaseY(y: number) {
    this.baseY = y;
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
    if (!this.active || this.ranting) return;
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

  storm(enterX: number, stopX: number, onArrive: () => void) {
    this.scene.tweens.killTweensOf(this.img);
    this.ranting = true;
    this.angry = true;
    this.pausedFor = 0;
    this.marker.setVisible(false);
    if (!this.active) {
      this.active = true;
      this.walked = 0;
      this.img.setPosition(enterX, this.baseY).setScale(LUNCH_LADY.scale).setAngle(0).setVisible(true);
      this.shadow.setVisible(true);
    } else {
      stopX = this.img.x;
    }
    const dist = Math.abs(this.img.x - stopX);
    if (this.reduced || dist < 8) {
      this.img.setX(stopX);
      this.rant();
      onArrive();
      return;
    }
    const walk = { x: this.img.x };
    this.scene.tweens.add({
      targets: walk,
      x: stopX,
      duration: dist / 0.85,
      ease: "Sine.easeOut",
      onUpdate: () => {
        this.walked += Math.abs(walk.x - this.img.x);
        this.img.setX(walk.x);
        this.place(38);
        this.marker.setVisible(false);
      },
      onComplete: () => {
        this.rant();
        onArrive();
      },
    });
  }

  private rant() {
    const s = LUNCH_LADY.scale;
    this.img.setTexture("lady-scold").setY(this.baseY).setAngle(0).setScale(s);
    this.shadow.setPosition(this.img.x + 4, this.baseY + 4).setScale(1);
    if (this.reduced) return;
    this.scene.tweens.chain({
      targets: this.img,
      tweens: [
        { scaleX: s * 1.07, scaleY: s * 0.93, duration: 80, ease: "Quad.easeOut" },
        { scaleX: s, scaleY: s, duration: 160, ease: "Back.easeOut" },
        { scaleX: s * 1.05, scaleY: s * 0.95, duration: 70, ease: "Quad.easeOut" },
        { scaleX: s, scaleY: s, duration: 160, ease: "Back.easeOut" },
      ],
    });
    this.scene.tweens.add({ targets: this.img, angle: { from: -2.5, to: 2.5 }, duration: 130, yoyo: true, repeat: 4, delay: 240, ease: "Sine.easeInOut", onComplete: () => this.img.setAngle(0) });
  }

  top() {
    return this.img.y - this.img.displayHeight;
  }

  hide() {
    this.active = false;
    this.ranting = false;
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
