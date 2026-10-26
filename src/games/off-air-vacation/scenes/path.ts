const CELL = 20;
const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

type Blocked = (x: number, y: number) => boolean;

function clear(blocked: Blocked, ax: number, ay: number, bx: number, by: number) {
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 8);
  for (let i = 1; i <= n; i += 1) {
    const x = ax + ((bx - ax) * i) / n;
    const y = ay + ((by - ay) * i) / n;
    if (blocked(x, y) || blocked(x + 4, y + 4) || blocked(x - 4, y - 4) || blocked(x + 4, y - 4) || blocked(x - 4, y + 4)) return false;
  }
  return true;
}

export function findPath(blocked: Blocked, w: number, h: number, sx: number, sy: number, tx: number, ty: number): [number, number][] {
  if (clear(blocked, sx, sy, tx, ty)) return [[tx, ty]];
  const cols = Math.ceil(w / CELL) + 1;
  const rows = Math.ceil(h / CELL) + 1;
  const free = new Int8Array(cols * rows).fill(-1);
  const isFree = (c: number, r: number) => {
    if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
    const i = r * cols + c;
    if (free[i] === -1) free[i] = blocked(c * CELL, r * CELL) ? 0 : 1;
    return free[i] === 1;
  };
  let sc = Math.round(sx / CELL);
  let sr = Math.round(sy / CELL);
  if (!isFree(sc, sr)) {
    let best: [number, number, number] | null = null;
    for (let dr = -3; dr <= 3; dr += 1)
      for (let dc = -3; dc <= 3; dc += 1) {
        const d = Math.hypot(dc, dr);
        if (isFree(sc + dc, sr + dr) && (!best || d < best[2])) best = [sc + dc, sr + dr, d];
      }
    if (!best) return [[tx, ty]];
    sc = best[0];
    sr = best[1];
  }
  const prev = new Int32Array(cols * rows).fill(-2);
  const start = sr * cols + sc;
  prev[start] = -1;
  const queue = [start];
  let bestI = start;
  let bestD = Math.hypot(sc * CELL - tx, sr * CELL - ty);
  for (let head = 0; head < queue.length && head < 40000; head += 1) {
    const i = queue[head];
    const c = i % cols;
    const r = Math.floor(i / cols);
    const d = Math.hypot(c * CELL - tx, r * CELL - ty);
    if (d < bestD) {
      bestD = d;
      bestI = i;
    }
    if (d < CELL) break;
    for (const [dc, dr] of DIRS) {
      const nc = c + dc;
      const nr = r + dr;
      if (!isFree(nc, nr)) continue;
      if (dc && dr && (!isFree(c + dc, r) || !isFree(c, r + dr))) continue;
      const ni = nr * cols + nc;
      if (prev[ni] !== -2) continue;
      prev[ni] = i;
      queue.push(ni);
    }
  }
  const cells: [number, number][] = [];
  for (let i = bestI; i !== -1; i = prev[i]) cells.push([(i % cols) * CELL, Math.floor(i / cols) * CELL]);
  cells.reverse();
  if (bestD < CELL && !blocked(tx, ty)) cells.push([tx, ty]);
  const out: [number, number][] = [];
  let ax = sx;
  let ay = sy;
  let k = 0;
  while (k < cells.length - 1) {
    let j = cells.length - 1;
    while (j > k + 1 && !clear(blocked, ax, ay, cells[j][0], cells[j][1])) j -= 1;
    out.push(cells[j]);
    [ax, ay] = cells[j];
    k = j;
  }
  if (!out.length && cells.length) out.push(cells[cells.length - 1]);
  return out;
}
