import { describe, expect, it } from "vitest";
import { PHASES, type PhaseId } from "./phases";
import { replayStreet, StreetSim, type Launch } from "./sim";
import { SOLUTIONS } from "./solutions";

const GOLDEN: Record<PhaseId, { steps: number; score: number }> = {
  "warm-up": { steps: 143, score: 1450 },
  "sharp-aim": { steps: 241, score: 1925 },
  "up-high": { steps: 415, score: 1700 },
  domino: { steps: 266, score: 1575 },
  "surprise-bath": { steps: 363, score: 1775 },
  "blocked-path": { steps: 903, score: 1225 },
  counterattack: { steps: 386, score: 1550 },
  "free-for-all": { steps: 915, score: 1425 },
  "grand-mess": { steps: 411, score: 1775 },
};

function trace(level: PhaseId, launches: Launch[]) {
  const sim = new StreetSim(level);
  const samples: number[] = [];
  sim.start();
  let next = 0;
  while (sim.phase !== "over") {
    if (next < launches.length && sim.steps === launches[next].at) {
      sim.launch(launches[next].angle, launches[next].power, launches[next].ammo);
      next += 1;
    }
    if (!sim.step()) break;
    for (const body of sim.engine.world.bodies) samples.push(body.position.x, body.position.y, body.angle);
  }
  sim.destroy();
  return samples;
}

describe("Rua Sem Saída simulation", () => {
  it("replays every level's known solution to the same step count and score", () => {
    for (const phase of PHASES) {
      expect(replayStreet(phase.id, SOLUTIONS[phase.id]), phase.id).toMatchObject({ ok: true, steps: GOLDEN[phase.id].steps, tally: { won: true, stars: 3, score: GOLDEN[phase.id].score } });
    }
  });

  it("gives the same trajectory every time, whatever ran before", () => {
    const first = trace("grand-mess", SOLUTIONS["grand-mess"]);
    replayStreet("blocked-path", SOLUTIONS["blocked-path"]);
    const again = trace("grand-mess", SOLUTIONS["grand-mess"].map((l) => ({ ...l })));
    expect(again.length).toBe(first.length);
    expect(again.every((v, i) => Object.is(v, first[i]))).toBe(true);
  });
});
