import { migrate, readVersioned, type Json, type MigrationSpec } from "@/lib/progress/migrate";
import { STICKER_IDS, type StickerId } from "./album";

export const SAVE_KEY = "canal404:operation-recess:v1";

export type RecessSave = { stickers: StickerId[] };

export function emptySave(): RecessSave {
  return { stickers: [] };
}

function normalizeSave(value: Json): RecessSave {
  const owned: unknown[] = Array.isArray(value.stickers) ? value.stickers : [];
  return { stickers: STICKER_IDS.filter((id) => owned.includes(id)) };
}

export const SAVE_SPEC: MigrationSpec<RecessSave> = { version: 1, normalize: normalizeSave };

export function loadSave(storage?: Storage | null): RecessSave {
  const loaded = readVersioned(SAVE_KEY, SAVE_SPEC, storage);
  return loaded.status === "ok" ? loaded.value : emptySave();
}

export function parseSave(raw: string | null): RecessSave {
  if (raw === null) return emptySave();
  try {
    const migrated = migrate(JSON.parse(raw), SAVE_SPEC);
    return migrated.ok ? migrated.value : emptySave();
  } catch {
    return emptySave();
  }
}

export function writeSave(save: RecessSave, storage?: Storage | null) {
  try {
    (storage ?? window.localStorage).setItem(SAVE_KEY, JSON.stringify({ version: 1, ...save }));
  } catch {
    return;
  }
}

export function addSticker(save: RecessSave, id: StickerId) {
  if (save.stickers.includes(id)) return false;
  save.stickers = STICKER_IDS.filter((s) => s === id || save.stickers.includes(s));
  return true;
}
