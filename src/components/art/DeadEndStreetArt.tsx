import { DecoHead, LinaHead, type Face } from "@/components/characters/Heads";
import { P } from "@/lib/palette";

const display = { fontFamily: "var(--font-luckiest)" };
const ink = { stroke: P.ink, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

type Pt = { x: number; y: number };

export function arcPoint(from: Pt, via: Pt, to: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: Math.round((u * u * from.x + 2 * u * t * via.x + t * t * to.x) * 100) / 100,
    y: Math.round((u * u * from.y + 2 * u * t * via.y + t * t * to.y) * 100) / 100,
  };
}

export function ArcDots({ from, via, to, ts, r0 = 3.4, r1 = 2, w = 1.6 }: { from: Pt; via: Pt; to: Pt; ts: number[]; r0?: number; r1?: number; w?: number }) {
  return (
    <g>
      {ts.map((t) => {
        const { x, y } = arcPoint(from, via, to, t);
        const r = r0 - (r0 - r1) * t;
        return (
          <g key={t}>
            <circle cx={x} cy={y} r={r + w} fill={P.ink} opacity={0.9 - t * 0.3} />
            <circle cx={x} cy={y} r={r} fill={P.tangerine} />
          </g>
        );
      })}
    </g>
  );
}

export function Sparkle4({ x, y, r, fill = P.white, sw = 2.5 }: { x: number; y: number; r: number; fill?: string; sw?: number }) {
  const c = r * 0.18;
  return (
    <path
      d={`M${x} ${y - r} Q${x + c} ${y - c} ${x + r} ${y} Q${x + c} ${y + c} ${x} ${y + r} Q${x - c} ${y + c} ${x - r} ${y} Q${x - c} ${y - c} ${x} ${y - r} Z`}
      fill={fill}
      {...ink}
      strokeWidth={sw}
    />
  );
}

export function House({ x, wall, roof, w, h, peak, base = 150, sw = 3 }: { x: number; wall: string; roof: string; w: number; h: number; peak: number; base?: number; sw?: number }) {
  const top = base - h;
  return (
    <g {...ink} strokeWidth={sw}>
      <rect x={x + w * 0.66} y={top - peak * 0.55} width={w * 0.14} height={peak * 0.7} fill={P.brick} />
      <rect x={x} y={top} width={w} height={h} fill={wall} />
      <rect x={x} y={top + h - sw * 2} width={w} height={sw * 2} fill={P.ink} opacity={0.14} stroke="none" />
      <path d={`M${x - sw * 2} ${top + sw / 2} L${x + w / 2} ${top - peak} L${x + w + sw * 2} ${top + sw / 2} Z`} fill={roof} />
      <rect x={x + w * 0.14} y={top + h * 0.3} width={w * 0.24} height={h * 0.3} fill={P.sunPale} />
      <path d={`M${x + w * 0.26} ${top + h * 0.3} L${x + w * 0.26} ${top + h * 0.6} M${x + w * 0.14} ${top + h * 0.45} L${x + w * 0.38} ${top + h * 0.45}`} fill="none" strokeWidth={sw * 0.65} />
      <rect x={x + w * 0.58} y={top + h * 0.42} width={w * 0.2} height={h * 0.58} rx={sw} fill={P.wood} />
    </g>
  );
}

