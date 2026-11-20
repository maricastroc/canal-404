import { P } from "@/lib/palette";
import { BADGE_ROSETTE, BADGE_STAR, BADGE_TONES, type BadgeTone } from "./badgeShape";

export type BadgeColor = Exclude<BadgeTone, "steel">;

export function StarBadge({ className, color = "sun" }: { className?: string; color?: BadgeColor }) {
  const [fill, shade] = BADGE_TONES[color];
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d={BADGE_ROSETTE} fill={shade} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="17" fill={fill} stroke={P.ink} strokeWidth="3" />
      <path d={BADGE_STAR} fill={P.white} stroke={P.ink} strokeWidth="2.4" strokeLinejoin="round" />
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
