import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import {
  BALL_BODY,
  BALL_R,
  BELT_SPEED,
  FAN_ACCEL,
  FAN_HALF,
  FAN_REACH,
  FLOOR_Y,
  GRAVITY_Y,
  GRID,
  H,
  PARTS,
  PART_ORDER,
  RUN_TIMEOUT,
  SPRING_SPEED,
  STEP_MS,
  SURFACE,
  W,
  partAngle,
  type PartType,
} from "../config";
import { LEVELS, type LevelDef } from "../levels";
import { ballInSensor, goalLayout, partPoly, placementIssue, type PlacedPart, type Sensor } from "../geometry";
import { addIcon } from "../icons";
import { LAB_SFX, type LabSfx } from "../sounds";
import { Bubble, cartoonText } from "../../kit/ui";
import { LabHud } from "./hud";
import { PartView } from "./parts";
import { buildGoal, drawBlock, drawBuildArea, drawPipe, type GoalView } from "./world";

type Mode = "attract" | "build" | "running" | "done";

type Part = { id: number; view: PartView };

type Carry = {
  part: Part;
  isNew: boolean;
  origin: { x: number; y: number; rot: number } | null;
  via: "pointer" | "keyboard";
  offsetX: number;
  offsetY: number;
  fromTray: boolean;
  moved: boolean;
  startX: number;
  startY: number;
};

type Press = { part: Part; x: number; y: number; offsetX: number; offsetY: number };

type Issue = ReturnType<typeof placementIssue>;

const ISSUE_TEXT: Record<Exclude<Issue, null>, string> = {
  outside: "Coloque dentro da área tracejada",
  blocked: "Já tem algo nesse lugar",
  crowded: "Muito perto de outra peça",
};

const FAIL_LINES = ["Quase!", "Opa! Não foi dessa vez.", "Faltou pouco!", "Hmm... mais um ajuste."];
const CONFETTI = [0xffc83d, 0xf06ba8, 0x63d6c1, 0x7b62c4, 0xff8a3d, 0x8fd4f7];
const MAX_STEPS = Math.round(RUN_TIMEOUT / STEP_MS);

function wrapLines(text: string, max = 30) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

function snap(v: number) {
  return Math.round(v / GRID) * GRID;
}

