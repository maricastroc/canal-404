import { localized } from "@/i18n/copy";

export type LevelText = { title: string; goal: string; target: string; intro: string[]; story: string };

export type NightCopy = {
  notebookTitle: string;
  mission: string;
  level: (n: number, total: number) => string;
  levels: Record<string, LevelText>;
  moves: string;
  par: string;
  starsAt: (turns: number) => string;
  starsCapped: string;
  hintsUsed: (n: number) => string;
  plan: string;
  speaker: string;
  names: { dad: string; grandma: string; dog: string; cat: string; bruno: string };
  view: { house: string; back: string };
  status: { toss: (n: number) => string; sleepsIn: (n: number) => string; looking: (n: number) => string; sniffing: (n: number) => string; going: string; returning: string; knock: (n: number) => string; look: (n: number) => string; peek: (n: number) => string };
  pages: { rules: string; moves: string; back: string; rulesTitle: string; movesTitle: string; empty: string };
  legendTitle: string;
  legend: { creak: string; marks: string; clock: string; light: string; next: string; dog: string; goal: string; hide: string; cat: string; route: string; toss: string; near: string };
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
    stirred: string;
    tossed: string;
    tossSoon: string;
    peekSoon: string;
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
    hintWait: string;
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
  wonWithHint: string;
  wonClose: (extra: number) => string;
  lastLevel: string;
  lines: {
    dadSleep: string[];
    dadStir: string[];
    dadToss: string[];
    dadWake: string[];
    dadSleepAgain: string[];
    dadCatch: string[];
    grandmaWalk: string[];
    grandmaAlert: string[];
    grandmaResume: string[];
    grandmaPeek: string[];
    grandmaCatch: string[];
    dogWake: string;
    dogStir: string;
    dogSniff: string;
    dogCatch: string[];
    knock: string[];
    meow: string;
    cuckoo: string;
    now: string;
    creak: string;
    brunoExcuse: Record<string, string[]>;
    brunoWin: Record<string, string>;
    brunoThink: string[];
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
        intro: [
          "A tábua roxa range. Range alto.",
          "O número no cuco conta as jogadas até ele cantar.",
          "Não fique parado colado na cama: o pai sente que tem gente.",
          "Cuco em 1? Pisa na tábua: o CUCO! cobre o nhéc.",
        ],
        story: "Primeira porta: a dos meus pais. O pai tem sono de passarinho…",
      },
      hallway: {
        title: "O corredor",
        goal: "Chegar na escada sem acordar o pai.",
        target: "escada",
        intro: [
          "O corredor inteiro é de tábua.",
          "O cuco canta a cada 3 jogadas. Pise nas tábuas só quando ele estiver em 1.",
          "Tábua com ~ está longe do pai: pode ranger que ele não ouve. Tábua com ! acorda.",
          "A plaquinha “vira em…” no pai conta as jogadas até ele virar e espiar o corredor. Não fique na frente da porta nessa hora.",
          "Use Esperar para acertar o ritmo, mas sem enrolar.",
        ],
        story: "Esse corredor range que nem navio velho. E de vez em quando o pai vira na cama…",
      },
      stairs: {
        title: "A escada",
        goal: "Descer e chegar na porta da cozinha.",
        target: "cozinha",
        intro: ["A Vó vai e volta no pé da escada.", "As pegadas amarelas são os próximos passos dela.", "A lanterna só aponta pra frente. Desce quando ela virar de costas."],
        story: "A Vó levantou pra fazer chá. Justo no pé da escada.",
      },
      kitchen: {
        title: "A cozinha",
        goal: "Atravessar a cozinha até a porta da sala.",
        target: "porta",
        intro: [
          "A Vó dá a volta na mesa, mas cada volta é de um jeito.",
          "Numa ela confere o canto da pia, na outra o canto da geladeira.",
          "O olho com a plaquinha “olha em…” mostra onde ela vai olhar e daqui a quantas jogadas.",
        ],
        story: "A Vó tá fazendo ronda na cozinha. E toda volta ela confere um canto diferente.",
      },
      pantry: {
        title: "A despensa",
        goal: "Passar pela Vó e sair pela porta da área.",
        target: "área",
        intro: [
          "Corredor estreito: não dá pra ir atrás dela.",
          "Atrás da cortina a lanterna não te acha…",
          "…a não ser quando ela vem conferir. Olho vermelho = ela vai espiar o esconderijo.",
        ],
        story: "Corredor apertado, Vó vindo… e ela adora conferir a despensa.",
      },
      laundry: {
        title: "A área de serviço",
        goal: "Passar pela Pipoca e chegar na porta.",
        target: "porta",
        intro: ["A Pipoca dorme bem na passagem.", "Barulho? Ela sempre corre pra ver de onde veio.", "Parado do lado dela, ela acorda. Atrai ela pra longe."],
        story: "A Pipoca dormiu na porta. Se me vir, vai querer brincar. Às três da manhã.",
      },
      dining: {
        title: "A sala de jantar",
        goal: "Atravessar até a sala de estar.",
        target: "sala",
        intro: ["Nenhuma tábua solta aqui.", "Mas o Pixel derruba alguma coisa de tempos em tempos: a plaquinha “derruba em…” avisa.", "O segredo é estar no lugar certo quando ele derrubar."],
        story: "Nenhuma tábua pra me ajudar. Mas o Pixel… o Pixel é o caos em forma de gato.",
      },
      sofa: {
        title: "O pai no sofá",
        goal: "Atravessar a sala sem o pai te ver.",
        target: "TV",
        intro: ["Toda vez que o Pixel derruba algo, o pai acorda e olha pra lá.", "Atrás das plantas ele não te vê.", "Ele dorme de novo depois de umas jogadas: a plaquinha “dorme em…” avisa."],
        story: "O pai cochilou no sofá vendo o jogo. E o Pixel está em cima do rack.",
      },
      living: {
        title: "A sala da TV",
        goal: "Chegar no videocassete.",
        target: "vídeo",
        intro: ["Pipoca de novo, e o pai cochilando na poltrona.", "A tábua perto dele acorda o pai também.", "Ele vira de tempos em tempos: fica de olho no “vira em…”."],
        story: "O videocassete está logo ali, piscando 12:00. Só falta a Pipoca sair do caminho.",
      },
      return: {
        title: "A volta",
        goal: "Voltar pro quarto com a fita gravada.",
        target: "quarto",
        intro: [
          "A Vó subiu e vigia o corredor. Em dois pontos ela para e olha pra cima.",
          "O pai continua virando na cama.",
          "Tábua só no CUCO!, longe da lanterna e fora da vista do pai.",
        ],
        story: "Fita gravada! Agora é só voltar pro quarto… com a Vó no corredor. Moleza. Só que não.",
      },
    },
    moves: "Jogadas",
    par: "Meta",
    starsAt: (turns) => `3 estrelas com ${turns} jogadas`,
    starsCapped: "Com dica: no máximo 2 estrelas",
    hintsUsed: (n) => (n === 1 ? "1 dica usada" : `${n} dicas usadas`),
    plan: "Plano até agora",
    speaker: "Bruno",
    names: { dad: "Pai", grandma: "Vó", dog: "Pipoca", cat: "Pixel", bruno: "Bruno" },
    view: { house: "👁 Ver a casa toda (V)", back: "↩ Voltar pro Bruno (V)" },
    status: {
      toss: (n) => (n === 1 ? "vai virar!" : `vira em ${n}`),
      sleepsIn: (n) => `dorme em ${n}`,
      looking: (n) => `olhando · ${n}`,
      sniffing: (n) => `farejando · ${n}`,
      going: "indo ver!",
      returning: "voltando",
      knock: (n) => (n === 1 ? "vai derrubar!" : `derruba em ${n}`),
      look: (n) => (n === 1 ? "vai olhar!" : `olha em ${n}`),
      peek: (n) => (n === 1 ? "vai espiar!" : `espia em ${n}`),
    },
    pages: { rules: "Regras e legenda", moves: "Jogadas", back: "Voltar", rulesTitle: "Como funciona", movesTitle: "Plano até agora", empty: "Nenhuma jogada ainda." },
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
      route: "pegadas: próximos passos da Vó",
      toss: "“vira em N”: o pai espia",
      near: "parado colado: acorda",
    },
    buttons: { wait: "Esperar", undo: "Desfazer", restart: "Recomeçar", hint: "Dica", next: "Próxima parte", again: "Jogar de novo", undoCaught: "Desfazer a última jogada" },
    keys: "Setas: andar · Espaço: esperar · Z: desfazer · R: recomeçar · H: dica · V: ver a casa",
    touchKeys: "Deslize ou toque ao lado do Bruno para andar.",
    notes: {
      cuckooNow: "O cuco vai cantar agora!",
      cuckooSoon: "Cuco na próxima. Prepara o pé.",
      stepNow: "Cuco em 1: é agora, pisa na tábua!",
      creakCaught: "Pisei na tábua sem o cuco cantar. Vacilo.",
      cuckooIn: (n) => `Cuco em ${n} jogadas.`,
      masked: "O cuco cobriu o nhéc!",
      unheard: "Rangeu… e ninguém ouviu. Sorte.",
      woke: "Acordou! Sai da luz, rápido.",
      wokeDog: "A Pipoca ouviu! Lá vem ela.",
      stillAwake: (n) => (n === 1 ? "Dorme de novo na próxima jogada." : `Dorme de novo em ${n} jogadas.`),
      backToSleep: "Dormiu de novo. Ufa.",
      holdBreath: "Colado em quem dorme. Se eu parar aqui, acorda!",
      stirred: "Se mexeu! Mais uma espera aqui e acorda.",
      tossed: "Virou na cama e espiou! Fica fora da vista.",
      tossSoon: "O pai vai virar na próxima jogada.",
      peekSoon: "A Vó vai espiar o esconderijo!",
      grandmaStopped: "A Vó parou pra escutar.",
      grandmaBack: "A Vó seguiu a ronda.",
      dogGoing: "Ela foi atrás do barulho. Vai, vai!",
      dogSniff: "Tá farejando. Corre!",
      dogBack: "Ela está voltando pra almofada!",
      dogHome: "A Pipoca deitou de novo.",
      hidden: "Escondido. Daqui ninguém me vê.",
      hiddenSafe: "A luz passou e não me achou!",
      knockSoon: "O Pixel tá mirando no próximo copo…",
      knocked: "Cataploft! O Pixel derrubou tudo.",
      hint: "Dica: o selo amarelo mostra a próxima jogada. Agora vale no máximo 2 estrelas.",
      hintWait: "Dica: espere uma jogada onde você está. Agora vale no máximo 2 estrelas.",
      noHint: "Daqui não tem saída. Melhor desfazer.",
      undone: "Risquei a última jogada.",
      restarted: "Folha nova, plano novo.",
      failed: "PLANO FALHOU",
      caught: { dad: "O pai acordou e me pegou.", grandma: "A lanterna da Vó me achou.", pipoca: "A Pipoca me achou e fez festa." },
      undoTip: "Desfaça a última jogada e tente outra.",
      won: "Deu certo!",
    },
    wonTitle: "Missão cumprida!",
    wonMoves: (turns, par) => `${turns} jogadas · meta ${par}`,
    wonPerfect: "Plano perfeito.",
    wonWithHint: "Na meta, mas com dica. Sem dica, valia 3 estrelas.",
    wonClose: (extra) => (extra === 1 ? "Uma jogada a mais que a meta." : `${extra} jogadas a mais que a meta.`),
    lastLevel: "Essa era a última parte do protótipo.",
    lines: {
      dadSleep: ["…pênalti… foi pênalti…", "…mais cinco minutinhos, chefe…", "…quem comeu o último pão de queijo…", "…rebobina a fita…", "…zzz… gooool…", "…tá na gaveta, amor…"],
      dadStir: ["…hmm… tem alguém aí?…", "…quem tá respirando no meu ouvido…", "…Bruno?… não… é sonho…"],
      dadToss: ["…hmpf… (vira pro outro lado)", "…cadê meu travesseiro…", "…uhm… que barulhinho…"],
      dadWake: ["Hã?! Quem tá aí?", "Que barulho foi esse?!", "Ei! Ladrão?!"],
      dadSleepAgain: ["…deve ser o Pixel…", "…casa velha… range sozinha…", "…amanhã eu vejo… zzz"],
      dadCatch: ["BRUNO! JÁ PRA CAMA!", "MOCINHO! Sabe que horas são?!"],
      grandmaWalk: ["Chazinho de erva-doce…", "Essa escada me mata…", "Quem deixou essa caneca aqui?", "No meu tempo a TV desligava às dez…"],
      grandmaAlert: ["Opa! Quem tá aí?", "Hein? Escutei um treco…"],
      grandmaResume: ["Hmm. Devem ser meus ouvidos.", "Rato. Amanhã compro ratoeira.", "Esse gato ainda me mata do coração."],
      grandmaPeek: ["E esse esconderijo, hein?", "Será que guardei biscoito aqui?", "Deixa eu dar uma olhadinha…"],
      grandmaCatch: ["BRUNINHO! Que susto, menino!", "Achei! Pra cama, mocinho!"],
      dogWake: "?!",
      dogStir: "fuén?",
      dogSniff: "snif snif",
      dogCatch: ["AU! AU! (quer brincar)", "AU AU AU!"],
      knock: ["CATAPLOFT!", "PLÉC!", "CRÁS!"],
      meow: "miau",
      cuckoo: "CUCO!",
      now: "AGORA!",
      creak: "NHÉÉC",
      brunoExcuse: {
        dad: ["Eu… tava com sede?", "Sonambulismo, pai! Juro!"],
        grandma: ["Vó! Fui no banheiro!", "Vim te dar boa noite, Vó!"],
        pipoca: ["Shhh! Pipoca, não!", "Agora não, Pipoca!"],
      },
      brunoWin: {
        doorway: "Primeira porta: check!",
        hallway: "Valeu, cuco! Te devo uma.",
        stairs: "Degrau por degrau… desci!",
        kitchen: "A Vó nem sonha que eu passei.",
        pantry: "Salvo pela cortina!",
        laundry: "Boa menina, Pipoca. Fica.",
        dining: "Pixel, você é um gênio do caos.",
        sofa: "Nem piscou. Ou piscou?",
        living: "REC piscando. Sessão Chiado, aí vou eu!",
        return: "Fita na mão. Paga a aposta, Déco!",
      },
      brunoThink: ["Pensa, Bruno, pensa…", "Se o Déco me visse agora…", "Calma. Respira. Planeja.", "Qual é o próximo passo?"],
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
        intro: [
          "The purple board creaks. Loudly.",
          "The number on the cuckoo clock counts the moves until it sings.",
          "Don't stand still right next to the bed: Dad can feel someone's there.",
          "Cuckoo at 1? Step on the board: the CUCKOO! covers the creak.",
        ],
        story: "First door: my parents'. Dad sleeps lighter than a bird…",
      },
      hallway: {
        title: "The hallway",
        goal: "Reach the stairs without waking Dad.",
        target: "stairs",
        intro: [
          "The whole hallway is creaky boards.",
          "The cuckoo sings every 3 moves. Step on boards only when it shows 1.",
          "A board marked ~ is far from Dad: it can creak and he won't hear. A board marked ! wakes him.",
          "The “rolls in…” tag on Dad counts the moves until he rolls over and peeks down the hallway. Don't stand in front of the door then.",
          "Use Wait to get the rhythm right, but don't dawdle.",
        ],
        story: "This hallway creaks like an old ship. And every so often Dad rolls over…",
      },
      stairs: {
        title: "The stairs",
        goal: "Get down to the kitchen door.",
        target: "kitchen",
        intro: ["Grandma paces back and forth at the foot of the stairs.", "The yellow footprints are her next steps.", "The flashlight only points ahead. Go down when she turns her back."],
        story: "Grandma got up to make tea. Right at the foot of the stairs.",
      },
      kitchen: {
        title: "The kitchen",
        goal: "Cross the kitchen to the living room door.",
        target: "door",
        intro: [
          "Grandma circles the table, but never the same way twice.",
          "One lap she checks the sink corner, the next the fridge corner.",
          "The eye with the “looks in…” tag shows where she'll look and how many moves from now.",
        ],
        story: "Grandma is doing her rounds in the kitchen. And every lap she checks a different corner.",
      },
      pantry: {
        title: "The pantry",
        goal: "Get past Grandma and out the back door.",
        target: "door",
        intro: [
          "Narrow aisle: you can't trail her here.",
          "Behind the curtain, the flashlight can't find you…",
          "…unless she comes to check. Red eye = she's about to peek at the hiding spot.",
        ],
        story: "Narrow aisle, Grandma coming… and she loves checking the pantry.",
      },
      laundry: {
        title: "The laundry room",
        goal: "Get past Pipoca to the door.",
        target: "door",
        intro: ["Pipoca sleeps right in the doorway.", "A noise? She always runs to see where it came from.", "Stand still next to her and she wakes up. Lure her away."],
        story: "Pipoca fell asleep in the doorway. If she sees me, she'll want to play. At three in the morning.",
      },
      dining: {
        title: "The dining room",
        goal: "Cross over to the living room.",
        target: "living room",
        intro: ["No loose boards here.", "But Pixel knocks something over every so often: the “knocks in…” tag warns you.", "The trick is being in the right spot when he does."],
        story: "No boards to help me here. But Pixel… Pixel is chaos shaped like a cat.",
      },
      sofa: {
        title: "Dad on the sofa",
        goal: "Cross the room without Dad seeing you.",
        target: "TV",
        intro: ["Every time Pixel knocks something over, Dad wakes up and looks over there.", "Behind the plants he can't see you.", "He falls back asleep after a few moves: the “asleep in…” tag tells you."],
        story: "Dad dozed off on the sofa watching the game. And Pixel is up on the TV stand.",
      },
      living: {
        title: "The TV room",
        goal: "Get to the VCR.",
        target: "VCR",
        intro: ["Pipoca again, and Dad dozing in the armchair.", "The board near him wakes Dad too.", "He rolls over every so often: watch the “rolls in…” tag."],
        story: "The VCR is right there, blinking 12:00. Pipoca just needs to get out of the way.",
      },
      return: {
        title: "The way back",
        goal: "Get back to your room with the tape.",
        target: "bedroom",
        intro: [
          "Grandma came upstairs and guards the hallway. At two spots she stops and looks up.",
          "Dad keeps rolling over.",
          "Boards only on the CUCKOO!, away from the flashlight and out of Dad's sight.",
        ],
        story: "Tape recorded! Now just back to my room… with Grandma in the hallway. Easy. Not.",
      },
    },
    moves: "Moves",
    par: "Target",
    starsAt: (turns) => `3 stars in ${turns} moves`,
    starsCapped: "With a hint: 2 stars at most",
    hintsUsed: (n) => (n === 1 ? "1 hint used" : `${n} hints used`),
    plan: "Plan so far",
    speaker: "Bruno",
    names: { dad: "Dad", grandma: "Grandma", dog: "Pipoca", cat: "Pixel", bruno: "Bruno" },
    view: { house: "👁 See the whole house (V)", back: "↩ Back to Bruno (V)" },
    status: {
      toss: (n) => (n === 1 ? "rolling over!" : `rolls in ${n}`),
      sleepsIn: (n) => `asleep in ${n}`,
      looking: (n) => `looking · ${n}`,
      sniffing: (n) => `sniffing · ${n}`,
      going: "checking!",
      returning: "heading back",
      knock: (n) => (n === 1 ? "about to knock!" : `knocks in ${n}`),
      look: (n) => (n === 1 ? "about to look!" : `looks in ${n}`),
      peek: (n) => (n === 1 ? "about to peek!" : `peeks in ${n}`),
    },
    pages: { rules: "Rules and key", moves: "Moves", back: "Back", rulesTitle: "How it works", movesTitle: "Plan so far", empty: "No moves yet." },
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
      route: "footprints: Grandma's next steps",
      toss: "“rolls in N”: Dad peeks",
      near: "standing next to them: wakes",
    },
    buttons: { wait: "Wait", undo: "Undo", restart: "Restart", hint: "Hint", next: "Next part", again: "Play again", undoCaught: "Undo the last move" },
    keys: "Arrows: move · Space: wait · Z: undo · R: restart · H: hint · V: see the house",
    touchKeys: "Swipe, or tap next to Bruno to move.",
    notes: {
      cuckooNow: "The cuckoo sings right now!",
      cuckooSoon: "Cuckoo next move. Get ready.",
      stepNow: "Cuckoo at 1: now, step on the board!",
      creakCaught: "Stepped on a board without the cuckoo. Rookie mistake.",
      cuckooIn: (n) => `Cuckoo in ${n} moves.`,
      masked: "The cuckoo drowned out the creak!",
      unheard: "It creaked… and nobody heard. Lucky.",
      woke: "Someone's up! Out of the light, quick.",
      wokeDog: "Pipoca heard it! Here she comes.",
      stillAwake: (n) => (n === 1 ? "Back to sleep after the next move." : `Back to sleep in ${n} moves.`),
      backToSleep: "Back to sleep. Phew.",
      holdBreath: "Right next to a sleeper. If I stop here, they'll wake!",
      stirred: "They stirred! One more wait here and they're up.",
      tossed: "He rolled over and peeked! Stay out of sight.",
      tossSoon: "Dad rolls over on the next move.",
      peekSoon: "Grandma's about to check the hiding spot!",
      grandmaStopped: "Grandma stopped to listen.",
      grandmaBack: "Grandma is back on her rounds.",
      dogGoing: "She went after the noise. Go, go!",
      dogSniff: "She's sniffing. Run!",
      dogBack: "She's heading back to her cushion!",
      dogHome: "Pipoca lay down again.",
      hidden: "Hidden. Nobody can see me here.",
      hiddenSafe: "The light went by and missed me!",
      knockSoon: "Pixel is eyeing the next cup…",
      knocked: "Crash! Pixel knocked it over.",
      hint: "Hint: the yellow badge shows the next move. Now it's 2 stars at most.",
      hintWait: "Hint: wait one move right where you are. Now it's 2 stars at most.",
      noHint: "No way out from here. Better undo.",
      undone: "Crossed out the last move.",
      restarted: "New page, new plan.",
      failed: "PLAN FAILED",
      caught: { dad: "Dad woke up and caught me.", grandma: "Grandma's flashlight found me.", pipoca: "Pipoca found me and threw a party." },
      undoTip: "Undo the last move and try another.",
      won: "It worked!",
    },
    wonTitle: "Mission done!",
    wonMoves: (turns, par) => `${turns} moves · target ${par}`,
    wonPerfect: "Perfect plan.",
    wonWithHint: "On target, but with a hint. Without one, it was 3 stars.",
    wonClose: (extra) => (extra === 1 ? "One move over the target." : `${extra} moves over the target.`),
    lastLevel: "That was the last part of the prototype.",
    lines: {
      dadSleep: ["…penalty… that was a penalty…", "…five more minutes, boss…", "…who ate the last cheese bread…", "…be kind, rewind…", "…zzz… gooool…", "…it's in the drawer, honey…"],
      dadStir: ["…hmm… someone there?…", "…who's breathing in my ear…", "…Bruno?… nah… just a dream…"],
      dadToss: ["…hmpf… (rolls over)", "…where's my pillow…", "…mm… what's that noise…"],
      dadWake: ["Huh?! Who's there?", "What was that?!", "Hey! A burglar?!"],
      dadSleepAgain: ["…must be Pixel…", "…old house… creaks by itself…", "…I'll check tomorrow… zzz"],
      dadCatch: ["BRUNO! BED. NOW!", "YOUNG MAN! Do you know what time it is?!"],
      grandmaWalk: ["A little fennel tea…", "These stairs will be the end of me…", "Who left this mug here?", "In my day TV went off at ten…"],
      grandmaAlert: ["Oh! Who's there?", "Hm? I heard something…"],
      grandmaResume: ["Hmm. Must be my ears.", "A mouse. I'll buy a trap tomorrow.", "That cat will give me a heart attack."],
      grandmaPeek: ["And what's behind here?", "Did I hide cookies in here?", "Let me take a little peek…"],
      grandmaCatch: ["BRUNINHO! You scared me, boy!", "Gotcha! Off to bed, mister!"],
      dogWake: "?!",
      dogStir: "hm?",
      dogSniff: "sniff sniff",
      dogCatch: ["WOOF! (wants to play)", "WOOF WOOF WOOF!"],
      knock: ["CRASH!", "CLATTER!", "THUNK!"],
      meow: "meow",
      cuckoo: "CUCKOO!",
      now: "NOW!",
      creak: "CREEAK",
      brunoExcuse: {
        dad: ["I was… thirsty?", "Sleepwalking, Dad! I swear!"],
        grandma: ["Grandma! Just the bathroom!", "I came to say good night, Grandma!"],
        pipoca: ["Shhh! Pipoca, no!", "Not now, Pipoca!"],
      },
      brunoWin: {
        doorway: "First door: check!",
        hallway: "Thanks, cuckoo! I owe you one.",
        stairs: "One step at a time… I'm down!",
        kitchen: "Grandma has no idea I got by.",
        pantry: "Saved by the curtain!",
        laundry: "Good girl, Pipoca. Stay.",
        dining: "Pixel, you're a genius of chaos.",
        sofa: "He didn't even blink. Did he?",
        living: "REC is blinking. Static Show, here I come!",
        return: "Tape in hand. Pay up, Déco!",
      },
      brunoThink: ["Think, Bruno, think…", "If Déco could see me now…", "Calm. Breathe. Plan.", "What's the next step?"],
    },
    replayOk: "Replay identical",
    replayBad: "Replay differs",
  },
});
