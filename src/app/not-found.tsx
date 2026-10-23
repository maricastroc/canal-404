import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkLink } from "@/components/ui/Primitives";
import { SpeechBubble } from "@/components/ui/SpeechBubble";

export default function NotFound() {
  return (
    <main id="conteudo" className="on-dark grid min-h-svh place-items-center px-4 py-10">
      <div className="grid max-w-3xl items-center gap-6 rounded-[28px] border-[3px] border-ink bg-plum-800 p-6 shadow-[var(--shadow-ink-lg)] sm:grid-cols-[auto_1fr] sm:p-10">
        <Mascot404 expression="static" pose="peek" className="mx-auto w-48 sm:w-56" />
        <div>
          <p className="font-display text-7xl leading-none text-sun [text-shadow:4px_5px_0_var(--color-ink)]">404</p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-cream">Esse canal está fora do ar</h1>
          <SpeechBubble tail="top" className="mt-5 font-hand text-xl leading-snug">
            Hmm... essa página não existe. Ou existe, mas foi passear. Que tal voltar para a sala?
          </SpeechBubble>
          <div className="mt-6 flex flex-wrap gap-3">
            <InkLink href="/" tone="sun">
              Voltar para a sala
            </InkLink>
            <InkLink href="/jogos" tone="mint">
              Ver os jogos
            </InkLink>
          </div>
        </div>
      </div>
    </main>
  );
}
