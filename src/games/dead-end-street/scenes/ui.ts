import * as Phaser from "phaser";
import { H, PROJECTILES, W, WAVES, type ProjectileId, type TargetDef } from "../config";

export { Bubble, CREAM_HEX, INK, INK_HEX, cartoonText, fitText, type Fonts } from "../../kit/ui";
import { INK, INK_HEX, cartoonText, darkPanel, fitText, paper, type Fonts } from "../../kit/ui";

type TargetIcon = { img: Phaser.GameObjects.Image; check: Phaser.GameObjects.Container; wave: number; base: number };

type RoundSlot = { x: number; w: number; lock: Phaser.GameObjects.Container };

const TAG = { x: 570, bottom: 14, w: 1024, h: 104, pillsX: 436, queueX: 846 };
const ROUNDS = { w: 420, h: 148, top: 52, slotH: 82, gap: 12, pad: 16, cell: 62 };
const SOFT = "#6b6185";
const PILL_TOP = 34;
const PILL_H = 50;
const PILL_MID = PILL_H / 2;
const PILL_TEXT_Y = PILL_MID - 2.5;
const FORCE_ICONS = ["icon-force-0", "icon-force-1", "icon-force-2", "icon-force-3", "icon-force-4"];

function outlinedIcon(scene: Phaser.Scene, x: number, y: number, key: string, size: number) {
  const outline = scene.add.image(0, 0, `${key}-outline`).setDisplaySize(size, size);
  const fill = scene.add.image(0, 0, key).setDisplaySize(size, size);
  return scene.add.container(x, y, [outline, fill]);
}

