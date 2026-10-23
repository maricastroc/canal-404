export type CharacterId = "404" | "lina" | "bruno" | "deco" | "mila";

export type Character = {
  id: CharacterId;
  name: string;
  role: string;
  cardClass: string;
  bio: string;
  likes: string;
  dislikes: string;
  catchphrase: string;
  fact: string;
  sound: "boing" | "pop" | "squeak" | "whoosh" | "secret";
};

export const CHARACTERS: Character[] = [
  {
    id: "404",
    name: "404",
    role: "O mascote",
    cardClass: "bg-sun",
    bio: "Nasceu quando um técnico do canal colou dois olhos numa TV quebrada para animar uma reunião. Funcionou bem demais. Hoje apresenta a programação, perde o controle remoto e jura que não está perdido.",
    likes: "Chiado de fundo, plateia, fitas VHS",
    dislikes: "Ímãs. Muito ímãs.",
    catchphrase: "Não estou perdido. Estou explorando!",
    fact: "Pega 3 canais e meio. O meio é só chiado.",
    sound: "boing",
  },
  {
    id: "lina",
    name: "Lina",
    role: "A inventora",
    cardClass: "bg-bubblegum",
    bio: "Tem um óculos de proteção na testa desde os seis anos e uma caixa de ferramentas maior que ela. Construiu a engenhoca da Rua Sem Saída com peças de três bicicletas e uma geladeira.",
    likes: "Fita adesiva, parafusos tortos, planos B",
    dislikes: "Manual de instruções",
    catchphrase: "Isso não é um defeito, é um recurso!",
    fact: "Desmontou o liquidificador da avó para fazer um ventilador turbo.",
    sound: "pop",
  },
  {
    id: "bruno",
    name: "Bruno",
    role: "O plano",
    cardClass: "bg-mint",
    bio: "Tem um caderno para cada coisa, incluindo um caderno sobre cadernos. Calcula trajetórias, prevê desastres e é sempre ignorado pelo Déco. A linha pontilhada da Rua Sem Saída? É o plano dele.",
    likes: "Mapas, canetas de quatro cores, previsões corretas",
    dislikes: "Improviso",
    catchphrase: "Segundo meus cálculos... ah, deixa pra lá.",
    fact: "Sabe de cor a velocidade de um tênis voando: depende de quem chuta.",
    sound: "squeak",
  },
  {
    id: "deco",
    name: "Déco",
    role: "O impulsivo",
    cardClass: "bg-tangerine",
    bio: "Primeiro age, depois pensa — e às vezes pula a segunda parte. Tem um curativo novo por semana e uma ideia genial por minuto. É ele quem puxa o elástico da engenhoca.",
    likes: "Coisas que explodem (de mentirinha), corrida, pudim",
    dislikes: "Esperar a contagem regressiva",
    catchphrase: "Vai dar certo! ...Provavelmente!",
    fact: "Já foi lançado pela própria engenhoca. Duas vezes.",
    sound: "whoosh",
  },
  {
    id: "mila",
    name: "Mila",
    role: "A estranha",
    cardClass: "bg-plum-300",
    bio: "Fala pouco, observa tudo e coleciona coisas que ninguém entende: pedras com formato de dente, áudios de geladeira, mapas de casas que não existem. Diz que a Casa Estranha piscou para ela.",
    likes: "Silêncio, neblina, sapos",
    dislikes: "Dias normais",
    catchphrase: "Isso é normal. Pra mim.",
    fact: "Usa um grampo de olho que, segundo ela, enxerga sozinho.",
    sound: "secret",
  },
];
