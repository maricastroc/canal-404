import * as Phaser from "phaser";
import { HP, KID_INFO, W, type KidId } from "../config";
import type { PajamaCopy } from "../copy";
import { FULL_FRAME, type Frame } from "../layout";
import { INK, INK_HEX, cartoonText, type Fonts } from "../../kit/ui";

type PortraitStyle = "row" | "big" | "ring";

type Portrait = {
  kid: KidId;
  root: Phaser.GameObjects.Container;
  face: Phaser.GameObjects.Image;
  hearts: { off: Phaser.GameObjects.Image; on: Phaser.GameObjects.Image }[];
  plate: Phaser.GameObjects.Graphics;
  you: Phaser.GameObjects.Container | null;
  life: Phaser.GameObjects.Graphics;
  lifeIcon: Phaser.GameObjects.Image;
  out: Phaser.GameObjects.Container;
  badge: Phaser.GameObjects.Container;
  hp: number;
  faceUntil: number;
  scale: number;
  style: PortraitStyle;
  width: number;
};

const LIFE_R = 58;

type Pin = { root: Phaser.GameObjects.Container; arrow: Phaser.GameObjects.Graphics; ring: Phaser.GameObjects.Graphics; bang: Phaser.GameObjects.Text; shown: boolean };

export type Touch = { x: number; y: number; throwing: boolean; active: boolean; tapAt: number; aim: number | null; shot: number | null };

export type Offscreen = { kid: KidId; x: number; y: number; alert: boolean };

export type Playfield = { left: number; top: number; right: number; bottom: number };

const STICK = { base: 104, knob: 54, leash: 64, dead: 12, full: 46 };
const BUTTON_R = 112;
const FIRE = { decide: 150, start: 9, steady: 5 };
const FLOOR = 0.86;

type Fire = { id: number; x: number; y: number; at: number; mode: "pending" | "auto" | "aim" };

