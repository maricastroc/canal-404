"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Sparkle } from "@/components/art/Badges";
import { Mascot404, type MascotExpression } from "@/components/mascot/Mascot404";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { useSound } from "@/lib/audio/hooks";
import { CHARACTERS, type CharacterId } from "@/lib/characters";
import { GAMES } from "@/games/registry";
import { KidBust, type Face } from "./Heads";

function Portrait({ id, face, className }: { id: CharacterId; face: Face; className?: string }) {
  if (id === "404") {
    const map: Record<Face, MascotExpression> = { normal: "happy", happy: "excited", wow: "surprised" };
    return <Mascot404 expression={map[face]} pose="full" className={className} />;
  }
  return <KidBust who={id} face={face} className={className} />;
}

const EXTRA_LINES: Record<CharacterId, string[]> = {
  "404": ["Ei! Isso faz cócegas na antena!", "Sintonizado e pronto pra bagunça!", "Eu tô no ar. Literalmente."],
  lina: ["Me passa a fita adesiva!", "Se explodir, é sinal que funcionou.", "Já volto, vou desmontar a torradeira."],
  bruno: ["Isso não estava no plano.", "Anotado. No caderno 14.", "Probabilidade de dar certo: 12%."],
  deco: ["BORA!", "Quem chegar por último é o Bruno!", "Ops. Isso era importante?"],
  mila: ["...", "A lua piscou pra mim de novo.", "Você também ouviu a geladeira cantar?"],
};

