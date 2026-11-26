import * as Phaser from "phaser";
import { FLOOR_Y } from "../config";
import type { LabCopy } from "../copy";
import { LEVELS } from "../levels";
import type { LabSfx } from "../sounds";
import { Bubble, INK_HEX, cartoonText, type Fonts } from "../../kit/ui";

type Memento = "target" | "pixel" | "toaster" | "juice" | "tv" | "bell" | "pet" | "record" | "pins";

const ORIGIN: Record<Memento, string> = {
  target: "test",
  pixel: "pixel",
  toaster: "toast",
  juice: "juice",
  tv: "remote",
  bell: "finale",
  pet: "kibble",
  record: "vinyl",
  pins: "strike",
};

type Layout = Partial<Record<Exclude<Memento, "toaster" | "record">, number>> & { shelf?: { x: number; y: number }; bruno?: number };

const LAYOUT: Record<string, Layout> = {
  pixel: { target: 330 },
  toast: { target: 1830, pixel: 1690 },
  juice: { target: 1830, pixel: 1680, shelf: { x: 1300, y: 560 } },
  remote: { target: 1855, pixel: 1745, juice: 1585, shelf: { x: 1600, y: 560 } },
  finale: { target: 1865, pixel: 1300, juice: 1450, tv: 1620, shelf: { x: 1300, y: 690 } },
  kibble: { target: 1865, bell: 1772, tv: 1665, juice: 1700, shelf: { x: 1770, y: 600 } },
  vinyl: { pet: 1150, tv: 1410, target: 1830, bell: 1730, juice: 1600, shelf: { x: 1790, y: 470 } },
  strike: { target: 240, bell: 335, juice: 290, pet: 1560, tv: 1790, shelf: { x: 1580, y: 520 } },
  chain: { target: 420, bell: 540, juice: 600, tv: 1250, pet: 1470, pins: 1700, shelf: { x: 1480, y: 620 }, bruno: 270 },
};

const DEPTH = { back: 1.2, item: 1.6, front: 2.2 };
const BURNT = 0x9a6440;

type Helpers = {
  sfx: (name: LabSfx, volume?: number) => void;
  word: (text: string, x: number, y: number, color: string, size?: number) => void;
  burst: (x: number, y: number, count: number, tex?: string) => void;
  notes: (x: number, y: number, count: number) => void;
  confetti: (count: number) => void;
  lina: (mood: "wow" | "yay") => void;
  bubble: (b: Bubble) => void;
};

type Tv = { screen: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; x: number; y: number; w: number; h: number };

