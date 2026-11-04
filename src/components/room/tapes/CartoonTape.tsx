"use client";

import "./cartoon.css";
import type { CSSProperties } from "react";
import { Mascot404, type MascotExpression } from "@/components/mascot/Mascot404";
import { P } from "@/lib/palette";
import { useTimeline } from "./broadcast";
import { Caption, VhsOverlay, chroma, washed, type TapeCue, type TapeProgram } from "./vhs";

type Shot = "wide" | "close" | "sneeze" | "after";

type Beat = { at: number; shot: Shot; expression: MascotExpression; line: string | null; tilt: number; flicker?: number };

export const BEATS: Beat[] = [
  { at: 0, shot: "wide", expression: "sleepy", line: "— Eu não tô doente. Só tô com um pouco de chiado.", tilt: 0 },
  { at: 3800, shot: "close", expression: "surprised", line: "— Aaa...", tilt: -3, flicker: 900 },
  { at: 4500, shot: "close", expression: "surprised", line: "— Aaa... aaa...", tilt: -6, flicker: 520 },
  { at: 5200, shot: "close", expression: "surprised", line: "— Aaa... aaa... AAA...", tilt: -10, flicker: 240 },
  { at: 5900, shot: "sneeze", expression: "static", line: null, tilt: 9 },
  { at: 7500, shot: "after", expression: "dizzy", line: "— Viu? Nem foi nada.", tilt: 0 },
];

export const CARTOON_LOOP = 9800;

const MARKS = BEATS.map((beat) => beat.at);
const SNEEZE_AT = BEATS.find((beat) => beat.shot === "sneeze")!.at;
const FACE = { x: 28.7, y: 35.8 };
const SNEEZE_FACE = { x: 32.5, y: 36.5 };

const SPRAY = [
  [-38, -26, P.white],
  [-20, -40, P.steel],
  [4, -44, P.white],
  [26, -36, P.ink],
  [44, -18, P.white],
  [52, 4, P.steel],
  [46, 26, P.white],
  [22, 40, P.ink],
  [-4, 46, P.steel],
  [-30, 34, P.white],
  [-46, 10, P.ink],
  [-50, -8, P.steel],
  [64, -30, P.screen],
  [-60, 30, P.screen],
] as const;

const FLAKES = [
  [8, 74, P.white],
  [20, 77.5, P.steel],
  [47, 75, P.white],
  [60, 78, P.ink],
  [83, 76, P.steel],
  [93, 74.5, P.white],
  [62.5, 43.5, P.white],
  [75, 43, P.steel],
  [86, 48.5, P.white],
  [70, 37.5, P.steel],
  [27, 15.5, P.white],
] as const;

const DROPOUTS = [
  { className: "left-[12%] top-[31%] w-[46%]", duration: 4300, delay: -900 },
  { className: "left-[40%] top-[58%] w-[38%]", duration: 6100, delay: -3700 },
  { className: "left-[6%] top-[83%] w-[30%]", duration: 7700, delay: -2100 },
];

function shotStart(phase: number) {
  let start = phase;
  while (start > 0 && BEATS[start - 1].shot === BEATS[phase].shot) start -= 1;
  return start;
}

function cameraStyle(shot: Shot, since: number): CSSProperties {
  if (shot === "close") return { transformOrigin: `${FACE.x}% ${FACE.y}%`, animation: `cartoon-push 2100ms linear ${-since}ms both` };
  if (shot === "sneeze") return { transformOrigin: `${FACE.x}% ${FACE.y}%`, animation: `cartoon-recoil 560ms ease-out ${-since}ms both` };
  return {};
}

function motionFor(phase: number) {
  if (phase === 0) return "breathe 2.6s ease-in-out infinite";
  if (phase === 3) return "shake 0.2s linear infinite";
  if (BEATS[phase].shot === "sneeze") return "shake 0.3s ease-in-out 2";
  if (BEATS[phase].shot === "after") return "wobble 1.3s ease-in-out infinite";
  return undefined;
}

function Room() {
  return (
    <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="294" height="246" fill="#bfe9de" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={i * 48 + 12} y="0" width="10" height="180" fill="#a6dccf" />
      ))}
      <rect y="176" width="294" height="70" fill={P.wood} />
      <path d="M0 196 L294 196 M0 222 L294 222" stroke={P.woodDeep} strokeWidth="2" opacity="0.5" />
      <path d="M0 176 L294 176" stroke={P.ink} strokeWidth="3" />
    </svg>
  );
}

