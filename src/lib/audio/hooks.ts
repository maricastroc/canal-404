"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getAudio } from "./engine";
import { SFX, type SfxName } from "./sfx";
import type { SoundRecipe } from "./types";

export function useSound() {
  const play = useCallback((name: SfxName, options?: { volume?: number; pitch?: number }) => {
    getAudio().play(SFX[name], options);
  }, []);
  const hover = useCallback(() => {
    getAudio().play(SFX.hover, { throttle: 0.07 });
  }, []);
  const playRecipe = useCallback((recipe: SoundRecipe, options?: { volume?: number; pitch?: number }) => {
    getAudio().play(recipe, options);
  }, []);
  return useMemo(() => ({ play, hover, playRecipe }), [play, hover, playRecipe]);
}

function subscribe(listener: () => void) {
  return getAudio().subscribe(listener);
}

export function useMusicState() {
  const playing = useSyncExternalStore(
    subscribe,
    () => getAudio().musicPlaying,
    () => false,
  );
  const trackId = useSyncExternalStore(
    subscribe,
    () => getAudio().currentTrackId,
    () => null,
  );
  return { playing, trackId };
}
