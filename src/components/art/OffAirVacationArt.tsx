import type React from "react";
import { Bigodes, Marisa } from "@/components/characters/ResortFolks";
import { P } from "@/lib/palette";
import { DecoFigure, type DecoFace, type DecoPose } from "./DecoFigure";

const display = { fontFamily: "var(--font-luckiest)" };
const ART = "/assets/off-air-vacation";
const SAND = "#f3d38f";
const SAND_WET = "#e6bf75";

const C = {
  wall: "#ffb36b",
  wallShade: "#f39b6d",
  plinth: "#e0784d",
  shutter: "#2fb5a8",
  pave: "#f4dcb4",
  paveStone: "#e9c79a",
  paveJoint: "#dcc092",
  lobby: "#e8a25f",
  lobbyLight: "#f0b876",
  floorA: "#f4dcb4",
  floorB: "#e9c79a",
  counterTop: "#e3a874",
  counterPanel: "#9c5f37",
  table: "#c97a4a",
  tableGrain: "#b06c3f",
  tableEdge: "#e3a874",
  water: P.mint,
  waterDeep: P.mintDeep,
  chrome: "#c9d0de",
};

type Pt = { x: number; y: number };

function f(n: number) {
  return Number(n.toFixed(2));
}

function Sprite({ name, x, bottom, h, w0, h0, flip = false, rotate = 0, opacity }: { name: string; x: number; bottom: number; h: number; w0: number; h0: number; flip?: boolean; rotate?: number; opacity?: number }) {
  const w = (h * w0) / h0;
  const t = [flip ? `translate(${2 * x} 0) scale(-1 1)` : "", rotate ? `rotate(${rotate} ${x} ${bottom - h / 2})` : ""].join(" ").trim();
  return (
    <g transform={t || undefined} opacity={opacity}>
      <image href={`${ART}/${name}.svg`} x={x - w / 2} y={bottom - h} width={w} height={h} />
    </g>
  );
}

function Shadow({ x, y, rx, ry, opacity = 0.22 }: { x: number; y: number; rx: number; ry: number; opacity?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={P.ink} opacity={opacity} />;
}

function Deco({ pose, face, x, feet, h, tilt, squash = 0.25 }: { pose: DecoPose; face: DecoFace; x: number; feet: number; h: number; tilt?: number; squash?: number }) {
  const rx = h * 0.24;
  return (
    <g>
      <Shadow x={x - h * 0.04} y={feet - h * 0.004} rx={rx} ry={rx * squash} />
      <DecoFigure pose={pose} face={face} x={x} feet={feet} h={h} tilt={tilt} />
    </g>
  );
}

function Cat({ x, line, s, gaze = -7, base = 214 }: { x: number; line: number; s: number; gaze?: number; base?: number }) {
  return (
    <g transform={`translate(${x} ${line}) scale(${s}) translate(-120 ${-base})`}>
      <Bigodes mood="normal" gaze={gaze} />
    </g>
  );
}

function Gull({ x, feet, h }: { x: number; feet: number; h: number }) {
  const s = h / 224;
  return (
    <g>
      <Shadow x={x} y={feet} rx={h * 0.22} ry={h * 0.04} />
      <g transform={`translate(${x} ${feet}) scale(${s}) translate(-100 -226)`}>
        <Marisa mood="normal" />
      </g>
    </g>
  );
}

function polar(cx: number, cy: number, deg: number, len: number): Pt {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + Math.cos(a) * len, y: cy + Math.sin(a) * len };
}

function handPath(cx: number, cy: number, deg: number, len: number) {
  const p = polar(cx, cy, deg, len);
  return `M${cx} ${cy} L${f(p.x)} ${f(p.y)}`;
}

function taperedHand(cx: number, cy: number, deg: number, len: number, width: number) {
  const tip = polar(cx, cy, deg, len);
  const l = polar(cx, cy, deg - 90, width / 2);
  const r = polar(cx, cy, deg + 90, width / 2);
  const tail = polar(cx, cy, deg + 180, width * 0.6);
  return `M${f(l.x)} ${f(l.y)} L${f(tip.x)} ${f(tip.y)} L${f(r.x)} ${f(r.y)} L${f(tail.x)} ${f(tail.y)} Z`;
}

function StoppedClock({ cx, cy, r, sw }: { cx: number; cy: number; r: number; sw: number }) {
  const second = 228;
  const tip = polar(cx, cy, second, r * 0.84);
  const tail = polar(cx, cy, second + 180, r * 0.22);
  const near = polar(cx, cy, second - 14, r * 0.72);
  const far = polar(cx, cy, second - 24, r * 0.66);
  return (
    <g>
      <circle cx={cx + sw * 0.5} cy={cy + sw * 0.9} r={r * 1.24} fill={P.ink} opacity="0.18" />
      <circle cx={cx} cy={cy} r={r * 1.22} fill={P.wood} stroke={P.ink} strokeWidth={sw} />
      <path d={`M${f(cx - r * 0.98)} ${f(cy - r * 0.42)} A${r * 1.08} ${r * 1.08} 0 0 1 ${f(cx + r * 0.42)} ${f(cy - r * 1.02)}`} fill="none" stroke="#d08c58" strokeWidth={sw * 0.6} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill={P.paper} stroke={P.ink} strokeWidth={sw * 0.7} />
      {Array.from({ length: 12 }, (_, i) => {
        const major = i % 3 === 0;
        const a = polar(cx, cy, i * 30, r * (major ? 0.66 : 0.76));
        const b = polar(cx, cy, i * 30, r * 0.86);
        return <path key={i} d={`M${f(a.x)} ${f(a.y)} L${f(b.x)} ${f(b.y)}`} stroke={P.ink} strokeWidth={sw * (major ? 0.55 : 0.32)} strokeLinecap="round" />;
      })}
      <path d={taperedHand(cx, cy, 122, r * 0.5, r * 0.2)} fill={P.ink} stroke={P.ink} strokeWidth={sw * 0.25} strokeLinejoin="round" />
      <path d={taperedHand(cx, cy, 24, r * 0.78, r * 0.15)} fill={P.ink} stroke={P.ink} strokeWidth={sw * 0.25} strokeLinejoin="round" />
      <path d={`M${f(tail.x)} ${f(tail.y)} L${f(tip.x)} ${f(tip.y)}`} stroke={P.tomato} strokeWidth={sw * 0.32} strokeLinecap="round" />
      <path d={`M${f(near.x)} ${f(near.y)} l${f(-r * 0.04)} ${f(r * 0.12)} M${f(far.x)} ${f(far.y)} l${f(-r * 0.03)} ${f(r * 0.09)}`} stroke={P.tomato} strokeWidth={sw * 0.24} strokeLinecap="round" opacity="0.75" />
      <circle cx={cx} cy={cy} r={r * 0.12} fill={P.tomato} stroke={P.ink} strokeWidth={sw * 0.25} />
    </g>
  );
}

function StaticScreen({ x, y, w, h, sw }: { x: number; y: number; w: number; h: number; sw: number }) {
  const dots = [];
  const rows = 6;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const k = (r * 5 + c * 3) % 7;
      const dw = w * (0.14 + (k % 3) * 0.08);
      const dx = ((c * 0.33 + ((r * 37) % 10) * 0.029) % 0.8) * w;
      dots.push(<rect key={`${r}-${c}`} x={x + dx} y={y + h * 0.08 + (r * h * 0.86) / rows} width={Math.min(dw, w - dx)} height={h * 0.08} rx={h * 0.03} fill={k % 2 ? P.ink : P.white} opacity={k % 2 ? 0.45 : 1} />);
    }
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={sw} fill="#c9d0de" />
      {dots}
      <rect x={x} y={y + h * 0.56} width={w} height={h * 0.16} fill={P.white} opacity="0.55" />
      <rect x={x} y={y} width={w} height={h} rx={sw} fill="none" stroke={P.ink} strokeWidth={sw * 0.8} />
    </g>
  );
}

