import { ArrowBigUp } from "lucide-react";
import type React from "react";
import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import { P } from "@/lib/palette";

const ART = "/assets/downhill-derby";
const display = { fontFamily: "var(--font-luckiest)" };

const C = {
  sky: "#8fd4f7",
  sun: "#fff1a8",
  asphalt: "#4a4560",
  asphaltTop: "#5b5577",
  asphaltFar: "#6a6487",
  sidewalk: "#cfc6e0",
  earth: "#7a5a3c",
  grass: "#5fb85a",
  grassDeep: "#4c9a43",
  dash: "#ffcf3f",
  wood: "#c98b4a",
  woodLight: "#e0a866",
  woodDark: "#6a4a3a",
  perfect: "#7fe0c4",
};

export type RiderId = "deco" | "lina" | "bruno" | "mila";
type Face = "normal" | "strain" | "wow" | "happy" | "panic" | "dizzy" | "smug" | "sad";
type Arm = "steer" | "up" | "flail" | "grip";
type Box = readonly [number, number, number, number];
type Pt = { x: number; y: number };

const WHEEL = { mower: 70, bearing: 50, caster: 48, neat: 58, skate: 42 } as const;

const RIGS: Record<RiderId, { seat: Pt; back: Box; front: Box; wheels: readonly (readonly [keyof typeof WHEEL, number, number])[]; fan?: Pt; rope?: Pt }> = {
  deco: {
    seat: { x: -30, y: -60 },
    back: [-110, -160, 230, 140],
    front: [-110, -160, 230, 140],
    wheels: [
      ["mower", -58, 27],
      ["bearing", 62, 17],
    ],
    rope: { x: 100, y: -108 },
  },
  lina: {
    seat: { x: -22, y: -62 },
    back: [-180, -160, 290, 140],
    front: [-180, -160, 290, 140],
    wheels: [
      ["caster", -58, 16],
      ["caster", 64, 16],
    ],
    fan: { x: -132, y: -104 },
  },
  bruno: {
    seat: { x: -24, y: -68 },
    back: [-120, -210, 250, 190],
    front: [-120, -210, 250, 190],
    wheels: [
      ["neat", -58, 21],
      ["neat", 62, 21],
    ],
  },
  mila: {
    seat: { x: -30, y: -82 },
    back: [-180, -270, 320, 250],
    front: [-130, -270, 270, 250],
    wheels: [
      ["skate", -74, 13],
      ["skate", 42, 13],
      ["skate", -42, 13],
      ["skate", 74, 13],
    ],
  },
};

const RIDERS: RiderId[] = ["deco", "lina", "bruno", "mila"];

