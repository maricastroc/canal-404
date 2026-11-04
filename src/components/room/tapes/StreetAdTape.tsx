"use client";

import "./street-ad.css";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { GAME_LOGOS } from "@/components/art/GameLogos";
import { P } from "@/lib/palette";
import { useTimeline } from "./broadcast";
import { Outlined, VhsOverlay, washed, type TapeCue, type TapeProgram } from "./vhs";

const ART = "/assets/dead-end-street";
const ASSETS = ["wagon", "shoe", "arlindo", "flamingo", "gnome", "duck", "balloon", "tire", "deco", "lina"];

type Enter = "punch" | "zoom" | "whip";

type Frame = { at: number; bg: string; ray: string; enter: Enter; jolts: number[] };

export const AD_FRAMES: Frame[] = [
  { at: 0, bg: P.steelDeep, ray: P.steel, enter: "punch", jolts: [190, 410] },
  { at: 1300, bg: P.tangerineDeep, ray: P.tangerine, enter: "zoom", jolts: [330, 640] },
  { at: 2900, bg: P.skyDeep, ray: P.sky, enter: "whip", jolts: [190, 470] },
  { at: 4800, bg: P.tomatoDeep, ray: P.tomato, enter: "zoom", jolts: [190] },
  { at: 6700, bg: P.plum600, ray: P.plum500, enter: "whip", jolts: [200, 700] },
];

export const AD_LOOP = 9600;

const MARKS = AD_FRAMES.map((frame) => frame.at);
const SHOE = { launch: 240, flight: 520, hit: 240 + 520 * 0.75 };
const BOING_AT = AD_FRAMES[1].at + SHOE.hit;
const CALL_AT = AD_FRAMES[4].at + 520;

const ENTER: Record<Enter, string> = {
  punch: "ad-punch 260ms ease-out",
  zoom: "ad-zoom 340ms ease-out",
  whip: "ad-whip 240ms ease-out",
};

function play(name: string, ms: number, t: number, at = 0, easing = "ease-out", fill = "both") {
  return `${name} ${ms}ms ${easing} ${at - t}ms ${fill}`;
}

function Slam({ t, at, children }: { t: number; at: number; children: ReactNode }) {
  return <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: play("ad-slam", 380, t, at) }}>{children}</g>;
}

function Pop({ t, at, origin = "center", children }: { t: number; at: number; origin?: string; children: ReactNode }) {
  return <g style={{ transformBox: "fill-box", transformOrigin: origin, animation: play("ad-pop", 360, t, at) }}>{children}</g>;
}

function Art({ name, x, y, width, height }: { name: string; x: number; y: number; width: number; height: number }) {
  return <image href={`${ART}/${name}.svg`} x={x} y={y} width={width} height={height} />;
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

function Burst({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const points = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const d = i % 2 ? r * 0.62 : r;
    return `${(x + Math.cos(a) * d).toFixed(1)},${(y + Math.sin(a) * d).toFixed(1)}`;
  }).join(" ");
  return <polygon points={points} fill={fill} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />;
}

function Scene({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" overflow="visible" aria-hidden>
      {children}
    </svg>
  );
}

function BoredFrame({ t }: { t: number }) {
  return (
    <Scene>
      <Slam t={t} at={0}>
        <Outlined x={147} y={78} size={31} fill={P.white}>
          CANSADO DE
        </Outlined>
      </Slam>
      <Slam t={t} at={110}>
        <Outlined x={147} y={115} size={27} fill={P.sunPale}>
          BRINCAR NA
        </Outlined>
      </Slam>
      <Slam t={t} at={220}>
        <Outlined x={147} y={156} size={36} fill={P.white} stroke={8}>
          CALÇADA?
        </Outlined>
      </Slam>
    </Scene>
  );
}

