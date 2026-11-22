"use client";

import { RatingStar } from "@/components/art/Icons";
import { useCopy } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { useHydrated, useProgress } from "@/lib/progress/hooks";

const COPY = localized({
  "pt-BR": { visitor: "VISITANTE", number: "Nº" },
  en: { visitor: "VISITOR", number: "No." },
});

export function VisitorCounter({ className = "" }: { className?: string }) {
  const copy = useCopy(COPY);
  const progress = useProgress();
  const hydrated = useHydrated();
  const number = hydrated ? progress.visitorNumber + Math.max(0, progress.visits - 1) : null;
  return (
    <div
      className={`relative inline-block -rotate-2 border-[3px] border-ink bg-cream px-4 py-2 shadow-[var(--shadow-ink)] wobbly-sm ${className}`}
    >
      <span className="absolute -right-3 -top-3" aria-hidden>
        <RatingStar className="size-7" />
      </span>
      <p className="font-display text-xs tracking-widest text-ink-soft">{copy.visitor}</p>
      <p className="font-display text-xl leading-none text-ink tabular-nums">
        {copy.number} {number === null ? "—" : String(number).padStart(7, "0")}
      </p>
    </div>
  );
}
