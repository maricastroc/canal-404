import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import { KID_INFO, type KidId } from "./config";

export type ResultContext = {
  arena: number;
  total: number;
  won: boolean;
  place: number;
  kid: KidId;
  winner: KidId | null;
  beatenBefore: boolean[];
};

export const COPY = localized({
  "pt-BR": {
    result: {
      firstWin: ["O quarto ficou pequeno pra você! A guerra continua na sala.", "Nem o sofá segurou essa vitória! Próxima parada: quintal.", "Você dominou a guerra de travesseiros!"],
      replayNextOpen: ["O quarto é seu de novo. A sala ainda está esperando.", "A sala é sua outra vez. O quintal ainda está esperando."],
      replayDone: ["O quarto continua sendo seu. Que tal uma revanche no quintal?", "Nem o sofá, nem as poltronas. A sala é sua de novo!", "O quintal continua sendo seu. Ninguém segura essa guerra!"],
      arenaShout: ["O quarto é seu!", "A sala é sua!", "O quintal é seu!"],
      losePlace: ["ficou com o quarto", "ficou com a sala", "ficou com o quintal"],
      loseFallback: "ficou de pé no final",
      lastStanding: "Último de pé!",
      lastStandingAgain: "Último de pé! Mais uma partida?",
      champion: (kid: KidId): string => (kid === "nico" ? "Campeão do pijama!" : "Campeã do pijama!"),
      won: "Você ganhou!",
      almost: "Quase!",
      second: (name: string, place: string) => `${name} ${place}. Revanche?`,
      out: "Fora da guerra!",
      firstOut: (kid: KidId) => `Você foi ${kid === "nico" ? "o primeiro" : "a primeira"} a cair. Mais uma partida?`,
    },
    score: {
      hits: (n: number) => `Acertos (${n})`,
      kos: (n: number) => `Nocautes (${n})`,
      win: "Último de pé",
      hp: (n: number) => `Energia que sobrou (${n})`,
      second: "2º lugar",
    },
    arena: {
      hitWords: ["POF!", "PAF!", "FLOF!", "TUF!"],
      taunts: ["ERROU!", "NEM PERTO!", "HA!"],
      hints: {
        ricochet: "Use os móveis para fazer seus travesseiros ricochetearem!",
        special: "Um travesseiro especial pode aparecer! Pegue antes dos outros!",
      },
      controlsTouch: "Arraste o polegar na esquerda para andar. Toque na direita para jogar.",
      controlsKeys: "WASD ou setas: andar. Mouse: mirar. Clique ou espaço: jogar.",
      hearts: (hp: number) => {
        const whole = Math.floor(hp / 2);
        const half = hp % 2 === 1;
        if (whole === 0) return "Resta meio coração";
        const hearts = `${whole} ${whole === 1 ? "coração" : "corações"}`;
        return `${whole === 1 ? "Resta" : "Restam"} ${hearts}${half ? " e meio" : ""}`;
      },
      ready: "PRONTOS?",
      readySub: "Último de pé vence!",
      intro: (arena: string, kid: KidId) => `${arena}. Você é ${kid === "nico" ? "o" : "a"} ${KID_INFO[kid].name}. Acerte os outros dois. Último de pé vence!`,
      go: "JÁ!",
      you: "VOCÊ",
      giant: "TRAVESSEIRÃO!",
      giantDropped: "Um travesseirão caiu no quintal! Quem pegar joga um travesseiro gigante.",
      yours: "É SEU!",
      grabbed: "PEGOU!",
      youGrabbed: "Você pegou o travesseirão! O próximo travesseiro é gigante.",
      kidGrabbed: (name: string) => `${name} pegou o travesseirão!`,
      shoved: "UÉ!",
      hiding: ["ESCONDIDO?", "VEM BRINCAR!"],
      truce: "Trégua! Os outros dois vão atrás de você. Acerte alguém para desfazer.",
      phew: "UFA!",
      close: "QUASE!",
      incoming: (name: string) => `${name} vai jogar em você!`,
      hit: (hearts: string) => `Acertaram você! ${hearts}.`,
      thump: "TUM!",
      knockout: "NOCAUTE!",
      youOut: "Você foi nocauteado!",
      kidOut: (name: string) => `${name} está fora!`,
      heat: "ESQUENTOU!",
      heatSub: "A energia volta mais devagar.",
      heatSay: "A guerra esquentou! A energia volta mais devagar.",
      final: "SEM DESCANSO!",
      finalSub: "Ninguém recupera mais energia.",
      finalSay: "Sem descanso! Ninguém recupera mais energia.",
      youWin: "VOCÊ VENCEU!",
      kidWins: (name: string) => `${name.toUpperCase()} VENCEU!`,
      again: "Mais uma partida?",
      lost: "Você saiu da guerra.",
      summary: (time: string, throws: number, hits: number) => `Tempo ${time} · Travesseiros ${throws} · Acertos ${hits}`,
      starHint: (stars: number): string => (stars === 1 ? "Termine com 4 de energia ou mais para 2 estrelas, e com 7 para 3." : "Termine com 7 de energia ou mais para 3 estrelas."),
      alt: "Trocar personagem",
    },
    select: {
      title: "ESCOLHA SEU PERSONAGEM!",
      arena: (n: number, title: string) => `ARENA ${n}: ${title.toUpperCase()}`,
      bars: ["VELOCIDADE", "ATAQUE", "RECUPERAÇÃO"],
      touchHint: "Toque num personagem",
      swipeHint: "Deslize ou toque para trocar",
      keysHint: "Setas para escolher. Enter para começar.",
      start: "COMEÇAR",
      intro: "Escolha seu personagem: Lia, a veloz. Nico, o atirador. Bia, a resistente. Use as setas e aperte Enter.",
      picked: (name: string, role: string) => `${name}, ${role.toLowerCase()}.`,
    },
    hud: {
      you: "VOCÊ",
      out: "FORA",
      throw: "JOGAR",
      move: "ANDAR",
      moveHelp: "ARRASTE PARA ANDAR",
      throwHelp: "TOQUE PARA JOGAR",
      aimHelp: "ARRASTE PARA MIRAR",
    },
    tv: {
      onAir: "NO AR",
      cartoon: "FOGUETE 404",
      forecast: "PREVISÃO",
    },
  },
  en: {
    result: {
      firstWin: ["The bedroom got too small for you! The war moves to the living room.", "Not even the sofa could stop you! Next stop: the backyard.", "You ruled the pillow war!"],
      replayNextOpen: ["The bedroom is yours again. The living room is still waiting.", "The living room is yours again. The backyard is still waiting."],
      replayDone: ["The bedroom is still yours. How about a rematch in the backyard?", "Not the sofa, not the armchairs. The living room is yours again!", "The backyard is still yours. Nobody can stop this war!"],
      arenaShout: ["The bedroom is yours!", "The living room is yours!", "The backyard is yours!"],
      losePlace: ["took the bedroom", "took the living room", "took the backyard"],
      loseFallback: "was the last one standing",
      lastStanding: "Last one standing!",
      lastStandingAgain: "Last one standing! Another round?",
      champion: () => "Pajama champion!",
      won: "You won!",
      almost: "So close!",
      second: (name: string, place: string) => `${name} ${place}. Rematch?`,
      out: "Knocked out!",
      firstOut: () => "You were the first one out. Another round?",
    },
    score: {
      hits: (n: number) => `Hits (${n})`,
      kos: (n: number) => `Knockouts (${n})`,
      win: "Last one standing",
      hp: (n: number) => `Energy left (${n})`,
      second: "2nd place",
    },
    arena: {
      hitWords: ["POW!", "WHAP!", "FLUMP!", "WHUMP!"],
      taunts: ["MISSED!", "NOT EVEN CLOSE!", "HA!"],
      hints: {
        ricochet: "Bounce your pillows off the furniture!",
        special: "A special pillow may show up! Grab it before the others do!",
      },
      controlsTouch: "Drag your left thumb to move. Tap on the right to throw.",
      controlsKeys: "WASD or arrows: move. Mouse: aim. Click or space: throw.",
      hearts: (hp: number) => {
        const whole = Math.floor(hp / 2);
        const half = hp % 2 === 1;
        if (whole === 0) return "Half a heart left";
        if (half) return `${whole} and a half hearts left`;
        return `${whole} ${whole === 1 ? "heart" : "hearts"} left`;
      },
      ready: "READY?",
      readySub: "Last one standing wins!",
      intro: (arena: string, kid: KidId) => `${arena}. You are ${KID_INFO[kid].name}. Hit the other two. Last one standing wins!`,
      go: "GO!",
      you: "YOU",
      giant: "GIANT PILLOW!",
      giantDropped: "A giant pillow fell in the backyard! Whoever grabs it gets a giant throw.",
      yours: "IT'S YOURS!",
      grabbed: "GOT IT!",
      youGrabbed: "You grabbed the giant pillow! Your next throw is giant.",
      kidGrabbed: (name: string) => `${name} grabbed the giant pillow!`,
      shoved: "WHOA!",
      hiding: ["HIDING?", "COME PLAY!"],
      truce: "Truce! The other two are coming for you. Hit someone to break it.",
      phew: "PHEW!",
      close: "CLOSE!",
      incoming: (name: string) => `${name} is about to throw at you!`,
      hit: (hearts: string) => `You got hit! ${hearts}.`,
      thump: "BOOM!",
      knockout: "KNOCKOUT!",
      youOut: "You got knocked out!",
      kidOut: (name: string) => `${name} is out!`,
      heat: "HEATING UP!",
      heatSub: "Energy comes back slower.",
      heatSay: "The war is heating up! Energy comes back slower.",
      final: "NO REST!",
      finalSub: "Nobody gets energy back now.",
      finalSay: "No rest! Nobody gets energy back now.",
      youWin: "YOU WIN!",
      kidWins: (name: string) => `${name.toUpperCase()} WINS!`,
      again: "Another round?",
      lost: "You're out of the war.",
      summary: (time: string, throws: number, hits: number) => `Time ${time} · Pillows ${throws} · Hits ${hits}`,
      starHint: (stars: number) => (stars === 1 ? "Finish with 4 or more energy for 2 stars, and 7 for 3." : "Finish with 7 or more energy for 3 stars."),
      alt: "Change character",
    },
    select: {
      title: "PICK YOUR CHARACTER!",
      arena: (n: number, title: string) => `ARENA ${n}: ${title.toUpperCase()}`,
      bars: ["SPEED", "ATTACK", "RECOVERY"],
      touchHint: "Tap a character",
      swipeHint: "Swipe or tap to switch",
      keysHint: "Arrows to pick. Enter to start.",
      start: "START",
      intro: "Pick your character: Lia, the fast one. Nico, the thrower. Bia, the tough one. Use the arrows and press Enter.",
      picked: (name: string, role: string) => `${name}, ${role.toLowerCase()}.`,
    },
    hud: {
      you: "YOU",
      out: "OUT",
      throw: "THROW",
      move: "MOVE",
      moveHelp: "DRAG TO MOVE",
      throwHelp: "TAP TO THROW",
      aimHelp: "DRAG TO AIM",
    },
    tv: {
      onAir: "ON AIR",
      cartoon: "ROCKET 404",
      forecast: "FORECAST",
    },
  },
});

export type PajamaCopy = (typeof COPY)[Locale];

export function winShout(arena: number, locale: Locale) {
  const t = COPY[locale].result;
  return t.arenaShout[arena] ?? t.lastStanding;
}

export function resultCopy(c: ResultContext, locale: Locale) {
  const t = COPY[locale].result;
  const last = c.arena >= c.total - 1;
  if (c.won) {
    const first = !c.beatenBefore[c.arena];
    const nextOpen = !last && !c.beatenBefore[c.arena + 1];
    let text: string;
    if (first) text = t.firstWin[c.arena] ?? t.lastStandingAgain;
    else if (nextOpen) text = t.replayNextOpen[c.arena] ?? t.lastStandingAgain;
    else text = t.replayDone[c.arena] ?? t.lastStandingAgain;
    return { title: first && last ? t.champion(c.kid) : t.won, text };
  }
  if (c.place === 2 && c.winner) {
    const name = KID_INFO[c.winner].name;
    return { title: t.almost, text: t.second(name, t.losePlace[c.arena] ?? t.loseFallback) };
  }
  return { title: t.out, text: t.firstOut(c.kid) };
}
