import { PLAYABLE, type GameMeta } from "@/games/registry";
import type { ProgressState } from "@/lib/progress/store";

export function plays(progress: ProgressState | undefined, slug: string) {
  return progress?.games[slug]?.plays ?? 0;
}

export type Pick = { game: GameMeta; reason: "unplayed" | "least" };

export function nextPick(progress: ProgressState | undefined, { exclude = [], games = PLAYABLE }: { exclude?: string[]; games?: GameMeta[] } = {}): Pick {
  const candidates = games.filter((g) => !exclude.includes(g.slug));
  const pool = candidates.length ? candidates : games;
  const unplayed = pool.find((g) => plays(progress, g.slug) === 0);
  if (unplayed) return { game: unplayed, reason: "unplayed" };
  const least = pool.reduce((best, g) => (plays(progress, g.slug) < plays(progress, best.slug) ? g : best), pool[0]);
  return { game: least, reason: "least" };
}

export type ProgramState = "unplayed" | "rerun" | "saved";

export function programState(progress: ProgressState | undefined, game: GameMeta, hasSave: boolean): ProgramState {
  if (game.resumable && hasSave) return "saved";
  return plays(progress, game.slug) === 0 ? "unplayed" : "rerun";
}

export function unplayedGames(progress: ProgressState | undefined, games: GameMeta[] = PLAYABLE) {
  return games.filter((g) => plays(progress, g.slug) === 0);
}

export function bestRecord(progress: ProgressState | undefined, games: GameMeta[] = PLAYABLE) {
  let best: { game: GameMeta; score: number } | null = null;
  for (const game of games) {
    const score = progress?.games[game.slug]?.highScore ?? 0;
    if (score > 0 && (!best || score > best.score)) best = { game, score };
  }
  return best;
}
