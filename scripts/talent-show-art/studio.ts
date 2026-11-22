import { P } from "../../src/lib/palette";
import { layoutFor, type Layout, type Orientation } from "../../src/games/talent-show/scenes/layout";
import type { Sheet } from "../past-bedtime-art/kit";

const ink = (w = 5) => `stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const svg = (w: number, h: number, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`;

function curtain(x: number, w: number, h: number, flip: boolean) {
  const folds = 4;
  const fw = w / folds;
  let body = `<rect x="${x}" y="0" width="${w}" height="${h}" fill="${P.tomato}"/>`;
  for (let i = 0; i < folds; i += 1) {
    const fx = x + i * fw;
    body += `<path d="M${fx + fw * 0.55} 0 Q${fx + fw * 0.75} ${h * 0.5} ${fx + fw * 0.6} ${h} L${fx + fw} ${h} L${fx + fw} 0 Z" fill="${P.tomatoDeep}" opacity="0.85"/>`;
    body += `<path d="M${fx + fw * 0.2} 0 Q${fx + fw * 0.3} ${h * 0.5} ${fx + fw * 0.18} ${h}" stroke="#ff7a6e" stroke-width="5" fill="none" opacity="0.7"/>`;
  }
  const edge = flip ? x : x + w;
  body += `<path d="M${edge} 0 L${edge} ${h}" ${ink(6)}/>`;
  body += `<path d="M${x} ${h * 0.52} Q${x + w / 2} ${h * 0.58} ${x + w} ${h * 0.5}" stroke="${P.sun}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${x} ${h * 0.52} Q${x + w / 2} ${h * 0.58} ${x + w} ${h * 0.5}" ${ink(3)} fill="none" opacity="0.6"/>`;
  return body;
}

function digit(d: string, x: number, y: number, s: number) {
  const seg: Record<string, string> = {
    a: `M${x} ${y} L${x + s} ${y}`,
    b: `M${x + s} ${y} L${x + s} ${y + s}`,
    c: `M${x + s} ${y + s} L${x + s} ${y + 2 * s}`,
    d: `M${x} ${y + 2 * s} L${x + s} ${y + 2 * s}`,
    e: `M${x} ${y + s} L${x} ${y + 2 * s}`,
    f: `M${x} ${y} L${x} ${y + s}`,
    g: `M${x} ${y + s} L${x + s} ${y + s}`,
  };
  const on: Record<string, string> = { "4": "fgbc", "0": "abcdef" };
  const path = [...on[d]].map((k) => seg[k]).join(" ");
  return `<path d="${path}" fill="none" stroke="${P.ink}" stroke-width="${s * 0.42}" stroke-linecap="round" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${P.sun}" stroke-width="${s * 0.26}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function sign(cx: number, cy: number, w: number, h: number) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const bulbs: string[] = [];
  const step = 34;
  for (let bx = x + 20; bx <= x + w - 20; bx += step) bulbs.push(`<circle cx="${bx}" cy="${y + 14}" r="7" fill="${P.sunPale}" ${ink(3)}/><circle cx="${bx}" cy="${y + h - 14}" r="7" fill="${P.sunPale}" ${ink(3)}/>`);
  for (let by = y + 14 + step; by <= y + h - 14 - step / 2; by += step) bulbs.push(`<circle cx="${x + 14}" cy="${by}" r="7" fill="${P.sunPale}" ${ink(3)}/><circle cx="${x + w - 14}" cy="${by}" r="7" fill="${P.sunPale}" ${ink(3)}/>`);
  const s = (h - 70) / 2;
  const gap = s * 0.7;
  const total = s * 3 + gap * 2;
  const dx = cx - total / 2;
  const dy = cy - s;
  return `<rect x="${x + 8}" y="${y + 10}" width="${w}" height="${h}" rx="22" fill="${P.ink}" opacity="0.35"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${P.plum700}" ${ink(6)}/><rect x="${x + 28}" y="${y + 28}" width="${w - 56}" height="${h - 56}" rx="12" fill="${P.plum950}" ${ink(4)}/>${bulbs.join("")}${digit("4", dx, dy, s)}${digit("0", dx + s + gap, dy, s)}${digit("4", dx + 2 * (s + gap), dy, s)}`;
}

function truss(w: number, y: number, lamps: number[]) {
  let body = `<rect x="0" y="${y - 10}" width="${w}" height="20" fill="${P.plum950}" ${ink(4)}/>`;
  for (let x = 0; x < w; x += 40) body += `<path d="M${x} ${y - 10} L${x + 20} ${y + 10} L${x + 40} ${y - 10}" stroke="${P.plum600}" stroke-width="3" fill="none"/>`;
  for (const lx of lamps) body += `<path d="M${lx} ${y + 6} L${lx} ${y + 22}" ${ink(5)}/><path d="M${lx - 22} ${y + 22} L${lx + 22} ${y + 22} L${lx + 16} ${y + 62} L${lx - 16} ${y + 62} Z" fill="#3b3b4a" ${ink(4.5)}/><ellipse cx="${lx}" cy="${y + 62}" rx="16" ry="6" fill="${P.sunPale}" ${ink(3)}/>`;
  return body;
}

