import * as Phaser from "phaser";
import type { PhaseDef, StaticDef } from "../phases";
import type { StreetCopy } from "../copy";
import { INK_HEX, type Fonts } from "./ui";

const LOOKS: Record<Exclude<StaticDef["look"], "none">, { fill: number; light: number; dark: number }> = {
  beam: { fill: 0xb06c3f, light: 0xd68d5a, dark: 0x7c4527 },
  post: { fill: 0x7c4527, light: 0x9c5d36, dark: 0x5a3018 },
  metal: { fill: 0x9aa6b8, light: 0xc3ccd8, dark: 0x64708a },
  hedge: { fill: 0x5e9e34, light: 0x93cf4c, dark: 0x3f7a22 },
  brick: { fill: 0xc4614a, light: 0xe08a6c, dark: 0x8f3f2e },
  roof: { fill: 0x9aa6b8, light: 0xc3ccd8, dark: 0x64708a },
  shelf: { fill: 0xd68d5a, light: 0xf0b47e, dark: 0xb06c3f },
  stump: { fill: 0x8a5a3c, light: 0xb07a52, dark: 0x6b3f26 },
  ramp: { fill: 0xd68d5a, light: 0xf0b47e, dark: 0xb06c3f },
};

export function drawStatics(scene: Phaser.Scene, phase: PhaseDef) {
  for (const s of phase.statics) {
    if (s.look === "none") continue;
    const look = LOOKS[s.look];
    const g = scene.add.graphics().setDepth(4.2).setPosition(s.x, s.y).setRotation(((s.angle ?? 0) * Math.PI) / 180);
    const w = s.w;
    const h = s.h;
    const x = -w / 2;
    const y = -h / 2;
    const r = s.look === "hedge" ? Math.min(18, w / 2, h / 2) : Math.min(5, w / 4, h / 4);
    g.fillStyle(look.fill, 1);
    g.fillRoundedRect(x, y, w, h, r);
    if (s.look === "brick") {
      g.lineStyle(3, look.dark, 0.9);
      const rows = Math.max(1, Math.floor(h / 26));
      for (let i = 1; i < rows; i += 1) g.lineBetween(x + 4, y + (i * h) / rows, x + w - 4, y + (i * h) / rows);
      for (let i = 0; i < rows; i += 1) {
        const off = i % 2 === 0 ? 0 : 24;
        for (let cx = x + 24 + off; cx < x + w - 8; cx += 48) g.lineBetween(cx, y + (i * h) / rows + 3, cx, y + ((i + 1) * h) / rows - 3);
      }
      g.lineStyle(4, look.light, 0.8);
      g.lineBetween(x + 8, y + 8, x + Math.min(w - 8, 70), y + 8);
    } else if (s.look === "roof") {
      g.lineStyle(3, look.dark, 0.8);
      for (let cx = x + 14; cx < x + w - 6; cx += 18) g.lineBetween(cx, y + 4, cx, y + h - 4);
      g.lineStyle(4, look.light, 0.9);
      g.lineBetween(x + 6, y + 6, x + w - 6, y + 6);
    } else if (s.look === "hedge") {
      g.fillStyle(look.light, 1);
      for (let cx = x + 14; cx < x + w - 6; cx += 22) g.fillCircle(cx, y + 14, 10);
      g.fillStyle(look.dark, 0.6);
      g.fillRect(x + 4, y + h * 0.6, w - 8, h * 0.35);
    } else if (s.look === "stump") {
      g.fillStyle(look.light, 1);
      g.fillEllipse(0, y + 6, w - 8, 14);
      g.lineStyle(3, look.dark, 1);
      g.strokeEllipse(0, y + 6, w - 22, 7);
      g.lineBetween(x + 12, y + 20, x + 14, y + h - 8);
    } else if (s.look === "metal") {
      g.lineStyle(4, 0xfffaf0, 0.6);
      g.lineBetween(x + Math.min(6, w / 3), y + 8, x + Math.min(6, w / 3), y + h - 8);
    } else {
      g.lineStyle(3, look.dark, 0.9);
      if (w >= h) {
        g.lineBetween(x + 10, y + h * 0.55, x + w * 0.45, y + h * 0.45);
        g.lineBetween(x + w * 0.55, y + h * 0.6, x + w - 10, y + h * 0.5);
      } else {
        g.lineBetween(x + w * 0.5, y + 10, x + w * 0.42, y + h - 10);
      }
      g.lineStyle(4, look.light, 0.9);
      if (w >= h) g.lineBetween(x + 6, y + 5, x + Math.min(w - 6, 80), y + 5);
      else g.lineBetween(x + 5, y + 6, x + 5, y + Math.min(h - 6, 80));
    }
    g.lineStyle(5, INK_HEX, 1);
    g.strokeRoundedRect(x, y, w, h, r);
  }
}

