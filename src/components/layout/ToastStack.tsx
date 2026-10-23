"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useSound } from "@/lib/audio/hooks";
import { useToasts } from "@/lib/progress/hooks";
import { dismissToast, type Toast } from "@/lib/progress/store";
import { StarBadge, KeyholeBadge } from "@/components/art/Badges";

function ToastCard({ toast }: { toast: Toast }) {
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
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-3 top-20 z-[80] sm:inset-x-auto sm:right-5 sm:w-96 [@media(max-height:520px)]:top-16 [@media(max-height:520px)]:w-72"
    >
      <ul className="flex flex-col items-end gap-3">
        <AnimatePresence initial={false}>
          {toasts.slice(-3).map((toast) => (
            <ToastCard key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
