import type { SoundRecipe } from "@/lib/audio/types";

export const DOWNHILL_SFX = {
  beep: { layers: [{ kind: "tone", wave: "square", from: 520, duration: 0.09, gain: 0.07, filter: { type: "lowpass", frequency: 2400 } }] },
  go: {
    layers: [
      { kind: "tone", wave: "square", from: 780, duration: 0.2, gain: 0.08, filter: { type: "lowpass", frequency: 3000 } },
      { kind: "tone", wave: "triangle", from: 1170, duration: 0.22, gain: 0.05 },
    ],
  },
  pop: {
    layers: [
      { kind: "tone", wave: "square", from: 240, to: 560, duration: 0.11, gain: 0.06, filter: { type: "lowpass", frequency: 2000 } },
      { kind: "noise", duration: 0.05, gain: 0.06, filter: { type: "bandpass", from: 1800, to: 3200, q: 1.4 } },
    ],
  },
  lip: {
    layers: [
      { kind: "tone", wave: "triangle", from: 1320, duration: 0.09, gain: 0.06 },
      { kind: "tone", wave: "triangle", from: 1760, duration: 0.12, delay: 0.06, gain: 0.05 },
    ],
  },
  landPerfect: {
    layers: [
      { kind: "tone", wave: "sine", from: 160, to: 70, duration: 0.12, gain: 0.16 },
      { kind: "noise", duration: 0.05, gain: 0.08, filter: { type: "lowpass", from: 1200 } },
      { kind: "tone", wave: "triangle", from: 880, duration: 0.07, delay: 0.03, gain: 0.05 },
      { kind: "tone", wave: "triangle", from: 1320, duration: 0.1, delay: 0.09, gain: 0.05 },
    ],
  },
  landOk: {
    layers: [
      { kind: "tone", wave: "sine", from: 140, to: 60, duration: 0.14, gain: 0.16 },
      { kind: "noise", duration: 0.09, gain: 0.08, filter: { type: "lowpass", from: 900 } },
      { kind: "tone", wave: "sawtooth", from: 190, to: 130, duration: 0.16, delay: 0.04, gain: 0.03, filter: { type: "lowpass", frequency: 900 } },
    ],
  },
  crash: {
    layers: [
      { kind: "noise", duration: 0.32, gain: 0.2, filter: { type: "lowpass", from: 2600, to: 300 } },
      { kind: "tone", wave: "square", from: 600, to: 420, duration: 0.06, gain: 0.05, filter: { type: "lowpass", frequency: 3000 } },
      { kind: "tone", wave: "square", from: 470, to: 330, duration: 0.06, delay: 0.08, gain: 0.04, filter: { type: "lowpass", frequency: 3000 } },
      { kind: "tone", wave: "triangle", from: 1300, to: 260, duration: 0.55, delay: 0.12, gain: 0.05, glide: "linear" },
    ],
  },
  recover: { layers: [{ kind: "tone", wave: "triangle", from: 420, to: 760, duration: 0.12, gain: 0.04 }] },
  cone: {
    layers: [
      { kind: "tone", wave: "square", from: 380, to: 200, duration: 0.07, gain: 0.06, filter: { type: "lowpass", frequency: 1800 } },
      { kind: "noise", duration: 0.05, gain: 0.05, filter: { type: "bandpass", from: 1200, q: 1 } },
    ],
  },
  crate: {
    layers: [
      { kind: "noise", duration: 0.14, gain: 0.14, filter: { type: "lowpass", from: 1600, to: 400 } },
      { kind: "tone", wave: "sine", from: 120, to: 70, duration: 0.12, gain: 0.12 },
    ],
  },
  line: { layers: [{ kind: "noise", duration: 0.18, gain: 0.08, filter: { type: "bandpass", from: 2400, to: 900, q: 2 } }] },
  shortcut: {
    layers: [
      { kind: "tone", wave: "square", from: 660, duration: 0.08, gain: 0.05, filter: { type: "lowpass", frequency: 2600 } },
      { kind: "tone", wave: "square", from: 880, duration: 0.08, delay: 0.08, gain: 0.05, filter: { type: "lowpass", frequency: 2600 } },
      { kind: "tone", wave: "square", from: 1320, duration: 0.14, delay: 0.16, gain: 0.05, filter: { type: "lowpass", frequency: 2600 } },
    ],
  },
  vroom: {
    layers: [
      { kind: "tone", wave: "sawtooth", from: 110, to: 300, duration: 0.7, gain: 0.11, attack: 0.04, vibrato: { rate: 30, depth: 14 }, filter: { type: "lowpass", frequency: 2400, q: 2 } },
      { kind: "tone", wave: "square", from: 220, to: 600, duration: 0.6, gain: 0.04, attack: 0.05, vibrato: { rate: 30, depth: 24 }, filter: { type: "lowpass", frequency: 3000 } },
      { kind: "noise", duration: 0.45, gain: 0.03, attack: 0.08, filter: { type: "bandpass", from: 600, to: 2400, q: 0.9 } },
    ],
  },
  tier: { layers: [{ kind: "noise", duration: 0.28, gain: 0.05, attack: 0.08, filter: { type: "bandpass", from: 600, to: 2600, q: 1.2 } }] },
  pause: { layers: [{ kind: "tone", wave: "triangle", from: 600, to: 400, duration: 0.08, gain: 0.04 }] },
  passUp: {
    layers: [
      { kind: "tone", wave: "square", from: 660, duration: 0.07, gain: 0.05, filter: { type: "lowpass", frequency: 2600 } },
      { kind: "tone", wave: "square", from: 990, duration: 0.12, delay: 0.07, gain: 0.05, filter: { type: "lowpass", frequency: 2600 } },
    ],
  },
  passDown: {
    layers: [
      { kind: "tone", wave: "square", from: 520, duration: 0.07, gain: 0.04, filter: { type: "lowpass", frequency: 1800 } },
      { kind: "tone", wave: "square", from: 350, duration: 0.14, delay: 0.07, gain: 0.04, filter: { type: "lowpass", frequency: 1800 } },
    ],
  },
  spin: { layers: [{ kind: "noise", duration: 0.16, gain: 0.05, attack: 0.04, filter: { type: "bandpass", from: 500, to: 1400, q: 2.5 } }] },
  touch: { layers: [{ kind: "noise", duration: 0.04, gain: 0.04, filter: { type: "lowpass", from: 700 } }] },
  charged: { layers: [{ kind: "tone", wave: "triangle", from: 900, to: 1200, duration: 0.06, gain: 0.03 }] },
  bounce: {
    layers: [
      { kind: "tone", wave: "sine", from: 140, to: 90, duration: 0.12, gain: 0.12 },
      { kind: "noise", duration: 0.06, gain: 0.05, filter: { type: "lowpass", from: 900 } },
    ],
  },
  flutter: { layers: [{ kind: "noise", duration: 0.5, gain: 0.05, attack: 0.03, filter: { type: "bandpass", from: 1400, to: 2600, q: 1.6 } }] },
  splat: {
    layers: [
      { kind: "noise", duration: 0.12, gain: 0.1, filter: { type: "lowpass", from: 1400, to: 400 } },
      { kind: "tone", wave: "sine", from: 220, to: 110, duration: 0.1, gain: 0.08 },
    ],
  },
} satisfies Record<string, SoundRecipe>;

