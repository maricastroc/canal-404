import { BALL_R, FLOOR_Y, GRID, H, PARTS, W, partAngle, partFacing, type PartType } from "./config";
import {
  blockPoly,
  columnSpan,
  goalLayout,
  partPoly,
  polyBox,
  rectPoly,
  sceneBlocks,
  sensorPoly,
  type Box,
  type Conflict,
  type Poly,
  type Vec,
} from "./geometry";
import type { Block, LevelDef, Rect } from "./levels";

export type Noun = { word: string; female: boolean };

export type LandmarkRole = "pipe" | "surface" | "wall" | "goal" | "goal-part" | "part" | "stop" | "area";

export type Landmark = { id: string; noun: Noun; role: LandmarkRole; poly: Poly; angle: number };

export type PathRelation = { kind: "cross" } | { kind: "above" | "below"; n: number } | { kind: "left" | "right" };

export type RunOutcome = "stopped" | "out" | "timeout" | "success" | "cancelled";

export type RunLog = {
  attempt: number;
  touches: string[];
  launches: string[];
  winds: string[];
  path: Vec[];
  end: Vec;
  outcome: RunOutcome;
};

export type Direction = "left" | "right" | "up" | "down";

const noun = (word: string, female: boolean): Noun => ({ word, female });

export const the = (n: Noun) => `${n.female ? "a" : "o"} ${n.word}`;
export const ofThe = (n: Noun) => `${n.female ? "da" : "do"} ${n.word}`;
export const inThe = (n: Noun) => `${n.female ? "na" : "no"} ${n.word}`;
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function steps(px: number) {
  return Math.round(Math.abs(px) / GRID);
}

export function stepsText(n: number) {
  return n === 1 ? "1 passo" : `${n} passos`;
}

export function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

const FLOOR = noun("chão", false);
const EDGE = noun("parede da garagem", true);
const AREA = noun("área de montagem", true);

const GOAL_NOUN: Record<LevelDef["goal"]["type"], Noun> = {
  target: noun("alvo", false),
  bell: noun("sino", false),
  toaster: noun("botão da torradeira", false),
  juicer: noun("espremedor", false),
  remote: noun("botão do controle", false),
};

const GOAL_BODY: Record<LevelDef["goal"]["type"], Noun> = {
  target: noun("poste do alvo", false),
  bell: noun("poste do sino", false),
  toaster: noun("torradeira", true),
  juicer: noun("espremedor", false),
  remote: noun("controle", false),
};

export function ballNoun(level: Pick<LevelDef, "ball">) {
  return level.ball === "orange" ? noun("laranja", true) : noun("bolinha", true);
}

export function goalNoun(level: Pick<LevelDef, "goal">) {
  return GOAL_NOUN[level.goal.type];
}

function blockNoun(b: Block): { noun: Noun; role: "surface" | "wall" } {
  const tall = b.h > b.w * 1.5;
  const role = tall ? "wall" : "surface";
  switch (b.kind) {
    case "shelf":
      return { noun: noun("prateleira", true), role };
    case "counter":
      return { noun: noun("bancada", true), role };
    case "cabinet":
      return { noun: noun("armário", false), role };
    case "crate":
      return { noun: noun("caixote", false), role };
    case "pole":
      return { noun: noun("poste", false), role: "wall" };
    case "metal":
      return tall ? { noun: noun("muro", false), role } : { noun: noun("prateleira de metal", true), role };
  }
}

const VERTICAL_SUFFIX: Record<number, string[]> = { 2: ["de cima", "de baixo"], 3: ["de cima", "do meio", "de baixo"] };
const HORIZONTAL_SUFFIX: Record<number, string[]> = { 2: ["da esquerda", "da direita"], 3: ["da esquerda", "do meio", "da direita"] };

function disambiguate(items: { noun: Noun; box: Box }[]) {
  const groups = new Map<string, number[]>();
  items.forEach((item, i) => groups.set(item.noun.word, [...(groups.get(item.noun.word) ?? []), i]));
  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    const cy = (i: number) => (items[i].box.top + items[i].box.bottom) / 2;
    const cx = (i: number) => (items[i].box.left + items[i].box.right) / 2;
    const ys = ids.map(cy);
    const vertical = Math.max(...ys) - Math.min(...ys) >= 120;
    const sorted = [...ids].sort((a, b) => (vertical ? cy(a) - cy(b) : cx(a) - cx(b)));
    const names = (vertical ? VERTICAL_SUFFIX : HORIZONTAL_SUFFIX)[ids.length];
    sorted.forEach((i, k) => {
      const base = items[i].noun;
      items[i].noun = noun(`${base.word} ${names ? names[k] : k + 1}`, base.female);
    });
  }
}

