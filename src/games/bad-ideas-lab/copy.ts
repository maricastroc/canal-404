import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import type { PartType } from "./config";
import type { Edge } from "./geometry";
import type { ButtonSide, Direction, End, Exit, HZone, PathRelation, Rank, Side, VZone } from "./narration";

export type Noun = { word: string; female: boolean; numbered?: boolean };

export const noun = (word: string, female = false): Noun => ({ word, female });

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type FailKind = "out" | "stopped" | "timeout";

function join(items: string[], and: string) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")}${and}${items[items.length - 1]}`;
}

const theP = (n: Noun) => `${n.female ? "a" : "o"} ${n.word}`;
const ofP = (n: Noun) => `${n.female ? "da" : "do"} ${n.word}`;
const inP = (n: Noun) => `${n.female ? "na" : "no"} ${n.word}`;
const nameP = (n: Noun) => capitalize(theP(n));
const stepsP = (n: number) => (n === 1 ? "1 passo" : `${n} passos`);
const listP = (items: string[]) => join(items, " e ");
const sideP = (side: Side) => (side === "right" ? "direita" : "esquerda");
const edgeDistanceP = (n: number, edge: string) => (n === 0 ? `na borda ${edge}` : `${stepsP(n)} da borda ${edge}`);
const H_ZONE_P: Record<HZone, Noun> = { leftCorner: noun("canto esquerdo"), left: noun("esquerda", true), center: noun("centro"), right: noun("direita", true), rightCorner: noun("canto direito") };
const V_ZONE_P: Record<VZone, Noun> = { floor: noun("chão"), high: noun("alto"), middle: noun("meio da altura"), low: noun("parte de baixo", true) };
const atZoneP = (n: Noun) => (n.female ? `à ${n.word}` : `no ${n.word}`);
const SIDE_TEXT_P: Record<HZone, string> = { leftCorner: "no canto esquerdo", left: "à esquerda", center: "no centro", right: "à direita", rightCorner: "no canto direito" };
const HEIGHT_TEXT_P: Record<VZone, string> = { floor: "embaixo, no chão", high: "no alto", middle: "no meio da altura", low: "embaixo" };
const RANK_P: Record<Rank, string> = { top: "de cima", middle: "do meio", bottom: "de baixo", left: "da esquerda", right: "da direita" };
const EDGE_P: Record<Edge, string> = { left: "esquerda", right: "direita", top: "de cima", bottom: "de baixo" };
const END_P: Record<End, string> = { upper: "ponta de cima", lower: "ponta de baixo", left: "ponta esquerda", right: "ponta direita" };
const DIRECTION_P: Record<Direction, string> = { left: "Esquerda", right: "Direita", up: "Para cima", down: "Para baixo" };
const BUTTON_P: Record<ButtonSide, string> = { left: "no lado esquerdo", right: "no lado direito", top: "em cima" };
const EXIT_P: Record<NonNullable<Exit>, string> = { left: "pela esquerda", right: "pela direita", bottom: "por baixo" };

const theE = (n: Noun) => (n.numbered ? n.word : `the ${n.word}`);
const nameE = (n: Noun) => capitalize(theE(n));
const stepsE = (n: number) => (n === 1 ? "1 step" : `${n} steps`);
const listE = (items: string[]) => join(items, " and ");
const H_ZONE_E: Record<HZone, { at: string; name: string }> = {
  leftCorner: { at: "in the left corner", name: "the left corner" },
  left: { at: "on the left", name: "the left" },
  center: { at: "in the center", name: "the center" },
  right: { at: "on the right", name: "the right" },
  rightCorner: { at: "in the right corner", name: "the right corner" },
};
const V_ZONE_E: Record<VZone, { at: string; name: string }> = {
  floor: { at: "down on the floor", name: "the floor" },
  high: { at: "up high", name: "the top" },
  middle: { at: "halfway up", name: "halfway up" },
  low: { at: "down low", name: "the lower part" },
};
const DIRECTION_E: Record<Direction, string> = { left: "Left", right: "Right", up: "Up", down: "Down" };
const EXIT_E: Record<NonNullable<Exit>, string> = { left: "on the left", right: "on the right", bottom: "through the bottom" };

