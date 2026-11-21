import { ink, P, rnd, svg } from "./kit";

const INK = P.ink;

export function redCementBody(w: number, h: number) {
  let out = `<rect width="${w * 100}" height="${h * 100}" fill="#a9463b"/>`;
  for (let i = 0; i < w * h * 9; i += 1) {
    const x = rnd(i * 3.7 + 1) * w * 100;
    const y = rnd(i * 5.3 + 2) * h * 100;
    const r = 6 + rnd(i * 1.9) * 22;
    out += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="${rnd(i) > 0.5 ? "#b9533f" : "#97392f"}" opacity="0.45"/>`;
  }
  for (let y = 0; y <= h; y += 1) out += `<path d="M0 ${y * 100} L${w * 100} ${y * 100}" stroke="#7a2c24" stroke-width="2.4" opacity="0.7"/>`;
  for (let x = 0; x <= w; x += 1) out += `<path d="M${x * 100} 0 L${x * 100} ${h * 100}" stroke="#7a2c24" stroke-width="2.4" opacity="0.7"/>`;
  for (let i = 0; i < w * h; i += 1) {
    const x = (i % w) * 100 + 20 + rnd(i * 7) * 50;
    const y = Math.floor(i / w) * 100 + 16 + rnd(i * 11) * 50;
    out += `<path d="M${x} ${y} q12 -4 26 0" stroke="#e8836f" stroke-width="2.4" fill="none" opacity="0.55" stroke-linecap="round"/>`;
  }
  return out;
}

function clothesline(w: number, h: number) {
  const sag = (x: number) => 8 + Math.sin((x / w) * Math.PI) * 10;
  const pin = (x: number) => `<rect x="${x - 2}" y="${sag(x) - 5}" width="4" height="9" rx="1" fill="#e0b15a" ${ink(1)}/>`;
  const sock = (x: number, c: string) => `<path d="M${x} ${sag(x)} L${x + 10} ${sag(x)} L${x + 10} ${sag(x) + 24} Q${x + 18} ${sag(x) + 24} ${x + 18} ${sag(x) + 32} Q${x + 18} ${sag(x) + 38} ${x + 8} ${sag(x) + 38} Q${x} ${sag(x) + 38} ${x} ${sag(x) + 30} Z" fill="#f6f1e4" ${ink(1.8)}/><rect x="${x}" y="${sag(x) + 2}" width="10" height="4" fill="${c}"/>${pin(x + 5)}`;
  const shirt = (x: number, c: string, txt: string) => `<path d="M${x} ${sag(x)} L${x + 14} ${sag(x) - 2} L${x + 28} ${sag(x)} L${x + 40} ${sag(x) + 10} L${x + 34} ${sag(x) + 18} L${x + 30} ${sag(x) + 14} L${x + 30} ${sag(x) + 46} L${x + 6} ${sag(x) + 46} L${x + 6} ${sag(x) + 14} L${x + 2} ${sag(x) + 18} L${x - 6} ${sag(x) + 10} Z" fill="${c}" ${ink(2)}/>${txt}${pin(x + 2)}${pin(x + 26)}`;
  const towel = (x: number, c: string) => `<rect x="${x}" y="${sag(x)}" width="34" height="44" rx="2" fill="${c}" ${ink(2)}/><path d="M${x} ${sag(x) + 34} L${x + 34} ${sag(x) + 34} M${x} ${sag(x) + 38} L${x + 34} ${sag(x) + 38}" stroke="#fff" stroke-width="2" opacity="0.7"/>${pin(x + 6)}${pin(x + 28)}`;
  const pjs = (x: number) => `<path d="M${x} ${sag(x)} L${x + 30} ${sag(x)} L${x + 30} ${sag(x) + 50} L${x + 18} ${sag(x) + 50} L${x + 15} ${sag(x) + 20} L${x + 12} ${sag(x) + 50} L${x} ${sag(x) + 50} Z" fill="${P.sky}" ${ink(2)}/><path d="M${x + 8} ${sag(x)} L${x + 8} ${sag(x) + 48} M${x + 22} ${sag(x)} L${x + 22} ${sag(x) + 48}" stroke="${P.skyPale}" stroke-width="2.5"/>${pin(x + 4)}${pin(x + 26)}`;
  const logo = (x: number) => `<rect x="${x + 10}" y="${sag(x) + 18}" width="16" height="12" rx="2" fill="#1d1830"/><text x="${x + 18}" y="${sag(x) + 27}" font-family="Arial Black, sans-serif" font-size="7" fill="#ffc83d" text-anchor="middle">404</text>`;
  const W = w;
  return svg(`-8 -6 ${W + 16} ${h + 14}`, `<circle cx="0" cy="8" r="3.5" fill="#9aa6b8" ${ink(1.4)}/><circle cx="${W}" cy="8" r="3.5" fill="#9aa6b8" ${ink(1.4)}/><path d="M0 8 Q${W / 2} 28 ${W} 8" fill="none" stroke="#e9e2ff" stroke-width="2" opacity="0.9"/>
    ${sock(W * 0.06, P.tomato)}${shirt(W * 0.18, "#fbf5e6", logo(W * 0.18))}${towel(W * 0.38, "#63d6c1")}${pjs(W * 0.55)}${sock(W * 0.72, P.sky)}${sock(W * 0.78, P.tomato)}${towel(W * 0.86, "#f06ba8")}`);
}

