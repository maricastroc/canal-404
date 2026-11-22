export type Orientation = "landscape" | "portrait";

export const CANVAS: Record<Orientation, { W: number; H: number }> = {
  landscape: { W: 1920, H: 1080 },
  portrait: { W: 1080, H: 1650 },
};

export type Box = { x: number; y: number; w: number; h: number };

export type Layout = {
  W: number;
  H: number;
  title: { x: number; y: number; size: number };
  live: { x: number; y: number; size: number };
  meter: Box;
  jury: { xs: number[]; y: number; scale: number };
  host: { x: number; y: number; scale: number };
  band: { xs: number[]; y: number; scale: number };
  stage: { top: number; front: number };
  sign: { cx: number; cy: number; w: number; h: number };
  lamps: { y: number; xs: number[] };
  crowd: { y: number; scale: number; count: number; gap: number }[];
  strip: Box & { hitX: number; pxPerBeat: number };
  panel: Box;
  hint: { x: number; y: number; size: number };
  text: { mark: number; label: number; bubble: number; panelTitle: number; panelBody: number };
};

export function layoutFor(orientation: Orientation): Layout {
  if (orientation === "portrait") {
    const { W, H } = CANVAS.portrait;
    return {
      W,
      H,
      title: { x: 40, y: 64, size: 44 },
      live: { x: W - 40, y: 64, size: 34 },
      meter: { x: 220, y: 140, w: 800, h: 40 },
      jury: { xs: [190, 540, 890], y: 520, scale: 0.85 },
      host: { x: 150, y: 990, scale: 0.78 },
      band: { xs: [370, 560, 750, 935], y: 990, scale: 0.6 },
      stage: { top: 960, front: 1060 },
      sign: { cx: 650, cy: 700, w: 320, h: 130 },
      lamps: { y: 214, xs: [100, 980] },
      crowd: [
        { y: 1178, scale: 0.78, count: 9, gap: 118 },
        { y: 1300, scale: 1, count: 8, gap: 136 },
      ],
      strip: { x: 24, y: 1290, w: W - 48, h: 230, hitX: 200, pxPerBeat: 250 },
      panel: { x: 50, y: 530, w: W - 100, h: 600 },
      hint: { x: W / 2, y: 1590, size: 34 },
      text: { mark: 54, label: 26, bubble: 34, panelTitle: 62, panelBody: 36 },
    };
  }
  const { W, H } = CANVAS.landscape;
  return {
    W,
    H,
    title: { x: 56, y: 56, size: 46 },
    live: { x: W - 56, y: 56, size: 34 },
    meter: { x: 760, y: 36, w: 440, h: 40 },
    jury: { xs: [1350, 1570, 1790], y: 400, scale: 0.85 },
    host: { x: 210, y: 690, scale: 0.92 },
    band: { xs: [520, 735, 950, 1165], y: 690, scale: 0.66 },
    stage: { top: 670, front: 760 },
    sign: { cx: 840, cy: 250, w: 430, h: 190 },
    lamps: { y: 108, xs: [300, 520, 1180, 1420, 1640] },
    crowd: [{ y: 826, scale: 0.82, count: 16, gap: 118 }],
    strip: { x: 48, y: 790, w: W - 96, h: 210, hitX: 330, pxPerBeat: 340 },
    panel: { x: 330, y: 120, w: 900, h: 620 },
    hint: { x: W / 2, y: 1045, size: 28 },
    text: { mark: 50, label: 24, bubble: 32, panelTitle: 60, panelBody: 32 },
  };
}
