import type { AreaId } from "./config";
import { ALL_POSTERS, ALL_SECRETS, ALL_TOKENS, type FolkKey, type Item, type PosterId, type SecretId, type State, type TokenId } from "./save";
import type { ResortSfx } from "./sounds";

export type Speaker = FolkKey | "deco" | "narrator";
export type Mood = "normal" | "talk" | "look" | "happy" | "sad" | "surprised";

export const SPEAKERS: Record<Speaker, { name: string; voice: ResortSfx | null; pitch: number }> = {
  deco: { name: "Déco", voice: "blip", pitch: 1.15 },
  bigodes: { name: "Sr. Bigodes", voice: "blip", pitch: 0.62 },
  marola: { name: "Capitão Marola", voice: "blip", pitch: 0.85 },
  tilt: { name: "Tilt", voice: "arcadeBeep", pitch: 1 },
  marisa: { name: "Marisa", voice: "blipSoft", pitch: 1.2 },
  psiu: { name: "Psiu", voice: "blipSoft", pitch: 1.7 },
  lento: { name: "Seu Lento", voice: "blip", pitch: 0.5 },
  mascot: { name: "404", voice: "blipSoft", pitch: 1 },
  capi: { name: "Capivaldo", voice: "blip", pitch: 0.75 },
  clique: { name: "Clique", voice: "blipSoft", pitch: 1.4 },
  cavuca: { name: "Dr. Cavuca", voice: "blip", pitch: 0.95 },
  chiado: { name: "Chiadinho", voice: "arcadeBeep", pitch: 1.7 },
  placar: { name: "Placar", voice: "blip", pitch: 1.05 },
  narrator: { name: "", voice: null, pitch: 1 },
};

export const ITEM_INFO: Record<Item, { name: string; icon: string }> = {
  net: { name: "Rede da piscina", icon: "item-net" },
  whistle: { name: "Apito", icon: "item-whistle" },
  remote: { name: "Controle mestre", icon: "item-remote" },
  order: { name: "Ordem final", icon: "item-order" },
  key: { name: "Chave do quarto 404", icon: "item-key" },
  cartridge: { name: "Cartucho dourado", icon: "item-cartridge" },
};

export const POSTER_INFO: Record<PosterId, { title: string; area: AreaId; text: string }> = {
  club: { title: "Clube do 404 (1998)", area: "lobby", text: "Um pôster do Clube do 404. Na parte de baixo: 'Sócio número 1: você?'" },
  summer: { title: "Verão 404 (1999)", area: "pool", text: "Festa na piscina, verão de 1999. O flamingo do cartaz é o mesmo da piscina." },
  tilt: { title: "Tilt: Campeão (1999)", area: "arcade", text: "Torneio de 1999. O campeão foi o Tilt. Ele também era o único competidor." },
  surf: { title: "Surfe 404 (2001)", area: "beach", text: "'Surfe 404: onda ao vivo'. A onda do cartaz é igualzinha às de hoje." },
  ghost: { title: "Trem Fantasma (2003)", area: "forest", text: "'O Trem Fantasma volta em 2005.' Ele não voltou. Ainda." },
};

export const SPOT_LABELS: Record<string, string> = {
  bell: "Campainha",
  guestbook: "Livro de hóspedes",
  door404: "Quarto 404",
  frameSunset: "Quadro",
  frameTv: "Quadro",
  clock: "Relógio",
  elevator: "Elevador",
  poster: "Pôster",
  posterPijama: "Pôster",
  sofa: "Sofá",
  suitcases: "Malas",
  tv: "TV",
  flamingo: "Flamingo",
  net: "Rede",
  lounge: "Espreguiçadeira",
  juiceMenu: "Cardápio",
  poolSign: "Aviso",
  towel: "Toalha",
  enterHotel: "Hotel",
  enterArcade: "Fliperama",
  signpost: "Placa",
  duck: "Patinho",
  cabA: "Rua Sem Saída",
  cabB: "Laboratório",
  cabC: "Guerra de Lanche",
  cabD: "Máquina quebrada",
  claw: "Pega-pega",
  curtain: "Cortina",
  gold: "Máquina dourada",
  prizes: "Prêmios",
  pinball: "Pinball",
  hockey: "Hóquei de mesa",
  records: "Recordes",
  shore: "Mar",
  bottle: "Garrafa",
  shell: "Concha",
  shells: "Conchinhas",
  kiosk: "Quiosque",
  waveSign: "Placa",
  sandcastle: "Castelo de areia",
  pierEnd: "Farol",
  surf: "Pranchas",
  chips: "Batatinhas",
  fall: "Cachoeira",
  door: "Porta",
  placardArch: "Placa do trem",
  placardStatue: "Placa da estátua",
  dish: "Antena 404",
  treehouse: "Casa na árvore",
  log: "Tronco",
  horse: "Cavalinho",
  mushrooms: "Cogumelos",
  bridge: "Ponte",
  booth: "Bilheteria",
  console: "Mesa de corte",
  button: "Botão",
  calendar: "Calendário",
  monitors: "Telas",
  tape: "Gravador",
  mug: "Caneca",
  window: "Janela",
  cartridge: "Cartucho",
};

export const FOUND_TEXT: Record<string, string> = {
  clock: "O relógio do saguão parou às 4:04.",
  tv: "A TV do saguão só passa chuvisco.",
  waves: "As ondas da praia são uma reprise.",
  pause: "O controle mestre pausa as coisas.",
  order: "Ninguém entregou a ordem final.",
  antenna: "Uma antena na floresta ainda transmite o canal.",
  door: "Tem uma porta atrás da cachoeira.",
  monitors: "Os moradores assistem tudo pelas telas.",
  calendar: "O calendário da sala parou em dezembro de 2004.",
  twist: "Os moradores sabiam de tudo. E gostam daqui.",
  bridge: "O riacho reflete barras coloridas, como TV fora do ar.",
  creature: "Tem um bichinho de chiado na floresta.",
  broken: "O sinal fica mais forte onde a água faz chiado.",
  photo: "Clique conseguiu fotografar a onda das 4:04.",
};

export const FOLK_LINE: Record<FolkKey, { name: string; line: string }> = {
  bigodes: { name: "Sr. Bigodes", line: "Recepcionista. Garante que está tudo normal." },
  marola: { name: "Capitão Marola", line: "Salva-vidas. Vigia a piscina como se fosse o oceano." },
  tilt: { name: "Tilt", line: "Máquina de fliperama. Dramática e campeã." },
  marisa: { name: "Marisa", line: "Gaivota de férias há vinte anos." },
  psiu: { name: "Psiu", line: "Mora na floresta. Fala por pistas." },
  lento: { name: "Seu Lento", line: "Hóspede antigo. Sem pressa nenhuma." },
  mascot: { name: "404", line: "O mascote do canal. De férias." },
  capi: { name: "Capivaldo", line: "Barraca de sucos. Sabe todas as fofocas." },
  clique: { name: "Clique", line: "Turista. Ainda atrás da foto perfeita." },
  cavuca: { name: "Dr. Cavuca", line: "Explorador. Perdido, mas com confiança." },
  chiado: { name: "Chiadinho", line: "Um pedacinho de chiado com olhos." },
  placar: { name: "Placar", line: "Funcionário do fliperama. Anota todos os recordes." },
};

