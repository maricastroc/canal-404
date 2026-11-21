"use client";

import { useEffect, useRef, useState } from "react";
import { localized } from "@/i18n/copy";
import { useLocale } from "@/i18n/client";
import { NIGHT_COPY } from "@/games/past-bedtime/copy";
import type { PrototypeHandle } from "@/games/past-bedtime/prototype";
import type { Orientation } from "@/games/past-bedtime/scenes/layout";
import type { Command, NightBridge, WinReport } from "@/games/past-bedtime/scenes/NightScene";

const PROGRESS_KEY = "canal404:past-bedtime-prototype:progress:v1";
const LEVEL_KEY = "canal404:past-bedtime-prototype:level";

const COPY = localized({
  "pt-BR": {
    loading: "Apagando as luzes…",
    runs: "Partes concluídas nesta sessão",
    noRuns: "Nenhuma parte concluída ainda.",
    moves: (turns: number, par: number) => `${turns} jogadas (meta ${par})`,
    hints: (n: number) => (n === 0 ? "sem dica" : n === 1 ? "1 dica" : `${n} dicas`),
    stars: (n: number) => `${n} de 3 estrelas`,
    keys: "Setas ou WASD andam · Espaço ou toque no Bruno espera · Z desfaz · R recomeça · H dica · 1 a 4 trocam de parte · Enter vai para a próxima",
  },
  en: {
    loading: "Turning off the lights…",
    runs: "Parts finished this session",
    noRuns: "No part finished yet.",
    moves: (turns: number, par: number) => `${turns} moves (target ${par})`,
    hints: (n: number) => (n === 0 ? "no hints" : n === 1 ? "1 hint" : `${n} hints`),
    stars: (n: number) => `${n} of 3 stars`,
    keys: "Arrows or WASD move · Space or tapping Bruno waits · Z undoes · R restarts · H hints · 1 to 4 switch parts · Enter goes to the next one",
  },
});

function cssFont(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function pickOrientation(): Orientation {
  return window.innerHeight > window.innerWidth * 1.15 && window.innerWidth < 900 ? "portrait" : "landscape";
}

function loadProgress(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, { stars?: number }>) : {};
    return Object.fromEntries(Object.entries(parsed).map(([id, v]) => [id, Math.max(0, Math.min(3, Number(v?.stars) || 0))]));
  } catch {
    return {};
  }
}

function saveProgress(id: string, turns: number, stars: number) {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, { stars: number; best: number }>) : {};
    const prev = all[id];
    all[id] = { stars: Math.max(prev?.stars ?? 0, stars), best: Math.min(prev?.best ?? Infinity, turns) };
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {}
}

function loadLevel() {
  try {
    const n = Number(window.localStorage.getItem(LEVEL_KEY));
    return Number.isInteger(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function isFormField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || target.isContentEditable;
}

const KEYS: Record<string, Command> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowRight: "right",
  KeyD: "right",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  Space: "wait",
  Period: "wait",
  KeyZ: "undo",
  Backspace: "undo",
  KeyR: "restart",
  KeyH: "hint",
  Enter: "next",
  NumpadEnter: "next",
  Digit1: "level:0",
  Digit2: "level:1",
  Digit3: "level:2",
  Digit4: "level:3",
};

export function PastBedtimePrototype() {
  const locale = useLocale();
  const copy = COPY[locale];
  const night = NIGHT_COPY[locale];
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<PrototypeHandle | null>(null);
  const levelRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [runs, setRuns] = useState<WinReport[]>([]);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const update = () => {
      setOrientation(pickOrientation());
      setTouch(window.matchMedia?.("(pointer: coarse)").matches ?? false);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    setReady(false);
    const bridge: NightBridge = {
      locale,
      fonts: { display: "Arial Black, sans-serif", body: "Trebuchet MS, sans-serif", hand: "Comic Sans MS, cursive" },
      reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
      orientation,
      touch: window.matchMedia?.("(pointer: coarse)").matches ?? false,
      level: levelRef.current || loadLevel(),
      progress: { load: loadProgress, save: saveProgress },
      onLevel: (index) => {
        levelRef.current = index;
        try {
          window.localStorage.setItem(LEVEL_KEY, String(index));
        } catch {}
      },
      onWin: (report) => setRuns((list) => [report, ...list].slice(0, 20)),
    };
    (async () => {
      await document.fonts.ready;
      const fonts = {
        display: cssFont("--font-luckiest", "Arial Black, sans-serif"),
        body: cssFont("--font-baloo", "Trebuchet MS, sans-serif"),
        hand: cssFont("--font-patrick", "Comic Sans MS, cursive"),
      };
      await Promise.all([document.fonts.load(`48px ${fonts.display}`), document.fonts.load(`32px ${fonts.hand}`)]).catch(() => undefined);
      bridge.fonts = fonts;
      const { mountPrototype } = await import("@/games/past-bedtime/prototype");
      if (cancelled) return;
      handleRef.current = mountPrototype(host, bridge);
      setReady(true);
    })();
    const keydown = (e: KeyboardEvent) => {
      if (isFormField(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const cmd = KEYS[e.code];
      if (!cmd) return;
      e.preventDefault();
      if (e.repeat && (cmd === "undo" || cmd === "restart" || cmd.startsWith("level:"))) return;
      handleRef.current?.command(cmd);
    };
    const observer = new ResizeObserver(() => handleRef.current?.refresh());
    observer.observe(host);
    window.addEventListener("keydown", keydown);
    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("keydown", keydown);
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [locale, orientation]);

  const portrait = orientation === "portrait";

  return (
    <div className="mx-auto flex w-full flex-col gap-4 px-3 pb-10 pt-3 [@media(max-height:520px)]:pt-1">
      <div className={portrait ? "mx-auto w-full max-w-[calc((100svh-4rem)*1080/1650)]" : "mx-auto w-full max-w-[calc((100svh-5rem)*16/9)] [@media(max-height:520px)]:max-w-[calc((100svh-1.5rem)*16/9)]"}>
        <div className="relative w-full overflow-hidden rounded-2xl border-[3px] border-ink bg-[#0d0a1c] shadow-[var(--shadow-ink-lg)]" style={{ aspectRatio: portrait ? "1080 / 1650" : "16 / 9" }}>
          <div ref={hostRef} className="absolute inset-0 flow-root touch-none select-none" />
          {!ready && <p className="absolute inset-0 flex items-center justify-center font-display text-2xl text-cream">{copy.loading}</p>}
        </div>
        <p className="mt-3 text-center font-body text-sm font-bold text-cream/90">{touch ? night.touchKeys : copy.keys}</p>
      </div>
      <section className="mx-auto w-full max-w-3xl rounded-2xl border-[3px] border-ink bg-cream p-4 text-ink shadow-[var(--shadow-ink)]">
        <h2 className="font-display text-xl uppercase">{copy.runs}</h2>
        {runs.length === 0 ? (
          <p className="mt-1 font-body text-sm">{copy.noRuns}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {runs.map((run, i) => (
              <li key={`${run.level}-${i}`} className="flex flex-wrap items-baseline gap-x-3 rounded-xl border-2 border-ink bg-cream-2 px-3 py-1.5 font-body text-sm">
                <span className="font-bold">{night.levels[run.level]?.title ?? run.level}</span>
                <span>{copy.moves(run.turns, run.par)}</span>
                <span>{copy.stars(run.stars)}</span>
                <span>{copy.hints(run.hints)}</span>
                <span className={run.replayOk ? "font-bold text-mint-deep" : "font-bold text-tomato-deep"}>{run.replayOk ? night.replayOk : night.replayBad}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
