import { getAudio } from "@/lib/audio/engine";
import type { Track, TrackId } from "@/lib/audio/tracks";

const SILENT = "................";

export type StingNotes = { bpm: number; lead: string[]; bass: string[]; pad?: string[]; vibrato?: number };

export function stingTrack(id: TrackId, station: string, notes: StingNotes): Track {
  return {
    id,
    station,
    bpm: notes.bpm,
    lead: { wave: "pulse", gain: 0.09, notes: notes.lead.join(" "), vibrato: notes.vibrato },
    bass: { wave: "triangle", gain: 0.2, notes: notes.bass.join(" ") },
    pad: notes.pad ? { wave: "sine", gain: 0.05, notes: notes.pad.join(" ") } : undefined,
    drums: { gain: 0.4, kick: "x.......x.......", snare: SILENT, hat: SILENT },
    unlock: { type: "default" },
  };
}

export class StingPlayer {
  private off: (() => void) | null;
  private looped: { track: Track; level: number } | null = null;

  constructor(
    private id: TrackId,
    private level = 0.7,
  ) {
    this.off = getAudio().subscribe(() => {
      const audio = getAudio();
      if (!audio.sfxOn) {
        if (this.ours()) audio.stopMusic();
        return;
      }
      if (this.looped && !audio.musicPlaying) this.start(this.looped.track, false, this.looped.level);
    });
  }

  play(track: Track) {
    this.looped = null;
    this.start(track, true, this.level);
  }

  loop(track: Track, level = this.level) {
    this.looped = { track, level };
    this.start(track, false, level);
  }

  stop() {
    this.looped = null;
    if (this.ours()) getAudio().stopMusic();
  }

  private start(track: Track, once: boolean, level: number) {
    const audio = getAudio();
    if (!audio.sfxOn) return;
    audio.startMusic(track, { once });
    audio.duckMusic(level);
  }

  destroy() {
    this.stop();
    this.off?.();
    this.off = null;
  }

  private ours() {
    return getAudio().currentTrackId === this.id;
  }
}