export type Director = {
  s: State;
  say(who: Speaker, text: string, mood?: Mood): Promise<void>;
  ask(who: Speaker, text: string, options: string[], mood?: Mood): Promise<number>;
  has(item: Item): boolean;
  give(item: Item): Promise<void>;
  take(item: Item): void;
  flag(name: string): boolean;
  set(name: string): void;
  poster(id: PosterId): Promise<void>;
  token(id: TokenId): Promise<void>;
  secret(id: SecretId): Promise<void>;
  meet(id: FolkKey): void;
  discover(id: string): void;
  objective(): void;
  sfx(name: ResortSfx, volume?: number): void;
  wait(ms: number): Promise<void>;
  act(): void;
  mood(who: FolkKey, mood: Mood): void;
  action(name: string): Promise<void>;
  goto(area: AreaId, spawn: string): void;
};

export type MainStep = { text: string; area: AreaId | null; done: boolean };

export function mainObjective(s: State): MainStep {
  const f = s.flags;
  const has = (i: Item) => s.items.includes(i);
  if (f.ended) return { text: "Mistério resolvido! Explore o resort à vontade.", area: null, done: true };
  if (!f.talkedBigodes && !f.metMarola && !f.whistleReturned) return { text: "Fale com o recepcionista.", area: "lobby", done: false };
  if (!f.whistleReturned) {
    if (has("whistle")) return { text: "Devolva o apito ao Capitão Marola.", area: "pool", done: false };
    if (!f.metMarola) return { text: "Procure o salva-vidas na piscina.", area: "pool", done: false };
    if (has("net")) return { text: "Use a rede para alcançar o flamingo.", area: "pool", done: false };
    if (f.sawFlamingo) return { text: "Ache algo comprido para alcançar o flamingo.", area: "pool", done: false };
    return { text: "Ache o apito do Capitão Marola.", area: "pool", done: false };
  }
  if (!has("remote") && !f.tiltWon) return { text: f.metTilt ? "Ajude o Tilt a passar da fase 404." : "Peça o controle remoto ao Tilt, no fliperama.", area: "arcade", done: false };
  if (!f.gotOrder) return { text: f.metMarisa ? "Pause o mar com o controle, perto da placa das ondas." : "Leve o controle mestre até a praia.", area: "beach", done: false };
  if (!f.fallPaused) return { text: f.psiuRiddle ? "Pause a cachoeira da floresta." : "Procure a sala de transmissão na floresta.", area: "forest", done: false };
  return { text: "Entregue a ordem final na mesa de corte.", area: "station", done: false };
}

export function sideQuests(s: State) {
  const out: { text: string; done: boolean }[] = [];
  out.push({ text: `Pôsteres perdidos do Canal 404 (${s.posters.length}/${ALL_POSTERS.length})`, done: s.posters.length === ALL_POSTERS.length });
  if (s.tokens.length || s.flags.tokensHint) out.push({ text: `Fichas douradas (${s.tokens.length}/${ALL_TOKENS.length})`, done: s.secrets.includes("machine") });
  if (s.flags.gotKey) out.push({ text: "Abrir o quarto 404", done: s.secrets.includes("room404") });
  if (s.flags.ended && !s.secrets.includes("lento")) out.push({ text: "Será que o Seu Lento chegou?", done: false });
  return out;
}

export function score(s: State) {
  const posters = s.posters.length;
  const tokens = s.tokens.length;
  const secrets = s.secrets.filter((x) => ALL_SECRETS.includes(x)).length;
  return { posters, tokens, secrets };
}

const repeatLine = (s: State, key: string, lines: string[]) => {
  const n = Object.keys(s.flags).filter((k) => k.startsWith(`n_${key}_`)).length;
  return lines[n % lines.length];
};

async function bump(d: Director, key: string) {
  const n = Object.keys(d.s.flags).filter((k) => k.startsWith(`n_${key}_`)).length;
  d.set(`n_${key}_${n}`);
}

