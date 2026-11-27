import { parseNotes } from "@/lib/audio/tracks";
import { beatMsAt, STEPS_PER_BAR, timeOf, type ChartNote, type CompiledSong, type Signal, type TapSound } from "../song/notation";
import { agogo, bucket, click, crowd, fridge, hat, hiss, keysOn, kick, midiToFreq, note, shaker, snare, type Cheer, type Stage } from "./voices";

const LOOKAHEAD = 0.2;
const SIGNAL_CUTOFF: Record<Signal, number> = { clear: 5200, weak: 2000, lost: 1300 };
const SIGNAL_HISS: Record<Signal, number> = { clear: 0, weak: 0.035, lost: 0.09 };
const PLATE_TONES = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84];
const CHEERS: readonly Cheer[] = [
  { mood: "aww", shouts: 8, claps: 10, seconds: 1.6, whistles: 0, level: 0.85 },
  { mood: "cheer", shouts: 5, claps: 40, seconds: 2, whistles: 0, level: 1.1 },
  { mood: "cheer", shouts: 14, claps: 100, seconds: 2.6, whistles: 1, level: 0.95 },
  { mood: "cheer", shouts: 22, claps: 150, seconds: 3.2, whistles: 2, level: 1 },
];

type Cue = { at: number; play: (time: number) => void; skippable: boolean };
type Shake = { at: number; gain: GainNode; on: boolean };

export function pitched(sound: TapSound): sound is "keys" | "fridge" {
  return sound === "keys" || sound === "fridge";
}

export function onBeatSound(sound: TapSound) {
  return sound === "shaker";
}

export function onBeat(compiled: CompiledSong, note: ChartNote) {
  return note.kind === "tap" && onBeatSound(compiled.song.segments[compiled.segmentOfBar[note.bar]].tap);
}

export function toneFreq(midi: number | null) {
  let m = midi ?? 72;
  while (m < 64) m += 12;
  while (m > 84) m -= 12;
  return midiToFreq(m);
}

export class SongPlayer {
  private readonly music: GainNode;
  private readonly filter: BiquadFilterNode;
  private readonly sfx: GainNode;
  private readonly cues: Cue[] = [];
  private next = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private t0 = 0;
  private held: (() => void) | null = null;
  private readonly shakes = new Map<number, Shake>();
  private live = true;
  private from = 0;

  constructor(
    private readonly stage: Stage,
    private readonly compiled: CompiledSong,
  ) {
    const { ctx } = stage;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = SIGNAL_CUTOFF.clear;
    this.music = ctx.createGain();
    this.music.gain.value = 0.75;
    this.music.connect(this.filter);
    this.filter.connect(stage.out);
    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.9;
    this.sfx.connect(stage.out);
    this.buildCues();
  }

  private at(step: number) {
    return timeOf(this.compiled, step) / 1000;
  }

  private buildCues() {
    const { song, barStart } = this.compiled;
    const stage = this.stage;
    for (const voice of song.voices) {
      if (voice.guide) continue;
      parseNotes(voice.notes).forEach((parsed, step) => {
        if (!parsed) return;
        const freq = midiToFreq(parsed.midi);
        const duration = Math.max(0.05, this.at(step + parsed.steps) - this.at(step)) * 0.95;
        this.cues.push({ at: this.at(step), skippable: true, play: (t) => note(stage, this.music, freq, t, duration, voice.wave, voice.gain, voice.vibrato) });
      });
    }
    for (let bar = 0; bar < this.compiled.bars; bar += 1) {
      const kit = song.drums.kits[song.drums.bars[bar]];
      if (!kit) continue;
      const level = kit.gain ?? song.drums.gain;
      for (let d = 0; d < STEPS_PER_BAR; d += 1) {
        const at = this.at(bar * STEPS_PER_BAR + d);
        if (kit.kick[d] === "x") this.cues.push({ at, skippable: true, play: (t) => kick(stage, this.music, t, level) });
        if (kit.snare[d] === "x") this.cues.push({ at, skippable: true, play: (t) => snare(stage, this.music, t, level) });
        if (kit.hat[d] === "x") this.cues.push({ at, skippable: true, play: (t) => hat(stage, this.music, t, level) });
        const bell = kit.bell?.[d];
        if (bell === "h" || bell === "l") this.cues.push({ at, skippable: true, play: (t) => agogo(stage, this.music, t, level, bell === "h") });
      }
    }
    for (const n of this.compiled.notes) {
      if (onBeat(this.compiled, n)) this.cues.push({ at: n.at / 1000, skippable: true, play: (t) => this.shake(n.index, t) });
    }
    for (const call of this.compiled.calls) {
      const freq = toneFreq(this.compiled.tones[call.step]);
      this.cues.push({ at: call.at / 1000, skippable: true, play: (t) => fridge(stage, this.sfx, t, freq) });
    }
    this.compiled.signal.forEach((state, bar) => {
      const at = barStart[bar] / 1000;
      const length = (barStart[bar + 1] - barStart[bar]) / 1000;
      this.cues.push({ at, skippable: false, play: (t) => this.filter.frequency.setTargetAtTime(SIGNAL_CUTOFF[state], t, 0.04) });
      if (SIGNAL_HISS[state] > 0) this.cues.push({ at, skippable: true, play: (t) => hiss(stage, this.sfx, t, length, SIGNAL_HISS[state]) });
    });
    this.cues.sort((a, b) => a.at - b.at);
  }

