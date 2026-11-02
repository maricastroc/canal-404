import { finite, isRecord, readVersioned, type Json, type MigrationSpec } from "@/lib/progress/migrate";
import { KIDS, type KidId } from "./config";

const KEY = "canal404:pajama-war:v1";

export type PajamaStats = { wins: Record<KidId, number>; matches: number; bestTime: number; lastKid: KidId | null };

function empty(): PajamaStats {
  return { wins: { lia: 0, nico: 0, bia: 0 }, matches: 0, bestTime: 0, lastKid: null };
}

function normalizeStats(value: Json): PajamaStats {
  const stats = empty();
  if (isRecord(value.wins)) for (const kid of KIDS) stats.wins[kid] = Math.max(0, finite(value.wins[kid], 0));
  stats.matches = Math.max(0, finite(value.matches, 0));
  stats.bestTime = Math.max(0, finite(value.bestTime, 0));
  stats.lastKid = KIDS.includes(value.lastKid as KidId) ? (value.lastKid as KidId) : null;
  return stats;
}

export const STATS_SPEC: MigrationSpec<PajamaStats> = {
  version: 1,
  unversioned: 0,
  migrations: { 0: (value) => value },
  normalize: normalizeStats,
};

export function loadStats(): PajamaStats {
  const loaded = readVersioned(KEY, STATS_SPEC);
  if (loaded.status !== "ok") return empty();
  const { wins, matches, bestTime, lastKid } = loaded.value;
  return { wins: { ...wins }, matches, bestTime, lastKid };
}

export function saveStats(stats: PajamaStats) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, ...stats }));
  } catch {
    return;
  }
}
