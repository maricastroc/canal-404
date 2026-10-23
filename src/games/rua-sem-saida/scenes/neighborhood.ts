import * as Phaser from "phaser";
import { ARLINDO_WINDOW, CAT_SPOT, GROUND_Y, W } from "../config";
import type { Fx } from "./fx";
import { Bubble, cartoonText, type Fonts } from "./ui";

export class Arlindo {
  private sprite: Phaser.GameObjects.Image;
  private bubble: Bubble;
  private hideTimer?: Phaser.Time.TimerEvent;
  lastShout = 0;

  constructor(
    private scene: Phaser.Scene,
    fonts: Fonts,
    private reduced: boolean,
  ) {
    const win = ARLINDO_WINDOW;
    this.sprite = scene.add.image(win.x + win.w / 2, win.y + win.h + 150, "arlindo").setOrigin(0.5, 1).setDepth(4);
    const shape = scene.make.graphics({}, false);
    shape.fillStyle(0xffffff);
    shape.fillRect(win.x, win.y, win.w, win.h);
    this.sprite.setMask(shape.createGeometryMask());
    this.bubble = new Bubble(scene, fonts, "right", 38, 15);
  }

  setScale(scale: number) {
    this.bubble.setBaseScale(Math.min(scale, 1.4));
  }

  get busy() {
    return this.scene.time.now - this.lastShout < 1600;
  }

  shout(text: string, duration = 1700) {
    const win = ARLINDO_WINDOW;
    this.lastShout = this.scene.time.now;
    this.bubble.say(text, win.x + 18, win.y - 6, duration);
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({ targets: this.sprite, y: win.y + win.h + 32, duration: 200, ease: "Back.easeOut" });
    if (!this.reduced) {
      this.scene.tweens.add({ targets: this.sprite, angle: { from: -7, to: 7 }, duration: 85, yoyo: true, repeat: 5 });
    }
    this.hideTimer?.remove();
    this.hideTimer = this.scene.time.delayedCall(duration + 150, () => {
      this.scene.tweens.add({ targets: this.sprite, y: win.y + win.h + 150, angle: 0, duration: 280, ease: "Sine.easeIn" });
    });
  }
}

