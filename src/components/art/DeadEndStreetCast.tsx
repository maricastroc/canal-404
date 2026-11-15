import type { ReactNode } from "react";
import { DecoHead, LinaHead, type Face } from "@/components/characters/Heads";
import { P } from "@/lib/palette";
import { Fist, Mitten, RaisedArm, castInk as ink, type Pt } from "./castParts";
import { Fork, Gnome } from "./DeadEndStreetArt";

type Mood = "intro" | "win" | "lose";

const LINE = 2.2;
const TIP = 112;
const BASE = 196;
const GROUND = 186;
const PICKET = { x0: 44, w: 22, step: 26, count: 9 };
const tip = (i: number) => PICKET.x0 + i * PICKET.step + PICKET.w / 2;

const KIDS = {
  deco: { x: 40, y: 4, s: 0.64, skin: P.skinTan, shirt: P.sun, shade: P.sunDeep, shoulders: [{ x: 66, y: 126 }, { x: 142, y: 126 }] },
  lina: { x: 144, y: 10, s: 0.62, skin: P.skinBrown, shirt: P.tangerine, shade: P.tangerineDeep, shoulders: [{ x: 169, y: 128 }, { x: 243, y: 128 }] },
} as const;

type Who = keyof typeof KIDS;
type Hand = { kind: "fence"; at: number } | { kind: "up"; to: Pt; bend: number; fork?: boolean };
type Pose = { face: Face; hands: [Hand, Hand] };

const POSES: Record<Mood, Record<Who, Pose> & { gnome: "stand" | "down" }> = {
  intro: {
    deco: { face: "happy", hands: [{ kind: "up", to: { x: 38, y: 66 }, bend: -8, fork: true }, { kind: "fence", at: 4 }] },
    lina: { face: "wow", hands: [{ kind: "fence", at: 6 }, { kind: "fence", at: 8 }] },
    gnome: "stand",
  },
  win: {
    deco: { face: "happy", hands: [{ kind: "up", to: { x: 32, y: 52 }, bend: -8, fork: true }, { kind: "fence", at: 4 }] },
    lina: { face: "happy", hands: [{ kind: "fence", at: 6 }, { kind: "up", to: { x: 274, y: 58 }, bend: 8 }] },
    gnome: "down",
  },
  lose: {
    deco: { face: "normal", hands: [{ kind: "fence", at: 1 }, { kind: "fence", at: 4 }] },
    lina: { face: "normal", hands: [{ kind: "fence", at: 6 }, { kind: "fence", at: 8 }] },
    gnome: "stand",
  },
};

function Kid({ who, face }: { who: Who; face: Face }) {
  const k = KIDS[who];
  const Head = who === "deco" ? DecoHead : LinaHead;
  const left = k.x + 16 * k.s;
  const right = k.x + 184 * k.s;
  return (
    <g>
      <path d={`M${left} ${k.y + 196 * k.s} L${right} ${k.y + 196 * k.s} L${right - 2} ${BASE} L${left + 2} ${BASE} Z`} fill={k.shirt} {...ink} strokeWidth={LINE} />
      <path d={`M${right - 18} ${k.y + 196 * k.s} L${right} ${k.y + 196 * k.s} L${right - 2} ${BASE} L${right - 18} ${BASE} Z`} fill={k.shade} />
      {who === "lina" ? <path d={`M${k.x + 58 * k.s} ${k.y + 200 * k.s} L${k.x + 58 * k.s} ${BASE} M${k.x + 142 * k.s} ${k.y + 200 * k.s} L${k.x + 142 * k.s} ${BASE}`} stroke={P.mint} strokeWidth={3} /> : null}
      <g transform={`translate(${k.x} ${k.y}) scale(${k.s})`}>
        <Head face={face} />
      </g>
    </g>
  );
}

function Arm({ who, from, hand }: { who: Who; from: Pt; hand: Extract<Hand, { kind: "up" }> }) {
  const k = KIDS[who];
  return <RaisedArm from={from} to={hand.to} bend={hand.bend} skin={k.skin} shirt={k.shirt} />;
}

function HandUp({ at, skin, fork }: { at: Pt; skin: string; fork?: boolean }) {
  return (
    <g>
      {fork ? (
        <g transform={`rotate(-12 ${at.x} ${at.y})`}>
          <Fork x={at.x} y={at.y + 10} s={0.82} pouch={{ x: 1, y: -34 }} />
        </g>
      ) : null}
      <Fist at={at} skin={skin} line={LINE} />
    </g>
  );
}

