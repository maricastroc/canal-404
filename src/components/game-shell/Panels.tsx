"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { StarBadge } from "@/components/art/Badges";
import { GAME_CAST } from "@/components/art/GameCast";
import { PlayIcon, RestartIcon, UsersIcon } from "@/components/art/Icons";
import { GAME_LOGOS } from "@/components/art/GameLogos";
import { LockIcon } from "@/components/art/Icons";
import { KidBust } from "@/components/characters/Heads";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkButton, InkLink } from "@/components/ui/Primitives";
import type { GameMeta } from "@/games/registry";
import type { GameResult } from "@/games/types";
import { useSound } from "@/lib/audio/hooks";

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
    <div className="absolute inset-0 z-30 grid place-items-center overflow-y-auto bg-plum-950/70 p-3 backdrop-blur-[1px] sm:p-6">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={{ opacity: 0, scale: 0.88, rotate: -2, y: 20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        className={`paper relative w-full border-[3px] border-ink shadow-[var(--shadow-ink-lg)] wobbly ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ControlsList({ game }: { game: GameMeta }) {
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
        {game.controls?.map((c) => (
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
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString("pt-BR"));
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const controls = animate(mv, value, reduced ? { duration: 0.01 } : { duration: 0.9, delay, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, value, delay]);
  return (
    <>
      <span className="sr-only">{value.toLocaleString("pt-BR")}</span>
      <motion.span aria-hidden>{text}</motion.span>
    </>
  );
}

function GameTitle({ game }: { game: GameMeta }) {
  const Logo = GAME_LOGOS[game.slug];
  return Logo ? (
    <h1>
      <Logo className="w-full max-w-md" />
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
  return (
    <span role="img" aria-label={`${count} de ${total} estrelas`} className="inline-flex gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} aria-hidden className={`text-xl leading-none ${i < count ? "text-sun" : "text-cream-3"}`} style={{ textShadow: "1.5px 2px 0 #1d1830" }}>
          ★
        </span>
      ))}
    </span>
  );
}

export function IntroPanel({
  game,
  highScore,
  levels,
  showHelp,
  onToggleHelp,
  onPlay,
}: {
  game: GameMeta;
  highScore: number;
  levels?: LevelProgress;
  showHelp: boolean;
  onToggleHelp: () => void;
  onPlay: (level?: number) => void;
}) {
  const playRef = useAutoFocus<HTMLButtonElement>();
  const leveled = Boolean(game.levels && levels);
  const word = game.levelWord ?? "fase";
  const Cast = GAME_CAST[game.slug];
  const totalStars = levels ? levels.stars.reduce((a, b) => a + b, 0) : 0;
  const suggested = levels ? Math.min(levels.suggested, levels.unlocked) : 0;
  return (
    <OverlayFrame label={`${game.title}: tela de apresentação`} className="max-w-3xl p-5 sm:p-7">
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <GameTitle game={game} />
          <p className="mt-2 text-lg font-semibold leading-snug text-ink">{game.objective}</p>
        </div>
        <div className="hidden sm:block">{Cast ? <Cast mood="intro" /> : <CastPair game={game} />}</div>
      </div>
      {leveled && game.levels && levels && (
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl uppercase tracking-wide text-ink">Escolha a {word}</h2>
            <p className="font-display text-sm uppercase tracking-wide text-ink-soft">
              Estrelas: {totalStars}/{game.levels.length * 3}
            </p>
          </div>
          <ol className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {game.levels.map((level, i) => {
              const locked = i > levels.unlocked;
              return (
                <li key={level.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onPlay(i)}
                    className={`press flex h-full w-full items-center gap-3 rounded-xl border-[3px] border-ink p-2.5 text-left shadow-[var(--shadow-ink-sm)] disabled:cursor-not-allowed disabled:opacity-60 ${
                      i === suggested ? "bg-sun" : "bg-cream-2"
                    }`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-paper font-display text-lg text-ink">
                      {locked ? <LockIcon className="size-6" /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-base uppercase leading-tight text-ink">{level.title}</span>
                      <span className="block text-xs leading-snug text-ink-soft">
                        {locked ? (word === "arena" ? "Vença a arena anterior" : "Termine a fase anterior") : level.goal}
                      </span>
                      {!locked && levels.stars[i] > 0 && <MiniStars count={levels.stars[i]} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <InkButton ref={playRef} size="lg" tone="sun" onClick={() => onPlay(leveled ? suggested : undefined)}>
          <PlayIcon className="size-7 text-ink" /> {leveled ? `Jogar ${word} ${suggested + 1}` : "Jogar"}
        </InkButton>
        <InkButton tone="cream" onClick={onToggleHelp} aria-expanded={showHelp} aria-controls="how-to-play-panel">
          {showHelp ? "Esconder instruções" : "Como jogar"}
        </InkButton>
        {!leveled && (
          <p className="ml-auto rounded-lg border-[3px] border-ink bg-cream-2 px-3 py-1 font-display text-sm uppercase tracking-wide text-ink">
            Recorde: {highScore > 0 ? highScore.toLocaleString("pt-BR") : "—"}
          </p>
        )}
      </div>
      {showHelp && (
        <div id="how-to-play-panel" className="mt-5 border-t-[3px] border-dashed border-ink/30 pt-4">
          <ControlsList game={game} />
        </div>
      )}
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
  onRestart: () => void;
  showHelp: boolean;
  onToggleHelp: () => void;
}) {
  const resumeRef = useAutoFocus<HTMLButtonElement>();
  return (
    <OverlayFrame label="Jogo pausado" className="max-w-2xl p-5 sm:p-7">
      <div className="flex items-center gap-4">
        <Mascot404 expression="sleepy" className="w-24 shrink-0" />
        <div>
          <h2 className="font-display text-5xl uppercase tracking-wide text-ink">Pausa</h2>
          <p className="font-hand text-xl text-ink-soft">O 404 aproveitou para tirar um cochilo.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <InkButton ref={resumeRef} tone="sun" onClick={onResume}>
          <PlayIcon className="size-5 text-ink" /> Continuar
        </InkButton>
        <InkButton tone="mint" onClick={onRestart}>
          <RestartIcon className="size-5" /> Recomeçar
        </InkButton>
        <InkButton tone="cream" onClick={onToggleHelp} aria-expanded={showHelp}>
          {showHelp ? "Esconder instruções" : "Como jogar"}
        </InkButton>
        <InkLink href={`/games/${game.slug}`} tone="cream">
          Sair do jogo
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
  onRestart,
  onNext,
  onLevels,
  onAlt,
}: {
  game: GameMeta;
  result: GameResult;
  isRecord: boolean;
  recordNote: string;
  onRestart: () => void;
  onNext?: () => void;
  onLevels?: () => void;
  onAlt?: () => void;
}) {
  const word = game.levelWord ?? "fase";
  const Word = word[0].toUpperCase() + word.slice(1);
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
  const title = result.copy?.title ?? (result.won ? game.copy?.winTitle : game.copy?.loseTitle) ?? (result.won ? "Vitória!" : "Fim de jogo");
  const text = result.copy?.text ?? (result.won ? game.copy?.winText : game.copy?.loseText) ?? "";
  return (
    <OverlayFrame label={result.won ? `Vitória: ${title}` : `Fim de jogo: ${title}`} className="max-w-2xl p-5 sm:p-7">
      {isRecord && (
        <span className="absolute -right-3 -top-4 rotate-12 rounded-lg border-[3px] border-ink bg-bubblegum px-3 py-1 font-display text-lg uppercase tracking-wider text-ink shadow-[var(--shadow-ink)]">
          {result.level ? "Melhor resultado!" : "Novo recorde!"}
        </span>
      )}
      {result.level && (
        <p className="mb-2 inline-block -rotate-1 rounded-md border-[3px] border-ink bg-mint px-2 font-display text-sm uppercase tracking-wider text-ink">
          {Word} {result.level.index + 1} de {result.level.total} · {result.level.title}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        {Cast ? (
          <Cast mood={result.won ? "win" : "lose"} featured={result.featured} />
        ) : result.won ? (
          <CastPair game={game} happy />
        ) : (
          <Mascot404 expression="sad" className="w-24 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[clamp(2.2rem,6vw,3.4rem)] uppercase leading-none tracking-wide text-ink">{title}</h2>
          {text && <p className="mt-1 font-hand text-xl leading-snug text-ink-soft">{text}</p>}
        </div>
      </div>
      {result.won && (
        <div className="mt-4 flex justify-center gap-2" aria-label={`${result.stars} de 3 estrelas`} role="img">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.25 + i * 0.18, type: "spring", stiffness: 400, damping: 14 }}
              className={`w-16 sm:w-20 ${i < result.stars ? "" : "opacity-30 grayscale"}`}
            >
              <StarBadge color={i < result.stars ? "sun" : "plum"} className="w-full" />
            </motion.div>
          ))}
        </div>
      )}
      {result.summary && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="mt-2 text-center font-display text-base uppercase tracking-wide text-ink"
        >
          {result.summary}
        </motion.p>
      )}
      <dl className="mt-5 divide-y-2 divide-dashed divide-ink/25 rounded-xl border-[3px] border-ink bg-cream-2 px-4 py-2">
        {result.breakdown.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12 }}
            className="flex items-baseline justify-between gap-4 py-1.5"
          >
            <dt className="text-ink-soft">{row.label}</dt>
            <dd className={`font-display text-lg tabular-nums ${row.value < 0 ? "text-tomato-deep" : "text-ink"}`}>
              {row.value < 0 ? "−" : "+"}
              {Math.abs(row.value).toLocaleString("pt-BR")}
            </dd>
          </motion.div>
        ))}
        <div className="flex items-baseline justify-between gap-4 py-2">
          <dt className="font-display text-xl uppercase tracking-wide text-ink">Total</dt>
          <dd className="font-display text-3xl tabular-nums text-ink">
            <CountUp value={result.score} delay={0.3 + result.breakdown.length * 0.12} />
          </dd>
        </div>
      </dl>
      {recordNote && <p className="mt-2 text-sm text-ink-soft">{recordNote}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        {onNext ? (
          <InkButton ref={mainRef} tone="sun" onClick={onNext}>
            <PlayIcon className="size-5 text-ink" /> Próxima {word}
          </InkButton>
        ) : null}
        <InkButton ref={onNext ? undefined : mainRef} tone={onNext ? "mint" : "sun"} onClick={onRestart}>
          <RestartIcon className="size-5" /> {result.level && word === "fase" ? "Refazer fase" : "Jogar de novo"}
        </InkButton>
        {onAlt && result.alt ? (
          <InkButton tone="cream" onClick={onAlt}>
            <UsersIcon className="size-5" /> {result.alt}
          </InkButton>
        ) : null}
        {onLevels ? (
          <InkButton tone="cream" onClick={onLevels}>
            Escolher {word}
          </InkButton>
        ) : (
          <InkLink href="/games" tone="mint">
            Ver catálogo
          </InkLink>
        )}
        <InkLink href="/" tone="cream">
          Voltar à sala
        </InkLink>
      </div>
    </OverlayFrame>
  );
}

export function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  const ref = useAutoFocus<HTMLButtonElement>();
  return (
    <OverlayFrame label="Erro ao carregar" className="max-w-xl p-6">
      <div className="flex items-center gap-4">
        <Mascot404 expression="static" className="w-24 shrink-0" />
        <div>
          <h2 className="font-display text-3xl uppercase text-ink">Sinal perdido</h2>
          <p className="font-hand text-xl text-ink-soft">Não conseguimos sintonizar o jogo. Tenta de novo?</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <InkButton ref={ref} tone="sun" onClick={onRetry}>
          Tentar de novo
        </InkButton>
        <InkLink href="/games" tone="cream">
          Voltar ao catálogo
        </InkLink>
      </div>
    </OverlayFrame>
  );
}
