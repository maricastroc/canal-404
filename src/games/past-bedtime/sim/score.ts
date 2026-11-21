import { stars } from "./sim";

export const PART_POINTS = 1000;
export const MOVE_POINTS = 100;
export const SPARE_MOVES = 10;
export const MIN_TURN_MS = 150;

export function movesSaved(par: number, turns: number) {
  return Math.max(0, par + SPARE_MOVES - turns);
}

export function partScore(par: number, turns: number) {
  return PART_POINTS + MOVE_POINTS * movesSaved(par, turns);
}

export function partStars(par: number, turns: number, hints: number) {
  return Math.min(stars(par, turns), hints > 0 ? 2 : 3);
}
