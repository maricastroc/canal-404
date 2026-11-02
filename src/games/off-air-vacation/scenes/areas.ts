import * as Phaser from "phaser";
import type { AreaId, Dir } from "../config";
import type { FolkKey, State } from "../save";
import type { ResortSfx } from "../sounds";
import type { Mood } from "../story";
import type { Fonts } from "../../kit/ui";
import { splashAt, type CritterDef, type ResidentDef } from "./life";
import type { Npc, NpcOpts } from "./npc";

export type Show = (s: State) => boolean;
export type React = "wobble" | "rustle" | "spin" | "jingle" | "bounce";
export type NearOpts = {
  enter?: (t: number) => void;
  leave?: (t: number) => void;
  stay?: (t: number) => void;
  cooldown?: number;
  minSpeed?: number;
  zone?: (x: number, y: number) => boolean;
  at?: () => [number, number];
};
export type Surface = { kind: "sand" | "wood" | "grass" | "dirt" | "water" | "tile"; splash?: [number, number]; gone?: (x: number, y: number) => boolean; color?: number };
export type PropOpts = {
  origin?: [number, number];
  scale?: number;
  flip?: boolean;
  angle?: number;
  depth?: number | "floor" | "wall" | "over";
  anim?: "sway" | "swing" | "bob" | "pulse";
  amp?: number;
  rect?: [number, number, number, number];
  circle?: number;
  show?: Show;
  tint?: number;
  alpha?: number;
  key2?: (s: State) => string;
  shadow?: number;
  react?: React;
  reactR?: number;
  occlude?: [number, number, number?];
};
export type SpotDef = {
  id: string;
  x: number;
  y: number;
  r?: number;
  verb: string | ((s: State) => string);
  script: string;
  show?: Show;
  hint?: "item" | "secret";
  priority?: boolean;
  at?: () => [number, number];
};
export type Builder = {
  world: Phaser.Scene;
  s: State;
  reduced: boolean;
  vars: Record<string, unknown>;
  size(w: number, h: number, minY: number, maxY: number): void;
  tiles(key: string, x: number, y: number, w: number, h: number, depth?: number): Phaser.GameObjects.TileSprite;
  g(depth: number): Phaser.GameObjects.Graphics;
  prop(key: string, x: number, y: number, opts?: PropOpts): Phaser.GameObjects.Image;
  npc(id: FolkKey, x: number, y: number, opts?: NpcOpts & { show?: Show; mood?: Mood; frames?: NpcOpts["frames"]; noShadow?: boolean }): Npc | null;
  spot(def: SpotDef): void;
  exit(x: number, y: number, w: number, h: number, to: AreaId, spawn: string, show?: Show): void;
  spawn(name: string, x: number, y: number, dir: Dir, facing?: number): void;
  block(x: number, y: number, w: number, h: number, show?: Show): void;
  circleBlock(x: number, y: number, r: number, show?: Show): void;
  blocker(fn: (x: number, y: number) => boolean): void;
  glow(x: number, y: number, w: number, h: number, color: number, alpha: number, depth?: number): Phaser.GameObjects.Image;
  onUpdate(fn: (t: number, dt: number) => void): void;
  ambient(sounds: [ResortSfx, number][], min: number, max: number): void;
  kickable(key: string, x: number, y: number, water?: (x: number, y: number) => boolean): void;
  near(x: number, y: number, r: number, opts: NearOpts): void;
  critter(def: CritterDef): Phaser.GameObjects.Image;
  resident(def: ResidentDef): Phaser.GameObjects.Image;
  surface(fn: (x: number, y: number) => Surface | null): void;
  announce(message: string): void;
  pushHero(x: number, y: number): boolean;
  arrow(x: number, y: number, angle: number): void;
  frame(rect: [number, number, number, number], zone: [number, number, number, number]): void;
  fonts: Fonts;
  act(name: string, fn: () => Promise<void> | void): void;
  bark(who: FolkKey, text: string, sound?: ResortSfx | null): void;
  greet(who: FolkKey, lines: string[] | (() => string[]), r?: number): void;
  hero(): { x: number; y: number; speed: number; busy: boolean } | null;
  npcOf(who: FolkKey): Npc | null;
  fx: {
    vhs(label: string, ms: number): Promise<void>;
    flash(alpha?: number): void;
    shake(ms?: number, i?: number): void;
    sfx(name: ResortSfx, v?: number, pitch?: number): void;
    wait(ms: number): Promise<void>;
    gull(x: number, y: number, i: number): void;
    word(text: string, x: number, y: number, color?: string): void;
  };
};

const INK = 0x1d1830;

export const POOL = {
  center: [1340, 1330] as [number, number],
  flamingoHome: [1240, 1340] as [number, number],
  fishY: 1500,
  party: {
    player: [1340, 1720] as [number, number],
    pan: [1340, 1420] as [number, number],
    glow: [1240, 1360] as [number, number],
    bigodes: [560, 1760] as [number, number],
    tilt: [1010, 1730] as [number, number],
    marisa: [1690, 1730] as [number, number],
    psiu: [1940, 1680] as [number, number],
    mascot: [1180, 1752] as [number, number],
    garlands: [
      [[700, 980], [2100, 1000], 90],
      [[700, 1890], [2100, 1870], 60],
    ] as [[number, number], [number, number], number][],
  },
};

function spline(points: [number, number][], steps = 18) {
  const curve = new Phaser.Curves.Spline(points.map(([x, y]) => new Phaser.Math.Vector2(x, y)));
  return curve.getPoints(points.length * steps);
}

function band(g: Phaser.GameObjects.Graphics, points: [number, number][], width: number, color: number, edge = INK, light?: number) {
  const pts = spline(points);
  const pass = (w: number, c: number, alpha = 1) => {
    g.lineStyle(w, c, alpha);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (const p of pts) g.lineTo(p.x, p.y);
    g.strokePath();
    g.fillStyle(c, alpha);
    for (let i = 0; i < pts.length; i += 3) g.fillCircle(pts[i].x, pts[i].y, w / 2);
    g.fillCircle(pts[pts.length - 1].x, pts[pts.length - 1].y, w / 2);
  };
  pass(width + 12, edge);
  pass(width, color);
  if (light) pass(width * 0.4, light, 0.5);
  return pts;
}

type Pt = { x: number; y: number };

export function polyDistance(pts: Pt[], x: number, y: number) {
  let best = Infinity;
  let bx = 0;
  let by = 0;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const c = pts[i + 1];
    if (Math.min(a.x, c.x) - 160 > x || Math.max(a.x, c.x) + 160 < x || Math.min(a.y, c.y) - 160 > y || Math.max(a.y, c.y) + 160 < y) continue;
    const vx = c.x - a.x;
    const vy = c.y - a.y;
    const l2 = vx * vx + vy * vy || 1;
    const k = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / l2));
    const px = a.x + vx * k;
    const py = a.y + vy * k;
    const d = Math.hypot(x - px, y - py);
    if (d < best) {
      best = d;
      bx = px;
      by = py;
    }
  }
  return { d: best, x: bx, y: by };
}

function garland(b: Builder, from: [number, number], to: [number, number], sag: number, depth: number) {
  const g = b.g(depth);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= 20; i += 1) {
    const t = i / 20;
    pts.push({ x: from[0] + (to[0] - from[0]) * t, y: from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * sag });
  }
  g.lineStyle(4, INK, 1);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (const p of pts) g.lineTo(p.x, p.y);
  g.strokePath();
  const colors = [0xffd36b, 0xff8fc4, 0x8ff0d8, 0x9fd4ff];
  const bulbs: Phaser.GameObjects.Image[] = [];
  pts.forEach((p, i) => {
    if (i % 2 || i === 0 || i === 20) return;
    const c = colors[(i / 2) % 4];
    b.glow(p.x, p.y + 12, 70, 70, c, 0.35, depth - 0.01);
    g.fillStyle(INK, 1);
    g.fillCircle(p.x, p.y + 12, 11);
    g.fillStyle(c, 1);
    g.fillCircle(p.x, p.y + 12, 8);
  });
  void bulbs;
}

