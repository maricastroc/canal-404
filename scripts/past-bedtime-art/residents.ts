import { dadHead } from "./characters";
import { ink, limb, P, svg, sweat, type Sheet } from "./kit";

const GRAN = { robe: "#f06ba8", robeShade: "#c94785", dots: "#f9b6d4", gown: "#fbf5e6", hair: "#e4e0ee", hairShade: "#b9b3cc", slipper: "#a58fd8", torch: "#9aa6b8", torchDark: "#6b7590", lens: "#ffe39a" };

export type GranMood = "walk" | "alert" | "shock";

function granFace(mood: GranMood, cx: number, cy: number) {
  const ex = [cx - 11, cx + 11];
  let eyes: string;
  if (mood === "walk") eyes = ex.map((x) => `<path d="M${x - 5} ${cy + 1} Q${x} ${cy - 4} ${x + 5} ${cy + 1}" fill="none" ${ink(3)}/>`).join("");
  else {
    const r = mood === "shock" ? 5.5 : 4.5;
    eyes = ex.map((x) => `<circle cx="${x}" cy="${cy}" r="${r}" fill="${P.white}" ${ink(2.2)}/><circle cx="${x}" cy="${cy + (mood === "shock" ? 0 : 0.5)}" r="${mood === "shock" ? 1.8 : 2.4}" fill="${P.ink}"/>`).join("");
  }
  const glasses = ex.map((x) => `<circle cx="${x}" cy="${cy}" r="9" fill="${P.skyPale}" fill-opacity="0.25" ${ink(2.6)}/>`).join("") + `<path d="M${cx - 2} ${cy - 1} Q${cx} ${cy - 3} ${cx + 2} ${cy - 1}" fill="none" ${ink(2.4)}/>`;
  const brows =
    mood === "walk"
      ? `<path d="M${cx - 18} ${cy - 13} Q${cx - 11} ${cy - 16} ${cx - 4} ${cy - 13} M${cx + 4} ${cy - 13} Q${cx + 11} ${cy - 16} ${cx + 18} ${cy - 13}" fill="none" stroke="${GRAN.hairShade}" stroke-width="3.5" stroke-linecap="round"/>`
      : `<path d="M${cx - 19} ${cy - 17} Q${cx - 11} ${cy - 24} ${cx - 3} ${cy - 18} M${cx + 3} ${cy - 18} Q${cx + 11} ${cy - 24} ${cx + 19} ${cy - 17}" fill="none" stroke="${GRAN.hairShade}" stroke-width="3.5" stroke-linecap="round"/>`;
  const mouth =
    mood === "walk"
      ? `<path d="M${cx - 6} ${cy + 15} Q${cx} ${cy + 19} ${cx + 6} ${cy + 15}" fill="none" ${ink(2.6)}/>`
      : mood === "alert"
        ? `<ellipse cx="${cx}" cy="${cy + 17}" rx="3.5" ry="4.5" fill="${P.ink}"/>`
        : `<path d="M${cx - 9} ${cy + 12} Q${cx} ${cy + 10} ${cx + 9} ${cy + 12} Q${cx + 7} ${cy + 26} ${cx} ${cy + 26} Q${cx - 7} ${cy + 26} ${cx - 9} ${cy + 12} Z" fill="${P.ink}" ${ink(2)}/><ellipse cx="${cx}" cy="${cy + 22}" rx="4" ry="2.5" fill="${P.bubblegum}"/>`;
  return `<circle cx="${cx - 19}" cy="${cy + 10}" r="5.5" fill="${P.blush}" opacity="0.75"/><circle cx="${cx + 19}" cy="${cy + 10}" r="5.5" fill="${P.blush}" opacity="0.75"/>${eyes}${glasses}${brows}<path d="M${cx} ${cy + 4} Q${cx - 3} ${cy + 9} ${cx + 1} ${cy + 10}" fill="none" ${ink(2.2)}/>${mouth}`;
}