export function levelLandmarks(level: LevelDef): Landmark[] {
  const blocks = sceneBlocks(level);
  const own = level.blocks.length;
  const named = blocks.slice(0, own).map((b) => ({ ...blockNoun(b), box: polyBox(blockPoly(b)) }));
  disambiguate(named);
  const list: Landmark[] = [{ id: "pipe", noun: noun("cano", false), role: "pipe", poly: rectPoly(level.pipe.x, level.pipe.y, 80, 60), angle: 0 }];
  blocks.forEach((b, i) => {
    const poly = blockPoly(b);
    if (i < own) {
      list.push({ id: `block-${i}`, noun: named[i].noun, role: named[i].role, poly, angle: b.angle ?? 0 });
      return;
    }
    const body = GOAL_BODY[level.goal.type];
    const word = level.goal.type === "juicer" && b.kind === "pole" ? noun("pé do espremedor", false) : body;
    list.push({ id: `block-${i}`, noun: word, role: "goal-part", poly, angle: b.angle ?? 0 });
  });
  list.push({ id: "goal", noun: goalNoun(level), role: "goal", poly: sensorPoly(goalLayout(level.goal).sensor), angle: 0 });
  const r = level.build;
  list.push({ id: "area", noun: AREA, role: "area", poly: rectPoly(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h), angle: 0 });
  return list;
}

export function partNoun(type: PartType, index: number, sameCount: number): Noun {
  const word = PARTS[type].name.toLowerCase();
  return noun(sameCount > 1 ? `${word} ${index}` : word, type !== "fan");
}

export function partLandmark(id: number, type: PartType, x: number, y: number, rot: number, name: Noun): Landmark {
  return { id: `part-${id}`, noun: name, role: "part", poly: partPoly(type, x, y, rot), angle: partAngle(type, rot) };
}

export function stopLandmark(at: Vec, ball: Noun): Landmark {
  return { id: "stop", noun: noun(`lugar onde a ${ball.word} parou`, false), role: "stop", poly: rectPoly(at.x, at.y, BALL_R * 2, BALL_R * 2), angle: 0 };
}

export function poseText(type: PartType, rot: number) {
  const a = partAngle(type, rot);
  const side = (v: number) => (v > 0 ? "direita" : "esquerda");
  switch (type) {
    case "ramp":
      return a === 0 ? "reta" : `descendo para a ${side(a)}, ${Math.abs(a)} graus`;
    case "spring":
      return a === 0 ? "apontando para cima" : `apontando para cima e para a ${side(a)}, ${Math.abs(a)} graus`;
    case "fan":
      return `soprando para a ${side(partFacing(type, rot))}`;
    case "belt":
      return `levando para a ${side(partFacing(type, rot))}`;
  }
}

export function partSummary(name: Noun, type: PartType, rot: number) {
  return `${name.word}, ${poseText(type, rot)}`;
}

function sideText(box: Box) {
  const cx = (box.left + box.right) / 2;
  return cx < W * 0.2 ? "no canto esquerdo" : cx < W * 0.4 ? "à esquerda" : cx < W * 0.6 ? "no centro" : cx < W * 0.8 ? "à direita" : "no canto direito";
}

export function regionText(box: Box) {
  const cy = (box.top + box.bottom) / 2;
  const h = sideText(box);
  const v = box.bottom >= FLOOR_Y - 8 && box.top > FLOOR_Y * 0.6 ? "embaixo, no chão" : cy < FLOOR_Y / 3 ? "no alto" : cy < (FLOOR_Y * 2) / 3 ? "no meio da altura" : "embaixo";
  return `${v}, ${h}`;
}

function horizontalZone(x: number): Noun {
  if (x < W * 0.2) return noun("canto esquerdo", false);
  if (x < W * 0.4) return noun("esquerda", true);
  if (x < W * 0.6) return noun("centro", false);
  if (x < W * 0.8) return noun("direita", true);
  return noun("canto direito", false);
}

