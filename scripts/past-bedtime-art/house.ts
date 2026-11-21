import { decorArtName } from "../../src/games/past-bedtime/scenes/art";
import { decorFor } from "../../src/games/past-bedtime/scenes/decor";
import type { LevelDef } from "../../src/games/past-bedtime/sim/types";
import { grandmaDecor, grandmaHides } from "./grandma";
import { ovalArt, petDecor } from "./pets";
import { ink, P, rnd, svg, type Sheet } from "./kit";

const INK = P.ink;

const WOOD = { base: "#b27c57", alt: "#a97452", line: "#74472f", hi: "#c8916a", knot: "#8a5a3c" };

function floorWood(v: number) {
  let body = `<rect x="0" y="0" width="100" height="100" fill="${WOOD.base}"/>`;
  const rows = 4;
  for (let r = 0; r < rows; r += 1) {
    const y = r * 25;
    const seam = 15 + rnd(v * 7 + r * 3) * 70;
    const tint = r % 2 ? WOOD.alt : WOOD.base;
    body += `<rect x="0" y="${y}" width="100" height="25" fill="${tint}"/>`;
    body += `<path d="M0 ${y + 0.8} L100 ${y + 0.8}" stroke="${WOOD.line}" stroke-width="1.8"/>`;
    body += `<path d="M${seam} ${y} L${seam} ${y + 25}" stroke="${WOOD.line}" stroke-width="1.8"/>`;
    body += `<path d="M${4 + rnd(v + r) * 20} ${y + 9} Q${30 + rnd(v * 3 + r) * 20} ${y + 7} ${55 + rnd(r * 5 + v) * 20} ${y + 10}" stroke="${WOOD.hi}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.8"/>`;
    body += `<path d="M${40 + rnd(v * 9 + r) * 30} ${y + 17} Q${60 + rnd(v * 11 + r) * 20} ${y + 19} ${90} ${y + 16}" stroke="${WOOD.line}" stroke-width="1" fill="none" opacity="0.5"/>`;
    if (rnd(v * 13 + r * 7) > 0.7) body += `<ellipse cx="${10 + rnd(v * 17 + r) * 80}" cy="${y + 13}" rx="3" ry="1.8" fill="${WOOD.knot}" opacity="0.8"/>`;
    body += `<circle cx="${seam - 3}" cy="${y + 12}" r="0.9" fill="${WOOD.line}"/><circle cx="${seam + 3}" cy="${y + 12}" r="0.9" fill="${WOOD.line}"/>`;
  }
  return svg("0 0 100 100", body);
}

const HALL = { paper: "#6f8fb6", stripe: "#7f9fc4", motif: "#a9c4e4", crown: "#eee4cf", crownShade: "#c9bfae", base: "#7c4527", baseHi: "#9a5a34" };

function wallFace(kind: string) {
  let body = `<rect width="100" height="100" fill="${HALL.paper}"/>`;
  for (let i = 0; i < 4; i += 1) body += `<rect x="${i * 25 + 6}" y="0" width="9" height="100" fill="${HALL.stripe}"/>`;
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 3; j += 1) {
    const cx = i * 25 + 22;
    const cy = j * 34 + 17 + (i % 2) * 17;
    body += `<path d="M${cx} ${cy - 3.5} L${cx + 2.5} ${cy} L${cx} ${cy + 3.5} L${cx - 2.5} ${cy} Z" fill="${HALL.motif}" opacity="0.9"/>`;
  }
  if (kind === "top" || kind === "single") {
    body += `<rect x="0" y="0" width="100" height="10" fill="#2a2140"/><rect x="0" y="10" width="100" height="8" fill="${HALL.crown}"/><rect x="0" y="15" width="100" height="3" fill="${HALL.crownShade}"/><path d="M0 18 L100 18" stroke="${INK}" stroke-width="2"/><path d="M0 10 L100 10" stroke="${INK}" stroke-width="1.5"/>`;
  }
  if (kind === "bottom" || kind === "single") {
    body += `<rect x="0" y="84" width="100" height="16" fill="${HALL.base}"/><rect x="0" y="84" width="100" height="3" fill="${HALL.baseHi}"/><path d="M0 84 L100 84" stroke="${INK}" stroke-width="2.4"/><rect x="0" y="96" width="100" height="4" fill="#4a2a18"/>`;
  }
  return svg("0 0 100 100", body);
}

function bed() {
  return svg("0 -34 100 234", `
    <rect x="4" y="-30" width="92" height="40" rx="9" fill="#7a4a32" ${ink(3)}/>
    <rect x="10" y="-24" width="80" height="10" rx="4" fill="#9a6440"/>
    <circle cx="20" cy="-6" r="4" fill="#c9a24a" ${ink(1.5)}/><circle cx="80" cy="-6" r="4" fill="#c9a24a" ${ink(1.5)}/>
    <rect x="6" y="6" width="88" height="188" rx="8" fill="#6a3f2a" ${ink(3)}/>
    <rect x="10" y="8" width="80" height="180" rx="6" fill="#f3ecdf" ${ink(2)}/>
    <rect x="18" y="14" width="64" height="36" rx="12" fill="#ffffff" ${ink(2.5)}/>
    <path d="M26 30 Q50 24 74 30" stroke="#d9d0c0" stroke-width="2" fill="none"/>
    <rect x="6" y="180" width="88" height="16" rx="5" fill="#7a4a32" ${ink(3)}/>`);
}

