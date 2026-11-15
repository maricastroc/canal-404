import { DecoHead, LinaHead, type Face } from "@/components/characters/Heads";
import { P } from "@/lib/palette";

const display = { fontFamily: "var(--font-luckiest)" };
const ink = { stroke: P.ink, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

type Pt = { x: number; y: number };

export function arcPoint(from: Pt, via: Pt, to: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: Math.round((u * u * from.x + 2 * u * t * via.x + t * t * to.x) * 100) / 100,
    y: Math.round((u * u * from.y + 2 * u * t * via.y + t * t * to.y) * 100) / 100,
  };
}

export function Sparkle4({ x, y, r, fill = P.white, sw = 2.5 }: { x: number; y: number; r: number; fill?: string; sw?: number }) {
  const c = r * 0.18;
  return (
    <path
      d={`M${x} ${y - r} Q${x + c} ${y - c} ${x + r} ${y} Q${x + c} ${y + c} ${x} ${y + r} Q${x - c} ${y + c} ${x - r} ${y} Q${x - c} ${y - c} ${x} ${y - r} Z`}
      fill={fill}
      {...ink}
      strokeWidth={sw}
    />
  );
}

export function House({ x, wall, roof, w, h, peak, base = 150, sw = 3 }: { x: number; wall: string; roof: string; w: number; h: number; peak: number; base?: number; sw?: number }) {
  const top = base - h;
  return (
    <g {...ink} strokeWidth={sw}>
      <rect x={x + w * 0.66} y={top - peak * 0.55} width={w * 0.14} height={peak * 0.7} fill={P.brick} />
      <rect x={x} y={top} width={w} height={h} fill={wall} />
      <rect x={x} y={top + h - sw * 2} width={w} height={sw * 2} fill={P.ink} opacity={0.14} stroke="none" />
      <path d={`M${x - sw * 2} ${top + sw / 2} L${x + w / 2} ${top - peak} L${x + w + sw * 2} ${top + sw / 2} Z`} fill={roof} />
      <rect x={x + w * 0.14} y={top + h * 0.3} width={w * 0.24} height={h * 0.3} fill={P.sunPale} />
      <path d={`M${x + w * 0.26} ${top + h * 0.3} L${x + w * 0.26} ${top + h * 0.6} M${x + w * 0.14} ${top + h * 0.45} L${x + w * 0.38} ${top + h * 0.45}`} fill="none" strokeWidth={sw * 0.65} />
      <rect x={x + w * 0.58} y={top + h * 0.42} width={w * 0.2} height={h * 0.58} rx={sw} fill={P.wood} />
    </g>
  );
}

export function Fork({ x, y, s, pouch, tension = 0 }: { x: number; y: number; s: number; pouch: Pt; tension?: number }) {
  const k = 1 / s;
  const backTip = { x: -11, y: -46 };
  const frontTip = { x: 11, y: -46 };
  const hot = tension > 0.5;
  const sag = (1 - tension) * 4;
  const deg = tension > 0 ? (Math.atan2(pouch.y + 30, pouch.x) * 180) / Math.PI + 180 : 0;
  const band = (tip: Pt, color: string) => {
    const mx = (tip.x + pouch.x) / 2;
    const my = (tip.y + pouch.y) / 2 + sag;
    const d = `M${tip.x} ${tip.y} Q${mx} ${my} ${pouch.x} ${pouch.y}`;
    return (
      <>
        <path d={d} fill="none" stroke={P.ink} strokeWidth={5.6 * k * s} strokeLinecap="round" />
        <path d={d} fill="none" stroke={color} strokeWidth={2.6 * k * s} strokeLinecap="round" />
      </>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M0 0 L0 -20 L${backTip.x} ${backTip.y}`} fill="none" stroke={P.ink} strokeWidth={8.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M0 0 L0 -20 L${backTip.x} ${backTip.y}`} fill="none" stroke={P.wood} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
      {band(backTip, P.tomatoDeep)}
      <path d={`M0 -20 L${frontTip.x} ${frontTip.y}`} fill="none" stroke={P.ink} strokeWidth={8.5} strokeLinecap="round" />
      <path d={`M0 -20 L${frontTip.x} ${frontTip.y}`} fill="none" stroke={P.woodDeep} strokeWidth={4.2} strokeLinecap="round" />
      <circle cx={backTip.x} cy={backTip.y} r={3.2} fill={P.mint} stroke={P.ink} strokeWidth={1.6} />
      <circle cx={frontTip.x} cy={frontTip.y} r={3.2} fill={P.mint} stroke={P.ink} strokeWidth={1.6} />
      <circle cx={0} cy={-10} r={2.2} fill={P.steel} stroke={P.ink} strokeWidth={1.4} />
      <g transform={`translate(${pouch.x} ${pouch.y}) rotate(${deg})`}>
        <rect x={-9} y={-5.5} width={9} height={11} rx={3} fill={P.woodDeep} stroke={P.ink} strokeWidth={2} />
        <rect x={-7.5} y={-4} width={4} height={8} rx={1.5} fill={P.wood} />
      </g>
      {band(frontTip, hot ? P.sun : P.tomato)}
    </g>
  );
}

