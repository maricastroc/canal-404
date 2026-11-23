import { P } from "../../src/lib/palette";
import { DESK_LIP, layoutFor, phoneStage, type Orientation, type StageLayout } from "../../src/games/talent-show/scenes/layout";
import type { Sheet } from "../past-bedtime-art/kit";

const ink = (w = 5) => `stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const svg = (w: number, h: number, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const bulb = (x: number, y: number, r = 7) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${P.sunPale}" ${ink(3)}/>`;

function curtain(x: number, top: number, w: number, h: number, flip: boolean) {
  const folds = 4;
  const fw = w / folds;
  let body = `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${P.tomato}"/>`;
  for (let i = 0; i < folds; i += 1) {
    const fx = x + i * fw;
    body += `<path d="M${fx + fw * 0.55} ${top} Q${fx + fw * 0.75} ${top + h * 0.5} ${fx + fw * 0.6} ${top + h} L${fx + fw} ${top + h} L${fx + fw} ${top} Z" fill="${P.tomatoDeep}" opacity="0.85"/>`;
    body += `<path d="M${fx + fw * 0.2} ${top} Q${fx + fw * 0.3} ${top + h * 0.5} ${fx + fw * 0.18} ${top + h}" stroke="#ff7a6e" stroke-width="5" fill="none" opacity="0.7"/>`;
  }
  const edge = flip ? x : x + w;
  body += `<path d="M${edge} ${top} L${edge} ${top + h}" ${ink(6)}/>`;
  const tie = top + h * 0.5;
  body += `<path d="M${x} ${tie} Q${x + w / 2} ${tie + h * 0.06} ${x + w} ${tie - h * 0.02}" stroke="${P.sun}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${x} ${tie} Q${x + w / 2} ${tie + h * 0.06} ${x + w} ${tie - h * 0.02}" ${ink(3)} fill="none" opacity="0.6"/>`;
  return body;
}

function valance(w: number, h: number) {
  const scallop = 96;
  let edge = `M0 0 L${w} 0 L${w} ${h}`;
  for (let x = w; x > 0; x -= scallop) edge += ` Q${x - scallop / 2} ${h + 30} ${Math.max(0, x - scallop)} ${h}`;
  edge += " Z";
  let fringe = "";
  for (let x = scallop / 2; x < w; x += scallop) fringe += `<circle cx="${x}" cy="${h + 20}" r="7" fill="${P.sun}" ${ink(3)}/>`;
  let folds = "";
  for (let x = scallop / 2; x < w; x += scallop) folds += `<path d="M${x} 4 L${x} ${h + 6}" stroke="${P.tomatoDeep}" stroke-width="8" opacity="0.6"/>`;
  return `<path d="${edge}" fill="${P.tomato}"/>${folds}<path d="${edge}" fill="none" ${ink(6)}/><path d="M0 ${h - 18} L${w} ${h - 18}" stroke="${P.sun}" stroke-width="6" opacity="0.9"/>${fringe}`;
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
  for (let bx = x + 20; bx <= x + w - 20; bx += step) bulbs.push(bulb(bx, y + 14) + bulb(bx, y + h - 14));
  for (let by = y + 14 + step; by <= y + h - 14 - step / 2; by += step) bulbs.push(bulb(x + 14, by) + bulb(x + w - 14, by));
  const s = (h - 70) / 2;
  const gap = s * 0.7;
  const total = s * 3 + gap * 2;
  const dx = cx - total / 2;
  const dy = cy - s;
  const hang = `<path d="M${x + 40} ${y - 60} L${x + 40} ${y}" ${ink(4)}/><path d="M${x + w - 40} ${y - 60} L${x + w - 40} ${y}" ${ink(4)}/>`;
  return `${hang}<rect x="${x + 8}" y="${y + 10}" width="${w}" height="${h}" rx="22" fill="${P.ink}" opacity="0.35"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${P.plum700}" ${ink(6)}/><rect x="${x + 28}" y="${y + 28}" width="${w - 56}" height="${h - 56}" rx="12" fill="${P.plum950}" ${ink(4)}/>${bulbs.join("")}${digit("4", dx, dy, s)}${digit("0", dx + s + gap, dy, s)}${digit("4", dx + 2 * (s + gap), dy, s)}`;
}