function verticalZone(y: number): Noun {
  if (y >= FLOOR_Y - 40) return FLOOR;
  if (y < FLOOR_Y / 3) return noun("alto", false);
  if (y < (FLOOR_Y * 2) / 3) return noun("meio da altura", false);
  return noun("parte de baixo", true);
}

function atZone(n: Noun) {
  return n.female ? `à ${n.word}` : `no ${n.word}`;
}

function slopeText(angle: number, female: boolean) {
  const end = female ? "a" : "o";
  if (angle === 0) return `ret${end}`;
  return `${Math.abs(angle) <= 7 ? "levemente " : ""}inclinad${end}, descendo para a ${angle > 0 ? "direita" : "esquerda"}`;
}

function topAt(poly: Poly, x: number, fallback: number) {
  return columnSpan(poly, x)?.top ?? fallback;
}

export function relation(part: Poly, lm: Landmark): { text: string; distance: number } {
  const a = polyBox(part);
  const b = polyBox(lm.poly);
  const target = lm.noun;
  const lo = Math.max(a.left, b.left);
  const hi = Math.min(a.right, b.right);
  if (hi - lo > 2) {
    let above = Infinity;
    let below = Infinity;
    let touching = false;
    for (let i = 0; i <= 8; i += 1) {
      const x = lo + ((hi - lo) * i) / 8;
      const sa = columnSpan(part, x);
      const sb = columnSpan(lm.poly, x);
      if (!sa || !sb) continue;
      if (sa.bottom <= sb.top + 1) above = Math.min(above, sb.top - sa.bottom);
      else if (sa.top >= sb.bottom - 1) below = Math.min(below, sa.top - sb.bottom);
      else touching = true;
    }
    if (touching || (above === Infinity && below === Infinity)) return { text: `encostando ${inThe(target)}`, distance: 0 };
    const isAbove = above <= below;
    const gap = Math.max(0, isAbove ? above : below);
    const n = steps(gap);
    const word = isAbove ? "acima" : "abaixo";
    return { text: n === 0 ? `logo ${word} ${ofThe(target)}` : `${stepsText(n)} ${word} ${ofThe(target)}`, distance: gap };
  }
  const left = a.right <= b.left + 2;
  const hgap = Math.max(0, left ? b.left - a.right : a.left - b.right);
  const vgap = Math.max(0, a.top - b.bottom, b.top - a.bottom);
  const aTop = topAt(part, left ? a.right - 4 : a.left + 4, a.top);
  const bTop = topAt(lm.poly, left ? b.left + 4 : b.right - 4, b.top);
  const dv = aTop - bTop;
  const h = steps(hgap);
  const v = steps(dv);
  const side = left ? "esquerda" : "direita";
  const hText = h === 0 ? `logo à ${side}` : `${stepsText(h)} à ${side}`;
  const anchor = lm.role === "surface" ? `da ponta ${ofThe(target)}` : ofThe(target);
  const wall = lm.role === "wall";
  const vText = v === 0 ? (wall ? "na altura do topo" : "na mesma altura") : `${stepsText(v)} ${dv > 0 ? "abaixo" : "acima"}${wall ? " do topo" : ""}`;
  return { text: `${hText} ${anchor}, ${vText}`, distance: Math.hypot(hgap, vgap) };
}

function densify(path: Vec[], spacing = 8) {
  const out: Vec[] = [];
  path.forEach((p, i) => {
    if (i > 0) {
      const q = path[i - 1];
      const n = Math.floor(Math.hypot(p.x - q.x, p.y - q.y) / spacing);
      for (let k = 1; k < n; k += 1) out.push({ x: q.x + ((p.x - q.x) * k) / n, y: q.y + ((p.y - q.y) * k) / n });
    }
    out.push(p);
  });
  return out;
}

