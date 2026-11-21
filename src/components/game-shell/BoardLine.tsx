"use client";

import Link from "@/i18n/Link";
import { motion, useReducedMotion } from "motion/react";
import { OfflineIcon, TrophyIcon } from "@/components/art/Icons";
import { NicknameForm } from "@/components/competition/NicknameForm";
import { Mascot404 } from "@/components/mascot/Mascot404";
import type { GameMeta } from "@/games/registry";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import type { JoinOutcome, SubmitOutcome } from "@/lib/competition/client";
import { formatBest, ordinal } from "@/lib/competition/format";
import { BOARD_META, isGameSlug, type GameSlug } from "@/lib/competition/boards";
import { serverMessage } from "@/lib/competition/errors";
import { recordsHref } from "@/lib/competition/links";
import { boardNickname } from "@/lib/competition/nickname";

export type BoardState = { phase: "sending" } | { phase: "join"; waiting: number } | { phase: "done"; outcome: SubmitOutcome };

type Line = { headline?: string; text: string; rival?: string; href?: string; live?: boolean; offline?: boolean; record?: boolean; stamp?: boolean };

const COPY = localized({
  "pt-BR": {
    label: { fase: "Placar da fase", arena: "Placar da arena", pista: "Placar da pista", parte: "Placar da parte", game: "Placar do jogo" },
    here: { fase: "desta fase", arena: "desta arena", pista: "desta pista", parte: "desta parte", game: "deste jogo" },
    queued: "Placar fora do ar. Guardamos o resultado e enviamos quando o sinal voltar.",
    rejectedTitle: "O placar não aceitou",
    rejected: "O placar não aceitou este resultado.",
    expired: "Esse resultado demorou demais para chegar ao placar.",
    limited: "Muitos envios seguidos. Espere um pouco.",
    noTicket: "O placar estava fora do ar quando a partida começou. Este resultado ficou só no seu progresso.",
    outdatedTitle: "O jogo foi atualizado",
    outdated: "Esta página ficou com a versão anterior. Recarregue a página para jogar a nova e voltar ao placar.",
    practice: "Este foi só o aquecimento! A fase de treino não vale pontos no placar global.",
    resumed: "Partidas retomadas do sino não entram no placar. Jogue a fase inteira para competir.",
    hinted: "Partidas com dica não entram no placar. Tente a parte de novo sem espiar o caderno para competir.",
    noPoints: "Sem pontos, sem placar. Fica para a próxima!",
    place: (position: string, total: number) => `${position} de ${formatNumber(total, "pt-BR")}`,
    rival: (name: string, best: string) => `Recorde do canal: ${name} · ${best}.`,
    notWonBest: (here: string, best: string, place: string) => `Só vitórias entram no placar ${here}. Seu melhor continua ${best}, ${place}.`,
    notWon: (here: string) => `Só vitórias entram no placar ${here}.`,
    openedTitle: "Placar inaugurado",
    opened: (mark: string) => `Você inaugurou o placar! Agora é esperar alguém tentar superar ${mark}.`,
    recordTitle: "Recorde do canal!",
    record: (best: string, total: number) => `${best}. Você passou na frente de todo mundo: 1º de ${formatNumber(total, "pt-BR")}.`,
    joinedTitle: "Você entrou no placar",
    joined: (best: string, place: string) => `${best}. Você está em ${place}.`,
    personalTitle: "Novo recorde pessoal!",
    personal: (best: string, place: string) => `${best}. Agora você está em ${place}.`,
    aloneBest: (best: string, here: string) => `Seu melhor continua ${best}. O placar ${here} segue só seu: ninguém apareceu para tentar superar.`,
    holder: "O recorde do canal continua com você.",
    stillBest: (best: string, place: string) => `Seu melhor continua ${best}, ${place}.`,
    registered: "Resultado registrado no placar.",
    points: (points: number) => `seus ${formatNumber(points, "pt-BR")} ${points === 1 ? "ponto" : "pontos"}`,
    mark: (best: string) => `sua marca: ${best}`,
    stamp: "Recorde!",
    sending: "Transmitindo seu resultado…",
    live: "Ao vivo",
    noSignal: "Sem sinal",
    join: "Quer ver seu nome no placar? Escolha um apelido e este resultado entra na disputa.",
    waiting: (count: number) => (count === 1 ? "Mais 1 resultado seu está esperando o apelido e entra junto." : `Mais ${formatNumber(count, "pt-BR")} resultados seus estão esperando o apelido e entram juntos.`),
    joinButton: "Entrar no placar",
    arcade: "Ver o fliperama de recordes",
  },
  en: {
    label: { fase: "Level board", arena: "Arena board", pista: "Track board", parte: "Part board", game: "Game board" },
    here: { fase: "for this level", arena: "for this arena", pista: "for this track", parte: "for this part", game: "for this game" },
    queued: "The board is off the air. We saved your result and will send it when the signal comes back.",
    rejectedTitle: "The board didn't accept it",
    rejected: "The board didn't accept this result.",
    expired: "This result took too long to reach the board.",
    limited: "Too many submissions in a row. Wait a little.",
    noTicket: "The board was off the air when the run started. This result only went into your progress.",
    outdatedTitle: "The game was updated",
    outdated: "This page still has the previous version. Reload it to play the new one and get back on the board.",
    practice: "That was just the warm-up! The practice level doesn't count on the global board.",
    resumed: "Runs resumed from a bell don't go on the board. Play the whole level to compete.",
    hinted: "Runs with a hint don't go on the board. Play the part again without peeking to compete.",
    noPoints: "No points, no board. Better luck next time!",
    place: (position: string, total: number) => `${position} of ${formatNumber(total, "en")}`,
    rival: (name: string, best: string) => `Channel record: ${name} · ${best}.`,
    notWonBest: (here: string, best: string, place: string) => `Only wins go on the board ${here}. Your best is still ${best}, ${place}.`,
    notWon: (here: string) => `Only wins go on the board ${here}.`,
    openedTitle: "Board opened",
    opened: (mark: string) => `You opened the board! Now wait for someone to try to beat ${mark}.`,
    recordTitle: "Channel record!",
    record: (best: string, total: number) => `${best}. You got ahead of everyone: 1st of ${formatNumber(total, "en")}.`,
    joinedTitle: "You made the board",
    joined: (best: string, place: string) => `${best}. You're in ${place}.`,
    personalTitle: "New personal record!",
    personal: (best: string, place: string) => `${best}. Now you're in ${place}.`,
    aloneBest: (best: string, here: string) => `Your best is still ${best}. The board ${here} is still all yours: nobody has shown up to try to beat it.`,
    holder: "The channel record is still yours.",
    stillBest: (best: string, place: string) => `Your best is still ${best}, ${place}.`,
    registered: "Result recorded on the board.",
    points: (points: number) => `your ${formatNumber(points, "en")} ${points === 1 ? "point" : "points"}`,
    mark: (best: string) => `your mark: ${best}`,
    stamp: "Record!",
    sending: "Broadcasting your result…",
    live: "Live",
    noSignal: "No signal",
    join: "Want to see your name on the board? Pick a nickname and this result joins the race.",
    waiting: (count: number) => (count === 1 ? "1 more of your results is waiting for the nickname and goes up with it." : `${formatNumber(count, "en")} more of your results are waiting for the nickname and go up with it.`),
    joinButton: "Join the board",
    arcade: "Visit the record arcade",
  },
});