export function Gnome({ x, y, s, rotate = 0 }: { x: number; y: number; s: number; rotate?: number }) {
  const w = 3 / s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s}) translate(-33 -102)`} {...ink} strokeWidth={w}>
      <path d="M12 98 L14 84 L28 84 L28 98 Z M38 98 L38 84 L52 84 L54 98 Z" fill={P.woodDeep} />
      <path d="M10 88 Q10 60 33 58 Q56 60 56 88 Z" fill={P.skyDeep} />
      <path d="M18 74 L48 74" />
      <rect x="29" y="70" width="8" height="8" fill={P.sun} strokeWidth={w * 0.75} />
      <path d="M14 46 Q14 72 33 76 Q52 72 52 46 Z" fill={P.white} />
      <circle cx="33" cy="42" r="14" fill={P.skinLight} />
      <circle cx="26" cy="40" r="2.6" fill={P.ink} stroke="none" />
      <circle cx="40" cy="40" r="2.6" fill={P.ink} stroke="none" />
      <circle cx="33" cy="48" r="5" fill={P.blush} />
      <path d="M14 36 L33 2 L52 36 Q33 30 14 36 Z" fill={P.tomato} />
      <path d="M24 22 Q30 14 34 8" stroke={P.blush} strokeWidth={w * 0.75} fill="none" />
    </g>
  );
}

export function Flamingo({ x, y, s, rotate = 0 }: { x: number; y: number; s: number; rotate?: number }) {
  const w = 3 / s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s}) translate(-38 -152)`} {...ink} strokeWidth={w}>
      <path d="M30 148 L46 148" />
      <path d="M38 148 L38 92" />
      <path d="M38 120 L50 112 L40 108" fill="none" strokeWidth={w * 0.8} />
      <path d="M10 70 Q8 50 30 48 Q56 46 66 66 Q62 92 36 96 Q12 94 10 70 Z" fill={P.bubblegum} />
      <path d="M60 64 Q60 86 38 94 Q56 78 52 60 Z" fill={P.bubblegumDeep} stroke="none" />
      <path d="M20 66 Q32 58 46 66 Q36 78 20 66 Z" fill={P.bubblegumDeep} />
      <path d="M16 56 Q8 36 18 20 Q30 6 40 16" fill="none" strokeWidth={w * 3.4} />
      <path d="M16 56 Q8 36 18 20 Q30 6 40 16" fill="none" stroke={P.bubblegum} strokeWidth={w * 1.6} />
      <circle cx="36" cy="14" r="10" fill={P.bubblegum} />
      <path d="M42 10 L58 14 Q60 22 50 24 L44 20 Z" fill={P.white} />
      <path d="M52 16 L58 14 Q60 22 50 24 Z" fill={P.ink} />
      <circle cx="34" cy="11" r="2.4" fill={P.ink} stroke="none" />
    </g>
  );
}

export function ShoeArt({ x, y, s, rotate = 0 }: { x: number; y: number; s: number; rotate?: number }) {
  const w = 3 / s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s}) translate(-42 -25)`} {...ink} strokeWidth={w}>
      <path d="M6 34 Q4 14 18 10 L34 8 Q40 22 56 24 Q76 26 80 36 L80 40 L6 40 Z" fill={P.tomato} />
      <path d="M4 38 L80 38 Q82 46 74 46 L10 46 Q2 46 4 38 Z" fill={P.white} />
      <path d="M38 14 L46 22 M44 12 L52 20" stroke={P.white} />
      <path d="M12 18 Q16 14 22 14" stroke={P.blush} fill="none" />
      <path d="M60 30 Q68 30 74 34" stroke={P.tomatoDeep} fill="none" strokeWidth={w * 0.75} />
    </g>
  );
}

export function DuckArt({ x, y, s, rotate = 0 }: { x: number; y: number; s: number; rotate?: number }) {
  const w = 3 / s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s}) translate(-38 -34)`} {...ink} strokeWidth={w}>
      <path d="M8 44 Q6 30 20 30 L30 30 Q22 20 28 10 Q38 0 52 6 Q62 12 58 26 Q72 28 72 44 Q72 62 44 62 L26 62 Q8 62 8 44 Z" fill={P.sun} />
      <path d="M58 30 Q70 34 68 48 Q62 58 46 60 Q64 46 58 30 Z" fill={P.sunDeep} stroke="none" />
      <path d="M54 16 Q68 14 72 20 Q66 26 56 24 Z" fill={P.tangerine} />
      <circle cx="44" cy="14" r="4" fill={P.ink} stroke="none" />
      <circle cx="45" cy="13" r="1.4" fill={P.white} stroke="none" />
      <path d="M20 42 Q30 36 40 44 Q30 52 20 42 Z" fill={P.sunDeep} />
    </g>
  );
}