export const COPY = localized({
  "pt-BR": {
    levels: {
      test: {
        title: "Primeiro teste",
        goal: "Posicione a rampa no lugar indicado e ligue a máquina.",
        story: "Primeiro, arraste a rampa até a área marcada!",
        hint: "Arraste a rampa até a área marcada. Depois aperte LIGAR.",
        win: "Primeira invenção funcionando! O laboratório está oficialmente aberto para ideias ainda piores.",
        cheer: "Funcionou! E olha que essa era a parte fácil!",
      },
      pixel: {
        title: "Bom dia, Pixel",
        goal: "Faça a bolinha tocar o sino.",
        story: "O Pixel está dormindo. Vamos acordar ele com o sino!",
        hint: "Coloque uma rampa logo depois da prateleira, descendo para a direita.",
        win: "O Pixel acordou. E está bravo.",
      },
      toast: {
        title: "Café da manhã",
        goal: "Faça a bolinha apertar o botão da torradeira.",
        story: "A bolinha cai no buraco. Use a mola para jogar ela até a torradeira.",
        hint: "Coloque a mola no fundo do buraco, inclinada para a direita.",
        win: "Torrada pronta! Meio queimada, como a Lina gosta.",
      },
      juice: {
        title: "Suco de laranja",
        goal: "Leve a laranja até o espremedor.",
        story: "A laranja para no meio da bancada. Use o vento para levar ela até o espremedor.",
        hint: "Coloque o ventilador na bancada, atrás da laranja, soprando para a direita.",
        win: "Suco espremido na hora. Com caroço.",
      },
      remote: {
        title: "Cadê o controle?",
        goal: "Faça a bolinha apertar o botão do controle.",
        story: "O controle está do outro lado da garagem. A bolinha vai ter que voltar.",
        hint: "Use as duas esteiras com as setas para a esquerda, uma mais baixa que a outra.",
        win: "A TV ligou! E está passando... o 404?",
      },
      finale: {
        title: "A pior ideia de todas",
        goal: "Faça a bolinha tocar o sino atrás do muro.",
        story: "O sino está atrás do muro. Vale usar tudo o que tem na caixa!",
        hint: "Use a mola para passar por cima do muro. Depois, uma esteira leva a bolinha até o sino.",
        win: "DING! A máquina mais inútil do mundo funcionou.",
      },
    },
    parts: {
      ramp: { noun: noun("rampa", true), plural: "rampas" },
      spring: { noun: noun("mola", true), plural: "molas" },
      fan: { noun: noun("ventilador"), plural: "ventiladores" },
      belt: { noun: noun("esteira", true), plural: "esteiras" },
    } satisfies Record<PartType, { noun: Noun; plural: string }>,
    hud: {
      level: (n: number, total: number) => `FASE ${n} DE ${total}`,
      parts: "PEÇAS",
      hint: "DICA",
      clear: "LIMPAR",
      run: "LIGAR",
      stop: "DESLIGAR",
      par: (par: number) => (par === 1 ? "3 estrelas: 1 peça" : `3 estrelas: até ${par} peças`),
      worked: "FUNCIONOU!",
    },
    world: {
      buildHere: "monte aqui",
      bullseye: "NA MOSCA!",
      ding: "DING!",
      zzz: "z z",
      meow: "MIAU!",
      toast: "PLIM!",
      juice: "SPLOSH!",
      click: "CLIQUE!",
    },
    scene: {
      issue: {
        outside: "Coloque dentro da área tracejada",
        blocked: "Já tem algo nesse lugar",
        crowded: "Muito perto de outra peça",
      },
      failLines: ["Quase!", "Opa! Não foi dessa vez.", "Faltou pouco!", "Hmm... mais um ajuste."],
      keyRange: (n: number) => (n === 1 ? "1" : `de 1 a ${n}`),
      howGuided:
        "Uma marca tracejada mostra onde vai a rampa. Arraste a rampa até a marca. No teclado, aperte 1: a rampa já aparece em cima da marca. Depois aperte Enter para colocar e espaço para ligar a máquina.",
      howFree: (keys: string) => `Arraste uma peça para a área de montagem ou aperte ${keys} para pegar uma. Setas movem, Enter coloca, espaço liga a máquina.`,
      intro: (level: string, how: string) => `${level} ${how} Para consultar: D descreve a fase, O passa pelos objetos, I diz onde está a peça, L repete o último resultado.`,
      selected: (prefix: string, index: number, total: number, describe: string, place: string) =>
        `${prefix}Peça ${index} de ${total}: ${describe}, ${place}. Setas ou Enter movem, R gira, X guarda na caixa, I dá mais detalhes.`,
      dropTag: "Solte para guardar",
      cantPlace: (n: Noun, conflict: string) => `Não dá para colocar aqui: ${conflict}. ${nameP(n)} continua na mão. Mova com as setas ou aperte C para cancelar.`,
      guidedSay: "Isso! Agora aperte LIGAR.",
      guidedPlaced: "Rampa no lugar certo. Agora aperte espaço para ligar a máquina.",
      placed: (n: Noun, pose: string, place: string, used: number) =>
        `${capitalize(n.word)} colocad${n.female ? "a" : "o"}: ${pose}, ${place}. ${used} ${used === 1 ? "peça usada" : "peças usadas"}.`,
      cancelledToBox: (n: Noun) => `Cancelado. ${nameP(n)} voltou para a caixa.`,
      cancelledBack: (n: Noun, place: string) => `Cancelado. ${nameP(n)} voltou para onde estava: ${place}.`,
      settled: (n: Noun, conflict: string, toBox: boolean) => `${nameP(n)} não cabia onde estava (${conflict}) e voltou ${toBox ? "para a caixa" : "para onde estava"}.`,
      outOfSay: (plural: string) => `Acabaram as ${plural}!`,
      outOf: (plural: string) => `Acabaram as ${plural}.`,
      guidedInHand: "Rampa na mão, já em cima da marca. Aperte Enter para colocar.",
      inHand: (n: Noun, pose: string, state: string, place: string) =>
        `${capitalize(n.word)} na mão: ${pose}. ${state} ${capitalize(place)}. Setas movem, R gira, Enter coloca, C cancela.`,
      noRoom: "Não cabe mais nada aí!",
      backToBox: (n: Noun) => `${nameP(n)} voltou para a caixa.`,
      doesntFit: (n: Noun, conflict: string, toBox: boolean) => `Não cabe ali: ${conflict}. ${nameP(n)} voltou ${toBox ? "para a caixa" : "para onde estava"}.`,
      cantRotate: (n: Noun, conflict: string) => `Não dá para girar aqui: nessa posição, ${theP(n)} ${conflict}.`,
      rotated: (pose: string, state: string | null, place: string) => `Girou: ${pose}.${state ? ` ${state}` : ""} ${capitalize(place)}.`,
      nothingToPutAway: "Nenhuma peça na mão nem escolhida para guardar.",
      putAway: (n: Noun, left: string) => `${nameP(n)} voltou para a caixa. Na caixa: ${left}.`,
      nothingToCancelPlaced: "Nada para cancelar: a peça escolhida já está montada. X guarda ela na caixa.",
      nothingToCancel: "Nada para cancelar.",
      noPartsYet: "Nenhuma peça montada ainda.",
      nothing: "nada",
      placedParts: (list: string[]) => `Peças montadas: ${list.join("; ")}.`,
      browse: (index: number, total: number, text: string) => `${index} de ${total}. ${text}`,
      yourPart: (where: string) => `Sua peça fica ${where}.`,
      noneInHand: (keys: string, canSelect: boolean) => `Nenhuma peça na mão. Aperte ${keys} para pegar uma peça${canSelect ? " ou S para escolher uma peça montada" : ""}.`,
      noneInHandShort: (keys: string) => `Nenhuma peça na mão. Aperte ${keys} para pegar uma.`,
      noAttempts: "Ainda não teve nenhuma tentativa. Aperte espaço para ligar a máquina.",
      cleared: "Todas as peças voltaram para a caixa.",
      hint: (hint: string) => `Dica da Lina: ${hint}`,
      pickFirst: (n: number) => `Pegue uma peça com ${n === 1 ? "a tecla 1" : `as teclas de 1 a ${n}`}, ou selecione uma peça montada com S.`,
      moving: (n: Noun, message: string) => `Movendo ${theP(n)}. ${message}`,
      pickedUp: (n: Noun) => `${capitalize(n.word)} na mão. Setas movem, R gira, Enter coloca, C cancela.`,
      boing: "BOING!",
      cantStart: (n: Noun, conflict: string) => `A máquina não ligou: ${theP(n)} na mão não cabe aí, ${conflict}. Mova a peça, aperte Enter para colocar ou C para cancelar.`,
      go: "Lá vai!",
      started: (placed: string, empty: boolean) => `${placed}Máquina ligada${empty ? ", sem nenhuma peça" : ""}! Espaço desliga.`,
      stopped: (report: string) => `Máquina desligada. ${report}`,
      failReason: (ball: Noun, kind: FailKind) => `${nameP(ball)} ${kind === "out" ? "saiu da garagem" : kind === "stopped" ? "parou no caminho" : "demorou demais"}.`,
      nope: "NÃO DEU!",
      offGuideSay: "Quase! Leve a rampa até a área marcada.",
      psst: (hint: string) => `Psiu! ${hint}`,
      offGuideAdvice: "Coloque a rampa em cima da marca tracejada.",
      tryAgain: "Mude as peças e tente de novo.",
      failed: (report: string, advice: string, first: boolean) => `Não deu. ${report} ${advice}${first ? " L repete este resultado." : ""}`,
      bye: "TCHAU!",
      poof: "PUF!",
      worked: (report: string) => `Funcionou! ${report}`,
    },
    result: {
      worked: "Máquina funcionou",
      saved: (n: number) => (n === 1 ? "Sobrou 1 peça na caixa" : `Sobraram ${n} peças na caixa`),
      tries: (runs: number) => (runs === 1 ? "Ligou e funcionou de primeira" : `Funcionou na ${runs}ª tentativa`),
      title: "Teste aprovado!",
      summary: (n: number) => `Você usou ${n} ${n === 1 ? "peça" : "peças"}.`,
      starHint: (par: number) => `Com ${par === 1 ? "1 peça só" : `até ${par} peças`}, a fase vale 3 estrelas.`,
    },
    narration: {
      the: theP,
      list: listP,
      nouns: {
        floor: noun("chão"),
        edge: noun("parede da garagem", true),
        area: noun("área de montagem", true),
        pipe: noun("cano"),
        ball: noun("bolinha", true),
        orange: noun("laranja", true),
        juicerStand: noun("pé do espremedor"),
        goal: { target: noun("alvo"), bell: noun("sino"), toaster: noun("botão da torradeira"), juicer: noun("espremedor"), remote: noun("botão do controle") },
        goalBody: { target: noun("poste do alvo"), bell: noun("poste do sino"), toaster: noun("torradeira", true), juicer: noun("espremedor"), remote: noun("controle") },
        blocks: { shelf: noun("prateleira", true), counter: noun("bancada", true), cabinet: noun("armário"), crate: noun("caixote"), pole: noun("poste"), wall: noun("muro"), metalShelf: noun("prateleira de metal", true) },
      },
      ranked: (word: string, rank: Rank) => `${word} ${RANK_P[rank]}`,
      stopSpot: (ball: Noun) => `lugar onde a ${ball.word} parou`,
      pose: (type: PartType, angle: number, facing: Side) => {
        const side = sideP(angle > 0 ? "right" : "left");
        switch (type) {
          case "ramp":
            return angle === 0 ? "reta" : `descendo para a ${side}, ${Math.abs(angle)} graus`;
          case "spring":
            return angle === 0 ? "apontando para cima" : `apontando para cima e para a ${side}, ${Math.abs(angle)} graus`;
          case "fan":
            return `soprando para a ${sideP(facing)}`;
          case "belt":
            return `levando para a ${sideP(facing)}`;
        }
      },
      side: (h: HZone) => SIDE_TEXT_P[h],
      region: (v: VZone, h: HZone) => `${HEIGHT_TEXT_P[v]}, ${SIDE_TEXT_P[h]}`,
      slope: (angle: number, n: Noun) => {
        const end = n.female ? "a" : "o";
        if (angle === 0) return `ret${end}`;
        return `${Math.abs(angle) <= 7 ? "levemente " : ""}inclinad${end}, descendo para a ${angle > 0 ? "direita" : "esquerda"}`;
      },
      touching: (n: Noun) => `encostando ${inP(n)}`,
      vertical: (above: boolean, n: number, target: Noun) => {
        const word = above ? "acima" : "abaixo";
        return n === 0 ? `logo ${word} ${ofP(target)}` : `${stepsP(n)} ${word} ${ofP(target)}`;
      },
      beside: (a: { side: Side; h: number; target: Noun; end: boolean; v: number; lower: boolean; wall: boolean }) => {
        const side = sideP(a.side);
        const hText = a.h === 0 ? `logo à ${side}` : `${stepsP(a.h)} à ${side}`;
        const anchor = a.end ? `da ponta ${ofP(a.target)}` : ofP(a.target);
        const vText = a.v === 0 ? (a.wall ? "na altura do topo" : "na mesma altura") : `${stepsP(a.v)} ${a.lower ? "abaixo" : "acima"}${a.wall ? " do topo" : ""}`;
        return `${hText} ${anchor}, ${vText}`;
      },
      path: (rel: PathRelation, ball: Noun) => {
        const subject = `Caminho da última ${ball.word}`;
        if (rel.kind === "cross") return `${subject}: passa por aqui.`;
        if (rel.kind === "above") return `${subject}: passa ${rel.n === 0 ? "logo" : stepsP(rel.n)} acima.`;
        if (rel.kind === "below") return `${subject}: passa ${rel.n === 0 ? "logo" : stepsP(rel.n)} abaixo.`;
        return null;
      },
      offPath: (ball: Noun) => `Fora do caminho da última ${ball.word}.`,
      outside: (edges: Edge[]) => {
        const names = edges.map((e) => EDGE_P[e]);
        return names.length > 1 ? `passa das bordas ${listP(names)} da área de montagem` : `passa da borda ${names[0] ?? ""} da área de montagem`;
      },
      touches: (n: Noun) => `encosta ${inP(n)}`,
      touchesSomething: "encosta em outra coisa",
      tooClosePipe: "fica perto demais do cano",
      tooClose: (n: Noun) => `fica perto demais ${ofP(n)}`,
      tooCloseGoal: "fica perto demais do objetivo",
      tooClosePart: "fica perto demais de outra peça",
      coords: (dx: number, dy: number) =>
        `${dx === 0 ? "na borda esquerda" : `${stepsP(dx)} da borda esquerda`} da área de montagem e ${dy === 0 ? "no alto dela" : `${stepsP(dy)} abaixo do alto dela`}`,
      insidePoint: (a: { side: Side; h: number; top: boolean; v: number }) => {
        const h = edgeDistanceP(a.h, sideP(a.side));
        const v = a.top ? (a.v === 0 ? "no alto" : `${stepsP(a.v)} do alto`) : edgeDistanceP(a.v, "de baixo");
        return `dentro da área de montagem, ${h} e ${v}`;
      },
      outsidePoint: (a: { dx: { n: number; side: Side } | null; dy: { n: number; above: boolean } | null; edge: { n: number; side: Side } | null; top: number | null }) => {
        const parts: string[] = [];
        if (a.dx) parts.push(`${a.dx.n === 0 ? "logo" : stepsP(a.dx.n)} à ${sideP(a.dx.side)}`);
        if (a.dy) parts.push(`${a.dy.n === 0 ? "logo" : stepsP(a.dy.n)} ${a.dy.above ? "acima" : "abaixo"}`);
        let text = `${listP(parts)} da área de montagem`;
        if (a.edge) text += `, ${edgeDistanceP(a.edge.n, sideP(a.edge.side))} dela`;
        if (a.top !== null) text += `, ${a.top === 0 ? "na altura do alto dela" : `${stepsP(a.top)} abaixo do alto dela`}`;
        return text;
      },
      nearArea: (n: number, dir: Side | "above" | "below") => {
        const amount = n === 0 ? "logo" : stepsP(n);
        if (dir === "above" || dir === "below") return `${amount} ${dir === "below" ? "abaixo" : "acima"} da área de montagem`;
        return `${amount} à ${sideP(dir)} da área de montagem`;
      },
      insideArea: "dentro da área de montagem",
      endAt: (end: End, where: string) => `A ${END_P[end]} fica ${where}.`,
      sits: (text: string) => `Fica ${text}.`,
      lies: (text: string) => `Está ${text}.`,
      bellGoal: (region: string, pole: boolean) => `O sino é o objetivo. Fica ${region}, ${pole ? "em cima de um poste" : "pendurado num gancho"}.`,
      targetGoal: (region: string) => `O alvo é o objetivo. Fica ${region}, em cima de um poste.`,
      juicerGoal: (region: string, ball: Noun) => `O espremedor é o objetivo: a ${ball.word} tem que cair dentro do copo dele. Fica ${region}, em cima de um pé.`,
      buttonGoal: (goal: Noun, owner: Noun, region: string, support: Noun | null, where: ButtonSide) =>
        `${nameP(goal)} é o objetivo. ${nameP(owner)} fica ${region}${support ? `, em cima ${ofP(support)}` : ""}; o botão fica ${BUTTON_P[where]} ${owner.female ? "dela" : "dele"}.`,
      area: (l: HZone, r: HZone, t: VZone, d: VZone, width: number, height: number) => {
        const across = l === r ? `fica ${atZoneP(H_ZONE_P[l])}` : `vai ${ofP(H_ZONE_P[l])} até ${theP(H_ZONE_P[r])}`;
        const down = t === d ? `${l === r ? "" : "fica "}${atZoneP(V_ZONE_P[t])}` : `${l === r ? "vai " : ""}${ofP(V_ZONE_P[t])} até ${theP(V_ZONE_P[d])}`;
        return `A área de montagem, onde as peças podem ficar, ${across} e ${down}. Tem ${stepsP(width)} de largura e ${height} de altura.`;
      },
      pipe: (region: string, ball: Noun, side: Side) => `O cano fica ${region}. A ${ball.word} sai dele rolando para a ${sideP(side)}.`,
      surface: (n: Noun, region: string, slope: string) => `${nameP(n)} fica ${region}, ${slope}.`,
      wall: (n: Noun, region: string, height: number) => `${nameP(n)} fica ${region}, em pé, com ${stepsP(height)} de altura.`,
      wallTop: (where: string) => `O topo fica ${where}.`,
      thing: (n: Noun, region: string) => `${nameP(n)} fica ${region}.`,
      placedPart: (n: Noun, region: string, near: string | null) => `${capitalize(n.word)} montad${n.female ? "a" : "o"} fica ${region}${near ? `, ${near}` : ""}.`,
      stop: (ball: Noun, support: Noun | null, where: string, goal: string | null) =>
        `Na última tentativa, a ${ball.word} parou ${support ? `${inP(support)}, ` : ""}${where}${goal ? `, ${goal}` : ""}.`,
      level: (n: number, total: number, title: string, goal: string, scene: string, inventory: string) =>
        `Fase ${n} de ${total}: ${/[.!?]$/.test(title) ? title : `${title}.`} ${goal} Cenário, a partir do cano: ${scene} Na caixa: ${inventory}.`,
      inArea: (coords: string) => `fica ${coords}`,
      direction: (dir: Direction) => DIRECTION_P[dir],
      moveSteps: (n: number) => `, ${n} passos`,
      edgeStop: ": borda da área de montagem, não dá para ir mais",
      noFit: (conflict: string) => `Não cabe: ${conflict}.`,
      fits: "Pode colocar aqui.",
      held: (n: Noun, held: boolean, pose: string) => `${capitalize(n.word)} ${held ? "na mão" : `montad${n.female ? "a" : "o"}`}, ${pose}.`,
      heldWhere: (region: string, coords: string) => `Fica ${region}, ${coords}.`,
      nearby: (rels: string[]) => `Perto: ${rels.join("; ")}.`,
      attempt: (n: number) => `Tentativa ${n}.`,
      touchedNothing: (ball: Noun) => `${nameP(ball)} não tocou em nada.`,
      touched: (ball: Noun, nouns: Noun[]) => `${nameP(ball)} tocou ${listP(nouns.map(inP))}.`,
      touchedMany: (ball: Noun, first: Noun[], last: Noun) => `${nameP(ball)} tocou ${first.map(inP).join(", ")} e, por último, ${inP(last)}.`,
      launched: (spring: Noun, ball: Noun, angle: number) =>
        `${nameP(spring)} jogou a ${ball.word} ${angle === 0 ? "para cima" : `para cima e para a ${angle > 0 ? "direita" : "esquerda"}`}.`,
      wind: (fan: Noun, ball: Noun) => `O vento ${ofP(fan)} empurrou a ${ball.word}.`,
      missed: (part: Noun, rel: PathRelation | null) => {
        const them = part.female ? "dela" : "dele";
        let detail = "";
        if (rel?.kind === "above") detail = `passou ${rel.n === 0 ? "logo" : stepsP(rel.n)} acima ${them}`;
        else if (rel?.kind === "below") detail = `passou ${rel.n === 0 ? "logo" : stepsP(rel.n)} abaixo ${them}`;
        else if (rel?.kind === "left" || rel?.kind === "right") detail = `não chegou até ${part.female ? "ela" : "ele"}`;
        else if (rel?.kind === "cross") detail = `passou bem perto ${them}`;
        return `Não tocou ${inP(part)}${detail ? `: ${detail}` : ""}.`;
      },
      wallPassed: (wall: Noun, passed: boolean) => `${passed ? "Passou" : "Não passou"} ${ofP(wall)}.`,
      hit: (goal: Noun | null) => (goal ? `Acertou ${theP(goal)}!` : "Acertou o objetivo!"),
      exit: (side: Exit) => (side ? `Saiu da garagem ${EXIT_P[side]}.` : "Saiu da garagem."),
      stopped: (support: Noun | null, where: string, goal: string | null) => `Parou ${support ? `${inP(support)}, ` : ""}${where}${goal ? `, ${goal}` : ""}.`,
      timeout: (ball: Noun, region: string, goal: string | null) => `O tempo acabou com a ${ball.word} ainda se mexendo, ${region}${goal ? `, ${goal}` : ""}.`,
      cancelled: (ball: Noun, region: string, goal: string | null) => `A ${ball.word} estava ${region}${goal ? `, ${goal}` : ""}.`,
      closest: (goal: Noun, n: number) => (n === 0 ? `Chegou a menos de 1 passo ${ofP(goal)}.` : `O mais perto que chegou ${ofP(goal)} foi ${stepsP(n)}.`),
    },
  },
  en: {
    levels: {
      test: {
        title: "First test",
        goal: "Put the ramp in the marked spot and turn on the machine.",
        story: "First, drag the ramp to the marked spot!",
        hint: "Drag the ramp to the marked spot. Then press START.",
        win: "First invention up and running! The lab is officially open for even worse ideas.",
        cheer: "It worked! And that was the easy part!",
      },
      pixel: {
        title: "Good morning, Pixel",
        goal: "Make the ball ring the bell.",
        story: "Pixel is asleep. Let's wake him up with the bell!",
        hint: "Put a ramp right after the shelf, sloping down to the right.",
        win: "Pixel is awake. And he's mad.",
      },
      toast: {
        title: "Breakfast",
        goal: "Make the ball press the toaster button.",
        story: "The ball drops into the hole. Use the spring to throw it to the toaster.",
        hint: "Put the spring at the bottom of the hole, tilted to the right.",
        win: "Toast is ready! A little burnt, just how Lina likes it.",
      },
      juice: {
        title: "Orange juice",
        goal: "Get the orange to the juicer.",
        story: "The orange stops in the middle of the counter. Use the wind to get it to the juicer.",
        hint: "Put the fan on the counter, behind the orange, blowing to the right.",
        win: "Freshly squeezed juice. With seeds.",
      },
      remote: {
        title: "Where's the remote?",
        goal: "Make the ball press the button on the remote.",
        story: "The remote is on the other side of the garage. The ball will have to go back.",
        hint: "Use both belts with the arrows pointing left, one lower than the other.",
        win: "The TV is on! And it's showing... 404?",
      },
      finale: {
        title: "The worst idea of all",
        goal: "Make the ball ring the bell behind the wall.",
        story: "The bell is behind the wall. Everything in the box is fair game!",
        hint: "Use the spring to get over the wall. Then a belt takes the ball to the bell.",
        win: "DING! The most useless machine in the world works.",
      },
    },
    parts: {
      ramp: { noun: noun("ramp"), plural: "ramps" },
      spring: { noun: noun("spring"), plural: "springs" },
      fan: { noun: noun("fan"), plural: "fans" },
      belt: { noun: noun("belt"), plural: "belts" },
    },
    hud: {
      level: (n: number, total: number) => `LEVEL ${n} OF ${total}`,
      parts: "PARTS",
      hint: "HINT",
      clear: "CLEAR",
      run: "START",
      stop: "STOP",
      par: (par: number) => (par === 1 ? "3 stars: 1 part" : `3 stars: up to ${par} parts`),
      worked: "IT WORKED!",
    },
    world: {
      buildHere: "build here",
      bullseye: "BULLSEYE!",
      ding: "DING!",
      zzz: "z z",
      meow: "MEOW!",
      toast: "POP!",
      juice: "SPLOSH!",
      click: "CLICK!",
    },
    scene: {
      issue: {
        outside: "Put it inside the dashed area",
        blocked: "Something's already there",
        crowded: "Too close to another part",
      },
      failLines: ["Almost!", "Oops! Not this time.", "So close!", "Hmm... one more tweak."],
      keyRange: (n: number) => (n === 1 ? "1" : `a key from 1 to ${n}`),
      howGuided:
        "A dashed outline shows where the ramp goes. Drag the ramp onto the outline. On the keyboard, press 1: the ramp shows up right on the outline. Then press Enter to place it and Space to start the machine.",
      howFree: (keys: string) => `Drag a part into the build area or press ${keys} to take one. Arrows move, Enter places, Space starts the machine.`,
      intro: (level: string, how: string) => `${level} ${how} To look around: D describes the level, O goes through the objects, I tells where the part is, L repeats the last result.`,
      selected: (prefix: string, index: number, total: number, describe: string, place: string) =>
        `${prefix}Part ${index} of ${total}: ${describe}, ${place}. Arrows or Enter move it, R rotates, X puts it back in the box, I gives more details.`,
      dropTag: "Drop to put away",
      cantPlace: (n: Noun, conflict: string) => `Can't place it here: it ${conflict}. ${nameE(n)} is still in hand. Move it with the arrows or press C to cancel.`,
      guidedSay: "Yes! Now press START.",
      guidedPlaced: "Ramp in the right spot. Now press Space to start the machine.",
      placed: (n: Noun, pose: string, place: string, used: number) => `${capitalize(n.word)} placed: ${pose}, ${place}. ${used} ${used === 1 ? "part" : "parts"} used.`,
      cancelledToBox: (n: Noun) => `Canceled. ${nameE(n)} went back in the box.`,
      cancelledBack: (n: Noun, place: string) => `Canceled. ${nameE(n)} went back where it was: ${place}.`,
      settled: (n: Noun, conflict: string, toBox: boolean) => `${nameE(n)} didn't fit where it was (it ${conflict}) and went back ${toBox ? "in the box" : "where it was"}.`,
      outOfSay: (plural: string) => `No more ${plural}!`,
      outOf: (plural: string) => `No more ${plural}.`,
      guidedInHand: "Ramp in hand, already on the outline. Press Enter to place it.",
      inHand: (n: Noun, pose: string, state: string, place: string) =>
        `${capitalize(n.word)} in hand: ${pose}. ${state} ${capitalize(place)}. Arrows move, R rotates, Enter places, C cancels.`,
      noRoom: "No room left in there!",
      backToBox: (n: Noun) => `${nameE(n)} went back in the box.`,
      doesntFit: (n: Noun, conflict: string, toBox: boolean) => `Doesn't fit there: it ${conflict}. ${nameE(n)} went back ${toBox ? "in the box" : "where it was"}.`,
      cantRotate: (n: Noun, conflict: string) => `Can't rotate here: in that position, ${theE(n)} ${conflict}.`,
      rotated: (pose: string, state: string | null, place: string) => `Rotated: ${pose}.${state ? ` ${state}` : ""} ${capitalize(place)}.`,
      nothingToPutAway: "No part in hand or selected to put away.",
      putAway: (n: Noun, left: string) => `${nameE(n)} went back in the box. In the box: ${left}.`,
      nothingToCancelPlaced: "Nothing to cancel: the selected part is already placed. X puts it back in the box.",
      nothingToCancel: "Nothing to cancel.",
      noPartsYet: "No parts placed yet.",
      nothing: "nothing",
      placedParts: (list: string[]) => `Placed parts: ${list.join("; ")}.`,
      browse: (index: number, total: number, text: string) => `${index} of ${total}. ${text}`,
      yourPart: (where: string) => `Your part is ${where}.`,
      noneInHand: (keys: string, canSelect: boolean) => `No part in hand. Press ${keys} to take a part${canSelect ? " or S to select a placed part" : ""}.`,
      noneInHandShort: (keys: string) => `No part in hand. Press ${keys} to take one.`,
      noAttempts: "No attempts yet. Press Space to start the machine.",
      cleared: "All the parts went back in the box.",
      hint: (hint: string) => `Lina's hint: ${hint}`,
      pickFirst: (n: number) => `Take a part with ${n === 1 ? "the 1 key" : `the keys 1 to ${n}`}, or select a placed part with S.`,
      moving: (n: Noun, message: string) => `Moving ${theE(n)}. ${message}`,
      pickedUp: (n: Noun) => `${capitalize(n.word)} in hand. Arrows move, R rotates, Enter places, C cancels.`,
      boing: "BOING!",
      cantStart: (n: Noun, conflict: string) =>
        `The machine didn't start: ${theE(n)} in hand doesn't fit there, it ${conflict}. Move the part, press Enter to place it or C to cancel.`,
      go: "Here goes!",
      started: (placed: string, empty: boolean) => `${placed}Machine started${empty ? ", with no parts" : ""}! Space stops it.`,
      stopped: (report: string) => `Machine stopped. ${report}`,
      failReason: (ball: Noun, kind: FailKind) => `${nameE(ball)} ${kind === "out" ? "left the garage" : kind === "stopped" ? "stopped on the way" : "took too long"}.`,
      nope: "NOPE!",
      offGuideSay: "Almost! Take the ramp to the marked spot.",
      psst: (hint: string) => `Psst! ${hint}`,
      offGuideAdvice: "Put the ramp on the dashed outline.",
      tryAgain: "Change the parts and try again.",
      failed: (report: string, advice: string, first: boolean) => `Didn't work. ${report} ${advice}${first ? " L repeats this result." : ""}`,
      bye: "BYE!",
      poof: "POOF!",
      worked: (report: string) => `It worked! ${report}`,
    },
    result: {
      worked: "Machine worked",
      saved: (n: number) => (n === 1 ? "1 part left in the box" : `${n} parts left in the box`),
      tries: (runs: number) => (runs === 1 ? "Worked on the first try" : `Worked on try ${runs}`),
      title: "Test passed!",
      summary: (n: number) => `You used ${n} ${n === 1 ? "part" : "parts"}.`,
      starHint: (par: number) => `With ${par === 1 ? "just 1 part" : `up to ${par} parts`}, the level is worth 3 stars.`,
    },
    narration: {
      the: theE,
      list: listE,
      nouns: {
        floor: noun("floor"),
        edge: noun("garage wall"),
        area: noun("build area"),
        pipe: noun("pipe"),
        ball: noun("ball"),
        orange: noun("orange"),
        juicerStand: noun("juicer stand"),
        goal: { target: noun("target"), bell: noun("bell"), toaster: noun("toaster button"), juicer: noun("juicer"), remote: noun("button on the remote") },
        goalBody: { target: noun("target post"), bell: noun("bell post"), toaster: noun("toaster"), juicer: noun("juicer"), remote: noun("remote") },
        blocks: { shelf: noun("shelf"), counter: noun("counter"), cabinet: noun("cabinet"), crate: noun("crate"), pole: noun("post"), wall: noun("wall"), metalShelf: noun("metal shelf") },
      },
      ranked: (word: string, rank: Rank) => `${rank} ${word}`,
      stopSpot: (ball: Noun) => `spot where the ${ball.word} stopped`,
      pose: (type: PartType, angle: number, facing: Side) => {
        const side = angle > 0 ? "right" : "left";
        switch (type) {
          case "ramp":
            return angle === 0 ? "flat" : `sloping down to the ${side}, ${Math.abs(angle)} degrees`;
          case "spring":
            return angle === 0 ? "pointing up" : `pointing up and to the ${side}, ${Math.abs(angle)} degrees`;
          case "fan":
            return `blowing to the ${facing}`;
          case "belt":
            return `carrying to the ${facing}`;
        }
      },
      side: (h: HZone) => H_ZONE_E[h].at,
      region: (v: VZone, h: HZone) => `${V_ZONE_E[v].at}, ${H_ZONE_E[h].at}`,
      slope: (angle: number) => {
        if (angle === 0) return "flat";
        return `${Math.abs(angle) <= 7 ? "slightly " : ""}tilted, sloping down to the ${angle > 0 ? "right" : "left"}`;
      },
      touching: (n: Noun) => `touching ${theE(n)}`,
      vertical: (above: boolean, n: number, target: Noun) => `${n === 0 ? "just" : stepsE(n)} ${above ? "above" : "below"} ${theE(target)}`,
      beside: (a: { side: Side; h: number; target: Noun; end: boolean; v: number; lower: boolean; wall: boolean }) => {
        const hText = `${a.h === 0 ? "just" : stepsE(a.h)} to the ${a.side} of`;
        const anchor = a.end ? `the end of ${theE(a.target)}` : theE(a.target);
        const vText = a.v === 0 ? (a.wall ? "level with its top" : "at the same height") : `${stepsE(a.v)} ${a.lower ? "below" : "above"}${a.wall ? " its top" : ""}`;
        return `${hText} ${anchor}, ${vText}`;
      },
      path: (rel: PathRelation, ball: Noun) => {
        const subject = `The ${ball.word}'s last path`;
        if (rel.kind === "cross") return `${subject}: goes right through here.`;
        if (rel.kind === "above") return `${subject}: passes ${rel.n === 0 ? "just" : stepsE(rel.n)} above.`;
        if (rel.kind === "below") return `${subject}: passes ${rel.n === 0 ? "just" : stepsE(rel.n)} below.`;
        return null;
      },
      offPath: (ball: Noun) => `Off the ${ball.word}'s last path.`,
      outside: (edges: Edge[]) => `goes past the ${edges.length ? `${listE(edges)} ` : ""}edge${edges.length > 1 ? "s" : ""} of the build area`,
      touches: (n: Noun) => `touches ${theE(n)}`,
      touchesSomething: "touches something else",
      tooClosePipe: "is too close to the pipe",
      tooClose: (n: Noun) => `is too close to ${theE(n)}`,
      tooCloseGoal: "is too close to the goal",
      tooClosePart: "is too close to another part",
      coords: (dx: number, dy: number) =>
        `${dx === 0 ? "at the left edge" : `${stepsE(dx)} from the left edge`} of the build area and ${dy === 0 ? "at its top" : `${stepsE(dy)} below its top`}`,
      insidePoint: (a: { side: Side; h: number; top: boolean; v: number }) => {
        const h = a.h === 0 ? `at the ${a.side} edge` : `${stepsE(a.h)} from the ${a.side} edge`;
        const edge = a.top ? "top" : "bottom edge";
        const v = a.v === 0 ? `at the ${edge}` : `${stepsE(a.v)} from the ${edge}`;
        return `inside the build area, ${h} and ${v}`;
      },
      outsidePoint: (a: { dx: { n: number; side: Side } | null; dy: { n: number; above: boolean } | null; edge: { n: number; side: Side } | null; top: number | null }) => {
        const parts: string[] = [];
        if (a.dx) parts.push(`${a.dx.n === 0 ? "just" : stepsE(a.dx.n)} to the ${a.dx.side} of the build area`);
        if (a.dy) parts.push(`${a.dy.n === 0 ? "just" : stepsE(a.dy.n)} ${a.dy.above ? "above" : "below"} ${a.dx ? "it" : "the build area"}`);
        let text = listE(parts);
        if (a.edge) text += `, ${a.edge.n === 0 ? `at its ${a.edge.side} edge` : `${stepsE(a.edge.n)} from its ${a.edge.side} edge`}`;
        if (a.top !== null) text += `, ${a.top === 0 ? "level with its top" : `${stepsE(a.top)} below its top`}`;
        return text;
      },
      nearArea: (n: number, dir: Side | "above" | "below") => {
        const amount = n === 0 ? "just" : stepsE(n);
        if (dir === "above" || dir === "below") return `${amount} ${dir} the build area`;
        return `${amount} to the ${dir} of the build area`;
      },
      insideArea: "inside the build area",
      endAt: (end: End, where: string) => `The ${end} end is ${where}.`,
      sits: (text: string) => `It is ${text}.`,
      lies: (text: string) => `It is ${text}.`,
      bellGoal: (region: string, pole: boolean) => `The bell is the goal. It is ${region}, ${pole ? "on top of a post" : "hanging from a hook"}.`,
      targetGoal: (region: string) => `The target is the goal. It is ${region}, on top of a post.`,
      juicerGoal: (region: string, ball: Noun) => `The juicer is the goal: the ${ball.word} has to drop into its cup. It is ${region}, on a stand.`,
      buttonGoal: (goal: Noun, owner: Noun, region: string, support: Noun | null, where: ButtonSide) =>
        `${nameE(goal)} is the goal. ${nameE(owner)} is ${region}${support ? `, on top of ${theE(support)}` : ""}; the button is ${where === "top" ? "on top of it" : `on its ${where} side`}.`,
      area: (l: HZone, r: HZone, t: VZone, d: VZone, width: number, height: number) => {
        const across = l === r ? `is ${H_ZONE_E[l].at}` : `runs from ${H_ZONE_E[l].name} to ${H_ZONE_E[r].name}`;
        const down = t === d ? V_ZONE_E[t].at : `from ${V_ZONE_E[t].name} to ${V_ZONE_E[d].name}`;
        return `The build area, where parts can go, ${across}${l !== r && t !== d ? " and " : ", "}${down}. It is ${stepsE(width)} wide and ${height} tall.`;
      },
      pipe: (region: string, ball: Noun, side: Side) => `The pipe is ${region}. The ${ball.word} rolls out of it to the ${side}.`,
      surface: (n: Noun, region: string, slope: string) => `${nameE(n)} is ${region}, ${slope}.`,
      wall: (n: Noun, region: string, height: number) => `${nameE(n)} is ${region}, standing upright, ${stepsE(height)} tall.`,
      wallTop: (where: string) => `Its top is ${where}.`,
      thing: (n: Noun, region: string) => `${nameE(n)} is ${region}.`,
      placedPart: (n: Noun, region: string, near: string | null) => `${capitalize(n.word)} is placed ${region}${near ? `, ${near}` : ""}.`,
      stop: (ball: Noun, support: Noun | null, where: string, goal: string | null) =>
        `On the last attempt, the ${ball.word} stopped ${support ? `on ${theE(support)}, ` : ""}${where}${goal ? `, ${goal}` : ""}.`,
      level: (n: number, total: number, title: string, goal: string, scene: string, inventory: string) =>
        `Level ${n} of ${total}: ${/[.!?]$/.test(title) ? title : `${title}.`} ${goal} The scene, starting from the pipe: ${scene} In the box: ${inventory}.`,
      inArea: (coords: string) => coords,
      direction: (dir: Direction) => DIRECTION_E[dir],
      moveSteps: (n: number) => `, ${n} steps`,
      edgeStop: ": edge of the build area, can't go any further",
      noFit: (conflict: string) => `Doesn't fit: it ${conflict}.`,
      fits: "You can place it here.",
      held: (n: Noun, held: boolean, pose: string) => `${capitalize(n.word)}${held ? " in hand" : ", placed"}, ${pose}.`,
      heldWhere: (region: string, coords: string) => `It is ${region}, ${coords}.`,
      nearby: (rels: string[]) => `Nearby: ${rels.join("; ")}.`,
      attempt: (n: number) => `Attempt ${n}.`,
      touchedNothing: (ball: Noun) => `${nameE(ball)} didn't touch anything.`,
      touched: (ball: Noun, nouns: Noun[]) => `${nameE(ball)} touched ${listE(nouns.map(theE))}.`,
      touchedMany: (ball: Noun, first: Noun[], last: Noun) => `${nameE(ball)} touched ${first.map(theE).join(", ")} and, last of all, ${theE(last)}.`,
      launched: (spring: Noun, ball: Noun, angle: number) =>
        `${nameE(spring)} threw the ${ball.word} ${angle === 0 ? "straight up" : `up and to the ${angle > 0 ? "right" : "left"}`}.`,
      wind: (fan: Noun, ball: Noun) => `The wind from ${theE(fan)} pushed the ${ball.word}.`,
      missed: (part: Noun, rel: PathRelation | null) => {
        let detail = "";
        if (rel?.kind === "above" || rel?.kind === "below") detail = `passed ${rel.n === 0 ? "just" : stepsE(rel.n)} ${rel.kind} it`;
        else if (rel?.kind === "left" || rel?.kind === "right") detail = "didn't reach it";
        else if (rel?.kind === "cross") detail = "passed very close to it";
        return `Missed ${theE(part)}${detail ? `: ${detail}` : ""}.`;
      },
      wallPassed: (wall: Noun, passed: boolean) => `${passed ? "Got past" : "Didn't get past"} ${theE(wall)}.`,
      hit: (goal: Noun | null) => `Hit ${goal ? theE(goal) : "the goal"}!`,
      exit: (side: Exit) => (side ? `Went out of the garage ${EXIT_E[side]}.` : "Went out of the garage."),
      stopped: (support: Noun | null, where: string, goal: string | null) => `Stopped ${support ? `on ${theE(support)}, ` : ""}${where}${goal ? `, ${goal}` : ""}.`,
      timeout: (ball: Noun, region: string, goal: string | null) => `Time ran out with the ${ball.word} still moving, ${region}${goal ? `, ${goal}` : ""}.`,
      cancelled: (ball: Noun, region: string, goal: string | null) => `The ${ball.word} was ${region}${goal ? `, ${goal}` : ""}.`,
      closest: (goal: Noun, n: number) => (n === 0 ? `Got within 1 step of ${theE(goal)}.` : `The closest it got to ${theE(goal)} was ${stepsE(n)}.`),
    },
  },
});

export type LabCopy = (typeof COPY)[Locale];

export type LevelText = { title: string; goal: string; story: string; hint: string; win: string; cheer?: string };

export function levelText(copy: LabCopy, id: string): LevelText {
  return copy.levels[id as keyof LabCopy["levels"]];
}
