import * as Phaser from "phaser";
import type { GameHostContext, GameResult } from "@/games/types";
import { ARENA_ZOOM, FLOOR_Y, H, HEARTS, HIT_STOP_MS, INVULN_MS, KNOCK_X, KNOCK_Y, SCORE, TILE, W, ZOOM } from "../config";
import { LEVELS, type LevelDef } from "../levels";
import { RECESS_SFX, type RecessSfx } from "../sounds";
import { INK_HEX, cartoonText } from "../../kit/ui";
import { Inspector } from "./boss";
import { makeEnemy, Wave, type Enemy, type HeroView, type StageApi } from "./enemies";
import { Ball, BallSpawner, Bell, Cart, Item } from "./hazards";
import { RecessHud } from "./hud";
import { Hero } from "./player";
import { Scenery } from "./scenery";
import { buildWorld, cx, cy, type World } from "./world";

type Mode = "attract" | "play" | "ko" | "won";
type Checkpoint = { level: number; col: number; score: number; kills: number; stickers: number };

const TOUCH_UI = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
const OUCH = ["AI!", "UI!", "OPA!"];
const HIT_WORDS = ["POW!", "TOMA!", "PAF!", "BOING!"];

export class StageScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private levelIndex = 0;
  private level!: LevelDef;
  private world!: World;
  private hero!: Hero;
  private hud!: RecessHud;
  private enemies: Enemy[] = [];
  private waves: Wave[] = [];
  private balls: Ball[] = [];
  private spawners: BallSpawner[] = [];
  private carts: Cart[] = [];
  private items: Item[] = [];
  private bells: Bell[] = [];
  private boss: Inspector | null = null;
  private arena = { left: 0, right: 0, entered: false };
  private gate: Phaser.GameObjects.Zone | null = null;
  private keys!: Record<"left" | "right" | "a" | "d" | "space" | "up" | "w", Phaser.Input.Keyboard.Key>;
  private mode: Mode = "attract";
  private t = 0;
  private hitStopUntil = 0;
  private hearts = HEARTS;
  private score = 0;
  private kills = 0;
  private killScore = 0;
  private stickers = 0;
  private hits = 0;
  private invulnUntil = 0;
  private safe = { x: 0, y: 0 };
  private lookAhead = 0;
  private tutorial: "walk" | "jump" | "attack" | "done" = "done";
  private chip: Phaser.GameObjects.Container | null = null;
  private exitZone: Phaser.Geom.Rectangle | null = null;
  private lastSound = new Map<string, number>();
  private api!: StageApi;
  private uiCam: Phaser.Cameras.Scene2D.Camera | null = null;
  private buildingHud = false;
  private scenery!: Scenery;

  constructor() {
    super("stage");
  }

  init() {
    this.enemies = [];
    this.waves = [];
    this.balls = [];
    this.spawners = [];
    this.carts = [];
    this.items = [];
    this.bells = [];
    this.boss = null;
    this.arena = { left: 0, right: 0, entered: false };
    this.gate = null;
    this.mode = "attract";
    this.t = 0;
    this.hitStopUntil = 0;
    this.hearts = HEARTS;
    this.score = 0;
    this.kills = 0;
    this.killScore = 0;
    this.stickers = 0;
    this.hits = 0;
    this.invulnUntil = 0;
    this.lookAhead = 0;
    this.tutorial = "done";
    this.chip = null;
    this.exitZone = null;
    this.lastSound = new Map();
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.levelIndex = Phaser.Math.Clamp((this.registry.get("level") as number | undefined) ?? 0, 0, LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    const reduced = this.ctx.reducedMotion;
    const cp = this.registry.get("checkpoint") as Checkpoint | null;
    const resume = Boolean(this.registry.get("resume")) && cp?.level === this.levelIndex ? cp : null;
    if (!resume) this.registry.set("checkpoint", null);

    this.cameras.main.setZoom(ZOOM);
    this.uiCam = this.cameras.add(0, 0, W, H).setName("ui");
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.route, this);
    this.scenery = new Scenery(this, this.level, this.level.length * TILE, reduced);
    this.world = buildWorld(this, this.level);
    const width = this.world.width;
    this.physics.world.setBounds(0, -400, width, H + 800);
    this.cameras.main.setBounds(0, 0, width, H);
    this.cameras.main.setBackgroundColor("#1d1830");

    this.api = {
      scene: this,
      reduced,
      sfx: (name, volume) => this.sfx(name, volume),
      warn: (x, y, ms) => this.warn(x, y, ms),
      word: (text, x, y, color, size) => this.word(text, x, y, color, size),
      burst: (x, y, n, tex) => this.burst(x, y, n, tex),
      dust: (x, y, dir) => this.dust(x, y, dir),
      spawnWave: (x, y, dir, big) => this.waves.push(new Wave(this, x, y, dir, big)),
      groundAt: (x) => this.world.groundAt(x) || this.carts.some((c) => Math.abs(c.img.x - x) < 120),
      quake: (power) => this.scenery.quake(power),
    };

    if (this.level.exit) {
      const ex = cx(this.level.exit.col) + TILE / 2;
      this.add.image(ex, FLOOR_Y, "door-plain").setOrigin(0.5, 1).setDepth(3);
      const plaque = cartoonText(this, ex, FLOOR_Y - 290, this.level.exit.label, { size: 34, color: "#1d1830", font: this.ctx.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5).setDepth(3.2);
      const pg = this.add.graphics().setDepth(3.1);
      pg.fillStyle(INK_HEX, 1);
      pg.fillRoundedRect(ex - plaque.width / 2 - 18, FLOOR_Y - 318, plaque.width + 36, 56, 10);
      pg.fillStyle(0xffc83d, 1);
      pg.fillRoundedRect(ex - plaque.width / 2 - 14, FLOOR_Y - 314, plaque.width + 28, 48, 8);
      this.exitZone = new Phaser.Geom.Rectangle(ex - 50, FLOOR_Y - 250, 100, 250);
    }
    for (const c of this.level.carts ?? []) this.carts.push(new Cart(this, c));
    for (const it of this.level.items) this.items.push(new Item(this, it.kind, it.col, it.row, reduced));
    for (const col of this.level.checkpoints) this.bells.push(new Bell(this, col));
    for (const b of this.level.balls ?? []) this.spawners.push(new BallSpawner(this.api, b, (ball) => this.balls.push(ball)));

    const startCol = resume ? resume.col : this.level.start;
    if (resume) {
      this.score = resume.score;
      this.kills = resume.kills;
      this.killScore = Math.max(0, resume.score - resume.stickers * SCORE.sticker);
      this.stickers = resume.stickers;
      for (const b of this.bells) if (b.x <= cx(resume.col) + TILE) b.ring(this, true);
    }
    for (const e of this.level.enemies) {
      if (resume && e.col < startCol + 4) continue;
      const feet = cy((e.row ?? 11) + 1);
      this.enemies.push(makeEnemy(this.api, e.kind, cx(e.col) + TILE / 2, feet));
    }
    if (resume) for (const it of this.items) if (it.img.x < cx(startCol)) it.take(this);

    if (this.level.boss) {
      this.arena.left = cx(this.level.boss.arena);
      this.arena.right = this.arena.left + W;
      this.boss = new Inspector(this.api, this.arena.right - 360, this.arena.left, this.arena.right);
    }

    this.hero = new Hero(this, cx(startCol) + TILE / 2 + (resume ? 60 : 0), FLOOR_Y, {
      sfx: (name, volume) => this.sfx(name, volume, name === "step" ? 120 : 0),
      dust: (x, y, dir) => this.dust(x, y, dir),
    });
    this.safe = { x: this.hero.rect.x, y: this.hero.rect.y };
    this.hero.body.moves = false;

    const solids = this.world.solids;
    const oneWays = this.world.oneWays;
    const carts = this.carts.map((c) => c.img);
    this.physics.add.collider(this.hero.rect, solids);
    this.physics.add.collider(this.hero.rect, oneWays);
    if (carts.length) this.physics.add.collider(this.hero.rect, carts);
    for (const e of this.enemies) {
      this.physics.add.collider(e.rect, solids);
      this.physics.add.collider(e.rect, oneWays);
      if (carts.length) this.physics.add.collider(e.rect, carts);
    }
    if (this.boss) this.physics.add.collider(this.boss.rect, solids);

    this.cameras.main.startFollow(this.hero.rect, true, 0.14, 0.14, 0, 120);
    this.cameras.main.centerOn(this.hero.rect.x + 400, H / 2);

    this.buildingHud = true;
    const vignette = { corridor: 0.32, yard: 0.18, office: 0.5 }[this.level.theme];
    this.add.image(0, 0, "vignette").setOrigin(0, 0).setDisplaySize(W, H).setScrollFactor(0).setDepth(50).setAlpha(vignette);
    this.hud = new RecessHud(this, this.ctx.fonts, this.level.title, this.levelIndex, LEVELS.length, reduced, (a) => this.onPad(a));
    this.buildingHud = false;
    this.hud.setHearts(this.hearts);
    this.hud.setScore(this.score);
    this.updateProgress();
    this.setupInput();

    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncVisual, this);
    this.applyScale();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyScale, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.applyScale, this);
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncVisual, this);
      this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.route, this);
      this.uiCam = null;
    });

    if (!this.registry.get("readySent")) {
      this.registry.set("readySent", true);
      this.ctx.onReady();
    }
    if (this.registry.get("autostart")) {
      this.registry.set("autostart", false);
      this.begin(Boolean(resume));
    }
  }

  private route(obj: Phaser.GameObjects.GameObject) {
    if (this.buildingHud) this.cameras.main.ignore(obj);
    else this.uiCam?.ignore(obj);
  }

  get currentLevel() {
    return this.levelIndex;
  }

  get isAttract() {
    return this.mode === "attract";
  }

  begin(resumed = false) {
    if (this.mode !== "attract") return;
    this.mode = "play";
    this.hero.body.moves = true;
    this.hud.showTouch(Boolean(TOUCH_UI));
    this.applyScale();
    if (resumed) {
      this.hud.flash("DE VOLTA AO SINO!", "#63d6c1", 900);
      this.announce("Você voltou do último sino. Vai!");
      return;
    }
    this.hud.flash(this.level.title.toUpperCase(), "#ffc83d", 1300, this.level.intro);
    this.announce(`Fase ${this.levelIndex + 1} de ${LEVELS.length}: ${this.level.title}. ${this.level.intro} Setas andam, espaço pula, J ataca.`);
    if (this.levelIndex === 0) {
      this.tutorial = "walk";
      this.showChip("PARA ANDAR", TOUCH_UI ? ["chip-pad-left", "chip-pad-right"] : ["chip-left", "chip-right"]);
    }
  }

  private applyScale() {
    this.hud?.layout(this.scale.displayScale.x);
  }

  private sfx(name: RecessSfx, volume = 1, throttleMs = 0) {
    if (throttleMs) {
      const last = this.lastSound.get(name) ?? -10000;
      if (this.time.now - last < throttleMs) return;
      this.lastSound.set(name, this.time.now);
    }
    this.ctx.audio.play(RECESS_SFX[name], { volume: Phaser.Math.Clamp(volume, 0.05, 1.2) });
  }

  private announce(message: string) {
    this.ctx.onEvent({ type: "announce", message });
  }

  private word(text: string, x: number, y: number, color: string, size = 48) {
    const t = cartoonText(this, x, y, text, { size, color, font: this.ctx.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(40);
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(700, () => t.destroy());
      return;
    }
    t.setScale(0.3).setAngle(Phaser.Math.Between(-8, 8));
    this.tweens.add({ targets: t, scale: 1, duration: 160, ease: "Back.easeOut" });
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, delay: 420, duration: 340, onComplete: () => t.destroy() });
  }

  private burst(x: number, y: number, count: number, tex = "pow") {
    const n = this.ctx.reducedMotion ? Math.min(2, count) : count;
    for (let i = 0; i < n; i += 1) {
      const img = this.add.image(x, y, tex === "pow" ? "spark" : tex).setDepth(39).setScale(Phaser.Math.FloatBetween(0.5, 0.9));
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const d = Phaser.Math.Between(40, 110);
      this.tweens.add({ targets: img, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, angle: Phaser.Math.Between(-120, 120), duration: Phaser.Math.Between(300, 520), onComplete: () => img.destroy() });
    }
  }

  private pow(x: number, y: number, scale = 0.8) {
    const img = this.add.image(x, y, "pow").setDepth(38).setScale(scale * 0.4).setAngle(Phaser.Math.Between(0, 40));
    this.tweens.add({ targets: img, scale, duration: 90, ease: "Back.easeOut" });
    this.tweens.add({ targets: img, alpha: 0, delay: 120, duration: 160, onComplete: () => img.destroy() });
  }

  private dust(x: number, y: number, dir: number) {
    if (this.ctx.reducedMotion) return;
    const img = this.add.image(x - dir * 20, y - 14, "dust").setDepth(19).setScale(0.5).setAlpha(0.9);
    this.tweens.add({ targets: img, x: img.x - dir * 50, y: img.y - 20, scale: 0.9, alpha: 0, duration: 380, onComplete: () => img.destroy() });
  }

  private warn(x: number, y: number, ms: number) {
    const t = cartoonText(this, x, y, "!", { size: 70, color: "#ef4f43", font: this.ctx.fonts.display, stroke: 0.22 }).setOrigin(0.5).setDepth(41);
    if (!this.ctx.reducedMotion) {
      t.setScale(0.4);
      this.tweens.add({ targets: t, scale: 1.15, duration: 130, ease: "Back.easeOut" });
      this.tweens.add({ targets: t, scale: 0.92, delay: 150, duration: 110, yoyo: true, repeat: -1 });
    }
    this.time.delayedCall(Math.max(260, ms), () => t.destroy());
  }

  private showChip(text: string, icons: string[] = []) {
    this.chip?.destroy();
    const label = this.add.text(0, 0, text, { fontFamily: this.ctx.fonts.display, fontSize: "30px", color: "#1d1830", padding: { x: 2, y: 4 } }).setOrigin(0, 0.5);
    const iconW = 38;
    const iconsW = icons.length ? icons.length * iconW + 6 : 0;
    const w = iconsW + label.width + 36;
    const h = 58;
    const bg = this.add.graphics();
    bg.fillStyle(INK_HEX, 1);
    bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 5, w, h, 14);
    bg.fillStyle(0xffc83d, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(4, INK_HEX, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    const parts: Phaser.GameObjects.GameObject[] = [bg];
    let x = -w / 2 + 18;
    for (const key of icons) {
      parts.push(this.add.image(x + iconW / 2, 0, key));
      x += iconW;
    }
    if (icons.length) x += 6;
    label.setX(x);
    parts.push(label);
    this.chip = this.add.container(0, 0, parts).setDepth(45);
  }

  private hideChip() {
    this.chip?.destroy();
    this.chip = null;
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      w: Phaser.Input.Keyboard.KeyCodes.W,
    }) as typeof this.keys;
    kb.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ]);
    kb.on("keydown", (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "escape" || key === "p") {
        this.ctx.onEvent({ type: "pause-request" });
        return;
      }
      if (this.mode !== "play" || event.repeat) return;
      if ([" ", "arrowup", "w", "spacebar"].includes(key)) {
        event.preventDefault();
        this.jump();
      } else if (key === "j" || key === "k" || key === "x") {
        this.attack();
      }
    });
  }

  private onPad(action: "left" | "right" | "jump" | "attack") {
    if (this.mode !== "play") return;
    if (action === "jump") this.jump();
    if (action === "attack") this.attack();
  }

  jump() {
    if (this.mode !== "play") return;
    this.hero.requestJump(this.t);
    if (this.tutorial === "jump") {
      this.tutorial = "attack";
      this.hideChip();
      this.hud.pulseJump(false);
    }
  }

  attack() {
    if (this.mode !== "play") return;
    this.hero.requestAttack(this.t);
  }

  private heroView(): HeroView {
    const b = this.hero.body;
    return { x: b.center.x, feet: b.bottom, top: b.top, grounded: this.hero.grounded };
  }

  private heroRect() {
    const b = this.hero.body;
    return new Phaser.Geom.Rectangle(b.x + 6, b.y + 10, b.width - 12, b.height - 14);
  }

  private addScore(n: number) {
    this.score += n;
    this.hud.setScore(this.score);
    this.ctx.onEvent({ type: "score", score: this.score });
  }

  private hurt(fromX: number) {
    if (this.t < this.invulnUntil || this.mode !== "play") return;
    this.hearts -= 1;
    this.hits += 1;
    this.invulnUntil = this.t + INVULN_MS;
    this.hero.knock(fromX, this.t, KNOCK_X, KNOCK_Y);
    this.sfx("hurt", 0.9);
    this.hud.setHearts(this.hearts, "lost");
    this.hero.sprite.setTintFill(0xffffff);
    this.time.delayedCall(80, () => this.hero.sprite.clearTint());
    if (!this.ctx.reducedMotion) this.cameras.main.shake(140, 0.006);
    this.word(OUCH[this.hits % OUCH.length], this.hero.x, this.hero.body.top - 40, "#ef4f43", 50);
    if (this.hearts <= 0) {
      this.knockOut();
      return;
    }
    this.announce(this.hearts === 1 ? "Ai! Resta 1 coração." : `Ai! Restam ${this.hearts} corações.`);
  }

  private fell() {
    this.hearts -= 1;
    this.hits += 1;
    this.hud.setHearts(this.hearts, "lost");
    this.sfx("hurt", 0.8);
    if (this.hearts <= 0) {
      this.knockOut();
      return;
    }
    this.hero.body.reset(this.safe.x, this.safe.y);
    this.invulnUntil = this.t + INVULN_MS;
    this.word("OPS!", this.safe.x, FLOOR_Y - 240, "#fbf5e6", 54);
    this.announce("Você caiu! Perdeu um coração.");
  }

  private clearShots() {
    for (const w of this.waves) {
      if (!w.alive) continue;
      this.tweens.add({ targets: w.img, alpha: 0, duration: 200, onComplete: () => w.kill() });
    }
    for (const b of this.balls) b.kill();
    this.balls = [];
  }

  private knockOut() {
    this.mode = "ko";
    this.clearShots();
    this.hero.dizzy();
    this.burst(this.hero.x, this.hero.body.top - 20, 6, "star");
    if (this.boss && this.arena.entered) this.time.delayedCall(350, () => this.boss?.taunt());
    else {
      const foe = this.enemies.filter((e) => !e.dead && Math.abs(e.x - this.hero.x) < 1100).sort((a, b) => Math.abs(a.x - this.hero.x) - Math.abs(b.x - this.hero.x))[0];
      if (foe) this.time.delayedCall(300, () => foe.taunt());
    }
    this.hideChip();
    this.hud.hideControls();
    this.hero.body.setVelocityX(0);
    this.sfx("lose", 1);
    const cp = this.registry.get("checkpoint") as Checkpoint | null;
    this.hud.flash("VOCÊ FOI PEGO!", "#ef4f43", 1200, cp ? "Você volta do último sino." : "Tenta de novo!");
    this.announce("Você foi pego pelos monitores!");
    const result: GameResult = {
      won: false,
      score: this.score,
      stars: 0,
      breakdown: this.breakdown(false),
      level: { index: this.levelIndex, id: this.level.id, title: this.level.title, total: LEVELS.length },
      copy: { title: "Pego!", text: cp ? "Jogue de novo para voltar do último sino." : "Os monitores te levaram pra sala. Tenta de novo!" },
      summary: `Monitores: ${this.kills}. Figurinhas: ${this.stickers}.`,
    };
    this.time.delayedCall(1500, () => this.ctx.onEvent({ type: "finished", result }));
  }

  private breakdown(won: boolean) {
    const rows = [
      { label: `Monitores (${this.kills})`, value: this.killScore },
      { label: `Figurinhas (${this.stickers})`, value: this.stickers * SCORE.sticker },
    ];
    if (won) {
      rows.push({ label: "Fase concluída", value: SCORE.phase });
      rows.push({ label: `Corações (${this.hearts})`, value: this.hearts * SCORE.heart });
      if (this.boss) rows.push({ label: "Inspetor vencido", value: SCORE.boss });
    }
    return rows.filter((r, i) => i === 0 || r.value !== 0);
  }

  private win() {
    if (this.mode !== "play") return;
    this.mode = "won";
    this.clearShots();
    this.hideChip();
    this.hud.hideControls();
    this.hero.body.setVelocity(0, this.hero.body.velocity.y);
    this.hero.cheer();
    this.registry.set("checkpoint", null);
    const bonus = SCORE.phase + this.hearts * SCORE.heart + (this.boss ? SCORE.boss : 0);
    this.score += bonus;
    this.hud.setScore(this.score);
    this.ctx.onEvent({ type: "score", score: this.score });
    const last = this.levelIndex === LEVELS.length - 1;
    const stars = this.hits <= 1 ? 3 : this.hits <= 3 ? 2 : 1;
    const achievements: string[] = [];
    if (this.levelIndex === 0) achievements.push("recess-first");
    if (this.hits === 0) achievements.push("recess-flawless");
    if (last) achievements.push("recess-boss");
    const result: GameResult = {
      won: true,
      score: this.score,
      stars,
      breakdown: this.breakdown(true),
      achievements,
      level: { index: this.levelIndex, id: this.level.id, title: this.level.title, total: LEVELS.length },
      copy: last ? { title: "Você conseguiu!", text: "O recreio está de volta!" } : { title: "Boa!", text: `${this.level.win} Próxima fase!` },
      summary: `Monitores: ${this.kills}. Batidas: ${this.hits}.`,
    };
    if (last) {
      this.celebrate();
      this.time.delayedCall(3600, () => this.ctx.onEvent({ type: "finished", result }));
      return;
    }
    this.sfx("door", 1);
    this.time.delayedCall(420, () => this.sfx("win", 1));
    this.hud.flash("BOA!", "#93cf4c", 1100, "Próxima fase!");
    this.kidAtDoor();
    this.announce(`Boa! Você passou da fase ${this.level.title}.`);
    this.time.delayedCall(1600, () => this.ctx.onEvent({ type: "finished", result }));
  }

  private kidAtDoor() {
    if (!this.level.exit) return;
    const ex = cx(this.level.exit.col) + TILE / 2;
    const name = this.levelIndex === 0 ? "deco" : "lina";
    const kid = this.add.image(ex, FLOOR_Y, `kid-${name}-a`).setOrigin(0.5, 1).setDepth(3.5).setScale(0.95);
    this.word("VAMOS!", ex + 60, FLOOR_Y - 270, "#ffc83d", 40);
    this.time.addEvent({ delay: 200, repeat: 6, callback: () => kid.setTexture(kid.texture.key.endsWith("-a") ? `kid-${name}-b` : `kid-${name}-a`) });
    if (this.ctx.reducedMotion) return;
    kid.setAlpha(0).setY(FLOOR_Y + 30);
    this.tweens.add({ targets: kid, alpha: 1, y: FLOOR_Y, x: ex + 70, duration: 260, ease: "Back.easeOut" });
    this.tweens.add({ targets: kid, y: FLOOR_Y - 34, duration: 180, delay: 300, yoyo: true, repeat: 2 });
    const colors = [0xef4f43, 0xffc83d, 0x63d6c1, 0x5cb9f0, 0xf06ba8];
    for (let i = 0; i < 16; i += 1) {
      const c = this.add.image(ex, FLOOR_Y - 200, "confetti").setTint(colors[i % colors.length]).setDepth(36);
      this.tweens.add({ targets: c, x: ex + Phaser.Math.Between(-260, 260), y: FLOOR_Y - Phaser.Math.Between(0, 60), angle: Phaser.Math.Between(-400, 400), duration: Phaser.Math.Between(900, 1400), ease: "Quad.easeOut" });
    }
  }

  private celebrate() {
    const reduced = this.ctx.reducedMotion;
    this.sfx("bell", 1);
    this.time.delayedCall(300, () => this.sfx("cheer", 1));
    this.hud.flash("RECREIO LIBERADO!", "#93cf4c", 2800, "Você conseguiu! O recreio está de volta!");
    this.announce("O Inspetor foi vencido. Recreio liberado! Você conseguiu!");
    const left = this.arena.left;
    const kids: [string, number][] = [
      ["deco", left + 360],
      ["mila", left + 1560],
      ["lina", left + 1760],
    ];
    kids.forEach(([name, x], i) => {
      const fromX = x < left + W / 2 ? left - 120 : left + W + 120;
      const img = this.add.image(fromX, FLOOR_Y, `kid-${name}-a`).setOrigin(0.5, 1).setDepth(14).setScale(0.95);
      if (reduced) img.setX(x);
      else this.tweens.add({ targets: img, x, duration: 900, delay: i * 180, ease: "Quad.easeOut" });
      this.time.addEvent({ delay: 220, repeat: 14, callback: () => img.setTexture(img.texture.key.endsWith("-a") ? `kid-${name}-b` : `kid-${name}-a`) });
      if (!reduced) this.tweens.add({ targets: img, y: FLOOR_Y - 30, duration: 220, delay: 900 + i * 120, yoyo: true, repeat: 5 });
    });
    if (reduced) return;
    const colors = [0xef4f43, 0xffc83d, 0x63d6c1, 0x5cb9f0, 0xf06ba8, 0x93cf4c];
    for (let i = 0; i < 46; i += 1) {
      const c = this.add.image(left + Phaser.Math.Between(80, W - 80), -20, "confetti").setTint(colors[i % colors.length]).setDepth(36).setAngle(Phaser.Math.Between(0, 180));
      this.tweens.add({ targets: c, y: FLOOR_Y - Phaser.Math.Between(0, 40), angle: c.angle + Phaser.Math.Between(180, 540), x: c.x + Phaser.Math.Between(-80, 80), duration: Phaser.Math.Between(1600, 2600), delay: Phaser.Math.Between(0, 900), ease: "Sine.easeIn" });
    }
  }

  private enterArena() {
    this.arena.entered = true;
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.setBounds(this.arena.left, 0, W, H);
    cam.zoomTo(ARENA_ZOOM, 700, "Sine.easeInOut");
    cam.pan(this.arena.left + W / 2, H / 2, 700, "Sine.easeInOut");
    this.gate = this.add.zone(this.arena.left - 20, FLOOR_Y - 400, 40, 800);
    this.physics.add.existing(this.gate, true);
    this.physics.add.collider(this.hero.rect, this.gate);
    const g = this.add.graphics().setDepth(8);
    g.fillStyle(0x55301e, 1);
    g.fillRect(this.arena.left - 40, 60, 40, FLOOR_Y - 60);
    g.lineStyle(6, INK_HEX, 1);
    g.strokeRect(this.arena.left - 40, 60, 40, FLOOR_Y - 60);
    this.hud.showBoss(true);
    this.hud.setBoss(this.boss!.hp, this.boss!.maxHp);
    this.boss!.intro(this.t);
    this.hud.flash("INSPETOR DO SILÊNCIO", "#f06ba8", 1400, "Ataque quando ele ficar tonto ou cansado.");
    this.announce("Chefe: Inspetor do Silêncio. Desvie dos ataques e acerte quando ele ficar tonto, cansado ou com a prancheta presa.");
  }

  private updateProgress() {
    const end = this.level.exit ? cx(this.level.exit.col) : this.level.boss ? cx(this.level.boss.arena) : this.world.width;
    const k = (this.hero?.x ?? 0) / end;
    this.hud.setProgress(k, this.level.checkpoints.map((c) => cx(c) / end));
  }

  private updateTutorial() {
    if (this.tutorial === "done") return;
    const x = this.hero.x;
    if (this.chip) this.chip.setPosition(x, this.hero.body.top - 70);
    if (this.tutorial === "walk" && x > cx(6)) {
      this.tutorial = "jump";
      this.showChip(TOUCH_UI ? "PARA PULAR" : "ESPAÇO PARA PULAR", TOUCH_UI ? ["chip-jump"] : []);
      this.hud.pulseJump(true);
    } else if (this.tutorial === "attack" && x > cx(15)) {
      this.tutorial = "done";
      this.showChip(TOUCH_UI ? "PARA ATACAR" : "J PARA ATACAR", TOUCH_UI ? ["chip-attack"] : []);
      this.announce("Aperte J para atacar.");
      this.time.delayedCall(4000, () => this.hideChip());
    }
  }

  private syncVisual() {
    if (!this.hero) return;
    this.hero.sync(this.t, this.invulnUntil);
    for (const e of this.enemies) e.sync();
    this.boss?.sync();
    if (this.chip && this.tutorial === "done") this.chip.setPosition(this.hero.x, this.hero.body.top - 70);
    const cam = this.cameras.main;
    const v = cam.worldView;
    const z = cam.zoom;
    const sp = (x: number, y: number): [number, number] => [(x - v.x) * z, (y - v.y) * z];
    const others: [number, number][] = this.enemies.filter((e) => !e.dead).map((e) => sp(e.x, e.body.center.y));
    if (this.boss) others.push(sp(this.boss.x, this.boss.body.center.y));
    for (const w of this.waves) others.push(sp(w.img.x, w.img.y - 60));
    for (const b of this.balls) others.push(sp(b.img.x, b.img.y));
    const [hx, hy] = sp(this.hero.x, this.hero.body.center.y);
    this.hud.avoid(hx, hy, others);
    if (this.scenery.spotlight && this.boss) this.scenery.spotlight.x = Phaser.Math.Linear(this.scenery.spotlight.x, this.boss.x, 0.08);
  }

  update(time: number, delta: number) {
    if (this.mode === "attract") return;
    if (time < this.hitStopUntil) {
      if (!this.physics.world.isPaused) this.physics.world.pause();
      return;
    }
    if (this.physics.world.isPaused) this.physics.world.resume();
    const dt = Math.min(delta, 50) / 1000;
    this.t += dt * 1000;
    const t = this.t;

    const playing = this.mode === "play";
    const input = playing
      ? {
          left: this.keys.left.isDown || this.keys.a.isDown || this.hud.touch.left,
          right: this.keys.right.isDown || this.keys.d.isDown || this.hud.touch.right,
          jumpHeld: this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown || this.hud.touch.jump,
        }
      : { left: false, right: false, jumpHeld: false };
    const hx = this.hero.x;
    const slippery = this.hero.grounded && this.world.slips.some(([a, b]) => hx > a && hx < b);
    this.hero.update(t, dt, input, slippery, 0);
    for (const c of this.carts) c.update(dt);

    if (this.mode === "won" || this.mode === "ko") return;

    const view = this.heroView();
    for (const e of this.enemies) e.update(t, dt, view);
    this.boss?.update(t, dt, view);
    for (const s of this.spawners) s.update(dt, view.x);
    for (const w of this.waves) w.update(dt);
    for (const b of this.balls) b.update(dt);
    for (const it of this.items) it.update(t);
    if (this.scenery.update(t, this.hero.x, this.hero.body.velocity.x, this.hero.grounded, this.cameras.main.worldView)) this.sfx("swing", 0.3);

    this.lookAhead = Phaser.Math.Linear(this.lookAhead, -this.hero.facing * 170, 0.04);
    if (!this.arena.entered) this.cameras.main.setFollowOffset(this.lookAhead, 120);

    const atk = this.hero.attackBox(t);
    if (atk) this.resolveAttack(atk, t);
    const hr = this.heroRect();
    for (const e of this.enemies) {
      const box = e.attackBox();
      if (box && Phaser.Geom.Intersects.RectangleToRectangle(hr, box)) this.hurt(e.x);
    }
    if (this.boss) {
      const box = this.boss.attackBox();
      if (box && Phaser.Geom.Intersects.RectangleToRectangle(hr, box)) this.hurt(this.boss.x);
    }
    for (const w of this.waves) {
      if (w.alive && Phaser.Geom.Intersects.RectangleToRectangle(hr, w.box())) {
        this.hurt(w.img.x);
        if (!w.big) w.kill();
      }
    }
    for (const b of this.balls) if (b.harmful && Phaser.Geom.Intersects.RectangleToRectangle(hr, b.box())) {
      this.hurt(b.img.x);
      b.kill();
    }
    this.waves = this.waves.filter((w) => w.alive);
    this.balls = this.balls.filter((b) => b.alive);
    this.enemies = this.enemies.filter((e) => !(e.dead && !e.sprite.active));
    if (this.mode !== "play") return;

    for (const it of this.items) {
      if (!it.near(view.x, view.top, view.feet)) continue;
      it.take(this);
      if (it.kind === "snack") {
        this.hearts = Math.min(HEARTS, this.hearts + 1);
        this.hud.setHearts(this.hearts, "gained");
        this.sfx("heal", 0.9);
        this.word("LANCHE!", it.img.x, it.img.y - 50, "#93cf4c", 40);
        this.announce("Lanche! Mais um coração.");
      } else {
        this.stickers += 1;
        this.addScore(SCORE.sticker);
        this.sfx("coin", 0.8);
        this.word(`+${SCORE.sticker}`, it.img.x, it.img.y - 40, "#ffc83d", 36);
      }
    }
    for (const bell of this.bells) {
      if (bell.reached || view.x < bell.x - 30) continue;
      bell.ring(this, this.ctx.reducedMotion);
      this.sfx("bell", 0.9);
      this.word("SALVO!", bell.x, FLOOR_Y - 260, "#63d6c1", 44);
      const col = Math.round((bell.x - TILE / 2) / TILE);
      this.registry.set("checkpoint", { level: this.levelIndex, col, score: this.score, kills: this.kills, stickers: this.stickers } satisfies Checkpoint);
      this.announce("Sino tocado! Se for pego, você volta daqui.");
    }

    if (this.hero.feet > H + 120) {
      this.fell();
      return;
    }
    if (this.hero.body.blocked.down && this.world.groundAt(view.x - 70) && this.world.groundAt(view.x + 70) && t > this.invulnUntil) {
      this.safe = { x: this.hero.rect.x, y: this.hero.rect.y };
    }
    this.updateTutorial();
    this.updateProgress();
    if (this.exitZone && Phaser.Geom.Intersects.RectangleToRectangle(hr, this.exitZone)) this.win();
    if (this.boss && !this.arena.entered && view.x > this.arena.left + 260) this.enterArena();
  }

  private resolveAttack(atk: Phaser.Geom.Rectangle, t: number) {
    const id = this.hero.attackId;
    const fromX = this.hero.x;
    for (const e of this.enemies) {
      if (e.dead || !Phaser.Geom.Intersects.RectangleToRectangle(atk, e.bounds())) continue;
      const res = e.hitBy(id, fromX, t);
      if (!res || res === "dodge") continue;
      if (res === "block") {
        this.hero.knock(e.x, t, 260, 120);
        continue;
      }
      this.onEnemyHit(e.x, e.body.center.y - 30, res === "kill");
      if (this.tutorial === "attack") this.tutorial = "done";
      if (res === "kill") {
        this.kills += 1;
        const pts = e.kind === "shield" ? SCORE.shield : e.kind === "whistle" ? SCORE.whistle : SCORE.common;
        this.killScore += pts;
        this.addScore(pts);
        this.word(`+${pts}`, e.x, e.body.top - 70, "#9df0dc", 36);
        if (this.chip && this.tutorial === "done") this.hideChip();
      }
    }
    if (this.boss) {
      const b = this.boss.body;
      const r = new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
      if (Phaser.Geom.Intersects.RectangleToRectangle(atk, r)) {
        const res = this.boss.hitBy(id, fromX, t);
        if (res === "block") this.hero.knock(this.boss.x, t, 300, 160);
        else if (res) {
          this.onEnemyHit(this.boss.x, b.center.y - 40, res === "kill", true);
          this.hud.setBoss(this.boss.hp, this.boss.maxHp);
          if (res === "kill") this.bossDown();
        }
      }
    }
    const prop = this.scenery.hitReactive(atk, id);
    if (prop) this.sfx(prop === "locker" || prop === "metal" ? "block" : prop === "bin" ? "boing" : "swing", 0.35);
    for (const w of this.waves) {
      if (w.alive && !w.big && Phaser.Geom.Intersects.RectangleToRectangle(atk, w.box())) {
        w.kill();
        this.sfx("pop", 0.8);
        this.addScore(SCORE.wave);
        this.word("PLIM!", w.img.x, w.img.y - 40, "#9df0dc", 32);
      }
    }
    for (const b of this.balls) {
      if (b.harmful && Phaser.Geom.Intersects.RectangleToRectangle(atk, b.box())) {
        b.kick(this.hero.facing);
        this.addScore(SCORE.wave);
        this.word("CHUTE!", b.img.x, b.img.y - 50, "#fbf5e6", 34);
      }
    }
  }

  private onEnemyHit(x: number, y: number, kill: boolean, boss = false) {
    this.hitStopUntil = this.time.now + (kill ? HIT_STOP_MS * 1.6 : HIT_STOP_MS);
    this.sfx(boss ? "bossHit" : "hit", 0.9);
    if (kill && !boss) this.time.delayedCall(60, () => this.sfx("ko", 0.8));
    this.pow(x + this.hero.facing * 10, y, kill ? 1 : 0.75);
    this.burst(x, y, kill ? 6 : 3);
    this.word(Phaser.Utils.Array.GetRandom(HIT_WORDS) as string, x, y - 90, "#ffc83d", kill ? 54 : 44);
    if (!this.ctx.reducedMotion) this.cameras.main.shake(kill ? 110 : 70, kill ? 0.006 : 0.003);
  }

  private bossDown() {
    this.sfx("crash", 1);
    if (!this.ctx.reducedMotion) {
      this.cameras.main.shake(400, 0.012);
      this.tweens.add({ targets: this.boss!.sprite, angle: -14, y: this.boss!.sprite.y + 10, duration: 500, ease: "Bounce.easeOut" });
    }
    this.hud.hideTop();
    this.clearShots();
    this.word("SILÊNCIO... QUEBRADO!", this.boss!.x, FLOOR_Y - 380, "#fbf5e6", 44);
    this.time.delayedCall(600, () => this.win());
  }
}
