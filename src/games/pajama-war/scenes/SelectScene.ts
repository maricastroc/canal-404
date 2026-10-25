import * as Phaser from "phaser";
import type { GameHostContext } from "@/games/types";
import { ARENAS } from "../arenas";
import { H, KID_INFO, KIDS, PILLOW_ANCHORS, SPRITE_ORIGIN_Y, STATS, W, type KidId } from "../config";
import { PAJAMA_SFX, type PajamaSfx } from "../sounds";
import { loadStats } from "../storage";
import { INK, INK_HEX, cartoonText } from "../../kit/ui";
import { KID_RES } from "./BootScene";
import { makeTextures } from "./room";

const CARD = { w: 450, h: 640 };
const CARD_KID = 1.18;
const CARD_BG: Record<KidId, number> = { lia: 0xffe46e, nico: 0xcdbcff, bia: 0xffadd2 };
const BAR_LABELS: [string, string][] = [
  ["VELOCIDADE", "icon-speed"],
  ["ATAQUE", "icon-attack"],
  ["RECUPERAÇÃO", "icon-regen"],
];
const TOUCH_UI = typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches);

type Card = { kid: KidId; root: Phaser.GameObjects.Container; sprite: Phaser.GameObjects.Image; held: Phaser.GameObjects.Image; heldBack: Phaser.GameObjects.Image; frame: Phaser.GameObjects.Graphics; x: number };

export class SelectScene extends Phaser.Scene {
  private ctx!: GameHostContext;
  private cards: Card[] = [];
  private index = 0;
  private loopAt = 0;
  private loopStep = 0;
  private starting = false;

  constructor() {
    super("select");
  }

  init() {
    this.cards = [];
    this.starting = false;
    this.loopAt = 0;
    this.loopStep = 0;
  }

