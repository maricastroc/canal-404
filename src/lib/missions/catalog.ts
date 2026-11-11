import type { MatchSetup } from "@/games/types";
import type { GameSlug } from "@/lib/competition/boards";
import { MISSION_GAMES, type MissionGame } from "./games";
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
  setup?: MatchSetup;
};

export { MISSION_GAMES, type MissionGame };

export type Rotation = { from: string | null; games: readonly MissionGame[] };

export const ROTATIONS: readonly Rotation[] = [
  { from: null, games: ["bad-ideas-lab", "food-fight"] },
  { from: "2026-11-16", games: MISSION_GAMES },
];

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
  {
    key: "street-five-launches",
    version: 1,
    game: "dead-end-street",
    level: null,
    title: "Mira econômica",
    objective: "Vença as três rodadas da Rua Sem Saída usando no máximo 5 dos 7 objetos.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "launches", op: "max", value: 5 },
    ],
    ranked: true,
  },
  {
    key: "street-two-at-once",
    version: 1,
    game: "dead-end-street",
    level: null,
    title: "Dois de uma vez",
    objective: "Derrube os dois alvos de uma rodada com um lançamento só.",
    goal: [{ stat: "combos", op: "min", value: 1 }],
    ranked: true,
  },
  {
    key: "street-three-stars",
    version: 1,
    game: "dead-end-street",
    level: null,
    title: "Três estrelas na rua",
    objective: "Vença com pelo menos 2.050 pontos. Cada objeto que sobra vale 250.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "score", op: "min", value: 2050 },
    ],
    ranked: true,
  },
  {
    key: "street-yard-chaos",
    version: 1,
    game: "dead-end-street",
    level: null,
    title: "Quintal de pernas pro ar",
    objective: "Tire do lugar pelo menos 7 das 10 coisas do quintal do Seu Arlindo: pneus, latas, tábua e caixas.",
    goal: [{ stat: "mess", op: "min", value: 7 }],
    ranked: true,
  },
  {
    key: "recess-corridor-spotless",
    version: 1,
    game: "operation-recess",
    level: "corridor",
    title: "Corredor sem arranhão",
    objective: "Atravesse o Corredor proibido sem levar nenhuma batida dos monitores.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "resumed", op: "max", value: 0 },
      { stat: "bumps", op: "max", value: 0 },
    ],
    ranked: true,
  },
  {
    key: "recess-yard-stickers",
    version: 1,
    game: "operation-recess",
    level: "yard",
    title: "Álbum completo",
    objective: "Pegue as 4 figurinhas do Pátio ocupado e chegue à porta da direção. Algumas ficam lá no alto.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "resumed", op: "max", value: 0 },
      { stat: "stickersLeft", op: "max", value: 0 },
    ],
    ranked: true,
  },
  {
    key: "recess-yard-monitors",
    version: 1,
    game: "operation-recess",
    level: "yard",
    title: "Pátio liberado",
    objective: "Derrube os 9 monitores do Pátio ocupado, inclusive os do apito, antes de chegar à porta.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "resumed", op: "max", value: 0 },
      { stat: "monitorsLeft", op: "max", value: 0 },
    ],
    ranked: true,
  },
  {
    key: "recess-office-boss",
    version: 1,
    game: "operation-recess",
    level: "office",
    title: "Inspetor sem chance",
    objective: "Vença o Inspetor do Silêncio levando no máximo 3 batidas no Caminho da direção inteiro.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "resumed", op: "max", value: 0 },
      { stat: "bumps", op: "max", value: 3 },
    ],
    ranked: true,
  },
  {
    key: "pajama-bedroom-few-pillows",
    version: 1,
    game: "pajama-war",
    level: "bedroom",
    title: "Quase sem marcas",
    objective: "Vença a guerra no Quarto levando no máximo 4 travesseiradas. Fique de olho no “!”.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "damageTaken", op: "max", value: 4 },
    ],
    ranked: true,
  },
  {
    key: "pajama-living-double-ko",
    version: 1,
    game: "pajama-war",
    level: "living",
    title: "Nocaute duplo",
    objective: "Na Sala de estar, nocauteie você mesmo os dois adversários e fique de pé no final.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "kos", op: "min", value: 2 },
    ],
    ranked: true,
  },
  {
    key: "pajama-living-full-energy",
    version: 1,
    game: "pajama-war",
    level: "living",
    title: "Energia de sobra",
    objective: "Vença na Sala de estar terminando com pelo menos 7 pontos de energia.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "hp", op: "min", value: 7 },
    ],
    ranked: true,
  },
  {
    key: "pajama-yard-lia",
    version: 1,
    game: "pajama-war",
    level: "yard",
    title: "A veloz no Quintal",
    objective: "Vença no Quintal jogando com a Lia. Ela corre muito, mas demora para pegar outro travesseiro.",
    goal: [
      { stat: "won", op: "min", value: 1 },
      { stat: "kid", op: "min", value: 0 },
      { stat: "kid", op: "max", value: 0 },
    ],
    ranked: true,
    setup: { character: "lia" },
  },
];

export function missionByKey(key: string) {
  return CATALOG.find((m) => m.key === key) ?? null;
}
