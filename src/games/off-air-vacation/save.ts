import { finite, isRecord, readVersioned, type Json, type MigrationSpec } from "@/lib/progress/migrate";
import { AREA_IDS, SAVE_KEY, type AreaId, type Dir } from "./config";

export type Item = "net" | "whistle" | "remote" | "order" | "key" | "cartridge";
export type PosterId = "club" | "summer" | "tilt" | "surf" | "ghost";
export type TokenId = "lounge" | "shell" | "log";
export type SecretId = "room404" | "machine" | "lento";
export type FolkKey = "bigodes" | "marola" | "tilt" | "marisa" | "psiu" | "lento" | "mascot" | "capi" | "clique" | "cavuca" | "chiado" | "placar";

export type State = {
  v: 1;
  id: string;
  rev: number;
  area: AreaId;
  x: number;
  y: number;
  dir: Dir;
  facing: number;
  flags: Record<string, boolean>;
  items: Item[];
  posters: PosterId[];
  tokens: TokenId[];
  secrets: SecretId[];
  met: FolkKey[];
  found: string[];
  visited: AreaId[];
  time: number;
  ending: "off" | "on" | null;
};

export const ALL_ITEMS: Item[] = ["net", "whistle", "remote", "order", "key", "cartridge"];
export const ALL_FOLKS: FolkKey[] = ["bigodes", "marola", "tilt", "marisa", "psiu", "lento", "mascot", "capi", "clique", "cavuca", "chiado", "placar"];
export const ALL_POSTERS: PosterId[] = ["club", "summer", "tilt", "surf", "ghost"];
export const ALL_TOKENS: TokenId[] = ["lounge", "shell", "log"];
export const ALL_SECRETS: SecretId[] = ["room404", "machine", "lento"];

export function freshState(): State {
  return {
    v: 1,
    id: "",
    rev: 0,
    area: "lobby",
    x: 1200,
    y: 1120,
    dir: "k",
    facing: 1,
    flags: {},
    items: [],
    posters: [],
    tokens: [],
    secrets: [],
    met: [],
    found: [],
    visited: [],
    time: 0,
    ending: null,
  };
}

const DIRS: Dir[] = ["f", "k", "s"];

function only<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((v): v is T => allowed.includes(v as T)))];
}

function normalizeState(value: Json): State {
  const fresh = freshState();
  const area = AREA_IDS.includes(value.area as AreaId) ? (value.area as AreaId) : fresh.area;
  const sameArea = area === value.area;
  const flags: Record<string, boolean> = {};
  if (isRecord(value.flags)) for (const [name, on] of Object.entries(value.flags)) if (typeof on === "boolean") flags[name] = on;
  return {
    v: 1,
    id: typeof value.id === "string" ? value.id.slice(0, 40) : "",
    rev: Math.max(0, Math.floor(finite(value.rev, 0))),
    area,
    x: sameArea ? finite(value.x, fresh.x) : fresh.x,
    y: sameArea ? finite(value.y, fresh.y) : fresh.y,
    dir: DIRS.includes(value.dir as Dir) ? (value.dir as Dir) : fresh.dir,
    facing: value.facing === -1 ? -1 : 1,
    flags,
    items: only(value.items, ALL_ITEMS),
    posters: only(value.posters, ALL_POSTERS),
    tokens: only(value.tokens, ALL_TOKENS),
    secrets: only(value.secrets, ALL_SECRETS),
    met: only(value.met, ALL_FOLKS),
    found: Array.isArray(value.found) ? [...new Set(value.found.filter((f): f is string => typeof f === "string"))] : [],
    visited: only(value.visited, AREA_IDS),
    time: Math.max(0, finite(value.time, 0)),
    ending: value.ending === "off" || value.ending === "on" ? value.ending : null,
  };
}

export const SAVE_SPEC: MigrationSpec<State> = { version: 1, field: "v", normalize: normalizeState };

export function loadState(): State | null {
  const loaded = readVersioned(SAVE_KEY, SAVE_SPEC);
  return loaded.status === "ok" ? loaded.value : null;
}

export function endingUnreported(s: State, highScore: number) {
  if (!s.flags.ended) return false;
  if ("resultPending" in s.flags) return s.flags.resultPending;
  return highScore <= 0;
}

export function newAdventureId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function movedOn(raw: string, s: State) {
  try {
    const stored = JSON.parse(raw) as unknown;
    if (!isRecord(stored)) return false;
    const id = typeof stored.id === "string" ? stored.id : "";
    const rev = typeof stored.rev === "number" && Number.isFinite(stored.rev) ? stored.rev : 0;
    return (id !== "" && s.id !== "" && id !== s.id) || rev > s.rev;
  } catch {
    return false;
  }
}

export function saveState(s: State) {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (raw === null ? s.rev > 0 : movedOn(raw, s)) return false;
    s.rev += 1;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function clearState() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    return;
  }
}
