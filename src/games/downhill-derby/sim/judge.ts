import { CART_IDS, type CartId } from "./carts";
import type { CourseId } from "./course";
import { buildCourse } from "./courses";
import { DEFAULT_PARAMS, cloneParams } from "./params";
import { bitsInput, type InputLog } from "./replay";
import { RIVALS as ANTENA } from "./rivals-antena";
import { RIVALS as ARLINDO } from "./rivals-arlindo";
import { RIVALS as FEIRA } from "./rivals-feira";
import { placeOf, placeStars, raceMs, raceScore, RACE_COURSES, RACE_SLOTS, slotDef } from "./score";
import { DownhillSim, STEP_HZ, type SimStats } from "./sim";
import type { RivalDef } from "./tapes";

export const MAX_RACE_STEPS = STEP_HZ * 240;

export const TAPE_MAX = 12_000;

export const TAPE_PATTERN = /^[0-9a-vA-Z!#$%&*]*$/;

const LAST = "0123456789abcdefghijklmnopqrstuv";
const MORE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&*";
const JUMP = 2;
const SPIN_LEFT = 4;
const SPIN_RIGHT = 8;

const RIVALS: Record<CourseId, readonly RivalDef[]> = { arlindo: ARLINDO, feira: FEIRA, antena: ANTENA };

export type DownhillTally = {
  time: number;
  timeMs: number;
  steps: number;
  place: number;
  stars: number;
  won: boolean;
  score: number;
  stats: SimStats;
};

export type DownhillReplay = { ok: true; tally: DownhillTally } | { ok: false; problem: "bad_log" | "bad_rivals" | "unfinished" };

export function parseTape(tape: string): InputLog | null {
  if (tape.length > TAPE_MAX || !TAPE_PATTERN.test(tape)) return null;
  const log: InputLog = [];
  let step = 0;
  let acc = 0;
  let pending = false;
  for (let i = 0; i < tape.length; i += 1) {
    const more = MORE.indexOf(tape[i]);
    if (more >= 0) {
      if (acc === 0 && more === 0) return null;
      acc = acc * 32 + more;
      pending = true;
      if (acc > MAX_RACE_STEPS) return null;
      continue;
    }
    const delta = acc * 32 + LAST.indexOf(tape[i]);
    acc = 0;
    pending = false;
    if (delta <= 0 || i + 1 >= tape.length) return null;
    const bits = LAST.indexOf(tape[i + 1]);
    if (bits < 0) return null;
    i += 1;
    step += delta;
    if (step > MAX_RACE_STEPS) return null;
    log.push(step, bits);
  }
  if (pending) return null;
  return log;
}

function humanLog(log: InputLog) {
  for (let i = 0; i < log.length; i += 2) {
    const bits = log[i + 1];
    if (i >= 2 && bits === log[i - 1]) return false;
    if ((bits & SPIN_LEFT) !== 0 && (bits & SPIN_RIGHT) !== 0) return false;
    if ((bits & JUMP) !== 0 && i + 2 < log.length && (log[i + 2] !== log[i] + 1 || (log[i + 3] & JUMP) !== 0)) return false;
  }
  return true;
}

export function isRaceCourse(value: string | null): value is CourseId {
  return value !== null && (RACE_COURSES as readonly string[]).includes(value);
}

export function isCart(value: unknown): value is CartId {
  return typeof value === "string" && (CART_IDS as readonly string[]).includes(value);
}

export function rivalTimes(course: CourseId, cart: CartId, picks: readonly number[]) {
  if (picks.length !== RACE_SLOTS.length) return null;
  const times: number[] = [];
  for (let i = 0; i < RACE_SLOTS.length; i += 1) {
    const def = slotDef(RIVALS[course], RACE_SLOTS[i], cart);
    const fita = def && Number.isInteger(picks[i]) ? def.fitas[picks[i]] : undefined;
    if (!fita) return null;
    times.push(fita.time);
  }
  return times;
}

export function replayDownhill(course: CourseId, cart: CartId, tape: string, picks: readonly number[]): DownhillReplay {
  const log = parseTape(tape);
  if (!log || !humanLog(log)) return { ok: false, problem: "bad_log" };
  const rivals = rivalTimes(course, cart, picks);
  if (!rivals) return { ok: false, problem: "bad_rivals" };
  const track = buildCourse(course);
  const sim = new DownhillSim(track, cloneParams(DEFAULT_PARAMS), track.start, cart);
  let cursor = 0;
  let bits = 0;
  while (!sim.finished && sim.step < MAX_RACE_STEPS) {
    const step = sim.step + 1;
    while (cursor < log.length && log[cursor] <= step) {
      bits = log[cursor + 1];
      cursor += 2;
    }
    sim.advance(bitsInput(bits));
    sim.drain();
  }
  if (!sim.finished) return { ok: false, problem: "unfinished" };
  if (cursor < log.length) return { ok: false, problem: "bad_log" };
  if (log.length > 0 && (log[log.length - 1] & JUMP) !== 0 && log[log.length - 2] !== sim.step) return { ok: false, problem: "bad_log" };
  const place = placeOf(sim.finishTime, rivals);
  const stars = placeStars(place);
  return {
    ok: true,
    tally: { time: sim.finishTime, timeMs: raceMs(sim.finishTime), steps: sim.step, place, stars, won: stars > 0, score: raceScore(place, sim.stats.show), stats: { ...sim.stats } },
  };
}
