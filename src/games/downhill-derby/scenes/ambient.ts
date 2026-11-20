import * as Phaser from "phaser";
import type { RaceCopy } from "../copy";
import type { ArlindoSet, Course } from "../sim/course";
import { heightAt, obstacleActive, type Obstacle } from "../sim/track";
import { INK } from "./cart";
import { CastPlanner, type Extra } from "./cast";
import { NEIGHBORS, SAMPLE_RES, type SampleSpots } from "./sample";
import { BLEACHER_ROWS, BLEACHER_SEATS, BLEACHER_W, STALL_W, STREET_SPOTS, VENDOR_SPOTS, type Builder, type Zone } from "./terrain";

type Actor = {
  x: number;
  root: Phaser.GameObjects.Container;
  reset: () => void;
  update: (dt: number, t: number, px: number, speed: number) => void;
};

const VENDORS = [
  { id: "lady", idle: "lunch-lady", angry: "lunch-lady-angry", height: 228 },
  { id: "cook", idle: "x-cook", angry: "x-cook-huff", height: 240 },
];

function heightOf(scene: Phaser.Scene, key: string) {
  return scene.textures.get(key).getSourceImage().height || 200;
}

export class Ambient {
  private readonly b: Builder;
  private readonly layer: Phaser.GameObjects.Layer;
  private readonly copy: RaceCopy;
  private readonly actors: Actor[] = [];
  private readonly fans: { img: Phaser.GameObjects.Image; keys: [string, string]; cheer: number; x: number; base: number; phase: number }[] = [];
  private lights: Phaser.GameObjects.Graphics | null = null;
  private lit = 0;
  private finishMascot: Phaser.GameObjects.Image | null = null;
  private finishJump = 0;
  private readonly cast = new CastPlanner(3800);

  step = 0;

  constructor(b: Builder, layer: Phaser.GameObjects.Layer, track: Course, zones: Zone[], copy: RaceCopy) {
    this.b = b;
    this.layer = layer;
    this.copy = copy;
    if (track.set) {
      const set = track.set;
      this.dog(set.dog);
      this.b.taken.push([set.dog - 90, set.dog + 130]);
      this.resident(set.house);
      this.cat(set.cat);
      this.hose(track, set);
      this.truck(track, set);
      if (b.sampleSpots) this.neighbors(b.sampleSpots);
      this.finish(track);
      for (const x of this.b.bleachers) this.bleacher(x);
      this.start(track);
      return;
    }
    const z = (key: Zone["key"]) => zones.find((q) => q.key === key)!;
    const street = z("street");
    const market = z("market");
    const works = z("works");
    const take = (x0: number, x1: number) => this.b.taken.push([x0, x1]);
    this.dog(street.x0 + 6000);
    this.resident(street.x0 + STREET_SPOTS.resident);
    this.cat(street.x0 + STREET_SPOTS.cat);
    take(street.x0 + 5910, street.x0 + 6130);
    take(street.x0 + STREET_SPOTS.resident - 190, street.x0 + STREET_SPOTS.resident + 190);
    take(street.x0 + STREET_SPOTS.cat - 140, street.x0 + STREET_SPOTS.cat + 140);
    for (const x of b.sample ? [market.x0 + 3000] : [street.x0 + 4200, street.x0 + 9600, market.x0 + 3000]) {
      this.clothes(x);
      take(x - 220, x + 225);
    }
    VENDOR_SPOTS.forEach((v, i) => this.vendor(market.x0 + v, i));
    this.chickens(market.x0 + 5600);
    take(market.x0 + 5600 - 260, market.x0 + 5600 + 70);
    for (const x of [market.x0 + 2200, works.x0 + 2600, works.x0 + 7400]) {
      this.spinner(x);
      take(x - 100, x + 110);
    }
    this.mixer(works.x0 + 4600);
    take(works.x0 + 4600 - 120, works.x0 + 4600 + 120);
    for (const x of b.sample ? [works.x0 + 900] : [street.x0 + 7400, works.x0 + 900]) {
      this.crowd(x, 3);
      take(x - 70, x + 250);
    }
    if (b.sampleSpots) this.neighbors(b.sampleSpots);
    this.finish(track);
    for (const x of this.b.bleachers) this.bleacher(x);
    for (const x of this.b.crowds) this.crowd(x, 3);
    this.start(track);
  }

