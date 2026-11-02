import { PLAYABLE, type GameMeta } from "@/games/registry";
import type { ProgressState } from "@/lib/progress/store";

const DAY = 86_400_000;
const FIRST_MONDAY = Date.UTC(1970, 0, 5);

export const FALLBACK_WEEKLY = PLAYABLE[0];

export function weekNumber(date: Date) {
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((day - FIRST_MONDAY) / (7 * DAY));
}

export function weeklyGame(date: Date, games: GameMeta[] = PLAYABLE) {
  const n = games.length;
  return games[((weekNumber(date) % n) + n) % n];
}

function rotation(start: GameMeta, games: GameMeta[]) {
  const i = Math.max(0, games.indexOf(start));
  return [...games.slice(i), ...games.slice(0, i)];
}

export function plays(progress: ProgressState | undefined, slug: string) {
  return progress?.games[slug]?.plays ?? 0;
}

export type Pick = { game: GameMeta; reason: "unplayed" | "least" };

export function nextPick(progress: ProgressState | undefined, { date, exclude = [], games = PLAYABLE }: { date: Date; exclude?: string[]; games?: GameMeta[] }): Pick {
  const order = rotation(weeklyGame(date, games), games);
  const candidates = order.filter((g) => !exclude.includes(g.slug));
  const pool = candidates.length ? candidates : order;
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
