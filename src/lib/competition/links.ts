import type { GameSlug } from "./boards";

export function recordsHref(game: GameSlug, level: string | null = null) {
  const params = new URLSearchParams({ game });
  if (level) params.set("level", level);
  return `/records?${params}`;
}
