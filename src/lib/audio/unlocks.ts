import type { ProgressState } from "@/lib/progress/store";
import { TRACKS, type Track } from "./tracks";

export function isTrackUnlocked(track: Track, progress: ProgressState) {
  const rule = track.unlock;
  if (rule.type === "default") return true;
  if (rule.type === "achievement") return Boolean(progress.achievements[rule.id as keyof ProgressState["achievements"]]);
  return Object.keys(progress.secrets).length >= rule.count;
}

export function unlockedTracks(progress: ProgressState) {
  return TRACKS.filter((t) => isTrackUnlocked(t, progress));
}
