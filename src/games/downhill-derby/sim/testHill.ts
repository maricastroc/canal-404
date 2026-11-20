import type { Course, Section } from "./course";
import { finishSurface, obstacle, PathBuilder, type Lip, type Obstacle, type Ramp, type Sign } from "./track";

export type SectionKey = "start" | "descent" | "rollers" | "crest" | "kicker" | "bigRamp" | "obstacles" | "shortcut" | "finale";

export type TestHill = Course;

export function buildTestHill(): TestHill {
  const b = new PathBuilder(-2400, 0, 0);
  const lips: Lip[] = [];
  const obstacles: Obstacle[] = [];
  const signs: Sign[] = [];
  const sections: Section[] = [];
  const ramps: Ramp[] = [];
  const cobbles: { x0: number; x1: number }[] = [];
  const lip = () => lips.push({ surface: 0, x: b.x });
  const ramp = (dx: number, height: number, lipSlope: number) => {
    const r = b.ramp(dx, height, lipSlope);
    ramps.push(r);
    lips.push({ surface: 0, x: r.x1 });
    return r;
  };
  const section = (key: SectionKey) => sections.push({ key, x: b.x });
  const at = (key: SectionKey) => sections.find((s) => s.key === key)!.x;

  b.line(2400);
  section("start");
  b.line(500);

  section("descent");
  signs.push({ x: b.x + 600, key: "crouch" });
  b.ease(700, 0.3).line(1700).ease(900, 0.05);

  section("rollers");
  signs.push({ x: b.x + 150, key: "rollers" });
  b.line(400);
  for (let i = 0; i < 6; i += 1) {
    b.curve(650, 0.05 * 650 + 95, 0.05);
    b.curve(650, 0.05 * 650 - 95, 0.05);
    lip();
  }
  b.ease(600, 0.16).line(800);

  section("crest");
  b.ease(500, 0.02);
  signs.push({ x: b.x - 200, key: "crest" });
  b.ease(800, -0.22);
  const crestStart = b.x;
  b.ease(760, 0.4);
  lips.push({ surface: 0, x: crestStart + 760 * (0.22 / 0.62) });
  b.line(1100).ease(800, 0.08).line(600);

  section("kicker");
  signs.push({ x: b.x + 200, key: "ramp" });
  b.line(700);
  for (let i = 0; i < 2; i += 1) {
    b.ease(400, 0);
    ramp(320, 110, -0.58);
    b.ease(260, 0.32).line(900).ease(600, 0.1).line(i === 0 ? 500 : 700);
  }

  section("bigRamp");
  signs.push({ x: b.x + 100, key: "land" });
  b.ease(500, 0);
  ramp(460, 170, -0.72);
  b.ease(300, 0.4).line(2100).ease(1000, 0.06);

  section("obstacles");
  const o = b.x + 400;
  signs.push({ x: o + 100, key: "cones" });
  obstacles.push(obstacle(o + 900, "cone"), obstacle(o + 1060, "cone"));
  signs.push({ x: o + 1500, key: "crates" });
  obstacles.push(obstacle(o + 2300, "crate"));
  signs.push({ x: o + 2800, key: "duck" });
  obstacles.push(obstacle(o + 3600, "line"));
  signs.push({ x: o + 4100, key: "jump" });
  obstacles.push(obstacle(o + 4900, "barrier"));
  obstacles.push(obstacle(o + 5900, "crate"), obstacle(o + 6040, "cone"));
  b.ease(400, 0.06).line(6600);

  section("shortcut");
  b.ease(500, 0.18).line(900).ease(400, 0);
  signs.push({ x: b.x - 600, key: "shortcut" });
  const kick = ramp(260, 100, -0.55);
  b.ease(200, 0.04);
  const cobbleStart = b.x + 200;
  signs.push({ x: cobbleStart - 120, key: "cobbles" });
  b.line(3800);
  cobbles.push({ x0: cobbleStart, x1: b.x });
  b.ease(500, 0.3).line(800).ease(700, 0.07);

  const deck = new PathBuilder(kick.x1 + 520, kick.lipY - 330, 0.1);
  deck.line(4100);
  const deckSurface = finishSurface("deck", deck.xs, deck.ys);
  lips.push({ surface: 1, x: deckSurface.x1 });

  section("finale");
  b.line(900);
  obstacles.push(obstacle(b.x - 400, "cone"));
  for (let i = 0; i < 2; i += 1) {
    b.curve(550, 0.05 * 550 + 70, 0.05);
    b.curve(550, 0.05 * 550 - 70, 0.05);
    lip();
  }
  b.ease(500, 0.1).line(600).ease(400, 0);
  ramp(280, 110, -0.6);
  b.ease(260, 0.36).line(1500).ease(900, 0.02);
  const finish = b.x + 500;
  signs.push({ x: finish - 900, key: "finish" });
  b.line(4000);

  const road = b.build("road");
  obstacles.sort((a, c) => a.x - c.x);
  lips.sort((a, c) => a.x - c.x);
  const zones: Course["zones"] = [
    { key: "street", x0: road.x0, x1: at("crest") },
    { key: "market", x0: at("crest"), x1: at("bigRamp") },
    { key: "works", x0: at("bigRamp"), x1: at("shortcut") },
    { key: "final", x0: at("shortcut"), x1: road.x1 },
  ];
  return { id: "test", surfaces: [road, deckSurface], lips, obstacles, ramps, cobbles, signs, sections, zones, chalk: [], set: null, start: 200, finish, grid: { lina: 540, bruno: -140 } };
}
