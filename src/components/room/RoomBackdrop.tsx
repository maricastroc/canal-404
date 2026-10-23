import { P } from "@/lib/palette";

const ink = { stroke: P.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Wainscot() {
  const panels = Array.from({ length: 30 }, (_, i) => -1600 + i * 170);
  return (
    <g>
      <rect x="-1600" y="575" width="4800" height="130" fill="#5c2f22" />
      {panels.map((x) => (
        <g key={x}>
          <rect x={x + 18} y="598" width="134" height="82" rx="6" fill="#6d3a28" stroke="#3f2015" strokeWidth="4" />
          <path d={`M${x + 24} 604 L${x + 146} 604`} stroke="#8a4f33" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      <rect x="-1600" y="566" width="4800" height="18" fill="#8a4f30" stroke={P.ink} strokeWidth="4" />
      <rect x="-1600" y="694" width="4800" height="14" fill="#3f2015" />
    </g>
  );
}

function Floor() {
  const rows = [730, 772, 822, 882, 950];
  return (
    <g>
      <rect x="-1600" y="705" width="4800" height="1200" fill={P.floor} />
      {rows.map((y, r) => (
        <g key={y}>
          <path d={`M-1600 ${y} L3200 ${y}`} stroke={P.floorDeep} strokeWidth="4" />
          {Array.from({ length: 24 }, (_, i) => -1600 + i * 210 + (r % 2) * 105).map((x) => (
            <path key={x} d={`M${x} ${y} L${x - 6} ${rows[r + 1] ?? y + 70}`} stroke={P.floorDeep} strokeWidth="3" opacity="0.7" />
          ))}
        </g>
      ))}
      <rect x="-1600" y="705" width="4800" height="28" fill="#000" opacity="0.18" />
    </g>
  );
}

function Rug() {
  return (
    <g>
      <ellipse cx="858" cy="846" rx="452" ry="74" fill={P.ink} opacity="0.35" />
      <ellipse cx="850" cy="838" rx="450" ry="72" fill={P.plum600} {...ink} />
      <ellipse cx="850" cy="838" rx="380" ry="56" fill="none" stroke={P.tangerine} strokeWidth="16" />
      <ellipse cx="850" cy="838" rx="300" ry="42" fill={P.plum500} stroke={P.mint} strokeWidth="12" />
      <ellipse cx="850" cy="838" rx="190" ry="24" fill="none" stroke={P.sun} strokeWidth="10" strokeDasharray="22 16" />
      {Array.from({ length: 34 }, (_, i) => 420 + i * 26).map((x) => (
        <path key={x} d={`M${x} ${905 - Math.abs(x - 850) * 0.03} l-2 14`} stroke={P.cream2} strokeWidth="4" strokeLinecap="round" />
      ))}
    </g>
  );
}

function Dresser() {
  return (
    <g>
      <path d="M326 566 L566 566 L560 808 L332 808 Z" fill={P.ink} transform="translate(8 6)" opacity="0.4" />
      <rect x="326" y="560" width="240" height="250" rx="10" fill={P.woodDeep} {...ink} />
      <rect x="316" y="548" width="260" height="24" rx="8" fill={P.wood} {...ink} />
      {[588, 660, 732].map((y) => (
        <g key={y}>
          <rect x="344" y={y} width="204" height="60" rx="8" fill={P.wood} stroke={P.ink} strokeWidth="4" />
          <path d={`M352 ${y + 8} L540 ${y + 8}`} stroke="#c98352" strokeWidth="4" strokeLinecap="round" />
          <rect x="426" y={y + 24} width="40" height="12" rx="6" fill={P.sun} stroke={P.ink} strokeWidth="3.5" />
        </g>
      ))}
      <rect x="338" y="800" width="20" height="18" fill={P.woodDark} stroke={P.ink} strokeWidth="4" />
      <rect x="534" y="800" width="20" height="18" fill={P.woodDark} stroke={P.ink} strokeWidth="4" />
      <path d="M380 598 l14 -8 M500 670 l-12 6" stroke="#e7a874" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </g>
  );
}

function Plant() {
  return (
    <g>
      <g fill={P.leaf} {...ink}>
        <path d="M262 712 Q200 640 214 560 Q252 610 268 700 Z" />
        <path d="M270 708 Q250 600 300 520 Q312 610 282 708 Z" />
        <path d="M282 712 Q330 640 356 610 Q352 676 292 716 Z" />
        <path d="M266 716 Q206 700 176 650 Q236 650 272 704 Z" />
      </g>
      <g fill="none" stroke={P.leafDeep} strokeWidth="4" strokeLinecap="round">
        <path d="M228 590 Q246 640 262 700" />
        <path d="M296 548 Q284 620 276 700" />
        <path d="M340 626 Q310 670 288 708" />
      </g>
      <path d="M232 708 L320 708 L308 800 L244 800 Z" fill={P.tomato} {...ink} />
      <path d="M226 700 L326 700 L326 722 L226 722 Z" fill={P.tomatoDeep} {...ink} />
      <path d="M246 740 Q276 752 306 740" stroke={P.sun} strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  );
}

function TvCabinet() {
  return (
    <g>
      <path d="M576 650 L1110 650 L1104 818 L582 818 Z" fill={P.ink} transform="translate(10 8)" opacity="0.4" />
      <rect x="572" y="640" width="540" height="176" rx="12" fill={P.woodDeep} {...ink} />
      <rect x="560" y="626" width="564" height="26" rx="8" fill={P.wood} {...ink} />
      <rect x="592" y="672" width="240" height="118" rx="8" fill={P.woodDark} stroke={P.ink} strokeWidth="4" />
      <rect x="852" y="672" width="240" height="118" rx="8" fill={P.woodDark} stroke={P.ink} strokeWidth="4" />
      <rect x="604" y="700" width="216" height="52" rx="6" fill={P.inkSoft} stroke={P.ink} strokeWidth="4" />
      <rect x="616" y="712" width="120" height="12" rx="3" fill={P.ink} />
      <rect x="616" y="730" width="70" height="8" rx="3" fill={P.plum500} />
      <circle cx="770" cy="726" r="9" fill={P.tomato} stroke={P.ink} strokeWidth="3" />
      <circle cx="798" cy="726" r="9" fill={P.steel} stroke={P.ink} strokeWidth="3" />
      <text x="616" y="770" fontSize="16" fill={P.cream2} style={{ fontFamily: "var(--font-luckiest)" }} letterSpacing="2">
        VIDEO-404
      </text>
      <rect x="590" y="812" width="24" height="14" fill={P.woodDark} stroke={P.ink} strokeWidth="4" />
      <rect x="1070" y="812" width="24" height="14" fill={P.woodDark} stroke={P.ink} strokeWidth="4" />
    </g>
  );
}

function Shelf() {
  return (
    <g>
      <rect x="1166" y="168" width="290" height="18" rx="5" fill={P.wood} {...ink} />
      <path d="M1196 186 L1196 214 L1222 186 Z" fill={P.woodDeep} {...ink} />
      <path d="M1426 186 L1426 214 L1400 186 Z" fill={P.woodDeep} {...ink} />
      <g>
        <path d="M1372 168 L1378 126 L1430 126 L1436 168 Z" fill={P.mint} {...ink} />
        <g fill={P.lime} {...ink} strokeWidth={4}>
          <path d="M1404 126 Q1376 92 1362 70 Q1398 80 1408 124 Z" />
          <path d="M1404 126 Q1414 80 1440 62 Q1442 100 1410 128 Z" />
          <path d="M1404 126 Q1402 90 1398 58 Q1420 84 1410 126 Z" />
        </g>
      </g>
      <g>
        <rect x="1300" y="110" width="22" height="58" fill={P.sky} {...ink} strokeWidth={4} />
        <rect x="1322" y="104" width="20" height="64" fill={P.bubblegum} {...ink} strokeWidth={4} />
        <rect x="1342" y="118" width="18" height="50" fill={P.sun} {...ink} strokeWidth={4} transform="rotate(10 1351 168)" />
      </g>
    </g>
  );
}

function Doodles() {
  return (
    <g>
      <g transform="translate(1112 214) rotate(-6 384 252)">
        <rect x="330" y="190" width="110" height="128" fill={P.paper} {...ink} strokeWidth={4} />
        <path d="M352 236 Q360 214 384 214 Q410 214 414 238 L414 282 Q414 300 394 300 L370 300 Q350 300 350 280 Z" fill={P.screen} stroke={P.ink} strokeWidth="3.5" />
        <circle cx="372" cy="250" r="5" fill={P.ink} />
        <circle cx="394" cy="250" r="5" fill={P.ink} />
        <path d="M370 270 Q382 282 396 270" stroke={P.ink} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M376 214 L366 198 M392 214 L402 198" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
        <text x="352" y="312" fontSize="12" fill={P.tomato} style={{ fontFamily: "var(--font-patrick)" }}>
          por: Lina, 8 anos
        </text>
        <circle cx="385" cy="196" r="6" fill={P.tomato} stroke={P.ink} strokeWidth="3" />
      </g>
      <g transform="translate(1066 230) rotate(5 470 340)">
        <rect x="430" y="300" width="84" height="70" fill={P.sunPale} {...ink} strokeWidth={4} />
        <path d="M444 352 L466 322 L480 342 L490 330 L504 352 Z" fill={P.lime} stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="494" cy="318" r="8" fill={P.tangerine} stroke={P.ink} strokeWidth="3" />
        <circle cx="472" cy="304" r="5" fill={P.sky} stroke={P.ink} strokeWidth="3" />
      </g>
    </g>
  );
}

function Outlet() {
  return (
    <g>
      <rect x="1110" y="470" width="34" height="46" rx="6" fill={P.cream} stroke={P.ink} strokeWidth="4" />
      <path d="M1121 484 L1121 492 M1133 484 L1133 492 M1121 502 L1133 502" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M1127 516 Q1126 560 1100 600 Q1080 630 1100 660" fill="none" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

function Cables() {
  return (
    <g fill="none" strokeLinecap="round">
      <path d="M780 652 Q760 760 812 830" stroke={P.ink} strokeWidth="7" />
      <path d="M780 652 Q760 760 812 830" stroke={P.steelDeep} strokeWidth="3" />
      <path d="M800 652 Q840 770 888 838" stroke={P.ink} strokeWidth="7" />
      <path d="M800 652 Q840 770 888 838" stroke={P.tomatoDeep} strokeWidth="3" />
    </g>
  );
}

function StarStickers() {
  const stars = [
    [480, 70, 0.8],
    [1120, 40, 1],
    [1500, 420, 0.7],
    [210, 470, 0.9],
    [1060, 120, 0.6],
  ] as const;
  return (
    <g opacity="0.55">
      {stars.map(([x, y, s]) => (
        <path
          key={`${x}-${y}`}
          transform={`translate(${x} ${y}) scale(${s})`}
          d="M0 -14 L4 -4 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -4 Z"
          fill={P.cream2}
          stroke={P.ink}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

export function RoomBackdrop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 900" className={className} overflow="visible" aria-hidden>
      <defs>
        <pattern id="wallpaper" width="64" height="64" patternUnits="userSpaceOnUse">
          <rect width="64" height="64" fill={P.wall} />
          <rect width="32" height="64" fill="#743b45" />
          <path d="M48 14 l4 6 l-4 6 l-4 -6 Z" fill="#83474f" />
          <circle cx="16" cy="46" r="2.5" fill="#83474f" />
        </pattern>
        <radialGradient id="lamp-pool" cx="630" cy="120" r="980" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#ff9a5a" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ff9a5a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="-1600" y="-1200" width="4800" height="1800" fill="url(#wallpaper)" />
      <rect x="-1600" y="-1200" width="4800" height="1218" fill={P.wallDeep} />
      <path d="M-1600 18 L3200 18" stroke={P.ink} strokeWidth="6" />
      <rect x="-1600" y="18" width="4800" height="14" fill="#3a1a2a" opacity="0.6" />
      <StarStickers />
      <Wainscot />
      <Floor />
      <rect x="-1600" y="-1200" width="4800" height="2400" fill="url(#lamp-pool)" />
      <Doodles />
      <Shelf />
      <Outlet />
      <Rug />
      <TvCabinet />
      <Cables />
      <Dresser />
      <Plant />
    </svg>
  );
}
