import { getGame } from "@/games/registry";
import { BOARD_META, GAME_SLUGS, isGameSlug, type GameSlug } from "./boards";

export type BoardLevel = { id: string; title: string; number: number };

export type BoardChoice = { game: GameSlug; level: string | null };

export function rankedLevels(game: GameSlug): BoardLevel[] | null {
  const levels = getGame(game)?.levels;
  if (!levels) return null;
  const practice = BOARD_META[game].practice ?? [];
  return levels.map((l, i) => ({ id: l.id, title: l.title, number: i + 1 })).filter((l) => !practice.includes(l.id));
}

export function pickBoard(game: string | null, level: string | null): BoardChoice {
  const slug = isGameSlug(game) ? game : GAME_SLUGS[0];
  const levels = rankedLevels(slug);
  if (!levels) return { game: slug, level: null };
  return { game: slug, level: levels.find((l) => l.id === level)?.id ?? levels[0].id };
}
