import type { Ramp, Track } from "./track";

export type CourseId = "arlindo" | "feira" | "antena";

export type ZoneKey = "street" | "market" | "works" | "final" | "neighborhood" | "feira" | "antena";

export type Zone = { key: ZoneKey; x0: number; x1: number };

export type Section = { key: string; x: number };

export type Chalk = { x: number; kind: "hold" | "jump"; surface: number };

export type ArlindoSet = {
  kind: "arlindo";
  house: number;
  hose: number;
  plank: Ramp;
  yard: { x0: number; x1: number };
  wheelbarrow: Ramp;
  roof: { x0: number; x1: number };
  fence: number;
  truck: number;
  truckRamp: Ramp;
  cat: number;
  dog: number;
  boxes: number;
};

export type FeiraSet = {
  kind: "feira";
  fruit: { x0: number; x1: number; crate: number }[];
  market: { x0: number; x1: number };
  crateRamp: Ramp;
  awnings: number[];
  trolley: Ramp;
  stands: number[];
  stairs: { x0: number; x1: number };
  rail: number;
  plaza: { x0: number; x1: number };
  flock: { x0: number; x1: number };
  cidinha: number;
};

export type AntenaSet = {
  kind: "antena";
  works: { x0: number; x1: number };
  seesaws: { x0: number; pivot: number; x1: number }[];
  bags: number[];
  loop: number;
  hole: number;
  exit: number;
  stairs: { x0: number; x1: number }[];
  landings: number[];
  plaza: { x0: number; x1: number };
};

export type Course = Track & {
  id: CourseId;
  sections: Section[];
  zones: Zone[];
  grid: { lina: number; bruno: number; mila: number };
  chalk: Chalk[];
  set: ArlindoSet | FeiraSet | AntenaSet | null;
};