function OldTv({ x, bottom, w, sw }: { x: number; bottom: number; w: number; sw: number }) {
  const h = w * 0.8;
  const cab = w * 1.05;
  const top = bottom - cab - h;
  const left = x - w / 2;
  return (
    <g>
      <Shadow x={x + sw} y={bottom} rx={w * 0.62} ry={w * 0.1} />
      <path d={`M${x} ${top + 1} L${f(x - w * 0.3)} ${f(top - w * 0.4)} M${x} ${top + 1} L${f(x + w * 0.26)} ${f(top - w * 0.44)}`} stroke={P.ink} strokeWidth={sw * 0.7} strokeLinecap="round" />
      <circle cx={f(x - w * 0.3)} cy={f(top - w * 0.4)} r={sw * 0.9} fill={P.tomato} stroke={P.ink} strokeWidth={sw * 0.5} />
      <circle cx={f(x + w * 0.26)} cy={f(top - w * 0.44)} r={sw * 0.9} fill={P.tomato} stroke={P.ink} strokeWidth={sw * 0.5} />
      <rect x={left - w * 0.06} y={bottom - cab} width={w * 1.12} height={cab} rx={sw * 0.8} fill={P.wood} stroke={P.ink} strokeWidth={sw} />
      <path d={`M${x} ${f(bottom - cab * 0.84)} L${x} ${f(bottom - cab * 0.16)}`} stroke={P.woodDeep} strokeWidth={sw * 0.55} />
      <circle cx={f(x - w * 0.1)} cy={f(bottom - cab * 0.5)} r={sw * 0.45} fill={P.ink} />
      <circle cx={f(x + w * 0.1)} cy={f(bottom - cab * 0.5)} r={sw * 0.45} fill={P.ink} />
      <rect x={left} y={top} width={w} height={h} rx={sw * 1.6} fill={P.plum600} stroke={P.ink} strokeWidth={sw} />
      <StaticScreen x={left + w * 0.09} y={top + h * 0.13} w={w * 0.64} h={h * 0.74} sw={sw} />
      <circle cx={left + w * 0.86} cy={top + h * 0.3} r={w * 0.065} fill={P.sun} stroke={P.ink} strokeWidth={sw * 0.5} />
      <circle cx={left + w * 0.86} cy={top + h * 0.56} r={w * 0.065} fill={P.tomato} stroke={P.ink} strokeWidth={sw * 0.5} />
      <path d={`M${left + w * 0.8} ${top + h * 0.8} L${left + w * 0.92} ${top + h * 0.8}`} stroke={P.ink} strokeWidth={sw * 0.45} strokeLinecap="round" />
    </g>
  );
}

function Sparkle({ x, y, s }: { x: number; y: number; s: number }) {
  const star = (k: number) => `M0 ${-k} L${k * 0.24} ${-k * 0.24} L${k} 0 L${k * 0.24} ${k * 0.24} L0 ${k} L${-k * 0.24} ${k * 0.24} L${-k} 0 L${-k * 0.24} ${-k * 0.24} Z`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={s * 1.5} fill={P.sunPale} opacity="0.55" />
      <path d={star(s)} fill={P.white} stroke={P.ink} strokeWidth={s * 0.16} strokeLinejoin="round" />
      <path d={star(s * 0.42)} transform={`translate(${s * 1.15} ${s * 0.9})`} fill={P.white} stroke={P.ink} strokeWidth={s * 0.12} strokeLinejoin="round" />
    </g>
  );
}

function Bang({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x + r * 0.16} cy={y + r * 0.22} r={r} fill={P.ink} />
      <circle cx={x} cy={y} r={r} fill={P.sun} stroke={P.ink} strokeWidth={r * 0.2} />
      <text x={x} y={y + r * 0.5} textAnchor="middle" fontSize={r * 1.45} fill={P.ink} style={display}>
        !
      </text>
    </g>
  );
}

function KeyPrompt({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="0" y="0" width="30" height="14" rx="7" fill={P.ink} opacity="0.92" />
      <rect x="2.5" y="2" width="10" height="10" rx="2.5" fill={P.sun} stroke={P.ink} strokeWidth="1.2" />
      <text x="7.5" y="10.6" textAnchor="middle" fontSize="8.4" fill={P.ink} style={display}>
        E
      </text>
      <g fill={P.cream}>
        <circle cx="17" cy="7" r="1.4" />
        <circle cx="21.5" cy="7" r="1.4" />
        <circle cx="26" cy="7" r="1.4" />
      </g>
    </g>
  );
}

function Window({ x, y, w, h, sw, box = true }: { x: number; y: number; w: number; h: number; sw: number; box?: boolean }) {
  const sh = w * 0.32;
  const louvers = [0.2, 0.35, 0.5, 0.65, 0.8];
  return (
    <g>
      <rect x={x - sh - sw * 0.6} y={y - h * 0.14} width={w + sh * 2 + sw * 1.2} height={h * 0.14} rx={sw * 0.4} fill={P.paper} stroke={P.ink} strokeWidth={sw * 0.75} />
      {[x - sh, x + w].map((sx) => (
        <g key={sx}>
          <rect x={sx} y={y} width={sh} height={h} fill={C.shutter} stroke={P.ink} strokeWidth={sw * 0.85} />
          <path d={louvers.map((k) => `M${f(sx + sh * 0.18)} ${f(y + h * k)} L${f(sx + sh * 0.82)} ${f(y + h * k)}`).join(" ")} stroke={P.mintDeep} strokeWidth={sw * 0.55} strokeLinecap="round" />
        </g>
      ))}
      <rect x={x} y={y} width={w} height={h} fill={P.skyPale} stroke={P.ink} strokeWidth={sw} />
      <path d={`M${x} ${f(y + h * 0.62)} L${f(x + w * 0.62)} ${y} L${f(x + w * 0.84)} ${y} L${x} ${f(y + h * 0.86)} Z`} fill={P.white} opacity="0.55" />
      <path d={`M${f(x + w / 2)} ${y} L${f(x + w / 2)} ${y + h} M${x} ${f(y + h * 0.42)} L${x + w} ${f(y + h * 0.42)}`} stroke={P.paper} strokeWidth={sw * 0.9} />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={P.ink} strokeWidth={sw} />
      <rect x={x - sw * 1.2} y={y + h} width={w + sw * 2.4} height={h * 0.1} rx={sw * 0.4} fill={P.paper} stroke={P.ink} strokeWidth={sw * 0.75} />
      {box && (
        <g>
          {[0.08, 0.3, 0.52, 0.74, 0.94].map((k) => (
            <ellipse key={k} cx={f(x + w * k)} cy={f(y + h * 1.13)} rx={h * 0.09} ry={h * 0.06} fill={P.leaf} stroke={P.ink} strokeWidth={sw * 0.4} />
          ))}
          {[0.2, 0.5, 0.82].map((k, i) => (
            <circle key={k} cx={f(x + w * k)} cy={f(y + h * 1.08)} r={h * 0.065} fill={i === 1 ? P.sun : P.bubblegum} stroke={P.ink} strokeWidth={sw * 0.4} />
          ))}
          <rect x={x - sw * 0.6} y={y + h * 1.14} width={w + sw * 1.2} height={h * 0.18} rx={sw * 0.4} fill={P.wood} stroke={P.ink} strokeWidth={sw * 0.75} />
        </g>
      )}
    </g>
  );
}

function WaveLines({ y, from, to, gap = 30, size = 10, color = P.white }: { y: number; from: number; to: number; gap?: number; size?: number; color?: string }) {
  const parts = [];
  for (let x = from; x < to; x += gap) parts.push(<path key={x} d={`M${x} ${y} q${size / 4} ${-size / 5} ${size / 2} 0 q${size / 4} ${size / 5} ${size / 2} 0`} fill="none" stroke={color} strokeWidth={size / 5} strokeLinecap="round" opacity="0.8" />);
  return <g>{parts}</g>;
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g fill={P.white} opacity="0.95" transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="20" ry="7" />
      <ellipse cx="-8" cy="-5" rx="10" ry="7" />
      <ellipse cx="6" cy="-7" rx="11" ry="8" />
    </g>
  );
}

