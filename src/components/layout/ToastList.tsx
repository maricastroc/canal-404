"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { useEffect, useRef, useState } from "react";
import { useSound } from "@/lib/audio/hooks";
import { dismissToast, type Toast, type ToastText } from "@/lib/progress/store";
import { StarBadge, KeyholeBadge } from "@/components/art/Badges";
import { CloseIcon } from "@/components/art/Icons";
import { IntentLink } from "@/components/ui/IntentLink";

const COPY = localized({
  "pt-BR": {
    secretSr: "Segredo encontrado:",
    achievementSr: "Conquista desbloqueada:",
    secretStamp: "Segredo encontrado!",
    achievementStamp: "Conquista desbloqueada!",
    seeSecrets: "Ver segredos",
    seeAchievements: "Ver conquistas",
    close: "Fechar aviso",
  },
  en: {
    secretSr: "Secret found:",
    achievementSr: "Achievement unlocked:",
    secretStamp: "Secret found!",
    achievementStamp: "Achievement unlocked!",
    seeSecrets: "See secrets",
    seeAchievements: "See achievements",
    close: "Close notification",
  },
});

function ToastCard({ toast, compact }: { toast: Toast; compact: boolean }) {
  const { play } = useSound();
  const played = useRef(false);
  const locale = useLocale();
  const copy = COPY[locale];
  const text = (value: ToastText) => (typeof value === "string" ? value : value[locale]);
  const title = text(toast.title);

  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    play(toast.kind === "secret" ? "secret" : "achievement");
  }, [toast, play]);

  useEffect(() => {
    if (held) return;
    const timer = window.setTimeout(() => dismissToast(toast.id), 5200);
    return () => window.clearTimeout(timer);
  }, [toast.id, held]);

  const isSecret = toast.kind === "secret";

  if (compact) {
    return (
      <motion.li
        layout
        initial={{ opacity: 0, y: -24, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: -1 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ type: "spring", stiffness: 460, damping: 26 }}
        className="flex max-w-full items-center gap-2 rounded-full border-[3px] border-ink bg-paper py-0.5 pl-1 pr-3 shadow-[var(--shadow-ink-sm)]"
      >
        <span className="w-8 shrink-0">{isSecret ? <KeyholeBadge /> : <StarBadge />}</span>
        <span className="sr-only">{isSecret ? copy.secretSr : copy.achievementSr}</span>
        <span className="truncate font-display text-sm uppercase leading-tight tracking-wide text-ink">{title}</span>
      </motion.li>
    );
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 30, rotate: -4, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, rotate: isSecret ? 1.2 : -1.2, scale: 1 }}
      exit={{ opacity: 0, x: 60, rotate: 6 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className="paper pointer-events-auto relative flex w-full max-w-sm items-center gap-3 border-[3px] border-ink p-3 pr-10 shadow-[var(--shadow-ink)] wobbly"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false);
      }}
    >
      <div className="w-14 shrink-0 [@media(max-height:520px)]:w-9">{isSecret ? <KeyholeBadge /> : <StarBadge />}</div>
      <div className="min-w-0">
        <p
          className={`inline-block -rotate-1 rounded-md border-2 border-ink px-2 font-display text-xs tracking-wide text-ink ${
            isSecret ? "bg-mint" : "bg-sun"
          }`}
        >
          {isSecret ? copy.secretStamp : copy.achievementStamp}
        </p>
        <p className="mt-1 font-display text-lg leading-tight text-ink">{title}</p>
        <p className="text-sm leading-snug text-ink-soft [@media(max-height:520px)]:hidden">{text(toast.description)}</p>
        {toast.kind !== "info" && (
          <IntentLink
            href={isSecret ? "/extras#secrets" : "/extras#achievements"}
            onClick={() => dismissToast(toast.id)}
            className="mt-1 inline-block font-display text-xs uppercase tracking-wide text-plum-700 underline decoration-2 underline-offset-2 hover:text-ink"
          >
            {isSecret ? copy.seeSecrets : copy.seeAchievements}
          </IntentLink>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        className="absolute right-2 top-2 grid size-8 place-items-center rounded-full border-2 border-ink bg-cream-2 font-display text-sm text-ink hover:bg-tomato hover:text-cream"
        aria-label={copy.close}
      >
        <CloseIcon className="size-4" />
      </button>
    </motion.li>
  );
}

export function ToastList({ toasts, compact }: { toasts: Toast[]; compact: boolean }) {
  return (
    <AnimatePresence>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} compact={compact} />
      ))}
    </AnimatePresence>
  );
}
