"use client";

import { Mascot404 } from "@/components/mascot/Mascot404";
import { useCopy } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { P } from "@/lib/palette";
import { useTimeline } from "./broadcast";
import { Caption, chroma, display, Outlined, VhsOverlay, washed, type TapeProgram } from "./vhs";

export const STATIC_BEATS = { tune: 0, card: 700, host: 3700, hush: 7300, game: 9300 };
export const STATIC_LENGTH = 12000;

const COPY = localized({
  "pt-BR": {
    title: ["SESSÃO", "CHIADO"],
    slot: "TODA MADRUGADA",
    host: "Boa madrugada! Fala baixinho: a Sessão Chiado vai começar.",
    hush: "(duas horas de chiado)",
    game: "…e é pênaltiii!",
    score: "2ºT 44'",
    tie: "1 x 1",
  },
  en: {
    title: ["STATIC", "SHOW"],
    slot: "EVERY NIGHT AT 3 AM",
    host: "Hey, night owls! Keep it down: the Static Show is starting.",
    hush: "(two hours of static)",
    game: "…and it's a penaltyyy!",
    score: "2H 44'",
    tie: "1-1",
  },
});

const MARKS = Object.values(STATIC_BEATS);
const COUNTER_MARKS = Array.from({ length: 12 }, (_, i) => i * 1000);
const Beat = { Tune: 0, Card: 1, Host: 2, Hush: 3, Game: 4 };

