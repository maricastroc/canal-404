import * as Phaser from "phaser";
import type { RaceCopy } from "../copy";
import type { ArlindoSet, Course, Zone, ZoneKey } from "../sim/course";
import { heightAt, type Obstacle, type Surface } from "../sim/track";
import { INK } from "./cart";
import { drawAntena, dressAntena } from "./antena";
import { drawFeira, dressFeira, feiraObstacle } from "./feira";
import { dressNeighborhood, SAMPLE_RES, sampleStreet, type SampleSpots } from "./sample";

export type Chunk = { x0: number; x1: number; objects: Phaser.GameObjects.GameObject[] };

export type ObstacleView = { obstacle: Obstacle; index: number; lane: number; view: Phaser.GameObjects.Container; hit: boolean; vx: number; vy: number; spin: number };

export type LipView = { x: number; surface: number; glow: Phaser.GameObjects.Graphics };

export type { Zone, ZoneKey } from "../sim/course";

export const STREET = 132;
export const LANES = { lina: -42, bruno: -84, mila: -126 } as const;
export const LANE_OFFSETS = [0, LANES.lina, LANES.bruno, LANES.mila] as const;
export const BACK_LANE = LANES.mila - 8;
const LANE_DEPTHS = [7.6, 5.95, 4.95, 4.05] as const;
const BG_INK = 0x3a3157;
const COBBLE_KEY = "dd-cobble-column";
const COBBLE_OX = 20;
const COBBLE_OY = 116;
const COBBLE_W = 60;
const COBBLE_H = 132;
const HOUSE_SCALE = 0.72;
const STALL_SCALE = 0.82;
export const STALL_W = 320 * STALL_SCALE;
export const VENDOR_SPOTS = [900, 4400, 7800];
export const STREET_SPOTS = { resident: 5400, cat: 11200 } as const;
export const BLEACHER_W = 380;
export const BLEACHER_ROWS = [28, 78] as const;
export const BLEACHER_SEATS = [
  [72, 176, 280],
  [124, 228, 332],
] as const;
const HOUSE_W = [300, 420, 360, 240, 380];

const ASPHALT = 0x4a4560;
const ASPHALT_TOP = 0x5b5577;
const ASPHALT_FAR = 0x6a6487;
const SIDEWALK = 0xcfc6e0;
const EARTH = 0x7a5a3c;
const GRASS = 0x5fb85a;
const CHUNK = 1800;

function v(x: number, y: number) {
  return new Phaser.Math.Vector2(x, y);
}

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function zonesOf(track: Course): Zone[] {
  return track.zones;
}

export function zoneAt(zones: Zone[], x: number): ZoneKey {
  for (const z of zones) if (x >= z.x0 && x < z.x1) return z.key;
  return zones[zones.length - 1].key;
}

export type Builder = {
  scene: Phaser.Scene;
  chunkFor: (x: number) => Chunk;
  add: <T extends Phaser.GameObjects.GameObject>(chunk: Chunk, obj: T) => T;
  backY: (x: number) => number;
  floorY: (x0: number, x1: number) => number;
  bleachers: number[];
  crowds: number[];
  taken: [number, number][];
  fonts: { display: string; body: string };
  sample: boolean;
  sampleSpots: SampleSpots | null;
};

