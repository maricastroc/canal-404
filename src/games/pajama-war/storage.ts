import type { KidId } from "./config";

const KEY = "canal404:pajama-war:v1";

export type PajamaStats = { wins: Record<KidId, number>; matches: number; bestTime: number; lastKid: KidId | null };

const EMPTY: PajamaStats = { wins: { lia: 0, nico: 0, bia: 0 }, matches: 0, bestTime: 0, lastKid: null };

export function loadStats(): PajamaStats {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, wins: { ...EMPTY.wins } };
    const data = JSON.parse(raw) as Partial<PajamaStats>;
    return {
      wins: { ...EMPTY.wins, ...data.wins },
      matches: data.matches ?? 0,
      bestTime: data.bestTime ?? 0,
      lastKid: data.lastKid ?? null,
    };
  } catch {
    return { ...EMPTY, wins: { ...EMPTY.wins } };
  }
}

export function saveStats(stats: PajamaStats) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    return;
  }
}
