import type { Metadata } from "next";
import { localized } from "@/i18n/copy";
import { getLocale } from "@/i18n/server";
import { pageMetadata } from "@/lib/site";
import { ExtrasHub } from "@/components/extras/ExtrasHub";

const META = localized({
  "pt-BR": {
    title: "Extras",
    description: "Pôsteres para baixar, trilhas sonoras, conquistas e segredos do Canal 404.",
  },
  en: {
    title: "Extras",
    description: "Posters to download, soundtracks, achievements and secrets from Canal 404.",
  },
});

const COPY = localized({
  "pt-BR": {
    kicker: "Baú do canal",
    title: "Extras",
    lede: "Tudo o que você libera jogando e explorando a sala fica guardado aqui, neste navegador.",
  },
  en: {
    kicker: "Channel vault",
    title: "Extras",
    lede: "Everything you unlock by playing and exploring the room is kept here, in this browser.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({ ...META[locale], path: "/extras", locale });
}

export default async function ExtrasPage() {
  const copy = COPY[await getLocale()];
  return (
    <div>
      <div className="mb-8 text-center">
        <p className="inline-block rotate-2 rounded-md border-[3px] border-ink bg-plum-300 px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]">
          {copy.kicker}
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.6rem,8vw,5rem)] uppercase leading-[0.95] tracking-wide text-cream [text-shadow:4px_5px_0_var(--color-ink)]">
          {copy.title}
        </h1>
        <p className="copy-lede mx-auto mt-3 max-w-xl text-cream-2">{copy.lede}</p>
      </div>
      <ExtrasHub />
    </div>
  );
}
