import * as Phaser from "phaser";
import type { RaceCopy } from "../copy";
import type { AntenaSet, Course } from "../sim/course";
import { heightAt } from "../sim/track";
import { INK } from "./cart";
import { plaza, stairs, stairsWall } from "./feira";
import { drawFrontWall, facadeRow, PAD, placed, poleLine, SAMPLE_RES, type SampleSpots } from "./sample";
import { LANES, type Builder } from "./terrain";

const NAMES = ["antena-404", "guindaste", "saco-cimento", "betoneira-base", "betoneira-tambor", "andaime", "tijolos", "sacos-cimento", "carrinho-de-mao", "tampa-bueiro", "cano-estourado", "sapo-a", "sapo-b"];

export const ANTENA_FILES: [string, string][] = NAMES.map((n) => [`a-${n}`, n]);

export const BACK_LANE = LANES.bruno - 14;
export const TUNNEL = 330;
export const MIXER_X = 1500;

function v(x: number, y: number) {
  return new Phaser.Math.Vector2(x, y);
}

export function antenaSet(course: Course) {
  return course.set?.kind === "antena" ? course.set : null;
}

export function dressAntena(b: Builder, course: Course, copy: RaceCopy): SampleSpots {
  const set = course.set as AntenaSet;
  const road = course.surfaces[0];
  const loop = course.loops![0];
  const stairs0 = set.stairs[0].x0 - 300;
  const blocked: [number, number][] = [
    [course.start - 700, course.start + 1500],
    [set.works.x0 - 200, set.works.x1 + 200],
    [loop.x - 900, loop.x + 900],
    [set.hole - 300, set.hole + 300],
    [set.exit - 300, set.exit + 300],
  ];
  facadeRow(b, road.x0 + 400, stairs0, blocked);
  poleLine(b, course.start + 2000, set.works.x0 - 300);
  poleLine(b, set.works.x1 + 1400, stairs0 - 200);
  for (const tx of [course.start + 4200, set.works.x1 + 2600, set.exit + 2600]) if (!blocked.some(([a, c]) => tx + 140 > a && tx - 140 < c)) placed(b, "s-ipe", tx, 0.72, -7.4, "center", 6);
  placed(b, "a-antena-404", course.start + 700, 0.92, -24, "center", 6);
  drawFrontWall(b, road.x0, road.x1);
  works(b, set);
  stairsWall(b, course, set.stairs[0].x0 - 200, set.stairs[set.stairs.length - 1].x1 + 500);
  plaza(b, course, set.plaza, copy);
  loopSign(b, course, copy);
  return {
    neighbors: [
      { who: "tonho", x: set.works.x0 - 500 },
      { who: "zeze", x: set.exit + 1400 },
      { who: "juninho", x: course.start + 3000 },
    ],
    kite: null,
  };
}

function works(b: Builder, set: AntenaSet) {
  const x0 = set.works.x0;
  set.bags.forEach((bx, i) => placed(b, "a-guindaste", bx - 700, 0.85, -23 - i * 0.1, "left"));
  placed(b, "a-betoneira-base", x0 + MIXER_X, 0.8, -8.2, "center");
  placed(b, "a-andaime", x0 + 200, 0.9, -19, "left");
  placed(b, "a-tijolos", x0 + 700, 0.8, -8, "center");
  placed(b, "a-sacos-cimento", x0 + 1100, 0.8, -8, "center");
  placed(b, "a-carrinho-de-mao", set.bags[0] + 1300, 0.8, -7.8, "center");
  placed(b, "a-andaime", set.bags[1] + 900, 0.9, -19, "left");
  placed(b, "a-tijolos", set.works.x1 - 300, 0.8, -8, "center");
  b.taken.push([x0, set.works.x1]);
}

