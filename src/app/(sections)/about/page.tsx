import type { Metadata } from "next";
import { WeeklyPlayLink } from "@/components/catalog/WeeklyPlayLink";
import { pageMetadata } from "@/lib/site";
import { Sparkle, Squiggle } from "@/components/art/Badges";
import { KidBust } from "@/components/characters/Heads";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkLink, PaperPanel } from "@/components/ui/Primitives";
import { SpeechBubble } from "@/components/ui/SpeechBubble";

export const metadata: Metadata = pageMetadata({
  title: "Sobre o canal",
  description: "A história (mais ou menos verdadeira) do Canal 404: uma garagem, uma TV que piscou de volta e um portal de jogos que ninguém conseguiu desligar.",
  path: "/about",
});

const TIMELINE = [
  {
    year: "1998",
    title: "No ar, direto da garagem",
    text: "O Canal 404 começou numa garagem no fim de uma rua sem saída, com uma câmera emprestada e uma antena amarrada no varal. O sinal mal chegava ao fim da rua, mas alcançou a casa do vizinho, o Seu Arlindo, que reclamou do barulho no primeiro dia. E no segundo também.",
    tone: "bg-sun",
  },
  {
    year: "2001",
    title: "A TV que piscou de volta",
    text: "Uma TV caiu do caminhão de mudança na porta da garagem, e um técnico colou dois olhos nela para animar uma reunião chata. A TV piscou de volta. Ninguém sabe explicar até hoje, mas o canal ganhou seu apresentador: o 404.",
    tone: "bg-mint",
  },
  {
    year: "2003",
    title: "Os jogos entram na programação",
    text: "Quando os computadores chegaram ao bairro, a criançada trocou a TV pelo monitor. Se o público ia para o computador, o canal ia junto: nasceu o portal de jogos, estrelado por Lina, Bruno, Déco e Mila, a turma dos desenhos. Tinha cores demais, animações demais e um contador de visitas que nunca funcionou direito.",
    tone: "bg-bubblegum",
  },
  {
    year: "2004",
    title: "A febre de Rua Sem Saída",
    text: "Num dos jogos, Déco e Lina montam uma engenhoca para derrubar os enfeites do quintal do Seu Arlindo. Sim, aquele vizinho. Rua Sem Saída virou a febre do portal, o bairro inteiro passou a disputar recordes e o canal ganhou o troféu de Melhor Canal de 2004.",
    tone: "bg-tangerine",
  },
  {
    year: "2007",
    title: "O último intervalo",
    text: "No dia 31 de dezembro, às 23:59, a programação parou no meio de um intervalo. Desenhos e vinhetas sumiram da TV, e ninguém nunca explicou por quê. Só o portal continuou no ar, como se ninguém tivesse avisado que o canal tinha acabado.",
    tone: "bg-plum-300",
  },
  {
    year: "Hoje",
    title: "Você encontrou o canal",
    text: "Anos depois, o portal segue no ar num canto esquecido da internet, e ninguém conseguiu desligá-lo. Os jogos ainda funcionam, a sala de transmissão guarda pistas de 2007 e o 404 apresenta a programação todo dia, sem saber se tem alguém assistindo. Agora tem: você.",
    tone: "bg-sky",
  },
];

