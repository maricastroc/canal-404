import { finite, isRecord, readVersioned, type Json, type MigrationSpec } from "@/lib/progress/migrate";
import { ARENAS } from "./arenas";
import type { ChallengeBook } from "./challenges";
import { KIDS, type KidId } from "./config";

const KEY = "canal404:pajama-war:v1";

export const HINTS = ["ricochet", "special", "fort"] as const;
export type HintId = (typeof HINTS)[number];

export type PajamaStats = ChallengeBook & { wins: Record<KidId, number>; matches: number; bestTime: number; lastKid: KidId | null; hints: HintId[] };

function empty(): PajamaStats {
  return { wins: { lia: 0, nico: 0, bia: 0 }, matches: 0, bestTime: 0, lastKid: null, hints: [], feats: {}, wonWith: {} };
}

function normalizeStats(value: Json): PajamaStats {
  const stats = empty();
  if (isRecord(value.wins)) for (const kid of KIDS) stats.wins[kid] = Math.max(0, finite(value.wins[kid], 0));
  stats.matches = Math.max(0, finite(value.matches, 0));
  stats.bestTime = Math.max(0, finite(value.bestTime, 0));
  stats.lastKid = KIDS.includes(value.lastKid as KidId) ? (value.lastKid as KidId) : null;
  if (Array.isArray(value.hints)) stats.hints = HINTS.filter((h) => (value.hints as unknown[]).includes(h));
  for (const arena of ARENAS) {
    const feats = isRecord(value.feats) ? value.feats[arena.id] : null;
    const got = Array.isArray(feats) ? arena.feats.filter((f) => feats.includes(f)) : [];
    if (got.length > 0) stats.feats[arena.id] = got;
    const kids = isRecord(value.wonWith) ? value.wonWith[arena.id] : null;
    const won = Array.isArray(kids) ? KIDS.filter((k) => kids.includes(k)) : [];
    if (won.length > 0) stats.wonWith[arena.id] = won;
  }
  return stats;
}

export const STATS_SPEC: MigrationSpec<PajamaStats> = {
  version: 1,
  unversioned: 0,
  migrations: { 0: (value) => value },
  normalize: normalizeStats,
};

const copyLists = <T>(lists: Partial<Record<string, T[]>>) => Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, [...(v ?? [])]]));

export function loadStats(): PajamaStats {
  const loaded = readVersioned(KEY, STATS_SPEC);
  if (loaded.status !== "ok") return empty();
  const { wins, matches, bestTime, lastKid, hints, feats, wonWith } = loaded.value;
  return { wins: { ...wins }, matches, bestTime, lastKid, hints: [...hints], feats: copyLists(feats), wonWith: copyLists(wonWith) };
}

export function saveStats(stats: PajamaStats) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, ...stats }));
  } catch {
    return;
  }
}

export function markHint(id: HintId) {
  const stats = loadStats();
  if (stats.hints.includes(id)) return false;
  stats.hints.push(id);
  saveStats(stats);
  return true;
}