function granHair(cx: number, cy: number, back: boolean) {
  const puffs = [-24, -12, 0, 12, 24].map((dx, i) => `<circle cx="${cx + dx}" cy="${cy - 18 + Math.abs(dx) * 0.35 + (i % 2) * 2}" r="13" fill="${GRAN.hair}" ${ink(3)}/>`).join("");
  return `${puffs}<circle cx="${cx}" cy="${cy - 40}" r="12" fill="${GRAN.hair}" ${ink(3)}/><path d="M${cx - 8} ${cy - 42} Q${cx} ${cy - 48} ${cx + 8} ${cy - 42}" fill="none" stroke="${GRAN.hairShade}" stroke-width="2.5" stroke-linecap="round"/><rect x="${cx - 9}" y="${cy - 31}" width="18" height="5" rx="2.5" fill="${P.tomato}" ${ink(2)}/>${back ? `<circle cx="${cx - 26}" cy="${cy}" r="11" fill="${GRAN.hair}" ${ink(3)}/><circle cx="${cx + 26}" cy="${cy}" r="11" fill="${GRAN.hair}" ${ink(3)}/>` : ""}`;
}

function granRobe(x0: number, x1: number, top: number, bottom: number, back: boolean) {
  const mid = (x0 + x1) / 2;
  let dots = "";
  for (let i = 0; i < 9; i += 1) {
    const dx = x0 + 8 + ((i * 37) % 100) / 100 * (x1 - x0 - 16);
    const dy = top + 14 + ((i * 53) % 100) / 100 * (bottom - top - 24);
    dots += `<circle cx="${dx}" cy="${dy}" r="2.6" fill="${GRAN.dots}"/>`;
  }
  return `<path d="M${x0 + 6} ${top} Q${mid} ${top - 6} ${x1 - 6} ${top} L${x1 + 5} ${bottom} Q${mid} ${bottom + 5} ${x0 - 5} ${bottom} Z" fill="${GRAN.robe}" ${ink(3.5)}/>
    ${dots}
    <path d="M${x1 - 8} ${top + 6} L${x1 + 2} ${bottom - 2} L${x1 - 10} ${bottom} Z" fill="${GRAN.robeShade}" opacity="0.5"/>
    ${back ? "" : `<path d="M${mid - 10} ${top - 2} L${mid} ${top + 12} L${mid + 10} ${top - 2}" fill="${GRAN.gown}" ${ink(2.5)}/><path d="M${mid} ${top + 12} L${mid} ${bottom - 4}" stroke="${GRAN.robeShade}" stroke-width="3"/><path d="M${x0 + 2} ${top + 34} Q${mid} ${top + 40} ${x1 - 2} ${top + 34}" fill="none" stroke="${P.white}" stroke-width="4" stroke-linecap="round"/>`}
    <path d="M${x0 - 4} ${bottom - 7} Q${mid} ${bottom - 2} ${x1 + 4} ${bottom - 7}" fill="none" stroke="${GRAN.gown}" stroke-width="5" stroke-linecap="round"/>`;
}

function torch(x: number, y: number, angle: number) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})"><rect x="-6" y="-5" width="18" height="10" rx="3" fill="${GRAN.torch}" ${ink(2.4)}/><path d="M12 -8 L20 -8 L20 8 L12 8 Z" fill="${GRAN.torchDark}" ${ink(2.4)}/><ellipse cx="20" cy="0" rx="2.5" ry="7" fill="${GRAN.lens}" ${ink(2)}/></g>`;
}

const granSlippers = `<ellipse cx="-13" cy="-4" rx="12" ry="6" fill="${GRAN.slipper}" ${ink(3)}/><ellipse cx="13" cy="-4" rx="12" ry="6" fill="${GRAN.slipper}" ${ink(3)}/><circle cx="-13" cy="-8" r="3.5" fill="${P.white}" ${ink(1.5)}/><circle cx="13" cy="-8" r="3.5" fill="${P.white}" ${ink(1.5)}/>`;

const GRAN_VB = "-50 -158 104 164";
const GRAN_SHOCK_VB = "-56 -172 116 178";

