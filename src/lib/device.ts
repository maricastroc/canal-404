import { useSyncExternalStore } from "react";

const TOUCH_SCREEN = "(pointer: coarse)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(TOUCH_SCREEN);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function touchScreen() {
  return window.matchMedia(TOUCH_SCREEN).matches;
}

export function useTouchScreen() {
  return useSyncExternalStore(subscribe, touchScreen, () => false);
}

const NARROW = "(max-width: 639px)";

function subscribeNarrow(onChange: () => void) {
  const media = window.matchMedia(NARROW);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useNarrowScreen() {
  return useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW).matches, () => false);
}
