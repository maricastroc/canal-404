import type { CartId } from "./carts";
import type { Params } from "./params";
import type { RunFrames } from "./replay";
import { DownhillSim, IDLE, type SimInput } from "./sim";
import type { Track } from "./track";

export type RivalTrack = { frames: RunFrames; head: number; mark: number; finished: boolean; finishTime: number };

export type WorldEvent = { type: "rival"; racer: number; event: DownhillSim["events"][number] };

export class RaceWorld {
  readonly track: Track;
  readonly player: DownhillSim;
  readonly rivals: RivalTrack[];
  readonly events: WorldEvent[] = [];

  constructor(track: Track, playerParams: Params, rivalFrames: readonly RunFrames[], cart: CartId = "deco") {
    this.track = track;
    this.player = new DownhillSim(track, playerParams, track.start, cart);
    this.rivals = rivalFrames.map((frames) => ({ frames, head: 0, mark: 0, finished: false, finishTime: Infinity }));
  }

  sample(r: RivalTrack, key: "x" | "y" | "angle" | "speed") {
    const f = r.frames;
    const h = Math.min(r.head, f.length - 1);
    const a = Math.floor(h);
    const b = Math.min(a + 1, f.length - 1);
    const t = h - a;
    return f[key][a] + (f[key][b] - f[key][a]) * t;
  }

  flags(r: RivalTrack) {
    return r.frames.flags[Math.min(Math.round(r.head), r.frames.length - 1)];
  }

  step(input: SimInput) {
    const p = this.player;
    p.advance(p.finished ? IDLE : input);
    for (let i = 0; i < this.rivals.length; i += 1) {
      const r = this.rivals[i];
      const before = r.head;
      r.head += 1;
      if (!r.finished && r.frames.finishStep >= 0 && r.head >= r.frames.finishStep) {
        r.finished = true;
        r.finishTime = r.frames.finishTime;
      }
      while (r.mark < r.frames.marks.length && r.frames.marks[r.mark].step <= r.head) {
        const m = r.frames.marks[r.mark];
        r.mark += 1;
        if (m.step > before) this.events.push({ type: "rival", racer: i + 1, event: m.event });
      }
    }
  }

  drain() {
    return this.events.splice(0, this.events.length);
  }
}
