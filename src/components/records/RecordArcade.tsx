"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CardIcon, OfflineIcon, PlayIcon, RestartIcon, TrophyIcon, VerifiedIcon } from "@/components/art/Icons";
import { InkButton, InkLink, toneBg } from "@/components/ui/Primitives";
import { getGame, type GameMeta } from "@/games/registry";
import { useSound } from "@/lib/audio/hooks";
import { BOARD_META, CHECK_TEXT, GAME_SLUGS, type GameSlug, type Metric } from "@/lib/competition/boards";
import { pickBoard, rankedLevels, type BoardLevel } from "@/lib/competition/choice";
import { connect, fetchBoard } from "@/lib/competition/client";
import { formatMetric, ordinal } from "@/lib/competition/format";
import { useCompetition } from "@/lib/competition/hooks";
import { recordsHref } from "@/lib/competition/links";
import type { BoardEntry, LeaderboardResponse } from "@/lib/competition/types";

const LIMIT = 10;

type Fetched = { key: string; attempt: number; data: LeaderboardResponse | null };

type View =
  | { kind: "loading" }
  | { kind: "unconfigured" }
  | { kind: "offline" }
  | { kind: "empty"; data: LeaderboardResponse }
  | { kind: "board"; data: LeaderboardResponse };

const PLACE_COLOR = ["text-sun", "text-cream", "text-tangerine"];

function levelName(game: GameMeta, level: BoardLevel | null) {
  if (!level) return null;
  const word = game.levelWord === "arena" ? "Arena" : "Fase";
  return `${word} ${level.number}: ${level.title}`;
}

