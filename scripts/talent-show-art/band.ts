import { P } from "../../src/lib/palette";
import { FIGURE } from "../../src/games/talent-show/scenes/figure";
import type { Sheet } from "../past-bedtime-art/kit";

type Kid = "deco" | "lina" | "bruno" | "mila";
type Pose = "ready" | "hit";
type Point = [number, number];

const ink = (w = 5) => `stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const limb = (d: string, fill: string, w = 32) =>
  `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w - 10}" stroke-linecap="round" stroke-linejoin="round"/>`;
const hand = ([x, y]: Point, skin: string, r = 15) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${skin}" ${ink(5)}/>`;

type Look = { skin: string; top: string; topShade: string; sleeve: "short" | "long"; lower: string; lowerShade: string; legs: string; shoe: string; sock: boolean };

const LOOK: Record<Kid, Look> = {
  deco: { skin: P.skinTan, top: P.sun, topShade: P.sunDeep, sleeve: "short", lower: P.sky, lowerShade: P.skyDeep, legs: P.skinTan, shoe: P.tomato, sock: true },
  lina: { skin: P.skinBrown, top: P.tangerine, topShade: P.tangerineDeep, sleeve: "short", lower: P.mint, lowerShade: P.mintDeep, legs: P.mint, shoe: P.plum500, sock: false },
  bruno: { skin: P.skinLight, top: P.sky, topShade: P.skyDeep, sleeve: "long", lower: P.plum800, lowerShade: P.plum950, legs: P.plum800, shoe: P.tomato, sock: false },
  mila: { skin: "#f6dcc4", top: P.plum800, topShade: P.plum950, sleeve: "long", lower: P.plum500, lowerShade: P.plum600, legs: P.plum500, shoe: P.mint, sock: false },
};

const NECK_Y = 222;
const WAIST = 318;
const FOOT = 442;
const LEGS = [76, 124];
const SHOULDER: [Point, Point] = [
  [30, 238],
  [170, 238],
];

function legs(kid: Kid) {
  const k = LOOK[kid];
  const shorts = kid === "deco";
  const top = WAIST - 14;
  const leg = (x: number) => `<path d="M${x - 21} ${top} L${x - 19} ${FOOT - 8} L${x + 19} ${FOOT - 8} L${x + 21} ${top} Z" fill="${shorts ? k.skin : k.legs}" ${ink(5)}/>`;
  const socks = k.sock ? LEGS.map((x) => `<path d="M${x - 19} ${FOOT - 34} L${x + 19} ${FOOT - 34} L${x + 19} ${FOOT - 8} L${x - 19} ${FOOT - 8} Z" fill="${P.white}" ${ink(4)}/>`).join("") : "";
  const shoes = LEGS.map(
    (x, i) =>
      `<path d="M${x - 26 + (i ? 2 : -4)} ${FOOT + 10} Q${x - 26} ${FOOT - 14} ${x} ${FOOT - 14} Q${x + 26} ${FOOT - 14} ${x + 26 + (i ? 4 : -2)} ${FOOT + 10} Z" fill="${k.shoe}" ${ink(5)}/><path d="M${x - 22} ${FOOT + 3} L${x + 22} ${FOOT + 3}" stroke="${P.white}" stroke-width="4" stroke-linecap="round"/>`,
  ).join("");
  const hips = shorts
    ? `<path d="M36 ${WAIST - 20} L164 ${WAIST - 20} L168 ${WAIST + 46} L106 ${WAIST + 46} L100 ${WAIST + 22} L94 ${WAIST + 46} L32 ${WAIST + 46} Z" fill="${k.lower}" ${ink(5)}/><path d="M140 ${WAIST - 18} L164 ${WAIST - 18} L167 ${WAIST + 44} L144 ${WAIST + 44} Z" fill="${k.lowerShade}"/>`
    : `<path d="M38 ${WAIST - 20} L162 ${WAIST - 20} L165 ${WAIST + 30} L106 ${WAIST + 30} L100 ${WAIST + 16} L94 ${WAIST + 30} L35 ${WAIST + 30} Z" fill="${k.lower}" ${ink(5)}/>`;
  return `<ellipse cx="100" cy="${FOOT + 12}" rx="88" ry="14" fill="${P.ink}" opacity="0.22"/>${LEGS.map(leg).join("")}${socks}${shoes}${hips}`;
}