  start(fromMs = 0, extraLead = 0.15) {
    const { ctx } = this.stage;
    const beat = beatMsAt(this.compiled, fromMs) / 1000;
    this.t0 = ctx.currentTime + extraLead + beat * 4 - fromMs / 1000;
    for (let k = 1; k <= 4; k += 1) click(this.stage, this.sfx, this.t0 + fromMs / 1000 - k * beat, k === 4);
    const from = fromMs / 1000 - 0.001;
    this.from = from;
    this.next = 0;
    while (this.next < this.cues.length && this.cues[this.next].at < from) {
      const cue = this.cues[this.next];
      if (!cue.skippable) cue.play(ctx.currentTime);
      this.next += 1;
    }
    this.timer = setInterval(() => this.tick(), 25);
    this.tick();
    return this.t0;
  }

  countInMs(fromMs = 0) {
    return beatMsAt(this.compiled, fromMs) * 4;
  }

  private tick() {
    const horizon = this.stage.ctx.currentTime + LOOKAHEAD;
    while (this.next < this.cues.length && this.t0 + this.cues[this.next].at < horizon) {
      const cue = this.cues[this.next];
      this.next += 1;
      cue.play(Math.max(this.stage.ctx.currentTime, this.t0 + cue.at));
    }
    if (this.next >= this.cues.length && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private shake(index: number, time: number) {
    const { ctx } = this.stage;
    const gain = ctx.createGain();
    gain.gain.value = this.live ? 1 : 0;
    gain.connect(this.sfx);
    shaker(this.stage, gain, time, 1);
    for (const [i, old] of this.shakes) if (old.at < ctx.currentTime - 1) this.shakes.delete(i);
    this.shakes.set(index, { at: time, gain, on: this.live });
    window.setTimeout(() => gain.disconnect(), (time - ctx.currentTime + 0.5) * 1000);
  }

  private setLive(on: boolean) {
    if (this.live === on) return;
    this.live = on;
    const now = this.stage.ctx.currentTime;
    for (const s of this.shakes.values()) {
      if (s.at <= now || s.on === on) continue;
      s.on = on;
      s.gain.gain.setValueAtTime(on ? 1 : 0, now);
    }
  }

  hitOnBeat(note: ChartNote) {
    this.lift();
    this.setLive(true);
    const s = this.shakes.get(note.index);
    return s ? s.on : note.at / 1000 >= this.from;
  }

  missOnBeat() {
    this.setLive(false);
  }

  press(sound: TapSound, freq: number) {
    const now = this.stage.ctx.currentTime;
    this.held?.();
    this.held = null;
    if (sound === "fridge") fridge(this.stage, this.sfx, now, freq, 0.9);
    else if (sound === "shaker") shaker(this.stage, this.sfx, now, 1);
    else if (sound === "keys") this.held = keysOn(this.stage, this.sfx, now, freq);
    else bucket(this.stage, this.sfx, now, 1);
  }

  lift() {
    this.held?.();
    this.held = null;
  }

  plates(grades: number[], gapSeconds: number) {
    const now = this.stage.ctx.currentTime + 0.05;
    grades.forEach((grade, i) => note(this.stage, this.sfx, midiToFreq(PLATE_TONES[Math.max(0, Math.min(10, grade))]), now + i * gapSeconds, 0.7, "triangle", 0.12, 5));
  }

  sting(notes: number[], stepSeconds: number) {
    const now = this.stage.ctx.currentTime + 0.05;
    notes.forEach((midi, i) => note(this.stage, this.sfx, midiToFreq(midi), now + i * stepSeconds, stepSeconds * 1.6, "triangle", 0.14, 5));
  }

  cheer(stars: number) {
    crowd(this.stage, this.sfx, this.stage.ctx.currentTime + 0.08, CHEERS[Math.max(0, Math.min(CHEERS.length - 1, stars))]);
  }

  stop(fade = 0.15) {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.lift();
    const { ctx } = this.stage;
    const gain = this.music.gain;
    gain.cancelScheduledValues(ctx.currentTime);
    gain.setValueAtTime(gain.value, ctx.currentTime);
    gain.linearRampToValueAtTime(0, ctx.currentTime + fade);
    window.setTimeout(() => {
      this.music.disconnect();
      this.filter.disconnect();
    }, (fade + 1.5) * 1000);
  }

  dispose() {
    this.stop(0.05);
    const { ctx } = this.stage;
    const gain = this.sfx.gain;
    gain.cancelScheduledValues(ctx.currentTime);
    gain.setValueAtTime(gain.value, ctx.currentTime);
    gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
    window.setTimeout(() => this.sfx.disconnect(), 3000);
  }
}

export class AudibleClock {
  private offset: number | null = null;

  constructor(private readonly ctx: AudioContext) {}

  private raw() {
    const ts = typeof this.ctx.getOutputTimestamp === "function" ? this.ctx.getOutputTimestamp() : null;
    if (ts && ts.contextTime && ts.performanceTime && ts.contextTime > 0 && ts.performanceTime > 0) return ts.contextTime - ts.performanceTime / 1000;
    const latency = this.ctx.outputLatency || this.ctx.baseLatency || 0;
    return this.ctx.currentTime - latency - performance.now() / 1000;
  }

  sample() {
    const raw = this.raw();
    if (this.offset === null || Math.abs(raw - this.offset) > 0.04) this.offset = raw;
    else this.offset += (raw - this.offset) * 0.08;
  }

  at(perfMs: number) {
    if (this.offset === null) this.sample();
    return perfMs / 1000 + (this.offset ?? 0);
  }
}
