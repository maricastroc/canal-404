"use client";

import { useEffect, useId, useState } from "react";
import { P } from "@/lib/palette";

export type MascotExpression =
  | "neutral"
  | "happy"
  | "excited"
  | "surprised"
  | "wink"
  | "sleepy"
  | "confused"
  | "sad"
  | "dizzy"
  | "love"
  | "static";

export type MascotPose = "head" | "peek" | "full" | "controller" | "wave";

type Props = {
  expression?: MascotExpression;
  pose?: MascotPose;
  look?: { x: number; y: number };
  className?: string;
  title?: string;
  wiggle?: number;
  frame?: { x: number; y: number; width: number; height: number };
};

const S = 5;

function useBlink(enabled: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    let open: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setClosed(true);
        open = setTimeout(() => {
          setClosed(false);
          schedule();
        }, 130);
      }, 2200 + Math.random() * 3800);
    };
    schedule();
    return () => {
      clearTimeout(timer);
      clearTimeout(open);
    };
  }, [enabled]);
  return closed;
}

function Eyes({ expression, closed }: { expression: MascotExpression; closed: boolean }) {
  if (expression === "static") return null;
  if (expression === "dizzy") {
    return (
      <g fill="none" stroke={P.ink} strokeWidth="3.6" strokeLinecap="round">
        <path d="M74 88 m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -10 0 a8 8 0 1 1 16 0 a11 11 0 1 1 -22 0" />
        <path d="M112 88 m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -10 0 a8 8 0 1 1 16 0 a11 11 0 1 1 -22 0" />
      </g>
    );
  }
  if (expression === "love") {
    const heart = "M0 4 C-10 -6 -18 6 0 16 C18 6 10 -6 0 4 Z";
    return (
      <g fill={P.tomato} stroke={P.ink} strokeWidth="3" strokeLinejoin="round">
        <path d={heart} transform="translate(73 80)" />
        <path d={heart} transform="translate(111 80)" />
      </g>
    );
  }
  if (closed || expression === "sleepy") {
    return (
      <g fill="none" stroke={P.ink} strokeWidth="4.5" strokeLinecap="round">
        <path d={expression === "sleepy" ? "M64 92 Q74 97 84 92" : "M64 90 Q74 95 84 90"} />
        <path d={expression === "sleepy" ? "M102 92 Q112 97 122 92" : "M102 90 Q112 95 122 90"} />
      </g>
    );
  }
  if (expression === "wink") {
    return (
      <g>
        <path d="M64 92 Q74 82 84 92" fill="none" stroke={P.ink} strokeWidth="4.5" strokeLinecap="round" />
        <ellipse cx="112" cy="88" rx="9" ry="14" fill={P.ink} />
        <ellipse cx="115" cy="82" rx="3.2" ry="4.2" fill={P.white} />
      </g>
    );
  }
  if (expression === "happy" || expression === "excited") {
    if (expression === "happy") {
      return (
        <g fill="none" stroke={P.ink} strokeWidth="4.8" strokeLinecap="round">
          <path d="M63 93 Q74 78 85 93" />
          <path d="M101 93 Q112 78 123 93" />
        </g>
      );
    }
  }
  const big = expression === "surprised" || expression === "excited";
  const confused = expression === "confused";
  const sad = expression === "sad";
  return (
    <g>
      <ellipse cx="74" cy="88" rx={big ? 11 : 9} ry={big ? 17 : confused ? 10 : 14} fill={P.ink} />
      <ellipse cx="112" cy="88" rx={big ? 11 : 9} ry={big ? 17 : 14} fill={P.ink} />
      <ellipse cx={big ? 78 : 77} cy={big ? 80 : 82} rx="3.4" ry="4.4" fill={P.white} />
      <ellipse cx={big ? 116 : 115} cy={big ? 80 : 82} rx="3.4" ry="4.4" fill={P.white} />
      {expression === "excited" && (
        <g fill={P.white}>
          <circle cx="70" cy="95" r="1.8" />
          <circle cx="108" cy="95" r="1.8" />
        </g>
      )}
      {sad && (
        <g fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round">
          <path d="M62 70 L84 66" />
          <path d="M102 66 L124 70" />
        </g>
      )}
      {confused && <path d="M100 68 L124 63" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />}
    </g>
  );
}

