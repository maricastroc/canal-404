import { getAudio } from "@/lib/audio/engine";
import type { Track } from "@/lib/audio/tracks";

const bars = (...parts: string[]) => parts.join(" ");
const bounce = (a: string, b = a) => `${a}2 . ${a}3 . ${a}2 . ${a}3 . ${b}2 . ${b}3 . ${b}2 . ${b}3 .`;

export const DOWNHILL_SONG: Track = {
  id: "downhill",
  station: "FM 98.2",
  bpm: 152,
  lead: {
    wave: "pulse",
    gain: 0.075,
    notes: bars(
      "G5 . D5 . G5 . B5 - A5 . G5 . D5 . B4 .",
      "E5 . G5 . B5 - - . A5 . G5 . E5 - - .",
      "C5 . E5 . G5 . C6 - - . B5 . A5 . G5 .",
      "F#5 - - . E5 . D5 . A5 - - - - . . .",
      "G5 . D5 . G5 . B5 - A5 . G5 . D5 . B4 .",
      "E5 . G5 . B5 . E6 - D6 . B5 . G5 . E5 .",
      "C6 . B5 . A5 . G5 . A5 . B5 . C6 . D6 .",
      "B5 - - . A5 . F#5 . G5 - - - . . . .",
      "E5 - G5 - E5 . C5 . G5 - - . E5 . . .",
      "F#5 - A5 - F#5 . D5 . A5 - - . F#5 . . .",
      "D5 . F#5 . B5 - - . A5 . F#5 . D5 . F#5 .",
      "G5 - - . F#5 . E5 . B4 - - - . . . .",
      "C5 . E5 . G5 . C6 . B5 . G5 . E5 . G5 .",
      "A5 . F#5 . D5 . F#5 . A5 . D6 - - . C6 .",
      "C6 . B5 . A5 - - . F#5 . A5 . D6 - - .",
      "B5 - - . G5 . D5 . G5 . A5 . B5 . D6 .",
    ),
  },
  bass: {
    wave: "triangle",
    gain: 0.2,
    notes: bars(
      bounce("G"),
      bounce("E"),
      bounce("C"),
      bounce("D"),
      bounce("G"),
      bounce("E"),
      bounce("C", "D"),
      bounce("G"),
      bounce("C"),
      bounce("D"),
      bounce("B"),
      bounce("E"),
      bounce("C"),
      bounce("D"),
      bounce("A", "D"),
      bounce("G", "D"),
    ),
  },
  drums: {
    gain: 0.4,
    kick: "x...x...x...x...",
    snare: "....x.......x..x",
    hat: "..x...x...x...x.",
  },
  unlock: { type: "default" },
};

const LEVEL = { race: 0.7, paused: 0.3, finished: 0.35 };

export class RaceMusic {
  private wanted = false;
  private level = LEVEL.race;
  private off: (() => void) | null;

  constructor() {
    this.off = getAudio().subscribe(() => this.sync());
  }

  play() {
    this.wanted = true;
    this.level = LEVEL.race;
    this.sync();
  }

  pause() {
    this.soften(LEVEL.paused);
  }

  resume() {
    this.soften(LEVEL.race);
  }

  finish() {
    this.soften(LEVEL.finished);
  }

  stop() {
    this.wanted = false;
    if (this.ours()) getAudio().stopMusic();
  }

  destroy() {
    this.stop();
    this.off?.();
    this.off = null;
  }

  private soften(level: number) {
    if (!this.wanted) return;
    this.level = level;
    if (this.ours()) getAudio().duckMusic(level);
  }

  private ours() {
    return getAudio().currentTrackId === DOWNHILL_SONG.id;
  }

  private sync() {
    const audio = getAudio();
    const ours = this.ours();
    if (this.wanted && audio.sfxOn && !ours) {
      audio.startMusic(DOWNHILL_SONG);
      audio.duckMusic(this.level);
    } else if (ours && (!this.wanted || !audio.sfxOn)) audio.stopMusic();
  }
}
