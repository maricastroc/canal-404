import type React from "react";
import { useId } from "react";
import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import { P } from "@/lib/palette";
import { HOST_BOX } from "@/games/talent-show/scenes/figure";

const ART = "/assets/talent-show";
const display = { fontFamily: "var(--font-luckiest)" };

type KidId = "deco" | "lina" | "bruno" | "mila";
type Face = "normal" | "happy" | "wow";
type Pose = "ready" | "hit";
type HostMood = "neutral" | "happy" | "excited" | "surprised" | "sad" | "static" | "wave";
type JudgeArt = "arlindo-neutral" | "arlindo-angry" | "lunch-neutral" | "lunch-angry" | "inspector-neutral" | "inspector-angry" | "inspector-shock";

const JUDGE = {
  arlindo: { w: 150, h: 140, crop: 140, scale: 1.2, originX: 0.48 },
  lunch: { w: 220, h: 476, crop: 250, scale: 0.92, originX: 0.5 },
  inspector: { w: 380, h: 476, crop: 290, scale: 0.78, originX: 0.45 },
} as const;

const r1 = (n: number) => Math.round(n * 10) / 10;

function Kid({ who, x, feet, s, face = "normal", pose = "ready" }: { who: KidId; x: number; feet: number; s: number; face?: Face; pose?: Pose }) {
  const top = r1(feet - 458 * s);
  return (
    <g>
      <image href={`${ART}/body-${who}-${pose}.svg`} x={r1(x - 180 * s)} y={top} width={r1(360 * s)} height={r1(470 * s)} />
      <image href={`${ART}/head-${who}-${face}.svg`} x={r1(x - 100 * s)} y={top} width={r1(200 * s)} height={r1(222 * s)} />
    </g>
  );
}

function Host({ x, feet, s, mood }: { x: number; feet: number; s: number; mood: HostMood }) {
  return <image href={`${ART}/host-${mood}.svg`} x={r1(x - (100 - HOST_BOX.x) * s)} y={r1(feet - (HOST_BOX.feet - HOST_BOX.y) * s)} width={r1(HOST_BOX.w * s)} height={r1(HOST_BOX.h * s)} />;
}

function Judge({ art, x, base, s }: { art: JudgeArt; x: number; base: number; s: number }) {
  const a = JUDGE[art.split("-")[0] as keyof typeof JUDGE];
  const k = a.scale * s;
  const w = a.w * k;
  const h = a.crop * k;
  return (
    <svg x={r1(x - a.originX * w)} y={r1(base - h)} width={r1(w)} height={r1(h)} viewBox={`0 0 ${a.w} ${a.crop}`}>
      <image href={`${ART}/jury-${art}.svg`} width={a.w} height={a.h} />
    </svg>
  );
}

function Desk({ x0, x1, top, h, line = 2.4 }: { x0: number; x1: number; top: number; h: number; line?: number }) {
  const rail = h * 0.2;
  return (
    <g stroke={P.ink} strokeWidth={line} strokeLinejoin="round">
      <rect x={x0 + 2} y={top + 3} width={x1 - x0} height={h} rx={3} fill={P.ink} opacity={0.3} stroke="none" />
      <rect x={x0} y={top + rail * 0.6} width={x1 - x0} height={h - rail * 0.6} rx={3} fill={P.plum600} />
      <path d={`M${x0 + 5} ${r1(top + rail * 1.9)} L${x1 - 5} ${r1(top + rail * 1.9)}`} stroke={P.sun} strokeWidth={line * 1.1} strokeLinecap="round" />
      <rect x={x0} y={top} width={x1 - x0} height={rail} rx={3} fill={P.cream3} />
    </g>
  );
}

