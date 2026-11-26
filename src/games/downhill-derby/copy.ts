import { localized } from "@/i18n/copy";
import type { SignKey } from "./sim/track";
import type { CartId } from "./sim/carts";
import type { CrashReason, TrickKind } from "./sim/sim";

export type GhostState = "on" | "off" | "later";

export type VoiceMoment = "pass" | "passed" | "crash" | "tease";

export type RaceCopy = {
  you: string;
  time: string;
  best: string;
  noBest: string;
  hint: string;
  hintTouch: string;
  hintSteps: readonly string[];
  tiers: readonly [string, string, string, string];
  kmh: string;
  passed: Record<CartId, string>;
  bark: string;
  startled: string;
  holdIt: string;
  cluck: string;
  zones: Record<"street" | "market" | "works" | "final", string>;
  shop: { fruit: string; pastel: string; sale: string; detour: string; works: string; slow: string; cheer: string; go: string };
  passedBy: Record<CartId, string>;
  go: string;
  perfect: string;
  gain: string;
  ok: string;
  nearMiss: string;
  crash: string;
  crashReason: Record<CrashReason, string>;
  lip: string;
  flip: (count: number) => string;
  shortcut: string;
  hitCone: string;
  hitCrate: string;
  hitLine: string;
  hitPothole: string;
  hitBin: string;
  hitGnome: string;
  hitHose: string;
  hitMelon: string;
  hitOrange: string;
  hitStand: string;
  helmet: string;
  bounce: (combo: number) => string;
  bounceMiss: string;
  bounceFlop: string;
  flock: { clean: string; scared: string };
  stairs: string;
  cidinha: string;
  vendorCalls: readonly string[];
  feira: { fair: string; fruit: string; greens: string; pastel: string; flowers: string; plaza: string };
  loopDone: string;
  loopSign: string;
  manhole: string;
  jet: string;
  dusty: string;
  hitBag: string;
  mila: string;
  voices: Record<CartId, Record<VoiceMoment, string>>;
  croak: string;
  live: string;
  secret: string;
  chalk: { hold: string; jump: string };
  beep: string;
  courses: { arlindo: string; feira: string; antena: string };
  sections: Record<"arlindo" | "feira" | "antena", Record<string, string>>;
  split: string;
  cobbles: string;
  paddle: string;
  tips: { align: string; alignTouch: string; barrier: string; duck: string; hit: string; awnings: string; awningsTouch: string; loop: string; loopTouch: string; jumpLine: string; jumpLineTouch: string };
  signs: Record<SignKey, string>;
  start: string;
  finish: string;
  show: {
    label: string;
    tricks: Record<Exclude<TrickKind, "flip" | "pose">, string>;
    poses: readonly [string, string, string];
    bank: (mult: string) => string;
    drop: string;
  };
  results: {
    place: (ordinal: string) => string;
    arrival: (ordinal: string) => string;
    show: string;
    headline: { win: string; close: string; second: string; third: string; fourth: string };
    record: (time: string) => string;
    newRecord: string;
    again: string;
    alt: string;
    unlocked: (cart: string) => string;
    wonBy: Record<CartId, (seconds: string) => string>;
    behind: Record<CartId, (seconds: string) => string>;
    facts: { perfect: string; crashes: string; combo: string; hits: string };
  };
  garage: {
    title: string;
    track: (n: number, name: string) => string;
    go: string;
    traits: Record<CartId, string>;
    locked: Record<"lina" | "mila", string>;
    ghost: (state: GhostState) => string;
    ghostTitle: string;
    ghostLead: string;
    ghostLater: string;
    keys: string;
    touch: string;
  };
  touch: { crouch: string; jump: string; spin: string };
  rivalNames: Record<CartId, string>;
  carts: Record<CartId, string>;
  youAre: (name: string) => string;
  puddle: { slow: string; boost: string };
  potholeBounce: string;
  ghost: string;
};

