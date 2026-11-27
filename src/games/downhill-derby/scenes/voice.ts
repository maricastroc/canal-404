import * as Phaser from "phaser";
import type { CartId } from "../sim/carts";
import { INK } from "./cart";

type Bubble = { who: CartId; root: Phaser.GameObjects.Container; box: Phaser.GameObjects.Container; w: number; age: number };

export type VoiceBounds = { left: number; right: number };

const LIFE = 1.9;
const POP = 0.16;
const FADE = 0.3;
const GAP = 1.2;
const COOLDOWN = 5;
const PAD_X = 16;
const PAD_Y = 8;
const TAIL = 14;
const CREAM = 0xfbf5e6;

export class RivalVoice {
  private readonly scene: Phaser.Scene;
  private readonly layer: Phaser.GameObjects.Layer;
  private readonly font: string;
  private bubbles: Bubble[] = [];
  private readonly last = new Map<CartId, number>();
  private readonly said = new Set<string>();
  private clock = 0;
  private quiet = 0;

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer, font: string) {
    this.scene = scene;
    this.layer = layer;
    this.font = font;
  }

  say(who: CartId, text: string, urgent = false) {
    const recent = this.clock - (this.last.get(who) ?? -Infinity) < COOLDOWN;
    const line = `${who}:${text}`;
    if (!urgent && (this.quiet > 0 || recent || this.said.has(line))) return false;
    this.said.add(line);
    this.drop(who);
    const label = this.scene.add.text(0, 0, text, { fontFamily: this.font, fontSize: "30px", color: "#1d1830" }).setOrigin(0.5, 1);
    const w = label.width + PAD_X * 2;
    const h = label.height + PAD_Y * 2;
    const g = this.scene.add.graphics();
    g.fillStyle(INK, 1);
    g.fillRoundedRect(-w / 2 - 4, -TAIL - h - 4, w + 8, h + 8, 16);
    g.fillStyle(CREAM, 1);
    g.fillRoundedRect(-w / 2, -TAIL - h, w, h, 12);
    label.setPosition(0, -TAIL - PAD_Y);
    const tail = this.scene.add.graphics();
    tail.fillStyle(INK, 1);
    tail.fillTriangle(-TAIL - 4, -TAIL - 2, TAIL + 4, -TAIL - 2, 0, 4);
    tail.fillStyle(CREAM, 1);
    tail.fillTriangle(-TAIL, -TAIL - 4, TAIL, -TAIL - 4, 0, -2);
    const box = this.scene.add.container(0, 0, [g, label]);
    const root = this.scene.add.container(0, 0, [box, tail]).setDepth(8.4).setVisible(false);
    this.layer.add(root);
    this.bubbles.push({ who, root, box, w: w + 8, age: 0 });
    this.last.set(who, this.clock);
    this.quiet = GAP;
    return true;
  }

  speaking(who: CartId) {
    return this.bubbles.some((b) => b.who === who);
  }

  update(dt: number, spots: ReadonlyMap<CartId, { x: number; y: number }>, scale: number, bounds: VoiceBounds) {
    this.clock += dt;
    this.quiet = Math.max(0, this.quiet - dt);
    for (const b of this.bubbles) {
      b.age += dt;
      const spot = spots.get(b.who);
      if (!spot || b.age >= LIFE) {
        b.age = LIFE;
        continue;
      }
      const k = Math.min(1, b.age / POP);
      const pop = 0.7 + 0.3 * Phaser.Math.Easing.Back.Out(k);
      const size = scale * pop;
      const half = (b.w / 2) * size;
      const reach = Math.max(0, b.w / 2 - TAIL - 16);
      const shift = spot.x < bounds.left + half ? bounds.left + half - spot.x : spot.x > bounds.right - half ? bounds.right - half - spot.x : 0;
      const room = bounds.right - bounds.left >= half * 2;
      if (!room || Math.abs(shift) / size > reach) {
        b.root.setVisible(false);
        continue;
      }
      b.box.setX(shift / size);
      b.root.setVisible(true).setPosition(spot.x, spot.y).setScale(size).setAlpha(Math.min(1, (LIFE - b.age) / FADE));
    }
    for (const b of this.bubbles) if (b.age >= LIFE) b.root.destroy();
    this.bubbles = this.bubbles.filter((b) => b.age < LIFE);
  }

  clear() {
    for (const b of this.bubbles) b.root.destroy();
    this.bubbles = [];
    this.last.clear();
    this.said.clear();
    this.quiet = 0;
  }

  private drop(who: CartId) {
    for (const b of this.bubbles) if (b.who === who) b.root.destroy();
    this.bubbles = this.bubbles.filter((b) => b.who !== who);
  }
}
