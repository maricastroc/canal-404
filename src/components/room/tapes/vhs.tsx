import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { MascotExpression } from "@/components/mascot/Mascot404";
import type { SfxName } from "@/lib/audio/sfx";
import type { Track } from "@/lib/audio/tracks";
import { P } from "@/lib/palette";

export type TapeCue = {
  at: number;
  mascot?: { expression: MascotExpression; line?: string | string[] };
  sound?: SfxName;
  eject?: boolean;
};

export type TapeProgram = {
  Screen: ComponentType;
  loop?: number;
  length?: number;
  cues?: TapeCue[];
  song?: { track: Track; length: number };
  rewind?: string;
};

export const display = { fontFamily: "var(--font-luckiest)" };
export const chroma: CSSProperties = { textShadow: "0.04em 0 rgba(239,79,67,.8), -0.04em 0 rgba(92,185,240,.8)" };
export const washed: CSSProperties = { filter: "saturate(.78) contrast(1.06) sepia(.08)" };
export const inkOutline: CSSProperties = { textShadow: "0.06em 0.06em 0 #1d1830, -0.06em 0.06em 0 #1d1830" };

export function VhsOverlay({ counter, label = "▶ PLAY" }: { counter: string; label?: string }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-[9%] bg-white/30 mix-blend-overlay" style={{ animation: "vhs-track 3.4s linear infinite" }} />
      <p className="absolute left-[6%] top-[6%] z-[5] font-display text-[max(7px,6.1cqw)] leading-none text-cream" style={chroma}>
        {label}
      </p>
      <p className="absolute right-[6%] top-[6%] z-[5] font-display text-[max(7px,6.1cqw)] leading-none text-cream" style={chroma}>
        {counter}
      </p>
    </>
  );
}

export function Outlined({ x, y, size, fill, children, stroke = 7 }: { x: number; y: number; size: number; fill: string; children: ReactNode; stroke?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fill={fill} stroke={P.ink} strokeWidth={stroke} paintOrder="stroke" strokeLinejoin="round" style={display}>
      {children}
    </text>
  );
}

export function Caption({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`absolute inset-x-[8%] z-[5] text-center ${className}`}>
      <span className="rounded-sm bg-ink/80 px-[0.4em] font-hand text-[max(7px,6.1cqw)] leading-snug text-cream [box-decoration-break:clone]">{children}</span>
    </p>
  );
}
