"use client";

import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeftIcon, MissionIcon, PauseIcon, QuestionIcon, RestartIcon } from "@/components/art/Icons";
import { SoundToggle } from "@/components/layout/SoundToggle";
import { getAudio } from "@/lib/audio/engine";
import { useSound } from "@/lib/audio/hooks";
import { GAME_LOADERS } from "@/games/loaders";
import { getGame } from "@/games/registry";
import type { GameInstance, GameResult, LoadStage } from "@/games/types";
import { connect, getCompetition, join, requestTicket, submitResult, type SubmitOutcome, type TicketGrant } from "@/lib/competition/client";
import { isDayKey } from "@/lib/missions/calendar";
import { loadMission } from "@/lib/missions/client";
import { useMissionToday } from "@/lib/missions/hooks";
import type { MissionView } from "@/lib/missions/types";
import { ACHIEVEMENTS, type AchievementId } from "@/lib/progress/definitions";
import { useHydrated, useProgress } from "@/lib/progress/hooks";
import { getGameRecord, recordGameResult, recordGameStart, recordLevelResult, unlockAchievement } from "@/lib/progress/store";
import { errorMessage, isStaleChunkError, track } from "@/lib/telemetry";
import { computeLevelProgress } from "./levelProgress";
import { LoadingScreen, pickTip } from "./LoadingScreen";
import { useAnnouncer } from "./useAnnouncer";
import type { BoardState } from "./BoardLine";
import { ErrorPanel, IntroPanel, PausePanel, ResultPanel } from "./Panels";

type Stage = "loading" | "intro" | "playing" | "paused" | "result" | "error";

type PendingRun = { ticket: Promise<TicketGrant | null> | null; result: GameResult };

const noopSubscribe = () => () => {};

function missionParam() {
  const day = new URLSearchParams(window.location.search).get("mission");
  return isDayKey(day) ? day : "";
}

function submitLabel(outcome: SubmitOutcome) {
  if (outcome.kind === "accepted") {
    if (!outcome.response.run.eligible) return "ineligible" as const;
    return outcome.response.board?.improved ? ("record" as const) : ("accepted" as const);
  }
  if (outcome.kind === "not-joined") return "not_joined" as const;
  return outcome.kind;
}

