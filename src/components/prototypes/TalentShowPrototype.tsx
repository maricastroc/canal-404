"use client";

import { useEffect, useRef, useState } from "react";
import { localized } from "@/i18n/copy";
import { useLocale } from "@/i18n/client";
import { formatNumber } from "@/i18n/format";
import { TALENT_COPY } from "@/games/talent-show/copy";
import type { PrototypeHandle } from "@/games/talent-show/prototype";
import type { Orientation } from "@/games/talent-show/scenes/layout";
import type { RunReport, TalentBridge } from "@/games/talent-show/scenes/StageScene";
import type { Mark } from "@/games/talent-show/sim/judge";
import type { SongId } from "@/games/talent-show/song/notation";
import { ROUNDS, SONG_ORDER } from "@/games/talent-show/song/songs";

const CALIBRATION_KEY = "canal404:talent-show:calibration:v1";
const SONG_KEY = "canal404:talent-show-prototype:song";
const PROGRESS_KEY = "canal404:talent-show-prototype:progress:v1";
const ASSIST_KEY = "canal404:talent-show-prototype:assist";

const COPY = localized({
  "pt-BR": {
    loading: "Ligando os refletores…",
    songs: "Rodadas",
    recalibrate: "Refazer o acerto de tempo",
    calibration: (ms: number | null) => (ms === null ? "Acerto de tempo: ainda não feito" : `Acerto de tempo: ${ms > 0 ? "+" : ms < 0 ? "−" : ""}${Math.abs(ms)} ms`),
    assist: "Modo assistido",
    assistNote: "Margem maior, notas do eco visíveis e chiado transparente. A plateia não corta e o resultado fica fora do placar.",
    best: (stars: number) => "★".repeat(stars) + "☆".repeat(3 - stars),
    runs: "Apresentações desta sessão",
    noRuns: "Nenhuma apresentação ainda.",
    stars: (n: number) => `${n} de 3 estrelas`,
    cut: "cortou para o intervalo",
    replayOk: "Rejulgado igual",
    replayBad: "Rejulgamento diferente",
    human: "Toque humano",
    inhuman: "Precisão inumana",
    assisted: "Assistido",
    timing: (mean: number, spread: number) => `erro médio ${mean > 0 ? "+" : ""}${Math.round(mean)} ms · dispersão ${Math.round(spread)} ms`,
    taps: (n: number) => `${n} toques`,
  },
  en: {
    loading: "Turning on the stage lights…",
    songs: "Rounds",
    recalibrate: "Redo the timing check",
    calibration: (ms: number | null) => (ms === null ? "Timing check: not done yet" : `Timing check: ${ms > 0 ? "+" : ms < 0 ? "−" : ""}${Math.abs(ms)} ms`),
    assist: "Assist mode",
    assistNote: "Wider timing, visible echo notes and see-through static. The crowd never cuts and the result stays off the scoreboard.",
    best: (stars: number) => "★".repeat(stars) + "☆".repeat(3 - stars),
    runs: "Performances this session",
    noRuns: "No performances yet.",
    stars: (n: number) => `${n} of 3 stars`,
    cut: "cut to commercials",
    replayOk: "Rejudged the same",
    replayBad: "Rejudge differs",
    human: "Human timing",
    inhuman: "Inhuman accuracy",
    assisted: "Assisted",
    timing: (mean: number, spread: number) => `mean error ${mean > 0 ? "+" : ""}${Math.round(mean)} ms · spread ${Math.round(spread)} ms`,
    taps: (n: number) => `${n} taps`,
  },
});

const MARKS: Mark[] = ["perfect", "good", "near", "miss", "held", "dropped", "noise"];

