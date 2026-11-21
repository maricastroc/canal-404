import * as Phaser from "phaser";
import type { LightDef } from "./decor";
import type { Layout } from "./layout";

const GLOW = "pb-glow";
const SOFT = "pb-soft-tile";

export type DynamicLight = { x: number; y: number; r: number; strength: number };

export type LitTile = { x: number; y: number };

function ensureTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists(GLOW)) {
    const tex = scene.textures.createCanvas(GLOW, 256, 256);
    if (tex) {
      const ctx = tex.getContext();
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.45, "rgba(255,255,255,0.65)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      tex.refresh();
    }
  }
  if (!scene.textures.exists(SOFT)) {
    const tex = scene.textures.createCanvas(SOFT, 128, 128);
    if (tex) {
      const ctx = tex.getContext();
      for (let i = 0; i < 14; i += 1) {
        ctx.fillStyle = `rgba(255,255,255,${0.09})`;
        const inset = i * 2;
        ctx.beginPath();
        ctx.roundRect(inset, inset, 128 - inset * 2, 128 - inset * 2, 18);
        ctx.fill();
      }
      tex.refresh();
    }
  }
}

export class NightLighting {
  private rt: Phaser.GameObjects.RenderTexture;
  private glow: Phaser.GameObjects.Image;
  private soft: Phaser.GameObjects.Image;
  private shape: Phaser.GameObjects.Graphics;
  private tints: Phaser.GameObjects.GameObject[] = [];
  private flickers: { img: Phaser.GameObjects.Image; base: number }[] = [];
  private lamps = new Map<string, Phaser.GameObjects.Image>();
  private dynamic: DynamicLight[] = [];
  private lit: LitTile[] = [];
  private flickerPhase = 1;

  constructor(
    private scene: Phaser.Scene,
    private layout: Layout,
    private lights: LightDef[],
    private darkness: number,
    lamps: { owner: string; x: number; y: number }[],
  ) {
    ensureTextures(scene);
    const b = layout.board;
    this.rt = scene.add.renderTexture(b.x, b.y, b.w, b.h).setOrigin(0).setDepth(6);
    this.glow = scene.make.image({ key: GLOW, add: false });
    this.soft = scene.make.image({ key: SOFT, add: false });
    this.shape = scene.make.graphics({}, false);
    const s = layout.tile;
    for (const l of lights) {
      if (l.kind === "glow") {
        const img = scene.add
          .image(layout.ox + l.x * s, layout.oy + l.y * s, GLOW)
          .setTint(l.color)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(l.strength * 0.45)
          .setScale((l.r * s * 2) / 256)
          .setDepth(6.5);
        this.tints.push(img);
        if (l.flicker) this.flickers.push({ img, base: l.strength * 0.45 });
      } else if (l.kind === "shaft") {
        const g = scene.add.graphics().setDepth(6.5).setBlendMode(Phaser.BlendModes.ADD);
        g.fillStyle(l.color, l.strength * 0.16);
        g.fillPoints(this.shaftPoints(l, 0, 0), true);
        this.tints.push(g);
      } else {
        const g = scene.add.graphics().setDepth(6.6).setBlendMode(Phaser.BlendModes.ADD);
        g.fillStyle(l.color, 0.85);
        g.fillRect(layout.ox + l.x * s, layout.oy + l.y * s - 3, l.w * s, 6);
        g.fillStyle(l.color, 0.12);
        g.fillEllipse(layout.ox + (l.x + l.w / 2) * s, layout.oy + l.y * s + s * 0.08, l.w * s * 1.1, s * 0.22);
        this.tints.push(g);
      }
    }
    for (const lamp of lamps) {
      const img = scene.add
        .image(layout.ox + lamp.x * s, layout.oy + lamp.y * s, GLOW)
        .setTint(0xffc86b)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0)
        .setScale((2.2 * s * 2) / 256)
        .setDepth(6.6);
      this.lamps.set(lamp.owner, img);
    }
  }

  private shaftPoints(l: Extract<LightDef, { kind: "shaft" }>, dx: number, dy: number) {
    const s = this.layout.tile;
    const X = (v: number) => this.layout.ox + v * s - dx;
    const Y = (v: number) => this.layout.oy + v * s - dy;
    return [
      { x: X(l.top[0]), y: Y(l.top[2]) },
      { x: X(l.top[1]), y: Y(l.top[2]) },
      { x: X(l.bottom[1]), y: Y(l.bottom[2]) },
      { x: X(l.bottom[0]), y: Y(l.bottom[2]) },
    ];
  }

  hasFlicker() {
    return this.flickers.length > 0;
  }

  lampPosition(owner: string) {
    const img = this.lamps.get(owner);
    return img ? { x: img.x, y: img.y } : null;
  }

  setLamp(owner: string, on: boolean) {
    const img = this.lamps.get(owner);
    if (!img) return;
    this.scene.tweens.killTweensOf(img);
    this.scene.tweens.add({ targets: img, alpha: on ? 0.75 : 0, duration: on ? 140 : 500 });
  }

  flicker() {
    this.flickerPhase = 0.82 + Math.random() * 0.28;
    for (const f of this.flickers) f.img.setAlpha(f.base * this.flickerPhase);
    this.render(this.dynamic, this.lit);
  }

  render(dynamic: DynamicLight[], lit: LitTile[]) {
    this.dynamic = dynamic;
    this.lit = lit;
    const rt = this.rt;
    const b = this.layout.board;
    const s = this.layout.tile;
    rt.clear();
    rt.fill(0x0b0822, this.darkness);
    for (const l of this.lights) {
      if (l.kind === "glow") {
        const strength = l.flicker ? l.strength * this.flickerPhase : l.strength;
        this.glow.setScale((l.r * s * 2) / 256).setAlpha(Math.min(1, strength)).setPosition(this.layout.ox + l.x * s - b.x, this.layout.oy + l.y * s - b.y);
        rt.erase(this.glow);
      } else if (l.kind === "shaft") {
        this.shape.clear();
        this.shape.fillStyle(0xffffff, l.strength);
        this.shape.fillPoints(this.shaftPoints(l, b.x, b.y), true);
        rt.erase(this.shape);
      }
    }
    for (const d of dynamic) {
      this.glow.setScale((d.r * 2) / 256).setAlpha(d.strength).setPosition(d.x - b.x, d.y - b.y);
      rt.erase(this.glow);
    }
    this.soft.setScale((s * 1.1) / 128).setAlpha(0.85);
    for (const t of lit) {
      this.soft.setPosition(this.layout.ox + (t.x + 0.5) * s - b.x, this.layout.oy + (t.y + 0.5) * s - b.y);
      this.rt.erase(this.soft);
    }
  }
}