function cssFont(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

export function GameShell({ slug }: { slug: string }) {
  const game = getGame(slug)!;
  const { play } = useSound();
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<GameInstance | null>(null);
  const stageStateRef = useRef<Stage>("loading");
  const [stage, setStageState] = useState<Stage>("loading");
  const setStage = useCallback((next: Stage) => {
    stageStateRef.current = next;
    setStageState(next);
  }, []);
  const [progress, setProgress] = useState(0.04);
  const [leaving, setLeaving] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const { regions, announce } = useAnnouncer();
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ result: GameResult; isRecord: boolean; note: string; mission: MissionView | null } | null>(null);
  const progressState = useProgress();
  const [highScore, setHighScore] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const runRef = useRef<{ level: string; attempt: number; startedAt: number; ticket: Promise<TicketGrant | null> | null; mission: MissionView | null } | null>(null);
  const requestedMission = useSyncExternalStore(noopSubscribe, missionParam, () => "");
  const [skippedMission, setSkippedMission] = useState(false);
  const missionWanted = Boolean(requestedMission) && !skippedMission;
  const missionFeed = useMissionToday(missionWanted);
  const todayMission = missionWanted ? (missionFeed.data?.mission ?? null) : null;
  const activeMission = todayMission && todayMission.day === requestedMission && todayMission.game === slug ? todayMission : null;
  const missionPending = missionWanted && !todayMission && missionFeed.status === "loading";
  const missionNotice = !missionWanted
    ? null
    : todayMission && !activeMission
      ? todayMission.day !== requestedMission
        ? "Essa missão já saiu do ar. A missão de hoje está na página da Missão 404."
        : "A missão de hoje é em outro jogo."
      : !todayMission && !missionPending
        ? "Sem sinal da missão agora. Dá para jogar normalmente, mas a partida não conta para a missão."
        : null;
  const [missionRun, setMissionRun] = useState<MissionView | null>(null);
  const skipMission = useCallback(() => {
    play("click");
    setSkippedMission(true);
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, [play]);
  const [board, setBoard] = useState<BoardState | null>(null);
  const boardSeqRef = useRef(0);
  const pendingRef = useRef<PendingRun | null>(null);
  const attemptsRef = useRef(new Map<string, number>());
  const lastLevelRef = useRef("-");
  const loadErrorRef = useRef<unknown>(null);
  const hydrated = useHydrated();
  const [tipSeed] = useState(() => Math.floor(Math.random() * 1000));
  const tip = pickTip(hydrated ? tipSeed : 0, game.tips);
  const levelRecords = progressState.games[slug]?.levels;
  const levelProgress = computeLevelProgress(game.levels, hydrated ? levelRecords : undefined);

  const sendToBoard = useCallback(
    (pending: PendingRun) => {
      const competition = getCompetition();
      if (!pending.result.stats || competition.status === "unconfigured") {
        setBoard(null);
        return;
      }
      const seq = boardSeqRef.current;
      if (competition.status === "online" && !competition.player) {
        pendingRef.current = pending;
        setBoard({ phase: "join" });
        track({ name: "board_submit", game: slug, outcome: "not_joined" });
        return;
      }
      setBoard({ phase: "sending" });
      void submitResult(pending.ticket, pending.result).then((outcome) => {
        if (boardSeqRef.current !== seq) return;
        track({ name: "board_submit", game: slug, outcome: submitLabel(outcome) });
        if (outcome.kind === "not-joined") {
          pendingRef.current = pending;
          setBoard({ phase: "join" });
          return;
        }
        if (outcome.kind === "unranked" && outcome.why === "unconfigured") {
          setBoard(null);
          return;
        }
        if (outcome.kind === "accepted" && (outcome.response.board?.improved || outcome.response.mission?.firstTime)) play("achievement");
        if (outcome.kind === "accepted" && outcome.response.mission) void loadMission(getCompetition().player?.id ?? null, true);
        setBoard({ phase: "done", outcome });
      });
    },
    [slug, play, setBoard],
  );

  const joinBoard = useCallback(
    async (nickname: string) => {
      const outcome = await join(nickname);
      const pending = pendingRef.current;
      if (outcome.ok && pending) {
        pendingRef.current = null;
        sendToBoard(pending);
      }
      return outcome;
    },
    [sendToBoard],
  );

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
          round: cssFont("--font-fredoka", "Trebuchet MS, sans-serif"),
        };
        await Promise.all([
          document.fonts.load(`48px ${fonts.display}`),
          document.fonts.load(`700 24px ${fonts.body}`),
          document.fonts.load(`600 32px ${fonts.round}`),
          document.fonts.load(`700 32px ${fonts.round}`),
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
              case "announce":
                announce(event.message, { transient: event.transient, fresh: event.fresh });
                break;
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
                const run = runRef.current;
                runRef.current = null;
                track({
                  name: "game_finish",
                  game: slug,
                  level: r.level?.id ?? run?.level ?? "-",
                  attempt: run?.attempt ?? 1,
                  won: r.won,
                  score: r.score,
                  stars: r.stars,
                  seconds: run ? (performance.now() - run.startedAt) / 1000 : 0,
                });
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
                sendToBoard({ ticket: run?.ticket ?? null, result: r });
                setResult({ result: r, isRecord, note, mission: run?.mission ?? null });
                const levelText = r.level ? `${word === "arena" ? "Arena" : "Fase"} ${r.level.index + 1}, ${r.level.title}: ` : "";
                announce(
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
      } catch (error) {
        window.clearInterval(creep);
        console.error(error);
        loadErrorRef.current = error;
        track({ name: "game_load_error", game: slug, message: errorMessage(error) });
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
  }, [slug, attempt, setStage, announce, sendToBoard]);

  useEffect(() => {
    const audio = getAudio();
    audio.duckMusic(0.35);
    return () => audio.duckMusic(1);
  }, []);

  useEffect(() => {
    void connect();
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

  const abandonRun = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    runRef.current = null;
    track({
      name: "game_abandon",
      game: slug,
      level: run.level,
      attempt: run.attempt,
      seconds: (performance.now() - run.startedAt) / 1000,
      paused: stageStateRef.current === "paused",
    });
  }, [slug]);

  useEffect(() => {
    window.addEventListener("pagehide", abandonRun);
    return () => {
      window.removeEventListener("pagehide", abandonRun);
      abandonRun();
    };
  }, [abandonRun]);

  const beginRun = (level: string, fresh: boolean) => {
    abandonRun();
    lastLevelRef.current = level;
    const n = (attemptsRef.current.get(level) ?? 0) + 1;
    attemptsRef.current.set(level, n);
    const mission = activeMission && (activeMission.level ?? "-") === level ? activeMission : null;
    const ticket = getCompetition().status === "unconfigured" ? null : requestTicket(slug, game.levels ? level : null, mission?.day ?? null);
    runRef.current = { level, attempt: n, startedAt: performance.now(), ticket, mission };
    setMissionRun(mission);
    boardSeqRef.current += 1;
    pendingRef.current = null;
    setBoard(null);
    track({ name: "game_start", game: slug, level, attempt: n, fresh });
  };

  const start = (level?: number, next = false, fresh = false) => {
    play("confirm");
    recordGameStart(slug);
    beginRun(game.levels ? (game.levels[level ?? 0]?.id ?? String(level ?? 0)) : "-", fresh);
    setScore(0);
    setResult(null);
    instanceRef.current?.start(fresh ? { fresh } : level === undefined ? undefined : next ? { level, next } : { level });
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
    beginRun(lastLevelRef.current, false);
    setResult(null);
    setScore(0);
    instanceRef.current?.restart();
    setStage("playing");
    focusGame();
  };

  const alt = () => {
    play("confirm");
    recordGameStart(slug);
    beginRun(lastLevelRef.current, false);
    setResult(null);
    setScore(0);
    instanceRef.current?.alt?.();
    setStage("playing");
    focusGame();
  };

  const canControl = stage === "playing" || stage === "paused";

  const startMission = () => {
    const index = activeMission?.level && game.levels ? game.levels.findIndex((l) => l.id === activeMission.level) : -1;
    start(index >= 0 ? index : undefined);
  };

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
        {missionRun && canControl ? (
          <p className="hidden min-w-0 items-center gap-1.5 rounded-lg border-[3px] border-ink bg-lime px-2 py-0.5 font-display text-xs uppercase tracking-wide text-ink md:flex">
            <MissionIcon className="size-4" />
            <span className="truncate">Missão: {missionRun.title}</span>
          </p>
        ) : null}
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
        {game.resumable ? null : (
          <button
            type="button"
            onClick={restart}
            disabled={!canControl}
            aria-label="Recomeçar partida"
            className="press grid size-10 place-items-center rounded-lg border-[3px] border-ink bg-mint shadow-[var(--shadow-ink-sm)] disabled:opacity-40"
          >
            <RestartIcon className="size-6" />
          </button>
        )}
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
              onNew={game.resumable ? () => start(undefined, false, true) : undefined}
              mission={activeMission ? { view: activeMission, state: missionFeed.data?.you?.state ?? null } : null}
              missionPending={missionPending}
              onStartMission={startMission}
              onSkipMission={skipMission}
              missionNotice={missionNotice}
            />
          )}
          {stage === "paused" && (
            <PausePanel
              key="pause"
              game={game}
              onResume={resume}
              onRestart={game.resumable ? undefined : restart}
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
              board={board}
              mission={result.mission}
              onJoin={joinBoard}
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
                if (isStaleChunkError(loadErrorRef.current)) {
                  window.location.reload();
                  return;
                }
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
      <div className="sr-only" data-testid="game-announcer">
        <p aria-live="polite" aria-atomic="true">
          {regions[0]}
        </p>
        <p aria-live="polite" aria-atomic="true">
          {regions[1]}
        </p>
      </div>
    </div>
  );
}
