"use client";

import { useId, type CSSProperties } from "react";
import { P } from "@/lib/palette";
import { useLoopIndex, useTimeline } from "./broadcast";
import { Caption, display, washed, type TapeProgram } from "./vhs";
import "./resort.css";

export const RESORT_LOOP = 16000;
export const RESORT_GLITCH = { from: 6200, to: 7000 };

export const RESORT_SHOTS = [
  { at: 0, clock: [14, 3, 12], line: "— Pai, me filma!" },
  { at: 3500, clock: [14, 5, 47], line: "— Anda, o check-in é às duas." },
  { at: 8600, clock: [14, 6, 3], line: "— Mãe, a TV do quarto ligou sozinha de novo." },
  { at: 12600, clock: [14, 9, 31], line: "— Pai, a bola!" },
];

const SHOT_MARKS = RESORT_SHOTS.map((shot) => shot.at);
const GLITCH_MARKS = [0, RESORT_GLITCH.from, RESORT_GLITCH.to];

const GLYPHS: Record<string, string[]> = {
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["###..", "#..#.", "#...#", "#...#", "#...#", "#..#.", "###.."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  ":": ["...", ".#.", ".#.", "...", ".#.", ".#.", "..."],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
};

function pixelText(text: string, size: number) {
  let x = 0;
  let d = "";
  for (const char of text) {
    const glyph = GLYPHS[char] ?? GLYPHS[" "];
    glyph.forEach((row, r) => {
      let c = 0;
      while (c < row.length) {
        if (row[c] !== "#") {
          c += 1;
          continue;
        }
        let end = c;
        while (end < row.length && row[end] === "#") end += 1;
        d += `M${+(x + c * size).toFixed(2)} ${+(r * size).toFixed(2)}h${+((end - c) * size).toFixed(2)}v${size}h${-+((end - c) * size).toFixed(2)}z`;
        c = end;
      }
    });
    x += (glyph[0].length + 1) * size;
  }
  return { d, width: x - size };
}

function PixelText({ text, x, y, size, fill = P.white, anchor = "start" }: { text: string; x: number; y: number; size: number; fill?: string; anchor?: "start" | "end" }) {
  const { d, width } = pixelText(text, size);
  const left = anchor === "end" ? x - width : x;
  return <path d={d} transform={`translate(${left} ${y})`} fill={fill} stroke={P.ink} strokeWidth={size * 0.9} paintOrder="stroke" strokeLinejoin="miter" />;
}

const pad = (n: number) => String(n).padStart(2, "0");

function clockText([h, m, s]: number[], ticks: number) {
  const total = h * 3600 + m * 60 + s + ticks;
  return `${pad(Math.floor(total / 3600) % 24)}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
}

function CamcorderOsd({ shot, glitch }: { shot: number; glitch: boolean }) {
  const second = useLoopIndex(RESORT_LOOP / 1000, 1000);
  const ticks = Math.max(0, second - Math.floor(RESORT_SHOTS[shot].at / 1000));
  const date = glitch ? "04 DEZ 2004" : "17 JUL 2004";
  const time = glitch ? "04:04:04" : clockText(RESORT_SHOTS[shot].clock, ticks);
  const tint = glitch ? P.screen : P.white;
  return (
    <svg viewBox="0 0 294 246" className="absolute inset-0 z-[3] h-full w-full" data-stamp={`${date} ${time}`} aria-hidden>
      <circle cx="27" cy="25.5" r="4.6" fill={P.tomato} stroke={P.ink} strokeWidth="1.8" style={{ animation: "rec-blink 1s steps(1) infinite" }} />
      <PixelText text="REC" x={36} y={18.5} size={2} />
      <g transform="translate(244 19)">
        <path d="M0 0h26v14H0z M26 4h3v6h-3z" fill={P.ink} />
        <path d="M2 2h22v10H2z" fill="none" stroke={P.white} strokeWidth="1.8" />
        <path d="M27 5.5h1.5v3H27z" fill={P.white} />
        <path d="M4.5 4.5h5v5h-5z M11 4.5h5v5h-5z" fill={P.white} />
      </g>
      <PixelText text={date} x={276} y={200} size={2} fill={tint} anchor="end" />
      <PixelText text={time} x={276} y={218} size={2} fill={tint} anchor="end" />
    </svg>
  );
}

function BeachShot({ sky }: { sky: string }) {
  return (
    <>
      <rect x="-40" y="-30" width="374" height="140" fill={`url(#${sky})`} />
      <g fill={P.white} opacity="0.9">
        <ellipse cx="58" cy="34" rx="24" ry="8" />
        <ellipse cx="72" cy="27" rx="13" ry="8" />
        <ellipse cx="214" cy="22" rx="28" ry="8" />
        <ellipse cx="230" cy="16" rx="14" ry="7" />
      </g>
      <rect x="-40" y="96" width="374" height="52" fill={P.sky} />
      <path d="M-40 96 L334 96" stroke={P.skyDeep} strokeWidth="2" />
      <g transform="translate(150 87)">
        <path d="M0 8 L20 8 L16 12 L4 12 Z" fill={P.white} stroke={P.ink} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 7 L10 -7 L18 6 Z" fill={P.tomato} stroke={P.ink} strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <g style={{ animation: "float 3s ease-in-out infinite" }}>
        <path d="M-40 110 Q-26 104 -12 110 T16 110 T44 110 T72 110 T100 110 T128 110 T156 110 T184 110 T212 110 T240 110 T268 110 T296 110 T324 110" fill="none" stroke={P.white} strokeWidth="2.5" />
      </g>
      <g style={{ animation: "float 3s ease-in-out -1.5s infinite" }}>
        <path d="M-26 126 Q-12 120 2 126 T30 126 T58 126 T86 126 T114 126 T142 126 T170 126 T198 126 T226 126 T254 126 T282 126 T310 126 T338 126" fill="none" stroke={P.skyPale} strokeWidth="2.5" />
      </g>
      <path d="M-40 146 Q30 138 100 145 T240 143 T380 144 L380 270 L-40 270 Z" fill="#f3d38c" stroke={P.ink} strokeWidth="3" />
      <path d="M-40 142 Q30 134 100 141 T240 139 T380 140" fill="none" stroke={P.white} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <g transform="rotate(-6 62 206)">
        <rect x="30" y="196" width="62" height="20" rx="2" fill={P.bubblegum} stroke={P.ink} strokeWidth="2.5" />
        <path d="M42 196 v20 M80 196 v20" stroke={P.cream} strokeWidth="3" />
      </g>
      <path d="M58 204 L72 112" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <g transform="rotate(-8 72 112)">
        <path d="M30 118 A42 28 0 0 1 114 118 Z" fill={P.tomato} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
        <path d="M52 118 Q56 96 72 90 Q88 96 92 118 Z" fill={P.cream} stroke={P.ink} strokeWidth="2" strokeLinejoin="round" />
      </g>
      <path d="M112 204 L126 204 L124 220 L114 220 Z" fill={P.sun} stroke={P.ink} strokeWidth="2" strokeLinejoin="round" />
      <path d="M113 205 Q119 194 125 205" fill="none" stroke={P.ink} strokeWidth="1.5" />
      <path d="M236 166 L236 150 L242 150 L242 145 L248 145 L248 150 L254 150 L254 145 L260 145 L260 150 L266 150 L266 166 Z" fill="#e6bf6e" stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M251 145 L251 134 L259 137 L251 140" fill={P.tomato} stroke={P.ink} strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="196" cy="150" rx="10" ry="2.5" fill="#d9b56c" />
      <g style={{ animation: "hop 1.1s ease-in-out infinite" }}>
        <circle cx="196" cy="138" r="11" fill={P.white} />
        <path d="M185 138 A11 11 0 0 1 207 138 Z" fill={P.tomato} />
        <path d="M196 127 L196 149" stroke={P.ink} strokeWidth="1.5" />
        <circle cx="196" cy="138" r="11" fill="none" stroke={P.ink} strokeWidth="2.5" />
      </g>
    </>
  );
}

function Antenna({ x, y, glitch, scale = 1 }: { x: number; y: number; glitch: boolean; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-8 0 L0 -52 L8 0 M-6 -12 L6 -12 M-4 -26 L4 -26 M-2.5 -40 L2.5 -40 M-6 -12 L4 -26 M-4 -26 L2.5 -40 M0 -52 L0 -62" fill="none" stroke={P.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {glitch && <circle cy="-65" r="11" fill={P.screen} opacity="0.55" style={{ transformBox: "fill-box", transformOrigin: "center", animation: "resort-beacon 0.4s ease-in-out infinite" }} />}
      <circle cy="-65" r="3.6" fill={glitch ? P.screen : P.tomato} stroke={P.ink} strokeWidth="1.2" style={glitch ? undefined : { animation: "rec-blink 1.4s steps(1) infinite" }} />
    </g>
  );
}

const WINDOWS = [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => ({ row, col, x: 50 + col * 36, y: 94 + row * 22 })));

