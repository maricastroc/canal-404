import { LEVELS } from "../src/games/past-bedtime/sim/levels";
import { createSim, step } from "../src/games/past-bedtime/sim/sim";
import { solve } from "../src/games/past-bedtime/sim/solver";
import type { Action, LevelDef } from "../src/games/past-bedtime/sim/types";

const ARROWS = ["↑", "→", "↓", "←"];

const format = (actions: readonly Action[]) => actions.map((a) => (a === "wait" ? "·" : ARROWS[a])).join("");

type Proof = { label: string; holds: (level: LevelDef, turns: number, emptyTurns: number | null) => boolean };

const unsolvable = (level: LevelDef) => solve(createSim(level)) === null;

const PROOFS: Record<string, Proof> = {
  doorway: { label: "unsolvable without the cuckoo", holds: (l) => unsolvable({ ...l, clock: undefined }) },
  hallway: { label: "unsolvable without the cuckoo", holds: (l) => unsolvable({ ...l, clock: undefined }) },
  kitchen: { label: "slower than an empty kitchen, so Grandma's round has to be waited out", holds: (_l, turns, empty) => empty !== null && turns > empty },
  stairs: { label: "slower than an empty hall, so Grandma's back has to be waited for", holds: (_l, turns, empty) => empty !== null && turns > empty },
  pantry: { label: "without the hiding spot the target is out of reach", holds: (l) => (solve(createSim({ ...l, map: l.map.map((row) => row.replace(/h/g, ".")) }))?.turns ?? Infinity) > l.par + 3 },
  laundry: { label: "unsolvable without creaky boards to lure Pipoca", holds: (l) => unsolvable({ ...l, map: l.map.map((row) => row.replace(/~/g, ".")) }) },
  dining: { label: "unsolvable without Pixel knocking things over", holds: (l) => unsolvable({ ...l, agents: l.agents.filter((a) => a.kind !== "cat") }) },
  sofa: { label: "unsolvable without the hiding spots", holds: (l) => unsolvable({ ...l, map: l.map.map((row) => row.replace(/h/g, ".")) }) },
  living: { label: "unsolvable without creaky boards to lure Pipoca", holds: (l) => unsolvable({ ...l, map: l.map.map((row) => row.replace(/~/g, ".")) }) },
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
  const proof = PROOFS[level.id];
  if (proof) {
    const holds = proof.holds(level, solution.turns, empty?.turns ?? null);
    if (!holds) failed = true;
    console.log(`   ${holds ? "✓" : "✗"} needs its strategy: ${proof.label}`);
  }
}

process.exit(failed ? 1 : 0);