export function buildTerrain(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer, track: Course, copy: RaceCopy, fonts: { display: string; body: string }, sample = false) {
  const road = track.surfaces[0];
  const chunks: Chunk[] = [];
  const add = <T extends Phaser.GameObjects.GameObject>(chunk: Chunk, obj: T) => {
    layer.add(obj);
    chunk.objects.push(obj);
    return obj;
  };
  const chunkFor = (x: number) => {
    const i = Math.max(0, Math.floor((x + 4000) / CHUNK));
    while (chunks.length <= i) chunks.push({ x0: chunks.length * CHUNK - 4000 - 900, x1: (chunks.length + 1) * CHUNK - 4000 + 900, objects: [] });
    return chunks[i];
  };
  const vy = road.ys.map((y, i) => {
    const x = road.xs[i];
    for (const rp of track.ramps) if (x > rp.x0 && x <= rp.x1 + 8) return rp.y0 + ((rp.y1 - rp.y0) * (x - rp.x0)) / (rp.x1 - rp.x0);
    return y;
  });
  const baseAt = (x: number) => {
    let i = 0;
    let lo = 0;
    let hi = road.xs.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (road.xs[mid] <= x) lo = mid;
      else hi = mid;
    }
    i = lo;
    const t = Math.max(0, Math.min(1, (x - road.xs[i]) / (road.xs[i + 1] - road.xs[i])));
    return vy[i] + (vy[i + 1] - vy[i]) * t;
  };
  const backY = (x: number) => baseAt(x) - STREET - 24;
  const floorY = (x0: number, x1: number) => {
    let low = backY(x1);
    for (let x = x0; x < x1; x += 40) low = Math.max(low, backY(x));
    return low;
  };
  const b: Builder = { scene, chunkFor, add, backY, floorY, bleachers: [], crowds: [], taken: [], fonts, sample, sampleSpots: null };
  const walled = !!track.set;
  const zones = zonesOf(track);
  const deckSurface = track.surfaces[1];
  const finalZone = zones.find((z) => z.key === "final") ?? { x0: 0, x1: 0 };
  const underDeck = (x0: number, x1: number) => !!deckSurface && x1 + 400 > deckSurface.x0 && x0 - 400 < deckSurface.x1;
  for (let x = finalZone.x0 + 900; x < finalZone.x1 - 600; x += 2100) {
    const spot = [0, 250, 500, -250].map((d) => x + d).find((sx) => {
      if (underDeck(sx, sx + BLEACHER_W)) return false;
      if (track.ramps.some((rp) => rp.x0 - 300 < sx + BLEACHER_W && rp.x1 + 300 > sx)) return false;
      let high = Infinity;
      let low = -Infinity;
      for (let px = sx - 6; px <= sx + BLEACHER_W; px += 40) {
        high = Math.min(high, backY(px));
        low = Math.max(low, backY(px));
      }
      return low - high < 50;
    });
    if (spot !== undefined && !b.bleachers.some((o) => Math.abs(o - spot) < BLEACHER_W + 200) && spot + BLEACHER_W < track.finish - 900) b.bleachers.push(spot);
    else if (spot === undefined && !underDeck(x, x + 360) && x < track.finish - 1200 && !track.ramps.some((rp) => rp.x0 - 500 < x + 460 && rp.x1 + 500 > x + 100)) b.crowds.push(x + 100);
  }
  const finishStand = track.finish - 600 - BLEACHER_W;
  for (let i = b.bleachers.length - 1; i >= 0; i -= 1) if (Math.abs(b.bleachers[i] - finishStand) < BLEACHER_W + 700) b.bleachers.splice(i, 1);
  for (let i = b.crowds.length - 1; i >= 0; i -= 1) if (Math.abs(b.crowds[i] - finishStand) < 900) b.crowds.splice(i, 1);
  b.bleachers.push(finishStand);
  for (const bx of b.bleachers) b.taken.push([bx - 30, bx + BLEACHER_W + 30]);
  for (const cx of b.crowds) b.taken.push([cx - 70, cx + 300]);
  b.taken.push([track.start - 700, track.start + 900], [track.finish - 760, track.finish + 520]);
  for (const zone of zones) b.taken.push([zone.x0 + 240, zone.x0 + 360]);

  for (let start = 0; start < road.xs.length - 1; ) {
    const x0 = road.xs[start];
    let end = start;
    while (end < road.xs.length - 1 && road.xs[end] < x0 + CHUNK) end += 1;
    const c = chunkFor((x0 + road.xs[end]) / 2);
    const g = add(c, scene.add.graphics());
    g.setDepth(0);
    let bottom = -Infinity;
    for (let i = start; i <= end; i += 1) bottom = Math.max(bottom, vy[i]);
    bottom += 2600;
    const front: Phaser.Math.Vector2[] = [];
    for (let i = start; i <= end; i += 1) front.push(v(road.xs[i], vy[i]));
    const coarse = front.filter((_, k) => k % 3 === 0 || k === front.length - 1);
    const band = (top: number, bot: number) => [...coarse.map((p) => v(p.x, p.y + top)), ...coarse.slice().reverse().map((p) => v(p.x, p.y + bot))];
    if (!walled) {
      g.fillStyle(EARTH, 1);
      g.fillPoints([...coarse.map((p) => v(p.x, p.y + 40)), v(road.xs[end], bottom), v(road.xs[start], bottom)], true);
      g.fillStyle(0x684a30, 1);
      g.fillPoints(band(210, 2600), true);
      g.fillStyle(GRASS, 1);
      g.fillPoints(band(60, 170), true);
      g.fillStyle(0x4c9a43, 1);
      g.fillPoints(band(150, 186), true);
      g.fillStyle(0xcfc6e0, 1);
      g.fillPoints(band(52, 66), true);
      g.lineStyle(4, INK, 0.8);
      g.strokePoints(coarse.map((p) => v(p.x, p.y + 66)), false);
    }
    for (let i = start; i < end && !walled; i += 9) {
      const fx = road.xs[i] + ((i * 37) % 60);
      const fy = vy[i] + 112 + ((i * 13) % 30);
      const kind = (i * 7) % 4;
      if (kind === 0) {
        g.fillStyle(0x2f6e35, 1);
        g.fillCircle(fx, fy, 26);
        g.fillCircle(fx + 26, fy + 6, 20);
        g.fillStyle(0x4c9a43, 1);
        g.fillCircle(fx - 4, fy - 4, 18);
      } else if (kind === 1) {
        for (let k = 0; k < 3; k += 1) {
          g.fillStyle(INK, 1);
          g.fillCircle(fx + k * 16, fy - (k % 2) * 8, 8);
          g.fillStyle([0xffc83d, 0xf06ba8, 0xfffaf0][k], 1);
          g.fillCircle(fx + k * 16, fy - (k % 2) * 8, 5);
        }
      } else if (kind === 2) {
        g.fillStyle(0x8a6a4e, 1);
        g.fillEllipse(fx, fy + 70, 30, 18);
        g.fillEllipse(fx + 60, fy + 110, 22, 14);
      }
    }
    g.fillStyle(SIDEWALK, 1);
    g.fillPoints(band(-STREET - 26, -STREET), true);
    g.fillStyle(ASPHALT_FAR, 1);
    g.fillPoints(band(-STREET, -STREET * 0.5), true);
    g.fillStyle(ASPHALT_TOP, 1);
    g.fillPoints(band(-STREET * 0.5, 0), true);
    g.fillStyle(ASPHALT, 1);
    g.fillPoints(band(0, 54), true);
    g.lineStyle(6, INK, 1);
    g.strokePoints(coarse.map((p) => v(p.x, p.y - STREET - 26)), false);
    g.lineStyle(4, INK, 0.6);
    g.strokePoints(front.map((p) => v(p.x, p.y - STREET)), false);
    g.lineStyle(10, INK, 1);
    g.strokePoints(front, false);
    g.lineStyle(4, 0xffffff, 0.35);
    g.strokePoints(front.map((p) => v(p.x, p.y + 7)), false);
    g.lineStyle(5, 0xffcf3f, 0.75);
    for (let i = start; i < end; i += 1) {
      if (Math.floor(road.xs[i] / 80) % 2 === 0) continue;
      g.beginPath();
      g.moveTo(road.xs[i], vy[i] - STREET * 0.5);
      g.lineTo(road.xs[i + 1], vy[i + 1] - STREET * 0.5);
      g.strokePath();
    }
    start = end;
  }

  if (track.cobbles.some((cob) => !cob.stairs) && !scene.textures.exists(COBBLE_KEY)) {
    const g = scene.add.graphics();
    g.lineStyle(3, INK, 0.75);
    for (let row = 0; row < 5; row += 1) {
      const ry = COBBLE_OY - 8 - row * 26;
      const ox = row % 2 === 0 ? 0 : 20;
      g.fillStyle(row === 0 ? 0x9a94b5 : 0x8f89ab, 1);
      g.fillRoundedRect(COBBLE_OX - 17 + ox, ry, 34, 20, 7);
      g.strokeRoundedRect(COBBLE_OX - 17 + ox, ry, 34, 20, 7);
    }
    g.generateTexture(COBBLE_KEY, COBBLE_W, COBBLE_H);
    g.destroy();
  }
  for (const cob of track.cobbles) {
    if (cob.stairs) continue;
    for (let x = cob.x0; x < cob.x1; x += 40) {
      const img = add(chunkFor(x), scene.add.image(x, heightAt(road, x), COBBLE_KEY));
      img.setOrigin(COBBLE_OX / COBBLE_W, COBBLE_OY / COBBLE_H).setDepth(0.5);
    }
  }

  const deck = track.surfaces[1];
  if (deck && deck.kind === "deck") drawDeck(b, deck, road);
  if (track.set?.kind === "arlindo") drawArlindo(b, track);
  else if (track.set?.kind === "feira") drawFeira(b, track, copy);
  else if (track.set?.kind === "antena") drawAntena(b, track);
  drawChalk(b, track, copy);
  drawPuddles(b, track);

  for (const rp of track.ramps) {
    if (track.set?.kind === "feira" && rp === track.set.trolley) continue;
    const surfaceAt = (lane: number) => {
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < road.xs.length && road.xs[i] <= rp.x1 + 0.5; i += 1) if (road.xs[i] >= rp.x0) pts.push(v(road.xs[i], road.ys[i] + lane));
      return pts;
    };
    const backLane = BACK_LANE;
    const wide = add(chunkFor(rp.x0 + 10), scene.add.graphics());
    wide.setDepth(2.6);
    const backTop = surfaceAt(backLane);
    const frontTop = surfaceAt(0);
    wide.fillStyle(INK, 1);
    wide.fillPoints([...backTop.map((p) => v(p.x, p.y - 5)), v(rp.x1 + 5, rp.lipY + backLane - 5), v(rp.x1 + 5, rp.lipY), ...frontTop.slice().reverse()], true);
    wide.fillStyle(0xd99a57, 1);
    wide.fillPoints([...backTop, ...frontTop.slice().reverse()], true);
    wide.lineStyle(3, INK, 0.35);
    for (let k = 1; k < 5; k += 1) wide.strokePoints(surfaceAt((backLane * k) / 5), false);
    wide.lineStyle(5, INK, 1);
    wide.strokePoints(backTop, false);
    wide.beginPath();
    wide.moveTo(rp.x1, rp.lipY + backLane);
    wide.lineTo(rp.x1, rp.lipY);
    wide.strokePath();
    for (const [lane, depth, shade] of [[0, 7.5, 1]] as const) {
      const c = chunkFor(rp.x0 + 10);
      const g = add(c, scene.add.graphics());
      g.setDepth(depth);
      const top: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < road.xs.length && road.xs[i] <= rp.x1 + 0.5; i += 1) if (road.xs[i] >= rp.x0) top.push(v(road.xs[i], road.ys[i] + lane));
      const poly = [...top, v(rp.x1, rp.y1 + 6 + lane), v(rp.x0, rp.y0 + 6 + lane)];
      const wood = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x6a4a3a), Phaser.Display.Color.ValueToColor(0xc98b4a), 1, shade);
      g.fillStyle(INK, 1);
      g.fillPoints(poly.map((p) => v(p.x + 6, p.y)), true);
      g.fillStyle(Phaser.Display.Color.GetColor(wood.r, wood.g, wood.b), 1);
      g.fillPoints(poly, true);
      g.fillStyle(0xe0a866, shade);
      g.fillPoints([...top, ...top.slice().reverse().map((p) => v(p.x, p.y + 16))], true);
      g.lineStyle(4, INK, 0.55);
      const span = rp.x1 - rp.x0;
      for (let k = 1; k < 6; k += 1) {
        const px = rp.x0 + (span * k) / 6;
        const ty = heightAt(road, px) + lane;
        const by = rp.y0 + ((rp.y1 - rp.y0) * (px - rp.x0)) / span + lane;
        g.beginPath();
        g.moveTo(px, ty + 18);
        g.lineTo(px, by);
        g.strokePath();
      }
      g.lineStyle(6, INK, 1);
      g.strokePoints(top, false);
      g.beginPath();
      g.moveTo(rp.x1, rp.lipY + lane);
      g.lineTo(rp.x1, rp.y1 + 6 + lane);
      g.strokePath();
    }
  }

  const lips: LipView[] = [];
  for (const lip of track.lips) {
    const s = track.surfaces[lip.surface];
    const c = chunkFor(lip.x);
    const g = add(c, scene.add.graphics());
    g.setDepth(7.6);
    g.lineStyle(6, 0xffffff, 0.85);
    for (let x = lip.x - 80; x < lip.x - 4; x += 22) {
      const y0 = heightAt(s, x) - 4;
      const y1 = heightAt(s, Math.min(x + 12, lip.x)) - 4;
      g.beginPath();
      g.moveTo(x, y0);
      g.lineTo(Math.min(x + 12, lip.x), y1);
      g.strokePath();
    }
    const ly = heightAt(s, lip.x - 1);
    g.fillStyle(0xffffff, 0.92);
    g.fillTriangle(lip.x - 14, ly - 16, lip.x + 2, ly - 16, lip.x - 6, ly - 34);
    const glow = add(c, scene.add.graphics());
    glow.setDepth(7.55);
    glow.lineStyle(22, 0xfff1a8, 1);
    glow.beginPath();
    glow.moveTo(lip.x - 82, heightAt(s, lip.x - 82) - 6);
    for (let x = lip.x - 60; x <= lip.x; x += 20) glow.lineTo(x, heightAt(s, Math.min(x, lip.x - 1)) - 6);
    glow.strokePath();
    glow.setAlpha(0);
    lips.push({ x: lip.x, surface: lip.surface, glow });
  }

  const r = rand(404);
  for (const zone of zones) decorateZone(b, zone, r, copy, track);
  drawBleachers(b);

  for (const sign of track.signs) {
    const c = chunkFor(sign.x);
    const y = baseAt(sign.x) + 84;
    const text = copy.signs[sign.key];
    const label = add(c, scene.add.text(sign.x, y, text, { fontFamily: fonts.display, fontSize: "26px", color: "#1d1830", align: "center", wordWrap: { width: 280 } }));
    label.setOrigin(0.5, 0.5).setDepth(13.1);
    const w = Math.max(170, label.width + 36);
    const h = label.height + 24;
    const g = add(c, scene.add.graphics());
    g.setDepth(13);
    g.fillStyle(INK, 1);
    g.fillRect(sign.x - 7, y, 14, 90);
    g.fillRoundedRect(sign.x - w / 2 - 5, y - h / 2 - 5, w + 10, h + 10, 10);
    g.fillStyle(0xffe9a8, 1);
    g.fillRoundedRect(sign.x - w / 2, y - h / 2, w, h, 8);
  }

  drawStart(b, track, copy);
  drawFinish(b, track, copy);

  const obstacles: ObstacleView[] = [];
  track.obstacles.forEach((o, index) => {
    if (o.kind === "truck" || o.kind === "hose" || o.kind === "fence" || o.kind === "bag") return;
    const lanes = o.kind === "line" || o.surface !== 0 ? [0] : [0, 1, 2, 3];
    for (const lane of lanes) {
      const c = chunkFor(o.x);
      const y = heightAt(track.surfaces[o.surface], o.x) + LANE_OFFSETS[lane];
      const view = add(c, scene.add.container(o.x, y));
      view.setDepth(o.kind === "line" ? 9.5 : o.surface !== 0 ? 7.6 : LANE_DEPTHS[lane]);
      view.add(feiraObstacle(scene, o) ?? drawObstacle(scene, o));
      if (lane > 0) view.setScale(0.96);
      if (lane === 0 && o.kind !== "line" && o.kind !== "pothole" && o.surface === 0 && !o.roll) {
        const pad = add(c, scene.add.graphics());
        pad.setDepth(7.58);
        for (let i = 0; i < 8; i += 1) {
          const x0 = o.x - 84 + i * 21;
          const x1 = x0 + 21;
          const y0 = heightAt(road, x0);
          const y1 = heightAt(road, x1);
          pad.fillStyle(i % 2 === 0 ? 0xe8433a : 0xfbf5e6, 0.9);
          pad.fillPoints([v(x0, y0), v(x1, y1), v(x1 - 8, y1 + 12), v(x0 - 8, y0 + 12)], true);
        }
      }
      obstacles.push({ obstacle: o, index, lane, view, hit: false, vx: 0, vy: 0, spin: 0 });
    }
  });

  return { chunks, obstacles, lips, zones, builder: b };
}

