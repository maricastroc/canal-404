import * as Phaser from "phaser";
import type { ResortSfx } from "../sounds";
import type { Builder } from "./areas";
import { barkBubble } from "./npc";

type Rect4 = [number, number, number, number];

export type CritterDef = {
  frames: [string, string];
  x: number;
  y: number;
  bounds: Rect4;
  mode: "walk" | "hop" | "swim" | "flutter";
  react: "flee" | "fly" | "dive" | "hop" | "follow";
  r: number;
  scale?: number;
  depth?: number;
  alpha?: number;
  speed?: number;
  sound?: [ResortSfx, number, number];
  away?: [number, number];
  faceLeft?: boolean;
  water?: (x: number, y: number) => boolean;
  rest?: string;
  flyFrames?: [string, string];
};

type Hero = { x: number; y: number; speed: number; busy: boolean };

export function critter(b: Builder, def: CritterDef) {
  const scene = b.world;
  const scale = def.scale ?? 0.5;
  const [x0, y0, x1, y1] = def.bounds;
  const img = scene.add.image(def.x, def.y, def.frames[0]).setOrigin(0.5, def.mode === "swim" || def.mode === "flutter" ? 0.5 : 1).setScale(scale);
  if (def.alpha !== undefined) img.setAlpha(def.alpha);
  const baseAlpha = img.alpha;
  const shadow = def.mode === "walk" || def.mode === "hop" ? scene.add.image(def.x, def.y + 2, "blob").setDisplaySize(70 * scale * 2, 18).setAlpha(0.3) : null;
  let x = def.x;
  let y = def.y;
  let tx = x;
  let ty = y;
  let state: "idle" | "move" | "react" | "away" = "idle";
  let until = 1000 + Math.random() * 2000;
  let vx = 0;
  let vy = 0;
  let hopping = false;
  const speed = def.speed ?? 60;
  const depthOf = () => def.depth ?? y;
  const place = () => {
    img.setPosition(x, y).setDepth(depthOf());
    shadow?.setPosition(x, y + 2).setDepth(depthOf() - 1);
  };
  const face = (dx: number) => {
    if (Math.abs(dx) > 2) img.setFlipX(def.faceLeft ? dx > 0 : dx < 0);
  };
  const pick = () => {
    tx = x0 + Math.random() * (x1 - x0);
    ty = y0 + Math.random() * (y1 - y0);
  };
  const vanish = (t: number) => {
    state = "away";
    until = t + (def.away?.[0] ?? 6000) + Math.random() * ((def.away?.[1] ?? 9000) - (def.away?.[0] ?? 6000));
    shadow?.setVisible(false);
    if (b.reduced) img.setVisible(false);
    else scene.tweens.add({ targets: img, alpha: 0, scaleY: scale * 0.2, duration: 220, onComplete: () => img.setVisible(false) });
  };
  const appear = () => {
    pick();
    x = tx;
    y = ty;
    place();
    state = "idle";
    img.setVisible(true).setAlpha(baseAlpha).setScale(scale);
    shadow?.setVisible(true);
    if (!b.reduced) scene.tweens.add({ targets: img, scaleY: { from: scale * 0.2, to: scale }, alpha: { from: 0, to: baseAlpha }, duration: 260, ease: "Back.easeOut" });
  };
  const hop = (nx: number, ny: number, ms: number, done?: () => void) => {
    hopping = true;
    img.setTexture(def.frames[1]);
    face(nx - x);
    const sx = x;
    const sy = y;
    const lift = Math.min(120, Math.hypot(nx - sx, ny - sy) * 0.5 + 30);
    if (b.reduced) {
      x = nx;
      y = ny;
      place();
      hopping = false;
      img.setTexture(def.frames[0]);
      done?.();
      return;
    }
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: ms,
      ease: "Sine.easeInOut",
      onUpdate: (tw) => {
        const k = tw.getValue() ?? 0;
        x = sx + (nx - sx) * k;
        y = sy + (ny - sy) * k;
        place();
        img.setY(y - Math.sin(k * Math.PI) * lift);
      },
      onComplete: () => {
        hopping = false;
        img.setTexture(def.frames[0]);
        done?.();
      },
    });
  };
  const sound = (pitch = 1) => {
    if (def.sound) b.fx.sfx(def.sound[0], def.sound[1], def.sound[2] * pitch);
  };
  place();
  b.onUpdate((t, dt) => {
    const h = b.hero();
    if (state === "away") {
      if (t < until) return;
      if (h && Math.hypot(h.x - (x0 + x1) / 2, h.y - (y0 + y1) / 2) < Math.max(x1 - x0, 500) * 0.6) {
        until = t + 1500;
        return;
      }
      appear();
      return;
    }
    const near = h && !h.busy && Math.hypot(h.x - x, (h.y - y) * 1.3) < def.r && (def.react === "follow" || h.speed > 40);
    if (state !== "react" && near && h) startReact(t, h);
    if (state === "react") {
      stepReact(t, dt, h);
      return;
    }
    animate(t, dt);
  });

  const animate = (t: number, dt: number) => {
    if (hopping) return;
    if (def.mode === "hop") {
      if (t > until) {
        until = t + 2400 + Math.random() * 3600;
        pick();
        const d = Math.hypot(tx - x, ty - y);
        const k = Math.min(1, 160 / Math.max(1, d));
        hop(x + (tx - x) * k, y + (ty - y) * k, 420);
        if (Math.random() < 0.4) sound();
      }
      return;
    }
    if (def.mode === "flutter") {
      if (Math.hypot(tx - x, ty - y) < 20 || t > until) {
        pick();
        until = t + 4000;
      }
      const d = Math.hypot(tx - x, ty - y) || 1;
      x += ((tx - x) / d) * speed * dt;
      y += ((ty - y) / d) * speed * dt;
      place();
      img.setY(y + (b.reduced ? 0 : Math.sin(t / 180) * 10));
      img.setTexture(b.reduced ? def.frames[0] : Math.floor(t / 90) % 2 ? def.frames[0] : def.frames[1]);
      face(tx - x);
      return;
    }
    if (state === "idle") {
      if (def.rest) img.setTexture(def.rest);
      if (t > until) {
        pick();
        state = "move";
      }
      return;
    }
    const d = Math.hypot(tx - x, ty - y);
    if (d < 8) {
      state = "idle";
      until = t + 1200 + Math.random() * 2600;
      img.setTexture(def.rest ?? def.frames[0]);
      return;
    }
    x += ((tx - x) / d) * speed * dt;
    y += ((ty - y) / d) * speed * dt;
    place();
    if (def.mode === "swim") {
      img.setAngle(Phaser.Math.RadToDeg(Math.atan2(ty - y, tx - x)));
      img.setTexture(Math.floor(t / 220) % 2 ? def.frames[0] : def.frames[1]);
    } else {
      face(tx - x);
      img.setTexture(Math.floor(t / 160) % 2 ? def.frames[0] : def.frames[1]);
    }
  };

  let followUntil = 0;
  let followCool = 0;
  const startReact = (t: number, h: Hero) => {
    if (def.react === "follow") {
      if (t < followCool) return;
      followCool = t + 16000;
      followUntil = t + 6000;
      state = "react";
      sound();
      return;
    }
    state = "react";
    sound();
    const ax = x - h.x;
    const ay = y - h.y;
    const al = Math.hypot(ax, ay) || 1;
    if (def.react === "fly") {
      img.setOrigin(0.5, 0.5).setDepth(5100).setScale(def.flyFrames ? scale * 1.6 : scale);
      shadow?.setVisible(false);
      vx = (ax / al) * 520 + (ax >= 0 ? 160 : -160);
      vy = -420;
      until = t + 2400;
      return;
    }
    if (def.react === "dive") {
      vx = (ax / al) * 340;
      vy = (ay / al) * 340;
      until = t + 500;
      return;
    }
    if (def.react === "hop") {
      const water = def.water;
      let nx = x + (ax / al) * 200;
      let ny = y + (ay / al) * 120;
      let wet = false;
      if (water) {
        for (let i = 0; i < 12; i += 1) {
          const a = (i / 12) * Math.PI * 2;
          const px = x + Math.cos(a) * 190;
          const py = y + Math.sin(a) * 110;
          if (water(px, py) && Math.hypot(px - h.x, py - h.y) > Math.hypot(x - h.x, y - h.y)) {
            nx = px;
            ny = py;
            wet = true;
            break;
          }
        }
      }
      nx = Phaser.Math.Clamp(nx, x0 - 120, x1 + 120);
      ny = Phaser.Math.Clamp(ny, y0 - 80, y1 + 80);
      hop(nx, ny, 380, () => {
        if (wet) {
          b.fx.sfx("plop", 0.5, 1.1);
          splashAt(b, x, y, 0.6);
          vanish(scene.time.now);
        } else {
          state = "idle";
          until = scene.time.now + 2000;
        }
      });
      return;
    }
    vx = ax >= 0 ? 300 : -300;
    until = t + 900;
  };

  const stepReact = (t: number, dt: number, h: Hero | null) => {
    if (def.react === "hop") return;
    if (def.react === "follow") {
      if (!h || t > followUntil) {
        state = "idle";
        until = t + 3000;
        img.setTexture(def.rest ?? def.frames[0]);
        return;
      }
      const gx = h.x + (x < h.x ? -110 : 110);
      const gy = h.y + 10;
      const d = Math.hypot(gx - x, gy - y);
      if (d > 14) {
        const sp = Math.min(380, d * 3);
        x += ((gx - x) / d) * sp * dt;
        y += ((gy - y) / d) * sp * dt;
        x = Phaser.Math.Clamp(x, x0 - 200, x1 + 200);
        y = Phaser.Math.Clamp(y, y0 - 100, y1 + 100);
        place();
        face(gx - x);
        img.setTexture(Math.floor(t / 130) % 2 ? def.frames[0] : def.frames[1]);
      } else {
        face(h.x - x);
        img.setTexture(def.rest ?? def.frames[0]);
      }
      return;
    }
    if (def.react === "fly") {
      x += vx * dt;
      y += vy * dt;
      vy -= 90 * dt;
      img.setPosition(x, y);
      face(vx);
      const fl = def.flyFrames ?? def.frames;
      img.setTexture(Math.floor(t / 110) % 2 ? fl[0] : fl[1]);
      if (t > until) {
        img.setOrigin(0.5, 1);
        vanish(t);
      }
      return;
    }
    if (def.react === "dive") {
      x = Phaser.Math.Clamp(x + vx * dt, x0, x1);
      y = Phaser.Math.Clamp(y + vy * dt, y0, y1);
      place();
      img.setAngle(Phaser.Math.RadToDeg(Math.atan2(vy, vx)));
      img.setTexture(Math.floor(t / 70) % 2 ? def.frames[0] : def.frames[1]);
      if (t > until) vanish(t);
      return;
    }
    x += vx * dt;
    if (x > x1 + 60 || x < x0 - 60) vx = -vx;
    place();
    face(vx);
    img.setTexture(Math.floor(t / 70) % 2 ? def.frames[0] : def.frames[1]);
    if (t > until) vanish(t);
  };
  return img;
}