function doorFace(w: number, h: number, variant: string) {
  const W = w;
  const H = h;
  let body = `<rect x="-5" y="-5" width="${W + 10}" height="${H + 5}" rx="3" fill="#eee4cf" ${ink(2.5)}/>
    <rect x="0" y="0" width="${W}" height="${H}" rx="2" fill="#9a6440" ${ink(2.5)}/>
    <rect x="${W * 0.6}" y="0" width="${W * 0.4}" height="${H}" fill="#7c4f32" opacity="0.35"/>
    <rect x="${W * 0.15}" y="${H * 0.07}" width="${W * 0.7}" height="${H * 0.38}" rx="3" fill="none" stroke="#6d4a3a" stroke-width="2.4"/>
    <rect x="${W * 0.15}" y="${H * 0.52}" width="${W * 0.7}" height="${H * 0.38}" rx="3" fill="none" stroke="#6d4a3a" stroke-width="2.4"/>
    <path d="M${W * 0.2} ${H * 0.1} L${W * 0.2} ${H * 0.4}" stroke="#c08a5e" stroke-width="2" stroke-linecap="round"/>
    <circle cx="${W * 0.82}" cy="${H * 0.55}" r="4.4" fill="#ffc83d" ${ink(2)}/><circle cx="${W * 0.8}" cy="${H * 0.53}" r="1.4" fill="#fff"/>`;
  if (variant === "bruno") {
    body += `<rect x="${W * 0.18}" y="${H * 0.15}" width="${W * 0.64}" height="${H * 0.17}" rx="4" fill="#fbf5e6" ${ink(2)}/>
      <circle cx="${W * 0.33}" cy="${H * 0.235}" r="5" fill="#5cb9f0" ${ink(1.5)}/>
      <path d="M${W * 0.5} ${H * 0.19} L${W * 0.53} ${H * 0.23} L${W * 0.57} ${H * 0.23} L${W * 0.54} ${H * 0.26} L${W * 0.55} ${H * 0.3} L${W * 0.5} ${H * 0.275} L${W * 0.45} ${H * 0.3} L${W * 0.46} ${H * 0.26} L${W * 0.43} ${H * 0.23} L${W * 0.47} ${H * 0.23} Z" fill="#ffc83d" ${ink(1.2)}/>
      <rect x="${W * 0.62}" y="${H * 0.2}" width="${W * 0.12}" height="${H * 0.08}" rx="2" fill="#ef4f43" ${ink(1.2)}/>
      <path d="M${W * 0.28} ${H * 0.66} L${W * 0.4} ${H * 0.58} L${W * 0.46} ${H * 0.72} Z" fill="#63d6c1" ${ink(1.5)}/>
      <circle cx="${W * 0.62}" cy="${H * 0.76}" r="6" fill="#f06ba8" ${ink(1.5)}/>`;
  }
  return svg(`-7 -7 ${W + 14} ${H + 9}`, body);
}

function doorLeaf(w: number, h: number) {
  return svg(`-2 -2 ${w + 10} ${h + 6}`, `
    <rect x="5" y="3" width="${w * 0.86}" height="${h}" fill="#000" opacity="0.35"/>
    <rect x="0" y="0" width="${w * 0.86}" height="${h}" rx="2" fill="#9a6440" ${ink(2.5)}/>
    <rect x="${w * 0.1}" y="${h * 0.07}" width="${w * 0.62}" height="${h * 0.36}" rx="3" fill="none" stroke="#6d4a3a" stroke-width="2.4"/>
    <rect x="${w * 0.1}" y="${h * 0.52}" width="${w * 0.62}" height="${h * 0.36}" rx="3" fill="none" stroke="#6d4a3a" stroke-width="2.4"/>
    <circle cx="${w * 0.74}" cy="${h * 0.55}" r="4" fill="#ffc83d" ${ink(2)}/>`);
}

