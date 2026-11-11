import type { GameSlug } from "@/lib/competition/boards";

export const MISSION_GAMES = ["bad-ideas-lab", "dead-end-street", "food-fight", "operation-recess", "pajama-war"] as const satisfies readonly GameSlug[];

export type MissionGame = (typeof MISSION_GAMES)[number];
