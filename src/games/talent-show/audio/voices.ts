import type { Wave } from "@/lib/audio/types";

export type Stage = { ctx: AudioContext; out: AudioNode; noise: AudioBuffer; pulse: PeriodicWave | null };

function oscillator(stage: Stage, wave: Wave) {
  const osc = stage.ctx.createOscillator();
  if (wave === "pulse" && stage.pulse) osc.setPeriodicWave(stage.pulse);
  else osc.type = wave === "pulse" ? "square" : wave;
  return osc;
}

function release(nodes: AudioNode[]) {
  return () => nodes.forEach((n) => n.disconnect());
}

export function midiToFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function note(stage: Stage, bus: AudioNode, freq: number, time: number, duration: number, wave: Wave, peak: number, vibrato?: number) {
  const { ctx } = stage;
  const osc = oscillator(stage, wave);
  osc.frequency.setValueAtTime(freq, time);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.012);
  gain.gain.setValueAtTime(peak, time + Math.max(0.02, duration * 0.6));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  if (vibrato && duration > 0.25) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = vibrato;
    depth.gain.setValueAtTime(0, time);
    depth.gain.linearRampToValueAtTime(freq * 0.012, time + duration * 0.6);
    lfo.connect(depth);
    depth.connect(osc.frequency);
    lfo.start(time);
    lfo.stop(time + duration + 0.05);
  }
  osc.connect(gain);
  gain.connect(bus);
  osc.start(time);
  osc.stop(time + duration + 0.05);
  osc.onended = release([gain]);
}

function noiseHit(stage: Stage, bus: AudioNode, time: number, duration: number, peak: number, type: BiquadFilterType, freq: number, q: number) {
  const { ctx } = stage;
  const src = ctx.createBufferSource();
  src.buffer = stage.noise;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  src.start(time, (time * 7.31) % 1);
  src.stop(time + duration + 0.02);
  src.onended = release([gain, filter]);
}

function thump(stage: Stage, bus: AudioNode, time: number, from: number, to: number, duration: number, peak: number) {
  const { ctx } = stage;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, time);
  osc.frequency.exponentialRampToValueAtTime(to, time + duration * 0.7);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain);
  gain.connect(bus);
  osc.start(time);
  osc.stop(time + duration + 0.02);
  osc.onended = release([gain]);
}

export function kick(stage: Stage, bus: AudioNode, time: number, level: number) {
  thump(stage, bus, time, 140, 45, 0.18, 0.55 * level);
}

export function snare(stage: Stage, bus: AudioNode, time: number, level: number) {
  noiseHit(stage, bus, time, 0.13, 0.32 * level, "bandpass", 1800, 0.8);
}

export function hat(stage: Stage, bus: AudioNode, time: number, level: number) {
  noiseHit(stage, bus, time, 0.035, 0.1 * level, "highpass", 7000, 0.7);
}

export function agogo(stage: Stage, bus: AudioNode, time: number, level: number, high: boolean) {
  const { ctx } = stage;
  const freq = high ? 1047 : 784;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.34 * level, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
  const ringGain = ctx.createGain();
  ringGain.gain.setValueAtTime(0.3, time);
  ringGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 500;
  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.value = freq;
  const ring = ctx.createOscillator();
  ring.type = "square";
  ring.frequency.value = freq * 2.76;
  body.connect(filter);
  ring.connect(ringGain);
  ringGain.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  body.start(time);
  ring.start(time);
  body.stop(time + 0.24);
  ring.stop(time + 0.24);
  body.onended = release([gain, filter, ringGain]);
}

export function bucket(stage: Stage, bus: AudioNode, time: number, level = 1) {
  thump(stage, bus, time, 210, 70, 0.14, 0.5 * level);
  noiseHit(stage, bus, time, 0.05, 0.22 * level, "bandpass", 950, 1.4);
}

export function fridge(stage: Stage, bus: AudioNode, time: number, freq: number, level = 1) {
  const { ctx } = stage;
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, time);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.94, time + 0.09);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1600;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.13 * level, time + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  osc.start(time);
  osc.stop(time + 0.13);
  osc.onended = release([gain, filter]);
  noiseHit(stage, bus, time, 0.025, 0.16 * level, "highpass", 3200, 0.9);
  const hum = ctx.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = 55;
  const humFilter = ctx.createBiquadFilter();
  humFilter.type = "lowpass";
  humFilter.frequency.value = 260;
  const humGain = ctx.createGain();
  humGain.gain.setValueAtTime(0.0001, time);
  humGain.gain.exponentialRampToValueAtTime(0.06 * level, time + 0.01);
  humGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  hum.connect(humFilter);
  humFilter.connect(humGain);
  humGain.connect(bus);
  hum.start(time);
  hum.stop(time + 0.18);
  hum.onended = release([humGain, humFilter]);
}

export function click(stage: Stage, bus: AudioNode, time: number, accent: boolean) {
  const { ctx } = stage;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = accent ? 1760 : 1180;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.3, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain);
  gain.connect(bus);
  osc.start(time);
  osc.stop(time + 0.06);
  osc.onended = release([gain]);
}

export function hiss(stage: Stage, bus: AudioNode, time: number, duration: number, level: number) {
  const { ctx } = stage;
  const src = ctx.createBufferSource();
  src.buffer = stage.noise;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3800;
  filter.Q.value = 0.5;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(level, time + 0.08);
  gain.gain.setValueAtTime(level, time + Math.max(0.1, duration - 0.12));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  src.start(time);
  src.stop(time + duration + 0.05);
  src.onended = release([gain, filter]);
}

