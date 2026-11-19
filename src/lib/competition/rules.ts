import { GRID, PARTS, STEP_MS, type PartType } from "@/games/bad-ideas-lab/config";
import { placementConflict, type PlacedPart } from "@/games/bad-ideas-lab/geometry";
import { LEVELS as LAB_LEVELS } from "@/games/bad-ideas-lab/levels";
import { MAX_STEPS as LAB_MAX_STEPS, traceLab } from "@/games/bad-ideas-lab/sim";
import { AMMO, PROPS, STEP_MS as STREET_STEP_MS, TARGETS, WAVES } from "@/games/dead-end-street/config";
import { replayStreet } from "@/games/dead-end-street/sim";
import { AMMO_MAX, COUNTDOWN_MS, EVENTS, LIVES as LUNCH_LIVES, LUNCH_LADY, PHASES, RELOAD_MS, RIVALS, ROUND_MS, SCORE as LUNCH_SCORE, THROW_GAP_MS, type RivalKind } from "@/games/food-fight/config";
import { SCORE as RESORT_SCORE } from "@/games/off-air-vacation/config";
import { EXTRAS_CAP, HEARTS, RUN, SCORE as RECESS_SCORE, TILE } from "@/games/operation-recess/config";
import { LEVELS as RECESS_LEVELS } from "@/games/operation-recess/levels";
import { recessStars } from "@/games/operation-recess/score";
import { ARENAS } from "@/games/pajama-war/arenas";
import { HIT as PAJAMA_HIT, HP, KIDS, PILLOW, SCORE as PAJAMA_SCORE, STATS as KID_STATS } from "@/games/pajama-war/config";
import type { GameReplay, GameStats } from "@/games/types";
import type { Evidence } from "@/lib/missions/goals";
import { BOARD_META, GAME_SLUGS, isGameSlug, metricValues, type BoardMeta, type GameSlug, type Metric, type RankKey } from "./boards";

export { BOARD_META, GAME_SLUGS, isGameSlug, metricValues, type BoardMeta, type GameSlug, type Metric, type RankKey };


export type RunClaim = { won: boolean; score: number; stars: number; stats: GameStats; replay?: GameReplay };

export type RejectReason = "unknown_level" | "bad_stats" | "inconsistent" | "score_mismatch" | "bad_replay" | "replay_failed" | "bad_launches" | "launches_failed";

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
      evidence: Evidence;
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
  extra: Evidence = {},
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
    evidence: { ...extra, won: computed.won ? 1 : 0, score: computed.score },
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

const STREET_STATS = ["targets", "targetPoints", "waves", "mess", "combos", "launches", "ammoLeft"] as const;
const STREET_POINTS = TARGETS.reduce((sum, t) => sum + t.points, 0);

const deadEndStreet: GameRule = {
  game: "dead-end-street",
  version: 2,
  levels: null,
  stats: [...STREET_STATS, "timeMs"],
  judge(_level, claim) {
    const r = read(claim.stats, {
      targets: [0, TARGETS.length],
      targetPoints: [0, STREET_POINTS],
      waves: [0, WAVES.length],
      mess: [0, PROPS.length],
      combos: [0, TARGETS.length],
      launches: [0, AMMO.length],
      ammoLeft: [0, AMMO.length],
      timeMs: [0, 60 * 60 * 1000],
    });
    if (!r.ok) return reject("bad_stats", r.detail);
    const log = claim.replay;
    if (!log || log.kind !== "street-launches" || log.version !== 1 || !Array.isArray(log.launches)) return reject("bad_launches", "lançamentos ausentes");
    const replay = replayStreet(log.launches);
    if (!replay.ok) {
      if (replay.problem === "bad_log") return reject("bad_launches", "lançamentos fora das regras");
      return reject("launches_failed", replay.problem === "illegal_launch" ? "lançamento fora de hora" : "a partida refeita não terminou");
    }
    const t = replay.tally;
    const flags = STREET_STATS.every((key) => r.values[key] === t.stats[key]) ? [] : ["stats_mismatch"];
    return settle(
      claim,
      { won: t.won, score: t.score, stars: t.stars, rank: [t.score, -t.stats.launches, 0], minElapsedMs: replay.steps * STREET_STEP_MS },
      t.score > 0 ? undefined : "no_points",
      { verification: "replayed", flags },
      { launches: t.stats.launches, combos: t.stats.combos, mess: t.stats.mess },
    );
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
    const replay = traceLab(def, machine.parts);
    if (replay.outcome !== "success") return reject("replay_failed", `a máquina terminou em ${replay.outcome}`);
    const score = 1000 + (total - s.parts) * 150 + (s.runs === 1 ? 300 : 0);
    const stars = s.parts <= def.par ? 3 : s.parts === def.par + 1 ? 2 : 1;
    return settle(
      claim,
      { won: true, score, stars, rank: [-s.parts, -replay.steps, 0], minElapsedMs: replay.steps * STEP_MS },
      LAB_PRACTICE.has(level) ? "practice" : undefined,
      { verification: "replayed", flags: replay.steps === s.steps ? [] : ["steps_mismatch"] },
      { parts: s.parts, steps: replay.steps, untouched: s.parts - replay.touched.length },
    );
  },
};

