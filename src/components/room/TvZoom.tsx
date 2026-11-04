"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/art/Icons";
import { TvScreen } from "./objects/Tv";
import { TV_BOX, TV_KNOB, TvKnob, TvSet } from "./objects/TvSet";

type Props = Omit<ComponentProps<typeof TvScreen>, "onZoom" | "next" | "screenRef" | "className" | "style" | "onHint"> & {
  getOrigin: () => DOMRect | null;
  onClose: () => void;
  knobAngle: number;
};

const OPEN = { duration: 420, easing: "cubic-bezier(.2,.9,.3,1.12)" };
const CLOSE = { duration: 300, easing: "cubic-bezier(.5,0,.75,0)" };

export function TvZoom({ getOrigin, onClose, knobAngle, ...screen }: Props) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const screenEl = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const opened = useRef(false);
  const origin = useRef(getOrigin);

  useLayoutEffect(() => {
    origin.current = getOrigin;
  }, [getOrigin]);

  const flight = useCallback(() => {
    frame.current?.getAnimations().forEach((animation) => animation.cancel());
    if (frame.current) frame.current.style.transform = "";
    const from = origin.current();
    const box = frame.current?.getBoundingClientRect();
    const target = screenEl.current?.getBoundingClientRect();
    if (!from || !box || !target || !target.width) return null;
    const scale = from.width / target.width;
    const x = from.left - box.left - (target.left - box.left) * scale;
    const y = from.top - box.top - (target.top - box.top) * scale;
    return `translate(${x}px, ${y}px) scale(${scale})`;
  }, []);

  useLayoutEffect(() => {
    if (opened.current) return;
    opened.current = true;
    closeButton.current?.focus({ preventScroll: true });
    if (reduced) return;
    const start = flight();
    root.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
    const el = frame.current;
    if (!start || !el) return;
    el.style.transform = start;
    const run = el.animate([{ transform: start }, { transform: "none" }], { ...OPEN, fill: "forwards" });
    run.onfinish = () => {
      el.style.transform = "";
      run.cancel();
    };
  }, [flight, reduced]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const end = reduced ? null : flight();
    if (!end || !frame.current) {
      onClose();
      return;
    }
    root.current?.animate([{ opacity: 1 }, { opacity: 0 }], { ...CLOSE, fill: "forwards" });
    const run = frame.current.animate([{ transform: "none" }, { transform: end }], { ...CLOSE, fill: "forwards" });
    run.onfinish = () => onClose();
  }, [flight, onClose, reduced]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !root.current) return;
      const items = Array.from(root.current.querySelectorAll<HTMLElement>("a[href], button:not([tabindex='-1'])"));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [close]);

  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="TV de perto"
      className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-plum-950/85 p-4 backdrop-blur-[3px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(255,200,61,.14) 0, rgba(20,15,38,0) 55%)" }}
      />
      <button
        ref={closeButton}
        type="button"
        onClick={close}
        onPointerEnter={(e) => e.pointerType === "mouse" && screen.onHoverSound?.()}
        className="press absolute right-3 top-3 z-10 flex min-h-11 items-center gap-2 rounded-xl border-[3px] border-ink bg-cream px-3 py-1.5 font-display text-sm uppercase tracking-wide text-ink shadow-[var(--shadow-ink-sm)] sm:right-5 sm:top-5"
      >
        <CloseIcon className="size-5" />
        Voltar pra sala
      </button>
      <div
        ref={frame}
        className="relative aspect-[294/246] w-[min(94vw,calc((100svh-8rem)*1.195))] origin-top-left rounded-[7%/8%] border-[4px] border-ink bg-plum-900 shadow-[0_0_0_6px_var(--color-wood-deep),0_0_0_10px_var(--color-ink),0_18px_40px_rgba(0,0,0,.45)] tvset:mt-[6vh] tvset:aspect-[480/400] tvset:w-[min(92vw,1180px,calc((100svh-9rem)*1.2))] tvset:rounded-none tvset:border-0 tvset:bg-transparent tvset:shadow-none"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden tvset:block">
          <TvSet glow />
          <div
            className="absolute"
            style={{
              left: `${((TV_KNOB.cx - TV_KNOB.r) / TV_BOX.w) * 100}%`,
              top: `${((TV_KNOB.cy - TV_KNOB.r) / TV_BOX.h) * 100}%`,
              width: `${((TV_KNOB.r * 2) / TV_BOX.w) * 100}%`,
              height: `${((TV_KNOB.r * 2) / TV_BOX.h) * 100}%`,
            }}
          >
            <TvKnob angle={knobAngle} />
          </div>
        </div>
        <TvScreen
          {...screen}
          screenRef={screenEl}
          className="inset-[4%] tvset:inset-auto tvset:left-[10.417%] tvset:top-[14.5%] tvset:h-[61.5%] tvset:w-[61.25%]"
        />
      </div>
      <p className="pointer-events-none absolute inset-x-4 bottom-3 text-center font-hand text-base text-cream-2 sm:bottom-5">Esc ou clique fora da TV pra voltar pra sala.</p>
    </div>,
    document.body,
  );
}
