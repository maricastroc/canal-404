import {
  ACHIEVEMENTS,
  SECRETS,
  achievementById,
  secretById,
  type AchievementId,
  type SecretId,
} from "./definitions";
import { finite, isRecord, readVersioned, type Json, type MigrationSpec } from "./migrate";

export type LevelRecord = { stars: number; score: number };

export type GameRecord = {
  highScore: number;
  bestStars: number;
  plays: number;
  wins: number;
  lastScore: number;
  levels?: Record<string, LevelRecord>;
  lastPlayedAt?: number;
};

export type Settings = {
  sfx: boolean;
  music: boolean;
  track: string;
};

export type ProgressState = {
  version: 1;
  visitorNumber: number;
  visits: number;
  firstVisitAt: number | null;
  lastVisitAt: number | null;
  settings: Settings;
  secrets: Partial<Record<SecretId, number>>;
  achievements: Partial<Record<AchievementId, number>>;
  games: Record<string, GameRecord>;
  counters: Record<string, number>;
};

export type Toast = {
  id: number;
  kind: "secret" | "achievement" | "info";
  title: string;
  description: string;
};

const STORAGE_KEY = "canal404:progress:v1";
const DATA_PREFIX = "canal404:";
const SECRET_SET = new Set<string>(SECRETS.map((s) => s.id));
const ACHIEVEMENT_SET = new Set<string>(ACHIEVEMENTS.map((a) => a.id));

export const DEFAULT_STATE: ProgressState = {
  version: 1,
  visitorNumber: 84201,
  visits: 0,
  firstVisitAt: null,
  lastVisitAt: null,
  settings: { sfx: true, music: false, track: "theme" },
  secrets: {},
  achievements: {},
  games: {},
  counters: {},
};

const EMPTY_RECORD: GameRecord = {
  highScore: 0,
  bestStars: 0,
  plays: 0,
  wins: 0,
  lastScore: 0,
};

let state: ProgressState = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

let toasts: Toast[] = [];
let toastSeq = 0;
const toastListeners = new Set<() => void>();

function numbers(value: unknown, keep: (key: string) => boolean = () => true) {
  const out: Record<string, number> = {};
  if (!isRecord(value)) return out;
  for (const [key, v] of Object.entries(value)) if (keep(key) && typeof v === "number" && Number.isFinite(v)) out[key] = v;
  return out;
}

function normalizeRecord(value: unknown): GameRecord | null {
  if (!isRecord(value)) return null;
  const record: GameRecord = {
    highScore: finite(value.highScore, 0),
    bestStars: finite(value.bestStars, 0),
    plays: finite(value.plays, 0),
    wins: finite(value.wins, 0),
    lastScore: finite(value.lastScore, 0),
  };
  if (isRecord(value.levels)) {
    const levels: Record<string, LevelRecord> = {};
    for (const [id, level] of Object.entries(value.levels)) {
      if (isRecord(level)) levels[id] = { stars: finite(level.stars, 0), score: finite(level.score, 0) };
    }
    record.levels = levels;
  }
  if (typeof value.lastPlayedAt === "number" && Number.isFinite(value.lastPlayedAt)) record.lastPlayedAt = value.lastPlayedAt;
  return record;
}

function normalizeProgress(value: Json): ProgressState {
  const settings = isRecord(value.settings) ? value.settings : {};
  const games: Record<string, GameRecord> = {};
  if (isRecord(value.games)) {
    for (const [slug, record] of Object.entries(value.games)) {
      const normalized = normalizeRecord(record);
      if (normalized) games[slug] = normalized;
    }
  }
  const time = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    version: 1,
    visitorNumber: finite(value.visitorNumber, DEFAULT_STATE.visitorNumber),
    visits: finite(value.visits, 0),
    firstVisitAt: time(value.firstVisitAt),
    lastVisitAt: time(value.lastVisitAt),
    settings: {
      sfx: typeof settings.sfx === "boolean" ? settings.sfx : DEFAULT_STATE.settings.sfx,
      music: typeof settings.music === "boolean" ? settings.music : DEFAULT_STATE.settings.music,
      track: typeof settings.track === "string" ? settings.track : DEFAULT_STATE.settings.track,
    },
    secrets: numbers(value.secrets, (id) => SECRET_SET.has(id)),
    achievements: numbers(value.achievements, (id) => ACHIEVEMENT_SET.has(id)),
    games,
    counters: numbers(value.counters),
  };
}

export const PROGRESS_SPEC: MigrationSpec<ProgressState> = {
  version: 1,
  normalize: normalizeProgress,
};

function readStorage(): ProgressState {
  const loaded = readVersioned(STORAGE_KEY, PROGRESS_SPEC);
  return loaded.status === "ok" ? loaded.value : DEFAULT_STATE;
}

function clearGameData() {
  try {
    const storage = window.localStorage;
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key && key.startsWith(DATA_PREFIX) && key !== STORAGE_KEY) keys.push(key);
    }
    for (const key of keys) storage.removeItem(key);
  } catch {
    return;
  }
}

function writeStorage() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = readStorage();
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = readStorage();
    emit();
  });
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: ProgressState) {
  state = next;
  writeStorage();
  emit();
}

export function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot() {
  ensureLoaded();
  return state;
}

