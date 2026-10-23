"use client";

import { useState } from "react";
import { KeyholeBadge, LockedBadge, StarBadge } from "@/components/art/Badges";
import { LockIcon, PauseIcon, PlayTriangle } from "@/components/art/Icons";
import { InkButton } from "@/components/ui/Primitives";
import { getAudio } from "@/lib/audio/engine";
import { useMusicState, useSound } from "@/lib/audio/hooks";
import { TRACKS } from "@/lib/audio/tracks";
import { isTrackUnlocked } from "@/lib/audio/unlocks";
import { ACHIEVEMENTS, SECRETS } from "@/lib/progress/definitions";
import { useHydrated, useProgress } from "@/lib/progress/hooks";
import { resetProgress, setSetting, unlockAchievement } from "@/lib/progress/store";
import { PosterCard } from "./PosterCard";
import { POSTERS } from "./posters";

const SECTIONS = [
  { id: "posteres", label: "Pôsteres para baixar", art: "poster" },
  { id: "trilhas", label: "Trilhas sonoras", art: "radio" },
  { id: "conquistas", label: "Conquistas", art: "trophy" },
  { id: "segredos", label: "Segredos", art: "secret" },
] as const;

function TileArt({ kind }: { kind: (typeof SECTIONS)[number]["art"] }) {
  if (kind === "poster")
    return (
      <svg viewBox="0 0 80 64" className="h-16 w-20" aria-hidden>
        <rect x="8" y="10" width="34" height="46" fill="#63d6c1" stroke="#1d1830" strokeWidth="3.5" transform="rotate(-10 25 33)" />
        <rect x="22" y="6" width="34" height="46" fill="#ff8a3d" stroke="#1d1830" strokeWidth="3.5" transform="rotate(4 39 29)" />
        <rect x="38" y="10" width="34" height="46" fill="#fbf5e6" stroke="#1d1830" strokeWidth="3.5" transform="rotate(12 55 33)" />
        <circle cx="56" cy="30" r="7" fill="#ffc83d" stroke="#1d1830" strokeWidth="3" />
      </svg>
    );
  if (kind === "radio")
    return (
      <svg viewBox="0 0 80 64" className="h-16 w-20" aria-hidden>
        <path d="M24 18 Q24 6 40 6 Q56 6 56 18" fill="none" stroke="#1d1830" strokeWidth="5" />
        <rect x="6" y="16" width="68" height="42" rx="8" fill="#2f86c9" stroke="#1d1830" strokeWidth="3.5" />
        <circle cx="25" cy="37" r="12" fill="#2b2150" stroke="#1d1830" strokeWidth="3" />
        <rect x="42" y="25" width="24" height="12" rx="2" fill="#9df0dc" stroke="#1d1830" strokeWidth="3" />
        <circle cx="48" cy="47" r="3.5" fill="#ef4f43" stroke="#1d1830" strokeWidth="2" />
        <circle cx="60" cy="47" r="3.5" fill="#ffc83d" stroke="#1d1830" strokeWidth="2" />
      </svg>
    );
  if (kind === "trophy")
    return (
      <svg viewBox="0 0 80 64" className="h-16 w-20" aria-hidden>
        <path d="M28 8 Q14 8 16 22 Q18 32 30 34 M52 8 Q66 8 64 22 Q62 32 50 34" fill="none" stroke="#1d1830" strokeWidth="5" />
        <path d="M26 6 L54 6 Q54 34 40 38 Q26 34 26 6 Z" fill="#ffc83d" stroke="#1d1830" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M36 38 L44 38 L45 48 L35 48 Z" fill="#eda21a" stroke="#1d1830" strokeWidth="3" />
        <rect x="26" y="48" width="28" height="12" rx="3" fill="#5a4790" stroke="#1d1830" strokeWidth="3" />
      </svg>
    );
  return (
    <svg viewBox="0 0 80 64" className="h-16 w-20" aria-hidden>
      <rect x="18" y="8" width="44" height="50" rx="8" fill="#3f3170" stroke="#1d1830" strokeWidth="3.5" />
      <text x="40" y="45" textAnchor="middle" fontSize="34" fill="#b9a6ef" style={{ fontFamily: "var(--font-luckiest)" }}>
        ?
      </text>
      <path d="M66 10 L70 4 M70 18 L76 16 M12 50 L6 54" stroke="#ffc83d" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function SectionTitle({ id, children, count }: { id: string; children: React.ReactNode; count?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
      <h2 id={id} className="scroll-mt-24 font-display text-4xl uppercase tracking-wide text-cream [text-shadow:3px_4px_0_var(--color-ink)]">
        {children}
      </h2>
      {count && (
        <p className="rounded-lg border-[3px] border-ink bg-sun px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]">
          {count}
        </p>
      )}
    </div>
  );
}

export function ExtrasHub() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const music = useMusicState();
  const { play, hover } = useSound();
  const [confirming, setConfirming] = useState(false);
  const p = progress;
  const secretsFound = hydrated ? Object.keys(p.secrets).length : 0;
  const achievementsDone = hydrated ? Object.keys(p.achievements).length : 0;

  const toggleTrack = (id: string) => {
    const engine = getAudio();
    if (music.playing && music.trackId === id) {
      engine.stopMusic();
      play("toggleOff");
      return;
    }
    play("toggleOn");
    engine.startMusic(id);
    setSetting("track", id);
    unlockAchievement("radio-ligado");
  };

  return (
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Seções dos extras" className="paper border-[3px] border-ink p-4 shadow-[var(--shadow-ink-lg)] wobbly sm:p-6">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
                onClick={() => play("page")}
                className={`press flex h-full flex-col items-center gap-2 rounded-2xl border-[3px] border-ink bg-cream-2 p-3 text-center shadow-[var(--shadow-ink)] ${i % 2 ? "rotate-1" : "-rotate-1"}`}
              >
                <TileArt kind={s.art} />
                <span className="font-display text-sm uppercase leading-tight tracking-wide text-ink">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Segredos encontrados", value: secretsFound, total: SECRETS.length, color: "bg-mint" },
            { label: "Conquistas", value: achievementsDone, total: ACHIEVEMENTS.length, color: "bg-sun" },
          ].map((m) => (
            <div key={m.label}>
              <div className="flex justify-between font-display text-sm uppercase tracking-wide text-ink">
                <span>{m.label}</span>
                <span className="tabular-nums">
                  {m.value}/{m.total}
                </span>
              </div>
              <div
                className="mt-1 h-5 overflow-hidden rounded-full border-[3px] border-ink bg-cream"
                role="progressbar"
                aria-label={m.label}
                aria-valuemin={0}
                aria-valuemax={m.total}
                aria-valuenow={m.value}
              >
                <div className={`h-full border-r-[3px] border-ink ${m.color}`} style={{ width: `${(m.value / m.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </nav>

      <section aria-labelledby="posteres" className="mt-14">
        <SectionTitle id="posteres" count={`${POSTERS.filter((po) => hydrated && po.unlock.check(p)).length}/${POSTERS.length} liberados`}>
          Pôsteres para baixar
        </SectionTitle>
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {POSTERS.map((poster, i) => (
            <li key={poster.id}>
              <PosterCard def={poster} unlocked={hydrated && poster.unlock.check(p)} index={i} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="trilhas" className="mt-14">
        <SectionTitle id="trilhas" count={`${TRACKS.filter((t) => hydrated && isTrackUnlocked(t, p)).length}/${TRACKS.length} liberadas`}>
          Trilhas sonoras
        </SectionTitle>
        <ul className="paper divide-y-[3px] divide-dashed divide-ink/20 border-[3px] border-ink px-4 shadow-[var(--shadow-ink-lg)] wobbly-alt">
          {TRACKS.map((track, i) => {
            const unlocked = hydrated && isTrackUnlocked(track, p);
            const playing = music.playing && music.trackId === track.id;
            return (
              <li key={track.id} className="flex flex-wrap items-center gap-4 py-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-plum-800 font-display text-lg text-sun">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl uppercase leading-tight text-ink">{unlocked ? track.title : "Faixa escondida"}</p>
                  <p className="text-ink-soft">
                    {unlocked ? (
                      <>
                        <span className="font-display text-xs uppercase tracking-wider text-plum-600">{track.station}</span> · {track.mood}
                      </>
                    ) : (
                      <span className="font-hand text-lg">Como liberar: {track.unlock.type === "default" ? "" : track.unlock.label}</span>
                    )}
                  </p>
                </div>
                {playing && (
                  <span aria-hidden className="flex h-8 items-end gap-1">
                    {[0.1, 0.4, 0.2, 0.6].map((d) => (
                      <span key={d} className="h-full w-1.5 origin-bottom rounded-sm bg-ink" style={{ animation: `eq 0.7s ease-in-out ${-d}s infinite` }} />
                    ))}
                  </span>
                )}
                {unlocked ? (
                  <InkButton
                    size="sm"
                    tone={playing ? "tomato" : "sun"}
                    aria-pressed={playing}
                    aria-label={playing ? `Parar ${track.title}` : `Tocar ${track.title}`}
                    onClick={() => toggleTrack(track.id)}
                  >
                    {playing ? <PauseIcon className="size-5 text-ink" /> : <PlayTriangle className="size-5 text-ink" />}
                    {playing ? "Parar" : "Tocar"}
                  </InkButton>
                ) : (
                  <span className="flex items-center gap-2 font-display text-sm uppercase tracking-wide text-ink-soft">
                    <LockIcon className="size-7" /> Bloqueada
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 font-hand text-lg text-cream-2">
          As trilhas são tocadas ao vivo pelo sintetizador do canal. O rádio da sala toca as mesmas faixas.
        </p>
      </section>

      <section aria-labelledby="conquistas" className="mt-14">
        <SectionTitle id="conquistas" count={`${achievementsDone}/${ACHIEVEMENTS.length}`}>
          Conquistas
        </SectionTitle>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const done = hydrated && Boolean(p.achievements[a.id]);
            return (
              <li
                key={a.id}
                className={`flex items-center gap-3 rounded-2xl border-[3px] border-ink p-3 shadow-[var(--shadow-ink)] ${done ? "paper" : "bg-plum-800 text-cream"}`}
              >
                <div className="w-16 shrink-0">{done ? <StarBadge color={a.color} className="w-full" /> : <LockedBadge className="w-full" />}</div>
                <div className="min-w-0">
                  <p className={`font-display text-lg uppercase leading-tight ${done ? "text-ink" : "text-plum-300"}`}>{a.title}</p>
                  <p className={`text-sm leading-snug ${done ? "text-ink-soft" : "text-cream-2"}`}>
                    {done ? a.description : <span className="font-hand text-base">Dica: {a.hint}</span>}
                  </p>
                  <span className="sr-only">{done ? "Conquistada." : "Ainda não conquistada."}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="segredos" className="mt-14">
        <SectionTitle id="segredos" count={`${secretsFound}/${SECRETS.length}`}>
          Segredos da sala
        </SectionTitle>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SECRETS.map((s, i) => {
            const found = hydrated && Boolean(p.secrets[s.id]);
            return (
              <li
                key={s.id}
                className={`flex items-center gap-4 border-[3px] border-ink p-4 shadow-[var(--shadow-ink)] wobbly-sm ${found ? "paper" : "bg-plum-950 text-cream"} ${i % 2 ? "rotate-[0.5deg]" : "-rotate-[0.5deg]"}`}
              >
                <div className="w-14 shrink-0">{found ? <KeyholeBadge className="w-full" /> : <LockedBadge className="w-full" />}</div>
                <div>
                  <p className={`font-display text-lg uppercase leading-tight ${found ? "text-ink" : "text-plum-300"}`}>
                    {found ? s.title : "? ? ? ? ?"}
                  </p>
                  <p className={`leading-snug ${found ? "text-ink-soft" : "font-hand text-lg text-cream-2"}`}>{found ? s.description : s.hint}</p>
                  <span className="sr-only">{found ? "Encontrado." : "Ainda não encontrado."}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Gerenciar progresso" className="mt-14 flex flex-wrap items-center justify-center gap-3 text-center">
        {confirming ? (
          <>
            <p className="w-full font-hand text-xl text-cream-2">
              Isso apaga segredos, conquistas e recordes salvos neste navegador. Tem certeza?
            </p>
            <InkButton
              tone="tomato"
              size="sm"
              onClick={() => {
                resetProgress();
                setConfirming(false);
                play("static");
              }}
            >
              Sim, apagar tudo
            </InkButton>
            <InkButton tone="cream" size="sm" onClick={() => setConfirming(false)}>
              Cancelar
            </InkButton>
          </>
        ) : (
          <InkButton tone="cream" size="sm" onClick={() => setConfirming(true)}>
            Apagar meu progresso
          </InkButton>
        )}
      </section>
    </div>
  );
}
