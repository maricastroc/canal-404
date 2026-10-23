import type { SoundRecipe } from "./types";

export const SFX = {
  hover: {
    volume: 0.5,
    layers: [{ kind: "tone", wave: "triangle", from: 1320, to: 1480, duration: 0.045, gain: 0.07 }],
  },
  click: {
    layers: [
      { kind: "tone", wave: "pulse", from: 520, to: 780, duration: 0.07, gain: 0.12 },
      { kind: "noise", duration: 0.03, gain: 0.05, filter: { type: "highpass", from: 3000 } },
    ],
  },
  confirm: {
    layers: [
      { kind: "tone", wave: "pulse", from: 660, duration: 0.08, gain: 0.12 },
      { kind: "tone", wave: "pulse", from: 990, duration: 0.14, delay: 0.075, gain: 0.12 },
    ],
  },
  back: {
    layers: [
      { kind: "tone", wave: "pulse", from: 880, duration: 0.07, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 587, duration: 0.12, delay: 0.07, gain: 0.1 },
    ],
  },
  toggleOn: {
    layers: [
      { kind: "tone", wave: "square", from: 300, to: 900, duration: 0.12, gain: 0.08 },
      { kind: "tone", wave: "triangle", from: 1200, duration: 0.08, delay: 0.1, gain: 0.08 },
    ],
  },
  toggleOff: {
    layers: [{ kind: "tone", wave: "square", from: 800, to: 220, duration: 0.16, gain: 0.08 }],
  },
  coin: {
    layers: [
      { kind: "tone", wave: "square", from: 988, duration: 0.08, gain: 0.1 },
      { kind: "tone", wave: "square", from: 1319, duration: 0.32, delay: 0.075, gain: 0.1 },
    ],
  },
  static: {
    layers: [
      { kind: "noise", duration: 0.32, gain: 0.16, filter: { type: "bandpass", from: 2600, to: 1400, q: 0.6 } },
      { kind: "tone", wave: "sawtooth", from: 60, duration: 0.3, gain: 0.03 },
    ],
  },
  tvOn: {
    layers: [
      { kind: "noise", duration: 0.06, gain: 0.12, filter: { type: "highpass", from: 2000 } },
      { kind: "tone", wave: "sine", from: 180, to: 1400, duration: 0.25, gain: 0.06, delay: 0.03 },
    ],
  },
  meow: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 480, to: 820, duration: 0.14, gain: 0.07, filter: { type: "bandpass", frequency: 1100, q: 2 } },
      { kind: "tone", wave: "sawtooth", from: 820, to: 430, duration: 0.32, delay: 0.13, gain: 0.07, filter: { type: "bandpass", frequency: 1000, q: 2 } },
    ],
  },
  purr: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 48, duration: 0.9, gain: 0.08, attack: 0.1, vibrato: { rate: 24, depth: 12 }, filter: { type: "lowpass", frequency: 260 } },
    ],
  },
  pop: {
    layers: [{ kind: "tone", wave: "sine", from: 380, to: 1100, duration: 0.08, gain: 0.16 }],
  },
  whoosh: {
    layers: [
      { kind: "noise", duration: 0.45, gain: 0.14, attack: 0.08, filter: { type: "bandpass", from: 380, to: 2600, q: 1.4 } },
    ],
  },
  boing: {
    layers: [
      { kind: "tone", wave: "sine", from: 180, to: 520, duration: 0.42, gain: 0.18, vibrato: { rate: 16, depth: 50 } },
    ],
  },
  squeak: {
    layers: [
      { kind: "tone", wave: "sine", from: 1100, to: 1900, duration: 0.07, gain: 0.12 },
      { kind: "tone", wave: "sine", from: 1900, to: 1200, duration: 0.09, delay: 0.07, gain: 0.1 },
    ],
  },
  thud: {
    layers: [
      { kind: "tone", wave: "sine", from: 150, to: 45, duration: 0.2, gain: 0.3 },
      { kind: "noise", duration: 0.09, gain: 0.12, filter: { type: "lowpass", from: 900 } },
    ],
  },
  chain: {
    layers: [
      { kind: "noise", duration: 0.03, gain: 0.12, filter: { type: "highpass", from: 4000 } },
      { kind: "tone", wave: "square", from: 2400, duration: 0.025, gain: 0.04, delay: 0.05 },
      { kind: "noise", duration: 0.05, gain: 0.1, delay: 0.09, filter: { type: "bandpass", from: 2500, q: 3 } },
    ],
  },
  lidCreak: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 210, to: 340, duration: 0.35, gain: 0.05, vibrato: { rate: 30, depth: 25 }, filter: { type: "bandpass", frequency: 700, q: 3 } },
    ],
  },
  fly: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 210, to: 240, duration: 0.6, gain: 0.03, vibrato: { rate: 9, depth: 30 }, filter: { type: "bandpass", frequency: 800, q: 4 } },
    ],
  },
  engine: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 90, to: 160, duration: 1.4, gain: 0.05, attack: 0.15, vibrato: { rate: 34, depth: 14 }, filter: { type: "lowpass", frequency: 900 } },
    ],
  },
  rumble: {
    layers: [
      { kind: "tone", wave: "square", from: 55, duration: 0.25, gain: 0.07, vibrato: { rate: 30, depth: 10 }, filter: { type: "lowpass", frequency: 300 } },
    ],
  },
  dizzy: {
    layers: [
      { kind: "tone", wave: "sine", from: 600, to: 300, duration: 0.6, gain: 0.12, vibrato: { rate: 9, depth: 90 }, glide: "linear" },
    ],
  },
  page: {
    layers: [
      { kind: "noise", duration: 0.12, gain: 0.08, attack: 0.03, filter: { type: "bandpass", from: 1800, to: 3800, q: 0.9 } },
    ],
  },
  achievement: {
    layers: [
      { kind: "tone", wave: "triangle", from: 1047, duration: 0.09, gain: 0.12 },
      { kind: "tone", wave: "triangle", from: 1319, duration: 0.09, delay: 0.07, gain: 0.12 },
      { kind: "tone", wave: "triangle", from: 1568, duration: 0.09, delay: 0.14, gain: 0.12 },
      { kind: "tone", wave: "pulse", from: 2093, duration: 0.32, delay: 0.21, gain: 0.08, vibrato: { rate: 7, depth: 20 } },
    ],
  },
  secret: {
    layers: [
      { kind: "tone", wave: "sine", from: 784, duration: 0.12, gain: 0.12 },
      { kind: "tone", wave: "sine", from: 988, duration: 0.12, delay: 0.1, gain: 0.12 },
      { kind: "tone", wave: "sine", from: 1245, duration: 0.12, delay: 0.2, gain: 0.12 },
      { kind: "tone", wave: "triangle", from: 1568, duration: 0.45, delay: 0.3, gain: 0.1, vibrato: { rate: 6, depth: 14 } },
    ],
  },
  victory: {
    layers: [
      { kind: "tone", wave: "pulse", from: 523, duration: 0.11, gain: 0.12 },
      { kind: "tone", wave: "pulse", from: 659, duration: 0.11, delay: 0.1, gain: 0.12 },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.11, delay: 0.2, gain: 0.12 },
      { kind: "tone", wave: "pulse", from: 1047, duration: 0.55, delay: 0.3, gain: 0.12, vibrato: { rate: 6, depth: 12 } },
      { kind: "tone", wave: "triangle", from: 523, duration: 0.6, delay: 0.3, gain: 0.14 },
    ],
  },
  defeat: {
    layers: [
      { kind: "tone", wave: "square", from: 392, duration: 0.24, gain: 0.07, filter: { type: "lowpass", frequency: 1400 } },
      { kind: "tone", wave: "square", from: 370, duration: 0.24, delay: 0.26, gain: 0.07, filter: { type: "lowpass", frequency: 1300 } },
      { kind: "tone", wave: "square", from: 349, duration: 0.24, delay: 0.52, gain: 0.07, filter: { type: "lowpass", frequency: 1200 } },
      { kind: "tone", wave: "square", from: 330, to: 310, duration: 0.8, delay: 0.78, gain: 0.07, vibrato: { rate: 6, depth: 8 }, filter: { type: "lowpass", frequency: 1000 } },
    ],
  },
} satisfies Record<string, SoundRecipe>;

export type SfxName = keyof typeof SFX;
