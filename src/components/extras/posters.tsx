import { KidBust } from "@/components/characters/Heads";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { P } from "@/lib/palette";
import type { ProgressState } from "@/lib/progress/store";

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

export type PosterDef = {
  id: string;
  title: string;
  file: string;
  unlock: { label: string; check: (p: ProgressState) => boolean };
  art: React.ReactNode;
  texts: PosterText[];
};

const ink = { stroke: P.ink, strokeWidth: 8, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function rays(cx: number, cy: number, color: string, count = 18, r = 900) {
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

export const POSTERS: PosterDef[] = [
  {
    id: "chaos",
    title: "Caos faz parte da programação",
    file: "canal404-poster-chaos.png",
    unlock: { label: "Liberado desde 2004", check: () => true },
    art: (
      <g>
        <rect width="600" height="800" fill={P.tangerine} />
        {rays(300, 420, P.sun)}
        <circle cx="300" cy="420" r="170" fill={P.tomato} opacity="0.35" />
        <Mascot404 expression="dizzy" pose="full" frame={{ x: 150, y: 250, width: 300, height: 456 }} />
        <rect x="18" y="18" width="564" height="764" fill="none" {...ink} strokeWidth={12} />
        <rect x="40" y="40" width="520" height="720" fill="none" stroke={P.ink} strokeWidth="4" strokeDasharray="14 12" />
      </g>
    ),
    texts: [
      { text: "CAOS", x: 300, y: 190, size: 160, color: P.white, rotate: -6, stroke: 22 },
      { text: "FAZ PARTE DA", x: 300, y: 730, size: 46, color: P.ink, stroke: 0 },
      { text: "PROGRAMAÇÃO", x: 300, y: 690, size: 58, color: P.sun, rotate: -2, stroke: 12 },
    ],
  },
  {
    id: "dream",
    title: "Sonhe, jogue, invente, repita",
    file: "canal404-poster-dream.png",
    unlock: { label: "Liberado desde 2004", check: () => true },
    art: (
      <g>
        <rect width="600" height="800" fill={P.plum700} />
        {[
          [70, 80],
          [520, 120],
          [90, 650],
          [530, 700],
          [300, 60],
          [480, 400],
          [110, 380],
        ].map(([x, y]) => (
          <path
            key={`${x}-${y}`}
            transform={`translate(${x} ${y})`}
            d="M0 -22 Q3 -3 22 0 Q3 3 0 22 Q-3 3 -22 0 Q-3 -3 0 -22 Z"
            fill={P.sunPale}
            stroke={P.ink}
            strokeWidth="4"
          />
        ))}
        <path d="M40 40 L560 40 L560 700 L300 770 L40 700 Z" fill="none" stroke={P.plum300} strokeWidth="6" strokeDasharray="18 14" />
        <Mascot404 expression="wink" pose="wave" frame={{ x: 380, y: 520, width: 170, height: 258 }} />
        <rect x="18" y="18" width="564" height="764" fill="none" {...ink} strokeWidth={12} />
      </g>
    ),
    texts: [
      { text: "SONHE", x: 300, y: 190, size: 112, color: P.sun, rotate: -4, stroke: 18 },
      { text: "JOGUE", x: 300, y: 330, size: 112, color: P.mint, rotate: 3, stroke: 18 },
      { text: "INVENTE", x: 300, y: 470, size: 100, color: P.bubblegum, rotate: -3, stroke: 18 },
      { text: "REPITA", x: 240, y: 610, size: 104, color: P.tangerine, rotate: 3, stroke: 18 },
    ],
  },
  {
    id: "dead-end-street",
    title: "Rua Sem Saída: a bagunça oficial",
    file: "canal404-poster-dead-end-street.png",
    unlock: {
      label: "Vença Rua Sem Saída",
      check: (p) => Boolean(p.achievements["street-win"]),
    },
    art: (
      <g>
        <rect width="600" height="800" fill="#82d3f7" />
        <circle cx="490" cy="130" r="60" fill={P.sun} {...ink} />
        <path d="M0 560 L60 500 L120 560 L120 500 L190 440 L260 500 L260 560 L340 510 L420 560 L480 480 L600 540 L600 600 L0 600 Z" fill="#c9a6e8" {...ink} strokeWidth={6} />
        <rect y="590" width="600" height="210" fill={P.lime} />
        {Array.from({ length: 14 }, (_, i) => i * 46 - 10).map((x) => (
          <path key={x} d={`M${x} 690 L${x} 610 L${x + 19} 594 L${x + 38} 610 L${x + 38} 690 Z`} fill={P.tangerine} stroke={P.ink} strokeWidth="5" strokeLinejoin="round" />
        ))}
        <rect y="686" width="600" height="114" fill="#d8a066" />
        <path d="M0 686 L600 686" stroke={P.ink} strokeWidth="6" />
        <KidBust who="deco" face="happy" frame={{ x: 60, y: 400, width: 250, height: 278 }} />
        <KidBust who="lina" face="wow" frame={{ x: 290, y: 430, width: 230, height: 256 }} />
        <path d="M380 330 Q460 230 540 300" fill="none" stroke={P.tangerineDeep} strokeWidth="7" strokeDasharray="12 14" />
        <rect x="18" y="18" width="564" height="764" fill="none" {...ink} strokeWidth={12} />
      </g>
    ),
    texts: [
      { text: "RUA", x: 230, y: 230, size: 170, color: P.lime, rotate: -7, stroke: 22 },
      { text: "SEM SAÍDA", x: 300, y: 350, size: 92, color: P.sun, rotate: -4, stroke: 18 },
      { text: "a bagunça oficial do bairro", x: 300, y: 760, size: 40, color: P.ink, font: "hand", stroke: 0 },
    ],
  },
  {
    id: "off-air",
    title: "Fora do ar (ou não)",
    file: "canal404-poster-off-air.png",
    unlock: {
      label: "Encontre 3 segredos na sala",
      check: (p) => Object.keys(p.secrets).length >= 3,
    },
    art: (
      <g>
        {["#f2efe6", "#f7d94c", "#5fd8e6", "#68d36a", "#e05fd0", "#ea4a46", "#3f5bd8"].map((c, i) => (
          <rect key={c} x={(i * 600) / 7} y="0" width={600 / 7 + 1} height="560" fill={c} />
        ))}
        <rect y="560" width="600" height="240" fill="#1b1b2b" />
        <rect x="70" y="590" width="120" height="70" fill="#f2efe6" />
        <rect x="260" y="590" width="120" height="70" fill={P.plum600} />
        <Mascot404 expression="static" pose="full" frame={{ x: 160, y: 120, width: 280, height: 426 }} />
        <rect x="18" y="18" width="564" height="764" fill="none" {...ink} strokeWidth={12} />
      </g>
    ),
    texts: [
      { text: "FORA DO AR", x: 300, y: 110, size: 92, color: P.white, rotate: -3, stroke: 18 },
      { text: "o canal nunca saiu do ar.", x: 300, y: 740, size: 40, color: "#b7ff8a", font: "hand", stroke: 0 },
    ],
  },
];
