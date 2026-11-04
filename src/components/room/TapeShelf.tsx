"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, EjectIcon } from "@/components/art/Icons";
import { useHydrated } from "@/lib/progress/hooks";
import { TAPES, tapeById, type Tape, type TapeId } from "./objects/tapes";

type Props = {
  open: boolean;
  inserted: TapeId | null;
  away: TapeId[];
  origin: DOMRect | null;
  onPick: (id: TapeId) => void;
  onEject: () => void;
  onClose: () => void;
  onHoverSound?: () => void;
};

const TORN = "polygon(0 0, 80% 0, 76% 12%, 82% 26%, 74% 40%, 81% 55%, 73% 70%, 79% 84%, 74% 100%, 0 100%)";
const PULL_MS = 220;

function Reel() {
  return (
    <span className="grid aspect-square h-[78%] place-items-center rounded-full border-[3px] border-cream-2 bg-ink">
      <span className="aspect-square h-[38%] rounded-full bg-cream-2" />
    </span>
  );
}

function Cassette({ tape }: { tape: Tape }) {
  return (
    <span className="flex aspect-[4/3] w-full flex-col rounded-lg border-[3px] border-ink bg-ink-soft p-[7%] shadow-[var(--shadow-ink-sm)] transition-[transform,box-shadow] duration-150 group-hover:-translate-y-1.5 group-hover:-rotate-2 group-hover:shadow-[var(--shadow-ink)] group-focus-visible:-translate-y-1.5 group-focus-visible:shadow-[0_0_0_3px_var(--color-wood-deep),0_0_0_6px_var(--color-sun)] group-active:translate-y-0.5">
      <span className="relative flex-1">
        <span
          className={`absolute inset-0 flex flex-col justify-center rounded-sm border-2 border-ink px-[6%] ${tape.torn ? "items-start text-left" : "items-center text-center"}`}
          style={{ backgroundColor: tape.sticker, clipPath: tape.torn ? TORN : undefined }}
        >
          <span className="whitespace-nowrap font-hand text-[clamp(17px,2.4vw,22px)] font-bold leading-none text-ink">{tape.torn ?? tape.label}</span>{" "}
          {tape.note && <span className="mt-1 font-hand text-[15px] leading-none text-ink">{tape.note}</span>}
        </span>
        {tape.torn && (
          <span aria-hidden className="absolute bottom-[8%] right-[6%] h-[30%] w-[14%] rotate-12 border-2 border-ink" style={{ backgroundColor: tape.sticker, clipPath: "polygon(0 18%, 100% 0, 88% 100%, 12% 84%)" }} />
        )}
      </span>
      <span aria-hidden className="mt-[5%] flex h-[30%] items-center justify-center gap-[24%] rounded-md border-2 border-ink bg-plum-950">
        <Reel />
        <Reel />
      </span>
    </span>
  );
}

function PlayingSlot({ tape }: { tape: Tape }) {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border-[3px] border-dashed border-cream-2/70 bg-ink/45 px-2 text-center shadow-[inset_0_4px_10px_rgba(0,0,0,.45)]">
      <span className="flex items-center gap-1.5 font-display text-xs uppercase leading-none tracking-wide text-lime">
        <span aria-hidden className="size-2 rounded-full bg-lime shadow-[0_0_6px_var(--color-lime)]" />
        No vídeo
      </span>
      <span className="font-hand text-lg font-bold leading-none text-cream">{tape.label}</span>
      <span aria-hidden className="mt-1 h-1.5 w-3/5 rounded-full" style={{ backgroundColor: tape.sticker }} />
    </div>
  );
}

function EmptySlot() {
  return <div aria-hidden className="aspect-[4/3] w-full rounded-lg border-[3px] border-dashed border-cream-2/40 bg-ink/30 shadow-[inset_0_4px_10px_rgba(0,0,0,.4)]" />;
}

export function tapeAction(tape: Tape) {
  return tape.torn ? `Colocar a fita de etiqueta rasgada: ${tape.torn}…` : `Colocar a fita ${tape.label}, ${tape.note}`;
}