function HotelShot({ sky, glitch }: { sky: string; glitch: boolean }) {
  return (
    <>
      <rect x="-40" y="-30" width="374" height="200" fill={`url(#${sky})`} />
      <g fill={P.white} opacity="0.9">
        <ellipse cx="190" cy="34" rx="26" ry="8" />
        <ellipse cx="206" cy="28" rx="13" ry="7" />
      </g>
      <path d="M160 178 Q190 116 238 112 Q284 108 340 118 L340 180 Z" fill={P.leaf} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
      <g fill={P.leafDeep} stroke={P.ink} strokeWidth="2.5">
        <circle cx="184" cy="142" r="13" />
        <circle cx="206" cy="124" r="14" />
        <circle cx="282" cy="114" r="15" />
        <circle cx="312" cy="118" r="14" />
      </g>
      <Antenna x={238} y={112} glitch={glitch} scale={0.9} />
      <rect x="-40" y="166" width="374" height="110" fill="#f3d38c" />
      <path d="M-40 166 L334 166" stroke={P.ink} strokeWidth="3" />
      <rect x="36" y="80" width="128" height="88" fill="#ffc2cf" stroke={P.ink} strokeWidth="3" />
      <path d="M28 82 L100 56 L172 82 Z" fill={P.tomato} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
      <g stroke={P.ink} strokeWidth="2.5" strokeLinecap="round">
        <path d="M100 22 L100 17 M86 28 L82 24 M114 28 L118 24" />
      </g>
      <circle cx="100" cy="42" r="13" fill={P.sun} stroke={P.ink} strokeWidth="3" />
      <path d="M94 44 Q100 50 106 44" fill="none" stroke={P.ink} strokeWidth="2" strokeLinecap="round" />
      <circle cx="96" cy="39" r="1.6" fill={P.ink} />
      <circle cx="104" cy="39" r="1.6" fill={P.ink} />
      {WINDOWS.map(({ row, col, x, y }) =>
        row === 1 && col === 2 ? (
          <g key={`${row}${col}`}>
            <rect x={x} y={y} width="26" height="14" fill="#2c3a5e" stroke={P.ink} strokeWidth="2" />
            <rect x={x + 9} y={y + 4} width="10" height="7" fill={P.screen} style={{ animation: "resort-glow 1.7s steps(2) infinite" }} />
          </g>
        ) : (
          <g key={`${row}${col}`}>
            <rect x={x} y={y} width="26" height="14" fill={P.cream} stroke={P.ink} strokeWidth="2" />
            <path d={`M${x + 13} ${y} v14`} stroke={P.ink} strokeWidth="1.5" />
          </g>
        ),
      )}
      {glitch && (
        <g>
          {WINDOWS.map(({ row, col, x, y }) => (
            <g key={`g${row}${col}`}>
              <rect x={x} y={y} width="26" height="14" fill={P.plum950} stroke={P.ink} strokeWidth="2" />
              <text x={x + 13} y={y + 11} textAnchor="middle" fontSize="9.5" fill={P.screen} style={display}>
                404
              </text>
            </g>
          ))}
        </g>
      )}
      <rect x="88" y="148" width="24" height="20" fill={P.woodDeep} stroke={P.ink} strokeWidth="2.5" />
      <path d="M196 204 Q188 158 204 118" fill="none" stroke={P.ink} strokeWidth="9" strokeLinecap="round" />
      <path d="M196 204 Q188 158 204 118" fill="none" stroke={P.woodDeep} strokeWidth="5" strokeLinecap="round" />
      <path d="M204 118 Q186 106 170 118 M204 118 Q210 100 228 102 M204 118 Q222 122 230 138 M204 118 Q194 128 186 144" fill="none" stroke={P.ink} strokeWidth="10" strokeLinecap="round" />
      <path d="M204 118 Q186 106 170 118 M204 118 Q210 100 228 102 M204 118 Q222 122 230 138 M204 118 Q194 128 186 144" fill="none" stroke={P.leaf} strokeWidth="6" strokeLinecap="round" />
    </>
  );
}

