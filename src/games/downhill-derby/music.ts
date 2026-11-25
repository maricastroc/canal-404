import { getAudio } from "@/lib/audio/engine";
import type { Track } from "@/lib/audio/tracks";

const bars = (...parts: string[]) => parts.join(" ");

const SILENT = "................";

const sting = (bpm: number, lead: string[], bass: string[], pad?: string[], vibrato?: number): Track => ({
  id: "downhill",
  station: "FM 98.2",
  bpm,
  lead: { wave: "pulse", gain: 0.09, notes: bars(...lead), vibrato },
  bass: { wave: "triangle", gain: 0.2, notes: bars(...bass) },
  pad: pad ? { wave: "sine", gain: 0.05, notes: bars(...pad) } : undefined,
  drums: { gain: 0.4, kick: "x.......x.......", snare: SILENT, hat: SILENT },
  unlock: { type: "default" },
});

const FINALE = {
  win: sting(
    152,
    ["D5 . G5 . B5 . D6 - - . B5 . D6 - - .", "G6 - - - - - - - - - . . . . . ."],
    ["G2 . G3 . G2 . G3 . D2 . D3 . D2 . D3 .", "G2 - - - - - - - - - . . . . . ."],
    ["B4 - - - - - - - D5 - - - - - - -", "G5 - - - - - - - - - . . . . . ."],
  ),
  podium: sting(
    152,
    ["B4 . D5 . G5 - - . F#5 . G5 . A5 - - .", "G5 - - - - - - - . . . . . . . ."],
    ["G2 . G3 . C3 . C3 . D2 . D3 . D2 . D3 .", "G2 - - - - - - - . . . . . . . ."],
  ),
  lose: sting(
    112,
    ["B4 - - . A#4 - - . A4 - - . G#4 - - -", "G4 - - - - - - - - - . . . . . ."],
    ["G2 - - . F#2 - - . F2 - - . E2 - - -", "G2 - - - - - - - - - . . . . . ."],
    undefined,
    6,
  ),
};

const STING_LEVEL = 0.7;

export class RaceMusic {
  private off: (() => void) | null;

  constructor() {
    this.off = getAudio().subscribe(() => {
      if (this.ours() && !getAudio().sfxOn) getAudio().stopMusic();
    });
  }

  finale(place: number) {
    const audio = getAudio();
    if (!audio.sfxOn) return;
    audio.startMusic(place === 1 ? FINALE.win : place <= 3 ? FINALE.podium : FINALE.lose, { once: true });
    audio.duckMusic(STING_LEVEL);
  }

  stop() {
    if (this.ours()) getAudio().stopMusic();
  }

  destroy() {
    this.stop();
    this.off?.();
    this.off = null;
  }

  private ours() {
    return getAudio().currentTrackId === "downhill";
  }
}
