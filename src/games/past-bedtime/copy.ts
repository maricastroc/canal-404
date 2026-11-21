import { localized } from "@/i18n/copy";

export type LevelText = { title: string; goal: string; target: string; intro: string[] };

export type NightCopy = {
  notebookTitle: string;
  mission: string;
  level: (n: number, total: number) => string;
  levels: Record<string, LevelText>;
  moves: string;
  par: string;
  starsAt: (turns: number) => string;
  hintsUsed: (n: number) => string;
  plan: string;
  legendTitle: string;
  legend: { creak: string; marks: string; clock: string; light: string; next: string; dog: string; goal: string };
  buttons: { wait: string; undo: string; restart: string; hint: string; next: string; again: string; undoCaught: string };
  keys: string;
  touchKeys: string;
  notes: {
    cuckooNow: string;
    cuckooSoon: string;
    stepNow: string;
    creakCaught: string;
    cuckooIn: (n: number) => string;
    masked: string;
    unheard: string;
    woke: string;
    wokeDog: string;
    stillAwake: (n: number) => string;
    backToSleep: string;
    holdBreath: string;
    grandmaStopped: string;
    grandmaBack: string;
    dogGoing: string;
    dogSniff: string;
    dogBack: string;
    dogHome: string;
    hint: string;
    noHint: string;
    undone: string;
    restarted: string;
    failed: string;
    caught: Record<string, string>;
    undoTip: string;
    won: string;
  };
  wonTitle: string;
  wonMoves: (turns: number, par: number) => string;
  wonPerfect: string;
  wonClose: (extra: number) => string;
  lastLevel: string;
  lines: {
    dadSleep: string[];
    dadWake: string[];
    dadSleepAgain: string[];
    dadCatch: string;
    grandmaWalk: string[];
    grandmaAlert: string;
    grandmaResume: string[];
    grandmaCatch: string;
    dogWake: string;
    dogSniff: string;
    dogCatch: string;
    cuckoo: string;
    now: string;
    creak: string;
    brunoExcuse: Record<string, string>;
    brunoWin: Record<string, string>;
    brunoThink: string;
  };
  replayOk: string;
  replayBad: string;
};