function lamp(lx: number, y: number) {
  return `<path d="M${lx} ${y + 6} L${lx} ${y + 22}" ${ink(5)}/><path d="M${lx - 22} ${y + 22} L${lx + 22} ${y + 22} L${lx + 16} ${y + 62} L${lx - 16} ${y + 62} Z" fill="#3b3b4a" ${ink(4.5)}/><ellipse cx="${lx}" cy="${y + 62}" rx="16" ry="6" fill="${P.sunPale}" ${ink(3)}/>`;
}

function truss(w: number, y: number, lamps: number[]) {
  let body = `<rect x="0" y="${y - 10}" width="${w}" height="20" fill="${P.plum950}" ${ink(4)}/>`;
  for (let x = 0; x < w; x += 40) body += `<path d="M${x} ${y - 10} L${x + 20} ${y + 10} L${x + 40} ${y - 10}" stroke="${P.plum600}" stroke-width="3" fill="none"/>`;
  for (const lx of lamps) body += lamp(lx, y);
  return body;
}

function cornerLamp(x: number, y: number, flip: boolean) {
  const angle = flip ? 38 : -38;
  return `<path d="M${x} ${y - 90} L${x} ${y - 34}" ${ink(5)}/><g transform="rotate(${angle} ${x} ${y})"><path d="M${x - 26} ${y - 44} L${x + 26} ${y - 44} L${x + 20} ${y} L${x - 20} ${y} Z" fill="#3b3b4a" ${ink(4.5)}/><ellipse cx="${x}" cy="${y}" rx="20" ry="7" fill="${P.sunPale}" ${ink(3)}/></g>`;
}

function floor(w: number, top: number, bottom: number) {
  let body = `<rect x="0" y="${top}" width="${w}" height="${bottom - top}" fill="${P.wood}"/>`;
  for (let y = top + 24, row = 0; y < bottom - 18; y += 24, row += 1) {
    body += `<path d="M0 ${y} L${w} ${y}" stroke="${P.woodDeep}" stroke-width="3" opacity="0.7"/>`;
    for (let x = (row % 2) * 90; x < w; x += 180) body += `<path d="M${x} ${y - 24} L${x} ${y}" stroke="${P.woodDeep}" stroke-width="3" opacity="0.5"/>`;
  }
  body += `<rect x="0" y="${top}" width="${w}" height="10" fill="${P.woodDeep}"/><path d="M0 ${top} L${w} ${top}" ${ink(6)}/>`;
  body += `<rect x="0" y="${bottom - 18}" width="${w}" height="18" fill="${P.woodDark}"/><path d="M0 ${bottom - 18} L${w} ${bottom - 18}" ${ink(4)}/>`;
  for (let x = 40; x < w; x += 80) body += bulb(x, bottom - 9, 5);
  return body;
}

function sunburst(cx: number, cy: number, x0: number, x1: number, top: number, bottom: number) {
  const rays = 22;
  let body = "";
  const reach = Math.hypot(Math.max(cx - x0, x1 - cx), cy - top) + 40;
  for (let i = 0; i < rays; i += 1) {
    const a0 = Math.PI + (i / rays) * Math.PI;
    const a1 = Math.PI + ((i + 0.5) / rays) * Math.PI;
    body += `<path d="M${cx} ${cy} L${cx + Math.cos(a0) * reach} ${cy + Math.sin(a0) * reach} L${cx + Math.cos(a1) * reach} ${cy + Math.sin(a1) * reach} Z" fill="${P.plum700}"/>`;
  }
  return `<clipPath id="burst"><rect x="${x0}" y="${top}" width="${x1 - x0}" height="${bottom - top}"/></clipPath><g clip-path="url(#burst)"><rect x="${x0}" y="${top}" width="${x1 - x0}" height="${bottom - top}" fill="${P.plum800}"/>${body}<circle cx="${cx}" cy="${cy}" r="${(bottom - top) * 0.55}" fill="${P.plum600}" opacity="0.55"/></g>`;
}