export const SCRIPTS: Record<string, (d: Director) => Promise<void>> = {
  intro: async (d) => {
    await d.say("narrator", "Ponto final: Resort Canal 404.");
    await d.say("deco", "Uau. Eu achava que esse lugar tinha fechado.", "surprised");
    await d.say("deco", "As luzes tão acesas. Tem música tocando. Cadê todo mundo?");
    d.objective();
  },

  bigodes: async (d) => {
    const f = d.s.flags;
    d.meet("bigodes");
    if (!f.talkedBigodes) {
      if (!f.greeted) {
        d.set("greeted");
        await d.say("bigodes", "Bem-vindo ao Resort Canal 404. Check-in às duas da tarde. Check-out, nunca.");
        await d.say("deco", "Nunca?", "surprised");
        await d.say("bigodes", "Força de expressão. Está tudo absolutamente normal por aqui.", "talk");
      } else {
        await d.say("bigodes", "Pois não?");
      }
      for (;;) {
        const pick = await d.ask("bigodes", "Posso ajudar em mais alguma coisa?", ["O que aconteceu aqui?", "Tem alguém hospedado?", "Tchau!"]);
        if (pick === 0) {
          await d.say("bigodes", "Nada. O canal saiu do ar há uns vinte anos e o resort continuou ligado. Normal.", "talk");
          await d.say("deco", "Isso não é nada normal.");
          await d.say("bigodes", "É o sistema de transmissão. Ele... oscila. A TV do saguão só passa chuvisco.", "look");
          await d.say("bigodes", "O controle remoto mestre resolveria isso. Mas ele sumiu.", "talk");
          await d.say("bigodes", "Da última vez que eu vi, estava com o salva-vidas. Na piscina. Pela porta da frente.", "normal");
          d.set("talkedBigodes");
          d.discover("tv");
          d.objective();
          return;
        }
        if (pick === 1) {
          await d.say("bigodes", "Hóspedes, não. Moradores. Um salva-vidas, uma gaivota, uma máquina de fliperama...", "talk");
          await d.say("bigodes", "...e alguém na floresta que eu prefiro não comentar.", "look");
          continue;
        }
        await d.say("bigodes", "Aproveite a estadia. Ela não acaba.");
        return;
      }
    }
    if (f.ended) {
      if (d.s.ending === "off") await d.say("bigodes", "A transmissão acabou e o resort continua ligado. Eu disse que estava tudo normal.", "happy");
      else await d.say("bigodes", "Ainda no ar. Check-out continua sendo nunca. Do jeito que eu gosto.", "happy");
      return;
    }
    if (d.has("order")) {
      await d.say("bigodes", "Isso aí é uma ordem de encerramento?", "surprised");
      await d.say("bigodes", "Eu não vi nada. Eu nunca vejo nada. Continue andando.", "look");
      return;
    }
    if (d.has("remote")) {
      await d.say("bigodes", "Você está com o controle mestre! Por favor, não troque de canal na minha frente. Eu tenho sentimentos.", "surprised");
      await d.say("bigodes", "A gaivota da praia diz que as ondas andam estranhas. Eu digo que ela é que anda estranha.", "talk");
      return;
    }
    if (f.whistleReturned) {
      await d.say("bigodes", "O Tilt pegou o controle? Típico. Máquinas de fliperama não respeitam o regulamento.", "talk");
      await d.say("bigodes", "O fliperama fica ao lado do hotel. É o prédio que pisca.");
      return;
    }
    await d.say("bigodes", "O salva-vidas fica na piscina. Saindo pela porta da frente. A porta da frente é aquela da frente.", "talk");
  },

  bell: async (d) => {
    d.sfx("bell", 0.9);
    d.act();
    await d.action("bellRing");
    const n = Object.keys(d.s.flags).filter((k) => k.startsWith("n_bell_")).length;
    await bump(d, "bell");
    d.mood("bigodes", "look");
    await d.say("bigodes", ["Eu estou bem aqui.", "...Eu continuo bem aqui.", "Essa campainha é para emergências. Isso é uma emergência?", "Sim. Ainda estou aqui."][n % 4], "look");
  },

  clock: async (d) => {
    await d.say("narrator", "O relógio parou às 4:04. O ponteiro dos segundos ainda tenta andar.");
    d.discover("clock");
  },

  tvLobby: async (d) => {
    if (d.s.flags.ended && d.s.ending === "on") return d.say("narrator", "Agora a TV mostra a piscina, ao vivo. O Capitão Marola está acenando.");
    await d.action("tvFragment");
    const n = Object.keys(d.s.flags).filter((k) => k.startsWith("n_tvLobby_")).length;
    await d.say("narrator", [
      "Por um segundo, a TV pega o Canal 404: o mascote acena e diz 'voltamos já'. Depois, chuvisco.",
      "Canal 404, 'Corrida Maluca': uma tartaruga cruzando a linha de chegada. Faltam só trezentos metros.",
      "Canal 404, intervalo: 'Suco de Manga 2004. O sabor que não acaba.' Depois, chuvisco.",
      "Canal 404, previsão do tempo: 'Ensolarado. 4:04 a tarde inteira.' Chuvisco de novo.",
    ][n % 4]);
    await bump(d, "tvLobby");
    if (d.has("remote") && n % 2 === 1) await d.say("deco", "Nem o controle mestre segura esse canal.");
    d.discover("tv");
  },

  elevator: async (d) => {
    if (d.s.flags.ended) return d.say("narrator", "Agora funciona! Só vai para o térreo. Você já está no térreo.");
    await d.say("narrator", "FORA DE SERVIÇO desde 2004. O botão está gasto de tanto apertarem.");
  },

  suitcases: async (d) => {
    await d.action("suitcaseWiggle");
    if (d.s.flags.n_cases_0) {
      await d.say("narrator", repeatLine(d.s, "cases2", ["Uma das malas tem um adesivo: 'EU SOBREVIVI AO VERÃO DE 2004'.", "Você levanta a mala de cima. Pesa como vinte anos de férias.", "Tem um bilhete preso na alça: 'Não abrir antes do fim da temporada'. Qual temporada?"]));
      await bump(d, "cases2");
      return;
    }
    d.set("n_cases_0");
    await d.say("narrator", "Etiquetas de viagem: 'Ilha do Recreio', 'Vila do Pudim', 'Rua Sem Saída'.");
    await d.say("deco", "Eu conheço a Rua Sem Saída!", "happy");
  },
  guestbook: async (d) => {
    const s = d.s;
    const rows = ["Quarto 101: Capitão Marola. 'Reservado até o fim do verão.' Qual verão, não diz.", "Quarto 202: Marisa. 'Vista pro mar. Sem data de saída.'"];
    rows.push(s.flags.gotKey ? "Seu Lento: 'Check-in previsto para 2004. Chave entregue a um jovem rápido.'" : "Seu Lento: 'Check-in previsto para 2004. Status: a caminho.'");
    rows.push(s.secrets.includes("room404") ? "Quarto 404: o 404 (mascote). 'Check-out: nunca. Não perturbe. Já perturbaram.'" : "Quarto 404: a letra está borrada. Embaixo, carimbado: NÃO PERTURBE.");
    await d.say("narrator", "O livro de hóspedes. A última página diz:");
    for (const r of rows) await d.say("narrator", r);
    if (s.flags.ended) await d.say("narrator", "E, numa letra nova: 'Déco. Check-in: hoje. Check-out: a combinar.'");
    else if (!s.flags.n_guestbook_0) {
      d.set("n_guestbook_0");
      d.mood("bigodes", "look");
      await d.say("bigodes", "Esse livro é confidencial. Mas pode ler. Ninguém lê.", "look");
    }
  },

  frameSunset: async (d) => {
    d.act();
    await d.action("frameStraighten");
    await d.say("narrator", "'Primeiro pôr do sol do resort, 1998.' Você endireita o quadro. Ele entorta de novo sozinho.");
  },

  frameTv: async (d) => {
    await d.action("frameFlicker");
    await d.say("narrator", "O quadro de uma TV. Por um instante, a TV do quadro parece ligada. Embaixo: 'Inauguração da antena, 1999'.");
  },

  sofa: async (d) => {
    await d.say("narrator", "Almofadas de abacaxi. Afundam de um jeito suspeito de confortável.");
  },

  door404: async (d) => {
    if (d.has("key")) {
      d.act();
      d.sfx("door", 0.8);
      await d.say("narrator", "A chave do Seu Lento serve. Clic.");
      d.goto("room404", "door");
      return;
    }
    await d.say("narrator", "Quarto 404. Trancado. A plaquinha diz: NÃO PERTURBE.");
    d.mood("bigodes", "look");
    await d.say("bigodes", "Esse quarto está ocupado. Sempre esteve.", "look");
  },

  marola: async (d) => {
    const f = d.s.flags;
    d.meet("marola");
    if (f.ended) {
      await d.say("marola", "O resort continua aqui e eu continuo de olho. Sempre alerta!", "happy");
      return;
    }
    if (f.whistleReturned) {
      await d.say("marola", repeatLine(d.s, "marola", ["Ninguém se afoga no meu turno. Ninguém entra na água também, mas é detalhe.", "O Tilt fica no fliperama. Aquele prédio que pisca.", "Sempre alerta. Às vezes alerta demais."]), "talk");
      await bump(d, "marola");
      return;
    }
    if (d.has("whistle")) {
      await d.say("deco", "Achei seu apito! Estava pendurado no pescoço do flamingo.", "happy");
      d.take("whistle");
      d.set("whistleReturned");
      d.mood("marola", "happy");
      await d.action("marolaBlow");
      await d.say("marola", "Vigilância restabelecida! Obrigado, recruta.", "talk");
      if (f.talkedBigodes) {
        await d.say("deco", "O Sr. Bigodes disse que você estava com o controle remoto do resort.");
        await d.say("marola", "Estava. O Tilt, do fliperama, pegou emprestado pra trocar de fase. Faz uns vinte anos.", "talk");
      } else {
        await d.say("marola", "Se precisar de alguma coisa por aqui, fale com o Sr. Bigodes. Ou com o Tilt, no fliperama.", "talk");
      }
      await d.say("marola", "O fliperama é o prédio roxo ao lado do hotel. Não tem erro: é o que pisca.", "normal");
      d.objective();
      return;
    }
    if (!f.metMarola) {
      d.set("metMarola");
      await d.say("marola", "Alto lá! Esta piscina é um oceano em potencial. Sempre alerta!", "sad");
      if (f.talkedBigodes) await d.say("deco", "O Sr. Bigodes disse que você estava com o controle remoto.");
      await d.say("marola", "Sem apito não há vigilância. Sem vigilância não há conversa.", "talk");
      await d.say("marola", "Meu apito sumiu e eu não posso sair da cadeira. O oceano ia aproveitar.", "sad");
      await d.say("deco", "Eu procuro pra você.");
      d.objective();
      return;
    }
    if (f.sawFlamingo) await d.say("marola", "O flamingo? Nunca confiei nele. Quem fica num pé só tem algo a esconder.", "look");
    else await d.say("marola", "Procure o apito, recruta. Eu cuido da piscina daqui. Bem daqui.", "look");
  },

  flamingo: async (d) => {
    if (d.s.flags.gotWhistle) {
      await d.action("flamingoLook");
      await d.say("narrator", repeatLine(d.s, "flamingo", ["O flamingo vira a cabeça e encara você. Depois finge que nada aconteceu.", "Ele está olhando. Você tem certeza de que ele está olhando.", "O flamingo boia, tranquilo. Tranquilo demais."]));
      await bump(d, "flamingo");
      return;
    }
    if (d.has("net")) {
      d.act();
      await d.action("fishFlamingo");
      d.set("gotWhistle");
      await d.give("whistle");
      await d.say("narrator", "Você devolve a rede ao depósito.");
      d.take("net");
      d.objective();
      return;
    }
    d.set("sawFlamingo");
    await d.action("flamingoLook");
    await d.say("narrator", "Um flamingo boiando no meio da piscina. Ele vira a cabeça pra você. Tem um apito pendurado no pescoço dele.");
    await d.say("deco", "Tá longe demais. Eu precisava de alguma coisa comprida.");
    d.objective();
  },

  net: async (d) => {
    d.act();
    await d.give("net");
    await d.say("deco", "Um pegador de folhas. Perfeito pra pescar coisas que não são folhas.", "happy");
    d.objective();
  },

  loungeToken: async (d) => {
    if (d.s.tokens.includes("lounge")) return d.say("narrator", "Uma espreguiçadeira listrada. Nada embaixo dela agora.");
    d.act();
    await d.say("narrator", "Embaixo da espreguiçadeira tem uma ficha dourada de fliperama!");
    await d.token("lounge");
  },

  capi: async (d) => {
    const f = d.s.flags;
    d.meet("capi");
    if (f.ended) {
      await d.say("capi", d.s.ending === "off" ? "Fim da transmissão? A barraca continua aberta. Suco de continuação?" : "Ainda no ar! Vou inventar um suco em homenagem: o Ao Vivo de Abacaxi.", "happy");
      return;
    }
    if (!f.metCapi) {
      d.set("metCapi");
      await d.say("capi", "Opa, cliente! Bem-vindo à barraca do Capivaldo.", "happy");
      await d.say("capi", "Faz vinte anos que eu sirvo o mesmo suco. Ninguém reclama. Ninguém pede outro também.", "talk");
    }
    const pick = await d.ask("capi", "Vai um suco?", ["Quero um suco especial!", "Alguma fofoca?", "Agora não."]);
    if (pick === 0) {
      await d.action("capiShake");
      if (!f.juiceDrunk) {
        d.set("juiceDrunk");
        await d.say("capi", "Suco de Manga 2004. Bate igualzinho ao de ontem.", "happy");
        d.act();
        await d.action("rewind");
        await d.say("deco", "Tem gosto de... reprise.", "surprised");
      } else await d.say("capi", "Mais um? Mesmo sabor, mesma hora. É a especialidade da casa.", "happy");
      return;
    }
    if (pick === 1) {
      const line = !f.whistleReturned
        ? "O Capitão Marola perdeu o apito. Desde então, ele só reclama em silêncio."
        : !f.tiltWon && !d.has("remote")
          ? "O Tilt, do fliperama, está preso na mesma fase faz vinte anos. Igual ao meu cardápio."
          : !f.gotOrder
            ? "O mar sempre traz alguma coisa na mesma hora. Ontem, um chinelo. Anteontem, o mesmo chinelo."
            : !f.fallPaused
              ? "Tem gente que jura que a cachoeira da floresta faz chiado de TV. Eu acho que é só cachoeira."
              : "Dizem que tem uma sala cheia de telas na floresta. Eu só tenho um liquidificador.";
      await d.say("capi", line, "talk");
      return;
    }
    await d.say("capi", "Tô aqui. Sempre tô aqui.");
  },
  juiceMenu: async (d) => d.say("narrator", "Cardápio: Manga 2004. Abacaxi 2004. Uva 404, o sabor que ninguém lembra."),
  poolSign: async (d) => {
    await d.say("narrator", "PROIBIDO CORRER. Alguém escreveu embaixo, a caneta: 'NADAR TAMBÉM'.");
    await d.action("marolaBark");
  },
  towel: async (d) => {
    await d.action("towelSwan");
    await d.say("narrator", "Uma toalha dobrada em forma de cisne. O cisne parece julgar você.");
  },
  enterHotel: async (d) => {
    d.sfx("door", 0.8);
    d.goto("lobby", "door");
  },
  enterArcade: async (d) => {
    d.sfx("door", 0.8);
    d.goto("arcade", "door");
  },

  signpost: async (d) => {
    await d.say("narrator", "Praia para um lado, floresta para o outro. O hotel é o prédio com um sol sorrindo.");
  },

  duck: async (d) => {
    await d.action("duckSqueak");
    await d.say("narrator", repeatLine(d.s, "duck", ["Um patinho de borracha relaxando na banheira. Ele parece estar de férias há décadas.", "Quén. O patinho gira e volta a relaxar.", "O patinho está concentrado. Melhor não atrapalhar."]));
    await bump(d, "duck");
  },

  tilt: async (d) => {
    const f = d.s.flags;
    d.meet("tilt");
    if (f.ended) {
      await d.say("tilt", d.s.ending === "on" ? "CONTINUE? SIM! Sempre sim!" : "GAME OVER? Que nada. O jogo continua ligado!", "happy");
      return;
    }
    if (f.tiltWon) {
      await d.say("tilt", repeatLine(d.s, "tilt", ["Você é oficialmente o jogador número 1. E o número 2. Não tem mais ninguém.", "Se achar fichas douradas, tem uma máquina atrás da cortina. Eu não disse nada.", "Meus pixels ainda estão tremendo de emoção."]), "happy");
      await bump(d, "tilt");
      return;
    }
    if (!f.metTilt) {
      d.set("metTilt");
      await d.say("tilt", "Ah, não. Um jogador. Não olhe pra mim, eu estou horrível.", "sad");
      await d.say("deco", "Você tá com o controle remoto do resort?");
      await d.say("tilt", "O CONTROLE? Ele é meu! Quer dizer... emprestado. Há vinte anos.", "surprised");
      await d.say("tilt", "Estou preso na fase 404. Enquanto não passar de fase, não devolvo nada. É uma regra minha.", "sad");
      d.objective();
    }
    const pick = await d.ask("tilt", "Você joga por mim? Por favorzinho?", ["Eu passo a fase pra você!", "Depois eu volto."], "sad");
    if (pick === 1) {
      await d.say("tilt", "Tudo bem. Eu espero. Eu sou ótimo em esperar.", "sad");
      return;
    }
    await d.say("tilt", "Pegue os sinais e desvie do chuvisco. Dez sinais e eu passo de fase!", "happy");
    await d.action("arcade");
    d.set("tiltWon");
    await d.say("tilt", "FASE 404... COMPLETA! Que emoção!", "happy");
    await d.say("tilt", "Toma. O controle mestre. Ele não troca só de canal. Ele pausa as coisas.", "talk");
    await d.give("remote");
    await d.say("deco", "Pausa as coisas?", "surprised");
    await d.say("tilt", "Uma vez eu pausei o mar. A gaivota da praia ficou uma semana sem falar comigo.", "talk");
    d.discover("pause");
    d.set("tokensHint");
    await d.say("tilt", "Ah, e se achar fichas douradas... tem uma máquina atrás da cortina. Eu não disse nada.", "look");
    d.objective();
  },

  cabA: async (d) => {
    await d.action("burst:cabA");
    await d.say("narrator", "RUA SEM SAÍDA. Recorde: derrubar o gnomo do vizinho 404 vezes. Assinado: TILT.");
  },
  cabB: async (d) => {
    await d.action("burst:cabB");
    await d.say("narrator", "LABORATÓRIO DE PÉSSIMAS IDEIAS. A tela sugere ligar o liquidificador no ventilador. Péssima ideia. Ótima ideia.");
  },
  cabC: async (d) => {
    await d.action("burst:cabC");
    await d.say("narrator", "GUERRA DE LANCHE. A tela grita 'ABAIXE-SE!' e você abaixa por reflexo.");
  },
  cabD: async (d) => {
    if (d.s.flags.sawBroken) {
      await d.action("burst:cabD");
      await d.say("narrator", "FORA DE SERVIÇO. Mas ela acabou de piscar pra você?");
      return;
    }
    d.set("sawBroken");
    await d.say("narrator", "Uma máquina FORA DE SERVIÇO. Você dá um tapinha de leve na lateral...");
    d.act();
    await d.action("brokenScreen");
    await d.say("deco", "Onde a água faz chiado... onde fica isso?", "surprised");
    d.discover("broken");
  },
  records: async (d) => {
    const rows = ["1. TILT, 404.404 pontos."];
    if (d.s.secrets.includes("machine")) rows.push("DEC, 999.999 pontos. Ninguém sabe quem é DEC.");
    rows.push("PLACAR, 9.999 pontos.");
    if (d.s.flags.tiltWon) rows.push("DÉCO: fase 404 concluída. Escrito à mão, com capricho.");
    await d.say("narrator", `Quadro de recordes: ${rows.join(" ")}`);
    if (!d.s.flags.ended) await d.say("placar", "Não encoste no quadro. Ele é oficial.", "look");
  },
  posterPijama: async (d) => d.say("narrator", "'GUERRA DO PIJAMA: EM BREVE NO FLIPERAMA.' O 'em breve' foi escrito por cima de 'nunca'."),
  placar: async (d) => {
    const f = d.s.flags;
    d.meet("placar");
    if (f.ended) {
      await d.say("placar", d.s.ending === "on" ? "Ainda no ar. Recorde de tempo no ar: infinito. Vou precisar de um papel maior." : "Fora do ar, mas o fliperama segue aberto. Recordes não tiram férias.", "happy");
      return;
    }
    if (!f.metPlacar) {
      d.set("metPlacar");
      await d.say("placar", "Placar, funcionário do mês. Do mês de dezembro de 2004.", "normal");
      await d.say("placar", "Eu anoto todos os recordes. Todos. Até os que ninguém bateu.", "talk");
      return;
    }
    if (f.tiltWon && !f.placarStamp) {
      d.set("placarStamp");
      await d.say("placar", "Você passou da fase 404 do Tilt? Isso pede um carimbo oficial.", "surprised");
      await d.action("stamp");
      await d.say("placar", "Pronto. Agora você está no quadro de recordes. Na última linha, mas está.", "happy");
      return;
    }
    await d.say("placar", repeatLine(d.s, "placar", ["No dia 4 de dezembro de 2004, todas as telas daqui mostraram 404 ao mesmo tempo. Eu anotei.", "Desde aquele dia, o Tilt está preso na mesma fase. Eu também anotei.", "A máquina quebrada do canto às vezes acende sozinha. Isso não está no regulamento."]), "talk");
    await bump(d, "placar");
  },
  claw: async (d) => {
    d.act();
    await d.say("narrator", "Você tenta pegar a bolinha dourada. A garra pega o ar com muita confiança.");
  },
  pinball: async (d) => d.say("narrator", "BUM! A bolinha está presa no mesmo lugar desde sempre."),
  hockey: async (d) => d.say("narrator", "O disco está grudado na mesa. Tem um chiclete de 2003 embaixo."),
  prizes: async (d) => d.say("narrator", "Um pato de borracha custa 9.000 tickets. Alguém juntou isso uma vez. Ninguém sabe quem."),

  curtain: async (d) => {
    d.act();
    d.sfx("open", 0.8);
    await d.action("openCurtain");
    await d.say("narrator", "Atrás da cortina tem uma máquina dourada, toda empoeirada.");
    d.set("tokensHint");
  },

  goldMachine: async (d) => {
    if (d.s.secrets.includes("machine")) {
      await d.say("narrator", "A máquina dourada continua acesa. DEC continua em primeiro lugar.");
      return;
    }
    const n = d.s.tokens.length;
    if (n < 3) {
      await d.say("narrator", `INSIRA 3 FICHAS DOURADAS. Você tem ${n}.`);
      if (n === 0) await d.say("deco", "Fichas douradas... onde será que tem isso?");
      d.set("tokensHint");
      return;
    }
    d.act();
    await d.say("narrator", "Você coloca as três fichas. A máquina acorda com um barulho de festa.");
    await d.action("goldMachine");
    await d.say("narrator", "RECORDES: 1. DEC  999.999   2. LIN  404.404   3. BRU  12");
    await d.say("deco", "DEC? Sou eu? Eu nunca joguei isso!", "surprised");
    await d.say("narrator", "A tela pisca: AINDA.");
    await d.secret("machine");
  },

  marisa: async (d) => {
    const f = d.s.flags;
    d.meet("marisa");
    if (f.ended) {
      await d.say("marisa", "Férias que nunca acabam. Eu sempre soube que era uma boa ideia.", "happy");
      return;
    }
    if (f.gotOrder) {
      await d.say("marisa", "Uma garrafa com recado? Clássico. Tem coisa que só o mar entrega.", "happy");
      return;
    }
    if (d.has("remote")) {
      await d.say("marisa", "Isso aí é o controle mestre? O Tilt pausou o mar uma vez. Fiquei com uma onda parada na cara por uma semana.", "look");
      await d.say("marisa", "Se for pausar, pausa ali na beira, perto da placa. E lembra de dar play depois.", "talk");
      d.set("metMarisa");
      d.set("marisaTip");
      d.objective();
      return;
    }
    if (!f.metMarisa) {
      d.set("metMarisa");
      await d.say("marisa", "As ondas tão off hoje. Mas o clima continua perfeito.");
      await d.say("deco", "Off?");
      await d.say("marisa", "Elas chegam sempre na mesma hora. Mesmo jeito, mesma espuma. Igual reprise.", "talk");
      await d.say("marisa", "Faz vinte anos que eu tô de férias. Ninguém nunca me mandou voltar.", "happy");
      d.discover("waves");
      return;
    }
    await d.say("marisa", repeatLine(d.s, "marisa", ["Olha lá. Onda das 4:04. De novo.", "O quiosque fecha pro almoço desde 2004. Almoço longo.", "Eu não estou de férias. Eu SOU as férias."]), "talk");
    await bump(d, "marisa");
  },

  shore: async (d) => {
    if (d.s.flags.gotOrder) return d.say("narrator", "O mar vai e volta. Agora que você sabe, parece mesmo uma reprise.");
    if (d.s.flags.seaPaused) return d.say("narrator", "O mar está pausado. A garrafa está ali na areia molhada.");
    if (!d.has("remote")) {
      await d.say("narrator", "O mar. Ele vai e volta. E vai. E volta. Sempre do mesmo jeito.");
      d.discover("waves");
      return;
    }
    d.act();
    await d.action("pauseSea");
    d.set("seaPaused");
    await d.say("narrator", "O mar parou no meio da onda e recuou. Tem uma garrafa presa na areia molhada!");
    d.discover("pause");
  },

  bottle: async (d) => {
    d.act();
    await d.give("order");
    d.set("gotOrder");
    await d.say("narrator", "Dentro da garrafa tem um papel: 'ORDEM FINAL: encerrar a transmissão do Resort Canal 404. Entregar na sala de transmissão, atrás da cachoeira.'");
    await d.say("deco", "Atrás da cachoeira... na floresta!", "surprised");
    d.discover("order");
    await d.action("playSea");
    d.objective();
  },

  shellToken: async (d) => {
    if (d.s.tokens.includes("shell")) return d.say("narrator", "Uma concha enorme. Dá pra ouvir o mar. A mesma onda de sempre.");
    d.act();
    await d.say("narrator", "Você encosta o ouvido na concha... e tem uma ficha dourada lá dentro!");
    await d.token("shell");
  },

  kiosk: async (d) => {
    const pick = await d.ask("narrator", "Fechado para almoço desde 2004. No balcão: um cardápio, um radinho e uma sineta.", ["Ler o cardápio", "Ligar o radinho", "Tocar a sineta"]);
    if (pick === 0) {
      await d.say("narrator", "Picolé de chuvisco. Água de coco safra 2004. Especial da casa: Sanduíche Fora do Ar, servido sem sinal.");
      return;
    }
    if (pick === 1) {
      await d.action("radioTune");
      await d.say("narrator", repeatLine(d.s, "radio", ["'...Canal 404, a sua... (chiado) ...sempre no ar...'", "'...previsão para hoje: ondas às 4:04. Como ontem. Como amanhã...'", "'...alguém aí? Aqui é a sala de... (chiado) ...câmbio...' Depois, só chiado."]));
      await bump(d, "radio");
      return;
    }
    await d.action("kioskBell");
    await d.say("narrator", "Ninguém aparece. Uma plaquinha gira sozinha: 'VOLTO EM 5 MINUTOS'. A tinta é de 2004.");
  },
  shells: async (d) => {
    d.act();
    d.sfx("wave", 0.4);
    await d.say("narrator", repeatLine(d.s, "shells", ["Você encosta uma conchinha no ouvido. Em vez do mar: '...e agora, de volta à nossa programação...'", "Na concha, bem baixinho: o tema de abertura do Canal 404. Desafinado.", "Só o mar. Uma reprise do mar, mas ainda assim o mar."]));
    await bump(d, "shells");
  },
  waveSign: async (d) => d.say("narrator", "ONDAS TODO DIA ÀS 4:04. Você olha em volta. Parece que são 4:04 agora."),
  sandcastle: async (d) => {
    await d.action("crabPop");
    await d.say("narrator", repeatLine(d.s, "castle", ["Um caranguejo sai do castelo, olha pra você e fecha a porta.", "O castelo está ocupado. Tem até campainha.", "Ninguém sabe quem fez esse castelo. O caranguejo sabe, mas não conta."]));
    await bump(d, "castle");
  },
  pierEnd: async (d) => {
    await d.action("lighthouseLook");
    await d.say("narrator", "Do fim do píer dá pra ver o farol. A luz pisca no ritmo de um sinal de TV.");
    await d.say("deco", "Quatro piscadas... uma pausa... quatro de novo.", "surprised");
  },
  surf: async (d) => {
    await d.action("surfWobble");
    await d.say("narrator", "Você encosta numa prancha e todas balançam como dominó. Ninguém surfa há anos, mas elas continuam enceradas.");
  },
  clique: async (d) => {
    const f = d.s.flags;
    d.meet("clique");
    if (f.photoDone) {
      await d.say("clique", f.ended ? "Tirei uma foto da festa. Saiu todo mundo de olho fechado. Perfeita." : "Essa foto vai para o álbum 'Férias que nunca acabam'. Volume 404.", "happy");
      return;
    }
    if (!f.metClique) {
      d.set("metClique");
      await d.say("clique", "Shh! A onda das 4:04 tá chegando. Eu quero a foto perfeita.", "talk");
      await d.action("cliqueTry");
      await d.say("clique", "Perdi de novo! Ela vem e vai embora rápido demais.", "sad");
      if (!d.has("remote")) return;
    }
    if (d.has("remote")) {
      const pick = await d.ask("deco", "Será que o controle mestre ajuda?", ["Pausar o mar para a foto", "Deixar pra depois"]);
      if (pick === 1) {
        await d.say("clique", "Tudo bem. A onda volta. Ela sempre volta.", "sad");
        return;
      }
      d.act();
      await d.action("cliquePhoto");
      d.set("photoDone");
      await d.say("clique", "PERFEITA! A onda parada no ar! Vinte anos tentando!", "happy");
      d.discover("photo");
      return;
    }
    await d.say("clique", repeatLine(d.s, "clique", ["Se ao menos desse pra pausar o mar...", "Eu já tirei 4.040 fotos. Todas de onda passando.", "Fica parado. Isso. Não, perdeu."]), "talk");
    await bump(d, "clique");
  },
  chips: async (d) => {
    await d.action("marisaGuard");
    await d.say("marisa", "Nem pense. Essas batatas são de 2004 e continuam crocantes.", "look");
  },

  lento: async (d) => {
    const f = d.s.flags;
    d.meet("lento");
    if (f.ended) {
      const first = !d.s.secrets.includes("lento");
      if (first) {
        await d.say("lento", "Cheguei! ...Perdi alguma coisa?", "surprised");
        await d.say("deco", "Só o fim da história. Mas foi bem legal.", "happy");
        await d.say("lento", "Que bom. Eu chego no próximo.", "talk");
        await d.secret("lento");
      }
      if (!f.gotKey) {
        await d.say("lento", "Ah, já ia esquecendo. Achei esta chave na praia em 2004. Era pra entregar na recepção.", "talk");
        d.set("gotKey");
        await d.action("lentoKeyless");
        await d.give("key");
        await d.say("deco", "Quarto 404? É o quarto trancado da recepção!", "surprised");
        return;
      }
      if (first) return;
      await d.say("lento", "Daqui eu não saio tão cedo. Tão cedo pra mim é daqui a uns dez anos.", "talk");
      return;
    }
    if (!f.gotKey) {
      await d.say("lento", "Ah... boa tarde. Ou bom dia. Qual é o horário de hoje?", "talk");
      await d.say("deco", "Você tá indo pra onde?");
      await d.say("lento", "Pra recepção. Achei uma chave aqui na praia em 2004. Tô levando.", "talk");
      await d.say("lento", "Já estou quase chegando. Faltam só uns... trezentos metros.", "talk");
      await d.say("lento", "Leva você. Você é mais rápido. Eu vou indo pra piscina. Sem pressa.", "talk");
      d.set("gotKey");
      await d.give("key");
      await d.say("deco", "Quarto 404? É o quarto trancado da recepção!", "surprised");
      return;
    }
    await d.say("lento", "Eu não tenho pressa. A pressa é que tem a mim. Não... era o contrário.", "talk");
  },

  psiu: async (d) => {
    const f = d.s.flags;
    d.meet("psiu");
    if (f.ended) {
      await d.say("psiu", d.s.ending === "off" ? "Fim da transmissão. Começo da conversa." : "Continua no ar. Psiu continua aqui. Psiu.", "happy");
      return;
    }
    if (f.fallPaused) {
      await d.say("psiu", "A porta sempre esteve aí. Só ninguém tinha apertado pausa.", "happy");
      return;
    }
    if (f.gotOrder || d.has("remote")) {
      await d.say("psiu", f.gotOrder ? "Você tem a ordem. Agora precisa da porta." : "Você tem o controle. A porta te espera.", "talk");
      await d.say("psiu", "O que cai sem parar... só para quando alguém aperta pausa.", "look");
      d.set("psiuRiddle");
      d.objective();
      return;
    }
    if (!f.metPsiu) {
      d.set("metPsiu");
      await d.say("psiu", "Psiu.");
      await d.say("deco", "Oi?", "surprised");
      await d.say("psiu", "Todo mundo foi embora... mas algumas coisas preferem ficar no escuro.", "talk");
      await d.say("psiu", "Volte com algo que pause. E com o que o mar trouxer.", "look");
      return;
    }
    await d.say("psiu", repeatLine(d.s, "psiu", ["Psiu.", "A antena ainda canta. Alguém precisa ouvir.", "O fliperama sabe. O mar guarda."]), "look");
    await bump(d, "psiu");
  },

  fall: async (d) => {
    if (d.s.flags.fallPaused) return d.say("narrator", "A cachoeira está pausada. A porta está à vista.");
    if (!d.has("remote")) {
      await d.action("fallFlicker");
      await d.say("narrator", "Uma cachoeira enorme. Por um instante, a água treme como imagem de TV. O barulho parece chiado.");
      return;
    }
    d.act();
    await d.action("pauseFall");
    d.set("fallPaused");
    await d.say("narrator", "A água congela no ar, cheia de chiado. Atrás dela tem uma porta: SALA DE TRANSMISSÃO.");
    d.discover("door");
    d.objective();
  },

  stationDoor: async (d) => {
    d.sfx("door", 0.8);
    d.goto("station", "door");
  },

  placardArch: async (d) => d.say("narrator", "TREM FANTASMA 404: passava por dentro da cachoeira. Fechado para manutenção em 2004."),
  placardStatue: async (d) => d.say("narrator", "Estátua do mascote do Canal 404. Alguém deixou uma flor fresquinha aqui."),
  placardDish: async (d) => {
    await d.action("dishWobble");
    await d.say("narrator", "ANTENA 404: transmite o sinal do canal para todo o resort. NÃO DESLIGUE SEM A ORDEM FINAL.");
    if (d.s.flags.ended) await d.say("deco", d.s.ending === "off" ? "Ela continua girando. Por hábito, acho." : "Continua no ar. Do jeito que eles queriam.");
    else if (d.has("order")) await d.say("deco", "A ordem final... está comigo.", "surprised");
    else await d.say("deco", "Ordem final? Que ordem?");
    d.discover("antenna");
  },
  booth: async (d) => {
    await d.action("ticketPrint");
    await d.say("narrator", repeatLine(d.s, "ticket", ["Um bilhete sai da janelinha: 'TREM FANTASMA 404. VÁLIDO PARA 2005.' Ainda não chegou 2005.", "Outro bilhete: 'Lugar na janela. A janela dá para a cachoeira.'", "A bilheteria imprime: 'ESGOTADO'. Você é a única pessoa na fila."]));
    await bump(d, "ticket");
  },
  horse: async (d) => d.say("narrator", "Um cavalinho de carrossel no meio do mato. Ele parece estar esperando a música voltar."),
  cavuca: async (d) => {
    const f = d.s.flags;
    d.meet("cavuca");
    if (f.ended) {
      await d.say("cavuca", "Achei a saída! Era a entrada. Mas agora eu sei onde fica.", "happy");
      return;
    }
    if (!f.metCavuca) {
      d.set("metCavuca");
      await d.say("cavuca", "Ah! Um colega explorador! Dr. Cavuca, cartógrafo oficial desta floresta.", "happy");
      await d.say("deco", "Você tá andando em círculo.");
      await d.say("cavuca", "Estou mapeando esta clareira. De todos os lados. Várias vezes.", "talk");
      return;
    }
    if (f.fallPaused) {
      await d.say("cavuca", "A cachoeira parou! Eu SABIA que ela estava com defeito. Está anotado.", "surprised");
      return;
    }
    await d.say("cavuca", repeatLine(d.s, "cavuca", ["Aquela antena ali? Um ninho de satélite. Eles botam ovos de sinal.", "Anotei no mapa: 'cachoeira com defeito, faz chiado'. Vou mandar consertar.", "O norte fica para cima. Ou para baixo, se o mapa estiver de ponta-cabeça. O meu está."]), "talk");
    await bump(d, "cavuca");
  },
  chiado: async (d) => {
    d.meet("chiado");
    await d.action("chiadoHello");
    await d.say("narrator", "Um pedacinho de chiado com olhos. Ele faz 'bzz' e fica feliz quando você não se mexe.");
    d.discover("creature");
    await d.action("chiadoBye");
  },
  mushrooms: async (d) => {
    await d.action("mushGlow");
    await d.say("narrator", repeatLine(d.s, "mush", ["Os cogumelos acendem como as luzes de uma TV ligando.", "Eles tocam um acorde. Dó maior, segundo o Tilt.", "Pisca, pisca. Parecem estar sintonizando alguma coisa."]));
    await bump(d, "mush");
  },
  bridge: async (d) => {
    await d.action("bridgeBars");
    await d.say("narrator", "Por um segundo, o riacho reflete barras coloridas. Como uma TV fora do ar.");
    d.discover("bridge");
  },
  treehouse: async (d) => d.say("narrator", "Uma casa na árvore com luzinhas. Lá dentro, alguém assiste chuvisco com muita atenção."),
  logToken: async (d) => {
    if (d.s.tokens.includes("log")) return d.say("narrator", "Um tronco oco. Só tem um besouro de óculos.");
    d.act();
    await d.say("narrator", "Dentro do tronco oco tem uma ficha dourada!");
    await d.token("log");
  },

  monitors: async (d) => {
    await d.say("narrator", "Cada tela mostra um canto do resort, ao vivo. Na tela três, o Sr. Bigodes boceja.");
    d.discover("monitors");
  },
  calendar: async (d) => {
    await d.say("narrator", "Dezembro de 2004. Alguém circulou o dia 4 e escreveu: 'último dia?'");
    d.discover("calendar");
  },
  mug: async (d) => d.say("narrator", "Uma caneca de café de 2004. Ainda quente. Esse lugar tem regras próprias."),
  tape: async (d) => {
    await d.say("narrator", "Um gravador cheio de fitas. A etiqueta da última diz: 'PROGRAMAÇÃO DE FÉRIAS — REPETIR PARA SEMPRE'.");
    await d.say("deco", "Para sempre é bastante tempo.", "surprised");
  },
  stationWindow: async (d) => d.say("narrator", "Lá fora, a antena pisca devagar. Como se estivesse respirando."),
  button: async (d) => {
    if (!d.has("order")) return d.say("narrator", "FIM DA TRANSMISSÃO. Embaixo, um bilhete: 'Só com a ordem final.'");
    return SCRIPTS.console(d);
  },
  console: async (d) => {
    if (d.s.flags.ended) {
      await d.say("narrator", d.s.ending === "off" ? "A mesa de corte está desligada. Ainda assim, todas as telas continuam acesas." : "A mesa de corte zumbe feliz. AO VIVO, diz a luz vermelha.");
      return;
    }
    if (!d.has("order")) {
      await d.say("narrator", "A mesa de corte. Tem uma fenda escrita ORDEM FINAL.");
      if (!d.s.flags.gotOrder) await d.say("deco", "A ordem final... onde será que está?");
      return;
    }
    d.act();
    await d.say("narrator", "Você coloca a ordem final na fenda. A sala inteira pisca.");
    d.take("order");
    await d.action("monitorsOn");
    await d.say("deco", "Então é isso. O resort ficou ligado porque ninguém mandou desligar.");
    await d.action("feed:bigodes");
    await d.say("bigodes", "Ah. Você achou a sala.", "look");
    await d.action("feed:marisa");
    await d.say("marisa", "A gente meio que sabia.", "talk");
    await d.action("feed:marola");
    await d.say("marola", "Sabia e não contou! Sempre alerta... mas nem tanto.", "talk");
    await d.action("feed:tilt");
    await d.say("tilt", "Ninguém quis apertar o botão. Ninguém queria GAME OVER.", "sad");
    await d.action("psiuIn");
    await d.say("psiu", "Algumas coisas preferem ficar no ar.", "talk");
    d.discover("twist");
    await d.say("psiu", "A decisão é sua. Qualquer uma está bem.", "happy");
    const pick = await d.ask("deco", "O que você faz?", ["Encerrar a transmissão", "Deixar no ar"]);
    d.set("ended");
    d.s.ending = pick === 0 ? "off" : "on";
    if (pick === 0) {
      await d.action("endOff");
      await d.say("narrator", "...e nada acontece.");
      await d.action("lightsBack");
      await d.say("bigodes", "Eu DISSE que estava tudo normal.", "happy");
      await d.say("psiu", "A transmissão acabou. As férias, não.", "happy");
    } else {
      await d.say("narrator", "Você guarda a ordem numa gaveta escrita DEPOIS.");
      await d.action("endOn");
      await d.say("tilt", "CONTINUE? SIM!", "happy");
      await d.say("marisa", "Eu sabia que você ia gostar daqui.", "happy");
    }
    await d.action("party");
  },

  mascot: async (d) => {
    if (d.s.flags.metMascot) {
      await d.say("mascot", "Zzz... só mais cinco anos...", "normal");
      return;
    }
    d.meet("mascot");
    d.set("metMascot");
    await d.action("mascotWake");
    await d.say("mascot", "AH! Um espectador! Faz tanto tempo!", "surprised");
    await d.say("deco", "Você é o 404? O do canal?", "surprised");
    await d.say("mascot", "O próprio! Quando o canal saiu do ar, eu vim tirar umas férias. Vinte anos de férias. Recomendo.", "happy");
    await d.say("mascot", "Pode levar o cartucho dourado da mesinha. Ele estava perdido. Igual a mim.", "happy");
    await d.action("mascotSleep");
  },

  cartridge: async (d) => {
    d.act();
    await d.give("cartridge");
    await d.say("narrator", "Na etiqueta do cartucho: 'FÉRIAS FORA DO AR'.");
    await d.say("deco", "Ué. É este jogo.", "surprised");
    await d.secret("room404");
  },

  tv404: async (d) => d.say("narrator", "Chuvisco. Mas um chuvisco aconchegante, de quarto de hotel."),
};