function laundryShelf(w: number, h: number) {
  return svg(`-4 -4 ${w + 8} ${h + 8}`, `<rect x="0" y="${h - 8}" width="${w}" height="7" rx="2" fill="#f6f1e4" ${ink(1.8)}/>
    <rect x="6" y="${h - 40}" width="26" height="32" rx="2" fill="#5cb9f0" ${ink(2)}/><rect x="9" y="${h - 30}" width="20" height="10" fill="#fbf5e6"/><text x="19" y="${h - 22}" font-family="Arial Black, sans-serif" font-size="6" fill="#c4352c" text-anchor="middle">SABÃO</text><circle cx="19" cy="${h - 13}" r="3" fill="#ffc83d"/>
    <path d="M40 ${h - 8} L40 ${h - 30} Q40 ${h - 38} 46 ${h - 38} L48 ${h - 44} L54 ${h - 44} L56 ${h - 38} Q62 ${h - 38} 62 ${h - 30} L62 ${h - 8} Z" fill="#f06ba8" ${ink(2)}/><rect x="44" y="${h - 26}" width="14" height="10" rx="2" fill="#fbf5e6"/>
    <rect x="${w - 30}" y="${h - 26}" width="24" height="18" rx="4" fill="#d9c9f0" ${ink(1.8)}/>${[0, 1, 2].map((i) => `<rect x="${w - 26 + i * 7}" y="${h - 32}" width="3" height="9" rx="1" fill="${["#ef4f43", "#ffc83d", "#63d6c1"][i]}" ${ink(0.8)}/>`).join("")}`);
}

function namePlate() {
  return svg("-50 -22 100 46", `<path d="M-30 -18 L0 -8 L30 -18" fill="none" ${ink(1.6)}/><circle cx="0" cy="-8" r="2.4" fill="#c9a24a"/><rect x="-44" y="-8" width="88" height="26" rx="6" fill="#c08a5e" ${ink(2.4)}/><rect x="-40" y="-4" width="80" height="18" rx="4" fill="none" stroke="#9a6440" stroke-width="1.6"/><text x="4" y="10" font-family="Arial Black, sans-serif" font-size="13" fill="#fbf5e6" text-anchor="middle" stroke="${INK}" stroke-width="1">PIPOCA</text><g transform="translate(-34 5)"><ellipse cx="0" cy="2" rx="3.4" ry="3" fill="#fbf5e6"/><circle cx="-3.4" cy="-3" r="1.6" fill="#fbf5e6"/><circle cx="0" cy="-4.4" r="1.6" fill="#fbf5e6"/><circle cx="3.4" cy="-3" r="1.6" fill="#fbf5e6"/></g>`);
}

function dogBowls() {
  const bowl = (x: number, c: string, fill: string) => `<ellipse cx="${x}" cy="12" rx="17" ry="6" fill="#000" opacity="0.3"/><path d="M${x - 16} 0 L${x + 16} 0 L${x + 12} 10 L${x - 12} 10 Z" fill="${c}" ${ink(2)}/><ellipse cx="${x}" cy="0" rx="16" ry="5" fill="${c}" ${ink(2)}/><ellipse cx="${x}" cy="0" rx="12" ry="3.4" fill="${fill}"/>`;
  return svg("-22 -16 82 34", `${bowl(0, P.tomato, "#c98a4a")}${bowl(38, P.sky, "#a9dcf7")}<path d="M-8 6 L8 6" stroke="#fbf5e6" stroke-width="1.6"/><circle cx="-6" cy="-2" r="1.6" fill="#8a5a2a"/><circle cx="2" cy="-1" r="1.6" fill="#8a5a2a"/><path d="M28 -2 Q38 -5 48 -2" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.8"/>`);
}

function leash() {
  return svg("-10 -4 34 94", `<circle cx="8" cy="2" r="3" fill="#9aa6b8" ${ink(1.4)}/><path d="M8 4 Q2 40 12 60 Q18 72 8 80" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M8 4 Q2 40 12 60 Q18 72 8 80" fill="none" stroke="${P.tomato}" stroke-width="2.6" stroke-linecap="round"/><circle cx="8" cy="82" r="8" fill="none" stroke="${INK}" stroke-width="5"/><circle cx="8" cy="82" r="8" fill="none" stroke="${P.tomato}" stroke-width="2.6"/><circle cx="16" cy="86" r="3" fill="${P.sun}" ${ink(1.2)}/>`);
}

function ironingBoard() {
  return svg("-4 -4 44 110", `<path d="M18 2 Q32 6 32 30 L30 96 Q18 102 6 96 L4 30 Q4 6 18 2 Z" fill="#a9dcf7" ${ink(2.4)}/>${[0, 1, 2, 3, 4].map((i) => `<circle cx="${12 + (i % 2) * 12}" cy="${22 + i * 15}" r="3" fill="#fbf5e6" opacity="0.8"/>`).join("")}<path d="M8 100 L4 104 M28 100 L32 104" ${ink(3)}/>`);
}

function boneToy() {
  return svg("-20 -10 40 20", `<path d="M-10 -2 L10 -2 L10 2 L-10 2 Z" fill="#f6efe0" ${ink(1.6)}/><circle cx="-12" cy="-3" r="4" fill="#f6efe0" ${ink(1.6)}/><circle cx="-12" cy="3" r="4" fill="#f6efe0" ${ink(1.6)}/><circle cx="12" cy="-3" r="4" fill="#f6efe0" ${ink(1.6)}/><circle cx="12" cy="3" r="4" fill="#f6efe0" ${ink(1.6)}/><path d="M-4 -1 l2 2 M2 -1 l2 2" stroke="#c9b89a" stroke-width="1.2"/>`);
}

function tennisBall() {
  return svg("-8 -8 16 16", `<circle cx="0" cy="0" r="6" fill="#c8f07a" ${ink(1.6)}/><path d="M-5 -3 Q0 0 -5 4 M5 -4 Q0 0 5 3" fill="none" stroke="#fff" stroke-width="1.4"/>`);
}

export function sewingMachine() {
  return svg("4 -40 92 136", `<rect x="12" y="30" width="80" height="60" rx="4" fill="#000" opacity="0.3"/>
    <rect x="8" y="22" width="80" height="64" rx="4" fill="#6d4a3a" ${ink(2.6)}/><rect x="10" y="24" width="76" height="16" rx="3" fill="#a8774f"/><path d="M10 40 L86 40" ${ink(2)}/>
    <rect x="14" y="46" width="30" height="16" rx="2" fill="#8a5a3c" ${ink(1.8)}/><rect x="14" y="66" width="30" height="16" rx="2" fill="#8a5a3c" ${ink(1.8)}/><circle cx="29" cy="54" r="2.6" fill="#c9a24a" ${ink(1)}/><circle cx="29" cy="74" r="2.6" fill="#c9a24a" ${ink(1)}/>
    <rect x="50" y="46" width="32" height="36" rx="2" fill="#8a5a3c" ${ink(1.8)}/><path d="M54 50 L78 50 M54 78 L78 78" stroke="#a8774f" stroke-width="1.6"/><circle cx="66" cy="64" r="7" fill="none" stroke="#2b2150" stroke-width="2.4"/><path d="M60 64 L72 64 M66 58 L66 70" stroke="#2b2150" stroke-width="1.6"/>
    <path d="M24 22 L24 -10 Q24 -22 38 -22 L66 -22 Q74 -22 74 -14 L74 0 L62 0 L62 -8 L38 -8 L38 22 Z" fill="#1d1830" ${ink(2)}/><path d="M30 -16 L58 -16" stroke="#c9a24a" stroke-width="2"/><text x="47" y="-11" font-family="Georgia, serif" font-size="7" fill="#c9a24a" text-anchor="middle">Vovó</text>
    <path d="M68 0 L68 12" stroke="#9aa6b8" stroke-width="2.4"/><circle cx="74" cy="-12" r="5" fill="#9aa6b8" ${ink(1.4)}/>
    <rect x="42" y="10" width="20" height="10" rx="2" fill="${P.bubblegum}" ${ink(1.4)}/><path d="M42 14 L62 14" stroke="#f9b6d4" stroke-width="1.4"/><circle cx="16" cy="14" r="6" fill="#ffc83d" ${ink(1.6)}/><path d="M16 8 L16 20" stroke="#ef4f43" stroke-width="1.4"/>`);
}

export function aquarium() {
  let fish = "";
  const f = (x: number, y: number, c: string, flip: number) => `<g transform="translate(${x} ${y}) scale(${flip} 1)"><ellipse cx="0" cy="0" rx="6" ry="3.6" fill="${c}" ${ink(1)}/><path d="M-5 0 L-10 -4 L-10 4 Z" fill="${c}" ${ink(1)}/><circle cx="3" cy="-1" r="0.9" fill="${INK}"/></g>`;
  fish += f(40, 2, "#ffb35c", 1) + f(64, 14, "#ef4f43", -1) + f(30, 20, "#ffc83d", 1);
  let bubbles = "";
  for (let i = 0; i < 5; i += 1) bubbles += `<circle cx="${74 + (i % 2) * 3}" cy="${22 - i * 7}" r="${1.4 + (i % 3) * 0.6}" fill="none" stroke="#e9fbff" stroke-width="1.2"/>`;
  return svg("4 -30 92 126", `<rect x="14" y="38" width="76" height="52" rx="3" fill="#000" opacity="0.3"/><rect x="12" y="34" width="76" height="52" rx="3" fill="#6d4a3a" ${ink(2.4)}/><rect x="16" y="40" width="32" height="40" rx="2" fill="none" stroke="#8a5a3c" stroke-width="2"/><rect x="52" y="40" width="32" height="40" rx="2" fill="none" stroke="#8a5a3c" stroke-width="2"/>
    <rect x="10" y="-22" width="80" height="58" rx="4" fill="#4fd1c5" fill-opacity="0.55" ${ink(2.6)}/><rect x="10" y="-22" width="80" height="10" rx="3" fill="#2b2150" ${ink(2)}/><rect x="14" y="26" width="72" height="8" fill="#e0b15a"/>
    <path d="M24 26 Q20 10 26 0 M28 26 Q32 12 26 4 M76 26 Q72 14 78 6" fill="none" stroke="#3f9a43" stroke-width="3" stroke-linecap="round"/><rect x="54" y="18" width="12" height="9" rx="2" fill="#c0703f" ${ink(1.2)}/><path d="M56 18 L56 14 L64 14 L64 18" fill="#c0703f" ${ink(1.2)}/>
    ${fish}${bubbles}<path d="M16 -8 L28 -8" stroke="#fff" stroke-width="2.4" opacity="0.6" stroke-linecap="round"/>`);
}

function catTree() {
  return svg("-38 -124 76 130", `<g transform="scale(1.26)"><rect x="-24" y="-8" width="48" height="10" rx="3" fill="#c9a17a" ${ink(2)}/><rect x="-6" y="-70" width="12" height="62" fill="#e0c9a0" ${ink(2)}/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M-6 ${-64 + i * 10} L6 ${-60 + i * 10}" stroke="#b89a6c" stroke-width="1.6"/>`).join("")}<rect x="-26" y="-84" width="52" height="16" rx="6" fill="#a58fd8" ${ink(2.2)}/><path d="M-20 -80 Q0 -86 20 -80" stroke="#cbbaf0" stroke-width="2" fill="none"/><path d="M14 -68 L16 -52" ${ink(1.4)}/><circle cx="16" cy="-50" r="4" fill="#ef4f43" ${ink(1.2)}/><path d="M-20 -40 L-6 -40" ${ink(1.6)}/><path d="M-18 -46 l4 4 l-4 4" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.6"/></g>`);
}

