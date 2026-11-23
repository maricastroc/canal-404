import { isSyncableKey, type Snapshot } from "@/lib/competition/recovery";
import { backupRaw, migrate } from "./migrate";
import { PROGRESS_SPEC, STORAGE_KEY } from "./store";

function syncableKeys(storage: Storage) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && isSyncableKey(key)) keys.push(key);
  }
  return keys.sort();
}

export function takeSnapshot(storage: Storage): Snapshot {
  const keys: Record<string, string> = {};
  for (const key of syncableKeys(storage)) {
    const raw = storage.getItem(key);
    if (raw !== null) keys[key] = raw;
  }
  return { version: 1, keys };
}

export function sameSnapshot(a: Snapshot, b: Snapshot) {
  const keys = Object.keys(a.keys);
  return keys.length === Object.keys(b.keys).length && keys.every((key) => b.keys[key] === a.keys[key]);
}

function progressIn(raw: string) {
  try {
    const loaded = migrate(JSON.parse(raw), PROGRESS_SPEC);
    if (!loaded.ok) return true;
    const { games, secrets, achievements } = loaded.value;
    return Object.keys(games).length > 0 || Object.keys(secrets).length > 0 || Object.keys(achievements).some((id) => id !== "first-visit");
  } catch {
    return true;
  }
}

export function hasProgress(snapshot: Snapshot) {
  return Object.entries(snapshot.keys).some(([key, raw]) => (key === STORAGE_KEY ? progressIn(raw) : true));
}

export function applySnapshot(snapshot: Snapshot, storage: Storage) {
  for (const key of syncableKeys(storage)) {
    const raw = storage.getItem(key);
    if (raw !== null && raw !== snapshot.keys[key]) backupRaw(key, raw, "restore", storage);
    if (!Object.hasOwn(snapshot.keys, key)) storage.removeItem(key);
  }
  for (const [key, raw] of Object.entries(snapshot.keys)) {
    if (isSyncableKey(key)) storage.setItem(key, raw);
  }
}
