import { LinaHead, type Face } from "@/components/characters/Heads";
import { P } from "@/lib/palette";

const display = { fontFamily: "var(--font-luckiest)" };
const handFont = { fontFamily: "var(--font-patrick), 'Comic Sans MS', sans-serif" };
const ink = { stroke: P.ink, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

type Pt = { x: number; y: number };

const LINE = { fg: 2, mid: 1.7, bg: 1.3, detail: 1.1 };
const C = {
  wall: "#c5bce3",
  wallLow: "#b6acdc",
  plank: "#b3a8d8",
  floor: "#5d4d98",
  floorLine: "#4b3c84",
  glass: "#8fd4f7",
  gold: "#e0a21f",
  goldLight: "#fff3c4",
  cat: "#2a2342",
  catSoft: "#453a66",
  shelf: "#f2d7ad",
  bracket: "#8d98ab",
  bolt: "#c9d2de",
  board: "#e2b07a",
};

const FLOOR = 98;
const PIPE_MOUTH: Pt = { x: 31, y: 27 };
const SHELF_A = { from: { x: 20, y: 37 }, to: { x: 64, y: 41 } };
const SHELF_B = { from: { x: 114, y: 70 }, to: { x: 154, y: 73.5 } };
const AREA = { x: 66, y: 28, w: 46, h: 66 };
const RAMP = { x: 89, y: 58, len: 38, angle: 30 };
const BELL = { x: 171, top: 66, s: 0.22 };
const TRAY = { x: 60, y: 104, w: 90, h: 22 };
const SLOT = { x: 63, y: 107, w: 29, h: 16 };
const RUN = { x: 111, y: 107, w: 36, h: 16 };
const MARBLE_R = 3.4;

function Outline() {
  return (
    <defs>
      <filter id="lab-outline" x="-15%" y="-15%" width="130%" height="130%">
        <feMorphology in="SourceAlpha" operator="dilate" radius={0.8} result="grown" />
        <feFlood floodColor={P.ink} />
        <feComposite in2="grown" operator="in" result="edge" />
        <feMerge>
          <feMergeNode in="edge" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function Pegboard() {
  const holes = [];
  for (let x = 122; x <= 164; x += 7) for (let y = 13; y <= 37; y += 6) holes.push({ x, y });
  return (
    <g>
      <rect x={116} y={8} width={54} height={34} rx={2} fill={C.board} {...ink} strokeWidth={LINE.bg} />
      {holes.map((h) => (
        <circle key={`${h.x}-${h.y}`} cx={h.x} cy={h.y} r={0.7} fill={P.woodDeep} opacity={0.45} />
      ))}
      <g {...ink} strokeWidth={LINE.detail}>
        <rect x={124.5} y={13} width={4} height={4} rx={0.8} fill={C.bracket} />
        <path d="M126.5 17 L126.5 34" stroke={P.ink} strokeWidth={2.8} />
        <path d="M126.5 17 L126.5 34" stroke={P.wood} strokeWidth={1.2} />
        <path d="M137 12 L137 25" stroke={P.ink} strokeWidth={1.2} />
        <rect x={135.4} y={24} width={3.2} height={10} rx={1.2} fill={P.sun} />
        <circle cx={155} cy={22} r={5} fill="none" stroke={P.bubblegum} strokeWidth={1.4} />
        <circle cx={155} cy={22} r={5} fill="none" stroke={P.ink} strokeWidth={0.6} opacity={0.6} />
      </g>
    </g>
  );
}

function Backdrop() {
  return (
    <g>
      <rect width="200" height="130" fill={C.wall} />
      {[14, 34, 54, 74, 94, 114, 134, 154, 174, 194].map((x) => (
        <path key={x} d={`M${x} 0 L${x} 72`} stroke={C.plank} strokeWidth={0.9} />
      ))}
      <rect y={72} width={200} height={FLOOR - 72} fill={C.wallLow} />
      {[24, 54, 84, 114, 144, 174].map((x) => (
        <path key={x} d={`M${x} 74 L${x} ${FLOOR}`} stroke={C.plank} strokeWidth={0.9} />
      ))}
      <path d="M0 72 L200 72" stroke={P.paper} strokeWidth={1.6} />
      <path d="M0 73.4 L200 73.4" stroke={C.plank} strokeWidth={0.8} />
      <Pegboard />
      <g transform="translate(52 15)">
        <path d="M0 -7 L7 0 L0 7 L-7 0 Z" fill={P.sun} {...ink} strokeWidth={LINE.bg} />
        <path d="M0 -3.4 L0 0.8" stroke={P.ink} strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={0} cy={3} r={0.8} fill={P.ink} />
      </g>
      <rect y={FLOOR} width={200} height={130 - FLOOR} fill={C.floor} />
      <path d={`M0 ${FLOOR} L200 ${FLOOR}`} stroke={P.ink} strokeWidth={LINE.mid} />
      <path d="M-10 130 L14 104 M40 130 L58 104 M150 130 L164 104 M196 130 L206 104" stroke={C.floorLine} strokeWidth={1.2} />
    </g>
  );
}

function Pipe() {
  const d = `M14 -4 L14 15 Q14 ${PIPE_MOUTH.y} 25 ${PIPE_MOUTH.y} L${PIPE_MOUTH.x - 2} ${PIPE_MOUTH.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke={P.ink} strokeWidth={11} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={P.mint} strokeWidth={8} strokeLinejoin="round" />
      <path d={`M11.6 -4 L11.6 15 Q12 23.6 19 24.6`} fill="none" stroke={P.screen} strokeWidth={1.4} strokeLinecap="round" />
      <rect x={8} y={4} width={12} height={4} rx={1} fill={P.mintDeep} {...ink} strokeWidth={LINE.detail} />
      <rect x={PIPE_MOUTH.x - 4.5} y={PIPE_MOUTH.y - 5.6} width={4} height={11.2} rx={1.2} fill={P.mintDeep} {...ink} strokeWidth={LINE.detail} />
      <ellipse cx={PIPE_MOUTH.x - 0.2} cy={PIPE_MOUTH.y} rx={1.1} ry={4.2} fill={P.ink} />
    </g>
  );
}

function Shelf({ from, to }: { from: Pt; to: Pt }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const deg = Math.round((Math.atan2(dy, dx) * 1800) / Math.PI) / 10;
  return (
    <g transform={`translate(${from.x} ${from.y}) rotate(${deg})`}>
      <g {...ink} strokeWidth={LINE.detail}>
        <path d={`M5 3.2 L13 3.2 L5 10 Z`} fill={C.bracket} />
        <path d={`M${len - 13} 3.2 L${len - 5} 3.2 L${len - 5} 10 Z`} fill={C.bracket} />
      </g>
      <rect x={0} y={0} width={len} height={3.6} rx={1.2} fill={C.shelf} {...ink} strokeWidth={LINE.mid} />
      <path d={`M2 1.1 L${len - 2} 1.1`} stroke={P.white} strokeWidth={0.8} strokeLinecap="round" />
    </g>
  );
}

function BuildArea({ lit = false }: { lit?: boolean }) {
  return (
    <g>
      <rect x={AREA.x} y={AREA.y} width={AREA.w} height={AREA.h} rx={3.5} fill={P.white} opacity={lit ? 0.3 : 0.16} />
      <rect x={AREA.x} y={AREA.y} width={AREA.w} height={AREA.h} rx={3.5} fill="none" stroke={P.paper} strokeWidth={1.3} strokeDasharray="4 2.8" strokeLinecap="round" />
      <text x={AREA.x + 2.6} y={AREA.y + 6.4} fontSize={5.6} fill={P.paper} stroke={P.ink} strokeWidth={1.4} paintOrder="stroke" strokeLinejoin="round" style={handFont}>
        monte aqui
      </text>
    </g>
  );
}

type Look = "idle" | "valid" | "selected";

function Ramp({ x, y, len, angle, look = "idle", lifted = false, ghost = false }: { x: number; y: number; len: number; angle: number; look?: Look; lifted?: boolean; ghost?: boolean }) {
  const h = 5;
  const half = len / 2;
  const ring = look === "valid" ? P.mint : P.sun;
  const ticks = Array.from({ length: Math.floor(len / 7) }, (_, i) => -half + 7 + i * 7);
  if (ghost) {
    return (
      <g transform={`translate(${x} ${y}) rotate(${angle})`}>
        <rect x={-half} y={-h / 2} width={len} height={h} rx={2.2} fill={P.white} opacity={0.35} stroke={P.ink} strokeWidth={0.9} strokeDasharray="2 2" />
      </g>
    );
  }
  return (
    <g>
      {lifted && (
        <g transform={`translate(${x + 2} ${y + 6}) rotate(${angle})`}>
          <rect x={-half} y={-h / 2} width={len} height={h} rx={2.2} fill={P.ink} opacity={0.16} />
        </g>
      )}
      <g transform={`translate(${x} ${y}) rotate(${angle})`}>
        {look !== "idle" && (
          <g fill="none">
            <rect x={-half - 2.6} y={-h / 2 - 2.6} width={len + 5.2} height={h + 5.2} rx={4.4} stroke={P.ink} strokeWidth={3} opacity={0.55} />
            <rect x={-half - 2.6} y={-h / 2 - 2.6} width={len + 5.2} height={h + 5.2} rx={4.4} stroke={ring} strokeWidth={1.6} />
          </g>
        )}
        <rect x={-half} y={-h / 2} width={len} height={h} rx={2.2} fill={P.sun} {...ink} strokeWidth={LINE.mid} />
        <path d={`M${-half + 2} -0.9 L${half - 2} -0.9`} stroke={C.goldLight} strokeWidth={0.8} strokeLinecap="round" />
        <path d={ticks.map((t) => `M${t + 1.4} ${-h / 2 + 0.6} L${t - 1.4} ${h / 2 - 0.6}`).join(" ")} stroke={C.gold} strokeWidth={1.2} strokeLinecap="round" />
        <circle cx={-half + 2.6} cy={0} r={1} fill={P.steel} {...ink} strokeWidth={0.6} />
        <circle cx={half - 2.6} cy={0} r={1} fill={P.steel} {...ink} strokeWidth={0.6} />
      </g>
    </g>
  );
}

function Marble({ x, y, r = MARBLE_R, faded = false }: Pt & { r?: number; faded?: boolean }) {
  const k = r / 19.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${k}) translate(-22 -22)`} opacity={faded ? 0.4 : 1}>
      <circle cx="22" cy="22" r="19.5" fill={C.glass} {...ink} strokeWidth={LINE.mid / k} />
      <path d="M10 26 Q16 12 30 16 Q22 22 26 34 Q14 34 10 26 Z" fill={P.bubblegum} />
      <circle cx="14" cy="13" r="4.4" fill="#ffffff" />
    </g>
  );
}

function Bell({ ringing = false }: { ringing?: boolean }) {
  const { x, top, s } = BELL;
  const w = LINE.mid / s;
  const base = top + 88 * s;
  return (
    <g>
      <ellipse cx={x} cy={FLOOR + 0.6} rx={9} ry={1.8} fill={P.ink} opacity={0.22} />
      <path d={`M${x} ${base} L${x} ${FLOOR - 1.5}`} stroke={P.ink} strokeWidth={3.6} strokeLinecap="round" />
      <path d={`M${x} ${base} L${x} ${FLOOR - 1.5}`} stroke={P.steel} strokeWidth={1.8} strokeLinecap="round" />
      <ellipse cx={x} cy={FLOOR - 1.2} rx={6} ry={1.8} fill={P.plum500} {...ink} strokeWidth={LINE.detail} />
      <g transform={`rotate(${ringing ? -16 : 0} ${x} ${top + 12 * s})`}>
        <g transform={`translate(${x - 50 * s} ${top}) scale(${s})`} {...ink}>
          <circle cx="50" cy="12" r="8" fill="none" strokeWidth={w} />
          <path d="M18 78 Q20 30 50 24 Q80 30 82 78 Q88 82 88 88 L12 88 Q12 82 18 78 Z" fill={P.sun} strokeWidth={w} />
          <path d="M30 70 Q30 40 46 34" fill="none" stroke={C.goldLight} strokeWidth={w * 0.9} />
          <path d="M18 78 L82 78" stroke={C.gold} strokeWidth={w * 0.8} />
          <circle cx="50" cy="92" r="7" fill={C.gold} strokeWidth={w * 0.8} />
        </g>
      </g>
    </g>
  );
}

function CatAsleep() {
  const s = 0.14;
  return (
    <g>
      <ellipse cx={191} cy={FLOOR + 0.4} rx={9} ry={1.6} fill={P.ink} opacity={0.22} />
      <g transform={`translate(${182} ${FLOOR - 64 * s}) scale(${s})`} {...ink} strokeWidth={LINE.mid / s}>
        <path d="M96 56 Q122 58 124 40 Q125 30 116 28" fill="none" strokeWidth={13} />
        <path d="M96 56 Q122 58 124 40 Q125 30 116 28" fill="none" stroke={C.cat} strokeWidth={5} />
        <path d="M18 60 Q10 34 44 26 Q84 18 104 36 Q116 50 100 62 Z" fill={C.cat} />
        <path d="M40 30 Q60 24 80 28" fill="none" stroke={C.catSoft} strokeWidth={5} />
        <path d="M4 58 Q0 40 14 32 L14 16 L26 28 Q34 26 42 30 L52 18 L52 36 Q58 48 50 60 Z" fill={C.cat} />
        <path d="M18 22 L19 30 M48 24 L46 32" stroke={P.bubblegum} strokeWidth={3.5} />
        <path d="M16 44 Q20 47 24 44 M34 44 Q38 47 42 44" fill="none" stroke={P.cream} strokeWidth={3} />
      </g>
      <text x={190} y={86} fontSize={6} fill={P.white} stroke={P.ink} strokeWidth={1.6} paintOrder="stroke" strokeLinejoin="round" style={display}>
        z
      </text>
      <text x={195} y={80.6} fontSize={4.6} fill={P.white} stroke={P.ink} strokeWidth={1.4} paintOrder="stroke" strokeLinejoin="round" style={display}>
        z
      </text>
    </g>
  );
}

function CatAwake() {
  const s = 0.15;
  return (
    <g>
      <ellipse cx={192} cy={FLOOR + 0.4} rx={7} ry={1.3} fill={P.ink} opacity={0.16} />
      <path d="M185 93.6 L186 97 M192 94 L192 97.6 M198.6 93.6 L198 97" stroke={P.ink} strokeWidth={1} strokeLinecap="round" />
      <g transform={`translate(${184} ${76}) rotate(-6) scale(${s})`} {...ink} strokeWidth={LINE.mid / s}>
        <path d="M30 92 L34 70 M50 92 L52 72 M86 92 L84 72 M104 92 L100 70" strokeWidth={10} />
        <path d="M30 92 L34 70 M50 92 L52 72 M86 92 L84 72 M104 92 L100 70" stroke={C.cat} strokeWidth={4} />
        <path d="M22 74 Q22 40 66 34 Q104 32 110 70 Q86 62 66 62 Q44 62 22 74 Z" fill={C.cat} />
        <path d="M36 46 L30 34 L42 40 L44 26 L52 38 L58 24 L64 36 L72 22 L76 36 L86 26 L86 40 L98 34 L94 46" fill={C.cat} />
        <path d="M6 56 Q2 34 16 26 L14 8 L28 22 Q36 20 44 24 L56 8 L56 30 Q62 44 52 56 Q40 66 22 66 Q10 64 6 56 Z" fill={C.cat} />
        <circle cx="20" cy="40" r="9" fill={P.sun} strokeWidth={3} />
        <circle cx="42" cy="40" r="9" fill={P.sun} strokeWidth={3} />
        <circle cx="21" cy="41" r="3" fill={P.ink} stroke="none" />
        <circle cx="43" cy="41" r="3" fill={P.ink} stroke="none" />
        <path d="M22 56 Q31 50 40 56 L37 60 L34 56 L31 60 L28 56 L25 60 Z" fill={P.white} strokeWidth={2.5} />
      </g>
    </g>
  );
}

function Lina({ face }: { face: Face }) {
  const size = 34;
  return (
    <g>
      <ellipse cx={19} cy={125} rx={16} ry={2} fill={P.ink} opacity={0.2} />
      <g filter="url(#lab-outline)">
        <svg x={2} y={88} width={size} height={size * 1.11} viewBox="0 0 200 222" overflow="visible">
          <LinaHead face={face} />
        </svg>
      </g>
    </g>
  );
}

function RampIcon({ x, y, len }: Pt & { len: number }) {
  return <Ramp x={x} y={y} len={len} angle={0} />;
}

function Tray({ count, pressed = false, slotLit = false }: { count: number; pressed?: boolean; slotLit?: boolean }) {
  return (
    <g>
      <rect x={TRAY.x + 1.4} y={TRAY.y + 1.6} width={TRAY.w} height={TRAY.h} rx={4.5} fill={P.ink} opacity={0.35} />
      <rect x={TRAY.x} y={TRAY.y} width={TRAY.w} height={TRAY.h} rx={4.5} fill={P.paper} {...ink} strokeWidth={LINE.fg} />
      <rect x={SLOT.x} y={SLOT.y} width={SLOT.w} height={SLOT.h} rx={2.6} fill={slotLit ? P.sunPale : P.white} {...ink} strokeWidth={LINE.mid} />
      <RampIcon x={SLOT.x + SLOT.w / 2} y={SLOT.y + SLOT.h / 2 + 1.4} len={20} />
      <g transform={`translate(${SLOT.x + SLOT.w - 5} ${SLOT.y + 0.4})`}>
        <rect x={-5} y={-3.4} width={10} height={6.4} rx={3.2} fill={P.sun} {...ink} strokeWidth={LINE.detail} />
        <text x={0} y={1.8} textAnchor="middle" fontSize={5} fill={P.ink} style={display}>
          ×{count}
        </text>
      </g>
      <rect x={95} y={107} width={13} height={16} rx={2.6} fill={P.plum300} {...ink} strokeWidth={LINE.mid} />
      <g transform="translate(101.5 114.2)" {...ink} strokeWidth={0.9}>
        <path d="M-2.6 0 Q-2.6 -3.6 0 -3.6 Q2.6 -3.6 2.6 0 Q2.6 1.4 1.2 2.4 L-1.2 2.4 Q-2.6 1.4 -2.6 0 Z" fill={P.sun} />
        <path d="M-1.2 3.6 L1.2 3.6" />
      </g>
      <g transform={pressed ? `translate(0 1)` : undefined}>
        {!pressed && <rect x={RUN.x} y={RUN.y + 1.6} width={RUN.w} height={RUN.h} rx={2.8} fill={P.ink} />}
        <rect x={RUN.x} y={RUN.y} width={RUN.w} height={RUN.h} rx={2.8} fill={P.lime} {...ink} strokeWidth={LINE.mid} />
        <path d={`M${RUN.x + 4.4} ${RUN.y + 4.6} L${RUN.x + 9.4} ${RUN.y + 8} L${RUN.x + 4.4} ${RUN.y + 11.4} Z`} fill={P.white} {...ink} strokeWidth={0.9} />
        <text x={RUN.x + 22.4} y={RUN.y + 10.8} textAnchor="middle" fontSize={7} fill={P.ink} style={display}>
          LIGAR
        </text>
      </g>
    </g>
  );
}

function Finger({ x, y, rotate = 0, press = false }: Pt & { rotate?: number; press?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {press && <path d="M-6.4 -3 L-9.4 -5.2 M0 -6.2 L0 -9.6 M6.4 -3 L9.4 -5.2" stroke={P.ink} strokeWidth={1.2} strokeLinecap="round" />}
      <g {...ink} strokeWidth={LINE.detail} fill={P.white}>
        <path d="M-1.9 6 L-1.9 1.2 Q-1.9 -0.8 0 -0.8 Q1.9 -0.8 1.9 1.2 L1.9 6" />
        <path d="M-1.9 6 Q-6.2 5.4 -5.6 9 L-4.6 12.6 Q-4 15.6 -0.6 15.6 L3.6 15.6 Q6.6 15.6 6.6 12.4 L6.6 8.2 Q6.6 6.2 4.6 6.4 Q4.4 4.6 2.6 5 Q1.9 5 1.9 6 Z" />
        <path d="M4.6 6.4 L4.6 9 M1.9 6 L1.9 9" fill="none" strokeWidth={0.8} />
        <rect x={-3.6} y={15.4} width={9.4} height={3.4} rx={1} fill={P.sky} />
      </g>
    </g>
  );
}

function RoundButton({ x, y, kind }: Pt & { kind: "rotate" | "remove" }) {
  const r = 5.4;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0.6} cy={1.2} r={r} fill={P.ink} />
      <circle cx={0} cy={0} r={r} fill={kind === "rotate" ? P.sun : P.tomato} {...ink} strokeWidth={LINE.mid} />
      {kind === "rotate" ? (
        <g {...ink} fill="none" strokeWidth={1.2}>
          <path d="M2.4 -1.6 A2.8 2.8 0 1 0 2.6 1.4" />
          <path d="M3.2 -3.6 L2.6 -1.2 L0.2 -1.8" />
        </g>
      ) : (
        <path d="M-2 -2 L2 2 M2 -2 L-2 2" stroke={P.white} strokeWidth={1.5} strokeLinecap="round" />
      )}
    </g>
  );
}

