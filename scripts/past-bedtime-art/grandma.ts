import { ink, P, rnd, svg } from "./kit";

const INK = P.ink;
const TERRA = "#c8735a";
const SAGE = "#8fae8b";
const CREAM = "#efe3c8";
const ROSE = "#e58fa6";
const LILAC = "#a58fd8";

export function hydraulicBody(w: number, h: number) {
  let out = `<rect width="${w * 100}" height="${h * 100}" fill="${CREAM}"/>`;
  for (let y = 0; y < h * 2; y += 1) {
    for (let x = 0; x < w * 2; x += 1) {
      const px = x * 50;
      const py = y * 50;
      const tint = rnd(x * 7 + y * 3) > 0.5 ? "#f2e7cf" : "#ebdec2";
      out += `<rect x="${px}" y="${py}" width="50" height="50" fill="${tint}"/>`;
      out += `<path d="M${px} ${py + 14} Q${px + 14} ${py + 14} ${px + 14} ${py} L${px} ${py} Z M${px + 50} ${py + 14} Q${px + 36} ${py + 14} ${px + 36} ${py} L${px + 50} ${py} Z M${px} ${py + 36} Q${px + 14} ${py + 36} ${px + 14} ${py + 50} L${px} ${py + 50} Z M${px + 50} ${py + 36} Q${px + 36} ${py + 36} ${px + 36} ${py + 50} L${px + 50} ${py + 50} Z" fill="${TERRA}" opacity="0.62"/>`;
      out += `<path d="M${px + 25} ${py + 13} Q${px + 31} ${py + 19} ${px + 37} ${py + 25} Q${px + 31} ${py + 31} ${px + 25} ${py + 37} Q${px + 19} ${py + 31} ${px + 13} ${py + 25} Q${px + 19} ${py + 19} ${px + 25} ${py + 13} Z" fill="${SAGE}" opacity="0.6"/>`;
      out += `<circle cx="${px + 25}" cy="${py + 25}" r="3.4" fill="${TERRA}" opacity="0.75"/>`;
      out += `<path d="M${px + 25} ${py + 4} L${px + 25} ${py + 9} M${px + 25} ${py + 41} L${px + 25} ${py + 46} M${px + 4} ${py + 25} L${px + 9} ${py + 25} M${px + 41} ${py + 25} L${px + 46} ${py + 25}" stroke="${SAGE}" stroke-width="2.2" stroke-linecap="round" opacity="0.7"/>`;
      if (rnd(x * 13 + y * 29) > 0.8) out += `<path d="M${px + 8 + rnd(x) * 20} ${py + 30} q8 -3 14 1" stroke="#c9b89a" stroke-width="1.4" fill="none" opacity="0.8"/>`;
    }
  }
  for (let y = 0; y <= h * 2; y += 1) out += `<path d="M0 ${y * 50} L${w * 100} ${y * 50}" stroke="#b8a586" stroke-width="1.6" opacity="0.8"/>`;
  for (let x = 0; x <= w * 2; x += 1) out += `<path d="M${x * 50} 0 L${x * 50} ${h * 100}" stroke="#b8a586" stroke-width="1.6" opacity="0.8"/>`;
  return out;
}

function plates() {
  const plate = (cx: number, cy: number, r: number, rim: string, motif: string) => `<circle cx="${cx + 2}" cy="${cy + 3}" r="${r}" fill="#000" opacity="0.28"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fbf5e6" ${ink(2.2)}/><circle cx="${cx}" cy="${cy}" r="${r * 0.78}" fill="none" stroke="${rim}" stroke-width="2.4"/>${motif}<path d="M${cx - r * 0.5} ${cy - r * 0.6} Q${cx - r * 0.2} ${cy - r * 0.8} ${cx + r * 0.1} ${cy - r * 0.72}" stroke="#fff" stroke-width="1.6" fill="none"/>`;
  const flower = (cx: number, cy: number, c: string) => [0, 72, 144, 216, 288].map((a) => `<circle cx="${cx + Math.cos((a * Math.PI) / 180) * 4}" cy="${cy + Math.sin((a * Math.PI) / 180) * 4}" r="3" fill="${c}"/>`).join("") + `<circle cx="${cx}" cy="${cy}" r="2" fill="${P.sun}"/>`;
  return svg("-4 -4 96 46", `${plate(14, 22, 13, "#5f9fc0", flower(14, 22, ROSE))}${plate(44, 14, 15, TERRA, `<path d="M38 18 Q44 6 50 18 Z" fill="${SAGE}"/><circle cx="44" cy="12" r="2.4" fill="${TERRA}"/>`)}${plate(74, 22, 13, SAGE, flower(74, 22, "#5f9fc0"))}`);
}

