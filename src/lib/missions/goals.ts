import { countOf, formatNumber } from "@/i18n/format";
import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import { KID_INFO, KIDS, type KidId } from "@/games/pajama-war/config";
import { LEVELS, starsFor } from "@/games/bad-ideas-lab/levels";
import type { GameSlug } from "@/lib/competition/boards";
import { machineSeconds } from "@/lib/competition/format";

export type GoalStat =
  | "parts"
  | "untouched"
  | "steps"
  | "won"
  | "score"
  | "bestStreak"
  | "hitsTaken"
  | "lunchLadyHits"
  | "interrupts"
  | "launches"
  | "combos"
  | "mess"
  | "gadgets"
  | "bumps"
  | "resumed"
  | "stickersLeft"
  | "monitorsLeft"
  | "damageTaken"
  | "kos"
  | "hp"
  | "kid";

export type Condition = { stat: GoalStat; op: "min" | "max"; value: number };

export type Evidence = Partial<Record<GoalStat, number>>;

export type GoalCheck = { passed: true } | { passed: false; condition: Condition; actual: number | null };

export const GOAL_STATS: readonly GoalStat[] = [
  "parts",
  "untouched",
  "steps",
  "won",
  "score",
  "bestStreak",
  "hitsTaken",
  "lunchLadyHits",
  "interrupts",
  "launches",
  "combos",
  "mess",
  "gadgets",
  "bumps",
  "resumed",
  "stickersLeft",
  "monitorsLeft",
  "damageTaken",
  "kos",
  "hp",
  "kid",
];

export function isCondition(value: unknown): value is Condition {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.stat === "string" &&
    (GOAL_STATS as readonly string[]).includes(c.stat) &&
    (c.op === "min" || c.op === "max") &&
    typeof c.value === "number" &&
    Number.isInteger(c.value) &&
    c.value >= 0
  );
}

export function checkGoal(goal: readonly Condition[], evidence: Evidence): GoalCheck {
  for (const condition of goal) {
    const actual = evidence[condition.stat];
    if (typeof actual !== "number") return { passed: false, condition, actual: null };
    const ok = condition.op === "min" ? actual >= condition.value : actual <= condition.value;
    if (!ok) return { passed: false, condition, actual };
  }
  return { passed: true };
}

function plural(n: number, one: string, many: string, locale: Locale) {
  return countOf(n, [one, many], locale);
}

export { machineSeconds };

const KID_ARTICLE: Record<KidId, string> = { lia: "a", nico: "o", bia: "a" };

const KID_TEXT = localized<{ name: (kid: KidId) => string; other: string }>({
  "pt-BR": { name: (kid) => `${KID_ARTICLE[kid]} ${KID_INFO[kid].name}`, other: "outra criança" },
  en: { name: (kid) => KID_INFO[kid].name, other: "another kid" },
});

function kidName(index: number, locale: Locale) {
  const kid = KIDS[index];
  return kid ? KID_TEXT[locale].name(kid) : KID_TEXT[locale].other;
}

const LOST = localized<{ games: Partial<Record<GameSlug, string>>; other: string }>({
  "pt-BR": {
    games: {
      "dead-end-street": "a munição acabou antes de completar a fase",
      "food-fight": "os guardanapos acabaram antes do sinal",
      "operation-recess": "os corações do Bruno acabaram antes do fim da fase",
      "pajama-war": "sua energia acabou antes do fim da guerra",
    },
    other: "a partida não terminou",
  },
  en: {
    games: {
      "dead-end-street": "you ran out of ammo before clearing the level",
      "food-fight": "you ran out of napkins before the bell",
      "operation-recess": "Bruno ran out of hearts before the end of the level",
      "pajama-war": "you ran out of energy before the end of the war",
    },
    other: "the run didn't finish",
  },
});

const pt = (n: number, one: string, many: string) => plural(n, one, many, "pt-BR");
const en = (n: number, one: string, many: string) => plural(n, one, many, "en");

function bound(op: Condition["op"], value: number, one: string, many: string, none = "nenhum") {
  if (op === "max" && value === 0) return none;
  return `${op === "min" ? "pelo menos" : "no máximo"} ${pt(value, one, many)}`;
}