const MAX_KNOCKOUT_POINTS = Math.max(...Object.values(RIVALS).map((r) => r.points)) * LUNCH_SCORE.brawlMultiplier;
const BIG_FIRST_HIT = 50;
const MIN_KNOCKOUT_POINTS = Math.min(...Object.values(RIVALS).map((r) => r.points));

function lunchLimits(timeMs: number) {
  const kinds = new Set<RivalKind>(["cap"]);
  let appearances = 0;
  PHASES.forEach((phase, i) => {
    if (phase.from > timeMs) return;
    const end = Math.min(timeMs, PHASES[i + 1]?.from ?? ROUND_MS);
    appearances += Math.floor((end - phase.from) / phase.gap[0]) + 1;
    if (phase.speedy > 0) kinds.add("speedy");
    if (phase.big > 0) kinds.add("big");
  });
  const brawl = timeMs >= EVENTS.brawlAt;
  const brawlHits = brawl ? Math.floor(Math.min(EVENTS.brawlMs, timeMs - EVENTS.brawlAt) / THROW_GAP_MS) + 1 : 0;
  if (brawl) {
    kinds.add("speedy");
    kinds.add("big");
  }
  return {
    hits: appearances + brawlHits,
    brawlHits,
    top: Math.max(...[...kinds].map((k) => RIVALS[k].points)),
    hurts: kinds.has("big"),
    throws: AMMO_MAX + Math.floor((timeMs + COUNTDOWN_MS) / RELOAD_MS) + 1,
    lady: timeMs >= LUNCH_LADY.times[0],
  };
}

