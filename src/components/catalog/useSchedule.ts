"use client";

import { useMemo, useSyncExternalStore } from "react";
import { PLAYABLE, type GameMeta } from "@/games/registry";
import { useHydrated, useProgress } from "@/lib/progress/hooks";
import { nextPick, programState, type Pick, type ProgramState } from "@/lib/schedule";

function subscribeStorage(listener: () => void) {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

function savedSnapshot() {
  try {
    return PLAYABLE.filter((g) => g.resumable && window.localStorage.getItem(g.resumable))
      .map((g) => g.slug)
      .join(",");
  } catch {
    return "";
  }
}

export type Schedule = {
  hydrated: boolean;
  next: (exclude?: string[]) => Pick | null;
  state: (game: GameMeta) => ProgramState | null;
};

export function useSchedule(): Schedule {
  const hydrated = useHydrated();
  const progress = useProgress();
  const saved = useSyncExternalStore(subscribeStorage, savedSnapshot, () => "");
  return useMemo(() => {
    const savedSlugs = new Set(saved ? saved.split(",") : []);
    return {
      hydrated,
      next: (exclude: string[] = []) => (hydrated ? nextPick(progress, { exclude }) : null),
      state: (game: GameMeta) => (hydrated ? programState(progress, game, savedSlugs.has(game.slug)) : null),
    };
  }, [hydrated, progress, saved]);
}