function ResortSign({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const bulbs: Pt[] = [];
  const nx = 12;
  for (let i = 0; i < nx; i += 1) {
    const bx = x + 6 + (i * (w - 12)) / (nx - 1);
    bulbs.push({ x: bx, y: y + 3.4 }, { x: bx, y: y + h - 3.4 });
  }
  bulbs.push({ x: x + 3.4, y: y + h / 2 }, { x: x + w - 3.4, y: y + h / 2 });
  return (
    <g>
      <path d={`M${x + 18} ${y + h} L${x + 18} ${y + h + 9} M${x + w - 18} ${y + h} L${x + w - 18} ${y + h + 9}`} stroke={P.ink} strokeWidth="3.6" strokeLinecap="round" />
      <path d={`M${x + 18} ${y + h} L${x + 18} ${y + h + 9} M${x + w - 18} ${y + h} L${x + w - 18} ${y + h + 9}`} stroke={P.plum600} strokeWidth="1.4" strokeLinecap="round" />
      <rect x={x + 2.5} y={y + 3} width={w} height={h} rx="6" fill={P.ink} />
      <rect x={x} y={y} width={w} height={h} rx="6" fill={P.plum800} stroke={P.ink} strokeWidth="3" />
      <rect x={x + 6.5} y={y + 6.5} width={w - 13} height={h - 13} rx="3" fill="none" stroke={P.sun} strokeWidth="0.9" opacity="0.45" />
      {bulbs.map((b, i) => (
        <circle key={i} cx={f(b.x)} cy={b.y} r="1.6" fill={i === 15 ? P.plum600 : P.sunPale} />
      ))}
      <text x={x + w / 2} y={y + h / 2 + 5.6} textAnchor="middle" fontSize="15.5" fill={P.sun} stroke={P.ink} strokeWidth="1.1" paintOrder="stroke" style={display} letterSpacing="1">
        RESORT 404
      </text>
    </g>
  );
}

function Awning({ x, y, w, h, sw }: { x: number; y: number; w: number; h: number; sw: number }) {
  const n = 8;
  const step = w / n;
  const flare = step / 2;
  const at = (i: number, yy: number) => x + i * step + ((yy - y) / h) * ((i * step - w / 2) / (w / 2)) * flare;
  const stripes = [];
  for (let i = 0; i < n; i += 2) stripes.push(<path key={i} d={`M${f(at(i, y))} ${y} L${f(at(i + 1, y))} ${y} L${f(at(i + 1, y + h))} ${y + h} L${f(at(i, y + h))} ${y + h} Z`} fill={P.mint} />);
  const scallop = [];
  for (let i = 0; i < n; i += 1) {
    const a = at(i, y + h);
    const b = at(i + 1, y + h);
    scallop.push(<path key={i} d={`M${f(a)} ${y + h} Q${f((a + b) / 2)} ${f(y + h + h * 0.55)} ${f(b)} ${y + h} Z`} fill={i % 2 ? P.white : P.mint} stroke={P.ink} strokeWidth={sw * 0.75} strokeLinejoin="round" />);
  }
  const outline = `M${x} ${y} L${x + w} ${y} L${f(at(n, y + h))} ${y + h} L${f(at(0, y + h))} ${y + h} Z`;
  return (
    <g>
      <path d={outline} fill={P.white} />
      {stripes}
      {scallop}
      <path d={outline} fill="none" stroke={P.ink} strokeWidth={sw} strokeLinejoin="round" />
      <rect x={x - sw} y={y - sw * 1.2} width={w + sw * 2} height={sw * 1.6} rx={sw * 0.8} fill={P.plum700} stroke={P.ink} strokeWidth={sw * 0.6} />
    </g>
  );
}

function Pool({ x, y, w, h, sw }: { x: number; y: number; w: number; h: number; sw: number }) {
  const lip = h * 0.2;
  const ix = x + lip;
  const iw = w - lip * 2;
  const iy = y + lip * 0.75;
  const ih = h - lip * 1.5;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={lip} fill={P.paper} stroke={P.ink} strokeWidth={sw} />
      <rect x={ix} y={iy} width={iw} height={ih} rx={lip * 0.5} fill={C.water} stroke={P.ink} strokeWidth={sw * 0.7} />
      <path d={`M${ix + sw * 0.35} ${iy + ih * 0.3} L${ix + iw - sw * 0.35} ${iy + ih * 0.3}`} stroke={C.waterDeep} strokeWidth={ih * 0.12} opacity="0.5" />
      <rect x={ix} y={iy} width={iw} height={ih * 0.24} rx={lip * 0.4} fill={C.waterDeep} opacity="0.6" />
      <WaveLines y={iy + ih * 0.66} from={ix + iw * 0.06} to={ix + iw * 0.8} gap={iw / 4.2} size={iw / 10} />
      <g fill="none" strokeLinecap="round">
        <path d={`M${f(ix + iw * 0.86)} ${f(y - h * 0.3)} L${f(ix + iw * 0.86)} ${f(iy + ih * 0.6)} M${f(ix + iw * 0.94)} ${f(y - h * 0.3)} L${f(ix + iw * 0.94)} ${f(iy + ih * 0.6)}`} stroke={P.ink} strokeWidth={sw * 1.5} />
        <path d={`M${f(ix + iw * 0.86)} ${f(y - h * 0.3)} L${f(ix + iw * 0.86)} ${f(iy + ih * 0.6)} M${f(ix + iw * 0.94)} ${f(y - h * 0.3)} L${f(ix + iw * 0.94)} ${f(iy + ih * 0.6)}`} stroke={C.chrome} strokeWidth={sw * 0.6} />
      </g>
    </g>
  );
}

function CounterBox({ x, base, w, h, vp, depth, sw }: { x: number; base: number; w: number; h: number; vp: Pt; depth: number; sw: number }) {
  const back = (p: Pt): Pt => ({ x: p.x + (vp.x - p.x) * depth, y: p.y + (vp.y - p.y) * depth });
  const flt = { x, y: base - h };
  const frt = { x: x + w, y: base - h };
  const flb = { x, y: base };
  const blt = back(flt);
  const brt = back(frt);
  const blb = back(flb);
  const pt = (p: Pt) => `${f(p.x)} ${f(p.y)}`;
  const slab = h * 0.14;
  const panels = Math.max(2, Math.round(w / (h * 1.25)));
  const gap = sw * 2;
  const pw = (w - gap * (panels + 1)) / panels;
  return (
    <g>
      <path d={`M${x - sw} ${base + sw * 0.6} L${x + w + sw} ${base + sw * 0.6}`} stroke={P.ink} strokeWidth={sw * 2.4} opacity="0.16" />
      {x > vp.x && <path d={`M${pt(flt)} L${pt(blt)} L${pt(blb)} L${pt(flb)} Z`} fill={P.woodDeep} stroke={P.ink} strokeWidth={sw} strokeLinejoin="round" />}
      <rect x={x} y={base - h} width={w} height={h} fill={P.wood} stroke={P.ink} strokeWidth={sw} />
      <rect x={x} y={base - h + slab} width={w} height={h * 0.13} fill={P.mint} stroke={P.ink} strokeWidth={sw * 0.6} />
      {Array.from({ length: panels }, (_, i) => (
        <rect key={i} x={f(x + gap + i * (pw + gap))} y={f(base - h + slab + h * 0.22)} width={f(pw)} height={f(h * 0.5)} rx={sw * 0.8} fill={C.counterPanel} stroke={P.ink} strokeWidth={sw * 0.65} />
      ))}
      <rect x={x} y={base - h * 0.1} width={w} height={h * 0.1} fill={P.woodDark} />
      <rect x={x} y={base - h} width={w} height={h} fill="none" stroke={P.ink} strokeWidth={sw} />
      <path d={`M${pt(flt)} L${pt(blt)} L${pt(brt)} L${pt(frt)} Z`} fill={C.counterTop} stroke={P.ink} strokeWidth={sw} strokeLinejoin="round" />
      <rect x={x - sw * 0.5} y={base - h} width={w + sw} height={slab} fill="#d39663" stroke={P.ink} strokeWidth={sw * 0.8} />
    </g>
  );
}

function Poster({ x, y, w, rotate = 0, sw }: { x: number; y: number; w: number; rotate?: number; sw: number }) {
  const h = w * 1.3;
  return (
    <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x} y={y} width={w} height={h} rx={sw * 0.4} fill={P.paper} stroke={P.ink} strokeWidth={sw} />
      <rect x={x + w * 0.1} y={y + w * 0.1} width={w * 0.8} height={h * 0.56} fill={P.mint} stroke={P.ink} strokeWidth={sw * 0.5} />
      <circle cx={x + w / 2} cy={y + h * 0.36} r={w * 0.28} fill={P.paper} stroke={P.ink} strokeWidth={sw * 0.6} />
      <rect x={x + w * 0.32} y={y + h * 0.28} width={w * 0.36} height={w * 0.24} rx={sw * 0.5} fill={P.sky} stroke={P.ink} strokeWidth={sw * 0.5} />
      <path d={`M${x + w * 0.42} ${y + h * 0.27} L${x + w * 0.36} ${y + h * 0.2} M${x + w * 0.58} ${y + h * 0.27} L${x + w * 0.64} ${y + h * 0.2}`} stroke={P.ink} strokeWidth={sw * 0.45} strokeLinecap="round" />
      <rect x={x + w * 0.14} y={y + h * 0.73} width={w * 0.72} height={h * 0.08} rx={sw * 0.3} fill={P.tomato} />
      <rect x={x + w * 0.26} y={y + h * 0.85} width={w * 0.48} height={h * 0.05} rx={sw * 0.3} fill={P.plum500} opacity="0.7" />
      <path d={`M${x + w} ${y + h * 0.82} L${x + w * 0.8} ${y + h} L${x + w} ${y + h} Z`} fill={P.cream2} stroke={P.ink} strokeWidth={sw * 0.6} strokeLinejoin="round" />
    </g>
  );
}

