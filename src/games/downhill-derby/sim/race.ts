import type { Params } from "./params";
import { FRAME_AIR, FRAME_CRASH, InputPlayer, type InputLog, type RunFrames } from "./replay";
import { DownhillSim, DT, IDLE, type SimInput } from "./sim";
import { heightAt, type ObstacleKind, type Track } from "./track";

export type Interaction = "off" | "dust" | "kick";

export const DUST_LOSS = 0.07;
export const DUST_REACH = 520;
export const DUST_GAP = 80;
export const DUST_SLOW = { rate: 0.45, steps: 60 };
export const KICK_SLOW = { rate: 0.35, steps: 90 };
export const KICK_MIN_SPEED = 1000;
export const KICK_BOOST = 1.15;
export const KICK_DECEL = 900;
export const KICK_LIFE = 2.2;
const KICK_LOW = 70;
const PLAYER = 0;

export type Kicked = { id: number; x: number; y: number; v: number; life: number; owner: number; kind: ObstacleKind; done: boolean; spin: number };

export type RivalTrack = { frames: RunFrames; head: number; rate: number; slowLeft: number; delay: number; mark: number; finished: boolean; finishTime: number };

export type WorldEvent =
  | { type: "rival"; racer: number; event: DownhillSim["events"][number] }
  | { type: "dusted"; victim: number; by: number }
  | { type: "kick"; owner: number; id: number }
  | { type: "kickHit"; victim: number; owner: number; id: number }
  | { type: "kickGone"; id: number };

export class RaceWorld {
  readonly track: Track;
  readonly player: DownhillSim;
  readonly rivals: RivalTrack[];
  readonly interaction: Interaction;
  readonly kicked: Kicked[] = [];
  readonly events: WorldEvent[] = [];
  private nextKick = 0;

  constructor(track: Track, playerParams: Params, rivalFrames: readonly RunFrames[], interaction: Interaction) {
    this.track = track;
    this.interaction = interaction;
    this.player = new DownhillSim(track, playerParams);
    this.rivals = rivalFrames.map((frames) => ({ frames, head: 0, rate: 1, slowLeft: 0, delay: 0, mark: 0, finished: false, finishTime: Infinity }));
  }

  rivalX(i: number) {
    return this.sample(this.rivals[i], "x");
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
    const playerPrev = p.x;
    const rivalPrev = this.rivals.map((r) => this.sample(r, "x"));
    const mark = p.events.length;
    p.advance(p.finished ? IDLE : input);
    for (let i = 0; i < this.rivals.length; i += 1) {
      const r = this.rivals[i];
      const before = r.head;
      r.head += r.rate;
      if (r.slowLeft > 0) {
        r.slowLeft -= 1;
        r.delay += (1 - r.rate) * DT;
        if (r.slowLeft <= 0) r.rate = 1;
      }
      if (!r.finished && r.frames.finishStep >= 0 && r.head >= r.frames.finishStep) {
        r.finished = true;
        r.finishTime = r.frames.finishTime + r.delay;
      }
      while (r.mark < r.frames.marks.length && r.frames.marks[r.mark].step <= r.head) {
        const m = r.frames.marks[r.mark];
        r.mark += 1;
        if (m.step > before) this.rivalEvent(i, m.event);
      }
    }
    for (let k = mark; k < p.events.length; k += 1) this.playerEvent(p.events[k]);
    if (this.interaction === "kick") this.stepKicked(playerPrev, rivalPrev);
  }

  private slow(i: number, slow: { rate: number; steps: number }) {
    const r = this.rivals[i];
    if (r.finished || this.flags(r) & FRAME_CRASH) return false;
    r.rate = slow.rate;
    r.slowLeft = slow.steps;
    return true;
  }

  private playerEvent(e: DownhillSim["events"][number]) {
    const p = this.player;
    if (this.interaction === "dust" && e.type === "land" && e.quality !== "touch" && e.air >= 0.3) {
      for (let i = 0; i < this.rivals.length; i += 1) {
        const r = this.rivals[i];
        const d = p.x - this.sample(r, "x");
        if (d < DUST_GAP || d > DUST_REACH || this.flags(r) & FRAME_AIR) continue;
        if (this.slow(i, DUST_SLOW)) this.events.push({ type: "dusted", victim: i + 1, by: PLAYER });
      }
    }
    if (this.interaction === "kick" && e.type === "hit" && e.penalized && (e.kind === "cone" || e.kind === "crate") && p.speed >= KICK_MIN_SPEED / (1 - p.params.hitLoss)) {
      this.spawnKick(PLAYER, e.index, p.speed);
    }
  }

