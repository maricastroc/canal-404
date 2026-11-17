import type React from "react";
import { P } from "@/lib/palette";
import { BrunoFigure, type BrunoFace, type BrunoPose } from "./BrunoFigure";

const display = { fontFamily: "var(--font-luckiest)" };
const ART = "/assets/operation-recess";

const C = {
  ceiling: "#3f3170",
  ceilingEdge: "#2b2150",
  wall: "#f3e6c4",
  pilaster: "#eadbb4",
  wainscot: "#63d6c1",
  wainscotLine: "#2fa996",
  floor: "#e6dcc4",
  floorTile: "#cfc3a6",
  floorStrip: "#7b62c4",
  officeWall: "#7a2338",
  officeWainscot: "#55301e",
  carpet: "#c4352c",
};

type Kind = "hero" | "mon" | "kid";
const REF = {
  hero: { w: 300, h: 214, cx: 146, feet: 206, tall: 191 },
  mon: { w: 260, h: 256, cx: 130, feet: 255, tall: 254 },
  kid: { w: 150, h: 212, cx: 75, feet: 210, tall: 200 },
} as const;

type At = { x: number; feet: number; h: number; flip?: boolean };

function Figure({ kind, name, at, shadow = true, lift = 0 }: { kind: Kind; name: string; at: At; shadow?: boolean; lift?: number }) {
  const r = REF[kind];
  const s = at.h / r.tall;
  return (
    <g>
      {shadow && <ellipse cx={at.x} cy={at.feet + lift} rx={at.h * (lift ? 0.2 : 0.27)} ry={at.h * 0.05} fill={P.ink} opacity={lift ? 0.14 : 0.26} />}
      <g transform={`translate(${at.x} ${at.feet}) scale(${at.flip ? -s : s} ${s}) translate(${-r.cx} ${-r.feet})`}>
        <image href={`${ART}/${name}.svg`} width={r.w} height={r.h} />
      </g>
    </g>
  );
}

function Hero({ pose, face, at, lift = 0 }: { pose: BrunoPose; face: BrunoFace; at: At; lift?: number }) {
  return (
    <g>
      <ellipse cx={at.x} cy={at.feet + lift} rx={at.h * (lift ? 0.2 : 0.27)} ry={at.h * 0.05} fill={P.ink} opacity={lift ? 0.14 : 0.26} />
      <BrunoFigure pose={pose} face={face} x={at.x} feet={at.feet} h={at.h} flip={at.flip} />
    </g>
  );
}

function Prop({ name, x, bottom, h, w0, h0, flip = false, opacity }: { name: string; x: number; bottom: number; h: number; w0: number; h0: number; flip?: boolean; opacity?: number }) {
  const w = (h * w0) / h0;
  return (
    <g transform={flip ? `translate(${2 * x} 0) scale(-1 1)` : undefined} opacity={opacity}>
      <image href={`${ART}/${name}.svg`} x={x - w / 2} y={bottom - h} width={w} height={h} />
    </g>
  );
}