function Furniture() {
  return (
    <div className="absolute inset-0" style={{ filter: "drop-shadow(0.5cqw 0 0 rgba(239,79,67,.4)) drop-shadow(-0.5cqw 0 0 rgba(92,185,240,.4))" }}>
      <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect x="176" y="40" width="74" height="54" rx="4" fill={P.sky} stroke={P.ink} strokeWidth="3" />
        <path d="M213 40 L213 94 M176 67 L250 67" stroke={P.ink} strokeWidth="3" />
        <path d="M168 94 L258 94" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
        <rect x="164" y="122" width="104" height="44" rx="10" fill={P.plum500} stroke={P.ink} strokeWidth="3" />
        <rect x="172" y="110" width="40" height="20" rx="6" fill={P.cream} stroke={P.ink} strokeWidth="3" />
        <path d="M172 166 L170 176 M260 166 L262 176" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Scarf() {
  return (
    <svg viewBox="0 -6 200 304" className="absolute inset-0 h-full w-full" overflow="visible" aria-hidden>
      <path d="M128 172 L146 220 L126 227 L114 177 Z" fill={P.tomato} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M118 198 L138 191 M122 212 L142 205" stroke={P.cream} strokeWidth="5" />
      <path d="M128 172 L146 220 L126 227 L114 177 Z" fill="none" stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M128 227 L127 235 M135 225 L135 233 M142 222 L144 230" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M54 162 Q100 152 146 162 L148 178 Q100 190 52 178 Z" fill={P.tomato} />
      <path d="M74 160 L74 181 M96 158 L96 184 M118 158 L118 184 M138 161 L138 180" stroke={P.cream} strokeWidth="6" />
      <path d="M54 162 Q100 152 146 162 L148 178 Q100 190 52 178 Z" fill="none" stroke={P.ink} strokeWidth="4.5" strokeLinejoin="round" />
    </svg>
  );
}

function Spray({ since }: { since: number }) {
  return (
    <>
      {SPRAY.map(([dx, dy, color], i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            transformOrigin: `${SNEEZE_FACE.x}% ${SNEEZE_FACE.y}%`,
            ["--dx" as string]: `${dx}%`,
            ["--dy" as string]: `${dy}%`,
            animation: `cartoon-spray ${520 + (i % 4) * 90}ms ease-out ${(i % 3) * 30 - since}ms both`,
          }}
        >
          <span
            className="absolute aspect-square w-[2.2%] -translate-x-1/2 -translate-y-1/2 border border-ink/60"
            style={{ left: `${SNEEZE_FACE.x}%`, top: `${SNEEZE_FACE.y}%`, backgroundColor: color }}
          />
        </div>
      ))}
    </>
  );
}

function Flakes({ since }: { since: number }) {
  return (
    <>
      {FLAKES.map(([x, y, color], i) => (
        <div key={i} className="absolute inset-0" style={{ animation: `cartoon-fall ${900 + (i % 4) * 160}ms cubic-bezier(.3,.6,.5,1) ${(i % 5) * 110 - since}ms both` }}>
          <span
            className="absolute aspect-square w-[2.4%] -translate-x-1/2 -translate-y-full border border-ink/50"
            style={{ left: `${x}%`, top: `${y}%`, backgroundColor: color, rotate: `${(i % 3) * 20 - 20}deg` }}
          />
        </div>
      ))}
    </>
  );
}

function CutGlitch({ since }: { since: number }) {
  if (since > 420) return null;
  const at = `${-since}ms`;
  return (
    <div className="pointer-events-none absolute inset-0 z-[4]" style={{ animation: `cartoon-cut 380ms linear ${at} both` }}>
      <div
        className="absolute inset-x-[-10%] top-0 h-[18%] opacity-80 mix-blend-screen"
        style={{ backgroundImage: "var(--static)", backgroundSize: "120px", animation: `cartoon-band 340ms linear ${at} both` }}
      />
      <div className="absolute inset-x-0 top-[22%] h-[1.2%] bg-white/85" />
      <div className="absolute left-[30%] right-0 top-[47%] h-[0.8%] bg-white/70" />
      <div className="absolute left-0 right-[42%] top-[69%] h-[1.4%] bg-white/80" />
      <div className="absolute inset-x-0 top-[88%] h-[6%] bg-ink/60" />
    </div>
  );
}

