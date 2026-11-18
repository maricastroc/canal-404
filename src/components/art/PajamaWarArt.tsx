import type React from "react";
import { BiaHead, LiaHead, NicoHead, type PajamaFace } from "@/components/characters/PajamaKids";
import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import { P } from "@/lib/palette";
import { Feather, Pillow } from "./PajamaWarProps";

const display = { fontFamily: "var(--font-luckiest)" };
const LAST_STANDING = localized({ "pt-BR": "ÚLTIMO DE PÉ!", en: "LAST ONE STANDING!" });
const HEADS = { lia: LiaHead, nico: NicoHead, bia: BiaHead };

export function Head({ who, x, y, size, face = "normal", rotate = 0, flip = false }: { who: keyof typeof HEADS; x: number; y: number; size: number; face?: PajamaFace; rotate?: number; flip?: boolean }) {
  const H = HEADS[who];
  const h = size * 1.11;
  return (
    <g transform={`rotate(${rotate} ${x + size / 2} ${y + h / 2})`}>
      <svg x={x} y={y} width={size} height={h} viewBox="0 0 200 222" overflow="visible">
        <g transform={flip ? "translate(200 0) scale(-1 1)" : undefined}>
          <H face={face} />
        </g>
      </svg>
    </g>
  );
}

const ART = "/assets/pajama-war";
const TINT = { lia: "#d9f7e2", nico: "#e6ddff", bia: "#ffdcec" } as const;
type KidId = keyof typeof TINT;
type Pose = "idle-f" | "windup-s" | "throw-s" | "hurt" | "cheer" | "ko" | "run-a-s";
type Pt = { x: number; y: number };

const SPRITE = { w: 300, h: 224, cx: 150, feet: 213, tall: 212 };
const HANDS: Partial<Record<Pose, Pt>> = {
  "windup-s": { x: 118, y: 46 },
  "throw-s": { x: 222, y: 123 },
  cheer: { x: 214, y: 50 },
};

type Placement = { x: number; feet: number; h: number; flip?: boolean };

function local(at: Placement, p: Pt): Pt {
  const s = at.h / SPRITE.tall;
  const dx = (p.x - SPRITE.cx) * s;
  return { x: Math.round((at.x + (at.flip ? -dx : dx)) * 10) / 10, y: Math.round((at.feet - (SPRITE.feet - p.y) * s) * 10) / 10 };
}

function KidSprite({ who, pose, at, shadow = true }: { who: KidId; pose: Pose; at: Placement; shadow?: boolean }) {
  const s = at.h / SPRITE.tall;
  return (
    <g>
      {shadow && <ellipse cx={at.x} cy={at.feet} rx={at.h * (pose === "ko" ? 0.42 : 0.26)} ry={at.h * 0.05} fill={P.ink} opacity={0.28} />}
      <g transform={`translate(${at.x} ${at.feet}) scale(${at.flip ? -s : s} ${s}) translate(${-SPRITE.cx} ${-SPRITE.feet})`}>
        <image href={`${ART}/kid-${who}-${pose}.svg`} width={SPRITE.w} height={SPRITE.h} />
      </g>
    </g>
  );
}

function HeldPillow({ who, pose, at, w, rotate }: { who: KidId; pose: Pose; at: Placement; w: number; rotate?: number }) {
  const hand = HANDS[pose];
  if (!hand) return null;
  const p = local(at, hand);
  return <Pillow x={p.x} y={p.y} w={w} rotate={rotate ?? (at.flip ? 24 : -24)} tint={TINT[who]} />;
}

function Asset({ name, x, y, w, h }: { name: string; x: number; y: number; w: number; h: number }) {
  return <image href={`${ART}/${name}.svg`} x={x} y={y} width={w} height={h} />;
}

