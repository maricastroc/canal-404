"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { getAudio } from "@/lib/audio/engine";
import { useMusicState, useSound } from "@/lib/audio/hooks";
import { TRACKS } from "@/lib/audio/tracks";
import { useHydrated, useProgress } from "@/lib/progress/hooks";
import { setSetting, unlockAchievement, unlockSecret } from "@/lib/progress/store";
import { SCENE, SPOTS, spotCenter, spotStyle, type Spot } from "./layout";
import { Arcade } from "./objects/Arcade";
import {
  BooksArt,
  CartridgesArt,
  CatArt,
  CeilingLampArt,
  ControllersArt,
  HiddenCartArt,
  LAVA_PALETTES,
  LavaArt,
  OnAirSign,
  PizzaArt,
  PlaneArt,
  PosterChaosArt,
  PosterDreamArt,
  RadioArt,
  SkateArt,
  TrophyArt,
  VhsArt,
  WindowArt,
  type CatMood,
  type SkyPeriod,
} from "./objects/Decor";
import { Tv } from "./objects/Tv";
import { CHANNEL_ORDER, CHANNELS, type ChannelId } from "./objects/TvChannels";
import { RoomBackdrop } from "./RoomBackdrop";
import { RoomButton } from "./RoomObject";
import { useMascotDirector } from "./useMascotDirector";
import { unlockedTracks } from "@/lib/audio/unlocks";

const MASCOT_JOKES: { text: string; expression: "happy" | "wink" | "excited" | "confused" | "surprised" }[] = [
  { text: "Oi! Eu sou o 404. Sim, igual ao erro. Não, eu não estou perdido.", expression: "happy" },
  { text: "Minha cabeça pega 3 canais e meio. O meio é só chiado.", expression: "wink" },
  { text: "Se você bater em mim, eu volto a funcionar? Melhor não testar.", expression: "confused" },
  { text: "Curiosidade: eu fui feito com uma TV que caiu do caminhão de mudança.", expression: "excited" },
  { text: "Tô de fone porque a trilha do canal não para nunca. NUNCA.", expression: "surprised" },
];

const BOOK_TIPS = [
  "Manual de Engenhocas, pág. 12: puxe mais pra trás pra ir mais longe.",
  "Pág. 31: o pato de borracha quica. Use isso a seu favor.",
  "Pág. 47: balão d'água empurra tudo em volta quando estoura.",
  "Pág. 88: o pneu é pesado. Derruba pilhas inteiras.",
  "Última página: 'Se der errado, culpe o Déco.' — assinado, Lina.",
];

const CARTRIDGE_LINES = [
  "Cartucho RUA: Rua Sem Saída. Tá até gasto de tanto jogar.",
  "Cartucho LAB: Laboratório de Péssimas Ideias. A Lina terminou! Dá pra jogar no fliperama.",
  "Cartucho LAN: Guerra de Lanche. Ainda tem pudim grudado nele.",
  "Cartucho ???: esse não tem nome. Às vezes ele esquenta sozinho.",
];

function periodFor(hour: number): SkyPeriod {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 19) return "dusk";
  return "night";
}

const PERIOD_LINES: Record<SkyPeriod, string> = {
  morning: "Lá fora é de manhã. Aqui dentro é sempre sábado de manhã de 2004.",
  afternoon: "Tarde ensolarada lá fora. Perfeita pra ficar aqui dentro jogando.",
  dusk: "O sol tá indo embora. A transmissão, não.",
  night: "Já é noite! Hora de dormir... ou de só mais uma partida.",
};

