import { P } from "@/lib/palette";

const COLORS = {
  sun: [P.sun, P.sunDeep],
  mint: [P.mint, P.mintDeep],
  bubblegum: [P.bubblegum, P.bubblegumDeep],
  tangerine: [P.tangerine, P.tangerineDeep],
  sky: [P.sky, P.skyDeep],
  plum: [P.plum300, P.plum500],
} as const;

export type BadgeColor = keyof typeof COLORS;

export function StarBadge({ className, color = "sun" }: { className?: string; color?: BadgeColor }) {
  const [fill, shade] = COLORS[color];
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M32 3 L39 13 L51 9 L51 21 L62 27 L54 36 L58 48 L46 49 L40 60 L32 52 L24 60 L18 49 L6 48 L10 36 L2 27 L13 21 L13 9 L25 13 Z"
        fill={shade}
        stroke={P.ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="17" fill={fill} stroke={P.ink} strokeWidth="3" />
      <path
        d="M32 20 L35.3 27.6 L43.5 28.2 L37.2 33.5 L39.2 41.6 L32 37.2 L24.8 41.6 L26.8 33.5 L20.5 28.2 L28.7 27.6 Z"
        fill={P.white}
        stroke={P.ink}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KeyholeBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="33" cy="34" r="27" fill={P.ink} />
      <circle cx="31" cy="31" r="27" fill={P.mint} stroke={P.ink} strokeWidth="3" />
      <circle cx="31" cy="31" r="19" fill={P.screen} stroke={P.ink} strokeWidth="2.5" strokeDasharray="4 5" />
      <circle cx="31" cy="26" r="6.5" fill={P.ink} />
      <path d="M27.5 29 L25 43 L37 43 L34.5 29 Z" fill={P.ink} />
      <path d="M12 18 L8 14 M50 18 L54 14 M31 4 L31 -1" stroke={P.sun} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LockedBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="33" cy="34" r="27" fill={P.ink} opacity="0.5" />
      <circle cx="31" cy="31" r="27" fill={P.plum700} stroke={P.ink} strokeWidth="3" strokeDasharray="6 4" />
      <text
        x="31"
        y="44"
        textAnchor="middle"
        fontSize="34"
        fill={P.plum300}
        style={{ fontFamily: "var(--font-luckiest)" }}
      >
        ?
      </text>
    </svg>
  );
}

export function Sparkle({ className, color = P.sun }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path
        d="M20 2 Q22 17 38 20 Q22 23 20 38 Q18 23 2 20 Q18 17 20 2 Z"
        fill={color}
        stroke={P.ink}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Squiggle({ className, color = P.plum300 }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 120 20" className={className} aria-hidden>
      <path
        d="M4 12 Q14 2 24 10 T44 10 T64 10 T84 10 T104 10 T116 8"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
