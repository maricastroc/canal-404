import type { CompiledSong, SongId } from "../song/notation";

export type Grade = "perfect" | "good" | "near" | "miss";
export type Tail = "held" | "dropped";
export type Mark = Grade | Tail | "noise";
export type Windows = { perfect: number; good: number; near: number };

export const WINDOWS: Windows = { perfect: 45, good: 90, near: 135 };
export const ASSIST_WINDOWS: Windows = { perfect: 60, good: 120, near: 180 };
export const HOLD_GRACE = 110;
export const POINTS: Record<Mark, number> = { perfect: 3, good: 2, near: 1, miss: 0, held: 3, dropped: 0, noise: -1 };
export const CROWD = { start: 70, max: 100, perfect: 4, good: 2, near: 0, miss: -8, held: 2, dropped: -6, noise: -4 } as const;
export const STARS = { one: 5000, two: 8000, three: 9200 } as const;
export const MAX_OFFSET = 250;
export const INHUMAN_SPREAD = 4;
export const INHUMAN_MIN_HITS = 30;

export type TapLog = { kind: "talent-taps"; version: 2; song: SongId; offset: number; assist: boolean; taps: number[]; ups: (number | null)[] };
export type JudgeInput = { taps: readonly number[]; ups: readonly (number | null)[]; offset: number; assist: boolean };

export type JudgeEvent = { at: number; mark: Mark; note: number | null; error: number | null; crowd: number };

export type Verdict = {
  grades: (Grade | null)[];
  tails: (Tail | null)[];
  errors: (number | null)[];
  releases: (number | null)[];
  events: JudgeEvent[];
  counts: Record<Mark, number>;
  points: number;
  maxPoints: number;
  precision: number;
  crowd: number;
  cutAt: number | null;
  finished: boolean;
  stars: number;
  streak: number;
  bestStreak: number;
  sections: { points: number; max: number; closed: boolean }[];
  timing: { hits: number; mean: number; spread: number };
  flags: string[];
};

type Raw = { at: number; mark: Mark; note: number | null; error: number | null; order: number };

export function windowsFor(assist: boolean) {
  return assist ? ASSIST_WINDOWS : WINDOWS;
}

function gradeFor(error: number, w: Windows): Exclude<Grade, "miss"> {
  const size = Math.abs(error);
  if (size <= w.perfect) return "perfect";
  if (size <= w.good) return "good";
  return "near";
}

