import { P } from "@/lib/palette";

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