  waiting(spots: { x: number; depth: number }[]) {
    for (const spot of spots) this.crowd(spot.x, 1, spot.depth);
  }

  private add<T extends Phaser.GameObjects.GameObject>(obj: T) {
    this.layer.add(obj);
    return obj;
  }

  private bubble(text: string, x: number, y: number, size = 34) {
    const t = this.add(this.b.scene.add.text(x, y, text, { fontFamily: this.b.fonts.display, fontSize: `${size}px`, color: "#1d1830", backgroundColor: "#fbf5e6", padding: { x: 10, y: 4 } }));
    t.setOrigin(0.5, 1).setDepth(-1);
    this.b.scene.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 800, delay: 300, onComplete: () => t.destroy() });
  }

  private dog(x0: number) {
    const s = this.b.scene;
    const base = this.b.backY(x0) + 12;
    const root = this.add(s.add.container(x0, base));
    root.setDepth(-2);
    const img = s.add.image(0, 0, "dog-sit").setOrigin(0.5, 1).setScale(0.6);
    root.add(img);
    let state: "wait" | "run" | "done" = "wait";
    let t0 = 0;
    let x = x0;
    let barkT = 0;
    this.actors.push({
      x: x0,
      root,
      reset: () => {
        state = "wait";
        x = x0;
        root.setPosition(x0, base);
        img.setTexture("dog-sit");
      },
      update: (dt, t, px, speed) => {
        if (state === "wait" && px > x0 - 260 && px < x0 + 600) {
          state = "run";
          t0 = t;
          barkT = 0;
        }
        if (state === "run") {
          const run = Math.min(1150, Math.max(500, speed * 0.82));
          x += run * dt;
          root.setPosition(x, this.b.backY(x) + 12);
          img.setTexture(Math.floor(t * 12) % 2 === 0 ? "dog-a" : "dog-b");
          barkT -= dt;
          if (barkT <= 0) {
            barkT = 0.55;
            this.bubble(this.copy.bark, x + 70, this.b.backY(x) - 120, 30);
          }
          if (t - t0 > 2.6) {
            state = "done";
            img.setTexture("dog-sit");
          }
        }
      },
    });
  }

  private hose(track: Course, set: ArlindoSet) {
    const s = this.b.scene;
    const o = track.obstacles.find((q) => q.kind === "hose") as Obstacle;
    const road = track.surfaces[0];
    const root = this.add(s.add.container(0, 0));
    root.setDepth(7.7);
    const g = s.add.graphics();
    root.add(g);
    const sx = set.house + 120;
    const sy = this.b.backY(sx) - 60;
    const ex = set.hose;
    const ey = heightAt(road, ex) - 6;
    this.actors.push({
      x: (sx + ex) / 2,
      root,
      reset: () => g.clear(),
      update: (_dt, t) => {
        g.clear();
        const active = obstacleActive(o, this.step);
        const soon = !active && obstacleActive(o, this.step + 50);
        if (!active && !soon) return;
        const k = active ? 1 : 0.35;
        const wob = Math.sin(t * 18) * 10;
        const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(sx, sy), new Phaser.Math.Vector2((sx + ex) / 2, sy - 170 * k + wob), new Phaser.Math.Vector2(active ? ex : sx + (ex - sx) * 0.25, active ? ey : sy + 60));
        g.lineStyle(16 * k + 4, 0x1d1830, 0.35);
        curve.draw(g, 28);
        g.lineStyle(14 * k, 0x8fd4f7, 0.92);
        curve.draw(g, 28);
        g.lineStyle(4 * k + 1, 0xffffff, 0.75);
        curve.draw(g, 28);
        if (!active) return;
        for (let i = 0; i < 7; i += 1) {
          const a = t * 7 + i * 0.9;
          g.fillStyle(0x8fd4f7, 0.9);
          g.fillCircle(ex + Math.cos(a) * (22 + i * 4), ey - Math.abs(Math.sin(a)) * (30 + i * 6), 6);
        }
        g.fillStyle(0x8fd4f7, 0.55);
        g.fillEllipse(ex, ey + 8, 140, 18);
      },
    });
  }

  private truck(track: Course, set: ArlindoSet) {
    const s = this.b.scene;
    const o = track.obstacles.find((q) => q.kind === "truck") as Obstacle;
    const w = o.window!;
    const road = track.surfaces[0];
    const root = this.add(s.add.container(0, 0));
    const img = s.add.image(set.truck, 0, "s-caminhao").setOrigin(0.5, 1);
    root.add(img);
    const parkY = this.b.backY(set.truck) + 6;
    const roadY = heightAt(road, set.truck) + 4;
    const parkTilt = Math.atan2(this.b.backY(set.truck + 60) - this.b.backY(set.truck - 60), 120);
    const roadTilt = Math.atan2(heightAt(road, set.truck + 60) - heightAt(road, set.truck - 60), 120);
    const lead = 60;
    let beeped = -1;
    const place = () => {
      const ph = (((this.step + w.phase) % w.period) + w.period) % w.period;
      let k = 0;
      if (ph < w.on) k = 1;
      else if (ph >= w.period - lead) k = (ph - (w.period - lead)) / lead;
      else if (ph < w.on + lead) k = 1 - (ph - w.on) / lead;
      const ease = k * k * (3 - 2 * k);
      img.setY(parkY + (roadY - parkY) * ease);
      img.setRotation(parkTilt + (roadTilt - parkTilt) * ease);
      img.setScale(((0.78 + 0.06 * ease) / SAMPLE_RES));
      root.setDepth(ease > 0.5 ? 7.55 : -6.6);
      return { ph, k };
    };
    this.actors.push({
      x: set.truck,
      root,
      reset: () => {
        beeped = -1;
        place();
      },
      update: (_dt, t, px) => {
        const { ph, k } = place();
        const warn = k > 0 || ph >= w.period - lead - 80;
        img.setTexture(warn && Math.floor(t * 4) % 2 === 0 ? "s-caminhao-luz" : "s-caminhao");
        const cycle = Math.floor((this.step + w.phase) / w.period);
        if (ph >= w.period - lead - 80 && beeped !== cycle && Math.abs(px - set.truck) < 2600) {
          beeped = cycle;
          this.bubble(this.copy.beep, set.truck - 120, parkY - 300, 30);
        }
      },
    });
    place();
  }

  private neighbors(spots: SampleSpots) {
    const s = this.b.scene;
    for (const n of spots.neighbors) {
      this.fan(n.x, this.b.backY(n.x) + 8, NEIGHBORS[n.who], -4);
      this.b.taken.push([n.x - 80, n.x + 80]);
    }
    const k = spots.kite;
    if (!k) return;
    const kite = this.add(s.add.image(k.x, k.y, "s-pipa").setScale(0.62 / SAMPLE_RES).setDepth(-4.2));
    const string = this.add(s.add.graphics());
    string.setDepth(-4.1);
    string.lineStyle(2.5, INK, 0.8);
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(k.handX, k.handY), new Phaser.Math.Vector2((k.handX + k.x) / 2 - 60, (k.handY + k.y) / 2 + 40), new Phaser.Math.Vector2(k.x, k.y + 40));
    curve.draw(string, 20);
    s.tweens.add({ targets: kite, y: k.y - 18, angle: 7, duration: 1300, yoyo: true, repeat: -1, ease: "Sine.inOut" });
  }

  private resident(x0: number) {
    const s = this.b.scene;
    const base = this.b.floorY(x0 - 160, x0 + 160) + 4;
    const root = this.add(s.add.container(x0, base));
    root.setDepth(-19);
    const facade = this.b.sample ? s.add.image(0, 0, "s-facade-arlindo").setOrigin(0.5, 408 / 416).setScale(1 / SAMPLE_RES) : null;
    const wall = s.add.graphics();
    wall.setVisible(!facade);
    wall.fillStyle(INK, 1);
    wall.fillRect(-150, -292, 300, 296);
    wall.fillTriangle(-176, -286, 176, -286, 0, -372);
    wall.fillStyle(0xf4a3c0, 1);
    wall.fillRect(-144, -286, 288, 286);
    wall.fillStyle(0xd8573f, 1);
    wall.fillTriangle(-164, -292, 164, -292, 0, -364);
    wall.fillStyle(INK, 1);
    wall.fillRect(-150, -150, 300, 8);
    wall.fillRect(-112, -118, 66, 122);
    wall.fillStyle(0x7c4527, 1);
    wall.fillRect(-106, -112, 54, 116);
    wall.fillStyle(0xffc83d, 1);
    wall.fillCircle(-60, -54, 5);
    wall.fillStyle(INK, 1);
    wall.fillRect(10, -118, 104, 78);
    wall.fillStyle(0xfff3c8, 1);
    wall.fillRect(16, -112, 92, 66);
    wall.fillStyle(INK, 1);
    wall.fillRect(60, -112, 4, 66);
    wall.fillRect(-74, -262, 148, 112);
    wall.fillStyle(0x3a3157, 1);
    wall.fillRect(-68, -256, 136, 102);
    const man = s.add.image(0, -150, "arlindo").setOrigin(0.5, 1).setScale(0.74);
    const frame = s.add.graphics();
    frame.fillStyle(INK, 1);
    frame.fillRect(-80, -266, 160, 10);
    frame.fillRect(-80, -266, 10, 116);
    frame.fillRect(70, -266, 10, 116);
    frame.fillStyle(0x63d6c1, 1);
    frame.fillRect(-98, -262, 18, 108);
    frame.fillRect(80, -262, 18, 108);
    const sill = s.add.graphics();
    sill.fillStyle(INK, 1);
    sill.fillRect(-90, -158, 180, 22);
    sill.fillStyle(0x7c4527, 1);
    sill.fillRect(-84, -154, 168, 14);
    for (let k = 0; k < 5; k += 1) {
      sill.fillStyle(INK, 1);
      sill.fillCircle(-60 + k * 30, -162, 11);
      sill.fillStyle([0xef4f43, 0xffc83d, 0xf06ba8][k % 3], 1);
      sill.fillCircle(-60 + k * 30, -162, 7);
    }
    root.add(facade ? [facade, wall, man, frame, sill] : [wall, man, frame, sill]);
    let done = false;
    let jump = 0;
    this.actors.push({
      x: x0,
      root,
      reset: () => {
        done = false;
        jump = 0;
        man.setY(-150);
      },
      update: (dt, _t, px, speed) => {
        if (!done && Math.abs(px - x0) < 240 && speed > 900) {
          done = true;
          jump = 1;
          this.bubble(this.copy.startled, x0 + 60, base - 400, 34);
        }
        if (jump > 0) {
          jump = Math.max(0, jump - dt * 1.6);
          man.setY(-150 - Math.sin(jump * Math.PI) * 14);
        }
      },
    });
  }

  private cat(x0: number) {
    const s = this.b.scene;
    const base = this.b.floorY(x0 - 120, x0 + 120);
    const root = this.add(s.add.container(x0, base));
    root.setDepth(-9);
    root.setScale(0.75);
    const wall = s.add.graphics();
    wall.fillStyle(INK, 1);
    wall.fillRect(-160, -150, 320, 160);
    wall.fillStyle(0xd8573f, 1);
    wall.fillRect(-152, -144, 304, 150);
    wall.lineStyle(3, INK, 0.3);
    for (let k = 1; k < 5; k += 1) {
      wall.beginPath();
      wall.moveTo(-152, -144 + k * 30);
      wall.lineTo(152, -144 + k * 30);
      wall.strokePath();
    }
    const cat = s.add.image(10, -146, "cat-sleep").setOrigin(0.5, 1).setScale(1.15);
    root.add([wall, cat]);
    let done = false;
    let jump = 0;
    this.actors.push({
      x: x0,
      root,
      reset: () => {
        done = false;
        jump = 0;
        cat.setTexture("cat-sleep").setY(-146);
      },
      update: (dt, _t, px, speed) => {
        if (!done && Math.abs(px - x0) < 300 && speed > 600) {
          done = true;
          jump = 1;
          cat.setTexture("cat-scared");
        }
        if (jump > 0) {
          jump = Math.max(0, jump - dt * 1.4);
          cat.setY(-146 - Math.sin(jump * Math.PI) * 90);
        }
      },
    });
  }

  private clothes(x0: number) {
    const s = this.b.scene;
    const base = this.b.backY(x0);
    const root = this.add(s.add.container(x0, base));
    root.setDepth(-10);
    const posts = s.add.graphics();
    posts.fillStyle(INK, 1);
    for (const px of [-200, 200]) posts.fillRect(px, -280, 12, 286 + this.b.backY(x0 + px + 6) - base);
    posts.lineStyle(4, INK, 1);
    posts.beginPath();
    posts.moveTo(-194, -270);
    posts.lineTo(206, -270);
    posts.strokePath();
    root.add(posts);
    const colors = [0xffcf3f, 0x6fb6ff, 0xf27aa8, 0xffffff, 0x3fc6a8, 0xef4f43];
    const pieces: Phaser.GameObjects.Graphics[] = [];
    for (let k = 0; k < 6; k += 1) {
      const g = s.add.graphics();
      const w = 40 + (k % 3) * 10;
      const h = 54 + (k % 2) * 20;
      g.fillStyle(INK, 1);
      g.fillRect(-w / 2 - 4, -2, w + 8, h + 6);
      g.fillStyle(colors[k], 1);
      g.fillRect(-w / 2, 2, w, h - 2);
      g.setPosition(-160 + k * 62, -270);
      pieces.push(g);
      root.add(g);
    }
    let gust = 0;
    this.actors.push({
      x: x0,
      root,
      reset: () => {
        gust = 0;
      },
      update: (dt, t, px, speed) => {
        const near = Math.max(0, 1 - Math.abs(px - x0) / 700);
        gust = Math.max(gust * (1 - dt * 1.2), near * Math.min(1, speed / 1600));
        pieces.forEach((p, k) => p.setRotation(Math.sin(t * (2 + gust * 9) + k) * (0.06 + gust * 0.5) - gust * 0.35));
      },
    });
  }

  private vendor(x0: number, index: number) {
    const s = this.b.scene;
    const who = VENDORS[index];
    if (!who) {
      const stallX = x0 - 140;
      const floor = this.b.floorY(stallX, stallX + STALL_W);
      const kid = this.cast.take("bust", stallX + STALL_W / 2);
      if (kid) this.fan(stallX + STALL_W / 2, floor - 80, kid, -12.5);
      return;
    }
    this.cast.claim(who.id, x0);
    const base = this.b.backY(x0 + 170) + 6;
    const root = this.add(s.add.container(x0 + 170, base));
    root.setDepth(-13);
    const lady = s.add.image(0, 0, who.idle).setOrigin(0.5, 1);
    lady.setScale(who.height / heightOf(s, who.idle));
    root.add(lady);
    let done = false;
    let fruit: { g: Phaser.GameObjects.Graphics; x: number; y: number; vx: number; vy: number } | null = null;
    this.actors.push({
      x: x0,
      root,
      reset: () => {
        done = false;
        lady.setTexture(who.idle);
        fruit?.g.destroy();
        fruit = null;
      },
      update: (dt, _t, px, speed) => {
        if (!done && Math.abs(px - (x0 + 170)) < 260 && speed > 700) {
          done = true;
          lady.setTexture(who.angry);
          this.bubble(this.copy.holdIt, x0 + 170, base - lady.displayHeight - 50, 30);
          const g = this.add(s.add.graphics());
          g.fillStyle(INK, 1);
          g.fillCircle(0, 0, 17);
          g.fillStyle(0xff8a3d, 1);
          g.fillCircle(0, 0, 13);
          g.setDepth(-1);
          fruit = { g, x: x0 + 210, y: base - lady.displayHeight * 0.55, vx: 260, vy: -380 };
        }
        if (fruit) {
          fruit.vy += 1800 * dt;
          fruit.x += fruit.vx * dt;
          fruit.y += fruit.vy * dt;
          const floor = this.b.backY(fruit.x) + 30;
          if (fruit.y > floor) {
            fruit.y = floor;
            fruit.vy *= -0.45;
            fruit.vx *= 0.9;
          }
          fruit.g.setPosition(fruit.x, fruit.y);
          fruit.g.rotation += fruit.vx * dt * 0.02;
        }
      },
    });
  }

  private chickens(x0: number) {
    const s = this.b.scene;
    const root = this.add(s.add.container(0, 0));
    root.setDepth(-3);
    const birds = [0, 1, 2].map((i) => {
      const img = s.add.image(x0 - i * 90, this.b.backY(x0 - i * 90) + 8, "chicken-a").setOrigin(0.5, 1).setScale(0.58);
      root.add(img);
      return { img, x: x0 - i * 90, speed: 520 + i * 110 };
    });
    let run = false;
    let t0 = 0;
    this.actors.push({
      x: x0,
      root,
      reset: () => {
        run = false;
        birds.forEach((b, i) => {
          b.x = x0 - i * 90;
          b.img.setPosition(b.x, this.b.backY(b.x) + 8).setVisible(true).setTexture("chicken-a");
        });
      },
      update: (dt, t, px) => {
        if (!run && px > x0 - 1100) {
          run = true;
          t0 = t;
          this.bubble(this.copy.cluck, x0, this.b.backY(x0) - 110, 28);
        }
        if (!run) {
          birds.forEach((b, i) => b.img.setY(this.b.backY(b.x) + 8 - Math.abs(Math.sin(t * 3 + i)) * 4));
          return;
        }
        birds.forEach((b, i) => {
          b.x += b.speed * dt;
          b.img.setPosition(b.x, this.b.backY(b.x) + 8 - Math.abs(Math.sin(t * 16 + i)) * 18);
          b.img.setTexture(Math.floor(t * 14 + i) % 2 === 0 ? "chicken-a" : "chicken-b");
          if (t - t0 > 3.2) b.img.setVisible(false);
        });
      },
    });
  }

  private spinner(x0: number) {
    const s = this.b.scene;
    const base = this.b.backY(x0);
    const root = this.add(s.add.container(x0, base));
    root.setDepth(-7);
    const pole = s.add.graphics();
    pole.fillStyle(INK, 1);
    pole.fillRect(-6, -240, 12, 240);
    const plate = s.add.graphics();
    plate.fillStyle(INK, 1);
    plate.fillTriangle(-70, -26, 40, -26, 40, 26);
    plate.fillRect(-70, -26, 110, 52);
    plate.fillTriangle(40, -46, 90, 0, 40, 46);
    plate.fillStyle(0xff8a3d, 1);
    plate.fillRect(-64, -20, 104, 40);
    plate.fillTriangle(44, -36, 80, 0, 44, 36);
    plate.setPosition(0, -250);
    root.add([pole, plate]);
    let angle = 0;
    let vel = 0;
    this.actors.push({
      x: x0,
      root,
      reset: () => {
        angle = 0;
        vel = 0;
      },
      update: (dt, _t, px, speed) => {
        const near = Math.max(0, 1 - Math.abs(px - x0) / 500);
        vel += near * speed * 0.012 * dt * 60 * dt;
        vel *= 1 - Math.min(1, dt * 0.8);
        angle += vel * dt * 10;
        plate.setScale(Math.cos(angle), 1);
      },
    });
  }

  private mixer(x0: number) {
    const s = this.b.scene;
    const base = this.b.floorY(x0 - 90, x0 + 90);
    const root = this.add(s.add.container(x0, base));
    root.setDepth(-12);
    const body = s.add.graphics();
    body.fillStyle(INK, 1);
    body.fillRect(-90, -60, 180, 30);
    body.fillCircle(-60, -20, 24);
    body.fillCircle(60, -20, 24);
    body.fillStyle(0x9aa6b8, 1);
    body.fillCircle(-60, -20, 16);
    body.fillCircle(60, -20, 16);
    const drum = s.add.graphics();
    drum.setPosition(0, -130);
    root.add([body, drum]);
    this.actors.push({
      x: x0,
      root,
      reset: () => undefined,
      update: (_dt, t) => {
        drum.clear();
        drum.fillStyle(INK, 1);
        drum.fillEllipse(0, 0, 200, 150);
        drum.fillStyle(0xff8a3d, 1);
        drum.fillEllipse(0, 0, 188, 138);
        drum.lineStyle(10, INK, 0.7);
        for (let k = 0; k < 3; k += 1) {
          const a = t * 3 + (k * Math.PI * 2) / 3;
          const xx = Math.cos(a) * 80;
          drum.beginPath();
          drum.moveTo(xx, -60);
          drum.lineTo(xx * 0.8, 60);
          drum.strokePath();
        }
      },
    });
  }

  private fan(x: number, y: number, e: Extra, depth: number) {
    const s = this.b.scene;
    const img = this.add(s.add.image(x, y, e.idle).setOrigin(0.5, 1));
    img.setScale(e.height / heightOf(s, e.idle));
    img.setDepth(depth);
    this.fans.push({ img, keys: [e.idle, e.cheer], cheer: 0, x, base: y, phase: x * 0.013 });
  }

  private bleacher(x0: number) {
    const y = this.b.floorY(x0 - 6, x0 + BLEACHER_W);
    BLEACHER_SEATS.forEach((seats, row) => {
      for (const sx of seats) {
        const e = this.cast.take("bust", x0 + sx);
        if (e) this.fan(x0 + sx, y - BLEACHER_ROWS[row], e, row === 0 ? -16.5 : -16.7);
      }
    });
  }

  private crowd(x0: number, n: number, depth = -4) {
    for (let k = 0; k < n; k += 1) {
      const x = x0 + k * 92;
      const e = this.cast.take("full", x);
      if (e) this.fan(x, this.b.backY(x) + 8, e, depth);
    }
  }

  private start(track: Course) {
    const s = this.b.scene;
    const x = track.start + 120;
    const base = this.b.backY(x);
    const root = this.add(s.add.container(x + 470, base));
    root.setDepth(-3);
    const mascot = s.add.image(0, 10, "mascot-wave").setOrigin(0.5, 1).setScale(0.5);
    root.add(mascot);
    this.actors.push({ x, root, reset: () => undefined, update: (_dt, t) => mascot.setRotation(Math.sin(t * 4) * 0.05) });
    this.lights = this.add(s.add.graphics());
    this.lights.setDepth(-2.8);
    this.lights.setPosition(x + 300, base - 210);
    this.drawLights();
  }

  private finish(track: Course) {
    const s = this.b.scene;
    const x = track.finish + 260;
    const y = this.b.backY(x);
    this.finishMascot = this.add(s.add.image(x, y + 10, "mascot-cheer").setOrigin(0.5, 1).setScale(0.5));
    this.finishMascot.setDepth(-3);
    this.crowd(track.finish - 520, 3);
  }

  private drawLights() {
    const g = this.lights;
    if (!g) return;
    g.clear();
    g.fillStyle(INK, 1);
    g.fillRoundedRect(-120, -38, 240, 76, 18);
    for (let k = 0; k < 3; k += 1) {
      const on = this.lit > k;
      const go = this.lit >= 4;
      g.fillStyle(go ? 0x63d6c1 : on ? 0xef4f43 : 0x3a3157, 1);
      g.fillCircle(-72 + k * 72, 0, 26);
    }
  }

  setLights(n: number) {
    if (n === this.lit) return;
    this.lit = n;
    this.drawLights();
  }

  cheer(x: number, power = 1) {
    for (const f of this.fans) if (Math.abs(f.x - x) < 1700) f.cheer = Math.max(f.cheer, 0.8 + power * 0.6);
  }

  finishLine() {
    this.finishJump = 1.6;
    this.cheer(this.finishMascot?.x ?? 0, 1.5);
  }

  reset() {
    for (const a of this.actors) a.reset();
    for (const f of this.fans) f.cheer = 0;
    this.finishJump = 0;
    this.setLights(0);
  }

  update(dt: number, t: number, px: number, speed: number, camX: number, halfW: number) {
    for (const a of this.actors) {
      const on = Math.abs(a.x - camX) < halfW + 2600;
      a.root.setVisible(on);
      if (on) a.update(dt, t, px, speed);
    }
    for (const f of this.fans) {
      const on = Math.abs(f.x - camX) < halfW + 400;
      f.img.setVisible(on);
      if (!on) continue;
      f.cheer = Math.max(0, f.cheer - dt);
      const cheering = f.cheer > 0;
      f.img.setTexture(cheering && Math.floor(t * 6 + f.phase) % 2 === 0 ? f.keys[1] : f.keys[0]);
      f.img.setY(f.base - (cheering ? Math.abs(Math.sin(t * 9 + f.phase)) * 24 : Math.abs(Math.sin(t * 2 + f.phase)) * 3));
    }
    if (this.finishMascot) {
      this.finishJump = Math.max(0, this.finishJump - dt);
      const jump = this.finishJump > 0 ? Math.abs(Math.sin(t * 10)) * 40 : 0;
      this.finishMascot.setY(this.b.backY(this.finishMascot.x) + 10 - jump);
    }
  }
}