function SignArrow({ x, y, w, dir, color, icon, sw }: { x: number; y: number; w: number; dir: 1 | -1; color: string; icon: "wave" | "bell"; sw: number }) {
  const h = w * 0.36;
  const tip = h * 0.5;
  const d = dir > 0 ? `M${x} ${y} L${x + w - tip} ${y} L${x + w} ${y + h / 2} L${x + w - tip} ${y + h} L${x} ${y + h} Z` : `M${x + w} ${y} L${x + tip} ${y} L${x} ${y + h / 2} L${x + tip} ${y + h} L${x + w} ${y + h} Z`;
  const cx = x + w / 2 + (dir > 0 ? -tip * 0.3 : tip * 0.3);
  const cy = y + h / 2;
  return (
    <g>
      <path d={d} transform={`translate(${sw * 0.6} ${sw * 0.7})`} fill={P.ink} />
      <path d={d} fill={color} stroke={P.ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={`M${dir > 0 ? x + sw * 1.4 : x + tip + sw * 0.6} ${y + h * 0.22} L${dir > 0 ? x + w - tip - sw * 0.6 : x + w - sw * 1.4} ${y + h * 0.22}`} stroke={P.white} strokeWidth={sw * 0.5} strokeLinecap="round" opacity="0.6" />
      {icon === "wave" ? (
        <path d={`M${cx - h * 0.9} ${cy + h * 0.06} q${h * 0.22} ${-h * 0.3} ${h * 0.45} 0 q${h * 0.22} ${h * 0.3} ${h * 0.45} 0 q${h * 0.22} ${-h * 0.3} ${h * 0.45} 0 q${h * 0.22} ${h * 0.3} ${h * 0.45} 0`} fill="none" stroke={P.ink} strokeWidth={sw * 0.8} strokeLinecap="round" />
      ) : (
        <g>
          <path d={`M${cx - h * 0.4} ${cy + h * 0.22} Q${cx - h * 0.4} ${cy - h * 0.3} ${cx} ${cy - h * 0.3} Q${cx + h * 0.4} ${cy - h * 0.3} ${cx + h * 0.4} ${cy + h * 0.22} Z`} fill={P.paper} stroke={P.ink} strokeWidth={sw * 0.6} strokeLinejoin="round" />
          <path d={`M${cx - h * 0.5} ${cy + h * 0.24} L${cx + h * 0.5} ${cy + h * 0.24}`} stroke={P.ink} strokeWidth={sw * 0.8} strokeLinecap="round" />
          <circle cx={cx} cy={cy - h * 0.36} r={h * 0.07} fill={P.ink} />
        </g>
      )}
    </g>
  );
}

function quad(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}

function quadTangent(a: Pt, c: Pt, b: Pt, t: number): Pt {
  return { x: 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x), y: 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y) };
}

function Palm({ x, y, h, lean, sw }: { x: number; y: number; h: number; lean: number; sw: number }) {
  const a = { x, y };
  const top = { x: x + lean, y: y - h * 0.7 };
  const c = { x: x + lean * 0.08, y: y - h * 0.4 };
  const left: Pt[] = [];
  const right: Pt[] = [];
  const rings: string[] = [];
  for (let i = 0; i <= 10; i += 1) {
    const t = i / 10;
    const p = quad(a, c, top, t);
    const d = quadTangent(a, c, top, t);
    const len = Math.hypot(d.x, d.y);
    const n = { x: -d.y / len, y: d.x / len };
    const w = h * (0.078 - 0.034 * t);
    left.push({ x: p.x + (n.x * w) / 2, y: p.y + (n.y * w) / 2 });
    right.push({ x: p.x - (n.x * w) / 2, y: p.y - (n.y * w) / 2 });
    if (i > 0 && i < 10) rings.push(`M${f(left[i].x)} ${f(left[i].y)} Q${f(p.x - d.y * 0.02)} ${f(p.y + h * 0.012)} ${f(right[i].x)} ${f(right[i].y)}`);
  }
  const trunk = `M${left.map((p) => `${f(p.x)} ${f(p.y)}`).join(" L")} L${right.reverse().map((p) => `${f(p.x)} ${f(p.y)}`).join(" L")} Z`;
  const frond = (deg: number, len: number, fill: string, rib: string, key: string) => {
    const r = (deg * Math.PI) / 180;
    const tip = { x: top.x + Math.cos(r) * len, y: top.y + Math.sin(r) * len * 0.75 + len * 0.32 };
    const ctrl = { x: top.x + Math.cos(r) * len * 0.55, y: top.y + Math.sin(r) * len * 0.55 - len * 0.2 };
    const upper: Pt[] = [];
    const lower: Pt[] = [];
    const steps = 10;
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const p = quad(top, ctrl, tip, t);
      const d = quadTangent(top, ctrl, tip, t);
      const l = Math.hypot(d.x, d.y);
      const n = { x: -d.y / l, y: d.x / l };
      const w = len * 0.13 * Math.pow(Math.sin(Math.PI * t), 0.8) * (1 - t * 0.25);
      upper.push({ x: p.x + n.x * w, y: p.y + n.y * w });
      const k = i % 2 ? 1 : 0.35;
      lower.push({ x: p.x - n.x * w * k, y: p.y - n.y * w * k });
    }
    const d = `M${f(top.x)} ${f(top.y)} L${upper.map((p) => `${f(p.x)} ${f(p.y)}`).join(" L")} L${f(tip.x)} ${f(tip.y)} L${lower.reverse().map((p) => `${f(p.x)} ${f(p.y)}`).join(" L")} Z`;
    return (
      <g key={key}>
        <path d={d} fill={fill} stroke={P.ink} strokeWidth={sw * 0.8} strokeLinejoin="round" />
        <path d={`M${f(top.x)} ${f(top.y)} Q${f(ctrl.x)} ${f(ctrl.y)} ${f(tip.x)} ${f(tip.y)}`} fill="none" stroke={rib} strokeWidth={sw * 0.55} strokeLinecap="round" />
      </g>
    );
  };
  const L = h * 0.36;
  return (
    <g>
      {[-150, -92, -36, 172, 8].map((deg, i) => frond(deg, L * (i % 2 ? 0.9 : 1), P.leafDeep, P.leaf, `b${deg}`))}
      <path d={trunk} fill={P.wood} stroke={P.ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={rings.join(" ")} fill="none" stroke={P.woodDeep} strokeWidth={sw * 0.6} strokeLinecap="round" />
      {[
        [-0.035, 0.04],
        [0.03, 0.045],
        [-0.002, 0.07],
      ].map(([dx, dy]) => (
        <circle key={`${dx}${dy}`} cx={f(top.x + dx * h)} cy={f(top.y + dy * h)} r={h * 0.036} fill={P.woodDark} stroke={P.ink} strokeWidth={sw * 0.7} />
      ))}
      {[-172, -122, -64, -12, 150, 32].map((deg, i) => frond(deg, L * (i % 2 ? 0.94 : 0.86), P.leaf, P.lime, `f${deg}`))}
    </g>
  );
}

function Umbrella({ x, bottom, h, sw, color = P.bubblegum }: { x: number; bottom: number; h: number; sw: number; color?: string }) {
  const W = h * 0.98;
  const apex = { x, y: bottom - h };
  const rimY = apex.y + h * 0.3;
  const n = 5;
  const e = Array.from({ length: n + 1 }, (_, i) => ({ x: x - W / 2 + (i * W) / n, y: rimY }));
  const sc = (i: number) => `Q${f((e[i].x + e[i + 1].x) / 2)} ${f(rimY + h * 0.07)} ${f(e[i + 1].x)} ${f(rimY)}`;
  const domeL = `C${f(x - W * 0.2)} ${f(apex.y)} ${f(x - W * 0.46)} ${f(apex.y + h * 0.05)} ${f(e[0].x)} ${f(rimY)}`;
  const domeR = `C${f(x + W * 0.46)} ${f(apex.y + h * 0.05)} ${f(x + W * 0.2)} ${f(apex.y)} ${f(apex.x)} ${f(apex.y)}`;
  const outline = `M${apex.x} ${f(apex.y)} ${domeL} ${Array.from({ length: n }, (_, i) => sc(i)).join(" ")} ${domeR} Z`;
  return (
    <g>
      <Shadow x={x} y={bottom} rx={W * 0.36} ry={W * 0.05} />
      <path d={`M${x} ${f(apex.y)} L${x} ${bottom}`} stroke={P.ink} strokeWidth={sw * 1.7} strokeLinecap="round" />
      <path d={`M${x} ${f(apex.y)} L${x} ${bottom}`} stroke={C.chrome} strokeWidth={sw * 0.6} strokeLinecap="round" />
      <path d={outline} fill={P.white} />
      <path d={`M${apex.x} ${f(apex.y)} ${domeL} ${sc(0)} Z`} fill={color} />
      <path d={`M${apex.x} ${f(apex.y)} L${f(e[2].x)} ${f(rimY)} ${sc(2)} Z`} fill={color} />
      <path d={`M${apex.x} ${f(apex.y)} L${f(e[4].x)} ${f(rimY)} ${sc(4)} ${domeR} Z`} fill={color} />
      <path d={outline} fill="none" stroke={P.ink} strokeWidth={sw} strokeLinejoin="round" />
      <circle cx={x} cy={f(apex.y - sw * 0.3)} r={sw * 0.9} fill={P.sun} stroke={P.ink} strokeWidth={sw * 0.5} />
    </g>
  );
}

