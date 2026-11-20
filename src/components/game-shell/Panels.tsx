"use client";

import Link from "@/i18n/Link";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { StarBadge } from "@/components/art/Badges";
import { canResume } from "@/games/resume";
import { GAME_CAST } from "@/components/art/GameCast";
import { HouseIcon, MissionIcon, PlayIcon, RestartIcon, TrophyIcon, UsersIcon } from "@/components/art/Icons";
import { GAME_LOGOS } from "@/components/art/GameLogos";
import { CheckIcon, LevelsIcon, LockIcon } from "@/components/art/Icons";
import { NextProgram } from "@/components/catalog/NextProgram";
import { KidBust } from "@/components/characters/Heads";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkButton, InkLink } from "@/components/ui/Primitives";
import type { GameMeta } from "@/games/registry";
import type { GameResult } from "@/games/types";
import { useCopy, useLocale, useLocalePath } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { formatNumber } from "@/i18n/format";
import { useSound } from "@/lib/audio/hooks";
import { useTouchScreen } from "@/lib/device";
import type { JoinOutcome } from "@/lib/competition/client";
import { missionOverridesStars } from "@/lib/missions/goals";
import type { MissionState, MissionView } from "@/lib/missions/types";
import { BoardLine, type BoardState } from "./BoardLine";
import { MissionBrief, MissionLine } from "./MissionLine";

const TERTIARY =
  "inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 font-display text-base uppercase tracking-wide text-ink-soft underline decoration-2 underline-offset-4 hover:text-ink";

export type IntroMission = { view: MissionView; state: MissionState | null };

type LevelWord = NonNullable<GameMeta["levelWord"]>;

const LEVEL: Record<LevelWord, string> = { fase: "level", arena: "arena" };

