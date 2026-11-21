"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { Mascot404, type MascotExpression } from "@/components/mascot/Mascot404";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { useLocale, useLocaleRouter } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { countOf, formatNumber } from "@/i18n/format";
import { getAudio } from "@/lib/audio/engine";
import { useMusicState, useSound } from "@/lib/audio/hooks";
import { KARAOKE_SONG, TRACKS, trackText } from "@/lib/audio/tracks";
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
  VcrArt,
  VhsArt,
  WindowArt,
  type CatMood,
  type SkyPeriod,
} from "./objects/Decor";
import { Tv, type TvBadge } from "./objects/Tv";
import { channelOrder, CHANNELS, isRegularChannel, MISSION_CHANNEL, type ChannelId } from "./objects/TvChannels";
import { MissionOnAirProvider, type MissionOnAir } from "./MissionOnAir";
import { LAST_HOUR_MINUTES, missionChannelLine, missionGreeting, missionSignLine, newMissionLine, type MissionMoment } from "./missionLines";
import { isTape, tapeById, type TapeId } from "./objects/tapes";
import { TapeFlights, type Flight } from "./TapeFlights";
import { TapeShelf } from "./TapeShelf";
import { TvZoom } from "./TvZoom";
import { BroadcastProvider, type Broadcast } from "./tapes/broadcast";
import { useTapePlayback } from "./tapes/useTapePlayback";
import type { TapeCue } from "./tapes/vhs";
import { useSchedule } from "@/components/catalog/useSchedule";
import { missionPlace } from "@/components/missions/parts";
import { useMissionToday } from "@/lib/missions/hooks";
import { missionText } from "@/lib/missions/text";
import { PLAYABLE, playableIn, type GameMeta } from "@/games/registry";
import { bestRecord, plays, unplayedGames } from "@/lib/schedule";
import { RoomBackdrop } from "./RoomBackdrop";
import { RoomButton, RoomLink } from "./RoomObject";
import { useMascotDirector } from "./useMascotDirector";
import { useLook, useLookStore, type LookStore } from "./lookStore";
import { unlockedTracks } from "@/lib/audio/unlocks";

const JOKE_FACES: ("happy" | "wink" | "excited" | "confused" | "surprised")[] = ["happy", "wink", "confused", "excited", "surprised"];

const CART_TAGS = ["dead-end-street", "bad-ideas-lab"];

