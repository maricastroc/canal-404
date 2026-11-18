import { useState, useSyncExternalStore } from "react";

export type Look = { x: number; y: number };

export type LookStore = { get: () => Look; set: (x: number, y: number) => void; subscribe: (listener: () => void) => () => void };

const CENTER: Look = { x: 0, y: 0 };

function createLookStore(): LookStore {
  let value = CENTER;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(x, y) {
      const next = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
      if (next.x === value.x && next.y === value.y) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useLookStore() {
  const [store] = useState(createLookStore);
  return store;
}

export function useLook(store: LookStore) {
  return useSyncExternalStore(store.subscribe, store.get, () => CENTER);
}
