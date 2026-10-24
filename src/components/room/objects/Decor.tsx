import { P } from "@/lib/palette";

const ink = { stroke: P.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const thin = { stroke: P.ink, strokeWidth: 3.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const display = { fontFamily: "var(--font-luckiest)" };
const hand = { fontFamily: "var(--font-patrick)" };
const noHit = { pointerEvents: "none" as const };

export function RadioArt({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 172 120" className="h-full w-full" overflow="visible" aria-hidden>
      <g style={noHit}>
        <path d="M150 40 L196 -36" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
        <path d="M150 40 L196 -36" stroke={P.steel} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="197" cy="-38" r="5" fill={on ? P.tomato : P.steel} stroke={P.ink} strokeWidth="3" />
      </g>
      <g>
        <path d="M42 38 Q42 6 86 6 Q130 6 130 38" fill="none" stroke={P.ink} strokeWidth="11" strokeLinecap="round" />
        <path d="M42 38 Q42 6 86 6 Q130 6 130 38" fill="none" stroke={P.plum500} strokeWidth="5" strokeLinecap="round" />
        <rect x="8" y="34" width="164" height="84" rx="16" fill={P.ink} opacity="0.4" transform="translate(4 4)" />
        <rect x="6" y="30" width="162" height="84" rx="16" fill={P.skyDeep} {...ink} />
        <path d="M14 100 Q16 108 30 108 L150 108 Q160 108 162 96 L162 104 Q160 112 146 112 L28 112 Q12 112 12 100 Z" fill="#225f96" />
        <rect x="16" y="40" width="142" height="64" rx="10" fill={P.cream} stroke={P.ink} strokeWidth="4" />
        <circle cx="50" cy="72" r="26" fill={P.plum800} stroke={P.ink} strokeWidth="4" />
        <circle cx="50" cy="72" r="18" fill="none" stroke={P.plum600} strokeWidth="3" />
        <circle cx="50" cy="72" r="9" fill={P.plum600} stroke={P.ink} strokeWidth="2.5" />
        {[
          [36, 58],
          [64, 58],
          [36, 86],
          [64, 86],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="2.4" fill={P.plum300} />
        ))}
        <rect x="86" y="46" width="64" height="26" rx="5" fill={on ? P.screen : "#203038"} stroke={P.ink} strokeWidth="3.5" />
        <text x="118" y="86" textAnchor="middle" fontSize="11" fill={P.ink} style={display} letterSpacing="0.8">
          RÁDIO 404
        </text>
        <circle cx="96" cy="97" r="6" fill={on ? P.tomato : P.tomatoDeep} stroke={P.ink} strokeWidth="2.5" />
        <circle cx="114" cy="97" r="6" fill={P.sun} stroke={P.ink} strokeWidth="2.5" />
        <rect x="128" y="92" width="22" height="9" rx="4" fill={P.steel} stroke={P.ink} strokeWidth="2.5" />
        <path d="M22 44 Q24 40 34 40" stroke={P.white} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      </g>
    </svg>
  );
}

export const LAVA_PALETTES = [
  { liquid: P.bubblegum, blob: P.tangerine, glow: "rgba(240,107,168,0.55)" },
  { liquid: P.mint, blob: P.sun, glow: "rgba(99,214,193,0.55)" },
  { liquid: P.plum500, blob: P.bubblegum, glow: "rgba(123,98,196,0.6)" },
  { liquid: P.sky, blob: P.lime, glow: "rgba(92,185,240,0.55)" },
];

export function LavaArt({ palette }: { palette: number }) {
  const c = LAVA_PALETTES[palette % LAVA_PALETTES.length];
  return (
    <svg viewBox="0 0 56 170" className="h-full w-full" overflow="visible" aria-hidden>
      <defs>
        <clipPath id="lava-glass">
          <path d="M18 20 L38 20 L50 100 L42 122 L14 122 L6 100 Z" />
        </clipPath>
      </defs>
      <g>
        <path d="M18 20 L38 20 L50 100 L42 122 L14 122 L6 100 Z" fill={c.liquid} />
        <g clipPath="url(#lava-glass)">
          <ellipse cx="26" cy="96" rx="12" ry="14" fill={c.blob} style={{ animation: "lava-a 9s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }} />
          <ellipse cx="34" cy="46" rx="8" ry="10" fill={c.blob} style={{ animation: "lava-b 11s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }} />
          <ellipse cx="22" cy="70" rx="6" ry="7" fill={c.blob} style={{ animation: "lava-a 13s ease-in-out -4s infinite", transformBox: "fill-box", transformOrigin: "center" }} />
          <ellipse cx="28" cy="122" rx="24" ry="8" fill={c.blob} />
        </g>
        <path d="M18 20 L38 20 L50 100 L42 122 L14 122 L6 100 Z" fill="none" {...thin} strokeWidth={4.5} />
        <path d="M16 34 L11 96" stroke={P.white} strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
        <path d="M17 4 L39 4 L40 20 L16 20 Z" fill={P.steel} {...thin} strokeWidth={4.5} />
        <path d="M14 122 L42 122 L54 168 L2 168 Z" fill={P.steel} {...thin} strokeWidth={4.5} />
        <path d="M12 140 L44 140" stroke={P.steelDeep} strokeWidth="4" />
        <path d="M18 128 L10 162" stroke={P.white} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}

export function CeilingLampArt({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 130 240" className="h-full w-full" overflow="visible" aria-hidden>
      <defs>
        <linearGradient id="lamp-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe39a" stopOpacity="0.38" />
          <stop offset="1" stopColor="#ffe39a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g style={noHit}>
        {on && <path d="M18 124 L112 124 L330 760 L-200 760 Z" fill="url(#lamp-cone)" />}
        <path d="M65 -1200 L65 70" stroke={P.ink} strokeWidth="5" />
      </g>
      <g>
        <rect x="56" y="58" width="18" height="14" rx="3" fill={P.steelDeep} stroke={P.ink} strokeWidth="4" />
        <ellipse cx="65" cy="126" rx="18" ry="14" fill={on ? "#fff6c9" : P.steel} stroke={P.ink} strokeWidth="4" />
        {on && <ellipse cx="65" cy="128" rx="34" ry="22" fill="#fff1a8" opacity="0.35" />}
        <path d="M12 124 Q16 74 65 68 Q114 74 118 124 Z" fill={P.sun} {...ink} />
        <path d="M30 120 Q32 90 50 78" stroke={P.tangerine} strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M80 78 Q100 90 102 120" stroke={P.tangerine} strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M24 108 Q28 86 44 78" stroke={P.white} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M96 126 L96 196" stroke={P.steelDeep} strokeWidth="3" strokeDasharray="3 4" />
        <circle cx="96" cy="204" r="9" fill={P.tomato} stroke={P.ink} strokeWidth="3.5" />
      </g>
    </svg>
  );
}

export function PlaneArt({ flying }: { flying: boolean }) {
  return (
    <svg viewBox="0 0 190 140" className="h-full w-full" overflow="visible" aria-hidden>
      {!flying && (
        <g style={noHit}>
          <path d="M62 -1000 L62 66" stroke={P.cream3} strokeWidth="2" />
          <path d="M132 -1000 L132 62" stroke={P.cream3} strokeWidth="2" />
        </g>
      )}
      <g>
        <path d="M24 74 Q30 56 60 56 L150 60 Q176 62 180 72 L186 52 L174 50 L162 64 L150 60" fill="none" />
        <path d="M150 62 L176 40 L186 44 L176 80 Z" fill={P.sky} {...thin} strokeWidth={4} />
        <path d="M30 72 Q34 54 64 54 L156 60 Q176 64 176 76 Q168 92 120 92 L60 92 Q30 92 30 72 Z" fill={P.tomato} {...ink} />
        <path d="M60 86 L150 84" stroke={P.tomatoDeep} strokeWidth="6" strokeLinecap="round" />
        <text x="104" y="80" textAnchor="middle" fontSize="16" fill={P.white} stroke={P.ink} strokeWidth="3" paintOrder="stroke" style={display}>
          404
        </text>
        <path d="M40 50 L140 46 L136 36 L44 40 Z" fill={P.sky} {...thin} strokeWidth={4} />
        <path d="M44 100 L140 98 L136 108 L48 110 Z" fill={P.sky} {...thin} strokeWidth={4} />
        <path d="M70 46 L74 56 M116 44 L112 56 M72 92 L72 100 M114 92 L114 98" stroke={P.ink} strokeWidth="3" />
        <path d="M64 58 Q76 50 90 58" fill={P.screen} stroke={P.ink} strokeWidth="3" />
        <circle cx="66" cy="118" r="9" fill={P.ink} />
        <circle cx="110" cy="118" r="9" fill={P.ink} />
        <path d="M66 108 L72 92 M110 108 L104 92" stroke={P.ink} strokeWidth="3" />
        <circle cx="26" cy="72" r="7" fill={P.sun} stroke={P.ink} strokeWidth="3" />
        <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: flying ? "spin-slow 0.12s linear infinite" : undefined }}>
          <ellipse cx="20" cy="72" rx="4" ry="26" fill={P.cream2} stroke={P.ink} strokeWidth="3" />
        </g>
      </g>
    </svg>
  );
}

export type SkyPeriod = "morning" | "afternoon" | "dusk" | "night";

const SKIES: Record<SkyPeriod, { top: string; bottom: string; light: string }> = {
  morning: { top: "#8fd8ff", bottom: "#d8f2ff", light: P.sunPale },
  afternoon: { top: "#5cb9f0", bottom: "#a9dcf7", light: P.sun },
  dusk: { top: "#7b62c4", bottom: "#ff9a6a", light: P.tangerine },
  night: { top: "#1f1839", bottom: "#3f3170", light: P.sunPale },
};

export function WindowArt({ period }: { period: SkyPeriod }) {
  const sky = SKIES[period];
  const night = period === "night";
  return (
    <svg viewBox="0 0 352 372" className="h-full w-full" overflow="visible" aria-hidden>
      <defs>
        <linearGradient id="win-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top} />
          <stop offset="1" stopColor={sky.bottom} />
        </linearGradient>
        <clipPath id="win-glass">
          <rect x="62" y="30" width="232" height="282" />
        </clipPath>
      </defs>
      <g>
        <rect x="50" y="18" width="256" height="306" rx="6" fill={P.woodDeep} {...ink} />
        <rect x="62" y="30" width="232" height="282" fill="url(#win-sky)" />
        <g clipPath="url(#win-glass)">
          {night ? (
            <g>
              <circle cx="232" cy="84" r="24" fill={P.sunPale} stroke={P.ink} strokeWidth="3.5" />
              <circle cx="243" cy="76" r="20" fill={sky.top} />
              {[
                [90, 60],
                [140, 100],
                [180, 50],
                [270, 140],
                [110, 150],
              ].map(([x, y]) => (
                <path key={`${x}${y}`} d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z`} fill={P.sunPale} />
              ))}
            </g>
          ) : (
            <g>
              <circle cx={period === "dusk" ? 150 : 240} cy={period === "dusk" ? 190 : 78} r="26" fill={sky.light} stroke={P.ink} strokeWidth="3.5" />
              <path d="M80 92 Q78 78 94 78 Q100 64 116 70 Q130 62 138 76 Q154 76 150 92 Z" fill={P.white} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" style={{ animation: "float 7s ease-in-out infinite" }} />
            </g>
          )}
          <path d="M40 250 L110 190 L180 250 Z" fill={night ? P.plum700 : P.tomato} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
          <rect x="58" y="248" width="104" height="80" fill={night ? P.plum600 : P.cream} stroke={P.ink} strokeWidth="4" />
          <rect x="94" y="262" width="30" height="28" fill={night ? P.sun : P.sky} stroke={P.ink} strokeWidth="3.5" />
          <circle cx="250" cy="224" r="50" fill={night ? "#2c5a3a" : P.leaf} stroke={P.ink} strokeWidth="4" />
          <circle cx="222" cy="252" r="34" fill={night ? "#244a31" : P.lime} stroke={P.ink} strokeWidth="4" />
          <rect x="244" y="270" width="16" height="50" fill={P.woodDeep} stroke={P.ink} strokeWidth="4" />
          {Array.from({ length: 12 }, (_, i) => 56 + i * 22).map((x) => (
            <path key={x} d={`M${x} 312 L${x} 286 L${x + 8} 280 L${x + 16} 286 L${x + 16} 312`} fill={night ? P.plum500 : P.cream2} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
          ))}
        </g>
        <path d="M178 30 L178 312 M62 170 L294 170" stroke={P.woodDeep} strokeWidth="12" />
        <path d="M178 30 L178 312 M62 170 L294 170" stroke={P.ink} strokeWidth="3" opacity="0.5" />
        <rect x="62" y="30" width="232" height="282" fill="none" stroke={P.ink} strokeWidth="4" />
        <path d="M78 46 L120 46 M78 58 L100 58" stroke={P.white} strokeWidth="4" strokeLinecap="round" opacity={night ? 0.25 : 0.6} />
        <rect x="38" y="318" width="280" height="22" rx="4" fill={P.wood} {...ink} />
      </g>
      <g>
        <path d="M4 8 L348 8" stroke={P.woodDark} strokeWidth="12" strokeLinecap="round" />
        <circle cx="4" cy="8" r="12" fill={P.sun} {...ink} />
        <circle cx="348" cy="8" r="12" fill={P.sun} {...ink} />
        <path d="M8 12 Q34 12 72 12 Q68 120 52 180 Q80 250 68 360 L4 364 Q16 250 6 170 Q14 80 8 12 Z" fill={P.tangerine} {...ink} />
        <path d="M28 20 Q34 160 22 350 M50 20 Q46 120 40 182" stroke={P.tangerineDeep} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M344 12 Q312 12 282 12 Q288 120 302 180 Q278 250 290 360 L352 364 Q340 250 348 170 Q340 80 344 12 Z" fill={P.tangerine} {...ink} />
        <path d="M324 20 Q318 160 332 350 M306 20 Q310 120 314 182" stroke={P.tangerineDeep} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M44 178 Q56 170 74 182" stroke={P.sun} strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M308 178 Q296 170 280 182" stroke={P.sun} strokeWidth="9" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export type CatMood = "sleep" | "awake" | "purr";

export function CatArt({ mood }: { mood: CatMood }) {
  const cat = "#2a2342";
  const catLight = "#453a66";
  return (
    <svg viewBox="0 0 282 208" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        <path d="M18 190 Q-4 150 28 112 Q52 70 120 64 Q206 58 250 108 Q286 150 262 192 Q246 210 140 206 Q34 210 18 190 Z" fill={P.plum500} {...ink} />
        <path d="M232 112 Q270 150 252 188 Q236 202 170 202 Q240 176 232 112 Z" fill={P.plum600} />
        <path d="M44 120 Q70 88 120 82" stroke={P.plum300} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M60 196 Q100 150 96 110 M200 198 Q176 160 196 110" stroke={P.plum600} strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
      <g style={{ transformBox: "fill-box", transformOrigin: "50% 100%", animation: mood === "sleep" ? "breathe 3.2s ease-in-out infinite" : undefined }}>
        <path d="M74 104 Q66 70 104 58 Q150 46 184 60 Q214 74 206 102 Q196 118 140 118 Q84 120 74 104 Z" fill={cat} {...ink} />
        <path d="M184 100 Q220 112 228 88 Q232 74 218 70" fill="none" stroke={P.ink} strokeWidth="15" strokeLinecap="round" />
        <path d="M184 100 Q220 112 228 88 Q232 74 218 70" fill="none" stroke={cat} strokeWidth="7" strokeLinecap="round" />
        <path d="M100 66 Q120 56 150 58" stroke={catLight} strokeWidth="6" fill="none" strokeLinecap="round" />
        <g transform={mood === "sleep" ? "translate(0 6)" : "translate(-4 -10)"}>
          <path d="M64 92 Q56 64 76 52 L78 30 L94 46 Q104 42 116 46 L130 30 L130 54 Q142 70 132 92 Q120 108 96 108 Q70 106 64 92 Z" fill={cat} {...ink} />
          <path d="M82 38 L84 50 M126 38 L122 50" stroke={P.bubblegum} strokeWidth="4" strokeLinecap="round" />
          {mood === "sleep" ? (
            <g fill="none" stroke={P.cream} strokeWidth="3.5" strokeLinecap="round">
              <path d="M78 76 Q84 81 90 76" />
              <path d="M106 76 Q112 81 118 76" />
            </g>
          ) : (
            <g>
              <ellipse cx="85" cy="74" rx="8" ry="9" fill={P.sun} stroke={P.ink} strokeWidth="2.5" />
              <ellipse cx="112" cy="74" rx="8" ry="9" fill={P.sun} stroke={P.ink} strokeWidth="2.5" />
              {mood === "purr" ? (
                <g fill="none" stroke={P.ink} strokeWidth="3" strokeLinecap="round">
                  <path d="M80 75 Q85 70 90 75" />
                  <path d="M107 75 Q112 70 117 75" />
                </g>
              ) : (
                <g fill={P.ink}>
                  <ellipse cx="86" cy="75" rx="2.2" ry="6" />
                  <ellipse cx="113" cy="75" rx="2.2" ry="6" />
                </g>
              )}
            </g>
          )}
          <path d="M96 86 L102 86 L99 90 Z" fill={P.bubblegum} />
          <path d="M92 94 Q99 98 106 94" fill="none" stroke={P.cream} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M70 88 L54 84 M70 92 L54 94 M128 88 L144 84 M128 92 L144 94" stroke={P.cream2} strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

export function PizzaArt({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 156 86" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        <path d="M14 76 L134 80 L150 58 L32 54 Z" fill={P.ink} opacity="0.35" transform="translate(4 4)" />
        {open ? (
          <g>
            <path d="M30 50 L148 54 L156 -30 L44 -34 Z" fill={P.cream2} {...ink} strokeWidth={4} />
            <path d="M44 -24 L144 -20 L140 40 L42 36 Z" fill="#cfa96c" stroke={P.ink} strokeWidth="2.5" opacity="0.7" />
            <path d="M8 74 L130 78 L148 54 L30 50 Z" fill="#7a4a2a" {...ink} strokeWidth={4} />
            <path d="M40 62 L110 54 L104 72 Z" fill={P.sun} stroke={P.ink} strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M40 62 L110 54" stroke={P.tangerineDeep} strokeWidth="6" strokeLinecap="round" />
            <circle cx="72" cy="64" r="4" fill={P.lime} stroke={P.ink} strokeWidth="2" />
            <circle cx="90" cy="61" r="3" fill={P.leaf} stroke={P.ink} strokeWidth="2" />
            <circle cx="96" cy="67" r="2.5" fill={P.lime} />
            <g style={{ animation: "fly-buzz 0.9s ease-in-out infinite alternate" }}>
              <circle cx="120" cy="30" r="3.5" fill={P.ink} />
              <ellipse cx="117" cy="25" rx="4" ry="2.5" fill={P.white} stroke={P.ink} strokeWidth="1.5" opacity="0.9" />
              <ellipse cx="124" cy="25" rx="4" ry="2.5" fill={P.white} stroke={P.ink} strokeWidth="1.5" opacity="0.9" />
            </g>
            <path d="M116 46 q6 -6 0 -12 M126 46 q6 -6 0 -12" stroke={P.lime} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
          </g>
        ) : (
          <g>
            <path d="M8 74 L130 78 L148 54 L30 50 Z" fill={P.cream2} {...ink} strokeWidth={4} />
            <path d="M8 74 L130 78 L130 84 L8 80 Z" fill={P.cream3} stroke={P.ink} strokeWidth="3.5" strokeLinejoin="round" />
            <ellipse cx="80" cy="64" rx="26" ry="8" fill={P.tomato} stroke={P.ink} strokeWidth="3" />
            <text x="80" y="68" textAnchor="middle" fontSize="9" fill={P.white} style={display}>
              PIZZA 404
            </text>
            <path d="M118 70 q8 -2 14 -10" stroke="#c9a06a" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        )}
      </g>
    </svg>
  );
}

function Pad({ x, y, r, body }: { x: number; y: number; r: number; body: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d="M-34 -8 Q-36 -18 -24 -18 L24 -18 Q36 -18 34 -8 L38 10 Q40 22 28 20 Q20 18 16 8 L-16 8 Q-20 18 -28 20 Q-40 22 -38 10 Z" fill={body} {...thin} strokeWidth={4} />
      <path d="M-22 -8 L-22 2 M-27 -3 L-17 -3" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <circle cx="18" cy="-6" r="3.6" fill={P.tomato} stroke={P.ink} strokeWidth="2" />
      <circle cx="26" cy="0" r="3.6" fill={P.sun} stroke={P.ink} strokeWidth="2" />
    </g>
  );
}

export function ControllersArt() {
  return (
    <svg viewBox="0 0 180 70" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        <Pad x={48} y={40} r={-12} body={P.steel} />
        <Pad x={128} y={44} r={14} body={P.plum300} />
      </g>
    </svg>
  );
}

function Cart({ x, y, r, color, label }: { x: number; y: number; r: number; color: string; label: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d="M-26 -18 L26 -18 L26 14 L18 22 L-26 22 Z" fill={P.steelDeep} {...thin} />
      <rect x="-20" y="-12" width="40" height="22" rx="3" fill={color} stroke={P.ink} strokeWidth="3" />
      <text x="0" y="4" textAnchor="middle" fontSize="10" fill={P.ink} style={display}>
        {label}
      </text>
      <path d="M-18 18 L14 18" stroke={P.ink} strokeWidth="2.5" />
    </g>
  );
}

export function CartridgesArt() {
  return (
    <svg viewBox="0 0 166 78" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        <Cart x={34} y={46} r={-18} color={P.tomato} label="RUA" />
        <Cart x={84} y={40} r={8} color={P.plum300} label="LAB" />
        <Cart x={134} y={48} r={24} color={P.mint} label="???" />
      </g>
    </svg>
  );
}

export function HiddenCartArt() {
  return (
    <svg viewBox="0 0 66 50" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        <Cart x={30} y={28} r={-28} color={P.sun} label="404" />
      </g>
    </svg>
  );
}

export function BooksArt() {
  const books = [
    { y: 100, h: 20, w: 92, x: 4, c: P.skyDeep, t: "GIBIS" },
    { y: 78, h: 22, w: 84, x: 10, c: P.tomato, t: "FÍSICA?" },
    { y: 58, h: 20, w: 88, x: 2, c: P.lime, t: "TRUQUES" },
    { y: 34, h: 24, w: 80, x: 12, c: P.sun, t: "ENGENHOCAS" },
  ];
  return (
    <svg viewBox="0 0 100 126" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        {books.map((b) => (
          <g key={b.t}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill={b.c} {...thin} />
            <rect x={b.x + b.w - 14} y={b.y + 3} width="8" height={b.h - 6} fill={P.cream} opacity="0.85" />
            <text x={b.x + 6} y={b.y + b.h / 2 + 4} fontSize="9.5" fill={P.ink} style={display}>
              {b.t}
            </text>
          </g>
        ))}
        <g transform="rotate(-8 52 24)">
          <path d="M22 30 L50 18 L82 30 L54 40 Z" fill={P.paper} {...thin} />
          <path d="M50 18 L54 40" stroke={P.ink} strokeWidth="2.5" />
          <path d="M30 28 L46 22 M58 24 L74 30" stroke={P.inkSoft} strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
}

export function VhsArt({ inserted }: { inserted: boolean }) {
  const tapes = [
    { x: 6, c: P.ink, l: P.cream, t: "DESENHOS 03" },
    { x: 40, c: P.ink, l: P.sky, t: "RUA S/ SAÍDA" },
    { x: 74, c: P.ink, l: P.lime, t: "FÉRIAS 2004" },
    { x: 108, c: P.ink, l: P.bubblegum, t: "KARAOKÊ" },
  ];
  return (
    <svg viewBox="0 0 236 124" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        {tapes.map((tape) => (
          <g key={tape.t}>
            <rect x={tape.x} y="18" width="30" height="100" rx="3" fill={tape.c} stroke={P.ink} strokeWidth="3" />
            <rect x={tape.x + 5} y="26" width="20" height="84" rx="2" fill={tape.l} />
            <text
              x={tape.x + 19}
              y="68"
              textAnchor="middle"
              fontSize="9"
              fill={P.ink}
              style={hand}
              transform={`rotate(-90 ${tape.x + 19} 68)`}
            >
              {tape.t}
            </text>
          </g>
        ))}
        {!inserted && (
          <g transform="rotate(-10 172 70)">
            <rect x="146" y="14" width="34" height="104" rx="3" fill={P.inkSoft} stroke={P.ink} strokeWidth="3.5" />
            <rect x="152" y="22" width="22" height="88" rx="2" fill={P.tomato} />
            <text x="167" y="66" textAnchor="middle" fontSize="10" fill={P.white} style={display} transform="rotate(-90 167 66)">
              NÃO ASSISTA
            </text>
          </g>
        )}
        <rect x="194" y="70" width="34" height="48" rx="3" fill={P.plum600} stroke={P.ink} strokeWidth="3" transform="rotate(6 211 94)" />
      </g>
    </svg>
  );
}

export function PosterChaosArt({ peeled }: { peeled: boolean }) {
  return (
    <svg viewBox="0 0 150 190" className="h-full w-full" overflow="visible" aria-hidden>
      <g transform="rotate(4 75 95)">
        <rect x="10" y="12" width="132" height="172" fill={P.ink} opacity="0.4" transform="translate(5 5)" />
        <rect x="10" y="12" width="132" height="172" fill={P.tangerine} stroke={P.ink} strokeWidth="4.5" />
        <g opacity="0.9">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <path
                key={i}
                d={`M76 80 L${(76 + Math.cos(a) * 120).toFixed(1)} ${(80 + Math.sin(a) * 120).toFixed(1)} L${(76 + Math.cos(a + 0.22) * 120).toFixed(1)} ${(80 + Math.sin(a + 0.22) * 120).toFixed(1)} Z`}
                fill={P.sun}
              />
            );
          })}
        </g>
        <rect x="10" y="12" width="132" height="172" fill="none" stroke={P.ink} strokeWidth="4.5" />
        <path d="M54 72 L64 50 L76 66 L90 44 L98 72 Z" fill={P.tomato} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
        <text x="76" y="112" textAnchor="middle" fontSize="40" fill={P.white} stroke={P.ink} strokeWidth="6" paintOrder="stroke" style={display} transform="rotate(-6 76 104)">
          CAOS
        </text>
        <text x="76" y="138" textAnchor="middle" fontSize="12.5" fill={P.ink} style={display}>
          FAZ PARTE DA
        </text>
        <text x="76" y="156" textAnchor="middle" fontSize="12.5" fill={P.ink} style={display}>
          PROGRAMAÇÃO
        </text>
        <rect x="58" y="4" width="36" height="14" fill={P.mint} opacity="0.85" transform="rotate(-5 76 11)" />
        {peeled ? (
          <path d="M142 150 L142 184 L108 184 Q128 170 142 150 Z" fill={P.cream} stroke={P.ink} strokeWidth="3.5" strokeLinejoin="round" />
        ) : (
          <path d="M142 166 L142 184 L124 184 Z" fill={P.cream2} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
        )}
        {peeled && (
          <text x="128" y="180" textAnchor="middle" fontSize="8" fill={P.ink} style={hand}>
            psiu!
          </text>
        )}
      </g>
    </svg>
  );
}

export function PosterDreamArt() {
  const words: [string, string][] = [
    ["SONHE", P.sun],
    ["JOGUE", P.mint],
    ["INVENTE", P.bubblegum],
    ["REPITA", P.tangerine],
  ];
  return (
    <svg viewBox="0 0 140 320" className="h-full w-full" overflow="visible" aria-hidden>
      <g transform="rotate(-2 70 160)">
        <path d="M12 14 L128 14 L128 290 L70 312 L12 290 Z" fill={P.ink} opacity="0.4" transform="translate(5 5)" />
        <path d="M12 14 L128 14 L128 290 L70 312 L12 290 Z" fill={P.plum700} stroke={P.ink} strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M22 24 L118 24 L118 284 L70 302 L22 284 Z" fill="none" stroke={P.plum500} strokeWidth="3" strokeDasharray="6 6" />
        {words.map(([w, c], i) => (
          <text
            key={w}
            x="70"
            y={78 + i * 58}
            textAnchor="middle"
            fontSize={w.length > 6 ? 24 : 28}
            fill={c}
            stroke={P.ink}
            strokeWidth="5"
            paintOrder="stroke"
            style={display}
            transform={`rotate(${i % 2 ? 3 : -3} 70 ${70 + i * 58})`}
          >
            {w}
          </text>
        ))}
        <circle cx="24" cy="24" r="6" fill={P.tomato} stroke={P.ink} strokeWidth="3" />
        <circle cx="116" cy="24" r="6" fill={P.sun} stroke={P.ink} strokeWidth="3" />
      </g>
    </svg>
  );
}

export function TrophyArt({ shine }: { shine: boolean }) {
  return (
    <svg viewBox="0 0 84 122" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        <path d="M18 22 Q2 22 4 40 Q6 56 24 58" fill="none" stroke={P.ink} strokeWidth="9" strokeLinecap="round" />
        <path d="M18 22 Q2 22 4 40 Q6 56 24 58" fill="none" stroke={P.sun} strokeWidth="4" strokeLinecap="round" />
        <path d="M66 22 Q82 22 80 40 Q78 56 60 58" fill="none" stroke={P.ink} strokeWidth="9" strokeLinecap="round" />
        <path d="M66 22 Q82 22 80 40 Q78 56 60 58" fill="none" stroke={P.sun} strokeWidth="4" strokeLinecap="round" />
        <path d="M14 12 L70 12 Q70 62 42 70 Q14 62 14 12 Z" fill={P.sun} {...thin} strokeWidth={4.5} />
        <path d="M58 18 Q58 52 44 62 Q62 48 64 18 Z" fill={P.sunDeep} />
        <path d="M24 20 Q24 40 32 52" stroke={P.white} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M36 70 L48 70 L50 88 L34 88 Z" fill={P.sunDeep} {...thin} />
        <rect x="20" y="88" width="44" height="30" rx="4" fill={P.plum600} {...thin} />
        <rect x="27" y="96" width="30" height="13" rx="2" fill={P.sunPale} stroke={P.ink} strokeWidth="2" />
        <text x="42" y="106" textAnchor="middle" fontSize="9" fill={P.ink} style={display}>
          2004
        </text>
        {shine && (
          <g style={{ animation: "pop-in 0.5s ease-out both" }}>
            <path d="M70 0 Q72 8 80 10 Q72 12 70 20 Q68 12 60 10 Q68 8 70 0 Z" fill={P.white} stroke={P.ink} strokeWidth="2" />
            <path d="M10 70 Q11 75 16 76 Q11 77 10 82 Q9 77 4 76 Q9 75 10 70 Z" fill={P.white} stroke={P.ink} strokeWidth="2" />
          </g>
        )}
      </g>
    </svg>
  );
}

export function OnAirSign({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 150 70" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        <path d="M40 0 L52 14 M110 0 L98 14" stroke={P.ink} strokeWidth="4" />
        {lit && <rect x="-6" y="6" width="162" height="64" rx="18" fill="#ff5a4a" opacity="0.35" style={{ filter: "blur(10px)" }} />}
        <rect x="6" y="12" width="138" height="52" rx="12" fill={P.inkSoft} stroke={P.ink} strokeWidth="5" />
        <rect x="14" y="20" width="122" height="36" rx="8" fill={lit ? P.tomato : "#5a2b35"} stroke={P.ink} strokeWidth="3" />
        <text
          x="75"
          y="48"
          textAnchor="middle"
          fontSize="26"
          letterSpacing="2"
          fill={lit ? P.white : "#8a5560"}
          style={{ fontFamily: "var(--font-luckiest)" }}
        >
          NO AR
        </text>
        <path d="M22 26 Q30 22 40 24" stroke={P.white} strokeWidth="3" fill="none" strokeLinecap="round" opacity={lit ? 0.8 : 0.25} />
      </g>
    </svg>
  );
}

export function SkateArt() {
  return (
    <svg viewBox="0 0 160 50" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        <path d="M6 18 Q4 8 16 8 L144 8 Q156 8 154 18 Q150 26 138 26 L22 26 Q10 26 6 18 Z" fill={P.bubblegum} {...thin} strokeWidth={4.5} />
        <path d="M30 14 L50 14 M62 14 L70 14 M110 14 L130 14" stroke={P.sun} strokeWidth="4" strokeLinecap="round" />
        <rect x="26" y="26" width="22" height="7" rx="2" fill={P.steel} stroke={P.ink} strokeWidth="3" />
        <rect x="112" y="26" width="22" height="7" rx="2" fill={P.steel} stroke={P.ink} strokeWidth="3" />
        <circle cx="30" cy="40" r="8" fill={P.sun} stroke={P.ink} strokeWidth="3.5" />
        <circle cx="46" cy="40" r="8" fill={P.sun} stroke={P.ink} strokeWidth="3.5" />
        <circle cx="114" cy="40" r="8" fill={P.sun} stroke={P.ink} strokeWidth="3.5" />
        <circle cx="130" cy="40" r="8" fill={P.sun} stroke={P.ink} strokeWidth="3.5" />
      </g>
    </svg>
  );
}
