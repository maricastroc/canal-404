import * as Phaser from "phaser";
import type { BandMember, RoundId } from "../song/notation";
import { FEET } from "./figure";
import { C, MEMBER_COLOR } from "./lane";
import type { Layout } from "./layout";

export type LightMode = "rest" | "live" | "cut" | "finale";

export type LightFrame = {
  dt: number;
  beat: number;
  moving: boolean;
  mode: LightMode;
  mood: number;
  lost: boolean;
  featured: BandMember;
};

type Look = { colors: number[]; beams: number; sweep: number; beam: number; wall: number; halo: number; bulbs: number; sign: number; breathe: boolean };

const LOOKS: Record<RoundId, Look> = {
  heats: { colors: [C.sunPale, C.cream], beams: 2, sweep: 0.05, beam: 0.08, wall: 0.07, halo: 0.16, bulbs: 0.82, sign: 0.14, breathe: false },
  semifinal: { colors: [C.bubblegum, C.sky, C.sunPale], beams: 4, sweep: 0.1, beam: 0.12, wall: 0.13, halo: 0.2, bulbs: 0.9, sign: 0.26, breathe: false },
  final: { colors: [C.sun, C.bubblegum, C.sky, C.mint, C.tangerine], beams: 6, sweep: 0.15, beam: 0.17, wall: 0.2, halo: 0.28, bulbs: 1, sign: 0.42, breathe: true },
};

const BEAM_KEY = "stage-beam";
const GLOW_KEY = "stage-glow";
const BEAM_W = 128;
const BEAM_H = 256;
const GLOW_R = 64;
const STAGE_W = 1080;
const LEVEL: Record<LightMode, number> = { rest: 0.7, live: 1, cut: 0.3, finale: 1.1 };
const BULB_OFF = 0x8d7350;
const BULB_ON = 0xffe39a;

type Rig = { x: number; y: number; base: number; length: number; width: number };
type Beam = { img: Phaser.GameObjects.Image; rig: Rig; rgb: [number, number, number]; phase: number };
type Glow = { img: Phaser.GameObjects.Image; rgb: [number, number, number] };
type Cue = { kind: "chase" | "pulse"; from: number; beats: number; laps: number };

function smooth(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function rgbOf(color: number): [number, number, number] {
  return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
}

function ease(rgb: [number, number, number], target: number, k: number) {
  const t = rgbOf(target);
  for (let i = 0; i < 3; i += 1) rgb[i] += (t[i] - rgb[i]) * k;
  return (Math.round(rgb[0]) << 16) | (Math.round(rgb[1]) << 8) | Math.round(rgb[2]);
}

function mix(a: number, b: number, k: number) {
  const x = rgbOf(a);
  const y = rgbOf(b);
  return (Math.round(x[0] + (y[0] - x[0]) * k) << 16) | (Math.round(x[1] + (y[1] - x[1]) * k) << 8) | Math.round(x[2] + (y[2] - x[2]) * k);
}

function makeTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists(BEAM_KEY)) {
    const tex = scene.textures.createCanvas(BEAM_KEY, BEAM_W, BEAM_H);
    if (tex) {
      const ctx = tex.getContext();
      const img = ctx.createImageData(BEAM_W, BEAM_H);
      for (let y = 0; y < BEAM_H; y += 1) {
        const v = y / (BEAM_H - 1);
        const hw = 0.08 + 0.92 * v;
        const along = Math.min(1, v * 14) * Math.pow(1 - v * 0.82, 1.5);
        for (let x = 0; x < BEAM_W; x += 1) {
          const u = Math.abs(x + 0.5 - BEAM_W / 2) / (BEAM_W / 2);
          const a = (1 - smooth(hw * 0.45, hw, u)) * along;
          const i = (y * BEAM_W + x) * 4;
          img.data[i] = 255;
          img.data[i + 1] = 255;
          img.data[i + 2] = 255;
          img.data[i + 3] = Math.round(a * 255);
        }
      }
      ctx.putImageData(img, 0, 0);
      tex.refresh();
    }
  }
  if (!scene.textures.exists(GLOW_KEY)) {
    const tex = scene.textures.createCanvas(GLOW_KEY, GLOW_R * 2, GLOW_R * 2);
    if (tex) {
      const ctx = tex.getContext();
      const g = ctx.createRadialGradient(GLOW_R, GLOW_R, 0, GLOW_R, GLOW_R, GLOW_R);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.35, "rgba(255,255,255,0.62)");
      g.addColorStop(0.7, "rgba(255,255,255,0.18)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, GLOW_R * 2, GLOW_R * 2);
      tex.refresh();
    }
  }
}

