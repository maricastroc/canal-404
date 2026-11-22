import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { notFound } from "next/navigation";
import { Sparkle } from "@/components/art/Badges";
import { GuestBust, guestCardClass } from "@/components/art/GameCast";
import { GameCover } from "@/components/art/Covers";
import { GAME_LOGOS } from "@/components/art/GameLogos";
import { GameHowToPanel } from "@/components/art/GameHowTo";
import { ArrowLeftIcon, ChevronRightIcon, PlayIcon } from "@/components/art/Icons";
import { GameStats } from "@/components/catalog/GameStats";
import { ChampionTicker } from "@/components/records/ChampionTicker";
import { KidBust } from "@/components/characters/Heads";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkLink, inkStyle, PaperPanel, Tag } from "@/components/ui/Primitives";
import { IntentLink } from "@/components/ui/IntentLink";
import { KeyText } from "@/components/ui/KeyText";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { CATEGORY_LABELS, GAMES, getGame, type ControlHint } from "@/games/registry";
import { localized } from "@/i18n/copy";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { isGameSlug } from "@/lib/competition/boards";
import { CHARACTERS } from "@/lib/characters";
import { ogImage, pageMetadata } from "@/lib/site";

const castBasis = { 2: "max-sm:basis-[calc((100%-0.75rem)/2)]", 3: "max-sm:basis-[calc((100%-1.5rem)/3)]" } as const;

