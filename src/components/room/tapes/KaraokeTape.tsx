"use client";

import "./karaoke.css";
import { Fragment, useId, useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { Mascot404, type MascotExpression } from "@/components/mascot/Mascot404";
import { KARAOKE_SONG, parseNotes, type Track } from "@/lib/audio/tracks";
import { P } from "@/lib/palette";
import { useTimeline } from "./broadcast";
import { washed, type TapeCue, type TapeProgram } from "./vhs";

export const STEPS_PER_BAR = 16;
export const STEP_MS = 60000 / KARAOKE_SONG.bpm / 4;
export const BAR_MS = STEP_MS * STEPS_PER_BAR;

export const VERSES = [
  "Meu |a|mor |é |um |chu|vis|co",
  "que a|pa|re|ce às |qua|tro e |qua|tro",
  "eu |dei |um |ta|pa |na an|te|na",
  "e a|go|ra eu |só |pe|go o |ga|to",
  "Chu|vis|cooo|ooooo!",
];

const FIRST_VERSE_BAR = 1;

export type Syllable = { text: string; gap: boolean; at: number; until: number };

export function noteOnsets(notes: string, bar: number) {
  const from = bar * STEPS_PER_BAR;
  return parseNotes(notes)
    .slice(from, from + STEPS_PER_BAR)
    .flatMap((note, step) => (note ? [from + step] : []));
}

export function syllablesFor(verse: string, bar: number, track: Track = KARAOKE_SONG): Syllable[] {
  const onsets = noteOnsets(track.lead.notes, bar);
  const parts = verse.split("|");
  const step = (i: number) => onsets[i] ?? (i < parts.length ? bar * STEPS_PER_BAR + i * 2 : (bar + 1) * STEPS_PER_BAR);
  return parts.map((part, i) => ({
    text: part.trimEnd(),
    gap: part.endsWith(" "),
    at: step(i) * STEP_MS,
    until: (i + 1 < parts.length ? step(i + 1) : (bar + 1) * STEPS_PER_BAR) * STEP_MS,
  }));
}

export const LYRICS = VERSES.map((verse, line) => syllablesFor(verse, FIRST_VERSE_BAR + line));
export const SONG_MS = parseNotes(KARAOKE_SONG.lead.notes).length * STEP_MS;
export const SCORE_AT = SONG_MS;
export const RESULT_AT = SCORE_AT + 1200;
export const SHOW_MS = RESULT_AT + 700;
export const SCORE = "4,04";

const FINALE = LYRICS.length - 1;
const COUNT_IN = [3, 2, 1];

type Kind = "title" | "count" | "sing" | "score" | "result";

export type Beat = { at: number; kind: Kind; line: number; syllable: number; count: number };

export const BEATS: Beat[] = [
  { at: 0, kind: "title", line: 0, syllable: -1, count: 0 },
  ...COUNT_IN.map((count, i) => ({ at: (i + 1) * 4 * STEP_MS, kind: "count" as const, line: 0, syllable: -1, count })),
  ...LYRICS.flatMap((syllables, line) => syllables.map((s, syllable) => ({ at: s.at, kind: "sing" as const, line, syllable, count: 0 }))),
  { at: SCORE_AT, kind: "score", line: FINALE, syllable: -1, count: 0 },
  { at: RESULT_AT, kind: "result", line: FINALE, syllable: -1, count: 0 },
];

const BEAT_MARKS = BEATS.map((beat) => beat.at);
const SECTION_MARKS = [0, ...LYRICS.map((_, line) => (FIRST_VERSE_BAR + line) * BAR_MS), SCORE_AT, RESULT_AT];

type Move = "hop" | "lean" | "slap" | "wobble" | "reach" | "crack";

const FACES: MascotExpression[][] = [
  ["happy", "love", "love", "love", "happy", "excited", "excited", "excited"],
  ["happy", "happy", "excited", "excited", "excited", "happy", "excited", "happy"],
  ["happy", "excited", "happy", "surprised", "surprised", "dizzy", "dizzy", "dizzy"],
  ["happy", "happy", "happy", "excited", "happy", "happy", "wink", "wink"],
  ["excited", "excited", "love", "static"],
];

const MOVES: (Move | null)[][] = [
  [null, null, "lean", null, null, "hop", "hop", null],
  [null, null, "lean", null, "hop", null, "hop", null],
  [null, "hop", null, "slap", null, "wobble", "wobble", "wobble"],
  [null, null, null, "hop", null, null, "lean", null],
  ["hop", "hop", "reach", "crack"],
];

const ENDING_PLACE = "translate(-64%, 12%) scale(1.2)";
const PLACES = ["translateX(0%)", ...[0, -14, 10, -8, 0].map((x) => `translateX(${x}%)`), ENDING_PLACE, ENDING_PLACE];

const LIGHTS = [
  [P.sunPale, P.bubblegum, P.sunPale],
  [P.skyPale, P.mint, P.skyPale],
  [P.tangerine, P.tomato, P.sun],
  [P.plum300, P.bubblegum, P.sky],
  [P.sun, P.bubblegum, P.sky],
];

const BEAMS = [
  { x: 40, aim: -24, swing: "", period: 2 },
  { x: 147, aim: 4, swing: "reverse", period: 1 },
  { x: 254, aim: 31, swing: "", period: 2 },
];

const DRIZZLE = [24, 52, 78, 101, 133, 162, 189, 214, 241, 268].map((x, i) => ({ x, y: 30 + ((i * 37) % 90), delay: (i * 173) % 700 }));

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: 4 + ((i * 53) % 92),
  color: [P.sun, P.bubblegum, P.sky, P.mint, P.tangerine, P.cream][i % 6],
  delay: (i * 211) % 1500,
  duration: 1500 + ((i * 97) % 700),
  drift: ((i * 29) % 13) - 6,
  spin: 240 + ((i * 61) % 360),
}));

