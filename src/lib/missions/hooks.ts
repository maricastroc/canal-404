"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useCompetition } from "@/lib/competition/hooks";
import { getMission, getServerMission, loadMission, subscribeMission } from "./client";

export function useMissionToday(enabled = true) {
  const competition = useCompetition();
  const snapshot = useSyncExternalStore(subscribeMission, getMission, getServerMission);
  const reachable = enabled && (competition.status === "online" || competition.status === "offline");
  const playerId = competition.player?.id ?? null;

  useEffect(() => {
    if (reachable) void loadMission(playerId, getMission().playerId !== playerId);
  }, [reachable, playerId]);

  const endsAt = enabled ? snapshot.data?.mission.endsAt : undefined;
  const offset = snapshot.offset;
  useEffect(() => {
    if (!endsAt) return;
    const wait = Date.parse(endsAt) - (Date.now() + offset) + 1500;
    const id = window.setTimeout(() => void loadMission(playerId, true), Math.max(1000, Math.min(wait, 2 ** 31 - 1)));
    return () => window.clearTimeout(id);
  }, [endsAt, offset, playerId]);

  const status = competition.status === "unconfigured" ? "unconfigured" : competition.status === "checking" ? "loading" : snapshot.data ? "ready" : snapshot.status === "error" ? "offline" : "loading";
  return { status, competition, data: snapshot.data, offset: snapshot.offset, refresh: () => loadMission(playerId, true) } as const;
}

export function useCountdown(target: string | null | undefined, offset: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    const tick = () => setNow(Date.now() + offset);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target, offset]);
  if (!target || now === null) return null;
  return Math.max(0, Date.parse(target) - now);
}