function ovalMirror() {
  return svg("-26 -34 52 68", `<ellipse cx="2" cy="3" rx="22" ry="29" fill="#000" opacity="0.28"/><ellipse cx="0" cy="0" rx="22" ry="29" fill="#c9a24a" ${ink(2.4)}/><ellipse cx="0" cy="0" rx="17" ry="24" fill="#3a4a7a" ${ink(1.6)}/><circle cx="6" cy="-9" r="5" fill="#f4f1c9" opacity="0.8"/><path d="M-10 -14 L-4 -18 M-12 -6 L-2 -14" stroke="#fff" stroke-width="2" opacity="0.5" stroke-linecap="round"/>`);
}

function crookedFrame() {
  return svg("-34 -30 68 60", `<g transform="rotate(-9)"><rect x="-26" y="-20" width="52" height="40" rx="2" fill="#000" opacity="0.28" transform="translate(3 4)"/><rect x="-26" y="-20" width="52" height="40" rx="2" fill="#c9a24a" ${ink(2.2)}/><rect x="-20" y="-14" width="40" height="28" fill="#f2d2a0" ${ink(1.2)}/><circle cx="-6" cy="-2" r="7" fill="#2a2342"/><path d="M-12 -6 L-10 -12 L-6 -8 M0 -6 L-2 -12 L-6 -8" fill="#2a2342"/><circle cx="-8" cy="-3" r="1.4" fill="#c8f07a"/><circle cx="-4" cy="-3" r="1.4" fill="#c8f07a"/><path d="M8 4 Q12 -4 16 4" fill="none" stroke="#ef4f43" stroke-width="2"/></g><path d="M0 -30 L-4 -20" ${ink(1.4)}/><path d="M18 22 l4 6 M24 18 l6 4" stroke="#fff" stroke-width="1.6" opacity="0.7"/>`);
}

