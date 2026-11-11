import { KID_INFO, KIDS, type KidId } from "@/games/pajama-war/config";
import type { GameSlug } from "@/lib/competition/boards";

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

export function machineSeconds(steps: number) {
  return `${(steps / 60).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`;
}

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
      return actual === 0 ? "nenhum lançamento derrubou dois alvos de uma vez" : `você fez ${plural(actual, "combo", "combos")}`;
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

export function describeShortfall(check: Extract<GoalCheck, { passed: false }>, game: GameSlug) {
  if (check.actual === null) return "Essa partida não mostrou o que a missão pede.";
  const text = describeActual(check.condition.stat, check.actual, game);
  return `${text[0].toUpperCase()}${text.slice(1)}.`;
}
