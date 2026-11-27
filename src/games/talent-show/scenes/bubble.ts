export type Rect = { x0: number; y0: number; x1: number; y1: number };
export type BubbleFit = { x: number; top: number; raise: number; hit: number };

const SHIFT = 12;
const RAISE = 6;
export const BUBBLE_TAIL = 22;
const HEAD_GAP = 8;

function overlap(a: Rect, b: Rect) {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
}

export function tipOf(x: number, w: number, speaker: Rect, round: number) {
  const cx = (speaker.x0 + speaker.x1) / 2;
  return Math.max(round, Math.min(w - round, cx - x));
}

export function fitAbove(w: number, h: number, speaker: Rect, obstacles: Rect[], area: Rect, round: number): BubbleFit {
  const cx = (speaker.x0 + speaker.x1) / 2;
  const lowest = speaker.y0 - HEAD_GAP - BUBBLE_TAIL - h;
  const minX = Math.max(area.x0, cx - w + round);
  const maxX = Math.max(minX, Math.min(area.x1 - w, cx - round));
  const center = Math.max(minX, Math.min(maxX, cx - w / 2));
  const xs = [center];
  for (let d = SHIFT; center - d >= minX || center + d <= maxX; d += SHIFT) {
    if (center - d >= minX) xs.push(center - d);
    if (center + d <= maxX) xs.push(center + d);
  }
  let best: BubbleFit = { x: center, top: lowest, raise: 0, hit: Infinity };
  for (let top = lowest; ; top -= RAISE) {
    for (const x of xs) {
      const tip = x + tipOf(x, w, speaker, round);
      const body = { x0: x, y0: top, x1: x + w + 4, y1: top + h + 5 };
      const tail = { x0: tip - 14, y0: top + h, x1: tip + 14, y1: top + h + BUBBLE_TAIL };
      const hit = obstacles.reduce((sum, o) => sum + overlap(body, o) + overlap(tail, o), 0);
      if (hit === 0) return { x, top, raise: lowest - top, hit };
      if (hit < best.hit) best = { x, top, raise: lowest - top, hit };
    }
    if (top - RAISE < area.y0) return best;
  }
}
