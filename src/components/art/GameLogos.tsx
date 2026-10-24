import { P } from "@/lib/palette";

const display = { fontFamily: "var(--font-luckiest)" };

export function RuaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 170" className={className} role="img" aria-label="Rua Sem Saída">
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

export function HowToPanel({ step }: { step: 0 | 1 | 2 }) {
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

export function LabLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 190" className={className} role="img" aria-label="Laboratório de Péssimas Ideias">
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

export function LabHowToPanel({ step }: { step: 0 | 1 | 2 }) {
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

export const GAME_LOGOS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  "rua-sem-saida": RuaLogo,
  "laboratorio-de-pessimas-ideias": LabLogo,
};

export function GameHowToPanel({ slug, step }: { slug: string; step: 0 | 1 | 2 }) {
  if (slug === "laboratorio-de-pessimas-ideias") return <LabHowToPanel step={step} />;
  return <HowToPanel step={step} />;
}
