import * as Phaser from "phaser";
import { SPECIAL } from "../special";

const GOLD = 0xffc83d;
const SCALE = 1.02 / 1.25;

export class SpecialDrop {
  private img: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private ring: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Image;
  private sparks: Phaser.GameObjects.Image[] = [];
  private landed = false;
  private gone = false;

  constructor(
    private scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
    private reduced: boolean,
    onLand: () => void,
  ) {
    this.shadow = scene.add.image(x, y + 2, "blob").setDisplaySize(140, 40).setAlpha(0.6).setDepth(30);
    this.ring = scene.add.image(x, y + 2, "ring").setScale(0.95).setDepth(31);
    this.glow = scene.add.image(x, y - 46, "glow").setDisplaySize(170, 140).setTint(GOLD).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.32).setDepth(y - 0.5);
    this.img = scene.add.image(x, y - 46, "pillow").setScale(SCALE).setTint(GOLD).setDepth(y);
    for (let i = 0; i < 3; i += 1) this.sparks.push(scene.add.image(x, y - 46, "star").setScale(0.36).setDepth(y + 0.5));
    if (reduced) {
      this.landed = true;
      onLand();
      return;
    }
    this.img.setY(y - 620);
    this.ring.setAlpha(0);
    this.glow.setAlpha(0);
    for (const s of this.sparks) s.setAlpha(0);
    this.shadow.setDisplaySize(30, 10).setAlpha(0.2);
    scene.tweens.add({ targets: this.shadow, displayWidth: 140, displayHeight: 40, alpha: 0.6, duration: 520, ease: "Quad.easeIn" });
    scene.tweens.add({
      targets: this.img,
      y: y - 46,
      angle: 380,
      duration: 520,
      ease: "Quad.easeIn",
      onComplete: () => {
        this.img.setAngle(0);
        this.landed = true;
        this.img.setScale(SCALE * 1.3, SCALE * 0.7);
        scene.tweens.add({ targets: this.img, scaleX: SCALE, scaleY: SCALE, duration: 420, ease: "Elastic.easeOut", easeParams: [1.2, 0.4] });
        scene.tweens.add({ targets: [this.ring, this.glow, ...this.sparks], alpha: { from: 0, to: 1 }, duration: 240 });
        this.glow.setAlpha(0.32);
        onLand();
      },
    });
  }

  update(t: number, age: number) {
    if (!this.landed || this.gone) return;
    const left = SPECIAL.life - age;
    const blink = left < 3000 && !this.reduced ? (Math.floor(t / (left < 1200 ? 90 : 170)) % 2 ? 0.35 : 1) : 1;
    if (this.reduced) {
      this.img.setAlpha(blink);
      return;
    }
    const bob = Math.sin(t / 260) * 8;
    this.img.setY(this.y - 46 - bob).setAngle(Math.sin(t / 520) * 6).setAlpha(blink);
    this.glow.setY(this.y - 46 - bob).setAlpha(0.26 + Math.sin(t / 300) * 0.06);
    this.ring.setScale(0.95 + Math.sin(t / 240) * 0.05).setAlpha(blink);
    this.shadow.setDisplaySize(140 - bob * 2, 40 - bob * 0.6);
    this.sparks.forEach((s, i) => {
      const a = t / 700 + (i * Math.PI * 2) / 3;
      s.setPosition(this.x + Math.cos(a) * 72, this.y - 50 - bob + Math.sin(a) * 26).setDepth(this.y + (Math.sin(a) > 0 ? 0.5 : -0.6)).setAngle(t / 6).setAlpha(blink);
    });
  }

  grab(toX: number, toY: number) {
    this.gone = true;
    const parts = [this.img, this.glow, this.ring, this.shadow, ...this.sparks];
    if (this.reduced) {
      parts.forEach((p) => p.destroy());
      return;
    }
    this.scene.tweens.add({ targets: [this.ring, this.shadow, this.glow, ...this.sparks], alpha: 0, duration: 160 });
    this.scene.tweens.add({ targets: this.img, x: toX, y: toY, scale: SCALE * 0.5, angle: 200, duration: 200, ease: "Quad.easeIn", onComplete: () => parts.forEach((p) => p.destroy()) });
  }

  vanish() {
    this.gone = true;
    const parts = [this.img, this.glow, this.ring, this.shadow, ...this.sparks];
    if (this.reduced) {
      parts.forEach((p) => p.destroy());
      return;
    }
    this.scene.tweens.add({ targets: parts, alpha: 0, duration: 260 });
    this.scene.tweens.add({ targets: this.img, scale: SCALE * 0.2, angle: 160, duration: 300, ease: "Back.easeIn", onComplete: () => parts.forEach((p) => p.destroy()) });
  }
}
