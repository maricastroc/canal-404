import type { Metadata } from "next";
import { TalentShowPrototype } from "@/components/prototypes/TalentShowPrototype";
import { localized } from "@/i18n/copy";
import { getLocale } from "@/i18n/server";
import { pageMetadata } from "@/lib/site";

const COPY = localized({
  "pt-BR": {
    title: "Ao Vivo no 404 · protótipo",
    description: "Protótipo de Ao Vivo no 404 com as três rodadas, as seis músicas, o acerto de tempo e o modo assistido.",
    kicker: "Protótipo · Etapa 1",
    heading: "Ao Vivo no 404",
  },
  en: {
    title: "Live on 404 · prototype",
    description: "Prototype of Live on 404 with the three rounds, the six songs, the timing check and assist mode.",
    kicker: "Prototype · Stage 1",
    heading: "Live on 404",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = COPY[locale];
  return pageMetadata({ title: copy.title, description: copy.description, path: "/prototypes/talent-show", locale, index: false });
}

export default async function TalentShowPrototypePage() {
  const locale = await getLocale();
  const copy = COPY[locale];
  return (
    <main id="content" className="min-h-svh bg-ink">
      <header className="mx-auto flex max-w-[1800px] items-center gap-x-3 px-4 pt-3 [@media(max-height:520px)]:hidden">
        <h1 className="font-display text-xl uppercase text-cream">{copy.heading}</h1>
        <p className="rounded-md border-2 border-ink bg-sun px-1.5 font-display text-[10px] uppercase tracking-wider text-ink">{copy.kicker}</p>
      </header>
      <TalentShowPrototype />
    </main>
  );
}
