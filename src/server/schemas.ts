import { z } from "zod";
import { PROJECTILE_ORDER } from "@/games/dead-end-street/config";
import { MAX_AMMO } from "@/games/dead-end-street/phases";
import { ANGLE_STEPS, MAX_STEPS, POWER_STEPS } from "@/games/dead-end-street/sim";
import { CART_IDS } from "@/games/downhill-derby/sim/carts";
import { TAPE_MAX, TAPE_PATTERN } from "@/games/downhill-derby/sim/judge";
import { GAME_SLUGS } from "@/lib/competition/rules";
import { isDayKey } from "@/lib/missions/calendar";

const dayKey = z.string().refine(isDayKey, "dia inválido");

const INT = 2_000_000_000;

const statKey = z.string().regex(/^[a-zA-Z]{1,24}$/);

export const statsSchema = z
  .record(statKey, z.number().int().min(-INT).max(INT))
  .refine((stats) => Object.keys(stats).length <= 24, "estatísticas demais");

const REPLAY_VERSIONS = { "lab-placements": 1, "street-launches": 2, "downhill-run": 1 } as const;

export function outdatedReplay(body: unknown) {
  const replay = (body as { result?: { replay?: { kind?: unknown; version?: unknown } } } | null)?.result?.replay;
  if (!replay || typeof replay.kind !== "string" || typeof replay.version !== "number" || !Object.hasOwn(REPLAY_VERSIONS, replay.kind)) return false;
  return replay.version < REPLAY_VERSIONS[replay.kind as keyof typeof REPLAY_VERSIONS];
}

const labReplaySchema = z
  .object({
    kind: z.literal("lab-placements"),
    version: z.literal(REPLAY_VERSIONS["lab-placements"]),
    parts: z
      .array(
        z
          .object({
            type: z.string().max(16),
            x: z.number().int().min(-10_000).max(10_000),
            y: z.number().int().min(-10_000).max(10_000),
            rot: z.number().int().min(0).max(32),
          })
          .strict(),
      )
      .max(16),
  })
  .strict();

const streetReplaySchema = z
  .object({
    kind: z.literal("street-launches"),
    version: z.literal(REPLAY_VERSIONS["street-launches"]),
    launches: z
      .array(
        z
          .object({
            at: z.number().int().min(0).max(MAX_STEPS),
            angle: z.number().int().min(ANGLE_STEPS.min).max(ANGLE_STEPS.max),
            power: z.number().int().min(POWER_STEPS.min).max(POWER_STEPS.max),
            ammo: z.enum(PROJECTILE_ORDER),
          })
          .strict(),
      )
      .max(MAX_AMMO),
  })
  .strict();

const downhillReplaySchema = z
  .object({
    kind: z.literal("downhill-run"),
    version: z.literal(REPLAY_VERSIONS["downhill-run"]),
    cart: z.enum(CART_IDS as [string, ...string[]]),
    tape: z.string().max(TAPE_MAX).regex(TAPE_PATTERN),
    rivals: z.array(z.number().int().min(0).max(255)).length(3),
  })
  .strict();

export const replaySchema = z.discriminatedUnion("kind", [labReplaySchema, streetReplaySchema, downhillReplaySchema]);

export const submitSchema = z
  .object({
    ticket: z.string().min(1).max(1024),
    result: z
      .object({
        won: z.boolean(),
        score: z.number().int().min(0).max(10_000_000),
        stars: z.number().int().min(0).max(3),
        stats: statsSchema,
        replay: replaySchema.optional(),
      })
      .strict(),
  })
  .strict();

export const ticketSchema = z
  .object({
    game: z.enum(GAME_SLUGS),
    level: z.string().regex(/^[a-z0-9-]{1,32}$/).nullable().optional(),
    mission: dayKey.nullable().optional(),
  })
  .strict();

export const missionBoardSchema = z.object({
  day: dayKey.nullable(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export const missionHistorySchema = z.object({
  before: dayKey.nullable(),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

export const nicknameSchema = z.object({ nickname: z.string().max(64) }).strict();

export const boardQuerySchema = z.object({
  game: z.enum(GAME_SLUGS),
  level: z
    .string()
    .regex(/^[a-z0-9-]{1,32}$/)
    .nullable(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