function isRider(id: string | undefined): id is RiderId {
  return RIDERS.includes(id as RiderId);
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const deg = (rad: number) => (rad * 180) / Math.PI;

function Sheet({ name, box }: { name: string; box: Box }) {
  return <image href={`${ART}/${name}.svg`} x={box[0]} y={box[1]} width={box[2]} height={box[3]} />;
}

function Rider({ who, face, arm, reach = 0 }: { who: RiderId; face: Face; arm: Arm; reach?: number }) {
  return (
    <>
      <image href={`${ART}/${who}-body.svg`} x={-60} y={-100} width={170} height={130} />
      <image href={`${ART}/${who}-head-${face}.svg`} x={-31.1} y={-135.9} width={78.1} height={79.8} />
      <image href={`${ART}/${who}-arm-${arm}.svg`} x={-54} y={-144} width={130} height={160} transform={reach ? `rotate(${reach} 6 -54)` : undefined} />
    </>
  );
}

const HAND: Partial<Record<Arm, Pt>> = { steer: { x: 52, y: -24 }, grip: { x: 42, y: -8 } };

type RacerProps = { who: RiderId; x: number; y: number; s: number; angle?: number; face?: Face; arm?: Arm; crouch?: boolean; lift?: number; lean?: number; spin?: number; reach?: number };

function Racer({ who, x, y, s, angle = 0, face = "normal", arm = "steer", crouch = false, lift = 0, lean = 0, spin = 0, reach = 0 }: RacerProps) {
  const rig = RIGS[who];
  const squash = crouch ? 0.78 : 1;
  const tilt = (crouch ? 0.36 : 0) + lean;
  const seat = { x: rig.seat.x, y: rig.seat.y - lift };
  const hand = HAND[arm];
  const grip = hand ? { x: seat.x + hand.x * Math.cos(tilt) - hand.y * squash * Math.sin(tilt), y: seat.y + hand.x * Math.sin(tilt) + hand.y * squash * Math.cos(tilt) } : null;
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) rotate(${r1(angle)}) scale(${s})`}>
      <Sheet name={`cart-${who}-back`} box={rig.back} />
      {rig.fan && <image href={`${ART}/fan-blades.svg`} x={rig.fan.x - 36} y={rig.fan.y - 36} width={72} height={72} transform={spin ? `rotate(${spin} ${rig.fan.x} ${rig.fan.y})` : undefined} />}
      <g transform={`translate(${seat.x} ${seat.y}) rotate(${r1(deg(tilt))}) scale(1 ${squash})`}>
        <Rider who={who} face={face} arm={arm} reach={reach} />
      </g>
      <Sheet name={`cart-${who}-front`} box={rig.front} />
      {rig.wheels.map(([kind, wx, wr]) => (
        <image key={wx} href={`${ART}/wheel-${kind}.svg`} x={wx - WHEEL[kind] / 2} y={-wr - WHEEL[kind] / 2} width={WHEEL[kind]} height={WHEEL[kind]} />
      ))}
      {rig.rope && grip && (
        <g strokeLinecap="round">
          <path d={`M${rig.rope.x} ${rig.rope.y} L${r1(grip.x)} ${r1(grip.y)}`} stroke={P.ink} strokeWidth={7} />
          <path d={`M${rig.rope.x} ${rig.rope.y} L${r1(grip.x)} ${r1(grip.y)}`} stroke="#e8c27a" strokeWidth={3} />
        </g>
      )}
    </g>
  );
}

function Shadow({ x, y, w, angle = 0, opacity = 0.24 }: { x: number; y: number; w: number; angle?: number; opacity?: number }) {
  return <ellipse cx={0} cy={0} rx={w / 2} ry={w * 0.07} fill={P.ink} opacity={opacity} transform={`translate(${r1(x)} ${r1(y)}) rotate(${r1(angle)})`} />;
}

type Road = { x0: number; y0: number; x1: number; y1: number; s: number };

const roadAt = (road: Road, x: number) => road.y0 + ((road.y1 - road.y0) * (x - road.x0)) / (road.x1 - road.x0);
const roadAngle = (road: Road) => deg(Math.atan2(road.y1 - road.y0, road.x1 - road.x0));

function Street({ road, deep = 600, width = 132 }: { road: Road; deep?: number; width?: number }) {
  const { x0, y0, x1, y1, s } = road;
  const band = (top: number, bot: number) => `M${x0} ${r1(y0 + top * s)} L${x1} ${r1(y1 + top * s)} L${x1} ${r1(y1 + bot * s)} L${x0} ${r1(y0 + bot * s)} Z`;
  const line = (off: number) => `M${x0} ${r1(y0 + off * s)} L${x1} ${r1(y1 + off * s)}`;
  const len = Math.hypot(x1 - x0, y1 - y0) / (x1 - x0);
  const mid = width / 2;
  return (
    <g>
      <path d={band(40, deep)} fill={C.earth} />
      <path d={band(60, 170)} fill={C.grass} />
      <path d={band(150, 186)} fill={C.grassDeep} />
      <path d={band(52, 66)} fill={C.sidewalk} />
      <path d={line(66)} stroke={P.ink} strokeWidth={4 * s} opacity={0.8} />
      <path d={band(0, 54)} fill={C.asphalt} />
      <path d={band(-width - 26, -width)} fill={C.sidewalk} />
      <path d={band(-width, -mid)} fill={C.asphaltFar} />
      <path d={band(-mid, 0)} fill={C.asphaltTop} />
      <path d={line(-width - 26)} stroke={P.ink} strokeWidth={6 * s} />
      <path d={line(-width)} stroke={P.ink} strokeWidth={4 * s} opacity={0.6} />
      <path d={line(-mid)} stroke={C.dash} strokeWidth={5 * s} opacity={0.75} strokeDasharray={`${r1(80 * s * len)} ${r1(80 * s * len)}`} />
      <path d={line(7)} stroke={P.white} strokeWidth={4 * s} opacity={0.35} />
      <path d={line(0)} stroke={P.ink} strokeWidth={10 * s} strokeLinecap="round" />
    </g>
  );
}

function Kit({ name, cx, ground, k, w, h, flip = false, opacity }: { name: string; cx: number; ground: number; k: number; w: number; h: number; flip?: boolean; opacity?: number }) {
  return (
    <image
      href={`${ART}/${name}.svg`}
      x={r1(cx - (w / 2) * k)}
      y={r1(ground - (h - 8) * k)}
      width={r1(w * k)}
      height={r1(h * k)}
      opacity={opacity}
      transform={flip ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}
    />
  );
}

const RAMP_BACK = -134;

function rampLift(x: number, x0: number, x1: number, rise: number) {
  const t = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
  return rise * t * t;
}

function Ramp({ road, x0, len, rise, back = RAMP_BACK }: { road: Road; x0: number; len: number; rise: number; back?: number }) {
  const s = road.s;
  const x1 = x0 + len * s;
  const H = rise * s;
  const xs = Array.from({ length: 9 }, (_, i) => x0 + ((x1 - x0) * i) / 8);
  const top = (x: number, lane: number) => roadAt(road, x) + lane * s - rampLift(x, x0, x1, H);
  const pts = (lane: number, dx = 0, dy = 0) => xs.map((x) => `${r1(x + dx)} ${r1(top(x, lane) + dy)}`);
  const base = (x: number) => `${r1(x)} ${r1(roadAt(road, x) + 6 * s)}`;
  const lipBack = top(x1, back);
  const lipFront = top(x1, 0);
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d={`M${pts(back, 0, -5 * s).join(" L")} L${r1(x1 + 5 * s)} ${r1(lipBack - 5 * s)} L${r1(x1 + 5 * s)} ${r1(lipFront)} L${pts(0).reverse().join(" L")} Z`} fill={P.ink} />
      <path d={`M${pts(back).join(" L")} L${pts(0).reverse().join(" L")} Z`} fill="#d99a57" />
      {[1, 2, 3, 4].map((k) => (
        <path key={k} d={`M${pts((back * k) / 5).join(" L")}`} fill="none" stroke={P.ink} strokeWidth={3 * s} opacity={0.35} />
      ))}
      <path d={`M${pts(back).join(" L")}`} fill="none" stroke={P.ink} strokeWidth={5 * s} />
      <path d={`M${r1(x1)} ${r1(lipBack)} L${r1(x1)} ${r1(lipFront)}`} stroke={P.ink} strokeWidth={5 * s} />
      <path d={`M${pts(0, 6 * s).join(" L")} L${base(x1 + 6 * s)} L${base(x0 + 6 * s)} Z`} fill={P.ink} />
      <path d={`M${pts(0).join(" L")} L${base(x1)} L${base(x0)} Z`} fill={C.wood} />
      <path d={`M${pts(0).join(" L")} L${pts(0, 0, 16 * s).reverse().join(" L")} Z`} fill={C.woodLight} />
      {[1, 2, 3, 4, 5].map((k) => {
        const px = x0 + ((x1 - x0) * k) / 6;
        return <path key={k} d={`M${r1(px)} ${r1(top(px, 0) + 18 * s)} L${r1(px)} ${r1(roadAt(road, px))}`} stroke={P.ink} strokeWidth={4 * s} opacity={0.55} />;
      })}
      <path d={`M${pts(0).join(" L")}`} fill="none" stroke={P.ink} strokeWidth={6 * s} />
      <path d={`M${r1(x1)} ${r1(lipFront)} L${r1(x1)} ${r1(roadAt(road, x1) + 6 * s)}`} stroke={P.ink} strokeWidth={6 * s} />
      {[4, 5, 6, 7].map((i) => (
        <path key={i} d={`M${r1(xs[i])} ${r1(top(xs[i], 0) - 4 * s)} L${r1(xs[i] + (xs[1] - xs[0]) * 0.55)} ${r1(top(xs[i] + (xs[1] - xs[0]) * 0.55, 0) - 4 * s)}`} stroke={P.white} strokeWidth={6 * s} opacity={0.85} />
      ))}
    </g>
  );
}

function Speed({ d, w, color = P.ink }: { d: string; w: number; color?: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />;
}

function SpeedLines({ x, y, angle, s, rows }: { x: number; y: number; angle: number; s: number; rows: [number, number, number][] }) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) rotate(${r1(angle)}) scale(${s})`}>
      {rows.map(([dy, from, to]) => (
        <path key={`${dy}${from}`} d={`M${from} ${dy} L${to} ${dy}`} stroke={P.ink} strokeWidth={9} strokeLinecap="round" />
      ))}
    </g>
  );
}