const LINE = { fg: 2.2, mid: 1.9, bg: 1.5, detail: 1.3 };

const GROUND = 103;
const RIM = 86;
const KID = { size: 34, top: 48 };
const SEATS = { deco: 26, lina: 57 };
const SHOULDER_Y = 81;
const SKIN = { deco: P.skinTan, lina: P.skinBrown };
const SHIRT = { deco: P.sun, lina: P.tangerine };
const FORK = { x: 95, crotch: 67, base: 94, back: { x: 84, y: 45 }, front: { x: 106, y: 45 } };
const REST: Pt = { x: 95, y: 53 };
const PULL: Pt = { x: 81, y: 72 };
const AIM: Pt = { x: 80, y: 76 };
const GNOME = { x: 146, y: GROUND, s: 0.46 };
const FLAMINGO = { x: 187, y: GROUND, s: 0.29 };

function GnomeHat({ w }: { w: number }) {
  return (
    <g>
      <path d="M14 36 L33 2 L52 36 Q33 30 14 36 Z" fill={P.tomato} strokeWidth={w} />
      <path d="M24 22 Q30 14 34 8" stroke={P.blush} strokeWidth={w * 0.75} fill="none" />
    </g>
  );
}

function Gnome({ x, y, s, rotate = 0, shock = false, hat = true }: { x: number; y: number; s: number; rotate?: number; shock?: boolean; hat?: boolean }) {
  const w = LINE.mid / s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s}) translate(-33 -102)`} {...ink} strokeWidth={w}>
      <path d="M12 98 L14 84 L28 84 L28 98 Z M38 98 L38 84 L52 84 L54 98 Z" fill={P.woodDeep} />
      <path d="M10 88 Q10 60 33 58 Q56 60 56 88 Z" fill={P.skyDeep} />
      <path d="M18 74 L48 74" />
      <rect x="29" y="70" width="8" height="8" fill={P.sun} strokeWidth={w * 0.75} />
      <path d="M14 46 Q14 72 33 76 Q52 72 52 46 Z" fill={P.white} />
      <path d="M24 66 Q33 72 42 66" fill="none" stroke={P.cream3} strokeWidth={w * 0.7} />
      <circle cx="33" cy="42" r="14" fill={P.skinLight} />
      {shock ? (
        <g>
          <circle cx="25.5" cy="39" r="5" fill={P.white} strokeWidth={w * 0.55} />
          <circle cx="40.5" cy="39" r="5" fill={P.white} strokeWidth={w * 0.55} />
          <circle cx="26.5" cy="39.5" r="2" fill={P.ink} stroke="none" />
          <circle cx="39.5" cy="39.5" r="2" fill={P.ink} stroke="none" />
          <ellipse cx="33" cy="56" rx="4.4" ry="5.4" fill={P.ink} stroke="none" />
          <circle cx="33" cy="47" r="3.6" fill={P.blush} strokeWidth={w * 0.55} />
        </g>
      ) : (
        <g>
          <path d="M22 41 Q26 37 30 41 M36 41 Q40 37 44 41" fill="none" strokeWidth={w * 0.8} />
          <circle cx="33" cy="48" r="4.6" fill={P.blush} strokeWidth={w * 0.6} />
        </g>
      )}
      {hat && <GnomeHat w={w} />}
    </g>
  );
}

function Flamingo({ x, y, s, rotate = 0 }: { x: number; y: number; s: number; rotate?: number }) {
  const w = LINE.mid / s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s}) translate(-38 -152)`} {...ink} strokeWidth={w}>
      <path d="M30 148 L46 148" />
      <path d="M38 148 L38 92" />
      <path d="M38 120 L50 112 L40 108" fill="none" strokeWidth={w * 0.8} />
      <path d="M10 70 Q8 50 30 48 Q56 46 66 66 Q62 92 36 96 Q12 94 10 70 Z" fill={P.bubblegum} />
      <path d="M60 64 Q60 86 38 94 Q56 78 52 60 Z" fill={P.bubblegumDeep} stroke="none" />
      <path d="M20 66 Q32 58 46 66 Q36 78 20 66 Z" fill={P.bubblegumDeep} />
      <path d="M16 56 Q8 36 18 20 Q30 6 40 16" fill="none" strokeWidth={w * 3.4} />
      <path d="M16 56 Q8 36 18 20 Q30 6 40 16" fill="none" stroke={P.bubblegum} strokeWidth={w * 1.6} />
      <circle cx="36" cy="14" r="10" fill={P.bubblegum} />
      <path d="M42 10 L58 14 Q60 22 50 24 L44 20 Z" fill={P.white} />
      <path d="M52 16 L58 14 Q60 22 50 24 Z" fill={P.ink} />
      <circle cx="34" cy="11" r="2.4" fill={P.ink} stroke="none" />
    </g>
  );
}