export function TapeShelf({ open, inserted, away, origin, onPick, onEject, onClose, onHoverSound }: Props) {
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const [picking, setPicking] = useState<TapeId | null>(null);
  const [lastOpen, setLastOpen] = useState(open);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setPicking(null);
  }

  useEffect(() => {
    if (!open) return;
    const items = () => Array.from(panel.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []);
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

  const pick = (id: TapeId) => {
    if (picking) return;
    if (reduced) {
      onPick(id);
      return;
    }
    setPicking(id);
    window.setTimeout(() => onPick(id), PULL_MS);
  };

  if (!hydrated) return null;

  const from = origin
    ? { x: origin.left + origin.width / 2 - window.innerWidth / 2, y: origin.top + origin.height / 2 - window.innerHeight / 2 }
    : { x: 0, y: 40 };
  const hidden = reduced ? { opacity: 0 } : { opacity: 0, x: from.x, y: from.y, scale: 0.22, rotate: -8 };
  const playing = inserted ? tapeById(inserted) : null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="tape-shelf"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[70] grid place-items-center bg-plum-950/75 p-3 sm:p-4"
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
            initial={hidden}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
            exit={hidden}
            transition={reduced ? { duration: 0.12 } : { type: "spring", stiffness: 520, damping: 34, mass: 0.8 }}
            className="paper relative max-h-[calc(100svh-1.5rem)] w-full max-w-[54rem] overflow-y-auto border-[3px] border-ink p-4 shadow-[var(--shadow-ink-lg)] wobbly sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="tape-shelf-title" className="font-display text-[1.6rem] uppercase leading-none tracking-wide text-ink sm:text-3xl">
                  Estante de fitas
                </h2>
                <p id="tape-shelf-hint" className="mt-1.5 font-hand text-lg leading-snug text-ink">
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

            <ul className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-4 rounded-xl border-[3px] border-ink bg-wood-deep p-3 shadow-[inset_0_-10px_0_rgba(0,0,0,.18)] sm:p-4">
              {TAPES.map((tape, i) => (
                <li key={tape.id} className={`w-[calc(50%-0.4rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(20%-0.6rem)] ${i % 2 ? "rotate-1" : "-rotate-1"}`}>
                  {tape.id === inserted ? (
                    <PlayingSlot tape={tape} />
                  ) : away.includes(tape.id) ? (
                    <EmptySlot />
                  ) : (
                    <motion.button
                      type="button"
                      disabled={picking !== null}
                      onClick={() => pick(tape.id)}
                      onPointerEnter={(e) => e.pointerType === "mouse" && onHoverSound?.()}
                      aria-label={tapeAction(tape)}
                      animate={
                        picking === tape.id
                          ? { y: "-46%", rotate: -7, scale: 1.1, opacity: [1, 1, 0] }
                          : picking
                            ? { opacity: 0.45, scale: 0.96 }
                            : { y: 0, rotate: 0, scale: 1, opacity: 1 }
                      }
                      transition={{ duration: PULL_MS / 1000, ease: "easeIn" }}
                      className="group relative block w-full rounded-lg text-left outline-none disabled:cursor-default"
                    >
                      <Cassette tape={tape} />
                      <span aria-hidden className="pointer-events-none absolute -bottom-3.5 left-1/2 -translate-x-1/2 font-display text-sm leading-none text-sun opacity-0 group-focus-visible:opacity-100">
                        ▲
                      </span>
                    </motion.button>
                  )}
                </li>
              ))}
            </ul>

            {playing && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border-[3px] border-ink bg-ink-soft p-2.5 pl-3.5 shadow-[var(--shadow-ink-sm)]">
                <p className="flex min-w-0 items-center gap-2 rounded-md bg-plum-950 px-3 py-2 font-display text-sm uppercase leading-none tracking-wide text-lime">
                  <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-lime shadow-[0_0_8px_var(--color-lime)]" />
                  <span className="truncate">
                    No vídeo: <span className="text-cream">{playing.label}</span>
                  </span>
                </p>
                <button
                  type="button"
                  onClick={onEject}
                  onPointerEnter={(e) => e.pointerType === "mouse" && onHoverSound?.()}
                  className="press flex min-h-11 items-center gap-2 rounded-lg border-[3px] border-ink bg-cream px-4 py-1.5 font-display text-base uppercase tracking-wide text-ink shadow-[0_4px_0_0_var(--color-ink)] active:translate-y-1 active:shadow-none"
                >
                  <EjectIcon className="size-5" />
                  Ejetar {playing.label}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