const ROLL = ["0,00", "9,87", "3,21", "7,65", "1,09", "8,88", "5,43", "9,99"];

const OUTLINE: CSSProperties = {
  textShadow: [
    "0.07em 0 0 #1d1830",
    "-0.07em 0 0 #1d1830",
    "0 0.07em 0 #1d1830",
    "0 -0.07em 0 #1d1830",
    "0.05em 0.05em 0 #1d1830",
    "-0.05em 0.05em 0 #1d1830",
    "0.05em -0.05em 0 #1d1830",
    "-0.05em -0.05em 0 #1d1830",
    "0 0.14em 0 #1d1830",
  ].join(", "),
};

const vars = (values: Record<string, string>) => values as CSSProperties;

function isFirstSyllable(beat: Beat) {
  return beat.kind === "sing" && beat.line === 0 && beat.syllable === 0;
}

function beatLength(phase: number) {
  return (BEAT_MARKS[phase + 1] ?? SHOW_MS) - BEAT_MARKS[phase];
}

function rowLine(row: number, current: number) {
  const line = current % 2 === row ? current : current + 1;
  return line < LYRICS.length ? line : null;
}

function faceFor(beat: Beat): MascotExpression {
  if (beat.kind === "sing") return FACES[beat.line][beat.syllable];
  if (beat.kind === "score") return "surprised";
  if (beat.kind === "result") return "happy";
  return "neutral";
}

function moveStyle(beat: Beat, length: number, offset: number): CSSProperties | undefined {
  const at = `${-offset}ms`;
  if (beat.kind === "score") return { animation: `karaoke-gasp 600ms ease-out ${at} both` };
  if (beat.kind === "result") return { animation: `karaoke-bow 1500ms cubic-bezier(.45,0,.3,1) ${at} both` };
  if (beat.kind !== "sing") return undefined;
  const move = MOVES[beat.line][beat.syllable];
  if (move === "hop") return { animation: `karaoke-jump 380ms ease-out ${at} both` };
  if (move === "lean") return { animation: `karaoke-lean ${length}ms ease-in-out ${at} both` };
  if (move === "slap") return { animation: `karaoke-slap 460ms ease-out ${at} both` };
  if (move === "wobble") return { animation: `karaoke-wobble ${length}ms ease-in-out ${at} both` };
  if (move === "reach") return { animation: `karaoke-reach ${length}ms ease-out ${at} both` };
  if (move === "crack") return { animation: `karaoke-crack ${length}ms linear ${at} both` };
  return undefined;
}