function Paddle({ x, y, s, score, tilt = 0 }: { x: number; y: number; s: number; score: number; tilt?: number }) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) rotate(${tilt}) scale(${s})`}>
      <image href={`${ART}/plate.svg`} x={-62} y={-54} width={124} height={170} />
      <text x={score > 9 ? -2 : 0} y={27} textAnchor="middle" fontSize={score > 9 ? 66 : 74} fill={P.ink} style={display}>
        {score}
      </text>
    </g>
  );
}

function Fan({ variant, x, base, s }: { variant: 0 | 1 | 2 | 3; x: number; base: number; s: number }) {
  return <image href={`${ART}/crowd-${variant}.svg`} x={r1(x - 60 * s)} y={r1(base - 130 * s)} width={r1(120 * s)} height={r1(130 * s)} />;
}

function Digit({ d, x, y, s }: { d: "4" | "0"; x: number; y: number; s: number }) {
  const path = d === "4" ? `M${x} ${y} L${x} ${y + s} L${x + s} ${y + s} M${x + s} ${y} L${x + s} ${y + 2 * s}` : `M${x} ${y} L${x + s} ${y} L${x + s} ${y + 2 * s} L${x} ${y + 2 * s} Z`;
  return (
    <>
      <path d={path} fill="none" stroke={P.ink} strokeWidth={r1(s * 0.42)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke={P.sun} strokeWidth={r1(s * 0.26)} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

export function Marquee({ x, y, s, w = 430, h = 190, edge = 6 }: { x: number; y: number; s: number; w?: number; h?: number; edge?: number }) {
  const bx = -w / 2;
  const by = -h / 2;
  const step = 34;
  const across = Array.from({ length: Math.floor((w - 40) / step) + 1 }, (_, i) => bx + 20 + i * step + ((w - 40) % step) / 2);
  const down = Array.from({ length: Math.max(0, Math.floor((h - 28 - step / 2) / step)) }, (_, i) => by + 14 + step * (i + 1)).filter((v) => v <= by + h - 14 - step / 2);
  const d = (h - 70) / 2;
  const gap = d * 0.7;
  const dx = -(d * 3 + gap * 2) / 2;
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) scale(${s})`}>
      <rect x={bx + 8} y={by + 10} width={w} height={h} rx={22} fill={P.ink} opacity={0.35} />
      <rect x={bx} y={by} width={w} height={h} rx={22} fill={P.plum700} stroke={P.ink} strokeWidth={edge} />
      <rect x={bx + 28} y={by + 28} width={w - 56} height={h - 56} rx={12} fill={P.plum950} stroke={P.ink} strokeWidth={4} />
      <g fill={P.sunPale} stroke={P.ink} strokeWidth={3}>
        {across.map((cx) => (
          <g key={`a${cx}`}>
            <circle cx={r1(cx)} cy={by + 14} r={7} />
            <circle cx={r1(cx)} cy={by + h - 14} r={7} />
          </g>
        ))}
        {down.map((cy) => (
          <g key={`d${cy}`}>
            <circle cx={bx + 14} cy={r1(cy)} r={7} />
            <circle cx={bx + w - 14} cy={r1(cy)} r={7} />
          </g>
        ))}
      </g>
      <Digit d="4" x={dx} y={-d} s={d} />
      <Digit d="0" x={dx + d + gap} y={-d} s={d} />
      <Digit d="4" x={dx + 2 * (d + gap)} y={-d} s={d} />
    </g>
  );
}

function Curtain({ x, w, h, flip = false }: { x: number; w: number; h: number; flip?: boolean }) {
  const folds = 3;
  const fw = w / folds;
  const edge = flip ? x : x + w;
  const tie = (side: number) => `M${x} ${r1(h * 0.52 + side)} Q${r1(x + w / 2)} ${r1(h * 0.6 + side)} ${x + w} ${r1(h * 0.5 + side)}`;
  return (
    <g>
      <rect x={x} y={0} width={w} height={h} fill={P.tomato} />
      {Array.from({ length: folds }, (_, i) => {
        const fx = x + i * fw;
        return (
          <g key={i}>
            <path d={`M${r1(fx + fw * 0.55)} 0 Q${r1(fx + fw * 0.75)} ${r1(h / 2)} ${r1(fx + fw * 0.6)} ${h} L${r1(fx + fw)} ${h} L${r1(fx + fw)} 0 Z`} fill={P.tomatoDeep} opacity={0.85} />
            <path d={`M${r1(fx + fw * 0.2)} 0 Q${r1(fx + fw * 0.3)} ${r1(h / 2)} ${r1(fx + fw * 0.18)} ${h}`} stroke="#ff7a6e" strokeWidth={1.4} fill="none" opacity={0.7} />
          </g>
        );
      })}
      <path d={`M${edge} 0 L${edge} ${h}`} stroke={P.ink} strokeWidth={2.2} />
      <path d={tie(0)} stroke={P.sun} strokeWidth={3.2} fill="none" strokeLinecap="round" />
      <path d={tie(0)} stroke={P.ink} strokeWidth={1} fill="none" opacity={0.6} />
    </g>
  );
}

