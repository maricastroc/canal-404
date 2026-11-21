import * as Phaser from "phaser";
import type { Locale } from "@/i18n/locales";
import { formatNumber } from "@/i18n/format";
import { GROUND_Y, H, PROJECTILE_ORDER, PROJECTILES, W, type ProjectileId } from "../config";
import { COPY, type StreetCopy } from "../copy";
import type { PhaseDef } from "../phases";

export { Bubble, CREAM_HEX, INK, INK_HEX, cartoonText, fitText, type Fonts } from "../../kit/ui";
import { INK, INK_HEX, cartoonText, darkPanel, fitText, paper, type Fonts } from "../../kit/ui";

type TargetIcon = { img: Phaser.GameObjects.Image; check: Phaser.GameObjects.Container; drop: Phaser.GameObjects.Container | null; base: number };

type AmmoSlot = { id: ProjectileId; box: Phaser.GameObjects.Container; disc: Phaser.GameObjects.Graphics; count: Phaser.GameObjects.Text; x: number };

const SOFT = "#6b6185";
const PILL_TOP = 34;
const PILL_H = 50;
const PILL_MID = PILL_H / 2;
const PILL_TEXT_Y = PILL_MID - 2.5;
const FORCE_ICONS = ["icon-force-0", "icon-force-1", "icon-force-2", "icon-force-3", "icon-force-4"];
const TAG = { x: 520, bottom: 8, h: 104, pillsX: 436, ammoX: 852, slot: 60 };
const BOX = { h: 178, cell: 70, top: 50, row: 76 };

function outlinedIcon(scene: Phaser.Scene, x: number, y: number, key: string, size: number) {
  const outline = scene.add.image(0, 0, `${key}-outline`).setDisplaySize(size, size);
  const fill = scene.add.image(0, 0, key).setDisplaySize(size, size);
  return scene.add.container(x, y, [outline, fill]);
}

