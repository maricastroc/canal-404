import type { SoundRecipe } from "@/lib/audio/types";

export const LUNCH_SFX = {
  throw: {
    layers: [
      { kind: "noise", duration: 0.18, gain: 0.12, attack: 0.01, filter: { type: "bandpass", from: 700, to: 2600, q: 1.2 } },
      { kind: "tone", wave: "sine", from: 320, to: 620, duration: 0.1, gain: 0.08 },
    ],
  },
  splat: {
    layers: [
      { kind: "noise", duration: 0.28, gain: 0.26, attack: 0.005, filter: { type: "lowpass", from: 2200, to: 260 } },
      { kind: "tone", wave: "sine", from: 220, to: 70, duration: 0.2, gain: 0.2 },
    ],
  },
  hit: {
    layers: [
      { kind: "noise", duration: 0.2, gain: 0.22, filter: { type: "lowpass", from: 1800, to: 300 } },
      { kind: "tone", wave: "triangle", from: 520, to: 260, duration: 0.16, gain: 0.16 },
      { kind: "tone", wave: "pulse", from: 988, duration: 0.07, delay: 0.08, gain: 0.08 },
      { kind: "tone", wave: "pulse", from: 1319, duration: 0.12, delay: 0.14, gain: 0.08 },
    ],
  },
  bonk: {
    layers: [
      { kind: "tone", wave: "triangle", from: 300, to: 140, duration: 0.18, gain: 0.2 },
      { kind: "noise", duration: 0.08, gain: 0.1, filter: { type: "bandpass", from: 1200, q: 2 } },
    ],
  },
  windup: {
    layers: [{ kind: "tone", wave: "sine", from: 500, to: 1200, duration: 0.45, gain: 0.07, glide: "linear", vibrato: { rate: 14, depth: 14 } }],
  },
  incoming: {
    layers: [{ kind: "tone", wave: "sine", from: 1400, to: 500, duration: 0.6, gain: 0.08, glide: "linear" }],
  },
  duck: {
    layers: [{ kind: "noise", duration: 0.14, gain: 0.08, filter: { type: "lowpass", from: 1600, to: 400 } }],
  },
  reload: {
    layers: [
      { kind: "tone", wave: "sine", from: 420, to: 760, duration: 0.07, gain: 0.12 },
      { kind: "noise", duration: 0.04, gain: 0.05, filter: { type: "highpass", from: 2400 } },
    ],
  },
  empty: {
    layers: [
      { kind: "tone", wave: "square", from: 220, to: 180, duration: 0.08, gain: 0.05, filter: { type: "lowpass", frequency: 900 } },
      { kind: "tone", wave: "square", from: 180, to: 150, duration: 0.1, delay: 0.09, gain: 0.05, filter: { type: "lowpass", frequency: 900 } },
    ],
  },
  phew: {
    layers: [{ kind: "noise", duration: 0.35, gain: 0.1, attack: 0.05, filter: { type: "bandpass", from: 1800, to: 500, q: 0.9 } }],
  },
  ouch: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 260, to: 120, duration: 0.4, gain: 0.08, filter: { type: "lowpass", frequency: 1200 }, vibrato: { rate: 9, depth: 10 } },
      { kind: "noise", duration: 0.3, gain: 0.18, filter: { type: "lowpass", from: 1600, to: 200 } },
    ],
  },
  honk: {
    layers: [
      { kind: "tone", wave: "square", from: 660, to: 560, duration: 0.14, gain: 0.07, filter: { type: "lowpass", frequency: 1800 } },
      { kind: "tone", wave: "square", from: 560, to: 420, duration: 0.2, delay: 0.15, gain: 0.07, filter: { type: "lowpass", frequency: 1800 } },
    ],
  },
  combo: {
    layers: [
      { kind: "tone", wave: "pulse", from: 784, duration: 0.06, gain: 0.08 },
      { kind: "tone", wave: "pulse", from: 988, duration: 0.06, delay: 0.06, gain: 0.08 },
      { kind: "tone", wave: "pulse", from: 1319, duration: 0.12, delay: 0.12, gain: 0.08 },
    ],
  },
  beep: {
    layers: [{ kind: "tone", wave: "pulse", from: 880, duration: 0.09, gain: 0.08 }],
  },
  go: {
    layers: [
      { kind: "tone", wave: "pulse", from: 523, duration: 0.08, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.08, delay: 0.08, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 1047, duration: 0.2, delay: 0.16, gain: 0.1 },
    ],
  },
  tick: {
    layers: [{ kind: "tone", wave: "square", from: 1500, duration: 0.03, gain: 0.04, filter: { type: "highpass", frequency: 900 } }],
  },
  bell: {
    layers: [
      { kind: "tone", wave: "square", from: 1180, duration: 1.1, gain: 0.06, vibrato: { rate: 34, depth: 60 }, filter: { type: "bandpass", frequency: 2000, q: 2 } },
      { kind: "tone", wave: "sine", from: 2360, duration: 1.1, gain: 0.05, vibrato: { rate: 34, depth: 90 } },
      { kind: "noise", duration: 1.1, gain: 0.04, filter: { type: "bandpass", from: 3000, q: 4 } },
    ],
  },
  win: {
    layers: [
      { kind: "tone", wave: "pulse", from: 523, duration: 0.1, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 659, duration: 0.1, delay: 0.1, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.1, delay: 0.2, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 1047, duration: 0.4, delay: 0.3, gain: 0.1 },
      { kind: "tone", wave: "triangle", from: 262, duration: 0.7, delay: 0.3, gain: 0.12 },
    ],
  },
  lose: {
    layers: [
      { kind: "tone", wave: "sine", from: 900, to: 200, duration: 0.8, gain: 0.14, glide: "linear", vibrato: { rate: 6, depth: 12 } },
      { kind: "noise", duration: 0.4, delay: 0.7, gain: 0.18, filter: { type: "lowpass", from: 1400, to: 200 } },
    ],
  },
} satisfies Record<string, SoundRecipe>;

export type LunchSfx = keyof typeof LUNCH_SFX;
