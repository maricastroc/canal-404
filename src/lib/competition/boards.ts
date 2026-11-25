import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";

export const GAME_SLUGS = ["dead-end-street", "bad-ideas-lab", "food-fight", "operation-recess", "pajama-war", "off-air-vacation", "downhill-derby", "past-bedtime", "talent-show"] as const;

export type GameSlug = (typeof GAME_SLUGS)[number];

export type RankKey = [number, number, number];

export type MetricUnit = "points" | "time" | "count" | "steps" | "racetime";

export type Metric = { label: string; unit: MetricUnit; lowerIsBetter: boolean; noun?: readonly [string, string] };

export type BoardCheck = "replayed" | "checked";

export type BoardMeta = { explain: string; metrics: readonly Metric[]; check: BoardCheck; practice?: readonly string[]; finishers?: true };

export const BOARD_META: Record<GameSlug, BoardMeta> = {
  "dead-end-street": {
    explain: "Cada fase tem seu placar. Maior pontuação; empate: quem usou menos lançamentos.",
    check: "replayed",
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
    explain: "Aqui não tem disputa: é a lista de quem terminou a aventura, com quem terminou por último no topo.",
    check: "checked",
    finishers: true,
    metrics: [
      { label: "Pontos", unit: "points", lowerIsBetter: false },
      { label: "Tempo", unit: "time", lowerIsBetter: true },
      { label: "Descobertas", unit: "count", lowerIsBetter: false, noun: ["descoberta", "descobertas"] },
    ],
  },
  "downhill-derby": {
    explain: "Cada pista tem seu placar. Menor tempo vence. Empate: menos capotadas; depois, mais pontos da corrida.",
    check: "replayed",
    metrics: [
      { label: "Tempo", unit: "racetime", lowerIsBetter: true },
      { label: "Capotadas", unit: "count", lowerIsBetter: true, noun: ["capotada", "capotadas"] },
      { label: "Show", unit: "points", lowerIsBetter: false },
    ],
  },
  "past-bedtime": {
    explain: "Cada parte tem seu placar. Menos jogadas vence. Empate: quem acordou menos gente; depois, menos rangidos fora do cuco. Partidas com dica não entram.",
    check: "replayed",
    metrics: [
      { label: "Jogadas", unit: "count", lowerIsBetter: true, noun: ["jogada", "jogadas"] },
      { label: "Despertares", unit: "count", lowerIsBetter: true, noun: ["despertar", "despertares"] },
      { label: "Rangidos", unit: "count", lowerIsBetter: true, noun: ["rangido", "rangidos"] },
    ],
  },
  "talent-show": {
    explain:
      "Cada música tem seu próprio ranking. Quanto mais pontos, melhor!\nEmpatou? Vence quem acertou mais notas na mosca. Se continuar empatado, ganha quem fez menos barulho.",
    check: "replayed",
    metrics: [
      { label: "Pontos", unit: "points", lowerIsBetter: false },
      { label: "Na mosca", unit: "count", lowerIsBetter: false, noun: ["nota na mosca", "notas na mosca"] },
      { label: "Barulho", unit: "count", lowerIsBetter: true, noun: ["toque fora de hora", "toques fora de hora"] },
    ],
  },
};

type BoardText = { explain: string; metrics: { label: string; noun?: readonly [string, string] }[] };

const BOARD_TEXT_EN: Record<GameSlug, BoardText> = {
  "dead-end-street": {
    explain: "Each level has its own board. Highest score; tiebreak: fewest launches.",
    metrics: [{ label: "Points" }, { label: "Launches", noun: ["launch", "launches"] }],
  },
  "bad-ideas-lab": {
    explain: "Fewest parts wins. Tiebreak: the machine that gets the ball to the target fastest.",
    metrics: [{ label: "Parts", noun: ["part", "parts"] }, { label: "Ball time" }],
  },
  "food-fight": {
    explain: "Highest score. Tiebreak: fewest puddings taken, then the longest streak.",
    metrics: [{ label: "Points" }, { label: "Puddings taken", noun: ["pudding taken", "puddings taken"] }, { label: "Best streak", noun: ["hit in a row", "hits in a row"] }],
  },
  "operation-recess": {
    explain: "Fewest hits taken wins. Tiebreak: fastest finish. Runs resumed from a bell don't count.",
    metrics: [{ label: "Hits taken", noun: ["hit taken", "hits taken"] }, { label: "Time" }, { label: "Points" }],
  },
  "pajama-war": {
    explain: "Whoever ends with the most energy wins. Tiebreak: the fastest win.",
    metrics: [{ label: "Energy", noun: ["energy", "energy"] }, { label: "Time" }, { label: "Hits", noun: ["hit", "hits"] }],
  },
  "off-air-vacation": {
    explain: "No contest here: it's the list of everyone who finished the adventure, with the latest on top.",
    metrics: [{ label: "Points" }, { label: "Time" }, { label: "Discoveries", noun: ["discovery", "discoveries"] }],
  },
  "downhill-derby": {
    explain: "Each track has its own board. Fastest time wins. Tiebreak: fewer wipeouts, then more race points.",
    metrics: [{ label: "Time" }, { label: "Wipeouts", noun: ["wipeout", "wipeouts"] }, { label: "Show" }],
  },
  "past-bedtime": {
    explain: "Each part has its own board. Fewest moves wins. Tiebreak: fewer people woken, then fewer creaks outside the cuckoo. Runs with a hint don't go on the board.",
    metrics: [{ label: "Moves", noun: ["move", "moves"] }, { label: "Wake-ups", noun: ["wake-up", "wake-ups"] }, { label: "Creaks", noun: ["creak", "creaks"] }],
  },
  "talent-show": {
    explain: "Each song has its own board. The more points, the better!\nTied? Whoever hit more bullseye notes wins. Still tied, whoever made less noise wins.",
    metrics: [{ label: "Points" }, { label: "Bullseye", noun: ["bullseye note", "bullseye notes"] }, { label: "Noise", noun: ["stray tap", "stray taps"] }],
  },
};