type Copy = (typeof COPY)[Locale];

function levelKind(game: GameMeta) {
  return game.levels ? (game.levelWord ?? "fase") : "game";
}

export function boardLabel(game: GameMeta, locale: Locale) {
  return COPY[locale].label[levelKind(game)];
}

export function describeBoard(game: GameMeta, outcome: SubmitOutcome, locale: Locale): Line | null {
  const copy = COPY[locale];
  const here = copy.here[levelKind(game)];
  switch (outcome.kind) {
    case "queued":
      return { text: copy.queued, offline: true };
    case "rejected":
      return { headline: copy.rejectedTitle, text: serverMessage(outcome.error, copy.rejected, locale) };
    case "not-joined":
      return null;
    case "unranked":
      if (outcome.why === "unconfigured") return null;
      if (outcome.why === "expired") return { text: copy.expired };
      if (outcome.why === "limited") return { text: serverMessage(outcome.error, copy.limited, locale) };
      if (outcome.why === "outdated") return { headline: copy.outdatedTitle, text: copy.outdated };
      return { text: copy.noTicket, offline: true };
    case "accepted": {
      const { run, board } = outcome.response;
      if (!board) return { text: copy.practice };
      if (run.ineligible === "resumed") return { text: copy.resumed };
      if (run.ineligible === "hinted") return { text: copy.hinted };
      if (run.ineligible === "no_points") return { text: copy.noPoints };
      const slug = isGameSlug(game.slug) ? game.slug : null;
      const best = board.best && slug ? formatBest(slug, board.best.metrics, locale) : "";
      const place = board.position ? copy.place(ordinal(board.position, locale), board.total) : "";
      const alone = board.position === 1 && board.total === 1;
      const href = slug ? recordsHref(slug, levelOfBoard(board.id)) : undefined;
      const leader = board.leader;
      const rival = leader && !leader.you && slug ? copy.rival(`${boardNickname(leader.nickname)} #${leader.tag}`, formatBest(slug, leader.metrics, locale)) : undefined;
      if (run.ineligible === "not_won") {
        return { text: board.best ? copy.notWonBest(here, best, place) : copy.notWon(here), rival, href };
      }
      if (board.improved && board.position) {
        if (alone) return { headline: copy.openedTitle, text: copy.opened(markToBeat(slug, board.best?.metrics ?? [], best, copy)), href, live: true, record: true };
        if (board.position === 1) return { headline: copy.recordTitle, text: copy.record(best, board.total), href, live: true, record: true, stamp: true };
        if (!board.previous) return { headline: copy.joinedTitle, text: copy.joined(best, place), rival, href, live: true };
        return { headline: copy.personalTitle, text: copy.personal(best, place), rival, href, live: true, record: true };
      }
      if (board.best && alone) return { text: copy.aloneBest(best, here), href, live: true };
      const holder = leader?.you ? copy.holder : undefined;
      if (board.best) return { text: copy.stillBest(best, place), rival: rival ?? holder, href, live: true };
      return { text: copy.registered, rival, href, live: true };
    }
  }
}