function pennant() {
  return svg("-4 -6 90 44", `<rect x="0" y="0" width="6" height="34" rx="2" fill="#7c4527" ${ink(1.6)}/><path d="M6 2 L84 16 L6 30 Z" fill="${P.tomato}" ${ink(2.2)}/><path d="M6 8 L54 16 L6 24" fill="none" stroke="#fbf5e6" stroke-width="2.6"/><text x="30" y="19" font-family="Arial Black, sans-serif" font-size="7" fill="#fbf5e6" text-anchor="middle">CAMPEÃO</text><circle cx="66" cy="16" r="4" fill="${P.sun}" ${ink(1)}/>`);
}

function turntable() {
  return svg("-4 -42 98 92", `<rect x="4" y="16" width="84" height="30" rx="3" fill="#8a5a3c" ${ink(2.4)}/><rect x="10" y="22" width="34" height="18" rx="2" fill="none" stroke="#6d4a3a" stroke-width="2"/><rect x="48" y="22" width="34" height="18" rx="2" fill="none" stroke="#6d4a3a" stroke-width="2"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${13 + i * 6}" y="24" width="4" height="14" fill="${["#ef4f43", "#5cb9f0", "#ffc83d", "#63d6c1", "#f06ba8"][i]}" ${ink(0.8)}/>`).join("")}
    <rect x="8" y="-2" width="76" height="20" rx="3" fill="#c08a5e" ${ink(2.2)}/><ellipse cx="40" cy="6" rx="22" ry="7" fill="#1d1830" ${ink(1.6)}/><ellipse cx="40" cy="6" rx="6" ry="2.4" fill="${P.tomato}"/><path d="M70 0 L58 8" stroke="#9aa6b8" stroke-width="2.4" stroke-linecap="round"/><circle cx="70" cy="0" r="3" fill="#9aa6b8" ${ink(1)}/>
    <path d="M24 -10 L60 -10" stroke="${INK}" stroke-width="2"/><rect x="32" y="-36" width="26" height="26" rx="2" fill="#5cb9f0" ${ink(1.8)}/><circle cx="45" cy="-23" r="7" fill="#ffc83d" ${ink(1.2)}/>`);
}

function popcorn() {
  let k = "";
  for (let i = 0; i < 7; i += 1) {
    const x = rnd(i * 3.1) * 70;
    const y = rnd(i * 7.7) * 30;
    k += `<g transform="translate(${x} ${y}) rotate(${rnd(i) * 90})"><circle cx="0" cy="0" r="3.2" fill="#fff6d8" ${ink(1)}/><circle cx="3" cy="-1" r="2.4" fill="#fff6d8" ${ink(0.8)}/><circle cx="1" cy="2.4" r="1.4" fill="#f0c95a"/></g>`;
  }
  return svg("-6 -6 84 42", k);
}

function popcornBowl() {
  let pops = "";
  for (let i = 0; i < 9; i += 1) pops += `<circle cx="${-12 + (i % 5) * 6}" cy="${-6 - Math.floor(i / 5) * 5 + (i % 2) * 2}" r="4" fill="#fff6d8" ${ink(1)}/>`;
  return svg("-22 -18 44 32", `<path d="M-18 -4 L18 -4 L13 10 L-13 10 Z" fill="${P.tomato}" ${ink(2)}/><path d="M-16 0 L16 0 M-14 5 L14 5" stroke="#fbf5e6" stroke-width="2"/>${pops}`);
}

function remote() {
  return svg("-14 -6 28 12", `<g transform="rotate(-12)"><rect x="-12" y="-4" width="24" height="8" rx="3" fill="#2b2150" ${ink(1.4)}/><circle cx="-6" cy="0" r="1.6" fill="#ef4f43"/><circle cx="0" cy="0" r="1.2" fill="#d9d4e6"/><circle cx="4" cy="0" r="1.2" fill="#d9d4e6"/><circle cx="8" cy="0" r="1.2" fill="#d9d4e6"/></g>`);
}

function scarf() {
  let stripes = "";
  for (let i = 0; i < 8; i += 1) stripes += `<rect x="${i * 14}" y="0" width="7" height="16" fill="#fbf5e6"/>`;
  return svg("-4 -4 122 46", `<g transform="rotate(-4 56 8)"><rect x="0" y="0" width="112" height="16" rx="3" fill="${P.tomato}" ${ink(2)}/>${stripes}<rect x="0" y="0" width="112" height="16" rx="3" fill="none" ${ink(2)}/></g><path d="M100 12 L104 38 L94 38 Z" fill="${P.tomato}" ${ink(1.8)}/><path d="M95 38 L95 42 M99 38 L99 42 M103 38 L103 42" stroke="#fbf5e6" stroke-width="2"/>`);
}

function poster404() {
  return svg("-4 -4 78 90", `<rect x="3" y="4" width="70" height="82" fill="#000" opacity="0.28"/><rect x="0" y="0" width="70" height="82" fill="#1d1830" ${ink(2.2)}/><rect x="5" y="5" width="60" height="44" fill="#2b2150"/>${Array.from({ length: 18 }, (_, i) => `<rect x="${6 + rnd(i * 3) * 56}" y="${6 + rnd(i * 7) * 40}" width="${3 + rnd(i) * 8}" height="2" fill="#e9e2ff" opacity="${0.3 + rnd(i * 2) * 0.5}"/>`).join("")}
    <text x="35" y="34" font-family="Arial Black, sans-serif" font-size="16" fill="#ffc83d" text-anchor="middle" stroke="${INK}" stroke-width="1">404</text>
    <text x="35" y="62" font-family="Arial Black, sans-serif" font-size="8.5" fill="#fbf5e6" text-anchor="middle">SESSÃO</text><text x="35" y="73" font-family="Arial Black, sans-serif" font-size="8.5" fill="#f06ba8" text-anchor="middle">CHIADO</text>
    <circle cx="6" cy="6" r="2.4" fill="${P.tomato}"/><circle cx="64" cy="6" r="2.4" fill="${P.tomato}"/><path d="M60 80 L70 70 L70 82 Z" fill="#fbf5e6" opacity="0.8"/>`);
}

function vhsStack() {
  const tape = (y: number, label: string, rot: number) => `<g transform="translate(0 ${y}) rotate(${rot})"><rect x="-22" y="-6" width="44" height="11" rx="1.5" fill="#1d1830" ${ink(1.4)}/><rect x="-16" y="-4" width="32" height="7" fill="#fbf5e6"/><text x="0" y="1.6" font-family="Comic Sans MS, cursive" font-size="5" fill="${P.tomato}" text-anchor="middle">${label}</text></g>`;
  return svg("-26 -34 52 44", `${tape(4, "NÃO APAGAR!", 2)}${tape(-7, "NOVELA", -3)}${tape(-18, "JOGO 94", 4)}`);
}

function bucketMop() {
  return svg("-26 -96 52 100", `<path d="M10 -92 L-2 -20" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M10 -92 L-2 -20" stroke="#c08a5e" stroke-width="3" stroke-linecap="round"/><path d="M-20 -22 L20 -22 L16 0 L-16 0 Z" fill="${P.sky}" ${ink(2.4)}/><ellipse cx="0" cy="-22" rx="20" ry="5" fill="#2f86c9" ${ink(2)}/><path d="M-14 -20 Q-6 -34 2 -22 Q8 -34 14 -20" fill="#e9e2ff" ${ink(1.6)}/><path d="M-20 -14 Q0 -28 20 -14" fill="none" ${ink(1.8)}/><path d="M-16 -8 L16 -8" stroke="#a9dcf7" stroke-width="2"/>`);
}

