"use client";

import Link from "@/i18n/Link";
import { animate, motion, useIsPresent, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { StarBadge } from "@/components/art/Badges";
import { canResume } from "@/games/resume";
import { GAME_CAST } from "@/components/art/GameCast";
import { HouseIcon, MissionIcon, PlayIcon, RestartIcon, TrophyIcon, UsersIcon } from "@/components/art/Icons";
import { GAME_LOGOS } from "@/components/art/GameLogos";
import { CheckIcon, ControllerIcon, LevelsIcon, LockIcon } from "@/components/art/Icons";
import { NextProgram } from "@/components/catalog/NextProgram";
import { KidBust } from "@/components/characters/Heads";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkButton, InkLink } from "@/components/ui/Primitives";
import type { GameMeta } from "@/games/registry";
import type { GameResult, IntroProgress, ResultFact, ResultStanding } from "@/games/types";
import { useCopy, useLocale, useLocalePath } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { formatNumber, ordinal } from "@/i18n/format";
import { useSound } from "@/lib/audio/hooks";
import { useNarrowScreen, useTouchScreen } from "@/lib/device";
import type { JoinOutcome } from "@/lib/competition/client";
import { missionOverridesStars } from "@/lib/missions/goals";
import type { MissionState, MissionView } from "@/lib/missions/types";
import { BoardLine, type BoardState } from "./BoardLine";
import { MissionBrief, MissionLine } from "./MissionLine";

function longestWord(text: string) {
  return Math.max(1, ...text.split(/\s+/).map((word) => word.length));
}

const TERTIARY =
  "inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 font-display text-base uppercase tracking-wide text-ink-soft underline decoration-2 underline-offset-4 hover:text-ink";

export type IntroMission = { view: MissionView; state: MissionState | null };

type LevelWord = NonNullable<GameMeta["levelWord"]>;

const LEVEL: Record<LevelWord, string> = { fase: "level", arena: "arena", pista: "track" };

