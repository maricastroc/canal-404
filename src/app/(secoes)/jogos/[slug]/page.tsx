import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkle } from "@/components/art/Badges";
import { GameCover } from "@/components/art/Covers";
import { GAME_LOGOS, GameHowToPanel } from "@/components/art/GameLogos";
import { ArrowLeftIcon, PlayTriangle } from "@/components/art/Icons";
import { GameStats } from "@/components/catalog/GameStats";
import { KidBust } from "@/components/characters/Heads";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkLink, PaperPanel, Tag } from "@/components/ui/Primitives";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { CATEGORY_LABELS, GAMES, getGame } from "@/games/registry";
import { CHARACTERS } from "@/lib/characters";

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/jogos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  return { title: game?.title ?? "Jogo", description: game?.tagline };
}

const accentBg: Record<string, string> = {
  sun: "bg-sky",
  mint: "bg-mint",
  bubblegum: "bg-bubblegum",
  tangerine: "bg-tangerine",
  plum: "bg-plum-500",
  sky: "bg-sky",
};

export default async function GamePage({ params }: PageProps<"/jogos/[slug]">) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();
  const available = game.status === "disponivel";
  const Logo = GAME_LOGOS[game.slug];
  const cast = game.cast.map((id) => CHARACTERS.find((c) => c.id === id)).filter((c) => c !== undefined);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/jogos"
        className="press mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg border-[3px] border-ink bg-cream px-3 font-display text-sm uppercase tracking-wide text-ink shadow-[var(--shadow-ink-sm)] on-dark"
      >
        <ArrowLeftIcon className="size-4" /> Voltar ao catálogo
      </Link>

      <PaperPanel className={`overflow-hidden !bg-none ${accentBg[game.accent]}`}>
        <div className="grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative">
            <div className="-rotate-2 overflow-hidden rounded-2xl border-[3px] border-ink bg-ink shadow-[var(--shadow-ink-lg)]">
              <div className={`aspect-[4/3] ${available ? "" : "saturate-[0.7]"}`}>
                <GameCover slug={game.slug} />
              </div>
            </div>
            <Sparkle className="absolute -left-4 -top-4 w-12" />
            {!available && (
              <span className="absolute -right-2 top-6 rotate-12 rounded-lg border-[3px] border-ink bg-sun px-3 py-1 font-display text-lg uppercase tracking-wider text-ink shadow-[var(--shadow-ink)]">
                Em breve
              </span>
            )}
          </div>
          <div className="paper rounded-2xl border-[3px] border-ink p-5 shadow-[var(--shadow-ink)] sm:p-6">
            {Logo ? (
              <h1>
                <Logo className="mx-auto w-full max-w-sm" />
              </h1>
            ) : (
              <h1 className="font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-[0.95] tracking-wide text-ink">
                {game.title}
              </h1>
            )}
            <p className="mt-3 text-lg font-semibold leading-snug text-ink">{game.tagline}</p>
            <p className="mt-2 leading-relaxed text-ink-soft">{game.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Tag tone="tangerine">{CATEGORY_LABELS[game.category]}</Tag>
              {game.tags
                .filter((t) => t !== CATEGORY_LABELS[game.category])
                .map((t) => (
                  <Tag key={t} tone="plum">
                    {t}
                  </Tag>
                ))}
            </div>
            {available ? (
              <div className="mt-6 flex flex-col gap-4">
                <InkLink href={`/jogar/${game.slug}`} size="lg" tone="sun" className="self-start">
                  <PlayTriangle className="size-7 text-ink" /> Jogar
                </InkLink>
                <GameStats slug={game.slug} levels={game.levels} />
              </div>
            ) : (
              <div className="mt-5 rounded-xl border-[3px] border-dashed border-ink bg-cream-2 p-4">
                <p className="font-display text-sm uppercase tracking-wider text-ink">Diário de produção</p>
                <p className="mt-1 font-hand text-xl leading-snug text-ink">{game.production}</p>
              </div>
            )}
          </div>
        </div>
      </PaperPanel>

      {available && game.howTo && (
        <section aria-labelledby="como-jogar" className="mt-10">
          <h2 id="como-jogar" className="text-center font-display text-4xl uppercase tracking-wide text-cream [text-shadow:3px_4px_0_var(--color-ink)]">
            Como jogar
          </h2>
          {game.objective && <p className="mx-auto mt-2 max-w-xl text-center font-hand text-xl text-cream-2">{game.objective}</p>}
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {game.howTo.map((step, i) => (
              <li key={step.title} className={`paper border-[3px] border-ink p-3 shadow-[var(--shadow-ink)] wobbly-sm ${i === 1 ? "md:translate-y-3 md:rotate-1" : "md:-rotate-1"}`}>
                <div className="aspect-[200/130] overflow-hidden rounded-lg border-[3px] border-ink">
                  <GameHowToPanel slug={game.slug} step={i as 0 | 1 | 2} />
                </div>
                <p className="mt-3 font-display text-2xl uppercase text-ink">
                  <span className="mr-2 inline-grid size-9 place-items-center rounded-full border-[3px] border-ink bg-sun text-lg">{i + 1}</span>
                  {step.title}
                </p>
                <p className="mt-1 leading-snug text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
          {game.controls && (
            <div className="paper mx-auto mt-10 max-w-3xl border-[3px] border-ink p-5 shadow-[var(--shadow-ink)] wobbly-alt">
              <h3 className="font-display text-2xl uppercase tracking-wide text-ink">Controles</h3>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {game.controls.map((c) => (
                  <div key={c.input} className="flex flex-col rounded-lg border-2 border-ink bg-cream-2 px-3 py-2">
                    <dt className="font-display text-sm uppercase tracking-wide text-ink">{c.input}</dt>
                    <dd className="text-ink-soft">{c.action}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      )}

      {!available && (
        <section aria-label="Jogo fora do ar" className="on-dark mt-10 grid items-center gap-6 rounded-[28px] border-[3px] border-ink bg-plum-800 p-6 shadow-[var(--shadow-ink-lg)] sm:grid-cols-[auto_1fr] sm:p-8">
          <Mascot404 expression="static" pose="peek" className="mx-auto w-44 sm:w-52" />
          <div>
            <SpeechBubble tail="left" className="font-hand text-2xl leading-snug">
              Hmm... parece que esse jogo ainda está fora do ar.
            </SpeechBubble>
            <p className="mt-4 text-lg leading-snug text-cream-2">
              Ele ainda está sendo desenhado. Enquanto isso, a Rua Sem Saída está no ar e a sala de transmissão tem muita coisa
              escondida.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <InkLink href="/jogar/rua-sem-saida" tone="sun">
                <PlayTriangle className="size-5 text-ink" /> Jogar Rua Sem Saída
              </InkLink>
              <InkLink href="/" tone="mint">
                Explorar a sala
              </InkLink>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="elenco" className="mt-12">
        <h2 id="elenco" className="text-center font-display text-3xl uppercase tracking-wide text-cream [text-shadow:3px_4px_0_var(--color-ink)]">
          Elenco
        </h2>
        <ul className="mt-5 flex flex-wrap justify-center gap-5">
          {cast.map((c) => (
            <li key={c.id}>
              <Link
                href={`/personagens#${c.id}`}
                className={`press flex w-36 flex-col items-center rounded-2xl border-[3px] border-ink p-2 pb-3 shadow-[var(--shadow-ink)] ${c.cardClass}`}
              >
                {c.id === "404" ? (
                  <Mascot404 expression="happy" className="w-24" />
                ) : (
                  <KidBust who={c.id} face="happy" className="w-24" />
                )}
                <span className="mt-1 font-display text-lg uppercase leading-none text-ink">{c.name}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-ink">{c.role}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
