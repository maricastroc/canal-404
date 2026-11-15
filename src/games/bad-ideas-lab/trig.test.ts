import { describe, expect, it } from "vitest";
import { cos, sin } from "./trig";

const view = new DataView(new ArrayBuffer(8));

function hex(x: number) {
  view.setFloat64(0, x);
  return view.getBigUint64(0).toString(16).padStart(16, "0");
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
});
