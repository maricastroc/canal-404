import { GRID, PARTS, STEP_MS, type PartType } from "@/games/bad-ideas-lab/config";
import { placementConflict, type PlacedPart } from "@/games/bad-ideas-lab/geometry";
import { LEVELS as LAB_LEVELS } from "@/games/bad-ideas-lab/levels";
import { MAX_STEPS as LAB_MAX_STEPS, simulateLab } from "@/games/bad-ideas-lab/sim";
import { AMMO, PROPS, SCORE as STREET_SCORE, TARGETS, WAVES } from "@/games/dead-end-street/config";
import { ROUND_MS, RIVALS, SCORE as LUNCH_SCORE } from "@/games/food-fight/config";
import { SCORE as RESORT_SCORE } from "@/games/off-air-vacation/config";
import { EXTRAS_CAP, HEARTS, RUN, SCORE as RECESS_SCORE, TILE } from "@/games/operation-recess/config";
import { LEVELS as RECESS_LEVELS } from "@/games/operation-recess/levels";
import { ARENAS } from "@/games/pajama-war/arenas";
import { HP, KIDS, SCORE as PAJAMA_SCORE, STATS as KID_STATS } from "@/games/pajama-war/config";
import type { GameReplay, GameStats } from "@/games/types";
import { BOARD_META, GAME_SLUGS, isGameSlug, metricValues, type BoardMeta, type GameSlug, type Metric, type RankKey } from "./boards";

export { BOARD_META, GAME_SLUGS, isGameSlug, metricValues, type BoardMeta, type GameSlug, type Metric, type RankKey };


export type RunClaim = { won: boolean; score: number; stars: number; stats: GameStats; replay?: GameReplay };

export type RejectReason = "unknown_level" | "bad_stats" | "inconsistent" | "score_mismatch" | "bad_replay" | "replay_failed";

export type Verification = "checked" | "replayed";

export type IneligibleReason = "practice" | "not_won" | "resumed" | "no_points";

export type Verdict =
  | {
      ok: true;
      won: boolean;
      score: number;
      stars: number;
      rank: RankKey;
      eligible: boolean;
      ineligible?: IneligibleReason;
      minElapsedMs: number;
      verification: Verification;
      flags: string[];
    }
  | { ok: false; reason: RejectReason; detail: string };

export type GameRule = {
  game: GameSlug;
  version: number;
  levels: readonly string[] | null;
  stats: readonly string[];
  judge: (level: string | null, claim: RunClaim) => Verdict;
};

type Read<K extends string> = { ok: true; values: Record<K, number> } | { ok: false; detail: string };

const INT_LIMIT = 2_000_000_000;

function read<K extends string>(stats: GameStats, ranges: Record<K, readonly [number, number]>): Read<K> {
  const values = {} as Record<K, number>;
  for (const key of Object.keys(ranges) as K[]) {
    const value = stats[key];
    const [min, max] = ranges[key];
    if (typeof value !== "number" || !Number.isInteger(value)) return { ok: false, detail: `${key} ausente` };
    if (value < min || value > max) return { ok: false, detail: `${key} fora do intervalo` };
    values[key] = value;
  }
  return { ok: true, values };
}

function reject(reason: RejectReason, detail: string): Verdict {
  return { ok: false, reason, detail };
}

function settle(
  claim: RunClaim,
  computed: { won: boolean; score: number; stars: number; rank: RankKey; minElapsedMs: number },
  ineligible?: IneligibleReason,
  check: { verification: Verification; flags: string[] } = { verification: "checked", flags: [] },
): Verdict {
  if (claim.won !== computed.won) return reject("inconsistent", "vitória não confere");
  if (claim.score !== computed.score) return reject("score_mismatch", "pontuação não confere");
  if (claim.stars !== computed.stars) return reject("score_mismatch", "estrelas não conferem");
  return {
    ok: true,
    won: computed.won,
    score: computed.score,
    stars: computed.stars,
    rank: computed.rank,
    eligible: !ineligible,
    ...(ineligible ? { ineligible } : {}),
    minElapsedMs: Math.max(0, Math.round(computed.minElapsedMs)),
    verification: check.verification,
    flags: check.flags,
  };
}

