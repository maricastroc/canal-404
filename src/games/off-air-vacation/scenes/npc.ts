import * as Phaser from "phaser";
import { CHAR_RES } from "../config";
import type { FolkKey } from "../save";
import type { Mood } from "../story";

export type NpcOpts = { scale?: number; flip?: boolean; depth?: number; frames?: Partial<Record<Mood, string>>; idle?: string; look?: string; bob?: number };

const DEFAULT_FRAMES: Record<FolkKey, Partial<Record<Mood, string>>> = {
  bigodes: { normal: "normal", talk: "talk", look: "look", happy: "happy", surprised: "surprised", sad: "look" },
  marola: { normal: "sad", talk: "talk", look: "look", happy: "happy", surprised: "talk", sad: "sad" },
  tilt: { normal: "normal", talk: "talk", look: "look", happy: "happy", surprised: "surprised", sad: "sad" },
  marisa: { normal: "normal", talk: "talk", look: "look", happy: "happy", surprised: "talk", sad: "normal" },
  psiu: { normal: "normal", talk: "talk", look: "look", happy: "happy", surprised: "talk", sad: "sad" },
  lento: { normal: "walk-a", talk: "talk", look: "walk-a", happy: "talk", surprised: "talk", sad: "walk-a" },
  mascot: { normal: "sleep", talk: "happy", look: "sleep", happy: "happy", surprised: "surprised", sad: "sleep" },
  capi: { normal: "normal", talk: "talk", look: "look", happy: "happy", surprised: "surprised", sad: "normal" },
  clique: { normal: "normal", talk: "talk", look: "look", happy: "happy", surprised: "surprised", sad: "sad" },
  cavuca: { normal: "walk-a", talk: "talk", look: "look", happy: "happy", surprised: "surprised", sad: "look" },
  chiado: { normal: "normal", talk: "happy", look: "look", happy: "happy", surprised: "surprised", sad: "look" },
  placar: { normal: "normal", talk: "talk", look: "look", happy: "happy", surprised: "surprised", sad: "sad" },
};

export class Npc {
  readonly sprite: Phaser.GameObjects.Image;
  readonly shadow: Phaser.GameObjects.Image | null;
  bubble: Phaser.GameObjects.Container | null = null;
  private barkBox: Phaser.GameObjects.Container | null = null;
  private barkUntil = 0;
  private seq: { keys: string[]; step: number; start: number } | null = null;
  private bubbleKind: string | null = null;
  private frames: Partial<Record<Mood, string>>;
  private mood: Mood = "normal";
  private holdUntil = 0;
  private nextLook = 0;
  private lookUntil = 0;
  private talking = false;
  private talkFlip = false;
  private base: number;
  x: number;
  y: number;

  constructor(
    private scene: Phaser.Scene,
    readonly id: FolkKey,
    x: number,
    y: number,
    private opts: NpcOpts,
    private reduced: boolean,
    shadow = true,
  ) {
    this.x = x;
    this.y = y;
    this.frames = { ...DEFAULT_FRAMES[id], ...opts.frames };
    this.base = (opts.scale ?? 1) / CHAR_RES;
    this.shadow = shadow ? scene.add.image(x, y + 2, "blob").setDisplaySize(140 * (opts.scale ?? 1), 34).setAlpha(0.45).setDepth((opts.depth ?? y) - 1) : null;
    this.sprite = scene.add
      .image(x, y, this.key("normal"))
      .setOrigin(0.5, 1)
      .setScale(this.base)
      .setFlipX(Boolean(opts.flip))
      .setDepth(opts.depth ?? y);
    const start = this.key("normal");
    const pad = start === "mascot-sleep" ? 0 : id === "mascot" ? 10 : 8;
    this.sprite.setOrigin(0.5, 1 - (pad * CHAR_RES) / this.sprite.frame.realHeight);
    this.nextLook = 1500 + Math.random() * 2500;
  }

  private key(mood: Mood) {
    const frame = this.frames[mood] ?? this.frames.normal ?? "normal";
    return `${this.id}-${frame}`;
  }

  setFrames(frames: Partial<Record<Mood, string>>) {
    this.frames = { ...this.frames, ...frames };
    this.sprite.setTexture(this.key(this.mood));
  }

  setMood(mood: Mood, hold = 0, time = 0) {
    this.mood = mood;
    this.holdUntil = time + hold;
    this.sprite.setTexture(this.key(mood));
  }

  talk(on: boolean) {
    this.talking = on;
    if (!on) this.sprite.setTexture(this.key(this.mood));
  }

  blip() {
    if (!this.talking) return;
    this.talkFlip = !this.talkFlip;
    const talkKey = this.key("talk");
    const restKey = this.key(this.mood === "talk" ? "normal" : this.mood);
    this.sprite.setTexture(this.talkFlip ? talkKey : restKey);
  }