const COPY = localized({
  "pt-BR": {
    jokes: [
      "Oi! Eu sou o 404. Sim, igual ao erro. Não, eu não estou perdido.",
      "Minha cabeça pega 3 canais e meio. O meio é só chiado.",
      "Se você bater em mim, eu volto a funcionar? Melhor não testar.",
      "Curiosidade: eu fui feito com uma TV que caiu do caminhão de mudança.",
      "Tô de fone porque a trilha do canal não para nunca. NUNCA.",
    ],
    bookTips: [
      "Manual de Engenhocas, pág. 12: puxe mais pra trás pra ir mais longe.",
      "Pág. 31: o pato de borracha quica. Use isso a seu favor.",
      "Pág. 47: balão d'água empurra tudo em volta quando estoura.",
      "Pág. 88: o pneu é pesado. Derruba pilhas inteiras.",
      "Última página: 'Se der errado, culpe o Déco.' — assinado, Lina.",
    ],
    cartridges: {
      "dead-end-street": "Cartucho RUA: Rua Sem Saída. Tá até gasto de tanto jogar.",
      "bad-ideas-lab": "Cartucho LAB: Laboratório de Péssimas Ideias. A Lina jura que nenhuma máquina explodiu. Ainda.",
      "food-fight": "Cartucho LAN: Guerra de Lanche. Ainda tem pudim grudado nele.",
      "operation-recess": "Cartucho REC: Operação: Recreio. Tem uma espada de papelão desenhada na etiqueta.",
      "pajama-war": "Cartucho PIJ: Guerra do Pijama. Cheira a travesseiro. Não pergunte.",
      "off-air-vacation": "Cartucho FÉR: Férias Fora do Ar. Veio com areia dentro.",
      "downhill-derby": "Cartucho LAD: Ladeira Abaixo. A etiqueta tem marca de pneu.",
    } as Record<string, string>,
    cartridgeOf: (title: string) => `Cartucho de ${title}.`,
    cartridgeUnplayed: (line: string) => `${line} Você ainda não jogou esse!`,
    mysteryWarm: "Cartucho ???: tá quentinho. Acho que ele esquenta quando alguém joga tudo do canal...",
    mysteryCold: "Cartucho ???: esse não tem nome. Às vezes ele esquenta sozinho.",
    periods: {
      morning: "Lá fora é de manhã. Aqui dentro é sempre sábado de manhã de 2004.",
      afternoon: "Tarde ensolarada lá fora. Perfeita pra ficar aqui dentro jogando.",
      dusk: "O sol tá indo embora. A transmissão, não.",
      night: "Já é noite! Hora de dormir... ou de só mais uma partida.",
    } as Record<SkyPeriod, string>,
    greetNew: "Ei! Visitante novo! Pode mexer em tudo da sala. Quase tudo faz alguma coisa.",
    greetUnplayed: (title: string) => `Ei! Você voltou! Ainda tem programa inédito pra você: ${title}. Tá passando agora na TV!`,
    greetBest: (title: string) => `Ei! Você voltou! Já viu todos os programas. Seu melhor recorde é em ${title}. Dá pra bater?`,
    greetBack: "Ei! Você voltou! Bora jogar alguma coisa?",
    missionOffAir: (number: string) => `Canal ${number}: plantão fora do ar.`,
    barsLine: (number: string) => `Canal ${number}: fora do ar. Relaxa, isso é normal aqui.`,
    cartoonLine: (number: string) => `Canal ${number}: reprise do meu desenho! Eu tô ótimo nesse episódio.`,
    newLine: (number: string, title: string, tagline: string) => `Canal ${number}: ${title}. Inédito pra você! ${tagline}`,
    rerunLine: (number: string, title: string, tagline: string) => `Canal ${number}: reprise de ${title}. ${tagline}`,
    lostChannel: "Peraí... que canal é esse? Eu nunca vi esse canal. Eu SOU o canal!",
    typedChannel: "Você digitou o nome do canal! A TV obedeceu. Assustador.",
    launchPlay: "Ligando a transmissão! Segura o controle!",
    launchGo: "Bora lá!",
    coin: "Ficha inserida! Abrindo o catálogo...",
    trophyRecord: (score: number, title: string) => `Seu nome já está na base do troféu: ${formatNumber(score, "pt-BR")} pontos em ${title}. Bora ver o quadro dos campeões!`,
    trophy: "Melhor Canal de 2004! Agora vamos ver quem manda no fliperama...",
    radioOff: "Rádio desligado. O silêncio também é uma trilha sonora. Uma bem chata.",
    radioOn: (title: string) => `Rádio 404 no ar! Tocando: ${title}.`,
    station: (station: string, title: string, locked: number) =>
      `${station}: ${title}.${locked > 0 ? ` (Ainda tem ${locked} ${locked > 1 ? "estações escondidas" : "estação escondida"}...)` : ""}`,
    lightsOff: "Ei, quem apagou a luz? ...Peraí, tá escrito na parede: O CANAL NUNCA SAIU DO AR.",
    lightsOn: "Luz de volta! Que susto.",
    plane: "O aviãozinho voou! Ninguém sabe como. Física de desenho animado.",
    catPurr: "O Pixel tá ronronando! Ele só faz isso com gente muito especial. Ou com quem tem atum.",
    catFirst: "Esse é o Pixel. O verdadeiro dono da sala. Cuidado.",
    catAgain: "Ele tá te avaliando. Continua...",
    pizzaOpen: "ESSA PIZZA É DE 2004. NÃO COMA. Nem cheire. Fecha isso!",
    pizzaClosed: "Ufa. Melhor assim.",
    dizzy: "Para... tá tudo... girando... eu vejo... chiado colorido...",
    shelf: "Ooh, a estante! Escolhe uma. A de etiqueta rasgada... melhor não.",
    windowLabel: "Janela: ver como está o céu lá fora",
    windowHint: "A janela segue o seu relógio. Se aí é noite, aqui também é.",
    planeLabel: "Aviãozinho pendurado no teto",
    planeHint: "Esse aviãozinho tá pendurado desde 2003. Será que ainda voa?",
    chaosLabel: "Pôster: Caos faz parte da programação",
    chaosHint: "O lema oficial do canal. Tá até no contrato.",
    chaosBack: "Pronto, pôster de volta no lugar.",
    chaosNote: "Achei um bilhete atrás do pôster: 'Tem pôster pra baixar nos Extras.' Psiu!",
    dreamLabel: "Pôster: Sonhe, jogue, invente, repita",
    dreamHint: "Sonhe. Jogue. Invente. Repita. Nessa ordem. Ou não.",
    dreamLine: "Sonhe, jogue, invente, repita. A Lina pintou isso com tinta de parede. Da parede.",
    signDoneLabel: (title: string) => `Placa NO AR: Missão 404 de hoje cumprida, ${title}. Ver na TV`,
    signLabel: (title: string) => `Placa NO AR: ver a Missão 404 de hoje na TV, ${title}`,
    signDoneHint: "Missão de hoje cumprida. Clica pra ver na TV.",
    signHint: "Plantão no ar! Clica pra ver a Missão 404 na TV.",
    trophyLabel: "Troféu de 2004: abrir o quadro dos campeões no fliperama de recordes",
    trophyHint: "Troféu de Melhor Canal de 2004. O quadro dos campeões fica guardado aqui.",
    lampOffLabel: "Puxar a cordinha da luminária para apagar a luz",
    lampOnLabel: "Puxar a cordinha da luminária para acender a luz",
    lampOffHint: "Tem uma cordinha aí. Cordinhas existem pra serem puxadas.",
    lampOnHint: "Acende a luz! Tá escuro!",
    radioOffLabel: "Rádio 404: desligar a música",
    radioOnLabel: "Rádio 404: ligar a música",
    radioOffHint: "Clica pra desligar o rádio.",
    radioOnHint: "Liga o rádio! A trilha do canal toca aqui.",
    stationLabel: "Trocar a estação do rádio",
    stationButton: "Estação ▸",
    lavaLabel: "Lâmpada de lava: trocar de cor",
    lavaHint: "Lâmpada de lava. Hipnotizante. Não olhe por mais de 3 horas.",
    lavaLine: "Nova cor! Essa lâmpada muda de humor mais do que eu.",
    shelfLabel: "Estante de fitas VHS: escolher uma fita",
    shelfPlayingHint: (label: string) => `Tá passando: ${label}. Quer trocar de fita?`,
    shelfHint: "Uma das fitas diz NÃO ASSISTA. Hmm.",
    vcrEjectLabel: (label: string) => `Videocassete: ejetar a fita ${label}`,
    vcrEmptyLabel: "Videocassete vazio: abrir a estante de fitas",
    vcrEjectHint: "Aperta pra ejetar a fita.",
    vcrEmptyHint: "O videocassete tá vazio. As fitas ficam na estante do lado.",
    mascotLabel: "404, o mascote do canal",
    hiddenLabel: "Cantinho escuro perto do pufe",
    hiddenLine: "Um cartucho dourado escondido! Escrito '404'. Eu nem sabia que eu tinha um jogo!",
    catLabel: "Pixel, o gato, dormindo no pufe: fazer carinho",
    catHint: "Shhh. O Pixel tá dormindo. Ou fingindo.",
    pizzaCloseLabel: "Fechar a caixa de pizza",
    pizzaOpenLabel: "Abrir a caixa de pizza",
    pizzaHint: "Uma caixa de pizza. Há quanto tempo ela tá aí?",
    controllersLabel: "Controles de videogame",
    controllersHint: "Dois controles. O do player 2 tem um botão grudento.",
    controllersLine: "Player 2 sempre perde. É a regra da casa.",
    cartridgesLabel: "Cartuchos de jogos espalhados",
    cartridgesHint: "Cartuchos! Cada um é um jogo do canal.",
    skateLabel: "Skate do Déco",
    skateHint: "O skate do Déco. Tem mais adesivo que rodinha.",
    skateLine: "Esse skate já desceu a Rua Sem Saída 47 vezes. Subiu 0.",
    booksLabel: "Pilha de livros: Manual de Engenhocas",
    booksHint: "Manual de Engenhocas, vol. 3. Cheio de dicas pro jogo.",
    wall: "O CANAL NUNCA SAIU DO AR",
  },
  en: {
    jokes: [
      "Hi! I'm 404. Yes, like the error. No, I'm not lost.",
      "My head gets 3 and a half channels. The half is just static.",
      "If you smack me, will I start working again? Better not find out.",
      "Fun fact: I was made from a TV that fell off a moving truck.",
      "I wear headphones because the channel's theme never stops. NEVER.",
    ],
    bookTips: [
      "Gadget Manual, p. 12: pull back farther to launch farther.",
      "P. 31: the rubber duck bounces. Use that to your advantage.",
      "P. 47: a water balloon pushes everything around it when it pops.",
      "P. 88: the tire is heavy. It knocks over whole stacks.",
      "Last page: 'If it goes wrong, blame Déco.' — signed, Lina.",
    ],
    cartridges: {
      "dead-end-street": "Cartridge STR: Dead End Street. It's worn out from all the playing.",
      "bad-ideas-lab": "Cartridge LAB: Bad Ideas Lab. Lina swears no machine has exploded. Yet.",
      "food-fight": "Cartridge FOOD: Food Fight. There's still pudding stuck to it.",
      "operation-recess": "Cartridge REC: Operation: Recess. There's a cardboard sword drawn on the label.",
      "pajama-war": "Cartridge PJS: Pajama War. It smells like a pillow. Don't ask.",
      "off-air-vacation": "Cartridge VAC: Off-Air Vacation. It came with sand inside.",
      "downhill-derby": "Cartridge DRB: Downhill Derby. There's a tire mark on the label.",
    },
    cartridgeOf: (title: string) => `${title} cartridge.`,
    cartridgeUnplayed: (line: string) => `${line} You haven't played this one yet!`,
    mysteryWarm: "Cartridge ???: it's warm. I think it heats up when someone plays everything on the channel...",
    mysteryCold: "Cartridge ???: this one has no name. Sometimes it heats up on its own.",
    periods: {
      morning: "It's morning outside. In here it's always a Saturday morning in 2004.",
      afternoon: "Sunny afternoon outside. Perfect for staying in here and playing.",
      dusk: "The sun is going down. The broadcast isn't.",
      night: "It's already night! Time for bed... or just one more game.",
    },
    greetNew: "Hey! A new visitor! You can mess with everything in the room. Almost everything does something.",
    greetUnplayed: (title: string) => `Hey! You're back! There's still a brand-new show for you: ${title}. It's on TV right now!`,
    greetBest: (title: string) => `Hey! You're back! You've seen every show. Your best record is in ${title}. Can you beat it?`,
    greetBack: "Hey! You're back! Want to play something?",
    missionOffAir: (number: string) => `Channel ${number}: bulletin off the air.`,
    barsLine: (number: string) => `Channel ${number}: off the air. Relax, that's normal here.`,
    cartoonLine: (number: string) => `Channel ${number}: a rerun of my cartoon! I look great in this episode.`,
    newLine: (number: string, title: string, tagline: string) => `Channel ${number}: ${title}. New for you! ${tagline}`,
    rerunLine: (number: string, title: string, tagline: string) => `Channel ${number}: a rerun of ${title}. ${tagline}`,
    lostChannel: "Wait... what channel is this? I've never seen this channel. I AM the channel!",
    typedChannel: "You typed the channel's name! The TV obeyed. Creepy.",
    launchPlay: "Starting the broadcast! Grab the controller!",
    launchGo: "Let's go!",
    coin: "Coin inserted! Opening the catalog...",
    trophyRecord: (score: number, title: string) => `Your name is already on the trophy base: ${countOf(score, ["point", "points"], "en")} in ${title}. Let's go see the hall of champions!`,
    trophy: "Best Channel of 2004! Now let's see who rules the arcade...",
    radioOff: "Radio off. Silence is a soundtrack too. A really boring one.",
    radioOn: (title: string) => `Radio 404 is on the air! Now playing: ${title}.`,
    station: (station: string, title: string, locked: number) =>
      `${station}: ${title}.${locked > 0 ? ` (There ${locked > 1 ? `are still ${locked} hidden stations` : "is still 1 hidden station"}...)` : ""}`,
    lightsOff: "Hey, who turned off the lights? ...Wait, there's writing on the wall: THE CHANNEL NEVER WENT OFF THE AIR.",
    lightsOn: "Lights back on! That was scary.",
    plane: "The little plane flew! Nobody knows how. Cartoon physics.",
    catPurr: "Pixel is purring! He only does that for very special people. Or people with tuna.",
    catFirst: "This is Pixel. The real owner of the room. Careful.",
    catAgain: "He's sizing you up. Keep going...",
    pizzaOpen: "THIS PIZZA IS FROM 2004. DON'T EAT IT. Don't even sniff it. Close that!",
    pizzaClosed: "Phew. Much better.",
    dizzy: "Stop... everything's... spinning... I see... colorful static...",
    shelf: "Ooh, the shelf! Pick one. The one with the torn label... better not.",
    windowLabel: "Window: see what the sky looks like outside",
    windowHint: "The window follows your clock. If it's night where you are, it's night here too.",
    planeLabel: "Little plane hanging from the ceiling",
    planeHint: "This little plane has been hanging there since 2003. Does it still fly?",
    chaosLabel: "Poster: Chaos is part of the programming",
    chaosHint: "The channel's official motto. It's even in the contract.",
    chaosBack: "There, poster back in place.",
    chaosNote: "Found a note behind the poster: 'There are posters to download in Extras.' Psst!",
    dreamLabel: "Poster: Dream, play, invent, repeat",
    dreamHint: "Dream. Play. Invent. Repeat. In that order. Or not.",
    dreamLine: "Dream, play, invent, repeat. Lina painted this with wall paint. From the wall.",
    signDoneLabel: (title: string) => `ON AIR sign: today's Mission 404 is complete, ${title}. See it on TV`,
    signLabel: (title: string) => `ON AIR sign: see today's Mission 404 on TV, ${title}`,
    signDoneHint: "Today's mission is complete. Click to see it on TV.",
    signHint: "Bulletin on the air! Click to see Mission 404 on TV.",
    trophyLabel: "2004 trophy: open the hall of champions in the Record arcade",
    trophyHint: "Best Channel of 2004 trophy. The hall of champions is kept here.",
    lampOffLabel: "Pull the lamp cord to turn off the light",
    lampOnLabel: "Pull the lamp cord to turn on the light",
    lampOffHint: "There's a little cord there. Cords exist to be pulled.",
    lampOnHint: "Turn the light on! It's dark!",
    radioOffLabel: "Radio 404: turn off the music",
    radioOnLabel: "Radio 404: turn on the music",
    radioOffHint: "Click to turn off the radio.",
    radioOnHint: "Turn on the radio! The channel's soundtrack plays here.",
    stationLabel: "Change the radio station",
    stationButton: "Station ▸",
    lavaLabel: "Lava lamp: change color",
    lavaHint: "Lava lamp. Hypnotic. Don't stare for more than 3 hours.",
    lavaLine: "New color! This lamp changes moods more than I do.",
    shelfLabel: "VHS tape shelf: pick a tape",
    shelfPlayingHint: (label: string) => `Now playing: ${label}. Want to switch tapes?`,
    shelfHint: "One of the tapes says DO NOT WATCH. Hmm.",
    vcrEjectLabel: (label: string) => `VCR: eject the ${label} tape`,
    vcrEmptyLabel: "Empty VCR: open the tape shelf",
    vcrEjectHint: "Press to eject the tape.",
    vcrEmptyHint: "The VCR is empty. The tapes are on the shelf next to it.",
    mascotLabel: "404, the channel's mascot",
    hiddenLabel: "Dark corner by the beanbag",
    hiddenLine: "A hidden golden cartridge! It says '404'. I didn't even know I had a game!",
    catLabel: "Pixel the cat, asleep on the beanbag: pet him",
    catHint: "Shhh. Pixel is sleeping. Or pretending.",
    pizzaCloseLabel: "Close the pizza box",
    pizzaOpenLabel: "Open the pizza box",
    pizzaHint: "A pizza box. How long has that been there?",
    controllersLabel: "Video game controllers",
    controllersHint: "Two controllers. Player 2's has a sticky button.",
    controllersLine: "Player 2 always loses. House rules.",
    cartridgesLabel: "Scattered game cartridges",
    cartridgesHint: "Cartridges! Each one is a game from the channel.",
    skateLabel: "Déco's skateboard",
    skateHint: "Déco's skateboard. More stickers than wheels.",
    skateLine: "This skateboard has gone down Dead End Street 47 times. And up it 0 times.",
    booksLabel: "Stack of books: Gadget Manual",
    booksHint: "Gadget Manual, vol. 3. Full of tips for the game.",
    wall: "THE CHANNEL NEVER WENT OFF THE AIR",
  },
});

