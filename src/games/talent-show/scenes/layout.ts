export type Orientation = "landscape" | "portrait";

export const CANVAS: Record<Orientation, { W: number; H: number }> = {
  landscape: { W: 1920, H: 1080 },
  portrait: { W: 1080, H: 1650 },
};

export type Box = { x: number; y: number; w: number; h: number };
export type Spot = { x: number; y: number; scale: number };

export type Layout = {
  W: number;
  H: number;
  title: { x: number; y: number; size: number };
  live: { x: number; y: number; size: number };
  valance: number;
  truss: { y: number; xs: number[] } | null;
  spots: { x: number; y: number }[];
  sign: { cx: number; cy: number; w: number; h: number } | null;
  riser: { x0: number; x1: number; top: number; front: number; tall: boolean };
  stage: { top: number; front: number };
  jury: { xs: number[]; deskTop: number; deskBottom: number; x0: number; x1: number; scale: number };
  host: Spot;
  performer: Spot & { podium: number };
  backline: { xs: number[]; y: number; scale: number };
  nameTag: { y: number };
  crowd: { y: number; scale: number; count: number; gap: number }[];
  lane: { housing: Box; track: Box; hitX: number; pxPerBeat: number; r: number; popupX: number };
  meter: Box;
  streak: { x: number; y: number };
  progress: Box;
  card: { cx: number; top: number; w: number; maxH: number };
  text: { mark: number; label: number; bubble: number; cardTitle: number; cardBody: number; cardSmall: number; tag: number };
};

export const DESK_LIP = 34;

export function layoutFor(orientation: Orientation): Layout {
  if (orientation === "portrait") {
    const { W, H } = CANVAS.portrait;
    const housing = { x: 20, y: 968, w: W - 40, h: 330 };
    const track = { x: housing.x + 18, y: housing.y + 18, w: housing.w - 36, h: housing.h - 36 };
    return {
      W,
      H,
      title: { x: 40, y: 92, size: 44 },
      live: { x: W - 40, y: 92, size: 30 },
      valance: 52,
      truss: null,
      spots: [
        { x: 60, y: 150 },
        { x: W - 60, y: 150 },
      ],
      sign: null,
      riser: { x0: 96, x1: W - 96, top: 560, front: 846, tall: true },
      stage: { top: 846, front: 946 },
      jury: { xs: [272, 540, 808], deskTop: 436, deskBottom: 556, x0: 128, x1: W - 128, scale: 0.84 },
      host: { x: 104, y: 932, scale: 0.6 },
      performer: { x: 560, y: 918, scale: 0.72, podium: 132 },
      backline: { xs: [300, 420, 712, 840], y: 876, scale: 0.44 },
      nameTag: { y: 950 },
      crowd: [
        { y: 1480, scale: 1, count: 9, gap: 122 },
        { y: 1610, scale: 1.12, count: 8, gap: 140 },
        { y: 1736, scale: 1.26, count: 7, gap: 160 },
      ],
      lane: { housing, track, hitX: 196, pxPerBeat: 272, r: 56, popupX: 316 },
      meter: { x: W - 470, y: housing.y + housing.h - 18, w: 430, h: 42 },
      streak: { x: 44, y: housing.y + housing.h },
      progress: { x: track.x + 40, y: track.y + track.h - 20, w: track.w - 80, h: 10 },
      card: { cx: W / 2, top: 196, w: W - 56, maxH: 712 },
      text: { mark: 58, label: 28, bubble: 36, cardTitle: 64, cardBody: 33, cardSmall: 28, tag: 30 },
    };
  }
  const { W, H } = CANVAS.landscape;
  const housing = { x: 28, y: 734, w: W - 56, h: 244 };
  const track = { x: housing.x + 18, y: housing.y + 18, w: housing.w - 36, h: housing.h - 36 };
  return {
    W,
    H,
    title: { x: 56, y: 74, size: 46 },
    live: { x: W - 56, y: 74, size: 30 },
    valance: 44,
    truss: { y: 134, xs: [330, 560, 990, 1380, 1560, 1740] },
    spots: [
      { x: 560, y: 196 },
      { x: 990, y: 196 },
    ],
    sign: { cx: 775, cy: 246, w: 360, h: 124 },
    riser: { x0: 352, x1: 1836, top: 544, front: 626, tall: false },
    stage: { top: 626, front: 718 },
    jury: { xs: [1366, 1544, 1722], deskTop: 406, deskBottom: 540, x0: 1262, x1: 1824, scale: 0.72 },
    host: { x: 168, y: 702, scale: 0.9 },
    performer: { x: 775, y: 694, scale: 0.84, podium: 168 },
    backline: { xs: [468, 610, 940, 1082], y: 540, scale: 0.46 },
    nameTag: { y: 722 },
    crowd: [{ y: 1104, scale: 0.88, count: 17, gap: 114 }],
    lane: { housing, track, hitX: 300, pxPerBeat: 340, r: 46, popupX: 400 },
    meter: { x: W - 500, y: housing.y - 22, w: 440, h: 42 },
    streak: { x: 52, y: housing.y },
    progress: { x: track.x + 40, y: track.y + track.h - 18, w: track.w - 80, h: 10 },
    card: { cx: W / 2, top: 112, w: 1000, maxH: 600 },
    text: { mark: 54, label: 26, bubble: 34, cardTitle: 64, cardBody: 31, cardSmall: 25, tag: 28 },
  };
}
