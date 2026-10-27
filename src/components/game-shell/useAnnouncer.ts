import { useCallback, useRef, useState } from "react";

export const MERGE_WINDOW_MS = 400;

type AnnouncerState = { active: 0 | 1; at: number; text: string; transient: boolean };

export type AnnounceOptions = { transient?: boolean; fresh?: boolean };

export function nextAnnouncement(prev: AnnouncerState, message: string, options: AnnounceOptions, now: number, windowMs = MERGE_WINDOW_MS): AnnouncerState {
  const transient = Boolean(options.transient);
  const recent = prev.text !== "" && now - prev.at < windowMs;
  if (recent && prev.transient) return { active: prev.active, at: now, text: message, transient };
  if (!recent || transient || options.fresh) return { active: prev.active === 0 ? 1 : 0, at: now, text: message, transient };
  if (prev.text === message || prev.text.endsWith(` ${message}`)) return { ...prev, at: now };
  return { active: prev.active, at: now, text: `${prev.text} ${message}`, transient: false };
}

export function useAnnouncer() {
  const state = useRef<AnnouncerState>({ active: 1, at: -Infinity, text: "", transient: false });
  const [regions, setRegions] = useState<[string, string]>(["", ""]);
  const announce = useCallback((message: string, options: AnnounceOptions = {}) => {
    const next = nextAnnouncement(state.current, message, options, performance.now());
    state.current = next;
    setRegions(next.active === 0 ? [next.text, ""] : ["", next.text]);
  }, []);
  return { regions, announce };
}