export class Hud {
  private scoreBox: Phaser.GameObjects.Container;
  private scoreText: Phaser.GameObjects.Text;
  private bestText: Phaser.GameObjects.Text;
  private phaseBox: Phaser.GameObjects.Container;
  private launchText: Phaser.GameObjects.Text;
  private parStars: Phaser.GameObjects.Image[] = [];
  private icons: TargetIcon[] = [];
  private tag: Phaser.GameObjects.Container;
  private tagW: number;
  private tagIcon: Phaser.GameObjects.Image;
  private tagName: Phaser.GameObjects.Text;
  private tagTip: Phaser.GameObjects.Text;
  private angleText: Phaser.GameObjects.Text;
  private forceText: Phaser.GameObjects.Text;
  private forceTrack: Phaser.GameObjects.Image;
  private forceLevel: Phaser.GameObjects.Image;
  private forcePill: Phaser.GameObjects.Graphics;
  private pills: Phaser.GameObjects.Container;
  private slots: AmmoSlot[] = [];
  private banner: Phaser.GameObjects.Container;
  private bannerKicker: Phaser.GameObjects.Text;
  private bannerTitle: Phaser.GameObjects.Text;
  private bannerSub: Phaser.GameObjects.Text;
  private bannerBg: Phaser.GameObjects.Graphics;
  private bannerTimer?: Phaser.Time.TimerEvent;
  private lastForceLevel = -1;
  private copy: StreetCopy;
  private selected: ProjectileId | null = null;
  swapHint = "";
  uiScale = 1;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    private phase: PhaseDef,
    index: number,
    total: number,
    private reduced: boolean,
    private locale: Locale,
    touch: boolean,
    onPick: (id: ProjectileId) => void,
  ) {
    this.copy = COPY[locale];
    const hud = this.copy.hud;
    const g1 = scene.add.graphics();
    darkPanel(g1, 0, 0, 300, 148);
    g1.lineStyle(3, 0xb9a6ef, 0.28);
    g1.lineBetween(22, 106, 278, 106);
    const scoreLabel = cartoonText(scene, 20, 10, hud.score, { size: 26, color: "#b9a6ef", font: fonts.display, shadow: false, stroke: 0.16 });
    this.scoreText = cartoonText(scene, 16, 66, "0", { size: 58, color: "#ffc83d", font: fonts.display }).setOrigin(0, 0.5);
    this.bestText = cartoonText(scene, 20, 126, "", { size: 22, color: "#f7ecd4", font: fonts.display, shadow: false, stroke: 0.16 }).setOrigin(0, 0.5);
    this.scoreBox = scene.add.container(26, 22, [g1, scoreLabel, this.scoreText, this.bestText]).setDepth(20);

    const n = phase.targets.length;
    const bw = Math.max(400, n * BOX.cell + 48);
    const g2 = scene.add.graphics();
    darkPanel(g2, -bw, 0, bw, BOX.h);
    const title = cartoonText(scene, -bw + 20, 8, hud.phase(index + 1, total), { size: 26, color: "#9df0dc", font: fonts.display, shadow: false, stroke: 0.16 });
    const act = cartoonText(scene, -18, 8, hud.act(phase.act), { size: 22, color: "#b9a6ef", font: fonts.display, shadow: false, stroke: 0.16 }).setOrigin(1, 0);
    const slot = scene.add.graphics();
    slot.fillStyle(INK_HEX, 1);
    slot.fillRoundedRect(-bw + 20, BOX.top + 5, bw - 36, BOX.row, 16);
    slot.fillStyle(0xfbf5e6, 1);
    slot.fillRoundedRect(-bw + 16, BOX.top, bw - 36, BOX.row, 16);
    slot.lineStyle(4, INK_HEX, 1);
    slot.strokeRoundedRect(-bw + 16, BOX.top, bw - 36, BOX.row, 16);
    const children: Phaser.GameObjects.GameObject[] = [g2, title, act, slot];
    const startX = -bw + 16 + (bw - 36 - n * BOX.cell) / 2 + BOX.cell / 2;
    const midY = BOX.top + BOX.row / 2;
    phase.targets.forEach((t, i) => {
      const ix = startX + i * BOX.cell;
      const img = scene.add.image(ix, midY + 2, t.tex);
      const base = Math.min(56 / img.width, 60 / img.height);
      img.setScale(base);
      const check = outlinedIcon(scene, ix + 20, midY + 20, "icon-check", 34).setVisible(false);
      const drop = t.kind === "soak" ? outlinedIcon(scene, ix + 20, midY + 20, "icon-drop", 30) : null;
      children.push(img, ...(drop ? [drop] : []), check);
      this.icons.push({ img, check, drop, base });
    });
    const footY = BOX.top + BOX.row + 24;
    for (let i = 0; i < 3; i += 1) {
      const star = scene.add.image(-bw + 34 + i * 26, footY, "icon-star").setDisplaySize(24, 24);
      this.parStars.push(star);
      children.push(star);
    }
    const par = cartoonText(scene, -bw + 112, footY, hud.par(phase.par[0]), { size: 20, color: "#ffc83d", font: fonts.display, shadow: false, stroke: 0.16 }).setOrigin(0, 0.5);
    this.launchText = cartoonText(scene, -18, footY, hud.launches(0), { size: 20, color: "#f7ecd4", font: fonts.display, shadow: false, stroke: 0.16 }).setOrigin(1, 0.5);
    children.push(par, this.launchText);
    this.phaseBox = scene.add.container(W - 26, 22, children).setDepth(20);

    const kinds = PROJECTILE_ORDER.filter((id) => (phase.ammo[id] ?? 0) > 0);
    this.tagW = TAG.ammoX + Math.max(kinds.length * TAG.slot, 100) + 22;
    const tagH = TAG.h;
    const mid = -tagH / 2;
    const tg = scene.add.graphics();
    paper(tg, 0, -tagH, this.tagW, tagH, 24);
    tg.lineStyle(3, INK_HEX, 0.16);
    tg.lineBetween(TAG.pillsX - 22, -tagH + 18, TAG.pillsX - 22, -18);
    tg.lineBetween(TAG.ammoX - 22, -tagH + 18, TAG.ammoX - 22, -18);
    const badge = scene.add.graphics();
    badge.fillStyle(INK_HEX, 1);
    badge.fillCircle(61, mid + 4, 37);
    badge.fillStyle(0x3f3170, 1);
    badge.fillCircle(58, mid, 37);
    badge.lineStyle(5, INK_HEX, 1);
    badge.strokeCircle(58, mid, 37);
    this.tagIcon = scene.add.image(58, mid, "shoe");
    this.tagName = cartoonText(scene, 112, mid + 2, "", { size: 36, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0, 1);
    this.tagName.setShadow(3, 3, "#dcc394", 0, false, true);
    this.tagTip = scene.add.text(114, mid + 6, "", { fontFamily: fonts.hand, fontSize: "22px", color: SOFT, padding: { x: 2, y: 2 } }).setOrigin(0, 0);

    const label = (x: number, text: string) =>
      scene.add.text(x, 6, text, { fontFamily: fonts.display, fontSize: "18px", color: SOFT, padding: { x: 2, y: 2 } }).setOrigin(0, 0.5);
    const pg = scene.add.graphics();
    pg.fillStyle(INK_HEX, 1);
    pg.fillRoundedRect(4, 5, 152, PILL_H, 15);
    pg.fillStyle(0xffc83d, 1);
    pg.fillRoundedRect(0, 0, 152, PILL_H, 15);
    pg.lineStyle(4, INK_HEX, 1);
    pg.strokeRoundedRect(0, 0, 152, PILL_H, 15);
    const angleIcon = scene.add.image(30, PILL_MID, "icon-angle").setDisplaySize(36, 36);
    this.angleText = cartoonText(scene, 54, PILL_TEXT_Y, "35°", { size: 40, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0, 0.5);
    this.forcePill = scene.add.graphics();
    this.forceTrack = scene.add.image(204, PILL_MID, "icon-force-track").setDisplaySize(40, 40).setAlpha(0.55);
    this.forceLevel = scene.add.image(204, PILL_MID, "icon-force-2").setDisplaySize(40, 40);
    this.forceText = cartoonText(scene, 230, PILL_TEXT_Y, "50%", { size: 40, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0, 0.5);
    const pillRow = scene.add.container(0, PILL_TOP - 8, [pg, angleIcon, this.angleText, this.forcePill, this.forceTrack, this.forceLevel, this.forceText]);
    this.pills = scene.add.container(TAG.pillsX, -tagH + 6, [label(4, hud.angle), label(178, hud.power), pillRow]);
    this.drawForcePill(0xff8a3d);

    const ammoLabel = scene.add.text(TAG.ammoX - 2, -tagH + 12, hud.ammo, { fontFamily: fonts.display, fontSize: "18px", color: SOFT, padding: { x: 2, y: 2 } }).setOrigin(0, 0.5);
    this.swapHint = touch ? hud.swapTouch : hud.swap;
    const tagChildren: Phaser.GameObjects.GameObject[] = [tg, badge, this.tagIcon, this.tagName, this.tagTip, this.pills, ammoLabel];
    kinds.forEach((id, i) => {
      const x = TAG.ammoX + i * TAG.slot + TAG.slot / 2 - 4;
      const disc = scene.add.graphics();
      const icon = scene.add.image(0, 0, PROJECTILES[id].tex);
      icon.setScale(Math.min(34 / icon.width, 34 / icon.height));
      const count = cartoonText(scene, 16, 18, "", { size: 20, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
      const box = scene.add.container(x, mid + 12, [disc, icon, count]).setSize(56, 56);
      box.setInteractive(new Phaser.Geom.Circle(28, 28, 30), Phaser.Geom.Circle.Contains);
      box.on("pointerdown", () => onPick(id));
      this.slots.push({ id, box, disc, count, x });
      tagChildren.push(box);
    });
    this.tag = scene.add.container(TAG.x, H - TAG.bottom, tagChildren).setDepth(20).setAngle(-0.5).setVisible(false);

    this.bannerBg = scene.add.graphics();
    this.bannerKicker = cartoonText(scene, 0, 0, "", { size: 28, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    this.bannerTitle = cartoonText(scene, 0, 0, "", { size: 74, color: "#ffc83d", font: fonts.display, stroke: 0.2 }).setOrigin(0.5);
    this.bannerSub = cartoonText(scene, 0, 0, "", { size: 32, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    this.banner = scene.add.container(W / 2, 190, [this.bannerBg, this.bannerKicker, this.bannerTitle, this.bannerSub]).setDepth(18).setVisible(false);
  }

  private drawForcePill(color: number) {
    const g = this.forcePill;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(172, 5, 186, PILL_H, 15);
    g.fillStyle(color, 1);
    g.fillRoundedRect(168, 0, 186, PILL_H, 15);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeRoundedRect(168, 0, 186, PILL_H, 15);
  }

  layout(displayScale: number) {
    this.uiScale = Phaser.Math.Clamp(displayScale * 0.55, 1, 1.75);
    const s = this.uiScale;
    this.scoreBox.setScale(Math.min(s, 1.55));
    this.phaseBox.setScale(Math.min(s, 1.35));
    const ts = Math.min(s, 1.3, (W - 32) / this.tagW, (H - TAG.bottom - GROUND_Y - 4) / TAG.h);
    this.tag.setScale(ts);
    this.tag.x = Math.max(16, Math.min(TAG.x, W - 16 - this.tagW * ts));
    this.banner.setScale(Math.min(s, 1.15));
  }

  setScore(score: number, pulse: boolean) {
    this.scoreText.setText(formatNumber(score, this.locale));
    if (pulse && !this.reduced) {
      this.scene.tweens.add({ targets: this.scoreText, scale: { from: 1.22, to: 1 }, duration: 240, ease: "Back.easeOut" });
    }
  }

  setBest(value: number) {
    this.bestText.setText(value > 0 ? this.copy.hud.best(formatNumber(value, this.locale)) : this.copy.hud.noBest);
  }

  setLaunches(n: number) {
    this.launchText.setText(this.copy.hud.launches(n));
    const stars = n <= this.phase.par[0] ? 3 : n <= this.phase.par[1] ? 2 : 1;
    this.parStars.forEach((star, i) => star.setAlpha(i < stars ? 1 : 0.22));
    if (n > 0 && !this.reduced) this.scene.tweens.add({ targets: this.launchText, scale: { from: 1.25, to: 1 }, duration: 240, ease: "Back.easeOut" });
  }

  iconPoint(index: number) {
    const m = this.icons[index].img.getWorldTransformMatrix();
    return { x: m.tx, y: m.ty };
  }

  checkTarget(index: number) {
    const icon = this.icons[index];
    if (icon.check.visible) return;
    icon.img.setAlpha(0.55);
    icon.drop?.setVisible(false);
    icon.check.setVisible(true).setScale(0.2);
    this.scene.tweens.add({ targets: icon.check, scale: 1, duration: 280, ease: "Back.easeOut" });
    if (!this.reduced) this.scene.tweens.add({ targets: icon.img, scale: { from: icon.base * 1.35, to: icon.base }, duration: 260, ease: "Back.easeOut" });
  }

  private drawSlot(slot: AmmoSlot, left: number) {
    const on = slot.id === this.selected;
    const g = slot.disc;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(3, 4, 27);
    g.fillStyle(on ? 0xffc83d : 0xecd9b2, 1);
    g.fillCircle(0, 0, 27);
    g.lineStyle(on ? 5 : 3, INK_HEX, on ? 1 : 0.5);
    g.strokeCircle(0, 0, 27);
    g.fillStyle(on ? INK_HEX : 0xfbf5e6, 1);
    g.fillCircle(16, 18, 12);
    g.lineStyle(3, INK_HEX, 1);
    g.strokeCircle(16, 18, 12);
    slot.count.setText(String(left)).setColor(on ? "#ffc83d" : INK);
    slot.box.setAlpha(left > 0 ? 1 : 0.35);
    slot.box.setScale(on ? 1.08 : 1);
  }

  setAmmo(current: ProjectileId | null, stock: Record<ProjectileId, number>, hint?: string) {
    this.selected = current;
    for (const slot of this.slots) this.drawSlot(slot, stock[slot.id]);
    if (!current) return;
    const def = PROJECTILES[current];
    this.tag.setVisible(true);
    this.tagIcon.setTexture(def.tex);
    this.tagIcon.setScale(Math.min(54 / this.tagIcon.width, 54 / this.tagIcon.height));
    this.tagName.setText(this.copy.projectiles[current].name.toUpperCase());
    fitText(this.tagName, TAG.pillsX - 44 - 112, 36, 24);
    this.tagTip.setText(hint ?? this.copy.projectiles[current].tip);
    fitText(this.tagTip, TAG.pillsX - 44 - 114, 22, 15);
  }

  popTag() {
    if (this.reduced) return;
    this.scene.tweens.add({ targets: this.tagIcon, angle: { from: -25, to: 0 }, duration: 320, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: this.tag, y: { from: H + 40, to: H - TAG.bottom }, duration: 260, ease: "Back.easeOut" });
  }

  setAim(angle: number | null, power: number | null) {
    const active = angle !== null && power !== null;
    this.pills.setAlpha(active ? 1 : 0.45);
    if (!active) return;
    this.angleText.setText(`${Math.round(angle)}°`);
    const pct = Math.round(power * 100);
    this.forceText.setText(power < 0.12 ? this.copy.hud.pull : `${pct}%`);
    const level = Math.max(0, Math.min(FORCE_ICONS.length - 1, Math.ceil(power * (FORCE_ICONS.length - 1) - 0.001)));
    const max = power >= 0.98;
    const key = max ? FORCE_ICONS.length : level;
    if (key !== this.lastForceLevel) {
      this.lastForceLevel = key;
      this.drawForcePill(max ? 0xffc83d : 0xff8a3d);
      this.forceTrack.setTexture(max ? "icon-force-max-outline" : "icon-force-track").setAlpha(max ? 1 : 0.55);
      this.forceLevel.setTexture(max ? "icon-force-max" : FORCE_ICONS[level]);
    }
  }

  hideTag() {
    this.tag.setVisible(false);
  }

  showBanner(kicker: string, title: string, sub: string, hold = 1500) {
    this.bannerKicker.setText(kicker);
    this.bannerTitle.setText(title.toUpperCase());
    this.bannerSub.setText(sub);
    const w = Math.max(this.bannerTitle.width, this.bannerSub.width) + 120;
    const h = 196;
    const g = this.bannerBg;
    g.clear();
    paper(g, -w / 2, -h / 2, w, h, 24);
    g.fillStyle(INK_HEX, 1);
    g.fillTriangle(-w / 2 - 40, -h / 2 + 50, -w / 2 + 6, -h / 2 + 30, -w / 2 + 6, h / 2 - 30);
    g.fillTriangle(w / 2 + 40, -h / 2 + 50, w / 2 - 6, -h / 2 + 30, w / 2 - 6, h / 2 - 30);
    const kw = this.bannerKicker.width + 34;
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(-kw / 2 + 4, -h / 2 - 20 + 5, kw, 44, 12);
    g.fillStyle(0x63d6c1, 1);
    g.fillRoundedRect(-kw / 2, -h / 2 - 20, kw, 44, 12);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeRoundedRect(-kw / 2, -h / 2 - 20, kw, 44, 12);
    this.bannerKicker.setPosition(0, -h / 2 + 2);
    this.bannerTitle.setPosition(0, -6);
    this.bannerSub.setPosition(0, 56);
    this.bannerTimer?.remove();
    this.scene.tweens.killTweensOf(this.banner);
    this.banner.setVisible(true).setAlpha(1).setAngle(-2);
    if (this.reduced) {
      this.banner.setY(190);
    } else {
      this.scene.tweens.add({ targets: this.banner, y: { from: -160, to: 190 }, duration: 380, ease: "Back.easeOut" });
    }
    if (hold > 0) this.bannerTimer = this.scene.time.delayedCall(hold, () => this.hideBanner());
  }

  hideBanner() {
    this.bannerTimer?.remove();
    if (!this.banner.visible) return;
    this.scene.tweens.killTweensOf(this.banner);
    this.scene.tweens.add({
      targets: this.banner,
      y: this.reduced ? 190 : -180,
      alpha: this.reduced ? 0 : 1,
      duration: 260,
      ease: "Back.easeIn",
      onComplete: () => this.banner.setVisible(false),
    });
  }
}