const COPY = localized({
  "pt-BR": {
    stars: (count: number, total: number) => `${count} de ${total} estrelas`,
    introLabel: (title: string) => `${title}: tela de apresentação`,
    howTo: "Como jogar",
    missionLink: "Ver a missão de hoje",
    tuning: "Sintonizando a missão…",
    chooseLevel: (word: LevelWord) => `Escolha a ${word}`,
    starsTotal: (count: number, total: number) => `Estrelas: ${count}/${total}`,
    upNext: "A seguir",
    locked: (word: LevelWord): string => (word === "arena" ? "Vença a arena anterior" : "Termine a fase anterior"),
    noStars: "Sem estrelas",
    saved: "Sua aventura está salva. Continue de onde parou.",
    newAdventureLabel: "Começar uma nova aventura",
    startOver: "Começar do zero?",
    startOverText: "O progresso salvo desta aventura será apagado.",
    confirmNew: "Sim, nova aventura",
    cancel: "Cancelar",
    startMission: "Começar missão",
    skipMission: "Jogar sem missão",
    continueAdventure: "Continuar aventura",
    newAdventure: "Nova aventura",
    startAdventure: "Começar aventura",
    playLevel: (word: LevelWord, n: number) => `Jogar ${word} ${n}`,
    play: "Jogar",
    showLevels: (word: LevelWord) => `Ver ${word}s`,
    hideHelp: "Esconder instruções",
    record: (value: string) => `Recorde: ${value}`,
    pausedLabel: "Jogo pausado",
    paused: "Pausa",
    napping: "O 404 aproveitou para tirar um cochilo.",
    resume: "Continuar",
    restart: "Recomeçar",
    quit: "Sair do jogo",
    win: "Vitória!",
    lose: "Fim de jogo",
    winLabel: (title: string) => `Vitória: ${title}`,
    loseLabel: (title: string) => `Fim de jogo: ${title}`,
    bestResult: "Melhor resultado!",
    newRecord: "Novo recorde!",
    levelOf: (word: LevelWord, n: number, total: number, title: string) => `${word[0].toUpperCase() + word.slice(1)} ${n} de ${total} · ${title}`,
    total: "Total",
    retryMission: "Tentar a missão de novo",
    replayLevel: "Refazer fase",
    playAgain: "Jogar de novo",
    nextLevel: (word: LevelWord) => `Próxima ${word}`,
    catalog: "Ver catálogo",
    pickLevel: (word: LevelWord) => `Escolher ${word}`,
    backToRoom: "Voltar à sala",
    errorLabel: "Erro ao carregar",
    lost: "Sinal perdido",
    lostText: "Não conseguimos sintonizar o jogo. Tenta de novo?",
    retry: "Tentar de novo",
    backToCatalog: "Voltar ao catálogo",
  },
  en: {
    stars: (count: number, total: number) => `${count} of ${total} stars`,
    introLabel: (title: string) => `${title}: title screen`,
    howTo: "How to play",
    missionLink: "See today's mission",
    tuning: "Tuning in the mission…",
    chooseLevel: (word: LevelWord) => (word === "arena" ? "Pick an arena" : "Pick a level"),
    starsTotal: (count: number, total: number) => `Stars: ${count}/${total}`,
    upNext: "Up next",
    locked: (word: LevelWord) => (word === "arena" ? "Win the previous arena" : "Finish the previous level"),
    noStars: "No stars",
    saved: "Your adventure is saved. Pick up where you left off.",
    newAdventureLabel: "Start a new adventure",
    startOver: "Start over?",
    startOverText: "The saved progress for this adventure will be erased.",
    confirmNew: "Yes, new adventure",
    cancel: "Cancel",
    startMission: "Start mission",
    skipMission: "Play without the mission",
    continueAdventure: "Continue adventure",
    newAdventure: "New adventure",
    startAdventure: "Start adventure",
    playLevel: (word: LevelWord, n: number) => `Play ${LEVEL[word]} ${n}`,
    play: "Play",
    showLevels: (word: LevelWord) => `See ${LEVEL[word]}s`,
    hideHelp: "Hide instructions",
    record: (value: string) => `Record: ${value}`,
    pausedLabel: "Game paused",
    paused: "Paused",
    napping: "404 took the chance to grab a nap.",
    resume: "Resume",
    restart: "Restart",
    quit: "Quit game",
    win: "You win!",
    lose: "Game over",
    winLabel: (title: string) => `You win: ${title}`,
    loseLabel: (title: string) => `Game over: ${title}`,
    bestResult: "Best result!",
    newRecord: "New record!",
    levelOf: (word: LevelWord, n: number, total: number, title: string) => `${word === "arena" ? "Arena" : "Level"} ${n} of ${total} · ${title}`,
    total: "Total",
    retryMission: "Try the mission again",
    replayLevel: "Replay level",
    playAgain: "Play again",
    nextLevel: (word: LevelWord) => `Next ${LEVEL[word]}`,
    catalog: "See catalog",
    pickLevel: (word: LevelWord) => (word === "arena" ? "Pick an arena" : "Pick a level"),
    backToRoom: "Back to the room",
    errorLabel: "Loading error",
    lost: "Signal lost",
    lostText: "We couldn't tune in the game. Try again?",
    retry: "Try again",
    backToCatalog: "Back to the catalog",
  },
});

function useAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const id = window.setTimeout(() => ref.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, []);
  return ref;
}

