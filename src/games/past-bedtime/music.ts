import type { Track } from "@/lib/audio/tracks";

const QUIET = "................";
const NIGHT = { kick: QUIET, snare: QUIET, hat: "x.......x......." };
const MORNING = { kick: "x...x...x...x.x.", snare: "....x.......x.xx", hat: "x.x.x.x.x.x.x.x." };
const HIT = { kick: "x...............", snare: "x...............", hat: QUIET };

const drums = (lane: keyof typeof NIGHT) => [NIGHT, MORNING, HIT].map((bar) => bar[lane]).join("");

export const BEDTIME_FINALE: Track = {
  id: "bedtime-finale",
  station: "FM 404.0",
  bpm: 120,
  lead: {
    wave: "pulse",
    gain: 0.075,
    vibrato: 5,
    notes: [
      "C5 - F5 - A5 - F5 - G5 - E5 - C5 - - -",
      "F5 . A5 . C6 . A5 C6 D6 . C6 . A#5 . G5 .",
      "F5 - - - - - - - A5 - . F5 - - - .",
    ].join(" "),
  },
  bass: {
    wave: "triangle",
    gain: 0.18,
    notes: [
      "F2 . C3 . A3 . C3 . C3 . G3 . E3 . G3 .",
      "F2 . F3 . F2 . F3 . A#2 . A#3 . C3 . E3 .",
      "F2 - - - - - - - . . . F2 - - - .",
    ].join(" "),
  },
  pad: {
    wave: "sine",
    gain: 0.05,
    notes: [
      "A4 - - - - - - - G4 - - - - - - -",
      "A4 - - - - - - - D5 - - - E5 - - -",
      "C5 - - - - - - - - - - - - - - .",
    ].join(" "),
  },
  drums: { gain: 0.4, kick: drums("kick"), snare: drums("snare"), hat: drums("hat") },
  unlock: { type: "default" },
};
