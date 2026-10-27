import { describe, expect, it } from "vitest";
import { FLOOR_Y } from "./config";
import { partPoly, placementConflict } from "./geometry";
import { LEVELS } from "./levels";
import {
  areaCoordinates,
  ballNoun,
  conflictText,
  describeHeld,
  describeLandmark,
  describeLevel,
  describeRun,
  levelLandmarks,
  moveMessage,
  partLandmark,
  partNoun,
  pathRelation,
  poseText,
  relation,
  type SceneInfo,
} from "./narration";

const level = (id: string) => LEVELS.find((l) => l.id === id)!;

function info(id: string, extra: ReturnType<typeof partLandmark>[] = []): SceneInfo {
  const l = level(id);
  return { level: l, landmarks: [...levelLandmarks(l), ...extra], ball: ballNoun(l) };
}

function named(id: string, word: string) {
  return info(id).landmarks.find((l) => l.noun.word === word)!;
}

describe("scene landmarks", () => {
  it("name every block after what it is and tell twins apart", () => {
    const words = (id: string) => info(id).landmarks.map((l) => l.noun.word);
    expect(words("pixel")).toEqual(expect.arrayContaining(["cano", "prateleira de cima", "prateleira de baixo", "poste do sino", "sino", "área de montagem"]));
    expect(words("toast")).toEqual(expect.arrayContaining(["prateleira", "armário", "bancada", "torradeira", "botão da torradeira"]));
    expect(words("finale")).toEqual(expect.arrayContaining(["muro", "prateleira de metal", "sino"]));
    expect(words("juice")).toEqual(expect.arrayContaining(["espremedor", "pé do espremedor", "bancada"]));
  });

  it("treat tall blocks as walls", () => {
    expect(named("finale", "muro").role).toBe("wall");
    expect(named("toast", "armário").role).toBe("wall");
    expect(named("pixel", "prateleira de cima").role).toBe("surface");
  });

  it("describe every level without gaps", () => {
    LEVELS.forEach((l, i) => {
      const text = describeLevel(info(l.id), i, LEVELS.length, "1 rampa");
      expect(text, l.id).toContain("área de montagem");
      expect(text, l.id).toContain("é o objetivo");
      expect(text, l.id).not.toMatch(/undefined|NaN|Infinity|\.\.|  /);
    });
  });

  it("say where the pixel shelf ends compared to the build area", () => {
    const text = describeLandmark(named("pixel", "prateleira de cima"), info("pixel"));
    expect(text).toBe(
      "A prateleira de cima fica no meio da altura, no canto esquerdo, levemente inclinada, descendo para a direita. A ponta de baixo fica dentro da área de montagem, 2 passos da borda esquerda e 3 passos do alto.",
    );
  });

  it("describe the goal with where to hit it", () => {
    expect(describeLandmark(named("toast", "botão da torradeira"), info("toast"))).toMatch(/em cima da bancada; o botão fica no lado esquerdo dela/);
    expect(describeLandmark(named("remote", "botão do controle"), info("remote"))).toMatch(/em cima da prateleira de baixo; o botão fica em cima dele/);
    const juicer = info("juice").landmarks.find((l) => l.role === "goal")!;
    expect(describeLandmark(juicer, info("juice"))).toMatch(/a laranja tem que cair dentro do copo/);
  });
});