  private rivalEvent(i: number, e: DownhillSim["events"][number]) {
    const r = this.rivals[i];
    const p = this.player;
    const rx = this.sample(r, "x");
    this.events.push({ type: "rival", racer: i + 1, event: e });
    if (this.interaction === "dust" && e.type === "land" && e.quality !== "touch" && e.air >= 0.3) {
      const d = rx - p.x;
      if (d >= DUST_GAP && d <= DUST_REACH && p.mode === "ground" && p.interfere(DUST_LOSS, "dust")) this.events.push({ type: "dusted", victim: PLAYER, by: i + 1 });
    }
    if (this.interaction === "kick" && e.type === "hit" && e.penalized && (e.kind === "cone" || e.kind === "crate")) {
      const speed = this.sample(r, "speed");
      if (speed >= KICK_MIN_SPEED / (1 - p.params.hitLoss)) this.spawnKick(i + 1, e.index, speed);
    }
  }

  private spawnKick(owner: number, index: number, speed: number) {
    const o = this.track.obstacles[index];
    if (owner !== PLAYER) this.player.removed.add(index);
    const id = this.nextKick;
    this.nextKick += 1;
    this.kicked.push({ id, x: o.x, y: heightAt(this.track.surfaces[0], o.x), v: speed * KICK_BOOST, life: KICK_LIFE, owner, kind: o.kind, done: false, spin: 0 });
    this.events.push({ type: "kick", owner, id });
  }

  private stepKicked(playerPrev: number, rivalPrev: number[]) {
    const road = this.track.surfaces[0];
    const p = this.player;
    for (const k of this.kicked) {
      if (k.done) continue;
      const kPrev = k.x;
      k.v -= KICK_DECEL * DT;
      if (k.v < 0) k.v = 0;
      k.x += k.v * DT;
      k.y = heightAt(road, Math.min(k.x, road.x1));
      k.spin += k.v * DT * 0.02;
      k.life -= DT;
      const crossed = (a0: number, a1: number) => {
        const before = a0 - kPrev;
        const after = a1 - k.x;
        return (before < 0 && after >= 0) || (before > 0 && after <= 0);
      };
      if (k.owner !== PLAYER && crossed(playerPrev, p.x)) {
        const h = heightAt(road, Math.min(p.x, road.x1)) - p.y;
        if (h < KICK_LOW && p.surface === 0 && p.interfere(p.params.hitLoss, "kick")) {
          k.done = true;
          this.events.push({ type: "kickHit", victim: PLAYER, owner: k.owner, id: k.id });
        }
      }
      for (let i = 0; i < this.rivals.length && !k.done; i += 1) {
        if (k.owner === i + 1) continue;
        const r = this.rivals[i];
        if (!crossed(rivalPrev[i], this.sample(r, "x")) || this.flags(r) & FRAME_AIR) continue;
        if (this.slow(i, KICK_SLOW)) {
          k.done = true;
          this.events.push({ type: "kickHit", victim: i + 1, owner: k.owner, id: k.id });
        }
      }
      if (!k.done && (k.life <= 0 || k.v <= 0)) {
        k.done = true;
        this.events.push({ type: "kickGone", id: k.id });
      }
    }
  }

  drain() {
    return this.events.splice(0, this.events.length);
  }
}

export function replayRace(track: Track, params: Params, log: InputLog, rivalFrames: readonly RunFrames[], interaction: Interaction, maxSteps = 120 * 240) {
  const world = new RaceWorld(track, params, rivalFrames, interaction);
  const input = new InputPlayer(log);
  const p = world.player;
  while (!p.finished && p.step < maxSteps) {
    world.step(input.at(p.step + 1));
    p.drain();
    world.drain();
  }
  return p.finished ? p.finishTime : Infinity;
}
