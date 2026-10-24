import * as Phaser from "phaser";
import { H, PROJECTILES, W, WAVES, type ProjectileId, type TargetDef } from "../config";

export { Bubble, CREAM_HEX, INK, INK_HEX, cartoonText, fitText, type Fonts } from "../../kit/ui";
import { INK, INK_HEX, cartoonText, darkPanel, fitText, paper, type Fonts } from "../../kit/ui";

type TargetIcon = { img: Phaser.GameObjects.Image; check: Phaser.GameObjects.Text; lock: Phaser.GameObjects.Text };

const TAG = { x: 584, bottom: 14, w: 1010, h: 92, pillsX: 434, queueX: 852 };

export class Hud {
  private scoreBox: Phaser.GameObjects.Container;
  private scoreText: Phaser.GameObjects.Text;
  private recordText: Phaser.GameObjects.Text;
  private roundBox: Phaser.GameObjects.Container;
  private roundText: Phaser.GameObjects.Text;
  private icons: TargetIcon[] = [];
  private tag: Phaser.GameObjects.Container;
  private tagIcon: Phaser.GameObjects.Image;
  private tagName: Phaser.GameObjects.Text;
  private tagTip: Phaser.GameObjects.Text;
  private angleText: Phaser.GameObjects.Text;
  private forceText: Phaser.GameObjects.Text;
  private forceBars: Phaser.GameObjects.Graphics;
  private forcePill: Phaser.GameObjects.Graphics;
  private pills: Phaser.GameObjects.Container;
  private queue: Phaser.GameObjects.Container;
  private banner: Phaser.GameObjects.Container;
  private bannerKicker: Phaser.GameObjects.Text;
  private bannerTitle: Phaser.GameObjects.Text;
  private bannerSub: Phaser.GameObjects.Text;
  private bannerBg: Phaser.GameObjects.Graphics;
  private bannerTimer?: Phaser.Time.TimerEvent;
  private lastForceBars = -1;
  uiScale = 1;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    targets: TargetDef[],
    private reduced: boolean,
  ) {
    const panelH = 148;
    const g1 = scene.add.graphics();
    darkPanel(g1, 0, 0, 300, panelH);
    g1.lineStyle(3, 0xb9a6ef, 0.28);
    g1.lineBetween(22, 106, 278, 106);
    const scoreLabel = cartoonText(scene, 20, 10, "PONTOS", { size: 26, color: "#b9a6ef", font: fonts.display, shadow: false, stroke: 0.16 });
    this.scoreText = cartoonText(scene, 16, 66, "0", { size: 58, color: "#ffc83d", font: fonts.display }).setOrigin(0, 0.5);
    this.recordText = cartoonText(scene, 20, 126, "", { size: 22, color: "#f7ecd4", font: fonts.display, shadow: false, stroke: 0.16 }).setOrigin(0, 0.5);
    this.scoreBox = scene.add.container(26, 22, [g1, scoreLabel, this.scoreText, this.recordText]).setDepth(20);

    const g2 = scene.add.graphics();
    const rw = 400;
    darkPanel(g2, -rw, 0, rw, panelH);
    this.roundText = cartoonText(scene, -rw + 20, 10, "RODADA 1/3", { size: 26, color: "#9df0dc", font: fonts.display, shadow: false, stroke: 0.16 });
    const roundChildren: Phaser.GameObjects.GameObject[] = [g2, this.roundText];
    targets.forEach((t, i) => {
      const ix = -rw + 50 + i * 75;
      const img = scene.add.image(ix, 96, t.tex);
      img.setScale(Math.min(56 / img.width, 60 / img.height));
      const check = cartoonText(scene, ix + 16, 104, "✓", { size: 44, color: "#93cf4c", font: fonts.display, shadow: false }).setOrigin(0.5).setVisible(false);
      const lock = cartoonText(scene, ix, 94, "?", { size: 40, color: "#b9a6ef", font: fonts.display, shadow: false }).setOrigin(0.5);
      roundChildren.push(img, check, lock);
      this.icons.push({ img, check, lock });
    });
    this.roundBox = scene.add.container(W - 26, 22, roundChildren).setDepth(20);

    const tagW = TAG.w;
    const tagH = TAG.h;
    const mid = -tagH / 2;
    const tg = scene.add.graphics();
    paper(tg, 0, -tagH, tagW, tagH, 22);
    tg.lineStyle(3, INK_HEX, 0.18);
    tg.lineBetween(TAG.pillsX - 18, -tagH + 16, TAG.pillsX - 18, -16);
    tg.lineBetween(TAG.queueX - 18, -tagH + 16, TAG.queueX - 18, -16);
    const badge = scene.add.graphics();
    badge.fillStyle(INK_HEX, 1);
    badge.fillCircle(58, mid + 4, 34);
    badge.fillStyle(0x3f3170, 1);
    badge.fillCircle(55, mid, 34);
    badge.lineStyle(5, INK_HEX, 1);
    badge.strokeCircle(55, mid, 34);
    this.tagIcon = scene.add.image(55, mid, "shoe");
    this.tagName = cartoonText(scene, 106, mid - 4, "", { size: 34, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0, 1);
    this.tagName.setShadow(3, 3, "#dcc394", 0, false, true);
    this.tagTip = scene.add
      .text(108, mid + 2, "", { fontFamily: fonts.hand, fontSize: "24px", color: "#3a3157", padding: { x: 2, y: 2 } })
      .setOrigin(0, 0);

    const pg = scene.add.graphics();
    pg.fillStyle(INK_HEX, 1);
    pg.fillRoundedRect(4, 5, 156, 46, 14);
    pg.fillStyle(0xffc83d, 1);
    pg.fillRoundedRect(0, 0, 156, 46, 14);
    pg.lineStyle(4, INK_HEX, 1);
    pg.strokeRoundedRect(0, 0, 156, 46, 14);
    pg.lineStyle(4, INK_HEX, 1);
    pg.lineBetween(14, 34, 46, 34);
    pg.lineBetween(14, 34, 40, 12);
    pg.beginPath();
    pg.arc(14, 34, 20, Phaser.Math.DegToRad(-40), 0, false);
    pg.strokePath();
    this.angleText = cartoonText(scene, 54, -4, "35°", { size: 38, color: INK, font: fonts.display, stroke: 0, shadow: false });
    this.forcePill = scene.add.graphics();
    this.forceBars = scene.add.graphics();
    this.forceText = cartoonText(scene, 254, -4, "50%", { size: 38, color: INK, font: fonts.display, stroke: 0, shadow: false });
    this.pills = scene.add.container(TAG.pillsX, mid - 25, [pg, this.angleText, this.forcePill, this.forceBars, this.forceText]);
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

  private drawForcePill(color: number) {
    const g = this.forcePill;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(172, 5, 210, 46, 14);
    g.fillStyle(color, 1);
    g.fillRoundedRect(168, 0, 210, 46, 14);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeRoundedRect(168, 0, 210, 46, 14);
  }

  layout(displayScale: number) {
    this.uiScale = Phaser.Math.Clamp(displayScale * 0.55, 1, 1.75);
    const s = this.uiScale;
    this.scoreBox.setScale(Math.min(s, 1.55));
    this.roundBox.setScale(Math.min(s, 1.45));
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
    if (!this.reduced) this.scene.tweens.add({ targets: this.roundText, scale: { from: 1.25, to: 1 }, duration: 260, ease: "Back.easeOut" });
  }

  revealTarget(index: number) {
    const icon = this.icons[index];
    icon.img.clearTint().setAlpha(1);
    icon.lock.setVisible(false);
    const base = icon.img.scale;
    this.scene.tweens.add({ targets: icon.img, scale: { from: base * 1.5, to: base }, duration: 320, ease: "Back.easeOut" });
  }

  lockTarget(index: number) {
    const icon = this.icons[index];
    icon.img.setTintFill(0x3f3170).setAlpha(0.9);
    icon.lock.setVisible(true);
  }

  checkTarget(index: number) {
    const icon = this.icons[index];
    icon.img.setTint(0x77708f);
    icon.check.setVisible(true).setScale(0.2);
    this.scene.tweens.add({ targets: icon.check, scale: 1, duration: 280, ease: "Back.easeOut" });
  }

  showTag(id: ProjectileId, queue: ProjectileId[], hint?: string) {
    const def = PROJECTILES[id];
    this.tag.setVisible(true);
    this.tagIcon.setTexture(def.tex);
    this.tagIcon.setScale(Math.min(52 / this.tagIcon.width, 52 / this.tagIcon.height));
    this.tagName.setText(def.name.toUpperCase());
    fitText(this.tagName, TAG.pillsX - 40 - 106, 34, 24);
    this.tagTip.setText(hint ?? def.tip);
    fitText(this.tagTip, TAG.pillsX - 40 - 108, 24, 18);
    this.queue.removeAll(true);
    const label = this.scene.add.text(0, -18, queue.length ? "DEPOIS" : "ÚLTIMO!", {
      fontFamily: this.fonts.display,
      fontSize: "20px",
      color: queue.length ? "#3a3157" : "#c4352c",
      padding: { x: 2, y: 2 },
    });
    label.setOrigin(0, 0.5);
    this.queue.add(label);
    queue.slice(0, 3).forEach((q, i) => {
      const img = this.scene.add.image(18 + i * 42, 16, PROJECTILES[q].tex);
      img.setScale(Math.min(32 / img.width, 32 / img.height));
      this.queue.add(img);
    });
    if (queue.length > 3) {
      this.queue.add(
        this.scene.add
          .text(18 + 3 * 42 - 14, 16, `+${queue.length - 3}`, { fontFamily: this.fonts.display, fontSize: "22px", color: INK, padding: { x: 2, y: 2 } })
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
    const bars = Math.max(0, Math.min(5, Math.ceil(power * 5 - 0.001)));
    const max = power >= 0.98;
    const key = max ? 6 : bars;
    if (key !== this.lastForceBars) {
      this.lastForceBars = key;
      this.drawForcePill(max ? 0xffc83d : 0xff8a3d);
      const g = this.forceBars;
      g.clear();
      for (let i = 0; i < 5; i += 1) {
        const h = 10 + i * 6;
        const x = 184 + i * 12;
        const y = 38 - h;
        g.fillStyle(i < bars ? (max ? 0xef4f43 : INK_HEX) : 0xffffff, i < bars ? 1 : 0.55);
        g.fillRoundedRect(x, y, 8, h, 2);
        g.lineStyle(2, INK_HEX, 1);
        g.strokeRoundedRect(x, y, 8, h, 2);
      }
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