function cssFont(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function pickOrientation(): Orientation {
  return window.innerHeight > window.innerWidth * 1.15 && window.innerWidth < 900 ? "portrait" : "landscape";
}

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function loadCalibration(): number | null {
  const raw = read(CALIBRATION_KEY);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && Math.abs(n) <= 250 ? n : null;
}

function loadSong(): SongId {
  const raw = read(SONG_KEY);
  return SONG_ORDER.includes(raw as SongId) ? (raw as SongId) : "theme";
}

function loadProgress(): Partial<Record<SongId, number>> {
  try {
    const parsed = JSON.parse(read(PROGRESS_KEY) ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(SONG_ORDER.map((id) => [id, Math.max(0, Math.min(3, Number(parsed[id]) || 0))]));
  } catch {
    return {};
  }
}

export function TalentShowPrototype() {
  const locale = useLocale();
  const copy = COPY[locale];
  const game = TALENT_COPY[locale];
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<PrototypeHandle | null>(null);
  const songRef = useRef<SongId | null>(null);
  const assistRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [orientation, setOrientation] = useState<Orientation | null>(null);
  const [song, setSong] = useState<SongId>("theme");
  const [calibration, setCalibration] = useState<number | null>(null);
  const [assist, setAssist] = useState(false);
  const [progress, setProgress] = useState<Partial<Record<SongId, number>>>({});
  const [runs, setRuns] = useState<RunReport[]>([]);

  useEffect(() => {
    const update = () => setOrientation(pickOrientation());
    const init = () => {
      const initial = loadSong();
      songRef.current = initial;
      setSong(initial);
      setCalibration(loadCalibration());
      setProgress(loadProgress());
      assistRef.current = read(ASSIST_KEY) === "1";
      setAssist(assistRef.current);
      update();
    };
    init();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !orientation) return;
    let cancelled = false;
    setReady(false);
    const bridge: TalentBridge = {
      locale,
      fonts: { display: "Arial Black, sans-serif", body: "Trebuchet MS, sans-serif" },
      orientation,
      touch: window.matchMedia?.("(pointer: coarse)").matches ?? false,
      reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
      song: songRef.current ?? "theme",
      assist: () => assistRef.current,
      calibration: { load: loadCalibration, save: (ms) => write(CALIBRATION_KEY, String(ms)) },
      onSong: (id) => {
        songRef.current = id;
        setSong(id);
        write(SONG_KEY, id);
      },
      onRun: (report) => {
        setRuns((list) => [report, ...list].slice(0, 20));
        if (report.verdict.stars > 0 && !report.log.assist) {
          setProgress((current) => {
            const next = { ...current, [report.song]: Math.max(current[report.song] ?? 0, report.verdict.stars) };
            write(PROGRESS_KEY, JSON.stringify(next));
            return next;
          });
        }
      },
      onCalibration: (ms) => setCalibration(ms),
    };
    (async () => {
      await document.fonts.ready;
      const fonts = { display: cssFont("--font-luckiest", "Arial Black, sans-serif"), body: cssFont("--font-baloo", "Trebuchet MS, sans-serif") };
      await Promise.all([document.fonts.load(`48px ${fonts.display}`), document.fonts.load(`700 32px ${fonts.body}`)]).catch(() => undefined);
      bridge.fonts = fonts;
      const { mountPrototype } = await import("@/games/talent-show/prototype");
      if (cancelled) return;
      handleRef.current = mountPrototype(host, bridge);
      setReady(true);
    })();
    const observer = new ResizeObserver(() => handleRef.current?.refresh());
    observer.observe(host);
    return () => {
      cancelled = true;
      observer.disconnect();
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [locale, orientation]);

  const toggleAssist = () => {
    assistRef.current = !assistRef.current;
    setAssist(assistRef.current);
    write(ASSIST_KEY, assistRef.current ? "1" : "0");
    handleRef.current?.selectSong(songRef.current ?? "theme");
  };

  const portrait = orientation === "portrait";
  const chip = (active: boolean) => `rounded-lg border-2 px-2 py-0.5 font-body text-xs font-bold ${active ? "border-ink bg-sun text-ink" : "border-cream/40 text-cream/80 hover:bg-cream/10"}`;

  return (
    <div className="mx-auto flex w-full flex-col gap-4 px-3 pb-10 pt-3 [@media(max-height:520px)]:pt-1">
      <div className={portrait ? "mx-auto w-full max-w-[calc((100svh-4rem)*1080/1650)]" : "mx-auto w-full max-w-[calc((100svh-5rem)*16/9)] [@media(max-height:520px)]:max-w-[calc((100svh-1.5rem)*16/9)]"}>
        <div className="relative w-full overflow-hidden rounded-2xl border-[3px] border-ink bg-plum-900 shadow-[var(--shadow-ink-lg)]" style={{ aspectRatio: portrait ? "1080 / 1650" : "16 / 9" }}>
          <div ref={hostRef} className="absolute inset-0 flow-root touch-none select-none" />
          {!ready && <p className="absolute inset-0 flex items-center justify-center font-display text-2xl text-cream">{copy.loading}</p>}
        </div>
        <div className="mt-3 flex flex-col items-center gap-2" role="radiogroup" aria-label={copy.songs}>
          {ROUNDS.map((round) => (
            <div key={round.id} className="flex flex-wrap items-center justify-center gap-2">
              <span className="w-24 text-right font-display text-xs uppercase text-cream/70">{game.rounds[round.id]}</span>
              {round.songs.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={song === id}
                  className={chip(song === id)}
                  onClick={(e) => {
                    handleRef.current?.selectSong(id);
                    e.currentTarget.blur();
                  }}
                >
                  {game.songs[id].idea} · {game.songs[id].title} <span aria-hidden>{copy.best(progress[id] ?? 0)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <span className="font-body text-xs font-bold text-cream/80">{copy.calibration(calibration)}</span>
          <button
            type="button"
            className={chip(false)}
            onClick={(e) => {
              handleRef.current?.calibrate();
              e.currentTarget.blur();
            }}
          >
            {copy.recalibrate}
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={assist}
            className={chip(assist)}
            onClick={(e) => {
              toggleAssist();
              e.currentTarget.blur();
            }}
          >
            {copy.assist}
          </button>
        </div>
        {assist && <p className="mx-auto mt-2 max-w-xl text-center font-body text-xs text-cream/70">{copy.assistNote}</p>}
      </div>
      <section className="mx-auto w-full max-w-3xl rounded-2xl border-[3px] border-ink bg-cream p-4 text-ink shadow-[var(--shadow-ink)]">
        <h2 className="font-display text-xl uppercase">{copy.runs}</h2>
        {runs.length === 0 ? (
          <p className="mt-1 font-body text-sm">{copy.noRuns}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {runs.map((run, i) => {
              const v = run.verdict;
              const inhuman = v.flags.includes("inhuman");
              const marks = MARKS.filter((m) => (m !== "held" && m !== "dropped") || v.counts.held + v.counts.dropped > 0);
              return (
                <li key={`${run.song}-${runs.length - i}`} className="flex flex-wrap items-baseline gap-x-3 rounded-xl border-2 border-ink bg-cream-2 px-3 py-1.5 font-body text-sm">
                  <span className="font-bold">{game.songs[run.song].title}</span>
                  <span>{formatNumber(v.precision / 10000, locale, { style: "percent", maximumFractionDigits: 1 })}</span>
                  <span>{v.cutAt !== null ? copy.cut : copy.stars(v.stars)}</span>
                  <span>{marks.map((m) => `${game.markNames[m]} ${v.counts[m]}`).join(" · ")}</span>
                  <span>{copy.timing(v.timing.mean, v.timing.spread)}</span>
                  <span>{copy.taps(run.log.taps.length)}</span>
                  <span className={run.matches ? "font-bold text-mint-deep" : "font-bold text-tomato-deep"}>{run.matches ? copy.replayOk : copy.replayBad}</span>
                  <span className={inhuman ? "font-bold text-tomato-deep" : "font-bold text-mint-deep"}>{inhuman ? copy.inhuman : copy.human}</span>
                  {run.log.assist && <span className="font-bold">{copy.assisted}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
