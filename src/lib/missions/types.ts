import type { GameSlug } from "@/lib/competition/boards";
import type { Condition } from "./goals";

export type MissionView = {
  day: string;
  key: string;
  version: number;
  game: GameSlug;
  level: string | null;
  title: string;
  objective: string;
  goal: Condition[];
  ranked: boolean;
  endsAt: string;
  closesAt: string;
};

export type MissionState = "new" | "started" | "completed";

export type MissionBest = { score: number; metrics: number[]; position: number; total: number; achievedAt: string };

export type MissionYou = {
  state: MissionState;
  attempts: number;
  startedAt: string | null;
  completedAt: string | null;
  best: MissionBest | null;
};

export type MissionProgress = { days: number; streak: number; bestStreak: number; lastDay: string | null };

export type MissionLeader = { nickname: string; tag: string; metrics: number[]; you: boolean };

export type MissionTodayResponse = {
  now: string;
  mission: MissionView;
  completions: number;
  leader: MissionLeader | null;
  you: (MissionYou & { progress: MissionProgress }) | null;
};

export type MissionHistoryItem = { mission: MissionView; you: MissionYou };

export type MissionHistoryResponse = { entries: MissionHistoryItem[]; next: string | null };

export type MissionShortfall = { condition: Condition; actual: number | null };

export type MissionOutcome = {
  day: string;
  title: string;
  status: "completed" | "missed" | "late";
  firstTime: boolean;
  shortfall: MissionShortfall | null;
  best: MissionBest | null;
  improved: boolean;
};
