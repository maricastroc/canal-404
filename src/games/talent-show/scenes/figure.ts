export const FIGURE = { x: -80, y: 0, w: 360, h: 470, headW: 200, headH: 222 };

export const FEET = 458;

export const HOST_BOX = { x: -24, y: -8, w: 248, h: 304, feet: 292 };

export type Point = readonly [number, number];
export type ArmStroke = { from: Point; via: Point; to: Point; color: number; width: number };
export type PaddleHold = { fist: Point; arm: readonly ArmStroke[]; skin: number | null; front: boolean };
export type JuryArt = { w: number; h: number; crop: number; scale: number; originX: number; badge: Point; hold: PaddleHold };

export const JURY_ART = {
  arlindo: { w: 150, h: 140, crop: 140, scale: 1.2, originX: 0.48, badge: [136, 2], hold: { fist: [136, 48], arm: [], skin: null, front: false } },
  lunch: {
    w: 220,
    h: 476,
    crop: 250,
    scale: 0.92,
    originX: 0.5,
    badge: [26, 64],
    hold: {
      fist: [182, 100],
      arm: [
        { from: [178, 194], via: [196, 150], to: [182, 112], color: 0xf6dcc4, width: 12 },
        { from: [160, 230], via: [174, 214], to: [178, 192], color: 0x63d6c1, width: 16 },
      ],
      skin: 0xf6dcc4,
      front: true,
    },
  },
  inspector: {
    w: 380,
    h: 476,
    crop: 290,
    scale: 0.78,
    originX: 0.45,
    badge: [64, 64],
    hold: { fist: [62, 132], arm: [{ from: [106, 222], via: [46, 206], to: [60, 150], color: 0x6d6390, width: 19 }], skin: 0xf2c9a6, front: false },
  },
} as const satisfies Record<string, JuryArt>;

export const AMP = { w: 160, h: 232, jack: [22, 150], cone: { x: 80, y: 104, size: 72 } } as const;

export const CROWD_SIGN = { w: 120, h: 210 } as const;
