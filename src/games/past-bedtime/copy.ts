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
  legend: { creak: string; marks: string; clock: string; light: string; next: string; dog: string; goal: string; hide: string; cat: string };
  acts: Record<string, string>;
  actLabel: (n: number, name: string) => string;
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
    hidden: string;
    hiddenSafe: string;
    knockSoon: string;
    knocked: string;
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
    knock: string;
    meow: string;
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
      stairs: {
        title: "A escada",
        goal: "Descer e chegar na porta da cozinha.",
        target: "cozinha",
        intro: ["A Vó acordou e anda de um lado pro outro.", "A lanterna só ilumina pra frente. Espere ela virar de costas."],
      },
      pantry: {
        title: "A despensa",
        goal: "Passar pela Vó e sair pela porta da área.",
        target: "área",
        intro: ["Aqui não dá pra seguir a Vó: o corredor é estreito.", "Atrás da cortina, a lanterna não te acha."],
      },
      laundry: {
        title: "A área de serviço",
        goal: "Passar pela Pipoca e chegar na porta.",
        target: "porta",
        intro: ["A Pipoca dorme bem na passagem.", "Ela sempre vai ver de onde veio o barulho."],
      },
      dining: {
        title: "A sala de jantar",
        goal: "Atravessar até a sala de estar.",
        target: "sala",
        intro: ["Aqui não tem tábua solta pra fazer barulho.", "Mas o Pixel derruba alguma coisa de tempos em tempos."],
      },
      sofa: {
        title: "O pai no sofá",
        goal: "Atravessar a sala sem o pai te ver.",
        target: "TV",
        intro: ["Toda vez que o Pixel derruba algo, o pai acorda e olha pra lá.", "Atrás das plantas ele não te vê."],
      },
      living: {
        title: "A sala da TV",
        goal: "Chegar no videocassete.",
        target: "vídeo",
        intro: ["A Pipoca de novo, e o pai cochilando na poltrona.", "A tábua perto dele também acorda o pai."],
      },
      return: {
        title: "A volta",
        goal: "Voltar pro quarto com a fita gravada.",
        target: "quarto",
        intro: ["A Vó subiu e está andando no corredor.", "Tábua só no canto do cuco, e longe da lanterna."],
      },
    },
    moves: "Jogadas",
    par: "Meta",
    starsAt: (turns) => `3 estrelas com ${turns} jogadas`,
    hintsUsed: (n) => (n === 1 ? "1 dica usada" : `${n} dicas usadas`),
    plan: "Plano até agora",
    legendTitle: "Legenda",
    actLabel: (n, name) => (n === 4 ? "Final" : `Ato ${n} · ${name}`),
    acts: { upstairs: "Lá em cima", grandma: "A Vó acordada", pets: "Pipoca e Pixel", back: "A volta" },
    legend: {
      creak: "tábua que range",
      marks: "♪ pode · ! acorda",
      clock: "cuco abafa barulho",
      light: "luz: te veem",
      next: "luz da próxima",
      dog: "Pipoca segue o som",
      hide: "esconderijo",
      cat: "Pixel faz barulho",
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
      hidden: "Escondido. Ninguém me vê aqui.",
      hiddenSafe: "A luz passou e não me viu!",
      knockSoon: "O Pixel vai derrubar algo na próxima jogada.",
      knocked: "O Pixel derrubou alguma coisa!",
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
      knock: "CATAPLOFT!",
      meow: "miau",
      cuckoo: "CUCO!",
      now: "AGORA!",
      creak: "NHÉÉC",
      brunoExcuse: { dad: "Eu… tava com sede?", grandma: "Fui no banheiro, Vó!", pipoca: "Psiu! Pipoca!" },
      brunoWin: { doorway: "Passei!", hallway: "Ufa!", stairs: "Desci!", kitchen: "Passei!", pantry: "Ufa, a cortina!", laundry: "Valeu, Pipoca!", dining: "Valeu, Pixel!", sofa: "Nem viu!", living: "Gravando!", return: "Missão cumprida!" },
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
      stairs: {
        title: "The stairs",
        goal: "Get down to the kitchen door.",
        target: "kitchen",
        intro: ["Grandma is up and walking back and forth.", "The flashlight only points ahead. Wait for her to turn her back."],
      },
      pantry: {
        title: "The pantry",
        goal: "Get past Grandma and out the back door.",
        target: "door",
        intro: ["You can't trail Grandma here: the aisle is too narrow.", "Behind the curtain, the flashlight can't find you."],
      },
      laundry: {
        title: "The laundry room",
        goal: "Get past Pipoca to the door.",
        target: "door",
        intro: ["Pipoca sleeps right in the doorway.", "She always goes to check on a noise."],
      },
      dining: {
        title: "The dining room",
        goal: "Cross over to the living room.",
        target: "living room",
        intro: ["No loose boards to make noise here.", "But Pixel knocks something over every so often."],
      },
      sofa: {
        title: "Dad on the sofa",
        goal: "Cross the room without Dad seeing you.",
        target: "TV",
        intro: ["Every time Pixel knocks something over, Dad wakes up and looks over there.", "Behind the plants he can't see you."],
      },
      living: {
        title: "The TV room",
        goal: "Get to the VCR.",
        target: "VCR",
        intro: ["Pipoca again, and Dad dozing in the armchair.", "The board near him wakes Dad too."],
      },
      return: {
        title: "The way back",
        goal: "Get back to your room with the tape.",
        target: "bedroom",
        intro: ["Grandma came upstairs and is walking the hallway.", "Boards only when the cuckoo sings, and away from the flashlight."],
      },
    },
    moves: "Moves",
    par: "Target",
    starsAt: (turns) => `3 stars in ${turns} moves`,
    hintsUsed: (n) => (n === 1 ? "1 hint used" : `${n} hints used`),
    plan: "Plan so far",
    legendTitle: "Key",
    actLabel: (n, name) => (n === 4 ? "Finale" : `Act ${n} · ${name}`),
    acts: { upstairs: "Upstairs", grandma: "Grandma's up", pets: "Pipoca and Pixel", back: "The way back" },
    legend: {
      creak: "creaky board",
      marks: "♪ safe · ! wakes",
      clock: "cuckoo hides noise",
      light: "light: you're seen",
      next: "light next move",
      dog: "Pipoca follows noise",
      hide: "hiding spot",
      cat: "Pixel makes noise",
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
      hidden: "Hidden. Nobody can see me here.",
      hiddenSafe: "The light went by and missed me!",
      knockSoon: "Pixel knocks something over on the next move.",
      knocked: "Pixel knocked something over!",
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
      knock: "CRASH!",
      meow: "meow",
      cuckoo: "CUCKOO!",
      now: "NOW!",
      creak: "CREEAK",
      brunoExcuse: { dad: "I was… thirsty?", grandma: "Just the bathroom, Grandma!", pipoca: "Shh! Pipoca!" },
      brunoWin: { doorway: "Made it!", hallway: "Phew!", stairs: "Down!", kitchen: "Made it!", pantry: "Phew, that curtain!", laundry: "Thanks, Pipoca!", dining: "Thanks, Pixel!", sofa: "He never saw me!", living: "Recording!", return: "Mission done!" },
      brunoThink: "Think, Bruno, think…",
    },
    replayOk: "Replay identical",
    replayBad: "Replay differs",
  },
});