function StreetFrame({ t }: { t: number }) {
  return (
    <>
      <Scene>
        <Slam t={t} at={0}>
          <Outlined x={147} y={62} size={28} fill={P.white}>
            AGORA A RUA
          </Outlined>
        </Slam>
        <Slam t={t} at={150}>
          <Outlined x={150} y={106} size={44} fill={P.sun} stroke={9}>
            É SUA!
          </Outlined>
        </Slam>
        <Pop t={t} at={60} origin="50% 100%">
          <Art name="wagon" x={4} y={110} width={88} height={94} />
        </Pop>
        <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: play("ad-shoe", SHOE.flight, t, SHOE.launch, "linear") }}>
          <Art name="shoe" x={28} y={100} width={40} height={24} />
        </g>
      </Scene>
      <div className="absolute right-[3%] top-[51%] rotate-12">
        <p className="border-[3px] border-ink bg-sun px-[0.45em] py-[0.1em] font-display text-[max(10px,9.5cqw)] leading-none text-ink shadow-[0.1em_0.1em_0_0_var(--color-ink)]" style={{ animation: play("ad-pop", 340, t, SHOE.hit) }}>
          BOING!
        </p>
      </div>
    </>
  );
}

function YardFrame({ t }: { t: number }) {
  return (
    <Scene>
      <g style={{ animation: play("ad-rise", 300, t, 760) }}>
        <Art name="arlindo" x={198} y={84} width={90} height={84} />
      </g>
      {Array.from({ length: 13 }, (_, i) => i * 24 - 6).map((x) => (
        <path key={x} d={`M${x} 178 L${x} 138 L${x + 10} 130 L${x + 20} 138 L${x + 20} 178 Z`} fill={P.tangerine} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
      ))}
      <path d="M0 146 L294 146 M0 166 L294 166" stroke={P.ink} strokeWidth="3" />
      <rect y="174" width="294" height="80" fill={P.lime} />
      <path d="M0 174 L294 174" stroke={P.ink} strokeWidth="3" />
      <Art name="flamingo" x={170} y={110} width={36} height={76} />
      <g style={{ transformBox: "fill-box", transformOrigin: "85% 100%", animation: play("ad-topple", 420, t, 470) }}>
        <Art name="gnome" x={112} y={127} width={38} height={59} />
      </g>
      <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: play("ad-duck", 640, t, 120, "linear") }}>
        <Art name="duck" x={-44} y={36} width={40} height={36} />
      </g>
      <Pop t={t} at={470}>
        <Burst x={128} y={132} r={24} fill={P.sun} />
        <text x={128} y={137} textAnchor="middle" fontSize="13" fill={P.ink} style={{ fontFamily: "var(--font-luckiest)" }}>
          POW!
        </text>
      </Pop>
      <Pop t={t} at={930} origin="90% 100%">
        <path d="M114 72 Q114 66 120 66 L206 66 Q212 66 212 72 L212 90 Q212 96 206 96 L204 96 L218 110 L190 96 L120 96 Q114 96 114 90 Z" fill={P.white} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
        <text x={163} y={87} textAnchor="middle" fontSize="16" fill={P.tomatoDeep} style={{ fontFamily: "var(--font-luckiest)" }}>
          MEU GNOMO!
        </text>
      </Pop>
      <Slam t={t} at={0}>
        <Outlined x={147} y={56} size={30} fill={P.white}>
          DERRUBE TUDO!
        </Outlined>
      </Slam>
    </Scene>
  );
}

function OrderFrame({ t }: { t: number }) {
  return (
    <>
      <Scene>
        <Slam t={t} at={0}>
          <Outlined x={147} y={86} size={50} fill={P.sun} stroke={9}>
            PEÇA JÁ!*
          </Outlined>
        </Slam>
        {["shoe", "balloon", "tire", "duck"].map((name, i) => (
          <Pop key={name} t={t} at={620 + i * 90} origin="50% 100%">
            <Art name={name} x={50 + i * 54} y={name === "shoe" ? 160 : 148} width={name === "shoe" ? 44 : 32} height={name === "shoe" ? 26 : 32} />
          </Pop>
        ))}
      </Scene>
      <p className="absolute inset-x-[9%] top-[41%] text-center font-hand text-[max(7px,5.4cqw)] leading-tight text-cream" style={{ animation: play("ad-fade-up", 260, t, 320) }}>
        *Peça pra sua mãe. Estilingue vendido separadamente.
      </p>
    </>
  );
}