export const RACE_COPY = localized<RaceCopy>({
  "pt-BR": {
    you: "Você",
    time: "Tempo",
    best: "Melhor",
    noBest: "Sem tempo ainda",
    hint: "↓ agacha · ESPAÇO pula (segure no ar para fazer pose) · ← → giram no ar e empinam no chão",
    hintTouch: "Segure AGACHAR · deslize ou toque em PULAR (segure no ar para fazer pose) · as setas giram no ar e empinam no chão",
    hintSteps: ["Segure AGACHAR e deslize ou toque em PULAR", "No ar, segure PULAR para fazer pose", "As setas giram no ar e empinam no chão"],
    tiers: ["Rolando", "Embalado", "Voando baixo", "Sem freio"],
    kmh: "km/h",
    passed: { deco: "Você passou o Déco!", lina: "Você passou a Lina!", bruno: "Você passou o Bruno!", mila: "Você passou a Mila!" },
    bark: "AU! AU!",
    startled: "Ô, MENINO!",
    holdIt: "MINHAS LARANJAS!",
    cluck: "CÓ CÓ!",
    zones: { street: "RUA DAS PITANGUEIRAS", market: "FEIRA DA ESQUINA", works: "LADEIRA EM OBRAS", final: "DESCIDA FINAL" },
    shop: { fruit: "FRUTAS", pastel: "PASTEL", sale: "PROMOÇÃO!", detour: "DESVIO →", works: "OBRA", slow: "DEVAGAR", cheer: "VAI, DÉCO!", go: "LADEIRA ABAIXO" },
    passedBy: { deco: "O Déco passou você!", lina: "A Lina passou você!", bruno: "O Bruno passou você!", mila: "A Mila passou você!" },
    go: "JÁ!",
    perfect: "POUSO PERFEITO!",
    gain: "+ embalo",
    ok: "Pousou torto",
    nearMiss: "Quase capotou!",
    crash: "CAPOTOU!",
    crashReason: {
      upside: "Pousou de cabeça pra baixo",
      tilted: "O carrinho estava torto demais",
      barrier: "Bateu na barreira",
      truck: "Bateu no caminhão de lixo",
      fence: "Pulo fraco: pegou na cerca",
      loop: "Sem embalo: caiu do looping",
      pose: "Pousou fazendo pose: solte antes de tocar o chão",
      wheelie: "Empinou demais e virou",
    },
    lip: "Pulo no ponto!",
    flip: (count) => (count > 1 ? `Mortal ×${count}!` : "Mortal!"),
    shortcut: "ATALHO!",
    hitCone: "Pof! Cone",
    hitCrate: "Caixote!",
    hitLine: "Pegou no varal!",
    hitPothole: "Tum! Buraco",
    hitBin: "Lixeira!",
    hitGnome: "O ANÃO NÃO!",
    hitHose: "Molhou!",
    hitMelon: "Ploft! Melancia",
    hitOrange: "Laranjada!",
    hitStand: "Derrubou a banca!",
    helmet: "Capacete de melancia!",
    bounce: (combo) => (combo > 1 ? `Quique ×${combo}!` : "Quique!"),
    bounceMiss: "Perdeu o ritmo",
    bounceFlop: "Caiu torto no toldo",
    flock: { clean: "PASSOU LISO PELOS POMBOS!", scared: "Revoada!" },
    stairs: "Escadaria: agache para chacoalhar menos",
    cidinha: "MEU CARRINHO!",
    vendorCalls: ["OLHA A LARANJA!", "PASTEL QUENTINHO!", "FREGUESA!", "É DA HORTA!"],
    feira: { fair: "FEIRA LIVRE", fruit: "FRUTAS", greens: "VERDURAS", pastel: "PASTEL", flowers: "FLORES", plaza: "PRAÇA DA MATRIZ" },
    loopDone: "LOOPING!",
    loopSign: "VELOCIDADE MÍNIMA: VOANDO BAIXO",
    manhole: "Bueiro!",
    jet: "CANO ESTOURADO!",
    dusty: "Branco de cimento!",
    hitBag: "Saco de cimento!",
    mila: "POR AQUI!",
    voices: {
      lina: { pass: "Turbina ligada!", passed: "Ei! Volta aqui!", crash: "É um recurso!", tease: "Quer fita adesiva?" },
      bruno: { pass: "Conforme o plano.", passed: "Isso não estava nos cálculos.", crash: "Tô bem! Tô bem!", tease: "Eu avisei." },
      mila: { pass: "Com licença.", passed: "Interessante.", crash: "Foi de propósito.", tease: "Anotado." },
      deco: { pass: "Sai da frente!", passed: "Ô! Espera!", crash: "De novo não!", tease: "Essa doeu!" },
    },
    croak: "CROAC!",
    live: "AO VIVO",
    secret: "ANÃO DOURADO!",
    chalk: { hold: "SEGURA ↓", jump: "PULA!" },
    beep: "BIP! BIP!",
    courses: { arlindo: "Ladeira do Seu Arlindo", feira: "Dia de Feira", antena: "Morro da Antena" },
    sections: {
      arlindo: { start: "Largada", descent: "Descida", crests: "Lombadas", obstacles: "Obstáculos", arlindo: "Casa do Seu Arlindo", truck: "Caminhão do lixo", clothes: "Varal", final: "Descida final" },
      feira: { start: "Largada", descent: "Descida", fruit: "Frutas rolando", market: "Feira", descent2: "Segunda descida", stairs: "Escadaria", plaza: "Praça" },
      antena: { start: "Largada", descent: "Descida", works: "Obra", loop: "Looping", manhole: "Bueiro", final: "Escadarias", plaza: "Praça" },
    },
    split: "Parcial",
    cobbles: "Paralelepípedo: agache para chacoalhar menos",
    paddle: "remando…",
    tips: {
      align: "No ar, gire com ← → até a silhueta do pouso ficar verde",
      alignTouch: "No ar, use os botões de girar até a silhueta do pouso ficar verde",
      barrier: "Barreira: agache antes e pule alto",
      duck: "Varal: agache para passar por baixo",
      hit: "Pule por cima para não perder embalo",
      awnings: "Aperte ESPAÇO bem quando o carrinho tocar o toldo",
      awningsTouch: "Toque PULAR bem quando o carrinho tocar o toldo",
      loop: "Segure ↓ na descida para chegar embalado no looping",
      loopTouch: "Segure AGACHAR na descida para chegar embalado no looping",
      jumpLine: "Plano B: segure ↓ e a linha pontilhada mostra onde o pulo cai",
      jumpLineTouch: "Plano B: segure AGACHAR e a linha pontilhada mostra onde o pulo cai",
    },
    signs: {
      crouch: "AGACHE NA DESCIDA",
      rollers: "PULE NA CRISTA",
      crest: "CRISTA À FRENTE",
      ramp: "RAMPA: PULE NA BEIRA",
      land: "GIRE E POUSE NA DESCIDA",
      cones: "CONES: PULE",
      crates: "CAIXOTE: PULE",
      duck: "VARAL: AGACHE",
      jump: "BARREIRA: PULE ALTO",
      shortcut: "ATALHO ↑ PULE NA BEIRA",
      cobbles: "PARALELEPÍPEDO",
      finish: "RETA FINAL",
      pothole: "BURACO: PULE",
      bins: "LIXEIRAS: PULE",
      hose: "MANGUEIRA: PULE A ÁGUA",
      truck: "CAMINHÃO DE RÉ: PULE NA RAMPA",
      yard: "ATALHO ↑ PELO QUINTAL",
      fence: "CERCA: PULE NO PONTO",
      fruit: "FRUTA ROLANDO: PULE",
      awnings: "TOLDOS ↑ PULE NA RAMPA",
      stairs: "ESCADARIA: AGACHE",
      rail: "CORRIMÃO ↑ PULE NO TOPO",
      pigeons: "POMBOS: PASSE POR CIMA",
      trolley: "CARRINHO ↑ VOLTE AOS TOLDOS",
      loop: "LOOPING: AGACHE NA DESCIDA",
      bag: "SACO BALANÇANDO: AGACHE",
      seesaw: "GANGORRA: PULE NA PONTA",
      works: "OBRA: CUIDADO",
    },
    start: "LARGADA",
    finish: "CHEGADA",
    show: {
      label: "Show",
      tricks: { lip: "Pulo no ponto", perfect: "Pouso perfeito", rail: "Deslizando", wheelie: "Empinada", nearMiss: "Raspou!", crate: "Caixote quebrado" },
      poses: ["Sem mão!", "De pé!", "Voando!"],
      bank: (mult) => `Sequência ×${mult}`,
      drop: "Perdeu a sequência",
    },
    results: {
      place: (ordinal) => `${ordinal} lugar`,
      arrival: (ordinal) => `Chegada em ${ordinal} lugar`,
      show: "Pontos da corrida",
      headline: { win: "Ninguém segurou você!", close: "Quase!", second: "Dá pra buscar!", third: "Terceiro, mas inteiro!", fourth: "Quarto. Próxima é sua!" },
      record: (time) => `Recorde: ${time}`,
      facts: { perfect: "Pousos perfeitos", crashes: "Capotadas", combo: "Melhor combo", hits: "Trombadas" },
      newRecord: "Novo recorde da pista!",
      again: "Correr de novo",
      alt: "Trocar carrinho",
      unlocked: (cart) => `A ${cart} já está te esperando na garagem!`,
      wonBy: { deco: (s) => `Deixou o Déco ${s} s para trás!`, lina: (s) => `Deixou a Lina ${s} s para trás!`, bruno: (s) => `Deixou o Bruno ${s} s para trás!`, mila: (s) => `Deixou a Mila ${s} s para trás!` },
      behind: { deco: (s) => `Faltaram ${s} s para passar o Déco`, lina: (s) => `Faltaram ${s} s para passar a Lina`, bruno: (s) => `Faltaram ${s} s para passar o Bruno`, mila: (s) => `Faltaram ${s} s para passar a Mila` },
    },
    garage: {
      title: "Garagem",
      track: (n, name) => `Pista ${n}: ${name}`,
      go: "Correr!",
      traits: {
        deco: "Fácil de controlar e bom de equilíbrio. Se capotar, volta rapidinho à corrida!",
        bruno: "Mostra onde você vai pousar e aguenta aterrissagens tortas. Velocidade? Nem tanto.",
        lina: "O ventilador empurra no plano e na subida. Pesado, gira devagar no ar.",
        mila: "Leve, gira rápido e acelera nas poças. O pouso tem que ser certeiro.",
      },
      locked: { lina: "Termine à frente da Lina em Dia de Feira para desbloquear.", mila: "Termine à frente da Mila em Morro da Antena para desbloquear." },
      ghost: (state) => `Fantasma da melhor corrida: ${state === "on" ? "ligado" : state === "off" ? "desligado" : "disponível após sua primeira corrida"}`,
      ghostTitle: "Fantasma da melhor corrida",
      ghostLead: "Dispute contra seu recorde",
      ghostLater: "Disponível após sua primeira corrida",
      keys: "← → Trocar de carrinho · Enter ou Espaço: correr · G: mostrar/ocultar fantasma",
      touch: "Toque num carrinho e depois em CORRER!",
    },
    touch: { crouch: "AGACHAR", jump: "PULAR", spin: "GIRAR" },
    rivalNames: { deco: "Déco", lina: "Lina", bruno: "Bruno", mila: "Mila" },
    carts: { deco: "Relâmpago de Madeira", lina: "Turbina da Vovó", bruno: "Plano B", mila: "Banheira" },
    youAre: (name) => `${name} (você)`,
    puddle: { slow: "Poça! Perdeu embalo", boost: "Splash! A banheira deslizou" },
    potholeBounce: "Boing! Quicou no buraco",
    ghost: "Seu melhor",
  },
  en: {
    you: "You",
    time: "Time",
    best: "Best",
    noBest: "No time yet",
    hint: "↓ crouches · SPACE jumps (hold in the air to strike a pose) · ← → spin in the air and pop wheelies on the ground",
    hintTouch: "Hold CROUCH · slide or tap to JUMP (hold in the air to strike a pose) · the arrows spin in the air and pop wheelies on the ground",
    hintSteps: ["Hold CROUCH, then slide or tap to JUMP", "In the air, hold JUMP to strike a pose", "The arrows spin in the air and pop wheelies on the ground"],
    tiers: ["Rolling", "Picking up", "Flying low", "No brakes"],
    kmh: "km/h",
    passed: { deco: "You passed Déco!", lina: "You passed Lina!", bruno: "You passed Bruno!", mila: "You passed Mila!" },
    bark: "WOOF! WOOF!",
    startled: "HEY, KID!",
    holdIt: "MY ORANGES!",
    cluck: "BAWK!",
    zones: { street: "PITANGA STREET", market: "CORNER MARKET", works: "ROADWORKS HILL", final: "FINAL DESCENT" },
    shop: { fruit: "FRUIT", pastel: "PASTRIES", sale: "SALE!", detour: "DETOUR →", works: "WORKS", slow: "SLOW", cheer: "GO, DÉCO!", go: "DOWNHILL DERBY" },
    passedBy: { deco: "Déco passed you!", lina: "Lina passed you!", bruno: "Bruno passed you!", mila: "Mila passed you!" },
    go: "GO!",
    perfect: "PERFECT LANDING!",
    gain: "+ speed",
    ok: "Wobbly landing",
    nearMiss: "Almost wiped out!",
    crash: "WIPEOUT!",
    crashReason: {
      upside: "Landed upside down",
      tilted: "The cart was tilted too far",
      barrier: "Hit the barrier",
      truck: "Hit the garbage truck",
      fence: "Weak jump: caught the fence",
      loop: "Not enough speed: fell off the loop",
      pose: "Landed mid-pose: let go before touching down",
      wheelie: "Wheelie went too far and flipped",
    },
    lip: "Right on the edge!",
    flip: (count) => (count > 1 ? `Flip ×${count}!` : "Flip!"),
    shortcut: "SHORTCUT!",
    hitCone: "Bonk! Cone",
    hitCrate: "Crate!",
    hitLine: "Caught the clothesline!",
    hitPothole: "Thud! Pothole",
    hitBin: "Trash bin!",
    hitGnome: "NOT THE GNOME!",
    hitHose: "Splash!",
    hitMelon: "Splat! Watermelon",
    hitOrange: "Orange crush!",
    hitStand: "Knocked over a stand!",
    helmet: "Watermelon helmet!",
    bounce: (combo) => (combo > 1 ? `Bounce ×${combo}!` : "Bounce!"),
    bounceMiss: "Lost the rhythm",
    bounceFlop: "Landed crooked on the awning",
    flock: { clean: "SLIPPED PAST THE PIGEONS!", scared: "Pigeon panic!" },
    stairs: "Stairs: crouch to rattle less",
    cidinha: "MY TROLLEY!",
    vendorCalls: ["FRESH ORANGES!", "HOT PASTRIES!", "OVER HERE!", "FRESH FROM THE FARM!"],
    feira: { fair: "STREET MARKET", fruit: "FRUIT", greens: "VEGGIES", pastel: "PASTRIES", flowers: "FLOWERS", plaza: "MAIN SQUARE" },
    loopDone: "LOOP!",
    loopSign: "MINIMUM SPEED: FLYING LOW",
    manhole: "Manhole!",
    jet: "BURST PIPE!",
    dusty: "Covered in cement!",
    hitBag: "Cement bag!",
    mila: "THIS WAY!",
    voices: {
      lina: { pass: "Turbo on!", passed: "Hey! Get back here!", crash: "It's a feature!", tease: "Need some tape?" },
      bruno: { pass: "Right on plan.", passed: "That wasn't in my notes.", crash: "I'm fine! I'm fine!", tease: "I did warn you." },
      mila: { pass: "Excuse me.", passed: "Interesting.", crash: "Meant to do that.", tease: "Noted." },
      deco: { pass: "Coming through!", passed: "Hey! Wait up!", crash: "Not again!", tease: "That one hurt!" },
    },
    croak: "RIBBIT!",
    live: "LIVE",
    secret: "GOLDEN GNOME!",
    chalk: { hold: "HOLD ↓", jump: "JUMP!" },
    beep: "BEEP! BEEP!",
    courses: { arlindo: "Mr. Arlindo's Hill", feira: "Market Day", antena: "Antenna Hill" },
    sections: {
      arlindo: { start: "Start", descent: "Descent", crests: "Bumps", obstacles: "Obstacles", arlindo: "Mr. Arlindo's house", truck: "Garbage truck", clothes: "Clothesline", final: "Final descent" },
      feira: { start: "Start", descent: "Descent", fruit: "Rolling fruit", market: "Market", descent2: "Second descent", stairs: "Stairway", plaza: "Square" },
      antena: { start: "Start", descent: "Descent", works: "Roadworks", loop: "Loop", manhole: "Manhole", final: "Stairways", plaza: "Square" },
    },
    split: "Split",
    cobbles: "Cobblestones: crouch to rattle less",
    paddle: "paddling…",
    tips: {
      align: "In the air, spin with ← → until the landing outline turns green",
      alignTouch: "In the air, use the spin buttons until the landing outline turns green",
      barrier: "Barrier: crouch first, then jump high",
      duck: "Clothesline: crouch to pass under it",
      hit: "Jump over it to keep your speed",
      awnings: "Press SPACE right as the cart touches the awning",
      awningsTouch: "Tap JUMP right as the cart touches the awning",
      loop: "Hold ↓ on the way down to hit the loop at full speed",
      loopTouch: "Hold CROUCH on the way down to hit the loop at full speed",
      jumpLine: "Plan B: hold ↓ and the dotted line shows where the jump lands",
      jumpLineTouch: "Plan B: hold CROUCH and the dotted line shows where the jump lands",
    },
    signs: {
      crouch: "CROUCH ON THE WAY DOWN",
      rollers: "JUMP AT THE TOP",
      crest: "CREST AHEAD",
      ramp: "RAMP: JUMP AT THE EDGE",
      land: "SPIN AND LAND ON THE SLOPE",
      cones: "CONES: JUMP",
      crates: "CRATE: JUMP",
      duck: "CLOTHESLINE: CROUCH",
      jump: "BARRIER: JUMP HIGH",
      shortcut: "SHORTCUT ↑ JUMP AT THE EDGE",
      cobbles: "COBBLESTONES",
      finish: "HOME STRETCH",
      pothole: "POTHOLE: JUMP",
      bins: "TRASH BINS: JUMP",
      hose: "HOSE: JUMP THE WATER",
      truck: "TRUCK BACKING UP: JUMP THE RAMP",
      yard: "SHORTCUT ↑ THROUGH THE YARD",
      fence: "FENCE: JUMP AT THE EDGE",
      fruit: "ROLLING FRUIT: JUMP",
      awnings: "AWNINGS ↑ JUMP THE RAMP",
      stairs: "STAIRS: CROUCH",
      rail: "HANDRAIL ↑ JUMP AT THE TOP",
      pigeons: "PIGEONS: GO OVER THEM",
      trolley: "TROLLEY ↑ BACK TO THE AWNINGS",
      loop: "LOOP: CROUCH ON THE WAY DOWN",
      bag: "SWINGING BAG: CROUCH",
      seesaw: "SEESAW: JUMP AT THE TIP",
      works: "WORK ZONE: CAREFUL",
    },
    start: "START",
    finish: "FINISH",
    show: {
      label: "Show",
      tricks: { lip: "Popped on the mark", perfect: "Perfect landing", rail: "Grinding", wheelie: "Wheelie", nearMiss: "Close call!", crate: "Busted crate" },
      poses: ["No hands!", "Standing!", "Flying!"],
      bank: (mult) => `Combo ×${mult}`,
      drop: "Combo lost",
    },
    results: {
      place: (ordinal) => `${ordinal} place`,
      arrival: (ordinal) => `Finished ${ordinal}`,
      show: "Race points",
      headline: { win: "Nobody could stop you!", close: "So close!", second: "You can catch them!", third: "Third, but in one piece!", fourth: "Fourth. Next one's yours!" },
      record: (time) => `Best: ${time}`,
      newRecord: "New track record!",
      facts: { perfect: "Perfect landings", crashes: "Crashes", combo: "Best combo", hits: "Bumps" },
      again: "Race again",
      alt: "Change cart",
      unlocked: (cart) => `${cart} is waiting for you in the garage!`,
      wonBy: { deco: (s) => `Left Déco ${s} s behind!`, lina: (s) => `Left Lina ${s} s behind!`, bruno: (s) => `Left Bruno ${s} s behind!`, mila: (s) => `Left Mila ${s} s behind!` },
      behind: { deco: (s) => `${s} s short of passing Déco`, lina: (s) => `${s} s short of passing Lina`, bruno: (s) => `${s} s short of passing Bruno`, mila: (s) => `${s} s short of passing Mila` },
    },
    garage: {
      title: "Garage",
      track: (n, name) => `Track ${n}: ${name}`,
      go: "Race!",
      traits: {
        deco: "Easy to handle and well balanced. Wipe out and you're back in the race in no time!",
        bruno: "Shows where you'll land and takes crooked landings in stride. Speed? Not so much.",
        lina: "The fan pushes on flats and uphill. Heavy, spins slowly in the air.",
        mila: "Light, spins fast and speeds up in puddles. Landings must be spot on.",
      },
      locked: { lina: "Finish ahead of Lina on Market Day to unlock.", mila: "Finish ahead of Mila on Antenna Hill to unlock." },
      ghost: (state) => `Best run ghost: ${state === "on" ? "on" : state === "off" ? "off" : "available after your first race"}`,
      ghostTitle: "Best run ghost",
      ghostLead: "Race against your record",
      ghostLater: "Available after your first race",
      keys: "← → Switch cart · Enter or Space: race · G: show/hide ghost",
      touch: "Tap a cart, then RACE!",
    },
    touch: { crouch: "CROUCH", jump: "JUMP", spin: "SPIN" },
    rivalNames: { deco: "Déco", lina: "Lina", bruno: "Bruno", mila: "Mila" },
    carts: { deco: "Wooden Lightning", lina: "Grandma's Turbo", bruno: "Plan B", mila: "The Tub" },
    youAre: (name) => `${name} (you)`,
    puddle: { slow: "Puddle! Lost speed", boost: "Splash! The tub slid" },
    potholeBounce: "Boing! Bounced off the pothole",
    ghost: "Your best",
  },
});
