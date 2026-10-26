export const W = 1920;
export const H = 1080;

export const SPEED = 390;
export const ACCEL = 2800;
export const FOOT = { hw: 26, up: 12, down: 10 };
export const INTERACT_R = 150;
export const HINT_R = 420;
export const CHAR_RES = 1.3;
export const DECO_SCALE = 1.06;
export const SPRITE_FOOT = 212 / 224;
export const SAVE_KEY = "canal404:off-air-vacation:v1";

export type AreaId = "lobby" | "pool" | "arcade" | "beach" | "forest" | "station" | "room404";
export type Dir = "f" | "k" | "s";

export const AREA_TITLES: Record<AreaId, string> = {
  lobby: "Recepção",
  pool: "Piscina",
  arcade: "Fliperama",
  beach: "Praia",
  forest: "Floresta",
  station: "Sala de transmissão",
  room404: "Quarto 404",
};

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
