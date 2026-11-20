import * as Phaser from "phaser";

export const INK = 0x1d1830;
export const ART_RES = 1.5;
export const HEAD_SCALE = 0.42;

export type RiderId = "deco" | "lina" | "bruno";

export const EXPRESSIONS = ["normal", "strain", "wow", "happy", "panic", "dizzy", "smug", "sad"] as const;

export type Expression = (typeof EXPRESSIONS)[number];

export const ARM_POSES = ["steer", "up", "flail", "grip"] as const;

export type ArmPose = (typeof ARM_POSES)[number];

export type Reaction = "go" | "perfect" | "ok" | "crash" | "recover" | "hit" | "passed" | "passedBy" | "dusted" | "win" | "lose" | "prep";

type View = { key: string; x: number; y: number; w: number; h: number };

type Rig = {
  seat: [number, number];
  back: View;
  front: View;
  wheels: { key: string; x: number; r: number }[];
  fan?: [number, number];
  rope?: [number, number];
  colors: number[];
};

export const RIGS: Record<RiderId, Rig> = {
  deco: {
    seat: [-30, -60],
    back: { key: "cart-deco-back", x: -110, y: -160, w: 230, h: 140 },
    front: { key: "cart-deco-front", x: -110, y: -160, w: 230, h: 140 },
    wheels: [
      { key: "wheel-mower", x: -58, r: 27 },
      { key: "wheel-bearing", x: 62, r: 17 },
    ],
    rope: [100, -108],
    colors: [0xb06c3f, 0x7c4527, 0xef4f43],
  },
  lina: {
    seat: [-22, -62],
    back: { key: "cart-lina-back", x: -180, y: -160, w: 290, h: 140 },
    front: { key: "cart-lina-front", x: -180, y: -160, w: 290, h: 140 },
    wheels: [
      { key: "wheel-caster", x: -58, r: 16 },
      { key: "wheel-caster", x: 64, r: 16 },
    ],
    fan: [-132, -104],
    colors: [0x9aa6b8, 0x63d6c1, 0xef4f43],
  },
  bruno: {
    seat: [-24, -68],
    back: { key: "cart-bruno-back", x: -120, y: -210, w: 250, h: 190 },
    front: { key: "cart-bruno-front", x: -120, y: -210, w: 250, h: 190 },
    wheels: [
      { key: "wheel-neat", x: -58, r: 21 },
      { key: "wheel-neat", x: 62, r: 21 },
    ],
    colors: [0x5cb9f0, 0xffe39a, 0xff8a3d],
  },
};

export function artFiles(): { key: string; file: string; scale: number }[] {
  const out: { key: string; file: string; scale: number }[] = [];
  for (const who of Object.keys(RIGS) as RiderId[]) {
    for (const e of EXPRESSIONS) out.push({ key: `${who}-head-${e}`, file: `${who}-head-${e}`, scale: ART_RES * HEAD_SCALE * 1.6 });
    for (const a of ARM_POSES) out.push({ key: `${who}-arm-${a}`, file: `${who}-arm-${a}`, scale: ART_RES });
    out.push({ key: `${who}-body`, file: `${who}-body`, scale: ART_RES });
    out.push({ key: `cart-${who}-back`, file: `cart-${who}-back`, scale: ART_RES });
    out.push({ key: `cart-${who}-front`, file: `cart-${who}-front`, scale: ART_RES });
  }
  for (const w of ["wheel-mower", "wheel-bearing", "wheel-caster", "wheel-neat", "fan-blades"]) out.push({ key: w, file: w, scale: ART_RES });
  return out;
}

export type CartPose = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  crouch: boolean;
  charge: number;
  air: boolean;
  spin: number;
  accel: number;
  bigAir: boolean;
  brace: boolean;
  paddling: boolean;
  distance: number;
  crash: number;
  time: number;
  countdown?: boolean;
};

const HEAD_TEX_SCALE = ART_RES * HEAD_SCALE * 1.6;

function image(scene: Phaser.Scene, view: View) {
  const img = scene.add.image(0, 0, view.key);
  img.setOrigin(-view.x / view.w, -view.y / view.h);
  img.setScale(1 / ART_RES);
  return img;
}

type Flyer = { img: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; spin: number; home: () => { x: number; y: number; r: number } };