function Dots({ from, via, to, n, r, fill = P.white }: { from: Pt; via: Pt; to: Pt; n: number; r: number; fill?: string }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * via.x + t * t * to.x;
        const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * via.y + t * t * to.y;
        return (
          <g key={i}>
            <circle cx={r1(x)} cy={r1(y)} r={r + 1.4} fill={P.ink} opacity={0.35 + t * 0.3} />
            <circle cx={r1(x)} cy={r1(y)} r={r} fill={fill} opacity={0.6 + t * 0.4} />
          </g>
        );
      })}
    </g>
  );
}

function Cloud({ x, y, s, opacity = 1 }: { x: number; y: number; s: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <path d="M-34 10 Q-38 -6 -20 -6 Q-16 -22 2 -18 Q12 -30 26 -16 Q42 -16 38 2 Q40 12 30 12 L-28 12 Q-36 12 -34 10 Z" fill={P.white} />
    </g>
  );
}

function Shout({ x, y, text, size, color, rotate = 0 }: { x: number; y: number; text: string; size: number; color: string; rotate?: number }) {
  return (
    <g style={display} transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <text textAnchor="middle" fontSize={size} fill={color} stroke={P.ink} strokeWidth={size * 0.26} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
}

function Star({ x, y, r, fill = P.sun, line = 1.6, rotate = 0 }: { x: number; y: number; r: number; fill?: string; line?: number; rotate?: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${r1(Math.cos(a) * rr)} ${r1(Math.sin(a) * rr)}`;
  });
  return <path d={`M${pts.join(" L")} Z`} transform={`translate(${x} ${y}) rotate(${rotate})`} fill={fill} stroke={P.ink} strokeWidth={line} strokeLinejoin="round" />;
}

function Puff({ x, y, r, opacity = 0.9 }: { x: number; y: number; r: number; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill="#efe6d2" stroke={P.ink} strokeWidth={r * 0.14} />
      <circle cx={x + r * 0.9} cy={y + r * 0.2} r={r * 0.72} fill="#efe6d2" stroke={P.ink} strokeWidth={r * 0.14} />
      <circle cx={x - r * 0.85} cy={y + r * 0.3} r={r * 0.6} fill="#efe6d2" stroke={P.ink} strokeWidth={r * 0.14} />
      <path d={`M${x - r * 1.3} ${y + r * 0.5} L${x + r * 1.5} ${y + r * 0.5}`} stroke="#efe6d2" strokeWidth={r * 0.5} />
    </g>
  );
}

const COVER_ROAD: Road = { x0: -20, y0: 152.6, x1: 340, y1: 249.8, s: 0.3 };
const COVER_STREET = 240;
const BACK_ROW = -207;

function CoverHouse({ name, x, k, w, h, road }: { name: string; x: number; k: number; w: number; h: number; road: Road }) {
  const ground = roadAt(road, x + (w * k) / 2 - 44 * k) - (COVER_STREET + 26) * road.s;
  return <Kit name={`sample/${name}`} cx={x} ground={ground} k={k} w={w} h={h} />;
}

function Dust({ x, y, angle, r }: { x: number; y: number; angle: number; r: number }) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) rotate(${r1(angle)})`}>
      <Puff x={-r * 1.6} y={-r * 0.6} r={r} opacity={0.9} />
      <Puff x={-r * 4} y={-r * 1.2} r={r * 0.7} opacity={0.6} />
    </g>
  );
}

