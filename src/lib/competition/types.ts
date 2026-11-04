import type { Metric } from "./boards";
import type { IneligibleReason } from "./rules";

export type CompetitionStatus = "online" | "offline" | "unconfigured";

export type PublicPlayer = { id: string; nickname: string; tag: string; createdAt: string };

export type BestView = { score: number; stars: number; metrics: number[]; achievedAt: string };

export type BoardEntry = BestView & { position: number; nickname: string; tag: string; you: boolean; verified: boolean };

export type Leader = { nickname: string; tag: string; metrics: number[]; you: boolean };

export type Standing = { position: number; total: number; best: BestView; verified: boolean };

export type BoardResult =
  | (Standing & { id: string; improved: boolean; previous: BestView | null; leader: Leader | null })
  | { id: string; improved: false; previous: null; position: null; total: number; best: null; leader: Leader | null };

export type SubmitResponse = {
  run: { id: string; verification: "checked" | "replayed"; eligible: boolean; ineligible?: IneligibleReason; score: number; stars: number };
  board: BoardResult | null;
  repeated: boolean;
};

export type TicketResponse = { ticket: string; seed: number; expiresAt: string };

export type LeaderboardResponse = {
  board: { id: string; game: string; level: string | null; explain: string; metrics: Metric[] };
  entries: BoardEntry[];
  total: number;
  you: { nickname: string; tag: string; standing: Standing | null } | null;
};

export type ApiErrorBody = { error: { code: string; message: string; reason?: string; problem?: string; retryAfter?: number } };
