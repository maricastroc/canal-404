import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import { daysBetween } from "./calendar";
import { MISSION_GAMES } from "./games";

export const MISSION_ACHIEVEMENTS = [
  { id: "mission-first", color: "sun" },
  { id: "mission-regular", color: "mint" },
  { id: "mission-marathon", color: "tangerine" },
  { id: "mission-back-on-air", color: "sky" },
  { id: "mission-full-grid", color: "plum" },
  { id: "mission-champion", color: "bubblegum" },
] as const;

export type MissionAchievementId = (typeof MISSION_ACHIEVEMENTS)[number]["id"];

type AchievementText = { title: string; description: string; hint: string };

const ACHIEVEMENT_TEXT = localized<Record<MissionAchievementId, AchievementText>>({
  "pt-BR": {
    "mission-first": {
      title: "Primeira Transmissão",
      description: "Você cumpriu sua primeira Missão 404.",
      hint: "Cumpra uma Missão 404 do Dia.",
    },
    "mission-regular": {
      title: "Frequentador do Canal",
      description: "Você cumpriu missões em 3 dias diferentes.",
      hint: "Cumpra missões em 3 dias diferentes, seguidos ou não.",
    },
    "mission-marathon": {
      title: "Maratonista do 404",
      description: "Você cumpriu missões em 7 dias diferentes.",
      hint: "Cumpra missões em 7 dias diferentes, seguidos ou não.",
    },
    "mission-back-on-air": {
      title: "De Volta ao Ar",
      description: "Você passou uma semana longe e voltou cumprindo missão.",
      hint: "Passe 7 dias ou mais sem missões e depois volte para cumprir uma.",
    },
    "mission-full-grid": {
      title: "Grade Completa",
      description: "Você cumpriu missões nos cinco jogos da grade do canal.",
      hint: "Cumpra pelo menos uma missão em cada um dos cinco jogos da grade.",
    },
    "mission-champion": {
      title: "Campeão do Dia",
      description: "Você terminou um dia em 1º lugar no placar da missão.",
      hint: "Termine o dia em 1º lugar no placar da missão, com pelo menos mais uma pessoa jogando.",
    },
  },
  en: {
    "mission-first": {
      title: "First Broadcast",
      description: "You completed your first Mission 404.",
      hint: "Complete a Mission 404 of the Day.",
    },
    "mission-regular": {
      title: "Channel Regular",
      description: "You completed missions on 3 different days.",
      hint: "Complete missions on 3 different days, in a row or not.",
    },
    "mission-marathon": {
      title: "404 Marathoner",
      description: "You completed missions on 7 different days.",
      hint: "Complete missions on 7 different days, in a row or not.",
    },
    "mission-back-on-air": {
      title: "Back on Air",
      description: "You stayed away for a week and came back to complete a mission.",
      hint: "Go 7 days or more without missions, then come back and complete one.",
    },
    "mission-full-grid": {
      title: "Full Lineup",
      description: "You completed missions in all five games on the channel's lineup.",
      hint: "Complete at least one mission in each of the five games on the lineup.",
    },
    "mission-champion": {
      title: "Champion of the Day",
      description: "You finished a day in 1st place on the mission board.",
      hint: "Finish the day in 1st place on the mission board, with at least one other person playing.",
    },
  },
});

export type MissionAchievement = (typeof MISSION_ACHIEVEMENTS)[number] & AchievementText;

export const BACK_ON_AIR_GAP_DAYS = 7;

export const CHAMPION_MIN_PLAYERS = 2;

export function isMissionAchievement(id: string): id is MissionAchievementId {
  return MISSION_ACHIEVEMENTS.some((a) => a.id === id);
}

export function missionAchievements(locale: Locale): MissionAchievement[] {
  return MISSION_ACHIEVEMENTS.map((a) => ({ ...a, ...ACHIEVEMENT_TEXT[locale][a.id] }));
}

export function missionAchievement(id: MissionAchievementId, locale: Locale): MissionAchievement {
  return { ...MISSION_ACHIEVEMENTS.find((a) => a.id === id)!, ...ACHIEVEMENT_TEXT[locale][id] };
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
