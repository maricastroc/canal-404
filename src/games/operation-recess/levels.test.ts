import { describe, expect, it } from "vitest";
import { ROWS } from "./config";
import { LEVELS } from "./levels";

const onGround = (ground: [number, number][], col: number) => ground.some(([a, b]) => col >= a && col <= b);

describe("Operação: Recreio levels", () => {
  it("come in the order the story is told", () => {
    expect(LEVELS.map((l) => l.theme)).toEqual(["corridor", "yard", "office"]);
  });

  it("end with an exit, except the last one, which ends with the boss", () => {
    LEVELS.slice(0, -1).forEach((l) => {
      expect(l.exit, l.id).toBeDefined();
      expect(l.boss, l.id).toBeUndefined();
    });
    const last = LEVELS.at(-1)!;
    expect(last.boss).toBeDefined();
    expect(last.exit).toBeUndefined();
  });

  it("place the start, exit and boss arena on solid ground", () => {
    for (const l of LEVELS) {
      expect(onGround(l.ground, l.start), l.id).toBe(true);
      if (l.exit) expect(onGround(l.ground, l.exit.col), l.id).toBe(true);
      if (l.boss) expect(onGround(l.ground, l.boss.arena), l.id).toBe(true);
    }
  });

  it("keep ground segments in order and inside the level", () => {
    for (const l of LEVELS) {
      l.ground.forEach(([a, b], i) => {
        expect(a, l.id).toBeLessThanOrEqual(b);
        expect(b, l.id).toBeLessThan(l.length);
        if (i > 0) expect(a, l.id).toBeGreaterThan(l.ground[i - 1][1] + 1);
      });
    }
  });

  it("put floor enemies, puddles and checkpoints on solid ground", () => {
    for (const l of LEVELS) {
      for (const e of l.enemies.filter((x) => x.row === undefined)) expect(onGround(l.ground, e.col), `${l.id}: enemy at ${e.col}`).toBe(true);
      for (const p of l.puddles) for (let c = p.col; c < p.col + p.w; c += 1) expect(onGround(l.ground, c), `${l.id}: puddle at ${c}`).toBe(true);
      for (const c of l.checkpoints) expect(onGround(l.ground, c), `${l.id}: checkpoint at ${c}`).toBe(true);
    }
  });

  it("keep checkpoints in order and after the start", () => {
    for (const l of LEVELS) {
      expect([...l.checkpoints].sort((a, b) => a - b), l.id).toEqual(l.checkpoints);
      for (const c of l.checkpoints) expect(c, l.id).toBeGreaterThan(l.start);
    }
  });

  it("keep everything inside the level", () => {
    for (const l of LEVELS) {
      const cols = [...l.enemies.map((e) => e.col), ...l.items.map((i) => i.col), ...l.platforms.map((p) => p.col + p.w - 1), ...l.blocks.map((b) => b.col + b.w - 1)];
      for (const c of cols) expect(c, l.id).toBeLessThan(l.length);
      const rows = [...l.items.map((i) => i.row), ...l.platforms.map((p) => p.row), ...l.enemies.flatMap((e) => (e.row === undefined ? [] : [e.row]))];
      for (const r of rows) {
        expect(r, l.id).toBeGreaterThanOrEqual(0);
        expect(r, l.id).toBeLessThan(ROWS);
      }
    }
  });

  it("bridge every gap in the ground with a book cart", () => {
    for (const l of LEVELS) {
      for (let i = 1; i < l.ground.length; i += 1) {
        const from = l.ground[i - 1][1] + 1;
        const to = l.ground[i][0] - 1;
        const cart = l.carts?.find((c) => c.from <= from && c.to >= from && c.to <= to + 1);
        expect(cart, `${l.id}: gap ${from}-${to}`).toBeDefined();
      }
    }
  });

  it("have at least one snack in every level", () => {
    for (const l of LEVELS) expect(l.items.some((i) => i.kind === "snack"), l.id).toBe(true);
  });
});
