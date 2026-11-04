import { describe, expect, it } from "vitest";
import { cos, sin } from "./trig";

const view = new DataView(new ArrayBuffer(8));

function bits(x: number) {
  view.setFloat64(0, x);
  return view.getBigInt64(0);
}

function hex(x: number) {
  view.setFloat64(0, x);
  return view.getBigUint64(0).toString(16).padStart(16, "0");
}

function ulps(a: number, b: number) {
  const d = bits(a) - bits(b);
  return d < BigInt(0) ? -d : d;
}

function samples(count: number, scale: number, seed: number) {
  let s = seed >>> 0;
  return Array.from({ length: count }, () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s / 2 ** 32 - 0.5) * 2 * scale;
  });
}

const LOCKED: [number, string, string][] = [
  [0.001, "3f50624da5218a62", "3feffffef390876c"],
  [0.1, "3fb98eaecb8bcb2c", "3fefd712f9a817c0"],
  [0.2617993877991494, "3fd0907dc1930690", "3feee8dd4748bf15"],
  [0.5, "3fdeaee8744b05f0", "3fec1528065b7d50"],
  [0.7853981633974483, "3fe6a09e667f3bcc", "3fe6a09e667f3bcd"],
  [1, "3feaed548f090cee", "3fe14a280fb5068c"],
  [1.5707963267948966, "3ff0000000000000", "3c91a62633145c07"],
  [2, "3fed18f6ead1b446", "bfdaa22657537205"],
  [3.141592653589793, "3ca1a62633145c07", "bff0000000000000"],
  [6, "bfd1e1f18ab0a2c0", "3feeb9b7097822f6"],
  [-0.4, "bfd8ec3ae92b676b", "3fed7954e7dba2f8"],
  [40, "3fe7d7f78e027f00", "bfe5578e7d68218f"],
];

describe("deterministic trigonometry", () => {
  it("returns the same bits on every engine for a fixed set of angles", () => {
    for (const [x, s, c] of LOCKED) {
      expect(hex(sin(x)), `sin(${x})`).toBe(s);
      expect(hex(cos(x)), `cos(${x})`).toBe(c);
    }
  });

  it("handles zero, infinity and NaN like Math", () => {
    expect(Object.is(sin(0), 0)).toBe(true);
    expect(Object.is(sin(-0), -0)).toBe(true);
    expect(cos(0)).toBe(1);
    expect(cos(-0)).toBe(1);
    for (const x of [Infinity, -Infinity, NaN]) {
      expect(sin(x)).toBeNaN();
      expect(cos(x)).toBeNaN();
    }
  });

  it("is odd for sine and even for cosine, bit for bit", () => {
    for (const x of samples(20_000, 10, 3)) {
      expect(Object.is(sin(-x), -sin(x))).toBe(true);
      expect(Object.is(cos(-x), cos(x))).toBe(true);
    }
  });

  it("stays within two units in the last place of this engine's Math.sin and Math.cos", () => {
    let worst = BigInt(0);
    for (const x of [...samples(100_000, 1, 5), ...samples(100_000, 64, 9)]) {
      for (const [a, b] of [
        [sin(x), Math.sin(x)],
        [cos(x), Math.cos(x)],
      ]) {
        if (Math.sign(a) !== Math.sign(b)) {
          expect(Math.abs(a - b)).toBeLessThan(1e-15);
          continue;
        }
        const d = ulps(a, b);
        if (d > worst) worst = d;
      }
    }
    expect(worst <= BigInt(2)).toBe(true);
  });
});