function grandmaFront(mood: GranMood) {
  const hy = -100;
  const up = mood === "shock";
  const arms = up
    ? `${limb("M-24 -76 Q-40 -96 -34 -118", GRAN.robe, 14)}<circle cx="-34" cy="-120" r="7" fill="${P.skinLight}" ${ink(2.5)}/>${limb("M24 -76 Q40 -96 34 -118", GRAN.robe, 14)}<circle cx="34" cy="-120" r="7" fill="${P.skinLight}" ${ink(2.5)}/>${torch(34, -128, -90)}`
    : `${limb("M-24 -76 Q-30 -56 -8 -52", GRAN.robe, 14)}${limb("M24 -76 Q30 -56 8 -52", GRAN.robe, 14)}${torch(0, -50, 90)}<circle cx="-6" cy="-52" r="7" fill="${P.skinLight}" ${ink(2.5)}/><circle cx="6" cy="-52" r="7" fill="${P.skinLight}" ${ink(2.5)}/>`;
  return svg(mood === "shock" ? GRAN_SHOCK_VB : GRAN_VB, `
    ${granSlippers}
    ${granRobe(-28, 28, -80, -8, false)}
    ${arms}
    <path d="M-8 -82 L-8 -74 Q0 -70 8 -74 L8 -82 Z" fill="${P.skinLight}" ${ink(2.5)}/>
    <ellipse cx="0" cy="${hy}" rx="30" ry="28" fill="${P.skinLight}" ${ink(3.5)}/>
    <path d="M22 ${hy - 10} Q32 ${hy + 6} 20 ${hy + 22} Q12 ${hy + 27} 4 ${hy + 27} Q24 ${hy + 14} 22 ${hy - 10} Z" fill="${P.skinLightShade}" opacity="0.5"/>
    ${granHair(0, hy, false)}
    ${granFace(mood, 0, hy + 2)}
    ${mood === "shock" ? `<path d="M-40 ${hy - 30} L-50 ${hy - 40} M40 ${hy - 30} L50 ${hy - 40} M0 ${hy - 56} L0 ${hy - 68}" fill="none" ${ink(3.5)}/>${sweat(34, hy - 12, 1)}` : ""}
    ${mood === "alert" ? `<path d="M36 ${hy - 26} Q44 ${hy - 34} 40 ${hy - 42}" fill="none" ${ink(3)}/>` : ""}`);
}

function grandmaBack() {
  const hy = -100;
  return svg(GRAN_VB, `
    <ellipse cx="-13" cy="-4" rx="12" ry="6" fill="${GRAN.slipper}" ${ink(3)}/><ellipse cx="13" cy="-4" rx="12" ry="6" fill="${GRAN.slipper}" ${ink(3)}/>
    ${granRobe(-28, 28, -80, -8, true)}
    ${limb("M-24 -76 Q-34 -56 -28 -42", GRAN.robe, 14)}<circle cx="-28" cy="-40" r="7" fill="${P.skinLight}" ${ink(2.5)}/>
    ${limb("M24 -76 Q34 -60 26 -50", GRAN.robe, 14)}
    <ellipse cx="0" cy="${hy}" rx="30" ry="28" fill="${GRAN.hair}" ${ink(3.5)}/>
    <path d="M-18 ${hy + 4} Q0 ${hy - 4} 18 ${hy + 4} M-14 ${hy + 16} Q0 ${hy + 10} 14 ${hy + 16}" fill="none" stroke="${GRAN.hairShade}" stroke-width="2.6" stroke-linecap="round"/>
    ${granHair(0, hy, true)}`);
}

