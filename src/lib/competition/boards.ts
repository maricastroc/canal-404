export const GAME_SLUGS = ["dead-end-street", "bad-ideas-lab", "food-fight", "operation-recess", "pajama-war", "off-air-vacation"] as const;

export type GameSlug = (typeof GAME_SLUGS)[number];

export type RankKey = [number, number, number];

export type MetricUnit = "points" | "time" | "count" | "steps";

export type Metric = { label: string; unit: MetricUnit; lowerIsBetter: boolean; noun?: readonly [string, string] };

export type BoardCheck = "replayed" | "checked";

export type BoardMeta = { explain: string; metrics: readonly Metric[]; check: BoardCheck; practice?: readonly string[] };

export const BOARD_META: Record<GameSlug, BoardMeta> = {
  "dead-end-street": {
    explain: "Maior pontuação. Empate: quem usou menos lançamentos.",
    check: "checked",
    metrics: [
      { label: "Pontos", unit: "points", lowerIsBetter: false },
      { label: "Lançamentos", unit: "count", lowerIsBetter: true, noun: ["lançamento", "lançamentos"] },
    ],
  },
  "bad-ideas-lab": {
    explain: "Menos peças vence. Empate: a máquina que leva a bolinha ao alvo mais rápido.",
    check: "replayed",
    practice: ["test"],
    metrics: [
      { label: "Peças", unit: "count", lowerIsBetter: true, noun: ["peça", "peças"] },
      { label: "Tempo da bolinha", unit: "steps", lowerIsBetter: true },
    ],
  },
  "food-fight": {
    explain: "Maior pontuação. Empate: quem levou menos pudim; depois, a maior sequência.",
    check: "checked",
    metrics: [
      { label: "Pontos", unit: "points", lowerIsBetter: false },
      { label: "Pudins levados", unit: "count", lowerIsBetter: true, noun: ["pudim levado", "pudins levados"] },
      { label: "Melhor sequência", unit: "count", lowerIsBetter: false, noun: ["acerto seguido", "acertos seguidos"] },
    ],
  },
  "operation-recess": {
    explain: "Menos batidas vence. Empate: quem chegou mais rápido. Partidas retomadas do sino não entram.",
    check: "checked",
    metrics: [
      { label: "Batidas", unit: "count", lowerIsBetter: true, noun: ["batida", "batidas"] },
      { label: "Tempo", unit: "time", lowerIsBetter: true },
      { label: "Pontos", unit: "points", lowerIsBetter: false },
    ],
  },
  "pajama-war": {
    explain: "Vence quem termina com mais energia. Empate: a vitória mais rápida.",
    check: "checked",
    metrics: [
      { label: "Energia", unit: "count", lowerIsBetter: false, noun: ["de energia", "de energia"] },
      { label: "Tempo", unit: "time", lowerIsBetter: true },
      { label: "Acertos", unit: "count", lowerIsBetter: false, noun: ["acerto", "acertos"] },
    ],
  },
  "off-air-vacation": {
    explain: "Quem descobriu mais coisas no resort. Empate: quem levou menos tempo.",
    check: "checked",
    metrics: [
      { label: "Pontos", unit: "points", lowerIsBetter: false },
      { label: "Tempo", unit: "time", lowerIsBetter: true },
      { label: "Descobertas", unit: "count", lowerIsBetter: false, noun: ["descoberta", "descobertas"] },
    ],
  },
};

export const CHECK_TEXT: Record<BoardCheck, string> = {
  replayed: "O canal monta sua máquina de novo, no servidor, e só aceita o recorde se a bolinha chegar lá.",
  checked: "O canal confere se os números da partida fecham e se ela durou o tempo mínimo. Isso barra erros e exageros, mas não prova que a partida foi jogada sem trapaça.",
};

export function isGameSlug(value: unknown): value is GameSlug {
  return typeof value === "string" && (GAME_SLUGS as readonly string[]).includes(value);
}

export function metricValues(game: GameSlug, rank: RankKey) {
  return BOARD_META[game].metrics.map((m, i) => (m.lowerIsBetter ? -rank[i] : rank[i]) || 0);
}
