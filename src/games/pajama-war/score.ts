import type { Locale } from "@/i18n/locales";
import { SCORE } from "./config";
import { COPY } from "./copy";

export type MatchOutcome = { won: boolean; place: number; hits: number; kos: number; hp: number };

export function matchScore(o: MatchOutcome, locale: Locale) {
  const t = COPY[locale].score;
  const rows: { label: string; value: number }[] = [
    { label: t.hits(o.hits), value: o.hits * SCORE.hit },
    { label: t.kos(o.kos), value: o.kos * SCORE.ko },
  ];
  if (o.won) {
    rows.push({ label: t.win, value: SCORE.win });
    rows.push({ label: t.hp(o.hp), value: o.hp * SCORE.hp });
  } else if (o.place === 2) rows.push({ label: t.second, value: SCORE.second });
  const score = rows.reduce((a, r) => a + r.value, 0);
  const stars = o.won ? (o.hp >= 7 ? 3 : o.hp >= 4 ? 2 : 1) : 0;
  return { rows, score, stars };
}