function grandmaSide(mood: GranMood) {
  const hy = -100;
  const cx = 4;
  const ex = cx + 14;
  let eye: string;
  if (mood === "walk") eye = `<path d="M${ex - 5} ${hy + 1} Q${ex} ${hy - 4} ${ex + 5} ${hy + 1}" fill="none" ${ink(3)}/>`;
  else eye = `<circle cx="${ex}" cy="${hy}" r="${mood === "shock" ? 5.5 : 4.5}" fill="${P.white}" ${ink(2.2)}/><circle cx="${ex + 1.5}" cy="${hy}" r="${mood === "shock" ? 1.8 : 2.4}" fill="${P.ink}"/>`;
  const brow = mood === "walk" ? `<path d="M${ex - 7} ${hy - 13} Q${ex} ${hy - 16} ${ex + 7} ${hy - 13}" fill="none" stroke="${GRAN.hairShade}" stroke-width="3.5" stroke-linecap="round"/>` : `<path d="M${ex - 8} ${hy - 17} Q${ex} ${hy - 24} ${ex + 8} ${hy - 18}" fill="none" stroke="${GRAN.hairShade}" stroke-width="3.5" stroke-linecap="round"/>`;
  const mouth =
    mood === "walk"
      ? `<path d="M${cx + 18} ${hy + 16} Q${cx + 23} ${hy + 18} ${cx + 26} ${hy + 14}" fill="none" ${ink(2.6)}/>`
      : mood === "alert"
        ? `<ellipse cx="${cx + 24}" cy="${hy + 17}" rx="3" ry="4" fill="${P.ink}"/>`
        : `<path d="M${cx + 16} ${hy + 12} L${cx + 29} ${hy + 11} Q${cx + 28} ${hy + 25} ${cx + 20} ${hy + 25} Z" fill="${P.ink}" ${ink(2)}/>`;
  const arm =
    mood === "shock"
      ? `${limb("M8 -72 Q34 -84 40 -108", GRAN.robe, 14)}<circle cx="40" cy="-110" r="7" fill="${P.skinLight}" ${ink(2.5)}/>${torch(42, -118, -70)}`
      : `${limb("M0 -74 Q8 -56 24 -56", GRAN.robe, 14)}${torch(30, -56, 0)}<circle cx="26" cy="-56" r="7" fill="${P.skinLight}" ${ink(2.5)}/>`;
  return svg(mood === "shock" ? GRAN_SHOCK_VB : GRAN_VB, `
    <ellipse cx="${mood === "walk" ? 10 : 4}" cy="-4" rx="13" ry="6" fill="${GRAN.slipper}" ${ink(3)}/><ellipse cx="${mood === "walk" ? -10 : -4}" cy="-4" rx="13" ry="6" fill="#8a74c0" ${ink(3)}/>
    <path d="M-20 -80 Q-2 -86 16 -80 L22 -8 Q0 -2 -26 -8 Z" fill="${GRAN.robe}" ${ink(3.5)}/>
    <circle cx="-8" cy="-60" r="2.6" fill="${GRAN.dots}"/><circle cx="6" cy="-40" r="2.6" fill="${GRAN.dots}"/><circle cx="-14" cy="-28" r="2.6" fill="${GRAN.dots}"/><circle cx="10" cy="-20" r="2.6" fill="${GRAN.dots}"/>
    <path d="M-27 -15 Q0 -10 23 -15" fill="none" stroke="${GRAN.gown}" stroke-width="5" stroke-linecap="round"/>
    <path d="M12 -78 L20 -78 L22 -10 L14 -10 Z" fill="${GRAN.robeShade}" opacity="0.45"/>
    <path d="M-4 -82 L-4 -74 Q2 -70 8 -74 L8 -82 Z" fill="${P.skinLight}" ${ink(2.5)}/>
    <ellipse cx="${cx}" cy="${hy}" rx="28" ry="28" fill="${P.skinLight}" ${ink(3.5)}/>
    <path d="M${cx + 27} ${hy + 2} Q${cx + 36} ${hy + 6} ${cx + 28} ${hy + 11}" fill="${P.skinLight}" ${ink(3)}/>
    <circle cx="${cx + 14}" cy="${hy + 10}" r="5" fill="${P.blush}" opacity="0.75"/>
    <path d="M${cx - 30} ${hy + 6} Q${cx - 40} ${hy - 30} ${cx - 6} ${hy - 32} Q${cx + 18} ${hy - 36} ${cx + 28} ${hy - 14} Q${cx + 10} ${hy - 22} ${cx - 6} ${hy - 14} Q${cx - 14} ${hy} ${cx - 22} ${hy + 12} Z" fill="${GRAN.hair}" ${ink(3)}/>
    <circle cx="${cx - 22}" cy="${hy - 30}" r="13" fill="${GRAN.hair}" ${ink(3)}/>
    <path d="M${cx - 28} ${hy - 34} Q${cx - 22} ${hy - 40} ${cx - 16} ${hy - 34}" fill="none" stroke="${GRAN.hairShade}" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="${cx - 6}" cy="${hy + 2}" rx="6" ry="8" fill="${P.skinLight}" ${ink(2.5)}/>
    ${eye}
    <circle cx="${ex}" cy="${hy}" r="9" fill="${P.skyPale}" fill-opacity="0.25" ${ink(2.6)}/><path d="M${ex - 9} ${hy - 1} L${cx - 2} ${hy - 3}" ${ink(2.4)}/>
    ${brow}${mouth}
    ${arm}
    ${mood === "shock" ? `<path d="M${cx - 10} ${hy - 50} L${cx - 14} ${hy - 62} M${cx + 10} ${hy - 48} L${cx + 16} ${hy - 60}" fill="none" ${ink(3.5)}/>${sweat(cx - 30, hy - 16, 1)}` : ""}`);
}

