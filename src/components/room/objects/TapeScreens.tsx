"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { GAME_LOGOS } from "@/components/art/GameLogos";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { P } from "@/lib/palette";

const display = { fontFamily: "var(--font-luckiest)" };
const chroma: CSSProperties = { textShadow: "1.5px 0 rgba(239,79,67,.8), -1.5px 0 rgba(92,185,240,.8)" };
const washed: CSSProperties = { filter: "saturate(.78) contrast(1.06) sepia(.08)" };

function useLoop(count: number, ms: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), ms);
    return () => window.clearInterval(id);
  }, [count, ms]);
  return index;
}

function VhsOverlay({ counter }: { counter: string }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-[9%] bg-white/30 mix-blend-overlay" style={{ animation: "vhs-track 3.4s linear infinite" }} />
      <p className="absolute left-[6%] top-[6%] z-[5] font-display text-[clamp(7px,0.9vw,15px)] leading-none text-cream" style={chroma}>
        ▶ PLAY
      </p>
      <p className="absolute right-[6%] top-[6%] z-[5] font-display text-[clamp(7px,0.9vw,15px)] leading-none text-cream" style={chroma}>
        {counter}
      </p>
    </>
  );
}

function Outlined({ x, y, size, fill, children, stroke = 7 }: { x: number; y: number; size: number; fill: string; children: ReactNode; stroke?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fill={fill} stroke={P.ink} strokeWidth={stroke} paintOrder="stroke" strokeLinejoin="round" style={display}>
      {children}
    </text>
  );
}

const SNEEZE = [
  { expression: "sleepy" as const, line: "— Eu não tô doente. Só tô com um pouco de chiado." },
  { expression: "static" as const, line: "— ATCHIIIM!" },
];

export function CartoonTapeScreen() {
  const shot = useLoop(SNEEZE.length, 2600);
  const { expression, line } = SNEEZE[shot];
  return (
    <div className="absolute inset-0 bg-[#bfe9de]">
      <div className="absolute inset-0" style={washed}>
        <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <rect width="294" height="246" fill="#bfe9de" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={i * 48 + 12} y="0" width="10" height="180" fill="#a6dccf" />
          ))}
          <rect x="176" y="40" width="74" height="54" rx="4" fill={P.sky} stroke={P.ink} strokeWidth="3" />
          <path d="M213 40 L213 94 M176 67 L250 67" stroke={P.ink} strokeWidth="3" />
          <rect x="164" y="122" width="104" height="44" rx="10" fill={P.plum500} stroke={P.ink} strokeWidth="3" />
          <rect x="172" y="110" width="40" height="20" rx="6" fill={P.cream} stroke={P.ink} strokeWidth="3" />
          <rect y="176" width="294" height="70" fill={P.wood} />
          <path d="M0 176 L294 176" stroke={P.ink} strokeWidth="3" />
          <rect x="0" y="212" width="294" height="34" fill={P.ink} opacity="0.85" />
        </svg>
        <div key={shot} className="absolute bottom-[24%] left-[14%] w-[32%]" style={{ animation: shot ? "shake 0.32s ease-in-out 2" : "breathe 2.6s ease-in-out infinite" }}>
          <Mascot404 pose="full" expression={expression} className="w-full" />
        </div>
        {shot === 1 && (
          <div className="absolute left-[46%] top-[22%] -rotate-6">
            <p
              className="border-[3px] border-ink bg-sun px-[0.5em] py-[0.15em] font-display text-[clamp(10px,1.4vw,24px)] leading-none text-ink"
              style={{ animation: "pop-in 0.25s ease-out both" }}
            >
              ATCHIM!
            </p>
          </div>
        )}
        {shot === 1 && <div className="absolute inset-0 opacity-25 mix-blend-screen" style={{ backgroundImage: "var(--static)", backgroundSize: "120px" }} />}
      </div>
      <p className="absolute inset-x-[8%] bottom-[16%] z-[5] text-center">
        <span className="rounded-sm bg-ink/80 px-[0.4em] font-hand text-[clamp(7px,0.9vw,15px)] leading-snug text-cream [box-decoration-break:clone]">{line}</span>
      </p>
      <p className="absolute inset-x-0 bottom-[3%] z-[5] text-center font-display text-[clamp(7px,0.85vw,14px)] tracking-wide text-sun">EP. 03 — 404 PEGA UM CHIADO</p>
      <VhsOverlay counter="SP 0:03:12" />
    </div>
  );
}