function boundEn(op: Condition["op"], value: number, one: string, many: string) {
  if (op === "max" && value === 0) return `no ${many}`;
  return `${op === "min" ? "at least" : "at most"} ${en(value, one, many)}`;
}

const ACTUAL = localized<(stat: GoalStat, actual: number, game: GameSlug) => string>({
  "pt-BR": (stat, actual, game) => {
    switch (stat) {
      case "parts":
        return `a máquina usou ${pt(actual, "peça", "peças")}`;
      case "untouched":
        return actual === 1 ? "a bolinha não passou por 1 peça" : `a bolinha não passou por ${actual} peças`;
      case "steps":
        return `a bolinha levou ${machineSeconds(actual, "pt-BR")}`;
      case "won":
        return LOST["pt-BR"].games[game] ?? LOST["pt-BR"].other;
      case "score":
        return `você fez ${pt(actual, "ponto", "pontos")}`;
      case "bestStreak":
        return `sua melhor sequência foi de ${pt(actual, "acerto", "acertos")}`;
      case "hitsTaken":
        return `você levou ${pt(actual, "pudim", "pudins")}`;
      case "lunchLadyHits":
        return actual === 1 ? "a tia levou 1 lanche" : `a tia levou ${actual} lanches`;
      case "interrupts":
        return `você acertou ${pt(actual, "vez", "vezes")} na hora H`;
      case "launches":
        return `você usou ${pt(actual, "lançamento", "lançamentos")}`;
      case "combos":
        return actual === 0 ? "nenhum lançamento derrubou dois alvos de uma vez" : `você derrubou dois alvos de uma vez ${pt(actual, "vez", "vezes")}`;
      case "mess":
        return actual === 1 ? "só 1 coisa do quintal saiu do lugar" : `só ${actual} coisas do quintal saíram do lugar`;
      case "gadgets":
        return actual === 0 ? "nenhuma engenhoca disparou" : `você disparou ${pt(actual, "engenhoca", "engenhocas")}`;
      case "bumps":
        return `o Bruno levou ${pt(actual, "batida", "batidas")}`;
      case "resumed":
        return "a partida continuou do sino, e a missão vale só para a fase inteira";
      case "stickersLeft":
        return actual === 1 ? "faltou 1 figurinha" : `faltaram ${actual} figurinhas`;
      case "monitorsLeft":
        return actual === 1 ? "faltou derrubar 1 monitor" : `faltou derrubar ${actual} monitores`;
      case "damageTaken":
        return actual === 1 ? "você levou 1 travesseirada" : `você levou ${actual} travesseiradas`;
      case "kos":
        return actual === 0 ? "você não nocauteou ninguém" : `você nocauteou ${pt(actual, "criança", "crianças")}`;
      case "hp":
        return `você terminou com ${pt(actual, "ponto", "pontos")} de energia`;
      case "kid":
        return `você jogou com ${kidName(actual, "pt-BR")}`;
    }
  },
  en: (stat, actual, game) => {
    switch (stat) {
      case "parts":
        return `the machine used ${en(actual, "part", "parts")}`;
      case "untouched":
        return actual === 1 ? "the ball skipped 1 part" : `the ball skipped ${actual} parts`;
      case "steps":
        return `the ball took ${machineSeconds(actual, "en")}`;
      case "won":
        return LOST.en.games[game] ?? LOST.en.other;
      case "score":
        return `you scored ${en(actual, "point", "points")}`;
      case "bestStreak":
        return `your best streak was ${en(actual, "hit", "hits")}`;
      case "hitsTaken":
        return `you got hit by ${en(actual, "pudding", "puddings")}`;
      case "lunchLadyHits":
        return actual === 1 ? "the lunch lady got hit by 1 snack" : `the lunch lady got hit by ${actual} snacks`;
      case "interrupts":
        return `you landed ${en(actual, "just-in-time hit", "just-in-time hits")}`;
      case "launches":
        return `you used ${en(actual, "launch", "launches")}`;
      case "combos":
        return actual === 0 ? "no launch knocked down two targets at once" : `you knocked down two targets at once ${en(actual, "time", "times")}`;
      case "mess":
        return actual === 1 ? "only 1 thing in the yard got moved" : `only ${actual} things in the yard got moved`;
      case "gadgets":
        return actual === 0 ? "no gadget went off" : `you set off ${en(actual, "gadget", "gadgets")}`;
      case "bumps":
        return `Bruno took ${en(actual, "hit", "hits")}`;
      case "resumed":
        return "the run continued from a bell, and the mission only counts the whole level";
      case "stickersLeft":
        return actual === 1 ? "1 sticker was missing" : `${actual} stickers were missing`;
      case "monitorsLeft":
        return actual === 1 ? "1 monitor was still standing" : `${actual} monitors were still standing`;
      case "damageTaken":
        return actual === 1 ? "you took 1 pillow hit" : `you took ${actual} pillow hits`;
      case "kos":
        return actual === 0 ? "you didn't knock anyone out" : `you knocked out ${en(actual, "kid", "kids")}`;
      case "hp":
        return `you finished with ${en(actual, "energy point", "energy points")}`;
      case "kid":
        return `you played as ${kidName(actual, "en")}`;
    }
  },
});

