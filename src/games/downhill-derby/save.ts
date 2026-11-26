import { finite, isRecord, readVersioned, type Json, type MigrationSpec } from "@/lib/progress/migrate";
import { CART_IDS, UNLOCKS, type CartId } from "./sim/carts";
import type { CourseId } from "./sim/course";
import { RACE_COURSES } from "./sim/score";

export const SAVE_KEY = "canal404:downhill-derby:v1";

export type TrackRecord = { time: number; show: number; splits: number[] };

export type TrackWins = Partial<Record<CartId, number>>;

export type FeatId = "gnome" | "clean" | "awnings" | "pigeons" | "loop" | "pipe";

export const FEATS: Readonly<Record<CourseId, readonly FeatId[]>> = {
  arlindo: ["gnome", "clean"],
  feira: ["awnings", "pigeons"],
  antena: ["loop", "pipe"],
};

export type GoalBook = { feats: Partial<Record<CourseId, FeatId[]>>; champions: Partial<Record<CourseId, CartId[]>> };

export type DerbySave = GoalBook & { cart: CartId; ghost: boolean; unlocked: CartId[]; tracks: Partial<Record<CourseId, TrackRecord>>; wins: Partial<Record<CourseId, TrackWins>> };

export function emptySave(): DerbySave {
  return { cart: "deco", ghost: false, unlocked: [], tracks: {}, wins: {}, feats: {}, champions: {} };
}

function normalizeRecord(value: unknown): TrackRecord | null {
  if (!isRecord(value)) return null;
  const time = finite(value.time, 0);
  if (time <= 0) return null;
  const splits = Array.isArray(value.splits) ? value.splits.map((v) => finite(v, Number.NaN)) : [];
  return { time, show: Math.max(0, Math.round(finite(value.show, 0))), splits };
}

function normalizeWins(value: unknown): TrackWins | null {
  if (!isRecord(value)) return null;
  const wins: TrackWins = {};
  for (const cart of CART_IDS) {
    const count = Math.floor(finite(value[cart], 0));
    if (count > 0) wins[cart] = count;
  }
  return Object.keys(wins).length > 0 ? wins : null;
}

function normalizeSave(value: Json): DerbySave {
  const save = emptySave();
  if ((CART_IDS as readonly unknown[]).includes(value.cart)) save.cart = value.cart as CartId;
  save.ghost = value.ghost === true;
  if (Array.isArray(value.unlocked)) save.unlocked = CART_IDS.filter((c) => UNLOCKS[c] && (value.unlocked as unknown[]).includes(c));
  if (isRecord(value.tracks)) {
    for (const course of RACE_COURSES) {
      const record = normalizeRecord(value.tracks[course]);
      if (record) save.tracks[course] = record;
    }
  }
  if (isRecord(value.wins)) {
    for (const course of RACE_COURSES) {
      const wins = normalizeWins(value.wins[course]);
      if (wins) save.wins[course] = wins;
    }
  }
  if (isRecord(value.feats)) {
    for (const course of RACE_COURSES) {
      const list = value.feats[course];
      const feats = Array.isArray(list) ? FEATS[course].filter((f) => list.includes(f)) : [];
      if (feats.length > 0) save.feats[course] = feats;
    }
  }
  if (isRecord(value.champions)) {
    for (const course of RACE_COURSES) {
      const list = value.champions[course];
      const carts = Array.isArray(list) ? CART_IDS.filter((c) => list.includes(c)) : [];
      if (carts.length > 0) save.champions[course] = carts;
    }
  }
  if (!isUnlocked(save, save.cart)) save.cart = "deco";
  return save;
}

export const SAVE_SPEC: MigrationSpec<DerbySave> = { version: 1, normalize: normalizeSave };

export function isUnlocked(save: DerbySave, cart: CartId) {
  return !UNLOCKS[cart] || save.unlocked.includes(cart);
}

export function loadSave(storage?: Storage | null): DerbySave {
  const loaded = readVersioned(SAVE_KEY, SAVE_SPEC, storage);
  return loaded.status === "ok" ? loaded.value : emptySave();
}

export function writeSave(save: DerbySave, storage?: Storage | null) {
  try {
    (storage ?? window.localStorage).setItem(SAVE_KEY, JSON.stringify({ version: 1, ...save }));
  } catch {
    return;
  }
}

export function addWin(save: DerbySave, course: CourseId, cart: CartId) {
  const wins = (save.wins[course] ??= {});
  wins[cart] = (wins[cart] ?? 0) + 1;
}

export function updateSave(change: (save: DerbySave) => void) {
  const save = loadSave();
  change(save);
  writeSave(save);
  return save;
}
