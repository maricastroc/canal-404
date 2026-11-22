import type React from "react";
import { useId } from "react";
import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import { P } from "@/lib/palette";

const ART = "/assets/past-bedtime";
const display = { fontFamily: "var(--font-luckiest)" };
const hand = { fontFamily: "var(--font-patrick)" };

const N = {
  night: "#241e45",
  nightDeep: "#16122c",
  stripe: "#2d2656",
  floor: "#6b4a3a",
  floorDeep: "#553a2e",
  plank: "#4a3127",
  beam: "#ffe39a",
  moon: "#9db7ff",
  creak: "#b48ce8",
};

const SIZES = {
  "bruno-side-sneak": [142, 244],
  "bruno-side-tense": [142, 244],
  "bruno-front-sneak": [142, 244],
  "bruno-front-happy": [142, 244],
  "bruno-front-caught": [142, 244],
  "bruno-front-scared": [142, 244],
  "gran-side-alert": [104, 164],
  "gran-front-walk": [104, 164],
  "gran-front-shock": [116, 178],
  "dad-bed-sleep": [100, 210],
  "dog-sleep": [100, 62],
  "dog-alert": [140, 110],
  "cat-idle": [96, 90],
  "clock-body": [80, 92],
  "clock-bird": [28, 28],
  "prop-vcr-1x1": [100, 96],
  "prop-tv-1x1": [100, 146],
  "creak-1": [100, 100],
  "window-curtain-160x90": [184, 114],
  "door-plain-88x170": [102, 179],
  "hide-plant-front": [160, 106],
} as const;

type SpriteName = keyof typeof SIZES;

const r1 = (n: number) => Math.round(n * 10) / 10;

function Sprite({ name, cx, base, w, flip = false }: { name: SpriteName; cx: number; base: number; w: number; flip?: boolean }) {
  const [vw, vh] = SIZES[name];
  const h = r1((w * vh) / vw);
  const x = r1(cx - w / 2);
  const y = r1(base - h);
  return <image href={`${ART}/${name}.svg`} x={x} y={y} width={w} height={h} transform={flip ? `translate(${r1(cx * 2)} 0) scale(-1 1)` : undefined} />;
}

function Room({ width, height, floorY, children }: { width: number; height: number; floorY: number; children?: React.ReactNode }) {
  const stripes = Array.from({ length: Math.ceil(width / 16) }, (_, i) => i * 16 + 8);
  const planks = Array.from({ length: Math.ceil((height - floorY) / 12) }, (_, i) => floorY + 12 + i * 12);
  return (
    <g>
      <rect width={width} height={height} fill={N.night} />
      {stripes.map((x) => (
        <path key={x} d={`M${x} 0 L${x} ${floorY}`} stroke={N.stripe} strokeWidth={5} />
      ))}
      {children}
      <rect y={floorY} width={width} height={height - floorY} fill={N.floor} />
      {planks.map((y, i) => (
        <g key={y}>
          <path d={`M0 ${y} L${width} ${y}`} stroke={N.plank} strokeWidth={1.6} />
          {Array.from({ length: Math.ceil(width / 44) + 1 }, (_, k) => (
            <path key={k} d={`M${k * 44 + (i % 2) * 22} ${y - 12} L${k * 44 + (i % 2) * 22} ${y}`} stroke={N.plank} strokeWidth={1.2} />
          ))}
        </g>
      ))}
      <path d={`M0 ${floorY} L${width} ${floorY}`} stroke={P.ink} strokeWidth={3} />
    </g>
  );
}

function Dark({ width, height, cx, cy }: { width: number; height: number; cx: number; cy: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <>
      <defs>
        <radialGradient id={`dark${id}`} cx={cx / width} cy={cy / height} r={0.75}>
          <stop offset="0.45" stopColor={N.nightDeep} stopOpacity={0} />
          <stop offset="1" stopColor={N.nightDeep} stopOpacity={0.7} />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#dark${id})`} pointerEvents="none" />
    </>
  );
}

function Beam({ points, spot }: { points: string; spot?: { cx: number; cy: number; rx: number; ry: number } }) {
  return (
    <g>
      <polygon points={points} fill={N.beam} opacity={0.38} />
      {spot && <ellipse cx={spot.cx} cy={spot.cy} rx={spot.rx} ry={spot.ry} fill={N.beam} opacity={0.42} />}
    </g>
  );
}

function Zzz({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <g style={display} fill={N.moon} stroke={P.ink} strokeWidth={size * 0.14} paintOrder="stroke">
      <text x={x} y={y} fontSize={size * 0.7}>
        z
      </text>
      <text x={x + size * 0.5} y={y - size * 0.55} fontSize={size}>
        Z
      </text>
    </g>
  );
}