function markToBeat(slug: GameSlug | null, metrics: number[], best: string, copy: Copy) {
  const first = slug ? BOARD_META[slug].metrics[0] : null;
  if (first?.unit === "points") return copy.points(metrics[0] ?? 0);
  return copy.mark(best);
}

function levelOfBoard(id: string) {
  const level = id.split("/")[1];
  return level && level !== "all" ? level : null;
}

function RecordStamp() {
  const still = useReducedMotion();
  const copy = useCopy(COPY);
  return (
    <motion.span
      aria-hidden
      initial={still ? false : { scale: 2.4, rotate: -24, opacity: 0 }}
      animate={{ scale: 1, rotate: -6, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.7 }}
      className="inline-flex items-center gap-1 rounded-md border-[3px] border-ink bg-tomato px-2 font-display text-sm uppercase leading-6 tracking-wider text-ink shadow-[var(--shadow-ink-sm)]"
    >
      <TrophyIcon className="size-4" /> {copy.stamp}
    </motion.span>
  );
}

export function BoardLine({ game, state, onJoin }: { game: GameMeta; state: BoardState; onJoin: (nickname: string) => Promise<JoinOutcome> }) {
  const copy = useCopy(COPY);
  const locale = useLocale();
  const label = boardLabel(game, locale);
  const line =
    state.phase === "sending"
      ? ({ text: copy.sending, live: true } satisfies Line)
      : state.phase === "join"
        ? null
        : describeBoard(game, state.outcome, locale);
  if (state.phase === "done" && !line) return null;
  return (
    <motion.section
      aria-label={label}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="on-dark mt-3 rounded-xl border-[3px] border-ink bg-plum-900 p-3 text-cream shadow-[var(--shadow-ink-sm)] scanlines"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border-2 border-ink bg-sun px-1.5 font-display text-xs uppercase leading-5 tracking-wider text-ink">{label}</span>
        {line?.live ? (
          <span className="flex items-center gap-1 font-display text-xs uppercase leading-5 tracking-wider text-lime">
            <span aria-hidden className="size-2 animate-pulse rounded-full bg-lime" /> {copy.live}
          </span>
        ) : null}
        {line?.offline ? (
          <span className="flex items-center gap-1 font-display text-xs uppercase leading-5 tracking-wider text-sun">
            <OfflineIcon className="size-4" /> {copy.noSignal}
          </span>
        ) : null}
      </div>
      {state.phase === "join" ? (
        <>
          <p className="copy mt-1.5 font-semibold">{copy.join}</p>
          {state.waiting > 0 ? <p className="copy-sm mt-1 text-cream-2">{copy.waiting(state.waiting)}</p> : null}
          <NicknameForm dark submitLabel={copy.joinButton} onSubmit={onJoin} />
        </>
      ) : (
        <div className="mt-1.5 flex items-start gap-3">
          {line?.record || line?.offline ? <Mascot404 expression={line.record ? "excited" : "static"} className="w-14 shrink-0" /> : null}
          <div role="status" className="min-w-0 flex-1 leading-snug">
            {line?.headline ? (
              <p className={`flex flex-wrap items-center gap-2 font-display text-lg uppercase tracking-wide ${line.record ? "text-sun" : "text-cream"}`}>
                {line.headline}
                {line.stamp ? <RecordStamp /> : null}
              </p>
            ) : null}
            <p className="copy font-semibold">{line?.text}</p>
            {line?.rival ? <p className="copy-sm mt-1 text-cream-2">{line.rival}</p> : null}
          </div>
        </div>
      )}
      {state.phase === "done" && line?.href ? (
        <Link href={line.href} className="mt-2 inline-flex items-center gap-1.5 font-display text-sm uppercase tracking-wider text-sun underline decoration-2 underline-offset-4 hover:text-cream">
          <TrophyIcon className="size-4" /> {copy.arcade}
        </Link>
      ) : null}
    </motion.section>
  );
}