function WindowShot({ glitch }: { glitch: boolean }) {
  return (
    <>
      <rect x="-40" y="-30" width="374" height="310" fill="#ffc2cf" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <path key={i} d={`M-40 ${i * 28 - 10} L334 ${i * 28 - 10}`} stroke="#f2a9bb" strokeWidth="2" />
      ))}
      <rect x="44" y="18" width="206" height="158" fill="#3e3566" />
      <ellipse cx="186" cy="96" rx="92" ry="64" fill={glitch ? P.screen : P.screenDeep} opacity="0.22" />
      <path d="M44 150 L250 150 L250 176 L44 176 Z" fill="#2c2550" />
      <g transform="translate(78 52)">
        <path d="M24 -8 L24 0" stroke={P.ink} strokeWidth="2" />
        <rect x="0" y="0" width="50" height="58" fill={P.cream} stroke={P.ink} strokeWidth="2.5" />
        <rect x="0" y="0" width="50" height="16" fill={P.tomato} stroke={P.ink} strokeWidth="2.5" />
        <text x="25" y="12.5" textAnchor="middle" fontSize="11" fill={P.cream} style={display}>
          DEZ 2004
        </text>
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2, 3, 4, 5].map((col) => <rect key={`${row}${col}`} x={5 + col * 7} y={21 + row * 7} width="5" height="5" fill={row === 0 && col === 3 ? P.tomato : P.cream3} />),
        )}
      </g>
      <rect x="140" y="128" width="102" height="48" fill={P.woodDeep} stroke={P.ink} strokeWidth="3" />
      <path d="M191 128 L191 176" stroke={P.ink} strokeWidth="2" />
      <rect x="148" y="62" width="86" height="66" rx="7" fill={P.steel} stroke={P.ink} strokeWidth="3" />
      <rect x="156" y="70" width="58" height="50" rx="6" fill={P.plum950} stroke={P.ink} strokeWidth="2.5" />
      <circle cx="224" cy="80" r="3.5" fill={P.steelDeep} stroke={P.ink} strokeWidth="1.5" />
      <circle cx="224" cy="92" r="3.5" fill={P.steelDeep} stroke={P.ink} strokeWidth="1.5" />
      <path d="M182 62 L172 44 M192 62 L204 42" stroke={P.ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M44 18 Q66 22 64 80 Q62 128 72 176 L44 176 Z" fill={P.cream} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M52 32 Q56 90 54 166 M60 26 Q62 80 64 170" fill="none" stroke={P.cream3} strokeWidth="3" strokeLinecap="round" />
      <path d="M250 18 Q242 32 244 100 Q246 146 240 176 L250 176 Z" fill={P.cream} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
      <rect x="44" y="18" width="206" height="158" fill="none" stroke={P.white} strokeWidth="9" />
      <rect x="39.5" y="13.5" width="215" height="167" fill="none" stroke={P.ink} strokeWidth="3" />
      <rect x="48.5" y="22.5" width="197" height="149" fill="none" stroke={P.ink} strokeWidth="2.5" />
      <rect x="30" y="176" width="234" height="12" fill={P.white} stroke={P.ink} strokeWidth="3" />
      <rect x="44" y="188" width="206" height="24" fill={P.woodDeep} stroke={P.ink} strokeWidth="3" />
      {[64, 98, 132, 166, 200, 230].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 188 L${x + 2} 174`} stroke={P.leafDeep} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={x + 2} cy="170" r="6" fill={i % 2 ? P.sun : P.tomato} stroke={P.ink} strokeWidth="2" />
          <circle cx={x + 2} cy="170" r="2" fill={P.white} />
        </g>
      ))}
    </>
  );
}

function BallShot({ sky, offset }: { sky: string; offset: number }) {
  return (
    <>
      <rect x="-40" y="-30" width="374" height="110" fill={`url(#${sky})`} />
      <path d="M200 72 Q230 44 270 46 Q300 46 334 60 L334 80 L200 80 Z" fill={P.leaf} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
      <Antenna x={268} y={50} glitch={false} scale={0.45} />
      <rect x="-40" y="72" width="374" height="92" fill={P.sky} />
      <path d="M-40 72 L334 72" stroke={P.skyDeep} strokeWidth="2" />
      <g style={{ animation: "float 2.6s ease-in-out infinite" }}>
        <path d="M-40 100 Q-24 93 -8 100 T24 100 T56 100 T88 100 T120 100 T152 100 T184 100 T216 100 T248 100 T280 100 T312 100 T344 100" fill="none" stroke={P.white} strokeWidth="3" />
      </g>
      <g style={{ animation: "float 2.6s ease-in-out -1.3s infinite" }}>
        <path d="M-30 128 Q-14 121 2 128 T34 128 T66 128 T98 128 T130 128 T162 128 T194 128 T226 128 T258 128 T290 128 T322 128 T354 128" fill="none" stroke={P.skyPale} strokeWidth="3" />
      </g>
      <path d="M-40 168 Q40 156 120 166 T260 160 T360 164 L360 280 L-40 280 Z" fill="#f3d38c" stroke={P.ink} strokeWidth="3" />
      <path d="M-40 162 Q40 150 120 160 T260 154 T360 158" fill="none" stroke={P.white} strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      <g fill="#dcb46a">
        {[
          [26, 240],
          [34, 224],
          [40, 208],
          [46, 192],
          [50, 178],
        ].map(([x, y], i) => (
          <ellipse key={i} cx={x + (i % 2) * 8} cy={y} rx="4" ry="2.4" transform={`rotate(-30 ${x} ${y})`} />
        ))}
      </g>
      <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: "resort-ball 3400ms cubic-bezier(.3,.6,.4,1) both", animationDelay: `${-offset}ms` }}>
        <circle cx="76" cy="206" r="13" fill={P.white} />
        <path d="M63 206 A13 13 0 0 1 89 206 Z" fill={P.tomato} />
        <path d="M76 193 L76 219" stroke={P.ink} strokeWidth="1.5" />
        <circle cx="76" cy="206" r="13" fill="none" stroke={P.ink} strokeWidth="2.5" />
      </g>
    </>
  );
}

