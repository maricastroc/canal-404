import { stateKey, step, type Sim } from "./sim";
import type { Action, State } from "./types";

export const ACTIONS: readonly Action[] = [0, 1, 2, 3, "wait"];

export type Solution = { actions: Action[]; turns: number; optimalCount: number; explored: number };

export function solve(sim: Sim, from: State = sim.initial, maxStates = 400_000): Solution | null {
  if (from.status === "won") return { actions: [], turns: 0, optimalCount: 1, explored: 1 };
  if (from.status !== "playing") return null;
  const states: State[] = [from];
  const parent: number[] = [-1];
  const via: Action[] = ["wait"];
  const depth: number[] = [0];
  const count: number[] = [1];
  const seen = new Map<string, number>([[stateKey(sim, from), 0]]);
  let goal = -1;
  for (let i = 0; i < states.length; i += 1) {
    if (goal >= 0 && depth[i] >= depth[goal]) break;
    for (const action of ACTIONS) {
      const next = step(sim, states[i], action);
      if (!next || next.state.status === "caught") continue;
      const key = next.state.status === "won" ? "won" : stateKey(sim, next.state);
      const known = seen.get(key);
      if (known !== undefined) {
        if (depth[known] === depth[i] + 1) count[known] = Math.min(count[known] + count[i], 1_000_000);
        continue;
      }
      const idx = states.length;
      seen.set(key, idx);
      states.push(next.state);
      parent.push(i);
      via.push(action);
      depth.push(depth[i] + 1);
      count.push(count[i]);
      if (next.state.status === "won" && goal < 0) goal = idx;
    }
    if (states.length > maxStates) return null;
  }
  if (goal < 0) return null;
  const actions: Action[] = [];
  for (let cur = goal; parent[cur] >= 0; cur = parent[cur]) actions.push(via[cur]);
  actions.reverse();
  return { actions, turns: actions.length, optimalCount: count[goal], explored: states.length };
}
