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

const FIRST_WIN = ["O quarto ficou pequeno pra você! A guerra continua na sala.", "Nem o sofá segurou essa vitória! Próxima parada: quintal.", "Você dominou a guerra de travesseiros!"];

const REPLAY_NEXT_OPEN = ["O quarto é seu de novo. A sala ainda está esperando.", "A sala é sua outra vez. O quintal ainda está esperando."];

const REPLAY_DONE = ["O quarto continua sendo seu. Que tal uma revanche no quintal?", "Nem o sofá, nem as poltronas. A sala é sua de novo!", "O quintal continua sendo seu. Ninguém segura essa guerra!"];

const ARENA_SHOUT = ["O quarto é seu!", "A sala é sua!", "O quintal é seu!"];

const LOSE_PLACE = ["ficou com o quarto", "ficou com a sala", "ficou com o quintal"];

export function winShout(arena: number) {
  return ARENA_SHOUT[arena] ?? "Último de pé!";
}

export function resultCopy(c: ResultContext) {
  const last = c.arena >= c.total - 1;
  if (c.won) {
    const first = !c.beatenBefore[c.arena];
    const nextOpen = !last && !c.beatenBefore[c.arena + 1];
    let text: string;
    if (first) text = FIRST_WIN[c.arena] ?? "Último de pé! Mais uma partida?";
    else if (nextOpen) text = REPLAY_NEXT_OPEN[c.arena] ?? "Último de pé! Mais uma partida?";
    else text = REPLAY_DONE[c.arena] ?? "Último de pé! Mais uma partida?";
    return { title: first && last ? (c.kid === "nico" ? "Campeão do pijama!" : "Campeã do pijama!") : "Você ganhou!", text };
  }
  if (c.place === 2 && c.winner) {
    const name = KID_INFO[c.winner].name;
    return { title: "Quase!", text: `${name} ${LOSE_PLACE[c.arena] ?? "ficou de pé no final"}. Revanche?` };
  }
  const first = c.kid === "nico" ? "o primeiro" : "a primeira";
  return { title: "Fora da guerra!", text: `Você foi ${first} a cair. Mais uma partida?` };
}
