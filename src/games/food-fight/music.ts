import { stingTrack } from "../kit/sting";

export const LUNCH_FINALE = {
  win: stingTrack("lunch", "FM 91.5", {
    bpm: 144,
    lead: ["C5 . E5 . G5 . C6 . A5 . C6 . G5 - - .", "D6 . C6 - - - - - - - - . . . . ."],
    bass: ["C3 . G2 . C3 . G2 . F2 . A2 . G2 . B2 .", "C3 - - - - - - - - - - . . . . ."],
    pad: ["E4 - - - - - - - F4 - - - G4 - - -", "E4 - - - - - - - - - - . . . . ."],
  }),
  lose: stingTrack("lunch", "FM 91.5", {
    bpm: 132,
    lead: ["G5 - - . E5 - A5 . G5 - - . E5 - - .", "E5 . C5 . G4 - - - - - - . . . . ."],
    bass: ["C3 . . . C3 . . . F2 . . . G2 . . .", "C3 . G2 . C2 - - - - - - . . . . ."],
    vibrato: 4,
  }),
};
