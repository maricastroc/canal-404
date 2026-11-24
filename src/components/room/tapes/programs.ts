import { useEffect, useSyncExternalStore } from "react";
import type { TapeId } from "../objects/tapes";
import type { TapeProgram } from "./vhs";

type Programs = Record<TapeId, TapeProgram>;

let programs: Programs | null = null;
let pending: Promise<Programs> | null = null;
const listeners = new Set<() => void>();

export function loadTapePrograms() {
  pending ??= import(".").then(
    (module) => {
      programs = module.TAPE_PROGRAMS;
      listeners.forEach((listener) => listener());
      return programs;
    },
    (error: unknown) => {
      pending = null;
      throw error;
    },
  );
  return pending;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTapeProgram(tape: TapeId | null): TapeProgram | null {
  const loaded = useSyncExternalStore(
    subscribe,
    () => programs,
    () => null,
  );
  useEffect(() => {
    if (tape) void loadTapePrograms();
  }, [tape]);
  return tape && loaded ? loaded[tape] : null;
}