export function pathRelation(part: Poly, path: Vec[]): PathRelation | null {
  if (!path.length) return null;
  const a = polyBox(part);
  let above = Infinity;
  let below = Infinity;
  let inside = false;
  for (const p of densify(path)) {
    if (p.x < a.left - BALL_R * 0.5 || p.x > a.right + BALL_R * 0.5) continue;
    inside = true;
    const span = columnSpan(part, Math.min(Math.max(p.x, a.left), a.right));
    if (!span) continue;
    if (p.y + BALL_R > span.top - 2 && p.y - BALL_R < span.bottom + 2) return { kind: "cross" };
    if (p.y < span.top) above = Math.min(above, span.top - (p.y + BALL_R));
    else below = Math.min(below, p.y - BALL_R - span.bottom);
  }
  if (!inside) return path.every((p) => p.x < a.left) ? { kind: "left" } : { kind: "right" };
  if (above !== Infinity) return { kind: "above", n: steps(above) };
  return { kind: "below", n: steps(below) };
}

export function pathText(rel: PathRelation | null, ball: Noun) {
  if (!rel) return null;
  const subject = `Caminho da última ${ball.word}`;
  if (rel.kind === "cross") return `${subject}: passa por aqui.`;
  if (rel.kind === "above") return `${subject}: passa ${rel.n === 0 ? "logo" : stepsText(rel.n)} acima.`;
  if (rel.kind === "below") return `${subject}: passa ${rel.n === 0 ? "logo" : stepsText(rel.n)} abaixo.`;
  return null;
}

function edgeName(edge: "left" | "right" | "top" | "bottom") {
  return { left: "esquerda", right: "direita", top: "de cima", bottom: "de baixo" }[edge];
}

export function conflictText(c: Conflict, landmarks: Landmark[], others: Noun[]) {
  switch (c.issue) {
    case "outside": {
      const names = c.edges.map(edgeName);
      return names.length > 1 ? `passa das bordas ${joinList(names)} da área de montagem` : `passa da borda ${names[0] ?? ""} da área de montagem`;
    }
    case "blocked": {
      if ("block" in c) {
        const lm = landmarks.find((l) => l.id === `block-${c.block}`);
        return lm ? `encosta ${inThe(lm.noun)}` : "encosta em outra coisa";
      }
      if (c.near === "pipe") return "fica perto demais do cano";
      const goal = landmarks.find((l) => l.role === "goal");
      return goal ? `fica perto demais ${ofThe(goal.noun)}` : "fica perto demais do objetivo";
    }
    case "crowded": {
      const other = others[c.other];
      return other ? `fica perto demais ${ofThe(other)}` : "fica perto demais de outra peça";
    }
  }
}

function edgeDistance(n: number, edge: string) {
  return n === 0 ? `na borda ${edge}` : `${stepsText(n)} da borda ${edge}`;
}

export function areaCoordinates(center: Vec, build: Rect) {
  const dx = steps(center.x - build.x);
  const dy = steps(center.y - build.y);
  return `${dx === 0 ? "na borda esquerda" : `${stepsText(dx)} da borda esquerda`} da área de montagem e ${dy === 0 ? "no alto dela" : `${stepsText(dy)} abaixo do alto dela`}`;
}

export function pointInArea(p: Vec, build: Rect) {
  const right = build.x + build.w;
  const bottom = build.y + build.h;
  const dx = p.x < build.x ? build.x - p.x : p.x > right ? p.x - right : 0;
  const dy = p.y < build.y ? build.y - p.y : p.y > bottom ? p.y - bottom : 0;
  if (dx === 0 && dy === 0) {
    const nearLeft = p.x - build.x <= right - p.x;
    const nearTop = p.y - build.y <= bottom - p.y;
    const h = edgeDistance(steps(nearLeft ? p.x - build.x : right - p.x), nearLeft ? "esquerda" : "direita");
    const vn = steps(nearTop ? p.y - build.y : bottom - p.y);
    const v = nearTop ? (vn === 0 ? "no alto" : `${stepsText(vn)} do alto`) : edgeDistance(vn, "de baixo");
    return `dentro da área de montagem, ${h} e ${v}`;
  }
  const parts: string[] = [];
  if (dx > 0) parts.push(`${steps(dx) === 0 ? "logo" : stepsText(steps(dx))} à ${p.x < build.x ? "esquerda" : "direita"}`);
  if (dy > 0) parts.push(`${steps(dy) === 0 ? "logo" : stepsText(steps(dy))} ${p.y < build.y ? "acima" : "abaixo"}`);
  let text = `${joinList(parts)} da área de montagem`;
  if (dx === 0) {
    const nearLeft = p.x - build.x <= right - p.x;
    text += `, ${edgeDistance(steps(nearLeft ? p.x - build.x : right - p.x), nearLeft ? "esquerda" : "direita")} dela`;
  }
  if (dy === 0) text += `, ${steps(p.y - build.y) === 0 ? "na altura do alto dela" : `${stepsText(steps(p.y - build.y))} abaixo do alto dela`}`;
  return text;
}

