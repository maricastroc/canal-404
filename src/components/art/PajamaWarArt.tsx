import type React from "react";
import { BiaHead, LiaHead, NicoHead, type PajamaFace } from "@/components/characters/PajamaKids";
import { P } from "@/lib/palette";

const display = { fontFamily: "var(--font-luckiest)" };
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

export function Pillow({ x, y, w = 60, rotate = 0, tint = P.white }: { x: number; y: number; w?: number; rotate?: number; tint?: string }) {
  const s = w / 104;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s}) translate(-52 -38)`}>
      <path d="M10 14 Q30 4 52 10 Q74 4 94 14 Q102 38 94 62 Q74 72 52 66 Q30 72 10 62 Q2 38 10 14 Z" fill={tint} stroke={P.ink} strokeWidth="6" strokeLinejoin="round" />
      <path d="M18 56 Q36 62 52 58 Q70 62 88 56 Q92 44 90 30 Q86 50 70 52 Q52 46 34 52 Q22 50 18 36 Q14 46 18 56 Z" fill="#d8cdf0" opacity="0.8" />
      <path d="M10 14 L4 6 M94 14 L100 6 M10 62 L4 70 M94 62 L100 70" stroke={P.ink} strokeWidth="6" strokeLinecap="round" />
    </g>
  );
}

export function Feather({ x, y, rotate = 0, s = 1 }: { x: number; y: number; rotate?: number; s?: number }) {
  return (
    <path
      d="M0 6 Q10 0 22 4 Q14 11 0 6 Z"
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}
      fill={P.white}
      stroke={P.ink}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  );
}

export function PajamaWarLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="-24 -22 412 214" className={className} role="img" aria-label="Guerra do Pijama">
      <Pillow x={352} y={16} w={66} rotate={22} />
      <Feather x={-6} y={26} rotate={-30} s={1.4} />
      <Feather x={340} y={92} rotate={40} s={1.2} />
      <Feather x={18} y={148} rotate={10} s={1.1} />
      <g style={display}>
        <g transform="rotate(-5 160 60)">
          <text x="164" y="84" textAnchor="middle" fontSize="80" fill={P.ink} letterSpacing="2">
            GUERRA
          </text>
          <text x="158" y="78" textAnchor="middle" fontSize="80" fill={P.white} stroke={P.ink} strokeWidth="10" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            GUERRA
          </text>
          <path d="M40 32 q10 -8 22 -6" stroke={P.sunPale} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.9" />
        </g>
        <g transform="rotate(-10 26 112)">
          <rect x="-12" y="88" width="66" height="40" rx="10" fill={P.sun} stroke={P.ink} strokeWidth="5" />
          <text x="21" y="119" textAnchor="middle" fontSize="30" fill={P.ink}>
            DO
          </text>
        </g>
        <g transform="rotate(2 210 150)">
          <text x="222" y="182" textAnchor="middle" fontSize="88" fill={P.ink} letterSpacing="2">
            PIJAMA
          </text>
          <text x="216" y="176" textAnchor="middle" fontSize="88" fill={P.bubblegum} stroke={P.ink} strokeWidth="11" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            PIJAMA
          </text>
          <path d="M98 118 q10 -8 22 -6" stroke={P.white} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
}

export function PajamaWarHowToPanel({ step }: { step: 0 | 1 | 2 }) {
  const room = (children: React.ReactNode) => (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <rect width="200" height="130" fill="#5b3f9c" />
      <rect y="84" width="200" height="46" fill="#b8774a" />
      <path d="M0 84 L200 84" stroke={P.ink} strokeWidth="4" />
      <path d="M0 106 L200 106" stroke="#9a5f38" strokeWidth="3" />
      <path d="M8 16 Q50 30 100 16 Q150 30 192 16" fill="none" stroke={P.ink} strokeWidth="2" />
      {[24, 50, 76, 124, 150, 176].map((x, i) => (
        <circle key={x} cx={x} cy={i % 3 === 1 ? 23 : 21} r="4" fill={["#ffd36b", "#ff8fc4", "#8ff0d8"][i % 3]} stroke={P.ink} strokeWidth="1.5" />
      ))}
      {children}
    </svg>
  );
  if (step === 0) {
    const bars = (x: number, color: string, n: number) => (
      <g>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={x + i * 9} y={112} width="7" height="9" rx="2" fill={i < n ? color : P.cream} stroke={P.ink} strokeWidth="1.5" />
        ))}
      </g>
    );
    return room(
      <>
        <Head who="lia" x={8} y={38} size={58} face="happy" rotate={-6} />
        <Head who="nico" x={71} y={34} size={58} face="normal" />
        <Head who="bia" x={134} y={38} size={58} face="happy" rotate={6} />
        {bars(16, "#3fae6a", 5)}
        {bars(79, "#8a6fd6", 5)}
        {bars(142, "#f06ba8", 5)}
      </>,
    );
  }
  if (step === 1) {
    return room(
      <>
        <Head who="nico" x={14} y={40} size={62} face="fierce" />
        <path d="M78 66 Q100 52 124 60" fill="none" stroke={P.ink} strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" />
        <Pillow x={118} y={58} w={34} rotate={-24} tint="#e6ddff" />
        <Head who="bia" x={126} y={46} size={62} face="ouch" rotate={10} flip />
        <Feather x={150} y={40} rotate={-40} />
        <Feather x={176} y={58} rotate={30} />
        <Feather x={160} y={98} rotate={-10} />
        <g style={display} transform="rotate(-10 150 30)">
          <text x="150" y="38" textAnchor="middle" fontSize="20" fill={P.sun} stroke={P.ink} strokeWidth="5" paintOrder="stroke">
            POF!
          </text>
        </g>
      </>,
    );
  }
  return room(
    <>
      <g transform="translate(36 98) rotate(-80)">
        <Head who="nico" x={-26} y={-28} size={50} face="dizzy" />
      </g>
      {[0, 1, 2].map((i) => (
        <path key={i} d="M0 -6 L1.8 -1.8 L6 -1.6 L2.8 1.2 L3.8 5.6 L0 3.2 L-3.8 5.6 L-2.8 1.2 L-6 -1.6 L-1.8 -1.8 Z" transform={`translate(${22 + i * 14} ${64 - (i % 2) * 6})`} fill={P.sun} stroke={P.ink} strokeWidth="1.5" />
      ))}
      <Head who="lia" x={84} y={26} size={70} face="happy" />
      <Pillow x={164} y={40} w={38} rotate={18} tint="#d9f7e2" />
      <g style={display} transform="rotate(4 150 112)">
        <text x="160" y="118" textAnchor="middle" fontSize="15" fill={P.white} stroke={P.ink} strokeWidth="4" paintOrder="stroke">
          ÚLTIMO DE PÉ!
        </text>
      </g>
    </>,
  );
}

export function PajamaWarCoverArt() {
  return (
    <>
      <rect x="0" y="0" width="320" height="150" fill="#5b3f9c" />
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} cx={(i * 37) % 320} cy={(i * 53) % 140} r="3" fill="#ffe39a" opacity="0.4" />
      ))}
      <rect x="120" y="22" width="80" height="70" rx="6" fill="#2c2463" stroke={P.ink} strokeWidth="4" />
      <circle cx="176" cy="44" r="12" fill="#fff6c2" stroke={P.ink} strokeWidth="2" />
      <circle cx="182" cy="40" r="11" fill="#2c2463" />
      <path d="M160 22 L160 92 M120 57 L200 57" stroke="#c98552" strokeWidth="4" />
      <path d="M110 18 Q118 60 112 96 L122 96 Q126 56 122 18 Z M210 18 Q202 60 208 96 L198 96 Q194 56 198 18 Z" fill={P.bubblegum} stroke={P.ink} strokeWidth="3" />
      <path d="M0 14 Q40 34 80 14 Q120 34 160 14 Q200 34 240 14 Q280 34 320 14" fill="none" stroke={P.ink} strokeWidth="2.5" />
      {Array.from({ length: 14 }, (_, i) => (
        <circle key={i} cx={10 + i * 23} cy={18 + Math.abs(Math.sin((i + 0.5) * 0.7)) * 10} r="4.5" fill={["#ffd36b", "#ff8fc4", "#8ff0d8", "#9fd4ff"][i % 4]} stroke={P.ink} strokeWidth="1.5" />
      ))}
      <rect x="0" y="150" width="320" height="90" fill="#b8774a" />
      <path d="M0 150 L320 150" stroke={P.ink} strokeWidth="4" />
      {Array.from({ length: 4 }, (_, i) => (
        <path key={i} d={`M0 ${172 + i * 22} L320 ${172 + i * 22}`} stroke="#9a5f38" strokeWidth="3" />
      ))}
      <ellipse cx="160" cy="206" rx="120" ry="26" fill={P.plum500} stroke={P.ink} strokeWidth="4" />
      <ellipse cx="160" cy="206" rx="84" ry="17" fill={P.bubblegum} stroke={P.ink} strokeWidth="3" />
      <ellipse cx="160" cy="206" rx="44" ry="9" fill={P.sun} stroke={P.ink} strokeWidth="3" />
      <Head who="nico" x={112} y={110} size={100} face="wow" />
      <Pillow x={210} y={140} w={44} rotate={20} tint="#e6ddff" />
      <Head who="lia" x={8} y={96} size={128} face="fierce" rotate={-6} />
      <Pillow x={124} y={84} w={72} rotate={-30} tint="#d9f7e2" />
      <Head who="bia" x={190} y={98} size={126} face="ouch" rotate={9} flip />
      <Feather x={220} y={86} rotate={-30} s={1.4} />
      <Feather x={296} y={70} rotate={40} s={1.3} />
      <Feather x={262} y={60} rotate={-10} s={1.2} />
      <g style={display} transform="rotate(-8 250 40)">
        <text x="250" y="52" textAnchor="middle" fontSize="30" fill={P.sun} stroke={P.ink} strokeWidth="7" paintOrder="stroke">
          POF!
        </text>
      </g>
    </>
  );
}