function subsetSums(values: number[], size: number) {
  const out = new Set<number>();
  const walk = (start: number, left: number, sum: number) => {
    if (left === 0) {
      out.add(sum);
      return;
    }
    for (let i = start; i < values.length; i += 1) walk(i + 1, left - 1, sum + values[i]);
  };
  walk(0, size, 0);
  return out;
}

const WAVE_COUNT = WAVES.length;
const TARGETS_BY_WAVE = Array.from({ length: WAVE_COUNT }, (_, i) => TARGETS.filter((t) => t.wave === i + 1).map((t) => t.points));
const TARGETS_BEFORE = TARGETS_BY_WAVE.reduce<number[]>((acc, wave) => [...acc, acc[acc.length - 1] + wave.length], [0]);
const POINTS_BEFORE = TARGETS_BY_WAVE.reduce<number[]>((acc, wave) => [...acc, acc[acc.length - 1] + wave.reduce((a, b) => a + b, 0)], [0]);
const MIN_SHOT_MS = 700;

const deadEndStreet: GameRule = {
  game: "dead-end-street",
  version: 1,
  levels: null,
  stats: ["targets", "targetPoints", "waves", "mess", "combos", "launches", "ammoLeft", "timeMs"],
  judge(_level, claim) {
    const r = read(claim.stats, {
      targets: [0, TARGETS.length],
      targetPoints: [0, POINTS_BEFORE[WAVE_COUNT]],
      waves: [0, WAVE_COUNT],
      mess: [0, PROPS.length],
      combos: [0, TARGETS.length],
      launches: [0, AMMO.length],
      ammoLeft: [0, AMMO.length],
      timeMs: [0, 60 * 60 * 1000],
    });
    if (!r.ok) return reject("bad_stats", r.detail);
    const s = r.values;
    const won = s.waves === WAVE_COUNT;
    if (s.targets < TARGETS_BEFORE[s.waves]) return reject("inconsistent", "rodada concluída sem todos os alvos");
    const open = s.waves < WAVE_COUNT ? TARGETS_BY_WAVE[s.waves] : [];
    const extra = s.targets - TARGETS_BEFORE[s.waves];
    if (extra > open.length) return reject("inconsistent", "alvos de uma rodada que não começou");
    if (!subsetSums(open, extra).has(s.targetPoints - POINTS_BEFORE[s.waves])) return reject("inconsistent", "pontos de alvos impossíveis");
    if (s.combos > Math.max(0, s.targets - 1)) return reject("inconsistent", "combos demais");
    if (won && s.launches + s.ammoLeft !== AMMO.length) return reject("inconsistent", "munição não confere");
    if (!won && (s.ammoLeft !== 0 || s.launches !== AMMO.length)) return reject("inconsistent", "derrota com munição sobrando");
    if (s.timeMs < s.launches * MIN_SHOT_MS) return reject("inconsistent", "lançamentos rápidos demais");
    const score =
      s.targetPoints +
      s.combos * STREET_SCORE.comboBonus +
      s.waves * STREET_SCORE.waveBonus +
      s.mess * STREET_SCORE.messBonus +
      (won ? s.ammoLeft * STREET_SCORE.ammoBonus : 0);
    const stars = won ? (score >= STREET_SCORE.threeStars ? 3 : score >= STREET_SCORE.twoStars ? 2 : 1) : 0;
    return settle(claim, { won, score, stars, rank: [score, -s.launches, 0], minElapsedMs: s.timeMs }, score > 0 ? undefined : "no_points");
  },
};

const LAB_PRACTICE = new Set(BOARD_META["bad-ideas-lab"].practice);
const PART_TYPES = new Set<string>(Object.keys(PARTS));

