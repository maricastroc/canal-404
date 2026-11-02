export type Json = Record<string, unknown>;

export type MigrationSpec<T> = {
  version: number;
  field?: string;
  unversioned?: number;
  migrations?: Record<number, (value: Json) => Json>;
  normalize: (value: Json) => T | null;
};

export type Migrated<T> = { ok: true; value: T; migrated: boolean; from: number } | { ok: false };

export type Loaded<T> = { status: "empty" } | { status: "invalid" } | { status: "ok"; value: T; migrated: boolean };

const KEEP_BACKUPS = 2;

export function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function finite(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function migrate<T>(input: unknown, spec: MigrationSpec<T>): Migrated<T> {
  if (!isRecord(input)) return { ok: false };
  const field = spec.field ?? "version";
  const declared = input[field] === undefined ? spec.unversioned : input[field];
  if (typeof declared !== "number" || !Number.isInteger(declared) || declared < 0 || declared > spec.version) return { ok: false };
  let value: Json = input;
  let version = declared;
  try {
    while (version < spec.version) {
      const step = spec.migrations?.[version];
      if (!step) return { ok: false };
      const next = step(value);
      if (!isRecord(next)) return { ok: false };
      value = next;
      version += 1;
    }
    const normalized = spec.normalize({ ...value, [field]: spec.version });
    if (normalized === null) return { ok: false };
    return { ok: true, value: normalized, migrated: declared !== spec.version, from: declared };
  } catch {
    return { ok: false };
  }
}

function backupPrefix(key: string) {
  return `${key}:backup:`;
}

export function listBackups(key: string, storage: Storage) {
  const prefix = backupPrefix(key);
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const name = storage.key(i);
    if (name?.startsWith(prefix)) keys.push(name);
  }
  const stamp = (name: string) => Number(name.slice(name.lastIndexOf(":") + 1)) || 0;
  return keys.sort((a, b) => stamp(a) - stamp(b));
}

export function backupRaw(key: string, raw: string, label: string, storage: Storage) {
  try {
    const existing = listBackups(key, storage);
    if (existing.some((name) => storage.getItem(name) === raw)) return;
    storage.setItem(`${backupPrefix(key)}${label}:${Date.now()}`, raw);
    const all = listBackups(key, storage);
    for (const name of all.slice(0, Math.max(0, all.length - KEEP_BACKUPS))) storage.removeItem(name);
  } catch {
    return;
  }
}

function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readVersioned<T>(key: string, spec: MigrationSpec<T>, storage: Storage | null = browserStorage()): Loaded<T> {
  if (!storage) return { status: "empty" };
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { status: "empty" };
  }
  if (raw === null) return { status: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    backupRaw(key, raw, "unreadable", storage);
    return { status: "invalid" };
  }
  const result = migrate(parsed, spec);
  if (!result.ok) {
    const declared = isRecord(parsed) ? parsed[spec.field ?? "version"] : undefined;
    backupRaw(key, raw, typeof declared === "number" ? `v${declared}` : "unreadable", storage);
    return { status: "invalid" };
  }
  if (result.migrated) {
    backupRaw(key, raw, `v${result.from}`, storage);
    try {
      storage.setItem(key, JSON.stringify({ ...result.value, [spec.field ?? "version"]: spec.version }));
    } catch {
      return { status: "ok", value: result.value, migrated: true };
    }
  }
  return { status: "ok", value: result.value, migrated: result.migrated };
}
