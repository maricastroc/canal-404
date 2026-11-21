import { buildGrid, coneTiles, dirTo, firstStep, isCreaky, isFloor, noiseDistances, type Grid } from "./grid";
import { DX, DY, type Action, type AgentState, type CatchReason, type Dir, type DogState, type LevelDef, type PatrolDef, type SimEvent, type State } from "./types";

export const STAR_SLACK = 3;

export type Sim = { grid: Grid; initial: State };

function patrolFacing(def: PatrolDef, idx: number, fallback: Dir): Dir {
  const cur = def.path[idx];
  if (cur.f !== undefined) return cur.f;
  const next = def.path[(idx + 1) % def.path.length];
  return dirTo(cur.x, cur.y, next.x, next.y, fallback);
}

export function createSim(level: LevelDef): Sim {
  const grid = buildGrid(level);
  const agents: AgentState[] = level.agents.map((def) => {
    if (def.kind === "sleeper") return { kind: "sleeper", awake: 0, facing: 2 };
    if (def.kind === "patrol") {
      const p = def.path[def.start];
      return { kind: "patrol", idx: def.start, x: p.x, y: p.y, facing: patrolFacing(def, def.start, 2), alert: 0 };
    }
    return { kind: "dog", x: def.x, y: def.y, mode: "sleep", tx: def.x, ty: def.y, timer: 0, facing: 2 };
  });
  const initial: State = { turn: 0, x: grid.start.x, y: grid.start.y, facing: 1, agents, status: "playing", caughtBy: -1, reason: null, creaks: 0, masked: 0, wakes: 0 };
  return { grid, initial };
}

export function agentPos(grid: Grid, index: number, agent: AgentState) {
  if (agent.kind === "sleeper") {
    const def = grid.level.agents[index];
    return def.kind === "sleeper" ? { x: def.x, y: def.y } : { x: 0, y: 0 };
  }
  return { x: agent.x, y: agent.y };
}

function occupied(grid: Grid, agents: readonly AgentState[], x: number, y: number, skip = -1) {
  for (let i = 0; i < agents.length; i += 1) {
    if (i === skip) continue;
    const p = agentPos(grid, i, agents[i]);
    if (p.x === x && p.y === y) return true;
  }
  return false;
}

export function isCuckooTurn(grid: Grid, turn: number) {
  const clock = grid.level.clock;
  return !!clock && turn > 0 && turn % clock.period === 0;
}

export function turnsToCuckoo(grid: Grid, turn: number) {
  const clock = grid.level.clock;
  if (!clock) return -1;
  for (let k = 1; k <= clock.period; k += 1) if ((turn + k) % clock.period === 0) return k;
  return clock.period;
}

export function watchedTiles(grid: Grid, agents: readonly AgentState[], index: number): number[] {
  const agent = agents[index];
  const def = grid.level.agents[index];
  if (agent.kind === "sleeper" && def.kind === "sleeper") return agent.awake > 0 ? coneTiles(grid, def.x, def.y, agent.facing, def.range, def.cone === "wide") : [];
  if (agent.kind === "patrol" && def.kind === "patrol") return coneTiles(grid, agent.x, agent.y, agent.facing, def.range, def.cone === "wide");
  return [];
}

function detect(grid: Grid, agents: readonly AgentState[], x: number, y: number, lightReason: CatchReason): { agent: number; reason: CatchReason } | null {
  const idx = y * grid.w + x;
  for (let i = 0; i < agents.length; i += 1) {
    const a = agents[i];
    if (a.kind === "dog") {
      if (a.mode !== "sleep" && Math.abs(a.x - x) + Math.abs(a.y - y) === 1) return { agent: i, reason: "dog" };
      continue;
    }
    if (watchedTiles(grid, agents, i).includes(idx)) return { agent: i, reason: lightReason };
  }
  return null;
}

export function canMove(sim: Sim, state: State, dir: Dir) {
  if (state.status !== "playing") return false;
  const nx = state.x + DX[dir];
  const ny = state.y + DY[dir];
  return isFloor(sim.grid, nx, ny) && !occupied(sim.grid, state.agents, nx, ny);
}