function Corridor({ w, h, ceil, wain, floor, office }: { w: number; h: number; ceil: number; wain: number; floor: number; office?: number }) {
  const sw = w / 130;
  const tile = (floor - 0) * 0 + (h - floor) / 3;
  const rows = [0, 1, 2].map((i) => floor + 2.4 * sw + i * tile);
  const cols = Math.ceil(w / (tile * 1.4)) + 1;
  const end = office ?? w;
  return (
    <g>
      <rect width={w} height={h} fill={C.wall} />
      {Array.from({ length: Math.ceil(end / (w / 4)) }, (_, i) => (
        <rect key={i} x={i * (w / 4) + w / 9} y={ceil} width={sw * 3.4} height={wain - ceil} fill={C.pilaster} />
      ))}
      <rect y={wain} width={end} height={floor - wain} fill={C.wainscot} />
      <rect y={wain - sw * 1.6} width={end} height={sw * 2.2} fill={C.wainscotLine} />
      {Array.from({ length: Math.ceil(end / (w / 5)) }, (_, i) => (
        <rect key={i} x={i * (w / 5) + sw * 3} y={wain + sw * 4} width={w / 5 - sw * 6} height={floor - wain - sw * 8} fill="none" stroke={C.wainscotLine} strokeWidth={sw * 0.9} />
      ))}
      {office !== undefined && (
        <g>
          <rect x={office} y={0} width={w - office} height={floor} fill={C.officeWall} />
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} d={`M${office + 10 + i * 14} ${ceil + 14} l5 7 l-5 7 l-5 -7 Z`} fill="#8f2d44" />
          ))}
          <rect x={office} y={wain - sw} width={w - office} height={floor - wain + sw} fill={C.officeWainscot} />
          <rect x={office} y={wain - sw * 2} width={w - office} height={sw * 2} fill={P.sun} />
          <path d={`M${office} 0 L${office} ${floor}`} stroke={P.ink} strokeWidth={sw * 1.2} />
        </g>
      )}
      <rect width={w} height={ceil} fill={C.ceiling} />
      <rect y={ceil - sw * 1.4} width={w} height={sw * 1.4} fill={C.ceilingEdge} />
      <rect y={floor} width={w} height={h - floor} fill={C.floor} />
      {rows.map((y, r) =>
        Array.from({ length: cols }, (_, c) =>
          (c + r) % 2 === 0 ? <rect key={`${r}-${c}`} x={c * tile * 1.4 - (r % 2) * tile * 0.7} y={y} width={tile * 1.4} height={tile} fill={C.floorTile} /> : null,
        ),
      )}
      {office !== undefined && <path d={`M${office + 6} ${floor + 2.4 * sw} L${w} ${floor + 2.4 * sw} L${w} ${h} L${office - 30} ${h} Z`} fill={C.carpet} opacity={0.9} />}
      <rect y={floor} width={w} height={sw * 2.4} fill={C.floorStrip} />
      <rect y={floor - sw * 1.2} width={w} height={sw * 1.4} fill={C.ceilingEdge} />
    </g>
  );
}

function Speed({ d, w }: { d: string; w: number }) {
  return <path d={d} fill="none" stroke={P.ink} strokeWidth={w} strokeLinecap="round" />;
}

function Stars({ x, y, s }: { x: number; y: number; s: number }) {
  const star = "M0 -6 L1.8 -1.8 L6 -1.6 L2.8 1.2 L3.8 5.6 L0 3.2 L-3.8 5.6 L-2.8 1.2 L-6 -1.6 L-1.8 -1.8 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[
        [-9, 0],
        [0, -5],
        [9, 0],
      ].map(([dx, dy]) => (
        <path key={dx} d={star} transform={`translate(${dx} ${dy})`} fill={P.sun} stroke={P.ink} strokeWidth={1.4} strokeLinejoin="round" />
      ))}
    </g>
  );
}

function Panel({ children, office }: { children: React.ReactNode; office?: number }) {
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <Corridor w={200} h={130} ceil={12} wain={74} floor={100} office={office} />
      {children}
    </svg>
  );
}

function RunPanel() {
  const bruno: At = { x: 98, feet: 84, h: 52 };
  const ground = 118;
  return (
    <Panel>
      <Prop name="hall-light" x={56} bottom={30} h={18} w0={140} h0={100} />
      <Prop name="hall-light" x={156} bottom={30} h={18} w0={140} h0={100} />
      <Prop name="poster-norun" x={136} bottom={64} h={34} w0={180} h0={230} />
      <Prop name="lockers-a" x={30} bottom={102} h={58} w0={342} h0={244} />
      <Prop name="door-class-a" x={170} bottom={102} h={64} w0={180} h0={276} />
      <ellipse cx={104} cy={ground + 1} rx={22} ry={3.4} fill="#9fd6f2" stroke={P.ink} strokeWidth={1.1} opacity={0.9} />
      <Prop name="cone" x={104} bottom={ground + 1} h={24} w0={90} h0={130} />
      <path d={`M36 ${ground - 2} Q98 34 168 ${ground - 2}`} fill="none" stroke={P.ink} strokeWidth={1.4} strokeLinecap="round" strokeDasharray="0.1 4" opacity={0.6} />
      <ellipse cx={36} cy={ground} rx={9} ry={2} fill={P.ink} opacity={0.16} />
      <Speed d="M80 50 L70 51 M78 60 L66 61 M80 70 L70 71" w={1.4} />
      <Figure kind="hero" name="hero-jump" at={bruno} lift={ground - bruno.feet} />
      <path d="M30 116 Q26 110 31 108 Q34 104 38 108 Q43 107 42 113 Z" fill={P.white} stroke={P.ink} strokeWidth={1.1} strokeLinejoin="round" />
    </Panel>
  );
}