export type ResidentDef = {
  frames: [string, string];
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  lines: string[];
  r?: number;
  block?: number;
  sound?: [ResortSfx, number, number];
  name: string;
  lift?: number;
};

export function resident(b: Builder, def: ResidentDef) {
  const scene = b.world;
  const scale = def.scale ?? 0.5;
  const shadow = scene.add.image(def.x, def.y + 2, "blob").setDisplaySize(170 * scale, 34 * scale + 10).setAlpha(0.4).setDepth(def.y - 1);
  const img = scene.add.image(def.x, def.y - (def.lift ?? 0), def.frames[0]).setOrigin(0.5, 1).setScale(scale).setFlipX(Boolean(def.flip)).setDepth(def.y);
  if (def.block) b.circleBlock(def.x, def.y - 4, def.block);
  let i = Math.floor(Math.random() * def.lines.length);
  let bubble: Phaser.GameObjects.Container | null = null;
  let bubbleUntil = 0;
  let talkUntil = 0;
  b.near(def.x, def.y, def.r ?? 260, {
    cooldown: 20000,
    enter: () => {
      i = (i + 1) % def.lines.length;
      const text = def.lines[i];
      bubble?.destroy();
      bubble = barkBubble(scene, text, b.fonts.round ?? b.fonts.body, b.reduced);
      bubble.setPosition(def.x, img.y - img.displayHeight - 20);
      bubbleUntil = scene.time.now + 2400 + text.length * 25;
      talkUntil = scene.time.now + 900;
      if (def.sound) b.fx.sfx(def.sound[0], def.sound[1], def.sound[2]);
      b.announce(`${def.name}: ${text}`);
    },
  });
  b.onUpdate((t) => {
    const h = b.hero();
    if (h && Math.abs(h.x - def.x) < 420 && Math.abs(h.y - def.y) < 300) img.setFlipX(def.flip ? h.x > def.x : h.x < def.x);
    const talking = t < talkUntil;
    img.setTexture(talking && Math.floor(t / 140) % 2 ? def.frames[1] : def.frames[0]);
    const breathe = b.reduced ? 1 : 1 + Math.sin(t / 420 + def.x) * 0.02;
    img.setScale(scale * (2 - breathe), scale * breathe);
    if (bubble && t > bubbleUntil) {
      const old = bubble;
      bubble = null;
      if (b.reduced) old.destroy();
      else scene.tweens.add({ targets: old, alpha: 0, duration: 200, onComplete: () => old.destroy() });
    }
  });
  void shadow;
  return img;
}