function Lounge({ x, bottom, w, sw, color = P.mint }: { x: number; bottom: number; w: number; sw: number; color?: string }) {
  const x0 = x - w / 2;
  const x1 = x + w * 0.2;
  const xb = x + w / 2;
  const ys = bottom - w * 0.2;
  const yb = bottom - w * 0.52;
  const t = w * 0.08;
  const seat = `M${f(x0 + t / 2)} ${f(ys - t / 2)} L${f(x1)} ${f(ys - t / 2)} L${f(xb - t / 2)} ${f(yb)}`;
  return (
    <g>
      <Shadow x={x} y={bottom} rx={w * 0.52} ry={w * 0.06} />
      <path d={`M${f(x0 + w * 0.08)} ${f(ys)} L${f(x0 + w * 0.06)} ${bottom} M${f(x1 - w * 0.02)} ${f(ys)} L${f(x1)} ${bottom} M${f(xb - w * 0.14)} ${f(ys - w * 0.06)} L${f(xb - w * 0.06)} ${bottom}`} stroke={P.ink} strokeWidth={sw * 0.9} strokeLinecap="round" />
      <path d={seat} fill="none" stroke={P.ink} strokeWidth={t + sw * 1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={seat} fill="none" stroke={P.white} strokeWidth={t} strokeLinecap="round" strokeLinejoin="round" />
      <path d={seat} fill="none" stroke={color} strokeWidth={t} strokeLinejoin="round" strokeDasharray={`${f(w * 0.07)} ${f(w * 0.07)}`} />
    </g>
  );
}

function Tufts({ spots, color = P.limeDeep }: { spots: [number, number, number][]; color?: string }) {
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      {spots.map(([x, y, s]) => (
        <path key={`${x}-${y}`} d={`M${x - s} ${y} L${x - s * 0.4} ${y - s * 1.1} L${x} ${y} L${x + s * 0.5} ${y - s * 1.3} L${x + s} ${y}`} strokeWidth={Math.max(0.9, s * 0.32)} />
      ))}
    </g>
  );
}

function CoverPath() {
  const a = { x: 240, y: 172 };
  const c = { x: 214, y: 212 };
  const b = { x: 138, y: 244 };
  const width = (y: number) => 56 + ((y - 172) / 72) * 78;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= 16; i += 1) {
    const p = quad(a, c, b, i / 16);
    const w = width(p.y);
    left.push({ x: p.x - w / 2, y: p.y });
    right.push({ x: p.x + w / 2, y: p.y });
  }
  const pts = (arr: Pt[]) => arr.map((p) => `${f(p.x)} ${f(p.y)}`).join(" L");
  const stones = [0.1, 0.24, 0.38, 0.53, 0.68, 0.84, 0.98].map((t, i) => {
    const p = quad(a, c, b, t);
    const w = width(p.y);
    const u = (p.y - 100) * 0.909;
    const rx = u * 0.17;
    return { x: p.x + (i % 2 ? 0.2 : -0.2) * w, y: p.y, rx, ry: rx * ((p.y - 100) / 300) };
  });
  return (
    <g>
      <path d={`M${pts(left)} L${pts([...right].reverse())} Z`} fill={C.pave} />
      {stones.map((s) => (
        <g key={s.y}>
          <ellipse cx={f(s.x)} cy={f(s.y + s.ry * 0.35)} rx={f(s.rx)} ry={f(s.ry)} fill={P.ink} opacity="0.12" />
          <ellipse cx={f(s.x)} cy={f(s.y)} rx={f(s.rx)} ry={f(s.ry)} fill={C.paveStone} stroke={P.ink} strokeWidth="1.5" />
        </g>
      ))}
      <path d={`M${pts(left)}`} fill="none" stroke={P.ink} strokeWidth="2.4" strokeLinecap="round" />
      <path d={`M${pts(right)}`} fill="none" stroke={P.ink} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  );
}

function CoverBuilding() {
  return (
    <g>
      <path d="M140 39 L163 16 L336 16 L336 39 Z" fill={P.tomato} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M155 24 L336 24 M147 31.5 L336 31.5" stroke={P.tomatoDeep} strokeWidth="1.8" />
      {Array.from({ length: 19 }, (_, i) => (
        <path key={i} d={`M${166 + i * 9.5} 16.5 L${165 + i * 9.5} 24 M${160 + i * 9.5 + 4.5} 24 L${159 + i * 9.5 + 4.5} 31.5 M${151 + i * 9.8} 31.5 L${150 + i * 9.8} 38.5`} stroke={P.tomatoDeep} strokeWidth="1.3" />
      ))}
      <rect x="136" y="37" width="200" height="5" fill={P.paper} stroke={P.ink} strokeWidth="2.4" />
      <rect x="148" y="42" width="190" height="106" fill={C.wall} stroke={P.ink} strokeWidth="3" />
      <rect x="149.5" y="43.5" width="7" height="103" fill={C.wallShade} />
      <rect x="148" y="42" width="190" height="3" fill={P.ink} opacity="0.14" />
      <rect x="148" y="78" width="190" height="4.5" fill={P.paper} stroke={P.ink} strokeWidth="2" />
      <Window x={170} y={52} w={15} h={19} sw={2} />
      <Window x={302} y={52} w={15} h={19} sw={2} />
      <StoppedClock cx={240} cy={61} r={8.6} sw={2.2} />
      <Window x={164} y={102} w={15} h={21} sw={2} box={false} />
      <Window x={304} y={102} w={15} h={21} sw={2} />
      <path d="M212 148 L212 104 Q240 90 268 104 L268 148 Z" fill={P.paper} stroke={P.ink} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M216 148 L216 106 Q240 94 264 106 L264 148 Z" fill={P.plum800} stroke={P.ink} strokeWidth="2" strokeLinejoin="round" />
      <path d="M220 148 L220 116 L260 116 L260 148 Z" fill={P.plum700} opacity="0.55" />
      <path d="M216 106 L225 111 L225 146 L216 148 Z M264 106 L255 111 L255 146 L264 148 Z" fill={C.shutter} stroke={P.ink} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M219 116 L222 117.5 L222 140 L219 141 Z M261 116 L258 117.5 L258 140 L261 141 Z" fill={P.skyPale} opacity="0.8" />
      <Awning x={206} y={84} w={68} h={9} sw={2.2} />
      <rect x="148" y="144.5" width="190" height="4.5" fill={C.plinth} stroke={P.ink} strokeWidth="2" />
      <ResortSign x={182} y={6} w={116} h={22} />
    </g>
  );
}

export function OffAirVacationCoverArt() {
  const counterBase = 166;
  const counterTop = 143;
  const vp = { x: 170, y: 100 };
  return (
    <>
      <rect width="320" height="240" fill={P.sky} />
      <path d="M0 66 Q90 58 180 66 Q260 72 320 62 L320 104 L0 104 Z" fill={P.skyPale} opacity="0.75" />
      <circle cx="100" cy="34" r="30" fill={P.sunPale} opacity="0.4" />
      <circle cx="100" cy="34" r="17" fill={P.sunPale} stroke={P.sun} strokeWidth="5" />
      <Cloud x={150} y={16} s={0.75} />
      <Cloud x={30} y={22} s={0.8} />
      <rect y="100" width="320" height="20" fill={P.skyDeep} />
      <rect y="100" width="320" height="5" fill={P.sky} opacity="0.7" />
      <path d="M0 100 L320 100" stroke={P.ink} strokeWidth="2.4" />
      <WaveLines y={108} from={8} to={150} gap={32} size={10} />
      <WaveLines y={114.5} from={24} to={150} gap={38} size={12} />
      <path d="M0 116 Q80 111 160 117 L160 156 L0 156 Z" fill={SAND} />
      <path d="M0 118.5 Q80 113.5 160 119.5" fill="none" stroke={SAND_WET} strokeWidth="3" />
      <path d="M0 116 Q80 111 160 117" fill="none" stroke={P.ink} strokeWidth="2.2" />
      <Umbrella x={60} bottom={126} h={36} sw={1.8} />
      <Lounge x={62} bottom={129} w={34} sw={1.6} />
      <Gull x={10} feet={129} h={25} />
      <Palm x={30} y={136} h={112} lean={16} sw={2.2} />
      <path d="M0 150 Q100 145 200 148 L320 148 L320 240 L0 240 Z" fill={P.lime} />
      <path d="M0 150 Q100 145 200 148 L320 148" fill="none" stroke={P.ink} strokeWidth="2.2" />
      <path d="M-4 147 L138 147 L152 198 L-4 198 Z" fill={C.pave} stroke={P.ink} strokeWidth="2.2" strokeLinejoin="round" />
      <path d={[0, 1, 2, 3].map((i) => `M-4 ${147 + i * 13 + i * i * 0.6} L${139 + i * 3.8} ${147 + i * 13 + i * i * 0.6}`).join(" ")} stroke={C.paveJoint} strokeWidth="1.2" />
      <path d={[-60, -10, 40, 90, 140].map((x) => `M${f(vp.x + (x - vp.x) * 0.47)} 147 L${f(vp.x + (x - vp.x) * 0.98)} 198`).join(" ")} stroke={C.paveJoint} strokeWidth="1.2" />
      <Pool x={-12} y={158} w={130} h={27} sw={2.2} />
      <CoverBuilding />
      <path d="M186 148 L300 148 L312 174 L174 174 Z" fill={C.pave} stroke={P.ink} strokeWidth="2.2" strokeLinejoin="round" />
      <path d={[[208, 202], [232, 228], [256, 254], [280, 280]].map(([x]) => `M${x} 148 L${f(vp.x + (x - vp.x) * (74 / 48))} 174`).join(" ") + " M181 161 L306 161"} stroke={C.paveJoint} strokeWidth="1.2" />
      <OldTv x={190} bottom={165} w={18} sw={1.8} />
      <Cat x={240} line={counterTop - 2} s={0.255} gaze={-7} />
      <CounterBox x={202} base={counterBase} w={76} h={counterBase - counterTop} vp={vp} depth={0.06} sw={2.2} />
      <Sprite name="desk-bell" x={266} bottom={141.6} h={6.5} w0={80} h0={64} />
      <Sprite name="guest-book" x={214} bottom={142} h={7} w0={124} h0={96} />
      <Shadow x={293} y={164} rx={9} ry={1.6} />
      <Sprite name="plant-tall" x={292} bottom={166} h={34} w0={276} h0={348} />
      <Sprite name="hibiscus" x={178} bottom={180} h={19} w0={296} h0={178} />
      <CoverPath />
      <Tufts
        spots={[
          [176, 196, 2.6],
          [292, 190, 2.6],
          [268, 214, 3.2],
          [40, 214, 3.4],
          [22, 236, 4],
          [250, 236, 4],
          [300, 222, 3.4],
          [160, 186, 2.4],
        ]}
      />
      <Sprite name="fern" x={16} bottom={246} h={32} w0={220} h0={150} />
      <Sprite name="hibiscus" x={302} bottom={250} h={44} w0={296} h0={178} />
      <Deco pose="arrive" face="puzzled" x={110} feet={232} h={120} tilt={6} />
      <g transform="translate(128 99) rotate(-10)">
        <text textAnchor="middle" fontSize="20" fill={P.sun} stroke={P.ink} strokeWidth="4.5" paintOrder="stroke" strokeLinejoin="round" style={display}>
          ?
        </text>
      </g>
    </>
  );
}

