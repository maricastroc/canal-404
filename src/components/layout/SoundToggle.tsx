"use client";

import { SpeakerIcon } from "@/components/art/Icons";
import { useCopy } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { getAudio } from "@/lib/audio/engine";
import { SFX } from "@/lib/audio/sfx";
import { useHydrated, useProgress } from "@/lib/progress/hooks";
import { setSetting } from "@/lib/progress/store";

const COPY = localized({
  "pt-BR": { on: "Efeitos sonoros ligados. Desligar", off: "Efeitos sonoros desligados. Ligar", onShort: "Som", offShort: "Mudo" },
  en: { on: "Sound effects on. Turn off", off: "Sound effects off. Turn on", onShort: "Sound", offShort: "Muted" },
});

export function SoundToggle({ className = "", compact = false, square = false }: { className?: string; compact?: boolean; square?: boolean }) {
  const copy = useCopy(COPY);
  const progress = useProgress();
  const hydrated = useHydrated();
  const on = hydrated ? progress.settings.sfx : true;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? copy.on : copy.off}
      onClick={() => {
        const next = !on;
        setSetting("sfx", next);
        const audio = getAudio();
        audio.setSfxEnabled(next);
        if (next) audio.play(SFX.toggleOn);
      }}
      className={`press flex items-center border-[3px] border-ink bg-cream font-display text-sm text-ink shadow-[var(--shadow-ink-sm)] ${square ? "size-10 justify-center rounded-lg" : "gap-2 rounded-xl px-2.5 py-1.5"} ${className}`}
    >
      <SpeakerIcon muted={!on} className={square ? "size-6" : "size-7"} />
      {!compact && <span className="leading-none">{on ? copy.onShort : copy.offShort}</span>}
    </button>
  );
}
