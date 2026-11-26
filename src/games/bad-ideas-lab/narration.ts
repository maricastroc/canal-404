import type { Locale } from "@/i18n/locales";
import { BALL_R, FLOOR_Y, GRID, H, W, partAngle, partFacing, type PartType } from "./config";
import { COPY, capitalize, levelText, noun, type LabCopy, type Noun } from "./copy";
import {
  blockPoly,
  columnSpan,
  goalLayout,
  partPoly,
  polyBox,
  rectPoly,
  sceneBlocks,
  sensorGap,
  sensorPoly,
  type Box,
  type Conflict,
  type Poly,
  type Vec,
} from "./geometry";
import { actOf, type Block, type LevelDef, type Rect } from "./levels";

export type { Noun };

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

export type Side = "left" | "right";

export type HZone = "leftCorner" | "left" | "center" | "right" | "rightCorner";

export type VZone = "floor" | "high" | "middle" | "low";

export type Rank = "top" | "middle" | "bottom" | "left" | "right";

export type End = "upper" | "lower" | "left" | "right";

export type ButtonSide = "left" | "right" | "top";

export type Exit = "left" | "right" | "bottom" | null;

export type SceneInfo = { level: LevelDef; landmarks: Landmark[]; ball: Noun };

export type Reference = Landmark | null;

export function steps(px: number) {
  return Math.round(Math.abs(px) / GRID);
}

const sideOf = (v: number): Side => (v > 0 ? "right" : "left");

const centerX = (box: Box) => (box.left + box.right) / 2;

function hZone(x: number): HZone {
  if (x < W * 0.2) return "leftCorner";
  if (x < W * 0.4) return "left";
  if (x < W * 0.6) return "center";
  if (x < W * 0.8) return "right";
  return "rightCorner";
}

function vZone(y: number): VZone {
  if (y >= FLOOR_Y - 40) return "floor";
  if (y < FLOOR_Y / 3) return "high";
  if (y < (FLOOR_Y * 2) / 3) return "middle";
  return "low";
}

function heightZone(box: Box): VZone {
  const cy = (box.top + box.bottom) / 2;
  if (box.bottom >= FLOOR_Y - 8 && box.top > FLOOR_Y * 0.6) return "floor";
  return cy < FLOOR_Y / 3 ? "high" : cy < (FLOOR_Y * 2) / 3 ? "middle" : "low";
}

const VERTICAL_RANKS: Record<number, Rank[]> = { 2: ["top", "bottom"], 3: ["top", "middle", "bottom"] };
const HORIZONTAL_RANKS: Record<number, Rank[]> = { 2: ["left", "right"], 3: ["left", "middle", "right"] };

