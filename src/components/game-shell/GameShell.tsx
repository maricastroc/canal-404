"use client";

import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, PauseIcon, QuestionIcon, RestartIcon } from "@/components/art/Icons";
import { SoundToggle } from "@/components/layout/SoundToggle";
import { getAudio } from "@/lib/audio/engine";
import { useSound } from "@/lib/audio/hooks";
import { GAME_LOADERS } from "@/games/loaders";
import { getGame, type LevelMeta } from "@/games/registry";
import type { GameInstance, GameResult, LoadStage } from "@/games/types";
import { ACHIEVEMENTS, type AchievementId } from "@/lib/progress/definitions";
import { useHydrated, useProgress } from "@/lib/progress/hooks";
import { getGameRecord, recordGameResult, recordGameStart, recordLevelResult, unlockAchievement } from "@/lib/progress/store";
import { LoadingScreen, pickTip } from "./LoadingScreen";
import { ErrorPanel, IntroPanel, PausePanel, ResultPanel, type LevelProgress } from "./Panels";

type Stage = "loading" | "intro" | "playing" | "paused" | "result" | "error";

function cssFont(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function computeLevelProgress(levels: LevelMeta[] | undefined, records: Record<string, { stars: number }> | undefined): LevelProgress | undefined {
  if (!levels) return undefined;
  const stars = levels.map((l) => records?.[l.id]?.stars ?? 0);
  const furthest = stars.reduce((acc, st, i) => (st > 0 ? i : acc), -1);
  const unlocked = Math.min(furthest + 1, levels.length - 1);
  const firstOpen = stars.findIndex((st) => st === 0);
  return { stars, unlocked, suggested: firstOpen === -1 ? levels.length - 1 : Math.min(firstOpen, unlocked) };
}

export function GameShell({ slug }: { slug: string }) {
  const game = getGame(slug)!;
  const { play } = useSound();
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<GameInstance | null>(null);
  const stageStateRef = useRef<Stage>("loading");
  const lastAnnounce = useRef(0);
  const [stage, setStageState] = useState<Stage>("loading");
  const setStage = useCallback((next: Stage) => {
    stageStateRef.current = next;
    setStageState(next);
  }, []);
  const [progress, setProgress] = useState(0.04);
  const [leaving, setLeaving] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ result: GameResult; isRecord: boolean; note: string } | null>(null);
  const progressState = useProgress();
  const [highScore, setHighScore] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const hydrated = useHydrated();
  const [tipSeed] = useState(() => Math.floor(Math.random() * 1000));
  const tip = pickTip(hydrated ? tipSeed : 0, game.tips);
  const levelRecords = progressState.games[slug]?.levels;
  const levelProgress = computeLevelProgress(game.levels, hydrated ? levelRecords : undefined);

  useEffect(() => {
    let cancelled = false;
    let instance: GameInstance | null = null;
    const startedAt = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const record = getGameRecord(slug);

    const creep = window.setInterval(() => {
      setProgress((p) => (p < 0.28 ? p + (0.3 - p) * 0.15 : p));
    }, 90);

    const finishLoading = () => {
      if (cancelled) return;
      setProgress(1);
      const elapsed = performance.now() - startedAt;
      const hold = reduced ? 0 : elapsed < 700 ? 260 : 420;
      window.setTimeout(() => {
        if (cancelled) return;
        setLeaving(true);
        setStage("intro");
        window.setTimeout(() => !cancelled && setShowLoader(false), reduced ? 0 : 320);
      }, hold);
    };

    const run = async () => {
      try {
        await document.fonts.ready;
        if (cancelled) return;
        setHighScore(record.highScore);
        const fonts = {
          display: cssFont("--font-luckiest", "Arial Black, sans-serif"),
          body: cssFont("--font-baloo", "Trebuchet MS, sans-serif"),
          hand: cssFont("--font-patrick", "Comic Sans MS, sans-serif"),
        };
        await Promise.all([
          document.fonts.load(`48px ${fonts.display}`),
          document.fonts.load(`700 24px ${fonts.body}`),
        ]).catch(() => undefined);
        const loader = GAME_LOADERS[slug];
        if (!loader) throw new Error("jogo sem carregador");
        const mod = await loader();
        window.clearInterval(creep);
        if (cancelled || !hostRef.current || !stageRef.current) return;
        setProgress(0.32);
        const mapStage = (value: number, stageName: LoadStage) => {
          if (stageName === "art") return 0.32 + value * 0.56;
          if (stageName === "scene") return 0.92;
          return value * 0.3;
        };
        instance = mod.mount({
          parent: hostRef.current,
          keyboardTarget: stageRef.current,
          fonts,
          reducedMotion: Boolean(reduced),
          highScore: record.highScore,
          audio: { play: (recipe, options) => getAudio().play(recipe, options) },
          onProgress: (value, stageName) => {
            if (!cancelled) setProgress((p) => Math.max(p, Math.min(0.95, mapStage(value, stageName))));
          },
          onReady: finishLoading,
          onEvent: (event) => {
            if (cancelled) return;
            switch (event.type) {
              case "score":
                setScore(event.score);
                break;
              case "announce": {
                const now = performance.now();
                const merge = now - lastAnnounce.current < 400;
                lastAnnounce.current = now;
                setAnnouncement((prev) => (merge ? `${prev} ${event.message}` : event.message));
                break;
              }
              case "pause-request":
                if (stageStateRef.current === "playing") {
                  instanceRef.current?.pause();
                  setStage("paused");
                }
                break;
              case "achievement":
                if (ACHIEVEMENTS.some((a) => a.id === event.id)) unlockAchievement(event.id as AchievementId);
                break;
              case "finished": {
                const r = event.result;
                let isRecord: boolean;
                let note: string;
                const word = getGame(slug)?.levelWord ?? "fase";
                if (r.level) {
                  const saved = recordLevelResult(slug, r.level.id, r);
                  isRecord = saved.isRecord && saved.previous.stars > 0;
                  const best = saved.record.levels?.[r.level.id];
                  note = r.won
                    ? saved.previous.stars === 0
                      ? `${word === "arena" ? "Arena vencida" : "Fase concluída"} pela primeira vez neste computador.`
                      : `Seu melhor nesta ${word}: ${best?.stars ?? r.stars} ${best?.stars === 1 ? "estrela" : "estrelas"}.`
                    : "";
                  setHighScore(saved.record.highScore);
                } else {
                  const saved = recordGameResult(slug, r);
                  isRecord = saved.isRecord;
                  note = saved.isRecord
                    ? saved.previousBest > 0
                      ? `Seu recorde anterior era ${saved.previousBest.toLocaleString("pt-BR")}.`
                      : "Primeiro recorde registrado neste computador."
                    : `Recorde atual: ${saved.record.highScore.toLocaleString("pt-BR")}.`;
                  setHighScore(saved.record.highScore);
                  instanceRef.current?.setHighScore(saved.record.highScore);
                }
                r.achievements?.forEach((id) => {
                  if (ACHIEVEMENTS.some((a) => a.id === id)) unlockAchievement(id as AchievementId);
                });
                setResult({ result: r, isRecord, note });
                const levelText = r.level ? `${word === "arena" ? "Arena" : "Fase"} ${r.level.index + 1}, ${r.level.title}: ` : "";
                setAnnouncement(
                  r.won
                    ? `${levelText}vitória! ${r.score} pontos, ${r.stars} estrelas.${isRecord ? " Melhor resultado!" : ""}`
                    : `${levelText}fim de jogo. ${r.score} pontos.`,
                );
                setStage("result");
                break;
              }
              default:
                break;
            }
          },
        });
        instanceRef.current = instance;
      } catch {
        window.clearInterval(creep);
        if (!cancelled) {
          setStage("error");
          setShowLoader(false);
        }
      }
    };
    void run();

    return () => {
      cancelled = true;
      window.clearInterval(creep);
      instance?.destroy();
      instanceRef.current = null;
    };
  }, [slug, attempt, setStage]);

  useEffect(() => {
    const audio = getAudio();
    audio.duckMusic(0.35);
    return () => audio.duckMusic(1);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && stageStateRef.current === "playing") {
        instanceRef.current?.pause();
        setStage("paused");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [setStage]);

  useEffect(() => {
    if (stage !== "paused") return;
    const since = performance.now();
    const onKey = (event: KeyboardEvent) => {
      if (event.timeStamp < since || event.repeat) return;
      if (event.key === "Escape" || event.key.toLowerCase() === "p") {
        event.preventDefault();
        instanceRef.current?.resume();
        setStage("playing");
        window.setTimeout(() => stageRef.current?.focus(), 30);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, setStage]);

  const focusGame = () => window.setTimeout(() => stageRef.current?.focus(), 40);

  const start = (level?: number, next = false) => {
    play("confirm");
    recordGameStart(slug);
    setScore(0);
    setResult(null);
    instanceRef.current?.start(level === undefined ? undefined : next ? { level, next } : { level });
    setStage("playing");
    focusGame();
  };

  const pause = () => {
    if (stage !== "playing") return;
    play("click");
    instanceRef.current?.pause();
    setStage("paused");
  };

  const resume = () => {
    play("confirm");
    instanceRef.current?.resume();
    setStage("playing");
    focusGame();
  };

  const restart = () => {
    play("confirm");
    recordGameStart(slug);
    setResult(null);
    setScore(0);
    instanceRef.current?.restart();
    setStage("playing");
    focusGame();
  };

  const alt = () => {
    play("confirm");
    recordGameStart(slug);
    setResult(null);
    setScore(0);
    instanceRef.current?.alt?.();
    setStage("playing");
    focusGame();
  };

  const canControl = stage === "playing" || stage === "paused";

  return (
    <div className="on-dark flex h-dvh flex-col bg-plum-900" style={{ backgroundImage: "var(--dots-dark)", backgroundSize: "18px 18px" }}>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b-[3px] border-ink bg-plum-800 px-2 sm:gap-3 sm:px-4">
        <Link
          href={`/games/${slug}`}
          onClick={() => play("back")}
          className="press flex min-h-10 items-center gap-1.5 rounded-lg border-[3px] border-ink bg-cream px-2.5 font-display text-sm uppercase tracking-wide text-ink shadow-[var(--shadow-ink-sm)]"
        >
          <ArrowLeftIcon className="size-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Link>
        <p className="truncate font-display text-lg uppercase tracking-wide text-sun sm:text-2xl">{game.title}</p>
        <p className="ml-auto hidden rounded-lg border-[3px] border-ink bg-plum-950 px-3 py-0.5 font-display text-sm tabular-nums text-cream sm:block" aria-hidden>
          {score.toLocaleString("pt-BR")} pts
        </p>
        <button
          type="button"
          onClick={() => {
            if (stage === "playing") pause();
            setShowHelp(true);
          }}
          disabled={!canControl}
          aria-label="Como jogar"
          className="press ml-auto grid size-10 place-items-center rounded-lg border-[3px] border-ink bg-cream shadow-[var(--shadow-ink-sm)] disabled:opacity-40 sm:ml-0"
        >
          <QuestionIcon className="size-6" />
        </button>
        <button
          type="button"
          onClick={restart}
          disabled={!canControl}
          aria-label="Recomeçar partida"
          className="press grid size-10 place-items-center rounded-lg border-[3px] border-ink bg-mint shadow-[var(--shadow-ink-sm)] disabled:opacity-40"
        >
          <RestartIcon className="size-6" />
        </button>
        <button
          type="button"
          onClick={stage === "paused" ? resume : pause}
          disabled={!canControl}
          aria-label={stage === "paused" ? "Continuar" : "Pausar"}
          className="press grid size-10 place-items-center rounded-lg border-[3px] border-ink bg-sun text-ink shadow-[var(--shadow-ink-sm)] disabled:opacity-40"
        >
          <PauseIcon className="size-6" />
        </button>
        <SoundToggle compact />
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={stageRef}
          tabIndex={0}
          role="application"
          aria-roledescription="jogo"
          aria-label={game.controlsSummary ?? game.title}
          className="absolute inset-0 touch-none select-none outline-none focus-visible:outline-none [&:focus-visible_canvas]:outline-4 [&:focus-visible_canvas]:outline-offset-2 [&:focus-visible_canvas]:outline-sun"
        >
          <div ref={hostRef} className="h-full w-full [&_canvas]:rounded-xl [&_canvas]:border-[3px] [&_canvas]:border-ink" />
        </div>

        <AnimatePresence>
          {stage === "intro" && (
            <IntroPanel
              key="intro"
              game={game}
              highScore={highScore}
              levels={levelProgress}
              showHelp={showHelp}
              onToggleHelp={() => setShowHelp((v) => !v)}
              onPlay={start}
            />
          )}
          {stage === "paused" && (
            <PausePanel
              key="pause"
              game={game}
              onResume={resume}
              onRestart={restart}
              showHelp={showHelp}
              onToggleHelp={() => setShowHelp((v) => !v)}
            />
          )}
          {stage === "result" && result && (
            <ResultPanel
              key="result"
              game={game}
              result={result.result}
              isRecord={result.isRecord}
              recordNote={result.note}
              onRestart={restart}
              onNext={
                result.result.level && result.result.won && result.result.level.index + 1 < result.result.level.total
                  ? () => start(result.result.level!.index + 1, true)
                  : undefined
              }
              onAlt={result.result.alt ? alt : undefined}
              onLevels={game.levels ? () => setStage("intro") : undefined}
            />
          )}
          {stage === "error" && (
            <ErrorPanel
              key="error"
              onRetry={() => {
                setProgress(0.04);
                setLeaving(false);
                setShowLoader(true);
                setStage("loading");
                setAttempt((a) => a + 1);
              }}
            />
          )}
        </AnimatePresence>

        {showLoader && <LoadingScreen progress={progress} tip={tip} leaving={leaving} />}

        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex justify-center px-3 landscape:hidden sm:hidden">
          {stage === "playing" && (
            <p className="rounded-full border-[3px] border-ink bg-sun px-3 py-1 font-display text-xs uppercase tracking-wide text-ink shadow-[var(--shadow-ink-sm)]">
              Dica: gire o celular para ver maior
            </p>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