export function getServerSnapshot() {
  return DEFAULT_STATE;
}

export function subscribeToasts(listener: () => void) {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

export function getToasts() {
  return toasts;
}

const NO_TOASTS: Toast[] = [];
export function getServerToasts() {
  return NO_TOASTS;
}

export function pushToast(toast: Omit<Toast, "id">) {
  toastSeq += 1;
  toasts = [...toasts, { ...toast, id: toastSeq }];
  toastListeners.forEach((l) => l());
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  toastListeners.forEach((l) => l());
}

export function registerVisit() {
  ensureLoaded();
  let isNewSession = true;
  try {
    isNewSession = !window.sessionStorage.getItem("canal404:session");
    window.sessionStorage.setItem("canal404:session", "1");
  } catch {}
  if (!isNewSession) return state;
  const now = Date.now();
  const first = state.firstVisitAt === null;
  commit({
    ...state,
    visitorNumber: first
      ? 84201 + Math.floor(Math.random() * 380)
      : state.visitorNumber,
    visits: state.visits + 1,
    firstVisitAt: state.firstVisitAt ?? now,
    lastVisitAt: now,
  });
  if (first) unlockAchievement("first-visit");
  return state;
}

export function unlockAchievement(id: AchievementId) {
  ensureLoaded();
  if (state.achievements[id]) return false;
  commit({ ...state, achievements: { ...state.achievements, [id]: Date.now() } });
  const def = achievementById(id);
  if (def) {
    pushToast({
      kind: "achievement",
      title: def.title,
      description: def.description,
    });
  }
  return true;
}

export function unlockSecret(id: SecretId) {
  ensureLoaded();
  if (state.secrets[id]) return false;
  commit({ ...state, secrets: { ...state.secrets, [id]: Date.now() } });
  const def = secretById(id);
  if (def) {
    pushToast({ kind: "secret", title: def.title, description: def.description });
  }
  const found = Object.keys(state.secrets).length;
  if (found >= 3) unlockAchievement("explorer");
  if (found >= SECRETS.length) unlockAchievement("secret-hunter");
  return true;
}

export function bumpCounter(id: string, by = 1) {
  ensureLoaded();
  const value = (state.counters[id] ?? 0) + by;
  commit({ ...state, counters: { ...state.counters, [id]: value } });
  return value;
}

export function setCounter(id: string, value: number) {
  ensureLoaded();
  commit({ ...state, counters: { ...state.counters, [id]: value } });
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  ensureLoaded();
  commit({ ...state, settings: { ...state.settings, [key]: value } });
}

export function getGameRecord(slug: string): GameRecord {
  ensureLoaded();
  return state.games[slug] ?? EMPTY_RECORD;
}

export function recordGameStart(slug: string) {
  ensureLoaded();
  const current = state.games[slug] ?? EMPTY_RECORD;
  commit({
    ...state,
    games: { ...state.games, [slug]: { ...current, plays: current.plays + 1, lastPlayedAt: Date.now() } },
  });
}

export function recordGameResult(
  slug: string,
  result: { score: number; stars: number; won: boolean },
) {
  ensureLoaded();
  const current = state.games[slug] ?? EMPTY_RECORD;
  const isRecord = result.score > current.highScore;
  const next: GameRecord = {
    ...current,
    highScore: Math.max(current.highScore, result.score),
    bestStars: Math.max(current.bestStars, result.won ? result.stars : 0),
    wins: current.wins + (result.won ? 1 : 0),
    lastScore: result.score,
  };
  commit({ ...state, games: { ...state.games, [slug]: next } });
  return { isRecord: isRecord && result.score > 0, previousBest: current.highScore, record: next };
}

export function recordLevelResult(
  slug: string,
  levelId: string,
  result: { score: number; stars: number; won: boolean },
) {
  ensureLoaded();
  const current = state.games[slug] ?? EMPTY_RECORD;
  const levels = { ...current.levels };
  const before = levels[levelId] ?? { stars: 0, score: 0 };
  const improved = result.won && (result.stars > before.stars || result.score > before.score);
  if (result.won) {
    levels[levelId] = { stars: Math.max(before.stars, result.stars), score: Math.max(before.score, result.score) };
  }
  const totals = Object.values(levels).reduce(
    (acc, l) => ({ score: acc.score + l.score, stars: acc.stars + l.stars }),
    { score: 0, stars: 0 },
  );
  const next: GameRecord = {
    ...current,
    levels,
    highScore: totals.score,
    bestStars: totals.stars,
    wins: current.wins + (result.won ? 1 : 0),
    lastScore: result.score,
  };
  commit({ ...state, games: { ...state.games, [slug]: next } });
  return { isRecord: improved, previous: before, record: next };
}

export function resetProgress() {
  ensureLoaded();
  clearGameData();
  commit({
    ...DEFAULT_STATE,
    visitorNumber: state.visitorNumber,
    visits: state.visits,
    firstVisitAt: state.firstVisitAt,
    lastVisitAt: state.lastVisitAt,
    settings: state.settings,
    achievements: state.achievements["first-visit"]
      ? { "first-visit": state.achievements["first-visit"] }
      : {},
  });
}

export const TOTAL_SECRETS = SECRETS.length;
export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;