function loopSign(b: Builder, course: Course, copy: RaceCopy) {
  const loop = course.loops![0];
  const x = loop.x - 1500;
  const c = b.chunkFor(x);
  const y = b.backY(x);
  const label = b.add(c, b.scene.add.text(x, y - 250, copy.loopSign, { fontFamily: b.fonts.display, fontSize: "28px", color: "#1d1830", align: "center", wordWrap: { width: 300 } }));
  label.setOrigin(0.5).setDepth(-6.9).setRotation(-0.04);
  const g = b.add(c, b.scene.add.graphics());
  g.setDepth(-7);
  const w = label.width + 40;
  const h = label.height + 28;
  g.fillStyle(INK, 1);
  g.fillRect(x - 60, y - 250, 14, 256);
  g.fillRect(x + 46, y - 250, 14, 256);
  g.fillRoundedRect(x - w / 2 - 6, y - 250 - h / 2 - 6, w + 12, h + 12, 10);
  g.fillStyle(0xf06ba8, 1);
  g.fillRoundedRect(x - w / 2, y - 250 - h / 2, w, h, 8);
  b.taken.push([x - w / 2 - 20, x + w / 2 + 20]);
}

export function drawAntena(b: Builder, course: Course) {
  const set = course.set as AntenaSet;
  stairs(b, course);
  loopRing(b, course);
  sewer(b, course);
  holes(b, course, set);
}

function loopRing(b: Builder, course: Course) {
  const road = course.surfaces[0];
  for (const loop of course.loops ?? []) {
    const r = loop.r;
    const cx = loop.x;
    const cy = heightAt(road, cx) - r;
    const c = b.chunkFor(cx);
    const back = b.add(c, b.scene.add.graphics());
    back.setDepth(2.4);
    const steps = 48;
    const at = (k: number, rad: number, lane: number) => {
      const t = (k / steps) * Math.PI * 2;
      return v(cx + rad * Math.sin(t), cy + lane + rad * Math.cos(t));
    };
    for (let k = 0; k < steps; k += 1) {
      const quad = [at(k, r, 0), at(k + 1, r, 0), at(k + 1, r, BACK_LANE), at(k, r, BACK_LANE)];
      back.fillStyle(k % 2 === 0 ? 0xb8b0cc : 0xa79fc0, 1);
      back.fillPoints(quad, true);
    }
    back.lineStyle(3, INK, 0.35);
    for (let k = 0; k < steps; k += 4) {
      back.beginPath();
      back.moveTo(at(k, r, 0).x, at(k, r, 0).y);
      back.lineTo(at(k, r, BACK_LANE).x, at(k, r, BACK_LANE).y);
      back.strokePath();
    }
    back.lineStyle(5, INK, 1);
    back.strokeCircle(cx, cy + BACK_LANE, r);
    const shell = b.add(c, b.scene.add.graphics());
    shell.setDepth(2.45);
    shell.lineStyle(44, INK, 1);
    shell.strokeCircle(cx, cy, r + 22);
    shell.lineStyle(34, 0x9aa6b8, 1);
    shell.strokeCircle(cx, cy, r + 22);
    shell.lineStyle(6, 0xdfe6f0, 0.8);
    shell.strokeCircle(cx, cy, r + 32);
    shell.lineStyle(4, INK, 0.5);
    for (let k = 0; k < 12; k += 1) {
      const t = (k / 12) * Math.PI * 2;
      shell.beginPath();
      shell.moveTo(cx + (r + 6) * Math.sin(t), cy + (r + 6) * Math.cos(t));
      shell.lineTo(cx + (r + 40) * Math.sin(t), cy + (r + 40) * Math.cos(t));
      shell.strokePath();
    }
    shell.fillStyle(INK, 1);
    shell.fillRect(cx - r - 70, cy + r - 6, 50, 12);
    shell.fillRect(cx + r + 20, cy + r - 6, 50, 12);
  }
}

