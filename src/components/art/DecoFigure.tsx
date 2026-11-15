import type React from "react";
import { P } from "@/lib/palette";

export type DecoPose = "arrive" | "walk" | "ask";
export type DecoFace = "puzzled" | "curious" | "ask";

const SKIN = P.skinTan;
const SHADE = P.skinTanShade;
const FAR_SKIN = "#c98b5c";
const SHORTS = "#3f6fd8";
const SHORTS_SHADE = "#2d50a8";
const SOLE = "#fffaf0";
const BANDAGE = "#f7e0c2";
const BANDAGE_PAD = "#ebc79c";
const BANDAGE_DOT = "#cf9d6e";
const HEAD = 0.6;
const ARM = 9;

function stroke(width: number) {
  return { stroke: P.ink, strokeWidth: width, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
}

function Limb({ d, color }: { d: string; color: string }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={P.ink} strokeWidth={ARM * 2} />
      <path d={d} stroke={color} strokeWidth={ARM} />
    </g>
  );
}

function Hand({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={9} fill={SKIN} {...stroke(4)} />;
}

function Shoe({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 L0 11 Q0 18 8 18 L26 18 Q33 18 32 11 Q30 5 19 4 L19 0 Z" fill={P.tomato} {...stroke(4)} />
      <path d="M1.5 14 L30 14" stroke={SOLE} strokeWidth="3" />
    </g>
  );
}

function Torso() {
  return (
    <g>
      <path d="M51 166 L101 166 L104 186 L48 186 Z" fill={SHORTS} {...stroke(5)} />
      <path d="M54 168 L62 168 L60 184 L52 184 Z" fill={SHORTS_SHADE} />
      <path d="M52 124 Q52 110 64 110 L86 110 Q100 110 100 124 L102 168 L50 168 Z" fill={P.sun} {...stroke(5)} />
      <path d="M57 114 Q54 117 54 128 L52.5 166 L61 166 Z" fill={P.sunDeep} />
      <path d="M51.5 142 L100.8 142" stroke={P.tomato} strokeWidth="8" />
      <path d="M52 124 Q52 110 64 110 L86 110 Q100 110 100 124 L102 168 L50 168 Z" fill="none" {...stroke(5)} />
    </g>
  );
}

function Stand() {
  return (
    <g>
      <Limb d="M70 182 L65 199" color={FAR_SKIN} />
      <Limb d="M82 182 L90 199" color={SKIN} />
      <Shoe x={52} y={195} />
      <Shoe x={82} y={195} />
    </g>
  );
}

const EYES: Record<DecoFace, { ry: number; r: number; look: [number, number] }> = {
  puzzled: { ry: 13.5, r: 6, look: [5, -2] },
  curious: { ry: 15, r: 5.6, look: [6, 1] },
  ask: { ry: 14, r: 6, look: [6, -2] },
};

const BROWS: Record<DecoFace, string> = {
  puzzled: "M62 84 Q76 69 92 79 M108 95 L135 90",
  curious: "M64 82 Q78 71 92 79 M108 79 Q122 70 135 78",
  ask: "M64 85 Q78 76 92 82 M108 81 Q122 70 135 77",
};

function Mouth({ face }: { face: DecoFace }) {
  if (face === "puzzled") return <path d="M88 147 Q94 142 100 147 Q106 152 113 145" fill="none" {...stroke(5)} />;
  if (face === "curious") return <ellipse cx="101" cy="148" rx="6.2" ry="7.6" fill={P.ink} />;
  return (
    <g>
      <path d="M90 140 Q101 137 112 140 Q111 156 101 157 Q91 156 90 140 Z" fill={P.ink} {...stroke(4)} />
      <path d="M93 141 L109 141 L108.5 145 L93.5 145 Z" fill={P.white} />
      <rect x="99.6" y="140.5" width="3" height="5" fill={P.ink} />
      <path d="M95 152 Q101 148 107 152 Q101 155 95 152 Z" fill={P.bubblegum} />
    </g>
  );
}

function Bandage({ w }: { w: number }) {
  return (
    <g transform="translate(135 131) rotate(-17)">
      <path d="M-11 -5 Q0 -6.2 10.6 -4.2 Q12.6 0 10.6 4.2 Q0 6.1 -11 5 Q-13.2 0 -11 -5 Z" fill={BANDAGE} {...stroke(w)} />
      <rect x="-3.6" y="-3.3" width="8" height="6.4" rx="1.8" fill={BANDAGE_PAD} stroke={P.ink} strokeWidth={w * 0.55} />
      <g fill={BANDAGE_DOT}>
        <circle cx="-7.6" cy="-1.7" r="0.8" />
        <circle cx="-7.6" cy="1.7" r="0.8" />
        <circle cx="7.6" cy="-1.5" r="0.75" />
        <circle cx="7.6" cy="1.5" r="0.75" />
      </g>
    </g>
  );
}

function Head({ face }: { face: DecoFace }) {
  const e = EYES[face];
  const [dx, dy] = e.look;
  return (
    <g transform={`translate(17 0) scale(${HEAD})`}>
      <path d="M84 150 L84 180 Q100 188 116 180 L116 150 Z" fill={SKIN} {...stroke(4)} />
      <path d="M84 158 Q100 170 116 158 L116 168 Q100 178 84 168 Z" fill={SHADE} />
      <ellipse cx="50" cy="114" rx="12" ry="15" fill={SKIN} {...stroke(4)} />
      <path d="M50 106 Q48 54 100 52 Q152 54 150 106 Q152 162 100 164 Q48 162 50 106 Z" fill={SKIN} {...stroke(5)} />
      <path d="M140 84 Q156 118 136 152 Q122 162 104 162 Q140 142 140 84 Z" fill={SHADE} opacity="0.65" />
      <path d="M44 96 L30 70 L54 72 L44 40 L74 56 L80 20 L100 48 L118 16 L126 52 L156 34 L148 66 L176 66 L156 92 Q150 76 132 74 Q118 84 100 74 Q82 86 66 76 Q52 82 44 96 Z" fill={P.tangerineDeep} {...stroke(5)} />
      <path d="M46 98 L30 112 L50 116 L40 134 L58 126 Q52 112 56 100 Z" fill={P.tangerineDeep} {...stroke(4)} />
      <path d="M78 40 L90 56 M120 34 L118 54 M58 60 L70 68" stroke={P.tangerine} strokeWidth="4" strokeLinecap="round" />
      <g fill={SHADE}>
        <circle cx="84" cy="133" r="2.4" />
        <circle cx="78" cy="139" r="2.4" />
        <circle cx="89" cy="140" r="2" />
      </g>
      <Bandage w={3} />
      <g transform="translate(16 0)">
        {[80, 120].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy="110" rx="12" ry={e.ry} fill={P.white} {...stroke(4)} />
            <circle cx={cx + 2 + dx} cy={111 + dy} r={e.r} fill={P.ink} />
            <circle cx={cx + 4 + dx} cy={108 + dy} r="1.8" fill={P.white} />
          </g>
        ))}
        <path d={BROWS[face]} fill="none" {...stroke(6)} />
        <path d="M100 118 Q94 128 104 130" fill="none" {...stroke(3.5)} />
        <Mouth face={face} />
      </g>
    </g>
  );
}