function drawStart(b: Builder, track: Course, copy: RaceCopy) {
  const x = track.start + 120;
  const c = b.chunkFor(x);
  const base = b.backY(x);
  const g = b.add(c, b.scene.add.graphics());
  g.setDepth(-3);
  g.fillStyle(INK, 1);
  g.fillRect(x - 6, base - 250, 18, 270);
  g.fillRect(x + 380, base - 250, 18, 270);
  g.fillRect(x + 296, base - 252, 8, 30);
  g.fillRoundedRect(x - 20, base - 310, 430, 70, 16);
  g.fillStyle(0xef4f43, 1);
  g.fillRoundedRect(x - 12, base - 302, 414, 54, 12);
  const t = b.add(c, b.scene.add.text(x + 195, base - 275, copy.start, { fontFamily: b.fonts.display, fontSize: "40px", color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 9 }));
  t.setOrigin(0.5).setDepth(-2.9);
  const startLine = b.add(c, b.scene.add.graphics());
  startLine.setDepth(0.6);
  const ry = heightAt(track.surfaces[0], track.start);
  for (let k = 0; k < 6; k += 1) {
    startLine.fillStyle(k % 2 === 0 ? 0xffffff : INK, 1);
    startLine.fillRect(track.start + 60, ry - STREET + k * 22, 16, 22);
  }
}

function drawFinish(b: Builder, track: Course, copy: RaceCopy) {
  const fx = track.finish;
  const c = b.chunkFor(fx);
  const road = track.surfaces[0];
  const fy = heightAt(road, fx);
  const back = b.add(c, b.scene.add.graphics());
  back.setDepth(-2);
  back.fillStyle(INK, 1);
  back.fillRect(fx - 14, fy - STREET - 280, 26, 400);
  const front = b.add(c, b.scene.add.graphics());
  front.setDepth(11);
  front.fillStyle(INK, 1);
  front.fillRect(fx + 2, fy - 280, 26, 300);
  front.fillStyle(INK, 1);
  front.fillRect(fx - 20, fy - STREET - 320, 60, STREET + 90);
  for (let i = 0; i < 6; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      front.fillStyle((i + j) % 2 === 0 ? 0xffffff : INK, 1);
      front.fillRect(fx - 14 + j * 16, fy - STREET - 314 + i * 28, 16, 28);
    }
  }
  const banner = b.add(c, b.scene.add.graphics());
  banner.setDepth(-1.9);
  banner.fillStyle(INK, 1);
  banner.fillRoundedRect(fx - 330, fy - STREET - 400, 680, 110, 18);
  banner.fillStyle(0xffcf3f, 1);
  banner.fillRoundedRect(fx - 322, fy - STREET - 392, 664, 94, 14);
  const t = b.add(c, b.scene.add.text(fx + 10, fy - STREET - 345, track.id === "antena" ? copy.live : copy.finish, { fontFamily: b.fonts.display, fontSize: "70px", color: "#ef4f43", stroke: "#1d1830", strokeThickness: 12 }));
  t.setOrigin(0.5).setDepth(-1.8);
  const line = b.add(c, b.scene.add.graphics());
  line.setDepth(0.6);
  for (let k = 0; k < 7; k += 1) {
    for (let j = 0; j < 2; j += 1) {
      line.fillStyle((k + j) % 2 === 0 ? 0xffffff : INK, 1);
      line.fillRect(fx - 16 + j * 16, fy - STREET + k * 26, 16, 26);
    }
  }
}

