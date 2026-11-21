import type { Locale } from "@/i18n/locales";

export type GameCategory = "action" | "puzzle" | "adventure" | "strategy";

export type GameStatus = "available" | "coming-soon";

export type ControlHint = { input: string; action: string; on?: "keys" | "touch" };

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
  howToIntro?: string;
  levels?: LevelMeta[];
  levelWord?: "fase" | "arena" | "pista";
  guests?: { id: string; name: string; role: string }[];
  tips?: string[];
  keyTips?: string[];
  touchTips?: string[];
  controlsSummary?: string;
  resumable?: string;
  orientation?: "upright" | "any";
  copy?: { winTitle: string; winText: string; loseTitle: string; loseText: string };
};

type GameBase = Pick<GameMeta, "category" | "status" | "accent" | "cast" | "levelWord" | "resumable" | "orientation"> & { levelIds?: string[]; guestIds?: string[] };

type GameText = Pick<GameMeta, "title" | "tagline" | "description" | "tags" | "production" | "objective" | "howToIntro" | "controls" | "howTo" | "tips" | "keyTips" | "touchTips" | "controlsSummary" | "copy"> & {
  levels?: { title: string; goal: string }[];
  guests?: { name: string; role: string }[];
};

const BASE = {
  "dead-end-street": {
    category: "action",
    status: "available",
    accent: "sun",
    cast: ["deco", "lina", "bruno"],
    levelIds: ["warm-up", "sharp-aim", "up-high", "domino", "surprise-bath", "blocked-path", "counterattack", "free-for-all", "grand-mess"],
  },
  "bad-ideas-lab": { category: "puzzle", status: "available", accent: "plum", cast: ["lina", "bruno"], levelIds: ["test", "pixel", "toast", "juice", "remote", "finale"] },
  "food-fight": { category: "action", status: "available", accent: "tangerine", cast: ["deco", "mila"], orientation: "upright" },
  "pajama-war": { category: "action", status: "available", accent: "bubblegum", cast: [], levelIds: ["bedroom", "living", "yard"], levelWord: "arena", guestIds: ["lia", "nico", "bia"], orientation: "any" },
  "operation-recess": { category: "action", status: "available", accent: "sky", cast: ["bruno", "deco", "lina"], levelIds: ["corridor", "yard", "office"], orientation: "any" },
  "off-air-vacation": { category: "adventure", status: "available", accent: "mint", cast: ["deco", "404"], guestIds: ["bigodes", "marola", "tilt", "marisa", "psiu", "capi", "clique", "cavuca", "placar"], resumable: "canal404:off-air-vacation:v1" },
  "downhill-derby": { category: "action", status: "available", accent: "tangerine", cast: ["deco", "lina", "bruno", "mila"], levelIds: ["arlindo", "feira", "antena"], levelWord: "pista" },
} satisfies Record<string, GameBase>;

type Slug = keyof typeof BASE;

function gameText<T extends Record<Slug, GameText>>(text: { "pt-BR": T; en: NoInfer<T> }): Record<Locale, Record<Slug, GameText>> {
  return text;
}

export const CATEGORY_LABELS: Record<Locale, Record<GameCategory, string>> = {
  "pt-BR": { action: "Ação", puzzle: "Puzzle", adventure: "Aventura", strategy: "Estratégia" },
  en: { action: "Action", puzzle: "Puzzle", adventure: "Adventure", strategy: "Strategy" },
};

