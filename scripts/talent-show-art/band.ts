import { P } from "../../src/lib/palette";
import { FIGURE } from "../../src/games/talent-show/scenes/figure";
import type { Sheet } from "../past-bedtime-art/kit";

type Kid = "deco" | "lina" | "bruno" | "mila";
type Pose = "ready" | "hit";
type Point = [number, number];

const ink = (w = 5) => `stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const limb = (d: string, fill: string, w = 26) =>
  `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w - 10}" stroke-linecap="round" stroke-linejoin="round"/>`;
const hand = ([x, y]: Point, skin: string, r = 14) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${skin}" ${ink(4.5)}/>`;
const arm = (from: Point, elbow: Point, to: Point, sleeve: string) => limb(`M${from[0]} ${from[1]} Q${elbow[0]} ${elbow[1]} ${to[0]} ${to[1]}`, sleeve);

const KIDS: Record<Kid, { skin: string; shirt: string; shirtShade: string; lower: string; lowerShade: string; legs: string; shoe: string; shorts: boolean }> = {
  deco: { skin: P.skinTan, shirt: P.sun, shirtShade: P.sunDeep, lower: P.sky, lowerShade: P.skyDeep, legs: P.skinTan, shoe: P.tomato, shorts: true },
  lina: { skin: P.skinBrown, shirt: P.mint, shirtShade: P.mintDeep, lower: P.mint, lowerShade: P.mintDeep, legs: P.mint, shoe: P.plum500, shorts: false },
  bruno: { skin: P.skinLight, shirt: P.sky, shirtShade: P.skyDeep, lower: P.plum800, lowerShade: P.plum950, legs: P.plum800, shoe: P.tomato, shorts: false },
  mila: { skin: "#f6dcc4", shirt: P.plum800, shirtShade: P.plum950, lower: P.plum500, lowerShade: P.plum600, legs: P.plum500, shoe: P.mint, shorts: false },
};

const SLEEVE: Record<Kid, string> = { deco: P.skinTan, lina: P.tangerine, bruno: P.sky, mila: P.plum800 };

function legs(kid: Kid) {
  const k = KIDS[kid];
  const hip = 318;
  const knee = 392;
  const foot = 438;
  const lower = k.shorts
    ? `<path d="M44 ${hip - 22} L156 ${hip - 22} L160 ${hip + 34} L106 ${hip + 34} L100 ${hip + 10} L94 ${hip + 34} L40 ${hip + 34} Z" fill="${k.lower}" ${ink()}/><path d="M132 ${hip - 20} L156 ${hip - 20} L159 ${hip + 32} L136 ${hip + 32} Z" fill="${k.lowerShade}"/>`
    : "";
  const legFill = k.shorts ? k.skin : k.legs;
  const leg = (x: number) => `<path d="M${x - 17} ${hip} L${x - 15} ${foot - 6} L${x + 15} ${foot - 6} L${x + 17} ${hip} Z" fill="${legFill}" ${ink(4.5)}/>`;
  const socks = k.shorts ? [72, 128].map((x) => `<rect x="${x - 15}" y="${knee + 14}" width="30" height="20" fill="${P.white}" ${ink(4)}/>`).join("") : "";
  const shoes = [72, 128].map((x) => `<path d="M${x - 24} ${foot + 8} Q${x - 24} ${foot - 12} ${x} ${foot - 12} Q${x + 26} ${foot - 12} ${x + 26} ${foot + 8} Z" fill="${k.shoe}" ${ink(4.5)}/><path d="M${x - 22} ${foot + 2} L${x + 24} ${foot + 2}" stroke="${P.white}" stroke-width="4" stroke-linecap="round"/>`).join("");
  return `<ellipse cx="100" cy="${foot + 10}" rx="86" ry="14" fill="${P.ink}" opacity="0.22"/>${leg(72)}${leg(128)}${socks}${shoes}${lower}`;
}

function torso(kid: Kid) {
  const k = KIDS[kid];
  let extra = "";
  if (kid === "deco") extra = `<path d="M32 262 Q100 254 168 262" fill="none" stroke="${P.tomato}" stroke-width="12"/>`;
  if (kid === "lina")
    extra = `<path d="M40 236 L160 236 L158 300 L42 300 Z" fill="${P.mint}" ${ink(4.5)}/><rect x="72" y="248" width="56" height="34" rx="6" fill="${P.mintDeep}" ${ink(4)}/><circle cx="58" cy="244" r="6" fill="${P.sun}" ${ink(3)}/><circle cx="142" cy="244" r="6" fill="${P.sun}" ${ink(3)}/>`;
  if (kid === "bruno") extra = `<path d="M100 214 L100 300" ${ink(3.5)}/>${[236, 260, 284].map((y) => `<circle cx="108" cy="${y}" r="4" fill="${P.white}" ${ink(2.5)}/>`).join("")}`;
  if (kid === "mila") extra = `<path d="M34 252 L166 252 M36 268 L164 268" stroke="${P.mint}" stroke-width="6"/>`;
  const top = kid === "lina" ? P.tangerine : k.shirt;
  return `<path d="M24 216 Q26 290 42 312 L158 312 Q174 290 176 216 Z" fill="${top}" ${ink()}/><path d="M150 220 Q172 260 158 310 L146 310 Q160 262 150 220 Z" fill="${kid === "lina" ? P.tangerineDeep : k.shirtShade}" opacity="0.8"/>${extra}`;
}

