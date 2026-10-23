"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { P } from "@/lib/palette";
import { spotStyle, SPOTS, type Spot } from "../layout";

const ink = { stroke: P.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const display = { fontFamily: "var(--font-luckiest)" };

function ArcadeArt({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 280 664" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        <path d="M30 26 L262 26 L262 650 L36 650 Z" fill={P.ink} opacity="0.45" transform="translate(12 6)" />
        <path d="M22 18 L258 18 L258 124 L250 140 L250 340 L274 352 L274 412 L254 420 L254 640 L26 640 L26 420 L6 412 L6 352 L30 340 L30 140 L22 124 Z" fill={P.plum700} {...ink} />
        <path d="M232 150 L240 150 L240 336 L232 336 Z M236 430 L246 430 L246 630 L236 630 Z" fill={P.plum800} />
        <path d="M30 160 Q60 250 30 330" fill="none" stroke={P.tangerine} strokeWidth="10" strokeLinecap="round" />
        <path d="M44 440 Q100 500 60 620" fill="none" stroke={P.mint} strokeWidth="12" strokeLinecap="round" />
        <path d="M70 440 Q130 520 96 630" fill="none" stroke={P.bubblegum} strokeWidth="8" strokeLinecap="round" opacity="0.9" />
        <path d="M200 600 l10 -22 l10 22 l-22 -14 l24 0 Z" fill={P.sun} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 18 L258 18 L258 124 L22 124 Z" fill={P.plum950} {...ink} />
        <rect x="34" y="30" width="212" height="82" rx="8" fill={P.plum900} stroke={P.ink} strokeWidth="4" />
        <g style={{ animation: active ? "none" : "marquee-glow 2.6s ease-in-out infinite" }}>
          <text x="140" y="68" textAnchor="middle" fontSize="38" fill={P.sun} stroke={P.ink} strokeWidth="6" paintOrder="stroke" style={display} transform="rotate(-4 140 68)">
            TODOS
          </text>
          <text x="140" y="104" textAnchor="middle" fontSize="30" fill={P.bubblegum} stroke={P.ink} strokeWidth="6" paintOrder="stroke" style={display} transform="rotate(-4 140 104)">
            OS JOGOS
          </text>
        </g>
        {[48, 232].map((x) => (
          <circle key={x} cx={x} cy="44" r="5" fill={active ? P.white : P.sun} stroke={P.ink} strokeWidth="2.5" />
        ))}
        <path d="M30 140 L250 140 L250 340 L30 340 Z" fill={P.plum800} stroke={P.ink} strokeWidth="5" strokeLinejoin="round" />
        <rect x="42" y="150" width="196" height="180" rx="14" fill={P.ink} />
        <path d="M6 352 L30 340 L250 340 L274 352 Z" fill={P.plum500} {...ink} />
        <path d="M6 352 L274 352 L274 412 L6 412 Z" fill={P.plum600} {...ink} />
        <path d="M14 360 L266 360" stroke={P.plum300} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        <g
          style={{
            transformOrigin: "80px 384px",
            transformBox: "view-box",
            transform: active ? "rotate(-24deg)" : undefined,
            transition: "transform 180ms cubic-bezier(.3,1.8,.5,1)",
          }}
          className="arcade-stick"
        >
          <path d="M80 384 L80 350" stroke={P.ink} strokeWidth="8" strokeLinecap="round" />
          <circle cx="80" cy="344" r="15" fill={P.tomato} stroke={P.ink} strokeWidth="4.5" />
          <circle cx="75" cy="339" r="4" fill={P.white} opacity="0.8" />
        </g>
        <ellipse cx="80" cy="386" rx="20" ry="7" fill={P.ink} />
        {[
          [146, P.tomato],
          [182, P.sun],
          [218, P.mint],
        ].map(([x, c]) => (
          <g key={x as number}>
            <ellipse cx={x as number} cy="384" rx="14" ry="9" fill={P.ink} />
            <ellipse cx={x as number} cy={active ? 382 : 378} rx="13" ry="8" fill={c as string} stroke={P.ink} strokeWidth="3.5" />
          </g>
        ))}
        {[428, 440, 452].map((y) => (
          <path key={y} d={`M96 ${y} L184 ${y}`} stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
        ))}
        <rect x="48" y="476" width="94" height="112" rx="8" fill={P.steel} {...ink} />
        <path d="M56 484 L134 484" stroke={P.white} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        {[504, 544].map((y) => (
          <g key={y}>
            <rect x="66" y={y} width="58" height="28" rx="5" fill={active ? P.sun : P.tangerine} stroke={P.ink} strokeWidth="3.5" />
            <rect x="92" y={y + 6} width="6" height="16" rx="2" fill={P.ink} />
          </g>
        ))}
        <text x="95" y="602" textAnchor="middle" fontSize="13" fill={P.cream} style={display} letterSpacing="1">
          FICHA
        </text>
        <path d="M26 620 L254 620 L254 640 L26 640 Z" fill={P.ink} />
        <g transform="rotate(7 206 520)">
          <path d="M158 474 L254 470 L258 566 L162 570 Z" fill={P.ink} opacity="0.35" transform="translate(4 5)" />
          <path d="M158 474 L254 470 L258 566 L162 570 Z" fill={P.sunPale} stroke={P.ink} strokeWidth="3.5" strokeLinejoin="round" />
          <rect x="190" y="462" width="34" height="14" fill={P.mint} opacity="0.85" transform="rotate(-6 207 469)" />
          <text x="207" y="504" textAnchor="middle" fontSize="15" fill={P.ink} style={{ fontFamily: "var(--font-patrick)" }}>
            CLIQUE
          </text>
          <text x="207" y="524" textAnchor="middle" fontSize="15" fill={P.ink} style={{ fontFamily: "var(--font-patrick)" }}>
            PARA
          </text>
          <text x="207" y="544" textAnchor="middle" fontSize="15" fill={P.ink} style={{ fontFamily: "var(--font-patrick)" }}>
            EXPLORAR!
          </text>
          <path d="M184 552 Q206 560 232 550" stroke={P.tomato} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

function AttractScreen({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#10122e]">
      <div
        className="absolute inset-x-0 -top-full h-[200%]"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 20% 10%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 70% 30%, #ffe39a 50%, transparent 51%), radial-gradient(2px 2px at 40% 60%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 85% 80%, #9df0dc 50%, transparent 51%), radial-gradient(1.5px 1.5px at 10% 70%, #fff 50%, transparent 51%), radial-gradient(2px 2px at 55% 90%, #f06ba8 50%, transparent 51%)",
          backgroundSize: "100% 50%",
          animation: "starfield 6s linear infinite",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[8%] text-center">
        <svg viewBox="0 0 16 12" className="w-[30%]" style={{ imageRendering: "pixelated", animation: "float 1.6s steps(2) infinite" }} aria-hidden>
          <rect x="3" y="0" width="1" height="2" fill="#ef4f43" />
          <rect x="12" y="0" width="1" height="2" fill="#ffc83d" />
          <rect x="2" y="2" width="12" height="9" fill="#f7ecd4" />
          <rect x="3" y="3" width="10" height="7" fill="#9df0dc" />
          <rect x="5" y="5" width="1" height="2" fill="#1d1830" />
          <rect x="10" y="5" width="1" height="2" fill="#1d1830" />
          <rect x="6" y="8" width="4" height="1" fill="#1d1830" />
          <rect x="1" y="5" width="1" height="3" fill="#7b62c4" />
          <rect x="14" y="5" width="1" height="3" fill="#7b62c4" />
        </svg>
        {active ? (
          <p className="font-display text-[clamp(8px,1.05vw,17px)] leading-none text-lime">FICHA OK!</p>
        ) : (
          <p
            className="font-display text-[clamp(7px,0.9vw,15px)] leading-none text-sun"
            style={{ animation: "insert-coin 1.1s steps(1) infinite" }}
          >
            INSIRA FICHA
          </p>
        )}
        <p className="font-display text-[clamp(6px,0.62vw,11px)] leading-none text-plum-300">5 JOGOS NA MEMÓRIA</p>
      </div>
      <div className="pointer-events-none absolute inset-0 scanlines opacity-60" />
      {active && <div className="pointer-events-none absolute inset-0 bg-white" style={{ animation: "flash-out 420ms ease-out both" }} />}
    </div>
  );
}

export function Arcade({
  active,
  onActivate,
  onHint,
  onHoverSound,
}: {
  active: boolean;
  onActivate: () => void;
  onHint: (hint: string | null, spot: Spot) => void;
  onHoverSound: () => void;
}) {
  const spot = SPOTS.arcade;
  const hint = "Todos os jogos moram dentro do fliperama. Até os que ainda não ficaram prontos.";
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onActivate();
  };
  return (
    <Link
      href="/jogos"
      onClick={handleClick}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        onHoverSound();
        onHint(hint, spot);
      }}
      onPointerLeave={(e) => e.pointerType === "mouse" && onHint(null, spot)}
      onFocus={() => onHint(hint, spot)}
      onBlur={() => onHint(null, spot)}
      className="group absolute block cursor-pointer rounded-2xl [--focus:var(--color-sun)] [&_.arcade-stick]:hover:[transform:rotate(14deg)]"
      style={{ ...spotStyle(spot), zIndex: 11 }}
    >
      <span className="sr-only">Todos os jogos: abrir o catálogo no fliperama</span>
      <span aria-hidden className="block h-full w-full transition-[transform,filter] duration-200 group-hover:-translate-y-1 group-hover:drop-shadow-[0_0_18px_rgba(255,200,61,0.55)] group-focus-visible:-translate-y-1">
        <ArcadeArt active={active} />
        <span className="absolute overflow-hidden rounded-[7%]" style={{ left: "15%", top: "22.6%", width: "70%", height: "27.1%" }}>
          <AttractScreen active={active} />
        </span>
      </span>
    </Link>
  );
}