const TEXT = gameText({
  "pt-BR": {
    "dead-end-street": {
      title: "Rua Sem Saída",
      tagline: "Engenhocas, física e muita confusão no quintal do vizinho.",
      description: "Déco e Lina transformaram um carrinho de rolimã numa máquina de lançar objetos. O alvo? Os enfeites do quintal do Seu Arlindo! Acerte os lançamentos, faça a maior bagunça possível e tente bater o recorde antes que a munição acabe.",
      tags: ["Ação", "Física", "Engenhocas"],
      objective: "Nove fases no quintal do Seu Arlindo, em três atos. Escolha a munição, observe o quintal e use caixas, baldes, cordas e as engenhocas do vizinho a seu favor.",
      levels: [
        { title: "Aquecimento", goal: "Derrube o gnomo e o flamingo." },
        { title: "Mira fina", goal: "Ache um caminho até o gnomo dourado e a caixa de correio." },
        { title: "Lá no alto", goal: "Torre de caixas, poste e a casinha no galho." },
        { title: "Efeito dominó", goal: "O gnomo está na garagem. Comece pelos tijolos." },
        { title: "Banho de surpresa", goal: "Molhe os três gnomos que tomam sol." },
        { title: "Caminho bloqueado", goal: "Leve a bola de boliche até o gnomo dourado." },
        { title: "Arlindo contra-ataca", goal: "Soprador e portão novos. Observe antes de lançar." },
        { title: "Confusão geral", goal: "Tudo está ligado. Planeje a ordem." },
        { title: "Bagunça completa", goal: "Derrube o Gnomão do Seu Arlindo." },
      ],
      controls: [
        { input: "Mouse ou dedo", action: "Arraste e solte" },
        { input: "← → ou A D", action: "Ângulo" },
        { input: "↑ ↓ ou W S", action: "Força" },
        { input: "1 a 4, Q ou toque na munição", action: "Trocar a munição" },
        { input: "Espaço ou Enter", action: "Lançar" },
        { input: "Esc ou P", action: "Pausar" },
      ],
      howTo: [
        { title: "Escolha", text: "Cada munição faz uma coisa: o tênis para onde cai, o balão molha e empurra, o pneu é pesado e o pato quica." },
        { title: "Observe", text: "Nem sempre o tiro direto resolve. Cordas, baldes, tijolos e torneiras podem fazer o trabalho por você." },
        { title: "Economize", text: "Menos lançamentos valem mais estrelas. Dá para repetir cada fase e tentar um jeito melhor." },
      ],
      tips: [
        "Corda esticada? Qualquer coisa que passe por ela corta.",
        "O soprador do Seu Arlindo devolve o que é leve. O tênis e o pneu passam.",
        "O portão do Seu Arlindo vira a cada lançamento. Espere a hora certa.",
        "Gnomo tomando sol só se molha com água: balão, balde ou mangueira.",
        "Derrubar dois alvos com um lançamento vale bônus.",
        "Munição que sobra vira bônus no final.",
        "A linha pontilhada é o plano do Bruno. Confie... um pouco.",
      ],
      controlsSummary: "Rua Sem Saída. Setas ajustam ângulo e força, 1 a 4 trocam a munição, espaço lança, Esc pausa.",
      copy: {
        winTitle: "Fase completa!",
        winText: "O quintal do Seu Arlindo está cada vez mais bagunçado.",
        loseTitle: "Acabou a munição!",
        loseText: "Os enfeites do Seu Arlindo sobreviveram. Por enquanto.",
      },
    },
    "bad-ideas-lab": {
      title: "Laboratório de Péssimas Ideias",
      tagline: "Monte máquinas malucas para resolver problemas bobos.",
      description: "A Lina acha que todo problema se resolve com uma máquina, de preferência a mais complicada possível. Acordar o gato, ligar a torradeira, achar o controle remoto: na garagem dela, tudo vira engenhoca. Monte rampas, molas, ventiladores e esteiras e faça a bolinha chegar lá.",
      tags: ["Puzzle", "Construção", "Física"],
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
        { title: "Primeiro teste", goal: "Posicione a rampa no lugar indicado e ligue a máquina." },
        { title: "Bom dia, Pixel", goal: "Faça a bolinha tocar o sino." },
        { title: "Café da manhã", goal: "Faça a bolinha apertar o botão da torradeira." },
        { title: "Suco de laranja", goal: "Leve a laranja até o espremedor." },
        { title: "Cadê o controle?", goal: "Faça a bolinha apertar o botão do controle." },
        { title: "A pior ideia de todas", goal: "Faça a bolinha tocar o sino atrás do muro." },
      ],
      tips: [
        "Não deu certo? Mude uma peça de lugar e tente de novo.",
        "A mola joga a bolinha para onde ela aponta.",
        "O ventilador empurra a bolinha que passa na frente dele.",
        "A esteira leva a bolinha para onde as setas apontam.",
        "Quanto menos peças, mais estrelas.",
        "Toda grande invenção começou como uma péssima ideia.",
      ],
      controlsSummary: "Laboratório de Péssimas Ideias. Números pegam peças da caixa, S escolhe uma peça montada, setas movem um passo, R e Q giram, Enter coloca, C cancela, X guarda na caixa, espaço liga a máquina. H pede dica, D descreve a fase, O passa pelos objetos, I diz onde a peça está, L repete o resultado do último teste, Esc pausa.",
      copy: {
        winTitle: "Teste aprovado!",
        winText: "Mais uma péssima ideia que deu certo.",
        loseTitle: "Não deu...",
        loseText: "Mude as peças e tente de novo.",
      },
    },
    "food-fight": {
      title: "Guerra de Lanche",
      tagline: "A guerra de comida começou. E ninguém vai sair limpo!",
      description: "Tudo começou com uma uva atravessando a cantina. Agora, Déco e Mila precisam defender a mesa deles da turma rival. Revide com lanches, se esconda dos pudins e aguente firme até o sinal tocar!",
      tags: ["Ação", "Arcade", "Comida"],
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
    "pajama-war": {
      title: "Guerra do Pijama",
      tagline: "A festa do pijama virou guerra de travesseiros.",
      description: "Lia, Nico e Bia combinaram uma noite tranquila. Durou cinco minutos. Escolha um dos três, desvie dos travesseiros e seja o último de pé.",
      tags: ["Ação", "Arcade", "Travesseiros"],
      objective: "Escolha um personagem e acerte os outros dois com travesseiros. Último de pé vence!",
      controls: [
        { input: "WASD ou setas", action: "Andar", on: "keys" },
        { input: "Mouse", action: "Mirar", on: "keys" },
        { input: "Clique ou espaço", action: "Jogar travesseiro (segure para continuar jogando)", on: "keys" },
        { input: "Esc ou P", action: "Pausar", on: "keys" },
        { input: "Controle na tela, à esquerda", action: "Arraste o polegar para andar", on: "touch" },
        { input: "Botão JOGAR, à direita", action: "Toque para jogar no adversário mais perto, na direção em que você anda. Segure para continuar jogando.", on: "touch" },
        { input: "Arrastar do lado direito", action: "Mira para onde você arrastar. Solte para jogar. Dá para fugir e jogar para trás.", on: "touch" },
      ],
      howTo: [
        { title: "Escolha", text: "Lia corre mais, Nico joga mais rápido e Bia recupera energia mais rápido." },
        { title: "Acerte", text: "Mire nos outros dois e jogue travesseiros. Um ! avisa quando alguém vai jogar em você." },
        { title: "Fique de pé", text: "Desvie, recupere energia longe da bagunça e seja o último de pé." },
      ],
      levels: [
        { title: "Quarto", goal: "Aprenda a mirar e desviar." },
        { title: "Sala de estar", goal: "Use o sofá e as poltronas para ricochetear." },
        { title: "Quintal", goal: "Pegue o travesseirão antes dos outros." },
      ],
      guests: [
        { name: "Lia", role: "A veloz" },
        { name: "Nico", role: "O atirador" },
        { name: "Bia", role: "A resistente" },
      ],
      tips: [
        "A Lia é rápida. Fuja, respire e volte.",
        "O Nico joga travesseiros quase sem parar.",
        "A Bia recupera energia mais rápido.",
        "Fique um tempo sem ser atingido para recuperar energia.",
        "Os outros dois também brigam entre si. Aproveite!",
        "Viu um ! em cima de alguém? Ele vai jogar em você. Saia da frente!",
        "Quem acabou de jogar fica sem travesseiro por um instante. É a sua chance.",
        "Depois de um tempo, a guerra esquenta.",
        "Na sala, o sofá e as poltronas rebatem os travesseiros. A mira mostra o caminho.",
        "No quintal, a barraca e a árvore servem de escudo.",
        "O travesseirão do quintal passa por cima de tudo e empurra quem estiver perto.",
      ],
      keyTips: ["Segure espaço ou o botão do mouse para jogar sem parar.", "Sem mouse, o espaço mira sozinho no adversário mais perto."],
      touchTips: [
        "Segure o botão JOGAR para jogar sem parar.",
        "Fugindo de alguém? Arraste o polegar direito na direção dele e solte para jogar para trás.",
        "Alguém sumiu da tela? Uma setinha na borda mostra onde está.",
      ],
      controlsSummary: "Guerra do Pijama. WASD ou setas andam, o mouse mira, clique ou espaço joga o travesseiro, Esc pausa.",
      copy: {
        winTitle: "Você ganhou!",
        winText: "Último de pé! Mais uma partida?",
        loseTitle: "Fora da guerra!",
        loseText: "Mais uma partida?",
      },
    },
    "operation-recess": {
      title: "Operação: Recreio",
      tagline: "Os monitores acabaram com o recreio. Bruno não vai deixar barato!",
      description: "Os monitores proibiram as brincadeiras e transformaram a escola numa zona de silêncio. Agora, Bruno precisa atravessar os corredores, enfrentar os monitores com sua espada de papelão e chegar à diretoria para salvar o recreio.",
      tags: ["Ação", "Plataforma", "Aventura"],
      objective: "Atravesse a escola com a espada de papelão, escape dos monitores e derrote o Inspetor do Silêncio. O recreio depende de você!",
      controls: [
        { input: "← → ou A D", action: "Andar", on: "keys" },
        { input: "Espaço, ↑ ou W", action: "Pular (segure para ir mais alto)", on: "keys" },
        { input: "J", action: "Atacar com a espada de papelão", on: "keys" },
        { input: "Esc ou P", action: "Pausar", on: "keys" },
        { input: "Setas, embaixo à esquerda", action: "Andar. Deslize o dedo de uma seta para a outra para virar.", on: "touch" },
        { input: "Botão amarelo", action: "Pular. Segure para ir mais alto.", on: "touch" },
        { input: "Botão rosa", action: "Atacar com a espada de papelão", on: "touch" },
      ],
      howTo: [
        { title: "Corra", text: "Poça escorrega e buraco derruba. Na corda, pule quando ela descer. Armário tremeu? Pare ou feche com uma espadada." },
        { title: "Ataque", text: "Use a espada para acertar os monitores. Derrube todos da fase para ganhar a 3ª estrela. A placa de PARE bloqueia de frente: ataque por trás ou quando ele baixar a placa." },
        { title: "Avance", text: "Se a luz do Inspetor parar em você, saia dela. Toque os sinos para salvar o caminho até a diretoria." },
      ],
      levels: [
        { title: "Corredor proibido", goal: "Cuidado com os armários e com o vigia." },
        { title: "Pátio ocupado", goal: "Pule a corda e desvie dos apitos." },
        { title: "Caminho da direção", goal: "Vença o Inspetor do Silêncio." },
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
      touchTips: ["Segure a seta e toque no pulo ao mesmo tempo para pular correndo.", "Deslize o polegar entre as setas para virar sem soltar."],
      controlsSummary: "Operação: Recreio. Setas andam, espaço pula, J ataca, Esc pausa.",
      copy: {
        winTitle: "Recreio liberado!",
        winText: "O Inspetor dançou e o pátio é da criançada de novo!",
        loseTitle: "Pego no flagra!",
        loseText: "Os monitores te levaram pra sala. Bora de novo?",
      },
    },
    "off-air-vacation": {
      title: "Férias Fora do Ar",
      tagline: "O canal saiu do ar. Mas, neste resort, as férias continuam.",
      description: "O Canal 404 saiu do ar há anos. Mesmo assim, o Resort 404 continua recebendo hóspedes como se nada tivesse acontecido. Explore a praia, a piscina, o fliperama e os cantos mais esquecidos do resort. Converse com os hóspedes, reúna pistas e descubra por que ninguém parece ter ido embora.",
      tags: ["Aventura", "Exploração", "Mistério"],
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
      guests: [
        { name: "Sr. Bigodes", role: "Recepcionista" },
        { name: "Capitão Marola", role: "Salva-vidas" },
        { name: "Tilt", role: "Fliperama" },
        { name: "Marisa", role: "Gaivota de férias" },
        { name: "Psiu", role: "Mora na floresta" },
        { name: "Capivaldo", role: "Barraca de sucos" },
        { name: "Clique", role: "Turista" },
        { name: "Dr. Cavuca", role: "Explorador" },
        { name: "Placar", role: "Fliperama" },
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
      copy: {
        winTitle: "Mistério resolvido!",
        winText: "As férias continuam.",
        loseTitle: "Até logo!",
        loseText: "O resort espera por você.",
      },
    },
    "downhill-derby": {
      title: "Ladeira Abaixo",
      tagline: "Quatro amigos, quatro carrinhos improvisados e uma disputa pelas ladeiras do bairro.",
      description: "Déco, Lina, Bruno e Mila construíram seus próprios carrinhos e resolveram descobrir quem manda nas ladeiras do bairro. Ganhe velocidade nas descidas, salte pelas rampas e capriche nas manobras. Chegue na frente para subir ao pódio e faça bonito pelo caminho para somar pontos!",
      tags: ["Ação", "Corrida", "Manobras"],
      objective: "Três ladeiras, três desafios. Chegue entre os três primeiros para desbloquear a próxima pista. E, se puder, deixe seus amigos comendo poeira!",
      howToIntro: "Corra pelas três ladeiras do bairro, cada uma mais desafiadora que a anterior. Chegue entre os três primeiros para avançar e tente deixar seus amigos para trás!",
      levels: [
        { title: "Ladeira do Seu Arlindo", goal: "Pule as lixeiras, encare as rampas e cuidado com o caminhão de lixo!" },
        { title: "Dia de Feira", goal: "Pule de toldo em toldo ou encare o corredor da feira." },
        { title: "Morro da Antena", goal: "Atravesse a obra, encare o looping e descubra o atalho do bueiro." },
      ],
      controls: [
        { input: "↓ ou S", action: "Agache para ganhar velocidade nas descidas.", on: "keys" },
        { input: "Espaço", action: "Pule rampas e obstáculos. Segure no ar para fazer uma pose.", on: "keys" },
        { input: "← → ou A D", action: "No ar, gire o carrinho para acertar o pouso. No chão, empine e equilibre para ganhar pontos.", on: "keys" },
        { input: "Esc ou P", action: "Pause ou retome a corrida.", on: "keys" },
        { input: "AGACHAR", action: "Segure para ganhar velocidade nas descidas.", on: "touch" },
        { input: "PULAR", action: "Toque para pular. Segure no ar para fazer uma pose.", on: "touch" },
        { input: "Setas de girar", action: "No ar, gire o carrinho para acertar o pouso. No chão, empine e equilibre para ganhar pontos.", on: "touch" },
      ],
      howTo: [
        { title: "Embale", text: "Agache para ganhar velocidade nas descidas. Quando chegar a uma rampa, pule bem na pontinha para voar mais longe!" },
        { title: "Pouse reto", text: "Gire o carrinho no ar até a silhueta ficar verde. Acerte o pouso para ganhar velocidade. Se aterrissar muito torto, você capota!" },
        { title: "Dê show", text: "Dê mortais, faça poses e empine o carrinho para ganhar pontos. Combine manobras e aumente seu multiplicador até ×5!" },
      ],
      tips: [
        "Cada carrinho anda de um jeito. Experimente todos na garagem.",
        "A Banheira acelera nas poças. Os outros carrinhos perdem embalo nelas.",
        "A Turbina da Vovó empurra nas subidas e quase nunca perde o embalo.",
        "O Relâmpago de Madeira levanta mais rápido depois de capotar.",
        "Os rivais acompanham o seu ritmo. Correu melhor? Eles também apertam.",
        "Devagar demais, o piloto rema com as mãos. Ninguém fica parado.",
        "Pousar no meio de uma pose dá capotada. Solte antes de tocar o chão.",
        "Tem um anão dourado escondido na Ladeira do Seu Arlindo.",
        "No Dia de Feira, passar liso pelos pombos vale pontos.",
        "A Mila conhece os atalhos. Fique de olho para onde ela vai.",
        "Chegue na frente da Lina no Dia de Feira para correr com a Turbina da Vovó.",
        "Chegue na frente da Mila no Morro da Antena para correr com a Banheira.",
      ],
      keyTips: ["Com o Plano B, segure ↓ e a linha pontilhada mostra onde o pulo vai cair.", "No chão, ← → empinam o carrinho. Equilibre para ganhar pontos."],
      touchTips: ["Com o Plano B, segure AGACHAR e a linha pontilhada mostra onde o pulo vai cair.", "No chão, as setas de girar empinam o carrinho. Equilibre para ganhar pontos."],
      controlsSummary: "Ladeira Abaixo. Seta para baixo agacha, espaço pula, setas para os lados giram no ar e empinam no chão, Esc pausa.",
      copy: {
        winTitle: "Pódio!",
        winText: "Lá embaixo, todo mundo quer revanche.",
        loseTitle: "Quarto lugar",
        loseText: "A próxima descida é sua.",
      },
    },
  },
  en: {
    "dead-end-street": {
      title: "Dead End Street",
      tagline: "Gadgets, physics and plenty of chaos in the neighbor's yard.",
      description: "Déco and Lina turned a soapbox cart into a machine that launches things. The target? Mr. Arlindo's yard ornaments! Nail your launches, make the biggest mess you can and try to beat the record before you run out of ammo.",
      tags: ["Action", "Physics", "Gadgets"],
      objective: "Nine levels in Mr. Arlindo's yard, in three acts. Pick your ammo, read the yard and turn crates, buckets, ropes and the neighbor's own gadgets against him.",
      levels: [
        { title: "Warm-up", goal: "Knock down the gnome and the flamingo." },
        { title: "Sharp aim", goal: "Find a way to the golden gnome and the mailbox." },
        { title: "Way up high", goal: "A crate tower, a pole and the birdhouse on the branch." },
        { title: "Domino effect", goal: "The gnome is in the garage. Start with the bricks." },
        { title: "Surprise shower", goal: "Soak the three sunbathing gnomes." },
        { title: "Blocked path", goal: "Get the bowling ball to the golden gnome." },
        { title: "Arlindo strikes back", goal: "A new blower and a new gate. Look before you launch." },
        { title: "Total chaos", goal: "Everything is connected. Plan the order." },
        { title: "The big mess", goal: "Knock down Mr. Arlindo's Giant Gnome." },
      ],
      controls: [
        { input: "Mouse or finger", action: "Drag and release" },
        { input: "← → or A D", action: "Angle" },
        { input: "↑ ↓ or W S", action: "Power" },
        { input: "1 to 4, Q or tap the ammo", action: "Swap ammo" },
        { input: "Space or Enter", action: "Launch" },
        { input: "Esc or P", action: "Pause" },
      ],
      howTo: [
        { title: "Pick", text: "Each ammo does one thing: the sneaker stays where it lands, the balloon soaks and shoves, the tire is heavy and the duck bounces." },
        { title: "Look", text: "The direct shot isn't always the answer. Ropes, buckets, bricks and faucets can do the work for you." },
        { title: "Save", text: "Fewer launches earn more stars. Replay any level and try a better way." },
      ],
      tips: [
        "A tight rope? Anything that flies through it cuts it.",
        "Mr. Arlindo's leaf blower pushes light things back. The sneaker and the tire get through.",
        "Mr. Arlindo's gate turns after every launch. Wait for the right moment.",
        "A sunbathing gnome only counts when it gets wet: balloon, bucket or hose.",
        "Knocking down two targets with one launch is worth a bonus.",
        "Leftover ammo turns into a bonus at the end.",
        "The dotted line is Bruno's plan. Trust it... a little.",
      ],
      controlsSummary: "Dead End Street. Arrows set angle and power, 1 to 4 swap the ammo, space launches, Esc pauses.",
      copy: {
        winTitle: "Level cleared!",
        winText: "Mr. Arlindo's yard gets messier every time.",
        loseTitle: "Out of ammo!",
        loseText: "Mr. Arlindo's ornaments survived. For now.",
      },
    },
    "bad-ideas-lab": {
      title: "Bad Ideas Lab",
      tagline: "Build wacky machines to solve silly problems.",
      description: "Lina thinks every problem can be solved with a machine, ideally the most complicated one possible. Waking the cat, starting the toaster, finding the remote: in her garage, everything turns into a contraption. Set up ramps, springs, fans and conveyor belts and get the ball where it needs to go.",
      tags: ["Puzzle", "Building", "Physics"],
      objective: "Every great invention starts with a questionable idea. Build your machine, get the ball to the target and try to solve each challenge with as few parts as possible.",
      controls: [
        { input: "Drag (mouse or finger)", action: "Take a part out of the box or move a placed part" },
        { input: "Tap a part", action: "Show the rotate and put-away buttons" },
        { input: "1 to 4", action: "Take a part from the box" },
        { input: "S", action: "Select a part that's already placed" },
        { input: "Arrows", action: "Move the part" },
        { input: "R or Q", action: "Rotate the part one way or the other" },
        { input: "Enter", action: "Place the part (or pick up the selected part again)" },
        { input: "C", action: "Cancel: the part goes back where it was" },
        { input: "Delete or X", action: "Put the part back in the box" },
        { input: "Space", action: "Turn the machine on or off" },
        { input: "H", action: "Ask for a hint" },
        { input: "D", action: "Hear the level description" },
        { input: "O (Shift+O goes back)", action: "Hear the level's objects one at a time. The last one becomes the reference for the part's position" },
        { input: "I", action: "Hear where the part is and what's nearby" },
        { input: "L", action: "Hear the result of the last test again" },
        { input: "Esc or P", action: "Pause" },
      ],
      howTo: [
        { title: "Build", text: "Drag a part from the box to the dashed area." },
        { title: "Adjust", text: "Tap the part to rotate it or put it away. To move it, just drag it again." },
        { title: "Test", text: "Press START and see what happens. Didn't work? Adjust and try again." },
      ],
      levels: [
        { title: "First test", goal: "Put the ramp in the marked spot and turn on the machine." },
        { title: "Good morning, Pixel", goal: "Make the ball ring the bell." },
        { title: "Breakfast", goal: "Make the ball press the toaster button." },
        { title: "Orange juice", goal: "Get the orange to the juicer." },
        { title: "Where's the remote?", goal: "Make the ball press the button on the remote." },
        { title: "The worst idea of all", goal: "Make the ball ring the bell behind the wall." },
      ],
      tips: [
        "Didn't work? Move a part and try again.",
        "The spring throws the ball wherever it points.",
        "The fan pushes the ball when it passes in front of it.",
        "The conveyor belt carries the ball where the arrows point.",
        "The fewer parts, the more stars.",
        "Every great invention started as a terrible idea.",
      ],
      controlsSummary: "Bad Ideas Lab. Numbers take parts from the box, S selects a placed part, arrows move one step, R and Q rotate, Enter places, C cancels, X puts the part back in the box, space turns on the machine. H gives a hint, D describes the level, O goes through the objects, I says where the part is, L repeats the last test result, Esc pauses.",
      copy: {
        winTitle: "Test passed!",
        winText: "One more terrible idea that worked.",
        loseTitle: "Not quite...",
        loseText: "Move the parts and try again.",
      },
    },
    "food-fight": {
      title: "Food Fight",
      tagline: "The food fight is on. Nobody's leaving clean!",
      description: "It all started with a grape flying across the cafeteria. Now Déco and Mila have to defend their table from the rival gang. Fire back with snacks, hide from the puddings and hang on until the bell rings!",
      tags: ["Action", "Arcade", "Food"],
      objective: "The food fight is on! Dodge the snacks until the bell rings. You have three napkins to survive the attacks.",
      controls: [
        { input: "Tap or click a kid", action: "Throw a snack at them" },
        { input: "Hold DUCK", action: "Duck behind the table and reload" },
        { input: "Space or Enter", action: "Throw at the most dangerous kid" },
        { input: "1 to 5", action: "Throw at the table with that number" },
        { input: "Down arrow or S (hold)", action: "Duck" },
        { input: "Esc or P", action: "Pause" },
      ],
      howTo: [
        { title: "Aim", text: "Tap a rival kid to throw food at them." },
        { title: "Duck", text: "Pudding incoming! Hold DUCK to take cover behind the table." },
        { title: "Reload", text: "While you're ducking, Mila restocks your snacks. Careful not to hit the lunch lady!" },
      ],
      tips: [
        "See an exclamation mark? Get ready to duck.",
        "While you're ducking, Mila hands you more snacks.",
        "The big kids in hoodies take two snacks.",
        "Kids who pop up grinning throw fast. Hit them first.",
        "Rival holding a tray? Wait for it to come down.",
        "Hitting someone about to throw pudding is worth a bonus.",
        "During the brawl, every hit counts double.",
        "Hitting the lunch lady costs points.",
        "The cook takes any snacks left on the table. When she comes, throw everything first!",
      ],
      controlsSummary: "Food Fight. Space throws at the most dangerous kid, 1 to 5 pick the table, hold the down arrow to duck and reload, Esc pauses.",
      copy: {
        winTitle: "Saved by the bell!",
        winText: "The bell rang! The cafeteria survived another food fight.",
        loseTitle: "Splat!",
        loseText: "Out of napkins. Better luck next time!",
      },
    },
    "pajama-war": {
      title: "Pajama War",
      tagline: "The sleepover turned into a pillow war.",
      description: "Lia, Nico and Bia planned a quiet night. It lasted five minutes. Pick one of the three, dodge the pillows and be the last one standing.",
      tags: ["Action", "Arcade", "Pillows"],
      objective: "Pick a character and hit the other two with pillows. Last one standing wins!",
      controls: [
        { input: "WASD or arrows", action: "Move", on: "keys" },
        { input: "Mouse", action: "Aim", on: "keys" },
        { input: "Click or space", action: "Throw a pillow (hold to keep throwing)", on: "keys" },
        { input: "Esc or P", action: "Pause", on: "keys" },
        { input: "On-screen stick, on the left", action: "Drag your thumb to move", on: "touch" },
        { input: "THROW button, on the right", action: "Tap to throw at the closest opponent in the direction you're moving. Hold to keep throwing.", on: "touch" },
        { input: "Drag on the right side", action: "Aims wherever you drag. Let go to throw. You can run away and throw back.", on: "touch" },
      ],
      howTo: [
        { title: "Pick", text: "Lia runs faster, Nico throws faster and Bia gets her energy back faster." },
        { title: "Hit", text: "Aim at the other two and throw pillows. A ! warns you when someone is about to throw at you." },
        { title: "Stay up", text: "Dodge, get your energy back away from the chaos and be the last one standing." },
      ],
      levels: [
        { title: "Bedroom", goal: "Learn to aim and dodge." },
        { title: "Living room", goal: "Use the sofa and armchairs to bounce your throws." },
        { title: "Backyard", goal: "Grab the giant pillow before the others do." },
      ],
      guests: [
        { name: "Lia", role: "The fast one" },
        { name: "Nico", role: "The thrower" },
        { name: "Bia", role: "The tough one" },
      ],
      tips: [
        "Lia is fast. Run, catch your breath and come back.",
        "Nico throws pillows almost nonstop.",
        "Bia gets her energy back faster.",
        "Go a while without getting hit to get your energy back.",
        "The other two fight each other too. Take advantage!",
        "See a ! over someone? They're about to throw at you. Get out of the way!",
        "Whoever just threw is out of pillows for a moment. That's your chance.",
        "After a while, the fight heats up.",
        "In the living room, the sofa and armchairs bounce pillows back. The aim guide shows the path.",
        "In the backyard, the tent and the tree work as shields.",
        "The giant pillow in the backyard flies over everything and shoves anyone nearby.",
      ],
      keyTips: ["Hold space or the mouse button to keep throwing.", "Without a mouse, space aims at the closest opponent on its own."],
      touchTips: [
        "Hold the THROW button to keep throwing.",
        "Running away from someone? Drag your right thumb toward them and let go to throw back.",
        "Someone left the screen? A little arrow on the edge shows where they are.",
      ],
      controlsSummary: "Pajama War. WASD or arrows move, the mouse aims, click or space throws a pillow, Esc pauses.",
      copy: {
        winTitle: "You won!",
        winText: "Last one standing! Another round?",
        loseTitle: "Knocked out!",
        loseText: "Another round?",
      },
    },
    "operation-recess": {
      title: "Operation: Recess",
      tagline: "The hall monitors canceled recess. Bruno isn't letting that slide!",
      description: "The hall monitors banned every game and turned the school into a quiet zone. Now Bruno has to make it through the hallways, take on the monitors with his cardboard sword and reach the principal's office to save recess.",
      tags: ["Action", "Platformer", "Adventure"],
      objective: "Cross the school with your cardboard sword, get past the monitors and defeat the Silence Inspector. Recess is counting on you!",
      controls: [
        { input: "← → or A D", action: "Move", on: "keys" },
        { input: "Space, ↑ or W", action: "Jump (hold to go higher)", on: "keys" },
        { input: "J", action: "Attack with the cardboard sword", on: "keys" },
        { input: "Esc or P", action: "Pause", on: "keys" },
        { input: "Arrows, bottom left", action: "Move. Slide your finger from one arrow to the other to turn.", on: "touch" },
        { input: "Yellow button", action: "Jump. Hold it to go higher.", on: "touch" },
        { input: "Pink button", action: "Attack with the cardboard sword", on: "touch" },
      ],
      howTo: [
        { title: "Run", text: "Puddles are slippery and holes make you fall. On the jump rope, jump when it comes down. Locker shaking? Stop, or slam it shut with your sword." },
        { title: "Attack", text: "Use your sword to hit the monitors. Take down every monitor in a level to earn the 3rd star. The stop sign (PARE) blocks from the front: attack from behind or when he lowers it." },
        { title: "Advance", text: "If the Inspector's spotlight lands on you, get out of it. Ring the bells to save your progress on the way to the principal's office." },
      ],
      levels: [
        { title: "Forbidden hallway", goal: "Watch out for the lockers and the lookout." },
        { title: "Occupied schoolyard", goal: "Jump the rope and dodge the whistles." },
        { title: "Road to the office", goal: "Beat the Silence Inspector." },
      ],
      tips: [
        "Ran straight through? That's 2 stars. The 3rd goes to whoever takes down every monitor.",
        "A ! over a monitor? Here comes an attack.",
        "Whistle wave: jump over it or cut through it with your sword.",
        "High whistles fly over you. Stay on the ground and wait.",
        "The stop sign only blocks from the front.",
        "After the shove, the monitor lowers the sign. Your turn!",
        "Locker shaking? Stop before the door or slam it shut with your sword.",
        "When the lookout lowers his newspaper, freeze like a statue.",
        "On the jump rope, jump when it comes down. Tripping knocks you back.",
        "The Inspector's spotlight stopped on you? Get out before it turns red.",
        "Wobbly shelves can't hold anyone who stands still.",
        "Snacks give back a heart. Bells save your progress.",
        "Hit the Inspector when he's dizzy, tired or has his clipboard stuck.",
      ],
      touchTips: ["Hold an arrow and tap jump at the same time to jump while running.", "Slide your thumb between the arrows to turn without letting go."],
      controlsSummary: "Operation: Recess. Arrows move, space jumps, J attacks, Esc pauses.",
      copy: {
        winTitle: "Recess is back!",
        winText: "The Inspector is done for and the schoolyard belongs to the kids again!",
        loseTitle: "Caught red-handed!",
        loseText: "The monitors sent you to the office. Try again?",
      },
    },
    "off-air-vacation": {
      title: "Off-Air Vacation",
      tagline: "The channel went off the air. But at this resort, vacation goes on.",
      description: "Canal 404 went off the air years ago. Even so, Resort 404 keeps welcoming guests as if nothing happened. Explore the beach, the pool, the arcade and the resort's most forgotten corners. Talk to the guests, gather clues and find out why nobody seems to have left.",
      tags: ["Adventure", "Exploration", "Mystery"],
      objective: "Explore every corner of the resort, talk to the guests and follow the clues of a mystery nobody can explain.",
      controls: [
        { input: "WASD or arrows", action: "Move" },
        { input: "E, space or Enter", action: "Talk, examine and pick up" },
        { input: "Click or tap", action: "Walk to a spot or talk to someone" },
        { input: "J", action: "Open the journal" },
        { input: "M", action: "Open the map" },
        { input: "Joystick and on-screen button", action: "Move and interact on a phone" },
        { input: "Esc or P", action: "Pause" },
      ],
      howTo: [
        { title: "Explore", text: "Walk around the resort and keep an eye out for shiny objects. There's always something to find." },
        { title: "Talk", text: "Walk up to the characters and press E to talk. A ! means someone has something important to say." },
        { title: "Take notes", text: "Check the journal to follow your mission, look back at what you found and open the map and the posters." },
      ],
      guests: [
        { name: "Mr. Bigodes", role: "Receptionist" },
        { name: "Captain Marola", role: "Lifeguard" },
        { name: "Tilt", role: "Arcade machine" },
        { name: "Marisa", role: "Seagull on vacation" },
        { name: "Psiu", role: "Lives in the forest" },
        { name: "Capivaldo", role: "Juice stand" },
        { name: "Clique", role: "Tourist" },
        { name: "Dr. Cavuca", role: "Explorer" },
        { name: "Placar", role: "Arcade attendant" },
      ],
      tips: [
        "A ! over someone means they have something for you.",
        "The journal (J) always shows the next mission.",
        "On the map (M), the target marks where the main mission is.",
        "There's a Canal 404 poster hidden in every area.",
        "Three gold tokens unlock a surprise at the arcade.",
        "Room 404 is locked. Who could have the key?",
        "The remote pauses more things than you'd think.",
        "After the ending, go back to the resort. Someone new might show up.",
        "The game saves on its own. Leave and come back whenever you want.",
        "Capivaldo, at the juice stand, always knows some useful gossip.",
        "Standing still in the forest makes certain critters curious.",
      ],
      controlsSummary: "Off-Air Vacation. WASD or arrows move, E interacts, J opens the journal, M opens the map, Esc pauses.",
      copy: {
        winTitle: "Mystery solved!",
        winText: "Vacation goes on.",
        loseTitle: "See you soon!",
        loseText: "The resort is waiting for you.",
      },
    },
    "downhill-derby": {
      title: "Downhill Derby",
      tagline: "Four friends, four homemade carts and a race for the neighborhood hills.",
      description: "Déco, Lina, Bruno and Mila built their own carts and set out to find out who rules the neighborhood hills. Build speed on the way down, fly off the ramps and pull off some tricks. Finish ahead to make the podium, and look good along the way to rack up points!",
      tags: ["Action", "Racing", "Tricks"],
      objective: "Three hills, three challenges. Finish in the top three to unlock the next track. And if you can, leave your friends in the dust!",
      howToIntro: "Race down the three neighborhood hills, each tougher than the last. Finish in the top three to move on, and try to leave your friends behind!",
      levels: [
        { title: "Mr. Arlindo's Hill", goal: "Jump the trash cans, take on the ramps and watch out for the garbage truck!" },
        { title: "Market Day", goal: "Bounce from awning to awning or brave the market aisle." },
        { title: "Antenna Hill", goal: "Get through the roadworks, take on the loop and find the manhole shortcut." },
      ],
      controls: [
        { input: "↓ or S", action: "Crouch to build speed on the way down.", on: "keys" },
        { input: "Space", action: "Jump ramps and obstacles. Hold in the air to strike a pose.", on: "keys" },
        { input: "← → or A D", action: "In the air, spin the cart to land straight. On the ground, pop a wheelie and balance it for points.", on: "keys" },
        { input: "Esc or P", action: "Pause or resume the race.", on: "keys" },
        { input: "CROUCH", action: "Hold to build speed on the way down.", on: "touch" },
        { input: "JUMP", action: "Tap to jump. Hold in the air to strike a pose.", on: "touch" },
        { input: "Spin arrows", action: "In the air, spin the cart to land straight. On the ground, pop a wheelie and balance it for points.", on: "touch" },
      ],
      howTo: [
        { title: "Build speed", text: "Crouch to build speed on the way down. When you reach a ramp, jump right at the edge to fly farther!" },
        { title: "Land straight", text: "Spin the cart in the air until the outline turns green. Nail the landing to gain speed. Land too crooked and you wipe out!" },
        { title: "Put on a show", text: "Do flips, strike poses and pop wheelies to earn points. Chain tricks to push your multiplier up to ×5!" },
      ],
      tips: [
        "Every cart rides differently. Try them all in the garage.",
        "The Tub speeds up in puddles. The other carts lose speed in them.",
        "Grandma's Turbo pushes you uphill and hardly ever slows down.",
        "The Wooden Lightning gets back up faster after a wipeout.",
        "The rivals keep up with your pace. Raced better? So will they.",
        "Too slow and the rider paddles with their hands. Nobody ever stops.",
        "Landing mid-pose means a wipeout. Let go before you touch down.",
        "There's a golden gnome hidden on Mr. Arlindo's Hill.",
        "On Market Day, slipping past the pigeons earns points.",
        "Mila knows the shortcuts. Keep an eye on where she goes.",
        "Beat Lina on Market Day to race with Grandma's Turbo.",
        "Beat Mila on Antenna Hill to race with The Tub.",
      ],
      keyTips: ["With Plan B, hold ↓ and a dotted line shows where the jump will land.", "On the ground, ← → pop a wheelie. Keep it balanced for points."],
      touchTips: ["With Plan B, hold CROUCH and a dotted line shows where the jump will land.", "On the ground, the spin arrows pop a wheelie. Keep it balanced for points."],
      controlsSummary: "Downhill Derby. Down arrow crouches, space jumps, left and right arrows spin in the air and wheelie on the ground, Esc pauses.",
      copy: {
        winTitle: "Podium!",
        winText: "Down at the bottom, everyone wants a rematch.",
        loseTitle: "Fourth place",
        loseText: "The next run is yours.",
      },
    },
  },
});

function build(locale: Locale): GameMeta[] {
  return (Object.entries(BASE) as [Slug, GameBase][]).map(([slug, { levelIds, guestIds, ...base }]) => {
    const { levels, guests, ...text } = TEXT[locale][slug];
    return {
      slug,
      ...base,
      ...text,
      ...(levelIds ? { levels: levelIds.map((id, i) => ({ id, title: levels?.[i]?.title ?? id, goal: levels?.[i]?.goal ?? "" })) } : {}),
      ...(guestIds ? { guests: guestIds.map((id, i) => ({ id, name: guests?.[i]?.name ?? id, role: guests?.[i]?.role ?? "" })) } : {}),
    };
  });
}

const BY_LOCALE: Record<Locale, GameMeta[]> = { "pt-BR": build("pt-BR"), en: build("en") };

export function gamesIn(locale: Locale) {
  return BY_LOCALE[locale];
}

export function playableIn(locale: Locale) {
  return BY_LOCALE[locale].filter((g) => g.status === "available");
}

export function getGame(slug: string, locale: Locale) {
  return BY_LOCALE[locale].find((g) => g.slug === slug);
}

export const GAMES = BY_LOCALE["pt-BR"];

export const PLAYABLE = playableIn("pt-BR");