function rigsFor(L: Layout): Rig[] {
  const floor = L.stage.front;
  const center = L.performer.x;
  const aim = (x: number, y: number, pull: number, spread: number): Rig => {
    const tx = x + (center - x) * pull;
    const dx = tx - x;
    const dy = floor - y;
    const length = Math.hypot(dx, dy) * 1.04;
    return { x, y, base: Math.atan2(dy, dx) - Math.PI / 2, length, width: length * spread };
  };
  if (L.truss) {
    const y = L.truss.y + 62 * L.art.k;
    const order = [0, 5, 3, 4, 1, 2];
    return order.map((i) => aim(L.truss!.xs[i], y, i === 1 || i === 2 ? 0.12 : 0.32, 0.5));
  }
  const [a, b] = L.spots;
  const top = L.kind === "phone" ? 64 : L.valance + 34;
  const inner = [0.3, 0.7, 0.42, 0.58].map((f) => L.art.x + STAGE_W * f * L.art.k);
  return [aim(a.x, a.y, 0.4, 0.55), aim(b.x, b.y, 0.4, 0.55), ...inner.map((x) => aim(x, top, 0.25, 0.42))];
}

function wallSpots(L: Layout) {
  const { x, y, k } = L.art;
  const width = (L.truss ? 1920 : STAGE_W) * k;
  const top = y + (L.valance + 40) * k;
  const bottom = L.riser.top;
  const r = (bottom - top) * 0.75;
  return [0.3, 0.7].map((f) => ({ x: x + width * f, y: top + (bottom - top) * 0.55, r }));
}