function Stage({ width, height, top, front, panels = true }: { width: number; height: number; top: number; front: number; panels?: boolean }) {
  const lip = Math.max(4, (front - top) * 0.2);
  const rows = Array.from({ length: Math.max(0, Math.floor((front - lip - top) / 8) - 1) }, (_, i) => top + 8 * (i + 1));
  const bulbs = Array.from({ length: Math.ceil(width / 26) }, (_, i) => 13 + i * 26);
  return (
    <g>
      <rect width={width} height={height} fill={P.plum900} />
      {panels &&
        Array.from({ length: Math.ceil(width / 40) }, (_, i) => <rect key={i} x={i * 40 + 5} y={top * 0.12} width={30} height={top * 0.84} rx={3} fill={P.plum800} opacity={0.7} />)}
      <rect y={top} width={width} height={front - top} fill={P.wood} />
      {rows.map((y, i) => (
        <g key={y} stroke={P.woodDeep} strokeWidth={1} opacity={0.7}>
          <path d={`M0 ${y} L${width} ${y}`} />
          {Array.from({ length: Math.ceil(width / 60) + 1 }, (_, k) => (
            <path key={k} d={`M${k * 60 + (i % 2) * 30} ${y - 8} L${k * 60 + (i % 2) * 30} ${y}`} opacity={0.7} />
          ))}
        </g>
      ))}
      <rect y={top} width={width} height={3} fill={P.woodDeep} />
      <path d={`M0 ${top} L${width} ${top}`} stroke={P.ink} strokeWidth={2} />
      <rect y={front - lip} width={width} height={lip} fill={P.woodDark} />
      <path d={`M0 ${front - lip} L${width} ${front - lip}`} stroke={P.ink} strokeWidth={1.4} />
      <g fill={P.sunPale} stroke={P.ink} strokeWidth={0.9}>
        {bulbs.map((x) => (
          <circle key={x} cx={x} cy={r1(front - lip / 2)} r={r1(lip * 0.26)} />
        ))}
      </g>
      <rect y={front} width={width} height={Math.max(0, height - front)} fill={P.plum950} />
    </g>
  );
}

function Truss({ width, lamps }: { width: number; lamps: number[] }) {
  return (
    <g>
      <rect x={-2} y={-2} width={width + 4} height={9} fill={P.plum950} stroke={P.ink} strokeWidth={1.4} />
      <path d={Array.from({ length: Math.ceil(width / 12) }, (_, i) => `M${i * 12} 0 L${i * 12 + 6} 6 L${i * 12 + 12} 0`).join(" ")} stroke={P.plum600} strokeWidth={1} fill="none" />
      {lamps.map((x) => (
        <g key={x} stroke={P.ink} strokeWidth={1.4} strokeLinejoin="round">
          <path d={`M${x} 6 L${x} 10`} />
          <path d={`M${x - 7} 10 L${x + 7} 10 L${x + 5} 21 L${x - 5} 21 Z`} fill="#3b3b4a" />
          <ellipse cx={x} cy={21} rx={5} ry={2} fill={P.sunPale} strokeWidth={1} />
        </g>
      ))}
    </g>
  );
}

function Beam({ x, from, to, w0, w1, floor }: { x: number; from: number; to: number; w0: number; w1: number; floor?: boolean }) {
  return (
    <g pointerEvents="none">
      <polygon points={`${x - w0},${from} ${x + w0},${from} ${x + w1},${to} ${x - w1},${to}`} fill={P.sunPale} opacity={0.2} />
      <polygon points={`${x - w0 * 0.5},${from} ${x + w0 * 0.5},${from} ${x + w1 * 0.6},${to} ${x - w1 * 0.6},${to}`} fill={P.sunPale} opacity={0.14} />
      {floor && <ellipse cx={x} cy={to} rx={w1} ry={r1(w1 * 0.16)} fill={P.sunPale} opacity={0.4} />}
    </g>
  );
}

