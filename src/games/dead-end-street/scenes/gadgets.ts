import * as Phaser from "phaser";
import { GROUND_Y } from "../config";
import type { SimBlower, SimFaucet, SimRope, StreetSim } from "../sim";
import type { Fx } from "./fx";
import { INK_HEX } from "./ui";

type Streak = { x: number; y: number; len: number; speed: number; life: number };

type Snapped = { x1: number; y1: number; x2: number; y2: number; born: number };

const WATER = 0x5cb9f0;
const ROPE = 0xc9a26b;

export class GadgetView {
  private ropeGfx: Phaser.GameObjects.Graphics;
  private hoseGfx: Phaser.GameObjects.Graphics;
  private streamGfx: Phaser.GameObjects.Graphics;
  private windGfx: Phaser.GameObjects.Graphics;
  private streaks = new Map<SimBlower, Streak[]>();
  private snapped: Snapped[] = [];
  private lastDrops = 0;

  constructor(
    private scene: Phaser.Scene,
    private sim: StreetSim,
    private fx: Fx,
    private reduced: boolean,
  ) {
    this.ropeGfx = scene.add.graphics().setDepth(4.1);
    this.hoseGfx = scene.add.graphics().setDepth(4.15);
    this.streamGfx = scene.add.graphics().setDepth(5.6);
    this.windGfx = scene.add.graphics().setDepth(5.7);
    for (const f of sim.faucets) this.drawHose(f);
    for (const b of sim.blowers) {
      const z = b.def.zone;
      this.streaks.set(
        b,
        Array.from({ length: reduced ? 6 : 16 }, (_, i) => ({
          x: z.x + ((i * 97) % z.w),
          y: z.y + ((i * 61) % z.h),
          len: 40 + ((i * 13) % 50),
          speed: 9 + (i % 5),
          life: (i * 7) % 30,
        })),
      );
    }
  }

  private drawHose(f: SimFaucet) {
    const g = this.hoseGfx;
    const sx = f.body.position.x;
    const sy = f.body.position.y + 10;
    const nx = f.def.nozzle.x;
    const ny = f.def.nozzle.y;
    const pts = [
      new Phaser.Math.Vector2(sx, sy),
      new Phaser.Math.Vector2(sx + 6, GROUND_Y - 8),
      new Phaser.Math.Vector2((sx + nx) / 2, GROUND_Y - 2),
      new Phaser.Math.Vector2(nx + 14, GROUND_Y - 8),
      new Phaser.Math.Vector2(nx, ny),
    ];
    const curve = new Phaser.Curves.Spline(pts);
    g.lineStyle(13, INK_HEX, 1);
    curve.draw(g, 48);
    g.lineStyle(7, 0x4c9a43, 1);
    curve.draw(g, 48);
    this.scene.add.image(nx, ny - 4, "sprinkler").setDepth(4.3);
  }

  snapRope(rope: SimRope) {
    const e = this.sim.ropeEnds(rope);
    this.snapped.push({ x1: e.ax, y1: e.ay, x2: e.bx, y2: e.by, born: this.scene.time.now });
  }

  private drawRopes() {
    const g = this.ropeGfx;
    g.clear();
    for (const rope of this.sim.ropes) {
      const { ax, ay, bx, by } = this.sim.ropeEnds(rope);
      g.fillStyle(INK_HEX, 1);
      g.fillCircle(ax, ay, 7);
      g.fillStyle(0x9aa6b8, 1);
      g.fillCircle(ax, ay, 4);
      if (rope.cut) continue;
      g.lineStyle(8, INK_HEX, 1);
      g.lineBetween(ax, ay, bx, by);
      g.lineStyle(4, ROPE, 1);
      g.lineBetween(ax, ay, bx, by);
    }
    const now = this.scene.time.now;
    this.snapped = this.snapped.filter((s) => now - s.born < 900);
    for (const s of this.snapped) {
      const k = (now - s.born) / 900;
      const len = Math.sqrt((s.x2 - s.x1) ** 2 + (s.y2 - s.y1) ** 2);
      const hang = Math.min(len * 0.35, 60);
      const alpha = 1 - k;
      g.lineStyle(8, INK_HEX, alpha);
      g.lineBetween(s.x1, s.y1, s.x1 + Math.sin(k * 6) * 10, s.y1 + hang);
      g.lineStyle(4, ROPE, alpha);
      g.lineBetween(s.x1, s.y1, s.x1 + Math.sin(k * 6) * 10, s.y1 + hang);
    }
  }

  private drawStreams(time: number) {
    const g = this.streamGfx;
    g.clear();
    for (const f of this.sim.faucets) {
      if (!f.on) continue;
      const { nozzle, stream } = f.def;
      const tx = stream.x + stream.w / 2;
      const ty = stream.y + stream.h * 0.35;
      for (let k = 0; k < 3; k += 1) {
        const ex = tx + (k - 1) * stream.w * 0.3;
        const peak = Math.min(nozzle.y, ty) - 90 - k * 20;
        const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(nozzle.x, nozzle.y - 14), new Phaser.Math.Vector2((nozzle.x + ex) / 2, peak), new Phaser.Math.Vector2(ex, ty));
        const pts = curve.getPoints(18);
        const off = Math.floor(time / 60 + k) % 2;
        for (let i = off; i < pts.length - 1; i += 2) {
          g.lineStyle(10, INK_HEX, 0.85);
          g.lineBetween(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
          g.lineStyle(6, WATER, 1);
          g.lineBetween(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
        }
      }
      if (time - this.lastDrops > (this.reduced ? 400 : 140)) {
        this.lastDrops = time;
        this.fx.burst(this.fx.drops, 3, tx, ty);
      }
    }
  }

  private drawWind(dt: number) {
    const g = this.windGfx;
    g.clear();
    for (const [blower, streaks] of this.streaks) {
      if (!blower.on) continue;
      const z = blower.def.zone;
      for (const s of streaks) {
        s.x += blower.dir * s.speed * dt;
        s.life += dt;
        if (s.x < z.x - s.len || s.x > z.x + z.w + s.len) {
          s.x = blower.dir < 0 ? z.x + z.w : z.x;
          s.y = z.y + Phaser.Math.Between(10, Math.max(11, z.h - 10));
          s.life = 0;
        }
        const alpha = Math.min(1, s.life / 8) * 0.55;
        g.lineStyle(5, 0xffffff, alpha);
        g.lineBetween(s.x, s.y, s.x - blower.dir * s.len, s.y);
        g.lineStyle(2, 0xa9dcf7, alpha);
        g.lineBetween(s.x, s.y + 6, s.x - blower.dir * s.len * 0.6, s.y + 6);
      }
    }
  }

  update(time: number, delta: number) {
    this.drawRopes();
    this.drawStreams(time);
    this.drawWind(Math.min(delta, 50) / (1000 / 60));
  }
}
