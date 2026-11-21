export const P = {
  ink: "#1d1830",
  white: "#fffaf0",
  sky: "#5cb9f0",
  skyDeep: "#2f86c9",
  skyPale: "#a9dcf7",
  tomato: "#ef4f43",
  bubblegum: "#f06ba8",
  blush: "#ff9d8a",
  mint: "#63d6c1",
  mintDeep: "#2fa996",
  cream: "#fbf5e6",
  skinLight: "#ffd2a8",
  skinLightShade: "#eaa97e",
  skinTan: "#e7a874",
  skinTanShade: "#c4824f",
  sun: "#ffc83d",
};

export type Art = { svg: string; res?: number };

export type Sheet = Record<string, Art>;

export const ink = (w = 3) => `stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

export const svg = (vb: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;

export const limb = (d: string, fill: string, w = 18) =>
  `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w - 9}" stroke-linecap="round" stroke-linejoin="round"/>`;

export const sweat = (x: number, y: number, r = 1) =>
  `<path d="M${x} ${y - 12 * r} Q${x + 9 * r} ${y + 2 * r} ${x} ${y + 6 * r} Q${x - 9 * r} ${y + 2 * r} ${x} ${y - 12 * r} Z" fill="#9fdcff" ${ink(3)}/><path d="M${x - 2 * r} ${y - 2 * r} Q${x - 3 * r} ${y + 2 * r} ${x} ${y + 3 * r}" stroke="${P.white}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

export function rnd(seed: number) {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}