function torso(kid: Kid) {
  const k = LOOK[kid];
  const fill = `<path d="M18 ${NECK_Y - 14} L182 ${NECK_Y - 14} L182 ${NECK_Y} C184 262 178 300 166 ${WAIST} L34 ${WAIST} C22 300 16 262 18 ${NECK_Y} Z" fill="${k.top}"/>`;
  const shade = `<path d="M150 ${NECK_Y - 2} L178 ${NECK_Y - 2} C180 262 175 298 164 ${WAIST - 2} L150 ${WAIST - 2} Z" fill="${k.topShade}"/>`;
  let detail = "";
  if (kid === "deco") detail = `<path d="M19 266 Q100 256 181 266" fill="none" stroke="${P.tomato}" stroke-width="9"/>`;
  if (kid === "lina") {
    const strap = (from: Point, to: Point) => `<path d="M${from[0]} ${from[1]} L${to[0]} ${to[1]}" stroke="${P.mintDeep}" stroke-width="12"/><path d="M${from[0]} ${from[1]} L${to[0]} ${to[1]}" stroke="${P.mint}" stroke-width="6"/>`;
    detail = `${strap([58, NECK_Y - 4], [64, 262])}${strap([142, NECK_Y - 4], [136, 262])}<path d="M46 258 L154 258 L158 ${WAIST + 2} L42 ${WAIST + 2} Z" fill="${P.mint}" ${ink(5)}/><path d="M132 260 L154 260 L157 ${WAIST} L136 ${WAIST} Z" fill="${P.mintDeep}"/><rect x="78" y="272" width="44" height="28" rx="6" fill="${P.mintDeep}" ${ink(4)}/><circle cx="64" cy="264" r="6" fill="${P.sun}" ${ink(3)}/><circle cx="136" cy="264" r="6" fill="${P.sun}" ${ink(3)}/>`;
  }
  if (kid === "bruno") detail = `<path d="M100 ${NECK_Y - 2} L100 ${WAIST - 2}" ${ink(3.5)}/>${[244, 272, 300].map((y) => `<circle cx="110" cy="${y}" r="4.5" fill="${P.white}" ${ink(2.5)}/>`).join("")}`;
  if (kid === "mila") detail = `<path d="M24 292 L176 292 M28 304 L172 304" stroke="${P.mint}" stroke-width="5"/>`;
  const outline = `<path d="M18 ${NECK_Y} C16 262 22 300 34 ${WAIST} L166 ${WAIST} C178 300 184 262 182 ${NECK_Y}" fill="none" ${ink()}/>`;
  return `${fill}${shade}${detail}${outline}`;
}

function arm(kid: Kid, side: 0 | 1, elbow: Point, to: Point) {
  const k = LOOK[kid];
  const from = SHOULDER[side];
  const path = `M${from[0]} ${from[1]} Q${elbow[0]} ${elbow[1]} ${to[0]} ${to[1]}`;
  if (k.sleeve === "long") return limb(path, kid === "mila" ? P.plum700 : k.top);
  const cap = side === 0 ? `M${from[0] + 8} ${from[1] - 14} Q${from[0] - 22} ${from[1] - 6} ${from[0] - 14} ${from[1] + 24}` : `M${from[0] - 8} ${from[1] - 14} Q${from[0] + 22} ${from[1] - 6} ${from[0] + 14} ${from[1] + 24}`;
  return `${limb(path, k.skin)}<path d="${cap}" fill="none" stroke="${P.ink}" stroke-width="30" stroke-linecap="round"/><path d="${cap}" fill="none" stroke="${k.top}" stroke-width="20" stroke-linecap="round"/>`;
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
  const motion = pose === "hit" ? `<path d="M${x + 28} ${y - 36} Q${x + 42} ${y - 20} ${x + 32} ${y - 2} M${x + 42} ${y - 46} Q${x + 58} ${y - 22} ${x + 46} ${y + 4}" fill="none" ${ink(4.5)}/>` : "";
  return `<rect x="${x - 18}" y="${y - 44}" width="36" height="58" rx="7" fill="${P.tomato}" ${ink(4.5)}/><rect x="${x - 18}" y="${y - 28}" width="36" height="22" fill="${P.sun}" ${ink(3)}/><ellipse cx="${x}" cy="${y - 44}" rx="18" ry="6" fill="#c3ccd9" ${ink(4)}/>${motion}`;
}

function notebook(at: Point) {
  const [x, y] = at;
  return `<rect x="${x - 26}" y="${y - 34}" width="42" height="56" rx="4" fill="${P.sunPale}" ${ink(4)}/><path d="M${x - 18} ${y - 20} L${x + 8} ${y - 20} M${x - 18} ${y - 10} L${x + 8} ${y - 10} M${x - 18} ${y} L${x + 2} ${y}" stroke="${P.skyDeep}" stroke-width="2.5"/>`;
}