export class LabScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private level!: LevelDef;
  private levelIndex = 0;
  private mode: Mode = "attract";
  private parts: Part[] = [];
  private nextId = 1;
  private carry: Carry | null = null;
  private press: Press | null = null;
  private selected: Part | null = null;
  private hud!: LabHud;
  private goal!: GoalView;
  private sensor!: Sensor;
  private buildArea!: Phaser.GameObjects.Container;
  private pipe!: Phaser.GameObjects.Image;
  private ballImg!: Phaser.GameObjects.Image;
  private ballBody: MatterJS.BodyType | null = null;
  private bodies: MatterJS.BodyType[] = [];
  private springs = new Map<number, Part>();
  private belts = new Map<number, Part>();
  private kinds = new Map<number, LabSfx>();
  private acc = 0;
  private runSteps = 0;
  private rest = 0;
  private inWind = false;
  private trail: [number, number][] = [];
  private trailGfx!: Phaser.GameObjects.Graphics;
  private fails = 0;
  private lina!: Phaser.GameObjects.Image;
  private bubble!: Bubble;
  private slotTypes: PartType[] = [];
  private lastSound = new Map<string, number>();
  private lastIssue: Issue | "tray" | undefined = undefined;
  private finishing = false;
  private launchAt = 0;
  private pickedOnce = false;
  private ranOnce = false;
  private guideGfx: Phaser.GameObjects.Graphics | null = null;
  private guideArrow: Phaser.GameObjects.Image | null = null;
  private demo: Phaser.GameObjects.Image | null = null;
  private demoTween: Phaser.Tweens.TweenChain | null = null;
  private demoTimer?: Phaser.Time.TimerEvent;
  private idleTimer?: Phaser.Time.TimerEvent;
  private runNudgeTimer?: Phaser.Time.TimerEvent;
  private moodTimer?: Phaser.Time.TimerEvent;
  private bulb!: Phaser.GameObjects.Image;

  constructor() {
    super("lab");
  }

  init() {
    this.mode = "attract";
    this.parts = [];
    this.nextId = 1;
    this.carry = null;
    this.press = null;
    this.selected = null;
    this.ballBody = null;
    this.bodies = [];
    this.springs = new Map();
    this.belts = new Map();
    this.kinds = new Map();
    this.acc = 0;
    this.runSteps = 0;
    this.rest = 0;
    this.inWind = false;
    this.trail = [];
    this.fails = 0;
    this.lastSound = new Map();
    this.lastIssue = undefined;
    this.finishing = false;
    this.launchAt = 0;
    this.pickedOnce = false;
    this.ranOnce = false;
    this.guideGfx = null;
    this.guideArrow = null;
    this.demo = null;
    this.demoTween = null;
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.levelIndex = Phaser.Math.Clamp((this.registry.get("level") as number | undefined) ?? 0, 0, LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    const level = this.level;
    const engine = this.matter.world.engine;
    engine.positionIterations = 10;
    engine.velocityIterations = 8;
    this.matter.world.autoUpdate = false;
    this.matter.world.setGravity(0, GRAVITY_Y);
    const reduced = this.ctx.reducedMotion;
    const fonts = this.ctx.fonts;

    this.add.image(0, 0, "lab-bg").setOrigin(0).setDepth(0);
    for (const b of level.blocks) drawBlock(this, b);
    const layout = goalLayout(level.goal);
    if (level.goal.type === "bell" || level.goal.type === "target") for (const b of layout.blocks) drawBlock(this, b);
    this.sensor = layout.sensor;
    this.pipe = drawPipe(this, level);
    this.goal = buildGoal(this, level, fonts, {
      word: (text, x, y, color, size) => this.word(text, x, y, color, size),
      burst: (x, y, count, tex) => this.burst(x, y, count, tex),
      sfx: (name, volume) => this.sfx(name, volume),
      reduced,
    });
    this.buildArea = drawBuildArea(this, level.build, fonts);
    this.trailGfx = this.add.graphics().setDepth(6);
    this.drawGuide();

    const dir = level.pipe.flip ? -1 : 1;
    this.ballImg = this.add.image(level.pipe.x - 8 * dir, level.pipe.y, level.ball).setDepth(11);
    if (level.ball === "orange") this.ballImg.setOrigin(0.5, 31 / 56);

    this.lina = this.add.image(96, FLOOR_Y + 4, "lina").setOrigin(0.5, 1).setDepth(14);
    if (!reduced) this.tweens.add({ targets: this.lina, scaleY: 0.97, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.bubble = new Bubble(this, fonts, "left", 32, 16);
    this.bulb = this.add.image(this.lina.x - 56, this.lina.y - 226, "bulb").setDepth(15).setVisible(false);

    this.slotTypes = PART_ORDER.filter((t) => (level.inventory[t] ?? 0) > 0);
    this.hud = new LabHud(this, fonts, level, this.levelIndex, LEVELS.length, this.slotTypes, reduced, {
      onSlotDown: (type, pointer) => this.onSlotDown(type, pointer),
      onRun: () => this.toggleRun(),
      onClear: () => this.clearAll(),
      onHint: () => this.showHint(),
      onRotate: () => this.rotateActive(1),
      onRemove: () => this.removeActive(),
    });
    this.hud.setEnabled(false);
    this.refreshHud();

    this.setupInput();
    this.setupCollisions();

    this.applyScale();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyScale, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.applyScale, this));

    if (!this.registry.get("readySent")) {
      this.registry.set("readySent", true);
      this.ctx.onReady();
    }
    if (this.registry.get("autostart")) {
      this.registry.set("autostart", false);
      this.begin();
    }
  }

  get currentLevel() {
    return this.levelIndex;
  }

  get isAttract() {
    return this.mode === "attract";
  }

  begin() {
    if (this.mode !== "attract") return;
    this.mode = "build";
    this.hud.setEnabled(true);
    const level = this.level;
    const intro = `Fase ${this.levelIndex + 1} de ${LEVELS.length}: ${level.title}. ${level.goalText} Na caixa: ${this.inventoryText()}.`;
    const how = level.guide
      ? "Arraste a rampa até a marca tracejada. No teclado, aperte 1 e depois Enter. Depois, aperte espaço para ligar a máquina."
      : `Arraste uma peça para a área tracejada ou aperte ${this.keyRange()}. Espaço liga a máquina.`;
    this.announce(`${intro} ${how}`);
    this.time.delayedCall(350, () => this.say(level.story, 4600));
    if (level.guide) {
      this.demoTimer = this.time.delayedCall(700, () => this.startDemo());
    } else {
      this.idleTimer = this.time.addEvent({
        delay: 7000,
        loop: true,
        callback: () => {
          if (this.mode === "build" && !this.pickedOnce && !this.carry) this.hud.nudgeTray();
        },
      });
    }
  }

  private mood(kind: "idle" | "yay" | "oops", ms = 0) {
    this.moodTimer?.remove();
    this.lina.setTexture(kind === "yay" ? "lina-yay" : kind === "oops" ? "lina-oops" : "lina");
    if (ms) this.moodTimer = this.time.delayedCall(ms, () => this.lina.setTexture("lina"));
  }

  private showBulb() {
    const b = this.bulb;
    this.tweens.killTweensOf(b);
    b.setVisible(true).setAlpha(1).setAngle(0);
    this.sfx("aha", 0.8);
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(2600, () => b.setVisible(false));
      return;
    }
    b.setScale(0.2);
    this.tweens.add({ targets: b, scale: 1.15, duration: 260, ease: "Back.easeOut" });
    this.tweens.add({ targets: b, angle: { from: -8, to: 8 }, duration: 260, yoyo: true, repeat: 4, delay: 260 });
    this.tweens.add({ targets: b, alpha: 0, delay: 2600, duration: 300, onComplete: () => b.setVisible(false) });
  }

  private drawGuide() {
    const guide = this.level.guide;
    if (!guide) return;
    const g = this.add.graphics().setDepth(8);
    const poly = partPoly(guide.type, guide.x, guide.y, guide.rot).map((p) => new Phaser.Math.Vector2(p.x, p.y));
    g.fillStyle(0xffffff, 0.45);
    g.fillPoints(poly, true);
    g.lineStyle(9, 0x1d1830, 0.5);
    g.strokePoints(poly, true, true);
    g.lineStyle(7, 0xffc83d, 1);
    for (let i = 0; i < poly.length; i += 1) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const len = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      for (let d = 0; d < len; d += 22) {
        const e = Math.min(len, d + 12);
        g.lineBetween(a.x + ((b.x - a.x) * d) / len, a.y + ((b.y - a.y) * d) / len, a.x + ((b.x - a.x) * e) / len, a.y + ((b.y - a.y) * e) / len);
      }
    }
    this.guideGfx = g;
    const top = Math.min(...poly.map((p) => p.y));
    const arrow = addIcon(this, guide.x, top - 50, "arrow-down", 78).setDepth(8);
    this.guideArrow = arrow;
    if (!this.ctx.reducedMotion) {
      this.tweens.add({ targets: g, alpha: { from: 1, to: 0.6 }, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.tweens.add({ targets: arrow, y: arrow.y - 16, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  private atGuide(part: Part) {
    const g = this.level.guide;
    const v = part.view;
    return Boolean(g && v.type === g.type && v.x === g.x && v.y === g.y && v.rot === g.rot);
  }

  private refreshGuide() {
    if (!this.guideGfx) return;
    const done = this.parts.some((p) => this.atGuide(p) && this.carry?.part !== p);
    this.guideGfx.setVisible(!done && this.mode === "build");
    this.guideArrow?.setVisible(!done && this.mode === "build");
  }

  private snapToGuide(part: Part) {
    const g = this.level.guide;
    const v = part.view;
    if (!g || v.type !== g.type) return;
    if (Phaser.Math.Distance.Between(v.x, v.y, g.x, g.y) > 90) return;
    if (this.issueFor(part, g.x, g.y, g.rot)) return;
    v.setPose(g.x, g.y, g.rot);
  }

  private startDemo() {
    this.stopDemo();
    const g = this.level.guide;
    if (!g || this.ctx.reducedMotion || this.mode !== "build" || this.carry || this.parts.length) return;
    const from = this.hud.slotCenter(g.type);
    const img = this.add.image(from.x, from.y, PARTS[g.type].tex).setDepth(21).setAlpha(0).setAngle(partAngle(g.type, g.rot));
    this.demo = img;
    this.demoTween = this.tweens.chain({
      targets: img,
      loop: -1,
      tweens: [
        { alpha: 0.85, scale: { from: 0.6, to: 1 }, duration: 260 },
        { x: g.x, y: g.y, duration: 1100, ease: "Sine.easeInOut" },
        { scale: 1.12, duration: 140, yoyo: true },
        { alpha: 0, duration: 380, delay: 450 },
        { x: from.x, y: from.y, duration: 1, delay: 700 },
      ],
    });
  }

  private stopDemo() {
    this.demoTimer?.remove();
    this.demoTween?.stop();
    this.demoTween = null;
    this.demo?.destroy();
    this.demo = null;
  }

  private scheduleRunNudge() {
    this.runNudgeTimer?.remove();
    const guided = Boolean(this.level.guide);
    if ((this.ranOnce && !guided) || this.mode !== "build") return;
    this.runNudgeTimer = this.time.delayedCall(guided ? 250 : 5000, () => {
      if (this.mode === "build" && this.parts.length && !this.carry && (guided || !this.ranOnce)) this.hud.pulseRun(true);
    });
  }

  private applyScale() {
    this.hud.layout(this.scale.displayScale.x);
    this.bubble.setBaseScale(Math.min(this.hud.uiScale, 1.5));
    if (this.selected) this.placeToolbar(this.selected);
  }

  private sfx(name: LabSfx, volume = 1, throttleMs = 0) {
    if (throttleMs) {
      const last = this.lastSound.get(name) ?? -10000;
      if (this.time.now - last < throttleMs) return;
      this.lastSound.set(name, this.time.now);
    }
    this.ctx.audio.play(LAB_SFX[name], { volume: Phaser.Math.Clamp(volume, 0.05, 1.2) });
  }

  private announce(message: string) {
    this.ctx.onEvent({ type: "announce", message });
  }

  private say(text: string, duration = 2400) {
    this.bubble.say(wrapLines(text), this.lina.x + 34, this.lina.y - 214, duration);
  }

  private word(text: string, x: number, y: number, color: string, size = 52) {
    const t = cartoonText(this, x, y, text, { size, color, font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(15);
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(900, () => t.destroy());
      return;
    }
    t.setScale(0.3).setAngle(Phaser.Math.Between(-8, 8));
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: "Back.easeOut" });
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, delay: 650, duration: 420, onComplete: () => t.destroy() });
  }

  private burst(x: number, y: number, count: number, tex = "star") {
    const n = this.ctx.reducedMotion ? Math.min(4, count) : count;
    for (let i = 0; i < n; i += 1) {
      const img = this.add.image(x, y, tex).setDepth(15).setScale(Phaser.Math.FloatBetween(0.6, 1.1));
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const d = Phaser.Math.Between(60, 170);
      this.tweens.add({
        targets: img,
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d - 30,
        angle: this.ctx.reducedMotion ? 0 : Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: this.ctx.reducedMotion ? 500 : Phaser.Math.Between(600, 950),
        ease: "Quad.easeOut",
        onComplete: () => img.destroy(),
      });
    }
  }

  private inventoryText() {
    const items = this.slotTypes.map((t) => {
      const n = this.level.inventory[t] ?? 0;
      const def = PARTS[t];
      return `${n} ${(n === 1 ? def.name : def.plural).toLowerCase()}`;
    });
    if (items.length <= 1) return items.join("");
    return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
  }

  private keyRange() {
    return this.slotTypes.length === 1 ? "1" : `de 1 a ${this.slotTypes.length}`;
  }

  private remaining(type: PartType) {
    return (this.level.inventory[type] ?? 0) - this.parts.filter((p) => p.view.type === type).length;
  }

  private refreshHud() {
    const counts: Partial<Record<PartType, number>> = {};
    for (const t of this.slotTypes) counts[t] = this.remaining(t);
    this.hud.setCounts(counts);
    this.hud.setUsed(this.parts.length, this.level.par);
  }

  private describe(view: PartView) {
    const def = PARTS[view.type];
    const a = view.angle;
    switch (view.type) {
      case "ramp":
        return a === 0 ? "rampa reta" : `rampa descendo para a ${a > 0 ? "direita" : "esquerda"}, ${Math.abs(a)} graus`;
      case "spring":
        return a === 0 ? "mola apontando para cima" : `mola apontando para cima e para a ${a > 0 ? "direita" : "esquerda"}, ${Math.abs(a)} graus`;
      case "fan":
        return `ventilador soprando para a ${view.facing > 0 ? "direita" : "esquerda"}`;
      case "belt":
        return `esteira levando para a ${view.facing > 0 ? "direita" : "esquerda"}`;
      default:
        return def.name;
    }
  }

  private placedOf(part: Part): PlacedPart {
    return { type: part.view.type, x: part.view.x, y: part.view.y, rot: part.view.rot };
  }

  private issueFor(part: Part, x = part.view.x, y = part.view.y, rot = part.view.rot): Issue {
    const others = this.parts.filter((p) => p !== part).map((p) => this.placedOf(p));
    return placementIssue(this.level, others, { type: part.view.type, x, y, rot });
  }

  private findSpot(part: Part, cx: number, cy: number) {
    const sx = snap(cx);
    const sy = snap(cy);
    for (let r = 0; r <= 40; r += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        for (let dy = -r; dy <= r; dy += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = sx + dx * GRID;
          const y = sy + dy * GRID;
          if (!this.issueFor(part, x, y)) return { x, y };
        }
      }
    }
    return null;
  }

  private createPart(type: PartType, x: number, y: number): Part {
    const view = new PartView(this, type, this.ctx.reducedMotion);
    const part: Part = { id: this.nextId, view };
    this.nextId += 1;
    view.setPose(snap(x), snap(y), PARTS[type].initial);
    view.hit.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.onPartDown(part, pointer));
    this.parts.push(part);
    this.refreshHud();
    return part;
  }

  private destroyPart(part: Part) {
    this.parts = this.parts.filter((p) => p !== part);
    if (this.selected === part) this.deselect();
    part.view.destroy();
    this.refreshHud();
    this.refreshGuide();
    if (!this.parts.length) {
      this.hud.pulseRun(false);
      if (this.level.guide) this.demoTimer = this.time.delayedCall(1200, () => this.startDemo());
    }
  }

  private select(part: Part, announce = true) {
    if (this.selected && this.selected !== part) this.selected.view.setLook("idle");
    this.selected = part;
    part.view.setLook("selected");
    this.placeToolbar(part);
    if (announce) {
      const index = this.parts.indexOf(part) + 1;
      this.announce(`Peça ${index} de ${this.parts.length}: ${this.describe(part.view)}. Setas movem, R gira, X guarda na caixa.`);
    }
  }

  private deselect() {
    if (this.selected) this.selected.view.setLook("idle");
    this.selected = null;
    this.hud.hideToolbar();
  }

  private placeToolbar(part: Part) {
    const poly = partPoly(part.view.type, part.view.x, part.view.y, part.view.rot);
    const top = Math.min(...poly.map((p) => p.y));
    const bottom = Math.max(...poly.map((p) => p.y));
    const s = Math.min(this.hud.uiScale, 1.5);
    const above = top - 62 * s;
    const y = above > 190 ? above : bottom + 62 * s;
    this.hud.showToolbar(part.view.x, y);
  }

  private beginCarry(part: Part, via: Carry["via"], opts: Partial<Carry> = {}) {
    this.deselect();
    const v = part.view;
    this.carry = {
      part,
      isNew: false,
      origin: { x: v.x, y: v.y, rot: v.rot },
      via,
      offsetX: 0,
      offsetY: 0,
      fromTray: false,
      moved: false,
      startX: v.x,
      startY: v.y,
      ...opts,
    };
    v.setDepthLift(true);
    this.lastIssue = undefined;
    this.hud.pulseRun(false);
    this.updateCarryLook();
    this.refreshGuide();
  }

  private updateCarryLook() {
    const c = this.carry;
    if (!c) return;
    const v = c.part.view;
    if (c.via === "pointer" && c.moved && this.hud.isOverTray(v.x, v.y)) {
      v.setLook("invalid");
      this.hud.showTag("Solte para guardar", v.x, v.y - 60);
      this.lastIssue = "tray";
      return;
    }
    const issue = this.issueFor(c.part);
    v.setLook(issue ? "invalid" : "valid");
    if (issue) {
      const poly = partPoly(v.type, v.x, v.y, v.rot);
      const top = Math.min(...poly.map((p) => p.y));
      this.hud.showTag(ISSUE_TEXT[issue], v.x, top - 16);
    } else {
      this.hud.hideTag();
    }
    if (c.via === "keyboard" && issue !== this.lastIssue) {
      this.announce(issue ? ISSUE_TEXT[issue] + "." : "Pode colocar aqui.");
    }
    this.lastIssue = issue;
  }

  private moveCarry(x: number, y: number) {
    const c = this.carry;
    if (!c) return;
    const v = c.part.view;
    const nx = snap(Phaser.Math.Clamp(x, 0, W));
    const ny = snap(Phaser.Math.Clamp(y, 60, H));
    if (nx === v.x && ny === v.y) return;
    v.setPose(nx, ny, v.rot);
    this.updateCarryLook();
  }

  private dropCarry(): boolean {
    const c = this.carry;
    if (!c) return true;
    const v = c.part.view;
    this.snapToGuide(c.part);
    const issue = this.issueFor(c.part);
    if (issue) {
      this.sfx("invalid", 0.8);
      this.announce(`${ISSUE_TEXT[issue]}.`);
      return false;
    }
    this.carry = null;
    v.setDepthLift(false);
    v.setLook("idle");
    v.pulse();
    this.hud.hideTag();
    this.sfx("place", 0.9);
    this.refreshHud();
    this.select(c.part, false);
    this.refreshGuide();
    const guided = this.level.guide && this.atGuide(c.part);
    if (guided) {
      this.say("Isso! Agora aperte LIGAR.", 3200);
      this.announce("Rampa no lugar certo. Agora aperte espaço para ligar a máquina.");
    } else {
      this.announce(`Peça colocada: ${this.describe(v)}. ${this.parts.length} ${this.parts.length === 1 ? "peça usada" : "peças usadas"}.`);
    }
    this.scheduleRunNudge();
    return true;
  }

  private cancelCarry(silent = false) {
    const c = this.carry;
    if (!c) return;
    this.carry = null;
    this.hud.hideTag();
    if (c.isNew || !c.origin) {
      this.destroyPart(c.part);
      if (!silent) {
        this.sfx("remove", 0.7);
        this.announce("Peça devolvida para a caixa.");
      }
      return;
    }
    const v = c.part.view;
    v.setPose(c.origin.x, c.origin.y, c.origin.rot);
    v.setDepthLift(false);
    v.setLook("idle");
    this.refreshGuide();
    if (!silent) {
      this.sfx("invalid", 0.7);
      this.announce("A peça voltou para onde estava.");
    }
  }

  private settleCarry() {
    if (!this.carry) return;
    if (this.issueFor(this.carry.part)) this.cancelCarry(true);
    else this.dropCarry();
  }

  private onSlotDown(type: PartType, pointer: Phaser.Input.Pointer) {
    if (this.mode !== "build") return;
    this.bubble.hide();
    this.stopDemo();
    this.pickedOnce = true;
    this.settleCarry();
    if (this.remaining(type) <= 0) {
      this.sfx("invalid", 0.7);
      this.say(`Acabaram as ${PARTS[type].plural}!`, 1600);
      this.announce(`Acabaram as ${PARTS[type].plural}.`);
      return;
    }
    const lift = -80 * this.hud.uiScale;
    const part = this.createPart(type, pointer.worldX, pointer.worldY + lift);
    this.sfx("pick", 0.8);
    this.beginCarry(part, "pointer", { isNew: true, origin: null, offsetY: lift, fromTray: true, moved: false, startX: pointer.worldX, startY: pointer.worldY });
  }

  private pickWithKeyboard(slot: number) {
    const type = this.slotTypes[slot];
    if (!type) return;
    this.bubble.hide();
    this.stopDemo();
    this.pickedOnce = true;
    this.settleCarry();
    if (this.remaining(type) <= 0) {
      this.sfx("invalid", 0.7);
      this.announce(`Acabaram as ${PARTS[type].plural}.`);
      return;
    }
    const b = this.level.build;
    const guide = this.level.guide;
    const part = this.createPart(type, b.x + b.w / 2, b.y + b.h / 2);
    if (guide && guide.type === type && !this.issueFor(part, guide.x, guide.y, guide.rot)) {
      part.view.setPose(guide.x, guide.y, guide.rot);
    } else {
      const spot = this.findSpot(part, b.x + b.w / 2, b.y + b.h / 2);
      if (spot) part.view.setPose(spot.x, spot.y, part.view.rot);
    }
    this.sfx("pick", 0.8);
    this.beginCarry(part, "keyboard", { isNew: true, origin: null });
    const onGuide = guide && this.atGuide(part);
    this.announce(
      onGuide
        ? "Rampa na mão, já em cima da marca. Aperte Enter para colocar."
        : `${PARTS[type].name} na mão: ${this.describe(part.view)}. Use as setas para mover, R para girar e Enter para colocar.`,
    );
  }

  private onPartDown(part: Part, pointer: Phaser.Input.Pointer) {
    if (this.mode !== "build") return;
    if (this.carry && this.carry.part !== part) this.settleCarry();
    if (this.carry) return;
    this.bubble.hide();
    this.press = { part, x: pointer.worldX, y: pointer.worldY, offsetX: part.view.x - pointer.worldX, offsetY: part.view.y - pointer.worldY };
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.mode !== "build") return;
    const c = this.carry;
    if (c && c.via === "pointer") {
      if (!c.moved && Phaser.Math.Distance.Between(c.startX, c.startY, pointer.worldX, pointer.worldY) > 24) c.moved = true;
      this.moveCarry(pointer.worldX + c.offsetX, pointer.worldY + c.offsetY);
      return;
    }
    const p = this.press;
    if (p && Phaser.Math.Distance.Between(p.x, p.y, pointer.worldX, pointer.worldY) > 14) {
      this.press = null;
      this.sfx("pick", 0.6);
      this.beginCarry(p.part, "pointer", { offsetX: p.offsetX, offsetY: p.offsetY, moved: true });
      this.moveCarry(pointer.worldX + p.offsetX, pointer.worldY + p.offsetY);
    }
  }

  private onPointerUp() {
    if (this.mode !== "build") {
      this.press = null;
      return;
    }
    const c = this.carry;
    if (c && c.via === "pointer") {
      const v = c.part.view;
      if (c.fromTray && !c.moved) {
        const b = this.level.build;
        const spot = this.findSpot(c.part, b.x + b.w / 2, b.y + b.h / 2);
        if (spot) {
          v.setPose(spot.x, spot.y, v.rot);
          this.dropCarry();
        } else {
          this.cancelCarry();
          this.say("Não cabe mais nada aí!", 1600);
        }
        return;
      }
      if (this.hud.isOverTray(v.x, v.y)) {
        this.carry = null;
        this.hud.hideTag();
        this.destroyPart(c.part);
        this.sfx("remove", 0.8);
        this.announce("Peça devolvida para a caixa.");
        return;
      }
      this.snapToGuide(c.part);
      const issue = this.issueFor(c.part);
      if (!issue) this.dropCarry();
      else {
        this.cancelCarry(true);
        this.sfx("invalid", 0.8);
        this.say(ISSUE_TEXT[issue] + "!", 1500);
        this.announce(`${ISSUE_TEXT[issue]}. ${c.isNew ? "A peça voltou para a caixa." : "A peça voltou para onde estava."}`);
      }
      return;
    }
    const p = this.press;
    this.press = null;
    if (p) {
      if (this.selected === p.part) this.deselect();
      else {
        this.sfx("nudge", 0.8);
        this.select(p.part);
      }
    }
  }

  private rotateActive(dir: 1 | -1) {
    if (this.mode !== "build") return;
    const part = this.carry?.part ?? this.selected;
    if (!part) return;
    const v = part.view;
    const n = PARTS[v.type].rotations.length;
    const next = (v.rot + dir + n) % n;
    if (this.carry) {
      v.setPose(v.x, v.y, next);
      this.updateCarryLook();
    } else {
      const issue = this.issueFor(part, v.x, v.y, next);
      if (issue) {
        this.sfx("invalid", 0.7);
        this.hud.showTag(ISSUE_TEXT[issue], v.x, v.y - 70);
        this.time.delayedCall(1100, () => !this.carry && this.hud.hideTag());
        this.announce(`Não dá para girar aqui: ${ISSUE_TEXT[issue].toLowerCase()}.`);
        return;
      }
      v.setPose(v.x, v.y, next);
      this.placeToolbar(part);
    }
    v.pulse();
    this.sfx("rotate", 0.8);
    this.announce(this.describe(v) + ".");
  }

  private removeActive() {
    if (this.mode !== "build") return;
    if (this.carry) {
      const part = this.carry.part;
      this.carry = null;
      this.hud.hideTag();
      this.destroyPart(part);
    } else if (this.selected) {
      this.destroyPart(this.selected);
    } else {
      return;
    }
    this.sfx("remove", 0.8);
    this.announce("Peça devolvida para a caixa.");
  }

  private selectNext() {
    if (this.mode !== "build") return;
    this.settleCarry();
    if (!this.parts.length) {
      this.announce("Nenhuma peça montada ainda.");
      return;
    }
    const i = this.selected ? this.parts.indexOf(this.selected) : -1;
    const next = this.parts[(i + 1) % this.parts.length];
    this.sfx("nudge", 0.8);
    this.select(next);
  }

  private clearAll() {
    if (this.mode !== "build") return;
    this.cancelCarry(true);
    if (!this.parts.length) return;
    for (const p of [...this.parts]) this.destroyPart(p);
    this.sfx("clear", 0.9);
    this.announce("Todas as peças voltaram para a caixa.");
  }

  private showHint() {
    if (this.mode !== "build") return;
    this.hud.pulseHint(false);
    this.showBulb();
    this.say(this.level.hint, 5200);
    this.announce(`Dica da Lina: ${this.level.hint}`);
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    kb.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ]);
    kb.on("keydown", (event: KeyboardEvent) => this.onKey(event));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on("pointerup", () => this.onPointerUp());
    this.input.on("pointerupoutside", () => this.onPointerUp());
    this.input.on("pointerdown", (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.mode === "build" && over.length === 0) {
        this.settleCarry();
        this.deselect();
      }
    });
  }

  private onKey(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (key === "escape" || key === "p") {
      this.ctx.onEvent({ type: "pause-request" });
      return;
    }
    if (this.mode === "attract" || this.mode === "done") return;
    if (key === " " || key === "spacebar") {
      event.preventDefault();
      if (!event.repeat) this.toggleRun();
      return;
    }
    if (this.mode !== "build") return;
    if (/^[1-9]$/.test(key)) {
      if (!event.repeat) this.pickWithKeyboard(Number(key) - 1);
      return;
    }
    const arrows: Record<string, [number, number]> = {
      arrowleft: [-1, 0],
      arrowright: [1, 0],
      arrowup: [0, -1],
      arrowdown: [0, 1],
    };
    const move = arrows[key];
    if (move) {
      event.preventDefault();
      if (!this.carry && this.selected) this.beginCarry(this.selected, "keyboard");
      const c = this.carry;
      if (!c) {
        this.announce(`Pegue uma peça com ${this.slotTypes.length === 1 ? "a tecla 1" : `as teclas de 1 a ${this.slotTypes.length}`}, ou selecione uma peça montada com S.`);
        return;
      }
      c.via = "keyboard";
      const step = GRID * (event.shiftKey ? 3 : 1);
      const b = this.level.build;
      const v = c.part.view;
      const nx = Phaser.Math.Clamp(v.x + move[0] * step, b.x, b.x + b.w);
      const ny = Phaser.Math.Clamp(v.y + move[1] * step, b.y, b.y + b.h);
      this.sfx("nudge", 0.5, 45);
      this.moveCarry(nx, ny);
      return;
    }
    switch (key) {
      case "r":
      case "e":
        this.rotateActive(1);
        break;
      case "q":
        this.rotateActive(-1);
        break;
      case "enter":
        event.preventDefault();
        if (this.carry) this.dropCarry();
        else if (this.selected) this.beginCarry(this.selected, "keyboard");
        break;
      case "delete":
      case "backspace":
      case "x":
        event.preventDefault();
        this.removeActive();
        break;
      case "s":
        this.selectNext();
        break;
      case "h":
        this.showHint();
        break;
      default:
        break;
    }
  }

  private setupCollisions() {
    this.matter.world.on("collisionstart", (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      const ball = this.ballBody;
      if (this.mode !== "running" || !ball) return;
      for (const pair of event.pairs) {
        const other = pair.bodyA === ball ? pair.bodyB : pair.bodyB === ball ? pair.bodyA : null;
        if (!other) continue;
        const spring = this.springs.get(other.id);
        if (spring) {
          const v = spring.view;
          const a = Phaser.Math.DegToRad(v.angle);
          const nx = Math.sin(a);
          const ny = -Math.cos(a);
          if ((ball.position.x - v.x) * nx + (ball.position.y - v.y) * ny > 0) {
            this.matter.body.setVelocity(ball, { x: nx * SPRING_SPEED, y: ny * SPRING_SPEED });
            v.squash();
            this.sfx("boing", 1, 120);
            this.word("BOING!", v.x + nx * 60, v.y + ny * 60 - 30, "#f06ba8", 46);
            continue;
          }
        }
        const speed = ball.speed;
        if (speed < 2.2) continue;
        const kind = this.kinds.get(other.id) ?? "tap";
        this.sfx(kind, Phaser.Math.Clamp(speed / 12, 0.2, 1), 90);
      }
    });
    this.matter.world.on("collisionactive", (event: Phaser.Physics.Matter.Events.CollisionActiveEvent) => {
      const ball = this.ballBody;
      if (this.mode !== "running" || !ball) return;
      for (const pair of event.pairs) {
        const other = pair.bodyA === ball ? pair.bodyB : pair.bodyB === ball ? pair.bodyA : null;
        if (!other) continue;
        const belt = this.belts.get(other.id);
        if (belt && ball.position.y < belt.view.y) {
          const target = belt.view.facing * BELT_SPEED;
          this.matter.body.setVelocity(ball, { x: ball.velocity.x + (target - ball.velocity.x) * 0.25, y: ball.velocity.y });
          this.sfx("clack", 0.5, 240);
        }
      }
    });
  }

  private addStatic(x: number, y: number, w: number, h: number, angleDeg: number, kind: LabSfx, surface = true, extra: Phaser.Types.Physics.Matter.MatterBodyConfig = {}) {
    const body = this.matter.add.rectangle(x, y, w, h, {
      isStatic: true,
      angle: Phaser.Math.DegToRad(angleDeg),
      ...(surface ? SURFACE : {}),
      ...extra,
    });
    this.bodies.push(body);
    this.kinds.set(body.id, kind);
    return body;
  }

  toggleRun() {
    if (this.mode === "build") this.startRun();
    else if (this.mode === "running") this.stopRun();
  }

  private startRun() {
    this.settleCarry();
    this.press = null;
    this.deselect();
    this.hud.hideTag();
    this.hud.pulseHint(false);
    this.hud.pulseRun(false);
    this.runNudgeTimer?.remove();
    this.stopDemo();
    this.bubble.hide();
    this.ranOnce = true;
    this.mode = "running";
    this.guideGfx?.setVisible(false);
    this.guideArrow?.setVisible(false);
    this.hud.setRunning(true);
    this.tweens.add({ targets: this.buildArea, alpha: 0, duration: 200 });
    this.trail = [];
    this.trailGfx.clear();

    const level = this.level;
    this.addStatic(W / 2, FLOOR_Y + 60, W + 200, 120, 0, "tap", true, { friction: 0.02 });
    this.addStatic(-30, H / 2, 60, H * 2, 0, "tap", false);
    this.addStatic(W + 30, H / 2, 60, H * 2, 0, "tap", false);
    const layout = goalLayout(level.goal);
    for (const b of [...level.blocks, ...layout.blocks]) {
      const kind: LabSfx = b.kind === "metal" || b.kind === "pole" ? "clink" : "tap";
      this.addStatic(b.x, b.y, b.w, b.h, b.angle ?? 0, kind);
    }
    for (const part of this.parts) {
      const v = part.view;
      const kind: LabSfx = v.type === "belt" ? "clack" : v.type === "fan" ? "clink" : "tap";
      const body = this.addStatic(v.x, v.y, v.def.w, v.def.h, v.angle, kind);
      if (v.type === "spring") this.springs.set(body.id, part);
      if (v.type === "belt") this.belts.set(body.id, part);
      v.setRunning(true);
    }
    const ball = this.matter.add.circle(level.pipe.x, level.pipe.y, BALL_R, { ...BALL_BODY, label: "ball" });
    this.matter.body.setVelocity(ball, { x: level.pipe.vx, y: level.pipe.vy });
    this.ballBody = ball;
    this.bodies.push(ball);
    this.ballImg.setPosition(ball.position.x, ball.position.y).setAngle(0).setScale(1).setAlpha(1).setVisible(true);
    this.acc = 0;
    this.runSteps = 0;
    this.rest = 0;
    this.inWind = false;
    const dir = level.pipe.flip ? -1 : 1;
    this.ballImg.setPosition(level.pipe.x - 8 * dir, level.pipe.y);

    this.sfx("run", 0.9);
    const reduced = this.ctx.reducedMotion;
    this.launchAt = this.time.now + (reduced ? 0 : 360);
    if (!reduced) {
      const px = this.pipe.x;
      this.sfx("rattle", 0.9);
      this.tweens.add({ targets: this.pipe, x: px + 4, duration: 45, yoyo: true, repeat: 3, onComplete: () => this.pipe.setX(px) });
    }
    this.time.delayedCall(reduced ? 0 : 340, () => {
      if (this.mode !== "running") return;
      this.sfx("plop", 0.8);
      this.puff(level.pipe.x + 6 * dir, level.pipe.y - 10, 2, 0.6);
      if (!reduced) {
        this.pipe.setScale(1.05, 0.95);
        this.tweens.add({ targets: this.pipe, scaleX: 1, scaleY: 1, duration: 260, ease: "Back.easeOut" });
      }
    });
    this.say("Lá vai!", 1100);
    this.announce("Máquina ligada! Espaço desliga.");
  }

  private stopRun() {
    this.sfx("stop", 0.8);
    this.announce("Máquina desligada.");
    this.endRun();
  }

  private endRun() {
    for (const b of this.bodies) this.matter.world.remove(b);
    this.bodies = [];
    this.springs.clear();
    this.belts.clear();
    this.kinds.clear();
    this.ballBody = null;
    for (const p of this.parts) p.view.setRunning(false);
    const level = this.level;
    const dir = level.pipe.flip ? -1 : 1;
    this.ballImg.setPosition(level.pipe.x - 8 * dir, level.pipe.y).setAngle(0).setAlpha(1).setVisible(true);
    if (!this.ctx.reducedMotion) {
      this.ballImg.setScale(0.2);
      this.tweens.add({ targets: this.ballImg, scale: 1, duration: 260, ease: "Back.easeOut" });
    } else {
      this.ballImg.setScale(1);
    }
    this.mode = "build";
    this.hud.setRunning(false);
    this.refreshHud();
    this.refreshGuide();
    this.tweens.add({ targets: this.buildArea, alpha: 1, duration: 200 });
    this.drawTrail();
  }

  private puff(x: number, y: number, count: number, scale = 1, tex = "smoke") {
    const reduced = this.ctx.reducedMotion;
    for (let i = 0; i < count; i += 1) {
      const img = this.add
        .image(x + Phaser.Math.Between(-24, 24), y + Phaser.Math.Between(-14, 14), tex)
        .setDepth(13)
        .setScale(scale * Phaser.Math.FloatBetween(0.5, 0.8));
      this.tweens.add({
        targets: img,
        scale: img.scale * (reduced ? 1 : 1.7),
        y: img.y - (reduced ? 0 : Phaser.Math.Between(20, 50)),
        alpha: 0,
        duration: Phaser.Math.Between(500, 800),
        ease: "Quad.easeOut",
        onComplete: () => img.destroy(),
      });
    }
  }

  private confetti() {
    if (this.ctx.reducedMotion) return;
    for (let i = 0; i < 70; i += 1) {
      const x = Phaser.Math.Between(40, W - 40);
      const piece = this.add
        .rectangle(x, Phaser.Math.Between(-160, -20), Phaser.Math.Between(10, 18), Phaser.Math.Between(16, 26), CONFETTI[i % CONFETTI.length])
        .setStrokeStyle(2, 0x1d1830)
        .setDepth(19)
        .setAngle(Phaser.Math.Between(0, 180));
      this.tweens.add({
        targets: piece,
        y: H + 60,
        x: x + Phaser.Math.Between(-140, 140),
        angle: piece.angle + Phaser.Math.Between(-540, 540),
        duration: Phaser.Math.Between(1500, 2600),
        delay: Phaser.Math.Between(0, 400),
        ease: "Sine.easeIn",
        onComplete: () => piece.destroy(),
      });
    }
  }

  private starStamp(stars: number) {
    const y = 470;
    const gap = 130;
    for (let i = 0; i < 3; i += 1) {
      const lit = i < stars;
      const img = this.add.image(W / 2 + (i - 1) * gap, y, "star").setDepth(26).setVisible(false);
      if (!lit) img.setTint(0x6d6390).setAlpha(0.6);
      this.time.delayedCall(700 + i * 260, () => {
        img.setVisible(true);
        if (lit) this.ctx.audio.play(LAB_SFX.starPop, { volume: 0.9, pitch: 1 + i * 0.12 });
        if (this.ctx.reducedMotion) {
          img.setScale(3);
          return;
        }
        img.setScale(0.4).setAngle(-40);
        this.tweens.add({ targets: img, scale: 3, angle: 0, duration: 320, ease: "Back.easeOut" });
        if (lit) this.burst(img.x, img.y, 5, "spark");
      });
    }
  }

  private drawTrail() {
    const g = this.trailGfx;
    g.clear();
    this.trail.forEach(([x, y], i) => {
      if (i % 2) return;
      g.fillStyle(0x1d1830, 0.35);
      g.fillCircle(x + 1.5, y + 2, 6);
      g.fillStyle(0xfbf5e6, 0.8);
      g.fillCircle(x, y, 5);
    });
  }

  private applyFans(ball: MatterJS.BodyType) {
    let inside = false;
    for (const part of this.parts) {
      const v = part.view;
      if (v.type !== "fan") continue;
      const f = v.facing;
      const dx = (ball.position.x - v.x) * f;
      const dy = Math.abs(ball.position.y - v.y);
      if (dx > 40 && dx < 48 + FAN_REACH && dy < FAN_HALF) {
        const k = 1 - 0.5 * ((dx - 48) / FAN_REACH);
        this.matter.body.applyForce(ball, ball.position, { x: f * ball.mass * FAN_ACCEL * k, y: 0 });
        inside = true;
      }
    }
    if (inside && !this.inWind) this.sfx("whoosh", 0.9, 400);
    this.inWind = inside;
  }

  private stepRun() {
    const ball = this.ballBody;
    if (!ball) return;
    this.applyFans(ball);
    this.matter.world.step(STEP_MS);
    if (this.mode !== "running" || this.ballBody !== ball) return;
    this.runSteps += 1;
    const { x, y } = ball.position;
    if (this.runSteps % 3 === 0) this.trail.push([x, y]);
    if (ballInSensor(x, y, BALL_R, this.sensor)) {
      this.success();
      return;
    }
    if (y > H + 100 || x < -100 || x > W + 100) {
      this.fail("A bolinha saiu da garagem.", true);
      return;
    }
    this.rest = ball.speed < 0.15 ? this.rest + 1 : 0;
    if (this.rest > 120) {
      this.fail(this.level.ball === "orange" ? "A laranja parou no caminho." : "A bolinha parou no caminho.");
      return;
    }
    if (this.runSteps >= MAX_STEPS) this.fail("A bolinha demorou demais.");
  }

  private fail(reason: string, out = false) {
    if (this.mode !== "running") return;
    this.mode = "done";
    this.fails += 1;
    this.sfx("slide", 0.9);
    this.mood("oops", 2200);
    this.hud.flash("NÃO DEU!", "#ef4f43", 650);
    for (const p of this.parts) p.view.shake();
    const level = this.level;
    const offGuide = level.guide && !this.parts.some((p) => this.atGuide(p));
    const line = FAIL_LINES[(this.fails - 1) % FAIL_LINES.length];
    const showHint = !offGuide && this.fails === 2;
    const lineText = offGuide ? "Quase! Coloque a rampa em cima da marca." : showHint ? `Psiu! ${level.hint}` : `${line} ${reason}`;
    this.say(lineText, showHint || offGuide ? 5200 : 2400);
    if (showHint) this.showBulb();
    this.announce(`Não deu. ${reason} ${offGuide ? "Coloque a rampa em cima da marca tracejada." : showHint ? `Dica da Lina: ${level.hint}` : "Mude as peças e tente de novo."}`);
    if (this.fails >= 2) this.hud.pulseHint(!showHint);
    const bx = Phaser.Math.Clamp(this.ballImg.x, 80, W - 80);
    const by = Phaser.Math.Clamp(this.ballImg.y, 120, FLOOR_Y);
    this.time.delayedCall(520, () => {
      this.sfx("poof", 0.9);
      this.word(out ? "TCHAU!" : "PUF!", bx, by - 70, "#fbf5e6", 50);
      if (!out) {
        const boom = this.add.image(bx, by, "boom").setDepth(12).setScale(0.3);
        this.tweens.add({ targets: boom, scale: 0.85, alpha: 0, duration: this.ctx.reducedMotion ? 200 : 380, ease: "Quad.easeOut", onComplete: () => boom.destroy() });
        this.puff(bx, by, this.ctx.reducedMotion ? 1 : 4, 1.1);
        this.ballImg.setVisible(false);
      }
    });
    this.time.delayedCall(1400, () => {
      if (this.mode !== "done" || this.finishing) return;
      this.mode = "running";
      this.endRun();
    });
  }

  private success() {
    if (this.mode !== "running") return;
    this.mode = "done";
    this.finishing = true;
    this.hud.setDone();
    const level = this.level;
    const ball = this.ballBody;
    if (ball) this.ballImg.setPosition(ball.position.x, ball.position.y);
    for (const p of this.parts) p.view.setRunning(false);
    this.guideGfx?.setVisible(false);
    this.guideArrow?.setVisible(false);
    const hold = this.goal.celebrate(this.ballImg);
    this.time.delayedCall(260, () => this.sfx("success", 1));
    this.time.delayedCall(620, () => this.sfx("party", 0.8));
    this.hud.flash("FUNCIONOU!", "#93cf4c", 2000);
    this.mood("yay");
    this.say(level.win, 2800);
    this.confetti();
    if (!this.ctx.reducedMotion) {
      this.tweens.add({ targets: this.lina, y: this.lina.y - 36, duration: 180, yoyo: true, repeat: 3, ease: "Quad.easeOut" });
      const cam = this.cameras.main;
      cam.shake(160, 0.004);
      cam.zoomTo(1.04, 140, "Quad.easeOut", true, (_c: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) cam.zoomTo(1, 320, "Sine.easeInOut", true);
      });
    }

    const used = this.parts.length;
    const total = Object.values(level.inventory).reduce((a, b) => a + (b ?? 0), 0);
    const saved = total - used;
    const stars = used <= level.par ? 3 : used === level.par + 1 ? 2 : 1;
    const firstTry = this.fails === 0;
    const breakdown = [
      { label: "Máquina funcionou", value: 1000 },
      { label: saved === 1 ? "Sobrou 1 peça" : `Sobraram ${saved} peças`, value: saved * 150 },
      { label: "Deu certo de primeira", value: firstTry ? 300 : 0 },
    ].filter((row, i) => i === 0 || row.value > 0);
    this.starStamp(stars);
    const score = breakdown.reduce((a, b) => a + b.value, 0);
    const achievements = ["lab-first"];
    if (used < level.par) achievements.push("lab-minimalist");
    if (this.levelIndex === LEVELS.length - 1) achievements.push("lab-complete");
    this.ctx.onEvent({ type: "score", score });
    const result: GameResult = {
      won: true,
      score,
      stars,
      breakdown,
      achievements,
      level: { index: this.levelIndex, id: level.id, title: level.title, total: LEVELS.length },
      copy: { title: "Funcionou!", text: level.win },
      summary: `Você usou ${used} ${used === 1 ? "peça" : "peças"}. Para 3 estrelas: ${level.par === 1 ? "1 peça" : `até ${level.par} peças`}.`,
    };
    this.time.delayedCall(Math.max(hold, 1700) + 900, () => this.ctx.onEvent({ type: "finished", result }));
  }

  update(_time: number, delta: number) {
    for (const p of this.parts) p.view.update(delta);
    if (this.mode !== "running") return;
    if (this.time.now < this.launchAt) {
      this.acc = 0;
      return;
    }
    this.acc += Math.min(delta, 100);
    let steps = 0;
    while (this.acc >= STEP_MS && steps < 6 && this.mode === "running") {
      this.stepRun();
      this.acc -= STEP_MS;
      steps += 1;
    }
    if (steps === 6) this.acc = 0;
    const ball = this.ballBody;
    if (ball && this.mode === "running") {
      this.ballImg.setPosition(ball.position.x, ball.position.y).setRotation(ball.angle);
    }
  }
}
