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
}