function labPlacements(levelId: string, replay: GameReplay | undefined): { ok: true; parts: PlacedPart[] } | { ok: false; detail: string } {
  const level = LAB_LEVELS.find((l) => l.id === levelId)!;
  if (!replay || replay.kind !== "lab-placements" || replay.version !== 1 || !Array.isArray(replay.parts)) return { ok: false, detail: "máquina ausente" };
  const placed: PlacedPart[] = [];
  const used: Partial<Record<PartType, number>> = {};
  for (const part of replay.parts) {
    if (!PART_TYPES.has(part.type)) return { ok: false, detail: "peça desconhecida" };
    const type = part.type as PartType;
    if (![part.x, part.y, part.rot].every(Number.isInteger)) return { ok: false, detail: "posição inválida" };
    if (part.x % GRID !== 0 || part.y % GRID !== 0) return { ok: false, detail: "peça fora da grade" };
    if (part.rot < 0 || part.rot >= PARTS[type].rotations.length) return { ok: false, detail: "rotação inválida" };
    used[type] = (used[type] ?? 0) + 1;
    if ((used[type] ?? 0) > (level.inventory[type] ?? 0)) return { ok: false, detail: "peças além do estoque" };
    const next: PlacedPart = { type, x: part.x, y: part.y, rot: part.rot };
    if (placementConflict(level, placed, next)) return { ok: false, detail: "peça em lugar proibido" };
    placed.push(next);
  }
  return { ok: true, parts: placed };
}

const badIdeasLab: GameRule = {
  game: "bad-ideas-lab",
  version: 1,
  levels: LAB_LEVELS.map((l) => l.id),
  stats: ["parts", "inventory", "par", "runs", "steps"],
  judge(level, claim) {
    const def = LAB_LEVELS.find((l) => l.id === level);
    if (!def || !level) return reject("unknown_level", "fase desconhecida");
    const total = Object.values(def.inventory).reduce((a, b) => a + (b ?? 0), 0);
    const r = read(claim.stats, {
      parts: [0, total],
      inventory: [total, total],
      par: [def.par, def.par],
      runs: [1, 100_000],
      steps: [1, LAB_MAX_STEPS],
    });
    if (!r.ok) return reject("bad_stats", r.detail);
    const s = r.values;
    const machine = labPlacements(level, claim.replay);
    if (!machine.ok) return reject("bad_replay", machine.detail);
    if (machine.parts.length !== s.parts) return reject("inconsistent", "número de peças não confere");
    const replay = simulateLab(def, machine.parts);
    if (replay.outcome !== "success") return reject("replay_failed", `a máquina terminou em ${replay.outcome}`);
    const score = 1000 + (total - s.parts) * 150 + (s.runs === 1 ? 300 : 0);
    const stars = s.parts <= def.par ? 3 : s.parts === def.par + 1 ? 2 : 1;
    return settle(
      claim,
      { won: true, score, stars, rank: [-s.parts, -replay.steps, 0], minElapsedMs: replay.steps * STEP_MS },
      LAB_PRACTICE.has(level) ? "practice" : undefined,
      { verification: "replayed", flags: replay.steps === s.steps ? [] : ["steps_mismatch"] },
    );
  },
};

const MAX_KNOCKOUT_POINTS = Math.max(...Object.values(RIVALS).map((r) => r.points)) * LUNCH_SCORE.brawlMultiplier;
const BIG_FIRST_HIT = 50;
const MIN_KNOCKOUT_POINTS = Math.min(...Object.values(RIVALS).map((r) => r.points));
const LIVES = 3;