describe("relations", () => {
  it("place the pixel solution right after the shelf end", () => {
    const shelf = named("pixel", "prateleira de cima");
    expect(relation(partPoly("ramp", 620, 420, 4), shelf).text).toBe("logo à direita da ponta da prateleira de cima, 1 passo abaixo");
    expect(relation(partPoly("ramp", 680, 600, 4), shelf).text).toBe("3 passos à direita da ponta da prateleira de cima, 10 passos abaixo");
  });

  it("use above and below when a part sits under or over a surface", () => {
    expect(relation(partPoly("ramp", 600, 460, 4), named("pixel", "prateleira de cima")).text).toBe("2 passos abaixo da prateleira de cima");
    expect(relation(partPoly("fan", 160, 580, 0), named("juice", "bancada")).text).toBe("1 passo acima da bancada");
  });

  it("measure walls from their top", () => {
    expect(relation(partPoly("spring", 1000, 700, 2), named("finale", "muro")).text).toMatch(/^\d+ passos? à esquerda do muro, \d+ passos abaixo do topo$/);
  });

  it("compare a part with the last path of the ball", () => {
    const poly = partPoly("ramp", 620, 500, 3);
    expect(pathRelation(poly, [])).toBeNull();
    expect(pathRelation(poly, [{ x: 520, y: 380 }, { x: 720, y: 400 }])).toEqual({ kind: "above", n: 3 });
    expect(pathRelation(poly, [{ x: 520, y: 500 }, { x: 720, y: 500 }])).toEqual({ kind: "cross" });
    expect(pathRelation(poly, [{ x: 520, y: 700 }, { x: 720, y: 700 }])).toEqual({ kind: "below", n: 8 });
    expect(pathRelation(poly, [{ x: 100, y: 300 }, { x: 300, y: 600 }])).toEqual({ kind: "left" });
  });

  it("count positions in steps from the build area edges", () => {
    const build = level("pixel").build;
    expect(areaCoordinates({ x: 620, y: 420 }, build)).toBe("7 passos da borda esquerda da área de montagem e 6 passos abaixo do alto dela");
    expect(areaCoordinates({ x: build.x, y: build.y }, build)).toBe("na borda esquerda da área de montagem e no alto dela");
  });
});

describe("placement conflicts", () => {
  it("name what is in the way", () => {
    const pixel = level("pixel");
    const landmarks = levelLandmarks(pixel);
    const blocked = placementConflict(pixel, [], { type: "spring", x: 540, y: 360, rot: 2 })!;
    expect(conflictText(blocked, landmarks, [])).toBe("encosta na prateleira de cima");
    const outside = placementConflict(pixel, [], { type: "ramp", x: 480, y: 600, rot: 3 })!;
    expect(conflictText(outside, landmarks, [])).toBe("passa da borda esquerda da área de montagem");
    const first = { type: "ramp" as const, x: 620, y: 600, rot: 3 };
    const crowded = placementConflict(pixel, [first], { ...first, x: 640 })!;
    expect(conflictText(crowded, landmarks, [partNoun("ramp", 1, 2)])).toBe("fica perto demais da rampa 1");
  });

  it("report the goal and pipe keep-out zones", () => {
    const pixel = level("pixel");
    expect(placementConflict(pixel, [], { type: "ramp", x: 1600, y: 760, rot: 3 })).toEqual({ issue: "outside", edges: ["right"] });
    const finale = level("finale");
    const near = placementConflict(finale, [], { type: "spring", x: 1700, y: 600, rot: 2 })!;
    expect(conflictText(near, levelLandmarks(finale), [])).toBe("fica perto demais do sino");
  });
});

