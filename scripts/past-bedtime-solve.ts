import { LEVELS } from "../src/games/past-bedtime/sim/levels";
import { createSim, stateKey, step } from "../src/games/past-bedtime/sim/sim";
import { audit, solve } from "../src/games/past-bedtime/sim/solver";
import type { Action, LevelDef, State } from "../src/games/past-bedtime/sim/types";

const ARROWS = ["↑", "→", "↓", "←"];

const PREVIEW = 4;

const format = (actions: readonly Action[]) => actions.map((a) => (a === "wait" ? "·" : ARROWS[a])).join("");

type Proof = { label: string; holds: (level: LevelDef, turns: number, emptyTurns: number | null) => boolean };

const unsolvable = (level: LevelDef) => solve(createSim(level)) === null;

const onlyBoards = (level: LevelDef) =>
  level.map.flatMap((row, y) => [...row].flatMap((c, x) => (c === "~" ? [level.map.map((r, ry) => [...r].map((rc, rx) => (rc === "~" && (rx !== x || ry !== y) ? "." : rc)).join(""))] : [])));

const belowAquariumClosed = (level: LevelDef) => {
  const a = level.props.find((p) => p.kind === "aquarium")!;
  return level.map.map((row, y) => (y === a.y + 1 ? row.slice(0, a.x) + "o" + row.slice(a.x + 1) : row));
};

const withoutTable = (level: LevelDef) => {
  const t = level.props.find((p) => p.kind === "coffeeTable")!;
  return level.map.map((row, y) => [...row].map((c, x) => (x >= t.x && x < t.x + (t.w ?? 1) && y >= t.y && y < t.y + (t.h ?? 1) ? "." : c)).join(""));
};

const fastestWithCreaks = (level: LevelDef, cap: number) => {
  const sim = createSim(level);
  const queue: State[] = [sim.initial];
  const seen = new Set([stateKey(sim, sim.initial)]);
  for (let i = 0; i < queue.length && queue.length < 400_000; i += 1) {
    for (const action of ["wait", 0, 1, 2, 3] as Action[]) {
      const next = step(sim, queue[i], action);
      if (!next || next.state.status === "caught" || next.state.creaks > cap) continue;
      if (next.state.status === "won") return next.state.turn;
      const key = `${stateKey(sim, next.state)}|${next.state.creaks}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(next.state);
    }
  }
  return Infinity;
};

const withoutRollover = (level: LevelDef): LevelDef => ({ ...level, agents: level.agents.map((a) => (a.kind === "sleeper" ? { ...a, toss: undefined } : a)) });

const PROOFS: Record<string, Proof> = {
  doorway: { label: "unsolvable without the cuckoo", holds: (l) => unsolvable({ ...l, clock: undefined }) },
  hallway: { label: "unsolvable without the cuckoo", holds: (l) => unsolvable({ ...l, clock: undefined }) },
  kitchen: { label: "slower than an empty kitchen, so Grandma's round has to be waited out", holds: (_l, turns, empty) => empty !== null && turns > empty },
  stairs: {
    label: "slower than an empty hall, and unsolvable if her flashlight also lit her sides, so Bruno has to slip past her blind side",
    holds: (l, turns, empty) => empty !== null && turns > empty && unsolvable({ ...l, agents: l.agents.map((a) => (a.kind === "patrol" ? { ...a, cone: "wide" } : a)) }),
  },
  pantry: { label: "without the hiding spot the target is out of reach", holds: (l) => (solve(createSim({ ...l, map: l.map.map((row) => row.replace(/h/g, ".")) }))?.turns ?? Infinity) > l.par + 3 },
  laundry: { label: "unsolvable with only one of the two boards, so Pipoca has to be lured twice", holds: (l) => onlyBoards(l).length > 1 && onlyBoards(l).every((map) => unsolvable({ ...l, map })) },
  dining: { label: "unsolvable without Pixel knocking things over, or without the way around the aquarium, so Bruno has to dodge Pipoca as she runs in", holds: (l) => unsolvable({ ...l, agents: l.agents.filter((a) => a.kind !== "cat") }) && unsolvable({ ...l, map: belowAquariumClosed(l) }) },
  sofa: { label: "unsolvable without the plants, or without the coffee table's shadow", holds: (l) => unsolvable({ ...l, map: l.map.map((row) => row.replace(/h/g, ".")) }) && unsolvable({ ...l, map: withoutTable(l) }) },
  living: { label: "one lure is not enough, so Pipoca has to be called back, and Dad rolling over is what makes it hard", holds: (l) => fastestWithCreaks(l, 1) > l.par + 3 && (solve(createSim(withoutRollover(l)))?.turns ?? Infinity) < l.par },
  return: { label: "unsolvable without the cuckoo", holds: (l) => unsolvable({ ...l, clock: undefined }) },
};

let failed = false;

for (const level of LEVELS) {
  const sim = createSim(level);
  const started = performance.now();
  const solution = solve(sim);
  const ms = Math.round(performance.now() - started);
  if (!solution) {
    console.log(`✗ ${level.id}: no solution`);
    failed = true;
    continue;
  }
  let state = sim.initial;
  for (const action of solution.actions) state = step(sim, state, action)!.state;
  const waits = solution.actions.filter((a) => a === "wait").length;
  const parOk = solution.turns === level.par;
  if (!parOk) failed = true;
  console.log(`${parOk ? "✓" : "✗"} ${level.id}: ${solution.turns} moves (par in data: ${level.par}), ${solution.optimalCount} optimal plans, ${solution.explored} states, ${ms} ms`);
  console.log(`   ${format(solution.actions)}`);
  console.log(`   creaks ${state.creaks} (covered by the cuckoo ${state.masked}), wake-ups ${state.wakes}, waits ${waits}`);
  const empty = solve(createSim({ ...level, agents: [] }));
  if (empty) console.log(`   empty house: ${empty.turns} moves, so the residents cost ${solution.turns - empty.turns}`);
  const report = audit(sim);
  const fair = report.stuck === 0 && report.longestTrap <= PREVIEW;
  if (!fair) failed = true;
  console.log(`   ${fair ? "✓" : "✗"} fair: ${report.stuck} states that can never win, longest trap ${report.longestTrap} turns (preview shows ${PREVIEW}), waiting forever is safe on ${report.campTiles} of ${report.floorTiles} tiles`);
  const proof = PROOFS[level.id];
  if (proof) {
    const holds = proof.holds(level, solution.turns, empty?.turns ?? null);
    if (!holds) failed = true;
    console.log(`   ${holds ? "✓" : "✗"} needs its strategy: ${proof.label}`);
  }
}

process.exit(failed ? 1 : 0);