function herbs() {
  const pot = (x: number, c: string, leaves: string) => `<path d="M${x - 10} 22 L${x + 10} 22 L${x + 7} 40 L${x - 7} 40 Z" fill="${c}" ${ink(2)}/><rect x="${x - 12}" y="18" width="24" height="6" rx="2" fill="${c}" ${ink(2)}/>${leaves}`;
  const leafy = (x: number) => [-8, -3, 2, 7].map((d, i) => `<ellipse cx="${x + d}" cy="${10 - (i % 2) * 5}" rx="4" ry="8" transform="rotate(${d * 3} ${x + d} ${12 - (i % 2) * 5})" fill="${i % 2 ? "#4c9a43" : "#6cbb5c"}" ${ink(1.6)}/>`).join("");
  const sprig = (x: number) => `<path d="M${x} 18 L${x - 6} 0 M${x} 18 L${x + 4} -2 M${x} 18 L${x} 2" stroke="#3f7a36" stroke-width="2.2" stroke-linecap="round"/>${[0, 4, 8, 12].map((k) => `<circle cx="${x - 6 + k * 0.4}" cy="${2 + k}" r="2.2" fill="#7cc46a"/><circle cx="${x + 4 - k * 0.3}" cy="${k}" r="2.2" fill="#7cc46a"/>`).join("")}`;
  return svg("-6 -12 172 56", `${pot(20, TERRA, leafy(20))}${pot(62, "#f6f1e4", sprig(62))}<path d="M56 30 L68 30" stroke="#5f9fc0" stroke-width="2"/>${pot(104, TERRA, leafy(104))}<rect x="128" y="14" width="22" height="26" rx="4" fill="#e9f2f6" ${ink(2)}/><rect x="131" y="24" width="16" height="13" rx="2" fill="#ef4f43" opacity="0.8"/><rect x="126" y="10" width="26" height="6" rx="2" fill="#fbf5e6" ${ink(1.8)}/>`);
}

function garlic() {
  let bulbs = "";
  for (let i = 0; i < 6; i += 1) {
    const y = 18 + i * 11;
    const x = 14 + (i % 2 ? 6 : -4);
    bulbs += `<path d="M${x} ${y - 8} Q${x + 10} ${y - 2} ${x + 8} ${y + 6} Q${x} ${y + 10} ${x - 8} ${y + 6} Q${x - 10} ${y - 2} ${x} ${y - 8} Z" fill="#f6efe0" ${ink(2)}/><path d="M${x} ${y - 6} L${x} ${y + 7}" stroke="#d9c9b0" stroke-width="1.6"/>`;
  }
  return svg("-4 -4 40 90", `<path d="M16 0 Q12 40 18 80" stroke="#b07a44" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="16" cy="2" r="3" fill="#9aa6b8" ${ink(1.4)}/>${bulbs}`);
}

function apron() {
  return svg("-4 -4 56 94", `<circle cx="24" cy="4" r="3.5" fill="#c9a24a" ${ink(1.5)}/><path d="M24 6 Q14 14 12 22 M24 6 Q34 14 36 22" fill="none" stroke="${TERRA}" stroke-width="3"/><path d="M10 22 L38 22 L42 80 Q24 86 6 80 Z" fill="${ROSE}" ${ink(2.5)}/><path d="M8 50 L40 50" stroke="#fbf5e6" stroke-width="3"/><rect x="14" y="54" width="20" height="14" rx="3" fill="#f9b6d4" ${ink(1.8)}/>${[0, 1, 2, 3, 4].map((i) => `<circle cx="${12 + i * 6}" cy="${30 + (i % 2) * 8}" r="2" fill="#fbf5e6"/>`).join("")}<path d="M8 78 Q24 84 40 78" fill="none" stroke="#fbf5e6" stroke-width="3" stroke-dasharray="3 3"/>`);
}

function broom() {
  let straw = "";
  for (let i = 0; i < 9; i += 1) straw += `<path d="M${10 + i * 3} 70 L${6 + i * 4} 96" stroke="#b07a44" stroke-width="1.6"/>`;
  return svg("-2 -4 50 104", `<path d="M30 0 L22 68" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M30 0 L22 68" stroke="#c08a5e" stroke-width="3.5" stroke-linecap="round"/><path d="M8 68 L36 66 L44 96 L2 98 Z" fill="#e0b15a" ${ink(2.4)}/>${straw}<path d="M8 74 L38 72" stroke="${TERRA}" stroke-width="3"/>`);
}

function hoop() {
  let stitches = "";
  const word = [[-14, -4], [-8, -4], [-2, -4], [6, -4], [12, -4]];
  for (const [x, y] of word) stitches += `<path d="M${x} ${y} l3 3 M${x + 3} ${y} l-3 3" stroke="${TERRA}" stroke-width="1.4"/>`;
  return svg("-26 -32 52 60", `<path d="M0 -28 L0 -22" ${ink(2)}/><circle cx="0" cy="-29" r="2.5" fill="#c9a24a" ${ink(1.2)}/><circle cx="0" cy="0" r="22" fill="#c08a5e" ${ink(2.4)}/><circle cx="0" cy="0" r="18" fill="#fbf5e6" ${ink(1.8)}/>${stitches}<path d="M-6 8 Q-8 2 -2 3 Q0 -1 3 3 Q8 2 6 8 Q2 12 0 14 Q-2 12 -6 8 Z" fill="${ROSE}"/><path d="M-12 10 Q-8 6 -6 10 M12 10 Q8 6 6 10" fill="none" stroke="${SAGE}" stroke-width="2"/><rect x="-3" y="-25" width="6" height="5" rx="1" fill="#9aa6b8" ${ink(1)}/>`);
}

