import type { Metadata } from "next";
import { Sparkle, Squiggle } from "@/components/art/Badges";
import { KidBust } from "@/components/characters/Heads";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkLink, PaperPanel } from "@/components/ui/Primitives";
import { SpeechBubble } from "@/components/ui/SpeechBubble";

export const metadata: Metadata = {
  title: "Sobre o canal",
  description: "A história (mais ou menos verdadeira) do CANAL 404, o canal de desenhos que saiu do ar mas esqueceu o portal ligado.",
};

const TIMELINE = [
  {
    year: "1998",
    title: "No ar, direto da garagem",
    text: "O CANAL 404 começa a transmitir de uma garagem no fim de uma rua sem saída. No primeiro dia, o Seu Arlindo reclamou do barulho. No segundo também.",
    tone: "bg-sun",
  },
  {
    year: "2001",
    title: "Nasce o 404",
    text: "Um técnico cola dois olhos numa TV quebrada para animar uma reunião chata. A TV pisca de volta. Até hoje ninguém sabe explicar.",
    tone: "bg-mint",
  },
  {
    year: "2003",
    title: "O portal de jogos entra no ar",
    text: "Três jogos, um contador de visitas que nunca funcionou direito e uma página inteira só com GIFs de estrelinhas.",
    tone: "bg-bubblegum",
  },
  {
    year: "2004",
    title: "Rua Sem Saída vira febre",
    text: "O bairro inteiro aprende a palavra 'engenhoca'. O consumo de elástico de calcinha sobe 400%. Os gnomos de jardim entram em pânico.",
    tone: "bg-tangerine",
  },
  {
    year: "2007",
    title: "O último intervalo",
    text: "Às 23:59 do dia 31 de dezembro, a programação parou. Desenhos, vinhetas, tudo. Menos o portal. Alguém esqueceu de desligar.",
    tone: "bg-plum-300",
  },
  {
    year: "Hoje",
    title: "Você está aqui",
    text: "O 404 continua ligando a TV todo dia, por via das dúvidas. E você acabou de encontrar o portal. Coincidência? Provavelmente.",
    tone: "bg-sky",
  },
];

const CREDITS = [
  ["Apresentação", "404"],
  ["Engenhocas e solda", "Lina"],
  ["Planejamento e cadernos", "Bruno"],
  ["Testes de impacto", "Déco"],
  ["Assuntos inexplicáveis", "Mila"],
  ["Segurança da sala", "Pixel, o gato"],
  ["Reclamações", "Seu Arlindo"],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10 text-center">
        <p className="inline-block -rotate-2 rounded-md border-[3px] border-ink bg-sky px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]">
          Arquivo do canal
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,7vw,4.6rem)] uppercase leading-[0.95] tracking-wide text-cream [text-shadow:4px_5px_0_var(--color-ink)]">
          Sobre o canal
        </h1>
      </div>

      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
        <Mascot404 pose="wave" expression="happy" className="mx-auto w-44 md:w-56" title="404 acenando" />
        <SpeechBubble tail="left" className="font-hand text-2xl leading-snug">
          Oi! Eu sou o 404. Me pediram para contar a história do canal. Vou contar. Algumas partes são verdade. Outras são
          ainda mais verdade.
        </SpeechBubble>
      </div>

      <PaperPanel className="mt-10 p-5 sm:p-8">
        <Sparkle className="absolute -right-4 -top-5 w-12" color="#63d6c1" />
        <h2 className="font-display text-3xl uppercase tracking-wide text-ink">Linha do tempo</h2>
        <Squiggle className="mt-1 w-32" color="#ff8a3d" />
        <ol className="relative mt-6 space-y-6 before:absolute before:bottom-4 before:left-[1.65rem] before:top-4 before:w-1 before:rounded-full before:bg-ink/25 sm:before:left-[2.15rem]">
          {TIMELINE.map((item, i) => (
            <li key={item.year} className="relative grid grid-cols-[auto_1fr] items-start gap-4">
              <span
                className={`z-10 grid size-14 place-items-center rounded-full border-[3px] border-ink font-display text-sm text-ink shadow-[var(--shadow-ink-sm)] sm:size-[4.5rem] sm:text-lg ${item.tone} ${i % 2 ? "rotate-6" : "-rotate-6"}`}
              >
                {item.year}
              </span>
              <div className="rounded-2xl border-[3px] border-ink bg-paper p-4 shadow-[var(--shadow-ink-sm)]">
                <h3 className="font-display text-xl uppercase leading-tight text-ink">{item.title}</h3>
                <p className="mt-1 leading-relaxed text-ink-soft">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </PaperPanel>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <article className="rotate-1 border-[3px] border-ink bg-[#f1e8d2] p-5 shadow-[var(--shadow-ink-lg)]" aria-labelledby="newspaper">
          <p className="border-b-[3px] border-double border-ink pb-1 text-center font-display text-sm uppercase tracking-[0.3em] text-ink">
            Jornal do Bairro · 2004
          </p>
          <h2 id="newspaper" className="mt-3 font-display text-2xl uppercase leading-tight text-ink">
            Canal de garagem conquista crianças e irrita vizinho
          </h2>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
            <p className="text-sm leading-relaxed text-ink-soft first-letter:float-left first-letter:mr-1 first-letter:font-display first-letter:text-4xl first-letter:leading-none first-letter:text-ink">
              Moradores relatam que um jogo chamado Rua Sem Saída inspirou uma onda de engenhocas no bairro. &ldquo;Meu gnomo
              voou três quarteirões&rdquo;, declarou o aposentado Arlindo, 71, que promete processar &ldquo;a TV com
              olhos&rdquo;.
            </p>
            <div className="w-24 rotate-3 border-[3px] border-ink bg-cream-2 p-1 grayscale">
              <KidBust who="deco" face="happy" className="w-full" />
            </div>
          </div>
        </article>

        <article className="-rotate-1 rounded-2xl border-[3px] border-ink bg-plum-800 p-5 text-cream shadow-[var(--shadow-ink-lg)] on-dark" aria-labelledby="credits">
          <h2 id="credits" className="font-display text-2xl uppercase tracking-wide text-sun">
            Ficha técnica
          </h2>
          <dl className="mt-3 divide-y-2 divide-dashed divide-plum-600">
            {CREDITS.map(([role, name]) => (
              <div key={role} className="flex justify-between gap-3 py-1.5">
                <dt className="text-cream-2">{role}</dt>
                <dd className="font-display uppercase tracking-wide text-cream">{name}</dd>
              </div>
            ))}
          </dl>
        </article>
      </div>

      <PaperPanel className="mt-12 p-5 sm:p-7" aria-labelledby="behind-the-scenes">
        <h2 id="behind-the-scenes" className="font-display text-2xl uppercase tracking-wide text-ink">
          Sobre este portal (a parte real)
        </h2>
        <p className="mt-2 leading-relaxed text-ink-soft">
          O CANAL 404 é um projeto fictício e original: personagens, desenhos e sons foram feitos especialmente para ele. Tudo
          funciona no seu navegador, sem cadastro e sem depender de outros sites. Recordes, segredos e conquistas ficam
          salvos só neste navegador. Os sons são criados na hora e só tocam depois que você clica ou aperta uma tecla. Dá
          para desligar no botão de alto-falante.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <InkLink href="/" tone="sun">
            Voltar para a sala
          </InkLink>
          <InkLink href="/play/rua-sem-saida" tone="mint">
            Jogar Rua Sem Saída
          </InkLink>
        </div>
      </PaperPanel>
    </div>
  );
}
