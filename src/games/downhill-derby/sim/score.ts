import type { CartId } from "./carts";
import type { CourseId } from "./course";
import type { RivalDef, RivalSlot } from "./tapes";

export const RACE_COURSES: readonly CourseId[] = ["arlindo", "feira", "antena"];

export const RACE_SLOTS: readonly RivalSlot[] = ["lina", "bruno", "mila"];

export const PLACE_POINTS: readonly number[] = [1000, 600, 300, 0];

export const RACERS = RACE_SLOTS.length + 1;

export function slotRider(slot: RivalSlot, cart: CartId): CartId {
  return slot === cart ? "deco" : slot;
}

export function slotDef(defs: readonly RivalDef[], slot: RivalSlot, cart: CartId) {
  const id = slotRider(slot, cart);
  return defs.find((d) => d.id === id && (id !== "deco" || d.slot === slot)) ?? null;
}

export function placeOf(time: number, rivalTimes: readonly number[]) {
  return 1 + rivalTimes.filter((t) => t < time).length;
}

export function placeStars(place: number) {
  return Math.max(0, RACERS - place);
}

export function raceScore(place: number, show: number) {
  return (PLACE_POINTS[place - 1] ?? 0) + show;
}

export function raceMs(time: number) {
  return Math.round(time * 1000);
}
