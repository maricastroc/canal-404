import type { SoundRecipe } from "@/lib/audio/types";

export const PAJAMA_SFX = {
  throw: {
    layers: [
      { kind: "noise", duration: 0.16, gain: 0.11, attack: 0.02, filter: { type: "bandpass", from: 700, to: 2200, q: 1.2 } },
      { kind: "tone", wave: "sine", from: 260, to: 420, duration: 0.1, gain: 0.03 },
    ],
  },
  hit: {
    layers: [
      { kind: "noise", duration: 0.16, gain: 0.22, filter: { type: "lowpass", from: 1800, to: 300 } },
      { kind: "tone", wave: "sine", from: 200, to: 90, duration: 0.14, gain: 0.16 },
      { kind: "noise", duration: 0.22, delay: 0.04, gain: 0.05, filter: { type: "highpass", from: 3200 } },
    ],
  },
  thud: {
    layers: [
      { kind: "noise", duration: 0.12, gain: 0.14, filter: { type: "lowpass", from: 900, to: 250 } },
      { kind: "tone", wave: "sine", from: 140, to: 70, duration: 0.12, gain: 0.1 },
    ],
  },
  plop: {
    layers: [{ kind: "noise", duration: 0.1, gain: 0.06, filter: { type: "lowpass", from: 700 } }],
  },
  ouch: {
    layers: [{ kind: "tone", wave: "triangle", from: 760, to: 420, duration: 0.16, gain: 0.07, glide: "exp", vibrato: { rate: 26, depth: 30 } }],
  },
  ko: {
    layers: [
      { kind: "tone", wave: "sine", from: 1300, to: 260, duration: 0.55, gain: 0.08, glide: "exp" },
      { kind: "tone", wave: "sine", from: 200, to: 520, duration: 0.16, delay: 0.55, gain: 0.1, glide: "exp" },
      { kind: "noise", duration: 0.2, delay: 0.55, gain: 0.1, filter: { type: "lowpass", from: 900 } },
    ],
  },
  warn: {
    layers: [
      { kind: "tone", wave: "triangle", from: 520, to: 620, duration: 0.07, gain: 0.06 },
      { kind: "tone", wave: "triangle", from: 760, to: 900, duration: 0.09, delay: 0.09, gain: 0.07 },
    ],
  },
  ready: {
    layers: [{ kind: "tone", wave: "sine", from: 700, to: 1100, duration: 0.05, gain: 0.03 }],
  },
  beep: {
    layers: [{ kind: "tone", wave: "pulse", from: 660, duration: 0.09, gain: 0.07 }],
  },
  go: {
    layers: [
      { kind: "tone", wave: "pulse", from: 988, duration: 0.08, gain: 0.08 },
      { kind: "tone", wave: "pulse", from: 1319, duration: 0.18, delay: 0.08, gain: 0.08 },
    ],
  },
  step: {
    layers: [{ kind: "noise", duration: 0.03, gain: 0.035, filter: { type: "lowpass", from: 900 } }],
  },
  pick: {
    layers: [
      { kind: "tone", wave: "triangle", from: 523, duration: 0.06, gain: 0.08 },
      { kind: "tone", wave: "triangle", from: 784, duration: 0.1, delay: 0.06, gain: 0.08 },
    ],
  },
  boing: {
    layers: [{ kind: "tone", wave: "sine", from: 220, to: 520, duration: 0.16, gain: 0.09, glide: "exp" }],
  },
  wobble: {
    layers: [{ kind: "tone", wave: "triangle", from: 420, to: 380, duration: 0.2, gain: 0.04, vibrato: { rate: 18, depth: 40 } }],
  },
  meow: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 700, to: 1100, duration: 0.12, gain: 0.04, filter: { type: "lowpass", frequency: 2200 } },
      { kind: "tone", wave: "sawtooth", from: 1100, to: 620, duration: 0.24, delay: 0.12, gain: 0.04, filter: { type: "lowpass", frequency: 2000 } },
    ],
  },
  alarm: {
    layers: [
      { kind: "tone", wave: "square", from: 880, duration: 0.08, gain: 0.05, filter: { type: "lowpass", frequency: 2400 } },
      { kind: "tone", wave: "square", from: 1175, duration: 0.12, delay: 0.1, gain: 0.05, filter: { type: "lowpass", frequency: 2400 } },
    ],
  },
  win: {
    layers: [
      { kind: "tone", wave: "pulse", from: 523, duration: 0.1, gain: 0.09 },
      { kind: "tone", wave: "pulse", from: 659, duration: 0.1, delay: 0.1, gain: 0.09 },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.1, delay: 0.2, gain: 0.09 },
      { kind: "tone", wave: "pulse", from: 1047, duration: 0.32, delay: 0.3, gain: 0.09 },
    ],
  },
  lose: {
    layers: [
      { kind: "tone", wave: "triangle", from: 392, duration: 0.2, gain: 0.08 },
      { kind: "tone", wave: "triangle", from: 370, duration: 0.2, delay: 0.22, gain: 0.08 },
      { kind: "tone", wave: "triangle", from: 349, to: 300, duration: 0.5, delay: 0.44, gain: 0.08, vibrato: { rate: 7, depth: 8 } },
    ],
  },
  call: {
    layers: [
      { kind: "tone", wave: "triangle", from: 230, to: 190, duration: 0.14, gain: 0.07, vibrato: { rate: 18, depth: 12 }, filter: { type: "lowpass", frequency: 900 } },
      { kind: "tone", wave: "triangle", from: 270, to: 170, duration: 0.22, delay: 0.17, gain: 0.08, glide: "exp", vibrato: { rate: 14, depth: 14 }, filter: { type: "lowpass", frequency: 900 } },
    ],
  },
  giggle: {
    layers: [
      { kind: "tone", wave: "triangle", from: 900, to: 1100, duration: 0.07, gain: 0.04, vibrato: { rate: 30, depth: 40 } },
      { kind: "tone", wave: "triangle", from: 980, to: 1200, duration: 0.07, delay: 0.1, gain: 0.04, vibrato: { rate: 30, depth: 40 } },
      { kind: "tone", wave: "triangle", from: 860, to: 1060, duration: 0.09, delay: 0.2, gain: 0.035, vibrato: { rate: 30, depth: 40 } },
    ],
  },
  cheer: {
    layers: [
      { kind: "noise", duration: 0.7, gain: 0.06, attack: 0.08, filter: { type: "bandpass", from: 1200, to: 2400, q: 0.8 } },
      { kind: "tone", wave: "triangle", from: 880, duration: 0.12, gain: 0.05 },
      { kind: "tone", wave: "triangle", from: 1175, duration: 0.2, delay: 0.12, gain: 0.05 },
    ],
  },
  spring: {
    layers: [
      { kind: "tone", wave: "triangle", from: 180, to: 640, duration: 0.18, gain: 0.08, glide: "exp", vibrato: { rate: 22, depth: 30 } },
      { kind: "noise", duration: 0.06, gain: 0.04, filter: { type: "lowpass", from: 900 } },
    ],
  },
  rustle: {
    layers: [{ kind: "noise", duration: 0.22, gain: 0.025, attack: 0.04, filter: { type: "highpass", from: 2600 } }],
  },
  whoosh: {
    layers: [{ kind: "noise", duration: 0.42, gain: 0.07, attack: 0.18, filter: { type: "bandpass", from: 400, to: 1800, q: 1 } }],
  },
  powerup: {
    layers: [
      { kind: "tone", wave: "triangle", from: 523, duration: 0.07, gain: 0.08 },
      { kind: "tone", wave: "triangle", from: 784, duration: 0.07, delay: 0.07, gain: 0.08 },
      { kind: "tone", wave: "triangle", from: 1047, duration: 0.16, delay: 0.14, gain: 0.08 },
    ],
  },
  wave: {
    layers: [
      { kind: "noise", duration: 0.32, gain: 0.2, filter: { type: "lowpass", from: 1400, to: 160 } },
      { kind: "tone", wave: "sine", from: 150, to: 50, duration: 0.3, gain: 0.18 },
    ],
  },
  cloth: {
    layers: [{ kind: "noise", duration: 0.2, gain: 0.08, attack: 0.03, filter: { type: "bandpass", from: 1600, to: 700, q: 0.9 } }],
  },
  cardboard: {
    layers: [
      { kind: "noise", duration: 0.09, gain: 0.09, filter: { type: "bandpass", from: 2400, to: 900, q: 1.4 } },
      { kind: "tone", wave: "triangle", from: 160, to: 90, duration: 0.08, gain: 0.06 },
    ],
  },
  sag: {
    layers: [
      { kind: "noise", duration: 0.32, gain: 0.09, attack: 0.04, filter: { type: "lowpass", from: 1400, to: 300 } },
      { kind: "tone", wave: "sine", from: 260, to: 140, duration: 0.26, gain: 0.07, glide: "exp" },
    ],
  },
  crumple: {
    layers: [
      { kind: "noise", duration: 0.07, gain: 0.1, filter: { type: "bandpass", from: 2600, q: 1.6 } },
      { kind: "noise", duration: 0.08, delay: 0.07, gain: 0.09, filter: { type: "bandpass", from: 1800, q: 1.6 } },
      { kind: "noise", duration: 0.12, delay: 0.15, gain: 0.08, filter: { type: "bandpass", from: 1200, to: 600, q: 1.2 } },
      { kind: "tone", wave: "sine", from: 150, to: 70, duration: 0.18, delay: 0.12, gain: 0.08 },
    ],
  },
  clatter: {
    layers: [
      { kind: "tone", wave: "triangle", from: 520, to: 480, duration: 0.05, gain: 0.07 },
      { kind: "tone", wave: "triangle", from: 430, to: 400, duration: 0.05, delay: 0.08, gain: 0.06 },
      { kind: "noise", duration: 0.2, gain: 0.05, attack: 0.03, filter: { type: "lowpass", from: 1200, to: 300 } },
    ],
  },
  broomfall: {
    layers: [
      { kind: "noise", duration: 0.3, gain: 0.08, attack: 0.03, filter: { type: "lowpass", from: 1600, to: 300 } },
      { kind: "tone", wave: "triangle", from: 560, to: 520, duration: 0.05, delay: 0.12, gain: 0.08 },
      { kind: "tone", wave: "triangle", from: 470, to: 440, duration: 0.05, delay: 0.21, gain: 0.07 },
      { kind: "tone", wave: "triangle", from: 390, to: 370, duration: 0.06, delay: 0.29, gain: 0.06 },
      { kind: "tone", wave: "sine", from: 140, to: 60, duration: 0.2, delay: 0.1, gain: 0.1 },
    ],
  },
  trip: {
    layers: [{ kind: "tone", wave: "triangle", from: 700, to: 380, duration: 0.14, gain: 0.05, glide: "exp" }],
  },
  cavein: {
    layers: [
      { kind: "noise", duration: 0.5, gain: 0.14, attack: 0.04, filter: { type: "lowpass", from: 1800, to: 220 } },
      { kind: "tone", wave: "sine", from: 180, to: 60, duration: 0.34, delay: 0.08, gain: 0.14 },
      { kind: "noise", duration: 0.3, delay: 0.16, gain: 0.04, filter: { type: "highpass", from: 2800 } },
    ],
  },
} satisfies Record<string, SoundRecipe>;

export type PajamaSfx = keyof typeof PAJAMA_SFX;
