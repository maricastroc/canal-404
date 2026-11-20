import { localized } from "@/i18n/copy";
import type { SignKey } from "./sim/track";
import type { CrashReason } from "./sim/sim";

export type RaceCopy = {
  you: string;
  time: string;
  best: string;
  noBest: string;
  hint: string;
  hintTouch: string;
  tiers: readonly [string, string, string, string];
  kmh: string;
  passed: Record<"lina" | "bruno", string>;
  dusted: string;
  dustedRival: Record<"lina" | "bruno", string>;
  kicked: string;
  bark: string;
  startled: string;
  holdIt: string;
  cluck: string;
  kickedYou: string;
  kickedRival: Record<"lina" | "bruno", string>;
  zones: Record<"street" | "market" | "works" | "final", string>;
  shop: { fruit: string; pastel: string; sale: string; detour: string; works: string; slow: string; cheer: string; go: string };
  passedBy: Record<"lina" | "bruno", string>;
  go: string;
  paused: string;
  pausedHint: string;
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
  croak: string;
  live: string;
  secret: string;
  chalk: { hold: string; jump: string };
  beep: string;
  courses: { arlindo: string; feira: string; antena: string; test: string };
  cobbles: string;
  paddle: string;
  tips: { align: string; alignTouch: string; barrier: string; duck: string; hit: string; awnings: string; awningsTouch: string; loop: string; loopTouch: string };
  signs: Record<SignKey, string>;
  start: string;
  finish: string;
  finishTitle: string;
  newBest: string;
  results: {
    place: (ordinal: string) => string;
    headline: { win: string; close: string; second: string; third: string };
    record: (time: string) => string;
    standings: string;
    yourRace: string;
    secretFound: string;
    perfect: string;
    ok: string;
    crashes: string;
    hits: string;
    shortcut: string;
    yes: string;
    no: string;
    top: string;
    air: string;
    again: string;
    againTouch: string;
    wonBy: Record<"lina" | "bruno", (seconds: string) => string>;
    secret: string;
    pigeons: string;
    pigeonsFound: string;
    behind: Record<"lina" | "bruno", (seconds: string) => string>;
  };
  touch: { crouch: string; jump: string; restart: string; pause: string };
  rivalNames: Record<"lina" | "bruno", string>;
  carts: Record<"deco" | "lina" | "bruno", string>;
  racerNames: Record<"deco" | "lina" | "bruno", string>;
  ghost: string;
};