const CREDITS = [
  ["Apresentação", "404"],
  ["Engenhocas e solda", "Lina"],
  ["Planos e cálculos", "Bruno"],
  ["Testes de impacto", "Déco"],
  ["Assuntos inexplicáveis", "Mila"],
  ["Dono da sala", "Pixel, o gato"],
  ["Reclamações desde 1998", "Seu Arlindo"],
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

      <PaperPanel className="mt-10 p-4 sm:p-8">
        <Sparkle className="absolute -right-4 -top-5 w-12" color="#63d6c1" />
        <h2 className="font-display text-3xl uppercase tracking-wide text-ink">Linha do tempo</h2>
        <Squiggle className="mt-1 w-32" color="#ff8a3d" />
        <ol className="relative mt-6 space-y-6 before:absolute before:bottom-4 before:left-[1.375rem] before:top-4 before:w-1 before:rounded-full before:bg-ink/25 sm:before:left-[2.15rem]">
          {TIMELINE.map((item, i) => (
            <li key={item.year} className="relative grid grid-cols-[auto_1fr] items-start gap-3 sm:gap-4">
              <span
                className={`z-10 grid size-12 place-items-center rounded-full border-[3px] border-ink font-display text-xs text-ink shadow-[var(--shadow-ink-sm)] sm:size-[4.5rem] sm:text-lg ${item.tone} ${i % 2 ? "rotate-6" : "-rotate-6"}`}
              >
                {item.year}
              </span>
              <div className="rounded-2xl border-[3px] border-ink bg-paper p-3.5 shadow-[var(--shadow-ink-sm)] sm:p-4">
                <h3 className="text-balance font-display text-xl uppercase leading-tight text-ink">{item.title}</h3>
                <p className="copy mt-1.5 max-w-[68ch] text-ink-soft">{item.text}</p>
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
          <h2 id="newspaper" className="mt-3 text-balance font-display text-2xl uppercase leading-tight text-ink">
            Jogo do canal da garagem vira febre e irrita vizinho
          </h2>
          <div className="mt-3">
            <figure className="float-right mb-1 ml-3 mt-1 w-20 rotate-3 border-[3px] border-ink bg-cream-2 p-1 grayscale sm:w-24">
              <KidBust who="deco" face="happy" className="w-full" />
              <figcaption className="mt-0.5 text-center font-display text-[0.625rem] uppercase leading-tight text-ink">Déco, astro do jogo</figcaption>
            </figure>
            <p className="copy-sm text-ink-soft first-letter:float-left first-letter:mr-1 first-letter:font-display first-letter:text-4xl first-letter:leading-none first-letter:text-ink">
              O Canal 404, que transmite de uma garagem no fim da rua, lançou um jogo que virou mania entre as crianças. Em Rua
              Sem Saída, uma engenhoca arremessa objetos para derrubar os enfeites do quintal de um vizinho.
            </p>
            <p className="copy-sm mt-2 text-ink-soft">
              O quintal existe, e o dono, o aposentado Arlindo, 71, não gostou: &ldquo;Agora toda criança da rua sabe
              derrubar o meu flamingo&rdquo;. Ele promete processar &ldquo;a TV com olhos&rdquo;.
            </p>
          </div>
        </article>

        <article className="-rotate-1 rounded-2xl border-[3px] border-ink bg-plum-800 p-5 text-cream shadow-[var(--shadow-ink-lg)] on-dark" aria-labelledby="credits">
          <h2 id="credits" className="font-display text-2xl uppercase tracking-wide text-sun">
            Ficha técnica
          </h2>
          <dl className="mt-3 divide-y-2 divide-dashed divide-plum-600">
            {CREDITS.map(([role, name]) => (
              <div key={role} className="flex items-center justify-between gap-3 py-1.5">
                <dt className="copy text-cream-2">{role}</dt>
                <dd className="shrink-0 font-display uppercase tracking-wide text-cream">{name}</dd>
              </div>
            ))}
          </dl>
        </article>
      </div>

      <PaperPanel className="mt-12 p-5 sm:p-7" aria-labelledby="behind-the-scenes">
        <h2 id="behind-the-scenes" className="font-display text-2xl uppercase tracking-wide text-ink">
          Sobre este portal (a parte real)
        </h2>
        <p className="copy mt-2 text-ink-soft">
          O Canal 404 é um projeto autoral e fictício. O canal, os personagens, os jogos e toda a arte foram criados para este
          portal. Os jogos rodam direto no navegador, sem instalar nada, e as músicas e os efeitos sonoros também são tocados
          pelo próprio navegador, nota por nota. O som só começa depois que você clica ou aperta uma
          tecla, e o botão de som desliga os efeitos.
        </p>
        <p className="copy mt-3 text-ink-soft">
          Fases liberadas, estrelas, conquistas, segredos, trilhas e pôsteres ficam salvos neste navegador. Para entrar nos
          recordes e na Missão 404 do Dia, basta tirar uma carteirinha com um apelido, sem e-mail e sem senha. A partir daí,
          seus resultados vão para o placar do canal, num servidor que confere cada pontuação antes de colocá-la no ranking.
          As conquistas das missões também ficam guardadas lá, e dá para sair do placar quando quiser, nos Extras.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <InkLink href="/" tone="sun">
            Voltar para a sala
          </InkLink>
          <WeeklyPlayLink tone="mint" />
        </div>
      </PaperPanel>
    </div>
  );
}
