import { P } from "@/lib/palette";

type IconProps = { className?: string };

const base = {
  stroke: P.ink,
  strokeWidth: 2.6,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

export function HouseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M4 15 L16 5 L28 15" fill="none" {...base} />
      <path d="M7 13 L7 27 L25 27 L25 13" fill={P.sun} {...base} />
      <path d="M13 27 L13 19 L19 19 L19 27" fill={P.tomato} {...base} />
      <path d="M21 8 L21 4 L24 4 L24 10" fill={P.cream} {...base} />
    </svg>
  );
}

export function ControllerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M7 11 Q4 11 3.5 15 L2.6 22 Q2.4 26 6 26 Q8 26 10 22.5 L22 22.5 Q24 26 26 26 Q29.6 26 29.4 22 L28.5 15 Q28 11 25 11 Z"
        fill={P.plum500}
        {...base}
      />
      <path d="M9 14.5 L9 19.5 M6.5 17 L11.5 17" fill="none" {...base} stroke={P.cream} />
      <circle cx="21.5" cy="15.5" r="1.8" fill={P.tomato} stroke={P.ink} strokeWidth="1.6" />
      <circle cx="24.6" cy="18.6" r="1.8" fill={P.sun} stroke={P.ink} strokeWidth="1.6" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M16 3 L19.6 11.4 L28.6 12 L21.7 17.8 L23.9 26.8 L16 22 L8.1 26.8 L10.3 17.8 L3.4 12 L12.4 11.4 Z"
        fill={P.sun}
        {...base}
      />
      <path d="M12.5 14.5 L13 15 M19.5 14.5 L19 15" {...base} />
    </svg>
  );
}

export function SmileyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="12" fill={P.mint} {...base} />
      <ellipse cx="12" cy="13.5" rx="1.6" ry="2.4" fill={P.ink} />
      <ellipse cx="20" cy="13.5" rx="1.6" ry="2.4" fill={P.ink} />
      <path d="M10 19 Q16 25 22 19" fill="none" {...base} />
    </svg>
  );
}

export function ChestIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M4 14 L28 14 L27 27 L5 27 Z" fill={P.plum500} {...base} />
      <path d="M4 14 Q4 6 16 6 Q28 6 28 14 Z" fill={P.plum300} {...base} />
      <rect x="13" y="12" width="6" height="7" rx="1.5" fill={P.sun} {...base} />
      <path d="M8 6.5 L6 3 M24 6.5 L26 3 M16 4.5 L16 1.5" fill="none" {...base} stroke={P.sunDeep} />
    </svg>
  );
}

export function TowerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M16 9 L9 29 M16 9 L23 29 M11.5 22 L20.5 22 M13 17 L19 17" fill="none" {...base} />
      <circle cx="16" cy="8" r="3" fill={P.tomato} {...base} />
      <path d="M8 4 Q5 8 8 12 M24 4 Q27 8 24 12" fill="none" {...base} stroke={P.tomato} />
    </svg>
  );
}

export function SpeakerIcon({ className, muted }: IconProps & { muted?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M5 12 L10 12 L17 6 L17 26 L10 20 L5 20 Z" fill={P.sun} {...base} />
      {muted ? (
        <path d="M21 12 L28 20 M28 12 L21 20" fill="none" {...base} stroke={P.tomato} strokeWidth={3.2} />
      ) : (
        <path d="M21 11.5 Q24 16 21 20.5 M24.5 8 Q30 16 24.5 24" fill="none" {...base} />
      )}
    </svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M20 6 L8 16 L20 26 Z" fill={P.ink} stroke={P.ink} strokeWidth={2.6} strokeLinejoin="round" />
    </svg>
  );
}

export function PlayTriangle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M9 5 L27 16 L9 27 Z" fill="currentColor" stroke={P.ink} strokeWidth={2.6} strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIcon({ className, open }: IconProps & { open?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      {open ? (
        <path d="M8 8 L24 24 M24 8 L8 24" fill="none" {...base} strokeWidth={3.4} />
      ) : (
        <path d="M6 9 L26 8 M5 16.5 L27 16 M6 24 L25 23.5" fill="none" {...base} strokeWidth={3.4} />
      )}
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M10 14 L10 10 Q10 4 16 4 Q22 4 22 10 L22 14" fill="none" {...base} strokeWidth={3} />
      <rect x="6" y="14" width="20" height="15" rx="3" fill={P.steel} {...base} />
      <circle cx="16" cy="20" r="2.2" fill={P.ink} />
      <path d="M16 21 L16 25" {...base} />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="8" y="6" width="6" height="20" rx="1.5" fill="currentColor" {...base} />
      <rect x="18" y="6" width="6" height="20" rx="1.5" fill="currentColor" {...base} />
    </svg>
  );
}

export function RestartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M25 16 A9 9 0 1 1 22 9.2" fill="none" {...base} strokeWidth={3.2} />
      <path d="M17.5 5 L24.5 8 L21.5 14.5" fill="none" {...base} strokeWidth={3.2} />
    </svg>
  );
}

export function QuestionIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M10.5 11 Q10.5 5 16.5 5 Q22.5 5 22.5 10.5 Q22.5 14 18 16 Q16.5 17 16.5 19.5" fill="none" {...base} strokeWidth={3.4} />
      <circle cx="16.5" cy="25.5" r="2.3" fill={P.ink} />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M16 4 L16 19 M9.5 13 L16 19.5 L22.5 13" fill="none" {...base} strokeWidth={3.2} />
      <path d="M5 21 L5 27 L27 27 L27 21" fill="none" {...base} strokeWidth={3.2} />
    </svg>
  );
}
