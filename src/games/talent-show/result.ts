import type { GameResult } from "@/games/types";
import { localized } from "@/i18n/copy";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { TALENT_COPY } from "./copy";
import type { RunReport } from "./scenes/StageScene";
import { POINTS, runScore, runStats, SCORE_PER_POINT, type Mark } from "./sim/judge";
import { SONG_ORDER } from "./song/songs";

export const REPLAY_KIND = "talent-taps";

const COPY = localized({
  "pt-BR": {
    again: "Tocar de novo",
    timing: "Tempo médio",
    onTime: "no tempo",
    off: (ms: number, late: boolean) => `${ms} ms ${late ? "atrasado" : "adiantado"}`,
    assist: "Modo assistido",
    offBoard: "fora do placar",
    lines: {
      3: { title: "Que show!", text: "A plateia foi à loucura e o júri inteiro deu nota alta." },
      2: { title: "Bela apresentação!", text: "O júri aprovou, e o Seu Arlindo quase sorriu." },
      1: { title: "Passou!", text: "O júri aprovou, mas espera mais precisão na próxima." },
      0: { title: "Quase lá!", text: "A banda chegou ao fim, mas o júri ainda não deu estrela." },
    } as Record<0 | 1 | 2 | 3, { title: string; text: string }>,
    hints: {
      0: "A primeira estrela pede pelo menos 50% de precisão.",
      1: "Chegue a 80% de precisão para a segunda estrela.",
      2: "Chegue a 92% de precisão para a terceira estrela.",
    } as Record<0 | 1 | 2, string>,
    cutHint: "Erros e barulho espantam a plateia. Chegue ao fim da música para ganhar estrelas.",
  },
  en: {
    again: "Play again",
    timing: "Average timing",
    onTime: "on time",
    off: (ms: number, late: boolean) => `${ms} ms ${late ? "late" : "early"}`,
    assist: "Assist mode",
    offBoard: "off the scoreboard",
    lines: {
      3: { title: "What a show!", text: "The crowd went wild and the whole jury gave top marks." },
      2: { title: "Great performance!", text: "The jury approved, and Mr. Arlindo almost smiled." },
      1: { title: "You're through!", text: "The jury approved, but they want more accuracy next time." },
      0: { title: "So close!", text: "The band made it to the end, but the jury held back the stars." },
    } as Record<0 | 1 | 2 | 3, { title: string; text: string }>,
    hints: {
      0: "The first star needs at least 50% accuracy.",
      1: "Reach 80% accuracy for the second star.",
      2: "Reach 92% accuracy for the third star.",
    } as Record<0 | 1 | 2, string>,
    cutHint: "Misses and noise drive the crowd away. Make it to the end of the song to earn stars.",
  },
});

export function songResult(report: RunReport, locale: Locale): GameResult {
  const copy = COPY[locale];
  const game = TALENT_COPY[locale];
  const v = report.verdict;
  const index = SONG_ORDER.indexOf(report.song);
  const pct = formatNumber(v.precision / 10000, locale, { style: "percent", maximumFractionDigits: 1 });
  const holds = v.counts.held + v.counts.dropped > 0;
  const parts: Mark[] = holds ? ["perfect", "good", "near", "held"] : ["perfect", "good", "near"];
  const breakdown = parts.map((mark) => ({ label: game.markNames[mark], value: v.counts[mark] * POINTS[mark] * SCORE_PER_POINT }));
  if (v.counts.noise > 0) breakdown.push({ label: game.markNames.noise, value: v.counts.noise * POINTS.noise * SCORE_PER_POINT });
  const late = v.timing.mean > 0;
  const timing = Math.abs(v.timing.mean) < 5 ? copy.onTime : copy.off(Math.round(Math.abs(v.timing.mean)), late);
  const facts = [
    { label: game.precision, value: pct },
    { label: game.bestStreak, value: String(v.bestStreak) },
    { label: copy.timing, value: timing },
  ];
  if (report.log.assist) facts.push({ label: copy.assist, value: copy.offBoard });
  const cut = v.cutAt !== null;
  const achievements: string[] = [];
  if (v.stars > 0) achievements.push("talent-first");
  if (v.stars === 3 && !report.log.assist) achievements.push("talent-perfect");
  const text = cut ? { title: game.cutTitle, text: game.cutText } : copy.lines[v.stars as 0 | 1 | 2 | 3];
  return {
    won: v.stars > 0,
    score: runScore(v),
    stars: v.stars,
    breakdown,
    stats: runStats(v),
    replay: report.log,
    level: { index, id: report.song, title: game.songs[report.song].title, total: SONG_ORDER.length },
    copy: text,
    summary: `${game.precision}: ${pct}`,
    starHint: cut ? copy.cutHint : v.stars < 3 ? copy.hints[v.stars as 0 | 1 | 2] : undefined,
    restartLabel: copy.again,
    facts,
    achievements,
  };
}