export function Kid({ who, x, y, size, face = "happy", rotate = 0 }: { who: "deco" | "lina"; x: number; y: number; size: number; face?: Face; rotate?: number }) {
  const Head = who === "deco" ? DecoHead : LinaHead;
  const h = size * 1.11;
  return (
    <g transform={`rotate(${rotate} ${x + size / 2} ${y + h / 2})`}>
      <svg x={x} y={y} width={size} height={h} viewBox="0 0 200 222" overflow="visible">
        <Head face={face} />
      </svg>
    </g>
  );
}

export function Fork({ x, y, s, pouch, tension = 0, load }: { x: number; y: number; s: number; pouch: Pt; tension?: number; load?: "shoe" | "none" }) {
  const k = 1 / s;
  const backTip = { x: -11, y: -46 };
  const frontTip = { x: 11, y: -46 };
  const hot = tension > 0.5;
  const sag = (1 - tension) * 4;
  const deg = tension > 0 ? (Math.atan2(pouch.y + 30, pouch.x) * 180) / Math.PI + 180 : 0;
  const band = (tip: Pt, color: string) => {
    const mx = (tip.x + pouch.x) / 2;
    const my = (tip.y + pouch.y) / 2 + sag;
    const d = `M${tip.x} ${tip.y} Q${mx} ${my} ${pouch.x} ${pouch.y}`;
    return (
      <>
        <path d={d} fill="none" stroke={P.ink} strokeWidth={5.6 * k * s} strokeLinecap="round" />
        <path d={d} fill="none" stroke={color} strokeWidth={2.6 * k * s} strokeLinecap="round" />
      </>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M0 0 L0 -20 L${backTip.x} ${backTip.y}`} fill="none" stroke={P.ink} strokeWidth={8.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M0 0 L0 -20 L${backTip.x} ${backTip.y}`} fill="none" stroke={P.wood} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
      {band(backTip, P.tomatoDeep)}
      <path d={`M0 -20 L${frontTip.x} ${frontTip.y}`} fill="none" stroke={P.ink} strokeWidth={8.5} strokeLinecap="round" />
      <path d={`M0 -20 L${frontTip.x} ${frontTip.y}`} fill="none" stroke={P.woodDeep} strokeWidth={4.2} strokeLinecap="round" />
      <circle cx={backTip.x} cy={backTip.y} r={3.2} fill={P.mint} stroke={P.ink} strokeWidth={1.6} />
      <circle cx={frontTip.x} cy={frontTip.y} r={3.2} fill={P.mint} stroke={P.ink} strokeWidth={1.6} />
      <circle cx={0} cy={-10} r={2.2} fill={P.steel} stroke={P.ink} strokeWidth={1.4} />
      <g transform={`translate(${pouch.x} ${pouch.y}) rotate(${deg})`}>
        <rect x={-9} y={-5.5} width={9} height={11} rx={3} fill={P.woodDeep} stroke={P.ink} strokeWidth={2} />
        <rect x={-7.5} y={-4} width={4} height={8} rx={1.5} fill={P.wood} />
      </g>
      {band(frontTip, hot ? P.sun : P.tomato)}
      {load === "shoe" && <ShoeArt x={pouch.x - 2} y={pouch.y - 8} s={0.34} rotate={tension > 0 ? -32 : -10} />}
    </g>
  );
}

