import type * as Phaser from "phaser";

type SignLine = { text: string; size: number; w: number; align?: CanvasTextAlign; fill: string; stroke?: string; strokeW?: number; m: [number, number, number, number, number, number] };

const GROW = 1.12;
const SQUEEZE = 0.88;

export const SIGNS: Record<string, { view: number; lines: SignLine[] }> = {
  "arcade-front": {
    view: 780,
    lines: [
      { text: "FLIPERAMA", size: 62, w: 399.6, fill: "#ff7ad9", stroke: "#ffffff", strokeW: 2, m: [1, 0, 0, 1, 390, 106] },
      { text: "ABERTO", size: 18, w: 82.2, fill: "#1d1830", m: [1, 0, 0, 1, 390, 427] },
      { text: "NOVO", size: 22, w: 70.4, fill: "#ff7ad9", m: [1, 0, 0, 1, 125, 352] },
      { text: "RECORDE", size: 15, w: 80.8, fill: "#ffe39a", m: [1, 0, 0, 1, 125, 384] },
      { text: "????", size: 22, w: 53.8, fill: "#fbf5e6", m: [1, 0, 0, 1, 125, 428] },
    ],
  },
  "big-button": {
    view: 260,
    lines: [
      { text: "FIM DA", size: 20, w: 76.9, fill: "#ffc83d", m: [1, 0, 0, 1, 130, 214] },
      { text: "TRANSMISSÃO", size: 14, w: 115.1, fill: "#fbf5e6", m: [1, 0, 0, 1, 130, 234] },
    ],
  },
  "cab-a": {
    view: 170,
    lines: [
      { text: "RUA SEM", size: 16, w: 80.9, fill: "#1d1830", m: [1, 0, 0, 1, 85, 34] },
      { text: "SAÍDA", size: 16, w: 54.4, fill: "#1d1830", m: [1, 0, 0, 1, 85, 52] },
    ],
  },
  "cab-b": {
    view: 170,
    lines: [
      { text: "LABORATÓRIO", size: 15, w: 121.5, fill: "#1d1830", m: [1, 0, 0, 1, 85, 44.7] },
    ],
  },
  "cab-c": {
    view: 170,
    lines: [
      { text: "GUERRA DE", size: 16, w: 104.9, fill: "#1d1830", m: [1, 0, 0, 1, 85, 34] },
      { text: "LANCHE", size: 16, w: 73.8, fill: "#1d1830", m: [1, 0, 0, 1, 85, 52] },
    ],
  },
  "cab-d": {
    view: 186,
    lines: [
      { text: "???", size: 24, w: 44, fill: "#1d1830", m: [1, 0, 0, 1, 93, 56.12] },
      { text: "FORA DE SERVIÇO", size: 13, w: 132.7, fill: "#1d1830", m: [0.98, -0.21, 0.21, 0.98, 94.25, 150.87] },
    ],
  },
  "cab-gold": {
    view: 170,
    lines: [
      { text: "404", size: 24, w: 48, fill: "#1d1830", m: [1, 0, 0, 1, 85, 50] },
      { text: "???", size: 26, w: 47.6, fill: "#ffe39a", m: [1, 0, 0, 1, 85, 128] },
    ],
  },
  "calendar": {
    view: 160,
    lines: [
      { text: "DEZ 2004", size: 20, w: 104.5, fill: "#fbf5e6", m: [1, 0, 0, 1, 80, 42] },
    ],
  },
  "clock": {
    view: 140,
    lines: [
      { text: "4:04", size: 18, w: 42, fill: "#fbf5e6", stroke: "#1d1830", strokeW: 1, m: [1, 0, 0, 1, 70, 186] },
    ],
  },
  "chips": {
    view: 70,
    lines: [
      { text: "BATATA", size: 8, w: 34.1, fill: "#c4352c", m: [1, 0, 0, 1, 35, 54] },
    ],
  },
  "cliff": {
    view: 556,
    lines: [
      { text: "TRANSMISSÃO", size: 14, w: 115.1, fill: "#1d1830", m: [1, 0, 0, 1, 278, 331] },
    ],
  },
  "door-404": {
    view: 200,
    lines: [
      { text: "404", size: 28, w: 56, fill: "#1d1830", m: [1, 0, 0, 1, 100, 100] },
      { text: "NÃO", size: 11, w: 26.9, fill: "#fbf5e6", m: [0.99, 0.14, -0.14, 0.99, 146.66, 223.77] },
      { text: "PERTURBE", size: 8.5, w: 51.4, fill: "#fbf5e6", m: [0.99, 0.14, -0.14, 0.99, 144.16, 241.59] },
    ],
  },
  "claw": {
    view: 200,
    lines: [
      { text: "PEGA-PEGA", size: 22, w: 141.8, fill: "#c94785", m: [1, 0, 0, 1, 100, 48] },
    ],
  },
  "console": {
    view: 916,
    lines: [
      { text: "MESA DE CORTE", size: 16, w: 146.5, fill: "#1d1830", m: [1, 0, 0, 1, 458, 42] },
    ],
  },
  "doormat": {
    view: 320,
    lines: [
      { text: "BEM-VINDO", size: 30, w: 191.6, fill: "#7c4527", m: [1, 0, 0, 1, 160, 66] },
    ],
  },
  "counter": {
    view: 776,
    lines: [
      { text: "RECEPÇÃO", size: 27, w: 165, fill: "#1d1830", m: [1, 0, 0, 1, 388, 147] },
    ],
  },
  "curtain": {
    view: 246,
    lines: [
      { text: "STAFF", size: 20, w: 69.8, fill: "#1d1830", m: [0.99, -0.1, 0.1, 0.99, 123.84, 75.96] },
    ],
  },
  "dish": {
    view: 260,
    lines: [
      { text: "ANTENA 404", size: 14, w: 97.9, fill: "#1d1830", m: [0.98, -0.17, 0.17, 0.98, 130.69, 93.94] },
    ],
  },
  "elevator": {
    view: 260,
    lines: [
      { text: "FORA DE", size: 18, w: 88, fill: "#1d1830", m: [0.99, -0.1, 0.1, 0.99, 130, 190] },
      { text: "SERVIÇO", size: 18, w: 89.7, fill: "#1d1830", m: [0.99, -0.1, 0.1, 0.99, 132.51, 213.87] },
    ],
  },
  "guest-book": {
    view: 124,
    lines: [
      { text: "HÓSPEDES", size: 8, w: 48.4, fill: "#1d1830", m: [1, 0, 0, 1, 55, 20] },
    ],
  },
  "hotel": {
    view: 1150,
    lines: [
      { text: "HOTEL", size: 32, w: 120, fill: "#c4352c", m: [1, 0, 0, 1, 575, 374] },
    ],
  },
  "kiosk": {
    view: 440,
    lines: [
      { text: "QUIOSQUE", size: 23, w: 138, fill: "#1d8a80", m: [1, 0, 0, 1, 220, 74] },
    ],
  },
  "juice-bar": {
    view: 556,
    lines: [
      { text: "SUCOS", size: 28, w: 108.9, fill: "#c4352c", m: [1, 0, 0, 1, 278, 44] },
      { text: "MANGA", size: 13, w: 54, fill: "#ffc83d", m: [1, 0, 0, 1, 122, 167] },
      { text: "ABACAXI", size: 13, w: 54, fill: "#ffe39a", m: [1, 0, 0, 1, 122, 187] },
      { text: "UVA 404", size: 13, w: 54, fill: "#ffa6cf", m: [1, 0, 0, 1, 120, 207] },
    ],
  },
  "key-rack": {
    view: 300,
    lines: [
      { text: "400", size: 13, w: 26, fill: "#fbf5e6", m: [1, 0, 0, 1, 54, 112] },
      { text: "401", size: 13, w: 26, fill: "#fbf5e6", m: [1, 0, 0, 1, 102, 112] },
      { text: "402", size: 13, w: 26, fill: "#fbf5e6", m: [1, 0, 0, 1, 150, 112] },
      { text: "403", size: 13, w: 26, fill: "#fbf5e6", m: [1, 0, 0, 1, 198, 112] },
      { text: "404", size: 13, w: 26, fill: "#fbf5e6", m: [1, 0, 0, 1, 246, 112] },
      { text: "405", size: 13, w: 26, fill: "#fbf5e6", m: [1, 0, 0, 1, 54, 182] },
      { text: "406", size: 13, w: 26, fill: "#fbf5e6", m: [1, 0, 0, 1, 102, 182] },
      { text: "407", size: 13, w: 26, fill: "#fbf5e6", m: [1, 0, 0, 1, 150, 182] },
      { text: "408", size: 13, w: 26, fill: "#fbf5e6", m: [1, 0, 0, 1, 198, 182] },
      { text: "409", size: 13, w: 26, fill: "#fbf5e6", m: [1, 0, 0, 1, 246, 182] },
    ],
  },
  "lobby-banner": {
    view: 600,
    lines: [
      { text: "BEM-VINDOS AO", size: 25, w: 240, align: "right", fill: "#fbf5e6", stroke: "#1d1830", strokeW: 1.5, m: [1, 0, 0, 1, 281, 72] },
      { text: "RESORT CANAL 404!", size: 25, w: 250, align: "left", fill: "#fbf5e6", stroke: "#1d1830", strokeW: 1.5, m: [1, 0, 0, 1, 321, 72] },
    ],
  },
  "neon-sign": {
    view: 720,
    lines: [
      { text: "FLIPERAMA", size: 84, w: 541.4, fill: "none", stroke: "#ff7ad9", strokeW: 6, m: [1, 0, 0, 1, 360, 110] },
      { text: "FLIPERAMA", size: 84, w: 541.4, fill: "none", stroke: "#ffffff", strokeW: 1.5, m: [1, 0, 0, 1, 360, 110] },
    ],
  },
  "poster-pijama": {
    view: 190,
    lines: [
      { text: "GUERRA DO", size: 17, w: 113.3, fill: "#ffe39a", m: [1, 0, 0, 1, 95, 196] },
      { text: "PIJAMA", size: 22, w: 93.5, fill: "#ff7ad9", m: [1, 0, 0, 1, 95, 222] },
    ],
  },
  "prize-counter": {
    view: 456,
    lines: [
      { text: "PRÊMIOS", size: 22, w: 112.4, fill: "#5a4790", m: [1, 0, 0, 1, 228, 202] },
    ],
  },
  "pool": {
    view: 1180,
    lines: [
      { text: "PROIBIDO CORRER", size: 20, w: 209.7, fill: "#c4352c", m: [1, 0, 0, 1, 580, 640] },
    ],
  },
  "poster-summer": {
    view: 190,
    lines: [
      { text: "VERÃO 404", size: 20, w: 124.5, fill: "#fbf5e6", stroke: "#1d1830", strokeW: 1, m: [1, 0, 0, 1, 95, 200] },
      { text: "FESTA NA PISCINA", size: 13, w: 135.4, fill: "#1d1830", m: [1, 0, 0, 1, 95, 224] },
    ],
  },
  "shed": {
    view: 380,
    lines: [
      { text: "DEPÓSITO", size: 22, w: 125.1, fill: "#1d8a80", m: [1, 0, 0, 1, 190, 104] },
    ],
  },
  "statue-404": {
    view: 220,
    lines: [
      { text: "MASCOTE", size: 18, w: 98.5, fill: "#5a5778", m: [1, 0, 0, 1, 110, 278] },
    ],
  },
  "ruin-arch": {
    view: 500,
    lines: [
      { text: "TREM FANTASMA", size: 36, w: 300, fill: "#fbf5e6", m: [0.99, -0.14, 0.14, 0.99, 251.95, 113.86] },
      { text: "404", size: 18, w: 36, fill: "#fbf5e6", m: [0.94, 0.34, -0.34, 0.94, 388.29, 179.7] },
      { text: "INTERDITADO", size: 22, w: 168.4, fill: "#c4352c", m: [1.0, 0.07, -0.07, 1.0, 250.35, 340.01] },
      { text: "DESDE 2004", size: 14, w: 94.1, fill: "#1d1830", m: [1.0, 0.07, -0.07, 1.0, 249.23, 365.97] },
    ],
  },
  "tape-deck": {
    view: 336,
    lines: [
      { text: "REPRISES", size: 16, w: 123.4, fill: "#c4352c", m: [1, 0, 0, 1, 168, 32] },
    ],
  },
  "pinball": {
    view: 256,
    lines: [
      { text: "BUM!", size: 18, w: 51.5, fill: "#1d1830", m: [1, 0, 0, 1, 128, 37] },
    ],
  },
  "ticket-booth": {
    view: 220,
    lines: [
      { text: "BILHETES", size: 13, w: 72.2, fill: "#c4352c", m: [1, 0, 0, 1, 110, 61] },
    ],
  },
  "poster-tilt": {
    view: 190,
    lines: [
      { text: "TILT: CAMPEÃO", size: 16, w: 138.2, fill: "#ff7ad9", m: [1, 0, 0, 1, 95, 200] },
      { text: "TORNEIO 1999", size: 14, w: 113.1, fill: "#fbf5e6", m: [1, 0, 0, 1, 95, 224] },
    ],
  },
  "poster-club": {
    view: 190,
    lines: [
      { text: "404", size: 18, w: 36, fill: "#fbf5e6", m: [1, 0, 0, 1, 95, 104] },
      { text: "CLUBE DO", size: 18, w: 102.5, fill: "#ffc83d", m: [1, 0, 0, 1, 95, 200] },
      { text: "404 — 1998", size: 16, w: 101.4, fill: "#fbf5e6", m: [1, 0, 0, 1, 95, 224] },
    ],
  },
  "poster-surf": {
    view: 190,
    lines: [
      { text: "SURFE 404", size: 20, w: 121.1, fill: "#fbf5e6", stroke: "#1d1830", strokeW: 1, m: [1, 0, 0, 1, 95, 200] },
      { text: "ONDA AO VIVO", size: 13, w: 106.4, fill: "#1d1830", m: [1, 0, 0, 1, 95, 224] },
    ],
  },
  "records": {
    view: 320,
    lines: [
      { text: "RECORDES", size: 32, w: 195.5, fill: "none", stroke: "#ff7ad9", strokeW: 3, m: [1, 0, 0, 1, 160, 54] },
    ],
  },
  "poster-ghost": {
    view: 190,
    lines: [
      { text: "TREM FANTASMA", size: 15, w: 143.4, fill: "#fbf5e6", m: [1, 0, 0, 1, 95, 200] },
      { text: "VOLTA EM 2005", size: 14, w: 120.8, fill: "#ffc83d", m: [1, 0, 0, 1, 95, 224] },
    ],
  },
  "signpost": {
    view: 200,
    lines: [
      { text: "PRAIA", size: 26, w: 89.6, fill: "#7c4527", m: [1, 0, 0, 1, 98, 86] },
      { text: "FLORESTA", size: 22, w: 127.7, fill: "#2f6e35", m: [1, 0, 0, 1, 102, 154] },
      { text: "↑ HOTEL", size: 15, w: 68.8, fill: "#c4352c", m: [1, 0, 0, 1, 100, 215] },
    ],
  },
  "wave-sign": {
    view: 140,
    lines: [
      { text: "ONDAS", size: 22, w: 85.8, fill: "#2f86c9", m: [1, 0, 0, 1, 70, 44] },
      { text: "TODO DIA", size: 14, w: 75.7, fill: "#1d1830", m: [1, 0, 0, 1, 70, 70] },
      { text: "ÀS 4:04", size: 18, w: 75, fill: "#c4352c", m: [1, 0, 0, 1, 70, 90] },
    ],
  },
};