const CAMERA: CSSProperties[] = [
  { animation: "resort-pan 3500ms linear both" },
  { animation: "resort-push 5100ms ease-in-out both", transformOrigin: "46% 50%" },
  { animation: "resort-drift 4000ms ease-out both", transformOrigin: "50% 55%" },
  { animation: "resort-reframe 3400ms ease-out both" },
];

const STATIC_SCREEN = { left: `${(156 / 294) * 100}%`, top: `${(70 / 246) * 100}%`, width: `${(58 / 294) * 100}%`, height: `${(50 / 246) * 100}%` };

function Shot({ shot, offset, glitch }: { shot: number; offset: number; glitch: boolean }) {
  const sky = `${useId().replace(/[^a-zA-Z0-9]/g, "")}-sky`;
  const delay = `${-offset}ms`;
  return (
    <div className="absolute inset-0" style={{ ...CAMERA[shot], animationDelay: delay }}>
      <div className="absolute inset-0" style={shot === 2 ? { animation: "resort-focus 900ms ease-out both", animationDelay: delay } : undefined}>
        <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" overflow="visible" aria-hidden>
          <defs>
            <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8fd3f5" />
              <stop offset="1" stopColor="#ffe3a8" />
            </linearGradient>
          </defs>
          {shot === 0 && <BeachShot sky={sky} />}
          {shot === 1 && <HotelShot sky={sky} glitch={glitch} />}
          {shot === 2 && <WindowShot glitch={glitch} />}
          {shot === 3 && <BallShot sky={sky} offset={offset} />}
        </svg>
        {shot === 2 && (
          <div
            className="absolute rounded-[10%] opacity-90"
            style={{ ...STATIC_SCREEN, backgroundImage: "var(--static)", backgroundSize: "60px", animation: "static-shift 0.3s steps(4) infinite" }}
          />
        )}
      </div>
    </div>
  );
}

