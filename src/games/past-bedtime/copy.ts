import { localized } from "@/i18n/copy";

export type MarkKind = "wake" | "creak";

export type LevelText = { title: string; goal: string; target: string; intro: string[]; story: string; marks?: Partial<Record<MarkKind, string>> };

export type Sleeper = "dad" | "dog";

export type NoteTag = "rule" | "alert" | "tip";

export type LegendKey = "creak" | "marks" | "clock" | "light" | "next" | "nextAny" | "nose" | "dog" | "goal" | "hide" | "cat" | "route" | "toss" | "near" | "nearSeat" | "nearDog" | "nearBoth";

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
  speaker: string;
  names: { dad: string; grandma: string; dog: string; cat: string; bruno: string };
  view: { house: string; back: string };
  touch: { house: string; back: string; rules: string; plan: string; goal: string };
  status: { toss: (n: number) => string; sleepsIn: (n: number) => string; looking: (n: number) => string; sniffing: (n: number) => string; going: string; returning: string; knock: (n: number) => string; look: (n: number) => string; peek: (n: number) => string };
  pages: { rules: string; moves: string; back: string; rulesTitle: string; movesTitle: string; empty: string };
  legendTitle: string;
  legend: Record<LegendKey, string>;
  tags: Record<NoteTag, string>;
  acts: Record<string, string>;
  actLabel: (n: number, name: string) => string;
  buttons: { wait: string; undo: string; restart: string; hint: string; undoCaught: string };
  notes: {
    cuckooSoon: string;
    stepNow: string;
    creakCaught: string;
    masked: string;
    unheard: (who: Sleeper | null) => string;
    woke: string;
    wokeDog: string;
    stillAwake: (n: number) => string;
    backToSleep: string;
    holdBreath: (who: Sleeper) => string;
    stirred: (who: Sleeper) => string;
    seen: string;
    seenDad: string;
    seenDog: string;
    stripes: string;
    stripesNose: string;
    calm: string;
    clear: string;
    trapped: string;
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
    hiddenNoPeek: string;
    hiddenSafe: string;
    knockSoon: string;
    knocked: string;
    hint: string;
    hintWait: (turns: number) => string;
    noHint: string;
    undone: string;
    restarted: string;
    failed: string;
    caught: Record<string, string>;
    cause: { walked: string; light: string; stirDad: string; stirDog: string; dog: string; peek: string; creak: string; noCuckoo: string };
    undoTip: string;
    won: string;
  };
  wonTitle: string;
  wonMoves: (turns: number, par: number) => string;
  wonPerfect: string;
  wonWithHint: string;
  wonClose: (extra: number) => string;
  lastLevel: string;
  ending: { label: string; night: string; morning: string; deco: string; bruno: string; end: string; tap: string; key: string };
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
    cuckoo: string;
    now: string;
    creak: string;
    brunoExcuse: Record<string, string[]>;
    brunoWin: Record<string, string>;
    brunoThink: string[];
  };
};

