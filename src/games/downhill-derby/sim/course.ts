import type { Ramp, Track } from "./track";

export type CourseId = "arlindo" | "test";

export const COURSE_IDS: readonly CourseId[] = ["arlindo", "test"];

export type ZoneKey = "street" | "market" | "works" | "final" | "neighborhood";

export type Zone = { key: ZoneKey; x0: number; x1: number };

export type Section = { key: string; x: number };

export type Chalk = { x: number; kind: "hold" | "jump"; surface: number };

export type ArlindoSet = {
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

export type Course = Track & {
  id: CourseId;
  sections: Section[];
  zones: Zone[];
  grid: { lina: number; bruno: number };
  chalk: Chalk[];
  set: ArlindoSet | null;
};