export function shaker(stage: Stage, bus: AudioNode, time: number, level = 1) {
  noiseHit(stage, bus, time, 0.07, 0.3 * level, "highpass", 5200, 0.8);
  noiseHit(stage, bus, time + 0.014, 0.05, 0.14 * level, "bandpass", 8200, 1.2);
}

export function keysOn(stage: Stage, bus: AudioNode, time: number, freq: number) {
  const { ctx } = stage;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.12, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.08, time + 0.25);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2600;
  const a = oscillator(stage, "pulse");
  const b = ctx.createOscillator();
  b.type = "triangle";
  a.frequency.value = freq;
  b.frequency.value = freq * 2.003;
  const mix = ctx.createGain();
  mix.gain.value = 0.35;
  a.connect(filter);
  b.connect(mix);
  mix.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  a.start(time);
  b.start(time);
  let stopped = false;
  const stop = (at = ctx.currentTime) => {
    if (stopped) return;
    stopped = true;
    const t = Math.max(at, ctx.currentTime);
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    a.stop(t + 0.12);
    b.stop(t + 0.12);
    a.onended = release([gain, filter, mix]);
  };
  window.setTimeout(() => stop(), 8000);
  return stop;
}

export type Cheer = { mood: "cheer" | "aww"; shouts: number; claps: number; seconds: number; whistles: number; level: number };

const VOWEL: Record<Cheer["mood"], readonly (readonly [number, number, number])[]> = {
  cheer: [
    [480, 5, 1],
    [2150, 8, 0.7],
    [2950, 9, 0.3],
  ],
  aww: [
    [560, 5, 1],
    [900, 7, 0.75],
    [2500, 9, 0.12],
  ],
};

function whistle(stage: Stage, bus: AudioNode, time: number) {
  const { ctx } = stage;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1500, time);
  osc.frequency.exponentialRampToValueAtTime(2600, time + 0.14);
  osc.frequency.setValueAtTime(1700, time + 0.22);
  osc.frequency.exponentialRampToValueAtTime(2800, time + 0.36);
  osc.frequency.exponentialRampToValueAtTime(1900, time + 0.6);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.05, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  gain.gain.setValueAtTime(0.0001, time + 0.22);
  gain.gain.exponentialRampToValueAtTime(0.05, time + 0.25);
  gain.gain.setValueAtTime(0.05, time + 0.42);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.62);
  osc.connect(gain);
  gain.connect(bus);
  osc.start(time);
  osc.stop(time + 0.65);
  osc.onended = release([gain]);
}

export function crowd(stage: Stage, bus: AudioNode, time: number, cheer: Cheer) {
  const { ctx } = stage;
  const rise = cheer.mood === "cheer";
  const out = ctx.createGain();
  out.gain.value = cheer.level;
  out.connect(bus);
  const throat = ctx.createGain();
  const shared: AudioNode[] = [out, throat];
  for (const [freq, q, level] of VOWEL[cheer.mood]) {
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = freq;
    band.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = level;
    throat.connect(band);
    band.connect(gain);
    gain.connect(out);
    shared.push(band, gain);
  }
  for (let i = 0; i < cheer.shouts; i += 1) {
    const start = time + Math.random() * 0.25;
    const length = cheer.seconds * (0.55 + Math.random() * 0.45);
    const base = 240 + Math.random() * 320;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(base * (rise ? 0.78 : 1.12), start);
    osc.frequency.exponentialRampToValueAtTime(base, start + 0.16);
    osc.frequency.exponentialRampToValueAtTime(base * (rise ? 1.06 : 0.72), start + length);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 4.5 + Math.random() * 2.5;
    const depth = ctx.createGain();
    depth.gain.value = base * 0.022;
    lfo.connect(depth);
    depth.connect(osc.frequency);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.11, start + 0.08);
    gain.gain.setValueAtTime(0.11, start + length * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain);
    gain.connect(throat);
    osc.start(start);
    lfo.start(start);
    osc.stop(start + length + 0.05);
    lfo.stop(start + length + 0.05);
    osc.onended = release([gain, depth, lfo]);
  }
  const air = ctx.createBufferSource();
  air.buffer = stage.noise;
  air.loop = true;
  const breath = ctx.createGain();
  breath.gain.setValueAtTime(0.0001, time);
  breath.gain.exponentialRampToValueAtTime(0.26, time + 0.2);
  breath.gain.setValueAtTime(0.26, time + cheer.seconds * 0.6);
  breath.gain.exponentialRampToValueAtTime(0.0001, time + cheer.seconds);
  air.connect(breath);
  breath.connect(throat);
  air.start(time);
  air.stop(time + cheer.seconds + 0.6);
  air.onended = release([breath, ...shared]);
  for (let i = 0; i < cheer.claps; i += 1) {
    const k = Math.pow(Math.random(), 1.6);
    noiseHit(stage, out, time + 0.04 + k * cheer.seconds, 0.018 + Math.random() * 0.02, 0.34 * (1 - k * 0.55), "bandpass", 1000 + Math.random() * 1600, 1.2);
  }
  for (let w = 0; w < cheer.whistles; w += 1) whistle(stage, out, time + 0.3 + w * 0.55 + Math.random() * 0.2);
}