function CartoonTapeScreen() {
  const { phase, offset } = useTimeline(MARKS, CARTOON_LOOP);
  const beat = BEATS[phase];
  const first = shotStart(phase);
  const since = beat.at - BEATS[first].at + offset;
  const sneezing = beat.shot === "sneeze";
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#bfe9de]">
      <div className="absolute inset-0" style={washed}>
        <div key={first} className="absolute inset-0" style={{ animation: `cartoon-tear 300ms steps(6) ${-since}ms both` }}>
          <div className="absolute inset-0" style={cameraStyle(beat.shot, since)}>
            <Room />
            <Furniture />
            <div
              className="absolute bottom-[24%] left-[14%] w-[32%]"
              style={{ filter: "drop-shadow(0.6cqw 0 0 rgba(239,79,67,.45)) drop-shadow(-0.6cqw 0 0 rgba(92,185,240,.45))" }}
            >
              <div style={{ transform: `rotate(${beat.tilt}deg)`, transformOrigin: "50% 96%", transition: `transform ${sneezing ? 80 : 450}ms ease-out` }}>
                <div key={phase} className="relative" style={{ transformOrigin: "50% 100%", animation: motionFor(phase) }}>
                  <Mascot404 pose="full" expression={beat.expression} className="w-full" />
                  {beat.flicker ? (
                    <div className="absolute inset-0 opacity-0" style={{ animation: `cartoon-flicker ${beat.flicker}ms steps(1) infinite` }}>
                      <Mascot404 pose="full" expression="static" className="h-full w-full" />
                    </div>
                  ) : null}
                  {phase === 0 && (
                    <div className="absolute inset-0 opacity-0" style={{ animation: `cartoon-blip 140ms steps(1) ${2450 - offset}ms, cartoon-blip 100ms steps(1) ${2700 - offset}ms` }}>
                      <Mascot404 pose="full" expression="static" className="h-full w-full" />
                    </div>
                  )}
                  <Scarf />
                </div>
              </div>
            </div>
            {sneezing && <Spray since={since} />}
            {beat.shot === "after" && <Flakes since={since} />}
          </div>
        </div>
        {sneezing && (
          <>
            <div
              className="absolute inset-0"
              style={{ backgroundImage: "var(--static)", backgroundSize: "120px", animation: `cartoon-burst 900ms ease-out ${-since}ms both, static-shift 0.24s steps(4) infinite` }}
            />
            <div className="absolute left-[45%] top-[25%] z-[3]">
              <p
                className="border-[3px] border-ink bg-sun px-[0.45em] pb-[0.05em] pt-[0.15em] font-display text-[max(11px,10cqw)] leading-none text-ink shadow-[0.12em_0.12em_0_0_var(--color-ink)]"
                style={{ animation: `cartoon-sign 420ms ease-out ${120 - since}ms both` }}
              >
                ATCHIM!
              </p>
            </div>
          </>
        )}
        <p className="absolute right-[6%] top-[16%] z-[3] text-center font-display text-[max(5px,3.4cqw)] leading-[0.9] text-white/65 mix-blend-screen">
          CANAL
          <span className="block text-[2em] leading-[0.85]">404</span>
        </p>
        {DROPOUTS.map((line) => (
          <div
            key={line.className}
            className={`absolute z-[3] h-[0.7%] bg-white/80 opacity-0 ${line.className}`}
            style={{ animation: `cartoon-dropout ${line.duration}ms linear ${line.delay}ms infinite` }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-[20%] bg-gradient-to-b from-ink/25 to-transparent" />
      <CutGlitch key={`cut${first}`} since={since} />
      {beat.line && <Caption className="bottom-[17%]">{beat.line}</Caption>}
      <div className="absolute inset-x-0 bottom-0 z-[5] flex h-[14%] items-center justify-center bg-ink/85 pb-[1.5%]">
        <p className="font-display text-[max(7px,5.8cqw)] leading-none tracking-wide text-sun" style={chroma}>
          EP. 03 — 404 PEGA UM CHIADO
        </p>
      </div>
      <div
        className="pointer-events-none absolute inset-x-[-4%] bottom-0 z-[6] h-[2.6%] opacity-50"
        style={{ backgroundImage: "var(--static)", backgroundSize: "120px", animation: "cartoon-headswitch 0.5s steps(3) infinite, static-shift 0.3s steps(3) infinite" }}
      />
      <VhsOverlay counter="SP 0:03:12" />
    </div>
  );
}

export const cartoonCues: TapeCue[] = [{ at: SNEEZE_AT, sound: "static", mascot: { expression: "surprised", line: "Eu juro que não tava doente." } }];

export const cartoonTape: TapeProgram = { Screen: CartoonTapeScreen, loop: CARTOON_LOOP, cues: cartoonCues };