function bucket(pose: Pose) {
  const top = 296;
  const lines = pose === "hit" ? `<path d="M48 ${top - 22} L36 ${top - 38} M100 ${top - 26} L100 ${top - 46} M152 ${top - 22} L164 ${top - 38}" ${ink(5)}/>` : "";
  return `<rect x="46" y="384" width="108" height="62" rx="6" fill="${P.wood}" ${ink(4.5)}/><path d="M46 404 L154 404 M46 424 L154 424" stroke="${P.woodDeep}" stroke-width="4"/><path d="M58 ${top} L142 ${top} L156 384 L44 384 Z" fill="#9aa6b8" ${ink(4.5)}/><path d="M120 ${top} L142 ${top} L156 384 L132 384 Z" fill="#6b7590"/><ellipse cx="100" cy="${top}" rx="44" ry="10" fill="#c3ccd9" ${ink(4.5)}/><path d="M50 330 L150 330" stroke="#6b7590" stroke-width="5"/>${lines}`;
}

function spoon(from: Point, angle: number) {
  const rad = (angle * Math.PI) / 180;
  const len = 70;
  const tip: Point = [from[0] + Math.cos(rad) * len, from[1] + Math.sin(rad) * len];
  return `<path d="M${from[0]} ${from[1]} L${tip[0]} ${tip[1]}" stroke="${P.ink}" stroke-width="11" stroke-linecap="round"/><path d="M${from[0]} ${from[1]} L${tip[0]} ${tip[1]}" stroke="${P.wood}" stroke-width="5" stroke-linecap="round"/><ellipse cx="${tip[0]}" cy="${tip[1]}" rx="13" ry="9" transform="rotate(${angle} ${tip[0]} ${tip[1]})" fill="${P.wood}" ${ink(4)}/>`;
}

function keyboard(pose: Pose) {
  const y = 300;
  const keys = Array.from({ length: 10 }, (_, i) => `<rect x="${-6 + i * 21.2}" y="${y + 14}" width="19" height="30" rx="3" fill="${P.white}" ${ink(2.5)}/>`).join("");
  const blacks = [0, 1, 3, 4, 5, 7, 8].map((i) => `<rect x="${8 + i * 21.2}" y="${y + 14}" width="11" height="17" rx="2" fill="${P.ink}"/>`).join("");
  const spark = pose === "hit" ? `<path d="M30 ${y - 34} L22 ${y - 50} M100 ${y - 40} L100 ${y - 58} M170 ${y - 34} L178 ${y - 50}" ${ink(5)}/>` : "";
  return `<path d="M30 ${y + 56} L18 446 M170 ${y + 56} L182 446" ${ink(8)}/><path d="M30 ${y + 56} L18 446 M170 ${y + 56} L182 446" stroke="#9aa6b8" stroke-width="3"/><rect x="-20" y="${y}" width="240" height="56" rx="12" fill="${P.tomato}" ${ink(5)}/>${keys}${blacks}<circle cx="-4" cy="${y + 10}" r="5" fill="${P.sun}" ${ink(2.5)}/><circle cx="204" cy="${y + 10}" r="5" fill="${P.mint}" ${ink(2.5)}/><rect x="186" y="${y - 30}" width="34" height="30" rx="6" fill="${P.sun}" ${ink(4)}/><path d="M203 ${y - 26} L196 ${y - 13} L205 ${y - 13} L198 ${y - 2}" fill="none" ${ink(3)}/><path d="M220 ${y - 15} Q240 ${y - 20} 236 ${y + 10}" fill="none" ${ink(3.5)}/>${spark}`;
}

function shaker(at: Point, pose: Pose) {
  const [x, y] = at;
  const motion = pose === "hit" ? `<path d="M${x + 30} ${y - 36} Q${x + 44} ${y - 20} ${x + 34} ${y - 2} M${x + 44} ${y - 46} Q${x + 62} ${y - 22} ${x + 48} ${y + 4}" fill="none" ${ink(4.5)}/>` : "";
  return `<rect x="${x - 18}" y="${y - 44}" width="36" height="58" rx="7" fill="${P.tomato}" ${ink(4.5)}/><rect x="${x - 18}" y="${y - 28}" width="36" height="22" fill="${P.sun}" ${ink(3)}/><ellipse cx="${x}" cy="${y - 44}" rx="18" ry="6" fill="#c3ccd9" ${ink(4)}/>${motion}`;
}

