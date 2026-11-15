import type { ReactNode } from "react";
import { BrunoHead, LinaHead, type Face } from "@/components/characters/Heads";
import { P } from "@/lib/palette";
import { Fist, Mitten, RaisedArm, castInk as ink, type Pt } from "./castParts";

type Mood = "intro" | "win" | "lose";

const LINE = 2.2;
const TOP = { back: 140, front: 152, left: 12, right: 288, inset: 8 };
const EDGE = 161;
const FLOOR = 198;
const SURFACE = 147;

const KIDS = {
  lina: { x: 28, y: 0, s: 0.7, skin: P.skinBrown, shirt: P.tangerine, shoulders: [{ x: 56, y: 136 }, { x: 140, y: 136 }] },
  bruno: { x: 136, y: 3, s: 0.7, skin: P.skinLight, shirt: P.sky, shoulders: [{ x: 164, y: 139 }, { x: 248, y: 139 }] },
} as const;

type Who = keyof typeof KIDS;
type Hand = { kind: "bench"; x: number } | { kind: "up"; to: Pt; bend: number; tool?: "wrench" };
type Pose = { face: Face; hands: [Hand, Hand] };

const POSES: Record<Mood, Record<Who, Pose> & { lit: boolean }> = {
  intro: {
    lina: { face: "happy", hands: [{ kind: "bench", x: 66 }, { kind: "bench", x: 124 }] },
    bruno: { face: "wow", hands: [{ kind: "bench", x: 178 }, { kind: "bench", x: 234 }] },
    lit: false,
  },
  win: {
    lina: { face: "happy", hands: [{ kind: "up", to: { x: 22, y: 66 }, bend: -8, tool: "wrench" }, { kind: "bench", x: 124 }] },
    bruno: { face: "happy", hands: [{ kind: "bench", x: 178 }, { kind: "up", to: { x: 280, y: 68 }, bend: 8 }] },
    lit: true,
  },
  lose: {
    lina: { face: "normal", hands: [{ kind: "bench", x: 66 }, { kind: "bench", x: 124 }] },
    bruno: { face: "wow", hands: [{ kind: "bench", x: 178 }, { kind: "bench", x: 234 }] },
    lit: false,
  },
};

function Kid({ who, face }: { who: Who; face: Face }) {
  const k = KIDS[who];
  const Head = who === "lina" ? LinaHead : BrunoHead;
  return (
    <g transform={`translate(${k.x} ${k.y}) scale(${k.s})`}>
      <Head face={face} />
    </g>
  );
}

