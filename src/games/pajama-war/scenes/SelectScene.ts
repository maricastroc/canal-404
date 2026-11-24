import * as Phaser from "phaser";
import type { GameHostContext } from "@/games/types";
import type { Locale } from "@/i18n/locales";
import { ARENAS } from "../arenas";
import { COPY, type PajamaCopy } from "../copy";
import { H, KID_INFO, KIDS, PILLOW_ANCHORS, SPRITE_ORIGIN_Y, STATS, W, type KidId } from "../config";
import type { Frame } from "../layout";
import { PAJAMA_SFX, type PajamaSfx } from "../sounds";
import { loadStats } from "../storage";
import { INK, INK_HEX, cartoonText } from "../../kit/ui";
import { eachKeyOnce } from "../../kit/keys";
import { KID_RES } from "./BootScene";
import { currentFrame, watchFrame } from "./frame";
import { makeTextures } from "./room";

const CARD = { w: 450, h: 640 };
const CARD_KID = 1.18;
const CARD_BG: Record<KidId, number> = { lia: 0xffe46e, nico: 0xcdbcff, bia: 0xffadd2 };
const BAR_ICONS = ["icon-speed", "icon-attack", "icon-regen"];
const TOUCH_UI = typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches);

type Card = {
  kid: KidId;
  root: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  held: Phaser.GameObjects.Image;
  heldBack: Phaser.GameObjects.Image;
  frame: Phaser.GameObjects.Graphics;
  fx: Phaser.GameObjects.Graphics;
  flyer: Phaser.GameObjects.Image;
  pop: Phaser.GameObjects.Image;
  x: number;
  hover: boolean;
};

type Spot = { cx: number; cardY: number; scale: number; spacing: number; carousel: boolean };

type Act = { pose: string; x: number; facing: number; angle: number; sy: number; flyer: { x: number; y: number; angle: number } | null; lines: number; target: number; pop: number; showHeld: boolean };

const FLOOR_Y = 104;
const LOOP: Record<KidId, number> = { lia: 1900, nico: 2100, bia: 2300 };
const TARGET = { x: 148, y: -52 };