export function OffAirVacationLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="-24 -26 424 222" className={className} role="img" aria-label="Férias Fora do Ar">
      <circle cx="350" cy="14" r="30" fill={P.sunPale} stroke={P.ink} strokeWidth="5" />
      <g stroke={P.sun} strokeWidth="5" strokeLinecap="round">
        <path d="M350 -24 L350 -34 M384 -6 L394 -12 M390 30 L400 34 M316 -6 L306 -12" />
      </g>
      <g style={display}>
        <g transform="rotate(-5 170 60)">
          <text x="176" y="88" textAnchor="middle" fontSize="88" fill={P.ink} letterSpacing="2">
            FÉRIAS
          </text>
          <text x="170" y="82" textAnchor="middle" fontSize="88" fill={P.sun} stroke={P.ink} strokeWidth="11" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            FÉRIAS
          </text>
          <path d="M44 34 q10 -8 22 -6" stroke={P.white} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.85" />
        </g>
        <g transform="rotate(2 190 150)">
          <rect x="18" y="104" width="352" height="76" rx="18" fill={P.ink} transform="translate(6 7)" />
          <rect x="18" y="104" width="352" height="76" rx="18" fill={P.plum700} stroke={P.ink} strokeWidth="6" />
          <rect x="30" y="114" width="328" height="56" rx="10" fill={P.screen} stroke={P.ink} strokeWidth="4" />
          <g stroke={P.screenDeep} strokeWidth="3" opacity="0.8">
            <path d="M36 124 L352 124 M36 136 L352 136 M36 148 L352 148 M36 160 L352 160" />
          </g>
          <text x="194" y="162" textAnchor="middle" fontSize="48" fill={P.white} stroke={P.ink} strokeWidth="9" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            FORA DO AR
          </text>
        </g>
      </g>
      <g transform="translate(-8 120) rotate(-18)">
        <path d="M0 0 Q20 -26 46 -18 Q22 -12 0 0 Z" fill={P.leaf} stroke={P.ink} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M0 0 Q12 -34 34 -40 Q18 -18 0 0 Z" fill={P.lime} stroke={P.ink} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Panel({ children, bg = P.sky }: { children: React.ReactNode; bg?: string }) {
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <rect width="200" height="130" fill={bg} />
      {children}
    </svg>
  );
}

function towards(vp: Pt, x: number, y0: number, y1: number) {
  return f(vp.x + ((x - vp.x) * (y1 - vp.y)) / (y0 - vp.y));
}

function ExplorePanel() {
  const vp = { x: 100, y: 44 };
  const far = 97;
  const near = 128;
  return (
    <Panel>
      <path d="M0 28 Q100 22 200 30 L200 46 L0 46 Z" fill={P.skyPale} opacity="0.75" />
      <Cloud x={118} y={14} s={0.7} />
      <rect y="44" width="200" height="13" fill={P.skyDeep} />
      <rect y="44" width="200" height="3.5" fill={P.sky} opacity="0.7" />
      <path d="M0 44 L200 44" stroke={P.ink} strokeWidth="2" />
      <WaveLines y={51} from={84} to={200} gap={26} size={8} />
      <path d="M60 55 Q130 51 200 57 L200 76 L60 76 Z" fill={SAND} />
      <path d="M60 57 Q130 53 200 59" fill="none" stroke={SAND_WET} strokeWidth="2.4" />
      <path d="M60 55 Q130 51 200 57" fill="none" stroke={P.ink} strokeWidth="2" />
      <Palm x={184} y={74} h={88} lean={-12} sw={1.8} />
      <path d="M0 72 L200 70 L200 130 L0 130 Z" fill={P.lime} />
      <path d="M96 62 L204 60 L204 86 L92 88 Z" fill={C.pave} stroke={P.ink} strokeWidth="1.8" strokeLinejoin="round" />
      <path d={[118, 140, 162, 184].map((x) => `M${x} ${f(62 - (x - 96) * 0.0185)} L${towards(vp, x, 62, 88)} 88`).join(" ")} stroke={C.paveJoint} strokeWidth="1" />
      <Pool x={128} y={64} w={82} h={17} sw={1.8} />
      <Umbrella x={150} bottom={66} h={28} sw={1.5} color={P.tangerine} />
      <rect x="-4" y="26" width="78" height="66" fill={C.wall} stroke={P.ink} strokeWidth="2.4" />
      <rect x="65" y="27.5" width="7.5" height="63" fill={C.wallShade} />
      <rect x="-4" y="26" width="78" height="3.5" fill={P.ink} opacity="0.16" />
      <path d="M-4 14 L82 14 L82 26 L-4 26 Z" fill={P.tomato} stroke={P.ink} strokeWidth="2.2" strokeLinejoin="round" />
      <path d={Array.from({ length: 9 }, (_, i) => `M${-4 + i * 9.5} 26 q4.75 -5 9.5 0`).join(" ")} fill="none" stroke={P.tomatoDeep} strokeWidth="1.4" />
      <path d="M-4 20 L82 20" stroke={P.tomatoDeep} strokeWidth="1.2" />
      <rect x="7" y="31" width="28" height="61" rx="1.5" fill={P.paper} stroke={P.ink} strokeWidth="1.8" />
      <rect x="10" y="34" width="22" height="58" fill={C.shutter} stroke={P.ink} strokeWidth="2" />
      <rect x="13.5" y="48" width="15" height="17" rx="1.5" fill={P.mintDeep} stroke={P.ink} strokeWidth="1.2" />
      <rect x="13.5" y="69" width="15" height="17" rx="1.5" fill={P.mintDeep} stroke={P.ink} strokeWidth="1.2" />
      <rect x="15.5" y="38" width="11" height="6" rx="1.2" fill={P.sun} stroke={P.ink} strokeWidth="1.2" />
      <path d="M18 41 L24 41" stroke={P.ink} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <circle cx="28.5" cy="68" r="1.6" fill={P.sun} stroke={P.ink} strokeWidth="1" />
      <Window x={46} y={50} w={14} h={19} sw={1.7} />
      <rect x="-4" y="88" width="78" height="5" fill={C.plinth} stroke={P.ink} strokeWidth="1.8" />
      <path d={`M0 ${far} L200 ${far} L200 ${near} L0 ${near} Z`} fill={C.pave} />
      <path d={[-60, -30, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270].map((x) => `M${x} ${far} L${towards(vp, x, far, near)} ${near}`).join(" ") + ` M0 111 L200 111`} stroke={C.paveJoint} strokeWidth="1.1" />
      <path d={`M0 ${far} L200 ${far} M0 ${near} L200 ${near}`} stroke={P.ink} strokeWidth="2" />
      <Tufts spots={[[84, 92, 2], [196, 93, 2], [6, 95, 2], [130, 94, 1.8]]} />
      <Sprite name="hibiscus" x={50} bottom={97} h={14} w0={296} h0={178} />
      <g>
        <Shadow x={109} y={97} rx={6} ry={1.4} />
        <path d="M108 97 L108 38" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
        <path d="M108 97 L108 38" stroke={P.wood} strokeWidth="2.4" strokeLinecap="round" />
        <SignArrow x={102} y={41} w={28} dir={1} color={P.mint} icon="wave" sw={1.6} />
        <SignArrow x={86} y={55} w={28} dir={-1} color={P.sun} icon="bell" sw={1.6} />
      </g>
      <Shadow x={170} y={99.5} rx={27} ry={2.4} />
      <rect x="146" y="84" width="48" height="15" rx="1.6" fill={P.wood} stroke={P.ink} strokeWidth="1.9" />
      <path d="M146 89 L194 89 M146 94 L194 94" stroke={P.woodDeep} strokeWidth="1.1" />
      <rect x="146" y="84" width="48" height="2.6" fill={P.woodDark} />
      <Sprite name="hibiscus" x={170} bottom={88} h={14} w0={296} h0={178} />
      <Shadow x={138} y={99.5} rx={8} ry={1.5} />
      <Poster x={129} y={80} w={15} rotate={9} sw={1.4} />
      <Sparkle x={131} y={78} s={4.6} />
      <Deco pose="walk" face="curious" x={62} feet={121} h={64} squash={0.3} />
    </Panel>
  );
}