function Lights({ w, y, sag, r, sw }: { w: number; y: number; sag: number; r: number; sw: number }) {
  const n = Math.round(w / 23);
  const colors = ["#ffd36b", "#ff8fc4", "#8ff0d8", "#9fd4ff"];
  const seg = w / 4;
  const d = Array.from({ length: 4 }, (_, i) => `Q${seg * i + seg / 2} ${y + sag} ${seg * (i + 1)} ${y}`).join(" ");
  return (
    <g>
      <path d={`M0 ${y} ${d}`} fill="none" stroke={P.ink} strokeWidth={sw} />
      {Array.from({ length: n }, (_, i) => {
        const x = (i + 0.5) * (w / n);
        const t = (x % seg) / seg;
        const cy = Math.round((y + sag * 2 * t * (1 - t) + r * 0.9) * 10) / 10;
        return <circle key={i} cx={Math.round(x * 10) / 10} cy={cy} r={r} fill={colors[i % 4]} stroke={P.ink} strokeWidth={sw * 0.6} />;
      })}
    </g>
  );
}

function Room({ w, h, floor, window: win, poster }: { w: number; h: number; floor: number; window: { x: number; y: number; w: number }; poster: { x: number; y: number; w: number } }) {
  const lines = [0.14, 0.32, 0.56, 0.86].map((t) => Math.round((floor + (h - floor) * t) * 10) / 10);
  const sw = w / 110;
  return (
    <g>
      <rect width={w} height={floor} fill="#5b3f9c" />
      {Array.from({ length: Math.ceil(w / 22) }, (_, i) => (
        <rect key={i} x={i * 22 + 6} y={0} width={9} height={floor} fill="#6a4cad" opacity={0.35} />
      ))}
      <Asset name="window-night" x={win.x} y={win.y} w={win.w} h={(win.w * 290) / 320} />
      <Asset name="poster-rocket" x={poster.x} y={poster.y} w={poster.w} h={(poster.w * 220) / 170} />
      <Lights w={w} y={h * 0.05} sag={h * 0.08} r={w * 0.013} sw={sw * 0.9} />
      <rect y={floor} width={w} height={h - floor} fill="#b8774a" />
      <rect y={floor - sw * 2.4} width={w} height={sw * 2.4} fill="#3f2c75" />
      <path d={`M0 ${floor} L${w} ${floor}`} stroke={P.ink} strokeWidth={sw * 1.4} />
      {lines.map((y) => (
        <path key={y} d={`M0 ${y} L${w} ${y}`} stroke="#9a5f38" strokeWidth={sw} />
      ))}
    </g>
  );
}

function Rug({ x, y, rx }: { x: number; y: number; rx: number }) {
  const ry = rx * 0.22;
  const sw = rx / 30;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={P.plum500} stroke={P.ink} strokeWidth={sw * 1.3} />
      <ellipse cx={x} cy={y} rx={rx * 0.7} ry={ry * 0.66} fill={P.bubblegum} stroke={P.ink} strokeWidth={sw} />
      <ellipse cx={x} cy={y} rx={rx * 0.36} ry={ry * 0.34} fill={P.sun} stroke={P.ink} strokeWidth={sw} />
    </g>
  );
}

