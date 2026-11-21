import type { GameResult } from "@/games/types";
import { ordinal } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { RACE_COPY } from "./copy";
import type { RaceFinish } from "./scenes/RaceScene";
import { formatSeconds, formatTime } from "./scenes/hud";
import type { CartId } from "./sim/carts";
import { PLACE_POINTS, placeStars, raceMs, raceScore, RACE_COURSES } from "./sim/score";

export const REPLAY_KIND = "downhill-run";

export function raceResult(f: RaceFinish, locale: Locale, unlocked: CartId | null): GameResult {
  const copy = RACE_COPY[locale];
  const r = copy.results;
  const stars = placeStars(f.place);
  const show = f.stats.show;
  const nth = ordinal(f.place, locale);
  const index = RACE_COURSES.indexOf(f.course);
  const mine = f.standings.findIndex((s) => s.you);
  const ahead = mine > 0 ? f.standings[mine - 1] : null;
  const behind = f.standings[mine + 1] ?? null;
  const gap = ahead ? f.time - ahead.time : behind ? behind.time - f.time : 0;
  const seconds = formatSeconds(gap, locale, 2);
  const headline = f.place === 1 ? r.headline.win : f.place === 2 ? (gap < 0.5 ? r.headline.close : r.headline.second) : f.place === 3 ? r.headline.third : r.headline.fourth;
  const previous = f.previous;
  const time = formatTime(f.time, locale);
  const summary = !previous ? time : f.time < previous.time ? `${time} · ${r.newRecord}` : `${time} · ${r.record(formatTime(previous.time, locale))}`;
  const hint = unlocked ? r.unlocked(copy.carts[unlocked]) : ahead ? r.behind[ahead.who](seconds) : behind ? r.wonBy[behind.who](seconds) : undefined;
  return {
    won: stars > 0,
    score: raceScore(f.place, show),
    stars,
    breakdown: [
      { label: r.arrival(nth), value: PLACE_POINTS[f.place - 1] ?? 0 },
      { label: r.show, value: show },
    ],
    stats: { timeMs: raceMs(f.time), place: f.place, crashes: f.stats.crashes, show, hits: f.stats.hits, perfect: f.stats.perfect, bestSeq: f.stats.bestSeq },
    replay: { kind: REPLAY_KIND, version: 1, cart: f.cart, tape: f.tape, rivals: f.picks },
    level: { index, id: f.course, title: copy.courses[f.course], total: RACE_COURSES.length },
    copy: { title: stars > 0 ? `${r.place(nth)}!` : r.place(nth), text: headline },
    summary,
    starHint: hint,
    featured: f.cart,
    restartLabel: r.again,
    alt: r.alt,
  };
}