const PICK: Record<LevelWord, string> = { fase: "Pick a level", arena: "Pick an arena", pista: "Pick a track" };

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
    locked: (word: LevelWord): string => (word === "arena" ? "Vença a arena anterior" : word === "pista" ? "Chegue ao pódio na pista anterior para desbloquear." : "Termine a fase anterior"),
    noStars: "Sem estrelas",
    saved: "Sua aventura está salva. Continue de onde parou.",
    adventure: "Sua aventura",
    leftOff: "Você parou aqui",
    startsHere: "Começa aqui",
    showAdventure: "Ver aventura",
    startShort: "Iniciar",
    continueShort: "Continuar",
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
    standings: "Classificação",
    facts: "Sua corrida",
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
    chooseLevel: (word: LevelWord) => PICK[word],
    starsTotal: (count: number, total: number) => `Stars: ${count}/${total}`,
    upNext: "Up next",
    locked: (word: LevelWord) => (word === "arena" ? "Win the previous arena" : word === "pista" ? "Make the podium on the previous track to unlock." : "Finish the previous level"),
    noStars: "No stars",
    saved: "Your adventure is saved. Pick up where you left off.",
    adventure: "Your adventure",
    leftOff: "Left off here",
    startsHere: "Starts here",
    showAdventure: "See adventure",
    startShort: "Start",
    continueShort: "Continue",
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
    standings: "Standings",
    facts: "Your run",
    levelOf: (word: LevelWord, n: number, total: number, title: string) => `${LEVEL[word][0].toUpperCase() + LEVEL[word].slice(1)} ${n} of ${total} · ${title}`,
    total: "Total",
    retryMission: "Try the mission again",
    replayLevel: "Replay level",
    playAgain: "Play again",
    nextLevel: (word: LevelWord) => `Next ${LEVEL[word]}`,
    catalog: "See catalog",
    pickLevel: (word: LevelWord) => PICK[word],
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
    const id = window.setTimeout(() => ref.current?.focus({ preventScroll: true }), 60);
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
  const present = useIsPresent();
  return (
    <div
      className={`absolute inset-0 z-30 flex overflow-y-auto overscroll-contain bg-plum-950/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6 backdrop-blur-[1px] [scrollbar-gutter:stable] sm:p-6 ${present ? "" : "pointer-events-none"}`}
    >
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
      <Logo className="w-full max-w-md shorter:max-w-xs max-sm:mx-auto max-sm:max-w-[16rem] [@media(max-height:540px)]:w-40 [@media(max-height:540px)]:max-w-none" bare />
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

function PickHeader({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-xl uppercase tracking-wide text-ink">{title}</h2>
      {meta ? <p className="font-display text-sm uppercase tracking-wide text-ink-soft">{meta}</p> : null}
    </div>
  );
}

function PickCard({
  badge,
  title,
  text,
  tag,
  current = false,
  locked = false,
  done = false,
  footer,
  onClick,
}: {
  badge: ReactNode;
  title: string;
  text: string;
  tag?: string;
  current?: boolean;
  locked?: boolean;
  done?: boolean;
  footer?: ReactNode;
  onClick: () => void;
}) {
  return (
    <>
      {current && tag ? (
        <span aria-hidden className="pointer-events-none absolute -top-2.5 right-3 z-10 rotate-2 rounded-md border-2 border-ink bg-ink px-1.5 font-display text-[11px] uppercase leading-5 tracking-wider text-sun">
          {tag}
        </span>
      ) : null}
      <button
        type="button"
        disabled={locked}
        aria-current={current ? "step" : undefined}
        onClick={onClick}
        className={`press grid h-full w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 rounded-xl border-ink p-2.5 text-left disabled:cursor-not-allowed disabled:border-dashed disabled:border-ink/45 disabled:opacity-70 disabled:shadow-none ${
          current ? "border-4 bg-sun shadow-[var(--shadow-ink)]" : "border-[3px] bg-cream-2 shadow-[var(--shadow-ink-sm)]"
        }`}
      >
        <span
          className={`relative mt-0.5 grid size-10 shrink-0 place-items-center rounded-full border-[3px] font-display text-lg ${
            locked ? "border-ink/45 bg-cream text-ink-soft" : current ? "border-ink bg-ink text-sun" : "border-ink bg-paper text-ink"
          }`}
        >
          {badge}
          {done ? (
            <span className="absolute -bottom-1.5 -right-1.5 grid size-5 place-items-center rounded-full border-2 border-ink bg-lime text-ink">
              <CheckIcon className="size-3" />
            </span>
          ) : null}
        </span>
        <span className="flex min-h-full min-w-0 flex-col">
          <span className="block text-balance font-display text-base uppercase leading-tight text-ink">{title}</span>
          <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{text}</span>
          {footer ? <span className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1.5">{footer}</span> : null}
        </span>
      </button>
    </>
  );
}

type BarAction = {
  key: string;
  label: string;
  icon?: ReactNode;
  tone: "sun" | "cream" | "tomato";
  size?: "lg";
  onClick?: () => void;
  href?: string;
  buttonRef?: Ref<HTMLButtonElement>;
  className?: string;
  expanded?: boolean;
  controls?: string;
};

const LINK_ROW =
  "flex basis-full flex-wrap items-center gap-x-3 gap-y-1 max-sm:col-span-2 max-sm:justify-center max-sm:gap-x-2 max-sm:[&>*]:px-1 max-sm:[&>*]:text-[15px] max-sm:[&>*]:tracking-normal max-sm:[&_svg]:size-4";

function ActionBar({ actions, links = [], note, className }: { actions: BarAction[]; links?: ReactNode[]; note?: ReactNode; className: string }) {
  const narrow = useNarrowScreen();
  const main = narrow ? actions.slice(0, 2) : actions;
  const extra = narrow ? actions.slice(2) : [];
  const tail = [
    ...extra.map((a) =>
      a.href ? (
        <Link key={a.key} href={a.href} className={TERTIARY}>
          {a.icon} {a.label}
        </Link>
      ) : (
        <button key={a.key} type="button" onClick={a.onClick} aria-expanded={a.expanded} aria-controls={a.controls} className={TERTIARY}>
          {a.icon} {a.label}
        </button>
      ),
    ),
    ...links,
  ];
  return (
    <div className={className}>
      {main.map((a, i) => {
        const phone = narrow ? ["max-sm:tracking-normal", i > 0 || a.label.length > 12 ? "max-sm:[&>svg]:hidden" : "", main.length === 1 ? "max-sm:col-span-2" : ""] : [];
        const cls = [a.className, ...phone].filter(Boolean).join(" ");
        const body = (
          <>
            {a.icon}
            {a.icon ? " " : null}
            {a.label}
          </>
        );
        return a.href ? (
          <InkLink key={a.key} href={a.href} tone={a.tone} size={a.size} className={cls}>
            {body}
          </InkLink>
        ) : (
          <InkButton key={a.key} ref={a.buttonRef} tone={a.tone} size={a.size} onClick={a.onClick} aria-expanded={a.expanded} aria-controls={a.controls} className={cls}>
            {body}
          </InkButton>
        );
      })}
      {note}
      {tail.length ? <div className={LINK_ROW}>{tail}</div> : null}
    </div>
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
  progress = null,
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
  progress?: IntroProgress | null;
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
  const narrow = useNarrowScreen();
  const adventure = narrow && progress && !mission && !missionPending && !picking ? progress : null;
  const sectioned = picking || Boolean(adventure);
  const confirmRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (confirming) confirmRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [confirming]);
  const begin = game.resumable && onNew ? (resume ? () => onPlay() : onNew) : () => onPlay(leveled ? suggested : undefined);
  const howFirst = narrow && !picking && !adventure && !mission && !missionPending && !(game.resumable && onNew);
  const recordText = copy.record(highScore > 0 ? formatNumber(highScore, locale) : "—");
  const helpAction: BarAction = {
    key: "help",
    label: showHelp ? (picking ? copy.showLevels(word) : adventure ? copy.showAdventure : copy.hideHelp) : copy.howTo,
    tone: "cream",
    onClick: onToggleHelp,
    expanded: showHelp,
    controls: "how-to-play-panel",
  };
  const playIcon = <PlayIcon className="size-7 text-ink" />;
  const introActions: BarAction[] = adventure
    ? [{ key: "play", label: game.resumable ? (resume ? copy.continueShort : copy.startShort) : copy.play, icon: playIcon, tone: "sun", size: "lg", onClick: begin, buttonRef: playRef }, helpAction]
    : mission
      ? [
          { key: "mission", label: copy.startMission, icon: <MissionIcon className="size-7 text-ink" />, tone: "sun", size: "lg", onClick: onStartMission, buttonRef: playRef },
          { key: "skip", label: copy.skipMission, tone: "cream", onClick: onSkipMission },
          helpAction,
        ]
      : game.resumable && onNew
        ? resume
          ? [
              { key: "play", label: copy.continueAdventure, icon: playIcon, tone: "sun", size: "lg", onClick: () => onPlay(), buttonRef: playRef },
              { key: "new", label: copy.newAdventure, icon: <RestartIcon className="size-5" />, tone: "cream", onClick: () => setConfirming(true), expanded: confirming },
              helpAction,
            ]
          : [{ key: "play", label: copy.startAdventure, icon: playIcon, tone: "sun", size: "lg", onClick: onNew, buttonRef: playRef }, helpAction]
        : [
            { key: "play", label: leveled ? copy.playLevel(word, suggested + 1) : copy.play, icon: playIcon, tone: "sun", size: "lg", onClick: () => onPlay(leveled ? suggested : undefined), buttonRef: playRef },
            ...(howFirst ? [] : [helpAction]),
          ];
  const help = (
    <div id="how-to-play-panel" className={sectioned ? "" : "mt-5 border-t-[3px] border-dashed border-ink/30 pt-4"}>
      {sectioned ? <h2 className="mb-3 font-display text-xl uppercase tracking-wide text-ink">{copy.howTo}</h2> : null}
      <ControlsList game={game} />
    </div>
  );
  return (
    <OverlayFrame
      label={copy.introLabel(game.title)}
      className={`flex max-h-full max-w-3xl flex-col p-5 sm:p-7 shorter:py-4 max-sm:max-h-none max-sm:py-5 [@media(max-height:540px)]:p-4 ${adventure || howFirst ? "max-sm:min-h-full" : "max-sm:block"}`}
    >
      <div className="grid shrink-0 items-center gap-4 sm:grid-cols-[1fr_auto]">
        <div className="[@media(max-height:540px)]:flex [@media(max-height:540px)]:items-center [@media(max-height:540px)]:gap-4">
          <GameTitle game={game} />
          <p className="mt-2 text-lg font-semibold leading-snug text-ink shorter:mt-1 shorter:text-base max-sm:mt-3 max-sm:text-base [@media(max-height:540px)]:mt-0 [@media(max-height:540px)]:text-sm">{game.objective}</p>
        </div>
        <div className="hidden sm:block [@media(max-height:540px)]:hidden">{Cast ? <Cast mood="intro" locale={locale} /> : <CastPair game={game} />}</div>
      </div>
      <div
        data-testid="intro-body"
        tabIndex={showHelp ? 0 : undefined}
        role={showHelp ? "region" : undefined}
        aria-label={showHelp ? copy.howTo : undefined}
        className="-mx-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-1 outline-none focus-visible:ring-4 focus-visible:ring-sun max-sm:overflow-visible"
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
        {sectioned && showHelp ? <div className="mt-5 shorter:mt-3">{help}</div> : null}
        {howFirst ? (
          <div id="how-to-play-panel" className="mt-5 shorter:mt-3">
            <div className="mb-3">
              <PickHeader title={copy.howTo} meta={recordText} />
            </div>
            <ControlsList game={game} />
          </div>
        ) : null}
        {adventure && !showHelp ? (
          <div className="mt-5 shorter:mt-3">
            <PickHeader title={copy.adventure} meta={recordText} />
            <div className="relative mt-3 pt-1">
              <PickCard
                badge={<MissionIcon className="size-5" />}
                title={adventure.title}
                text={adventure.text}
                tag={resume ? copy.leftOff : copy.startsHere}
                current
                footer={adventure.stats.map((stat) => (
                  <span key={stat.label} className="font-display text-[11px] uppercase tracking-wider text-ink-soft">
                    {stat.label} <span className="text-ink">{stat.value}</span>
                  </span>
                ))}
                onClick={begin}
              />
            </div>
            {resume && onNew && !confirming ? (
              <div className="mt-2 flex justify-end">
                <button type="button" onClick={() => setConfirming(true)} aria-expanded={confirming} className={`${TERTIARY} text-sm`}>
                  <RestartIcon className="size-4" /> {copy.newAdventure}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        {picking && !showHelp && game.levels && levels && (
          <div className="mt-5 shorter:mt-3">
            <PickHeader title={copy.chooseLevel(word)} meta={copy.starsTotal(totalStars, game.levels.length * 3)} />
            <ol className="mt-3 grid gap-x-2.5 gap-y-3 pt-1 sm:grid-cols-2 lg:grid-cols-3">
              {game.levels.map((level, i) => {
                const locked = i > levels.unlocked;
                const done = !locked && levels.stars[i] > 0;
                const current = !locked && i === suggested;
                return (
                  <li key={level.id} className="relative">
                    <PickCard
                      badge={locked ? <LockIcon className="size-5" /> : i + 1}
                      title={level.title}
                      text={locked ? copy.locked(word) : level.goal}
                      tag={copy.upNext}
                      current={current}
                      locked={locked}
                      done={done}
                      footer={
                        locked ? null : (
                          <>
                            <MiniStars count={levels.stars[i]} />
                            {done ? null : <span className="font-display text-[11px] uppercase tracking-wider text-ink-soft">{copy.noStars}</span>}
                          </>
                        )
                      }
                      onClick={() => onPlay(i)}
                    />
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        {resume && !adventure && <p className="mt-4 font-hand text-xl leading-snug text-ink-soft">{copy.saved}</p>}
        {confirming && !(adventure && showHelp) ? (
          <div ref={confirmRef} role="alertdialog" aria-label={copy.newAdventureLabel} className="mt-5 scroll-mb-28 rounded-xl border-[3px] border-ink bg-cream-2 p-4">
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
        {showHelp && !sectioned && !howFirst ? help : null}
      </div>
      <ActionBar
        className={`mt-5 flex shrink-0 flex-wrap items-center gap-3 shorter:mt-3 max-sm:sticky max-sm:-bottom-3 max-sm:z-10 max-sm:-mx-5 max-sm:-mb-5 max-sm:mt-4 max-sm:grid max-sm:grid-cols-2 max-sm:gap-2 max-sm:rounded-b-[inherit] max-sm:border-t-[3px] max-sm:border-ink max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:pt-3 max-sm:paper max-sm:[&>button]:min-h-11 max-sm:[&>button]:px-2 max-sm:[&>button]:text-[15px] max-[380px]:[&>button>svg]:hidden max-sm:[&>button_svg]:size-5 max-sm:[&>p]:col-span-2 max-sm:[&>p]:justify-center max-[380px]:[&>button]:gap-1 max-[380px]:[&>button]:leading-tight max-[380px]:[&>button]:[text-wrap:balance] max-[380px]:[&>button]:text-sm max-[380px]:[&>button]:tracking-normal max-[380px]:[&_svg]:size-4 ${missionPending ? "invisible" : ""}`}
        actions={introActions}
        note={
          !leveled && !mission && !adventure && !howFirst ? (
            <p className="flex items-center gap-1.5 px-1 font-display text-sm uppercase leading-none tracking-wide text-ink-soft">
              <TrophyIcon className="size-4" />
              <span>{copy.record(highScore > 0 ? formatNumber(highScore, locale) : "—")}</span>
            </p>
          ) : null
        }
      />
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
  const narrow = useNarrowScreen();
  const { play } = useSound();
  useEffect(() => {
    if (!result.won) return;
    const ids = Array.from({ length: result.stars }, (_, i) =>
      window.setTimeout(() => play("coin", { pitch: 1 + i * 0.15 }), 300 + i * 180),
    );
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [play, result.won, result.stars]);
  const title = result.copy?.title ?? (result.won ? game.copy?.winTitle : game.copy?.loseTitle) ?? (result.won ? copy.win : copy.lose);
  const nextAction: BarAction = { key: "next", label: copy.nextLevel(word), icon: <PlayIcon className="size-5 text-ink" />, tone: onNext && !mission ? "sun" : "cream", onClick: onNext };
  const resultActions: BarAction[] = [
    ...(onNext && !mission ? [{ ...nextAction, buttonRef: mainRef }] : []),
    {
      key: "restart",
      label: mission ? copy.retryMission : narrow && game.resumable ? copy.continueShort : (result.restartLabel ?? (result.level && word === "fase" ? copy.replayLevel : copy.playAgain)),
      icon: game.resumable ? <PlayIcon className="size-5 text-ink" /> : <RestartIcon className="size-5" />,
      tone: onNext && !mission ? "cream" : "sun",
      onClick: onRestart,
      buttonRef: onNext && !mission ? undefined : mainRef,
      className: onNext && !mission ? "max-[420px]:[&>svg]:hidden" : "sm:px-7",
    },
    ...(onNext && mission ? [nextAction] : []),
    ...(onAlt && result.alt ? [{ key: "alt", label: result.alt, icon: game.resumable ? <RestartIcon className="size-5" /> : <UsersIcon className="size-5" />, tone: "cream" as const, onClick: onAlt }] : []),
    ...(onLevels ? [] : [{ key: "catalog", label: copy.catalog, icon: narrow ? <ControllerIcon className="size-4" /> : undefined, tone: "cream" as const, href: "/games" }]),
  ];
  const actions = (
    <ActionBar
      className="mt-5 flex flex-wrap gap-3 max-sm:sticky max-sm:-bottom-3 max-sm:z-10 max-sm:-mx-5 max-sm:-mb-5 max-sm:mt-4 max-sm:grid max-sm:grid-cols-2 max-sm:gap-2 max-sm:rounded-b-[inherit] max-sm:border-t-[3px] max-sm:border-ink max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:pt-3 max-sm:paper max-sm:[&>*]:min-h-11 max-sm:[&>*]:px-2 max-sm:[&>*]:text-[15px] max-[380px]:[&>button>svg]:hidden max-[380px]:[&>a>svg]:hidden max-[380px]:[&>*]:gap-1 max-[380px]:[&>*]:leading-tight max-[380px]:[&>*]:[text-wrap:balance] max-[380px]:[&>*]:text-sm max-[380px]:[&>*]:tracking-normal max-[380px]:[&_svg]:size-4 wideshort:mt-3"
      actions={resultActions}
      links={[
        ...(onLevels
          ? [
              <button key="levels" type="button" onClick={onLevels} className={TERTIARY}>
                <LevelsIcon className="size-4" /> {copy.pickLevel(word)}
              </button>,
            ]
          : []),
        <Link key="room" href="/" className={TERTIARY}>
          <HouseIcon className="size-4" /> {copy.backToRoom}
        </Link>,
      ]}
    />
  );
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
              <div className="min-w-0 flex-1 max-sm:basis-40 max-sm:[container-type:inline-size] wideshort:basis-48">
                <h2 style={{ "--word": longestWord(title) } as CSSProperties} className="font-display text-[clamp(2.2rem,6vw,3.4rem)] uppercase leading-none tracking-wide text-ink max-sm:text-[min(clamp(1.6rem,8.4vw,2.2rem),calc(161cqw/var(--word)))] wideshort:text-[clamp(2rem,3.4vw,2.6rem)]">{title}</h2>
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
          {result.standings?.length ? <Standings rows={result.standings} label={copy.standings} /> : null}
          {result.facts?.length ? <Facts facts={result.facts} label={copy.facts} /> : null}
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
          {narrow ? null : actions}
        </div>
      </div>
      {narrow ? actions : null}
    </OverlayFrame>
  );
}

function Standings({ rows, label }: { rows: ResultStanding[]; label: string }) {
  const locale = useLocale();
  return (
    <ol aria-label={label} className="mt-5 grid grid-cols-4 gap-2 max-sm:mt-4 max-sm:gap-1.5 wideshort:mt-3">
      {rows.map((row, i) => (
        <motion.li
          key={`${row.name}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.08 }}
          className={`relative flex min-w-0 flex-col items-center rounded-xl border-[3px] border-ink px-1 pb-1.5 pt-2.5 text-center ${row.you ? "bg-sun shadow-[var(--shadow-ink-sm)]" : "bg-cream-2"}`}
        >
          <span className="absolute -left-2 -top-2.5 rounded-md border-2 border-ink bg-cream px-1 font-display text-sm leading-tight text-ink">{ordinal(i + 1, locale)}</span>
          {row.avatar ? (
            <span aria-hidden className="size-11 shrink-0 rounded-full border-[3px] border-ink bg-[length:128%] bg-[position:50%_30%] bg-no-repeat max-[360px]:size-9" style={{ backgroundColor: row.color, backgroundImage: `url(${row.avatar})` }} />
          ) : null}
          <span className="mt-1 w-full truncate font-display text-sm uppercase leading-tight tracking-wide text-ink max-[360px]:text-xs">{row.name}</span>
          {row.detail ? <span className="sr-only">{row.detail}</span> : null}
          <span className="font-display text-sm leading-tight tabular-nums text-ink-soft max-[360px]:text-xs">{row.value}</span>
        </motion.li>
      ))}
    </ol>
  );
}

function Facts({ facts, label }: { facts: ResultFact[]; label: string }) {
  return (
    <dl aria-label={label} className="mt-2 grid grid-cols-4 gap-1.5">
      {facts.map((fact, i) => (
        <motion.div key={fact.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.06 }} className="flex flex-col-reverse items-center rounded-lg border-2 border-dashed border-ink/25 px-1 py-1.5 text-center">
          <dt className="mt-0.5 text-[11px] font-bold leading-tight text-ink-soft sm:text-xs">{fact.label}</dt>
          <dd className="font-display text-lg leading-none tabular-nums text-ink">{fact.value}</dd>
        </motion.div>
      ))}
    </dl>
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
