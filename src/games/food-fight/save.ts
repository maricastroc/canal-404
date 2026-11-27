import { finite, readVersioned, type Json, type MigrationSpec } from "@/lib/progress/migrate";
import { FEATS, type ChallengeBook } from "./challenges";
import { RIVAL_KINDS } from "./config";

const KEY = "canal404:food-fight:v1";

export type FoodFightSave = ChallengeBook & { tutorialDone: boolean; catchDone: boolean; catchLessons: number };

function empty(): FoodFightSave {
  return { tutorialDone: false, catchDone: false, catchLessons: 0, feats: [], returned: [] };
}

function normalizeSave(value: Json): FoodFightSave {
  const save = empty();
  save.tutorialDone = value.tutorialDone === true;
  save.catchDone = value.catchDone === true;
  save.catchLessons = Math.max(0, Math.floor(finite(value.catchLessons, 0)));
  const feats = Array.isArray(value.feats) ? value.feats : [];
  save.feats = FEATS.filter((f) => feats.includes(f));
  const returned = Array.isArray(value.returned) ? value.returned : [];
  save.returned = RIVAL_KINDS.filter((k) => returned.includes(k));
  return save;
}

export const SAVE_SPEC: MigrationSpec<FoodFightSave> = {
  version: 1,
  field: "v",
  unversioned: 1,
  normalize: normalizeSave,
};

export function loadSave(): FoodFightSave {
  const loaded = readVersioned(KEY, SAVE_SPEC);
  if (loaded.status !== "ok") return empty();
  const { feats, returned, ...flags } = loaded.value;
  return { ...flags, feats: [...feats], returned: [...returned] };
}

export function writeSave(patch: Partial<FoodFightSave>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...loadSave(), ...patch, v: 1 }));
  } catch {
    return;
  }
}
