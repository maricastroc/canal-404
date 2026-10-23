"use client";

import { Sparkle } from "@/components/art/Badges";
import { Mascot404 } from "@/components/mascot/Mascot404";

export const LOADING_STEPS = [
  { at: 0, text: "Ligando a transmissão..." },
  { at: 0.3, text: "Procurando o controle remoto..." },
  { at: 0.55, text: "Aquecendo os pixels..." },
  { at: 0.9, text: "Quase lá..." },
  { at: 1, text: "Pronto! (talvez)" },
];

const TIPS = [
  "Objetos estranhos fazem combos melhores.",
  "O pato de borracha quica até em ideia ruim.",
  "Bagunça também vale ponto. Derrube tudo!",
  "Munição que sobra vira bônus no final.",
  "A linha pontilhada é o plano do Bruno. Confie... um pouco.",
  "O balão d'água empurra tudo que estiver perto quando estoura.",
  "O pneu é pesado: mire na base das pilhas.",
];

export function pickTip(seed: number) {
  return TIPS[Math.abs(seed) % TIPS.length];
}

export function LoadingScreen({
  progress,
  tip,
  leaving,
}: {
  progress: number;
  tip: string;
  leaving: boolean;
}) {
  const pct = Math.round(progress * 100);
  return (
    <div
      className={`absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-plum-900 p-4 transition-opacity duration-300 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`}
      style={{ backgroundImage: "var(--dots-dark)", backgroundSize: "18px 18px" }}
    >
      <div className="paper relative grid w-full max-w-3xl items-center gap-4 border-[3px] border-ink p-5 shadow-[var(--shadow-ink-lg)] wobbly sm:grid-cols-[1fr_1.25fr] sm:p-8">
        <Sparkle className="absolute -left-4 top-6 w-10 -rotate-12" />
        <Sparkle className="absolute right-6 -top-5 w-9" color="#b9a6ef" />
        <div className="relative order-2 mx-auto w-44 sm:order-1 sm:w-full sm:max-w-64">
          <div style={{ animation: "float 1.8s ease-in-out infinite" }}>
            <Mascot404 pose="controller" expression={progress >= 1 ? "excited" : "happy"} className="w-full" />
          </div>
        </div>
        <div className="order-1 sm:order-2">
          <h1 className="font-display text-4xl uppercase tracking-wide text-ink sm:text-5xl">
            Carregando<span style={{ animation: "blink-caret 1s steps(2) infinite" }}>...</span>
          </h1>
          <div
            role="progressbar"
            aria-label="Carregando o jogo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="mt-4 h-9 overflow-hidden rounded-full border-[3px] border-ink bg-cream-2 shadow-[var(--shadow-ink-sm)]"
          >
            <div
              className="relative h-full rounded-full border-r-[3px] border-ink bg-plum-500 transition-[width] duration-200 ease-out"
              style={{ width: `${Math.max(6, pct)}%` }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, rgba(255,255,255,.18) 0 10px, transparent 10px 20px)",
                  backgroundSize: "40px 40px",
                  animation: "stripe-scroll 0.8s linear infinite",
                }}
              />
              <div className="absolute inset-y-0 right-0 w-8 bg-tangerine" />
            </div>
          </div>
          <ul className="mt-4 space-y-1.5" aria-hidden>
            {LOADING_STEPS.map((step) => {
              const done = progress >= step.at && (step.at < 1 || progress >= 1);
              return (
                <li key={step.text} className={`flex items-center gap-2 font-hand text-lg ${done ? "text-ink" : "text-ink/35"}`}>
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-md border-[2.5px] border-ink text-sm font-bold ${done ? "bg-mint" : "bg-cream"}`}
                  >
                    {done ? "✓" : ""}
                  </span>
                  {step.text}
                </li>
              );
            })}
          </ul>
          <div className="mt-5 -rotate-2 rounded-xl border-[3px] border-ink bg-sun px-4 py-2 shadow-[var(--shadow-ink)]">
            <p className="font-display text-sm uppercase tracking-wider text-ink">Dica 404:</p>
            <p className="font-hand text-lg leading-snug text-ink">{tip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
