import * as Phaser from "phaser";
import { INK_HEX } from "../../kit/ui";

export type YardSector = "court" | "canteen" | "commons" | "garden";

export const YARD_SECTORS: { id: YardSector; from: number; to: number }[] = [
  { id: "court", from: -Infinity, to: 2540 },
  { id: "canteen", from: 2540, to: 3700 },
  { id: "commons", from: 3700, to: 5200 },
  { id: "garden", from: 5200, to: Infinity },
];

export function yardSector(x: number): YardSector {
  return YARD_SECTORS.find((s) => x >= s.from && x < s.to)!.id;
}

export const BENCH_ART: Record<YardSector, string> = { court: "bench-court", canteen: "bench", commons: "bench", garden: "bench-garden" };

export const BARS_ART: Record<YardSector, { top: number; shine: number; pole: number }> = {
  court: { top: 0xef4f43, shine: 0xff8a7a, pole: 0xffc83d },
  canteen: { top: 0xef4f43, shine: 0xff8a7a, pole: 0xffc83d },
  commons: { top: 0x5cb9f0, shine: 0xa9dcfa, pole: 0x93cf4c },
  garden: { top: 0x5cb9f0, shine: 0xa9dcfa, pole: 0x93cf4c },
};

type Draw = (g: Phaser.GameObjects.Graphics) => void;

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

function blobs(g: Phaser.GameObjects.Graphics, parts: [number, number, number][], fill: number, ink = 6) {
  g.fillStyle(INK_HEX, 1);
  for (const [x, y, r] of parts) g.fillCircle(x, y, r + ink);
  g.fillStyle(fill, 1);
  for (const [x, y, r] of parts) g.fillCircle(x, y, r);
}

function floors(scene: Phaser.Scene) {
  bake(scene, "floor-court", 400, 120, (g) => {
    g.fillStyle(0x4f9d83, 1);
    g.fillRect(0, 0, 400, 120);
    g.fillStyle(0x458e76, 1);
    g.fillRect(0, 70, 400, 50);
    g.fillStyle(0xf4f1e6, 1);
    g.fillRect(0, 14, 400, 8);
    g.fillStyle(0x3d8a71, 1);
    g.fillRect(0, 0, 400, 14);
    g.fillStyle(0xffffff, 0.12);
    for (const [x, y, w] of [[40, 40, 60], [230, 52, 40], [320, 90, 70], [120, 98, 30]]) g.fillRoundedRect(x, y, w, 4, 2);
  });
  bake(scene, "floor-canteen", 160, 120, (g) => {
    for (let y = 14; y < 120; y += 40) {
      for (let x = 0; x < 160; x += 40) {
        g.fillStyle(((x + y - 14) / 40) % 2 ? 0xd9564a : 0xf3e6c4, 1);
        g.fillRect(x, y, 40, 40);
      }
    }
    g.lineStyle(2, 0xb99f7a, 1);
    for (let x = 0; x <= 160; x += 40) g.lineBetween(x, 14, x, 120);
    for (let y = 54; y < 120; y += 40) g.lineBetween(0, y, 160, y);
    g.fillStyle(0xaab4bf, 1);
    g.fillRect(0, 0, 160, 14);
    g.fillStyle(0xdfe5ea, 1);
    g.fillRect(0, 3, 160, 3);
  });
  bake(scene, "floor-garden", 200, 120, (g) => {
    g.fillStyle(0xd9a07c, 1);
    g.fillRect(0, 0, 200, 120);
    g.fillStyle(0xb8573f, 1);
    for (let row = 0; row < 5; row += 1) {
      const y = 16 + row * 22;
      for (let x = row % 2 ? -25 : 0; x < 200; x += 50) g.fillRect(x + 2, y + 2, 46, 18);
    }
    g.fillStyle(0x93cf4c, 1);
    g.fillRect(0, 0, 200, 14);
    g.fillStyle(0x5e9e34, 1);
    for (let x = 4; x < 200; x += 16) g.fillTriangle(x, 14, x + 6, 14, x + 3, 4);
    for (const [x, c] of [[26, 0xf06ba8], [92, 0xffc83d], [150, 0xfbf5e6], [178, 0xf06ba8]] as const) {
      g.fillStyle(c, 1);
      g.fillCircle(x, 6, 4);
      g.fillStyle(0xffc83d, 1);
      g.fillCircle(x, 6, 1.5);
    }
  });
  bake(scene, "floor-seam", 30, 320, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRect(0, 0, 30, 320);
    g.fillStyle(0xcfc6b0, 1);
    g.fillRect(4, 0, 22, 320);
    g.fillStyle(0xe6dfcc, 1);
    g.fillRect(4, 0, 22, 6);
    g.fillStyle(0x5a5f73, 1);
    for (let y = 22; y < 320; y += 22) g.fillRoundedRect(9, y, 12, 12, 3);
  });
}

