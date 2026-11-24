"use client";

import { AnimatePresence } from "motion/react";
import Link from "@/i18n/Link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeftIcon, MissionIcon, PauseIcon, PhoneIcon, QuestionIcon, RestartIcon } from "@/components/art/Icons";
import { SoundToggle } from "@/components/layout/SoundToggle";
import { getAudio } from "@/lib/audio/engine";
import { useSound } from "@/lib/audio/hooks";
import { useTouchScreen } from "@/lib/device";
import { GAME_LOADERS } from "@/games/loaders";
import { getGame, type GameMeta } from "@/games/registry";
import type { GameInstance, GameResult, IntroProgress, LoadStage, StartOptions } from "@/games/types";
import { useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { countOf, formatNumber } from "@/i18n/format";
import { connect, getCompetition, holdUntilJoined, join, pendingCount, requestTicket, submitResult, type SubmitOutcome, type TicketGrant } from "@/lib/competition/client";
import { scheduleCloudCopy } from "@/lib/competition/cloud-copy";
import { useCloudCopyOnLeave } from "@/lib/competition/hooks";
import { isDayKey } from "@/lib/missions/calendar";
import { loadMission } from "@/lib/missions/client";
import { useMissionToday } from "@/lib/missions/hooks";
import { announceAchievements } from "@/lib/missions/seen";
import { missionText } from "@/lib/missions/text";
import type { MissionView } from "@/lib/missions/types";
import { ACHIEVEMENTS, type AchievementId } from "@/lib/progress/definitions";
import { useHydrated, useProgress } from "@/lib/progress/hooks";
import { getGameRecord, recordGameResult, recordGameStart, recordLevelResult, unlockAchievement } from "@/lib/progress/store";
import { isStaleChunkError, reportLoadError, track } from "@/lib/telemetry";
import { computeLevelProgress } from "./levelProgress";
import { LoadingScreen, pickTip } from "./LoadingScreen";
import { useAnnouncer } from "./useAnnouncer";
import type { BoardState } from "./BoardLine";
import { HeaderToast, useHeaderToast } from "./HeaderToast";
import { ErrorPanel, IntroPanel, PausePanel, ResultPanel } from "./Panels";

type Stage = "loading" | "intro" | "playing" | "paused" | "result" | "error";

type LevelWord = NonNullable<GameMeta["levelWord"]>;

const LEVEL: Record<LevelWord, { word: string; Word: string }> = { fase: { word: "level", Word: "Level" }, arena: { word: "arena", Word: "Arena" }, pista: { word: "track", Word: "Track" }, parte: { word: "part", Word: "Part" }, música: { word: "song", Word: "Song" } };

const COPY = localized({
  "pt-BR": {
    missionGone: "Essa missão já saiu do ar. A missão de hoje está na página da Missão 404.",
    missionElsewhere: "A missão de hoje é em outro jogo.",
    missionNoSignal: "Sem sinal da missão agora. Dá para jogar normalmente, mas a partida não conta para a missão.",
    firstWinUnlocked: (word: LevelWord, next: number) => `Primeira vitória nesta ${word}. ${word[0].toUpperCase() + word.slice(1)} ${next} liberada!`,
    firstWin: (word: LevelWord) => `Primeira vitória nesta ${word}.`,
    beatStars: (stars: number) => `Antes, seu melhor aqui era ${stars} ${stars === 1 ? "estrela" : "estrelas"}.`,
    sameStars: (stars: number) => `Mesmas ${stars} ${stars === 1 ? "estrela" : "estrelas"} de antes, com mais pontos.`,
    keptStars: (word: LevelWord, stars: number) => `Seu melhor nesta ${word} continua sendo ${stars} ${stars === 1 ? "estrela" : "estrelas"}.`,
    previousRecord: (score: number) => `Seu recorde anterior era ${formatNumber(score, "pt-BR")}.`,
    firstRecord: "Primeira partida registrada. Esse é o recorde a bater.",
    recordStands: (score: number) => `Seu recorde continua ${formatNumber(score, "pt-BR")}.`,
    levelPrefix: (word: LevelWord, n: number, title: string) => `${word[0].toUpperCase() + word.slice(1)} ${n}, ${title}: `,
    announceWin: (prefix: string, score: number, stars: number, best: boolean) => `${prefix}vitória! ${score} pontos, ${stars} estrelas.${best ? " Melhor resultado!" : ""}`,
    announceLose: (prefix: string, score: number) => `${prefix}fim de jogo. ${score} pontos.`,
    back: "Voltar",
    mission: (title: string) => `Missão: ${title}`,
    points: (score: number) => `${formatNumber(score, "pt-BR")} pts`,
    howTo: "Como jogar",
    restart: "Recomeçar partida",
    resume: "Continuar",
    pause: "Pausar",
    game: "jogo",
    upright: "Segure o celular em pé",
    uprightText: (title: string) => `${title} se joga com o celular na vertical.`,
  },
  en: {
    missionGone: "That mission is already off the air. Today's mission is on the Mission 404 page.",
    missionElsewhere: "Today's mission is in another game.",
    missionNoSignal: "No signal from the mission right now. You can play as usual, but this round won't count for the mission.",
    firstWinUnlocked: (word: LevelWord, next: number) => `First win in this ${LEVEL[word].word}. ${LEVEL[word].Word} ${next} unlocked!`,
    firstWin: (word: LevelWord) => `First win in this ${LEVEL[word].word}.`,
    beatStars: (stars: number) => `Your best here used to be ${countOf(stars, ["star", "stars"], "en")}.`,
    sameStars: (stars: number) => `Same ${countOf(stars, ["star", "stars"], "en")} as before, with more points.`,
    keptStars: (word: LevelWord, stars: number) => `Your best in this ${LEVEL[word].word} is still ${countOf(stars, ["star", "stars"], "en")}.`,
    previousRecord: (score: number) => `Your previous record was ${formatNumber(score, "en")}.`,
    firstRecord: "First game on the books. That's the record to beat.",
    recordStands: (score: number) => `Your record is still ${formatNumber(score, "en")}.`,
    levelPrefix: (word: LevelWord, n: number, title: string) => `${LEVEL[word].Word} ${n}, ${title}: `,
    announceWin: (prefix: string, score: number, stars: number, best: boolean) => `${prefix}You win! ${countOf(score, ["point", "points"], "en")}, ${countOf(stars, ["star", "stars"], "en")}.${best ? " Best result!" : ""}`,
    announceLose: (prefix: string, score: number) => `${prefix}Game over. ${countOf(score, ["point", "points"], "en")}.`,
    back: "Back",
    mission: (title: string) => `Mission: ${title}`,
    points: (score: number) => `${formatNumber(score, "en")} pts`,
    howTo: "How to play",
    restart: "Restart game",
    resume: "Resume",
    pause: "Pause",
    game: "game",
    upright: "Hold your phone upright",
    uprightText: (title: string) => `${title} is played with your phone held upright.`,
  },
});

type PendingRun = { ticket: Promise<TicketGrant | null> | null; result: GameResult };

const noopSubscribe = () => () => {};

const PHONE_SIDEWAYS = "(orientation: landscape) and (pointer: coarse) and (max-height: 500px)";

function subscribeSideways(onChange: () => void) {
  const media = window.matchMedia(PHONE_SIDEWAYS);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function phoneSideways() {
  return window.matchMedia(PHONE_SIDEWAYS).matches;
}

const never = () => false;

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
  const locale = useLocale();
  const copy = COPY[locale];
  const game = getGame(slug, locale)!;
  useCloudCopyOnLeave();
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
  const [introProgress, setIntroProgress] = useState<IntroProgress | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const { regions, announce, afterFocus } = useAnnouncer();
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ result: GameResult; isRecord: boolean; note: string; mission: MissionView | null } | null>(null);
  const progressState = useProgress();
  const [highScore, setHighScore] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const runRef = useRef<{ level: string; attempt: number; startedAt: number; ticket: Promise<TicketGrant | null> | null; mission: MissionView | null } | null>(null);
  const requestedMission = useSyncExternalStore(noopSubscribe, missionParam, () => "");
  const upright = game.orientation === "upright";
  const sideways = useSyncExternalStore(upright ? subscribeSideways : noopSubscribe, upright ? phoneSideways : never, never);
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
        ? copy.missionGone
        : copy.missionElsewhere
      : !todayMission && !missionPending
        ? copy.missionNoSignal
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
  const touchScreen = useTouchScreen();
  const headerToast = useHeaderToast();
  const deviceTips = touchScreen ? game.touchTips : game.keyTips;
  const tip = pickTip(hydrated ? tipSeed : 0, game.tips && deviceTips ? [...game.tips, ...deviceTips] : game.tips, locale);
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
        setBoard({ phase: "join", waiting: pendingCount() });
        track({ name: "board_submit", game: slug, outcome: "not_joined" });
        return;
      }
      setBoard({ phase: "sending" });
      void submitResult(pending.ticket, pending.result).then((outcome) => {
        if (boardSeqRef.current !== seq) return;
        track({ name: "board_submit", game: slug, outcome: submitLabel(outcome) });
        if (outcome.kind === "not-joined") {
          pendingRef.current = pending;
          setBoard({ phase: "join", waiting: pendingCount() });
          return;
        }
        if (outcome.kind === "unranked" && outcome.why === "unconfigured") {
          setBoard(null);
          return;
        }
        if (outcome.kind === "accepted" && (outcome.response.board?.improved || outcome.response.mission?.firstTime)) play("achievement");
        if (outcome.kind === "accepted" && outcome.response.mission) {
          const playerId = getCompetition().player?.id ?? null;
          if (playerId) announceAchievements(playerId, outcome.response.mission.achievements);
          void loadMission(playerId, true);
        }
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
      if (outcome.ok) scheduleCloudCopy();
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
        setIntroProgress(instanceRef.current?.progress?.() ?? null);
        setStage("intro");
        window.setTimeout(() => !cancelled && setShowLoader(false), reduced ? 0 : 320);
      }, hold);
    };

    const fail = (error: unknown, loading: boolean) => {
      if (cancelled || stageStateRef.current === "result" || stageStateRef.current === "error") return;
      cancelled = true;
      window.clearInterval(creep);
      const broken = instance;
      instance = null;
      instanceRef.current = null;
      try {
        broken?.destroy();
      } catch {}
      hostRef.current?.replaceChildren();
      loadErrorRef.current = error;
      if (loading) reportLoadError(slug, error);
      setStage("error");
      setShowLoader(false);
    };

    const onCrash = (event: ErrorEvent) => {
      if (event.message === "Script error." || /^[a-z-]+-extension:/.test(event.filename ?? "")) return;
      fail(event.error ?? new Error(event.message), false);
    };
    window.addEventListener("error", onCrash);

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
          locale,
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
          onError: (error) => fail(error, true),
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
                const text = COPY[locale];
                const meta = getGame(slug, locale);
                const word = meta?.levelWord ?? "fase";
                if (r.level) {
                  const saved = recordLevelResult(slug, r.level.id, r);
                  isRecord = saved.isRecord && saved.previous.stars > 0;
                  const best = saved.record.levels?.[r.level.id]?.stars ?? r.stars;
                  note = !r.won
                    ? ""
                    : saved.previous.stars === 0
                      ? r.level.index + 1 < r.level.total && !meta?.levels?.slice(r.level.index + 1).some((l) => (saved.record.levels?.[l.id]?.stars ?? 0) > 0)
                        ? text.firstWinUnlocked(word, r.level.index + 2)
                        : text.firstWin(word)
                      : r.stars > saved.previous.stars
                        ? text.beatStars(saved.previous.stars)
                        : isRecord
                          ? text.sameStars(r.stars)
                          : best > r.stars
                            ? text.keptStars(word, best)
                            : "";
                  setHighScore(saved.record.highScore);
                } else {
                  const saved = recordGameResult(slug, r);
                  isRecord = saved.isRecord && saved.previousBest > 0;
                  note = saved.isRecord
                    ? saved.previousBest > 0
                      ? text.previousRecord(saved.previousBest)
                      : text.firstRecord
                    : text.recordStands(saved.record.highScore);
                  setHighScore(saved.record.highScore);
                  instanceRef.current?.setHighScore(saved.record.highScore);
                }
                r.achievements?.forEach((id) => {
                  if (ACHIEVEMENTS.some((a) => a.id === id)) unlockAchievement(id as AchievementId);
                });
                sendToBoard({ ticket: run?.ticket ?? null, result: r });
                scheduleCloudCopy();
                setResult({ result: r, isRecord, note, mission: run?.mission ?? null });
                const levelText = r.level ? text.levelPrefix(word, r.level.index + 1, r.level.title) : "";
                announce(r.won ? text.announceWin(levelText, r.score, r.stars, isRecord) : text.announceLose(levelText, r.score));
                setStage("result");
                break;
              }
              default:
                break;
            }
          },
        });
        if (cancelled) {
          instance.destroy();
          instance = null;
          return;
        }
        instanceRef.current = instance;
      } catch (error) {
        window.clearInterval(creep);
        console.error(error);
        loadErrorRef.current = error;
        reportLoadError(slug, error);
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
      window.removeEventListener("error", onCrash);
      instance?.destroy();
      instanceRef.current = null;
    };
  }, [slug, attempt, setStage, announce, sendToBoard, locale]);

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
    if (!upright) return;
    const media = window.matchMedia(PHONE_SIDEWAYS);
    const onChange = () => {
      if (media.matches && stageStateRef.current === "playing") {
        instanceRef.current?.pause();
        setStage("paused");
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [upright, setStage]);

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

  const holdPending = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) void holdUntilJoined(pending.ticket, pending.result);
  }, []);

  useEffect(() => {
    window.addEventListener("pagehide", holdPending);
    return () => {
      window.removeEventListener("pagehide", holdPending);
      holdPending();
    };
  }, [holdPending]);

  const beginRun = (level: string, fresh: boolean) => {
    abandonRun();
    holdPending();
    lastLevelRef.current = level;
    const n = (attemptsRef.current.get(level) ?? 0) + 1;
    attemptsRef.current.set(level, n);
    const mission = activeMission && (activeMission.level ?? "-") === level ? activeMission : null;
    const ticket = getCompetition().status === "unconfigured" ? null : requestTicket(slug, game.levels ? level : null, mission?.day ?? null);
    runRef.current = { level, attempt: n, startedAt: performance.now(), ticket, mission };
    setMissionRun(mission);
    boardSeqRef.current += 1;
    setBoard(null);
    track({ name: "game_start", game: slug, level, attempt: n, fresh });
    return mission;
  };

  const start = (level?: number, next = false, fresh = false) => {
    play("confirm");
    recordGameStart(slug);
    const mission = beginRun(game.levels ? (game.levels[level ?? 0]?.id ?? String(level ?? 0)) : "-", fresh);
    setScore(0);
    setResult(null);
    const options: StartOptions = fresh
      ? { fresh }
      : {
          ...(level === undefined ? {} : { level, ...(next ? { next } : {}) }),
          ...(mission?.setup ? { setup: mission.setup } : {}),
          ...(mission ? { checkpoints: false } : {}),
          ...(game.levels ? { records: game.levels.map((l) => ({ stars: levelRecords?.[l.id]?.stars ?? 0, score: levelRecords?.[l.id]?.score ?? 0 })) } : {}),
        };
    instanceRef.current?.start(Object.keys(options).length ? options : undefined);
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
    <div onFocus={afterFocus} className="on-dark flex h-dvh flex-col bg-plum-900" style={{ backgroundImage: "var(--dots-dark)", backgroundSize: "18px 18px" }}>
      <header className="flex h-14 shrink-0 items-center gap-1.5 border-b-[3px] border-ink bg-plum-800 safe-inline [--pad-inline:0.5rem] max-[359px]:gap-1 max-[359px]:[--pad-inline:0.375rem] sm:gap-3 sm:[--pad-inline:1rem]">
        <Link
          href={`/games/${slug}`}
          onClick={() => play("back")}
          className="press flex min-h-10 items-center gap-1.5 rounded-lg border-[3px] border-ink bg-cream px-2.5 font-display text-sm uppercase tracking-wide text-ink shadow-[var(--shadow-ink-sm)]"
        >
          <ArrowLeftIcon className="size-4" />
          <span className="hidden sm:inline">{copy.back}</span>
        </Link>
        <div className="relative min-w-0 flex-1 self-stretch sm:flex-initial sm:self-auto">
          <p className={`line-clamp-2 flex h-full items-center font-display text-[15px] uppercase leading-[1.05] text-sun max-[359px]:text-[13px] sm:line-clamp-1 sm:block sm:h-auto sm:text-2xl sm:leading-normal sm:tracking-wide ${headerToast ? "max-sm:invisible" : ""}`}>{game.title}</p>
          <HeaderToast />
        </div>
        {missionRun && canControl ? (
          <p className="hidden min-w-0 items-center gap-1.5 rounded-lg border-[3px] border-ink bg-lime px-2 py-0.5 font-display text-xs uppercase tracking-wide text-ink md:flex">
            <MissionIcon className="size-4" />
            <span className="truncate">{copy.mission(missionText(missionRun, locale).title)}</span>
          </p>
        ) : null}
        <p className="ml-auto hidden shrink-0 whitespace-nowrap rounded-lg border-[3px] border-ink bg-plum-950 px-3 py-0.5 font-display text-sm tabular-nums text-cream sm:block" aria-hidden>
          {copy.points(score)}
        </p>
        <button
          type="button"
          onClick={() => {
            if (stage === "playing") pause();
            setShowHelp(true);
          }}
          disabled={!canControl}
          aria-label={copy.howTo}
          className={`press ml-auto grid size-10 place-items-center rounded-lg border-[3px] border-ink bg-cream shadow-[var(--shadow-ink-sm)] disabled:opacity-40 sm:ml-0 ${game.leanPhoneHeader ? "max-sm:hidden" : ""}`}
        >
          <QuestionIcon className="size-6" />
        </button>
        {game.resumable ? null : (
          <button
            type="button"
            onClick={restart}
            disabled={!canControl}
            aria-label={copy.restart}
            className={`press grid size-10 place-items-center rounded-lg border-[3px] border-ink bg-mint shadow-[var(--shadow-ink-sm)] disabled:opacity-40 ${game.leanPhoneHeader ? "max-sm:hidden" : ""}`}
          >
            <RestartIcon className="size-6" />
          </button>
        )}
        <button
          type="button"
          onClick={stage === "paused" ? resume : pause}
          disabled={!canControl}
          aria-label={stage === "paused" ? copy.resume : copy.pause}
          className={`press grid size-10 place-items-center rounded-lg border-[3px] border-ink bg-sun text-ink shadow-[var(--shadow-ink-sm)] disabled:opacity-40 ${game.leanPhoneHeader ? "max-sm:ml-auto" : ""}`}
        >
          <PauseIcon className="size-6" />
        </button>
        <SoundToggle compact square />
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={stageRef}
          tabIndex={0}
          inert={stage !== "playing"}
          role="application"
          aria-roledescription={copy.game}
          aria-label={game.controlsSummary ?? game.title}
          className="absolute inset-0 touch-none select-none outline-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] focus-visible:outline-none [&:focus-visible_canvas]:outline-4 [&:focus-visible_canvas]:outline-offset-2 [&:focus-visible_canvas]:outline-sun"
        >
          <div ref={hostRef} className="flow-root h-full w-full [&_canvas]:rounded-xl [&_canvas]:border-[3px] [&_canvas]:border-ink" />
        </div>

        <AnimatePresence>
          {stage === "intro" && (
            <IntroPanel
              key="intro"
              game={game}
              highScore={highScore}
              levels={levelProgress}
              progress={introProgress}
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
              onAlt={result.result.alt && !result.mission?.setup?.character ? alt : undefined}
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

        {sideways && (
          <div role="status" className="absolute inset-0 z-50 grid place-items-center bg-plum-900 p-4" style={{ backgroundImage: "var(--dots-dark)", backgroundSize: "18px 18px" }}>
            <div className="paper flex max-w-sm items-center gap-4 border-[3px] border-ink p-5 shadow-[var(--shadow-ink-lg)] wobbly">
              <span className="grid size-16 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-sun text-ink">
                <PhoneIcon className="size-9" />
              </span>
              <div>
                <p className="font-display text-2xl uppercase leading-tight tracking-wide text-ink">{copy.upright}</p>
                <p className="mt-1 text-base text-ink-soft">{copy.uprightText(game.title)}</p>
              </div>
            </div>
          </div>
        )}
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
