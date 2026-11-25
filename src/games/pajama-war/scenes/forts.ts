import * as Phaser from "phaser";
import type { Fort } from "../nav";
import type { PajamaSfx } from "../sounds";
import type { Prop } from "./room";

type Sfx = (n: PajamaSfx, v?: number) => void;
type Material = "cloth" | "cardboard" | "brooms";

const KINDS: Record<string, { material: Material; tints: number[]; lean: number; top: number }> = {
  "fort-tipi": { material: "brooms", tints: [0xf2c84b, 0xe8c25a, 0xe0862a], lean: 1, top: 150 },
  "fort-box": { material: "cardboard", tints: [0xc98140, 0xd99550, 0xe0a262], lean: -1, top: 130 },
  "fort-chairs": { material: "cloth", tints: [0x6fa8dc, 0xa9d0f2, 0x4f86bf], lean: 1, top: 140 },
  "fort-table": { material: "cloth", tints: [0xe0645a, 0xfbf5e6, 0xc24a42], lean: -1, top: 130 },
};

const SOUNDS: Record<Material, { hit: PajamaSfx; sag: PajamaSfx; down: PajamaSfx }> = {
  cloth: { hit: "cloth", sag: "sag", down: "cavein" },
  cardboard: { hit: "cardboard", sag: "crumple", down: "crumple" },
  brooms: { hit: "cloth", sag: "clatter", down: "broomfall" },
};

const BITS: Record<Material, string[]> = {
  cloth: ["fiber"],
  cardboard: ["chip"],
  brooms: ["straw", "fiber"],
};

export function fortStage(f: Fort) {
  return f.hp <= 0 ? 2 : f.hp <= f.max / 2 ? 1 : 0;
}

