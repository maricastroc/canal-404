import { ArrowBigDown } from "lucide-react";
import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import { P } from "@/lib/palette";

const display = { fontFamily: "var(--font-luckiest)" };
const ink = { stroke: P.ink, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

type Pt = { x: number; y: number };

const ART = "/assets/food-fight";
const CAM = { x: 30, y: 300, w: 1150 };
const K = 200 / CAM.w;
const U = 1 / K;

const SIZES = {
  deco: { w: 260, h: 330 },
  mila: { w: 220, h: 240 },
  rival: { w: 200, h: 250 },
  lady: { w: 220, h: 520 },
  ourTable: { w: 680, h: 210 },
  rivalTable: { w: 380, h: 170 },
  sandwich: { w: 80, h: 54 },
  apple: { w: 54, h: 60 },
  grapes: { w: 60, h: 64 },
  banana: { w: 80, h: 48 },
  pudding: { w: 76, h: 62 },
  splatPudding: { w: 180, h: 130 },
} as const;

const DECO = { x: 330, standY: 800 };
const MILA = { x: 590, y: 790 };
const OUR_TABLE = { x: 400, y: 756 };
const AMMO_X = [104, 140, 176, 212, 248, 284];
const AMMO_Y = 772;
const FRONT = { x: 1010, tableY: 790, upY: 806, scale: 0.95 };
const BACK = [
  { x: 900, tableY: 590, upY: 604, scale: 0.72 },
  { x: 1180, tableY: 590, upY: 604, scale: 0.72 },
];
const LADY = { x: 760, y: 712, scale: 0.68 };

type Food = "sandwich" | "apple" | "grapes" | "banana";

function Outline() {
  return (
    <defs>
      <filter id="ff-outline" x="-10%" y="-10%" width="120%" height="120%">
        <feMorphology in="SourceAlpha" operator="dilate" radius={3.4} result="grown" />
        <feFlood floodColor={P.ink} />
        <feComposite in2="grown" operator="in" result="edge" />
        <feMerge>
          <feMergeNode in="edge" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <clipPath id="ff-above-our-table">
        <rect x={0} y={0} width={1920} height={OUR_TABLE.y + 30} />
      </clipPath>
      <clipPath id="ff-over-our-rim">
        <rect x={0} y={0} width={1920} height={OUR_TABLE.y + 18} />
      </clipPath>
      <clipPath id="ff-above-front-table">
        <rect x={0} y={0} width={1920} height={FRONT.tableY + 20} />
      </clipPath>
      <clipPath id="ff-above-back-table">
        <rect x={0} y={0} width={1920} height={BACK[0].tableY + 16} />
      </clipPath>
    </defs>
  );
}

function Sprite({ name, x, y, w, h, ax = 0.5, ay = 1, rotate = 0, flip = false, outline = true, opacity }: { name: string; x: number; y: number; w: number; h: number; ax?: number; ay?: number; rotate?: number; flip?: boolean; outline?: boolean; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})${flip ? " scale(-1 1)" : ""}`} opacity={opacity}>
      <image href={`${ART}/${name}.svg`} x={-w * ax} y={-h * ay} width={w} height={h} filter={outline ? "url(#ff-outline)" : undefined} />
    </g>
  );
}

function FoodSprite({ food, x, y, s = 0.62, rotate = 0 }: { food: Food; x: number; y: number; s?: number; rotate?: number }) {
  const size = SIZES[food];
  return <Sprite name={food} x={x} y={y} w={size.w * s} h={size.h * s} rotate={rotate} />;
}

function Cafeteria() {
  return (
    <g>
      <image href={`${ART}/cafeteria-bg.svg`} x={0} y={0} width={1920} height={1080} />
      <image href={`${ART}/cafeteria-top.svg`} x={0} y={0} width={1920} height={110} />
      <rect x={0} y={1000} width={1920} height={120} fill={P.ink} opacity={0.06} />
    </g>
  );
}

function RivalTable({ x, tableY, scale }: { x: number; tableY: number; scale: number }) {
  const w = SIZES.rivalTable.w * scale;
  const h = SIZES.rivalTable.h * scale;
  return (
    <g>
      <ellipse cx={x} cy={tableY + h + 4} rx={w * 0.52} ry={14 * scale} fill={P.ink} opacity={0.16} />
      <Sprite name="rival-table" x={x} y={tableY} w={w} h={h} ay={0} />
    </g>
  );
}

function Rival({ kind, pose, x, upY, scale, clip }: { kind: "cap" | "speedy" | "big"; pose: "up" | "windup"; x: number; upY: number; scale: number; clip: string }) {
  const w = SIZES.rival.w * scale;
  const h = SIZES.rival.h * scale;
  return (
    <g clipPath={`url(#${clip})`}>
      <Sprite name={`rival-${kind}-1-${pose}`} x={x} y={upY} w={w} h={h} />
    </g>
  );
}

