import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { config } from "dotenv";
import {
  BOARD_META,
  GAME_SLUGS,
  isFinishersBoard,
  isGameSlug,
  type GameSlug,
  type RankKey,
} from "@/lib/competition/boards";
import { checkNickname, suggestNickname } from "@/lib/competition/nickname";
import { HP, KIDS, PILLOW, SCORE as PAJAMA_SCORE, STATS as KID_STATS } from "@/games/pajama-war/config";
import type { GameStats } from "@/games/types";
import { boardId, RULES } from "@/lib/competition/rules";
import { closeDb, getDb, type Db } from "@/server/db";
import { hashToken, newToken, saveWithFreeTag } from "@/server/identity";

config({ path: [".env.local", ".env"], quiet: true });

const SEED_FLAG = "seed";
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const SAME_SCORE_GAMES = new Set<GameSlug>([
  "dead-end-street",
  "food-fight",
  "talent-show",
]);

type Anchor = { rank: RankKey; score: number; stars: number };
type Board = {
  id: string;
  game: GameSlug;
  level: string;
  version: number;
  best: Anchor | null;
  runs: Anchor[];
};
type Entry = {
  board: Board;
  rank: RankKey;
  score: number;
  stars: number;
  stats: GameStats;
  at: Date;
};
type Fresh = { rank: RankKey; score: number; stars: number; stats: GameStats };
type FreshMaker = (levelIndex: number) => Fresh;

const { values: args } = parseArgs({
  options: {
    players: { type: "string", default: "30" },
    play: { type: "string", default: "0.6" },
    spread: { type: "string", default: "0.6" },
    days: { type: "string", default: "21" },
    game: { type: "string", multiple: true },
    remove: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    yes: { type: "boolean", default: false },
  },
});

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function numberArg(name: keyof typeof args, min: number, max: number) {
  const value = Number(args[name]);
  if (!Number.isFinite(value) || value < min || value > max)
    fail(`--${name} must be between ${min} and ${max}.`);
  return value;
}

const random = Math.random;

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function compare(a: RankKey, b: RankKey) {
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

function parseBoard(
  id: string,
): { game: GameSlug; level: string; version: number } | null {
  const [game, level, version] = id.split("/");
  if (!isGameSlug(game) || !level || !version?.startsWith("v")) return null;
  const parsed = { game, level, version: Number(version.slice(1)) };
  return boardId(game, level === "all" ? null : level) === id ? parsed : null;
}

function steps(boards: Board[]) {
  const result = new Map<GameSlug, RankKey>();
  for (const game of GAME_SLUGS) {
    const values = boards
      .filter((b) => b.game === game)
      .flatMap((b) => b.runs.map((r) => r.rank));
    const metrics = BOARD_META[game].metrics;
    const step = [0, 1, 2].map((i) => {
      const nonzero = [
        ...new Set(values.map((v) => Math.abs(v[i])).filter((v) => v > 0)),
      ];
      const found = nonzero.reduce((acc, v) => gcd(acc, v), 0);
      const fallback = metrics[i]?.unit === "points" ? 5 : 1;
      return nonzero.length >= 3 && found > 0 ? found : fallback;
    });
    result.set(game, step as RankKey);
  }
  return result;
}

function worsen(
  value: number,
  step: number,
  spread: number,
  lowerIsBetter: boolean,
) {
  const span = Math.max(Math.abs(value) * spread, step * 3);
  const delta = Math.round((random() * span) / step) * step;
  return lowerIsBetter ? value - delta : Math.max(0, value - delta);
}

function pick(min: number, max: number) {
  return min + random() * (max - min);
}

const PAJAMA_BASE_SECONDS = [64, 72, 78, 86];

function freshPajamaWar(levelIndex: number): Fresh {
  const skill = random() ** 0.8;
  const kid = Math.floor(random() * KIDS.length);
  const hp = Math.max(1, Math.min(HP - 2, Math.round(1 + skill * 7.5 + pick(-1.5, 1.8))));
  const damageTaken = HP - hp + Math.floor(random() * 4);
  const base = PAJAMA_BASE_SECONDS[Math.min(levelIndex, PAJAMA_BASE_SECONDS.length - 1)];
  const timeMs = Math.round(base * (1.25 - 0.35 * skill) * pick(0.9, 1.12) * 1000);
  const kos = random() < 0.65 ? 2 : random() < 0.8 ? 1 : 0;
  const hits = Math.max(kos, Math.round((timeMs / 60000) * (13 + 12 * skill + pick(0, 4))));
  const cooldown = KID_STATS[KIDS[kid]].cooldown;
  const maxThrows = Math.floor(timeMs / (cooldown + PILLOW.windup));
  const throws = Math.min(maxThrows, Math.max(hits, Math.round(hits / pick(0.42, 0.7))));
  const score = hits * PAJAMA_SCORE.hit + kos * PAJAMA_SCORE.ko + PAJAMA_SCORE.win + hp * PAJAMA_SCORE.hp;
  const stars = hp >= 7 ? 3 : hp >= 4 ? 2 : 1;
  return {
    rank: [hp, -timeMs, hits],
    score,
    stars,
    stats: { hits, kos, throws, hp, damageTaken, place: 1, timeMs, kid },
  };
}

const FRESH: Partial<Record<GameSlug, FreshMaker>> = {
  "pajama-war": freshPajamaWar,
};

function freshBoards(boards: Board[], games: Set<GameSlug>) {
  const known = new Set(boards.map((b) => b.id));
  const added: Board[] = [];
  for (const game of games) {
    if (!FRESH[game]) continue;
    const rule = RULES[game];
    for (const level of rule.levels ?? [null]) {
      const id = boardId(game, level);
      if (known.has(id)) continue;
      added.push({ id, game, level: level ?? "all", version: rule.version, best: null, runs: [] });
    }
  }
  return added;
}

function freshEntry(board: Board, at: Date): Entry {
  const levels = RULES[board.game].levels;
  const index = levels ? levels.indexOf(board.level) : 0;
  return { board, ...FRESH[board.game]!(Math.max(0, index)), at };
}

function seedEntry(
  board: Board,
  step: RankKey,
  spread: number,
  at: Date,
): Entry | null {
  if (!board.best) return FRESH[board.game] ? freshEntry(board, at) : null;
  const best = board.best;
  const metrics = BOARD_META[board.game].metrics;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const rank = [0, 1, 2].map((i) =>
      metrics[i]
        ? worsen(best.rank[i], step[i], spread, metrics[i].lowerIsBetter)
        : best.rank[i],
    ) as RankKey;
    if (!isFinishersBoard(board.game) && compare(rank, best.rank) >= 0)
      continue;
    const primary = best.rank[0];
    const ratio =
      primary === 0
        ? 1
        : metrics[0].lowerIsBetter
          ? primary / rank[0]
          : rank[0] / primary;
    const score = SAME_SCORE_GAMES.has(board.game)
      ? Math.max(0, rank[0])
      : Math.max(0, Math.round(best.score * Math.min(1, ratio)));
    const notBetter = board.runs
      .filter((r) => compare(r.rank, rank) <= 0)
      .sort((a, b) => compare(b.rank, a.rank));
    const stars =
      notBetter[0]?.stars ?? Math.min(...board.runs.map((r) => r.stars));
    return { board, rank, score, stars, stats: {}, at };
  }
  return null;
}