const TARGET = localized<(condition: Condition) => string | null>({
  "pt-BR": ({ stat, op, value }) => {
    switch (stat) {
      case "parts":
        return `a missão pede ${bound(op, value, "peça", "peças", "nenhuma")}`;
      case "untouched":
        return value === 0 ? "a missão pede que ela passe por todas" : null;
      case "steps":
        return op === "max" ? `a missão pede até ${machineSeconds(value, "pt-BR")}` : null;
      case "score":
        return `a missão pede ${bound(op, value, "ponto", "pontos")}`;
      case "bestStreak":
        return op === "min" ? `a missão pede ${pt(value, "acerto seguido", "acertos seguidos")}` : null;
      case "hitsTaken":
        return op === "max" && value === 0 ? "na missão não pode levar nenhum" : `a missão aceita ${bound(op, value, "pudim", "pudins")}`;
      case "lunchLadyHits":
        return op === "max" && value === 0 ? "na missão a tia não pode levar nenhum" : null;
      case "interrupts":
        return op === "min" ? `a missão pede ${pt(value, "vez", "vezes")}` : null;
      case "launches":
        return `a missão pede ${bound(op, value, "lançamento", "lançamentos")}`;
      case "combos":
        return op === "min" && value > 1 ? `a missão pede ${pt(value, "vez", "vezes")}` : null;
      case "mess":
        return op === "min" ? `a missão pede ${value}` : null;
      case "gadgets":
        return op === "min" ? `a missão pede ${pt(value, "engenhoca", "engenhocas")}` : null;
      case "bumps":
        return `a missão aceita ${bound(op, value, "batida", "batidas", "nenhuma")}`;
      case "damageTaken":
        return `a missão aceita ${bound(op, value, "travesseirada", "travesseiradas", "nenhuma")}`;
      case "kos":
        return op === "min" ? `a missão pede ${pt(value, "nocaute", "nocautes")}` : null;
      case "hp":
        return op === "min" ? `a missão pede ${pt(value, "ponto", "pontos")}` : null;
      case "kid":
        return `a missão pede ${kidName(value, "pt-BR")}`;
      default:
        return null;
    }
  },
  en: ({ stat, op, value }) => {
    switch (stat) {
      case "parts":
        return `the mission asks for ${boundEn(op, value, "part", "parts")}`;
      case "untouched":
        return value === 0 ? "the mission needs it to go through all of them" : null;
      case "steps":
        return op === "max" ? `the mission asks for ${machineSeconds(value, "en")} or less` : null;
      case "score":
        return `the mission asks for ${boundEn(op, value, "point", "points")}`;
      case "bestStreak":
        return op === "min" ? `the mission asks for ${en(value, "hit in a row", "hits in a row")}` : null;
      case "hitsTaken":
        return op === "max" && value === 0 ? "the mission doesn't allow any" : `the mission allows ${boundEn(op, value, "pudding", "puddings")}`;
      case "lunchLadyHits":
        return op === "max" && value === 0 ? "in the mission she can't take a single one" : null;
      case "interrupts":
        return op === "min" ? `the mission asks for ${formatNumber(value, "en")}` : null;
      case "launches":
        return `the mission asks for ${boundEn(op, value, "launch", "launches")}`;
      case "combos":
        return op === "min" && value > 1 ? `the mission asks for ${en(value, "time", "times")}` : null;
      case "mess":
        return op === "min" ? `the mission asks for ${value}` : null;
      case "gadgets":
        return op === "min" ? `the mission asks for ${en(value, "gadget", "gadgets")}` : null;
      case "bumps":
        return `the mission allows ${boundEn(op, value, "hit", "hits")}`;
      case "damageTaken":
        return `the mission allows ${boundEn(op, value, "pillow hit", "pillow hits")}`;
      case "kos":
        return op === "min" ? `the mission asks for ${en(value, "knockout", "knockouts")}` : null;
      case "hp":
        return op === "min" ? `the mission asks for ${en(value, "point", "points")}` : null;
      case "kid":
        return `the mission asks for ${kidName(value, "en")}`;
      default:
        return null;
    }
  },
});