function canteenHall(scene: Phaser.Scene) {
  bake(scene, "yard-hall", 780, 380, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRect(24, 86, 732, 294);
    g.fillStyle(0x7cc6d6, 1);
    g.fillRect(30, 92, 720, 288);
    g.fillStyle(0x6ab4c5, 1);
    g.fillRect(30, 300, 720, 80);
    g.fillStyle(INK_HEX, 1);
    g.fillPoints([V(0, 96), V(60, 30), V(720, 30), V(780, 96)], true);
    g.fillStyle(0xe0773f, 1);
    g.fillPoints([V(12, 90), V(64, 36), V(716, 36), V(768, 90)], true);
    g.lineStyle(3, 0xc4612f, 1);
    for (const y of [52, 68, 82]) g.lineBetween(30, y, 750, y);
    g.fillStyle(INK_HEX, 1);
    g.fillRect(612, 0, 70, 40);
    g.fillStyle(0x9aa6b8, 1);
    g.fillRect(618, 6, 58, 30);
    g.lineStyle(3, INK_HEX, 1);
    for (const x of [630, 646, 662]) g.lineBetween(x, 10, x, 32);
    for (const x of [70, 236, 450, 616]) {
      g.fillStyle(INK_HEX, 1);
      g.fillRoundedRect(x - 6, 154, 122, 136, 8);
      g.fillStyle(0xbfe6fb, 1);
      g.fillRect(x, 160, 110, 124);
      g.lineStyle(4, INK_HEX, 1);
      g.lineBetween(x + 55, 160, x + 55, 284);
      for (let i = 0; i < 6; i += 1) {
        g.fillStyle(i % 2 ? 0xfbf5e6 : 0xef4f43, 1);
        g.fillRect(x + i * 18.3, 160, 18.3, 26);
      }
      g.fillStyle(INK_HEX, 1);
      g.fillRect(x, 186, 110, 4);
      g.fillStyle(0xd8c59a, 1);
      g.fillRect(x - 8, 290, 126, 10);
    }
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(334, 214, 96, 166, 6);
    g.fillStyle(0x55301e, 1);
    g.fillRect(340, 220, 42, 160);
    g.fillRect(386, 220, 38, 160);
    g.fillStyle(0xffc83d, 1);
    g.fillCircle(376, 300, 5);
    g.fillCircle(392, 300, 5);
  });
}

