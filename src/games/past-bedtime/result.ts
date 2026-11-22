import type { GameResult } from "@/games/types";
import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import { NIGHT_COPY } from "./copy";
import type { WinReport } from "./scenes/NightScene";
import { LEVELS } from "./sim/levels";
import { MOVE_POINTS, movesSaved, PART_POINTS, partScore } from "./sim/score";
import { STAR_SLACK } from "./sim/sim";

export const REPLAY_KIND = "bedtime-moves";

const COPY = localized({
  "pt-BR": {
    part: "Parte concluída",
    bonus: "Bônus de jogadas",
    again: "Refazer a parte",
    hinted: "A dica deixa esta parte com no máximo 2 estrelas. Sem espiar o caderno, a terceira volta.",
    second: (n: number) => `Chegue em até ${n} jogadas para a segunda estrela.`,
    third: (n: number) => `Chegue em ${n} jogadas para a terceira estrela.`,
  },
  en: {
    part: "Part done",
    bonus: "Move bonus",
    again: "Replay part",
    hinted: "The hint keeps this part at 2 stars at most. Without peeking at the notebook, the third one comes back.",
    second: (n: number) => `Make it in ${n} moves or fewer for the second star.`,
    third: (n: number) => `Make it in ${n} moves for the third star.`,
  },
});

function starHint(report: WinReport, locale: Locale) {
  const copy = COPY[locale];
  if (report.stars >= 3) return undefined;
  if (report.turns > report.par + STAR_SLACK) return copy.second(report.par + STAR_SLACK);
  if (report.turns > report.par) return copy.third(report.par);
  return report.hints > 0 ? copy.hinted : undefined;
}

export function partResult(report: WinReport, locale: Locale): GameResult {
  const copy = COPY[locale];
  const night = NIGHT_COPY[locale];
  const saved = movesSaved(report.par, report.turns);
  return {
    won: true,
    score: partScore(report.par, report.turns),
    stars: report.stars,
    breakdown: [
      { label: copy.part, value: PART_POINTS },
      { label: copy.bonus, value: saved * MOVE_POINTS },
    ],
    stats: { turns: report.turns, hints: report.hints, wakes: report.wakes, creaks: report.creaks, covered: report.covered },
    replay: { kind: REPLAY_KIND, version: 1, moves: report.moves },
    level: { index: report.index, id: report.level, title: night.levels[report.level]?.title ?? report.level, total: LEVELS.length },
    copy: { title: night.wonTitle, text: night.lines.brunoWin[report.level] ?? night.notes.won },
    summary: night.wonMoves(report.turns, report.par),
    starHint: starHint(report, locale),
    restartLabel: copy.again,
  };
}
