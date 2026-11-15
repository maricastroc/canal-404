import type { ArenaDef } from "./arenas";
import { HP, STATS, type KidId } from "./config";
import { coast, drive, move } from "./motion";
import { arenaBoxes, NavGrid, resolveBody, separateBodies, solidBoxes, type Box, type Rect } from "./nav";
import type { BrainBody, BrainWorld } from "./scenes/brain";

export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SimKid implements BrainBody {
  vx = 0;
  vy = 0;
  alive = true;
  hp = HP;
  regenScale = 1;
  readyAt = 0;
  stunUntil = 0;
  lastHurtAt = -99999;
  special = false;
  hurtBy: BrainBody | null = null;
  throws = 0;
  readonly stats: (typeof STATS)[KidId];

  constructor(
    readonly kid: KidId,
    readonly isPlayer: boolean,
    public x: number,
    public y: number,
  ) {
    this.stats = STATS[kid];
  }

  canThrow(t: number) {
    return this.alive && t >= this.readyAt && t >= this.stunUntil;
  }
}

export type SimWorld = BrainWorld & { bounds: Rect; solid: Box[] };

export function simWorld(def: ArenaDef, ghosts: Rect[] = []): SimWorld {
  const boxes = arenaBoxes(def);
  const solid = [...solidBoxes(boxes), ...ghosts.map((g, i) => ({ ...g, tall: false, bouncy: false, solid: true, index: -1 - i }))];
  return { def, boxes, nav: new NavGrid(def.bounds, solidBoxes(boxes)), bounds: def.bounds, solid };
}

export function stepKids(kids: SimKid[], world: SimWorld, wants: Map<SimKid, { mx: number; my: number }>, t: number, dt: number) {
  const touched = new Set<SimKid>();
  for (const k of kids) {
    if (!k.alive) continue;
    const w = wants.get(k);
    if (t >= k.stunUntil) drive(k, w?.mx ?? 0, w?.my ?? 0, k.stats.speed, dt);
    else coast(k, dt);
    move(k, dt);
    if (resolveBody(k, world.bounds, world.solid)) touched.add(k);
  }
  separateBodies(kids.filter((k) => k.alive));
  for (const k of kids) if (k.alive && resolveBody(k, world.bounds, world.solid)) touched.add(k);
  return touched;
}