function Starburst({ color }: { color: string }) {
  return (
    <svg viewBox="-150 -150 300 300" className="absolute left-1/2 top-[40%] h-[190%] w-[190%] -translate-x-1/2 -translate-y-1/2" aria-hidden>
      <g style={{ animation: "spin-slow 14s linear infinite", transformOrigin: "0 0" }}>
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const b = a + Math.PI / 14;
          return <path key={i} d={`M0 0 L${(Math.cos(a) * 200).toFixed(1)} ${(Math.sin(a) * 200).toFixed(1)} L${(Math.cos(b) * 200).toFixed(1)} ${(Math.sin(b) * 200).toFixed(1)} Z`} fill={color} />;
        })}
      </g>
    </svg>
  );
}

function AdFrame({ frame }: { frame: number }) {
  const Logo = GAME_LOGOS["dead-end-street"];
  if (frame === 0) {
    return (
      <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" aria-hidden>
        <Outlined x={147} y={92} size={30} fill={P.white}>
          CANSADO DE
        </Outlined>
        <Outlined x={147} y={128} size={26} fill={P.sun}>
          BRINCAR NA
        </Outlined>
        <Outlined x={147} y={162} size={30} fill={P.white}>
          CALÇADA?
        </Outlined>
      </svg>
    );
  }
  if (frame === 1) {
    return (
      <>
        <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" aria-hidden>
          <Outlined x={147} y={70} size={26} fill={P.white}>
            AGORA A RUA
          </Outlined>
          <Outlined x={147} y={102} size={26} fill={P.white}>
            É SUA!
          </Outlined>
          <g style={{ animation: "screen-shoe 1.6s cubic-bezier(.3,.1,.6,1) infinite" }}>
            <g transform="translate(-30 150) scale(1.4)">
              <path d="M0 0 Q2 -10 12 -10 L20 -10 Q24 -2 34 -2 Q42 0 40 8 L0 8 Z" fill={P.tomato} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M2 8 L40 8" stroke={P.white} strokeWidth="3" />
            </g>
          </g>
        </svg>
        <div className="absolute right-[10%] top-[56%] rotate-12">
          <p className="border-[3px] border-ink bg-sun px-[0.45em] py-[0.1em] font-display text-[clamp(10px,1.4vw,24px)] leading-none text-ink" style={{ animation: "pop-in 0.3s ease-out 0.5s both" }}>
            BOING!
          </p>
        </div>
      </>
    );
  }
  if (frame === 2) {
    return (
      <>
        <div className="absolute left-1/2 top-[16%] w-[72%] -translate-x-1/2 drop-shadow-[0_4px_0_rgba(29,24,48,0.6)]">{Logo && <Logo className="w-full" />}</div>
        <div
          className="absolute right-[6%] top-[14%] grid aspect-square w-[22%] place-items-center rounded-full border-[3px] border-ink bg-tomato font-display text-[clamp(9px,1.2vw,20px)] leading-none text-cream"
          style={{ animation: "wobble 0.6s ease-in-out infinite" }}
        >
          NOVO!
        </div>
      </>
    );
  }
  return (
    <>
      <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" aria-hidden>
        <Outlined x={147} y={104} size={46} fill={P.sun} stroke={9}>
          PEÇA JÁ!*
        </Outlined>
      </svg>
      <p className="absolute inset-x-[10%] top-[52%] text-center font-hand text-[clamp(6px,0.72vw,12px)] leading-tight text-cream">
        *Peça pra sua mãe. Estilingue vendido separadamente.
      </p>
    </>
  );
}

const AD_COLORS = [
  { bg: P.skyDeep, ray: P.sky },
  { bg: P.tangerineDeep, ray: P.tangerine },
  { bg: P.plum600, ray: P.plum500 },
  { bg: P.tomatoDeep, ray: P.tomato },
];

export function StreetAdScreen() {
  const frame = useLoop(AD_COLORS.length, 2300);
  const colors = AD_COLORS[frame];
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: colors.bg }}>
      <div className="absolute inset-0" style={washed}>
        <Starburst color={colors.ray} />
        <div key={frame} className="absolute inset-0" style={{ animation: "pop-in 0.28s ease-out both" }}>
          <AdFrame frame={frame} />
        </div>
      </div>
      <VhsOverlay counter="SP 0:00:30" />
    </div>
  );
}

