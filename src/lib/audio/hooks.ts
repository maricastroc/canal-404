"use client";

import { useCallback, useMemo, useRef, useSyncExternalStore, type MouseEvent } from "react";
import { getAudio } from "./engine";
import { SFX, type SfxName } from "./sfx";
import type { SoundRecipe } from "./types";

const PRESSABLE = "button, a[href], [role='button'], summary";

export function usePressSound() {
  const before = useRef(0);
  return useMemo(
    () => ({
      onClickCapture: () => {
        before.current = getAudio().playRequests;
      },
      onClick: (event: MouseEvent) => {
        const audio = getAudio();
        if (audio.playRequests !== before.current) return;
        const target = event.target instanceof Element ? event.target.closest(PRESSABLE) : null;
        if (!target || target.matches(":disabled, [aria-disabled='true']")) return;
        audio.play(SFX.click);
      },
    }),
    [],
  );
}

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