const pools = new WeakMap<Phaser.Scene, Phaser.GameObjects.Image[]>();

function fxImage(scene: Phaser.Scene, key: string) {
  let pool = pools.get(scene);
  if (!pool) {
    pool = [];
    pools.set(scene, pool);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => pools.delete(scene));
  }
  const free = pool.find((i) => !i.visible && i.active);
  if (free) {
    scene.tweens.killTweensOf(free);
    return free.setTexture(key).setVisible(true).setAlpha(1).setScale(1).setAngle(0).clearTint();
  }
  const img = scene.add.image(0, 0, key);
  if (pool.length < 60) pool.push(img);
  return img;
}

function release(img: Phaser.GameObjects.Image) {
  const pooled = pools.get(img.scene)?.includes(img);
  if (pooled) img.setVisible(false);
  else img.destroy();
}

export function splashAt(b: Builder, x: number, y: number, size = 1) {
  const scene = b.world;
  const ring = fxImage(scene, "ring").setPosition(x, y).setDepth(1.58).setAlpha(0.8).setScale(0.3 * size, 0.3 * size);
  scene.tweens.add({ targets: ring, scaleX: 1.1 * size, scaleY: 1.1 * size, alpha: 0, duration: b.reduced ? 200 : 650, ease: "Quad.easeOut", onComplete: () => release(ring) });
  if (b.reduced) return;
  for (let k = 0; k < 4; k += 1) {
    const d = fxImage(scene, "glow").setPosition(x + (k - 1.5) * 12 * size, y).setDepth(y + 5).setDisplaySize(16 * size, 16 * size).setTint(0xcff3ff).setAlpha(0.9);
    scene.tweens.add({ targets: d, y: y - (30 + k * 8) * size, x: d.x + (k - 1.5) * 16 * size, alpha: 0, duration: 380, ease: "Quad.easeOut", onComplete: () => release(d) });
  }
}

