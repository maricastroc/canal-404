"use client";

import { LanguageIcon } from "@/components/art/Icons";
import { useLocalPathname, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { LOCALES, LOCALE_NAMES, localePath, type Locale } from "@/i18n/locales";
import { useSound } from "@/lib/audio/hooks";

const LABEL = localized({ "pt-BR": "Idioma", en: "Language" });

const STYLES = {
  row: {
    box: "flex items-center gap-3 border-[3px] border-ink bg-cream py-1.5 pl-2 pr-2 shadow-[var(--shadow-ink)] wobbly-sm short:py-1 shorter:gap-2 shorter:py-0.5",
    tile: "grid size-10 shrink-0 place-items-center rounded-lg border-[2.5px] border-ink bg-sky short:size-9 shorter:size-8",
    icon: "size-7 short:size-6 shorter:size-5",
    list: "flex flex-1 gap-2",
    item: "flex-1 rounded-lg border-[2.5px] border-ink py-1.5 text-center font-display text-[15px] uppercase leading-none tracking-wide short:py-1 short:text-[14px] shorter:text-[13px]",
  },
  drawer: {
    box: "flex min-h-14 items-center gap-3 border-[3px] border-ink bg-cream py-1.5 pl-2 pr-2 shadow-[var(--shadow-ink)] wobbly-sm",
    tile: "grid size-11 shrink-0 place-items-center rounded-lg border-[2.5px] border-ink bg-sky",
    icon: "size-8",
    list: "flex flex-1 gap-2",
    item: "flex-1 rounded-lg border-[2.5px] border-ink py-2 text-center font-display text-lg uppercase leading-none tracking-wide",
  },
  compact: {
    box: "flex items-center gap-1.5 rounded-xl border-[3px] border-ink bg-cream py-1 pl-2 pr-1 shadow-[var(--shadow-ink-sm)]",
    tile: "grid place-items-center",
    icon: "size-5",
    list: "flex gap-1",
    item: "rounded-lg border-[2.5px] border-ink px-2 py-1 font-display text-sm uppercase leading-none tracking-wide",
  },
} as const;

export function LanguageSwitch({ variant = "compact", className = "" }: { variant?: keyof typeof STYLES; className?: string }) {
  const locale = useLocale();
  const path = useLocalPathname();
  const { play } = useSound();
  const s = STYLES[variant];
  return (
    <div role="group" aria-label={LABEL[locale]} className={`${s.box} ${className}`}>
      <span className={s.tile} aria-hidden>
        <LanguageIcon className={s.icon} />
      </span>
      <div className={s.list}>
        {LOCALES.map((target: Locale) => {
          const name = LOCALE_NAMES[target];
          if (target === locale) {
            return (
              <span key={target} lang={target} aria-current="true" className={`${s.item} bg-sun text-ink`}>
                {name.short}
                <span className="sr-only">{" "}{name.name}</span>
              </span>
            );
          }
          const href = localePath(target, path);
          return (
            <a
              key={target}
              href={href}
              hrefLang={target}
              lang={target}
              title={name.name}
              onClick={(event) => {
                event.currentTarget.href = `${href}${window.location.search}${window.location.hash}`;
                play("click");
              }}
              className={`press ${s.item} bg-cream-2 text-ink-soft hover:bg-cream hover:text-ink`}
            >
              {name.short}
              <span className="sr-only">{" "}{name.name}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
