import type { SoundRecipe } from "@/lib/audio/types";

export const NIGHT_SFX = {
  step: {
    layers: [{ kind: "noise", duration: 0.05, gain: 0.035, filter: { type: "bandpass", from: 1800, to: 1200, q: 2 } }],
  },
  creak: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 240, to: 330, duration: 0.42, gain: 0.05, glide: "exp", vibrato: { rate: 18, depth: 24 } },
      { kind: "noise", duration: 0.3, gain: 0.04, filter: { type: "bandpass", from: 900, to: 1300, q: 6 } },
    ],
  },
  creakSoft: {
    layers: [{ kind: "tone", wave: "triangle", from: 260, to: 300, duration: 0.22, gain: 0.025, vibrato: { rate: 16, depth: 12 } }],
  },
  cuckoo: {
    layers: [
      { kind: "tone", wave: "sine", from: 880, to: 880, duration: 0.16, gain: 0.09 },
      { kind: "tone", wave: "sine", from: 698, to: 698, duration: 0.24, delay: 0.2, gain: 0.09 },
    ],
  },
  tick: {
    layers: [
      { kind: "tone", wave: "triangle", from: 1320, to: 1100, duration: 0.045, gain: 0.07 },
      { kind: "noise", duration: 0.03, gain: 0.05, filter: { type: "bandpass", from: 3200, q: 4 } },
      { kind: "tone", wave: "triangle", from: 990, to: 820, duration: 0.05, delay: 0.17, gain: 0.065 },
      { kind: "noise", duration: 0.03, delay: 0.17, gain: 0.045, filter: { type: "bandpass", from: 2400, q: 4 } },
    ],
  },
  wake: {
    layers: [
      { kind: "noise", duration: 0.12, gain: 0.09, filter: { type: "lowpass", from: 600, to: 200 } },
      { kind: "tone", wave: "sawtooth", from: 220, to: 330, duration: 0.3, gain: 0.05, glide: "exp", vibrato: { rate: 22, depth: 30 } },
      { kind: "tone", wave: "triangle", from: 380, to: 760, duration: 0.22, delay: 0.08, gain: 0.1, glide: "exp" },
      { kind: "tone", wave: "triangle", from: 760, to: 700, duration: 0.12, delay: 0.3, gain: 0.07 },
    ],
  },
  stir: {
    layers: [
      { kind: "tone", wave: "sine", from: 170, to: 150, duration: 0.22, gain: 0.08, vibrato: { rate: 9, depth: 10 } },
      { kind: "tone", wave: "sine", from: 150, to: 190, duration: 0.24, delay: 0.24, gain: 0.07, glide: "exp" },
      { kind: "noise", duration: 0.35, gain: 0.03, attack: 0.1, filter: { type: "lowpass", from: 420, to: 260 } },
    ],
  },
  sleep: {
    layers: [{ kind: "tone", wave: "sine", from: 420, to: 210, duration: 0.4, gain: 0.04, glide: "exp" }],
  },
  snore: {
    layers: [{ kind: "noise", duration: 0.5, gain: 0.03, attack: 0.25, filter: { type: "lowpass", from: 380, to: 220 } }],
  },
  alert: {
    layers: [
      { kind: "tone", wave: "triangle", from: 520, to: 620, duration: 0.07, gain: 0.06 },
      { kind: "tone", wave: "triangle", from: 760, to: 900, duration: 0.09, delay: 0.09, gain: 0.07 },
    ],
  },
  sniff: {
    layers: [
      { kind: "noise", duration: 0.06, gain: 0.05, filter: { type: "bandpass", from: 2600, q: 3 } },
      { kind: "noise", duration: 0.06, delay: 0.12, gain: 0.05, filter: { type: "bandpass", from: 2600, q: 3 } },
    ],
  },
  bark: {
    layers: [
      { kind: "tone", wave: "square", from: 520, to: 260, duration: 0.12, gain: 0.07, glide: "exp" },
      { kind: "noise", duration: 0.1, gain: 0.08, filter: { type: "bandpass", from: 900, q: 1.5 } },
      { kind: "tone", wave: "square", from: 540, to: 250, duration: 0.12, delay: 0.2, gain: 0.07, glide: "exp" },
      { kind: "noise", duration: 0.1, delay: 0.2, gain: 0.08, filter: { type: "bandpass", from: 900, q: 1.5 } },
    ],
  },
  caught: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 330, to: 330, duration: 0.5, gain: 0.05 },
      { kind: "tone", wave: "sawtooth", from: 392, to: 392, duration: 0.5, gain: 0.04 },
      { kind: "tone", wave: "sawtooth", from: 466, to: 466, duration: 0.5, gain: 0.04 },
      { kind: "noise", duration: 0.3, gain: 0.07, filter: { type: "lowpass", from: 1200, to: 300 } },
    ],
  },
  erase: {
    layers: [
      { kind: "noise", duration: 0.09, gain: 0.09, attack: 0.02, filter: { type: "bandpass", from: 2200, to: 3400, q: 1.2 } },
      { kind: "noise", duration: 0.09, delay: 0.1, gain: 0.09, attack: 0.02, filter: { type: "bandpass", from: 3400, to: 2200, q: 1.2 } },
      { kind: "noise", duration: 0.08, delay: 0.2, gain: 0.07, attack: 0.02, filter: { type: "bandpass", from: 2200, to: 3000, q: 1.2 } },
      { kind: "tone", wave: "sine", from: 660, to: 440, duration: 0.12, delay: 0.26, gain: 0.04, glide: "exp" },
    ],
  },
  pencil: {
    layers: [
      { kind: "noise", duration: 0.12, gain: 0.06, filter: { type: "highpass", from: 2600 } },
      { kind: "tone", wave: "sine", from: 880, to: 1320, duration: 0.1, delay: 0.1, gain: 0.04, glide: "exp" },
    ],
  },
  bump: {
    layers: [{ kind: "tone", wave: "sine", from: 160, to: 90, duration: 0.09, gain: 0.06 }],
  },
  knock: {
    layers: [
      { kind: "noise", duration: 0.32, gain: 0.16, filter: { type: "bandpass", from: 2400, to: 900, q: 1.4 } },
      { kind: "tone", wave: "triangle", from: 1500, to: 600, duration: 0.18, gain: 0.05, glide: "exp" },
      { kind: "noise", duration: 0.12, delay: 0.16, gain: 0.08, filter: { type: "highpass", from: 3000 } },
    ],
  },
  meow: {
    layers: [{ kind: "tone", wave: "triangle", from: 620, to: 880, duration: 0.3, gain: 0.05, glide: "exp", vibrato: { rate: 8, depth: 30 } }],
  },
  win: {
    layers: [
      { kind: "tone", wave: "triangle", from: 523, to: 523, duration: 0.12, gain: 0.07 },
      { kind: "tone", wave: "triangle", from: 659, to: 659, duration: 0.12, delay: 0.12, gain: 0.07 },
      { kind: "tone", wave: "triangle", from: 784, to: 784, duration: 0.12, delay: 0.24, gain: 0.07 },
      { kind: "tone", wave: "triangle", from: 1046, to: 1046, duration: 0.3, delay: 0.36, gain: 0.08 },
    ],
  },
  star: {
    layers: [{ kind: "tone", wave: "sine", from: 1200, to: 1800, duration: 0.14, gain: 0.06, glide: "exp" }],
  },
} satisfies Record<string, SoundRecipe>;
