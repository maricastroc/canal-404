import type { PartType } from "./config";

export type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  angle?: number;
  kind: "shelf" | "metal" | "crate" | "cabinet" | "counter" | "pole";
};

export type Goal =
  | { type: "target"; x: number; y: number }
  | { type: "bell"; x: number; y: number; stand: "pole" | "hook" }
  | { type: "toaster"; x: number; y: number }
  | { type: "juicer"; x: number; y: number }
  | { type: "remote"; x: number; y: number };

export type Rect = { x: number; y: number; w: number; h: number };

export type LevelDef = {
  id: string;
  title: string;
  goalText: string;
  story: string;
  hint: string;
  win: string;
  ball: "marble" | "orange";
  pipe: { x: number; y: number; vx: number; vy: number; flip?: boolean };
  blocks: Block[];
  goal: Goal;
  build: Rect;
  inventory: Partial<Record<PartType, number>>;
  par: number;
  decor: ("cat" | "tv")[];
  guide?: { type: PartType; x: number; y: number; rot: number };
};

export const LEVELS: LevelDef[] = [
  {
    id: "test",
    title: "Primeiro teste",
    goalText: "Coloque a rampa e ligue a máquina.",
    story: "Vamos testar! Arraste a rampa até a marca.",
    hint: "Arraste a rampa até a marca tracejada. Depois aperte LIGAR.",
    win: "Viu? É só isso. Agora vamos às invenções de verdade.",
    ball: "marble",
    pipe: { x: 200, y: 300, vx: 3, vy: 0 },
    blocks: [
      { x: 370, y: 400, w: 340, h: 24, angle: 5, kind: "shelf" },
      { x: 1120, y: 740, w: 560, h: 24, angle: 3, kind: "shelf" },
    ],
    goal: { type: "target", x: 1520, y: 700 },
    build: { x: 520, y: 420, w: 300, h: 280 },
    inventory: { ramp: 1 },
    par: 1,
    decor: [],
    guide: { type: "ramp", x: 680, y: 560, rot: 4 },
  },
  {
    id: "pixel",
    title: "Bom dia, Pixel",
    goalText: "Faça a bolinha tocar o sino.",
    story: "O Pixel está dormindo. Vamos acordar ele com o sino!",
    hint: "Coloque uma rampa logo depois da prateleira, descendo para a direita.",
    win: "O Pixel acordou. E está bravo.",
    ball: "marble",
    pipe: { x: 190, y: 250, vx: 2.5, vy: 0 },
    blocks: [
      { x: 330, y: 360, w: 380, h: 24, angle: 6, kind: "shelf" },
      { x: 1175, y: 650, w: 590, h: 24, angle: 5, kind: "shelf" },
    ],
    goal: { type: "bell", x: 1600, y: 760, stand: "pole" },
    build: { x: 480, y: 300, w: 380, h: 600 },
    inventory: { ramp: 2 },
    par: 1,
    decor: ["cat"],
  },
  {
    id: "toast",
    title: "Café da manhã",
    goalText: "Faça a bolinha apertar o botão da torradeira.",
    story: "A bolinha cai no buraco. Use a mola para jogar ela até a torradeira.",
    hint: "Coloque a mola no fundo do buraco, inclinada para a direita.",
    win: "Torrada pronta! Meio queimada, como a Lina gosta.",
    ball: "marble",
    pipe: { x: 200, y: 230, vx: 3, vy: 0 },
    blocks: [
      { x: 330, y: 330, w: 360, h: 24, angle: 8, kind: "shelf" },
      { x: 790, y: 815, w: 60, h: 230, kind: "cabinet" },
      { x: 1250, y: 575, w: 540, h: 30, kind: "counter" },
    ],
    goal: { type: "toaster", x: 1440, y: 560 },
    build: { x: 480, y: 600, w: 280, h: 320 },
    inventory: { spring: 1, ramp: 1 },
    par: 1,
    decor: [],
  },
  {
    id: "juice",
    title: "Suco de laranja",
    goalText: "Leve a laranja até o espremedor.",
    story: "A laranja para no meio da bancada. Use o vento para levar ela até o espremedor.",
    hint: "Coloque o ventilador na bancada, atrás da laranja, soprando para a direita.",
    win: "Suco espremido na hora. Com caroço.",
    ball: "orange",
    pipe: { x: 230, y: 380, vx: 2, vy: 0 },
    blocks: [{ x: 450, y: 675, w: 700, h: 30, kind: "counter" }],
    goal: { type: "juicer", x: 1000, y: 700 },
    build: { x: 100, y: 480, w: 700, h: 180 },
    inventory: { fan: 1, ramp: 1 },
    par: 1,
    decor: [],
  },
  {
    id: "remote",
    title: "Cadê o controle?",
    goalText: "Faça a bolinha apertar o botão do controle.",
    story: "O controle está do outro lado da garagem. A bolinha vai ter que voltar.",
    hint: "Use as duas esteiras com as setas para a esquerda, uma mais baixa que a outra.",
    win: "A TV ligou! E está passando... o 404?",
    ball: "marble",
    pipe: { x: 1730, y: 240, vx: -2.5, vy: 0, flip: true },
    blocks: [
      { x: 1580, y: 340, w: 360, h: 24, angle: -5, kind: "shelf" },
      { x: 500, y: 652, w: 300, h: 24, kind: "shelf" },
    ],
    goal: { type: "remote", x: 560, y: 640 },
    build: { x: 700, y: 360, w: 760, h: 520 },
    inventory: { belt: 2, ramp: 1 },
    par: 2,
    decor: ["tv"],
  },
  {
    id: "finale",
    title: "A pior ideia de todas",
    goalText: "Faça a bolinha tocar o sino atrás do muro.",
    story: "O sino está atrás do muro. Vale usar tudo o que tem na caixa!",
    hint: "Use a mola para passar por cima do muro. Depois, uma esteira leva a bolinha até o sino.",
    win: "DING! A máquina mais inútil do mundo funcionou.",
    ball: "marble",
    pipe: { x: 170, y: 260, vx: 3, vy: 0 },
    blocks: [
      { x: 350, y: 360, w: 360, h: 24, angle: 10, kind: "shelf" },
      { x: 1100, y: 650, w: 60, h: 560, kind: "metal" },
      { x: 1585, y: 440, w: 470, h: 30, kind: "metal" },
    ],
    goal: { type: "bell", x: 1700, y: 560, stand: "hook" },
    build: { x: 300, y: 160, w: 1500, h: 770 },
    inventory: { ramp: 2, spring: 1, fan: 1, belt: 1 },
    par: 3,
    decor: [],
  },
];
