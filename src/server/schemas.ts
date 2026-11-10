import { z } from "zod";
import { GAME_SLUGS } from "@/lib/competition/rules";
import { isDayKey } from "@/lib/missions/calendar";

const dayKey = z.string().refine(isDayKey, "dia inválido");

const INT = 2_000_000_000;

const statKey = z.string().regex(/^[a-zA-Z]{1,24}$/);

export const statsSchema = z
  .record(statKey, z.number().int().min(-INT).max(INT))
  .refine((stats) => Object.keys(stats).length <= 24, "estatísticas demais");

export const replaySchema = z
  .object({
    kind: z.literal("lab-placements"),
    version: z.literal(1),
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