function frameArt(w: number, h: number, v: number) {
  const bg = ["#f2d2a0", "#a9dcf7", "#f9b6d4", "#d8f0c8", "#f6e7c4"][v % 5];
  const m = Math.min(w, h) * 0.13;
  const iw = w - m * 2;
  const ih = h - m * 2;
  const cx = w / 2;
  const cy = h / 2;
  const u = Math.min(iw, ih);
  let art = "";
  if (v === 0 || v === 4) {
    const people = v === 4 ? 4 : 2;
    const skins = ["#5c3320", "#e7a874", "#ffd2a8", "#b5734a"];
    const shirts = ["#5cb9f0", "#f06ba8", "#63d6c1", "#ffc83d"];
    for (let i = 0; i < people; i += 1) {
      const px = m + iw * (0.22 + (i * 0.56) / Math.max(1, people - 1));
      const ps = u * (i >= 2 ? 0.12 : 0.16);
      art += `<path d="M${px - ps * 1.2} ${m + ih} Q${px - ps * 1.2} ${cy + ps * 0.6} ${px} ${cy + ps * 0.5} Q${px + ps * 1.2} ${cy + ps * 0.6} ${px + ps * 1.2} ${m + ih} Z" fill="${shirts[i]}" ${ink(1.5)}/>`;
      art += `<circle cx="${px}" cy="${cy - ps * 0.4}" r="${ps}" fill="${skins[i]}" ${ink(1.5)}/>`;
      art += `<path d="M${px - ps} ${cy - ps * 0.6} Q${px} ${cy - ps * 1.9} ${px + ps} ${cy - ps * 0.6}" fill="#2a1d1a" ${ink(1.2)}/>`;
    }
  } else if (v === 1) {
    art = `<rect x="${m}" y="${m}" width="${iw}" height="${ih}" fill="#a9dcf7"/><path d="M${m} ${m + ih} L${m + iw * 0.4} ${cy - ih * 0.1} L${m + iw * 0.6} ${cy + ih * 0.1} L${m + iw * 0.8} ${cy - ih * 0.15} L${m + iw} ${m + ih} Z" fill="#4c9a43" ${ink(1.5)}/><circle cx="${m + iw * 0.25}" cy="${m + ih * 0.3}" r="${u * 0.1}" fill="#ffc83d" ${ink(1.2)}/>`;
  } else if (v === 2) {
    art = `<circle cx="${cx}" cy="${cy + u * 0.04}" r="${u * 0.26}" fill="#ffd2a8" ${ink(1.5)}/><circle cx="${cx - u * 0.09}" cy="${cy}" r="${u * 0.03}" fill="${INK}"/><circle cx="${cx + u * 0.09}" cy="${cy}" r="${u * 0.03}" fill="${INK}"/><path d="M${cx - u * 0.08} ${cy + u * 0.1} Q${cx} ${cy + u * 0.17} ${cx + u * 0.08} ${cy + u * 0.1}" fill="none" ${ink(1.2)}/><path d="M${cx - u * 0.05} ${cy - u * 0.2} Q${cx} ${cy - u * 0.3} ${cx + u * 0.06} ${cy - u * 0.22}" fill="none" ${ink(1.2)}/>`;
  } else {
    art = `<path d="M${cx} ${cy + u * 0.26} L${cx - u * 0.26} ${cy - u * 0.02} Q${cx - u * 0.3} ${cy - u * 0.26} ${cx - u * 0.1} ${cy - u * 0.26} Q${cx} ${cy - u * 0.24} ${cx} ${cy - u * 0.1} Q${cx} ${cy - u * 0.24} ${cx + u * 0.1} ${cy - u * 0.26} Q${cx + u * 0.3} ${cy - u * 0.26} ${cx + u * 0.26} ${cy - u * 0.02} Z" fill="#ef4f43" ${ink(1.5)}/>`;
  }
  return svg(`-3 -3 ${w + 8} ${h + 8}`, `
    <rect x="3" y="4" width="${w}" height="${h}" rx="3" fill="#000" opacity="0.3"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="#c9a24a" ${ink(2.5)}/>
    <rect x="2" y="2" width="${w - 4}" height="${m * 0.4}" fill="#e8c86a"/>
    <rect x="${m}" y="${m}" width="${iw}" height="${ih}" fill="${bg}" ${ink(1.5)}/>
    ${art}
    <path d="M${m + 3} ${m + 3} L${m + iw * 0.3} ${m + 3}" stroke="#fff" stroke-width="1.6" opacity="0.7" stroke-linecap="round"/>`);
}

function windowArt(w: number, h: number, v?: string) {
  let stars = "";
  for (let i = 0; i < 10; i += 1) stars += `<circle cx="${w * (0.08 + ((i * 37) % 84) / 100)}" cy="${h * (0.1 + ((i * 53) % 45) / 100)}" r="1" fill="#fff" opacity="0.9"/>`;
  const curtains = v === "curtain" || v === "checker";
  const cc = v === "checker" ? "#d9534f" : "#c4687c";
  let cur = "";
  if (curtains) {
    for (const side of [0, 1]) {
      const cw = w * 0.22;
      const x = side === 0 ? -4 : w - cw + 4;
      cur += `<path d="M${x} -6 L${x + cw} -6 Q${x + cw * (side ? 0.2 : 0.8)} ${h * 0.6} ${x + cw * (side ? 0.1 : 0.9)} ${h + 6} L${x} ${h + 6} Z" fill="${cc}" ${ink(2.5)}/>`;
      cur += `<path d="M${x + cw * 0.35} -4 Q${x + cw * 0.4} ${h * 0.5} ${x + cw * 0.3} ${h + 4}" stroke="#fff" stroke-width="1.6" opacity="0.4" fill="none"/>`;
    }
    cur += `<rect x="-10" y="-10" width="${w + 20}" height="5" rx="2" fill="#7c4527" ${ink(1.5)}/>`;
  }
  return svg(`-12 -12 ${w + 24} ${h + 24}`, `
    <rect x="-5" y="-5" width="${w + 10}" height="${h + 10}" rx="3" fill="#eee4cf" ${ink(2.5)}/>
    <rect x="0" y="0" width="${w}" height="${h}" fill="#24306a" ${ink(2)}/>
    <rect x="0" y="${h * 0.55}" width="${w}" height="${h * 0.45}" fill="#34458a"/>
    <path d="M0 ${h * 0.78} L${w * 0.15} ${h * 0.62} L${w * 0.3} ${h * 0.72} L${w * 0.48} ${h * 0.58} L${w * 0.7} ${h * 0.74} L${w * 0.85} ${h * 0.64} L${w} ${h * 0.72} L${w} ${h} L0 ${h} Z" fill="#1d2550"/>
    ${stars}
    <circle cx="${w * 0.74}" cy="${h * 0.3}" r="${Math.min(w, h) * 0.16}" fill="#f4f1c9"/>
    <circle cx="${w * 0.78}" cy="${h * 0.26}" r="${Math.min(w, h) * 0.13}" fill="#24306a"/>
    <path d="M${w / 2} 0 L${w / 2} ${h} M0 ${h / 2} L${w} ${h / 2}" stroke="#eee4cf" stroke-width="3"/>
    <rect x="-7" y="${h + 2}" width="${w + 14}" height="5" rx="2" fill="#eee4cf" ${ink(2)}/>
    ${cur}`);
}

