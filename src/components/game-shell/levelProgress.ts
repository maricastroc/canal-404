import type { LevelMeta } from "@/games/registry";
import type { LevelProgress } from "./Panels";

export function computeLevelProgress(levels: LevelMeta[] | undefined, records: Record<string, { stars: number }> | undefined): LevelProgress | undefined {
  if (!levels) return undefined;
  const stars = levels.map((l) => records?.[l.id]?.stars ?? 0);
  const furthest = stars.reduce((acc, st, i) => (st > 0 ? i : acc), -1);
  const unlocked = Math.min(furthest + 1, levels.length - 1);
  const firstOpen = stars.findIndex((st) => st === 0);
  return { stars, unlocked, suggested: firstOpen === -1 ? levels.length - 1 : Math.min(firstOpen, unlocked) };
}