export class RoomView {
  private readonly at: Layout;
  private readonly shown: Set<Memento>;
  private target?: Phaser.GameObjects.Image;
  private cat?: Phaser.GameObjects.Image;
  private toast?: Phaser.GameObjects.Image;
  private jar?: { x: number; y: number };
  private record?: { x: number; y: number };
  private bell?: Phaser.GameObjects.Image;
  private pins: Phaser.GameObjects.Image[] = [];
  private tv?: Tv;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly levelIndex: number,
    private readonly fonts: Fonts,
    private readonly reduced: boolean,
    private readonly text: LabCopy["world"],
  ) {
    const id = LEVELS[levelIndex].id;
    this.at = LAYOUT[id] ?? {};
    this.shown = new Set(
      (Object.keys(ORIGIN) as Memento[]).filter((m) => LEVELS.findIndex((l) => l.id === ORIGIN[m]) < levelIndex),
    );
    this.ambient();
    this.draw();
  }

  private has(m: Memento) {
    return this.shown.has(m);
  }

  private floorShadow(x: number, w: number) {
    const g = this.scene.add.graphics().setDepth(DEPTH.back);
    g.fillStyle(INK_HEX, 0.22);
    g.fillEllipse(x, FLOOR_Y + 2, w, 14);
    return g;
  }

  private draw() {
    const s = this.scene;
    const at = this.at;
    if (this.has("juice") && at.juice !== undefined) {
      const g = s.add.graphics().setDepth(DEPTH.back);
      const x = at.juice;
      g.fillStyle(0xffa733, 0.9);
      g.fillEllipse(x, FLOOR_Y + 4, 150, 22);
      g.fillEllipse(x + 62, FLOOR_Y + 8, 34, 12);
      g.fillStyle(0xffd27a, 0.9);
      g.fillEllipse(x - 24, FLOOR_Y + 1, 46, 7);
      g.fillStyle(0xffa733, 1);
      g.fillCircle(x - 86, FLOOR_Y + 6, 6);
    }
    if (this.has("target") && at.target !== undefined) {
      this.floorShadow(at.target, 92);
      this.target = s.add.image(at.target, FLOOR_Y + 2, "target").setOrigin(0.5, 1).setScale(0.6).setAngle(-12).setDepth(DEPTH.item);
    }
    if (this.has("bell") && at.bell !== undefined) {
      this.floorShadow(at.bell, 70);
      this.bell = s.add.image(at.bell, FLOOR_Y - 28, "bell").setScale(0.62).setAngle(78).setDepth(DEPTH.item);
    }
    if (this.has("pins") && at.pins !== undefined) {
      const x = at.pins;
      this.floorShadow(x, 150);
      this.pins = [-46, 4, 52].map((dx, i) =>
        s.add
          .image(x + dx, FLOOR_Y - 12 - (i === 1 ? 4 : 0), "pin")
          .setScale(0.72)
          .setAngle([88, -84, 96][i])
          .setDepth(DEPTH.item + i * 0.01),
      );
    }
    if (this.has("tv") && at.tv !== undefined) this.drawTv(at.tv);
    this.drawPet();
    this.drawShelf();
  }

  private drawPet() {
    const s = this.scene;
    const at = this.at;
    if (this.has("pet") && at.pet !== undefined) {
      const x = at.pet;
      this.floorShadow(x, 250);
      s.add.image(x - 92, FLOOR_Y + 2, "hopper").setOrigin(0.5, 1).setScale(0.55).setDepth(DEPTH.item);
      s.add.image(x - 14, FLOOR_Y - 18, "kibble-full").setScale(0.62).setDepth(DEPTH.item);
      s.add.image(x - 14, FLOOR_Y + 2, "bowl").setOrigin(0.5, 1).setScale(0.78).setDepth(DEPTH.item + 0.01);
      this.cat = s.add.image(x + 74, FLOOR_Y + 4, "cat-sleep").setOrigin(0.5, 1).setScale(0.85).setFlipX(true).setDepth(DEPTH.front);
      const zzz = cartoonText(s, x + 64, FLOOR_Y - 76, this.text.zzz, { size: 24, color: "#fbf5e6", font: this.fonts.display, stroke: 0.18 }).setDepth(DEPTH.front);
      if (!this.reduced) {
        s.tweens.add({ targets: this.cat, scaleY: 0.82, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        s.tweens.add({ targets: zzz, y: FLOOR_Y - 100, alpha: { from: 1, to: 0.15 }, duration: 2000, repeat: -1 });
      }
      return;
    }
    if (this.has("pixel") && at.pixel !== undefined && LEVELS[this.levelIndex].goal.type !== "feeder") {
      this.floorShadow(at.pixel, 80);
      this.cat = s.add.image(at.pixel, FLOOR_Y + 4, "cat-grumpy").setOrigin(0.5, 1).setScale(0.85).setDepth(DEPTH.front);
      if (!this.reduced) s.tweens.add({ targets: this.cat, scaleY: 0.83, duration: 1700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  private drawShelf() {
    const s = this.scene;
    const spot = this.at.shelf;
    if (!spot) return;
    const items: ("toaster" | "jar" | "record")[] = [];
    if (this.has("toaster")) items.push("toaster");
    if (this.has("juice")) items.push("jar");
    if (this.has("record")) items.push("record");
    if (!items.length) return;
    const widths = { toaster: 100, jar: 90, record: 100 };
    const gap = 14;
    const total = items.reduce((a, it) => a + widths[it], 0) + gap * (items.length - 1);
    const w = total + 40;
    const g = s.add.graphics().setDepth(DEPTH.back);
    g.lineStyle(5, INK_HEX, 1);
    g.fillStyle(0x8d98ab, 1);
    for (const sx of [spot.x - w / 2 + 30, spot.x + w / 2 - 30]) {
      g.fillTriangle(sx - 6, spot.y + 16, sx + 16, spot.y + 16, sx - 6, spot.y + 42);
      g.strokeTriangle(sx - 6, spot.y + 16, sx + 16, spot.y + 16, sx - 6, spot.y + 42);
    }
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(spot.x - w / 2 + 4, spot.y + 5, w, 16, 6);
    g.fillStyle(0xf2c48a, 1);
    g.fillRoundedRect(spot.x - w / 2, spot.y, w, 16, 6);
    g.strokeRoundedRect(spot.x - w / 2, spot.y, w, 16, 6);
    let x = spot.x - total / 2;
    for (const it of items) {
      const cx = x + widths[it] / 2;
      if (it === "toaster") {
        this.toast = s.add.image(cx + 4, spot.y - 44, "toast").setScale(0.6).setTint(BURNT).setDepth(DEPTH.item - 0.05);
        s.add.image(cx, spot.y + 2, "toaster").setOrigin(90 / 160, 1).setScale(0.6).setDepth(DEPTH.item);
        const crumbs = s.add.graphics().setDepth(DEPTH.item);
        crumbs.fillStyle(BURNT, 1);
        for (const [dx, r] of [[-40, 3], [-30, 2.5], [44, 3], [52, 2]]) crumbs.fillCircle(cx + dx, spot.y - 2, r);
      } else if (it === "jar") {
        const juice = s.add.graphics().setDepth(DEPTH.item - 0.05);
        juice.fillStyle(0xffa733, 0.92);
        juice.fillRect(cx - 28, spot.y - 34, 56, 26);
        s.add.image(cx, spot.y - 58, "juicer").setOrigin(85 / 190, 14 / 130).setScale(0.45).setDepth(DEPTH.item);
        this.jar = { x: cx, y: spot.y - 40 };
      } else {
        s.add.image(cx, spot.y + 2, "record").setOrigin(90 / 160, 1).setScale(0.6).setDepth(DEPTH.item);
        this.record = { x: cx, y: spot.y - 50 };
      }
      x += widths[it] + gap;
    }
  }

  private drawTv(x: number) {
    const s = this.scene;
    const k = 0.62;
    this.floorShadow(x, 130);
    const img = s.add.image(x, FLOOR_Y + 4, "tv").setOrigin(0.5, 1).setScale(k).setDepth(DEPTH.item);
    const left = img.x - 110 * k;
    const top = img.y - 186 * k;
    const sx = left + 24 * k;
    const sy = top + 48 * k;
    const sw = 138 * k;
    const sh = 104 * k;
    const screen = s.add.graphics().setDepth(DEPTH.item + 0.01);
    const label = cartoonText(s, sx + sw / 2, sy + sh * 0.42, "404", { size: 28, color: "#ffc83d", font: this.fonts.display, stroke: 0.2 }).setOrigin(0.5).setDepth(DEPTH.item + 0.02);
    this.tv = { screen, label, x: sx, y: sy, w: sw, h: sh };
    this.paintTv(0);
    if (!this.reduced) {
      const scan = { v: 0 };
      s.tweens.add({ targets: scan, v: 1, duration: 2600, repeat: -1, onUpdate: () => this.paintTv(scan.v) });
    }
  }

  private paintTv(scan: number) {
    const tv = this.tv;
    if (!tv) return;
    const g = tv.screen;
    g.clear();
    g.fillStyle(0x2b2150, 1);
    g.fillRoundedRect(tv.x, tv.y, tv.w, tv.h, 12);
    const colors = [0xfbf5e6, 0xffc83d, 0x63d6c1, 0x9df0dc, 0xf06ba8, 0x7b62c4, 0xef4f43];
    const bw = (tv.w - 8) / colors.length;
    colors.forEach((c, i) => {
      g.fillStyle(c, 0.85);
      g.fillRect(tv.x + 4 + i * bw, tv.y + 6, bw, tv.h * 0.62);
    });
    g.fillStyle(0x1d1830, 1);
    g.fillRect(tv.x + 4, tv.y + 6 + tv.h * 0.62, tv.w - 8, tv.h * 0.22);
    if (!this.reduced) {
      g.fillStyle(0xffffff, 0.18);
      g.fillRect(tv.x + 4, tv.y + 6 + (tv.h - 16) * scan, tv.w - 8, 5);
    }
  }

  private ambient() {
    const s = this.scene;
    const glass = { x: 1446, y: 138, w: 254, h: 184 };
    const mask = s.make.graphics({}, false);
    mask.fillStyle(0xffffff, 1);
    mask.fillRect(glass.x, glass.y, glass.w, glass.h);
    const cloud = s.add.graphics().setDepth(0.2);
    cloud.fillStyle(0xfbf5e6, 1);
    cloud.lineStyle(4, INK_HEX, 1);
    const puff = [
      [0, 0, 18],
      [20, -8, 16],
      [38, 0, 14],
      [18, 6, 15],
    ];
    for (const [px, py, r] of puff) cloud.fillCircle(px, py, r);
    cloud.strokeCircle(0, 0, 18);
    cloud.strokeCircle(20, -8, 16);
    cloud.strokeCircle(38, 0, 14);
    for (const [px, py, r] of puff) cloud.fillCircle(px, py, r - 2.5);
    cloud.setPosition(glass.x + 150, glass.y + 34).setMask(mask.createGeometryMask());
    const bars = s.add.graphics().setDepth(0.3);
    bars.lineStyle(8, INK_HEX, 1);
    bars.lineBetween(1573, glass.y, 1573, glass.y + glass.h);
    bars.lineBetween(glass.x, 230, glass.x + glass.w, 230);
    const led = s.add.circle(716, 458, 7, 0xffd7d2, 1).setDepth(0.2).setAlpha(0);
    if (this.reduced) return;
    cloud.setX(glass.x - 60);
    s.tweens.add({ targets: cloud, x: glass.x + glass.w + 30, duration: 26000, repeat: -1, ease: "Linear" });
    s.tweens.add({ targets: led, alpha: 0.95, duration: 140, hold: 220, yoyo: true, repeatDelay: 1500, repeat: -1 });
  }

  chain(fx: Helpers): number {
    const s = this.scene;
    const reduced = this.reduced;
    const at = (ms: number, run: () => void) => s.time.delayedCall(reduced ? ms * 0.6 : ms, run);
    at(300, () => {
      fx.sfx("tvOn", 0.8);
      const tv = this.tv;
      if (!tv) return;
      tv.label.setScale(reduced ? 1.3 : 2.2);
      if (!reduced) s.tweens.add({ targets: tv.label, scale: 1.3, duration: 420, ease: "Back.easeOut" });
      fx.word("404", tv.x + tv.w / 2, tv.y - 40, "#ffc83d", 40);
    });
    at(700, () => {
      fx.sfx("toaster", 0.9);
      const toast = this.toast;
      if (!toast) return;
      if (reduced) toast.setY(toast.y - 40);
      else
        s.tweens.add({
          targets: toast,
          y: toast.y - 150,
          angle: 220,
          duration: 420,
          ease: "Quad.easeOut",
          onComplete: () => s.tweens.add({ targets: toast, y: toast.y + 110, angle: 360, duration: 420, ease: "Bounce.easeOut" }),
        });
    });
    at(1050, () => {
      fx.sfx("squish", 0.8);
      if (this.jar) fx.burst(this.jar.x, this.jar.y, 8, "drop");
    });
    at(1400, () => {
      fx.sfx("tune", 0.7);
      if (this.record) fx.notes(this.record.x, this.record.y, 4);
    });
    at(1750, () => {
      fx.sfx("ding", 0.5);
      const t = this.target;
      if (!t || reduced) return;
      s.tweens.add({ targets: t, scaleX: { from: 0.6, to: -0.6 }, duration: 150, yoyo: true, repeat: 2, onComplete: () => t.setScale(0.6) });
    });
    at(2050, () => {
      fx.sfx("ding", 0.9);
      const b = this.bell;
      if (!b) return;
      fx.word(this.text.ding, b.x, b.y - 80, "#ffc83d", 44);
      if (!reduced) s.tweens.add({ targets: b, angle: { from: 60, to: 96 }, duration: 120, yoyo: true, repeat: 4, onComplete: () => b.setAngle(78) });
    });
    at(2350, () => {
      fx.sfx("meow", 0.9);
      const c = this.cat;
      if (!c) return;
      s.tweens.killTweensOf(c);
      c.setTexture("cat-scared").setScale(0.85);
      fx.word(this.text.meow, c.x, c.y - 130, "#f06ba8", 40);
      if (!reduced) s.tweens.add({ targets: c, y: c.y - 70, duration: 200, yoyo: true, ease: "Quad.easeOut" });
      at(1500, () => c.setTexture("cat-grumpy"));
    });
    at(2650, () => {
      fx.sfx("strike", 0.8);
      this.pins.forEach((pin, i) => {
        if (reduced) return;
        s.tweens.add({ targets: pin, y: pin.y - 60 - i * 14, angle: pin.angle + 180, duration: 260, yoyo: true, ease: "Quad.easeOut" });
      });
    });
    at(3000, () => {
      fx.sfx("fanfare", 0.9);
      fx.confetti(60);
      fx.lina("wow");
    });
    const bx = this.at.bruno;
    if (bx !== undefined) {
      at(3600, () => this.bruno(bx, fx));
    }
    at(4700, () => fx.lina("yay"));
    return reduced ? 3800 : 5600;
  }

  private bruno(x: number, fx: Helpers) {
    const s = this.scene;
    const img = s.add.image(this.reduced ? x : -120, FLOOR_Y + 4, "bruno").setOrigin(0.5, 1).setDepth(13.5);
    const react = () => {
      img.setTexture("bruno-shock");
      fx.sfx("gasp", 0.8);
      const bubble = new Bubble(s, this.fonts, "left", 28, 16);
      fx.bubble(bubble);
      bubble.say(this.text.bruno.replace("... ", "...\n"), x + 30, FLOOR_Y - 214, 2400);
    };
    if (this.reduced) {
      react();
      return;
    }
    s.tweens.add({ targets: img, x, duration: 560, ease: "Quad.easeOut", onComplete: react });
    s.tweens.add({ targets: img, y: FLOOR_Y - 4, duration: 90, yoyo: true, repeat: 5 });
  }
}