function FenceHand({ x, skin }: { x: number; skin: string }) {
  return <Mitten x={x} y={TIP + 7} skin={skin} line={LINE} />;
}

function Fence() {
  const { x0, w, step, count } = PICKET;
  const rails = [130, 164];
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const x = x0 + i * step;
        const outline = `M${x} ${BASE} L${x} ${TIP + 8} L${x + w / 2} ${TIP} L${x + w} ${TIP + 8} L${x + w} ${BASE} Z`;
        return (
          <g key={x}>
            <path d={outline} fill={P.cream} />
            <path d={`M${x + w / 2 + 1} ${TIP + 1.5} L${x + w} ${TIP + 8} L${x + w} ${BASE} L${x + w / 2 + 1} ${BASE} Z`} fill={P.cream2} />
            {i % 3 === 1 ? <path d={`M${x + 5} ${TIP + 28} L${x + 5} ${TIP + 44}`} stroke={P.cream3} strokeWidth={1.6} strokeLinecap="round" /> : null}
            <path d={outline} fill="none" {...ink} strokeWidth={LINE} />
          </g>
        );
      })}
      {rails.map((y) => (
        <g key={y}>
          <rect x={x0 - 6} y={y} width={count * step + 6} height={7.5} rx={1.5} fill={P.wood} {...ink} strokeWidth={LINE} />
          <path d={`M${x0 - 2} ${y + 2.4} L${x0 + count * step - 6} ${y + 2.4}`} stroke="#c98a5c" strokeWidth={1.4} strokeLinecap="round" />
          {Array.from({ length: count }, (_, i) => (
            <circle key={i} cx={tip(i)} cy={y + 4} r={0.9} fill={P.ink} />
          ))}
        </g>
      ))}
    </g>
  );
}

function Grass() {
  const left = 10;
  const right = 292;
  const top = GROUND;
  const bumps = Array.from({ length: Math.floor((right - left - 16) / 14) }, (_, i) => left + 8 + i * 14);
  const edge = bumps.map((x) => `Q${x + 7} ${top - 6} ${x + 14} ${top}`).join(" ");
  const end = bumps[bumps.length - 1] + 14;
  const d = `M${left} ${top + 8} Q${left} ${top} ${left + 8} ${top} ${edge} L${end} ${top} Q${right} ${top} ${right} ${top + 8} Q${right} ${top + 15} ${right - 9} ${top + 15} L${left + 9} ${top + 15} Q${left} ${top + 15} ${left} ${top + 8} Z`;
  return (
    <g>
      <path d={d} fill={P.lime} />
      <path d={`M${left + 2} ${top + 10} L${right - 2} ${top + 10} L${right - 4} ${top + 13} Q${right - 9} ${top + 15} ${right - 12} ${top + 15} L${left + 12} ${top + 15} Q${left + 4} ${top + 15} ${left + 2} ${top + 10} Z`} fill={P.limeDeep} opacity={0.5} />
      <path d={d} fill="none" {...ink} strokeWidth={LINE} />
      <path d={`M92 ${top + 6} l-2 -4 M96 ${top + 6} l1 -5 M206 ${top + 7} l-2 -4 M210 ${top + 7} l1 -5 M262 ${top + 6} l2 -4`} {...ink} strokeWidth={1.2} />
    </g>
  );
}

export function DeadEndStreetCast({ mood, className }: { mood: Mood; className?: string }) {
  const pose = POSES[mood];
  const arms: { who: Who; from: Pt; hand: Extract<Hand, { kind: "up" }> }[] = [];
  const front: ReactNode[] = [];
  (["deco", "lina"] as const).forEach((who) => {
    pose[who].hands.forEach((hand, side) => {
      const k = KIDS[who];
      if (hand.kind === "up") {
        arms.push({ who, from: k.shoulders[side], hand });
        front.push(<HandUp key={`${who}-${side}`} at={hand.to} skin={k.skin} fork={hand.fork} />);
      } else {
        front.push(<FenceHand key={`${who}-${side}`} x={tip(hand.at)} skin={k.skin} />);
      }
    });
  });
  return (
    <svg viewBox="0 0 300 210" className={className} aria-hidden overflow="visible">
      {arms.map((a) => (
        <Arm key={`${a.who}-${a.from.x}`} {...a} />
      ))}
      <Kid who="deco" face={pose.deco.face} />
      <Kid who="lina" face={pose.lina.face} />
      <Fence />
      {front}
      {pose.gnome === "stand" ? <Gnome x={38} y={GROUND + 7} s={0.78} /> : <Gnome x={26} y={GROUND - 9} s={0.74} rotate={84} shock />}
      <Grass />
    </svg>
  );
}