function Note({ x, y, s = 1, fill, rotate = 0, beamed = false }: { x: number; y: number; s?: number; fill: string; rotate?: number; beamed?: boolean }) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) rotate(${rotate}) scale(${s})`} stroke={P.ink} strokeLinejoin="round" strokeLinecap="round">
      {beamed ? (
        <>
          <path d="M4 -1 L4 -20 L18 -24 L18 -5" fill="none" strokeWidth={2.4} />
          <path d="M4 -20 L18 -24" strokeWidth={4.4} />
          <ellipse cx={0} cy={0} rx={5.4} ry={4} transform="rotate(-20)" fill={fill} strokeWidth={1.8} />
          <ellipse cx={14} cy={-4} rx={5.4} ry={4} transform="rotate(-20 14 -4)" fill={fill} strokeWidth={1.8} />
        </>
      ) : (
        <>
          <path d="M4 -1 L4 -22 Q12 -19 13 -10" fill="none" strokeWidth={2.4} />
          <ellipse cx={0} cy={0} rx={5.4} ry={4} transform="rotate(-20)" fill={fill} strokeWidth={1.8} />
        </>
      )}
    </g>
  );
}

function Shout({ x, y, text, size, color, rotate = 0 }: { x: number; y: number; text: string; size: number; color: string; rotate?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fill={color} stroke={P.ink} strokeWidth={r1(size * 0.22)} paintOrder="stroke" strokeLinejoin="round" style={display} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
      {text}
    </text>
  );
}

function Star({ x, y, r, fill = P.sun, rotate = 0 }: { x: number; y: number; r: number; fill?: string; rotate?: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.48;
    return `${r1(x + Math.cos(a) * rr)},${r1(y + Math.sin(a) * rr)}`;
  }).join(" ");
  return <polygon points={pts} fill={fill} stroke={P.ink} strokeWidth={Math.max(1.4, r1(r * 0.18))} strokeLinejoin="round" transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined} />;
}

function Confetti({ x, y, a, c }: { x: number; y: number; a: number; c: string }) {
  return <rect x={x - 4} y={y - 2.5} width={8} height={5} rx={1.2} fill={c} stroke={P.ink} strokeWidth={1.2} transform={`rotate(${a} ${x} ${y})`} />;
}

function Hits({ x, y, r, color = P.sunPale }: { x: number; y: number; r: number; color?: string }) {
  return (
    <g stroke={color} strokeWidth={r1(r * 0.16)} strokeLinecap="round">
      {[-150, -110, -70, -30].map((a) => {
        const rad = (a * Math.PI) / 180;
        return <path key={a} d={`M${r1(x + Math.cos(rad) * r * 0.55)} ${r1(y + Math.sin(rad) * r * 0.55)} L${r1(x + Math.cos(rad) * r)} ${r1(y + Math.sin(rad) * r)}`} />;
      })}
    </g>
  );
}

function Strip({ x, y, w, h, line = 2.4, children }: { x: number; y: number; w: number; h: number; line?: number; children?: React.ReactNode }) {
  return (
    <g>
      <rect x={x + 1.5} y={y + 2.5} width={w} height={h} rx={h * 0.28} fill={P.ink} opacity={0.35} />
      <rect x={x} y={y} width={w} height={h} rx={h * 0.28} fill={P.plum950} />
      {children}
      <rect x={x} y={y} width={w} height={h} rx={h * 0.28} fill="none" stroke={P.ink} strokeWidth={line} />
    </g>
  );
}

function Beats({ x0, x1, step, y, h, first }: { x0: number; x1: number; step: number; y: number; h: number; first: number }) {
  return (
    <g fill={P.plum500}>
      {Array.from({ length: Math.floor((x1 - x0) / step) + 1 }, (_, i) => {
        const bx = x0 + i * step;
        const bar = (i + first) % 4 === 0;
        return <rect key={i} x={r1(bx - (bar ? 1 : 0.5))} y={r1(bar ? y + h * 0.1 : y + h * 0.35)} width={bar ? 2 : 1} height={r1(bar ? h * 0.8 : h * 0.5)} opacity={bar ? 0.9 : 0.4} />;
      })}
    </g>
  );
}

function Ball({ x, y, r, fill, opacity = 1 }: { x: number; y: number; r: number; fill: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y + r * 0.14} r={r} fill={P.ink} />
      <circle cx={x} cy={y} r={r} fill={fill} stroke={P.ink} strokeWidth={r1(r * 0.14)} />
      <circle cx={r1(x - r * 0.3)} cy={r1(y - r * 0.3)} r={r1(r * 0.25)} fill={P.cream} opacity={0.55} />
    </g>
  );
}

function HitRing({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g fill="none">
      <circle cx={x} cy={y} r={r1(r + r * 0.26)} stroke={P.cream} strokeWidth={r1(r * 0.2)} opacity={0.9} />
      <circle cx={x} cy={y} r={r1(r + r * 0.42)} stroke={P.ink} strokeWidth={r1(r * 0.08)} />
    </g>
  );
}

function Tail({ x0, x1, y, r, fill, opacity = 0.85 }: { x0: number; x1: number; y: number; r: number; fill: string; opacity?: number }) {
  const h = r * 0.9;
  return <rect x={x0} y={r1(y - h / 2)} width={x1 - x0} height={r1(h)} rx={r1(h / 2)} fill={fill} stroke={P.ink} strokeWidth={r1(r * 0.1)} opacity={opacity} />;
}

function Diamond({ x, y, r }: { x: number; y: number; r: number }) {
  return <polygon points={`${x},${r1(y - r * 0.9)} ${r1(x + r * 0.75)},${y} ${x},${r1(y + r * 0.9)} ${r1(x - r * 0.75)},${y}`} fill={P.plum300} stroke={P.ink} strokeWidth={r1(r * 0.14)} strokeLinejoin="round" />;
}

function Static({ x, y, w, h, cell }: { x: number; y: number; w: number; h: number; cell: number }) {
  const cols = Math.floor(w / cell);
  const rows = Math.floor(h / cell);
  const tones = [P.cream, P.steel, P.inkSoft, P.plum300, P.steelDeep];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={P.plum800} />
      {Array.from({ length: rows }, (_, j) =>
        Array.from({ length: cols }, (_, i) => {
          const v = (i * 37 + j * 91 + ((i * j) % 7) * 13) % 17;
          if (v > 9) return null;
          return <rect key={`${i}-${j}`} x={r1(x + i * cell)} y={r1(y + j * cell)} width={cell} height={cell} fill={tones[v % tones.length]} opacity={v % 3 === 0 ? 0.9 : 0.55} />;
        }),
      )}
    </g>
  );
}

function Hand({ x, y, s, hold = false }: { x: number; y: number; s: number; hold?: boolean }) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) scale(${s})`} stroke={P.ink} strokeLinejoin="round" strokeLinecap="round">
      {hold ? (
        <circle cx={0} cy={0} r={11} fill="none" stroke={P.sun} strokeWidth={3} strokeDasharray="46 24" transform="rotate(-90)" />
      ) : (
        <Hits x={0} y={-1} r={13} />
      )}
      <rect x={-8} y={35} width={27} height={12} rx={3} fill={P.sky} strokeWidth={2.2} />
      <path d="M-4.5 16 L-4.5 4 Q-4.5 -1 0 -1 Q4.5 -1 4.5 4 L4.5 12 Q8 9 11 12 Q14 10 17 13 Q20 13 20 18 L20 28 Q20 38 10 38 L0 38 Q-8 38 -10 30 L-14 20 Q-15 15 -11 15 Q-8 15 -6 19 Z" fill={P.skinLight} strokeWidth={2.2} />
      <path d="M11 12 L11 19 M17 13 L17 19" strokeWidth={1.6} />
      <path d="M-2 2 Q0 1 2 2" stroke={P.white} strokeWidth={1.4} opacity={0.8} />
    </g>
  );
}

