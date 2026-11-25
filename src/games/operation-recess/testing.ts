import type { GameStats, RecessReplay } from "@/games/types";
import { HEARTS, RUN, SCORE, TILE } from "./config";
import { LEVELS } from "./levels";

const runMs = (fromCol: number, x: number) => (Math.max(0, x - (fromCol * TILE + TILE / 2)) / RUN) * 1000 + 1500;

function killSet(points: number[], count: number, total: number): number[] | null {
  const walk = (start: number, picked: number[], sum: number): number[] | null => {
    if (picked.length === count) return sum === total ? picked : null;
    for (let i = start; i < points.length; i += 1) {
      const found = walk(i + 1, [...picked, i], sum + points[i]);
      if (found) return found;
    }
    return null;
  };
  return walk(0, [], 0);
}

export function traceFor(levelId: string, s: GameStats, won: boolean): RecessReplay {
  const def = LEVELS.find((l) => l.id === levelId)!;
  const at = (col: number) => Math.round(runMs(def.start, col * TILE + TILE / 2));
  const kills = (s.resumed ? [] : (killSet(def.enemies.map((e) => SCORE[e.kind]), s.kills, s.killPoints) ?? [])).map((i): [number, number] => [at(def.enemies[i].col), i]);
  const stickers = def.items.flatMap((it, i) => (it.kind === "sticker" ? [i] : [])).slice(0, s.stickers);
  const healing = Math.max(0, s.hearts - (HEARTS - s.hits));
  const snacks = def.items.flatMap((it, i) => (it.kind === "snack" ? [i] : [])).slice(0, healing);
  const hits = won ? Array.from({ length: s.hits }, (_, i) => 200 * (i + 1)) : Array.from({ length: s.hits }, (_, i) => s.timeMs - 200 * (s.hits - 1 - i));
  const lastHit = won ? 200 * s.hits : 0;
  const items = [...stickers.map((i): [number, number] => [at(def.items[i].col), i]), ...snacks.map((i): [number, number] => [Math.max(lastHit + 100, at(def.items[i].col)), i])].sort((a, b) => a[0] - b[0]);
  const bells = (won ? def.checkpoints : []).map((col) => at(col));
  const arena = def.boss && won ? Math.min(at(def.boss.arena + 4), s.timeMs - 8000) : null;
  return { kind: "recess-trace", version: 1, kills: kills.sort((a, b) => a[0] - b[0]), items, hits, bells, arena };
}
