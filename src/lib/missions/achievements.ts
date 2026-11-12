import { daysBetween } from "./calendar";
import { MISSION_GAMES } from "./games";

export const MISSION_ACHIEVEMENTS = [
  {
    id: "mission-first",
    title: "Primeira Transmissão",
    description: "Você cumpriu sua primeira Missão 404.",
    hint: "Cumpra uma Missão 404 do Dia.",
    color: "sun",
  },
  {
    id: "mission-regular",
    title: "Frequentador do Canal",
    description: "Você cumpriu missões em 3 dias diferentes.",
    hint: "Cumpra missões em 3 dias diferentes, seguidos ou não.",
    color: "mint",
  },
  {
    id: "mission-marathon",
    title: "Maratonista do 404",
    description: "Você cumpriu missões em 7 dias diferentes.",
    hint: "Cumpra missões em 7 dias diferentes, seguidos ou não.",
    color: "tangerine",
  },
  {
    id: "mission-back-on-air",
    title: "De Volta ao Ar",
    description: "Você passou uma semana longe e voltou cumprindo missão.",
    hint: "Passe 7 dias ou mais sem missões e depois volte para cumprir uma.",
    color: "sky",
  },
  {
    id: "mission-full-grid",
    title: "Grade Completa",
    description: "Você cumpriu missões nos cinco jogos da grade do canal.",
    hint: "Cumpra pelo menos uma missão em cada um dos cinco jogos da grade.",
    color: "plum",
  },
  {
    id: "mission-champion",
    title: "Campeão do Dia",
    description: "Você terminou um dia em 1º lugar no placar da missão.",
    hint: "Termine o dia em 1º lugar no placar da missão, com pelo menos mais uma pessoa jogando.",
    color: "bubblegum",
  },
] as const;

export type MissionAchievementId = (typeof MISSION_ACHIEVEMENTS)[number]["id"];

export const BACK_ON_AIR_GAP_DAYS = 7;

export const CHAMPION_MIN_PLAYERS = 2;

export function isMissionAchievement(id: string): id is MissionAchievementId {
  return MISSION_ACHIEVEMENTS.some((a) => a.id === id);
}

export function missionAchievement(id: MissionAchievementId) {
  return MISSION_ACHIEVEMENTS.find((a) => a.id === id)!;
}

export type CompletedMission = { day: string; game: string };

export function earnedOnCompletion(completed: readonly CompletedMission[], current: CompletedMission): MissionAchievementId[] {
  const { day } = current;
  const days = [...new Set([...completed.map((c) => c.day), day])].sort();
  const before = days.filter((d) => d < day);
  const previous = before[before.length - 1];
  const earned: MissionAchievementId[] = ["mission-first"];
  if (days.length >= 3) earned.push("mission-regular");
  if (days.length >= 7) earned.push("mission-marathon");
  if (previous && daysBetween(previous, day) - 1 >= BACK_ON_AIR_GAP_DAYS) earned.push("mission-back-on-air");
  const games = new Set([...completed.map((c) => c.game), current.game]);
  if (MISSION_GAMES.every((g) => games.has(g))) earned.push("mission-full-grid");
  return earned;
}
