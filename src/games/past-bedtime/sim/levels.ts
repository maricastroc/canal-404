import type { Dir, LevelDef, PatrolStep } from "./types";

function run(y: number, a: number, b: number): PatrolStep[] {
  const out: PatrolStep[] = [];
  const d = a <= b ? 1 : -1;
  for (let x = a; x !== b + d; x += d) out.push({ x, y });
  return out;
}

function column(x: number, a: number, b: number): PatrolStep[] {
  const out: PatrolStep[] = [];
  const d = a <= b ? 1 : -1;
  for (let y = a; y !== b + d; y += d) out.push({ x, y });
  return out;
}

function look(x: number, y: number, f: Dir): PatrolStep {
  return { x, y, f };
}

function peek(x: number, y: number, f: Dir): PatrolStep {
  return { x, y, f, peek: true };
}

export const DOORWAY: LevelDef = {
  id: "doorway",
  map: [
    "#########",
    "###.o.###",
    "###.o.###",
    "#B..~..G#",
    "#########",
  ],
  loud: 5,
  clock: { period: 4, x: 2, y: 2 },
  agents: [{ kind: "sleeper", id: "dad", x: 4, y: 2, wake: 3, range: 4, cone: "wide", hear: 0 }],
  props: [
    { kind: "bed", x: 4, y: 1, h: 2 },
    { kind: "door", x: 0, y: 3 },
  ],
  par: 7,
};

export const HALLWAY: LevelDef = {
  id: "hallway",
  map: [
    "##############",
    "#####.o.######",
    "#####.o.######",
    "#####...######",
    "#...~~~~~....#",
    "#B..~~.~~..~G#",
    "#..~.~~.~....#",
    "##############",
  ],
  loud: 5,
  clock: { period: 3, x: 2, y: 3 },
  agents: [{ kind: "sleeper", id: "dad", x: 6, y: 2, wake: 3, range: 4, cone: "wide", hear: 0, toss: { period: 12, offset: 11, facing: 2 } }],
  props: [
    { kind: "bed", x: 6, y: 1, h: 2 },
    { kind: "stairs", x: 12, y: 5 },
    { kind: "door", x: 0, y: 5 },
  ],
  par: 16,
};

export const KITCHEN: LevelDef = {
  id: "kitchen",
  map: [
    "#############",
    "#oo.....o.oo#",
    "#..........G#",
    "#...oooo....#",
    "#B..oooo....#",
    "#...........#",
    "#oo.o....ooo#",
    "#############",
  ],
  loud: 3,
  agents: [
    {
      kind: "patrol",
      id: "grandma",
      path: [
        ...run(2, 3, 8), ...column(8, 3, 5), ...run(5, 7, 2), look(2, 4, 3), { x: 2, y: 3 }, { x: 2, y: 2 },
        ...run(2, 3, 9), { x: 9, y: 3 }, look(9, 4, 1), { x: 9, y: 5 }, ...run(5, 8, 3), { x: 3, y: 4 }, { x: 3, y: 3 },
      ],
      start: 10,
      range: 3,
      cone: "narrow",
      hear: 0,
      alert: 2,
    },
  ],
  props: [
    { kind: "table", x: 4, y: 3, w: 4, h: 2 },
    { kind: "fridge", x: 1, y: 1 },
    { kind: "stove", x: 2, y: 1 },
    { kind: "sink", x: 8, y: 1 },
    { kind: "counter", x: 10, y: 1, w: 2 },
    { kind: "counterLow", x: 1, y: 6, w: 2 },
    { kind: "plant", x: 4, y: 6 },
    { kind: "counterLow", x: 9, y: 6, w: 3 },
    { kind: "door", x: 12, y: 2 },
    { kind: "door", x: 0, y: 4 },
  ],
  par: 16,
};

export const LIVING: LevelDef = {
  id: "living",
  map: [
    "#############",
    "#..o.o.#.o..#",
    "#..~...#...o#",
    "#~....~#...G#",
    "#...........#",
    "#B.~...#o..o#",
    "#############",
  ],
  loud: 3,
  agents: [
    { kind: "sleeper", id: "dad", x: 3, y: 1, wake: 3, range: 4, cone: "wide", hear: 0, toss: { period: 8, offset: 3, facing: 2 } },
    { kind: "dog", id: "pipoca", x: 7, y: 4, hear: 4, sniff: 2 },
  ],
  props: [
    { kind: "armchair", x: 3, y: 1 },
    { kind: "shelf", x: 5, y: 1 },
    { kind: "plant", x: 9, y: 1 },
    { kind: "tv", x: 11, y: 2 },
    { kind: "vcr", x: 11, y: 3 },
    { kind: "dogbed", x: 7, y: 4 },
    { kind: "armchair", x: 8, y: 5 },
    { kind: "plant", x: 11, y: 5 },
  ],
  par: 20,
};

export const STAIRS: LevelDef = {
  id: "stairs",
  map: [
    "###########",
    "#B.########",
    "#..########",
    "#........G#",
    "#.........#",
    "###########",
  ],
  loud: 3,
  agents: [{ kind: "patrol", id: "grandma", path: [...run(4, 2, 8), ...run(3, 8, 2)], start: 8, range: 3, cone: "narrow", hear: 0, alert: 2 }],
  props: [{ kind: "stairs", x: 1, y: 1, w: 2, f: 0 }],
  par: 16,
};