function drawDeck(b: Builder, deck: Surface, road: Surface) {
  const { scene, chunkFor, add } = b;
  for (let x = deck.x0 + 120; x < deck.x1 - 60; x += 640) {
    const c = chunkFor(x);
    const g = add(c, scene.add.graphics());
    g.setDepth(-1);
    const top = heightAt(deck, x) + 40;
    const bottom = heightAt(road, x) - STREET;
    g.fillStyle(INK, 1);
    g.fillRect(x - 30, top, 60, bottom - top);
    g.fillStyle(0xb9b2cf, 1);
    g.fillRect(x - 24, top, 48, bottom - top);
    g.fillStyle(0x9f97ba, 1);
    g.fillRect(x + 6, top, 18, bottom - top);
  }
  for (let start = 0; start < deck.xs.length - 1; ) {
    const x0 = deck.xs[start];
    let end = start;
    while (end < deck.xs.length - 1 && deck.xs[end] < x0 + CHUNK) end += 1;
    const c = chunkFor((x0 + deck.xs[end]) / 2);
    const g = add(c, scene.add.graphics());
    g.setDepth(1);
    const front: Phaser.Math.Vector2[] = [];
    for (let i = start; i <= end; i += 1) front.push(v(deck.xs[i], deck.ys[i]));
    const band = (t: number, bt: number) => [...front.map((p) => v(p.x, p.y + t)), ...front.slice().reverse().map((p) => v(p.x, p.y + bt))];
    g.fillStyle(0x8f87ae, 1);
    g.fillPoints(band(-STREET, 0), true);
    g.fillStyle(0xa79fc4, 1);
    g.fillPoints(band(0, 44), true);
    g.lineStyle(6, INK, 1);
    g.strokePoints(front, false);
    g.strokePoints(front.map((p) => v(p.x, p.y + 44)), false);
    g.lineStyle(4, INK, 0.8);
    g.strokePoints(front.map((p) => v(p.x, p.y - STREET)), false);
    g.lineStyle(4, INK, 0.9);
    for (let i = start; i <= end; i += 6) {
      g.beginPath();
      g.moveTo(deck.xs[i], deck.ys[i] - STREET);
      g.lineTo(deck.xs[i], deck.ys[i] - STREET - 44);
      g.strokePath();
    }
    g.strokePoints(front.map((p) => v(p.x, p.y - STREET - 44)), false);
    start = end;
  }
}

const WALLS = [0xf6c56a, 0xa8d8f0, 0xf4a3c0, 0xb7e3a1, 0xd4b8f2, 0xf7d9a8, 0xffb08a, 0x9fd8c8];

function house(g: Phaser.GameObjects.Graphics, kind: number, x: number, base: number, r: () => number) {
  const tone = WALLS[Math.floor(r() * WALLS.length)];
  const roof = [0xd8573f, 0xc4352c, 0xb06c3f][Math.floor(r() * 3)];
  const win = (wx: number, wy: number, w = 54, h = 58, shutters = true) => {
    g.fillStyle(BG_INK, 1);
    g.fillRect(wx - 5, wy - 5, w + 10, h + 10);
    g.fillStyle(0xfff3c8, 1);
    g.fillRect(wx, wy, w, h);
    g.lineStyle(4, BG_INK, 1);
    g.beginPath();
    g.moveTo(wx + w / 2, wy);
    g.lineTo(wx + w / 2, wy + h);
    g.strokePath();
    if (shutters) {
      g.fillStyle(0x3fc6a8, 1);
      g.fillRect(wx - 22, wy, 16, h);
      g.fillRect(wx + w + 6, wy, 16, h);
    }
  };
  const box = (x0: number, y0: number, w: number, h: number, color: number) => {
    g.fillStyle(BG_INK, 1);
    g.fillRect(x0 - 6, y0 - 6, w + 12, h + 12);
    g.fillStyle(color, 1);
    g.fillRect(x0, y0, w, h);
  };
  const roofTri = (x0: number, y0: number, w: number, h: number) => {
    g.fillStyle(BG_INK, 1);
    g.fillTriangle(x0 - 34, y0 + 4, x0 + w + 34, y0 + 4, x0 + w / 2, y0 - h - 8);
    g.fillStyle(roof, 1);
    g.fillTriangle(x0 - 22, y0, x0 + w + 22, y0, x0 + w / 2, y0 - h);
    g.lineStyle(3, BG_INK, 0.35);
    for (let k = 1; k < 4; k += 1) {
      g.beginPath();
      g.moveTo(x0 - 22 + (k * (w / 2 + 22)) / 4, y0 - (k * h) / 4);
      g.lineTo(x0 + w + 22 - (k * (w / 2 + 22)) / 4, y0 - (k * h) / 4);
      g.strokePath();
    }
  };
  if (kind === 0) {
    const w = 300;
    const h = 380;
    box(x, base - h, w, h + 200, tone);
    roofTri(x, base - h, w, 110);
    win(x + 40, base - h + 50);
    win(x + 190, base - h + 50);
    g.fillStyle(BG_INK, 1);
    g.fillRect(x - 16, base - h + 150, w + 32, 12);
    for (let k = 0; k <= 10; k += 1) g.fillRect(x - 10 + k * 31, base - h + 120, 6, 32);
    g.fillRect(x - 16, base - h + 116, w + 32, 8);
    win(x + 40, base - 150);
    box(x + 190, base - 170, 76, 170, 0x9a6440);
    g.fillStyle(0xffcf3f, 1);
    g.fillCircle(x + 250, base - 86, 6);
  } else if (kind === 1) {
    const w = 420;
    const h = 210;
    box(x, base - h, w, h + 200, tone);
    g.fillStyle(BG_INK, 1);
    g.fillRect(x - 40, base - h - 16, w + 80, 22);
    g.fillStyle(roof, 1);
    g.fillRect(x - 32, base - h - 10, w + 64, 12);
    roofTri(x + 20, base - h - 14, w - 40, 70);
    for (const px of [x + 12, x + 150]) {
      g.fillStyle(BG_INK, 1);
      g.fillRect(px, base - h + 10, 14, h - 10);
    }
    win(x + 40, base - h + 60);
    win(x + 280, base - h + 60, 80, 58);
    g.fillStyle(0x7c4527, 1);
    g.fillRect(x + 276, base - h + 122, 88, 14);
    for (let k = 0; k < 4; k += 1) {
      g.fillStyle([0xef4f43, 0xffcf3f, 0xf06ba8, 0xffcf3f][k], 1);
      g.fillCircle(x + 290 + k * 20, base - h + 116, 9);
    }
    box(x + 180, base - 160, 70, 160, 0x7c4527);
  } else if (kind === 2) {
    const w = 360;
    box(x, base - 150, w, 350, 0xe7d5b8);
    g.lineStyle(3, BG_INK, 0.25);
    for (let k = 0; k < 6; k += 1) {
      g.beginPath();
      g.moveTo(x, base - 150 + k * 25);
      g.lineTo(x + w, base - 150 + k * 25);
      g.strokePath();
    }
    box(x + 120, base - 150, 120, 150, 0x2f86c9);
    g.lineStyle(4, BG_INK, 0.9);
    for (let k = 1; k < 8; k += 1) {
      g.beginPath();
      g.moveTo(x + 120 + k * 15, base - 150);
      g.lineTo(x + 120 + k * 15, base);
      g.strokePath();
    }
    g.lineStyle(9, 0xf06ba8, 1);
    g.beginPath();
    g.moveTo(x + 22, base - 70);
    g.lineTo(x + 40, base - 110);
    g.lineTo(x + 60, base - 76);
    g.lineTo(x + 84, base - 116);
    g.strokePath();
    g.lineStyle(8, 0x63d6c1, 1);
    g.strokeCircle(x + 290, base - 90, 26);
  } else if (kind === 3) {
    const w = 240;
    const h = 560;
    box(x, base - h, w, h + 200, tone);
    for (let fl = 0; fl < 4; fl += 1) {
      win(x + 26, base - h + 40 + fl * 130, 64, 70, false);
      win(x + 150, base - h + 40 + fl * 130, 64, 70, false);
      g.fillStyle(0x9aa6b8, 1);
      g.fillRect(x + 156, base - h + 116 + fl * 130, 50, 26);
    }
    box(x + 70, base - h - 110, 100, 90, 0x2f86c9);
    g.fillStyle(BG_INK, 1);
    g.fillRect(x + 76, base - h - 20, 10, 20);
    g.fillRect(x + 154, base - h - 20, 10, 20);
  } else {
    const w = 380;
    const h = 260;
    box(x, base - h, w, h + 200, tone);
    roofTri(x, base - h, w, 120);
    win(x + 34, base - h + 54);
    box(x + 200, base - 150, 150, 150, 0xdcc394);
    g.lineStyle(4, BG_INK, 0.7);
    for (let k = 1; k < 7; k += 1) {
      g.beginPath();
      g.moveTo(x + 200, base - 150 + k * 21);
      g.lineTo(x + 350, base - 150 + k * 21);
      g.strokePath();
    }
    bike(g, x + 60, base);
  }
}

