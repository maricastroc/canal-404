import type { GameModule } from "./types";

export const GAME_LOADERS: Record<string, () => Promise<GameModule>> = {
  "rua-sem-saida": () => import("./rua-sem-saida").then((m) => m.default),
};
