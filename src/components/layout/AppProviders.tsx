"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { getAudio } from "@/lib/audio/engine";
import { useProgress } from "@/lib/progress/hooks";
import { registerVisit } from "@/lib/progress/store";
import { ToastStack } from "./ToastStack";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const progress = useProgress();

  useEffect(() => {
    registerVisit();
  }, []);

  useEffect(() => {
    getAudio().setSfxEnabled(progress.settings.sfx);
  }, [progress.settings.sfx]);

  useEffect(() => {
    const unlock = () => {
      getAudio().unlock();
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, unlock, { capture: true, passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, unlock, { capture: true }));
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {children}
      <ToastStack />
    </MotionConfig>
  );
}
