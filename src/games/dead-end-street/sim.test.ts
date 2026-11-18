import { describe, expect, it } from "vitest";
import { replayStreet, StreetSim, type Launch } from "./sim";
import { THREE_STAR_WIN } from "./solutions";

function trace(launches: Launch[]) {
  const sim = new StreetSim();
  const samples: number[] = [];
  sim.start();
  let next = 0;
  while (sim.phase !== "over") {
    if (next < launches.length && sim.steps === launches[next].at) {
      sim.launch(launches[next].angle, launches[next].power);
      next += 1;
    }
    if (!sim.step()) break;
    for (const body of sim.engine.world.bodies) samples.push(body.position.x, body.position.y, body.angle);
  }
  sim.destroy();
  return samples;
}

describe("Rua Sem Saída simulation", () => {
  it("replays the known winning launches to the same score and step count", () => {
    expect(replayStreet(THREE_STAR_WIN)).toMatchObject({
      ok: true,
      steps: 836,
      tally: { won: true, score: 2250, stars: 3, stats: { targets: 5, targetPoints: 900, waves: 3, mess: 8, combos: 1, launches: 4, ammoLeft: 3 } },
    });
  });

  it("gives the same trajectory every time, whatever ran before", () => {
    const first = trace(THREE_STAR_WIN);
    replayStreet([{ at: 0, angle: 6000, power: 400 }]);
    const again = trace(THREE_STAR_WIN.map((l) => ({ ...l })));
    expect(again.length).toBe(first.length);
    expect(again.every((v, i) => Object.is(v, first[i]))).toBe(true);
  });
});
