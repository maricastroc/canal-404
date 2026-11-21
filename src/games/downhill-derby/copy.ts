import { localized } from "@/i18n/copy";
import type { SignKey } from "./sim/track";
import type { CartId } from "./sim/carts";
import type { CrashReason, TrickKind } from "./sim/sim";

export type RaceCopy = {
  you: string;
  time: string;
  best: string;
  noBest: string;
  hint: string;
  hintTouch: string;
  tiers: readonly [string, string, string, string];
  kmh: string;
  passed: Record<CartId, string>;
  dusted: string;
  dustedRival: Record<CartId, string>;
  kicked: string;
  bark: string;
  startled: string;
  holdIt: string;
  cluck: string;
  kickedYou: string;
  kickedRival: Record<CartId, string>;
  zones: Record<"street" | "market" | "works" | "final", string>;
  shop: { fruit: string; pastel: string; sale: string; detour: string; works: string; slow: string; cheer: string; go: string };
  passedBy: Record<CartId, string>;
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
  sections: Record<"arlindo" | "feira" | "antena" | "test", Record<string, string>>;
  split: string;
  cobbles: string;
  paddle: string;
  tips: { align: string; alignTouch: string; barrier: string; duck: string; hit: string; awnings: string; awningsTouch: string; loop: string; loopTouch: string; jumpLine: string; jumpLineTouch: string };
  signs: Record<SignKey, string>;
  start: string;
  finish: string;
  finishTitle: string;
  newBest: string;
  show: {
    label: string;
    tricks: Record<Exclude<TrickKind, "flip" | "pose">, string>;
    poses: readonly [string, string, string];
    bank: (mult: string) => string;
    drop: string;
  };
  results: {
    place: (ordinal: string) => string;
    show: string;
    showRecord: (points: string) => string;
    newShowRecord: string;
    bestSeq: string;
    headline: { win: string; close: string; second: string; third: string; fourth: string };
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
    wonBy: Record<CartId, (seconds: string) => string>;
    secret: string;
    pigeons: string;
    pigeonsFound: string;
    behind: Record<CartId, (seconds: string) => string>;
  };
  touch: { crouch: string; jump: string; restart: string; pause: string };
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
    hint: "↓ agacha · ESPAÇO pula (segure no ar: pose) · ← → giram no ar e empinam no chão",
    hintTouch: "Segure AGACHAR · toque PULAR (segure no ar: pose) · girar no ar, empinar no chão",
    tiers: ["Rolando", "Embalado", "Voando baixo", "Sem freio"],
    kmh: "km/h",
    passed: { deco: "Você passou o Déco!", lina: "Você passou a Lina!", bruno: "Você passou o Bruno!", mila: "Você passou a Mila!" },
    dusted: "Poeira na cara!",
    dustedRival: { deco: "Poeira no Déco!", lina: "Poeira na Lina!", bruno: "Poeira no Bruno!", mila: "Poeira na Mila!" },
    kicked: "Caixote lá vai!",
    bark: "AU! AU!",
    startled: "Ô, MENINO!",
    holdIt: "MINHAS LARANJAS!",
    cluck: "CÓ CÓ!",
    kickedYou: "Levou um caixote!",
    kickedRival: { deco: "Caixote no Déco!", lina: "Caixote na Lina!", bruno: "Caixote no Bruno!", mila: "Caixote na Mila!" },
    zones: { street: "RUA DAS PITANGUEIRAS", market: "FEIRA DA ESQUINA", works: "LADEIRA EM OBRAS", final: "DESCIDA FINAL" },
    shop: { fruit: "FRUTAS", pastel: "PASTEL", sale: "PROMOÇÃO!", detour: "DESVIO →", works: "OBRA", slow: "DEVAGAR", cheer: "VAI, DÉCO!", go: "LADEIRA ABAIXO" },
    passedBy: { deco: "O Déco passou você!", lina: "A Lina passou você!", bruno: "O Bruno passou você!", mila: "A Mila passou você!" },
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
    sections: {
      arlindo: { start: "Largada", descent: "Descida", crests: "Lombadas", obstacles: "Obstáculos", arlindo: "Casa do Seu Arlindo", truck: "Caminhão do lixo", clothes: "Varal", final: "Descida final" },
      feira: { start: "Largada", descent: "Descida", fruit: "Frutas rolando", market: "Feira", descent2: "Segunda descida", stairs: "Escadaria", plaza: "Praça" },
      antena: { start: "Largada", descent: "Descida", works: "Obra", loop: "Looping", manhole: "Bueiro", final: "Escadarias", plaza: "Praça" },
      test: { start: "Largada", descent: "Descida", rollers: "Ondulações", crest: "Crista", kicker: "Rampinha", bigRamp: "Rampão", obstacles: "Obstáculos", shortcut: "Atalho", finale: "Reta final" },
    },
    split: "Parcial",
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
    finishTitle: "Chegada!",
    newBest: "Novo recorde!",
    show: {
      label: "Show",
      tricks: { lip: "Pulo no ponto", perfect: "Pouso perfeito", rail: "Deslizando", wheelie: "Empinada", nearMiss: "Raspou!", crate: "Caixote quebrado" },
      poses: ["Sem mão!", "De pé!", "Voando!"],
      bank: (mult) => `Sequência ×${mult}`,
      drop: "Perdeu a sequência",
    },
    results: {
      place: (ordinal) => `${ordinal} lugar`,
      show: "Pontos de show",
      showRecord: (points) => `Recorde: ${points}`,
      newShowRecord: "Recorde de show!",
      bestSeq: "Melhor sequência",
      headline: { win: "Você venceu!", close: "Quase!", second: "Dá pra buscar!", third: "Terceiro, mas inteiro!", fourth: "Quarto. Próxima é sua!" },
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
      wonBy: { deco: (s) => `Venceu o Déco por ${s} s!`, lina: (s) => `Venceu a Lina por ${s} s!`, bruno: (s) => `Venceu o Bruno por ${s} s!`, mila: (s) => `Venceu a Mila por ${s} s!` },
      secret: "Anão dourado",
      pigeons: "Pombos",
      pigeonsFound: "Passou liso pelos pombos!",
      behind: { deco: (s) => `Faltaram ${s} s para passar o Déco`, lina: (s) => `Faltaram ${s} s para passar a Lina`, bruno: (s) => `Faltaram ${s} s para passar o Bruno`, mila: (s) => `Faltaram ${s} s para passar a Mila` },
    },
    touch: { crouch: "AGACHAR", jump: "PULAR", restart: "Reiniciar", pause: "Pausar" },
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
    hint: "↓ crouches · SPACE jumps (hold in the air: pose) · ← → spin in the air, wheelie on the ground",
    hintTouch: "Hold CROUCH · tap JUMP (hold in the air: pose) · spin in the air, wheelie on the ground",
    tiers: ["Rolling", "Picking up", "Flying low", "No brakes"],
    kmh: "km/h",
    passed: { deco: "You passed Déco!", lina: "You passed Lina!", bruno: "You passed Bruno!", mila: "You passed Mila!" },
    dusted: "Dust in your face!",
    dustedRival: { deco: "Dust on Déco!", lina: "Dust on Lina!", bruno: "Dust on Bruno!", mila: "Dust on Mila!" },
    kicked: "Crate incoming!",
    bark: "WOOF! WOOF!",
    startled: "HEY, KID!",
    holdIt: "MY ORANGES!",
    cluck: "BAWK!",
    kickedYou: "Hit by a crate!",
    kickedRival: { deco: "Crate hits Déco!", lina: "Crate hits Lina!", bruno: "Crate hits Bruno!", mila: "Crate hits Mila!" },
    zones: { street: "PITANGA STREET", market: "CORNER MARKET", works: "ROADWORKS HILL", final: "FINAL DESCENT" },
    shop: { fruit: "FRUIT", pastel: "PASTRIES", sale: "SALE!", detour: "DETOUR →", works: "WORKS", slow: "SLOW", cheer: "GO, DÉCO!", go: "DOWNHILL DERBY" },
    passedBy: { deco: "Déco passed you!", lina: "Lina passed you!", bruno: "Bruno passed you!", mila: "Mila passed you!" },
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
    croak: "RIBBIT!",
    live: "LIVE",
    secret: "GOLDEN GNOME!",
    chalk: { hold: "HOLD ↓", jump: "JUMP!" },
    beep: "BEEP! BEEP!",
    courses: { arlindo: "Mr. Arlindo's Hill", feira: "Market Day", antena: "Antenna Hill", test: "Test track" },
    sections: {
      arlindo: { start: "Start", descent: "Descent", crests: "Bumps", obstacles: "Obstacles", arlindo: "Mr. Arlindo's house", truck: "Garbage truck", clothes: "Clothesline", final: "Final descent" },
      feira: { start: "Start", descent: "Descent", fruit: "Rolling fruit", market: "Market", descent2: "Second descent", stairs: "Stairway", plaza: "Square" },
      antena: { start: "Start", descent: "Descent", works: "Roadworks", loop: "Loop", manhole: "Manhole", final: "Stairways", plaza: "Square" },
      test: { start: "Start", descent: "Descent", rollers: "Rollers", crest: "Crest", kicker: "Kicker", bigRamp: "Big ramp", obstacles: "Obstacles", shortcut: "Shortcut", finale: "Home stretch" },
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
      loop: "Hold ↓ on the way down to reach the loop with speed",
      loopTouch: "Hold CROUCH on the way down to reach the loop with speed",
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
    finishTitle: "Finish!",
    newBest: "New record!",
    show: {
      label: "Show",
      tricks: { lip: "Popped on the mark", perfect: "Perfect landing", rail: "Grinding", wheelie: "Wheelie", nearMiss: "Close call!", crate: "Busted crate" },
      poses: ["No hands!", "Standing!", "Flying!"],
      bank: (mult) => `Combo ×${mult}`,
      drop: "Combo lost",
    },
    results: {
      show: "Show points",
      showRecord: (points) => `Best: ${points}`,
      newShowRecord: "Show record!",
      bestSeq: "Best combo",
      place: (ordinal) => `${ordinal} place`,
      headline: { win: "You won!", close: "So close!", second: "You can catch them!", third: "Third, but in one piece!", fourth: "Fourth. Next one's yours!" },
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
      wonBy: { deco: (s) => `Beat Déco by ${s} s!`, lina: (s) => `Beat Lina by ${s} s!`, bruno: (s) => `Beat Bruno by ${s} s!`, mila: (s) => `Beat Mila by ${s} s!` },
      secret: "Golden gnome",
      pigeons: "Pigeons",
      pigeonsFound: "Slipped past the pigeons!",
      behind: { deco: (s) => `${s} s short of passing Déco`, lina: (s) => `${s} s short of passing Lina`, bruno: (s) => `${s} s short of passing Bruno`, mila: (s) => `${s} s short of passing Mila` },
    },
    touch: { crouch: "CROUCH", jump: "JUMP", restart: "Restart", pause: "Pause" },
    rivalNames: { deco: "Déco", lina: "Lina", bruno: "Bruno", mila: "Mila" },
    carts: { deco: "Wooden Lightning", lina: "Grandma's Turbo", bruno: "Plan B", mila: "The Tub" },
    youAre: (name) => `${name} (you)`,
    puddle: { slow: "Puddle! Lost speed", boost: "Splash! The tub slid" },
    potholeBounce: "Boing! Bounced off the pothole",
    ghost: "Your best",
  },
});