function GamePicker({ current }: { current: GameSlug }) {
  const { play, hover } = useSound();
  return (
    <nav aria-label="Jogos do fliperama">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {GAME_SLUGS.map((slug, i) => {
          const game = getGame(slug)!;
          const active = slug === current;
          return (
            <li key={slug} className="flex">
              <Link
                href={recordsHref(slug)}
                scroll={false}
                aria-current={active ? "true" : undefined}
                onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
                onClick={() => play("click")}
                className={`press relative flex w-full flex-col rounded-xl border-[3px] border-ink px-2.5 pb-2 pt-4 text-ink shadow-[var(--shadow-ink-sm)] transition-transform ${
                  active ? `${toneBg(game.accent)} -translate-y-1` : "bg-cream hover:bg-cream-2"
                }`}
              >
                <span aria-hidden className="absolute inset-x-3 top-1.5 flex h-1.5 gap-1">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className="flex-1 rounded-sm bg-ink/70" />
                  ))}
                </span>
                <span className="font-display text-[11px] uppercase tracking-wider text-ink">Cartucho {i + 1}</span>
                <span className="font-display text-sm uppercase leading-tight tracking-wide">{game.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function LevelPicker({ game, levels, current }: { game: GameMeta & { slug: GameSlug }; levels: BoardLevel[]; current: string | null }) {
  const { play } = useSound();
  const word = game.levelWord === "arena" ? "Arenas" : "Fases";
  return (
    <nav aria-label={word} className="px-3 pt-3">
      <ul className="flex flex-wrap justify-center gap-2">
        {levels.map((level) => {
          const active = level.id === current;
          return (
            <li key={level.id}>
              <Link
                href={recordsHref(game.slug, level.id)}
                scroll={false}
                aria-current={active ? "true" : undefined}
                onClick={() => play("click")}
                className={`press inline-flex items-center rounded-full border-2 border-ink px-3 py-1 font-display text-xs uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)] ${
                  active ? "bg-sun" : "bg-plum-300 hover:bg-cream"
                }`}
              >
                <span className="sr-only">{game.levelWord === "arena" ? "Arena" : "Fase"} </span>
                {level.number}
                <span aria-hidden className="mx-1">·</span>
                {level.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Row({ entry, metrics, verified }: { entry: Pick<BoardEntry, "position" | "nickname" | "tag" | "you" | "metrics"> & { verified?: boolean }; metrics: readonly Metric[]; verified: boolean }) {
  return (
    <tr className={entry.you ? "bg-sun/15" : "odd:bg-white/[0.03]"}>
      <td className={`rounded-l-lg py-1.5 pl-2 pr-1 font-display text-lg leading-none ${PLACE_COLOR[entry.position - 1] ?? "text-plum-300"}`}>
        <span className="inline-flex items-center gap-1">
          {entry.position === 1 ? <TrophyIcon className="size-4" /> : null}
          {ordinal(entry.position)}
        </span>
      </td>
      <td className="px-1 py-1.5">
        <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="font-semibold text-cream">{entry.nickname}</span>
          <span className="text-sm text-plum-300">#{entry.tag}</span>
          {entry.you ? <span className="rounded border-2 border-ink bg-sun px-1 font-display text-[10px] uppercase leading-4 tracking-wider text-ink">Você</span> : null}
          {verified && entry.verified ? (
            <span className="inline-flex text-mint" title="Máquina testada pelo canal">
              <VerifiedIcon className="size-4" />
              <span className="sr-only">máquina testada pelo canal</span>
            </span>
          ) : null}
        </span>
      </td>
      {metrics.map((metric, i) => (
        <td key={metric.label} className={`whitespace-nowrap px-1 py-1.5 text-right text-sm text-cream-2 last:rounded-r-lg last:pr-2 ${i === 2 ? "hidden sm:table-cell" : ""}`}>
          {formatMetric(metric, entry.metrics[i] ?? 0)}
        </td>
      ))}
    </tr>
  );
}

function BoardTable({ game, data, caption }: { game: GameSlug; data: LeaderboardResponse; caption: string }) {
  const meta = BOARD_META[game];
  const replayed = meta.check === "replayed";
  const standing = data.you?.standing;
  const outside = standing && standing.position > data.entries.length ? standing : null;
  return (
    <table className="w-full border-separate border-spacing-y-1 text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="font-display text-[11px] uppercase tracking-wider text-plum-300">
          <th scope="col" className="w-14 pl-2 font-normal">
            Pos.
          </th>
          <th scope="col" className="px-1 font-normal">
            Apelido
          </th>
          {meta.metrics.map((metric, i) => (
            <th key={metric.label} scope="col" className={`px-1 text-right font-normal last:pr-2 ${i === 2 ? "hidden sm:table-cell" : ""}`}>
              {metric.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.entries.map((entry) => (
          <Row key={`${entry.position}-${entry.tag}`} entry={entry} metrics={meta.metrics} verified={replayed} />
        ))}
        {outside && data.you ? (
          <>
            <tr aria-hidden>
              <td colSpan={meta.metrics.length + 2} className="py-0.5 text-center font-display tracking-[0.5em] text-plum-300">
                ···
              </td>
            </tr>
            <Row
              entry={{ position: outside.position, nickname: data.you.nickname, tag: data.you.tag, you: true, metrics: outside.best.metrics, verified: outside.verified }}
              metrics={meta.metrics}
              verified={replayed}
            />
          </>
        ) : null}
      </tbody>
    </table>
  );
}

function ScreenMessage({ title, text, tone = "text-sun", children, live, tall }: { title: string; text?: string; tone?: string; children?: React.ReactNode; live?: boolean; tall?: boolean }) {
  return (
    <div role={live ? "status" : undefined} className={`flex ${tall ? "min-h-[27rem]" : "min-h-64"} flex-col items-center justify-center gap-3 px-4 py-8 text-center`}>
      <p className={`font-display text-2xl uppercase tracking-wide ${tone}`}>{title}</p>
      {text ? <p className="max-w-md font-semibold text-cream-2">{text}</p> : null}
      {children}
    </div>
  );
}

function Screen({ view, game, caption, where, onRetry }: { view: View; game: GameMeta & { slug: GameSlug }; caption: string; where: string; onRetry: () => void }) {
  return (
    <div aria-busy={view.kind === "loading"} className="relative m-3 overflow-hidden rounded-xl border-[3px] border-ink bg-[#10122e] text-cream shadow-[inset_0_0_40px_rgba(157,240,220,0.12)]">
      <div className="relative z-10 p-2 sm:p-3">
        {view.kind === "loading" ? <ScreenMessage live tall title="Sintonizando o placar…" tone="animate-pulse text-sun" /> : null}
        {view.kind === "unconfigured" ? (
          <ScreenMessage title="O fliperama ainda não abriu" text="Os jogos funcionam normalmente. Enquanto isso, seus recordes ficam guardados neste computador, em Extras." tone="text-bubblegum">
            <InkLink href="/extras" size="sm" tone="sun">
              Ver meus recordes
            </InkLink>
          </ScreenMessage>
        ) : null}
        {view.kind === "offline" ? (
          <ScreenMessage title="Sem sinal no fliperama" text="Não deu para falar com o placar agora. Os jogos continuam funcionando." tone="text-tomato">
            <OfflineIcon className="size-8 text-tomato" />
            <InkButton size="sm" tone="sun" onClick={onRetry}>
              <RestartIcon className="size-4" /> Tentar de novo
            </InkButton>
          </ScreenMessage>
        ) : null}
        {view.kind === "empty" ? (
          <ScreenMessage title="Ninguém marcou ponto aqui" text={`O primeiro lugar ${where} está vago. Que tal ser a primeira pessoa no placar?`} tone="text-lime">
            <InkLink href={`/play/${game.slug}`} size="sm" tone="sun">
              <PlayIcon className="size-4" /> Jogar {game.title}
            </InkLink>
          </ScreenMessage>
        ) : null}
        {view.kind === "board" ? (
          <>
            <p className="pb-1 text-center font-display text-sm uppercase tracking-[0.3em] text-screen">Melhores do canal</p>
            <BoardTable game={game.slug} data={view.data} caption={caption} />
            <p className="pt-2 text-center text-xs font-semibold text-plum-300">
              {view.data.total === 1 ? "1 pessoa no placar" : `${view.data.total.toLocaleString("pt-BR")} pessoas no placar`}
            </p>
          </>
        ) : null}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-50" />
    </div>
  );
}

function PlayerPanel({ game, view, status, nickname, tag }: { game: GameMeta & { slug: GameSlug }; view: View; status: string; nickname?: string; tag?: string }) {
  const standing = view.kind === "board" || view.kind === "empty" ? view.data.you?.standing : null;
  const meta = BOARD_META[game.slug];
  return (
    <section aria-labelledby="player-panel-title" className="paper rounded-2xl border-[3px] border-ink p-4 text-ink shadow-[var(--shadow-ink)]">
      <h2 id="player-panel-title" className="flex items-center gap-2 font-display text-lg uppercase tracking-wide">
        <CardIcon className="size-5" /> Seu lugar
      </h2>
      {status === "unconfigured" ? (
        <p className="mt-2 font-semibold">Quando o placar estrear, seu apelido aparece aqui.</p>
      ) : nickname ? (
        <>
          <p className="mt-2 font-semibold">
            Você joga como <span className="font-display tracking-wide">{nickname}</span> <span className="text-ink-soft">#{tag}</span>.
          </p>
          {standing ? (
            <p className="mt-2 rounded-lg border-2 border-ink bg-sun px-2 py-1.5 font-semibold">
              {ordinal(standing.position)} de {standing.total.toLocaleString("pt-BR")}: {meta.metrics.slice(0, 2).map((m, i) => formatMetric(m, standing.best.metrics[i] ?? 0)).join(" · ")}
            </p>
          ) : (
            <p className="mt-2 font-semibold text-ink-soft">Você ainda não tem recorde neste placar.</p>
          )}
        </>
      ) : (
        <p className="mt-2 font-semibold">
          Sem carteirinha ainda. Jogue uma partida e escolha um apelido no fim, ou{" "}
          <Link href="/extras#membership" className="underline decoration-2 underline-offset-2">
            tire a carteirinha em Extras
          </Link>
          .
        </p>
      )}
      <InkLink href={`/play/${game.slug}`} tone="tomato" className="mt-3 w-full justify-center">
        <PlayIcon className="size-4" /> {standing ? "Tentar bater" : "Jogar agora"}
      </InkLink>
    </section>
  );
}

function RulesNote({ game }: { game: GameSlug }) {
  const meta = BOARD_META[game];
  return (
    <section aria-labelledby="rules-title" className="relative -rotate-1 rounded-2xl border-[3px] border-ink bg-paper p-4 pt-5 text-ink shadow-[var(--shadow-ink)]">
      <span aria-hidden className="absolute -top-3 left-1/2 h-5 w-20 -translate-x-1/2 rotate-2 bg-mint/85" />
      <h2 id="rules-title" className="font-display text-lg uppercase tracking-wide">
        Regras da casa
      </h2>
      <p className="mt-1 font-semibold">{meta.explain}</p>
      <p className="mt-2 text-sm">Empate em tudo? Fica na frente quem chegou primeiro.</p>
      <h3 className="mt-3 flex items-center gap-1.5 font-display text-sm uppercase tracking-wider">
        {meta.check === "replayed" ? <VerifiedIcon className="size-4 text-mint-deep" /> : null}
        Como o canal confere
      </h3>
      <p className="mt-1 text-sm">{CHECK_TEXT[meta.check]}</p>
    </section>
  );
}

export function RecordArcade() {
  const params = useSearchParams();
  const { game: slug, level } = pickBoard(params.get("game"), params.get("level"));
  const key = `${slug}/${level ?? "all"}`;
  const competition = useCompetition();
  const [attempt, setAttempt] = useState(0);
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const reachable = competition.status === "online" || competition.status === "offline";
  const playerId = competition.player?.id ?? null;

  useEffect(() => {
    if (!reachable) return;
    let cancelled = false;
    void fetchBoard(slug, level, LIMIT).then((data) => {
      if (!cancelled) setFetched({ key, attempt, data });
    });
    return () => {
      cancelled = true;
    };
  }, [reachable, slug, level, key, attempt, playerId]);

  const view: View =
    competition.status === "unconfigured"
      ? { kind: "unconfigured" }
      : !reachable || !fetched || fetched.key !== key || fetched.attempt !== attempt
        ? { kind: "loading" }
        : !fetched.data
          ? { kind: "offline" }
          : fetched.data.entries.length === 0
            ? { kind: "empty", data: fetched.data }
            : { kind: "board", data: fetched.data };

  const game = { ...getGame(slug)!, slug };
  const levels = rankedLevels(slug);
  const current = levels?.find((l) => l.id === level) ?? null;
  const name = levelName(game, current);
  const where = current ? (game.levelWord === "arena" ? "desta arena" : "desta fase") : "deste jogo";
  const caption = `Melhores do canal em ${game.title}${name ? `, ${name}` : ""}`;

  const retry = async () => {
    await connect(true);
    setAttempt((a) => a + 1);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <GamePicker current={slug} />
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section aria-labelledby="board-title" className="rounded-[1.75rem] border-[3px] border-ink bg-plum-700 pb-1 shadow-[var(--shadow-ink-lg)]">
          <div className="relative rounded-t-[1.5rem] border-b-[3px] border-ink bg-plum-950 px-4 pb-3 pt-5 text-center">
            <span aria-hidden className="absolute inset-x-6 top-2 flex justify-between">
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} className="size-2 rounded-full border border-ink bg-sun" style={{ animation: `marquee-glow 1.8s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </span>
            <h2 id="board-title" className="font-display text-[clamp(1.5rem,4vw,2.4rem)] uppercase leading-none tracking-wide text-sun [text-shadow:3px_3px_0_var(--color-ink)]">
              {game.title}
            </h2>
            {name ? <p className="mt-1 font-display text-sm uppercase tracking-wider text-bubblegum">{name}</p> : null}
          </div>
          {levels ? <LevelPicker game={game} levels={levels} current={level} /> : null}
          <Screen view={view} game={game} caption={caption} where={where} onRetry={retry} />
        </section>
        <aside className="flex flex-col gap-6">
          <PlayerPanel game={game} view={view} status={competition.status} nickname={competition.player?.nickname} tag={competition.player?.tag} />
          <RulesNote game={slug} />
        </aside>
      </div>
    </div>
  );
}