function Suitcase() {
  return (
    <g>
      <path d="M16 160 L16 142 M34 160 L34 142" stroke={P.ink} strokeWidth="4.5" strokeLinecap="round" />
      <rect x="10" y="136.5" width="30" height="7.5" rx="3.75" fill={P.plum700} {...stroke(3.5)} />
      <rect x="0" y="158" width="50" height="50" rx="8" fill={P.mint} {...stroke(5)} />
      <path d="M41 162 L46 163 L46 203 L41 204 Z" fill={P.mintDeep} opacity="0.7" />
      <path d="M0 177 L50 177 L50 186 L0 186 Z" fill={P.sun} stroke={P.ink} strokeWidth="3" />
      <circle cx="12" cy="168" r="5" fill={P.tomato} stroke={P.ink} strokeWidth="2.5" />
      <path d="M25 192 L37 190.5 L38 200 L26 201.5 Z" fill={P.paper} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M28.5 194 L35 193.2 M28.5 197.5 L34 196.8" stroke={P.plum500} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="0" y="158" width="50" height="50" rx="8" fill="none" {...stroke(5)} />
      <circle cx="9" cy="210" r="3.2" fill={P.ink} />
      <circle cx="41" cy="210" r="3.2" fill={P.ink} />
    </g>
  );
}