export function dustAt(b: Builder, x: number, y: number, color = 0xd9b98a) {
  const scene = b.world;
  if (b.reduced) return;
  const d = fxImage(scene, "glow").setPosition(x, y - 6).setDepth(y + 1).setDisplaySize(46, 26).setTint(color).setAlpha(0.55);
  scene.tweens.add({ targets: d, y: y - 26, displayWidth: 90, displayHeight: 44, alpha: 0, duration: 520, ease: "Quad.easeOut", onComplete: () => release(d) });
}

export function footprint(b: Builder, x: number, y: number, facing: number, dir: string, side: number, gone?: (x: number, y: number) => boolean) {
  const scene = b.world;
  const angle = dir === "s" ? (facing > 0 ? 90 : -90) : dir === "k" ? 0 : 180;
  const off = dir === "s" ? [0, side * 8] : [side * 9, 0];
  const img = fxImage(scene, "footprint").setPosition(x + off[0], y + 2 + off[1]).setDepth(0.36).setTint(0xb58a4e).setAlpha(0.5).setAngle(angle).setScale(0.8);
  const born = scene.time.now;
  const life = 7000;
  const tick = () => {
    if (!img.visible) return;
    const age = scene.time.now - born;
    if (age > life || (gone && gone(img.x, img.y))) {
      scene.tweens.add({ targets: img, alpha: 0, duration: 300, onComplete: () => release(img) });
      return;
    }
    img.setAlpha(0.5 * (1 - age / life));
    scene.time.delayedCall(250, tick);
  };
  scene.time.delayedCall(250, tick);
}
