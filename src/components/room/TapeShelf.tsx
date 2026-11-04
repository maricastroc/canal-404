"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, EjectIcon } from "@/components/art/Icons";
import { InkButton } from "@/components/ui/Primitives";
import { useHydrated } from "@/lib/progress/hooks";
import { TAPES, tapeById, type Tape, type TapeId } from "./objects/tapes";

type Props = {
  open: boolean;
  inserted: TapeId | null;
  onPick: (id: TapeId) => void;
  onEject: () => void;
  onClose: () => void;
  onHoverSound?: () => void;
};

const TORN = "polygon(0 0, 80% 0, 76% 12%, 82% 26%, 74% 40%, 81% 55%, 73% 70%, 79% 84%, 74% 100%, 0 100%)";

function Reel() {
  return (
    <span className="grid aspect-square h-[78%] place-items-center rounded-full border-[3px] border-cream-2 bg-ink">
      <span className="aspect-square h-[38%] rounded-full bg-cream-2" />
    </span>
  );
}

function Reels() {
  return (
    <span aria-hidden className="mt-[5%] flex h-[30%] items-center justify-center gap-[24%] rounded-md border-2 border-ink bg-plum-950">
      <Reel />
      <Reel />
    </span>
  );
}

function Cassette({ tape }: { tape: Tape }) {
  return (
    <span className="flex aspect-[4/3] w-full flex-col rounded-lg border-[3px] border-ink bg-ink-soft p-[7%] shadow-[var(--shadow-ink-sm)] transition-transform duration-150 group-hover:-translate-y-1 group-hover:-rotate-2 group-active:translate-y-0.5">
      <span className="relative flex-1">
        <span
          className={`absolute inset-0 flex flex-col justify-center rounded-sm border-2 border-ink px-[6%] ${tape.torn ? "items-start text-left" : "items-center text-center"}`}
          style={{ backgroundColor: tape.sticker, clipPath: tape.torn ? TORN : undefined }}
        >
          <span className="whitespace-nowrap font-hand text-[clamp(16px,2.4vw,21px)] font-bold leading-none text-ink">{tape.torn ?? tape.label}</span>{" "}
          {tape.note && <span className="mt-1 font-hand text-sm leading-none text-ink">{tape.note}</span>}
        </span>
        {tape.torn && (
          <span aria-hidden className="absolute bottom-[8%] right-[6%] h-[30%] w-[14%] rotate-12 border-2 border-ink" style={{ backgroundColor: tape.sticker, clipPath: "polygon(0 18%, 100% 0, 88% 100%, 12% 84%)" }} />
        )}
      </span>
      <Reels />
    </span>
  );
}

export function tapeAction(tape: Tape) {
  return tape.torn ? `Colocar a fita de etiqueta rasgada: ${tape.torn}…` : `Colocar a fita ${tape.label}, ${tape.note}`;
}

export function TapeShelf({ open, inserted, onPick, onEject, onClose, onHoverSound }: Props) {
  const hydrated = useHydrated();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const items = () => Array.from(panel.current?.querySelectorAll<HTMLElement>("button") ?? []);
    (panel.current?.querySelector<HTMLElement>("ul button") ?? items()[0])?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const list = items();
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!hydrated) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="tape-shelf"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] grid place-items-center bg-plum-950/75 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tape-shelf-title"
            aria-describedby="tape-shelf-hint"
            initial={{ y: 30, scale: 0.94, rotate: -1.5 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            exit={{ y: 20, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="paper relative max-h-[calc(100svh-2rem)] w-full max-w-[52rem] overflow-y-auto border-[3px] border-ink p-4 shadow-[var(--shadow-ink-lg)] wobbly sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="tape-shelf-title" className="font-display text-2xl uppercase leading-none tracking-wide text-ink sm:text-3xl">
                  Estante de fitas
                </h2>
                <p id="tape-shelf-hint" className="mt-1 font-hand text-lg leading-snug text-ink">
                  Escolha uma fita pro videocassete.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                onPointerEnter={(e) => e.pointerType === "mouse" && onHoverSound?.()}
                className="press grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-cream text-ink shadow-[var(--shadow-ink-sm)]"
              >
                <CloseIcon className="size-6" />
                <span className="sr-only">Fechar a estante</span>
              </button>
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 rounded-xl border-[3px] border-ink bg-wood-deep p-3 sm:grid-cols-3 sm:p-4 md:grid-cols-5">
              {TAPES.map((tape, i) => (
                <li key={tape.id} className={i % 2 ? "rotate-1" : "-rotate-1"}>
                  {tape.id === inserted ? (
                    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-lg border-[3px] border-dashed border-cream-2 px-2 text-center">
                      <span className="font-display text-xs uppercase leading-tight tracking-wide text-cream">No videocassete</span>
                      <span className="mt-0.5 font-hand text-base leading-none text-cream-2">{tape.label}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPick(tape.id)}
                      aria-label={tapeAction(tape)}
                      onPointerEnter={(e) => e.pointerType === "mouse" && onHoverSound?.()}
                      className="group block w-full rounded-lg text-left [--focus:var(--color-sun)]"
                    >
                      <Cassette tape={tape} />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {inserted && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="font-hand text-lg leading-snug text-ink">
                  Tocando agora: <strong>{tapeById(inserted).label}</strong>
                </p>
                <InkButton tone="tomato" onClick={onEject} onPointerEnter={(e) => e.pointerType === "mouse" && onHoverSound?.()} className="gap-2">
                  <EjectIcon className="size-5" />
                  Ejetar fita
                </InkButton>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
