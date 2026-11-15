import * as Phaser from "phaser";
import { FLOOR_Y, TILE } from "../config";
import type { LevelDef } from "../levels";
import { INK_HEX, cartoonText } from "../../kit/ui";
import type { StageApi } from "./enemies";
import { cx, cy } from "./world";

export type HeroState = { x: number; feet: number; top: number; vx: number; vy: number; grounded: boolean };

const LOCKER_COLORS = [0xef4f43, 0x5cb9f0, 0x63d6c1, 0xffc83d];

export function makeGadgetTextures(scene: Phaser.Scene) {
  const tex = scene.textures;
  const gfx = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
    if (tex.exists(key)) return;
    const g = scene.make.graphics({}, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  LOCKER_COLORS.forEach((color, i) => {
    gfx(`locker-body-${i}`, 96, 226, (g) => {
      g.fillStyle(INK_HEX, 1);
      g.fillRoundedRect(2, 2, 92, 222, 8);
      g.fillStyle(0x2b2150, 1);
      g.fillRoundedRect(8, 8, 80, 210, 5);
      g.fillStyle(color, 0.35);
      g.fillRect(14, 120, 68, 40);
      g.fillStyle(0xfbf5e6, 1);
      g.fillRect(20, 40, 24, 30);
      g.lineStyle(2, INK_HEX, 1);
      g.strokeRect(20, 40, 24, 30);
      g.fillStyle(0xef4f43, 1);
      g.fillCircle(62, 172, 13);
      g.lineStyle(3, INK_HEX, 1);
      g.strokeCircle(62, 172, 13);
    });
    gfx(`locker-door-${i}`, 84, 214, (g) => {
      g.fillStyle(INK_HEX, 1);
      g.fillRoundedRect(0, 0, 84, 214, 6);
      g.fillStyle(color, 1);
      g.fillRoundedRect(4, 4, 76, 206, 4);
      g.fillStyle(0xffffff, 0.22);
      g.fillRect(8, 8, 10, 198);
      g.lineStyle(4, INK_HEX, 1);
      for (const y of [26, 38, 50, 62]) g.lineBetween(22, y, 62, y);
      g.fillStyle(0xfbf5e6, 1);
      g.fillRoundedRect(60, 96, 10, 30, 4);
      g.lineStyle(3, INK_HEX, 1);
      g.strokeRoundedRect(60, 96, 10, 30, 4);
    });
  });
  gfx("eye-big", 96, 60, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillEllipse(48, 32, 90, 54);
    g.fillStyle(0xfbf5e6, 1);
    g.fillEllipse(48, 30, 80, 44);
    g.fillStyle(0x5cb9f0, 1);
    g.fillCircle(48, 30, 15);
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(48, 30, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(53, 25, 4);
  });
}

export class Locker {
  readonly x: number;
  private body: Phaser.GameObjects.Image;
  private door: Phaser.GameObjects.Image;
  private state: "idle" | "rattle" | "open" | "closing" | "shut" = "idle";
  private until = 0;
  private hitUntil = 0;
  private alarm: Phaser.GameObjects.Text | null = null;

  constructor(
    private api: StageApi,
    col: number,
    index: number,
  ) {
    const scene = api.scene;
    const c = index % LOCKER_COLORS.length;
    this.x = cx(col) + TILE / 2;
    scene.add.image(this.x, FLOOR_Y + 3, "blob").setDepth(8.4).setDisplaySize(110, 26).setAlpha(0.7);
    this.body = scene.add.image(this.x, FLOOR_Y, `locker-body-${c}`).setOrigin(0.5, 1).setDepth(8.5);
    this.door = scene.add.image(this.x - 40, FLOOR_Y - 6, `locker-door-${c}`).setOrigin(0, 1).setDepth(8.6);
  }

  get hinge() {
    return this.x - 40;
  }

  update(t: number, h: HeroState) {
    switch (this.state) {
      case "idle":
        if (h.x > this.x - 340 && h.x < this.x - 70 && h.vx > 40 && Math.abs(h.feet - FLOOR_Y) < 120) {
          this.state = "rattle";
          this.until = t + 460;
          this.alarm = this.api.warn(this.x, FLOOR_Y - 270, 460);
          this.api.sfx("alert", 0.55);
          if (!this.api.reduced) this.api.scene.tweens.add({ targets: this.door, x: this.hinge + 3, duration: 45, yoyo: true, repeat: 4, onComplete: () => this.door.setX(this.hinge) });
        }
        return;
      case "rattle":
        if (t < this.until) return;
        this.state = "open";
        this.until = t + 1000;
        this.hitUntil = t + 300;
        this.alarm = null;
        this.api.sfx("door", 0.9);
        this.api.word("BAM!", this.hinge - 50, FLOOR_Y - 230, "#ffc83d", 44);
        if (this.api.reduced) this.door.setScale(-1, 1);
        else this.api.scene.tweens.add({ targets: this.door, scaleX: -1, duration: 110, ease: "Quad.easeOut" });
        return;
      case "open":
        if (t < this.until) return;
        this.state = "closing";
        this.until = t + 1800;
        if (this.api.reduced) this.door.setScale(1, 1);
        else this.api.scene.tweens.add({ targets: this.door, scaleX: 1, duration: 220, ease: "Quad.easeIn" });
        return;
      case "closing":
        if (t >= this.until && (h.x < this.x - 360 || h.x > this.x + 60)) this.state = "idle";
        return;
    }
  }

  hitBox(t: number) {
    if (this.state !== "open" || t > this.hitUntil) return null;
    return new Phaser.Geom.Rectangle(this.hinge - 86, FLOOR_Y - 200, 86, 190);
  }

  bounds() {
    return new Phaser.Geom.Rectangle(this.x - 48, FLOOR_Y - 226, 96, 226);
  }

  slam() {
    if (this.state !== "rattle") return false;
    this.state = "shut";
    this.alarm?.destroy();
    this.alarm = null;
    this.api.scene.tweens.killTweensOf(this.door);
    this.door.setX(this.hinge).setScale(1, 1);
    this.api.sfx("block", 0.9);
    this.api.word("BLAM!", this.x, FLOOR_Y - 250, "#9df0dc", 42);
    return true;
  }
}

export class Watcher {
  readonly x: number;
  private sprite: Phaser.GameObjects.Image;
  private paper: Phaser.GameObjects.Container;
  private eye: Phaser.GameObjects.Image;
  private phase: "asleep" | "read" | "peek" | "look" = "asleep";
  private until = 0;
  private caught = false;
  private turn = 0;
  private readonly paperY: number;

  constructor(
    private api: StageApi,
    col: number,
    private look: number,
    font: string,
    private onCaught: (x: number, dir: number) => void,
  ) {
    const scene = api.scene;
    this.x = cx(col) + TILE / 2;
    this.sprite = scene.add.image(this.x, FLOOR_Y - 8, "mon-common-walk-a").setOrigin(0.5, 1).setScale(0.86).setDepth(8.6);
    const booth = scene.add.graphics().setDepth(8.7);
    booth.fillStyle(INK_HEX, 1);
    booth.fillRoundedRect(this.x - 92, FLOOR_Y - 118, 184, 120, 10);
    booth.fillStyle(0x7b62c4, 1);
    booth.fillRoundedRect(this.x - 86, FLOOR_Y - 112, 172, 110, 7);
    booth.fillStyle(0x5a46a0, 1);
    booth.fillRect(this.x + 46, FLOOR_Y - 112, 40, 110);
    booth.fillStyle(INK_HEX, 1);
    booth.fillRoundedRect(this.x - 100, FLOOR_Y - 130, 200, 18, 6);
    booth.fillStyle(0x9a86e0, 1);
    booth.fillRoundedRect(this.x - 96, FLOOR_Y - 127, 192, 12, 4);
    const plaqueBg = scene.add.graphics().setDepth(8.75);
    plaqueBg.fillStyle(INK_HEX, 1);
    plaqueBg.fillRoundedRect(this.x - 52, FLOOR_Y - 90, 104, 40, 8);
    plaqueBg.fillStyle(0xffc83d, 1);
    plaqueBg.fillRoundedRect(this.x - 48, FLOOR_Y - 86, 96, 32, 6);
    cartoonText(scene, this.x, FLOOR_Y - 70, "VIGIA", { size: 22, color: "#1d1830", font, stroke: 0, shadow: false }).setOrigin(0.5).setDepth(8.8);
    this.paperY = FLOOR_Y - 162;
    const pg = scene.add.graphics();
    pg.fillStyle(INK_HEX, 1);
    pg.fillRoundedRect(-66, -48, 132, 96, 6);
    pg.fillStyle(0xfbf5e6, 1);
    pg.fillRoundedRect(-62, -44, 124, 88, 4);
    pg.fillStyle(0xe6dcc4, 1);
    pg.fillRect(-2, -44, 4, 88);
    pg.fillStyle(INK_HEX, 1);
    pg.fillRect(-52, -36, 44, 9);
    pg.fillRect(8, -36, 44, 9);
    pg.fillStyle(0x9aa6b8, 1);
    for (const y of [-18, -8, 2, 12, 22, 32]) {
      pg.fillRect(-52, y, 44, 4);
      pg.fillRect(8, y, 44, 4);
    }
    this.paper = scene.add.container(this.x, this.paperY, [pg]).setDepth(8.9);
    this.eye = scene.add.image(this.x, FLOOR_Y - 330, "eye-big").setDepth(41).setVisible(false);
  }

  get watching() {
    return this.phase === "look";
  }

  update(t: number, h: HeroState) {
    const near = Math.abs(h.x - this.x) < 1150;
    if (this.phase === "asleep") {
      if (!near) return;
      this.phase = "read";
      this.until = t + 1500;
      return;
    }
    if (this.phase === "read") {
      if (t < this.until) return;
      if (!near) {
        this.until = t + 600;
        return;
      }
      this.phase = "peek";
      this.until = t + 760;
      this.api.sfx("alert", 0.45);
      this.api.word("HMM...", this.x, FLOOR_Y - 290, "#fbf5e6", 34);
      if (!this.api.reduced) this.api.scene.tweens.add({ targets: this.paper, angle: { from: -6, to: 6 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => this.paper.setAngle(0) });
      return;
    }
    if (this.phase === "peek") {
      if (t < this.until) return;
      this.phase = "look";
      this.until = t + this.look;
      this.caught = false;
      this.eye.setVisible(true).setScale(0.4);
      if (this.api.reduced) {
        this.eye.setScale(1);
        this.paper.setY(this.paperY + 78);
      } else {
        this.api.scene.tweens.add({ targets: this.eye, scale: 1, duration: 160, ease: "Back.easeOut" });
        this.api.scene.tweens.add({ targets: this.paper, y: this.paperY + 78, duration: 150, ease: "Quad.easeOut" });
      }
      this.api.word("ESTÁTUA!", this.x, FLOOR_Y - 400, "#ffc83d", 40);
      return;
    }
    if (!this.caught && Math.abs(h.x - this.x) < 780 && (Math.abs(h.vx) > 45 || !h.grounded)) {
      this.caught = true;
      const dir = Math.sign(h.x - this.x) || 1;
      this.eye.setTint(0xff9b8a);
      this.api.word("TE VI!", this.x, FLOOR_Y - 400, "#ef4f43", 48);
      this.api.sfx("bigWhistle", 0.8);
      this.api.scene.time.delayedCall(320, () => this.onCaught(this.x + dir * 90, dir));
    }
    if (t < this.until) return;
    this.phase = "read";
    this.turn += 1;
    this.until = t + [2600, 2100, 3000][this.turn % 3];
    this.eye.clearTint();
    if (this.api.reduced) {
      this.eye.setVisible(false);
      this.paper.setY(this.paperY);
      return;
    }
    this.api.scene.tweens.add({ targets: this.eye, scale: 0.3, duration: 120, onComplete: () => this.eye.setVisible(false) });
    this.api.scene.tweens.add({ targets: this.paper, y: this.paperY, duration: 180, ease: "Quad.easeIn" });
  }
}

export class Rope {
  readonly x0: number;
  readonly x1: number;
  private g: Phaser.GameObjects.Graphics;
  private kids: Phaser.GameObjects.Image[];
  private swept = -1;
  private handY = FLOOR_Y - 118;
  private period: number;
  private curve: Phaser.Curves.QuadraticBezier;

  constructor(
    private api: StageApi,
    def: NonNullable<LevelDef["ropes"]>[number],
  ) {
    const scene = api.scene;
    this.x0 = cx(def.col);
    this.x1 = cx(def.col + def.w);
    this.period = def.period;
    this.kids = [
      scene.add.image(this.x0 - 34, FLOOR_Y, "kid-lina-a").setOrigin(0.5, 1).setDepth(8.6).setScale(0.86),
      scene.add.image(this.x1 + 34, FLOOR_Y, "kid-mila-a").setOrigin(0.5, 1).setDepth(8.6).setScale(0.86).setFlipX(true),
    ];
    this.g = scene.add.graphics().setDepth(13);
    this.curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(this.x0, this.handY), new Phaser.Math.Vector2((this.x0 + this.x1) / 2, this.handY), new Phaser.Math.Vector2(this.x1, this.handY));
  }

  update(t: number, h: HeroState) {
    const k = (t % this.period) / this.period;
    const a = k * Math.PI * 2;
    const low = Math.cos(a);
    const front = Math.sin(a) > 0;
    const mid = this.handY + 112 * low;
    const ctrl = 2 * mid - this.handY;
    const g = this.g;
    g.clear().setDepth(front ? 21 : 13);
    const curve = this.curve;
    curve.p1.y = ctrl;
    g.lineStyle(9, INK_HEX, 1);
    curve.draw(g, 24);
    g.lineStyle(4, front ? 0xf06ba8 : 0xc24f86, 1);
    curve.draw(g, 24);
    const pose = low > 0 ? "a" : "b";
    this.kids[0].setTexture(`kid-lina-${pose}`);
    this.kids[1].setTexture(`kid-mila-${pose}`);
    const sweep = Math.floor(t / this.period);
    if (low > 0.93 && sweep !== this.swept && h.x > this.x0 + 16 && h.x < this.x1 - 16 && h.feet > FLOOR_Y - 30) {
      this.swept = sweep;
      return true;
    }
    return false;
  }

  near(x: number) {
    return x > this.x0 - 500 && x < this.x0;
  }
}

export class Pad {
  readonly x: number;
  readonly top = FLOOR_Y - 40;
  readonly zone: Phaser.GameObjects.Zone;
  private mat: Phaser.GameObjects.Container;

  constructor(
    private api: StageApi,
    col: number,
  ) {
    const scene = api.scene;
    this.x = cx(col) + TILE / 2;
    scene.add.image(this.x, FLOOR_Y + 3, "blob").setDepth(5.3).setDisplaySize(170, 26).setAlpha(0.7);
    const g = scene.add.graphics();
    g.lineStyle(10, INK_HEX, 1);
    g.lineBetween(-56, 0, -64, 40);
    g.lineBetween(56, 0, 64, 40);
    g.lineStyle(5, 0x9aa6b8, 1);
    g.lineBetween(-56, 0, -64, 40);
    g.lineBetween(56, 0, 64, 40);
    g.fillStyle(INK_HEX, 1);
    g.fillEllipse(0, 0, 160, 34);
    g.fillStyle(0xef4f43, 1);
    g.fillEllipse(0, -2, 150, 26);
    g.fillStyle(0x5cb9f0, 1);
    g.fillEllipse(0, -3, 118, 16);
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(-20, -6, 50, 6);
    this.mat = scene.add.container(this.x, this.top, [g]).setDepth(6.5);
    this.zone = scene.add.zone(this.x, this.top + 8, 140, 16);
    scene.physics.add.existing(this.zone, true);
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }

  landed(h: HeroState) {
    return h.grounded && Math.abs(h.x - this.x) < 74 && Math.abs(h.feet - this.top) < 10;
  }

  boing() {
    this.api.sfx("boing", 1);
    if (this.api.reduced) return;
    this.api.scene.tweens.killTweensOf(this.mat);
    this.mat.setScale(1.12, 0.6);
    this.api.scene.tweens.add({ targets: this.mat, scaleX: 1, scaleY: 1, duration: 420, ease: "Elastic.easeOut", easeParams: [1.3, 0.35] });
  }
}

export class Searchlight {
  private g: Phaser.GameObjects.Graphics;
  private lamp: Phaser.GameObjects.Image;
  private state: "sweep" | "spot" | "alarm" = "sweep";
  private until = 0;
  private clock = 0;
  spotX: number;
  private readonly mid: number;
  private readonly span: number;

  constructor(
    private api: StageApi,
    private def: NonNullable<LevelDef["lights"]>[number],
  ) {
    const scene = api.scene;
    this.mid = cx(def.col) + TILE / 2;
    this.span = def.span * TILE;
    this.spotX = this.mid;
    this.lamp = scene.add.image(this.mid, 96, "lamp-warm").setOrigin(0.5, 0).setDepth(1.4).setScale(0.9).setTint(0xfff0a0);
    this.g = scene.add.graphics().setDepth(5.6);
  }

  update(t: number, dt: number, h: HeroState) {
    if (this.state === "sweep") this.clock += dt * 1000;
    if (this.state !== "alarm") this.spotX = this.mid + Math.sin((this.clock / this.def.period) * Math.PI * 2) * this.span;
    else this.spotX = Phaser.Math.Linear(this.spotX, h.x, 0.12);
    const inside = Math.abs(h.x - this.spotX) < 96 && h.feet > FLOOR_Y - 150;
    let caught = false;
    if (this.state === "sweep" && inside) {
      this.state = "spot";
      this.until = t + 340;
      this.api.warn(h.x, h.top - 70, 340);
      this.api.sfx("alert", 0.6);
    } else if (this.state === "spot") {
      if (!inside) this.state = "sweep";
      else if (t >= this.until) {
        this.state = "alarm";
        this.until = t + 1400;
        caught = true;
        this.api.word("FLAGRA!", h.x, h.top - 90, "#ef4f43", 44);
      }
    } else if (this.state === "alarm" && t >= this.until) this.state = "sweep";
    this.draw();
    return caught;
  }

  private draw() {
    const g = this.g;
    g.clear();
    const red = this.state === "alarm";
    const color = red ? 0xef4f43 : 0xfff2a8;
    g.fillStyle(color, red ? 0.2 : 0.16);
    g.fillTriangle(this.mid - 22, 150, this.mid + 22, 150, this.spotX - 118, FLOOR_Y);
    g.fillTriangle(this.mid + 22, 150, this.spotX - 118, FLOOR_Y, this.spotX + 118, FLOOR_Y);
    g.fillStyle(color, red ? 0.5 : 0.38);
    g.fillEllipse(this.spotX, FLOOR_Y + 6, 236, 34);
    g.lineStyle(3, red ? 0xef4f43 : 0xffc83d, 0.9);
    g.strokeEllipse(this.spotX, FLOOR_Y + 6, 236, 34);
    this.lamp.setTint(red ? 0xff8a7a : 0xfff0a0);
  }

  near(x: number) {
    return Math.abs(x - this.mid) < this.span + 600;
  }
}

export class WobblyShelf {
  readonly zone: Phaser.GameObjects.Zone;
  private img: Phaser.GameObjects.Graphics;
  private state: "solid" | "wobble" | "fall" = "solid";
  private until = 0;
  readonly x0: number;
  readonly w: number;
  readonly y: number;

  constructor(
    private api: StageApi,
    pl: LevelDef["platforms"][number],
  ) {
    const scene = api.scene;
    this.x0 = cx(pl.col);
    this.w = pl.w * TILE;
    this.y = cy(pl.row);
    const g = scene.add.graphics();
    const w = this.w;
    for (const bx of [14, w - 14]) {
      const d = bx < w / 2 ? 1 : -1;
      g.fillStyle(INK_HEX, 1);
      g.fillTriangle(bx - d * 3, 18, bx + d * 30, 18, bx - d * 3, 56);
      g.fillStyle(0x7d4526, 1);
      g.fillTriangle(bx + d * 2, 22, bx + d * 20, 22, bx + d * 2, 44);
    }
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(-4, -5, w + 8, 32, 8);
    g.fillStyle(0x7c4527, 1);
    g.fillRoundedRect(0, -1, w, 24, 6);
    g.fillStyle(0xb5794a, 1);
    g.fillRoundedRect(0, -1, w, 10, { tl: 6, tr: 6, bl: 0, br: 0 });
    g.lineStyle(4, INK_HEX, 1);
    g.lineBetween(w * 0.45, -1, w * 0.52, 10);
    g.lineBetween(w * 0.52, 10, w * 0.47, 22);
    g.fillStyle(0xffc83d, 1);
    g.fillRoundedRect(w / 2 - 24, 30, 48, 18, 4);
    g.lineStyle(2.5, INK_HEX, 1);
    g.strokeRoundedRect(w / 2 - 24, 30, 48, 18, 4);
    g.lineBetween(w / 2 - 14, 39, w / 2 + 14, 39);
    this.img = g.setPosition(this.x0, this.y).setDepth(4.2);
    this.zone = scene.add.zone(this.x0 + this.w / 2, this.y + 10, this.w, 20);
    scene.physics.add.existing(this.zone, true);
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }

  update(t: number, h: HeroState) {
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
    if (this.state === "solid") {
      if (h.grounded && h.x > this.x0 - 10 && h.x < this.x0 + this.w + 10 && Math.abs(h.feet - this.y) < 10) {
        this.state = "wobble";
        this.until = t + 520;
        this.api.sfx("roll", 0.7);
        if (!this.api.reduced) this.api.scene.tweens.add({ targets: this.img, angle: { from: -2, to: 2 }, duration: 60, yoyo: true, repeat: 3, onComplete: () => this.img.setAngle(0) });
      }
      return;
    }
    if (this.state === "wobble") {
      if (t < this.until) return;
      this.state = "fall";
      this.until = t + 3200;
      body.enable = false;
      this.api.sfx("crash", 0.6);
      if (this.api.reduced) this.img.setVisible(false);
      else this.api.scene.tweens.add({ targets: this.img, y: this.y + 520, angle: 24, alpha: 0, duration: 700, ease: "Quad.easeIn" });
      return;
    }
    if (t < this.until) return;
    this.state = "solid";
    body.enable = true;
    this.api.scene.tweens.killTweensOf(this.img);
    this.img.setPosition(this.x0, this.y).setAngle(0).setVisible(true).setAlpha(this.api.reduced ? 1 : 0);
    if (!this.api.reduced) this.api.scene.tweens.add({ targets: this.img, alpha: 1, duration: 300 });
  }

  near(x: number) {
    return x > this.x0 - 500 && x < this.x0 + this.w;
  }
}