function AttackPanel() {
  const bruno: At = { x: 66, feet: 122, h: 66 };
  const mon: At = { x: 146, feet: 122, h: 86 };
  const s = bruno.h / REF.hero.tall;
  const tip = { x: Math.round((bruno.x + (291 - REF.hero.cx) * s) * 10) / 10, y: Math.round((bruno.feet - (REF.hero.feet - 123) * s) * 10) / 10 };
  return (
    <Panel>
      <Prop name="poster-quiet" x={102} bottom={54} h={34} w0={140} h0={180} />
      <Prop name="door-class-b" x={30} bottom={102} h={66} w0={180} h0={276} />
      <Prop name="locker-bank" x={176} bottom={102} h={52} w0={250} h0={242} />
      <g opacity={0.9}>
        <Prop name="slash" x={tip.x - 18} bottom={tip.y + 22} h={44} w0={220} h0={200} />
      </g>
      <Prop name="pow" x={tip.x + 4} bottom={tip.y + 20} h={40} w0={120} h0={120} />
      <Figure kind="mon" name="mon-common-hurt" at={mon} />
      <Figure kind="hero" name="hero-attack-b" at={bruno} />
      <Speed d={`M${mon.x + 30} ${mon.feet - 70} L${mon.x + 40} ${mon.feet - 74} M${mon.x + 32} ${mon.feet - 58} L${mon.x + 44} ${mon.feet - 58}`} w={1.4} />
      <g style={display} transform={`translate(${tip.x + 8} ${tip.y - 22}) rotate(-10)`}>
        <text textAnchor="middle" fontSize="12" fill={P.sun} stroke={P.ink} strokeWidth="3.4" paintOrder="stroke" strokeLinejoin="round">
          PÁ!
        </text>
      </g>
    </Panel>
  );
}

function AdvancePanel() {
  const bruno: At = { x: 112, feet: 120, h: 50 };
  return (
    <Panel office={134}>
      <Prop name="hall-light" x={40} bottom={28} h={16} w0={140} h0={100} />
      <Prop name="lockers-a" x={34} bottom={102} h={52} w0={342} h0={244} />
      <Prop name="office-door" x={170} bottom={102} h={74} w0={220} h0={300} />
      <path d="M150 34 L144 26 M190 34 L196 26 M170 26 L170 18" stroke={P.sun} strokeWidth={2.2} strokeLinecap="round" />
      <Figure kind="mon" name="mon-whistle-hurt" at={{ x: 22, feet: 110, h: 46 }} />
      <Stars x={20} y={62} s={0.62} />
      <Figure kind="mon" name="mon-common-hurt" at={{ x: 54, feet: 114, h: 48 }} />
      <Stars x={52} y={64} s={0.62} />
      <Speed d="M88 88 L76 89 M86 98 L72 99 M88 108 L78 109" w={1.4} />
      <Figure kind="hero" name="hero-run-a" at={bruno} />
    </Panel>
  );
}

export function OperationRecessHowToPanel({ step }: { step: 0 | 1 | 2 }) {
  if (step === 0) return <RunPanel />;
  if (step === 1) return <AttackPanel />;
  return <AdvancePanel />;
}