export const RACE_COPY = localized<RaceCopy>({
  "pt-BR": {
    you: "Você",
    time: "Tempo",
    best: "Melhor",
    noBest: "Sem tempo ainda",
    hint: "Segure ↓ para agachar · ESPAÇO pula · ← → giram no ar",
    hintTouch: "Segure AGACHAR · toque PULAR · no ar, use os botões de girar",
    tiers: ["Rolando", "Embalado", "Voando baixo", "Sem freio"],
    kmh: "km/h",
    passed: { lina: "Você passou a Lina!", bruno: "Você passou o Bruno!" },
    dusted: "Poeira na cara!",
    dustedRival: { lina: "Poeira na Lina!", bruno: "Poeira no Bruno!" },
    kicked: "Caixote lá vai!",
    bark: "AU! AU!",
    startled: "Ô, MENINO!",
    holdIt: "MINHAS LARANJAS!",
    cluck: "CÓ CÓ!",
    kickedYou: "Levou um caixote!",
    kickedRival: { lina: "Caixote na Lina!", bruno: "Caixote no Bruno!" },
    zones: { street: "RUA DAS PITANGUEIRAS", market: "FEIRA DA ESQUINA", works: "LADEIRA EM OBRAS", final: "DESCIDA FINAL" },
    shop: { fruit: "FRUTAS", pastel: "PASTEL", sale: "PROMOÇÃO!", detour: "DESVIO →", works: "OBRA", slow: "DEVAGAR", cheer: "VAI, DÉCO!", go: "LADEIRA ABAIXO" },
    passedBy: { lina: "A Lina passou você!", bruno: "O Bruno passou você!" },
    go: "JÁ!",
    paused: "Pausado",
    pausedHint: "Esc ou P para voltar · R reinicia",
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
    stairs: "Escadaria: agache para trepidar menos",
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
    croak: "CROAC!",
    live: "AO VIVO",
    secret: "ANÃO DOURADO!",
    chalk: { hold: "SEGURA ↓", jump: "PULA!" },
    beep: "BIP! BIP!",
    courses: { arlindo: "Ladeira do Seu Arlindo", feira: "Dia de Feira", antena: "Morro da Antena", test: "Pista de teste" },
    cobbles: "Paralelepípedo: agache para trepidar menos",
    paddle: "remando…",
    tips: {
      align: "No ar, gire com ← → até a silhueta do pouso ficar verde",
      alignTouch: "No ar, use os botões de girar até a silhueta do pouso ficar verde",
      barrier: "Barreira: agache antes e pule alto",
      duck: "Varal: agache para passar por baixo",
      hit: "Pule por cima para não perder embalo",
      awnings: "Aperte ESPAÇO na hora em que o carrinho tocar o toldo",
      awningsTouch: "Toque PULAR na hora em que o carrinho tocar o toldo",
      loop: "Segure ↓ na descida para chegar no looping com embalo",
      loopTouch: "Segure AGACHAR na descida para chegar no looping com embalo",
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
    finishTitle: "Chegada!",
    newBest: "Novo recorde!",
    results: {
      place: (ordinal) => `${ordinal} lugar`,
      headline: { win: "Você venceu!", close: "Quase!", second: "Dá pra buscar!", third: "Terceiro, mas inteiro!" },
      record: (time) => `Recorde: ${time}`,
      standings: "Classificação",
      yourRace: "Sua corrida",
      secretFound: "Achou o anão dourado!",
      perfect: "Pousos perfeitos",
      ok: "Pousos tortos",
      crashes: "Capotadas",
      hits: "Batidas",
      shortcut: "Atalho",
      yes: "sim",
      no: "não",
      top: "Velocidade máxima",
      air: "Tempo no ar",
      again: "Correr de novo",
      againTouch: "Correr de novo",
      wonBy: { lina: (s) => `Venceu a Lina por ${s} s!`, bruno: (s) => `Venceu o Bruno por ${s} s!` },
      secret: "Anão dourado",
      pigeons: "Pombos",
      pigeonsFound: "Passou liso pelos pombos!",
      behind: { lina: (s) => `Faltaram ${s} s para passar a Lina`, bruno: (s) => `Faltaram ${s} s para passar o Bruno` },
    },
    touch: { crouch: "AGACHAR", jump: "PULAR", restart: "Reiniciar", pause: "Pausar" },
    rivalNames: { lina: "Lina", bruno: "Bruno" },
    carts: { deco: "Relâmpago de Madeira", lina: "Turbina da Vovó", bruno: "Plano B" },
    racerNames: { deco: "Déco (você)", lina: "Lina", bruno: "Bruno" },
    ghost: "Seu melhor",
  },
  en: {
    you: "You",
    time: "Time",
    best: "Best",
    noBest: "No time yet",
    hint: "Hold ↓ to crouch · SPACE jumps · ← → spin in the air",
    hintTouch: "Hold CROUCH · tap JUMP · in the air, use the spin buttons",
    tiers: ["Rolling", "Picking up", "Flying low", "No brakes"],
    kmh: "km/h",
    passed: { lina: "You passed Lina!", bruno: "You passed Bruno!" },
    dusted: "Dust in your face!",
    dustedRival: { lina: "Dust on Lina!", bruno: "Dust on Bruno!" },
    kicked: "Crate incoming!",
    bark: "WOOF! WOOF!",
    startled: "HEY, KID!",
    holdIt: "MY ORANGES!",
    cluck: "BAWK!",
    kickedYou: "Hit by a crate!",
    kickedRival: { lina: "Crate hits Lina!", bruno: "Crate hits Bruno!" },
    zones: { street: "PITANGA STREET", market: "CORNER MARKET", works: "ROADWORKS HILL", final: "FINAL DESCENT" },
    shop: { fruit: "FRUIT", pastel: "PASTRIES", sale: "SALE!", detour: "DETOUR →", works: "WORKS", slow: "SLOW", cheer: "GO, DÉCO!", go: "DOWNHILL DERBY" },
    passedBy: { lina: "Lina passed you!", bruno: "Bruno passed you!" },
    go: "GO!",
    paused: "Paused",
    pausedHint: "Esc or P to resume · R restarts",
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
    croak: "RIBBIT!",
    live: "LIVE",
    secret: "GOLDEN GNOME!",
    chalk: { hold: "HOLD ↓", jump: "JUMP!" },
    beep: "BEEP! BEEP!",
    courses: { arlindo: "Mr. Arlindo's Hill", feira: "Market Day", antena: "Antenna Hill", test: "Test track" },
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
      loop: "Hold ↓ on the way down to reach the loop with speed",
      loopTouch: "Hold CROUCH on the way down to reach the loop with speed",
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
    finishTitle: "Finish!",
    newBest: "New record!",
    results: {
      place: (ordinal) => `${ordinal} place`,
      headline: { win: "You won!", close: "So close!", second: "You can catch them!", third: "Third, but in one piece!" },
      record: (time) => `Best: ${time}`,
      standings: "Standings",
      yourRace: "Your race",
      secretFound: "Found the golden gnome!",
      perfect: "Perfect landings",
      ok: "Wobbly landings",
      crashes: "Wipeouts",
      hits: "Bumps",
      shortcut: "Shortcut",
      yes: "yes",
      no: "no",
      top: "Top speed",
      air: "Air time",
      again: "Race again",
      againTouch: "Race again",
      wonBy: { lina: (s) => `Beat Lina by ${s} s!`, bruno: (s) => `Beat Bruno by ${s} s!` },
      secret: "Golden gnome",
      pigeons: "Pigeons",
      pigeonsFound: "Slipped past the pigeons!",
      behind: { lina: (s) => `${s} s short of passing Lina`, bruno: (s) => `${s} s short of passing Bruno` },
    },
    touch: { crouch: "CROUCH", jump: "JUMP", restart: "Restart", pause: "Pause" },
    rivalNames: { lina: "Lina", bruno: "Bruno" },
    carts: { deco: "Wooden Lightning", lina: "Grandma's Turbo", bruno: "Plan B" },
    racerNames: { deco: "Déco (you)", lina: "Lina", bruno: "Bruno" },
    ghost: "Your best",
  },
});
