import { LanguageIcon } from "@/components/art/Icons";
import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";

const NOTE = localized({
  "pt-BR": "",
  en: "This game is still in Portuguese. The English version is on the way.",
});

export function GameLanguageNote({ locale, translated = false, className = "" }: { locale: Locale; translated?: boolean; className?: string }) {
  const text = NOTE[locale];
  if (!text || translated) return null;
  return (
    <p className={`flex items-center gap-2 rounded-lg border-2 border-dashed border-ink/30 bg-cream-2 px-3 py-1.5 text-sm font-semibold leading-snug text-ink-soft ${className}`}>
      <LanguageIcon className="size-4" />
      <span>{text}</span>
    </p>
  );
}