function SideBed({ x, floor, w, flip = false, teddy = false }: { x: number; floor: number; w: number; flip?: boolean; teddy?: boolean }) {
  const k = w / 170;
  const sw = 3.2 * k;
  const st = { stroke: P.ink, strokeWidth: sw, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <g transform={`translate(${x} ${floor}) scale(${flip ? -k : k} ${k})`}>
      <ellipse cx={86} cy={0} rx={96} ry={6} fill={P.ink} opacity={0.3} />
      <rect x={-2} y={-142} width={26} height={140} rx={10} fill="#c98552" {...st} strokeWidth={3.2} />
      <path d="M11 -122 Q4 -130 0 -124 Q-3 -118 11 -108 Q25 -118 22 -124 Q18 -130 11 -122 Z" transform="translate(0 6)" fill={P.bubblegum} stroke={P.ink} strokeWidth={2.4} strokeLinejoin="round" />
      <rect x={162} y={-88} width={16} height={86} rx={6} fill="#c98552" {...st} strokeWidth={3.2} />
      <rect x={14} y={-30} width={160} height={14} rx={3} fill="#9c5f37" {...st} strokeWidth={3.2} />
      <rect x={30} y={-18} width={10} height={18} rx={2} fill="#9c5f37" {...st} strokeWidth={3} />
      <rect x={150} y={-18} width={10} height={18} rx={2} fill="#9c5f37" {...st} strokeWidth={3} />
      <rect x={20} y={-80} width={146} height={54} rx={8} fill="#f3ecff" {...st} strokeWidth={3.2} />
      <path d="M58 -84 Q110 -92 168 -84 L170 -40 Q160 -26 150 -38 Q138 -26 126 -38 Q114 -26 102 -38 Q90 -26 78 -38 Q66 -26 56 -36 Z" fill="#ffa6cf" {...st} strokeWidth={3.2} />
      {[
        [76, -66],
        [100, -54],
        [124, -70],
        [146, -56],
        [92, -76],
        [140, -78],
      ].map(([cx, cy]) => (
        <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={3.6} fill={P.bubblegum} />
      ))}
      <path d="M58 -84 Q110 -92 168 -84" fill="none" stroke={P.white} strokeWidth={3} opacity={0.6} />
      <g transform="translate(40 -90) rotate(-6)">
        <Pillow x={0} y={0} w={44} tint={P.white} />
      </g>
      {teddy && <image href={`${ART}/teddy.svg`} x={128} y={-124} width={34} height={37} />}
    </g>
  );
}

function Impact({ x, y, s = 1, word = "POF!" }: { x: number; y: number; s?: number; word?: string }) {
  return (
    <g style={display} transform={`translate(${x} ${y}) rotate(-8) scale(${s})`}>
      <text x="0" y="0" textAnchor="middle" fontSize="20" fill={P.sun} stroke={P.ink} strokeWidth="5" paintOrder="stroke" strokeLinejoin="round">
        {word}
      </text>
    </g>
  );
}

function Speed({ d, w }: { d: string; w: number }) {
  return <path d={d} fill="none" stroke={P.ink} strokeWidth={w} strokeLinecap="round" />;
}

function Badge({ x, y, r, fill, children }: Pt & { r: number; fill: string; children: React.ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0.6} cy={0.8} r={r} fill={P.ink} />
      <circle r={r} fill={fill} stroke={P.ink} strokeWidth={r * 0.22} />
      {children}
    </g>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <Room w={200} h={130} floor={80} window={{ x: 74, y: 10, w: 58 }} poster={{ x: 154, y: 16, w: 26 }} />
      {children}
    </svg>
  );
}