function notebook(at: Point) {
  const [x, y] = at;
  return `<rect x="${x - 26}" y="${y - 34}" width="40" height="54" rx="4" fill="${P.sunPale}" ${ink(4)}/><path d="M${x - 18} ${y - 20} L${x + 6} ${y - 20} M${x - 18} ${y - 10} L${x + 6} ${y - 10} M${x - 18} ${y} L${x} ${y}" stroke="${P.skyDeep}" stroke-width="2.5"/>`;
}

function recorder(pose: Pose) {
  const y = 236;
  const waves = pose === "hit" ? `<path d="M178 ${y + 6} Q192 ${y + 26} 178 ${y + 46} M194 ${y - 2} Q214 ${y + 26} 194 ${y + 54}" fill="none" ${ink(4.5)}/>` : "";
  return `<path d="M48 ${y + 8} Q100 ${y - 60} 152 ${y + 8}" fill="none" ${ink(6)}/><rect x="34" y="${y}" width="132" height="76" rx="12" fill="#3b3b4a" ${ink(5)}/><rect x="52" y="${y + 14}" width="96" height="34" rx="8" fill="${P.plum950}" ${ink(3.5)}/><circle cx="76" cy="${y + 31}" r="11" fill="${P.cream}" ${ink(3)}/><circle cx="124" cy="${y + 31}" r="11" fill="${P.cream}" ${ink(3)}/><circle cx="76" cy="${y + 31}" r="3" fill="${P.ink}"/><circle cx="124" cy="${y + 31}" r="3" fill="${P.ink}"/><rect x="${pose === "hit" ? 116 : 112}" y="${pose === "hit" ? y - 4 : y - 10}" width="22" height="${pose === "hit" ? 8 : 14}" rx="3" fill="${P.tomato}" ${ink(3.5)}/>${[60, 72, 84].map((x) => `<rect x="${x}" y="${y + 56}" width="8" height="8" fill="${P.plum300}"/>`).join("")}${waves}`;
}

function figure(kid: Kid, pose: Pose) {
  const k = KIDS[kid];
  const sleeve = SLEEVE[kid];
  const L: Point = [34, 214];
  const R: Point = [166, 214];
  let back = "";
  let front = "";
  if (kid === "deco") {
    const hands: [Point, Point] = pose === "ready" ? [[-2, 150], [202, 150]] : [[66, 282], [134, 282]];
    back = arm(L, pose === "ready" ? [-10, 220] : [14, 270], hands[0], sleeve) + arm(R, pose === "ready" ? [210, 220] : [186, 270], hands[1], sleeve);
    front = bucket(pose) + (pose === "ready" ? spoon(hands[0], -105) + spoon(hands[1], -75) : spoon(hands[0], 35) + spoon(hands[1], 145)) + hand(hands[0], k.skin) + hand(hands[1], k.skin);
  } else if (kid === "lina") {
    const y = pose === "ready" ? 276 : 300;
    const hands: [Point, Point] = [[60, y], [140, y]];
    back = arm(L, [8, 268], hands[0], sleeve) + arm(R, [192, 268], hands[1], sleeve);
    front = keyboard(pose) + hand(hands[0], k.skin) + hand(hands[1], k.skin);
  } else if (kid === "bruno") {
    const can: Point = pose === "ready" ? [214, 150] : [190, 262];
    back = arm(R, pose === "ready" ? [214, 220] : [214, 250], [can[0], can[1] + 2], sleeve);
    front = arm(L, [8, 270], [30, 312], sleeve) + notebook([24, 304]) + hand([30, 312], k.skin) + shaker(can, pose) + hand([can[0], can[1] + 2], k.skin);
  } else {
    const hands: [Point, Point] = pose === "ready" ? [[40, 276], [160, 276]] : [[40, 276], [128, 232]];
    back = arm(L, [10, 262], hands[0], sleeve) + arm(R, pose === "ready" ? [190, 262] : [180, 250], hands[1], sleeve);
    front = recorder(pose) + hand(hands[0], k.skin) + hand(hands[1], k.skin, pose === "hit" ? 12 : 14);
  }
  const body = `${legs(kid)}${back}${torso(kid)}${front}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FIGURE.x} ${FIGURE.y} ${FIGURE.w} ${FIGURE.h}">${body}</svg>`;
}

export function band(): Sheet {
  const sheet: Sheet = {};
  for (const kid of Object.keys(KIDS) as Kid[]) for (const pose of ["ready", "hit"] as const) sheet[`body-${kid}-${pose}`] = { svg: figure(kid, pose) };
  return sheet;
}