export function ResortVideoScreen() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#9fdcf5]">
      <div className="absolute -inset-[4%]" style={{ ...washed, animation: "handheld 3.2s ease-in-out infinite" }}>
        <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id="resort-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8fd3f5" />
              <stop offset="1" stopColor="#ffe3a8" />
            </linearGradient>
          </defs>
          <rect width="294" height="246" fill="url(#resort-sky)" />
          <path d="M196 120 Q236 64 294 74 L294 128 Z" fill={P.leaf} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M252 76 L252 40 M244 50 L260 50 M246 60 L258 60" stroke={P.ink} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="252" cy="38" r="3.5" fill={P.tomato} style={{ animation: "rec-blink 1.4s steps(1) infinite" }} />
          <rect y="118" width="294" height="34" fill={P.sky} />
          <g style={{ animation: "float 3s ease-in-out infinite" }}>
            <path d="M0 128 Q14 122 28 128 T56 128 T84 128 T112 128 T140 128 T168 128 T196 128 T224 128 T252 128 T280 128 T308 128" fill="none" stroke={P.white} strokeWidth="2.5" />
          </g>
          <rect y="150" width="294" height="96" fill="#f3d38c" />
          <path d="M0 150 Q74 144 148 150 T294 150" fill="none" stroke={P.ink} strokeWidth="3" />
          <rect x="34" y="66" width="120" height="86" fill="#ffc2cf" stroke={P.ink} strokeWidth="3" />
          <path d="M28 66 L94 40 L160 66 Z" fill={P.tomato} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="94" cy="30" r="13" fill={P.sun} stroke={P.ink} strokeWidth="3" />
          <path d="M88 32 Q94 38 100 32" fill="none" stroke={P.ink} strokeWidth="2" strokeLinecap="round" />
          <circle cx="90" cy="27" r="1.6" fill={P.ink} />
          <circle cx="98" cy="27" r="1.6" fill={P.ink} />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => <rect key={`${row}${col}`} x={48 + col * 34} y={78 + row * 22} width="22" height="14" fill={P.cream} stroke={P.ink} strokeWidth="2" />),
          )}
          <g className="opacity-0" style={{ animation: "cam-glitch 7s linear infinite" }}>
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => (
                <g key={`g${row}${col}`}>
                  <rect x={48 + col * 34} y={78 + row * 22} width="22" height="14" fill={P.plum950} stroke={P.ink} strokeWidth="2" />
                  <text x={59 + col * 34} y={89 + row * 22} textAnchor="middle" fontSize="9" fill={P.screen} style={display}>
                    404
                  </text>
                </g>
              )),
            )}
          </g>
          <path d="M222 156 Q216 116 232 92" fill="none" stroke={P.woodDeep} strokeWidth="6" strokeLinecap="round" />
          <path d="M232 92 Q214 82 198 92 M232 92 Q240 76 258 80 M232 92 Q248 96 258 112 M232 92 Q222 100 212 116" fill="none" stroke={P.leaf} strokeWidth="7" strokeLinecap="round" />
          <g style={{ animation: "hop 1.1s ease-in-out infinite" }}>
            <circle cx="176" cy="190" r="11" fill={P.white} stroke={P.ink} strokeWidth="2.5" />
            <path d="M165 190 A11 11 0 0 1 187 190 Z" fill={P.tomato} />
            <path d="M176 179 L176 201" stroke={P.ink} strokeWidth="1.5" />
          </g>
        </svg>
      </div>
      <div className="absolute inset-0 opacity-0 mix-blend-screen" style={{ backgroundImage: "var(--static)", backgroundSize: "120px", animation: "cam-glitch 7s linear infinite" }} />
      {[
        "left-[5%] top-[6%] border-l-[2px] border-t-[2px]",
        "right-[5%] top-[6%] border-r-[2px] border-t-[2px]",
        "left-[5%] bottom-[6%] border-b-[2px] border-l-[2px]",
        "right-[5%] bottom-[6%] border-b-[2px] border-r-[2px]",
      ].map((corner) => (
        <div key={corner} className={`absolute size-[9%] border-white/90 ${corner}`} />
      ))}
      <p className="absolute left-[9%] top-[10%] flex items-center gap-[0.35em] rounded-sm bg-ink/60 px-[0.3em] py-[0.15em] font-display text-[clamp(7px,0.85vw,14px)] leading-none text-white">
        <span className="inline-block size-[0.7em] rounded-full bg-tomato" style={{ animation: "rec-blink 1s steps(1) infinite" }} />
        REC
      </p>
      <span className="absolute right-[9%] top-[10%] flex h-[5%] w-[9%] items-stretch gap-[6%] border-[1.5px] border-white p-[1px]">
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-white" />
        <span className="flex-1" />
      </span>
      <p className="absolute inset-x-[10%] bottom-[20%] text-center">
        <span className="rounded-sm bg-ink/75 px-[0.4em] font-hand text-[clamp(7px,0.9vw,15px)] leading-snug text-white [box-decoration-break:clone]">— Mãe, a TV do quarto ligou sozinha de novo.</span>
      </p>
      <p className="absolute bottom-[9%] right-[9%] rounded-sm bg-ink/60 px-[0.3em] py-[0.15em] font-display text-[clamp(7px,0.85vw,14px)] leading-none">
        <span className="text-white" style={{ animation: "cam-steady 7s linear infinite" }}>
          17 JUL 2004 14:03
        </span>
        <span className="absolute right-[0.3em] top-[0.15em] whitespace-nowrap text-screen opacity-0" style={{ animation: "cam-glitch 7s linear infinite" }}>
          04 DEZ 2004 04:04
        </span>
      </p>
    </div>
  );
}

