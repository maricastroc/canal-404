"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { getAudio } from "@/lib/audio/engine";
import type { TapeId } from "../objects/tapes";
import { useTapeProgram } from "./programs";
import type { TapeCue } from "./vhs";

const subscribeAudio = (listener: () => void) => getAudio().subscribe(listener);

export function useSoundOn() {
  return useSyncExternalStore(
    subscribeAudio,
    () => getAudio().sfxOn,
    () => false,
  );
}

export function useTapePlayback(tape: TapeId | null, since: number, take: number, onCue: (cue: TapeCue, tape: TapeId) => void) {
  const sound = useSoundOn();
  const program = useTapeProgram(tape);
  const cueHandler = useRef(onCue);
  useEffect(() => {
    cueHandler.current = onCue;
  }, [onCue]);

  useEffect(() => {
    const song = program?.song;
    if (!song || !sound) return;
    const audio = getAudio();
    const elapsed = performance.now() - since;
    if (elapsed >= song.length) return;
    const previous = audio.currentTrackId;
    audio.startMusic(song.track, { at: elapsed, once: true });
    const release = () => {
      if (audio.currentTrackId !== song.track.id) return;
      if (previous && previous !== song.track.id) audio.startMusic(previous);
      else audio.stopMusic();
    };
    const timer = window.setTimeout(release, song.length - elapsed);
    return () => {
      window.clearTimeout(timer);
      release();
    };
  }, [program, since, take, sound]);

  useEffect(() => {
    if (!tape || !program) return;
    const cues = program.cues ?? [];
    const elapsed = performance.now() - since;
    const timers = cues
      .filter((cue) => cue.at >= elapsed - 60)
      .map((cue) => window.setTimeout(() => cueHandler.current(cue, tape), Math.max(0, cue.at - elapsed)));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [tape, program, since, take]);
}
