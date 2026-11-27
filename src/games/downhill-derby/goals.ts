import { FEATS, isUnlocked, wonWith, type DerbySave, type FeatId } from "./save";
import { CART_IDS, type CartId } from "./sim/carts";
import type { CourseId } from "./sim/course";
import { AWNING } from "./sim/feira";
import type { SimStats } from "./sim/sim";

export function featDone(id: FeatId, stats: SimStats) {
  if (id === "gnome") return stats.secret;
  if (id === "clean") return stats.hits === 0 && stats.crashes === 0;
  if (id === "awnings") return stats.combo >= AWNING.count;
  if (id === "pigeons") return stats.flock;
  if (id === "loop") return stats.loops > 0;
  return stats.shortcut;
}

export type CartMark = { cart: CartId; won: boolean; fresh: boolean; locked: boolean };

export function cartMarks(save: DerbySave, course: CourseId, fresh: CartId | null = null): CartMark[] {
  return CART_IDS.map((cart) => ({ cart, won: wonWith(save, course, cart), fresh: cart === fresh, locked: !isUnlocked(save, cart) }));
}

export type GoalState = { feat: FeatId; done: boolean; fresh: boolean } | { feat: null; done: boolean; fresh: boolean; carts: CartMark[] };

export function trackGoals(save: DerbySave, course: CourseId): GoalState[] {
  const feats = save.feats[course] ?? [];
  const carts = cartMarks(save, course);
  return [...FEATS[course].map((feat) => ({ feat, done: feats.includes(feat), fresh: false })), { feat: null, done: carts.every((c) => c.won), fresh: false, carts }];
}

export function firstWin(save: DerbySave, course: CourseId, cart: CartId, place: number) {
  return place === 1 && save.wins[course]?.[cart] === 1;
}

export function settleGoals(save: DerbySave, course: CourseId, cart: CartId, stats: SimStats, place: number): GoalState[] {
  const feats = (save.feats[course] ??= []);
  const states: GoalState[] = FEATS[course].map((feat) => {
    const now = featDone(feat, stats);
    const fresh = now && !feats.includes(feat);
    if (fresh) feats.push(feat);
    return { feat, done: feats.includes(feat), fresh };
  });
  if (feats.length === 0) delete save.feats[course];
  const newCart = firstWin(save, course, cart, place) ? cart : null;
  const carts = cartMarks(save, course, newCart);
  const done = carts.every((c) => c.won);
  states.push({ feat: null, done, fresh: done && newCart !== null, carts });
  return states;
}
