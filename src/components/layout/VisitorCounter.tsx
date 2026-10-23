"use client";

import { useHydrated, useProgress } from "@/lib/progress/hooks";

export function VisitorCounter({ className = "" }: { className?: string }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const number = hydrated ? progress.visitorNumber + Math.max(0, progress.visits - 1) : null;
  return (
    <div
      className={`relative inline-block -rotate-2 border-[3px] border-ink bg-cream px-4 py-2 shadow-[var(--shadow-ink)] wobbly-sm ${className}`}
    >
      <span className="absolute -right-3 -top-3 text-2xl text-sun drop-shadow-[2px_2px_0_#1d1830]" aria-hidden>
        ★
      </span>
      <p className="font-display text-xs tracking-widest text-ink-soft">VISITANTE</p>
      <p className="font-display text-xl leading-none text-ink tabular-nums">
        Nº {number === null ? "—" : String(number).padStart(7, "0")}
      </p>
    </div>
  );
}