describe("part words", () => {
  it("describe poses and number twins", () => {
    expect(poseText("ramp", 3)).toBe("reta");
    expect(poseText("ramp", 0)).toBe("descendo para a esquerda, 45 graus");
    expect(poseText("spring", 3)).toBe("apontando para cima e para a direita, 15 graus");
    expect(poseText("fan", 1)).toBe("soprando para a esquerda");
    expect(poseText("belt", 0)).toBe("levando para a direita");
    expect(partNoun("belt", 2, 2).word).toBe("esteira 2");
    expect(partNoun("fan", 1, 1)).toEqual({ word: "ventilador", female: false });
  });

  it("keep movement messages short and only flag changes", () => {
    expect(moveMessage({ dir: "right", amount: 1, hitEdge: false, conflict: null, becameValid: false, place: "logo à direita da ponta da prateleira", path: null })).toBe(
      "Direita. Logo à direita da ponta da prateleira.",
    );
    expect(
      moveMessage({ dir: "up", amount: 3, hitEdge: true, conflict: "encosta no muro", becameValid: false, place: "2 passos abaixo do topo", path: "Caminho da última bolinha: passa por aqui." }),
    ).toBe("Para cima, 3 passos: borda da área de montagem, não dá para ir mais. Não cabe: encosta no muro. 2 passos abaixo do topo. Caminho da última bolinha: passa por aqui.");
  });

  it("give a detailed position on request", () => {
    const text = describeHeld({
      name: partNoun("ramp", 1, 1),
      type: "ramp",
      rot: 4,
      center: { x: 620, y: 420 },
      held: true,
      conflict: null,
      info: info("pixel"),
      reference: null,
      skipId: "part-1",
      path: [],
    });
    expect(text).toMatch(/^Rampa na mão, descendo para a direita, 15 graus\. Pode colocar aqui\. Fica no meio da altura, à esquerda, 7 passos da borda esquerda/);
    expect(text).toContain("logo à direita da ponta da prateleira de cima, 1 passo abaixo");
    expect(text).toMatch(/passos à esquerda do sino/);
  });
});

describe("run reports", () => {
  it("tell what the ball touched, missed and where it stopped", () => {
    const ramp = partLandmark(1, "ramp", 700, 800, 3, partNoun("ramp", 1, 1));
    const scene = info("pixel", [ramp]);
    const shelf = scene.landmarks.find((l) => l.noun.word === "prateleira de cima")!;
    const text = describeRun(
      {
        attempt: 2,
        touches: [shelf.id, "floor", "floor"],
        launches: [],
        winds: [],
        path: [
          { x: 190, y: 250 },
          { x: 520, y: 345 },
          { x: 760, y: 500 },
          { x: 900, y: FLOOR_Y - 22 },
        ],
        end: { x: 1000, y: FLOOR_Y - 22 },
        outcome: "stopped",
      },
      scene,
    );
    expect(text).toMatch(/^Tentativa 2\. A bolinha tocou na prateleira de cima e no chão\./);
    expect(text).toMatch(/Não tocou na rampa: passou \d+ passos? acima dela\./);
    expect(text).toMatch(/Parou no chão, no centro, \d+ passos à esquerda do sino/);
    expect(text).toMatch(/O mais perto que chegou do sino foi \d+ passos\.$/);
  });

  it("say whether the ball got past a wall and name spring and wind effects", () => {
    const spring = partLandmark(1, "spring", 580, 400, 3, partNoun("spring", 1, 1));
    const fan = partLandmark(2, "fan", 800, 300, 0, partNoun("fan", 1, 1));
    const scene = info("finale", [spring, fan]);
    const short = describeRun(
      { attempt: 1, touches: ["part-1"], launches: ["part-1"], winds: ["part-2"], path: [{ x: 600, y: 380 }, { x: 1000, y: 500 }], end: { x: 1050, y: FLOOR_Y - 22 }, outcome: "stopped" },
      scene,
    );
    expect(short).toContain("A mola jogou a bolinha para cima e para a direita.");
    expect(short).toContain("O vento do ventilador empurrou a bolinha.");
    expect(short).toContain("Não passou do muro.");
    const over = describeRun(
      { attempt: 1, touches: [], launches: [], winds: [], path: [{ x: 1000, y: 200 }, { x: 1300, y: 300 }], end: { x: 2100, y: 300 }, outcome: "out" },
      scene,
    );
    expect(over).toContain("Passou do muro.");
    expect(over).toContain("Saiu da garagem pela direita.");
  });

  it("celebrate a hit without distance advice", () => {
    const text = describeRun({ attempt: 1, touches: ["floor"], launches: [], winds: [], path: [], end: { x: 1600, y: 760 }, outcome: "success" }, info("pixel"));
    expect(text).toBe("Tentativa 1. A bolinha tocou no chão. Acertou o sino!");
  });
});