function hooks(w: number, h: number) {
  return svg(`-4 -4 ${w + 8} ${h + 8}`, `
    <rect x="0" y="0" width="${w}" height="8" rx="2" fill="#7c4527" ${ink(2)}/>
    <circle cx="${w * 0.2}" cy="10" r="2.5" fill="#c9a24a"/><circle cx="${w * 0.66}" cy="10" r="2.5" fill="#c9a24a"/>
    <path d="M${w * 0.06} 8 Q${w * 0.02} ${h * 0.4} ${w * 0.08} ${h * 0.62} L${w * 0.5} ${h * 0.62} Q${w * 0.54} ${h * 0.4} ${w * 0.44} 8 Z" fill="#5d7cb0" ${ink(2.5)}/>
    <path d="M${w * 0.27} 8 L${w * 0.27} ${h * 0.6}" stroke="#45619a" stroke-width="2"/>
    <circle cx="${w * 0.27}" cy="${h * 0.25}" r="2" fill="#ffc83d"/><circle cx="${w * 0.27}" cy="${h * 0.4}" r="2" fill="#ffc83d"/>
    <rect x="${w * 0.6}" y="10" width="${w * 0.13}" height="${h * 0.78}" rx="4" fill="#ef4f43" ${ink(2.5)}/>
    <path d="M${w * 0.665} ${h * 0.88} Q${w * 0.665} ${h * 0.98} ${w * 0.76} ${h * 0.97}" fill="none" ${ink(3)}/>`);
}

function consoleTable(w: number, h: number) {
  return svg(`-4 -14 ${w + 8} ${h + 18}`, `
    <rect x="2" y="${h * 0.3}" width="${w - 4}" height="${h * 0.16}" rx="3" fill="#9a6440" ${ink(2.5)}/>
    <rect x="${w * 0.08}" y="${h * 0.46}" width="${w * 0.84}" height="${h * 0.26}" rx="2" fill="#7a4a32" ${ink(2)}/>
    <circle cx="${w * 0.5}" cy="${h * 0.59}" r="2.5" fill="#c9a24a"/>
    <path d="M${w * 0.14} ${h * 0.72} L${w * 0.12} ${h} M${w * 0.86} ${h * 0.72} L${w * 0.88} ${h}" ${ink(4)}/>
    <rect x="${w * 0.12}" y="${h * 0.12}" width="${w * 0.36}" height="${h * 0.2}" rx="5" fill="#ef4f43" ${ink(2.2)}/>
    <path d="M${w * 0.13} ${h * 0.12} Q${w * 0.3} ${-h * 0.04} ${w * 0.47} ${h * 0.12}" fill="#ef4f43" ${ink(2.2)}/>
    <circle cx="${w * 0.3}" cy="${h * 0.22}" r="${w * 0.06}" fill="#fbf5e6" ${ink(1.5)}/>
    <path d="M${w * 0.62} ${h * 0.3} L${w * 0.6} ${h * 0.06} Q${w * 0.7} ${-h * 0.02} ${w * 0.8} ${h * 0.06} L${w * 0.78} ${h * 0.3} Z" fill="#63d6c1" ${ink(2.2)}/>
    <circle cx="${w * 0.66}" cy="${-h * 0.04}" r="5" fill="#f06ba8" ${ink(1.5)}/><circle cx="${w * 0.76}" cy="${-h * 0.06}" r="4" fill="#ffc83d" ${ink(1.5)}/>`);
}

function railing(w: number, h: number) {
  let bars = "";
  for (let i = 0; i < 5; i += 1) bars += `<path d="M${10 + i * 18} ${h * (0.24 + i * 0.054)} L${10 + i * 18} ${h}" ${ink(5)}/><path d="M${10 + i * 18} ${h * (0.24 + i * 0.054)} L${10 + i * 18} ${h}" stroke="#9a6440" stroke-width="2.5" stroke-linecap="round"/>`;
  return svg(`-4 -4 ${w + 8} ${h + 8}`, `${bars}<path d="M4 ${h * 0.2} L${w - 4} ${h * 0.5}" ${ink(8)}/><path d="M4 ${h * 0.2} L${w - 4} ${h * 0.5}" stroke="#7c4527" stroke-width="5" stroke-linecap="round"/>`);
}

function lamp() {
  return svg("-26 -24 52 64", `
    <rect x="-20" y="18" width="40" height="18" rx="3" fill="#8a5a3c" ${ink(2.5)}/>
    <rect x="-20" y="18" width="40" height="5" fill="#a86e4b"/>
    <path d="M0 18 L0 6" ${ink(4)}/><path d="M0 18 L0 6" stroke="#c9a24a" stroke-width="2"/>
    <path d="M-8 -16 L8 -16 L13 6 L-13 6 Z" fill="#f6e7c4" ${ink(2.5)}/>
    <path d="M-12 2 L12 2" stroke="#e0b97a" stroke-width="2"/>`);
}