export function plankTexture(scene: Phaser.Scene, key: string, w: number, h: number, kind: "plank" | "door") {
  if (scene.textures.exists(key)) return key;
  const pad = 4;
  const g = scene.make.graphics({}, false);
  const ox = pad;
  const oy = pad;
  g.fillStyle(kind === "door" ? 0xb06c3f : 0xd68d5a, 1);
  g.fillRoundedRect(ox, oy, w, h, 4);
  g.lineStyle(3, kind === "door" ? 0x7c4527 : 0xb06c3f, 1);
  if (kind === "door") {
    if (h >= w) {
      for (let i = 1; i < 3; i += 1) g.lineBetween(ox + (i * w) / 3, oy + 6, ox + (i * w) / 3, oy + h - 6);
      g.lineBetween(ox + 4, oy + h * 0.25, ox + w - 4, oy + h * 0.25);
      g.lineBetween(ox + 4, oy + h * 0.75, ox + w - 4, oy + h * 0.75);
    } else {
      for (let i = 1; i < 3; i += 1) g.lineBetween(ox + 6, oy + (i * h) / 3, ox + w - 6, oy + (i * h) / 3);
    }
    g.fillStyle(0xffc83d, 1);
    g.fillCircle(ox + w / 2, oy + (h >= w ? h * 0.5 : h / 2), Math.min(w, h) * 0.18);
  } else if (w >= h) {
    g.lineBetween(ox + 10, oy + h * 0.45, ox + w * 0.45, oy + h * 0.35);
    g.lineBetween(ox + w * 0.55, oy + h * 0.6, ox + w - 10, oy + h * 0.5);
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(ox + 8, oy + h / 2, 2.4);
    g.fillCircle(ox + w - 8, oy + h / 2, 2.4);
  } else {
    g.lineBetween(ox + w * 0.5, oy + 10, ox + w * 0.42, oy + h - 10);
  }
  g.lineStyle(4.5, INK_HEX, 1);
  g.strokeRoundedRect(ox, oy, w, h, 4);
  g.generateTexture(key, w + pad * 2, h + pad * 2);
  g.destroy();
  return key;
}

type Decor = (scene: Phaser.Scene, copy: StreetCopy, fonts: Fonts) => void;

function sign(scene: Phaser.Scene, x: number, y: number, text: string, fonts: Fonts, angle: number) {
  const t = scene.add.text(0, -4, text, { fontFamily: fonts.display, fontSize: "20px", color: "#c4352c", align: "center", padding: { x: 2, y: 2 }, wordWrap: { width: 130 } }).setOrigin(0.5);
  const w = Math.max(120, t.width + 24);
  const h = t.height + 18;
  const g = scene.add.graphics();
  g.fillStyle(0x7c4527, 1);
  g.fillRect(-5, 0, 10, h / 2 + 70);
  g.lineStyle(4, INK_HEX, 1);
  g.strokeRect(-5, 0, 10, h / 2 + 70);
  g.fillStyle(0xfbf5e6, 1);
  g.fillRoundedRect(-w / 2, -h / 2 - 4, w, h, 6);
  g.lineStyle(5, INK_HEX, 1);
  g.strokeRoundedRect(-w / 2, -h / 2 - 4, w, h, 6);
  scene.add.container(x, y, [g, t]).setDepth(3.4).setAngle(angle);
}

const DECOR: Decor[] = [
  () => {},
  (scene) => {
    scene.add.image(1838, 214, "shoe").setAngle(28).setDepth(3.2);
  },
  (scene) => {
    scene.add.image(600, 936, "tire-flat").setAngle(-6).setDepth(3.3).setScale(0.9);
  },
  (scene) => {
    const g = scene.add.graphics().setDepth(3.1);
    const picket = (px: number, angle: number) => {
      g.save();
      g.translateCanvas(px, 950);
      g.rotateCanvas((angle * Math.PI) / 180);
      g.fillStyle(0xe9a36b, 1);
      g.fillPoints([new Phaser.Math.Vector2(-22, 0), new Phaser.Math.Vector2(-22, -230), new Phaser.Math.Vector2(0, -246), new Phaser.Math.Vector2(22, -230), new Phaser.Math.Vector2(22, 0)], true);
      g.lineStyle(5, INK_HEX, 1);
      g.strokePoints([new Phaser.Math.Vector2(-22, 0), new Phaser.Math.Vector2(-22, -230), new Phaser.Math.Vector2(0, -246), new Phaser.Math.Vector2(22, -230), new Phaser.Math.Vector2(22, 0)], true);
      g.restore();
    };
    picket(952, -11);
    picket(1004, 8);
  },
  (scene) => {
    const g = scene.add.graphics().setDepth(3.05);
    for (const [x, y, w] of [
      [640, 978, 90],
      [330, 1010, 70],
      [1760, 994, 80],
    ]) {
      g.fillStyle(0x5cb9f0, 0.75);
      g.fillEllipse(x, y, w, w * 0.22);
      g.lineStyle(3, INK_HEX, 0.8);
      g.strokeEllipse(x, y, w, w * 0.22);
      g.lineStyle(3, 0xfffaf0, 0.8);
      g.lineBetween(x - w * 0.25, y - 2, x - w * 0.05, y - 4);
    }
    scene.add.image(560, 928, "bucket").setAngle(172).setDepth(3.3).setScale(0.85);
  },
  (scene, copy, fonts) => {
    sign(scene, 585, 820, copy.arlindo.sign, fonts, -4);
  },
  (scene) => {
    const g = scene.add.graphics().setDepth(3.2);
    g.fillStyle(0x3a3157, 1);
    g.fillRoundedRect(1096, 366, 46, 28, 6);
    g.fillStyle(0x9aa6b8, 1);
    g.fillRect(1112, 394, 8, 20);
    g.fillStyle(0xef4f43, 1);
    g.fillCircle(1100, 380, 6);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeRoundedRect(1096, 366, 46, 28, 6);
    g.strokeRect(1112, 394, 8, 20);
    g.strokeCircle(1100, 380, 6);
  },
  (scene) => {
    scene.add.image(1235, 238, "duck").setAngle(-20).setDepth(3.2).setScale(0.9);
  },
  (scene, copy, fonts) => {
    sign(scene, 1170, 268, copy.arlindo.sign2, fonts, 6);
  },
];

export function decorate(scene: Phaser.Scene, index: number, copy: StreetCopy, fonts: Fonts) {
  for (let i = 0; i <= index && i < DECOR.length; i += 1) DECOR[i](scene, copy, fonts);
}