export class StageLights {
  private look: Look = LOOKS.heats;
  private readonly beams: Beam[] = [];
  private readonly walls: Glow[] = [];
  private readonly halo: Glow;
  private readonly haloAt: { x: number; y: number; r: number };
  private readonly sign: { g: Phaser.GameObjects.Graphics; glow: Phaser.GameObjects.Image; bulbs: { x: number; y: number }[]; r: number } | null = null;
  private level = LEVEL.rest;
  private signLevel = 0;
  private bulbLevel = 1;
  private beamMix = 0;
  private cues: Cue[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly L: Layout,
    private readonly still: boolean,
    private readonly spotG: Phaser.GameObjects.Graphics,
  ) {
    makeTextures(scene);
    for (const [i, rig] of rigsFor(L).entries()) {
      const img = scene.add
        .image(rig.x, rig.y, BEAM_KEY)
        .setOrigin(0.5, 0)
        .setRotation(rig.base)
        .setScale(rig.width / BEAM_W, rig.length / BEAM_H)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(0.42)
        .setVisible(false);
      this.beams.push({ img, rig, rgb: rgbOf(C.sunPale), phase: i * 1.7 });
    }
    for (const spot of wallSpots(L)) {
      const img = scene.add.image(spot.x, spot.y, GLOW_KEY).setDisplaySize(spot.r * 2.6, spot.r * 1.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.3).setAlpha(0);
      this.walls.push({ img, rgb: rgbOf(C.sunPale) });
    }
    const p = L.performer;
    this.haloAt = { x: p.x, y: p.y - FEET * p.scale * 0.5, r: FEET * p.scale * 0.62 };
    this.halo = { img: scene.add.image(this.haloAt.x, this.haloAt.y, GLOW_KEY).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.45).setAlpha(0), rgb: rgbOf(C.sunPale) };
    this.halo.img.setDisplaySize(this.haloAt.r * 2, this.haloAt.r * 2.3);
    if (L.sign) {
      const { cx, cy, w, h } = L.sign;
      const k = w / 360;
      const x = cx - w / 2;
      const y = cy - h / 2;
      const step = 34 * k;
      const inset = 14 * k;
      const top: { x: number; y: number }[] = [];
      for (let bx = x + 20 * k; bx <= x + w - 20 * k + 0.01; bx += step) top.push({ x: bx, y: y + inset });
      const side: number[] = [];
      for (let by = y + inset + step; by <= y + h - inset - step / 2 + 0.01; by += step) side.push(by);
      const bulbs = [...top, ...side.map((by) => ({ x: x + w - inset, y: by })), ...top.map((b) => ({ x: b.x, y: y + h - inset })).reverse(), ...side.map((by) => ({ x: x + inset, y: by })).reverse()];
      const glow = scene.add.image(cx, cy, GLOW_KEY).setDisplaySize(w * 1.1, h * 1.2).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.48).setAlpha(0).setTint(C.sun);
      this.sign = { g: scene.add.graphics().setDepth(0.5), glow, bulbs, r: 7 * k };
    }
  }

  setRound(round: RoundId) {
    this.look = LOOKS[round];
  }

  cue(kind: Cue["kind"], from: number, beats: number, laps = 1) {
    this.cues = this.cues.filter((c) => c.kind !== kind);
    this.cues.push({ kind, from, beats, laps });
  }

  clear() {
    this.cues = [];
  }

  update(f: LightFrame) {
    const look = this.look;
    const k = 1 - Math.exp(-f.dt / 260);
    this.level += ((f.mode === "live" ? 0.82 + 0.18 * f.mood : LEVEL[f.mode]) - this.level) * k;
    const motion = !this.still && f.moving;
    const phase = ((f.beat % 1) + 1) % 1;
    const kick = motion ? Math.max(0, 1 - phase * 3) : 0;
    const phrase = Math.floor(Math.max(0, f.beat) / 16);
    const colors = look.colors;
    const sweepT = this.still ? 0 : f.beat;
    this.beamMix += ((f.mode === "cut" ? 0 : 1) - this.beamMix) * k;
    this.beams.forEach((beam, i) => {
      const on = i < look.beams;
      const target = colors[(i + phrase) % colors.length];
      const tint = ease(beam.rgb, f.mode === "cut" ? C.gray : target, 1 - Math.exp(-f.dt / 600));
      const finale = f.mode === "finale" && !this.still ? 1.6 : 1;
      const angle = beam.rig.base + look.sweep * finale * Math.sin((sweepT / 16) * Math.PI * 2 * finale + beam.phase);
      const alpha = on ? look.beam * this.level * this.beamMix * (1 + 0.22 * kick) : 0;
      const shown = beam.img.alpha + (alpha - beam.img.alpha) * k;
      beam.img.setRotation(angle).setTint(tint).setAlpha(shown).setVisible(shown > 0.004);
    });
    this.walls.forEach((wall, j) => {
      const target = colors[(j + phrase + 1) % colors.length];
      const tint = ease(wall.rgb, f.mode === "cut" ? C.gray : target, 1 - Math.exp(-f.dt / 900));
      const breathe = this.still ? 1 : 0.85 + 0.15 * Math.sin((f.beat / 8) * Math.PI + j * Math.PI);
      const alpha = look.wall * this.level * breathe;
      wall.img.setTint(tint).setAlpha(wall.img.alpha + (alpha - wall.img.alpha) * k);
    });
    const member = mix(MEMBER_COLOR[f.featured], 0xffffff, 0.45);
    const haloTint = ease(this.halo.rgb, member, 1 - Math.exp(-f.dt / 400));
    const haloAlpha = (f.mode === "cut" ? 0 : look.halo) * this.level * (1 + 0.18 * kick);
    this.halo.img.setTint(haloTint).setAlpha(this.halo.img.alpha + (haloAlpha - this.halo.img.alpha) * k);
    this.spotG.setAlpha(Math.min(1, this.level * (0.85 + 0.15 * kick)));
    this.updateSign(f, k);
  }

  private updateSign(f: LightFrame, k: number) {
    const sign = this.sign;
    if (!sign) return;
    const look = this.look;
    const n = sign.bulbs.length;
    let chaseHead = -1;
    let chaseOn = false;
    let pulse = 0;
    this.cues = this.cues.filter((c) => f.beat < c.from + c.beats);
    for (const c of this.cues) {
      const t = (f.beat - c.from) / c.beats;
      if (t < 0) continue;
      if (c.kind === "pulse") pulse = Math.max(pulse, Math.sin(Math.min(1, t * 4) * Math.PI * 0.5) * (1 - t));
      else if (!this.still) {
        chaseOn = true;
        chaseHead = t * n * c.laps;
      }
    }
    const dark = f.mode === "cut" ? 0.12 : f.lost ? 0.45 : 1;
    this.bulbLevel += (dark - this.bulbLevel) * k;
    const signTarget = (f.mode === "cut" || f.lost ? 0 : look.sign * this.level) + 0.55 * pulse;
    this.signLevel += (signTarget - this.signLevel) * (pulse > 0 ? 0.5 : k);
    sign.glow.setAlpha(Math.max(0, this.signLevel));
    const g = sign.g;
    g.clear();
    const breathe = look.breathe && !this.still && f.moving;
    for (let i = 0; i < n; i += 1) {
      let b = look.bulbs;
      if (breathe) b *= 0.78 + 0.22 * Math.cos(Math.PI * (f.beat + (i % 2)));
      if (chaseOn) {
        const half = n / 2;
        const d = (((chaseHead - i) % half) + half) % half;
        b = Math.max(b * 0.45, d < 3 ? 1 - d * 0.25 : 0);
      }
      b = Math.max(0, Math.min(1, b * this.bulbLevel + pulse * 0.3));
      const { x, y } = sign.bulbs[i];
      if (b > 0.55) g.fillStyle(BULB_ON, 0.22 * (b - 0.55) * 2.2).fillCircle(x, y, sign.r * 2.3);
      g.fillStyle(mix(BULB_OFF, BULB_ON, b), 1).fillCircle(x, y, sign.r);
      g.lineStyle(3 * (sign.r / 7), C.ink, 1).strokeCircle(x, y, sign.r);
    }
  }
}
