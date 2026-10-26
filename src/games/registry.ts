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
      "Déco e Lina construíram uma engenhoca de lançamento com um carrinho de rolimã, uma colher de pau gigante e elástico de calcinha. Mire, lance objetos absurdos pelo bairro e derrube todos os enfeites do jardim do Seu Arlindo antes que a munição acabe.",
    category: "action",
    tags: ["Ação", "Física", "Engenhocas"],
    status: "available",
    accent: "sun",
    cast: ["deco", "lina", "bruno"],
    objective: "Três rodadas no quintal do Seu Arlindo: derrube os enfeites antes de acabar a munição. Bagunça extra vale pontos.",
    controls: [
      { input: "Arrastar (mouse ou dedo)", action: "Puxe para trás e solte para lançar" },
      { input: "← → ou A D", action: "Ajustar o ângulo" },
      { input: "↑ ↓ ou W S", action: "Ajustar a força" },
      { input: "Espaço ou Enter", action: "Lançar" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Puxe", text: "Arraste para trás em qualquer lugar da tela. Quanto mais longe, mais força." },
      { title: "Mire", text: "A linha pontilhada mostra o começo do caminho. É o plano do Bruno." },
      { title: "Bagunce", text: "Cada objeto voa diferente. O pato quica, o pneu derruba, o balão estoura." },
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
      "A Lina transformou a garagem num laboratório de invenções. Em cada fase tem um problema bobo para resolver, como acordar o gato ou ligar a torradeira. Use rampas, molas, ventiladores e esteiras para levar a bolinha até o lugar certo.",
    category: "puzzle",
    tags: ["Puzzle", "Construção", "Física"],
    status: "available",
    accent: "plum",
    cast: ["lina", "bruno"],
    objective: "Use as peças para levar a bolinha até o alvo. Quanto menos peças você usar, mais estrelas ganha.",
    controls: [
      { input: "Arrastar (mouse ou dedo)", action: "Levar uma peça da caixa até a área tracejada" },
      { input: "Tocar numa peça", action: "Mostrar os botões de girar e tirar" },
      { input: "1 a 4", action: "Pegar uma peça da caixa" },
      { input: "Setas", action: "Mover a peça" },
      { input: "R (ou Q)", action: "Girar a peça" },
      { input: "Enter", action: "Soltar a peça no lugar" },
      { input: "Delete ou X", action: "Guardar a peça na caixa" },
      { input: "S", action: "Escolher uma peça já montada" },
      { input: "Espaço", action: "Ligar ou desligar a máquina" },
      { input: "H", action: "Pedir uma dica" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Pegue", text: "Arraste uma peça da caixa, lá embaixo, até a área tracejada." },
      { title: "Ajuste", text: "Gire a peça se precisar. Verde quer dizer que ela cabe ali." },
      { title: "Ligue", text: "Aperte LIGAR e veja a bolinha. Não deu? Mude as peças e tente de novo." },
    ],
    levels: [
      { id: "test", title: "Primeiro teste", goal: "Coloque a rampa e ligue a máquina." },
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
    controlsSummary: "Laboratório de Péssimas Ideias. Números pegam peças, setas movem, R gira, Enter coloca, espaço liga a máquina, H pede dica, Esc pausa.",
    copy: {
      winTitle: "Funcionou!",
      winText: "Mais uma péssima ideia que deu certo.",
      loseTitle: "Não deu...",
      loseText: "Mude as peças e tente de novo.",
    },
  },
  {
    slug: "food-fight",
    title: "Guerra de Lanche",
    tagline: "A cantina virou campo de batalha. Abaixe-se!",
    description:
      "Alguém jogou uma uva e começou a guerra. Ajude o Déco e a Mila a defender a mesa: jogue lanches na turma rival, abaixe quando vier pudim e aguente até o sinal tocar.",
    category: "action",
    tags: ["Ação", "Arcade", "Comida"],
    status: "available",
    accent: "tangerine",
    cast: ["deco", "mila"],
    objective: "Jogue lanches na turma rival e abaixe quando vier pudim. Aguente até o sinal tocar sem gastar os três guardanapos.",
    controls: [
      { input: "Tocar ou clicar num aluno", action: "Jogar um lanche nele" },
      { input: "Segurar ABAIXAR", action: "Abaixar atrás da mesa e pegar mais lanches" },
      { input: "Espaço ou Enter", action: "Jogar no aluno mais perigoso" },
      { input: "1 a 5", action: "Jogar na mesa com esse número" },
      { input: "Seta para baixo ou S (segurar)", action: "Abaixar" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Mire", text: "Toque num aluno da turma rival para jogar um lanche nele." },
      { title: "Abaixe", text: "Viu um pudim vindo? Segure ABAIXAR até ele passar." },
      { title: "Recarregue", text: "Abaixado, a Mila te passa mais lanches. Só não acerte a tia da cantina!" },
    ],
    tips: [
      "Viu um ponto de exclamação? Prepare-se para abaixar.",
      "Abaixado, a Mila te passa mais lanches.",
      "O Grandão precisa levar dois lanches.",
      "A Pimentinha joga rápido. Acerte ela primeiro.",
      "Garoto com bandeja? Espere ele baixar.",
      "Acertar quem vai jogar pudim vale bônus.",
      "Na bagunça, cada acerto vale o dobro.",
      "Acertar a tia da cantina tira pontos.",
    ],
    controlsSummary: "Guerra de Lanche. Espaço joga no aluno mais perigoso, 1 a 5 escolhem a mesa, segure seta para baixo para abaixar, Esc pausa.",
    copy: {
      winTitle: "Sinal!",
      winText: "A mesa resistiu até o fim do recreio.",
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
      { id: "living", title: "Sala de estar", goal: "Use os móveis para se proteger." },
      { id: "yard", title: "Quintal", goal: "A guerra vai lá para fora." },
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
      "Na sala, o sofá segura os travesseiros.",
      "No quintal, a barraca e a árvore servem de escudo.",
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
    tagline: "O recreio foi cancelado. É hora de recuperá-lo!",
    description:
      "Os monitores tomaram conta da escola e proibiram todas as brincadeiras. Pegue a espada de papelão do Bruno, passe pelos corredores e chegue até a direção para trazer o recreio de volta.",
    category: "action",
    tags: ["Ação", "Plataforma", "Aventura"],
    status: "available",
    accent: "sky",
    cast: ["bruno", "deco", "lina"],
    objective: "Passe pelos monitores e chegue à direção. Vença o Inspetor do Silêncio para liberar o recreio.",
    controls: [
      { input: "← → ou A D", action: "Andar" },
      { input: "Espaço, ↑ ou W", action: "Pular (segure para ir mais alto)" },
      { input: "J", action: "Atacar com a espada de papelão" },
      { input: "Botões na tela", action: "Andar, pular e atacar no celular" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Corra", text: "Use as setas para andar e espaço para pular." },
      { title: "Ataque", text: "Aperte J para usar a espada de papelão." },
      { title: "Avance", text: "Passe pelos monitores e chegue à direção." },
    ],
    levels: [
      { id: "corridor", title: "Corredor proibido", goal: "Passe pelos monitores." },
      { id: "yard", title: "Pátio ocupado", goal: "Atravesse o pátio." },
      { id: "office", title: "Caminho da direção", goal: "Vença o Inspetor do Silêncio." },
    ],
    tips: [
      "Viu um ponto de exclamação? O monitor vai atacar.",
      "Pule as ondas do apito. Ou acerte elas com a espada.",
      "O monitor do escudo não se defende pelas costas.",
      "Depois do empurrão, o escudo fica aberto.",
      "Lanche devolve um coração.",
      "Toque o sino para salvar o caminho.",
      "Acerte o Inspetor quando ele ficar tonto, cansado ou com a prancheta presa.",
    ],
    controlsSummary: "Operação: Recreio. Setas andam, espaço pula, J ataca, Esc pausa.",
    copy: {
      winTitle: "Você conseguiu!",
      winText: "O recreio está de volta!",
      loseTitle: "Pego!",
      loseText: "Tenta de novo!",
    },
  },
  {
    slug: "off-air-vacation",
    title: "Férias Fora do Ar",
    tagline: "Um resort esquecido. Férias que nunca acabam.",
    description:
      "O Canal 404 saiu do ar há anos, mas o resort do canal continua funcionando. Ninguém sabe explicar como. Explore a recepção, a piscina, o fliperama, a praia e a floresta, converse com os hóspedes e descubra por que as férias nunca acabam.",
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
    objective: "Explore o resort, ajude os hóspedes e descubra por que tudo continua no ar.",
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
      { title: "Explore", text: "Ande pelo resort. Um brilho avisa que tem algo para ver por perto." },
      { title: "Converse", text: "Chegue perto de alguém e aperte E. Um ! mostra quem pode ajudar agora." },
      { title: "Anote", text: "O diário guarda a missão atual, as descobertas, os pôsteres e o mapa." },
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
