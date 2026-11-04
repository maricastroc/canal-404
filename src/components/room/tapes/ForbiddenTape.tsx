"use client";

import type { CSSProperties } from "react";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { P } from "@/lib/palette";
import { useTimeline } from "./broadcast";
import { display, inkOutline, VhsOverlay, washed, type TapeProgram } from "./vhs";
import "./forbidden.css";

export const FORBIDDEN_BEATS = { dance: 0, notice: 2800, stare: 4000, disguise: 5400, lunge: 6900, noise: 7900, card: 8500 };
export const FORBIDDEN_LENGTH = 10000;
export const FORBIDDEN_MESSAGE = ["NÃO ERA PRA", "VOCÊ VER ISSO"];

const MARKS = Object.values(FORBIDDEN_BEATS);
const COUNTER_MARKS = [0, 800, 1800, 2800, 3800, 4800, 5800, 6800, 7800, 8800];

const Beat = { Dance: 0, Notice: 1, Stare: 2, Disguise: 3, Lunge: 4, Noise: 5, Card: 6 };

function Note({ className, style, color }: { className: string; style?: CSSProperties; color: string }) {
  return (
    <svg viewBox="0 0 24 30" className={`absolute ${className}`} style={style} aria-hidden>
      <path d="M9 23 L9 4 L21 1 L21 19" fill="none" stroke={P.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M9 23 L9 4 L21 1 L21 19" fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
      <ellipse cx="5.5" cy="24" rx="5" ry="4" fill={color} stroke={P.ink} strokeWidth="2" />
      <ellipse cx="17.5" cy="20" rx="5" ry="4" fill={color} stroke={P.ink} strokeWidth="2" />
    </svg>
  );
}

function Bedroom() {
  return (
    <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="294" height="246" fill="#2a3a6a" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <rect key={i} x={i * 26 + 8} y="0" width="9" height="180" fill="#2f4276" />
      ))}
      <rect x="24" y="38" width="70" height="72" fill="#141c44" stroke={P.ink} strokeWidth="4" />
      <circle cx="72" cy="58" r="10" fill={P.sunPale} />
      <circle cx="77" cy="54" r="9" fill="#141c44" />
      <g fill={P.sunPale}>
        <circle cx="38" cy="52" r="1.4" />
        <circle cx="50" cy="90" r="1.2" />
        <circle cx="82" cy="94" r="1.4" />
      </g>
      <path d="M59 38 L59 110 M24 74 L94 74" stroke={P.ink} strokeWidth="3.5" />
      <rect x="18" y="108" width="82" height="7" fill={P.cream} stroke={P.ink} strokeWidth="3" />
      <rect x="200" y="30" width="30" height="36" fill={P.cream} stroke={P.ink} strokeWidth="3" transform="rotate(5 215 48)" />
      <text x="215" y="54" textAnchor="middle" fontSize="13" fill={P.tomato} stroke={P.ink} strokeWidth="2.5" paintOrder="stroke" transform="rotate(5 215 48)" style={display}>
        404
      </text>
      <rect y="176" width="294" height="70" fill={P.woodDeep} />
      <path d="M0 176 L294 176" stroke={P.ink} strokeWidth="4" />
      {[196, 218].map((y) => (
        <path key={y} d={`M0 ${y} L294 ${y}`} stroke={P.woodDark} strokeWidth="2" />
      ))}
      <ellipse cx="140" cy="212" rx="100" ry="19" fill={P.bubblegumDeep} stroke={P.ink} strokeWidth="3" />
      <ellipse cx="140" cy="212" rx="78" ry="12" fill="none" stroke={P.bubblegum} strokeWidth="3" />
      <circle cx="262" cy="92" r="52" fill={P.sunPale} opacity="0.16" />
      <ellipse cx="262" cy="206" rx="18" ry="5" fill={P.ink} />
      <path d="M262 204 L262 96" stroke={P.ink} strokeWidth="4" />
      <path d="M248 62 L276 62 L288 96 L236 96 Z" fill={P.sunPale} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function Lampshade() {
  return (
    <svg viewBox="0 -6 200 304" className="absolute inset-0 h-full w-full" overflow="visible" aria-hidden>
      <ellipse cx="100" cy="64" rx="78" ry="12" fill={P.sunPale} opacity="0.45" />
      <path d="M58 -34 L142 -34 L180 60 L20 60 Z" fill={P.sunPale} stroke={P.ink} strokeWidth="6" strokeLinejoin="round" />
      <path d="M78 -34 L66 60 M100 -34 L100 60 M122 -34 L134 60" stroke={P.sunDeep} strokeWidth="3.5" opacity="0.45" />
      <path d="M20 60 L180 60" stroke={P.tangerine} strokeWidth="5" />
      <path d="M20 60 L180 60" fill="none" stroke={P.ink} strokeWidth="2" />
    </svg>
  );
}