function boxInArea(box: Box, build: Rect): string | null {
  const right = build.x + build.w;
  const bottom = build.y + build.h;
  const overlapX = Math.min(box.right, right) - Math.max(box.left, build.x);
  const overlapY = Math.min(box.bottom, bottom) - Math.max(box.top, build.y);
  if (overlapX > 0 && overlapY <= 0) {
    const gap = box.top >= bottom ? box.top - bottom : build.y - box.bottom;
    const n = steps(gap);
    return `${n === 0 ? "logo" : stepsText(n)} ${box.top >= bottom ? "abaixo" : "acima"} da área de montagem`;
  }
  if (overlapY > 0 && overlapX <= 0) {
    const gap = box.left >= right ? box.left - right : build.x - box.right;
    const n = steps(gap);
    return `${n === 0 ? "logo" : stepsText(n)} à ${box.left >= right ? "direita" : "esquerda"} da área de montagem`;
  }
  if (overlapX > 0 && overlapY > 0) return "dentro da área de montagem";
  return null;
}

function surfaceEnds(lm: Landmark) {
  const [topLeft, topRight] = lm.poly;
  const a = lm.angle;
  const leftName = a > 0 ? "ponta de cima" : a < 0 ? "ponta de baixo" : "ponta esquerda";
  const rightName = a > 0 ? "ponta de baixo" : a < 0 ? "ponta de cima" : "ponta direita";
  return [
    { name: leftName, p: topLeft, low: a < 0 },
    { name: rightName, p: topRight, low: a > 0 },
  ];
}