function portrait() {
  return svg("-30 -36 60 74", `<path d="M0 -34 L0 -28" ${ink(2)}/><ellipse cx="2" cy="3" rx="24" ry="30" fill="#000" opacity="0.28"/><ellipse cx="0" cy="0" rx="24" ry="30" fill="#c9a24a" ${ink(2.4)}/><ellipse cx="0" cy="0" rx="19" ry="25" fill="#e8dcc4" ${ink(1.6)}/>
    <path d="M-15 18 Q0 8 15 18 L15 24 Q0 28 -15 24 Z" fill="#5d6b8a"/><path d="M-4 9 L0 16 L4 9" fill="#fbf5e6"/>
    <circle cx="0" cy="-2" r="10" fill="#d9a77a" ${ink(1.5)}/><path d="M-10 -6 Q0 -16 10 -6 Q8 -12 0 -13 Q-8 -12 -10 -6 Z" fill="#9aa0ad"/>
    <path d="M-5 3 Q-2 1 0 3 Q2 1 5 3" fill="#6b6f7d"/><circle cx="-3.5" cy="-3" r="1.2" fill="${INK}"/><circle cx="3.5" cy="-3" r="1.2" fill="${INK}"/>
    <circle cx="-3.5" cy="-3" r="3.6" fill="none" stroke="${INK}" stroke-width="1"/><circle cx="3.5" cy="-3" r="3.6" fill="none" stroke="${INK}" stroke-width="1"/>
    <path d="M14 -22 Q22 -30 24 -18 Q18 -16 14 -22 Z" fill="${ROSE}" ${ink(1.2)}/><path d="M16 -18 L10 -6" stroke="${SAGE}" stroke-width="1.8"/><path d="M-18 -26 L-10 -30" stroke="#1d1830" stroke-width="3"/>`);
}

function figurines() {
  return svg("-4 -46 108 54", `<rect x="0" y="0" width="100" height="7" rx="2" fill="#f6f1e4" ${ink(2)}/><path d="M10 7 L14 13 M90 7 L86 13" ${ink(1.8)}/>
    <path d="M14 0 Q12 -18 20 -22 Q28 -18 26 0 Z" fill="#fbf5e6" ${ink(1.8)}/><circle cx="20" cy="-27" r="6" fill="#fbf5e6" ${ink(1.8)}/><path d="M15 -31 L17 -36 L20 -32 M25 -31 L23 -36 L20 -32" fill="#fbf5e6" ${ink(1.4)}/><circle cx="18" cy="-27" r="1" fill="${INK}"/><circle cx="22" cy="-27" r="1" fill="${INK}"/><path d="M26 -4 Q32 -10 28 -16" fill="none" ${ink(1.8)}/>
    <path d="M42 0 L46 -14 L54 -14 L58 0 Z" fill="${ROSE}" ${ink(1.8)}/><path d="M38 -14 Q50 -10 62 -14" fill="none" stroke="#f9b6d4" stroke-width="3"/><path d="M50 -14 L50 -26" ${ink(2)}/><circle cx="50" cy="-30" r="5" fill="#fbf5e6" ${ink(1.6)}/><path d="M50 -26 L44 -34 M50 -26 L57 -36" ${ink(1.6)}/>
    <path d="M74 0 Q70 -14 80 -16 Q92 -14 88 0 Z" fill="#a9dcf7" ${ink(1.8)}/><path d="M74 -6 L88 -6" stroke="#5f9fc0" stroke-width="2"/><ellipse cx="81" cy="-20" rx="10" ry="4" fill="#a9dcf7" ${ink(1.6)}/><circle cx="81" cy="-24" r="2.5" fill="#c9a24a"/>`);
}

function pendulumClock() {
  return svg("-19 -29 38 76", `<g transform="scale(0.72)"><path d="M-20 -30 Q0 -44 20 -30 L20 -10 L-20 -10 Z" fill="#7c4527" ${ink(2.4)}/><rect x="-20" y="-12" width="40" height="70" rx="4" fill="#8a5a3c" ${ink(2.4)}/>
    <circle cx="0" cy="-20" r="13" fill="#fbf5e6" ${ink(2)}/><path d="M0 -20 L0 -29 M0 -20 L6 -17" ${ink(1.8)}/><circle cx="0" cy="-20" r="1.6" fill="${INK}"/>
    <rect x="-12" y="0" width="24" height="50" rx="3" fill="#2a1c34" ${ink(1.8)}/><path d="M0 2 L-4 34" stroke="#c9a24a" stroke-width="2.4"/><circle cx="-4" cy="38" r="6" fill="#ffc83d" ${ink(1.6)}/><path d="M-10 2 L-6 10" stroke="#fff" stroke-width="1.4" opacity="0.4"/></g>`);
}

