import * as Phaser from "phaser";
import type { Vec } from "../geometry";
import { TALL, type Frame } from "../layout";
import { CREAM_HEX, INK, INK_HEX, cartoonText } from "../../kit/ui";
import { pressed } from "../../kit/press";
import { setIcon } from "../icons";
import type { HudSetup, Mood, StarReveal, ViewState } from "./hud";
import { LINA_TEXTURES } from "./lina";
import { DEPTH, PANEL_FILL, TouchHud, type RailButton } from "./touchHud";

const SIZE = { pad: 8, gap: 8, chip: 30, chipW: 92, starsW: 54, usedW: 66, slotMax: 104, smallMin: 52, smallMax: 70, cam: 40, text: 15, portrait: 54, cardPad: 10 };


const FACE = { x: 14, y: 8, size: 116 };

function fitLine(text: Phaser.GameObjects.Text, full: string, max: number, size: number, min: number) {
  text.setText(full).setFontSize(size);
  let px = size;
  while (text.width > max && px > min) {
    px -= 0.5 * (size / 15);
    text.setFontSize(px);
  }
  if (text.width <= max) return;
  let n = full.length;
  while (n > 1 && text.width > max) {
    n -= 1;
    text.setText(`${full.slice(0, n).trimEnd()}…`);
  }
}

export class DockHud extends TouchHud {
  readonly kind = "tall";
  private topBg: Phaser.GameObjects.Graphics;
  private dockBg: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private goalLine: Phaser.GameObjects.Text;
  private titleFull: string;
  private usedLine: Phaser.GameObjects.Text;
  private goalFull: string;
  private viewBtn: RailButton;
  private centerBtn: RailButton;
  private view: ViewState = { away: false, overview: false };
  private coach: Phaser.GameObjects.Container;
  private coachBg: Phaser.GameObjects.Graphics;
  private coachName: Phaser.GameObjects.Text;
  private coachText: Phaser.GameObjects.Text;
  private coachLina: Phaser.GameObjects.Image;
  private titleHit: Phaser.GameObjects.Rectangle;
  private coachHit: Phaser.GameObjects.Rectangle;
  private coachTimer?: Phaser.Time.TimerEvent;
  private lastSay: { text: string; focus: Vec | null } | null = null;
  private bannerUntil = 0;

  constructor(setup: HudSetup) {
    super(setup);
    const { scene, fonts, text } = setup;
    this.runRow = true;
    this.topBg = this.fix(scene.add.graphics().setDepth(DEPTH.panel));
    this.dockBg = this.fix(scene.add.graphics().setDepth(DEPTH.panel));
    this.titleFull = text.title.toUpperCase();
    this.goalFull = text.goal;
    this.title = this.fix(cartoonText(scene, 0, 0, this.titleFull, { size: 15, color: "#ffc83d", font: fonts.display, stroke: 0, shadow: false }).setOrigin(0, 0.5).setDepth(DEPTH.rail));
    this.goalLine = this.fix(scene.add.text(0, 0, this.goalFull, { fontFamily: fonts.hand, fontSize: "14px", color: "#f7ecd4", padding: { x: 1, y: 1 } }).setOrigin(0, 0.5).setDepth(DEPTH.rail));
    this.usedLine = this.fix(cartoonText(scene, 0, 0, "", { size: 11, color: "#f7ecd4", font: fonts.display, stroke: 0, shadow: false }).setOrigin(1, 0.5).setDepth(DEPTH.rail));
    this.titleHit = this.fix(scene.add.rectangle(0, 0, 10, 10, 0xffffff, 0).setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(DEPTH.rail));
    this.titleHit.on("pointerdown", () => pressed(() => this.toggleGoal()));
    this.viewBtn = this.makeButton(this.copy.hud.overview, CREAM_HEX, "overview", () => this.handlers.onOverview(), { free: true, row: true });
    this.centerBtn = this.makeButton("", CREAM_HEX, "recenter", () => this.handlers.onRecenter(), { free: true });
    this.viewBtn.root.setDepth(DEPTH.rail);
    this.centerBtn.root.setDepth(DEPTH.rail).setVisible(false);

    this.coachBg = this.fix(scene.add.graphics());
    this.coachName = this.fix(cartoonText(scene, 0, 0, this.copy.hud.speaker, { size: 10, color: "#7b62c4", font: fonts.display, stroke: 0, shadow: false }).setOrigin(0, 0));
    this.coachText = this.fix(scene.add.text(0, 0, "", { fontFamily: fonts.display, fontSize: "15px", color: INK, padding: { x: 2, y: 2 }, lineSpacing: -2 }).setOrigin(0, 0));
    this.coachLina = this.fix(scene.add.image(0, 0, "lina").setOrigin(0, 0));
    this.coachLina.setCrop(FACE.x, FACE.y, FACE.size, FACE.size);
    this.coachHit = this.fix(scene.add.rectangle(0, 0, 10, 10, 0xffffff, 0).setOrigin(0).setInteractive({ useHandCursor: true }));
    this.coachHit.on("pointerdown", () => pressed(() => this.hideSay()));
    this.coach = this.fix(scene.add.container(0, 0, [this.coachBg, this.coachLina, this.coachName, this.coachText, this.coachHit]).setDepth(DEPTH.coach).setVisible(false));
  }