function RoadHump({ road, x, w, h }: { road: Road; x: number; w: number; h: number }) {
  const s = road.s;
  const xs = Array.from({ length: 13 }, (_, i) => x - w / 2 + (w * i) / 12);
  const lift = (px: number) => Math.sin((Math.PI * (px - (x - w / 2))) / w) * h;
  const curve = (lane: number) => xs.map((px) => `${r1(px)} ${r1(roadAt(road, px) + lane * s - lift(px))}`);
  const base = (lane: number) => xs.map((px) => `${r1(px)} ${r1(roadAt(road, px) + lane * s)}`).reverse();
  const lens = (lane: number) => `M${[...curve(lane), ...base(lane)].join(" L")} Z`;
  const stripes = 7;
  const step = w / stripes;
  const stripe = (k: number) => {
    const sx = Array.from({ length: 5 }, (_, i) => x - w / 2 + k * step + (step * i) / 4);
    const top = sx.map((px) => `${r1(px)} ${r1(roadAt(road, px) - lift(px))}`);
    const bottom = sx.map((px) => `${r1(px)} ${r1(roadAt(road, px))}`).reverse();
    return `M${[...top, ...bottom].join(" L")} Z`;
  };
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d={lens(0)} fill={C.asphaltTop} />
      {Array.from({ length: stripes }, (_, k) => (
        <path key={k} d={stripe(k)} fill={k % 2 === 0 ? C.dash : P.ink} />
      ))}
      <path d={`M${curve(0).join(" L")}`} fill="none" stroke={P.ink} strokeWidth={6 * s} />
    </g>
  );
}