function Bang({ x, y, spread }: { x: number; y: number; spread: number }) {
  const side = (k: number) => `M${r1(x + k * spread)} ${y} L${r1(x + k * (spread + 7))} ${y - 5} M${r1(x + k * (spread + 1))} ${y + 5} L${r1(x + k * (spread + 8))} ${y + 5}`;
  return (
    <g stroke={P.sunPale} strokeWidth={2} strokeLinecap="round">
      <path d={side(-1)} />
      <path d={side(1)} />
    </g>
  );
}

function Heart({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <path
      d={`M${x} ${r1(y + r * 1.1)} L${r1(x - r * 1.05)} ${r1(y + r * 0.1)} Q${r1(x - r * 1.5)} ${r1(y - r * 0.6)} ${r1(x - r * 0.8)} ${r1(y - r * 0.95)} Q${r1(x - r * 0.25)} ${r1(y - r * 1.15)} ${x} ${r1(y - r * 0.45)} Q${r1(x + r * 0.25)} ${r1(y - r * 1.15)} ${r1(x + r * 0.8)} ${r1(y - r * 0.95)} Q${r1(x + r * 1.5)} ${r1(y - r * 0.6)} ${r1(x + r * 1.05)} ${r1(y + r * 0.1)} Z`}
      fill={P.bubblegum}
      stroke={P.ink}
      strokeWidth={r1(Math.max(1.2, r * 0.22))}
      strokeLinejoin="round"
    />
  );
}

export function TalentShowCoverArt() {
  const top = 172;
  const front = 200;
  return (
    <>
      <Stage width={320} height={240} top={top} front={front} />
      <Marquee x={84} y={44} s={0.27} />
      <Curtain x={0} w={22} h={top} />
      <Curtain x={300} w={20} h={top} flip />
      <Truss width={320} lamps={[152, 262]} />
      <Beam x={152} from={20} to={196} w0={6} w1={48} floor />
      <Beam x={262} from={20} to={118} w0={5} w1={34} />
      <Paddle x={222} y={68} s={0.24} score={8} tilt={-10} />
      <Paddle x={276} y={70} s={0.27} score={10} tilt={-4} />
      <Judge art="inspector-neutral" x={228} base={122} s={0.2} />
      <Judge art="arlindo-neutral" x={262} base={122} s={0.2} />
      <Judge art="lunch-neutral" x={298} base={122} s={0.2} />
      <Heart x={306} y={70} r={6} />
      <Desk x0={208} x1={326} top={118} h={26} />
      <Kid who="lina" x={46} feet={186} s={0.19} face="happy" pose="hit" />
      <Kid who="mila" x={96} feet={182} s={0.17} face="normal" pose="hit" />
      <Kid who="bruno" x={206} feet={186} s={0.19} face="happy" pose="hit" />
      <Kid who="deco" x={152} feet={202} s={0.27} face="happy" pose="hit" />
      <Bang x={152} y={156} spread={24} />
      <Note x={114} y={110} s={0.9} fill={P.tangerine} rotate={-12} />
      <Note x={182} y={98} s={0.8} fill={P.sun} rotate={10} beamed />
      <Note x={190} y={70} s={0.65} fill={P.bubblegum} rotate={8} />
      <Fan variant={1} x={14} base={246} s={0.44} />
      <Fan variant={3} x={58} base={250} s={0.46} />
      <Fan variant={0} x={100} base={248} s={0.42} />
      <Fan variant={2} x={208} base={248} s={0.44} />
      <Fan variant={3} x={254} base={250} s={0.46} />
      <Fan variant={0} x={300} base={246} s={0.44} />
    </>
  );
}