export function Wagon({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="58" cy="122" rx="62" ry="4.5" fill={P.ink} opacity={0.22} />
      <path d="M12 100 Q1 100 2 88" fill="none" stroke={P.ink} strokeWidth={6.5} strokeLinecap="round" />
      <path d="M12 100 Q1 100 2 88" fill="none" stroke={P.sunDeep} strokeWidth={2.8} strokeLinecap="round" />
      <path d="M4 92 L112 92 L106 111 L10 111 Z" fill={P.tomato} {...ink} strokeWidth={3} />
      <path d="M4 92 L112 92 L111 98 L5 98 Z" fill={P.tomatoDeep} {...ink} strokeWidth={2.5} />
      <rect x={42} y={100} width={32} height={7} rx={2} fill={P.paper} {...ink} strokeWidth={2} />
      <circle cx="26" cy="113" r="8.5" fill={P.ink} />
      <circle cx="26" cy="113" r="4" fill={P.steel} stroke={P.ink} strokeWidth={1.8} />
      <circle cx="90" cy="113" r="8.5" fill={P.ink} />
      <circle cx="90" cy="113" r="4" fill={P.steel} stroke={P.ink} strokeWidth={1.8} />
    </g>
  );
}

function Backdrop() {
  return (
    <g>
      <rect width="200" height="130" fill="#82d3f7" />
      <rect y="50" width="200" height="40" fill={P.skyPale} opacity={0.55} />
      <g>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const f = (n: number) => n.toFixed(1);
          return <path key={i} d={`M${f(24 + Math.cos(a) * 12)} ${f(20 + Math.sin(a) * 12)} L${f(24 + Math.cos(a) * 16)} ${f(20 + Math.sin(a) * 16)}`} stroke={P.sunDeep} strokeWidth={2.4} strokeLinecap="round" />;
        })}
        <circle cx="24" cy="20" r="8.5" fill={P.sun} {...ink} strokeWidth={2.5} />
      </g>
      <g transform="translate(60 3) scale(0.5)">
        <path d="M30 60 Q28 44 46 44 Q52 30 68 36 Q80 26 92 40 Q108 40 104 58 Z" fill={P.white} {...ink} strokeWidth={5} />
      </g>
      {Array.from({ length: 17 }, (_, i) => i * 13 - 5).map((px) => (
        <g key={px}>
          <path d={`M${px} 97 L${px} 82 L${px + 5} 75 L${px + 10} 82 L${px + 10} 97 Z`} fill={P.cream} {...ink} strokeWidth={2} />
          <path d={`M${px + 5.5} 76 L${px + 10} 82 L${px + 10} 97 L${px + 5.5} 97 Z`} fill={P.cream2} />
          <path d={`M${px + 10} 82 L${px + 10} 97`} {...ink} strokeWidth={2} />
        </g>
      ))}
      <path d="M-3 84 L203 84 L203 88 L-3 88 Z M-3 92 L203 92 L203 96 L-3 96 Z" fill={P.wood} {...ink} strokeWidth={2} />
      <rect y="97" width="200" height="10" fill={P.lime} />
      <rect y="97" width="200" height="4" fill={P.ink} opacity={0.14} />
      <path d="M0 97 L200 97 M0 107 L200 107" stroke={P.ink} strokeWidth={2.2} />
      <rect y="107" width="200" height="23" fill="#d8a066" />
      <path d="M14 124 L28 124 M118 126 L136 126 M160 120 L176 120" stroke="#b97f45" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function Yard({ gnome, flamingo }: { gnome?: React.ReactNode; flamingo?: React.ReactNode }) {
  return (
    <g>
      <ellipse cx="158" cy="105" rx="14" ry="3" fill={P.ink} opacity={0.2} />
      <ellipse cx="184" cy="105" rx="11" ry="2.6" fill={P.ink} opacity={0.2} />
      {flamingo}
      {gnome}
    </g>
  );
}

const SVG = { viewBox: "0 0 200 130", className: "h-full w-full", "aria-hidden": true } as const;

const KIDS_Y = 66;

function Crew({ deco, lina, dy = 0 }: { deco: Face; lina: Face; dy?: number }) {
  return (
    <>
      <Kid who="deco" x={5} y={KIDS_Y - 2 + dy} size={30} face={deco} rotate={-3} />
      <Kid who="lina" x={36} y={KIDS_Y + 1 + dy} size={28} face={lina} rotate={3} />
    </>
  );
}