function Stage({ lina, children, tray, areaLit = false }: { lina: Face; children: React.ReactNode; tray: React.ReactNode; areaLit?: boolean }) {
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <Outline />
      <Backdrop />
      <BuildArea lit={areaLit} />
      <Pipe />
      <Shelf {...SHELF_A} />
      <Shelf {...SHELF_B} />
      {children}
      <Lina face={lina} />
      {tray}
    </svg>
  );
}

function rampEnd(side: -1 | 1): Pt {
  const a = (RAMP.angle * Math.PI) / 180;
  return { x: RAMP.x + side * (RAMP.len / 2) * Math.cos(a), y: RAMP.y + side * (RAMP.len / 2) * Math.sin(a) };
}

function BuildPanel() {
  const held = { x: RAMP.x, y: 60 };
  return (
    <Stage
      lina="normal"
      areaLit
      tray={
        <g>
          <Tray count={1} slotLit />
          <path d={`M${SLOT.x + SLOT.w / 2} ${SLOT.y - 1} Q${SLOT.x + 6} 84 ${held.x - 4} 70`} fill="none" stroke={P.ink} strokeWidth={3.2} strokeLinecap="round" strokeDasharray="0.1 4.4" />
          <path d={`M${SLOT.x + SLOT.w / 2} ${SLOT.y - 1} Q${SLOT.x + 6} 84 ${held.x - 4} 70`} fill="none" stroke={P.white} strokeWidth={1.6} strokeLinecap="round" strokeDasharray="0.1 4.4" />
        </g>
      }
    >
      <Bell />
      <CatAsleep />
      <Ramp x={held.x} y={held.y} len={RAMP.len} angle={0} look="valid" lifted />
      <Finger x={held.x + 1} y={held.y + 1} rotate={-8} />
    </Stage>
  );
}

