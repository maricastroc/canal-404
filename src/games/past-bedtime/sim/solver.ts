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

export type Audit = { reachable: number; doomed: number; stuck: number; longestTrap: number; campTiles: number; floorTiles: number };

const FOREVER = 99;

export function audit(sim: Sim, maxStates = 400_000, campTurns = 72): Audit {
  const states: State[] = [sim.initial];
  const index = new Map<string, number>([[stateKey(sim, sim.initial), 0]]);
  const edges: number[][] = [[]];
  for (let i = 0; i < states.length && states.length < maxStates; i += 1) {
    for (const action of ACTIONS) {
      const next = step(sim, states[i], action);
      if (!next || next.state.status === "caught") continue;
      if (next.state.status === "won") {
        edges[i].push(-1);
        continue;
      }
      const key = stateKey(sim, next.state);
      let j = index.get(key);
      if (j === undefined) {
        j = states.length;
        index.set(key, j);
        states.push(next.state);
        edges.push([]);
      }
      edges[i].push(j);
    }
  }
  const alive = new Array<boolean>(states.length).fill(false);
  for (let changed = true; changed; ) {
    changed = false;
    for (let i = 0; i < states.length; i += 1) {
      if (!alive[i] && edges[i].some((j) => j === -1 || (j >= 0 && alive[j]))) {
        alive[i] = true;
        changed = true;
      }
    }
  }
  const horizon = new Array<number>(states.length).fill(0);
  for (let round = 0; round <= FOREVER; round += 1) {
    for (let i = 0; i < states.length; i += 1) {
      if (alive[i]) continue;
      let h = 0;
      for (const j of edges[i]) if (j >= 0) h = Math.max(h, 1 + horizon[j]);
      horizon[i] = Math.min(h, FOREVER);
    }
  }
  let longestTrap = 0;
  let stuck = 0;
  for (let i = 0; i < states.length; i += 1) {
    if (alive[i]) continue;
    if (horizon[i] >= FOREVER) stuck += 1;
    else longestTrap = Math.max(longestTrap, horizon[i]);
  }
  const camp = new Set<number>();
  const floor = new Set<number>();
  const w = sim.grid.w;
  for (let i = 0; i < states.length; i += 1) {
    if (!alive[i]) continue;
    const tile = states[i].y * w + states[i].x;
    floor.add(tile);
    if (camp.has(tile)) continue;
    let st = states[i];
    let safe = true;
    for (let k = 0; k < campTurns && safe; k += 1) {
      const next = step(sim, st, "wait");
      if (!next || next.state.status !== "playing") safe = false;
      else st = next.state;
    }
    const j = safe ? index.get(stateKey(sim, st)) : undefined;
    if (j !== undefined && alive[j]) camp.add(tile);
  }
  return { reachable: states.length, doomed: alive.filter((a) => !a).length, stuck, longestTrap, campTiles: camp.size, floorTiles: floor.size };
}