export const PANTRY: LevelDef = {
  id: "pantry",
  map: [
    "############",
    "#o.o.h.o.oG#",
    "#B.........#",
    "############",
  ],
  loud: 3,
  agents: [{ kind: "patrol", id: "grandma", path: [...run(2, 3, 9), ...run(2, 8, 4), ...run(2, 5, 10), ...run(2, 9, 6), peek(5, 2, 0), ...run(2, 4, 3)], start: 14, range: 4, cone: "narrow", hear: 0, alert: 2 }],
  props: [
    { kind: "pantry", x: 1, y: 1 },
    { kind: "pantry", x: 3, y: 1 },
    { kind: "pantry", x: 7, y: 1 },
    { kind: "pantry", x: 9, y: 1 },
  ],
  par: 14,
};

export const LAUNDRY: LevelDef = {
  id: "laundry",
  map: [
    "###########",
    "#....~#...#",
    "#.oo..#...#",
    "#Boo..#...#",
    "#~.......G#",
    "###########",
  ],
  loud: 3,
  agents: [{ kind: "dog", id: "pipoca", x: 6, y: 4, hear: 4, sniff: 2 }],
  props: [
    { kind: "washer", x: 2, y: 2, w: 2, h: 2 },
    { kind: "dogbed", x: 6, y: 4 },
  ],
  par: 15,
};

export const DINING: LevelDef = {
  id: "dining",
  map: [
    "###########",
    "#B.......G#",
    "#...#.ooo.#",
    "#.o.#.ooo.#",
    "#...#.ooo.#",
    "#o.o#.....#",
    "###########",
  ],
  loud: 3,
  agents: [
    { kind: "dog", id: "pipoca", x: 4, y: 1, hear: 4, sniff: 2 },
    { kind: "cat", id: "pixel", x: 2, y: 3, sx: 1, sy: 3, period: 10, offset: 9, loud: 4, hear: 0 },
  ],
  props: [
    { kind: "table", x: 6, y: 2, w: 3, h: 3 },
    { kind: "aquarium", x: 2, y: 3 },
    { kind: "cabinet", x: 1, y: 5 },
    { kind: "sewing", x: 3, y: 5 },
    { kind: "dogbed", x: 4, y: 1 },
  ],
  par: 14,
};

export const SOFA: LevelDef = {
  id: "sofa",
  map: [
    "############",
    "#.o..ooo.o.#",
    "#Bo.......G#",
    "#...o...oo.#",
    "#.....h..h.#",
    "#o...ooo..o#",
    "############",
  ],
  loud: 3,
  agents: [
    { kind: "sleeper", id: "dad", x: 6, y: 1, wake: 5, range: 5, cone: "wide", hear: 0, toss: { period: 10, offset: 6, facing: 1 } },
    { kind: "cat", id: "pixel", x: 7, y: 5, sx: 7, sy: 4, period: 7, offset: 0, loud: 5, hear: 0 },
  ],
  props: [
    { kind: "armchair", x: 2, y: 1 },
    { kind: "sofa", x: 5, y: 1, w: 3 },
    { kind: "armchair", x: 9, y: 1 },
    { kind: "plant", x: 2, y: 2 },
    { kind: "plant", x: 4, y: 3 },
    { kind: "coffeeTable", x: 8, y: 3, w: 2, h: 1 },
    { kind: "shelf", x: 1, y: 5 },
    { kind: "sideboard", x: 5, y: 5, w: 3 },
    { kind: "plant", x: 10, y: 5 },
  ],
  par: 18,
};

export const RETURN: LevelDef = {
  id: "return",
  map: [
    "##############",
    "#####.o.######",
    "#####.o.######",
    "#####...######",
    "#...~~~~~....#",
    "#G..~~.~~..~B#",
    "#..~.~~.~....#",
    "##############",
  ],
  loud: 5,
  clock: { period: 3, x: 2, y: 3 },
  agents: [
    { kind: "sleeper", id: "dad", x: 6, y: 2, wake: 3, range: 4, cone: "wide", hear: 0, toss: { period: 7, offset: 0, facing: 2 } },
    { kind: "patrol", id: "grandma", path: [...run(6, 1, 3), look(4, 6, 0), ...run(6, 4, 8), look(9, 6, 0), ...run(6, 9, 11), ...run(6, 10, 2)], start: 6, range: 3, cone: "narrow", hear: 0, alert: 2 },
  ],
  props: [
    { kind: "bed", x: 6, y: 1, h: 2 },
    { kind: "stairs", x: 12, y: 5 },
  ],
  par: 23,
};

export const LEVELS: readonly LevelDef[] = [DOORWAY, HALLWAY, STAIRS, KITCHEN, PANTRY, LAUNDRY, DINING, SOFA, LIVING, RETURN];

export const ACTS: readonly { id: string; first: number; last: number }[] = [
  { id: "upstairs", first: 0, last: 1 },
  { id: "grandma", first: 2, last: 4 },
  { id: "pets", first: 5, last: 8 },
  { id: "back", first: 9, last: 9 },
];