function Wrench({ at, angle }: { at: Pt; angle: number }) {
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${angle})`} {...ink}>
      <rect x={-3.4} y={-3} width={6.8} height={30} rx={3} fill={P.steel} strokeWidth={LINE} />
      <path d="M-9 -4 Q-10 -15 0 -16 Q10 -15 9 -4 L4 -4 L4 -10 L-4 -10 L-4 -4 Z" fill={P.steel} strokeWidth={LINE} />
      <path d="M-1.2 4 L-1.2 22" stroke={P.white} strokeWidth={1.3} opacity={0.7} />
    </g>
  );
}

function Spring({ x }: { x: number }) {
  const coils = 5;
  const top = SURFACE - 26;
  const step = (SURFACE - 4 - top) / coils;
  const d = Array.from({ length: coils }, (_, i) => {
    const y = SURFACE - 4 - i * step;
    return `M${x - 8} ${y} Q${x} ${y - step * 0.9} ${x + 8} ${y - step * 0.5}`;
  }).join(" ");
  return (
    <g {...ink}>
      <ellipse cx={x} cy={SURFACE + 0.5} rx={11} ry={2.6} fill={P.steelDeep} strokeWidth={LINE} />
      <path d={d} fill="none" stroke={P.ink} strokeWidth={4.6} />
      <path d={d} fill="none" stroke={P.steel} strokeWidth={2} />
      <rect x={x - 10} y={top - 4} width={20} height={5} rx={2} fill={P.tomato} strokeWidth={LINE} />
    </g>
  );
}

function Prototype({ x, lit }: { x: number; lit: boolean }) {
  const base = SURFACE + 1;
  const r = 13;
  const cy = base - 36;
  const neck = base - 15;
  const glass = `M${x - 6.5} ${neck} L${x - 6.5} ${cy + 9.5} A${r} ${r} 0 1 1 ${x + 6.5} ${cy + 9.5} L${x + 6.5} ${neck} Z`;
  return (
    <g {...ink}>
      {lit ? (
        <g strokeLinecap="round">
          {[-160, -125, -90, -55, -20].map((deg) => {
            const a = (deg * Math.PI) / 180;
            const d = `M${(x + Math.cos(a) * (r + 5)).toFixed(1)} ${(cy + Math.sin(a) * (r + 5)).toFixed(1)} L${(x + Math.cos(a) * (r + 13)).toFixed(1)} ${(cy + Math.sin(a) * (r + 13)).toFixed(1)}`;
            return (
              <g key={deg}>
                <path d={d} stroke={P.ink} strokeWidth={4.8} />
                <path d={d} stroke={P.sun} strokeWidth={2.2} />
              </g>
            );
          })}
        </g>
      ) : null}
      <rect x={x - 16} y={base - 7} width={32} height={8} rx={2} fill={P.woodDeep} strokeWidth={LINE} />
      <path d={`M${x + 16} ${base - 3} Q${x + 27} ${base - 3} ${x + 27} ${base - 13} L${x + 27} ${base - 18}`} fill="none" stroke={P.tomato} strokeWidth={2} />
      <rect x={x + 23} y={base - 25} width={9} height={8} rx={1.5} fill={P.mint} strokeWidth={1.6} />
      <path d={glass} fill={lit ? P.sun : P.cream} strokeWidth={LINE} />
      <path d={`M${x - 4} ${neck} L${x - 4} ${cy + 3} L${x - 1.5} ${cy - 2} L${x + 1.5} ${cy + 2} L${x + 4} ${cy - 2} L${x + 4} ${neck}`} fill="none" stroke={lit ? P.tangerineDeep : P.steelDeep} strokeWidth={1.4} />
      <path d={`M${x - 8} ${cy - 3} Q${x - 7} ${cy - 9} ${x - 2} ${cy - 10}`} fill="none" stroke={P.white} strokeWidth={2} />
      <rect x={x - 7.5} y={neck - 1} width={15} height={9} rx={2} fill={P.steel} strokeWidth={LINE} />
      <path d={`M${x - 7.5} ${neck + 2.4} L${x + 7.5} ${neck + 2.4} M${x - 7.5} ${neck + 5} L${x + 7.5} ${neck + 5}`} strokeWidth={1.1} />
    </g>
  );
}

function Bench() {
  const { back, front, left, right, inset } = TOP;
  return (
    <g {...ink}>
      <path d={`M${left} ${EDGE} L${right} ${EDGE} L${right - 4} ${FLOOR} L${left + 4} ${FLOOR} Z`} fill={P.plum700} strokeWidth={LINE} />
      <path d={`M${right - 22} ${EDGE} L${right} ${EDGE} L${right - 4} ${FLOOR} L${right - 24} ${FLOOR} Z`} fill={P.plum800} stroke="none" />
      {[0, 1, 2].map((i) => {
        const x = left + 18 + i * 86;
        return (
          <g key={i}>
            <rect x={x} y={EDGE + 8} width={74} height={17} rx={2.5} fill={P.plum600} strokeWidth={LINE} />
            <rect x={x + 30} y={EDGE + 14} width={14} height={4.4} rx={2.2} fill={P.steel} strokeWidth={1.4} />
          </g>
        );
      })}
      <path d={`M${left + inset} ${back} L${right - inset} ${back} L${right} ${front} L${left} ${front} Z`} fill="#d79a62" strokeWidth={LINE} />
      <path d={`M${left + inset + 8} ${back + 4} L${right - inset - 30} ${back + 4}`} stroke="#e8b886" strokeWidth={1.6} />
      <path d={`M${left + 40} ${back + 9} L${left + 120} ${back + 9} M${right - 110} ${back + 10} L${right - 40} ${back + 10}`} stroke="#b97f45" strokeWidth={1.2} />
      <rect x={left - 3} y={front} width={right - left + 6} height={EDGE - front} rx={2} fill={P.wood} strokeWidth={LINE} />
      <path d={`M${left + 2} ${front + 3} L${right - 2} ${front + 3}`} stroke="#c98a5c" strokeWidth={1.4} />
    </g>
  );
}

function Floor() {
  return (
    <g {...ink}>
      <rect x={4} y={FLOOR - 1} width={292} height={11} rx={5.5} fill={P.plum300} strokeWidth={LINE} />
      <path d={`M14 ${FLOOR + 4} L286 ${FLOOR + 4}`} stroke={P.plum500} strokeWidth={1.4} strokeDasharray="10 8" />
    </g>
  );
}

export function BadIdeasLabCast({ mood, className }: { mood: Mood; className?: string }) {
  const pose = POSES[mood];
  const arms: ReactNode[] = [];
  const front: ReactNode[] = [];
  (["lina", "bruno"] as const).forEach((who) => {
    const k = KIDS[who];
    pose[who].hands.forEach((hand, side) => {
      const key = `${who}-${side}`;
      if (hand.kind === "up") {
        arms.push(<RaisedArm key={key} from={k.shoulders[side]} to={hand.to} bend={hand.bend} skin={k.skin} shirt={k.shirt} />);
        front.push(
          <g key={key}>
            {hand.tool === "wrench" ? <Wrench at={{ x: hand.to.x + 2, y: hand.to.y - 4 }} angle={-24} /> : null}
            <Fist at={hand.to} skin={k.skin} line={LINE} />
          </g>,
        );
      } else {
        front.push(<Mitten key={key} x={hand.x} y={SURFACE - 1} skin={k.skin} line={LINE} />);
      }
    });
  });
  return (
    <svg viewBox="0 0 300 210" className={className} aria-hidden overflow="visible">
      {arms}
      <Kid who="lina" face={pose.lina.face} />
      <Kid who="bruno" face={pose.bruno.face} />
      <Floor />
      <Bench />
      <Spring x={30} />
      <Prototype x={152} lit={pose.lit} />
      {mood === "win" ? null : <Wrench at={{ x: 270, y: SURFACE - 4 }} angle={78} />}
      {front}
    </svg>
  );
}
