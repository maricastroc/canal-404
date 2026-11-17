import type { Locale } from "@/i18n/locales";
import type { ApiErrorBody } from "./types";

type ApiError = ApiErrorBody["error"];

const REJECTIONS_EN: Record<string, string> = {
  unknown_level: "That level doesn't exist on the channel.",
  bad_stats: "The result arrived incomplete.",
  inconsistent: "This run's numbers don't add up.",
  score_mismatch: "The score doesn't match what happened in the run.",
  bad_replay: "The machine you sent can't be built in this level.",
  replay_failed: "The channel's lab built this machine and the ball didn't get there.",
  too_fast: "This run ended too fast to be true.",
};

const ERRORS_EN: Record<string, string> = {
  rate_limited: "Easy there! Too many tries in a row. Wait a little.",
  wrong_player: "This ticket belongs to someone else.",
  conflict: "Someone else already sent this result.",
  not_joined: "Pick a nickname to join the board.",
};

export function serverMessage(error: ApiError | null | undefined, fallback: string, locale: Locale) {
  if (locale !== "en") return error?.message ?? fallback;
  if (!error) return fallback;
  if (error.code === "rejected") return REJECTIONS_EN[error.reason ?? ""] ?? REJECTIONS_EN.inconsistent;
  return ERRORS_EN[error.code] ?? fallback;
}
