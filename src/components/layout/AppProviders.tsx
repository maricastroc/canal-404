"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { getAudio } from "@/lib/audio/engine";
import { useProgress } from "@/lib/progress/hooks";
import { registerVisit } from "@/lib/progress/store";
import { reportError } from "@/lib/telemetry";
import { ToastStack } from "./ToastStack";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const progress = useProgress();

  useEffect(() => {
    registerVisit();
  }, []);

  useEffect(() => {
    const onError = (event: ErrorEvent) => reportError("window", event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => reportError("promise", event.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
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
