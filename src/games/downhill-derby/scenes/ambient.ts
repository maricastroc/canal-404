import * as Phaser from "phaser";
import type { RaceCopy } from "../copy";
import { BAG_SHIFTS, BAG_SWING, bagPhase } from "../sim/antena";
import type { AntenaSet, ArlindoSet, Course, FeiraSet } from "../sim/course";
import { heightAt, obstacleActive, type Obstacle } from "../sim/track";
import { INK } from "./cart";
import { CastPlanner, type Extra } from "./cast";
import { MIXER_X } from "./antena";
import { awningGaps, CIDINHA, trolleyRamp } from "./feira";
import { NEIGHBORS, SAMPLE_RES, type SampleSpots } from "./sample";
import { BLEACHER_ROWS, BLEACHER_SEATS, BLEACHER_W, LANE_OFFSETS, LANES, STALL_W, STREET_SPOTS, VENDOR_SPOTS, type Builder, type Zone } from "./terrain";

type Actor = {
  x: number;
  root: Phaser.GameObjects.Container;
  reset: () => void;
  update: (dt: number, t: number, px: number, speed: number) => void;
};

const VENDORS = [
  { id: "lady", idle: "lunch-lady", angry: "lunch-lady-angry", height: 228, market: 200 },
  { id: "cook", idle: "x-cook", angry: "x-cook-huff", height: 240, market: 206 },
];

function heightOf(scene: Phaser.Scene, key: string) {
  return scene.textures.get(key).getSourceImage().height || 200;
}

export class Ambient {
  bubbleMin = 0;
  bubbleTop = -Infinity;
  avoid: Phaser.Geom.Rectangle[] = [];
  private bubbles: { text: Phaser.GameObjects.Text; x: number }[] = [];
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
  private flockState: ((clean: boolean) => void) | null = null;

  private jetState: (() => void) | null = null;

  step = 0;
  lead = -Infinity;
  racers: number[] = [-Infinity, -Infinity, -Infinity, -Infinity];