export function step(sim: Sim, state: State, action: Action): { state: State; events: SimEvent[] } | null {
  if (state.status !== "playing") return null;
  const grid = sim.grid;
  const level = grid.level;
  const events: SimEvent[] = [];
  let x = state.x;
  let y = state.y;
  let facing = state.facing;
  if (action === "wait") {
    events.push({ type: "wait" });
  } else {
    if (!canMove(sim, state, action)) return null;
    x += DX[action];
    y += DY[action];
    facing = action;
    events.push({ type: "move", from: { x: state.x, y: state.y }, to: { x, y }, dir: action });
  }
  const turn = state.turn + 1;
  const cuckoo = isCuckooTurn(grid, turn);
  if (cuckoo) events.push({ type: "cuckoo" });
  let creaks = state.creaks;
  let masked = state.masked;
  let wakes = state.wakes;
  let noise = false;
  if (action !== "wait" && isCreaky(grid, x, y)) {
    creaks += 1;
    if (cuckoo) masked += 1;
    else noise = true;
    events.push({ type: "creak", x, y, masked: cuckoo });
  }
  const base = { turn, x, y, facing, creaks, masked, wakes };
  const walked = detect(grid, state.agents, x, y, "walked");
  if (walked) {
    events.push({ type: "caught", agent: walked.agent, reason: walked.reason });
    return { state: { ...base, agents: state.agents, status: "caught", caughtBy: walked.agent, reason: walked.reason }, events };
  }
  const agents: AgentState[] = state.agents.map((a) => ({ ...a }));
  const heard = agents.map(() => false);
  if (noise) {
    let maxHear = 0;
    for (const def of level.agents) maxHear = Math.max(maxHear, def.hear);
    const dist = noiseDistances(grid, x, y, level.loud + maxHear);
    agents.forEach((a, i) => {
      const def = level.agents[i];
      const p = agentPos(grid, i, a);
      const d = dist.get(p.y * grid.w + p.x);
      if (d === undefined || d > level.loud + def.hear) return;
      heard[i] = true;
      events.push({ type: "heard", agent: i, x, y });
      if (a.kind === "sleeper") {
        if (a.awake === 0) wakes += 1;
        a.awake = def.kind === "sleeper" ? def.wake : 1;
        a.facing = dirTo(p.x, p.y, x, y, a.facing);
        events.push({ type: "wake", agent: i, facing: a.facing });
      } else if (a.kind === "patrol") {
        a.alert = def.kind === "patrol" ? def.alert : 1;
        a.facing = dirTo(p.x, p.y, x, y, a.facing);
        events.push({ type: "alert", agent: i, facing: a.facing });
      } else {
        if (a.mode === "sleep") wakes += 1;
        a.mode = "go";
        a.tx = x;
        a.ty = y;
        a.timer = 0;
      }
    });
  }
  agents.forEach((a, i) => {
    const def = level.agents[i];
    if (a.kind === "sleeper") {
      if (!heard[i] && a.awake > 0) {
        a.awake -= 1;
        if (a.awake === 0) events.push({ type: "sleep", agent: i });
      }
      return;
    }
    if (a.kind === "patrol" && def.kind === "patrol") {
      if (heard[i]) return;
      if (a.alert > 0) {
        a.alert -= 1;
        if (a.alert === 0) events.push({ type: "resume", agent: i });
        return;
      }
      const next = (a.idx + 1) % def.path.length;
      const target = def.path[next];
      if (target.x === x && target.y === y) return;
      const from = { x: a.x, y: a.y };
      a.idx = next;
      a.x = target.x;
      a.y = target.y;
      a.facing = patrolFacing(def, next, a.facing);
      if (from.x === a.x && from.y === a.y) events.push({ type: "turnAround", agent: i, facing: a.facing });
      else events.push({ type: "agentMove", agent: i, from, to: { x: a.x, y: a.y }, facing: a.facing });
      return;
    }
    if (a.kind === "dog" && def.kind === "dog") moveDog(sim, agents, i, a, def.x, def.y, def.sniff, x, y, events);
  });
  const seen = detect(grid, agents, x, y, "light");
  if (seen) {
    events.push({ type: "caught", agent: seen.agent, reason: seen.reason });
    return { state: { ...base, wakes, agents, status: "caught", caughtBy: seen.agent, reason: seen.reason }, events };
  }
  const won = x === grid.goal.x && y === grid.goal.y;
  if (won) events.push({ type: "won" });
  return { state: { ...base, wakes, agents, status: won ? "won" : "playing", caughtBy: -1, reason: null }, events };
}

function moveDog(sim: Sim, agents: AgentState[], i: number, dog: DogState, homeX: number, homeY: number, sniff: number, bx: number, by: number, events: SimEvent[]) {
  const grid = sim.grid;
  if (dog.mode === "sleep") return;
  if (dog.mode === "sniff") {
    dog.timer -= 1;
    if (dog.timer <= 0) dog.mode = "back";
    return;
  }
  const target = dog.mode === "go" ? { x: dog.tx, y: dog.ty } : { x: homeX, y: homeY };
  const next = firstStep(grid, { x: dog.x, y: dog.y }, target, (tx, ty) => occupied(grid, agents, tx, ty, i));
  if (next && !(next.x === bx && next.y === by)) {
    const from = { x: dog.x, y: dog.y };
    dog.facing = dirTo(dog.x, dog.y, next.x, next.y, dog.facing);
    dog.x = next.x;
    dog.y = next.y;
    events.push({ type: "agentMove", agent: i, from, to: next, facing: dog.facing });
  }
  if (dog.x === target.x && dog.y === target.y) {
    if (dog.mode === "go") {
      dog.mode = "sniff";
      dog.timer = sniff;
      events.push({ type: "dogArrive", agent: i });
    } else {
      dog.mode = "sleep";
      dog.facing = 2;
      events.push({ type: "dogHome", agent: i });
    }
  }
}

export function stateKey(sim: Sim, s: State): string {
  const clock = sim.grid.level.clock;
  let key = `${s.x},${s.y},${clock ? s.turn % clock.period : 0}`;
  for (const a of s.agents) {
    if (a.kind === "sleeper") key += a.awake > 0 ? `|s${a.awake}${a.facing}` : "|s0";
    else if (a.kind === "patrol") key += `|p${a.idx},${a.facing},${a.alert}`;
    else key += `|d${a.x},${a.y},${a.mode[1]}${a.mode === "go" ? `${a.tx},${a.ty}` : ""}${a.mode === "sniff" ? a.timer : ""}`;
  }
  return key;
}

export function stars(par: number, turns: number) {
  if (turns <= par) return 3;
  if (turns <= par + STAR_SLACK) return 2;
  return 1;
}

export function replay(level: LevelDef, actions: readonly Action[]): State | null {
  const sim = createSim(level);
  let state = sim.initial;
  for (const a of actions) {
    const next = step(sim, state, a);
    if (!next) return null;
    state = next.state;
  }
  return state;
}
