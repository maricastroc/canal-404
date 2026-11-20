import type { Course, Section } from "./course";
import { finishSurface, heightAt, obstacle, PathBuilder, type Lip, type Obstacle, type Ramp, type Sign } from "./track";

export const BAG_SWING = { period: 300, amp: 420, phase: 40 };
export const LOOP_R = 200;
export const BAG_SHIFTS = [0, 97];
const SEWER_DEPTH = 250;

export function bagPhase(shift: number) {
  return BAG_SWING.phase + shift;
}

function bagWindow(shift: number) {
  const half = BAG_SWING.period / 2;
  const on = Math.round(BAG_SWING.period * 0.1);
  return { period: half, on, phase: bagPhase(shift) + Math.round(on / 2) };
}

export function buildAntena(): Course {
  const b = new PathBuilder(-2400, 0, 0);
  const lips: Lip[] = [];
  const obstacles: Obstacle[] = [];
  const signs: Sign[] = [];
  const sections: Section[] = [];
  const ramps: Ramp[] = [];
  const cobbles: { x0: number; x1: number; stairs?: boolean }[] = [];
  const seesaws: { x0: number; pivot: number; x1: number }[] = [];
  const landings: number[] = [];
  const lip = () => lips.push({ surface: 0, x: b.x });
  const section = (key: string) => sections.push({ key, x: b.x });
  const crests = (count: number, base: number, amp: number) => {
    for (let i = 0; i < count; i += 1) {
      b.line(i === 0 ? 400 : 650);
      b.curve(650, base * 650 + amp, base);
      b.curve(650, base * 650 - amp, base);
      lip();
    }
  };
  const seesaw = () => {
    const x0 = b.x;
    const base = b.slope;
    b.ease(60, -0.3).line(220);
    const pivot = b.x;
    lips.push({ surface: 0, x: pivot });
    b.kink(0.42).line(250).ease(80, base);
    seesaws.push({ x0, pivot, x1: b.x });
  };

  b.line(2400);
  section("start");
  b.line(500);

  section("descent");
  b.ease(600, 0.3).line(3400).ease(800, 0.1);
  crests(3, 0.1, 95);
  b.ease(600, 0.22).line(2600).ease(700, 0.06);

  section("works");
  const w0 = b.x;
  signs.push({ x: w0 + 120, key: "works" });
  b.line(700);
  seesaw();
  b.line(1100);
  seesaw();
  b.line(900);
  signs.push({ x: b.x, key: "bag" });
  b.line(800);
  const bagX = b.x;
  obstacles.push(obstacle(bagX, "bag", { window: bagWindow(BAG_SHIFTS[0]) }));
  b.line(900);
  obstacles.push(obstacle(b.x, "cone"), obstacle(b.x + 140, "cone"));
  b.line(2300);
  signs.push({ x: b.x - 700, key: "jump" });
  obstacles.push(obstacle(b.x, "barrier"));
  b.line(1100);
  const bag2 = b.x;
  obstacles.push(obstacle(bag2, "bag", { window: bagWindow(BAG_SHIFTS[1]) }));
  b.line(1300);
  const w1 = b.x;

  section("loop");
  signs.push({ x: b.x + 100, key: "loop" });
  b.ease(500, 0.38).line(2200).ease(600, 0.02);
  const loopX = b.x;
  b.line(200).ease(500, 0.14).line(1400).ease(600, 0.05);

  section("manhole");
  b.line(500);
  const holeX = b.x;
  b.line(700);
  obstacles.push(obstacle(b.x, "pothole"));
  b.line(1200);
  obstacles.push(obstacle(b.x, "bin"), obstacle(b.x + 140, "bin"));
  b.line(2200);
  signs.push({ x: b.x - 700, key: "jump" });
  obstacles.push(obstacle(b.x, "barrier"));
  b.line(900);
  obstacles.push(obstacle(b.x, "cone"), obstacle(b.x + 140, "cone"));
  b.line(500);
  const exitX = b.x;
  b.ease(600, 0.18).line(2200).ease(700, 0.06);
  crests(3, 0.06, 90);
  b.line(900);
  obstacles.push(obstacle(b.x, "pothole"));
  b.line(1200);
  obstacles.push(obstacle(b.x, "cone"), obstacle(b.x + 140, "cone"));
  b.line(900);

  section("final");
  signs.push({ x: b.x - 500, key: "stairs" });
  const stairs: { x0: number; x1: number }[] = [];
  for (let k = 0; k < 3; k += 1) {
    b.ease(500, 0.46);
    const s0 = b.x;
    b.line(k === 2 ? 1000 : 1300);
    stairs.push({ x0: s0 - 120, x1: b.x });
    cobbles.push({ x0: s0 - 120, x1: b.x, stairs: true });
    if (k < 2) {
      b.ease(220, 0.04).line(320);
      landings.push(b.x);
      lip();
    }
  }
  b.ease(700, 0.03);
  const p0 = b.x;
  section("plaza");
  b.line(2400);
  const finish = b.x + 500;
  signs.push({ x: finish - 900, key: "finish" });
  b.line(3200);

  const road = b.build("road");

  const sx0 = holeX - 120;
  const sy0 = heightAt(road, sx0) + SEWER_DEPTH;
  const sewer = new PathBuilder(sx0, sy0, 0.24);
  const lipX = exitX - 40;
  sewer.line(lipX - sx0);
  const sewerSurface = finishSurface("sewer", sewer.xs, sewer.ys);
  lips.push({ surface: 1, x: sewerSurface.x1 });

  obstacles.sort((p, q) => p.x - q.x);
  lips.sort((p, q) => p.x - q.x);
  signs.sort((p, q) => p.x - q.x);
  return {
    id: "antena",
    surfaces: [road, sewerSurface],
    lips,
    obstacles,
    ramps,
    cobbles,
    loops: [{ x: loopX, r: LOOP_R }],
    manholes: [{ x: holeX, w: 120, surface: 1 }],
    signs,
    sections,
    zones: [{ key: "antena", x0: road.x0, x1: road.x1 }],
    chalk: [],
    set: {
      kind: "antena",
      works: { x0: w0, x1: w1 },
      seesaws,
      bags: [bagX, bag2],
      loop: loopX,
      hole: holeX,
      exit: lipX,
      stairs,
      landings,
      plaza: { x0: p0, x1: road.x1 },
    },
    start: 200,
    finish,
    grid: { lina: 540, bruno: -140 },
  };
}
