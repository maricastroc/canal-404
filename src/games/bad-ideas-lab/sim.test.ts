import { describe, expect, it } from "vitest";
import type { PlacedPart } from "./geometry";
import { LEVELS, type LevelDef } from "./levels";
import { LabSim, simulateLab, type SimOutcome } from "./sim";
import { SOLUTIONS, GOLDEN_STEPS } from "./solutions";

type Trace = { outcome: SimOutcome; steps: number; samples: number[] };

function traced(level: LevelDef, parts: PlacedPart[]): Trace {
  const sim = new LabSim(level, parts);
  const samples: number[] = [];
  let outcome: SimOutcome | null = null;
  while (!outcome) {
    outcome = sim.step();
    samples.push(sim.x, sim.y, sim.angle);
  }
  sim.destroy();
  return { outcome, steps: sim.steps, samples };
}

function sameBits(a: Trace, b: Trace) {
  return a.outcome === b.outcome && a.steps === b.steps && a.samples.length === b.samples.length && a.samples.every((v, i) => Object.is(v, b.samples[i]));
}

describe("Laboratório simulation", () => {
  it("solves every level with the known machine in its golden number of steps", () => {
    for (const level of LEVELS) {
      expect(simulateLab(level, SOLUTIONS[level.id]), level.id).toMatchObject({ outcome: "success", steps: GOLDEN_STEPS[level.id] });
    }
  });

  it("gives the same trajectory every time, whatever ran before", () => {
    const pixel = LEVELS.find((l) => l.id === "pixel")!;
    const first = traced(pixel, SOLUTIONS.pixel);
    simulateLab(LEVELS.find((l) => l.id === "finale")!, SOLUTIONS.finale);
    const again = traced(pixel, SOLUTIONS.pixel.map((p) => ({ ...p })));
    expect(sameBits(first, again)).toBe(true);
  });
});
