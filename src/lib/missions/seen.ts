import { pushToast } from "@/lib/progress/store";
import { missionAchievement, type MissionAchievementId } from "./achievements";

const KEY = "canal404:mission-achievements:v1";

function readSeen(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as unknown;
    return value && typeof value === "object" && Array.isArray((value as { seen?: unknown }).seen) ? ((value as { seen: unknown[] }).seen.filter((s) => typeof s === "string") as string[]) : [];
  } catch {
    return [];
  }
}

export function announceAchievements(playerId: string, ids: readonly MissionAchievementId[]) {
  if (typeof window === "undefined" || !ids.length) return [];
  const seen = readSeen();
  const fresh = ids.filter((id) => !seen.includes(`${playerId}:${id}`));
  for (const id of fresh) {
    const def = missionAchievement(id);
    pushToast({ kind: "achievement", title: def.title, description: def.description });
  }
  if (fresh.length) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ version: 1, seen: [...seen, ...fresh.map((id) => `${playerId}:${id}`)].slice(-200) }));
    } catch {}
  }
  return fresh;
}
