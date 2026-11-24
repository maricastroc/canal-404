import { IntentLink } from "@/components/ui/IntentLink";
import { Squiggle } from "@/components/art/Badges";
import { localized } from "@/i18n/copy";
import { getLocale } from "@/i18n/server";
import { NAV_COPY } from "./nav";

const COPY = localized({
  "pt-BR": {
    tagline: "O Canal 404 nunca passou na TV de verdade. Mesmo assim, ninguém conseguiu tirar o canal do ar.",
    room: "Sala de transmissão",
    games: "Jogos",
    extras: "Extras",
    about: "Sobre o canal",
    sign: "© 2004–SEMPRE · TRANSMITINDO DO PORÃO",
  },
  en: {
    tagline: "Canal 404 never actually aired on real TV. Even so, nobody has managed to take it off the air.",
    room: "Broadcast room",
    games: "Games",
    extras: "Extras",
    about: "About the channel",
    sign: "© 2004–FOREVER · BROADCASTING FROM THE BASEMENT",
  },
});

export async function SiteFooter() {
  const locale = await getLocale();
  const copy = COPY[locale];
  return (
    <footer className="on-dark mt-16 border-t-[3px] border-ink bg-plum-950 py-8 text-cream safe-inline [--pad-inline:1rem]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
        <Squiggle className="w-32" />
        <p className="copy max-w-xl text-balance text-cream-2">{copy.tagline}</p>
        <nav aria-label={NAV_COPY[locale].footer}>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-display text-sm uppercase tracking-wide">
            <li>
              <IntentLink className="underline decoration-sun decoration-2 underline-offset-4 hover:text-sun" href="/">
                {copy.room}
              </IntentLink>
            </li>
            <li>
              <IntentLink className="underline decoration-mint decoration-2 underline-offset-4 hover:text-mint" href="/games">
                {copy.games}
              </IntentLink>
            </li>
            <li>
              <IntentLink className="underline decoration-bubblegum decoration-2 underline-offset-4 hover:text-bubblegum" href="/extras">
                {copy.extras}
              </IntentLink>
            </li>
            <li>
              <IntentLink className="underline decoration-sky decoration-2 underline-offset-4 hover:text-sky" href="/about">
                {copy.about}
              </IntentLink>
            </li>
          </ul>
        </nav>
        <p className="font-display text-xs tracking-widest text-plum-300">{copy.sign}</p>
      </div>
    </footer>
  );
}