function Snow({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 bg-ink ${className}`}>
      <div className="absolute inset-0" style={{ backgroundImage: "var(--static)", backgroundSize: "120px", animation: "static-shift 0.2s steps(4) infinite" }} />
      <div className="absolute inset-x-0 top-[30%] h-[16%] bg-white/30" style={{ animation: "roll-bar 0.9s linear infinite" }} />
    </div>
  );
}

function Stars() {
  return (
    <g fill={P.sunPale}>
      {[
        [30, 30],
        [70, 64],
        [118, 22],
        [214, 40],
        [262, 74],
        [250, 18],
        [24, 112],
      ].map(([x, y]) => (
        <path key={`${x}${y}`} d={`M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 5} L${x - 1.6} ${y + 1.6} L${x - 5} ${y} L${x - 1.6} ${y - 1.6} Z`} />
      ))}
    </g>
  );
}

function TitleCard() {
  const copy = useCopy(COPY);
  return (
    <>
      <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="294" height="246" fill={P.plum900} />
        <Stars />
        <circle cx="244" cy="200" r="70" fill={P.plum700} opacity="0.6" />
        <g transform="rotate(-4 147 112)">
          <Outlined x={147} y={96} size={44} fill={P.sunPale}>
            {copy.title[0]}
          </Outlined>
          <Outlined x={147} y={146} size={48} fill={P.mint}>
            {copy.title[1]}
          </Outlined>
        </g>
        <rect x="200" y="196" width="58" height="26" rx="5" fill={P.ink} />
        <text x="229" y="215" textAnchor="middle" fontSize="16" fill={P.tomato} style={display}>
          404
        </text>
      </svg>
      <p className="absolute inset-x-0 top-[70%] text-center font-display text-[max(7px,6.4cqw)] leading-none tracking-wide text-plum-300" style={chroma}>
        {copy.slot}
      </p>
    </>
  );
}

function Host() {
  const copy = useCopy(COPY);
  return (
    <>
      <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="294" height="246" fill={P.plum800} />
        <rect x="112" y="26" width="70" height="66" fill={P.plum950} stroke={P.ink} strokeWidth="4" />
        <circle cx="158" cy="50" r="12" fill={P.sunPale} />
        <circle cx="164" cy="45" r="11" fill={P.plum950} />
        <path d="M147 26 L147 92 M112 59 L182 59" stroke={P.ink} strokeWidth="3" />
        <path d="M0 0 L66 0 Q58 90 72 246 L0 246 Z" fill={P.plum600} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
        <path d="M294 0 L228 0 Q236 90 222 246 L294 246 Z" fill={P.plum600} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
        <path d="M22 0 Q18 120 28 246 M44 0 Q40 120 50 246 M272 0 Q276 120 266 246 M250 0 Q254 120 244 246" stroke={P.plum700} strokeWidth="4" fill="none" />
        <rect y="200" width="294" height="46" fill={P.plum950} />
        <path d="M0 200 L294 200" stroke={P.ink} strokeWidth="4" />
      </svg>
      <div className="absolute bottom-[14%] left-1/2 w-[38%] -translate-x-1/2" style={{ animation: "screen-dance 1.4s ease-in-out infinite alternate" }}>
        <Mascot404 pose="wave" expression="wink" className="w-full" />
      </div>
      <Caption className="bottom-[5%]">{copy.host}</Caption>
    </>
  );
}

function Hush() {
  const copy = useCopy(COPY);
  return (
    <>
      <Snow />
      <Mascot404 expression="static" className="absolute bottom-[6%] right-[6%] w-[20%]" />
      <Caption className="top-[44%]">{copy.hush}</Caption>
    </>
  );
}

function Game({ offset }: { offset: number }) {
  const copy = useCopy(COPY);
  return (
    <>
      <div className="absolute inset-0" style={{ filter: "saturate(.7) contrast(1.08) sepia(.16)" }}>
        <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <rect width="294" height="246" fill="#3f9a4a" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={i * 44} y="0" width="22" height="246" fill="#4aa955" />
          ))}
          <path d="M294 52 L196 52 L196 196 L294 196 M294 92 L252 92 L252 156 L294 156" fill="none" stroke={P.white} strokeWidth="4" opacity="0.9" />
          <circle cx="226" cy="124" r="3.5" fill={P.white} />
          <path d="M276 96 L276 152" stroke={P.white} strokeWidth="7" strokeLinecap="round" />
          <path d="M276 96 L294 92 M276 152 L294 158 M282 98 L282 150 M288 96 L288 154" stroke={P.cream2} strokeWidth="1.5" opacity="0.8" />
          <circle cx="212" cy="124" r="9" fill={P.white} stroke={P.ink} strokeWidth="3" />
          <path d="M207 120 L212 124 L217 120 M212 124 L212 132" stroke={P.ink} strokeWidth="2" fill="none" />
          <rect x="14" y="46" width="92" height="24" rx="3" fill={P.ink} />
          <rect x="14" y="46" width="34" height="24" rx="3" fill={P.skyDeep} />
          <text x="31" y="63" textAnchor="middle" fontSize="13" fill={P.cream} style={display}>
            {copy.tie}
          </text>
          <text x="77" y="63" textAnchor="middle" fontSize="13" fill={P.sun} style={display}>
            {copy.score}
          </text>
        </svg>
      </div>
      <div className="absolute inset-0" style={{ animation: "pop-in 0.25s ease-out both", animationDelay: `${120 - offset}ms` }}>
        <Caption className="bottom-[8%]">{copy.game}</Caption>
      </div>
    </>
  );
}

function Shot({ beat, offset }: { beat: number; offset: number }) {
  if (beat === Beat.Tune) return <Snow />;
  if (beat === Beat.Card) return <TitleCard />;
  if (beat === Beat.Host) return <Host />;
  if (beat === Beat.Hush) return <Hush />;
  return <Game offset={offset} />;
}

function StaticShowScreen() {
  const { phase, offset } = useTimeline(MARKS);
  const counter = useTimeline(COUNTER_MARKS).phase;
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink" data-beat={phase}>
      <div className="absolute inset-0" style={washed}>
        <Shot key={phase} beat={phase} offset={offset} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 h-[12%] bg-white/20" style={{ animation: "roll-bar 3.2s linear infinite" }} />
      <VhsOverlay counter={`SP 0:00:${String(counter).padStart(2, "0")}`} />
    </div>
  );
}

export const staticShowTape: TapeProgram = {
  Screen: StaticShowScreen,
  length: STATIC_LENGTH,
  cues: [
    { at: STATIC_BEATS.tune, sound: "static" },
    { at: STATIC_BEATS.host, mascot: { expression: "happy" } },
    { at: STATIC_BEATS.game, sound: "static", mascot: { expression: "surprised" } },
    {
      at: STATIC_LENGTH,
      eject: true,
      mascot: {
        expression: "wink",
        line: localized({
          "pt-BR": ["Ih. O Bruno gravou por cima do jogo do pai.", "Melhor ninguém contar isso pro pai do Bruno."],
          en: ["Uh-oh. Bruno taped over his dad's game.", "Better not tell Bruno's dad about this."],
        }),
      },
    },
  ],
};