export function judge(compiled: CompiledSong, input: JudgeInput, until = Infinity): Verdict {
  const { notes } = compiled;
  const w = windowsFor(input.assist);
  const firstAt = Math.min(notes[0]?.at ?? 0, compiled.calls[0]?.at ?? Infinity);
  const lastAt = notes[notes.length - 1]?.at ?? 0;
  const presses = input.taps
    .map((t, i) => {
      const up = input.ups[i];
      const release = up === null || up === undefined ? null : up - input.offset;
      return { t: t - input.offset, up: release !== null && release <= until ? release : null };
    })
    .filter((p) => p.t <= until && p.t >= firstAt - w.near && p.t <= lastAt + w.near)
    .sort((a, b) => a.t - b.t);
  const taps = presses.map((p) => p.t);

  const owner: (number | null)[] = notes.map(() => null);
  const ownerPress: (number | null)[] = notes.map(() => null);
  const raw: Raw[] = [];
  let start = 0;
  taps.forEach((t, order) => {
    while (start < notes.length && notes[start].at < t - w.near) start += 1;
    let best = -1;
    let bestSize = Infinity;
    for (let i = start; i < notes.length && notes[i].at <= t + w.near; i += 1) {
      if (owner[i] !== null) continue;
      const size = Math.abs(t - notes[i].at);
      if (size < bestSize) {
        best = i;
        bestSize = size;
      }
    }
    if (best < 0) {
      raw.push({ at: t, mark: "noise", note: null, error: null, order });
      return;
    }
    owner[best] = t;
    ownerPress[best] = order;
    const error = t - notes[best].at;
    raw.push({ at: t, mark: gradeFor(error, w), note: best, error, order });
  });
  const releases: (number | null)[] = notes.map(() => null);
  notes.forEach((note, i) => {
    const order = taps.length + i;
    const tap = owner[i];
    if (tap === null) {
      const closes = note.at + w.near;
      if (closes < until) raw.push({ at: closes, mark: "miss", note: i, error: null, order });
      return;
    }
    if (note.kind !== "hold") return;
    const release = presses[ownerPress[i] as number].up;
    releases[i] = release;
    if (release !== null && release < note.end - HOLD_GRACE) raw.push({ at: Math.max(tap, release), mark: "dropped", note: i, error: null, order });
    else if (release !== null) raw.push({ at: Math.min(release, note.end), mark: "held", note: i, error: null, order });
    else if (note.end <= until) raw.push({ at: note.end, mark: "held", note: i, error: null, order });
  });
  raw.sort((a, b) => a.at - b.at || a.order - b.order);

  const grades: (Grade | null)[] = notes.map(() => null);
  const tails: (Tail | null)[] = notes.map(() => null);
  const errors: (number | null)[] = notes.map(() => null);
  const counts: Record<Mark, number> = { perfect: 0, good: 0, near: 0, miss: 0, held: 0, dropped: 0, noise: 0 };
  const events: JudgeEvent[] = [];
  const sections = compiled.sections.map((s) => ({ points: 0, max: 0, closed: s.endMs <= until }));
  const sectionOf = (ms: number) => {
    const index = compiled.sections.findIndex((s, i) => ms < s.endMs || i === compiled.sections.length - 1);
    return index < 0 ? compiled.sections.length - 1 : index;
  };
  const noteMax = (i: number) => (notes[i].kind === "hold" ? POINTS.perfect + POINTS.held : POINTS.perfect);
  notes.forEach((note, i) => {
    const s = sections[sectionOf(note.at)];
    if (s) s.max += noteMax(i);
  });
  let crowd: number = CROWD.start;
  let cutAt: number | null = null;
  let points = 0;
  let streak = 0;
  let bestStreak = 0;
  const hitErrors: number[] = [];
  for (const e of raw) {
    crowd = Math.min(CROWD.max, crowd + CROWD[e.mark]);
    if (input.assist) crowd = Math.max(1, crowd);
    counts[e.mark] += 1;
    points += POINTS[e.mark];
    const section = sections[sectionOf(e.note === null ? e.at : notes[e.note].at)];
    if (section) section.points += POINTS[e.mark];
    if (e.note !== null) {
      if (e.mark === "held" || e.mark === "dropped") tails[e.note] = e.mark;
      else {
        grades[e.note] = e.mark as Grade;
        errors[e.note] = e.error;
      }
    }
    if (e.mark === "miss" || e.mark === "noise" || e.mark === "dropped") streak = 0;
    else if (e.mark !== "held") {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      if (e.error !== null) hitErrors.push(e.error);
    }
    events.push({ at: e.at, mark: e.mark, note: e.note, error: e.error, crowd: Math.max(0, crowd) });
    if (crowd <= 0) {
      crowd = 0;
      cutAt = e.at;
      break;
    }
  }

  const maxPoints = notes.reduce((sum, _, i) => sum + noteMax(i), 0);
  const precision = maxPoints > 0 ? Math.floor((Math.max(0, points) * 10000) / maxPoints) : 0;
  const finished = cutAt === null && until >= compiled.endMs;
  const stars = !finished || precision < STARS.one ? 0 : 1 + (precision >= STARS.two ? 1 : 0) + (precision >= STARS.three ? 1 : 0);
  const mean = hitErrors.length ? hitErrors.reduce((a, b) => a + b, 0) / hitErrors.length : 0;
  const spread = hitErrors.length ? Math.sqrt(hitErrors.reduce((a, b) => a + (b - mean) * (b - mean), 0) / hitErrors.length) : 0;
  const flags: string[] = [];
  if (hitErrors.length >= INHUMAN_MIN_HITS && spread < INHUMAN_SPREAD) flags.push("inhuman");
  if (input.assist) flags.push("assist");
  return {
    grades,
    tails,
    errors,
    releases,
    events,
    counts,
    points,
    maxPoints,
    precision,
    crowd,
    cutAt,
    finished,
    stars,
    streak,
    bestStreak,
    sections,
    timing: { hits: hitErrors.length, mean, spread },
    flags,
  };
}

function isSortedIntegers(list: unknown, max: number, limit: number) {
  if (!Array.isArray(list) || list.length > limit) return false;
  let previous = -Infinity;
  for (const t of list) {
    if (!Number.isInteger(t) || t < previous || t < -10000 || t > max) return false;
    previous = t;
  }
  return true;
}

export function isTapLog(value: unknown, compiled: CompiledSong): value is TapLog {
  if (!value || typeof value !== "object") return false;
  const log = value as Partial<TapLog>;
  if (log.kind !== "talent-taps" || log.version !== 2 || log.song !== compiled.song.id || typeof log.assist !== "boolean") return false;
  if (!Number.isInteger(log.offset) || Math.abs(log.offset as number) > MAX_OFFSET) return false;
  const limit = compiled.notes.length * 4 + 200;
  if (!isSortedIntegers(log.taps, compiled.endMs + 10000, limit) || !Array.isArray(log.ups) || log.ups.length !== log.taps!.length) return false;
  return log.ups.every((up, i) => up === null || (Number.isInteger(up) && up >= log.taps![i] && up <= compiled.endMs + 60000));
}

export function replay(compiled: CompiledSong, value: unknown): Verdict | null {
  if (!isTapLog(value, compiled)) return null;
  return judge(compiled, { taps: value.taps, ups: value.ups, offset: value.offset, assist: value.assist });
}
