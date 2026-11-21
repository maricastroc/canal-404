import type { LevelDef } from "./types";

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
  agents: [{ kind: "sleeper", id: "dad", x: 6, y: 2, wake: 3, range: 4, cone: "wide", hear: 0 }],
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
        { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 },
        { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
        { x: 7, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 },
        { x: 3, y: 4 }, { x: 3, y: 3 },
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
    { kind: "counter", x: 2, y: 1 },
    { kind: "counter", x: 8, y: 1 },
    { kind: "counter", x: 10, y: 1, w: 2 },
    { kind: "counter", x: 1, y: 6, w: 2 },
    { kind: "plant", x: 4, y: 6 },
    { kind: "counter", x: 9, y: 6, w: 3 },
    { kind: "door", x: 12, y: 2 },
    { kind: "door", x: 0, y: 4 },
  ],
  par: 16,
};

export const LIVING: LevelDef = {
  id: "living",
  map: [
    "#############",
    "#o.~..#.....#",
    "#..oo.#..o.o#",
    "#B.........G#",
    "#.ooo.#..o..#",
    "#.~...#.....#",
    "#############",
  ],
  loud: 3,
  agents: [
    { kind: "sleeper", id: "dad", x: 1, y: 1, wake: 3, range: 4, cone: "wide", hear: 0 },
    { kind: "dog", id: "pipoca", x: 6, y: 3, hear: 4, sniff: 2 },
  ],
  props: [
    { kind: "armchair", x: 1, y: 1 },
    { kind: "sofa", x: 3, y: 2, w: 2 },
    { kind: "shelf", x: 2, y: 4, w: 3 },
    { kind: "dogbed", x: 6, y: 3 },
    { kind: "armchair", x: 9, y: 2 },
    { kind: "armchair", x: 9, y: 4 },
    { kind: "tv", x: 11, y: 2 },
    { kind: "vcr", x: 11, y: 3 },
  ],
  par: 16,
};

export const LEVELS: readonly LevelDef[] = [HALLWAY, KITCHEN, LIVING];