const PANEL = localized({
  "pt-BR": { perfect: "Na mosca!", held: "Segurou!", turn: "Sua vez", noSignal: "SEM SINAL", noise: "Barulho!", shh: "Shhh!" },
  en: { perfect: "Bullseye!", held: "Held it!", turn: "Your turn", noSignal: "NO SIGNAL", noise: "Noise!", shh: "Shhh!" },
});

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      {children}
    </svg>
  );
}

const LANE = { x: 8, y: 92, w: 184, h: 32, hit: 34 };
const laneY = LANE.y + LANE.h * 0.55;

function Lane({ children }: { children?: React.ReactNode }) {
  return (
    <Strip x={LANE.x} y={LANE.y} w={LANE.w} h={LANE.h}>
      <Beats x0={LANE.hit} x1={LANE.x + LANE.w - 6} step={18} y={LANE.y} h={LANE.h} first={0} />
      {children}
    </Strip>
  );
}

function Rays({ x, y, r0, r1: r2, color = P.sun }: { x: number; y: number; r0: number; r1: number; color?: string }) {
  return (
    <g stroke={color} strokeWidth={1.8} strokeLinecap="round">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = (a * Math.PI) / 180;
        return <path key={a} d={`M${r1(x + Math.cos(rad) * r0)} ${r1(y + Math.sin(rad) * r0)} L${r1(x + Math.cos(rad) * r2)} ${r1(y + Math.sin(rad) * r2)}`} />;
      })}
    </g>
  );
}

function Bubble({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children?: React.ReactNode }) {
  return (
    <g>
      <path d={`M${r1(x + 6)} ${y + h - 1} L${x - 2} ${y + h + 8} L${r1(x + 14)} ${y + h - 1}`} fill={P.cream} stroke={P.ink} strokeWidth={1.6} strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={P.cream} stroke={P.ink} strokeWidth={1.6} />
      <path d={`M${r1(x + 6.8)} ${y + h - 1.6} L${r1(x + 13.2)} ${y + h - 1.6}`} stroke={P.cream} strokeWidth={2} />
      {children}
    </g>
  );
}

function TapPanel({ locale }: { locale: Locale }) {
  const t = PANEL[locale];
  return (
    <Panel>
      <Stage width={200} height={130} top={70} front={84} />
      <Truss width={200} lamps={[100]} />
      <Beam x={100} from={20} to={80} w0={5} w1={26} floor />
      <Kid who="deco" x={100} feet={82} s={0.15} face="happy" pose="hit" />
      <Lane>
        <Ball x={LANE.hit + 54} y={laneY} r={7.5} fill={P.tangerine} />
        <Ball x={LANE.hit + 90} y={laneY} r={7.5} fill={P.tangerine} />
        <Ball x={LANE.hit + 126} y={laneY} r={7.5} fill={P.tangerine} />
        <Ball x={LANE.hit} y={laneY} r={7.5} fill={P.tangerine} />
        <HitRing x={LANE.hit} y={laneY} r={7.5} />
        <Rays x={LANE.hit} y={laneY} r0={12.5} r1={15} />
      </Lane>
      <Shout x={42} y={86} text={t.perfect} size={12} color={P.sun} rotate={-6} />
      <Hand x={164} y={52} s={0.62} />
    </Panel>
  );
}

