import type { Metadata } from "next";
import { PastBedtimePrototype } from "@/components/prototypes/PastBedtimePrototype";
import { localized } from "@/i18n/copy";
import { getLocale } from "@/i18n/server";
import { pageMetadata } from "@/lib/site";

const COPY = localized({
  "pt-BR": {
    title: "Madrugada · protótipo",
    description: "Protótipo de Madrugada para testar o stealth por turnos, o barulho, o cuco e o caderno do Bruno.",
    kicker: "Protótipo · Etapa 0",
    heading: "Madrugada",
  },
  en: {
    title: "Past Bedtime · prototype",
    description: "Prototype of Past Bedtime for testing turn-based stealth, noise, the cuckoo clock and Bruno's notebook.",
    kicker: "Prototype · Stage 0",
    heading: "Past Bedtime",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = COPY[locale];
  return pageMetadata({ title: copy.title, description: copy.description, path: "/prototypes/past-bedtime", locale, index: false });
}

export default async function PastBedtimePrototypePage() {
  const locale = await getLocale();
  const copy = COPY[locale];
  return (
    <main id="content" className="min-h-svh bg-ink">
      <header className="mx-auto flex max-w-[1800px] items-center gap-x-3 px-4 pt-3 [@media(max-height:520px)]:hidden">
        <h1 className="font-display text-xl uppercase text-cream">{copy.heading}</h1>
        <p className="rounded-md border-2 border-ink bg-sun px-1.5 font-display text-[10px] uppercase tracking-wider text-ink">{copy.kicker}</p>
      </header>
      <PastBedtimePrototype />
    </main>
  );
}
