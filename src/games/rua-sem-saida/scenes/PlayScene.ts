import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import {
  AMMO,
  ANCHOR,
  ANGLE_MAX,
  ANGLE_MIN,
  ARLINDO_WINDOW,
  BAND_BACK,
  BAND_FRONT,
  GRAVITY_PER_STEP,
  GRAVITY_Y,
  GROUND_Y,
  H,
  MAX_PULL,
  MAX_SPEED,
  MIN_POWER,
  MIN_SPEED,
  PROJECTILES,
  PROPS,
  SCORE,
  STATICS,
  STEP_MS,
  TARGETS,
  W,
  WAGON,
  type BodyDef,
  type ProjectileDef,
  type ProjectileId,
  type TargetDef,
} from "../config";
import { GAME_SFX, type GameSfx } from "../sounds";

type Phase = "attract" | "ready" | "aiming" | "flying" | "settling" | "over";

type Pose = { x: number; y: number; angle: number };

type TargetState = {
  def: TargetDef;
  obj: Phaser.Physics.Matter.Image;
  rest: Pose;
  hit: boolean;
  icon: Phaser.GameObjects.Image;
  check: Phaser.GameObjects.Text;
};

type PropState = { def: BodyDef; obj: Phaser.Physics.Matter.Image; rest: Pose; messy: boolean };

type Material = "ceramic" | "wood" | "metal" | "rubber" | "plastic" | "soft" | "water" | "squeaky" | "static";

const INK = "#1d1830";
const WORDS = ["POW!", "BONK!", "CRASH!", "PLOFT!", "TÓIM!"];

