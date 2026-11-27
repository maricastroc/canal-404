import type { Track } from "@/lib/audio/tracks";

const GROOVE = { kick: "x...x...x...x.x.", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x." };
const FILL = { kick: "x...x...x...x...", snare: "....x.......xxxx", hat: GROOVE.hat };
const HIT = { kick: "x...............", snare: "x...............", hat: "................" };

const drums = (lane: keyof typeof GROOVE) => [GROOVE, GROOVE, GROOVE, FILL, HIT].map((bar) => bar[lane]).join("");

export const STREET_FINALE: Track = {
  id: "street-finale",
  station: "FM 101.3",
  bpm: 152,
  lead: {
    wave: "square",
    gain: 0.075,
    notes: [
      "C5 . C5 E5 . C5 G5 . F5 . E5 . D5 . B4 .",
      "C5 . C5 E5 . C5 G5 . C6 - - - G5 . . .",
      "A5 . A5 G5 . F5 E5 . F5 . G5 . E5 . C5 .",
      "D5 . D5 E5 . F5 G5 - - - A5 . B5 . D6 .",
      "C6 - - - - - - - - - - - . . . .",
    ].join(" "),
  },
  bass: {
    wave: "sawtooth",
    gain: 0.07,
    notes: [
      "C3 C3 C4 C3 C3 C3 C4 C3 G2 G2 G3 G2 G2 G2 G3 G2",
      "C3 C3 C4 C3 C3 C3 C4 C3 A2 A2 A3 A2 A2 A2 A3 A2",
      "F2 F2 F3 F2 F2 F2 F3 F2 C3 C3 C4 C3 C3 C3 C4 C3",
      "F2 F2 F3 F2 F2 F2 F3 F2 G2 G2 G3 G2 G2 G2 B2 B2",
      "C3 - - - - - - - - - - - . . . .",
    ].join(" "),
  },
  pad: {
    wave: "sine",
    gain: 0.05,
    notes: [
      "E4 - - - - - - - D4 - - - - - - -",
      "E4 - - - - - - - E4 - - - - - - -",
      "F4 - - - - - - - E4 - - - - - - -",
      "A4 - - - - - - - B4 - - - - - - -",
      "E4 - - - - - - - - - - - . . . .",
    ].join(" "),
  },
  drums: { gain: 0.5, kick: drums("kick"), snare: drums("snare"), hat: drums("hat") },
  unlock: { type: "default" },
};