export function OverlayFrame({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className="absolute inset-0 z-30 flex overflow-y-auto overscroll-contain bg-plum-950/70 p-3 backdrop-blur-[1px] sm:p-6">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={{ opacity: 0, scale: 0.88, rotate: -2, y: 20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        className={`paper relative m-auto w-full border-[3px] border-ink shadow-[var(--shadow-ink-lg)] wobbly ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ControlsList({ game }: { game: GameMeta }) {
  const device = useTouchScreen() ? "touch" : "keys";
  const controls = game.controls?.filter((c) => !c.on || c.on === device);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ol className="space-y-2">
        {game.howTo?.map((step, i) => (
          <li key={step.title} className="flex gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-sun font-display text-sm text-ink">
              {i + 1}
            </span>
            <span className="leading-snug text-ink-soft">
              <strong className="font-display text-base uppercase tracking-wide text-ink">{step.title}: </strong>
              {step.text}
            </span>
          </li>
        ))}
      </ol>
      <dl className="space-y-1.5 rounded-xl border-2 border-ink bg-cream-2 p-3">
        {controls?.map((c) => (
          <div key={c.input} className="flex flex-col">
            <dt className="font-display text-xs uppercase tracking-wider text-ink">{c.input}</dt>
            <dd className="text-sm leading-snug text-ink-soft">{c.action}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export type LevelProgress = { stars: number[]; unlocked: number; suggested: number };

function CountUp({ value, delay = 0 }: { value: number; delay?: number }) {
  const locale = useLocale();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => formatNumber(Math.round(v), locale));
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const controls = animate(mv, value, reduced ? { duration: 0.01 } : { duration: 0.9, delay, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, value, delay]);
  return (
    <>
      <span className="sr-only">{formatNumber(value, locale)}</span>
      <motion.span aria-hidden>{text}</motion.span>
    </>
  );
}

function GameTitle({ game }: { game: GameMeta }) {
  const Logo = GAME_LOGOS[game.slug];
  return Logo ? (
    <h1>
      <Logo className="w-full max-w-md shorter:max-w-xs [@media(max-height:540px)]:w-40 [@media(max-height:540px)]:max-w-none" bare />
    </h1>
  ) : (
    <h1 className="font-display text-4xl uppercase text-ink">{game.title}</h1>
  );
}

function CastPair({ game, happy }: { game: GameMeta; happy?: boolean }) {
  const kids = game.cast.filter((c): c is "lina" | "bruno" | "deco" | "mila" => c !== "404").slice(0, 2);
  return (
    <div className="flex shrink-0">
      {kids.map((k, i) => (
        <KidBust key={k} who={k} face={happy || i === 0 ? "happy" : "wow"} className={`w-20 sm:w-24 ${i ? "-ml-3 rotate-6" : "-rotate-6"}`} />
      ))}
    </div>
  );
}

function MiniStars({ count, total = 3 }: { count: number; total?: number }) {
  const copy = useCopy(COPY);
  return (
    <span role="img" aria-label={copy.stars(count, total)} className="inline-flex gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} aria-hidden className={`text-xl leading-none ${i < count ? "text-sun" : "text-cream-3"}`} style={{ textShadow: "1.5px 2px 0 #1d1830" }}>
          ★
        </span>
      ))}
    </span>
  );
}

function StarBurst({ delay }: { delay: number }) {
  return (
    <motion.svg
      viewBox="-50 -50 100 100"
      aria-hidden
      className="pointer-events-none absolute -inset-[45%] size-[190%]"
      initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
      animate={{ scale: [0.5, 1.12, 1.3], opacity: [0, 1, 0], rotate: 0 }}
      transition={{ delay, duration: 0.5, times: [0, 0.35, 1], ease: "easeOut" }}
    >
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r0 = i % 2 ? 30 : 27;
        const r1 = i % 2 ? 38 : 45;
        const d = `M${(Math.cos(a) * r0).toFixed(1)} ${(Math.sin(a) * r0).toFixed(1)} L${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)}`;
        return (
          <g key={i} strokeLinecap="round">
            <path d={d} stroke="var(--color-ink)" strokeWidth={7} />
            <path d={d} stroke="var(--color-sun)" strokeWidth={3} />
          </g>
        );
      })}
    </motion.svg>
  );
}

function RewardStars({ stars, className = "" }: { stars: number; className?: string }) {
  const still = useReducedMotion();
  const copy = useCopy(COPY);
  return (
    <div className={`mt-4 flex justify-center gap-2 max-sm:mt-2 shorter:mt-2 ${className}`} aria-label={copy.stars(stars, 3)} role="img">
      {[0, 1, 2].map((i) => {
        const earned = i < stars;
        const delay = 0.3 + i * 0.18;
        return (
          <div key={i} className="relative w-12 sm:w-20 sm:shorter:w-14">
            {earned && !still ? <StarBurst delay={delay + 0.12} /> : null}
            <motion.div
              initial={still ? false : earned ? { scale: 2.2, rotate: -30, y: -18, opacity: 0 } : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, y: 0, opacity: earned ? 1 : 0.3 }}
              transition={earned ? { delay, type: "spring", stiffness: 560, damping: 14, mass: 0.7, opacity: { delay, duration: 0.08 } } : { delay, duration: 0.25 }}
              className={`relative ${earned ? "" : "grayscale"}`}
            >
              <StarBadge color={earned ? "sun" : "plum"} className="w-full" />
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export function IntroPanel({
  game,
  highScore,
  levels,
  showHelp,
  onToggleHelp,
  onPlay,
  onNew,
  mission = null,
  missionPending = false,
  missionNotice = null,
  onStartMission,
  onSkipMission,
}: {
  game: GameMeta;
  highScore: number;
  levels?: LevelProgress;
  showHelp: boolean;
  onToggleHelp: () => void;
  onPlay: (level?: number) => void;
  onNew?: () => void;
  mission?: IntroMission | null;
  missionPending?: boolean;
  missionNotice?: string | null;
  onStartMission?: () => void;
  onSkipMission?: () => void;
}) {
  const playRef = useAutoFocus<HTMLButtonElement>();
  const locale = useLocale();
  const copy = COPY[locale];
  const localePath = useLocalePath();
  const [saved] = useState(() => (game.resumable ? canResume(game.slug, game.resumable) : false));
  const [confirming, setConfirming] = useState(false);
  const resume = Boolean(game.resumable && saved);
  const leveled = Boolean(game.levels && levels);
  const word = game.levelWord ?? "fase";
  const Cast = GAME_CAST[game.slug];
  const totalStars = levels ? levels.stars.reduce((a, b) => a + b, 0) : 0;
  const suggested = levels ? Math.min(levels.suggested, levels.unlocked) : 0;
  const picking = !mission && !missionPending && leveled && Boolean(game.levels && levels);
  const help = (
    <div id="how-to-play-panel" className={picking ? "" : "mt-5 border-t-[3px] border-dashed border-ink/30 pt-4"}>
      {picking ? <h2 className="mb-3 font-display text-xl uppercase tracking-wide text-ink">{copy.howTo}</h2> : null}
      <ControlsList game={game} />
    </div>
  );
  return (
    <OverlayFrame label={copy.introLabel(game.title)} className="flex max-h-full max-w-3xl flex-col p-5 sm:p-7 shorter:py-4 [@media(max-height:540px)]:p-4">
      <div className="grid shrink-0 items-center gap-4 sm:grid-cols-[1fr_auto]">
        <div className="[@media(max-height:540px)]:flex [@media(max-height:540px)]:items-center [@media(max-height:540px)]:gap-4">
          <GameTitle game={game} />
          <p className="mt-2 text-lg font-semibold leading-snug text-ink shorter:mt-1 shorter:text-base [@media(max-height:540px)]:mt-0 [@media(max-height:540px)]:text-sm">{game.objective}</p>
        </div>
        <div className="hidden sm:block [@media(max-height:540px)]:hidden">{Cast ? <Cast mood="intro" locale={locale} /> : <CastPair game={game} />}</div>
      </div>
      <div
        data-testid="intro-body"
        tabIndex={showHelp ? 0 : undefined}
        role={showHelp ? "region" : undefined}
        aria-label={showHelp ? copy.howTo : undefined}
        className="-mx-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-1 outline-none focus-visible:ring-4 focus-visible:ring-sun"
      >
        {missionNotice ? (
          <p role="status" className="mt-4 rounded-lg border-[3px] border-ink bg-sun px-3 py-2 font-semibold leading-snug text-ink">
            {missionNotice}{" "}
            <a href={localePath("/mission")} className="underline decoration-2 underline-offset-2">
              {copy.missionLink}
            </a>
            .
          </p>
        ) : null}
        {mission ? <MissionBrief view={mission.view} state={mission.state} /> : null}
        {missionPending ? (
          <p role="status" className="mt-4 animate-pulse rounded-xl border-[3px] border-ink bg-plum-800 px-3 py-3 font-display uppercase tracking-wider text-sun">
            {copy.tuning}
          </p>
        ) : null}
        {picking && showHelp ? <div className="mt-5 shorter:mt-3">{help}</div> : null}
        {picking && !showHelp && game.levels && levels && (
          <div className="mt-5 shorter:mt-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl uppercase tracking-wide text-ink">{copy.chooseLevel(word)}</h2>
              <p className="font-display text-sm uppercase tracking-wide text-ink-soft">
                {copy.starsTotal(totalStars, game.levels.length * 3)}
              </p>
            </div>
            <ol className="mt-3 grid gap-x-2.5 gap-y-3 pt-1 sm:grid-cols-2 lg:grid-cols-3">
              {game.levels.map((level, i) => {
                const locked = i > levels.unlocked;
                const done = !locked && levels.stars[i] > 0;
                const current = !locked && i === suggested;
                return (
                  <li key={level.id} className="relative">
                    {current ? (
                      <span aria-hidden className="pointer-events-none absolute -top-2.5 right-3 z-10 rotate-2 rounded-md border-2 border-ink bg-ink px-1.5 font-display text-[11px] uppercase leading-5 tracking-wider text-sun">
                        {copy.upNext}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      disabled={locked}
                      aria-current={current ? "step" : undefined}
                      onClick={() => onPlay(i)}
                      className={`press grid h-full w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 rounded-xl border-ink p-2.5 text-left disabled:cursor-not-allowed disabled:border-dashed disabled:border-ink/45 disabled:opacity-70 disabled:shadow-none ${
                        current ? "border-4 bg-sun shadow-[var(--shadow-ink)]" : "border-[3px] bg-cream-2 shadow-[var(--shadow-ink-sm)]"
                      }`}
                    >
                      <span
                        className={`relative mt-0.5 grid size-10 shrink-0 place-items-center rounded-full border-[3px] font-display text-lg ${
                          locked ? "border-ink/45 bg-cream text-ink-soft" : current ? "border-ink bg-ink text-sun" : "border-ink bg-paper text-ink"
                        }`}
                      >
                        {locked ? <LockIcon className="size-5" /> : i + 1}
                        {done ? (
                          <span className="absolute -bottom-1.5 -right-1.5 grid size-5 place-items-center rounded-full border-2 border-ink bg-lime text-ink">
                            <CheckIcon className="size-3" />
                          </span>
                        ) : null}
                      </span>
                      <span className="flex min-h-full min-w-0 flex-col">
                        <span className="block text-balance font-display text-base uppercase leading-tight text-ink">{level.title}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-ink-soft">
                          {locked ? copy.locked(word) : level.goal}
                        </span>
                        {locked ? null : (
                          <span className="mt-auto flex items-center gap-2 pt-1.5">
                            <MiniStars count={levels.stars[i]} />
                            {done ? null : <span className="font-display text-[11px] uppercase tracking-wider text-ink-soft">{copy.noStars}</span>}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        {resume && <p className="mt-4 font-hand text-xl leading-snug text-ink-soft">{copy.saved}</p>}
        {confirming ? (
          <div role="alertdialog" aria-label={copy.newAdventureLabel} className="mt-5 rounded-xl border-[3px] border-ink bg-cream-2 p-4">
            <p className="font-display text-lg uppercase tracking-wide text-ink">{copy.startOver}</p>
            <p className="mt-1 leading-snug text-ink-soft">{copy.startOverText}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <InkButton tone="tomato" onClick={onNew}>
                <RestartIcon className="size-5" /> {copy.confirmNew}
              </InkButton>
              <InkButton tone="cream" onClick={() => setConfirming(false)}>
                {copy.cancel}
              </InkButton>
            </div>
          </div>
        ) : null}
        {showHelp && !picking ? help : null}
      </div>
      <div className={`mt-5 flex shrink-0 flex-wrap items-center gap-3 shorter:mt-3 ${missionPending ? "invisible" : ""}`}>
        {mission ? (
          <>
            <InkButton ref={playRef} size="lg" tone="sun" onClick={onStartMission}>
              <MissionIcon className="size-7 text-ink" /> {copy.startMission}
            </InkButton>
            <InkButton tone="cream" onClick={onSkipMission}>
              {copy.skipMission}
            </InkButton>
          </>
        ) : game.resumable && onNew ? (
          resume ? (
            <>
              <InkButton ref={playRef} size="lg" tone="sun" onClick={() => onPlay()}>
                <PlayIcon className="size-7 text-ink" /> {copy.continueAdventure}
              </InkButton>
              <InkButton tone="cream" onClick={() => setConfirming(true)} aria-expanded={confirming}>
                <RestartIcon className="size-5" /> {copy.newAdventure}
              </InkButton>
            </>
          ) : (
            <InkButton ref={playRef} size="lg" tone="sun" onClick={onNew}>
              <PlayIcon className="size-7 text-ink" /> {copy.startAdventure}
            </InkButton>
          )
        ) : (
          <InkButton ref={playRef} size="lg" tone="sun" onClick={() => onPlay(leveled ? suggested : undefined)}>
            <PlayIcon className="size-7 text-ink" /> {leveled ? copy.playLevel(word, suggested + 1) : copy.play}
          </InkButton>
        )}
        <InkButton tone="cream" onClick={onToggleHelp} aria-expanded={showHelp} aria-controls="how-to-play-panel">
          {showHelp ? (picking ? copy.showLevels(word) : copy.hideHelp) : copy.howTo}
        </InkButton>
        {!leveled && !mission && (
          <p className="flex items-center gap-1.5 px-1 font-display text-sm uppercase leading-none tracking-wide text-ink-soft">
            <TrophyIcon className="size-4" />
            <span>{copy.record(highScore > 0 ? formatNumber(highScore, locale) : "—")}</span>
          </p>
        )}
      </div>
    </OverlayFrame>
  );
}

export function PausePanel({
  game,
  onResume,
  onRestart,
  showHelp,
  onToggleHelp,
}: {
  game: GameMeta;
  onResume: () => void;
  onRestart?: () => void;
  showHelp: boolean;
  onToggleHelp: () => void;
}) {
  const resumeRef = useAutoFocus<HTMLButtonElement>();
  const copy = useCopy(COPY);
  return (
    <OverlayFrame label={copy.pausedLabel} className="max-w-2xl p-5 sm:p-7">
      <div className="flex items-center gap-4">
        <Mascot404 expression="sleepy" className="w-24 shrink-0" />
        <div>
          <h2 className="font-display text-5xl uppercase tracking-wide text-ink">{copy.paused}</h2>
          <p className="font-hand text-xl text-ink-soft">{copy.napping}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <InkButton ref={resumeRef} tone="sun" onClick={onResume}>
          <PlayIcon className="size-5 text-ink" /> {copy.resume}
        </InkButton>
        {onRestart ? (
          <InkButton tone="mint" onClick={onRestart}>
            <RestartIcon className="size-5" /> {copy.restart}
          </InkButton>
        ) : null}
        <InkButton tone="cream" onClick={onToggleHelp} aria-expanded={showHelp}>
          {showHelp ? copy.hideHelp : copy.howTo}
        </InkButton>
        <InkLink href={`/games/${game.slug}`} tone="cream">
          {copy.quit}
        </InkLink>
      </div>
      {showHelp && (
        <div className="mt-5 border-t-[3px] border-dashed border-ink/30 pt-4">
          <ControlsList game={game} />
        </div>
      )}
    </OverlayFrame>
  );
}

export function ResultPanel({
  game,
  result,
  isRecord,
  recordNote,
  board,
  mission = null,
  onJoin,
  onRestart,
  onNext,
  onLevels,
  onAlt,
}: {
  game: GameMeta;
  result: GameResult;
  isRecord: boolean;
  recordNote: string;
  board?: BoardState | null;
  mission?: MissionView | null;
  onJoin?: (nickname: string) => Promise<JoinOutcome>;
  onRestart: () => void;
  onNext?: () => void;
  onLevels?: () => void;
  onAlt?: () => void;
}) {
  const word = game.levelWord ?? "fase";
  const locale = useLocale();
  const copy = COPY[locale];
  const Cast = GAME_CAST[game.slug];
  const mainRef = useAutoFocus<HTMLButtonElement>();
  const { play } = useSound();
  useEffect(() => {
    if (!result.won) return;
    const ids = Array.from({ length: result.stars }, (_, i) =>
      window.setTimeout(() => play("coin", { pitch: 1 + i * 0.15 }), 300 + i * 180),
    );
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [play, result.won, result.stars]);
  const title = result.copy?.title ?? (result.won ? game.copy?.winTitle : game.copy?.loseTitle) ?? (result.won ? copy.win : copy.lose);
  const text = result.copy?.text ?? (result.won ? game.copy?.winText : game.copy?.loseText) ?? "";
  return (
    <OverlayFrame label={result.won ? copy.winLabel(title) : copy.loseLabel(title)} className="max-w-2xl p-5 sm:p-7 wideshort:max-w-5xl wideshort:p-5">
      {isRecord && (
        <span className="absolute -right-3 -top-4 z-10 rotate-12 rounded-lg border-[3px] border-ink bg-bubblegum px-3 py-1 font-display text-lg uppercase tracking-wider text-ink shadow-[var(--shadow-ink)] max-sm:right-1 max-sm:px-2 max-sm:text-base">
          {result.level ? copy.bestResult : copy.newRecord}
        </span>
      )}
      <div className="wideshort:grid wideshort:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] wideshort:items-start wideshort:gap-x-7">
        <div className="wideshort:col-span-2 wideshort:flex wideshort:items-center wideshort:gap-6 wideshort:border-b-[3px] wideshort:border-dashed wideshort:border-ink/20 wideshort:pb-4">
          <div className="min-w-0 wideshort:flex-1">
            {result.level && (
              <p className="mb-2 inline-block -rotate-1 rounded-md border-[3px] border-ink bg-mint px-2 font-display text-sm uppercase tracking-wider text-ink">
                {copy.levelOf(word, result.level.index + 1, result.level.total, result.level.title)}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 max-sm:gap-3">
              <div className="shrink-0 max-sm:[zoom:0.75]">
                {Cast ? (
                  <Cast mood={result.won ? "win" : "lose"} featured={result.featured} locale={locale} />
                ) : result.won ? (
                  <CastPair game={game} happy />
                ) : (
                  <Mascot404 expression="sad" className="w-24 shrink-0" />
                )}
              </div>
              <div className="min-w-0 flex-1 max-sm:basis-40 wideshort:basis-48">
                <h2 className="font-display text-[clamp(2.2rem,6vw,3.4rem)] uppercase leading-none tracking-wide text-ink max-sm:text-[clamp(1.6rem,8.4vw,2.2rem)] wideshort:text-[clamp(2rem,3.4vw,2.6rem)]">{title}</h2>
                {text && <p className="mt-1 text-pretty font-hand text-xl leading-snug text-ink-soft max-sm:text-lg">{text}</p>}
              </div>
            </div>
          </div>
          <div className="wideshort:flex wideshort:w-[19rem] wideshort:shrink-0 wideshort:flex-col wideshort:items-center">
            {result.won && <RewardStars stars={result.stars} className="wideshort:mt-0" />}
            {result.summary && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
                className="mt-2 text-center font-display text-base uppercase tracking-wide text-ink wideshort:text-sm"
              >
                {result.summary}
              </motion.p>
            )}
            {result.starHint && !(mission && missionOverridesStars(mission)) ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }} className="copy-sm mt-0.5 text-center text-ink-soft">
                {result.starHint}
              </motion.p>
            ) : null}
          </div>
        </div>
        <div className="wideshort:mt-4">
          <dl className="mt-5 rounded-xl border-[3px] border-ink bg-cream-2 px-4 pt-1 max-sm:mt-3 max-sm:px-3 wideshort:mt-3">
            {result.breakdown.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.12 }}
                className={`flex items-baseline justify-between gap-4 py-2 max-sm:py-1.5 wideshort:py-1.5 ${i ? "border-t-2 border-dashed border-ink/20" : ""}`}
              >
                <dt className="copy min-w-0 text-ink-soft">{row.label}</dt>
                <dd className={`shrink-0 text-right font-display text-xl leading-none tabular-nums ${row.value < 0 ? "text-tomato-deep" : "text-ink"}`}>
                  {row.value < 0 ? "−" : "+"}
                  {formatNumber(Math.abs(row.value), locale)}
                </dd>
              </motion.div>
            ))}
            <div className="-mx-4 flex items-baseline justify-between gap-4 rounded-b-[9px] border-t-[3px] border-ink bg-cream px-4 py-2.5 max-sm:-mx-3 max-sm:px-3">
              <dt className="font-display text-xl uppercase tracking-wide text-ink">{copy.total}</dt>
              <dd className="shrink-0 font-display text-4xl leading-none tabular-nums text-ink max-sm:text-3xl">
                <CountUp value={result.score} delay={0.3 + result.breakdown.length * 0.12} />
              </dd>
            </div>
          </dl>
          {recordNote && <p className="copy-sm mt-2 text-ink-soft">{recordNote}</p>}
        </div>
        <div className="wideshort:mt-4 wideshort:[&>*:first-child]:mt-0">
          {mission ? <MissionLine view={mission} board={board ?? null} /> : null}
          {board && onJoin ? <BoardLine game={game} state={board} onJoin={onJoin} /> : null}
          {!onNext && <NextProgram current={game.slug} />}
          <div className="mt-5 flex flex-wrap gap-3 max-sm:sticky max-sm:-bottom-3 max-sm:z-10 max-sm:-mx-5 max-sm:-mb-5 max-sm:mt-4 max-sm:grid max-sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] max-sm:gap-2 max-sm:rounded-b-[inherit] max-sm:border-t-[3px] max-sm:border-ink max-sm:px-4 max-sm:pb-4 max-sm:pt-3 max-sm:paper max-sm:[&>*]:min-h-11 max-sm:[&>*]:px-2 max-sm:[&>*]:text-base max-[380px]:[&>*]:gap-1 max-[380px]:[&>*]:whitespace-nowrap max-[380px]:[&>*]:text-sm max-[380px]:[&>*]:tracking-normal max-[380px]:[&_svg]:size-4 wideshort:mt-3">
            {onNext && !mission ? (
              <InkButton ref={mainRef} tone="sun" onClick={onNext}>
                <PlayIcon className="size-5 text-ink" /> {copy.nextLevel(word)}
              </InkButton>
            ) : null}
            <InkButton ref={onNext && !mission ? undefined : mainRef} tone={onNext && !mission ? "cream" : "sun"} onClick={onRestart} className={onNext && !mission ? "max-[420px]:[&>svg]:hidden" : "sm:px-7"}>
              {game.resumable ? <PlayIcon className="size-5 text-ink" /> : <RestartIcon className="size-5" />}{" "}
              {mission ? copy.retryMission : (result.restartLabel ?? (result.level && word === "fase" ? copy.replayLevel : copy.playAgain))}
            </InkButton>
            {onNext && mission ? (
              <InkButton tone="cream" onClick={onNext}>
                <PlayIcon className="size-5 text-ink" /> {copy.nextLevel(word)}
              </InkButton>
            ) : null}
            {onAlt && result.alt ? (
              <InkButton tone="cream" onClick={onAlt}>
                {game.resumable ? <RestartIcon className="size-5" /> : <UsersIcon className="size-5" />} {result.alt}
              </InkButton>
            ) : null}
            {onLevels ? null : (
              <InkLink href="/games" tone="cream">
                {copy.catalog}
              </InkLink>
            )}
            <div className="flex basis-full flex-wrap items-center gap-x-3 gap-y-1 max-sm:col-span-2 max-sm:justify-center">
              {onLevels ? (
                <button type="button" onClick={onLevels} className={TERTIARY}>
                  <LevelsIcon className="size-4" /> {copy.pickLevel(word)}
                </button>
              ) : null}
              <Link href="/" className={TERTIARY}>
                <HouseIcon className="size-4" /> {copy.backToRoom}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </OverlayFrame>
  );
}

export function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  const ref = useAutoFocus<HTMLButtonElement>();
  const copy = useCopy(COPY);
  return (
    <OverlayFrame label={copy.errorLabel} className="max-w-xl p-6">
      <div className="flex items-center gap-4">
        <Mascot404 expression="static" className="w-24 shrink-0" />
        <div>
          <h2 className="font-display text-3xl uppercase text-ink">{copy.lost}</h2>
          <p className="font-hand text-xl text-ink-soft">{copy.lostText}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <InkButton ref={ref} tone="sun" onClick={onRetry}>
          {copy.retry}
        </InkButton>
        <InkLink href="/games" tone="cream">
          {copy.backToCatalog}
        </InkLink>
      </div>
    </OverlayFrame>
  );
}