  layout(frame: Frame) {
    this.useFrame(frame);
    const k = this.k;
    const W = frame.width;
    const pad = SIZE.pad * k;
    const gap = SIZE.gap * k;
    const top = frame.top;
    const dock = frame.dock;

    const tg = this.topBg;
    tg.clear();
    tg.fillStyle(PANEL_FILL, 1);
    tg.fillRect(0, 0, W, top.h);
    tg.fillStyle(INK_HEX, 1);
    tg.fillRect(0, top.h - 1.5 * k, W, 3 * k);
    const inner = top.h - frame.safe.top;
    const row1 = frame.safe.top + inner * 0.36;
    const row2 = frame.safe.top + inner * 0.76;
    const chipW = SIZE.chipW * k;
    this.sizeButton(this.chip, chipW, SIZE.chip * k);
    this.chip.root.setPosition(pad + chipW / 2, row1);
    const starsW = SIZE.starsW * k;
    this.placeStats(W - pad - starsW / 2, row1 + 8 * k, starsW);
    this.usedText.setVisible(false);
    const tx = pad + chipW + gap;
    this.title.setPosition(tx, row1);
    fitLine(this.title, this.titleFull, W - tx - starsW - gap - pad, SIZE.text * k, 11 * k);
    const usedW = SIZE.usedW * k;
    this.goalLine.setPosition(pad + 2 * k, row2);
    fitLine(this.goalLine, this.goalFull, W - pad * 2 - usedW - gap, 14 * k, 11 * k);
    this.titleHit.setPosition(tx, 0).setSize(W - tx - starsW - gap, top.h);
    this.titleHit.input?.hitArea.setTo(0, 0, W - tx - starsW - gap, top.h);
    this.usedLine.setFontSize(11.5 * k).setPosition(W - pad, row2);

    const dg = this.dockBg;
    dg.clear();
    dg.fillStyle(PANEL_FILL, 1);
    dg.fillRect(0, dock.y, W, dock.h);
    dg.fillStyle(INK_HEX, 1);
    dg.fillRect(0, dock.y - 1.5 * k, W, 3 * k);

    const n = this.slots.length;
    const sh = TALL.slot * k;
    const sw = Math.min(SIZE.slotMax * k, (W - pad * 2 - (n - 1) * gap) / Math.max(1, n));
    const rowW = n * sw + (n - 1) * gap;
    const y0 = dock.y + pad;
    this.slots.forEach((slot, i) => {
      this.sizeSlot(slot, sw, sh);
      slot.root.setPosition((W - rowW) / 2 + i * (sw + gap) + sw / 2, y0 + sh / 2);
    });
    this.layoutBox(W / 2, y0 + sh / 2, W - pad * 2, sh + 6 * k);

    const ah = TALL.action * k;
    const y1 = y0 + sh + gap;
    const avail = W - pad * 2 - gap * 3;
    const bw = Phaser.Math.Clamp(avail * 0.19, SIZE.smallMin * k, SIZE.smallMax * k);
    [this.hintBtn, this.undoBtn, this.clearBtn].forEach((b, i) => {
      this.sizeButton(b, bw, ah);
      b.root.setPosition(pad + i * (bw + gap) + bw / 2, y1 + ah / 2);
    });
    const runW = avail - bw * 3;
    this.sizeButton(this.runBtn, runW, ah);
    this.runBtn.root.setPosition(W - pad - runW / 2, y1 + ah / 2);
    this.sizeRunLabel();

    this.layoutView();
    this.finishLayout();
    if (this.coach.visible && this.lastSay) this.placeCoach(this.lastSay.focus);
  }

  private layoutView() {
    const k = this.k;
    const st = this.frame.stage;
    const pad = SIZE.pad * k;
    const h = SIZE.cam * k;
    const btn = this.viewBtn;
    btn.label?.setText(this.view.overview ? this.copy.hud.closeup : this.copy.hud.overview);
    setIcon(btn.icon, this.view.overview ? "closeup" : "overview");
    btn.label?.setFontSize(12 * k).setScale(1);
    const w = (btn.label?.width ?? 0) + 46 * k;
    this.sizeButton(btn, w, h);
    const bottom = st.y + st.h - pad - h / 2;
    btn.root.setPosition(st.x + st.w - pad - w / 2, bottom);
    this.sizeButton(this.centerBtn, h, h);
    this.centerBtn.root.setPosition(st.x + st.w - pad - w - pad - h / 2, bottom);
    this.centerBtn.root.setVisible(this.view.away && !this.view.overview);
  }

