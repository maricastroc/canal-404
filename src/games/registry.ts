export type GameCategory = "action" | "puzzle" | "adventure" | "strategy";

export type GameStatus = "available" | "coming-soon";

export type ControlHint = { input: string; action: string };

export type HowToStep = { title: string; text: string };

export type LevelMeta = { id: string; title: string; goal: string };

export type GameMeta = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: GameCategory;
  tags: string[];
  status: GameStatus;
  accent: "sun" | "mint" | "bubblegum" | "tangerine" | "plum" | "sky";
  cast: ("lina" | "bruno" | "deco" | "mila" | "404")[];
  production?: string;
  controls?: ControlHint[];
  howTo?: HowToStep[];
  objective?: string;
  levels?: LevelMeta[];
  levelWord?: "fase" | "arena";
  guests?: { id: string; name: string; role: string }[];
  tips?: string[];
  controlsSummary?: string;
  resumable?: string;
  copy?: { winTitle: string; winText: string; loseTitle: string; loseText: string };
};

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  action: "Ação",
  puzzle: "Puzzle",
  adventure: "Aventura",
  strategy: "Estratégia",
};

export const GAMES: GameMeta[] = [
  {
    slug: "dead-end-street",
    title: "Rua Sem Saída",
    tagline: "Engenhocas, física e muita confusão no quintal do vizinho.",
    description:
      "Déco e Lina transformaram um carrinho de rolimã numa máquina de lançar objetos. O alvo? Os enfeites do quintal do Seu Arlindo! Acerte os lançamentos, faça a maior bagunça possível e tente bater o recorde antes que a munição acabe.",
    category: "action",
    tags: ["Ação", "Física", "Engenhocas"],
    status: "available",
    accent: "sun",
    cast: ["deco", "lina", "bruno"],
    objective: "Três rodadas no quintal do Seu Arlindo: derrube os enfeites antes de acabar a munição. Bagunça extra vale pontos.",
    controls: [
      { input: "Mouse ou dedo", action: "Arraste e solte" },
      { input: "← → ou A D", action: "Ângulo" },
      { input: "↑ ↓ ou W S", action: "Força" },
      { input: "Espaço ou Enter", action: "Lançar" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Puxe", text: "Arraste para trás para preparar o lançamento. Quanto mais puxar, maior será a força!" },
      { title: "Mire", text: "A linha pontilhada mostra por onde o objeto deve passar. Ajuste a mira antes de soltar!" },
      { title: "Bagunce", text: "Cada objeto causa uma bagunça diferente: o pato quica, o pneu derruba e o balão estoura!" },
    ],
    tips: [
      "Derrubar dois alvos com um lançamento vale bônus.",
      "O pato de borracha quica muito. Use isso a seu favor.",
      "Bagunça também vale ponto. Derrube tudo!",
      "Munição que sobra vira bônus no final.",
      "A linha pontilhada é o plano do Bruno. Confie... um pouco.",
      "O balão d'água empurra tudo que estiver perto quando estoura.",
      "O pneu é pesado: mire na base das pilhas.",
    ],
    controlsSummary: "Rua Sem Saída. Setas ajustam ângulo e força, espaço lança, Esc pausa.",
    copy: {
      winTitle: "Bagunça completa!",
      winText: "O quintal do Seu Arlindo nunca mais será o mesmo.",
      loseTitle: "Acabou a munição!",
      loseText: "Os enfeites do Seu Arlindo sobreviveram. Por enquanto.",
    },
  },
  {
    slug: "bad-ideas-lab",
    title: "Laboratório de Péssimas Ideias",
    tagline: "Monte máquinas malucas para resolver problemas bobos.",
    description:
      "A Lina acha que todo problema se resolve com uma máquina, de preferência a mais complicada possível. Acordar o gato, ligar a torradeira, achar o controle remoto: na garagem dela, tudo vira engenhoca. Monte rampas, molas, ventiladores e esteiras e faça a bolinha chegar lá.",
    category: "puzzle",
    tags: ["Puzzle", "Construção", "Física"],
    status: "available",
    accent: "plum",
    cast: ["lina", "bruno"],
    objective: "Toda grande invenção começa com uma ideia duvidosa. Monte sua máquina, leve a bolinha até o alvo e tente resolver cada desafio usando o mínimo de peças.",
    controls: [
      { input: "Arrastar (mouse ou dedo)", action: "Tirar uma peça da caixa ou mudar uma peça de lugar" },
      { input: "Tocar numa peça", action: "Mostrar os botões de girar e guardar" },
      { input: "1 a 4", action: "Pegar uma peça da caixa" },
      { input: "S", action: "Escolher uma peça já montada" },
      { input: "Setas", action: "Mover a peça" },
      { input: "R ou Q", action: "Girar a peça para um lado ou para o outro" },
      { input: "Enter", action: "Colocar a peça (ou pegar de novo a peça escolhida)" },
      { input: "C", action: "Cancelar: a peça volta para onde estava" },
      { input: "Delete ou X", action: "Guardar a peça na caixa" },
      { input: "Espaço", action: "Ligar ou desligar a máquina" },
      { input: "H", action: "Pedir uma dica" },
      { input: "D", action: "Ouvir a descrição da fase" },
      { input: "O (Shift+O volta)", action: "Ouvir os objetos da fase, um por vez. O último vira referência para a posição da peça" },
      { input: "I", action: "Ouvir onde a peça está e o que tem perto" },
      { input: "L", action: "Ouvir de novo o resultado do último teste" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Monte", text: "Arraste uma peça da caixa até a área tracejada." },
      { title: "Ajuste", text: "Toque na peça para girar ou guardar. Para mudar de lugar, é só arrastar de novo." },
      { title: "Teste", text: "Aperte LIGAR e veja no que dá. Deu errado? Ajuste e tente de novo." },
    ],
    levels: [
      { id: "test", title: "Primeiro teste", goal: "Posicione a rampa no lugar indicado e ligue a máquina." },
      { id: "pixel", title: "Bom dia, Pixel", goal: "Faça a bolinha tocar o sino." },
      { id: "toast", title: "Café da manhã", goal: "Faça a bolinha apertar o botão da torradeira." },
      { id: "juice", title: "Suco de laranja", goal: "Leve a laranja até o espremedor." },
      { id: "remote", title: "Cadê o controle?", goal: "Faça a bolinha apertar o botão do controle." },
      { id: "finale", title: "A pior ideia de todas", goal: "Faça a bolinha tocar o sino atrás do muro." },
    ],
    tips: [
      "Não deu certo? Mude uma peça de lugar e tente de novo.",
      "A mola joga a bolinha para onde ela aponta.",
      "O ventilador empurra a bolinha que passa na frente dele.",
      "A esteira leva a bolinha para onde as setas apontam.",
      "Quanto menos peças, mais estrelas.",
      "Toda grande invenção começou como uma péssima ideia.",
    ],
    controlsSummary:
      "Laboratório de Péssimas Ideias. Números pegam peças da caixa, S escolhe uma peça montada, setas movem um passo, R e Q giram, Enter coloca, C cancela, X guarda na caixa, espaço liga a máquina. H pede dica, D descreve a fase, O passa pelos objetos, I diz onde a peça está, L repete o resultado do último teste, Esc pausa.",
    copy: {
      winTitle: "Teste aprovado!",
      winText: "Mais uma péssima ideia que deu certo.",
      loseTitle: "Não deu...",
      loseText: "Mude as peças e tente de novo.",
    },
  },
  {
    slug: "food-fight",
    title: "Guerra de Lanche",
    tagline: "A guerra de comida começou. E ninguém vai sair limpo!",
    description:
      "Tudo começou com uma uva atravessando a cantina. Agora, Déco e Mila precisam defender a mesa deles da turma rival. Revide com lanches, se esconda dos pudins e aguente firme até o sinal tocar!",
    category: "action",
    tags: ["Ação", "Arcade", "Comida"],
    status: "available",
    accent: "tangerine",
    cast: ["deco", "mila"],
    objective: "A guerra de comida começou! Desvie dos lanches até o sinal tocar. Você tem três guardanapos para aguentar os ataques.",
    controls: [
      { input: "Tocar ou clicar num aluno", action: "Lançar um lanche nele" },
      { input: "Segurar ABAIXAR", action: "Abaixar atrás da mesa e recarregar" },
      { input: "Espaço ou Enter", action: "Lançar no aluno mais perigoso" },
      { input: "1 a 5", action: "Lançar na mesa com esse número" },
      { input: "Seta para baixo ou S (segurar)", action: "Abaixar" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Mire", text: "Toque em um aluno rival para lançar comida nele." },
      { title: "Abaixe", text: "Pudim vindo! Segure ABAIXAR para se proteger atrás da mesa." },
      { title: "Recarregue", text: "Enquanto você estiver abaixado, a Mila repõe seus lanches. Cuidado para não acertar a tia da cantina!" },
    ],
    tips: [
      "Viu um ponto de exclamação? Prepare-se para abaixar.",
      "Abaixado, a Mila te passa mais lanches.",
      "Os grandões de moletom precisam levar dois lanches.",
      "Quem sobe de sorriso aberto joga rápido. Acerte primeiro.",
      "Rival com bandeja? Espere baixar.",
      "Acertar quem vai jogar pudim vale bônus.",
      "Na bagunça, cada acerto vale o dobro.",
      "Acertar a tia da cantina tira pontos.",
      "A merendeira leva os lanches que estiverem na mesa. Quando ela vier, jogue tudo antes!",
    ],
    controlsSummary: "Guerra de Lanche. Espaço lança no aluno mais perigoso, 1 a 5 escolhem a mesa, segure seta para baixo para abaixar e recarregar, Esc pausa.",
    copy: {
      winTitle: "Sinal!",
      winText: "O sinal tocou! A cantina sobreviveu a mais uma guerra de comida.",
      loseTitle: "Melecado!",
      loseText: "Acabaram os guardanapos. Fica pra próxima!",
    },
  },
  {
    slug: "pajama-war",
    title: "Guerra do Pijama",
    tagline: "A festa do pijama virou guerra de travesseiros.",
    description:
      "Lia, Nico e Bia combinaram uma noite tranquila. Durou cinco minutos. Escolha um dos três, desvie dos travesseiros e seja o último de pé.",
    category: "action",
    tags: ["Ação", "Arcade", "Travesseiros"],
    status: "available",
    accent: "bubblegum",
    cast: [],
    guests: [
      { id: "lia", name: "Lia", role: "A veloz" },
      { id: "nico", name: "Nico", role: "O atirador" },
      { id: "bia", name: "Bia", role: "A resistente" },
    ],
    objective: "Escolha um personagem e acerte os outros dois com travesseiros. Último de pé vence!",
    controls: [
      { input: "WASD ou setas", action: "Andar" },
      { input: "Mouse", action: "Mirar" },
      { input: "Clique ou espaço", action: "Jogar travesseiro (segure para continuar jogando)" },
      { input: "Controle e botão na tela", action: "Andar e jogar no celular. A mira é automática." },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Escolha", text: "Lia corre mais, Nico joga mais rápido e Bia recupera energia mais rápido." },
      { title: "Acerte", text: "Mire nos outros dois e jogue travesseiros. Um ! avisa quando alguém vai jogar em você." },
      { title: "Fique de pé", text: "Desvie, recupere energia longe da bagunça e seja o último de pé." },
    ],
    levels: [
      { id: "bedroom", title: "Quarto", goal: "Aprenda a mirar e desviar." },
      { id: "living", title: "Sala de estar", goal: "Use o sofá e as poltronas para ricochetear." },
      { id: "yard", title: "Quintal", goal: "Pegue o travesseirão antes dos outros." },
    ],
    levelWord: "arena",
    tips: [
      "Segure espaço ou o botão do mouse para jogar sem parar.",
      "A Lia é rápida. Fuja, respire e volte.",
      "O Nico joga travesseiros quase sem parar.",
      "A Bia recupera energia mais rápido.",
      "Fique um tempo sem ser atingido para recuperar energia.",
      "Os outros dois também brigam entre si. Aproveite!",
      "Viu um ! em cima de alguém? Ele vai jogar em você. Saia da frente!",
      "Quem acabou de jogar fica sem travesseiro por um instante. É a sua chance.",
      "Sem mouse, o espaço mira sozinho no adversário mais perto.",
      "Depois de um tempo, a guerra esquenta.",
      "Na sala, o sofá e as poltronas rebatem os travesseiros. A mira mostra o caminho.",
      "No quintal, a barraca e a árvore servem de escudo.",
      "O travesseirão do quintal passa por cima de tudo e empurra quem estiver perto.",
    ],
    controlsSummary: "Guerra do Pijama. WASD ou setas andam, o mouse mira, clique ou espaço joga o travesseiro, Esc pausa.",
    copy: {
      winTitle: "Você ganhou!",
      winText: "Último de pé! Mais uma partida?",
      loseTitle: "Fora da guerra!",
      loseText: "Mais uma partida?",
    },
  },
  {
    slug: "operation-recess",
    title: "Operação: Recreio",
    tagline: "Os monitores acabaram com o recreio. Bruno não vai deixar barato!",
    description:
      "Os monitores proibiram as brincadeiras e transformaram a escola numa zona de silêncio. Agora, Bruno precisa atravessar os corredores, enfrentar os monitores com sua espada de papelão e chegar à diretoria para salvar o recreio.",
    category: "action",
    tags: ["Ação", "Plataforma", "Aventura"],
    status: "available",
    accent: "sky",
    cast: ["bruno", "deco", "lina"],
    objective: "Atravesse a escola com a espada de papelão, escape dos monitores e derrote o Inspetor do Silêncio. O recreio depende de você!",
    controls: [
      { input: "← → ou A D", action: "Andar" },
      { input: "Espaço, ↑ ou W", action: "Pular (segure para ir mais alto)" },
      { input: "J", action: "Atacar com a espada de papelão" },
      { input: "Botões na tela", action: "Andar, pular e atacar no celular" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Corra", text: "Poça escorrega e buraco derruba. Na corda, pule quando ela descer. Armário tremeu? Pare ou feche com uma espadada." },
      { title: "Ataque", text: "Aperte J para acertar os monitores. Derrube todos da fase para ganhar a 3ª estrela. A placa de PARE bloqueia de frente: ataque por trás ou quando ele baixar a placa." },
      { title: "Avance", text: "Se a luz do Inspetor parar em você, saia dela. Toque os sinos para salvar o caminho até a diretoria." },
    ],
    levels: [
      { id: "corridor", title: "Corredor proibido", goal: "Cuidado com os armários e com o vigia." },
      { id: "yard", title: "Pátio ocupado", goal: "Pule a corda e desvie dos apitos." },
      { id: "office", title: "Caminho da direção", goal: "Vença o Inspetor do Silêncio." },
    ],
    tips: [
      "Passou correndo? Vale 2 estrelas. A 3ª é de quem derruba todos os monitores.",
      "Apareceu um ! em cima do monitor? Lá vem ataque.",
      "Onda de apito: pule por cima ou corte com a espada.",
      "Apito alto passa por cima. Fique no chão e espere.",
      "A placa de PARE só bloqueia de frente.",
      "Depois do empurrão, o monitor baixa a placa. É a sua vez!",
      "Armário tremeu? Pare antes da porta ou feche com uma espadada.",
      "Quando o vigia baixar o jornal, vire estátua.",
      "Na corda, pule quando ela descer. Tropeçar te joga para trás.",
      "A luz do Inspetor parou em você? Saia antes de ela ficar vermelha.",
      "Prateleira bamba não aguenta ninguém parado.",
      "Lanche devolve um coração. Sino salva o caminho.",
      "Acerte o Inspetor quando ele ficar tonto, cansado ou com a prancheta presa.",
    ],
    controlsSummary: "Operação: Recreio. Setas andam, espaço pula, J ataca, Esc pausa.",
    copy: {
      winTitle: "Recreio liberado!",
      winText: "O Inspetor dançou e o pátio é da criançada de novo!",
      loseTitle: "Pego no flagra!",
      loseText: "Os monitores te levaram pra sala. Bora de novo?",
    },
  },
  {
    slug: "off-air-vacation",
    title: "Férias Fora do Ar",
    tagline: "O canal saiu do ar. Mas, neste resort, as férias continuam.",
    description:
      "O Canal 404 saiu do ar há anos. Mesmo assim, o Resort 404 continua recebendo hóspedes como se nada tivesse acontecido. Explore a praia, a piscina, o fliperama e os cantos mais esquecidos do resort. Converse com os hóspedes, reúna pistas e descubra por que ninguém parece ter ido embora.",
    category: "adventure",
    tags: ["Aventura", "Exploração", "Mistério"],
    status: "available",
    accent: "mint",
    cast: ["deco", "404"],
    guests: [
      { id: "bigodes", name: "Sr. Bigodes", role: "Recepcionista" },
      { id: "marola", name: "Capitão Marola", role: "Salva-vidas" },
      { id: "tilt", name: "Tilt", role: "Fliperama" },
      { id: "marisa", name: "Marisa", role: "Gaivota de férias" },
      { id: "psiu", name: "Psiu", role: "Mora na floresta" },
      { id: "capi", name: "Capivaldo", role: "Barraca de sucos" },
      { id: "clique", name: "Clique", role: "Turista" },
      { id: "cavuca", name: "Dr. Cavuca", role: "Explorador" },
      { id: "placar", name: "Placar", role: "Fliperama" },
    ],
    objective: "Explore cada canto do resort, converse com os hóspedes e siga as pistas de um mistério que ninguém consegue explicar.",
    controls: [
      { input: "WASD ou setas", action: "Andar" },
      { input: "E, espaço ou Enter", action: "Conversar, examinar e pegar" },
      { input: "Clique ou toque", action: "Andar até um lugar ou falar com alguém" },
      { input: "J", action: "Abrir o diário" },
      { input: "M", action: "Abrir o mapa" },
      { input: "Controle e botão na tela", action: "Andar e interagir no celular" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Explore", text: "Percorra o resort e fique de olho nos objetos que brilham. Sempre há algo para descobrir." },
      { title: "Converse", text: "Aproxime-se dos personagens e aperte E para conversar. O símbolo ! indica quem tem algo importante a dizer." },
      { title: "Anote", text: "Consulte o diário para acompanhar sua missão, rever descobertas e encontrar o mapa e os pôsteres." },
    ],
    tips: [
      "Um ! em cima de alguém quer dizer que essa pessoa tem algo para você.",
      "O diário (J) sempre mostra a próxima missão.",
      "No mapa (M), o alvo mostra onde está a missão principal.",
      "Tem um pôster do Canal 404 escondido em cada área.",
      "Três fichas douradas abrem uma surpresa no fliperama.",
      "O quarto 404 está trancado. Quem será que tem a chave?",
      "O controle remoto pausa mais coisas do que você imagina.",
      "Depois do final, volte ao resort. Alguém novo pode aparecer.",
      "O jogo salva sozinho. Pode sair e voltar quando quiser.",
      "O Capivaldo, da barraca de sucos, sempre sabe uma fofoca útil.",
      "Ficar paradinho na floresta deixa certos bichinhos curiosos.",
    ],
    controlsSummary: "Férias Fora do Ar. WASD ou setas andam, E interage, J abre o diário, M abre o mapa, Esc pausa.",
    resumable: "canal404:off-air-vacation:v1",
    copy: {
      winTitle: "Mistério resolvido!",
      winText: "As férias continuam.",
      loseTitle: "Até logo!",
      loseText: "O resort espera por você.",
    },
  },
];

export function getGame(slug: string) {
  return GAMES.find((g) => g.slug === slug);
}

export const PLAYABLE = GAMES.filter((g) => g.status === "available");