function Duck({ x, y, s, rotate = 0, flip = false }: { x: number; y: number; s: number; rotate?: number; flip?: boolean }) {
  const w = LINE.mid / s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${flip ? -s : s} ${s}) translate(-40 -34)`} {...ink} strokeWidth={w}>
      <path d="M8 44 Q6 30 20 30 L30 30 Q22 20 28 10 Q38 0 52 6 Q62 12 58 26 Q72 28 72 44 Q72 62 44 62 L26 62 Q8 62 8 44 Z" fill={P.sun} />
      <path d="M58 30 Q70 34 68 48 Q62 58 46 60 Q64 46 58 30 Z" fill={P.sunDeep} stroke="none" />
      <path d="M54 16 Q68 14 72 20 Q66 26 56 24 Z" fill={P.tangerine} />
      <circle cx="44" cy="14" r="4" fill={P.ink} stroke="none" />
      <circle cx="45" cy="13" r="1.4" fill={P.white} stroke="none" />
      <path d="M20 42 Q30 36 40 44 Q30 52 20 42 Z" fill={P.sunDeep} />
    </g>
  );
}

function Outline() {
  return (
    <defs>
      <filter id="des-outline" x="-15%" y="-15%" width="130%" height="130%">
        <feMorphology in="SourceAlpha" operator="dilate" radius={0.85} result="grown" />
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

function Backdrop() {
  const f = (n: number) => n.toFixed(1);
  return (
    <g>
      <rect width="200" height="130" fill="#82d3f7" />
      <rect y="46" width="200" height="40" fill={P.skyPale} opacity={0.5} />
      <g>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          return <path key={i} d={`M${f(22 + Math.cos(a) * 11.5)} ${f(19 + Math.sin(a) * 11.5)} L${f(22 + Math.cos(a) * 15)} ${f(19 + Math.sin(a) * 15)}`} stroke={P.sunDeep} strokeWidth={2.2} strokeLinecap="round" />;
        })}
        <circle cx="22" cy="19" r="8" fill={P.sun} {...ink} strokeWidth={LINE.mid} />
      </g>
      <path d="M58 22 Q57 15 65 15 Q68 8 76 11 Q82 6 88 12 Q96 12 94 22 Z" fill={P.white} {...ink} strokeWidth={LINE.bg} />
      <path d="M62 19 L90 19" stroke={P.skyPale} strokeWidth={1.6} strokeLinecap="round" />
      {Array.from({ length: 17 }, (_, i) => i * 13 - 5).map((px) => (
        <g key={px}>
          <path d={`M${px} 97 L${px} 82 L${px + 5} 76 L${px + 10} 82 L${px + 10} 97 Z`} fill={P.cream} {...ink} strokeWidth={LINE.bg} />
          <path d={`M${px + 5.5} 77 L${px + 10} 82 L${px + 10} 97 L${px + 5.5} 97 Z`} fill={P.cream2} />
        </g>
      ))}
      <path d="M-3 85 L203 85 L203 88.5 L-3 88.5 Z M-3 92 L203 92 L203 95.5 L-3 95.5 Z" fill={P.wood} {...ink} strokeWidth={LINE.bg} />
      <rect y="97" width="200" height="10" fill={P.lime} />
      <rect y="97" width="200" height="3" fill={P.limeDeep} opacity={0.45} />
      <path d="M0 97 L200 97 M0 107 L200 107" stroke={P.ink} strokeWidth={LINE.mid} />
      <rect y="107" width="200" height="23" fill="#d8a066" />
      <path d="M118 124 L134 124 M160 118 L174 118 M150 128 L160 128" stroke="#b97f45" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function GroundShadow({ x, w }: { x: number; w: number }) {
  return <ellipse cx={x} cy={GROUND + 0.5} rx={w} ry={2.4} fill={P.ink} opacity={0.2} />;
}

function WagonBack() {
  return (
    <g>
      <ellipse cx="56" cy="120" rx="54" ry="3.6" fill={P.ink} opacity={0.22} />
      <path d={`M9 80 L103 80 L107 ${RIM} L5 ${RIM} Z`} fill={P.tomatoDeep} {...ink} strokeWidth={LINE.mid} />
      <path d={`M11 82.5 L101 82.5`} stroke={P.ink} strokeWidth={2} opacity={0.18} />
    </g>
  );
}

function WagonFront() {
  return (
    <g>
      <path d="M22 106 L30 112 L38 106 M74 106 L82 112 L90 106" fill="none" {...ink} strokeWidth={LINE.mid} />
      <path d={`M5 ${RIM} L107 ${RIM} L101 106 L11 106 Z`} fill={P.tomato} {...ink} strokeWidth={LINE.fg} />
      <path d="M9.5 101 L102.5 101 L101 106 L11 106 Z" fill={P.ink} opacity={0.16} />
      <rect x={3} y={83} width={106} height={6} rx={2.5} fill={P.tomato} {...ink} strokeWidth={LINE.fg} />
      <path d="M7 85 L40 85" stroke={P.blush} strokeWidth={1.6} strokeLinecap="round" />
      <rect x={42} y={92} width={26} height={9.5} rx={2.5} fill={P.paper} {...ink} strokeWidth={LINE.detail} />
      <text x={55} y={100.2} textAnchor="middle" fontSize={8} fill={P.ink} style={display}>
        404
      </text>
      <circle cx={14} cy={95} r={1.3} fill={P.steel} {...ink} strokeWidth={0.9} />
      <circle cx={98} cy={95} r={1.3} fill={P.steel} {...ink} strokeWidth={0.9} />
      <rect x={FORK.x - 5.5} y={82} width={11} height={8} rx={1.5} fill={P.steel} {...ink} strokeWidth={LINE.detail} />
      <path d={`M${FORK.x - 5.5} 86 L${FORK.x + 5.5} 86`} stroke={P.ink} strokeWidth={1} />
      {[30, 82].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={112} r={8.2} fill={P.ink} />
          <circle cx={cx} cy={112} r={4.6} fill={P.steel} {...ink} strokeWidth={LINE.detail} />
          <circle cx={cx} cy={112} r={1.5} fill={P.steelDeep} />
          <path d={`M${cx - 5.6} 108 Q${cx - 4} 105 ${cx - 1} 104.6`} stroke={P.inkSoft} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

function Kid({ who, face }: { who: "deco" | "lina"; face: Face }) {
  const Head = who === "deco" ? DecoHead : LinaHead;
  return (
    <g filter="url(#des-outline)">
      <svg x={SEATS[who] - KID.size / 2} y={KID.top} width={KID.size} height={KID.size * 1.11} viewBox="0 0 200 222" overflow="visible">
        <Head face={face} />
      </svg>
    </g>
  );
}

type Pose = { kind: "rim"; x: number } | { kind: "reach"; to: Pt; bend?: number } | { kind: "fist"; to: Pt; bend?: number };

function shoulder(who: "deco" | "lina", side: -1 | 1): Pt {
  return { x: SEATS[who] + side * 11.5, y: SHOULDER_Y };
}

function RimHand({ x, skin }: { x: number; skin: string }) {
  return (
    <g {...ink}>
      <path d={`M${x - 3.6} ${RIM - 1} Q${x - 3.6} ${RIM - 4.6} ${x} ${RIM - 4.6} Q${x + 3.6} ${RIM - 4.6} ${x + 3.6} ${RIM - 1} L${x + 3.6} ${RIM + 1.4} Q${x} ${RIM + 2.8} ${x - 3.6} ${RIM + 1.4} Z`} fill={skin} strokeWidth={LINE.detail} />
      <path d={`M${x - 1.2} ${RIM - 0.4} L${x - 1.2} ${RIM + 1.6} M${x + 1.2} ${RIM - 0.4} L${x + 1.2} ${RIM + 1.6}`} strokeWidth={0.9} />
    </g>
  );
}

function Arm({ who, side, pose }: { who: "deco" | "lina"; side: -1 | 1; pose: Pose }) {
  const skin = SKIN[who];
  if (pose.kind === "rim") return <RimHand x={pose.x} skin={skin} />;
  const from = shoulder(who, side);
  const to = pose.to;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const bend = pose.bend ?? 0;
  const via = { x: (from.x + to.x) / 2 - (dy / len) * bend, y: (from.y + to.y) / 2 + (dx / len) * bend };
  const d = `M${from.x} ${from.y} Q${via.x} ${via.y} ${to.x} ${to.y}`;
  const cuff = arcPoint(from, via, to, 0.38);
  const sleeve = `M${from.x} ${from.y} Q${(from.x + cuff.x) / 2 + (via.x - (from.x + to.x) / 2) * 0.4} ${(from.y + cuff.y) / 2 + (via.y - (from.y + to.y) / 2) * 0.4} ${cuff.x} ${cuff.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke={P.ink} strokeWidth={5} strokeLinecap="round" />
      <path d={d} fill="none" stroke={skin} strokeWidth={2.4} strokeLinecap="round" />
      <path d={sleeve} fill="none" stroke={P.ink} strokeWidth={6.6} strokeLinecap="round" />
      <path d={sleeve} fill="none" stroke={SHIRT[who]} strokeWidth={4} strokeLinecap="round" />
      <circle cx={to.x} cy={to.y} r={pose.kind === "fist" ? 3.3 : 2.9} fill={skin} {...ink} strokeWidth={LINE.detail} />
      {pose.kind === "fist" && <path d={`M${to.x - 1.6} ${to.y - 1.2} L${to.x + 1.4} ${to.y - 1.2} M${to.x - 1.6} ${to.y + 0.8} L${to.x + 1.4} ${to.y + 0.8}`} {...ink} strokeWidth={0.8} />}
    </g>
  );
}

