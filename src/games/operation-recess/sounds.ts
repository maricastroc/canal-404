import type { SoundRecipe } from "@/lib/audio/types";

export const RECESS_SFX = {
  step: {
    layers: [{ kind: "noise", duration: 0.035, gain: 0.05, filter: { type: "lowpass", from: 1000 } }],
  },
  jump: {
    layers: [
      { kind: "tone", wave: "square", from: 280, to: 640, duration: 0.11, gain: 0.05, filter: { type: "lowpass", frequency: 2200 } },
      { kind: "noise", duration: 0.07, gain: 0.04, filter: { type: "bandpass", from: 1400, to: 2600, q: 1.2 } },
    ],
  },
  land: {
    layers: [
      { kind: "tone", wave: "sine", from: 150, to: 70, duration: 0.1, gain: 0.14 },
      { kind: "noise", duration: 0.05, gain: 0.05, filter: { type: "lowpass", from: 800 } },
    ],
  },
  swing: {
    layers: [{ kind: "noise", duration: 0.14, gain: 0.12, attack: 0.01, filter: { type: "bandpass", from: 900, to: 3200, q: 1.4 } }],
  },
  hit: {
    layers: [
      { kind: "noise", duration: 0.12, gain: 0.2, filter: { type: "lowpass", from: 2400, to: 400 } },
      { kind: "tone", wave: "square", from: 420, to: 160, duration: 0.12, gain: 0.08, filter: { type: "lowpass", frequency: 2000 } },
      { kind: "tone", wave: "triangle", from: 1200, to: 1500, duration: 0.07, delay: 0.04, gain: 0.05 },
    ],
  },
  ko: {
    layers: [
      { kind: "tone", wave: "triangle", from: 900, to: 300, duration: 0.35, gain: 0.08, glide: "exp" },
      { kind: "tone", wave: "pulse", from: 1047, duration: 0.08, delay: 0.25, gain: 0.06 },
      { kind: "tone", wave: "pulse", from: 1319, duration: 0.12, delay: 0.33, gain: 0.06 },
    ],
  },
  block: {
    layers: [
      { kind: "tone", wave: "square", from: 1180, to: 1120, duration: 0.12, gain: 0.05, filter: { type: "bandpass", frequency: 2400, q: 3 } },
      { kind: "tone", wave: "triangle", from: 1760, duration: 0.22, gain: 0.05, vibrato: { rate: 36, depth: 24 } },
      { kind: "noise", duration: 0.05, gain: 0.07, filter: { type: "highpass", from: 3500 } },
    ],
  },
  hurt: {
    layers: [
      { kind: "tone", wave: "square", from: 520, to: 180, duration: 0.26, gain: 0.07, glide: "exp", filter: { type: "lowpass", frequency: 1800 } },
      { kind: "noise", duration: 0.14, gain: 0.14, filter: { type: "lowpass", from: 2400, to: 300 } },
    ],
  },
  shout: {
    layers: [{ kind: "tone", wave: "sawtooth", from: 180, to: 240, duration: 0.22, gain: 0.06, vibrato: { rate: 14, depth: 18 }, filter: { type: "lowpass", frequency: 1100 } }],
  },
  lunge: {
    layers: [{ kind: "noise", duration: 0.18, gain: 0.1, filter: { type: "bandpass", from: 500, to: 1400, q: 1 } }],
  },
  puff: {
    layers: [{ kind: "tone", wave: "sine", from: 500, to: 1300, duration: 0.5, gain: 0.05, glide: "linear", vibrato: { rate: 12, depth: 20 } }],
  },
  whistle: {
    layers: [
      { kind: "tone", wave: "sine", from: 2700, duration: 0.32, gain: 0.08, vibrato: { rate: 34, depth: 150 } },
      { kind: "noise", duration: 0.32, gain: 0.03, filter: { type: "bandpass", from: 2800, q: 6 } },
    ],
  },
  pop: {
    layers: [
      { kind: "tone", wave: "sine", from: 900, to: 1500, duration: 0.07, gain: 0.1 },
      { kind: "noise", duration: 0.05, gain: 0.05, filter: { type: "highpass", from: 3000 } },
    ],
  },
  coin: {
    layers: [
      { kind: "tone", wave: "pulse", from: 988, duration: 0.06, gain: 0.07 },
      { kind: "tone", wave: "pulse", from: 1319, duration: 0.12, delay: 0.06, gain: 0.07 },
    ],
  },
  heal: {
    layers: [
      { kind: "tone", wave: "triangle", from: 523, duration: 0.08, gain: 0.08 },
      { kind: "tone", wave: "triangle", from: 659, duration: 0.08, delay: 0.08, gain: 0.08 },
      { kind: "tone", wave: "triangle", from: 784, duration: 0.14, delay: 0.16, gain: 0.08 },
    ],
  },
  bell: {
    layers: [
      { kind: "tone", wave: "sine", from: 1568, duration: 0.6, gain: 0.08, vibrato: { rate: 8, depth: 6 } },
      { kind: "tone", wave: "sine", from: 2093, duration: 0.5, delay: 0.02, gain: 0.05 },
    ],
  },
  roll: {
    layers: [{ kind: "noise", duration: 0.3, gain: 0.05, filter: { type: "lowpass", from: 500 } }],
  },
  boing: {
    layers: [{ kind: "tone", wave: "sine", from: 220, to: 520, duration: 0.16, gain: 0.09, glide: "exp" }],
  },
  stomp: {
    layers: [
      { kind: "tone", wave: "sine", from: 110, to: 45, duration: 0.3, gain: 0.24 },
      { kind: "noise", duration: 0.2, gain: 0.14, filter: { type: "lowpass", from: 900 } },
    ],
  },
  charge: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 90, to: 140, duration: 0.6, gain: 0.07, filter: { type: "lowpass", frequency: 700 } },
      { kind: "noise", duration: 0.6, gain: 0.08, filter: { type: "bandpass", from: 300, to: 900, q: 1 } },
    ],
  },
  crash: {
    layers: [
      { kind: "noise", duration: 0.35, gain: 0.24, filter: { type: "lowpass", from: 3000, to: 200 } },
      { kind: "tone", wave: "triangle", from: 300, to: 80, duration: 0.3, gain: 0.12 },
    ],
  },
  slam: {
    layers: [
      { kind: "noise", duration: 0.12, gain: 0.2, filter: { type: "lowpass", from: 2400 } },
      { kind: "tone", wave: "square", from: 160, to: 60, duration: 0.2, gain: 0.08, filter: { type: "lowpass", frequency: 900 } },
    ],
  },
  bigWhistle: {
    layers: [
      { kind: "tone", wave: "sine", from: 2500, to: 2300, duration: 0.7, gain: 0.1, vibrato: { rate: 30, depth: 220 } },
      { kind: "tone", wave: "square", from: 1250, duration: 0.7, gain: 0.03, vibrato: { rate: 30, depth: 110 }, filter: { type: "lowpass", frequency: 3000 } },
    ],
  },
  bossHit: {
    layers: [
      { kind: "noise", duration: 0.16, gain: 0.22, filter: { type: "lowpass", from: 2000, to: 300 } },
      { kind: "tone", wave: "sawtooth", from: 220, to: 120, duration: 0.2, gain: 0.07, filter: { type: "lowpass", frequency: 1200 } },
    ],
  },
  door: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 180, to: 260, duration: 0.4, gain: 0.05, vibrato: { rate: 18, depth: 20 }, filter: { type: "lowpass", frequency: 1100 } },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.1, delay: 0.35, gain: 0.08 },
      { kind: "tone", wave: "pulse", from: 1047, duration: 0.22, delay: 0.45, gain: 0.08 },
    ],
  },
  win: {
    layers: [
      { kind: "tone", wave: "pulse", from: 523, duration: 0.1, gain: 0.09 },
      { kind: "tone", wave: "pulse", from: 659, duration: 0.1, delay: 0.1, gain: 0.09 },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.1, delay: 0.2, gain: 0.09 },
      { kind: "tone", wave: "pulse", from: 1047, duration: 0.35, delay: 0.3, gain: 0.09 },
    ],
  },
  cheer: {
    layers: [
      { kind: "noise", duration: 1.2, gain: 0.12, attack: 0.1, filter: { type: "bandpass", from: 700, to: 1400, q: 0.7 } },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.1, delay: 0.05, gain: 0.06 },
      { kind: "tone", wave: "pulse", from: 988, duration: 0.1, delay: 0.15, gain: 0.06 },
      { kind: "tone", wave: "pulse", from: 1175, duration: 0.1, delay: 0.25, gain: 0.06 },
      { kind: "tone", wave: "pulse", from: 1568, duration: 0.3, delay: 0.35, gain: 0.06 },
    ],
  },
  lose: {
    layers: [
      { kind: "tone", wave: "sine", from: 900, to: 200, duration: 0.8, gain: 0.12, glide: "linear", vibrato: { rate: 6, depth: 12 } },
      { kind: "noise", duration: 0.3, delay: 0.7, gain: 0.12, filter: { type: "lowpass", from: 1400, to: 200 } },
    ],
  },
  alert: {
    layers: [{ kind: "tone", wave: "square", from: 880, to: 990, duration: 0.07, gain: 0.04, filter: { type: "lowpass", frequency: 2400 } }],
  },
} satisfies Record<string, SoundRecipe>;

export type RecessSfx = keyof typeof RECESS_SFX;
