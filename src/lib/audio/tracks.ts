import type { Wave } from "./types";

export type TrackUnlock =
  | { type: "default" }
  | { type: "achievement"; id: string; label: string }
  | { type: "secrets"; count: number; label: string };

export type Track = {
  id: string;
  title: string;
  station: string;
  mood: string;
  bpm: number;
  swing?: number;
  lead: { wave: Wave; notes: string; gain: number; octave?: number; vibrato?: number };
  bass: { wave: Wave; notes: string; gain: number };
  pad?: { wave: Wave; notes: string; gain: number };
  drums: { kick: string; snare: string; hat: string; gain: number };
  unlock: TrackUnlock;
};

const bars = (...parts: string[]) => parts.join(" ");

export const TRACKS: Track[] = [
  {
    id: "theme",
    title: "Tema do Canal 404",
    station: "FM 404.0",
    mood: "A vinheta oficial. Toca desde 2004 sem parar.",
    bpm: 126,
    lead: {
      wave: "pulse",
      gain: 0.11,
      notes: bars(
        "E5 - G5 - C6 - B5 A5 G5 - - - E5 - . .",
        "A5 - . A5 G5 - E5 - C5 - D5 - E5 - . .",
        "F5 - A5 - C6 - A5 - G5 - F5 - E5 - D5 -",
        "D5 - G5 - B5 - D6 - - - B5 - G5 - . .",
        "E5 - G5 - C6 - B5 A5 G5 - - - E5 - G5 -",
        "A5 - C6 - E6 - D6 C6 B5 - A5 - G5 - . .",
        "F5 - E5 - D5 - F5 - A5 - G5 - F5 - E5 -",
        "D5 - - - G5 - - - C6 - - - - - . .",
      ),
    },
    bass: {
      wave: "triangle",
      gain: 0.22,
      notes: bars(
        "C3 . C4 . C3 . C4 . C3 . C4 . G2 . B2 .",
        "A2 . A3 . A2 . A3 . A2 . A3 . E3 . G3 .",
        "F2 . F3 . F2 . F3 . F2 . F3 . A2 . C3 .",
        "G2 . G3 . G2 . G3 . B2 . B3 . D3 . G2 .",
        "C3 . C4 . C3 . C4 . C3 . C4 . G2 . B2 .",
        "A2 . A3 . A2 . A3 . A2 . A3 . E3 . G3 .",
        "F2 . F3 . F2 . F3 . G2 . G3 . G2 . G3 .",
        "C3 . C4 . G2 . G3 . C3 . . . C3 . . .",
      ),
    },
    drums: {
      gain: 0.5,
      kick: "x.......x.x.....",
      snare: "....x.......x...",
      hat: "x.x.x.x.x.x.x.xx",
    },
    unlock: { type: "default" },
  },
  {
    id: "recess",
    title: "Vinheta de Intervalo",
    station: "FM 88.4",
    mood: "Música de espera para quando o lanche está no micro-ondas.",
    bpm: 92,
    swing: 0.18,
    lead: {
      wave: "triangle",
      gain: 0.16,
      vibrato: 5,
      notes: bars(
        "A4 - C5 - E5 - - - D5 - C5 - A4 - - -",
        "G4 - B4 - D5 - - - C5 - B4 - G4 - - -",
        "F4 - A4 - C5 - - - E5 - D5 - C5 - A4 -",
        "G4 - - - B4 - - - C5 - - - - - - -",
      ),
    },
    bass: {
      wave: "sine",
      gain: 0.3,
      notes: bars(
        "F2 - - - . . F2 . C3 - - - . . A2 .",
        "E2 - - - . . E2 . B2 - - - . . G2 .",
        "D2 - - - . . D2 . A2 - - - . . F2 .",
        "C2 - - - . . C2 . G2 - - - E2 - - -",
      ),
    },
    pad: {
      wave: "sine",
      gain: 0.05,
      notes: bars(
        "A3 - - - - - - - C4 - - - - - - -",
        "G3 - - - - - - - B3 - - - - - - -",
        "F3 - - - - - - - A3 - - - - - - -",
        "E3 - - - - - - - G3 - - - - - - -",
      ),
    },
    drums: {
      gain: 0.38,
      kick: "x.....x...x.....",
      snare: "....x.......x...",
      hat: "..x...x...x...x.",
    },
    unlock: { type: "achievement", id: "radio-on", label: "Ligue o rádio da sala" },
  },
  {
    id: "street",
    title: "Rua Sem Saída (Tema)",
    station: "FM 101.3",
    mood: "Trilha oficial da maior bagunça do bairro.",
    bpm: 148,
    lead: {
      wave: "square",
      gain: 0.075,
      notes: bars(
        "A4 . A4 C5 . A4 E5 . D5 . C5 . B4 . G4 .",
        "A4 . A4 C5 . A4 E5 . G5 - - - E5 . . .",
        "F5 . F5 E5 . D5 C5 . D5 . E5 . C5 . A4 .",
        "B4 . B4 C5 . D5 E5 - - - D5 . B4 . G4 .",
        "A4 . A4 C5 . A4 E5 . D5 . C5 . B4 . G4 .",
        "A4 . C5 . E5 . A5 - - - G5 . E5 . . .",
        "F5 . E5 . D5 . C5 . D5 . C5 . B4 . G4 .",
        "A4 - - - . . E4 . A4 . . . A4 . . .",
      ),
    },
    bass: {
      wave: "sawtooth",
      gain: 0.07,
      notes: bars(
        "A2 A2 A3 A2 A2 A2 A3 A2 A2 A2 A3 A2 G2 G2 G3 G2",
        "A2 A2 A3 A2 A2 A2 A3 A2 C3 C3 C4 C3 C3 C3 C4 C3",
        "F2 F2 F3 F2 F2 F2 F3 F2 G2 G2 G3 G2 G2 G2 G3 G2",
        "E2 E2 E3 E2 E2 E2 E3 E2 E2 E2 E3 E2 G2 G2 G3 G2",
        "A2 A2 A3 A2 A2 A2 A3 A2 A2 A2 A3 A2 G2 G2 G3 G2",
        "A2 A2 A3 A2 A2 A2 A3 A2 C3 C3 C4 C3 C3 C3 C4 C3",
        "F2 F2 F3 F2 F2 F2 F3 F2 G2 G2 G3 G2 G2 G2 G3 G2",
        "A2 A2 A3 A2 E2 E2 E3 E2 A2 . . . A2 . . .",
      ),
    },
    drums: {
      gain: 0.55,
      kick: "x...x...x...x.x.",
      snare: "....x.......x...",
      hat: "xxxxxxxxxxxxxxxx",
    },
    unlock: { type: "achievement", id: "first-launch", label: "Faça um lançamento em Rua Sem Saída" },
  },
  {
    id: "sign-off",
    title: "Fim de Transmissão",
    station: "AM 404",
    mood: "A música que tocava quando o canal saía do ar. Ou não saía.",
    bpm: 76,
    lead: {
      wave: "sine",
      gain: 0.17,
      vibrato: 6,
      notes: bars(
        "E5 - - - D5 - C5 - G4 - - - - - - -",
        "B4 - - - C5 - D5 - E5 - - - - - - -",
        "F5 - - - E5 - D5 - C5 - - - A4 - - -",
        "A4 - - - G#4 - - - - - - - . . . .",
      ),
    },
    bass: {
      wave: "triangle",
      gain: 0.24,
      notes: bars(
        "C3 - - - - - - - G2 - - - - - - -",
        "E2 - - - - - - - B2 - - - - - - -",
        "F2 - - - - - - - A2 - - - - - - -",
        "F2 - - - - - - - E2 - - - - - - -",
      ),
    },
    pad: {
      wave: "triangle",
      gain: 0.045,
      notes: bars(
        "G4 - - - - - - - E4 - - - - - - -",
        "G4 - - - - - - - G4 - - - - - - -",
        "A4 - - - - - - - C5 - - - - - - -",
        "G#4 - - - - - - - B4 - - - - - - -",
      ),
    },
    drums: {
      gain: 0.2,
      kick: "x...............",
      snare: "........x.......",
      hat: "....x.......x...",
    },
    unlock: { type: "secrets", count: 5, label: "Encontre 5 segredos na sala" },
  },
];

const NOTE_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

export type ParsedNote = { midi: number; steps: number } | null;

export function parseNotes(source: string): ParsedNote[] {
  const tokens = source.split(/\s+/).filter(Boolean);
  const result: ParsedNote[] = tokens.map(() => null);
  let lastIndex = -1;
  tokens.forEach((token, index) => {
    if (token === "-") {
      if (lastIndex >= 0) {
        const prev = result[lastIndex];
        if (prev) prev.steps += 1;
      }
      return;
    }
    if (token === ".") {
      lastIndex = -1;
      return;
    }
    const match = /^([A-G]#?)(-?\d)$/.exec(token);
    if (!match) {
      lastIndex = -1;
      return;
    }
    const midi = (Number(match[2]) + 1) * 12 + NOTE_INDEX[match[1]];
    result[index] = { midi, steps: 1 };
    lastIndex = index;
  });
  return result;
}

export function midiToFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function trackById(id: string) {
  return TRACKS.find((t) => t.id === id) ?? TRACKS[0];
}