function switchPlate() {
  return svg("-8 -11 16 22", `<rect x="-6" y="-9" width="12" height="18" rx="2" fill="#f6f1e4" ${ink(1.8)}/><rect x="-2" y="-4" width="4" height="6" rx="1" fill="#9aa6b8"/>`);
}

function jamb(h: number) {
  return svg(`-7 -2 14 ${h + 4}`, `<rect x="-5" y="0" width="10" height="${h}" rx="2" fill="#eee4cf" ${ink(2)}/><path d="M-1 4 L-1 ${h - 4}" stroke="#c9bfae" stroke-width="2"/>`);
}

function clockBody() {
  return svg("-40 -52 80 92", `
    <path d="M-38 -16 L0 -48 L38 -16 Z" fill="#7c4527" ${ink(3)}/>
    <path d="M-30 -18 L0 -42 L30 -18" fill="none" stroke="#9a5a34" stroke-width="3"/>
    <path d="M-26 -36 Q-34 -40 -40 -30 M26 -36 Q34 -40 40 -30" fill="none" stroke="#4c9a43" stroke-width="4" stroke-linecap="round"/>
    <rect x="-30" y="-18" width="60" height="56" rx="4" fill="#b06c3f" ${ink(3)}/>
    <rect x="12" y="-18" width="18" height="56" fill="#8a5a34" opacity="0.5"/>
    <rect x="-9" y="-34" width="18" height="14" rx="2" fill="#55301e" ${ink(2)}/>
    <circle cx="0" cy="12" r="17" fill="#fbf5e6" ${ink(3)}/>
    <path d="M0 -2 L0 0 M14 12 L12 12 M0 26 L0 24 M-14 12 L-12 12" stroke="${INK}" stroke-width="2"/>`);
}

function clockBird() {
  return svg("-14 -14 28 28", `<ellipse cx="0" cy="2" rx="10" ry="9" fill="#ffc83d" ${ink(2.5)}/><path d="M-4 4 L4 4 L0 12 Z" fill="#ef4f43" ${ink(1.5)}/><circle cx="-4" cy="-1" r="1.6" fill="${INK}"/><circle cx="4" cy="-1" r="1.6" fill="${INK}"/><path d="M-6 -8 Q0 -14 6 -8" fill="none" stroke="#ef4f43" stroke-width="2.5" stroke-linecap="round"/>`);
}

function clockPendulum() {
  return svg("-10 -2 20 44", `<path d="M0 0 L0 30" ${ink(4)}/><path d="M0 0 L0 30" stroke="#ffc83d" stroke-width="2"/><circle cx="0" cy="34" r="6" fill="#ffc83d" ${ink(2.5)}/><circle cx="-2" cy="32" r="1.6" fill="#fff"/>`);
}

function rug(w: number, h: number, color: string, light: string) {
  let dots = "";
  const step = 30;
  for (let y = step; y < h - step / 2; y += step) for (let x = step; x < w - step / 2; x += step) dots += `<path d="M${x} ${y - 6} L${x + 6} ${y} L${x} ${y + 6} L${x - 6} ${y} Z" fill="${light}" opacity="0.55"/>`;
  let fringe = "";
  for (let x = 6; x < w - 4; x += 8) fringe += `<path d="M${x} 0 L${x} -5 M${x} ${h} L${x} ${h + 5}" stroke="#f6e7c4" stroke-width="2" stroke-linecap="round"/>`;
  return svg(`-4 -8 ${w + 8} ${h + 16}`, `${fringe}<rect x="0" y="0" width="${w}" height="${h}" rx="6" fill="${color}" ${ink(2.5)}/><rect x="7" y="7" width="${w - 14}" height="${h - 14}" rx="4" fill="none" stroke="${light}" stroke-width="3" opacity="0.8"/><rect x="13" y="13" width="${w - 26}" height="${h - 26}" rx="3" fill="none" stroke="${light}" stroke-width="1.5" opacity="0.6"/>${dots}`);
}

function stairsDown() {
  let steps = "";
  const shades = ["#b27c57", "#9a6844", "#7f5436", "#63402a", "#48301f"];
  for (let i = 0; i < 5; i += 1) steps += `<rect x="${4 + i * 18.4}" y="4" width="18.4" height="92" fill="${shades[i]}" ${ink(2)}/><path d="M${6 + i * 18.4} 6 L${6 + i * 18.4} 94" stroke="#fff" stroke-width="1.5" opacity="${0.4 - i * 0.07}"/>`;
  return svg("0 -4 100 104", `${steps}<rect x="2" y="-2" width="96" height="8" rx="2" fill="#7c4527" ${ink(2)}/>`);
}

function sock() {
  return svg("-4 -4 30 34", `<path d="M2 0 L14 0 L14 18 Q22 18 22 24 Q22 28 14 28 L6 28 Q2 28 2 22 Z" fill="#f6f1e4" ${ink(2)}/><rect x="2" y="2" width="12" height="4" fill="#ef4f43"/><rect x="2" y="8" width="12" height="3" fill="#5cb9f0"/>`);
}

function comic() {
  return svg("-3 -3 38 28", `<rect x="0" y="0" width="32" height="22" fill="#fbf5e6" ${ink(2)}/><path d="M16 0 L16 22" ${ink(1.5)}/><rect x="3" y="3" width="10" height="7" fill="#ffc83d" ${ink(1)}/><rect x="19" y="12" width="10" height="7" fill="#5cb9f0" ${ink(1)}/><path d="M3 14 L13 14 M3 17 L11 17 M19 5 L29 5 M19 8 L27 8" stroke="#9cc7ea" stroke-width="1.2"/>`);
}


