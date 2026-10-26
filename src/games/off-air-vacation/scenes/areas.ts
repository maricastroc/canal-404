import * as Phaser from "phaser";
import type { AreaId, Dir } from "../config";
import type { FolkKey, State } from "../save";
import type { ResortSfx } from "../sounds";
import type { Mood } from "../story";
import type { Npc, NpcOpts } from "./npc";

export type Show = (s: State) => boolean;
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
  kickable(key: string, x: number, y: number): void;
  arrow(x: number, y: number, angle: number): void;
  frame(rect: [number, number, number, number], zone: [number, number, number, number]): void;
  act(name: string, fn: () => Promise<void> | void): void;
  bark(who: FolkKey, text: string, sound?: ResortSfx | null): void;
  greet(who: FolkKey, lines: string[], r?: number): void;
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
    b.prop("frame-sunset", 830, 170, { origin: [0.5, 0.5], angle: -7, depth: "wall" });
    b.prop("frame-tv", 990, 168, { origin: [0.5, 0.5], angle: 8, depth: "wall" });
    b.prop("key-rack", 1200, 176, { origin: [0.5, 0.5], depth: "wall" });
    b.prop("clock", 1520, 166, { origin: [0.5, 0.5], depth: "wall" });
    b.prop("elevator", 1960, 432, { origin: [0.5, 1], depth: "wall" });
    b.prop("poster-club", 2262, 200, { origin: [0.5, 0.5], depth: "wall" });
    b.glow(1200, 660, 1100, 520, 0xffd36b, 0.2, 0.4);
    b.npc("bigodes", 1200, 522, { scale: 0.95, depth: 520 });
    b.greet("bigodes", ["Pois não?", "Tudo absolutamente normal."], 360);
    b.prop("counter", 1200, 650, { origin: [0.5, 1], depth: 650, rect: [-380, -112, 760, 112] });
    b.prop("desk-bell", 1360, 470, { origin: [0.5, 1], depth: 651 });
    b.prop("chandelier", 1200, -4, { origin: [0.5, 0], depth: "over", anim: "swing", amp: 1.6 });
    b.glow(1200, 220, 420, 260, 0xffe39a, 0.35, 4999);
    b.prop("rug-lobby", 1200, 940, { origin: [0.5, 0.5], depth: "floor" });
    b.prop("doormat", 1200, 1246, { origin: [0.5, 1], depth: "floor" });
    b.prop("sofa", 520, 880, { origin: [0.5, 1], rect: [-176, -86, 352, 86] });
    b.prop("plant-tall", 330, 670, { origin: [0.5, 1], rect: [-52, -40, 104, 40], anim: "sway", amp: 1.5 });
    b.prop("plant-tall", 2100, 690, { origin: [0.5, 1], rect: [-52, -40, 104, 40], anim: "sway", amp: 1.5, flip: true });
    b.prop("plant-small", 880, 760, { origin: [0.5, 1], rect: [-40, -28, 80, 28] });
    b.prop("plant-small", 1530, 760, { origin: [0.5, 1], rect: [-40, -28, 80, 28], flip: true });
    b.prop("suitcases", 1660, 820, { origin: [0.5, 1], rect: [-96, -70, 192, 70] });
    b.prop("tv-lobby", 1880, 700, { origin: [0.5, 1], rect: [-110, -70, 220, 70] });
    const tv = b.world.add.tileSprite(1880 - 120 + 46 + 4, 700 - 250 + 44 + 4, 112, 94, "static").setOrigin(0, 0).setDepth(701).setAlpha(0.9);
    b.onUpdate(() => tv.setTilePosition(Math.random() * 200, Math.random() * 200));
    b.prop("luggage-cart", 260, 1110, { origin: [0.5, 1], rect: [-100, -50, 200, 50] });
    b.spot({ id: "bigodes", x: 1200, y: 700, r: 200, verb: "Conversar", script: "bigodes" });
    b.spot({ id: "bell", x: 1380, y: 700, r: 90, verb: "Tocar", script: "bell" });
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
    b.onUpdate((t) => duck.setY(1250 + Math.sin(t / 600) * 4).setAngle(Math.sin(t / 800) * 6));
    b.prop("lifeguard-chair", 790, 1500, { origin: [0.5, 1], rect: [-90, -44, 180, 44], shadow: 150 });
    b.npc("marola", 790, 1292, {
      scale: 0.78,
      depth: 1501,
      noShadow: true,
      frames: s.flags.whistleReturned ? { normal: "normal", talk: "talk-w", look: "look-w", happy: "happy", sad: "normal", surprised: "talk-w" } : undefined,
    });
    b.prop("umbrella-a", 1110, 1760, { origin: [0.5, 1], anim: "sway", amp: 1, circle: 18, shadow: 70 });
    b.prop("umbrella-b", 1720, 1760, { origin: [0.5, 1], anim: "sway", amp: 1, circle: 18, shadow: 70 });
    b.prop("lounge-a", 960, 1800, { origin: [0.5, 1], rect: [-92, -54, 184, 54] });
    const towel = b.prop("towel", 960, 1768, { origin: [0.5, 1], depth: 1801, scale: 0.8 });
    b.prop("lounge-b", 1260, 1810, { origin: [0.5, 1], rect: [-92, -54, 184, 54] });
    b.prop("lounge-a", 1860, 1800, { origin: [0.5, 1], flip: true, rect: [-92, -54, 184, 54] });
    b.kickable("beachball", 1500, 1680);
    for (const [x, y, k, flip] of [
      [236, 1060, "palm", false],
      [2570, 1880, "palm", true],
      [2200, 1880, "palm-b", false],
    ] as [number, number, string, boolean][]) {
      b.prop(k, x, y, { origin: [0.5, 1], flip, anim: "sway", amp: 2, circle: 30, shadow: 120 });
    }
    b.prop("juice-bar", 380, 1740, { origin: [0.5, 1], rect: [-255, -150, 510, 150], shadow: 540 });
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
    b.prop("shed", 2480, 1300, { origin: [0.5, 1], rect: [-160, -110, 320, 110] });
    b.prop("poster-summer", 2346, 1140, { origin: [0.5, 0.5], scale: 0.4, depth: 1301 });
    b.prop("net-pole", 2710, 1300, { origin: [0.5, 1], circle: 12, show: (st) => !st.items.includes("net") });
    b.prop("signpost", 560, 1150, { origin: [0.5, 1], circle: 22, shadow: 60 });
    b.prop("hedge", 200, 890, { origin: [0.5, 1], rect: [-140, -60, 280, 60] });
    b.prop("hibiscus", 1817, 880, { origin: [0.5, 1], rect: [-40, -50, 80, 50], scale: 0.5 });
    b.prop("hibiscus", 2620, 1440, { origin: [0.5, 1], rect: [-120, -60, 240, 60] });
    b.prop("hedge", 2620, 1958, { origin: [0.5, 1], rect: [-140, -60, 280, 60] });
    b.prop("hedge", 400, 1958, { origin: [0.5, 1], rect: [-140, -60, 280, 60] });
    b.prop("hibiscus", 1000, 1958, { origin: [0.5, 1], rect: [-120, -60, 240, 60] });
    b.prop("hibiscus", 2700, 1000, { origin: [0.5, 1], rect: [-80, -40, 160, 40], scale: 0.65 });
    b.npc("lento", 2300, 1800, { scale: 0.8, show: (st) => Boolean(st.flags.ended), frames: { normal: "walk-a-nokey", look: "walk-b-nokey", talk: "talk-nokey", happy: "happy-nokey", surprised: "happy-nokey" } });
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
    let edgeAt = 0;
    b.onUpdate((t) => {
      const h = b.hero();
      if (!h || h.busy || t < edgeAt || h.speed < 330) return;
      const nearRim = h.x > 860 && h.x < 1640 && h.y > 1130 && h.y < 1610;
      if (!nearRim) return;
      edgeAt = t + 9000;
      b.npcOf("marola")?.setMood(b.s.flags.whistleReturned ? "happy" : "look", 1200, t);
      if (b.s.flags.whistleReturned) b.fx.sfx("whistle", 0.7);
      b.bark("marola", b.s.flags.whistleReturned ? "SEM CORRER NA BORDA!" : "Ei! Devagar aí!");
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
    b.spawn("hotel", 1200, 880, "f");
    b.spawn("arcade", 2250, 880, "f");
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
      ["cab-a", 220, "cabA"],
      ["cab-b", 400, "cabB"],
      ["cab-c", 580, "cabC"],
      ["cab-d", 1220, "cabD"],
    ];
    const colors = [0xff7ad9, 0x5cf0ff, 0x7dffb2, 0xc9d4e4];
    const screens = new Map<string, Phaser.GameObjects.Graphics>();
    const bursts = new Map<string, number>();
    cabs.forEach(([key, x, script], idx) => {
      b.prop(key, x, 530, { origin: [0.5, 1] });
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
      b.spot({ id: script, x, y: 610, r: 100, verb: idx === 3 ? "Examinar" : "Jogar", script });
      b.act(`burst:${script}`, async () => {
        bursts.set(script, b.world.time.now + 500);
        for (let i = 0; i < 3; i += 1) {
          b.fx.sfx(i % 2 ? "arcadeBoop" : "arcadeBeep", 0.6, 1 + i * 0.25);
          await b.fx.wait(140);
        }
      });
    });
    const msgBox = b.world.add.text(1220, 338, "", { fontFamily: "Courier New, monospace", fontSize: "13px", fontStyle: "bold", color: "#7dffb2", align: "center", wordWrap: { width: 92 } }).setOrigin(0.5).setDepth(532);
    b.act("brokenScreen", async () => {
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
    });
    const records = b.prop("records", 300, 112, { origin: [0.5, 0.5], depth: "wall", scale: 0.9 });
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
    b.prop("claw", 1410, 530, { origin: [0.5, 1] });
    b.spot({ id: "claw", x: 1410, y: 610, r: 100, verb: "Jogar", script: "claw" });
    b.block(110, 470, 1880, 70);
    b.npc("tilt", 1000, 548, { scale: 0.95, depth: 548, bob: 0.008 });
    b.greet("tilt", b.s.flags.tiltWon ? ["Jogador número 1!", "Meus pixels ainda tremem!"] : ["Psst! Jogador!", "Não olhe pra mim. Olhe. Não olhe."], 280);
    b.glow(1000, 600, 320, 120, 0x7dffb2, 0.25, 0.6);
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
    b.prop("pinball", 500, 900, { origin: [0.5, 1], rect: [-110, -70, 220, 70] });
    b.spot({ id: "pinball", x: 500, y: 950, r: 130, verb: "Jogar", script: "pinball" });
    b.prop("air-hockey", 1000, 960, { origin: [0.5, 1], rect: [-140, -70, 280, 70] });
    b.spot({ id: "hockey", x: 1000, y: 1010, r: 140, verb: "Jogar", script: "hockey" });
    b.prop("stool", 300, 760, { origin: [0.5, 1], circle: 18 });
    b.prop("stool", 620, 790, { origin: [0.5, 1], circle: 18 });
    b.prop("stool", 1300, 760, { origin: [0.5, 1], circle: 18 });
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
    const sea = b.world.add.tileSprite(0, 160, 3000, 480, "sea-tile").setOrigin(0, 0).setDepth(0.1);
    b.tiles("sand", 0, 600, 3000, 900, 0.15);
    const shore = b.g(0.3);
    const notch = b.g(0.32);
    b.vars.notch = notch;
    const drawShore = (t: number) => {
      const paused = Boolean(b.vars.seaPaused || b.vars.seaFrozen);
      const p = paused ? 0.7 : (Math.sin((t / 7000) * Math.PI * 2) + 1) / 2;
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
    b.blocker((x, y) => {
      if (y >= 640) return false;
      if (x > 2318 && x < 2482 && y > 230) return false;
      if (b.vars.seaPaused && x > 1090 && x < 1410 && y > 470) return false;
      return true;
    });
    b.prop("pier", 2400, 770, { origin: [0.5, 1], depth: 0.35 });
    b.prop("bottle", 1250, 540, { origin: [0.5, 1], depth: 541, show: (st) => Boolean(st.flags.seaPaused && !st.flags.gotOrder) });
    b.prop("wave-sign", 1050, 720, { origin: [0.5, 1], circle: 18 });
    b.prop("kiosk", 1960, 930, { origin: [0.5, 1], rect: [-262, -170, 524, 170], shadow: 560 });
    b.prop("poster-surf", 1752, 800, { origin: [0.5, 0.5], scale: 0.42, depth: 931 });
    const boards = [
      b.prop("surf-a", 2600, 940, { origin: [0.5, 1], angle: -6 }),
      b.prop("surf-b", 2670, 950, { origin: [0.5, 1], angle: 4 }),
      b.prop("surf-c", 2740, 940, { origin: [0.5, 1], angle: -3 }),
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
    b.prop("umbrella-b", 1330, 990, { origin: [0.5, 1], circle: 18, anim: "sway", amp: 1, shadow: 70 });
    b.prop("deckchair", 1420, 1040, { origin: [0.5, 1], rect: [-70, -40, 140, 40] });
    const marisa = b.npc("marisa", 1570, 1030, { scale: 0.85 });
    b.prop("chips", 1452, 1000, { origin: [0.5, 1], depth: 1042, scale: 0.8 });
    b.greet("marisa", ["Olha a distância!", "Tô de férias. Não incomode."], 260);
    let guardAt = 0;
    const guard = async (t: number) => {
      guardAt = t + 6000;
      marisa?.playSeq(["happy", "talk", "happy", "normal"], 180, t);
      b.fx.sfx("gull", 0.7);
      b.bark("marisa", "Minhas batatinhas!", null);
      if (marisa && !b.reduced) b.world.tweens.add({ targets: marisa.sprite, y: marisa.y - 26, duration: 140, yoyo: true, repeat: 1, ease: "Quad.easeOut" });
    };
    b.onUpdate((t) => {
      const h = b.hero();
      if (!h || h.busy || t < guardAt) return;
      if (Math.hypot(h.x - 1452, (h.y - 1060) * 1.2) < 130) void guard(t);
    });
    b.act("marisaGuard", () => guard(b.world.time.now));
    const clique = b.npc("clique", 880, 830, { scale: 0.82 });
    b.circleBlock(880, 824, 34);
    b.greet("clique", ["Shh! A onda tá vindo!", "Sorria! Não, você não."], 280);
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
      const txt = b.world.add.text(0, 62, "4:04", { fontFamily: "Arial Black, Arial, sans-serif", fontSize: "22px", color: "#1d1830" }).setOrigin(0.5);
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
    b.prop("shell-big", 650, 860, { origin: [0.5, 1], circle: 30 });
    b.prop("shells", 900, 1320, { origin: [0.5, 1], depth: "floor" });
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
      b.prop(k, x, y, { origin: [0.5, 1], flip, anim: "sway", amp: 2, circle: 30, shadow: 120 });
    }
    b.prop("umbrella-a", 700, 1200, { origin: [0.5, 1], circle: 18, anim: "sway", amp: 1, shadow: 70 });
    b.prop("lounge-a", 790, 1250, { origin: [0.5, 1], rect: [-92, -54, 184, 54] });
    for (let i = 0; i < 2; i += 1) {
      const crab = b.world.add.image(900 + i * 900, 1150 + i * 120, "crab-a").setOrigin(0.5, 1);
      let x = crab.x;
      let dir = i ? -1 : 1;
      b.onUpdate((t, dt) => {
        x += dir * 60 * dt;
        if (x > 1500 + i * 700) dir = -1;
        if (x < 700 + i * 700) dir = 1;
        crab.setX(x).setDepth(crab.y).setTexture(Math.floor(t / 160) % 2 ? "crab-a" : "crab-b");
      });
    }
    const lento = b.npc("lento", 2500, 1330, { scale: 0.8, show: (st) => Boolean(st.flags.whistleReturned && !st.flags.ended), frames: s.flags.gotKey ? { normal: "walk-a-nokey", look: "walk-b-nokey", talk: "talk-nokey", happy: "happy-nokey", surprised: "happy-nokey" } : undefined });
    if (lento) {
      b.vars.lento = lento;
      let lx = 2500;
      let ld = -1;
      b.onUpdate((t, dt) => {
        if (b.vars.lentoTalking) return;
        lx += ld * 9 * dt;
        if (lx < 500) ld = 1;
        if (lx > 2600) ld = -1;
        lento.moveTo(lx, 1330);
        lento.sprite.setFlipX(ld > 0);
        if (!lento.sprite.texture.key.includes("talk")) lento.sprite.setTexture(`lento-${Math.floor(t / 700) % 2 ? "walk-a" : "walk-b"}${b.s.flags.gotKey ? "-nokey" : ""}`);
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
    b.exit(0, 1000, 44, 420, "pool", "east");
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
    band(ground, [[2800, 1150], [2400, 1180], [2000, 1090], [1650, 1020], [1300, 1040], [1050, 1010], [820, 880], [600, 690]], 150, 0xb8895a, INK, 0xd4a774);
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
    b.blocker((x, y) => {
      if (x > 850 && x < 1330 && y > 985 && y < 1070) return false;
      for (let i = 0; i < stream.length; i += 2) {
        const p = stream[i];
        if (Math.abs(p.x - x) < 64 && Math.abs(p.y - y) < 40) return true;
      }
      return false;
    });
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
    for (const [k, x, y, flip] of trees) b.prop(k, x, y, { origin: [0.5, 1], flip, rect: [-44, -26, 88, 26], anim: "sway", amp: 0.8 });
    b.prop("treehouse", 2480, 980, { origin: [0.5, 1] });
    b.block(2390, 950, 50, 30);
    b.block(2530, 950, 50, 30);
    b.prop("ruin-arch", 1650, 1062, { origin: [0.5, 1] });
    b.block(1474, 1036, 34, 26);
    b.block(1794, 1036, 34, 26);
    b.prop("placard", 1500, 1160, { origin: [0.5, 1], circle: 16 });
    b.prop("statue-404", 2050, 840, { origin: [0.5, 1], rect: [-100, -44, 200, 44] });
    b.prop("placard", 2190, 920, { origin: [0.5, 1], circle: 16 });
    const dish = b.prop("dish", 1250, 780, { origin: [0.5, 1], rect: [-70, -30, 140, 30] });
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
    b.prop("ticket-booth", 2270, 1380, { origin: [0.5, 1], rect: [-140, -84, 280, 84], shadow: 300 });
    b.prop("poster-ghost", 2270, 1184, { origin: [0.5, 0.5], scale: 0.5, depth: 1381 });
    b.prop("log", 2200, 1490, { origin: [0.5, 1], rect: [-110, -50, 220, 50] });
    b.prop("stump", 720, 1010, { origin: [0.5, 1], rect: [-66, -40, 132, 40] });
    b.npc("psiu", 720, 952, { scale: 0.8, depth: 1011, noShadow: true });
    b.greet("psiu", ["Psiu.", "...psiu?"], 240);
    const cav = b.npc("cavuca", 1980, 1160, { scale: 0.78 });
    if (cav) {
      let ang = 1.2;
      let stepAt = 0;
      let foot = 0;
      b.onUpdate((t, dt) => {
        if (b.vars.talking === "cavuca") return;
        ang += dt * 0.22;
        const nx = 1980 + Math.cos(ang) * 140;
        const ny = 1118 + Math.sin(ang) * 46;
        cav.sprite.setFlipX(-Math.sin(ang) < 0);
        cav.moveTo(nx, ny);
        if (t > stepAt && !cav.busy) {
          stepAt = t + 340;
          foot = 1 - foot;
          cav.sprite.setTexture(foot ? "cavuca-walk-b" : "cavuca-walk-a");
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
    ];
    const chi = b.npc("chiado", 356, 1330, { scale: 0.62, noShadow: true });
    let cstate: "hidden" | "peek" | "curious" = "hidden";
    let cnext = 2500;
    let cshown = 0;
    let still = 0;
    let hopAt = 0;
    const hide = (t: number, flee: boolean) => {
      if (!chi) return;
      cstate = "hidden";
      cnext = t + 6000 + Math.random() * 4000;
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
          const opts = peeks.filter(([x, y]) => Math.hypot(x - h.x, y - h.y) > 480 && Math.hypot(x - h.x, y - h.y) < 1300);
          if (!opts.length) {
            cnext = t + 2000;
            return;
          }
          const [px, py] = opts[Math.floor(Math.random() * opts.length)];
          chi.moveTo(px, py);
          chi.sprite.setDepth(py - 12);
          chi.setMood("look", 0, 0);
          cstate = "peek";
          cshown = t;
          still = 0;
          b.fx.sfx("blipSoft", 0.2, 1.8);
          if (b.reduced) chi.sprite.setAlpha(1);
          else b.world.tweens.add({ targets: chi.sprite, alpha: 1, duration: 400 });
          return;
        }
        const d = Math.hypot(chi.x - h.x, chi.y - h.y);
        if (cstate === "peek") {
          if (h.speed > 60 && d < 320) return hide(t, true);
          if (h.speed < 20 && d < 560) {
            still = still || t;
            if (t - still > 2000) {
              cstate = "curious";
              chi.setMood("happy", 999999, t);
              b.fx.sfx("arcadeBeep", 0.3, 1.8);
            }
          } else still = 0;
          if (t - cshown > 9000) hide(t, false);
          return;
        }
        if (h.speed > 300 && d < 160) return hide(t, true);
        if (d > 190 && t > hopAt && h.speed < 20) {
          hopAt = t + 650;
          const k = Math.min(70, d - 170) / d;
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
        if (d > 700) hide(t, false);
      });
      b.spot({ id: "chiado", x: 356, y: 1330, r: 200, verb: "Observar", script: "chiado", show: () => cstate === "curious", at: () => [chi.x, chi.y + 30] });
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
    const mush = b.prop("mushrooms", 420, 1190, { origin: [0.5, 1], rect: [-44, -16, 104, 16], shadow: 120 });
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
    b.prop("mushrooms", 1900, 1300, { origin: [0.5, 1], flip: true, rect: [-60, -16, 104, 16], shadow: 120 });
    for (const [x, y] of [
      [600, 1420],
      [1900, 1240],
      [2560, 1640],
      [1540, 760],
      [180, 1100],
    ] as [number, number][])
      b.prop("fern", x, y, { origin: [0.5, 1], anim: "sway", amp: 1.5 });
    for (const [x, y] of [
      [2600, 1270],
      [2010, 1230],
      [1560, 960],
      [960, 960],
      [740, 770],
    ] as [number, number][]) {
      b.prop("lantern-post", x, y, { origin: [0.5, 1], circle: 14 });
      const lg = b.glow(x + 50, y - 200, 200, 200, 0xffc46b, 0.4, y + 1);
      b.onUpdate((t) => lg.setAlpha(b.reduced ? 0.4 : 0.32 + Math.sin(t / 300 + x) * 0.06));
    }
    garland(b, [1150, 470], [1560, 450], 60, 4600);
    garland(b, [1940, 480], [2380, 490], 60, 4600);
    for (let i = 0; i < 16; i += 1) {
      const fx = 200 + Math.random() * 2400;
      const fy = 700 + Math.random() * 900;
      const ff = b.glow(fx, fy, 30, 30, 0xd8ff7a, 0.8, 4700);
      b.onUpdate((t) => ff.setPosition(fx + Math.sin(t / 1300 + i) * 40, fy + Math.cos(t / 1700 + i * 2) * 30).setAlpha(b.reduced ? 0.6 : 0.3 + Math.max(0, Math.sin(t / 400 + i * 3)) * 0.6));
    }
    b.spot({ id: "psiu", x: 720, y: 1060, r: 170, verb: "Conversar", script: "psiu" });
    b.spot({ id: "mushrooms", x: 430, y: 1240, r: 100, verb: "Examinar", script: "mushrooms" });
    b.spot({ id: "bridge", x: 1090, y: 1030, r: 100, verb: "Olhar a água", script: "bridge" });
    b.spot({ id: "fall", x: 560, y: 650, r: 200, verb: (st) => (st.items.includes("remote") ? "Pausar a cachoeira" : "Examinar"), script: "fall", show: (st) => !st.flags.fallPaused, hint: "item" });
    b.spot({ id: "door", x: 560, y: 630, r: 160, verb: "Entrar", script: "stationDoor", show: (st) => Boolean(st.flags.fallPaused) });
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
    b.prop("big-button", 1660, 780, { origin: [0.5, 1], rect: [-110, -90, 220, 90] });
    b.prop("tape-deck", 330, 780, { origin: [0.5, 1], rect: [-150, -80, 300, 80] });
    b.prop("chair", 1000, 920, { origin: [0.5, 1], circle: 40 });
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
    b.prop("nightstand", 1340, 800, { origin: [0.5, 1], rect: [-74, -50, 148, 50] });
    b.prop("cartridge", 1340, 664, { origin: [0.5, 1], depth: 801, show: (st) => !st.items.includes("cartridge") });
    b.prop("tv-lobby", 1680, 800, { origin: [0.5, 1], rect: [-110, -70, 220, 70] });
    const tv = b.world.add.tileSprite(1680 - 120 + 50, 800 - 250 + 48, 112, 94, "static").setOrigin(0, 0).setDepth(801).setAlpha(0.9);
    b.onUpdate(() => tv.setTilePosition(Math.random() * 200, Math.random() * 200));
    b.prop("suitcases", 230, 860, { origin: [0.5, 1], rect: [-96, -70, 192, 70] });
    const sleeper = b.npc("mascot", 700, 640, { scale: 0.48, depth: 841, noShadow: true, frames: { normal: "sleep", look: "sleep", talk: "sleep" } });
    b.vars.sleeper = sleeper;
    const zz = b.world.add.text(760, 560, "z", { fontFamily: "Arial Black, Arial, sans-serif", fontSize: "40px", color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 6 }).setDepth(842);
    b.vars.zz = zz;
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