function DirectionSign({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -20 L0 -4" stroke={P.ink} strokeWidth="3" />
      <path d="M-46 -4 L36 -4 L52 12 L36 28 L-46 28 Z" transform="translate(3 3)" fill={P.ink} />
      <path d="M-46 -4 L36 -4 L52 12 L36 28 L-46 28 Z" fill={P.tomato} stroke={P.ink} strokeWidth="3.4" strokeLinejoin="round" />
      <text x={-4} y={19.5} textAnchor="middle" fontSize="15" fill={P.sun} style={display}>
        DIREÇÃO
      </text>
    </g>
  );
}

export function OperationRecessCoverArt() {
  const bruno: At = { x: 84, feet: 234, h: 124 };
  const mon: At = { x: 214, feet: 212, h: 116 };
  const back: At = { x: 298, feet: 194, h: 84 };
  return (
    <>
      <Corridor w={320} h={240} ceil={20} wain={128} floor={178} />
      <ellipse cx={92} cy={70} rx={60} ry={46} fill={P.sunPale} opacity={0.35} />
      <ellipse cx={240} cy={70} rx={60} ry={46} fill={P.sunPale} opacity={0.35} />
      <Prop name="hall-light" x={92} bottom={44} h={28} w0={140} h0={100} />
      <Prop name="hall-light" x={240} bottom={44} h={28} w0={140} h0={100} />
      <Prop name="poster-quiet" x={166} bottom={110} h={52} w0={140} h0={180} />
      <Prop name="lockers-a" x={56} bottom={180} h={94} w0={342} h0={244} />
      <Prop name="door-class-b" x={170} bottom={180} h={102} w0={180} h0={276} />
      <DirectionSign x={272} y={56} s={0.72} />
      <Figure kind="mon" name="mon-shield-walk-a" at={back} />
      <Prop name="paper-pile" x={150} bottom={222} h={12} w0={120} h0={50} />
      <Figure kind="mon" name="mon-whistle-blow" at={mon} />
      <g style={display} transform={`translate(${mon.x - 6} ${mon.feet - mon.h - 6}) rotate(6)`}>
        <text textAnchor="middle" fontSize="34" fill={P.tomato} stroke={P.ink} strokeWidth="6" paintOrder="stroke" strokeLinejoin="round">
          !
        </text>
      </g>
      <path d="M44 222 Q36 214 42 210 Q46 204 52 210 Q58 208 58 216 Z M24 230 Q18 224 23 220 Q27 216 31 221 Q36 220 35 226 Z" fill={P.white} stroke={P.ink} strokeWidth={2} strokeLinejoin="round" />
      <Hero pose="charge" face="fierce" at={bruno} />
      <Speed d="M150 150 L162 148 M152 162 L166 162 M150 174 L162 176" w={2.6} />
      <Prop name="backpack" x={18} bottom={242} h={42} w0={100} h0={110} />
    </>
  );
}

const CAST_LINE = 2.4;
const FLOOR = 186;

function CastFloor() {
  const l = 8;
  const r = 292;
  const top = FLOOR;
  const b = top + 17;
  const d = `M${l + 9} ${top} L${r - 9} ${top} Q${r} ${top} ${r} ${top + 8} Q${r} ${b} ${r - 9} ${b} L${l + 9} ${b} Q${l} ${b} ${l} ${top + 8} Q${l} ${top} ${l + 9} ${top} Z`;
  const tiles: React.ReactNode[] = [];
  for (let row = 0; row < 2; row += 1) {
    for (let x = l + 10 + row * 13; x < r - 22; x += 26) tiles.push(<rect key={`${row}-${x}`} x={x} y={top + 5 + row * 6} width={13} height={6} fill={C.floorTile} />);
  }
  return (
    <g>
      <path d={d} fill={C.floor} />
      {tiles}
      <path d={`M${l + 9} ${top} L${r - 9} ${top} Q${r} ${top} ${r} ${top + 5} L${l} ${top + 5} Q${l} ${top} ${l + 9} ${top} Z`} fill={C.floorStrip} />
      <path d={d} fill="none" stroke={P.ink} strokeWidth={CAST_LINE} strokeLinejoin="round" />
    </g>
  );
}