const DOG = { fur: "#d89a4e", furShade: "#b87a34", belly: "#f6e2bd", ear: "#8a5a2a", collar: P.tomato };

export type DogPose = "walk" | "sniff" | "happy" | "alert" | "sleep";

function dogHead(x: number, y: number, pose: DogPose) {
  const eye =
    pose === "happy"
      ? `<path d="M${x + 3} ${y - 5} Q${x + 9} ${y - 12} ${x + 15} ${y - 5}" fill="none" ${ink(3.2)}/>`
      : pose === "sniff"
        ? `<path d="M${x + 3} ${y - 6} Q${x + 9} ${y - 1} ${x + 15} ${y - 6}" fill="none" ${ink(3.2)}/>`
        : `<ellipse cx="${x + 9}" cy="${y - 6}" rx="${pose === "alert" ? 6.5 : 5.5}" ry="${pose === "alert" ? 7.5 : 6.5}" fill="${P.white}" ${ink(2.2)}/><circle cx="${x + 11}" cy="${y - 5}" r="3.4" fill="${P.ink}"/><circle cx="${x + 12.2}" cy="${y - 7}" r="1.3" fill="${P.white}"/>`;
  const earUp = pose === "alert" || pose === "happy";
  const ear = earUp
    ? `<path d="M${x - 10} ${y - 16} Q${x - 20} ${y - 40} ${x - 2} ${y - 32} Q${x + 4} ${y - 24} ${x - 2} ${y - 14} Z" fill="${DOG.ear}" ${ink(2.8)}/>`
    : `<path d="M${x - 8} ${y - 18} Q${x - 26} ${y - 16} ${x - 20} ${y + 10} Q${x - 10} ${y + 14} ${x - 4} ${y - 4} Z" fill="${DOG.ear}" ${ink(2.8)}/>`;
  const tongue = pose === "happy" ? `<path d="M${x + 22} ${y + 8} Q${x + 24} ${y + 20} ${x + 30} ${y + 16} Q${x + 30} ${y + 9} ${x + 27} ${y + 7} Z" fill="${P.bubblegum}" ${ink(2)}/>` : "";
  return `<ellipse cx="${x}" cy="${y}" rx="22" ry="20" fill="${DOG.fur}" ${ink(3.2)}/>
    <path d="M${x + 10} ${y - 2} Q${x + 24} ${y - 4} ${x + 29} ${y + 4} Q${x + 30} ${y + 13} ${x + 20} ${y + 14} Q${x + 10} ${y + 14} ${x + 6} ${y + 8} Z" fill="${DOG.belly}" ${ink(3)}/>
    <ellipse cx="${x + 28}" cy="${y + 3}" rx="5" ry="4.2" fill="${P.ink}"/><circle cx="${x + 27}" cy="${y + 1.5}" r="1.4" fill="${P.white}"/>
    <path d="M${x + 15} ${y + 11} Q${x + 19} ${y + 14} ${x + 23} ${y + 11}" fill="none" ${ink(2.2)}/>
    ${tongue}${eye}${ear}`;
}

const DOG_VB = "-58 -100 140 110";