function levelFloor(level: LevelDef) {
  const w = level.map[0].length;
  const h = level.map.length;
  const floorTile = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && level.map[y][x] !== "#";
  let clip = "";
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) if (floorTile(x, y)) clip += `<rect x="${x * 100 - 0.5}" y="${y * 100 - 0.5}" width="101" height="101"/>`;
  const tints = ["#b27c57", "#a97452", "#b8835c", "#a46f4d", "#ad7854"];
  let planks = "";
  const rowH = 25;
  for (let r = 0; r < h * 4; r += 1) {
    const y = r * rowH;
    let x = -rnd(r * 3.1) * 120;
    let k = 0;
    while (x < w * 100) {
      const len = 130 + rnd(r * 17 + k * 7) * 150;
      const tint = tints[Math.floor(rnd(r * 11 + k * 5) * tints.length)];
      planks += `<rect x="${x}" y="${y}" width="${len}" height="${rowH}" fill="${tint}"/>`;
      planks += `<path d="M${x} ${y} L${x} ${y + rowH}" stroke="${WOOD.line}" stroke-width="2"/>`;
      planks += `<circle cx="${x + 4}" cy="${y + 8}" r="1.1" fill="${WOOD.line}"/><circle cx="${x + 4}" cy="${y + 17}" r="1.1" fill="${WOOD.line}"/>`;
      const gx = x + 12 + rnd(r * 5 + k) * 30;
      planks += `<path d="M${gx} ${y + 9} Q${gx + len * 0.25} ${y + 6 + rnd(k + r) * 4} ${gx + len * 0.55} ${y + 10}" stroke="${WOOD.hi}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.75"/>`;
      planks += `<path d="M${gx + len * 0.2} ${y + 18} Q${gx + len * 0.4} ${y + 20} ${gx + len * 0.7} ${y + 17}" stroke="${WOOD.line}" stroke-width="1" fill="none" opacity="0.45"/>`;
      if (rnd(r * 23 + k * 13) > 0.82) planks += `<ellipse cx="${x + len * (0.3 + rnd(r + k * 3) * 0.4)}" cy="${y + 13}" rx="3.5" ry="2" fill="${WOOD.knot}" opacity="0.8"/>`;
      x += len;
      k += 1;
    }
    planks += `<path d="M0 ${y + 0.8} L${w * 100} ${y + 0.8}" stroke="${WOOD.line}" stroke-width="1.8"/>`;
  }
  let shade = "";
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!floorTile(x, y)) continue;
      if (!floorTile(x, y - 1)) shade += `<rect x="${x * 100}" y="${y * 100}" width="100" height="26" fill="url(#ao-top)"/>`;
      if (!floorTile(x - 1, y)) shade += `<rect x="${x * 100}" y="${y * 100}" width="16" height="100" fill="url(#ao-left)"/>`;
      if (!floorTile(x + 1, y)) shade += `<rect x="${x * 100 + 84}" y="${y * 100}" width="16" height="100" fill="url(#ao-right)"/>`;
    }
  }
  const scuffs = Array.from({ length: Math.round(w * h * 0.35) }, (_, i) => {
    const sx = rnd(i * 7.3 + 1) * w * 100;
    const sy = rnd(i * 3.7 + 2) * h * 100;
    return `<path d="M${sx} ${sy} q${6 + rnd(i) * 10} ${-2 + rnd(i * 2) * 4} ${14 + rnd(i * 3) * 12} ${rnd(i * 5) * 3}" stroke="#d9a77a" stroke-width="1.3" fill="none" opacity="0.35" stroke-linecap="round"/>`;
  }).join("");
  return svg(`0 0 ${w * 100} ${h * 100}`, `<defs>
    <clipPath id="floor">${clip}</clipPath>
    <linearGradient id="ao-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="ao-left" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="ao-right" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  </defs><g clip-path="url(#floor)">${planks}${scuffs}${shade}</g>`);
}

function creakBoard(v: number) {
  const low = v % 2 === 1;
  const top = low ? 48 : 16;
  const tilt = (v === 0 ? 4 : v === 1 ? -4 : v === 2 ? -3 : 5);
  const lift = v >= 2;
  const pts = (dy: number) => `3,${top + dy + tilt} 97,${top + dy - tilt} 97,${top + 30 + dy - tilt} 3,${top + 30 + dy + tilt}`;
  return svg("0 0 100 100", `
    <polygon points="${pts(6)}" fill="#000" opacity="0.4"/>
    <polygon points="${pts(0)}" fill="#f0d29c" ${ink(3)}/>
    <polygon points="3,${top + 22 + tilt} 97,${top + 22 - tilt} 97,${top + 30 - tilt} 3,${top + 30 + tilt}" fill="#c9a06c"/>
    <path d="M8 ${top + 4 + tilt} L90 ${top + 3 - tilt}" stroke="#fff6dc" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M${lift ? 52 : 18} ${top + 13} L${lift ? 64 : 32} ${top + 18} L${lift ? 74 : 44} ${top + 14}" stroke="#9a6a3c" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M${lift ? 14 : 62} ${top + 11} Q${lift ? 26 : 72} ${top + 16} ${lift ? 38 : 84} ${top + 12}" stroke="#9a6a3c" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="10" cy="${top + 15 + tilt * 0.8}" r="3" fill="#b9c2d6" ${ink(1.5)}/>
    ${lift ? `<path d="M86 ${top + 12 - tilt} l6 -6" ${ink(2)}/><circle cx="93" cy="${top + 5 - tilt}" r="2.4" fill="#b9c2d6" ${ink(1.2)}/>` : `<circle cx="90" cy="${top + 15 - tilt * 0.8}" r="3" fill="#b9c2d6" ${ink(1.5)}/>`}`);
}