function basketYarn() {
  return svg("-34 -34 68 52", `<path d="M-28 -6 L28 -6 L24 16 L-24 16 Z" fill="#c9915a" ${ink(2.4)}/><path d="M-26 2 L26 2 M-25 9 L25 9" stroke="#a46f3e" stroke-width="2"/>
    <circle cx="-12" cy="-12" r="11" fill="${ROSE}" ${ink(2)}/><path d="M-20 -14 Q-12 -20 -4 -12 M-22 -8 Q-12 -14 -2 -6" fill="none" stroke="#f9b6d4" stroke-width="1.8"/>
    <circle cx="10" cy="-10" r="10" fill="${LILAC}" ${ink(2)}/><path d="M2 -12 Q10 -18 18 -10" fill="none" stroke="#cbbaf0" stroke-width="1.8"/>
    <path d="M-2 -30 L8 -2 M6 -30 L14 -2" stroke="#9aa6b8" stroke-width="2.6" stroke-linecap="round"/><circle cx="-2" cy="-31" r="2.6" fill="#ef4f43"/><circle cx="6" cy="-31" r="2.6" fill="#ef4f43"/>
    <path d="M-12 -2 Q-20 10 -30 12" fill="none" stroke="${ROSE}" stroke-width="2"/>`);
}

function slippersPair() {
  const one = (x: number, r: number) => `<g transform="rotate(${r} ${x} 0)"><ellipse cx="${x}" cy="0" rx="9" ry="14" fill="${LILAC}" ${ink(2)}/><path d="M${x - 8} -2 Q${x} -10 ${x + 8} -2 L${x + 8} 6 Q${x} 2 ${x - 8} 6 Z" fill="#cbbaf0" ${ink(1.6)}/><circle cx="${x}" cy="-4" r="3.4" fill="#fbf5e6" ${ink(1.2)}/></g>`;
  return svg("-26 -18 52 36", `${one(-9, -10)}${one(10, 12)}`);
}

function doily(w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  let lace = "";
  const ring = (k: number, n: number, r: number, color: string) => {
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2;
      lace += `<circle cx="${cx + Math.cos(a) * (w / 2) * k}" cy="${cy + Math.sin(a) * (h / 2) * k}" r="${r}" fill="${color}"/>`;
    }
  };
  ring(0.86, Math.round((w + h) / 22), 4.5, "#d9c39c");
  ring(0.62, Math.round((w + h) / 28), 5, "#f9b6d4");
  ring(0.4, Math.round((w + h) / 40), 4, "#cfe0c8");
  let scallop = "";
  const n = Math.round((w + h) / 18);
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    scallop += `<circle cx="${cx + Math.cos(a) * (w / 2 - 2)}" cy="${cy + Math.sin(a) * (h / 2 - 2)}" r="8" fill="#f8efdc" ${ink(1.6)}/>`;
  }
  return svg(`-10 -10 ${w + 20} ${h + 20}`, `${scallop}<ellipse cx="${cx}" cy="${cy}" rx="${w / 2 - 2}" ry="${h / 2 - 2}" fill="#f8efdc" ${ink(2.4)}/>
    <ellipse cx="${cx}" cy="${cy}" rx="${w * 0.43}" ry="${h * 0.43}" fill="none" stroke="${TERRA}" stroke-width="4" stroke-dasharray="12 6" opacity="0.8"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${w * 0.25}" ry="${h * 0.25}" fill="none" stroke="${SAGE}" stroke-width="3.5" stroke-dasharray="8 5" opacity="0.8"/>${lace}`);
}

function braidRug(w: number, h: number) {
  const colors = [TERRA, "#e0b15a", SAGE, ROSE, "#5f9fc0", TERRA];
  let rings = "";
  colors.forEach((c, k) => {
    const rx = w / 2 - k * (w * 0.08);
    const ry = h / 2 - k * (h * 0.08);
    if (rx < 6 || ry < 6) return;
    rings += `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${rx}" ry="${ry}" fill="${c}" ${k === 0 ? ink(2.4) : ""}/><ellipse cx="${w / 2}" cy="${h / 2}" rx="${rx - 3}" ry="${ry - 3}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="5 6" opacity="0.35"/>`;
  });
  return svg(`-4 -4 ${w + 8} ${h + 8}`, rings);
}

function passadeira(w: number, h: number) {
  let stripes = "";
  const colors = [TERRA, SAGE, "#d9a066", ROSE, "#5f9fc0"];
  for (let x = 6, i = 0; x < w - 6; x += 14, i += 1) stripes += `<rect x="${x}" y="4" width="10" height="${h - 8}" fill="${colors[i % colors.length]}" opacity="0.75"/>`;
  let fringe = "";
  for (let y = 4; y < h - 2; y += 6) fringe += `<path d="M0 ${y} L-5 ${y} M${w} ${y} L${w + 5} ${y}" stroke="#f6e7c4" stroke-width="2" stroke-linecap="round"/>`;
  return svg(`-8 -4 ${w + 16} ${h + 8}`, `${fringe}<rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="#efe3c8" ${ink(2.4)}/>${stripes}<path d="M4 ${h / 2} L${w - 4} ${h / 2}" stroke="#fffaf0" stroke-width="2" stroke-dasharray="6 6" opacity="0.6"/>`);
}