function pawPrints(w: number, h: number) {
  let p = "";
  const n = Math.max(3, Math.round(w / 34));
  for (let i = 0; i < n; i += 1) {
    const x = 14 + (i * (w - 28)) / (n - 1);
    const y = h / 2 + (i % 2 ? -h * 0.22 : h * 0.22) + Math.sin(i) * 4;
    const a = rnd(i * 3) * 20 - 10 + 90;
    p += `<g transform="translate(${x} ${y}) rotate(${a})" opacity="${0.75 - (i / n) * 0.4}"><ellipse cx="0" cy="3" rx="5" ry="4.2" fill="#7a2c24"/><circle cx="-5" cy="-3" r="2" fill="#7a2c24"/><circle cx="-1.6" cy="-5.6" r="2" fill="#7a2c24"/><circle cx="2.2" cy="-5.6" r="2" fill="#7a2c24"/><circle cx="5.4" cy="-3" r="2" fill="#7a2c24"/></g>`;
  }
  return svg(`0 0 ${w} ${h}`, p);
}

function catBowl() {
  return svg("-34 -22 68 40", `<g transform="scale(1.55)"><ellipse cx="0" cy="8" rx="20" ry="5" fill="#000" opacity="0.3"/><path d="M-16 -2 Q-18 8 -6 9 L6 9 Q18 8 16 -2 Z" fill="#a58fd8" ${ink(2)}/><ellipse cx="0" cy="-2" rx="16" ry="5" fill="#cbbaf0" ${ink(2)}/><ellipse cx="0" cy="-2" rx="11" ry="3" fill="#c98a4a"/><path d="M10 4 L16 0 L16 8 Z" fill="#cbbaf0" ${ink(1.2)}/><circle cx="-9" cy="3" r="1.2" fill="${INK}"/><text x="0" y="6.5" font-family="Arial Black, sans-serif" font-size="4.6" fill="#fbf5e6" text-anchor="middle">PIXEL</text></g>`);
}