function ChoosePanel() {
  const nico: Placement = { x: 118, feet: 96, h: 44 };
  const bia: Placement = { x: 162, feet: 110, h: 52 };
  const lia: Placement = { x: 66, feet: 121, h: 62 };
  return (
    <Panel>
      <SideBed x={2} floor={98} w={58} teddy />
      <Rug x={84} y={118} rx={46} />
      <KidSprite who="nico" pose="idle-f" at={nico} />
      <KidSprite who="bia" pose="idle-f" at={bia} />
      <ellipse cx={lia.x} cy={lia.feet} rx={22} ry={5.2} fill="none" stroke={P.ink} strokeWidth={3.4} />
      <ellipse cx={lia.x} cy={lia.feet} rx={22} ry={5.2} fill="none" stroke={P.sun} strokeWidth={1.8} />
      <KidSprite who="lia" pose="cheer" at={lia} shadow={false} />
      <Badge x={lia.x + 24} y={lia.feet - 58} r={7} fill={P.sun}>
        <path d="M1 -5 L-3 1 L0 1 L-1 5 L3 -1 L0 -1 Z" fill={P.ink} />
      </Badge>
      <Badge x={nico.x + 18} y={nico.feet - 44} r={6.4} fill="#b9a6ef">
        <Pillow x={1.4} y={0} w={7.6} tint={P.white} />
        <path d="M-4.6 -1.8 L-2.4 -1.8 M-5.2 0.4 L-2.6 0.4 M-4.6 2.6 L-2.4 2.6" stroke={P.ink} strokeWidth={0.9} strokeLinecap="round" />
      </Badge>
      <Badge x={bia.x + 20} y={bia.feet - 50} r={6.4} fill="#93cf4c">
        <path d="M0 -3.6 L0 3.6 M-3.6 0 L3.6 0" stroke={P.ink} strokeWidth={1.8} strokeLinecap="round" />
      </Badge>
      <g transform={`translate(${lia.x + 16} ${lia.feet - 12}) rotate(-24) scale(1.05)`}>
        <path d="M-6.4 -3 L-9.4 -5.2 M0 -6.2 L0 -9.6 M6.4 -3 L9.4 -5.2" stroke={P.ink} strokeWidth={1.2} strokeLinecap="round" />
        <g stroke={P.ink} strokeWidth={1.1} strokeLinejoin="round" strokeLinecap="round" fill={P.white}>
          <path d="M-1.9 6 L-1.9 1.2 Q-1.9 -0.8 0 -0.8 Q1.9 -0.8 1.9 1.2 L1.9 6" />
          <path d="M-1.9 6 Q-6.2 5.4 -5.6 9 L-4.6 12.6 Q-4 15.6 -0.6 15.6 L3.6 15.6 Q6.6 15.6 6.6 12.4 L6.6 8.2 Q6.6 6.2 4.6 6.4 Q4.4 4.6 2.6 5 Q1.9 5 1.9 6 Z" />
          <rect x={-3.6} y={15.4} width={9.4} height={3.4} rx={1} fill={P.sky} />
        </g>
      </g>
    </Panel>
  );
}

function HitPanel() {
  const lia: Placement = { x: 180, feet: 93, h: 40, flip: true };
  const bia: Placement = { x: 132, feet: 108, h: 52 };
  const nico: Placement = { x: 44, feet: 124, h: 64 };
  const hand = local(nico, HANDS["throw-s"]!);
  const hit = { x: bia.x - 10, y: bia.feet - 40 };
  const pillow = { x: Math.round((hand.x * 0.25 + hit.x * 0.75) * 10) / 10, y: Math.round((hand.y * 0.25 + hit.y * 0.75 - 8) * 10) / 10 };
  return (
    <Panel>
      <HeldPillow who="lia" pose="windup-s" at={lia} w={13} />
      <KidSprite who="lia" pose="windup-s" at={lia} />
      <g style={display}>
        <text x={lia.x - 2} y={lia.feet - 42} textAnchor="middle" fontSize="15" fill={P.tangerine} stroke={P.ink} strokeWidth="3.6" paintOrder="stroke" strokeLinejoin="round">
          !
        </text>
      </g>
      <SideBed x={206} floor={99} w={44} flip />
      <Rug x={104} y={114} rx={50} />
      <KidSprite who="bia" pose="hurt" at={bia} />
      <path d={`M${hand.x + 6} ${hand.y - 2} Q${(hand.x + pillow.x) / 2} ${pillow.y - 16} ${pillow.x - 12} ${pillow.y}`} fill="none" stroke={P.white} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="0.1 4" />
      <Speed d={`M${pillow.x - 16} ${pillow.y - 6} L${pillow.x - 30} ${pillow.y - 8} M${pillow.x - 17} ${pillow.y + 4} L${pillow.x - 32} ${pillow.y + 5}`} w={1.4} />
      <Pillow x={pillow.x} y={pillow.y} w={20} rotate={-16} tint={TINT.nico} />
      <Feather x={hit.x + 14} y={hit.y - 10} rotate={-40} s={0.8} />
      <Feather x={hit.x + 22} y={hit.y + 8} rotate={30} s={0.8} />
      <Feather x={hit.x - 2} y={hit.y + 18} rotate={-10} s={0.7} />
      <Impact x={hit.x - 6} y={hit.y - 16} s={0.62} />
      <KidSprite who="nico" pose="throw-s" at={nico} />
    </Panel>
  );
}

