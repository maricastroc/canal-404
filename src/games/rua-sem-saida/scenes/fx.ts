import * as Phaser from "phaser";
import { H, W, type ProjectileId } from "../config";
import { cartoonText, type Fonts } from "./ui";

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

const SAFE = { left: 110, right: W - 110, top: 240, bottom: H - 190 };

export class Fx {
  stars: Emitter;
  puff: Emitter;
  drops: Emitter;
  feathers: Emitter;
  splinters: Emitter;
  sparks: Emitter;
  letters: Emitter;
  junk: Emitter[];
  stink: Emitter;
  private trails: Record<ProjectileId, Emitter>;
  private activeTrail: Emitter | null = null;
  private lastWord = 0;
  private labels: { x: number; y: number; w: number; h: number; until: number }[] = [];
  private flashRect: Phaser.GameObjects.Rectangle;
  scale = 1;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    private reduced: boolean,
  ) {
    const add = (tex: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig, depth = 12) =>
      scene.add.particles(0, 0, tex, { emitting: false, ...config }).setDepth(depth);
    this.stars = add("star", {
      speed: { min: 240, max: 600 },
      angle: { min: 200, max: 340 },
      scale: { start: 1.05, end: 0.2 },
      rotate: { min: 0, max: 360 },
      gravityY: 900,
      lifespan: reduced ? 380 : 700,
    });
    this.puff = add("puff", {
      speed: { min: 50, max: 190 },
      scale: { start: 0.45, end: 1.25 },
      alpha: { start: 0.95, end: 0 },
      lifespan: 560,
    });
    this.drops = add("drop", {
      speed: { min: 280, max: 720 },
      angle: { min: 190, max: 350 },
      scale: { min: 0.7, max: 1.3 },
      gravityY: 1350,
      lifespan: 900,
    });
    this.feathers = add("feather", {
      speed: { min: 80, max: 300 },
      angle: { min: 200, max: 340 },
      rotate: { min: -180, max: 180 },
      gravityY: 200,
      lifespan: 1500,
      alpha: { start: 1, end: 0 },
    });
    this.splinters = add("splinter", {
      speed: { min: 220, max: 520 },
      angle: { min: 200, max: 340 },
      rotate: { min: 0, max: 360 },
      gravityY: 1000,
      lifespan: 800,
    });
    this.sparks = add("spark", {
      speed: { min: 120, max: 380 },
      scale: { start: 1.1, end: 0 },
      rotate: { min: 0, max: 180 },
      lifespan: 480,
    });
    this.letters = add("letter", {
      speed: { min: 160, max: 420 },
      angle: { min: 210, max: 330 },
      rotate: { min: -200, max: 200 },
      gravityY: 380,
      lifespan: 1600,
      alpha: { start: 1, end: 0.2 },
    });
    this.junk = ["junk-banana", "junk-fish", "junk-can"].map((tex) =>
      add(tex, {
        speed: { min: 260, max: 520 },
        angle: { min: 230, max: 310 },
        rotate: { min: -360, max: 360 },
        gravityY: 1300,
        lifespan: 1100,
      }),
    );
    this.stink = add("puff", {
      speed: { min: 20, max: 60 },
      scale: { start: 0.3, end: 0.7 },
      alpha: { start: 0.85, end: 0 },
      tint: 0xa8e07a,
      lifespan: 700,
    });
    const trail = (tex: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig) =>
      add(tex, { frequency: reduced ? 140 : 55, quantity: 1, ...config }, 7);
    this.trails = {
      tenis: trail("puff", { scale: { start: 0.22, end: 0.55 }, alpha: { start: 0.8, end: 0 }, tint: 0xa8e07a, lifespan: 520, speed: { min: 5, max: 30 } }),
      balao: trail("drop", { scale: { start: 0.7, end: 0.3 }, gravityY: 900, lifespan: 520, speed: { min: 10, max: 60 }, angle: { min: 60, max: 120 } }),
      pneu: trail("puff", { scale: { start: 0.3, end: 0.8 }, alpha: { start: 0.55, end: 0 }, lifespan: 420, speed: { min: 5, max: 20 } }),
      pato: trail("spark", { scale: { start: 0.8, end: 0 }, lifespan: 420, speed: { min: 10, max: 50 } }),
    };
    this.flashRect = scene.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(19);
  }

  startTrail(id: ProjectileId, target: Phaser.GameObjects.GameObject & { x: number; y: number }) {
    this.stopTrail();
    const emitter = this.trails[id];
    emitter.startFollow(target);
    emitter.start();
    this.activeTrail = emitter;
  }

  stopTrail() {
    if (!this.activeTrail) return;
    this.activeTrail.stop();
    this.activeTrail.stopFollow();
    this.activeTrail = null;
  }

  burst(emitter: Emitter, count: number, x: number, y: number) {
    emitter.explode(this.reduced ? Math.max(1, Math.round(count / 2)) : count, x, y);
  }

  ring(x: number, y: number, color = 0xffffff, radius = 90) {
    const g = this.scene.add.graphics().setDepth(12);
    const state = { r: 12, a: 1 };
    this.scene.tweens.add({
      targets: state,
      r: radius,
      a: 0,
      duration: 280,
      ease: "Cubic.easeOut",
      onUpdate: () => {
        g.clear();
        g.lineStyle(10 * state.a + 2, 0x1d1830, state.a);
        g.strokeCircle(x, y, state.r);
        g.lineStyle(6 * state.a + 1, color, state.a);
        g.strokeCircle(x, y, state.r);
      },
      onComplete: () => g.destroy(),
    });
  }

  flash(amount = 0.35) {
    if (this.reduced) return;
    this.scene.tweens.killTweensOf(this.flashRect);
    this.flashRect.setFillStyle(0xffffff, amount);
    this.scene.tweens.add({ targets: this.flashRect, fillAlpha: 0, duration: 200, ease: "Quad.easeOut" });
  }

  private clampPoint(x: number, y: number) {
    return { x: Phaser.Math.Clamp(x, SAFE.left, SAFE.right), y: Phaser.Math.Clamp(y, SAFE.top, SAFE.bottom) };
  }

  private place(x: number, y: number, w: number, h: number, life: number) {
    const now = this.scene.time.now;
    this.labels = this.labels.filter((l) => l.until > now);
    let py = y;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const hit = this.labels.find((l) => Math.abs(l.x - x) < (l.w + w) / 2 + 12 && Math.abs(l.y - py) < (l.h + h) / 2 + 8);
      if (!hit) break;
      py = hit.y - (hit.h + h) / 2 - 10;
    }
    py = Math.max(SAFE.top - 60, py);
    this.labels.push({ x, y: py, w, h, until: now + life });
    return py;
  }

  word(text: string, x: number, y: number, color: string, size = 76, force = false) {
    const now = this.scene.time.now;
    if (!force && now - this.lastWord < 360) return;
    this.lastWord = now;
    const p = this.clampPoint(x, y);
    const s = Math.min(this.scale, 1.5);
    const t = cartoonText(this.scene, p.x, p.y, text, { size: Math.round(size * s), color, font: this.fonts.display, stroke: 0.22 })
      .setOrigin(0.5)
      .setDepth(13)
      .setAngle(Phaser.Math.Between(-10, 10))
      .setScale(0.3);
    t.y = this.place(t.x, t.y, t.width, t.height * 0.8, 760);
    this.scene.tweens.add({ targets: t, scale: 1, duration: 170, ease: "Back.easeOut" });
    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      y: t.y - 36,
      delay: 480,
      duration: 260,
      onComplete: () => t.destroy(),
    });
  }

  popup(text: string, x: number, y: number, color: string, size = 56, sub?: string) {
    const p = this.clampPoint(x, y);
    const s = Math.min(this.scale, 1.5);
    const t = cartoonText(this.scene, 0, 0, text, { size: Math.round(size * s), color, font: this.fonts.display, stroke: 0.22 }).setOrigin(0.5);
    const parts: Phaser.GameObjects.GameObject[] = [t];
    if (sub) {
      const st = cartoonText(this.scene, 0, size * s * 0.72, sub, {
        size: Math.round(size * 0.46 * s),
        color: "#fbf5e6",
        font: this.fonts.display,
        stroke: 0.24,
      }).setOrigin(0.5);
      parts.push(st);
    }
    const bounds = { w: t.width, h: t.height * 0.8 + (sub ? size * s * 0.5 : 0) };
    const py = this.place(p.x, p.y, bounds.w, bounds.h, 900);
    const c = this.scene.add.container(p.x, py, parts).setDepth(14).setScale(0.4);
    this.scene.tweens.add({ targets: c, scale: { from: 0.4, to: 1 }, duration: 220, ease: "Back.easeOut" });
    this.scene.tweens.add({
      targets: c,
      y: py - 70,
      alpha: { from: 1, to: 0 },
      delay: 520,
      duration: 420,
      ease: "Cubic.easeIn",
      onComplete: () => c.destroy(),
    });
  }
}