export class Cat {
  private sprite: Phaser.GameObjects.Image;
  private zzz: Phaser.GameObjects.Text;
  state: "sleep" | "scared" | "gone" = "sleep";

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    private fx: Fx,
    private reduced: boolean,
    private onHiss: () => void,
  ) {
    this.sprite = scene.add.image(CAT_SPOT.x, CAT_SPOT.y, "cat-sleep").setOrigin(0.5, 1).setDepth(4.5);
    this.zzz = cartoonText(scene, CAT_SPOT.x + 30, CAT_SPOT.y - 76, "z", { size: 34, color: "#fbf5e6", font: fonts.display, stroke: 0.2 })
      .setOrigin(0.5)
      .setDepth(4.6);
    if (!reduced) {
      scene.tweens.add({ targets: this.sprite, scaleY: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      scene.tweens.add({
        targets: this.zzz,
        y: CAT_SPOT.y - 120,
        x: CAT_SPOT.x + 50,
        alpha: { from: 1, to: 0 },
        duration: 1800,
        repeat: -1,
        onRepeat: () => this.zzz.setText(this.zzz.text === "z" ? "Z" : "z"),
      });
    }
  }

  private distance(x: number, y: number) {
    return Phaser.Math.Distance.Between(x, y, this.sprite.x, this.sprite.y - 30);
  }

  notifyImpact(x: number, y: number, strength: number) {
    if (this.state !== "sleep") return;
    if (strength > 4 && this.distance(x, y) < 300) this.scare();
  }

  notifyFlyby(x: number, y: number) {
    if (this.state !== "sleep") return;
    if (this.distance(x, y) < 130) this.scare();
  }

  private scare() {
    this.state = "scared";
    this.zzz.setVisible(false);
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setScale(1).setTexture("cat-scared");
    this.fx.word("FSST!", this.sprite.x + 20, this.sprite.y - 150, "#9df0dc", 50, true);
    this.onHiss();
    if (this.reduced) {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        delay: 500,
        duration: 300,
        onComplete: () => this.leave(),
      });
      return;
    }
    this.scene.tweens.add({
      targets: this.sprite,
      y: CAT_SPOT.y - 70,
      duration: 150,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.sprite,
          x: -160,
          duration: 900,
          delay: 80,
          ease: "Quad.easeIn",
          onComplete: () => this.leave(),
        });
        this.scene.tweens.add({ targets: this.sprite, y: CAT_SPOT.y - 14, duration: 90, yoyo: true, repeat: 5 });
      },
    });
  }

  private leave() {
    this.state = "gone";
    this.sprite.setVisible(false);
  }

  comeBack() {
    if (this.state !== "gone") return;
    this.state = "sleep";
    this.sprite.setTexture("cat-sleep").setPosition(CAT_SPOT.x, CAT_SPOT.y).setVisible(true).setAlpha(0);
    this.fx.burst(this.fx.puff, 4, CAT_SPOT.x, CAT_SPOT.y - 30);
    this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 300 });
    this.zzz.setVisible(true);
    if (!this.reduced) {
      this.scene.tweens.add({ targets: this.sprite, scaleY: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }
}

export function popLid(scene: Phaser.Scene, can: Phaser.Physics.Matter.Image, fx: Fx, reduced: boolean) {
  const body = can.body as MatterJS.BodyType;
  const angle = body.angle;
  const top = { x: body.position.x + Math.sin(angle) * 54, y: body.position.y - Math.cos(angle) * 54 };
  can.setTexture("trash-can-open");
  const lid = scene.add.image(top.x, top.y, "lid").setDepth(6).setRotation(angle);
  const dir = top.x > W / 2 ? 1 : -1;
  fx.junk.forEach((e) => fx.burst(e, 2, top.x, top.y));
  fx.word("CLANG!", top.x, top.y - 80, "#c3ccd8", 64, true);
  if (reduced) {
    scene.tweens.add({ targets: lid, y: GROUND_Y - 12, x: top.x + dir * 90, duration: 420, ease: "Quad.easeIn" });
    return;
  }
  scene.tweens.add({
    targets: lid,
    x: top.x + dir * 120,
    y: top.y - 190,
    angle: lid.angle + dir * 420,
    duration: 360,
    ease: "Quad.easeOut",
    onComplete: () => {
      scene.tweens.add({
        targets: lid,
        x: lid.x + dir * 70,
        y: GROUND_Y - 12,
        angle: lid.angle + dir * 200,
        duration: 420,
        ease: "Quad.easeIn",
        onComplete: () => {
          scene.tweens.add({ targets: lid, angle: { from: lid.angle + 18 * dir, to: Math.round(lid.angle / 180) * 180 }, duration: 320, ease: "Bounce.easeOut" });
        },
      });
    },
  });
}

export function birdFlyOut(scene: Phaser.Scene, x: number, y: number, fx: Fx, reduced: boolean) {
  const bird = scene.add.image(x, y, "bird").setDepth(13).setScale(0.5);
  const flap = scene.time.addEvent({
    delay: 90,
    loop: true,
    callback: () => bird.setTexture(bird.texture.key === "bird" ? "bird-down" : "bird"),
  });
  fx.word("PIU!", x + 60, y - 70, "#5cb9f0", 46, true);
  scene.tweens.add({
    targets: bird,
    x: x + (reduced ? 120 : 320),
    y: y - (reduced ? 80 : 300),
    scale: 1,
    duration: reduced ? 500 : 1100,
    ease: "Sine.easeOut",
    onComplete: () => {
      scene.tweens.add({
        targets: bird,
        x: bird.x + 400,
        y: bird.y - 160,
        alpha: 0,
        duration: 700,
        onComplete: () => {
          flap.remove();
          bird.destroy();
        },
      });
    },
  });
}