function libraryAnnex(scene: Phaser.Scene) {
  bake(scene, "yard-annex", 700, 400, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRect(34, 120, 632, 280);
    g.fillStyle(0xd7cde6, 1);
    g.fillRect(40, 126, 620, 274);
    g.fillStyle(INK_HEX, 1);
    g.fillPoints([V(10, 132), V(350, 6), V(690, 132)], true);
    g.fillStyle(0x7b62c4, 1);
    g.fillPoints([V(30, 124), V(350, 18), V(670, 124)], true);
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(350, 84, 34);
    g.fillStyle(0xfbf5e6, 1);
    g.fillCircle(350, 84, 28);
    g.lineStyle(4, INK_HEX, 1);
    g.lineBetween(350, 70, 350, 98);
    g.beginPath();
    g.moveTo(330, 72);
    g.lineTo(350, 76);
    g.lineTo(370, 72);
    g.lineTo(370, 96);
    g.lineTo(350, 100);
    g.lineTo(330, 96);
    g.closePath();
    g.strokePath();
    for (const x of [150, 300, 450]) {
      const cx = x + 50;
      g.fillStyle(INK_HEX, 1);
      g.fillRect(cx - 46, 196, 92, 150);
      g.fillCircle(cx, 196, 46);
      g.fillStyle(0xbfe6fb, 1);
      g.fillRect(cx - 40, 196, 80, 144);
      g.fillCircle(cx, 196, 40);
      g.lineStyle(4, INK_HEX, 1);
      g.lineBetween(cx, 160, cx, 340);
      g.lineBetween(cx - 40, 250, cx + 40, 250);
    }
    for (const x of [92, 250, 400, 556]) {
      g.fillStyle(INK_HEX, 1);
      g.fillRect(x - 3, 130, 56, 270);
      g.fillStyle(0xf3eee2, 1);
      g.fillRect(x + 3, 142, 44, 250);
      g.fillStyle(0xd8cfbd, 1);
      g.fillRect(x + 33, 142, 14, 250);
      g.fillStyle(INK_HEX, 1);
      g.fillRect(x - 9, 130, 68, 14);
      g.fillRect(x - 9, 384, 68, 16);
    }
    g.fillStyle(INK_HEX, 1);
    g.fillRect(34, 120, 632, 12);
  });
}

function mural(scene: Phaser.Scene) {
  bake(scene, "yard-mural", 720, 180, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRect(0, 10, 720, 170);
    g.fillStyle(0xf3e6c4, 1);
    g.fillRect(0, 26, 720, 154);
    g.fillStyle(0xc4352c, 1);
    g.fillRect(0, 14, 720, 12);
    g.fillStyle(0xeadbb4, 1);
    g.fillRect(0, 150, 720, 30);
    g.fillStyle(0xffc83d, 1);
    g.fillCircle(90, 80, 28);
    g.lineStyle(6, 0xffc83d, 1);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      g.lineBetween(90 + Math.cos(a) * 36, 80 + Math.sin(a) * 36, 90 + Math.cos(a) * 48, 80 + Math.sin(a) * 48);
    }
    [0xef4f43, 0xffc83d, 0x63d6c1, 0x5cb9f0].forEach((c, i) => {
      g.lineStyle(9, c, 1);
      g.beginPath();
      g.arc(330, 150, 86 - i * 11, Math.PI, 0, false);
      g.strokePath();
    });
    for (const [x, c] of [[180, 0xf06ba8], [214, 0x93cf4c], [470, 0x5cb9f0], [512, 0xef4f43], [690, 0xffc83d]] as const) {
      g.fillStyle(c, 1);
      g.fillCircle(x, 66, 15);
      g.fillCircle(x - 12, 56, 7);
      g.fillCircle(x - 4, 46, 7);
      g.fillCircle(x + 8, 48, 7);
      g.fillCircle(x + 14, 60, 6);
    }
    g.lineStyle(5, INK_HEX, 0.85);
    for (const [x, arm] of [[590, 1], [640, -1]] as const) {
      g.strokeCircle(x, 70, 12);
      g.lineBetween(x, 82, x, 112);
      g.lineBetween(x, 112, x - 12, 136);
      g.lineBetween(x, 112, x + 12, 136);
      g.lineBetween(x, 92, x + arm * 20, 76);
      g.lineBetween(x, 92, x - arm * 18, 104);
    }
    g.fillStyle(0xef4f43, 1);
    g.fillCircle(615, 58, 9);
  });
}

