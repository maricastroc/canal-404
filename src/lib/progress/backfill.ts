import { isMaster, loadSave } from "@/games/downhill-derby/save";
import { RACE_COURSES } from "@/games/downhill-derby/sim/score";
import type { AchievementId } from "./definitions";
import { getSnapshot, unlockAchievement } from "./store";

function earned(): AchievementId[] {
  const games = getSnapshot().games;
  const ids: AchievementId[] = [];
  const derby = loadSave();
  const tracksWon = RACE_COURSES.filter((id) => Object.keys(derby.wins[id] ?? {}).length > 0);
  if (tracksWon.length > 0) ids.push("downhill-win");
  if (tracksWon.length === RACE_COURSES.length) ids.push("downhill-sweep");
  if (isMaster(derby)) ids.push("downhill-master");
  const parts = games["past-bedtime"]?.levels ?? {};
  if (parts.doorway) ids.push("bedtime-first");
  if (Object.values(parts).some((part) => part.stars >= 3)) ids.push("bedtime-par");
  if (parts.return) ids.push("bedtime-tape");
  const songs = games["talent-show"]?.levels ?? {};
  if (Object.values(songs).some((song) => song.stars > 0)) ids.push("talent-first");
  return ids;
}

export function backfillAchievements() {
  earned().forEach((id) => unlockAchievement(id));
}
