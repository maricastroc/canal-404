import { KID_INFO, KIDS, type KidId } from "@/games/pajama-war/config";
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

function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;
}

export { machineSeconds };

const KID_ARTICLE: Record<KidId, string> = { lia: "a", nico: "o", bia: "a" };

function kidName(index: number) {
  const kid = KIDS[index];
  return kid ? `${KID_ARTICLE[kid]} ${KID_INFO[kid].name}` : "outra criança";
}

const LOST: Partial<Record<GameSlug, string>> = {
  "dead-end-street": "a munição acabou antes da última rodada",
  "food-fight": "os guardanapos acabaram antes do sinal",
  "operation-recess": "os corações do Bruno acabaram antes do fim da fase",
  "pajama-war": "sua energia acabou antes do fim da guerra",
};

function bound(op: Condition["op"], value: number, one: string, many: string, none = "nenhum") {
  if (op === "max" && value === 0) return none;
  return `${op === "min" ? "pelo menos" : "no máximo"} ${plural(value, one, many)}`;
}

export function describeActual(stat: GoalStat, actual: number, game: GameSlug) {
  switch (stat) {
    case "parts":
      return `a máquina usou ${plural(actual, "peça", "peças")}`;
    case "untouched":
      return actual === 1 ? "a bolinha não passou por 1 peça" : `a bolinha não passou por ${actual} peças`;
    case "steps":
      return `a bolinha levou ${machineSeconds(actual)}`;
    case "won":
      return LOST[game] ?? "a partida não terminou";
    case "score":
      return `você fez ${plural(actual, "ponto", "pontos")}`;
    case "bestStreak":
      return `sua melhor sequência foi de ${plural(actual, "acerto", "acertos")}`;
    case "hitsTaken":
      return `você levou ${plural(actual, "pudim", "pudins")}`;
    case "lunchLadyHits":
      return actual === 1 ? "a tia levou 1 lanche" : `a tia levou ${actual} lanches`;
    case "interrupts":
      return `você acertou ${plural(actual, "vez", "vezes")} na hora H`;
    case "launches":
      return `você usou ${plural(actual, "lançamento", "lançamentos")}`;
    case "combos":
      return actual === 0 ? "nenhum lançamento derrubou dois alvos de uma vez" : `você derrubou dois alvos de uma vez ${plural(actual, "vez", "vezes")}`;
    case "mess":
      return actual === 1 ? "só 1 coisa do quintal saiu do lugar" : `só ${actual} coisas do quintal saíram do lugar`;
    case "bumps":
      return `o Bruno levou ${plural(actual, "batida", "batidas")}`;
    case "resumed":
      return "a partida continuou do sino, e a missão vale só para a fase inteira";
    case "stickersLeft":
      return actual === 1 ? "faltou 1 figurinha" : `faltaram ${actual} figurinhas`;
    case "monitorsLeft":
      return actual === 1 ? "faltou derrubar 1 monitor" : `faltou derrubar ${actual} monitores`;
    case "damageTaken":
      return actual === 1 ? "você levou 1 travesseirada" : `você levou ${actual} travesseiradas`;
    case "kos":
      return actual === 0 ? "você não nocauteou ninguém" : `você nocauteou ${plural(actual, "criança", "crianças")}`;
    case "hp":
      return `você terminou com ${plural(actual, "ponto", "pontos")} de energia`;
    case "kid":
      return `você jogou com ${kidName(actual)}`;
  }
}

export function describeTarget({ stat, op, value }: Condition): string | null {
  switch (stat) {
    case "parts":
      return `a missão pede ${bound(op, value, "peça", "peças", "nenhuma")}`;
    case "untouched":
      return value === 0 ? "a missão pede que ela passe por todas" : null;
    case "steps":
      return op === "max" ? `a missão pede até ${machineSeconds(value)}` : null;
    case "score":
      return `a missão pede ${bound(op, value, "ponto", "pontos")}`;
    case "bestStreak":
      return op === "min" ? `a missão pede ${plural(value, "acerto seguido", "acertos seguidos")}` : null;
    case "hitsTaken":
      return op === "max" && value === 0 ? "na missão não pode levar nenhum" : `a missão aceita ${bound(op, value, "pudim", "pudins")}`;
    case "lunchLadyHits":
      return op === "max" && value === 0 ? "na missão a tia não pode levar nenhum" : null;
    case "interrupts":
      return op === "min" ? `a missão pede ${plural(value, "vez", "vezes")}` : null;
    case "launches":
      return `a missão pede ${bound(op, value, "lançamento", "lançamentos")}`;
    case "combos":
      return op === "min" && value > 1 ? `a missão pede ${plural(value, "vez", "vezes")}` : null;
    case "mess":
      return op === "min" ? `a missão pede ${value}` : null;
    case "bumps":
      return `a missão aceita ${bound(op, value, "batida", "batidas", "nenhuma")}`;
    case "damageTaken":
      return `a missão aceita ${bound(op, value, "travesseirada", "travesseiradas", "nenhuma")}`;
    case "kos":
      return op === "min" ? `a missão pede ${plural(value, "nocaute", "nocautes")}` : null;
    case "hp":
      return op === "min" ? `a missão pede ${plural(value, "ponto", "pontos")}` : null;
    case "kid":
      return `a missão pede ${kidName(value)}`;
    default:
      return null;
  }
}

function sentence(text: string) {
  return `${text[0].toUpperCase()}${text.slice(1)}.`;
}

export function describeShortfall(check: Extract<GoalCheck, { passed: false }>, game: GameSlug) {
  if (check.actual === null) return "Essa partida não mostrou o que a missão pede.";
  const actual = describeActual(check.condition.stat, check.actual, game);
  const target = check.condition.stat === "won" || (check.condition.stat === "combos" && check.actual === 0) ? null : describeTarget(check.condition);
  return sentence(target ? `${actual}, e ${target}` : actual);
}

export function missionOverridesStars(mission: { game: GameSlug; goal: readonly Condition[] }) {
  return mission.game === "bad-ideas-lab" && mission.goal.some((c) => c.stat === "parts" && c.op === "min");
}

export function missionNotes(mission: { game: GameSlug; goal: readonly Condition[]; setup?: { character?: string } }) {
  const notes: string[] = [];
  if (missionOverridesStars(mission)) {
    notes.push("Para cumprir, a máquina vai usar mais peças do que as 3 estrelas permitem. Tudo bem: a missão conta à parte das estrelas.");
  }
  if (mission.game === "operation-recess") notes.push("Na missão, toda tentativa começa do início da fase: os sinos tocam, mas não salvam.");
  const kid = mission.setup?.character;
  if (mission.game === "pajama-war" && kid) {
    const index = KIDS.indexOf(kid as KidId);
    if (index >= 0) notes.push(`Nesta missão você joga com ${kidName(index)}. Sua criança favorita continua a mesma.`);
  }
  return notes;
}
