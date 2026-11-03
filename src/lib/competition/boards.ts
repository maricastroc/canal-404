export const GAME_SLUGS = ["dead-end-street", "bad-ideas-lab", "food-fight", "operation-recess", "pajama-war", "off-air-vacation"] as const;

export type GameSlug = (typeof GAME_SLUGS)[number];

export type RankKey = [number, number, number];

export type MetricUnit = "points" | "time" | "count";

export type Metric = { label: string; unit: MetricUnit; lowerIsBetter: boolean; noun?: readonly [string, string] };

export type BoardMeta = { explain: string; metrics: readonly Metric[] };

export const BOARD_META: Record<GameSlug, BoardMeta> = {
  "dead-end-street": {
    explain: "Maior pontuação. Empate: quem usou menos lançamentos.",
    metrics: [
      { label: "Pontos", unit: "points", lowerIsBetter: false },
      { label: "Lançamentos", unit: "count", lowerIsBetter: true, noun: ["lançamento", "lançamentos"] },
    ],
  },
  "bad-ideas-lab": {
    explain: "Menos peças vence. Empate: a máquina que leva a bolinha ao alvo mais rápido.",
    metrics: [
      { label: "Peças", unit: "count", lowerIsBetter: true, noun: ["peça", "peças"] },
      { label: "Passos da máquina", unit: "count", lowerIsBetter: true, noun: ["passo", "passos"] },
    ],
  },
  "food-fight": {
    explain: "Maior pontuação. Empate: quem levou menos pudim; depois, a maior sequência.",
    metrics: [
      { label: "Pontos", unit: "points", lowerIsBetter: false },
      { label: "Pudins levados", unit: "count", lowerIsBetter: true, noun: ["pudim levado", "pudins levados"] },
      { label: "Melhor sequência", unit: "count", lowerIsBetter: false, noun: ["acerto seguido", "acertos seguidos"] },
    ],
  },
  "operation-recess": {
    explain: "Menos batidas vence. Empate: quem chegou mais rápido. Partidas retomadas do sino não entram.",
    metrics: [
      { label: "Batidas", unit: "count", lowerIsBetter: true, noun: ["batida", "batidas"] },
      { label: "Tempo", unit: "time", lowerIsBetter: true },
      { label: "Pontos", unit: "points", lowerIsBetter: false },
    ],
  },
  "pajama-war": {
    explain: "Vence quem termina com mais energia. Empate: a vitória mais rápida.",
    metrics: [
      { label: "Energia", unit: "count", lowerIsBetter: false, noun: ["de energia", "de energia"] },
      { label: "Tempo", unit: "time", lowerIsBetter: true },
      { label: "Acertos", unit: "count", lowerIsBetter: false, noun: ["acerto", "acertos"] },
    ],
  },
  "off-air-vacation": {
    explain: "Quem descobriu mais coisas no resort. Empate: quem levou menos tempo.",
    metrics: [
      { label: "Pontos", unit: "points", lowerIsBetter: false },
      { label: "Tempo", unit: "time", lowerIsBetter: true },
      { label: "Descobertas", unit: "count", lowerIsBetter: false, noun: ["descoberta", "descobertas"] },
    ],
  },
};

export function isGameSlug(value: unknown): value is GameSlug {
  return typeof value === "string" && (GAME_SLUGS as readonly string[]).includes(value);
}

export function metricValues(game: GameSlug, rank: RankKey) {
  return BOARD_META[game].metrics.map((m, i) => (m.lowerIsBetter ? -rank[i] : rank[i]));
}