export function paintSigns(scene: Phaser.Scene, font: string) {
  for (const [key, sign] of Object.entries(SIGNS)) {
    if (!scene.textures.exists(key)) continue;
    const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const canvas = document.createElement("canvas");
    canvas.width = src.width;
    canvas.height = src.height;
    const c = canvas.getContext("2d");
    if (!c) continue;
    c.drawImage(src, 0, 0);
    const k = src.width / sign.view;
    c.textBaseline = "alphabetic";
    c.lineJoin = "round";
    for (const line of sign.lines) {
      c.font = `700 ${line.size * GROW}px ${font}`;
      c.textAlign = line.align ?? "center";
      const fit = Math.min(1, line.w / c.measureText(line.text).width);
      const [a, b, cc, d, e, f] = line.m;
      c.setTransform(k * a, k * b, k * cc, k * d, k * e, k * f);
      c.scale(fit, Math.min(1, fit / SQUEEZE));
      if (line.stroke) {
        c.strokeStyle = line.stroke;
        c.lineWidth = (line.strokeW ?? 1) * (line.fill === "none" ? 1 : 2.4);
        c.strokeText(line.text, 0, 0);
      }
      if (line.fill !== "none") {
        c.fillStyle = line.fill;
        c.fillText(line.text, 0, 0);
      }
    }
    scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
  }
}