export class CartView {
  readonly who: RiderId;
  readonly rig: Rig;
  readonly back: Phaser.GameObjects.Container;
  readonly front: Phaser.GameObjects.Container;
  readonly rider: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly layer: Phaser.GameObjects.Layer;
  private readonly backImg: Phaser.GameObjects.Image;
  private readonly frontImg: Phaser.GameObjects.Image;
  private readonly wheels: Phaser.GameObjects.Image[];
  private readonly fan?: Phaser.GameObjects.Image;
  private readonly body: Phaser.GameObjects.Image;
  private readonly head: Phaser.GameObjects.Image;
  private readonly arm: Phaser.GameObjects.Image;
  private readonly rope?: Phaser.GameObjects.Graphics;
  private readonly leg: Phaser.GameObjects.Graphics;
  private readonly images: Phaser.GameObjects.Image[];
  private squashT = 1;
  private squashAmount = 0;
  private stretchT = 1;
  private crouchBlend = 0;
  private crashSpin = 0;
  private tilt = 0;
  private tiltVel = 0;
  private lag = 0;
  private lagVel = 0;
  private lastAngle = 0;
  private wobble = 0;
  private bent = 0;
  private spinBlend = 0;
  private faceOverride: { expr: Expression; left: number } | null = null;
  private armOverride: { pose: ArmPose; left: number } | null = null;
  private hold: { expr: Expression; pose: ArmPose } | null = null;
  private shownExpr: Expression | null = null;
  private shownArm: ArmPose | null = null;
  private flyers: Flyer[] = [];
  private helmet: Phaser.GameObjects.Image | null = null;
  private crashing = false;
  private readonly baseScale: number;
  private elapsed = 0;
  label?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer, who: RiderId, opts: { alpha?: number; ghost?: boolean; scale?: number } = {}) {
    this.scene = scene;
    this.layer = layer;
    this.who = who;
    this.rig = RIGS[who];
    this.baseScale = opts.scale ?? 1;
    this.back = scene.add.container(0, 0);
    this.front = scene.add.container(0, 0);
    this.rider = scene.add.container(0, 0);
    this.backImg = image(scene, this.rig.back);
    this.back.add(this.backImg);
    if (this.rig.fan) {
      this.fan = scene.add.image(this.rig.fan[0], this.rig.fan[1], "fan-blades").setScale(1 / ART_RES);
      this.back.add(this.fan);
    }
    this.frontImg = image(scene, this.rig.front);
    this.front.add(this.frontImg);
    this.wheels = this.rig.wheels.map((w) => scene.add.image(w.x, -w.r, w.key).setScale(1 / ART_RES));
    this.front.add(this.wheels);
    if (this.rig.rope) {
      this.rope = scene.add.graphics();
      layer.add(this.rope);
    }
    this.leg = scene.add.graphics();
    this.body = scene.add.image(0, 0, `${who}-body`).setOrigin(60 / 170, 100 / 130).setScale(1 / ART_RES);
    this.head = scene.add.image(8, -62, `${who}-head-normal`).setOrigin(93 / 186, 176 / 190).setScale(HEAD_SCALE / HEAD_TEX_SCALE);
    this.arm = scene.add.image(6, -54, `${who}-arm-steer`).setOrigin(60 / 130, 90 / 160).setScale(1 / ART_RES);
    this.rider.add([this.leg, this.body, this.head, this.arm]);
    this.images = [this.backImg, this.frontImg, ...this.wheels, this.body, this.head, this.arm, ...(this.fan ? [this.fan] : [])];
    layer.add(this.back);
    layer.add(this.rider);
    layer.add(this.front);
    if (opts.ghost) for (const img of this.images) img.setTintFill(0xffffff);
    this.setAlpha(opts.alpha ?? 1);
  }

  setDepth(depth: number) {
    this.back.setDepth(depth);
    this.rider.setDepth(depth + 0.1);
    this.front.setDepth(depth + 0.2);
    this.rope?.setDepth(depth + 0.3);
  }

  setVisible(visible: boolean) {
    this.back.setVisible(visible);
    this.front.setVisible(visible);
    this.rider.setVisible(visible);
    this.rope?.setVisible(visible);
    this.label?.setVisible(visible);
  }

  setAlpha(alpha: number) {
    this.back.setAlpha(alpha);
    this.front.setAlpha(alpha);
    this.rider.setAlpha(alpha);
    this.rope?.setAlpha(alpha);
  }

  land(strength: number) {
    this.squashT = 0;
    this.squashAmount = Math.min(1, strength);
    this.tiltVel += 5 * strength;
  }

  rough(strength: number) {
    this.land(strength);
    this.wobble = 0.24 * Math.min(1, strength + 0.4);
    this.bent = 1;
  }

  takeoff(power: number) {
    this.stretchT = 0;
    this.tiltVel -= 3 + power * 4;
  }

  setDusty(on: boolean) {
    for (const img of this.images) {
      if (on) img.setTint(0xe9e4da);
      else img.clearTint();
    }
  }

  setHelmet(on: boolean) {
    if (on && !this.helmet && this.scene.textures.exists("f-melancia-capacete")) {
      this.helmet = this.scene.add.image(0, 0, "f-melancia-capacete").setOrigin(0.5, 0.8).setScale(0.8);
      this.rider.add(this.helmet);
    }
    this.helmet?.setVisible(on);
  }

  setHold(expr: Expression | null, pose: ArmPose = "steer") {
    this.hold = expr ? { expr, pose } : null;
  }

  react(kind: Reaction) {
    const face = (expr: Expression, left: number) => (this.faceOverride = { expr, left });
    const arm = (pose: ArmPose, left: number) => (this.armOverride = { pose, left });
    switch (kind) {
      case "go":
        face("happy", 0.7);
        arm("grip", 0.4);
        break;
      case "perfect":
        face("happy", 0.8);
        arm("up", 0.5);
        break;
      case "ok":
        face("panic", 0.45);
        arm("flail", 0.45);
        break;
      case "hit":
        face("wow", 0.5);
        break;
      case "recover":
        face("dizzy", 0.9);
        break;
      case "passed":
        face("smug", 1);
        break;
      case "passedBy":
        face("sad", 0.8);
        break;
      case "dusted":
        face("sad", 0.7);
        arm("flail", 0.3);
        break;
      case "win":
        this.hold = { expr: "happy", pose: "up" };
        break;
      case "lose":
        this.hold = { expr: "sad", pose: "steer" };
        break;
      case "prep":
        break;
      case "crash":
        break;
    }
  }

  private setFace(expr: Expression) {
    if (expr === this.shownExpr) return;
    this.shownExpr = expr;
    this.head.setTexture(`${this.who}-head-${expr}`);
  }

  private setArm(pose: ArmPose) {
    if (pose === this.shownArm) return;
    this.shownArm = pose;
    this.arm.setTexture(`${this.who}-arm-${pose}`);
  }

  private startCrash(x: number, y: number, angle: number, speed: number) {
    this.crashing = true;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const make = (tex: string, lx: number, ly: number, view?: View, scale = 1 / ART_RES) => {
      const img = this.scene.add.image(0, 0, tex).setScale(scale * this.baseScale);
      if (view) img.setOrigin(-view.x / view.w, -view.y / view.h);
      this.layer.add(img);
      img.setDepth(this.front.depth + 0.5);
      const wx = x + lx * cos - ly * sin;
      const wy = y + lx * sin + ly * cos;
      return { img, x: wx, y: wy };
    };
    const back = make(this.rig.back.key, 0, 0, this.rig.back);
    this.backImg.setVisible(false);
    if (this.fan) this.fan.setVisible(false);
    const w = this.rig.wheels[1];
    const wheel = make(w.key, w.x, -w.r);
    this.wheels[1].setVisible(false);
    const vx = Math.max(250, speed * 0.45);
    this.flyers = [
      { ...back, vx: vx * 0.8, vy: -700, spin: -7, home: () => this.homeOf(0, 0) },
      { ...wheel, vx: vx * 1.2, vy: -420, spin: 14, home: () => this.homeOf(w.x, -w.r) },
    ];
  }

  private homeOf(lx: number, ly: number) {
    const a = this.front.rotation;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x: this.front.x + lx * c - ly * s, y: this.front.y + lx * s + ly * c, r: a };
  }

  private updateFlyers(dt: number, crash: number) {
    const back = crash > 0.72;
    for (const f of this.flyers) {
      if (back) {
        const h = f.home();
        const k = Math.min(1, dt * 14);
        f.x += (h.x - f.x) * k;
        f.y += (h.y - f.y) * k;
        f.img.rotation += (h.r - f.img.rotation) * k;
      } else {
        f.vy += 1900 * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vx *= 1 - Math.min(1, dt * 1.5);
        f.img.rotation += f.spin * dt;
      }
      f.img.setPosition(f.x, f.y);
    }
  }

  private endCrash() {
    this.crashing = false;
    for (const f of this.flyers) f.img.destroy();
    this.flyers = [];
    this.backImg.setVisible(true);
    this.fan?.setVisible(true);
    this.wheels[1].setVisible(true);
  }

  update(pose: CartPose, dt: number) {
    this.elapsed += dt;
    const crashing = pose.crash > 0;
    if (crashing && !this.crashing) this.startCrash(pose.x, pose.y, pose.angle, pose.speed);
    if (!crashing && this.crashing) this.endCrash();
    if (this.crashing) this.updateFlyers(dt, pose.crash);
    this.squashT = Math.min(1, this.squashT + dt / 0.22);
    this.stretchT = Math.min(1, this.stretchT + dt / 0.16);
    const crouchTarget = pose.crouch || (pose.air && Math.abs(pose.spin) > 2.5) || pose.brace ? 1 : 0;
    this.crouchBlend += (crouchTarget - this.crouchBlend) * Math.min(1, dt * 16);
    this.spinBlend += ((Math.abs(pose.spin) > 2.5 ? 1 : 0) - this.spinBlend) * Math.min(1, dt * 10);
    const squash = Math.sin((1 - this.squashT) * Math.PI) * (1 - this.squashT) * this.squashAmount;
    const stretch = (1 - this.stretchT) * (1 - this.stretchT);
    const suspension = this.crouchBlend * 0.05;
    const sy = (1 - squash * 0.34 + stretch * 0.14 - suspension) * this.baseScale;
    const sx = (1 + squash * 0.2 - stretch * 0.08 + suspension * 0.4) * this.baseScale;
    if (crashing) this.crashSpin += dt * 13 * Math.max(0.15, 1 - pose.crash);
    else this.crashSpin = 0;
    this.wobble *= Math.max(0, 1 - dt * 3);
    this.bent = Math.max(0, this.bent - dt * 1.3);
    const rock = this.wobble * Math.sin(pose.time * 24);
    const tumble = crashing ? Math.sin(Math.min(1, pose.crash * 1.3) * Math.PI) * 0.9 + this.crashSpin * 0.2 * (pose.crash < 0.72 ? 1 : 0) : 0;
    const angle = pose.angle + tumble + rock;
    let dA = angle - this.lastAngle;
    while (dA > Math.PI) dA -= Math.PI * 2;
    while (dA < -Math.PI) dA += Math.PI * 2;
    this.lastAngle = angle;
    if (!crashing && dt > 0 && Math.abs(dA) < 0.6) this.lag -= dA * 0.55;
    const speedK = Math.min(1, pose.speed / 2200);
    const tiltTarget = this.crouchBlend * 0.36 - Math.max(-0.25, Math.min(0.25, pose.accel * 0.18)) - speedK * 0.08;
    const springSteps = Math.ceil(dt * 40);
    const h = springSteps > 0 ? dt / springSteps : 0;
    for (let i = 0; i < springSteps; i += 1) {
      this.lagVel += (-this.lag * 140 - this.lagVel * 14) * h;
      this.lag += this.lagVel * h;
      this.tiltVel += ((tiltTarget - this.tilt) * 90 - this.tiltVel * 11) * h;
      this.tilt += this.tiltVel * h;
    }
    const cy = pose.y + this.crouchBlend * 3;
    for (const c of [this.back, this.front]) {
      c.setPosition(pose.x, cy);
      c.setRotation(angle);
      c.setScale(sx, sy);
    }
    const spin = pose.distance / 22;
    this.rig.wheels.forEach((w, i) => {
      const img = this.wheels[i];
      img.setRotation((spin * 22) / w.r);
      const bend = i === 1 ? this.bent : 0;
      img.setScale((1 - bend * 0.28 * (0.5 + 0.5 * Math.sin(pose.time * 30))) / ART_RES, 1 / ART_RES);
    });
    if (this.fan) this.fan.setRotation(this.fan.rotation + dt * (4 + pose.speed / 90));
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const seatX = this.rig.seat[0] * sx;
    const seatY = this.rig.seat[1] * sy;
    let rx = pose.x + seatX * cos - seatY * sin;
    let ry = cy + seatX * sin + seatY * cos;
    let rr = angle + this.tilt + this.lag;
    if (pose.countdown) ry += Math.abs(Math.sin(pose.time * 7)) * -4;
    if (pose.charge >= 1 && pose.crouch && !pose.air) rx += Math.sin(pose.time * 70) * 1.6;
    if (crashing) {
      const u = pose.crash;
      const arc = Math.sin(Math.min(1, u * 1.25) * Math.PI);
      const back = u > 0.76 ? (u - 0.76) / 0.24 : 0;
      const hop = back > 0 ? Math.sin(back * Math.PI) * 70 : 0;
      rx += Math.min(1, u * 1.3) * 190 * (1 - back);
      ry += (-arc * 170 + Math.min(1, u * 1.3) * 30) * (1 - back) - hop;
      rr = angle + this.crashSpin * 1.1 * (1 - back);
    }
    this.rider.setPosition(rx, ry);
    this.rider.setRotation(rr);
    this.rider.setScale(sx, sy * (1 - this.crouchBlend * 0.22));
    this.head.setRotation(-speedK * 0.12 + this.crouchBlend * 0.12 + Math.sin(pose.time * (12 + speedK * 26)) * speedK * 0.05 + (crashing ? Math.sin(pose.time * 20) * 0.3 : 0));
    if (this.helmet?.visible) {
      const hr = this.head.rotation;
      this.helmet.setPosition(this.head.x + Math.sin(hr) * 56, this.head.y - Math.cos(hr) * 56).setRotation(hr);
    }
    if (this.faceOverride) {
      this.faceOverride.left -= dt;
      if (this.faceOverride.left <= 0) this.faceOverride = null;
    }
    if (this.armOverride) {
      this.armOverride.left -= dt;
      if (this.armOverride.left <= 0) this.armOverride = null;
    }
    let expr: Expression = "normal";
    let arm: ArmPose = "steer";
    if (crashing) {
      expr = pose.crash > 0.76 ? "dizzy" : "panic";
      arm = pose.crash > 0.76 ? "steer" : "flail";
    } else if (this.hold) {
      expr = this.hold.expr;
      arm = this.hold.pose;
    } else if (pose.air) {
      expr = pose.brace ? "strain" : this.spinBlend > 0.5 ? "wow" : pose.bigAir ? "happy" : "wow";
      arm = pose.bigAir && this.spinBlend < 0.5 && !pose.brace ? "up" : "steer";
    } else if (pose.crouch) {
      expr = "strain";
      arm = "grip";
    } else if (pose.speed > 2000) {
      expr = "happy";
    }
    if (!crashing && !this.hold && this.faceOverride) expr = this.faceOverride.expr;
    if (!crashing && !this.hold && this.armOverride) arm = this.armOverride.pose;
    this.setFace(expr);
    this.setArm(arm);
    this.leg.clear();
    if (pose.paddling && !crashing) {
      const phase = Math.sin(pose.time * 14);
      for (const [w, c] of [
        [11, INK],
        [6, 0x3d6fd1],
      ] as const) {
        this.leg.lineStyle(w, c, 1);
        this.leg.beginPath();
        this.leg.moveTo(20, -4);
        this.leg.lineTo(-4 + phase * 30, 60);
        this.leg.strokePath();
      }
    }
    if (this.rope && this.rig.rope) {
      this.rope.clear();
      if (!crashing && (this.shownArm === "steer" || this.shownArm === "grip")) {
        const [px, py] = this.rig.rope;
        const ax = px * sx;
        const ay = py * sy;
        const fx = pose.x + ax * cos - ay * sin;
        const fy = cy + ax * sin + ay * cos;
        const hand = this.shownArm === "grip" ? [36, 46] : [46, 30];
        const ra = Math.cos(rr);
        const rs = Math.sin(rr);
        const hx0 = (6 + hand[0]) * sx;
        const hy0 = (-54 + hand[1]) * sy * (1 - this.crouchBlend * 0.22);
        const hx = rx + hx0 * ra - hy0 * rs;
        const hy = ry + hx0 * rs + hy0 * ra;
        this.rope.lineStyle(7, INK, 1);
        this.rope.beginPath();
        this.rope.moveTo(fx, fy);
        this.rope.lineTo(hx, hy);
        this.rope.strokePath();
        this.rope.lineStyle(3, 0xe8c27a, 1);
        this.rope.beginPath();
        this.rope.moveTo(fx, fy);
        this.rope.lineTo(hx, hy);
        this.rope.strokePath();
      }
    }
  }

  destroy() {
    for (const f of this.flyers) f.img.destroy();
    this.back.destroy();
    this.front.destroy();
    this.rider.destroy();
    this.rope?.destroy();
    this.label?.destroy();
  }
}
