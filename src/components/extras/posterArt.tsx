import { Mascot404 } from "@/components/mascot/Mascot404";
import { P } from "@/lib/palette";

export type PosterText = {
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  rotate?: number;
  font?: "display" | "hand";
  stroke?: number;
};

export const POSTER_SHADOW = { x: 6, y: 8 };

export const posterInk = { stroke: P.ink, strokeWidth: 8, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export function rays(cx: number, cy: number, color: string, count = 18, r = 900) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const b = a + Math.PI / count;
    return (
      <path
        key={i}
        d={`M${cx} ${cy} L${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} L${(cx + Math.cos(b) * r).toFixed(1)} ${(cy + Math.sin(b) * r).toFixed(1)} Z`}
        fill={color}
      />
    );
  });
}

export function PosterTexts({ texts }: { texts: PosterText[] }) {
  return (
    <g>
      {texts.map((t) => {
        const style = { fontFamily: t.font === "hand" ? "var(--font-patrick)" : "var(--font-luckiest)" };
        return (
          <g key={t.text} transform={`translate(${t.x} ${t.y}) rotate(${t.rotate ?? 0})`} textAnchor="middle" fontSize={t.size} style={style}>
            {t.stroke ? (
              <>
                <text x={POSTER_SHADOW.x} y={POSTER_SHADOW.y} fill={P.ink}>
                  {t.text}
                </text>
                <text stroke={P.ink} strokeWidth={t.stroke} strokeLinejoin="round" fill="none">
                  {t.text}
                </text>
              </>
            ) : null}
            <text fill={t.color}>{t.text}</text>
          </g>
        );
      })}
    </g>
  );
}

export const CHAOS_POSTER = {
  art: (
    <g>
      <rect width="600" height="800" fill={P.tangerine} />
      {rays(300, 400, P.sun)}
      <circle cx="300" cy="400" r="165" fill={P.tomato} opacity="0.35" />
      <Mascot404 expression="dizzy" pose="full" frame={{ x: 172, y: 222, width: 256, height: 389 }} />
      <rect x="18" y="18" width="564" height="764" fill="none" {...posterInk} strokeWidth={12} />
      <rect x="40" y="40" width="520" height="720" fill="none" stroke={P.ink} strokeWidth="4" strokeDasharray="14 12" />
    </g>
  ),
  texts: [
    { text: "CAOS", x: 300, y: 196, size: 160, color: P.white, rotate: -6, stroke: 22 },
    { text: "FAZ PARTE DA", x: 300, y: 664, size: 40, color: P.ink },
    { text: "PROGRAMAÇÃO", x: 300, y: 728, size: 62, color: P.sun, rotate: -2, stroke: 12 },
  ] satisfies PosterText[],
};