function band(tip: Pt, pouch: Pt, sag: number, color: string) {
  const d = `M${tip.x} ${tip.y} Q${(tip.x + pouch.x) / 2} ${(tip.y + pouch.y) / 2 + sag} ${pouch.x} ${pouch.y}`;
  return (
    <>
      <path d={d} fill="none" stroke={P.ink} strokeWidth={4.6} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </>
  );
}

function prong(tip: Pt, color: string) {
  const d = `M${FORK.x} ${FORK.crotch} L${tip.x} ${tip.y}`;
  return (
    <>
      <path d={d} fill="none" stroke={P.ink} strokeWidth={7.6} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={3.6} strokeLinecap="round" />
    </>
  );
}

function Slingshot({ pouch, loaded }: { pouch: Pt; loaded: boolean }) {
  const pulled = pouch.y > REST.y + 4;
  const sag = pulled ? 0 : 3;
  const mid = { x: (FORK.back.x + FORK.front.x) / 2, y: FORK.back.y };
  const deg = pulled ? Math.round((Math.atan2(mid.y - pouch.y, mid.x - pouch.x) * 1800) / Math.PI) / 10 : 0;
  const stem = `M${FORK.x} ${FORK.base} L${FORK.x} ${FORK.crotch}`;
  return (
    <g>
      <path d={stem} fill="none" stroke={P.ink} strokeWidth={7.6} strokeLinecap="round" />
      <path d={stem} fill="none" stroke={P.wood} strokeWidth={3.6} strokeLinecap="round" />
      {prong(FORK.back, P.wood)}
      {band(FORK.back, pouch, sag, pulled ? P.tomato : P.tomatoDeep)}
      {prong(FORK.front, P.woodDeep)}
      <path d={`M${FORK.x - 2.6} 75 L${FORK.x + 2.6} 75 M${FORK.x - 2.6} 78 L${FORK.x + 2.6} 78`} stroke={P.ink} strokeWidth={1} strokeLinecap="round" />
      <circle cx={FORK.back.x} cy={FORK.back.y} r={2.8} fill={P.mint} {...ink} strokeWidth={LINE.detail} />
      <circle cx={FORK.front.x} cy={FORK.front.y} r={2.8} fill={P.mint} {...ink} strokeWidth={LINE.detail} />
      <g transform={`translate(${pouch.x} ${pouch.y}) rotate(${deg})`}>
        <path d="M-2.5 -6.5 Q-6 0 -2.5 6.5 L1 6.5 Q-1.6 0 1 -6.5 Z" fill={P.woodDeep} {...ink} strokeWidth={LINE.detail} />
      </g>
      {band(FORK.front, pouch, sag, pulled ? P.sun : P.tomato)}
      {loaded && <Duck x={pouch.x + 1.5} y={pouch.y - 5.5} s={0.25} rotate={deg + 40} />}
    </g>
  );
}