function hedge(scene: Phaser.Scene) {
  bake(scene, "yard-hedge", 360, 150, (g) => {
    const tops: [number, number, number][] = [[20, 52, 34], [76, 40, 38], [134, 54, 32], [190, 38, 40], [250, 50, 34], [304, 42, 36], [360, 52, 34], [0, 52, 34]];
    g.fillStyle(INK_HEX, 1);
    g.fillRect(0, 50, 360, 100);
    blobs(g, tops, 0x4c9a43);
    g.fillStyle(0x4c9a43, 1);
    g.fillRect(0, 54, 360, 96);
    g.fillStyle(0x3d8237, 1);
    g.fillRect(0, 112, 360, 38);
    g.lineStyle(4, 0x7ec46a, 1);
    for (const [x, y] of [[60, 36], [180, 28], [292, 32], [120, 70], [250, 76]]) {
      g.beginPath();
      g.arc(x, y + 8, 14, Math.PI * 1.15, Math.PI * 1.75, false);
      g.strokePath();
    }
  });
  bake(scene, "yard-railing", 240, 210, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRect(0, 150, 240, 60);
    g.fillStyle(0xb8573f, 1);
    g.fillRect(0, 156, 240, 54);
    g.fillStyle(0xd9a07c, 1);
    for (const y of [176, 194]) g.fillRect(0, y, 240, 3);
    g.fillRect(118, 156, 3, 20);
    g.fillRect(58, 176, 3, 18);
    g.fillRect(178, 176, 3, 18);
    g.fillStyle(INK_HEX, 1);
    g.fillRect(0, 28, 240, 8);
    g.fillRect(0, 116, 240, 8);
    for (let x = 12; x < 240; x += 30) {
      g.fillRect(x - 4, 18, 8, 136);
      g.fillTriangle(x - 9, 22, x + 9, 22, x, 4);
    }
    g.fillStyle(0x3d4a5c, 1);
    for (let x = 12; x < 240; x += 30) g.fillRect(x - 1.5, 24, 3, 128);
    const flowers: [number, number][] = [[30, 0xf06ba8], [80, 0xffc83d], [140, 0xf06ba8], [196, 0xfbf5e6]];
    g.fillStyle(0x4c9a43, 1);
    g.fillRoundedRect(0, 128, 240, 30, 12);
    for (const [x, c] of flowers) {
      g.fillStyle(INK_HEX, 1);
      g.fillCircle(x, 130, 12);
      g.fillStyle(c, 1);
      g.fillCircle(x, 130, 9);
      g.fillStyle(0xffc83d, 1);
      g.fillCircle(x, 130, 3);
    }
  });
}

function ipe(scene: Phaser.Scene, key: string, bloom: number, shade: number) {
  bake(scene, key, 520, 600, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillPoints([V(232, 600), V(244, 330), V(206, 250), V(226, 244), V(258, 310), V(282, 236), V(302, 244), V(276, 340), V(290, 600)], true);
    g.fillStyle(0x6e4522, 1);
    g.fillPoints([V(240, 596), V(251, 330), V(216, 256), V(224, 254), V(258, 320), V(286, 246), V(294, 250), V(268, 340), V(282, 596)], true);
    g.lineStyle(3, 0x55301e, 1);
    g.lineBetween(262, 420, 266, 560);
    const crown: [number, number, number][] = [
      [120, 230, 78], [200, 160, 92], [300, 150, 96], [392, 218, 82], [258, 236, 96], [150, 290, 58], [370, 290, 60], [86, 200, 48], [440, 196, 46],
    ];
    blobs(g, crown, bloom, 7);
    g.fillStyle(shade, 1);
    for (const [x, y, r] of [[150, 270, 44], [240, 270, 58], [350, 268, 48], [300, 214, 30]]) g.fillCircle(x, y, r);
    g.fillStyle(bloom, 1);
    for (const [x, y, r] of [[176, 238, 30], [280, 232, 34], [370, 238, 24]]) g.fillCircle(x, y, r);
    g.fillStyle(0xffffff, 0.45);
    for (const [x, y] of [[170, 120], [240, 98], [330, 104], [110, 190], [410, 170], [290, 170], [200, 200]]) g.fillCircle(x, y, 7);
    g.fillStyle(0x5e9e34, 1);
    for (const [x, y] of [[128, 168], [356, 150], [230, 128], [420, 230], [96, 250]]) g.fillEllipse(x, y, 16, 9);
  });
}

