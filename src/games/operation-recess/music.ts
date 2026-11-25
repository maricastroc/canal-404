import type { Track } from "@/lib/audio/tracks";
import { StingPlayer, stingTrack } from "../kit/sting";

const STATION = "FM 95.3";
const LOOP_LEVEL = 0.5;

const MARCH = {
  lead: [
    "D5 . . . A4 . . . D5 . F5 . E5 . D5 .",
    "C#5 . . . A4 . . . C#5 . E5 . A5 - - .",
    "D5 . . . A4 . . . D5 . F5 . G5 . A5 .",
    "A#5 - - . A5 . G5 . F5 . E5 . D5 - - .",
    "F5 . . . F5 . G5 . A5 - - . F5 . D5 .",
    "E5 . . . E5 . F5 . G5 - - . E5 . C#5 .",
    "D5 . F5 . A5 . D6 . C#6 . A5 . E5 . G5 .",
    "F5 - - . E5 - - . D5 - - . . . . .",
  ],
  bass: [
    "D3 . . . A2 . . . D3 . . . A2 . . .",
    "A2 . . . E2 . . . A2 . . . C#3 . . .",
    "D3 . . . A2 . . . D3 . . . A2 . . .",
    "A#2 . . . F2 . . . A2 . . . E2 . . .",
    "F2 . . . C3 . . . F2 . . . C3 . . .",
    "C3 . . . G2 . . . A2 . . . E2 . . .",
    "D3 . . . A2 . . . A2 . . . C#3 . . .",
    "A#2 . . . A2 . . . D3 - - . . . . .",
  ],
  pad: [
    "F4 - - - - - - - - - - - - - - -",
    "E4 - - - - - - - - - - - - - - -",
    "F4 - - - - - - - - - - - - - - -",
    "D4 - - - - - - - C#4 - - - - - - -",
    "A4 - - - - - - - - - - - - - - -",
    "G4 - - - - - - - E4 - - - - - - -",
    "F4 - - - - - - - E4 - - - - - - -",
    "D4 - - - - - - - - - - . . . . .",
  ],
};

function march(bpm: number, drums: { snare: string; hat: string }, tense: boolean): Track {
  return {
    id: "inspector",
    station: STATION,
    bpm,
    lead: { wave: "pulse", gain: 0.08, notes: MARCH.lead.join(" "), vibrato: tense ? 5 : undefined },
    bass: { wave: "triangle", gain: 0.2, notes: MARCH.bass.join(" ") },
    pad: tense ? { wave: "sine", gain: 0.05, notes: MARCH.pad.join(" ") } : undefined,
    drums: { gain: 0.35, kick: "x.......x.......", ...drums },
    unlock: { type: "default" },
  };
}

const FIGHT = {
  calm: march(132, { snare: "....x.......x...", hat: "................" }, false),
  angry: march(152, { snare: "....x.......x.x.", hat: "x.x.x.x.x.x.x.x." }, true),
};

const FINALE = {
  clear: stingTrack("inspector", STATION, {
    bpm: 150,
    lead: ["F5 . A5 . C6 - A5 . D6 . C6 . A5 . C6 .", "F6 - - - - - - - - - . . . . . ."],
    bass: ["F2 . C3 . F2 . C3 . A#2 . F2 . C3 . E3 .", "F3 - - - - - - - - - . . . . . ."],
    pad: ["A4 - - - - - - - A#4 - - - C5 - - -", "A4 - - - - - - - - - . . . . . ."],
  }),
  recess: stingTrack("inspector", STATION, {
    bpm: 144,
    lead: ["D5 . . . A4 . . . D5 . F#5 . E5 . D5 .", "A5 - - . F#5 . A5 . D6 - - . B5 . D6 .", "F#6 - - - - - - - - - - - . . . ."],
    bass: ["D3 . . . A2 . . . D3 . . . A2 . . .", "D3 . . . F#2 . . . G2 . . . A2 . . .", "D3 - - - - - - - - - - - . . . ."],
    pad: ["F#4 - - - - - - - - - - - - - - -", "F#4 - - - - - - - G4 - - - A4 - - -", "A4 - - - - - - - - - - - . . . ."],
  }),
  caught: stingTrack("inspector", STATION, {
    bpm: 116,
    lead: ["D5 . . . A4 . . . D5 . . . A4 - - .", "C#5 . D5 . A4 . F4 . D4 - - - - - . ."],
    bass: ["D3 . . . . . . . A2 . . . . . . .", "A2 . . . . . . . D2 - - - - - . ."],
    vibrato: 5,
  }),
};

export type RecessFinale = keyof typeof FINALE;

export class RecessMusic {
  private player = new StingPlayer("inspector");
  private mood: keyof typeof FIGHT | null = null;
  private held = false;

  fight(angry: boolean) {
    const mood = angry ? "angry" : "calm";
    if (this.mood === mood) return;
    this.mood = mood;
    if (!this.held) this.player.loop(FIGHT[mood], LOOP_LEVEL);
  }

  hold() {
    if (this.held || !this.mood) return;
    this.held = true;
    this.player.stop();
  }

  release() {
    if (!this.held) return;
    this.held = false;
    if (this.mood) this.player.loop(FIGHT[this.mood], LOOP_LEVEL);
  }

  quiet() {
    this.mood = null;
    this.held = false;
    this.player.stop();
  }

  finale(kind: RecessFinale) {
    this.mood = null;
    this.held = false;
    this.player.play(FINALE[kind]);
  }

  destroy() {
    this.mood = null;
    this.player.destroy();
  }
}