function CallFrame({ t }: { t: number }) {
  const Logo = GAME_LOGOS["dead-end-street"];
  return (
    <>
      <Scene>
        <Pop t={t} at={760} origin="50% 100%">
          <Art name="deco" x={4} y={118} width={46} height={76} />
        </Pop>
        <Pop t={t} at={860} origin="50% 100%">
          <Art name="lina" x={244} y={120} width={46} height={72} />
        </Pop>
        <Slam t={t} at={520}>
          <Outlined x={147} y={162} size={38} fill={P.sun} stroke={8}>
            JOGUE JÁ!
          </Outlined>
        </Slam>
        <g style={{ opacity: 0, animation: `${play("ad-fade-up", 160, t, 820)}, ad-nudge 0.6s ease-in-out ${980 - t}ms infinite` }}>
          {[124, 147, 170].map((x) => (
            <path key={x} d={`M${x - 8} 170 L${x} 178 L${x + 8} 170`} fill="none" stroke={P.ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {[124, 147, 170].map((x) => (
            <path key={`s${x}`} d={`M${x - 8} 170 L${x} 178 L${x + 8} 170`} fill="none" stroke={P.sun} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </g>
      </Scene>
      <div className="absolute left-1/2 top-[11%] w-[62%] -translate-x-1/2 drop-shadow-[0_4px_0_rgba(29,24,48,0.6)]">
        <div style={{ animation: play("ad-logo", 420, t, 0) }}>{Logo && <Logo className="w-full" />}</div>
      </div>
      <div className="absolute right-[3%] top-[8%] w-[21%]" style={{ animation: play("ad-pop", 360, t, 300) }}>
        <svg viewBox="-50 -50 100 100" className="block w-full" overflow="visible" aria-hidden>
          <g style={{ animation: "spin-slow 6s linear infinite" }}>
            <Burst x={0} y={0} r={46} fill={P.tomato} />
          </g>
          <Outlined x={0} y={8} size={22} fill={P.cream} stroke={6}>
            NOVO!
          </Outlined>
        </svg>
      </div>
    </>
  );
}

const SCREENS = [BoredFrame, StreetFrame, YardFrame, OrderFrame, CallFrame];

function StreetAdScreen() {
  const { phase, offset: t } = useTimeline(MARKS, AD_LOOP);
  const frame = AD_FRAMES[phase];
  const length = (AD_FRAMES[phase + 1]?.at ?? AD_LOOP) - frame.at;
  const Content = SCREENS[phase];
  useEffect(() => {
    for (const name of ASSETS) new window.Image().src = `${ART}/${name}.svg`;
  }, []);
  const jolt: CSSProperties = { animation: frame.jolts.map((at) => play("ad-jolt", 260, t, at, "linear", "none")).join(", ") };
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: frame.bg }}>
      <div className="absolute inset-0" style={washed}>
        <div key={`burst${phase}`} className="absolute inset-0" style={{ animation: play("ad-push", length, t, 0, "linear") }}>
          <Starburst color={frame.ray} />
        </div>
        <div key={phase} className="absolute inset-0" style={jolt}>
          <div className="absolute inset-0" style={{ animation: `${ENTER[frame.enter]} ${-t}ms both` }}>
            <Content t={t} />
          </div>
        </div>
        {frame.enter === "whip" && t < 400 && (
          <div key={`streaks${phase}`} className="pointer-events-none absolute inset-0" style={{ animation: play("ad-streaks", 260, t, 0, "ease-out") }}>
            {[14, 30, 47, 63, 80].map((y, i) => (
              <div key={y} className="absolute h-[1.4%] rounded-full bg-white/80" style={{ top: `${y}%`, left: `${10 + (i % 3) * 18}%`, width: `${46 + (i % 2) * 22}%` }} />
            ))}
          </div>
        )}
        {t < 300 && <div key={`flash${phase}`} className="pointer-events-none absolute inset-0 bg-white" style={{ animation: play("ad-flash", 200, t, 0, "ease-out") }} />}
      </div>
      <VhsOverlay counter="SP 0:00:30" />
    </div>
  );
}

export const streetAdCues: TapeCue[] = [
  { at: BOING_AT, sound: "boing" },
  { at: CALL_AT, mascot: { expression: "excited", line: "Nem precisa pedir pra mãe. É só clicar em Jogar agora!" } },
];

export const streetAdTape: TapeProgram = { Screen: StreetAdScreen, loop: AD_LOOP, cues: streetAdCues };
