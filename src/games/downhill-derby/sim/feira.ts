import type { Course, Section } from "./course";
import { finishSurface, heightAt, obstacle, PathBuilder, type Lip, type Obstacle, type Ramp, type Sign, type Surface } from "./track";

export const AWNING = { count: 9, length: 540, period: 1180, lift: 300, tilt: 0.1 };

export function buildFeira(): Course {
  const b = new PathBuilder(-2400, 0, 0);
  const lips: Lip[] = [];
  const obstacles: Obstacle[] = [];
  const signs: Sign[] = [];
  const sections: Section[] = [];
  const ramps: Ramp[] = [];
  const cobbles: { x0: number; x1: number; stairs?: boolean }[] = [];
  const fruit: { x0: number; x1: number; crate: number }[] = [];
  const lip = () => lips.push({ surface: 0, x: b.x });
  const ramp = (dx: number, height: number, lipSlope: number) => {
    const r = b.ramp(dx, height, lipSlope);
    ramps.push(r);
    lips.push({ surface: 0, x: r.x1 });
    return r;
  };
  const section = (key: string) => sections.push({ key, x: b.x });
  const rolling = (x0: number, length: number, items: [kind: "melon" | "orange", period: number, phase: number][]) => {
    fruit.push({ x0, x1: x0 + length, crate: x0 - 120 });
    for (const [kind, period, phase] of items) obstacles.push(obstacle(x0, kind, { roll: { length, period, phase } }));
  };

  b.line(2400);
  section("start");
  b.line(500);

  section("descent");
  b.ease(700, 0.24).line(3200).ease(800, 0.07);
  for (let i = 0; i < 3; i += 1) {
    b.line(i === 0 ? 400 : 600);
    b.curve(650, 0.07 * 650 + 85, 0.07);
    b.curve(650, 0.07 * 650 - 85, 0.07);
    lip();
  }
  b.ease(500, 0.17);

  section("fruit");
  signs.push({ x: b.x + 150, key: "fruit" });
  const f1 = b.x + 700;
  b.line(4400);
  rolling(f1, 3500, [
    ["melon", 300, 0],
    ["orange", 210, 90],
    ["melon", 300, 170],
  ]);
  b.ease(700, 0.05);

  section("market");
  const m0 = b.x;
  signs.push({ x: m0 + 150, key: "awnings" });
  b.line(700);
  const crateRamp = ramp(280, 120, -0.55);
  const a0 = crateRamp.x1 + 620;
  const slot = (k: number) => a0 + k * AWNING.period;
  const trolleyX = slot(4) + 260;
  b.line(trolleyX - b.x);
  const trolley = ramp(220, 105, -0.6);
  b.line(slot(AWNING.count - 1) + AWNING.length + 500 - b.x);
  const m1 = b.x;
  b.ease(700, 0.2);
  const exitLanding = b.x + 900;
  b.line(2600).ease(700, 0.08);

  section("descent2");
  signs.push({ x: b.x + 100, key: "fruit" });
  b.ease(400, 0.2);
  const f2 = b.x + 500;
  b.line(4000);
  rolling(f2, 3300, [
    ["orange", 170, 0],
    ["melon", 260, 60],
    ["orange", 170, 85],
    ["melon", 260, 190],
  ]);
  b.ease(600, 0.06);
  for (let i = 0; i < 2; i += 1) {
    b.line(i === 0 ? 500 : 700);
    b.curve(650, 0.06 * 650 + 90, 0.06);
    b.curve(650, 0.06 * 650 - 90, 0.06);
    lip();
  }
  b.line(700);
  const pile = b.x;
  obstacles.push(obstacle(pile, "crate"), obstacle(pile + 140, "crate"));
  b.line(1500);

  section("stairs");
  signs.push({ x: b.x - 600, key: "stairs" });
  b.ease(300, 0.03);
  const stairTop = b.x;
  lips.push({ surface: 0, x: stairTop });
  b.ease(700, 0.5);
  const railFrom = b.x;
  b.line(1800);
  const stairBottom = b.x;
  cobbles.push({ x0: stairTop + 420, x1: stairBottom, stairs: true });
  b.ease(700, 0.04);

  section("plaza");
  const p0 = b.x;
  b.line(2600);
  const flock = { x0: p0 + 80, x1: p0 + 640 };
  const finish = b.x + 600;
  signs.push({ x: finish - 900, key: "finish" });
  b.line(3200);

  const road = b.build("road");

  const awnings: Surface[] = [];
  const awningX: number[] = [];
  for (let i = 0; i < AWNING.count; i += 1) {
    const x0 = slot(i);
    const x1 = x0 + AWNING.length;
    const y0 = heightAt(road, x0);
    const y1 = heightAt(road, x1);
    const xs: number[] = [];
    const ys: number[] = [];
    for (let x = x0; x <= x1 + 0.5; x += 30) {
      xs.push(x);
      ys.push(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0) - AWNING.lift + (x - x0) * AWNING.tilt);
    }
    awnings.push(finishSurface("awning", xs, ys));
    awningX.push(x0);
  }

  const stands = [slot(1) + 760, slot(5) + 820];
  obstacles.push(obstacle(slot(0) + 860, "crate"), obstacle(stands[0], "stand"), obstacle(slot(2) + 900, "crate"), obstacle(slot(3) + 780, "crate"), obstacle(slot(3) + 920, "crate"));
  obstacles.push(obstacle(stands[1], "stand"), obstacle(slot(7) + 760, "crate"));

  const railStart = railFrom;
  const railEnd = stairBottom - 120;
  const rail = new PathBuilder(railStart, heightAt(road, railStart) - 100, 0.5);
  rail.line(railEnd - railStart - 170);
  rail.curve(170, 0.5 * 170 - 34, -0.25);
  const railSurface = finishSurface("rail", rail.xs, rail.ys);
  const railIndex = 1 + awnings.length;
  lips.push({ surface: railIndex, x: railSurface.x1 });
  signs.push({ x: stairTop - 250, key: "rail" });
  signs.push({ x: trolleyX - 700, key: "trolley" });
  signs.push({ x: flock.x0 - 500, key: "pigeons" });

  obstacles.sort((p, q) => p.x - q.x);
  lips.sort((p, q) => p.x - q.x);
  signs.sort((p, q) => p.x - q.x);
  return {
    id: "feira",
    surfaces: [road, ...awnings, railSurface],
    puddles: [
      { x0: slot(2) + 80, x1: slot(2) + 480, surface: 0 },
      { x0: m1 + 1500, x1: m1 + 1950, surface: 0 },
      { x0: p0 + 900, x1: p0 + 1300, surface: 0 },
    ],
    lips,
    obstacles,
    ramps,
    cobbles,
    flocks: [flock],
    awningExit: exitLanding,
    signs,
    sections,
    zones: [{ key: "feira", x0: road.x0, x1: road.x1 }],
    chalk: [],
    set: {
      kind: "feira",
      fruit,
      market: { x0: m0, x1: m1 },
      crateRamp,
      awnings: awningX,
      trolley,
      stands,
      stairs: { x0: stairTop, x1: stairBottom },
      rail: railIndex,
      plaza: { x0: p0, x1: road.x1 },
      flock,
      cidinha: slot(1) + AWNING.length + 330,
    },
    start: 200,
    finish,
    grid: { lina: 540, bruno: -140, mila: -480 },
  };
}