function StandPanel({ locale }: { locale: Locale }) {
  const lia: Placement = { x: 92, feet: 116, h: 66 };
  const nico: Placement = { x: 34, feet: 126, h: 52 };
  const bia: Placement = { x: 168, feet: 106, h: 50 };
  return (
    <Panel>
      <Rug x={96} y={114} rx={48} />
      <KidSprite who="bia" pose="ko" at={bia} />
      <SideBed x={118} floor={128} w={80} />
      <KidSprite who="lia" pose="cheer" at={lia} />
      <Pillow x={lia.x + 34} y={lia.feet - 6} w={18} rotate={-12} tint={TINT.lia} />
      <KidSprite who="nico" pose="ko" at={nico} />
      <Feather x={58} y={40} rotate={-30} s={0.8} />
      <Feather x={128} y={48} rotate={24} s={0.8} />
      <Feather x={70} y={76} rotate={10} s={0.7} />
      <g style={display} transform="rotate(-4 100 26)">
        <text x="100" y="31" textAnchor="middle" fontSize="13" fill={P.white} stroke={P.ink} strokeWidth="3.6" paintOrder="stroke" strokeLinejoin="round">
          {LAST_STANDING[locale]}
        </text>
      </g>
    </Panel>
  );
}

export function PajamaWarHowToPanel({ step, locale }: { step: 0 | 1 | 2; locale: Locale }) {
  if (step === 0) return <ChoosePanel />;
  if (step === 1) return <HitPanel />;
  return <StandPanel locale={locale} />;
}

export function PajamaWarCoverArt() {
  const bia: Placement = { x: 288, feet: 170, h: 82, flip: true };
  const lia: Placement = { x: 222, feet: 210, h: 110, flip: true };
  const nico: Placement = { x: 72, feet: 188, h: 120 };
  const pillow = { x: 156, y: 92 };
  return (
    <>
      <Room w={320} h={240} floor={150} window={{ x: 108, y: 20, w: 120 }} poster={{ x: 250, y: 30, w: 52 }} />
      <Rug x={226} y={206} rx={78} />
      <HeldPillow who="bia" pose="windup-s" at={bia} w={30} />
      <KidSprite who="bia" pose="windup-s" at={bia} />
      <KidSprite who="lia" pose="throw-s" at={lia} />
      <Speed d={`M${pillow.x + 28} ${pillow.y - 12} L${pillow.x + 52} ${pillow.y - 4} M${pillow.x + 30} ${pillow.y + 2} L${pillow.x + 58} ${pillow.y + 12} M${pillow.x + 24} ${pillow.y + 16} L${pillow.x + 44} ${pillow.y + 26}`} w={3.2} />
      <Pillow x={pillow.x} y={pillow.y} w={46} rotate={-22} tint={TINT.lia} />
      <KidSprite who="nico" pose="hurt" at={nico} shadow={false} />
      <SideBed x={-16} floor={238} w={178} />
      <Feather x={186} y={64} rotate={-30} s={1.4} />
      <Feather x={204} y={52} rotate={40} s={1.2} />
      <Feather x={92} y={50} rotate={-10} s={1.2} />
      <Feather x={252} y={130} rotate={20} s={1.1} />
    </>
  );
}

const CAST_KIDS: KidId[] = ["lia", "nico", "bia"];
const CAST_LINE = 2.4;

function isKid(id: string | undefined): id is KidId {
  return CAST_KIDS.includes(id as KidId);
}

