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
  bad_launches: "The launches you sent don't fit a Dead End Street match.",
  launches_failed: "The channel replayed your launches and the match didn't go that way.",
  bad_run: "The inputs you sent don't fit a Downhill Derby run.",
  run_failed: "The channel replayed your run and it didn't end that way.",
  bad_moves: "The moves you sent don't fit a Past Bedtime part.",
  moves_failed: "The channel replayed your moves and Bruno didn't get there that way.",
  too_fast: "This run ended too fast to be true.",
};

const ERRORS_EN: Record<string, string> = {
  rate_limited: "Easy there! Too many tries in a row. Wait a little.",
  wrong_player: "This ticket belongs to someone else.",
  conflict: "Someone else already sent this result.",
  not_joined: "Pick a nickname to join the board.",
  outdated: "The game was updated while this page was open. Reload the page to play the new version.",
};

export function serverMessage(error: ApiError | null | undefined, fallback: string, locale: Locale) {
  if (locale !== "en") return error?.message ?? fallback;
  if (!error) return fallback;
  if (error.code === "rejected") return REJECTIONS_EN[error.reason ?? ""] ?? REJECTIONS_EN.inconsistent;
  return ERRORS_EN[error.code] ?? fallback;
}