export const NIGHT_COPY = localized<NightCopy>({
  "pt-BR": {
    notebookTitle: "Plano do Bruno",
    mission: "Missão: gravar a Sessão Chiado",
    level: (n, total) => `Parte ${n} de ${total}`,
    levels: {
      doorway: {
        title: "A porta dos pais",
        goal: "Passar pela porta do quarto sem acordar o pai.",
        target: "corredor",
        intro: ["A tábua roxa range e acorda o pai.", "O número no cuco conta as jogadas até ele cantar.", "Quando estiver em 1, pise na tábua: o canto abafa o rangido."],
      },
      hallway: {
        title: "O corredor",
        goal: "Chegar na escada sem acordar o pai.",
        target: "escada",
        intro: ["Agora são várias tábuas.", "Pise nelas só no canto do cuco. Parado em cima não range.", "Tábua longe do pai pode ranger: ele não ouve."],
      },
      kitchen: {
        title: "A cozinha",
        goal: "Atravessar a cozinha até a porta da sala.",
        target: "porta",
        intro: ["A Vó não dorme.", "Ela dá voltas na mesa com a lanterna."],
      },
      living: {
        title: "A sala da TV",
        goal: "Chegar no videocassete.",
        target: "vídeo",
        intro: ["A Pipoca dorme bem na passagem.", "Ela sempre vai ver de onde veio o barulho."],
      },
    },
    moves: "Jogadas",
    par: "Meta",
    starsAt: (turns) => `3 estrelas com ${turns} jogadas`,
    hintsUsed: (n) => (n === 1 ? "1 dica usada" : `${n} dicas usadas`),
    plan: "Plano até agora",
    legendTitle: "Legenda",
    legend: {
      creak: "tábua que range",
      marks: "♪ pode · ! acorda",
      clock: "cuco abafa barulho",
      light: "luz: te veem",
      next: "luz da próxima",
      dog: "Pipoca segue o som",
      goal: "objetivo",
    },
    buttons: { wait: "Esperar", undo: "Desfazer", restart: "Recomeçar", hint: "Dica", next: "Próxima parte", again: "Jogar de novo", undoCaught: "Desfazer a última jogada" },
    keys: "Setas: andar · Espaço: esperar · Z: desfazer · R: recomeçar · H: dica",
    touchKeys: "Deslize ou toque ao lado do Bruno para andar.",
    notes: {
      cuckooNow: "O cuco vai cantar agora!",
      cuckooSoon: "Cuco na próxima jogada.",
      stepNow: "Cuco em 1: pise na tábua agora!",
      creakCaught: "Pisei na tábua fora do canto do cuco.",
      cuckooIn: (n) => `Cuco em ${n} jogadas.`,
      masked: "O cuco abafou o rangido!",
      unheard: "Rangeu… mas ninguém ouviu.",
      woke: "Acordou! Fica longe da luz.",
      wokeDog: "A Pipoca ouviu!",
      stillAwake: (n) => (n === 1 ? "Dorme de novo na próxima jogada." : `Dorme de novo em ${n} jogadas.`),
      backToSleep: "Voltou a dormir. Ufa.",
      holdBreath: "Nem respira…",
      grandmaStopped: "A Vó parou para olhar.",
      grandmaBack: "A Vó voltou para a ronda.",
      dogGoing: "Ela foi ver o barulho. É agora!",
      dogSniff: "Está farejando. Corre!",
      dogBack: "Ela está voltando para a almofada!",
      dogHome: "A Pipoca deitou de novo.",
      hint: "Dica: a seta a lápis mostra a próxima jogada.",
      noHint: "Daqui não tem saída. Melhor desfazer.",
      undone: "Risquei a última jogada.",
      restarted: "Folha nova. Plano novo.",
      failed: "PLANO FALHOU",
      caught: { dad: "O pai me viu.", grandma: "A lanterna da Vó me achou.", pipoca: "A Pipoca me achou e latiu." },
      undoTip: "Desfaça a última jogada e tente outra.",
      won: "Deu certo!",
    },
    wonTitle: "Missão cumprida!",
    wonMoves: (turns, par) => `${turns} jogadas · meta ${par}`,
    wonPerfect: "Plano perfeito.",
    wonClose: (extra) => (extra === 1 ? "Uma jogada a mais que a meta." : `${extra} jogadas a mais que a meta.`),
    lastLevel: "Essa era a última parte do protótipo.",
    lines: {
      dadSleep: ["…mais cinco minutinhos…", "…foi impedimento…", "…tá na garagem…", "…já vou, já vou…"],
      dadWake: ["Hã?!", "Quem tá aí?", "Hmm?"],
      dadSleepAgain: ["…deve ser o gato.", "…é o vento.", "…zzz…"],
      dadCatch: "BRUNO! PRA CAMA!",
      grandmaWalk: ["Chá de camomila…", "Essa casa range toda…", "Ai, minhas costas…"],
      grandmaAlert: "Quem tá aí?",
      grandmaResume: ["Hum. Impressão minha.", "Deve ser rato."],
      grandmaCatch: "BRUNINHO?! Já pra cama!",
      dogWake: "?!",
      dogSniff: "snif snif",
      dogCatch: "AU! AU!",
      cuckoo: "CUCO!",
      now: "AGORA!",
      creak: "NHÉÉC",
      brunoExcuse: { dad: "Eu… tava com sede?", grandma: "Fui no banheiro, Vó!", pipoca: "Psiu! Pipoca!" },
      brunoWin: { doorway: "Passei!", hallway: "Ufa!", kitchen: "Passei!", living: "Gravando!" },
      brunoThink: "Pensa, Bruno, pensa…",
    },
    replayOk: "Reprodução idêntica",
    replayBad: "Reprodução diferente",
  },
  en: {
    notebookTitle: "Bruno's Plan",
    mission: "Mission: tape the Static Show",
    level: (n, total) => `Part ${n} of ${total}`,
    levels: {
      doorway: {
        title: "Past Mom and Dad's door",
        goal: "Get past the bedroom door without waking Dad.",
        target: "hallway",
        intro: ["The purple board creaks and wakes Dad.", "The number on the cuckoo clock counts the moves until it sings.", "When it shows 1, step on the board: the song covers the creak."],
      },
      hallway: {
        title: "The hallway",
        goal: "Reach the stairs without waking Dad.",
        target: "stairs",
        intro: ["Now there are lots of boards.", "Step on them only when the cuckoo sings. Standing still doesn't creak.", "A board far from Dad can creak: he won't hear it."],
      },
      kitchen: {
        title: "The kitchen",
        goal: "Cross the kitchen to the living room door.",
        target: "door",
        intro: ["Grandma doesn't sleep.", "She walks around the table with a flashlight."],
      },
      living: {
        title: "The TV room",
        goal: "Get to the VCR.",
        target: "VCR",
        intro: ["Pipoca sleeps right in the doorway.", "She always goes to check on a noise."],
      },
    },
    moves: "Moves",
    par: "Target",
    starsAt: (turns) => `3 stars in ${turns} moves`,
    hintsUsed: (n) => (n === 1 ? "1 hint used" : `${n} hints used`),
    plan: "Plan so far",
    legendTitle: "Key",
    legend: {
      creak: "creaky board",
      marks: "♪ safe · ! wakes",
      clock: "cuckoo hides noise",
      light: "light: you're seen",
      next: "light next move",
      dog: "Pipoca follows noise",
      goal: "goal",
    },
    buttons: { wait: "Wait", undo: "Undo", restart: "Restart", hint: "Hint", next: "Next part", again: "Play again", undoCaught: "Undo the last move" },
    keys: "Arrows: move · Space: wait · Z: undo · R: restart · H: hint",
    touchKeys: "Swipe, or tap next to Bruno to move.",
    notes: {
      cuckooNow: "The cuckoo sings right now!",
      cuckooSoon: "Cuckoo on the next move.",
      stepNow: "Cuckoo at 1: step on the board now!",
      creakCaught: "I stepped on a board when the cuckoo wasn't singing.",
      cuckooIn: (n) => `Cuckoo in ${n} moves.`,
      masked: "The cuckoo covered the creak!",
      unheard: "It creaked… but nobody heard.",
      woke: "Someone's up! Stay out of the light.",
      wokeDog: "Pipoca heard it!",
      stillAwake: (n) => (n === 1 ? "Back to sleep after the next move." : `Back to sleep in ${n} moves.`),
      backToSleep: "Back to sleep. Phew.",
      holdBreath: "Don't even breathe…",
      grandmaStopped: "Grandma stopped to look.",
      grandmaBack: "Grandma is walking again.",
      dogGoing: "She went to check. Go now!",
      dogSniff: "She's sniffing. Run!",
      dogBack: "She's heading back to her cushion!",
      dogHome: "Pipoca lay down again.",
      hint: "Hint: the pencil arrow shows the next move.",
      noHint: "No way out from here. Better undo.",
      undone: "Crossed out the last move.",
      restarted: "New page. New plan.",
      failed: "PLAN FAILED",
      caught: { dad: "Dad saw me.", grandma: "Grandma's flashlight found me.", pipoca: "Pipoca found me and barked." },
      undoTip: "Undo the last move and try another.",
      won: "It worked!",
    },
    wonTitle: "Mission done!",
    wonMoves: (turns, par) => `${turns} moves · target ${par}`,
    wonPerfect: "Perfect plan.",
    wonClose: (extra) => (extra === 1 ? "One move over the target." : `${extra} moves over the target.`),
    lastLevel: "That was the last part of the prototype.",
    lines: {
      dadSleep: ["…five more minutes…", "…that was offside…", "…it's in the garage…", "…coming, coming…"],
      dadWake: ["Huh?!", "Who's there?", "Hmm?"],
      dadSleepAgain: ["…must be the cat.", "…just the wind.", "…zzz…"],
      dadCatch: "BRUNO! BED. NOW!",
      grandmaWalk: ["Chamomile tea…", "This whole house creaks…", "Oh, my back…"],
      grandmaAlert: "Who's there?",
      grandmaResume: ["Hmm. Just my imagination.", "Must be a mouse."],
      grandmaCatch: "BRUNINHO?! Off to bed!",
      dogWake: "?!",
      dogSniff: "sniff sniff",
      dogCatch: "WOOF! WOOF!",
      cuckoo: "CUCKOO!",
      now: "NOW!",
      creak: "CREEAK",
      brunoExcuse: { dad: "I was… thirsty?", grandma: "Just the bathroom, Grandma!", pipoca: "Shh! Pipoca!" },
      brunoWin: { doorway: "Made it!", hallway: "Phew!", kitchen: "Made it!", living: "Recording!" },
      brunoThink: "Think, Bruno, think…",
    },
    replayOk: "Replay identical",
    replayBad: "Replay differs",
  },
});
