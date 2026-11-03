"use client";

import { motion } from "motion/react";
import { OfflineIcon } from "@/components/art/Icons";
import { NicknameForm } from "@/components/competition/NicknameForm";
import type { GameMeta } from "@/games/registry";
import type { JoinOutcome, SubmitOutcome } from "@/lib/competition/client";
import { formatBest, ordinal } from "@/lib/competition/format";
import { isGameSlug } from "@/lib/competition/boards";

export type BoardState = { phase: "sending" } | { phase: "join" } | { phase: "done"; outcome: SubmitOutcome };

type Line = { headline?: string; text: string; live?: boolean; offline?: boolean; record?: boolean };

export function describeBoard(game: GameMeta, outcome: SubmitOutcome): Line | null {
  const word = game.levelWord ?? "fase";
  switch (outcome.kind) {
    case "queued":
      return { text: "Placar fora do ar. Guardamos o resultado e enviamos quando o sinal voltar.", offline: true };
    case "rejected":
      return { headline: "O placar não aceitou", text: outcome.message };
    case "not-joined":
      return null;
    case "unranked":
      if (outcome.why === "unconfigured") return null;
      if (outcome.why === "expired") return { text: "Esse resultado demorou demais para chegar ao placar." };
      if (outcome.why === "limited") return { text: outcome.message ?? "Muitos envios seguidos. Espere um pouco." };
      return { text: "O placar estava fora do ar quando a partida começou. Este resultado ficou só neste computador.", offline: true };
    case "accepted": {
      const { run, board } = outcome.response;
      if (!board) return { text: "Fase de treino não entra no placar." };
      if (run.ineligible === "resumed") return { text: "Partidas retomadas do sino não entram no placar. Jogue a fase inteira para competir." };
      if (run.ineligible === "no_points") return { text: "Sem pontos, sem placar. Fica para a próxima!" };
      const slug = isGameSlug(game.slug) ? game.slug : null;
      const best = board.best && slug ? formatBest(slug, board.best.metrics) : "";
      const place = board.position ? `${ordinal(board.position)} de ${board.total.toLocaleString("pt-BR")}` : "";
      if (run.ineligible === "not_won") {
        return { text: board.best ? `Só vitórias entram no placar desta ${word}. Seu melhor: ${best} (${place}).` : `Só vitórias entram no placar desta ${word}.` };
      }
      if (board.improved && board.position) {
        return {
          headline: board.position === 1 ? "Primeiro lugar no placar!" : "Novo recorde pessoal!",
          text: `${best}. Você está em ${place}.`,
          live: true,
          record: true,
        };
      }
      if (board.best) return { text: `Seu melhor no placar: ${best}. Você está em ${place}.`, live: true };
      return { text: "Resultado registrado no placar.", live: true };
    }
  }
}

export function BoardLine({ game, state, onJoin }: { game: GameMeta; state: BoardState; onJoin: (nickname: string) => Promise<JoinOutcome> }) {
  const line =
    state.phase === "sending"
      ? ({ text: "Transmitindo seu resultado…", live: true } satisfies Line)
      : state.phase === "join"
        ? null
        : describeBoard(game, state.outcome);
  if (state.phase === "done" && !line) return null;
  return (
    <motion.section
      aria-label="Placar do canal"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="on-dark mt-3 rounded-xl border-[3px] border-ink bg-plum-900 p-3 text-cream shadow-[var(--shadow-ink-sm)] scanlines"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border-2 border-ink bg-sun px-1.5 font-display text-xs uppercase leading-5 tracking-wider text-ink">Placar do canal</span>
        {line?.live ? (
          <span className="flex items-center gap-1 font-display text-xs uppercase leading-5 tracking-wider text-lime">
            <span aria-hidden className="size-2 animate-pulse rounded-full bg-lime" /> Ao vivo
          </span>
        ) : null}
        {line?.offline ? (
          <span className="flex items-center gap-1 font-display text-xs uppercase leading-5 tracking-wider text-sun">
            <OfflineIcon className="size-4" /> Sem sinal
          </span>
        ) : null}
      </div>
      {state.phase === "join" ? (
        <>
          <p className="mt-1.5 font-semibold leading-snug">Quer ver seu nome no placar do canal? Escolha um apelido e este resultado entra na disputa.</p>
          <NicknameForm dark submitLabel="Entrar no placar" onSubmit={onJoin} />
        </>
      ) : (
        <div role="status" className="mt-1.5 leading-snug">
          {line?.headline ? <p className={`font-display text-lg uppercase tracking-wide ${line.record ? "text-sun" : "text-cream"}`}>{line.headline}</p> : null}
          <p className="font-semibold">{line?.text}</p>
        </div>
      )}
    </motion.section>
  );
}
