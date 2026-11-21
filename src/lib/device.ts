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
