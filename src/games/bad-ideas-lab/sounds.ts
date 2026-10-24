import type { SoundRecipe } from "@/lib/audio/types";

export const LAB_SFX = {
  pick: {
    layers: [
      { kind: "tone", wave: "triangle", from: 520, to: 780, duration: 0.07, gain: 0.12 },
      { kind: "noise", duration: 0.04, gain: 0.05, filter: { type: "highpass", from: 2600 } },
    ],
  },
  place: {
    layers: [
      { kind: "tone", wave: "triangle", from: 300, to: 160, duration: 0.09, gain: 0.2 },
      { kind: "noise", duration: 0.07, gain: 0.12, filter: { type: "bandpass", from: 1200, q: 1.6 } },
      { kind: "tone", wave: "pulse", from: 990, duration: 0.05, delay: 0.05, gain: 0.05 },
    ],
  },
  rotate: {
    layers: [
      { kind: "tone", wave: "square", from: 1400, to: 1200, duration: 0.03, gain: 0.04, filter: { type: "lowpass", frequency: 2400 } },
      { kind: "tone", wave: "square", from: 1600, to: 1400, duration: 0.03, delay: 0.05, gain: 0.04, filter: { type: "lowpass", frequency: 2400 } },
    ],
  },
  nudge: {
    layers: [{ kind: "tone", wave: "triangle", from: 880, to: 820, duration: 0.03, gain: 0.04 }],
  },
  remove: {
    layers: [
      { kind: "tone", wave: "sine", from: 600, to: 220, duration: 0.14, gain: 0.14 },
      { kind: "noise", duration: 0.08, gain: 0.06, filter: { type: "lowpass", from: 1400 } },
    ],
  },
  invalid: {
    layers: [
      { kind: "tone", wave: "square", from: 190, to: 150, duration: 0.16, gain: 0.07, filter: { type: "lowpass", frequency: 900 } },
      { kind: "tone", wave: "square", from: 150, to: 120, duration: 0.18, delay: 0.12, gain: 0.07, filter: { type: "lowpass", frequency: 900 } },
    ],
  },
  run: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 90, to: 260, duration: 0.45, gain: 0.07, filter: { type: "lowpass", frequency: 1100 } },
      { kind: "tone", wave: "pulse", from: 660, duration: 0.07, delay: 0.32, gain: 0.08 },
      { kind: "tone", wave: "pulse", from: 990, duration: 0.12, delay: 0.4, gain: 0.08 },
    ],
  },
  stop: {
    layers: [{ kind: "tone", wave: "sawtooth", from: 260, to: 70, duration: 0.35, gain: 0.07, filter: { type: "lowpass", frequency: 900 } }],
  },
  plop: {
    layers: [
      { kind: "tone", wave: "sine", from: 240, to: 520, duration: 0.08, gain: 0.2 },
      { kind: "noise", duration: 0.05, gain: 0.06, filter: { type: "bandpass", from: 900, q: 2 } },
    ],
  },
  tap: {
    layers: [
      { kind: "tone", wave: "triangle", from: 360, to: 200, duration: 0.06, gain: 0.16 },
      { kind: "noise", duration: 0.04, gain: 0.07, filter: { type: "bandpass", from: 1800, q: 2 } },
    ],
  },
  clink: {
    layers: [
      { kind: "tone", wave: "sine", from: 1900, to: 1700, duration: 0.09, gain: 0.07 },
      { kind: "tone", wave: "sine", from: 2850, duration: 0.07, gain: 0.03 },
    ],
  },
  boing: {
    layers: [
      { kind: "tone", wave: "triangle", from: 160, to: 520, duration: 0.28, gain: 0.2, vibrato: { rate: 22, depth: 30 } },
      { kind: "tone", wave: "sine", from: 90, to: 60, duration: 0.12, gain: 0.18 },
    ],
  },
  whoosh: {
    layers: [{ kind: "noise", duration: 0.45, gain: 0.1, attack: 0.08, filter: { type: "bandpass", from: 500, to: 1800, q: 0.9 } }],
  },
  clack: {
    layers: [
      { kind: "tone", wave: "square", from: 420, to: 380, duration: 0.03, gain: 0.05, filter: { type: "lowpass", frequency: 1600 } },
      { kind: "noise", duration: 0.03, gain: 0.06, filter: { type: "bandpass", from: 2200, q: 3 } },
    ],
  },
  ding: {
    layers: [
      { kind: "tone", wave: "sine", from: 1568, duration: 1.4, gain: 0.2 },
      { kind: "tone", wave: "sine", from: 3136, duration: 0.8, gain: 0.07 },
      { kind: "tone", wave: "sine", from: 2350, duration: 1, gain: 0.05 },
    ],
  },
  toaster: {
    layers: [
      { kind: "tone", wave: "square", from: 300, to: 260, duration: 0.05, gain: 0.08, filter: { type: "lowpass", frequency: 1500 } },
      { kind: "tone", wave: "sine", from: 400, to: 900, duration: 0.12, delay: 0.25, gain: 0.18 },
      { kind: "noise", duration: 0.1, delay: 0.25, gain: 0.08, filter: { type: "bandpass", from: 1400, q: 1.5 } },
    ],
  },
  squish: {
    layers: [
      { kind: "noise", duration: 0.35, gain: 0.2, filter: { type: "bandpass", from: 1400, to: 300, q: 0.9 } },
      { kind: "tone", wave: "sine", from: 300, to: 120, duration: 0.25, gain: 0.14 },
    ],
  },
  click: {
    layers: [
      { kind: "tone", wave: "square", from: 1200, duration: 0.025, gain: 0.06 },
      { kind: "noise", duration: 0.02, gain: 0.06, filter: { type: "highpass", from: 3000 } },
    ],
  },
  tvOn: {
    layers: [
      { kind: "tone", wave: "sine", from: 15000, to: 12000, duration: 0.4, gain: 0.02 },
      { kind: "noise", duration: 0.5, gain: 0.08, filter: { type: "highpass", from: 1800 } },
      { kind: "tone", wave: "pulse", from: 523, duration: 0.1, delay: 0.45, gain: 0.08 },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.18, delay: 0.55, gain: 0.08 },
    ],
  },
  meow: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 700, to: 1100, duration: 0.14, gain: 0.06, filter: { type: "bandpass", frequency: 1400, q: 2 } },
      { kind: "tone", wave: "sawtooth", from: 1100, to: 520, duration: 0.3, delay: 0.13, gain: 0.06, filter: { type: "bandpass", frequency: 1200, q: 2 } },
    ],
  },
  success: {
    layers: [
      { kind: "tone", wave: "pulse", from: 523, duration: 0.1, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 659, duration: 0.1, delay: 0.1, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.1, delay: 0.2, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 1047, duration: 0.36, delay: 0.3, gain: 0.1 },
      { kind: "tone", wave: "triangle", from: 262, duration: 0.6, delay: 0.3, gain: 0.12 },
    ],
  },
  clear: {
    layers: [
      { kind: "noise", duration: 0.25, gain: 0.12, filter: { type: "bandpass", from: 2400, to: 600, q: 1 } },
      { kind: "tone", wave: "triangle", from: 500, to: 180, duration: 0.2, gain: 0.1 },
    ],
  },
  slide: {
    layers: [
      { kind: "tone", wave: "sine", from: 1100, to: 220, duration: 0.75, gain: 0.16, glide: "linear", vibrato: { rate: 7, depth: 12 } },
      { kind: "tone", wave: "triangle", from: 550, to: 110, duration: 0.75, gain: 0.05, glide: "linear" },
    ],
  },
  poof: {
    layers: [
      { kind: "noise", duration: 0.35, gain: 0.22, attack: 0.01, filter: { type: "lowpass", from: 1800, to: 300 } },
      { kind: "tone", wave: "sine", from: 120, to: 50, duration: 0.25, gain: 0.2 },
    ],
  },
  rattle: {
    layers: [
      { kind: "tone", wave: "square", from: 220, to: 200, duration: 0.04, gain: 0.05, filter: { type: "lowpass", frequency: 1200 } },
      { kind: "tone", wave: "square", from: 240, to: 210, duration: 0.04, delay: 0.07, gain: 0.05, filter: { type: "lowpass", frequency: 1200 } },
      { kind: "tone", wave: "square", from: 230, to: 205, duration: 0.04, delay: 0.14, gain: 0.05, filter: { type: "lowpass", frequency: 1200 } },
      { kind: "noise", duration: 0.2, gain: 0.05, filter: { type: "bandpass", from: 1500, q: 2 } },
    ],
  },
  party: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 420, to: 880, duration: 0.32, gain: 0.07, filter: { type: "lowpass", frequency: 2600 }, vibrato: { rate: 30, depth: 20 } },
      { kind: "noise", duration: 0.3, gain: 0.06, filter: { type: "bandpass", from: 2400, q: 1.4 } },
      { kind: "tone", wave: "sawtooth", from: 880, duration: 0.25, delay: 0.3, gain: 0.06, filter: { type: "lowpass", frequency: 2600 }, vibrato: { rate: 30, depth: 20 } },
    ],
  },
  starPop: {
    layers: [
      { kind: "tone", wave: "pulse", from: 1047, to: 1568, duration: 0.12, gain: 0.1 },
      { kind: "tone", wave: "sine", from: 2093, duration: 0.25, delay: 0.05, gain: 0.05 },
    ],
  },
  aha: {
    layers: [
      { kind: "tone", wave: "sine", from: 660, to: 990, duration: 0.12, gain: 0.12 },
      { kind: "tone", wave: "sine", from: 1320, duration: 0.2, delay: 0.1, gain: 0.08 },
    ],
  },
} satisfies Record<string, SoundRecipe>;

export type LabSfx = keyof typeof LAB_SFX;
