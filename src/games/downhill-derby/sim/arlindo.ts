import type { Chalk, Course, Section } from "./course";
import { finishSurface, obstacle, PathBuilder, type Lip, type Obstacle, type Ramp, type Sign } from "./track";

export const HOSE_WINDOW = { period: 420, on: 150, phase: 0 };
export const TRUCK_WINDOW = { period: 600, on: 270, phase: 120 };

export function buildArlindo(): Course {
  const b = new PathBuilder(-2400, 0, 0);
  const lips: Lip[] = [];
  const obstacles: Obstacle[] = [];
  const signs: Sign[] = [];
  const sections: Section[] = [];
  const ramps: Ramp[] = [];
  const chalk: Chalk[] = [];
  const cobbles: { x0: number; x1: number }[] = [];
  const lip = () => lips.push({ surface: 0, x: b.x });
  const ramp = (dx: number, height: number, lipSlope: number) => {
    const r = b.ramp(dx, height, lipSlope);
    ramps.push(r);
    lips.push({ surface: 0, x: r.x1 });
    return r;
  };
  const section = (key: string) => sections.push({ key, x: b.x });

  b.line(2400);
  section("start");
  b.line(500);

  section("descent");
  signs.push({ x: b.x + 600, key: "crouch" });
  for (const d of [900, 2000, 3100]) chalk.push({ x: b.x + d, kind: "hold", surface: 0 });
  b.ease(700, 0.26).line(2600).ease(800, 0.07);

  section("crests");
  signs.push({ x: b.x + 150, key: "rollers" });
  for (let i = 0; i < 3; i += 1) {
    b.line(i === 0 ? 500 : 650);
    b.curve(700, 0.07 * 700 + 85, 0.07);
    b.curve(700, 0.07 * 700 - 85, 0.07);
    chalk.push({ x: b.x - 70, kind: "jump", surface: 0 });
    lip();
  }
  b.ease(600, 0.22).line(2200).ease(700, 0.1).line(600);

  section("obstacles");
  const o = b.x;
  signs.push({ x: o + 150, key: "cones" });
  obstacles.push(obstacle(o + 800, "cone"), obstacle(o + 940, "cone"));
  signs.push({ x: o + 1500, key: "pothole" });
  obstacles.push(obstacle(o + 2200, "pothole"));
  signs.push({ x: o + 2800, key: "bins" });
  obstacles.push(obstacle(o + 3500, "bin"), obstacle(o + 3640, "bin"));
  b.ease(400, 0.1).line(3900);

  section("arlindo");
  const a = b.x;
  signs.push({ x: a + 200, key: "hose" });
  const hose = a + 1000;
  obstacles.push(obstacle(hose, "hose", { window: HOSE_WINDOW }));
  b.ease(300, 0.06).line(1300);
  signs.push({ x: b.x - 500, key: "yard" });
  b.ease(250, 0);
  const plank = ramp(240, 92, -0.5);
  b.ease(250, 0.05);
  const cobbleStart = b.x + 150;
  b.line(3300);
  cobbles.push({ x0: cobbleStart, x1: b.x - 150 });
  obstacles.push(obstacle(cobbleStart + 1100, "pothole"), obstacle(cobbleStart + 2300, "pothole"));
  b.ease(500, 0.16).line(900);

  const yard = new PathBuilder(plank.x1 + 460, plank.lipY - 330, 0.1);
  yard.line(900);
  const wheelbarrow = yard.ramp(180, 60, -0.5);
  yard.ease(200, 0.1).line(1500);
  const yardSurface = finishSurface("yard", yard.xs, yard.ys);
  lips.push({ surface: 1, x: wheelbarrow.x1 }, { surface: 1, x: yardSurface.x1 });
  chalk.push({ x: yardSurface.x1 - 70, kind: "jump", surface: 1 });
  obstacles.push(obstacle(yardSurface.x0 + 520, "gnome", { surface: 1 }), obstacle(wheelbarrow.x1 + 760, "gnome", { surface: 1 }));
  const fence = yardSurface.x1 + 200;
  obstacles.push(obstacle(fence, "fence", { surface: 1 }));

  const roof = new PathBuilder(wheelbarrow.x1 + 380, wheelbarrow.lipY - 210, 0.1);
  roof.line(1300);
  const roofSurface = finishSurface("rail", roof.xs, roof.ys);
  lips.push({ surface: 2, x: roofSurface.x1 });
  obstacles.push(obstacle(roofSurface.x1 - 140, "gold", { surface: 2 }));

  section("truck");
  signs.push({ x: b.x + 100, key: "truck" });
  b.line(500).ease(400, 0.02);
  const truckRamp = ramp(400, 150, -0.62);
  const truck = truckRamp.x1 + 620;
  obstacles.push(obstacle(truck, "truck", { window: TRUCK_WINDOW }));
  b.ease(320, 0.34).line(1600).ease(800, 0.08).line(600);

  section("clothes");
  const c = b.x;
  signs.push({ x: c + 300, key: "duck" });
  obstacles.push(obstacle(c + 1100, "line"));
  const cat = c + 1750;
  b.ease(400, 0.09).line(2800);

  section("final");
  signs.push({ x: b.x + 100, key: "land" });
  b.ease(500, 0.02);
  b.ease(800, -0.22);
  const crestStart = b.x;
  b.ease(760, 0.42);
  lips.push({ surface: 0, x: crestStart + 760 * (0.22 / 0.64) });
  b.line(1600).ease(900, 0.06);
  for (let i = 0; i < 2; i += 1) {
    b.curve(600, 0.06 * 600 + 75, 0.06);
    b.curve(600, 0.06 * 600 - 75, 0.06);
    lip();
  }
  b.ease(500, 0.12).line(1400).ease(600, 0.04);
  const dog = b.x - 900;
  b.line(1200);
  const finish = b.x + 500;
  signs.push({ x: finish - 900, key: "finish" });
  b.line(3000);

  const road = b.build("road");
  obstacles.sort((p, q) => p.x - q.x);
  lips.sort((p, q) => p.x - q.x);
  return {
    id: "arlindo",
    surfaces: [road, yardSurface, roofSurface],
    lips,
    obstacles,
    ramps,
    cobbles,
    signs,
    sections,
    zones: [{ key: "neighborhood", x0: road.x0, x1: road.x1 }],
    chalk,
    set: {
      kind: "arlindo",
      house: a + 250,
      hose,
      plank,
      yard: { x0: yardSurface.x0, x1: yardSurface.x1 },
      wheelbarrow,
      roof: { x0: roofSurface.x0, x1: roofSurface.x1 },
      fence,
      truck,
      truckRamp,
      cat,
      dog,
      boxes: finish + 1300,
    },
    start: 200,
    finish,
    grid: { lina: 540, bruno: -140 },
  };
}