function Floorboards({ top }: { top: number }) {
  const left = 8;
  const right = 292;
  const bottom = top + 15;
  const d = `M${left + 9} ${top} L${right - 9} ${top} Q${right} ${top} ${right} ${top + 7} Q${right} ${bottom} ${right - 9} ${bottom} L${left + 9} ${bottom} Q${left} ${bottom} ${left} ${top + 7} Q${left} ${top} ${left + 9} ${top} Z`;
  return (
    <g>
      <path d={d} fill="#b8774a" />
      <path d={`M${left + 3} ${top + 9} L${right - 3} ${top + 9} Q${right - 4} ${bottom - 1} ${right - 10} ${bottom - 1} L${left + 10} ${bottom - 1} Q${left + 4} ${bottom - 1} ${left + 3} ${top + 9} Z`} fill="#9a5f38" opacity={0.55} />
      <path d={`M${left + 40} ${top + 4.5} L${left + 96} ${top + 4.5} M${left + 150} ${top + 4.5} L${left + 214} ${top + 4.5} M${left + 66} ${top + 4.5} L${left + 66} ${top + 9} M${left + 182} ${top + 4.5} L${left + 182} ${top + 9}`} stroke="#9a5f38" strokeWidth={1.6} strokeLinecap="round" />
      <path d={d} fill="none" stroke={P.ink} strokeWidth={CAST_LINE} strokeLinejoin="round" />
    </g>
  );
}

function CastRug({ x, y, rx }: { x: number; y: number; rx: number }) {
  const ry = rx * 0.2;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={P.plum500} stroke={P.ink} strokeWidth={CAST_LINE} />
      <ellipse cx={x} cy={y} rx={rx * 0.68} ry={ry * 0.62} fill={P.bubblegum} stroke={P.ink} strokeWidth={1.8} />
      <ellipse cx={x} cy={y} rx={rx * 0.34} ry={ry * 0.3} fill={P.sun} stroke={P.ink} strokeWidth={1.6} />
    </g>
  );
}

function IntroScene() {
  const nico: Placement = { x: 154, feet: 140, h: 112 };
  const lia: Placement = { x: 50, feet: 200, h: 142 };
  const bia: Placement = { x: 254, feet: 200, h: 136, flip: true };
  const hand = local(lia, HANDS["throw-s"]!);
  const pillow = { x: 120, y: 96 };
  return (
    <>
      <Floorboards top={192} />
      <CastRug x={150} y={195} rx={100} />
      <SideBed x={92} floor={190} w={116} />
      <HeldPillow who="nico" pose="windup-s" at={nico} w={36} />
      <KidSprite who="nico" pose="windup-s" at={nico} shadow={false} />
      <HeldPillow who="bia" pose="windup-s" at={bia} w={42} />
      <KidSprite who="bia" pose="windup-s" at={bia} />
      <KidSprite who="lia" pose="throw-s" at={lia} />
      <path d={`M${hand.x + 6} ${hand.y - 6} Q${(hand.x + pillow.x) / 2 - 4} ${pillow.y + 4} ${pillow.x - 16} ${pillow.y + 8}`} fill="none" stroke={P.white} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="0.1 5" />
      <Speed d={`M${pillow.x - 22} ${pillow.y - 6} L${pillow.x - 36} ${pillow.y - 2} M${pillow.x - 22} ${pillow.y + 8} L${pillow.x - 38} ${pillow.y + 14}`} w={2.2} />
      <Pillow x={pillow.x} y={pillow.y} w={38} rotate={-18} tint={TINT.lia} />
      <Feather x={96} y={40} rotate={-30} s={1.2} />
      <Feather x={214} y={30} rotate={30} s={1.1} />
      <Feather x={22} y={50} rotate={10} s={1} />
      <Feather x={274} y={52} rotate={-20} s={1} />
    </>
  );
}

