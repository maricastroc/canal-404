"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";

export type Broadcast = {
  since: number;
  take: number;
  zoomed: boolean;
  replay: () => void;
};

const BroadcastContext = createContext<Broadcast>({ since: 0, take: 0, zoomed: false, replay: () => {} });

export const BroadcastProvider = BroadcastContext.Provider;

export function useBroadcast() {
  return useContext(BroadcastContext);
}

export function elapsedSince(since: number) {
  return Math.max(0, performance.now() - since);
}

export function phaseAt(marks: number[], time: number) {
  let phase = 0;
  for (let i = 0; i < marks.length; i += 1) if (time >= marks[i]) phase = i;
  return phase;
}

function timelineAt(marks: number[], since: number, loop?: number) {
  const elapsed = since > 0 ? elapsedSince(since) : 0;
  const time = loop ? elapsed % loop : elapsed;
  const phase = phaseAt(marks, time);
  return { phase, offset: time - marks[phase] };
}

export function useTimeline(marks: number[], loop?: number) {
  const { since } = useBroadcast();
  const [state, setState] = useState(() => timelineAt(marks, since, loop));
  const key = marks.join(",");
  useLayoutEffect(() => {
    const points = key.split(",").map(Number);
    let timer = 0;
    const tick = () => {
      const elapsed = elapsedSince(since);
      const time = loop ? elapsed % loop : elapsed;
      const phase = phaseAt(points, time);
      setState({ phase, offset: time - points[phase] });
      const next = phase + 1 < points.length ? points[phase + 1] : loop;
      if (next === undefined) return;
      timer = window.setTimeout(tick, Math.max(16, next - time + 4));
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [key, loop, since]);
  return state;
}

export function useLoopIndex(count: number, ms: number) {
  const marks = Array.from({ length: count }, (_, i) => i * ms);
  return useTimeline(marks, count * ms).phase;
}
