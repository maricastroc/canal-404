"use client";

import { useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import { P } from "@/lib/palette";
import { Feather, Pillow } from "./PajamaWarProps";

const display = { fontFamily: "var(--font-luckiest)" };

const DEAD_END_STREET = localized({
  "pt-BR": { label: "Rua Sem Saída", first: "RUA", firstSize: 104, firstX: 122, tag: "sem", last: "SAÍDA", lastSize: 80 },
  en: { label: "Dead End Street", first: "DEAD", firstSize: 92, firstX: 116, tag: "end", last: "STREET", lastSize: 76 },
});

const BAD_IDEAS_LAB = localized({
  "pt-BR": { label: "Laboratório de Péssimas Ideias", first: "LABORATÓRIO", firstSize: 50, firstY: 62, tag: "de péssimas", last: "IDEIAS", lastSize: 84, lastX: 170, lastY: 176 },
  en: { label: "Bad Ideas Lab", first: "BAD IDEAS", firstSize: 56, firstY: 68, tag: "", last: "LAB", lastSize: 120, lastX: 140, lastY: 182 },
});

const FOOD_FIGHT = localized({
  "pt-BR": { label: "Guerra de Lanche", first: "GUERRA", firstSize: 80, tag: "de", last: "LANCHE", lastSize: 72, lastX: 200 },
  en: { label: "Food Fight", first: "FOOD", firstSize: 92, tag: "", last: "FIGHT", lastSize: 84, lastX: 196 },
});

const OPERATION_RECESS = localized({
  "pt-BR": { label: "Operação: Recreio", first: "OPERAÇÃO:", firstSize: 54, last: "RECREIO" },
  en: { label: "Operation: Recess", first: "OPERATION:", firstSize: 50, last: "RECESS" },
});

export function DeadEndStreetLogo({ className, bare = false }: { className?: string; bare?: boolean }) {
  const t = DEAD_END_STREET[useLocale()];
  return (
    <svg viewBox="-8 -8 350 184" className={className} role="img" aria-label={t.label}>
      <g style={display}>
        <g transform="rotate(-7 120 70)">
          <text x={t.firstX + 6} y="94" textAnchor="middle" fontSize={t.firstSize} fill={P.ink} letterSpacing="2">
            {t.first}
          </text>
          <text x={t.firstX} y="88" textAnchor="middle" fontSize={t.firstSize} fill={P.lime} stroke={P.ink} strokeWidth="11" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            {t.first}
          </text>
          <path d="M60 40 q8 -8 18 -6" stroke={P.white} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
        <g transform="rotate(-12 236 70)">
          <rect x="206" y="40" width="64" height="34" rx="8" fill={P.tomato} stroke={P.ink} strokeWidth="5" />
          <text x="238" y="66" textAnchor="middle" fontSize="26" fill={P.white}>
            {t.tag}
          </text>
        </g>
        <g transform="rotate(-4 180 130)">
          <text x="186" y="160" textAnchor="middle" fontSize={t.lastSize} fill={P.ink} letterSpacing="2">
            {t.last}
          </text>
          <text x="180" y="154" textAnchor="middle" fontSize={t.lastSize} fill={P.sun} stroke={P.ink} strokeWidth="10" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            {t.last}
          </text>
        </g>
        <path d="M24 120 L4 104 M30 108 L18 88" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
        {bare ? null : (
          <g transform="translate(316 30) rotate(20)">
            <path d="M0 -16 L4 -4 L16 -4 L6 4 L10 16 L0 8 L-10 16 L-6 4 L-16 -4 L-4 -4 Z" fill={P.sun} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
          </g>
        )}
      </g>
    </svg>
  );
}

export function BadIdeasLabLogo({ className }: { className?: string }) {
  const t = BAD_IDEAS_LAB[useLocale()];
  return (
    <svg viewBox="-10 -3 382 198" className={className} role="img" aria-label={t.label}>
      <g style={display}>
        <g transform="rotate(-5 160 50)">
          <text x="166" y={t.firstY + 4} textAnchor="middle" fontSize={t.firstSize} fill={P.ink} letterSpacing="1">
            {t.first}
          </text>
          <text x="162" y={t.firstY} textAnchor="middle" fontSize={t.firstSize} fill={P.mint} stroke={P.ink} strokeWidth="8" paintOrder="stroke" strokeLinejoin="round" letterSpacing="1">
            {t.first}
          </text>
        </g>
        {t.tag ? (
          <g transform="rotate(4 120 96)">
            <rect x="52" y="78" width="150" height="34" rx="8" fill={P.tomato} stroke={P.ink} strokeWidth="5" />
            <text x="127" y="104" textAnchor="middle" fontSize="24" fill={P.white}>
              {t.tag}
            </text>
          </g>
        ) : null}
        <g transform="rotate(-3 170 150)">
          <text x={t.lastX + 6} y={t.lastY + 6} textAnchor="middle" fontSize={t.lastSize} fill={P.ink} letterSpacing="2">
            {t.last}
          </text>
          <text x={t.lastX} y={t.lastY} textAnchor="middle" fontSize={t.lastSize} fill={P.sun} stroke={P.ink} strokeWidth="10" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            {t.last}
          </text>
        </g>
      </g>
      <g transform="translate(300 110) rotate(14)">
        <path d="M-6 -60 Q-14 -76 -4 -88 M10 -62 Q22 -80 12 -92" fill="none" stroke={P.steel} strokeWidth="6" strokeLinecap="round" opacity="0.8" />
        <path d="M0 -50 Q30 -50 30 -20 Q30 -2 14 10 L14 22 L-14 22 L-14 10 Q-30 -2 -30 -20 Q-30 -50 0 -50 Z" fill={P.sunPale} stroke={P.ink} strokeWidth="5" strokeLinejoin="round" />
        <path d="M-8 -30 L4 -18 L-6 -8 L8 4" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="-16" y="22" width="32" height="20" rx="4" fill={P.steel} stroke={P.ink} strokeWidth="5" />
        <path d="M-16 30 L16 30" stroke={P.ink} strokeWidth="3" />
        <path d="M-40 -30 L-52 -36 M40 -30 L52 -36 M-36 -6 L-48 0 M36 -6 L48 0" stroke={P.tangerine} strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function FoodFightLogo({ className }: { className?: string }) {
  const t = FOOD_FIGHT[useLocale()];
  return (
    <svg viewBox="3 -15 375 205" className={className} role="img" aria-label={t.label}>
      <g style={display}>
        <g transform="rotate(-6 166 60)">
          <text x="170" y="88" textAnchor="middle" fontSize={t.firstSize} fill={P.ink} letterSpacing="2">
            {t.first}
          </text>
          <text x="164" y="82" textAnchor="middle" fontSize={t.firstSize} fill={P.tomato} stroke={P.ink} strokeWidth="10" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            {t.first}
          </text>
        </g>
        {t.tag ? (
          <g transform="rotate(5 92 116)">
            <rect x="60" y="98" width="60" height="32" rx="8" fill={P.mint} stroke={P.ink} strokeWidth="5" />
            <text x="90" y="122" textAnchor="middle" fontSize="24" fill={P.ink}>
              {t.tag}
            </text>
          </g>
        ) : null}
        <g transform="rotate(-3 200 150)">
          <text x={t.lastX + 6} y="178" textAnchor="middle" fontSize={t.lastSize} fill={P.ink} letterSpacing="2">
            {t.last}
          </text>
          <text x={t.lastX} y="172" textAnchor="middle" fontSize={t.lastSize} fill={P.sun} stroke={P.ink} strokeWidth="10" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            {t.last}
          </text>
        </g>
      </g>
      <g transform="translate(330 36) rotate(16) scale(0.8)" stroke={P.ink} strokeLinejoin="round" strokeLinecap="round">
        <path d="M-26 22 L-18 -14 Q0 -24 18 -14 L26 22 Q0 30 -26 22 Z" fill={P.sunPale} strokeWidth="5" />
        <path d="M-18 -14 Q0 -24 18 -14 L20 -4 Q14 4 10 -4 Q6 8 0 -2 Q-6 8 -10 -4 Q-14 4 -20 -4 Z" fill="#b5652e" strokeWidth="4" />
        <path d="M-40 -30 L-50 -38 M-44 -10 L-58 -10 M30 -30 L38 -40" stroke={P.tangerine} strokeWidth="5" />
      </g>
    </svg>
  );
}

export function OperationRecessLogo({ className }: { className?: string }) {
  const t = OPERATION_RECESS[useLocale()];
  return (
    <svg viewBox="-22 -6 403 192" className={className} role="img" aria-label={t.label}>
      <g transform="translate(318 30) rotate(38)" stroke={P.ink} strokeLinejoin="round">
        <rect x="-8" y="-14" width="16" height="30" rx="4" fill="#c9d4e4" strokeWidth="4" />
        <rect x="-20" y="14" width="40" height="11" rx="3" fill="#a96d36" strokeWidth="4" />
        <path d="M-10 25 L-10 128 Q0 142 10 128 L10 25 Z" fill="#d9a066" strokeWidth="5" />
        <path d="M-3 34 L-3 118 M4 34 L4 110" stroke="#b07a44" strokeWidth="2.5" />
      </g>
      <g style={display}>
        <g transform="rotate(-3 180 50)">
          <text x="186" y="70" textAnchor="middle" fontSize={t.firstSize} fill={P.ink} letterSpacing="2">
            {t.first}
          </text>
          <text x="180" y="64" textAnchor="middle" fontSize={t.firstSize} fill={P.sun} stroke={P.ink} strokeWidth="9" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            {t.first}
          </text>
        </g>
        <g transform="rotate(2 180 150)">
          <text x="188" y="172" textAnchor="middle" fontSize="98" fill={P.ink} letterSpacing="3">
            {t.last}
          </text>
          <text x="180" y="164" textAnchor="middle" fontSize="98" fill={P.sky} stroke={P.ink} strokeWidth="12" paintOrder="stroke" strokeLinejoin="round" letterSpacing="3">
            {t.last}
          </text>
          <path d="M58 104 q10 -8 22 -6" stroke={P.white} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
}

const PAJAMA_WAR = localized({
  "pt-BR": { label: "Guerra do Pijama", first: "GUERRA", tag: "DO", last: "PIJAMA", lastSize: 88, lastX: 216 },
  en: { label: "Pajama War", first: "PAJAMA", tag: "", last: "WAR", lastSize: 108, lastX: 200 },
});

function PajamaWarLogoArt({ className, locale }: { className?: string; locale: Locale }) {
  const t = PAJAMA_WAR[locale];
  return (
    <svg viewBox="-24 -22 412 214" className={className} role="img" aria-label={t.label}>
      <Pillow x={352} y={16} w={66} rotate={22} />
      <Feather x={-6} y={26} rotate={-30} s={1.4} />
      <Feather x={340} y={92} rotate={40} s={1.2} />
      <Feather x={18} y={148} rotate={10} s={1.1} />
      <g style={display}>
        <g transform="rotate(-5 160 60)">
          <text x="164" y="84" textAnchor="middle" fontSize="80" fill={P.ink} letterSpacing="2">
            {t.first}
          </text>
          <text x="158" y="78" textAnchor="middle" fontSize="80" fill={P.white} stroke={P.ink} strokeWidth="10" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            {t.first}
          </text>
          <path d="M40 32 q10 -8 22 -6" stroke={P.sunPale} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.9" />
        </g>
        {t.tag ? (
          <g transform="rotate(-10 26 112)">
            <rect x="-12" y="88" width="66" height="40" rx="10" fill={P.sun} stroke={P.ink} strokeWidth="5" />
            <text x="21" y="119" textAnchor="middle" fontSize="30" fill={P.ink}>
              {t.tag}
            </text>
          </g>
        ) : null}
        <g transform="rotate(2 210 150)">
          <text x={t.lastX + 6} y="182" textAnchor="middle" fontSize={t.lastSize} fill={P.ink} letterSpacing="2">
            {t.last}
          </text>
          <text x={t.lastX} y="176" textAnchor="middle" fontSize={t.lastSize} fill={P.bubblegum} stroke={P.ink} strokeWidth="11" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            {t.last}
          </text>
          <path d="M98 118 q10 -8 22 -6" stroke={P.white} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
}

const OFF_AIR_VACATION = localized({
  "pt-BR": { label: "Férias Fora do Ar", first: "FÉRIAS", firstSize: 88, screen: "FORA DO AR", screenSize: 48 },
  en: { label: "Off-Air Vacation", first: "OFF-AIR", firstSize: 76, screen: "VACATION", screenSize: 52 },
});

function OffAirVacationLogoArt({ className, locale }: { className?: string; locale: Locale }) {
  const t = OFF_AIR_VACATION[locale];
  return (
    <svg viewBox="-24 -26 424 222" className={className} role="img" aria-label={t.label}>
      <circle cx="350" cy="14" r="30" fill={P.sunPale} stroke={P.ink} strokeWidth="5" />
      <g stroke={P.sun} strokeWidth="5" strokeLinecap="round">
        <path d="M350 -24 L350 -34 M384 -6 L394 -12 M390 30 L400 34 M316 -6 L306 -12" />
      </g>
      <g style={display}>
        <g transform="rotate(-5 170 60)">
          <text x="176" y="88" textAnchor="middle" fontSize={t.firstSize} fill={P.ink} letterSpacing="2">
            {t.first}
          </text>
          <text x="170" y="82" textAnchor="middle" fontSize={t.firstSize} fill={P.sun} stroke={P.ink} strokeWidth="11" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            {t.first}
          </text>
          <path d="M44 34 q10 -8 22 -6" stroke={P.white} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.85" />
        </g>
        <g transform="rotate(2 190 150)">
          <rect x="18" y="104" width="352" height="76" rx="18" fill={P.ink} transform="translate(6 7)" />
          <rect x="18" y="104" width="352" height="76" rx="18" fill={P.plum700} stroke={P.ink} strokeWidth="6" />
          <rect x="30" y="114" width="328" height="56" rx="10" fill={P.screen} stroke={P.ink} strokeWidth="4" />
          <g stroke={P.screenDeep} strokeWidth="3" opacity="0.8">
            <path d="M36 124 L352 124 M36 136 L352 136 M36 148 L352 148 M36 160 L352 160" />
          </g>
          <text x="194" y="162" textAnchor="middle" fontSize={t.screenSize} fill={P.white} stroke={P.ink} strokeWidth="9" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            {t.screen}
          </text>
        </g>
      </g>
      <g transform="translate(-8 120) rotate(-18)">
        <path d="M0 0 Q20 -26 46 -18 Q22 -12 0 0 Z" fill={P.leaf} stroke={P.ink} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M0 0 Q12 -34 34 -40 Q18 -18 0 0 Z" fill={P.lime} stroke={P.ink} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const DOWNHILL_DERBY = localized({
  "pt-BR": { label: "Ladeira Abaixo", first: "LADEIRA", firstSize: 72, last: "ABAIXO", lastSize: 90, step: 5 },
  en: { label: "Downhill Derby", first: "DOWNHILL", firstSize: 62, last: "DERBY", lastSize: 98, step: 6 },
});

function Slope({ word, x, y, size, step, fill, stroke }: { word: string; x: number; y: number; size: number; step: number; fill: string; stroke: number }) {
  const chars = Array.from(word);
  const lift = ((chars.length - 1) * step) / 2;
  const letters = (key: string) =>
    chars.map((c, i) => (
      <tspan key={`${key}${i}`} dy={i === 0 ? -lift : step}>
        {c}
      </tspan>
    ));
  return (
    <>
      <text x={x + 6} y={y + 6} textAnchor="middle" fontSize={size} fill={P.ink} letterSpacing="2">
        {letters("s")}
      </text>
      <text x={x} y={y} textAnchor="middle" fontSize={size} fill={fill} stroke={P.ink} strokeWidth={stroke} paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
        {letters("f")}
      </text>
    </>
  );
}

function DownhillDerbyLogoArt({ className, locale }: { className?: string; locale: Locale }) {
  const t = DOWNHILL_DERBY[locale];
  return (
    <svg viewBox="-22 -8 404 232" className={className} role="img" aria-label={t.label}>
      <g transform="rotate(9 180 110)">
        <path d="M-2 190 L334 190" stroke={P.ink} strokeWidth="20" strokeLinecap="round" />
        <path d="M-2 190 L334 190" stroke={P.inkSoft} strokeWidth="10" strokeLinecap="round" />
        <path d="M24 190 L50 190 M94 190 L120 190 M164 190 L190 190 M234 190 L260 190" stroke={P.sun} strokeWidth="4" strokeLinecap="round" />
        <g style={display}>
          <g transform="rotate(-5 194 60)">
            <Slope word={t.first} x={194} y={80} size={t.firstSize} step={2} fill={P.sun} stroke={10} />
          </g>
          <Slope word={t.last} x={176} y={168} size={t.lastSize} step={t.step} fill={P.tangerine} stroke={12} />
        </g>
        <path d="M-12 108 L20 108 M-20 128 L24 128 M-10 148 L16 148" stroke={P.ink} strokeWidth="6" strokeLinecap="round" />
        <g transform="translate(360 172)">
          <circle r="20" fill={P.ink} />
          <circle r="12" fill={P.steelDeep} />
          <circle r="5" fill={P.steel} />
          <path d="M-7 -13 Q0 -17 8 -12" stroke={P.white} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
      </g>
    </svg>
  );
}

const PAST_BEDTIME = localized({
  "pt-BR": { label: "Madrugada", first: "", firstSize: 0, last: "MADRUGADA", lastSize: 56, lastY: 150 },
  en: { label: "Past Bedtime", first: "PAST", firstSize: 62, last: "BEDTIME", lastSize: 80, lastY: 168 },
});

function NightWord({ word, x, y, size, fill, stroke }: { word: string; x: number; y: number; size: number; fill: string; stroke: number }) {
  return (
    <>
      <text x={x + 6} y={y + 6} textAnchor="middle" fontSize={size} fill={P.ink} letterSpacing="2">
        {word}
      </text>
      <text x={x} y={y} textAnchor="middle" fontSize={size} fill={fill} stroke={P.ink} strokeWidth={stroke} paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
        {word}
      </text>
    </>
  );
}

function PastBedtimeLogoArt({ className, locale }: { className?: string; locale: Locale }) {
  const t = PAST_BEDTIME[locale];
  return (
    <svg viewBox="-10 -8 380 232" className={className} role="img" aria-label={t.label}>
      <g transform="translate(318 44)">
        <circle r="34" fill={P.sunPale} stroke={P.ink} strokeWidth="6" />
        <circle cx="16" cy="-10" r="30" fill={P.plum800} />
      </g>
      <g fill={P.sunPale}>
        <path d="M40 40 Q40 52 52 52 Q40 52 40 64 Q40 52 28 52 Q40 52 40 40 Z" />
        <path d="M262 18 Q262 26 270 26 Q262 26 262 34 Q262 26 254 26 Q262 26 262 18 Z" />
        <path d="M350 112 Q350 120 358 120 Q350 120 350 128 Q350 120 342 120 Q350 120 350 112 Z" />
      </g>
      <g style={display}>
        {t.first && (
          <g transform="rotate(-4 120 90)">
            <NightWord word={t.first} x={124} y={92} size={t.firstSize} fill={P.plum300} stroke={10} />
          </g>
        )}
        <g transform="rotate(-3 180 150)">
          <NightWord word={t.last} x={180} y={t.lastY} size={t.lastSize} fill={P.sky} stroke={12} />
        </g>
        <g fill={P.plum300} stroke={P.ink} strokeWidth="4" paintOrder="stroke">
          <text x="300" y="214" fontSize="26">
            z
          </text>
          <text x="322" y="196" fontSize="34">
            Z
          </text>
        </g>
      </g>
    </svg>
  );
}

export function PastBedtimeLogo({ className }: { className?: string }) {
  return <PastBedtimeLogoArt className={className} locale={useLocale()} />;
}

export function DownhillDerbyLogo({ className }: { className?: string }) {
  return <DownhillDerbyLogoArt className={className} locale={useLocale()} />;
}

export function PajamaWarLogo({ className }: { className?: string }) {
  return <PajamaWarLogoArt className={className} locale={useLocale()} />;
}

export function OffAirVacationLogo({ className }: { className?: string }) {
  return <OffAirVacationLogoArt className={className} locale={useLocale()} />;
}
