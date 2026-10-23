import type { Metadata } from "next";
import { ExtrasHub } from "@/components/extras/ExtrasHub";

export const metadata: Metadata = {
  title: "Extras",
  description: "Pôsteres para baixar, trilhas sonoras, conquistas e segredos do CANAL 404.",
};

export default function ExtrasPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <p className="inline-block rotate-2 rounded-md border-[3px] border-ink bg-plum-300 px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]">
          Baú do canal
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.6rem,8vw,5rem)] uppercase leading-[0.95] tracking-wide text-cream [text-shadow:4px_5px_0_var(--color-ink)]">
          Extras
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-hand text-xl text-cream-2">
          Tudo que você destrava jogando e explorando a sala fica guardado aqui, neste navegador.
        </p>
      </div>
      <ExtrasHub />
    </div>
  );
}
