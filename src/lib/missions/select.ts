import { CATALOG, MISSION_GAMES, type MissionDef } from "./catalog";
import { dayNumber } from "./calendar";

function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], seed: number) {
  const out = [...items];
  const next = random(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function cycleOrder(entries: readonly MissionDef[], game: string, cycle: number): MissionDef[] {
  const order = shuffled(entries, hash(`${game}:${cycle}`));
  if (order.length > 1) {
    const before = shuffled(entries, hash(`${game}:${cycle - 1}`));
    if (before[before.length - 1].key === order[0].key) [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
}

export function missionSeed(day: string) {
  return hash(`seed:${day}`) & 0x7fffffff;
}

export function scheduledMission(day: string, catalog: readonly MissionDef[] = CATALOG, games: readonly string[] = MISSION_GAMES): MissionDef[] {
  const live = games.filter((g) => catalog.some((m) => m.game === g));
  const n = dayNumber(day);
  const game = live[mod(n, live.length)];
  const entries = catalog.filter((m) => m.game === game).sort((a, b) => a.key.localeCompare(b.key));
  const turn = Math.floor(n / live.length);
  const cycle = Math.floor(turn / entries.length);
  const order = cycleOrder(entries, game, cycle);
  const at = mod(turn, entries.length);
  return [...order.slice(at), ...order.slice(0, at)];
}

export function pickMission(day: string, avoidKey: string | null = null, catalog: readonly MissionDef[] = CATALOG): MissionDef {
  const candidates = scheduledMission(day, catalog);
  return candidates.find((m) => m.key !== avoidKey) ?? candidates[0];
}