function TouristMap() {
  const w = 3.5;
  return (
    <g transform="translate(96 123) rotate(-8) scale(1.12)">
      <path d="M0 2 L15 0 L30 2 L45 0 L45 29 L30 31 L15 29 L0 31 Z" fill={P.skyPale} stroke={P.ink} strokeWidth={w} strokeLinejoin="round" />
      <path d="M6 11 Q14 4 23 9 Q33 5 38 13 Q41 22 30 25 Q19 28 10 23 Q2 18 6 11 Z" fill={P.lime} stroke={P.ink} strokeWidth={w * 0.7} strokeLinejoin="round" />
      <path d="M11 19 Q19 12 27 16 Q31 18 33 13" fill="none" stroke={P.tomato} strokeWidth="2.4" strokeDasharray="2.5 3" strokeLinecap="round" />
      <circle cx="33.5" cy="12" r="2.8" fill={P.tomato} stroke={P.ink} strokeWidth={w * 0.5} />
      <path d="M15 0 L15 29 L30 31 L30 2 Z" fill={P.ink} opacity="0.12" />
      <path d="M15 0 L15 29 M30 2 L30 31" stroke={P.ink} strokeWidth={w * 0.6} />
    </g>
  );
}

function body(pose: DecoPose): { before: React.ReactNode; after?: React.ReactNode } {
  if (pose === "arrive") {
    return {
      before: (
        <>
          <Suitcase />
          <Limb d="M70 122 Q46 126 28 138" color={P.sunDeep} />
          <Hand x={25} y={140} />
          <Stand />
          <Torso />
          <TouristMap />
          <Limb d="M86 124 Q98 136 100 142" color={P.sun} />
          <Hand x={100} y={145} />
        </>
      ),
    };
  }
  if (pose === "walk") {
    return {
      before: (
        <>
          <Limb d="M72 122 Q62 136 52 146" color={P.sunDeep} />
          <Hand x={50} y={149} />
          <Limb d="M70 182 L52 198" color={FAR_SKIN} />
          <Limb d="M80 182 L102 196" color={SKIN} />
          <Shoe x={36} y={193} />
          <Shoe x={95} y={191} />
          <Torso />
          <Limb d="M86 124 Q104 130 118 124" color={P.sun} />
          <g fill="none" strokeLinecap="round">
            <path d="M124 120 L134 115.5" stroke={P.ink} strokeWidth="9" />
            <path d="M124 120 L134 115.5" stroke={SKIN} strokeWidth="3.6" />
          </g>
          <Hand x={121} y={122} />
        </>
      ),
    };
  }
  return {
    before: (
      <>
        <Limb d="M72 122 Q64 144 62 158" color={P.sunDeep} />
        <Hand x={62} y={161} />
        <Stand />
        <Torso />
      </>
    ),
    after: (
      <>
        <Limb d="M88 124 Q106 136 121 138" color={P.sun} />
        <Hand x={124} y={138} />
      </>
    ),
  };
}

const REF = { cx: 76, feet: 213, tall: 203 };

export function DecoFigure({ pose, face, x, feet, h, flip = false, tilt = 0 }: { pose: DecoPose; face: DecoFace; x: number; feet: number; h: number; flip?: boolean; tilt?: number }) {
  const s = h / REF.tall;
  const parts = body(pose);
  return (
    <g transform={`translate(${x} ${feet}) scale(${flip ? -s : s} ${s}) translate(${-REF.cx} ${-REF.feet})`}>
      {parts.before}
      <g transform={`rotate(${tilt} 77 104)`}>
        <Head face={face} />
      </g>
      {parts.after}
    </g>
  );
}