type Crew = { deco: Face; lina: Face; decoArms: [Pose, Pose]; linaArms: [Pose, Pose] };

function Panel({ crew, pouch, loaded, yard, fx }: { crew: Crew; pouch: Pt; loaded: boolean; yard: React.ReactNode; fx?: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <Outline />
      <Backdrop />
      {yard}
      <WagonBack />
      <Kid who="deco" face={crew.deco} />
      <Kid who="lina" face={crew.lina} />
      <Slingshot pouch={pouch} loaded={loaded} />
      <WagonFront />
      <Arm who="deco" side={-1} pose={crew.decoArms[0]} />
      <Arm who="deco" side={1} pose={crew.decoArms[1]} />
      <Arm who="lina" side={-1} pose={crew.linaArms[0]} />
      <Arm who="lina" side={1} pose={crew.linaArms[1]} />
      {fx}
    </svg>
  );
}

function CalmYard() {
  return (
    <g>
      <GroundShadow x={FLAMINGO.x} w={8} />
      <Flamingo {...FLAMINGO} />
      <GroundShadow x={GNOME.x} w={12} />
      <Gnome {...GNOME} />
    </g>
  );
}

const PULL_ARMS: Pick<Crew, "decoArms"> = {
  decoArms: [
    { kind: "rim", x: 17 },
    { kind: "rim", x: 35 },
  ],
};

