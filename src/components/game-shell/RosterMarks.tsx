"use client";

import { motion, useReducedMotion } from "motion/react";
import { LockIcon } from "@/components/art/Icons";
import type { ResultMark } from "@/games/types";
import { useCopy } from "@/i18n/client";
import { localized } from "@/i18n/copy";

type MarkState = "done" | "locked" | "missing";

const COPY = localized({
  "pt-BR": {
    list: "Vitórias por personagem",
    mark: (name: string, state: MarkState) => `${name}: ${state === "done" ? "venceu" : state === "locked" ? "bloqueado" : "falta vencer"}`,
  },
  en: {
    list: "Wins by character",
    mark: (name: string, state: MarkState) => `${name}: ${state === "done" ? "won" : state === "locked" ? "locked" : "not won yet"}`,
  },
});

export function RosterMarks({ marks, size = "sm", delay = 0 }: { marks: ResultMark[]; size?: "sm" | "md"; delay?: number }) {
  const copy = useCopy(COPY);
  const reduced = useReducedMotion();
  const dot = size === "md" ? "size-6 border-2" : "size-[1.15rem] border-2 sm:size-6";
  return (
    <span role="list" aria-label={copy.list} className={`flex ${size === "md" ? "gap-1" : "gap-0.5 sm:gap-1"}`}>
      {marks.map((mark, i) => (
        <motion.span
          key={mark.label}
          role="listitem"
          initial={mark.fresh && !reduced ? { scale: 0.4, rotate: -20 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + i * 0.05, type: "spring", stiffness: 420, damping: 13 }}
          className={`relative grid shrink-0 place-items-center rounded-full bg-[length:128%] bg-[position:50%_30%] bg-no-repeat ${dot} ${mark.done ? "border-ink" : "border-dashed border-ink/40 bg-cream"} ${mark.fresh ? "shadow-[0_0_0_2px_var(--color-bubblegum)]" : ""}`}
          style={mark.locked ? undefined : { backgroundColor: mark.done ? mark.color : undefined, backgroundImage: `url(${mark.avatar})` }}
        >
          {mark.done || mark.locked ? null : <span aria-hidden className="absolute inset-0 rounded-full bg-cream/55" />}
          {mark.locked ? <LockIcon className={`text-ink/45 ${size === "md" ? "size-3" : "size-2.5 sm:size-3"}`} /> : null}
          <span className="sr-only">{copy.mark(mark.label, mark.done ? "done" : mark.locked ? "locked" : "missing")}</span>
        </motion.span>
      ))}
    </span>
  );
}