export function makeFortTextures(scene: Phaser.Scene) {
  const gfx = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({}, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  gfx("fiber", 20, 12, (g) => {
    g.lineStyle(5, 0x1d1830, 1);
    g.beginPath();
    g.arc(10, 14, 8, Math.PI * 1.15, Math.PI * 1.85);
    g.strokePath();
    g.lineStyle(2.6, 0xffffff, 1);
    g.beginPath();
    g.arc(10, 14, 8, Math.PI * 1.15, Math.PI * 1.85);
    g.strokePath();
  });
  gfx("chip", 18, 16, (g) => {
    const pts = [new Phaser.Math.Vector2(3, 4), new Phaser.Math.Vector2(14, 2), new Phaser.Math.Vector2(16, 12), new Phaser.Math.Vector2(6, 14)];
    g.fillStyle(0xffffff, 1);
    g.fillPoints(pts, true);
    g.lineStyle(2.5, 0x1d1830, 1);
    g.strokePoints(pts, true);
  });
  gfx("straw", 24, 8, (g) => {
    g.lineStyle(5, 0x1d1830, 1);
    g.lineBetween(3, 4, 21, 4);
    g.lineStyle(2.4, 0xffffff, 1);
    g.lineBetween(3, 4, 21, 4);
  });
}

export class FortView {
  private kind: (typeof KINDS)[string];
  private settling = false;

  constructor(
    private scene: Phaser.Scene,
    readonly prop: Prop,
    readonly fort: Fort,
    private reduced: boolean,
  ) {
    this.kind = KINDS[prop.def.key] ?? KINDS["fort-chairs"];
  }

  private get img() {
    return this.prop.img;
  }

  private shape() {
    const f = this.fort;
    const half = Math.floor(f.max / 2);
    const lean = this.kind.lean;
    const stage = fortStage(f);
    if (stage === 0) {
      const k = (f.max - f.hp) / Math.max(1, f.max - half);
      return { angle: lean * 1.6 * k, sx: 1 + 0.02 * k, sy: 1 - 0.045 * k };
    }
    if (stage === 1) {
      const k = (half - f.hp) / Math.max(1, half - 1);
      return { angle: lean * (1.5 + 2.5 * k), sx: 1.02 + 0.02 * k, sy: 0.98 - 0.05 * k };
    }
    return { angle: 0, sx: 1, sy: 1 };
  }

  private rest() {
    const b = this.prop.base;
    const s = this.shape();
    this.img.setPosition(b.x, b.y).setAngle(b.angle + s.angle).setScale(b.sx * s.sx, b.sy * s.sy);
  }

  wiggle(delay: number, sfx: Sfx) {
    if (this.reduced) return;
    const b = this.prop.base;
    this.scene.time.delayedCall(delay, () => {
      if (this.fort.hp < this.fort.max) return;
      this.scene.tweens.add({ targets: this.img, angle: { from: b.angle + 3 * this.kind.lean, to: b.angle }, duration: 520, ease: "Elastic.easeOut", easeParams: [1.1, 0.35] });
      sfx(SOUNDS[this.kind.material].hit, 0.35);
    });
  }

  hit(dir: number, sfx: Sfx) {
    sfx(SOUNDS[this.kind.material].hit, 0.6);
    this.bits(this.reduced ? 2 : 4, dir, 1);
    if (this.reduced) {
      this.rest();
      return;
    }
    const b = this.prop.base;
    const s = this.shape();
    this.scene.tweens.killTweensOf(this.img);
    this.settling = false;
    this.scene.tweens.add({
      targets: this.img,
      x: { from: b.x + dir * 5, to: b.x },
      angle: { from: b.angle + s.angle + dir * 3, to: b.angle + s.angle },
      scaleY: { from: b.sy * s.sy * 0.95, to: b.sy * s.sy },
      scaleX: b.sx * s.sx,
      duration: 240,
      ease: "Elastic.easeOut",
      easeParams: [1.1, 0.4],
    });
  }

  sag(dir: number, sfx: Sfx) {
    this.prop.setStage(1);
    sfx(SOUNDS[this.kind.material].sag, 0.85);
    this.bits(this.reduced ? 3 : 6, dir, 1.2);
    if (this.reduced) {
      this.rest();
      return;
    }
    this.puff(0);
    const b = this.prop.base;
    const s = this.shape();
    this.scene.tweens.killTweensOf(this.img);
    this.settling = true;
    this.img.setPosition(b.x, b.y).setScale(b.sx * s.sx * 1.07, b.sy * s.sy * 0.82).setAngle(b.angle + s.angle + dir * 6);
    this.scene.tweens.add({
      targets: this.img,
      scaleX: b.sx * s.sx,
      scaleY: b.sy * s.sy,
      angle: b.angle + s.angle,
      duration: 360,
      ease: "Elastic.easeOut",
      easeParams: [1.2, 0.35],
      onComplete: () => (this.settling = false),
    });
  }

  collapse(dir: number, sfx: Sfx) {
    const m = this.kind.material;
    sfx(SOUNDS[m].down, 1);
    if (m === "cardboard") sfx("thud", 0.6);
    this.scene.tweens.killTweensOf(this.img);
    if (this.reduced) {
      this.prop.setStage(2);
      this.rest();
      this.bits(4, dir, 1.4);
      return;
    }
    const b = this.prop.base;
    this.settling = true;
    const first =
      m === "brooms"
        ? { angle: b.angle + dir * 18, scaleY: b.sy * 0.86, scaleX: b.sx, duration: 170 }
        : m === "cardboard"
          ? { angle: b.angle - dir * 4, scaleY: b.sy * 0.55, scaleX: b.sx * 1.14, duration: 130 }
          : { angle: b.angle + dir * 3, scaleY: b.sy * 0.7, scaleX: b.sx * 1.08, duration: 150 };
    this.img.setPosition(b.x, b.y);
    this.scene.tweens.chain({
      targets: this.img,
      tweens: [
        { ...first, ease: "Quad.easeIn" },
        {
          angle: b.angle,
          scaleX: { from: b.sx * 1.1, to: b.sx },
          scaleY: { from: b.sy * 0.72, to: b.sy },
          duration: 300,
          ease: "Back.easeOut",
          onStart: () => {
            this.prop.setStage(2);
            this.bits(m === "cloth" ? 7 : 8, dir, 1.6);
            this.debris(dir);
            this.puff(-1);
            this.puff(1);
          },
        },
      ],
      onComplete: () => (this.settling = false),
    });
  }

  update(t: number) {
    if (this.reduced || this.settling || this.fort.hp !== 1 || this.scene.tweens.isTweening(this.img)) return;
    const b = this.prop.base;
    const s = this.shape();
    this.img.setAngle(b.angle + s.angle + Math.sin(t / 55) * 0.9 + Math.sin(t / 23) * 0.35);
  }

  private origin() {
    const img = this.img;
    const top = img.y - this.kind.top;
    return { x: img.x, y: top, w: img.displayWidth * 0.32 };
  }

  private bits(count: number, dir: number, power: number) {
    const o = this.origin();
    const keys = BITS[this.kind.material];
    const depth = this.img.depth + 0.5;
    for (let i = 0; i < count; i += 1) {
      const key = keys[i % keys.length];
      const tint = this.kind.tints[i % this.kind.tints.length];
      const x = o.x + Phaser.Math.FloatBetween(-o.w, o.w);
      const y = o.y + Phaser.Math.FloatBetween(-20, 40);
      const bit = this.scene.add.image(x, y, key).setTint(key === "straw" ? 0xe8c25a : tint).setDepth(depth).setScale(Phaser.Math.FloatBetween(0.7, 1)).setAngle(Phaser.Math.Between(0, 360));
      if (this.reduced) {
        this.scene.time.delayedCall(220, () => bit.destroy());
        continue;
      }
      const vx = (dir * Phaser.Math.FloatBetween(20, 80) + Phaser.Math.FloatBetween(-30, 30)) * power;
      const rise = Phaser.Math.FloatBetween(30, 70) * power;
      const fall = Phaser.Math.FloatBetween(70, 130);
      const life = Phaser.Math.Between(420, 580);
      this.scene.tweens.add({ targets: bit, x: x + vx, angle: bit.angle + Phaser.Math.Between(-200, 200), duration: life });
      this.scene.tweens.chain({
        targets: bit,
        tweens: [
          { y: y - rise, duration: life * 0.35, ease: "Quad.easeOut" },
          { y: y - rise + fall, alpha: 0, duration: life * 0.65, ease: "Quad.easeIn" },
        ],
        onComplete: () => bit.destroy(),
      });
    }
  }

  private debris(dir: number) {
    const m = this.kind.material;
    if (m === "cloth") return;
    const img = this.img;
    const key = m === "brooms" ? "straw" : "chip";
    for (let i = 0; i < 3; i += 1) {
      const side = i === 1 ? -dir : dir;
      const x = img.x + Phaser.Math.FloatBetween(-40, 40);
      const y = img.y - 30;
      const piece = this.scene.add.image(x, y, key).setTint(m === "brooms" ? 0xc9935a : this.kind.tints[i % 2]).setScale(m === "brooms" ? 2.2 : 1.6).setDepth(img.depth + 0.4);
      const lx = x + side * Phaser.Math.FloatBetween(50, 110);
      const ly = img.y - Phaser.Math.FloatBetween(0, 14);
      this.scene.tweens.add({ targets: piece, x: lx, angle: side * Phaser.Math.Between(120, 260), duration: 420, ease: "Quad.easeOut" });
      this.scene.tweens.chain({
        targets: piece,
        tweens: [
          { y: y - 40, duration: 150, ease: "Quad.easeOut" },
          { y: ly, duration: 270, ease: "Bounce.easeOut" },
          { alpha: 0, delay: 120, duration: 220 },
        ],
        onComplete: () => piece.destroy(),
      });
    }
  }

  private puff(side: number) {
    const img = this.img;
    const x = img.x + side * img.displayWidth * 0.3;
    const y = img.y - 6;
    const d = this.scene.add.image(x, y, "dust").setDepth(img.depth + 0.6).setScale(0.5).setAlpha(0.75).setTint(0xe8ddd0);
    this.scene.tweens.add({ targets: d, x: x + side * 40, y: y - 18, scale: 0.9, alpha: 0, duration: 480, ease: "Quad.easeOut", onComplete: () => d.destroy() });
  }
}
