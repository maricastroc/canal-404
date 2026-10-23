"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSound } from "@/lib/audio/hooks";
import { useToasts } from "@/lib/progress/hooks";
import { dismissToast, type Toast } from "@/lib/progress/store";
import { StarBadge, KeyholeBadge } from "@/components/art/Badges";

function ToastCard({ toast, compact }: { toast: Toast; compact: boolean }) {
  const { play } = useSound();
  const played = useRef(false);

  useEffect(() => {
    if (!played.current) {
      played.current = true;
      play(toast.kind === "secret" ? "secret" : "achievement");
    }
    const timer = window.setTimeout(() => dismissToast(toast.id), 5200);
    return () => window.clearTimeout(timer);
  }, [toast, play]);

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
        <span className="sr-only">{isSecret ? "Segredo encontrado:" : "Conquista desbloqueada:"}</span>
        <span className="truncate font-display text-sm uppercase leading-tight tracking-wide text-ink">{toast.title}</span>
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
    >
      <div className="w-14 shrink-0 [@media(max-height:520px)]:w-9">{isSecret ? <KeyholeBadge /> : <StarBadge />}</div>
      <div className="min-w-0">
        <p
          className={`inline-block -rotate-1 rounded-md border-2 border-ink px-2 font-display text-xs tracking-wide text-ink ${
            isSecret ? "bg-mint" : "bg-sun"
          }`}
        >
          {isSecret ? "Segredo encontrado!" : "Conquista desbloqueada!"}
        </p>
        <p className="mt-1 font-display text-lg leading-tight text-ink">{toast.title}</p>
        <p className="text-sm leading-snug text-ink-soft [@media(max-height:520px)]:hidden">{toast.description}</p>
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        className="absolute right-2 top-2 grid size-8 place-items-center rounded-full border-2 border-ink bg-cream-2 font-display text-sm text-ink hover:bg-tomato hover:text-cream"
        aria-label="Fechar aviso"
      >
        ×
      </button>
    </motion.li>
  );
}

export function ToastStack() {
  const toasts = useToasts();
  const inGame = usePathname().startsWith("/jogar");
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className={`pointer-events-none fixed z-[80] ${
        inGame
          ? "left-1/2 top-2.5 w-max max-w-[min(34vw,22rem)] -translate-x-1/2"
          : "inset-x-3 top-20 sm:inset-x-auto sm:right-5 sm:w-96 [@media(max-height:520px)]:top-16 [@media(max-height:520px)]:w-72"
      }`}
    >
      <ul className={`flex flex-col gap-3 ${inGame ? "items-center" : "items-end"}`}>
        <AnimatePresence initial={false}>
          {toasts.slice(inGame ? -1 : -3).map((toast) => (
            <ToastCard key={toast.id} toast={toast} compact={inGame} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
