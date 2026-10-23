import type { SoundRecipe } from "@/lib/audio/types";

export const GAME_SFX = {
  stretch: {
    layers: [{ kind: "tone", wave: "sawtooth", from: 120, to: 210, duration: 0.18, gain: 0.035, filter: { type: "lowpass", frequency: 900 } }],
  },
  launch: {
    layers: [
      { kind: "tone", wave: "sine", from: 260, to: 720, duration: 0.16, gain: 0.18 },
      { kind: "noise", duration: 0.3, gain: 0.1, attack: 0.02, filter: { type: "bandpass", from: 600, to: 2400, q: 1.2 } },
    ],
  },
  twang: {
    layers: [{ kind: "tone", wave: "triangle", from: 180, to: 140, duration: 0.35, gain: 0.12, vibrato: { rate: 28, depth: 18 } }],
  },
  wood: {
    layers: [
      { kind: "tone", wave: "triangle", from: 420, to: 180, duration: 0.09, gain: 0.2 },
      { kind: "noise", duration: 0.06, gain: 0.1, filter: { type: "bandpass", from: 1400, q: 2 } },
    ],
  },
  metal: {
    layers: [
      { kind: "tone", wave: "square", from: 820, to: 760, duration: 0.25, gain: 0.05, filter: { type: "bandpass", frequency: 1800, q: 6 } },
      { kind: "tone", wave: "sine", from: 1230, duration: 0.3, gain: 0.05 },
      { kind: "noise", duration: 0.08, gain: 0.08, filter: { type: "highpass", from: 2500 } },
    ],
  },
  rubber: {
    layers: [{ kind: "tone", wave: "sine", from: 160, to: 60, duration: 0.16, gain: 0.26 }],
  },
  ceramic: {
    layers: [
      { kind: "tone", wave: "sine", from: 2100, to: 1900, duration: 0.12, gain: 0.08 },
      { kind: "noise", duration: 0.14, gain: 0.12, filter: { type: "highpass", from: 3000 } },
    ],
  },
  soft: {
    layers: [{ kind: "noise", duration: 0.1, gain: 0.14, filter: { type: "lowpass", from: 900 } }],
  },
  thud: {
    layers: [
      { kind: "tone", wave: "sine", from: 140, to: 50, duration: 0.18, gain: 0.26 },
      { kind: "noise", duration: 0.08, gain: 0.1, filter: { type: "lowpass", from: 700 } },
    ],
  },
  squeak: {
    layers: [
      { kind: "tone", wave: "sine", from: 1300, to: 2000, duration: 0.06, gain: 0.12 },
      { kind: "tone", wave: "sine", from: 2000, to: 1250, duration: 0.09, delay: 0.06, gain: 0.1 },
    ],
  },
  splash: {
    layers: [
      { kind: "noise", duration: 0.5, gain: 0.22, filter: { type: "bandpass", from: 1600, to: 400, q: 0.8 } },
      { kind: "tone", wave: "sine", from: 600, to: 180, duration: 0.18, gain: 0.12 },
    ],
  },
  target: {
    layers: [
      { kind: "tone", wave: "pulse", from: 784, duration: 0.07, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 1175, duration: 0.14, delay: 0.06, gain: 0.1 },
    ],
  },
  combo: {
    layers: [
      { kind: "tone", wave: "pulse", from: 988, duration: 0.07, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 1319, duration: 0.07, delay: 0.07, gain: 0.1 },
      { kind: "tone", wave: "pulse", from: 1760, duration: 0.18, delay: 0.14, gain: 0.1 },
    ],
  },
  grumpy: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 180, to: 120, duration: 0.3, gain: 0.07, vibrato: { rate: 12, depth: 16 }, filter: { type: "lowpass", frequency: 1200 } },
    ],
  },
  load: {
    layers: [
      { kind: "tone", wave: "triangle", from: 500, to: 700, duration: 0.07, gain: 0.08 },
      { kind: "noise", duration: 0.04, gain: 0.05, filter: { type: "highpass", from: 3000 } },
    ],
  },
  mess: {
    layers: [{ kind: "tone", wave: "triangle", from: 660, to: 880, duration: 0.06, gain: 0.05 }],
  },
  victory: {
    layers: [
      { kind: "tone", wave: "pulse", from: 523, duration: 0.11, gain: 0.12 },
      { kind: "tone", wave: "pulse", from: 659, duration: 0.11, delay: 0.1, gain: 0.12 },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.11, delay: 0.2, gain: 0.12 },
      { kind: "tone", wave: "pulse", from: 1047, duration: 0.6, delay: 0.3, gain: 0.12, vibrato: { rate: 6, depth: 12 } },
      { kind: "tone", wave: "triangle", from: 262, duration: 0.7, delay: 0.3, gain: 0.16 },
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

export type GameSfx = keyof typeof GAME_SFX;