function riser(L: StageLayout) {
  const { x0, x1, top, front, tall } = L.riser;
  const w = x1 - x0;
  const lip = 16;
  const shadow = `<rect x="${x0 + 10}" y="${top - lip + 10}" width="${w}" height="${front - top + lip}" rx="10" fill="${P.ink}" opacity="0.3"/>`;
  const surface = `<rect x="${x0}" y="${top - lip}" width="${w}" height="${lip + 4}" rx="6" fill="${P.plum500}" ${ink(5)}/>`;
  if (!tall) {
    let bulbs = "";
    for (let x = x0 + 28; x < x1 - 14; x += 46) bulbs += bulb(x, front - 16, 6);
    return `${shadow}<rect x="${x0}" y="${top}" width="${w}" height="${front - top}" fill="${P.plum700}" ${ink(5)}/><path d="M${x0 + 6} ${top + 18} L${x1 - 6} ${top + 18}" stroke="${P.sun}" stroke-width="7" stroke-linecap="round"/>${bulbs}${surface}`;
  }
  let bulbs = "";
  for (let x = x0 + 30; x < x1 - 14; x += 48) bulbs += bulb(x, top + 22, 6);
  const panel = sunburst(L.performer.x, front + 30, x0, x1, top, front);
  return `${shadow}${panel}<rect x="${x0}" y="${top}" width="${w}" height="${front - top}" fill="none" ${ink(5)}/><path d="M${x0 + 6} ${top + 44} L${x1 - 6} ${top + 44}" stroke="${P.sun}" stroke-width="7" stroke-linecap="round"/>${bulbs}${surface}`;
}

function podium(L: StageLayout) {
  const { x, y, podium: rx } = L.performer;
  const ry = rx * 0.16;
  const depth = 20;
  let bulbs = "";
  for (let i = -3; i <= 3; i += 1) {
    const bx = x + i * rx * 0.27;
    const by = y + depth * 0.55 + ry * Math.sqrt(Math.max(0, 1 - ((bx - x) / rx) ** 2));
    bulbs += bulb(bx, by, 5);
  }
  return `<ellipse cx="${x + 8}" cy="${y + depth + 6}" rx="${rx + 6}" ry="${ry + 6}" fill="${P.ink}" opacity="0.35"/><path d="M${x - rx} ${y} L${x - rx} ${y + depth} A${rx} ${ry} 0 0 0 ${x + rx} ${y + depth} L${x + rx} ${y} Z" fill="${P.tomato}" ${ink(5)}/>${bulbs}<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${P.cream3}" ${ink(5)}/><ellipse cx="${x}" cy="${y}" rx="${rx - 18}" ry="${ry - 5}" fill="none" stroke="${P.sun}" stroke-width="5"/>`;
}

