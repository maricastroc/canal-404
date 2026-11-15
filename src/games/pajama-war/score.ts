import { SCORE } from "./config";

export type MatchOutcome = { won: boolean; place: number; hits: number; kos: number; hp: number };

export function matchScore(o: MatchOutcome) {
  const rows: { label: string; value: number }[] = [
    { label: `Acertos (${o.hits})`, value: o.hits * SCORE.hit },
    { label: `Nocautes (${o.kos})`, value: o.kos * SCORE.ko },
  ];
  if (o.won) {
    rows.push({ label: "Último de pé", value: SCORE.win });
    rows.push({ label: `Energia que sobrou (${o.hp})`, value: o.hp * SCORE.hp });
  } else if (o.place === 2) rows.push({ label: "2º lugar", value: SCORE.second });
  const score = rows.reduce((a, r) => a + r.value, 0);
  const stars = o.won ? (o.hp >= 7 ? 3 : o.hp >= 4 ? 2 : 1) : 0;
  return { rows, score, stars };
}