const foodFight: GameRule = {
  game: "food-fight",
  version: 1,
  levels: null,
  stats: ["hits", "hitPoints", "interrupts", "interruptPoints", "comboPoints", "lives", "hitsTaken", "lunchLadyHits", "bestStreak", "throws", "timeMs"],
  judge(_level, claim) {
    const r = read(claim.stats, {
      hits: [0, 400],
      hitPoints: [0, 400 * MAX_KNOCKOUT_POINTS + 4000 * BIG_FIRST_HIT],
      interrupts: [0, 400],
      interruptPoints: [0, 400 * LUNCH_SCORE.interruptBonus],
      comboPoints: [0, LUNCH_SCORE.comboStep * 400 * 400],
      lives: [0, LIVES],
      hitsTaken: [0, 400],
      lunchLadyHits: [0, 400],
      bestStreak: [0, 400],
      throws: [0, 4000],
      timeMs: [0, ROUND_MS + 5000],
    });
    if (!r.ok) return reject("bad_stats", r.detail);
    const s = r.values;
    const won = s.lives > 0;
    if (won && s.timeMs < ROUND_MS - 500) return reject("inconsistent", "o sinal tocou cedo demais");
    if (s.hitsTaken < LIVES - s.lives) return reject("inconsistent", "guardanapos não conferem");
    if (s.throws < s.hits + s.lunchLadyHits) return reject("inconsistent", "acertos sem lanches");
    if (s.interrupts > s.hits || s.bestStreak > s.hits) return reject("inconsistent", "acertos não conferem");
    if (s.interruptPoints !== s.interrupts * LUNCH_SCORE.interruptBonus) return reject("inconsistent", "bônus na hora H não confere");
    const softHits = s.throws - s.hits - s.lunchLadyHits;
    if (s.hitPoints % BIG_FIRST_HIT !== 0 || s.hitPoints < s.hits * MIN_KNOCKOUT_POINTS || s.hitPoints > s.hits * MAX_KNOCKOUT_POINTS + softHits * BIG_FIRST_HIT) {
      return reject("inconsistent", "pontos de acertos impossíveis");
    }
    if (s.comboPoints % LUNCH_SCORE.comboStep !== 0 || s.comboPoints > (LUNCH_SCORE.comboStep * s.hits * Math.max(0, s.hits - 1)) / 2) {
      return reject("inconsistent", "sequências impossíveis");
    }
    const score = Math.max(
      0,
      s.hitPoints +
        s.interruptPoints +
        s.comboPoints +
        (won ? s.lives * LUNCH_SCORE.lifeBonus : 0) +
        (won && s.hitsTaken === 0 ? LUNCH_SCORE.cleanBonus : 0) -
        s.lunchLadyHits * LUNCH_SCORE.lunchLadyPenalty,
    );
    const stars = won ? (score >= LUNCH_SCORE.threeStars ? 3 : score >= LUNCH_SCORE.twoStars ? 2 : 1) : 0;
    return settle(claim, { won, score, stars, rank: [score, -s.hitsTaken, s.bestStreak], minElapsedMs: s.timeMs }, score > 0 ? undefined : "no_points");
  },
};

const KILL_POINTS = { common: RECESS_SCORE.common, whistle: RECESS_SCORE.whistle, shield: RECESS_SCORE.shield } as const;

function killSums(kinds: (keyof typeof KILL_POINTS)[], kills: number) {
  return subsetSums(
    kinds.map((k) => KILL_POINTS[k]),
    kills,
  );
}

const operationRecess: GameRule = {
  game: "operation-recess",
  version: 1,
  levels: RECESS_LEVELS.map((l) => l.id),
  stats: ["kills", "killPoints", "stickers", "extras", "hits", "hearts", "resumed", "boss", "timeMs"],
  judge(level, claim) {
    const def = RECESS_LEVELS.find((l) => l.id === level);
    if (!def) return reject("unknown_level", "fase desconhecida");
    const stickers = def.items.filter((i) => i.kind === "sticker").length;
    const r = read(claim.stats, {
      kills: [0, def.enemies.length],
      killPoints: [0, def.enemies.length * RECESS_SCORE.shield],
      stickers: [0, stickers],
      extras: [0, EXTRAS_CAP],
      hits: [0, 500],
      hearts: [0, HEARTS],
      resumed: [0, 1],
      boss: [0, 1],
      timeMs: [0, 60 * 60 * 1000],
    });
    if (!r.ok) return reject("bad_stats", r.detail);
    const s = r.values;
    const won = claim.won;
    if (s.boss !== (won && def.boss ? 1 : 0)) return reject("inconsistent", "chefe não confere");
    if (won && s.hearts < 1) return reject("inconsistent", "vitória sem corações");
    if (!killSums(def.enemies.map((e) => e.kind), s.kills).has(s.killPoints)) return reject("inconsistent", "pontos de monitores impossíveis");
    const goal = def.exit?.col ?? def.boss?.arena ?? def.length;
    const minRunMs = (Math.max(0, goal - def.start) * TILE * 1000) / RUN;
    if (won && !s.resumed && s.timeMs < minRunMs * 0.9) return reject("inconsistent", "rápido demais para as pernas do Bruno");
    const score =
      s.killPoints +
      s.stickers * RECESS_SCORE.sticker +
      s.extras * RECESS_SCORE.wave +
      (won ? RECESS_SCORE.phase + (s.resumed ? 0 : s.hearts * RECESS_SCORE.heart) + (s.boss ? RECESS_SCORE.boss : 0) : 0);
    const stars = won ? (s.hits <= 1 ? 3 : s.hits <= 3 ? 2 : 1) : 0;
    const ineligible: IneligibleReason | undefined = !won ? "not_won" : s.resumed ? "resumed" : undefined;
    return settle(claim, { won, score, stars, rank: [-s.hits, -s.timeMs, score], minElapsedMs: s.timeMs }, ineligible);
  },
};

