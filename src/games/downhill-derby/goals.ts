import { FEATS, type FeatId, type GoalBook } from "./save";
import type { CartId } from "./sim/carts";
import type { CourseId } from "./sim/course";
import { AWNING } from "./sim/feira";
import { LINA_TOP } from "./sim/pick";
import type { SimStats } from "./sim/sim";

export function championTime(course: CourseId, cart: CartId) {
  return LINA_TOP[course][cart];
}

export function featDone(id: FeatId, stats: SimStats) {
  if (id === "gnome") return stats.secret;
  if (id === "clean") return stats.hits === 0 && stats.crashes === 0;
  if (id === "awnings") return stats.combo >= AWNING.count;
  if (id === "pigeons") return stats.flock;
  if (id === "loop") return stats.loops > 0;
  return stats.shortcut;
}

export type GoalState = { feat: FeatId | null; done: boolean; fresh: boolean };

export function settleGoals(book: GoalBook, course: CourseId, cart: CartId, stats: SimStats, time: number): GoalState[] {
  const feats = (book.feats[course] ??= []);
  const states: GoalState[] = FEATS[course].map((feat) => {
    const now = featDone(feat, stats);
    const fresh = now && !feats.includes(feat);
    if (fresh) feats.push(feat);
    return { feat, done: feats.includes(feat), fresh };
  });
  const champions = (book.champions[course] ??= []);
  const fast = time < championTime(course, cart);
  const fresh = fast && !champions.includes(cart);
  if (fresh) champions.push(cart);
  states.push({ feat: null, done: champions.includes(cart), fresh });
  if (feats.length === 0) delete book.feats[course];
  if (champions.length === 0) delete book.champions[course];
  return states;
}