function floor(w: number, top: number, bottom: number) {
  let body = `<rect x="0" y="${top}" width="${w}" height="${bottom - top}" fill="${P.wood}"/>`;
  for (let y = top + 24, row = 0; y < bottom - 18; y += 24, row += 1) {
    body += `<path d="M0 ${y} L${w} ${y}" stroke="${P.woodDeep}" stroke-width="3" opacity="0.7"/>`;
    for (let x = (row % 2) * 90; x < w; x += 180) body += `<path d="M${x} ${y - 24} L${x} ${y}" stroke="${P.woodDeep}" stroke-width="3" opacity="0.5"/>`;
  }
  body += `<rect x="0" y="${top}" width="${w}" height="10" fill="${P.woodDeep}"/><path d="M0 ${top} L${w} ${top}" ${ink(6)}/>`;
  body += `<rect x="0" y="${bottom - 18}" width="${w}" height="18" fill="${P.woodDark}"/><path d="M0 ${bottom - 18} L${w} ${bottom - 18}" ${ink(4)}/>`;
  for (let x = 40; x < w; x += 80) body += `<circle cx="${x}" cy="${bottom - 9}" r="5" fill="${P.sunPale}" ${ink(2.5)}/>`;
  return body;
}

function studio(o: Orientation) {
  const L: Layout = layoutFor(o);
  const { W, H } = L;
  const floorTop = L.stage.top;
  const floorBottom = L.stage.front;
  const curtainW = o === "landscape" ? 120 : 70;
  const wallPanels = Array.from({ length: Math.ceil(W / 160) }, (_, i) => `<rect x="${i * 160 + 18}" y="120" width="124" height="${floorTop - 140}" rx="10" fill="${P.plum800}" opacity="0.7"/>`).join("");
  const signBox = L.sign;
  return svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="${P.plum900}"/>${wallPanels}${sign(signBox.cx, signBox.cy, signBox.w, signBox.h)}${floor(W, floorTop, floorBottom)}<rect x="0" y="${floorBottom}" width="${W}" height="${H - floorBottom}" fill="${P.plum950}"/>${curtain(0, curtainW, floorTop, false)}${curtain(W - curtainW, curtainW, floorTop, true)}${truss(W, L.lamps.y, L.lamps.xs)}`,
  );
}

function desk() {
  return svg(
    220,
    120,
    `<rect x="6" y="12" width="208" height="102" rx="10" fill="${P.ink}" opacity="0.3"/><rect x="4" y="18" width="212" height="98" rx="8" fill="${P.plum600}" ${ink(5)}/><rect x="4" y="4" width="212" height="22" rx="8" fill="${P.cream3}" ${ink(5)}/><path d="M16 40 L204 40" stroke="${P.sun}" stroke-width="5" stroke-linecap="round"/><rect x="34" y="56" width="152" height="42" rx="10" fill="${P.cream}" ${ink(4)}/>`,
  );
}

function plate() {
  return svg(
    124,
    170,
    `<rect x="54" y="88" width="16" height="80" rx="6" fill="${P.wood}" ${ink(4)}/><rect x="6" y="6" width="112" height="96" rx="16" fill="${P.white}" ${ink(6)}/><rect x="14" y="14" width="96" height="80" rx="10" fill="none" stroke="${P.sun}" stroke-width="4"/>`,
  );
}

function crowd(variant: number) {
  const fill = P.plum800;
  const rim = P.plum500;
  const heads = [
    `<circle cx="60" cy="52" r="30" fill="${fill}"/><path d="M8 130 Q10 82 60 80 Q110 82 112 130 Z" fill="${fill}"/>`,
    `<circle cx="60" cy="56" r="27" fill="${fill}"/><circle cx="60" cy="24" r="14" fill="${fill}"/><path d="M12 130 Q14 86 60 84 Q106 86 108 130 Z" fill="${fill}"/>`,
    `<circle cx="60" cy="54" r="28" fill="${fill}"/><path d="M28 44 Q60 14 92 44 L104 48 L28 48 Z" fill="${fill}"/><path d="M10 130 Q12 84 60 82 Q108 84 110 130 Z" fill="${fill}"/>`,
    `<circle cx="60" cy="58" r="28" fill="${fill}"/><path d="M10 130 Q12 88 60 86 Q108 88 110 130 Z" fill="${fill}"/><path d="M22 96 L6 20 M98 96 L114 20" stroke="${fill}" stroke-width="18" stroke-linecap="round"/>`,
  ];
  return svg(120, 130, `${heads[variant]}<path d="M34 34 Q60 18 86 34" stroke="${rim}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
}

export function studioSheet(): Sheet {
  return {
    "studio-landscape": { svg: studio("landscape"), res: 1 },
    "studio-portrait": { svg: studio("portrait"), res: 1 },
    desk: { svg: desk() },
    plate: { svg: plate() },
    "crowd-0": { svg: crowd(0) },
    "crowd-1": { svg: crowd(1) },
    "crowd-2": { svg: crowd(2) },
    "crowd-3": { svg: crowd(3) },
  };
}