function toyMouse() {
  return svg("-16 -10 32 20", `<path d="M8 2 Q16 4 14 -4" fill="none" stroke="#f06ba8" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="0" cy="2" rx="9" ry="5.5" fill="#9aa6b8" ${ink(1.6)}/><circle cx="-6" cy="-3" r="3" fill="#9aa6b8" ${ink(1.2)}/><circle cx="-6" cy="-3" r="1.4" fill="#f9b6d4"/><circle cx="-9" cy="2" r="1" fill="${INK}"/>`);
}

function hangingFern() {
  let fronds = "";
  for (let i = 0; i < 11; i += 1) {
    const a = Math.PI * (0.05 + (i / 10) * 0.9);
    const len = 30 + (i % 3) * 8;
    const ex = Math.cos(a) * len * 1.1;
    const ey = 30 + Math.sin(a) * len;
    fronds += `<path d="M0 30 Q${ex * 0.6} ${30 + (ey - 30) * 0.2} ${ex} ${ey}" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M0 30 Q${ex * 0.6} ${30 + (ey - 30) * 0.2} ${ex} ${ey}" stroke="${i % 2 ? "#4c9a43" : "#6cbb5c"}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
  return svg("-46 -4 92 84", `<path d="M0 0 L-14 22 M0 0 L14 22 M0 0 L0 22" stroke="#c9a17a" stroke-width="1.6"/><path d="M-16 22 L16 22 L12 36 L-12 36 Z" fill="#c0703f" ${ink(2)}/>${fronds}`);
}

function spill() {
  return svg("-34 -20 68 40", `<path d="M-30 6 Q-26 -8 -6 -6 Q8 -14 22 -4 Q34 4 22 12 Q4 18 -14 14 Q-32 16 -30 6 Z" fill="#7fc8e8" opacity="0.55"/><path d="M-20 0 Q-10 -4 0 0" stroke="#fff" stroke-width="2" opacity="0.6" fill="none"/>
    <g transform="rotate(70 8 0)"><path d="M0 -10 L16 -10 L14 10 L2 10 Z" fill="#63d6c1" ${ink(1.8)}/><ellipse cx="8" cy="-10" rx="8" ry="3" fill="#63d6c1" ${ink(1.6)}/></g>
    <circle cx="-18" cy="-2" r="4.5" fill="#f06ba8" ${ink(1.4)}/><circle cx="-18" cy="-2" r="1.6" fill="#ffc83d"/><path d="M-14 0 L-4 4" stroke="#4c9a43" stroke-width="2"/>
    <path d="M24 10 l5 -3 l1 5 Z M-26 10 l4 2 l-3 3 Z" fill="#63d6c1" ${ink(1)}/>`);
}

function yarnBall() {
  return svg("-30 -14 60 26", `<path d="M6 2 Q18 10 26 2 Q20 -6 28 -10" fill="none" stroke="#f06ba8" stroke-width="2" stroke-linecap="round"/><circle cx="-2" cy="0" r="9" fill="#f06ba8" ${ink(1.8)}/><path d="M-9 -4 Q-2 -10 6 -2 M-10 2 Q-2 -4 7 4 M-6 7 Q0 2 6 7" fill="none" stroke="#f9b6d4" stroke-width="1.6"/>`);
}

function ovalRug(w: number, h: number, color: string, light: string) {
  let tassels = "";
  const n = Math.round((w + h) / 14);
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const x = w / 2 + Math.cos(a) * (w / 2 + 2);
    const y = h / 2 + Math.sin(a) * (h / 2 + 2);
    tassels += `<path d="M${x} ${y} L${w / 2 + Math.cos(a) * (w / 2 + 8)} ${h / 2 + Math.sin(a) * (h / 2 + 8)}" stroke="#f6e7c4" stroke-width="2" stroke-linecap="round"/>`;
  }
  let motif = "";
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    const x = w / 2 + Math.cos(a) * w * 0.3;
    const y = h / 2 + Math.sin(a) * h * 0.3;
    motif += `<path d="M${x} ${y - 7} L${x + 7} ${y} L${x} ${y + 7} L${x - 7} ${y} Z" fill="${light}" opacity="0.7"/>`;
  }
  return svg(`-12 -12 ${w + 24} ${h + 24}`, `${tassels}<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${color}" ${ink(2.6)}/><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 12}" ry="${h / 2 - 12}" fill="none" stroke="${light}" stroke-width="4" opacity="0.8"/><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 22}" ry="${h / 2 - 22}" fill="none" stroke="${light}" stroke-width="2" stroke-dasharray="8 6" opacity="0.6"/>${motif}<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.14}" ry="${h * 0.14}" fill="${light}" opacity="0.45"/>`);
}

function frond(bx: number, by: number, tx: number, ty: number, bend: number, leaflets: number, size: number, shade: string) {
  const mx = (bx + tx) / 2;
  const my = (by + ty) / 2;
  const len = Math.hypot(tx - bx, ty - by);
  const nx = -(ty - by) / len;
  const ny = (tx - bx) / len;
  const cx = mx + nx * bend;
  const cy = my + ny * bend;
  const at = (t: number) => ({ x: (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * cx + t * t * tx, y: (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cy + t * t * ty });
  const tangent = (t: number) => {
    const dx = 2 * (1 - t) * (cx - bx) + 2 * t * (tx - cx);
    const dy = 2 * (1 - t) * (cy - by) + 2 * t * (ty - cy);
    const l = Math.hypot(dx, dy);
    return { x: dx / l, y: dy / l };
  };
  let leaves = "";
  for (let i = 1; i <= leaflets; i += 1) {
    const t = 0.18 + (i / (leaflets + 1)) * 0.8;
    const p = at(t);
    const d = tangent(t);
    const L = size * (1 - t * 0.55);
    for (const side of [-1, 1]) {
      const ex = p.x + (d.x * 0.55 + -d.y * side * 0.85) * L;
      const ey = p.y + (d.y * 0.55 + d.x * side * 0.85) * L + L * 0.18;
      const lx = (p.x + ex) / 2;
      const ly = (p.y + ey) / 2;
      const ll = Math.hypot(ex - p.x, ey - p.y);
      const wx = (-(ey - p.y) / ll) * L * 0.22;
      const wy = ((ex - p.x) / ll) * L * 0.22;
      leaves += `<path d="M${p.x.toFixed(1)} ${p.y.toFixed(1)} Q${(lx + wx).toFixed(1)} ${(ly + wy).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} Q${(lx - wx).toFixed(1)} ${(ly - wy).toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)} Z" fill="${(i + side) % 3 === 0 ? "#6cc35d" : shade}" ${ink(1.6)}/>`;
    }
  }
  const stem = `M${bx} ${by} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${tx} ${ty}`;
  return `<path d="${stem}" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/><path d="${stem}" fill="none" stroke="#5a9a3e" stroke-width="2.4" stroke-linecap="round"/>${leaves}`;
}

