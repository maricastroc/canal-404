import { useCallback, useEffect, useRef, useState } from "react";

export const MERGE_WINDOW_MS = 400;
export const REPLAY_WINDOW_MS = 600;
export const REPLAY_DELAY_MS = 500;

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
  const held = useRef<{ text: string; timer: number } | null>(null);
  const [regions, setRegions] = useState<[string, string]>(["", ""]);
  const show = useCallback((message: string, options: AnnounceOptions) => {
    const next = nextAnnouncement(state.current, message, options, performance.now());
    state.current = next;
    setRegions(next.active === 0 ? [next.text, ""] : ["", next.text]);
  }, []);
  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      const hold = held.current;
      if (hold && !options.fresh && !options.transient) {
        if (!hold.text.endsWith(message)) hold.text = `${hold.text} ${message}`;
        return;
      }
      if (hold) {
        window.clearTimeout(hold.timer);
        held.current = null;
      }
      show(message, options);
    },
    [show],
  );
  const afterFocus = useCallback(() => {
    const text = held.current?.text ?? (performance.now() - state.current.at < REPLAY_WINDOW_MS ? state.current.text : "");
    if (!text) return;
    if (held.current) window.clearTimeout(held.current.timer);
    setRegions(["", ""]);
    const hold = { text, timer: 0 };
    hold.timer = window.setTimeout(() => {
      held.current = null;
      show(hold.text, { fresh: true });
    }, REPLAY_DELAY_MS);
    held.current = hold;
  }, [show]);
  useEffect(() => () => window.clearTimeout(held.current?.timer), []);
  return { regions, announce, afterFocus };
}
