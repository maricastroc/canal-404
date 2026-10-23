"use client";

import { SpeakerIcon } from "@/components/art/Icons";
import { getAudio } from "@/lib/audio/engine";
import { SFX } from "@/lib/audio/sfx";
import { useHydrated, useProgress } from "@/lib/progress/hooks";
import { setSetting } from "@/lib/progress/store";

export function SoundToggle({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const on = hydrated ? progress.settings.sfx : true;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Efeitos sonoros ligados. Desligar" : "Efeitos sonoros desligados. Ligar"}
      onClick={() => {
        const next = !on;
        setSetting("sfx", next);
        const audio = getAudio();
        audio.setSfxEnabled(next);
        if (next) audio.play(SFX.toggleOn);
      }}
      className={`press flex items-center gap-2 rounded-xl border-[3px] border-ink bg-cream px-2.5 py-1.5 font-display text-sm text-ink shadow-[var(--shadow-ink-sm)] ${className}`}
    >
      <SpeakerIcon muted={!on} className="size-7" />
      {!compact && <span className="leading-none">{on ? "Som" : "Mudo"}</span>}
    </button>
  );
}