function basketPot() {
  let weave = "";
  for (let i = 0; i < 6; i += 1) weave += `<path d="M${33 + i * 7} 70 L${35 + i * 6} 94" stroke="#a8774f" stroke-width="1.6" opacity="0.8"/>`;
  for (let j = 0; j < 3; j += 1) weave += `<path d="M${32 + j} ${76 + j * 6} Q50 ${79 + j * 6} ${68 - j} ${76 + j * 6}" fill="none" stroke="#e9c48f" stroke-width="2" opacity="0.8"/>`;
  return `<path d="M26 68 L74 68 L68 96 Q50 100 32 96 Z" fill="#c99a62" ${ink(2.6)}/>${weave}<rect x="23" y="63" width="54" height="10" rx="4" fill="#d9b07a" ${ink(2.4)}/>`;
}

export function plantHides() {
  const back = [
    frond(50, 64, -10, 0, 14, 5, 24, "#4c9a43"),
    frond(50, 64, 110, 0, -14, 5, 24, "#4c9a43"),
    frond(50, 64, 6, -46, 10, 5, 24, "#57a84c"),
    frond(50, 64, 94, -46, -10, 5, 24, "#57a84c"),
    frond(50, 64, 44, -70, 6, 5, 22, "#5fb354"),
  ].join("");
  const front = [
    frond(50, 70, 10, 16, 8, 4, 19, "#4c9a43"),
    frond(50, 70, 90, 16, -8, 4, 19, "#4c9a43"),
    frond(50, 70, -6, 46, 10, 3, 20, "#57a84c"),
    frond(50, 70, 106, 46, -10, 3, 20, "#57a84c"),
    frond(50, 70, 22, 30, 6, 4, 20, "#57a84c"),
    frond(50, 70, 78, 30, -6, 4, 20, "#57a84c"),
    frond(50, 70, 38, 20, 3, 3, 16, "#5fb354"),
    frond(50, 70, 62, 20, -3, 3, 16, "#5fb354"),
  ].join("");
  return {
    "hide-plant-back": svg("-34 -90 168 190", `<ellipse cx="50" cy="94" rx="34" ry="8" fill="#000" opacity="0.3"/>${back}`),
    "hide-plant-front": svg("-30 -4 160 106", `${front}${basketPot()}`),
  };
}