export function DownhillDerbyCoverArt() {
  const road = COVER_ROAD;
  const a = roadAngle(road);
  const s = road.s;
  const lane = (x: number, l: number) => roadAt(road, x) + l * s;
  const bump = { x: 210, w: 46, h: 10 };
  const crest = { x: bump.x, y: lane(bump.x, 0) - bump.h };
  const bruno = { x: 50, y: lane(50, BACK_ROW) };
  const lina = { x: 164, y: lane(164, BACK_ROW) };
  const mila = { x: 104, y: lane(104, -10) };
  const deco = { x: 262, y: lane(262, 0) - 28 };
  return (
    <>
      <rect width={320} height={240} fill={C.sky} />
      <circle cx={286} cy={30} r={20} fill={C.sun} />
      <Cloud x={196} y={22} s={0.5} />
      <path d="M-10 80 C 50 54, 120 50, 172 66 S 262 50, 330 64 L 330 170 L -10 170 Z" fill="#c4e6c9" />
      <Kit name="antena/antena-404" cx={228} ground={64} k={0.045} w={648} h={1196} />
      <CoverHouse road={road} name="facade-terrea-amarelo" x={14} k={0.15} w={468} h={390} />
      <CoverHouse road={road} name="facade-sobrado-rosa" x={78} k={0.15} w={428} h={648} />
      <CoverHouse road={road} name="facade-terrea-lilas" x={146} k={0.15} w={468} h={390} />
      <Kit name="sample/poste" cx={186} ground={lane(186, -COVER_STREET - 22)} k={0.14} w={308} h={656} />
      <CoverHouse road={road} name="facade-mercadinho-pessego" x={226} k={0.15} w={508} h={416} />
      <Kit name="sample/ipe" cx={300} ground={lane(300, -COVER_STREET - 22)} k={0.17} w={448} h={486} />
      <Street road={road} width={COVER_STREET} />
      <Shadow x={bruno.x} y={bruno.y} w={52} angle={a} />
      <Dust x={bruno.x - 34} y={bruno.y} angle={a} r={4} />
      <Racer who="bruno" x={bruno.x} y={bruno.y} s={s} angle={a} face="panic" arm="grip" />
      <Shadow x={lina.x} y={lina.y} w={56} angle={a} />
      <Dust x={lina.x - 36} y={lina.y} angle={a} r={4} />
      <Racer who="lina" x={lina.x} y={lina.y} s={s} angle={a} face="strain" arm="grip" spin={20} />
      <RoadHump road={road} x={bump.x} w={bump.w} h={bump.h} />
      <Shadow x={mila.x} y={mila.y} w={62} angle={a} />
      <Dust x={mila.x - 40} y={mila.y} angle={a} r={5} />
      <Racer who="mila" x={mila.x} y={mila.y} s={s} angle={a} face="smug" />
      <Shadow x={deco.x + 6} y={lane(deco.x + 6, 0)} w={46} angle={a} opacity={0.16} />
      <Dots from={{ x: crest.x + 3, y: crest.y - 4 }} via={{ x: crest.x + 12, y: crest.y - 16 }} to={{ x: deco.x - 24, y: deco.y - 4 }} n={3} r={1.8} />
      <Racer who="deco" x={deco.x} y={deco.y} s={s} angle={-12} face="happy" arm="up" reach={-24} />
    </>
  );
}

const PANEL_STREET = 80;

function Panel({ children, road }: { children: React.ReactNode; road: Road }) {
  const far = roadAt(road, 200) - (PANEL_STREET + 26) * road.s + 4;
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      <rect width={200} height={130} fill={C.sky} />
      <circle cx={168} cy={22} r={13} fill={C.sun} />
      <Cloud x={112} y={18} s={0.42} />
      <Kit name="sample/bg-telhados" cx={100} ground={far} k={0.16} w={1600} h={360} opacity={0.95} />
      <Street road={road} width={PANEL_STREET} />
      {children}
    </svg>
  );
}

function Arrow({ d, head, color = P.white }: { d: string; head: string; color?: string }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={P.ink} strokeWidth={4.6} />
      <path d={head} stroke={P.ink} strokeWidth={4.6} />
      <path d={d} stroke={color} strokeWidth={2} />
      <path d={head} stroke={color} strokeWidth={2} />
    </g>
  );
}

function ChargeRing({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 1.36} fill={P.ink} opacity={0.55} />
      <circle cx={x} cy={y} r={r} fill="none" stroke="#ff7a1a" strokeWidth={r * 0.4} />
      <ArrowBigUp x={x - r * 0.62} y={y - r * 0.66} width={r * 1.24} height={r * 1.24} fill="#ff7a1a" stroke="#ff7a1a" strokeWidth={2.4} />
    </g>
  );
}

const JUMP = localized({ "pt-BR": "PULA!", en: "JUMP!" });
const PERFECT = localized({ "pt-BR": "PERFEITO!", en: "PERFECT!" });
const FLIP = localized({ "pt-BR": "MORTAL!", en: "FLIP!" });
const WHEELIE = localized({ "pt-BR": "EMPINADA!", en: "WHEELIE!" });

function RollPanel({ locale }: { locale: Locale }) {
  const road: Road = { x0: -10, y0: 58, x1: 210, y1: 134, s: 0.36 };
  const a = roadAngle(road);
  const s = road.s;
  const deco = { x: 60, y: roadAt(road, 60) };
  const ramp = { x0: 126, len: 120, rise: 66 };
  const lip = { x: ramp.x0 + ramp.len * s, y: roadAt(road, ramp.x0 + ramp.len * s) - ramp.rise * s };
  return (
    <Panel road={road}>
      <Ramp road={road} x0={ramp.x0} len={ramp.len} rise={ramp.rise} back={-24} />
      <Shadow x={deco.x} y={deco.y} w={50} angle={a} />
      <SpeedLines x={deco.x - 40} y={deco.y - 16} angle={a} s={s} rows={[[-60, -10, -70], [-20, -30, -100], [20, -10, -60]]} />
      <Racer who="deco" x={deco.x} y={deco.y} s={s} angle={a} face="strain" arm="grip" crouch />
      <ChargeRing x={deco.x - 2} y={deco.y - 62} r={7} />
      <Arrow d={`M${lip.x} ${r1(lip.y - 24)} L${lip.x} ${r1(lip.y - 8)}`} head={`M${lip.x - 5} ${r1(lip.y - 13)} L${lip.x} ${r1(lip.y - 7)} L${lip.x + 5} ${r1(lip.y - 13)}`} color={P.sun} />
      <Shout x={lip.x - 2} y={r1(lip.y - 30)} text={JUMP[locale]} size={14} color={P.sun} rotate={-6} />
    </Panel>
  );
}

