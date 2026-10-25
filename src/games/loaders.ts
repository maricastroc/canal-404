import type { GameModule } from "./types";

export const GAME_LOADERS: Record<string, () => Promise<GameModule>> = {
  "dead-end-street": () => import("./dead-end-street").then((m) => m.default),
  "bad-ideas-lab": () => import("./bad-ideas-lab").then((m) => m.default),
  "food-fight": () => import("./food-fight").then((m) => m.default),
  "operation-recess": () => import("./operation-recess").then((m) => m.default),
  "pajama-war": () => import("./pajama-war").then((m) => m.default),
};