function studio(L: StageLayout, curtainW: number) {
  const { W, H } = L;
  const floorTop = L.stage.top;
  const floorBottom = L.stage.front;
  const panelTop = L.valance + 40;
  const wallPanels = Array.from({ length: Math.ceil(W / 160) }, (_, i) => `<rect x="${i * 160 + 18}" y="${panelTop}" width="124" height="${floorTop - panelTop - 20}" rx="10" fill="${P.plum800}" opacity="0.7"/>`).join("");
  const signArt = L.sign ? sign(L.sign.cx, L.sign.cy, L.sign.w, L.sign.h) : "";
  const rig = L.truss ? truss(W, L.truss.y, L.truss.xs) : L.spots.map((s, i) => cornerLamp(s.x, s.y, i > 0)).join("");
  return svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="${P.plum900}"/>${wallPanels}${signArt}${riser(L)}${floor(W, floorTop, floorBottom)}<rect x="0" y="${floorBottom}" width="${W}" height="${H - floorBottom}" fill="${P.plum950}"/>${podium(L)}${curtain(0, 0, curtainW, floorTop, false)}${curtain(W - curtainW, 0, curtainW, floorTop, true)}${rig}${valance(W, L.valance)}`,
  );
}

const SIDE_VALANCE_W = 2640;

function juryDesk(o: Orientation) {
  const L = layoutFor(o);
  const { x0, x1, xs, deskTop, deskBottom } = L.jury;
  const w = x1 - x0;
  const h = deskBottom - deskTop + DESK_LIP;
  const top = DESK_LIP;
  const surface = 20;
  const frontTop = top + surface - 6;
  let props = "";
  const reach = Math.min(70, (xs[1] - xs[0]) * 0.34);
  xs.forEach((cx) => {
    const x = cx - x0;
    const side = 1;
    const bx = x + side * reach;
    props += `<path d="M${bx - 22} ${top + 6} Q${bx - 22} ${top - 22} ${bx} ${top - 22} Q${bx + 22} ${top - 22} ${bx + 22} ${top + 6} Z" fill="${P.tomato}" ${ink(4)}/><path d="M${bx - 12} ${top - 12} Q${bx - 4} ${top - 18} ${bx + 4} ${top - 16}" stroke="#ff9b8f" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="${bx - 30}" y="${top + 2}" width="60" height="10" rx="4" fill="${P.ink}"/>`;
    const mx = x - side * reach;
    props += `<path d="M${mx} ${top + 6} L${mx} ${top - 6} L${mx + side * 22} ${top - 26}" fill="none" ${ink(5)}/><rect x="${mx + side * 22 - 9}" y="${top - 44}" width="18" height="26" rx="9" transform="rotate(${side * 40} ${mx + side * 22} ${top - 31})" fill="#3b3b4a" ${ink(4)}/><ellipse cx="${mx}" cy="${top + 6}" rx="14" ry="5" fill="${P.ink}"/>`;
  });
  let bulbs = "";
  for (let x = 26; x < w - 14; x += 40) bulbs += bulb(x, h - 16, 6);
  const plates = xs.map((cx) => `<rect x="${cx - x0 - 80}" y="${frontTop + 26}" width="160" height="46" rx="12" fill="${P.cream}" ${ink(4)}/>`).join("");
  return svg(
    w,
    h,
    `<rect x="10" y="${frontTop + 10}" width="${w - 6}" height="${h - frontTop - 10}" rx="14" fill="${P.ink}" opacity="0.35"/><rect x="3" y="${frontTop}" width="${w - 6}" height="${h - frontTop - 3}" rx="14" fill="${P.plum600}" ${ink(5)}/><path d="M18 ${frontTop + 14} L${w - 18} ${frontTop + 14}" stroke="${P.sun}" stroke-width="6" stroke-linecap="round"/>${xs
      .slice(1)
      .map((cx, i) => {
        const mid = (cx + xs[i]) / 2 - x0;
        return `<path d="M${mid} ${frontTop + 26} L${mid} ${h - 30}" stroke="${P.plum700}" stroke-width="6" stroke-linecap="round"/>`;
      })
      .join("")}${plates}${bulbs}<rect x="0" y="${top}" width="${w}" height="${surface}" rx="8" fill="${P.cream3}" ${ink(5)}/>${props}`,
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
    "studio-landscape": { svg: studio(layoutFor("landscape"), 120), res: 1 },
    "studio-portrait": { svg: studio(layoutFor("portrait"), 70), res: 1 },
    "studio-phone": { svg: studio(phoneStage(), 70), res: 1 },
    "valance-wide": { svg: svg(SIDE_VALANCE_W, 96, valance(SIDE_VALANCE_W, 52)), res: 1 },
    "curtain-side": { svg: svg(240, 800, curtain(0, 0, 240, 800, false)), res: 1 },
    "jury-desk-landscape": { svg: juryDesk("landscape") },
    "jury-desk-portrait": { svg: juryDesk("portrait") },
    plate: { svg: plate() },
    "crowd-0": { svg: crowd(0) },
    "crowd-1": { svg: crowd(1) },
    "crowd-2": { svg: crowd(2) },
    "crowd-3": { svg: crowd(3) },
  };
}