function LobbyRoom({ wall, vp }: { wall: number; vp: Pt }) {
  const rows = [wall, 106.5, 112.5, 120.5, 130.5];
  const xs = Array.from({ length: 16 }, (_, i) => -60 + i * 20);
  const at = (x: number, y: number) => towards(vp, x, wall, y);
  const tiles = [];
  for (let r = 0; r < rows.length - 1; r += 1) {
    for (let c = 0; c < xs.length - 1; c += 1) {
      if ((r + c) % 2) continue;
      const [y0, y1] = [rows[r], rows[r + 1]];
      const [a, b] = [xs[c], xs[c + 1]];
      tiles.push(<path key={`${r}-${c}`} d={`M${at(a, y0)} ${y0} L${at(b, y0)} ${y0} L${at(b, y1)} ${y1} L${at(a, y1)} ${y1} Z`} fill={C.floorB} />);
    }
  }
  return (
    <g>
      <rect width="200" height={wall} fill={C.lobby} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={i * 24 + 6} y="0" width="10" height={wall} fill={C.lobbyLight} opacity="0.55" />
      ))}
      <rect y={wall - 14} width="200" height="14" fill={P.woodDeep} />
      <rect y={wall - 14} width="200" height="2.4" fill={P.wood} />
      <path d={`M0 ${wall - 14} L200 ${wall - 14}`} stroke={P.ink} strokeWidth="1.6" />
      <rect y={wall} width="200" height={130 - wall} fill={C.floorA} />
      {tiles}
      <path d={`M0 ${wall} L200 ${wall}`} stroke={P.ink} strokeWidth="1.8" />
    </g>
  );
}

function TalkPanel() {
  const vp = { x: 40, y: 69 };
  return (
    <Panel bg={C.lobby}>
      <LobbyRoom wall={102} vp={vp} />
      <Sprite name="lobby-window-a" x={18} bottom={88} h={52} w0={220} h0={320} />
      <StoppedClock cx={186} cy={21} r={7} sw={1.7} />
      <Sprite name="key-rack" x={186} bottom={60} h={23} w0={300} h0={200} />
      <Cat x={142} line={88.6} s={0.275} gaze={-8} />
      <CounterBox x={84} base={120} w={220} h={27} vp={vp} depth={0.15} sw={2} />
      <Sprite name="desk-bell" x={101} bottom={91.2} h={7.5} w0={80} h0={64} />
      <g transform="translate(188 77)">
        <path d="M-9 14 L9 14 L7 4 L-7 4 Z" fill={P.plum600} stroke={P.ink} strokeWidth="1.6" strokeLinejoin="round" />
        <rect x="-8" y="-6" width="7" height="12" rx="1" transform="rotate(-8)" fill={P.mint} stroke={P.ink} strokeWidth="1.4" />
        <rect x="-3" y="-8" width="7" height="13" rx="1" fill={P.sun} stroke={P.ink} strokeWidth="1.4" />
        <rect x="2" y="-6" width="7" height="12" rx="1" transform="rotate(8)" fill={P.bubblegum} stroke={P.ink} strokeWidth="1.4" />
      </g>
      <Bang x={150} y={17} r={7.5} />
      <Deco pose="ask" face="ask" x={58} feet={127} h={80} squash={0.3} />
      <g>
        <path d="M86 42 L78 54 L94 44 Z" fill={P.white} stroke={P.ink} strokeWidth="1.8" strokeLinejoin="round" />
        <rect x="82" y="20" width="26" height="24" rx="10" fill={P.white} stroke={P.ink} strokeWidth="2" />
        <path d="M86 43 L93 43" stroke={P.white} strokeWidth="2.4" />
        <text x="95" y="39" textAnchor="middle" fontSize="18" fill={P.plum500} style={display}>
          ?
        </text>
      </g>
      <KeyPrompt x={38} y={26} s={0.9} />
    </Panel>
  );
}

function Pencil({ x, y, len, t, rotate }: { x: number; y: number; len: number; t: number; rotate: number }) {
  const cone = t * 1.6;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x={1} y={t * 0.45} width={len} height={t} rx={t / 2} fill={P.ink} opacity="0.2" />
      <path d={`M0 0 L${len - cone} 0 L${len} ${t / 2} L${len - cone} ${t} L0 ${t} Z`} fill={P.sun} stroke={P.ink} strokeWidth="1.2" strokeLinejoin="round" />
      <path d={`M${len - cone} 0 L${len} ${t / 2} L${len - cone} ${t} Z`} fill={C.counterTop} stroke={P.ink} strokeWidth="1.1" strokeLinejoin="round" />
      <path d={`M${len - cone * 0.35} ${t * 0.33} L${len} ${t / 2} L${len - cone * 0.35} ${t * 0.67} Z`} fill={P.ink} />
      <rect x={-t * 0.9} y={0} width={t * 0.9} height={t} rx={t * 0.25} fill={C.chrome} stroke={P.ink} strokeWidth="1" />
      <rect x={-t * 1.9} y={0} width={t * 1.1} height={t} rx={t * 0.4} fill={P.bubblegum} stroke={P.ink} strokeWidth="1.1" />
      <path d={`M2 ${t / 2} L${len - cone - 2} ${t / 2}`} stroke={P.sunDeep} strokeWidth={t * 0.22} />
    </g>
  );
}

