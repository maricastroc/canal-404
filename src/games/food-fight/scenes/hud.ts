import * as Phaser from "phaser";
import { H, LIVES, SLOTS, W } from "../config";
import { INK, INK_HEX, cartoonText, darkPanel, fitText, paper, type Fonts } from "../../kit/ui";

const DUCK = { x: 150, y: H - 128, r: 86, press: 5, iconY: -16, iconSize: 88, labelY: 42 };
const TAP_SIZE = 120;

export class LunchHud {
  uiScale = 1;
  private livesBox: Phaser.GameObjects.Container;
  private napkins: Phaser.GameObjects.Image[] = [];
  private timerBox: Phaser.GameObjects.Container;
  private timerText: Phaser.GameObjects.Text;
  private timerBar: Phaser.GameObjects.Graphics;
  private scoreBox: Phaser.GameObjects.Container;
  private scoreText: Phaser.GameObjects.Text;
  private recordText: Phaser.GameObjects.Text;
  private duck: Phaser.GameObjects.Container;
  private duckBg: Phaser.GameObjects.Graphics;
  private duckIcon: Phaser.GameObjects.Image;
  private duckLabel: Phaser.GameObjects.Text;
  private duckPulse?: Phaser.Tweens.Tween;
  readonly duckHit: Phaser.GameObjects.Arc;
  private banner: Phaser.GameObjects.Text;
  private bannerSub: Phaser.GameObjects.Text;
  private streak: Phaser.GameObjects.Text;
  private tags: Phaser.GameObjects.Text[] = [];
  private pointer: Phaser.GameObjects.Container;
  private pointerTween?: Phaser.Tweens.Tween;
  private duckState: "idle" | "danger" | "down" = "idle";

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    private reduced: boolean,
  ) {
    const lg = scene.add.graphics();
    paper(lg, 0, 0, 330, 116, 20);
    const lLabel = cartoonText(scene, 18, 10, "GUARDANAPOS", { size: 22, color: "#7b62c4", font: fonts.display, stroke: 0, shadow: false });
    const lives: Phaser.GameObjects.GameObject[] = [lg, lLabel];
    for (let i = 0; i < LIVES; i += 1) {
      const n = scene.add.image(56 + i * 92, 74, "napkin").setScale(0.95);
      this.napkins.push(n);
      lives.push(n);
    }
    this.livesBox = scene.add.container(24, 22, lives).setDepth(20);

    const tg = scene.add.graphics();
    darkPanel(tg, -140, 0, 280, 100);
    this.timerText = cartoonText(scene, 0, 44, "1:15", { size: 54, color: "#ffc83d", font: fonts.display }).setOrigin(0.5);
    this.timerBar = scene.add.graphics();
    this.timerBox = scene.add.container(W / 2, 22, [tg, this.timerText, this.timerBar]).setDepth(20);

    const sg = scene.add.graphics();
    darkPanel(sg, -300, 0, 300, 134);
    const sLabel = cartoonText(scene, -280, 10, "PONTOS", { size: 24, color: "#b9a6ef", font: fonts.display, shadow: false, stroke: 0.16 });
    this.scoreText = cartoonText(scene, -284, 62, "0", { size: 54, color: "#ffc83d", font: fonts.display }).setOrigin(0, 0.5);
    this.recordText = cartoonText(scene, -280, 112, "", { size: 21, color: "#f7ecd4", font: fonts.display, shadow: false, stroke: 0.16 }).setOrigin(0, 0.5);
    this.scoreBox = scene.add.container(W - 24, 22, [sg, sLabel, this.scoreText, this.recordText]).setDepth(20);

    this.duckBg = scene.add.graphics();
    this.duckIcon = scene.add.image(0, DUCK.iconY, "icon-duck").setDisplaySize(DUCK.iconSize, DUCK.iconSize);
    this.duckLabel = cartoonText(scene, 0, DUCK.labelY, "ABAIXAR", { size: 26, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    this.duckHit = scene.add.circle(0, 0, DUCK.r + 14, 0xffffff, 0);
    this.duck = scene.add.container(DUCK.x, DUCK.y, [this.duckBg, this.duckIcon, this.duckLabel, this.duckHit]).setDepth(21);
    this.duckHit.setInteractive({ useHandCursor: true });
    this.drawDuck();

    this.banner = cartoonText(scene, W / 2, 300, "", { size: 108, color: "#ffc83d", font: fonts.display, stroke: 0.2 })
      .setOrigin(0.5)
      .setDepth(26)
      .setVisible(false);
    this.bannerSub = cartoonText(scene, W / 2, 392, "", { size: 40, color: "#fbf5e6", font: fonts.display, stroke: 0.2 })
      .setOrigin(0.5)
      .setDepth(26)
      .setVisible(false);
    this.streak = cartoonText(scene, W - 40, 190, "", { size: 34, color: "#63d6c1", font: fonts.display, stroke: 0.2 })
      .setOrigin(1, 0.5)
      .setDepth(20)
      .setVisible(false);

    for (const slot of SLOTS) {
      const t = scene.add
        .text(slot.x, slot.tableY + (slot.row === "back" ? 52 : 70), String(slot.key), {
          fontFamily: fonts.display,
          fontSize: slot.row === "back" ? "26px" : "32px",
          color: "#fbf5e6",
          backgroundColor: "#1d1830",
          padding: { x: 10, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(slot.row === "back" ? 4.5 : 7.5)
        .setAlpha(0.85)
        .setVisible(false);
      this.tags.push(t);
    }

    const tapOrigin = { x: 8 / 24, y: 0.5 / 24 };
    const tapOutline = scene.add.image(0, 0, "icon-tap-outline").setOrigin(tapOrigin.x, tapOrigin.y).setDisplaySize(TAP_SIZE, TAP_SIZE);
    const tap = scene.add.image(0, 0, "icon-tap").setOrigin(tapOrigin.x, tapOrigin.y).setDisplaySize(TAP_SIZE, TAP_SIZE);
    this.pointer = scene.add.container(0, 0, [tapOutline, tap]).setDepth(24).setVisible(false);
  }

  private drawDuck() {
    const g = this.duckBg;
    const fill = this.duckState === "down" ? 0x63d6c1 : this.duckState === "danger" ? 0xef4f43 : 0xffc83d;
    const press = this.duckState === "down" ? DUCK.press : 0;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(5, 7, DUCK.r);
    g.fillStyle(fill, 1);
    g.fillCircle(0, press, DUCK.r);
    g.lineStyle(6, INK_HEX, 1);
    g.strokeCircle(0, press, DUCK.r);
    this.duckIcon.setY(DUCK.iconY + press);
    this.duckLabel.setY(DUCK.labelY + press);
  }

  setDuck(state: "idle" | "danger" | "down") {
    if (state === this.duckState) return;
    this.duckState = state;
    this.drawDuck();
    this.duckLabel.setText(state === "down" ? "ABAIXADO" : state === "danger" ? "ABAIXA!" : "ABAIXAR");
    fitText(this.duckLabel, DUCK.r * 1.7, 26, 18);
  }

  pulseDuck(on: boolean) {
    this.duckPulse?.stop();
    this.duckPulse = undefined;
    const base = this.duck.getData("base") ?? 1;
    this.duck.setScale(base);
    if (on && !this.reduced) {
      this.duckPulse = this.scene.tweens.add({ targets: this.duck, scale: base * 1.1, duration: 300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  layout(displayScale: number) {
    this.uiScale = Phaser.Math.Clamp(displayScale * 0.55, 1, 1.75);
    const s = this.uiScale;
    this.livesBox.setScale(Math.min(s, 1.4));
    this.timerBox.setScale(Math.min(s, 1.3));
    this.scoreBox.setScale(Math.min(s, 1.4));
    const ds = Math.min(s, 1.6);
    this.duck.setData("base", ds).setScale(ds).setPosition(DUCK.x + (ds - 1) * 40, DUCK.y - (ds - 1) * 30);
    this.streak.setScale(Math.min(s, 1.3)).setY(22 + 150 * Math.min(s, 1.4) + 20);
    this.banner.setScale(Math.min(s, 1.2));
    this.bannerSub.setScale(Math.min(s, 1.2)).setY(300 + 92 * Math.min(s, 1.2));
  }

  setLives(lives: number) {
    this.napkins.forEach((n, i) => {
      const keep = i < lives;
      if (!keep && n.alpha === 1) {
        if (!this.reduced) {
          this.scene.tweens.add({ targets: n, angle: 25, scale: 0.7, alpha: 0.25, duration: 300, ease: "Back.easeIn" });
        } else {
          n.setAlpha(0.25);
        }
        n.setTint(0xb5652e);
      }
      if (keep) n.clearTint().setAlpha(1).setAngle(0).setScale(0.95);
    });
  }

  setTimer(msLeft: number, total: number, training: boolean) {
    if (training) {
      this.timerText.setText("TREINO").setFontSize(44).setColor("#9df0dc");
      this.timerBar.clear();
      return;
    }
    const sec = Math.max(0, Math.ceil(msLeft / 1000));
    const label = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
    if (this.timerText.text !== label) this.timerText.setText(label).setFontSize(54);
    this.timerText.setColor(sec <= 10 ? "#ef4f43" : "#ffc83d");
    const g = this.timerBar;
    g.clear();
    const k = Phaser.Math.Clamp(msLeft / total, 0, 1);
    g.fillStyle(0x140f26, 1);
    g.fillRoundedRect(-110, 80, 220, 10, 5);
    g.fillStyle(sec <= 10 ? 0xef4f43 : 0x63d6c1, 1);
    g.fillRoundedRect(-110, 80, 220 * k, 10, 5);
  }

  setScore(score: number, pop = false) {
    this.scoreText.setText(score.toLocaleString("pt-BR"));
    if (pop && !this.reduced) {
      this.scene.tweens.killTweensOf(this.scoreText);
      this.scoreText.setScale(1.25);
      this.scene.tweens.add({ targets: this.scoreText, scale: 1, duration: 260, ease: "Back.easeOut" });
    }
  }

  setRecord(value: number) {
    this.recordText.setText(value > 0 ? `RECORDE ${value.toLocaleString("pt-BR")}` : "");
  }

  setStreak(n: number) {
    if (n < 3) {
      this.streak.setVisible(false);
      return;
    }
    this.streak.setText(`SEQUÊNCIA x${n}`).setVisible(true);
    if (!this.reduced) {
      const base = Math.min(this.uiScale, 1.3);
      this.streak.setScale(base * 1.3);
      this.scene.tweens.add({ targets: this.streak, scale: base, duration: 220, ease: "Back.easeOut" });
    }
  }

  showTags(on: boolean) {
    for (const t of this.tags) t.setVisible(on);
  }

  showPointer(x: number, y: number) {
    this.pointerTween?.stop();
    this.pointer.setPosition(x, y).setVisible(true).setAlpha(1).setScale(1);
    if (this.reduced) return;
    this.pointerTween = this.scene.tweens.add({ targets: this.pointer, scale: 0.7, alpha: 0.6, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  hidePointer() {
    this.pointerTween?.stop();
    this.pointer.setVisible(false);
  }

  flash(text: string, color = "#ffc83d", hold = 900, sub = "") {
    const b = this.banner;
    this.scene.tweens.killTweensOf([b, this.bannerSub]);
    const s = Math.min(this.uiScale, 1.2);
    b.setText(text).setColor(color).setVisible(true).setAlpha(1);
    this.bannerSub.setText(sub).setVisible(Boolean(sub)).setAlpha(1).setScale(s);
    if (this.reduced) {
      b.setScale(s);
    } else {
      b.setScale(s * 0.3);
      this.scene.tweens.add({ targets: b, scale: s, duration: 240, ease: "Back.easeOut" });
    }
    if (hold > 0) {
      this.scene.tweens.add({
        targets: [b, this.bannerSub],
        alpha: 0,
        delay: hold,
        duration: 250,
        onComplete: () => {
          b.setVisible(false);
          this.bannerSub.setVisible(false);
        },
      });
    }
  }

  hideControls() {
    this.duck.setVisible(false);
    this.hidePointer();
    this.showTags(false);
  }
}