function Star({ x, y, r, rotate = 0, line = 1.4 }: Pt & { r: number; rotate?: number; line?: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`;
  }).join(" ");
  return <polygon points={pts} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined} fill={P.sun} stroke={P.ink} strokeWidth={line} strokeLinejoin="round" />;
}

function DizzyStars({ x, y, s = 1 }: Pt & { s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={20} ry={6} fill="none" stroke={P.ink} strokeWidth={1.2} strokeDasharray="2 3" opacity={0.6} />
      <Star x={-17} y={-2} r={6} />
      <Star x={4} y={-7} r={5} />
      <Star x={16} y={3} r={5.5} />
    </g>
  );
}

function Flat({ who, pose, x, floor, h, dir }: { who: KidId; pose: Pose; x: number; floor: number; h: number; dir: 1 | -1 }) {
  const s = h / SPRITE.tall;
  const lift = 34 * s;
  const head = { x: x - dir * h * 0.86, y: floor - lift - 6 };
  return (
    <g>
      <ellipse cx={x - dir * h * 0.42} cy={floor + 1} rx={h * 0.56} ry={h * 0.06} fill={P.ink} opacity={0.26} />
      <g transform={`translate(${x} ${floor - lift}) rotate(${dir * -86})`}>
        <KidSprite who={who} pose={pose} at={{ x: 0, feet: 0, h, flip: dir < 0 }} shadow={false} />
      </g>
      <DizzyStars x={head.x} y={head.y - h * 0.3} s={h / 110} />
    </g>
  );
}

function WinScene({ winner }: { winner: KidId }) {
  const [left, right] = CAST_KIDS.filter((k) => k !== winner);
  const champ: Placement = { x: 100, feet: 145, h: 144 };
  return (
    <>
      <circle cx={100} cy={96} r={82} fill={P.sunPale} stroke={P.ink} strokeWidth={CAST_LINE} />
      <ellipse cx={100} cy={179} rx={62} ry={7} fill={P.ink} opacity={0.24} />
      <Pillow x={76} y={164} w={66} rotate={-7} tint={TINT[left]} />
      <Pillow x={126} y={166} w={62} rotate={9} tint={TINT[right]} />
      <path d="M66 146 L58 141 M134 146 L142 141 M100 152 L100 158" stroke={P.ink} strokeWidth={CAST_LINE} strokeLinecap="round" />
      <g transform={`rotate(-7 ${champ.x} ${champ.feet})`}>
        <KidSprite who={winner} pose="cheer" at={champ} shadow={false} />
        <HeldPillow who={winner} pose="cheer" at={champ} w={42} rotate={-14} />
      </g>
      <Star x={22} y={70} r={13} rotate={-14} line={2.2} />
      <Star x={180} y={108} r={10} rotate={12} line={2} />
      <Star x={30} y={128} r={7} rotate={8} line={1.8} />
      <Feather x={164} y={62} rotate={36} s={1.2} />
      <Feather x={4} y={100} rotate={-24} s={1.1} />
    </>
  );
}

function LoseScene({ who }: { who: KidId }) {
  const others = CAST_KIDS.filter((k) => k !== who);
  return (
    <>
      <Floorboards top={192} />
      <CastRug x={136} y={195} rx={104} />
      <SideBed x={186} floor={190} w={104} />
      <Flat who={who} pose="hurt" x={196} floor={204} h={134} dir={1} />
      <Pillow x={160} y={186} w={44} rotate={-14} tint={TINT[others[0]]} />
      <Pillow x={196} y={190} w={38} rotate={16} tint={TINT[others[1]]} />
      <g transform="translate(176 58) rotate(26)">
        <Speed d="M-4 -26 L-6 -44 M8 -24 L10 -40" w={2.2} />
        <Pillow x={0} y={0} w={38} rotate={0} tint={TINT[others[1]]} />
      </g>
      <Impact x={186} y={136} s={1} word="PLOF!" />
      <Feather x={208} y={36} rotate={30} s={1.1} />
      <Feather x={40} y={46} rotate={-30} s={1.1} />
      <Feather x={262} y={150} rotate={-20} s={0.9} />
    </>
  );
}

export function PajamaWarCast({ mood, featured, className }: { mood: "intro" | "win" | "lose"; featured?: string; className?: string }) {
  const who = isKid(featured) ? featured : "lia";
  return (
    <svg viewBox={mood === "win" ? "0 0 200 190" : "0 0 300 210"} className={className} aria-hidden overflow="visible">
      {mood === "intro" ? <IntroScene /> : mood === "win" ? <WinScene winner={who} /> : <LoseScene who={who} />}
    </svg>
  );
}
