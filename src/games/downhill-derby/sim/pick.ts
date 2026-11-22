import type { CartId } from "./carts";
import type { CourseId } from "./course";
import type { RivalFita, RivalSlot } from "./tapes";

export const FORM_RUNS = 5;

export const RIVAL_SPREAD = 0.4;

export const LINA_FLOOR: Readonly<Record<CourseId, number>> = { arlindo: 50, feira: 56, antena: 67 };

export const LINA_TOP: Readonly<Record<CourseId, Readonly<Record<CartId, number>>>> = {
  arlindo: { deco: 34.6, bruno: 34.5, lina: 34.45, mila: 34.25 },
  feira: { deco: 36.25, bruno: 37.2, lina: 35.7, mila: 39 },
  antena: { deco: 40.8, bruno: 40.8, lina: 39.8, mila: 41.85 },
};

export function formPace(recent: readonly number[]) {
  const sorted = [...recent].sort((a, b) => a - b);
  const kept = sorted.length >= 3 ? sorted.slice(1, -1) : sorted;
  return kept.reduce((sum, t) => sum + t, 0) / kept.length;
}

function nearest(fitas: readonly RivalFita[], target: number, allow: (time: number) => boolean) {
  let index = -1;
  let gap = Infinity;
  fitas.forEach((f, i) => {
    if (!allow(f.time)) return;
    const d = Math.abs(f.time - target);
    if (d < gap) {
      gap = d;
      index = i;
    }
  });
  return index;
}

export function pickFitas(course: CourseId, cart: CartId, ladders: Readonly<Record<RivalSlot, readonly RivalFita[]>>, targets: Readonly<Record<RivalSlot, number>>) {
  const any = () => true;
  const mila = Math.max(0, nearest(ladders.mila, targets.mila, any));
  const milaTime = ladders.mila[mila].time;
  const inRange = (t: number) => t >= LINA_TOP[course][cart] && t <= LINA_FLOOR[course];
  let lina = nearest(ladders.lina, targets.lina, inRange);
  if (lina < 0) lina = nearest(ladders.lina, targets.lina, any);
  if (ladders.lina[lina].time > milaTime - RIVAL_SPREAD) {
    const ahead = nearest(ladders.lina, targets.lina, (t) => inRange(t) && t <= milaTime - RIVAL_SPREAD);
    if (ahead >= 0) lina = ahead;
  }
  let bruno = nearest(ladders.bruno, targets.bruno, any);
  if (ladders.bruno[bruno].time < milaTime + RIVAL_SPREAD) {
    const behind = nearest(ladders.bruno, targets.bruno, (t) => t >= milaTime + RIVAL_SPREAD);
    if (behind >= 0) bruno = behind;
  }
  return { lina, bruno, mila } satisfies Record<RivalSlot, number>;
}
