"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSound } from "@/lib/audio/hooks";
import { SCENE, SPOTS, spotCenter } from "./layout";

const ZONES = [
  { label: "Janela", spot: SPOTS.window },
  { label: "Rádio", spot: SPOTS.radio },
  { label: "TV", spot: SPOTS.tv },
  { label: "Fliperama", spot: SPOTS.arcade },
];

export function RoomPanner({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { play } = useSound();
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  }, []);

  const scrollToX = useCallback((sceneX: number, smooth: boolean) => {
    const el = ref.current;
    const scene = el?.querySelector<HTMLElement>(".room-scene");
    if (!el || !scene) return;
    const x = (sceneX / SCENE.w) * scene.offsetWidth + scene.offsetLeft - el.clientWidth / 2;
    el.scrollTo({ left: x, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    scrollToX(spotCenter(SPOTS.tv).x, false);
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure, scrollToX]);

  const nudge = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    play("whoosh", { volume: 0.5 });
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={measure}
        className="room-pan overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] xl:overflow-visible [&::-webkit-scrollbar]:hidden"
        tabIndex={-1}
      >
        {children}
      </div>
      <div className="pointer-events-none absolute inset-x-2 top-[calc(var(--room-h)/2)] flex -translate-y-1/2 justify-between xl:hidden">
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={edges.start}
          aria-label="Olhar para a esquerda da sala"
          className="press pointer-events-auto grid size-12 place-items-center rounded-full border-[3px] border-ink bg-sun font-display text-xl text-ink shadow-[var(--shadow-ink-sm)] transition-opacity disabled:pointer-events-none disabled:opacity-0"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={edges.end}
          aria-label="Olhar para a direita da sala"
          className="press pointer-events-auto grid size-12 place-items-center rounded-full border-[3px] border-ink bg-sun font-display text-xl text-ink shadow-[var(--shadow-ink-sm)] transition-opacity disabled:pointer-events-none disabled:opacity-0"
        >
          ▶
        </button>
      </div>
      <nav aria-label="Ir para um canto da sala" className="on-dark flex flex-col items-center px-3 pt-3 xl:hidden">
        <ul className="flex flex-wrap justify-center gap-1.5 rounded-full border-[3px] border-ink bg-plum-800 p-1 shadow-[var(--shadow-ink-sm)]">
          {ZONES.map((zone) => (
            <li key={zone.label}>
              <button
                type="button"
                onClick={() => {
                  play("click");
                  scrollToX(spotCenter(zone.spot).x, true);
                }}
                className="min-h-10 rounded-full px-3.5 font-display text-xs uppercase tracking-wide text-cream hover:bg-plum-600 focus-visible:bg-plum-600"
              >
                {zone.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