function Diary() {
  const tabs = [P.sun, P.mint, P.bubblegum, P.sky, P.lime];
  const rule = (x1: number, x2: number, y: number) => <path key={`${x1}-${y}`} d={`M${x1} ${y} L${x2} ${y}`} stroke="#d9c39a" strokeWidth="0.9" />;
  return (
    <g transform="translate(100 83) rotate(-3) scale(0.84)">
      <rect x="-80" y="-41" width="164" height="90" rx="6" fill={P.ink} opacity="0.28" />
      {tabs.map((c, i) => (
        <rect key={c} x={6 + i * 14} y={i === 0 ? -53 : -50} width="12" height="14" rx="2.4" fill={c} stroke={P.ink} strokeWidth="1.5" />
      ))}
      <rect x="-80" y="-44" width="160" height="88" rx="6" fill={P.woodDeep} stroke={P.ink} strokeWidth="2.2" />
      <path d="M-75 -40 L-2 -38 L-2 40 L-75 41 Z" fill={P.paper} stroke={P.ink} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M2 -38 L75 -40 L75 41 L2 40 Z" fill={P.paper} stroke={P.ink} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M-10 -38 L-2 -38 L-2 40 L-10 40 Z M2 -38 L10 -38 L10 40 L2 40 Z" fill={P.ink} opacity="0.08" />
      {[-30, -20, -10, 0, 10, 20, 30].map((y) => rule(-70, -6, y))}
      {[-30, -20, -10, 0, 10, 20, 30].map((y) => rule(6, 70, y))}
      <path d="M-62 -36 L-62 38" stroke="#ef8f86" strokeWidth="1" />
      {[-30, -15, 0, 15, 30].map((y) => (
        <ellipse key={y} cx="0" cy={y} rx="3.4" ry="1.8" fill="none" stroke="#9aa6b8" strokeWidth="1.6" />
      ))}
      <path d="M-58 -31 L-30 -31" stroke={P.ink} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="-60" y="-25" width="52" height="15" rx="3" fill={P.sunPale} stroke={P.ink} strokeWidth="1.4" />
      <path d="M-53 -21.5 L-51.6 -18.4 L-48.3 -18 L-50.8 -15.8 L-50 -12.6 L-53 -14.3 L-56 -12.6 L-55.2 -15.8 L-57.7 -18 L-54.4 -18.4 Z" fill={P.sun} stroke={P.ink} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M-45 -20 L-14 -20 M-45 -15 L-24 -15" stroke={P.inkSoft} strokeWidth="1.6" strokeLinecap="round" />
      {[0, 10].map((y, i) => (
        <g key={y}>
          <rect x="-59" y={y - 6} width="6" height="6" rx="1.2" fill={P.white} stroke={P.ink} strokeWidth="1.1" />
          {i === 0 && <path d={`M-58 ${y - 3} L-56.4 ${y - 1.2} L-53.4 ${y - 5.6}`} fill="none" stroke={P.mintDeep} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
          <path d={`M-49 ${y - 3} L${i ? -22 : -16} ${y - 3}`} stroke={P.inkSoft} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </g>
      ))}
      <g transform="translate(-56 24)">
        <circle cx="0" cy="-1" r="3.4" fill={P.sunPale} stroke={P.ink} strokeWidth="1" />
        <rect x="-1.8" y="2" width="3.6" height="2.4" rx="0.6" fill={P.ink} />
      </g>
      <path d="M-49 23 L-34 23" stroke={P.inkSoft} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <g transform="translate(-22 25)">
        <circle cx="0" cy="0" r="7" fill="none" stroke={P.ink} strokeWidth="1.2" />
        <path d={`${handPath(0, 0, 122, 3.6)} ${handPath(0, 0, 24, 5.4)}`} stroke={P.ink} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M8 -6 L11 -9 M9 -1 L13 -2" stroke={P.tomato} strokeWidth="1.1" strokeLinecap="round" />
      </g>
      <g>
        <rect x="9" y="-35" width="60" height="38" rx="2" fill={P.sky} stroke={P.ink} strokeWidth="1.4" />
        <image href={`${ART}/map-island.svg`} x="9" y="-35" width="60" height="38" preserveAspectRatio="xMidYMid slice" />
        <rect x="9" y="-35" width="60" height="38" rx="2" fill="none" stroke={P.ink} strokeWidth="1.4" />
        <g transform="translate(27 -16)">
          <path d="M0 0 C-4 -1 -5 -7 0 -8 C5 -7 4 -1 0 0 Z" transform="translate(0 2)" fill={P.tomato} stroke={P.ink} strokeWidth="1.1" />
          <circle cx="0" cy="-4" r="1.4" fill={P.white} />
        </g>
        <g transform="translate(52 -24)">
          <circle r="4" fill={P.white} stroke={P.tomato} strokeWidth="1.6" />
          <circle r="1.6" fill={P.tomato} />
        </g>
      </g>
      <g transform="translate(24 22) rotate(-4)">
        <rect x="-11" y="-12" width="22" height="26" rx="2" fill="none" stroke={P.inkSoft} strokeWidth="1.1" strokeDasharray="2.4 2" />
        <text x="0" y="6" textAnchor="middle" fontSize="13" fill="#a8822f" style={display}>
          ?
        </text>
      </g>
      <g transform="translate(46 8) rotate(6)">
        <Poster x={0} y={0} w={20} sw={1.3} />
        <rect x="-3" y="-3" width="9" height="5" fill={P.white} opacity="0.75" transform="rotate(-30 1 -1)" />
        <rect x="15" y="-3" width="9" height="5" fill={P.white} opacity="0.75" transform="rotate(30 19 -1)" />
      </g>
    </g>
  );
}

function NotePanel() {
  return (
    <Panel bg={C.table}>
      <rect width="200" height="30" fill={C.lobby} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={i * 24 + 6} y="0" width="10" height="30" fill={C.lobbyLight} opacity="0.55" />
      ))}
      <Sprite name="lobby-window-b" x={26} bottom={26} h={24} w0={220} h0={320} />
      <StoppedClock cx={176} cy={13} r={6.6} sw={1.6} />
      <rect y="24" width="200" height="6" fill={P.woodDeep} />
      <path d="M0 24 L200 24" stroke={P.ink} strokeWidth="1.4" />
      <rect y="30" width="200" height="100" fill={C.table} />
      <rect y="30" width="200" height="4" fill={C.tableEdge} />
      <path d="M0 34 L200 34" stroke={P.ink} strokeWidth="1.8" />
      <path d="M0 50 Q60 46 120 52 T200 48 M0 74 Q50 70 110 76 T200 72 M0 100 Q70 96 130 102 T200 98 M0 122 Q60 118 120 124 T200 120" fill="none" stroke={C.tableGrain} strokeWidth="1.3" opacity="0.8" />
      <g transform="translate(100 83) scale(1 0.88) translate(-100 -83)">
        <g transform="translate(-2 40) rotate(-9)">
          <rect x="1.4" y="1.8" width="70" height="47" rx="1.6" fill={P.ink} opacity="0.22" />
          <rect x="0" y="0" width="70" height="47" rx="1.6" fill={P.white} stroke={P.ink} strokeWidth="1.5" />
          <rect x="4" y="4" width="62" height="39" fill={P.sky} />
          <rect x="4" y="27" width="62" height="16" fill={P.skyDeep} />
          <circle cx="44" cy="25" r="8" fill={P.sunPale} stroke={P.sun} strokeWidth="1.6" />
          <path d="M12 43 Q15 26 21 17 M21 17 q-8 -2 -12 4 M21 17 q7 -5 13 -2 M21 17 q-3 -7 -9 -8 M21 17 q5 -1 9 5" fill="none" stroke={P.leafDeep} strokeWidth="2" strokeLinecap="round" />
          <rect x="4" y="4" width="62" height="39" fill="none" stroke={P.ink} strokeWidth="1" />
        </g>
        <g transform="translate(157 38) rotate(9)">
          <rect x="1.4" y="1.8" width="40" height="48" rx="1.6" fill={P.ink} opacity="0.22" />
          <rect x="0" y="0" width="40" height="48" rx="1.6" fill={P.white} stroke={P.ink} strokeWidth="1.5" />
          <rect x="4" y="4" width="32" height="32" fill={P.tomato} />
          <image href={`${ART}/face-bigodes-normal.svg`} x="4" y="4" width="32" height="32" preserveAspectRatio="xMidYMid slice" />
          <rect x="4" y="4" width="32" height="32" fill="none" stroke={P.ink} strokeWidth="1" />
        </g>
        <Diary />
        <g transform="translate(26 118) rotate(-26)">
          <ellipse cx="2" cy="4" rx="14" ry="4" fill={P.ink} opacity="0.2" />
          <image href={`${ART}/item-key.svg`} x="-17" y="-17" width="34" height="34" />
        </g>
        <Pencil x={112} y={124} len={84} t={4.2} rotate={-13} />
      </g>
    </Panel>
  );
}

export function OffAirVacationHowToPanel({ step }: { step: 0 | 1 | 2 }) {
  if (step === 0) return <ExplorePanel />;
  if (step === 1) return <TalkPanel />;
  return <NotePanel />;
}

const CAST = { cx: 150, feet: 216, tall: 212, w: 300, h: 224 };

function OnAirSign({ lit }: { lit: boolean }) {
  const w = lit ? 76 : 98;
  return (
    <g transform={`translate(${lit ? 44 : 54} 40) rotate(-9)`}>
      {lit && <path d="M-38 -26 L-45 -33 M0 -27 L0 -37 M38 -26 L45 -33" stroke={P.ink} strokeWidth={2.6} strokeLinecap="round" />}
      <rect x={-w / 2} y={-16} width={w} height={32} rx={8} transform="translate(2 3)" fill={P.ink} />
      <rect x={-w / 2} y={-16} width={w} height={32} rx={8} fill={lit ? P.tomato : P.plum700} stroke={P.ink} strokeWidth={2.6} />
      <rect x={-w / 2 + 5} y={-11} width={w - 10} height={22} rx={5} fill="none" stroke={lit ? "#ffb0a8" : P.plum500} strokeWidth={1.4} />
      <text x={0} y={lit ? 7.5 : 6.5} textAnchor="middle" fontSize={lit ? 21 : 17} fill={lit ? P.white : P.cream3} style={display}>
        {lit ? "NO AR" : "FORA DO AR"}
      </text>
    </g>
  );
}

export function OffAirVacationResult({ ending, className }: { ending: "on" | "off"; className?: string }) {
  const on = ending === "on";
  const h = 162;
  const s = h / CAST.tall;
  return (
    <svg viewBox="0 0 200 190" className={className} aria-hidden overflow="visible">
      <circle cx={100} cy={96} r={80} fill={on ? P.skyPale : "#c9eee3"} stroke={P.ink} strokeWidth={2.4} />
      <ellipse cx={104} cy={176} rx={46} ry={6} fill={P.ink} opacity={0.22} />
      <g transform={`translate(110 176) scale(${s.toFixed(4)}) translate(${-CAST.cx} ${-CAST.feet})`}>
        <image href={`${ART}/deco-cheer.svg`} width={CAST.w} height={CAST.h} />
      </g>
      <OnAirSign lit={on} />
      <g fill={P.sun} stroke={P.ink} strokeWidth={1.8} strokeLinejoin="round">
        <path d="M178 66 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z" />
        <path d="M24 136 l2.4 5.4 l5.6 0.8 l-4 4 l1 5.6 l-5 -2.6 l-5 2.6 l1 -5.6 l-4 -4 l5.6 -0.8 z" />
      </g>
    </svg>
  );
}
