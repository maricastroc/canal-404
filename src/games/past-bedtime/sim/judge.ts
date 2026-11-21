import { LEVELS } from "./levels";
import { createSim, step } from "./sim";
import type { Action } from "./types";

export const MOVES_MAX = 400;
export const MOVES_PATTERN = /^[urdlw]+$/;

const LETTERS = ["u", "r", "d", "l"] as const;

export type NightTally = { turns: number; wakes: number; creaks: number; covered: number; par: number };

export type NightReplay = { ok: true; tally: NightTally } | { ok: false; problem: "bad_moves" | "unfinished" };

export function encodeMoves(actions: readonly Action[]) {
  return actions.map((a) => (a === "wait" ? "w" : LETTERS[a])).join("");
}

export function decodeMoves(text: string): Action[] | null {
  if (text.length > MOVES_MAX || !MOVES_PATTERN.test(text)) return null;
  return [...text].map((c) => (c === "w" ? "wait" : (LETTERS.indexOf(c as (typeof LETTERS)[number]) as Action)));
}

export function isNightLevel(id: string | null): id is string {
  return id !== null && LEVELS.some((l) => l.id === id);
}

export function replayNight(levelId: string, moves: string): NightReplay {
  const level = LEVELS.find((l) => l.id === levelId);
  const actions = decodeMoves(moves);
  if (!level || !actions) return { ok: false, problem: "bad_moves" };
  const sim = createSim(level);
  let state = sim.initial;
  for (const action of actions) {
    if (state.status !== "playing") return { ok: false, problem: "unfinished" };
    const next = step(sim, state, action);
    if (!next) return { ok: false, problem: "bad_moves" };
    state = next.state;
  }
  if (state.status !== "won") return { ok: false, problem: "unfinished" };
  return { ok: true, tally: { turns: state.turn, wakes: state.wakes, creaks: state.creaks - state.masked, covered: state.masked, par: level.par } };
}