function LandPanel({ locale }: { locale: Locale }) {
  const road: Road = { x0: -10, y0: 84, x1: 210, y1: 124, s: 0.34 };
  const a = roadAngle(road);
  const s = road.s;
  const rad = (a * Math.PI) / 180;
  const land = { x: 142, y: roadAt(road, 142) };
  const lina = { x: 62, y: 74 };
  const at = (u: number, v: number) => ({ x: r1(land.x + (u * Math.cos(rad) - v * Math.sin(rad)) * s), y: r1(land.y + (u * Math.sin(rad) + v * Math.cos(rad)) * s) });
  const box = [at(-80, -24), at(80, -24), at(80, -74), at(-80, -74)];
  const wheels = [at(-50, -12), at(50, -12)];
  const fan = (spread: number) => {
    const r = 150 * s;
    const p0 = { x: r1(land.x + Math.cos(rad - spread) * r), y: r1(land.y + Math.sin(rad - spread) * r) };
    const p1 = { x: r1(land.x + Math.cos(rad + spread) * r), y: r1(land.y + Math.sin(rad + spread) * r) };
    return `M${land.x} ${r1(land.y)} L${p0.x} ${p0.y} A ${r} ${r} 0 0 1 ${p1.x} ${p1.y} Z`;
  };
  return (
    <Panel road={road}>
      <path d={fan(0.36)} fill={C.dash} opacity={0.24} />
      <path d={fan(0.16)} fill={C.perfect} opacity={0.5} />
      <path d={`M${box.map((p) => `${p.x} ${p.y}`).join(" L")} Z`} fill={C.perfect} fillOpacity={0.24} stroke={C.perfect} strokeWidth={1.8} strokeLinejoin="round" />
      {wheels.map((w) => (
        <circle key={w.x} cx={w.x} cy={w.y} r={12 * s} fill="none" stroke={C.perfect} strokeWidth={1.8} />
      ))}
      <circle cx={land.x} cy={r1(land.y)} r={3.4} fill={P.ink} />
      <circle cx={land.x} cy={r1(land.y)} r={2} fill={C.perfect} />
      <Dots from={{ x: lina.x + 34, y: lina.y + 10 }} via={{ x: 112, y: 78 }} to={{ x: land.x - 12, y: land.y - 24 }} n={4} r={1.6} />
      <Arrow d={`M${lina.x + 22} ${lina.y - 52} Q${lina.x + 52} ${lina.y - 44} ${lina.x + 50} ${lina.y - 12}`} head={`M${lina.x + 44} ${lina.y - 18} L${lina.x + 50} ${lina.y - 10} L${lina.x + 56} ${lina.y - 18}`} />
      <Racer who="lina" x={lina.x} y={lina.y} s={s} angle={a} face="wow" spin={30} />
      <Shout x={160} y={60} text={PERFECT[locale]} size={13} color={C.perfect} rotate={-6} />
    </Panel>
  );
}

function ShowPanel({ locale }: { locale: Locale }) {
  const road: Road = { x0: -10, y0: 104, x1: 210, y1: 140, s: 0.3 };
  const a = roadAngle(road);
  const s = road.s;
  const mila = { x: 60, y: roadAt(road, 60) };
  const pivot = RIGS.mila.wheels[0][1] * s;
  const bruno = { x: 112, y: 66 };
  return (
    <Panel road={road}>
      <Shadow x={mila.x} y={mila.y} w={44} angle={a} />
      <g transform={`rotate(-16 ${r1(mila.x + pivot)} ${r1(mila.y)})`}>
        <Racer who="mila" x={mila.x} y={mila.y} s={s} angle={a} face="smug" arm="up" reach={-24} />
      </g>
      <Arrow d={`M${bruno.x + 30} ${bruno.y + 8} A 38 38 0 1 0 ${bruno.x - 30} ${bruno.y + 16}`} head={`M${bruno.x - 37} ${bruno.y + 10} L${bruno.x - 30} ${bruno.y + 17} L${bruno.x - 22} ${bruno.y + 12}`} />
      <Racer who="bruno" x={bruno.x} y={bruno.y} s={s} angle={-24} face="happy" arm="up" reach={-24} />
      <Shout x={164} y={26} text={FLIP[locale]} size={11} color={P.white} rotate={-6} />
      <Shout x={164} y={43} text={WHEELIE[locale]} size={10} color={P.white} rotate={-4} />
      <Shout x={170} y={80} text="×5" size={30} color={P.sun} rotate={-8} />
    </Panel>
  );
}