function seedNickname() {
  for (let i = 0; i < 20; i += 1) {
    const check = checkNickname(
      suggestNickname(random, random() < 0.8 ? "pt-BR" : "en"),
    );
    if (check.ok) return check;
  }
  fail("Could not draw a valid nickname.");
}

async function loadBoards(db: Db, games: Set<GameSlug>) {
  const rows = await db.run.findMany({
    where: {
      board: { not: null },
      eligible: true,
      verification: { not: "rejected" },
      NOT: { flags: { has: SEED_FLAG } },
      player: { status: "active" },
    },
    select: {
      board: true,
      rank1: true,
      rank2: true,
      rank3: true,
      score: true,
      stars: true,
    },
  });
  const boards = new Map<string, Board>();
  for (const row of rows) {
    const parsed = row.board ? parseBoard(row.board) : null;
    if (!parsed || !games.has(parsed.game)) continue;
    const anchor: Anchor = {
      rank: [row.rank1, row.rank2, row.rank3],
      score: row.score,
      stars: row.stars,
    };
    const board: Board = boards.get(row.board!) ?? {
      id: row.board!,
      ...parsed,
      best: anchor,
      runs: [],
    };
    board.runs.push(anchor);
    if (!board.best || compare(anchor.rank, board.best.rank) > 0) board.best = anchor;
    boards.set(board.id, board);
  }
  return [...boards.values()].sort((a, b) => a.id.localeCompare(b.id));
}

