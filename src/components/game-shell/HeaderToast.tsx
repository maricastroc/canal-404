"use client";

import { AnimatePresence, motion } from "motion/react";
import { KeyholeBadge, StarBadge } from "@/components/art/Badges";
import { useLocale } from "@/i18n/client";
import { useToasts } from "@/lib/progress/hooks";

export function useHeaderToast() {
  const toasts = useToasts();
  return toasts.at(-1) ?? null;
}

export function HeaderToast() {
  const toast = useHeaderToast();
  const locale = useLocale();
  const title = toast ? (typeof toast.title === "string" ? toast.title : toast.title[locale]) : "";
  return (
    <AnimatePresence>
      {toast ? (
        <motion.p
          key={toast.id}
          aria-hidden
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: "spring", stiffness: 460, damping: 30 }}
          className="absolute inset-0 flex items-center gap-1.5 sm:hidden"
        >
          <span className="w-7 shrink-0">{toast.kind === "secret" ? <KeyholeBadge /> : <StarBadge />}</span>
          <span className="line-clamp-2 min-w-0 font-display text-[13px] uppercase leading-[1.05] text-cream">{title}</span>
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
