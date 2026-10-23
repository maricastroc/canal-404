"use client";

import { useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getServerToasts,
  getSnapshot,
  getToasts,
  subscribe,
  subscribeToasts,
  type ProgressState,
} from "./store";

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useToasts() {
  return useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);
}

const noopSubscribe = () => () => {};

export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