  create() {
    this.ctx = this.registry.get("ctx") as GameHostContext;
    makeTextures(this);
    const fonts = this.ctx.fonts;
    const reduced = this.ctx.reducedMotion;
    this.cameras.main.setBackgroundColor("#1d1830");
    this.add.tileSprite(0, 0, W, 420, "wall-bedroom").setOrigin(0, 0);
    this.add.tileSprite(0, 420, W, H - 420, "floor-bedroom").setOrigin(0, 0);
    this.add.rectangle(0, 0, W, H, 0x140f26, 0.62).setOrigin(0, 0);
    this.add.image(0, 0, "vignette").setOrigin(0, 0).setDisplaySize(W, H).setAlpha(0.6);
    for (let i = 0; i < 14; i += 1) {
      const f = this.add.image(Phaser.Math.Between(40, W - 40), Phaser.Math.Between(40, H - 40), "feather").setAlpha(0.35).setScale(Phaser.Math.FloatBetween(0.6, 1.1)).setAngle(Phaser.Math.Between(0, 360));
      if (!reduced) this.tweens.add({ targets: f, y: f.y + Phaser.Math.Between(30, 70), angle: f.angle + Phaser.Math.Between(-60, 60), duration: Phaser.Math.Between(2600, 4200), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }

    const title = cartoonText(this, 0, 0, "ESCOLHA SEU PERSONAGEM!", { size: 60, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    const tw = title.width + 70;
    const tg = this.add.graphics();
    tg.fillStyle(INK_HEX, 1);
    tg.fillRoundedRect(-tw / 2 + 7, -50 + 8, tw, 100, 12);
    tg.fillStyle(0xfbf5e6, 1);
    tg.fillRoundedRect(-tw / 2, -50, tw, 100, 12);
    tg.lineStyle(6, INK_HEX, 1);
    tg.strokeRoundedRect(-tw / 2, -50, tw, 100, 12);
    this.add.container(W / 2, 92, [tg, title]).setAngle(-1.5);

    const level = Phaser.Math.Clamp((this.registry.get("level") as number | undefined) ?? 0, 0, ARENAS.length - 1);
    const at = cartoonText(this, 34, 200, `ARENA ${level + 1}: ${ARENAS[level].title.toUpperCase()}`, { size: 30, color: "#ffc83d", font: fonts.display, stroke: 0.18 });
    void at;

    const stats = loadStats();
    const last = (this.registry.get("kid") as KidId | null) ?? stats.lastKid ?? "lia";
    this.index = Math.max(0, KIDS.indexOf(last));
    KIDS.forEach((kid, i) => this.cards.push(this.makeCard(kid, W / 2 + (i - 1) * 500, 590, stats.wins[kid])));

    const hint = TOUCH_UI ? "Toque num personagem" : "Setas para escolher. Enter para começar.";
    cartoonText(this, W / 2, H - 46, hint, { size: 30, color: "#fbf5e6", font: fonts.display, stroke: 0.16 }).setOrigin(0.5);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(INK_HEX, 1);
    btnBg.fillRoundedRect(-160 + 7, -46 + 8, 320, 92, 18);
    btnBg.fillStyle(0xf06ba8, 1);
    btnBg.fillRoundedRect(-160, -46, 320, 92, 18);
    btnBg.lineStyle(6, INK_HEX, 1);
    btnBg.strokeRoundedRect(-160, -46, 320, 92, 18);
    const play = this.add.image(-92, 0, "icon-play").setScale(0.9);
    const label = cartoonText(this, 26, 0, "COMEÇAR", { size: 44, color: "#fbf5e6", font: fonts.display, stroke: 0.18 }).setOrigin(0.5);
    const btn = this.add.container(W - 230, H - 70, [btnBg, play, label]).setSize(320, 92).setInteractive({ useHandCursor: true });
    btn.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.go());
    if (!reduced) this.tweens.add({ targets: btn, scale: 1.05, duration: 620, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    const kb = this.input.keyboard!;
    kb.on("keydown", (event: KeyboardEvent) => {
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
    });
    this.choose(this.index, true);
    this.ctx.onEvent({ type: "announce", message: "Escolha seu personagem: Lia, a veloz. Nico, o atirador. Bia, a resistente. Use as setas e aperte Enter." });
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
    parts.push(cartoonText(this, 0, -CARD.h / 2 + 118, info.title.toUpperCase(), { size: 30, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5).setAlpha(0.85));
    const floorY = 104;
    parts.push(this.add.image(0, floorY + 4, "blob").setDisplaySize(190, 46).setAlpha(0.5));
    const scale = CARD_KID / KID_RES;
    const sprite = this.add.image(0, floorY, `kid-${kid}-idle-f`).setOrigin(0.5, SPRITE_ORIGIN_Y).setScale(scale);
    const held = this.add.image(0, 0, "pillow").setScale((0.62 * 1.32) / 1.25).setTint(info.tint);
    const heldBack = this.add.image(0, 0, "pillow").setScale((0.62 * 1.32) / 1.25).setTint(info.tint);
    parts.push(heldBack, sprite, held);
    const bars = STATS[kid].bars;
    BAR_LABELS.forEach(([label, icon], i) => {
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
      const i = KIDS.indexOf(kid);
      if (i === this.index) this.go();
      else this.choose(i);
    });
    root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      if (!TOUCH_UI && KIDS.indexOf(kid) !== this.index) root.setScale(0.97);
    });
    root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      if (KIDS.indexOf(kid) !== this.index) root.setScale(0.94);
    });
    return { kid, root, sprite, held, heldBack, frame, x };
  }

  private choose(i: number, silent = false) {
    this.index = i;
    this.loopStep = 0;
    this.loopAt = 0;
    const reduced = this.ctx.reducedMotion;
    this.cards.forEach((c, j) => {
      const on = j === i;
      c.frame.clear();
      c.frame.lineStyle(on ? 10 : 6, on ? 0xffc83d : INK_HEX, 1);
      c.frame.strokeRoundedRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 26);
      if (on) {
        c.frame.lineStyle(4, INK_HEX, 1);
        c.frame.strokeRoundedRect(-CARD.w / 2 - 7, -CARD.h / 2 - 7, CARD.w + 14, CARD.h + 14, 30);
      }
      this.tweens.killTweensOf(c.root);
      const target = { y: on ? 570 : 600, scale: on ? 1.02 : 0.94, alpha: on ? 1 : 0.82 };
      if (reduced) c.root.setPosition(c.x, target.y).setScale(target.scale).setAlpha(target.alpha);
      else this.tweens.add({ targets: c.root, y: target.y, scale: target.scale, alpha: target.alpha, duration: 220, ease: "Back.easeOut" });
      c.root.setDepth(on ? 2 : 1);
    });
    if (!silent) {
      this.sfx("pick", 0.8);
      const kid = KIDS[i];
      this.ctx.onEvent({ type: "announce", message: `${KID_INFO[kid].name}, ${KID_INFO[kid].title.toLowerCase()}.` });
    }
  }

  private go() {
    if (this.starting) return;
    this.starting = true;
    const kid = KIDS[this.index];
    this.registry.set("kid", kid);
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

  update(time: number) {
    const reduced = this.ctx.reducedMotion;
    this.cards.forEach((c, j) => {
      const on = j === this.index && !this.starting;
      let pose = "idle-f";
      if (on && !reduced) {
        if (time >= this.loopAt) {
          this.loopStep = (this.loopStep + 1) % 4;
          this.loopAt = time + [900, 260, 300, 700][this.loopStep];
        }
        pose = ["idle-f", "windup-s", "throw-s", "cheer"][this.loopStep];
      } else if (j === this.index && this.starting) pose = "cheer";
      c.sprite.setTexture(`kid-${c.kid}-${pose}`);
      const bob = reduced ? 1 : 1 + Math.sin(time / 260 + j) * 0.02;
      const scale = CARD_KID / KID_RES;
      c.sprite.setScale(scale, scale * bob);
      const anchor = PILLOW_ANCHORS[pose];
      c.held.setVisible(anchor?.layer === "front");
      c.heldBack.setVisible(anchor?.layer === "back");
      if (anchor) {
        const k = CARD_KID;
        const img = anchor.layer === "front" ? c.held : c.heldBack;
        img.setPosition(anchor.x * k, 104 + anchor.y * k * bob).setAngle(anchor.angle);
      }
    });
  }
}
