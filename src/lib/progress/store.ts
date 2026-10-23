import {
  ACHIEVEMENTS,
  SECRETS,
  achievementById,
  secretById,
  type AchievementId,
  type SecretId,
} from "./definitions";

export type GameRecord = {
  highScore: number;
  bestStars: number;
  plays: number;
  wins: number;
  lastScore: number;
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

const STORAGE_KEY = "canal404:progresso:v1";

export const DEFAULT_STATE: ProgressState = {
  version: 1,
  visitorNumber: 84201,
  visits: 0,
  firstVisitAt: null,
  lastVisitAt: null,
  settings: { sfx: true, music: false, track: "tema" },
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

function readStorage(): ProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    if (parsed.version !== 1) return DEFAULT_STATE;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
      secrets: { ...parsed.secrets },
      achievements: { ...parsed.achievements },
      games: { ...parsed.games },
      counters: { ...parsed.counters },
    };
  } catch {
    return DEFAULT_STATE;
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
    isNewSession = !window.sessionStorage.getItem("canal404:sessao");
    window.sessionStorage.setItem("canal404:sessao", "1");
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
  if (first) unlockAchievement("primeira-visita");
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
  if (found >= 3) unlockAchievement("explorador");
  if (found >= SECRETS.length) unlockAchievement("cacador");
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
    games: { ...state.games, [slug]: { ...current, plays: current.plays + 1 } },
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

export function resetProgress() {
  ensureLoaded();
  commit({
    ...DEFAULT_STATE,
    visitorNumber: state.visitorNumber,
    visits: state.visits,
    firstVisitAt: state.firstVisitAt,
    lastVisitAt: state.lastVisitAt,
    settings: state.settings,
    achievements: state.achievements["primeira-visita"]
      ? { "primeira-visita": state.achievements["primeira-visita"] }
      : {},
  });
}

export const TOTAL_SECRETS = SECRETS.length;
export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;