export function CharacterSelect() {
  const [selected, setSelected] = useState<CharacterId>("404");
  const [face, setFace] = useState<Face>("normal");
  const [line, setLine] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const counter = useRef(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const { play, hover } = useSound();
  const character = CHARACTERS.find((c) => c.id === selected)!;
  const games = GAMES.filter((g) => g.cast.includes(character.id));

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace("#", "") as CharacterId;
      if (CHARACTERS.some((c) => c.id === id)) {
        setSelected(id);
        document.getElementById("ficha")?.scrollIntoView({ block: "nearest" });
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const select = (id: CharacterId) => {
    if (id === selected) return;
    play("pop", { pitch: 0.9 + CHARACTERS.findIndex((c) => c.id === id) * 0.08 });
    setSelected(id);
    setFace("normal");
    setLine(null);
    history.replaceState(null, "", `#${id}`);
  };

  const poke = () => {
    counter.current += 1;
    const lines = EXTRA_LINES[selected];
    play(character.sound);
    setFace(counter.current % 2 ? "wow" : "happy");
    setLine(lines[counter.current % lines.length]);
    setBump((b) => b + 1);
    window.setTimeout(() => setFace("normal"), 1600);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % CHARACTERS.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + CHARACTERS.length) % CHARACTERS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = CHARACTERS.length - 1;
    else return;
    event.preventDefault();
    select(CHARACTERS[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Escolha um personagem"
        className="on-dark relative mx-auto flex max-w-5xl flex-wrap justify-center gap-3 rounded-[26px] border-[3px] border-ink bg-plum-800 p-3 shadow-[var(--shadow-ink-lg)] sm:gap-4 sm:p-5"
      >
        <span aria-hidden className="absolute -left-5 -top-6 w-12 rotate-12">
          <Sparkle />
        </span>
        {CHARACTERS.map((c, i) => {
          const active = c.id === selected;
          return (
            <button
              key={c.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={`tab-${c.id}`}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls="ficha"
              tabIndex={active ? 0 : -1}
              onClick={() => select(c.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
              className={`group relative flex w-[calc(33%-0.75rem)] min-w-24 flex-col items-center overflow-hidden rounded-2xl border-[3px] border-ink pb-2 pt-1 shadow-[var(--shadow-ink)] transition-transform duration-200 sm:w-36 ${c.cardClass} ${
                active ? "-translate-y-2 -rotate-2 scale-105" : "hover:-translate-y-1 hover:rotate-1"
              }`}
            >
              <span className="relative block h-24 w-full sm:h-32">
                <span className="absolute inset-x-2 bottom-0 top-1">
                  <Portrait id={c.id} face={active ? "happy" : "normal"} className="h-full w-full" />
                </span>
              </span>
              <span className="mt-1 font-display text-lg uppercase leading-none text-ink sm:text-xl">{c.name}</span>
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink">({c.role})</span>
              {active && (
                <motion.span
                  layoutId="char-marker"
                  className="absolute -top-0.5 right-1.5 text-2xl text-sun drop-shadow-[2px_2px_0_#1d1830]"
                  aria-hidden
                >
                  ★
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      <div
        id="ficha"
        role="tabpanel"
        aria-labelledby={`tab-${character.id}`}
        tabIndex={0}
        className="mx-auto mt-10 max-w-5xl scroll-mt-28"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={character.id}
            initial={{ opacity: 0, y: 24, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="paper grid gap-6 border-[3px] border-ink p-5 shadow-[var(--shadow-ink-lg)] wobbly sm:p-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
          >
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={poke}
                className={`relative grid w-full max-w-xs place-items-center rounded-[28px] border-[3px] border-ink p-4 shadow-[var(--shadow-ink)] transition-transform hover:-rotate-1 active:scale-95 ${character.cardClass}`}
              >
                <span key={bump} className="block w-full" style={{ animation: bump ? "hop 0.45s ease-out" : undefined }}>
                  <Portrait id={character.id} face={face} className="mx-auto w-[86%]" />
                </span>
                <span className="absolute bottom-2 right-3 rounded-md border-2 border-ink bg-cream px-1.5 font-display text-[10px] uppercase tracking-wide text-ink">
                  Cutucar<span className="sr-only"> {character.name}</span>!
                </span>
              </button>
              <div className="mt-4 min-h-20 w-full max-w-xs" aria-live="polite">
                <SpeechBubble tail="top" className="font-hand text-xl leading-snug">
                  {line ?? character.catchphrase}
                </SpeechBubble>
              </div>
            </div>
            <div>
              <p className="inline-block -rotate-2 rounded-md border-[3px] border-ink bg-sun px-2 font-display text-sm uppercase tracking-wider text-ink">
                {character.role}
              </p>
              <h2 className="mt-2 font-display text-6xl uppercase leading-none tracking-wide text-ink">{character.name}</h2>
              <p className="mt-3 text-lg leading-relaxed text-ink-soft">{character.bio}</p>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border-[3px] border-ink bg-mint/60 p-3">
                  <dt className="font-display text-xs uppercase tracking-widest text-ink">Gosta de</dt>
                  <dd className="mt-0.5 leading-snug text-ink">{character.likes}</dd>
                </div>
                <div className="rounded-xl border-[3px] border-ink bg-bubblegum/50 p-3">
                  <dt className="font-display text-xs uppercase tracking-widest text-ink">Não suporta</dt>
                  <dd className="mt-0.5 leading-snug text-ink">{character.dislikes}</dd>
                </div>
                <div className="rounded-xl border-[3px] border-ink bg-sun/60 p-3 sm:col-span-2">
                  <dt className="font-display text-xs uppercase tracking-widest text-ink">Curiosidade</dt>
                  <dd className="mt-0.5 font-hand text-xl leading-snug text-ink">{character.fact}</dd>
                </div>
              </dl>
              <div className="mt-5">
                <p className="font-display text-sm uppercase tracking-widest text-ink-soft">
                  Aparece em
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {games.length ? (
                    games.map((g) => (
                      <li key={g.slug}>
                        <Link
                          href={`/jogos/${g.slug}`}
                          className="press inline-flex min-h-10 items-center rounded-lg border-[3px] border-ink bg-cream px-3 font-display text-sm uppercase tracking-wide text-ink shadow-[var(--shadow-ink-sm)]"
                        >
                          {g.title}
                          {g.status === "em-breve" && <span className="ml-1.5 text-xs text-ink-soft">(em breve)</span>}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li>
                      <Link
                        href="/"
                        className="press inline-flex min-h-10 items-center rounded-lg border-[3px] border-ink bg-cream px-3 font-display text-sm uppercase tracking-wide text-ink shadow-[var(--shadow-ink-sm)]"
                      >
                        Na sala de transmissão, em todo intervalo
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