const BOARD_EN = Object.fromEntries(
  GAME_SLUGS.map((game): [GameSlug, BoardMeta] => {
    const meta = BOARD_META[game];
    const text = BOARD_TEXT_EN[game];
    return [game, { ...meta, explain: text.explain, metrics: meta.metrics.map((m, i): Metric => ({ ...m, ...text.metrics[i] })) }];
  }),
) as Record<GameSlug, BoardMeta>;

export function isFinishersBoard(game: GameSlug) {
  return BOARD_META[game].finishers === true;
}

export function boardMeta(game: GameSlug, locale: Locale): BoardMeta {
  return locale === "en" ? BOARD_EN[game] : BOARD_META[game];
}

export type CheckText = { explain: string; verified?: string };

const CHECKED = localized<CheckText>({
  "pt-BR": {
    explain: "O canal confere se os números da partida fecham e se ela durou o tempo mínimo. Isso barra erros e exageros, mas não prova que a partida foi jogada sem trapaça.",
  },
  en: {
    explain: "The channel checks that the run's numbers add up and that it lasted the minimum time. That stops mistakes and exaggerations, but it doesn't prove the run was played without cheating.",
  },
});

const REPLAYED = localized<Partial<Record<GameSlug, Required<CheckText>>>>({
  "pt-BR": {
    "bad-ideas-lab": {
      explain: "O canal monta sua máquina de novo, no servidor, e só aceita o recorde se a bolinha chegar lá.",
      verified: "Máquina testada pelo canal",
    },
    "dead-end-street": {
      explain: "O canal refaz seus lançamentos no servidor, com a mesma física do jogo, e só aceita o recorde se a partida terminar com a mesma pontuação.",
      verified: "Lançamentos refeitos pelo canal",
    },
    "downhill-derby": {
      explain: "O canal refaz sua descida no servidor, com a mesma física do jogo, e só aceita o tempo se a corrida terminar igual.",
      verified: "Descida refeita pelo canal",
    },
    "past-bedtime": {
      explain: "O canal refaz suas jogadas no servidor, com as mesmas regras da casa, e só aceita o resultado se o Bruno chegar lá sem ser pego.",
      verified: "Jogadas refeitas pelo canal",
    },
    "talent-show": {
      explain: "O Canal 404 refaz sua apresentação no servidor, com a mesma partitura do jogo. Só entram no placar resultados com a pontuação conferida e toques dentro do alcance de uma pessoa.",
      verified: "Toques refeitos pelo canal",
    },
  },
  en: {
    "bad-ideas-lab": {
      explain: "The channel rebuilds your machine on the server and only accepts the record if the ball gets there.",
      verified: "Machine tested by the channel",
    },
    "dead-end-street": {
      explain: "The channel replays your launches on the server with the game's own physics and only accepts the record if the match ends with the same score.",
      verified: "Launches replayed by the channel",
    },
    "downhill-derby": {
      explain: "The channel replays your run on the server with the game's own physics and only accepts the time if the race ends the same way.",
      verified: "Run replayed by the channel",
    },
    "past-bedtime": {
      explain: "The channel replays your moves on the server with the house's own rules and only accepts the result if Bruno gets there without being caught.",
      verified: "Moves replayed by the channel",
    },
    "talent-show": {
      explain: "Canal 404 replays your performance on the server against the game's own chart. Only results with a matching score and taps within a person's reach go on the board.",
      verified: "Taps replayed by the channel",
    },
  },
});

export function checkText(game: GameSlug, locale: Locale): CheckText {
  return (BOARD_META[game].check === "replayed" ? REPLAYED[locale][game] : undefined) ?? CHECKED[locale];
}

export function isGameSlug(value: unknown): value is GameSlug {
  return typeof value === "string" && (GAME_SLUGS as readonly string[]).includes(value);
}

export function metricValues(game: GameSlug, rank: RankKey) {
  return BOARD_META[game].metrics.map((m, i) => (m.lowerIsBetter ? -rank[i] : rank[i]) || 0);
}