function recorder(pose: Pose) {
  const y = 250;
  const waves = pose === "hit" ? `<path d="M178 ${y + 6} Q192 ${y + 26} 178 ${y + 46} M194 ${y - 2} Q214 ${y + 26} 194 ${y + 54}" fill="none" ${ink(4.5)}/>` : "";
  return `<path d="M50 ${y + 8} Q100 ${y - 56} 150 ${y + 8}" fill="none" ${ink(6)}/><rect x="34" y="${y}" width="132" height="76" rx="12" fill="#3b3b4a" ${ink(5)}/><rect x="52" y="${y + 14}" width="96" height="34" rx="8" fill="${P.plum950}" ${ink(3.5)}/><circle cx="76" cy="${y + 31}" r="11" fill="${P.cream}" ${ink(3)}/><circle cx="124" cy="${y + 31}" r="11" fill="${P.cream}" ${ink(3)}/><circle cx="76" cy="${y + 31}" r="3" fill="${P.ink}"/><circle cx="124" cy="${y + 31}" r="3" fill="${P.ink}"/><rect x="${pose === "hit" ? 116 : 112}" y="${pose === "hit" ? y - 4 : y - 10}" width="22" height="${pose === "hit" ? 8 : 14}" rx="3" fill="${P.tomato}" ${ink(3.5)}/>${[60, 72, 84].map((x) => `<rect x="${x}" y="${y + 56}" width="8" height="8" fill="${P.plum300}"/>`).join("")}${waves}`;
}

function figure(kid: Kid, pose: Pose) {
  const k = LOOK[kid];
  let back = "";
  let front = "";
  if (kid === "deco") {
    if (pose === "ready") {
      const hands: [Point, Point] = [
        [0, 152],
        [200, 152],
      ];
      back = arm(kid, 0, [-12, 222], hands[0]) + arm(kid, 1, [212, 222], hands[1]);
      front = bucket(pose) + spoon(hands[0], -105) + spoon(hands[1], -75) + hand(hands[0], k.skin) + hand(hands[1], k.skin);
    } else {
      const hands: [Point, Point] = [
        [56, 276],
        [144, 276],
      ];
      front = bucket(pose) + arm(kid, 0, [2, 266], hands[0]) + arm(kid, 1, [198, 266], hands[1]) + spoon(hands[0], 26) + spoon(hands[1], 154) + hand(hands[0], k.skin) + hand(hands[1], k.skin);
    }
  } else if (kid === "lina") {
    const y = pose === "ready" ? 284 : 300;
    const hands: [Point, Point] = [
      [40, y],
      [160, y],
    ];
    front = keyboard(pose) + arm(kid, 0, [8, y + 4], hands[0]) + arm(kid, 1, [192, y + 4], hands[1]) + hand(hands[0], k.skin) + hand(hands[1], k.skin);
  } else if (kid === "bruno") {
    const can: Point = pose === "ready" ? [212, 150] : [192, 264];
    const grip: Point = [can[0], can[1] + 2];
    const right = arm(kid, 1, pose === "ready" ? [214, 226] : [214, 262], grip);
    back = pose === "ready" ? right : "";
    front = arm(kid, 0, [4, 286], [36, 300]) + notebook([30, 298]) + hand([36, 300], k.skin) + (pose === "hit" ? right : "") + shaker(can, pose) + hand(grip, k.skin);
  } else {
    const hands: [Point, Point] = pose === "ready" ? [[42, 290], [158, 290]] : [[42, 290], [128, 246]];
    front = arm(kid, 0, [8, 280], hands[0]) + recorder(pose) + arm(kid, 1, pose === "ready" ? [192, 280] : [184, 262], hands[1]) + hand(hands[0], k.skin) + hand(hands[1], k.skin, pose === "hit" ? 13 : 15);
  }
  const body = `${legs(kid)}${back}${torso(kid)}${front}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FIGURE.x} ${FIGURE.y} ${FIGURE.w} ${FIGURE.h}">${body}</svg>`;
}

export function band(): Sheet {
  const sheet: Sheet = {};
  for (const kid of Object.keys(LOOK) as Kid[]) for (const pose of ["ready", "hit"] as const) sheet[`body-${kid}-${pose}`] = { svg: figure(kid, pose) };
  return sheet;
}