export class SelectScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private locale!: Locale;
  private text!: PajamaCopy["select"];
  private cards: Card[] = [];
  private index = 0;
  private loopStart = 0;
  private starting = false;
  private act: Act = { pose: "idle-f", x: 0, facing: 1, angle: 0, sy: 1, flyer: null, lines: 0, target: 0, pop: 0, showHeld: true };
  private frame!: Frame;
  private spot: Spot = { cx: W / 2, cardY: 590, scale: 1, spacing: 500, carousel: false };
  private backdrop: Phaser.GameObjects.GameObject[] = [];
  private wall!: Phaser.GameObjects.TileSprite;
  private floor!: Phaser.GameObjects.TileSprite;
  private shade!: Phaser.GameObjects.Rectangle;
  private vignette!: Phaser.GameObjects.Image;
  private feathers: Phaser.GameObjects.Image[] = [];
  private titleBox!: Phaser.GameObjects.Container;
  private arenaLabel!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private startBtn!: Phaser.GameObjects.Container;
  private dots!: Phaser.GameObjects.Graphics;
  private swipe: { id: number; x: number; y: number; at: number } | null = null;

  constructor() {
    super("select");
  }

  init() {
    this.cards = [];
    this.feathers = [];
    this.backdrop = [];
    this.swipe = null;
    this.starting = false;
    this.loopStart = 0;
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    this.locale = this.ctx.locale;
    this.text = COPY[this.locale].select;
    makeTextures(this);
    const fonts = this.ctx.fonts;
    const reduced = this.ctx.reducedMotion;
    this.frame = currentFrame(this);
    this.cameras.main.setBackgroundColor("#1d1830");
    this.wall = this.add.tileSprite(0, 0, W, 420, "wall-bedroom").setOrigin(0, 0);
    this.floor = this.add.tileSprite(0, 420, W, H - 420, "floor-bedroom").setOrigin(0, 0);
    this.shade = this.add.rectangle(0, 0, W, H, 0x140f26, 0.62).setOrigin(0, 0);
    this.vignette = this.add.image(0, 0, "vignette").setOrigin(0, 0).setDisplaySize(W, H).setAlpha(0.6);
    for (let i = 0; i < 14; i += 1) {
      const f = this.add.image(Phaser.Math.Between(40, W - 40), Phaser.Math.Between(40, H - 40), "feather").setAlpha(0.35).setScale(Phaser.Math.FloatBetween(0.6, 1.1)).setAngle(Phaser.Math.Between(0, 360));
      f.setData("u", Phaser.Math.FloatBetween(0.02, 0.98)).setData("v", Phaser.Math.FloatBetween(0.04, 0.96));
      this.feathers.push(f);
      if (!reduced) this.tweens.add({ targets: f, y: f.y + Phaser.Math.Between(30, 70), angle: f.angle + Phaser.Math.Between(-60, 60), duration: Phaser.Math.Between(2600, 4200), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }

    const title = cartoonText(this, 0, 0, this.text.title, { size: 60, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const tw = title.width + 70;
    const tg = this.add.graphics();
    tg.fillStyle(INK_HEX, 1);
    tg.fillRoundedRect(-tw / 2 + 7, -50 + 8, tw, 100, 12);
    tg.fillStyle(0xfbf5e6, 1);
    tg.fillRoundedRect(-tw / 2, -50, tw, 100, 12);
    tg.lineStyle(6, INK_HEX, 1);
    tg.strokeRoundedRect(-tw / 2, -50, tw, 100, 12);
    this.titleBox = this.add.container(W / 2, 92, [tg, title]).setAngle(-1.5).setSize(tw, 100);

    const level = Phaser.Math.Clamp((this.registry.get("level") as number | undefined) ?? 0, 0, ARENAS.length - 1);
    this.arenaLabel = cartoonText(this, 34, 200, this.text.arena(level + 1, ARENAS[level].title[this.locale]), { size: 30, color: "#ffc83d", font: fonts.display, stroke: 0.18 });

    const stats = loadStats();
    const last = (this.registry.get("kid") as KidId | null) ?? stats.lastKid ?? "lia";
    this.index = Math.max(0, KIDS.indexOf(last));
    KIDS.forEach((kid, i) => this.cards.push(this.makeCard(kid, W / 2 + (i - 1) * 500, 590, stats.wins[kid])));

    this.hintText = cartoonText(this, W / 2, H - 46, "", { size: 30, color: "#fbf5e6", font: fonts.display, stroke: 0.16 }).setOrigin(0.5);
    this.dots = this.add.graphics();

    const btnBg = this.add.graphics();
    btnBg.fillStyle(INK_HEX, 1);
    btnBg.fillRoundedRect(-160 + 7, -46 + 8, 320, 92, 18);
    btnBg.fillStyle(0xf06ba8, 1);
    btnBg.fillRoundedRect(-160, -46, 320, 92, 18);
    btnBg.lineStyle(6, INK_HEX, 1);
    btnBg.strokeRoundedRect(-160, -46, 320, 92, 18);
    const play = this.add.image(-92, 0, "icon-play").setScale(0.9);
    const label = cartoonText(this, 26, 0, this.text.start, { size: 44, color: "#fbf5e6", font: fonts.display, stroke: 0.18 }).setOrigin(0.5);
    const btn = this.add.container(W - 230, H - 70, [btnBg, play, label]).setSize(320, 92).setInteractive({ useHandCursor: true });
    btn.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.go());
    this.startBtn = btn;
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.swipeStart, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.swipeEnd, this);

    const kb = this.input.keyboard!;
    kb.on("keydown", eachKeyOnce((event) => {
      const key = event.key.toLowerCase();
      if (key === "escape" || key === "p") {
        this.ctx.onEvent({ type: "pause-request" });
        return;
      }
      if (event.repeat) return;
      if (key === "arrowleft" || key === "a") this.choose((this.index + 2) % 3);
      else if (key === "arrowright" || key === "d") this.choose((this.index + 1) % 3);
      else if (key === "1" || key === "2" || key === "3") this.choose(Number(key) - 1);
      else if (key === "enter" || key === " ") {
        event.preventDefault();
        this.go();
      }
    }));
    watchFrame(this, (frame) => this.applyFrame(frame));
    this.choose(this.index, true);
    this.ctx.onEvent({ type: "announce", message: this.text.intro });
  }

  private pulseButton() {
    const base = this.startBtn.scale;
    this.tweens.killTweensOf(this.startBtn);
    this.startBtn.setScale(base);
    this.tweens.add({ targets: this.startBtn, scale: base * 1.05, duration: 620, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private applyFrame(frame: Frame) {
    this.frame = frame;
    const gw = frame.width;
    const gh = frame.height;
    this.cameras.main.setSize(gw, gh);
    const wallH = frame.kind === "tall" ? Math.round(gh * 0.3) : 420;
    this.wall.setSize(gw, wallH);
    this.floor.setPosition(0, wallH).setSize(gw, gh - wallH);
    this.shade.setSize(gw, gh);
    this.vignette.setDisplaySize(gw, gh);
    for (const f of this.feathers) f.setPosition(40 + (gw - 80) * (f.getData("u") as number), 40 + (gh - 80) * (f.getData("v") as number));
    const u = frame.unit;
    const safe = frame.safe;
    this.hintText.setText(TOUCH_UI ? (frame.kind === "tall" ? this.text.swipeHint : this.text.touchHint) : this.text.keysHint);
    if (frame.kind === "full") {
      this.spot = { cx: W / 2, cardY: 590, scale: 1, spacing: 500, carousel: false };
      this.titleBox.setPosition(W / 2, 92).setScale(1);
      this.arenaLabel.setOrigin(0, 0).setPosition(34, 200).setScale(1);
      this.hintText.setPosition(W / 2, H - 46).setScale(1);
      this.startBtn.setPosition(W - 230, H - 70).setScale(1);
      this.dots.clear();
    } else if (frame.kind === "band") {
      const btnScale = (48 * u) / 92;
      const btnW = 320 * btnScale;
      const right = gw - safe.right - 24 * u;
      const room = right - btnW - 28 * u - (safe.left + 24 * u);
      const k = Math.min(1.1, room / 1460);
      const cx = safe.left + 24 * u + room / 2;
      this.spot = { cx, cardY: 572, scale: k, spacing: 500 * k, carousel: false };
      this.titleBox.setPosition(cx, 86).setScale(1);
      this.arenaLabel.setOrigin(0.5, 0.5).setPosition(right - btnW / 2, 86).setScale(1.15);
      this.hintText.setPosition(cx, gh - 40).setScale(1.2);
      this.startBtn.setPosition(right - btnW / 2, 572).setScale(btnScale);
      this.dots.clear();
    } else {
      const top = 14 * u;
      const titleScale = Math.min(1, (gw - 24 * u) / (this.titleBox.width + 20));
      this.titleBox.setPosition(gw / 2, top + 52 * titleScale).setScale(titleScale);
      const arenaY = top + 104 * titleScale + 26 * u;
      this.arenaLabel.setOrigin(0.5, 0.5).setPosition(gw / 2, arenaY).setScale((15 * u) / 30);
      const btnScale = (54 * u) / 92;
      const btnY = gh - safe.bottom - 22 * u - 46 * btnScale;
      this.startBtn.setPosition(gw / 2, btnY).setScale(btnScale);
      const hintY = btnY - 46 * btnScale - 20 * u;
      this.hintText.setPosition(gw / 2, hintY).setScale((14 * u) / 30);
      const dotsY = hintY - 24 * u;
      const cardTop = arenaY + 22 * u;
      const cardBottom = dotsY - 18 * u;
      const scale = Math.min((gw * 0.68) / CARD.w, (cardBottom - cardTop) / (CARD.h + 20));
      this.spot = { cx: gw / 2, cardY: (cardTop + cardBottom) / 2, scale, spacing: (CARD.w * scale * 0.5 + 18 * u + CARD.w * scale * 0.82 * 0.5), carousel: true };
      this.dots.setData("y", dotsY);
    }
    if (!this.ctx.reducedMotion) this.pulseButton();
    for (const c of this.cards) c.root.setInteractive({ useHandCursor: !this.spot.carousel });
    this.paint(true);
  }

  private relative(j: number) {
    return ((j - this.index + 4) % 3) - 1;
  }

  private swipeStart(p: Phaser.Input.Pointer) {
    if (!this.spot.carousel || this.starting) return;
    this.swipe = { id: p.id, x: p.x, y: p.y, at: this.time.now };
  }

  private swipeEnd(p: Phaser.Input.Pointer) {
    const sw = this.swipe;
    if (!sw || sw.id !== p.id || !this.spot.carousel || this.starting) return;
    this.swipe = null;
    const dx = p.x - sw.x;
    const dy = p.y - sw.y;
    const u = this.frame.unit;
    if (Math.abs(dx) > 34 * u && Math.abs(dx) > Math.abs(dy) * 1.2) {
      this.choose((this.index + (dx < 0 ? 1 : 2)) % 3);
      return;
    }
    if (Math.hypot(dx, dy) > 14 * u) return;
    const hit = this.cards.find((c) => {
      const w = (CARD.w * c.root.scaleX) / 2;
      const h = (CARD.h * c.root.scaleY) / 2;
      return Math.abs(p.x - c.root.x) < w && Math.abs(p.y - c.root.y) < h;
    });
    if (!hit) return;
    const i = KIDS.indexOf(hit.kid);
    if (i === this.index) this.go();
    else this.choose(i);
  }

  private paintDots() {
    const g = this.dots;
    g.clear();
    if (!this.spot.carousel) return;
    const u = this.frame.unit;
    const y = this.dots.getData("y") as number;
    const gap = 22 * u;
    KIDS.forEach((kid, i) => {
      const x = this.spot.cx + (i - 1) * gap;
      const on = i === this.index;
      const r = (on ? 6 : 4.5) * u;
      g.fillStyle(INK_HEX, 1);
      g.fillCircle(x + 1.2 * u, y + 1.6 * u, r + 1.5 * u);
      g.fillStyle(on ? KID_INFO[kid].color : 0xfbf5e6, on ? 1 : 0.55);
      g.fillCircle(x, y, r);
    });
  }

  private sfx(name: PajamaSfx, volume = 1) {
    this.ctx.audio.play(PAJAMA_SFX[name], { volume });
  }

  private makeCard(kid: KidId, x: number, y: number, wins: number): Card {
    const fonts = this.ctx.fonts;
    const info = KID_INFO[kid];
    const parts: Phaser.GameObjects.GameObject[] = [];
    const g = this.add.graphics();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(-CARD.w / 2 + 9, -CARD.h / 2 + 11, CARD.w, CARD.h, 26);
    g.fillStyle(CARD_BG[kid], 1);
    g.fillRoundedRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 26);
    g.fillStyle(0xffffff, 0.22);
    g.fillRoundedRect(-CARD.w / 2 + 16, -CARD.h / 2 + 16, CARD.w - 32, 120, 18);
    parts.push(g);
    const frame = this.add.graphics();
    parts.push(frame);
    parts.push(cartoonText(this, 0, -CARD.h / 2 + 62, info.name.toUpperCase(), { size: 74, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5));
    parts.push(cartoonText(this, 0, -CARD.h / 2 + 118, info.title[this.locale].toUpperCase(), { size: 30, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5).setAlpha(0.85));
    const floorY = FLOOR_Y;
    parts.push(this.add.image(0, floorY + 4, "blob").setDisplaySize(190, 46).setAlpha(0.5));
    const fx = this.add.graphics();
    parts.push(fx);
    const scale = CARD_KID / KID_RES;
    const sprite = this.add.image(0, floorY, `kid-${kid}-idle-f`).setOrigin(0.5, SPRITE_ORIGIN_Y).setScale(scale);
    const held = this.add.image(0, 0, "pillow").setScale((0.62 * 1.32) / 1.25).setTint(info.tint);
    const heldBack = this.add.image(0, 0, "pillow").setScale((0.62 * 1.32) / 1.25).setTint(info.tint);
    const flyer = this.add.image(0, 0, "pillow").setScale(0.5).setTint(kid === "bia" ? KID_INFO.nico.tint : info.tint).setVisible(false);
    const pop = this.add.image(0, 0, kid === "bia" ? "icon-heart-on" : "star").setVisible(false);
    parts.push(heldBack, sprite, held, flyer, pop);
    const bars = STATS[kid].bars;
    BAR_ICONS.forEach((icon, i) => {
      const label = this.text.bars[i];
      const by = 160 + i * 52;
      parts.push(this.add.image(-CARD.w / 2 + 42, by, icon).setScale(0.82));
      parts.push(cartoonText(this, -CARD.w / 2 + 66, by, label, { size: 24, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0, 0.5));
      const bg = this.add.graphics();
      const bx = 34;
      for (let s = 0; s < 5; s += 1) {
        bg.fillStyle(INK_HEX, 1);
        bg.fillRoundedRect(bx + s * 36 - 2, by - 13, 33, 28, 7);
        bg.fillStyle(s < bars[i] ? info.color : 0xfbf5e6, s < bars[i] ? 1 : 0.65);
        bg.fillRoundedRect(bx + s * 36, by - 15, 29, 24, 6);
      }
      parts.push(bg);
    });
    if (wins > 0) {
      const wg = this.add.graphics();
      wg.fillStyle(INK_HEX, 1);
      wg.fillRoundedRect(CARD.w / 2 - 152 + 4, -CARD.h / 2 + 150 + 4, 132, 40, 10);
      wg.fillStyle(0xffc83d, 1);
      wg.fillRoundedRect(CARD.w / 2 - 152, -CARD.h / 2 + 150, 132, 40, 10);
      wg.lineStyle(3.5, INK_HEX, 1);
      wg.strokeRoundedRect(CARD.w / 2 - 152, -CARD.h / 2 + 150, 132, 40, 10);
      parts.push(wg, this.add.image(CARD.w / 2 - 128, -CARD.h / 2 + 170, "icon-trophy").setScale(0.8));
      parts.push(cartoonText(this, CARD.w / 2 - 104, -CARD.h / 2 + 170, `${wins}`, { size: 26, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0, 0.5));
    }
    const root = this.add.container(x, y, parts).setSize(CARD.w, CARD.h).setInteractive({ useHandCursor: true });
    root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      if (this.spot.carousel) return;
      const i = KIDS.indexOf(kid);
      if (i === this.index) this.go();
      else this.choose(i);
    });
    const card: Card = { kid, root, sprite, held, heldBack, frame, fx, flyer, pop, x, hover: false };
    root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      if (TOUCH_UI || this.spot.carousel) return;
      card.hover = true;
      this.paint();
    });
    root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      card.hover = false;
      this.paint();
    });
    return card;
  }

  private paint(snap = false) {
    const reduced = this.ctx.reducedMotion || snap;
    const spot = this.spot;
    this.paintDots();
    this.cards.forEach((c, j) => {
      const on = j === this.index;
      const hover = c.hover && !on && !spot.carousel;
      c.frame.clear();
      if (on) {
        c.frame.lineStyle(10, 0xffc83d, 1);
        c.frame.strokeRoundedRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 26);
        c.frame.lineStyle(4, INK_HEX, 1);
        c.frame.strokeRoundedRect(-CARD.w / 2 - 7, -CARD.h / 2 - 7, CARD.w + 14, CARD.h + 14, 30);
      } else if (hover) {
        c.frame.lineStyle(9, KID_INFO[c.kid].color, 1);
        c.frame.strokeRoundedRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 26);
        c.frame.lineStyle(3, INK_HEX, 1);
        c.frame.strokeRoundedRect(-CARD.w / 2 + 6, -CARD.h / 2 + 6, CARD.w - 12, CARD.h - 12, 22);
      } else {
        c.frame.lineStyle(6, INK_HEX, 1);
        c.frame.strokeRoundedRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 26);
      }
      this.tweens.killTweensOf(c.root);
      const rel = this.relative(j);
      const k = spot.scale;
      const target = spot.carousel
        ? { x: spot.cx + rel * spot.spacing, y: spot.cardY + (on ? 0 : 14 * this.frame.unit), scale: k * (on ? 1 : 0.82), alpha: on ? 1 : 0.62 }
        : { x: spot.cx + (j - 1) * spot.spacing, y: spot.cardY + (on ? -20 : hover ? -2 : 10) * k, scale: k * (on ? 1.02 : hover ? 0.97 : 0.94), alpha: on || hover ? 1 : 0.82 };
      c.x = target.x;
      const jump = spot.carousel && Math.abs(c.root.x - target.x) > spot.spacing * 1.5;
      if (reduced || jump) c.root.setPosition(target.x, target.y).setScale(target.scale).setAlpha(target.alpha);
      else this.tweens.add({ targets: c.root, x: target.x, y: target.y, scale: target.scale, alpha: target.alpha, duration: spot.carousel ? 260 : 220, ease: spot.carousel ? "Cubic.easeOut" : "Back.easeOut" });
      c.root.setDepth(on ? 2 : 1);
    });
  }

  private choose(i: number, silent = false) {
    this.index = i;
    this.loopStart = this.time.now;
    this.paint();
    if (!silent) {
      this.sfx("pick", 0.8);
      this.time.delayedCall(120, () => this.sfx(KIDS[i] === "lia" ? "step" : KIDS[i] === "nico" ? "throw" : "boing", 0.6));
      const kid = KIDS[i];
      this.ctx.onEvent({ type: "announce", message: this.text.picked(KID_INFO[kid].name, KID_INFO[kid].title[this.locale]) });
    }
  }

  private go() {
    if (this.starting) return;
    this.starting = true;
    const kid = KIDS[this.index];
    this.registry.set("kid", kid);
    this.registry.set("forcedKid", false);
    this.sfx("go", 0.9);
    const card = this.cards[this.index];
    card.sprite.setTexture(`kid-${kid}-cheer`);
    const fade = () => this.scene.start("arena", { mode: "play" });
    if (this.ctx.reducedMotion) {
      this.time.delayedCall(150, fade);
      return;
    }
    this.tweens.add({ targets: card.root, scale: 1.08, duration: 160, yoyo: true });
    this.cameras.main.fadeOut(320, 20, 15, 38);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, fade);
  }

  private perform(kid: KidId, ms: number): Act {
    const a = this.act;
    a.pose = "idle-f";
    a.x = 0;
    a.facing = 1;
    a.angle = 0;
    a.sy = 1;
    a.flyer = null;
    a.lines = 0;
    a.target = 0;
    a.pop = 0;
    a.showHeld = true;
    const run = (["run-a", "run-b", "run-c", "run-d"] as const)[Math.floor(ms / 55) % 4];
    if (kid === "lia") {
      if (ms < 220) a.sy = 1 - Math.sin((ms / 220) * Math.PI) * 0.07;
      else if (ms < 560) {
        const k = (ms - 220) / 340;
        a.pose = `${run}-s`;
        a.x = k * 112;
        a.lines = 1;
      } else if (ms < 680) {
        a.pose = "idle-s";
        a.x = 112;
        a.angle = -8;
      } else if (ms < 1120) {
        const k = (ms - 680) / 440;
        a.pose = `${run}-s`;
        a.x = 112 - k * 224;
        a.facing = -1;
        a.lines = -1;
      } else if (ms < 1240) {
        a.pose = "idle-s";
        a.x = -112;
        a.facing = -1;
        a.angle = 8;
      } else if (ms < 1520) {
        const k = (ms - 1240) / 280;
        a.pose = `${run}-s`;
        a.x = -112 + k * 112;
        a.lines = 1;
      } else a.pose = "cheer";
      return a;
    }
    if (kid === "nico") {
      a.facing = 1;
      if (ms < 420) a.pose = "idle-s";
      else if (ms < 720) a.pose = "windup-s";
      else if (ms < 1500) {
        a.pose = ms < 1100 ? "throw-s" : "cheer";
        a.showHeld = false;
      } else a.pose = "idle-s";
      if (ms >= 760 && ms < 1060) {
        const k = (ms - 760) / 300;
        a.flyer = { x: 40 + (TARGET.x - 40) * k, y: -100 + (TARGET.y + 100) * k - Math.sin(k * Math.PI) * 50, angle: k * 540 };
      }
      if (ms >= 1060) a.target = Math.max(0, 1 - (ms - 1060) / 500);
      if (ms >= 1060 && ms < 1500) a.pop = (ms - 1060) / 440;
      return a;
    }
    a.pose = "idle-f";
    if (ms >= 420 && ms < 760) {
      const k = (ms - 420) / 340;
      a.flyer = { x: -230 + 210 * k, y: -170 + Math.sin(k * Math.PI) * -30, angle: k * 600 };
    } else if (ms >= 760 && ms < 1300) {
      a.pose = "hurt";
      a.sy = ms < 860 ? 0.86 : 1;
      a.angle = Math.sin((ms - 760) / 50) * (1 - (ms - 760) / 540) * 9;
    } else if (ms >= 1300 && ms < 1520) {
      a.angle = Math.sin((ms - 1300) / 30) * 5;
    } else if (ms >= 1520 && ms < 2150) {
      a.pose = "cheer";
      a.pop = (ms - 1520) / 630;
    }
    return a;
  }

  update(time: number) {
    const reduced = this.ctx.reducedMotion;
    const scale = CARD_KID / KID_RES;
    this.cards.forEach((c, j) => {
      const on = j === this.index;
      let act: Act | null = null;
      if (on && this.starting) {
        act = this.perform(c.kid, 99999);
        act.pose = "cheer";
      } else if (on && !reduced) act = this.perform(c.kid, (time - this.loopStart) % LOOP[c.kid]);
      const pose = act?.pose ?? (on && reduced ? "cheer" : "idle-f");
      const facing = act?.facing ?? 1;
      c.sprite.setTexture(`kid-${c.kid}-${pose}`).setFlipX(facing < 0).setX(act?.x ?? 0).setAngle(act?.angle ?? 0);
      const bob = reduced ? 1 : 1 + Math.sin(time / 260 + j) * 0.02;
      c.sprite.setScale(scale, scale * bob * (act?.sy ?? 1));
      const anchor = PILLOW_ANCHORS[pose];
      const show = act?.showHeld ?? true;
      c.held.setVisible(show && anchor?.layer === "front");
      c.heldBack.setVisible(show && anchor?.layer === "back");
      if (anchor) {
        const k = CARD_KID;
        const img = anchor.layer === "front" ? c.held : c.heldBack;
        img.setPosition((act?.x ?? 0) + anchor.x * k * facing, FLOOR_Y + anchor.y * k * bob).setAngle(anchor.angle * facing).setFlipX(facing < 0);
      }
      c.flyer.setVisible(Boolean(act?.flyer));
      if (act?.flyer) c.flyer.setPosition(act.flyer.x, act.flyer.y).setAngle(act.flyer.angle);
      c.fx.clear();
      if (on && act && c.kid === "lia" && act.lines) {
        const x = act.x - act.lines * 70;
        for (const [dy, len] of [
          [-110, 60],
          [-60, 84],
          [-10, 52],
        ]) {
          c.fx.lineStyle(9, INK_HEX, 0.85);
          c.fx.lineBetween(x, dy, x - act.lines * len, dy);
          c.fx.lineStyle(5, 0xfbf5e6, 1);
          c.fx.lineBetween(x, dy, x - act.lines * len, dy);
        }
      }
      if (on && c.kid === "nico" && !reduced) {
        const wob = act ? act.target * Math.sin(time / 30) * 6 : 0;
        const tx = TARGET.x + wob;
        c.fx.fillStyle(INK_HEX, 1);
        c.fx.fillCircle(tx + 3, TARGET.y + 4, 36);
        for (const [r, color] of [
          [34, 0xfbf5e6],
          [25, 0xef4f43],
          [16, 0xfbf5e6],
          [8, 0xef4f43],
        ] as const) {
          c.fx.fillStyle(color, 1);
          c.fx.fillCircle(tx, TARGET.y, r);
        }
        c.fx.lineStyle(4, INK_HEX, 1);
        c.fx.strokeCircle(tx, TARGET.y, 34);
        c.fx.lineStyle(6, INK_HEX, 1);
        c.fx.lineBetween(tx, TARGET.y + 34, tx, FLOOR_Y);
      }
      const pop = act?.pop ?? 0;
      c.pop.setVisible(on && pop > 0 && pop < 1);
      if (pop > 0 && pop < 1) {
        const at = c.kid === "nico" ? { x: TARGET.x, y: TARGET.y - 40 } : { x: 104, y: -118 };
        c.pop.setPosition(at.x, at.y - pop * 40).setScale((c.kid === "bia" ? 1.1 : 0.9) * (0.6 + Math.min(1, pop * 3) * 0.6)).setAlpha(1 - Math.max(0, pop - 0.7) / 0.3).setAngle(pop * 90);
      }
    });
  }
}