function mouseHole() {
  return svg("-20 -26 40 28", `<path d="M-16 0 L-16 -10 Q-16 -22 0 -22 Q16 -22 16 -10 L16 0 Z" fill="#140f26" ${ink(2.5)}/><circle cx="-4" cy="-10" r="1.6" fill="#fff"/><circle cx="3" cy="-10" r="1.6" fill="#fff"/>`);
}

function outlet() {
  return svg("-8 -10 16 20", `<rect x="-6" y="-8" width="12" height="16" rx="2" fill="#f6f1e4" ${ink(1.6)}/><circle cx="-2" cy="-1" r="1.1" fill="${INK}"/><circle cx="2" cy="-1" r="1.1" fill="${INK}"/>`);
}

function growthChart() {
  let marks = "";
  const names = [[0, 6], [26, 4], [52, 7], [74, 5]];
  for (const [y, w] of names) marks += `<path d="M-${w} ${y} L${w} ${y}" stroke="#3b3550" stroke-width="2" stroke-linecap="round"/><path d="M${w + 2} ${y - 3} q4 2 8 -1 M${w + 2} ${y + 2} q3 1 6 0" stroke="#3b3550" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  return svg("-12 -6 34 90", `<rect x="-3" y="-4" width="6" height="86" fill="#f6f1e4" opacity="0.5"/>${marks}`);
}

function toyShelf() {
  return svg("-4 -46 88 54", `
    <rect x="0" y="0" width="80" height="7" rx="2" fill="#7c4527" ${ink(2.2)}/>
    <path d="M8 7 L12 14 M72 7 L68 14" ${ink(2)}/>
    <path d="M10 0 L10 -26 Q18 -42 26 -26 L26 0 Z" fill="#ef4f43" ${ink(2)}/><circle cx="18" cy="-16" r="4" fill="#a9dcf7" ${ink(1.5)}/><path d="M10 0 L4 4 L10 -8 M26 0 L32 4 L26 -8" fill="#ffc83d" ${ink(1.5)}/>
    <rect x="36" y="-22" width="18" height="22" rx="3" fill="#9aa6b8" ${ink(2)}/><rect x="39" y="-34" width="12" height="12" rx="2" fill="#9aa6b8" ${ink(2)}/><circle cx="43" cy="-28" r="1.6" fill="#ef4f43"/><circle cx="48" cy="-28" r="1.6" fill="#ef4f43"/><path d="M45 -34 L45 -40" ${ink(1.6)}/><circle cx="45" cy="-41" r="2" fill="#ffc83d"/>
    <rect x="60" y="-14" width="14" height="14" rx="2" fill="#63d6c1" ${ink(2)}/><rect x="62" y="-26" width="10" height="12" rx="2" fill="#f06ba8" ${ink(2)}/>`);
}

function sconce() {
  return svg("-12 -16 24 30", `<rect x="-3" y="2" width="6" height="10" rx="1" fill="#c9a24a" ${ink(1.6)}/><path d="M-9 -12 L9 -12 L6 4 L-6 4 Z" fill="#f6e7c4" ${ink(2)}/><path d="M-7 0 L7 0" stroke="#e0b97a" stroke-width="1.5"/>`);
}

function alarmClock() {
  return svg("-26 -22 52 40", `
    <rect x="-22" y="-4" width="44" height="20" rx="3" fill="#8a5a3c" ${ink(2.2)}/>
    <rect x="-20" y="-18" width="40" height="16" rx="3" fill="#2b2150" ${ink(2)}/>
    <rect x="-16" y="-15" width="26" height="10" rx="1.5" fill="#3a0f14"/>
    <text x="-3" y="-7" font-family="monospace" font-size="9" font-weight="bold" fill="#ff5a4a" text-anchor="middle">03:00</text>
    <circle cx="14" cy="-10" r="2.5" fill="#9aa6b8"/>`);
}

function basket() {
  let weave = "";
  for (let i = 0; i < 6; i += 1) weave += `<path d="M${-26 + i * 10} -2 L${-24 + i * 10} 26" stroke="#b07a44" stroke-width="2"/>`;
  return svg("-34 -18 68 50", `
    <path d="M-30 -4 L30 -4 L26 28 L-26 28 Z" fill="#d9a066" ${ink(2.5)}/>${weave}
    <path d="M-28 6 L28 6 M-27 16 L27 16" stroke="#b07a44" stroke-width="2"/>
    <path d="M-22 -4 Q-18 -16 -6 -12 Q0 -18 10 -12 Q20 -16 24 -4 Z" fill="#5cb9f0" ${ink(2)}/>
    <path d="M-4 -10 Q4 -20 12 -8" fill="#f06ba8" ${ink(1.8)}/>`);
}

function kidDrawing(w: number, h: number) {
  return svg(`-4 -4 ${w + 8} ${h + 8}`, `
    <rect x="0" y="0" width="${w}" height="${h}" fill="#fbf5e6" ${ink(2)}/>
    <circle cx="${w * 0.5}" cy="-1" r="2.5" fill="#ef4f43" ${ink(1)}/>
    <rect x="${w * 0.22}" y="${h * 0.34}" width="${w * 0.56}" height="${h * 0.42}" rx="4" fill="none" stroke="#5cb9f0" stroke-width="2.5"/>
    <rect x="${w * 0.3}" y="${h * 0.42}" width="${w * 0.4}" height="${h * 0.26}" fill="#9df0dc"/>
    <path d="M${w * 0.42} ${h * 0.34} L${w * 0.32} ${h * 0.14} M${w * 0.58} ${h * 0.34} L${w * 0.68} ${h * 0.14}" stroke="#3b3550" stroke-width="2" stroke-linecap="round"/>
    <circle cx="${w * 0.42}" cy="${h * 0.53}" r="2" fill="${INK}"/><circle cx="${w * 0.58}" cy="${h * 0.53}" r="2" fill="${INK}"/>
    <path d="M${w * 0.12} ${h * 0.9} L${w * 0.88} ${h * 0.88}" stroke="#4c9a43" stroke-width="2.5" stroke-linecap="round"/>`);
}

export function house(levels: readonly LevelDef[]): Sheet {
  const out: Sheet = {};
  const put = (name: string, art: string, res?: number) => {
    out[name] = { svg: art, res };
  };
  for (const level of levels) put(`floor-${level.id}`, levelFloor(level), 1.25);
  for (const v of [0, 1, 2]) put(`floor-wood-${v}`, floorWood(v));
  for (const v of [0, 1, 2, 3]) put(`creak-${v}`, creakBoard(v));
  for (const k of ["top", "mid", "bottom", "single"]) put(`wall-hall-${k}`, wallFace(k));
  put("bed", bed());
  put("door-bruno-88x170", doorFace(88, 170, "bruno"));
  put("door-plain-88x170", doorFace(88, 170, "plain"));
  put("doorLeaf-86x170", doorLeaf(86, 170));
  const frames: [number, number, number][] = [[50, 60, 2], [80, 75, 0], [60, 55, 1], [70, 50, 3], [60, 65, 2], [80, 90, 0], [70, 55, 3], [60, 50, 2], [60, 75, 1]];
  for (const [w, h, v] of frames) put(`frame-${v}-${w}x${h}`, frameArt(w, h, v));
  put("window-190x52", windowArt(190, 52));
  put("window-140x52", windowArt(140, 52));
  put("window-160x100", windowArt(160, 100));
  put("hooks-84x160", hooks(84, 160));
  put("console-92x96", consoleTable(92, 96));
  put("railing-100x96", railing(100, 96));
  put("lamp", lamp());
  put("switch", switchPlate());
  put("jamb-186", jamb(186));
  put("jamb-86", jamb(86));
  put("clock-body", clockBody());
  put("clock-bird", clockBird());
  put("clock-pendulum", clockPendulum());
  put("runner-184x72", rug(184, 72, "#3f7a8c", "#a9dcf7"));
  put("rug-176x272", rug(176, 272, "#4f7f8f", "#a9dcf7"));
  put("rug-rose-176x272", rug(176, 272, "#9a6a72", "#f9b6d4"));
  put("stairs", stairsDown());
  put("sock", sock());
  put("comic", comic());
  put("mouseHole", mouseHole());
  put("outlet", outlet());
  put("growthChart", growthChart());
  put("toyShelf", toyShelf());
  put("sconce", sconce());
  put("alarmClock", alarmClock());
  put("basket", basket());
  put("kidDrawing-56x48", kidDrawing(56, 48));
  for (const [name, art] of Object.entries(grandmaHides())) put(name, art);
  for (const level of levels) {
    const d = decorFor(level.id);
    for (const item of [...d.wall, ...d.floor, ...d.top]) {
      const name = decorArtName(item.kind, item.w, item.h, item.v);
      if (!name || out[name]) continue;
      const w = Math.round((item.w ?? 1) * 100);
      const h = Math.round((item.h ?? 1) * 100);
      const v = item.v;
      let art = "";
      if (item.kind === "frame") art = frameArt(w, h, Number(v ?? 0));
      else if (item.kind === "window") art = windowArt(w, h, typeof v === "string" ? v : undefined);
      else if (item.kind === "runner" || item.kind === "rug") art = v === 0x9a6a72 ? rug(w, h, "#9a6a72", "#f9b6d4") : rug(w, h, "#3f7a8c", "#a9dcf7");
      else if (item.kind === "door") art = doorFace(w, h, v === "bruno" ? "bruno" : "plain");
      else if (item.kind === "doorLeaf") art = doorLeaf(w, h);
      else if (item.kind === "jamb") art = jamb(h);
      else if (item.kind === "hooks") art = hooks(w, h);
      else if (item.kind === "console") art = consoleTable(w, h);
      else if (item.kind === "railing") art = railing(w, h);
      else if (item.kind === "kidDrawing") art = kidDrawing(w, h);
      else if (item.kind === "oval") art = ovalArt(w, h, Number(v));
      else art = grandmaDecor(item.kind, w, h) ?? petDecor(item.kind, w, h) ?? "";
      if (art) put(name, art);
    }
  }
  return out;
}
