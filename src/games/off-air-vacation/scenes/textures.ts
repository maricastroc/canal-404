import * as Phaser from "phaser";

export function makeTextures(scene: Phaser.Scene) {
  const tex = scene.textures;
  const canvas = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
    if (tex.exists(key)) return;
    const c = tex.createCanvas(key, w, h)!;
    draw(c.getContext());
    c.refresh();
  };
  canvas("blob", 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(29,24,48,0.8)");
    g.addColorStop(0.6, "rgba(29,24,48,0.45)");
    g.addColorStop(1, "rgba(29,24,48,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  canvas("glow", 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
  canvas("scanlines", 8, 8, (ctx) => {
    ctx.fillStyle = "rgba(255,255,255,0.0)";
    ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = "rgba(20,15,38,0.55)";
    ctx.fillRect(0, 0, 8, 3);
  });
  canvas("static", 256, 256, (ctx) => {
    const img = ctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v + 20;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
  canvas("sky-beach", 64, 180, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 180);
    g.addColorStop(0, "#6ec6f0");
    g.addColorStop(1, "#c9eefc");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 180);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.ellipse(20, 60, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  canvas("sea-tile", 256, 240, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 240);
    g.addColorStop(0, "#2f86c9");
    g.addColorStop(1, "#4fb6e8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 240);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (const [x, y] of [
      [30, 40],
      [150, 90],
      [80, 160],
      [200, 200],
      [10, 120],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 15, y - 10, x + 30, y);
      ctx.quadraticCurveTo(x + 45, y + 10, x + 60, y);
      ctx.stroke();
    }
  });
  const gfx = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
    if (tex.exists(key)) return;
    const g = scene.make.graphics({}, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  gfx("arc-catcher", 150, 110, (g) => {
    g.lineStyle(6, 0x1d1830, 1);
    g.lineBetween(55, 30, 35, 4);
    g.lineBetween(95, 30, 115, 4);
    g.fillStyle(0x1d1830, 1);
    g.fillRoundedRect(14, 28, 126, 78, 18);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(10, 24, 126, 78, 18);
    g.fillStyle(0x5cb9f0, 1);
    g.fillRoundedRect(24, 36, 84, 54, 10);
    g.fillStyle(0xffc83d, 1);
    g.fillCircle(122, 50, 7);
    g.fillStyle(0xef4f43, 1);
    g.fillCircle(122, 74, 7);
  });
  gfx("arc-signal", 80, 80, (g) => {
    g.fillStyle(0x1d1830, 1);
    g.fillRoundedRect(4, 4, 72, 72, 16);
    g.fillStyle(0x7dffb2, 1);
    [18, 30, 44, 58].forEach((h, i) => g.fillRect(14 + i * 14, 64 - h, 10, h));
  });
  gfx("arc-static", 90, 70, (g) => {
    g.fillStyle(0x9aa6b8, 1);
    g.fillCircle(25, 40, 22);
    g.fillCircle(48, 28, 24);
    g.fillCircle(66, 42, 20);
    g.fillStyle(0xfbf5e6, 1);
    for (let i = 0; i < 18; i += 1) g.fillRect(10 + ((i * 37) % 70), 16 + ((i * 23) % 44), 6, 3);
  });
  gfx("spark", 30, 30, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(15, 0, 19, 15, 11, 15);
    g.fillTriangle(15, 30, 19, 15, 11, 15);
    g.fillTriangle(0, 15, 15, 11, 15, 19);
    g.fillTriangle(30, 15, 15, 11, 15, 19);
  });
  gfx("leaf", 26, 16, (g) => {
    g.fillStyle(0x1d1830, 1);
    g.fillEllipse(13, 8, 26, 16);
    g.fillStyle(0x6fbf4f, 1);
    g.fillEllipse(13, 8, 20, 10);
  });
  gfx("ghost", 70, 80, (g) => {
    g.fillStyle(0x1d1830, 1);
    g.fillRoundedRect(4, 4, 62, 74, { tl: 31, tr: 31, bl: 6, br: 6 });
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(9, 9, 52, 66, { tl: 26, tr: 26, bl: 4, br: 4 });
    g.fillStyle(0x1d1830, 1);
    g.fillEllipse(26, 34, 9, 13);
    g.fillEllipse(44, 34, 9, 13);
    g.fillEllipse(35, 52, 10, 8);
  });
  gfx("ticket", 90, 44, (g) => {
    g.fillStyle(0x1d1830, 1);
    g.fillRect(0, 0, 90, 44);
    g.fillStyle(0xffe39a, 1);
    g.fillRect(4, 4, 82, 36);
    g.fillStyle(0xef4f43, 1);
    g.fillRect(10, 12, 50, 6);
    g.fillRect(10, 24, 36, 5);
    g.fillStyle(0x1d1830, 1);
    for (let i = 0; i < 4; i += 1) g.fillCircle(72, 10 + i * 8, 2);
  });
  gfx("confetti", 18, 10, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 18, 10);
  });
  gfx("arrow", 120, 80, (g) => {
    g.fillStyle(0x1d1830, 0.35);
    g.fillTriangle(110, 40, 60, 6, 60, 74);
    g.fillRect(10, 26, 54, 28);
    g.fillStyle(0xfbf5e6, 0.85);
    g.fillTriangle(104, 40, 64, 14, 64, 66);
    g.fillRect(16, 32, 50, 16);
  });
  const INK = 0x1d1830;
  gfx("footprint", 28, 40, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(14, 25, 20, 26);
    g.fillEllipse(14, 7, 14, 10);
  });
  gfx("ring", 120, 48, (g) => {
    g.lineStyle(6, 0xffffff, 1);
    g.strokeEllipse(60, 24, 110, 40);
  });
  const frogBody = (g: Phaser.GameObjects.Graphics, ox: number, oy: number, shades: boolean, open: boolean) => {
    g.fillStyle(INK, 1);
    g.fillEllipse(ox + 60, oy + 72, 112, 70);
    g.fillCircle(ox + 34, oy + 36, 22);
    g.fillCircle(ox + 86, oy + 36, 22);
    g.fillEllipse(ox + 22, oy + 100, 46, 22);
    g.fillEllipse(ox + 98, oy + 100, 46, 22);
    g.fillStyle(0x6fbf4f, 1);
    g.fillEllipse(ox + 60, oy + 72, 100, 58);
    g.fillCircle(ox + 34, oy + 36, 16);
    g.fillCircle(ox + 86, oy + 36, 16);
    g.fillEllipse(ox + 22, oy + 100, 36, 14);
    g.fillEllipse(ox + 98, oy + 100, 36, 14);
    g.fillStyle(0xb8e07a, 1);
    g.fillEllipse(ox + 60, oy + 84, 58, 30);
    if (shades) {
      g.fillStyle(INK, 1);
      g.fillRoundedRect(ox + 14, oy + 26, 92, 22, 10);
      g.fillStyle(0x5cb9f0, 1);
      g.fillRoundedRect(ox + 20, oy + 30, 34, 13, 6);
      g.fillRoundedRect(ox + 66, oy + 30, 34, 13, 6);
    } else {
      g.fillStyle(0xfbf5e6, 1);
      g.fillCircle(ox + 34, oy + 34, 10);
      g.fillCircle(ox + 86, oy + 34, 10);
      g.fillStyle(INK, 1);
      g.fillCircle(ox + 36, oy + 36, 5);
      g.fillCircle(ox + 84, oy + 36, 5);
    }
    g.fillStyle(INK, 1);
    if (open) g.fillEllipse(ox + 60, oy + 62, 30, 14);
    else g.fillRect(ox + 42, oy + 60, 36, 5);
  };
  gfx("frog-a", 124, 116, (g) => frogBody(g, 2, 2, false, false));
  gfx("frog-b", 140, 100, (g) => {
    g.fillStyle(INK, 1);
    g.fillEllipse(70, 44, 116, 52);
    g.fillCircle(44, 20, 18);
    g.fillCircle(92, 20, 18);
    g.fillRoundedRect(4, 54, 50, 18, 9);
    g.fillRoundedRect(86, 54, 50, 18, 9);
    g.fillStyle(0x6fbf4f, 1);
    g.fillEllipse(70, 44, 104, 40);
    g.fillCircle(44, 20, 12);
    g.fillCircle(92, 20, 12);
    g.fillRoundedRect(9, 58, 40, 10, 5);
    g.fillRoundedRect(91, 58, 40, 10, 5);
    g.fillStyle(0xfbf5e6, 1);
    g.fillCircle(44, 18, 7);
    g.fillCircle(92, 18, 7);
    g.fillStyle(INK, 1);
    g.fillCircle(45, 19, 3.5);
    g.fillCircle(91, 19, 3.5);
  });
  gfx("coaxo-a", 124, 116, (g) => frogBody(g, 2, 2, true, false));
  gfx("coaxo-b", 124, 116, (g) => frogBody(g, 2, 2, true, true));
  const fish = (g: Phaser.GameObjects.Graphics, flip: number) => {
    g.fillStyle(INK, 1);
    g.fillEllipse(62, 32, 92, 40);
    g.fillTriangle(16, 32, -2 + 0, 10 + flip * 6, -2, 54 + flip * 6);
    g.fillStyle(0xff8a3d, 1);
    g.fillEllipse(62, 32, 82, 30);
    g.fillTriangle(18, 32, 5, 16 + flip * 6, 5, 48 + flip * 6);
    g.fillStyle(0xfbf5e6, 1);
    g.fillEllipse(70, 26, 22, 12);
    g.fillEllipse(46, 38, 16, 10);
    g.fillStyle(INK, 1);
    g.fillCircle(92, 26, 3.5);
    g.fillCircle(92, 38, 3.5);
  };
  gfx("fish-a", 112, 66, (g) => fish(g, 0));
  gfx("fish-b", 112, 66, (g) => fish(g, -1));
  const butterfly = (g: Phaser.GameObjects.Graphics, open: boolean) => {
    const w = open ? 1 : 0.45;
    g.fillStyle(INK, 1);
    g.fillEllipse(40 - 18 * w, 26, 40 * w + 8, 40);
    g.fillEllipse(40 + 18 * w, 26, 40 * w + 8, 40);
    g.fillEllipse(40 - 14 * w, 50, 30 * w + 8, 28);
    g.fillEllipse(40 + 14 * w, 50, 30 * w + 8, 28);
    g.fillStyle(0xf06ba8, 1);
    g.fillEllipse(40 - 18 * w, 26, 40 * w, 32);
    g.fillEllipse(40 + 18 * w, 26, 40 * w, 32);
    g.fillStyle(0xffc83d, 1);
    g.fillEllipse(40 - 14 * w, 50, 30 * w, 20);
    g.fillEllipse(40 + 14 * w, 50, 30 * w, 20);
    g.fillStyle(INK, 1);
    g.fillRoundedRect(36, 14, 8, 50, 4);
  };
  gfx("butterfly-a", 80, 70, (g) => butterfly(g, true));
  gfx("butterfly-b", 80, 70, (g) => butterfly(g, false));
  const kitten = (g: Phaser.GameObjects.Graphics, pose: "a" | "b" | "sit") => {
    const sit = pose === "sit";
    g.lineStyle(14, INK, 1);
    g.beginPath();
    g.moveTo(26, sit ? 92 : 62);
    g.lineTo(8, sit ? 70 : 40);
    g.lineTo(14, sit ? 44 : 18);
    g.strokePath();
    g.lineStyle(7, 0xff9f4a, 1);
    g.beginPath();
    g.moveTo(26, sit ? 92 : 62);
    g.lineTo(8, sit ? 70 : 40);
    g.lineTo(14, sit ? 44 : 18);
    g.strokePath();
    g.fillStyle(INK, 1);
    if (sit) g.fillEllipse(56, 84, 62, 52);
    else g.fillEllipse(60, 70, 84, 40);
    const legs = sit ? [[36, 96], [70, 96]] : pose === "a" ? [[34, 82], [52, 86], [74, 82], [90, 86]] : [[40, 86], [48, 82], [80, 86], [86, 82]];
    for (const [lx, ly] of legs) g.fillRoundedRect(lx - 7, ly - 10, 14, 24, 6);
    g.fillCircle(sit ? 76 : 98, sit ? 46 : 46, 28);
    g.fillTriangle(sit ? 54 : 76, sit ? 32 : 32, sit ? 62 : 84, sit ? 6 : 6, sit ? 74 : 96, sit ? 26 : 26);
    g.fillTriangle(sit ? 82 : 104, sit ? 24 : 24, sit ? 94 : 116, sit ? 4 : 4, sit ? 100 : 122, sit ? 30 : 30);
    g.fillStyle(0xff9f4a, 1);
    if (sit) g.fillEllipse(56, 84, 52, 42);
    else g.fillEllipse(60, 70, 74, 30);
    for (const [lx, ly] of legs) g.fillRoundedRect(lx - 3, ly - 8, 6, 18, 3);
    const hx = sit ? 76 : 98;
    g.fillCircle(hx, 46, 22);
    g.fillTriangle(hx - 18, 34, hx - 13, 14, hx - 4, 28);
    g.fillTriangle(hx + 8, 28, hx + 16, 12, hx + 20, 32);
    g.fillStyle(0xfbf5e6, 1);
    g.fillEllipse(hx + 4, 56, 22, 12);
    g.fillStyle(INK, 1);
    g.fillCircle(hx - 6, 42, 4);
    g.fillCircle(hx + 12, 42, 4);
    g.fillCircle(hx + 4, 52, 3);
  };
  gfx("kitten-a", 130, 110, (g) => kitten(g, "a"));
  gfx("kitten-b", 130, 110, (g) => kitten(g, "b"));
  gfx("kitten-sit", 130, 110, (g) => kitten(g, "sit"));
  const siri = (g: Phaser.GameObjects.Graphics, wave: boolean) => {
    g.lineStyle(8, INK, 1);
    for (const [x0, x1] of [[50, 26], [56, 22], [62, 20], [130, 154], [124, 158], [118, 160]]) g.lineBetween(x0, 112, x1, 134);
    g.lineBetween(52, 80, 30, wave ? 30 : 54);
    g.lineBetween(128, 80, 150, wave ? 30 : 54);
    g.fillStyle(INK, 1);
    g.fillEllipse(90, 96, 124, 66);
    g.fillCircle(26, wave ? 24 : 50, 18);
    g.fillCircle(154, wave ? 24 : 50, 18);
    g.fillStyle(0xef4f43, 1);
    g.fillEllipse(90, 96, 112, 54);
    g.fillCircle(26, wave ? 24 : 50, 12);
    g.fillCircle(154, wave ? 24 : 50, 12);
    g.fillStyle(0xff8a7a, 1);
    g.fillEllipse(78, 86, 44, 14);
    g.fillStyle(INK, 1);
    g.fillRoundedRect(58, 54, 64, 18, 8);
    g.fillStyle(0x5cb9f0, 1);
    g.fillRoundedRect(63, 57, 24, 11, 5);
    g.fillRoundedRect(93, 57, 24, 11, 5);
    g.fillStyle(INK, 1);
    g.fillEllipse(90, 44, 104, 20);
    g.fillEllipse(90, 32, 56, 34);
    g.fillStyle(0xffe39a, 1);
    g.fillEllipse(90, 44, 94, 12);
    g.fillEllipse(90, 32, 46, 26);
    g.fillStyle(0xef4f43, 1);
    g.fillRect(68, 38, 44, 6);
  };
  gfx("siri-a", 182, 140, (g) => siri(g, false));
  gfx("siri-b", 182, 140, (g) => siri(g, true));
  const gullSit = (g: Phaser.GameObjects.Graphics, peck: boolean) => {
    g.fillStyle(INK, 1);
    g.fillEllipse(56, 58, 76, 46);
    g.fillCircle(peck ? 92 : 84, peck ? 54 : 30, 20);
    g.fillRoundedRect(44, 76, 8, 26, 3);
    g.fillRoundedRect(62, 76, 8, 26, 3);
    g.fillStyle(0xfbf5e6, 1);
    g.fillEllipse(56, 58, 66, 36);
    g.fillCircle(peck ? 92 : 84, peck ? 54 : 30, 14);
    g.fillStyle(0xb9c3d6, 1);
    g.fillEllipse(48, 54, 40, 18);
    g.fillStyle(0xffc83d, 1);
    g.fillRoundedRect(44, 80, 6, 20, 2);
    g.fillRoundedRect(62, 80, 6, 20, 2);
    g.fillTriangle(peck ? 104 : 96, peck ? 52 : 28, peck ? 124 : 116, peck ? 62 : 32, peck ? 104 : 96, peck ? 62 : 36);
    g.fillStyle(INK, 1);
    g.fillCircle(peck ? 94 : 88, peck ? 50 : 26, 3.5);
  };
  gfx("gull-sit", 128, 104, (g) => gullSit(g, false));
  gfx("gull-peck", 128, 104, (g) => gullSit(g, true));
}