function bike(g: Phaser.GameObjects.Graphics, x: number, base: number) {
  g.lineStyle(9, BG_INK, 1);
  g.strokeCircle(x, base - 30, 28);
  g.strokeCircle(x + 92, base - 30, 28);
  g.lineStyle(5, 0x6fb6ff, 1);
  g.strokeCircle(x, base - 30, 28);
  g.strokeCircle(x + 92, base - 30, 28);
  g.lineStyle(9, BG_INK, 1);
  g.beginPath();
  g.moveTo(x, base - 30);
  g.lineTo(x + 36, base - 30);
  g.lineTo(x + 70, base - 74);
  g.lineTo(x + 30, base - 74);
  g.lineTo(x, base - 30);
  g.moveTo(x + 70, base - 74);
  g.lineTo(x + 92, base - 30);
  g.moveTo(x + 70, base - 74);
  g.lineTo(x + 66, base - 96);
  g.lineTo(x + 84, base - 98);
  g.moveTo(x + 30, base - 74);
  g.lineTo(x + 26, base - 90);
  g.strokePath();
  g.lineStyle(5, 0xef4f43, 1);
  g.beginPath();
  g.moveTo(x, base - 30);
  g.lineTo(x + 36, base - 30);
  g.lineTo(x + 70, base - 74);
  g.lineTo(x + 30, base - 74);
  g.lineTo(x, base - 30);
  g.strokePath();
}

function stall(g: Phaser.GameObjects.Graphics, x: number, base: number, colors: [number, number], fruit: number[]) {
  const w = 320;
  g.fillStyle(BG_INK, 1);
  g.fillRect(x + 10, base - 300, 14, 300);
  g.fillRect(x + w - 24, base - 300, 14, 300);
  for (let k = 0; k < 8; k += 1) {
    g.fillStyle(BG_INK, 1);
    g.fillTriangle(x - 20 + k * 45, base - 300, x + 25 + k * 45, base - 300, x + 2 + k * 45, base - 236);
    g.fillStyle(colors[k % 2], 1);
    g.fillTriangle(x - 14 + k * 45, base - 296, x + 19 + k * 45, base - 296, x + 2 + k * 45, base - 244);
  }
  g.fillStyle(BG_INK, 1);
  g.fillRect(x - 26, base - 330, w + 52, 36);
  for (let k = 0; k < 8; k += 1) {
    g.fillStyle(colors[k % 2], 1);
    g.fillRect(x - 20 + k * 45, base - 324, 45, 24);
  }
  g.fillStyle(BG_INK, 1);
  g.fillRect(x - 8, base - 116, w + 16, 22);
  g.fillStyle(0xb06c3f, 1);
  g.fillRect(x - 2, base - 112, w + 4, 14);
  g.fillStyle(BG_INK, 1);
  g.fillRect(x + 4, base - 98, w - 8, 98);
  g.fillStyle(0x9a6440, 1);
  g.fillRect(x + 10, base - 92, w - 20, 92);
  g.lineStyle(4, BG_INK, 0.5);
  for (let k = 1; k < 4; k += 1) {
    g.beginPath();
    g.moveTo(x + 10, base - 92 + k * 23);
    g.lineTo(x + w - 10, base - 92 + k * 23);
    g.strokePath();
  }
  for (let k = 0; k < 14; k += 1) {
    const fx = x + 20 + (k % 7) * 42;
    const fy = base - 128 - Math.floor(k / 7) * 22;
    g.fillStyle(BG_INK, 1);
    g.fillCircle(fx, fy, 16);
    g.fillStyle(fruit[k % fruit.length], 1);
    g.fillCircle(fx, fy, 12);
  }
}

function signBoard(b: Builder, c: Chunk, x: number, y: number, text: string, fill: number, color: string, size = 30, depth = -6, rot = 0) {
  const label = b.add(c, b.scene.add.text(x, y, text, { fontFamily: b.fonts.display, fontSize: `${size}px`, color }));
  label.setOrigin(0.5).setDepth(depth + 0.1).setRotation(rot);
  const g = b.add(c, b.scene.add.graphics());
  g.setDepth(depth);
  const w = label.width + 36;
  const h = label.height + 18;
  g.fillStyle(INK, 1);
  g.fillRoundedRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, 10);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
  g.setPosition(x, y).setRotation(rot);
  return { label, g };
}

function drawBleachers(b: Builder) {
  const { scene, chunkFor, add, floorY } = b;
  for (const bx of b.bleachers) {
    const c = chunkFor(bx + BLEACHER_W / 2);
    const y = floorY(bx - 6, bx + BLEACHER_W);
    const frame = add(c, scene.add.graphics());
    frame.setDepth(-17);
    frame.fillStyle(INK, 1);
    frame.fillRect(bx, y - 206, 12, 210);
    frame.fillRect(bx + BLEACHER_W - 12, y - 206, 12, 210);
    frame.fillRect(bx - 6, y - 212, BLEACHER_W + 12, 12);
    frame.fillStyle(0xef4f43, 1);
    frame.fillRect(bx, y - 209, BLEACHER_W, 5);
    BLEACHER_ROWS.forEach((lift, row) => {
      const rail = add(c, scene.add.graphics());
      rail.setDepth(row === 0 ? -16.45 : -16.65);
      rail.fillStyle(INK, 1);
      rail.fillRoundedRect(bx - 8, y - lift - 18, BLEACHER_W + 16, 24, 6);
      rail.fillStyle(row === 0 ? 0xc98b4a : 0xb47a3f, 1);
      rail.fillRoundedRect(bx - 3, y - lift - 14, BLEACHER_W + 6, 16, 4);
      rail.fillStyle(INK, 1);
      rail.fillRect(bx + 34, y - lift, 9, lift + 4);
      rail.fillRect(bx + BLEACHER_W - 43, y - lift, 9, lift + 4);
    });
    const balloonColors = [0xef4f43, 0xffc83d, 0x63d6c1, 0xf06ba8];
    for (let k = 0; k < 3; k += 1) {
      const px = bx + 70 + k * 120;
      frame.lineStyle(2, INK, 0.8);
      frame.beginPath();
      frame.moveTo(px, y - 210);
      frame.lineTo(px + 5, y - 290);
      frame.strokePath();
      frame.fillStyle(INK, 1);
      frame.fillEllipse(px + 5, y - 310, 40, 46);
      frame.fillStyle(balloonColors[(k + Math.floor(bx / 700)) % 4], 1);
      frame.fillEllipse(px + 5, y - 310, 33, 39);
    }
  }
}