function HoldPanel({ locale }: { locale: Locale }) {
  const t = PANEL[locale];
  const turn = 126;
  return (
    <Panel>
      <Stage width={200} height={130} top={70} front={84} />
      <Truss width={200} lamps={[40, 118]} />
      <Kid who="lina" x={90} feet={82} s={0.14} face="happy" pose="hit" />
      <Kid who="mila" x={144} feet={82} s={0.14} face="normal" pose="hit" />
      <Bubble x={158} y={12} w={38} h={16}>
        <Diamond x={168} y={20} r={4.2} />
        <Diamond x={177} y={20} r={4.2} />
        <Diamond x={186} y={20} r={4.2} />
      </Bubble>
      <Lane>
        <rect x={turn} y={LANE.y + 3} width={LANE.x + LANE.w - turn - 3} height={LANE.h - 6} fill={P.sun} opacity={0.14} />
        <Tail x0={LANE.hit} x1={104} y={laneY} r={7.5} fill={P.bubblegum} />
        <Ball x={LANE.hit} y={laneY} r={7.5} fill={P.bubblegum} />
        <circle cx={LANE.hit} cy={laneY} r={10.5} fill="none" stroke={P.sun} strokeWidth={1.6} opacity={0.85} />
        <HitRing x={LANE.hit} y={laneY} r={7.5} />
        {[18, 36, 54].map((dx) => (
          <circle key={dx} cx={turn + dx} cy={laneY} r={5.2} fill="none" stroke={P.sun} strokeWidth={1.6} opacity={0.75} />
        ))}
        <text x={turn + 4} y={LANE.y + 10} fontSize={7} fill={P.sun} style={display}>
          {t.turn}
        </text>
      </Lane>
      <Shout x={44} y={86} text={t.held} size={11} color={P.sun} rotate={-4} />
      <Hand x={180} y={58} s={0.56} hold />
    </Panel>
  );
}

function BeatPanel({ locale }: { locale: Locale }) {
  const t = PANEL[locale];
  const x0 = 16;
  const x1 = 136;
  return (
    <Panel>
      <Stage width={200} height={130} top={70} front={84} />
      <Truss width={200} lamps={[100]} />
      <Host x={40} feet={82} s={0.2} mood="static" />
      <Judge art="inspector-angry" x={156} base={72} s={0.22} />
      <Desk x0={122} x1={194} top={68} h={15} line={1.6} />
      <Shout x={104} y={36} text={t.shh} size={15} color={P.tomato} rotate={-8} />
      <Strip x={LANE.x} y={LANE.y} w={LANE.w} h={LANE.h}>
        <Static x={x0} y={LANE.y + 3} w={x1 - x0} h={LANE.h - 6} cell={3} />
        <Beats x0={LANE.hit} x1={LANE.x + LANE.w - 6} step={18} y={LANE.y} h={LANE.h} first={0} />
        <Ball x={LANE.hit + 36} y={laneY} r={7.5} fill={P.sun} opacity={0.4} />
        <Ball x={LANE.hit + 90} y={laneY} r={7.5} fill={P.sun} opacity={0.4} />
        <Ball x={LANE.hit + 126} y={laneY} r={7.5} fill={P.sun} />
        <HitRing x={LANE.hit} y={laneY} r={7.5} />
        <Rays x={LANE.hit} y={laneY} r0={12.5} r1={15} />
        <text x={(LANE.hit + 14 + x1) / 2} y={laneY + 3.5} textAnchor="middle" fontSize={10} fill={P.cream} stroke={P.ink} strokeWidth={2.4} paintOrder="stroke" style={display}>
          {t.noSignal}
        </text>
      </Strip>
    </Panel>
  );
}

export function TalentShowHowToPanel({ step, locale }: { step: 0 | 1 | 2; locale: Locale }) {
  if (step === 0) return <TapPanel locale={locale} />;
  if (step === 1) return <HoldPanel locale={locale} />;
  return <BeatPanel locale={locale} />;
}

function Spotlight({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const id = useId().replace(/:/g, "");
  const top = cy + r * 0.55;
  return (
    <>
      <defs>
        <clipPath id={`ts-disc${id}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={P.plum900} />
      <g clipPath={`url(#ts-disc${id})`}>
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={r1(cx - r + 34 + i * 24)} y={cy - r + 26} width={18} height={r * 1.4} rx={3} fill={P.plum800} opacity={0.7} />
        ))}
        <Curtain x={cx - r} w={r * 0.3} h={top} />
        <Curtain x={cx + r * 0.7} w={r * 0.3} h={top} flip />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={P.ink} strokeWidth={4} />
    </>
  );
}