export const AREAS: Record<AreaId, (b: Builder) => void> = {
  lobby(b) {
    const s = b.s;
    b.size(2400, 1250, 470, 1238);
    b.tiles("lobby-wall", 0, 0, 2400, 430, 0);
    const wall = b.g(0.5);
    wall.fillStyle(0xb06c3f, 1);
    wall.fillRect(0, 330, 2400, 100);
    wall.fillStyle(0x8a4f2c, 1);
    for (let x = 30; x < 2400; x += 120) wall.fillRect(x, 346, 80, 66);
    wall.lineStyle(6, INK, 1);
    wall.lineBetween(0, 330, 2400, 330);
    wall.fillStyle(0x7c4527, 1);
    wall.fillRect(0, 414, 2400, 18);
    wall.lineBetween(0, 432, 2400, 432);
    b.tiles("lobby-floor", 0, 432, 2400, 818, 0.2);
    b.glow(1200, 440, 2600, 90, 0x140f26, 0.35, 0.3);
    b.prop("lobby-banner", 1200, 74, { origin: [0.5, 0.5], depth: "wall", anim: "swing", amp: 1.2 });
    b.prop("lobby-window-a", 220, 412, { origin: [0.5, 1], depth: "wall" });
    b.glow(260, 600, 360, 160, 0xffe39a, 0.22, 0.4);
    b.prop("door-404", 470, 432, { origin: [0.5, 1], depth: "wall", key2: (st) => (st.secrets.includes("room404") ? "door-404-open" : "door-404") });
    b.prop("column", 660, 436, { origin: [0.5, 1], depth: "wall" });
    b.prop("column", 1740, 436, { origin: [0.5, 1], depth: "wall" });
    const frameSun = b.prop("frame-sunset", 830, 170, { origin: [0.5, 0.5], angle: -7, depth: "wall" });
    const frameTv = b.prop("frame-tv", 990, 168, { origin: [0.5, 0.5], angle: 8, depth: "wall" });
    b.act("frameStraighten", async () => {
      b.fx.sfx("tick", 0.6, 0.8);
      if (b.reduced) return;
      await new Promise<void>((r) => b.world.tweens.add({ targets: frameSun, angle: 0, duration: 240, ease: "Back.easeOut", onComplete: () => r() }));
      await b.fx.wait(700);
      b.fx.sfx("tick", 0.5, 0.6);
      b.world.tweens.add({ targets: frameSun, angle: -7, duration: 900, ease: "Bounce.easeOut" });
    });
    b.act("frameFlicker", async () => {
      b.fx.sfx("bars", 0.25, 1.6);
      for (let i = 0; i < 4; i += 1) {
        frameTv.setTint(i % 2 ? 0xffffff : 0x9df0dc);
        await b.fx.wait(90);
      }
      frameTv.clearTint();
    });
    b.prop("key-rack", 1200, 176, { origin: [0.5, 0.5], depth: "wall" });
    b.prop("clock", 1520, 166, { origin: [0.5, 0.5], depth: "wall" });
    b.prop("elevator", 1960, 432, { origin: [0.5, 1], depth: "wall" });
    b.prop("poster-club", 2262, 200, { origin: [0.5, 0.5], depth: "wall" });
    b.glow(1200, 660, 1100, 520, 0xffd36b, 0.2, 0.4);
    b.npc("bigodes", 1200, 522, { scale: 0.95, depth: 520, follow: true });
    b.greet("bigodes", ["Pois não?", "Tudo absolutamente normal."], 360);
    b.prop("counter", 1200, 650, { origin: [0.5, 1], depth: 650, rect: [-380, -112, 760, 112] });
    const bell = b.prop("desk-bell", 1360, 470, { origin: [0.5, 1], depth: 651 });
    b.prop("guest-book", 1060, 472, { origin: [0.5, 1], depth: 651, scale: 0.9 });
    b.act("bellRing", async () => {
      b.fx.word("DING!", 1360, 400, "#ffe39a");
      if (!b.reduced) {
        b.world.tweens.add({ targets: bell, scaleY: { from: 0.7, to: 1 }, scaleX: { from: 1.15, to: 1 }, duration: 260, ease: "Back.easeOut" });
        b.world.tweens.add({ targets: bell, angle: { from: -8, to: 8 }, duration: 70, yoyo: true, repeat: 3, onComplete: () => bell.setAngle(0) });
      }
      const cat = b.npcOf("bigodes");
      cat?.setMood("surprised", 600, b.world.time.now);
      await b.fx.wait(450);
    });
    b.prop("chandelier", 1200, -4, { origin: [0.5, 0], depth: "over", anim: "swing", amp: 1.6 });
    b.glow(1200, 220, 420, 260, 0xffe39a, 0.35, 4999);
    b.prop("rug-lobby", 1200, 940, { origin: [0.5, 0.5], depth: "floor" });
    b.prop("doormat", 1200, 1246, { origin: [0.5, 1], depth: "floor" });
    b.prop("sofa", 520, 880, { origin: [0.5, 1], rect: [-176, -86, 352, 86], react: "bounce" });
    b.prop("plant-tall", 330, 670, { origin: [0.5, 1], rect: [-52, -40, 104, 40], anim: "sway", amp: 1.5, react: "rustle" });
    b.prop("plant-tall", 2100, 690, { origin: [0.5, 1], rect: [-52, -40, 104, 40], anim: "sway", amp: 1.5, flip: true, react: "rustle" });
    b.prop("plant-small", 880, 760, { origin: [0.5, 1], rect: [-40, -28, 80, 28], react: "rustle" });
    b.prop("plant-small", 1530, 760, { origin: [0.5, 1], rect: [-40, -28, 80, 28], flip: true, react: "rustle" });
    const cases = b.prop("suitcases", 1660, 820, { origin: [0.5, 1], rect: [-96, -70, 192, 70], react: "jingle" });
    b.act("suitcaseWiggle", async () => {
      b.fx.sfx("kick", 0.5, 1.3);
      if (!b.reduced) b.world.tweens.add({ targets: cases, angle: { from: -4, to: 4 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => cases.setAngle(0) });
      await b.fx.wait(450);
    });
    b.prop("tv-lobby", 1880, 700, { origin: [0.5, 1], rect: [-110, -70, 220, 70] });
    b.near(1880, 760, 260, {
      cooldown: 12000,
      enter: () => {
        if (tvBusy || b.reduced) return;
        paintBars(true);
        b.fx.sfx("bars", 0.15, 1.8);
        b.world.time.delayedCall(220, () => !tvBusy && paintBars(false));
      },
    });
    const tv = b.world.add.tileSprite(1880 - 120 + 46 + 4, 700 - 250 + 44 + 4, 112, 94, "static").setOrigin(0, 0).setDepth(701).setAlpha(0.9);
    const tvBars = b.g(702);
    const tvShow = b.world.add.image(tv.x + 56, tv.y + 50, "face-mascot-normal").setDepth(703).setVisible(false);
    const paintBars = (on: boolean) => {
      tvBars.clear();
      if (!on) return;
      [0xfbf5e6, 0xffc83d, 0x63d6c1, 0x93cf4c, 0xf06ba8, 0xef4f43, 0x5cb9f0].forEach((c, i) => {
        tvBars.fillStyle(c, 1);
        tvBars.fillRect(tv.x + i * 16, tv.y, 16, 94);
      });
    };
    let tvBlipAt = 9000;
    let tvBusy = false;
    b.onUpdate((t) => {
      if (!tvBusy) tv.setTilePosition(Math.random() * 200, Math.random() * 200);
      if (b.reduced || tvBusy || t < tvBlipAt) return;
      tvBlipAt = t + 14000 + Math.random() * 10000;
      paintBars(true);
      b.world.time.delayedCall(260, () => !tvBusy && paintBars(false));
    });
    b.act("tvFragment", async () => {
      tvBusy = true;
      b.fx.sfx("bars", 0.5, 1);
      paintBars(true);
      await b.fx.wait(500);
      paintBars(false);
      const n = Object.keys(b.s.flags).filter((k) => k.startsWith("n_tvLobby_")).length;
      const key = ["face-mascot-normal", "face-lento-happy", "face-capi-happy", "face-tilt-happy"][n % 4];
      tvShow.setTexture(key).setDisplaySize(84, 84).setVisible(true);
      tv.setAlpha(0.35);
      b.fx.sfx("blipSoft", 0.5, 1.3);
      await b.fx.wait(900);
      tvShow.setVisible(false);
      tv.setAlpha(0.9);
      tvBusy = false;
    });
    b.prop("luggage-cart", 260, 1110, { origin: [0.5, 1], rect: [-100, -50, 200, 50], react: "wobble" });
    b.critter({ frames: ["kitten-a", "kitten-b"], rest: "kitten-sit", x: 900, y: 1060, bounds: [700, 900, 1700, 1160], mode: "walk", react: "follow", r: 240, scale: 0.78, speed: 70, sound: ["meow", 0.35, 1.5], faceLeft: false });
    const bellGlow = b.glow(1360, 430, 130, 110, 0xffe39a, 0, 652);
    b.near(1360, 720, 170, {
      cooldown: 9000,
      enter: () => {
        b.fx.sfx("bell", 0.18, 1.6);
        bellGlow.setAlpha(0.6);
        b.world.tweens.add({ targets: bellGlow, alpha: 0, duration: b.reduced ? 10 : 700 });
        if (!b.reduced) b.world.tweens.add({ targets: bell, angle: { from: -4, to: 4 }, duration: 80, yoyo: true, repeat: 1, onComplete: () => bell.setAngle(0) });
      },
    });
    b.spot({ id: "bigodes", x: 1200, y: 700, r: 200, verb: "Conversar", script: "bigodes" });
    b.spot({ id: "bell", x: 1380, y: 700, r: 90, verb: "Tocar", script: "bell" });
    b.spot({ id: "guestbook", x: 1040, y: 700, r: 90, verb: "Ler", script: "guestbook" });
    b.spot({ id: "door404", x: 470, y: 500, r: 140, verb: (st) => (st.items.includes("key") ? "Abrir" : "Examinar"), script: "door404" });
    b.spot({ id: "frameSunset", x: 830, y: 490, r: 110, verb: "Examinar", script: "frameSunset" });
    b.spot({ id: "frameTv", x: 960, y: 690, r: 90, verb: "Examinar", script: "frameTv" });
    b.spot({ id: "clock", x: 1640, y: 500, r: 120, verb: "Examinar", script: "clock" });
    b.spot({ id: "elevator", x: 1960, y: 500, r: 130, verb: "Examinar", script: "elevator" });
    b.spot({ id: "poster", x: 2262, y: 500, r: 130, verb: "Examinar", script: "poster:club", hint: "item" });
    b.spot({ id: "sofa", x: 520, y: 930, r: 160, verb: "Examinar", script: "sofa" });
    b.spot({ id: "suitcases", x: 1660, y: 870, r: 140, verb: "Examinar", script: "suitcases" });
    b.spot({ id: "tv", x: 1880, y: 760, r: 140, verb: "Examinar", script: "tvLobby" });
    b.exit(1050, 1210, 300, 60, "pool", "hotel");
    b.block(820, 432, 760, 110);
    b.frame([0, 0, 2400, 720], [0, 470, 2400, 430]);
    b.glow(1200, 1250, 520, 150, 0xfff1c0, 0.4, 0.45);
    b.arrow(1200, 1195, 90);
    b.spawn("start", 1200, 1130, "k");
    b.spawn("door", 1200, 1120, "k");
    b.spawn("door404", 470, 560, "f");
    b.ambient([["tick", 0.5]], 4000, 7000);
    void s;
  },

  pool(b) {
    const s = b.s;
    b.size(2800, 1960, 800, 1925);
    b.tiles("grass", 0, 0, 2800, 1960, 0);
    const g = b.g(0.2);
    band(g, [[0, 1260], [320, 1250], [640, 1240]], 170, 0xe9c98f);
    band(g, [[2140, 1540], [2500, 1560], [2800, 1550]], 170, 0xe9c98f);
    band(g, [[1200, 790], [1200, 930]], 230, 0xe9c98f);
    band(g, [[2250, 790], [2230, 900], [2140, 960]], 200, 0xe9c98f);
    g.fillStyle(INK, 1);
    g.fillRoundedRect(606, 886, 1548, 988, 130);
    g.fillStyle(0xf3e3c3, 1);
    g.fillRoundedRect(620, 900, 1520, 960, 120);
    g.lineStyle(3, 0xe2cfa7, 1);
    for (let x = 700; x < 2140; x += 80) g.lineBetween(x, 906, x, 1854);
    for (let y = 980; y < 1860; y += 80) g.lineBetween(626, y, 2134, y);
    b.prop("hotel", 1200, 800, { origin: [0.5, 1], depth: 790 });
    b.block(640, 560, 455, 220);
    b.block(1305, 560, 455, 220);
    b.prop("arcade-front", 2250, 800, { origin: [0.5, 1], depth: 790 });
    b.block(1875, 560, 247, 220);
    b.block(2378, 560, 247, 220);
    b.prop("pool", POOL.center[0], POOL.center[1], { origin: [0.5, 0.5], depth: "floor" });
    b.block(906, 1172, 671, 376);
    b.circleBlock(1709, 1250, 84);
    b.circleBlock(1709, 1447, 84);
    for (let i = 0; i < 7; i += 1) {
      const gl = b.world.add.image(980 + i * 90, 1210 + (i % 3) * 110, "glint").setDepth(1.5).setAlpha(0.6).setScale(0.7 + (i % 2) * 0.35);
      const ox = gl.x;
      const oy = gl.y;
      b.onUpdate((t) => {
        gl.setPosition(ox + Math.sin(t / 1400 + i) * 22, oy + Math.cos(t / 1700 + i * 2) * 12).setAlpha(b.reduced ? 0.5 : 0.35 + Math.sin(t / 500 + i) * 0.3);
      });
    }
    const [fx, fy] = POOL.flamingoHome;
    const flamingo = b.prop("flamingo", fx, fy, { origin: [0.5, 0.5], depth: fy, scale: 0.9, key2: (st) => (st.flags.gotWhistle ? "flamingo-empty" : "flamingo") });
    b.vars.flamingo = flamingo;
    b.onUpdate((t) => {
      if (b.vars.flamingoBusy) return;
      flamingo.setPosition(fx + Math.sin(t / 2600) * 60, fy + Math.cos(t / 3100) * 30 + Math.sin(t / 500) * 4).setAngle(Math.sin(t / 900) * 4);
    });
    const duck = b.prop("duck", 1709, 1250, { origin: [0.5, 0.5], depth: 1255, scale: 0.9 });
    let duckSpin = false;
    b.onUpdate((t) => {
      if (!duckSpin) duck.setY(1250 + Math.sin(t / 600) * 4).setAngle(Math.sin(t / 800) * 6);
    });
    const ripple = b.g(1.6);
    b.act("duckSqueak", async () => {
      duckSpin = true;
      b.fx.sfx("blipSoft", 0.8, 2.2);
      b.fx.word("QUÉN!", 1709, 1170, "#ffe39a");
      if (!b.reduced) b.world.tweens.add({ targets: duck, angle: duck.angle + 360, duration: 600, ease: "Cubic.easeOut" });
      for (let i = 0; i < 10; i += 1) {
        ripple.clear();
        ripple.lineStyle(3, 0xffffff, 0.7 - i * 0.07);
        ripple.strokeEllipse(1709, 1262, 60 + i * 9, 24 + i * 3.5);
        await b.fx.wait(60);
      }
      ripple.clear();
      duckSpin = false;
    });
    const water = b.g(1.55);
    b.onUpdate((t) => {
      water.clear();
      water.lineStyle(3, 0xffffff, 0.28);
      for (let r = 0; r < 4; r += 1) {
        const y0 = 1232 + r * 80;
        const ph = b.reduced ? r : t / 900 + r * 1.3;
        water.beginPath();
        for (let x = 960; x <= 1520; x += 20) {
          const y = y0 + Math.sin(x / 70 + ph) * 6;
          if (x === 960) water.moveTo(x, y);
          else water.lineTo(x, y);
        }
        water.strokePath();
      }
    });
    b.prop("lifeguard-chair", 790, 1500, { origin: [0.5, 1], rect: [-90, -44, 180, 44], shadow: 150, occlude: [0.95, 0.4, 0.4] });
    b.npc("marola", 790, 1292, {
      scale: 0.78,
      depth: 1501,
      noShadow: true,
      frames: s.flags.whistleReturned ? { normal: "normal", talk: "talk-w", look: "look-w", happy: "happy", sad: "normal", surprised: "talk-w" } : undefined,
    });
    b.prop("umbrella-a", 1110, 1760, { origin: [0.5, 1], anim: "sway", amp: 1, circle: 18, shadow: 70, react: "rustle", reactR: 90, occlude: [0.98, 0.55, 0.45] });
    b.prop("umbrella-b", 1720, 1760, { origin: [0.5, 1], anim: "sway", amp: 1, circle: 18, shadow: 70, react: "rustle", reactR: 90, occlude: [0.98, 0.55, 0.45] });
    b.prop("lounge-a", 960, 1800, { origin: [0.5, 1], rect: [-92, -54, 184, 54], react: "bounce" });
    const towel = b.prop("towel", 960, 1768, { origin: [0.5, 1], depth: 1801, scale: 0.8 });
    b.prop("lounge-b", 1260, 1810, { origin: [0.5, 1], rect: [-92, -54, 184, 54], react: "bounce" });
    b.prop("lounge-a", 1860, 1800, { origin: [0.5, 1], flip: true, rect: [-92, -54, 184, 54], react: "bounce" });
    const inPool = (x: number, y: number) => x > 884 && x < 1600 && y > 1164 && y < 1560 && !(x > 1640 && y < 1520);
    b.kickable("beachball", 1500, 1680, inPool);
    for (let i = 0; i < 3; i += 1) b.critter({ frames: ["fish-a", "fish-b"], x: 1050 + i * 180, y: 1260 + (i % 2) * 140, bounds: [970, 1220, 1510, 1500], mode: "swim", react: "dive", r: 300, scale: 0.42, depth: 1.52, alpha: 0.72, speed: 46, sound: ["plop", 0.15, 1.6], away: [4000, 7000] });
    b.critter({ frames: ["butterfly-a", "butterfly-b"], x: 2620, y: 1300, bounds: [2420, 1100, 2760, 1480], mode: "flutter", react: "fly", r: 170, scale: 0.55, depth: 4800, speed: 70, sound: ["flutter", 0.4, 1], away: [5000, 9000] });
    b.critter({ frames: ["butterfly-a", "butterfly-b"], x: 300, y: 950, bounds: [120, 860, 620, 1100], mode: "flutter", react: "fly", r: 170, scale: 0.5, depth: 4800, speed: 60, sound: ["flutter", 0.4, 1.2], away: [5000, 9000] });
    b.prop("lounge-b", 2400, 1730, { origin: [0.5, 1], rect: [-92, -54, 184, 54] });
    b.resident({
      frames: ["coaxo-a", "coaxo-b"],
      x: 2400,
      y: 1731,
      lift: 46,
      scale: 0.62,
      name: "Seu Coaxo",
      lines: ["Sol de 2004. Bronzeia igual.", "Mergulho? Só depois da digestão. Desde 2004.", "Não conta pro salva-vidas que eu tô sem touca.", "Coaxo. Quer dizer: boa tarde."],
      sound: ["croak", 0.5, 1],
      r: 280,
    });
    b.surface((x, y) => {
      if (x > 880 && x < 1600 && y > 1150 && y < 1570 && !(x > 920 && x < 1563 && y > 1190 && y < 1532)) {
        const cx = Phaser.Math.Clamp(x, 940, 1545);
        const cy = Phaser.Math.Clamp(y, 1205, 1520);
        return { kind: "tile", splash: Math.random() < 0.5 ? [cx, cy] : undefined };
      }
      return null;
    });
    for (const [x, y, k, flip] of [
      [236, 1060, "palm", false],
      [2570, 1880, "palm", true],
      [2200, 1880, "palm-b", false],
    ] as [number, number, string, boolean][]) {
      b.prop(k, x, y, { origin: [0.5, 1], flip, anim: "sway", amp: 2, circle: 30, shadow: 120, react: "rustle", reactR: 80 });
    }
    b.prop("juice-bar", 380, 1740, { origin: [0.5, 1], rect: [-255, -150, 510, 150], shadow: 540, occlude: [0.96, 0.3, 0.46] });
    const capi = b.npc("capi", 380, 1592, { scale: 0.76, depth: 1560, noShadow: true });
    b.greet("capi", ["Suquinho?", "Psst. Tenho uma fofoca.", "Hoje o suco é de manga. Ontem também."], 340);
    let shakeAt = 4000;
    b.onUpdate((t) => {
      if (!capi || capi.busy || t < shakeAt) return;
      shakeAt = t + 7000 + Math.random() * 5000;
      capi.playSeq(["shake-a", "shake-b", "shake-a", "shake-b", "shake-a", "happy"], 160, t);
    });
    b.act("capiShake", async () => {
      if (!capi) return;
      capi.playSeq(["shake-a", "shake-b", "shake-a", "shake-b", "shake-a", "shake-b", "happy"], 130, b.world.time.now);
      for (let i = 0; i < 4; i += 1) {
        b.fx.sfx("tick", 0.5, 1.4 + i * 0.1);
        await b.fx.wait(200);
      }
      b.fx.sfx("pick", 0.7);
    });
    b.prop("shed", 2480, 1300, { origin: [0.5, 1], rect: [-160, -110, 320, 110], occlude: [0.96, 0.3, 0.46] });
    b.prop("poster-summer", 2346, 1140, { origin: [0.5, 0.5], scale: 0.4, depth: 1301 });
    b.prop("net-pole", 2710, 1300, { origin: [0.5, 1], circle: 12, show: (st) => !st.items.includes("net"), react: "wobble" });
    b.prop("signpost", 560, 1150, { origin: [0.5, 1], circle: 22, shadow: 60, react: "wobble" });
    b.prop("hedge", 200, 890, { origin: [0.5, 1], rect: [-140, -60, 280, 60], react: "rustle" });
    b.prop("hibiscus", 1817, 880, { origin: [0.5, 1], rect: [-40, -50, 80, 50], scale: 0.5, react: "rustle" });
    b.prop("hibiscus", 2620, 1440, { origin: [0.5, 1], rect: [-120, -60, 240, 60], react: "rustle" });
    b.prop("hedge", 2620, 1958, { origin: [0.5, 1], rect: [-140, -60, 280, 60], react: "rustle" });
    b.prop("hedge", 400, 1958, { origin: [0.5, 1], rect: [-140, -60, 280, 60], react: "rustle" });
    b.prop("hibiscus", 1000, 1958, { origin: [0.5, 1], rect: [-120, -60, 240, 60], react: "rustle" });
    b.prop("hibiscus", 2700, 1000, { origin: [0.5, 1], rect: [-80, -40, 160, 40], scale: 0.65, react: "rustle" });
    const poolLento = b.npc("lento", 2300, 1800, { scale: 0.8, show: (st) => Boolean(st.flags.ended), frames: s.flags.gotKey ? { normal: "walk-a-nokey", look: "walk-b-nokey", talk: "talk-nokey", happy: "happy-nokey", surprised: "happy-nokey" } : { normal: "walk-a", look: "walk-b", talk: "talk", happy: "talk", surprised: "talk" } });
    b.act("lentoKeyless", () => poolLento?.setFrames({ normal: "walk-a-nokey", look: "walk-b-nokey", talk: "talk-nokey", happy: "happy-nokey", surprised: "happy-nokey" }));
    b.spot({ id: "lento", x: 2300, y: 1840, r: 160, verb: "Conversar", script: "lento", show: (st) => Boolean(st.flags.ended) });
    b.circleBlock(2300, 1794, 40, (st) => Boolean(st.flags.ended));
    b.spot({ id: "marola", x: 790, y: 1570, r: 180, verb: "Conversar", script: "marola" });
    b.spot({ id: "flamingo", x: 1420, y: 1610, r: 150, verb: (st) => (st.items.includes("net") && !st.flags.gotWhistle ? "Usar a rede" : "Examinar"), script: "flamingo", hint: "item" });
    b.spot({ id: "net", x: 2710, y: 1340, r: 120, verb: "Pegar", script: "net", show: (st) => !st.items.includes("net") && !st.flags.gotWhistle, hint: "item" });
    b.spot({ id: "lounge", x: 1260, y: 1850, r: 120, verb: "Examinar", script: "loungeToken", hint: "secret" });
    b.spot({ id: "capi", x: 380, y: 1800, r: 170, verb: "Conversar", script: "capi" });
    b.spot({ id: "juiceMenu", x: 170, y: 1800, r: 90, verb: "Ler", script: "juiceMenu" });
    b.spot({ id: "poolSign", x: 1150, y: 1610, r: 110, verb: "Ler", script: "poolSign" });
    b.spot({ id: "towel", x: 960, y: 1850, r: 100, verb: "Examinar", script: "towel" });
    b.spot({ id: "enterHotel", x: 1200, y: 830, r: 120, verb: "Entrar", script: "enterHotel" });
    b.spot({ id: "enterArcade", x: 2250, y: 830, r: 120, verb: "Entrar", script: "enterArcade" });
    b.act("flamingoLook", async () => {
      const base = b.s.flags.gotWhistle ? "flamingo-empty" : "flamingo";
      b.vars.flamingoBusy = true;
      flamingo.setTexture(`${base}-look`).setAngle(0);
      b.fx.sfx("blip", 0.7, 0.6);
      if (!b.reduced) b.world.tweens.add({ targets: flamingo, scaleX: { from: 0.8, to: 0.9 }, scaleY: { from: 1.02, to: 0.9 }, duration: 260, ease: "Back.easeOut" });
      await b.fx.wait(1400);
      flamingo.setTexture(base);
      b.vars.flamingoBusy = false;
    });
    b.act("towelSwan", async () => {
      b.fx.sfx("blipSoft", 0.6, 0.8);
      if (!b.reduced) b.world.tweens.add({ targets: towel, scaleY: { from: 0.8, to: 1.15 }, scaleX: { from: 0.8, to: 0.7 }, duration: 220, yoyo: true, repeat: 1 });
      await b.fx.wait(500);
    });
    b.act("marolaBark", () => b.bark("marola", b.s.flags.whistleReturned ? "Leu? Leia de novo!" : "...sem apito eu só faço cara feia."));
    b.greet("marola", ["Olho na borda, recruta!", "Sempre alerta!"], 280);
    b.greet("lento", ["Cheguei... quase."], 260);
    const onRim = (x: number, y: number) => x > 880 && x < 1600 && y > 1150 && y < 1570 && !(x > 935 && x < 1548 && y > 1205 && y < 1517);
    b.near(0, 0, 0, {
      zone: onRim,
      cooldown: 20000,
      minSpeed: 200,
      enter: (t) => {
        b.npcOf("marola")?.setMood(b.s.flags.whistleReturned ? "happy" : "look", 1200, t);
        if (b.s.flags.whistleReturned) b.fx.sfx("whistle", 0.7);
        b.bark("marola", b.s.flags.whistleReturned ? "SEM CORRER NA BORDA!" : "Ei! Devagar aí!");
      },
    });
    b.spot({ id: "poster", x: 2346, y: 1340, r: 120, verb: "Examinar", script: "poster:summer", hint: "item" });
    b.spot({ id: "signpost", x: 560, y: 1190, r: 110, verb: "Ler", script: "signpost" });
    b.spot({ id: "duck", x: 1860, y: 1250, r: 110, verb: "Examinar", script: "duck" });
    b.exit(1105, 720, 190, 70, "lobby", "door");
    b.exit(2140, 720, 220, 70, "arcade", "door");
    b.exit(0, 1130, 44, 260, "forest", "east");
    b.exit(2756, 1420, 44, 260, "beach", "west");
    b.arrow(60, 1250, 180);
    b.arrow(2740, 1550, 0);
    b.frame([625, 60, 1150, 740], [480, 800, 1340, 340]);
    b.frame([1860, 140, 780, 660], [1820, 800, 980, 340]);
    b.frame([606, 886, 1548, 988], [620, 1140, 1520, 760]);
    b.spawn("hotel", 1200, 965, "f");
    b.spawn("arcade", 2250, 965, "f");
    b.spawn("west", 130, 1250, "s", 1);
    b.spawn("east", 2670, 1550, "s", -1);
    b.spawn("party", POOL.party.player[0], POOL.party.player[1], "f");
    b.spawn("attract", POOL.party.player[0], POOL.party.player[1], "f");
    b.ambient(
      [
        ["splash", 0.25],
        ["bird", 0.5],
      ],
      2600,
      5200,
    );
  },

  arcade(b) {
    b.size(2000, 1250, 560, 1232);
    b.tiles("arcade-wall", 0, 0, 2000, 470, 0);
    b.tiles("arcade-carpet", 0, 470, 2000, 780, 0.2);
    const w = b.g(0.5);
    w.lineStyle(6, INK, 1);
    w.lineBetween(0, 470, 2000, 470);
    w.fillStyle(0x140f26, 0.5);
    w.fillRect(0, 470, 2000, 40);
    const neon = b.prop("neon-sign", 1000, 160, { origin: [0.5, 0.5], depth: "wall" });
    b.glow(1000, 170, 900, 300, 0xff7ad9, 0.18, 0.6);
    b.onUpdate((t) => neon.setAlpha(b.reduced ? 1 : Math.sin(t / 90) > 0.97 ? 0.6 : 1));
    b.prop("poster-tilt", 1615, 200, { origin: [0.5, 0.5], scale: 0.9, depth: "wall" });
    const cabs: [string, number, string][] = [
      ["cab-a", 190, "cabA"],
      ["cab-b", 390, "cabB"],
      ["cab-c", 590, "cabC"],
      ["cab-d", 1220, "cabD"],
    ];
    const colors = [0xff7ad9, 0x5cf0ff, 0x7dffb2, 0xc9d4e4];
    const screens = new Map<string, Phaser.GameObjects.Graphics>();
    const bursts = new Map<string, number>();
    cabs.forEach(([key, x, script], idx) => {
      b.prop(key, x, 530, { origin: [0.5, 1] });
      const halo = b.glow(x, 254, 230, 110, colors[idx], 0.22, 0.6);
      b.onUpdate((t) => halo.setAlpha(b.reduced ? 0.22 : 0.16 + Math.max(0, Math.sin(t / 700 + idx * 1.7)) * 0.16));
      const g = b.world.add.graphics().setDepth(531);
      screens.set(script, g);
      const sx = x - 49;
      const sy = 298;
      b.onUpdate((t) => {
        g.clear();
        const burst = (bursts.get(script) ?? 0) > t;
        if (burst) {
          g.fillStyle(0xffffff, 0.5 + Math.sin(t / 30) * 0.3);
          g.fillRect(sx, sy, 98, 80);
          return;
        }
        const k = b.reduced ? 0.4 : (t / 1000) % 1;
        if (idx === 0) {
          const px = sx + 14 + k * 70;
          const py = sy + 62 - Math.sin(k * Math.PI) * 46;
          g.fillStyle(0xffe39a, 1);
          g.fillCircle(px, py, 5);
          g.fillStyle(0xffe39a, 0.35);
          g.fillCircle(px - 8, py + 4, 3);
        } else if (idx === 1) {
          g.fillStyle(0x7dffb2, 0.9);
          for (let i = 0; i < 4; i += 1) {
            const v = (k + i / 4) % 1;
            g.fillCircle(sx + 30 + i * 12, sy + 70 - v * 60, 3 + i % 2);
          }
        } else if (idx === 2) {
          const v = b.reduced ? 0.5 : (t / 700) % 2;
          const left = v < 1;
          const f = left ? v : v - 1;
          g.fillStyle(left ? 0xffbf8a : 0xef4f43, 1);
          g.fillCircle(left ? sx + 12 + f * 74 : sx + 86 - f * 74, sy + 50 - Math.sin(f * Math.PI) * 30, 6);
        } else {
          for (let i = 0; i < 14; i += 1) {
            g.fillStyle(i % 2 ? 0xc9d4e4 : 0x64708a, b.reduced ? 0.3 : Math.random() * 0.8);
            g.fillRect(sx + Math.random() * 88, sy + Math.random() * 74, 10, 3);
          }
        }
      });
      b.glow(x, 560, 220, 100, colors[idx], 0.25, 0.6);
      b.near(x, 640, 150, {
        cooldown: 8000,
        enter: (t) => {
          bursts.set(script, t + 260);
          b.fx.sfx(idx === 3 ? "arcadeBoop" : "arcadeBeep", 0.3, 1.2 + idx * 0.1);
        },
      });
      b.spot({ id: script, x, y: 610, r: 100, verb: idx === 3 ? "Examinar" : "Jogar", script });
      b.act(`burst:${script}`, async () => {
        bursts.set(script, b.world.time.now + 500);
        for (let i = 0; i < 3; i += 1) {
          b.fx.sfx(i % 2 ? "arcadeBoop" : "arcadeBeep", 0.6, 1 + i * 0.25);
          await b.fx.wait(140);
        }
      });
    });
    let errAt = 6000;
    let errBusy = false;
    b.onUpdate((t) => {
      if (b.reduced || errBusy || t < errAt) return;
      errAt = t + 9000 + Math.random() * 6000;
      errBusy = true;
      const scr = screens.get("cabD");
      scr?.setVisible(false);
      const bg = b.world.add.rectangle(1171, 298, 98, 80, 0x3a0d18, 1).setOrigin(0, 0).setDepth(531.5);
      msgBox.setColor("#ff8f86").setText("ERRO 404");
      b.world.time.delayedCall(900, () => {
        bg.destroy();
        msgBox.setText("").setColor("#7dffb2");
        scr?.setVisible(true);
        errBusy = false;
      });
    });
    const msgBox = b.world.add.text(1220, 338, "", { fontFamily: "Courier New, monospace", fontSize: "13px", fontStyle: "bold", color: "#7dffb2", align: "center", wordWrap: { width: 92 } }).setOrigin(0.5).setDepth(532);
    b.act("brokenScreen", async () => {
      errBusy = true;
      bursts.set("cabD", b.world.time.now + 300);
      b.fx.sfx("bars", 0.5, 1.2);
      await b.fx.wait(320);
      screens.get("cabD")?.setVisible(false);
      const bg = b.world.add.rectangle(1171, 298, 98, 80, 0x0d2a2a, 1).setOrigin(0, 0).setDepth(531.5);
      for (const line of ["SINAL MAIS FORTE:", "ONDE A ÁGUA", "FAZ CHIADO"]) {
        msgBox.setText(line);
        b.fx.sfx("tick", 0.4, 1.6);
        await b.fx.wait(900);
      }
      msgBox.setText("");
      bg.destroy();
      screens.get("cabD")?.setVisible(true);
      errBusy = false;
    });
    const records = b.prop("records", 300, 112, { origin: [0.5, 0.5], depth: "wall", scale: 0.9 });
    const chase = b.g(2.9);
    let close = false;
    b.near(300, 600, 340, {
      enter: () => {
        close = true;
        b.fx.sfx("arcadeBeep", 0.35, 1.5);
      },
      leave: () => {
        close = false;
        chase.clear();
      },
    });
    b.onUpdate((t) => {
      if (!close) return;
      chase.clear();
      const step = Math.floor(t / 120);
      const pts: [number, number][] = [];
      for (let i = 0; i < 14; i += 1) pts.push([164 + i * 21, 12]);
      for (let i = 0; i < 9; i += 1) pts.push([443, 12 + i * 22]);
      for (let i = 0; i < 14; i += 1) pts.push([443 - i * 21, 210]);
      for (let i = 0; i < 9; i += 1) pts.push([157, 210 - i * 22]);
      pts.forEach(([x, y], i) => {
        const on = (i + step) % 4 === 0;
        chase.fillStyle(on ? 0xffe39a : 0x5a3fb8, on ? 1 : 0.6);
        chase.fillCircle(x, y, on ? 5 : 3.5);
      });
    });
    const recText = b.world.add.text(300, 80, "", { fontFamily: "Courier New, monospace", fontSize: "19px", fontStyle: "bold", color: "#ffe39a", lineSpacing: 5 }).setOrigin(0.5, 0).setDepth(3);
    let recSig = "";
    b.onUpdate(() => {
      const rows = [`1. TILT ....... 404.404`];
      if (b.s.secrets.includes("machine")) rows.push("2. DEC ........ 999.999");
      rows.push(`${rows.length + 1}. PLACAR ....... 9.999`);
      if (b.s.flags.tiltWon) rows.push(`${rows.length + 1}. DÉCO ..... FASE 404 OK`);
      const sig = rows.join("|");
      if (sig === recSig) return;
      recSig = sig;
      recText.setText(rows.join("\n"));
    });
    void records;
    b.prop("poster-pijama", 776, 330, { origin: [0.5, 0.5], depth: "wall", scale: 0.68 });
    const placar = b.npc("placar", 800, 690, { scale: 0.78 });
    b.circleBlock(800, 684, 34);
    b.greet("placar", ["Sem correr no fliperama.", "Recorde é coisa séria.", "Olha a fila. Não tem fila. Mas olha."], 300);
    b.act("stamp", async () => {
      b.fx.sfx("kick", 0.8, 0.7);
      b.fx.shake(120, 0.003);
      b.fx.word("CARIMBADO!", 800, 420, "#ef4f43");
      placar?.setMood("happy", 1500, b.world.time.now);
      await b.fx.wait(700);
    });
    b.prop("claw", 1410, 530, { origin: [0.5, 1], react: "jingle", reactR: 110 });
    b.spot({ id: "claw", x: 1410, y: 610, r: 100, verb: "Jogar", script: "claw" });
    b.block(110, 470, 1880, 70);
    b.npc("tilt", 1000, 548, { scale: 0.95, depth: 548, bob: 0.008 });
    b.greet("tilt", b.s.flags.tiltWon ? ["Jogador número 1!", "Meus pixels ainda tremem!"] : ["Psst! Jogador!", "Não olhe pra mim. Olhe. Não olhe."], 280);
    const tiltGlow = b.glow(1000, 600, 320, 120, 0x7dffb2, 0.25, 0.6);
    b.onUpdate((t) => tiltGlow.setAlpha(b.reduced || b.s.flags.tiltWon ? 0.25 : 0.22 + Math.max(0, Math.sin(t / 380)) * 0.3));
    b.spot({ id: "tilt", x: 1000, y: 640, r: 170, verb: "Conversar", script: "tilt" });
    b.prop("cab-gold", 1842, 525, { origin: [0.5, 1], depth: 520, show: (st) => Boolean(st.flags.curtainOpen) });
    const gold = b.glow(1842, 360, 260, 340, 0xffe39a, 0.4, 521);
    gold.setVisible(Boolean(b.s.secrets.includes("machine")));
    b.vars.goldGlow = gold;
    b.prop("curtain", 1842, 532, { origin: [0.5, 1], depth: 532, show: (st) => !st.flags.curtainOpen });
    b.prop("curtain-open", 1842, 532, { origin: [0.5, 1], depth: 532, show: (st) => Boolean(st.flags.curtainOpen) });
    b.spot({ id: "curtain", x: 1842, y: 610, r: 120, verb: "Examinar", script: "curtain", show: (st) => !st.flags.curtainOpen, hint: "secret" });
    b.spot({ id: "gold", x: 1842, y: 610, r: 120, verb: (st) => (st.tokens.length >= 3 && !st.secrets.includes("machine") ? "Colocar fichas" : "Examinar"), script: "goldMachine", show: (st) => Boolean(st.flags.curtainOpen) });
    b.prop("prize-counter", 1640, 1010, { origin: [0.5, 1], rect: [-210, -130, 420, 130] });
    b.spot({ id: "prizes", x: 1640, y: 1060, r: 170, verb: "Examinar", script: "prizes" });
    b.prop("pinball", 500, 900, { origin: [0.5, 1], rect: [-110, -70, 220, 70], react: "jingle" });
    b.spot({ id: "pinball", x: 500, y: 950, r: 130, verb: "Jogar", script: "pinball" });
    b.prop("air-hockey", 1000, 960, { origin: [0.5, 1], rect: [-140, -70, 280, 70], react: "jingle" });
    b.spot({ id: "hockey", x: 1000, y: 1010, r: 140, verb: "Jogar", script: "hockey" });
    b.prop("stool", 300, 760, { origin: [0.5, 1], circle: 18, react: "spin" });
    b.prop("stool", 620, 790, { origin: [0.5, 1], circle: 18, react: "spin" });
    b.prop("stool", 1300, 760, { origin: [0.5, 1], circle: 18, react: "spin" });
    b.spot({ id: "poster", x: 1615, y: 620, r: 110, verb: "Examinar", script: "poster:tilt", hint: "item" });
    b.spot({ id: "records", x: 300, y: 600, r: 90, verb: "Ler", script: "records" });
    b.spot({ id: "posterPijama", x: 776, y: 594, r: 80, verb: "Examinar", script: "posterPijama" });
    b.spot({ id: "placar", x: 800, y: 750, r: 160, verb: "Conversar", script: "placar" });
    b.exit(880, 1216, 240, 40, "pool", "arcade");
    b.frame([0, 0, 2000, 660], [0, 560, 2000, 360]);
    b.prop("doormat", 1000, 1252, { origin: [0.5, 1], depth: "floor", scale: 0.8 });
    b.glow(1000, 1250, 460, 140, 0xfff1c0, 0.35, 0.45);
    b.arrow(1000, 1200, 90);
    b.spawn("door", 1000, 1140, "k");
    b.ambient(
      [
        ["arcadeBeep", 0.6],
        ["arcadeBoop", 0.6],
      ],
      900,
      2600,
    );
  },

  beach(b) {
    const s = b.s;
    b.size(3000, 1500, 236, 1478);
    const sky = b.world.add.image(0, 0, "sky-beach").setOrigin(0, 0).setDisplaySize(3000, 180).setDepth(0);
    void sky;
    b.prop("island", 2150, 174, { origin: [0.5, 1], depth: 0.05, scale: 0.75 });
    const lamp = b.glow(2150, 35, 110, 110, 0xffc83d, 0, 0.06).setBlendMode(Phaser.BlendModes.NORMAL);
    const lampCore = b.glow(2150, 35, 34, 34, 0xfffaf0, 0, 0.07).setBlendMode(Phaser.BlendModes.NORMAL);
    const beacon = (t: number) => {
      const c = t % 7080;
      const flash = (s: number) => c >= s && c < s + 4 * 360 && (c - s) % 360 < 180;
      return flash(0) || flash(2640);
    };
    let lampBoost = 0;
    b.onUpdate((t) => {
      const on = beacon(t);
      lamp.setAlpha(on ? 0.75 + lampBoost * 0.5 : 0);
      lampCore.setAlpha(on ? 1 : 0);
      lamp.setDisplaySize(on ? 110 + lampBoost * 160 : 80, on ? 110 + lampBoost * 160 : 80);
    });
    b.act("lighthouseLook", async () => {
      lampBoost = 0.35;
      await b.fx.wait(2200);
      lampBoost = 0;
    });
    const sea = b.world.add.tileSprite(0, 160, 3000, 480, "sea-tile").setOrigin(0, 0).setDepth(0.1);
    b.tiles("sand", 0, 600, 3000, 900, 0.15);
    const shore = b.g(0.3);
    const notch = b.g(0.32);
    b.vars.notch = notch;
    const tideAt = (t: number) => (b.vars.seaPaused || b.vars.seaFrozen ? 0.7 : (Math.sin((t / 7000) * Math.PI * 2) + 1) / 2);
    const waterline = (x: number, t: number) => {
      const paused = Boolean(b.vars.seaPaused || b.vars.seaFrozen);
      return 600 + tideAt(t) * 40 + Math.sin(x / 140 + (paused ? 0 : t / 900)) * 8;
    };
    const drawShore = (t: number) => {
      const paused = Boolean(b.vars.seaPaused || b.vars.seaFrozen);
      const p = tideAt(t);
      shore.clear();
      shore.fillStyle(0xe3bd7c, 1);
      shore.beginPath();
      shore.moveTo(0, 600);
      for (let x = 0; x <= 3000; x += 60) shore.lineTo(x, 610 + p * 46 + 6 + Math.sin(x / 140 + t / 900) * 8);
      shore.lineTo(3000, 600);
      shore.closePath();
      shore.fillPath();
      shore.fillStyle(0x7fd6f5, 1);
      shore.beginPath();
      shore.moveTo(0, 590);
      for (let x = 0; x <= 3000; x += 60) shore.lineTo(x, 600 + p * 40 + Math.sin(x / 140 + (paused ? 0 : t / 900)) * 8);
      shore.lineTo(3000, 590);
      shore.closePath();
      shore.fillPath();
      shore.lineStyle(10, 0xffffff, 0.95);
      shore.beginPath();
      for (let x = 0; x <= 3000; x += 40) {
        const y = 600 + p * 40 + Math.sin(x / 140 + (paused ? 0 : t / 900)) * 8;
        if (x === 0) shore.moveTo(x, y);
        else shore.lineTo(x, y);
      }
      shore.strokePath();
      if (!paused) sea.setTilePosition(t / 40, Math.sin(t / 1500) * 8);
    };
    b.onUpdate((t) => drawShore(t));
    const paintNotch = (on: boolean) => {
      notch.clear();
      if (!on) return;
      notch.fillStyle(0xd9ad66, 1);
      notch.fillRoundedRect(1060, 440, 380, 230, 90);
      notch.fillStyle(0xc99a55, 0.6);
      for (let i = 0; i < 6; i += 1) notch.fillCircle(1110 + i * 60, 470 + (i % 2) * 40, 8);
      notch.lineStyle(10, 0xffffff, 0.9);
      notch.strokeRoundedRect(1060, 440, 380, 230, 90);
    };
    b.vars.paintNotch = paintNotch;
    const pausedNow = Boolean(s.flags.seaPaused && !s.flags.gotOrder);
    b.vars.seaPaused = pausedNow;
    paintNotch(pausedNow);
    const onPier = (x: number, y: number) => x > 2318 && x < 2482 && y > 230 && y < 790;
    const inNotch = (x: number, y: number) => Boolean(b.vars.seaPaused) && x > 1090 && x < 1410 && y > 470;
    const dryFrom = (x: number) => waterline(x, b.world.time.now) + 30;
    b.blocker((x, y) => {
      if (y >= dryFrom(x)) return false;
      if (onPier(x, y) || inNotch(x, y)) return false;
      return true;
    });
    let washAt = 0;
    b.onUpdate((t) => {
      const h = b.hero();
      if (!h || onPier(h.x, h.y) || inNotch(h.x, h.y)) return;
      const limit = dryFrom(h.x);
      if (h.y >= limit) return;
      if (b.pushHero(h.x, limit + 1) && t > washAt) {
        washAt = t + 2500;
        b.fx.sfx("ripple", 0.5, 0.8);
        splashAt(b, h.x, limit - 10, 0.8);
      }
    });
    b.surface((x, y) => {
      if (onPier(x, y)) return { kind: "wood" };
      return { kind: "sand", gone: (fx, fy) => fy < waterline(fx, b.world.time.now) + 14 };
    });
    b.prop("pier", 2400, 770, { origin: [0.5, 1], depth: 0.35 });
    b.prop("bottle", 1250, 540, { origin: [0.5, 1], depth: 541, show: (st) => Boolean(st.flags.seaPaused && !st.flags.gotOrder) });
    b.prop("wave-sign", 1050, 720, { origin: [0.5, 1], circle: 18, react: "wobble" });
    b.prop("kiosk", 1960, 930, { origin: [0.5, 1], rect: [-262, -170, 524, 170], shadow: 560, occlude: [0.96, 0.32, 0.46] });
    const radio = b.prop("radio", 2100, 742, { origin: [0.5, 1], depth: 931, scale: 0.9 });
    b.act("radioTune", async () => {
      b.fx.sfx("bars", 0.35, 1.4);
      for (let i = 0; i < 6; i += 1) {
        if (!b.reduced) radio.setAngle(i % 2 ? 4 : -4);
        if (i === 2) b.fx.word("♪", 2130, 680, "#ffe39a");
        await b.fx.wait(110);
      }
      radio.setAngle(0);
    });
    b.act("kioskBell", async () => {
      b.fx.sfx("bell", 0.6, 1.4);
      b.fx.word("PLIM!", 1960, 640, "#ffe39a");
      await b.fx.wait(400);
    });
    b.prop("poster-surf", 1752, 800, { origin: [0.5, 0.5], scale: 0.42, depth: 931 });
    const boards = [
      b.prop("surf-a", 2600, 940, { origin: [0.5, 1], angle: -6, react: "wobble", reactR: 60 }),
      b.prop("surf-b", 2670, 950, { origin: [0.5, 1], angle: 4, react: "wobble", reactR: 60 }),
      b.prop("surf-c", 2740, 940, { origin: [0.5, 1], angle: -3, react: "wobble", reactR: 60 }),
    ];
    b.act("surfWobble", async () => {
      b.fx.sfx("kick", 0.6, 0.7);
      boards.forEach((bd, i) => {
        if (b.reduced) return;
        const a = bd.angle;
        b.world.tweens.add({ targets: bd, angle: a + (i === 1 ? 24 : -18), duration: 160, delay: i * 90, yoyo: true, ease: "Quad.easeOut" });
      });
      await b.fx.wait(600);
      b.fx.sfx("kick", 0.4, 1.2);
    });
    b.block(2550, 905, 240, 45);
    b.prop("umbrella-b", 1330, 990, { origin: [0.5, 1], circle: 18, anim: "sway", amp: 1, shadow: 70, react: "rustle", reactR: 90, occlude: [0.98, 0.55, 0.45] });
    b.prop("deckchair", 1420, 1040, { origin: [0.5, 1], rect: [-70, -40, 140, 40], react: "bounce" });
    const marisa = b.npc("marisa", 1570, 1030, { scale: 0.85 });
    b.prop("chips", 1452, 1000, { origin: [0.5, 1], depth: 1042, scale: 0.8 });
    b.greet("marisa", () => {
      const f = b.s.flags;
      if (f.ended) return ["Férias que nunca acabam!", "Vem, a areia tá quentinha."];
      if (f.gotOrder) return ["Uma garrafa com recado? Clássico.", "O mar voltou. A reprise também."];
      if (f.seaPaused) return ["O mar parou! Que silêncio bom.", "Aproveita e vê o que ele deixou."];
      return ["Olha a distância!", "Tô de férias. Não incomode.", "Já viu o farol? Ele pisca esquisito."];
    }, 260);
    const guard = async (t: number) => {
      marisa?.playSeq(["happy", "talk", "happy", "normal"], 180, t);
      b.fx.sfx("gull", 0.7);
      b.bark("marisa", "Minhas batatinhas!", null);
      if (marisa && !b.reduced) b.world.tweens.add({ targets: marisa.sprite, y: marisa.y - 26, duration: 140, yoyo: true, repeat: 1, ease: "Quad.easeOut" });
    };
    b.near(1452, 1060, 120, { cooldown: 6000, enter: (t) => void guard(t) });
    b.act("marisaGuard", () => guard(b.world.time.now));
    const clique = b.npc("clique", 880, 830, { scale: 0.82 });
    b.circleBlock(880, 824, 34);
    b.greet("clique", () => (b.s.flags.photoDone ? ["Minha foto vai pro jornal do resort!", "Quer ver a foto? Ficou ótima."] : ["Shh! A onda tá vindo!", "Sorria! Não, você não.", "Mais uma. Só mais uma."]), 280);
    const flashAt = (x: number, y: number) => {
      const fl = b.glow(x, y, 160, 160, 0xffffff, 0.95, 5900);
      b.world.tweens.add({ targets: fl, alpha: 0, scale: 1.6, duration: b.reduced ? 10 : 380, onComplete: () => fl.destroy() });
    };
    let shotAt = 6000;
    b.onUpdate((t) => {
      if (!clique || clique.busy || t < shotAt || b.s.flags.photoDone) return;
      shotAt = t + 9000 + Math.random() * 5000;
      clique.playSeq(["shoot", "shoot", "shoot", "sad", "sad", "sad", "normal"], 260, t);
      b.world.time.delayedCall(560, () => flashAt(clique.x + 40, clique.topY + 50));
    });
    b.act("cliqueTry", async () => {
      if (!clique) return;
      clique.playSeq(["shoot", "shoot", "shoot", "sad", "sad"], 260, b.world.time.now);
      await b.fx.wait(560);
      flashAt(clique.x + 40, clique.topY + 50);
      b.fx.sfx("pause", 0.4, 1.6);
      b.fx.gull(clique.x - 200, clique.y - 200, 0);
      await b.fx.wait(800);
    });
    b.act("cliquePhoto", async () => {
      if (!clique) return;
      b.vars.seaFrozen = true;
      b.fx.sfx("pause", 1);
      const vhs = b.vars.seaPaused ? b.fx.wait(2200) : b.fx.vhs("▌▌ PAUSA", 2200);
      await b.fx.wait(500);
      clique.playSeq(["shoot", "shoot", "shoot", "happy"], 220, b.world.time.now);
      await b.fx.wait(500);
      flashAt(clique.x + 40, clique.topY + 50);
      b.fx.flash();
      b.fx.sfx("pick", 0.9);
      await vhs;
      b.vars.seaFrozen = false;
      b.fx.sfx("play", 0.8);
      const card = b.world.add.container(clique.x + 120, clique.topY - 60).setDepth(5900);
      const frame = b.world.add.rectangle(0, 0, 150, 170, 0xfffaf0).setStrokeStyle(6, 0x1d1830);
      const pic = b.world.add.tileSprite(0, -14, 126, 110, "sea-tile");
      const txt = b.world.add.text(0, 62, "4:04", { fontFamily: b.fonts.display, fontSize: "24px", color: "#1d1830" }).setOrigin(0.5);
      card.add([frame, pic, txt]);
      card.setAngle(-8);
      if (!b.reduced) {
        card.setScale(0.2);
        b.world.tweens.add({ targets: card, scale: 1, angle: 6, duration: 360, ease: "Back.easeOut" });
      }
      await b.fx.wait(1600);
      b.world.tweens.add({ targets: card, alpha: 0, y: card.y - 60, duration: b.reduced ? 10 : 400, onComplete: () => card.destroy() });
    });
    b.circleBlock(1570, 1024, 34);
    b.prop("rock-a", 520, 790, { origin: [0.5, 1], rect: [-100, -60, 200, 60] });
    b.prop("rock-b", 700, 730, { origin: [0.5, 1], rect: [-66, -40, 132, 40] });
    b.prop("rock-a", 2820, 1330, { origin: [0.5, 1], flip: true, rect: [-100, -60, 200, 60] });
    b.prop("shell-big", 650, 860, { origin: [0.5, 1], rect: [-62, -34, 124, 34] });
    b.prop("shells", 900, 1320, { origin: [0.5, 1], depth: "floor" });
    b.spot({ id: "shells", x: 900, y: 1350, r: 90, verb: "Escutar", script: "shells" });
    b.prop("shells", 2050, 1260, { origin: [0.5, 1], depth: "floor" });
    b.prop("sandcastle", 1100, 1280, { origin: [0.5, 1], rect: [-90, -50, 180, 50] });
    b.act("crabPop", async () => {
      const c = b.world.add.image(1100, 1270, "crab-a").setOrigin(0.5, 1).setDepth(1281).setScale(0.2);
      b.fx.sfx("blipSoft", 0.7, 1.4);
      if (b.reduced) c.setScale(1).setY(1330);
      else {
        b.world.tweens.add({ targets: c, scale: 1, y: 1330, duration: 300, ease: "Back.easeOut" });
        b.world.tweens.addCounter({ from: 0, to: 12, duration: 1200, onUpdate: (tw) => c.setTexture(Math.floor(tw.getValue() ?? 0) % 2 ? "crab-a" : "crab-b") });
      }
      await b.fx.wait(1300);
      b.fx.sfx("door", 0.4, 1.6);
      b.world.tweens.add({ targets: c, scale: 0.2, y: 1270, duration: b.reduced ? 10 : 260, onComplete: () => c.destroy() });
    });
    for (const [x, y, k, flip] of [
      [260, 1000, "palm", false],
      [2770, 1140, "palm-b", true],
      [236, 1440, "palm-b", false],
      [2600, 1490, "palm", true],
    ] as [number, number, string, boolean][]) {
      b.prop(k, x, y, { origin: [0.5, 1], flip, anim: "sway", amp: 2, circle: 30, shadow: 120, react: "rustle", reactR: 80 });
    }
    b.prop("umbrella-a", 700, 1200, { origin: [0.5, 1], circle: 18, anim: "sway", amp: 1, shadow: 70, react: "rustle", reactR: 90, occlude: [0.98, 0.55, 0.45] });
    b.prop("lounge-a", 790, 1250, { origin: [0.5, 1], rect: [-92, -54, 184, 54], react: "bounce" });
    for (let i = 0; i < 2; i += 1) {
      const y = 1150 + i * 120;
      b.critter({ frames: ["crab-a", "crab-b"], x: 900 + i * 900, y, bounds: [700 + i * 700, y - 30, 1500 + i * 700, y + 30], mode: "walk", react: "flee", r: 230, scale: 1, speed: 60, sound: ["blipSoft", 0.25, 2.4], away: [6000, 9000] });
    }
    for (let i = 0; i < 3; i += 1) {
      b.critter({ frames: ["gull-sit", "gull-peck"], flyFrames: ["gull-a", "gull-b"], rest: "gull-sit", x: 2350 + i * 50, y: 420 + i * 120, bounds: [2340, 330, 2460, 720], mode: "walk", react: "fly", r: 220, scale: 0.5, speed: 25, sound: ["gull", 0.45, 1 + i * 0.1], away: [7000, 11000], faceLeft: false });
    }
    b.resident({
      frames: ["siri-a", "siri-b"],
      x: 1720,
      y: 1430,
      scale: 0.62,
      block: 40,
      name: "Seu Siri",
      lines: ["Cuidado com o meu castelo! Ah, eu não tenho castelo.", "Sol de 2004. Bronzeia igual.", "Andar de lado é uma escolha de vida.", "A onda das 4:04 é minha favorita. É a única."],
      sound: ["blipSoft", 0.5, 1.7],
      r: 280,
    });
    const lento = b.npc("lento", 2500, 1330, { scale: 0.8, show: (st) => Boolean(st.flags.whistleReturned && !st.flags.ended), frames: s.flags.gotKey ? { normal: "walk-a-nokey", look: "walk-b-nokey", talk: "talk-nokey", happy: "happy-nokey", surprised: "happy-nokey" } : undefined });
    if (lento) {
      b.vars.lento = lento;
      let lx = 2500;
      let ld = -1;
      b.blocker((x, y) => Math.hypot(x - lento.x, (y - lento.y) * 1.4) < 56);
      b.onUpdate((t, dt) => {
        if (b.vars.lentoTalking || !lento.idle) return;
        const h = b.hero();
        if (h && Math.hypot(h.x - lento.x, h.y - lento.y) < 140) return;
        lx += ld * 9 * dt;
        if (lx < 500) ld = 1;
        if (lx > 2600) ld = -1;
        lento.moveTo(lx, 1330);
        lento.sprite.setFlipX(ld > 0);
        lento.walkFrame(`${Math.floor(t / 700) % 2 ? "walk-a" : "walk-b"}${b.s.flags.gotKey ? "-nokey" : ""}`, t);
      });
      b.spot({ id: "lento", x: 2500, y: 1380, r: 170, verb: "Conversar", script: "lento", show: (st) => Boolean(st.flags.whistleReturned && !st.flags.ended), at: () => [lento.x, lento.y + 50] });
    }
    b.spot({ id: "marisa", x: 1570, y: 1080, r: 170, verb: "Conversar", script: "marisa" });
    b.spot({ id: "shore", x: 1250, y: 680, r: 190, verb: (st) => (st.items.includes("remote") && !st.flags.gotOrder && !st.flags.seaPaused ? "Pausar o mar" : "Examinar"), script: "shore", show: (st) => !(st.flags.seaPaused && !st.flags.gotOrder) });
    b.spot({ id: "bottle", x: 1250, y: 560, r: 130, verb: "Pegar", script: "bottle", show: (st) => Boolean(st.flags.seaPaused && !st.flags.gotOrder), hint: "item" });
    b.spot({ id: "shell", x: 650, y: 900, r: 110, verb: "Examinar", script: "shellToken", hint: "secret" });
    b.spot({ id: "kiosk", x: 1980, y: 990, r: 170, verb: "Examinar", script: "kiosk" });
    b.spot({ id: "poster", x: 1752, y: 990, r: 110, verb: "Examinar", script: "poster:surf", hint: "item" });
    b.spot({ id: "waveSign", x: 1050, y: 760, r: 110, verb: "Ler", script: "waveSign" });
    b.spot({ id: "sandcastle", x: 1100, y: 1320, r: 130, verb: "Examinar", script: "sandcastle" });
    b.spot({ id: "pierEnd", x: 2400, y: 260, r: 160, verb: "Olhar", script: "pierEnd" });
    b.spot({ id: "surf", x: 2670, y: 1000, r: 130, verb: "Examinar", script: "surf" });
    b.spot({ id: "clique", x: 880, y: 890, r: 160, verb: "Conversar", script: "clique" });
    b.spot({ id: "chips", x: 1452, y: 1090, r: 100, verb: "Examinar", script: "chips" });
    b.greet("lento", ["Boa... tarde...", "Sem... pressa..."], 260);
    b.exit(0, 1130, 30, 180, "pool", "east");
    b.frame([0, 0, 3000, 680], [0, 640, 3000, 260]);
    b.frame([1674, 475, 572, 455], [1500, 900, 900, 380]);
    b.arrow(70, 1220, 180);
    b.spawn("west", 140, 1220, "s", 1);
    b.ambient(
      [
        ["wave", 0.8],
        ["gull", 0.5],
      ],
      2200,
      4600,
    );
  },

  forest(b) {
    const s = b.s;
    b.size(2800, 1700, 600, 1675);
    b.tiles("forest-floor", 0, 0, 2800, 1700, 0);
    const shade = b.g(0.15);
    shade.fillStyle(0x1f4030, 0.55);
    shade.fillRect(0, 0, 2800, 520);
    const ground = b.g(0.2);
    const trail = band(ground, [[2800, 1150], [2400, 1180], [2000, 1090], [1650, 1020], [1300, 1040], [1050, 1010], [820, 880], [600, 690]], 150, 0xb8895a, INK, 0xd4a774);
    const water = b.g(0.25);
    const stream = band(water, [[600, 640], [900, 860], [1120, 1010], [1250, 1250], [1220, 1500], [1300, 1720]], 110, 0x3fa9dc, INK, 0x8fe3ff);
    const foam = b.g(0.26);
    b.onUpdate((t) => {
      foam.clear();
      foam.lineStyle(4, 0xffffff, 0.7);
      for (let i = 0; i < stream.length - 4; i += 6) {
        const k = ((t / 30 + i * 7) % 60) / 60;
        const a = stream[i];
        const c = stream[i + 3];
        foam.lineBetween(a.x + (c.x - a.x) * k - 10, a.y + (c.y - a.y) * k, a.x + (c.x - a.x) * k + 10, a.y + (c.y - a.y) * k);
      }
    });
    const onBridge = (x: number, y: number) => x > 850 && x < 1330 && y > 985 && y < 1070;
    const wet = (x: number, y: number) => polyDistance(stream, x, y).d < 52;
    b.blocker((x, y) => !onBridge(x, y) && polyDistance(stream, x, y).d < 74);
    b.surface((x, y) => {
      if (onBridge(x, y)) return { kind: "wood" };
      const w = polyDistance(stream, x, y);
      if (w.d < 112) return { kind: "grass", splash: Math.random() < 0.6 ? [w.x + (x - w.x) * 0.25, w.y + (y - w.y) * 0.25] : undefined };
      if (polyDistance(trail, x, y).d < 70) return { kind: "dirt", color: 0xc9a173 };
      return null;
    });
    for (const [fx, fy] of [
      [820, 760],
      [1330, 1300],
      [1150, 1600],
    ] as [number, number][])
      b.critter({ frames: ["frog-a", "frog-b"], x: fx, y: fy, bounds: [fx - 130, fy - 80, fx + 130, fy + 80], mode: "hop", react: "hop", r: 210, scale: 0.42, sound: ["croak", 0.4, 1], water: wet, away: [5000, 9000] });
    b.critter({ frames: ["butterfly-a", "butterfly-b"], x: 2300, y: 1250, bounds: [1900, 1150, 2650, 1500], mode: "flutter", react: "fly", r: 170, scale: 0.5, depth: 4800, speed: 60, sound: ["flutter", 0.4, 1.1], away: [5000, 9000] });
    b.prop("boardwalk", 1090, 1090, { origin: [0.5, 1], depth: 0.4 });
    b.prop("cliff", 560, 620, { origin: [0.5, 1], depth: 300 });
    b.block(290, 300, 540, 288);
    b.prop("fall-pool", 560, 640, { origin: [0.5, 0.5], scale: 0.62, depth: 0.45 });
    b.blocker((x, y) => ((x - 560) / 196) ** 2 + ((y - 640) / 62) ** 2 < 1);
    const fall = b.world.add.tileSprite(470, 118, 180, 462, "waterfall-tile").setOrigin(0, 0).setDepth(301);
    const fallScan = b.world.add.tileSprite(470, 118, 180, 462, "scanlines").setOrigin(0, 0).setDepth(302).setAlpha(0);
    b.vars.fall = fall;
    b.vars.fallScan = fallScan;
    if (s.flags.fallPaused) {
      fall.setAlpha(0.3);
      fallScan.setAlpha(0.6);
    } else fall.setAlpha(0.94);
    b.onUpdate((t) => {
      if (!b.s.flags.fallPaused) fall.setTilePosition(0, -t / 2.2);
    });
    const mist: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 6; i += 1) mist.push(b.glow(500 + i * 26, 600, 90, 60, 0xffffff, 0.3, 303));
    b.onUpdate((t) => {
      if (b.s.flags.fallPaused) return;
      mist.forEach((m, i) => m.setPosition(490 + i * 26 + Math.sin(t / 400 + i) * 14, 590 - ((t / 8 + i * 30) % 80)).setAlpha(0.3 - ((t / 8 + i * 30) % 80) / 300));
    });
    const trees: [string, number, number, boolean][] = [
      ["tree-a", 232, 760, false],
      ["tree-b", 1000, 610, true],
      ["tree-c", 1380, 560, false],
      ["tree-a", 1820, 610, true],
      ["tree-b", 2260, 620, false],
      ["tree-c", 2600, 604, true],
      ["tree-a", 300, 1340, true],
      ["tree-b", 720, 1650, false],
      ["tree-c", 1740, 1600, true],
      ["tree-a", 2160, 1690, false],
      ["tree-b", 2560, 1700, true],
    ];
    for (const [k, x, y, flip] of trees) {
      const tr = b.prop(k, x, y, { origin: [0.5, 1], flip, rect: [-44, -26, 88, 26], anim: "sway", amp: 0.8, react: "rustle", reactR: 110 });
      if (y <= 760) tr.setTint(0xc6d0e2);
    }
    let leafAt = 1500;
    b.onUpdate((t) => {
      if (b.reduced || t < leafAt) return;
      leafAt = t + 1600 + Math.random() * 2200;
      const [tx, ty] = trees[Math.floor(Math.random() * trees.length)].slice(1) as [number, number];
      const leaf = b.world.add.image(tx + (Math.random() - 0.5) * 300, ty - 380 + Math.random() * 120, "leaf").setDepth(4650).setAngle(Math.random() * 180);
      b.world.tweens.add({ targets: leaf, y: leaf.y + 260, x: leaf.x + (Math.random() - 0.5) * 140, angle: leaf.angle + 220, alpha: { from: 1, to: 0 }, duration: 3200, ease: "Sine.easeIn", onComplete: () => leaf.destroy() });
    });
    b.prop("treehouse", 2480, 980, { origin: [0.5, 1], occlude: [0.98, 0.12, 0.4] });
    b.block(2390, 950, 50, 30);
    b.block(2530, 950, 50, 30);
    b.prop("ruin-arch", 1650, 1062, { origin: [0.5, 1] });
    const ghost = b.world.add.image(1720, 760, "ghost").setDepth(1061).setAlpha(0);
    let ghostAt = 7000;
    b.onUpdate((t) => {
      if (b.reduced || t < ghostAt) return;
      ghostAt = t + 11000 + Math.random() * 8000;
      ghost.setPosition(1560 + Math.random() * 200, 800).setAlpha(0.9);
      b.world.tweens.add({ targets: ghost, y: 700, duration: 700, yoyo: true, hold: 900, ease: "Sine.easeOut", onComplete: () => ghost.setAlpha(0) });
    });
    b.block(1474, 1036, 34, 26);
    b.block(1794, 1036, 34, 26);
    b.prop("placard", 1500, 1160, { origin: [0.5, 1], circle: 16 });
    b.prop("statue-404", 2050, 840, { origin: [0.5, 1], rect: [-100, -44, 200, 44], occlude: [0.96, 0.3, 0.42] });
    b.prop("placard", 2190, 920, { origin: [0.5, 1], circle: 16 });
    const dish = b.prop("dish", 1250, 780, { origin: [0.5, 1], rect: [-70, -30, 140, 30] });
    const tip = b.glow(1250, 486, 46, 46, 0xef4f43, 0.5, 781);
    const waves = b.g(782);
    b.onUpdate((t) => {
      tip.setAlpha(b.reduced ? 0.5 : Math.sin(t / 260) > 0.2 ? 0.85 : 0.2);
      waves.clear();
      if (b.reduced) return;
      const k = (t % 4200) / 1400;
      for (let i = 0; i < 3; i += 1) {
        const v = k - i * 0.35;
        if (v < 0 || v > 1) continue;
        const r = 30 + v * 110;
        waves.lineStyle(5, 0x9df0dc, (1 - v) * 0.7);
        waves.beginPath();
        waves.arc(1250, 520, r, Phaser.Math.DegToRad(-150), Phaser.Math.DegToRad(-30));
        waves.strokePath();
      }
    });
    b.act("dishWobble", async () => {
      b.fx.sfx("bars", 0.4, 1.3);
      if (!b.reduced) b.world.tweens.add({ targets: dish, angle: { from: -5, to: 5 }, duration: 110, yoyo: true, repeat: 4, onComplete: () => dish.setAngle(0) });
      for (let i = 0; i < 6; i += 1) {
        const sp = b.world.add.image(1250 + (Math.random() - 0.5) * 120, 640 + Math.random() * 60, "spark").setDepth(5700).setTint(0x9df0dc);
        b.world.tweens.add({ targets: sp, y: sp.y - 60, alpha: 0, duration: b.reduced ? 10 : 600, delay: i * 60, onComplete: () => sp.destroy() });
      }
      await b.fx.wait(700);
    });
    b.prop("carousel-horse", 1460, 1420, { origin: [0.5, 1], rect: [-50, -24, 100, 24] });
    b.spot({ id: "horse", x: 1460, y: 1460, r: 110, verb: "Examinar", script: "horse" });
    b.prop("ticket-booth", 2270, 1380, { origin: [0.5, 1], rect: [-140, -84, 280, 84], shadow: 300, occlude: [0.96, 0.3, 0.44] });
    const boothLight = b.glow(2270, 1018, 240, 90, 0xffe39a, 0.3, 1382);
    b.onUpdate((t) => boothLight.setAlpha(b.reduced ? 0.3 : Math.floor(t / 500) % 4 === 0 ? 0.05 : 0.32));
    b.act("ticketPrint", async () => {
      b.fx.sfx("tick", 0.6, 1.2);
      const tk = b.world.add.image(2270, 1250, "ticket").setDepth(1383).setScale(0.3);
      if (b.reduced) tk.setScale(1).setY(1180);
      else await new Promise<void>((r) => b.world.tweens.add({ targets: tk, scale: 1, y: 1180, angle: -8, duration: 380, ease: "Back.easeOut", onComplete: () => r() }));
      b.fx.sfx("pick", 0.6);
      await b.fx.wait(900);
      b.world.tweens.add({ targets: tk, alpha: 0, y: 1140, duration: b.reduced ? 10 : 300, onComplete: () => tk.destroy() });
    });
    b.prop("poster-ghost", 2270, 1184, { origin: [0.5, 0.5], scale: 0.5, depth: 1381 });
    b.prop("log", 2200, 1490, { origin: [0.5, 1], rect: [-110, -50, 220, 50] });
    b.prop("stump", 720, 1010, { origin: [0.5, 1], rect: [-66, -40, 132, 40] });
    b.npc("psiu", 720, 952, { scale: 0.8, depth: 1011, noShadow: true });
    b.greet("psiu", ["Psiu.", "...psiu?"], 240);
    const cav = b.npc("cavuca", 1980, 1160, { scale: 0.78, notice: 220 });
    if (cav) {
      let ang = 1.2;
      let stepAt = 0;
      let foot = 0;
      b.blocker((x, y) => Math.hypot(x - cav.x, (y - cav.y) * 1.4) < 52);
      b.onUpdate((t, dt) => {
        if (b.vars.talking === "cavuca" || !cav.idle) return;
        const h = b.hero();
        if (h && Math.hypot(h.x - cav.x, (h.y - cav.y) * 1.3) < 220) return;
        ang += dt * 0.22;
        const nx = 1980 + Math.cos(ang) * 140;
        const ny = 1118 + Math.sin(ang) * 46;
        cav.sprite.setFlipX(-Math.sin(ang) < 0);
        cav.moveTo(nx, ny);
        if (t > stepAt) {
          stepAt = t + 340;
          foot = 1 - foot;
          cav.walkFrame(foot ? "walk-b" : "walk-a", t);
        }
      });
      b.spot({ id: "cavuca", x: 1980, y: 1160, r: 170, verb: "Conversar", script: "cavuca", at: () => [cav.x, cav.y + 50] });
      b.greet("cavuca", ["Por aqui! Não. Por ali.", "Já mapeei esta árvore três vezes."], 300);
    }
    const peeks: [number, number][] = [
      [356, 1330],
      [782, 1640],
      [1680, 1590],
      [2100, 1680],
      [1062, 600],
      [2560, 1000],
      [1960, 860],
    ];
    const onScreen = (x: number, y: number) => {
      const v = b.world.cameras.main.worldView;
      return x > v.x + 90 && x < v.right - 90 && y - 80 > v.y + 90 && y < v.bottom - 50;
    };
    const glint = (x: number, y: number) => {
      for (let i = 0; i < 5; i += 1) {
        const sp = b.world.add.image(x + (Math.random() - 0.5) * 70, y - 40 - Math.random() * 50, "spark").setDepth(5700).setTint(0xc9d4e4).setScale(0.6);
        b.world.tweens.add({ targets: sp, alpha: 0, scale: 1.1, angle: 90, duration: b.reduced ? 10 : 500, delay: i * 70, onComplete: () => sp.destroy() });
      }
    };
    const chi = b.npc("chiado", 356, 1330, { scale: 0.62, noShadow: true });
    let cstate: "hidden" | "peek" | "curious" = "hidden";
    let cnext = 2500;
    let cshown = 0;
    let still = 0;
    let hopAt = 0;
    const hide = (t: number, flee: boolean) => {
      if (!chi) return;
      cstate = "hidden";
      cnext = t + 4000 + Math.random() * 2500;
      if (flee) b.fx.sfx("blipSoft", 0.35, 2);
      if (b.reduced) chi.sprite.setAlpha(0);
      else b.world.tweens.add({ targets: chi.sprite, alpha: 0, x: chi.x + (flee ? 60 : 0), duration: 260 });
    };
    if (chi) {
      chi.sprite.setAlpha(0);
      b.onUpdate((t) => {
        if (b.vars.talking === "chiado") return;
        const h = b.hero();
        if (!h) return;
        if (cstate === "hidden") {
          if (t < cnext || h.busy) return;
          const opts = peeks.filter(([x, y]) => Math.hypot(x - h.x, y - h.y) > 420 && onScreen(x, y));
          if (!opts.length) {
            cnext = t + 1500;
            return;
          }
          const [px, py] = opts[Math.floor(Math.random() * opts.length)];
          chi.moveTo(px, py);
          chi.sprite.setDepth(py - 12);
          chi.setMood("look", 0, 0);
          cstate = "peek";
          cshown = t;
          still = 0;
          b.fx.sfx("bars", 0.22, 1.9);
          glint(px, py);
          if (b.reduced) chi.sprite.setAlpha(1);
          else b.world.tweens.add({ targets: chi.sprite, alpha: 1, duration: 400 });
          return;
        }
        const d = Math.hypot(chi.x - h.x, chi.y - h.y);
        if (cstate === "peek") {
          if (h.speed > 60 && d < 300) return hide(t, true);
          if (h.speed < 20 && onScreen(chi.x, chi.y)) {
            still = still || t;
            if (t - still > 1500) {
              cstate = "curious";
              chi.setMood("happy", 999999, t);
              b.fx.sfx("arcadeBeep", 0.3, 1.8);
            }
          } else still = 0;
          if (t - cshown > 14000) hide(t, false);
          return;
        }
        if (h.speed > 300 && d < 160) return hide(t, true);
        if (d > 140 && t > hopAt && h.speed < 20) {
          hopAt = t + 520;
          const k = Math.min(d > 500 ? 120 : 70, d - 120) / d;
          const nx = chi.x + (h.x - chi.x) * k;
          const ny = chi.y + (h.y - chi.y) * k;
          chi.sprite.setDepth(ny);
          if (b.reduced) chi.moveTo(nx, ny);
          else
            b.world.tweens.addCounter({
              from: 0,
              to: 1,
              duration: 260,
              onUpdate: (tw) => {
                const v = tw.getValue() ?? 0;
                chi.moveTo(chi.x + (nx - chi.x) * v, chi.y + (ny - chi.y) * v);
                chi.sprite.y = chi.y - Math.sin(v * Math.PI) * 24;
              },
            });
          b.fx.sfx("blipSoft", 0.2, 2.2);
        }
        if (d > 1300 || (!onScreen(chi.x, chi.y) && d > 600)) hide(t, false);
      });
      b.spot({ id: "chiado", x: 356, y: 1330, r: 200, verb: "Observar", script: "chiado", priority: true, show: () => cstate === "curious", at: () => [chi.x, chi.y + 30] });
      b.act("chiadoHello", async () => {
        b.fx.sfx("arcadeBeep", 0.5, 1.6);
        chi.playSeq(["happy", "surprised", "happy", "happy"], 200, b.world.time.now);
        if (!b.reduced) b.world.tweens.add({ targets: chi.sprite, y: chi.y - 30, duration: 160, yoyo: true, repeat: 1 });
        await b.fx.wait(700);
      });
      b.act("chiadoBye", async () => {
        b.fx.sfx("bars", 0.35, 1.8);
        for (let i = 0; i < 8; i += 1) {
          const sp = b.world.add.image(chi.x, chi.y - 40, "spark").setDepth(5700).setTint(0xc9d4e4);
          const a = (i / 8) * Math.PI * 2;
          b.world.tweens.add({ targets: sp, x: sp.x + Math.cos(a) * 90, y: sp.y + Math.sin(a) * 60, alpha: 0, duration: b.reduced ? 10 : 500, onComplete: () => sp.destroy() });
        }
        hide(b.world.time.now, false);
        await b.fx.wait(400);
      });
    }
    b.act("bridgeBars", async () => {
      const g = b.g(0.27);
      const colors = [0xfbf5e6, 0xffc83d, 0x63d6c1, 0x93cf4c, 0xf06ba8, 0xef4f43, 0x5cb9f0];
      colors.forEach((c, i) => {
        g.fillStyle(c, 0.75);
        g.fillRect(1108 + i * 17, 1092, 17, 96);
      });
      g.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      b.fx.sfx("bars", 0.35, 0.9);
      if (b.reduced) g.setAlpha(1);
      else b.world.tweens.add({ targets: g, alpha: 1, duration: 300, yoyo: true, hold: 900 });
      await b.fx.wait(1600);
      g.destroy();
    });
    const mush = b.prop("mushrooms", 420, 1190, { origin: [0.5, 1], rect: [-44, -16, 104, 16], shadow: 120, react: "bounce" });
    b.act("mushGlow", async () => {
      const gl = b.glow(430, 1150, 260, 200, 0xff8fc4, 0.7, 1191);
      b.fx.sfx("quest", 0.45, 1.25);
      const colors = [0xff8fc4, 0x8ff0d8, 0xffe39a, 0x9fd4ff];
      for (let i = 0; i < 6; i += 1) {
        mush.setTint(colors[i % 4]);
        gl.setTint(colors[i % 4]);
        if (!b.reduced) b.world.tweens.add({ targets: mush, scaleY: { from: 0.86, to: 1 }, duration: 140 });
        await b.fx.wait(160);
      }
      mush.clearTint();
      b.world.tweens.add({ targets: gl, alpha: 0, duration: 300, onComplete: () => gl.destroy() });
    });
    b.prop("mushrooms", 1900, 1300, { origin: [0.5, 1], flip: true, rect: [-60, -16, 104, 16], shadow: 120, react: "bounce" });
    for (const [x, y] of [
      [600, 1420],
      [1900, 1240],
      [2560, 1640],
      [1540, 760],
      [180, 1100],
      [1390, 1180],
      [1060, 1350],
      [800, 1000],
    ] as [number, number][])
      b.prop("fern", x, y, { origin: [0.5, 1], anim: "sway", amp: 1.5, react: "rustle", reactR: 80 });
    for (const [x, y] of [
      [2600, 1270],
      [2010, 1230],
      [1560, 960],
      [960, 960],
      [740, 770],
    ] as [number, number][]) {
      b.prop("lantern-post", x, y, { origin: [0.5, 1], circle: 14, react: "wobble", reactR: 60 });
      const lg = b.glow(x + 50, y - 200, 200, 200, 0xffc46b, 0.4, y + 1);
      const pool = b.glow(x + 20, y + 6, 220, 70, 0xffc46b, 0.22, 1.4);
      let flick = 1;
      b.onUpdate((t) => {
        if (b.reduced) return;
        flick += (0.85 + Math.random() * 0.3 - flick) * 0.2;
        const a = (0.3 + Math.sin(t / 300 + x) * 0.05) * flick;
        lg.setAlpha(a);
        pool.setAlpha(a * 0.6);
      });
    }
    garland(b, [1150, 470], [1560, 450], 60, 4600);
    garland(b, [1940, 480], [2380, 490], 60, 4600);
    for (let i = 0; i < 16; i += 1) {
      const fx = 200 + Math.random() * 2400;
      const fy = 700 + Math.random() * 900;
      const ff = b.glow(fx, fy, 30, 30, 0xd8ff7a, 0.8, 4700);
      let ox = 0;
      let oy = 0;
      b.onUpdate((t, dt) => {
        const bx = fx + Math.sin(t / 1300 + i) * 40;
        const by = fy + Math.cos(t / 1700 + i * 2) * 30;
        const h = b.hero();
        if (h && !b.reduced) {
          const dx = bx + ox - h.x;
          const dy = by + oy - (h.y - 110);
          const d = Math.hypot(dx, dy);
          if (d < 170) {
            ox += (dx / (d || 1)) * 260 * dt;
            oy += (dy / (d || 1)) * 260 * dt;
          }
        }
        ox *= 1 - Math.min(1, dt * 0.4);
        oy *= 1 - Math.min(1, dt * 0.4);
        ff.setPosition(bx + ox, by + oy).setAlpha(b.reduced ? 0.6 : 0.3 + Math.max(0, Math.sin(t / 400 + i * 3)) * 0.6);
      });
    }
    b.spot({ id: "psiu", x: 720, y: 1060, r: 170, verb: "Conversar", script: "psiu" });
    b.spot({ id: "mushrooms", x: 430, y: 1240, r: 100, verb: "Examinar", script: "mushrooms" });
    b.spot({ id: "bridge", x: 1090, y: 1030, r: 100, verb: "Olhar a água", script: "bridge" });
    b.spot({ id: "fall", x: 560, y: 650, r: 200, verb: (st) => (st.items.includes("remote") ? "Pausar a cachoeira" : "Examinar"), script: "fall", show: (st) => !st.flags.fallPaused, hint: "item" });
    b.spot({ id: "door", x: 560, y: 630, r: 160, verb: "Entrar", script: "stationDoor", show: (st) => Boolean(st.flags.fallPaused) });
    b.spot({ id: "booth", x: 2140, y: 1430, r: 100, verb: "Comprar bilhete", script: "booth" });
    const doorGlow = b.glow(560, 450, 240, 320, 0x9df0dc, 0.1, 302.5);
    b.onUpdate((t) => {
      const open = Boolean(b.s.flags.fallPaused);
      const base = open ? 0.22 : 0.05;
      doorGlow.setAlpha(b.reduced ? base : base + Math.max(0, Math.sin(t / 700)) * (open ? 0.16 : 0.05));
    });
    b.act("fallFlicker", async () => {
      const scan = b.vars.fallScan as Phaser.GameObjects.TileSprite;
      b.fx.sfx("bars", 0.35, 0.8);
      for (let i = 0; i < 5; i += 1) {
        scan.setAlpha(i % 2 ? 0 : 0.55);
        await b.fx.wait(80);
      }
      scan.setAlpha(0);
    });
    b.spot({ id: "placardArch", x: 1500, y: 1195, r: 110, verb: "Ler", script: "placardArch" });
    b.spot({ id: "placardStatue", x: 2190, y: 955, r: 110, verb: "Ler", script: "placardStatue" });
    b.spot({ id: "dish", x: 1250, y: 820, r: 130, verb: "Ler", script: "placardDish" });
    b.spot({ id: "treehouse", x: 2480, y: 1010, r: 140, verb: "Examinar", script: "treehouse" });
    b.spot({ id: "poster", x: 2270, y: 1430, r: 120, verb: "Examinar", script: "poster:ghost", hint: "item" });
    b.spot({ id: "log", x: 2200, y: 1530, r: 130, verb: "Examinar", script: "logToken", hint: "secret" });
    b.exit(2756, 1000, 44, 300, "pool", "west");
    b.frame([270, 0, 580, 760], [180, 600, 900, 420]);
    b.frame([0, 0, 2800, 640], [900, 600, 1900, 300]);
    b.arrow(2730, 1150, 0);
    b.spawn("east", 2660, 1150, "s", -1);
    b.spawn("door", 560, 730, "f");
    b.ambient(
      [
        ["bird", 0.6],
        ["cricket", 0.6],
        ["waterfall", 0.5],
      ],
      1800,
      4200,
    );
  },

  station(b) {
    b.size(1920, 1080, 820, 1062);
    b.tiles("station-wall", 0, 0, 1920, 540, 0);
    b.tiles("station-floor", 0, 540, 1920, 540, 0.2);
    const w = b.g(0.5);
    w.fillStyle(0x1d1830, 1);
    w.fillRect(0, 530, 1920, 18);
    w.lineStyle(6, INK, 1);
    w.lineBetween(0, 548, 1920, 548);
    b.prop("station-window", 220, 260, { origin: [0.5, 0.5], depth: "wall" });
    b.prop("monitor-wall", 1000, 290, { origin: [0.5, 0.5], depth: "wall" });
    b.prop("calendar", 1720, 300, { origin: [0.5, 0.5], depth: "wall" });
    b.prop("console", 1000, 770, { origin: [0.5, 1], rect: [-450, -170, 900, 170] });
    b.prop("mug", 1300, 548, { origin: [0.5, 1], depth: 771 });
    b.surface(() => ({ kind: "tile" }));
    const button = b.prop("big-button", 1660, 780, { origin: [0.5, 1], rect: [-110, -90, 220, 90] });
    const buttonGlow = b.glow(1660, 690, 300, 220, 0xef4f43, 0, 781);
    let buttonNear = false;
    b.near(1660, 860, 260, {
      enter: () => {
        buttonNear = true;
        b.fx.sfx("blip", 0.4, 0.7);
        if (!b.reduced) b.world.tweens.add({ targets: button, scaleY: { from: 0.94, to: 1 }, scaleX: { from: 1.04, to: 1 }, duration: 260, ease: "Back.easeOut" });
      },
      leave: () => {
        buttonNear = false;
      },
    });
    b.onUpdate((t) => buttonGlow.setAlpha(buttonNear ? (b.reduced ? 0.35 : 0.22 + Math.max(0, Math.sin(t / 220)) * 0.3) : Math.max(0, buttonGlow.alpha - 0.02)));
    b.prop("tape-deck", 330, 780, { origin: [0.5, 1], rect: [-150, -80, 300, 80], react: "jingle" });
    b.prop("chair", 1000, 920, { origin: [0.5, 1], circle: 40, react: "spin", reactR: 90 });
    const cams = [650, 1000, 1350].map((cx) => {
      const bg = b.world.add.rectangle(0, 0, 292, 168, 0xffc83d, 0.92);
      const src = b.world.textures.get("deco-idle-f").getSourceImage() as HTMLImageElement;
      const k = Math.min(138 / (src.height - 21), 250 / src.width);
      const face = b.world.add.image(0, 84, "deco-idle-f").setOrigin(0.5, 1 - 11 / src.height).setScale(k);
      const tag = b.world.add.text(-136, -78, "AQUI", { fontFamily: b.fonts.display, fontSize: "20px", color: "#1d1830" });
      const live = b.world.add.text(136, -78, "● AO VIVO", { fontFamily: b.fonts.display, fontSize: "18px", color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 5 }).setOrigin(1, 0);
      const scan = b.world.add.tileSprite(0, 0, 292, 168, "scanlines").setAlpha(0.35);
      const noise = b.world.add.tileSprite(0, 0, 292, 168, "static").setAlpha(0);
      const cont = b.world.add.container(cx, 403, [bg, face, tag, live, scan, noise]).setDepth(2.45).setAlpha(0);
      return { cont, face, noise, cx, on: false, until: 0 };
    });
    b.onUpdate((t) => {
      const h = b.hero();
      const busy = Boolean(b.vars.feeds);
      for (const c of cams) {
        const want = !busy && Boolean(h) && Math.abs((h?.x ?? -9999) - c.cx) < 175;
        if (want && !c.on) {
          c.on = true;
          c.until = t + 260;
          b.fx.sfx("bars", 0.12, 1.9);
        }
        if (!want && c.on) c.on = false;
        const target = c.on ? 1 : 0;
        c.cont.setAlpha(c.cont.alpha + (target - c.cont.alpha) * 0.2);
        c.noise.setAlpha(t < c.until ? 0.85 : 0).setTilePosition(Math.random() * 200, Math.random() * 200);
        if (h && c.on) c.face.setFlipX(h.x < c.cx);
      }
    });
    b.prop("cables", 440, 1000, { origin: [0.5, 0.5], depth: "floor" });
    b.glow(1000, 300, 1200, 600, 0x5cf0ff, 0.12, 0.6);
    b.spot({ id: "console", x: 1000, y: 830, r: 220, verb: (st) => (st.items.includes("order") ? "Entregar a ordem" : "Examinar"), script: "console" });
    b.spot({ id: "button", x: 1660, y: 840, r: 140, verb: "Examinar", script: "button" });
    b.spot({ id: "calendar", x: 1720, y: 840, r: 90, verb: "Examinar", script: "calendar" });
    b.spot({ id: "monitors", x: 760, y: 840, r: 110, verb: "Olhar as telas", script: "monitors" });
    b.spot({ id: "tape", x: 330, y: 840, r: 150, verb: "Examinar", script: "tape" });
    b.spot({ id: "mug", x: 1320, y: 840, r: 100, verb: "Examinar", script: "mug" });
    b.spot({ id: "window", x: 220, y: 900, r: 90, verb: "Olhar", script: "stationWindow" });
    b.exit(840, 1040, 240, 40, "forest", "door");
    b.glow(960, 1080, 460, 140, 0xbff7ff, 0.35, 0.45);
    b.prop("doormat", 960, 1082, { origin: [0.5, 1], depth: "floor", scale: 0.8 });
    b.arrow(960, 1030, 90);
    b.spawn("door", 960, 990, "k");
    b.ambient(
      [
        ["hum", 0.6],
        ["arcadeBeep", 0.3],
      ],
      1600,
      3200,
    );
  },

  room404(b) {
    b.size(1920, 1080, 760, 1062);
    b.tiles("room-wall", 0, 0, 1920, 500, 0);
    b.tiles("room-floor", 0, 500, 1920, 580, 0.2);
    const w = b.g(0.5);
    w.fillStyle(0x9c5f37, 1);
    w.fillRect(0, 484, 1920, 22);
    w.lineStyle(6, INK, 1);
    w.lineBetween(0, 506, 1920, 506);
    b.prop("lobby-window-b", 330, 470, { origin: [0.5, 1], depth: "wall" });
    b.prop("frame-cat", 1520, 220, { origin: [0.5, 0.5], depth: "wall", angle: 5 });
    b.prop("frame-sunset", 1130, 210, { origin: [0.5, 0.5], depth: "wall", angle: -4 });
    b.prop("rug-lobby", 960, 960, { origin: [0.5, 0.5], depth: "floor", scale: 0.62 });
    b.prop("bed", 900, 840, { origin: [0.5, 1], rect: [-280, -330, 560, 330] });
    b.prop("nightstand", 1340, 800, { origin: [0.5, 1], rect: [-74, -50, 148, 50], react: "wobble" });
    b.prop("cartridge", 1340, 664, { origin: [0.5, 1], depth: 801, show: (st) => !st.items.includes("cartridge") });
    b.prop("tv-lobby", 1680, 800, { origin: [0.5, 1], rect: [-110, -70, 220, 70] });
    const tv = b.world.add.tileSprite(1680 - 120 + 50, 800 - 250 + 48, 112, 94, "static").setOrigin(0, 0).setDepth(801).setAlpha(0.9);
    b.onUpdate(() => tv.setTilePosition(Math.random() * 200, Math.random() * 200));
    b.prop("suitcases", 230, 860, { origin: [0.5, 1], rect: [-96, -70, 192, 70], react: "jingle" });
    const sleeper = b.npc("mascot", 700, 640, { scale: 0.48, depth: 841, noShadow: true, frames: { normal: "sleep", look: "sleep", talk: "sleep" } });
    b.vars.sleeper = sleeper;
    const zz = b.world.add.text(760, 560, "z", { fontFamily: b.fonts.display, fontSize: "44px", color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 6 }).setDepth(842);
    b.vars.zz = zz;
    const mumbles = ["...só mais cinco anos...", "zzz... canal 404... zzz", "...não troca de canal...", "...ninguém aperta o botão..."];
    let mumble = 0;
    b.near(700, 900, 320, {
      cooldown: 14000,
      minSpeed: 120,
      enter: (t) => {
        const m = b.npcOf("mascot");
        if (!m || m !== sleeper || !m.sprite.visible) return;
        mumble = (mumble + 1) % mumbles.length;
        b.bark("mascot", mumbles[mumble], "snore");
        if (!b.reduced) b.world.tweens.add({ targets: m.sprite, angle: { from: -3, to: 3 }, duration: 120, yoyo: true, repeat: 2, onComplete: () => m.sprite.setAngle(0) });
        zz.setAlpha(0);
        void t;
      },
    });
    b.blocker((x, y) => {
      const m = b.npcOf("mascot");
      return Boolean(m && m !== sleeper && m.sprite.visible && Math.hypot(x - m.x, (y - m.y) * 1.4) < 52);
    });
    b.onUpdate((t) => {
      const k = (t % 1800) / 1800;
      zz.setPosition(760 + Math.sin(k * 6) * 10, 560 - k * 80).setAlpha(sleeper?.sprite.visible ? 1 - k : 0).setScale(0.6 + k * 0.8);
    });
    b.spot({ id: "mascot", x: 760, y: 900, r: 200, verb: "Conversar", script: "mascot" });
    b.spot({ id: "cartridge", x: 1340, y: 860, r: 120, verb: "Pegar", script: "cartridge", show: (st) => !st.items.includes("cartridge"), hint: "secret" });
    b.spot({ id: "tv", x: 1680, y: 860, r: 120, verb: "Examinar", script: "tv404" });
    b.exit(840, 1040, 240, 40, "lobby", "door404");
    b.glow(960, 1080, 460, 140, 0xfff1c0, 0.35, 0.45);
    b.prop("doormat", 960, 1082, { origin: [0.5, 1], depth: "floor", scale: 0.8 });
    b.arrow(960, 1030, 90);
    b.spawn("door", 960, 990, "k");
    b.ambient([["snore", 0.6]], 2400, 3600);
  },
};