  setBubble(kind: string | null) {
    if (kind === this.bubbleKind) return;
    this.bubbleKind = kind;
    this.bubble?.destroy();
    this.bubble = null;
    if (!kind) return;
    const g = this.scene.add.graphics();
    g.fillStyle(0x1d1830, 1);
    g.fillCircle(3, 4, 26);
    g.fillStyle(kind === "?" ? 0xb9a6ef : 0xffc83d, 1);
    g.fillCircle(0, 0, 26);
    g.lineStyle(5, 0x1d1830, 1);
    g.strokeCircle(0, 0, 26);
    g.fillStyle(kind === "?" ? 0xb9a6ef : 0xffc83d, 1);
    g.fillTriangle(-8, 22, 8, 22, 0, 36);
    g.lineStyle(5, 0x1d1830, 1);
    g.lineBetween(-8, 24, 0, 36);
    g.lineBetween(8, 24, 0, 36);
    const t = this.scene.add.text(0, 2, kind, { fontFamily: "Arial Black, Arial, sans-serif", fontSize: "34px", color: "#1d1830" }).setOrigin(0.5);
    this.bubble = this.scene.add.container(this.x, this.topY - 40, [g, t]).setDepth(5800);
  }

  bark(text: string, font: string, time: number) {
    this.barkBox?.destroy();
    const t = this.scene.add.text(0, 0, text, { fontFamily: font, fontSize: "30px", color: "#1d1830", align: "center", wordWrap: { width: 380 } }).setOrigin(0.5, 1);
    const w = t.width + 40;
    const h = t.height + 22;
    const g = this.scene.add.graphics();
    g.fillStyle(0x1d1830, 1);
    g.fillRoundedRect(-w / 2 + 4, -h + 5, w, h, 18);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(-w / 2, -h, w, h, 18);
    g.lineStyle(5, 0x1d1830, 1);
    g.strokeRoundedRect(-w / 2, -h, w, h, 18);
    g.fillStyle(0xfbf5e6, 1);
    g.fillTriangle(-12, -2, 12, -2, 0, 18);
    g.lineStyle(5, 0x1d1830, 1);
    g.lineBetween(-12, 0, 0, 18);
    g.lineBetween(12, 0, 0, 18);
    t.setY(-11);
    this.barkBox = this.scene.add.container(this.x, this.topY - 30, [g, t]).setDepth(5860);
    this.barkUntil = time + 2200 + text.length * 25;
    if (!this.reduced) {
      this.barkBox.setScale(0.4);
      this.scene.tweens.add({ targets: this.barkBox, scale: 1, duration: 180, ease: "Back.easeOut" });
    }
  }

  playSeq(keys: string[], step: number, time: number) {
    this.seq = { keys, step, start: time };
    this.holdUntil = time + keys.length * step;
  }

  get barkHeight() {
    return this.barkBox ? this.barkBox.getBounds().height + 10 : 0;
  }

  get busy() {
    return Boolean(this.seq) || this.talking;
  }

  get topY() {
    return this.sprite.y - this.sprite.displayHeight;
  }

  update(time: number, playerX: number) {
    if (this.seq) {
      const i = Math.floor((time - this.seq.start) / this.seq.step);
      if (i >= this.seq.keys.length) {
        this.seq = null;
        this.sprite.setTexture(this.key(this.mood));
      } else {
        const k = `${this.id}-${this.seq.keys[i]}`;
        if (this.sprite.texture.key !== k) this.sprite.setTexture(k);
      }
    }
    if (this.barkBox) {
      this.barkBox.setPosition(this.x, this.topY - 30);
      if (time > this.barkUntil) {
        const b = this.barkBox;
        this.barkBox = null;
        if (this.reduced) b.destroy();
        else this.scene.tweens.add({ targets: b, alpha: 0, duration: 200, onComplete: () => b.destroy() });
      }
    }
    if (!this.talking && !this.seq && time >= this.holdUntil) {
      if (time > this.nextLook && this.lookUntil < time) {
        this.lookUntil = time + 900 + Math.random() * 700;
        this.nextLook = this.lookUntil + 2200 + Math.random() * 2600;
        this.sprite.setTexture(this.key("look"));
        if (!this.opts.flip && this.id !== "tilt" && this.id !== "mascot") this.sprite.setFlipX(Math.random() < 0.5);
      } else if (this.lookUntil && time > this.lookUntil) {
        this.lookUntil = 0;
        this.sprite.setTexture(this.key(this.mood));
        if (!this.opts.flip) this.sprite.setFlipX(false);
      }
    }
    if (this.talking && this.id !== "tilt" && this.id !== "mascot" && this.id !== "lento") this.sprite.setFlipX(playerX < this.x);
    const breathe = this.reduced ? 1 : 1 + Math.sin(time / (380 + (this.x % 7) * 20)) * (this.opts.bob ?? 0.018);
    this.sprite.setScale(this.base * (2 - breathe), this.base * breathe);
    if (this.bubble) {
      const bob = this.reduced ? 0 : Math.sin(time / 260) * 6;
      this.bubble.setPosition(this.x, this.topY - 34 + bob);
    }
  }

  moveTo(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.sprite.setPosition(x, y).setDepth(this.opts.depth ?? y);
    this.shadow?.setPosition(x, y + 2).setDepth((this.opts.depth ?? y) - 1);
  }

  destroy() {
    this.barkBox?.destroy();
    this.sprite.destroy();
    this.shadow?.destroy();
    this.bubble?.destroy();
  }
}
