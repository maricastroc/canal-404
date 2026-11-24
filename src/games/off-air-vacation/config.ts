export const W = 1920;
export const H = 1080;

export const SPEED = 390;
export const ACCEL = 2800;
export const BIKE_SPEED = 700;
export const BIKE_RAMP = 0.6;
export const FOOT = { hw: 26, up: 12, down: 10 };
export const INTERACT_R = 150;
export const HINT_R = 420;
export const CHAR_RES = 1.3;
export const DECO_SCALE = 1.06;
export const SPRITE_FOOT = 212 / 224;
export const BIKE_FOOT = 248 / 260;
export const SAVE_KEY = "canal404:off-air-vacation:v1";

export type AreaId = "lobby" | "pool" | "arcade" | "beach" | "forest" | "station" | "room404";
export type Dir = "f" | "k" | "s";

export const AREA_IDS: AreaId[] = ["lobby", "pool", "arcade", "beach", "forest", "station", "room404"];
export const RIDE_AREAS: AreaId[] = ["pool", "beach", "forest"];

export const MAP_POS: Record<AreaId, [number, number]> = {
  lobby: [600, 200],
  pool: [610, 380],
  arcade: [855, 300],
  beach: [935, 560],
  forest: [320, 400],
  station: [215, 300],
  room404: [560, 230],
};

export const SCORE = { mystery: 1000, poster: 100, token: 50, secret: 250 };

export type ResortCounts = { posters: number; tokens: number; secrets: number };

export function resortResult(counts: ResortCounts, solved = true) {
  const score = (solved ? SCORE.mystery : 0) + counts.posters * SCORE.poster + counts.tokens * SCORE.token + counts.secrets * SCORE.secret;
  const stars = 1 + (counts.posters >= 3 ? 1 : 0) + (counts.secrets >= 2 ? 1 : 0);
  return { score, stars };
}