export class PajamaHud {
  readonly touch: Touch = { x: 0, y: 0, throwing: false, active: false, tapAt: -99999, aim: null, shot: null };
  private timer: Phaser.GameObjects.Text;
  private portraits = new Map<KidId, Portrait>();
  private banner: Phaser.GameObjects.Text;
  private sub: Phaser.GameObjects.Text;
  private bannerTop = false;
  private stickBase: Phaser.GameObjects.Arc;
  private stickKnob: Phaser.GameObjects.Arc;
  private stickLabel: Phaser.GameObjects.Text;
  private throwLabel: Phaser.GameObjects.Text;
  private throwBtn: Phaser.GameObjects.Container;
  private throwPress: Phaser.GameObjects.Arc;
  private throwRing: Phaser.GameObjects.Graphics;
  private throwIcon: Phaser.GameObjects.Image;
  private aimKnob: Phaser.GameObjects.Container;
  private stickId: number | null = null;
  private fire: Fire | null = null;
  private tutorialStep: "off" | "basics" | "aim" = "off";
  private stickOrigin = { x: 0, y: 0 };
  private stickRest = { x: 0, y: 0 };
  private stickScale = 1;
  private buttonScale = 1;
  private touchUi = false;
  private controlsOn = true;
  private bannerTimer?: Phaser.Time.TimerEvent;
  private tag: Phaser.GameObjects.Container;
  private timerBox: Phaser.GameObjects.Container;
  private order: Portrait[] = [];
  private k = 1;
  private frame: Frame = FULL_FRAME;
  private displayWidth = 0;
  private tip: Phaser.GameObjects.Container;
  private tipText: Phaser.GameObjects.Text;
  private tipBg: Phaser.GameObjects.Graphics;
  private tipTimer?: Phaser.Time.TimerEvent;
  private tipScale = 1;
  private deck: Phaser.GameObjects.Graphics;
  private deckDots: Phaser.GameObjects.TileSprite;
  private deckColor = 0x7c4527;
  private pins = new Map<KidId, Pin>();
  private cooldown = { k: 1, special: false };
  readonly top: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    arenaTitle: string,
    kids: { kid: KidId; isPlayer: boolean }[],
    private reduced: boolean,
    private text: PajamaCopy["hud"],
  ) {
    this.makeTextures();
    const tag = scene.add.container(150, 58).setAngle(-3);
    const tg = scene.add.graphics();
    const label = cartoonText(scene, 0, 0, arenaTitle.toUpperCase(), { size: 34, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const tw = label.width + 44;
    tg.fillStyle(INK_HEX, 1);
    tg.fillRoundedRect(-tw / 2 + 5, -30, tw, 62, 8);
    tg.fillStyle(0xfbf5e6, 1);
    tg.fillRoundedRect(-tw / 2, -34, tw, 62, 8);
    tg.lineStyle(5, INK_HEX, 1);
    tg.strokeRoundedRect(-tw / 2, -34, tw, 62, 8);
    label.setY(-3);
    tag.add([tg, label]);
    tag.setX(28 + tw / 2);

    const tb = scene.add.graphics();
    tb.fillStyle(INK_HEX, 1);
    tb.fillRoundedRect(-118 + 5, 8, 236, 76, 18);
    tb.fillStyle(0x2b2150, 0.96);
    tb.fillRoundedRect(-118, 4, 236, 76, 18);
    tb.lineStyle(5, INK_HEX, 1);
    tb.strokeRoundedRect(-118, 4, 236, 76, 18);
    const icon = scene.add.image(-74, 42, "icon-timer");
    this.timer = cartoonText(scene, 18, 42, "00:00", { size: 48, color: "#fbf5e6", font: fonts.display, stroke: 0.14 }).setOrigin(0.5);
    const timerBox = scene.add.container(0, 10, [tb, icon, this.timer]);
    this.tag = tag;
    this.timerBox = timerBox;

    const items: Phaser.GameObjects.GameObject[] = [tag, timerBox];
    for (const { kid, isPlayer } of [...kids].reverse()) {
      const p = this.makePortrait(kid, isPlayer);
      items.push(p.root);
      this.portraits.set(kid, p);
      this.order.push(p);
    }
    this.top = scene.add.container(0, 0, items).setDepth(2000);

    this.banner = cartoonText(scene, 0, 0, "", { size: 120, color: "#ffc83d", font: fonts.display, stroke: 0.2, align: "center" }).setOrigin(0.5).setDepth(2010).setVisible(false);
    this.sub = cartoonText(scene, 0, 0, "", { size: 44, color: "#fbf5e6", font: fonts.display, stroke: 0.2, align: "center" }).setOrigin(0.5).setDepth(2010).setVisible(false);

    this.deck = scene.add.graphics().setDepth(1990).setVisible(false);
    this.deckDots = scene.add.tileSprite(0, 0, 8, 8, "deck-dots").setOrigin(0, 0).setDepth(1991).setVisible(false);

    this.stickBase = scene.add.circle(0, 0, STICK.base, 0xfbf5e6, 0.18).setStrokeStyle(6, INK_HEX, 0.6).setDepth(2005).setVisible(false);
    this.stickKnob = scene.add.circle(0, 0, STICK.knob, 0xfbf5e6, 0.85).setStrokeStyle(6, INK_HEX, 1).setDepth(2006).setVisible(false);
    this.stickLabel = cartoonText(scene, 0, 0, text.move, { size: 30, color: "#fbf5e6", font: fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(2006).setVisible(false);
    this.throwLabel = cartoonText(scene, 0, 0, text.throwHelp, { size: 30, color: "#ffc83d", font: fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(2006).setVisible(false);
    const bg = scene.add.graphics();
    bg.fillStyle(INK_HEX, 1);
    bg.fillCircle(6, 8, BUTTON_R);
    bg.fillStyle(0xf06ba8, 1);
    bg.fillCircle(0, 0, BUTTON_R);
    bg.lineStyle(7, INK_HEX, 1);
    bg.strokeCircle(0, 0, BUTTON_R);
    this.throwPress = scene.add.circle(0, 0, BUTTON_R - 4, 0xffffff, 0.3).setVisible(false);
    this.throwRing = scene.add.graphics();
    this.throwIcon = scene.add.image(0, -6, "pillow").setScale(1.05 / 1.25).setAngle(-12);
    const lbl = cartoonText(scene, 0, 64, text.throw, { size: 30, color: "#fbf5e6", font: fonts.display, stroke: 0.2 }).setOrigin(0.5);
    const kg = scene.add.graphics();
    kg.fillStyle(INK_HEX, 0.9);
    kg.fillTriangle(30, -22, 30, 22, 62, 0);
    kg.fillStyle(0xffc83d, 1);
    kg.fillTriangle(34, -14, 34, 14, 54, 0);
    kg.fillStyle(INK_HEX, 1);
    kg.fillCircle(3, 4, 38);
    kg.fillStyle(0xfff3b0, 1);
    kg.fillCircle(0, 0, 38);
    kg.lineStyle(6, INK_HEX, 1);
    kg.strokeCircle(0, 0, 38);
    this.aimKnob = scene.add.container(0, 0, [kg]).setVisible(false);
    this.throwBtn = scene.add.container(0, 0, [bg, this.throwPress, this.throwRing, this.throwIcon, lbl, this.aimKnob]).setDepth(2005).setVisible(false);

    this.tipBg = scene.add.graphics();
    this.tipText = cartoonText(scene, 0, 0, "", { size: 32, color: INK, font: fonts.display, stroke: 0, shadow: false, align: "center", wrap: 900 }).setOrigin(0.5);
    this.tip = scene.add.container(W / 2, 156, [this.tipBg, this.tipText]).setDepth(2004).setVisible(false).setAngle(-1);

    for (const { kid, isPlayer } of kids) if (!isPlayer) this.pins.set(kid, this.makePin(kid));
  }

  private makeTextures() {
    const tex = this.scene.textures;
    if (tex.exists("deck-dots")) return;
    const g = this.scene.make.graphics({}, false);
    g.fillStyle(0xfbf5e6, 0.09);
    g.fillCircle(9, 9, 2.6);
    g.generateTexture("deck-dots", 36, 36);
    g.destroy();
  }

  private makePin(kid: KidId): Pin {
    const s = this.scene;
    const info = KID_INFO[kid];
    const arrow = s.add.graphics();
    arrow.fillStyle(INK_HEX, 1);
    arrow.fillTriangle(42, -16, 42, 16, 64, 0);
    arrow.fillStyle(info.color, 1);
    arrow.fillTriangle(44, -10, 44, 10, 57, 0);
    const disc = s.add.graphics();
    disc.fillStyle(INK_HEX, 1);
    disc.fillCircle(4, 6, 44);
    disc.fillStyle(info.pale, 1);
    disc.fillCircle(0, 0, 44);
    const face = s.add.image(0, 6, `face-${kid}-normal`).setScale(0.42);
    const ring = s.add.graphics();
    const bang = cartoonText(s, 0, -64, "!", { size: 64, color: "#ff8a3d", font: this.fonts.display, stroke: 0.24 }).setOrigin(0.5).setVisible(false);
    const root = s.add.container(0, 0, [arrow, disc, face, ring, bang]).setDepth(2003).setVisible(false);
    const pin: Pin = { root, arrow, ring, bang, shown: false };
    this.paintPin(pin, kid, false);
    return pin;
  }

  private paintPin(pin: Pin, kid: KidId, alert: boolean) {
    const g = pin.ring;
    g.clear();
    g.lineStyle(alert ? 10 : 7, alert ? 0xff8a3d : KID_INFO[kid].color, 1);
    g.strokeCircle(0, 0, 44);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeCircle(0, 0, alert ? 50 : 48);
  }

  hint(text: string, ms = 4800) {
    this.tipTimer?.remove();
    this.scene.tweens.killTweensOf(this.tip);
    this.tipText.setText(text);
    const w = this.tipText.width + 56;
    const h = this.tipText.height + 26;
    const g = this.tipBg;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(-w / 2 + 6, -h / 2 + 7, w, h, 14);
    g.fillStyle(0xfff3b0, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.lineStyle(5, INK_HEX, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    this.tip.setVisible(true).setAlpha(1).setScale(this.tipScale);
    this.placeTip();
    if (!this.reduced) {
      this.tip.setScale(this.tipScale * 0.6);
      this.scene.tweens.add({ targets: this.tip, scale: this.tipScale, duration: 280, ease: "Back.easeOut" });
    }
    this.tipTimer = this.scene.time.delayedCall(ms, () => {
      this.scene.tweens.add({ targets: this.tip, alpha: 0, duration: 260, onComplete: () => this.tip.setVisible(false) });
    });
  }

  private placeTip() {
    const h = (this.tipText.height + 26) * this.tipScale;
    const f = this.frame;
    if (f.kind === "full") {
      this.tip.setPosition(f.width / 2, (this.k === 1 ? 156 : 120 * this.k) + h / 2 - 30);
      return;
    }
    this.tip.setPosition(f.width / 2, f.hud + h / 2 + 6 * f.unit);
  }

  hideHint() {
    this.tipTimer?.remove();
    this.tip.setVisible(false);
  }

  private makePortrait(kid: KidId, isPlayer: boolean): Portrait {
    const s = this.scene;
    const info = KID_INFO[kid];
    const g = s.add.graphics();
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(4, 6, 46);
    g.fillStyle(info.pale, 1);
    g.fillCircle(0, 0, 46);
    const face = s.add.image(0, 6, `face-${kid}-normal`).setScale(0.44);
    const ring = s.add.graphics();
    ring.lineStyle(isPlayer ? 9 : 6, isPlayer ? 0xffc83d : info.color, 1);
    ring.strokeCircle(0, 0, 46);
    ring.lineStyle(4, INK_HEX, 1);
    ring.strokeCircle(0, 0, isPlayer ? 51 : 49);
    const plate = s.add.graphics();
    const life = s.add.graphics().setVisible(false);
    const lifeIcon = s.add.image(0, LIFE_R + 2, "icon-heart-on").setScale(0.62).setVisible(false);
    const hearts: Portrait["hearts"] = [];
    for (let i = 0; i < HP / 2; i += 1) {
      const hx = 66 + i * 32;
      const off = s.add.image(hx, 1, "icon-heart-off").setScale(0.78);
      const on = s.add.image(hx, 1, "icon-heart-on").setScale(0.78);
      hearts.push({ off, on });
    }
    const parts: Phaser.GameObjects.GameObject[] = [plate, ...hearts.flatMap((h) => [h.off, h.on]), life, g, face, ring, lifeIcon];
    let youTag: Phaser.GameObjects.Container | null = null;
    if (isPlayer) {
      const tg = s.add.graphics();
      tg.fillStyle(INK_HEX, 1);
      tg.fillRoundedRect(-44 + 3, 38 + 4, 88, 32, 9);
      tg.fillStyle(0xffc83d, 1);
      tg.fillRoundedRect(-44, 38, 88, 32, 9);
      tg.lineStyle(4, INK_HEX, 1);
      tg.strokeRoundedRect(-44, 38, 88, 32, 9);
      const you = cartoonText(s, 0, 54, this.text.you, { size: 24, color: INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
      youTag = s.add.container(0, 0, [tg, you]);
      parts.push(youTag);
    }
    const bg = s.add.graphics();
    bg.fillStyle(INK_HEX, 1);
    bg.fillCircle(3, 4, 22);
    bg.fillStyle(0xffc83d, 1);
    bg.fillCircle(0, 0, 22);
    bg.lineStyle(4, INK_HEX, 1);
    bg.strokeCircle(0, 0, 22);
    const pil = s.add.image(0, 0, "pillow").setScale(0.36).setTint(0xfff3b0).setAngle(-14);
    const badge = s.add.container(-38, -40, [bg, pil]).setVisible(false);
    const outBg = s.add.graphics();
    outBg.fillStyle(0x140f26, 0.55);
    outBg.fillCircle(0, 0, 47);
    const outTxt = cartoonText(s, 0, 0, this.text.out, { size: 30, color: "#ef4f43", font: this.fonts.display, stroke: 0.2 }).setOrigin(0.5).setAngle(-14);
    const out = s.add.container(0, 0, [outBg, outTxt]).setVisible(false);
    parts.push(out, badge);
    const root = s.add.container(0, 0, parts);
    const portrait: Portrait = { kid, root, face, hearts, plate, you: youTag, life, lifeIcon, out, badge, hp: HP, faceUntil: 0, scale: 1, style: "big", width: 0 };
    this.stylePortrait(portrait, "row");
    return portrait;
  }

  private stylePortrait(p: Portrait, style: PortraitStyle) {
    if (p.style === style) return;
    p.style = style;
    const big = style === "big";
    const step = big ? 42 : 32;
    const heart = big ? 1.04 : 0.78;
    const first = big ? 74 : 66;
    const end = first + step * (p.hearts.length - 1) + (big ? 30 : 14);
    p.plate.clear();
    if (style !== "ring") {
      p.plate.fillStyle(INK_HEX, 0.88);
      p.plate.fillRoundedRect(36, big ? -28 : -22, end - 36, big ? 56 : 46, big ? 18 : 14);
    }
    p.hearts.forEach((h, i) => {
      const x = first + i * step;
      for (const img of [h.off, h.on]) img.setPosition(x, 1).setScale(heart).setVisible(style !== "ring");
    });
    this.paintHearts(p);
    p.you?.setVisible(style === "row");
    p.life.setVisible(style === "ring");
    p.lifeIcon.setVisible(style === "ring");
    this.paintLife(p);
    p.width = style === "ring" ? (LIFE_R + 8) * 2 : end + 51;
  }

  private paintHearts(p: Portrait) {
    p.hearts.forEach((h, i) => {
      const full = p.hp >= (i + 1) * 2;
      const half = p.hp === i * 2 + 1;
      h.on.setVisible(p.style !== "ring" && (full || half));
      if (half) h.on.setCrop(0, 0, h.on.width / 2, h.on.height);
      else h.on.setCrop();
    });
  }

  private paintLife(p: Portrait) {
    const g = p.life;
    g.clear();
    if (p.style !== "ring") return;
    const k = Math.max(0, p.hp) / HP;
    g.lineStyle(17, INK_HEX, 1);
    g.strokeCircle(0, 0, LIFE_R);
    g.lineStyle(10, 0x3a3157, 1);
    g.strokeCircle(0, 0, LIFE_R);
    if (k > 0) {
      g.lineStyle(10, k <= 0.2 ? 0xff8a3d : 0xef4f43, 1);
      g.beginPath();
      g.arc(0, 0, LIFE_R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k, false);
      g.strokePath();
    }
    p.lifeIcon.setAlpha(p.hp > 0 ? 1 : 0.4);
  }

  private restFace(p: Portrait) {
    if (p.hp <= 0) return;
    p.face.setTexture(`face-${p.kid}-${p.hp <= 2 ? "ouch" : "normal"}`);
  }

  cheerFace(kid: KidId, ms = 650) {
    const p = this.portraits.get(kid);
    if (!p || p.hp <= 0) return;
    p.face.setTexture(`face-${kid}-happy`);
    const until = this.scene.time.now + ms;
    p.faceUntil = until;
    this.scene.time.delayedCall(ms, () => p.face.active && p.faceUntil === until && this.restFace(p));
  }

  setSpecial(kid: KidId, on: boolean) {
    const p = this.portraits.get(kid);
    if (!p) return;
    this.scene.tweens.killTweensOf(p.badge);
    p.badge.setVisible(on).setScale(1);
    if (on && !this.reduced) {
      p.badge.setScale(0.2);
      this.scene.tweens.add({ targets: p.badge, scale: 1, duration: 300, ease: "Back.easeOut" });
    }
  }

  setHp(kid: KidId, hp: number, change: "hit" | "regen" | null = null) {
    const p = this.portraits.get(kid);
    if (!p) return;
    p.hp = hp;
    this.paintHearts(p);
    this.paintLife(p);
    if (change === "hit") {
      p.face.setTexture(`face-${kid}-ouch`);
      const until = this.scene.time.now + 420;
      p.faceUntil = until;
      this.scene.time.delayedCall(420, () => p.face.active && p.faceUntil === until && this.restFace(p));
      if (!this.reduced) {
        const x = p.root.x;
        this.scene.tweens.add({ targets: p.root, x: x + 8 * p.scale, duration: 50, yoyo: true, repeat: 2, onComplete: () => p.root.setX(x) });
      }
    }
    if (change === "regen" && this.scene.time.now >= p.faceUntil) this.restFace(p);
    if (change === "regen" && !this.reduced) {
      const h = p.hearts[Math.floor((hp - 1) / 2)];
      const rest = p.style === "big" ? 1.04 : 0.78;
      if (h && p.style !== "ring") this.scene.tweens.add({ targets: h.on, scale: { from: rest * 1.4, to: rest }, duration: 260, ease: "Back.easeOut" });
      if (p.style === "ring") this.scene.tweens.add({ targets: p.lifeIcon, scale: { from: 0.95, to: 0.62 }, duration: 260, ease: "Back.easeOut" });
    }
    if (hp <= 0) {
      p.face.setTexture(`face-${kid}-dizzy`);
      p.badge.setVisible(false);
      p.out.setVisible(true);
      p.root.setAlpha(0.85);
      if (!this.reduced) {
        p.out.setScale(1.6);
        this.scene.tweens.add({ targets: p.out, scale: 1, duration: 260, ease: "Back.easeOut" });
      }
    }
  }

  setCheer(kid: KidId) {
    const p = this.portraits.get(kid);
    if (!p) return;
    p.faceUntil = Infinity;
    p.face.setTexture(`face-${kid}-happy`);
  }

  setTime(ms: number) {
    const s = Math.floor(ms / 1000);
    this.timer.setText(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
  }

  flash(text: string, color: string, ms: number, sub = "", top = false) {
    this.bannerTimer?.remove();
    this.scene.tweens.killTweensOf([this.banner, this.sub]);
    this.bannerTop = top;
    this.banner.setText(text).setColor(color).setVisible(true).setAlpha(1);
    this.sub.setText(sub).setVisible(Boolean(sub)).setAlpha(1);
    const scale = this.placeBanner();
    if (!this.reduced) {
      this.banner.setScale(scale * 0.4);
      this.scene.tweens.add({ targets: this.banner, scale, duration: 260, ease: "Back.easeOut" });
    }
    this.bannerTimer = this.scene.time.delayedCall(ms, () => {
      this.scene.tweens.add({ targets: [this.banner, this.sub], alpha: 0, duration: 220, onComplete: () => this.banner.setVisible(false) });
    });
  }

  private placeBanner() {
    const f = this.frame;
    if (f.kind === "full") {
      this.banner.setScale(1).setPosition(f.width / 2, this.bannerTop ? 175 : f.height / 2 - 70);
      this.sub.setScale(1).setPosition(f.width / 2, this.bannerTop ? 275 : f.height / 2 + 40);
      return 1;
    }
    const u = f.unit;
    const room = f.width - 32 * u - f.safe.left - f.safe.right;
    const big = Math.min((f.kind === "tall" ? 46 : 52) * u / 120, room / Math.max(1, this.banner.width));
    const small = Math.min((f.kind === "tall" ? 17 : 18) * u / 44, room / Math.max(1, this.sub.width));
    const fieldTop = f.hud;
    const fieldBottom = f.height - f.deck;
    const cy = this.bannerTop ? fieldTop + 70 * u : (fieldTop + fieldBottom) / 2 - 24 * u;
    this.banner.setScale(big).setPosition(f.width / 2, cy);
    this.sub.setScale(small).setPosition(f.width / 2, cy + 46 * u);
    return big;
  }

  get playfield(): Playfield {
    const f = this.frame;
    if (f.kind === "full") return { left: 0, top: 0, right: f.width, bottom: f.height };
    return { left: f.safe.left, top: f.hud, right: f.width - f.safe.right, bottom: f.height - f.deck };
  }

  layout(frame: Frame, displayWidth: number) {
    const changed = frame !== this.frame || (frame.kind === "full" && displayWidth !== this.displayWidth);
    if (!changed) return;
    this.frame = frame;
    this.displayWidth = displayWidth;
    if (frame.kind === "full") this.layoutFull(displayWidth);
    else this.layoutCompact(frame);
    this.placeControls();
    if (this.tip.visible) {
      this.tip.setScale(this.tipScale);
      this.placeTip();
    }
    if (this.banner.visible) this.placeBanner();
  }

  private layoutFull(displayWidth: number) {
    const f = this.frame;
    const k = displayWidth < 1100 ? Phaser.Math.Clamp(1100 / displayWidth, 1, 1.45) : 1;
    this.k = k;
    this.tag.setVisible(k === 1);
    this.timerBox.setScale(k).setPosition(k === 1 ? f.width / 2 : 30 + 118 * k, 10);
    this.order.forEach((p, i) => {
      this.stylePortrait(p, "row");
      p.scale = k;
      p.root.setScale(k).setPosition(f.width - 30 - 208 * k - i * 262 * k, 58 * k);
    });
    this.tipScale = k;
    this.tipText.setWordWrapWidth(900);
    this.stickScale = k;
    this.buttonScale = k;
    this.stickRest = { x: 250 * k, y: f.height - 210 * k };
    this.deck.setVisible(false);
    this.deckDots.setVisible(false);
  }

  private layoutCompact(f: Frame) {
    const u = f.unit;
    const tall = f.kind === "tall";
    this.k = 1;
    this.tag.setVisible(false);
    const margin = 8 * u;
    const gap = (tall ? 8 : 12) * u;
    const left = f.safe.left + margin;
    const right = f.width - f.safe.right - margin;
    const player = this.order[this.order.length - 1];
    const foes = this.order.slice(0, -1);
    this.stylePortrait(player, "big");
    for (const p of foes) this.stylePortrait(p, tall ? "ring" : "big");
    let kp = ((tall ? 48 : 40) * u) / 102;
    let kf = ((tall ? 40 : 34) * u) / 102;
    const timerMin = 70 * u;
    const foesWidth = () => foes.reduce((a, p) => a + p.width * kf, 0) + gap * (foes.length - 1);
    const need = player.width * kp + foesWidth() + gap * 2 + timerMin;
    if (need > right - left) {
      const shrink = (right - left) / need;
      kp *= shrink;
      kf *= shrink;
    }
    const cy = f.safe.top + (tall ? 8 : 6) * u + 51 * kp;
    player.scale = kp;
    player.root.setScale(kp).setPosition(left + 51 * kp, cy);
    let x = right;
    foes.forEach((p) => {
      p.scale = kf;
      const lead = p.style === "ring" ? LIFE_R + 8 : p.width - 51;
      p.root.setScale(kf).setPosition(x - lead * kf, cy);
      x -= p.width * kf + gap;
    });
    const spanL = left + player.width * kp + gap;
    const spanR = x + gap - gap;
    const kt = Phaser.Math.Clamp((spanR - spanL) / 246, 0.45, tall ? 0.78 : 0.75);
    this.timerBox.setScale(kt).setPosition(tall ? (spanL + spanR) / 2 : f.width / 2, cy - 42 * kt);
    this.tipScale = (13.5 * u) / 32;
    this.tipText.setWordWrapWidth((f.width - 40 * u) / this.tipScale);
    this.stickScale = (52 * u) / STICK.base;
    this.buttonScale = (46 * u) / BUTTON_R;
    if (tall) {
      const deckTop = f.height - f.deck;
      const cyDeck = Math.max(deckTop + (f.deck - f.safe.bottom) / 2 + 4 * u, deckTop + 60 * u);
      const y = Math.min(cyDeck, f.height - f.safe.bottom - 58 * u);
      this.stickRest = { x: f.safe.left + 82 * u, y };
      this.drawDeck();
    } else {
      this.stickRest = { x: f.safe.left + 92 * u, y: f.height - f.safe.bottom - 82 * u };
      this.deck.setVisible(false);
      this.deckDots.setVisible(false);
    }
  }

  setDeckColor(color: number) {
    this.deckColor = color;
    if (this.frame.kind === "tall") this.drawDeck();
  }

  private drawDeck() {
    const f = this.frame;
    const u = f.unit;
    const top = f.height - f.deck;
    const lip = 9 * u;
    const g = this.deck;
    g.clear();
    g.fillStyle(0x1d1830, 1);
    g.fillRect(0, top, f.width, f.deck + 4);
    g.fillStyle(this.deckColor, 1);
    g.fillRect(0, top, f.width, lip);
    g.fillStyle(0xffffff, 0.16);
    g.fillRect(0, top + 2 * u, f.width, 2 * u);
    g.fillStyle(0x140f26, 0.5);
    g.fillRect(0, top + lip, f.width, 6 * u);
    g.lineStyle(Math.max(3, 1.6 * u), INK_HEX, 1);
    g.lineBetween(0, top, f.width, top);
    g.lineBetween(0, top + lip, f.width, top + lip);
    g.setVisible(true);
    this.deckDots.setPosition(0, top + lip).setSize(f.width, f.deck - lip + 4).setTileScale(u / 2.6).setVisible(true);
  }

  private placeControls() {
    const f = this.frame;
    const s = this.stickScale;
    this.stickBase.setScale(s);
    this.stickKnob.setScale(s);
    const labelScale = f.kind === "full" ? s : (12 * f.unit) / 30;
    this.stickLabel.setScale(labelScale);
    this.throwLabel.setScale(labelScale);
    if (this.stickId === null) this.restStick();
    const b = this.buttonScale;
    if (f.kind === "full") this.throwBtn.setPosition(f.width - 210 * b, f.height - 200 * b);
    else this.throwBtn.setPosition(f.width - f.safe.right - (f.kind === "tall" ? 74 : 86) * f.unit, this.stickRest.y);
    this.throwBtn.setScale(b);
    const lift = (BUTTON_R + 30) * b + 10 * (f.kind === "full" ? s : f.unit);
    this.throwLabel.setPosition(Math.min(this.throwBtn.x, f.width - f.safe.right - this.throwLabel.displayWidth / 2 - 6 * (f.kind === "full" ? s : f.unit)), this.throwBtn.y - lift);
    this.refreshControls();
  }

  private restStick() {
    const { x, y } = this.stickRest;
    this.stickBase.setPosition(x, y);
    this.stickKnob.setPosition(x, y);
    const r = STICK.base * this.stickScale;
    const u = this.frame.kind === "full" ? this.stickScale : this.frame.unit;
    this.stickLabel.setPosition(Math.max(x, this.frame.safe.left + this.stickLabel.displayWidth / 2 + 6 * u), y - r - 12 * u);
  }

  setTutorial(step: "off" | "basics" | "aim") {
    if (step === this.tutorialStep) return;
    this.tutorialStep = step;
    this.stickLabel.setText(step === "basics" ? this.text.moveHelp : this.text.move).setColor(step === "basics" ? "#ffc83d" : "#fbf5e6");
    this.throwLabel.setText(step === "aim" ? this.text.aimHelp : this.text.throwHelp);
    if (this.stickId === null) this.restStick();
    this.placeControls();
  }

  private refreshControls() {
    const on = this.touchUi && this.controlsOn;
    const compact = this.frame.kind !== "full";
    const resting = this.stickId === null;
    this.throwBtn.setVisible(on);
    this.stickBase.setVisible(on && (compact || !resting));
    this.stickKnob.setVisible(on && (compact || !resting));
    this.stickLabel.setVisible(on && compact && resting && (this.frame.kind === "tall" || this.tutorialStep === "basics"));
    this.throwLabel.setVisible(on && compact && this.tutorialStep !== "off");
    this.stickBase.setAlpha(resting ? 0.55 : 1);
    this.stickKnob.setAlpha(resting ? 0.6 : 1);
  }

  hideTop() {
    this.scene.tweens.add({ targets: this.top, alpha: 0, duration: 300 });
  }

  enableTouch(on: boolean) {
    const input = this.scene.input;
    input.on(Phaser.Input.Events.POINTER_DOWN, this.down, this);
    input.on(Phaser.Input.Events.POINTER_MOVE, this.move, this);
    input.on(Phaser.Input.Events.POINTER_UP, this.up, this);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.up, this);
    this.touchUi = on;
    this.refreshControls();
  }

  get hasTouch() {
    return this.touchUi;
  }

  private isTouch(p: Phaser.Input.Pointer) {
    return p.wasTouch || (p.event as PointerEvent | undefined)?.pointerType === "touch";
  }

  private get cssUnit() {
    return this.frame.kind === "full" ? this.frame.width / Math.max(1, this.displayWidth || this.frame.width) : this.frame.unit;
  }

  private down(p: Phaser.Input.Pointer) {
    if (!this.isTouch(p) || !this.controlsOn) return;
    if (!this.touchUi) {
      this.touchUi = true;
      this.refreshControls();
    }
    const f = this.frame;
    if (p.x > f.width * 0.5) {
      const now = this.scene.time.now;
      if (this.fire) {
        this.touch.tapAt = now;
        this.touch.shot = null;
      } else this.fire = { id: p.id, x: p.x, y: p.y, at: now, mode: "pending" };
      this.throwPress.setVisible(true);
      if (!this.reduced) {
        this.scene.tweens.killTweensOf(this.throwBtn);
        this.throwBtn.setScale(0.88 * this.buttonScale);
        this.scene.tweens.add({ targets: this.throwBtn, scale: this.buttonScale, duration: 160, ease: "Back.easeOut" });
      }
      return;
    }
    if (this.stickId !== null) return;
    this.stickId = p.id;
    this.stickOrigin = this.clampOrigin(p.x, p.y);
    this.stickBase.setPosition(this.stickOrigin.x, this.stickOrigin.y);
    this.stickKnob.setPosition(this.stickOrigin.x, this.stickOrigin.y);
    this.touch.active = true;
    this.refreshControls();
    this.move(p);
  }

  private clampOrigin(x: number, y: number) {
    const f = this.frame;
    const r = STICK.base * this.stickScale;
    if (f.kind === "full") return { x: Phaser.Math.Clamp(x, 140 * this.stickScale, f.width - 140 * this.stickScale), y: Phaser.Math.Clamp(y, 260, f.height - 130 * this.stickScale) };
    return { x: Phaser.Math.Clamp(x, f.safe.left + r + 4 * f.unit, f.width - f.safe.right - r - 4 * f.unit), y: Phaser.Math.Clamp(y, f.hud + r, f.height - f.safe.bottom - r - 2 * f.unit) };
  }

  tick(now: number) {
    const fire = this.fire;
    if (!fire || fire.mode !== "pending" || now - fire.at < FIRE.decide) return;
    fire.mode = "auto";
    this.touch.throwing = true;
    this.touch.tapAt = now;
    this.touch.shot = null;
  }

  private aimMove(p: Phaser.Input.Pointer, fire: Fire) {
    const dx = p.x - fire.x;
    const dy = p.y - fire.y;
    const d = Math.hypot(dx, dy);
    const u = this.cssUnit;
    if (fire.mode !== "aim") {
      if (d < FIRE.start * u) return;
      fire.mode = "aim";
      this.touch.throwing = false;
      this.aimKnob.setVisible(true);
    }
    if (d >= FIRE.steady * u) {
      this.touch.aim = Math.atan2(dy / FLOOR, dx);
      const reach = (BUTTON_R * 0.62) / Math.max(1, d);
      this.aimKnob.setPosition(dx * reach, dy * reach).setRotation(Math.atan2(dy, dx));
    }
  }

  private move(p: Phaser.Input.Pointer) {
    if (this.fire && p.id === this.fire.id) {
      this.aimMove(p, this.fire);
      return;
    }
    if (p.id !== this.stickId) return;
    const k = this.stickScale;
    const leash = STICK.leash * k;
    let dx = p.x - this.stickOrigin.x;
    let dy = p.y - this.stickOrigin.y;
    let d = Math.hypot(dx, dy);
    if (d > leash) {
      const pull = (d - leash) / d;
      this.stickOrigin = this.clampOrigin(this.stickOrigin.x + dx * pull, this.stickOrigin.y + dy * pull);
      this.stickBase.setPosition(this.stickOrigin.x, this.stickOrigin.y);
      dx = p.x - this.stickOrigin.x;
      dy = p.y - this.stickOrigin.y;
      d = Math.hypot(dx, dy);
      if (d > leash) {
        dx = (dx / d) * leash;
        dy = (dy / d) * leash;
        d = leash;
      }
    }
    this.stickKnob.setPosition(this.stickOrigin.x + dx, this.stickOrigin.y + dy);
    const m = d / k;
    const speed = m <= STICK.dead ? 0 : Math.min(1, (m - STICK.dead) / (STICK.full - STICK.dead));
    this.touch.x = d > 0 ? (dx / d) * speed : 0;
    this.touch.y = d > 0 ? (dy / d) * speed : 0;
  }

  private up(p: Phaser.Input.Pointer) {
    const fire = this.fire;
    if (fire && fire.id === p.id) {
      const now = this.scene.time.now;
      if (fire.mode === "pending") {
        this.touch.tapAt = now;
        this.touch.shot = null;
      } else if (fire.mode === "aim" && this.touch.aim !== null) {
        this.touch.tapAt = now;
        this.touch.shot = this.touch.aim;
      }
      this.endFire();
    }
    if (p.id !== this.stickId) return;
    this.stickId = null;
    this.touch.x = 0;
    this.touch.y = 0;
    this.touch.active = false;
    this.restStick();
    this.refreshControls();
  }

  private endFire() {
    this.fire = null;
    this.touch.throwing = false;
    this.touch.aim = null;
    this.throwPress.setVisible(false);
    this.aimKnob.setVisible(false).setPosition(0, 0);
  }

  get aiming() {
    return this.fire?.mode === "aim";
  }

  release() {
    this.endFire();
    this.touch.shot = null;
    this.touch.tapAt = -99999;
    if (this.stickId !== null) {
      this.stickId = null;
      this.touch.x = 0;
      this.touch.y = 0;
      this.touch.active = false;
      this.restStick();
      this.refreshControls();
    }
  }

  hideControls() {
    this.controlsOn = false;
    this.stickId = null;
    this.endFire();
    this.touch.shot = null;
    this.touch.x = 0;
    this.touch.y = 0;
    this.touch.active = false;
    this.refreshControls();
    this.stickLabel.setVisible(false);
    this.throwLabel.setVisible(false);
    for (const pin of this.pins.values()) pin.root.setVisible(false);
  }

  setCooldown(k: number, special: boolean) {
    if (!this.throwBtn.visible) return;
    const ready = k >= 1;
    if (Math.abs(k - this.cooldown.k) < 0.01 && special === this.cooldown.special) return;
    const wasReady = this.cooldown.k >= 1;
    this.cooldown = { k, special };
    const g = this.throwRing;
    g.clear();
    const r = BUTTON_R + 16;
    g.lineStyle(14, INK_HEX, 0.55);
    g.strokeCircle(0, 0, r);
    g.lineStyle(9, special ? 0xffc83d : ready ? 0xfff3b0 : 0xffc83d, ready ? 1 : 0.95);
    if (ready) g.strokeCircle(0, 0, r);
    else {
      g.beginPath();
      g.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, k), false);
      g.strokePath();
    }
    this.throwIcon.setTint(special ? 0xffc83d : 0xffffff).setScale((1.05 / 1.25) * (special ? 1.18 : 1)).setAlpha(ready ? 1 : 0.6);
    if (ready && !wasReady && !this.reduced) {
      this.scene.tweens.killTweensOf(this.throwIcon);
      this.scene.tweens.add({ targets: this.throwIcon, angle: { from: -24, to: -12 }, duration: 220, ease: "Back.easeOut" });
    }
  }

  avoid(sx: number, sy: number) {
    if (!this.touchUi || this.frame.kind === "tall") {
      this.throwBtn.setAlpha(1);
      return;
    }
    const near = Math.hypot(sx - this.throwBtn.x, sy - this.throwBtn.y) < BUTTON_R * 1.9 * this.buttonScale;
    this.throwBtn.setAlpha(Phaser.Math.Linear(this.throwBtn.alpha, near ? 0.45 : 1, 0.15));
    const nearStick = this.stickId === null && Math.hypot(sx - this.stickBase.x, sy - this.stickBase.y) < STICK.base * 1.9 * this.stickScale;
    const want = nearStick ? 0.22 : 0.55;
    if (this.stickId === null) {
      this.stickBase.setAlpha(Phaser.Math.Linear(this.stickBase.alpha, want, 0.15));
      this.stickKnob.setAlpha(Phaser.Math.Linear(this.stickKnob.alpha, want + 0.05, 0.15));
    }
  }

  offscreen(list: Offscreen[], t: number) {
    const f = this.frame;
    const field = this.playfield;
    const u = f.kind === "full" ? this.k : f.unit;
    const scale = f.kind === "full" ? 0.62 * this.k : (19 * u) / 44;
    const pad = 64 * scale + 3 * u;
    for (const [kid, pin] of this.pins) {
      const item = list.find((o) => o.kid === kid);
      if (!item) {
        if (pin.shown) {
          pin.shown = false;
          pin.root.setVisible(false);
        }
        continue;
      }
      const cx = (field.left + field.right) / 2;
      const cy = (field.top + field.bottom) / 2;
      const x = Phaser.Math.Clamp(item.x, field.left + pad, field.right - pad);
      const y = Phaser.Math.Clamp(item.y, field.top + pad, field.bottom - pad);
      const angle = Math.atan2(item.y - y || (item.y - cy) * 0.001, item.x - x || (item.x - cx) * 0.001);
      pin.arrow.setRotation(angle);
      if (!pin.shown) {
        pin.shown = true;
        pin.root.setVisible(true).setScale(this.reduced ? scale : scale * 0.5).setAlpha(1);
        if (!this.reduced) this.scene.tweens.add({ targets: pin.root, scale, duration: 180, ease: "Back.easeOut" });
      }
      pin.root.setPosition(x, y).setAlpha(item.alert ? 1 : 0.86);
      if (!this.scene.tweens.isTweening(pin.root)) pin.root.setScale(item.alert && !this.reduced ? scale * (1.08 + Math.sin(t / 60) * 0.08) : scale);
      if (pin.bang.visible !== item.alert) {
        pin.bang.setVisible(item.alert);
        this.paintPin(pin, kid, item.alert);
      }
    }
  }
}