function benches(scene: Phaser.Scene) {
  bake(scene, "bench-court", 250, 100, (g) => {
    g.fillStyle(INK_HEX, 1);
    for (const x of [22, 210]) g.fillRect(x - 2.5, 45.5, 23, 55);
    g.fillStyle(0x9aa6b8, 1);
    for (const x of [22, 210]) g.fillRect(x, 48, 18, 50);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(1.5, 27.5, 247, 27, 8);
    g.fillRoundedRect(7.5, 1.5, 235, 23, 7);
    g.fillStyle(0x3fa9a0, 1);
    g.fillRoundedRect(4, 30, 242, 22, 6);
    g.fillRoundedRect(10, 4, 230, 18, 5);
    g.fillStyle(0x7fd6c6, 1);
    g.fillRect(16, 7, 218, 4);
    g.fillRect(12, 33, 226, 4);
    g.fillStyle(0xfbf5e6, 1);
    for (const x of [60, 125, 190]) g.fillRect(x, 30, 4, 22);
  });
  bake(scene, "bench-garden", 250, 100, (g) => {
    g.lineStyle(10, INK_HEX, 1);
    for (const [x, d] of [[30, -1], [220, 1]] as const) {
      g.beginPath();
      g.moveTo(x, 50);
      g.lineTo(x + d * 6, 76);
      g.lineTo(x - d * 2, 97);
      g.strokePath();
    }
    g.lineStyle(5, 0x2f6b55, 1);
    for (const [x, d] of [[30, -1], [220, 1]] as const) {
      g.beginPath();
      g.moveTo(x, 50);
      g.lineTo(x + d * 6, 76);
      g.lineTo(x - d * 2, 97);
      g.strokePath();
    }
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(1.5, 27.5, 247, 27, 6);
    g.fillRoundedRect(7.5, 1.5, 235, 23, 6);
    g.fillStyle(0xbdb6a8, 1);
    g.fillRoundedRect(4, 30, 242, 22, 4);
    g.fillRoundedRect(10, 4, 230, 18, 4);
    g.fillStyle(0xd8d2c4, 1);
    g.fillRect(14, 6, 222, 5);
    g.fillRect(8, 32, 234, 5);
    g.fillStyle(0x9b9384, 1);
    for (const [x, y] of [[40, 44], [120, 46], [196, 43], [80, 16], [170, 15]]) g.fillCircle(x, y, 2.5);
  });
}