export function describeActual(stat: GoalStat, actual: number, game: GameSlug, locale: Locale) {
  return ACTUAL[locale](stat, actual, game);
}

export function describeTarget(condition: Condition, locale: Locale): string | null {
  return TARGET[locale](condition);
}

function sentence(text: string) {
  return `${text[0].toUpperCase()}${text.slice(1)}.`;
}

const SHORTFALL = localized({
  "pt-BR": { unknown: "Essa partida não mostrou o que a missão pede.", join: (actual: string, target: string) => `${actual}, e ${target}` },
  en: { unknown: "This run didn't show what the mission asks for.", join: (actual: string, target: string) => `${actual}, and ${target}` },
});

export function describeShortfall(check: Extract<GoalCheck, { passed: false }>, game: GameSlug, locale: Locale) {
  if (check.actual === null) return SHORTFALL[locale].unknown;
  const actual = describeActual(check.condition.stat, check.actual, game, locale);
  const target = check.condition.stat === "won" || (check.condition.stat === "combos" && check.actual === 0) ? null : describeTarget(check.condition, locale);
  return sentence(target ? SHORTFALL[locale].join(actual, target) : actual);
}

export function missionOverridesStars(mission: { game: GameSlug; level?: string | null; goal: readonly Condition[] }) {
  const parts = mission.game === "bad-ideas-lab" ? mission.goal.find((c) => c.stat === "parts" && c.op === "min") : undefined;
  const level = LEVELS.find((l) => l.id === mission.level);
  return Boolean(parts && level && starsFor(parts.value, level.par) < 3);
}

const NOTES = localized({
  "pt-BR": {
    parts: (parts: number, stars: number) =>
      `Esta missão pede ${pt(parts, "peça", "peças")}, então a fase rende no máximo ${pt(stars, "estrela", "estrelas")}. Tudo bem: para a missão, o que conta é concluir o desafio.`,
    recess: "Na missão, toda tentativa começa do início da fase. Os sinos tocam, mas não salvam o progresso.",
    kid: (name: string) => `Nesta missão, você joga com ${name}. Sua criança favorita continua a mesma fora dela.`,
  },
  en: {
    parts: (parts: number, stars: number) =>
      `This mission asks for ${en(parts, "part", "parts")}, so the level gives ${en(stars, "star", "stars")} at most. That's fine: for the mission, what counts is beating the challenge.`,
    recess: "In the mission, every attempt starts from the beginning of the level. The bells ring, but they don't save your progress.",
    kid: (name: string) => `In this mission, you play as ${name}. Your favorite kid stays the same outside of it.`,
  },
});

export function missionNotes(mission: { game: GameSlug; level?: string | null; goal: readonly Condition[]; setup?: { character?: string } }, locale: Locale) {
  const notes: string[] = [];
  const text = NOTES[locale];
  const parts = mission.game === "bad-ideas-lab" ? mission.goal.find((c) => c.stat === "parts" && c.op === "min") : undefined;
  const level = LEVELS.find((l) => l.id === mission.level);
  if (parts && level) {
    const stars = starsFor(parts.value, level.par);
    if (stars < 3) notes.push(text.parts(parts.value, stars));
  }
  if (mission.game === "operation-recess") notes.push(text.recess);
  const kid = mission.setup?.character;
  if (mission.game === "pajama-war" && kid) {
    const index = KIDS.indexOf(kid as KidId);
    if (index >= 0) notes.push(text.kid(kidName(index, locale)));
  }
  return notes;
}