  constructor(b: Builder, layer: Phaser.GameObjects.Layer, track: Course, zones: Zone[], copy: RaceCopy) {
    this.b = b;
    this.layer = layer;
    this.copy = copy;
    if (track.set?.kind === "antena") {
      this.hill(track, track.set);
      if (b.sampleSpots) this.neighbors(b.sampleSpots);
      this.finish(track);
      for (const x of this.b.bleachers) this.bleacher(x);
      this.start(track);
      return;
    }
    if (track.set?.kind === "feira") {
      this.market(track, track.set);
      if (b.sampleSpots) this.neighbors(b.sampleSpots);
      this.finish(track);
      for (const x of this.b.bleachers) this.bleacher(x);
      this.start(track);
      return;
    }
    if (track.set?.kind === "arlindo") {
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

  private market(track: Course, set: FeiraSet) {
    const gaps = awningGaps(set);
    this.feirante(gaps[0][0] + 170, VENDORS[0], this.copy.vendorCalls[0]);
    this.feirante(gaps[3][0] + 470, VENDORS[1], this.copy.vendorCalls[1]);
    this.feirante(set.fruit[0].crate + 250, VENDORS[1], this.copy.vendorCalls[3]);
    this.feirante(set.fruit[1].crate + 250, VENDORS[0], this.copy.vendorCalls[0]);
    this.cidinha(track, set);
    for (const i of [2, 4, 6, 7]) {
      const x = (gaps[i][0] + gaps[i][1]) / 2;
      const e = this.cast.take("full", x);
      if (e) this.fan(x, this.b.backY(x) + 8, e, -11.5);
      this.b.taken.push([x - 80, x + 80]);
    }
    this.pigeons(track, set);
  }

  private feirante(x0: number, who: (typeof VENDORS)[number], call: string) {
    const s = this.b.scene;
    this.cast.claim(who.id, x0);
    const base = this.b.backY(x0) + 6;
    const root = this.add(s.add.container(x0, base));
    root.setDepth(-11.6);
    const img = s.add.image(0, 0, who.idle).setOrigin(0.5, 1);
    img.setScale(who.market / heightOf(s, who.idle));
    root.add(img);
    let done = false;
    let hop = 0;
    this.actors.push({
      x: x0,
      root,
      reset: () => {
        done = false;
        hop = 0;
        img.setY(0);
      },
      update: (dt, _t, px) => {
        if (!done && px > x0 - 900 && px < x0) {
          done = true;
          hop = 1;
          this.bubble(call, x0, base - img.displayHeight - 30, 30);
        }
        if (hop > 0) {
          hop = Math.max(0, hop - dt * 1.8);
          img.setY(-Math.sin(hop * Math.PI) * 12);
        }
      },
    });
    this.b.taken.push([x0 - 90, x0 + 90]);
  }

  private cidinha(track: Course, set: FeiraSet) {
    const s = this.b.scene;
    const road = track.surfaces[0];
    const x0 = set.cidinha;
    const rp = set.trolley;
    const base = this.b.backY(x0) + 8;
    const root = this.add(s.add.container(0, 0));
    root.setDepth(-11.5);
    const lady = s.add.image(x0, base, CIDINHA.idle).setOrigin(0.5, 1);
    lady.setScale(CIDINHA.height / heightOf(s, CIDINHA.idle));
    root.add(lady);
    const tex = heightOf(s, "f-carrinho-feira");
    const trolley = this.add(s.add.image(x0 + 100, base, "f-carrinho-feira").setOrigin(0.5, 1 - (10 * SAMPLE_RES) / tex));
    trolley.setScale(118 / (tex - 20 * SAMPLE_RES));
    const ramp = this.add(trolleyRamp(s, track));
    ramp.setDepth(2.6);
    this.b.taken.push([x0 - 90, x0 + 170]);
    let state: "wait" | "roll" | "tipped" = "wait";
    let tx = x0 + 100;
    let tv = 0;
    let shout = 0;
    const home = () => {
      state = "wait";
      tx = x0 + 100;
      tv = 0;
      shout = 0;
      trolley.setVisible(true).setPosition(tx, base).setRotation(0).setDepth(-11.4);
      ramp.setVisible(false);
      lady.setTexture(CIDINHA.idle);
    };
    home();
    this.actors.push({
      x: (x0 + rp.x1) / 2,
      root,
      reset: home,
      update: (dt, t, px, speed) => {
        const front = Math.max(px, this.lead);
        if (state === "wait" && front > x0 - 320) {
          state = "roll";
          tv = 260;
          shout = 2.2;
          this.bubble(this.copy.cidinha, x0, base - CIDINHA.height - 40, 32);
        }
        if (state === "roll") {
          tv = Math.min(2600, Math.max(tv + 750 * dt, front > tx - 700 ? speed * 1.25 : 0));
          tx += tv * dt;
          const y = heightAt(road, tx) + LANES.bruno + 2;
          const tilt = Math.atan2(heightAt(road, tx + 40) - heightAt(road, tx - 40), 80);
          trolley.setPosition(tx, y).setRotation(tilt + Math.sin(t * 30) * 0.04).setDepth(4.7);
          if (tx >= rp.x0 + 30 || front > rp.x0 - 260) {
            state = "tipped";
            trolley.setVisible(false);
            ramp.setVisible(true);
          }
        }
        if (shout > 0) {
          shout = Math.max(0, shout - dt);
          lady.setTexture(shout > 0 && Math.floor(t * 6) % 2 === 0 ? CIDINHA.cheer : CIDINHA.idle);
        }
      },
    });
  }

  private pigeons(track: Course, set: FeiraSet) {
    const s = this.b.scene;
    const road = track.surfaces[0];
    const f = set.flock;
    const root = this.add(s.add.container(0, 0));
    const lanes = [0, -30, -58, -86, -114];
    const depths = [7.5, 6.6, 5.9, 5.4, 4.9];
    const birds: { img: Phaser.GameObjects.Image; x: number; y: number; lane: number; vx: number; vy: number; phase: number; home: number }[] = [];
    for (let k = 0; k < 12; k += 1) {
      const lane = k % lanes.length;
      const x = f.x0 + 50 + ((k * 211) % (f.x1 - f.x0 - 100));
      const img = this.add(s.add.image(x, 0, "f-pombo-a").setOrigin(0.5, 0.85).setScale(0.62 / SAMPLE_RES));
      img.setDepth(depths[lane]).setFlipX(k % 3 === 0);
      birds.push({ img, x, y: 0, lane: lanes[lane], vx: 0, vy: 0, phase: k * 1.7, home: x });
    }
    let mode: "rest" | "calm" | "scatter" = "rest";
    let wait = 0;
    const place = () => {
      for (const bird of birds) {
        bird.x = bird.home;
        bird.y = heightAt(road, bird.x) + bird.lane;
        bird.vx = 0;
        bird.vy = 0;
        bird.img.setPosition(bird.x, bird.y).setTexture("f-pombo-a").setVisible(true).setRotation(0);
      }
    };
    place();
    const takeOff = (panic: boolean) => {
      mode = panic ? "scatter" : "calm";
      birds.forEach((bird, k) => {
        bird.vx = panic ? (k % 2 ? 1 : -1) * (200 + ((k * 97) % 260)) + 300 : 260 + ((k * 53) % 180);
        bird.vy = panic ? -(620 + ((k * 71) % 300)) : -(320 + ((k * 37) % 160));
      });
    };
    this.flockState = (clean) => {
      if (clean) {
        mode = "calm";
        wait = 0.35;
      } else takeOff(true);
    };
    this.actors.push({
      x: (f.x0 + f.x1) / 2,
      root,
      reset: () => {
        mode = "rest";
        wait = 0;
        place();
      },
      update: (dt, t) => {
        if (mode === "rest") {
          birds.forEach((bird) => bird.img.setTexture(Math.floor(t * 3 + bird.phase) % 3 === 0 ? "f-pombo-b" : "f-pombo-a"));
          return;
        }
        if (mode === "calm" && wait > 0) {
          wait -= dt;
          if (wait <= 0) takeOff(false);
          return;
        }
        birds.forEach((bird, k) => {
          bird.vy += (mode === "scatter" ? 260 : 120) * dt;
          bird.x += bird.vx * dt;
          bird.y += bird.vy * dt;
          bird.img.setPosition(bird.x, bird.y).setTexture(Math.floor(t * 14 + k) % 2 === 0 ? "f-pombo-voa-a" : "f-pombo-voa-b").setFlipX(bird.vx < 0);
          if (bird.y < heightAt(road, bird.home) - 1400) bird.img.setVisible(false);
        });
      },
    });
  }

  private hill(track: Course, set: AntenaSet) {
    set.bags.forEach((bx, i) => this.bag(track, bx, BAG_SHIFTS[i]));
    for (const sw of set.seesaws) this.seesaw(track, sw);
    this.mixer2(set.works.x0 + MIXER_X);
    this.frogs(track);
    this.jet(track, set);
    this.crowd(set.works.x0 - 900, 2);
    this.crowd(set.exit + 2600, 2);
  }

  private bag(track: Course, bx: number, shift: number) {
    const s = this.b.scene;
    const road = track.surfaces[0];
    const pivotY = this.b.backY(bx) - 833;
    const len = heightAt(road, bx) - 102 - 120 - pivotY;
    const root = this.add(s.add.container(0, 0));
    root.setDepth(8.2);
    const rope = s.add.graphics();
    const tex = heightOf(s, "a-saco-cimento");
    const img = s.add.image(bx, 0, "a-saco-cimento").setOrigin(0.5, 8 * SAMPLE_RES / tex).setScale(1 / SAMPLE_RES);
    root.add([rope, img]);
    const place = () => {
      const u = ((((this.step + bagPhase(shift)) % BAG_SWING.period) + BAG_SWING.period) % BAG_SWING.period) / BAG_SWING.period;
      const off = BAG_SWING.amp * Math.sin(u * Math.PI * 2);
      const a = Math.asin(Math.max(-0.95, Math.min(0.95, off / len)));
      const x = bx + off;
      const y = pivotY + len * Math.cos(a);
      rope.clear();
      rope.lineStyle(9, INK, 1);
      rope.beginPath();
      rope.moveTo(bx, pivotY);
      rope.lineTo(x, y);
      rope.strokePath();
      rope.lineStyle(4, 0x9aa6b8, 1);
      rope.beginPath();
      rope.moveTo(bx, pivotY);
      rope.lineTo(x, y);
      rope.strokePath();
      img.setPosition(x, y).setRotation(-a);
    };
    place();
    this.actors.push({ x: bx, root, reset: place, update: place });
  }

  private seesaw(track: Course, sw: { x0: number; pivot: number; x1: number }) {
    const s = this.b.scene;
    const road = track.surfaces[0];
    const py = heightAt(road, sw.pivot);
    const up = Math.atan2(py - heightAt(road, sw.x0), sw.pivot - sw.x0);
    const down = Math.atan2(heightAt(road, sw.x1) - py, sw.x1 - sw.pivot);
    const half = Math.max(sw.pivot - sw.x0, sw.x1 - sw.pivot) + 30;
    const lanes = LANE_OFFSETS;
    const depths = [7.55, 5.92, 4.92, 4.02];
    const planks = lanes.map((lane, i) => {
      const g = this.add(s.add.graphics());
      g.setDepth(depths[i]);
      g.setPosition(sw.pivot, py + lane - 4);
      g.fillStyle(INK, 1);
      g.fillRoundedRect(-half - 6, -16, half * 2 + 12, 24, 6);
      g.fillStyle(0xd99a57, 1);
      g.fillRoundedRect(-half, -12, half * 2, 16, 4);
      g.lineStyle(3, INK, 0.4);
      for (let k = -2; k <= 2; k += 1) {
        g.beginPath();
        g.moveTo(k * half * 0.4 - 12, -12);
        g.lineTo(k * half * 0.4 + 12, 4);
        g.strokePath();
      }
      const base = this.add(s.add.graphics());
      base.setDepth(depths[i] - 0.01);
      base.fillStyle(INK, 1);
      base.fillTriangle(sw.pivot - 40, heightAt(road, sw.pivot - 40) + lane + 30, sw.pivot + 40, heightAt(road, sw.pivot + 40) + lane + 30, sw.pivot, py + lane - 6);
      base.fillStyle(0xef4f43, 1);
      base.fillTriangle(sw.pivot - 30, heightAt(road, sw.pivot - 30) + lane + 24, sw.pivot + 30, heightAt(road, sw.pivot + 30) + lane + 24, sw.pivot, py + lane + 2);
      return { g, angle: up, tipped: false };
    });
    const root = this.add(s.add.container(0, 0));
    this.actors.push({
      x: sw.pivot,
      root,
      reset: () => {
        for (const p of planks) {
          p.tipped = false;
          p.angle = up;
          p.g.setRotation(up);
        }
      },
      update: (dt) => {
        planks.forEach((p, i) => {
          if (!p.tipped && this.racers[i] > sw.pivot) p.tipped = true;
          const target = p.tipped ? down : up;
          p.angle += (target - p.angle) * Math.min(1, dt * 18);
          p.g.setRotation(p.angle);
        });
      },
    });
    for (const p of planks) p.g.setRotation(up);
  }

  private mixer2(x0: number) {
    const s = this.b.scene;
    const base = this.b.floorY(x0 - 120, x0 + 120);
    const root = this.add(s.add.container(x0 - 20, base - 150));
    root.setDepth(-8.1);
    const drum = s.add.image(0, 0, "a-betoneira-tambor").setScale(0.8 / SAMPLE_RES);
    root.add(drum);
    this.actors.push({ x: x0, root, reset: () => undefined, update: (_dt, t) => drum.setRotation(Math.sin(t * 2) * 0.05).setScale((0.8 / SAMPLE_RES) * (1 + Math.sin(t * 6) * 0.01), 0.8 / SAMPLE_RES) });
  }

  private frogs(track: Course) {
    const s = this.b.scene;
    const sewer = track.surfaces[1];
    if (!sewer) return;
    const root = this.add(s.add.container(0, 0));
    root.setDepth(0.12);
    const frogs = [700, 1500, 2300, 3200].filter((d) => sewer.x0 + d < sewer.x1 - 300).map((d) => {
      const x = sewer.x0 + d;
      const img = s.add.image(x, heightAt(sewer, x) + 4, "a-sapo-a").setOrigin(0.5, 0.9).setScale(0.8 / SAMPLE_RES);
      root.add(img);
      return { img, x, jump: 0, done: false };
    });
    this.actors.push({
      x: (sewer.x0 + sewer.x1) / 2,
      root,
      reset: () => {
        for (const f of frogs) {
          f.jump = 0;
          f.done = false;
          f.img.setTexture("a-sapo-a").setPosition(f.x, heightAt(sewer, f.x) + 4);
        }
      },
      update: (dt, _t, px) => {
        for (const f of frogs) {
          if (!f.done && px > f.x - 380 && px < f.x) {
            f.done = true;
            f.jump = 1;
            this.bubble(this.copy.croak, f.x, heightAt(sewer, f.x) - 120, 26);
          }
          if (f.jump > 0) {
            f.jump = Math.max(0, f.jump - dt * 1.4);
            const k = 1 - f.jump;
            f.img.setTexture(f.jump > 0.1 ? "a-sapo-b" : "a-sapo-a");
            f.img.setPosition(f.x - k * 160, heightAt(sewer, f.x) + 4 - Math.sin(k * Math.PI) * 200);
          }
        }
      },
    });
  }

  private jet(track: Course, set: AntenaSet) {
    const s = this.b.scene;
    const road = track.surfaces[0];
    const ex = set.exit;
    const ey = heightAt(road, ex) - 30;
    const root = this.add(s.add.container(ex, ey));
    root.setDepth(7.3);
    const g = s.add.graphics();
    root.add(g);
    let burst = 0;
    this.jetState = () => {
      burst = 1.4;
    };
    this.actors.push({
      x: ex,
      root,
      reset: () => {
        burst = 0;
      },
      update: (dt, t) => {
        burst = Math.max(0, burst - dt);
        const h = 60 + burst * 520;
        g.clear();
        for (let i = 0; i < 9; i += 1) {
          const a = t * 9 + i * 0.7;
          const y = -((t * 260 + i * 37) % h);
          g.fillStyle(0x8fd4f7, 0.85);
          g.fillCircle(Math.sin(a) * (12 + burst * 30) * (1 - y / -h), y, 7 + burst * 9);
        }
        g.fillStyle(0xbfe7f6, 0.7);
        g.fillEllipse(0, 6, 120 + burst * 80, 22);
      },
    });
  }

  jetBurst() {
    this.jetState?.();
  }

  flock(clean: boolean) {
    this.flockState?.(clean);
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
    const scale = this.bubbleMin > size ? this.bubbleMin / size : 1;
    t.setOrigin(0.5, 1).setDepth(-1).setScale(scale);
    if (this.bubbleMin > 0) this.bubbles.push({ text: t, x });
    this.b.scene.tweens.add({ targets: t, y: y - 40 * scale, alpha: 0, duration: 800, delay: 300, onComplete: () => t.destroy() });
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
    const shadow = s.add.ellipse(0, 20, 96, 16, INK, 0.28);
    const mascot = s.add.image(0, 20, "mascot-wave").setOrigin(0.5, 1).setScale(0.5);
    root.add([shadow, mascot]);
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
    this.add(s.add.ellipse(x, y + 20, 96, 16, INK, 0.28)).setDepth(-3.01);
    this.finishMascot = this.add(s.add.image(x, y + 20, "mascot-cheer").setOrigin(0.5, 1).setScale(0.5));
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
    if (this.bubbles.length) {
      this.bubbles = this.bubbles.filter((b) => b.text.active);
      for (const b of this.bubbles) {
        const half = (b.text.width * b.text.scaleX) / 2 + this.bubbleMin * 0.5;
        const h = b.text.height * b.text.scaleY;
        b.text.x = Phaser.Math.Clamp(b.x, camX - halfW + half, Math.max(camX - halfW + half, camX + halfW - half));
        if (b.text.y - h < this.bubbleTop) b.text.y = this.bubbleTop + h;
        if (this.avoid.some((a) => b.text.x + half > a.x && b.text.x - half < a.right && b.text.y > a.y && b.text.y - h < a.bottom)) b.text.setAlpha(Math.min(b.text.alpha, 0.2));
      }
    }
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
      this.finishMascot.setY(this.b.backY(this.finishMascot.x) + 20 - jump);
    }
  }
}