function dogSide(pose: Exclude<DogPose, "sleep">) {
  const tilt = pose === "happy" ? -14 : pose === "sniff" ? 6 : 0;
  const head = pose === "sniff" ? { x: 30, y: -18 } : pose === "happy" ? { x: 26, y: -58 } : { x: 26, y: -50 };
  const stride = pose === "walk" ? 6 : 0;
  const paw = (x: number, y: number, c: string) => `<ellipse cx="${x + 2}" cy="${y}" rx="7" ry="4.5" fill="${c}" ${ink(2.6)}/>`;
  const legs = pose === "happy"
    ? `${limb("M14 -26 Q24 -36 30 -30", DOG.fur, 15)}${limb("M-22 -20 L-26 -6", DOG.fur, 15)}${paw(-26, -4, DOG.belly)}${limb("M-10 -20 L-6 -6", DOG.furShade, 15)}${paw(-6, -4, DOG.belly)}`
    : `${limb(`M4 -22 L${2 - stride} -6`, DOG.furShade, 15)}${paw(2 - stride, -4, DOG.belly)}${limb(`M-30 -22 L${-28 + stride} -6`, DOG.furShade, 15)}${paw(-28 + stride, -4, DOG.belly)}${limb(`M16 -22 L${18 + stride} -6`, DOG.fur, 15)}${paw(18 + stride, -4, DOG.belly)}${limb(`M-18 -22 L${-20 - stride} -6`, DOG.fur, 15)}${paw(-20 - stride, -4, DOG.belly)}`;
  const tailUp = pose === "sniff" ? "M-38 -34 Q-52 -50 -44 -62" : pose === "alert" ? "M-38 -34 Q-50 -46 -48 -60" : "M-38 -34 Q-56 -44 -50 -58";
  return svg(DOG_VB, `
    <ellipse cx="0" cy="0" rx="40" ry="5" fill="#000" opacity="0"/>
    <path d="${tailUp}" fill="none" stroke="${P.ink}" stroke-width="12" stroke-linecap="round"/><path d="${tailUp}" fill="none" stroke="${DOG.fur}" stroke-width="6" stroke-linecap="round"/>
    <g transform="rotate(${tilt} 0 -30)">
      ${legs}
      <ellipse cx="-6" cy="-32" rx="34" ry="17" fill="${DOG.fur}" ${ink(3.5)}/>
      <path d="M-30 -24 Q-6 -14 22 -22 Q12 -16 -6 -16 Q-22 -16 -30 -24 Z" fill="${DOG.belly}"/>
      <ellipse cx="-14" cy="-38" rx="10" ry="6" fill="${DOG.furShade}" opacity="0.6"/>
    </g>
    <path d="M${head.x - 14} ${head.y + 8} Q${head.x - 6} ${head.y + 16} ${head.x + 4} ${head.y + 12}" fill="none" stroke="${DOG.collar}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="${head.x - 4}" cy="${head.y + 16}" r="3.5" fill="${P.sun}" ${ink(1.5)}/>
    ${dogHead(head.x, head.y, pose)}
    ${pose === "sniff" ? `<path d="M${head.x + 40} ${head.y - 2} q4 -4 8 0 M${head.x + 40} ${head.y + 6} q4 -4 8 0" fill="none" stroke="${P.white}" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>` : ""}
    ${pose === "happy" ? `<path d="M${head.x + 34} ${head.y - 24} l4 -8 M${head.x + 42} ${head.y - 16} l8 -4" fill="none" ${ink(3)}/>` : ""}`);
}

function dogSleep() {
  return svg("-50 -56 100 62", `
    <path d="M-36 -18 Q-46 -36 -24 -42 Q4 -50 30 -38 Q46 -28 38 -12 Q20 -4 -10 -6 Q-30 -6 -36 -18 Z" fill="${DOG.fur}" ${ink(3.5)}/>
    <path d="M-30 -14 Q-8 -8 24 -12" fill="none" stroke="${DOG.furShade}" stroke-width="3" stroke-linecap="round"/>
    <path d="M30 -38 Q48 -30 44 -14 Q30 -8 18 -14" fill="none" stroke="${P.ink}" stroke-width="11" stroke-linecap="round"/><path d="M30 -38 Q48 -30 44 -14 Q30 -8 18 -14" fill="none" stroke="${DOG.fur}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="-20" cy="-24" rx="17" ry="14" fill="${DOG.fur}" ${ink(3)}/>
    <path d="M-34 -22 Q-46 -20 -42 -6 Q-32 -2 -28 -14 Z" fill="${DOG.ear}" ${ink(2.6)}/>
    <path d="M-12 -22 Q2 -22 6 -14 Q4 -8 -6 -8 Q-14 -10 -14 -16 Z" fill="${DOG.belly}" ${ink(2.6)}/>
    <ellipse cx="5" cy="-15" rx="3.5" ry="3" fill="${P.ink}"/>
    <path d="M-24 -26 Q-19 -22 -14 -26" fill="none" ${ink(2.6)}/>
    <path d="M-8 -12 Q-4 -6 4 -8" fill="none" stroke="${DOG.collar}" stroke-width="5" stroke-linecap="round"/><circle cx="-2" cy="-6" r="3" fill="${P.sun}" ${ink(1.4)}/>`);
}

const CAT = { fur: "#2a2342", furHi: "#433a63", eye: "#c8f07a" };

export type CatPose = "idle" | "ready" | "swipe";