function RivalRows({ front, back }: { front: React.ReactNode; back?: React.ReactNode }) {
  return (
    <g>
      {back}
      {BACK.map((b) => (
        <RivalTable key={b.x} {...b} />
      ))}
      {front}
      <RivalTable {...FRONT} />
    </g>
  );
}

function Kid({ who, pose, drop = 0 }: { who: "deco" | "mila"; pose: string; drop?: number }) {
  const size = SIZES[who];
  const at = who === "deco" ? { x: DECO.x, y: DECO.standY } : { x: MILA.x, y: MILA.y };
  return (
    <g clipPath="url(#ff-above-our-table)">
      <Sprite name={`${who}-${pose}`} x={at.x} y={at.y + drop} w={size.w} h={size.h} />
    </g>
  );
}

function OurTable({ foods }: { foods: (Food | null)[] }) {
  return (
    <g>
      <ellipse cx={OUR_TABLE.x} cy={OUR_TABLE.y + SIZES.ourTable.h + 6} rx={SIZES.ourTable.w * 0.5} ry={16} fill={P.ink} opacity={0.18} />
      <Sprite name="our-table" x={OUR_TABLE.x} y={OUR_TABLE.y} w={SIZES.ourTable.w} h={SIZES.ourTable.h} ay={0} />
      {foods.map((f, i) => (f ? <FoodSprite key={AMMO_X[i]} food={f} x={AMMO_X[i]} y={AMMO_Y} /> : null))}
    </g>
  );
}

const DUCK = localized({
  "pt-BR": { idle: "ABAIXAR", held: "ABAIXADO" },
  en: { idle: "DUCK", held: "DUCKING" },
});

function DuckButton({ held, locale }: { held: boolean; locale: Locale }) {
  const c = { x: 150, y: 938 };
  return (
    <g>
      <circle cx={c.x + 6} cy={c.y + (held ? 6 : 12)} r={74} fill={P.ink} />
      <circle cx={c.x} cy={c.y + (held ? 4 : 0)} r={74} fill={held ? P.mint : P.sun} {...ink} strokeWidth={10} />
      <ArrowBigDown x={c.x - 30} y={c.y + (held ? 4 : 0) - 50} width={60} height={60} fill={P.cream} stroke={P.ink} strokeWidth={2.6} />
      <text x={c.x} y={c.y + (held ? 4 : 0) + 36} textAnchor="middle" fontSize={20} fill={P.ink} style={display}>
        {held ? DUCK[locale].held : DUCK[locale].idle}
      </text>
    </g>
  );
}