function onions() {
  return svg("-6 -6 64 40", `<path d="M0 30 Q26 36 52 30 L48 22 Q26 26 4 22 Z" fill="#c9915a" ${ink(2)}/>${[8, 22, 36].map((x, i) => `<ellipse cx="${x + 4}" cy="${16 - (i % 2) * 3}" rx="9" ry="10" fill="${i === 1 ? "#b5546a" : "#d99a4e"}" ${ink(2)}/><path d="M${x + 4} ${6 - (i % 2) * 3} L${x + 6} ${0 - (i % 2) * 3}" ${ink(1.6)}/>`).join("")}`);
}

function teaTray() {
  return svg("-30 -26 60 40", `<ellipse cx="0" cy="8" rx="28" ry="8" fill="#c9a24a" ${ink(2)}/><path d="M-12 6 Q-14 -10 0 -12 Q14 -10 12 6 Z" fill="#fbf5e6" ${ink(2)}/><path d="M12 -4 Q20 -6 22 -12" fill="none" ${ink(2.2)}/><path d="M-12 -2 Q-20 -2 -18 6" fill="none" ${ink(2)}/><circle cx="0" cy="-14" r="3" fill="${ROSE}" ${ink(1.2)}/><path d="M-6 -4 Q0 -8 6 -4" fill="none" stroke="${ROSE}" stroke-width="2"/><path d="M-2 -18 Q-6 -24 -2 -28 M4 -18 Q8 -24 4 -28" fill="none" stroke="#fff" stroke-width="1.8" opacity="0.7"/>`);
}

function curtainBack() {
  let drape = "";
  for (let i = 0; i < 5; i += 1) drape += `<path d="M${i * 20 + 2} -2 Q${i * 20 + 10} 6 ${i * 20 + 18} -2 L${i * 20 + 18} 36 Q${i * 20 + 10} 40 ${i * 20 + 2} 36 Z" fill="${i % 2 ? "#c4687c" : "#d9838f"}"/>`;
  return svg("-6 -14 112 56", `<rect x="0" y="-2" width="100" height="40" fill="#000" opacity="0.25"/>${drape}<path d="M0 -2 L100 -2 L100 38 L0 38 Z" fill="none" ${ink(2.4)}/><rect x="-4" y="-10" width="108" height="7" rx="3" fill="#7c4527" ${ink(2)}/><circle cx="-4" cy="-6.5" r="5" fill="#c9a24a" ${ink(1.5)}/><circle cx="104" cy="-6.5" r="5" fill="#c9a24a" ${ink(1.5)}/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${6 + i * 18}" cy="-3" r="3" fill="none" stroke="#c9a24a" stroke-width="1.6"/>`).join("")}`);
}

function curtainFront() {
  let folds = "";
  for (let i = 0; i < 5; i += 1) folds += `<path d="M${i * 20} 36 Q${i * 20 + 10} 32 ${i * 20 + 20} 36 L${i * 20 + 20} 94 Q${i * 20 + 10} 98 ${i * 20} 94 Z" fill="${i % 2 ? "#c4687c" : "#d9838f"}" opacity="0.96"/>`;
  let flowers = "";
  for (let i = 0; i < 9; i += 1) {
    const x = 8 + ((i * 37) % 86);
    const y = 44 + ((i * 53) % 44);
    flowers += `<circle cx="${x}" cy="${y}" r="3.2" fill="#fbf5e6" opacity="0.85"/><circle cx="${x}" cy="${y}" r="1.4" fill="${P.sun}"/>`;
  }
  return svg("-4 30 108 74", `${folds}${flowers}<path d="M0 36 L100 36 L100 94 Q50 100 0 94 Z" fill="none" ${ink(2.6)}/><path d="M2 88 Q50 94 98 88" fill="none" stroke="#f6e7c4" stroke-width="3" stroke-dasharray="4 4"/><path d="M84 50 Q92 60 86 72" fill="none" stroke="#f6e7c4" stroke-width="3"/><circle cx="88" cy="60" r="4" fill="#c9a24a" ${ink(1.4)}/>`);
}