async function seedPlayer(db: Db, entries: Entry[]) {
  const nickname = seedNickname();
  const first = Math.min(...entries.map((e) => e.at.getTime()));
  const last = Math.max(...entries.map((e) => e.at.getTime()));
  const player = await saveWithFreeTag(db, nickname.key, (tag) =>
    db.$transaction(async (tx) => {
      const created = await tx.player.create({
        data: {
          tokenHash: hashToken(newToken()),
          nickname: nickname.nickname,
          nicknameKey: nickname.key,
          tag,
          createdAt: new Date(first - random() * 6 * HOUR),
          lastSeenAt: new Date(last),
        },
      });
      for (const entry of entries) {
        const { board, rank, score, stars, stats, at } = entry;
        const run = await tx.run.create({
          data: {
            ticketId: randomUUID(),
            playerId: created.id,
            game: board.game,
            level: board.level === "all" ? "-" : board.level,
            board: board.id,
            won: true,
            score,
            stars,
            stats,
            rank1: rank[0],
            rank2: rank[1],
            rank3: rank[2],
            verification: "checked",
            eligible: true,
            flags: [SEED_FLAG],
            rulesVersion: board.version,
            client: null,
            startedAt: new Date(at.getTime() - (2 + random() * 8) * 60 * 1000),
            createdAt: at,
          },
        });
        await tx.personalBest.create({
          data: {
            playerId: created.id,
            board: board.id,
            runId: run.id,
            rank1: rank[0],
            rank2: rank[1],
            rank3: rank[2],
            score,
            stars,
            stats,
            achievedAt: at,
          },
        });
      }
      return created;
    }),
  );
  return `${nickname.nickname}#${player.tag}`;
}

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) fail("Set DATABASE_URL (or DATABASE_URL_UNPOOLED).");
  const host = new URL(url).hostname;
  const local = ["localhost", "127.0.0.1", "::1"].includes(host);
  const writes = !args["dry-run"];
  if (writes && !local && !args.yes)
    fail(`This writes to ${host}. Run it again with --yes to confirm.`);
  console.log(`Database: ${host}`);
  const db = getDb(url);
  try {
    if (args.remove) {
      const where = { runs: { some: { flags: { has: SEED_FLAG } } } };
      if (!writes) {
        console.log(
          `Would remove ${await db.player.count({ where })} seeded players.`,
        );
        return;
      }
      const removed = await db.player.deleteMany({ where });
      console.log(
        `Removed ${removed.count} seeded players with their runs and records.`,
      );
      return;
    }

    const count = numberArg("players", 1, 500);
    const play = numberArg("play", 0.05, 1);
    const spread = numberArg("spread", 0.05, 3);
    const days = numberArg("days", 1, 365);
    const chosen = args.game?.length ? args.game : [...GAME_SLUGS];
    const unknown = chosen.filter((g) => !isGameSlug(g));
    if (unknown.length)
      fail(
        `Unknown game: ${unknown.join(", ")}. Use one of: ${GAME_SLUGS.join(", ")}.`,
      );
    const games = new Set(chosen as GameSlug[]);

    const real = await loadBoards(db, games);
    const boards = [...real, ...freshBoards(real, games)].sort((a, b) => a.id.localeCompare(b.id));
    if (!boards.length)
      fail(
        "No board has a real run yet. Play each level once first: the seed builds on real results.",
      );
    const invented = boards.filter((b) => !b.best).map((b) => b.id);
    if (invented.length)
      console.log(`No real runs yet, inventing plausible results: ${invented.join(", ")}`);
    const empty = [...games].filter((g) => !boards.some((b) => b.game === g));
    if (empty.length)
      console.log(`No real runs yet, skipped: ${empty.join(", ")}`);
    const stepOf = steps(boards);

    const now = Date.now();
    const plans: Entry[][] = [];
    for (let i = 0; i < count; i += 1) {
      const entries: Entry[] = [];
      for (const board of boards) {
        if (random() > play) continue;
        const entry = seedEntry(
          board,
          stepOf.get(board.game)!,
          spread,
          new Date(now - random() * days * DAY),
        );
        if (entry) entries.push(entry);
      }
      if (entries.length) plans.push(entries);
    }

    const perBoard = new Map<string, Entry[]>();
    for (const entry of plans.flat())
      perBoard.set(entry.board.id, [
        ...(perBoard.get(entry.board.id) ?? []),
        entry,
      ]);
    for (const board of boards) {
      const entries = perBoard.get(board.id) ?? [];
      const metrics = BOARD_META[board.game].metrics;
      const show = (rank: RankKey) =>
        metrics
          .map((m, i) => (m.lowerIsBetter ? -rank[i] : rank[i]))
          .join(" / ");
      const ranks = entries.map((e) => e.rank).sort(compare);
      const range = ranks.length
        ? `${show(ranks[0])} … ${show(ranks[ranks.length - 1])}`
        : "-";
      console.log(
        `${board.id.padEnd(34)} real best ${(board.best ? show(board.best.rank) : "-").padEnd(20)} +${String(entries.length).padStart(3)} seeded  ${range}`,
      );
    }

    if (!writes) {
      console.log(
        `Dry run: would add ${plans.length} players. Nothing was written.`,
      );
      return;
    }
    for (const entries of plans)
      console.log(
        `  ${await seedPlayer(db, entries)} on ${entries.length} boards`,
      );
    console.log(
      `Added ${plans.length} seeded players. Remove them later with: npm run seed:boards -- --remove`,
    );
  } finally {
    await closeDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