export class PlayScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private phase: Phase = "attract";
  private acc = 0;
  private targets: TargetState[] = [];
  private props: PropState[] = [];
  private ammo: ProjectileId[] = [];
  private shot = 0;
  private current: ProjectileDef | null = null;
  private readyImage: Phaser.GameObjects.Image | null = null;
  private flying: Phaser.Physics.Matter.Image | null = null;
  private flyingDef: ProjectileDef | null = null;
  private spent: Phaser.Physics.Matter.Image[] = [];
  private flyStart = 0;
  private slowSteps = 0;
  private pendingBurst = false;
  private shotHits = 0;
  private score = 0;
  private targetScore = 0;
  private messScore = 0;
  private comboScore = 0;
  private highScore = 0;
  private aimAngle = 35;
  private aimPower = 0.5;
  private savedAim = { angle: 35, power: 0.5 };
  private dragStart: Phaser.Math.Vector2 | null = null;
  private materials = new Map<number, Material>();
  private targetByBody = new Map<number, TargetState>();
  private pendingHits = new Set<TargetState>();
  private bandBack!: Phaser.GameObjects.Graphics;
  private bandFront!: Phaser.GameObjects.Graphics;
  private aimGfx!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private recordText!: Phaser.GameObjects.Text;
  private targetsText!: Phaser.GameObjects.Text;
  private ammoIcons: Phaser.GameObjects.GameObject[] = [];
  private nameText!: Phaser.GameObjects.Text;
  private aimText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private deco!: Phaser.GameObjects.Image;
  private lina!: Phaser.GameObjects.Image;
  private arlindo!: Phaser.GameObjects.Image;
  private arlindoBubble!: Phaser.GameObjects.Container;
  private arlindoText!: Phaser.GameObjects.Text;
  private arlindoHide?: Phaser.Time.TimerEvent;
  private fxStars!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fxPuff!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fxDrops!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fxFeathers!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fxSplinters!: Phaser.GameObjects.Particles.ParticleEmitter;
  private lastSound = new Map<string, number>();
  private lastWord = 0;
  private lastQuack = 0;
  private finishing = false;
  private launches = 0;
  private keys!: Record<"left" | "right" | "up" | "down" | "a" | "d" | "w" | "s", Phaser.Input.Keyboard.Key>;
  private holdSince = 0;
  private aimAnnounce?: Phaser.Time.TimerEvent;
  private bandSnap = 0;

  constructor() {
    super("play");
  }

  init() {
    this.phase = "attract";
    this.acc = 0;
    this.targets = [];
    this.props = [];
    this.ammo = [...AMMO];
    this.shot = 0;
    this.current = null;
    this.readyImage = null;
    this.flying = null;
    this.flyingDef = null;
    this.spent = [];
    this.pendingBurst = false;
    this.shotHits = 0;
    this.score = 0;
    this.targetScore = 0;
    this.messScore = 0;
    this.comboScore = 0;
    this.aimAngle = 35;
    this.aimPower = 0.5;
    this.dragStart = null;
    this.materials = new Map();
    this.targetByBody = new Map();
    this.pendingHits = new Set();
    this.ammoIcons = [];
    this.lastSound = new Map();
    this.finishing = false;
    this.launches = 0;
    this.bandSnap = 0;
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.highScore = (this.registry.get("highScore") as number | undefined) ?? this.ctx.highScore;
    const engine = this.matter.world.engine;
    engine.positionIterations = 10;
    engine.velocityIterations = 8;
    this.matter.world.autoUpdate = false;
    this.matter.world.setGravity(0, GRAVITY_Y);

    this.buildBackground();
    this.buildStatics();
    this.buildLevel();
    this.buildLauncher();
    this.buildArlindo();
    this.buildFx();
    this.buildHud();
    this.setupInput();
    this.setupCollisions();

    for (let i = 0; i < 90; i += 1) this.matter.world.step(STEP_MS);
    for (const t of this.targets) t.rest = this.poseOf(t.obj);
    for (const p of this.props) p.rest = this.poseOf(p.obj);

    this.drawBands();
    this.drawAim();

    if (!this.registry.get("readySent")) {
      this.registry.set("readySent", true);
      this.ctx.onReady();
    }

    if (this.registry.get("autostart")) {
      this.registry.set("autostart", false);
      this.begin();
    }
  }

  begin() {
    if (this.phase !== "attract") return;
    this.loadNext();
    this.hintText.setVisible(true);
    this.ctx.onEvent({
      type: "announce",
      message:
        "Partida iniciada. Arraste para trás e solte, ou use as setas para mirar e espaço para lançar. Derrube os 5 alvos.",
    });
  }

  private sfx(name: GameSfx, volume = 1, throttleMs = 0) {
    if (throttleMs) {
      const last = this.lastSound.get(name) ?? 0;
      if (this.time.now - last < throttleMs) return;
      this.lastSound.set(name, this.time.now);
    }
    this.ctx.audio.play(GAME_SFX[name], { volume: Phaser.Math.Clamp(volume, 0.05, 1.2) });
  }

  private poseOf(obj: Phaser.Physics.Matter.Image): Pose {
    const body = obj.body as MatterJS.BodyType;
    return { x: body.position.x, y: body.position.y, angle: body.angle };
  }

  private buildBackground() {
    this.add.image(0, 0, "sky").setOrigin(0).setDepth(0);
    const clouds: [string, number, number, number][] = [
      ["cloud-a", 260, 150, 70],
      ["cloud-b", 900, 90, 90],
      ["cloud-a", 1400, 230, 110],
    ];
    for (const [key, x, y, duration] of clouds) {
      const cloud = this.add.image(x, y, key).setDepth(1);
      if (!this.ctx.reducedMotion) {
        this.tweens.add({
          targets: cloud,
          x: { from: x, to: x + W + 300 },
          duration: duration * 1000,
          repeat: -1,
          onRepeat: () => {
            cloud.x = -300;
          },
        });
      }
    }
    this.add.image(0, 0, "houses").setOrigin(0).setDepth(2);
    this.add.image(0, 0, "yard").setOrigin(0).setDepth(3);
  }

  private buildStatics() {
    for (const s of STATICS) {
      const body = this.matter.add.rectangle(s.x, s.y, s.w, s.h, {
        isStatic: true,
        label: s.label,
        friction: 0.9,
        restitution: 0.1,
      });
      this.materials.set(body.id, "static");
    }
  }

  private addBody(def: BodyDef, label: string) {
    const obj = this.matter.add.image(def.x, def.y, def.tex, undefined, {
      shape: { type: "rectangle", width: def.w, height: def.h },
      chamfer: def.chamfer ? { radius: def.chamfer } : undefined,
      density: def.density,
      friction: def.friction ?? 0.7,
      frictionStatic: 1,
      restitution: def.restitution ?? 0.08,
      frictionAir: 0.008,
      label,
    });
    obj.setDepth(5);
    this.materials.set((obj.body as MatterJS.BodyType).id, def.material);
    return obj;
  }

  private buildLevel() {
    for (const def of PROPS) {
      const obj = this.addBody(def, `prop:${def.id}`);
      this.props.push({ def, obj, rest: this.poseOf(obj), messy: false });
    }
    for (const def of TARGETS) {
      const obj = this.addBody(def, `target:${def.id}`);
      const state: TargetState = {
        def,
        obj,
        rest: this.poseOf(obj),
        hit: false,
        icon: null as unknown as Phaser.GameObjects.Image,
        check: null as unknown as Phaser.GameObjects.Text,
      };
      this.targets.push(state);
      this.targetByBody.set((obj.body as MatterJS.BodyType).id, state);
    }
  }

  private buildLauncher() {
    this.deco = this.add.image(78, GROUND_Y + 6, "deco").setOrigin(0.5, 1).setDepth(5);
    this.lina = this.add.image(478, GROUND_Y + 6, "lina").setOrigin(0.5, 1).setDepth(5);
    this.add.image(WAGON.x, WAGON.y, "wagon").setOrigin(0).setDepth(6);
    this.bandBack = this.add.graphics().setDepth(7);
    this.bandFront = this.add.graphics().setDepth(9);
    this.add.image(WAGON.x, WAGON.y, "fork-front").setOrigin(0).setDepth(10);
    this.aimGfx = this.add.graphics().setDepth(11);
    if (!this.ctx.reducedMotion) {
      this.tweens.add({ targets: this.lina, scaleY: 1.03, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.tweens.add({ targets: this.deco, angle: 2, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  private buildArlindo() {
    const win = ARLINDO_WINDOW;
    this.arlindo = this.add.image(win.x + win.w / 2, win.y + win.h + 150, "arlindo").setOrigin(0.5, 1).setDepth(4);
    const shape = this.make.graphics({}, false);
    shape.fillStyle(0xffffff);
    shape.fillRect(win.x, win.y, win.w, win.h);
    this.arlindo.setMask(shape.createGeometryMask());
    this.arlindoText = this.add
      .text(0, 0, "", { fontFamily: this.ctx.fonts.display, fontSize: "30px", color: INK, align: "center" })
      .setOrigin(0.5);
    const bubble = this.add.graphics();
    this.arlindoBubble = this.add.container(win.x + win.w / 2 - 40, win.y - 64, [bubble, this.arlindoText]).setDepth(14);
    this.arlindoBubble.setData("gfx", bubble);
    this.arlindoBubble.setVisible(false);
  }

  private shout(text: string) {
    const win = ARLINDO_WINDOW;
    this.arlindoText.setText(text);
    const bubble = this.arlindoBubble.getData("gfx") as Phaser.GameObjects.Graphics;
    const w = this.arlindoText.width + 44;
    const h = this.arlindoText.height + 26;
    bubble.clear();
    bubble.fillStyle(0x1d1830);
    bubble.fillRoundedRect(-w / 2 + 6, -h / 2 + 7, w, h, 18);
    bubble.fillStyle(0xfbf5e6);
    bubble.lineStyle(5, 0x1d1830);
    bubble.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    bubble.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    bubble.fillTriangle(10, h / 2 - 3, 40, h / 2 - 3, 46, h / 2 + 28);
    bubble.lineBetween(10, h / 2, 46, h / 2 + 28);
    bubble.lineBetween(40, h / 2, 46, h / 2 + 28);
    this.arlindoBubble.setVisible(true).setScale(0.6).setAngle(-4);
    this.tweens.add({ targets: this.arlindoBubble, scale: 1, duration: 220, ease: "Back.easeOut" });
    this.tweens.killTweensOf(this.arlindo);
    this.tweens.add({ targets: this.arlindo, y: win.y + win.h + 32, duration: 220, ease: "Back.easeOut" });
    if (!this.ctx.reducedMotion) {
      this.tweens.add({ targets: this.arlindo, angle: { from: -6, to: 6 }, duration: 90, yoyo: true, repeat: 5 });
    }
    this.sfx("grumpy", 0.9, 300);
    this.arlindoHide?.remove();
    this.arlindoHide = this.time.delayedCall(1900, () => {
      this.arlindoBubble.setVisible(false);
      this.tweens.add({ targets: this.arlindo, y: win.y + win.h + 150, angle: 0, duration: 300, ease: "Sine.easeIn" });
    });
  }

  private buildFx() {
    const few = this.ctx.reducedMotion;
    this.fxStars = this.add
      .particles(0, 0, "star", {
        speed: { min: 220, max: 560 },
        angle: { min: 200, max: 340 },
        scale: { start: 1, end: 0.25 },
        rotate: { min: 0, max: 360 },
        gravityY: 900,
        lifespan: few ? 420 : 760,
        emitting: false,
      })
      .setDepth(12);
    this.fxPuff = this.add
      .particles(0, 0, "puff", {
        speed: { min: 40, max: 160 },
        scale: { start: 0.5, end: 1.3 },
        alpha: { start: 0.95, end: 0 },
        lifespan: 620,
        emitting: false,
      })
      .setDepth(12);
    this.fxDrops = this.add
      .particles(0, 0, "drop", {
        speed: { min: 260, max: 680 },
        angle: { min: 190, max: 350 },
        scale: { min: 0.7, max: 1.3 },
        gravityY: 1300,
        lifespan: 900,
        emitting: false,
      })
      .setDepth(12);
    this.fxFeathers = this.add
      .particles(0, 0, "feather", {
        speed: { min: 80, max: 280 },
        angle: { min: 200, max: 340 },
        rotate: { min: -180, max: 180 },
        gravityY: 220,
        lifespan: 1500,
        alpha: { start: 1, end: 0 },
        emitting: false,
      })
      .setDepth(12);
    this.fxSplinters = this.add
      .particles(0, 0, "splinter", {
        speed: { min: 200, max: 480 },
        angle: { min: 200, max: 340 },
        rotate: { min: 0, max: 360 },
        gravityY: 1000,
        lifespan: 800,
        emitting: false,
      })
      .setDepth(12);
  }

  private panel(x: number, y: number, w: number, h: number, depth = 20) {
    const g = this.add.graphics().setDepth(depth);
    g.fillStyle(0x1d1830, 1);
    g.fillRoundedRect(x + 6, y + 7, w, h, 20);
    g.fillStyle(0x2b2150, 0.92);
    g.fillRoundedRect(x, y, w, h, 20);
    g.lineStyle(5, 0x1d1830);
    g.strokeRoundedRect(x, y, w, h, 20);
    return g;
  }

  private label(x: number, y: number, text: string, size: number, color: string, depth = 21, font = this.ctx.fonts.display) {
    return this.add
      .text(x, y, text, { fontFamily: font, fontSize: `${size}px`, color, stroke: INK, strokeThickness: Math.max(4, size * 0.16) })
      .setDepth(depth);
  }

  private buildHud() {
    this.panel(28, 24, 260, 118);
    this.label(48, 34, "PONTOS", 22, "#b9a6ef");
    this.scoreText = this.label(46, 58, "0", 54, "#ffc83d");
    this.recordText = this.label(48, 116, "", 18, "#f7ecd4", 21, this.ctx.fonts.body);
    this.updateRecordText();

    const tw = 360;
    const tx = W - tw - 28;
    this.panel(tx, 24, tw, 118);
    this.targetsText = this.label(tx + 20, 34, "ALVOS 0/5", 22, "#9df0dc");
    this.targets.forEach((t, i) => {
      const ix = tx + 46 + i * 66;
      t.icon = this.add.image(ix, 102, t.def.tex).setDepth(21);
      t.icon.setScale(Math.min(52 / t.icon.width, 58 / t.icon.height));
      t.check = this.add
        .text(ix + 14, 106, "✓", { fontFamily: this.ctx.fonts.display, fontSize: "40px", color: "#93cf4c", stroke: INK, strokeThickness: 8 })
        .setOrigin(0.5)
        .setDepth(22)
        .setVisible(false);
    });

    this.panel(28, 156, 260, 84);
    this.label(48, 164, "MUNIÇÃO", 18, "#f7ecd4");

    this.nameText = this.label(ANCHOR.x, ANCHOR.y - 150, "", 26, "#fbf5e6").setOrigin(0.5).setDepth(15);
    this.aimText = this.label(ANCHOR.x, ANCHOR.y - 116, "", 22, "#ffc83d", 15, this.ctx.fonts.body).setOrigin(0.5);
    this.hintText = this.label(W / 2 - 120, H - 54, "Arraste para trás e solte! (ou use as setas + espaço)", 34, "#fbf5e6", 15)
      .setOrigin(0.5)
      .setVisible(false);
    if (!this.ctx.reducedMotion) {
      this.tweens.add({ targets: this.hintText, y: H - 62, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    this.updateAmmoHud();
  }

  private updateRecordText() {
    this.recordText.setText(this.highScore > 0 ? `RECORDE ${this.highScore.toLocaleString("pt-BR")}` : "SEM RECORDE AINDA");
  }

  setHighScore(value: number) {
    this.highScore = value;
    if (this.recordText) this.updateRecordText();
  }

  private updateAmmoHud() {
    this.ammoIcons.forEach((o) => o.destroy());
    this.ammoIcons = [];
    const remaining = this.ammo.length - this.shot + (this.readyImage ? 1 : 0);
    const start = this.ammo.length - remaining;
    for (let i = start; i < this.ammo.length; i += 1) {
      const def = PROJECTILES[this.ammo[i]];
      const x = 62 + (i - start) * 40;
      const icon = this.add.image(x, 212, def.tex).setDepth(21);
      icon.setScale(Math.min(34 / icon.width, 34 / icon.height));
      if (i === start && this.readyImage) {
        const ring = this.add.circle(x, 212, 22, 0xffc83d, 0.35).setStrokeStyle(3, 0xffc83d).setDepth(20.5);
        this.ammoIcons.push(ring);
      }
      this.ammoIcons.push(icon);
    }
    if (remaining === 0) {
      this.ammoIcons.push(this.label(52, 196, "acabou!", 22, "#ef4f43", 21, this.ctx.fonts.body));
    }
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
    }) as typeof this.keys;
    kb.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE]);
    kb.on("keydown", (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "escape" || key === "p") {
        this.ctx.onEvent({ type: "pause-request" });
        return;
      }
      if (this.phase !== "ready") return;
      if (key === " " || key === "enter") {
        event.preventDefault();
        this.tryFire();
        return;
      }
      const map: Record<string, [number, number]> = {
        arrowleft: [1.5, 0],
        a: [1.5, 0],
        arrowright: [-1.5, 0],
        d: [-1.5, 0],
        arrowup: [0, 0.025],
        w: [0, 0.025],
        arrowdown: [0, -0.025],
        s: [0, -0.025],
      };
      const step = map[key];
      if (step && !event.repeat) {
        this.holdSince = this.time.now;
        this.adjustAim(step[0], step[1]);
      }
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== "ready") return;
      this.savedAim = { angle: this.aimAngle, power: this.aimPower };
      this.dragStart = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
      this.phase = "aiming";
      this.aimPower = 0;
      this.sfx("stretch", 0.6);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== "aiming" || !this.dragStart) return;
      this.setAimFromPull(pointer.worldX - this.dragStart.x, pointer.worldY - this.dragStart.y);
    });
    const release = () => {
      if (this.phase !== "aiming") return;
      this.dragStart = null;
      if (this.aimPower >= MIN_POWER) {
        this.phase = "ready";
        this.tryFire();
      } else {
        this.phase = "ready";
        this.aimAngle = this.savedAim.angle;
        this.aimPower = this.savedAim.power;
      }
    };
    this.input.on("pointerup", release);
    this.input.on("pointerupoutside", release);
  }

  private adjustAim(dAngle: number, dPower: number) {
    this.aimAngle = Phaser.Math.Clamp(this.aimAngle + dAngle, ANGLE_MIN, ANGLE_MAX);
    this.aimPower = Phaser.Math.Clamp(this.aimPower + dPower, MIN_POWER, 1);
    this.scheduleAimAnnounce();
  }

  private scheduleAimAnnounce() {
    this.aimAnnounce?.remove();
    this.aimAnnounce = this.time.delayedCall(700, () => {
      this.ctx.onEvent({
        type: "announce",
        message: `Ângulo ${Math.round(this.aimAngle)} graus, força ${Math.round(this.aimPower * 100)} por cento.`,
      });
    });
  }

  private setAimFromPull(dx: number, dy: number) {
    const len = Math.min(Math.hypot(dx, dy), MAX_PULL);
    if (len < 6) {
      this.aimPower = 0;
      return;
    }
    let angle = Phaser.Math.RadToDeg(Math.atan2(dy, -dx));
    if (angle > 135) angle = ANGLE_MAX;
    else if (angle < -135) angle = ANGLE_MIN;
    this.aimAngle = Phaser.Math.Clamp(angle, ANGLE_MIN, ANGLE_MAX);
    const before = this.aimPower;
    this.aimPower = len / MAX_PULL;
    if (Math.floor(before * 6) !== Math.floor(this.aimPower * 6)) this.sfx("stretch", 0.25 + this.aimPower * 0.4, 60);
  }

  private pulledPosition() {
    const rad = Phaser.Math.DegToRad(this.aimAngle);
    const pull = this.aimPower * MAX_PULL;
    return { x: ANCHOR.x - Math.cos(rad) * pull, y: ANCHOR.y + Math.sin(rad) * pull };
  }

  private launchVelocity() {
    const rad = Phaser.Math.DegToRad(this.aimAngle);
    const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * this.aimPower;
    return { x: Math.cos(rad) * speed, y: -Math.sin(rad) * speed };
  }

  private setupCollisions() {
    this.matter.world.on("collisionstart", (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        const a = pair.bodyA.parent ?? pair.bodyA;
        const b = pair.bodyB.parent ?? pair.bodyB;
        const rel = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
        const flyingBody = this.flying?.body as MatterJS.BodyType | undefined;
        const involvesFlying = flyingBody && (a.id === flyingBody.id || b.id === flyingBody.id);
        if (involvesFlying && this.flyingDef?.id === "balao" && this.time.now - this.flyStart > 60) {
          this.pendingBurst = true;
        }
        if (involvesFlying && rel > 8 && this.phase === "flying") {
          const other = a.id === flyingBody!.id ? b : a;
          const target = this.targetByBody.get(other.id);
          if (target && !target.hit) this.pendingHits.add(target);
        }
        if (rel < 2.2) continue;
        const support = pair.collision.supports?.[0];
        const px = support?.x ?? (a.position.x + b.position.x) / 2;
        const py = support?.y ?? (a.position.y + b.position.y) / 2;
        const fast = a.isStatic ? b : b.isStatic ? a : a.speed > b.speed ? a : b;
        const material = this.materials.get(fast.id) ?? "soft";
        const volume = Phaser.Math.Clamp(rel / 14, 0.15, 1);
        if (material === "squeaky") {
          this.sfx("squeak", volume, 120);
          if (rel > 6 && this.time.now - this.lastQuack > 1100) {
            this.lastQuack = this.time.now;
            this.word("QUÉ!", px, py - 40, "#ffc83d", 48);
          }
        } else if (material !== "static" && material !== "water") {
          const map: Record<string, GameSfx> = {
            ceramic: "ceramic",
            wood: "wood",
            metal: "metal",
            rubber: "rubber",
            plastic: "wood",
            soft: "thud",
          };
          this.sfx(map[material] ?? "thud", volume, 70);
        }
        if (rel > 8) {
          this.fxPuff.explode(this.ctx.reducedMotion ? 2 : 4, px, py);
        }
        if (rel > 12 && involvesFlying) {
          if (!this.ctx.reducedMotion) this.cameras.main.shake(140, 0.0035);
          this.word(Phaser.Utils.Array.GetRandom(WORDS), px, py - 60, "#ffc83d");
        }
      }
    });
  }

  private word(text: string, x: number, y: number, color: string, size = 72) {
    if (this.time.now - this.lastWord < 380) return;
    this.lastWord = this.time.now;
    const t = this.add
      .text(Phaser.Math.Clamp(x, 140, W - 140), Phaser.Math.Clamp(y, 120, H - 120), text, {
        fontFamily: this.ctx.fonts.display,
        fontSize: `${size}px`,
        color,
        stroke: INK,
        strokeThickness: Math.round(size * 0.2),
      })
      .setOrigin(0.5)
      .setDepth(13)
      .setAngle(Phaser.Math.Between(-12, 12))
      .setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: "Back.easeOut" });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, delay: 520, duration: 320, onComplete: () => t.destroy() });
  }

  private popup(text: string, x: number, y: number, color: string, size = 40) {
    const t = this.add
      .text(x, y, text, { fontFamily: this.ctx.fonts.display, fontSize: `${size}px`, color, stroke: INK, strokeThickness: Math.round(size * 0.22) })
      .setOrigin(0.5)
      .setDepth(13);
    this.tweens.add({ targets: t, y: y - 70, alpha: { from: 1, to: 0 }, duration: 1100, ease: "Cubic.easeOut", onComplete: () => t.destroy() });
  }

  private addScore(points: number) {
    this.score += points;
    this.scoreText.setText(this.score.toLocaleString("pt-BR"));
    if (!this.ctx.reducedMotion) {
      this.tweens.add({ targets: this.scoreText, scale: { from: 1.18, to: 1 }, duration: 220, ease: "Back.easeOut" });
    }
    this.ctx.onEvent({ type: "score", score: this.score });
  }

  private loadNext() {
    if (this.shot >= this.ammo.length) return;
    const def = PROJECTILES[this.ammo[this.shot]];
    this.shot += 1;
    this.current = def;
    const pos = this.pulledPosition();
    this.readyImage = this.add.image(pos.x, pos.y, def.tex).setDepth(8).setScale(0.2);
    this.tweens.add({ targets: this.readyImage, scale: 1, duration: 260, ease: "Back.easeOut" });
    this.phase = "ready";
    this.nameText.setText(def.name.toUpperCase());
    this.sfx("load", 0.8);
    this.updateAmmoHud();
    this.ctx.onEvent({ type: "announce", message: `Próximo objeto: ${def.name}. ${def.tip}` });
  }

  private tryFire() {
    if (this.phase !== "ready" || !this.current || !this.readyImage) return;
    if (this.aimPower < MIN_POWER) return;
    const def = this.current;
    const pos = this.pulledPosition();
    const vel = this.launchVelocity();
    this.readyImage.destroy();
    this.readyImage = null;
    const obj = this.matter.add.image(pos.x, pos.y, def.tex, undefined, {
      shape: def.shape,
      chamfer: def.shape.type === "rectangle" ? { radius: 12 } : undefined,
      density: def.density,
      restitution: def.restitution,
      friction: def.friction,
      frictionAir: def.frictionAir,
      label: `projectile:${def.id}`,
    });
    obj.setDepth(8);
    obj.setVelocity(vel.x, vel.y);
    obj.setAngularVelocity(def.id === "tenis" ? 0.12 : def.id === "pato" ? -0.06 : 0.03);
    this.materials.set((obj.body as MatterJS.BodyType).id, def.material);
    this.flying = obj;
    this.flyingDef = def;
    this.flyStart = this.time.now;
    this.slowSteps = 0;
    this.shotHits = 0;
    this.pendingBurst = false;
    this.phase = "flying";
    this.bandSnap = this.time.now;
    this.launches += 1;
    this.sfx("launch", 0.6 + this.aimPower * 0.5);
    this.sfx("twang", 0.8);
    this.hintText.setVisible(false);
    this.nameText.setText("");
    this.aimText.setText("");
    this.aimGfx.clear();
    this.updateAmmoHud();
    this.tweens.add({ targets: this.deco, y: GROUND_Y - 30, duration: 160, yoyo: true, ease: "Quad.easeOut" });
    this.ctx.onEvent({ type: "launch" });
    if (this.launches === 1) this.ctx.onEvent({ type: "achievement", id: "primeiro-lancamento" });
  }

  private burstBalloon() {
    this.pendingBurst = false;
    const balloon = this.flying;
    if (!balloon) return;
    const body = balloon.body as MatterJS.BodyType;
    const { x, y } = body.position;
    const radius = 250;
    const all = [...this.targets.map((t) => t.obj), ...this.props.map((p) => p.obj), ...this.spent];
    for (const obj of all) {
      const b = obj.body as MatterJS.BodyType | null;
      if (!b) continue;
      const dx = b.position.x - x;
      const dy = b.position.y - y;
      const d = Math.hypot(dx, dy);
      if (d > radius || d < 1) continue;
      const strength = 0.032 * (1 - d / radius) * b.mass;
      const nx = dx / d;
      const ny = dy / d - 0.45;
      this.matter.body.applyForce(b, b.position, { x: nx * strength, y: ny * strength });
    }
    balloon.destroy();
    this.flying = null;
    this.fxDrops.explode(this.ctx.reducedMotion ? 12 : 28, x, y);
    this.sfx("splash", 1);
    this.lastWord = 0;
    this.word("SPLASH!", x, y - 70, "#5cb9f0", 80);
    if (!this.ctx.reducedMotion) this.cameras.main.shake(160, 0.004);
    this.time.delayedCall(450, () => this.endShot());
  }

  private endShot() {
    if (this.phase !== "flying") return;
    if (this.flying) {
      this.spent.push(this.flying);
      this.flying = null;
    }
    this.flyingDef = null;
    this.phase = "settling";
    if (this.finishing) return;
    if (this.shot < this.ammo.length) {
      this.time.delayedCall(380, () => {
        if (this.phase === "settling" && !this.finishing) this.loadNext();
      });
    } else {
      this.time.delayedCall(2400, () => {
        if (!this.finishing) this.finish(false);
      });
    }
  }

  private hitTarget(t: TargetState) {
    t.hit = true;
    this.shotHits += 1;
    this.targetScore += t.def.points;
    this.addScore(t.def.points);
    const { x, y } = (t.obj.body as MatterJS.BodyType).position;
    this.popup(`+${t.def.points}`, Phaser.Math.Clamp(x, 80, W - 80), Phaser.Math.Clamp(y - 70, 80, H - 80), "#ffc83d", 46);
    this.fxStars.explode(this.ctx.reducedMotion ? 5 : 10, x, y);
    if (t.def.id === "flamingo") this.fxFeathers.explode(10, x, y);
    if (t.def.material === "wood") this.fxSplinters.explode(8, x, y);
    this.sfx("target", 1);
    this.shout(t.def.shout);
    t.icon.setTint(0x6b6b80);
    t.check.setVisible(true).setScale(0.2);
    this.tweens.add({ targets: t.check, scale: 1, duration: 260, ease: "Back.easeOut" });
    const hits = this.targets.filter((tt) => tt.hit).length;
    this.targetsText.setText(`ALVOS ${hits}/${this.targets.length}`);
    this.tweens.add({ targets: this.lina, y: GROUND_Y - 24, duration: 150, yoyo: true, ease: "Quad.easeOut" });
    let message = `${t.def.name} ${t.def.fem ? "derrubada" : "derrubado"}! Mais ${t.def.points} pontos.`;
    if (this.shotHits >= 2 && this.phase === "flying") {
      this.comboScore += SCORE.comboBonus;
      this.addScore(SCORE.comboBonus);
      this.lastWord = 0;
      this.word(`COMBO x${this.shotHits}!`, W / 2, 300, "#f06ba8", 84);
      this.sfx("combo", 1);
      this.ctx.onEvent({ type: "achievement", id: "efeito-domino" });
      message += ` Combo de ${this.shotHits}! Mais ${SCORE.comboBonus}.`;
    }
    this.ctx.onEvent({ type: "announce", message });
    if (hits === this.targets.length && !this.finishing) {
      this.finishing = true;
      this.time.delayedCall(1300, () => this.finish(true));
    }
  }

  private checkWorld() {
    if (this.pendingHits.size) {
      for (const t of this.pendingHits) if (!t.hit) this.hitTarget(t);
      this.pendingHits.clear();
    }
    for (const t of this.targets) {
      if (t.hit) continue;
      const b = t.obj.body as MatterJS.BodyType;
      const dist = Math.hypot(b.position.x - t.rest.x, b.position.y - t.rest.y);
      const turn = Math.abs(Phaser.Math.Angle.Wrap(b.angle - t.rest.angle));
      if (turn > 0.7 || dist > 44 || b.position.y > H + 80) this.hitTarget(t);
    }
    for (const p of this.props) {
      if (p.messy) continue;
      const b = p.obj.body as MatterJS.BodyType;
      const dist = Math.hypot(b.position.x - p.rest.x, b.position.y - p.rest.y);
      const turn = Math.abs(Phaser.Math.Angle.Wrap(b.angle - p.rest.angle));
      if (turn > 0.35 || dist > 26) {
        p.messy = true;
        this.messScore += SCORE.messBonus;
        this.addScore(SCORE.messBonus);
        this.popup(`+${SCORE.messBonus}`, b.position.x, b.position.y - 50, "#fbf5e6", 30);
        this.sfx("mess", 0.6, 80);
      }
    }
    if (this.phase === "flying" && this.flying) {
      const b = this.flying.body as MatterJS.BodyType;
      const out = b.position.x < -160 || b.position.x > W + 160 || b.position.y > H + 160;
      this.slowSteps = b.speed < 0.45 ? this.slowSteps + 1 : 0;
      if (out || this.slowSteps > 45 || this.time.now - this.flyStart > 7000) this.endShot();
    }
  }

  private finish(won: boolean) {
    if (this.phase === "over") return;
    this.finishing = true;
    this.phase = "over";
    const unused = won ? this.ammo.length - this.shot + (this.readyImage ? 1 : 0) : 0;
    const ammoBonus = unused * SCORE.ammoBonus;
    if (ammoBonus > 0) this.addScore(ammoBonus);
    if (this.readyImage) {
      this.tweens.add({ targets: this.readyImage, scale: 0, duration: 200 });
    }
    this.aimGfx.clear();
    this.nameText.setText("");
    this.aimText.setText("");
    this.hintText.setVisible(false);
    const stars = won ? (this.score >= SCORE.threeStars ? 3 : this.score >= SCORE.twoStars ? 2 : 1) : 0;
    const achievements: string[] = [];
    if (won) achievements.push("vitoria-rua");
    if (stars === 3) achievements.push("tres-estrelas");
    if (this.score >= SCORE.record) achievements.push("recordista");
    if (won) {
      this.sfx("victory", 1);
      this.fxStars.explode(this.ctx.reducedMotion ? 10 : 40, W / 2, 200);
      if (!this.ctx.reducedMotion) {
        this.tweens.add({ targets: [this.deco, this.lina], y: GROUND_Y - 30, duration: 220, yoyo: true, repeat: 3, ease: "Quad.easeOut" });
      }
      this.shout("MEU JARDIM!!!");
    } else {
      this.sfx("defeat", 1);
      this.tweens.add({ targets: [this.deco, this.lina], scaleY: 0.92, angle: -4, duration: 400, ease: "Sine.easeOut" });
    }
    const result: GameResult = {
      won,
      score: this.score,
      stars,
      breakdown: [
        { label: "Alvos derrubados", value: this.targetScore },
        { label: "Bagunça no quintal", value: this.messScore },
        { label: "Combos", value: this.comboScore },
        { label: "Munição de sobra", value: ammoBonus },
      ],
      achievements,
    };
    this.time.delayedCall(won ? 900 : 300, () => this.ctx.onEvent({ type: "finished", result }));
  }

  private drawBands() {
    const back = this.bandBack;
    const front = this.bandFront;
    back.clear();
    front.clear();
    let target = { x: ANCHOR.x, y: ANCHOR.y + 4 };
    const holding = this.readyImage && (this.phase === "ready" || this.phase === "aiming");
    if (holding && this.readyImage) {
      target = { x: this.readyImage.x, y: this.readyImage.y };
    } else if (this.time.now - this.bandSnap < 260) {
      const t = (this.time.now - this.bandSnap) / 260;
      const wob = Math.sin(t * Math.PI * 4) * (1 - t) * 26;
      target = { x: ANCHOR.x + wob, y: ANCHOR.y + 4 };
    }
    const stretch = Phaser.Math.Distance.Between(target.x, target.y, ANCHOR.x, ANCHOR.y);
    const thick = Phaser.Math.Clamp(14 - stretch / 22, 7, 14);
    back.lineStyle(thick + 6, 0x1d1830);
    back.lineBetween(BAND_BACK.x, BAND_BACK.y, target.x, target.y);
    back.lineStyle(thick, 0xc4352c);
    back.lineBetween(BAND_BACK.x, BAND_BACK.y, target.x, target.y);
    front.lineStyle(thick + 6, 0x1d1830);
    front.lineBetween(BAND_FRONT.x, BAND_FRONT.y, target.x, target.y);
    front.lineStyle(thick, 0xef4f43);
    front.lineBetween(BAND_FRONT.x, BAND_FRONT.y, target.x, target.y);
    if (holding) {
      front.fillStyle(0x1d1830);
      front.fillRoundedRect(target.x - 18, target.y - 6, 22, 30, 6);
      front.fillStyle(0x7c4527);
      front.fillRoundedRect(target.x - 15, target.y - 3, 16, 24, 5);
    }
  }

  private drawAim() {
    const g = this.aimGfx;
    g.clear();
    if (!(this.phase === "ready" || this.phase === "aiming") || !this.readyImage) {
      this.aimText.setText("");
      return;
    }
    const pos = this.pulledPosition();
    this.readyImage.setPosition(pos.x, pos.y);
    this.readyImage.setAngle(-this.aimAngle * 0.3);
    if (this.aimPower < MIN_POWER) {
      this.aimText.setText("puxe mais!");
      return;
    }
    this.aimText.setText(`${Math.round(this.aimAngle)}° · ${Math.round(this.aimPower * 100)}%`);
    const vel = this.launchVelocity();
    const air = 1 - (this.current?.frictionAir ?? 0.004);
    let x = pos.x;
    let y = pos.y;
    let vx = vel.x;
    let vy = vel.y;
    const steps = 58;
    for (let i = 1; i <= steps; i += 1) {
      vx *= air;
      vy = vy * air + GRAVITY_PER_STEP;
      x += vx;
      y += vy;
      if (y > GROUND_Y || x > W) break;
      if (i % 3 === 0) {
        const k = i / steps;
        const r = 9 - k * 4;
        g.fillStyle(0x1d1830, 0.9 - k * 0.5);
        g.fillCircle(x, y, r + 3);
        g.fillStyle(0xff8a3d, 1 - k * 0.55);
        g.fillCircle(x, y, r);
      }
    }
  }

  update(_time: number, delta: number) {
    if (this.phase !== "attract" && this.phase !== "over") {
      this.handleHeldKeys();
    }
    if (this.phase !== "attract") {
      this.acc += Math.min(delta, 100);
      let steps = 0;
      while (this.acc >= STEP_MS && steps < 6) {
        this.matter.world.step(STEP_MS);
        this.acc -= STEP_MS;
        steps += 1;
        if (this.pendingBurst) this.burstBalloon();
        if (this.phase !== "over") this.checkWorld();
      }
      if (steps === 6) this.acc = 0;
    }
    this.drawBands();
    this.drawAim();
  }

  private handleHeldKeys() {
    if (this.phase !== "ready") return;
    if (this.time.now - this.holdSince < 230) return;
    const k = this.keys;
    const rate = this.game.loop.delta / 1000;
    let dAngle = 0;
    let dPower = 0;
    if (k.left.isDown || k.a.isDown) dAngle += 40 * rate;
    if (k.right.isDown || k.d.isDown) dAngle -= 40 * rate;
    if (k.up.isDown || k.w.isDown) dPower += 0.5 * rate;
    if (k.down.isDown || k.s.isDown) dPower -= 0.5 * rate;
    if (dAngle || dPower) this.adjustAim(dAngle, dPower);
  }
}