function maxComboPoints(hits: number, bestStreak: number) {
  if (bestStreak < 2) return 0;
  const full = Math.floor(hits / bestStreak);
  const rest = hits % bestStreak;
  return (LUNCH_SCORE.comboStep * (full * bestStreak * (bestStreak - 1) + rest * (rest - 1))) / 2;
}

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
      lives: [0, LUNCH_LIVES],
      hitsTaken: [0, LUNCH_LIVES],
      lunchLadyHits: [0, 400],
      bestStreak: [0, 400],
      throws: [0, 4000],
      timeMs: [0, ROUND_MS + 5000],
    });
    if (!r.ok) return reject("bad_stats", r.detail);
    const s = r.values;
    const won = s.lives > 0;
    const limit = lunchLimits(s.timeMs);
    if (won && s.timeMs < ROUND_MS - 500) return reject("inconsistent", "o sinal tocou cedo demais");
    if (s.hitsTaken !== LUNCH_LIVES - s.lives) return reject("inconsistent", "guardanapos não conferem");
    if (s.throws < s.hits + s.lunchLadyHits) return reject("inconsistent", "acertos sem lanches");
    if (s.throws > limit.throws) return reject("inconsistent", "lanches demais para o tempo da rodada");
    if (s.hits > limit.hits) return reject("inconsistent", "colegas demais para o tempo da rodada");
    if (!limit.lady && s.lunchLadyHits > 0) return reject("inconsistent", "a merendeira ainda não tinha passado");
    if (s.interrupts > s.hits || s.bestStreak > s.hits) return reject("inconsistent", "acertos não conferem");
    if (s.interruptPoints !== s.interrupts * LUNCH_SCORE.interruptBonus) return reject("inconsistent", "bônus na hora H não confere");
    const softHits = limit.hurts ? s.throws - s.hits - s.lunchLadyHits : 0;
    const brawlExtra = RIVALS.big.points * (LUNCH_SCORE.brawlMultiplier - 1) * Math.min(s.hits, limit.brawlHits);
    if (s.hitPoints % BIG_FIRST_HIT !== 0 || s.hitPoints < s.hits * MIN_KNOCKOUT_POINTS || s.hitPoints > s.hits * limit.top + brawlExtra + softHits * BIG_FIRST_HIT) {
      return reject("inconsistent", "pontos de acertos impossíveis");
    }
    if (s.comboPoints % LUNCH_SCORE.comboStep !== 0 || s.comboPoints > maxComboPoints(s.hits, s.bestStreak)) {
      return reject("inconsistent", "sequências impossíveis");
    }
    if (s.comboPoints < (LUNCH_SCORE.comboStep * s.bestStreak * Math.max(0, s.bestStreak - 1)) / 2) return reject("inconsistent", "sequência maior que os pontos de sequência");
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
    return settle(
      claim,
      { won, score, stars, rank: [score, -s.hitsTaken, s.bestStreak], minElapsedMs: s.timeMs },
      score > 0 ? undefined : "no_points",
      undefined,
      { bestStreak: s.bestStreak, hitsTaken: s.hitsTaken, lunchLadyHits: s.lunchLadyHits, interrupts: s.interrupts },
    );
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
    const snacks = def.items.filter((i) => i.kind === "snack").length;
    const r = read(claim.stats, {
      kills: [0, def.enemies.length * 2],
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
    if (!won && s.hearts !== 0) return reject("inconsistent", "pego com corações sobrando");
    if (s.hearts + s.hits < HEARTS) return reject("inconsistent", "corações perdidos sem batidas");
    if (!s.resumed && s.hearts + s.hits > HEARTS + snacks) return reject("inconsistent", "corações demais para os lanches da fase");
    if (!s.resumed && s.kills > def.enemies.length) return reject("inconsistent", "monitores demais");
    if (s.extras > 0 && !def.enemies.some((e) => e.kind === "whistle") && !def.balls?.length && !def.boss) return reject("inconsistent", "ondas numa fase sem apito");
    const kinds = def.enemies.map((e) => e.kind);
    if (!killSums(s.resumed ? [...kinds, ...kinds] : kinds, s.kills).has(s.killPoints)) return reject("inconsistent", "pontos de monitores impossíveis");
    const goal = def.exit?.col ?? def.boss?.arena ?? def.length;
    const minRunMs = (Math.max(0, goal - def.start) * TILE * 1000) / RUN;
    if (won && !s.resumed && s.timeMs < minRunMs * 0.9) return reject("inconsistent", "rápido demais para as pernas do Bruno");
    const score =
      s.killPoints +
      s.stickers * RECESS_SCORE.sticker +
      s.extras * RECESS_SCORE.wave +
      (won ? RECESS_SCORE.phase + (s.resumed ? 0 : s.hearts * RECESS_SCORE.heart) + (s.boss ? RECESS_SCORE.boss : 0) : 0);
    const stars = recessStars({ won, hits: s.hits, kills: s.kills, monitors: def.enemies.length });
    const ineligible: IneligibleReason | undefined = !won ? "not_won" : s.resumed ? "resumed" : undefined;
    return settle(claim, { won, score, stars, rank: [-s.hits, -s.timeMs, score], minElapsedMs: s.timeMs }, ineligible, undefined, {
      bumps: s.hits,
      resumed: s.resumed,
      stickersLeft: stickers - s.stickers,
      monitorsLeft: Math.max(0, def.enemies.length - s.kills),
    });
  },
};

const PAJAMA_SLACK = 0.95;

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
    if (s.hp + s.damageTaken < HP) return reject("inconsistent", "energia perdida sem travesseiradas");
    if (s.damageTaken === 0 && s.hp !== HP) return reject("inconsistent", "energia faltando sem travesseiradas");
    if (s.kos > 3 - s.place) return reject("inconsistent", "nocautes demais para a colocação");
    const cooldown = KID_STATS[KIDS[s.kid]].cooldown;
    if (s.throws > 0 && s.timeMs < (PILLOW.windup + (s.throws - 1) * (cooldown + PILLOW.windup)) * PAJAMA_SLACK) return reject("inconsistent", "travesseiros rápidos demais");
    if (s.timeMs < (s.damageTaken - 1) * PAJAMA_HIT.invulnPlayer * PAJAMA_SLACK) return reject("inconsistent", "travesseiradas rápidas demais");
    if (won && s.timeMs < (HP - 1) * PAJAMA_HIT.invuln * PAJAMA_SLACK) return reject("inconsistent", "guerra curta demais");
    const score = s.hits * PAJAMA_SCORE.hit + s.kos * PAJAMA_SCORE.ko + (won ? PAJAMA_SCORE.win + s.hp * PAJAMA_SCORE.hp : s.place === 2 ? PAJAMA_SCORE.second : 0);
    const stars = won ? (s.hp >= 7 ? 3 : s.hp >= 4 ? 2 : 1) : 0;
    return settle(claim, { won, score, stars, rank: [s.hp, -s.timeMs, s.hits], minElapsedMs: s.timeMs }, won ? undefined : "not_won", undefined, {
      damageTaken: s.damageTaken,
      kos: s.kos,
      hp: s.hp,
      kid: s.kid,
    });
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

