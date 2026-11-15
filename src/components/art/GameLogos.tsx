import { P } from "@/lib/palette";
import { BadIdeasLabHowToPanel } from "./BadIdeasLabArt";
import { DeadEndStreetHowToPanel } from "./DeadEndStreetArt";
import { FoodFightHowToPanel } from "./FoodFightArt";
import { OffAirVacationHowToPanel, OffAirVacationLogo } from "./OffAirVacationArt";
import { OperationRecessHowToPanel } from "./OperationRecessArt";
import { PajamaWarHowToPanel, PajamaWarLogo } from "./PajamaWarArt";

const display = { fontFamily: "var(--font-luckiest)" };

export function DeadEndStreetLogo({ className, bare = false }: { className?: string; bare?: boolean }) {
  return (
    <svg viewBox="-8 -8 350 184" className={className} role="img" aria-label="Rua Sem Saída">
      <g style={display}>
        <g transform="rotate(-7 120 70)">
          <text x="128" y="94" textAnchor="middle" fontSize="104" fill={P.ink} letterSpacing="2">
            RUA
          </text>
          <text x="122" y="88" textAnchor="middle" fontSize="104" fill={P.lime} stroke={P.ink} strokeWidth="11" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            RUA
          </text>
          <path d="M60 40 q8 -8 18 -6" stroke={P.white} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
        <g transform="rotate(-12 236 70)">
          <rect x="206" y="40" width="64" height="34" rx="8" fill={P.tomato} stroke={P.ink} strokeWidth="5" />
          <text x="238" y="66" textAnchor="middle" fontSize="26" fill={P.white}>
            sem
          </text>
        </g>
        <g transform="rotate(-4 180 130)">
          <text x="186" y="160" textAnchor="middle" fontSize="80" fill={P.ink} letterSpacing="2">
            SAÍDA
          </text>
          <text x="180" y="154" textAnchor="middle" fontSize="80" fill={P.sun} stroke={P.ink} strokeWidth="10" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            SAÍDA
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
  return (
    <svg viewBox="-10 -3 382 198" className={className} role="img" aria-label="Laboratório de Péssimas Ideias">
      <g style={display}>
        <g transform="rotate(-5 160 50)">
          <text x="166" y="66" textAnchor="middle" fontSize="50" fill={P.ink} letterSpacing="1">
            LABORATÓRIO
          </text>
          <text x="162" y="62" textAnchor="middle" fontSize="50" fill={P.mint} stroke={P.ink} strokeWidth="8" paintOrder="stroke" strokeLinejoin="round" letterSpacing="1">
            LABORATÓRIO
          </text>
        </g>
        <g transform="rotate(4 120 96)">
          <rect x="52" y="78" width="150" height="34" rx="8" fill={P.tomato} stroke={P.ink} strokeWidth="5" />
          <text x="127" y="104" textAnchor="middle" fontSize="24" fill={P.white}>
            de péssimas
          </text>
        </g>
        <g transform="rotate(-3 170 150)">
          <text x="176" y="182" textAnchor="middle" fontSize="84" fill={P.ink} letterSpacing="2">
            IDEIAS
          </text>
          <text x="170" y="176" textAnchor="middle" fontSize="84" fill={P.sun} stroke={P.ink} strokeWidth="10" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            IDEIAS
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
  return (
    <svg viewBox="3 -15 375 205" className={className} role="img" aria-label="Guerra de Lanche">
      <g style={display}>
        <g transform="rotate(-6 166 60)">
          <text x="170" y="88" textAnchor="middle" fontSize="80" fill={P.ink} letterSpacing="2">
            GUERRA
          </text>
          <text x="164" y="82" textAnchor="middle" fontSize="80" fill={P.tomato} stroke={P.ink} strokeWidth="10" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            GUERRA
          </text>
        </g>
        <g transform="rotate(5 92 116)">
          <rect x="60" y="98" width="60" height="32" rx="8" fill={P.mint} stroke={P.ink} strokeWidth="5" />
          <text x="90" y="122" textAnchor="middle" fontSize="24" fill={P.ink}>
            de
          </text>
        </g>
        <g transform="rotate(-3 200 150)">
          <text x="206" y="178" textAnchor="middle" fontSize="72" fill={P.ink} letterSpacing="2">
            LANCHE
          </text>
          <text x="200" y="172" textAnchor="middle" fontSize="72" fill={P.sun} stroke={P.ink} strokeWidth="10" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            LANCHE
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
  return (
    <svg viewBox="-22 -6 403 192" className={className} role="img" aria-label="Operação: Recreio">
      <g transform="translate(318 30) rotate(38)" stroke={P.ink} strokeLinejoin="round">
        <rect x="-8" y="-14" width="16" height="30" rx="4" fill="#c9d4e4" strokeWidth="4" />
        <rect x="-20" y="14" width="40" height="11" rx="3" fill="#a96d36" strokeWidth="4" />
        <path d="M-10 25 L-10 128 Q0 142 10 128 L10 25 Z" fill="#d9a066" strokeWidth="5" />
        <path d="M-3 34 L-3 118 M4 34 L4 110" stroke="#b07a44" strokeWidth="2.5" />
      </g>
      <g style={display}>
        <g transform="rotate(-3 180 50)">
          <text x="186" y="70" textAnchor="middle" fontSize="54" fill={P.ink} letterSpacing="2">
            OPERAÇÃO:
          </text>
          <text x="180" y="64" textAnchor="middle" fontSize="54" fill={P.sun} stroke={P.ink} strokeWidth="9" paintOrder="stroke" strokeLinejoin="round" letterSpacing="2">
            OPERAÇÃO:
          </text>
        </g>
        <g transform="rotate(2 180 150)">
          <text x="188" y="172" textAnchor="middle" fontSize="98" fill={P.ink} letterSpacing="3">
            RECREIO
          </text>
          <text x="180" y="164" textAnchor="middle" fontSize="98" fill={P.sky} stroke={P.ink} strokeWidth="12" paintOrder="stroke" strokeLinejoin="round" letterSpacing="3">
            RECREIO
          </text>
          <path d="M58 104 q10 -8 22 -6" stroke={P.white} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
}

export const GAME_LOGOS: Record<string, (props: { className?: string; bare?: boolean }) => React.JSX.Element> = {
  "dead-end-street": DeadEndStreetLogo,
  "bad-ideas-lab": BadIdeasLabLogo,
  "food-fight": FoodFightLogo,
  "operation-recess": OperationRecessLogo,
  "pajama-war": PajamaWarLogo,
  "off-air-vacation": OffAirVacationLogo,
};

export function GameHowToPanel({ slug, step }: { slug: string; step: 0 | 1 | 2 }) {
  if (slug === "bad-ideas-lab") return <BadIdeasLabHowToPanel step={step} />;
  if (slug === "food-fight") return <FoodFightHowToPanel step={step} />;
  if (slug === "operation-recess") return <OperationRecessHowToPanel step={step} />;
  if (slug === "pajama-war") return <PajamaWarHowToPanel step={step} />;
  if (slug === "off-air-vacation") return <OffAirVacationHowToPanel step={step} />;
  return <DeadEndStreetHowToPanel step={step} />;
}
