import { P } from "@/lib/palette";

const display = { fontFamily: "var(--font-luckiest), 'Arial Black', sans-serif" };

export function Logo({
  className,
  slogan = true,
  title = "CANAL 404",
  label,
}: {
  className?: string;
  slogan?: boolean;
  title?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 360 230"
      className={className}
      role="img"
      aria-label={label ?? (slogan ? `${title} — Desenhos. Jogos. Bagunça.` : title)}
    >
      <path
        d="M30 52 L96 14 L318 22 L346 92 L330 190 L218 214 L40 206 L14 128 Z"
        fill={P.ink}
        transform="translate(6 7)"
      />
      <path
        d="M30 52 L96 14 L318 22 L346 92 L330 190 L218 214 L40 206 L14 128 Z"
        fill={P.plum700}
        stroke={P.ink}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M42 60 L100 28 L300 34" fill="none" stroke={P.plum500} strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      <g transform="rotate(-7 180 70)" style={display}>
        <text x="186" y="94" textAnchor="middle" fontSize="76" fill={P.ink} letterSpacing="2">
          CANAL
        </text>
        <text
          x="182"
          y="88"
          textAnchor="middle"
          fontSize="76"
          fill={P.sun}
          stroke={P.ink}
          strokeWidth="10"
          paintOrder="stroke"
          strokeLinejoin="round"
          letterSpacing="2"
        >
          CANAL
        </text>
      </g>
      <g transform="rotate(-4 190 160)" style={display}>
        <text x="197" y="191" textAnchor="middle" fontSize="128" fill={P.ink} letterSpacing="4">
          404
        </text>
        <text x="193" y="186" textAnchor="middle" fontSize="128" fill={P.tomatoDeep} stroke={P.ink} strokeWidth="12" paintOrder="stroke" strokeLinejoin="round" letterSpacing="4">
          404
        </text>
        <text
          x="190"
          y="182"
          textAnchor="middle"
          fontSize="128"
          fill="#ff6b3d"
          stroke={P.ink}
          strokeWidth="12"
          paintOrder="stroke"
          strokeLinejoin="round"
          letterSpacing="4"
        >
          404
        </text>
        <path d="M120 112 q6 -6 14 -4" stroke={P.white} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8" />
      </g>
      <g transform="translate(36 70) rotate(-12)">
        <path
          d="M0 -30 L9 -9 L31 -8 L14 6 L20 28 L0 15 L-20 28 L-14 6 L-31 -8 L-9 -9 Z"
          fill={P.sun}
          stroke={P.ink}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <circle cx="-5" cy="-3" r="2.6" fill={P.ink} />
        <circle cx="6" cy="-3" r="2.6" fill={P.ink} />
      </g>
      {slogan && (
        <g transform="rotate(-2.5 180 212)">
          <path d="M62 196 L304 190 L310 222 L56 228 Z" fill={P.ink} transform="translate(3 4)" />
          <path d="M62 196 L304 190 L310 222 L56 228 Z" fill={P.cream} stroke={P.ink} strokeWidth="4" strokeLinejoin="round" />
          <text
            x="183"
            y="216"
            textAnchor="middle"
            fontSize="17"
            fill={P.ink}
            style={display}
            letterSpacing="1.2"
          >
            DESENHOS. JOGOS. BAGUNÇA.
          </text>
        </g>
      )}
    </svg>
  );
}
