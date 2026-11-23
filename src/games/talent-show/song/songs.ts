import { bars, compileSong, type CompiledSong, type RoundId, type Song, type SongId, type Voice } from "./notation";

const REST = ". . . . . . . . . . . . . . . .";
const QUIET = "................";
const pick = (list: string[], ...at: number[]) => at.map((i) => list[i - 1]);
const times = (part: string, n: number) => Array.from({ length: n }, () => part);
const echo = (call: string) => call.replaceAll("c", "e");

const THEME_LEAD = [
  "E5 - G5 - C6 - B5 A5 G5 - - - E5 - . .",
  "A5 - . A5 G5 - E5 - C5 - D5 - E5 - . .",
  "F5 - A5 - C6 - A5 - G5 - F5 - E5 - D5 -",
  "D5 - G5 - B5 - D6 - - - B5 - G5 - . .",
  "E5 - G5 - C6 - B5 A5 G5 - - - E5 - G5 -",
  "A5 - C6 - E6 - D6 C6 B5 - A5 - G5 - . .",
  "F5 - E5 - D5 - F5 - A5 - G5 - F5 - E5 -",
  "D5 - - - G5 - - - C6 - - - - - . .",
];
const THEME_BASS = [
  "C3 . C4 . C3 . C4 . C3 . C4 . G2 . B2 .",
  "A2 . A3 . A2 . A3 . A2 . A3 . E3 . G3 .",
  "F2 . F3 . F2 . F3 . F2 . F3 . A2 . C3 .",
  "G2 . G3 . G2 . G3 . B2 . B3 . D3 . G2 .",
  "C3 . C4 . C3 . C4 . C3 . C4 . G2 . B2 .",
  "A2 . A3 . A2 . A3 . A2 . A3 . E3 . G3 .",
  "F2 . F3 . F2 . F3 . G2 . G3 . G2 . G3 .",
  "C3 . C4 . G2 . G3 . C3 . . . C3 . . .",
];
const THEME_MELODY = [
  "x.x.x.x.x...x...",
  "x...x.x.x.x.x...",
  "x.x.x.x.x.x.x.x.",
  "x.x.x.x...x.x...",
  "x.x.x.x.x...x.x.",
  "x.x.x.x.x.x.x...",
  "x.x.x.x.x.x.x.x.",
  "x...x...x.......",
];
const THEME_MELODY_FULL = [
  "x.x.x.xxx...x...",
  "x..xx.x.x.x.x...",
  "x.x.x.x.x.x.x.x.",
  "x.x.x.x...x.x...",
  "x.x.x.xxx...x.x.",
  "x.x.x.xxx.x.x...",
  "x.x.x.x.x.x.x.x.",
  "x...x...x.......",
];
const THEME_KITS = {
  i: { kick: "x...x...x...x...", snare: QUIET, hat: "x.x.x.x.x.x.x.x." },
  a: { kick: "x.......x.x.....", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.xx" },
  b: { kick: "x..x..x.x..x..x.", snare: "....x.......x...", hat: "xxxxxxxxxxxxxxxx" },
  h: { kick: "x.......x.......", snare: "....x.......x...", hat: "x...x...x...x..." },
  e: { kick: "x...............", snare: QUIET, hat: QUIET },
};

const THEME: Song = {
  id: "theme",
  segments: [{ from: 0, bpm: 126, featured: "deco", tap: "bucket" }],
  voices: [
    {
      wave: "pulse",
      gain: 0.1,
      notes: bars(REST, ...THEME_LEAD, ...THEME_LEAD, ...pick(THEME_LEAD, 1, 2, 3, 4), ...times(REST, 4), ...THEME_LEAD, ...pick(THEME_LEAD, 1, 2, 3, 4, 5, 6, 7, 8, 7, 8), "C6 - - - - - - - . . . . . . . ."),
    },
    {
      wave: "triangle",
      gain: 0.22,
      notes: bars(THEME_BASS[0], ...THEME_BASS, ...THEME_BASS, ...pick(THEME_BASS, 1, 2, 3, 4, 1, 2, 3, 4), ...THEME_BASS, ...pick(THEME_BASS, 1, 2, 3, 4, 5, 6, 7, 8, 7, 8), "C3 - - - - - - - . . . . . . . ."),
    },
  ],
  drums: { gain: 0.5, kits: THEME_KITS, bars: "i" + "a".repeat(16) + "bbbb" + "hhhh" + "b".repeat(12) + "aaaa" + "aa" + "e" },
  chart: bars(
    QUIET,
    ...times("x...x...x...x...", 4),
    ...times("x...x...x.x.x...", 4),
    ...THEME_MELODY,
    ...times("x..x..x.x..x..x.", 4),
    "x...x...x...x...",
    "x.x.x.x.x.x.x.x.",
    "x...x.x.x...x.x.",
    "x.x.x.x.x.x.x...",
    ...THEME_MELODY_FULL,
    ...times("x..x..x.x..x..x.", 4),
    ...THEME_MELODY.slice(4),
    THEME_MELODY[6],
    THEME_MELODY[7],
    "x...............",
  ),
  sections: [4, 8, 16, 20, 24, 32, 36, 43],
};

const SIGNOFF_LEAD = ["E5 - - - D5 - C5 - G4 - - - - - - -", "B4 - - - C5 - D5 - E5 - - - - - - -", "F5 - - - E5 - D5 - C5 - - - A4 - - -", "A4 - - - G#4 - - - - - - - . . . ."];
const SIGNOFF_BASS = ["C3 - - - - - - - G2 - - - - - - -", "E2 - - - - - - - B2 - - - - - - -", "F2 - - - - - - - A2 - - - - - - -", "F2 - - - - - - - E2 - - - - - - -"];
const SIGNOFF_PAD = ["G4 - - - - - - - E4 - - - - - - -", "G4 - - - - - - - G4 - - - - - - -", "A4 - - - - - - - C5 - - - - - - -", "G#4 - - - - - - - B4 - - - - - - -"];
const SIGNOFF_SOLO = ["C5 - - - - - - - D5 - - - - - - -", "E5 - - - - - - - G5 - - - - - - -", "A5 - - - G5 - - - F5 - - - E5 - - -", "D5 - - - - - - - B4 - - - . . . ."];
const SIGNOFF_BRIDGE = ["F5 - E5 - D5 - C5 - D5 - - - E5 - - -", "C5 - - - A4 - - - G#4 - - - B4 - - -", "F5 - E5 - D5 - C5 - D5 - - - E5 - - -", "A4 - - - - - - - G#4 - - - - - - -"];
const SIGNOFF_HOLDS = ["o===....o======.", "o===....o======.", "o===....o===o==.", "o===o=======...."];
const SIGNOFF_FULL = ["o===x.x.o======.", "o===x.x.o======.", "o===x.x.o===o==.", "o===o=======...."];
const SIGNOFF_SOLO_CHART = ["o=======o======.", "o=======o======.", "o===o===o===o==.", "o=======o===...."];
const SIGNOFF_SOLO_CHART_2 = ["o=======o======.", "o===x.x.o======.", "o===o===o===o==.", "o=======o===...."];
const SIGNOFF_BRIDGE_CHART = ["x.x.x.x.o===o===", "o===o===o===o===", "x.x.x.x.o===o===", "o=======o======."];
const SIGNOFF_KITS = {
  s: { kick: "x.......x.......", snare: "....x.......x...", hat: "..x...x...x...x." },
  b: { kick: "x.......x.x.....", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x." },
  e: { kick: "x...............", snare: QUIET, hat: QUIET },
};
const signoffHarmony = (list: string[], final: string) => bars(list[0], ...list, ...list, ...list, ...list, ...pick(list, 3, 4, 3, 4), ...list, list[0], list[1], final);

const SIGNOFF: Song = {
  id: "signoff",
  segments: [{ from: 0, bpm: 76, featured: "lina", tap: "keys" }],
  voices: [
    { wave: "sine", gain: 0.17, vibrato: 6, notes: bars(REST, ...SIGNOFF_LEAD, ...SIGNOFF_LEAD, ...times(REST, 4), ...SIGNOFF_LEAD, ...SIGNOFF_BRIDGE, ...times(REST, 4), SIGNOFF_LEAD[0], SIGNOFF_LEAD[1], "C5 - - - - - - - - - - - - - - -") },
    { wave: "sine", gain: 0, guide: true, notes: bars(...times(REST, 9), ...SIGNOFF_SOLO, ...times(REST, 8), ...SIGNOFF_SOLO, ...times(REST, 3)) },
    { wave: "triangle", gain: 0.24, notes: signoffHarmony(SIGNOFF_BASS, "C3 - - - - - - - - - - - - - - -") },
    { wave: "triangle", gain: 0.045, notes: signoffHarmony(SIGNOFF_PAD, "E4 - - - - - - - - - - - - - - -") },
  ],
  drums: { gain: 0.3, kits: SIGNOFF_KITS, bars: "s".repeat(13) + "b".repeat(12) + "ss" + "e" },
  chart: bars(QUIET, ...SIGNOFF_HOLDS, ...SIGNOFF_FULL, ...SIGNOFF_SOLO_CHART, ...SIGNOFF_FULL, ...SIGNOFF_BRIDGE_CHART, ...SIGNOFF_SOLO_CHART_2, SIGNOFF_FULL[0], SIGNOFF_FULL[1], "o==============."),
  sections: [4, 8, 12, 16, 20, 24, 27],
};

const RECESS_LEAD = ["A4 - C5 - E5 - - - D5 - C5 - A4 - - -", "G4 - B4 - D5 - - - C5 - B4 - G4 - - -", "F4 - A4 - C5 - - - E5 - D5 - C5 - A4 -", "G4 - - - B4 - - - C5 - - - - - - -"];
const RECESS_BASS = ["F2 - - - . . F2 . C3 - - - . . A2 .", "E2 - - - . . E2 . B2 - - - . . G2 .", "D2 - - - . . D2 . A2 - - - . . F2 .", "C2 - - - . . C2 . G2 - - - E2 - - -"];
const RECESS_PAD = ["A3 - - - - - - - C4 - - - - - - -", "G3 - - - - - - - B3 - - - - - - -", "F3 - - - - - - - A3 - - - - - - -", "E3 - - - - - - - G3 - - - - - - -"];
const CALLS = ["c...c...c...c...", "c.c.c...c.c.c...", "c...c.c.c...c...", "c.....c.....c...", "c.c...c.c.c.c...", "c..c..c...c.c...", "c.c.c.c.c...c.c."];
const LONG_CALLS = [
  ["c.c.c...c...c...", "c.c...c.c......."],
  ["c..c..c.c..c..c.", "c...c...c.c.c..."],
  ["c.c.c.c.c...c..c", "..c.c...c......."],
];
const RECESS_KITS = {
  v: { kick: "x.....x...x.....", snare: "....x.......x...", hat: "..x...x...x...x." },
  e: { kick: "x...............", snare: QUIET, hat: QUIET },
};

const RECESS: Song = {
  id: "recess",
  segments: [{ from: 0, bpm: 92, swing: 0.18, featured: "mila", tap: "fridge" }],
  voices: [
    { wave: "triangle", gain: 0.16, vibrato: 5, notes: bars(RECESS_LEAD[0], ...times(REST, 14), RECESS_LEAD[0], RECESS_LEAD[1], ...times(REST, 12), RECESS_LEAD[2], RECESS_LEAD[3], "A4 - C5 - E5 - - - A5 - - - - - . .") },
    { wave: "sine", gain: 0.3, notes: bars(...times(RECESS_BASS.join(" "), 8)) },
    { wave: "sine", gain: 0.05, notes: bars(...times(RECESS_PAD.join(" "), 8)) },
  ],
  drums: { gain: 0.38, kits: RECESS_KITS, bars: "v".repeat(31) + "e" },
  chart: bars(
    QUIET,
    ...CALLS.flatMap((call) => [call, echo(call)]),
    "x.x.x...x.x.x...",
    "x.x.x...x.x.x...",
    ...LONG_CALLS.flatMap((pair) => [...pair, ...pair.map(echo)]),
    "x.x.x...x.x.x.x.",
    "x...x...x.......",
    "x.x.x...x.......",
  ),
  sections: [4, 8, 12, 16, 20, 24, 28, 31],
};

const STREET_LEAD = [
  "A4 . A4 C5 . A4 E5 . D5 . C5 . B4 . G4 .",
  "A4 . A4 C5 . A4 E5 . G5 - - - E5 . . .",
  "F5 . F5 E5 . D5 C5 . D5 . E5 . C5 . A4 .",
  "B4 . B4 C5 . D5 E5 - - - D5 . B4 . G4 .",
  "A4 . A4 C5 . A4 E5 . D5 . C5 . B4 . G4 .",
  "A4 . C5 . E5 . A5 - - - G5 . E5 . . .",
  "F5 . E5 . D5 . C5 . D5 . C5 . B4 . G4 .",
  "A4 - - - . . E4 . A4 . . . A4 . . .",
];
const STREET_BASS = [
  "A2 A2 A3 A2 A2 A2 A3 A2 A2 A2 A3 A2 G2 G2 G3 G2",
  "A2 A2 A3 A2 A2 A2 A3 A2 C3 C3 C4 C3 C3 C3 C4 C3",
  "F2 F2 F3 F2 F2 F2 F3 F2 G2 G2 G3 G2 G2 G2 G3 G2",
  "E2 E2 E3 E2 E2 E2 E3 E2 E2 E2 E3 E2 G2 G2 G3 G2",
  "A2 A2 A3 A2 A2 A2 A3 A2 A2 A2 A3 A2 G2 G2 G3 G2",
  "A2 A2 A3 A2 A2 A2 A3 A2 C3 C3 C4 C3 C3 C3 C4 C3",
  "F2 F2 F3 F2 F2 F2 F3 F2 G2 G2 G3 G2 G2 G2 G3 G2",
  "A2 A2 A3 A2 E2 E2 E3 E2 A2 . . . A2 . . .",
];
const OFF = { A: "..x...x...x...x.", B: "x.....x.x.....x.", D: "x..x..x...x...x.", E: "....x.x.....x.x.", F: "..x.x.x...x.x.x." };
const offbeats = (keys: string) => [...keys].map((k) => OFF[k as keyof typeof OFF]);
const STREET_KITS = {
  i: { kick: "x...x...x...x...", snare: QUIET, hat: "x.x.x.x.x.x.x.x." },
  s: { kick: "x...x...x...x.x.", snare: "....x.......x...", hat: "xxxxxxxxxxxxxxxx" },
  k: { kick: "x.......x.......", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x." },
  e: { kick: "x...............", snare: QUIET, hat: QUIET },
};

const STREET: Song = {
  id: "street",
  segments: [{ from: 0, bpm: 148, featured: "bruno", tap: "shaker" }],
  voices: [
    { wave: "square", gain: 0.075, notes: bars(REST, REST, ...STREET_LEAD, ...STREET_LEAD, ...times(REST, 4), ...STREET_LEAD, ...STREET_LEAD, ...times(REST, 4), ...STREET_LEAD, STREET_LEAD[7], "A4 - - - - - - - . . . . . . . .") },
    { wave: "sawtooth", gain: 0.07, notes: bars(STREET_BASS[0], STREET_BASS[0], ...STREET_BASS, ...STREET_BASS, ...STREET_BASS.slice(0, 4), ...STREET_BASS, ...STREET_BASS, ...STREET_BASS.slice(0, 4), ...STREET_BASS, STREET_BASS[7], "A2 - - - - - - - . . . . . . . .") },
  ],
  drums: { gain: 0.55, kits: STREET_KITS, bars: "ii" + "s".repeat(16) + "kkkk" + "s".repeat(16) + "kkkk" + "s".repeat(9) + "e" },
  chart: bars(
    QUIET,
    "x...x...x...x...",
    ...offbeats("AAAA"),
    ...offbeats("BBEE"),
    ...offbeats("ABADEBED"),
    "x.......x.x.....",
    "..x.......x.....",
    "x.......x.x.....",
    "..x...x...x.x.x.",
    ...offbeats("FBFDFEFD"),
    ...offbeats("ADEFADEB"),
    "x..x..x.........",
    "..x...x.x.......",
    "x..x..x...x.....",
    "..x.x.x...x.x.x.",
    ...offbeats("FDFEFDBA"),
    "x.....x.x...x...",
    "x...............",
  ),
  sections: [5, 9, 17, 21, 29, 37, 41, 51],
};

const STATIC_LEAD = [
  "C5 E5 G5 C6 G4 . . . G4 . . . G4 . . .",
  "G4 - C5 - E5 - - D5 C5 - E5 - G5 - E5 -",
  "A4 - B4 - C5 - - D5 E5 - C5 - E5 - A4 -",
  "C5 - F5 - - - E5 - F5 - G5 A5 C6 - A5 -",
  "B4 - D5 - D5 - G5 - F5 - E5 - G5 - D5 -",
  "E5 - G5 - C6 - - - - - - - C#6 - - -",
];
const STATIC_BASS = [
  "C3 - - - G2 - - - A2 - - - B2 - - -",
  "C3 - - - G3 - - - C3 - - - G3 - E3 -",
  "A2 - - - E3 - - - A2 - - - E3 - C3 -",
  "F2 - - - C3 - - - F2 - - - C3 - A2 -",
  "G2 - - - D3 - - - G2 - - - B2 - D3 -",
  "C3 - - - G2 - - - C2 - - - - - - -",
];
const STATIC_PAD = [
  "E4 - - - D4 - - - C4 - - - D4 - - -",
  "G4 - - - - - - - E4 - - - - - - -",
  "E4 - - - - - - - C4 - - - - - - -",
  "A4 - - - - - - - F4 - - - - - - -",
  "B4 - - - - - - - F4 - - - - - - -",
  "G4 - - - - - - - - - - - - - - -",
];
const BALLAD = [1, ...[2, 3, 4, 5, 2, 3, 4, 5, 2, 3, 4, 5, 2, 3, 4, 5, 2, 3, 4, 5, 2, 3, 4, 5], 6];
const STATIC_KITS = {
  k: { kick: "x.......x.x.....", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x." },
  e: { kick: "x...............", snare: QUIET, hat: QUIET },
};

const STATIC: Song = {
  id: "static",
  segments: [{ from: 0, bpm: 75, featured: "404", tap: "bucket" }],
  voices: [
    { wave: "pulse", gain: 0.1, vibrato: 5, notes: bars(...pick(STATIC_LEAD, ...BALLAD)) },
    { wave: "triangle", gain: 0.2, notes: bars(...pick(STATIC_BASS, ...BALLAD)) },
    { wave: "sine", gain: 0.05, notes: bars(...pick(STATIC_PAD, ...BALLAD)) },
  ],
  drums: { gain: 0.34, kits: STATIC_KITS, bars: "k".repeat(25) + "e" },
  chart: bars(
    QUIET,
    "x...x...x...x...",
    "x...x...x...x...",
    "x.x.x...x.x.x...",
    "x...x...x...x...",
    "x.x.x.x.x.x.x.x.",
    "x...x...x.x.x...",
    "x...x...x...x...",
    "x.x.x...x.x.x...",
    "x...x...x...x...",
    "x.x.x.x.x...x...",
    "x...x...x.x.x.x.",
    "x.x.x...x.x.x...",
    "x.x.x.x.x.x.x.x.",
    "x...x.x.x...x.x.",
    "x.x.x...x.x.x...",
    "x...x.x.x...x.x.",
    "x.x.x.x.x.x.x.x.",
    "x...x...x.x.x...",
    "x.x.x.x.x...x...",
    "x...x...x...x...",
    "x.x.x...x.x.x...",
    "x.x.x.x.x.x.x.x.",
    "x...x.x.x...x.x.",
    "x.x.x.x.x.x.x...",
    "x.x.x.......x...",
  ),
  signal: "....~..#.##.~..#~##.###~..",
  sections: [4, 8, 12, 16, 20, 25],
};

const PARTS = { A: 5, B: 5, C: 5, D: 7, E: 5, F: 8 } as const;
type Part = keyof typeof PARTS;
const medley = (fill: Partial<Record<Part, string[]>>) =>
  bars(
    ...(Object.keys(PARTS) as Part[]).flatMap((part) => {
      const content = fill[part] ?? [];
      if (content.length > PARTS[part]) throw new Error(`medley part ${part} has ${content.length} bars`);
      return [...content, ...times(REST, PARTS[part] - content.length)];
    }),
  );
const medleyVoice = (voice: Omit<Voice, "notes">, fill: Partial<Record<Part, string[]>>): Voice => ({ ...voice, notes: medley(fill) });
const medleySignal = Array.from({ length: 35 }, (_, bar) => (bar === 24 || bar === 25 ? "#" : ".")).join("");

const MEDLEY: Song = {
  id: "medley",
  segments: [
    { from: 0, bpm: 126, featured: "deco", tap: "bucket", source: "theme" },
    { from: 5, bpm: 76, featured: "lina", tap: "keys", source: "signoff" },
    { from: 10, bpm: 92, swing: 0.18, featured: "mila", tap: "fridge", source: "recess" },
    { from: 15, bpm: 148, featured: "bruno", tap: "shaker", source: "street" },
    { from: 22, bpm: 75, featured: "404", tap: "bucket", source: "static" },
    { from: 27, bpm: 126, featured: "deco", tap: "bucket", source: "theme" },
  ],
  voices: [
    medleyVoice({ wave: "pulse", gain: 0.1 }, { A: [REST, ...THEME_LEAD.slice(0, 4)], F: [REST, ...THEME_LEAD.slice(4), THEME_LEAD[6], THEME_LEAD[7], "C6 - - - - - - - . . . . . . . ."] }),
    medleyVoice({ wave: "triangle", gain: 0.22 }, { A: [THEME_BASS[0], ...THEME_BASS.slice(0, 4)], F: [THEME_BASS[4], ...THEME_BASS.slice(4), THEME_BASS[6], THEME_BASS[7], "C3 - - - - - - - . . . . . . . ."] }),
    medleyVoice({ wave: "sine", gain: 0.17, vibrato: 6 }, { B: [REST, ...SIGNOFF_LEAD] }),
    medleyVoice({ wave: "triangle", gain: 0.24 }, { B: [SIGNOFF_BASS[0], ...SIGNOFF_BASS] }),
    medleyVoice({ wave: "triangle", gain: 0.045 }, { B: [SIGNOFF_PAD[0], ...SIGNOFF_PAD] }),
    medleyVoice({ wave: "triangle", gain: 0.16, vibrato: 5 }, { C: [RECESS_LEAD[0]] }),
    medleyVoice({ wave: "sine", gain: 0.3 }, { C: [...RECESS_BASS, RECESS_BASS[0]] }),
    medleyVoice({ wave: "sine", gain: 0.05 }, { C: [...RECESS_PAD, RECESS_PAD[0]] }),
    medleyVoice({ wave: "square", gain: 0.075 }, { D: [REST, ...STREET_LEAD.slice(0, 6)] }),
    medleyVoice({ wave: "sawtooth", gain: 0.07 }, { D: [STREET_BASS[0], ...STREET_BASS.slice(0, 6)] }),
    medleyVoice({ wave: "pulse", gain: 0.1, vibrato: 5 }, { E: pick(STATIC_LEAD, 1, 2, 3, 4, 5) }),
    medleyVoice({ wave: "triangle", gain: 0.2 }, { E: pick(STATIC_BASS, 1, 2, 3, 4, 5) }),
    medleyVoice({ wave: "sine", gain: 0.05 }, { E: pick(STATIC_PAD, 1, 2, 3, 4, 5) }),
  ],
  drums: {
    gain: 0.5,
    kits: {
      a: { ...THEME_KITS.a, gain: 0.5 },
      s: { ...SIGNOFF_KITS.b, gain: 0.3 },
      v: { ...RECESS_KITS.v, gain: 0.38 },
      t: { ...STREET_KITS.s, gain: 0.55 },
      k: { ...STATIC_KITS.k, gain: 0.34 },
      e: { ...THEME_KITS.e, gain: 0.5 },
    },
    bars: "aaaaa" + "sssss" + "vvvvv" + "ttttttt" + "kkkkk" + "aaaaaaa" + "e",
  },
  chart: bars(
    QUIET,
    ...THEME_MELODY.slice(0, 4),
    QUIET,
    ...SIGNOFF_FULL,
    QUIET,
    CALLS[4],
    echo(CALLS[4]),
    CALLS[5],
    echo(CALLS[5]),
    QUIET,
    ...offbeats("ABDEFD"),
    QUIET,
    "x.x.x...x.x.x...",
    "x...x...x...x...",
    "x.x.x.x.x...x...",
    "x...x...x.x.x.x.",
    QUIET,
    ...THEME_MELODY_FULL.slice(4),
    THEME_MELODY[6],
    THEME_MELODY[7],
    "x...............",
  ),
  signal: medleySignal,
  sections: [4, 9, 14, 21, 26, 34],
};

export const SONGS: Record<SongId, Song> = { theme: THEME, signoff: SIGNOFF, recess: RECESS, street: STREET, static: STATIC, medley: MEDLEY };

export const ROUNDS: { id: RoundId; songs: SongId[] }[] = [
  { id: "heats", songs: ["theme", "signoff"] },
  { id: "semifinal", songs: ["recess", "street"] },
  { id: "final", songs: ["static", "medley"] },
];
export const SONG_ORDER: SongId[] = ROUNDS.flatMap((r) => r.songs);

export function roundOf(id: SongId) {
  return ROUNDS.find((r) => r.songs.includes(id))?.id ?? "heats";
}

const compiled = new Map<SongId, CompiledSong>();

export function compiledSong(id: SongId) {
  let song = compiled.get(id);
  if (!song) {
    song = compileSong(SONGS[id]);
    compiled.set(id, song);
  }
  return song;
}