function RotateArc({ side }: { side: -1 | 1 }) {
  const rad = RAMP.len / 2 + 5;
  const a0 = side === 1 ? 0 : 180;
  const a1 = a0 + RAMP.angle;
  const pt = (deg: number) => ({ x: Math.round((RAMP.x + Math.cos((deg * Math.PI) / 180) * rad) * 10) / 10, y: Math.round((RAMP.y + Math.sin((deg * Math.PI) / 180) * rad) * 10) / 10 });
  const p0 = pt(a0 - 4);
  const p1 = pt(a1 - 4);
  const tip = pt(a1 + 4);
  const d = `M${p0.x} ${p0.y} A${rad} ${rad} 0 0 1 ${p1.x} ${p1.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke={P.ink} strokeWidth={3.8} strokeLinecap="round" />
      <path d={d} fill="none" stroke={P.white} strokeWidth={1.7} strokeLinecap="round" />
      <path d="M0 0 L-4.2 -2.9 L-4.2 2.9 Z" transform={`translate(${tip.x} ${tip.y}) rotate(${a1 + 90})`} fill={P.white} {...ink} strokeWidth={LINE.detail} />
    </g>
  );
}

function AdjustPanel() {
  return (
    <Stage lina="wow" tray={<Tray count={1} />}>
      <Bell />
      <CatAsleep />
      <Ramp x={RAMP.x} y={RAMP.y} len={RAMP.len} angle={0} ghost />
      <Ramp x={RAMP.x} y={RAMP.y} len={RAMP.len} angle={RAMP.angle} look="selected" />
      <RotateArc side={1} />
      <RotateArc side={-1} />
      <RoundButton x={RAMP.x} y={RAMP.y - 19} kind="remove" />
      <RoundButton x={RAMP.x + 14} y={RAMP.y - 19} kind="rotate" />
      <Finger x={RAMP.x + 18.4} y={RAMP.y - 17} rotate={-62} press />
    </Stage>
  );
}

function TestPanel() {
  const lo = rampEnd(-1);
  const hi = rampEnd(1);
  const lift = (p: Pt, a: number) => ({ x: p.x + Math.sin((a * Math.PI) / 180) * MARBLE_R, y: p.y - Math.cos((a * Math.PI) / 180) * MARBLE_R - 1.8 });
  const r = (n: number) => Math.round(n * 10) / 10;
  const a0 = lift({ x: 34, y: 38.3 }, 5);
  const a1 = lift(SHELF_A.to, 5);
  const b0 = lift({ x: lo.x + 4, y: lo.y + 2.3 }, RAMP.angle);
  const b1 = lift(hi, RAMP.angle);
  const c0 = lift({ x: SHELF_B.from.x + 3, y: SHELF_B.from.y + 0.3 }, 5);
  const c1 = lift(SHELF_B.to, 5);
  const hit = { x: 162.6, y: 77.4 };
  const trail = [
    `M${PIPE_MOUTH.x + 1} ${PIPE_MOUTH.y}`,
    `Q${r(a0.x)} ${PIPE_MOUTH.y} ${r(a0.x)} ${r(a0.y)}`,
    `L${r(a1.x)} ${r(a1.y)}`,
    `Q${r(a1.x + 7)} ${r(a1.y)} ${r(b0.x)} ${r(b0.y)}`,
    `L${r(b1.x)} ${r(b1.y)}`,
    `Q${r(b1.x + 5)} ${r(b1.y + 1)} ${r(c0.x)} ${r(c0.y)}`,
    `L${r(c1.x)} ${r(c1.y)}`,
    `Q${r(c1.x + 6)} ${r(c1.y - 1)} ${hit.x - 3} ${hit.y - 0.6}`,
  ].join(" ");
  return (
    <Stage lina="happy" tray={<Tray count={1} pressed />}>
      <path d={trail} fill="none" stroke={P.white} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="0.1 3.6" opacity={0.95} />
      <Ramp x={RAMP.x} y={RAMP.y} len={RAMP.len} angle={RAMP.angle} />
      <Marble x={r(b0.x + 9)} y={r(b0.y + 5.2)} faded />
      <g transform={`translate(${hit.x + 4} ${hit.y - 1})`}>
        <path d="M0 -8 L1.8 -3 L6.6 -4.6 L3.6 -0.6 L7.6 2.6 L2.6 2.8 L2.2 7.6 L-0.6 3.6 L-4.4 6.4 L-3.6 1.6 L-8 -0.4 L-3.4 -2 L-4.6 -6.6 L-1 -3.4 Z" fill={P.white} {...ink} strokeWidth={LINE.detail} />
      </g>
      <Bell ringing />
      <g fill="none" stroke={P.ink} strokeWidth={1.3} strokeLinecap="round">
        <path d="M181.6 66 Q184.6 70.6 183 75" />
        <path d="M155.6 62.4 Q153 66 154 70" />
      </g>
      <Marble x={hit.x - 3} y={hit.y - 0.6} />
      <path d={`M${hit.x - 10} ${hit.y - 4.4} L${hit.x - 15} ${hit.y - 5.2} M${hit.x - 10.4} ${hit.y + 0.6} L${hit.x - 16} ${hit.y + 0.4}`} stroke={P.ink} strokeWidth={1.1} strokeLinecap="round" />
      <text x={170} y={56} textAnchor="middle" fontSize={11} fill={P.sun} stroke={P.ink} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round" style={display} transform="rotate(-8 170 56)">
        DING!
      </text>
      <CatAwake />
      <path d={`M${RUN.x + 4} ${RUN.y - 2.4} L${RUN.x + 1.6} ${RUN.y - 5.4} M${RUN.x + 18} ${RUN.y - 2.6} L${RUN.x + 18} ${RUN.y - 6.4} M${RUN.x + 32} ${RUN.y - 2.4} L${RUN.x + 34.4} ${RUN.y - 5.4}`} stroke={P.ink} strokeWidth={1.3} strokeLinecap="round" />
    </Stage>
  );
}

export function BadIdeasLabHowToPanel({ step }: { step: 0 | 1 | 2 }) {
  if (step === 0) return <BuildPanel />;
  if (step === 1) return <AdjustPanel />;
  return <TestPanel />;
}
