import { apiCall } from "@/lib/competition/client";
import type { MissionBoardResponse, MissionHistoryResponse, MissionTodayResponse } from "./types";

export type MissionSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  data: MissionTodayResponse | null;
  offset: number;
  playerId: string | null;
  fetchedAt: number;
};

const TTL_MS = 60_000;
const SERVER: MissionSnapshot = { status: "idle", data: null, offset: 0, playerId: null, fetchedAt: 0 };

let snapshot: MissionSnapshot = SERVER;
let inflight: Promise<MissionSnapshot> | null = null;
const listeners = new Set<() => void>();

function emit(next: MissionSnapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

export function subscribeMission(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMission() {
  return snapshot;
}

export function getServerMission() {
  return SERVER;
}

export function loadMission(playerId: string | null, force = false): Promise<MissionSnapshot> {
  if (typeof window === "undefined") return Promise.resolve(snapshot);
  if (inflight) return inflight;
  const fresh = snapshot.status === "ready" && snapshot.playerId === playerId && Date.now() - snapshot.fetchedAt < TTL_MS;
  if (fresh && !force) return Promise.resolve(snapshot);
  if (snapshot.status !== "ready") emit({ ...snapshot, status: "loading" });
  const sentAt = Date.now();
  inflight = apiCall<MissionTodayResponse>("/api/missions/today")
    .then((response) => {
      const now = Date.now();
      const next: MissionSnapshot = response.ok
        ? { status: "ready", data: response.data, offset: Date.parse(response.data.now) - (sentAt + now) / 2, playerId, fetchedAt: now }
        : { ...snapshot, status: snapshot.data ? "ready" : "error", fetchedAt: now };
      emit(next);
      return next;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function fetchMissionHistory(before: string | null, limit = 10): Promise<MissionHistoryResponse | null> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  const response = await apiCall<MissionHistoryResponse>(`/api/missions/history?${params}`);
  return response.ok ? response.data : null;
}

export async function fetchMissionBoard(day: string | null, page = 1): Promise<MissionBoardResponse | null> {
  const params = new URLSearchParams({ page: String(page) });
  if (day) params.set("day", day);
  const response = await apiCall<MissionBoardResponse>(`/api/missions/board?${params}`);
  return response.ok ? response.data : null;
}

export function resetMissionForTests() {
  snapshot = SERVER;
  inflight = null;
}