export class Hud {
  private scoreBox: Phaser.GameObjects.Container;
  private scoreText: Phaser.GameObjects.Text;
  private recordText: Phaser.GameObjects.Text;
  private roundBox: Phaser.GameObjects.Container;
  private roundText: Phaser.GameObjects.Text;
  private slotGfx: Phaser.GameObjects.Graphics;
  private slots: RoundSlot[] = [];
  private currentRound = 0;
  private icons: TargetIcon[] = [];
  private tag: Phaser.GameObjects.Container;
  private tagIcon: Phaser.GameObjects.Image;
  private tagName: Phaser.GameObjects.Text;
  private tagTip: Phaser.GameObjects.Text;
  private angleText: Phaser.GameObjects.Text;
  private forceText: Phaser.GameObjects.Text;
  private forceTrack: Phaser.GameObjects.Image;
  private forceLevel: Phaser.GameObjects.Image;
  private forcePill: Phaser.GameObjects.Graphics;
  private pills: Phaser.GameObjects.Container;
  private queue: Phaser.GameObjects.Container;
  private banner: Phaser.GameObjects.Container;
  private bannerKicker: Phaser.GameObjects.Text;
  private bannerTitle: Phaser.GameObjects.Text;
  private bannerSub: Phaser.GameObjects.Text;
  private bannerBg: Phaser.GameObjects.Graphics;
  private bannerTimer?: Phaser.Time.TimerEvent;
  private lastForceLevel = -1;
  uiScale = 1;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    targets: TargetDef[],
    private reduced: boolean,
  ) {
    const panelH = ROUNDS.h;
    const g1 = scene.add.graphics();
    darkPanel(g1, 0, 0, 300, panelH);
    g1.lineStyle(3, 0xb9a6ef, 0.28);
    g1.lineBetween(22, 106, 278, 106);
    const scoreLabel = cartoonText(scene, 20, 10, "PONTOS", { size: 26, color: "#b9a6ef", font: fonts.display, shadow: false, stroke: 0.16 });
    this.scoreText = cartoonText(scene, 16, 66, "0", { size: 58, color: "#ffc83d", font: fonts.display }).setOrigin(0, 0.5);
    this.recordText = cartoonText(scene, 20, 126, "", { size: 22, color: "#f7ecd4", font: fonts.display, shadow: false, stroke: 0.16 }).setOrigin(0, 0.5);
    this.scoreBox = scene.add.container(26, 22, [g1, scoreLabel, this.scoreText, this.recordText]).setDepth(20);

    const g2 = scene.add.graphics();
    const rw = ROUNDS.w;
    darkPanel(g2, -rw, 0, rw, panelH);
    this.roundText = cartoonText(scene, -rw + 20, 8, "RODADA 1/3", { size: 26, color: "#9df0dc", font: fonts.display, shadow: false, stroke: 0.16 });
    this.slotGfx = scene.add.graphics();
    const roundChildren: Phaser.GameObjects.GameObject[] = [g2, this.roundText, this.slotGfx];
    let sx = -rw + ROUNDS.pad;
    const midY = ROUNDS.top + ROUNDS.slotH / 2;
    WAVES.forEach((_, w) => {
      const members = targets.map((t, i) => ({ t, i })).filter(({ t }) => t.wave === w + 1);
      const sw = members.length * ROUNDS.cell + 18;
      members.forEach(({ t }, k) => {
        const ix = sx + 9 + ROUNDS.cell / 2 + k * ROUNDS.cell;
        const img = scene.add.image(ix, midY + 2, t.tex);
        const base = Math.min(50 / img.width, 58 / img.height);
        img.setScale(base);
        const check = outlinedIcon(scene, ix + 18, midY + 18, "icon-check", 36).setVisible(false);
        roundChildren.push(img, check);
        this.icons.push({ img, check, wave: w, base });
      });
      const disc = scene.add.graphics();
      disc.fillStyle(INK_HEX, 1);
      disc.fillCircle(2, 3, 21);
      disc.fillStyle(0xfbf5e6, 1);
      disc.fillCircle(0, 0, 21);
      disc.lineStyle(4, INK_HEX, 1);
      disc.strokeCircle(0, 0, 21);
      const lockIcon = scene.add.image(0, -1, "icon-lock-ink").setDisplaySize(26, 26);
      const lock = scene.add.container(sx + sw / 2, midY, [disc, lockIcon]);
      roundChildren.push(lock);
      this.slots.push({ x: sx, w: sw, lock });
      sx += sw + ROUNDS.gap;
    });
    this.roundBox = scene.add.container(W - 26, 22, roundChildren).setDepth(20);
    this.drawSlots();

    const tagW = TAG.w;
    const tagH = TAG.h;
    const mid = -tagH / 2;
    const tg = scene.add.graphics();
    paper(tg, 0, -tagH, tagW, tagH, 24);
    tg.lineStyle(3, INK_HEX, 0.16);
    tg.lineBetween(TAG.pillsX - 22, -tagH + 18, TAG.pillsX - 22, -18);
    tg.lineBetween(TAG.queueX - 22, -tagH + 18, TAG.queueX - 22, -18);
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
    this.tagTip = scene.add
      .text(114, mid + 6, "", { fontFamily: fonts.hand, fontSize: "22px", color: SOFT, padding: { x: 2, y: 2 } })
      .setOrigin(0, 0);

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
    this.pills = scene.add.container(TAG.pillsX, -tagH + 6, [label(4, "ÂNGULO"), label(178, "FORÇA"), pillRow]);
    this.drawForcePill(0xff8a3d);

    this.queue = scene.add.container(TAG.queueX, mid);

    this.tag = scene.add
      .container(TAG.x, H - TAG.bottom, [tg, badge, this.tagIcon, this.tagName, this.tagTip, this.pills, this.queue])
      .setDepth(20)
      .setAngle(-0.5)
      .setVisible(false);

    this.bannerBg = scene.add.graphics();
    this.bannerKicker = cartoonText(scene, 0, 0, "", { size: 28, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    this.bannerTitle = cartoonText(scene, 0, 0, "", { size: 74, color: "#ffc83d", font: fonts.display, stroke: 0.2 }).setOrigin(0.5);
    this.bannerSub = cartoonText(scene, 0, 0, "", { size: 32, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    this.banner = scene.add.container(W / 2, 190, [this.bannerBg, this.bannerKicker, this.bannerTitle, this.bannerSub]).setDepth(18).setVisible(false);
  }

  private drawSlots() {
    const g = this.slotGfx;
    g.clear();
    const top = ROUNDS.top;
    const h = ROUNDS.slotH;
    this.slots.forEach((slot, w) => {
      if (w === this.currentRound) {
        g.fillStyle(INK_HEX, 1);
        g.fillRoundedRect(slot.x + 4, top + 5, slot.w, h, 16);
        g.fillStyle(0xfbf5e6, 1);
        g.fillRoundedRect(slot.x, top, slot.w, h, 16);
        g.lineStyle(4, INK_HEX, 1);
        g.strokeRoundedRect(slot.x, top, slot.w, h, 16);
      } else if (w < this.currentRound) {
        g.fillStyle(0x433677, 1);
        g.fillRoundedRect(slot.x, top, slot.w, h, 16);
        g.lineStyle(3, INK_HEX, 1);
        g.strokeRoundedRect(slot.x, top, slot.w, h, 16);
      } else {
        g.fillStyle(0x17112b, 1);
        g.fillRoundedRect(slot.x, top, slot.w, h, 16);
        g.lineStyle(3, 0x5b4d8f, 1);
        g.strokeRoundedRect(slot.x, top, slot.w, h, 16);
      }
      slot.lock.setVisible(w > this.currentRound);
    });
    for (const icon of this.icons) {
      if (icon.wave > this.currentRound) icon.img.setVisible(false);
    }
    for (const icon of this.icons) {
      if (icon.wave < this.currentRound && icon.check.visible) icon.img.setAlpha(0.7);
    }
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
    this.roundBox.setScale(Math.min(s, 1.4));
    const ts = Math.min(s, 1.3);
    this.tag.setScale(ts);
    this.tag.x = Math.max(16, Math.min(TAG.x, W - 16 - TAG.w * ts));
    this.banner.setScale(Math.min(s, 1.15));
  }

  setScore(score: number, pulse: boolean) {
    this.scoreText.setText(score.toLocaleString("pt-BR"));
    if (pulse && !this.reduced) {
      this.scene.tweens.add({ targets: this.scoreText, scale: { from: 1.22, to: 1 }, duration: 240, ease: "Back.easeOut" });
    }
  }

  setRecord(value: number) {
    this.recordText.setText(value > 0 ? `RECORDE ${value.toLocaleString("pt-BR")}` : "SEM RECORDE AINDA");
  }

  setRound(index: number) {
    this.roundText.setText(`RODADA ${index + 1}/${WAVES.length}`);
    this.currentRound = index;
    this.drawSlots();
    if (!this.reduced) this.scene.tweens.add({ targets: this.roundText, scale: { from: 1.25, to: 1 }, duration: 260, ease: "Back.easeOut" });
  }

  revealTarget(index: number) {
    const icon = this.icons[index];
    icon.img.clearTint().setAlpha(1).setVisible(true);
    this.scene.tweens.add({ targets: icon.img, scale: { from: icon.base * 1.5, to: icon.base }, duration: 320, ease: "Back.easeOut" });
  }

  lockTarget(index: number) {
    const icon = this.icons[index];
    icon.img.setTintFill(0x3a2f63).setAlpha(1);
  }

  iconPoint(index: number) {
    const m = this.icons[index].img.getWorldTransformMatrix();
    return { x: m.tx, y: m.ty };
  }

  checkTarget(index: number) {
    const icon = this.icons[index];
    if (icon.check.visible) return;
    icon.img.setAlpha(0.55);
    icon.check.setVisible(true).setScale(0.2);
    this.scene.tweens.add({ targets: icon.check, scale: 1, duration: 280, ease: "Back.easeOut" });
    if (!this.reduced) this.scene.tweens.add({ targets: icon.img, scale: { from: icon.base * 1.35, to: icon.base }, duration: 260, ease: "Back.easeOut" });
  }

  showTag(id: ProjectileId, queue: ProjectileId[], hint?: string) {
    const def = PROJECTILES[id];
    this.tag.setVisible(true);
    this.tagIcon.setTexture(def.tex);
    this.tagIcon.setScale(Math.min(54 / this.tagIcon.width, 54 / this.tagIcon.height));
    this.tagName.setText(def.name.toUpperCase());
    fitText(this.tagName, TAG.pillsX - 44 - 112, 36, 24);
    this.tagTip.setText(hint ?? def.tip);
    fitText(this.tagTip, TAG.pillsX - 44 - 114, 22, 17);
    this.queue.removeAll(true);
    const label = this.scene.add.text(0, -30, queue.length ? "DEPOIS" : "ÚLTIMO!", {
      fontFamily: this.fonts.display,
      fontSize: "18px",
      color: queue.length ? SOFT : "#c4352c",
      padding: { x: 2, y: 2 },
    });
    label.setOrigin(0, 0.5);
    this.queue.add(label);
    queue.slice(0, 3).forEach((q, i) => {
      const cx = 21 + i * 46;
      const disc = this.scene.add.graphics();
      disc.fillStyle(0xecd9b2, 1);
      disc.fillCircle(cx, 14, 21);
      disc.lineStyle(3, INK_HEX, 0.35);
      disc.strokeCircle(cx, 14, 21);
      const img = this.scene.add.image(cx, 14, PROJECTILES[q].tex);
      img.setScale(Math.min(30 / img.width, 30 / img.height));
      this.queue.add([disc, img]);
    });
    if (queue.length > 3) {
      this.queue.add(
        this.scene.add
          .text(21 + 2 * 46 + 26, 14, `+${queue.length - 3}`, { fontFamily: this.fonts.display, fontSize: "22px", color: INK, padding: { x: 2, y: 2 } })
          .setOrigin(0, 0.5),
      );
    }
    if (!this.reduced) {
      this.scene.tweens.add({ targets: this.tagIcon, angle: { from: -25, to: 0 }, duration: 320, ease: "Back.easeOut" });
      this.scene.tweens.add({ targets: this.tag, y: { from: H + 40, to: H - TAG.bottom }, duration: 260, ease: "Back.easeOut" });
    }
  }

  setAim(angle: number | null, power: number | null) {
    const active = angle !== null && power !== null;
    this.pills.setAlpha(active ? 1 : 0.45);
    if (!active) return;
    this.angleText.setText(`${Math.round(angle)}°`);
    const pct = Math.round(power * 100);
    this.forceText.setText(power < 0.12 ? "PUXE!" : `${pct}%`);
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