function decorateZone(b: Builder, zone: Zone, r: () => number, copy: RaceCopy, track: Course) {
  const { scene, chunkFor, add, backY, floorY } = b;
  if (zone.key === "neighborhood") {
    b.sampleSpots = dressNeighborhood(b, track);
    return;
  }
  if (zone.key === "feira") {
    b.sampleSpots = dressFeira(b, track, copy);
    return;
  }
  if (zone.key === "antena") {
    b.sampleSpots = dressAntena(b, track, copy);
    return;
  }
  const plate = chunkFor(zone.x0 + 300);
  const py = backY(zone.x0 + 300);
  signBoard(b, plate, zone.x0 + 300, py - 230, copy.zones[zone.key], 0x2f86c9, "#fbf5e6", 28, -5);
  const post = add(plate, scene.add.graphics());
  post.setDepth(-6);
  post.fillStyle(INK, 1);
  post.fillRect(zone.x0 + 292, py - 214, 16, 224);
  if (zone.key === "street" && b.sample) {
    b.sampleSpots = sampleStreet(b, zone, track.start);
  } else if (zone.key === "street") {
    let kind = 0;
    for (let x = zone.x0 + 600; x < zone.x1 - 400; x += 520 + Math.floor(r() * 380)) {
      const hw = HOUSE_W[kind % 5] * HOUSE_SCALE;
      const reserved = zone.x0 + STREET_SPOTS.resident;
      if (x + hw > reserved - 230 && x < reserved + 230) {
        x = reserved + 230 - 520;
        continue;
      }
      const c = chunkFor(x);
      const g = add(c, scene.add.graphics());
      g.setDepth(-20);
      house(g, kind % 5, 0, 0, r);
      g.setPosition(x, floorY(x, x + hw)).setScale(HOUSE_SCALE);
      b.taken.push([x - 20, x + hw + 20]);
      if (kind % 5 === 2) {
        const tree = add(c, scene.add.image(x + 60, backY(x + 60) + 6, "tree-big").setOrigin(0.5, 1));
        tree.setDepth(-21).setScale(1.05);
      }
      kind += 1;
    }
    for (let x = zone.x0 + 900; x < zone.x1 - 600; x += 1700) {
      const c = chunkFor(x);
      const g = add(c, scene.add.graphics());
      g.setDepth(-8);
      const y = backY(x);
      g.fillStyle(INK, 1);
      g.fillRect(x, y - 300, 12, 300);
      g.fillRoundedRect(x - 2, y - 312, 60, 16, 6);
      g.fillStyle(0xffe27a, 1);
      g.fillCircle(x + 48, y - 298, 9);
      b.taken.push([x - 20, x + 70]);
    }
    for (let x = zone.x0 + 1300; x < zone.x1; x += 2300) {
      const c = chunkFor(x);
      const y = backY(x);
      const m = add(c, scene.add.image(x, y + 4, "mailbox").setOrigin(0.5, 1));
      m.setDepth(-7).setScale(0.9);
      const gn = add(c, scene.add.image(x + 120, backY(x + 120) + 4, "gnome").setOrigin(0.5, 1));
      gn.setDepth(-7).setScale(0.8);
      b.taken.push([x - 50, x + 160]);
    }
  } else if (zone.key === "market") {
    const palettes: [number, number][] = [
      [0xef4f43, 0xfffaf0],
      [0x63d6c1, 0xfffaf0],
      [0xffc83d, 0xfffaf0],
      [0x7b62c4, 0xfffaf0],
    ];
    const fruits = [
      [0xff8a3d, 0xffc83d],
      [0xef4f43, 0x93cf4c],
      [0xffc83d, 0xff8a3d],
      [0x93cf4c, 0xef4f43],
    ];
    const vendorStalls = VENDOR_SPOTS.map((v) => zone.x0 + v - 140);
    const placeStall = (x: number, k: number, signs: boolean) => {
      const c = chunkFor(x);
      const g = add(c, scene.add.graphics());
      g.setDepth(-12);
      stall(g, 0, 0, palettes[k % palettes.length], fruits[k % fruits.length]);
      const y = floorY(x, x + STALL_W);
      g.setPosition(x, y).setScale(STALL_SCALE);
      b.taken.push([x - 40, x + STALL_W + 40]);
      if (signs && k % 2 === 1) signBoard(b, c, x + 130, y - 300, k % 4 === 1 ? copy.shop.fruit : copy.shop.pastel, 0xfffaf0, "#ef4f43", 24, -11);
      if (signs && k % 5 === 3) signBoard(b, c, x + 210, y - 130, copy.shop.sale, 0xffc83d, "#1d1830", 20, -11, -0.12);
    };
    vendorStalls.forEach((x, i) => {
      placeStall(x, i, false);
      b.taken.push([x, x + 400]);
    });
    let k = 0;
    for (let x = zone.x0 + 500; x < zone.x1 - 400; x += 460 + Math.floor(r() * 120)) {
      if (vendorStalls.some((v) => Math.abs(v - x) < STALL_W + 240)) continue;
      placeStall(x, k, true);
      k += 1;
    }
  } else if (zone.key === "works") {
    for (let x = zone.x0 + 400; x < zone.x1 - 300; x += 900 + Math.floor(r() * 300)) {
      b.taken.push([x - 30, x + 530]);
      const c = chunkFor(x);
      const g = add(c, scene.add.graphics());
      g.setDepth(-14);
      const kind = Math.floor(r() * 3);
      if (kind === 0) {
        const feet = [0, 1, 2, 3].map((col) => backY(x + col * 90) + 6);
        const top = Math.min(...feet) - 420;
        g.lineStyle(10, INK, 1);
        for (let col = 0; col < 4; col += 1) {
          g.beginPath();
          g.moveTo(x + col * 90, feet[col]);
          g.lineTo(x + col * 90, top);
          g.strokePath();
        }
        for (let row = 0; row < 4; row += 1) {
          g.beginPath();
          g.moveTo(x - 10, top + row * 100);
          g.lineTo(x + 280, top + row * 100);
          g.strokePath();
        }
        g.lineStyle(5, 0xffc83d, 1);
        for (let col = 0; col < 4; col += 1) {
          g.beginPath();
          g.moveTo(x + col * 90, feet[col]);
          g.lineTo(x + col * 90, top);
          g.strokePath();
        }
        g.fillStyle(INK, 1);
        g.fillRect(x + 20, top + 90, 220, 26);
        g.fillStyle(0xb06c3f, 1);
        g.fillRect(x + 24, top + 94, 212, 18);
      } else if (kind === 1) {
        const y = floorY(x - 30, x + 270);
        g.fillStyle(INK, 1);
        g.fillEllipse(x + 120, y, 300, 170);
        g.fillStyle(0xe0b070, 1);
        g.fillEllipse(x + 120, y, 286, 156);
        g.fillStyle(0xc69256, 1);
        g.fillEllipse(x + 150, y + 20, 160, 70);
        g.fillStyle(INK, 1);
        g.fillRect(x + 220, y - 70, 8, 70);
        g.fillRect(x + 214, y - 76, 20, 10);
      } else {
        const y = floorY(x - 3, x + 257);
        for (let row = 0; row < 4; row += 1) {
          for (let col = 0; col < 5 - row; col += 1) {
            const bx = x + col * 52 + row * 26;
            const by = y - 30 - row * 30;
            g.fillStyle(INK, 1);
            g.fillRect(bx - 3, by - 3, 52, 32);
            g.fillStyle(0xc4352c, 1);
            g.fillRect(bx, by, 46, 26);
          }
        }
      }
      if (r() < 0.6) {
        const cone = add(c, scene.add.image(x + 340, floorY(x + 320, x + 360) + 4, "cone-prop").setOrigin(0.5, 1));
        cone.setDepth(-6).setScale(0.9);
      }
      if (r() < 0.5) {
        const sy = backY(x + 420);
        const post = add(c, scene.add.graphics());
        post.setDepth(-6.5);
        post.fillStyle(INK, 1);
        post.fillRect(x + 414, sy - 120, 12, 126);
        signBoard(b, c, x + 420, sy - 120, r() < 0.5 ? copy.shop.detour : copy.shop.slow, 0xff8a3d, "#1d1830", 26, -6);
      }
    }
    const craneX = (zone.x0 + zone.x1) / 2 - 500;
    b.taken.push([craneX - 30, craneX + 90]);
    const c = chunkFor(craneX);
    const g = add(c, scene.add.graphics());
    g.setDepth(-24);
    const y = backY(craneX);
    g.lineStyle(10, INK, 1);
    g.strokeRect(craneX, y - 900, 60, 900);
    g.lineStyle(5, 0xffc83d, 1);
    for (let k = 0; k < 9; k += 1) {
      g.beginPath();
      g.moveTo(craneX, y - k * 100);
      g.lineTo(craneX + 60, y - k * 100 - 100);
      g.strokePath();
    }
    g.lineStyle(12, INK, 1);
    g.beginPath();
    g.moveTo(craneX - 200, y - 900);
    g.lineTo(craneX + 700, y - 900);
    g.strokePath();
    g.lineStyle(6, 0xffc83d, 1);
    g.beginPath();
    g.moveTo(craneX - 200, y - 900);
    g.lineTo(craneX + 700, y - 900);
    g.strokePath();
    signBoard(b, c, craneX + 30, y - 960, copy.shop.works, 0xffc83d, "#1d1830", 34, -23);
  } else {
    const bannerX = track.finish - 2400;
    const c = chunkFor(bannerX);
    const banners: [number, number, string, number, string, number, number][] = [
      [bannerX, 340, copy.shop.go, 0xef4f43, "#fbf5e6", 56, 0],
      [bannerX + 900, 300, copy.shop.cheer, 0xffc83d, "#1d1830", 40, 0.06],
    ];
    for (const [bx, lift, text, fill, color, size, rot] of banners) {
      b.taken.push([bx - 260, bx + 260]);
      const { label } = signBoard(b, c, bx, backY(bx) - lift, text, fill, color, size, -15, rot);
      const half = label.width / 2 + 4;
      const poles = add(c, scene.add.graphics());
      poles.setDepth(-15.5);
      poles.fillStyle(INK, 1);
      for (const px of [bx - half, bx + half - 12]) poles.fillRect(px, backY(bx) - lift, 12, lift + backY(px) - backY(bx) + 6);
    }
  }
}