function topAt(poly: Poly, x: number, fallback: number) {
  return columnSpan(poly, x)?.top ?? fallback;
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

function surfaceEnds(lm: Landmark): { end: End; p: Vec; low: boolean }[] {
  const [topLeft, topRight] = lm.poly;
  const a = lm.angle;
  return [
    { end: a > 0 ? "upper" : a < 0 ? "lower" : "left", p: topLeft, low: a < 0 },
    { end: a > 0 ? "lower" : a < 0 ? "upper" : "right", p: topRight, low: a > 0 },
  ];
}

function distanceToRect(p: Vec, r: Rect) {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

export function partLandmark(id: number, type: PartType, x: number, y: number, rot: number, name: Noun): Landmark {
  return { id: `part-${id}`, noun: name, role: "part", poly: partPoly(type, x, y, rot), angle: partAngle(type, rot) };
}

export function sceneOrder(level: LevelDef, landmarks: Landmark[]) {
  const dir = level.pipe.vx < 0 ? -1 : 1;
  const cx = (lm: Landmark) => centerX(polyBox(lm.poly)) * dir;
  const pick = (role: LandmarkRole) => landmarks.filter((l) => l.role === role);
  const middle = [...pick("surface"), ...pick("wall")].sort((a, b) => cx(a) - cx(b));
  return [...pick("pipe"), ...middle, ...pick("goal"), ...pick("area")];
}

export class Narrator {
  private readonly copy: LabCopy;
  private readonly t: LabCopy["narration"];

  constructor(locale: Locale) {
    this.copy = COPY[locale];
    this.t = this.copy.narration;
  }

  ballNoun(level: Pick<LevelDef, "ball">) {
    return level.ball === "orange" ? this.t.nouns.orange : this.t.nouns.ball;
  }

  goalNoun(level: Pick<LevelDef, "goal">) {
    return this.t.nouns.goal[level.goal.type];
  }

  count(type: PartType, n: number) {
    const part = this.copy.parts[type];
    return `${n} ${n === 1 ? part.noun.word : part.plural}`;
  }

  list(items: string[]) {
    return this.t.list(items);
  }

  private blockNoun(b: Block): { noun: Noun; role: "surface" | "wall" } {
    const nouns = this.t.nouns.blocks;
    const tall = b.h > b.w * 1.5;
    const role = tall ? "wall" : "surface";
    switch (b.kind) {
      case "shelf":
        return { noun: nouns.shelf, role };
      case "counter":
        return { noun: nouns.counter, role };
      case "cabinet":
        return { noun: nouns.cabinet, role };
      case "crate":
        return { noun: nouns.crate, role };
      case "pole":
        return { noun: nouns.pole, role: "wall" };
      case "metal":
        return tall ? { noun: nouns.wall, role } : { noun: nouns.metalShelf, role };
    }
  }

  private disambiguate(items: { noun: Noun; box: Box }[]) {
    const groups = new Map<string, number[]>();
    items.forEach((item, i) => groups.set(item.noun.word, [...(groups.get(item.noun.word) ?? []), i]));
    for (const ids of groups.values()) {
      if (ids.length < 2) continue;
      const cy = (i: number) => (items[i].box.top + items[i].box.bottom) / 2;
      const cx = (i: number) => centerX(items[i].box);
      const ys = ids.map(cy);
      const vertical = Math.max(...ys) - Math.min(...ys) >= 120;
      const sorted = [...ids].sort((a, b) => (vertical ? cy(a) - cy(b) : cx(a) - cx(b)));
      const ranks = (vertical ? VERTICAL_RANKS : HORIZONTAL_RANKS)[ids.length];
      sorted.forEach((i, k) => {
        const base = items[i].noun;
        items[i].noun = ranks ? noun(this.t.ranked(base.word, ranks[k]), base.female) : { word: `${base.word} ${k + 1}`, female: base.female, numbered: true };
      });
    }
  }

  levelLandmarks(level: LevelDef): Landmark[] {
    const nouns = this.t.nouns;
    const blocks = sceneBlocks(level);
    const own = level.blocks.length;
    const named = blocks.slice(0, own).map((b) => ({ ...this.blockNoun(b), box: polyBox(blockPoly(b)) }));
    this.disambiguate(named);
    const list: Landmark[] = [{ id: "pipe", noun: nouns.pipe, role: "pipe", poly: rectPoly(level.pipe.x, level.pipe.y, 80, 60), angle: 0 }];
    blocks.forEach((b, i) => {
      const poly = blockPoly(b);
      if (i < own) {
        list.push({ id: `block-${i}`, noun: named[i].noun, role: named[i].role, poly, angle: b.angle ?? 0 });
        return;
      }
      const word = level.goal.type === "juicer" && b.kind === "pole" ? nouns.juicerStand : nouns.goalBody[level.goal.type];
      list.push({ id: `block-${i}`, noun: word, role: "goal-part", poly, angle: b.angle ?? 0 });
    });
    list.push({ id: "goal", noun: this.goalNoun(level), role: "goal", poly: sensorPoly(goalLayout(level.goal).sensor), angle: 0 });
    const r = level.build;
    list.push({ id: "area", noun: nouns.area, role: "area", poly: rectPoly(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h), angle: 0 });
    return list;
  }

  partNoun(type: PartType, index: number, sameCount: number): Noun {
    const base = this.copy.parts[type].noun;
    return sameCount > 1 ? { word: `${base.word} ${index}`, female: base.female, numbered: true } : noun(base.word, base.female);
  }

  stopLandmark(at: Vec, ball: Noun): Landmark {
    return { id: "stop", noun: noun(this.t.stopSpot(ball)), role: "stop", poly: rectPoly(at.x, at.y, BALL_R * 2, BALL_R * 2), angle: 0 };
  }

  poseText(type: PartType, rot: number) {
    return this.t.pose(type, partAngle(type, rot), sideOf(partFacing(type, rot)));
  }

  partSummary(name: Noun, type: PartType, rot: number) {
    return `${name.word}, ${this.poseText(type, rot)}`;
  }

  fitState(conflict: string | null) {
    return conflict ? this.t.noFit(conflict) : this.t.fits;
  }

  offPath(ball: Noun) {
    return this.t.offPath(ball);
  }

  private sideText(box: Box) {
    return this.t.side(hZone(centerX(box)));
  }

  regionText(box: Box) {
    return this.t.region(heightZone(box), hZone(centerX(box)));
  }

  relation(part: Poly, lm: Landmark): { text: string; distance: number } {
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
      if (touching || (above === Infinity && below === Infinity)) return { text: this.t.touching(target), distance: 0 };
      const isAbove = above <= below;
      const gap = Math.max(0, isAbove ? above : below);
      return { text: this.t.vertical(isAbove, steps(gap), target), distance: gap };
    }
    const left = a.right <= b.left + 2;
    const hgap = Math.max(0, left ? b.left - a.right : a.left - b.right);
    const vgap = Math.max(0, a.top - b.bottom, b.top - a.bottom);
    const aTop = topAt(part, left ? a.right - 4 : a.left + 4, a.top);
    const bTop = topAt(lm.poly, left ? b.left + 4 : b.right - 4, b.top);
    const dv = aTop - bTop;
    const text = this.t.beside({ side: left ? "left" : "right", h: steps(hgap), target, end: lm.role === "surface", v: steps(dv), lower: dv > 0, wall: lm.role === "wall" });
    return { text, distance: Math.hypot(hgap, vgap) };
  }

  pathText(rel: PathRelation | null, ball: Noun) {
    return rel ? this.t.path(rel, ball) : null;
  }

  conflictText(c: Conflict, landmarks: Landmark[], others: Noun[]) {
    switch (c.issue) {
      case "outside":
        return this.t.outside(c.edges);
      case "blocked": {
        if ("block" in c) {
          const lm = landmarks.find((l) => l.id === `block-${c.block}`);
          return lm ? this.t.touches(lm.noun) : this.t.touchesSomething;
        }
        if (c.near === "pipe") return this.t.tooClosePipe;
        const goal = landmarks.find((l) => l.role === "goal");
        return goal ? this.t.tooClose(goal.noun) : this.t.tooCloseGoal;
      }
      case "crowded": {
        const other = others[c.other];
        return other ? this.t.tooClose(other) : this.t.tooClosePart;
      }
    }
  }

  areaCoordinates(center: Vec, build: Rect) {
    return this.t.coords(steps(center.x - build.x), steps(center.y - build.y));
  }

  pointInArea(p: Vec, build: Rect) {
    const right = build.x + build.w;
    const bottom = build.y + build.h;
    const dx = p.x < build.x ? build.x - p.x : p.x > right ? p.x - right : 0;
    const dy = p.y < build.y ? build.y - p.y : p.y > bottom ? p.y - bottom : 0;
    const nearLeft = p.x - build.x <= right - p.x;
    const side: Side = nearLeft ? "left" : "right";
    const fromSide = steps(nearLeft ? p.x - build.x : right - p.x);
    if (dx === 0 && dy === 0) {
      const nearTop = p.y - build.y <= bottom - p.y;
      return this.t.insidePoint({ side, h: fromSide, top: nearTop, v: steps(nearTop ? p.y - build.y : bottom - p.y) });
    }
    return this.t.outsidePoint({
      dx: dx > 0 ? { n: steps(dx), side: p.x < build.x ? "left" : "right" } : null,
      dy: dy > 0 ? { n: steps(dy), above: p.y < build.y } : null,
      edge: dx === 0 ? { n: fromSide, side } : null,
      top: dy === 0 ? steps(p.y - build.y) : null,
    });
  }

  private boxInArea(box: Box, build: Rect): { text: string; inside: boolean } | null {
    const right = build.x + build.w;
    const bottom = build.y + build.h;
    const overlapX = Math.min(box.right, right) - Math.max(box.left, build.x);
    const overlapY = Math.min(box.bottom, bottom) - Math.max(box.top, build.y);
    if (overlapX > 0 && overlapY <= 0) {
      const gap = box.top >= bottom ? box.top - bottom : build.y - box.bottom;
      return { text: this.t.nearArea(steps(gap), box.top >= bottom ? "below" : "above"), inside: false };
    }
    if (overlapY > 0 && overlapX <= 0) {
      const gap = box.left >= right ? box.left - right : build.x - box.right;
      return { text: this.t.nearArea(steps(gap), box.left >= right ? "right" : "left"), inside: false };
    }
    if (overlapX > 0 && overlapY > 0) return { text: this.t.insideArea, inside: true };
    return null;
  }

  private supportOf(box: Box, landmarks: Landmark[], tolerance = 14): Noun | null {
    const cx = centerX(box);
    for (const lm of landmarks) {
      if (lm.role !== "surface" && lm.role !== "part" && lm.role !== "goal-part") continue;
      const span = columnSpan(lm.poly, cx);
      if (span && Math.abs(span.top - box.bottom) <= tolerance) return lm.noun;
    }
    if (box.bottom >= FLOOR_Y - tolerance) return this.t.nouns.floor;
    return null;
  }

  private nearest(poly: Poly, landmarks: Landmark[], skip: (lm: Landmark) => boolean) {
    let best: { lm: Landmark; text: string; distance: number } | null = null;
    for (const lm of landmarks) {
      if (skip(lm)) continue;
      const r = this.relation(poly, lm);
      if (!best || r.distance < best.distance) best = { lm, ...r };
    }
    return best;
  }

  private describeGoal(lm: Landmark, info: SceneInfo) {
    const { level, landmarks, ball } = info;
    const goal = level.goal;
    const body = landmarks.find((l) => l.role === "goal-part");
    const box = polyBox(lm.poly);
    const region = this.regionText(box);
    let text: string;
    switch (goal.type) {
      case "bell":
        text = this.t.bellGoal(region, goal.stand === "pole");
        break;
      case "target":
        text = this.t.targetGoal(region);
        break;
      case "juicer":
        text = this.t.juicerGoal(region, ball);
        break;
      case "pins":
        text = this.t.pinsGoal(region, this.supportOf(box, landmarks.filter((l) => l.role !== "goal-part")), ball);
        break;
      case "record": {
        const bodyBox = body ? polyBox(body.poly) : box;
        const support = this.supportOf(bodyBox, landmarks.filter((l) => l.role !== "goal-part"));
        text = this.t.leverGoal(this.regionText(bodyBox), support, centerX(box) < centerX(bodyBox) ? "left" : "right");
        break;
      }
      default: {
        const bodyBox = body ? polyBox(body.poly) : box;
        const support = this.supportOf(bodyBox, landmarks.filter((l) => l.role !== "goal-part"));
        const dx = centerX(box) - centerX(bodyBox);
        const where: ButtonSide = dx < -20 ? "left" : dx > 20 ? "right" : "top";
        text = this.t.buttonGoal(lm.noun, this.t.nouns.goalBody[goal.type], this.regionText(bodyBox), support, where);
      }
    }
    const near = this.nearest(lm.poly, landmarks, (l) => l === lm || ["goal-part", "area", "part", "stop"].includes(l.role));
    if (near) text += ` ${this.t.sits(near.text)}`;
    const area = this.boxInArea(box, level.build);
    if (area) text += ` ${this.t.lies(area.text)}`;
    return text;
  }

  private describeArea(level: LevelDef) {
    const b = level.build;
    return this.t.area(hZone(b.x + 1), hZone(b.x + b.w - 1), vZone(b.y + 1), vZone(b.y + b.h), steps(b.w), steps(b.h));
  }

  describeLandmark(lm: Landmark, info: SceneInfo) {
    const { level, landmarks, ball } = info;
    const box = polyBox(lm.poly);
    switch (lm.role) {
      case "pipe":
        return this.t.pipe(this.regionText(box), ball, level.pipe.vx < 0 ? "left" : "right");
      case "surface": {
        let text = this.t.surface(lm.noun, this.regionText(box), this.t.slope(lm.angle, lm.noun));
        const area = this.boxInArea(box, level.build);
        if (lm.angle === 0 && area && !area.inside) return `${text} ${this.t.sits(area.text)}`;
        const ends = surfaceEnds(lm).sort((p, q) => distanceToRect(p.p, level.build) - distanceToRect(q.p, level.build));
        const low = ends.find((e) => e.low);
        const chosen = lm.angle === 0 ? [ends[0]] : ends[0] === low ? [ends[0]] : ends;
        for (const e of chosen) text += ` ${this.t.endAt(e.end, this.pointInArea(e.p, level.build))}`;
        return text;
      }
      case "wall": {
        const top = { x: centerX(box), y: box.top };
        const area = this.boxInArea(box, level.build);
        let text = this.t.wall(lm.noun, this.regionText(box), steps(box.bottom - box.top));
        if (area && !area.inside) text += ` ${this.t.sits(area.text)}`;
        text += ` ${this.t.wallTop(this.pointInArea(top, level.build))}`;
        return text;
      }
      case "goal":
        return this.describeGoal(lm, info);
      case "goal-part":
        return this.t.thing(lm.noun, this.regionText(box));
      case "area":
        return this.describeArea(level);
      case "part": {
        const near = this.nearest(lm.poly, landmarks, (l) => l.id === lm.id || l.role === "area");
        return this.t.placedPart(lm.noun, this.regionText(box), near ? near.text : null);
      }
      case "stop": {
        const support = this.supportOf(box, landmarks);
        const goal = landmarks.find((l) => l.role === "goal");
        const where = support === this.t.nouns.floor ? this.sideText(box) : this.regionText(box);
        return this.t.stop(ball, support, where, goal ? this.relation(lm.poly, goal).text : null);
      }
    }
  }

  describeLevel(info: SceneInfo, index: number, total: number, inventory: string) {
    const { level, landmarks } = info;
    const text = levelText(this.copy, level.id);
    const scene = sceneOrder(level, landmarks)
      .map((lm) => this.describeLandmark(lm, info))
      .join(" ");
    return this.t.level(index + 1, total, actOf(index), text.title, text.goal, scene, inventory);
  }

  referenceRelation(poly: Poly, center: Vec, info: SceneInfo, reference: Reference, skipId: string) {
    if (reference?.role === "area") return this.t.inArea(this.areaCoordinates(center, info.level.build));
    if (reference) return this.relation(poly, reference).text;
    const near = this.nearest(poly, info.landmarks, (l) => l.id === skipId || l.role === "area");
    return near ? near.text : this.areaCoordinates(center, info.level.build);
  }

  moveMessage(args: { dir: Direction; amount: number; hitEdge: boolean; conflict: string | null; becameValid: boolean; place: string; path: string | null }) {
    const t = this.t;
    const head = `${t.direction(args.dir)}${args.amount > 1 ? t.moveSteps(args.amount) : ""}${args.hitEdge ? t.edgeStop : ""}.`;
    const state = args.conflict ? ` ${t.noFit(args.conflict)}` : args.becameValid ? ` ${t.fits}` : "";
    return `${head}${state} ${capitalize(args.place)}.${args.path ? ` ${args.path}` : ""}`;
  }

  describeHeld(args: {
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
    const t = this.t;
    const { info, reference } = args;
    const poly = partPoly(args.type, args.center.x, args.center.y, args.rot);
    const box = polyBox(poly);
    const intro = t.held(args.name, args.held, this.poseText(args.type, args.rot));
    const state = args.conflict ? ` ${t.noFit(args.conflict)}` : args.held ? ` ${t.fits}` : "";
    const where = ` ${t.heldWhere(this.regionText(box), this.areaCoordinates(args.center, info.level.build))}`;
    const rels: string[] = [];
    const used = new Set<string>([args.skipId, "area"]);
    if (reference && reference.role !== "area") {
      rels.push(this.relation(poly, reference).text);
      used.add(reference.id);
    }
    const ranked = info.landmarks
      .filter((l) => !used.has(l.id) && l.role !== "goal")
      .map((l) => ({ l, r: this.relation(poly, l) }))
      .sort((a, b) => a.r.distance - b.r.distance)
      .slice(0, reference && reference.role !== "area" ? 1 : 2);
    for (const { r } of ranked) rels.push(r.text);
    const goal = info.landmarks.find((l) => l.role === "goal");
    if (goal && !used.has(goal.id)) rels.push(this.relation(poly, goal).text);
    const path = this.pathText(pathRelation(poly, args.path), info.ball);
    return `${intro}${state}${where} ${t.nearby(rels)}${path ? ` ${path}` : ""}`;
  }

  describeRun(log: RunLog, info: SceneInfo) {
    const t = this.t;
    const { level, landmarks, ball } = info;
    const byId = new Map(landmarks.map((l) => [l.id, l] as const));
    const nounOf = (id: string) => (id === "floor" ? t.nouns.floor : id === "edge" ? t.nouns.edge : (byId.get(id)?.noun ?? null));
    const goal = landmarks.find((l) => l.role === "goal");
    const out: string[] = [t.attempt(log.attempt)];
    const seq: Noun[] = [];
    for (const id of log.touches) {
      const n = nounOf(id);
      if (n && seq[seq.length - 1]?.word !== n.word) seq.push(n);
    }
    if (!seq.length) out.push(t.touchedNothing(ball));
    else if (seq.length <= 6) out.push(t.touched(ball, seq));
    else out.push(t.touchedMany(ball, seq.slice(0, 5), seq[seq.length - 1]));
    for (const id of new Set(log.launches)) {
      const lm = byId.get(id);
      if (lm) out.push(t.launched(lm.noun, ball, lm.angle));
    }
    for (const id of new Set(log.winds)) {
      const lm = byId.get(id);
      if (lm) out.push(t.wind(lm.noun, ball));
    }
    const reached = new Set([...log.touches, ...log.winds]);
    const path = [...log.path, log.end];
    for (const lm of landmarks.filter((l) => l.role === "part")) {
      if (reached.has(lm.id)) continue;
      out.push(t.missed(lm.noun, pathRelation(lm.poly, path)));
    }
    if (goal) {
      const g = polyBox(goal.poly);
      const start = level.pipe.x;
      const toRight = centerX(g) > start;
      for (const wall of landmarks.filter((l) => l.role === "wall")) {
        const w = polyBox(wall.poly);
        const between = toRight ? w.left > start && w.right < g.left : w.right < start && w.left > g.right;
        if (!between) continue;
        const passed = path.some((p) => (toRight ? p.x > w.right : p.x < w.left));
        out.push(t.wallPassed(wall.noun, passed));
      }
    }
    const endPoly = rectPoly(log.end.x, log.end.y, BALL_R * 2, BALL_R * 2);
    const endBox = polyBox(endPoly);
    const goalRel = goal ? this.relation(endPoly, goal).text : null;
    switch (log.outcome) {
      case "success":
        out.push(t.hit(goal ? goal.noun : null));
        break;
      case "out":
        out.push(t.exit(log.end.x < 0 ? "left" : log.end.x > W ? "right" : log.end.y > H ? "bottom" : null));
        break;
      case "stopped": {
        const support = this.supportOf(endBox, landmarks, 10);
        const where = support === t.nouns.floor ? this.sideText(endBox) : this.regionText(endBox);
        out.push(t.stopped(support, where, goalRel));
        break;
      }
      case "timeout":
        out.push(t.timeout(ball, this.regionText(endBox), goalRel));
        break;
      case "cancelled":
        out.push(t.cancelled(ball, this.regionText(endBox), goalRel));
        break;
    }
    if (goal && log.outcome !== "success") {
      const closest = Math.min(...densify(path).map((p) => sensorGap(p, goal.poly)));
      out.push(t.closest(goal.noun, steps(closest)));
    }
    return out.join(" ");
  }
}