export function boing(combo: number): SoundRecipe {
  const lift = Math.min(combo, 8) * 60;
  return {
    layers: [
      { kind: "tone", wave: "sine", from: 180 + lift, to: 520 + lift * 1.5, duration: 0.18, gain: 0.1 },
      { kind: "tone", wave: "triangle", from: 360 + lift, to: 900 + lift, duration: 0.14, delay: 0.02, gain: 0.04 },
    ],
  };
}

export function rollGrain(speed: number, cobbles: boolean, crouch: boolean): SoundRecipe {
  const s = speed < 0 ? 0 : speed > 2600 ? 2600 : speed;
  const center = 160 + s * 0.42;
  const gain = 0.01 + s * 0.00002;
  const layers: SoundRecipe["layers"] = [
    { kind: "noise", duration: 0.09, gain, attack: 0.02, filter: { type: "bandpass", from: center, q: 0.9 } },
    { kind: "tone", wave: "triangle", from: 55 + s * 0.05, duration: 0.09, gain: 0.006 + s * 0.000008, attack: 0.03 },
  ];
  if (cobbles) {
    layers.push({ kind: "tone", wave: "square", from: crouch ? 70 : 95, duration: 0.025, gain: crouch ? 0.02 : 0.045, filter: { type: "lowpass", frequency: 600 } });
    layers.push({ kind: "noise", duration: 0.03, delay: 0.035, gain: crouch ? 0.015 : 0.03, filter: { type: "lowpass", from: 700 } });
  }
  return { layers };
}

export function windGrain(speed: number): SoundRecipe {
  const amount = speed < 900 ? 0 : Math.min(1.4, (speed - 900) / 1300);
  return { layers: [{ kind: "noise", duration: 0.16, gain: 0.004 + amount * 0.02, attack: 0.05, filter: { type: "bandpass", from: 900 + amount * 1800, q: 0.7 } }] };
}

export const PADDLE: SoundRecipe = { layers: [{ kind: "noise", duration: 0.06, gain: 0.04, filter: { type: "lowpass", from: 900, to: 300 } }] };
