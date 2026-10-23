import { P } from "@/lib/palette";

export const TV_SCREEN = { x: 50, y: 58, w: 294, h: 246 };
export const TV_KNOB = { cx: 412, cy: 108, r: 32 };
export const TV_BOX = { w: 480, h: 400 };

export function TvSet({ glow }: { glow?: boolean }) {
  return (
    <svg viewBox="0 0 480 400" className="h-full w-full" overflow="visible" aria-hidden>
      <g>
        <path d="M410 22 L452 -46" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
        <path d="M398 24 L366 -40" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
        <circle cx="453" cy="-48" r="7" fill={P.steel} stroke={P.ink} strokeWidth="4" />
        <circle cx="365" cy="-42" r="7" fill={P.steel} stroke={P.ink} strokeWidth="4" />
        <path d="M384 24 Q404 6 424 24 Z" fill={P.inkSoft} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
      </g>
      <path d="M72 22 L430 22 Q476 22 476 68 L476 348 Q476 394 430 394 L72 394 Q26 394 26 348 L26 68 Q26 22 72 22 Z" fill={P.ink} opacity="0.45" />
      <g>
        <path d="M70 384 L60 400 L104 400 L110 384 Z" fill={P.woodDark} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
        <path d="M370 384 L376 400 L420 400 L410 384 Z" fill={P.woodDark} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
        <path
          d="M62 14 L420 14 Q466 14 466 60 L466 340 Q466 386 420 386 L62 386 Q16 386 16 340 L16 60 Q16 14 62 14 Z"
          fill="#9c5b36"
          stroke={P.ink}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path d="M444 40 Q458 60 458 100 L458 330 Q458 372 418 376 L80 378 Q420 360 438 320 Q450 200 444 40 Z" fill="#7c4527" opacity="0.8" />
        <path d="M44 30 Q60 24 120 24 L380 24" fill="none" stroke="#c98352" strokeWidth="6" strokeLinecap="round" />
        <path d="M120 360 Q200 364 300 360" fill="none" stroke="#c98352" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <rect x="34" y="40" width="326" height="312" rx="46" fill={P.plum900} stroke={P.ink} strokeWidth="5" />
        <rect x="42" y="48" width="310" height="264" rx="40" fill={P.plum950} />
        <rect
          x={TV_SCREEN.x}
          y={TV_SCREEN.y}
          width={TV_SCREEN.w}
          height={TV_SCREEN.h}
          rx="34"
          fill={glow ? P.screen : "#173a3a"}
          stroke={P.ink}
          strokeWidth="4"
        />
        <text
          x="197"
          y="336"
          textAnchor="middle"
          fontSize="17"
          letterSpacing="3"
          fill={P.cream3}
          style={{ fontFamily: "var(--font-luckiest)" }}
        >
          404·VISION
        </text>
        <circle cx="96" cy="330" r="5" fill={P.tomato} stroke={P.ink} strokeWidth="2.5" />
        <rect x="374" y="42" width="78" height="310" rx="18" fill="#6d3a22" stroke={P.ink} strokeWidth="5" />
        <circle cx={TV_KNOB.cx} cy={TV_KNOB.cy} r="38" fill={P.woodDark} stroke={P.ink} strokeWidth="4" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          return (
            <circle
              key={i}
              cx={Math.round((TV_KNOB.cx + Math.cos(a) * 34) * 10) / 10}
              cy={Math.round((TV_KNOB.cy + Math.sin(a) * 34) * 10) / 10}
              r="2.2"
              fill={P.cream2}
            />
          );
        })}
        <circle cx="412" cy="186" r="20" fill={P.cream2} stroke={P.ink} strokeWidth="4.5" />
        <path d="M412 186 L424 176" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
        {[226, 240, 254, 268, 282, 296, 310, 324].map((y) => (
          <path key={y} d={`M390 ${y} L436 ${y}`} stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
        ))}
      </g>
    </svg>
  );
}

export function TvKnob({ angle }: { angle: number }) {
  return (
    <svg viewBox="-36 -36 72 72" className="h-full w-full" aria-hidden>
      <g style={{ transform: `rotate(${angle}deg)`, transition: "transform 260ms cubic-bezier(.3,1.6,.5,1)" }}>
        <circle r="28" fill={P.cream} stroke={P.ink} strokeWidth="4.5" />
        <circle r="20" fill={P.cream2} />
        <rect x="-5" y="-27" width="10" height="34" rx="5" fill={P.tomato} stroke={P.ink} strokeWidth="3.5" />
        <path d="M-14 -10 Q-12 -18 -4 -21" stroke={P.white} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      </g>
    </svg>
  );
}