function Stage({ beat, section, sectionOffset, uid }: { beat: Beat; section: number; sectionOffset: number; uid: string }) {
  const singing = beat.kind === "sing";
  const finale = singing && beat.line === FINALE;
  const lit = singing;
  const colors = LIGHTS[Math.min(beat.line, LIGHTS.length - 1)];
  const at = `${-sectionOffset}ms`;
  const drizzle = singing && ((beat.line === 0 && beat.syllable >= 5) || finale);
  return (
    <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        {BEAMS.map((_, i) => (
          <linearGradient key={i} id={`${uid}-beam${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colors[i]} stopOpacity="0.75" />
            <stop offset="1" stopColor={colors[i]} stopOpacity="0" />
          </linearGradient>
        ))}
        <clipPath id={`${uid}-sky`}>
          <rect x="0" y="14" width="294" height="136" />
        </clipPath>
        <radialGradient id={`${uid}-pool`}>
          <stop offset="0" stopColor={colors[1]} stopOpacity="0.55" />
          <stop offset="1" stopColor={colors[1]} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="294" height="246" fill={P.plum950} />
      <rect y="14" width="294" height="140" fill={P.plum900} />
      {Array.from({ length: 15 }, (_, i) => (
        <rect key={i} x={i * 20 - 2} y="14" width="9" height="140" fill={i % 2 ? P.plum800 : P.plum700} opacity="0.55" />
      ))}
      {[
        [38, 52],
        [92, 34],
        [204, 30],
        [252, 64],
        [70, 104],
        [226, 112],
        [118, 70],
        [180, 82],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={`M${x} ${y - 4} L${x + 1.2} ${y - 1.2} L${x + 4} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4} L${x - 1.2} ${y + 1.2} L${x - 4} ${y} L${x - 1.2} ${y - 1.2} Z`}
          fill={P.sunPale}
          style={{ animation: `rec-blink ${1.2 + (i % 4) * 0.4}s steps(1) ${-(i * 300) - sectionOffset}ms infinite` }}
        />
      ))}
      <g style={{ opacity: lit ? 1 : 0 }}>
        {BEAMS.map((beam, i) => (
          <g key={`${section}-${i}`} transform={`rotate(${beam.aim} ${beam.x} -8)`}>
            <g
              style={{
                transformOrigin: `${beam.x}px -8px`,
                animation: `karaoke-sweep ${(finale ? 800 : 1600) * beam.period}ms ease-in-out ${at} infinite alternate${beam.swing ? " " + beam.swing : ""}`,
              }}
            >
              <path
                d={`M${beam.x - 6} -8 L${beam.x + 6} -8 L${beam.x + 34} 168 L${beam.x - 34} 168 Z`}
                fill={`url(#${uid}-beam${i})`}
                style={{ mixBlendMode: "screen", animation: finale ? `karaoke-strobe 400ms steps(1) ${-(i * 200) - sectionOffset}ms infinite` : undefined }}
              />
            </g>
          </g>
        ))}
      </g>
      <path d="M14 150 L280 150 L294 170 L0 170 Z" fill={P.wood} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M60 150 L44 170 M106 150 L98 170 M147 150 L147 170 M188 150 L196 170 M234 150 L250 170" stroke={P.woodDeep} strokeWidth="1.6" opacity="0.6" />
      <ellipse cx="128" cy="160" rx="56" ry="9" fill={`url(#${uid}-pool)`} style={{ opacity: lit ? 1 : 0 }} />
      <rect x="-2" y="170" width="298" height="10" fill={P.woodDeep} stroke={P.ink} strokeWidth="2.5" />
      {Array.from({ length: 9 }, (_, i) => (
        <circle
          key={i}
          cx={19 + i * 32}
          cy="175"
          r="2.6"
          fill={P.sun}
          stroke={P.ink}
          strokeWidth="1.2"
          style={{ opacity: lit ? undefined : 0.3, animation: lit ? `karaoke-bulbs 1600ms steps(1) ${(i % 2) * -800 - sectionOffset}ms infinite` : undefined }}
        />
      ))}
      {drizzle && (
        <g clipPath={`url(#${uid}-sky)`}>
          {DRIZZLE.map(({ x, y, delay }, i) => (
            <path
              key={i}
              d={`M${x} ${y - 30} l-2 7`}
              stroke={P.cream}
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.7"
              style={{ animation: `karaoke-drizzle 700ms linear ${-delay - sectionOffset}ms infinite` }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

function Cat({ beat, offset }: { beat: Beat; offset: number }) {
  const out = beat.kind === "sing" && ((beat.line === 3 && beat.syllable >= 6) || (beat.line === FINALE && beat.syllable < LYRICS[FINALE].length - 1));
  if (!out) return null;
  const at = beat.line === 3 && beat.syllable === 6 ? -offset : -1000;
  return (
    <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g style={{ animation: `karaoke-peek 420ms ease-out ${at}ms both` }}>
        <g transform="translate(242 139)">
          <path d="M8 9 Q20 16 34 12" fill="none" stroke={P.ink} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M-12 -4 L-10 -20 L-2 -11 Z M12 -4 L10 -20 L2 -11 Z" fill={P.tangerine} stroke={P.ink} strokeWidth="2.2" strokeLinejoin="round" />
          <ellipse cx="0" cy="0" rx="13.5" ry="11.5" fill={P.tangerine} stroke={P.ink} strokeWidth="2.4" />
          <path d="M-3 -11 L-2.2 -6.5 M3 -11 L2.2 -6.5 M0 -11.4 L0 -7" stroke={P.tangerineDeep} strokeWidth="1.6" strokeLinecap="round" />
          <ellipse cx="-5" cy="-1" rx="1.9" ry="2.6" fill={P.ink} />
          <ellipse cx="5" cy="-1" rx="1.9" ry="2.6" fill={P.ink} />
          <path d="M-1.6 3 L1.6 3 L0 4.6 Z" fill={P.bubblegumDeep} />
          <path d="M-9 4 L-18 2 M-9 6.5 L-18 7.5 M9 4 L18 2 M9 6.5 L18 7.5" stroke={P.ink} strokeWidth="0.9" strokeLinecap="round" />
          <rect x="-2" y="6" width="11" height="5" rx="1.5" fill={P.steel} stroke={P.ink} strokeWidth="1.6" />
          <path d="M-5 8 L-2 8 M-5 10 L-2 10" stroke={P.ink} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

function MicStand() {
  return (
    <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <ellipse cx="176" cy="161" rx="11" ry="3" fill={P.ink} />
      <path d="M176 160 L176 121 L156 109" fill="none" stroke={P.ink} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M176 160 L176 121 L156 109" fill="none" stroke={P.steelDeep} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="rotate(-58 151 106)">
        <rect x="145" y="100" width="12" height="17" rx="6" fill={P.steel} stroke={P.ink} strokeWidth="2.4" />
        <path d="M147 106 L155 106 M147 110 L155 110" stroke={P.steelDeep} strokeWidth="1.4" />
      </g>
    </svg>
  );
}

function curtainMotion(beat: Beat, offset: number) {
  const ease = `${beat.kind === "score" ? 750 : 600}ms cubic-bezier(.6,0,.25,1) ${-offset}ms both`;
  if (isFirstSyllable(beat)) return { open: false, drape: `karaoke-curtain ${ease}`, spot: `karaoke-fade-out 400ms ease-out ${-offset}ms both` };
  if (beat.kind === "score") return { open: true, drape: `karaoke-curtain ${ease} reverse`, spot: `karaoke-fade-in 600ms ease-out ${300 - offset}ms both` };
  return { open: beat.kind === "sing", drape: undefined, spot: undefined };
}

function Curtain({ beat, offset, uid }: { beat: Beat; offset: number; uid: string }) {
  const motion = curtainMotion(beat, offset);
  const drape = (side: "left" | "right") => {
    const flip = side === "right";
    return (
      <g
        style={{
          transformOrigin: flip ? "294px 0px" : "0px 0px",
          transform: motion.open ? "scaleX(0.2)" : undefined,
          animation: motion.drape,
        }}
      >
        <g transform={flip ? "translate(294 0) scale(-1 1)" : undefined}>
          <path d="M-4 10 L152 10 L152 174 Q132 182 114 174 Q96 182 78 174 Q60 182 42 174 Q24 182 6 174 L-4 174 Z" fill={P.tomatoDeep} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${6 + i * 18} 10 Q${2 + i * 18} 90 ${6 + i * 18} 176`} fill="none" stroke={P.tomato} strokeWidth="7" opacity="0.9" />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M${16 + i * 18} 14 Q${13 + i * 18} 90 ${15 + i * 18} 172`} fill="none" stroke={P.ink} strokeWidth="1.2" opacity="0.35" />
          ))}
        </g>
      </g>
    );
  };
  const spot = beat.kind === "title" || beat.kind === "count" ? { x: 147, y: 96, r: 92 } : beat.kind === "score" || beat.kind === "result" ? { x: 86, y: 118, r: 70 } : null;
  return (
    <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id={`${uid}-curtain-spot`}>
          <stop offset="0" stopColor={P.sunPale} stopOpacity="0.5" />
          <stop offset="0.7" stopColor={P.sunPale} stopOpacity="0.12" />
          <stop offset="1" stopColor={P.sunPale} stopOpacity="0" />
        </radialGradient>
      </defs>
      {drape("left")}
      {drape("right")}
      {spot && (
        <circle
          cx={spot.x}
          cy={spot.y}
          r={spot.r}
          fill={`url(#${uid}-curtain-spot)`}
          style={{ mixBlendMode: "screen", opacity: motion.open ? 0 : 1, animation: motion.spot }}
        />
      )}
      <path
        d={`M-2 -2 L296 -2 L296 18 ${Array.from({ length: 12 }, (_, i) => `Q${294 - i * 24.5 - 12.25} 30 ${294 - (i + 1) * 24.5} 18`).join(" ")} Z`}
        fill={P.tomatoDeep}
        stroke={P.ink}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d={`M0 15 ${Array.from({ length: 12 }, (_, i) => `Q${i * 24.5 + 12.25} 26 ${(i + 1) * 24.5} 15`).join(" ")}`} fill="none" stroke={P.sun} strokeWidth="1.8" />
    </svg>
  );
}

function Singer({ beat, phase, offset, section, sectionOffset }: { beat: Beat; phase: number; offset: number; section: number; sectionOffset: number }) {
  const ending = beat.kind === "score" || beat.kind === "result";
  const singing = beat.kind === "sing";
  const finale = singing && beat.line === FINALE;
  const loop = ending
    ? beat.kind === "result"
      ? `karaoke-breathe 1600ms ease-in-out ${1500 - sectionOffset}ms infinite`
      : undefined
    : `karaoke-sway ${finale ? 800 : 1600}ms ease-in-out ${-sectionOffset}ms infinite`;
  return (
    <div className={`absolute bottom-[34%] left-[32.3%] w-[22.4%] ${ending ? "z-[3]" : "z-[1]"}`}>
      <div
        key={`place-${section}`}
        style={{
          transformOrigin: "50% 100%",
          ...vars({ "--from": PLACES[Math.max(0, section - 1)], "--to": PLACES[section] }),
          animation: `karaoke-shift ${ending ? 750 : 450}ms cubic-bezier(.4,0,.2,1) ${-sectionOffset}ms both`,
        }}
      >
        <div key={`loop-${section}`} style={{ transformOrigin: "50% 100%", animation: loop }}>
          <div key={`move-${phase}`} style={{ transformOrigin: "50% 100%", ...moveStyle(beat, beatLength(phase), offset) }}>
            <Mascot404 pose="full" expression={faceFor(beat)} wiggle={singing && beat.line === 2 && beat.syllable === 3 ? 1 : 0} className="block w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function useBallStops(box: RefObject<HTMLDivElement | null>, layout: string) {
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      el.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
        const r = row.dataset.row;
        const em = parseFloat(getComputedStyle(row).fontSize) || 10;
        const parts = Array.from(row.querySelectorAll<HTMLElement>("[data-part]"));
        const top = row.offsetTop;
        const set = (key: string, x: number) => {
          el.style.setProperty(`--k${r}-${key}-x`, `${x}px`);
          el.style.setProperty(`--k${r}-${key}-y`, `${top}px`);
        };
        parts.forEach((part, i) => set(String(i), row.offsetLeft + part.offsetLeft + part.offsetWidth / 2));
        const first = parts[0];
        const last = parts[parts.length - 1];
        set("s", row.offsetLeft + (first ? first.offsetLeft : 0) - em * 0.45);
        set("e", row.offsetLeft + (last ? last.offsetLeft + last.offsetWidth : row.offsetWidth) + em * 0.55);
      });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.querySelectorAll("[data-row]").forEach((row) => observer.observe(row));
    let alive = true;
    document.fonts?.ready.then(() => alive && measure());
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [box, layout]);
}

function Row({ row, line, current, beat, offset, length }: { row: number; line: number | null; current: number; beat: Beat; offset: number; length: number }) {
  const upcoming = line !== current;
  return (
    <p
      data-row={row}
      className={`relative w-fit max-w-full whitespace-nowrap ${row ? "ml-auto" : "mr-auto"}`}
      style={{ opacity: upcoming ? 0.62 : 1 }}
    >
      {line === null
        ? " "
        : LYRICS[line].map((syllable, i) => {
            const state = line < current || (line === current && i < beat.syllable) ? "sung" : line === current && i === beat.syllable ? "active" : "next";
            return (
              <Fragment key={`${line}-${i}`}>
                <span
                  data-part={i}
                  data-syllable={state}
                  className={`relative inline-block ${state === "sung" ? "text-sun" : "text-cream"}`}
                  style={state === "active" ? { animation: `karaoke-pop 300ms ease-out ${-offset}ms both` } : undefined}
                >
                  {syllable.text}
                  {state === "active" && (
                    <span className="absolute inset-0 text-sun" style={{ animation: `karaoke-wipe ${length}ms linear ${-offset}ms both` }}>
                      {syllable.text}
                    </span>
                  )}
                </span>
                {syllable.gap ? " " : ""}
              </Fragment>
            );
          })}
    </p>
  );
}

type Stop = { row: number; key: string };

function ballPath(beat: Beat): { from: Stop; to: Stop } | null {
  if (beat.kind === "count") return { from: { row: 0, key: "s" }, to: { row: 0, key: beat.count === 1 ? "0" : "s" } };
  if (beat.kind !== "sing") return null;
  const row = beat.line % 2;
  const from = { row, key: String(beat.syllable) };
  if (beat.syllable + 1 < LYRICS[beat.line].length) return { from, to: { row, key: String(beat.syllable + 1) } };
  if (beat.line + 1 < LYRICS.length) return { from, to: { row: (beat.line + 1) % 2, key: "0" } };
  return { from, to: { row, key: "e" } };
}

function Ball({ beat, phase, offset, length }: { beat: Beat; phase: number; offset: number; length: number }) {
  const path = ballPath(beat);
  if (!path) return null;
  const { from, to } = path;
  const v = (stop: Stop, axis: "x" | "y") => `var(--k${stop.row}-${stop.key}-${axis})`;
  const lift = Math.min(1.15, 0.5 + length / 1200);
  const at = `${-offset}ms`;
  return (
    <span
      key={phase}
      className="karaoke-ball-x pointer-events-none absolute z-[2] block"
      style={{
        left: v(from, "x"),
        top: v(from, "y"),
        ...vars({ "--dx": `calc(${v(to, "x")} - ${v(from, "x")})`, "--dy": `calc(${v(to, "y")} - ${v(from, "y")})`, "--lift": `${-lift}em` }),
        animation: `karaoke-ball-x ${length}ms linear ${at} both`,
      }}
    >
      <span className="karaoke-ball-y block" style={{ animation: `karaoke-ball-y ${length}ms ${at} both` }}>
        <span className="block size-[0.42em] -translate-x-1/2 -translate-y-[115%]">
          <span
            className="block size-full rounded-full border-[0.07em] border-ink bg-tomato shadow-[inset_-0.06em_-0.08em_0_rgba(0,0,0,.25)]"
            style={{ transformOrigin: "50% 100%", animation: `karaoke-squash 220ms ease-out ${at} both` }}
          >
            <span className="ml-[22%] mt-[18%] block size-[28%] rounded-full bg-white/80" />
          </span>
        </span>
      </span>
    </span>
  );
}

function Lyrics({ beat, phase, offset }: { beat: Beat; phase: number; offset: number }) {
  const box = useRef<HTMLDivElement>(null);
  const current = beat.kind === "sing" ? beat.line : beat.kind === "score" || beat.kind === "result" ? LYRICS.length : 0;
  const rows = [rowLine(0, Math.min(current, FINALE)), rowLine(1, Math.min(current, FINALE))];
  useBallStops(box, rows.join(","));
  const length = beatLength(phase);
  const hidden = beat.kind === "score";
  if (beat.kind === "result") return null;
  return (
    <div
      className="absolute inset-x-[5.5%] bottom-[3.5%] z-[5] rounded-[1.6cqw] border-[0.6cqw] border-ink bg-plum-950/90 px-[4%] pb-[2.2%] pt-[4.2%]"
      style={{ animation: hidden ? `karaoke-fade-out 300ms ease-out ${-offset}ms both` : undefined }}
    >
      <div ref={box} className="relative flex flex-col gap-[0.5em] font-display text-[max(7px,5.1cqw)] uppercase leading-none" style={OUTLINE}>
        <Row row={0} line={rows[0]} current={current} beat={beat} offset={offset} length={length} />
        <Row row={1} line={rows[1]} current={current} beat={beat} offset={offset} length={length} />
        {!hidden && <Ball beat={beat} phase={phase} offset={offset} length={length} />}
      </div>
    </div>
  );
}

function TitleCard({ beat, offset }: { beat: Beat; offset: number }) {
  const leaving = isFirstSyllable(beat);
  if (beat.kind !== "title" && beat.kind !== "count" && !leaving) return null;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[12%] z-[4] flex flex-col items-center text-center"
      style={{ animation: leaving ? `karaoke-fade-out 300ms ease-in ${-offset}ms both` : beat.kind === "title" ? `pop-in 0.35s ease-out ${-offset}ms both` : undefined }}
    >
      <p className="rounded-full border-[0.5cqw] border-ink bg-sun px-[0.6em] py-[0.15em] font-display text-[max(7px,4.6cqw)] uppercase leading-none tracking-wide text-ink">404 canta</p>
      <p className="mt-[3%] font-display text-[max(8px,7.4cqw)] uppercase leading-none text-cream" style={OUTLINE}>
        ♪ Balada do
      </p>
      <p className="mt-[1%] font-display text-[max(10px,11.5cqw)] uppercase leading-none text-sun" style={OUTLINE}>
        Chuvisco ♪
      </p>
    </div>
  );
}

function CountIn({ beat, phase, offset }: { beat: Beat; phase: number; offset: number }) {
  const leaving = isFirstSyllable(beat);
  if (beat.kind !== "count" && !leaving) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[47%] z-[4] flex justify-center" style={leaving ? { animation: `karaoke-fade-out 250ms ease-in ${-offset}ms both` } : undefined}>
      <span
        key={leaving ? phase - 1 : phase}
        className="grid aspect-square w-[15%] place-items-center rounded-full border-[0.7cqw] border-ink bg-cream font-display text-[max(10px,10cqw)] leading-none text-ink shadow-[0_0.8cqw_0_0_var(--color-ink)]"
        style={{ animation: `karaoke-count 500ms ease-out ${-offset}ms both` }}
      >
        <span className="translate-y-[6%]">{leaving ? 1 : beat.count}</span>
      </span>
    </div>
  );
}

function Header({ beat }: { beat: Beat }) {
  if (beat.kind === "title" || beat.kind === "count") return null;
  return (
    <p className="pointer-events-none absolute inset-x-0 top-[1.4%] z-[4] text-center font-display text-[max(7px,4.3cqw)] uppercase leading-none tracking-wide text-sun" style={OUTLINE}>
      ♪ Balada do Chuvisco ♪
    </p>
  );
}

function Confetti({ sectionOffset }: { sectionOffset: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
      {CONFETTI.map((piece, i) => (
        <span
          key={i}
          className="absolute top-0 block h-[2.6%] w-[1.6%] border-[0.25cqw] border-ink"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            ...vars({ "--drift": `${piece.drift}cqw`, "--spin": `${piece.spin}deg` }),
            animation: `karaoke-confetti ${piece.duration}ms linear ${piece.delay - sectionOffset}ms infinite`,
          }}
        />
      ))}
    </div>
  );
}

function ScoreCard({ beat, offset, sectionOffset }: { beat: Beat; offset: number; sectionOffset: number }) {
  if (beat.kind !== "score" && beat.kind !== "result") return null;
  const landed = beat.kind === "result";
  return (
    <div className="pointer-events-none absolute right-[5%] top-[14%] z-[6] flex w-[46%] flex-col items-center">
      <div
        className="flex w-full flex-col items-center rounded-[2.4cqw] border-[0.8cqw] border-ink bg-plum-950 px-[6%] pb-[5%] pt-[4%] shadow-[0_1.2cqw_0_0_var(--color-ink)]"
        style={{ animation: `karaoke-drop 520ms ease-out ${landed ? -1000 : -offset}ms both` }}
      >
        <p className="font-display text-[max(7px,5.4cqw)] uppercase leading-none tracking-widest text-plum-300">Nota</p>
        <div className={`relative mt-[6%] h-[1em] font-display text-[max(14px,14cqw)] leading-none ${landed ? "" : "overflow-hidden"}`}>
          {landed ? (
            <p key="landed" className="text-lime" style={{ textShadow: "0 0 0.25em rgba(147,207,76,.55)", animation: `karaoke-stamp 420ms ease-out ${-sectionOffset}ms both` }}>
              {SCORE}
            </p>
          ) : (
            <div
              className="text-lime/80"
              style={{
                ...vars({ "--roll": `-${ROLL.length - 1}em` }),
                animation: `karaoke-roll ${RESULT_AT - SCORE_AT - 200}ms steps(${ROLL.length}, jump-none) ${200 - offset}ms both`,
              }}
            >
              {ROLL.map((value) => (
                <p key={value} className="h-[1em]">
                  {value}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      {landed && (
        <p className="mt-[8%] -rotate-2 text-center" style={{ animation: `karaoke-fade-in 400ms ease-out ${300 - sectionOffset}ms both` }}>
          <span className="rounded-sm bg-ink/85 px-[0.4em] font-hand text-[max(7px,5.4cqw)] leading-snug text-cream">Ninguém pediu bis.</span>
        </p>
      )}
    </div>
  );
}

function KaraokeScreen() {
  const raw = useId();
  const uid = `k${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const { phase, offset } = useTimeline(BEAT_MARKS);
  const { phase: section, offset: sectionOffset } = useTimeline(SECTION_MARKS);
  const beat = BEATS[phase];
  const finale = beat.kind === "sing" && beat.line === FINALE;
  const slap = beat.kind === "sing" && beat.line === 2 && beat.syllable === 3;
  const crack = finale && beat.syllable === LYRICS[FINALE].length - 1;
  return (
    <div className="absolute inset-0 overflow-hidden bg-plum-950">
      <div className="absolute inset-0" style={{ ...washed, animation: slap || crack ? `karaoke-jolt 420ms ease-out ${-offset}ms both` : undefined }}>
        <Stage beat={beat} section={section} sectionOffset={sectionOffset} uid={uid} />
        <Cat beat={beat} offset={offset} />
        <Singer beat={beat} phase={phase} offset={offset} section={section} sectionOffset={sectionOffset} />
        <div className="absolute inset-0 z-[2]">
          <MicStand />
          <Curtain beat={beat} offset={offset} uid={uid} />
        </div>
        {finale && <Confetti sectionOffset={sectionOffset} />}
        {(slap || crack) && (
          <div
            key={`static-${phase}`}
            className="pointer-events-none absolute inset-0 z-[4] mix-blend-screen"
            style={{ backgroundImage: "var(--static)", backgroundSize: "120px", animation: `karaoke-flash ${crack ? 900 : 420}ms ease-out ${-offset}ms both` }}
          />
        )}
      </div>
      <Header beat={beat} />
      <TitleCard beat={beat} offset={offset} />
      <CountIn beat={beat} phase={phase} offset={offset} />
      <Lyrics beat={beat} phase={phase} offset={offset} />
      <ScoreCard beat={beat} offset={offset} sectionOffset={sectionOffset} />
    </div>
  );
}

const GATO_AT = LYRICS[3][6].at;

export const KARAOKE_CUES: TapeCue[] = [
  { at: LYRICS[0][0].at, mascot: { expression: "excited" } },
  { at: GATO_AT, sound: "meow" },
  { at: RESULT_AT, sound: "victory", mascot: { expression: "wink", line: ["No ensaio deu 10.", "Foi a antena que desafinou."] } },
];

export const karaokeTape: TapeProgram = {
  Screen: KaraokeScreen,
  length: SHOW_MS,
  song: { track: KARAOKE_SONG, length: SONG_MS },
  cues: KARAOKE_CUES,
  rewind: "Cantar de novo",
};