function calendar(w: number, h: number) {
  return svg(`-4 -8 ${w + 8} ${h + 12}`, `<circle cx="${w / 2}" cy="-3" r="3" fill="#9aa6b8" ${ink(1.2)}/><rect x="2" y="3" width="${w}" height="${h}" fill="#000" opacity="0.25"/><rect x="0" y="0" width="${w}" height="${h}" rx="2" fill="#fbf5e6" ${ink(2)}/>
    <rect x="4" y="4" width="${w - 8}" height="${h * 0.42}" fill="#a9dcf7" ${ink(1.4)}/><circle cx="${w * 0.35}" cy="${h * 0.24}" r="${w * 0.1}" fill="${ROSE}"/><circle cx="${w * 0.58}" cy="${h * 0.2}" r="${w * 0.08}" fill="${P.sun}"/><path d="M6 ${h * 0.42} Q${w / 2} ${h * 0.3} ${w - 6} ${h * 0.42}" fill="${SAGE}"/>
    <rect x="4" y="${h * 0.48}" width="${w - 8}" height="${h * 0.1}" fill="#ef4f43"/>
    ${Array.from({ length: 12 }, (_, i) => `<rect x="${6 + (i % 4) * ((w - 12) / 4)}" y="${h * 0.62 + Math.floor(i / 4) * h * 0.11}" width="${(w - 16) / 4}" height="${h * 0.07}" fill="${i === 6 ? "#ef4f43" : "#d9d0c0"}"/>`).join("")}
    <circle cx="${6 + 2 * ((w - 12) / 4) + (w - 16) / 8}" cy="${h * 0.62 + h * 0.11 + h * 0.035}" r="${(w - 16) / 7}" fill="none" stroke="#ef4f43" stroke-width="1.6"/>`);
}

function pans(w: number, h: number) {
  const pan = (x: number, r: number, c: string) => `<path d="M${x} 6 L${x} ${16}" ${ink(2)}/><circle cx="${x}" cy="${16 + r}" r="${r}" fill="${c}" ${ink(2.2)}/><circle cx="${x}" cy="${16 + r}" r="${r * 0.62}" fill="none" stroke="#f6c08a" stroke-width="2" opacity="0.7"/><path d="M${x - r * 0.5} ${16 + r * 0.4} Q${x - r * 0.2} ${16 + r * 0.1} ${x + r * 0.1} ${16 + r * 0.2}" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.7"/>`;
  return svg(`-4 -2 ${w + 8} ${h + 6}`, `<rect x="0" y="2" width="${w}" height="6" rx="3" fill="#7c4527" ${ink(1.8)}/>${pan(w * 0.18, h * 0.24, "#c87a4a")}${pan(w * 0.5, h * 0.32, "#b8653a")}${pan(w * 0.82, h * 0.2, "#c87a4a")}`);
}

function spices(w: number, h: number) {
  const colors = ["#ef4f43", "#ffc83d", "#93cf4c", "#c0703f", "#f06ba8", "#5cb9f0"];
  let jars = "";
  const n = 5;
  for (let r = 0; r < 2; r += 1) for (let i = 0; i < n; i += 1) {
    const x = 6 + i * ((w - 12) / n);
    const y = 4 + r * (h * 0.5);
    jars += `<rect x="${x}" y="${y}" width="${(w - 12) / n - 3}" height="${h * 0.36}" rx="2" fill="#e9f2f6" ${ink(1.4)}/><rect x="${x + 1.5}" y="${y + h * 0.14}" width="${(w - 12) / n - 6}" height="${h * 0.2}" fill="${colors[(i + r * 2) % colors.length]}"/><rect x="${x}" y="${y - 2}" width="${(w - 12) / n - 3}" height="4" fill="#c08a5e"/>`;
  }
  return svg(`-4 -4 ${w + 8} ${h + 8}`, `<rect x="0" y="${h * 0.42}" width="${w}" height="4" fill="#7c4527" ${ink(1.4)}/><rect x="0" y="${h - 4}" width="${w}" height="5" fill="#7c4527" ${ink(1.4)}/>${jars}`);
}

function smallDoor(w: number, h: number) {
  return svg(`-6 -6 ${w + 12} ${h + 8}`, `<rect x="-4" y="-4" width="${w + 8}" height="${h + 4}" rx="2" fill="#eee4cf" ${ink(2)}/><rect x="0" y="0" width="${w}" height="${h}" rx="2" fill="#9a6440" ${ink(2.2)}/>
    <rect x="${w * 0.2}" y="${h * 0.12}" width="${w * 0.6}" height="${h * 0.4}" rx="3" fill="#24306a" ${ink(1.8)}/><circle cx="${w * 0.62}" cy="${h * 0.26}" r="${w * 0.08}" fill="#f4f1c9"/><circle cx="${w * 0.66}" cy="${h * 0.23}" r="${w * 0.07}" fill="#24306a"/>
    <path d="M${w / 2} ${h * 0.12} L${w / 2} ${h * 0.52} M${w * 0.2} ${h * 0.32} L${w * 0.8} ${h * 0.32}" stroke="#eee4cf" stroke-width="2"/>
    <circle cx="${w * 0.82}" cy="${h * 0.68}" r="3.4" fill="#ffc83d" ${ink(1.5)}/><rect x="${w * 0.15}" y="${h * 0.62}" width="${w * 0.5}" height="${h * 0.28}" rx="2" fill="none" stroke="#6d4a3a" stroke-width="1.8"/>`);
}

function hood(w: number, h: number) {
  return svg(`-4 -4 ${w + 8} ${h + 8}`, `<path d="M${w * 0.3} 0 L${w * 0.7} 0 L${w * 0.72} ${h * 0.35} L${w} ${h * 0.8} L${w} ${h} L0 ${h} L0 ${h * 0.8} L${w * 0.28} ${h * 0.35} Z" fill="#d6d0c4" ${ink(2.2)}/><rect x="0" y="${h * 0.8}" width="${w}" height="${h * 0.2}" fill="#bdb6a8" ${ink(1.8)}/><circle cx="${w * 0.2}" cy="${h * 0.9}" r="2.4" fill="#ffc83d"/><path d="M${w * 0.35} ${h * 0.08} L${w * 0.35} ${h * 0.3}" stroke="#fff" stroke-width="2" opacity="0.6"/>`);
}

function umbrellaStand() {
  return svg("-20 -62 40 66", `<path d="M-6 -20 L-12 -58 M4 -22 L14 -56" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M-6 -20 L-12 -58" stroke="#5f9fc0" stroke-width="2.6" stroke-linecap="round"/><path d="M4 -22 L14 -56" stroke="#ef4f43" stroke-width="2.6" stroke-linecap="round"/><path d="M-12 -58 q-6 -2 -6 4" fill="none" ${ink(2.4)}/><path d="M-16 -24 L16 -24 L13 0 L-13 0 Z" fill="#c9915a" ${ink(2.4)}/><path d="M-15 -16 L15 -16 M-14 -8 L14 -8" stroke="#a46f3e" stroke-width="2"/><rect x="-17" y="-28" width="34" height="6" rx="2" fill="#a46f3e" ${ink(1.8)}/>`);
}

function fernStand() {
  let fronds = "";
  for (let i = 0; i < 9; i += 1) {
    const a = Math.PI * (1.05 + (i / 8) * 0.9);
    const len = 26 + (i % 3) * 6;
    const ex = Math.cos(a) * len;
    const ey = -58 + Math.sin(a) * len * 0.8 + 10;
    fronds += `<path d="M0 -60 Q${ex * 0.5} ${-70 + (ey + 60) * 0.2} ${ex} ${ey}" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M0 -60 Q${ex * 0.5} ${-70 + (ey + 60) * 0.2} ${ex} ${ey}" stroke="${i % 2 ? "#4c9a43" : "#6cbb5c"}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
  return svg("-34 -96 68 100", `<path d="M-10 0 L-6 -40 M10 0 L6 -40 M0 0 L0 -40" ${ink(3.4)}/><path d="M-10 0 L-6 -40 M10 0 L6 -40" stroke="#8a5a3c" stroke-width="1.6"/><rect x="-14" y="-46" width="28" height="7" rx="2" fill="#8a5a3c" ${ink(2)}/><path d="M-12 -60 L12 -60 L9 -46 L-9 -46 Z" fill="${TERRA}" ${ink(2.2)}/>${fronds}`);
}

function tableRug(w: number, h: number) {
  let border = "";
  for (let x = 14; x < w - 14; x += 18) border += `<path d="M${x} 8 L${x + 9} 14 L${x + 18} 8" fill="none" stroke="${TERRA}" stroke-width="3"/><path d="M${x} ${h - 8} L${x + 9} ${h - 14} L${x + 18} ${h - 8}" fill="none" stroke="${TERRA}" stroke-width="3"/>`;
  let fringe = "";
  for (let y = 6; y < h - 4; y += 7) fringe += `<path d="M0 ${y} L-6 ${y} M${w} ${y} L${w + 6} ${y}" stroke="#f6e7c4" stroke-width="2.2" stroke-linecap="round"/>`;
  return svg(`-10 -4 ${w + 20} ${h + 8}`, `${fringe}<rect x="0" y="0" width="${w}" height="${h}" rx="8" fill="#e9d9b8" ${ink(2.6)}/><rect x="18" y="20" width="${w - 36}" height="${h - 40}" rx="6" fill="${SAGE}" opacity="0.55"/><rect x="28" y="30" width="${w - 56}" height="${h - 60}" rx="5" fill="none" stroke="#fffaf0" stroke-width="3" stroke-dasharray="10 6" opacity="0.7"/>${border}`);
}

function toaster() {
  return svg("-4 -14 44 44", `<path d="M10 -2 Q12 -12 16 -2 M20 -2 Q22 -12 26 -2" fill="#e0b15a" ${ink(1.6)}/><rect x="0" y="0" width="34" height="26" rx="8" fill="#c9cfdc" ${ink(2.2)}/><rect x="0" y="16" width="34" height="10" rx="5" fill="#a9b0c0"/><path d="M8 4 L14 4 M20 4 L26 4" ${ink(2.4)}/><rect x="30" y="8" width="7" height="4" rx="2" fill="#ef4f43" ${ink(1.2)}/><path d="M4 4 Q8 2 10 6" stroke="#fff" stroke-width="1.8" fill="none" opacity="0.8"/>`);
}

function radio() {
  let grille = "";
  for (let i = 0; i < 4; i += 1) grille += `<path d="M6 ${7 + i * 4} L22 ${7 + i * 4}" stroke="#7a4a32" stroke-width="1.6"/>`;
  return svg("-4 -16 52 46", `<path d="M30 0 L40 -14" ${ink(2)}/><circle cx="40" cy="-14" r="2" fill="#9aa6b8"/><rect x="0" y="0" width="42" height="26" rx="6" fill="#c0703f" ${ink(2.2)}/><rect x="4" y="4" width="20" height="18" rx="4" fill="#f6e7c4" ${ink(1.4)}/>${grille}<rect x="27" y="5" width="11" height="7" rx="2" fill="#2b2150" ${ink(1.2)}/><path d="M29 9 L36 9" stroke="#ffc83d" stroke-width="1.4"/><circle cx="30" cy="18" r="3" fill="#fbf5e6" ${ink(1.2)}/><circle cx="37" cy="18" r="3" fill="#fbf5e6" ${ink(1.2)}/>`);
}

function thermos() {
  return svg("-4 -20 26 50", `<rect x="0" y="-12" width="16" height="36" rx="6" fill="#5cb9f0" ${ink(2.2)}/><rect x="-1" y="-17" width="18" height="7" rx="3" fill="#ef4f43" ${ink(1.8)}/><circle cx="8" cy="4" r="4" fill="#fbf5e6"/><circle cx="8" cy="4" r="1.8" fill="#e58fa6"/><circle cx="5" cy="13" r="2.4" fill="#fbf5e6"/><path d="M3 -8 L3 18" stroke="#fff" stroke-width="2" opacity="0.6"/>`);
}

function breadbox() {
  return svg("-4 -8 58 40", `<rect x="0" y="0" width="50" height="28" rx="10" fill="#f6efe0" ${ink(2.2)}/><path d="M2 12 Q25 4 48 12" fill="none" ${ink(1.8)}/><path d="M4 10 Q25 -6 46 10" fill="#e9dfcb" ${ink(1.6)}/><text x="25" y="23" font-family="Arial Black, sans-serif" font-size="7" fill="#c4352c" text-anchor="middle">PÃO</text><rect x="21" y="12" width="8" height="3" rx="1.5" fill="#9aa6b8" ${ink(1)}/>`);
}

function jarsArt() {
  const c = ["#ffc83d", "#c0703f", "#f6f1e4"];
  return svg("-4 -18 68 44", c.map((col, i) => {
    const x = i * 20;
    const y = i % 2 ? -10 : 0;
    return `<rect x="${x}" y="${y}" width="16" height="22" rx="4" fill="#e9f2f6" ${ink(1.8)}/><rect x="${x + 2}" y="${y + 8}" width="12" height="12" rx="2" fill="${col}"/><rect x="${x - 1}" y="${y - 4}" width="18" height="5" rx="2" fill="${["#ef4f43", "#5f9fc0", "#93cf4c"][i]}" ${ink(1.4)}/><rect x="${x + 3}" y="${y + 10}" width="10" height="5" fill="#fbf5e6" opacity="0.85"/>`;
  }).join(""));
}