function props(scene: Phaser.Scene) {
  bake(scene, "yard-scoreboard", 340, 186, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(0, 0, 340, 176, 14);
    g.fillRect(60, 170, 14, 16);
    g.fillRect(266, 170, 14, 16);
    g.fillStyle(0xffc83d, 1);
    g.fillRoundedRect(6, 6, 328, 164, 10);
    g.fillStyle(0x2b2150, 1);
    g.fillRoundedRect(16, 16, 308, 144, 8);
    for (const x of [30, 196]) {
      g.fillStyle(0x140f26, 1);
      g.fillRoundedRect(x, 56, 114, 90, 6);
    }
    g.fillStyle(0xfbf5e6, 1);
    g.fillCircle(170, 92, 5);
    g.fillCircle(170, 112, 5);
  });
  bake(scene, "yard-chalkboard", 170, 210, (g) => {
    g.lineStyle(10, INK_HEX, 1);
    g.lineBetween(30, 160, 14, 208);
    g.lineBetween(140, 160, 156, 208);
    g.lineStyle(5, 0x9c5832, 1);
    g.lineBetween(30, 160, 14, 206);
    g.lineBetween(140, 160, 156, 206);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(8, 4, 154, 166, 10);
    g.fillStyle(0x9c5832, 1);
    g.fillRoundedRect(13, 9, 144, 156, 8);
    g.fillStyle(0x2f5d4a, 1);
    g.fillRoundedRect(22, 18, 126, 138, 5);
    g.fillStyle(0xffffff, 0.08);
    g.fillRect(28, 26, 50, 6);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(70, 0, 30, 12, 4);
  });
  bake(scene, "yard-bookdrop", 130, 190, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRect(30, 150, 18, 40);
    g.fillRect(82, 150, 18, 40);
    g.fillRoundedRect(4, 10, 122, 150, { tl: 40, tr: 40, bl: 8, br: 8 });
    g.fillStyle(0x3f6fb5, 1);
    g.fillRoundedRect(10, 16, 110, 138, { tl: 34, tr: 34, bl: 5, br: 5 });
    g.fillStyle(0x5a8bd1, 1);
    g.fillRoundedRect(14, 20, 24, 128, { tl: 20, tr: 0, bl: 4, br: 0 });
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(26, 50, 78, 16, 6);
    g.fillStyle(0x140f26, 1);
    g.fillRoundedRect(30, 54, 70, 8, 4);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(28, 82, 74, 54, 6);
    g.lineStyle(3, INK_HEX, 1);
    g.strokeRoundedRect(28, 82, 74, 54, 6);
    g.fillStyle(0xef4f43, 1);
    g.fillRect(40, 92, 24, 34);
    g.fillStyle(0x63d6c1, 1);
    g.fillRect(66, 92, 24, 34);
    g.lineStyle(3, INK_HEX, 1);
    g.strokeRect(40, 92, 24, 34);
    g.strokeRect(66, 92, 24, 34);
    g.fillStyle(0x5a5f73, 1);
    g.fillRect(33, 150, 12, 40);
    g.fillRect(85, 150, 12, 40);
  });
  bake(scene, "yard-plate", 220, 74, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(0, 0, 220, 74, 10);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(5, 5, 210, 64, 7);
    g.lineStyle(4, 0xef4f43, 1);
    g.strokeRoundedRect(12, 12, 196, 50, 5);
  });
  bake(scene, "yard-post", 20, 300, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRect(0, 0, 20, 300);
    g.fillStyle(0x5a5f73, 1);
    g.fillRect(5, 0, 10, 300);
  });
  bake(scene, "yard-note", 180, 60, (g) => {
    g.fillStyle(INK_HEX, 0.9);
    g.fillPoints([V(4, 8), V(176, 2), V(178, 54), V(6, 58)], true);
    g.fillStyle(0xfdf0c2, 1);
    g.fillPoints([V(8, 11), V(172, 6), V(174, 50), V(10, 54)], true);
    g.fillStyle(0xe8d3a8, 0.95);
    g.fillRect(70, 0, 40, 12);
  });
  bake(scene, "yard-tape", 150, 44, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(0, 0, 150, 44, 6);
    g.fillStyle(0xef4f43, 1);
    g.fillRoundedRect(4, 4, 142, 36, 4);
  });
  bake(scene, "yard-pillar", 56, 240, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillRect(4, 16, 48, 224);
    g.fillRoundedRect(0, 0, 56, 24, 6);
    g.fillStyle(0xb8573f, 1);
    g.fillRect(9, 22, 38, 218);
    g.fillStyle(0xe6dfcc, 1);
    g.fillRoundedRect(4, 4, 48, 16, 4);
    g.fillStyle(0xd9a07c, 1);
    for (let y = 46; y < 240; y += 28) g.fillRect(9, y, 38, 3);
  });
  bake(scene, "yard-chalk", 520, 80, (g) => {
    g.lineStyle(4, 0xffffff, 0.75);
    for (let i = 0; i < 5; i += 1) g.strokeRect(4 + i * 64, 6, 60, 40);
    g.lineStyle(4, 0xf06ba8, 0.75);
    g.strokeCircle(384, 26, 22);
    g.lineStyle(4, 0xffc83d, 0.7);
    g.strokeCircle(470, 30, 14);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      g.lineBetween(470 + Math.cos(a) * 19, 30 + Math.sin(a) * 19, 470 + Math.cos(a) * 28, 30 + Math.sin(a) * 28);
    }
  });
  bake(scene, "yard-haze", 8, 600, (g) => {
    for (let y = 0; y < 600; y += 10) {
      g.fillStyle(0xe2f3fc, Math.min(1, y / 420) * 0.42);
      g.fillRect(0, y, 8, 10);
    }
  });
}

export function makeYardTextures(scene: Phaser.Scene) {
  floors(scene);
  canteenHall(scene);
  libraryAnnex(scene);
  mural(scene);
  hedge(scene);
  ipe(scene, "tree-ipe-yellow", 0xffc83d, 0xe5a61f);
  ipe(scene, "tree-ipe-pink", 0xf06ba8, 0xc94f8a);
  benches(scene);
  props(scene);
}
