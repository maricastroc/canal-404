import { P } from "@/lib/palette";

export type Pt = { x: number; y: number };

export const castInk = { stroke: P.ink, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export function RaisedArm({ from, to, bend, skin, shirt }: { from: Pt; to: Pt; bend: number; skin: string; shirt: string }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const via = { x: (from.x + to.x) / 2 - (dy / len) * bend, y: (from.y + to.y) / 2 + (dx / len) * bend };
  const d = `M${from.x} ${from.y} Q${via.x.toFixed(1)} ${via.y.toFixed(1)} ${to.x} ${to.y}`;
  const cuff = { x: from.x + dx * 0.3, y: from.y + dy * 0.3 };
  const sleeve = `M${from.x} ${from.y} L${cuff.x.toFixed(1)} ${cuff.y.toFixed(1)}`;
  return (
    <g>
      <path d={d} fill="none" stroke={P.ink} strokeWidth={11} strokeLinecap="round" />
      <path d={d} fill="none" stroke={skin} strokeWidth={6} strokeLinecap="round" />
      <path d={sleeve} fill="none" stroke={P.ink} strokeWidth={15} strokeLinecap="round" />
      <path d={sleeve} fill="none" stroke={shirt} strokeWidth={10} strokeLinecap="round" />
    </g>
  );
}

export function Fist({ at, skin, line = 2.2 }: { at: Pt; skin: string; line?: number }) {
  return (
    <g>
      <circle cx={at.x} cy={at.y} r={6.6} fill={skin} {...castInk} strokeWidth={line} />
      <path d={`M${at.x - 3.4} ${at.y - 1.8} L${at.x + 2.8} ${at.y - 1.8} M${at.x - 3.4} ${at.y + 1.8} L${at.x + 2.8} ${at.y + 1.8}`} {...castInk} strokeWidth={1.3} />
    </g>
  );
}

export function Mitten({ x, y, skin, line = 2.2 }: { x: number; y: number; skin: string; line?: number }) {
  return (
    <g {...castInk}>
      <path d={`M${x - 9} ${y + 4.4} Q${x - 10.2} ${y - 8} ${x} ${y - 8.6} Q${x + 10.2} ${y - 8} ${x + 9} ${y + 4.4} Q${x} ${y + 7.8} ${x - 9} ${y + 4.4} Z`} fill={skin} strokeWidth={line} />
      <path d={`M${x - 3} ${y - 0.6} L${x - 3} ${y + 4.6} M${x + 3} ${y - 0.6} L${x + 3} ${y + 4.6}`} strokeWidth={1.2} />
    </g>
  );
}