const GNOME = { x: 156, y: 104, s: 0.44 };
const FLAMINGO = { x: 184, y: 104, s: 0.3 };

export function DeadEndStreetHowToPanel({ step }: { step: 0 | 1 | 2 }) {
  if (step === 0) {
    return (
      <svg {...SVG}>
        <Backdrop />
        <Yard gnome={<Gnome {...GNOME} />} flamingo={<Flamingo {...FLAMINGO} />} />
        <Wagon />
        <Crew deco="normal" lina="normal" />
        <rect x={93} y={59} width={11} height={13} rx={3.5} fill="none" stroke={P.ink} strokeWidth={1.8} strokeDasharray="2.5 2.8" />
        <g transform="translate(136 52) rotate(148)">
          <path d="M0 -4.5 L16 -4.5 L16 -9.5 L30 0 L16 9.5 L16 4.5 L0 4.5 Z" fill={P.tangerine} {...ink} strokeWidth={2.6} />
          <path d="M3 -1.8 L15 -1.8" stroke={P.sunPale} strokeWidth={2} strokeLinecap="round" />
        </g>
        <Fork x={98} y={95} s={1} pouch={{ x: -22, y: -16 }} tension={0.45} load="shoe" />
        <Sparkle4 x={60} y={42} r={5} fill={P.sunPale} />
      </svg>
    );
  }
  if (step === 1) {
    const from = { x: 80, y: 78 };
    const via = { x: 116, y: -2 };
    const to = { x: 156, y: 60 };
    return (
      <svg {...SVG}>
        <Backdrop />
        <Yard gnome={<Gnome {...GNOME} />} flamingo={<Flamingo {...FLAMINGO} />} />
        <Wagon />
        <Crew deco="happy" lina="wow" />
        <ArcDots from={from} via={via} to={to} ts={[0.16, 0.28, 0.4, 0.52, 0.64, 0.76, 0.88, 0.98]} />
        <Fork x={98} y={95} s={1} pouch={{ x: -18, y: -17 }} tension={0.65} load="shoe" />
        <Sparkle4 x={172} y={36} r={5} fill={P.sunPale} />
      </svg>
    );
  }
  return (
    <svg {...SVG}>
      <Backdrop />
      <Yard flamingo={<Flamingo {...FLAMINGO} x={183} rotate={6} />} />
      <path d="M178 50 Q184 48 188 52 M174 56 Q184 54 192 59" fill="none" stroke={P.ink} strokeWidth={2} strokeLinecap="round" />
      <Wagon />
      <Crew deco="happy" lina="wow" dy={-2} />
      <Fork x={98} y={95} s={1} pouch={{ x: 0, y: -30 }} tension={0} />
      <Gnome x={158} y={97} s={0.44} rotate={32} />
      <path d="M147 48 L153 57 L162 53 L159 63 L168 68 L157 70 L157 80 L150 72 L142 80 L142 69 L133 65 L142 61 L139 51 L146 55 Z" fill={P.sun} {...ink} strokeWidth={2.3} />
      <g fill={P.tomato} {...ink} strokeWidth={1.8}>
        <path d="M170 44 L177 39 L177 48 Z" />
        <path d="M178 70 L186 67 L184 76 Z" fill={P.skyDeep} />
        <path d="M160 36 L166 31 L167 39 Z" fill={P.white} />
      </g>
      <ShoeArt x={134} y={64} s={0.34} rotate={24} />
      <path d="M110 52 L121 56 M106 63 L118 64 M114 42 L122 48" stroke={P.ink} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M146 102 Q140 101 142 95 Q145 90 150 93 Q154 88 159 93 Q165 93 164 99 Q164 103 158 103 Z" fill={P.cream} {...ink} strokeWidth={2} />
      <text x="168" y="30" textAnchor="middle" fontSize="15" fill={P.sun} stroke={P.ink} strokeWidth={4} paintOrder="stroke" strokeLinejoin="round" style={display}>
        +100
      </text>
    </svg>
  );
}