function ResortVideoScreen() {
  const { phase: shot, offset } = useTimeline(SHOT_MARKS, RESORT_LOOP);
  const strange = useTimeline(GLITCH_MARKS, RESORT_LOOP);
  const glitch = strange.phase === 1;
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#9fdcf5]" data-shot={shot} data-strange={glitch || undefined}>
      <div className="absolute inset-0" style={{ animation: "resort-wobble 5.3s linear infinite" }}>
        <div className="absolute inset-0" style={glitch ? { animation: "resort-tear 800ms steps(1) both", animationDelay: `${-strange.offset}ms` } : undefined}>
          <div className="absolute -inset-[3%]" style={{ ...washed, animation: "handheld 3.2s ease-in-out infinite" }}>
            <Shot key={shot} shot={shot} offset={offset} glitch={glitch} />
          </div>
          <div className="absolute inset-0 bg-[#ffcf8a]/10" />
          <CamcorderOsd shot={shot} glitch={glitch} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "var(--static)", backgroundSize: "140px", animation: "static-shift 0.5s steps(4) infinite" }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3%] opacity-30" style={{ backgroundImage: "var(--static)", backgroundSize: "80px", animation: "static-shift 0.3s steps(3) infinite" }} />
      <div className="pointer-events-none absolute inset-0 opacity-0" style={{ animation: "resort-dropout 4.7s steps(1) infinite" }}>
        <div className="absolute left-[20%] top-0 h-[0.8%] w-[46%] bg-white/90" />
      </div>
      <div key={shot} className="pointer-events-none absolute inset-0 opacity-0" style={{ backgroundImage: "var(--static)", backgroundSize: "120px", animation: "resort-cut 260ms ease-out both", animationDelay: `${-offset}ms` }} />
      {glitch && (
        <>
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "var(--static)", backgroundSize: "110px", animation: "static-shift 0.24s steps(4) infinite" }} />
          <div className="pointer-events-none absolute inset-x-0 top-[36%] h-[9%] bg-white/35 mix-blend-overlay" style={{ animation: "roll-bar 0.8s linear infinite" }} />
        </>
      )}
      <Caption className="bottom-[22%]">{RESORT_SHOTS[shot].line}</Caption>
    </div>
  );
}

export const resortTape: TapeProgram = {
  Screen: ResortVideoScreen,
  loop: RESORT_LOOP,
  cues: [{ at: RESORT_GLITCH.from, mascot: { expression: "confused", line: "Ué. Que data é essa?" }, sound: "static" }],
};
