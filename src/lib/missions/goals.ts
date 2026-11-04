export type GoalStat = "parts" | "untouched" | "steps" | "won" | "score" | "bestStreak" | "hitsTaken" | "lunchLadyHits" | "interrupts";

export type Condition = { stat: GoalStat; op: "min" | "max"; value: number };

export type Evidence = Partial<Record<GoalStat, number>>;

export type GoalCheck = { passed: true } | { passed: false; condition: Condition; actual: number | null };

export const GOAL_STATS: readonly GoalStat[] = ["parts", "untouched", "steps", "won", "score", "bestStreak", "hitsTaken", "lunchLadyHits", "interrupts"];

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

export function describeActual(stat: GoalStat, actual: number) {
  switch (stat) {
    case "parts":
      return `a máquina usou ${plural(actual, "peça", "peças")}`;
    case "untouched":
      return actual === 1 ? "a bolinha não passou por 1 peça" : `a bolinha não passou por ${actual} peças`;
    case "steps":
      return `a bolinha levou ${machineSeconds(actual)}`;
    case "won":
      return "os guardanapos acabaram antes do sinal";
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
  }
}

export function describeShortfall(check: Extract<GoalCheck, { passed: false }>) {
  if (check.actual === null) return "Essa partida não mostrou o que a missão pede.";
  const text = describeActual(check.condition.stat, check.actual);
  return `${text[0].toUpperCase()}${text.slice(1)}.`;
}