function drawObstacle(scene: Phaser.Scene, o: Obstacle): Phaser.GameObjects.GameObject {
  const image = (key: string, h: number) => {
    const img = scene.add.image(0, 4, key).setOrigin(0.5, 1);
    const src = img.texture.getSourceImage();
    img.setScale(h / (src.height || h));
    return img;
  };
  if (o.kind === "bin") return image("s-lixeirao", 104);
  if (o.kind === "gnome") return image("gnome", 64);
  if (o.kind === "gold") return image("p-gnome-gold", 72);
  const g = scene.add.graphics();
  if (o.kind === "cone") {
    g.fillStyle(INK, 1);
    g.fillTriangle(-26, 2, 26, 2, 0, -52);
    g.fillStyle(0xff7a1a, 1);
    g.fillTriangle(-20, -2, 20, -2, 0, -44);
    g.fillStyle(0xffffff, 1);
    g.fillRect(-11, -24, 22, 8);
    g.fillStyle(INK, 1);
    g.fillRoundedRect(-30, -4, 60, 10, 3);
  } else if (o.kind === "crate") {
    g.fillStyle(INK, 1);
    g.fillRect(-46, -84, 92, 86);
    g.fillStyle(0xc98b4a, 1);
    g.fillRect(-40, -78, 80, 74);
    g.lineStyle(6, INK, 0.8);
    g.beginPath();
    g.moveTo(-38, -76);
    g.lineTo(38, -6);
    g.moveTo(38, -76);
    g.lineTo(-38, -6);
    g.strokePath();
  } else if (o.kind === "barrier") {
    g.fillStyle(INK, 1);
    g.fillRect(-46, -50, 10, 52);
    g.fillRect(36, -50, 10, 52);
    g.fillRect(-70, -112, 140, 66);
    for (let i = 0; i < 6; i += 1) {
      g.fillStyle(i % 2 === 0 ? 0xe8433a : 0xffffff, 1);
      g.fillRect(-64 + i * 21.3, -106, 21.3, 54);
    }
  } else if (o.kind === "pothole") {
    g.fillStyle(INK, 1);
    g.fillEllipse(0, 8, 104, 26);
    g.fillStyle(0x2b2150, 1);
    g.fillEllipse(0, 9, 92, 18);
    g.fillStyle(0x5b5577, 1);
    g.fillEllipse(-14, 14, 40, 6);
  } else {
    g.fillStyle(INK, 1);
    g.fillRect(-260, -260 - STREET, 12, 262 + STREET);
    g.fillRect(248, -260, 12, 262);
    g.lineStyle(4, INK, 1);
    const rope = new Phaser.Curves.QuadraticBezier(v(-254, -250 - STREET), v(0, 10), v(254, -250));
    rope.draw(g, 24);
    const clothes = [0xffcf3f, 0x6fb6ff, 0xf27aa8, 0xffffff, 0x3fc6a8];
    for (let k = 1; k < 6; k += 1) {
      const p = rope.getPoint(k / 6);
      g.fillStyle(INK, 1);
      g.fillRect(p.x - 24, p.y - 2, 48, 64);
      g.fillStyle(clothes[k % clothes.length], 1);
      g.fillRect(p.x - 20, p.y + 2, 40, 56);
    }
  }
  return g;
}