function distanceToRect(p: Vec, r: Rect) {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

function supportOf(box: Box, landmarks: Landmark[], tolerance = 14): Noun | null {
  const cx = (box.left + box.right) / 2;
  for (const lm of landmarks) {
    if (lm.role !== "surface" && lm.role !== "part" && lm.role !== "goal-part") continue;
    const span = columnSpan(lm.poly, cx);
    if (span && Math.abs(span.top - box.bottom) <= tolerance) return lm.noun;
  }
  if (box.bottom >= FLOOR_Y - tolerance) return FLOOR;
  return null;
}

function nearest(poly: Poly, landmarks: Landmark[], skip: (lm: Landmark) => boolean) {
  let best: { lm: Landmark; text: string; distance: number } | null = null;
  for (const lm of landmarks) {
    if (skip(lm)) continue;
    const r = relation(poly, lm);
    if (!best || r.distance < best.distance) best = { lm, ...r };
  }
  return best;
}

export type SceneInfo = { level: LevelDef; landmarks: Landmark[]; ball: Noun };

function describeGoal(lm: Landmark, info: SceneInfo) {
  const { level, landmarks, ball } = info;
  const goal = level.goal;
  const bodies = landmarks.filter((l) => l.role === "goal-part");
  const body = bodies[0];
  const box = polyBox(lm.poly);
  const region = regionText(box);
  let text: string;
  switch (goal.type) {
    case "bell":
      text = `O sino é o objetivo. Fica ${region}, ${goal.stand === "pole" ? "em cima de um poste" : "pendurado num gancho"}.`;
      break;
    case "target":
      text = `O alvo é o objetivo. Fica ${region}, em cima de um poste.`;
      break;
    case "juicer":
      text = `O espremedor é o objetivo: a ${ball.word} tem que cair dentro do copo dele. Fica ${region}, em cima de um pé.`;
      break;
    default: {
      const bodyBox = body ? polyBox(body.poly) : box;
      const support = supportOf(bodyBox, landmarks.filter((l) => l.role !== "goal-part"));
      const dx = (box.left + box.right) / 2 - (bodyBox.left + bodyBox.right) / 2;
      const where = dx < -20 ? "no lado esquerdo" : dx > 20 ? "no lado direito" : "em cima";
      const owner = GOAL_BODY[goal.type];
      text = `${capitalize(the(lm.noun))} é o objetivo. ${capitalize(the(owner))} fica ${regionText(bodyBox)}${support ? `, em cima ${ofThe(support)}` : ""}; o botão fica ${where} ${owner.female ? "dela" : "dele"}.`;
    }
  }
  const near = nearest(lm.poly, landmarks, (l) => l === lm || ["goal-part", "area", "part", "stop"].includes(l.role));
  if (near) text += ` Fica ${near.text}.`;
  const area = boxInArea(box, level.build);
  if (area) text += ` Está ${area}.`;
  return text;
}

function describeArea(level: LevelDef) {
  const b = level.build;
  const [l, r] = [horizontalZone(b.x + 1), horizontalZone(b.x + b.w - 1)];
  const [t, d] = [verticalZone(b.y + 1), verticalZone(b.y + b.h)];
  const across = l.word === r.word ? `fica ${atZone(l)}` : `vai ${ofThe(l)} até ${the(r)}`;
  const down = t.word === d.word ? `${l.word === r.word ? "" : "fica "}${atZone(t)}` : `${l.word === r.word ? "vai " : ""}${ofThe(t)} até ${the(d)}`;
  return `A área de montagem, onde as peças podem ficar, ${across} e ${down}. Tem ${stepsText(steps(b.w))} de largura e ${steps(b.h)} de altura.`;
}

export function describeLandmark(lm: Landmark, info: SceneInfo) {
  const { level, landmarks, ball } = info;
  const box = polyBox(lm.poly);
  switch (lm.role) {
    case "pipe":
      return `O cano fica ${regionText(box)}. A ${ball.word} sai dele rolando para a ${level.pipe.vx < 0 ? "esquerda" : "direita"}.`;
    case "surface": {
      let text = `${capitalize(the(lm.noun))} fica ${regionText(box)}, ${slopeText(lm.angle, lm.noun.female)}.`;
      const area = boxInArea(box, level.build);
      if (lm.angle === 0 && area && area !== "dentro da área de montagem") return `${text} Fica ${area}.`;
      const ends = surfaceEnds(lm).sort((p, q) => distanceToRect(p.p, level.build) - distanceToRect(q.p, level.build));
      const low = ends.find((e) => e.low);
      const chosen = lm.angle === 0 ? [ends[0]] : ends[0] === low ? [ends[0]] : ends;
      for (const e of chosen) text += ` A ${e.name} fica ${pointInArea(e.p, level.build)}.`;
      return text;
    }
    case "wall": {
      const top = { x: (box.left + box.right) / 2, y: box.top };
      const area = boxInArea(box, level.build);
      let text = `${capitalize(the(lm.noun))} fica ${regionText(box)}, em pé, com ${stepsText(steps(box.bottom - box.top))} de altura.`;
      if (area && area !== "dentro da área de montagem") text += ` Fica ${area}.`;
      text += ` O topo fica ${pointInArea(top, level.build)}.`;
      return text;
    }
    case "goal":
      return describeGoal(lm, info);
    case "goal-part":
      return `${capitalize(the(lm.noun))} fica ${regionText(box)}.`;
    case "area":
      return describeArea(level);
    case "part": {
      const near = nearest(lm.poly, landmarks, (l) => l.id === lm.id || l.role === "area");
      return `${capitalize(lm.noun.word)} montad${lm.noun.female ? "a" : "o"} fica ${regionText(box)}${near ? `, ${near.text}` : ""}.`;
    }
    case "stop": {
      const support = supportOf(box, landmarks);
      const goal = landmarks.find((l) => l.role === "goal");
      const where = support === FLOOR ? sideText(box) : regionText(box);
      return `Na última tentativa, a ${ball.word} parou ${support ? `${inThe(support)}, ` : ""}${where}${goal ? `, ${relation(lm.poly, goal).text}` : ""}.`;
    }
  }
}

export function sceneOrder(level: LevelDef, landmarks: Landmark[]) {
  const dir = level.pipe.vx < 0 ? -1 : 1;
  const cx = (lm: Landmark) => {
    const b = polyBox(lm.poly);
    return ((b.left + b.right) / 2) * dir;
  };
  const pick = (role: LandmarkRole) => landmarks.filter((l) => l.role === role);
  const middle = [...pick("surface"), ...pick("wall")].sort((a, b) => cx(a) - cx(b));
  return [...pick("pipe"), ...middle, ...pick("goal"), ...pick("area")];
}

export function describeLevel(info: SceneInfo, index: number, total: number, inventory: string) {
  const { level, landmarks } = info;
  const scene = sceneOrder(level, landmarks)
    .map((lm) => describeLandmark(lm, info))
    .join(" ");
  const title = /[.!?]$/.test(level.title) ? level.title : `${level.title}.`;
  return `Fase ${index + 1} de ${total}: ${title} ${level.goalText} Cenário, a partir do cano: ${scene} Na caixa: ${inventory}.`;
}

export type Reference = Landmark | null;

export function referenceRelation(poly: Poly, center: Vec, info: SceneInfo, reference: Reference, skipId: string) {
  if (reference?.role === "area") return `fica ${areaCoordinates(center, info.level.build)}`;
  if (reference) return relation(poly, reference).text;
  const near = nearest(poly, info.landmarks, (l) => l.id === skipId || l.role === "area");
  return near ? near.text : areaCoordinates(center, info.level.build);
}

const DIRECTION_TEXT: Record<Direction, string> = { left: "Esquerda", right: "Direita", up: "Para cima", down: "Para baixo" };

export function moveMessage(args: { dir: Direction; amount: number; hitEdge: boolean; conflict: string | null; becameValid: boolean; place: string; path: string | null }) {
  const head = `${DIRECTION_TEXT[args.dir]}${args.amount > 1 ? `, ${args.amount} passos` : ""}${args.hitEdge ? ": borda da área de montagem, não dá para ir mais" : ""}.`;
  const state = args.conflict ? ` Não cabe: ${args.conflict}.` : args.becameValid ? " Pode colocar aqui." : "";
  return `${head}${state} ${capitalize(args.place)}.${args.path ? ` ${args.path}` : ""}`;
}

export function describeHeld(args: {
  name: Noun;
  type: PartType;
  rot: number;
  center: Vec;
  held: boolean;
  conflict: string | null;
  info: SceneInfo;
  reference: Reference;
  skipId: string;
  path: Vec[];
}) {
  const { info, reference } = args;
  const poly = partPoly(args.type, args.center.x, args.center.y, args.rot);
  const box = polyBox(poly);
  const intro = `${capitalize(args.name.word)} ${args.held ? "na mão" : `montad${args.name.female ? "a" : "o"}`}, ${poseText(args.type, args.rot)}.`;
  const state = args.conflict ? ` Não cabe: ${args.conflict}.` : args.held ? " Pode colocar aqui." : "";
  const where = ` Fica ${regionText(box)}, ${areaCoordinates(args.center, info.level.build)}.`;
  const rels: string[] = [];
  const used = new Set<string>([args.skipId, "area"]);
  if (reference && reference.role !== "area") {
    rels.push(relation(poly, reference).text);
    used.add(reference.id);
  }
  const ranked = info.landmarks
    .filter((l) => !used.has(l.id) && l.role !== "goal")
    .map((l) => ({ l, r: relation(poly, l) }))
    .sort((a, b) => a.r.distance - b.r.distance)
    .slice(0, reference && reference.role !== "area" ? 1 : 2);
  for (const { r } of ranked) rels.push(r.text);
  const goal = info.landmarks.find((l) => l.role === "goal");
  if (goal && !used.has(goal.id)) rels.push(relation(poly, goal).text);
  const path = pathText(pathRelation(poly, args.path), info.ball);
  return `${intro}${state}${where} Perto: ${rels.join("; ")}.${path ? ` ${path}` : ""}`;
}

function themSuffix(n: Noun) {
  return n.female ? "dela" : "dele";
}

function springDirection(angle: number) {
  return angle === 0 ? "para cima" : `para cima e para a ${angle > 0 ? "direita" : "esquerda"}`;
}

function distanceToSensor(p: Vec, poly: Poly) {
  const b = polyBox(poly);
  return Math.max(0, distanceToRect(p, { x: b.left, y: b.top, w: b.right - b.left, h: b.bottom - b.top }) - BALL_R);
}

export function describeRun(log: RunLog, info: SceneInfo) {
  const { level, landmarks, ball } = info;
  const byId = new Map(landmarks.map((l) => [l.id, l] as const));
  const nounOf = (id: string) => (id === "floor" ? FLOOR : id === "edge" ? EDGE : (byId.get(id)?.noun ?? null));
  const goal = landmarks.find((l) => l.role === "goal");
  const out: string[] = [`Tentativa ${log.attempt}.`];
  const seq: Noun[] = [];
  for (const id of log.touches) {
    const n = nounOf(id);
    if (n && seq[seq.length - 1]?.word !== n.word) seq.push(n);
  }
  const Ball = capitalize(the(ball));
  if (!seq.length) out.push(`${Ball} não tocou em nada.`);
  else if (seq.length <= 6) out.push(`${Ball} tocou ${joinList(seq.map(inThe))}.`);
  else out.push(`${Ball} tocou ${seq.slice(0, 5).map(inThe).join(", ")} e, por último, ${inThe(seq[seq.length - 1])}.`);
  for (const id of new Set(log.launches)) {
    const lm = byId.get(id);
    if (lm) out.push(`${capitalize(the(lm.noun))} jogou a ${ball.word} ${springDirection(lm.angle)}.`);
  }
  for (const id of new Set(log.winds)) {
    const lm = byId.get(id);
    if (lm) out.push(`O vento ${ofThe(lm.noun)} empurrou a ${ball.word}.`);
  }
  const reached = new Set([...log.touches, ...log.winds]);
  const path = [...log.path, log.end];
  for (const lm of landmarks.filter((l) => l.role === "part")) {
    if (reached.has(lm.id)) continue;
    const rel = pathRelation(lm.poly, path);
    const them = themSuffix(lm.noun);
    let detail = "";
    if (rel?.kind === "above") detail = `passou ${rel.n === 0 ? "logo" : stepsText(rel.n)} acima ${them}`;
    else if (rel?.kind === "below") detail = `passou ${rel.n === 0 ? "logo" : stepsText(rel.n)} abaixo ${them}`;
    else if (rel?.kind === "left" || rel?.kind === "right") detail = `não chegou até ${lm.noun.female ? "ela" : "ele"}`;
    else if (rel?.kind === "cross") detail = `passou bem perto ${them}`;
    out.push(`Não tocou ${inThe(lm.noun)}${detail ? `: ${detail}` : ""}.`);
  }
  if (goal) {
    const g = polyBox(goal.poly);
    const start = level.pipe.x;
    const toRight = (g.left + g.right) / 2 > start;
    for (const wall of landmarks.filter((l) => l.role === "wall")) {
      const w = polyBox(wall.poly);
      const between = toRight ? w.left > start && w.right < g.left : w.right < start && w.left > g.right;
      if (!between) continue;
      const passed = path.some((p) => (toRight ? p.x > w.right : p.x < w.left));
      out.push(`${passed ? "Passou" : "Não passou"} ${ofThe(wall.noun)}.`);
    }
  }
  const endPoly = rectPoly(log.end.x, log.end.y, BALL_R * 2, BALL_R * 2);
  const endBox = polyBox(endPoly);
  const goalRel = goal ? `, ${relation(endPoly, goal).text}` : "";
  switch (log.outcome) {
    case "success":
      out.push(goal ? `Acertou ${the(goal.noun)}!` : "Acertou o objetivo!");
      break;
    case "out": {
      const side = log.end.x < 0 ? "pela esquerda" : log.end.x > W ? "pela direita" : log.end.y > H ? "por baixo" : "";
      out.push(`Saiu da garagem ${side}.`.replace(" .", "."));
      break;
    }
    case "stopped": {
      const support = supportOf(endBox, landmarks, 10);
      const where = support === FLOOR ? sideText(endBox) : regionText(endBox);
      out.push(`Parou ${support ? `${inThe(support)}, ` : ""}${where}${goalRel}.`);
      break;
    }
    case "timeout":
      out.push(`O tempo acabou com a ${ball.word} ainda se mexendo, ${regionText(endBox)}${goalRel}.`);
      break;
    case "cancelled":
      out.push(`A ${ball.word} estava ${regionText(endBox)}${goalRel}.`);
      break;
  }
  if (goal && log.outcome !== "success") {
    const closest = Math.min(...densify(path).map((p) => distanceToSensor(p, goal.poly)));
    const n = steps(closest);
    out.push(n === 0 ? `Chegou a menos de 1 passo ${ofThe(goal.noun)}.` : `O mais perto que chegou ${ofThe(goal.noun)} foi ${stepsText(n)}.`);
  }
  return out.join(" ");
}
