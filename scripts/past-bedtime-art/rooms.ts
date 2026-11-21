import { propArtName } from "../../src/games/past-bedtime/scenes/art";
import type { LevelDef, PropDef } from "../../src/games/past-bedtime/sim/types";
import { hydraulicBody } from "./grandma";
import { ink, P, rnd, svg, type Sheet } from "./kit";

const INK = P.ink;

export type Material = "wood" | "checker" | "parquet" | "hydraulic";

export type WallTheme = "hall" | "kitchen" | "living";

export function materialFor(levelId: string): Material {
  if (levelId === "kitchen" || levelId === "pantry") return "hydraulic";
  if (levelId === "laundry") return "checker";
  if (levelId === "living" || levelId === "dining" || levelId === "sofa") return "parquet";
  return "wood";
}

export function wallThemeFor(levelId: string): WallTheme {
  const m = materialFor(levelId);
  return m === "checker" || m === "hydraulic" ? "kitchen" : m === "parquet" ? "living" : "hall";
}

const WOOD = { line: "#74472f", hi: "#c8916a", knot: "#8a5a3c" };

function floorShell(level: LevelDef, body: string) {
  const w = level.map[0].length;
  const h = level.map.length;
  const floorTile = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && level.map[y][x] !== "#";
  let clip = "";
  let shade = "";
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!floorTile(x, y)) continue;
      clip += `<rect x="${x * 100 - 0.5}" y="${y * 100 - 0.5}" width="101" height="101"/>`;
      if (!floorTile(x, y - 1)) shade += `<rect x="${x * 100}" y="${y * 100}" width="100" height="26" fill="url(#ao-top)"/>`;
      if (!floorTile(x - 1, y)) shade += `<rect x="${x * 100}" y="${y * 100}" width="16" height="100" fill="url(#ao-left)"/>`;
      if (!floorTile(x + 1, y)) shade += `<rect x="${x * 100 + 84}" y="${y * 100}" width="16" height="100" fill="url(#ao-right)"/>`;
    }
  }
  return svg(`0 0 ${w * 100} ${h * 100}`, `<defs>
    <clipPath id="floor">${clip}</clipPath>
    <linearGradient id="ao-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="ao-left" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="ao-right" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  </defs><g clip-path="url(#floor)">${body}${shade}</g>`);
}