function blender() {
  return svg("-14 -26 28 54", `<path d="M-8 -16 L8 -16 L6 12 L-6 12 Z" fill="#d9f0f7" fill-opacity="0.7" ${ink(2)}/><path d="M-6 -4 L6 -4 L5 10 L-5 10 Z" fill="#ef4f43" opacity="0.5"/><rect x="-9" y="-21" width="18" height="6" rx="2" fill="#2b2150" ${ink(1.6)}/><rect x="-10" y="12" width="20" height="12" rx="3" fill="#ef4f43" ${ink(2)}/><circle cx="0" cy="18" r="2.4" fill="#fbf5e6"/><path d="M-5 -12 L-5 6" stroke="#fff" stroke-width="1.8" opacity="0.7"/>`);
}

function fruitBowl() {
  return svg("-26 -18 52 30", `<path d="M-20 0 Q-20 10 0 11 Q20 10 20 0 Z" fill="#5f9fc0" ${ink(2)}/><ellipse cx="0" cy="0" rx="20" ry="5" fill="#a9dcf7" ${ink(1.8)}/><circle cx="-10" cy="-4" r="6" fill="#f2a33a" ${ink(1.6)}/><circle cx="2" cy="-6" r="6.5" fill="#ef4f43" ${ink(1.6)}/><circle cx="11" cy="-3" r="5.5" fill="#93cf4c" ${ink(1.6)}/><path d="M-6 -12 Q4 -18 14 -10 Q6 -12 -4 -8 Z" fill="#ffd23d" ${ink(1.4)}/><path d="M2 -12 L3 -15" ${ink(1.4)}/>`);
}

