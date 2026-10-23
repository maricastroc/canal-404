"use client";

import { motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { StarBadge } from "@/components/art/Badges";
import { PlayTriangle, RestartIcon } from "@/components/art/Icons";
import { RuaLogo } from "@/components/art/GameLogos";
import { KidBust } from "@/components/characters/Heads";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkButton, InkLink } from "@/components/ui/Primitives";
import type { GameMeta } from "@/games/registry";
import type { GameResult } from "@/games/types";

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

export function IntroPanel({
  game,
  highScore,
  showHelp,
  onToggleHelp,
  onPlay,
}: {
  game: GameMeta;
  highScore: number;
  showHelp: boolean;
  onToggleHelp: () => void;
  onPlay: () => void;
}) {
  const playRef = useAutoFocus<HTMLButtonElement>();
  return (
    <OverlayFrame label={`${game.title}: tela de apresentação`} className="max-w-3xl p-5 sm:p-7">
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <h1>
            <RuaLogo className="w-full max-w-md" />
          </h1>
          <p className="mt-2 text-lg font-semibold leading-snug text-ink">{game.objective}</p>
        </div>
        <div className="hidden gap-1 sm:flex">
          <KidBust who="deco" face="happy" className="w-24 -rotate-6" />
          <KidBust who="lina" face="wow" className="w-24 rotate-6" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <InkButton ref={playRef} size="lg" tone="sun" onClick={onPlay}>
          <PlayTriangle className="size-7 text-ink" /> Jogar
        </InkButton>
        <InkButton tone="cream" onClick={onToggleHelp} aria-expanded={showHelp} aria-controls="como-jogar-painel">
          {showHelp ? "Esconder instruções" : "Como jogar"}
        </InkButton>
        <p className="ml-auto rounded-lg border-[3px] border-ink bg-cream-2 px-3 py-1 font-display text-sm uppercase tracking-wide text-ink">
          Recorde: {highScore > 0 ? highScore.toLocaleString("pt-BR") : "—"}
        </p>
      </div>
      {showHelp && (
        <div id="como-jogar-painel" className="mt-5 border-t-[3px] border-dashed border-ink/30 pt-4">
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
          <PlayTriangle className="size-5 text-ink" /> Continuar
        </InkButton>
        <InkButton tone="mint" onClick={onRestart}>
          <RestartIcon className="size-5" /> Recomeçar
        </InkButton>
        <InkButton tone="cream" onClick={onToggleHelp} aria-expanded={showHelp}>
          {showHelp ? "Esconder instruções" : "Como jogar"}
        </InkButton>
        <InkLink href={`/jogos/${game.slug}`} tone="cream">
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
  result,
  isRecord,
  previousBest,
  onRestart,
}: {
  result: GameResult;
  isRecord: boolean;
  previousBest: number;
  onRestart: () => void;
}) {
  const againRef = useAutoFocus<HTMLButtonElement>();
  return (
    <OverlayFrame label={result.won ? "Vitória" : "Fim de jogo"} className="max-w-2xl p-5 sm:p-7">
      {isRecord && (
        <span className="absolute -right-3 -top-4 rotate-12 rounded-lg border-[3px] border-ink bg-bubblegum px-3 py-1 font-display text-lg uppercase tracking-wider text-ink shadow-[var(--shadow-ink)]">
          Novo recorde!
        </span>
      )}
      <div className="flex flex-wrap items-center gap-4">
        {result.won ? (
          <div className="flex shrink-0">
            <KidBust who="deco" face="happy" className="w-20 -rotate-6" />
            <KidBust who="lina" face="happy" className="-ml-4 w-20 rotate-6" />
          </div>
        ) : (
          <Mascot404 expression="sad" className="w-24 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[clamp(2.2rem,6vw,3.4rem)] uppercase leading-none tracking-wide text-ink">
            {result.won ? "Bagunça completa!" : "Acabou a munição!"}
          </h2>
          <p className="mt-1 font-hand text-xl leading-snug text-ink-soft">
            {result.won
              ? "O quintal do Seu Arlindo nunca mais será o mesmo."
              : "Os enfeites do Seu Arlindo sobreviveram. Por enquanto."}
          </p>
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
      <dl className="mt-5 divide-y-2 divide-dashed divide-ink/25 rounded-xl border-[3px] border-ink bg-cream-2 px-4 py-2">
        {result.breakdown.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-ink-soft">{row.label}</dt>
            <dd className="font-display text-lg tabular-nums text-ink">+{row.value.toLocaleString("pt-BR")}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 py-2">
          <dt className="font-display text-xl uppercase tracking-wide text-ink">Total</dt>
          <dd className="font-display text-3xl tabular-nums text-ink">{result.score.toLocaleString("pt-BR")}</dd>
        </div>
      </dl>
      <p className="mt-2 text-sm text-ink-soft">
        {isRecord
          ? previousBest > 0
            ? `Seu recorde anterior era ${previousBest.toLocaleString("pt-BR")}.`
            : "Primeiro recorde registrado neste computador."
          : `Recorde atual: ${previousBest.toLocaleString("pt-BR")}.`}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <InkButton ref={againRef} tone="sun" onClick={onRestart}>
          <RestartIcon className="size-5" /> Jogar de novo
        </InkButton>
        <InkLink href="/jogos" tone="mint">
          Ver catálogo
        </InkLink>
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
        <InkLink href="/jogos" tone="cream">
          Voltar ao catálogo
        </InkLink>
      </div>
    </OverlayFrame>
  );
}