function PullPanel() {
  return (
    <Panel
      crew={{ deco: "wow", lina: "normal", ...PULL_ARMS, linaArms: [{ kind: "rim", x: 48 }, { kind: "reach", to: PULL, bend: 3 }] }}
      pouch={PULL}
      loaded
      yard={<CalmYard />}
      fx={
        <g>
          <path d="M78 34 Q66 34 60 43" fill="none" stroke={P.ink} strokeWidth={6.4} strokeLinecap="round" />
          <path d="M78 34 Q66 34 60 43" fill="none" stroke={P.white} strokeWidth={3} strokeLinecap="round" />
          <path d="M0 0 L-6.5 -4.6 L-6.5 4.6 Z" transform="translate(57.6 47.6) rotate(118)" fill={P.white} {...ink} strokeWidth={LINE.detail} />
          <path d="M42 49 Q39.4 53.6 42 55.6 Q44.6 53.6 42 49 Z" fill={P.white} {...ink} strokeWidth={1.1} />
        </g>
      }
    />
  );
}

function Brackets({ x0, y0, x1, y1, arm }: { x0: number; y0: number; x1: number; y1: number; arm: number }) {
  const d = [
    `M${x0} ${y0 + arm} L${x0} ${y0} L${x0 + arm} ${y0}`,
    `M${x1 - arm} ${y0} L${x1} ${y0} L${x1} ${y0 + arm}`,
    `M${x0} ${y1 - arm} L${x0} ${y1} L${x0 + arm} ${y1}`,
    `M${x1 - arm} ${y1} L${x1} ${y1} L${x1} ${y1 - arm}`,
  ].join(" ");
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={P.ink} strokeWidth={4.6} />
      <path d={d} stroke={P.tomato} strokeWidth={2.2} />
    </g>
  );
}