const LYRICS = ["Meu amor é um chuvisco", "que aparece às quatro e quatro", "eu dei um tapa na antena", "e agora eu só pego o gato"];
const LINE_MS = 3200;

export function KaraokeScreen() {
  const line = useLoop(LYRICS.length, LINE_MS);
  return (
    <div className="absolute inset-0 overflow-hidden bg-plum-900">
      <div className="absolute inset-0" style={washed}>
        <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <rect width="294" height="246" fill={P.plum900} />
          <g style={{ animation: "spot-sway 4s ease-in-out infinite alternate", transformOrigin: "60px 0px" }}>
            <path d="M52 0 L68 0 L120 170 L20 170 Z" fill={P.sunPale} opacity="0.22" />
          </g>
          <g style={{ animation: "spot-sway 4s ease-in-out -2s infinite alternate", transformOrigin: "234px 0px" }}>
            <path d="M226 0 L242 0 L276 170 L176 170 Z" fill={P.bubblegum} opacity="0.2" />
          </g>
          {[
            [30, 40],
            [262, 52],
            [148, 22],
            [96, 70],
            [204, 88],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill={P.sunPale} style={{ animation: `rec-blink ${1 + (x % 5) * 0.3}s steps(1) infinite` }} />
          ))}
          <ellipse cx="147" cy="146" rx="118" ry="16" fill={P.plum600} stroke={P.ink} strokeWidth="3" />
          <path d="M190 144 L190 84" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
          <path d="M182 144 L198 144" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
          <rect x="184" y="68" width="12" height="20" rx="6" fill={P.steel} stroke={P.ink} strokeWidth="3" />
        </svg>
        <div className="absolute bottom-[40%] left-[33%] w-[26%]" style={{ animation: "screen-dance 0.8s ease-in-out infinite alternate" }}>
          <Mascot404 pose="full" expression={line % 2 ? "excited" : "happy"} className="w-full" />
        </div>
      </div>
      <p className="absolute inset-x-0 top-[6%] z-[5] text-center font-display text-[clamp(7px,0.85vw,14px)] tracking-wide text-sun">♪ BALADA DO CHUVISCO ♪</p>
      <div className="absolute inset-x-[6%] bottom-[5%] z-[5] rounded-md border-[2px] border-ink bg-plum-950/90 px-[4%] pb-[2%] pt-[3.5%] text-center">
        <p className="relative inline-block font-display text-[clamp(7px,0.85vw,14px)] uppercase leading-tight tracking-wide" key={line}>
          <span
            className="absolute -top-[0.8em] left-0 block size-[0.5em]"
            style={{ animation: `karaoke-ball ${LINE_MS}ms linear both` }}
          >
            <span className="block size-full rounded-full border border-ink bg-tomato" style={{ animation: "karaoke-hop 0.4s ease-in-out infinite alternate" }} />
          </span>
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(90deg, ${P.sun} 50%, ${P.cream} 50%)`,
              backgroundSize: "200% 100%",
              animation: `karaoke-fill ${LINE_MS}ms linear both`,
            }}
          >
            {LYRICS[line]}
          </span>
        </p>
        <p className="mt-[1%] font-display text-[clamp(6px,0.62vw,10px)] uppercase leading-tight tracking-wide text-plum-300">{LYRICS[(line + 1) % LYRICS.length]}</p>
      </div>
    </div>
  );
}
