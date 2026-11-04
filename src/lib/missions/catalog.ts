import type { GameSlug } from "@/lib/competition/boards";
import type { Condition } from "./goals";

export type MissionDef = {
  key: string;
  version: number;
  game: GameSlug;
  level: string | null;
  title: string;
  objective: string;
  goal: Condition[];
  ranked: boolean;
};

export const MISSION_GAMES = ["bad-ideas-lab", "food-fight"] as const satisfies readonly GameSlug[];

export type MissionGame = (typeof MISSION_GAMES)[number];

export const CATALOG: readonly MissionDef[] = [
  {
    key: "lab-finale-every-part",
    version: 1,
    game: "bad-ideas-lab",
    level: "finale",
    title: "A máquina completa",
    objective: "Em “A pior ideia de todas”, use as 5 peças da caixa. A bolinha tem que passar por todas antes de tocar o sino.",
    goal: [
      { stat: "parts", op: "min", value: 5 },
      { stat: "untouched", op: "max", value: 0 },
    ],
    ranked: true,
  },
  {
    key: "lab-finale-two-parts",
    version: 1,
    game: "bad-ideas-lab",
    level: "finale",
    title: "Menos é mais",
    objective: "Toque o sino de “A pior ideia de todas” usando no máximo 2 peças.",
    goal: [{ stat: "parts", op: "max", value: 2 }],
    ranked: true,
  },
  {
    key: "lab-pixel-two-ramps",
    version: 1,
    game: "bad-ideas-lab",
    level: "pixel",
    title: "Rampa dupla",
    objective: "Acorde o Pixel usando as duas rampas. A bolinha tem que passar pelas duas.",
    goal: [
      { stat: "parts", op: "min", value: 2 },
      { stat: "untouched", op: "max", value: 0 },
    ],
    ranked: true,
  },
  {
    key: "lab-pixel-fast",
    version: 1,
    game: "bad-ideas-lab",
    level: "pixel",
    title: "Despertador ligeiro",
    objective: "Acorde o Pixel rápido: a bolinha tem que tocar o sino em até 4,20 segundos.",
    goal: [{ stat: "steps", op: "max", value: 252 }],
    ranked: true,
  },
  {
    key: "lab-juice-fast",
    version: 1,
    game: "bad-ideas-lab",
    level: "juice",
    title: "Suco expresso",
    objective: "Leve a laranja até o espremedor em até 1,80 segundo.",
    goal: [{ stat: "steps", op: "max", value: 108 }],
    ranked: true,
  },
  {
    key: "lab-juice-fan-and-ramp",
    version: 1,
    game: "bad-ideas-lab",
    level: "juice",
    title: "Vento e ladeira",
    objective: "Faça o suco usando o ventilador e a rampa. A laranja tem que passar pelos dois.",
    goal: [
      { stat: "parts", op: "min", value: 2 },
      { stat: "untouched", op: "max", value: 0 },
    ],
    ranked: true,
  },
  {
    key: "lab-remote-three-parts",
    version: 1,
    game: "bad-ideas-lab",
    level: "remote",
    title: "Volta completa",
    objective: "Aperte o botão do controle usando as duas esteiras e a rampa. A bolinha tem que passar pelas três.",
    goal: [
      { stat: "parts", op: "min", value: 3 },
      { stat: "untouched", op: "max", value: 0 },
    ],
    ranked: true,
  },
  {
    key: "food-streak-eight",
    version: 1,
    game: "food-fight",
    level: null,
    title: "Oito seguidos",
    objective: "Acerte 8 colegas seguidos. Errar, bater na bandeja ou levar pudim zera a sequência.",
    goal: [{ stat: "bestStreak", op: "min", value: 8 }],
    ranked: true,
  },
  {
    key: "food-spotless",
    version: 1,
    game: "food-fight",
    level: null,
    title: "Sem uma mancha",
    objective: "Chegue ao sinal sem levar nenhum pudim.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "hitsTaken", op: "max", value: 0 },
    ],
    ranked: true,
  },
  {
    key: "food-two-stars",
    version: 1,
    game: "food-fight",
    level: null,
    title: "Recreio de duas estrelas",
    objective: "Chegue ao sinal com pelo menos 7.500 pontos.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "score", op: "min", value: 7500 },
    ],
    ranked: true,
  },
  {
    key: "food-lunch-lady",
    version: 1,
    game: "food-fight",
    level: null,
    title: "A tia nem viu",
    objective: "Chegue ao sinal sem acertar a tia da cantina.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "lunchLadyHits", op: "max", value: 0 },
    ],
    ranked: true,
  },
  {
    key: "food-right-on-time",
    version: 1,
    game: "food-fight",
    level: null,
    title: "Na hora H",
    objective: "Acerte 5 colegas na hora H, bem quando eles levantam o pudim.",
    goal: [{ stat: "interrupts", op: "min", value: 5 }],
    ranked: true,
  },
];

export function missionByKey(key: string) {
  return CATALOG.find((m) => m.key === key) ?? null;
}
