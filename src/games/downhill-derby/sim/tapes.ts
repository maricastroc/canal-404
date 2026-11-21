import type { CartId } from "./carts";
import type { CourseId } from "./course";
import type { InputLog } from "./replay";

export type RivalFita = { time: number; tape: string };

export type RivalSlot = "lina" | "bruno" | "mila";

export type RivalDef = { id: CartId; slot?: RivalSlot; start: number; fitas: readonly RivalFita[] };

const LAST = "0123456789abcdefghijklmnopqrstuv";
const MORE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&*";

export function encodeTape(log: InputLog) {
  let out = "";
  let prev = 0;
  for (let i = 0; i + 1 < log.length; i += 2) {
    let d = log[i] - prev;
    prev = log[i];
    const digits: number[] = [];
    do {
      digits.unshift(d % 32);
      d = Math.floor(d / 32);
    } while (d > 0);
    for (let k = 0; k < digits.length - 1; k += 1) out += MORE[digits[k]];
    out += LAST[digits[digits.length - 1]] + LAST[log[i + 1]];
  }
  return out;
}

export function decodeTape(tape: string): InputLog {
  const log: InputLog = [];
  let step = 0;
  let acc = 0;
  for (let i = 0; i < tape.length; i += 1) {
    const ch = tape[i];
    const more = MORE.indexOf(ch);
    if (more >= 0) {
      acc = acc * 32 + more;
      continue;
    }
    step += acc * 32 + LAST.indexOf(ch);
    acc = 0;
    i += 1;
    log.push(step, LAST.indexOf(tape[i]));
  }
  return log;
}

export async function loadRivals(course: CourseId): Promise<readonly RivalDef[]> {
  if (course === "feira") return (await import("./rivals-feira")).RIVALS;
  if (course === "antena") return (await import("./rivals-antena")).RIVALS;
  return (await import("./rivals-arlindo")).RIVALS;
}