function along(from: Pt, via: Pt, to: Pt, start: number, end: number, gap: number): Pt[] {
  const out: Pt[] = [];
  let prev = arcPoint(from, via, to, start);
  let run = gap;
  for (let i = 1; i <= 400; i += 1) {
    const t = start + ((end - start) * i) / 400;
    const p = arcPoint(from, via, to, t);
    run += Math.sqrt((p.x - prev.x) ** 2 + (p.y - prev.y) ** 2);
    prev = p;
    if (run >= gap) {
      out.push(p);
      run = 0;
    }
  }
  return out;
}

function AimDots({ points, faded = false }: { points: Pt[]; faded?: boolean }) {
  return (
    <g opacity={faded ? 0.55 : 1}>
      {points.map((p, i) => {
        const k = i / Math.max(1, points.length - 1);
        const r = faded ? 1.5 : 2.5 - k * 1;
        return (
          <g key={`${p.x}-${p.y}`}>
            <circle cx={p.x} cy={p.y} r={r + 1.2} fill={P.ink} opacity={faded ? 0.5 : 1} />
            <circle cx={p.x} cy={p.y} r={r} fill={faded ? P.white : P.tangerine} />
          </g>
        );
      })}
    </g>
  );
}

const SHOT = { from: { x: AIM.x + 3, y: AIM.y - 9 }, via: { x: 124, y: -2 }, to: { x: 148, y: 66 } };

function AimPanel() {
  const ghostVia = { x: 140, y: -34 };
  const ghostTo = { x: 196, y: 92 };
  const live = along(SHOT.from, SHOT.via, SHOT.to, 0.3, 1, 6.4).filter((p) => p.y < 50 || p.x < 140);
  const ghost = along(SHOT.from, ghostVia, ghostTo, 0.3, 0.76, 6.4).filter((p) => p.x > 132);
  return (
    <Panel
      crew={{ deco: "happy", lina: "normal", ...PULL_ARMS, linaArms: [{ kind: "rim", x: 48 }, { kind: "reach", to: AIM, bend: 3 }] }}
      pouch={AIM}
      loaded
      yard={
        <g>
          <CalmYard />
          <Brackets x0={131} y0={52} x1={161} y1={106} arm={6} />
        </g>
      }
      fx={
        <g>
          <AimDots points={ghost} faded />
          <path d="M176 50 Q176 58 169 62" fill="none" stroke={P.ink} strokeWidth={5.4} strokeLinecap="round" />
          <path d="M176 50 Q176 58 169 62" fill="none" stroke={P.white} strokeWidth={2.4} strokeLinecap="round" />
          <path d="M0 0 L-5.4 -3.8 L-5.4 3.8 Z" transform="translate(166.2 63.6) rotate(150)" fill={P.white} {...ink} strokeWidth={LINE.detail} />
          <AimDots points={live} />
        </g>
      }
    />
  );
}