  setView(view: ViewState) {
    if (view.away === this.view.away && view.overview === this.view.overview) return;
    this.view = view;
    this.layoutView();
  }

  protected runArrowPose() {
    const r = this.runBtn.root;
    const y = r.y - this.runBtn.h / 2 - 22 * this.k;
    return { x: r.x, y, angle: 0, dx: 0, dy: -10 * this.k };
  }

  isOverTray(_part: Vec, pointer: Vec) {
    return pointer.y >= this.frame.dock.y;
  }

  covers(_x: number, y: number) {
    return y < this.frame.stage.y || y >= this.frame.dock.y;
  }

  say(text: string, ms: number, focus: Vec | null) {
    const k = this.k;
    this.lastSay = { text, focus };
    this.coachTimer?.remove();
    this.coachText.setText(text);
    this.placeCoach(focus);
    const c = this.coach;
    this.scene.tweens.killTweensOf(c);
    c.setVisible(true).setAlpha(1).setScale(1);
    if (!this.reduced) {
      c.setAlpha(0).setY(c.y + 8 * k);
      this.scene.tweens.add({ targets: c, alpha: 1, y: c.y - 8 * k, duration: 180, ease: "Quad.easeOut" });
    }
    this.coachTimer = this.scene.time.delayedCall(Math.max(ms, 1800), () => this.hideSay());
    return true;
  }

  hideSay() {
    this.coachTimer?.remove();
    this.lastSay = null;
    const c = this.coach;
    if (!c.visible) return;
    this.scene.tweens.killTweensOf(c);
    if (this.reduced) {
      c.setVisible(false);
      return;
    }
    this.scene.tweens.add({ targets: c, alpha: 0, duration: 140, onComplete: () => c.setVisible(false) });
  }

  setUsed(used: number, par: number) {
    super.setUsed(used, par);
    this.usedLine?.setText(this.copy.hud.used(used));
  }

  private placeCoach(focus: Vec | null) {
    const k = this.k;
    const st = this.frame.stage;
    const pad = SIZE.pad * k;
    const short = st.h / k < 330;
    const cp = (short ? 7 : SIZE.cardPad) * k;
    const face = (short ? 42 : SIZE.portrait) * k;
    const w = st.w - pad * 2;
    const textX = cp + face + cp;
    const textW = w - textX - cp;
    this.coachName.setFontSize((short ? 9 : 10) * k);
    const text = this.coachText;
    text.setFontSize((short ? 13.5 : SIZE.text) * k).setWordWrapWidth(textW, true);
    const nameH = this.coachName.height;
    const h = Math.max(face + cp * 2, cp + nameH + text.height + cp * 0.8);
    const g = this.coachBg;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(3 * k, 4 * k, w, h, 14 * k);
    g.fillStyle(CREAM_HEX, 1);
    g.fillRoundedRect(0, 0, w, h, 14 * k);
    g.lineStyle(3 * k, INK_HEX, 1);
    g.strokeRoundedRect(0, 0, w, h, 14 * k);
    const fy = (h - face) / 2;
    g.fillStyle(0xb9a6ef, 1);
    g.fillRoundedRect(cp, fy, face, face, 10 * k);
    const lina = this.coachLina;
    const inset = 3 * k;
    const scale = (face - inset * 2) / FACE.size;
    lina.setCrop(FACE.x, FACE.y, FACE.size, FACE.size).setScale(scale).setPosition(cp + inset - FACE.x * scale, fy + inset - FACE.y * scale);
    g.lineStyle(3 * k, INK_HEX, 1);
    g.strokeRoundedRect(cp, fy, face, face, 10 * k);
    const block = nameH + text.height;
    const ty = (h - block) / 2;
    this.coachName.setPosition(textX, ty);
    text.setPosition(textX, ty + nameH - 2 * k);
    this.coachHit.setSize(w, h);
    this.coachHit.input?.hitArea.setTo(0, 0, w, h);
    const camRoom = (SIZE.cam + SIZE.gap) * k;
    const low = this.scene.time.now < this.bannerUntil || Boolean(focus && focus.y < st.y + st.h * 0.42);
    this.coach.setPosition(st.x + pad, low ? st.y + st.h - pad - camRoom - h : st.y + pad);
  }

  protected showGoal() {
    this.hideSay();
    super.showGoal();
  }

  celebrate(stars: number, onStar: StarReveal) {
    this.bannerUntil = this.scene.time.now + 2100;
    if (this.coach.visible && this.lastSay) this.placeCoach(this.lastSay.focus);
    super.celebrate(stars, onStar);
  }

  mood(kind: Mood) {
    this.coachLina.setTexture(LINA_TEXTURES[kind]).setCrop(FACE.x, FACE.y, FACE.size, FACE.size);
  }
}