function periodFor(hour: number): SkyPeriod {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 19) return "dusk";
  return "night";
}

function WatchingMascot({ store, ...props }: Omit<ComponentProps<typeof Mascot404>, "look"> & { store: LookStore }) {
  return <Mascot404 {...props} look={useLook(store)} />;
}

export function BroadcastRoom() {
  const router = useLocaleRouter();
  const locale = useLocale();
  const copy = COPY[locale];
  const channels = CHANNELS[locale];
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const progress = useProgress();
  const { play, hover } = useSound();
  const music = useMusicState();
  const radioOn = music.playing && music.trackId !== KARAOKE_SONG.id;
  const director = useMascotDirector();
  const dockTarget = hydrated ? document.getElementById("mascot-dock") : null;
  const { say, emote, setHint, poke } = director;

  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const look = useLookStore();
  const [wiggle, setWiggle] = useState(0);
  const pokes = useRef<number[]>([]);

  const schedule = useSchedule();
  const missionFeed = useMissionToday();
  const missionData = missionFeed.status === "ready" ? missionFeed.data : null;
  const missionOffset = missionFeed.offset;
  const onAir = useMemo<MissionOnAir | null>(
    () => (missionData ? { view: missionData.mission, state: missionData.you?.state ?? "new", best: missionData.you?.best ?? null, offset: missionOffset } : null),
    [missionData, missionOffset],
  );
  const order = useMemo(() => channelOrder(Boolean(onAir)), [onAir]);
  const momentOf = useCallback((): MissionMoment | null => {
    if (!onAir) return null;
    const left = Date.parse(onAir.view.endsAt) - (Date.now() + onAir.offset);
    return { title: missionText(onAir.view, locale).title, game: missionPlace(onAir.view, locale).game, state: onAir.state, minutesLeft: Math.max(1, Math.ceil(left / 60_000)), position: onAir.best?.position ?? null };
  }, [locale, onAir]);
  const [missionWaitOver, setMissionWaitOver] = useState(false);
  const missionSettled = missionFeed.status !== "loading" || missionWaitOver;
  const greetTimers = useRef<number[]>([]);
  const missionDay = useRef<string | null>(null);
  const [channel, setChannel] = useState<ChannelId>(PLAYABLE[0].slug);
  const [lastRegular, setLastRegular] = useState<ChannelId>(PLAYABLE[0].slug);
  const tuned = useRef(false);
  const [switching, setSwitching] = useState(false);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [shelfOrigin, setShelfOrigin] = useState<DOMRect | null>(null);
  const shelfButton = useRef<HTMLButtonElement>(null);
  const [since, setSince] = useState(0);
  const [take, setTake] = useState(0);
  const [rewinding, setRewinding] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const tvScreen = useRef<HTMLDivElement>(null);
  const zoomButton = useRef<HTMLButtonElement>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const flightId = useRef(0);
  const [vcrBump, setVcrBump] = useState(0);
  const said = useRef(new Set<string>());
  const rotations = useRef(new Map<string, number>());
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
    if (!schedule.hydrated || !missionSettled || tuned.current) return;
    tuned.current = true;
    const start = onAir && onAir.state !== "completed" ? MISSION_CHANNEL : (schedule.next()?.game.slug ?? PLAYABLE[0].slug);
    setChannel(start);
    setLastRegular(start);
  }, [schedule, missionSettled, onAir]);

  useEffect(() => {
    const wait = window.setTimeout(() => setMissionWaitOver(true), 2500);
    const timers = greetTimers.current;
    return () => {
      window.clearTimeout(wait);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (!hydrated || greeted.current || !missionSettled) return;
    greeted.current = true;
    const mission = momentOf();
    const returning = progress.visits > 1;
    const unplayed = unplayedGames(progress, locale);
    const best = bestRecord(progress, locale);
    const text = !returning
      ? copy.greetNew
      : unplayed.length > 0 && unplayed.length < PLAYABLE.length
        ? copy.greetUnplayed(unplayed[0].title)
        : unplayed.length === 0 && best
          ? copy.greetBest(best.game.title)
          : copy.greetBack;
    greetTimers.current.push(
      window.setTimeout(() => {
        if (returning && mission) say({ ...missionGreeting(mission, locale), duration: 9000, announce: false });
        else say({ text, expression: returning ? "happy" : "excited", duration: 9000, announce: false });
        poke();
      }, 450),
    );
    if (!returning && mission) greetTimers.current.push(window.setTimeout(() => say({ ...missionGreeting(mission, locale), duration: 7000, announce: false }), 9700));
  }, [copy, hydrated, locale, missionSettled, momentOf, progress, say, poke]);

  useEffect(() => {
    if (!onAir) return;
    const previous = missionDay.current;
    missionDay.current = onAir.view.day;
    if (previous && previous !== onAir.view.day) {
      const moment = momentOf();
      if (moment) say({ ...newMissionLine(moment, locale), duration: 6000 });
    }
  }, [locale, onAir, momentOf, say]);

  useEffect(() => {
    if (!onAir || onAir.state === "completed") return;
    const wait = Date.parse(onAir.view.endsAt) - (Date.now() + onAir.offset) - LAST_HOUR_MINUTES * 60_000;
    if (wait <= 0 || wait > 2 ** 31 - 1) return;
    const id = window.setTimeout(() => {
      const moment = momentOf();
      if (moment && moment.state !== "completed") say({ ...missionGreeting(moment, locale), duration: 7000 });
    }, wait);
    return () => window.clearTimeout(id);
  }, [locale, onAir, momentOf, say]);

  const lookAtSpot = useCallback((spot: Spot) => {
    const target = spotCenter(spot);
    const origin = spotCenter(SPOTS.mascot);
    const dx = (target.x - origin.x) / 500;
    const dy = (target.y - origin.y) / 360;
    look.set(dx, dy);
  }, [look]);

  const quietFocus = useRef(false);

  const restoreFocus = useCallback((target: HTMLElement | null) => {
    quietFocus.current = true;
    target?.focus({ preventScroll: true });
    quietFocus.current = false;
  }, []);

  const onHint = useCallback(
    (text: string | null, spot: Spot) => {
      if (text && quietFocus.current) return;
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
        look.set(dx, dy);
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
  }, [look, poke]);

  const tuneTo = useCallback(
    (next: ChannelId, opts: { quiet?: boolean } = {}) => {
      tuned.current = true;
      setSwitching(true);
      setOsd(true);
      if (!opts.quiet) play("static");
      window.setTimeout(() => {
        setChannel(next);
        setSince(performance.now());
        setTake(0);
        setSwitching(false);
      }, reduced ? 0 : 280);
      window.setTimeout(() => setOsd(false), 1800);
    },
    [play, reduced],
  );

  const badgeFor = useCallback(
    (id: ChannelId): TvBadge => {
      const game = channels[id]?.game;
      if (!game) return null;
      return schedule.state(game) === "unplayed" ? "new" : null;
    },
    [channels, schedule],
  );

  const channelLine = useCallback(
    (id: ChannelId) => {
      const info = channels[id];
      const game = info?.game;
      if (!game) {
        if (id === MISSION_CHANNEL) {
          const moment = momentOf();
          return moment ? missionChannelLine(moment, info.number, locale) : copy.missionOffAir(info.number);
        }
        if (id === "bars") return copy.barsLine(info.number);
        if (id === "cartoon") return copy.cartoonLine(info.number);
        return info?.name ?? "";
      }
      const badge = badgeFor(id);
      if (badge === "new") return copy.newLine(info.number, game.title, game.tagline);
      return copy.rerunLine(info.number, game.title, game.tagline);
    },
    [badgeFor, channels, copy, locale, momentOf],
  );

  const handleKnob = useCallback(() => {
    poke();
    if (isTape(channel)) {
      play("tapeOut");
      if (!reduced) {
        flightId.current += 1;
        const id = flightId.current;
        setFlights((list) => [...list, { id, tape: channel, to: "shelf", delay: 0 }]);
      }
    }
    turns.current += 1;
    setKnobAngle((a) => a + 45);
    const now = Date.now();
    zaps.current = [...zaps.current.filter((t) => now - t < 8000), now];
    if (zaps.current.length >= 5) unlockAchievement("channel-surfer");
    let next: ChannelId;
    if (turns.current % 9 === 8) {
      next = "lost";
    } else {
      const base = isRegularChannel(channel, order) ? channel : lastRegular;
      next = order[(order.indexOf(base) + 1) % order.length];
      setLastRegular(next);
    }
    tuneTo(next);
    if (next === "lost") {
      unlockSecret("lost-channel");
      say({ text: copy.lostChannel, expression: "surprised", duration: 6500 });
    } else {
      say({ text: channelLine(next), expression: next === "bars" ? "confused" : badgeFor(next) === "new" ? "excited" : "happy", duration: 4200 });
    }
  }, [badgeFor, channel, channelLine, copy, lastRegular, order, play, poke, reduced, say, tuneTo]);

  const handleSign = useCallback(() => {
    const moment = momentOf();
    if (!moment) return;
    poke();
    play("tvOn");
    setKnobAngle((a) => a + 45);
    setLastRegular(MISSION_CHANNEL);
    tuneTo(MISSION_CHANNEL);
    say({ ...missionSignLine(moment, locale), duration: 4600 });
  }, [locale, momentOf, play, poke, say, tuneTo]);

  const suggestion = useMemo(() => {
    const current = channel === MISSION_CHANNEL ? onAir?.view.game : channels[channel]?.game?.slug;
    return schedule.next(current ? [current] : []);
  }, [channel, channels, onAir, schedule]);

  const tuneSuggestion = useCallback(() => {
    if (!suggestion) return;
    poke();
    setKnobAngle((a) => a + 45);
    setLastRegular(suggestion.game.slug);
    tuneTo(suggestion.game.slug);
    say({ text: channelLine(suggestion.game.slug), expression: suggestion.reason === "unplayed" ? "excited" : "happy", duration: 4200 });
  }, [channelLine, poke, say, suggestion, tuneTo]);

  const records = useMemo(() => (hydrated ? bestRecord(progress, locale) : null), [hydrated, locale, progress]);
  const playedCarts = useMemo(
    () => (hydrated ? [...CART_TAGS.map((slug) => plays(progress, slug) > 0), unplayedGames(progress, locale).length === 0] : [false, false, false]),
    [hydrated, locale, progress],
  );
  const cartridgeLine = useCallback(() => {
    const games: GameMeta[] = playableIn(locale);
    const index = counters.current.cart++ % (games.length + 1);
    if (index === games.length) {
      return playedCarts[2] ? copy.mysteryWarm : copy.mysteryCold;
    }
    const game = games[index];
    const line = copy.cartridges[game.slug] ?? copy.cartridgeOf(game.title);
    return hydrated && plays(progress, game.slug) === 0 ? copy.cartridgeUnplayed(line) : line;
  }, [copy, hydrated, locale, playedCarts, progress]);

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
        say({ text: copy.typedChannel, expression: "surprised", duration: 6000 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copy, say, tuneTo]);

  const launch = useCallback(
    (href: string, isPlay: boolean) => {
      play(isPlay ? "tvOn" : "confirm");
      if (reduced) {
        router.push(href);
        return;
      }
      setFlash(true);
      say({ text: isPlay ? copy.launchPlay : copy.launchGo, expression: "excited", duration: 2000, announce: false });
      window.setTimeout(() => router.push(href), 320);
    },
    [copy, play, reduced, router, say],
  );

  const handleArcade = useCallback(() => {
    play("coin");
    setArcadeActive(true);
    say({ text: copy.coin, expression: "excited", duration: 2000, announce: false });
    window.setTimeout(() => router.push("/games"), reduced ? 0 : 480);
  }, [copy, play, reduced, router, say]);

  const handleTrophy = useCallback(() => {
    play("achievement");
    setShine(true);
    say({
      text: records ? copy.trophyRecord(records.score, records.game.title) : copy.trophy,
      expression: "excited",
      duration: 2000,
      announce: false,
    });
    window.setTimeout(() => router.push("/records"), reduced ? 0 : 520);
  }, [copy, play, reduced, records, router, say]);

  const tracks = useMemo(() => unlockedTracks(progress), [progress]);

  const toggleRadio = useCallback(() => {
    poke();
    const engine = getAudio();
    if (radioOn) {
      engine.stopMusic();
      play("toggleOff");
      say({ text: copy.radioOff, expression: "neutral", duration: 4200 });
      return;
    }
    const id = tracks.some((t) => t.id === progress.settings.track) ? progress.settings.track : "theme";
    play("toggleOn");
    engine.startMusic(id);
    unlockAchievement("radio-on");
    const track = TRACKS.find((t) => t.id === id);
    say({ text: copy.radioOn(track ? trackText(track.id, locale).title : ""), expression: "happy", duration: 4200 });
  }, [copy, locale, radioOn, play, poke, progress.settings.track, say, tracks]);

  const nextStation = useCallback(() => {
    poke();
    const index = tracks.findIndex((t) => t.id === music.trackId);
    const next = tracks[(index + 1) % tracks.length];
    play("static", { volume: 0.6 });
    getAudio().startMusic(next.id);
    setSetting("track", next.id);
    const locked = TRACKS.length - tracks.length;
    say({
      text: copy.station(next.station, trackText(next.id, locale).title, locked),
      expression: "wink",
      duration: 4200,
    });
  }, [copy, locale, music.trackId, play, poke, say, tracks]);

  const handleLamp = useCallback(() => {
    poke();
    play("chain");
    const next = !lightsOn;
    setLightsOn(next);
    if (!next) {
      unlockSecret("blackout");
      say({ text: copy.lightsOff, expression: "surprised", duration: 6200 });
    } else {
      say({ text: copy.lightsOn, expression: "happy", duration: 2600 });
    }
  }, [copy, lightsOn, play, poke, say]);

  const handlePlane = useCallback(() => {
    poke();
    if (flying) return;
    play("engine");
    setFlying(true);
    unlockSecret("plane");
    say({ text: copy.plane, expression: "excited", duration: 4000 });
    window.setTimeout(() => setFlying(false), reduced ? 400 : 3200);
  }, [copy, flying, play, poke, reduced, say]);

  const handleCat = useCallback(() => {
    poke();
    if (catTimer.current) clearTimeout(catTimer.current);
    catPets.current += 1;
    if (catPets.current >= 3) {
      setCatMood("purr");
      play("purr");
      unlockSecret("cat");
      say({ text: copy.catPurr, expression: "love", duration: 5000 });
      catPets.current = 0;
    } else {
      setCatMood("awake");
      play("meow");
      say({
        text: catPets.current === 1 ? copy.catFirst : copy.catAgain,
        expression: "wink",
        duration: 3800,
      });
    }
    catTimer.current = setTimeout(() => setCatMood("sleep"), 6500);
  }, [copy, play, poke, say]);

  const handlePizza = useCallback(() => {
    poke();
    const next = !pizzaOpen;
    setPizzaOpen(next);
    play(next ? "lidCreak" : "thud");
    if (next) {
      window.setTimeout(() => play("fly"), 300);
      unlockSecret("pizza");
      say({ text: copy.pizzaOpen, expression: "sad", duration: 5000 });
    } else {
      say({ text: copy.pizzaClosed, expression: "happy", duration: 2400 });
    }
  }, [copy, pizzaOpen, play, poke, say]);

  const handleMascot = useCallback(() => {
    const now = Date.now();
    pokes.current = [...pokes.current.filter((t) => now - t < 4000), now];
    setWiggle((w) => w + 1);
    if (pokes.current.length >= 7) {
      pokes.current = [];
      play("dizzy");
      unlockSecret("poke");
      say({ text: copy.dizzy, expression: "dizzy", duration: 4800 });
      poke();
      return;
    }
    play("boing", { pitch: 1 + pokes.current.length * 0.08 });
    const turn = counters.current.joke % copy.jokes.length;
    counters.current.joke += 1;
    say({ text: copy.jokes[turn], expression: JOKE_FACES[turn], duration: 4600 });
    poke();
  }, [copy, play, poke, say]);

  const playing = isTape(channel) ? channel : null;

  const sayOnce = useCallback(
    (key: string, text: string, expression: MascotExpression, duration = 4600) => {
      if (said.current.has(key)) {
        emote(expression);
        return;
      }
      said.current.add(key);
      say({ text, expression, duration });
    },
    [emote, say],
  );

  const flyTape = useCallback((tape: TapeId, to: Flight["to"], delay = 0) => {
    flightId.current += 1;
    const flight = { id: flightId.current, tape, to, delay };
    setFlights((list) => [...list.filter((f) => f.tape !== tape), flight]);
  }, []);

  const startTape = useCallback(
    (id: TapeId) => {
      play("tapeIn");
      setVcrBump((n) => n + 1);
      tuneTo(id, { quiet: true });
      if (id === "tape") unlockSecret("tape");
      const tape = tapeById(id, locale);
      const mood: MascotExpression = id === "tape" ? "surprised" : id === "tape-resort" ? "confused" : id === "tape-karaoke" ? "wink" : "excited";
      sayOnce(`insert:${id}`, tape.insertLine, mood, 5200);
    },
    [locale, play, sayOnce, tuneTo],
  );

  const landTape = useCallback(
    (flight: Flight) => {
      setFlights((list) => list.filter((f) => f.id !== flight.id));
      if (flight.to === "vcr") startTape(flight.tape);
    },
    [startTape],
  );

  const openShelf = useCallback(() => {
    tuned.current = true;
    poke();
    play("whoosh", { volume: 0.35 });
    setShelfOrigin(shelfButton.current?.getBoundingClientRect() ?? null);
    setShelfOpen(true);
    sayOnce("shelf", copy.shelf, "excited", 4200);
  }, [copy, play, poke, sayOnce]);

  const closeShelf = useCallback(() => {
    setShelfOpen(false);
    window.setTimeout(() => restoreFocus(shelfButton.current), 0);
  }, [restoreFocus]);

  const dismissShelf = useCallback(() => {
    play("whoosh", { volume: 0.22, pitch: 0.8 });
    closeShelf();
  }, [closeShelf, play]);

  const insertTape = useCallback(
    (id: TapeId) => {
      tuned.current = true;
      closeShelf();
      poke();
      play("pop", { volume: 0.5 });
      if (reduced) {
        startTape(id);
        return;
      }
      if (playing) {
        play("tapeOut");
        flyTape(playing, "shelf");
      }
      flyTape(id, "vcr", playing ? 0.22 : 0.12);
    },
    [closeShelf, flyTape, play, playing, poke, reduced, startTape],
  );

  const ejectTape = useCallback(
    (auto = false) => {
      if (!playing) return;
      poke();
      play("tapeOut");
      if (!reduced) flyTape(playing, "shelf");
      setVcrBump((n) => n + 1);
      tuneTo(lastRegular, { quiet: true });
      if (!auto) sayOnce(`eject:${playing}`, tapeById(playing, locale).ejectLine, "wink", 3400);
    },
    [flyTape, lastRegular, locale, play, playing, poke, reduced, sayOnce, tuneTo],
  );

  const replay = useCallback(() => {
    poke();
    play("static", { volume: 0.4 });
    setRewinding(true);
    window.setTimeout(() => {
      setSince(performance.now());
      setTake((n) => n + 1);
      setRewinding(false);
    }, reduced ? 0 : 520);
  }, [play, poke, reduced]);

  const onCue = useCallback(
    (cue: TapeCue, tape: TapeId) => {
      if (cue.sound) play(cue.sound, { volume: 0.5 });
      if (cue.mascot) {
        const { expression } = cue.mascot;
        const line = cue.mascot.line?.[locale];
        const key = `cue:${tape}:${cue.at}`;
        if (Array.isArray(line)) {
          const turn = rotations.current.get(key) ?? 0;
          rotations.current.set(key, turn + 1);
          say({ text: line[turn % line.length], expression, duration: 4200 });
        } else if (line) {
          sayOnce(key, line, expression, 4600);
        } else {
          emote(expression);
        }
      }
      if (cue.eject) ejectTape(true);
    },
    [ejectTape, emote, locale, play, say, sayOnce],
  );

  useTapePlayback(playing, since, take, onCue);

  const openZoom = useCallback(() => {
    tuned.current = true;
    poke();
    play("whoosh", { volume: 0.3, pitch: 1.15 });
    setZoomed(true);
  }, [play, poke]);

  const closeZoom = useCallback(() => {
    setZoomed(false);
    window.setTimeout(() => restoreFocus(zoomButton.current), 0);
  }, [restoreFocus]);

  const tvOrigin = useCallback(() => tvScreen.current?.getBoundingClientRect() ?? null, []);

  const broadcast = useMemo<Broadcast>(() => ({ since, take, zoomed, replay }), [since, take, zoomed, replay]);
  const away = useMemo(() => flights.map((f) => f.tape), [flights]);
  const vcrTape = playing && !flights.some((f) => f.tape === playing && f.to === "shelf") ? playing : null;

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
      [SPOTS.radio.x + 120, SPOTS.radio.y + 60, radioOn ? 130 : 0],
      [SPOTS.onAir.x + 75, SPOTS.onAir.y + 36, radioOn ? 110 : 0],
    ].filter(([, , r]) => r > 0);
    return holes
      .map(
        ([x, y, r]) =>
          `radial-gradient(ellipse ${Math.round(r * sx)}px ${Math.round(r * sy)}px at ${Math.round(BLEED + x * sx)}px ${Math.round(BLEED + y * sy)}px, transparent 25%, black 100%)`,
      )
      .join(", ");
  }, [radioOn, sceneSize, BLEED]);

  return (
    <BroadcastProvider value={broadcast}>
    <MissionOnAirProvider value={onAir}>
    <div ref={stageRef} className="on-dark relative isolate h-full w-full">
      <div ref={sceneRef} className="room-scene relative mx-auto">
        <RoomBackdrop className="pointer-events-none absolute inset-0 h-full w-full" />
        <TapeFlights flights={flights} onLand={landTape} />

        <RoomButton
          spot={SPOTS.window}
          label={copy.windowLabel}
          hint={copy.windowHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => say2(copy.periods[period], "happy", "page")}
          z={5}
        >
          <WindowArt period={period} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.plane}
          label={copy.planeLabel}
          hint={copy.planeHint}
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
          label={copy.chaosLabel}
          hint={copy.chaosHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setPeeled((p) => !p);
            say2(peeled ? copy.chaosBack : copy.chaosNote, "wink", "page");
          }}
          z={6}
        >
          <PosterChaosArt peeled={peeled} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.posterDream}
          label={copy.dreamLabel}
          hint={copy.dreamHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => say2(copy.dreamLine, "happy", "page")}
          z={6}
        >
          <PosterDreamArt />
        </RoomButton>

        {onAir ? (
          <RoomButton
            spot={SPOTS.onAir}
            label={onAir.state === "completed" ? copy.signDoneLabel(missionText(onAir.view, locale).title) : copy.signLabel(missionText(onAir.view, locale).title)}
            hint={onAir.state === "completed" ? copy.signDoneHint : copy.signHint}
            onHint={onHint}
            onHoverSound={hover}
            onActivate={handleSign}
            z={7}
          >
            <OnAirSign lit={radioOn || onAir.state !== "completed"} mission={onAir.state === "completed" ? "done" : "live"} />
          </RoomButton>
        ) : (
          <div aria-hidden className="pointer-events-none absolute z-[6]" style={spotStyle(SPOTS.onAir)}>
            <OnAirSign lit={radioOn} />
          </div>
        )}

        <RoomLink
          spot={SPOTS.trophy}
          href="/records"
          label={copy.trophyLabel}
          hint={copy.trophyHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={handleTrophy}
          z={7}
        >
          <TrophyArt shine={shine} record={Boolean(records)} />
        </RoomLink>

        <RoomButton
          spot={SPOTS.lamp}
          label={lightsOn ? copy.lampOffLabel : copy.lampOnLabel}
          pressed={!lightsOn}
          hint={lightsOn ? copy.lampOffHint : copy.lampOnHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={handleLamp}
          z={30}
        >
          <CeilingLampArt on={lightsOn} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.radio}
          label={radioOn ? copy.radioOffLabel : copy.radioOnLabel}
          pressed={radioOn}
          hint={radioOn ? copy.radioOffHint : copy.radioOnHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={toggleRadio}
          z={16}
        >
          <RadioArt on={radioOn} />
        </RoomButton>
        {radioOn && (
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
              aria-label={copy.stationLabel}
              className="press absolute z-[18] -rotate-6 whitespace-nowrap rounded-lg border-[3px] border-ink bg-sun px-[0.6em] py-[0.2em] font-display text-[clamp(10px,0.85vw,14px)] leading-tight text-ink shadow-[var(--shadow-ink-sm)]"
              style={{
                left: `${((SPOTS.radio.x - 6) / SCENE.w) * 100}%`,
                top: `${((SPOTS.radio.y - 4) / SCENE.h) * 100}%`,
              }}
            >
              {copy.stationButton}
            </button>
          </>
        )}

        <RoomButton
          spot={SPOTS.lava}
          label={copy.lavaLabel}
          hint={copy.lavaHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setLava((v) => v + 1);
            say2(copy.lavaLine, "happy", "pop");
          }}
          z={15}
          className={lightsOn ? "" : "drop-shadow-[0_0_24px_var(--lava-glow)]"}
        >
          <span className="block h-full w-full" style={{ ["--lava-glow" as string]: LAVA_PALETTES[lava % LAVA_PALETTES.length].glow }}>
            <LavaArt palette={lava} />
          </span>
        </RoomButton>

        <Tv
          screenRef={tvScreen}
          zoomButtonRef={zoomButton}
          zoomed={zoomed}
          onZoom={openZoom}
          rewinding={rewinding}
          channel={channel}
          badge={badgeFor(channel)}
          next={
            !playing && suggestion && channels[suggestion.game.slug]
              ? { number: channels[suggestion.game.slug].number, name: channels[suggestion.game.slug].name, onTune: tuneSuggestion }
              : null
          }
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
          ref={shelfButton}
          spot={SPOTS.vhs}
          label={copy.shelfLabel}
          hasPopup="dialog"
          hint={playing ? copy.shelfPlayingHint(tapeById(playing, locale).label) : copy.shelfHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={openShelf}
          z={13}
        >
          <VhsArt missing={[...(playing ? [playing] : []), ...away]} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.vcr}
          label={playing ? copy.vcrEjectLabel(tapeById(playing, locale).label) : copy.vcrEmptyLabel}
          hasPopup={playing ? undefined : "dialog"}
          hint={playing ? copy.vcrEjectHint : copy.vcrEmptyHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={playing ? () => ejectTape() : openShelf}
          hit="box"
          z={11}
        >
          <span key={vcrBump} className="block h-full w-full" style={vcrBump ? { animation: "vcr-clunk 0.26s ease-out" } : undefined}>
            <VcrArt playing={vcrTape} />
          </span>
        </RoomButton>

        <RoomButton
          spot={SPOTS.mascot}
          label={copy.mascotLabel}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={handleMascot}
          z={20}
          hit="box"
          className="[&>span]:!translate-y-0 [&>span]:!drop-shadow-none"
        >
          <span className="block h-full w-full" style={{ animation: "float 5s ease-in-out infinite" }}>
            <WatchingMascot store={look} pose="peek" expression={expression} wiggle={wiggle} className="h-full w-full" />
          </span>
        </RoomButton>

        <Arcade active={arcadeActive} onActivate={handleArcade} onHint={onHint} onHoverSound={hover} />

        <RoomButton
          spot={SPOTS.hiddenCart}
          label={copy.hiddenLabel}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setHiddenFound(true);
            unlockSecret("cartridge");
            say2(copy.hiddenLine, "excited", "coin");
          }}
          z={17}
          className={hiddenFound ? "[&_svg]:-translate-y-2" : ""}
        >
          <HiddenCartArt />
        </RoomButton>

        <RoomButton
          spot={SPOTS.cat}
          label={copy.catLabel}
          hint={copy.catHint}
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
          label={pizzaOpen ? copy.pizzaCloseLabel : copy.pizzaOpenLabel}
          pressed={pizzaOpen}
          hint={copy.pizzaHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={handlePizza}
          z={19}
        >
          <PizzaArt open={pizzaOpen} />
        </RoomButton>

        <RoomButton
          spot={SPOTS.controllers}
          label={copy.controllersLabel}
          hint={copy.controllersHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setRumble(true);
            window.setTimeout(() => setRumble(false), 500);
            say2(copy.controllersLine, "wink", "rumble");
          }}
          z={19}
          className={rumble ? "[&>span]:[animation:shake_0.25s_linear_2]" : ""}
        >
          <ControllersArt />
        </RoomButton>

        <RoomButton
          spot={SPOTS.cartridges}
          label={copy.cartridgesLabel}
          hint={copy.cartridgesHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setCartsShuffle((n) => n + 1);
            say2(cartridgeLine(), "happy", "click");
          }}
          z={19}
        >
          <span key={cartsShuffle} className="block h-full w-full" style={{ animation: cartsShuffle ? "hop 0.4s ease-out" : undefined }}>
            <CartridgesArt lit={playedCarts} />
          </span>
        </RoomButton>

        <RoomButton
          spot={SPOTS.skate}
          label={copy.skateLabel}
          hint={copy.skateHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => {
            setSkating((n) => n + 1);
            say2(copy.skateLine, "wink", "whoosh");
          }}
          z={21}
        >
          <span key={skating} className="block h-full w-full" style={{ animation: skating ? "skate-roll 0.9s cubic-bezier(.3,.7,.4,1)" : undefined }}>
            <SkateArt />
          </span>
        </RoomButton>

        <RoomButton
          spot={SPOTS.books}
          label={copy.booksLabel}
          hint={copy.booksHint}
          onHint={onHint}
          onHoverSound={hover}
          onActivate={() => say2(copy.bookTips[counters.current.book++ % copy.bookTips.length], "happy", "page")}
          z={18}
        >
          <BooksArt />
        </RoomButton>

        <div
          aria-hidden
          className="pointer-events-none absolute z-[60] transition-opacity duration-500"
          style={{
            inset: -BLEED,
            bottom: BLEED ? -BLEED : "min(0px, calc(var(--scene-h) - 100cqh))",
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
              {copy.wall}
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
          <div className="pointer-events-none flex items-end gap-2.5" aria-hidden>
            <div className="-mx-1 shrink-0 overflow-hidden px-1 pt-3">
              <motion.div
                initial={false}
                animate={{ y: bubbleText ? "0%" : "112%" }}
                transition={reduced ? { duration: 0 } : bubbleText ? { type: "spring", stiffness: 520, damping: 22 } : { duration: 0.22, ease: "easeIn" }}
                className="w-16 drop-shadow-[2px_3px_0_#1d1830]"
              >
                <WatchingMascot store={look} pose="peek" expression={expression} wiggle={wiggle} className="w-full" />
              </motion.div>
            </div>
            <AnimatePresence mode="wait">
              {bubbleText && (
                <motion.div
                  key={director.hint ? "hint" : `line-${director.lineKey}`}
                  initial={{ opacity: 0, y: 10, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.06 }}
                  className="mb-6 min-w-0 max-w-[20rem] flex-1 origin-bottom-left"
                >
                  <SpeechBubble tail="left" className="font-hand text-[16px] leading-snug">
                    {bubbleText}
                  </SpeechBubble>
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          dockTarget,
        )}

      <TapeShelf
        open={shelfOpen}
        inserted={playing}
        away={away}
        origin={shelfOrigin}
        onPick={insertTape}
        onEject={() => {
          closeShelf();
          ejectTape();
        }}
        onClose={dismissShelf}
        onHoverSound={hover}
      />

      {zoomed && (
        <TvZoom
          channel={channel}
          badge={badgeFor(channel)}
          switching={switching}
          osd={osd}
          flash={flash}
          rewinding={rewinding}
          onLaunch={launch}
          onHoverSound={hover}
          knobAngle={knobAngle}
          getOrigin={tvOrigin}
          onClose={closeZoom}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {director.announcement}
      </p>
    </div>
    </MissionOnAirProvider>
    </BroadcastProvider>
  );
}
