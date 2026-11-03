"use client";

import { useEffect, useSyncExternalStore } from "react";
import { connect, getCompetition, getServerCompetition, subscribeCompetition } from "./client";

export function useCompetition() {
  const value = useSyncExternalStore(subscribeCompetition, getCompetition, getServerCompetition);
  useEffect(() => {
    void connect();
  }, []);
  return value;
}