export const POSTER_SCRIPT = (id: PosterId) => async (d: Director) => {
  if (d.s.posters.includes(id)) {
    await d.say("narrator", `${POSTER_INFO[id].title}. Já está anotado no seu diário.`);
    return;
  }
  await d.say("narrator", POSTER_INFO[id].text);
  await d.poster(id);
};

export function hasMain(s: State, who: FolkKey) {
  const f = s.flags;
  const has = (i: Item) => s.items.includes(i);
  if (f.ended) return who === "lento" && !s.secrets.includes("lento") ? "!" : null;
  switch (who) {
    case "bigodes":
      return !f.talkedBigodes ? "!" : null;
    case "marola":
      return (f.talkedBigodes && !f.metMarola) || has("whistle") ? "!" : null;
    case "tilt":
      return !f.tiltWon && (f.whistleReturned || f.metTilt) ? "!" : null;
    case "marisa":
      return has("remote") && !f.gotOrder && !f.marisaTip ? "!" : null;
    case "psiu":
      return "?";
    case "lento":
      return !f.gotKey ? "!" : null;
    case "mascot":
      return !f.metMascot ? "!" : null;
    case "clique":
      return has("remote") && !f.photoDone ? "?" : null;
  }
  return null;
}

export const TOTALS = { posters: ALL_POSTERS.length, tokens: ALL_TOKENS.length, secrets: ALL_SECRETS.length };
