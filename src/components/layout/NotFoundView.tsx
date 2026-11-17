import { Mascot404 } from "@/components/mascot/Mascot404";
import { inkStyle } from "@/components/ui/Primitives";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { localized } from "@/i18n/copy";
import { localePath, type Locale } from "@/i18n/locales";

const COPY = localized({
  "pt-BR": {
    title: "Esse canal está fora do ar",
    text: "Hmm... essa página não existe. Ou existe, mas foi passear. Que tal voltar para a sala?",
    room: "Voltar para a sala",
    games: "Ver os jogos",
  },
  en: {
    title: "This channel is off the air",
    text: "Hmm... this page doesn't exist. Or it does, but it went out for a walk. How about heading back to the room?",
    room: "Back to the room",
    games: "See the games",
  },
});

export function NotFoundView({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  return (
    <main id="content" className="on-dark grid min-h-svh place-items-center px-4 py-10">
      <div className="grid max-w-3xl items-center gap-6 rounded-[28px] border-[3px] border-ink bg-plum-800 p-6 shadow-[var(--shadow-ink-lg)] sm:grid-cols-[auto_1fr] sm:p-10">
        <Mascot404 expression="static" pose="peek" className="mx-auto w-48 sm:w-56" />
        <div>
          <p className="font-display text-7xl leading-none text-sun [text-shadow:4px_5px_0_var(--color-ink)]">404</p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-cream">{copy.title}</h1>
          <SpeechBubble tail="top" className="mt-5 font-hand text-xl leading-snug">
            {copy.text}
          </SpeechBubble>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={localePath(locale, "/")} className={inkStyle("sun")}>
              {copy.room}
            </a>
            <a href={localePath(locale, "/games")} className={inkStyle("mint")}>
              {copy.games}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