function Burst({ x, y, r, points = 11 }: { x: number; y: number; r: number; points?: number }) {
  const star = (outer: number, inner: number) =>
    Array.from({ length: points * 2 }, (_, i) => {
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? outer * (i % 4 === 0 ? 1 : 0.84) : inner;
      return `${i === 0 ? "M" : "L"}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
    }).join(" ") + " Z";
  return (
    <g>
      <path d={star(r, r * 0.6)} fill={P.sun} {...ink} strokeWidth={LINE.fg} />
      <path d={star(r * 0.62, r * 0.38)} fill={P.white} />
    </g>
  );
}

function MessPanel() {
  const hit = { x: 150, y: 70 };
  return (
    <Panel
      crew={{
        deco: "happy",
        lina: "happy",
        decoArms: [{ kind: "fist", to: { x: 9, y: 58 }, bend: -3 }, { kind: "rim", x: 35 }],
        linaArms: [{ kind: "rim", x: 48 }, { kind: "fist", to: { x: 76, y: 56 }, bend: 3 }],
      }}
      pouch={REST}
      loaded={false}
      yard={
        <g>
          <GroundShadow x={FLAMINGO.x} w={8} />
          <Flamingo {...FLAMINGO} rotate={7} />
          <path d="M196 68 Q199 72 196 76 M193 82 Q196 85 194 89" fill="none" stroke={P.ink} strokeWidth={1.5} strokeLinecap="round" />
          <GroundShadow x={GNOME.x + 4} w={10} />
          <Burst x={hit.x} y={hit.y} r={20} />
          <Gnome x={GNOME.x + 5} y={GROUND - 5} s={GNOME.s} rotate={21} shock />
          <path d="M140 103 Q136 102 137 98.5 Q139 95.5 142.5 97 Q145 94 148.5 96.5 Q152 96 152 100 Q152 103 148 103 Z" fill={P.cream} {...ink} strokeWidth={LINE.detail} />
        </g>
      }
      fx={
        <g>
          <path d="M136 62 Q130 52 128 44 M141 58 Q138 48 139 40" fill="none" stroke={P.ink} strokeWidth={1.6} strokeLinecap="round" strokeDasharray="3 3" />
          <Duck x={126} y={38} s={0.26} rotate={18} flip />
          <g {...ink} strokeWidth={LINE.detail}>
            <path d="M163 49 L167.5 46 L170 49.5 L166.5 52.5 Z" fill={P.white} />
            <path d="M172 61 L176.5 59.5 L177.5 64 L173.5 65 Z" fill={P.skyDeep} />
            <path d="M139 51 L142 48.5 L144 51.5 L141 53 Z" fill={P.tomato} />
          </g>
          <path d="M159 55 L161.5 52.5 M168.5 64.5 L170.5 62.5 M146 57 L144.5 55" stroke={P.ink} strokeWidth={1.3} strokeLinecap="round" />
          <text x={172} y={27} textAnchor="middle" fontSize={15} fill={P.sun} stroke={P.ink} strokeWidth={4} paintOrder="stroke" strokeLinejoin="round" style={display}>
            +100
          </text>
        </g>
      }
    />
  );
}

export function DeadEndStreetHowToPanel({ step }: { step: 0 | 1 | 2 }) {
  if (step === 0) return <PullPanel />;
  if (step === 1) return <AimPanel />;
  return <MessPanel />;
}
