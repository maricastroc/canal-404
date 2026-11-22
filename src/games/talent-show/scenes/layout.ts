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
      jury: { xs: [190, 540, 890], y: 420, scale: 1 },
      host: { x: 170, y: 720, scale: 0.95 },
      band: { xs: [360, 560, 760, 950], y: 980, scale: 1 },
      strip: { x: 24, y: 1150, w: W - 48, h: 240, hitX: 200, pxPerBeat: 250 },
      panel: { x: 50, y: 530, w: W - 100, h: 600 },
      hint: { x: W / 2, y: 1520, size: 34 },
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
    jury: { xs: [1340, 1565, 1790], y: 300, scale: 0.95 },
    host: { x: 190, y: 430, scale: 1 },
    band: { xs: [520, 730, 940, 1150], y: 690, scale: 1 },
    strip: { x: 48, y: 790, w: W - 96, h: 210, hitX: 330, pxPerBeat: 340 },
    panel: { x: 330, y: 120, w: 900, h: 620 },
    hint: { x: W / 2, y: 1045, size: 28 },
    text: { mark: 50, label: 24, bubble: 32, panelTitle: 60, panelBody: 32 },
  };
}