function cat(pose: CatPose) {
  const crouch = pose === "ready" ? 6 : 0;
  const hy = -50 + crouch;
  const eyes =
    pose === "idle"
      ? `<path d="M-14 ${hy} Q-9 ${hy - 3} -4 ${hy} M4 ${hy} Q9 ${hy - 3} 14 ${hy}" fill="none" stroke="${CAT.eye}" stroke-width="3.2" stroke-linecap="round"/>`
      : [-9, 9].map((x) => `<ellipse cx="${x}" cy="${hy}" rx="6" ry="6.5" fill="${CAT.eye}" ${ink(1.8)}/><ellipse cx="${x + 1}" cy="${hy}" rx="1.6" ry="5" fill="${P.ink}"/>`).join("");
  const tail = pose === "ready" ? "M14 -10 Q38 -20 30 -50 Q28 -60 36 -62" : "M14 -8 Q40 -8 36 -30 Q34 -40 26 -38";
  const paw = pose === "swipe" ? `${limb("M12 -24 Q30 -30 42 -26", CAT.fur, 11)}<ellipse cx="44" cy="-26" rx="7" ry="5.5" fill="${CAT.fur}" ${ink(2.6)}/><path d="M48 -32 l6 -4 M50 -26 l7 0 M48 -20 l6 4" fill="none" stroke="${P.white}" stroke-width="2.2" stroke-linecap="round"/>` : "";
  return svg("-34 -84 96 90", `
    <path d="${tail}" fill="none" stroke="${P.ink}" stroke-width="11" stroke-linecap="round"/><path d="${tail}" fill="none" stroke="${CAT.fur}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M-20 -4 Q-24 -30 -10 -38 L10 -38 Q24 -30 20 -4 Z" fill="${CAT.fur}" ${ink(3.2)}/>
    <path d="M-6 -30 Q0 -26 6 -30 L6 -10 Q0 -6 -6 -10 Z" fill="${CAT.furHi}"/>
    <ellipse cx="-11" cy="-3" rx="8" ry="4.5" fill="${CAT.fur}" ${ink(2.6)}/>
    ${pose === "swipe" ? "" : `<ellipse cx="11" cy="-3" rx="8" ry="4.5" fill="${CAT.fur}" ${ink(2.6)}/>`}
    ${paw}
    <path d="M-20 ${hy - 6} L-18 ${hy - 30} L-4 ${hy - 16} Z M20 ${hy - 6} L18 ${hy - 30} L4 ${hy - 16} Z" fill="${CAT.fur}" ${ink(2.8)}/>
    <path d="M-16 ${hy - 12} L-15 ${hy - 23} L-8 ${hy - 16} Z M16 ${hy - 12} L15 ${hy - 23} L8 ${hy - 16} Z" fill="${P.bubblegum}" opacity="0.8"/>
    <ellipse cx="0" cy="${hy}" rx="21" ry="17" fill="${CAT.fur}" ${ink(3.2)}/>
    ${eyes}
    <path d="M-2.5 ${hy + 6} L2.5 ${hy + 6} L0 ${hy + 9} Z" fill="${P.bubblegum}"/>
    <path d="M0 ${hy + 9} Q-3 ${hy + 13} -6 ${hy + 11} M0 ${hy + 9} Q3 ${hy + 13} 6 ${hy + 11}" fill="none" stroke="${CAT.furHi}" stroke-width="2" stroke-linecap="round"/>
    <path d="M-8 ${hy + 7} L-26 ${hy + 4} M-8 ${hy + 10} L-25 ${hy + 12} M8 ${hy + 7} L26 ${hy + 4} M8 ${hy + 10} L25 ${hy + 12}" stroke="#d9ccff" stroke-width="1.5" opacity="0.85"/>
    <path d="M-12 ${hy - 13} Q-6 ${hy - 16} 0 ${hy - 14}" fill="none" stroke="${CAT.furHi}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M-8 -34 Q0 -30 8 -34" fill="none" stroke="${P.sun}" stroke-width="4" stroke-linecap="round"/><circle cx="0" cy="-30" r="3" fill="${P.sun}" ${ink(1.2)}/>
    ${pose === "ready" ? `<path d="M-28 ${hy - 26} l-6 -6 M28 ${hy - 26} l6 -6" fill="none" ${ink(2.6)}/>` : ""}`);
}

type Look = "down" | "left" | "right" | "up";

