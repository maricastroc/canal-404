"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCopy } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { useSound } from "@/lib/audio/hooks";
import { SCENE, SPOTS, spotCenter } from "./layout";

const ZONES = [
  { id: "window", spot: SPOTS.window },
  { id: "radio", spot: SPOTS.radio },
  { id: "tv", spot: SPOTS.tv },
  { id: "arcade", spot: SPOTS.arcade },
] as const;

type ZoneId = (typeof ZONES)[number]["id"];

const COPY = localized({
  "pt-BR": {
    zones: { window: "Janela", radio: "Rádio", tv: "TV", arcade: "Fliperama" },
    left: "Olhar para a esquerda da sala",
    right: "Olhar para a direita da sala",
    nav: "Ir para um canto da sala",
  },
  en: {
    zones: { window: "Window", radio: "Radio", tv: "TV", arcade: "Arcade" },
    left: "Look at the left side of the room",
    right: "Look at the right side of the room",
    nav: "Go to a corner of the room",
  },
});

function sceneOf(el: HTMLElement) {
  return el.querySelector<HTMLElement>(".room-scene");
}

function scrollFor(el: HTMLElement, scene: HTMLElement, sceneX: number) {
  const x = (sceneX / SCENE.w) * scene.offsetWidth + scene.offsetLeft - el.clientWidth / 2;
  return Math.min(Math.max(x, 0), el.scrollWidth - el.clientWidth);
}

export function RoomPanner({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { play } = useSound();
  const copy = useCopy(COPY);
  const [edges, setEdges] = useState({ start: true, end: true });
  const [zone, setZone] = useState<ZoneId | null>("tv");
  const zoneRef = useRef<ZoneId | null>("tv");

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    const scene = sceneOf(el);
    if (!scene) return;
    if (el.scrollWidth - el.clientWidth < 8) {
      zoneRef.current = null;
      setZone(null);
      return;
    }
    let nearest: ZoneId = "tv";
    let best = Infinity;
    for (const z of ZONES) {
      const gap = Math.abs(scrollFor(el, scene, spotCenter(z.spot).x) - el.scrollLeft);
      if (gap < best) {
        best = gap;
        nearest = z.id;
      }
    }
    zoneRef.current = nearest;
    setZone(nearest);
  }, []);

  const scrollToX = useCallback((sceneX: number, smooth: boolean) => {
    const el = ref.current;
    const scene = el && sceneOf(el);
    if (!el || !scene) return;
    el.scrollTo({ left: scrollFor(el, scene, sceneX), behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    const el = ref.current;
    const scene = el && sceneOf(el);
    if (!el || !scene) return;
    scrollToX(spotCenter(SPOTS.tv).x, false);
    measure();
    let width = scene.offsetWidth;
    const observer = new ResizeObserver(() => {
      if (scene.offsetWidth !== width) {
        width = scene.offsetWidth;
        const current = ZONES.find((z) => z.id === zoneRef.current) ?? ZONES[2];
        scrollToX(spotCenter(current.spot).x, false);
      }
      measure();
    });
    observer.observe(scene);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, scrollToX]);

  const nudge = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    play("whoosh", { volume: 0.5 });
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  const tab =
    "pointer-events-auto absolute top-[calc(var(--scene-h)/2)] grid h-14 w-11 -translate-y-1/2 place-items-center transition-opacity disabled:pointer-events-none disabled:opacity-0 [&>span]:transition-transform active:[&>span]:scale-90";
  const tabFace =
    "grid h-12 w-7 place-items-center border-[3px] border-ink bg-sun font-display text-base text-ink shadow-[var(--shadow-ink-sm)]";

  return (
    <div className="room-stage relative max-xl:flex-1">
      <div
        ref={ref}
        onScroll={measure}
        className="room-pan overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] max-xl:absolute max-xl:inset-0 xl:overflow-visible [&::-webkit-scrollbar]:hidden"
        tabIndex={-1}
      >
        {children}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[72] xl:hidden">
        <div className={`absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-ink/50 to-transparent transition-opacity duration-300 ${edges.start ? "opacity-0" : ""}`} />
        <div className={`absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-ink/50 to-transparent transition-opacity duration-300 ${edges.end ? "opacity-0" : ""}`} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[73] xl:hidden">
        <button type="button" onClick={() => nudge(-1)} disabled={edges.start} aria-label={copy.left} className={`${tab} left-0 justify-items-start`}>
          <span className={`${tabFace} -ml-[3px] rounded-r-full pr-0.5`}>◀</span>
        </button>
        <button type="button" onClick={() => nudge(1)} disabled={edges.end} aria-label={copy.right} className={`${tab} right-0 justify-items-end`}>
          <span className={`${tabFace} -mr-[3px] rounded-l-full pl-0.5`}>▶</span>
        </button>
      </div>
      <nav aria-label={copy.nav} className="on-dark absolute inset-x-0 bottom-0 z-[75] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] xl:hidden">
        <div className="relative w-[min(100%,22rem)]">
          <div id="mascot-dock" className="absolute inset-x-3 bottom-[calc(100%-0.6rem)] z-10" />
          <ul className="relative flex gap-1 rounded-full border-[3px] border-ink bg-plum-800 p-1 shadow-[var(--shadow-ink)]">
            {ZONES.map((z) => {
              const active = zone === z.id;
              return (
                <li key={z.id} className="flex flex-auto">
                  <button
                    type="button"
                    aria-current={active ? "location" : undefined}
                    onClick={() => {
                      play("click");
                      zoneRef.current = z.id;
                      setZone(z.id);
                      scrollToX(spotCenter(z.spot).x, true);
                    }}
                    className={`min-h-11 w-full rounded-full border-2 px-2 font-display text-xs uppercase tracking-wide transition-[background-color,color,transform] duration-150 active:translate-y-px ${
                      active
                        ? "border-ink bg-sun text-ink shadow-[0_2px_0_0_var(--color-ink)]"
                        : "border-transparent text-cream hover:bg-plum-600 focus-visible:bg-plum-600"
                    }`}
                  >
                    {copy.zones[z.id]}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}
