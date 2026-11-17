"use client";

import { LanguageIcon } from "@/components/art/Icons";
import { useLocalPathname, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { LOCALE_NAMES, localePath, otherLocale } from "@/i18n/locales";
import { useSound } from "@/lib/audio/hooks";

const LABELS = localized({
  "pt-BR": "PT: ver em português",
  en: "EN: read in English",
});

export function LanguageSwitch({ className = "", wide = false }: { className?: string; wide?: boolean }) {
  const locale = useLocale();
  const path = useLocalPathname();
  const { play } = useSound();
  const target = otherLocale(locale);
  const href = localePath(target, path);
  return (
    <a
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={LABELS[target]}
      title={LOCALE_NAMES[target].name}
      onClick={(event) => {
        event.currentTarget.href = `${href}${window.location.search}${window.location.hash}`;
        play("click");
      }}
      className={`press flex items-center justify-center gap-1.5 rounded-xl border-[3px] border-ink bg-cream px-2.5 py-1.5 font-display text-sm leading-none text-ink shadow-[var(--shadow-ink-sm)] ${className}`}
    >
      <LanguageIcon className="size-6" />
      <span>{wide ? LOCALE_NAMES[target].name : LOCALE_NAMES[target].short}</span>
    </a>
  );
}
