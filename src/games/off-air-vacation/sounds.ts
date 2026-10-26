import type { SoundRecipe } from "@/lib/audio/types";

export const RESORT_SFX = {
  step: { layers: [{ kind: "noise", duration: 0.03, gain: 0.03, filter: { type: "lowpass", from: 900 } }] },
  stepSand: { layers: [{ kind: "noise", duration: 0.05, gain: 0.035, filter: { type: "bandpass", from: 1600, q: 0.8 } }] },
  stepWood: { layers: [{ kind: "tone", wave: "triangle", from: 180, to: 120, duration: 0.05, gain: 0.04 }] },
  blip: { layers: [{ kind: "tone", wave: "square", from: 520, duration: 0.035, gain: 0.025, filter: { type: "lowpass", frequency: 2400 } }] },
  blipSoft: { layers: [{ kind: "tone", wave: "sine", from: 760, duration: 0.05, gain: 0.04 }] },
  open: {
    layers: [
      { kind: "tone", wave: "triangle", from: 440, to: 660, duration: 0.08, gain: 0.06 },
      { kind: "noise", duration: 0.06, gain: 0.03, filter: { type: "highpass", from: 2400 } },
    ],
  },
  close: { layers: [{ kind: "tone", wave: "triangle", from: 620, to: 400, duration: 0.08, gain: 0.05 }] },
  select: { layers: [{ kind: "tone", wave: "pulse", from: 880, duration: 0.05, gain: 0.05 }] },
  pick: {
    layers: [
      { kind: "tone", wave: "triangle", from: 660, duration: 0.07, gain: 0.08 },
      { kind: "tone", wave: "triangle", from: 880, duration: 0.07, delay: 0.07, gain: 0.08 },
      { kind: "tone", wave: "triangle", from: 1320, duration: 0.14, delay: 0.14, gain: 0.08 },
    ],
  },
  quest: {
    layers: [
      { kind: "tone", wave: "pulse", from: 523, duration: 0.09, gain: 0.07 },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.16, delay: 0.09, gain: 0.07 },
    ],
  },
  poster: {
    layers: [
      { kind: "noise", duration: 0.12, gain: 0.05, filter: { type: "bandpass", from: 2400, q: 1 } },
      { kind: "tone", wave: "triangle", from: 988, duration: 0.1, delay: 0.06, gain: 0.06 },
      { kind: "tone", wave: "triangle", from: 1319, duration: 0.18, delay: 0.14, gain: 0.06 },
    ],
  },
  door: {
    layers: [
      { kind: "noise", duration: 0.2, gain: 0.06, filter: { type: "lowpass", from: 800, to: 300 } },
      { kind: "tone", wave: "sine", from: 220, to: 160, duration: 0.18, gain: 0.05 },
    ],
  },
  bell: {
    layers: [
      { kind: "tone", wave: "sine", from: 2093, duration: 0.7, gain: 0.09, vibrato: { rate: 6, depth: 6 } },
      { kind: "tone", wave: "sine", from: 3136, duration: 0.4, gain: 0.03 },
    ],
  },
  whistle: {
    layers: [
      { kind: "tone", wave: "sine", from: 2600, to: 2500, duration: 0.6, gain: 0.09, vibrato: { rate: 32, depth: 160 } },
      { kind: "noise", duration: 0.6, gain: 0.02, filter: { type: "bandpass", from: 2600, q: 6 } },
    ],
  },
  splash: {
    layers: [
      { kind: "noise", duration: 0.35, gain: 0.08, attack: 0.02, filter: { type: "lowpass", from: 1800, to: 400 } },
      { kind: "tone", wave: "sine", from: 320, to: 160, duration: 0.2, gain: 0.04 },
    ],
  },
  wave: { layers: [{ kind: "noise", duration: 1.6, gain: 0.05, attack: 0.6, filter: { type: "lowpass", from: 900, to: 500 } }] },
  gull: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 1200, to: 1700, duration: 0.12, gain: 0.025, filter: { type: "lowpass", frequency: 2600 } },
      { kind: "tone", wave: "sawtooth", from: 1700, to: 1100, duration: 0.18, delay: 0.13, gain: 0.025, filter: { type: "lowpass", frequency: 2600 } },
    ],
  },
  bird: {
    layers: [
      { kind: "tone", wave: "sine", from: 2400, to: 3200, duration: 0.07, gain: 0.03 },
      { kind: "tone", wave: "sine", from: 2800, to: 3600, duration: 0.07, delay: 0.1, gain: 0.03 },
    ],
  },
  cricket: { layers: [{ kind: "tone", wave: "square", from: 4200, duration: 0.18, gain: 0.008, vibrato: { rate: 40, depth: 300 } }] },
  waterfall: { layers: [{ kind: "noise", duration: 2.4, gain: 0.03, attack: 0.5, filter: { type: "bandpass", from: 1400, q: 0.5 } }] },
  arcadeBeep: { layers: [{ kind: "tone", wave: "square", from: 880, to: 1320, duration: 0.08, gain: 0.02, filter: { type: "lowpass", frequency: 3000 } }] },
  arcadeBoop: { layers: [{ kind: "tone", wave: "square", from: 330, to: 220, duration: 0.1, gain: 0.02, filter: { type: "lowpass", frequency: 2000 } }] },
  tick: { layers: [{ kind: "tone", wave: "triangle", from: 1800, duration: 0.02, gain: 0.04 }] },
  hum: { layers: [{ kind: "tone", wave: "sawtooth", from: 60, duration: 1.4, gain: 0.015, filter: { type: "lowpass", frequency: 300 } }] },
  pause: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 420, to: 60, duration: 0.45, gain: 0.06, glide: "exp", filter: { type: "lowpass", frequency: 1600 } },
      { kind: "noise", duration: 0.3, gain: 0.05, filter: { type: "highpass", from: 3000 } },
    ],
  },
  play: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 60, to: 420, duration: 0.35, gain: 0.05, glide: "exp", filter: { type: "lowpass", frequency: 1600 } },
    ],
  },
  catch: { layers: [{ kind: "tone", wave: "square", from: 660, to: 990, duration: 0.07, gain: 0.05, filter: { type: "lowpass", frequency: 3000 } }] },
  hurt: { layers: [{ kind: "noise", duration: 0.18, gain: 0.07, filter: { type: "bandpass", from: 1200, q: 0.7 } }] },
  win: {
    layers: [
      { kind: "tone", wave: "pulse", from: 523, duration: 0.1, gain: 0.08 },
      { kind: "tone", wave: "pulse", from: 659, duration: 0.1, delay: 0.1, gain: 0.08 },
      { kind: "tone", wave: "pulse", from: 784, duration: 0.1, delay: 0.2, gain: 0.08 },
      { kind: "tone", wave: "pulse", from: 1047, duration: 0.3, delay: 0.3, gain: 0.08 },
    ],
  },
  bars: { layers: [{ kind: "tone", wave: "sine", from: 1000, duration: 1.2, gain: 0.06 }] },
  firework: {
    layers: [
      { kind: "noise", duration: 0.4, gain: 0.08, filter: { type: "lowpass", from: 2400, to: 200 } },
      { kind: "tone", wave: "sine", from: 120, to: 60, duration: 0.3, gain: 0.08 },
    ],
  },
  snore: { layers: [{ kind: "noise", duration: 0.8, gain: 0.025, attack: 0.3, filter: { type: "lowpass", from: 400, to: 200 } }] },
  kick: { layers: [{ kind: "tone", wave: "sine", from: 220, to: 520, duration: 0.14, gain: 0.07, glide: "exp" }] },
  meow: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 600, to: 900, duration: 0.12, gain: 0.03, filter: { type: "lowpass", frequency: 2000 } },
      { kind: "tone", wave: "sawtooth", from: 900, to: 500, duration: 0.22, delay: 0.12, gain: 0.03, filter: { type: "lowpass", frequency: 1800 } },
    ],
  },
} satisfies Record<string, SoundRecipe>;

export type ResortSfx = keyof typeof RESORT_SFX;