export function DownhillDerbyHowToPanel({ step, locale }: { step: 0 | 1 | 2; locale: Locale }) {
  if (step === 0) return <RollPanel locale={locale} />;
  if (step === 1) return <LandPanel locale={locale} />;
  return <ShowPanel locale={locale} />;
}

const CAST_LINE = 2.4;

function CastStreet({ road, l, r }: { road: Road; l: number; r: number }) {
  const s = road.s;
  const yl = roadAt(road, l);
  const yr = roadAt(road, r);
  const top = (y: number) => r1(y - 158 * s);
  const bot = (y: number) => r1(y + 24 * s);
  const k = 7;
  const shape = `M${l + k} ${top(yl) + 1} L${r - k} ${top(yr) - 1} Q${r} ${top(yr)} ${r} ${top(yr) + k} L${r} ${bot(yr) - k} Q${r} ${bot(yr)} ${r - k} ${bot(yr)} L${l + k} ${bot(yl)} Q${l} ${bot(yl)} ${l} ${bot(yl) - k} L${l} ${top(yl) + k} Q${l} ${top(yl)} ${l + k} ${top(yl) + 1} Z`;
  return (
    <g>
      <clipPath id="dd-cast-street">
        <path d={shape} />
      </clipPath>
      <g clipPath="url(#dd-cast-street)">
        <Street road={{ ...road, x0: l - 10, y0: roadAt(road, l - 10), x1: r + 10, y1: roadAt(road, r + 10) }} deep={60} />
      </g>
      <path d={shape} fill="none" stroke={P.ink} strokeWidth={CAST_LINE} strokeLinejoin="round" />
    </g>
  );
}

function CastIntro() {
  const road: Road = { x0: 0, y0: 160, x1: 300, y1: 202, s: 0.42 };
  const a = roadAngle(road);
  const s = road.s;
  const at = (x: number, l: number) => ({ x, y: roadAt(road, x) + l * s });
  const mila = at(74, -126);
  const bruno = at(128, -84);
  const lina = at(184, -42);
  const deco = at(240, 0);
  return (
    <>
      <CastStreet road={road} l={8} r={292} />
      <Racer who="mila" x={mila.x} y={mila.y} s={s} angle={a} face="smug" />
      <Racer who="bruno" x={bruno.x} y={bruno.y} s={s} angle={a} face="strain" arm="grip" />
      <Racer who="lina" x={lina.x} y={lina.y} s={s} angle={a} face="happy" spin={24} />
      <SpeedLines x={deco.x - 44} y={deco.y - 30} angle={a} s={s} rows={[[-50, -10, -60], [-10, -20, -80]]} />
      <Racer who="deco" x={deco.x} y={deco.y} s={s} angle={a} face="happy" arm="grip" crouch />
    </>
  );
}