function sewer(b: Builder, course: Course) {
  const road = course.surfaces[0];
  const s = course.surfaces[1];
  const floor = (x: number) => heightAt(s, Math.max(s.x0, Math.min(s.x1, x)));
  const top = (x: number) => heightAt(road, x) + 56;
  const span = (x0: number, x1: number, draw: (g: Phaser.GameObjects.Graphics, xs: number[]) => void, depth: number) => {
    for (let c0 = x0; c0 < x1; c0 += 1800) {
      const c1 = Math.min(x1, c0 + 1800);
      const g = b.add(b.chunkFor(c0 + 10), b.scene.add.graphics());
      g.setDepth(depth);
      const xs: number[] = [];
      for (let x = c0; x < c1; x += 90) xs.push(x);
      xs.push(c1);
      draw(g, xs);
    }
  };
  const roof = (x: number) => Math.max(top(x) + 6, floor(x) - TUNNEL);
  span(s.x0 - 160, s.x1 + 160, (g, xs) => {
    g.fillStyle(INK, 1);
    g.fillPoints([...xs.map((x) => v(x, Math.max(top(x), roof(x) - 70))), ...xs.slice().reverse().map((x) => v(x, floor(x) + 120))], true);
    g.fillStyle(0x6b4a33, 1);
    g.fillPoints([...xs.map((x) => v(x, Math.max(top(x) + 6, roof(x) - 64))), ...xs.slice().reverse().map((x) => v(x, floor(x) + 112))], true);
    g.fillStyle(0x5a3d2a, 1);
    for (const x of xs) g.fillCircle(x + 30, floor(x) + 70 + ((x * 13) % 30), 9);
  }, 0.04);
  span(s.x0 - 60, s.x1 + 60, (g, xs) => {
    g.fillStyle(INK, 1);
    g.fillPoints([...xs.map((x) => v(x, roof(x) - 8)), ...xs.slice().reverse().map((x) => v(x, floor(x) + 44))], true);
    g.fillStyle(0x2b2150, 1);
    g.fillPoints([...xs.map((x) => v(x, roof(x))), ...xs.slice().reverse().map((x) => v(x, floor(x) + 36))], true);
    g.lineStyle(3, 0x3f3170, 1);
    for (let row = 1; row < 5; row += 1) g.strokePoints(xs.map((x) => v(x, Math.max(roof(x) + 8, floor(x) - TUNNEL + row * 62))), false);
    g.fillStyle(0x4f7fa8, 0.75);
    g.fillPoints([...xs.map((x) => v(x, floor(x) + 4)), ...xs.slice().reverse().map((x) => v(x, floor(x) + 24))], true);
    g.lineStyle(5, 0x5a4790, 1);
    g.strokePoints(xs.map((x) => v(x, floor(x))), false);
  }, 0.05);
}

function holes(b: Builder, course: Course, set: AntenaSet) {
  const road = course.surfaces[0];
  const hx = set.hole;
  const c = b.chunkFor(hx);
  const g = b.add(c, b.scene.add.graphics());
  g.setDepth(0.7);
  for (const lane of [0, LANES.lina, LANES.bruno]) {
    const y = heightAt(road, hx) + lane;
    g.fillStyle(INK, 1);
    g.fillEllipse(hx, y - 4, 128, 30);
    g.fillStyle(0x140f26, 1);
    g.fillEllipse(hx, y - 3, 112, 20);
  }
  const lid = b.add(c, b.scene.add.image(hx + 120, heightAt(road, hx + 120) + LANES.bruno + 10, "a-tampa-bueiro"));
  lid.setOrigin(0.5, 0.5).setScale(0.9 / SAMPLE_RES).setDepth(0.71).setRotation(-0.2);
  const ex = set.exit;
  const ec = b.chunkFor(ex);
  const eg = b.add(ec, b.scene.add.graphics());
  eg.setDepth(0.7);
  for (const lane of [0, LANES.lina, LANES.bruno]) {
    const y = heightAt(road, ex) + lane;
    eg.fillStyle(INK, 1);
    eg.fillEllipse(ex, y - 4, 150, 34);
    eg.fillStyle(0x3f3170, 1);
    eg.fillEllipse(ex, y - 3, 132, 22);
  }
  const pipe = b.add(ec, b.scene.add.image(ex, heightAt(road, ex) + 30, "a-cano-estourado"));
  const src = pipe.texture.getSourceImage();
  pipe.setOrigin(0.5, 1 - (PAD * SAMPLE_RES) / (src.height || 100)).setScale(0.9 / SAMPLE_RES).setDepth(0.08);
}
