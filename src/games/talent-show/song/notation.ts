import { parseNotes } from "@/lib/audio/tracks";
import type { Wave } from "@/lib/audio/types";

export type SongId = "theme" | "signoff" | "recess" | "street" | "static" | "medley";
export type RoundId = "heats" | "semifinal" | "final";
export type BandMember = "deco" | "lina" | "bruno" | "mila" | "404";
export type TapSound = "bucket" | "keys" | "fridge" | "shaker";
export type Signal = "clear" | "weak" | "lost";
export type NoteKind = "tap" | "hold" | "call" | "echo";

export type Voice = { wave: Wave; gain: number; vibrato?: number; notes: string; guide?: boolean };
export type DrumKit = { kick: string; snare: string; hat: string; bell?: string; gain?: number };
export type Segment = { from: number; bpm: number; swing?: number; featured: BandMember; tap: TapSound; source?: SongId };

export type Song = {
  id: SongId;
  segments: Segment[];
  voices: Voice[];
  drums: { gain: number; kits: Record<string, DrumKit>; bars: string };
  chart: string;
  signal?: string;
  sections: number[];
};

export type ChartNote = { index: number; step: number; bar: number; at: number; end: number; kind: NoteKind };

export type CompiledSong = {
  song: Song;
  bars: number;
  barStart: number[];
  notes: ChartNote[];
  calls: ChartNote[];
  endMs: number;
  sections: { from: number; to: number; endMs: number }[];
  signal: Signal[];
  segmentOfBar: number[];
  tones: (number | null)[];
};

export const STEPS_PER_BAR = 16;

const SIGNAL: Record<string, Signal> = { ".": "clear", "~": "weak", "#": "lost" };

export const bars = (...parts: string[]) => parts.join(" ");

export function segmentFor(song: Song, bar: number) {
  let index = 0;
  song.segments.forEach((s, i) => {
    if (s.from <= bar) index = i;
  });
  return index;
}

export function stepMsAt(compiled: CompiledSong, bar: number) {
  return 60000 / compiled.song.segments[compiled.segmentOfBar[Math.min(bar, compiled.bars - 1)]].bpm / 4;
}

export function timeOf(compiled: CompiledSong, step: number) {
  const bar = Math.floor(step / STEPS_PER_BAR);
  if (bar >= compiled.bars) return compiled.endMs;
  const inBar = step - bar * STEPS_PER_BAR;
  const segment = compiled.song.segments[compiled.segmentOfBar[bar]];
  const stepMs = 60000 / segment.bpm / 4;
  return compiled.barStart[bar] + inBar * stepMs + (segment.swing && inBar % 2 === 1 ? segment.swing * stepMs : 0);
}

export function barAt(compiled: CompiledSong, ms: number) {
  if (ms < 0) return Math.floor(ms / (stepMsAt(compiled, 0) * STEPS_PER_BAR));
  let bar = 0;
  while (bar < compiled.bars && compiled.barStart[bar + 1] <= ms) bar += 1;
  return bar;
}

export function beatMsAt(compiled: CompiledSong, ms: number) {
  return stepMsAt(compiled, Math.max(0, barAt(compiled, ms))) * 4;
}

export function signalAt(compiled: CompiledSong, ms: number): Signal {
  const bar = barAt(compiled, ms);
  return compiled.signal[bar] ?? "clear";
}

export function compileSong(song: Song): CompiledSong {
  const cells = song.chart.replace(/\s+/g, "");
  if (cells.length % STEPS_PER_BAR !== 0) throw new Error(`${song.id}: chart has ${cells.length} steps`);
  const barCount = cells.length / STEPS_PER_BAR;
  if (song.drums.bars.length !== barCount) throw new Error(`${song.id}: drums have ${song.drums.bars.length} bars, chart has ${barCount}`);
  const segmentOfBar = Array.from({ length: barCount }, (_, bar) => segmentFor(song, bar));
  const barStart = [0];
  for (let bar = 0; bar < barCount; bar += 1) barStart.push(barStart[bar] + (60000 / song.segments[segmentOfBar[bar]].bpm / 4) * STEPS_PER_BAR);
  const compiled: CompiledSong = {
    song,
    bars: barCount,
    barStart,
    notes: [],
    calls: [],
    endMs: barStart[barCount],
    sections: [],
    signal: [],
    segmentOfBar,
    tones: [],
  };
  for (let step = 0; step < cells.length; step += 1) {
    const cell = cells[step];
    if (cell === "." || cell === "=") continue;
    const bar = Math.floor(step / STEPS_PER_BAR);
    const at = timeOf(compiled, step);
    if (cell === "o") {
      let last = step;
      while (cells[last + 1] === "=") last += 1;
      if (last === step) throw new Error(`${song.id}: hold at step ${step} has no length`);
      compiled.notes.push({ index: compiled.notes.length, step, bar, at, end: timeOf(compiled, last + 1), kind: "hold" });
    } else if (cell === "x" || cell === "e") {
      compiled.notes.push({ index: compiled.notes.length, step, bar, at, end: at, kind: cell === "x" ? "tap" : "echo" });
    } else if (cell === "c") {
      compiled.calls.push({ index: compiled.calls.length, step, bar, at, end: at, kind: "call" });
    } else {
      throw new Error(`${song.id}: unknown chart cell "${cell}" at step ${step}`);
    }
  }
  const signalCells = (song.signal ?? "").replace(/\s+/g, "");
  compiled.signal = Array.from({ length: barCount }, (_, bar) => SIGNAL[signalCells[bar] ?? "."] ?? "clear");
  compiled.sections = song.sections.map((to, i) => ({ from: i === 0 ? 0 : song.sections[i - 1] + 1, to, endMs: barStart[to + 1] }));
  const tones: (number | null)[] = Array.from({ length: cells.length }, () => null);
  const ordered = [...song.voices.filter((v) => v.guide), ...song.voices.filter((v) => !v.guide)];
  for (const voice of ordered) {
    parseNotes(voice.notes).forEach((note, start) => {
      if (!note) return;
      for (let s = start; s < start + note.steps && s < tones.length; s += 1) if (tones[s] === null) tones[s] = note.midi;
    });
  }
  compiled.tones = tones;
  return compiled;
}
