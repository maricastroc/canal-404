import type { GameResult } from "@/games/types";
import { localized } from "@/i18n/copy";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { TALENT_COPY, type JuryId } from "./copy";
import type { RunReport } from "./scenes/StageScene";
import { POINTS, runScore, runStats, SCORE_PER_POINT, type Mark } from "./sim/judge";
import type { SongId } from "./song/notation";
import { SONG_ORDER } from "./song/songs";

export const REPLAY_KIND = "talent-taps";

type Tier = 0 | 1 | 2 | 3;
type Remark = { judge: JuryId; line: string };
type Remarks = Record<SongId, Record<Tier, Remark>>;

const remark = (judge: JuryId, line: string): Remark => ({ judge, line });

const COPY = localized({
  "pt-BR": {
    again: "Tocar de novo",
    timing: "Tempo médio",
    onTime: "no tempo",
    off: (ms: number, late: boolean) => `${ms} ms ${late ? "atrasado" : "adiantado"}`,
    titles: { 3: "Que show!", 2: "Bela apresentação!", 1: "Passou!", 0: "Quase lá!" } as Record<Tier, string>,
    champions: "Campeões do 404!",
    radio: "A gravação do show já toca no rádio da sala.",
    remarks: {
      theme: {
        3: remark("lunch", "Dez! Quem toca assim ganha repeteco na merenda."),
        2: remark("arlindo", "Esse balde não é o que sumiu do meu quintal? Bom, pelo menos tocou bem."),
        1: remark("inspector", "Ritmo aceitável. Volume, nem tanto."),
        0: remark("inspector", "Anotado na prancheta: balde não é bateria."),
      },
      signoff: {
        3: remark("lunch", "Que coisa mais linda. Chorei no avental."),
        2: remark("arlindo", "Me lembrou o fim da programação de antigamente. Quase dormi. No bom sentido."),
        1: remark("inspector", "Uma música baixinha, que beleza. Só faltou capricho."),
        0: remark("arlindo", "No meu tempo, o fim da transmissão era só chiado. E era mais afinado."),
      },
      recess: {
        3: remark("lunch", "Repetiu tudo direitinho. Quem dera a fila do lanche fosse assim."),
        2: remark("inspector", "Escutou antes de tocar. Gostei. É raro."),
        1: remark("inspector", "O gravador estava ótimo. O eco, nem tanto."),
        0: remark("arlindo", "A Mila tocou uma música e vocês responderam outra."),
      },
      street: {
        3: remark("lunch", "Chacoalhou tanto que eu sacudi a concha de sopa junto!"),
        2: remark("arlindo", "Essa música me lembra bagunça no meu quintal. Mas tocaram bem."),
        1: remark("inspector", "Rápido demais para o meu gosto. E um pouco fora do tempo."),
        0: remark("arlindo", "Sem saída mesmo: o ritmo se perdeu no meio da rua."),
      },
      static: {
        3: remark("inspector", "Finalmente uma música em que o silêncio também toca. Aprovada."),
        2: remark("lunch", "Caiu o sinal e vocês nem piscaram. Orgulho da cantina!"),
        1: remark("arlindo", "Lá em casa, quando o sinal cai, eu dou um tapa na TV. Funciona melhor."),
        0: remark("inspector", "Sem sinal, sem ritmo, sem estrela."),
      },
      medley: {
        3: remark("lunch", "Nota dez, repeteco e sobremesa pra banda toda!"),
        2: remark("arlindo", "Tá bom, tá bom. Eu admito: vocês são campeões."),
        1: remark("inspector", "Campeões. Barulhentos, mas campeões."),
        0: remark("arlindo", "Quase levaram o show. Quase."),
      },
    } satisfies Remarks,
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
    titles: { 3: "What a show!", 2: "Great performance!", 1: "You're through!", 0: "So close!" } as Record<Tier, string>,
    champions: "404 champions!",
    radio: "The show's recording now plays on the radio in the room.",
    remarks: {
      theme: {
        3: remark("lunch", "Top marks! Anyone who drums like that gets seconds at lunch."),
        2: remark("arlindo", "Isn't that the bucket that went missing from my yard? Well, at least it sounded good."),
        1: remark("inspector", "Acceptable rhythm. The volume, less so."),
        0: remark("inspector", "Noted on my clipboard: a bucket is not a drum."),
      },
      signoff: {
        3: remark("lunch", "So beautiful. I cried into my apron."),
        2: remark("arlindo", "Reminded me of the old sign-offs. I almost fell asleep. In a good way."),
        1: remark("inspector", "A nice quiet song, how lovely. It just needed more care."),
        0: remark("arlindo", "Back in my day, sign-off was just static. And it was more in tune."),
      },
      recess: {
        3: remark("lunch", "Played it all back just right. If only the lunch line behaved like that."),
        2: remark("inspector", "You listened before you played. I like that. It's rare."),
        1: remark("inspector", "The recorder was great. The echo, not so much."),
        0: remark("arlindo", "Mila played one song and you answered with another."),
      },
      street: {
        3: remark("lunch", "So much shaking, I shook my soup ladle along!"),
        2: remark("arlindo", "This song reminds me of the mess in my backyard. But you played it well."),
        1: remark("inspector", "Too fast for my taste. And a little off the beat."),
        0: remark("arlindo", "A dead end, all right: the beat got lost halfway down the street."),
      },
      static: {
        3: remark("inspector", "Finally, a song where silence gets to play too. Approved."),
        2: remark("lunch", "The signal dropped and you didn't even blink. The cafeteria is proud!"),
        1: remark("arlindo", "At home, when the signal drops, I smack the TV. Works better."),
        0: remark("inspector", "No signal, no rhythm, no stars."),
      },
      medley: {
        3: remark("lunch", "Top marks, seconds and dessert for the whole band!"),
        2: remark("arlindo", "Fine, fine. I admit it: you're champions."),
        1: remark("inspector", "Champions. Noisy, but champions."),
        0: remark("arlindo", "You almost won the show. Almost."),
      },
    } satisfies Remarks,
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
  const cut = v.cutAt !== null;
  const achievements: string[] = [];
  if (v.stars > 0) achievements.push("talent-first");
  if (v.stars === 3) achievements.push("talent-perfect");
  const tier = v.stars as Tier;
  const finale = report.song === "medley" && v.stars > 0;
  const said = copy.remarks[report.song][tier];
  const quote = `${game.jury[said.judge]}: “${said.line}”`;
  const text = cut ? { title: game.cutTitle, text: game.cutText } : { title: finale ? copy.champions : copy.titles[tier], text: finale ? `${quote} ${copy.radio}` : quote };
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