function ControlCards({ items }: { items: ControlHint[] }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {items.map((c) => (
        <div key={c.input} className="flex flex-col rounded-lg border-2 border-ink bg-cream-2 px-3 py-2">
          <dt className="font-display text-sm uppercase tracking-wide text-ink">
            <KeyText text={c.input} />
          </dt>
          <dd className="leading-snug text-ink-soft">
            <KeyText text={c.action} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function MoreControls({ label, items }: { label: string; items: ControlHint[] }) {
  return (
    <details className="group mt-3">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-display text-sm uppercase tracking-wide text-ink underline decoration-2 underline-offset-4 [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon className="size-4 transition-transform group-open:rotate-90" />
        {label}
      </summary>
      <div className="mt-2">
        <ControlCards items={items} />
      </div>
    </details>
  );
}

const COPY = localized({
  "pt-BR": {
    fallbackTitle: "Jogo",
    back: "Voltar ao catálogo",
    soon: "Em breve",
    play: "Jogar",
    diary: "Diário de produção",
    howTo: "Como jogar",
    controls: "Controles",
    keysToggle: "Ver controles de teclado e mouse",
    touchToggle: "Ver controles de toque",
    offAir: "Jogo fora do ar",
    offAirBubble: "Hmm... parece que esse jogo ainda está fora do ar.",
    offAirText: "Ele ainda está sendo desenhado. Enquanto isso, os outros jogos estão no ar e a sala de transmissão tem muita coisa escondida.",
    lineup: "Ver a programação",
    room: "Explorar a sala",
    cast: "Elenco",
  },
  en: {
    fallbackTitle: "Game",
    back: "Back to the catalog",
    soon: "Coming soon",
    play: "Play",
    diary: "Production diary",
    howTo: "How to play",
    controls: "Controls",
    keysToggle: "See keyboard and mouse controls",
    touchToggle: "See touch controls",
    offAir: "Game off the air",
    offAirBubble: "Hmm... looks like this game is still off the air.",
    offAirText: "It's still being drawn. Meanwhile, the other games are on the air and the broadcast room has plenty of hidden stuff.",
    lineup: "See the lineup",
    room: "Explore the room",
    cast: "Cast",
  },
});

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/[lang]/games/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const game = getGame(slug, locale);
  if (!game) return { title: COPY[locale].fallbackTitle };
  return pageMetadata({ title: game.title, description: game.tagline, path: `/games/${game.slug}`, locale, image: ogImage(game.slug, `${game.title}: ${game.tagline}`, locale) });
}

const accentBg: Record<string, string> = {
  sun: "bg-sky",
  mint: "bg-mint",
  bubblegum: "bg-bubblegum",
  tangerine: "bg-tangerine",
  plum: "bg-plum-500",
  sky: "bg-sky",
};

export default async function GamePage({ params }: PageProps<"/[lang]/games/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang;
  const copy = COPY[locale];
  const game = getGame(slug, locale);
  if (!game) notFound();
  const available = game.status === "available";
  const Logo = GAME_LOGOS[game.slug];
  const category = CATEGORY_LABELS[locale][game.category];
  const cast = game.cast.map((id) => CHARACTERS[locale].find((c) => c.id === id)).filter((c) => c !== undefined);
  const castCount = cast.length + (game.guests?.length ?? 0);
  const castItem = castBasis[castCount === 2 || castCount === 4 ? 2 : 3];
  const controls = game.controls ?? [];
  const shared = controls.filter((c) => !c.on);
  const keyControls = controls.filter((c) => c.on === "keys");
  const touchControls = controls.filter((c) => c.on === "touch");
  const splitControls = keyControls.length > 0 && touchControls.length > 0;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/games"
        className="press mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg border-[3px] border-ink bg-cream px-3 font-display text-sm uppercase tracking-wide text-ink shadow-[var(--shadow-ink-sm)] on-dark"
      >
        <ArrowLeftIcon className="size-4" /> {copy.back}
      </Link>

      <PaperPanel className={`overflow-hidden !bg-none ${accentBg[game.accent]}`}>
        <div className="grid items-center gap-5 p-4 sm:gap-6 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative">
            <div className="-rotate-2 overflow-hidden rounded-2xl border-[3px] border-ink bg-ink shadow-[var(--shadow-ink-lg)]">
              <div className={`aspect-[4/3] ${available ? "" : "saturate-[0.7]"}`}>
                <GameCover slug={game.slug} locale={locale} />
              </div>
            </div>
            <Sparkle className="absolute -left-4 -top-4 w-12" />
            {!available && (
              <span className="absolute -right-2 top-6 rotate-12 rounded-lg border-[3px] border-ink bg-sun px-3 py-1 font-display text-lg uppercase tracking-wider text-ink shadow-[var(--shadow-ink)]">
                {copy.soon}
              </span>
            )}
          </div>
          <div className="paper rounded-2xl border-[3px] border-ink p-4 shadow-[var(--shadow-ink)] sm:p-6">
            {Logo ? (
              <h1>
                <Logo className="mx-auto w-full max-w-[17rem] sm:max-w-sm" />
              </h1>
            ) : (
              <h1 className="font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-[0.95] tracking-wide text-ink">
                {game.title}
              </h1>
            )}
            <p className="mt-3 text-lg font-semibold leading-snug text-ink">{game.tagline}</p>
            <p className="mt-2 leading-relaxed text-ink-soft">{game.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Tag tone="tangerine">{category}</Tag>
              {game.tags
                .filter((t) => t !== category)
                .map((t) => (
                  <Tag key={t} tone="plum">
                    {t}
                  </Tag>
                ))}
            </div>
            {available ? (
              <div className="mt-5 flex flex-col gap-4 sm:mt-6">
                <IntentLink href={`/play/${game.slug}`} className={inkStyle("sun", "lg", "self-stretch sm:self-start")}>
                  <PlayIcon className="size-7 text-ink" /> {copy.play}
                </IntentLink>
                <GameStats slug={game.slug} levels={game.levels} levelWord={game.levelWord} />
                {isGameSlug(game.slug) ? <ChampionTicker slug={game.slug} levelWord={game.levelWord} /> : null}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border-[3px] border-dashed border-ink bg-cream-2 p-4">
                <p className="font-display text-sm uppercase tracking-wider text-ink">{copy.diary}</p>
                <p className="mt-1 font-hand text-xl leading-snug text-ink">{game.production}</p>
              </div>
            )}
          </div>
        </div>
      </PaperPanel>

      {available && game.howTo && (
        <section aria-labelledby="how-to-play" className="mt-10">
          <h2 id="how-to-play" className="text-center font-display text-4xl uppercase tracking-wide text-cream [text-shadow:3px_4px_0_var(--color-ink)]">
            {copy.howTo}
          </h2>
          {(game.howToIntro ?? game.objective) && <p className="mx-auto mt-2 max-w-xl text-center font-hand text-xl text-cream-2">{game.howToIntro ?? game.objective}</p>}
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {game.howTo.map((step, i) => (
              <li key={step.title} className={`paper border-[3px] border-ink p-3 shadow-[var(--shadow-ink)] wobbly-sm ${i === 1 ? "md:translate-y-3 md:rotate-1" : "md:-rotate-1"}`}>
                <div className="aspect-[200/130] overflow-hidden rounded-lg border-[3px] border-ink">
                  <GameHowToPanel slug={game.slug} step={i as 0 | 1 | 2} locale={locale} />
                </div>
                <p className="mt-3 font-display text-2xl uppercase text-ink">
                  <span className="mr-2 inline-grid size-9 place-items-center rounded-full border-[3px] border-ink bg-sun text-lg">{i + 1}</span>
                  {step.title}
                </p>
                <p className="mt-1 leading-snug text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
          {controls.length > 0 && (
            <div className="paper mx-auto mt-10 max-w-3xl border-[3px] border-ink p-4 shadow-[var(--shadow-ink)] wobbly-alt sm:p-5">
              <h3 className="font-display text-2xl uppercase tracking-wide text-ink">{copy.controls}</h3>
              {splitControls ? (
                <>
                  <div className="mt-3 pointer-coarse:hidden">
                    <ControlCards items={[...keyControls, ...shared]} />
                    <MoreControls label={copy.touchToggle} items={touchControls} />
                  </div>
                  <div className="mt-3 hidden pointer-coarse:block">
                    <ControlCards items={[...touchControls, ...shared]} />
                    <MoreControls label={copy.keysToggle} items={keyControls} />
                  </div>
                </>
              ) : (
                <div className="mt-3">
                  <ControlCards items={controls} />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {!available && (
        <section aria-label={copy.offAir} className="on-dark mt-10 grid items-center gap-6 rounded-[28px] border-[3px] border-ink bg-plum-800 p-6 shadow-[var(--shadow-ink-lg)] sm:grid-cols-[auto_1fr] sm:p-8">
          <Mascot404 expression="static" pose="peek" className="mx-auto w-44 sm:w-52" />
          <div>
            <SpeechBubble tail="left" className="font-hand text-2xl leading-snug">
              {copy.offAirBubble}
            </SpeechBubble>
            <p className="mt-4 text-lg leading-snug text-cream-2">
              {copy.offAirText}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <InkLink href="/games" tone="sun">
                {copy.lineup}
              </InkLink>
              <InkLink href="/" tone="mint">
                {copy.room}
              </InkLink>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="cast" className="mt-12">
        <h2 id="cast" className="text-center font-display text-3xl uppercase tracking-wide text-cream [text-shadow:3px_4px_0_var(--color-ink)]">
          {copy.cast}
        </h2>
        <ul className="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-3 sm:max-w-none sm:gap-5">
          {cast.map((c) => (
            <li key={c.id} className={`min-w-0 ${castItem}`}>
              <Link
                href={`/characters#${c.id}`}
                className={`press flex h-full w-full flex-col items-center rounded-2xl border-[3px] border-ink p-2 pb-3 text-center shadow-[var(--shadow-ink)] sm:w-36 ${c.cardClass}`}
              >
                {c.id === "404" ? (
                  <Mascot404 expression="happy" className="w-full max-w-24" />
                ) : (
                  <KidBust who={c.id} face="happy" className="w-full max-w-24" />
                )}
                <span className="mt-1 font-display text-lg uppercase leading-none text-ink">{c.name}</span>
                <span className="text-xs font-semibold uppercase leading-tight tracking-wide text-ink">{c.role}</span>
              </Link>
            </li>
          ))}
          {game.guests?.map((g) => (
            <li key={g.id} className={`min-w-0 ${castItem}`}>
              <div className={`flex h-full w-full flex-col items-center rounded-2xl border-[3px] border-ink p-2 pb-3 text-center shadow-[var(--shadow-ink)] sm:w-36 ${guestCardClass(g.id)}`}>
                <GuestBust id={g.id} className="w-full max-w-24" />
                <span className="mt-1 font-display text-lg uppercase leading-none text-ink">{g.name}</span>
                <span className="text-xs font-semibold uppercase leading-tight tracking-wide text-ink">{g.role}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