function Star({ x, y, r, fill = P.sun, rotate = 0 }: { x: number; y: number; r: number; fill?: string; rotate?: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.48;
    return `${r1(x + Math.cos(a) * rr)},${r1(y + Math.sin(a) * rr)}`;
  }).join(" ");
  return <polygon points={pts} fill={fill} stroke={P.ink} strokeWidth={Math.max(1.4, r * 0.18)} strokeLinejoin="round" transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined} />;
}

function Twinkle({ x, y, r }: { x: number; y: number; r: number }) {
  return <path d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`} fill={P.sunPale} />;
}

function Shout({ x, y, text, size, color, rotate = 0 }: { x: number; y: number; text: string; size: number; color: string; rotate?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fill={color} stroke={P.ink} strokeWidth={size * 0.22} paintOrder="stroke" strokeLinejoin="round" style={display} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
      {text}
    </text>
  );
}

function Glow({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} opacity={0.18} />
      <circle cx={x} cy={y} r={r * 0.55} fill={color} opacity={0.22} />
    </g>
  );
}

function Footprints({ steps }: { steps: { x: number; y: number }[] }) {
  return (
    <g>
      {steps.map((s, i) => (
        <g key={i}>
          <ellipse cx={s.x} cy={s.y} rx={6} ry={3} fill={P.sun} stroke={P.ink} strokeWidth={1.4} opacity={1 - i * 0.16} />
          <text x={s.x} y={s.y - 6} textAnchor="middle" fontSize={9} fill={P.sunPale} style={hand}>
            {i + 1}
          </text>
        </g>
      ))}
    </g>
  );
}

export function PastBedtimeCoverArt() {
  return (
    <>
      <Room width={320} height={240} floorY={168}>
        <polygon points="128,72 206,72 236,168 104,168" fill={N.moon} opacity={0.1} />
        <Sprite name="window-curtain-160x90" cx={167} base={76} w={96} />
        <Sprite name="clock-body" cx={46} base={70} w={38} />
        <path d="M46 70 L46 92" stroke={P.ink} strokeWidth={3} />
        <circle cx={46} cy={95} r={4} fill={P.sun} stroke={P.ink} strokeWidth={2} />
        <Sprite name="clock-bird" cx={46} base={40} w={20} />
        <rect x={252} y={150} width={68} height={56} fill={P.woodDark} stroke={P.ink} strokeWidth={3} />
        <Sprite name="prop-tv-1x1" cx={284} base={152} w={54} />
        <Sprite name="cat-idle" cx={290} base={80} w={36} />
      </Room>
      <Sprite name="prop-vcr-1x1" cx={286} base={204} w={46} />
      <Glow x={296} y={176} r={16} color={P.tomato} />
      <Beam points="72,166 196,186 190,238 76,176" spot={{ cx: 172, cy: 214, rx: 30, ry: 12 }} />
      <Sprite name="gran-side-alert" cx={44} base={216} w={76} />
      <Sprite name="dog-sleep" cx={240} base={234} w={58} />
      <Zzz x={256} y={206} size={14} />
      <path d="M190 176 Q194 168 200 172 M186 186 Q190 178 196 182" fill="none" stroke={P.sunPale} strokeWidth={2} strokeLinecap="round" />
      <Sprite name="bruno-side-sneak" cx={216} base={200} w={50} />
      <Dark width={320} height={240} cx={180} cy={150} />
      <Twinkle x={142} y={42} r={3} />
      <Twinkle x={190} y={34} r={2.4} />
    </>
  );
}

const CUCKOO = localized({ "pt-BR": "CUCO!", en: "CUCKOO!" });
const CREAK = localized({ "pt-BR": "nhéc", en: "creak" });
const TARGET = localized({ "pt-BR": (n: number) => `Meta: ${n}`, en: (n: number) => `Target: ${n}` });

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      {children}
    </svg>
  );
}

function PlanPanel() {
  return (
    <Panel>
      <Room width={200} height={130} floorY={92}>
        <Sprite name="door-plain-88x170" cx={176} base={92} w={36} />
      </Room>
      <Beam points="62,84 30,128 96,128" spot={{ cx: 63, cy: 124, rx: 30, ry: 6 }} />
      <Sprite name="gran-front-walk" cx={62} base={100} w={36} />
      <Footprints steps={[{ x: 96, y: 112 }, { x: 116, y: 108 }, { x: 136, y: 104 }, { x: 156, y: 100 }]} />
      <Sprite name="bruno-side-sneak" cx={22} base={118} w={34} />
      <Dark width={200} height={130} cx={110} cy={90} />
    </Panel>
  );
}

function QuietPanel({ locale }: { locale: Locale }) {
  return (
    <Panel>
      <Room width={200} height={130} floorY={92}>
        <Sprite name="clock-body" cx={34} base={58} w={34} />
        <Sprite name="clock-bird" cx={48} base={36} w={18} />
      </Room>
      <Shout x={72} y={26} text={CUCKOO[locale]} size={15} color={P.sun} rotate={-8} />
      <Sprite name="dad-bed-sleep" cx={168} base={128} w={42} />
      <Zzz x={176} y={48} size={14} />
      <Sprite name="creak-1" cx={86} base={136} w={58} />
      <Sprite name="bruno-side-tense" cx={84} base={118} w={34} />
      <g>
        <text x={118} y={108} fontSize={12} fill={N.creak} style={hand} opacity={0.9}>
          {CREAK[locale]}
        </text>
        <path d="M116 104 L148 98" stroke={P.tomato} strokeWidth={2.4} strokeLinecap="round" />
      </g>
      <Dark width={200} height={130} cx={100} cy={80} />
    </Panel>
  );
}

function TargetPanel({ locale }: { locale: Locale }) {
  return (
    <Panel>
      <Room width={200} height={130} floorY={96}>
        <rect x={120} y={66} width={66} height={30} fill={P.woodDark} stroke={P.ink} strokeWidth={2.6} />
      </Room>
      <Sprite name="prop-vcr-1x1" cx={153} base={96} w={40} />
      <Glow x={160} y={72} r={14} color={P.tomato} />
      <Sprite name="bruno-front-happy" cx={74} base={126} w={46} />
      <Star x={34} y={30} r={11} rotate={-12} />
      <Star x={62} y={20} r={13} />
      <Star x={92} y={30} r={11} rotate={12} />
      <g transform="rotate(-4 150 30)">
        <rect x={120} y={16} width={62} height={26} rx={3} fill={P.paper} stroke={P.ink} strokeWidth={2.2} />
        <text x={151} y={34} textAnchor="middle" fontSize={13} fill={P.ink} style={hand}>
          {TARGET[locale](16)}
        </text>
      </g>
      <Dark width={200} height={130} cx={90} cy={80} />
    </Panel>
  );
}

export function PastBedtimeHowToPanel({ step, locale }: { step: 0 | 1 | 2; locale: Locale }) {
  if (step === 0) return <PlanPanel />;
  if (step === 1) return <QuietPanel locale={locale} />;
  return <TargetPanel locale={locale} />;
}

function CastIntro() {
  return (
    <>
      <circle cx={150} cy={104} r={96} fill={N.night} stroke={P.ink} strokeWidth={4} />
      <circle cx={196} cy={50} r={14} fill={N.moon} />
      <circle cx={203} cy={45} r={12} fill={N.night} />
      <Twinkle x={92} y={36} r={4} />
      <Twinkle x={226} y={86} r={3} />
      <Beam points="70,120 128,186 40,190" />
      <Sprite name="gran-front-walk" cx={70} base={172} w={64} />
      <Sprite name="dog-sleep" cx={226} base={196} w={64} />
      <Zzz x={238} y={160} size={16} />
      <ellipse cx={150} cy={196} rx={36} ry={6} fill={P.ink} opacity={0.25} />
      <Sprite name="bruno-front-sneak" cx={150} base={198} w={84} />
    </>
  );
}

function CastWin() {
  return (
    <>
      <circle cx={100} cy={94} r={82} fill={N.night} stroke={P.ink} strokeWidth={4} />
      <circle cx={100} cy={94} r={60} fill={P.sunPale} opacity={0.25} />
      <Sprite name="prop-vcr-1x1" cx={150} base={176} w={44} />
      <Glow x={158} y={150} r={14} color={P.tomato} />
      <ellipse cx={92} cy={178} rx={34} ry={5} fill={P.ink} opacity={0.25} />
      <Sprite name="bruno-front-happy" cx={90} base={180} w={84} />
      <Star x={36} y={56} r={11} rotate={-14} />
      <Star x={164} y={52} r={13} rotate={10} />
      <Star x={100} y={20} r={9} />
      <Twinkle x={40} y={126} r={4} />
      <Twinkle x={170} y={106} r={3} />
    </>
  );
}

function CastLose() {
  return (
    <>
      <circle cx={100} cy={94} r={82} fill={N.night} stroke={P.ink} strokeWidth={4} />
      <polygon points="200,40 70,110 120,190 200,150" fill={N.beam} opacity={0.4} />
      <ellipse cx={96} cy={178} rx={34} ry={5} fill={P.ink} opacity={0.25} />
      <Sprite name="bruno-front-caught" cx={94} base={180} w={84} />
      <Shout x={150} y={52} text="!" size={34} color={P.tomato} rotate={8} />
    </>
  );
}

export function PastBedtimeCast({ mood, className }: { mood: "intro" | "win" | "lose"; className?: string }) {
  return (
    <svg viewBox={mood === "intro" ? "0 0 300 210" : "0 0 200 190"} className={className} aria-hidden overflow="visible">
      {mood === "intro" ? <CastIntro /> : mood === "win" ? <CastWin /> : <CastLose />}
    </svg>
  );
}