export function BroadcastRoom() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const progress = useProgress();
  const { play, hover } = useSound();
  const music = useMusicState();
  const director = useMascotDirector();
  const dockTarget = hydrated ? document.getElementById("mascot-dock") : null;
  const { say, setHint, poke } = director;

  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [wiggle, setWiggle] = useState(0);
  const pokes = useRef<number[]>([]);

  const [channel, setChannel] = useState<ChannelId>("street");
  const [lastRegular, setLastRegular] = useState<ChannelId>("street");
  const [switching, setSwitching] = useState(false);
  const [osd, setOsd] = useState(false);
  const [knobAngle, setKnobAngle] = useState(0);
  const [flash, setFlash] = useState(false);
  const turns = useRef(0);
  const zaps = useRef<number[]>([]);

  const [lightsOn, setLightsOn] = useState(true);
  const [lava, setLava] = useState(0);
  const [flying, setFlying] = useState(false);
  const [catMood, setCatMood] = useState<CatMood>("sleep");
  const catPets = useRef(0);
  const catTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pizzaOpen, setPizzaOpen] = useState(false);
  const [peeled, setPeeled] = useState(false);
  const [shine, setShine] = useState(false);
  const [arcadeActive, setArcadeActive] = useState(false);
  const [rumble, setRumble] = useState(false);
  const [cartsShuffle, setCartsShuffle] = useState(0);
  const [hiddenFound, setHiddenFound] = useState(false);
  const [skating, setSkating] = useState(0);
  const counters = useRef({ joke: 0, book: 0, cart: 0 });
  const [period, setPeriod] = useState<SkyPeriod>("afternoon");
  const greeted = useRef(false);

  useEffect(() => {
    const update = () => setPeriod(periodFor(new Date().getHours()));
    update();
    const id = window.setInterval(update, 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hydrated || greeted.current) return;
    greeted.current = true;
    const returning = progress.visits > 1;
    const timer = window.setTimeout(() => {
      say({
        text: returning
          ? "Ei! Você voltou! Bora jogar alguma coisa?"
          : "Ei! Visitante novo! Pode mexer em tudo da sala. Quase tudo faz alguma coisa.",
        expression: returning ? "happy" : "excited",
        duration: 9000,
        announce: false,
      });
      poke();
    }, 450);
    return () => window.clearTimeout(timer);
  }, [hydrated, progress.visits, say, poke]);

  const lookAtSpot = useCallback((spot: Spot) => {
    const target = spotCenter(spot);
    const origin = spotCenter(SPOTS.mascot);
    const dx = (target.x - origin.x) / 500;
    const dy = (target.y - origin.y) / 360;
    setLook({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
  }, []);

  const onHint = useCallback(
    (text: string | null, spot: Spot) => {
      setHint(text);
      if (text) lookAtSpot(spot);
    },
    [lookAtSpot, setHint],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const scene = sceneRef.current;
        if (!scene) return;
        const rect = scene.getBoundingClientRect();
        const center = spotCenter(SPOTS.mascot);
        const cx = rect.left + (center.x / SCENE.w) * rect.width;
        const cy = rect.top + (center.y / SCENE.h) * rect.height;
        const dx = (event.clientX - cx) / (rect.width * 0.32);
        const dy = (event.clientY - cy) / (rect.height * 0.4);
        setLook({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
      });
      poke();
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerdown", onMove);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerdown", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [poke]);

  const tuneTo = useCallback(
    (next: ChannelId, opts: { quiet?: boolean } = {}) => {
      setSwitching(true);
      setOsd(true);
      if (!opts.quiet) play("static");
      window.setTimeout(() => {
        setChannel(next);
        setSwitching(false);
      }, reduced ? 0 : 280);
      window.setTimeout(() => setOsd(false), 1800);
    },
    [play, reduced],
  );

  const handleKnob = useCallback(() => {
    poke();
    turns.current += 1;
    setKnobAngle((a) => a + 45);
    const now = Date.now();
    zaps.current = [...zaps.current.filter((t) => now - t < 8000), now];
    if (zaps.current.length >= 5) unlockAchievement("channel-surfer");
    let next: ChannelId;
    if (turns.current % 9 === 8) {
      next = "lost";
    } else {
      const base = channel === "lost" || channel === "tape" ? lastRegular : channel;
      next = CHANNEL_ORDER[(CHANNEL_ORDER.indexOf(base) + 1) % CHANNEL_ORDER.length];
      setLastRegular(next);
    }
    tuneTo(next);
    if (next === "lost") {
      unlockSecret("lost-channel");
      say({ text: "Peraí... que canal é esse? Eu nunca vi esse canal. Eu SOU o canal!", expression: "surprised", duration: 6500 });
    } else {
      const lines: Partial<Record<ChannelId, string>> = {
        street: "Canal 3: o jogo da semana! Rua Sem Saída.",
        pajama: "Canal 5: estreia da Guerra do Pijama! Travesseiro voando pra todo lado.",
        bars: "Canal 7: fora do ar. Relaxa, isso é normal aqui.",
        cartoon: "Canal 9: reprise do meu desenho! Eu tô ótimo nesse episódio.",
      };
      say({ text: lines[next] ?? CHANNELS[next].name, expression: next === "bars" ? "confused" : "happy", duration: 4200 });
    }
  }, [channel, lastRegular, poke, say, tuneTo]);

  useEffect(() => {
    let buffer = "";
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!/^[0-9]$/.test(event.key)) return;
      buffer = (buffer + event.key).slice(-3);
      if (buffer === "404") {
        buffer = "";
        tuneTo("lost");
        unlockSecret("lost-channel");
        say({ text: "Você digitou o nome do canal! A TV obedeceu. Assustador.", expression: "surprised", duration: 6000 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [say, tuneTo]);

  const launch = useCallback(
    (href: string, isPlay: boolean) => {
      play(isPlay ? "tvOn" : "confirm");
      if (reduced) {
        router.push(href);
        return;
      }
      setFlash(true);
      say({ text: isPlay ? "Ligando a transmissão! Segura o controle!" : "Bora lá!", expression: "excited", duration: 2000, announce: false });
      window.setTimeout(() => router.push(href), 320);
    },
    [play, reduced, router, say],
  );

  const handleArcade = useCallback(() => {
    play("coin");
    setArcadeActive(true);
    say({ text: "Ficha inserida! Abrindo o catálogo...", expression: "excited", duration: 2000, announce: false });
    window.setTimeout(() => router.push("/games"), reduced ? 0 : 480);
  }, [play, reduced, router, say]);

  const tracks = useMemo(() => unlockedTracks(progress), [progress]);

  const toggleRadio = useCallback(() => {
    poke();
    const engine = getAudio();
    if (music.playing) {
      engine.stopMusic();
      play("toggleOff");
      say({ text: "Rádio desligado. O silêncio também é uma trilha sonora. Uma bem chata.", expression: "neutral", duration: 4200 });
      return;
    }
    const id = tracks.some((t) => t.id === progress.settings.track) ? progress.settings.track : "theme";
    play("toggleOn");
    engine.startMusic(id);
    unlockAchievement("radio-on");
    const track = TRACKS.find((t) => t.id === id);
    say({ text: `Rádio 404 no ar! Tocando: ${track?.title}.`, expression: "happy", duration: 4200 });
  }, [music.playing, play, poke, progress.settings.track, say, tracks]);

  const nextStation = useCallback(() => {
    poke();
    const index = tracks.findIndex((t) => t.id === music.trackId);
    const next = tracks[(index + 1) % tracks.length];
    play("static", { volume: 0.6 });
    getAudio().startMusic(next.id);
    setSetting("track", next.id);
    const locked = TRACKS.length - tracks.length;
    say({
      text: `${next.station}: ${next.title}.${locked > 0 ? ` (Ainda tem ${locked} ${locked > 1 ? "estações escondidas" : "estação escondida"}...)` : ""}`,
      expression: "wink",
      duration: 4200,
    });
  }, [music.trackId, play, poke, say, tracks]);

  const handleLamp = useCallback(() => {
    poke();
    play("chain");
    const next = !lightsOn;
    setLightsOn(next);
    if (!next) {
      unlockSecret("blackout");
      say({ text: "Ei, quem apagou a luz? ...Peraí, tem alguma coisa escrita na parede!", expression: "surprised", duration: 5200 });
    } else {
      say({ text: "Luz de volta! Que susto.", expression: "happy", duration: 2600 });
    }
  }, [lightsOn, play, poke, say]);

  const handlePlane = useCallback(() => {
    poke();
    if (flying) return;
    play("engine");
    setFlying(true);
    unlockSecret("plane");
    say({ text: "O aviãozinho voou! Ninguém sabe como. Física de desenho animado.", expression: "excited", duration: 4000 });
    window.setTimeout(() => setFlying(false), reduced ? 400 : 3200);
  }, [flying, play, poke, reduced, say]);

  const handleCat = useCallback(() => {
    poke();
    if (catTimer.current) clearTimeout(catTimer.current);
    catPets.current += 1;
    if (catPets.current >= 3) {
      setCatMood("purr");
      play("purr");
      unlockSecret("cat");
      say({ text: "O Pixel tá ronronando! Ele só faz isso com gente muito especial. Ou com quem tem atum.", expression: "love", duration: 5000 });
      catPets.current = 0;
    } else {
      setCatMood("awake");
      play("meow");
      say({
        text: catPets.current === 1 ? "Esse é o Pixel. O verdadeiro dono da sala. Cuidado." : "Ele tá te avaliando. Continua...",
        expression: "wink",
        duration: 3800,
      });
    }
    catTimer.current = setTimeout(() => setCatMood("sleep"), 6500);
  }, [play, poke, say]);

  const handlePizza = useCallback(() => {
    poke();
    const next = !pizzaOpen;
    setPizzaOpen(next);
    play(next ? "lidCreak" : "thud");
    if (next) {
      window.setTimeout(() => play("fly"), 300);
      unlockSecret("pizza");
      say({ text: "ESSA PIZZA É DE 2004. NÃO COMA. Nem cheire. Fecha isso!", expression: "sad", duration: 5000 });
    } else {
      say({ text: "Ufa. Melhor assim.", expression: "happy", duration: 2400 });
    }
  }, [pizzaOpen, play, poke, say]);

  const handleMascot = useCallback(() => {
    const now = Date.now();
    pokes.current = [...pokes.current.filter((t) => now - t < 4000), now];
    setWiggle((w) => w + 1);
    if (pokes.current.length >= 7) {
      pokes.current = [];
      play("dizzy");
      unlockSecret("poke");
      say({ text: "Para... tá tudo... girando... eu vejo... chiado colorido...", expression: "dizzy", duration: 4800 });
      poke();
      return;
    }
    play("boing", { pitch: 1 + pokes.current.length * 0.08 });
    const joke = MASCOT_JOKES[counters.current.joke % MASCOT_JOKES.length];
    counters.current.joke += 1;
    say({ ...joke, duration: 4600 });
    poke();
  }, [play, poke, say]);

  const handleVhs = useCallback(() => {
    poke();
    if (channel === "tape") {
      play("click");
      tuneTo(lastRegular);
      say({ text: "Fita ejetada. Vamos fingir que nada aconteceu.", expression: "wink", duration: 3000 });
      return;
    }
    play("click");
    tuneTo("tape");
    unlockSecret("tape");
    say({ text: "Você colocou a fita proibida! Ah não, é o meu ensaio de dança...", expression: "surprised", duration: 5200 });
  }, [channel, lastRegular, play, poke, say, tuneTo]);

  const say2 = useCallback(
    (text: string, expression: Parameters<typeof say>[0]["expression"] = "happy", sound: Parameters<typeof play>[0] = "click") => {
      poke();
      play(sound);
      say({ text, expression, duration: 4600 });
    },
    [play, poke, say],
  );

  const bubbleText = director.hint ?? director.line?.text ?? null;
  const expression = director.hint && !director.line ? "neutral" : director.expression;

  const [sceneSize, setSceneSize] = useState({ w: 1600, h: 900, bleed: 0 });

  useEffect(() => {
    if (lightsOn) return;
    const measure = () => {
      const rect = sceneRef.current?.getBoundingClientRect();
      const bleed = window.matchMedia("(min-width: 80rem)").matches ? 2400 : 0;
      if (rect) setSceneSize({ w: rect.width, h: rect.height, bleed });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [lightsOn]);

  const BLEED = sceneSize.bleed;
  const lightsMask = useMemo(() => {
    const sx = sceneSize.w / SCENE.w;
    const sy = sceneSize.h / SCENE.h;
    const holes = [
      [SPOTS.tv.x + 200, SPOTS.tv.y + 180, 300],
      [SPOTS.arcade.x + 140, SPOTS.arcade.y + 170, 230],
      [SPOTS.lava.x + 28, SPOTS.lava.y + 80, 150],
      [SPOTS.radio.x + 120, SPOTS.radio.y + 60, music.playing ? 130 : 0],
      [SPOTS.onAir.x + 75, SPOTS.onAir.y + 36, music.playing ? 110 : 0],
    ].filter(([, , r]) => r > 0);
    return holes
      .map(
        ([x, y, r]) =>
          `radial-gradient(ellipse ${Math.round(r * sx)}px ${Math.round(r * sy)}px at ${Math.round(BLEED + x * sx)}px ${Math.round(BLEED + y * sy)}px, transparent 25%, black 100%)`,
      )
      .join(", ");
  }, [music.playing, sceneSize, BLEED]);

  return (
    <div ref={stageRef} className="on-dark relative isolate h-full w-full">
      <div ref={sceneRef} className="room-scene relative mx-auto">
        <RoomBackdrop className="pointer-events-none absolute inset-0 h-full w-full" />

        <RoomButton
          spot={SPOTS.window}
          label="Janela: ver como está o céu lá fora"
          hint="A janela segue o seu relógio. Se aí é noite, aqui também é."
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => say2(PERIOD_LINES[period], "happy", "page")}
          z={5}
        >
          <WindowArt period={period} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.plane}
          label="Aviãozinho pendurado no teto"
          hint="Esse aviãozinho tá pendurado desde 2003. Será que ainda voa?"
          onHint={onHint}
          onHoverSound={hover}
          onActivate={handlePlane}
          className={flying ? "[animation:plane-loop_3.2s_ease-in-out_both]" : ""}
          z={flying ? 45 : 14}
        >
          <PlaneArt flying={flying} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.posterChaos}
          label="Pôster: Caos faz parte da programação"
          hint="O lema oficial do canal. Tá até no contrato."
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setPeeled((p) => !p);
            say2(
              peeled ? "Pôster de volta no lugar." : "Atrás do pôster tem um bilhete: 'tem pôster pra baixar nos Extras'. Psiu!",
              "wink",
              "page",
            );
          }}
          z={6}
        >
          <PosterChaosArt peeled={peeled} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.posterDream}
          label="Pôster: Sonhe, jogue, invente, repita"
          hint="Sonhe. Jogue. Invente. Repita. Nessa ordem. Ou não."
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => say2("Sonhe, jogue, invente, repita. A Lina pintou isso com tinta de parede. Da parede.", "happy", "page")}
          z={6}
        >
          <PosterDreamArt />
        </RoomButton>

        <div aria-hidden className="pointer-events-none absolute z-[6]" style={spotStyle(SPOTS.onAir)}>
          <OnAirSign lit={music.playing} />
        </div>

        <RoomButton
          spot={SPOTS.trophy}
          label="Troféu de 2004"
          hint="Troféu de Melhor Canal de 2004."
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setShine(true);
            window.setTimeout(() => setShine(false), 1200);
            say2("Melhor Canal de 2004! O único concorrente era a gente mesmo. Ganhamos de lavada.", "excited", "achievement");
          }}
          z={7}
        >
          <TrophyArt shine={shine} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.lamp}
          label={lightsOn ? "Puxar a cordinha da luminária para apagar a luz" : "Puxar a cordinha da luminária para acender a luz"}
          pressed={!lightsOn}
          hint={lightsOn ? "Tem uma cordinha aí. Cordinhas existem pra serem puxadas." : "Acende a luz! Tá escuro!"}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={handleLamp}
          z={30}
        >
          <CeilingLampArt on={lightsOn} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.radio}
          label={music.playing ? "Rádio 404: desligar a música" : "Rádio 404: ligar a música"}
          pressed={music.playing}
          hint={music.playing ? "Clica pra desligar o rádio." : "Liga o rádio! A trilha do canal toca aqui."}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={toggleRadio}
          z={16}
        >
          <RadioArt on={music.playing} />
        </RoomButton>
        {music.playing && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute z-[17] flex items-end gap-[6%] overflow-hidden rounded-[3px] px-[2%]"
              style={{
                left: `${((SPOTS.radio.x + 88) / SCENE.w) * 100}%`,
                top: `${((SPOTS.radio.y + 48) / SCENE.h) * 100}%`,
                width: `${(60 / SCENE.w) * 100}%`,
                height: `${(22 / SCENE.h) * 100}%`,
              }}
            >
              {[0.1, 0.5, 0.25, 0.7, 0.35, 0.6].map((d) => (
                <span
                  key={d}
                  className="h-full flex-1 origin-bottom bg-ink"
                  style={{ animation: `eq 0.7s ease-in-out ${-d}s infinite` }}
                />
              ))}
            </div>
            <div aria-hidden className="pointer-events-none absolute z-[17]" style={spotStyle({ x: SPOTS.radio.x + 20, y: SPOTS.radio.y - 30, w: 60, h: 60 })}>
              {["♪", "♫", "♪"].map((n, i) => (
                <span
                  key={i}
                  className="absolute bottom-0 font-display text-[clamp(14px,1.6vw,26px)] text-sun"
                  style={{ left: `${i * 30}%`, animation: `note-float 2.4s ease-out ${i * 0.8}s infinite`, textShadow: "2px 2px 0 #1d1830" }}
                >
                  {n}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={nextStation}
              onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
              aria-label="Trocar a estação do rádio"
              className="press absolute z-[18] -rotate-6 whitespace-nowrap rounded-lg border-[3px] border-ink bg-sun px-[0.6em] py-[0.2em] font-display text-[clamp(10px,0.85vw,14px)] leading-tight text-ink shadow-[var(--shadow-ink-sm)]"
              style={{
                left: `${((SPOTS.radio.x - 6) / SCENE.w) * 100}%`,
                top: `${((SPOTS.radio.y - 4) / SCENE.h) * 100}%`,
              }}
            >
              Estação ▸
            </button>
          </>
        )}

        <RoomButton
          spot={SPOTS.lava}
          label="Lâmpada de lava: trocar de cor"
          hint="Lâmpada de lava. Hipnotizante. Não olhe por mais de 3 horas."
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setLava((v) => v + 1);
            say2("Nova cor! Essa lâmpada muda de humor mais do que eu.", "happy", "pop");
          }}
          z={15}
          className={lightsOn ? "" : "drop-shadow-[0_0_24px_var(--lava-glow)]"}
        >
          <span className="block h-full w-full" style={{ ["--lava-glow" as string]: LAVA_PALETTES[lava % LAVA_PALETTES.length].glow }}>
            <LavaArt palette={lava} />
          </span>
        </RoomButton>

        <Tv
          channel={channel}
          switching={switching}
          osd={osd}
          knobAngle={knobAngle}
          flash={flash}
          onKnob={handleKnob}
          onLaunch={launch}
          onHint={onHint}
          onHoverSound={hover}
        />

        <RoomButton
          spot={SPOTS.vhs}
          label={channel === "tape" ? "Ejetar a fita do videocassete" : "Fitas VHS: colocar a fita 'Não assista' no videocassete"}
          pressed={channel === "tape"}
          hint={channel === "tape" ? "Ejeta essa fita, por favor." : "Uma das fitas diz NÃO ASSISTA. Hmm."}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={handleVhs}
          z={13}
        >
          <VhsArt inserted={channel === "tape"} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.mascot}
          label="404, o mascote do canal"
          onHint={onHint}
          onHoverSound={hover}
          onActivate={handleMascot}
          z={20}
          hit="box"
          className="[&>span]:!translate-y-0 [&>span]:!drop-shadow-none"
        >
          <span className="block h-full w-full" style={{ animation: "float 5s ease-in-out infinite" }}>
            <Mascot404 pose="peek" expression={expression} look={look} wiggle={wiggle} className="h-full w-full" />
          </span>
        </RoomButton>

        <Arcade active={arcadeActive} onActivate={handleArcade} onHint={onHint} onHoverSound={hover} />

        <RoomButton
          spot={SPOTS.hiddenCart}
          label="Cantinho escuro perto do pufe"
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setHiddenFound(true);
            unlockSecret("cartridge");
            say2("Um cartucho dourado escondido! Escrito '404'. Eu nem sabia que eu tinha um jogo!", "excited", "coin");
          }}
          z={17}
          className={hiddenFound ? "[&_svg]:-translate-y-2" : ""}
        >
          <HiddenCartArt />
        </RoomButton>

        <RoomButton
          spot={SPOTS.cat}
          label="Pixel, o gato, dormindo no pufe: fazer carinho"
          hint="Shhh. O Pixel tá dormindo. Ou fingindo."
          onHint={onHint}
          onHoverSound={hover}
          onActivate={handleCat}
          z={18}
        >
          <CatArt mood={catMood} />
        </RoomButton>
        {catMood === "sleep" && (
          <div aria-hidden className="pointer-events-none absolute z-[19]" style={spotStyle({ x: SPOTS.cat.x + 150, y: SPOTS.cat.y - 10, w: 60, h: 60 })}>
            {["z", "Z", "z"].map((z, i) => (
              <span
                key={i}
                className="absolute font-display text-[clamp(12px,1.3vw,22px)] text-cream"
                style={{ left: `${i * 22}%`, bottom: `${i * 12}%`, animation: `zzz 3s ease-out ${i}s infinite`, textShadow: "2px 2px 0 #1d1830" }}
              >
                {z}
              </span>
            ))}
          </div>
        )}
        {catMood === "purr" && (
          <div aria-hidden className="pointer-events-none absolute z-[19]" style={spotStyle({ x: SPOTS.cat.x + 70, y: SPOTS.cat.y - 30, w: 80, h: 60 })}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute bottom-0 text-[clamp(12px,1.4vw,24px)] text-tomato"
                style={{ left: `${i * 34}%`, animation: `heart-up 1.6s ease-out ${i * 0.4}s infinite`, textShadow: "2px 2px 0 #1d1830" }}
              >
                ♥
              </span>
            ))}
          </div>
        )}

        <RoomButton
          spot={SPOTS.pizza}
          label={pizzaOpen ? "Fechar a caixa de pizza" : "Abrir a caixa de pizza"}
          pressed={pizzaOpen}
          hint="Uma caixa de pizza. Há quanto tempo ela tá aí?"
          onHint={onHint}
          onHoverSound={hover}
          onActivate={handlePizza}
          z={19}
        >
          <PizzaArt open={pizzaOpen} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.controllers}
          label="Controles de videogame"
          hint="Dois controles. O do player 2 tem um botão grudento."
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setRumble(true);
            window.setTimeout(() => setRumble(false), 500);
            say2("Player 2 sempre perde. É a regra da casa.", "wink", "rumble");
          }}
          z={19}
          className={rumble ? "[&>span]:[animation:shake_0.25s_linear_2]" : ""}
        >
          <ControllersArt />
        </RoomButton>

        <RoomButton
          spot={SPOTS.cartridges}
          label="Cartuchos de jogos espalhados"
          hint="Cartuchos! Cada um é um jogo do canal."
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setCartsShuffle((n) => n + 1);
            say2(CARTRIDGE_LINES[counters.current.cart++ % CARTRIDGE_LINES.length], "happy", "click");
          }}
          z={19}
        >
          <span key={cartsShuffle} className="block h-full w-full" style={{ animation: cartsShuffle ? "hop 0.4s ease-out" : undefined }}>
            <CartridgesArt />
          </span>
        </RoomButton>

        <RoomButton
          spot={SPOTS.skate}
          label="Skate do Déco"
          hint="O skate do Déco. Tem mais adesivo que rodinha."
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setSkating((n) => n + 1);
            say2("Esse skate já desceu a Rua Sem Saída 47 vezes. Subiu 0.", "wink", "whoosh");
          }}
          z={21}
        >
          <span key={skating} className="block h-full w-full" style={{ animation: skating ? "skate-roll 0.9s cubic-bezier(.3,.7,.4,1)" : undefined }}>
            <SkateArt />
          </span>
        </RoomButton>

        <RoomButton
          spot={SPOTS.books}
          label="Pilha de livros: Manual de Engenhocas"
          hint="Manual de Engenhocas, vol. 3. Cheio de dicas pro jogo."
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => say2(BOOK_TIPS[counters.current.book++ % BOOK_TIPS.length], "happy", "page")}
          z={18}
        >
          <BooksArt />
        </RoomButton>

        <div
          aria-hidden
          className="pointer-events-none absolute z-[60] transition-opacity duration-500"
          style={{
            inset: -BLEED,
            opacity: lightsOn ? 0 : 1,
            background: "rgba(14, 10, 32, 0.8)",
            WebkitMaskImage: lightsOn ? undefined : lightsMask,
            maskImage: lightsOn ? undefined : lightsMask,
            WebkitMaskComposite: "source-in",
            maskComposite: "intersect",
          }}
        />
        {!lightsOn && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[61]">
            <p
              className="absolute -rotate-3 text-center font-display leading-tight text-[#b7ff8a]"
              style={{
                left: `${(330 / SCENE.w) * 100}%`,
                top: `${(36 / SCENE.h) * 100}%`,
                width: `${(380 / SCENE.w) * 100}%`,
                fontSize: "clamp(12px, 1.5vw, 26px)",
                textShadow: "0 0 10px rgba(183,255,138,.9), 0 0 24px rgba(183,255,138,.6)",
                animation: "glow-pulse 2.4s ease-in-out infinite",
              }}
            >
              O CANAL NUNCA SAIU DO AR
            </p>
            {[
              [480, 70],
              [1060, 140],
              [210, 470],
              [1500, 420],
              [700, 30],
              [1350, 30],
            ].map(([x, y]) => (
              <span
                key={`${x}-${y}`}
                className="absolute text-[clamp(10px,1.2vw,20px)] text-[#b7ff8a]"
                style={{ left: `${(x / SCENE.w) * 100}%`, top: `${(y / SCENE.h) * 100}%`, textShadow: "0 0 8px rgba(183,255,138,.9)" }}
              >
                ★
              </span>
            ))}
          </div>
        )}

        <AnimatePresence>
          {bubbleText && (
            <motion.div
              key={director.hint ? "hint" : `line-${director.lineKey}`}
              initial={{ opacity: 0, scale: 0.7, x: -16 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="pointer-events-none absolute z-[70] hidden origin-left xl:block"
              style={{
                left: `${((SPOTS.mascot.x + SPOTS.mascot.w + 6) / SCENE.w) * 100}%`,
                top: `${((SPOTS.mascot.y + 4) / SCENE.h) * 100}%`,
                width: "clamp(200px, 19%, 330px)",
              }}
              aria-hidden
            >
              <SpeechBubble tail="left" className="font-hand text-[clamp(15px,1.1vw,21px)] leading-snug">
                {bubbleText}
              </SpeechBubble>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {dockTarget &&
        createPortal(
          <div className="pointer-events-none flex min-h-20 items-end gap-2 [&_.font-hand]:text-[16px]" aria-hidden>
            <div className="w-16 shrink-0 drop-shadow-[3px_4px_0_#1d1830]">
              <Mascot404 expression={expression} look={look} className="w-full" />
            </div>
            <AnimatePresence mode="wait">
              {bubbleText && (
                <motion.div
                  key={director.hint ? "hint" : `line-${director.lineKey}`}
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="mb-3 max-w-[22rem] flex-1"
                >
                  <SpeechBubble tail="left" className="font-hand text-[17px] leading-snug">
                    {bubbleText}
                  </SpeechBubble>
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          dockTarget,
        )}

      <p className="sr-only" aria-live="polite">
        {director.announcement}
      </p>
    </div>
  );
}
