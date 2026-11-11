import { CATALOG, ROTATIONS, type MissionDef, type Rotation } from "./catalog";
import { addDays, dayNumber } from "./calendar";

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

function entriesOf(catalog: readonly MissionDef[], game: string) {
  return catalog.filter((m) => m.game === game).sort((a, b) => a.key.localeCompare(b.key));
}

function bagAt(entries: readonly MissionDef[], namespace: string, turn: number): MissionDef[] {
  const cycle = Math.floor(turn / entries.length);
  const order = cycleOrder(entries, namespace, cycle);
  const at = mod(turn, entries.length);
  return [...order.slice(at), ...order.slice(0, at)];
}

function liveGames(rotation: Rotation, catalog: readonly MissionDef[]) {
  return rotation.games.filter((g) => catalog.some((m) => m.game === g));
}

function rotationIndex(day: string, rotations: readonly Rotation[]) {
  let index = 0;
  rotations.forEach((r, i) => {
    if (r.from === null || r.from <= day) index = i;
  });
  return index;
}

function blockOrder(rotations: readonly Rotation[], index: number, block: number, catalog: readonly MissionDef[]): string[] {
  const rotation = rotations[index];
  const live = liveGames(rotation, catalog);
  const order = shuffled(live, hash(`rotation:${rotation.from}:${block}`));
  const before = block > 0 ? shuffled(live, hash(`rotation:${rotation.from}:${block - 1}`)).at(-1) : gameOn(addDays(rotation.from!, -1), rotations.slice(0, index), catalog);
  if (order.length > 1 && order[0] === before) [order[0], order[1]] = [order[1], order[0]];
  return order;
}

function gameOn(day: string, rotations: readonly Rotation[], catalog: readonly MissionDef[]): string | undefined {
  if (!rotations.length) return undefined;
  return scheduledMission(day, catalog, rotations)[0]?.game;
}

export function scheduledMission(day: string, catalog: readonly MissionDef[] = CATALOG, rotations: readonly Rotation[] = ROTATIONS): MissionDef[] {
  const index = rotationIndex(day, rotations);
  const rotation = rotations[index];
  const live = liveGames(rotation, catalog);
  if (rotation.from === null || live.length < 3) {
    const n = dayNumber(day);
    const game = live[mod(n, live.length)];
    return bagAt(entriesOf(catalog, game), game, Math.floor(n / live.length));
  }
  const offset = dayNumber(day) - dayNumber(rotation.from);
  const block = Math.floor(offset / live.length);
  const game = blockOrder(rotations, index, block, catalog)[mod(offset, live.length)];
  return bagAt(entriesOf(catalog, game), `${game}@${rotation.from}`, block);
}

export function pickMission(day: string, avoidKey: string | null = null, catalog: readonly MissionDef[] = CATALOG): MissionDef {
  const candidates = scheduledMission(day, catalog);
  return candidates.find((m) => m.key !== avoidKey) ?? candidates[0];
}
