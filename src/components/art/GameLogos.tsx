import { P } from "@/lib/palette";
import { OffAirVacationHowToPanel, OffAirVacationLogo } from "./OffAirVacationArt";
import { PajamaWarHowToPanel, PajamaWarLogo } from "./PajamaWarArt";

const display = { fontFamily: "var(--font-luckiest)" };

export function DeadEndStreetLogo({ className }: { className?: string }) {
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
        <g transform="translate(316 30) rotate(20)">
          <path d="M0 -16 L4 -4 L16 -4 L6 4 L10 16 L0 8 L-10 16 L-6 4 L-16 -4 L-4 -4 Z" fill={P.sun} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}

export function DeadEndStreetHowToPanel({ step }: { step: 0 | 1 | 2 }) {
  if (step === 0) {
    return (
      <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
        <rect width="200" height="130" fill={P.skyPale} />
        <rect y="100" width="200" height="30" fill="#d8a066" />
        <path d="M0 100 L200 100" stroke={P.ink} strokeWidth="3" />
        <path d="M60 96 L130 96 L126 78 L64 78 Z" fill={P.tomato} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
        <circle cx="74" cy="102" r="9" fill={P.ink} />
        <circle cx="118" cy="102" r="9" fill={P.ink} />
        <path d="M110 80 L84 40" stroke={P.ink} strokeWidth="10" strokeLinecap="round" />
        <path d="M110 80 L84 40" stroke={P.wood} strokeWidth="5" strokeLinecap="round" />
        <circle cx="80" cy="36" r="11" fill={P.tomato} stroke={P.ink} strokeWidth="3.5" />
        <path d="M150 40 L106 34" stroke={P.ink} strokeWidth="3" strokeDasharray="5 5" />
        <path d="M150 40 Q160 30 172 36 Q182 44 172 54 Q160 60 150 50 Z" fill={P.sun} stroke={P.ink} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M170 64 L190 72 M164 70 L178 86" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
        <path d="M128 20 L146 30 L136 34 Z" fill={P.ink} />
      </svg>
    );
  }
  if (step === 1) {
    return (
      <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
        <rect width="200" height="130" fill={P.skyPale} />
        <rect y="100" width="200" height="30" fill="#d8a066" />
        <path d="M0 100 L200 100" stroke={P.ink} strokeWidth="3" />
        <path d="M30 86 Q80 0 150 46" fill="none" stroke={P.tangerineDeep} strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
        <circle cx="30" cy="86" r="9" fill={P.tomato} stroke={P.ink} strokeWidth="3.5" />
        <path d="M150 46 Q170 70 176 100" fill="none" stroke={P.plum300} strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
        <text x="146" y="34" fontSize="16" fill={P.ink} style={display}>
          ?
        </text>
        <g transform="translate(40 30)">
          <rect x="-22" y="-14" width="44" height="28" rx="4" fill={P.paper} stroke={P.ink} strokeWidth="3" />
          <path d="M-14 6 Q0 -14 14 0" fill="none" stroke={P.tomato} strokeWidth="2.5" strokeDasharray="3 3" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <rect width="200" height="130" fill={P.skyPale} />
      <rect y="100" width="200" height="30" fill="#9fd36a" />
      <path d="M0 100 L200 100" stroke={P.ink} strokeWidth="3" />
      <g transform="translate(118 74) rotate(38)">
        <path d="M-12 26 L-14 -6 L0 -30 L14 -6 L12 26 Z" fill={P.tomato} stroke={P.ink} strokeWidth="3.5" strokeLinejoin="round" />
        <circle cx="0" cy="-2" r="9" fill={P.skinLight} stroke={P.ink} strokeWidth="3" />
        <path d="M-8 4 Q0 18 8 4 Z" fill={P.white} stroke={P.ink} strokeWidth="2.5" />
      </g>
      <path d="M70 60 L82 52 L78 66 L94 62 L84 74 L98 80 L80 82 L84 96 L72 86 L62 96 L62 82 L48 80 L62 72 L52 62 L66 64 Z" fill={P.sun} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
      <text x="73" y="80" textAnchor="middle" fontSize="13" fill={P.ink} style={display}>
        POW
      </text>
      <path d="M150 50 L166 40 M156 64 L176 60 M148 36 L156 20" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <text x="168" y="30" fontSize="16" fill={P.tomato} style={display}>
        +150
      </text>
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

export function BadIdeasLabHowToPanel({ step }: { step: 0 | 1 | 2 }) {
  if (step === 0) {
    return (
      <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
        <rect width="200" height="130" fill="#9fc4c7" />
        <rect y="96" width="200" height="34" fill="#7c8f94" />
        <path d="M30 92 L170 92 L162 122 L38 122 Z" fill={P.tomato} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
        <path d="M60 92 Q60 76 100 76 Q140 76 140 92" fill="none" stroke={P.ink} strokeWidth="6" />
        <rect x="46" y="60" width="64" height="10" rx="3" fill={P.wood} stroke={P.ink} strokeWidth="3" transform="rotate(-14 78 65)" />
        <path d="M122 70 q6 -8 12 0 q6 8 12 0" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
        <rect x="118" y="72" width="34" height="10" rx="3" fill={P.sun} stroke={P.ink} strokeWidth="3" />
        <path d="M150 30 L130 52 M130 52 L130 40 M130 52 L142 52" stroke={P.ink} strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (step === 1) {
    return (
      <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
        <rect width="200" height="130" fill="#9fc4c7" />
        <g fill="none" stroke="#2fa996" strokeWidth="3" strokeDasharray="5 5">
          <rect x="40" y="52" width="120" height="26" rx="4" transform="rotate(-15 100 65)" />
        </g>
        <rect x="46" y="56" width="108" height="18" rx="4" fill={P.wood} stroke={P.ink} strokeWidth="4" transform="rotate(-15 100 65)" />
        <circle cx="62" cy="76" r="4" fill={P.ink} transform="rotate(-15 100 65)" />
        <circle cx="138" cy="76" r="4" fill={P.ink} transform="rotate(-15 100 65)" />
        <path d="M150 20 A26 26 0 1 1 124 18" fill="none" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
        <path d="M118 10 L126 20 L114 24" fill="none" stroke={P.ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="100" y="118" textAnchor="middle" fontSize="18" fill={P.ink} style={display}>
          GIRE!
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <rect width="200" height="130" fill="#9fc4c7" />
      <path d="M20 40 L110 70" stroke={P.wood} strokeWidth="12" strokeLinecap="round" />
      <path d="M20 40 L110 70" stroke={P.ink} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <circle cx="74" cy="44" r="11" fill={P.sky} stroke={P.ink} strokeWidth="4" />
      <path d="M52 34 L40 30 M54 46 L40 46" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M152 46 Q152 26 168 26 Q184 26 184 46 L188 60 L148 60 Z" fill={P.sun} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="168" cy="64" r="5" fill={P.ink} />
      <path d="M140 30 L132 22 M196 30 L190 18 M144 50 L134 52" stroke={P.tangerine} strokeWidth="4" strokeLinecap="round" />
      <rect x="20" y="88" width="96" height="30" rx="10" fill="#93cf4c" stroke={P.ink} strokeWidth="4" />
      <text x="68" y="110" textAnchor="middle" fontSize="18" fill={P.ink} style={display}>
        LIGAR!
      </text>
      <text x="168" y="104" textAnchor="middle" fontSize="20" fill={P.ink} style={display}>
        DING!
      </text>
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

export function FoodFightHowToPanel({ step }: { step: 0 | 1 | 2 }) {
  const wall = "#c8eadf";
  if (step === 0) {
    return (
      <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
        <rect width="200" height="130" fill={wall} />
        <rect y="84" width="200" height="46" fill="#f7e7c2" />
        <path d="M118 96 L190 96 L186 128 L122 128 Z" fill={P.sky} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
        <circle cx="154" cy="70" r="22" fill={P.skinLight} stroke={P.ink} strokeWidth="4" />
        <path d="M132 62 Q134 40 154 40 Q174 40 176 62 Q164 54 154 56 Q144 54 132 62 Z" fill={P.sky} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
        <path d="M24 104 Q60 40 128 60" fill="none" stroke={P.ink} strokeWidth="3" strokeDasharray="5 6" />
        <path d="M118 52 L142 64 M120 74 L140 66" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
        <g transform="translate(40 92)">
          <path d="M-16 4 Q-17 -10 0 -12 Q17 -10 16 4 Z" fill={P.sunPale} stroke={P.ink} strokeWidth="3.5" />
          <path d="M-16 4 L16 4 L14 10 L-14 10 Z" fill={P.lime} stroke={P.ink} strokeWidth="3" />
        </g>
        <circle cx="154" cy="70" r="30" fill="none" stroke={P.sun} strokeWidth="5" strokeDasharray="8 6" />
      </svg>
    );
  }
  if (step === 1) {
    return (
      <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
        <rect width="200" height="130" fill={wall} />
        <path d="M20 80 L140 80 L136 128 L24 128 Z" fill={P.tomato} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
        <path d="M44 80 L50 64 L60 74 L66 58 L74 72 L82 60 L86 80 Z" fill={P.tangerineDeep} stroke={P.ink} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M150 22 Q110 10 74 40" fill="none" stroke={P.ink} strokeWidth="3" strokeDasharray="5 6" />
        <g transform="translate(70 44) rotate(-20)">
          <path d="M-14 12 L-10 -6 Q0 -12 10 -6 L14 12 Q0 16 -14 12 Z" fill={P.sunPale} stroke={P.ink} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M-10 -6 Q0 -12 10 -6 L11 0 Q0 4 -11 0 Z" fill="#b5652e" stroke={P.ink} strokeWidth="3" />
        </g>
        <circle cx="168" cy="96" r="24" fill={P.sun} stroke={P.ink} strokeWidth="4" />
        <path d="M168 84 L168 104 M160 98 L168 106 L176 98" fill="none" stroke={P.ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <rect width="200" height="130" fill={wall} />
      <path d="M20 70 L180 70 L176 128 L24 128 Z" fill={P.tomato} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M20 70 L180 70 L180 78 L20 78 Z" fill="#e8b46a" stroke={P.ink} strokeWidth="4" />
      {[48, 80, 112, 144].map((x, i) => (
        <circle key={x} cx={x} cy={58} r="10" fill={[P.tomato, P.plum500, P.sun, P.lime][i]} stroke={P.ink} strokeWidth="3.5" />
      ))}
      <path d="M70 36 L80 26 L90 36 M110 36 L120 26 L130 36" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
      <text x="100" y="22" textAnchor="middle" fontSize="16" fill={P.ink} style={display}>
        +1 LANCHE
      </text>
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

export function OperationRecessHowToPanel({ step }: { step: 0 | 1 | 2 }) {
  const bruno = (x: number, y: number) => (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-12" y="10" width="24" height="40" rx="6" fill={P.sky} stroke={P.ink} strokeWidth="4" />
      <circle cx="0" cy="0" r="16" fill="#f6dcc4" stroke={P.ink} strokeWidth="4" />
      <path d="M-16 -2 Q-14 -18 0 -18 Q14 -18 16 -2 Q8 -10 0 -8 Q-8 -10 -16 -2 Z" fill="#4a2c1c" stroke={P.ink} strokeWidth="3" />
      <circle cx="-6" cy="2" r="5" fill="none" stroke={P.ink} strokeWidth="2.5" />
      <circle cx="7" cy="2" r="5" fill="none" stroke={P.ink} strokeWidth="2.5" />
    </g>
  );
  const scene = (children: React.ReactNode) => (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <rect width="200" height="130" fill="#f3e6c4" />
      <rect y="78" width="200" height="26" fill={P.mint} />
      <rect y="104" width="200" height="26" fill="#e6dcc4" stroke={P.ink} strokeWidth="4" />
      {children}
    </svg>
  );
  if (step === 0) {
    return scene(
      <>
        <path d="M70 92 Q100 30 130 92" fill="none" stroke={P.sun} strokeWidth="5" strokeLinecap="round" strokeDasharray="2 10" />
        {bruno(100, 48)}
        <path d="M54 70 L34 70 M42 62 L34 70 L42 78 M146 70 L166 70 M158 62 L166 70 L158 78" fill="none" stroke={P.plum600} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </>,
    );
  }
  if (step === 1) {
    return scene(
      <>
        {bruno(62, 54)}
        <g transform="translate(76 70) rotate(-12)">
          <path d="M0 -5 L56 -5 Q64 0 56 5 L0 5 Z" fill="#d9a066" stroke={P.ink} strokeWidth="3.5" strokeLinejoin="round" />
          <rect x="-8" y="-9" width="8" height="18" rx="2" fill="#a96d36" stroke={P.ink} strokeWidth="3" />
        </g>
        <g transform="translate(150 50)">
          <rect x="-15" y="12" width="30" height="42" rx="6" fill={P.sun} stroke={P.ink} strokeWidth="4" />
          <circle cx="0" cy="0" r="17" fill="#f2c9a6" stroke={P.ink} strokeWidth="4" />
          <path d="M-18 -4 Q-16 -22 0 -21 Q16 -22 18 -4 Z" fill={P.leaf} stroke={P.ink} strokeWidth="3.5" />
          <path d="M-8 4 L-2 6 M8 4 L2 6" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M-8 12 Q0 6 8 12" fill="none" stroke={P.ink} strokeWidth="3" />
        </g>
        <path d="M134 40 l5 9 l10 -4 l-4 10 l9 5 l-10 3 l3 10 l-9 -5 l-6 8 l-1 -10 l-10 -1 l8 -6 l-6 -8 l10 2 z" fill={P.sun} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
      </>,
    );
  }
  return scene(
    <>
      <rect x="132" y="30" width="48" height="74" rx="4" fill="#7c4527" stroke={P.ink} strokeWidth="4" />
      <rect x="126" y="18" width="60" height="16" rx="3" fill={P.sun} stroke={P.ink} strokeWidth="3" />
      <text x="156" y="30" textAnchor="middle" fontSize="10" fill={P.ink} style={display}>
        DIREÇÃO
      </text>
      <circle cx="170" cy="70" r="3.5" fill={P.sun} stroke={P.ink} strokeWidth="2" />
      {bruno(70, 54)}
      <path d="M96 76 L116 76 M108 68 L116 76 L108 84" fill="none" stroke={P.plum600} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );
}

export const GAME_LOGOS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
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