function checkerBody(w: number, h: number) {
  const A = "#eae1cb";
  const B = "#6c6684";
  let out = `<rect width="${w * 100}" height="${h * 100}" fill="${B}"/>`;
  for (let y = 0; y < h * 2; y += 1) {
    for (let x = 0; x < w * 2; x += 1) {
      if ((x + y) % 2) continue;
      const px = x * 50;
      const py = y * 50;
      out += `<rect x="${px}" y="${py}" width="50" height="50" fill="${A}"/>`;
      out += `<path d="M${px + 6} ${py + 8} L${px + 22} ${py + 8}" stroke="#fffaf0" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
      if (rnd(x * 7 + y * 13) > 0.72) out += `<path d="M${px + 14 + rnd(x + y) * 20} ${py + 30} q8 -3 16 1" stroke="#c9bfae" stroke-width="1.6" fill="none" opacity="0.8"/>`;
    }
  }
  for (let y = 0; y <= h * 2; y += 1) out += `<path d="M0 ${y * 50} L${w * 100} ${y * 50}" stroke="#4b4560" stroke-width="2.2"/>`;
  for (let x = 0; x <= w * 2; x += 1) out += `<path d="M${x * 50} 0 L${x * 50} ${h * 100}" stroke="#4b4560" stroke-width="2.2"/>`;
  return out;
}

function parquetBody(w: number, h: number) {
  const tints = ["#a86e4b", "#9b6444", "#b07752", "#a26a48"];
  let out = `<rect width="${w * 100}" height="${h * 100}" fill="#a86e4b"/>`;
  for (let y = 0; y < h * 2; y += 1) {
    for (let x = 0; x < w * 2; x += 1) {
      const px = x * 50;
      const py = y * 50;
      const flip = (x + y) % 2 === 0;
      for (let k = 0; k < 3; k += 1) {
        const tint = tints[Math.floor(rnd(x * 11 + y * 7 + k) * tints.length)];
        if (flip) out += `<rect x="${px}" y="${py + k * 16.67}" width="50" height="16.67" fill="${tint}" stroke="#6a3f2a" stroke-width="1.6"/><path d="M${px + 6} ${py + k * 16.67 + 6} Q${px + 25} ${py + k * 16.67 + 4} ${px + 44} ${py + k * 16.67 + 7}" stroke="#c48a63" stroke-width="1.3" fill="none" opacity="0.7"/>`;
        else out += `<rect x="${px + k * 16.67}" y="${py}" width="16.67" height="50" fill="${tint}" stroke="#6a3f2a" stroke-width="1.6"/><path d="M${px + k * 16.67 + 6} ${py + 6} Q${px + k * 16.67 + 4} ${py + 25} ${px + k * 16.67 + 7} ${py + 44}" stroke="#c48a63" stroke-width="1.3" fill="none" opacity="0.7"/>`;
      }
    }
  }
  return out;
}

function woodBody(w: number, h: number) {
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
      if (rnd(r * 23 + k * 13) > 0.82) planks += `<ellipse cx="${x + len * (0.3 + rnd(r + k * 3) * 0.4)}" cy="${y + 13}" rx="3.5" ry="2" fill="${WOOD.knot}" opacity="0.8"/>`;
      x += len;
      k += 1;
    }
    planks += `<path d="M0 ${y + 0.8} L${w * 100} ${y + 0.8}" stroke="${WOOD.line}" stroke-width="1.8"/>`;
  }
  return planks;
}

export function roomFloor(level: LevelDef) {
  const w = level.map[0].length;
  const h = level.map.length;
  const m = materialFor(level.id);
  return floorShell(level, m === "hydraulic" ? hydraulicBody(w, h) : m === "checker" ? checkerBody(w, h) : m === "parquet" ? parquetBody(w, h) : woodBody(w, h));
}

const WALLS: Record<Exclude<WallTheme, "hall">, { paper: string; alt: string; motif: string; crown: string; crownShade: string; base: string; baseHi: string }> = {
  kitchen: { paper: "#dce8ec", alt: "#cbdbe1", motif: "#5f9fc0", crown: "#f6f1e4", crownShade: "#c9c3b4", base: "#5f9fc0", baseHi: "#7fb6d2" },
  living: { paper: "#b27a90", alt: "#a86f86", motif: "#e3b6c6", crown: "#f0dfc8", crownShade: "#cbb8a0", base: "#5a3324", baseHi: "#7a4a32" },
};

export function roomWall(theme: Exclude<WallTheme, "hall">, kind: string) {
  const c = WALLS[theme];
  let body = `<rect width="100" height="100" fill="${c.paper}"/>`;
  if (theme === "kitchen") {
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        const px = x * 25;
        const py = y * 25;
        body += `<rect x="${px + 1}" y="${py + 1}" width="23" height="23" fill="${(x + y) % 2 ? c.alt : c.paper}"/>`;
        if ((x + y) % 2 === 0) body += `<path d="M${px + 12.5} ${py + 5} Q${px + 16} ${py + 9} ${px + 20} ${py + 12.5} Q${px + 16} ${py + 16} ${px + 12.5} ${py + 20} Q${px + 9} ${py + 16} ${px + 5} ${py + 12.5} Q${px + 9} ${py + 9} ${px + 12.5} ${py + 5} Z" fill="none" stroke="${c.motif}" stroke-width="1.8"/><circle cx="${px + 12.5}" cy="${py + 12.5}" r="2" fill="${c.motif}"/>`;
      }
    }
    for (let i = 0; i <= 4; i += 1) body += `<path d="M0 ${i * 25} L100 ${i * 25} M${i * 25} 0 L${i * 25} 100" stroke="#aebfc7" stroke-width="1.6"/>`;
  } else {
    for (let i = 0; i < 4; i += 1) body += `<rect x="${i * 25 + 4}" y="0" width="5" height="100" fill="${c.alt}"/>`;
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        const cx = i * 25 + 16.5;
        const cy = j * 34 + 17 + (i % 2) * 17;
        body += `<path d="M${cx} ${cy - 7} Q${cx + 5} ${cy - 3} ${cx} ${cy} Q${cx - 5} ${cy - 3} ${cx} ${cy - 7} Z M${cx} ${cy} Q${cx + 6} ${cy + 3} ${cx} ${cy + 8} Q${cx - 6} ${cy + 3} ${cx} ${cy} Z" fill="${c.motif}" opacity="0.55"/><circle cx="${cx - 5}" cy="${cy}" r="1.4" fill="${c.motif}" opacity="0.7"/><circle cx="${cx + 5}" cy="${cy}" r="1.4" fill="${c.motif}" opacity="0.7"/>`;
      }
    }
  }
  if (kind === "top" || kind === "single") {
    body += `<rect x="0" y="0" width="100" height="10" fill="#2a2140"/><rect x="0" y="10" width="100" height="8" fill="${c.crown}"/><rect x="0" y="15" width="100" height="3" fill="${c.crownShade}"/><path d="M0 18 L100 18" stroke="${INK}" stroke-width="2"/><path d="M0 10 L100 10" stroke="${INK}" stroke-width="1.5"/>`;
  }
  if (kind === "bottom" || kind === "single") {
    body += `<rect x="0" y="84" width="100" height="16" fill="${c.base}"/><rect x="0" y="84" width="100" height="3" fill="${c.baseHi}"/><path d="M0 84 L100 84" stroke="${INK}" stroke-width="2.4"/><rect x="0" y="96" width="100" height="4" fill="#2a2140" opacity="0.6"/>`;
  }
  return svg("0 0 100 100", body);
}

const shadow = (x: number, y: number, w: number, h: number, r = 10) => `<rect x="${x + 4}" y="${y + 7}" width="${w}" height="${h}" rx="${r}" fill="#000" opacity="0.32"/>`;

function block(x: number, y: number, w: number, h: number, top: string, front: string, frontH: number, r = 6) {
  return `${shadow(x, y, w, h, r)}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${front}" ${ink(3)}/><rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="${h - frontH - 1.5}" rx="${Math.max(2, r - 1)}" fill="${top}"/><path d="M${x + 2} ${y + h - frontH} L${x + w - 2} ${y + h - frontH}" ${ink(2.4)}/><path d="M${x + 6} ${y + 5} L${x + Math.min(w * 0.4, 60)} ${y + 5}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.5"/>`;
}

const knob = (x: number, y: number, c = "#e8d9a0") => `<circle cx="${x}" cy="${y}" r="2.6" fill="${c}" ${ink(1.4)}/>`;

const door = (x: number, y: number, w: number, h: number, c: string, kx: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c}" ${ink(2)}/><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="2" fill="none" stroke="#6d4a3a" stroke-width="1.6" opacity="0.7"/>${knob(kx, y + h / 2)}`;

function table(w: number, h: number) {
  const W = w * 100;
  const H = h * 100;
  const cx0 = 18;
  const cy0 = 14;
  const cw = W - 36;
  const ch = H - 42;
  let cloth = `<rect x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" fill="#f4efe4"/>`;
  for (let i = 0; i < 12; i += 2) cloth += `<rect x="${cx0 + (i * cw) / 12}" y="${cy0}" width="${cw / 12}" height="${ch}" fill="#d9534f" opacity="0.42"/>`;
  for (let j = 0; j < 6; j += 2) cloth += `<rect x="${cx0}" y="${cy0 + (j * ch) / 6}" width="${cw}" height="${ch / 6}" fill="#d9534f" opacity="0.3"/>`;
  let scallop = "";
  for (let x = cx0; x < cx0 + cw - 4; x += 16) scallop += `<path d="M${x} ${cy0 + ch} q8 9 16 0" fill="#f4efe4" ${ink(2)}/>`;
  const runnerY = cy0 + ch * 0.32;
  const runnerH = ch * 0.36;
  let lace = "";
  for (let x = cx0 + 10; x < cx0 + cw - 10; x += 12) lace += `<circle cx="${x}" cy="${runnerY}" r="3.4" fill="#fffaf0" ${ink(1)}/><circle cx="${x + 6}" cy="${runnerY + runnerH}" r="3.4" fill="#fffaf0" ${ink(1)}/>`;
  const runner = `<rect x="${cx0 + 6}" y="${runnerY}" width="${cw - 12}" height="${runnerH}" fill="#fffaf0" ${ink(1.8)}/>${lace}${Array.from({ length: Math.floor((cw - 30) / 26) }, (_, i) => `<circle cx="${cx0 + 22 + i * 26}" cy="${runnerY + runnerH / 2}" r="6" fill="none" stroke="#e6d7b8" stroke-width="2"/>`).join("")}`;
  const cup = (x: number, y: number) => `<ellipse cx="${x}" cy="${y + 3}" rx="13" ry="9" fill="#000" opacity="0.18"/><ellipse cx="${x}" cy="${y}" rx="13" ry="9" fill="#fbf5e6" ${ink(2)}/><circle cx="${x}" cy="${y - 2}" r="7" fill="#fbf5e6" ${ink(2)}/><circle cx="${x}" cy="${y - 2}" r="5" fill="#b5713a"/><path d="M${x + 7} ${y - 3} q5 0 4 5" fill="none" ${ink(1.8)}/><circle cx="${x - 9}" cy="${y + 2}" r="1.6" fill="#e58fa6"/>`;
  const tx = cx0 + cw * 0.36;
  const ty = cy0 + ch * 0.5;
  const teapot = `<ellipse cx="${tx}" cy="${ty + 12}" rx="22" ry="7" fill="#000" opacity="0.2"/><path d="M${tx - 18} ${ty + 6} Q${tx - 22} ${ty - 16} ${tx} ${ty - 18} Q${tx + 22} ${ty - 16} ${tx + 18} ${ty + 6} Q${tx} ${ty + 14} ${tx - 18} ${ty + 6} Z" fill="#fbf5e6" ${ink(2.4)}/>
    <path d="M${tx + 16} ${ty - 4} Q${tx + 30} ${ty - 8} ${tx + 32} ${ty - 18}" fill="none" ${ink(4)}/><path d="M${tx + 16} ${ty - 4} Q${tx + 30} ${ty - 8} ${tx + 32} ${ty - 18}" fill="none" stroke="#fbf5e6" stroke-width="2"/>
    <path d="M${tx - 16} ${ty - 8} Q${tx - 28} ${ty - 6} ${tx - 18} ${ty + 4}" fill="none" ${ink(2.4)}/>
    <ellipse cx="${tx}" cy="${ty - 17}" rx="10" ry="4" fill="#fbf5e6" ${ink(2)}/><circle cx="${tx}" cy="${ty - 22}" r="3.4" fill="#e58fa6" ${ink(1.4)}/>
    ${[[-8, -4], [0, -8], [8, -3], [-2, 2]].map(([dx, dy]) => `<circle cx="${tx + dx}" cy="${ty + dy}" r="3" fill="#e58fa6"/><circle cx="${tx + dx}" cy="${ty + dy}" r="1.2" fill="#ffc83d"/>`).join("")}
    <path d="M${tx + 30} ${ty - 24} q-4 -6 0 -12 M${tx + 36} ${ty - 22} q-4 -6 0 -12" fill="none" stroke="#fff" stroke-width="2" opacity="0.65" stroke-linecap="round"/>`;
  const dx = cx0 + cw * 0.72;
  const dy = cy0 + ch * 0.48;
  const cake = `<ellipse cx="${dx}" cy="${dy + 12}" rx="20" ry="6" fill="#000" opacity="0.2"/><ellipse cx="${dx}" cy="${dy + 8}" rx="20" ry="6" fill="#d9dce4" ${ink(2)}/><path d="M${dx - 14} ${dy + 6} L${dx - 14} ${dy - 6} Q${dx} ${dy - 12} ${dx + 14} ${dy - 6} L${dx + 14} ${dy + 6} Z" fill="#c87a3a" ${ink(2)}/><path d="M${dx - 14} ${dy - 6} Q${dx} ${dy - 12} ${dx + 14} ${dy - 6} Q${dx + 10} ${dy - 1} ${dx + 6} ${dy - 4} Q${dx} ${dy} ${dx - 6} ${dy - 4} Q${dx - 10} ${dy - 1} ${dx - 14} ${dy - 6} Z" fill="#fbf5e6"/>
    <path d="M${dx - 18} ${dy + 6} Q${dx - 20} ${dy - 26} ${dx} ${dy - 28} Q${dx + 20} ${dy - 26} ${dx + 18} ${dy + 6}" fill="#cfeaf5" fill-opacity="0.28" ${ink(2)}/><circle cx="${dx}" cy="${dy - 30}" r="3" fill="#d9dce4" ${ink(1.4)}/><path d="M${dx - 12} ${dy - 18} Q${dx - 8} ${dy - 24} ${dx - 2} ${dy - 24}" fill="none" stroke="#fff" stroke-width="2" opacity="0.8"/>`;
  const vx = cx0 + cw * 0.9;
  const vy = cy0 + ch * 0.2;
  const vase = `<path d="M${vx - 5} ${vy + 8} Q${vx - 8} ${vy} ${vx - 3} ${vy - 6} L${vx + 3} ${vy - 6} Q${vx + 8} ${vy} ${vx + 5} ${vy + 8} Z" fill="#5f9fc0" ${ink(1.8)}/>${[[-6, -16, "#e58fa6"], [0, -20, "#ffc83d"], [6, -15, "#fbf5e6"]].map(([fx, fy, c]) => `<path d="M${vx} ${vy - 6} L${vx + (fx as number)} ${vy + (fy as number) + 4}" stroke="#4c9a43" stroke-width="1.6"/><circle cx="${vx + (fx as number)}" cy="${vy + (fy as number)}" r="4" fill="${c}" ${ink(1.2)}/>`).join("")}`;
  return svg(`-6 -24 ${W + 14} ${H + 34}`, `
    ${block(6, 6, W - 12, H - 12, "#9a6440", "#6d4a3a", 12, 12)}
    ${cloth}<rect x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" fill="none" ${ink(2.5)}/>${scallop}
    ${runner}
    ${cup(cx0 + cw * 0.12, cy0 + ch * 0.25)}${cup(cx0 + cw * 0.55, cy0 + ch * 0.8)}
    ${teapot}${cake}${vase}`);
}

function fridge() {
  return svg("2 -62 98 156", `
    ${block(8, -55, 84, 145, "#eef1f7", "#c9cfdc", 95, 10)}
    <rect x="12" y="-50" width="76" height="140" rx="7" fill="#f6f8fc" ${ink(2.5)}/>
    <path d="M12 -10 L88 -10" ${ink(2.6)}/>
    <rect x="74" y="-44" width="7" height="26" rx="3" fill="#9aa6b8" ${ink(1.8)}/><rect x="74" y="-2" width="7" height="34" rx="3" fill="#9aa6b8" ${ink(1.8)}/>
    <rect x="26" y="-42" width="26" height="22" fill="#fbf5e6" ${ink(1.8)} transform="rotate(-4 39 -31)"/><path d="M30 -36 L46 -37 M30 -30 L44 -31" stroke="#9cc7ea" stroke-width="1.6"/>
    <circle cx="24" cy="6" r="5" fill="#ef4f43" ${ink(1.5)}/><circle cx="46" cy="4" r="5" fill="#ffc83d" ${ink(1.5)}/><circle cx="24" cy="24" r="5" fill="#63d6c1" ${ink(1.5)}/><circle cx="46" cy="22" r="5" fill="#5cb9f0" ${ink(1.5)}/>
    <rect x="18" y="34" width="34" height="26" fill="#fbf5e6" ${ink(1.8)} transform="rotate(3 35 47)"/><path d="M24 42 l4 6 l6 -8 M36 40 q4 4 8 0" fill="none" stroke="#ef4f43" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 -46 L16 -16" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`);
}

function stove() {
  let burners = "";
  for (let i = 0; i < 4; i += 1) {
    const bx = 28 + (i % 2) * 44;
    const by = Math.floor(i / 2) * 24;
    burners += `<circle cx="${bx}" cy="${by}" r="10" fill="#2b2150" ${ink(2)}/><circle cx="${bx}" cy="${by}" r="6" fill="none" stroke="#9aa6b8" stroke-width="2"/><path d="M${bx - 10} ${by} L${bx + 10} ${by} M${bx} ${by - 10} L${bx} ${by + 10}" stroke="#4a4268" stroke-width="2"/>`;
  }
  let knobs = "";
  for (let i = 0; i < 4; i += 1) knobs += `<circle cx="${20 + i * 20}" cy="58" r="4.5" fill="#3a3157" ${ink(1.6)}/><path d="M${20 + i * 20} 55 L${20 + i * 20} 58" stroke="#fbf5e6" stroke-width="1.6"/>`;
  return svg("0 -22 100 118", `
    ${block(4, -12, 92, 100, "#e6e0d4", "#bdb6a8", 42, 6)}
    ${burners}${knobs}
    <rect x="18" y="66" width="64" height="18" rx="3" fill="#3a3157" ${ink(2)}/><rect x="24" y="70" width="52" height="10" rx="2" fill="#ff9d5a" opacity="0.45"/>
    <path d="M50 -10 Q50 -20 66 -20 Q82 -20 82 -10 L82 4 Q66 10 50 4 Z" fill="#d94f5c" ${ink(2.5)}/><path d="M82 -4 L92 -12" ${ink(3)}/><rect x="61" y="-26" width="10" height="6" rx="2" fill="#2b2150" ${ink(1.5)}/>
    <path d="M56 -14 Q60 -18 64 -14" fill="none" stroke="#fff" stroke-width="2" opacity="0.6"/>`);
}

function sink() {
  return svg("0 -28 100 124", `
    ${block(2, -12, 96, 100, "#d6d0c4", "#9a6a48", 42, 6)}
    <rect x="18" y="-4" width="64" height="38" rx="8" fill="#aab4c4" ${ink(2.5)}/><rect x="22" y="0" width="56" height="30" rx="6" fill="#c3cbd8"/>
    <circle cx="50" cy="18" r="4" fill="#6f7b8f"/><path d="M38 8 Q46 4 54 8" fill="none" stroke="#fff" stroke-width="2" opacity="0.7"/>
    <path d="M50 -20 L50 -4" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M50 -20 L50 -4" stroke="#9aa6b8" stroke-width="4" stroke-linecap="round"/><path d="M40 -22 L60 -22" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M40 -22 L60 -22" stroke="#9aa6b8" stroke-width="3.5" stroke-linecap="round"/>
    ${door(12, 50, 34, 34, "#a8774f", 41)}${door(54, 50, 34, 34, "#a8774f", 59)}
    <ellipse cx="86" cy="-2" rx="7" ry="10" fill="#fbf5e6" ${ink(2)}/>`);
}

function counter(w: number) {
  const W = w * 100;
  let doors = "";
  for (let i = 0; i < w; i += 1) doors += door(i * 100 + 12, 50, 34, 34, "#a8774f", i * 100 + 41) + door(i * 100 + 54, 50, 34, 34, "#a8774f", i * 100 + 59);
  return svg(`0 -18 ${W} 114`, `${block(2, -12, W - 4, 100, "#d6d0c4", "#9a6a48", 42, 6)}${doors}<rect x="${W - 70}" y="-4" width="46" height="28" rx="5" fill="#c08a5e" ${ink(2)}/><path d="M${W - 64} 4 L${W - 30} 4" stroke="#a46f4d" stroke-width="2"/>`);
}

function counterLow(w: number) {
  const W = w * 100;
  let doors = "";
  for (let i = 0; i < w; i += 1) doors += `<path d="M${i * 100 + 50} 74 L${i * 100 + 50} 92" stroke="#7a4a32" stroke-width="2"/>${knob(i * 100 + 44, 82)}${knob(i * 100 + 56, 82)}`;
  return svg(`0 0 ${W} 100`, `${block(2, 6, W - 4, 88, "#d6d0c4", "#9a6a48", 20, 6)}${doors}`);
}

function pantryShelf() {
  const jars = ["#ffc83d", "#ef4f43", "#f6f1e4", "#93cf4c", "#c0703f", "#5cb9f0"];
  let rows = "";
  for (let r = 0; r < 2; r += 1) {
    rows += `<rect x="8" y="${-2 + r * 38}" width="84" height="5" fill="#6a3f2a"/>`;
    for (let i = 0; i < 3; i += 1) {
      const jx = 14 + i * 26;
      const jy = -30 + r * 38;
      rows += `<rect x="${jx}" y="${jy}" width="20" height="26" rx="4" fill="#e9f2f6" ${ink(2)}/><rect x="${jx + 3}" y="${jy + 10}" width="14" height="14" rx="2" fill="${jars[(i + r * 3) % jars.length]}"/><rect x="${jx + 2}" y="${jy - 4}" width="16" height="6" rx="2" fill="#c08a5e" ${ink(1.5)}/><rect x="${jx + 4}" y="${jy + 13}" width="12" height="6" fill="#fbf5e6" opacity="0.85"/>`;
    }
  }
  return svg("0 -48 100 144", `${block(4, -40, 92, 130, "#b88a5e", "#8a5a3c", 90, 5)}${rows}<rect x="12" y="52" width="30" height="30" rx="3" fill="#d9a066" ${ink(2)}/><path d="M12 60 L42 60" stroke="#b07a44" stroke-width="2"/><rect x="52" y="56" width="34" height="26" rx="4" fill="#fbf5e6" ${ink(2)}/><path d="M56 62 L82 62" stroke="#ef4f43" stroke-width="2.5"/>`);
}

function washer(h: number) {
  const H = h * 100;
  return svg(`0 -4 200 ${H + 12}`, `
    ${block(6, 4, 88, H - 10, "#eef1f7", "#c9cfdc", 50, 8)}
    <circle cx="50" cy="62" r="27" fill="#6f86c9" ${ink(3)}/><circle cx="50" cy="62" r="21" fill="#8fa6e0" stroke="#9aa6b8" stroke-width="4"/><path d="M38 52 Q46 46 56 50" fill="none" stroke="#fff" stroke-width="3" opacity="0.7"/>
    <rect x="16" y="14" width="36" height="12" rx="3" fill="#c9cfdc" ${ink(1.8)}/><circle cx="66" cy="20" r="6" fill="#ffc83d" ${ink(1.8)}/><circle cx="82" cy="20" r="4" fill="#ef4f43" ${ink(1.5)}/>
    ${block(106, 4, 88, H - 10, "#dce8ec", "#b3c7cf", 50, 8)}
    <rect x="118" y="12" width="64" height="90" rx="12" fill="#9fb6c4" ${ink(2.5)}/><rect x="124" y="18" width="52" height="78" rx="9" fill="#b9cdd8"/>
    <path d="M124 30 L176 30 M124 46 L176 46 M124 62 L176 62 M124 78 L176 78" stroke="#6f7b8f" stroke-width="2.4"/>
    <path d="M150 0 L150 12" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M150 0 L150 12" stroke="#9aa6b8" stroke-width="3.5" stroke-linecap="round"/>
    <rect x="130" y="120" width="40" height="26" rx="5" fill="#5cb9f0" ${ink(2.5)}/><rect x="134" y="114" width="32" height="8" rx="3" fill="#fbf5e6" ${ink(1.8)}/>
    <path d="M24 124 L56 124 L52 158 L28 158 Z" fill="#d9a066" ${ink(2.5)}/><path d="M28 132 L52 132 M29 142 L51 142" stroke="#b07a44" stroke-width="2"/><path d="M26 124 Q34 112 42 120 Q50 110 56 124 Z" fill="#f06ba8" ${ink(2)}/>`);
}

function glassCabinet() {
  let dishes = "";
  for (let i = 0; i < 3; i += 1) dishes += `<circle cx="${28 + i * 22}" cy="2" r="7" fill="#f6f1e4" ${ink(1.6)}/><circle cx="${28 + i * 22}" cy="2" r="4" fill="none" stroke="#5f9fc0" stroke-width="1.4"/><ellipse cx="${28 + i * 22}" cy="24" rx="7" ry="5" fill="#f6f1e4" ${ink(1.6)}/>`;
  return svg("0 -58 100 154", `${block(6, -50, 88, 138, "#8a5a3c", "#6a3f2a", 100, 6)}
    <rect x="14" y="-12" width="72" height="50" rx="4" fill="#a9dcf7" ${ink(2.5)}/><rect x="14" y="-12" width="72" height="50" rx="4" fill="#fff" opacity="0.18"/>
    <path d="M14 13 L86 13" stroke="#6a3f2a" stroke-width="3"/>${dishes}
    <path d="M20 -6 L34 -6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/><path d="M50 -12 L50 38" ${ink(2)}/>
    ${door(16, 48, 32, 34, "#9a6440", 44)}${door(52, 48, 32, 34, "#9a6440", 56)}`);
}

function chair() {
  return svg("10 0 84 96", `${block(20, 18, 60, 68, "#b07a4f", "#8a5a3c", 16, 6)}<rect x="20" y="6" width="60" height="20" rx="4" fill="#9a6440" ${ink(2.5)}/><path d="M30 10 L30 22 M50 10 L50 22 M70 10 L70 22" stroke="#7a4a32" stroke-width="2"/><rect x="28" y="34" width="44" height="28" rx="7" fill="#ef4f43" ${ink(2)}/><path d="M34 42 L66 42" stroke="#ff9d8a" stroke-width="2" stroke-linecap="round"/>`);
}

function sideboard(w: number) {
  const W = w * 100;
  let doors = "";
  for (let i = 0; i < w; i += 1) doors += door(i * 100 + 16, 62, 68, 26, "#8a5a3c", i * 100 + 50);
  return svg(`0 -4 ${W} 100`, `${block(4, 12, W - 8, 82, "#9a6440", "#6d4a3a", 40, 6)}${doors}
    <ellipse cx="${W * 0.25}" cy="30" rx="18" ry="8" fill="#f6f1e4" ${ink(2)}/><path d="M${W * 0.25 - 12} 28 q12 -6 24 0" fill="none" stroke="#e0b97a" stroke-width="1.6"/>
    <rect x="${W * 0.72}" y="16" width="16" height="26" rx="6" fill="#63d6c1" ${ink(2.5)}/><circle cx="${W * 0.72 + 4}" cy="12" r="6" fill="#f06ba8" ${ink(1.6)}/><circle cx="${W * 0.72 + 12}" cy="10" r="5" fill="#ffc83d" ${ink(1.6)}/>
    <rect x="${W * 0.48}" y="22" width="26" height="18" rx="2" fill="#c9a24a" ${ink(2)}/><rect x="${W * 0.48 + 4}" y="26" width="18" height="10" fill="#a9dcf7"/>`);
}

function sofa(w: number, h: number) {
  const W = w * 100;
  const H = h * 100;
  let cushions = "";
  for (let i = 0; i < w; i += 1) cushions += `<rect x="${i * 100 + 16}" y="30" width="68" height="36" rx="10" fill="#c4687c" ${ink(2.6)}/><path d="M${i * 100 + 24} 40 Q${i * 100 + 50} 34 ${i * 100 + 76} 40" fill="none" stroke="#d98a9c" stroke-width="2.4" stroke-linecap="round"/>`;
  const pillows = [0, w - 1].map((i, k) => `<g transform="rotate(${k ? 8 : -8} ${i * 100 + (k ? 70 : 30)} 31)"><rect x="${i * 100 + (k ? 57 : 17)}" y="20" width="26" height="22" rx="6" fill="${k ? "#63d6c1" : "#ffc83d"}" ${ink(2.5)}/><circle cx="${i * 100 + (k ? 70 : 30)}" cy="31" r="4.5" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.7"/></g>`).join("");
  return svg(`-2 -4 ${W + 10} ${H + 12}`, `${block(4, 2, W - 8, H - 8, "#b0566a", "#8a3e52", 18, 14)}<rect x="4" y="2" width="${W - 8}" height="26" rx="12" fill="#c4687c" ${ink(3)}/>${cushions}<rect x="0" y="16" width="16" height="${H - 24}" rx="7" fill="#c4687c" ${ink(2.8)}/><rect x="${W - 16}" y="16" width="16" height="${H - 24}" rx="7" fill="#c4687c" ${ink(2.8)}/>${pillows}`);
}

function armchair() {
  let lace = "";
  for (let a = 0; a < 8; a += 1) lace += `<circle cx="${50 + Math.cos(a) * 8}" cy="${12 + Math.sin(a) * 5}" r="2.5" fill="none" stroke="#c9bfae" stroke-width="1.4"/>`;
  return svg("-2 -4 106 104", `${block(8, 6, 84, 86, "#5d7cb0", "#45619a", 16, 14)}<rect x="8" y="2" width="84" height="26" rx="12" fill="#6f8fc4" ${ink(3)}/><rect x="2" y="26" width="18" height="56" rx="7" fill="#6f8fc4" ${ink(2.8)}/><rect x="80" y="26" width="18" height="56" rx="7" fill="#6f8fc4" ${ink(2.8)}/><rect x="22" y="34" width="56" height="36" rx="10" fill="#7d9bd0" ${ink(2.4)}/><ellipse cx="50" cy="12" rx="14" ry="9" fill="#f6f1e4" opacity="0.95"/>${lace}`);
}

function tv() {
  let lines = "";
  for (let i = 0; i < 6; i += 1) lines += `<path d="M18 ${8 + i * 8} L66 ${8 + i * 8}" stroke="#fff" stroke-width="1.4" opacity="${0.15 + rnd(i) * 0.25}"/>`;
  return svg("0 -50 100 146", `
    <rect x="12" y="52" width="76" height="40" rx="6" fill="#6a3f2a" ${ink(3)}/><path d="M18 62 L82 62" stroke="#8a5a3c" stroke-width="3"/>
    <path d="M50 -6 L30 -42 M50 -6 L72 -44" ${ink(4)}/><path d="M50 -6 L30 -42 M50 -6 L72 -44" stroke="#9aa6b8" stroke-width="2"/>
    <circle cx="72" cy="-44" r="7" fill="#d9dce4" ${ink(2)}/><circle cx="30" cy="-42" r="4" fill="#d9dce4" ${ink(1.5)}/>
    ${block(6, -6, 88, 76, "#7a5a3a", "#5a3d26", 10, 10)}
    <rect x="14" y="2" width="56" height="50" rx="10" fill="#9df0dc" ${ink(3)}/>${lines}
    <ellipse cx="30" cy="14" rx="7" ry="4" fill="#fff" opacity="0.5"/>
    <circle cx="82" cy="10" r="4.5" fill="#2b2150" ${ink(1.5)}/><circle cx="82" cy="26" r="4.5" fill="#2b2150" ${ink(1.5)}/><path d="M77 38 L87 38 M77 44 L87 44" stroke="#3a2a1a" stroke-width="2"/>`);
}

function vcr() {
  const tapes = ["#1d1830", "#2b2150", "#1d1830"];
  return svg("0 0 100 96", `
    <rect x="12" y="8" width="76" height="84" rx="6" fill="#6a3f2a" ${ink(3)}/>
    ${block(16, 18, 68, 30, "#3a3157", "#2b2150", 14, 4)}
    <rect x="22" y="34" width="30" height="6" rx="1" fill="#1d1830"/><rect x="58" y="34" width="20" height="7" rx="1" fill="#3a0f14"/><text x="68" y="40" font-family="monospace" font-size="6.5" font-weight="bold" fill="#ff5a4a" text-anchor="middle">12:00</text>
    <circle cx="26" cy="26" r="2" fill="#ef4f43"/>
    ${tapes.map((c, i) => `<rect x="${20 + i * 20}" y="58" width="16" height="28" rx="2" fill="${c}" ${ink(2)}/><rect x="${22 + i * 20}" y="62" width="12" height="6" fill="#fbf5e6"/>`).join("")}`);
}

function dogbed() {
  let dots = "";
  for (let i = 0; i < 5; i += 1) dots += `<circle cx="${30 + i * 10}" cy="${50 + (i % 2) * 12}" r="2.5" fill="#fff" opacity="0.7"/>`;
  return svg("0 10 100 90", `<ellipse cx="52" cy="60" rx="45" ry="33" fill="#000" opacity="0.3"/><ellipse cx="50" cy="55" rx="43" ry="32" fill="#c94785" ${ink(3.5)}/><ellipse cx="50" cy="58" rx="30" ry="20" fill="#f06ba8" ${ink(2)}/>${dots}<path d="M18 44 Q30 30 50 28" fill="none" stroke="#e086b0" stroke-width="3" stroke-linecap="round"/>`);
}

function plant() {
  let leaves = "";
  for (let i = 0; i < 6; i += 1) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.45;
    const lx = 50 + Math.cos(a) * 26;
    const ly = 42 + Math.sin(a) * 30;
    leaves += `<ellipse cx="${lx}" cy="${ly}" rx="9" ry="15" transform="rotate(${(a * 180) / Math.PI + 90} ${lx} ${ly})" fill="${i % 2 ? "#4c9a43" : "#5fb354"}" ${ink(2.5)}/><path d="M${lx} ${ly - 10} L${lx} ${ly + 10}" transform="rotate(${(a * 180) / Math.PI + 90} ${lx} ${ly})" stroke="#2f6e2a" stroke-width="1.5"/>`;
  }
  return svg("10 0 84 96", `<ellipse cx="52" cy="86" rx="30" ry="8" fill="#000" opacity="0.3"/>${leaves}<path d="M28 48 L72 48 L66 88 L34 88 Z" fill="#c0703f" ${ink(3)}/><rect x="26" y="44" width="48" height="10" rx="3" fill="#d98a52" ${ink(2.5)}/>`);
}

function bookshelf(w: number) {
  const W = w * 100;
  const spines = ["#2b2150", "#ef4f43", "#1d1830", "#5cb9f0", "#2b2150", "#ffc83d", "#1d1830", "#63d6c1", "#2b2150", "#f06ba8", "#1d1830", "#ef4f43"];
  let books = "";
  const n = Math.floor((W - 20) / 13);
  for (let i = 0; i < n; i += 1) {
    const bx = 12 + i * 13;
    const tall = i % 5 === 3 ? 30 : 40;
    books += `<rect x="${bx}" y="${86 - tall}" width="11" height="${tall}" fill="${spines[i % spines.length]}" ${ink(1.5)}/><rect x="${bx + 2}" y="60" width="7" height="8" fill="#fbf5e6" opacity="0.9"/>`;
  }
  return svg(`0 4 ${W} 94`, `${block(4, 10, W - 8, 84, "#8a5a3c", "#6a3f2a", 62, 6)}${books}<ellipse cx="${W * 0.3}" cy="26" rx="9" ry="7" fill="#f6f1e4" ${ink(2)}/><circle cx="${W * 0.72}" cy="24" r="12" fill="#4c9a43" ${ink(2)}/><circle cx="${W * 0.72 - 4}" cy="20" r="4" fill="#5fb354"/>`);
}

function stairsUp(w: number) {
  const W = w * 100;
  const top = -96;
  const bottom = 196;
  const n = 11;
  const stepH = (bottom - top) / n;
  const inset = 14;
  let steps = "";
  for (let i = 0; i < n; i += 1) {
    const y = top + i * stepH;
    const t = i / (n - 1);
    const tread = `rgb(${Math.round(70 + t * 108)},${Math.round(46 + t * 78)},${Math.round(32 + t * 55)})`;
    const riser = `rgb(${Math.round(48 + t * 70)},${Math.round(32 + t * 50)},${Math.round(24 + t * 34)})`;
    steps += `<rect x="${inset}" y="${y}" width="${W - inset * 2}" height="${stepH * 0.62}" fill="${tread}"/><rect x="${inset}" y="${y + stepH * 0.62}" width="${W - inset * 2}" height="${stepH * 0.38}" fill="${riser}"/><path d="M${inset} ${y + stepH * 0.62} L${W - inset} ${y + stepH * 0.62}" stroke="${INK}" stroke-width="2"/><path d="M${inset + 4} ${y + 3} L${W - inset - 4} ${y + 3}" stroke="#fff" stroke-width="1.6" opacity="${0.06 + t * 0.22}"/>`;
    steps += `<rect x="${W * 0.32}" y="${y}" width="${W * 0.36}" height="${stepH}" fill="#9a6a72" opacity="${0.35 + t * 0.5}"/><path d="M${W * 0.3} ${y + stepH * 0.62} L${W * 0.7} ${y + stepH * 0.62}" stroke="#c9a24a" stroke-width="2.4" opacity="${0.3 + t * 0.6}"/>`;
  }
  let balusters = "";
  for (let i = 1; i < n; i += 2) {
    const y = top + i * stepH;
    balusters += `<path d="M${W - 8} ${y - 26} L${W - 8} ${y + stepH * 0.6}" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity="${0.4 + (i / n) * 0.6}"/><path d="M${W - 8} ${y - 26} L${W - 8} ${y + stepH * 0.6}" stroke="#b07a4f" stroke-width="2.4" stroke-linecap="round" opacity="${0.4 + (i / n) * 0.6}"/>`;
  }
  return svg(`-4 ${top - 6} ${W + 12} ${bottom - top + 22}`, `<defs><linearGradient id="dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0a1c" stop-opacity="1"/><stop offset="1" stop-color="#0d0a1c" stop-opacity="0"/></linearGradient></defs>
    <rect x="4" y="${top + 4}" width="${W}" height="${bottom - top}" fill="#000" opacity="0.3"/>
    <rect x="0" y="${top}" width="${W}" height="${bottom - top}" fill="#5a3a26" ${ink(3)}/>
    ${steps}
    <rect x="0" y="${top}" width="${inset}" height="${bottom - top}" fill="#7c4f32" ${ink(2.4)}/><rect x="${W - inset}" y="${top}" width="${inset}" height="${bottom - top}" fill="#7c4f32" ${ink(2.4)}/>
    <path d="M3 ${top + 4} L3 ${bottom - 4}" stroke="#a8774f" stroke-width="2" opacity="0.6"/>
    ${balusters}
    <path d="M${W - 8} ${top - 20} L${W - 8} ${bottom - 34}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M${W - 8} ${top - 20} L${W - 8} ${bottom - 34}" stroke="#7c4527" stroke-width="5" stroke-linecap="round"/>
    <rect x="${W - 20}" y="${bottom - 48}" width="24" height="52" rx="4" fill="#8a5a3c" ${ink(2.6)}/><circle cx="${W - 8}" cy="${bottom - 52}" r="10" fill="#a8774f" ${ink(2.6)}/><circle cx="${W - 11}" cy="${bottom - 55}" r="3" fill="#fff" opacity="0.5"/>
    <rect x="0" y="${top - 6}" width="${W + 4}" height="${(bottom - top) * 0.42}" fill="url(#dark)"/>`);
}

function propArt(p: PropDef): string | null {
  const w = p.w ?? 1;
  const h = p.h ?? 1;
  switch (p.kind) {
    case "table":
      return table(w, h);
    case "fridge":
      return fridge();
    case "stove":
      return stove();
    case "sink":
      return sink();
    case "counter":
      return counter(w);
    case "counterLow":
      return counterLow(w);
    case "pantry":
      return pantryShelf();
    case "washer":
      return washer(h);
    case "cabinet":
      return glassCabinet();
    case "chair":
      return chair();
    case "sideboard":
      return sideboard(w);
    case "sofa":
      return sofa(w, h);
    case "armchair":
      return armchair();
    case "tv":
      return tv();
    case "vcr":
      return vcr();
    case "dogbed":
      return dogbed();
    case "plant":
      return plant();
    case "shelf":
      return bookshelf(w);
    case "stairs":
      return p.f === 0 ? stairsUp(w) : null;
    default:
      return null;
  }
}

export function rooms(levels: readonly LevelDef[]): Sheet {
  const out: Sheet = {};
  for (const level of levels) {
    out[`floor-${level.id}`] = { svg: roomFloor(level), res: 1.25 };
    for (const p of level.props) {
      const name = propArtName(p);
      if (out[name]) continue;
      const art = propArt(p);
      if (art) out[name] = { svg: art };
    }
  }
  for (const theme of ["kitchen", "living"] as const) for (const k of ["top", "mid", "bottom", "single"]) out[`wall-${theme}-${k}`] = { svg: roomWall(theme, k) };
  return out;
}