function Shout({ x, y, text, size, color, rotate = 0 }: { x: number; y: number; text: string; size: number; color: string; rotate?: number }) {
  return (
    <g style={display} transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <text textAnchor="middle" fontSize={size} fill={color} stroke={P.ink} strokeWidth={size * 0.24} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
}

function CastIntro() {
  const bruno: At = { x: 92, feet: FLOOR + 6, h: 134 };
  const mon: At = { x: 230, feet: FLOOR + 6, h: 150, flip: true };
  return (
    <>
      <Prop name="lockers-a" x={158} bottom={FLOOR + 4} h={98} w0={342} h0={244} />
      <CastFloor />
      <Prop name="paper-pile" x={166} bottom={FLOOR + 12} h={11} w0={120} h0={50} />
      <Figure kind="mon" name="mon-whistle-blow" at={mon} />
      <Shout x={196} y={44} text="PRIII!" size={20} color={P.tomato} rotate={-8} />
      <Speed d={`M${bruno.x - 62} ${bruno.feet - 88} L${bruno.x - 78} ${bruno.feet - 87} M${bruno.x - 60} ${bruno.feet - 70} L${bruno.x - 80} ${bruno.feet - 69} M${bruno.x - 62} ${bruno.feet - 52} L${bruno.x - 76} ${bruno.feet - 51}`} w={2.2} />
      <Figure kind="hero" name="hero-run-a" at={bruno} />
    </>
  );
}

function Burst({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={P.ink} strokeWidth={CAST_LINE} />
      <path d={`M${cx} ${cy - r - 6} L${cx} ${cy - r - 13} M${cx + r * 0.78} ${cy - r * 0.78 - 4} L${cx + r * 0.78 + 6} ${cy - r * 0.78 - 10} M${cx - r * 0.78} ${cy - r * 0.78 - 4} L${cx - r * 0.78 - 6} ${cy - r * 0.78 - 10}`} stroke={P.ink} strokeWidth={CAST_LINE} strokeLinecap="round" />
    </g>
  );
}

function Bit({ x, y, a, c }: { x: number; y: number; a: number; c: string }) {
  return <rect x={x - 6} y={y - 3.5} width={12} height={7} rx={1.8} fill={c} stroke={P.ink} strokeWidth={1.6} transform={`rotate(${a} ${x} ${y})`} />;
}

function CastWin() {
  const hop = 16;
  const bruno: At = { x: 100, feet: 170 - hop, h: 150 };
  return (
    <>
      <Burst cx={100} cy={94} r={80} fill={P.sunPale} />
      <ellipse cx={100} cy={172} rx={36} ry={6} fill={P.ink} opacity={0.2} />
      <BrunoFigure pose="jump" face="thrill" x={bruno.x} feet={bruno.feet} h={bruno.h} />
      <Prop name="sticker" x={28} bottom={92} h={28} w0={64} h0={64} />
      <Prop name="sticker" x={176} bottom={140} h={20} w0={64} h0={64} />
      <Bit x={22} y={128} a={30} c={P.tomato} />
      <Bit x={180} y={70} a={-35} c={P.mint} />
      <Bit x={160} y={24} a={20} c={P.bubblegum} />
      <Bit x={40} y={30} a={-20} c={P.sky} />
    </>
  );
}

function CastLose() {
  const bruno: At = { x: 100, feet: 172, h: 146 };
  return (
    <>
      <Burst cx={100} cy={94} r={80} fill="#ffc9c2" />
      <Figure kind="hero" name="hero-hurt" at={bruno} />
      <Prop name="wave" x={180} bottom={130} h={74} w0={90} h0={120} flip />
      <Shout x={166} y={40} text="PRIII!" size={22} color={P.tomato} rotate={10} />
      <Stars x={112} y={24} s={1.9} />
    </>
  );
}

export function OperationRecessCast({ mood, className }: { mood: "intro" | "win" | "lose"; className?: string }) {
  return (
    <svg viewBox={mood === "intro" ? "0 0 300 210" : "0 0 200 190"} className={className} aria-hidden overflow="visible">
      {mood === "intro" ? <CastIntro /> : mood === "win" ? <CastWin /> : <CastLose />}
    </svg>
  );
}
