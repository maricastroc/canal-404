import { StingPlayer, stingTrack, type StingNotes } from "../kit/sting";

const sting = (bpm: number, lead: string[], bass: string[], pad?: string[], vibrato?: number) =>
  stingTrack("downhill", "FM 98.2", { bpm, lead, bass, pad, vibrato } satisfies StingNotes);

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

export class RaceMusic {
  private player = new StingPlayer("downhill");

  finale(place: number) {
    this.player.play(place === 1 ? FINALE.win : place <= 3 ? FINALE.podium : FINALE.lose);
  }

  stop() {
    this.player.stop();
  }

  destroy() {
    this.player.destroy();
  }
}