function drawArlindo(b: Builder, track: Course) {
  const { scene, chunkFor, add, backY } = b;
  const set = track.set as ArlindoSet;
  const yard = track.surfaces[1];
  const roof = track.surfaces[2];
  const road = track.surfaces[0];
  for (let c0 = yard.x0; c0 < yard.x1; c0 += CHUNK) {
    const c1 = Math.min(yard.x1, c0 + CHUNK);
    const g = add(chunkFor(c0 + 10), scene.add.graphics());
    g.setDepth(-5);
    const xs: number[] = [];
    for (let x = c0; x <= c1; x += 90) xs.push(x);
    if (xs[xs.length - 1] !== c1) xs.push(c1);
    const top = xs.map((x) => v(x, heightAt(yard, x)));
    const base = xs.map((x) => v(x, backY(x) + 6));
    g.fillStyle(0xf1d89a, 1);
    g.fillPoints([...top.map((p) => v(p.x, p.y + 26)), ...base.slice().reverse()], true);
    g.lineStyle(3, 0xd2b16c, 1);
    for (let row = 1; row < 14; row += 1) {
      g.beginPath();
      let started = false;
      for (const p of top) {
        const y = p.y + 26 + row * 34;
        if (y > backY(p.x)) {
          started = false;
          continue;
        }
        if (started) g.lineTo(p.x, y);
        else g.moveTo(p.x, y);
        started = true;
      }
      g.strokePath();
    }
    g.fillStyle(GRASS, 1);
    g.fillPoints([...top.map((p) => v(p.x, p.y - 4)), ...top.slice().reverse().map((p) => v(p.x, p.y + 28))], true);
    g.lineStyle(6, INK, 1);
    g.strokePoints(top, false);
    g.lineStyle(4, INK, 0.7);
    g.strokePoints(top.map((p) => v(p.x, p.y + 28)), false);
    g.lineStyle(5, INK, 1);
    g.beginPath();
    g.moveTo(c0, heightAt(yard, c0) + 28);
    g.lineTo(c0, backY(c0) + 6);
    g.strokePath();
    for (let x = Math.ceil(c0 / 260) * 260 + 90; x < c1 - 40; x += 260) {
      const y = heightAt(yard, x);
      const k = Math.floor(x / 260) % 3;
      g.fillStyle(INK, 1);
      g.fillCircle(x, y - 10, 13);
      g.fillStyle([0xf06ba8, 0xffc83d, 0xfffaf0][k], 1);
      g.fillCircle(x, y - 10, 9);
    }
  }
  const gx0 = roof.x0;
  const gx1 = roof.x1;
  const garage = add(chunkFor((gx0 + gx1) / 2), scene.add.graphics());
  garage.setDepth(-5.5);
  const roofY = (x: number) => heightAt(roof, x);
  const floor = (x: number) => heightAt(yard, Math.min(x, yard.x1));
  garage.fillStyle(INK, 1);
  garage.fillPoints([v(gx0 - 6, roofY(gx0) + 6), v(gx1 + 6, roofY(gx1) + 6), v(gx1 + 6, floor(gx1) + 6), v(gx0 - 6, floor(gx0) + 6)], true);
  garage.fillStyle(0xf2e2c4, 1);
  garage.fillPoints([v(gx0, roofY(gx0) + 12), v(gx1, roofY(gx1) + 12), v(gx1, floor(gx1)), v(gx0, floor(gx0))], true);
  for (let k = 0; k < 3; k += 1) {
    const d0 = gx0 + 90 + k * 420;
    const d1 = d0 + 260;
    garage.fillStyle(INK, 1);
    garage.fillPoints([v(d0 - 5, roofY(d0) + 70), v(d1 + 5, roofY(d1) + 70), v(d1 + 5, floor(d1)), v(d0 - 5, floor(d0))], true);
    garage.fillStyle(0x9aa6b8, 1);
    garage.fillPoints([v(d0, roofY(d0) + 75), v(d1, roofY(d1) + 75), v(d1, floor(d1)), v(d0, floor(d0))], true);
    garage.lineStyle(3, INK, 0.45);
    for (let r = 1; r < 6; r += 1) {
      const f = r / 6;
      garage.beginPath();
      garage.moveTo(d0, roofY(d0) + 75 + (floor(d0) - roofY(d0) - 75) * f);
      garage.lineTo(d1, roofY(d1) + 75 + (floor(d1) - roofY(d1) - 75) * f);
      garage.strokePath();
    }
  }
  const gutter = add(chunkFor((gx0 + gx1) / 2), scene.add.graphics());
  gutter.setDepth(1.5);
  gutter.fillStyle(INK, 1);
  gutter.fillPoints([v(gx0 - 14, roofY(gx0) - 4), v(gx1 + 14, roofY(gx1) - 4), v(gx1 + 14, roofY(gx1) + 22), v(gx0 - 14, roofY(gx0) + 22)], true);
  gutter.fillStyle(0x9aa6b8, 1);
  gutter.fillPoints([v(gx0 - 8, roofY(gx0)), v(gx1 + 8, roofY(gx1)), v(gx1 + 8, roofY(gx1) + 16), v(gx0 - 8, roofY(gx0) + 16)], true);
  gutter.fillStyle(0xdfe6f0, 1);
  gutter.fillPoints([v(gx0 - 8, roofY(gx0)), v(gx1 + 8, roofY(gx1)), v(gx1 + 8, roofY(gx1) + 4), v(gx0 - 8, roofY(gx0) + 4)], true);
  const wb = set.wheelbarrow;
  const barrow = add(chunkFor(wb.x1), scene.add.graphics());
  barrow.setDepth(1.6);
  const pts: Phaser.Math.Vector2[] = [];
  for (let x = wb.x0; x <= wb.x1; x += 15) pts.push(v(x, heightAt(yard, x)));
  barrow.fillStyle(INK, 1);
  barrow.fillPoints([...pts.map((p) => v(p.x, p.y - 4)), v(wb.x1 + 4, heightAt(yard, wb.x1) + 34), v(wb.x0, heightAt(yard, wb.x0) + 6)], true);
  barrow.fillStyle(0xef4f43, 1);
  barrow.fillPoints([...pts, v(wb.x1, heightAt(yard, wb.x1) + 28), v(wb.x0 + 10, heightAt(yard, wb.x0) + 4)], true);
  barrow.fillStyle(INK, 1);
  barrow.fillCircle(wb.x1 - 20, heightAt(yard, wb.x1) + 40, 18);
  barrow.fillStyle(0x64708a, 1);
  barrow.fillCircle(wb.x1 - 20, heightAt(yard, wb.x1) + 40, 11);
  const fy = heightAt(yard, set.fence) - 40;
  const fence = add(chunkFor(set.fence), scene.add.graphics());
  fence.setDepth(7.7);
  const fb = heightAt(road, set.fence) - STREET;
  const f0 = yard.x1 - 30;
  const f1 = set.fence + 70;
  fence.fillStyle(INK, 1);
  fence.fillRect(f0, fy + 40, f1 - f0, 14);
  fence.fillRect(f0, fb - 70, f1 - f0, 14);
  for (let px = f0 + 6; px < f1 - 24; px += 36) {
    fence.fillStyle(INK, 1);
    fence.fillTriangle(px - 3, fy + 16, px + 27, fy + 16, px + 12, fy - 2);
    fence.fillRect(px - 3, fy + 14, 30, fb - fy - 14);
    fence.fillStyle(0xb06c3f, 1);
    fence.fillTriangle(px + 2, fy + 16, px + 22, fy + 16, px + 12, fy + 5);
    fence.fillRect(px + 2, fy + 16, 20, fb - fy - 20);
  }
  const plank = set.plank;
  for (const cx of [plank.x1 - 50, plank.x1 - 150]) {
    const tex = scene.textures.get("s-lata").getSourceImage();
    const h = Math.max(30, heightAt(road, cx) - (plank.lipY + ((cx - plank.x1) / (plank.x0 - plank.x1)) * (plank.y0 - plank.lipY)) - 6);
    const can = add(chunkFor(cx), scene.add.image(cx, heightAt(road, cx) + 4, "s-lata").setOrigin(0.5, 1));
    can.setScale(h / ((tex.height || 100) - 16 * SAMPLE_RES)).setDepth(7.45);
  }
  const boxes = add(chunkFor(set.boxes), scene.add.image(set.boxes, b.floorY(set.boxes - 200, set.boxes + 200) + 6, "s-caixas").setOrigin(0.5, 1));
  boxes.setScale(0.85 / SAMPLE_RES).setDepth(-6.5);
}

function drawPuddles(b: Builder, track: Course) {
  for (const q of track.puddles ?? []) {
    const s = track.surfaces[q.surface];
    const back = q.surface === 0 ? BACK_LANE + 10 : -14;
    const front = q.surface === 0 ? -6 : 0;
    const c = b.chunkFor((q.x0 + q.x1) / 2);
    const g = b.add(c, b.scene.add.graphics());
    g.setDepth(q.surface === 0 ? 0.69 : 1.69);
    const top: Phaser.Math.Vector2[] = [];
    const bottom: Phaser.Math.Vector2[] = [];
    const n = 12;
    for (let i = 0; i <= n; i += 1) {
      const u = i / n;
      const x = q.x0 + (q.x1 - q.x0) * u;
      const bulge = Math.sin(u * Math.PI);
      const y = heightAt(s, x);
      top.push(v(x, y + back * (0.35 + 0.65 * bulge) + Math.sin(i * 2.3) * 4));
      bottom.push(v(x, y + front * bulge));
    }
    const shape = [...top, ...bottom.reverse()];
    g.fillStyle(INK, 0.9);
    g.fillPoints(shape.map((p) => v(p.x, p.y + 3)), true);
    g.fillStyle(0x6fc3ee, 1);
    g.fillPoints(shape, true);
    g.lineStyle(4, INK, 1);
    g.strokePoints(shape, true);
    g.lineStyle(5, 0xd8f3ff, 0.9);
    for (const [u0, u1, k] of [[0.18, 0.34, 0.45], [0.46, 0.7, 0.3], [0.62, 0.8, 0.62]] as const) {
      const xa = q.x0 + (q.x1 - q.x0) * u0;
      const xb = q.x0 + (q.x1 - q.x0) * u1;
      g.beginPath();
      g.moveTo(xa, heightAt(s, xa) + back * k);
      g.lineTo(xb, heightAt(s, xb) + back * k);
      g.strokePath();
    }
  }
}

function drawChalk(b: Builder, track: Course, copy: RaceCopy) {
  for (const mark of track.chalk) {
    const s = track.surfaces[mark.surface];
    const y = heightAt(s, mark.x);
    const ang = Math.atan2(heightAt(s, mark.x + 20) - heightAt(s, mark.x - 20), 40);
    const c = b.chunkFor(mark.x);
    const text = b.add(c, b.scene.add.text(mark.x, y - (mark.surface === 0 ? 26 : 8), mark.kind === "hold" ? copy.chalk.hold : copy.chalk.jump, { fontFamily: b.fonts.display, fontSize: "30px", color: "#fffaf0" }));
    text.setOrigin(0.5, 0.5).setRotation(ang).setAlpha(0.82).setDepth(mark.surface === 0 ? 0.7 : 1.7);
    const g = b.add(c, b.scene.add.graphics());
    g.setDepth(mark.surface === 0 ? 0.7 : 1.7);
    g.lineStyle(5, 0xfffaf0, 0.75);
    if (mark.kind === "jump") {
      const x = mark.x + 70;
      const yy = heightAt(s, x) - 20;
      g.beginPath();
      g.moveTo(x - 16, yy - 14);
      g.lineTo(x + 16, yy + 14);
      g.moveTo(x + 16, yy - 14);
      g.lineTo(x - 16, yy + 14);
      g.strokePath();
    } else {
      const x = mark.x - 120;
      const yy = heightAt(s, x) - 22;
      g.beginPath();
      g.moveTo(x - 30, yy);
      g.lineTo(x + 20, yy);
      g.lineTo(x + 8, yy - 10);
      g.moveTo(x + 20, yy);
      g.lineTo(x + 8, yy + 10);
      g.strokePath();
    }
  }
}