const pajamaWar: GameRule = {
  game: "pajama-war",
  version: 1,
  levels: ARENAS.map((a) => a.id),
  stats: ["hits", "kos", "throws", "hp", "damageTaken", "place", "timeMs", "kid"],
  judge(level, claim) {
    if (!ARENAS.some((a) => a.id === level)) return reject("unknown_level", "arena desconhecida");
    const r = read(claim.stats, {
      hits: [0, 2000],
      kos: [0, 2],
      throws: [0, 5000],
      hp: [0, HP],
      damageTaken: [0, 2000],
      place: [1, 3],
      timeMs: [0, 60 * 60 * 1000],
      kid: [0, KIDS.length - 1],
    });
    if (!r.ok) return reject("bad_stats", r.detail);
    const s = r.values;
    const won = s.place === 1;
    if (won && s.hp < 1) return reject("inconsistent", "vitória sem energia");
    if (!won && s.hp !== 0) return reject("inconsistent", "derrota com energia");
    if (s.hits > s.throws || s.kos > s.hits) return reject("inconsistent", "acertos sem travesseiros");
    const cooldown = KID_STATS[KIDS[s.kid]].cooldown;
    if (s.throws > 1 && s.timeMs < (s.throws - 1) * cooldown * 0.9) return reject("inconsistent", "travesseiros rápidos demais");
    const score = s.hits * PAJAMA_SCORE.hit + s.kos * PAJAMA_SCORE.ko + (won ? PAJAMA_SCORE.win + s.hp * PAJAMA_SCORE.hp : s.place === 2 ? PAJAMA_SCORE.second : 0);
    const stars = won ? (s.hp >= 7 ? 3 : s.hp >= 4 ? 2 : 1) : 0;
    return settle(claim, { won, score, stars, rank: [s.hp, -s.timeMs, s.hits], minElapsedMs: s.timeMs }, won ? undefined : "not_won");
  },
};

const RESORT_MIN_MS = 60_000;

const offAirVacation: GameRule = {
  game: "off-air-vacation",
  version: 1,
  levels: null,
  stats: ["posters", "tokens", "secrets", "discoveries", "met", "ending", "timeMs"],
  judge(_level, claim) {
    const r = read(claim.stats, {
      posters: [0, 5],
      tokens: [0, 3],
      secrets: [0, 3],
      discoveries: [0, 64],
      met: [0, 64],
      ending: [0, 1],
      timeMs: [RESORT_MIN_MS, INT_LIMIT],
    });
    if (!r.ok) return reject("bad_stats", r.detail);
    const s = r.values;
    const score = RESORT_SCORE.mystery + s.posters * RESORT_SCORE.poster + s.tokens * RESORT_SCORE.token + s.secrets * RESORT_SCORE.secret;
    const stars = 1 + (s.posters >= 3 ? 1 : 0) + (s.secrets >= 2 ? 1 : 0);
    return settle(claim, { won: true, score, stars, rank: [score, -s.timeMs, s.discoveries], minElapsedMs: 0 });
  },
};

export const RULES: Record<GameSlug, GameRule> = {
  "dead-end-street": deadEndStreet,
  "bad-ideas-lab": badIdeasLab,
  "food-fight": foodFight,
  "operation-recess": operationRecess,
  "pajama-war": pajamaWar,
  "off-air-vacation": offAirVacation,
};

export function hasLevel(game: GameSlug, level: string | null) {
  const levels = RULES[game].levels;
  return levels ? level !== null && levels.includes(level) : level === null;
}

export function boardId(game: GameSlug, level: string | null, version = RULES[game].version) {
  return `${game}/${level ?? "all"}/v${version}`;
}

export function judgeRun(game: GameSlug, level: string | null, claim: RunClaim): Verdict {
  if (!hasLevel(game, level)) return reject("unknown_level", "fase desconhecida");
  return RULES[game].judge(level, claim);
}

