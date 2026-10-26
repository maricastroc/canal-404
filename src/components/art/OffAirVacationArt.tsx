import type React from "react";
import { DecoHead, type Face } from "@/components/characters/Heads";
import { FOLKS, FOLK_VIEWBOX, type FolkId, type FolkMood } from "@/components/characters/ResortFolks";
import { P } from "@/lib/palette";

const display = { fontFamily: "var(--font-luckiest)" };
const ink = { stroke: P.ink, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const SAND = "#f3d38f";
const SAND_DEEP = "#d9ae62";

function Folk({ id, x, y, h, mood = "normal", flip = false }: { id: FolkId; x: number; y: number; h: number; mood?: FolkMood; flip?: boolean }) {
  const [vw, vh] = FOLK_VIEWBOX[id];
  const w = (h * vw) / vh;
  const Comp = FOLKS[id] as (props: { mood?: FolkMood }) => React.JSX.Element;
  return (
    <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${vw} ${vh}`} overflow="visible">
      <g transform={flip ? `translate(${vw} 0) scale(-1 1)` : undefined}>
        <Comp mood={mood} />
      </g>
    </svg>
  );
}

function Deco({ x, y, size, face = "happy", rotate = 0, view = "front" }: { x: number; y: number; size: number; face?: Face; rotate?: number; view?: "front" | "side" | "back" }) {
  const h = size * 1.11;
  return (
    <g transform={`rotate(${rotate} ${x + size / 2} ${y + h / 2})`}>
      <svg x={x} y={y} width={size} height={h} viewBox="0 0 200 222" overflow="visible">
        <DecoHead face={face} view={view} />
      </svg>
    </g>
  );
}

function Palm({ x, y, h, lean = 0, flip = false }: { x: number; y: number; h: number; lean?: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  const tx = x + lean * s;
  const ty = y - h;
  const frond = (a: number, len: number, color: string) => {
    const r = (a * Math.PI) / 180;
    const ex = tx + Math.cos(r) * len;
    const ey = ty + Math.sin(r) * len;
    const mx = tx + Math.cos(r) * len * 0.5 + Math.cos(r - Math.PI / 2) * 10;
    const my = ty + Math.sin(r) * len * 0.5 + Math.sin(r - Math.PI / 2) * 10 - 6;
    const nx = tx + Math.cos(r) * len * 0.5 + Math.cos(r + Math.PI / 2) * 7;
    const ny = ty + Math.sin(r) * len * 0.5 + Math.sin(r + Math.PI / 2) * 7;
    return <path d={`M${tx} ${ty} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} Q${nx.toFixed(1)} ${ny.toFixed(1)} ${tx} ${ty} Z`} fill={color} {...ink} strokeWidth={3} />;
  };
  return (
    <g>
      <path d={`M${x - 6} ${y} Q${x + lean * s * 0.2} ${y - h * 0.5} ${tx - 4} ${ty} L${tx + 4} ${ty} Q${x + lean * s * 0.2 + 10} ${y - h * 0.5} ${x + 6} ${y} Z`} fill={P.wood} {...ink} strokeWidth={3} />
      {[0.25, 0.45, 0.65, 0.85].map((k) => (
        <path key={k} d={`M${x - 5 + (tx - x) * k} ${y - h * k} l10 -2`} stroke={P.woodDeep} strokeWidth="2.5" />
      ))}
      {frond(200, 44, P.leaf)}
      {frond(-20, 44, P.leaf)}
      {frond(240, 40, P.lime)}
      {frond(-60, 40, P.lime)}
      {frond(160, 36, P.leafDeep)}
      {frond(20, 36, P.leafDeep)}
      <circle cx={tx - 4} cy={ty + 4} r="4.5" fill={P.woodDark} {...ink} strokeWidth={2} />
      <circle cx={tx + 5} cy={ty + 5} r="4.5" fill={P.woodDark} {...ink} strokeWidth={2} />
    </g>
  );
}

function Waves({ y, from = 0, to = 320, color = P.white }: { y: number; from?: number; to?: number; color?: string }) {
  const parts = [];
  for (let x = from; x < to; x += 46) parts.push(<path key={x} d={`M${x} ${y} q8 -6 16 0 q8 6 16 0`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.8" />);
  return <g>{parts}</g>;
}

function Hotel({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="16" width="118" height="70" fill={P.cream} {...ink} />
      <path d="M-8 18 L59 -10 L126 18 Z" fill={P.bubblegum} {...ink} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => <rect key={`${r}-${c}`} x={10 + c * 26} y={28 + r * 18} width="16" height="11" rx="2" fill={(r + c) % 3 ? P.skyPale : P.sunPale} stroke={P.ink} strokeWidth="2.5" />),
      )}
      <rect x="22" y="-30" width="74" height="22" rx="5" fill={P.plum800} {...ink} strokeWidth={3} />
      <text x="59" y="-14" textAnchor="middle" fontSize="13" fill={P.sun} style={display} letterSpacing="1">
        RESORT 404
      </text>
      <path d="M40 -8 L40 -2 M78 -8 L78 -2" stroke={P.ink} strokeWidth="3" />
    </g>
  );
}

function Antenna({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 L-16 64 M0 0 L16 64 M-11 44 L11 44 M-7 26 L7 26" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
      <circle cx="0" cy="-2" r="6" fill={P.tomato} {...ink} strokeWidth={3} />
      <g fill="none" stroke={P.screen} strokeWidth="3.5" strokeLinecap="round">
        <path d="M-14 -12 Q-20 -2 -14 8" />
        <path d="M14 -12 Q20 -2 14 8" />
        <path d="M-24 -20 Q-34 -2 -24 16" opacity="0.7" />
        <path d="M24 -20 Q34 -2 24 16" opacity="0.7" />
      </g>
    </g>
  );
}

export function OffAirVacationCoverArt() {
  return (
    <>
      <rect width="320" height="120" fill={P.sky} />
      <rect y="70" width="320" height="50" fill={P.skyPale} />
      <circle cx="252" cy="62" r="30" fill={P.sunPale} stroke={P.sun} strokeWidth="6" />
      <g fill={P.white} opacity="0.9">
        <ellipse cx="70" cy="30" rx="26" ry="9" />
        <ellipse cx="88" cy="24" rx="18" ry="9" />
        <ellipse cx="190" cy="40" rx="20" ry="7" />
      </g>
      <rect y="112" width="320" height="44" fill={P.skyDeep} />
      <path d="M0 112 L320 112" stroke={P.ink} strokeWidth="3" />
      <Waves y={126} from={6} />
      <Waves y={142} from={28} />
      <path d="M0 158 Q60 146 130 152 Q210 160 320 148 L320 240 L0 240 Z" fill={SAND} stroke={P.ink} strokeWidth="3" />
      <path d="M0 214 Q120 204 320 218" fill="none" stroke={SAND_DEEP} strokeWidth="3" opacity="0.7" />
      <Hotel x={16} y={74} />
      <Antenna x={292} y={92} />
      <Palm x={150} y={176} h={92} lean={-14} />
      <Palm x={300} y={196} h={84} lean={18} />
      <g transform="translate(232 142)">
        <path d="M0 0 L0 -54" stroke={P.ink} strokeWidth="4" />
        <path d="M-40 -40 Q0 -78 40 -40 Z" fill={P.tomato} {...ink} strokeWidth={3} />
        <path d="M-14 -40 Q0 -76 14 -40" fill={P.white} stroke={P.ink} strokeWidth="2.5" />
      </g>
      <Folk id="marisa" x={196} y={124} h={84} mood="happy" flip />
      <Folk id="bigodes" x={4} y={150} h={92} mood="look" />
      <Deco x={92} y={110} size={126} face="wow" rotate={-4} />
      <g transform="translate(262 182) rotate(8)">
        <rect x="-26" y="-20" width="52" height="40" rx="7" fill={P.plum700} {...ink} strokeWidth={3} />
        <rect x="-19" y="-13" width="38" height="26" rx="4" fill={P.screen} stroke={P.ink} strokeWidth="2.5" />
        <path d="M-14 -4 L-4 -4 M2 4 L14 4 M-10 6 L-2 6 M4 -6 L12 -6" stroke={P.ink} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <path d="M-10 20 L-14 30 M10 20 L14 30" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
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
        <path d="M0 0 Q20 -26 46 -18 Q22 -12 0 0 Z" fill={P.leaf} {...ink} strokeWidth={3.5} />
        <path d="M0 0 Q12 -34 34 -40 Q18 -18 0 0 Z" fill={P.lime} {...ink} strokeWidth={3.5} />
      </g>
    </svg>
  );
}

export function OffAirVacationHowToPanel({ step }: { step: 0 | 1 | 2 }) {
  const beach = (children: React.ReactNode) => (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <rect width="200" height="56" fill={P.skyPale} />
      <rect y="40" width="200" height="22" fill={P.sky} />
      <path d="M0 40 L200 40" stroke={P.ink} strokeWidth="3" />
      <Waves y={50} from={8} to={200} />
      <path d="M0 64 Q100 56 200 66 L200 130 L0 130 Z" fill={SAND} stroke={P.ink} strokeWidth="3" />
      {children}
    </svg>
  );
  if (step === 0) {
    return beach(
      <>
        <Palm x={170} y={92} h={60} lean={-10} />
        <g transform="translate(120 70) rotate(4)">
          <rect x="0" y="0" width="30" height="40" rx="3" fill={P.tangerine} {...ink} strokeWidth={3} />
          <rect x="5" y="5" width="20" height="16" fill={P.sunPale} stroke={P.ink} strokeWidth="2" />
          <text x="15" y="34" textAnchor="middle" fontSize="8" fill={P.ink} style={display}>
            404
          </text>
        </g>
        <path d="M150 58 L153 66 L161 69 L153 72 L150 80 L147 72 L139 69 L147 66 Z" fill={P.white} {...ink} strokeWidth={2} />
        <Deco x={16} y={50} size={72} face="happy" view="side" />
        <path d="M94 104 L112 104 M104 96 L112 104 L104 112" fill="none" stroke={P.ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </>,
    );
  }
  if (step === 1) {
    return beach(
      <>
        <Folk id="bigodes" x={104} y={52} h={74} mood="talk" />
        <g transform="translate(150 30)">
          <circle cx="2" cy="3" r="14" fill={P.ink} />
          <circle cx="0" cy="0" r="14" fill={P.sun} {...ink} strokeWidth={3} />
          <text x="0" y="7" textAnchor="middle" fontSize="20" fill={P.ink} style={display}>
            !
          </text>
        </g>
        <Deco x={14} y={52} size={70} face="normal" view="side" />
        <g transform="translate(76 22)">
          <rect x="0" y="0" width="34" height="30" rx="7" fill={P.sun} {...ink} strokeWidth={3} />
          <text x="17" y="23" textAnchor="middle" fontSize="20" fill={P.ink} style={display}>
            E
          </text>
        </g>
      </>,
    );
  }
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <rect width="200" height="130" fill={P.plum700} />
      <g transform="translate(22 14)">
        <rect x="4" y="6" width="156" height="104" rx="10" fill={P.ink} />
        <rect x="0" y="0" width="156" height="104" rx="10" fill={P.paper} {...ink} strokeWidth={3.5} />
        <path d="M78 6 L78 98" stroke={P.cream3} strokeWidth="3" />
        {[P.sun, P.mint, P.bubblegum, P.sky].map((c, i) => (
          <rect key={c} x={14 + i * 34} y="-10" width="28" height="14" rx="4" fill={c} {...ink} strokeWidth={2.5} />
        ))}
        <rect x="10" y="14" width="58" height="8" rx="3" fill={P.ink} opacity="0.8" />
        <g stroke={P.inkSoft} strokeWidth="3" strokeLinecap="round" opacity="0.6">
          <path d="M24 34 L66 34 M24 48 L60 48 M24 62 L64 62" />
        </g>
        <circle cx="16" cy="34" r="4" fill={P.sun} stroke={P.ink} strokeWidth="2" />
        <circle cx="16" cy="48" r="4" fill={P.cream} stroke={P.ink} strokeWidth="2" />
        <circle cx="16" cy="62" r="4" fill={P.cream} stroke={P.ink} strokeWidth="2" />
        <path d="M90 30 Q110 14 132 24 Q150 34 140 56 Q128 80 104 76 Q86 70 90 50 Z" fill={P.lime} {...ink} strokeWidth={3} />
        <path d="M96 48 Q108 40 122 50" fill="none" stroke={SAND_DEEP} strokeWidth="3" strokeDasharray="4 4" />
        <g transform="translate(124 38)">
          <path d="M0 0 C-8 -2 -10 -14 0 -16 C10 -14 8 -2 0 0 Z" transform="translate(0 4)" fill={P.tomato} {...ink} strokeWidth={2.5} />
          <circle cx="0" cy="-8" r="3" fill={P.white} />
        </g>
      </g>
    </svg>
  );
}
