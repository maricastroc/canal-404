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

  constructor(
    private id: TrackId,
    private level = 0.7,
  ) {
    this.off = getAudio().subscribe(() => {
      if (this.ours() && !getAudio().sfxOn) getAudio().stopMusic();
    });
  }

  play(track: Track) {
    const audio = getAudio();
    if (!audio.sfxOn) return;
    audio.startMusic(track, { once: true });
    audio.duckMusic(this.level);
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
    return getAudio().currentTrackId === this.id;
  }
}