function Burst({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={P.ink} strokeWidth={CAST_LINE} />;
}

function Confetti({ x, y, a, c }: { x: number; y: number; a: number; c: string }) {
  return <rect x={x - 5} y={y - 3} width={10} height={6} rx={1.5} fill={c} stroke={P.ink} strokeWidth={1.4} transform={`rotate(${a} ${x} ${y})`} />;
}

const WIN_SCALE: Record<RiderId, number> = { deco: 0.6, lina: 0.5, bruno: 0.56, mila: 0.48 };
const WIN_X: Record<RiderId, number> = { deco: 98, lina: 112, bruno: 96, mila: 106 };

function CastWin({ who }: { who: RiderId }) {
  const s = WIN_SCALE[who];
  const top = 138;
  return (
    <>
      <Burst cx={100} cy={94} r={82} fill={P.sunPale} />
      <ellipse cx={100} cy={180} rx={70} ry={6} fill={P.ink} opacity={0.2} />
      <g stroke={P.ink} strokeWidth={CAST_LINE} strokeLinejoin="round">
        <rect x={20} y={156} width={44} height={22} fill={P.steel} />
        <rect x={136} y={162} width={44} height={16} fill={P.tangerine} />
        <rect x={52} y={top} width={96} height={40} fill={P.sun} />
        <path d={`M53 ${top + 7} L147 ${top + 7}`} stroke={P.sunDeep} strokeWidth={4} />
      </g>
      <g style={display}>
        <text x={100} y={top + 34} textAnchor="middle" fontSize={22} fill={P.ink}>
          1
        </text>
        <text x={42} y={174} textAnchor="middle" fontSize={14} fill={P.ink}>
          2
        </text>
        <text x={158} y={177} textAnchor="middle" fontSize={12} fill={P.ink}>
          3
        </text>
      </g>
      <Racer who={who} x={WIN_X[who]} y={top} s={s} face="happy" arm="up" reach={-34} />
      <Star x={24} y={72} r={11} rotate={-14} line={2} />
      <Star x={178} y={96} r={9} rotate={12} line={2} />
      <Star x={34} y={124} r={6} rotate={8} line={1.6} />
      <Star x={168} y={40} r={7} rotate={20} line={1.6} />
      <Confetti x={150} y={18} a={30} c={P.tomato} />
      <Confetti x={30} y={30} a={-24} c={P.mint} />
      <Confetti x={186} y={140} a={16} c={P.bubblegum} />
      <Confetti x={14} y={102} a={60} c={P.sky} />
    </>
  );
}

const LOSE_SCALE: Record<RiderId, number> = { deco: 0.48, lina: 0.44, bruno: 0.46, mila: 0.42 };
const BACK_FLY: Record<RiderId, { from: Pt; to: Pt; turn: number }> = {
  deco: { from: { x: -84, y: -120 }, to: { x: 44, y: 54 }, turn: -38 },
  lina: { from: { x: -131, y: -92 }, to: { x: 44, y: 54 }, turn: -38 },
  bruno: { from: { x: 15, y: -134 }, to: { x: 62, y: 46 }, turn: -16 },
  mila: { from: { x: -91, y: -176 }, to: { x: 46, y: 56 }, turn: -38 },
};

function CastLose({ who }: { who: RiderId }) {
  const s = LOSE_SCALE[who];
  const rig = RIGS[who];
  const ground = 166;
  const cart = { x: 64, y: ground };
  const rear = rig.wheels.filter(([, wx]) => wx < 0);
  const loose = rig.wheels.find(([, wx]) => wx > 0)!;
  const ws = WHEEL[loose[0]] * s;
  const back = BACK_FLY[who];
  const seat = { x: 146, y: ground - 3 };
  const tip = -12;
  const head = { x: seat.x - 12 * s, y: seat.y - 140 * s };
  return (
    <>
      <Burst cx={100} cy={94} r={82} fill="#ffc9c2" />
      <path d={`M14 ${ground} L186 ${ground}`} stroke={P.ink} strokeWidth={CAST_LINE} strokeLinecap="round" />
      <ellipse cx={104} cy={ground + 2} rx={78} ry={5} fill={P.ink} opacity={0.2} />
      <g transform={`translate(${back.to.x} ${back.to.y}) rotate(${back.turn}) scale(${s}) translate(${-back.from.x} ${-back.from.y})`}>
        <Sheet name={`cart-${who}-back`} box={rig.back} />
        {rig.fan && <image href={`${ART}/fan-blades.svg`} x={rig.fan.x - 36} y={rig.fan.y - 36} width={72} height={72} />}
      </g>
      <Speed d="M20 52 Q14 64 18 76 M30 40 Q22 50 22 60" w={2} />
      <g transform={`translate(${cart.x} ${cart.y}) rotate(10 ${r1(rear[0][1] * s)} 0) scale(${s})`}>
        <Sheet name={`cart-${who}-front`} box={rig.front} />
        {rear.map(([kind, wx, wr]) => (
          <image key={wx} href={`${ART}/wheel-${kind}.svg`} x={wx - WHEEL[kind] / 2} y={-wr - WHEEL[kind] / 2} width={WHEEL[kind]} height={WHEEL[kind]} />
        ))}
      </g>
      <Puff x={r1(cart.x + 52 * s * 2)} y={ground - 8} r={10} />
      <Puff x={20} y={ground - 6} r={8} opacity={0.85} />
      <image href={`${ART}/wheel-${loose[0]}.svg`} x={r1(176 - ws / 2)} y={r1(96 - ws / 2)} width={r1(ws)} height={r1(ws)} transform="rotate(30 176 96)" />
      <path d={`M${r1(176 - ws / 2 - 6)} ${r1(96 + ws / 2 + 2)} Q164 124 160 136`} fill="none" stroke={P.ink} strokeWidth={1.6} strokeDasharray="0.1 4" strokeLinecap="round" />
      <Speed d="M186 76 L192 68 M192 86 L198 82" w={2} />
      <g transform={`translate(${seat.x} ${seat.y}) rotate(${tip}) scale(${s})`}>
        <Rider who={who} face="dizzy" arm="flail" />
      </g>
      <g transform={`translate(${r1(head.x)} ${r1(head.y - 8)})`}>
        <ellipse rx={20} ry={5} fill="none" stroke={P.ink} strokeWidth={1.2} strokeDasharray="2 3" opacity={0.6} />
        <Star x={-16} y={-1} r={6} />
        <Star x={2} y={-6} r={5} />
        <Star x={17} y={2} r={5.5} />
      </g>
    </>
  );
}

export function DownhillDerbyCast({ mood, featured, className }: { mood: "intro" | "win" | "lose"; featured?: string; locale: Locale; className?: string }) {
  const who = isRider(featured) ? featured : "deco";
  return (
    <svg viewBox={mood === "intro" ? "0 0 300 210" : "0 0 200 190"} className={className} aria-hidden overflow="visible">
      {mood === "intro" ? <CastIntro /> : mood === "win" ? <CastWin who={who} /> : <CastLose who={who} />}
    </svg>
  );
}
