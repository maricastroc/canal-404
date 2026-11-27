import type { Point } from "./nav";

export const SPECIAL = {
  firstAt: 14000,
  after: 18000,
  retry: 7000,
  life: 12000,
  grab: { rx: 70, ry: 44 },
  clearance: 220,
  windup: 120,
  speed: 0.86,
  scale: 1.55,
  hit: 1.7,
  lift: 1.65,
  knock: 1.6,
  daze: 800,
  wave: { rx: 230, ry: 150, push: 560, stun: 300 },
};

type Holder = { x: number; y: number; alive: boolean; special: boolean };

export type SpecialEvent = { kind: "spawn"; at: Point } | { kind: "expire"; at: Point } | { kind: "grab"; at: Point; by: Holder } | null;

export class SpecialSpawner {
  nextAt: number = SPECIAL.firstAt;
  spot: Point | null = null;
  spawnedAt = 0;
  spawns = 0;
  private seq = 0;

  constructor(readonly spots: readonly (readonly [number, number])[]) {}

  pick(fighters: readonly Holder[]): Point {
    let fallback = this.seq % this.spots.length;
    let fallbackGap = -1;
    for (let k = 0; k < this.spots.length; k += 1) {
      const i = (this.seq + k) % this.spots.length;
      const [x, y] = this.spots[i];
      let gap = Infinity;
      for (const f of fighters) if (f.alive) gap = Math.min(gap, Math.hypot(f.x - x, f.y - y));
      if (gap >= SPECIAL.clearance) {
        this.seq = i + 1;
        return { x, y };
      }
      if (gap > fallbackGap) {
        fallbackGap = gap;
        fallback = i;
      }
    }
    this.seq = fallback + 1;
    const [x, y] = this.spots[fallback];
    return { x, y };
  }

  update(matchTime: number, fighters: readonly Holder[]): SpecialEvent {
    if (this.spot) {
      for (const f of fighters) {
        if (!f.alive || f.special) continue;
        const dx = (f.x - this.spot.x) / SPECIAL.grab.rx;
        const dy = (f.y - this.spot.y) / SPECIAL.grab.ry;
        if (dx * dx + dy * dy > 1) continue;
        const at = this.spot;
        this.spot = null;
        this.nextAt = Infinity;
        f.special = true;
        return { kind: "grab", at, by: f };
      }
      if (matchTime - this.spawnedAt >= SPECIAL.life) {
        const at = this.spot;
        this.spot = null;
        this.nextAt = matchTime + SPECIAL.retry;
        return { kind: "expire", at };
      }
      return null;
    }
    if (matchTime < this.nextAt || fighters.some((f) => f.alive && f.special)) return null;
    this.spot = this.pick(fighters);
    this.spawnedAt = matchTime;
    this.spawns += 1;
    return { kind: "spawn", at: this.spot };
  }

  used(matchTime: number) {
    this.nextAt = matchTime + SPECIAL.after;
  }

  lost(matchTime: number) {
    this.nextAt = matchTime + SPECIAL.retry;
  }
}