export const GRANDMA_KINDS = new Set(["plates", "herbs", "garlic", "apron", "broom", "hoop", "portrait", "figurines", "penduloClock", "basketYarn", "slippersPair", "doily", "passadeira", "onions", "teaTray", "calendar", "pans", "spices", "smallDoor", "hood", "braidRug", "umbrellaStand", "fernStand", "tableRug", "toaster", "radio", "thermos", "breadbox", "jars", "blender", "fruit"]);

export function grandmaDecor(kind: string, w: number, h: number): string | null {
  switch (kind) {
    case "plates":
      return plates();
    case "herbs":
      return herbs();
    case "garlic":
      return garlic();
    case "apron":
      return apron();
    case "broom":
      return broom();
    case "hoop":
      return hoop();
    case "portrait":
      return portrait();
    case "figurines":
      return figurines();
    case "penduloClock":
      return pendulumClock();
    case "basketYarn":
      return basketYarn();
    case "slippersPair":
      return slippersPair();
    case "doily":
      return doily(w, h);
    case "passadeira":
      return passadeira(w, h);
    case "onions":
      return onions();
    case "teaTray":
      return teaTray();
    case "calendar":
      return calendar(w, h);
    case "pans":
      return pans(w, h);
    case "spices":
      return spices(w, h);
    case "smallDoor":
      return smallDoor(w, h);
    case "hood":
      return hood(w, h);
    case "braidRug":
      return braidRug(w, h);
    case "umbrellaStand":
      return umbrellaStand();
    case "fernStand":
      return fernStand();
    case "tableRug":
      return tableRug(w, h);
    case "toaster":
      return toaster();
    case "radio":
      return radio();
    case "thermos":
      return thermos();
    case "breadbox":
      return breadbox();
    case "jars":
      return jarsArt();
    case "blender":
      return blender();
    case "fruit":
      return fruitBowl();
    default:
      return null;
  }
}

export function grandmaHides() {
  return { "hide-curtain-back": curtainBack(), "hide-curtain-front": curtainFront() };
}