export function ovalArt(w: number, h: number, v: number) {
  return v === 0x9a6a72 ? ovalRug(w, h, "#9a6a72", "#f9b6d4") : ovalRug(w, h, "#3f7a8c", "#a9dcf7");
}

export const PET_KINDS = new Set(["clothesline", "laundryShelf", "namePlate", "dogBowls", "leash", "ironingBoard", "boneToy", "tennisBall", "catTree", "ovalMirror", "crookedFrame", "pennant", "turntable", "popcorn", "popcornBowl", "remote", "scarf", "poster404", "vhsStack", "bucketMop", "pawPrints", "catBowl", "toyMouse", "hangingFern", "spill", "yarnBall"]);

export function petDecor(kind: string, w: number, h: number): string | null {
  switch (kind) {
    case "clothesline":
      return clothesline(w, h);
    case "laundryShelf":
      return laundryShelf(w, h);
    case "namePlate":
      return namePlate();
    case "dogBowls":
      return dogBowls();
    case "leash":
      return leash();
    case "ironingBoard":
      return ironingBoard();
    case "boneToy":
      return boneToy();
    case "tennisBall":
      return tennisBall();
    case "catTree":
      return catTree();
    case "ovalMirror":
      return ovalMirror();
    case "crookedFrame":
      return crookedFrame();
    case "pennant":
      return pennant();
    case "turntable":
      return turntable();
    case "popcorn":
      return popcorn();
    case "popcornBowl":
      return popcornBowl();
    case "remote":
      return remote();
    case "scarf":
      return scarf();
    case "poster404":
      return poster404();
    case "vhsStack":
      return vhsStack();
    case "bucketMop":
      return bucketMop();
    case "pawPrints":
      return pawPrints(w, h);
    case "catBowl":
      return catBowl();
    case "toyMouse":
      return toyMouse();
    case "hangingFern":
      return hangingFern();
    case "spill":
      return spill();
    case "yarnBall":
      return yarnBall();
    default:
      return null;
  }
}
