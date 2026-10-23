import { midiToFreq, parseNotes, trackById, type ParsedNote, type Track } from "./tracks";
import type { NoiseLayer, SoundRecipe, ToneLayer, Wave } from "./types";

type ScheduledTrack = {
  track: Track;
  lead: ParsedNote[];
  bass: ParsedNote[];
  pad: ParsedNote[];
  length: number;
};

type Listener = () => void;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private pulseWave: PeriodicWave | null = null;
  private sfxEnabled = true;
  private unlocked = false;
  private lastPlayed = new Map<SoundRecipe, number>();
  private current: ScheduledTrack | null = null;
  private step = 0;
  private nextTime = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();

  get isUnlocked() {
    return this.unlocked;
  }

  get musicPlaying() {
    return this.current !== null;
  }

  get currentTrackId() {
    return this.current?.track.id ?? null;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.ratio.value = 4;
      this.master.connect(compressor);
      compressor.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.85;
      this.sfxBus.connect(this.master);
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = "lowpass";
      this.musicFilter.frequency.value = 5200;
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.musicBus.connect(this.musicFilter);
      this.musicFilter.connect(this.analyser);
      this.analyser.connect(this.master);
      this.noiseBuffer = this.createNoise();
      this.pulseWave = this.createPulse();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    if (!this.unlocked) {
      this.unlocked = true;
      this.emit();
    }
  }

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  get sfxOn() {
    return this.sfxEnabled;
  }

  getLevels(target: Uint8Array<ArrayBuffer>) {
    if (!this.analyser || !this.current) {
      target.fill(0);
      return target;
    }
    this.analyser.getByteFrequencyData(target);
    return target;
  }

  private createNoise() {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private createPulse() {
    const ctx = this.ctx!;
    const size = 32;
    const real = new Float32Array(size);
    const imag = new Float32Array(size);
    const duty = 0.25;
    for (let n = 1; n < size; n += 1) {
      imag[n] = 0;
      real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    }
    return ctx.createPeriodicWave(real, imag);
  }

  private applyWave(osc: OscillatorNode, wave: Wave) {
    if (wave === "pulse" && this.pulseWave) osc.setPeriodicWave(this.pulseWave);
    else osc.type = wave === "pulse" ? "square" : wave;
  }

  play(recipe: SoundRecipe, options: { volume?: number; pitch?: number; throttle?: number } = {}) {
    if (!this.sfxEnabled || !this.unlocked || !this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    if (options.throttle) {
      const last = this.lastPlayed.get(recipe) ?? 0;
      if (now - last < options.throttle) return;
      this.lastPlayed.set(recipe, now);
    }
    const volume = (recipe.volume ?? 1) * (options.volume ?? 1);
    const pitch = options.pitch ?? 1;
    for (const layer of recipe.layers) {
      if (layer.kind === "tone") this.playTone(layer, now, volume, pitch, this.sfxBus);
      else this.playNoise(layer, now, volume, this.sfxBus);
    }
  }

  private playTone(layer: ToneLayer, now: number, volume: number, pitch: number, bus: AudioNode) {
    const ctx = this.ctx!;
    const start = now + (layer.delay ?? 0);
    const end = start + layer.duration;
    const osc = ctx.createOscillator();
    this.applyWave(osc, layer.wave);
    const from = Math.max(20, layer.from * pitch);
    osc.frequency.setValueAtTime(from, start);
    if (layer.to) {
      const to = Math.max(20, layer.to * pitch);
      if (layer.glide === "linear") osc.frequency.linearRampToValueAtTime(to, end);
      else osc.frequency.exponentialRampToValueAtTime(to, end);
    }
    let lfo: OscillatorNode | null = null;
    if (layer.vibrato) {
      lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = layer.vibrato.rate;
      lfoGain.gain.value = layer.vibrato.depth * pitch;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(start);
      lfo.stop(end + 0.05);
    }
    const gain = ctx.createGain();
    const peak = (layer.gain ?? 0.2) * volume;
    const attack = layer.attack ?? 0.005;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    let node: AudioNode = osc;
    if (layer.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = layer.filter.type;
      filter.frequency.value = layer.filter.frequency;
      filter.Q.value = layer.filter.q ?? 1;
      osc.connect(filter);
      node = filter;
    }
    node.connect(gain);
    gain.connect(bus);
    osc.start(start);
    osc.stop(end + 0.05);
    osc.onended = () => {
      gain.disconnect();
      node.disconnect();
    };
  }

  private playNoise(layer: NoiseLayer, now: number, volume: number, bus: AudioNode) {
    const ctx = this.ctx!;
    if (!this.noiseBuffer) return;
    const start = now + (layer.delay ?? 0);
    const end = start + layer.duration;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const gain = ctx.createGain();
    const peak = (layer.gain ?? 0.2) * volume;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + (layer.attack ?? 0.004));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    let node: AudioNode = src;
    if (layer.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = layer.filter.type;
      filter.Q.value = layer.filter.q ?? 1;
      filter.frequency.setValueAtTime(layer.filter.from, start);
      if (layer.filter.to) filter.frequency.exponentialRampToValueAtTime(layer.filter.to, end);
      src.connect(filter);
      node = filter;
    }
    node.connect(gain);
    gain.connect(bus);
    src.start(start, Math.random());
    src.stop(end + 0.05);
    src.onended = () => {
      gain.disconnect();
      node.disconnect();
    };
  }

  startMusic(trackId: string) {
    this.unlock();
    if (!this.ctx || !this.musicBus) return;
    const track = trackById(trackId);
    const lead = parseNotes(track.lead.notes);
    const bass = parseNotes(track.bass.notes);
    const pad = track.pad ? parseNotes(track.pad.notes) : [];
    this.current = {
      track,
      lead,
      bass,
      pad,
      length: Math.max(lead.length, bass.length, pad.length),
    };
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    const g = this.musicBus.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setValueAtTime(g.value, this.ctx.currentTime);
    g.linearRampToValueAtTime(0.75, this.ctx.currentTime + 0.4);
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
    this.emit();
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.ctx && this.musicBus) {
      const g = this.musicBus.gain;
      g.cancelScheduledValues(this.ctx.currentTime);
      g.setValueAtTime(g.value, this.ctx.currentTime);
      g.linearRampToValueAtTime(0, this.ctx.currentTime + 0.25);
    }
    this.current = null;
    this.emit();
  }

  duckMusic(amount: number) {
    if (!this.ctx || !this.musicBus || !this.current) return;
    const g = this.musicBus.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setValueAtTime(g.value, this.ctx.currentTime);
    g.linearRampToValueAtTime(0.75 * amount, this.ctx.currentTime + 0.3);
  }

  private schedule() {
    if (!this.ctx || !this.current) return;
    const { track } = this.current;
    const stepDur = 60 / track.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.14) {
      const swing = track.swing && this.step % 2 === 1 ? stepDur * track.swing : 0;
      this.playStep(this.step, this.nextTime + swing, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % this.current.length;
    }
  }

  private playStep(step: number, time: number, stepDur: number) {
    const current = this.current!;
    const { track } = current;
    const bus = this.musicBus!;
    const voice = (note: ParsedNote | undefined, wave: Wave, gain: number, vibrato?: number) => {
      if (!note) return;
      this.musicNote(midiToFreq(note.midi), time, note.steps * stepDur * 0.95, wave, gain, bus, vibrato);
    };
    voice(current.lead[step], track.lead.wave, track.lead.gain, track.lead.vibrato);
    voice(current.bass[step], track.bass.wave, track.bass.gain);
    if (track.pad) voice(current.pad[step], track.pad.wave, track.pad.gain, 3);
    const d = step % 16;
    const dg = track.drums.gain;
    if (track.drums.kick[d] === "x") this.kick(time, dg);
    if (track.drums.snare[d] === "x") this.snare(time, dg);
    if (track.drums.hat[d] === "x") this.hat(time, dg);
  }

  private musicNote(
    freq: number,
    time: number,
    duration: number,
    wave: Wave,
    peak: number,
    bus: AudioNode,
    vibrato?: number,
  ) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    this.applyWave(osc, wave);
    osc.frequency.setValueAtTime(freq, time);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.012);
    gain.gain.setValueAtTime(peak, time + Math.max(0.02, duration * 0.6));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    let lfo: OscillatorNode | null = null;
    if (vibrato && duration > 0.25) {
      lfo = ctx.createOscillator();
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
    osc.onended = () => gain.disconnect();
  }

  private kick(time: number, level: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55 * level, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    osc.connect(gain);
    gain.connect(this.musicBus!);
    osc.start(time);
    osc.stop(time + 0.2);
    osc.onended = () => gain.disconnect();
  }

  private snare(time: number, level: number) {
    this.noiseHit(time, 0.13, 0.32 * level, "bandpass", 1800, 0.8);
  }

  private hat(time: number, level: number) {
    this.noiseHit(time, 0.035, 0.1 * level, "highpass", 7000, 0.7);
  }

  private noiseHit(
    time: number,
    duration: number,
    peak: number,
    type: BiquadFilterType,
    freq: number,
    q: number,
  ) {
    const ctx = this.ctx!;
    if (!this.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peak, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus!);
    src.start(time, Math.random());
    src.stop(time + duration + 0.02);
    src.onended = () => {
      gain.disconnect();
      filter.disconnect();
    };
  }
}

let instance: AudioEngine | null = null;

export function getAudio() {
  if (!instance) instance = new AudioEngine();
  return instance;
}

export type { AudioEngine };
