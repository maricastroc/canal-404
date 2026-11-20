import type { Metadata } from "next";
import { DownhillPrototype } from "@/components/prototypes/DownhillPrototype";
import { localized } from "@/i18n/copy";
import { getLocale } from "@/i18n/server";
import { pageMetadata } from "@/lib/site";

const COPY = localized({
  "pt-BR": {
    title: "Ladeira Abaixo · protótipo",
    description: "Protótipo cinza de Ladeira Abaixo para testar o embalo, os pulos e os pousos.",
    kicker: "Protótipo · Etapa 0",
    heading: "Ladeira Abaixo",
  },
  en: {
    title: "Downhill Derby · prototype",
    description: "Greybox prototype of Downhill Derby for testing momentum, jumps and landings.",
    kicker: "Prototype · Stage 0",
    heading: "Downhill Derby",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = COPY[locale];
  return pageMetadata({ title: copy.title, description: copy.description, path: "/prototypes/downhill-derby", locale, index: false });
}

export default async function DownhillPrototypePage() {
  const locale = await getLocale();
  const copy = COPY[locale];
  return (
    <main id="content" className="min-h-svh bg-ink">
      <header className="mx-auto flex max-w-[1800px] items-center gap-x-3 px-4 pt-3 [@media(max-height:520px)]:hidden">
        <h1 className="font-display text-xl uppercase text-cream">{copy.heading}</h1>
        <p className="rounded-md border-2 border-ink bg-sun px-1.5 font-display text-[10px] uppercase tracking-wider text-ink">{copy.kicker}</p>
      </header>
      <DownhillPrototype />
    </main>
  );
}