function Mouth({ expression }: { expression: MascotExpression }) {
  const common = { stroke: P.ink, strokeWidth: 4.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (expression) {
    case "happy":
    case "excited":
    case "love":
      return (
        <g>
          <path d="M78 112 Q93 134 108 112 Z" fill={P.ink} {...common} />
          <path d="M86 122 Q93 128 100 122 Q94 118 86 122 Z" fill={P.bubblegum} />
        </g>
      );
    case "wink":
      return <path d="M80 114 Q93 128 106 113" fill="none" {...common} />;
    case "surprised":
      return <ellipse cx="93" cy="120" rx="7" ry="9" fill={P.ink} />;
    case "sleepy":
      return <ellipse cx="93" cy="119" rx="4.5" ry="5" fill={P.ink} />;
    case "confused":
      return <path d="M80 120 Q86 114 92 120 T104 120" fill="none" {...common} />;
    case "sad":
      return <path d="M82 124 Q93 112 104 124" fill="none" {...common} />;
    case "dizzy":
      return <path d="M78 120 Q83 114 88 120 T98 120 T108 120" fill="none" {...common} />;
    case "static":
      return null;
    default:
      return <path d="M84 116 Q93 123 102 116" fill="none" {...common} />;
  }
}

function StaticScreen({ id }: { id: string }) {
  return (
    <g>
      <rect x="40" y="48" width="104" height="92" rx="20" fill={P.steel} />
      <g clipPath={`url(#${id}-screen)`}>
        <rect x="40" y="48" width="104" height="92" fill={`url(#${id}-static)`} />
        <text
          x="92"
          y="112"
          textAnchor="middle"
          fontSize="44"
          fill={P.plum800}
          style={{ fontFamily: "var(--font-luckiest)" }}
          opacity="0.7"
        >
          ??
        </text>
      </g>
    </g>
  );
}

function Head({
  expression,
  look,
  closed,
  id,
  wiggle,
}: {
  expression: MascotExpression;
  look: { x: number; y: number };
  closed: boolean;
  id: string;
  wiggle: number;
}) {
  const lx = Math.max(-1, Math.min(1, look.x)) * 7;
  const ly = Math.max(-1, Math.min(1, look.y)) * 5;
  const isStatic = expression === "static";
  return (
    <g>
      <defs>
        <clipPath id={`${id}-screen`}>
          <rect x="40" y="48" width="104" height="92" rx="20" />
        </clipPath>
        <pattern id={`${id}-static`} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={P.steel} />
          <rect x="1" y="2" width="3" height="2" fill={P.white} />
          <rect x="7" y="6" width="4" height="2" fill={P.steelDeep} />
          <rect x="3" y="9" width="2" height="2" fill={P.white} opacity="0.7" />
          <rect x="9" y="1" width="2" height="2" fill={P.ink} opacity="0.4" />
        </pattern>
      </defs>
      <g
        style={{
          transformOrigin: "100px 34px",
          transformBox: "view-box",
          animation: wiggle ? `wobble 0.5s ease-in-out 2` : undefined,
        }}
        key={wiggle}
      >
        <path d="M100 36 L72 6" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
        <path d="M102 36 L136 8" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
        <circle cx="71" cy="6" r="7.5" fill={P.tomato} stroke={P.ink} strokeWidth="4" />
        <circle cx="137" cy="7" r="7.5" fill={P.sun} stroke={P.ink} strokeWidth="4" />
        <circle cx="69" cy="4" r="2" fill={P.white} />
        <circle cx="135" cy="5" r="2" fill={P.white} />
      </g>
      <path d="M22 92 Q20 20 100 18 Q180 20 178 92" fill="none" stroke={P.ink} strokeWidth="17" strokeLinecap="round" />
      <path d="M22 92 Q20 20 100 18 Q180 20 178 92" fill="none" stroke={P.plum500} strokeWidth="9" strokeLinecap="round" />
      <path
        d="M52 36 Q58 31 100 31 Q146 31 151 36 Q174 40 174 66 L174 128 Q174 158 146 160 L56 161 Q27 160 26 130 L26 66 Q26 40 52 36 Z"
        fill={P.cream}
        stroke={P.ink}
        strokeWidth={S}
        strokeLinejoin="round"
      />
      <path d="M160 46 Q170 52 170 70 L170 128 Q170 152 146 155 L70 156 Q140 150 158 132 Q164 100 160 46 Z" fill={P.cream3} opacity="0.75" />
      <path d="M38 50 Q40 42 60 41" fill="none" stroke={P.white} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      {isStatic ? (
        <StaticScreen id={id} />
      ) : (
        <g>
          <rect x="40" y="48" width="104" height="92" rx="20" fill={P.screen} />
          <path d="M144 70 L144 118 Q144 140 122 140 L64 140 Q128 132 136 110 Q142 90 144 70 Z" fill={P.screenDeep} opacity="0.55" />
        </g>
      )}
      <rect x="40" y="48" width="104" height="92" rx="20" fill="none" stroke={P.ink} strokeWidth="4.5" />
      {!isStatic && (
        <g
          style={{
            transform: `translate(${lx}px, ${ly}px)`,
            transition: "transform 140ms ease-out",
          }}
        >
          {(expression === "happy" || expression === "excited" || expression === "love" || expression === "wink") && (
            <g fill={P.bubblegum} opacity="0.55">
              <ellipse cx="62" cy="108" rx="8" ry="5" />
              <ellipse cx="124" cy="108" rx="8" ry="5" />
            </g>
          )}
          <Eyes expression={expression} closed={closed} />
          <Mouth expression={expression} />
          {expression === "confused" && (
            <text
              x="128"
              y="72"
              fontSize="22"
              fill={P.plum600}
              style={{ fontFamily: "var(--font-luckiest)" }}
            >
              ?
            </text>
          )}
        </g>
      )}
      <path d="M50 58 Q52 52 62 52" fill="none" stroke={P.white} strokeWidth="5" strokeLinecap="round" opacity="0.75" />
      <rect x="40" y="48" width="104" height="92" rx="20" fill={`url(#${id}-scan)`} opacity="0.35" />
      <circle cx="160" cy="62" r="5.5" fill={P.tangerine} stroke={P.ink} strokeWidth="3" />
      <circle cx="160" cy="82" r="5.5" fill={P.mint} stroke={P.ink} strokeWidth="3" />
      <path d="M155 100 L165 100 M155 108 L165 108 M155 116 L165 116" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M60 161 L56 170 M140 161 L144 170" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="22" cy="100" rx="15" ry="26" fill={P.plum500} stroke={P.ink} strokeWidth={S} />
      <ellipse cx="25" cy="100" rx="7" ry="16" fill={P.plum300} />
      <ellipse cx="178" cy="100" rx="15" ry="26" fill={P.plum500} stroke={P.ink} strokeWidth={S} />
      <ellipse cx="175" cy="100" rx="7" ry="16" fill={P.plum600} />
    </g>
  );
}

function Glove({ x, y, flip = false, rotate = 0 }: { x: number; y: number; flip?: boolean; rotate?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${flip ? -1 : 1} 1)`}>
      <path
        d="M-18 6 Q-22 -10 -10 -14 Q-6 -24 4 -20 Q12 -24 16 -14 Q26 -12 22 0 Q22 14 6 16 L-8 16 Q-18 16 -18 6 Z"
        fill={P.sun}
        stroke={P.ink}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path d="M-6 -12 L-4 2 M6 -14 L6 2" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M-14 8 Q2 12 18 6" fill="none" stroke={P.sunDeep} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Body({ pose }: { pose: MascotPose }) {
  return (
    <g>
      <path d="M78 262 L74 284" stroke={P.ink} strokeWidth="9" strokeLinecap="round" />
      <path d="M122 262 L126 284" stroke={P.ink} strokeWidth="9" strokeLinecap="round" />
      <path d="M50 286 Q50 272 72 272 L82 272 Q90 274 88 290 L54 292 Q48 292 50 286 Z" fill={P.tomato} stroke={P.ink} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M150 286 Q150 272 128 272 L118 272 Q110 274 112 290 L146 292 Q152 292 150 286 Z" fill={P.tomato} stroke={P.ink} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M54 286 L86 285 M114 285 L146 286" stroke={P.white} strokeWidth="3" />
      <path
        d="M62 176 Q100 166 138 176 Q152 220 136 262 Q100 272 64 262 Q48 220 62 176 Z"
        fill={P.plum500}
        stroke={P.ink}
        strokeWidth={S}
        strokeLinejoin="round"
      />
      <path d="M128 186 Q140 222 130 256 Q112 262 96 262 Q124 240 128 186 Z" fill={P.plum600} />
      <path d="M86 214 L114 214 L112 236 L88 236 Z" fill={P.plum600} stroke={P.ink} strokeWidth="3.5" strokeLinejoin="round" />
      <text x="100" y="208" textAnchor="middle" fontSize="20" fill={P.sun} stroke={P.ink} strokeWidth="3" paintOrder="stroke" style={{ fontFamily: "var(--font-luckiest)" }}>
        404
      </text>
      {pose === "wave" ? (
        <g>
          <path d="M64 190 Q40 210 46 236" fill="none" stroke={P.ink} strokeWidth="13" strokeLinecap="round" />
          <path d="M64 190 Q40 210 46 236" fill="none" stroke={P.plum500} strokeWidth="6" strokeLinecap="round" />
          <Glove x={48} y={244} rotate={10} />
          <path d="M136 190 Q182 194 194 162" fill="none" stroke={P.ink} strokeWidth="13" strokeLinecap="round" />
          <path d="M136 190 Q182 194 194 162" fill="none" stroke={P.plum500} strokeWidth="6" strokeLinecap="round" />
          <g style={{ transformOrigin: "194px 162px", animation: "wobble 0.9s ease-in-out infinite" }}>
            <Glove x={198} y={150} flip rotate={-14} />
          </g>
        </g>
      ) : pose === "controller" ? (
        <g>
          <path d="M64 192 Q50 220 76 232" fill="none" stroke={P.ink} strokeWidth="13" strokeLinecap="round" />
          <path d="M64 192 Q50 220 76 232" fill="none" stroke={P.plum500} strokeWidth="6" strokeLinecap="round" />
          <path d="M136 192 Q150 220 124 232" fill="none" stroke={P.ink} strokeWidth="13" strokeLinecap="round" />
          <path d="M136 192 Q150 220 124 232" fill="none" stroke={P.plum500} strokeWidth="6" strokeLinecap="round" />
          <path
            d="M58 222 Q56 210 72 210 L128 210 Q144 210 142 222 L146 244 Q148 258 134 256 Q126 254 122 244 L78 244 Q74 254 66 256 Q52 258 54 244 Z"
            fill={P.steel}
            stroke={P.ink}
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <path d="M72 222 L72 234 M66 228 L78 228" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
          <circle cx="122" cy="224" r="4.5" fill={P.tomato} stroke={P.ink} strokeWidth="2.5" />
          <circle cx="132" cy="232" r="4.5" fill={P.sun} stroke={P.ink} strokeWidth="2.5" />
          <path d="M100 210 Q102 196 112 190" fill="none" stroke={P.ink} strokeWidth="3" />
          <Glove x={70} y={236} rotate={-20} />
          <Glove x={130} y={236} flip rotate={20} />
        </g>
      ) : (
        <g>
          <path d="M64 190 Q44 214 52 240" fill="none" stroke={P.ink} strokeWidth="13" strokeLinecap="round" />
          <path d="M64 190 Q44 214 52 240" fill="none" stroke={P.plum500} strokeWidth="6" strokeLinecap="round" />
          <path d="M136 190 Q156 214 148 240" fill="none" stroke={P.ink} strokeWidth="13" strokeLinecap="round" />
          <path d="M136 190 Q156 214 148 240" fill="none" stroke={P.plum500} strokeWidth="6" strokeLinecap="round" />
          <Glove x={54} y={248} rotate={20} />
          <Glove x={146} y={248} flip rotate={-20} />
        </g>
      )}
    </g>
  );
}

export function Mascot404({
  expression = "neutral",
  pose = "head",
  look = { x: 0, y: 0 },
  className,
  title,
  wiggle = 0,
  frame,
}: Props) {
  const raw = useId();
  const id = `m${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const closed = useBlink(expression !== "sleepy" && expression !== "static" && expression !== "dizzy");
  const viewBox =
    pose === "head" ? "0 -6 200 182" : pose === "peek" ? "0 -6 200 200" : "0 -6 200 304";
  return (
    <svg
      viewBox={viewBox}
      className={className}
      {...frame}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      overflow="visible"
    >
      <defs>
        <pattern id={`${id}-scan`} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="1.3" fill={P.ink} opacity="0.25" />
        </pattern>
      </defs>
      {(pose === "full" || pose === "controller" || pose === "wave") && <Body pose={pose} />}
      <Head expression={expression} look={look} closed={closed} id={id} wiggle={wiggle} />
      {pose === "peek" && (
        <g>
          <Glove x={44} y={176} rotate={-8} />
          <Glove x={156} y={176} flip rotate={8} />
        </g>
      )}
    </svg>
  );
}