const PJ = "#7d98c6";
const PJ_HI = "#a9bfe0";

function dadSeated(mood: string, look: Look) {
  const asleep = mood === "sleep" || mood === "stir";
  const headTilt = mood === "sleep" ? 18 : mood === "stir" ? 10 : 0;
  const headX = mood === "sleep" ? 8 : 0;
  const arms =
    mood === "angry"
      ? `${limb("M-24 -58 Q-42 -76 -36 -96", PJ, 14)}<circle cx="-36" cy="-98" r="7" fill="${P.skinTan}" ${ink(2.6)}/>${limb("M24 -58 Q34 -44 26 -34", PJ, 14)}<circle cx="26" cy="-32" r="7" fill="${P.skinTan}" ${ink(2.6)}/>`
      : mood === "sleepy"
        ? `${limb("M-24 -58 Q-34 -44 -26 -34", PJ, 14)}<circle cx="-26" cy="-32" r="7" fill="${P.skinTan}" ${ink(2.6)}/>${limb("M24 -58 Q36 -76 16 -92", PJ, 14)}<circle cx="14" cy="-94" r="7" fill="${P.skinTan}" ${ink(2.6)}/>`
        : `${limb("M-24 -58 Q-36 -42 -30 -30", PJ, 14)}<circle cx="-30" cy="-28" r="7" fill="${P.skinTan}" ${ink(2.6)}/>${limb("M24 -58 Q36 -42 30 -30", PJ, 14)}<circle cx="30" cy="-28" r="7" fill="${P.skinTan}" ${ink(2.6)}/>`;
  return svg("-52 -150 104 156", `
    ${limb("M-12 -30 L-14 -6", "#5d7cb0", 16)}${limb("M12 -30 L14 -6", "#5d7cb0", 16)}
    <ellipse cx="-15" cy="-2" rx="11" ry="6" fill="#7a4a32" ${ink(3)}/><ellipse cx="15" cy="-2" rx="11" ry="6" fill="#7a4a32" ${ink(3)}/>
    <path d="M-26 -36 Q0 -26 26 -36 L24 -24 Q0 -16 -24 -24 Z" fill="#5d7cb0" ${ink(3)}/>
    <path d="M-28 -60 Q-26 -82 0 -84 Q26 -82 28 -60 L26 -32 Q0 -26 -26 -32 Z" fill="${PJ}" ${ink(3.5)}/>
    <path d="M-14 -80 L-14 -32 M0 -84 L0 -30 M14 -80 L14 -32" stroke="${PJ_HI}" stroke-width="3"/>
    <path d="M-9 -84 L0 -72 L9 -84" fill="#f6f1e4" ${ink(2.5)}/>
    ${arms}
    <g transform="translate(${headX} -106) rotate(${headTilt}) scale(0.36) translate(-100 -110)">${dadHead(asleep ? (mood === "sleep" ? "sleep" : "stir") : mood, look)}</g>
    ${mood === "sleep" ? `<path d="M28 -100 Q30 -94 26 -90" fill="none" stroke="#9fdcff" stroke-width="3" stroke-linecap="round"/>` : ""}`);
}

export function residents(): Sheet {
  const out: Sheet = {};
  const put = (name: string, art: string) => {
    out[name] = { svg: art, res: 2 };
  };
  for (const mood of ["walk", "alert", "shock"] as const) {
    put(`gran-front-${mood}`, grandmaFront(mood));
    put(`gran-side-${mood}`, grandmaSide(mood));
  }
  put("gran-back", grandmaBack());
  for (const pose of ["walk", "sniff", "happy", "alert"] as const) put(`dog-${pose}`, dogSide(pose));
  put("dog-sleep", dogSleep());
  for (const pose of ["idle", "ready", "swipe"] as const) put(`cat-${pose}`, cat(pose));
  put("dad-seat-sleep", dadSeated("sleep", "down"));
  put("dad-seat-stir", dadSeated("stir", "down"));
  put("dad-seat-sleepy", dadSeated("sleepy", "down"));
  put("dad-seat-angry", dadSeated("angry", "down"));
  for (const look of ["down", "left", "right", "up"] as const) {
    put(`dad-seat-startled-${look}`, dadSeated("startled", look));
    put(`dad-seat-suspicious-${look}`, dadSeated("suspicious", look));
  }
  return out;
}
