"use client";

import { useEffect, useSyncExternalStore } from "react";
import { connect, getCompetition, getServerCompetition, subscribeCompetition } from "./client";
import { syncCloudCopy } from "./cloud-copy";

export function useCompetition() {
  const value = useSyncExternalStore(subscribeCompetition, getCompetition, getServerCompetition);
  useEffect(() => {
    void connect();
  }, []);
  return value;
}

export function useCloudCopyOnLeave() {
  useEffect(() => {
    const flush = () => void syncCloudCopy({ keepalive: true });
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, []);
}