function Finger({ x, y, rotate = 0, press = false }: Pt & { rotate?: number; press?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${U * 1.15})`}>
      {press && <path d="M-6.4 -3 L-9.4 -5.2 M0 -6.2 L0 -9.6 M6.4 -3 L9.4 -5.2" stroke={P.ink} strokeWidth={1.2} strokeLinecap="round" />}
      <g {...ink} strokeWidth={1.1} fill={P.white}>
        <path d="M-1.9 6 L-1.9 1.2 Q-1.9 -0.8 0 -0.8 Q1.9 -0.8 1.9 1.2 L1.9 6" />
        <path d="M-1.9 6 Q-6.2 5.4 -5.6 9 L-4.6 12.6 Q-4 15.6 -0.6 15.6 L3.6 15.6 Q6.6 15.6 6.6 12.4 L6.6 8.2 Q6.6 6.2 4.6 6.4 Q4.4 4.6 2.6 5 Q1.9 5 1.9 6 Z" />
        <path d="M4.6 6.4 L4.6 9 M1.9 6 L1.9 9" fill="none" strokeWidth={0.8} />
        <rect x={-3.6} y={15.4} width={9.4} height={3.4} rx={1} fill={P.sky} />
      </g>
    </g>
  );
}

function Lines({ d, w = 1.4 }: { d: string; w?: number }) {
  return <path d={d} fill="none" stroke={P.ink} strokeWidth={w * U} strokeLinecap="round" />;
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <Outline />
      <g transform={`scale(${K}) translate(${-CAM.x} ${-CAM.y})`}>
        <Cafeteria />
        {children}
      </g>
    </svg>
  );
}

function arc(from: Pt, via: Pt, to: Pt, t: number): Pt {
  const u = 1 - t;
  return { x: Math.round(u * u * from.x + 2 * u * t * via.x + t * t * to.x), y: Math.round(u * u * from.y + 2 * u * t * via.y + t * t * to.y) };
}

const HAND = { x: 440, y: 594 };

function AimPanel() {
  const face = { x: FRONT.x, y: FRONT.upY - 150 * FRONT.scale };
  const from = { x: HAND.x + 40, y: HAND.y - 40 };
  const via = { x: 760, y: 340 };
  const dots = Array.from({ length: 9 }, (_, i) => 0.12 + i * 0.085).map((t) => arc(from, via, face, t));
  const ring = 96;
  return (
    <Stage>
      <RivalRows
        back={<Rival kind="speedy" pose="up" x={BACK[1].x} upY={BACK[1].upY} scale={BACK[1].scale} clip="ff-above-back-table" />}
        front={<Rival kind="cap" pose="up" x={FRONT.x} upY={FRONT.upY} scale={FRONT.scale} clip="ff-above-front-table" />}
      />
      <Kid who="mila" pose="shout" />
      <Kid who="deco" pose="throw" />
      <OurTable foods={["grapes", "apple", "banana", "grapes", "apple", null]} />
      <FoodSprite food="sandwich" x={HAND.x + 6} y={HAND.y - 4} s={0.9} rotate={-18} />
      {dots.map((p, i) => (
        <g key={`${p.x}-${p.y}`}>
          <circle cx={p.x} cy={p.y} r={(1.9 - i * 0.08) * U + 1.1 * U} fill={P.ink} />
          <circle cx={p.x} cy={p.y} r={(1.9 - i * 0.08) * U} fill={P.white} />
        </g>
      ))}
      <circle cx={face.x} cy={face.y} r={ring} fill="none" stroke={P.ink} strokeWidth={3.4 * U} />
      <circle cx={face.x} cy={face.y} r={ring} fill="none" stroke={P.sun} strokeWidth={1.8 * U} strokeDasharray={`${4 * U} ${3 * U}`} />
      <Finger x={face.x + 78} y={face.y + 70} rotate={-34} press />
    </Stage>
  );
}

function DuckPanel({ locale }: { locale: Locale }) {
  const pudding = { x: 470, y: 560 };
  const from = { x: FRONT.x - 70, y: FRONT.upY - 210 * FRONT.scale };
  return (
    <Stage>
      <Sprite name="splat-pudding" x={170} y={612} w={SIZES.splatPudding.w * 0.8} h={SIZES.splatPudding.h * 0.8} ay={0.5} rotate={-12} outline={false} opacity={0.9} />
      <RivalRows
        back={<Rival kind="big" pose="up" x={BACK[0].x} upY={BACK[0].upY} scale={BACK[0].scale} clip="ff-above-back-table" />}
        front={<Rival kind="cap" pose="windup" x={FRONT.x} upY={FRONT.upY} scale={FRONT.scale} clip="ff-above-front-table" />}
      />
      <Kid who="mila" pose="peek" drop={66} />
      <Kid who="deco" pose="idle" drop={142} />
      <OurTable foods={["grapes", "apple", null, null, null, null]} />
      <path d={`M${from.x} ${from.y} Q${(from.x + pudding.x) / 2 + 60} ${from.y - 150} ${pudding.x + 110} ${pudding.y - 22}`} fill="none" stroke={P.white} strokeWidth={2 * U} strokeLinecap="round" strokeDasharray={`0.1 ${4.4 * U}`} />
      <Lines d={`M${pudding.x + 92} ${pudding.y - 52} L${pudding.x + 190} ${pudding.y - 78} M${pudding.x + 104} ${pudding.y} L${pudding.x + 214} ${pudding.y - 8} M${pudding.x + 90} ${pudding.y + 48} L${pudding.x + 176} ${pudding.y + 58}`} w={1.6} />
      <circle cx={pudding.x} cy={pudding.y} r={84} fill="none" stroke={P.ink} strokeWidth={3.6 * U} />
      <circle cx={pudding.x} cy={pudding.y} r={84} fill="none" stroke={P.tomato} strokeWidth={2 * U} />
      <Sprite name="pudding" x={pudding.x} y={pudding.y} w={SIZES.pudding.w * 1.75} h={SIZES.pudding.h * 1.75} ay={0.5} rotate={-24} />
      <g transform={`translate(${DECO.x + 96} ${OUR_TABLE.y - 66}) rotate(16)`}>
        <path d="M0 -38 Q-14 -14 0 -6 Q14 -14 0 -38 Z" fill={P.sky} {...ink} strokeWidth={1.1 * U} />
      </g>
      <g transform={`translate(${MILA.x + 84} ${OUR_TABLE.y - 120}) rotate(18)`}>
        <path d="M0 -38 Q-14 -14 0 -6 Q14 -14 0 -38 Z" fill={P.sky} {...ink} strokeWidth={1.1 * U} />
      </g>
      <DuckButton held locale={locale} />
      <Finger x={222} y={1002} rotate={-56} />
    </Stage>
  );
}

function sparkle(x: number, y: number, r: number) {
  const c = r * 0.2;
  return <path key={`${x}-${y}`} d={`M${x} ${y - r} Q${x + c} ${y - c} ${x + r} ${y} Q${x + c} ${y + c} ${x} ${y + r} Q${x - c} ${y + c} ${x - r} ${y} Q${x - c} ${y - c} ${x} ${y - r} Z`} fill={P.sunPale} {...ink} strokeWidth={1.1 * U} />;
}

const MILA_SKIN = "#f6dcc4";

function MilaArm({ hand }: { hand: Pt }) {
  const from = { x: MILA.x - 46, y: OUR_TABLE.y + 40 };
  const d = `M${from.x} ${from.y} Q${from.x - 6} ${hand.y + 20} ${hand.x + 12} ${hand.y + 6}`;
  return (
    <g>
      <g clipPath="url(#ff-over-our-rim)">
        <path d={d} fill="none" stroke={P.ink} strokeWidth={6.6 * U} strokeLinecap="round" />
        <path d={d} fill="none" stroke={MILA_SKIN} strokeWidth={4.2 * U} strokeLinecap="round" />
      </g>
      <FoodSprite food="sandwich" x={hand.x - 18} y={hand.y + 10} s={0.95} rotate={-12} />
      <g transform={`translate(${hand.x} ${hand.y})`}>
        <path d="M-14 -4 Q-16 -18 -2 -18 L10 -16 Q20 -14 18 0 L16 12 Q12 20 0 18 L-10 16 Q-16 10 -14 -4 Z" fill={MILA_SKIN} {...ink} strokeWidth={1.1 * U} />
        <path d="M-10 -6 L4 -6 M-10 4 L4 4" fill="none" {...ink} strokeWidth={0.7 * U} />
      </g>
    </g>
  );
}

function ReloadPanel({ locale }: { locale: Locale }) {
  return (
    <Stage>
      <g>
        <ellipse cx={LADY.x} cy={LADY.y + 4} rx={70} ry={12} fill={P.ink} opacity={0.14} />
        <Sprite name="lunch-lady-angry" x={LADY.x} y={LADY.y} w={SIZES.lady.w * LADY.scale} h={SIZES.lady.h * LADY.scale} />
        <g transform={`translate(${LADY.x} ${LADY.y - SIZES.lady.h * LADY.scale - 58})`}>
          <circle r={42} fill={P.paper} {...ink} strokeWidth={1.6 * U} />
          <circle r={27} fill="none" stroke={P.tomato} strokeWidth={10} />
          <path d="M-19 -19 L19 19" stroke={P.tomato} strokeWidth={10} strokeLinecap="round" />
        </g>
      </g>
      <RivalRows
        back={<Rival kind="speedy" pose="up" x={BACK[1].x} upY={BACK[1].upY} scale={BACK[1].scale} clip="ff-above-back-table" />}
        front={<Rival kind="cap" pose="up" x={FRONT.x} upY={FRONT.upY} scale={FRONT.scale} clip="ff-above-front-table" />}
      />
      <Kid who="deco" pose="idle" drop={142} />
      <Kid who="mila" pose="peek" drop={66} />
      <OurTable foods={["grapes", "apple", "sandwich", "banana", "apple", null]} />
      <MilaArm hand={{ x: 474, y: 694 }} />
      <Lines d={`M${DECO.x + 70} ${OUR_TABLE.y - 120} Q${DECO.x + 96} ${OUR_TABLE.y - 150} ${DECO.x + 124} ${OUR_TABLE.y - 136}`} w={1.4} />
      {sparkle(AMMO_X[4], AMMO_Y - 70, 24)}
      {sparkle(AMMO_X[3] - 4, AMMO_Y - 96, 16)}
      {sparkle(AMMO_X[5] + 8, AMMO_Y - 92, 14)}
      <DuckButton held locale={locale} />
      <Finger x={222} y={1002} rotate={-56} />
    </Stage>
  );
}

export function FoodFightHowToPanel({ step, locale }: { step: 0 | 1 | 2; locale: Locale }) {
  if (step === 0) return <AimPanel />;
  if (step === 1) return <DuckPanel locale={locale} />;
  return <ReloadPanel locale={locale} />;
}

type CastMood = "intro" | "win" | "lose";

const CAST_POSES: Record<CastMood, { deco: string; mila: string; held: boolean; splat: boolean }> = {
  intro: { deco: "throw", mila: "shout", held: true, splat: false },
  win: { deco: "cheer", mila: "shout", held: false, splat: true },
  lose: { deco: "splat", mila: "shout", held: false, splat: true },
};

export function FoodFightCast({ mood, className }: { mood: CastMood; className?: string }) {
  const pose = CAST_POSES[mood];
  const table = { x: 455, w: 560 };
  const floor = OUR_TABLE.y + SIZES.ourTable.h - 22;
  return (
    <svg viewBox="148 440 620 540" className={className} aria-hidden overflow="visible">
      <Outline />
      <path d={`M150 ${floor - 4} Q150 ${floor - 12} 162 ${floor - 12} L754 ${floor - 12} Q766 ${floor - 12} 766 ${floor - 4} L766 ${floor + 10} Q766 ${floor + 18} 754 ${floor + 18} L162 ${floor + 18} Q150 ${floor + 18} 150 ${floor + 10} Z`} fill="#dcc394" stroke={P.ink} strokeWidth={U * 0.5} />
      <path d={`M190 ${floor + 4} L250 ${floor + 4} M640 ${floor + 6} L720 ${floor + 6}`} stroke="#c4a873" strokeWidth={6} strokeLinecap="round" />
      <ellipse cx={table.x} cy={floor + 2} rx={table.w * 0.5} ry={12} fill={P.ink} opacity={0.22} />
      <Kid who="deco" pose={pose.deco} />
      <Kid who="mila" pose={pose.mila} />
      {pose.held ? <Sprite name="pudding" x={440} y={578} w={SIZES.pudding.w * 0.95} h={SIZES.pudding.h * 0.95} rotate={-14} /> : null}
      <Sprite name="our-table" x={table.x} y={OUR_TABLE.y} w={table.w} h={SIZES.ourTable.h} ay={0} />
      <FoodSprite food="sandwich" x={226} y={AMMO_Y} s={0.85} rotate={-4} />
      <FoodSprite food="apple" x={300} y={AMMO_Y} s={0.85} />
      <FoodSprite food="grapes" x={478} y={AMMO_Y} s={0.8} />
      <FoodSprite food="banana" x={690} y={AMMO_Y} s={0.85} rotate={8} />
      {pose.splat ? <Sprite name="splat-pudding" x={380} y={AMMO_Y + 4} w={SIZES.splatPudding.w * 0.6} h={SIZES.splatPudding.h * 0.45} outline={false} /> : null}
    </svg>
  );
}