function Platform({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  const depth = ry * 0.7;
  const bulbs = Array.from({ length: 9 }, (_, i) => -0.8 + i * 0.2);
  return (
    <g stroke={P.ink} strokeLinejoin="round">
      <ellipse cx={cx} cy={cy + depth} rx={rx} ry={ry} fill={P.woodDark} strokeWidth={3} />
      <rect x={cx - rx} y={cy} width={rx * 2} height={depth} fill={P.woodDark} stroke="none" />
      <path d={`M${cx - rx} ${cy} L${cx - rx} ${r1(cy + depth)} M${cx + rx} ${cy} L${cx + rx} ${r1(cy + depth)}`} strokeWidth={3} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={P.wood} strokeWidth={3} />
      <ellipse cx={cx} cy={cy - 1} rx={rx * 0.8} ry={ry * 0.6} fill="none" stroke={P.woodDeep} strokeWidth={1.4} opacity={0.7} />
      <g fill={P.sunPale} strokeWidth={1.2}>
        {bulbs.map((k) => (
          <circle key={k} cx={r1(cx + k * rx)} cy={r1(cy + depth * 0.55 + ry * Math.sqrt(1 - k * k))} r={2.2} />
        ))}
      </g>
    </g>
  );
}

function CastIntro() {
  return (
    <>
      <Spotlight cx={150} cy={100} r={92} />
      <Marquee x={150} y={34} s={0.17} />
      <Beam x={150} from={10} to={182} w0={4} w1={36} />
      <Platform cx={150} cy={180} rx={136} ry={14} />
      <Kid who="mila" x={56} feet={182} s={0.18} face="happy" />
      <Kid who="lina" x={104} feet={180} s={0.18} face="happy" />
      <Kid who="bruno" x={198} feet={180} s={0.18} face="normal" />
      <Host x={250} feet={184} s={0.29} mood="wave" />
      <Kid who="deco" x={150} feet={188} s={0.21} face="happy" pose="hit" />
    </>
  );
}

function CastBand({ face, pose, host }: { face: Face; pose: Pose; host: HostMood }) {
  return (
    <>
      <ellipse cx={100} cy={181} rx={84} ry={6} fill={P.ink} opacity={0.2} />
      <Kid who="lina" x={40} feet={150} s={0.17} face={face} pose={pose} />
      <Kid who="mila" x={162} feet={150} s={0.17} face={face} pose={pose} />
      <Host x={100} feet={146} s={0.27} mood={host} />
      <Kid who="deco" x={72} feet={184} s={0.21} face={face} pose={pose} />
      <Kid who="bruno" x={130} feet={182} s={0.2} face={face} pose={pose} />
    </>
  );
}

function Sunburst({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const count = 14;
  return (
    <g fill={fill}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const b = a + Math.PI / count;
        return <path key={i} d={`M${cx} ${cy} L${r1(cx + Math.cos(a) * r)} ${r1(cy + Math.sin(a) * r)} L${r1(cx + Math.cos(b) * r)} ${r1(cy + Math.sin(b) * r)} Z`} />;
      })}
    </g>
  );
}

function CastWin() {
  const id = useId().replace(/:/g, "");
  return (
    <>
      <Paddle x={22} y={40} s={0.25} score={10} tilt={-20} />
      <Paddle x={178} y={40} s={0.25} score={10} tilt={20} />
      <defs>
        <clipPath id={`ts-win${id}`}>
          <circle cx={100} cy={94} r={82} />
        </clipPath>
      </defs>
      <circle cx={100} cy={94} r={82} fill={P.sunPale} />
      <g clipPath={`url(#ts-win${id})`} opacity={0.55}>
        <Sunburst cx={100} cy={100} r={120} fill={P.sun} />
      </g>
      <circle cx={100} cy={94} r={82} fill="none" stroke={P.ink} strokeWidth={4} />
      <CastBand face="happy" pose="hit" host="excited" />
      <Star x={12} y={104} r={7} rotate={-12} />
      <Star x={190} y={108} r={8} rotate={14} />
      <Confetti x={70} y={6} a={-30} c={P.tomato} />
      <Confetti x={130} y={6} a={24} c={P.mint} />
      <Confetti x={6} y={146} a={60} c={P.sky} />
      <Confetti x={196} y={150} a={-40} c={P.bubblegum} />
    </>
  );
}

function CastLose() {
  const id = useId().replace(/:/g, "");
  return (
    <>
      <defs>
        <clipPath id={`ts-lose${id}`}>
          <circle cx={100} cy={94} r={82} />
        </clipPath>
      </defs>
      <circle cx={100} cy={94} r={82} fill={P.plum300} />
      <g clipPath={`url(#ts-lose${id})`} opacity={0.2}>
        <Static x={18} y={12} w={170} h={170} cell={10} />
      </g>
      <circle cx={100} cy={94} r={82} fill="none" stroke={P.ink} strokeWidth={4} />
      <CastBand face="wow" pose="ready" host="sad" />
    </>
  );
}

export function TalentShowCast({ mood, className }: { mood: "intro" | "win" | "lose"; className?: string }) {
  return (
    <svg viewBox={mood === "intro" ? "0 0 300 210" : "0 0 200 190"} className={className} aria-hidden overflow="visible">
      {mood === "intro" ? <CastIntro /> : mood === "win" ? <CastWin /> : <CastLose />}
    </svg>
  );
}