function Glove() {
  return (
    <svg viewBox="-70 -80 140 160" className="h-full w-full" aria-hidden>
      <path d="M-30 42 Q0 52 30 42 L36 74 Q0 86 -36 74 Z" fill={P.white} stroke={P.ink} strokeWidth="5" strokeLinejoin="round" />
      <path
        d="M-38 -4 Q-44 -42 -26 -46 Q-26 -66 -10 -64 Q-4 -76 10 -70 Q24 -72 26 -54 Q42 -54 40 -24 Q50 -32 58 -20 Q64 -6 44 14 Q32 44 0 46 Q-36 46 -38 -4 Z"
        fill={P.sun}
        stroke={P.ink}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M-12 -48 L-12 -22 M5 -54 L5 -24 M22 -50 L22 -22" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
      <path d="M-30 20 Q0 36 34 18" fill="none" stroke={P.sunDeep} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Shot({ beat, offset }: { beat: number; offset: number }) {
  const delay = `${-offset}ms`;
  if (beat === Beat.Dance || beat === Beat.Notice) {
    const dancing = beat === Beat.Dance;
    return (
      <>
        <Bedroom />
        <div className="absolute bottom-[10%] left-[31%] w-[36%]" style={dancing ? { animation: "screen-dance 0.6s ease-in-out infinite alternate" } : { transform: "rotate(-7deg)" }}>
          <div style={dancing ? undefined : { animation: "forbidden-startle 380ms ease-out both", animationDelay: delay }}>
            <Mascot404 pose="wave" expression={dancing ? "happy" : "surprised"} className="w-full" />
          </div>
        </div>
        {dancing ? (
          <>
            <Note className="left-[17%] top-[34%] w-[7%]" color={P.sun} style={{ animation: "forbidden-note 1.2s ease-out infinite" }} />
            <Note className="left-[70%] top-[38%] w-[6%]" color={P.bubblegum} style={{ animation: "forbidden-note 1.2s ease-out -0.4s infinite" }} />
            <Note className="left-[23%] top-[56%] w-[5%]" color={P.mint} style={{ animation: "forbidden-note 1.2s ease-out -0.8s infinite" }} />
          </>
        ) : (
          <p className="absolute left-[59%] top-[13%] font-display text-[max(16px,15cqw)] leading-none text-sun" style={{ ...inkOutline, animation: "pop-in 0.25s ease-out both", animationDelay: delay }}>
            !
          </p>
        )}
      </>
    );
  }
  if (beat === Beat.Stare) {
    return (
      <>
        <div className="absolute inset-0 bg-[#2a3a6a]" />
        <div className="absolute -right-[10%] -top-[20%] size-[70%] rounded-full bg-[#ffe39a]/20 blur-[6px]" />
        <div className="absolute inset-0" style={{ animation: "forbidden-push 1400ms ease-out both", animationDelay: delay }}>
          <div className="absolute left-1/2 top-[56%] w-[80%] -translate-x-1/2 -translate-y-1/2">
            <Mascot404 pose="head" expression="neutral" className="w-full" />
            <svg viewBox="0 0 20 28" className="absolute right-[4%] top-[18%] w-[7%]" style={{ animation: "pop-in 0.3s ease-out both", animationDelay: `${500 - offset}ms` }} aria-hidden>
              <path d="M10 2 Q18 14 18 19 A8 8 0 0 1 2 19 Q2 14 10 2 Z" fill={P.sky} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M6 18 Q6 14 9 11" fill="none" stroke={P.white} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </>
    );
  }
  if (beat === Beat.Disguise) {
    return (
      <>
        <Bedroom />
        <div className="absolute bottom-[10%] left-[45%] w-[30%]" style={{ animation: "forbidden-tremble 0.16s steps(2) infinite" }}>
          <Mascot404 pose="full" expression="sleepy" className="w-full" />
          <Lampshade />
          <Note className="-right-[10%] top-[30%] w-[20%]" color={P.cream} style={{ animation: "forbidden-note 1.4s ease-out infinite" }} />
        </div>
      </>
    );
  }
  if (beat === Beat.Lunge) {
    return (
      <>
        <Bedroom />
        <div className="absolute bottom-[10%] left-[32%] w-[36%]" style={{ transformOrigin: "50% 30%", animation: "forbidden-rush 1000ms ease-in both", animationDelay: delay }}>
          <Mascot404 pose="wave" expression="surprised" className="w-full" />
        </div>
        <div className="absolute inset-0 bg-ink" style={{ animation: "forbidden-dim 1000ms ease-in both", animationDelay: delay }} />
        <div className="absolute left-1/2 top-1/2 w-[118%]" style={{ animation: "forbidden-glove 1000ms cubic-bezier(.3,.5,.6,1) both", animationDelay: delay }}>
          <Glove />
        </div>
      </>
    );
  }
  if (beat === Beat.Noise) {
    return (
      <div className="absolute inset-0 bg-ink" style={{ animation: "forbidden-tear 600ms steps(1) both", animationDelay: delay }}>
        <div className="absolute inset-0" style={{ backgroundImage: "var(--static)", backgroundSize: "120px", animation: "static-shift 0.2s steps(4) infinite" }} />
        <div className="absolute inset-x-0 top-[30%] h-[16%] bg-white/40" style={{ animation: "roll-bar 0.6s linear infinite" }} />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-[#2343b8]">
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "var(--static)", backgroundSize: "120px" }} />
      <div className="absolute inset-0 flex items-center justify-center px-[8%] pt-[6%]" style={{ animation: "forbidden-card 700ms steps(6) both", animationDelay: delay }}>
        <p className="text-center font-hand text-[max(13px,12cqw)] font-bold leading-[1.05] text-sun" style={inkOutline}>
          {FORBIDDEN_MESSAGE[0]}
          <br />
          {FORBIDDEN_MESSAGE[1]}
        </p>
      </div>
    </div>
  );
}

function ForbiddenTapeScreen() {
  const { phase, offset } = useTimeline(MARKS);
  const counter = useTimeline(COUNTER_MARKS).phase + 1;
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#2a3a6a]" data-beat={phase}>
      <div className="absolute inset-0" style={washed}>
        <Shot key={phase} beat={phase} offset={offset} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 h-[12%] bg-white/20" style={{ animation: "roll-bar 2.8s linear infinite" }} />
      <VhsOverlay counter={`SP 0:04:${String(counter).padStart(2, "0")}`} />
    </div>
  );
}

export const forbiddenTape: TapeProgram = {
  Screen: ForbiddenTapeScreen,
  length: FORBIDDEN_LENGTH,
  cues: [
    { at: FORBIDDEN_BEATS.notice, mascot: { expression: "surprised" } },
    { at: FORBIDDEN_BEATS.noise, sound: "static" },
    { at: FORBIDDEN_LENGTH, eject: true, mascot: { expression: "wink", line: ["Isso nunca aconteceu.", "Era só um alongamento.", "Essa fita vai pro fundo da estante."] } },
  ],
};
