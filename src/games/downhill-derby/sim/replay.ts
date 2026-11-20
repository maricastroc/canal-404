import type { Params } from "./params";
import { DownhillSim, STEP_HZ, type SimEvent, type SimInput, type SimStats } from "./sim";
import type { Track } from "./track";

export type InputLog = number[];

export function inputBits(input: SimInput) {
  return (input.crouch ? 1 : 0) | (input.jump ? 2 : 0) | (input.spin < 0 ? 4 : 0) | (input.spin > 0 ? 8 : 0);
}

export function bitsInput(bits: number): SimInput {
  return { crouch: (bits & 1) !== 0, jump: (bits & 2) !== 0, spin: bits & 4 ? -1 : bits & 8 ? 1 : 0 };
}

export class InputRecorder {
  readonly log: InputLog = [];
  private last = -1;

  record(step: number, input: SimInput) {
    const bits = inputBits(input);
    if (bits === this.last) return;
    this.log.push(step, bits);
    this.last = bits;
  }
}

export class InputPlayer {
  private cursor = 0;
  private bits = 0;
  private readonly log: InputLog;

  constructor(log: InputLog) {
    this.log = log;
  }

  at(step: number): SimInput {
    while (this.cursor < this.log.length && this.log[this.cursor] <= step) {
      this.bits = this.log[this.cursor + 1];
      this.cursor += 2;
    }
    return bitsInput(this.bits);
  }
}

export const FRAME_AIR = 1;
export const FRAME_CRASH = 2;
export const FRAME_CROUCH = 4;
export const FRAME_PADDLE = 8;

export type RunFrames = {
  x: Float32Array;
  y: Float32Array;
  angle: Float32Array;
  speed: Float32Array;
  flags: Uint8Array;
  length: number;
  finishTime: number;
  finishStep: number;
  stats: SimStats;
  marks: { step: number; event: SimEvent }[];
};

export function simulateLog(track: Track, params: Params, log: InputLog, tailSteps = STEP_HZ * 2, maxSteps = STEP_HZ * 240, startX = track.start): RunFrames {
  const sim = new DownhillSim(track, params, startX);
  const player = new InputPlayer(log);
  const cap = maxSteps + tailSteps + 1;
  const x = new Float32Array(cap);
  const y = new Float32Array(cap);
  const angle = new Float32Array(cap);
  const speed = new Float32Array(cap);
  const flags = new Uint8Array(cap);
  const store = (i: number) => {
    x[i] = sim.x;
    y[i] = sim.y;
    angle[i] = sim.angle;
    speed[i] = sim.speed;
    flags[i] = (sim.mode === "air" ? FRAME_AIR : 0) | (sim.mode === "crash" || sim.tumbling ? FRAME_CRASH : 0) | (sim.crouch ? FRAME_CROUCH : 0) | (sim.paddling ? FRAME_PADDLE : 0);
  };
  store(0);
  const marks: { step: number; event: SimEvent }[] = [];
  let finishStep = -1;
  let i = 0;
  while (i < cap - 1) {
    sim.advance(sim.finished ? { crouch: false, jump: false, spin: 0 } : player.at(sim.step + 1));
    i += 1;
    store(i);
    for (const e of sim.drain()) marks.push({ step: sim.step, event: e });
    if (sim.finished && finishStep < 0) finishStep = sim.step;
    if (finishStep >= 0 && sim.step - finishStep >= tailSteps) break;
    if (finishStep < 0 && sim.step >= maxSteps) break;
  }
  return { x, y, angle, speed, flags, length: i + 1, finishTime: sim.finished ? sim.finishTime : Infinity, finishStep, stats: { ...sim.stats }, marks };
}

export function timeAtX(frames: RunFrames, x: number) {
  const xs = frames.x;
  if (x <= xs[0]) return 0;
  let lo = 0;
  let hi = frames.length - 1;
  if (xs[hi] < x) return Infinity;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] < x) lo = mid;
    else hi = mid;
  }
  const t = xs[hi] > xs[lo] ? (x - xs[lo]) / (xs[hi] - xs[lo]) : 0;
  return (lo + t) / STEP_HZ;
}