export const NIGHT_COPY = localized<NightCopy>({
  "pt-BR": {
    notebookTitle: "Plano do Bruno",
    mission: "Missão: gravar a Sessão Chiado sem ser descoberto",
    level: (n, total) => `Etapa ${n} de ${total}`,
    levels: {
      doorway: {
        title: "A porta dos pais",
        goal: "Chegue ao corredor sem acordar o seu pai.",
        target: "corredor",
        intro: [
          "Cuidado com a tábua solta! Pisar nela faz barulho e pode acordar seu pai.",
          "O número no relógio indica quantas jogadas faltam para o cuco cantar.",
          "Esperar duas vezes perto da cama acorda seu pai. Se você se afastar, a contagem recomeça.",
          "Quando o relógio marcar 1, pise na tábua na próxima jogada. O canto do cuco vai esconder o barulho dos seus passos.",
        ],
        story: "Lá vamos nós… Preciso chegar ao corredor sem acordar meu pai. Ele acorda com qualquer barulhinho!",
      },
      hallway: {
        title: "O corredor",
        goal: "Chegue à escada sem acordar o seu pai.",
        target: "escada",
        intro: [
          "O chão está cheio de tábuas que rangem! Mas o cuco canta a cada 3 jogadas…",
          "A plaquinha “vira em…” mostra quantas jogadas faltam para seu pai se virar e olhar para o corredor.",
          "Precisa acertar o tempo do cuco? Use Esperar para passar uma jogada sem sair do lugar.",
        ],
        marks: {
          wake: "Tábua com ! acorda seu pai. Espere ela virar ♪ para pisar.",
          creak: "Tábua com ~ range, mas daqui seu pai não ouve.",
        },
        story: "Esse corredor range mais que navio velho… E, pra piorar, meu pai vive se virando na cama!",
      },
      stairs: {
        title: "A escada",
        goal: "Desça a escada e chegue à porta da cozinha.",
        target: "cozinha",
        intro: ["A Vó faz a ronda no pé da escada: vai por baixo e volta por cima.", "As pegadas mostram os próximos passos dela.", "A lanterna da Vó só ilumina para a frente. Ao lado dela, você está seguro."],
        story: "A Vó levantou pra fazer chá. Justo no pé da escada.",
      },
      kitchen: {
        title: "A cozinha",
        goal: "Atravesse a cozinha até a porta da sala.",
        target: "porta",
        intro: [
          "A Vó dá voltas na mesa, mas não faz sempre o mesmo caminho.",
          "Numa volta, ela confere o lado esquerdo da cozinha. Na outra, o direito.",
          "O olho com “olha em…” mostra onde e quando a Vó vai olhar.",
        ],
        story: "A Vó tá fazendo ronda na cozinha. E toda volta ela confere um canto diferente.",
      },
      pantry: {
        title: "A despensa",
        goal: "Passe pela Vó e saia pela porta da área.",
        target: "área",
        intro: [
          "O corredor é estreito: não dá para passar pela Vó.",
          "A cortina esconde você da lanterna enquanto ela passa.",
          "Olho vermelho? A Vó vai espiar atrás da cortina. Saia daí!",
        ],
        story: "Corredor apertado, Vó vindo… e ela adora conferir a despensa.",
      },
      laundry: {
        title: "A área de serviço",
        goal: "Passe pela Pipoca e chegue à porta.",
        target: "porta",
        intro: [
          "A Pipoca dorme bem na passagem. Esperar duas vezes perto dela faz ela acordar.",
          "Qualquer barulho faz a Pipoca correr até lá, farejar e voltar para a caminha.",
          "Acordada, ela encontra você se vocês ficarem lado a lado.",
          "Atraia a Pipoca com barulho e passe enquanto ela fareja.",
        ],
        story: "A Pipoca dormiu na porta. Se me vir, vai querer brincar. Às três da manhã.",
      },
      dining: {
        title: "A sala de jantar",
        goal: "Atravesse a sala de jantar até a sala de estar.",
        target: "sala",
        intro: [
          "O Pixel derruba coisas de tempos em tempos: veja o “derruba em…”.",
          "Quando aparecer “vai derrubar!”, um círculo amarelo marca quem vai ouvir.",
          "A Pipoca dorme no caminho, e aqui não há tábuas soltas para atraí-la.",
          "O barulho do Pixel tira a Pipoca do caminho… e traz ela direto até você.",
        ],
        story: "Nenhuma tábua pra me ajudar. Mas o Pixel… o Pixel é o caos em forma de gato.",
      },
      sofa: {
        title: "O pai no sofá",
        goal: "Atravesse a sala sem ser visto pelo seu pai.",
        target: "TV",
        intro: [
          "Quando o Pixel derruba alguma coisa, seu pai acorda e olha para o barulho.",
          "A plaquinha “dorme em…” mostra quantas jogadas faltam para ele dormir de novo.",
          "A planta esconde você, e os móveis fazem sombra.",
        ],
        story: "O pai cochilou no sofá vendo o jogo. E o Pixel está em cima do rack.",
      },
      living: {
        title: "A sala da TV",
        goal: "Chegue ao videocassete.",
        target: "vídeo",
        intro: [
          "A Pipoca dorme no caminho de novo, e seu pai cochila na poltrona.",
          "Só a tábua perto da poltrona acorda seu pai. As outras, só a Pipoca ouve.",
          "De tempos em tempos, seu pai se vira e olha a sala. Fique de olho no “vira em…”.",
          "Atraia a Pipoca com uma tábua longe do pai.",
        ],
        story: "O videocassete está logo ali, piscando 12:00. Só falta a Pipoca sair do caminho.",
      },
      return: {
        title: "A volta",
        goal: "Volte para o quarto com a fita gravada.",
        target: "quarto",
        intro: [
          "A Vó subiu e faz a ronda no corredor. Em dois pontos, ela vira a lanterna para cima.",
          "Seu pai continua se virando na cama de tempos em tempos.",
          "Pise só nas tábuas marcadas com ♪ ou ~ e fique longe da luz.",
        ],
        story: "Fita gravada! Agora é só voltar pro quarto… com a Vó no corredor. Moleza. Só que não.",
      },
    },
    moves: "Jogadas",
    par: "Meta",
    starsAt: (turns) => `Conquiste 3 estrelas em até ${turns} jogadas.`,
    starsCapped: "Com dica: até 2 estrelas",
    hintsUsed: (n) => (n === 1 ? "1 dica usada" : `${n} dicas usadas`),
    speaker: "Bruno",
    names: { dad: "Pai", grandma: "Vó", dog: "Pipoca", cat: "Pixel", bruno: "Bruno" },
    view: { house: "Ver a casa toda (V)", back: "Voltar para o Bruno (V)" },
    touch: { house: "Ver a casa", back: "Voltar ao Bruno", rules: "Regras", plan: "Jogadas", goal: "Objetivo" },
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
    pages: { rules: "Regras e legenda", moves: "Histórico de jogadas", back: "Voltar", rulesTitle: "Como funciona", movesTitle: "Suas jogadas até agora", empty: "Nenhuma jogada ainda." },
    legendTitle: "Legenda",
    actLabel: (n, name) => (n === 4 ? "Final" : `Ato ${n} · ${name}`),
    acts: { upstairs: "Lá em cima", grandma: "A Vó acordada", pets: "Pipoca e Pixel", back: "A volta" },
    legend: {
      creak: "Tábua solta: faz barulho ao pisar",
      marks: "♪ Seguro · ~ Ninguém ouve · ! Alguém vai ouvir",
      clock: "O canto do cuco esconde o barulho",
      light: "Área iluminada: aqui você é visto",
      next: "Área iluminada na próxima jogada",
      nextAny: "Listras: perigo na próxima jogada",
      nose: "Pata: ali a Pipoca encontra você",
      dog: "Pata na tábua: a Pipoca vem ver",
      hide: "Esconderijo",
      cat: "Pixel derruba coisas: barulho",
      goal: "Objetivo",
      route: "Próximos passos da Vó",
      toss: "“vira em N”: o pai se vira e olha",
      near: "Esperar duas vezes perto da cama acorda o pai",
      nearSeat: "Esperar duas vezes perto do pai faz ele acordar",
      nearDog: "Esperar duas vezes perto da Pipoca faz ela acordar",
      nearBoth: "Esperar duas vezes perto de quem dorme acorda o dorminhoco",
    },
    tags: { rule: "REGRA", alert: "ATENÇÃO", tip: "DICA" },
    buttons: { wait: "Esperar", undo: "Desfazer", restart: "Recomeçar", hint: "Dica", undoCaught: "Desfazer a última jogada" },
    notes: {
      cuckooSoon: "Na próxima jogada, o cuco vai cantar!",
      stepNow: "O cuco vai cantar! Pise agora na tábua com ♪ e ninguém vai ouvir.",
      creakCaught: "Ih! Seu pai ouviu o rangido!",
      masked: "O cuco abafou o rangido da tábua!",
      unheard: (who) => (who === "dad" ? "Ufa! Seu pai não ouviu nada." : who === "dog" ? "Ufa! A Pipoca não ouviu nada." : "Rangeu… mas ninguém ouviu. Ufa."),
      woke: "Ih! Seu pai ouviu o barulho! Fique fora da luz.",
      wokeDog: "A Pipoca ouviu! Lá vem ela.",
      stillAwake: (n) => (n === 1 ? "O pai dorme de novo na próxima jogada." : `O pai dorme de novo em ${n} jogadas.`),
      backToSleep: "O pai dormiu de novo. Ufa.",
      holdBreath: (who) => (who === "dog" ? "Cuidado! Se você esperar duas vezes perto da Pipoca, ela acorda." : "Cuidado! Se você esperar duas vezes perto do seu pai, ele acorda."),
      stirred: (who) => (who === "dog" ? "A Pipoca está quase acordando! Saia de perto dela." : "Seu pai está quase acordando! Saia de perto dele."),
      seen: "A lanterna vem pra cá! Preciso sair das listras.",
      seenDad: "O pai vai olhar pra cá! Preciso sair das listras.",
      seenDog: "A Pipoca vem pra cá! Preciso sair do lado dela.",
      stripes: "As listras mostram onde a luz vai alcançar na próxima jogada.",
      stripesNose: "Listras: onde a Pipoca te acha na próxima jogada.",
      calm: "Saí de perto. Aqui posso esperar.",
      clear: "Saí do caminho da luz. Aqui posso esperar.",
      trapped: "Não tem saída! Melhor desfazer.",
      tossed: "Seu pai se virou! Fique fora da luz.",
      tossSoon: "Seu pai vai se virar! Fique fora das listras.",
      peekSoon: "A Vó vai espiar o esconderijo!",
      grandmaStopped: "A Vó ouviu e parou para olhar.",
      grandmaBack: "A Vó voltou à ronda.",
      dogGoing: "A Pipoca foi atrás do barulho. Passe longe dela!",
      dogSniff: "A Pipoca está farejando. É a sua chance!",
      dogBack: "A Pipoca está voltando. Saia da frente!",
      dogHome: "A Pipoca dormiu de novo.",
      hidden: "Escondido. Só me acham se vierem espiar.",
      hiddenNoPeek: "Escondido. Daqui a luz não me pega.",
      hiddenSafe: "A luz passou direto. Funcionou!",
      knockSoon: "O Pixel está de olho no próximo copo…",
      knocked: "Lá se foi mais um copo.",
      hint: "Dica: a próxima jogada está marcada em amarelo.",
      hintWait: (n) => (n === 1 ? "Dica: espere uma jogada aqui." : `Dica: espere ${n} jogadas aqui.`),
      noHint: "Sem saída por aqui. Melhor desfazer.",
      undone: "Risquei a última jogada.",
      restarted: "Folha nova, plano novo.",
      failed: "PLANO FALHOU",
      caught: { dad: "O pai me pegou no flagra.", grandma: "A lanterna da Vó me achou.", pipoca: "A Pipoca me achou e fez festa." },
      cause: {
        walked: "Entrei na luz.",
        light: "Fiquei numa casa listrada.",
        stirDad: "Esperei duas vezes do lado dele.",
        stirDog: "Esperei duas vezes do lado dela.",
        dog: "Fiquei lado a lado com ela.",
        peek: "A Vó espiou o esconderijo.",
        creak: "A Vó ouviu o rangido e virou.",
        noCuckoo: "Pisei sem o canto do cuco.",
      },
      undoTip: "Desfaça e tente outro caminho.",
      won: "Deu certo!",
    },
    wonTitle: "Missão cumprida!",
    wonMoves: (turns, par) => `${turns} jogadas · meta ${par}`,
    wonPerfect: "Plano perfeito.",
    wonWithHint: "Na meta, mas com dica. Sem ela, seriam 3 estrelas.",
    wonClose: (extra) => (extra === 1 ? "Uma jogada a mais que a meta." : `${extra} jogadas a mais que a meta.`),
    lastLevel: "Bruno voltou para a cama. Fim da madrugada!",
    ending: {
      label: "SESSÃO CHIADO",
      night: "3:58. Fita gravada, ninguém acordou.",
      morning: "No recreio, no dia seguinte…",
      deco: "Você gravou MESMO?!",
      bruno: "Inteirinha. Agora paga!",
      end: "Fim da madrugada",
      tap: "Toque para continuar",
      key: "Enter para continuar",
    },
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
  },
  en: {
    notebookTitle: "Bruno's Plan",
    mission: "Mission: tape the Static Show without getting caught",
    level: (n, total) => `Stage ${n} of ${total}`,
    levels: {
      doorway: {
        title: "Mom and Dad's door",
        goal: "Reach the hallway without waking Dad.",
        target: "hallway",
        intro: [
          "Watch out for the creaky board! Stepping on it makes noise and can wake Dad.",
          "The number on the clock shows how many moves until the cuckoo sings.",
          "Waiting twice near the bed wakes Dad. Step away and the count starts over.",
          "When the clock shows 1, step on the board on your next move. The cuckoo's song will cover the sound of your steps.",
        ],
        story: "Here we go… I need to reach the hallway without waking Dad. The tiniest noise wakes him up!",
      },
      hallway: {
        title: "The hallway",
        goal: "Reach the stairs without waking Dad.",
        target: "stairs",
        intro: [
          "The floor is full of creaky boards! But the cuckoo sings every 3 moves…",
          "The “rolls in…” tag shows how many moves until Dad rolls over and looks down the hallway.",
          "Need to match the cuckoo's timing? Use Wait to pass a move without leaving your spot.",
        ],
        marks: {
          wake: "A board with ! wakes Dad. Wait for it to turn ♪ before you step.",
          creak: "A board with ~ creaks, but Dad can't hear it from there.",
        },
        story: "This hallway creaks worse than an old ship… And to top it off, Dad keeps rolling over in bed!",
      },
      stairs: {
        title: "The stairs",
        goal: "Go down the stairs to the kitchen door.",
        target: "kitchen",
        intro: ["Grandma circles the foot of the stairs: out along the bottom, back along the top.", "The footprints show her next steps.", "Grandma's flashlight only points ahead. Beside her, you're safe."],
        story: "Grandma got up to make tea. Right at the foot of the stairs.",
      },
      kitchen: {
        title: "The kitchen",
        goal: "Cross the kitchen to the living room door.",
        target: "door",
        intro: [
          "Grandma circles the table, but not the same way every time.",
          "One lap she checks the left side of the kitchen, the next lap the right.",
          "The eye with “looks in…” shows where and when Grandma will look.",
        ],
        story: "Grandma is doing her rounds in the kitchen. And every lap she checks a different corner.",
      },
      pantry: {
        title: "The pantry",
        goal: "Get past Grandma and out the back door.",
        target: "door",
        intro: [
          "The aisle is narrow: there's no getting past Grandma.",
          "The curtain hides you from the flashlight while she walks by.",
          "Red eye? Grandma will peek behind the curtain. Get out!",
        ],
        story: "Narrow aisle, Grandma coming… and she loves checking the pantry.",
      },
      laundry: {
        title: "The laundry room",
        goal: "Get past Pipoca to the door.",
        target: "door",
        intro: [
          "Pipoca sleeps right in the doorway. Waiting twice near her wakes her up.",
          "Any noise sends Pipoca running over to sniff it out. Then she heads back to her bed.",
          "Once she's awake, she finds you if you end up side by side.",
          "Lure Pipoca away with a noise and slip past while she sniffs.",
        ],
        story: "Pipoca fell asleep in the doorway. If she sees me, she'll want to play. At three in the morning.",
      },
      dining: {
        title: "The dining room",
        goal: "Cross the dining room to the living room.",
        target: "living room",
        intro: [
          "Pixel knocks things over every so often: watch the “knocks in…” tag.",
          "When it says “about to knock!”, a yellow ring marks everyone who'll hear it.",
          "Pipoca is asleep in the way, and there are no creaky boards to lure her.",
          "Pixel's crash moves Pipoca out of the way… and right toward you.",
        ],
        story: "No boards to help me here. But Pixel… Pixel is chaos shaped like a cat.",
      },
      sofa: {
        title: "Dad on the sofa",
        goal: "Cross the room without Dad seeing you.",
        target: "TV",
        intro: [
          "Whenever Pixel knocks something over, Dad wakes up and looks toward the noise.",
          "The “asleep in…” tag shows how many moves until he dozes off again.",
          "The plant hides you, and the furniture casts shadows.",
        ],
        story: "Dad dozed off on the sofa watching the game. And Pixel is up on the TV stand.",
      },
      living: {
        title: "The TV room",
        goal: "Get to the VCR.",
        target: "VCR",
        intro: [
          "Pipoca is asleep in the way again, and Dad is dozing in the armchair.",
          "Only the board by the armchair wakes Dad. The others, only Pipoca hears.",
          "Every so often Dad rolls over and looks across the room. Watch the “rolls in…” tag.",
          "Lure Pipoca with a board far from Dad.",
        ],
        story: "The VCR is right there, blinking 12:00. Pipoca just needs to get out of the way.",
      },
      return: {
        title: "The way back",
        goal: "Get back to your room with the tape.",
        target: "bedroom",
        intro: [
          "Grandma came upstairs and patrols the hallway. At two spots she points the flashlight up.",
          "Dad still rolls over in bed every so often.",
          "Only step on boards marked ♪ or ~, and stay out of the light.",
        ],
        story: "Tape recorded! Now just back to my room… with Grandma in the hallway. Easy. Not.",
      },
    },
    moves: "Moves",
    par: "Target",
    starsAt: (turns) => `Earn 3 stars in ${turns} moves or fewer.`,
    starsCapped: "With a hint: 2 stars at most",
    hintsUsed: (n) => (n === 1 ? "1 hint used" : `${n} hints used`),
    speaker: "Bruno",
    names: { dad: "Dad", grandma: "Grandma", dog: "Pipoca", cat: "Pixel", bruno: "Bruno" },
    view: { house: "See the whole house (V)", back: "Back to Bruno (V)" },
    touch: { house: "See the house", back: "Back to Bruno", rules: "Rules", plan: "Moves", goal: "Goal" },
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
    pages: { rules: "Rules and key", moves: "Move history", back: "Back", rulesTitle: "How it works", movesTitle: "Your moves so far", empty: "No moves yet." },
    legendTitle: "Key",
    actLabel: (n, name) => (n === 4 ? "Finale" : `Act ${n} · ${name}`),
    acts: { upstairs: "Upstairs", grandma: "Grandma's up", pets: "Pipoca and Pixel", back: "The way back" },
    legend: {
      creak: "Creaky board: noisy to step on",
      marks: "♪ Safe · ~ Nobody hears · ! Someone will hear",
      clock: "The cuckoo's song covers the noise",
      light: "Lit area: you'll be seen here",
      next: "Lit area on the next move",
      nextAny: "Stripes: danger on the next move",
      nose: "Paw: Pipoca finds you here",
      dog: "Paw on a board: Pipoca comes to check",
      hide: "Hiding spot",
      cat: "Pixel knocks things over: noise",
      goal: "Goal",
      route: "Grandma's next steps",
      toss: "“rolls in N”: Dad turns and looks",
      near: "Waiting twice near the bed wakes Dad",
      nearSeat: "Waiting twice near Dad wakes him up",
      nearDog: "Waiting twice near Pipoca wakes her up",
      nearBoth: "Waiting twice near a sleeper wakes them up",
    },
    tags: { rule: "RULE", alert: "WATCH OUT", tip: "TIP" },
    buttons: { wait: "Wait", undo: "Undo", restart: "Restart", hint: "Hint", undoCaught: "Undo the last move" },
    notes: {
      cuckooSoon: "The cuckoo sings on the next move!",
      stepNow: "The cuckoo's about to sing! Step on the ♪ board now and nobody will hear.",
      creakCaught: "Uh-oh! Dad heard the creak!",
      masked: "The cuckoo drowned out the creak!",
      unheard: (who) => (who === "dad" ? "Phew! Dad didn't hear a thing." : who === "dog" ? "Phew! Pipoca didn't hear a thing." : "It creaked… but nobody heard. Phew."),
      woke: "Uh-oh! Dad heard that! Stay out of the light.",
      wokeDog: "Pipoca heard it! Here she comes.",
      stillAwake: (n) => (n === 1 ? "Dad dozes off again after the next move." : `Dad dozes off again in ${n} moves.`),
      backToSleep: "Dad's asleep again. Phew.",
      holdBreath: (who) => (who === "dog" ? "Careful! Wait twice near Pipoca and she wakes up." : "Careful! Wait twice near Dad and he wakes up."),
      stirred: (who) => (who === "dog" ? "Pipoca's about to wake up! Get away from her." : "Dad's about to wake up! Get away from him."),
      seen: "The flashlight's coming this way! I need to get off the stripes.",
      seenDad: "Dad's about to look this way! I need to get off the stripes.",
      seenDog: "Pipoca's coming over here! I need to get away from her.",
      stripes: "The stripes show where the light will reach on the next move.",
      stripesNose: "Stripes: where Pipoca finds you next move.",
      calm: "Stepped away. I can wait here.",
      clear: "Out of the light's way. I can wait here.",
      trapped: "No way out! Better undo.",
      tossed: "Dad rolled over! Stay out of the light.",
      tossSoon: "Dad's about to roll over! Stay off the stripes.",
      peekSoon: "Grandma's about to peek into the hiding spot!",
      grandmaStopped: "Grandma heard it and stopped to look.",
      grandmaBack: "Grandma's back on her rounds.",
      dogGoing: "Pipoca's off after the noise. Keep clear of her!",
      dogSniff: "Pipoca's busy sniffing. Now's your chance!",
      dogBack: "Pipoca's heading back. Out of her way!",
      dogHome: "Pipoca's asleep again.",
      hidden: "Hidden. They'd have to peek to find me.",
      hiddenNoPeek: "Hidden. The light can't get me here.",
      hiddenSafe: "The light went right past me. It worked!",
      knockSoon: "Pixel is eyeing the next cup…",
      knocked: "And there goes another cup.",
      hint: "Hint: the next move is marked in yellow.",
      hintWait: (n) => (n === 1 ? "Hint: wait one move right here." : `Hint: wait ${n} moves right here.`),
      noHint: "No way out from here. Better undo.",
      undone: "Crossed out the last move.",
      restarted: "New page, new plan.",
      failed: "PLAN FAILED",
      caught: { dad: "Dad caught me red-handed.", grandma: "Grandma's flashlight found me.", pipoca: "Pipoca found me. Party time." },
      cause: {
        walked: "I walked into the light.",
        light: "I stayed on a striped tile.",
        stirDad: "I waited twice right next to him.",
        stirDog: "I waited twice right next to her.",
        dog: "I ended up right next to her.",
        peek: "Grandma peeked into the hiding spot.",
        creak: "Grandma heard the creak and turned.",
        noCuckoo: "I stepped without the cuckoo's song.",
      },
      undoTip: "Undo and try another way.",
      won: "It worked!",
    },
    wonTitle: "Mission done!",
    wonMoves: (turns, par) => `${turns} moves · target ${par}`,
    wonPerfect: "Perfect plan.",
    wonWithHint: "On target, but with a hint. Without it, 3 stars.",
    wonClose: (extra) => (extra === 1 ? "One move over the target." : `${extra} moves over the target.`),
    lastLevel: "Bruno made it back to bed. Night over!",
    ending: {
      label: "STATIC SHOW",
      night: "3:58. Taped it. Nobody woke up.",
      morning: "At recess the next day…",
      deco: "You ACTUALLY taped it?!",
      bruno: "Every second. Now pay up!",
      end: "Night over",
      tap: "Tap to continue",
      key: "Press Enter to continue",
    },
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
  },
});
